/**
 * Host half of the A股短线看板 bundle.
 *
 * Serves three same-origin HTTP routes on the harness webServer for the
 * dashboard's Client module, and owns every LLM / external-news call so the
 * browser never holds provider access:
 *
 *   GET  /stock-dashboard/api/news     财联社电报快讯（无 token 成本，60s TTL）
 *   POST /stock-dashboard/api/score    板块+个股 LLM 看涨/看跌评分（150s 内容 TTL + 45s 最小间隔）
 *   POST /stock-dashboard/api/monitor  市场异动监控：本地启发式先行，异常才调 LLM（15min 冷却，force 手动）
 *
 * Token safety contract (补充需求：停启用持久化，防止自动开启白白消耗 token):
 *   - The Client owns both enable toggles, persists them in localStorage and
 *     defaults them to OFF; the Host never starts LLM work on its own — every
 *     LLM call is client-requested while the dashboard is open.
 *   - Server-side caches + minimum intervals make repeated polls cheap, and
 *     the monitor only reaches the LLM when the local heuristic fires.
 *
 * Route/trust pattern follows @deepseek-ai/dsh-host-open-in-app: every route
 * asks ctx.connection.requestRejection(req) first (Host/Origin fence + login
 * cookie), then validates method and a bounded JSON body.
 *
 * 财联社 protocol reference (GitHub 调研结论，README 有完整对照表):
 *   https://github.com/InphinitiZ/cls-telegraph        (CLI, 接口与签名实现)
 *   https://github.com/caimao9539/cailianpress-unified (MIT, 统一电报/加红查询)
 *   https://github.com/enslogic/TrendRadar 等聚合器仅作来源旁证。
 *   协议：nodeapi updateTelegraphList 免签；v1 roll/get_roll_list 需
 *   sign = md5(sha1(按 key 排序的 k=v& 串))。
 */

const NAME = 'stock-dashboard-server';

import { createHash } from 'node:crypto';

/** sign = md5(sha1(text)) — 财联社 v1 接口签名（协议参考 GitHub cls-telegraph）。 */
function sha1Md5(text) {
  return createHash('md5').update(createHash('sha1').update(text, 'utf8').digest('hex'), 'utf8').digest('hex');
}

/** Route paths (exact). The Client fetches them document-relative. */
const NEWS_PATH = '/stock-dashboard/api/news';
const SCORE_PATH = '/stock-dashboard/api/score';
const MONITOR_PATH = '/stock-dashboard/api/monitor';
const MODELS_PATH = '/stock-dashboard/api/models';

const inject = ['webServer', 'connection', 'llm', 'agentDefaultModel'];

/** Request bodies are tiny JSON; anything larger is hostile. */
const MAX_BODY_BYTES = 128 * 1024;

/** Caches / throttles (module-per-process; host outlives page reloads). */
const newsTtlMs = 60 * 1000;
const scoreTtlMs = 150 * 1000;
const scoreMinGapMs = 45 * 1000;
const monitorMinGapMs = 30 * 1000;
const monitorRepeatMs = 15 * 60 * 1000; // 同一异动签名下的 LLM 冷却
const llmTimeoutMs = 90 * 1000;
const MAX_REPORTS = 12;
const MAX_NEWS_ITEMS = 30;

const state = {
  news: { data: null, ts: 0, inflight: null },
  score: {
    bullish: { key: '', data: null, ts: 0, lastCall: 0, inflight: null },
    limitup: { key: '', data: null, ts: 0, lastCall: 0, inflight: null },
  },
  monitor: { sig: '', data: null, ts: 0, lastCall: 0, inflight: null, reports: [], lastReportTs: 0, lastSig: '' },
};

// ---------------------------------------------------------------------------
// Small HTTP helpers (same shape as dsh-host-open-in-app)
// ---------------------------------------------------------------------------
function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendMethodNotAllowed(res, allow) {
  res.statusCode = 405;
  res.setHeader('allow', allow);
  res.end();
}

async function readBoundedBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) {
      req.resume();
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size).toString('utf8');
}

function parseJsonObject(text) {
  try {
    const body = JSON.parse(text);
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

function nowTs() { return Date.now(); }

function hhmm(ctime) {
  const d = new Date(ctime * 1000);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// 财联社电报（消息来源）：协议见文件头注释，带 60s TTL 与单飞去重
// ---------------------------------------------------------------------------
const CLS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Referer': 'https://www.cls.cn/telegraph',
  'Accept': 'application/json, text/plain, */*',
};

function clsSign(params) {
  // sign = md5(sha1(sorted "k=v" joined by "&"))
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return sha1Md5(sorted);
}

function mapClsItem(raw) {
  const stocks = Array.isArray(raw.stock_list)
    ? raw.stock_list.slice(0, 4).map((s) => ({ name: s.name || '', rise: typeof s.RiseRange === 'number' ? s.RiseRange : null })).filter((s) => s.name)
    : [];
  const subjects = Array.isArray(raw.subjects)
    ? raw.subjects.map((s) => s.subject_name || '').filter(Boolean).slice(0, 3)
    : [];
  const content = String(raw.content || '').replace(/<[^>]+>/g, '').trim();
  return {
    id: raw.id,
    time: hhmm(raw.ctime || 0),
    level: raw.level === 'A' || raw.level === 'B' ? raw.level : 'C',
    title: String(raw.title || '').trim(),
    content: content.slice(0, 150),
    stocks,
    subjects,
  };
}

let nodeApiBadUntil = 0;

async function clsFetchOnce() {
  const signal = AbortSignal.timeout(10 * 1000);
  // 1) nodeapi updateTelegraphList：免签实时电报（部分环境返回 HTML，失败后 10 分钟内跳过）
  if (nowTs() >= nodeApiBadUntil) {
    try {
      const url = new URL('https://www.cls.cn/nodeapi/updateTelegraphList');
      url.searchParams.set('app', 'CailianpressWeb');
      url.searchParams.set('os', 'web');
      url.searchParams.set('sv', '8.4.6');
      url.searchParams.set('rn', '20');
      const res = await fetch(url, { headers: CLS_HEADERS, signal });
      if (res.ok) {
        const data = await res.json();
        const rows = data && data.data && Array.isArray(data.data.roll_data) ? data.data.roll_data : [];
        if (rows.length) return rows.map(mapClsItem);
      }
    } catch {
      nodeApiBadUntil = nowTs() + 10 * 60 * 1000;
    }
  }
  // 2) v1 roll/get_roll_list：带签名，可分页
  const params = {
    app: 'CailianpressWeb',
    os: 'web',
    sv: '8.4.6',
    refresh_type: '1',
    rn: '30',
    last_time: String(Math.floor(nowTs() / 1000)),
    category: '',
  };
  params.sign = clsSign(params);
  const url = new URL('https://www.cls.cn/v1/roll/get_roll_list');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: CLS_HEADERS, signal });
  if (!res.ok) throw new Error('cls http ' + res.status);
  const data = await res.json();
  if (data && data.errno !== 0 && data.errno !== '0') throw new Error('cls errno ' + data.errno);
  const rows = data && data.data && Array.isArray(data.data.roll_data) ? data.data.roll_data : [];
  return rows.map(mapClsItem);
}

async function getNews() {
  const c = state.news;
  if (c.data && nowTs() - c.ts < newsTtlMs) return { items: c.data, ts: c.ts, cached: true };
  if (!c.inflight) {
    c.inflight = clsFetchOnce()
      .then((items) => { c.data = items.slice(0, MAX_NEWS_ITEMS); c.ts = nowTs(); })
      .finally(() => { c.inflight = null; });
  }
  await c.inflight;
  if (!c.data) throw new Error('财联社快讯拉取失败');
  return { items: c.data, ts: c.ts, cached: false };
}

// ---------------------------------------------------------------------------
// LLM 一步调用：默认走 Harness 当前模型（agentDefaultModel），可被看板设置覆盖
// ---------------------------------------------------------------------------
function providerIds(ctx) {
  try {
    return (ctx.llm.listProviders() || []).map((p) => (p && typeof p === 'object' ? p.id : p));
  } catch {
    return [];
  }
}

/** 看板「默认模型」设置（body.model）仅在 provider 已注册时生效，否则回退默认。 */
function resolveModelSel(ctx, body) {
  const fallback = ctx.agentDefaultModel.currentSelection();
  const m = body && body.model;
  if (m && typeof m.provider === 'string' && typeof m.model === 'string' && providerIds(ctx).indexOf(m.provider) >= 0) {
    // 不透传会话的 reasoningEffort：短结构化任务用模型默认档，避免思考预算吞掉输出
    return { provider: m.provider, model: m.model };
  }
  // 默认模型同样不带 effort —— agent 会话的 max 思考档与插件小任务无关
  return { provider: fallback.provider, model: fallback.model };
}

async function llmText(ctx, prompt, maxTokens, sel) {
  const use = sel || ctx.agentDefaultModel.currentSelection();
  const signal = AbortSignal.timeout(llmTimeoutMs);
  const stream = ctx.llm.stream({
    provider: use.provider,
    model: use.model,
    maxTokens,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    signal,
  });
  let text = '';
  for await (const chunk of stream) {
    if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text;
  }
  if (!text.trim()) throw new Error('LLM 空响应');
  return text.trim();
}

/** 宽容解析模型输出里的 JSON（容忍 ```json 围栏与前后杂文本）。 */
function extractJson(text, expectArray) {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const open = expectArray ? cleaned.indexOf('[') : cleaned.indexOf('{');
  if (open < 0) throw new Error('LLM 输出中未找到 JSON');
  const close = expectArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
  if (close <= open) throw new Error('LLM 输出 JSON 不完整');
  return JSON.parse(cleaned.slice(open, close + 1));
}

function clampScore(n) {
  const v = Math.round(Number(n));
  if (!isFinite(v)) return 0;
  return Math.max(-100, Math.min(100, v));
}

// ---------------------------------------------------------------------------
// LLM 评分：bullish（看涨/看跌分）与 limitup（涨速榜冲板概率）
// ---------------------------------------------------------------------------
function buildScorePrompt(body) {
  const sectors = Array.isArray(body.sectors) ? body.sectors.slice(0, 12) : [];
  const stocks = Array.isArray(body.stocks) ? body.stocks.slice(0, 40) : [];
  const lines = [];
  lines.push('你是A股短线情绪分析器。下面是实时板块与个股快照，请给每一项输出看涨/看跌评分。');
  lines.push('只输出一个 JSON 数组，不要任何其它文字、不要 markdown：[{"k":"<只填代码或板块名本身>","s":<整数-100~100>,"r":"≤14字理由"}]。');
  lines.push('s>0 看涨、s<0 看跌，幅度代表强弱。评分依据：日内动能、涨速与涨幅的背离、量能、板块地位与联动。');
  lines.push('');
  if (sectors.length) {
    lines.push('【板块】(k=名称)');
    for (const s of sectors) {
      const leader = s.leader ? `，领涨 ${s.leader}${s.leaderPct != null ? ' ' + (s.leaderPct > 0 ? '+' : '') + Number(s.leaderPct).toFixed(1) + '%' : ''}` : '';
      lines.push(`- k=${s.name} | 涨幅 ${Number(s.pct || 0).toFixed(2)}%${leader}`);
    }
  }
  if (stocks.length) {
    lines.push('【个股】(k=代码)');
    for (const s of stocks) {
      lines.push(`- k=${s.code} ${s.name} | 现价 ${Number(s.now || 0).toFixed(2)} 涨幅 ${Number(s.pct || 0).toFixed(2)}% 3分涨速 ${Number(s.speed || 0).toFixed(2)}% 成交 ${Math.round((s.amount || 0) / 1e8)}亿${s.turnover != null ? ' 换手 ' + Number(s.turnover).toFixed(1) + '%' : ''}${s.days > 1 ? ` ${s.days}连板` : ''}`);
    }
  }
  lines.push('');
  lines.push('提醒：这是短线性打分，反映未来30分钟到收盘的相对强弱倾向，不做长线基本面判断。');
  return lines.join('\n');
}

/** 涨速榜专用：结合消息面/题材/情绪周期/K线审美，判断“冲击涨停”概率。 */
function buildLimitupPrompt(body, news) {
  const stocks = Array.isArray(body.stocks) ? body.stocks.slice(0, 12) : [];
  const g = body.global && typeof body.global === 'object' ? body.global : {};
  const lines = [];
  lines.push('你是A股短线“冲击涨停”研判器。对下列涨速榜个股，请结合财联社消息面、题材效应、短线情绪周期，以及个股K线形态是否符合短线审美（多头排列、放量突破、位置不高、分时强势），判断其当日更高概率收板涨停的可能性。');
  lines.push('只输出一个 JSON 数组，不要任何其它文字、不要 markdown：[{"k":"<原样回传代码>","p":<0-100整数涨停概率>,"r":"≤16字核心理由"}]。');
  lines.push('');
  lines.push('【短线情绪周期】');
  lines.push(`涨停 ${g.zt != null ? g.zt : '?'} 家 / 炸板 ${g.zhaban != null ? g.zhaban : '?'} 家 / 跌停 ${g.dt != null ? g.dt : '?'} 家，最高连板 ${g.maxLb != null ? g.maxLb : '?'} 板，涨 ${g.up != null ? g.up : '?'} 跌 ${g.down != null ? g.down : '?'}，沪深成交 ${fmtYi(Number(g.amount) || 0)}`);
  if (news && news.length) {
    lines.push('');
    lines.push('【消息面 · 财联社快讯】');
    for (const n of news.slice(0, 10)) {
      lines.push(`[${n.level}] ${n.time} ${String(n.title || n.content || '').slice(0, 60)}`);
    }
  }
  lines.push('');
  lines.push('【涨速榜个股】(k=代码)');
  for (const s of stocks) {
    lines.push(`- k=${s.code} ${s.name} | 现价 ${Number(s.now || 0).toFixed(2)} 涨幅 ${Number(s.pct || 0).toFixed(2)}% 3分涨速 ${Number(s.speed || 0).toFixed(2)}%${s.turnover != null && s.turnover !== '' ? ' 换手 ' + Number(s.turnover).toFixed(1) + '%' : ''} 成交 ${Math.round((s.amount || 0) / 1e8)}亿${s.ksum ? ' | K线: ' + s.ksum : ''}`);
  }
  lines.push('');
  lines.push('评分基准：有消息/题材催化 + 涨幅与涨速同向 + K线短线形态佳 → 高分；纯脉冲无题材、高位滞涨、炸板氛围差、K线走弱 → 低分。p 只反映“当日收板涨停”概率，不是涨幅预测。');
  return lines.join('\n');
}

async function handleScore(ctx, body) {
  const intent = body.intent === 'limitup' ? 'limitup' : 'bullish';
  const model = resolveModelSel(ctx, body);
  const sectors = Array.isArray(body.sectors) ? body.sectors : [];
  const stocks = Array.isArray(body.stocks) ? body.stocks : [];
  // 空载荷（首屏数据未就绪）直接拒绝：不调模型、不污染缓存槽、不触发节流
  if (intent === 'limitup' ? !stocks.length : (!sectors.length && !stocks.length)) {
    return { ok: false, error: 'NO_DATA', retryMs: 4000 };
  }
  const slot = state.score[intent];
  const sig = JSON.stringify([model.provider + '/' + model.model,
    sectors.map((s) => [s.name, Math.round((s.pct || 0) * 10)]),
    stocks.map((s) => [s.code, Math.round((s.pct || 0) * 10), Math.round((s.speed || 0) * 10), String(s.ksum || '')])]);
  const fresh = slot.data && slot.key === sig && nowTs() - slot.ts < scoreTtlMs;
  if (fresh && body.force !== true) return { ...slot.data, cached: true };
  const sinceCall = nowTs() - slot.lastCall;
  if (!body.force && sinceCall < scoreMinGapMs) {
    if (slot.data) return { ...slot.data, cached: true, throttled: true };
    return { ok: false, error: 'EVAL_THROTTLED', retryMs: scoreMinGapMs - sinceCall };
  }
  if (slot.inflight) return slot.inflight;
  slot.lastCall = nowTs();
  slot.inflight = (async () => {
    try {
      const prompt = intent === 'limitup'
        ? buildLimitupPrompt({ stocks }, await safeNews())
        : buildScorePrompt({ sectors, stocks });
      const out = await llmText(ctx, prompt, intent === 'limitup' ? 2500 : 3000, model);
      const arr = extractJson(out, true);
      // 模型可能整行回显 k（如 "600519.SH 贵州茅台"），按期望 id 重新对齐键
      const expected = [...sectors.map((s) => String(s.name)), ...stocks.map((s) => String(s.code))];
      const items = Array.isArray(arr) ? arr.filter((it) => it && typeof it.k === 'string') : [];
      const pick = (it) => {
        const raw = intent === 'limitup' ? (it.p != null ? it.p : it.s) : it.s;
        let score = clampScore(raw);
        if (intent === 'limitup') score = Math.max(0, Math.min(100, Math.round(Number(raw) || 0)));
        return { score, reason: String(it.r || '').slice(0, 40) };
      };
      const byKey = new Map();
      const rest = items.slice();
      for (const exp of expected) {
        let idx = rest.findIndex((it) => it.k === exp);
        if (idx < 0) idx = rest.findIndex((it) => it.k.startsWith(exp));
        if (idx < 0) idx = rest.findIndex((it) => it.k.includes(exp));
        if (idx >= 0) {
          byKey.set(exp, pick(rest[idx]));
          rest.splice(idx, 1);
        }
      }
      for (const it of rest) if (!byKey.has(it.k)) byKey.set(it.k, pick(it));
      slot.data = { ok: true, items: byKey, model: model.model, ts: nowTs() };
      slot.key = sig;
      slot.ts = nowTs();
      return { ...slot.data, cached: false };
    } finally {
      slot.inflight = null;
    }
  })();
  return slot.inflight;
}

/** 新闻失败不阻塞评分/监控主流程。 */
async function safeNews() {
  try { return (await getNews()).items; } catch { return []; }
}

// ---------------------------------------------------------------------------
// 异动监控：本地启发式判定异动 → 才调 LLM 解释 + 建议
// ---------------------------------------------------------------------------
function detectFacts(body) {
  const facts = [];
  const g = body.global && typeof body.global === 'object' ? body.global : {};
  const idx = Array.isArray(body.indices) ? body.indices : [];
  const maxAbsIdx = Math.max(0, ...idx.map((i) => Math.abs(Number(i.pct) || 0)));
  if (maxAbsIdx >= 0.8) facts.push(`指数振幅:主要指数涨跌幅达 ${maxAbsIdx.toFixed(2)}%`);
  const up = Number(g.up) || 0;
  const down = Number(g.down) || 0;
  if (up + down > 200) {
    const ratio = up / (up + down);
    if (ratio <= 0.32) facts.push(`赚钱效应差:上涨占比仅 ${(ratio * 100).toFixed(0)}%`);
    else if (ratio >= 0.68) facts.push(`普涨:上涨占比 ${(ratio * 100).toFixed(0)}%`);
  }
  const zt = Number(g.zt) || 0;
  const zha = Number(g.zhaban) || 0;
  if (zt >= 80) facts.push(`涨停家数 ${zt} 家,情绪过热`);
  if (zha >= 25) facts.push(`炸板 ${zha} 家,分歧加大`);
  if (zt + zha > 8 && zha / (zt + zha) >= 0.3) facts.push(`封板率偏低(炸板/涨停 ${((zha / (zt + zha)) * 100).toFixed(0)}%)`);
  const maxLb = Number(g.maxLb) || 0;
  if (maxLb >= 6) facts.push(`最高连板 ${maxLb} 板,空间板打开`);
  const speed = Array.isArray(body.speed) ? body.speed : [];
  const hot = speed.filter((s) => Math.abs(Number(s.speed) || 0) >= 2).length;
  if (hot >= 6) facts.push(`涨速异动个股 ${hot} 只(|3分涨速|≥2%)`);
  const amount = Number(g.amount) || 0;
  if (amount >= 2.0e12) facts.push(`沪深成交 ${fmtYi(amount)},显著放量`);
  if (amount > 0 && amount <= 1.1e12) facts.push(`沪深成交仅 ${fmtYi(amount)},显著缩量`);
  return facts;
}

function fmtYi(v) {
  return (v / 1e12).toFixed(2) + '万亿';
}

function monitorSignature(facts) {
  return facts.join('|');
}

function buildMonitorPrompt(body, facts, news) {
  const g = body.global || {};
  const lines = [];
  lines.push('你是A股盘中异动分析助手。程序已检测到以下异动信号，请结合盘面与财联社快讯给出异动解释和短线建议。');
  lines.push('只输出一个 JSON 对象，不要任何其它文字、不要 markdown：');
  lines.push('{"level":"high|mid|low","title":"≤12字异动概括","reason":"≤110字成因分析","advice":"≤90字短线操作建议(仓位/情绪/板块方向，不点名个股买卖)","tags":["相关板块或概念",最多3个]}');
  lines.push('');
  lines.push('【程序检测的异动信号】');
  for (const f of facts) lines.push('- ' + f);
  lines.push('');
  lines.push('【盘面快照】');
  const idx = Array.isArray(body.indices) ? body.indices : [];
  if (idx.length) lines.push('指数: ' + idx.map((i) => `${i.name} ${Number(i.now).toFixed(2)} ${Number(i.pct) > 0 ? '+' : ''}${Number(i.pct).toFixed(2)}%`).join(' | '));
  lines.push(`涨跌家数: 涨 ${g.up} / 跌 ${g.down} | 涨停 ${g.zt} 跌停 ${g.dt} 炸板 ${g.zhaban} 最高连板 ${g.maxLb}板 | 沪深成交 ${fmtYi(Number(g.amount) || 0)}`);
  const speed = Array.isArray(body.speed) ? body.speed.slice(0, 8) : [];
  if (speed.length) lines.push('涨速榜前列: ' + speed.map((s) => `${s.name}(${Number(s.pct) > 0 ? '+' : ''}${Number(s.pct).toFixed(1)}% 速${Number(s.speed) > 0 ? '+' : ''}${Number(s.speed).toFixed(1)}%)`).join('、'));
  const zt = Array.isArray(body.zt) ? body.zt.slice(0, 8) : [];
  if (zt.length) lines.push('涨停梯队: ' + zt.map((s) => `${s.name}${s.days > 1 ? s.days + '板' : '(首板)'}`).join('、'));
  const sectors = Array.isArray(body.sectors) ? body.sectors.slice(0, 6) : [];
  if (sectors.length) lines.push('领涨板块: ' + sectors.map((s) => `${s.name} ${Number(s.pct) > 0 ? '+' : ''}${Number(s.pct).toFixed(1)}%`).join('、'));
  if (news && news.length) {
    lines.push('');
    lines.push('【财联社快讯(最近)】');
    for (const n of news.slice(0, 12)) {
      const title = n.title || n.content;
      lines.push(`[${n.level}] ${n.time} ${String(title).slice(0, 60)}`);
    }
  }
  lines.push('');
  lines.push('要求：reason 必须把信号与快讯中最相关的消息联系起来；若快讯无法解释，则从资金面/情绪周期解释并说明依据不足。advice 面向短线交易者，控制回撤优先。');
  return lines.join('\n');
}

async function handleMonitor(ctx, body) {
  const facts = detectFacts(body);
  const sig = monitorSignature(facts);
  const c = state.monitor;
  const noAnomaly = facts.length === 0;
  if (noAnomaly && body.force !== true) {
    return { ok: true, triggered: false, level: 'none', reports: c.reports, ts: nowTs() };
  }
  if (body.force !== true) {
    const sameSigActive = sig === c.lastSig && nowTs() - c.lastReportTs < monitorRepeatMs;
    if (sameSigActive && c.reports.length) {
      return { ok: true, triggered: false, level: c.reports[0].level, report: c.reports[0], reports: c.reports, ts: nowTs(), cached: true };
    }
    const sinceCall = nowTs() - c.lastCall;
    if (sinceCall < monitorMinGapMs && c.reports.length) {
      return { ok: true, triggered: false, level: c.reports[0].level, report: c.reports[0], reports: c.reports, ts: nowTs(), cached: true, throttled: true };
    }
  }
  if (c.inflight) return c.inflight;
  c.lastCall = nowTs();
  c.inflight = (async () => {
    try {
      const news = await safeNews();
      const model = resolveModelSel(ctx, body);
      const out = await llmText(ctx, buildMonitorPrompt(body, facts, news), 900, model);
      const obj = extractJson(out, false);
      const level = ['high', 'mid', 'low'].indexOf(obj.level) >= 0 ? obj.level : 'mid';
      const report = {
        ts: nowTs(),
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        level,
        title: String(obj.title || '市场异动').slice(0, 24),
        reason: String(obj.reason || '').slice(0, 200),
        advice: String(obj.advice || '').slice(0, 160),
        tags: Array.isArray(obj.tags) ? obj.tags.map((t) => String(t).slice(0, 12)).slice(0, 3) : [],
        facts,
        newsUsed: news.length,
      };
      c.reports.unshift(report);
      if (c.reports.length > MAX_REPORTS) c.reports.length = MAX_REPORTS;
      c.lastSig = sig;
      c.lastReportTs = nowTs();
      c.data = report;
      c.ts = nowTs();
      return { ok: true, triggered: true, level, report, reports: c.reports, ts: nowTs() };
    } finally {
      c.inflight = null;
    }
  })();
  return c.inflight;
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------
export function apply(ctx) {
  // 与 dsh-host-open-in-app 相同的访问方式（connection 包是 browser-side，本地宽松取用）
  const connection = () => Reflect.get(ctx, 'connection');

  const rejected = (req, res) => {
    const rejection = connection().requestRejection(req);
    if (rejection === undefined) return false;
    res.statusCode = rejection;
    res.end();
    return true;
  };

  const guard = (req, res, method) => {
    if (rejected(req, res)) return false;
    if (req.method !== method) {
      sendMethodNotAllowed(res, method);
      return false;
    }
    return true;
  };

  async function readJsonBody(req, res) {
    const text = await readBoundedBody(req);
    if (text === null) {
      sendJson(res, 413, { ok: false, error: 'payload-too-large' });
      return null;
    }
    const body = parseJsonObject(text);
    if (body === null) {
      sendJson(res, 400, { ok: false, error: 'body must be a JSON object' });
      return null;
    }
    return body;
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: NEWS_PATH,
    handler: async (req, res) => {
      if (!guard(req, res, 'GET')) return;
      try {
        const out = await getNews();
        sendJson(res, 200, { ok: true, ...out });
      } catch (error) {
        sendJson(res, 502, { ok: false, error: String(error && error.message || error) });
      }
    },
  }), `${NAME}: GET ${NEWS_PATH}`);

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: SCORE_PATH,
    handler: async (req, res) => {
      if (!guard(req, res, 'POST')) return;
      const body = await readJsonBody(req, res);
      if (body === null) return;
      try {
        const out = await handleScore(ctx, body);
        // items 是 Map（host 内存态），序列化前转数组
        const payload = { ...out, items: out.items instanceof Map ? [...out.items.entries()] : (out.items || []) };
        sendJson(res, 200, payload);
      } catch (error) {
        sendJson(res, 200, { ok: false, error: String(error && error.message || error), ts: nowTs() });
      }
    },
  }), `${NAME}: POST ${SCORE_PATH}`);

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: MONITOR_PATH,
    handler: async (req, res) => {
      if (!guard(req, res, 'POST')) return;
      const body = await readJsonBody(req, res);
      if (body === null) return;
      try {
        const out = await handleMonitor(ctx, body);
        sendJson(res, 200, out);
      } catch (error) {
        sendJson(res, 200, { ok: false, error: String(error && error.message || error), ts: nowTs() });
      }
    },
  }), `${NAME}: POST ${MONITOR_PATH}`);

  // DSH 已配置的模型目录（供看板设置弹窗选择默认模型）
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: MODELS_PATH,
    handler: async (req, res) => {
      if (!guard(req, res, 'GET')) return;
      const providers = [];
      for (const p of ctx.llm.listProviders() || []) {
        const id = p && typeof p === 'object' ? p.id : p;
        const label = p && typeof p === 'object' && p.name ? p.name : String(id);
        if (typeof id !== 'string' || !id) continue;
        try {
          const models = await ctx.llm.listModels(id);
          providers.push({ provider: id, label, models: (models || []).map((m) => ({ id: m.id, name: m.name })) });
        } catch { /* 单个 provider 失败不影响目录 */ }
      }
      sendJson(res, 200, { ok: true, providers, default: resolveModelSel(ctx, null) });
    },
  }), `${NAME}: GET ${MODELS_PATH}`);
}

export { NAME as name, inject };
