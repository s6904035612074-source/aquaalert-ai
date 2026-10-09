const PROMPT = `You are assessing a citizen's flood photo from Bangkok. Estimate the standing water depth in centimetres using visible references (curbs ~15cm, car tyres ~60cm tall, ankles ~10cm, knees ~45cm). If the photo shows no flooding, use 0. If it is not a street or flood scene at all, set water_cm to null.
Reply with only JSON: {"water_cm": number|null, "confidence": "low"|"medium"|"high", "observation": "one short sentence in Thai describing what you see"}`;

const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now); hits.set(ip, list);
  return list.length > 10;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "ai_not_configured" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  const image = req.body && req.body.image;
  if (typeof image !== "string" || image.length < 100 || image.length > 1_400_000 || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return res.status(400).json({ error: "bad_image" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 300,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: PROMPT },
        ] }],
      }),
    });
    const data = await r.json();
    if (!r.ok) { console.error("anthropic", r.status, data); return res.status(502).json({ error: "ai_failed" }); }
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return res.status(502).json({ error: "ai_failed" });
    const out = JSON.parse(m[0]);
    res.status(200).json({
      water_cm: typeof out.water_cm === "number" ? Math.max(0, Math.min(300, out.water_cm)) : null,
      confidence: ["low", "medium", "high"].includes(out.confidence) ? out.confidence : "low",
      observation: String(out.observation || "").slice(0, 200),
    });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "ai_failed" });
  }
};
