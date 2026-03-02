// js/app.js (UTF-8, no BOM)
(function () {
  const $ = (id) => document.getElementById(id);

  const input = $("codeInput");
  const btn = $("drawBtn");
  const statusText = $("statusText");
  const resultWrap = $("resultWrap");
  const resultBox = $("resultBox");
  const resultMeta = $("resultMeta");

  // 动效层
  const burst = $("burst");

  // 进入弹窗
  const codeModal = $("codeModal");
  const modalCodeText = $("modalCodeText");
  const modalCopy = $("modalCopy");
  const modalGo = $("modalGo");
  const modalClose = $("modalClose");
  const modalBackdrop = $("modalBackdrop");

  function setStatus(t) {
    if (statusText) statusText.textContent = t;
  }

  function showResult(text, meta) {
    if (resultBox) resultBox.textContent = text;
    if (resultMeta) resultMeta.textContent = meta || "";
    if (resultWrap) {
      resultWrap.classList.remove("hidden");
      // 触发一次结果弹出动效（CSS 用）
      resultWrap.classList.remove("pop-on");
      // 强制重排
      void resultWrap.offsetWidth;
      resultWrap.classList.add("pop-on");
    }
  }

  function setLoading(isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    const t = btn.querySelector(".btn-text");
    if (t) t.textContent = isLoading ? "抽奖中..." : "立即抽奖";
    else btn.textContent = isLoading ? "抽奖中..." : "立即抽奖";
    if (isLoading) btn.classList.add("is-loading");
    else btn.classList.remove("is-loading");
  }

  function triggerBurst() {
    if (!burst) return;
    burst.classList.remove("on");
    void burst.offsetWidth;
    burst.classList.add("on");
    setTimeout(() => burst.classList.remove("on"), 900);
  }

  function openModal(code) {
    if (!codeModal) return;
    if (modalCodeText) modalCodeText.textContent = code;
    codeModal.classList.remove("hidden");
    codeModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeModal() {
    if (!codeModal) return;
    codeModal.classList.add("hidden");
    codeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  // 读取 query：自动填入（不改变原逻辑）
  let queryCode = "";
  (function prefillFromQuery() {
    try {
      const params = new URLSearchParams(location.search);
      queryCode = (params.get("code") || "").trim();
      if (queryCode && input) input.value = queryCode;
      if (queryCode) setStatus("已填入资格码");
    } catch (_) {}
  })();

  // ✅ 进入弹窗策略（成熟用户体验）：
  // - 带 code 进入：弹窗提示并给“复制/去抽奖”
  // - 不带 code：直接正常首页
  (function showCodeModalIfNeeded() {
    if (!queryCode) return;
    // 延迟一点点，让页面先稳定渲染
    setTimeout(() => openModal(queryCode), 120);
  })();

  // 弹窗事件
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);

  if (modalCopy) {
    modalCopy.addEventListener("click", async () => {
      if (!queryCode) return;
      const ok = await copyText(queryCode);
      modalCopy.textContent = ok ? "已复制 ✅" : "复制失败";
      setTimeout(() => (modalCopy.textContent = "点一下复制"), 1200);
    });
  }

  if (modalGo) {
    modalGo.addEventListener("click", () => {
      closeModal();
      // 滚动到输入框
      const el = $("draw");
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (input) input.focus();
    });
  }

  async function drawPrize() {
    const code = (input?.value || "").trim();
    if (!code) {
      setStatus("等待输入");
      alert("请输入资格码");
      return;
    }

    triggerBurst();
    setLoading(true);
    setStatus("请求中...");

    try {
      const resp = await fetch(`/api/redeem?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await resp.json().catch(() => ({}));

      if (data && data.ok) {
        setStatus("成功");
        showResult(data.prize || "恭喜获得", `资格码：${code}`);
      } else {
        const msg = (data && (data.msg || data.message)) || "资格码无效或已使用";
        setStatus("失败");
        showResult(msg, `资格码：${code}`);
      }
    } catch (e) {
      setStatus("网络异常");
      showResult("网络异常，请稍后重试", `资格码：${code}`);
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