// js/app.js (UTF-8, no BOM)
(function () {
  const $ = (id) => document.getElementById(id);

  const input = $("codeInput");
  const btn = $("drawBtn");
  const statusText = $("statusText");
  const resultWrap = $("resultWrap");
  const resultBox = $("resultBox");
  const resultMeta = $("resultMeta");

  function setStatus(t) { if (statusText) statusText.textContent = t; }
  function setLoading(isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "抽奖中..." : "立即抽奖";
  }

  function showResult(text, meta) {
    if (resultBox) resultBox.textContent = text;
    if (resultMeta) resultMeta.textContent = meta || "";
    if (resultWrap) {
      resultWrap.classList.remove("hidden");
      // 触发卡片出现动画（CSS）
      const card = resultWrap.querySelector(".result");
      if (card) {
        card.classList.remove("reveal");
        // 强制重绘
        void card.offsetWidth;
        card.classList.add("reveal");
      }
    }
  }

  // ========== 背景粒子 Canvas（高级“花钱感”关键） ==========
  function initFX() {
    const c = document.createElement("canvas");
    c.className = "fx-canvas";
    document.body.appendChild(c);
    const ctx = c.getContext("2d", { alpha: true });

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;

    const isMobile = matchMedia("(max-width: 640px)").matches;
    const COUNT = isMobile ? 46 : 78;

    let particles = [];
    let t = 0;
    let intensity = 0.22;        // 常态
    let target = 0.22;
    let ring = null;             // {x,y,r,a}

    function resize() {
      W = Math.max(1, innerWidth);
      H = Math.max(1, innerHeight);
      c.width = Math.floor(W * DPR);
      c.height = Math.floor(H * DPR);
      c.style.width = W + "px";
      c.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function seed() {
      particles = Array.from({ length: COUNT }, () => ({
        x: rnd(0, W),
        y: rnd(0, H),
        r: rnd(0.9, 2.4),
        s: rnd(0.08, 0.22),
        a: rnd(0.10, 0.24),
        phase: rnd(0, Math.PI * 2),
        gold: Math.random() < 0.78
      }));
    }

    function draw() {
      t += 0.016;
      intensity += (target - intensity) * 0.06;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const cx = W * 0.5;
      const cy = H * 0.42;

      // 粒子：常态轻漂，开奖时更亮更聚拢
      for (const p of particles) {
        const driftX = Math.sin(t * 0.6 + p.phase) * 0.25;
        const driftY = Math.cos(t * 0.5 + p.phase) * 0.12;

        const speedMul = 1 + intensity * 2.3;
        p.y -= p.s * speedMul;
        p.x += driftX * speedMul;
        p.y += driftY;

        const pull = intensity * 0.003;
        p.x += (cx - p.x) * pull;
        p.y += (cy - p.y) * pull;

        const tw = 0.55 + 0.45 * Math.sin(t * 1.35 + p.phase);
        const base = p.gold ? 0.10 : 0.06;
        p.a = base + tw * (0.10 + intensity * 0.18);

        if (p.y < -12) { p.y = H + 12; p.x = rnd(0, W); }
        if (p.x < -30) p.x = W + 30;
        if (p.x > W + 30) p.x = -30;

        ctx.fillStyle = p.gold
          ? `rgba(201,162,75,${p.a})`
          : `rgba(18,23,36,${p.a * 0.55})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 能量环
      if (ring) {
        ring.r += 10 + intensity * 18;
        ring.a -= 0.035;
        if (ring.a <= 0) ring = null;
        else {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = `rgba(201,162,75,${0.38 * ring.a})`;
          ctx.lineWidth = 2 + 6 * (1 - ring.a);
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(233,214,164,${0.22 * ring.a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.r * 0.88, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 聚光椭圆（开奖时更明显）
      ctx.globalAlpha = 0.10 + intensity * 0.22;
      ctx.fillStyle = "rgba(201,162,75,1)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, W * 0.34, H * 0.11, Math.sin(t * 0.2) * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      requestAnimationFrame(draw);
    }

    function burst(level) {
      // level: 1 点击；2 成功；0.7 失败
      target = Math.min(1.0, 0.55 + level * 0.25);
      ring = { x: W * 0.5, y: H * 0.42, r: 10, a: 1 };
      setTimeout(() => { target = 0.22; }, 1600);
    }

    resize();
    seed();
    addEventListener("resize", () => { resize(); seed(); });
    draw();

    return { burst };
  }

  const fx = initFX();

  // 预填 code
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
    if (!code) { setStatus("等待输入"); alert("请输入资格码"); return; }

    setLoading(true);
    setStatus("请求中...");
    fx?.burst?.(1); // 点击开奖动效

    try {
      const resp = await fetch(`/api/redeem?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await resp.json().catch(() => ({}));

      if (data && data.ok) {
        setStatus("成功");
        showResult(data.prize || "恭喜获得", `资格码：${code}`);
        fx?.burst?.(2); // 成功更强
      } else {
        const msg = (data && (data.msg || data.message)) || "资格码无效或已使用";
        setStatus("失败");
        showResult(msg, `资格码：${code}`);
        fx?.burst?.(0.7); // 失败也要有反馈
      }
    } catch (e) {
      setStatus("网络异常");
      showResult("网络异常，请稍后重试", `资格码：${code}`);
      fx?.burst?.(0.7);
    } finally {
      setLoading(false);
    }
  }

  if (btn) btn.addEventListener("click", drawPrize);
  if (input) input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") drawPrize(); });
})();