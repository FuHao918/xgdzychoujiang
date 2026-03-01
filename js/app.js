// js/app.js (UTF-8, no BOM)
(function () {
  const $ = (id) => document.getElementById(id);

  const input = $("codeInput");
  const btn = $("drawBtn");
  const statusText = $("statusText");
  const resultWrap = $("resultWrap");
  const resultBox = $("resultBox");
  const resultMeta = $("resultMeta");

  function setStatus(t) {
    if (statusText) statusText.textContent = t;
  }

  function showResult(text, meta) {
    if (resultBox) resultBox.textContent = text;
    if (resultMeta) resultMeta.textContent = meta || "";
    if (resultWrap) resultWrap.classList.remove("hidden");
  }

  function setLoading(isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "抽奖中..." : "立即抽奖";
  }

  (function prefillFromQuery() {
    try {
      const params = new URLSearchParams(location.search);
      const code = (params.get("code") || "").trim();
      if (code && input) input.value = code;
      if (code) setStatus("已填入资格码");
    } catch (_) {}
  })();

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
