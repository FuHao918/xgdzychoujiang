// api/_redis.js
async function redis(cmd, args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
  }

  const r = await fetch(`${url}/${cmd}/${(args || []).map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Redis REST error: ${r.status} ${JSON.stringify(data)}`);

  // Upstash REST returns: { result: ... }
  return data.result;
}

module.exports = { redis };
