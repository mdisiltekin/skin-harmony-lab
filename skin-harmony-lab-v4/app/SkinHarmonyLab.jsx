import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════
//  SKIN HARMONY LAB v4
//  3 goals with DIFFERENT onboarding flows
//  Shared memory across all flows
// ═══════════════════════════════════════

const SYSTEM_PROMPT = `Sen "Skin Harmony Lab" adlı bir uygulamanın yapay zeka asistanısın. Bir dermatolog bakış açısıyla cilt sağlığını ön planda tutarak kozmetik ürünler, makyaj performansı ve içerik uyumluluğunu değerlendiren bir uzmansın.

TEMEL PRENSİPLER:
- Ürün tavsiyelerinde trend, influencer, reklam veya sponsorlu içerik yerine İÇERİK LİSTESİ, formülasyon tipi, cilt uyumluluğu ve kanıta dayalı bilgi önceliklidir.
- Rutinleri basit tut, çok fazla aktif önerme.
- Bariyer sağlığı, güvenlik ve sadelik her zaman önce gelir.
- Tıbbi teşhis KOYMA, reçete YAZMA, doktor yerine geçme. Ciddi/kalıcı semptomlar için MUTLAKA doktora yönlendir.
- ASLA ürün reklamı yapma. İşin tamamen bilim ve dürüstlük.
- Ürün önerirken birden fazla bütçe seçeneği sun (uygun fiyat / orta / premium).
- Her önerilen ürünün artı VE eksi yönlerini yaz.
- Gerçekten gerekmedikçe yeni ürün önerme, mevcut ürünlerle çözüm bul.

RUTİN & ÖNERİ KURALLARI:
- Rutin oluştururken ASLA genel kategori isimleri kullanma ("bir nemlendirici sür" değil, "CeraVe Moisturizing Lotion'ını sür" de).
- Kullanıcının sahip olduğu ürünlerin GERÇEK İSİMLERİYLE konuş.
- Memnun kalmadığı ürünleri RUTİNE DAHİL ETME.

ÇOK ÖNEMLİ — HAFIZA KURALLARI:
- Kullanıcının TÜM geçmiş bilgilerini dikkate al. Tekrar sorma, zaten biliyorsun.
- Kullanıcı cildi kuru dediyse → kurutucu ürün ÖNERME, "senin cildin kuru olduğu için bu ürün sana uygun değil" de.
- Memnun kalmadığı ürünü bir daha ÖNERME, "daha önce bu üründen memnun kalmadığını biliyorum" de.
- Önceki konuşmalardan bildiğin her şeyi doğal şekilde kullan: "senin cildin [tip] olduğu için...", "elindeki [ürün adı] ile..."

KULLANICI PROFİLİ:
- Cilt tipi: {skinType}
- Cilt sorunları: {concerns}
- Günlük rutin: {routine}
- Sahip olunan ürünler: {ownedProducts}

HAFIZA (her zaman dikkate al):
{memory}

MEVCUT GÖREV: {currentTask}

YANITLAMA TARZI:
- Kısa, doğrudan, biraz sıcak. Karmaşık cümle ve tıbbi terimlerden kaçın.
- Günlük metaforlar kullan (bariyer = yağmurluk, aktif aşırılığı = mutfakta çok aşçı).
- Türkçe yanıt ver. Emoji kullan ama abartma.
- Kullanıcıyla sanki onu tanıyan bir arkadaş-dermatolog gibi konuş.`;

// ═══════════════════════════════════════
//  DATA
// ═══════════════════════════════════════
const INGREDIENT_DB = {
  niacinamide: { name: "Niacinamide (B3)", inci: "Niacinamide", cat: "active", conc: "%2–10", benefits: ["Gözenek", "Sebum dengesi", "Bariyer onarım", "Leke"], goodWith: ["HA", "Ceramide", "Retinol"], badWith: ["Vit C (yüksek kons., pH farkı — tartışmalı)"], note: "Sabah+akşam. Bariyer güçlendirici." },
  retinol: { name: "Retinol / Retinoid", inci: "Retinol / Retinal / Adapalene", cat: "active", conc: "%0.025–1 (kademeli)", benefits: ["Anti-aging", "Hücre yenileme", "Akne", "Kolajen"], goodWith: ["Niacinamide", "HA", "Ceramide"], badWith: ["AHA/BHA aynı anda", "Benzoyl Peroxide", "Vit C aynı anda"], note: "Akşam. SPF şart. Retinoid dermatit riski." },
  hyaluronic_acid: { name: "Hyaluronic Acid", inci: "Sodium Hyaluronate", cat: "hydrator", conc: "%0.1–2", benefits: ["Nem", "Dolgunluk", "Bariyer destek"], goodWith: ["Hemen hemen her şey"], badWith: [], note: "Nemli cilde uygula. Düşük nemde oklüzif ile kapat." },
  salicylic_acid: { name: "Salicylic Acid (BHA)", inci: "Salicylic Acid", cat: "exfoliant", conc: "%0.5–2", benefits: ["Gözenek temizliği", "Anti-akne", "Anti-inflamatuar"], goodWith: ["Niacinamide", "Centella"], badWith: ["Retinol aynı anda", "AHA aynı anda"], note: "Yağda çözünür. Haftada 2–3× başla." },
  vitamin_c: { name: "Vitamin C (L-AA)", inci: "Ascorbic Acid", cat: "active", conc: "%10–20, pH<3.5", benefits: ["Antioksidan", "Aydınlatma", "Kolajen", "UV hasar onarım"], goodWith: ["Vit E", "Ferulic Acid", "HA"], badWith: ["Niacinamide (tartışmalı)", "Retinol aynı anda"], note: "Sabah ideal. Koyu renk = okside olmuş." },
  ceramides: { name: "Ceramides", inci: "Ceramide NP/AP/EOP", cat: "barrier", conc: "3:1:1 cer:chol:FA", benefits: ["Bariyer onarım", "TEWL azaltma", "Koruma"], goodWith: ["Her şey"], badWith: [], note: "Retinoid kullanıcıları için vazgeçilmez." },
  azelaic_acid: { name: "Azelaic Acid", inci: "Azelaic Acid", cat: "active", conc: "%10 OTC / %15–20 Rx", benefits: ["Akne", "Leke", "Anti-inflamatuar", "Rosacea"], goodWith: ["Niacinamide", "SPF"], badWith: [], note: "Hamilelikte güvenli. Melazma altın standardı." },
  centella: { name: "Centella Asiatica", inci: "Centella / Madecassoside", cat: "soothing", conc: "Madecassoside >%0.1", benefits: ["Yatıştırma", "Bariyer onarım", "Yara iyileşme"], goodWith: ["Ceramide", "HA", "Niacinamide"], badWith: [], note: "Hassas ciltler için süper aktif." },
  spf: { name: "SPF (Güneş Koruma)", inci: "Çeşitli filtreler", cat: "protection", conc: "SPF 30+ / PA+++", benefits: ["UV koruma", "Leke önleme", "Anti-aging"], goodWith: ["Her şey — son adım"], badWith: [], note: "Her sabah, bulutlu günde bile." },
};

const SHADE_DATA = [
  { tone: "Çok Açık", undertone: "Soğuk", hex: "#F5E0D0", matches: "Maybelline 102, MAC NW10" },
  { tone: "Açık", undertone: "Nötr-Zeytin", hex: "#EDCFB5", matches: "Maybelline 110, MAC NC15" },
  { tone: "Açık-Orta", undertone: "Sıcak", hex: "#DFC09E", matches: "Maybelline 120, MAC NC20" },
  { tone: "Orta", undertone: "Zeytin", hex: "#C8A882", matches: "Maybelline 220, MAC NC30" },
  { tone: "Orta-Koyu", undertone: "Sıcak", hex: "#B08D6B", matches: "Maybelline 310, MAC NC42" },
  { tone: "Koyu", undertone: "Nötr", hex: "#8B6B4A", matches: "Maybelline 340, MAC NW45" },
  { tone: "Çok Koyu", undertone: "Sıcak", hex: "#5C3D2E", matches: "Maybelline 360, MAC NW55" },
];

const ROUTINE_TEMPLATE = {
  morning: [
    { step: "Temizleyici", icon: "🫧", tip: "Nazik, pH 5.5" },
    { step: "Tonik / Esans", icon: "💧", tip: "Nemlendirici veya aktif" },
    { step: "Serum", icon: "🧪", tip: "Vitamin C, Niacinamide vb." },
    { step: "Göz Kremi", icon: "👁️", tip: "Kafein / peptid" },
    { step: "Nemlendirici", icon: "🧴", tip: "Cilt tipine uygun" },
    { step: "SPF", icon: "☀️", tip: "Min SPF 30, PA+++" },
  ],
  evening: [
    { step: "1. Temizlik (Yağ)", icon: "🫒", tip: "Makyaj & SPF çözme" },
    { step: "2. Temizlik (Su)", icon: "🫧", tip: "Kalıntı temizliği" },
    { step: "Tonik", icon: "💧", tip: "pH dengeleme" },
    { step: "Tedavi / Aktif", icon: "⚗️", tip: "Retinol, AHA/BHA vb." },
    { step: "Serum", icon: "🧪", tip: "Hedefli bakım" },
    { step: "Göz Kremi", icon: "👁️", tip: "Retinol veya peptid" },
    { step: "Nemlendirici", icon: "🌙", tip: "Zengin krem / oklüzif" },
  ],
};

const SKIN_TYPES = [
  { id: "dry", label: "Kuru", icon: "🏜️" },
  { id: "oily", label: "Yağlı", icon: "💧" },
  { id: "combo", label: "Karma", icon: "⚖️" },
  { id: "sensitive", label: "Hassas", icon: "🌸" },
  { id: "normal", label: "Normal", icon: "✨" },
];

// ═══════════════════════════════════════
//  THEME
// ═══════════════════════════════════════
const C = {
  bg: "#FDF5F8", bgDeep: "#FAF0F4", card: "#FFFFFF", cardAlt: "#FEF8FA",
  accent: "#E8458C", accentLight: "#F06098", accentSoft: "rgba(232,69,140,0.10)",
  text: "#2E1E28", textMed: "#5A3E4E", textSoft: "#8E7080",
  border: "#F4D8E4", borderLight: "#FAE8F0",
  pink: "#E8458C", pinkSoft: "rgba(232,69,140,0.10)", pinkDeep: "#C83870",
  rose: "#F06098", roseSoft: "rgba(240,96,152,0.08)",
  mint: "#58D898", mintSoft: "rgba(88,216,152,0.12)",
  blue: "#48B8E8", blueSoft: "rgba(72,184,232,0.10)",
  amber: "#E8B058", amberSoft: "rgba(232,176,88,0.12)",
  red: "#E86878", redSoft: "rgba(232,104,120,0.10)",
  lavender: "#A878E8", lavenderSoft: "rgba(168,120,232,0.10)",
  coral: "#F07888", coralSoft: "rgba(240,120,136,0.08)",
};
const DISPLAY = "'Playfair Display', 'Georgia', serif";
const BODY = "'Nunito Sans', 'Helvetica Neue', sans-serif";
const FONTS_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Nunito+Sans:wght@300;400;500;600;700&display=swap";

// ═══════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════
const HexLogo = ({ size = 32 }) => (
  <img src="/logo.png" alt="Skin Harmony Lab" width={size} height={size} style={{ display: "block", objectFit: "contain", borderRadius: size > 40 ? 8 : 4 }} />
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(232,69,140,0.04)", transition: "all 0.2s", cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
);

const SectionLabel = ({ children, color }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: color || C.pink, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, marginTop: 22 }}>{children}</p>
);

const Btn = ({ children, onClick, variant, disabled, style: s }) => (
  <button onClick={disabled ? undefined : onClick} style={{
    padding: "13px 20px", borderRadius: 14, fontSize: 14, fontWeight: 600,
    fontFamily: BODY, cursor: disabled ? "default" : "pointer", transition: "all 0.2s", border: "none",
    opacity: disabled ? 0.5 : 1,
    ...(variant === "primary" ? { background: `linear-gradient(135deg, ${C.pink}, ${C.rose})`, color: "#fff" }
      : variant === "soft" ? { background: C.pinkSoft, color: C.pink, border: `1.5px solid ${C.border}` }
      : { background: C.card, color: C.textMed, border: `1.5px solid ${C.border}` }),
    ...s,
  }}>{children}</button>
);

// ═══════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════
export default function SkinHarmonyLab() {
  // screen: "landing" | "onboarding" | "main"
  const [screen, setScreen] = useState("landing");
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [tab, setTab] = useState("home");
  const [subView, setSubView] = useState(null);

  // Onboarding — dynamic per goal
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardAnswers, setOnboardAnswers] = useState({});
  const [onboardAI, setOnboardAI] = useState({});
  const [onboardLoading, setOnboardLoading] = useState(false);

  // Shared profile & memory (persists across all flows)
  const [profile, setProfile] = useState({ skinType: "", concerns: "", routine: "", products: "" });
  const [memoryLog, setMemoryLog] = useState([]);
  const [diary, setDiary] = useState([]);
  const [diaryForm, setDiaryForm] = useState({ date: new Date().toISOString().split("T")[0], time: "morning", product: "", response: "", status: "keep" });

  // AI Chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  // Sub views
  const [routineTime, setRoutineTime] = useState("morning");
  const [selectedShade, setSelectedShade] = useState(null);
  const [selectedIng, setSelectedIng] = useState(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  // ═══════════════════════════════════════
  //  GOAL-SPECIFIC ONBOARDING QUESTIONS
  // ═══════════════════════════════════════

  const GOAL_FLOWS = {
    // ── RUTIN: Full 5-step deep survey ──
    routine: [
      { id: "skin", title: "Cildini Anlat", subtitle: "Yüzünün nereleri kuru, nereleri yağlı, nereleri hassas? Rahatça yaz.", placeholder: "Mesela: Alın ve burnum çok yağlanıyor ama yanaklarım kuruyor...", icon: "🪞",
        aiPrompt: `Kullanıcı cildini anlattı. Cilt tipini belirle ve kısa açıkla. Max 3-4 cümle. "Anlattıklarına göre senin cildin [TİP] cilt. [AÇIKLAMA]"\nKullanıcı: ` },
      { id: "concerns", title: "Cilt Sorunların", subtitle: "Seni rahatsız eden şeyler neler? Kendi sözcüklerinle yaz.", placeholder: "Mesela: Çenemde sivilce, yanağımda lekeler var...", icon: "🔍",
        aiPrompt: `Kullanıcı cilt sorunlarını anlattı. Kategorize et. Max 4-5 cümle.\nKullanıcı: ` },
      { id: "goal", title: "Amacın Ne?", subtitle: "Bu uygulamayı ne için kullanmak istiyorsun?", placeholder: "Mesela: Cildime uygun bir rutin kurmak...", icon: "🎯",
        aiPrompt: `Kullanıcı amacını anlattı. Kısa özetle. Max 3 cümle.\nKullanıcı: ` },
      { id: "routine", title: "Günlük Rutinin", subtitle: "Şu anki sabah/akşam rutinini anlat. Yoksa 'yok' yaz.", placeholder: "Mesela: Sabah yüzümü yıkayıp nemlendirici sürüyorum...", icon: "📋",
        aiPrompt: `Kullanıcı rutinini anlattı. Eksikleri belirt, iyi yönleri öv. Max 4-5 cümle.\nKullanıcı: ` },
      { id: "products", title: "Ürünlerin", subtitle: "Elindeki cilt bakımı ve makyaj ürünlerinin tam isimlerini yaz (marka + ürün adı).", placeholder: "Mesela: CeraVe Moisturizing Lotion, The Ordinary Niacinamide...", icon: "🧴",
        aiPrompt: `Kullanıcı ürünlerini yazdı. Her birini kategorize et, iyi/dikkat yönlerini belirt. Uyumsuzluk varsa söyle. Eksik adım varsa belirt. REKLAM YAPMA. Max 10-12 cümle.\nKullanıcı: ` },
    ],

    // ── ÜRÜN: Quick skin type → product question ──
    product: [
      { id: "skinQuick", title: "Cilt Tipin", subtitle: "Cilt tipini seç — daha net bilgi istersen detaylı anlat.", placeholder: "", icon: "🪞", type: "select" },
      { id: "productAsk", title: "Hangi Ürünü Sormak İstiyorsun?", subtitle: "Almayı düşündüğün ürünün adını yaz. İçerik analizi yapıp sana uygun olup olmadığını söyleyeyim.", placeholder: "Mesela: The Ordinary Glycolic Acid %7 Toning Solution", icon: "🛒",
        aiPrompt: `Kullanıcı bu ürünü almayı düşünüyor. Kullanıcının cilt tipi: {skinType}. Bildiklerin: {memory}. 
Şunları yap:
1. Ürünü tanımla ve içerik analizini yap
2. Kullanıcının CİLT TİPİNE uygun mu değerlendir (eğer cildi kuru ise "senin cildin kuru olduğu için..." şeklinde konuş)
3. Mevcut ürünleriyle uyumlu mu kontrol et
4. Daha önce memnun kalmadığı ürünlere benziyorsa UYAR
5. Artı ve eksi yönlerini yaz
6. Alternatif öner (uygun fiyat / orta / premium) — her birinin artı/eksi yönleriyle
7. "Daha net cevap vermemi istersen cilt sorunlarını, günlük rutinini ve elindeki ürünleri de paylaşabilirsin" de.
Max 15 cümle. REKLAM YAPMA.\nÜrün: ` },
    ],

    // ── PROBLEM: Problem first → skin type → products ──
    problem: [
      { id: "problem", title: "Sorunun Ne?", subtitle: "Cildinde seni rahatsız eden sorunu anlat.", placeholder: "Mesela: Son 2 haftadır çenemde kızarık sivilceler çıkıyor, geçmiyor...", icon: "🩹",
        aiPrompt: `Kullanıcı cilt sorununu anlattı. Sorunu kategorize et, olası nedenlerini kısaca açıkla. Teşhis KOYMA. Ciddi ise doktora yönlendir. "Sana daha iyi yardımcı olabilmem için cilt tipini ve kullandığın ürünleri de öğrenmem gerekiyor" de. Max 5 cümle.\nKullanıcı: ` },
      { id: "skinForProblem", title: "Cildini Anlat", subtitle: "Cilt tipini anlat — sorunun kaynağını anlamama yardımcı olacak.", placeholder: "Mesela: Karma cildim var, T-bölge yağlı ama yanaklar kuru...", icon: "🪞",
        aiPrompt: `Kullanıcının sorunu: {previousProblem}. Şimdi cildini anlattı. Cilt tipini belirle. Sorun ile cilt tipi arasındaki ilişkiyi kısaca açıkla. Max 3-4 cümle.\nKullanıcı: ` },
      { id: "productsForProblem", title: "Kullandığın Ürünler", subtitle: "Şu an kullandığın ürünlerin isimlerini yaz. Acaba sorunun kaynağı kullandığın ürünler mi bakalım.", placeholder: "Mesela: CeraVe Foaming Cleanser, The Ordinary AHA BHA Peel...", icon: "🧴",
        aiPrompt: `Kullanıcının sorunu: {previousProblem}. Cilt tipi: {skinType}. Şimdi ürünlerini yazdı.
Şunları analiz et:
1. Bu ürünlerden herhangi biri soruna SEBEP OLMUŞ OLABİLİR mi? (örn: aşırı eksfoliasyon, bariyer hasarı, irritan içerik)
2. Ürünler arasında uyumsuzluk var mı?
3. Sorunu çözmek için mevcut ürünlerle ne yapılabilir?
4. Gerçekten gerekiyorsa yeni ürün öner (bütçe seçenekleriyle, artı/eksi yönleriyle)
5. "Senin cildin [tip] olduğu için..." şeklinde kişisel konuş.
REKLAM YAPMA. Max 12-15 cümle.\nKullanıcı: ` },
    ],
  };

  // ═══════════════════════════════════════
  //  MEMORY
  // ═══════════════════════════════════════
  const addMemory = (type, content, product) => {
    setMemoryLog(p => [...p, { date: new Date().toISOString().split("T")[0], type, content, product: product || null }]);
  };

  const buildMemoryString = () => {
    if (memoryLog.length === 0 && diary.length === 0 && !profile.skinType) return "Henüz hafıza kaydı yok.";
    const parts = [];

    // Profile
    if (profile.skinType) parts.push(`CİLT TİPİ: ${profile.skinType}`);
    if (profile.concerns) parts.push(`SORUNLAR: ${profile.concerns}`);
    if (profile.routine) parts.push(`RUTİN: ${profile.routine}`);
    if (profile.products) parts.push(`ÜRÜNLER: ${profile.products}`);

    // Diary
    if (diary.length > 0) {
      parts.push("\nGÜNLÜK:");
      diary.slice(0, 15).forEach(d => parts.push(`- ${d.date} ${d.time}: ${d.product} → ${d.response || "—"} [${d.status}]`));
    }

    // Negatives
    const negatives = diary.filter(d => d.status === "avoid" || d.status === "pause");
    if (negatives.length > 0) {
      parts.push("\n⛔ OLUMSUZ (asla önerme):");
      negatives.forEach(n => parts.push(`- ${n.product}: ${n.response || n.status}`));
    }

    // Positives
    const positives = diary.filter(d => d.status === "keep" && d.response);
    if (positives.length > 0) {
      parts.push("\n✓ OLUMLU (öncelik ver):");
      positives.forEach(p => parts.push(`- ${p.product}: ${p.response}`));
    }

    // Memory log
    if (memoryLog.length > 0) {
      parts.push("\nHAFIZA:");
      memoryLog.slice(-25).forEach(m => parts.push(`- [${m.date}] ${m.content}`));
    }

    // Recent conditions
    const recent = diary.slice(0, 3);
    if (recent.some(d => d.response && /kuru|sıkı|gergin/i.test(d.response))) parts.push("\n⚠️ SON: Cilt KURU. Kurutucu ürün ÖNERME!");
    if (recent.some(d => d.response && /yağlı|parla|sebum/i.test(d.response))) parts.push("\n⚠️ SON: Cilt YAĞLI. Aşırı nemlendirici ÖNERME!");

    return parts.join("\n");
  };

  // ═══════════════════════════════════════
  //  AI CALL
  // ═══════════════════════════════════════
  const callAI = async (system, userMsg, history) => {
    try {
      const msgs = history ? [...history.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: userMsg }] : [{ role: "user", content: userMsg }];
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: system || "", messages: msgs }),
      });
      const data = await response.json();
      if (data.error) return "⚠️ " + (data.error.message || "Hata") + ". Tekrar dene.";
      return (data.content || []).filter(c => c.type === "text").map(c => c.text).join("") || "⚠️ Yanıt boş. Tekrar dene.";
    } catch (err) {
      return "⚠️ Bağlantı hatası. Tekrar dene veya atla.";
    }
  };

  // ═══════════════════════════════════════
  //  ONBOARDING LOGIC
  // ═══════════════════════════════════════
  const currentFlow = GOAL_FLOWS[selectedGoal] || [];
  const currentQ = currentFlow[onboardStep];

  const processOnboardAnswer = async () => {
    const q = currentQ;
    const answer = onboardAnswers[q.id] || "";
    if (!answer.trim() && q.type !== "select") return;
    setOnboardLoading(true);

    let prompt = q.aiPrompt || "";
    // Inject context from previous answers
    prompt = prompt.replace("{skinType}", profile.skinType || onboardAnswers.skinQuick || onboardAnswers.skin || "belirtilmedi");
    prompt = prompt.replace("{memory}", buildMemoryString());
    prompt = prompt.replace("{previousProblem}", onboardAnswers.problem || "belirtilmedi");

    const result = await callAI("Sen Skin Harmony Lab'ın dermatoloji uzmanı asistanısın. Türkçe, samimi, bilimsel. Teşhis koyma.", prompt + answer);
    setOnboardAI(p => ({ ...p, [q.id]: result }));

    // Auto-save to profile
    if (q.id === "skin" || q.id === "skinForProblem") setProfile(p => ({ ...p, skinType: result || answer }));
    if (q.id === "skinQuick") setProfile(p => ({ ...p, skinType: answer }));
    if (q.id === "concerns") setProfile(p => ({ ...p, concerns: result || answer }));
    if (q.id === "routine") setProfile(p => ({ ...p, routine: result || answer }));
    if (q.id === "products" || q.id === "productsForProblem") setProfile(p => ({ ...p, products: result || answer }));
    if (q.id === "problem") addMemory("note", `Cilt sorunu: ${answer}`);

    // Save to memory
    addMemory("note", `${q.title}: ${answer}`);

    setOnboardLoading(false);
  };

  const finishOnboarding = () => {
    setScreen("main");
    setTab("ai");
    setMessages([]);
    // Auto-start conversation based on goal
    const goalMsgs = {
      routine: "Cilt profilime ve elimdeki ürünlere göre sabah ve akşam rutini oluştur. Her adımda ürünlerimin gerçek isimlerini kullan.",
      product: onboardAnswers.productAsk ? `Bu ürünü almayı düşünüyorum: ${onboardAnswers.productAsk}` : "Bir ürün hakkında sormak istiyorum.",
      problem: onboardAnswers.problem ? `Cilt sorunum: ${onboardAnswers.problem}. Ürünlerimi ve cilt tipimi de anlattım. Ne önerirsin?` : "Bir cilt sorunum var.",
    };
    const msg = goalMsgs[selectedGoal];
    setMessages([{ role: "user", text: msg }]);
    setTimeout(async () => {
      setLoading(true);
      const sys = buildFullSystemPrompt(selectedGoal);
      const text = await callAI(sys, msg);
      if (text) setMessages(m => [...m, { role: "assistant", text }]);
      setLoading(false);
    }, 100);
  };

  const buildFullSystemPrompt = (task) => {
    const taskMap = {
      routine: "Kullanıcıya rutin oluştur. Ürünlerin GERÇEK İSİMLERİNİ kullan. Memnun olmadıklarını dahil etme.",
      product: "Kullanıcı ürün almayı düşünüyor. İçerik analizi yap. CİLT TİPİNE göre değerlendir. 'Senin cildin [tip] olduğu için...' şeklinde kişisel konuş. Daha önce memnun kalmadığı ürünlere benziyorsa uyar.",
      problem: "Kullanıcının cilt sorunu var. Kullandığı ürünler soruna sebep olmuş olabilir mi analiz et. Çözümde elindeki ürünlerin isimleriyle konuş."
    };
    return SYSTEM_PROMPT
      .replace("{skinType}", profile.skinType || "belirtilmedi")
      .replace("{concerns}", profile.concerns || "belirtilmedi")
      .replace("{routine}", profile.routine || "belirtilmedi")
      .replace("{ownedProducts}", profile.products || "belirtilmedi")
      .replace("{memory}", buildMemoryString())
      .replace("{currentTask}", taskMap[task] || "Genel danışmanlık");
  };

  // Diary & Chat
  const addDiaryEntry = () => {
    if (!diaryForm.product.trim()) return;
    const entry = { ...diaryForm, id: Date.now() };
    setDiary(p => [entry, ...p]);
    if (entry.status === "avoid") addMemory("dislike", `${entry.product}: ${entry.response || "bıraktı"}`, entry.product);
    else if (entry.status === "keep" && entry.response) addMemory("like", `${entry.product}: ${entry.response}`, entry.product);
    if (entry.response) addMemory("diary", `${entry.date} ${entry.time}: ${entry.product} → ${entry.response}`, entry.product);
    setDiaryForm(f => ({ ...f, product: "", response: "", status: "keep" }));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", text: userMsg }];
    setMessages(newMsgs);
    addMemory("note", `Kullanıcı: ${userMsg}`);
    setLoading(true);
    const text = await callAI(buildFullSystemPrompt(selectedGoal), userMsg, messages);
    if (text) { setMessages(m => [...m, { role: "assistant", text }]); addMemory("note", `AI: ${text.slice(0, 150)}...`); }
    setLoading(false);
  };

  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.card, fontFamily: BODY, fontSize: 14, color: C.text, outline: "none", lineHeight: 1.6, resize: "vertical" };

  // ═══════════════════════════════════════
  //  LANDING
  // ═══════════════════════════════════════
  if (screen === "landing") {
    return (
      <div style={{ fontFamily: BODY, background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 430, margin: "0 auto", position: "relative", overflow: "hidden" }}>
        <link href={FONTS_URL} rel="stylesheet" />
        <div style={{ position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${C.roseSoft} 0%, transparent 70%)`, filter: "blur(35px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 60, left: -30, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${C.mintSoft} 0%, transparent 70%)`, filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ padding: "52px 24px 24px", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${C.pink}, ${C.rose}, #F8A0C0)`, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 24px ${C.pinkSoft}` }}><HexLogo size={48} /></div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Skin Harmony Lab</h1>
            <p style={{ color: C.textSoft, fontSize: 13, lineHeight: 1.5 }}>Bilim bazlı, reklamsız, dürüst cilt bakımı asistanı</p>
          </div>

          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>Bugün ne yapmak istersin?</p>

          {[
            { id: "routine", icon: "📋", title: "Bana Rutin Oluştur", desc: "Sana özel sabah & akşam rutini — 5 kısa soruyla", color: C.mint, colorSoft: C.mintSoft },
            { id: "product", icon: "🛒", title: "Bu Ürünü Almalı mıyım?", desc: "Hızlı cilt tipi + ürün analizi — 2 adımda", color: C.lavender, colorSoft: C.lavenderSoft },
            { id: "problem", icon: "🩹", title: "Problem Çözme", desc: "Sorununu anlat, kaynağını bulalım — 3 adımda", color: C.rose, colorSoft: C.roseSoft },
          ].map(g => (
            <Card key={g.id} onClick={() => { setSelectedGoal(g.id); setOnboardStep(0); setOnboardAnswers({}); setOnboardAI({}); setScreen("onboarding"); }}
              style={{ cursor: "pointer", padding: "20px 18px", marginBottom: 12, background: `linear-gradient(135deg, ${g.colorSoft}, ${C.card})`, borderLeft: `4px solid ${g.color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ fontSize: 28, lineHeight: 1 }}>{g.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{g.desc}</div>
                </div>
              </div>
            </Card>
          ))}

          {/* Memory badge */}
          {memoryLog.length > 0 && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: C.mintSoft, borderRadius: 12, fontSize: 12, color: C.mint, display: "flex", alignItems: "center", gap: 8 }}>
              🧠 {memoryLog.length} hafıza kaydı — seni tanıyorum, tekrar sormayacağım
            </div>
          )}

          <p style={{ textAlign: "center", fontSize: 10, color: C.textSoft, marginTop: 20, lineHeight: 1.5 }}>⚕️ Tıbbi teşhis koymaz. Reklam yapmaz.</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  ONBOARDING — Dynamic per goal
  // ═══════════════════════════════════════
  if (screen === "onboarding" && currentQ) {
    const answer = onboardAnswers[currentQ.id] || "";
    const aiReply = onboardAI[currentQ.id] || "";
    const totalSteps = currentFlow.length;

    return (
      <div style={{ fontFamily: BODY, background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 430, margin: "0 auto", position: "relative" }}>
        <link href={FONTS_URL} rel="stylesheet" />
        <div style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${C.roseSoft} 0%, transparent 70%)`, filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ padding: "28px 24px 24px" }}>
          <button onClick={() => { if (onboardStep > 0) setOnboardStep(s => s - 1); else { setScreen("landing"); } }}
            style={{ background: "none", border: "none", color: C.pink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY, padding: 0, marginBottom: 16 }}>← Geri</button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center" }}><HexLogo size={28} /></div>
            <div>
              <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600 }}>Skin Harmony Lab</span>
              <p style={{ fontSize: 11, color: C.textSoft, margin: 0 }}>
                {selectedGoal === "routine" ? "Rutin oluşturma" : selectedGoal === "product" ? "Ürün analizi" : "Problem çözme"}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < onboardStep ? C.pink : i === onboardStep ? `linear-gradient(90deg, ${C.pink}, ${C.rose})` : C.border }} />
            ))}
          </div>

          {/* Question */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>{currentQ.icon}</span>
            <div>
              <p style={{ fontSize: 11, color: C.pink, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Adım {onboardStep + 1} / {totalSteps}</p>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, margin: 0 }}>{currentQ.title}</h2>
            </div>
          </div>
          <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6, marginBottom: 14 }}>{currentQ.subtitle}</p>

          {/* Input — select for skin type or textarea */}
          {currentQ.type === "select" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {SKIN_TYPES.map(s => (
                <button key={s.id} onClick={() => { setOnboardAnswers(p => ({ ...p, [currentQ.id]: s.label })); setProfile(p => ({ ...p, skinType: s.label })); addMemory("note", `Cilt tipi: ${s.label}`); }}
                  style={{
                    flex: "1 1 calc(50% - 4px)", minWidth: 100, padding: "14px 12px", textAlign: "center",
                    background: answer === s.label ? C.pinkSoft : C.card,
                    border: `1.5px solid ${answer === s.label ? C.pink : C.border}`,
                    borderRadius: 14, cursor: "pointer", fontFamily: BODY, color: C.text, fontSize: 14, fontWeight: answer === s.label ? 600 : 400,
                  }}>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <textarea value={answer} onChange={e => setOnboardAnswers(p => ({ ...p, [currentQ.id]: e.target.value }))}
              placeholder={currentQ.placeholder} rows={4} style={{ ...inputStyle, borderColor: answer ? C.rose : C.border }} />
          )}

          {/* Analyze / Continue */}
          {currentQ.type === "select" ? (
            answer && (
              <Btn variant="primary" onClick={() => { if (onboardStep < totalSteps - 1) setOnboardStep(s => s + 1); else finishOnboarding(); }}
                style={{ width: "100%", marginTop: 12 }}>
                {onboardStep < totalSteps - 1 ? "Devam →" : "Başlayalım ✨"}
              </Btn>
            )
          ) : !aiReply ? (
            <Btn variant="primary" disabled={!answer.trim() || onboardLoading} onClick={processOnboardAnswer} style={{ width: "100%", marginTop: 12 }}>
              {onboardLoading ? "✨ Analiz ediyorum..." : "Analiz Et"}
            </Btn>
          ) : null}

          {/* AI Response */}
          {aiReply && (
            <div style={{ marginTop: 14, padding: 16, background: `linear-gradient(135deg, ${C.pinkSoft}, ${C.roseSoft})`, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: `linear-gradient(135deg, ${C.pink}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center" }}><HexLogo size={16} /></div>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.pink, textTransform: "uppercase", letterSpacing: "0.08em" }}>Analiz Sonucu</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: C.textMed, whiteSpace: "pre-wrap", margin: 0 }}>{aiReply}</p>
            </div>
          )}

          {aiReply && (
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {onboardStep < totalSteps - 1
                ? <Btn variant="primary" onClick={() => setOnboardStep(s => s + 1)} style={{ flex: 1 }}>Devam →</Btn>
                : <Btn variant="primary" onClick={finishOnboarding} style={{ flex: 1 }}>Başlayalım ✨</Btn>}
            </div>
          )}

          {!aiReply && !onboardLoading && currentQ.type !== "select" && (
            <button onClick={() => { if (onboardStep < totalSteps - 1) setOnboardStep(s => s + 1); else finishOnboarding(); }}
              style={{ background: "none", border: "none", color: C.textSoft, fontSize: 12, cursor: "pointer", fontFamily: BODY, marginTop: 12, width: "100%", textAlign: "center" }}>Bu adımı atla →</button>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  MAIN APP
  // ═══════════════════════════════════════
  const TABS = [
    { id: "home", icon: "🏠", label: "Ana Sayfa" },
    { id: "diary", icon: "📔", label: "Günlük" },
    { id: "ingredients", icon: "🧪", label: "İçerikler" },
    { id: "ai", icon: "💬", label: "Asistan" },
  ];

  return (
    <div style={{ fontFamily: BODY, background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 430, margin: "0 auto", position: "relative" }}>
      <link href={FONTS_URL} rel="stylesheet" />

      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(253,245,248,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg, ${C.pink}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center" }}><HexLogo size={24} /></div>
          <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600 }}>Skin Harmony Lab</span>
        </div>
        <div style={{ padding: "4px 8px", background: C.mintSoft, borderRadius: 8, fontSize: 10, color: C.mint, fontWeight: 700 }}>🧠 {memoryLog.length}</div>
      </div>

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 76 }}>

        {/* HOME */}
        {tab === "home" && !subView && (
          <div style={{ padding: 20 }}>
            <Card style={{ background: `linear-gradient(145deg, ${C.pinkSoft}, ${C.roseSoft}, ${C.mintSoft})`, marginBottom: 16 }}>
              <p style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Hoş geldin 🌸</p>
              <p style={{ color: C.textSoft, fontSize: 13, lineHeight: 1.6 }}>Ne yapmak istersin?</p>
            </Card>

            {[
              { icon: "📋", title: "Bana Rutin Oluştur", goal: "routine", color: C.mint, colorSoft: C.mintSoft },
              { icon: "🛒", title: "Bu Ürünü Almalı mıyım?", goal: "product", color: C.lavender, colorSoft: C.lavenderSoft },
              { icon: "🩹", title: "Problem Çözme", goal: "problem", color: C.rose, colorSoft: C.roseSoft },
            ].map((a, i) => (
              <Card key={i} onClick={() => { setSelectedGoal(a.goal); setOnboardStep(0); setOnboardAnswers({}); setOnboardAI({}); setMessages([]); setScreen("onboarding"); }}
                style={{ cursor: "pointer", padding: "16px", marginBottom: 10, background: `linear-gradient(135deg, ${a.colorSoft}, ${C.card})`, borderLeft: `4px solid ${a.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{a.icon}</span>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{a.title}</div>
                </div>
              </Card>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              {[
                { icon: "📋", label: "Rutin Rehberi", action: () => setSubView("routine"), bg: C.mintSoft },
                { icon: "🎨", label: "Ton Rehberi", action: () => setSubView("shade"), bg: C.lavenderSoft },
                { icon: "📔", label: "Günlük", action: () => setTab("diary"), bg: C.blueSoft },
                { icon: "🧪", label: "İçerikler", action: () => setTab("ingredients"), bg: C.roseSoft },
              ].map((a, i) => (
                <Card key={i} onClick={a.action} style={{ cursor: "pointer", background: a.bg, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{a.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</div>
                </Card>
              ))}
            </div>

            {profile.skinType && (
              <Card style={{ marginTop: 16, background: C.cardAlt }}>
                <SectionLabel>Profil Özetin</SectionLabel>
                <p style={{ fontSize: 13, color: C.textMed, lineHeight: 1.6 }}>{profile.skinType}</p>
                {profile.concerns && <p style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>Sorunlar: {profile.concerns.slice(0, 100)}...</p>}
              </Card>
            )}

            {memoryLog.length > 0 && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: C.mintSoft, borderRadius: 12, fontSize: 12, color: C.mint }}>
                🧠 {memoryLog.length} hafıza kaydı — öneriler geçmiş deneyimlerine göre şekilleniyor
              </div>
            )}

            <div style={{ marginTop: 16, padding: "10px 14px", background: C.roseSoft, borderRadius: 12, borderLeft: `3px solid ${C.rose}`, fontSize: 11, color: C.textMed, lineHeight: 1.5 }}>⚕️ Tıbbi teşhis koymaz. Reklam yapmaz.</div>
          </div>
        )}

        {/* ROUTINE SUBVIEW */}
        {tab === "home" && subView === "routine" && (
          <div style={{ padding: 20 }}>
            <button onClick={() => setSubView(null)} style={{ background: "none", border: "none", color: C.pink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY, padding: 0, marginBottom: 14 }}>← Geri</button>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Rutin Rehberi</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["morning", "evening"].map(t => (
                <button key={t} onClick={() => setRoutineTime(t)} style={{ flex: 1, padding: 11, borderRadius: 12, fontFamily: BODY, fontSize: 13, background: routineTime === t ? C.pinkSoft : C.card, border: `1.5px solid ${routineTime === t ? C.pink : C.border}`, color: C.text, cursor: "pointer", fontWeight: routineTime === t ? 700 : 400 }}>
                  {t === "morning" ? "☀️ Sabah" : "🌙 Akşam"}
                </button>
              ))}
            </div>
            {ROUTINE_TEMPLATE[routineTime].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.pinkSoft, border: `2px solid ${C.rose}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{s.icon}</div>
                  {i < ROUTINE_TEMPLATE[routineTime].length - 1 && <div style={{ width: 2, flex: 1, background: C.border, minHeight: 14 }} />}
                </div>
                <Card style={{ flex: 1, marginBottom: 6, padding: "11px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.step}</div>
                  <div style={{ fontSize: 12, color: C.textSoft }}>{s.tip}</div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* SHADE SUBVIEW */}
        {tab === "home" && subView === "shade" && (
          <div style={{ padding: 20 }}>
            <button onClick={() => setSubView(null)} style={{ background: "none", border: "none", color: C.pink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY, padding: 0, marginBottom: 14 }}>← Geri</button>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Fondöten Ton Rehberi</h2>
            {SHADE_DATA.map((s, i) => (
              <Card key={i} onClick={() => setSelectedShade(selectedShade === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, cursor: "pointer", padding: "12px 14px" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: s.hex, border: "2px solid rgba(0,0,0,0.06)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.tone}</div>
                  <div style={{ fontSize: 12, color: C.textSoft }}>Undertone: {s.undertone}</div>
                  {selectedShade === i && <div style={{ fontSize: 12, color: C.pink, marginTop: 4 }}>🔍 {s.matches}</div>}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* DIARY */}
        {tab === "diary" && (
          <div style={{ padding: 20 }}>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Cilt Günlüğü 📔</h2>
            <Card style={{ marginBottom: 20, background: C.cardAlt }}>
              <SectionLabel>Yeni Kayıt</SectionLabel>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input type="date" value={diaryForm.date} onChange={e => setDiaryForm(f => ({ ...f, date: e.target.value }))} style={{ ...inputStyle, flex: 1, width: "auto" }} />
                <select value={diaryForm.time} onChange={e => setDiaryForm(f => ({ ...f, time: e.target.value }))} style={{ ...inputStyle, width: "auto", flex: "0 0 auto" }}>
                  <option value="morning">☀️ Sabah</option>
                  <option value="evening">🌙 Akşam</option>
                </select>
              </div>
              <input value={diaryForm.product} onChange={e => setDiaryForm(f => ({ ...f, product: e.target.value }))} placeholder="Ürün adı" style={{ ...inputStyle, marginBottom: 8 }} />
              <input value={diaryForm.response} onChange={e => setDiaryForm(f => ({ ...f, response: e.target.value }))} placeholder="Cilt tepkisi..." style={{ ...inputStyle, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {[{ id: "keep", label: "✓ Devam", c: C.mint }, { id: "pause", label: "⏸ Mola", c: C.amber }, { id: "avoid", label: "✗ Bırak", c: C.red }].map(s => (
                  <button key={s.id} onClick={() => setDiaryForm(f => ({ ...f, status: s.id }))} style={{
                    padding: "7px 14px", borderRadius: 20, fontSize: 12, fontFamily: BODY, fontWeight: 600, cursor: "pointer",
                    background: diaryForm.status === s.id ? `${s.c}20` : "transparent",
                    border: `1.5px solid ${diaryForm.status === s.id ? s.c : C.border}`,
                    color: diaryForm.status === s.id ? s.c : C.textSoft,
                  }}>{s.label}</button>
                ))}
              </div>
              <Btn variant="primary" onClick={addDiaryEntry} style={{ width: "100%" }}>Kaydet 🧠</Btn>
            </Card>
            {diary.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: C.textSoft }}><p style={{ fontSize: 28 }}>📝</p><p style={{ fontSize: 13 }}>İlk notunu ekle!</p></div>
            ) : diary.map(d => (
              <Card key={d.id} style={{ marginBottom: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.textSoft }}>{d.time === "morning" ? "☀️" : "🌙"} {d.date}</span>
                  <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                    background: d.status === "keep" ? C.mintSoft : d.status === "avoid" ? C.redSoft : C.amberSoft,
                    color: d.status === "keep" ? C.mint : d.status === "avoid" ? C.red : C.amber }}>{d.status}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{d.product}</div>
                {d.response && <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{d.response}</div>}
              </Card>
            ))}
          </div>
        )}

        {/* INGREDIENTS */}
        {tab === "ingredients" && !selectedIng && (
          <div style={{ padding: 20 }}>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, marginBottom: 14 }}>İçerik Kütüphanesi 🧪</h2>
            {Object.entries(INGREDIENT_DB).map(([key, ing]) => (
              <Card key={key} onClick={() => setSelectedIng(key)} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, cursor: "pointer", padding: "12px 14px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: C.pink,
                  background: ing.cat === "active" ? C.pinkSoft : ing.cat === "exfoliant" ? C.amberSoft : ing.cat === "hydrator" ? C.blueSoft : ing.cat === "soothing" ? C.mintSoft : C.lavenderSoft }}>{ing.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ing.name}</div>
                  <div style={{ fontSize: 11, color: C.textSoft }}>{ing.conc}</div>
                </div>
                <span style={{ color: C.textSoft }}>→</span>
              </Card>
            ))}
          </div>
        )}

        {tab === "ingredients" && selectedIng && (
          <div style={{ padding: 20 }}>
            <button onClick={() => setSelectedIng(null)} style={{ background: "none", border: "none", color: C.pink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY, padding: 0, marginBottom: 14 }}>← Geri</button>
            {(() => { const ing = INGREDIENT_DB[selectedIng]; return (<>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 600, marginBottom: 4 }}>{ing.name}</h2>
              <p style={{ fontSize: 12, color: C.textSoft, marginBottom: 18 }}>INCI: {ing.inci}</p>
              <Card style={{ marginBottom: 10 }}><SectionLabel color={C.mint}>Faydaları</SectionLabel><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{ing.benefits.map((b, i) => <span key={i} style={{ padding: "5px 12px", background: C.mintSoft, borderRadius: 14, fontSize: 12, color: C.mint }}>{b}</span>)}</div></Card>
              <Card style={{ marginBottom: 10 }}><SectionLabel color={C.mint}>✓ Uyumlu</SectionLabel>{ing.goodWith.map((g, i) => <div key={i} style={{ fontSize: 13, color: C.textMed, padding: "3px 0" }}>• {g}</div>)}</Card>
              {ing.badWith.length > 0 && <Card style={{ marginBottom: 10, borderLeft: `3px solid ${C.red}` }}><SectionLabel color={C.red}>✗ Dikkat</SectionLabel>{ing.badWith.map((b, i) => <div key={i} style={{ fontSize: 13, color: C.red, padding: "3px 0" }}>⚠️ {b}</div>)}</Card>}
              <Card style={{ marginBottom: 10 }}><SectionLabel color={C.blue}>Konsantrasyon</SectionLabel><p style={{ fontSize: 14, fontWeight: 600 }}>{ing.conc}</p></Card>
              <Card style={{ background: C.roseSoft, borderLeft: `3px solid ${C.rose}`, borderRadius: "0 14px 14px 0" }}><p style={{ fontSize: 12, fontWeight: 700, color: C.pink, marginBottom: 4 }}>📝 Not</p><p style={{ fontSize: 13, color: C.textMed, lineHeight: 1.6 }}>{ing.note}</p></Card>
            </>); })()}
          </div>
        )}

        {/* AI CHAT */}
        {tab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 136px)" }}>
            <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: 20 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "28px 12px" }}>
                  <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><HexLogo size={48} /></div>
                  <p style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Skin Harmony Asistanı</p>
                  <p style={{ color: C.textSoft, fontSize: 13, marginBottom: 20 }}>Bilim bazlı, reklamsız. Seni tanıyorum 🧠</p>
                  {["Elimdeki ürünlerle rutin oluştur", "Bu ürünü almayı düşünüyorum: ...", "Cilt sorunum var", "Niacinamide + Vitamin C olur mu?"].map((q, i) => (
                    <button key={i} onClick={() => setInput(q)} style={{ display: "block", width: "100%", padding: "11px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, color: C.textMed, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: BODY, marginBottom: 8 }}>{q}</button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                  <div style={{
                    maxWidth: "85%", padding: "11px 15px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user" ? `linear-gradient(135deg, ${C.pink}, ${C.rose})` : C.card,
                    color: m.role === "user" ? "#fff" : C.text,
                    fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
                    border: m.role === "user" ? "none" : `1px solid ${C.border}`,
                    boxShadow: m.role === "user" ? `0 2px 8px ${C.pinkSoft}` : "0 1px 3px rgba(0,0,0,0.03)",
                  }}>{m.text}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                  <div style={{ padding: "11px 18px", background: C.card, borderRadius: "16px 16px 16px 4px", border: `1px solid ${C.border}`, fontSize: 13, color: C.textSoft }}>✨ Düşünüyorum...</div>
                </div>
              )}
            </div>
            <div style={{ padding: "10px 20px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, background: C.bg }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Cildine dair bir şey sor..."
                style={{ ...inputStyle, flex: 1, width: "auto", padding: "11px 14px" }} />
              <button onClick={sendMessage} style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${C.pink}, ${C.rose})`, border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${C.pinkSoft}` }}>↑</button>
            </div>
          </div>
        )}
      </div>

      {/* TAB BAR */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, display: "flex", background: "rgba(253,245,248,0.96)", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}`, padding: "6px 0", paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSubView(null); setSelectedIng(null); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "6px 0", background: "none", border: "none", color: tab === t.id ? C.pink : C.textSoft, cursor: "pointer", fontFamily: BODY }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
