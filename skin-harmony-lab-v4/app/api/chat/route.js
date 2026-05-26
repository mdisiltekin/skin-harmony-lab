export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const contents = [];
    if (body.system) {
      contents.push({ role: "user", parts: [{ text: "SİSTEM TALİMATI:\n" + body.system }] });
      contents.push({ role: "model", parts: [{ text: "Anlaşıldı." }] });
    }
    for (const msg of (body.messages || [])) {
      contents.push({ role: msg.role === "user" ? "user" : "model", parts: [{ text: msg.content }] });
    }
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 4096, temperature: 0.7 } }) }
    );
    const data = await response.json();
    if (data.error) return Response.json({ error: { message: data.error.message } }, { status: 500 });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return Response.json({ content: [{ type: "text", text }] });
  } catch (error) {
    return Response.json({ error: { message: "Sunucu hatası" } }, { status: 500 });
  }
}
