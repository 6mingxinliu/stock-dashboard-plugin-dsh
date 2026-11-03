# -*- coding: utf-8 -*-
"""
tdx_bridge.py — A股短线看板本地数据桥接
========================================

把通达信 TdxAiData（tqs）行情接口包装成本地 HTTP 服务，供 DeepSeek Harness
「短线看板」插件（浏览器端）通过 http://127.0.0.1:7350 访问。

用法：
  1. 按 tdx-aidata Skill 的「安装」章节准备好运行目录（含 tdxaidata.py、
     TdxAiData.dll、TdxAiData.ini 等 7 个文件），并在 TdxAiData.ini 的
     [Token] 节配置 token= 与 user=。
  2. 在本文件同目录放置 TDXAIDATA_DIR.txt（内容为上述目录的绝对路径），
     或设置环境变量 TDXAIDATA_DIR；也可用 --dir 参数指定。
  3. python tdx_bridge.py [--port 7350]

接口契约（与插件 client.js 数据层一致）：
  GET  /health                      -> {ok, mode, tokenSet}
  GET  /config                      -> {ok, tokenMasked, iniPath}
  POST /config   {token}            -> {ok, needRestart}（写回 TdxAiData.ini）
  POST /shutdown                    -> {ok}（0.3s 后进程退出，看板自动重拉）
  GET  /indices                     -> [{code,name,now,preclose,pct}]
  GET  /rank/speed?n=50             -> [{code,name,now,pct,speed,amount,turnover}]
  GET  /rank/zt?n=50                -> [{code,name,now,pct,days,firstTime,openTimes,sealAmount}]
  GET  /rank/sectors?n=10           -> [{name,pct,leader,leaderPct}]
  GET  /rank/hot?n=10               -> [{code,name,now,pct,speed,amount,turnover}]
  GET  /snapshot?codes=A,B          -> [{code,name,now,preclose,pct,speed,amount,turnover}]
  GET  /kline?code=X&count=120      -> [{date,open,high,low,close,volume}]
  GET  /minute?code=X               -> [{time,price,avg,vol}]

说明：
  * /rank/speed 的 speed 为通达信服务端「涨速」栏目（Zangsu）。
  * get_zdt_data 需要通达信客户端短线宝权限；无权限时涨停榜自动退化为
    排名行情数据（连板数 + 封单额，无首板时间/开板次数）。
  * 所有 tqs 调用串行化（锁），新版本接口错误时返回空值，桥接逐字段容错。
"""

import argparse
import configparser
import http.cookiejar
import json
import os
import re
import sys
import threading
import time
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote

# pythonw 无控制台：sys.stdout/stderr 为 None，第三方库（如 akshare 的 tqdm）写 stderr 会抛
# AttributeError → 统一指到 devnull，保证桥接与 AKShare 在无窗口模式下可用。
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

HERE = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# tqs 接入（遵循 tdx-aidata Skill 的标准接入代码与强制检查流程）
# ---------------------------------------------------------------------------
INI_PATH = None  # 由 bootstrap_tqs 填充
_SERVER = None   # 由 main() 填充，供 /shutdown 优雅退出


def bootstrap_tqs():
    global INI_PATH
    dir_file = HERE / "TDXAIDATA_DIR.txt"
    tdx_dir = Path(sys.argv[sys.argv.index("--dir") + 1]) if "--dir" in sys.argv else None
    if tdx_dir is None:
        import os
        env = os.environ.get("TDXAIDATA_DIR")
        tdx_dir = Path(env) if env else (Path(dir_file.read_text(encoding="utf-8").strip()) if dir_file.is_file() else None)
    if tdx_dir is None or not tdx_dir.is_dir():
        raise SystemExit(
            "未找到 TdxAiData 目录：请放置 TDXAIDATA_DIR.txt、设置环境变量 TDXAIDATA_DIR，"
            "或使用 --dir 参数指定包含 tdxaidata.py / TdxAiData.dll / TdxAiData.ini 的目录。"
        )
    ini_path = None
    for cand in (tdx_dir / "TdxAiData.ini", tdx_dir / "lib" / "TdxAiData.ini",
                 tdx_dir / "tdxaidata" / "lib" / "TdxAiData.ini"):
        if cand.is_file():
            ini_path = cand
            break
    INI_PATH = ini_path
    token = ""
    if ini_path:
        ini = configparser.ConfigParser()
        ini.read(ini_path, encoding="utf-8")
        token = ini.get("Token", "token", fallback="").strip() if ini.has_section("Token") else ""
    if not token:
        print("[警告] 未在 TdxAiData.ini 找到 token，行情请求将认证失败；"
              "请在 [Token] 节填写 token=（通达信商城 → 会员中心 → 积分和Key管理）")
    if str(tdx_dir) not in sys.path:
        sys.path.insert(0, str(tdx_dir))
    from tdxaidata import tqs  # noqa: E402
    return tqs


TQS = bootstrap_tqs()
TQS_LOCK = threading.Lock()
HAVE_PANDAS = True
try:
    import pandas  # noqa: F401
except ImportError:
    HAVE_PANDAS = False


def to_float(v, default=None):
    try:
        if v is None or v == "":
            return default
        return float(v)
    except (TypeError, ValueError):
        return default


def rows_of(result):
    """把 tqs 返回（DataFrame / dict / list）统一为 list[dict]。"""
    if result is None:
        return []
    if HAVE_PANDAS and hasattr(result, "to_dict"):
        try:
            return [{k: (v.iloc[i] if hasattr(v, "iloc") else v) for k, v in dict(row).items()}
                    for i, row in enumerate(result.to_dict("records"))]
        except Exception:
            return []
    if isinstance(result, dict):
        # {列名: [值...]} 同构字典
        vals = [v for v in result.values() if isinstance(v, list)]
        if vals and all(isinstance(v, list) for v in result.values()):
            keys = list(result.keys())
            n = min(len(v) for v in vals)
            return [{k: result[k][i] for k in keys} for i in range(n)]
        return [result]
    if isinstance(result, list):
        return [r for r in result if isinstance(r, dict)]
    return []


def num(row, *keys, default=None):
    for k in keys:
        if k in row:
            f = to_float(row.get(k))
            if f is not None:
                return f
    return default


# 简单 TTL 缓存：显著降低 4s 轮询与批量预取对 DLL/服务端的压力
_CACHE = {}
def cached(key, ttl, fn):
    now = time.time()
    hit = _CACHE.get(key)
    if hit is not None and now - hit[0] < ttl:
        return hit[1]
    val = fn()
    _CACHE[key] = (now, val)
    if len(_CACHE) > 800:
        for k in list(_CACHE.keys())[:300]:
            _CACHE.pop(k, None)
    return val


# ---------------------------------------------------------------------------
# 接口实现
# ---------------------------------------------------------------------------
INDEX_CODES = ["000001.SH", "399001.SZ", "399006.SZ", "000688.SH"]
INDEX_NAMES = {"000001.SH": "上证指数", "399001.SZ": "深证成指", "399006.SZ": "创业板指", "000688.SH": "科创50"}


def h_global():
    """市场宽度统计：涨跌家数、涨停/跌停/炸板、最高连板、沪深成交额。"""
    with TQS_LOCK:
        raw = TQS.get_global_data(type=0)
    if not isinstance(raw, dict) or not raw:
        return {}
    def i(key):
        return int(to_float(raw.get(key), 0) or 0)
    amount = (to_float(raw.get("A999999_Amo"), 0) or 0) + (to_float(raw.get("A399001_Amo"), 0) or 0)
    return {
        "up": i("UpNum"), "down": i("DownNum"), "flat": i("LevelNum"),
        "zt": i("ZtNum"), "dt": i("DtNum"), "zhaban": i("EverZTNum"),
        "lb": i("LBNum"), "maxLb": i("MaxLBDay"),
        "amount": amount * 1e4,  # 万元 -> 元
    }


def frame_series(raw, code, fields):
    """从 get_market_data 返回中提取单只股票的字段序列。

    返回 {字段: [(时间标签, float 值), ...]}；兼容 pandas DataFrame（行=时间、列=代码）
    与无 pandas 时的 {字段: {code: [values]}} / {字段: [values]} 结构。
    """
    out = {}
    if not isinstance(raw, dict):
        return out
    for f in fields:
        block = raw.get(f)
        idx, vals = None, None
        if block is not None and hasattr(block, "columns"):  # DataFrame
            try:
                col = block[code] if code in getattr(block, "columns", []) else block.iloc[:, 0]
                vals = list(col)
                idx = [str(i) for i in list(col.index)]
            except Exception:
                continue
        elif isinstance(block, dict):
            col = block.get(code)
            if col is None and len(block) == 1:
                col = next(iter(block.values()))
            if isinstance(col, (list, tuple)):
                vals = list(col)
                idx = [str(i) for i in range(len(col))]
        elif isinstance(block, (list, tuple)):
            vals = list(block)
            idx = [str(i) for i in range(len(block))]
        if vals is None:
            continue
        pairs = [(idx[i], to_float(v)) for i, v in enumerate(vals) if to_float(v) is not None] if idx else []
        if pairs:
            out[f] = pairs
    return out


def h_indices():
    def series_of(code):
        try:
            with TQS_LOCK:
                raw = TQS.get_market_data(field_list=["Close"], stock_list=[code], period="1m", count=32)
            pairs = frame_series(raw, code, ["Close"]).get("Close") or []
            vals = [v for _, v in pairs]
            if len(vals) >= 2:
                return vals[-32:]
        except Exception:
            pass
        return None

    with TQS_LOCK:
        raw = TQS.get_market_snapshot_batch(list(INDEX_CODES))
    out = []
    for code in INDEX_CODES:
        row = (raw or {}).get(code) if isinstance(raw, dict) else None
        if not row and isinstance(raw, dict) and raw.get("Now") is not None and len(INDEX_CODES) == 1:
            row = raw  # 单只时 get_market_snapshot 返回平铺字段
        now = num(row or {}, "Now", "NowPrice", "NewPrice")
        pre = num(row or {}, "LastClose", "Close", "PreClose", "Preclose")
        if now is None:
            continue
        pct = num(row or {}, "ZAF")
        if pct is None and pre:
            pct = (now - pre) / pre * 100
        out.append({
            "code": code,
            "name": INDEX_NAMES.get(code, code),
            "now": now,
            "preclose": pre if pre else now,
            "pct": pct if pct is not None else 0,
            "series": series_of(code),
        })
    return out


def h_rank_speed(n):
    with TQS_LOCK:
        raw = TQS.get_domain_sorthq(domain=6, colname="Zangsu", sorttype=1, wantnum=n,
                                    wantcol=["ZAF", "Amount", "fHSL"])
    out = []
    for r in rows_of(raw):
        now = num(r, "Now")
        close = num(r, "Close")
        pct = num(r, "ZAF")
        if pct is None and now is not None and close:
            pct = (now - close) / close * 100
        out.append({
            "code": r.get("Code"), "name": r.get("Name"), "now": now,
            "pct": pct, "speed": num(r, "Zangsu", "CurCol"),
            "amount": (num(r, "Amount") or 0) * 1e4,  # 万元 -> 元
            "turnover": num(r, "fHSL"),
        })
    return out


def h_rank_zt(n):
    with TQS_LOCK:
        raw = TQS.get_domain_sorthq(domain=6, colname="ZTDateNum", sorttype=1, wantnum=n,
                                    wantcol=["FCAmo", "ZAF"])
        rows = rows_of(raw)
        codes = [r.get("Code") for r in rows if r.get("Code")]
        zdt = TQS.get_zdt_data(list(codes)) if codes else None
    zdt_map = zdt if isinstance(zdt, dict) else {}
    out = []
    for r in rows:
        days = num(r, "ZTDateNum", "CurCol")
        if not days or days < 1:
            continue
        now = num(r, "Now")
        close = num(r, "Close")
        pct = num(r, "ZAF")
        if pct is None and now is not None and close:
            pct = (now - close) / close * 100
        info = zdt_map.get(r.get("Code"), {}) if isinstance(zdt_map, dict) else {}
        out.append({
            "code": r.get("Code"), "name": r.get("Name"), "now": now, "pct": pct,
            "days": int(days),
            "firstTime": str(info.get("FirstTimeZT") or "--"),
            "openTimes": int(to_float(info.get("OpenTimesZT"), 0) or 0),
            "sealAmount": (num(r, "FCAmo") or num(info, "FDVolMaxZT") or 0) * 1e4,  # 万元 -> 元
        })
    return out


_AK_SECTORS = {"data": None, "ts": 0.0, "lock": threading.Lock()}
AK_SECTORS_TTL = 300.0


def _ak_sector_rows():
    """AKShare 东财行业+概念板块全表（惰性 import；两个全表分页约 15s），按涨跌幅降序取前 12。"""
    try:
        import akshare as ak
    except Exception as exc:
        try:
            (HERE / "ak_err.log").write_text("import: " + repr(exc), encoding="utf-8")
        except Exception:
            pass
        raise
    out = []
    for fn, kind in (("stock_board_industry_name_em", "行业"), ("stock_board_concept_name_em", "概念")):
        try:
            df = getattr(ak, fn)()
        except Exception as exc:
            try:
                with open(HERE / "ak_err.log", "a", encoding="utf-8") as f:
                    f.write("\n" + fn + ": " + repr(exc)[:500])
            except Exception:
                pass
            continue
        if df is None or getattr(df, "empty", True):
            continue
        for _, r in df.iterrows():
            pct = to_float(r.get("涨跌幅"))
            name = str(r.get("板块名称") or "").strip()
            if pct is None or not name:
                continue
            out.append({"name": name, "pct": pct, "kind": kind,
                        "leader": str(r.get("领涨股票") or "") or "",
                        "leaderPct": to_float(r.get("领涨股票-涨跌幅"))})
    out.sort(key=lambda x: x["pct"], reverse=True)
    return out[:12]


def h_rank_sectors_tdx(n):
    """TDX 回退：domain=10004 涨幅榜（AKShare 不可用时）。"""
    with TQS_LOCK:
        raw = TQS.get_domain_sorthq(domain=10004, colname="ZAF", sorttype=1, wantnum=n)
    out = []
    for r in rows_of(raw):
        pct = num(r, "ZAF")
        if pct is None:
            continue
        out.append({"name": r.get("Name") or r.get("Code"), "pct": pct,
                    "leader": "", "leaderPct": None, "kind": ""})
    return out


def h_rank_sectors(n):
    """热门板块与概念：AKShare（行业+概念合并，300s TTL）→ 失败回退 TDX。"""
    c = _AK_SECTORS
    now = time.time()
    if c["data"] is not None and now - c["ts"] < AK_SECTORS_TTL:
        return c["data"][:n]
    with c["lock"]:
        now = time.time()
        if c["data"] is not None and now - c["ts"] < AK_SECTORS_TTL:
            return c["data"][:n]
        try:
            data = _ak_sector_rows()
            if data:
                c["data"] = data
                c["ts"] = time.time()
        except Exception:
            pass
    if c["data"]:
        return c["data"][:n]
    return h_rank_sectors_tdx(n)


def h_rank_hot(n):
    with TQS_LOCK:
        raw = TQS.get_domain_sorthq(domain=6, colname="Amount", sorttype=1, wantnum=n,
                                    wantcol=["ZAF", "fHSL"])
    out = []
    for r in rows_of(raw):
        now = num(r, "Now")
        close = num(r, "Close")
        pct = num(r, "ZAF")
        if pct is None and now is not None and close:
            pct = (now - close) / close * 100
        out.append({
            "code": r.get("Code"), "name": r.get("Name"), "now": now, "pct": pct,
            "speed": None, "amount": (num(r, "Amount", "CurCol") or 0) * 1e4,
            "turnover": num(r, "fHSL"),
        })
    return out


def h_snapshot(codes):
    if not codes:
        return []
    with TQS_LOCK:
        raw = TQS.get_market_snapshot_batch(list(codes))
        names = {}
        try:
            infos = TQS.get_stock_info_batch(list(codes)) or {}
            if isinstance(infos, dict):
                names = {c: (r or {}).get("Name") for c, r in infos.items() if isinstance(r, dict)}
        except Exception:
            names = {}
    out = []
    for code in codes:
        row = (raw or {}).get(code) if isinstance(raw, dict) else None
        if not row and isinstance(raw, dict) and raw.get("Now") is not None and len(codes) == 1:
            row = raw  # 单只时退化为平铺字段
        if not row:
            continue
        now = num(row, "Now", "NowPrice", "NewPrice")
        pre = num(row, "LastClose", "Close", "PreClose", "Preclose")
        pct = num(row, "ZAF")
        if pct is None and now is not None and pre:
            pct = (now - pre) / pre * 100
        out.append({
            "code": code, "name": names.get(code) or row.get("Name") or code, "now": now,
            "preclose": pre, "pct": pct,
            "speed": num(row, "Zangsu"),
            "amount": (num(row, "Amount") or 0) * 1e4,  # 万元 -> 元
            "turnover": None,  # 快照无换手率字段，显示 --
        })
    return out


def h_kline(code, count):
    with TQS_LOCK:
        raw = TQS.get_market_data(field_list=["Open", "High", "Low", "Close", "Volume"],
                                  stock_list=[code], period="1d", count=count)
    frames = frame_series(raw, code, ["Open", "High", "Low", "Close", "Volume"])
    if not frames:
        return []
    n = min(len(v) for v in frames.values())
    bars = []
    for i in range(max(0, n - count), n):
        bars.append({
            "date": frames["Close"][i][0][:10],
            "open": frames["Open"][i][1],
            "high": frames["High"][i][1],
            "low": frames["Low"][i][1],
            "close": frames["Close"][i][1],
            "volume": frames["Volume"][i][1] or 0,
        })
    return bars


def h_minute(code):
    with TQS_LOCK:
        raw = TQS.get_market_data(field_list=["Close", "Volume"], stock_list=[code],
                                  period="1m", count=241)
    frames = frame_series(raw, code, ["Close", "Volume"])
    if "Close" not in frames:
        return []
    closes = frames["Close"]
    vols = {label: v for label, v in frames.get("Volume", [])}
    # 关键修复：241 根窗口在盘中会跨日（含昨日尾段）——按日期分组取「最近交易日」，
    # 时间升序；均价只按当日累计，避免昨日数据污染基线与固定时间轴映射。
    groups = {}
    for label, price in closes:
        parts = str(label).split(" ")
        day = parts[0] if len(parts) >= 2 else None
        if day is None:
            continue
        groups.setdefault(day, []).append((str(label), price))
    if not groups:
        return []
    latest_day = max(groups.keys())
    bars = sorted(groups[latest_day], key=lambda b: b[0])
    pts = []
    csum = 0.0
    for i, (label, price) in enumerate(bars):
        csum += price
        t = label[-8:-3] if len(label) >= 8 else label[-6:]
        pts.append({"time": t, "price": price, "avg": csum / (i + 1), "vol": vols.get(label, 0) or 0})
    return pts


def h_minute_batch(codes):
    """批量分时（供列表内嵌迷你分时图预取）；单只带 60s TTL 缓存。"""
    out = {}
    for c in codes[:12]:
        out[c] = cached("minute:" + c, 60, lambda c=c: h_minute(c))
    return out


# ---------------------------------------------------------------------------
# Token 配置（供看板设置弹窗在线修改 TdxAiData.ini）
# ---------------------------------------------------------------------------
def token_of():
    if not INI_PATH:
        return ""
    try:
        ini = configparser.ConfigParser()
        ini.read(str(INI_PATH), encoding="utf-8")
        return ini.get("Token", "token", fallback="").strip() if ini.has_section("Token") else ""
    except Exception:
        return ""


def save_token(token):
    """把新 token 写回 TdxAiData.ini 的 [Token] 节，保留其它节与键。"""
    if not INI_PATH:
        raise RuntimeError("未定位到 TdxAiData.ini")
    token = str(token or "").strip()
    if not token:
        raise ValueError("token 不能为空")
    ini = configparser.ConfigParser()
    ini.read(str(INI_PATH), encoding="utf-8")
    if not ini.has_section("Token"):
        ini.add_section("Token")
    ini.set("Token", "token", token)
    with open(str(INI_PATH), "w", encoding="utf-8") as f:
        ini.write(f)
    return True


def mask_token(token):
    if not token:
        return ""
    if len(token) <= 8:
        return token[:2] + "****"
    return token[:4] + "****" + token[-4:]


# ---------------------------------------------------------------------------
# 股票名称搜索（备选添加）：全量 A 股列表进程内缓存
# ---------------------------------------------------------------------------
_UNIVERSE = None
def stock_universe():
    global _UNIVERSE
    if _UNIVERSE is None:
        with TQS_LOCK:
            raw = TQS.get_stock_list(market="5", list_type=1)  # market=5 全部A股；list_type=1 返回 Code+Name
        rows = rows_of(raw)
        _UNIVERSE = [{"code": r.get("Code"), "name": str(r.get("Name") or "")}
                     for r in rows if r.get("Code")]
    return _UNIVERSE


def h_search(q):
    """按代码前缀或名称精确/前缀/包含匹配，返回最多 8 条 {code,name}。"""
    q = (q or "").strip()
    if not q:
        return []
    ql = q.lower()
    exact, prefix, contains = [], [], []
    for r in stock_universe():
        code = r["code"]
        name = r["name"]
        if code == q or name == q:
            exact.append(r)
        elif code.startswith(q) or (name and name.startswith(q)):
            prefix.append(r)
        elif q in name:
            contains.append(r)
    return (exact + prefix + contains)[:8]


# ---------------------------------------------------------------------------
# 东财人气榜热门股（数据源同 woya187/eastmoney-hotrank-monitor 监控的股吧人气榜：
# emappdata getAllCurrentList 排名 + push2 ulist 行情），300s TTL
# ---------------------------------------------------------------------------
EM_HOT_TTL = 300.0
EM_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
         "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
_em_state = {"data": None, "ts": 0.0, "lock": threading.Lock()}
_http_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
_EM_GLOBAL_ID = "78" + uuid.uuid4().hex  # 进程级会话标识（接口要求 78 开头的长串）


def _em_post_json(url, payload):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": EM_UA,
                 "Referer": "https://guba.eastmoney.com/rank/"})
    with _http_opener.open(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _em_get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": EM_UA, "Referer": "https://quote.eastmoney.com/"})
    with _http_opener.open(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _sym_normal(code):
    """SH600519 / SZ000852 / BJ832000 → 600519.SH / 000852.SZ / 832000.BJ。"""
    m = re.match(r"^(SH|SZ|BJ)?(\d{6})$", str(code or "").upper())
    if not m:
        return str(code or "")
    suffix = m.group(1) or ("SH" if m.group(2)[0] in "69" else ("BJ" if m.group(2)[0] in "48" else "SZ"))
    return m.group(2) + "." + suffix


def em_hot_rank(limit=10):
    """人气榜排名（getAllCurrentList）+ 批量行情（push2 ulist）→ [{rank,code,name,now,pct,rankChange}]"""
    payload = {"appId": "appId01", "globalId": _EM_GLOBAL_ID, "marketType": "", "pageNo": 1, "pageSize": str(limit)}
    data = _em_post_json("https://emappdata.eastmoney.com/stockrank/getAllCurrentList", payload)
    items = data.get("data") or []
    if not isinstance(items, list):
        items = []
    secids, order = [], []
    for it in items[:limit]:
        sc = str(it.get("sc") or "").upper()
        if re.match(r"^(SH|SZ|BJ)\d{6}$", sc):
            secid = ("1." if sc.startswith("SH") else "0.") + sc[2:]
            if secid not in secids:
                secids.append(secid)
                order.append((secid, sc, it))
    quotes = {}
    if secids:
        qurl = ("https://push2.eastmoney.com/api/qt/ulist.np/get?secids=" + ",".join(secids)
                + "&fields=f2,f3,f12,f14&fltt=2")
        qdata = _em_get_json(qurl)
        diff = (qdata.get("data") or {}).get("diff") or []
        code_to_secid = {secid.split(".")[1]: secid for secid in secids}
        for q in diff:
            secid = code_to_secid.get(str(q.get("f12") or ""))
            if secid:
                quotes[secid] = q
    out = []
    for secid, sc, it in order:
        q = quotes.get(secid) or {}
        out.append({
            "rank": int(to_float(it.get("rk"), 0) or 0),
            "code": _sym_normal(sc),
            "name": str(q.get("f14") or ""),
            "now": to_float(q.get("f2")),
            "pct": to_float(q.get("f3")),
            "rankChange": int(to_float(it.get("rc"), 0) or 0),
            "hot": True,
        })
    return [o for o in out if o["name"]]


def h_hot_rank():
    """东财人气榜热门股前10；300s TTL，失败保留上次数据。"""
    c = _em_state
    now = time.time()
    if c["data"] is not None and now - c["ts"] < EM_HOT_TTL:
        return c["data"]
    with c["lock"]:
        now = time.time()
        if c["data"] is not None and now - c["ts"] < EM_HOT_TTL:
            return c["data"]
        try:
            data = em_hot_rank(10)
            if data:
                c["data"] = data
                c["ts"] = time.time()
        except Exception:
            pass
    return c["data"] or []


# ---------------------------------------------------------------------------
# HTTP 服务
# ---------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    def _send(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, *")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send({})

    def _read_json_body(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > 64 * 1024:
            return None
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return None

    def do_POST(self):
        try:
            path = unquote(urlparse(self.path).path)
            body = self._read_json_body()
            if path == "/config":
                if not isinstance(body, dict) or "token" not in body:
                    return self._send({"ok": False, "error": "body 必须为 {token}"}, 400)
                save_token(body.get("token"))
                return self._send({"ok": True, "needRestart": True})
            if path == "/shutdown":
                def _exit():
                    try:
                        if _SERVER is not None:
                            _SERVER.shutdown()
                    except Exception:
                        import os
                        os._exit(0)
                threading.Timer(0.3, _exit).start()
                return self._send({"ok": True})
            return self._send({"error": "not found"}, 404)
        except Exception as exc:  # noqa: BLE001
            return self._send({"ok": False, "error": str(exc)}, 500)

    def do_GET(self):
        try:
            url = urlparse(self.path)
            q = parse_qs(url.query)
            getn = lambda key, d: int(to_float(q.get(key, [d])[0], d) or d)
            path = unquote(url.path)
            if path == "/health":
                ver = None
                if hasattr(TQS, "get_version"):
                    try:
                        with TQS_LOCK:
                            ver = TQS.get_version()
                    except Exception:
                        ver = None
                return self._send({"ok": True, "mode": "tdx", "version": str(ver), "tokenSet": bool(token_of())})
            if path == "/config":
                return self._send({"ok": True, "tokenMasked": mask_token(token_of()),
                                   "iniPath": str(INI_PATH) if INI_PATH else None})
            handlers = {
                "/indices": lambda: cached("indices", 3, h_indices),
                "/global": lambda: cached("global", 3, h_global),
                "/rank/speed": lambda: cached("rank:speed:" + str(getn("n", 50)), 3, lambda: h_rank_speed(getn("n", 50))),
                "/rank/zt": lambda: cached("rank:zt:" + str(getn("n", 50)), 3, lambda: h_rank_zt(getn("n", 50))),
                "/rank/sectors": lambda: cached("rank:sectors:" + str(getn("n", 10)), 15, lambda: h_rank_sectors(getn("n", 10))),
                "/rank/hot": lambda: cached("rank:hot:" + str(getn("n", 10)), 10, lambda: h_rank_hot(getn("n", 10))),
                "/snapshot": lambda: cached("snapshot:" + (q.get("codes", [""])[0]), 3, lambda: h_snapshot([c for c in (q.get("codes", [""])[0]).split(",") if c])),
                "/kline": lambda: cached("kline:" + q.get("code", [""])[0] + ":" + str(getn("count", 120)), 300, lambda: h_kline(q.get("code", [""])[0], getn("count", 120))),
                "/minute": lambda: cached("minute:" + q.get("code", [""])[0], 60, lambda: h_minute(q.get("code", [""])[0])),
                "/minute_batch": lambda: h_minute_batch([c for c in (q.get("codes", [""])[0]).split(",") if c]),
                "/search": lambda: h_search(unquote(q.get("q", [""])[0])),
                "/hot_rank": h_hot_rank,
            }
            fn = handlers.get(path)
            if not fn:
                return self._send({"error": "not found"}, 404)
            return self._send(fn())
        except Exception as exc:  # noqa: BLE001
            return self._send({"error": str(exc)}, 500)

    def log_message(self, fmt, *args):  # 静默访问日志
        pass


def main():
    global _SERVER
    parser = argparse.ArgumentParser(description="TdxAiData HTTP bridge for the stock dashboard")
    parser.add_argument("--port", type=int, default=7350)
    parser.add_argument("--dir", type=str, default=None, help="TdxAiData 安装目录")
    args = parser.parse_args()
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    except OSError:
        print(f"port {args.port} in use: bridge already running, exiting.")
        return
    _SERVER = server
    print(f"tdx_bridge listening on http://127.0.0.1:{args.port} (pandas={HAVE_PANDAS})")
    server.serve_forever()


if __name__ == "__main__":
    main()
