// js/app.js (UTF-8, no BOM)
(function () {
  const $ = (id) => document.getElementById(id);

  const input = $("codeInput");
  const btn = $("drawBtn");
  const statusText = $("statusText");
  const resultWrap = $("resultWrap");
  const resultBox = $("resultBox");
  const resultMeta = $("resultMeta");

  // 弹窗元素
  const modal = $("modal");
  const modalBadge = $("modalBadge");
  const modalTitle = $("modalTitle");
  const modalSub = $("modalSub");
  const modalResultBox = $("modalResultBox");
  const modalClose = $("modalClose");
  const modalOk = $("modalOk");

  function setStatus(t) {
    if (statusText) statusText.textContent = t;
  }

  function showInlineResult(text, meta) {
    if (resultBox) resultBox.textContent = text;
    if (resultMeta) resultMeta.textContent = meta || "";
    if (resultWrap) resultWrap.classList.remove("hidden");
  }

  function setLoading(isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "抽奖中..." : "立即抽奖";
    document.documentElement.classList.toggle("is-drawing", !!isLoading);
  }

  function openModal() {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("modal-open");
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("modal-open");
  }

  function modalStateLoading(code) {
    if (!modal) return;
    modalBadge.textContent = "开奖中";
    modalTitle.textContent = "正在开奖…";
    modalSub.textContent = "请稍候 1-2 秒";
    modalResultBox.innerHTML = `<div class="modal-hint">资格码：<b>${escapeHtml(code)}</b></div>`;
    openModal();
    modal.classList.remove("is-ok", "is-bad");
    modal.classList.add("is-loading");
  }

  function modalStateOk(prize, code) {
    modalBadge.textContent = "恭喜";
    modalTitle.textContent = "开奖成功";
    modalSub.textContent = "请截图发给客服核实";
    modalResultBox.innerHTML = `
      <div class="modal-prize">${escapeHtml(prize || "恭喜获得")}</div>
      <div class="modal-hint">资格码：<b>${escapeHtml(code)}</b></div>
    `;
    modal.classList.remove("is-loading", "is-bad");
    modal.classList.add("is-ok");
    openModal();
  }

  function modalStateBad(msg, code) {
    modalBadge.textContent = "提示";
    modalTitle.textContent = "未能开奖";
    modalSub.textContent = "请确认资格码是否正确，或是否已使用";
    modalResultBox.innerHTML = `
      <div class="modal-prize bad">${escapeHtml(msg || "资格码无效或已使用")}</div>
      <div class="modal-hint">资格码：<b>${escapeHtml(code)}</b></div>
    `;
    modal.classList.remove("is-loading", "is-ok");
    modal.classList.add("is-bad");
    openModal();
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // 首页：从 URL 自动填入 code
  (function prefillFromQuery() {
    try {
      const params = new URLSearchParams(location.search);
      const code = (params.get("code") || "").trim();
      const from = (params.get("from") || "").trim();
      if (code && input) input.value = code;
      if (code) setStatus("已填入资格码");

      // 从复制页回来：滚到输入框区域（体验更像“花钱做的”）
      if (from === "draw" && input) {
        setTimeout(() => {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 250);
      }
    } catch (_) {}
  })();

  async function drawPrize() {
    const code = (input?.value || "").trim();
    if (!code) {
      setStatus("等待输入");
      alert("请输入资格码");
      return;
    }

    // 强烈开奖弹窗（开始）
    modalStateLoading(code);

    setLoading(true);
    setStatus("请求中...");

    try {
      const resp = await fetch(`/api/redeem?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await resp.json().catch(() => ({}));

      if (data && data.ok) {
        setStatus("成功");
        // 弹窗展示为主
        modalStateOk(data.prize || "恭喜获得", code);
        // 同时写回页面（兼容你原结构）
        showInlineResult(data.prize || "恭喜获得", `资格码：${code}`);
      } else {
        const msg = (data && (data.msg || data.message)) || "资格码无效或已使用";
        setStatus("失败");
        modalStateBad(msg, code);
        showInlineResult(msg, `资格码：${code}`);
      }
    } catch (e) {
      setStatus("网络异常");
      modalStateBad("网络异常，请稍后重试", code);
      showInlineResult("网络异常，请稍后重试", `资格码：${code}`);
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

  // 弹窗关闭
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOk) modalOk.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("modal-backdrop")) closeModal();
    });
  }
})();