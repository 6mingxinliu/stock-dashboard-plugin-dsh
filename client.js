window.__ModuleLoader__.load({
  id: '@local/stock-dashboard',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;

    // ---------------------------------------------------------------------------
    // Terminal artwork palette (per the approved OpenDesign baseline)
    // ---------------------------------------------------------------------------
    const ACCENT = '#f2b544';
    const UP = '#ff5f5f';
    const DOWN = '#2ed47f';
    const MA_COLORS = ['#f2b544', '#5b9bd5', '#b07ce8'];
    const BLUE = '#5b9bd5';

    const CSS = `
.sdb{--bg:var(--dsw-alias-bg-base);--s1:var(--dsw-alias-bg-layer-1);--s2:var(--dsw-alias-bg-layer-2);--s3:var(--dsw-alias-bg-layer-2);--ln:var(--dsw-alias-border-l1);--ln2:var(--dsw-alias-border-l2);
  --tx:var(--dsw-alias-label-primary);--tx2:var(--dsw-alias-label-secondary);--tx3:var(--dsw-alias-label-secondary);--up:#ff5f5f;--down:#2ed47f;--ac:#f2b544;--fk:var(--dsw-alias-brand-primary);
  height:100%;display:flex;flex-direction:column;background:var(--bg);color:var(--tx);
  font-family:PingFang SC,Hiragino Sans GB,Microsoft YaHei,system-ui,sans-serif;min-width:0}
.sdb *,.sdb{box-sizing:border-box}
.sdb-num{font-family:ui-monospace,SFMono-Regular,Cascadia Mono,Consolas,monospace;font-variant-numeric:tabular-nums}
.sdb-top{display:flex;flex-wrap:nowrap;align-items:center;gap:14px;height:44px;padding:0 16px;background:var(--s1);border-bottom:1px solid var(--ln);flex:none;overflow:hidden}
.sdb-top>*{flex:none}
.sdb-brand{font-size:14px;font-weight:700;white-space:nowrap}
.sdb-brand small{color:var(--tx3);font-size:10px;font-weight:400;letter-spacing:2px;margin-left:6px}
.sdb-stats{display:flex;gap:14px;font-size:12px;color:var(--tx2);white-space:nowrap;overflow:hidden}
.sdb-stats b{font-weight:600;color:var(--tx)}
.sdb-up{color:var(--up)!important}.sdb-down{color:var(--down)!important}.sdb-ac{color:var(--ac)!important}
.sdb-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--tx2);border:1px solid var(--ln2);border-radius:2px;padding:2px 8px;white-space:nowrap}
.sdb-dot{width:7px;height:7px;border-radius:50%;background:var(--tx3)}
.sdb-dot.ok{background:var(--down)}.sdb-dot.no{background:var(--ac)}
.sdb-btn{appearance:none;border:1px solid var(--ln2);background:var(--s2);color:var(--tx);font-size:12px;padding:4px 12px;border-radius:2px;cursor:pointer;line-height:18px;flex:none;white-space:nowrap}
.sdb-btn:hover{border-color:var(--tx3)}
.sdb-btn:focus-visible{outline:2px solid var(--fk);outline-offset:1px}
.sdb-btn.acc{border-color:var(--ac);color:var(--ac);font-weight:600}
.sdb-idx{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--ln);border-bottom:1px solid var(--ln);flex:none}
.sdb-idx-c{background:var(--bg);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}
.sdb-idx-n{font-size:11px;color:var(--tx2);white-space:nowrap}
.sdb-idx-p{font-size:22px;font-weight:600;line-height:1.15}
.sdb-idx-c2{font-size:11px;white-space:nowrap}
.sdb-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 272px;gap:1px;background:var(--ln)}
.sdb-p{background:var(--s1);display:flex;flex-direction:column;min-height:0;min-width:0}
.sdb-side{display:flex;flex-direction:column;min-height:0;overflow:auto;background:var(--s1)}
.sdb-ph{display:flex;align-items:baseline;justify-content:space-between;padding:12px 16px 8px}
.sdb-pt{font-size:13px;font-weight:600}
.sdb-ps{font-size:11px;color:var(--tx3)}
.sdb-tabs{display:flex;gap:20px;padding:0 16px;height:40px;align-items:stretch;border-bottom:1px solid var(--ln);flex:none}
.sdb-tab{appearance:none;background:none;border:none;border-bottom:2px solid transparent;color:var(--tx2);font-size:13px;cursor:pointer;padding:0 2px}
.sdb-tab:hover{color:var(--tx)}
.sdb-tab.on{color:var(--tx);font-weight:600;border-bottom-color:var(--ac)}
.sdb-tab:focus-visible{outline:2px solid var(--fk);outline-offset:-2px}
.sdb-tabs .cnt{font-size:11px;color:var(--tx3);margin-left:4px}
.sdb-tabs .cnt.on{color:var(--ac)}
.sdb-tool{display:flex;gap:8px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--ln);flex:none}
.sdb-in{background:var(--s2);border:1px solid var(--ln2);border-radius:2px;color:var(--tx);font-size:12px;padding:5px 10px;width:170px;outline:none}
.sdb-in:focus{border-color:var(--fk)}
.sdb-in::placeholder{color:var(--tx3)}
.sdb-q{width:200px}
.sdb-chip{font-size:11px;color:var(--tx3);border:1px solid var(--ln2);background:none;border-radius:2px;padding:2px 8px;cursor:pointer}
.sdb-chip:hover{color:var(--ac);border-color:var(--ac)}
.sdb-twrap{overflow:auto;flex:1;min-height:0}
.sdb-time{color:var(--tx3);font-size:11px;flex:none}
.sdb-t{width:100%;border-collapse:collapse;font-size:12.5px;min-width:940px}
.sdb-t th{position:sticky;top:0;background:var(--s2);color:var(--tx2);font-weight:500;font-size:11px;text-align:right;padding:7px 10px;white-space:nowrap;z-index:1}
.sdb-t td{text-align:right;padding:6px 10px;border-top:1px solid var(--ln);white-space:nowrap;color:var(--tx)}
.sdb-t .l{text-align:left}
.sdb-t tbody tr{cursor:default}
.sdb-t tbody tr:hover{background:var(--s2)}
.sdb-nm{font-weight:600;cursor:context-menu;border-bottom:1px dotted transparent}
.sdb-nm:hover{border-bottom-color:var(--tx3)}
.sdb-cd{color:var(--tx3);font-size:11px;margin-left:6px}
.sdb-tag{display:inline-block;background:rgba(242,181,68,.14);color:var(--ac);font-size:10px;line-height:16px;padding:0 5px;border-radius:2px;font-weight:600;margin-left:6px;vertical-align:1px}
.sdb-star{appearance:none;border:none;background:none;color:var(--tx3);cursor:pointer;font-size:13px;padding:0 2px}
.sdb-star.on{color:var(--ac)}
.sdb-del{appearance:none;border:none;background:none;color:var(--tx3);cursor:pointer;font-size:12px;padding:2px 6px;border-radius:2px}
.sdb-del:hover{color:var(--up);background:var(--s3)}
.sdb-bar{display:inline-block;width:52px;height:5px;border-radius:3px;background:var(--s3);overflow:hidden;vertical-align:2px;margin-right:8px}
.sdb-bar i{display:block;height:100%;border-radius:3px}
.sdb-mini{display:block}
.sdb-mskel{display:inline-block;width:96px;height:22px;border-radius:2px;background:linear-gradient(90deg,var(--s2) 25%,var(--s3) 50%,var(--s2) 75%);background-size:200% 100%;animation:sdb-sh 1.2s infinite}
@keyframes sdb-sh{to{background-position:-200% 0}}
.sdb-sec{display:grid;grid-template-columns:minmax(0,1fr) 90px 46px 30px;gap:8px;align-items:center;font-size:11.5px;padding:4px 14px}
.sdb-sec .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sdb-sec .nmw{display:flex;align-items:center;gap:5px;min-width:0}
.sdb-sec .nmw .nm{flex:0 1 auto;min-width:0}
.sdb-sec .nmw .sdb-kind{flex:none}
.sdb-sec .bg{height:8px;border-radius:2px;background:var(--s3);position:relative;overflow:hidden}
.sdb-sec .bg i{position:absolute;top:0;bottom:0;border-radius:2px}
.sdb-hot{display:grid;grid-template-columns:20px minmax(0,1fr) 52px 56px;gap:8px;align-items:center;font-size:11.5px;padding:4px 14px}
.sdb-hot:hover{background:var(--s2)}
.sdb-hot .rk{color:var(--tx3);font-weight:600}
.sdb-hot .rk.top{color:var(--up)}
.sdb-hot .nm2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:context-menu}
.sdb-empty{padding:32px 0;text-align:center;color:var(--tx3);font-size:12px}
.sdb-foot{height:26px;display:flex;align-items:center;gap:16px;padding:0 16px;background:var(--s1);border-top:1px solid var(--ln);font-size:11px;color:var(--tx3);flex:none;white-space:nowrap;overflow:hidden}
.sdb-hover{position:fixed;z-index:90;width:560px;background:var(--s1);border:1px solid var(--ln2);border-radius:4px;padding:10px 12px;box-shadow:0 14px 40px rgba(0,0,0,.5)}
.sdb-hover .hd{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.sdb-hover .nm{font-size:15px;font-weight:600}
.sdb-hover .px{font-size:18px;font-weight:600}
.sdb-legend{display:flex;gap:12px;margin-top:6px;font-size:11px;color:var(--tx3);flex-wrap:wrap;align-items:center}
.sdb-loading{padding:30px 0;text-align:center;color:var(--tx3);font-size:12px;letter-spacing:2px}
.sdb-spin{display:inline-block;width:14px;height:14px;border:2px solid var(--ln2);border-top-color:var(--ac);border-radius:50%;margin-right:8px;vertical-align:-2px;animation:sdb-r .8s linear infinite}
@keyframes sdb-r{to{transform:rotate(360deg)}}
/* --- AI 评分 / 异动监控 / 财联社电报 --- */
.sdb-aisec{border-bottom:1px solid var(--ln);flex:none}
.sdb-aihd{display:flex;align-items:center;gap:6px;padding:12px 12px 6px}
.sdb-sw{appearance:none;border:1px solid var(--ln2);background:var(--s2);color:var(--tx3);font-size:11px;padding:2px 9px;border-radius:2px;cursor:pointer;line-height:16px;white-space:nowrap}
.sdb-sw:hover{color:var(--tx);border-color:var(--tx3)}
.sdb-sw.on{color:var(--ac);border-color:var(--ac);font-weight:600}
.sdb-sw:focus-visible{outline:2px solid var(--fk);outline-offset:1px}
.sdb-aihint{padding:0 12px 8px;font-size:10.5px;color:var(--tx3);line-height:1.6}
.sdb-aihint b{color:var(--ac);font-weight:600}
.sdb-rep{margin:0 10px 8px;border:1px solid var(--ln2);border-radius:3px;padding:8px 10px;background:var(--s2)}
.sdb-rep .hd{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.sdb-lvl{font-size:10px;line-height:16px;padding:0 6px;border-radius:2px;font-weight:700;flex:none}
.sdb-lvl.high{background:rgba(255,95,95,.16);color:var(--up)}
.sdb-lvl.mid{background:rgba(242,181,68,.16);color:var(--ac)}
.sdb-lvl.low{background:rgba(91,155,213,.18);color:#5b9bd5}
.sdb-lvl.none{background:var(--s3);color:var(--tx3)}
.sdb-rep .tt{font-size:12.5px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sdb-rep .tm{font-size:10px;color:var(--tx3);margin-left:auto;flex:none}
.sdb-rep .ln{font-size:11.5px;color:var(--tx2);line-height:1.65;margin-top:3px;word-break:break-all}
.sdb-rep .ln b{color:var(--tx3);font-weight:600}
.sdb-rep .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:5px}
.sdb-rep .tag2{font-size:10px;color:var(--tx3);border:1px solid var(--ln2);padding:0 5px;line-height:15px;border-radius:2px}
.sdb-repft{display:flex;align-items:center;gap:10px;padding:0 12px 10px;font-size:10.5px;color:var(--tx3);flex-wrap:wrap}
.sdb-repft .lnk{appearance:none;border:none;background:none;color:var(--fk);cursor:pointer;font-size:10.5px;padding:0}
.sdb-repft .lnk:hover{text-decoration:underline}
.sdb-repft .dis{color:var(--up);opacity:.9}
.sdb-err{padding:0 12px 8px;font-size:11px;color:var(--up);word-break:break-all}
.sdb-news{max-height:190px;overflow:auto;padding-bottom:6px}
.sdb-nw{display:grid;grid-template-columns:30px 12px minmax(0,1fr);gap:5px;padding:3px 12px;font-size:11.5px;align-items:baseline}
.sdb-nw:hover{background:var(--s2)}
.sdb-nw .tm{color:var(--tx3);font-size:10.5px}
.sdb-nw .dt{width:7px;height:7px;border-radius:50%;align-self:center}
.sdb-nw .dt.A{background:var(--up)}
.sdb-nw .dt.B{background:var(--ac)}
.sdb-nw .dt.C{background:var(--tx3)}
.sdb-nw .tx{color:var(--tx2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sdb-nw .tx b{color:var(--tx);font-weight:600}
.sdb-nw .st{color:var(--tx3);font-size:10px;margin-left:4px}
.sdb-score{display:inline-block;min-width:30px;text-align:center;font-size:10.5px;line-height:16px;padding:0 4px;border-radius:2px;font-weight:600}
.sdb-score.up{background:rgba(255,95,95,.14);color:var(--up)}
.sdb-score.down{background:rgba(46,212,127,.14);color:var(--down)}
.sdb-score.flat{background:var(--s3);color:var(--tx3)}
.sdb-score.mid{background:rgba(242,181,68,.16);color:var(--ac)}
.sdb-score.none{color:var(--tx3);background:none;min-width:14px}
/* --- 设置弹窗 / 顶栏齿轮 --- */
.sdb-icon-btn{appearance:none;border:1px solid var(--ln2);background:var(--s2);color:var(--tx2);width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border-radius:2px;cursor:pointer;flex:none}
.sdb-icon-btn:hover{color:var(--ac);border-color:var(--ac)}
.sdb-icon-btn:focus-visible{outline:2px solid var(--fk);outline-offset:1px}
.sdb-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:120;display:flex;align-items:center;justify-content:center}
.sdb-modal{width:520px;max-width:calc(100vw - 48px);max-height:calc(100vh - 96px);display:flex;flex-direction:column;background:var(--s1);border:1px solid var(--ln2);border-radius:4px;box-shadow:0 18px 50px rgba(0,0,0,.5)}
.sdb-mhd{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid var(--ln);flex:none}
.sdb-mbody{padding:12px 16px;overflow:auto;min-height:0}
.sdb-ms{font-size:11px;color:var(--tx3);letter-spacing:1px;margin:10px 0 6px;font-weight:600}
.sdb-ms:first-child{margin-top:0}
.sdb-setrow{display:flex;align-items:center;gap:10px;padding:4px 0}
.sdb-setrow.sdb-wrap{flex-wrap:wrap;gap:8px 18px}
.sdb-ck{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--tx);cursor:pointer;user-select:none}
.sdb-ck input{accent-color:var(--ac);width:14px;height:14px;cursor:pointer}
.sdb-sel{background:var(--s2);border:1px solid var(--ln2);border-radius:2px;color:var(--tx);font-size:12px;padding:5px 8px;max-width:420px;outline:none}
.sdb-sel:focus{border-color:var(--fk)}
.sdb-ok{font-size:11.5px;color:var(--down)}
.sdb-mft{display:flex;align-items:center;gap:12px;padding:10px 16px;border-top:1px solid var(--ln);font-size:10.5px;color:var(--tx3);flex:none}
/* --- 热门双栏区（主表之下） --- */
.sdb-hotstrip{flex:none;display:grid;grid-template-columns:1.1fr 1fr 1.1fr;gap:1px;background:var(--ln);border-top:1px solid var(--ln);height:212px}
.sdb-strip-scroll{overflow:auto;min-height:0;flex:1}
.sdb-hotstrip .sdb-p{min-height:0}
.sdb-np{display:flex;flex-direction:column;min-height:0}
.sdb-np .sdb-news{flex:1;min-height:0;max-height:none;padding-bottom:0}
/* --- 指数卡片可点击 --- */
.sdb-idx-click{cursor:pointer}
.sdb-idx-click:hover{background:var(--s2)}
.sdb-idx-click:focus-visible{outline:2px solid var(--fk);outline-offset:-2px}
/* --- 弹窗日K/分时切换 --- */
.sdb-vtabs{display:inline-flex;border:1px solid var(--ln2);border-radius:3px;overflow:hidden;flex:none}
.sdb-vtab{appearance:none;border:none;background:var(--s2);color:var(--tx3);font-size:11px;padding:3px 12px;cursor:pointer;line-height:16px}
.sdb-vtab + .sdb-vtab{border-left:1px solid var(--ln2)}
.sdb-vtab:hover{color:var(--tx)}
.sdb-vtab.on{background:rgba(242,181,68,.16);color:var(--ac);font-weight:600}
.sdb-vtab:focus-visible{outline:2px solid var(--fk);outline-offset:-2px}
/* --- 数据服务开关（状态+按钮合并） --- */
.sdb-switch{appearance:none;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--ln2);background:var(--s2);border-radius:16px;padding:3px 12px 3px 4px;cursor:pointer;font-size:12px;color:var(--tx);flex:none}
.sdb-switch:hover{border-color:var(--tx3)}
.sdb-switch:focus-visible{outline:2px solid var(--fk);outline-offset:1px}
.sdb-knob{width:30px;height:18px;border-radius:10px;background:var(--s3);position:relative;flex:none;border:1px solid var(--ln2)}
.sdb-knob i{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--tx3);transition:left .16s cubic-bezier(.2,.7,.3,1),background .16s}
.sdb-knob.live{background:rgba(46,212,127,.22)}
.sdb-knob.live i{left:14px;background:var(--down)}
.sdb-knob.cache{background:rgba(242,181,68,.22)}
.sdb-knob.cache i{left:14px;background:var(--ac)}
.sdb-knob.off i{background:var(--tx3)}
.sdb-switch-tx{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15;white-space:nowrap}
.sdb-switch-tx b{font-size:11.5px;font-weight:600;color:var(--tx)}
.sdb-switch-sub{font-size:9.5px;color:var(--tx3)}
.sdb-switch-sub.live{color:var(--down)}
.sdb-switch-sub.cache{color:var(--ac)}
/* --- Toast 轻提示 --- */
.sdb-toasts{position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:200;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
.sdb-toast{background:var(--s2);border:1px solid var(--ln2);color:var(--tx);font-size:12px;padding:7px 16px;border-radius:4px;box-shadow:0 10px 30px rgba(0,0,0,.4);animation:sdb-toast-in .18s cubic-bezier(.2,.7,.3,1)}
.sdb-toast.err{border-color:rgba(255,95,95,.5);color:var(--up)}
.sdb-toast.warn{border-color:rgba(242,181,68,.5);color:var(--ac)}
@keyframes sdb-toast-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
/* --- 设置弹窗卡片化 --- */
.sdb-card{border:1px solid var(--ln);border-radius:4px;padding:10px 12px;margin-bottom:10px;background:var(--bg)}
.sdb-card .sdb-ms{margin:0 0 8px}
.sdb-cardrow{display:flex;align-items:center;gap:12px;padding:3px 0;flex-wrap:wrap}
.sdb-hint{font-size:10.5px;color:var(--tx3);line-height:1.6;padding:5px 2px 0}
.sdb-card .sdb-in.sdb-in-wide{flex:1;width:auto;min-width:0}
.sdb-card .sdb-sel{flex:1;width:auto;min-width:0}
.sdb-lnk{color:var(--fk);text-decoration:none;word-break:break-all}
.sdb-lnk:hover{text-decoration:underline}
/* --- 迷你开关（设置项） --- */
.sdb-msw{appearance:none;display:inline-flex;align-items:center;gap:8px;border:none;background:none;cursor:pointer;padding:2px 0;font-size:12.5px;color:var(--tx)}
.sdb-msw:focus-visible{outline:2px solid var(--fk);outline-offset:2px;border-radius:2px}
.sdb-msw-track{width:28px;height:16px;border-radius:9px;background:var(--s3);border:1px solid var(--ln2);position:relative;flex:none}
.sdb-msw-knob{position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:var(--tx3);transition:left .16s cubic-bezier(.2,.7,.3,1),background .16s}
.sdb-msw.on .sdb-msw-track{background:rgba(242,181,68,.25);border-color:var(--ac)}
.sdb-msw.on .sdb-msw-knob{left:14px;background:var(--ac)}
.sdb-msw-lab{user-select:none}
/* --- v1.5 视觉精修 --- */
.sdb ::-webkit-scrollbar{width:8px;height:8px}
.sdb ::-webkit-scrollbar-thumb{background:var(--ln2);border-radius:4px}
.sdb ::-webkit-scrollbar-thumb:hover{background:var(--tx3)}
.sdb ::-webkit-scrollbar-track{background:transparent}
.sdb-top{box-shadow:inset 0 -1px 0 var(--ln),0 1px 8px rgba(0,0,0,.14)}
.sdb-idx-c{transition:background-color .16s cubic-bezier(.2,.7,.3,1)}
.sdb-hotstrip .sdb-ph{border-bottom:1px solid var(--ln);padding-bottom:7px}
.sdb-hotstrip .sdb-pt{letter-spacing:.5px}
.sdb-toast{border-left:3px solid var(--fk);border-radius:4px}
.sdb-toast.err{border-left-color:var(--up)}
.sdb-toast.warn{border-left-color:var(--ac)}
.sdb-t th{letter-spacing:.3px}
.sdb-empty{padding:26px 0}
.sdb-kind{font-size:9.5px;color:var(--tx3);border:1px solid var(--ln2);border-radius:2px;padding:0 3px;margin-left:5px;vertical-align:1px}
.sdb-hot .rkch{font-size:9.5px;margin-left:5px;color:var(--tx3)}
.sdb-hot .rkch.up{color:var(--up)}
.sdb-hot .rkch.down{color:var(--down)}
@media (prefers-reduced-motion:no-preference){.sdb-t tbody tr,.sdb-btn,.sdb-tab{transition:background-color .16s cubic-bezier(.2,.7,.3,1),color .16s,border-color .16s}}
@media (max-width:1200px){.sdb-stats{display:none}}
@media (max-width:1100px){.sdb-body{grid-template-columns:1fr}.sdb-side{max-height:340px}.sdb-hotstrip{grid-template-columns:1fr;height:auto}.sdb-hotstrip .sdb-p{height:190px}}
@media (max-width:1000px){.sdb-time{display:none}.sdb-brand small{display:none}.sdb-top{gap:8px;padding:0 10px}}
@media (max-width:860px){.sdb-idx{grid-template-columns:repeat(2,1fr)}.sdb-tool{flex-wrap:wrap}}
`;

    // ---------------------------------------------------------------------------
    // Formatting helpers
    // ---------------------------------------------------------------------------
    function fmtNum(v, d = 2) {
      if (v == null || !isFinite(v)) return '--';
      return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
    }
    function fmtPct(v, d = 2) {
      if (v == null || !isFinite(v)) return '--';
      return (v > 0 ? '+' : '') + v.toFixed(d) + '%';
    }
    function fmtAmount(v) {
      if (v == null || !isFinite(v)) return '--';
      if (v >= 1e12) return (v / 1e12).toFixed(2) + '万亿';
      if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿';
      if (v >= 1e4) return (v / 1e4).toFixed(1) + '万';
      return String(Math.round(v));
    }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function pctClass(v) { return v > 0 ? 'sdb-up' : v < 0 ? 'sdb-down' : ''; }
    function fmtSigned(v, d = 2) {
      if (v == null || !isFinite(v)) return '--';
      return (v > 0 ? '+' : '') + fmtNum(v, d);
    }
    const idle = (fn, ms) => {
      if (typeof requestIdleCallback === 'function') requestIdleCallback(fn, { timeout: ms || 1500 });
      else setTimeout(fn, ms || 200);
    };

    // ---------------------------------------------------------------------------
    // 代码工具（原演示引擎已移除：唯一数据源为 TDX 桥接，断开时显示缓存）
    // ---------------------------------------------------------------------------

    function suffixOf(num) {
      if (/^(6|9)/.test(num)) return 'SH';
      if (/^(4|8)/.test(num)) return 'BJ';
      return 'SZ';
    }
    function normalizeCode(input) {
      const s = String(input || '').trim().toUpperCase();
      if (!s) return null;
      if (/^\d{6}$/.test(s)) return s + '.' + suffixOf(s);
      const m = s.match(/^(\d{6})\.(SH|SZ|BJ)$/);
      if (m) return m[1] + '.' + m[2];
      return null;
    }

    // ---------------------------------------------------------------------------
    // Data layer（仅 TDX 桥接：断开显示最近缓存，连接后自动更新；无演示数据）
    // ---------------------------------------------------------------------------
    const BRIDGE_KEY = 'stock-dashboard.bridge';
    function bridgeBase() {
      try { return localStorage.getItem(BRIDGE_KEY) || 'http://127.0.0.1:7350'; } catch (e) { return 'http://127.0.0.1:7350'; }
    }
    let bridgeOk = null; // true=已连接 false=断开（显示缓存） null=检测中

    // 断开时的行情缓存：仅核心小榜（indices/global/rank/hot_rank），内存 + localStorage
    // （v1.5 性能修复：不再持久化 kline/minute/snapshot 等大对象，避免高频全量序列化卡顿）
    const CORE_PATH = /^\/(indices|global|rank\/|hot_rank)/;
    const BridgeCache = {
      mem: new Map(),
      lastPersist: 0,
      get(path) { return this.mem.get(path) || null; },
      ts(path) { const hit = this.mem.get(path); return hit ? hit.ts : 0; },
      set(path, data) {
        if (!CORE_PATH.test(path)) return;
        this.mem.set(path, { data, ts: Date.now() });
        while (this.mem.size > 16) { const first = this.mem.keys().next().value; this.mem.delete(first); }
        const now = Date.now();
        if (now - this.lastPersist > 60000) { this.lastPersist = now; this.persist(); }
      },
      persist() {
        try {
          const obj = {};
          for (const [k, v] of this.mem) obj[k] = { data: v.data, ts: v.ts };
          localStorage.setItem('stock-dashboard.cache', JSON.stringify(obj));
        } catch (e) { /* 超限则放弃持久化 */ }
      },
      load() {
        try {
          const raw = localStorage.getItem('stock-dashboard.cache');
          if (!raw) return;
          const obj = JSON.parse(raw);
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (v && v.data != null) this.mem.set(k, v);
          }
        } catch (e) { /* ignore */ }
      },
    };
    BridgeCache.load();
    window.addEventListener('pagehide', () => BridgeCache.persist());

    async function fetchJSON(url, timeoutMs = 2500, method, body) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          ...method ? { method } : {},
          ...body !== undefined ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {},
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } finally { clearTimeout(timer); }
    }
    async function bridgeGet(path, timeoutMs) {
      try {
        const data = await fetchJSON(bridgeBase() + path, timeoutMs);
        bridgeOk = true;
        BridgeCache.set(path, data);
        return data;
      } catch (e) {
        bridgeOk = false;
        const hit = BridgeCache.get(path);
        return hit ? hit.data : null;
      }
    }
    function api() {
      return {
        sourceLabel: () => (bridgeOk === true ? '桥接' : bridgeOk === false ? '缓存' : '连接中'),
        indices: () => bridgeGet('/indices'),
        global: () => bridgeGet('/global'),
        speedRank: (n) => bridgeGet('/rank/speed?n=' + n),
        ztRank: (n) => bridgeGet('/rank/zt?n=' + n),
        sectors: (n) => bridgeGet('/rank/sectors?n=' + n),
        hotRank: () => bridgeGet('/hot_rank'), // 东财人气榜前10（桥接 300s TTL → 实际 5 分钟刷新）
        snapshot: (codes) => bridgeGet('/snapshot?codes=' + codes.join(',')),
        kline: (code, count) => bridgeGet('/kline?code=' + code + '&period=1d&count=' + count, 8000),
        minute: (code) => bridgeGet('/minute?code=' + code, 8000),
      };
    }

    // ---------------------------------------------------------------------------
    // AI 层（评分 + 异动监控 + 财联社消息源）
    // 所有设置（AI 开关/服务开关/榜单过滤/默认模型/Token 状态）持久化在 IndexedDB 的
    // 'settings' 记录；首启为默认值，启动后异步恢复（并一次性迁移旧版 localStorage）。
    // AI 仅在「服务开 && 桥接已连接」时工作（演示数据已移除，避免对无效数据打分）。
    // ---------------------------------------------------------------------------
    const SCORE_TTL_MS = 150 * 1000;
    const SET_DEFAULTS = {
      ai: { score: true, monitor: true },
      svc: { on: true },
      prefs: { showSpeed: true, filterKcb: false, filterCyb: false, filterSt: false },
      model: { provider: '', model: '' },
    };
    function mergeDef(def, v) { return v && typeof v === 'object' ? { ...def, ...v } : { ...def }; }
    const Ui = {
      ai: { ...SET_DEFAULTS.ai },
      svc: { ...SET_DEFAULTS.svc },
      prefs: { ...SET_DEFAULTS.prefs },
      model: { ...SET_DEFAULTS.model },
    };
    function saveSettings() {
      IDB.set('settings', { ai: Ui.ai, svc: Ui.svc, prefs: Ui.prefs, model: Ui.model });
    }
    const AiState = {
      score: { bullish: new Map(), limitup: new Map(), tsBullish: 0, tsLimitup: 0, lastAttemptBullish: 0, lastAttemptLimitup: 0, busy: false, error: null },
      monitor: { reports: [], busy: false, error: null, lastCheck: 0, lastAttempt: 0 },
      news: { items: [], ts: 0, error: null },
      hotRows: [],
      tokenInfo: null,       // { tokenMasked, iniPath }（来自桥接 /config）
      scorePayload: null,    // 看涨/看跌：板块 + 备选/涨停/涨速个股
      limitupPayload: null,  // 冲板：涨速综合 Top10 + K线摘要 + 全局情绪
      monitorPayload: null,
      models: null,          // 设置弹窗：DSH 已配置模型目录
    };
    let aiNotify = () => {};

    // 面板切换往返的即时恢复缓存（纯内存，模块级常驻：读写零成本、无序列化）。
    // 卸载/重挂不丢数据；页面刷新后由 4s 轮询重建（断线场景另有离线保底缓存）。
    const DataHub = {
      data: null,   // 最近一次完整行情快照（indices/speed/zt/sectors/hot/watchRows/global）
      ts: 0,
      tab: 'watch',
      paused: false,
    };

    // IndexedDB 持久缓存（浏览器数据库方案，不用 localStorage/sessionStorage）：
    // 异动消息 / 热门股 / 快讯 / 行情快照 在页面刷新后也能即时恢复。
    const IDB = {
      db: null,
      opened: false,
      open() {
        if (this.opened) return Promise.resolve(!!this.db);
        this.opened = true;
        return new Promise((resolve) => {
          try {
            if (typeof indexedDB === 'undefined') { resolve(false); return; }
            const req = indexedDB.open('stock-dashboard', 1);
            req.onupgradeneeded = () => { try { req.result.createObjectStore('kv'); } catch (e) { /* ignore */ } };
            req.onsuccess = () => { this.db = req.result; resolve(!!this.db); };
            req.onerror = () => resolve(false);
          } catch (e) { resolve(false); }
        });
      },
      async get(key) {
        if (!await this.open()) return null;
        return new Promise((resolve) => {
          try {
            const req = this.db.transaction('kv').objectStore('kv').get(key);
            req.onsuccess = () => resolve(req.result == null ? null : req.result);
            req.onerror = () => resolve(null);
          } catch (e) { resolve(null); }
        });
      },
      async set(key, val) {
        if (!await this.open()) return;
        try {
          const tx = this.db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(val, key);
          tx.onerror = () => { /* ignore */ };
        } catch (e) { /* ignore */ }
      },
    };

    // 启动即恢复：设置 / 异动消息 / 热门股 / 快讯 / 行情快照 / Token 信息
    // （设置含一次性旧版 localStorage 迁移；页面刷新后即时回显）
    (async () => {
      try {
        const [reports, hot, news, snap, settings, tokenInfo] = await Promise.all([
          IDB.get('monitorReports'), IDB.get('hotRows'), IDB.get('newsItems'),
          IDB.get('dataSnapshot'), IDB.get('settings'), IDB.get('tokenInfo'),
        ]);
        if (Array.isArray(reports) && reports.length && !AiState.monitor.reports.length) AiState.monitor.reports = reports;
        if (Array.isArray(hot) && hot.length) AiState.hotRows = hot;
        if (Array.isArray(news) && news.length && !AiState.news.items.length) { AiState.news.items = news; AiState.news.ts = Date.now(); }
        if (tokenInfo && typeof tokenInfo === 'object') AiState.tokenInfo = tokenInfo;
        if (settings && typeof settings === 'object') {
          if (settings.ai) Ui.ai = mergeDef(SET_DEFAULTS.ai, settings.ai);
          if (settings.svc) Ui.svc = mergeDef(SET_DEFAULTS.svc, settings.svc);
          if (settings.prefs) Ui.prefs = mergeDef(SET_DEFAULTS.prefs, settings.prefs);
          if (settings.model) Ui.model = mergeDef(SET_DEFAULTS.model, settings.model);
        } else {
          // 旧版 localStorage 设置一次性迁移到 IndexedDB
          const leg = (k, def) => {
            try { const raw = localStorage.getItem(k); return raw ? mergeDef(def, JSON.parse(raw)) : null; } catch (e) { return null; }
          };
          const migrated = {};
          const ai = leg('stock-dashboard.ai', SET_DEFAULTS.ai); if (ai) { Ui.ai = ai; migrated.ai = ai; }
          const svc = leg('stock-dashboard.svc', SET_DEFAULTS.svc); if (svc) { Ui.svc = svc; migrated.svc = svc; }
          const prefs = leg('stock-dashboard.prefs', SET_DEFAULTS.prefs); if (prefs) { Ui.prefs = prefs; migrated.prefs = prefs; }
          const model = leg('stock-dashboard.model', SET_DEFAULTS.model); if (model) { Ui.model = model; migrated.model = model; }
          if (Object.keys(migrated).length) IDB.set('settings', migrated);
        }
        if (snap && typeof snap === 'object' && !DataHub.data) {
          DataHub.data = { ...{ indices: [], speed: [], zt: [], sectors: [], hot: [], watchRows: [], global: null }, ...snap };
          DataHub.ts = snap.__ts || Date.now();
        }
        aiNotify();
      } catch (e) { /* IDB 不可用则跳过恢复 */ }
    })();

    // 轻提示（添加成功/未找到/失败等），3s 自动消失
    const Toasts = {
      list: [],
      seq: 0,
      notify(msg, kind) {
        const id = ++Toasts.seq;
        Toasts.list = Toasts.list.concat([{ id, msg, kind: kind || 'info' }]);
        aiNotify();
        setTimeout(() => {
          Toasts.list = Toasts.list.filter((t) => t.id !== id);
          aiNotify();
        }, 3000);
      },
    };

    // 过滤：科创板(68)/创业板(30)/ST —— 作用于涨速冲板、涨停、热门股等全市场榜单
    function passesFilters(r, prefs) {
      const code = String(r.code || '');
      if (prefs.filterKcb && /^68/.test(code)) return false;
      if (prefs.filterCyb && /^30/.test(code)) return false;
      if (prefs.filterSt && /ST/i.test(String(r.name || ''))) return false;
      return true;
    }
    // 涨速冲板排序：涨速为主要排序；涨幅 ≥5% 作为次要排序（同速时优先），其后按涨幅
    function compositeSpeedRows(rows, prefs) {
      const pool = (rows || []).filter((r) => passesFilters(r, prefs) && r && r.code);
      return pool.sort((a, b) =>
        (Number(b.speed) || -999) - (Number(a.speed) || -999)
        || ((Number(b.pct) >= 5 ? 1 : 0) - (Number(a.pct) >= 5 ? 1 : 0))
        || (Number(b.pct) || -999) - (Number(a.pct) || -999));
    }
    // 冲板 AI 用的 K 线摘要（来自已预加载的日K缓存；无缓存返回 null）
    function klineSummary(code) {
      const bars = KlineStore.peek(code);
      if (!bars || bars.length < 12) return null;
      const n = Math.min(10, bars.length);
      const seg = bars.slice(-n);
      const upCnt = seg.filter((b) => b.close >= b.open).length;
      const ref = bars.length > n ? bars[bars.length - n - 1].close : bars[0].open;
      const chg = ref ? (seg[seg.length - 1].close / ref - 1) * 100 : 0;
      const closes = bars.map((b) => b.close);
      const ma5Arr = calcMa(closes, 5);
      const ma5 = ma5Arr[ma5Arr.length - 1];
      const devMa5 = ma5 ? (seg[seg.length - 1].close / ma5 - 1) * 100 : null;
      const vols = bars.map((b) => b.volume || 0);
      const sum = (a) => a.reduce((x, y) => x + y, 0);
      const vPrev = vols.slice(-10, -5);
      const vr = vPrev.length && sum(vPrev) > 0 ? sum(vols.slice(-5)) / sum(vPrev) : null;
      const hi = Math.max(...bars.slice(-Math.min(60, bars.length)).map((b) => b.high));
      const distHi = (seg[seg.length - 1].close / hi - 1) * 100;
      return `近${n}日${upCnt}阳 累计${chg > 0 ? '+' : ''}${chg.toFixed(1)}%`
        + (devMa5 != null ? ` 现价${devMa5 >= 0 ? '高于' : '低于'}MA5 ${Math.abs(devMa5).toFixed(1)}%` : '')
        + (vr != null ? ` 量比${vr.toFixed(1)}` : '')
        + ` 距阶段高点${distHi.toFixed(1)}%`;
    }

    async function sameOriginJSON(path, method, body, timeoutMs) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(path, {
          method,
          signal: ctrl.signal,
          ...body !== undefined ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {},
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } finally { clearTimeout(timer); }
    }
    function buildScorePayload(data) {
      const sectors = (data.sectors || []).slice(0, 10).map((s) => ({ name: s.name, pct: s.pct, leader: s.leader, leaderPct: s.leaderPct }));
      const seen = new Set();
      const stocks = [];
      const push = (r) => {
        if (r && r.code && !seen.has(r.code) && stocks.length < 36) {
          seen.add(r.code);
          stocks.push({ code: r.code, name: r.name, pct: r.pct, speed: r.speed, now: r.now, amount: r.amount, turnover: r.turnover, days: r.days });
        }
      };
      (data.watchRows || []).forEach(push);
      (data.zt || []).slice(0, 15).forEach(push);
      return { sectors, stocks };
    }
    function buildLimitupPayload(data, prefs) {
      const rows = compositeSpeedRows(data.speed, prefs).slice(0, 10);
      return {
        global: data.global || null,
        stocks: rows.map((r) => ({
          code: r.code, name: r.name, now: r.now, pct: r.pct, speed: r.speed,
          amount: r.amount, turnover: r.turnover, ksum: klineSummary(r.code),
        })),
      };
    }
    function buildMonitorPayload(data) {
      if (!data.global) return null;
      return {
        global: data.global,
        indices: (data.indices || []).map((i) => ({ name: i.name, now: i.now, pct: i.pct })),
        speed: (data.speed || []).slice(0, 10).map((r) => ({ name: r.name, pct: r.pct, speed: r.speed })),
        zt: (data.zt || []).slice(0, 10).map((r) => ({ name: r.name, days: r.days, pct: r.pct })),
        sectors: (data.sectors || []).slice(0, 8).map((s) => ({ name: s.name, pct: s.pct })),
      };
    }
    function modelPref() {
      return Ui.model.provider && Ui.model.model ? { provider: Ui.model.provider, model: Ui.model.model } : undefined;
    }
    async function runScore(force, tabKind) {
      const c = AiState.score;
      if (c.busy || !Ui.svc.on || bridgeOk !== true) return;
      const kind = tabKind === 'speed' ? 'limitup' : 'bullish';
      const payload = kind === 'limitup' ? AiState.limitupPayload : AiState.scorePayload;
      if (!payload) return;
      c.busy = true; c.error = null;
      if (kind === 'limitup') c.lastAttemptLimitup = Date.now(); else c.lastAttemptBullish = Date.now();
      aiNotify();
      try {
        const out = await sameOriginJSON('/stock-dashboard/api/score', 'POST',
          { ...payload, intent: kind, model: modelPref(), force: !!force }, 100000);
        if (out && out.ok && out.items) {
          if (kind === 'limitup') { c.limitup = new Map(out.items); c.tsLimitup = out.ts || Date.now(); }
          else { c.bullish = new Map(out.items); c.tsBullish = out.ts || Date.now(); }
        } else if (out && !out.ok) {
          c.error = out.error === 'EVAL_THROTTLED' ? '评分请求过于频繁，稍后自动重试' : String(out.error || '评分失败');
        }
      } catch (e) {
        c.error = String((e && e.message) || e);
      } finally {
        c.busy = false; aiNotify();
      }
    }
    async function runMonitor(force) {
      const c = AiState.monitor;
      if (c.busy || !Ui.svc.on || bridgeOk !== true || !AiState.monitorPayload) return;
      c.busy = true; c.error = null; c.lastAttempt = Date.now(); aiNotify();
      try {
        const out = await sameOriginJSON('/stock-dashboard/api/monitor', 'POST',
          { ...AiState.monitorPayload, model: modelPref(), force: !!force }, 110000);
        if (out && out.ok) {
          if (Array.isArray(out.reports) && out.reports.length) {
            c.reports = out.reports;
            IDB.set('monitorReports', c.reports);
          }
          c.lastCheck = Date.now();
        } else if (out && !out.ok) {
          c.error = String((out && out.error) || '监控失败');
        }
      } catch (e) {
        c.error = String((e && e.message) || e);
      } finally {
        c.busy = false; aiNotify();
      }
    }
    async function fetchNews() {
      try {
        const out = await sameOriginJSON('/stock-dashboard/api/news', 'GET', undefined, 15000);
        if (out && out.ok && Array.isArray(out.items)) {
          AiState.news.items = out.items;
          AiState.news.ts = out.ts || Date.now();
          AiState.news.error = null;
          IDB.set('newsItems', out.items);
        } else AiState.news.error = '快讯暂不可用';
      } catch (e) {
        AiState.news.error = '快讯拉取失败';
      }
    }
    function scoreCell(key) {
      const e = AiState.score.bullish.get(key);
      if (!e) return h('span', { className: 'sdb-score none', title: 'AI看涨/看跌分（AI参考，非投资建议）' }, '–');
      const cls = e.score > 15 ? 'up' : e.score < -15 ? 'down' : 'flat';
      const label = e.score > 0 ? '看涨' : e.score < 0 ? '看跌' : '中性';
      return h('span', { className: 'sdb-score ' + cls, title: label + ' ' + e.score + '：' + (e.reason || '') + '（AI参考，非投资建议）' }, (e.score > 0 ? '+' : '') + e.score);
    }
    function limitupCell(key) {
      const e = AiState.score.limitup.get(key);
      if (!e) return h('span', { className: 'sdb-score none', title: '冲板概率：AI 结合消息面/题材/情绪/K线研判（非投资建议）' }, '–');
      const cls = e.score >= 70 ? 'up' : e.score >= 45 ? 'mid' : 'flat';
      return h('span', { className: 'sdb-score ' + cls, title: '冲板概率 ' + e.score + '%：' + (e.reason || '') + '（AI参考，非投资建议）' }, e.score + '%');
    }

    // ---------------------------------------------------------------------------
    // Preload stores (及时渲染): TTL cache + in-flight dedup + idle prefetch.
    // 分钟线批量预取（/minute_batch，60s TTL），日K预取队列（并发 2，300s TTL）。
    // ---------------------------------------------------------------------------
    function createStore(ttlMs) {
      const map = new Map();          // code -> { data, ts }
      const inflight = new Set();
      const listeners = new Set();
      let lastReq = 0;
      return {
        get(code) {
          const hit = map.get(code);
          return hit && Date.now() - hit.ts < ttlMs ? hit.data : null;
        },
        peek(code) { const hit = map.get(code); return hit ? hit.data : null; },
        set(code, data) { map.set(code, { data, ts: Date.now() }); for (const l of listeners) l(); },
        subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
        busy(code) { return inflight.has(code); },
        markInflight(code) { inflight.add(code); },
        clearInflight(code) { inflight.delete(code); },
        throttled(minMs) { const t = Date.now(); if (t - lastReq < minMs) return false; lastReq = t; return true; },
      };
    }
    const MinuteStore = createStore(60 * 1000);
    const KlineStore = createStore(5 * 60 * 1000);

    async function fetchMinuteBatch(codes) {
      const url = bridgeBase() + '/minute_batch?codes=' + codes.join(',');
      const data = await fetchJSON(url, 10000);
      if (data && typeof data === 'object') bridgeOk = true;
      return data || {};
    }
    MinuteStore.request = function (codes) {
      if (document.hidden || bridgeOk === false) return; // 后台页/断开时静默，重连后由订阅刷新
      const need = [];
      for (const c of codes) {
        if (!this.get(c) && !this.busy(c) && !need.includes(c)) need.push(c);
      }
      if (!need.length) return;
      if (bridgeOk === false) return;                 // 断开：不请求，等待重连后由订阅刷新
      if (!this.throttled(1500)) return;
      const chunks = [];
      for (let i = 0; i < need.length; i += 8) chunks.push(need.slice(i, i + 8));
      idle(async () => {
        for (const chunk of chunks) {
          for (const c of chunk) this.markInflight(c);
          try {
            const data = await fetchMinuteBatch(chunk);
            for (const c of chunk) {
              this.clearInflight(c);
              const pts = data[c];
              if (pts && pts.length) this.set(c, pts); // 停市等空数据也缓存，避免反复请求
            }
          } catch (e) {
            for (const c of chunk) this.clearInflight(c);
          }
        }
      }, 400);
    };
    function useMinute(code) {
      const [, force] = useState(0);
      useEffect(() => {
        const l = () => force((v) => v + 1);
        const un = MinuteStore.subscribe(l);
        MinuteStore.request([code]);
        const t = setInterval(() => MinuteStore.request([code]), 60000);
        return () => { un(); clearInterval(t); };
      }, [code]);
      return MinuteStore.get(code);
    }

    let klineQueue = [];
    let klineRunning = false;
    function pumpKlineQueue() {
      if (klineRunning || !klineQueue.length) return;
      if (bridgeOk === false) { idle(pumpKlineQueue, 3000); return; } // 断开时暂停出队，重连后自动恢复
      klineRunning = true;
      const job = klineQueue.shift();
      KlineStore.markInflight(job.code);
      api().kline(job.code, 120).then((bars) => {
        KlineStore.clearInflight(job.code);
        if (bars && bars.length) KlineStore.set(job.code, bars);
        klineRunning = false;
        idle(pumpKlineQueue, 120);
      }).catch(() => {
        KlineStore.clearInflight(job.code);
        klineRunning = false;
        idle(pumpKlineQueue, 500);
      });
    }
    function queueKlinePrefetch(codes) {
      for (const c of codes) {
        if (!KlineStore.get(c) && !KlineStore.busy(c) && !klineQueue.some((j) => j.code === c)) {
          klineQueue.push({ code: c, at: Date.now() });
        }
      }
      klineQueue.sort((a, b) => a.at - b.at);
      idle(pumpKlineQueue, 800);
    }
    function useKline(code) {
      const [, force] = useState(0);
      useEffect(() => {
        const l = () => force((v) => v + 1);
        const un = KlineStore.subscribe(l);
        if (!KlineStore.get(code)) queueKlinePrefetch([code]);
        return un;
      }, [code]);
      return KlineStore.get(code);
    }

    // ---------------------------------------------------------------------------
    // Indicators: MA + MACD (EMA12/26, DEA=EMA9(DIF), hist=2*(DIF-DEA))
    // ---------------------------------------------------------------------------
    function calcMa(closes, n) {
      const out = new Array(closes.length).fill(null);
      let sum = 0;
      for (let i = 0; i < closes.length; i++) {
        sum += closes[i];
        if (i >= n) sum -= closes[i - n];
        if (i >= n - 1) out[i] = sum / n;
      }
      return out;
    }
    function calcEma(values, n) {
      const k = 2 / (n + 1);
      const out = [];
      let ema = values[0];
      for (let i = 0; i < values.length; i++) {
        ema = i === 0 ? values[0] : values[i] * k + ema * (1 - k);
        out.push(ema);
      }
      return out;
    }
    function calcMacd(closes, short = 12, long = 26, signal = 9) {
      const emaShort = calcEma(closes, short);
      const emaLong = calcEma(closes, long);
      const dif = closes.map((_, i) => emaShort[i] - emaLong[i]);
      const dea = calcEma(dif, signal);
      const hist = dif.map((v, i) => 2 * (v - dea[i]));
      return { dif, dea, hist };
    }
    function computeDailyInds(bars) {
      const closes = bars.map((b) => b.close);
      return Object.assign({ ma5: calcMa(closes, 5), ma10: calcMa(closes, 10), ma20: calcMa(closes, 20) }, calcMacd(closes));
    }

    // ---------------------------------------------------------------------------
    // Chart engine — two-layer canvas, 同花顺-style.
    //   Base: redraw only on data / view (zoom-pan) change. Indicator arrays are
    //   precomputed on the FULL series and sliced per view (correct MA at edges).
    //   Overlay: crosshair + axis tags + legend, rAF-throttled cheap redraw.
    //   Daily: wheel zooms visible bar count (cursor-anchored), drag pans.
    // ---------------------------------------------------------------------------
    function chartLayout(w, h, padR = 60) {
      const padL = 8, padT = 10, axisH = 18, gap = 10;
      const inner = h - padT - axisH - gap * 2;
      return { padL, padR, padT, axisH, gap, plotW: Math.max(60, w - padL - padR), priceH: inner * 0.56, volH: inner * 0.16, macdH: inner * 0.22, priceY: padT, volY: padT + inner * 0.56 + gap, macdY: padT + inner * 0.56 + gap + inner * 0.16 + gap, w, h };
    }
    function prepCanvas(canvas) {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth || canvas.parentElement.clientWidth || 860;
      const cssH = canvas.clientHeight || 300;
      const pw = Math.round(cssW * dpr), ph = Math.round(cssH * dpr);
      if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
      const g = canvas.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { g, cssW, cssH };
    }
    // 图表面板配色：运行时读取 DSH 主题 token，随亮/暗主题自适应
    function chartColors(canvas) {
      const cs = getComputedStyle(canvas);
      const v = (n, f) => { const s = (cs.getPropertyValue(n) || '').trim(); return s || f; };
      return {
        bg: v('--dsw-alias-bg-layer-1', '#10161e'),
        grid: v('--dsw-alias-border-l1', '#1f2937'),
        tx: v('--dsw-alias-label-primary', '#e8eef6'),
        tx3: v('--dsw-alias-label-secondary', '#7d8b9c'),
        panel2: v('--dsw-alias-bg-layer-2', '#1b2430'),
        ln2: v('--dsw-alias-border-l2', '#2c3949'),
      };
    }
    function tokens(g, x, y, parts) {
      let cx = x;
      for (const [t, c] of parts) { g.fillStyle = c; g.fillText(t, cx, y); cx += g.measureText(t).width; }
    }

    // 问财风格智能支撑/突破：可见区间的摆动高低点（窗口 3），取最近有效位
    function pivotLevels(bars, start, count) {
      const end = Math.min(bars.length, start + count);
      const W = 3;
      const lows = [], highs = [];
      for (let i = start + W; i < end - W; i++) {
        let isLow = true, isHigh = true;
        for (let k = i - W; k <= i + W; k++) {
          if (k === i) continue;
          if (bars[k].low < bars[i].low) isLow = false;
          if (bars[k].high > bars[i].high) isHigh = false;
        }
        if (isLow) lows.push({ i, price: bars[i].low });
        if (isHigh) highs.push({ i, price: bars[i].high });
      }
      const lastClose = bars[end - 1].close;
      let support = null;
      for (let j = lows.length - 1; j >= 0; j--) if (lows[j].price < lastClose) { support = lows[j]; break; }
      let breakout = null, breakoutIdx = -1;
      for (let j = highs.length - 1; j >= 0; j--) {
        const hp = highs[j];
        for (let i = hp.i + 1; i < end; i++) {
          if (bars[i].close > hp.price && lastClose > hp.price) { breakout = hp; breakoutIdx = i; break; }
        }
        if (breakout) break;
      }
      let resistance = null;
      for (let j = highs.length - 1; j >= 0; j--) if (highs[j].price > lastClose) { resistance = highs[j]; break; }
      return { support, breakout, breakoutIdx, resistance };
    }

    function drawDailyBase(canvas, bars, inds, view) {
      const { g, cssW, cssH } = prepCanvas(canvas);
      const pal = chartColors(canvas);
      const L = chartLayout(cssW, cssH);
      g.fillStyle = pal.bg; g.fillRect(0, 0, cssW, cssH);
      if (!bars || bars.length < 2) return { ...L, slice: null };
      const count = Math.min(view.count, bars.length);
      const start = Math.max(0, Math.min(view.start, bars.length - count));
      const vb = bars.slice(start, start + count);
      const sl = (arr) => arr.slice(start, start + count);
      const ma5 = sl(inds.ma5), ma10 = sl(inds.ma10), ma20 = sl(inds.ma20);
      const dif = sl(inds.dif), dea = sl(inds.dea), hist = sl(inds.hist);
      const pMax = Math.max(...vb.map((b) => b.high), ...ma20.filter((v) => v != null));
      const pMin = Math.min(...vb.map((b) => b.low), ...ma20.filter((v) => v != null));
      const pSpan = (pMax - pMin) || 1;
      const bw = L.plotW / count;
      const xOf = (i) => L.padL + i * bw + bw / 2;
      const yOf = (p) => L.priceY + (1 - (p - pMin) / pSpan) * L.priceH;
      const vMax = Math.max(...vb.map((b) => b.volume)) || 1;
      const mMax = Math.max(1e-9, ...hist.map(Math.abs), ...dif.map(Math.abs), ...dea.map(Math.abs));

      g.font = '10px Consolas, monospace'; g.textBaseline = 'middle';
      g.strokeStyle = pal.grid; g.fillStyle = pal.tx3; g.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = L.priceY + (L.priceH * i) / 4;
        g.beginPath(); g.moveTo(L.padL, y); g.lineTo(L.padL + L.plotW, y); g.stroke();
        g.textAlign = 'left'; g.fillText(fmtNum(pMax - (pSpan * i) / 4), L.padL + L.plotW + 6, y);
      }
      g.textAlign = 'center';
      const step = Math.ceil(count / 6);
      for (let i = 0; i < count; i += step) g.fillText(vb[i].date.slice(5), xOf(i), cssH - L.axisH / 2);

      const bodyW = Math.max(1, bw * 0.62);
      vb.forEach((b, i) => {
        const up = b.close >= b.open;
        const color = up ? UP : DOWN;
        const x = xOf(i);
        g.strokeStyle = color;
        g.beginPath(); g.moveTo(x, yOf(b.high)); g.lineTo(x, yOf(b.low)); g.stroke();
        const yO = yOf(b.open), yC = yOf(b.close);
        const top = Math.min(yO, yC), hgt = Math.max(1, Math.abs(yC - yO));
        if (up) { g.fillStyle = pal.bg; g.fillRect(x - bodyW / 2, top, bodyW, hgt); g.strokeRect(x - bodyW / 2 + 0.5, top + 0.5, bodyW - 1, Math.max(1, hgt - 1)); }
        else { g.fillStyle = color; g.fillRect(x - bodyW / 2, top, bodyW, hgt); }
      });

      [[ma5, MA_COLORS[0]], [ma10, MA_COLORS[1]], [ma20, MA_COLORS[2]]].forEach(([arr, color]) => {
        g.strokeStyle = color; g.beginPath();
        let started = false;
        arr.forEach((v, i) => { if (v == null) return; const x = xOf(i), y = yOf(v); started ? g.lineTo(x, y) : (g.moveTo(x, y), started = true); });
        g.stroke();
      });

      // 智能支撑 / 突破 / 压力（问财风格：水平虚线 + 左侧标签 + 右侧价签 + 突破 K 线标记）
      const end = Math.min(bars.length, start + count);
      const lv = pivotLevels(bars, start, count);
      const drawLevel = (price, color, label, dash, markerAbsIdx) => {
        if (price == null) return;
        const y = yOf(price);
        if (y < L.priceY - 2 || y > L.priceY + L.priceH + 2) return;
        g.save();
        g.strokeStyle = color; g.lineWidth = 1; g.setLineDash(dash);
        g.beginPath(); g.moveTo(L.padL, y); g.lineTo(L.padL + L.plotW, y); g.stroke();
        g.setLineDash([]);
        g.fillStyle = color; g.font = '10px Consolas, monospace';
        g.textAlign = 'left';
        g.fillText(label + ' ' + fmtNum(price), L.padL + 6, y - 7);
        g.textAlign = 'right';
        g.fillText(fmtNum(price), L.padL + L.plotW - 4, y - 7);
        if (markerAbsIdx != null && markerAbsIdx >= start && markerAbsIdx < end) {
          const x = xOf(markerAbsIdx - start);
          const by = yOf(bars[markerAbsIdx].low) + 5;
          g.fillStyle = color;
          g.beginPath(); g.moveTo(x, by); g.lineTo(x - 4, by + 6); g.lineTo(x + 4, by + 6); g.closePath(); g.fill();
        }
        g.restore();
      };
      drawLevel(lv.support ? lv.support.price : null, DOWN, '支撑', [6, 4], null);
      if (lv.breakout) drawLevel(lv.breakout.price, ACCENT, '突破', [5, 3], lv.breakoutIdx);
      else drawLevel(lv.resistance ? lv.resistance.price : null, pal.tx3, '压力', [6, 4], null);

      g.strokeStyle = pal.grid;
      g.beginPath(); g.moveTo(L.padL, L.volY - L.gap / 2); g.lineTo(L.padL + L.plotW, L.volY - L.gap / 2); g.stroke();
      g.globalAlpha = 0.7;
      vb.forEach((b, i) => {
        const hgt = (b.volume / vMax) * L.volH;
        g.fillStyle = b.close >= b.open ? UP : DOWN;
        g.fillRect(xOf(i) - bodyW / 2, L.volY + L.volH - hgt, bodyW, hgt);
      });
      g.globalAlpha = 1;
      g.fillStyle = pal.tx3; g.textAlign = 'left';
      g.fillText('VOL ' + fmtAmount(vb[vb.length - 1].volume), L.padL + 2, L.volY + 8);

      g.strokeStyle = pal.grid;
      g.beginPath(); g.moveTo(L.padL, L.macdY - L.gap / 2); g.lineTo(L.padL + L.plotW, L.macdY - L.gap / 2); g.stroke();
      const yMacd = (v) => L.macdY + L.macdH / 2 - (v / mMax) * (L.macdH / 2 - 2);
      g.beginPath(); g.moveTo(L.padL, yMacd(0)); g.lineTo(L.padL + L.plotW, yMacd(0)); g.stroke();
      hist.forEach((v, i) => {
        g.fillStyle = v >= 0 ? UP : DOWN;
        const y0 = yMacd(0), y1 = yMacd(v);
        g.fillRect(xOf(i) - bodyW / 2, Math.min(y0, y1), bodyW, Math.max(1, Math.abs(y1 - y0)));
      });
      [['DIF', dif, MA_COLORS[0]], ['DEA', dea, MA_COLORS[1]]].forEach(([, arr, color]) => {
        g.strokeStyle = color; g.beginPath();
        arr.forEach((v, i) => { const x = xOf(i), y = yMacd(v); i === 0 ? g.moveTo(x, y) : g.lineTo(x, y); });
        g.stroke();
      });
      g.fillStyle = pal.tx3;
      g.fillText('MACD(12,26,9)', L.padL + 2, L.macdY + 8);

      return { ...L, bw, xOf, pMin, pSpan, slice: { bars: vb, ma5, ma10, ma20, dif, dea, hist, start, prevClose: start > 0 ? bars[start - 1].close : vb[0].open } };
    }

    // 主流工具式分时时间轴：全天固定 240 槽（09:30-11:30 / 13:00-15:00），
    // 点位按 HH:MM 落槽——集合竞价只合并为 09:30 起点单点，未走完的时段右侧留白。
    function parseHM(s) {
      const m = /(\d{1,2}):(\d{2})/.exec(String(s || ''));
      return m ? (+m[1]) * 60 + (+m[2]) : null;
    }
    function minuteSlots(pts) {
      const out = [];
      let auction = null;
      for (const p of pts) {
        const t = parseHM(p.time);
        if (t == null) { out.push({ ...p, slot: out.length ? ((out[out.length - 1].slot ?? 0) + 1) : 0 }); continue; }
        if (t < 570) { auction = p; continue; } // 09:15-09:25 集合竞价：仅保留最后一笔
        const slot = t <= 690 ? t - 570 : Math.max(0, Math.min(240, 120 + Math.max(0, t - 780)));
        out.push({ ...p, slot: Math.max(0, Math.min(240, slot)) });
      }
      if (auction && out.length) out.unshift({ ...auction, slot: 0 });
      return out;
    }
    const MINUTE_SLOTS = 240;

    function drawMinuteBase(canvas, pts, preclose) {
      const { g, cssW, cssH } = prepCanvas(canvas);
      const pal = chartColors(canvas);
      const L = chartLayout(cssW, cssH, 84);
      g.fillStyle = pal.bg; g.fillRect(0, 0, cssW, cssH);
      if (!pts || pts.length < 2) return { ...L, slice: null };
      const sp = minuteSlots(pts);
      if (sp.length < 2) return { ...L, slice: null };
      const mid = preclose != null ? preclose : sp[0].price;
      let hi = mid, lo = mid;
      for (const p of sp) { hi = Math.max(hi, p.price, p.avg); lo = Math.min(lo, p.price, p.avg); }
      const half = Math.max(hi - mid, mid - lo, mid * 0.002) * 1.12;
      // 时间槽 → X：全天宽度恒定，不随已走分钟数/点数拉伸
      const xOf = (p) => L.padL + ((p.slot || 0) / MINUTE_SLOTS) * L.plotW;
      const yOf = (p) => L.priceY + (1 - (p - (mid - half)) / (2 * half)) * L.priceH;
      const vMax = Math.max(...sp.map((p) => p.vol)) || 1;
      const last = sp[sp.length - 1];
      const up = last.price >= mid;
      const lineColor = up ? UP : DOWN;

      g.font = '10px Consolas, monospace'; g.textBaseline = 'middle';
      // 网格：仅横向 3 条 + 午间会话分隔，弱化
      g.strokeStyle = pal.grid; g.lineWidth = 1; g.globalAlpha = 0.55;
      [mid - half, mid, mid + half].forEach((p) => {
        const y = yOf(p);
        g.beginPath(); g.moveTo(L.padL, y); g.lineTo(L.padL + L.plotW, y); g.stroke();
      });
      const noonX = L.padL + (120 / MINUTE_SLOTS) * L.plotW;
      g.setLineDash([2, 4]);
      g.beginPath(); g.moveTo(noonX, L.priceY); g.lineTo(noonX, L.priceY + L.priceH); g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 1;
      // 右侧价签（相对昨收着色）
      [mid + half, mid, mid - half].forEach((p) => {
        const y = yOf(p);
        g.textAlign = 'left';
        g.fillStyle = p > mid ? UP : p < mid ? DOWN : pal.tx3;
        g.fillText(fmtNum(p), L.padL + L.plotW + 6, y);
        g.fillStyle = pal.tx3;
        g.fillText(fmtPct(((p - mid) / mid) * 100), L.padL + L.plotW + 6, y + 11);
      });
      // 时间轴（固定刻度）
      g.textAlign = 'center'; g.fillStyle = pal.tx3;
      [['09:30', 0], ['10:30', 60], ['11:30/13:00', 120], ['14:00', 180], ['15:00', 240]].forEach(([t, slot]) => {
        g.fillText(t, L.padL + (slot / MINUTE_SLOTS) * L.plotW, cssH - L.axisH / 2);
      });
      // 昨收基准虚线
      g.strokeStyle = pal.tx3; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(L.padL, yOf(mid)); g.lineTo(L.padL + L.plotW, yOf(mid)); g.stroke();
      g.setLineDash([]);
      // 价格面积渐变（对昨收的红/绿），只画到最新时间槽
      const grad = g.createLinearGradient(0, L.priceY, 0, L.priceY + L.priceH);
      const rgb = up ? '255,95,95' : '46,212,127';
      grad.addColorStop(0, `rgba(${rgb},0.22)`);
      grad.addColorStop(1, `rgba(${rgb},0.02)`);
      g.beginPath();
      sp.forEach((p, i) => { const x = xOf(p), y = yOf(p.price); i === 0 ? g.moveTo(x, y) : g.lineTo(x, y); });
      g.lineTo(xOf(last), yOf(mid)); g.lineTo(xOf(sp[0]), yOf(mid)); g.closePath();
      g.fillStyle = grad; g.fill();
      // 价格线
      g.strokeStyle = lineColor; g.lineWidth = 1.4; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath();
      sp.forEach((p, i) => { const x = xOf(p), y = yOf(p.price); i === 0 ? g.moveTo(x, y) : g.lineTo(x, y); });
      g.stroke();
      // 均价线（琥珀）
      g.strokeStyle = ACCENT; g.lineWidth = 1; g.setLineDash([5, 3]);
      g.beginPath();
      sp.forEach((p, i) => { const x = xOf(p), y = yOf(p.avg); i === 0 ? g.moveTo(x, y) : g.lineTo(x, y); });
      g.stroke();
      g.setLineDash([]);
      // 现价光点（外圈光晕 + 实心点）
      const lx = xOf(last), ly = yOf(last.price);
      g.globalAlpha = 0.25; g.fillStyle = lineColor;
      g.beginPath(); g.arc(lx, ly, 6, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      g.beginPath(); g.arc(lx, ly, 2.6, 0, Math.PI * 2); g.fill();
      g.strokeStyle = pal.bg; g.lineWidth = 1;
      g.beginPath(); g.arc(lx, ly, 2.6, 0, Math.PI * 2); g.stroke();
      // 分时量（同样按时间槽定位）
      sp.forEach((p, i) => {
        const prev = sp[i - 1] ? sp[i - 1].price : mid;
        const hgt = (p.vol / vMax) * L.volH;
        g.fillStyle = p.price >= prev ? UP : DOWN;
        g.globalAlpha = 0.7;
        g.fillRect(xOf(p) - 1, L.volY + L.volH - hgt, 2, hgt);
        g.globalAlpha = 1;
      });
      g.fillStyle = pal.tx3; g.textAlign = 'left';
      g.fillText('VOL ' + fmtAmount(last.vol), L.padL + 2, L.volY + 8);
      return { ...L, xOf, mid, half, slice: { pts: sp, preclose: mid } };
    }

    function axisTag(g, pal, x, y, text, align) {
      g.font = '10px Consolas, monospace';
      const w = g.measureText(text).width + 10;
      const bx = align === 'right' ? x : x - w / 2;
      g.fillStyle = pal.panel2; g.strokeStyle = pal.ln2; g.lineWidth = 1;
      g.fillRect(bx, y - 8, w, 16); g.strokeRect(bx, y - 8, w, 16);
      g.fillStyle = pal.tx; g.textAlign = 'left';
      g.fillText(text, bx + 5, y);
    }

    function drawDailyOverlay(canvas, layout, cross) {
      const { g, cssW } = prepCanvas(canvas);
      const pal = chartColors(canvas);
      g.clearRect(0, 0, cssW, canvas.clientHeight);
      const s = layout && layout.slice;
      if (!s) return;
      const { padL, plotW, priceY, priceH, macdY, macdH, bw, h, axisH } = layout;
      let i = s.bars.length - 1;
      let priceAt = null;
      if (cross && cross.x >= padL && cross.x <= padL + plotW) {
        i = Math.min(s.bars.length - 1, Math.max(0, Math.floor((cross.x - padL) / bw)));
        if (cross.y >= priceY && cross.y <= priceY + priceH) priceAt = layout.pMin + (1 - (cross.y - priceY) / priceH) * layout.pSpan;
      }
      const b = s.bars[i];
      const pc = i > 0 ? s.bars[i - 1].close : s.prevClose;
      const chg = b.close - pc, pct = (chg / pc) * 100;
      const vc = (v) => (v > pc ? UP : v < pc ? DOWN : pal.tx);
      g.font = '10px Consolas, monospace'; g.textBaseline = 'middle'; g.textAlign = 'left';
      tokens(g, padL + 4, priceY + 9, [[b.date + '  ', pal.tx3],
        ['开 ' + fmtNum(b.open), vc(b.open)], ['  高 ' + fmtNum(b.high), vc(b.high)],
        ['  低 ' + fmtNum(b.low), vc(b.low)], ['  收 ' + fmtNum(b.close), vc(b.close)],
        ['  ' + fmtSigned(chg), chg > 0 ? UP : chg < 0 ? DOWN : pal.tx], ['  ' + fmtPct(pct), pct > 0 ? UP : pct < 0 ? DOWN : pal.tx]]);
      tokens(g, padL + 4, priceY + 23, [['MA5 ' + fmtNum(s.ma5[i]), MA_COLORS[0]], ['  MA10 ' + fmtNum(s.ma10[i]), MA_COLORS[1]], ['  MA20 ' + fmtNum(s.ma20[i]), MA_COLORS[2]]]);
      tokens(g, padL + 4, macdY + 22, [['DIF ' + fmtNum(s.dif[i]), MA_COLORS[0]], ['  DEA ' + fmtNum(s.dea[i]), MA_COLORS[1]], ['  MACD ' + fmtNum(s.hist[i]), s.hist[i] >= 0 ? UP : DOWN]]);

      if (!cross) return;
      const cx = layout.xOf(i);
      g.strokeStyle = pal.tx3; g.setLineDash([4, 3]); g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx, priceY); g.lineTo(cx, macdY + macdH); g.stroke();
      g.setLineDash([]);
      axisTag(g, pal, cx, h - axisH / 2, b.date.slice(5));
      if (priceAt != null) {
        const cy = cross.y;
        g.beginPath(); g.moveTo(padL, cy); g.lineTo(padL + plotW, cy); g.stroke();
        axisTag(g, pal, padL + plotW + 4, cy, fmtNum(priceAt), 'right');
      }
    }

    function drawMinuteOverlay(canvas, layout, cross) {
      const { g, cssW } = prepCanvas(canvas);
      const pal = chartColors(canvas);
      g.clearRect(0, 0, cssW, canvas.clientHeight);
      const s = layout && layout.slice;
      if (!s) return;
      const { padL, plotW, priceY, priceH, volY, volH, h, axisH } = layout;
      const pts = s.pts, mid = s.preclose;
      // 时间槽定位：十字光标取最近的数据点（点间距不再均匀，须按 x 最近邻）
      let i = pts.length - 1;
      let priceAt = null;
      if (cross && cross.x >= padL && cross.x <= padL + plotW) {
        let bestD = Infinity;
        for (let k = 0; k < pts.length; k++) {
          const d = Math.abs(layout.xOf(pts[k]) - cross.x);
          if (d < bestD) { bestD = d; i = k; }
        }
        if (cross.y >= priceY && cross.y <= priceY + priceH) priceAt = layout.mid - layout.half + (1 - (cross.y - priceY) / priceH) * 2 * layout.half;
      }
      const p = pts[i];
      const cx = layout.xOf(p);
      const pct = ((p.price - mid) / mid) * 100;
      g.font = '10px Consolas, monospace'; g.textBaseline = 'middle'; g.textAlign = 'left';
      tokens(g, padL + 4, priceY + 9, [[p.time + '  ', pal.tx3],
        ['价 ' + fmtNum(p.price), p.price > mid ? UP : p.price < mid ? DOWN : pal.tx],
        ['  均 ' + fmtNum(p.avg), ACCENT],
        ['  ' + fmtPct(pct), pct > 0 ? UP : pct < 0 ? DOWN : pal.tx],
        ['  量 ' + fmtAmount(p.vol), pal.tx3]]);

      if (!cross) return;
      g.strokeStyle = pal.tx3; g.setLineDash([4, 3]); g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx, priceY); g.lineTo(cx, volY + volH); g.stroke();
      g.setLineDash([]);
      axisTag(g, pal, cx, h - axisH / 2, p.time);
      if (priceAt != null) {
        const cy = cross.y;
        g.beginPath(); g.moveTo(padL, cy); g.lineTo(padL + plotW, cy); g.stroke();
        axisTag(g, pal, padL + plotW + 4, cy, fmtNum(priceAt), 'right');
      }
    }

    // ---------------------------------------------------------------------------
    // Chart React component (two canvases + rAF overlay + wheel zoom + drag pan)
    // ---------------------------------------------------------------------------
    const Chart = memo(function Chart({ mode, bars, inds, pts, preclose, height }) {
      const baseRef = useRef(null);
      const overRef = useRef(null);
      const layoutRef = useRef(null);
      const rafRef = useRef(0);
      const crossRef = useRef(null);
      const viewRef = useRef(null);
      const dragRef = useRef(null);

      const drawOverlayNow = useCallback(() => {
        const over = overRef.current;
        if (!over) return;
        if (mode === 'daily') drawDailyOverlay(over, layoutRef.current, crossRef.current);
        else drawMinuteOverlay(over, layoutRef.current, crossRef.current);
      }, [mode]);

      const redraw = useCallback(() => {
        const base = baseRef.current, over = overRef.current;
        if (!base || !over) return;
        if (mode === 'daily') {
          if (bars && bars.length) {
            if (!viewRef.current) {
              const cnt = Math.min(70, bars.length);
              viewRef.current = { start: Math.max(0, bars.length - cnt), count: cnt };
            }
            layoutRef.current = drawDailyBase(base, bars, inds, viewRef.current);
          } else layoutRef.current = drawDailyBase(base, null, null, { start: 0, count: 0 });
        } else {
          layoutRef.current = drawMinuteBase(base, pts, preclose);
        }
        drawOverlayNow();
      }, [mode, bars, inds, pts, preclose, drawOverlayNow]);

      useEffect(() => {
        if (mode === 'daily' && bars && bars.length) {
          const cnt = Math.min(70, bars.length);
          viewRef.current = { start: Math.max(0, bars.length - cnt), count: cnt };
        }
        redraw();
      }, [redraw]);

      useEffect(() => {
        const onResize = () => redraw();
        window.addEventListener('resize', onResize);
        return () => { window.removeEventListener('resize', onResize); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
      }, [redraw]);

      // DSH 亮/暗主题切换时重绘（监听根节点主题相关属性变化）
      useEffect(() => {
        const mo = new MutationObserver(() => redraw());
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
        mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
        return () => mo.disconnect();
      }, [redraw]);

      const schedule = useCallback(() => {
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => { rafRef.current = 0; redraw(); });
      }, [redraw]);
      const scheduleOverlay = useCallback(() => {
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => { rafRef.current = 0; drawOverlayNow(); });
      }, [drawOverlayNow]);

      useEffect(() => {
        const over = overRef.current;
        if (!over) return;
        const getXY = (e) => { const r = over.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        const onWheel = (e) => {
          if (mode !== 'daily' || !bars || !bars.length) return;
          e.preventDefault();
          const { x } = getXY(e);
          const L = layoutRef.current;
          if (!L || !L.slice) return;
          const v = viewRef.current;
          const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
          const newCount = Math.max(20, Math.min(bars.length, Math.round(v.count * factor)));
          const frac = Math.min(1, Math.max(0, (x - L.padL) / L.plotW));
          const anchor = v.start + Math.floor(frac * v.count);
          const newStart = Math.max(0, Math.min(bars.length - newCount, Math.round(anchor - frac * newCount)));
          viewRef.current = { start: newStart, count: newCount };
          schedule();
        };
        const onMove = (e) => {
          const { x, y } = getXY(e);
          const drag = dragRef.current;
          if (drag && mode === 'daily') {
            const L = layoutRef.current;
            const v = viewRef.current;
            if (L && L.slice && v) {
              const dIdx = Math.round((x - drag.x0) / L.bw);
              const newStart = Math.max(0, Math.min(bars.length - v.count, drag.start0 - dIdx));
              if (newStart !== v.start) { v.start = newStart; crossRef.current = null; schedule(); return; }
            }
          }
          crossRef.current = { x, y };
          scheduleOverlay();
        };
        const onDown = (e) => {
          if (mode !== 'daily') return;
          const { x } = getXY(e);
          const v = viewRef.current;
          if (v) dragRef.current = { x0: x, start0: v.start };
          const onUp = () => { dragRef.current = null; window.removeEventListener('mouseup', onUp); };
          window.addEventListener('mouseup', onUp);
        };
        const onLeave = () => { crossRef.current = null; dragRef.current = null; scheduleOverlay(); };
        over.addEventListener('wheel', onWheel, { passive: false });
        over.addEventListener('mousemove', onMove);
        over.addEventListener('mousedown', onDown);
        over.addEventListener('mouseleave', onLeave);
        return () => {
          over.removeEventListener('wheel', onWheel);
          over.removeEventListener('mousemove', onMove);
          over.removeEventListener('mousedown', onDown);
          over.removeEventListener('mouseleave', onLeave);
        };
      }, [mode, bars, schedule, scheduleOverlay]);

      return h('div', { style: { position: 'relative' } },
        h('canvas', { ref: baseRef, style: { width: '100%', height, display: 'block', borderRadius: 2 } }),
        h('canvas', { ref: overRef, style: { position: 'absolute', inset: 0, width: '100%', height, display: 'block', cursor: 'crosshair' } }));
    });

    // ---------------------------------------------------------------------------
    // Sparkline (pure SVG, memo)
    // ---------------------------------------------------------------------------
    const Sparkline = memo(function Sparkline({ series, color, width = 84, height = 34 }) {
      if (!series || series.length < 2) return null;
      const min = Math.min(...series), max = Math.max(...series);
      const span = (max - min) || 1;
      const pts = series.map((v, i) => (i / (series.length - 1) * width).toFixed(1) + ',' + ((1 - (v - min) / span) * (height - 4) + 2).toFixed(1)).join(' ');
      const last = pts.split(' ').pop();
      return h('svg', { width, height, 'aria-hidden': true, style: { display: 'block', flex: 'none' } },
        h('polyline', { points: pts, fill: 'none', stroke: color, strokeWidth: 1.2 }),
        h('circle', { cx: last.split(',')[0], cy: last.split(',')[1], r: 2, fill: color }));
    });

    // ---------------------------------------------------------------------------
    // In-row mini 分时 (SVG, memoized; data via MinuteStore with 60s TTL)
    // ---------------------------------------------------------------------------
    const MiniTrend = memo(function MiniTrend({ code, preclose }) {
      const pts = useMinute(code);
      if (!pts || pts.length < 2) return h('span', { className: 'sdb-mskel' });
      // 固定全天时间轴：按 HH:MM 落槽（同大图），宽度不随点数拉伸
      const sp = minuteSlots(pts);
      const bySlot = new Map();
      for (const p of sp) bySlot.set(p.slot, p);
      const vis = [...bySlot.entries()].sort((a, b) => a[0] - b[0]).map(([slot, p]) => ({ slot, price: p.price }));
      if (vis.length < 2) return h('span', { className: 'sdb-mskel' });
      const W = 96, H = 26;
      const mid = preclose != null ? preclose : sp[0].price;
      let hi = mid, lo = mid;
      for (const v of vis) { hi = Math.max(hi, v.price); lo = Math.min(lo, v.price); }
      const half = Math.max(hi - mid, mid - lo, mid * 0.001) * 1.1;
      const xy = (slot, p) => ((slot / MINUTE_SLOTS) * W).toFixed(1) + ',' + ((1 - (p - (mid - half)) / (2 * half)) * (H - 4) + 2).toFixed(1);
      const line = vis.map((v) => xy(v.slot, v.price)).join(' ');
      const lastP = vis[vis.length - 1].price;
      const color = lastP >= mid ? UP : DOWN;
      const midY = ((1 - 0.5) * (H - 4) + 2).toFixed(1);
      return h('svg', { className: 'sdb-mini', width: W, height: H, 'aria-hidden': true },
        h('line', { x1: 0, x2: W, y1: midY, y2: midY, style: { stroke: 'var(--dsw-alias-border-l2)' }, strokeDasharray: '3,3', strokeWidth: 1 }),
        h('polyline', { points: line, fill: 'none', stroke: color, strokeWidth: 1.1 }));
    });

    // ---------------------------------------------------------------------------
    // Table with event delegation (click acts, hover reports name cells)
    // ---------------------------------------------------------------------------
    function DataTable({ columns, rows, onHover, onNameClick, onStar, onRemove, empty }) {
      if (!rows || !rows.length) return h('div', { className: 'sdb-empty' }, empty || '暂无数据');
      const handleClick = (e) => {
        const nm = e.target.closest('[data-hover]');
        if (nm) {
          const code = nm.getAttribute('data-code');
          if (code && onNameClick) onNameClick(code);
          return;
        }
        const act = e.target.closest('[data-act]');
        if (!act) return;
        const tr = act.closest('tr[data-code]');
        if (!tr) return;
        e.stopPropagation();
        const code = act.getAttribute('data-code');
        if (act.getAttribute('data-act') === 'star') onStar && onStar(code, act.getAttribute('data-on') !== '1');
        if (act.getAttribute('data-act') === 'del') onRemove && onRemove(code);
      };
      const handleOver = (e) => {
        const nm = e.target.closest('[data-hover]');
        if (!nm || !onHover) return;
        const tr = nm.closest('tr[data-code]');
        const code = (tr || nm).getAttribute('data-code');
        onHover(code, nm.getBoundingClientRect());
      };
      return h('div', { className: 'sdb-twrap' },
        h('table', { className: 'sdb-t' },
          h('thead', null, h('tr', null, columns.map((c) => h('th', { key: c.key, className: c.left ? 'l' : '' }, c.title)))),
          h('tbody', { onClick: handleClick, onMouseOver: handleOver, onMouseLeave: () => onHover && onHover(null) },
            rows.map((r, ri) => h('tr', { key: r.code, 'data-code': r.code },
              columns.map((c) => h('td', { key: c.key, className: c.left ? 'l' : '' },
                c.render ? c.render(r, ri) : (r[c.key] != null ? String(r[c.key]) : '--'))))))));
    }

    function nameCell(r, extra) {
      return h('span', { 'data-hover': '1', 'data-code': r.code, title: '悬停查看日K' },
        h('span', { className: 'sdb-nm' }, r.name),
        h('span', { className: 'sdb-cd num' }, r.code),
        extra || null);
    }
    function starCell(r, watch) {
      const on = watch && watch.indexOf(r.code) >= 0;
      return h('button', {
        className: 'sdb-star' + (on ? ' on' : ''), 'data-act': 'star', 'data-code': r.code, 'data-on': on ? '1' : '0',
        title: on ? '移出自选' : '加入自选', 'aria-label': (on ? '移出自选 ' : '加入自选 ') + r.name,
      }, on ? '★' : '☆');
    }

    const COL = {
      star: (watch) => ({ key: '_star', title: '', left: true, render: (r) => starCell(r, watch) }),
      name: { key: 'name', title: '名称 / 代码', left: true, render: (r) => nameCell(r) },
      mini: { key: '_mini', title: '分时', left: true, render: (r) => h(MiniTrend, { code: r.code, preclose: r.preclose }) },
      score: { key: '_score', title: 'AI分', render: (r) => scoreCell(r.code) },
      now: { key: 'now', title: '最新价', render: (r) => fmtNum(r.now) },
      chg: { key: 'chg', title: '涨跌额', render: (r) => h('span', { className: pctClass(r.pct) }, fmtSigned(r.now - r.preclose)) },
      pct: { key: 'pct', title: '涨跌幅', render: (r) => h('span', { className: pctClass(r.pct), style: { fontWeight: 600 } }, fmtPct(r.pct)) },
      speed: { key: 'speed', title: '3分涨速', render: (r) => h('span', { className: pctClass(r.speed), style: { fontWeight: 600 } }, fmtPct(r.speed)) },
      amount: { key: 'amount', title: '成交额', render: (r) => h('span', { style: { color: 'var(--tx2)' } }, fmtAmount(r.amount)) },
      turnover: { key: 'turnover', title: '换手%', render: (r) => r.turnover != null ? fmtNum(r.turnover, 1) : '--' },
      del: { key: '_del', title: '操作', render: (r) => h('button', { className: 'sdb-del', 'data-act': 'del', 'data-code': r.code, title: '删除', 'aria-label': '删除 ' + r.name }, '✕') },
    };

    // ---------------------------------------------------------------------------
    // Panels
    // ---------------------------------------------------------------------------
    function IndexStrip({ indices, onOpenChart }) {
      return h('div', { className: 'sdb-idx' },
        (indices || []).length
          ? indices.map((idx) => {
            const pct = idx.pct, chg = idx.now - idx.preclose, cls = pctClass(pct);
            return h('div', {
              key: idx.code, className: 'sdb-idx-c sdb-idx-click', role: 'button', tabIndex: 0,
              title: '点击查看 ' + idx.name + ' K线/分时',
              onClick: (e) => onOpenChart && onOpenChart(idx, e.currentTarget.getBoundingClientRect()),
              onKeyDown: (e) => { if (e.key === 'Enter' && onOpenChart) onOpenChart(idx, e.currentTarget.getBoundingClientRect()); },
            },
              h('div', null,
                h('div', { className: 'sdb-idx-n' }, idx.name),
                h('div', { className: 'sdb-idx-p num ' + cls }, fmtNum(idx.now)),
                h('div', { className: 'sdb-idx-c2 num ' + cls }, fmtSigned(chg) + '  ' + fmtPct(pct))),
              h(Sparkline, { series: idx.series, color: pct > 0 ? UP : pct < 0 ? DOWN : '#7d8b9c' }));
          })
          : h('div', { className: 'sdb-empty', style: { gridColumn: '1/-1' } }, '行情加载中…'));
    }

    function SectorBars({ rows }) {
      if (!rows || !rows.length) return h('div', { className: 'sdb-empty' }, '加载中…');
      const max = Math.max(...rows.map((r) => Math.abs(r.pct))) || 1;
      return h('div', { style: { paddingBottom: 8 } },
        rows.map((s, i) => {
          const ai = AiState.score.bullish.get(s.name);
          return h('div', { key: s.name, className: 'sdb-sec', title: (ai && ai.reason ? 'AI：' + ai.reason + '；' : '') + (s.kind ? s.kind + '板块' : '') + (s.leader ? '，领涨 ' + s.leader : '') },
            h('span', { className: 'nmw' },
              h('span', { className: 'nm' }, i + 1 + '  ' + s.name),
              s.kind ? h('span', { className: 'sdb-kind' }, s.kind) : null),
            h('div', { className: 'bg' }, h('i', { style: { left: 0, width: (Math.abs(s.pct) / max) * 100 + '%', background: s.pct >= 0 ? UP : DOWN } })),
            h('span', { className: 'num ' + pctClass(s.pct), style: { textAlign: 'right' } }, fmtPct(s.pct, 2)),
            scoreCell(s.name));
        }));
    }

    // ---------------------------------------------------------------------------
    // AI 异动监控面板 + 财联社电报面板
    // ---------------------------------------------------------------------------
    const LEVEL_TEXT = { high: '高', mid: '中', low: '低', none: '平静' };
    function AiReportCard({ rep }) {
      return h('div', { className: 'sdb-rep' },
        h('div', { className: 'hd' },
          h('span', { className: 'sdb-lvl ' + (rep.level || 'none') }, LEVEL_TEXT[rep.level] || '中'),
          h('span', { className: 'tt' }, rep.title),
          h('span', { className: 'tm' }, rep.time)),
        h('div', { className: 'ln' }, h('b', null, '异动 '), rep.reason),
        h('div', { className: 'ln' }, h('b', null, '建议 '), rep.advice),
        rep.tags && rep.tags.length
          ? h('div', { className: 'tags' }, rep.tags.map((t) => h('span', { key: t, className: 'tag2' }, t)))
          : null);
    }
    function AiPanel() {
      const on = Ui.ai.monitor;
      const c = AiState.monitor;
      const latest = c.reports && c.reports[0];
      const svcLive = Ui.svc.on && bridgeOk === true;
      const setAi = (patch) => {
        Ui.ai = { ...Ui.ai, ...patch };
        saveSettings();
        aiNotify();
      };
      return h('div', { className: 'sdb-aisec' },
        h('div', { className: 'sdb-aihd' },
          h('span', { className: 'sdb-pt' }, 'AI 异动监控'),
          h('span', { style: { flex: 1 } }),
          h('button', {
            className: 'sdb-sw' + (Ui.ai.score ? ' on' : ''),
            onClick: () => setAi({ score: !Ui.ai.score }),
            title: '为板块与列表个股生成 LLM 看涨/看跌分（默认开，本地持久化）',
            'aria-pressed': Ui.ai.score,
          }, Ui.ai.score ? 'AI评分·开' : 'AI评分·关'),
          h('button', {
            className: 'sdb-sw' + (on ? ' on' : ''),
            onClick: () => setAi({ monitor: !on }),
            title: '监控市场异动并给出原因与建议（默认开，本地持久化）',
            'aria-pressed': on,
          }, on ? '监控·开' : '监控·关')),
        (!Ui.ai.score && !on) && h('div', { className: 'sdb-aihint' },
          '两项 AI 能力均已关闭（本地记忆，重载后保持）。'),
        Ui.ai.score && svcLive && AiState.score.error && h('div', { className: 'sdb-err' }, '⚠ AI评分：' + AiState.score.error),
        !Ui.svc.on && h('div', { className: 'sdb-aihint' }, '数据服务已关闭：开启顶部「服务·开」后 AI 才会工作。'),
        Ui.svc.on && bridgeOk !== true && h('div', { className: 'sdb-aihint' }, '等待行情连接：连接成功后 AI 自动开始工作。'),
        on && svcLive && c.error && h('div', { className: 'sdb-err' }, '⚠ ' + c.error),
        on && svcLive && c.busy && !latest && h('div', { className: 'sdb-aihint' }, h('span', { className: 'sdb-spin' }), '正在分析盘面与财联社快讯…'),
        on && svcLive && !c.busy && !latest && !c.error && h('div', { className: 'sdb-aihint' }, '暂无异动报告。检测到异动会自动生成，也可点击下方「立即分析」。'),
        on && latest && h(AiReportCard, { rep: latest }),
        on && latest && c.reports.length > 1 && h('div', { className: 'sdb-repft' },
          '更早: ' + c.reports.slice(1, 4).map((r) => r.time + ' ' + r.title).join('；')),
        on && svcLive && h('div', { className: 'sdb-repft' },
          h('button', { className: 'lnk', onClick: () => runMonitor(true), disabled: c.busy }, c.busy ? '分析中…' : '立即分析'),
          h('span', null, '内容为模型生成，不构成投资建议，请自行把握'),
          h('span', { className: 'dis', style: { marginLeft: 'auto' } }, '仅供参考')));
    }
    function NewsPanel() {
      const { items, error } = AiState.news;
      return h('div', { className: 'sdb-p sdb-np' },
        h('div', { className: 'sdb-ph' },
          h('span', { className: 'sdb-pt' }, '财联社电报'),
          h('span', { className: 'sdb-ps' }, error ? error : '消息来源 · 60s 刷新')),
        !items.length && !error && h('div', { className: 'sdb-aihint' }, '加载快讯…'),
        h('div', { className: 'sdb-news' },
          items.slice(0, 14).map((n) => h('div', { key: n.id || n.time + n.title, className: 'sdb-nw', title: (n.content || n.title || '') + '（财联社电报，不构成投资建议）' },
            h('span', { className: 'tm num' }, n.time),
            h('span', { className: 'dt ' + (n.level || 'C') }),
            h('span', { className: 'tx' },
              n.title ? h('b', null, n.title) : null,
              n.title && n.content ? ' ' : null,
              (n.title && n.content && n.content !== n.title ? n.content : (n.title ? '' : n.content || '')).slice(0, 60),
              n.stocks && n.stocks.length ? h('span', { className: 'st' }, ' ' + n.stocks.map((s) => s.name).join(' ')) : null)))));
    }

    function HotList({ rows, onHover }) {
      if (!rows || !rows.length) return h('div', { className: 'sdb-empty' }, '加载中…');
      return h('div', { style: { paddingBottom: 8 } },
        rows.slice(0, 10).map((s) => {
          const rc = Number(s.rankChange) || 0;
          const rcText = rc > 0 ? '▲' + rc : rc < 0 ? '▼' + Math.abs(rc) : '—';
          const rcCls = rc > 0 ? 'up' : rc < 0 ? 'down' : '';
          // 图表弹窗仅由名称触发；移出名称即计划关闭，避免整行大面积触发
          return h('div', { key: s.code, className: 'sdb-hot' },
            h('span', { className: 'rk num' + (s.rank <= 3 ? ' top' : '') }, String(s.rank || '')),
            h('span', {
              className: 'nm2', 'data-hover': '1', 'data-code': s.code, title: '东财人气榜 · 悬停看图表',
              onMouseOver: (e) => { if (onHover) onHover(s.code, e.currentTarget.getBoundingClientRect()); },
              onMouseLeave: () => { if (onHover) onHover(null); },
            },
              s.name,
              h('span', { className: 'rkch ' + rcCls, title: '人气名次变化' }, rcText)),
            h('span', { className: 'num', style: { color: 'var(--tx2)', textAlign: 'right' } }, fmtNum(s.now)),
            h('span', { className: 'num ' + pctClass(s.pct), style: { textAlign: 'right', fontWeight: 600 } }, fmtPct(s.pct)));
        }));
    }

    // ---------------------------------------------------------------------------
    // 图表弹窗（悬浮固定）：日K / 分时 可切换；指数点击与个股悬停共用
    // ---------------------------------------------------------------------------
    function KlineHoverCard({ code, anchorRect, pinned, onClose, data, cancelClose, scheduleClose, onPin, infoOverride }) {
      const [view, setView] = useState('daily');
      const bars = useKline(code);
      const inds = useMemo(() => (bars && bars.length ? computeDailyInds(bars) : null), [bars]);
      const minutePts = useMinute(code); // 无条件调用（Hook 顺序稳定）；仅分时视图渲染
      const [fetchedPre, setFetchedPre] = useState(null);
      const info = (function () {
        if (infoOverride) return infoOverride;
        for (const list of [data.hot, data.speed, data.zt, data.watchRows]) {
          const r = list && list.find((x) => x.code === code);
          if (r) return { name: r.name, now: r.now, preclose: r.preclose, pct: r.pct };
        }
        const b = bars && bars[bars.length - 1];
        return b ? { name: code, now: b.close, preclose: bars[bars.length - 2] ? bars[bars.length - 2].close : b.open, pct: null } : { name: code };
      })();
      // 分时视图缺少昨收时（指数/未在榜单的个股）向桥接取快照
      useEffect(() => {
        if (view !== 'minute' || info.preclose != null || fetchedPre != null) return;
        let alive = true;
        api().snapshot([code]).then((rows) => { if (alive && rows && rows[0] && rows[0].preclose != null) setFetchedPre(rows[0].preclose); });
        return () => { alive = false; };
      }, [view, code, info.preclose, fetchedPre]);
      const preclose = info.preclose != null ? info.preclose : fetchedPre;
      const W = 560, H = 372;
      const left = Math.min(Math.max(8, anchorRect.left - 40), Math.max(8, window.innerWidth - W - 8));
      const below = anchorRect.bottom + 8;
      const top = below + H > window.innerHeight - 8 ? Math.max(8, anchorRect.top - H - 8) : below;
      const vtab = (k, label) => h('button', {
        className: 'sdb-vtab' + (view === k ? ' on' : ''), onClick: () => setView(k), type: 'button',
      }, label);
      return h('div', { className: 'sdb-hover', style: { left, top },
        onMouseEnter: () => cancelClose(), onMouseLeave: () => { if (!pinned) scheduleClose(); } },
        h('div', { className: 'hd' },
          h('span', { className: 'nm', onClick: () => onPin(code), style: { cursor: 'pointer' }, title: pinned ? '点击取消固定' : '点击固定' },
            info.name),
          h('span', { className: 'sdb-cd' }, code),
          info.now != null && h('span', { className: 'px num ' + pctClass(info.pct) }, fmtNum(info.now)),
          info.pct != null && h('span', { className: 'num ' + pctClass(info.pct) }, fmtPct(info.pct)),
          h('span', { style: { flex: 1 } }),
          h('div', { className: 'sdb-vtabs', role: 'tablist' }, vtab('daily', '日K'), vtab('minute', '分时')),
          pinned && h('span', { className: 'sdb-tag' }, '已固定'),
          h('button', { className: 'sdb-btn', onClick: onClose, title: '关闭 (Esc)' }, '✕')),
        view === 'daily'
          ? (bars && bars.length
              ? h(Chart, { mode: 'daily', bars, inds, height: 300 })
              : h('div', { className: 'sdb-loading', style: { height: 300 } }, h('span', { className: 'sdb-spin' }), '预加载日K…'))
          : (minutePts && minutePts.length > 1
              ? h(Chart, { mode: 'minute', pts: minutePts, preclose, height: 300 })
              : h('div', { className: 'sdb-loading', style: { height: 300 } }, h('span', { className: 'sdb-spin' }), '加载分时…')),
        h('div', { className: 'sdb-legend' },
          view === 'daily'
            ? ['MA5', 'MA10', 'MA20'].map((t, i) => h('span', { key: t, style: { color: MA_COLORS[i] } }, t))
            : h('span', { style: { color: ACCENT } }, '均价线'),
          view === 'daily' ? h('span', { style: { color: DOWN } }, '── 支撑') : null,
          view === 'daily' ? h('span', { style: { color: ACCENT } }, '-- 突破/压力') : null,
          h('span', null, view === 'daily' ? '滚轮缩放 · 拖拽平移 · 十字光标' : '昨收基准 · 均价 · 分时量'),
          h('span', { style: { marginLeft: 'auto' } }, pinned ? '点击名称取消固定' : '点击名称可固定')));
    }

    // ---------------------------------------------------------------------------
    // 设置弹窗：涨速榜开关 / 科创·创业·ST 过滤 / TDX Token / 默认模型
    // ---------------------------------------------------------------------------
    const GEAR_PATH = 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.487.487 0 0 0-.59.22l-1.92 3.32c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z';
    function GearIcon() {
      return h('svg', { viewBox: '0 0 24 24', width: 14, height: 14, 'aria-hidden': true, style: { display: 'block' } },
        h('path', { d: GEAR_PATH, fill: 'currentColor' }));
    }
    // 迷你开关（设置项）：role="switch" + aria-checked，绿色=开
    function MiniSwitch({ on, onChange, label, title }) {
      return h('button', {
        className: 'sdb-msw' + (on ? ' on' : ''), role: 'switch', 'aria-checked': on,
        onClick: () => onChange(!on), title: title || label, type: 'button',
      },
        h('span', { className: 'sdb-msw-track' }, h('span', { className: 'sdb-msw-knob' })),
        h('span', { className: 'sdb-msw-lab' }, label));
    }
    // 数据服务开关（状态与按钮合并）：旋钮颜色表达连接状态（绿=实时 / 琥珀=缓存 / 灰=关）
    function ServiceSwitch({ on, live, cacheTime, onToggle }) {
      const state = !on ? 'off' : live ? 'live' : 'cache';
      const title = !on ? '数据服务已关闭：点击开启（本地持久化）'
        : live ? '数据服务已连接（实时）：点击关闭'
          : '桥接断开：展示最近缓存' + (cacheTime ? '（' + cacheTime + '）' : '') + '，点击关闭；可用「重连」拉起服务';
      return h('button', { className: 'sdb-switch', role: 'switch', 'aria-checked': on, onClick: onToggle, title, type: 'button' },
        h('span', { className: 'sdb-knob ' + state }, h('i')),
        h('span', { className: 'sdb-switch-tx' },
          h('b', null, on ? '数据服务' : '服务关'),
          h('span', { className: 'sdb-switch-sub' + (state === 'live' ? ' live' : state === 'cache' ? ' cache' : '') },
            !on ? '已关闭' : live ? '已连接' : '缓存' + (cacheTime ? ' ' + cacheTime : ''))));
    }
    function SettingsModal({ onClose }) {
      const [models, setModels] = useState(AiState.models);
      const [loading, setLoading] = useState(false);
      const [token, setToken] = useState('');
      const [tokenState, setTokenState] = useState(null);
      const [saving, setSaving] = useState(false);
      const [tokenInfo, setTokenInfo] = useState(AiState.tokenInfo);
      const TDX_KEY_URL = 'https://vip.tdx.com.cn/site/app/pc-mall/main.html#/aiKey';
      useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, [onClose]);
      // 当前 Token 状态：优先取 IDB 缓存即时显示，再向桥接 /config 校准
      useEffect(() => {
        let alive = true;
        IDB.get('tokenInfo').then((t) => { if (alive && t && !AiState.tokenInfo) { AiState.tokenInfo = t; setTokenInfo(t); } });
        fetchJSON(bridgeBase() + '/config', 8000).then((cfg) => {
          if (!alive || !cfg || !cfg.ok) return;
          const info = { tokenMasked: cfg.tokenMasked || '', iniPath: cfg.iniPath || null };
          AiState.tokenInfo = info;
          setTokenInfo(info);
          IDB.set('tokenInfo', info);
        }).catch(() => { /* 服务未连接：保留缓存显示 */ });
        return () => { alive = false; };
      }, []);
      const loadModels = useCallback(async () => {
        setLoading(true);
        try {
          const out = await sameOriginJSON('/stock-dashboard/api/models', 'GET', undefined, 20000);
          if (out && out.ok) { AiState.models = out; setModels(out); }
        } catch (e) { /* 目录拉取失败：仍可跟随默认 */ }
        finally { setLoading(false); }
      }, []);
      useEffect(() => { if (!AiState.models) loadModels(); }, [loadModels]);
      const setPrefs = (patch) => {
        Ui.prefs = { ...Ui.prefs, ...patch };
        saveSettings();
        aiNotify();
      };
      const setModelPref = (value) => {
        if (!value) Ui.model = { provider: '', model: '' };
        else {
          const sep = value.indexOf('||');
          Ui.model = { provider: value.slice(0, sep), model: value.slice(sep + 2) };
        }
        saveSettings();
        aiNotify();
      };
      const saveToken = async () => {
        setSaving(true); setTokenState(null);
        try {
          const res = await fetchJSON(bridgeBase() + '/config', 10000, 'POST', { token });
          if (res && res.ok) {
            setTokenState({ ok: true, msg: '已写入 TdxAiData.ini，正在重启数据服务（约 5 秒后自动重连；若浏览器弹出 tdxbridge 确认请允许）' });
            const t = token.trim();
            const masked = t.length > 8 ? t.slice(0, 4) + '****' + t.slice(-4) : t.slice(0, 2) + '****';
            const info = { tokenMasked: masked, iniPath: (AiState.tokenInfo && AiState.tokenInfo.iniPath) || null };
            AiState.tokenInfo = info;
            setTokenInfo(info);
            IDB.set('tokenInfo', info);
            setToken('');
            try { await fetchJSON(bridgeBase() + '/shutdown', 8000, 'POST', {}); } catch (e) { /* 服务退出时连接中断属预期 */ }
          } else {
            setTokenState({ ok: false, msg: (res && res.error) || '保存失败：数据服务未连接' });
          }
        } catch (e) {
          setTokenState({ ok: false, msg: '保存失败：数据服务未连接（请先开启服务并重连）' });
        }
        setSaving(false);
      };
      const ck = (key, label, title) => MiniSwitch({
        on: !!Ui.prefs[key], onChange: (v) => setPrefs({ [key]: v }), label, title,
      });
      const modelValue = Ui.model.provider && Ui.model.model ? Ui.model.provider + '||' + Ui.model.model : '';
      return h('div', { className: 'sdb-mask', onClick: onClose },
        h('div', { className: 'sdb-modal', role: 'dialog', 'aria-modal': true, 'aria-label': '看板设置', onClick: (e) => e.stopPropagation() },
          h('div', { className: 'sdb-mhd' },
            h('span', { className: 'sdb-pt' }, '看板设置'),
            h('button', { className: 'sdb-btn', onClick: onClose, title: '关闭 (Esc)' }, '✕')),
          h('div', { className: 'sdb-mbody' },
            h('div', { className: 'sdb-card' },
              h('div', { className: 'sdb-ms' }, '榜单与过滤'),
              h('div', { className: 'sdb-cardrow' }, ck('showSpeed', '展示涨速冲板榜', '关闭后顶部不显示涨速冲板标签页')),
              h('div', { className: 'sdb-cardrow sdb-wrap' },
                ck('filterKcb', '过滤科创板', '榜单中隐藏 688/689 开头股票'),
                ck('filterCyb', '过滤创业板', '榜单中隐藏 300/301 开头股票'),
                ck('filterSt', '过滤 ST', '榜单中隐藏名称含 ST 的股票')),
              h('div', { className: 'sdb-hint' }, '过滤作用于涨速冲板、涨停榜与热门股；自选股不受影响')),
            h('div', { className: 'sdb-card' },
              h('div', { className: 'sdb-ms' }, 'AI 默认模型'),
              h('div', { className: 'sdb-cardrow' },
                h('select', {
                  className: 'sdb-sel', value: modelValue,
                  onChange: (e) => setModelPref(e.target.value),
                },
                  h('option', { value: '' }, '跟随 Harness 默认模型'),
                  (models && models.providers ? models.providers : []).map((p) => h('optgroup', { key: p.provider, label: p.label },
                    (p.models || []).map((m) => h('option', { key: p.provider + '||' + m.id, value: p.provider + '||' + m.id }, m.name + '（' + m.id + '）'))))),
                loading ? h('span', { className: 'sdb-ps' }, '加载中…')
                  : !models ? h('button', { className: 'sdb-chip', onClick: loadModels }, '重新加载') : null),
              h('div', { className: 'sdb-hint' },
                modelValue ? '当前：' + Ui.model.model : '当前：跟随 Harness 默认。作用于 AI 评分与异动监控，不改变会话模型。')),
            h('div', { className: 'sdb-card' },
              h('div', { className: 'sdb-ms' }, 'TDX 数据服务 Token'),
              h('div', { className: 'sdb-cardrow' },
                h('input', {
                  className: 'sdb-in sdb-in-wide', type: 'password',
                  placeholder: tokenInfo && tokenInfo.tokenMasked
                    ? '当前已设置：' + tokenInfo.tokenMasked + '（输入新 Key 覆盖）'
                    : '通达信商城 Key（写入 TdxAiData.ini [Token]）',
                  value: token, onChange: (e) => setToken(e.target.value),
                }),
                h('button', { className: 'sdb-btn acc', disabled: saving || !token.trim(), onClick: saveToken, title: '写入 INI 并重启本地桥接' }, saving ? '保存中…' : '保存并重启服务')),
              tokenState && h('div', { className: tokenState.ok ? 'sdb-ok' : 'sdb-err', style: { padding: '4px 2px 0' } }, tokenState.msg),
              h('div', { className: 'sdb-hint' },
                'Token 获取：',
                h('a', { className: 'sdb-lnk', href: TDX_KEY_URL, target: '_blank', rel: 'noreferrer' },
                  'vip.tdx.com.cn/site/app/pc-mall/main.html#/aiKey'),
                '（通达信商城 → 会员中心 → 积分和Key管理 → 创建数据服务Key）'),
              h('div', { className: 'sdb-hint' },
                tokenInfo && tokenInfo.tokenMasked
                  ? '当前 Token：' + tokenInfo.tokenMasked + (tokenInfo.iniPath ? ' · ' + tokenInfo.iniPath : '')
                  : '尚未检测到已设置的 Token。修改需重启桥接生效，重启由看板自动完成；若浏览器弹出 tdxbridge 确认请允许。'))),
          h('div', { className: 'sdb-mft' },
            h('span', null, 'AI 生成内容不构成投资建议，请自行把握'),
            h('span', { style: { marginLeft: 'auto' } }, '设置保存在本机浏览器'))));
    }
    // ---------------------------------------------------------------------------
    // Dashboard root
    // ---------------------------------------------------------------------------
    const WATCH_KEY = 'stock-dashboard.watchlist';
    const DEFAULT_WATCH = ['600519.SH', '300750.SZ', '688981.SH', '601318.SH', '300059.SZ'];
    function loadWatch() {
      try { const raw = localStorage.getItem(WATCH_KEY); if (raw) { const v = JSON.parse(raw); if (Array.isArray(v)) return v; } } catch (e) { /* ignore */ }
      return DEFAULT_WATCH.slice();
    }

    // 渲染错误边界：任何子树异常只降级本看板并给出重试，绝不白屏拖垮整个页面
    class DashBoundary extends React.Component {
      constructor(props) { super(props); this.state = { err: null }; }
      static getDerivedStateFromError(err) { return { err }; }
      componentDidCatch(err) { try { console.error('[stock-dashboard]', err); } catch (e) { /* ignore */ } }
      render() {
        if (this.state.err) {
          return h('div', { className: 'sdb', style: { padding: 24 } },
            h('style', null, CSS),
            h('div', { className: 'sdb-empty', style: { padding: '60px 0', fontSize: 13 } },
              '⚠ 看板渲染出错（已拦截，不影响 Harness 其它功能）：',
              h('div', { className: 'sdb-err', style: { padding: '8px 0' } }, String((this.state.err && this.state.err.message) || this.state.err)),
              h('button', { className: 'sdb-btn', onClick: () => this.setState({ err: null }) }, '重试渲染')));
        }
        return this.props.children;
      }
    }

    function DashboardApp() {
      const [tab, setTab] = useState(() => DataHub.tab || 'watch');
      const [tick, setTick] = useState(0);
      const [paused, setPaused] = useState(() => !!DataHub.paused);
      const [watch, setWatch] = useState(loadWatch);
      const [query, setQuery] = useState('');
      const [data, setData] = useState(() => DataHub.data
        ? { ...{ indices: [], speed: [], zt: [], sectors: [], hot: [], watchRows: [], global: null }, ...DataHub.data }
        : { indices: [], speed: [], zt: [], sectors: [], hot: [], watchRows: [], global: null });
      const [draft, setDraft] = useState('');
      const [launching, setLaunching] = useState(false);
      const [hover, setHover] = useState(null);   // {code, rect, pinned, info?}
      const [settingsOpen, setSettingsOpen] = useState(false);
      const hoverTimer = useRef(0);
      const closeTimer = useRef(0);
      const autoStartRef = useRef(0);

      // 指数点击 → 固定图表弹窗（日K/分时可切换）
      const openIndexChart = useCallback((idx, rect) => {
        setHover((prev) => (prev && prev.code === idx.code && prev.pinned)
          ? null
          : { code: idx.code, rect, pinned: true, info: { name: idx.name, now: idx.now, preclose: idx.preclose, pct: idx.pct } });
      }, []);

      useEffect(() => { try { localStorage.setItem(WATCH_KEY, JSON.stringify(watch)); } catch (e) { /* ignore */ } }, [watch]);

      // DataHub 回写：行情快照与面板状态常驻内存，切走再切回即时恢复（不空屏、不等接口）
      useEffect(() => { DataHub.data = data; DataHub.ts = Date.now(); }, [data]);
      useEffect(() => { DataHub.tab = tab; }, [tab]);
      useEffect(() => { DataHub.paused = paused; }, [paused]);

      // 行情快照持久化（IndexedDB，30s 节流 + 页面卸载落盘）：刷新后即时回显最近行情
      const lastSnapSave = useRef(0);
      useEffect(() => {
        const now = Date.now();
        if (now - lastSnapSave.current > 30000) {
          lastSnapSave.current = now;
          IDB.set('dataSnapshot', { ...data, __ts: now });
        }
      }, [data]);
      useEffect(() => {
        const onHide = () => IDB.set('dataSnapshot', { ...data, __ts: Date.now() });
        window.addEventListener('pagehide', onHide);
        return () => window.removeEventListener('pagehide', onHide);
      }, [data]);

      // AI 通知 + 财联社快讯轮询（快讯无 token 成本，始终拉取）
      const [aiTick, setAiTick] = useState(0);
      useEffect(() => {
        aiNotify = () => setAiTick((v) => v + 1);
        return () => { aiNotify = () => {}; };
      }, []);
      useEffect(() => {
        let alive = true;
        const run = () => { if (!document.hidden) fetchNews().then(() => { if (alive) setAiTick((v) => v + 1); }); };
        run();
        const t = setInterval(run, 60000);
        return () => { alive = false; clearInterval(t); };
      }, []);

      // TDX 数据服务总开关（持久化）：开启时 30s 退避自动重连；关闭时不轮询、不调 AI
      const svcOn = Ui.svc.on;
      const toggleSvc = useCallback(() => {
        Ui.svc.on = !Ui.svc.on;
        saveSettings();
        if (Ui.svc.on) { autoStartRef.current = 0; setTick((t) => t + 1); }
        aiNotify();
      }, []);
      const startBridge = useCallback(() => {
        autoStartRef.current = Date.now();
        setLaunching(true);
        setTimeout(() => setLaunching(false), 8000);
        setTimeout(() => setTick((t) => t + 1), 3500);
      }, []);
      useEffect(() => {
        if (!svcOn) return;
        const t = setInterval(() => {
          if (bridgeOk !== true && Date.now() - autoStartRef.current > 30000) startBridge();
        }, 5000);
        return () => clearInterval(t);
      }, [svcOn, startBridge]);

      // 行情轮询：断开时桥接层自动回落最近缓存，连接后自动更新（无演示数据）
      // v1.5 性能修复：刷新加重叠保护（上一轮未完成不重入），慢网/断开时不再堆积请求
      const refreshingRef = useRef(false);
      useEffect(() => {
        if (!svcOn) return;
        let alive = true; let timer = null;
        const a = api();
        async function refresh() {
          if (document.hidden || refreshingRef.current) return;
          refreshingRef.current = true;
          try {
            const [indices, speed, zt, sectors, watchRows, globalStats] = await Promise.all([
              a.indices(), a.speedRank(50), a.ztRank(50), a.sectors(10), a.snapshot(watch), a.global(),
            ]);
            if (!alive) return;
            setData((prev) => ({
              indices: indices ?? prev.indices,
              speed: speed ?? prev.speed,
              zt: zt ?? prev.zt,
              sectors: sectors ?? prev.sectors,
              hot: prev.hot, // 热门股走东财人气榜，5 分钟独立刷新（见下）
              watchRows: watchRows ?? prev.watchRows,
              global: globalStats ?? prev.global,
            }));
            // 预加载：冲板/榜单前 24 只的分时与日K（冲板 AI 的 K 线摘要依赖日K缓存）
            const src = tab === 'watch' ? watchRows : tab === 'speed' ? compositeSpeedRows(speed, Ui.prefs) : zt;
            const codes = (src || []).slice(0, 24).map((r) => r && r.code).filter(Boolean);
            if (codes.length) { MinuteStore.request(codes); queueKlinePrefetch(codes); }
          } finally {
            refreshingRef.current = false;
          }
        }
        refresh();
        if (!paused) timer = setInterval(refresh, 4000);
        return () => { alive = false; if (timer) clearInterval(timer); };
      }, [tick, paused, watch.join(','), tab, svcOn]);

      // 东财人气榜前10：15s 询问一次（桥接 300s TTL → 实际 5 分钟刷新；询问近乎零成本）
      // 挂载即取（bridgeOk 未确认也尝试）；结果写入 AiState.hotRows + IndexedDB，刷新后即时回显
      useEffect(() => {
        if (!svcOn) return;
        let alive = true;
        const run = async () => {
          if (document.hidden) return;
          const rows = await bridgeGet('/hot_rank', 10000);
          if (!alive || !rows || !rows.length) return;
          AiState.hotRows = rows;
          IDB.set('hotRows', rows);
          setData((prev) => {
            const prevSig = (prev.hot || []).map((r) => r.code + ':' + r.now).join('|');
            const nextSig = rows.map((r) => r.code + ':' + r.now).join('|');
            return prevSig === nextSig ? prev : { ...prev, hot: rows };
          });
        };
        run();
        const t = setInterval(run, 15000);
        return () => { alive = false; clearInterval(t); };
      }, [svcOn]);

      // AI 载荷 + 评分调度（随行情/标签页变化；不依赖 aiTick —— 完成通知不会自激励重跑）
      const scoreOn = Ui.ai.score;
      useEffect(() => {
        AiState.scorePayload = buildScorePayload(data);
        AiState.monitorPayload = buildMonitorPayload(data);
        AiState.limitupPayload = buildLimitupPayload(data, Ui.prefs);
        if (!scoreOn || !svcOn || bridgeOk !== true) return;
        const kind = tab === 'speed' ? 'limitup' : 'bullish';
        const payload = kind === 'limitup' ? AiState.limitupPayload : AiState.scorePayload;
        if (!payload) return;
        const hasData = kind === 'limitup'
          ? payload.stocks && payload.stocks.length
          : ((payload.sectors && payload.sectors.length) || (payload.stocks && payload.stocks.length));
        if (!hasData) return;
        const c = AiState.score;
        const ts = kind === 'limitup' ? c.tsLimitup : c.tsBullish;
        const lastAttempt = kind === 'limitup' ? c.lastAttemptLimitup : c.lastAttemptBullish;
        // 内容 TTL 内不重评；发过后 45s 内不重试（节流/缓存响应也不再自激励）
        if (Date.now() - ts > SCORE_TTL_MS && Date.now() - lastAttempt > 45000) runScore(false, tab);
      }, [data, tab, svcOn, scoreOn]);

      // 异动监控：90s 定时节拍；挂载即查（Host 直接返回已缓存报告，桥接未确认也可查）
      const monitorOn = Ui.ai.monitor;
      useEffect(() => {
        if (!monitorOn || !svcOn) return;
        const run = () => {
          if (document.hidden || !AiState.monitorPayload) return;
          if (Date.now() - AiState.monitor.lastAttempt < 30000) return; // 最小重查间隔
          runMonitor(false);
        };
        run();
        const t = setInterval(run, 90000);
        return () => clearInterval(t);
      }, [svcOn, monitorOn]);

      const toggleWatch = useCallback((code, on) => {
        setWatch((w) => on ? (w.indexOf(code) >= 0 ? w : w.concat([code])) : w.filter((c) => c !== code));
      }, []);
      const addWatch = useCallback((input) => {
        const code = normalizeCode(input);
        if (!code) return false;
        setWatch((w) => (w.indexOf(code) >= 0 ? w : w.concat([code])));
        return true;
      }, []);
      // 支持代码或名称添加：名称走桥接 /search；未找到/失败用 Toast 提示
      const addWatchInput = useCallback(async (input) => {
        const s = String(input || '').trim();
        if (!s) return false;
        const code = normalizeCode(s);
        if (code) {
          if (!addWatch(code)) { Toasts.notify('已在备选中：' + code, 'warn'); return false; }
          Toasts.notify('已添加 ' + code);
          return true;
        }
        try {
          const res = await fetchJSON(bridgeBase() + '/search?q=' + encodeURIComponent(s), 10000);
          const rows = Array.isArray(res) ? res : [];
          if (!rows.length) { Toasts.notify('未找到股票：' + s, 'err'); return false; }
          const exact = rows.find((r) => r.name === s);
          const hit = exact || rows[0];
          if (!addWatch(hit.code)) { Toasts.notify('已在备选中：' + hit.name, 'warn'); return false; }
          Toasts.notify('已添加 ' + hit.name + '（' + hit.code + '）' + (!exact && rows.length > 1 ? '，另有 ' + (rows.length - 1) + ' 个同名/近似匹配' : ''));
          return true;
        } catch (e) {
          Toasts.notify('搜索失败：数据服务未连接', 'err');
          return false;
        }
      }, []);

      const cancelClose = useCallback(() => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = 0; } }, []);
      const scheduleClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setHover(null), 250);
      }, []);
      const handleHover = useCallback((code, rect) => {
        if (!code) { scheduleClose(); return; }
        cancelClose();
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => setHover((prev) => (prev && prev.pinned ? prev : { code, rect, pinned: false })), 220);
      }, [cancelClose, scheduleClose]);
      const pinHover = useCallback((code) => {
        setHover((prev) => (prev && prev.code === code && prev.pinned) ? null : (prev && prev.code === code ? { ...prev, pinned: true } : prev));
      }, []);
      useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setHover(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, []);

      const a = api();
      const sourceOk = bridgeOk;
      const g = data.global;
      const svcLive = svcOn && bridgeOk === true;

      // 过滤 + 冲板排序（只作用于全市场榜单；自选股为用户手工维护，不过滤）
      const speedRows = compositeSpeedRows(data.speed, Ui.prefs).slice(0, 10);
      const ztRows = (data.zt || []).filter((r) => passesFilters(r, Ui.prefs));
      const hotSrc = (data.hot && data.hot.length) ? data.hot : AiState.hotRows; // IndexedDB 回显兜底
      const hotRows = hotSrc.filter((r) => passesFilters(r, Ui.prefs)).slice(0, 10);
      const activeTab = tab === 'speed' && !Ui.prefs.showSpeed ? 'watch' : tab;

      const filtered = (rows) => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return (rows || []).filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
      };
      const stat = (label, value, cls) => h('span', null, label + ' ', h('b', { className: 'num ' + (cls || '') }, value));

      const tabRows = filtered(activeTab === 'watch' ? data.watchRows : activeTab === 'speed' ? speedRows : ztRows);
      const maxSpeed = Math.max(0.01, ...speedRows.map((x) => Math.abs(x.speed || 0)));

      const columns = activeTab === 'watch'
        ? [COL.star(watch), COL.name, COL.mini, COL.now, COL.chg, COL.pct, COL.score, COL.speed, COL.amount, COL.turnover, COL.del]
        : activeTab === 'speed'
          ? [COL.star(watch), COL.name, COL.mini, COL.now, COL.pct,
            { key: 'speed', title: '3分涨速', render: (r) => h('span', null,
              h('span', { className: 'sdb-bar' }, h('i', { style: { width: Math.min(100, Math.abs(r.speed || 0) / maxSpeed * 100) + '%', background: r.speed > 0 ? UP : r.speed < 0 ? DOWN : '#7d8b9c' } })),
              h('span', { className: 'num ' + pctClass(r.speed), style: { fontWeight: 600 } }, fmtPct(r.speed))) },
            { key: '_ai', title: '冲板AI', render: (r) => limitupCell(r.code) },
            COL.turnover, COL.amount]
          : [COL.star(watch),
            { key: 'name', title: '名称 / 代码', left: true, render: (r) => nameCell(r, h('span', { className: 'sdb-tag' }, r.days > 1 ? r.days + '连板' : '首板')) },
            COL.mini, COL.now, COL.pct, COL.chg, COL.score,
            { key: 'firstTime', title: '首板时间' },
            { key: 'openTimes', title: '开板', render: (r) => String(r.openTimes) },
            { key: 'sealAmount', title: '封单额', render: (r) => h('span', { className: 'sdb-up' }, fmtAmount(r.sealAmount)) }];

      const cacheTs = BridgeCache.ts('/global');
      const cacheTime = cacheTs ? new Date(cacheTs).toTimeString().slice(0, 5) : '';

      return h('div', { className: 'sdb' },
        h('style', null, CSS),
        launching && svcOn && h('iframe', { src: 'tdxbridge://start', title: 'bridge-launcher', style: { display: 'none' } }),

        h('div', { className: 'sdb-top' },
          h('span', { className: 'sdb-brand' }, '盘口', h('small', null, 'A-SHARE DESK')),
          g && h('div', { className: 'sdb-stats num' },
            stat('上涨', String(g.up), 'sdb-up'), stat('下跌', String(g.down), 'sdb-down'),
            stat('涨停', String(g.zt), 'sdb-up'), stat('跌停', String(g.dt), 'sdb-down'),
            stat('炸板', String(g.zhaban)), stat('最高连板', g.maxLb + '板', 'sdb-ac'), stat('沪深成交', fmtAmount(g.amount))),
          h('span', { style: { flex: 1 } }),
          h(ServiceSwitch, { on: svcOn, live: sourceOk === true, cacheTime, onToggle: toggleSvc }),
          svcOn && sourceOk === false && h('button', { className: 'sdb-btn acc', onClick: startBridge, title: '通过 tdxbridge:// 协议重启本地桥接（浏览器可能弹出打开确认）' }, launching ? '启动中…' : '重连'),
          h('button', { className: 'sdb-btn', onClick: () => setPaused(!paused), title: paused ? '恢复 4s 自动刷新' : '暂停 4s 自动刷新' }, paused ? '继续' : '暂停'),
          h('button', { className: 'sdb-btn', onClick: () => setTick((t) => t + 1) }, '刷新'),
          h('button', { className: 'sdb-icon-btn', onClick: () => setSettingsOpen(true), title: '看板设置', 'aria-label': '看板设置' }, h(GearIcon))),

        h(IndexStrip, { indices: data.indices, onOpenChart: openIndexChart }),

        h('div', { className: 'sdb-body' },
          h('div', { className: 'sdb-p' },
            h('div', { className: 'sdb-tabs' },
              [['watch', '备选股', watch.length],
                ...(Ui.prefs.showSpeed ? [['speed', '涨速冲板', speedRows.length]] : []),
                ['zt', '涨停榜', ztRows.length]].map(([k, label, cnt]) =>
                h('button', { key: k, className: 'sdb-tab' + (activeTab === k ? ' on' : ''), onClick: () => setTab(k) },
                  label, h('span', { className: 'cnt' + (activeTab === k ? ' on' : '') }, String(cnt))))),
            h('div', { className: 'sdb-tool' },
              activeTab === 'watch' && h('input', {
                className: 'sdb-in', placeholder: '代码或名称，回车添加', value: draft,
                onChange: (e) => setDraft(e.target.value),
                onKeyDown: (e) => { if (e.key === 'Enter') { const v = draft; addWatchInput(v).then((ok) => { if (ok) setDraft(''); }); } },
              }),
              activeTab === 'watch' && h('button', { className: 'sdb-btn', onClick: () => { const v = draft; addWatchInput(v).then((ok) => { if (ok) setDraft(''); }); } }, '添加'),
              h('input', { className: 'sdb-in sdb-q', placeholder: '搜索名称 / 代码…', value: query, onChange: (e) => setQuery(e.target.value) }),
              query && h('span', { className: 'sdb-ps' }, '筛选 ' + tabRows.length + ' 条'),
              activeTab === 'speed' && h('span', { className: 'sdb-ps', title: '以涨速为主要排序，涨幅≥5%作为次要排序，目的是找冲击涨停的股票' }, '涨速优先 · 涨幅≥5%次序 · TOP10'),
              h('span', { style: { flex: 1 } }),
              h('span', { className: 'sdb-ps' }, !svcOn ? '服务已关' : paused ? '已暂停' : '4s 自动刷新')),
            h(DataTable, {
              columns, rows: tabRows,
              onHover: handleHover,
              onNameClick: pinHover,
              onStar: toggleWatch, onRemove: (code) => toggleWatch(code, false),
              empty: activeTab === 'watch'
                ? '备选股为空：输入代码添加，或在榜单点 ☆ 加入'
                : activeTab === 'speed'
                  ? (svcLive ? '暂无冲板数据（等待行情或放宽设置中的过滤）' : '等待行情连接：连接后展示冲板榜')
                  : (query ? '无匹配「' + query + '」的结果' : '暂无涨停数据（等待行情连接或放宽过滤）'),
            })),
          h('div', { className: 'sdb-side' },
            h(AiPanel, { key: 'ai-' + aiTick }))),

        // 热门板块 / 热门股 / 财联社电报：独立三栏区，主表之下、一眼可见
        h('div', { className: 'sdb-hotstrip' },
          h('div', { className: 'sdb-p' },
            h('div', { className: 'sdb-ph' }, h('span', { className: 'sdb-pt' }, '热门板块'), h('span', { className: 'sdb-ps' }, '今日涨幅 TOP10 · AI分')),
            h('div', { className: 'sdb-strip-scroll' }, h(SectorBars, { rows: data.sectors }))),
          h('div', { className: 'sdb-p' },
            h('div', { className: 'sdb-ph' }, h('span', { className: 'sdb-pt' }, '热门股'), h('span', { className: 'sdb-ps' }, '东财人气 TOP10 · 5min')),
            h('div', { className: 'sdb-strip-scroll' }, h(HotList, { rows: hotRows, onHover: handleHover }))),
          h(NewsPanel, { key: 'nw-' + aiTick })),

        h('div', { className: 'sdb-foot' },
          h('span', null, !svcOn
            ? '数据服务已关闭：展示最近缓存（不轮询、不调用 AI）'
            : sourceOk === true
              ? '数据源：本地 TdxAiData 桥接（实时更新）'
              : sourceOk === false
                ? '服务断开：展示最近缓存' + (cacheTime ? '（' + cacheTime + '）' : '') + '，重连后自动更新'
                : '正在连接本地 TdxAiData 桥接…'),
          h('span', null, '行情有延迟，不构成投资建议'),
          (Ui.ai.score || Ui.ai.monitor) && h('span', { className: 'sdb-ac' }, 'AI 内容由模型生成，不构成投资建议'),
          h('span', { style: { marginLeft: 'auto' } }, '悬停股票名看日K · ⚙ 设置可过滤板块/ST')),

        hover && h(KlineHoverCard, {
          code: hover.code, anchorRect: hover.rect, pinned: hover.pinned,
          onClose: () => setHover(null),
          data,
          infoOverride: hover.info,
          cancelClose, scheduleClose,
          onPin: pinHover,
        }),

        h('div', { className: 'sdb-toasts' }, Toasts.list.map((t) => h('div', { key: t.id, className: 'sdb-toast ' + t.kind }, t.msg))),

        settingsOpen && h(SettingsModal, { onClose: () => setSettingsOpen(false) }));
    }

    // ---------------------------------------------------------------------------
    // Sidebar icon — Tabler `chart-candle`（MIT），描边路径线宽 1.4（细线）
    // ---------------------------------------------------------------------------
    const ICON_CHART_CANDLE = 'M4 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm2-3v2m0 5v9m4-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm2-11v10m0 5v1m4-14a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm2-2v1m0 6v9';
    function SidebarIcon() {
      return h('svg', {
        viewBox: '0 0 24 24', width: 18, height: 18, 'aria-hidden': true, style: { display: 'block' },
        fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round',
      },
        h('path', { d: ICON_CHART_CANDLE, strokeWidth: 1.4 }));
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: 'stock-dashboard', order: 50, label: '短线看板',
        }, SidebarIcon));
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: 'stock-dashboard',
        }, (props) => h(DashBoundary, null, h(DashboardApp, props))));
      },
    };
  },
});
