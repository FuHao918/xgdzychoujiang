// api/redeem.js
const { redis } = require("./_redis");

module.exports = async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);
    const code = (u.searchParams.get("code") || "").trim();

    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (!code) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, msg: "请输入抽奖码" }));
    }

    const prizeKey = `prize:${code}`;
    const usedKey = `used:${code}`;

    // 1) 先查码是否存在
    const prize = await redis("GET", [prizeKey]);
    if (!prize) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: false, msg: "抽奖码无效" }));
    }

    // 2) 一次性核销：SET usedKey 1 NX EX 31536000
    //    返回 'OK' 代表本次核销成功；返回 null 代表已被用过
    const setnx = await redis("SET", [usedKey, "1", "NX", "EX", "31536000"]);
    if (!setnx) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: false, msg: "该抽奖码已使用" }));
    }

    // 3) 成功：返回奖品
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, prize }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ ok: false, msg: "服务器错误", err: String(e.message || e) }));
  }
};
