// js/app.js (UTF-8, no BOM)
// 强烈开奖动效 + 弹窗结果（不改核销接口，不改关键 id）
(function () {
  const $ = (id) => document.getElementById(id);

  const input = $("codeInput");
  const btn = $("drawBtn");
  const statusText = $("statusText");
  const resultWrap = $("resultWrap");
  const resultBox = $("resultBox");
  const resultMeta = $("resultMeta");

  // ====== 注入弹窗 + 动效 CSS（不需要你改 CSS 文件） ======
  (function injectFXStyle() {
    if (document.getElementById("xg-fx-style")) return;
    const style = document.createElement("style");
    style.id = "xg-fx-style";
    style.textContent = `
      :root{
        --xg-ink: rgba(15,20,32,.92);
        --xg-ink70: rgba(15,20,32,.70);
        --xg-line: rgba(15,20,32,.12);
        --xg-panel: rgba(255,255,255,.86);
        --xg-gold: #C9A24B;
        --xg-gold2:#E9D6A4;
      }

      /* 强开奖：整屏闪光/聚焦 */
      body.xg-burst::before{
        content:"";
        position: fixed; inset:-20vh -20vw;
        background:
          radial-gradient(60vw 40vh at 50% 40%, rgba(201,162,75,.30), transparent 62%),
          radial-gradient(55vw 35vh at 52% 45%, rgba(255,255,255,.45), transparent 68%);
        filter: blur(14px);
        opacity: 0;
        z-index: 9998;
        pointer-events:none;
        animation: xgFlash .85s ease-out both;
      }
      @keyframes xgFlash{
        0%{ opacity:0; transform: scale(.98); }
        18%{ opacity:.95; transform: scale(1); }
        100%{ opacity:0; transform: scale(1.02); }
      }

      /* 弹窗遮罩 */
      .xg-modal{
        position: fixed; inset:0;
        z-index: 9999;
        display:none;
        align-items:center;
        justify-content:center;
        padding: 18px;
        background: rgba(10,12,18,.22);
        backdrop-filter: blur(10px);
      }
      .xg-modal.show{ display:flex; animation: xgFadeIn .18s ease-out both; }
      @keyframes xgFadeIn{ from{ opacity:0; } to{ opacity:1; } }

      /* 弹窗卡片 */
      .xg-card{
        width: min(560px, 96vw);
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,.45);
        background: rgba(255,255,255,.88);
        box-shadow: 0 60px 180px rgba(16,20,32,.28);
        overflow:hidden;
        position: relative;
        transform: translateY(10px) scale(.98);
        opacity: 0;
        animation: xgPop .42s cubic-bezier(.2,.9,.2,1) .04s both;
      }
      @keyframes xgPop{
        to{ transform: translateY(0) scale(1); opacity:1; }
      }

      /* 顶部金色扫光 */
      .xg-card::before{
        content:"";
        position:absolute; inset:-40% -40%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.78), transparent);
        transform: rotate(18deg) translateX(-60%);
        opacity: .0;
        animation: xgShine 1.1s ease-out .08s both;
        pointer-events:none;
      }
      @keyframes xgShine{
        0%{ transform: rotate(18deg) translateX(-70%); opacity:0; }
        18%{ opacity:.22; }
        100%{ transform: rotate(18deg) translateX(70%); opacity:0; }
      }

      .xg-head{
        padding: 18px 18px 0 18px;
        display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
      }
      .xg-tag{
        font-size: 11px;
        letter-spacing: .22em;
        text-transform: uppercase;
        color: rgba(15,20,32,.62);
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid rgba(15,20,32,.10);
        background: rgba(255,255,255,.58);
      }
      .xg-close{
        width: 40px; height: 40px;
        border-radius: 14px;
        border: 1px solid rgba(15,20,32,.10);
        background: rgba(255,255,255,.62);
        display:grid; place-items:center;
        cursor:pointer;
      }
      .xg-close:active{ transform: translateY(1px); }

      .xg-body{
        padding: 14px 18px 18px 18px;
      }
      .xg-title{
        font-size: 24px;
        font-weight: 950;
        letter-spacing: -0.02em;
        color: rgba(15,20,32,.92);
        margin: 6px 0 8px;
      }
      .xg-sub{
        font-size: 13px;
        color: rgba(15,20,32,.62);
        line-height: 1.7;
      }
      .xg-code{
        margin-top: 12px;
        display:flex; gap:10px; flex-wrap:wrap; align-items:center;
      }
      .xg-chip{
        font-size: 12px;
        color: rgba(15,20,32,.70);
        border: 1px solid rgba(15,20,32,.10);
        background: rgba(255,255,255,.55);
        padding: 6px 10px;
        border-radius: 999px;
      }
      .xg-result{
        margin-top: 14px;
        border-radius: 18px;
        border: 1px solid rgba(15,20,32,.10);
        background: rgba(255,255,255,.64);
        padding: 14px;
      }
      .xg-result-k{
        font-size: 11px;
        letter-spacing: .22em;
        text-transform: uppercase;
        color: rgba(15,20,32,.55);
      }
      .xg-result-v{
        margin-top: 8px;
        font-size: 22px;
        font-weight: 950;
        color: rgba(15,20,32,.92);
      }

      .xg-actions{
        margin-top: 14px;
        display:grid;
        grid-template-columns: 1fr;
        gap:10px;
      }
      @media (min-width:520px){
        .xg-actions{ grid-template-columns: 1fr 1fr; }
      }

      .xg-btn{
        height: 48px;
        border-radius: 16px;
        border: 1px solid rgba(15,20,32,.10);
        font-weight: 900;
        letter-spacing: .08em;
        cursor:pointer;
      }
      .xg-btn-primary{
        background: linear-gradient(135deg, var(--xg-gold), var(--xg-gold2));
        color: rgba(15,20,32,.92);
        box-shadow: 0 18px 56px rgba(201,162,75,.26);
      }
      .xg-btn-ghost{
        background: rgba(255,255,255,.65);
        color: rgba(15,20,32,.82);
      }
      .xg-btn:active{ transform: translateY(1px); }

      /* 成功/失败主题 */
      .xg-win .xg-title{ color: rgba(15,20,32,.95); }
      .xg-win .xg-tag{ border-color: rgba(201,162,75,.22); }
      .xg-lose .xg-tag{ border-color: rgba(15,20,32,.14); }

      /* 金尘爆闪（强烈开奖） */
      .xg-confetti{
        position:absolute; inset:0;
        pointer-events:none;
        overflow:hidden;
      }
      .xg-confetti i{
        position:absolute;
        width: 8px; height: 8px;
        border-radius: 3px;
        background: linear-gradient(135deg, var(--xg-gold), var(--xg-gold2));
        opacity: .0;
        transform: translateY(-20px) rotate(0deg);
        animation: xgConfetti 1.25s ease-out forwards;
        box-shadow: 0 10px 22px rgba(201,162,75,.18);
      }
      @keyframes xgConfetti{
        0%{ opacity:0; transform: translateY(-20px) rotate(0deg) scale(.9); }
        15%{ opacity:.95; }
        100%{ opacity:0; transform: translateY(420px) rotate(420deg) scale(1); }
      }

      /* 按钮加载态更“仪式感” */
      .xg-loading{
        position: relative;
        overflow:hidden;
      }
      .xg-loading::after{
        content:"";
        position:absolute; inset:-30% -50%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
        transform: rotate(14deg) translateX(-60%);
        animation: xgLoadSweep 1.1s ease-in-out infinite;
        opacity:.6;
      }
      @keyframes xgLoadSweep{
        0%{ transform: rotate(14deg) translateX(-70%); }
        100%{ transform: rotate(14deg) translateX(70%); }
      }
    `;
    document.head.appendChild(style);
  })();

  // ====== 注入弹窗结构 ======
  const modal = (function ensureModal() {
    let el = document.getElementById("xg-modal");
    if (el) return el;

    el = document.createElement("div");
    el.id = "xg-modal";
    el.className = "xg-modal";
    el.innerHTML = `
      <div class="xg-card" role="dialog" aria-modal="true" aria-label="开奖结果">
        <div class="xg-confetti" id="xg-confetti"></div>
        <div class="xg-head">
          <div class="xg-tag" id="xg-tag">DRAW RESULT</div>
          <div class="xg-close" id="xg-close" aria-label="关闭">✕</div>
        </div>
        <div class="xg-body">
          <div class="xg-title" id="xg-title">开奖结果</div>
          <div class="xg-sub" id="xg-sub">请将结果截图发送客服核实，无截图不兑付奖项。</div>

          <div class="xg-code">
            <div class="xg-chip" id="xg-codechip">资格码：-</div>
            <div class="xg-chip" id="xg-statuschip">状态：-</div>
          </div>

          <div class="xg-result">
            <div class="xg-result-k">RESULT</div>
            <div class="xg-result-v" id="xg-result">-</div>
          </div>

          <div class="xg-actions">
            <button class="xg-btn xg-btn-primary" id="xg-primary" type="button">继续抽奖</button>
            <button class="xg-btn xg-btn-ghost" id="xg-ghost" type="button">关闭</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(el);

    // 事件
    el.addEventListener("click", (e) => {
      if (e.target === el) hideModal();
    });
    el.querySelector("#xg-close").addEventListener("click", hideModal);
    el.querySelector("#xg-ghost").addEventListener("click", hideModal);
    el.querySelector("#xg-primary").addEventListener("click", () => {
      hideModal();
      // 聚焦输入框，方便继续
      try { input?.focus(); input?.select?.(); } catch (_) {}
    });

    // ESC 关闭
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && el.classList.contains("show")) hideModal();
    });

    return el;
  })();

  function showModal({ ok, code, text }) {
    // 强开奖：闪一下 + 轻震
    document.body.classList.add("xg-burst");
    setTimeout(() => document.body.classList.remove("xg-burst"), 900);
    try { navigator.vibrate?.(ok ? [30, 40, 30] : [25, 25, 25]); } catch (_) {}

    // 主题
    const card = modal.querySelector(".xg-card");
    card.classList.remove("xg-win", "xg-lose");
    card.classList.add(ok ? "xg-win" : "xg-lose");

    // 文案
    modal.querySelector("#xg-tag").textContent = ok ? "CONGRATS" : "NOTICE";
    modal.querySelector("#xg-title").textContent = ok ? "恭喜中奖" : "抽奖结果";
    modal.querySelector("#xg-sub").textContent = ok
      ? "请将结果截图发送客服核实。"
      : "该资格码可能无效或已使用，请联系官方客服核实。";
    modal.querySelector("#xg-codechip").textContent = `资格码：${code || "-"}`;
    modal.querySelector("#xg-statuschip").textContent = `状态：${ok ? "成功" : "失败"}`;
    modal.querySelector("#xg-result").textContent = text || "-";

    // 金尘爆闪（成功更强）
    burstConfetti(ok ? 44 : 22);

    modal.classList.add("show");
  }

  function hideModal() {
    modal.classList.remove("show");
  }

  function burstConfetti(n = 36) {
    const box = modal.querySelector("#xg-confetti");
    if (!box) return;
    box.innerHTML = "";
    const W = box.clientWidth || 560;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      const left = Math.random() * 100;
      const delay = Math.random() * 0.18;
      const dur = 0.95 + Math.random() * 0.55;
      const size = 6 + Math.random() * 8;
      s.style.left = left + "%";
      s.style.top = (-10 - Math.random() * 40) + "px";
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.animationDelay = delay + "s";
      s.style.animationDuration = dur + "s";
      // 让散落方向更自然
      const drift = (Math.random() * 120 - 60);
      s.style.transform = `translateY(-20px) rotate(0deg) translateX(${drift}px)`;
      box.appendChild(s);
    }
    setTimeout(() => { box.innerHTML = ""; }, 1800);
  }

  // ====== 原功能：状态/结果显示（保留兼容） ======
  function setStatus(t) {
    if (statusText) statusText.textContent = t;
  }

  function showInlineResult(text, meta) {
    if (resultBox) resultBox.textContent = text;
    if (resultMeta) resultMeta.textContent = meta || "";
    if (resultWrap) resultWrap.classList.remove("hidden");
    // 给你现在的 CSS 如果有 result.reveal，会弹一下；没有也不影响
    try {
      const resultEl = resultWrap?.querySelector?.(".result");
      if (resultEl) {
        resultEl.classList.remove("reveal");
        // 触发重排让动画重复
        void resultEl.offsetWidth;
        resultEl.classList.add("reveal");
      }
    } catch (_) {}
  }

  function setLoading(isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "抽奖中..." : "立即抽奖";
    btn.classList.toggle("xg-loading", isLoading);
  }

  // 预填 code（保持原逻辑）
  (function prefillFromQuery() {
    try {
      const params = new URLSearchParams(location.search);
      const code = (params.get("code") || "").trim();
      if (code && input) input.value = code;
      if (code) setStatus("已填入资格码");
    } catch (_) {}
  })();

  // ====== 抽奖主流程（接口不变） ======
  async function drawPrize() {
    const code = (input?.value || "").trim();
    if (!code) {
      setStatus("等待输入");
      alert("请输入资格码");
      return;
    }

    setLoading(true);
    setStatus("请求中...");

    try {
      const resp = await fetch(`/api/redeem?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await resp.json().catch(() => ({}));

      if (data && data.ok) {
        const prize = data.prize || "恭喜获得";
        setStatus("成功");
        // 内联结果（兼容你原页面）
        showInlineResult(prize, `资格码：${code}`);
        // 弹窗结果（强烈开奖）
        showModal({ ok: true, code, text: prize });
      } else {
        const msg = (data && (data.msg || data.message)) || "资格码无效或已使用";
        setStatus("失败");
        showInlineResult(msg, `资格码：${code}`);
        showModal({ ok: false, code, text: msg });
      }
    } catch (e) {
      setStatus("网络异常");
      const msg = "网络异常，请稍后重试";
      showInlineResult(msg, `资格码：${code}`);
      showModal({ ok: false, code, text: msg });
    } finally {
      setLoading(false);
    }
  }

  if (btn) btn.addEventListener("click", drawPrize);

  if (input) {
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") drawPrize();
    });
  }
})();