export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Convert messages to Gemini format
    const contents = [];
    
    // Add system instruction as first user message context
    if (body.system) {
      contents.push({
        role: "user",
        parts: [{ text: "SİSTEM TALİMATI (her zaman uygula):\n" + body.system }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "Anlaşıldı, bu talimatlara göre yanıt vereceğim." }],
      });
    }
    
    // Add conversation messages
    for (const msg of (body.messages || [])) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      return Response.json(
        { error: { message: data.error.message || "Gemini API hatası" } },
        { status: 500 }
      );
    }

    // Convert Gemini response to our app's expected format
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return Response.json({
      content: [{ type: "text", text }],
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { error: { message: "Sunucu hatası oluştu" } },
      { status: 500 }
    );
  }
}
