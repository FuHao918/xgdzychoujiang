// api/import.js
const { redis } = require("./_redis");

function bad(res, msg, code = 400) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify({ ok: false, msg }));
}

module.exports = async (req, res) => {
  try {
    const admin = req.headers["authorization"] || "";
    const token = process.env.ADMIN_TOKEN;

    if (!token) return bad(res, "未配置 ADMIN_TOKEN", 500);
    if (admin !== `Bearer ${token}`) return bad(res, "未授权", 401);
    if (req.method !== "POST") return bad(res, "只允许 POST");

    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString("utf-8").trim();
    if (!body) return bad(res, "Body 为空");

    let arr;
    try {
      arr = JSON.parse(body);
    } catch {
      return bad(res, "Body 必须是 JSON 数组：[{code,prize},...]");
    }

    if (!Array.isArray(arr) || arr.length === 0) return bad(res, "JSON 数组为空");

    let ok = 0, skipped = 0;

    // 逐条写入：prize:<code> = prize，并清理 used:<code>
    for (const item of arr) {
      const code = String(item.code || "").trim();
      const prize = String(item.prize || "").trim();
      if (!code || !prize) { skipped++; continue; }

      await redis("SET", [`prize:${code}`, prize]);
      await redis("DEL", [`used:${code}`]);
      ok++;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ ok: true, imported: ok, skipped }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ ok: false, msg: "服务器错误", err: String(e.message || e) }));
  }
};
