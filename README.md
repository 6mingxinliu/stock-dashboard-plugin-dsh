# A股短线看板 — DeepSeek Harness 插件

在 DeepSeek Harness Web UI 左侧菜单新增「短线看板」入口，点击展示短线行情看板。

## 功能（v1.5）

- **顶部指数条（可点击）**：上证指数、深证成指、创业板指、科创50——点击任一指数弹出
  图表弹窗（日K / 分时可切换，默认固定）
- **备选股列表**：支持**代码或名称**添加（桥接 `/search` 全量 A 股列表匹配，
  未找到/失败用 Toast 提示），localStorage 持久化；AI 分空载荷防护（首屏不再锁死评分）
- **AI 评分列**：板块与列表个股的 LLM 看涨/看跌分（-100~+100，悬停看一句话理由）
- **涨速冲板榜**：**涨速为主要排序**，涨幅 ≥5% 作为次要排序（同速优先），取前 10 ——
  目标是找冲击涨停的股票；**冲板AI** 列结合财联社消息面、题材效应、短线情绪周期与
  个股 K 线形态（日K缓存自动摘要），输出当日涨停收板概率（0-100%）
- **热门三栏区**（主表下方）：热门板块（**AKShare 行业+概念** 合并涨幅 TOP10 + AI分，
  领涨股与行业/概念标签，300s TTL，失败回退 TDX）|
  **热门股 = 东财人气榜 TOP10**（股吧人气 `getAllCurrentList` + push2 批量行情，
  含**人气名次变化** ▲▼；桥接 300s TTL → **5 分钟刷新**；数据源同
  [woya187/eastmoney-hotrank-monitor](https://github.com/woya187/eastmoney-hotrank-monitor) 监控的榜单）|
  **财联社电报**（60s 刷新）
- **图表弹窗（个股悬停/固定、指数点击共用）**：**日K / 分时一键切换**；
  日K 为问财风格**智能支撑线 / 突破线**（可见区间摆动高低点检测：绿色支撑、琥珀突破
  ——上穿摆动高点时标出突破 K 线▲，未突破时显示灰色压力线）；分时图美化
  （红/绿渐变面积、昨收基准、琥珀均价虚线、现价光点、午间会话分隔、分时量）。
  分时时间轴为主流工具式**全天固定宽度**：09:30-15:00 共 240 个时间槽按 HH:MM 落点，
  集合竞价仅合并为 09:30 起点单点、盘中/未走完时段右侧留白；列表内嵌迷你分时同规则
- **AI 异动监控**：本地启发式检测异动（指数振幅/涨跌家数/涨停炸板结构/涨速异动/量能），
  仅在检测到异动时调用模型给出「异动原因 + 短线建议」，并附财联社快讯佐证
- **数据服务开关**：状态与按钮合并为一个开关组件——旋钮颜色表达连接状态
  （绿=实时 / 琥珀=缓存 / 灰=关），点击切换，断开时另有「重连」
- **设置弹窗**（顶栏 ⚙）：卡片式分区 + 迷你开关——涨速冲板榜开关、过滤科创板/创业板/ST、
  TDX 服务 Token（写入 INI 并自动重启桥接）、AI 默认模型（列出 DSH 已配置模型）
- **涨停榜**：按连板数排序，含首板时间/开板次数/封单额
- 4 秒自动刷新，可暂停

## 性能（v1.5 卡死/白屏根治）

- **localStorage 高频大对象序列化是卡顿主因**：此前断线缓存把日K/分时/快照等大对象
  也写入并每 5 秒全量 stringify。现已只缓存核心小榜（indices/global/rank/hot_xq），
  持久化节流至 60s + 页面卸载（pagehide）落盘。
- **请求防堆积**：4s 行情轮询加重入保护（上轮未完成不重入）；日K 预取队列在断开时
  暂停出队（重连自动恢复）；分时预取在后台页/断开时静默——慢网不再堆积超时请求。
- **渲染错误边界**：`DashBoundary` 拦截任何子树异常，降级为「重试渲染」卡片，
  绝不白屏拖垮 Harness 页面。
- 热门股走独立 5 分钟节拍（桥接 TTL 兜底），脱离 4s 轮询链路；数据未变化时跳过重渲染。

## 数据服务与缓存（v1.2 → v1.6）

- **唯一数据源是 TDX 桥接**：v1.2 起移除内置演示行情，绝不展示模拟数据。
- **面板切换即时恢复（v1.6）**：看板卸载/重挂不再空屏——行情快照、标签页与暂停状态
  常驻**内存级 DataHub**（模块级，读写零成本、无序列化），重挂时同步注水后再增量刷新。
- **IndexedDB 持久缓存（v1.7）**：异动消息、热门股、财联社快讯、行情快照写入浏览器
  IndexedDB（数据库方案，不用 localStorage/sessionStorage）——页面刷新后即时回显，
  随后增量更新；热门股与监控查询在挂载时立即发起（不再等待桥接确认）。
- **服务总开关持久化**：顶栏「数据服务」开关组件（状态+按钮合并）保存在 localStorage，
  默认开启；重载后保持。关闭时不轮询、不调用 AI；开启后自动重连（30s 退避，`tdxbridge://` 协议拉起）。
- **断开显示缓存**：核心小榜（indices/global/rank/hot_rank）写入内存 + localStorage
  （60s 节流 + pagehide 落盘）；桥接断开时开关旋钮变琥珀（「缓存 HH:MM」），
  榜单/指数/宽度全部展示最近一次数据，重连后自动更新。
- **AI 只在服务在线时工作**：AI 评分与异动监控默认开启（同样持久化），但仅当
  「服务开 && 桥接已连接」才发起模型调用——不对缓存/无效数据打分，不白耗 token。

## AI 层与 token 安全（v1.1 → v1.2）

- **开关全部持久化**：「服务」「AI评分」「异动监控」三个开关保存在 localStorage，
  默认全开（v1.2 起 AI 默认开启），重载后保持用户选择。
- **调用链**：浏览器 → 本 Harness 同源路由（Host 半端 `index.js`）→ 所选模型
  （看板设置的「默认模型」，可列 DSH 全部已配置 provider/model）→ `ctx.llm.stream`。
  浏览器与插件都不接触 provider 凭证。
- **节省设计**：评分整份清单一次调用、内容 TTL 150s + 最小间隔 45s；监控先跑本地启发式，
  无异动不调模型，同一异动签名 15 分钟冷却；「立即分析」才强制刷新；冲板 AI 只对
  涨速冲板 Top10 打分。
- **免责声明**：AI 评分、冲板概率与异动解读均由模型生成，**不构成投资建议**，请自行把握；
  相关面板与页脚均有常驻提示。
- **Token 安全边界**：Token **不允许写死在任何代码/仓库/历史提交中**（已全量审计），
  唯一存放处为本机 `TdxAiData.ini [Token]`，唯一修改入口为看板 ⚙ 设置
  （桥接 `/config` 只回传掩码如 `TDX-****8422`，完整 Key 不落浏览器、不进日志）。

### 消息来源：财联社（GitHub 调研结论）

| 项目 | 结论 |
| --- | --- |
| [InphinitiZ/cls-telegraph](https://github.com/InphinitiZ/cls-telegraph) | 财联社电报 CLI（Python），**采用**：`nodeapi/updateTelegraphList` 免签实时电报 + `v1/roll/get_roll_list` 的 `sign = md5(sha1(排序参数串))` 签名协议与 UA/Referer 头 |
| [caimao9539/cailianpress-unified](https://github.com/caimao9539/cailianpress-unified) | 财联社统一技能（MIT），电报/加红/热度/文章详情接口旁证 |
| [wanyawan/cls-telegraph-analyzer](https://github.com/wanyawan/cls-telegraph-analyzer) | 电报分析 Skill（MIT），分析维度参考 |
| TrendRadar 及各类聚合 MCP | 多平台热点聚合（含财联社），偏推送场景，未直接集成 |

实现取协议层（Host 半端直接拉取，60s TTL），不引入 MCP 常驻进程：MCP 工具面向会话内
Agent 调用，而看板需要的是低频、可缓存、无会话的结构化快讯。数据字段：`ctime/level/
title/content/stock_list/subjects`。

## 数据源（两级）

| 模式 | 说明 |
| --- | --- |
| **桥接**（唯一数据源） | 运行 `bridge/tdx_bridge.py`，把通达信 TdxAiData（tqs）包装为 `http://127.0.0.1:7350` 本地服务 |
| **缓存**（断开兜底） | 桥接断开时展示最近一次成功数据（localStorage 快照），绝不展示模拟行情 |

### 启用真实数据（TdxAiData）

桥接按 **`--dir` 参数 → `TDXAIDATA_DIR` 环境变量 → `TDXAIDATA_DIR.txt` → pip 安装模式**
的顺序定位运行库；pip 模式下直接 `import tdxaidata` 并自动定位其 `lib/TdxAiData.ini`，
路径文件失效（换机/移动）也会自动兜底。

**换电脑部署（三步）**：

```powershell
git clone https://github.com/6mingxinliu/stock-dashboard-plugin-dsh.git
pip install -r stock-dashboard-plugin-dsh/bridge/requirements.txt   # tdxaidata + akshare
python stock-dashboard-plugin-dsh/bridge/tdx_bridge.py              # 或在看板点「服务·开」自动拉起
```

然后打开看板 ⚙ 设置 → 粘贴数据服务 Key（写入 `TdxAiData.ini [Token]`，自动重启桥接）。
运行库定位已全自动：**无需任何路径文件**（`TDXAIDATA_DIR.txt` 已移除）；老式目录部署
（DLL 松散文件）仍可用 `--dir` / 环境变量指定。
**依赖自动下载**：插件安装时（pnpm postinstall）与桥接每次启动时都会自动
`pip install` 缺失的 `tdxaidata` / `akshare`，换机零手工。

手动启动桥接（可选）：

```powershell
python bridge/tdx_bridge.py   # 命令行手动启动；平时由看板「服务·开」自动拉起
```

或在看板顶栏保持「**服务·开**」：通过已注册的 `tdxbridge://` 协议处理器
（HKCU 软件类，pythonw 无窗口启动）自动拉起本机桥接，首次浏览器会弹一次
"打开 tdxbridge?"确认，可勾选始终允许；断开时也可手动点「**重连**」。
重复拉起有单实例保护（端口占用自动退出）。

看板每 4 秒自动探测，徽标变绿（"桥接"）即接入真实行情，无需刷新页面；
断开时徽标变黄（"缓存 HH:MM"），展示最近缓存，重连后自动更新。

接口契约见 `bridge/tdx_bridge.py` 文件头注释。涨速榜使用服务端 `Zangsu` 栏目；
涨停榜按 `ZTDateNum`（连续涨停天数）排序并用 `get_zdt_data` 补充首板时间/开板次数
（该接口需通达信客户端短线宝权限，无权限时自动降级）；
`/global` 来自 `get_global_data(type=0)`（涨跌家数、涨停/跌停/炸板数、最高连板、沪深成交额）。
v1.2 新增：`POST /config`（写 `[Token]` 节）与 `POST /shutdown`（优雅退出，看板自动重拉），
供设置弹窗在线换 Token；`GET /config` 返回掩码 Token 与 INI 路径。
v1.3 新增：`GET /search?q=` —— 基于 `get_stock_list(market='5', list_type=1)` 的全量
A股列表（进程内缓存）做代码前缀 / 名称精确·前缀·包含匹配，返回最多 8 条 `{code,name}`，
供备选列表按名称添加。
v1.6 变更：`GET /hot_rank`（东财人气榜 TOP10，getAllCurrentList + push2 行情，含名次变化）
替代雪球源；`GET /rank/sectors` 改由 **AKShare**（`stock_board_industry_name_em` +
`stock_board_concept_name_em`，行业+概念合并涨跌幅榜）供数，300s TTL，AKShare 不可用
自动回退 TDX domain=10004。AKShare 依赖 `pip install akshare`（实测 v1.20.22）；
桥接启动时会把 pythonw 的 None stdout/stderr 指向 devnull（akshare 的 tqdm 必需）。

## 设计迭代（OpenDesign）

设计源文件在 OpenDesign 项目 `stock-dashboard`（SPEC.md / preview.html / baseline.png，
深蓝黑终端风：`#0a0e13` 底、`#ff5f5f` 红涨、`#2ed47f` 绿跌、琥珀 `#f2b544` 强调、等宽数字）。
已按 SPEC 落回插件的差异：头部市场宽度条（涨/跌/涨停/跌停/炸板/成交额）、指数条涨跌额 + 迷你走势、
涨速榜横向比例条、涨停榜「N连板/首板」琥珀标签、日K 空心阳线。看板结构遵循设计稿，
表面色仍用 `--dsw-alias-*` 主题 token 以适配 Harness 亮/暗主题。

## 图表库调研（GitHub）

| 库 | 特点 | 结论 |
| --- | --- | --- |
| [klinecharts/KLineChart](https://github.com/klinecharts/KLineChart) | 专业级 K 线图库，零依赖，内置 MACD/VOL/MA 等数十种指标，支持自定义指标、分时图样式，MIT | **外部图表库首选**；后续如需更复杂交互可直接引入其 UMD 产物 |
| [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | TradingView 官方，性能极好，蜡烛图+成交量，MACD 需自行叠加 pane，Apache-2.0 | 备选，指标需手工组合 |
| [apache/echarts](https://github.com/echarts/echarts) | 通用可视化，candlestick 内置，指标全部手写，Apache-2.0 | 备选，体积大 |

**本插件实现**：受插件运行时「无构建、无外部 CDN、仅 Host 内置 React」约束，图表采用
内置 Canvas 渲染器（约 300 行）：日K 蜡烛 + MA、成交量、MACD（EMA12/26 → DIF、DEA=EMA9(DIF)、
柱=2×(DIF−DEA)，与通达信/主流行情软件算法一致）、分时图（价格+均价+昨收基准），
支持 DPR 高清与十字光标。选型结论与上表一致，未来需要更重的图表能力时优先迁移 klinecharts。

## 菜单图标

侧边栏菜单图标使用 [Tabler Icons](https://tabler.io/icons) 的
`chart-candle`（MIT，Iconify 内联路径），描边线宽 1.4 细线、`currentColor` 跟随主题；
包图标 `icon.svg` 仍使用 xicons 的 `ic:round-candlestick-chart`（Apache-2.0）。

## 架构

```
@local/stock-dashboard
├── package.json        # dsh.bundle.patch + dsh.client(web)
├── cordis.patch.yml    # insert: stock-dashboard
├── index.js            # Host 半端：/stock-dashboard/api/{news,score,monitor} 三条
│                       #   webServer 路由（connection 信任门 + LLM/财联社 + 缓存节流）
├── client.js           # Client 模块：sidebar.panellist 菜单项 + main 面板 + 图表 + AI 面板 + 数据层
├── locale/*.json       # 插件元数据（中/英）
├── icon.svg            # xicons 蜡烛图图标
└── bridge/tdx_bridge.py # 本地 TDX 桥接（不打包进 bundle）
```

### 布局（v1.4）

- 主表区（左上）：备选股 / 涨速冲板（可在设置隐藏）/ 涨停榜，列为 ★ · 名称/代码 · 分时 ·
  最新价 · 涨跌额 · 涨跌幅 · AI分（冲板榜为「冲板AI」概率）· 涨速 · 成交额 …（无序号列）
- 指数条：四只指数卡片，**点击弹出图表**（日K / 分时切换）
- 侧栏（右，272px）：AI 异动监控面板
- **热门三栏区（主表下方）**：热门板块（涨幅 TOP10 + AI分）| 热门股（TOP8）| 财联社电报；
  窄屏折叠为单列
- 顶栏（右）：数据服务开关（旋钮色=连接状态）· 重连 · 暂停/继续 · 刷新 · ⚙设置

## 交互与渲染性能

- **列表内嵌分时**：每行"分时"列为 SVG 迷你走势（60 点降采样，memo 化），数据经
  `MinuteStore` 预取（`/minute_batch` 每批 8 只、60s TTL、去重、空闲时段调度）
- **悬停日K**：鼠标悬停股票名约 0.2s 弹出日K浮窗（滚轮缩放可视K线数、拖拽平移、
  十字光标联动图例与轴标签、Esc 关闭）；点击名称可固定浮窗
- **预加载管线**（及时渲染方案，参考 GitHub 行情类应用通用模式——预取队列 +
  TTL 缓存 + 请求去重 + 两层 canvas 分离重绘）：榜单更新时对前 24 只在
  `requestIdleCallback` 中预热分时与日K，悬停时数据已就位、即点即现
- **桥接侧缓存**：全部端点带 TTL（榜单 3s / 分时 60s / 日K 300s），
  4s 轮询对 DLL 几乎零压力

挂载点：`sidebar.panellist`（左侧菜单图标，id=`stock-dashboard`）→ 点击后 `main`
（keyed slot）按同 id 渲染看板组件。样式全部使用 `--dsw-alias-*` 主题 token，
红涨绿跌为行业惯例的艺术色。
