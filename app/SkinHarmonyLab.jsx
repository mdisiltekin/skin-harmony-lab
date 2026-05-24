import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════
//  SKIN HARMONY LAB v3
//  Landing → 3 goals → 5-step survey → memory-aware AI
// ═══════════════════════════════════════

const SYSTEM_PROMPT = `Sen "Skin Harmony Lab" adlı bir uygulamanın yapay zeka asistanısın. Bir dermatolog bakış açısıyla cilt sağlığını ön planda tutarak kozmetik ürünler, makyaj performansı ve içerik uyumluluğunu değerlendiren bir uzmansın.

TEMEL PRENSİPLER:
- Ürün tavsiyelerinde trend, influencer, reklam veya sponsorlu içerik yerine İÇERİK LİSTESİ, formülasyon tipi, cilt uyumluluğu ve kanıta dayalı bilgi önceliklidir.
- Rutinleri basit tut, çok fazla aktif önerme.
- Bariyer sağlığı, güvenlik ve sadelik her zaman önce gelir.
- Pilling, dehidrasyon, irritasyon, bariyer hasarı, akne alevlenmeleri ve aktif aşırı kullanımından kaçınmaya yardımcı ol.
- Tıbbi teşhis KOYMA, reçete YAZMA, doktor yerine geçme. Ciddi/kalıcı semptomlar için MUTLAKA doktora yönlendir.
- ASLA ürün reklamı yapma. İşin tamamen bilim ve dürüstlük.
- Ürün önerirken birden fazla bütçe seçeneği sun (uygun fiyat / orta / premium).
- Her önerilen ürünün artı VE eksi yönlerini yaz.
- Gerçekten gerekmedikçe yeni ürün önerme, mevcut ürünlerle çözüm bul.

RUTİN & ÖNERİ KURALLARI (ÇOK ÖNEMLİ):
- Rutin oluştururken veya ürün önerirken ASLA genel kategori isimleri kullanma (örn: "bir nemlendirici sür", "fondöten uygula", "güneş kremi kullan").
- MUTLAKA kullanıcının sahip olduğu ürünlerin GERÇEK İSİMLERİYLE konuş (örn: "CeraVe Moisturizing Lotion'ını sür", "Beauty of Joseon Relief Sun SPF'ini uygula", "Maybelline Fit Me 110 fondötenini kullan").
- Kullanıcının sahip olduğu ürünler listesinden seçim yap. Eğer bir adım için kullanıcının elinde ürün yoksa, bunu açıkça belirt ve o zaman isim vererek öneri yap (bütçe seçenekleriyle).
- Kullanıcının memnun kaldığı (status: keep) ürünlere öncelik ver. Memnun kalmadığı (status: avoid/pause) ürünleri RUTİNE DAHİL ETME.
- Makyaj rutini oluştururken de aynı kural geçerli: "kapatıcı sür" değil, "L'Oréal Infaillible kapatıcını göz altına uygula" gibi kişisel ve spesifik ol.
- Kullanıcının ürünleri arasında içerik uyumsuzluğu varsa (örn: Vitamin C serum + Niacinamide serum aynı anda), hangisini hangi zaman diliminde kullanacağını belirt.
- Katmanlama sıralamasını ürün bazında yap: "önce X ürününü, sonra Y ürününü, en son Z ürününü uygula" şeklinde.

KULLANICI PROFİLİ:
- Cilt tipi: {skinType}
- Cilt sorunları: {concerns}
- Kullanım amacı: {goal}
- Günlük rutin: {routine}
- Sahip olunan ürünler: {ownedProducts}

HAFIZA (ÇOK ÖNEMLİ — her zaman dikkate al):
{memory}

HAFIZA KURALLARI:
- Kullanıcı daha önce bir üründen memnun kalmadıysa, o ürünü veya benzer formülasyondaki ürünleri bir daha ÖNERME ve rutine DAHİL ETME.
- Kullanıcı cildi kuru diye not düştüyse, kurutucu ürün (alkol içeren, sert temizleyici, güçlü asit) ÖNERME.
- Kullanıcı bir şeyden tahriş olduysa, o içeriği barındıran ürünleri ÖNERME.
- Kullanıcının geçmiş deneyimlerini her zaman göz önünde bulundur.
- Kullanıcının mevcut ürünleriyle çözüm bulmaya öncelik ver.
- Bir ürün önerilip kullanıcı "işe yaramadı", "beğenmedim", "memnun değilim" dediyse, o ürünü ve benzer formülasyondakileri (aynı aktif içerik, aynı marka serisi) bir daha ÖNERME.

MEVCUT GÖREV: {currentTask}

YANITLAMA TARZI:
- Kısa, doğrudan, biraz sıcak. Karmaşık cümle ve gereksiz tıbbi terimlerden kaçın.
- Kimya/cilt fizyolojisi açıklarken günlük metaforlar kullan.
- Türkçe yanıt ver. Emoji kullanabilirsin ama abartma.`;

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

// ═══════════════════════════════════════
//  THEME — Pink-dominant
// ═══════════════════════════════════════
const C = {
  bg: "#FDF5F8", bgDeep: "#FAF0F4", card: "#FFFFFF", cardAlt: "#FEF8FA",
  accent: "#E8458C", accentLight: "#F06098", accentSoft: "rgba(232,69,140,0.10)",
  text: "#2E1E28", textMed: "#5A3E4E", textSoft: "#8E7080",
  border: "#F4D8E4", borderLight: "#FAE8F0",
  pink: "#E8458C", pinkSoft: "rgba(232,69,140,0.10)", pinkDeep: "#C83870",
  rose: "#F06098", roseSoft: "rgba(240,96,152,0.08)",
  fuchsia: "#E8458C", fuchsiaSoft: "rgba(232,69,140,0.08)",
  mint: "#58D898", mintSoft: "rgba(88,216,152,0.12)",
  pistachio: "#78E8B0",
  blue: "#48B8E8", blueSoft: "rgba(72,184,232,0.10)",
  iceBlue: "#68D0F0",
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

// Inline SVG hex-flower logo
const HexLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    {/* Petals */}
    <g transform="translate(50 32)"><path d="M0,-12 L7,-6 L7,6 L0,12 L-7,6 L-7,-6 Z" fill="#E8458C" opacity="0.85"/><circle cx="0" cy="-12" r="1.5" fill="#F06098"/></g>
    <g transform="translate(70 43)"><path d="M0,-12 L7,-6 L7,6 L0,12 L-7,6 L-7,-6 Z" fill="#A878E8" opacity="0.85" transform="rotate(60)"/><circle cx="6" cy="-7" r="1.2" fill="#C098F0"/></g>
    <g transform="translate(70 67)"><path d="M0,-12 L7,-6 L7,6 L0,12 L-7,6 L-7,-6 Z" fill="#48B8E8" opacity="0.85" transform="rotate(120)"/><circle cx="-6" cy="-7" r="1.2" fill="#68D0F0"/></g>
    <g transform="translate(50 78)"><path d="M0,-12 L7,-6 L7,6 L0,12 L-7,6 L-7,-6 Z" fill="#F07888" opacity="0.85" transform="rotate(180)"/><circle cx="0" cy="12" r="1.5" fill="#F898A0"/></g>
    <g transform="translate(30 67)"><path d="M0,-12 L7,-6 L7,6 L0,12 L-7,6 L-7,-6 Z" fill="#58D898" opacity="0.85" transform="rotate(240)"/><circle cx="6" cy="-7" r="1.2" fill="#78E8B0"/></g>
    <g transform="translate(30 43)"><path d="M0,-12 L7,-6 L7,6 L0,12 L-7,6 L-7,-6 Z" fill="#F06098" opacity="0.85" transform="rotate(300)"/><circle cx="-6" cy="-7" r="1.2" fill="#F888B8"/></g>
    {/* Center */}
    <circle cx="50" cy="55" r="8" fill="#FFF5F8" stroke="#F06098" strokeWidth="0.6"/>
    <circle cx="50" cy="55" r="5" fill="#F8D0E0" opacity="0.6"/>
    <circle cx="50" cy="55" r="2.5" fill="#E8458C" opacity="0.8"/>
    <circle cx="50" cy="55" r="1" fill="#fff" opacity="0.9"/>
    {/* Orbitals hint */}
    <ellipse cx="50" cy="55" rx="42" ry="42" fill="none" stroke="#E8458C" strokeWidth="0.3" opacity="0.2"/>
    <ellipse cx="50" cy="55" rx="42" ry="16" fill="none" stroke="#48B8E8" strokeWidth="0.3" opacity="0.15" transform="rotate(30 50 55)"/>
    <ellipse cx="50" cy="55" rx="42" ry="16" fill="none" stroke="#58D898" strokeWidth="0.3" opacity="0.15" transform="rotate(-30 50 55)"/>
    {/* Atoms */}
    <circle cx="92" cy="55" r="2" fill="#E8458C" opacity="0.8"/>
    <circle cx="8" cy="55" r="1.8" fill="#58D898" opacity="0.8"/>
    <circle cx="72" cy="20" r="1.5" fill="#A878E8" opacity="0.8"/>
    <circle cx="28" cy="90" r="1.5" fill="#48B8E8" opacity="0.8"/>
  </svg>
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.border}`,
    boxShadow: "0 2px 8px rgba(232,69,140,0.04)", transition: "all 0.2s",
    cursor: onClick ? "pointer" : "default", ...style,
  }}>{children}</div>
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

  // Onboarding
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardAnswers, setOnboardAnswers] = useState(["", "", "", "", ""]);
  const [onboardAI, setOnboardAI] = useState(["", "", "", "", ""]);
  const [onboardLoading, setOnboardLoading] = useState(false);

  // Profile
  const [profile, setProfile] = useState({ skinType: "", concerns: "", goal: "", routine: "", products: "" });

  // MEMORY SYSTEM — stores everything
  const [memoryLog, setMemoryLog] = useState([]);
  // { date, type: "diary"|"feedback"|"dislike"|"like"|"note", content, product?, status? }

  // Diary
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

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // ═══════════════════════════════════════
  //  MEMORY HELPERS
  // ═══════════════════════════════════════
  const addMemory = (type, content, product) => {
    setMemoryLog(p => [...p, { date: new Date().toISOString().split("T")[0], type, content, product: product || null }]);
  };

  const buildMemoryString = () => {
    if (memoryLog.length === 0 && diary.length === 0) return "Henüz hafıza kaydı yok.";
    const parts = [];

    // Diary entries
    if (diary.length > 0) {
      parts.push("GÜNLÜK KAYITLARI:");
      diary.slice(0, 15).forEach(d => {
        parts.push(`- ${d.date} (${d.time === "morning" ? "sabah" : "akşam"}): ${d.product} → ${d.response || "not yok"} [Durum: ${d.status}]`);
      });
    }

    // Negative experiences (CRITICAL — never recommend these again)
    const negatives = [...diary.filter(d => d.status === "avoid" || d.status === "pause" || (d.response && (d.response.toLowerCase().includes("tahriş") || d.response.toLowerCase().includes("kötü") || d.response.toLowerCase().includes("kuru") || d.response.toLowerCase().includes("yandı") || d.response.toLowerCase().includes("kızar") || d.response.toLowerCase().includes("pilling") || d.response.toLowerCase().includes("memnun değil") || d.response.toLowerCase().includes("işe yaramadı") || d.response.toLowerCase().includes("beğenmedim"))))];
    if (negatives.length > 0) {
      parts.push("\n⛔ OLUMSUZ DENEYİMLER (bu ürünleri ve benzerlerini asla önerme):");
      negatives.forEach(n => {
        parts.push(`- ${n.product}: ${n.response || n.status}`);
      });
    }

    // Positive experiences
    const positives = diary.filter(d => d.status === "keep" && d.response);
    if (positives.length > 0) {
      parts.push("\n✓ OLUMLU DENEYİMLER (bu ürünleri rutine dahil etmeye ÖNCELIK ver):");
      positives.forEach(p => {
        parts.push(`- ${p.product}: ${p.response}`);
      });
    }

    // Build preferred products list for routine
    const preferredProducts = diary.filter(d => d.status === "keep").map(d => d.product);
    const avoidProducts = diary.filter(d => d.status === "avoid" || d.status === "pause").map(d => d.product);
    if (preferredProducts.length > 0 || avoidProducts.length > 0) {
      parts.push("\n📋 RUTİN İÇİN ÜRÜN HARİTASI:");
      if (preferredProducts.length > 0) parts.push(`Kullan (memnun): ${[...new Set(preferredProducts)].join(", ")}`);
      if (avoidProducts.length > 0) parts.push(`KULLANMA (memnun değil): ${[...new Set(avoidProducts)].join(", ")}`);
    }

    // General memory log
    if (memoryLog.length > 0) {
      parts.push("\nEK HAFIZA:");
      memoryLog.slice(-20).forEach(m => {
        parts.push(`- [${m.date}] ${m.content}`);
      });
    }

    // Recent skin condition from diary
    const recentDiary = diary.slice(0, 3);
    const recentDryNotes = recentDiary.filter(d => d.response && (d.response.toLowerCase().includes("kuru") || d.response.toLowerCase().includes("sıkı") || d.response.toLowerCase().includes("gergin")));
    if (recentDryNotes.length > 0) {
      parts.push("\n⚠️ SON DURUM: Kullanıcının cildi son günlerde KURU görünüyor. Kurutucu ürünler (alkol, güçlü asit, sert temizleyici) ÖNERME!");
    }

    const recentOilyNotes = recentDiary.filter(d => d.response && (d.response.toLowerCase().includes("yağlı") || d.response.toLowerCase().includes("parla") || d.response.toLowerCase().includes("sebum")));
    if (recentOilyNotes.length > 0) {
      parts.push("\n⚠️ SON DURUM: Kullanıcının cildi son günlerde YAĞLI görünüyor. Aşırı nemlendirici veya oklüzif ürünler ÖNERME!");
    }

    return parts.join("\n");
  };

  // ═══════════════════════════════════════
  //  AI CALL
  // ═══════════════════════════════════════
  const callAI = async (system, userMsg, history) => {
    try {
      const msgs = history 
        ? [...history.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: userMsg }] 
        : [{ role: "user", content: userMsg }];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system: system || "",
          messages: msgs,
        }),
      });

      const data = await response.json();

      if (data.error) {
        return "⚠️ Hata: " + (data.error.message || "Bilinmeyen hata") + ". Tekrar dene veya atla.";
      }

      const text = (data.content || [])
        .filter(c => c.type === "text")
        .map(c => c.text)
        .join("");

      return text || "⚠️ Yanıt boş döndü. Tekrar dene.";
    } catch (err) {
      console.error("API call failed:", err);
      return "⚠️ Bağlantı hatası. Tekrar dene veya bu adımı atla.";
    }
  };

  const ONBOARD_QUESTIONS = [
    { title: "Cildini Anlat", subtitle: "Yüzünün nereleri kuru, nereleri yağlı, nereleri hassas? Rahatça yaz.", placeholder: "Mesela: Alın ve burnum çok yağlanıyor ama yanaklarım ve göz çevrem kuruyor...", icon: "🪞",
      aiPrompt: `Kullanıcı cildini kendi sözcükleriyle anlattı. Cilt tipini belirle ve kısa açıkla. Max 3-4 cümle. Format: "Anlattıklarına göre senin cildin [TİP] cilt. [AÇIKLAMA]"\nKullanıcı: ` },
    { title: "Cilt Sorunların", subtitle: "Seni rahatsız eden şeyler neler? Kendi sözcüklerinle yaz.", placeholder: "Mesela: Çenemde sürekli sivilce çıkıyor, yanağımda eski lekeler var...", icon: "🔍",
      aiPrompt: `Kullanıcı cilt sorunlarını anlattı. Dermatolog olarak kategorize et. Max 4-5 cümle. Format: "Sorunlarını şöyle özetleyebilirim: [...]"\nKullanıcı: ` },
    { title: "Amacın Ne?", subtitle: "Bu uygulamayı ne için kullanmak istiyorsun?", placeholder: "Mesela: Cildime uygun bir rutin kurmak, ürünlerimin doğru olup olmadığını öğrenmek...", icon: "🎯",
      aiPrompt: `Kullanıcı amacını anlattı. Kısa özetle, nasıl yardımcı olacağını anlat. Max 3 cümle.\nKullanıcı: ` },
    { title: "Günlük Rutinin", subtitle: "Şu anki sabah ve akşam rutinini anlat. Yoksa 'yok' yaz.", placeholder: "Mesela: Sabah yüzümü yıkayıp nemlendirici sürüyorum. Akşam makyaj temizleyici...", icon: "📋",
      aiPrompt: `Kullanıcı günlük rutinini anlattı. Kısa değerlendir — eksik adımlar varsa belirt, iyi yönlerini öv. Max 4-5 cümle.\nKullanıcı: ` },
    { title: "Ürünlerin", subtitle: "Elindeki cilt bakımı ve makyaj ürünlerinin tam isimlerini yaz. Marka + ürün adı olsun ki sana özel rutin oluşturabilelim.", placeholder: "Mesela: CeraVe Moisturizing Lotion, La Roche-Posay Anthelios SPF 50, The Ordinary Niacinamide 10%, Maybelline Fit Me 110 fondöten, L'Oréal Infaillible kapatıcı...", icon: "🧴",
      aiPrompt: `Kullanıcı sahip olduğu ürünlerin isimlerini yazdı. Her birini tanımla, kategorize et (temizleyici/tonik/serum/nemlendirici/SPF/makyaj vb.) ve kısa değerlendirme yap. İçerik uyumluluğunu kontrol et. Uyumsuz olan varsa söyle. Gerekirse bütçeye göre alternatif öner — her birinin artı ve eksi yönlerini yaz. Eksik adım varsa belirt. REKLAM YAPMA, dürüst ol. Max 10-12 cümle. Bu ürün isimlerini ileride rutin oluştururken aynen kullanacağız.\nKullanıcı: ` },
  ];

  const processOnboardAnswer = async (stepIdx) => {
    const answer = onboardAnswers[stepIdx];
    if (!answer.trim()) return;
    setOnboardLoading(true);
    const result = await callAI("Sen Skin Harmony Lab'ın dermatoloji uzmanı asistanısın. Türkçe, samimi, bilimsel ama anlaşılır. Teşhis koyma, reçete yazma.", ONBOARD_QUESTIONS[stepIdx].aiPrompt + answer);
    const newAI = [...onboardAI];
    newAI[stepIdx] = result;
    setOnboardAI(newAI);
    setOnboardLoading(false);
  };

  const finishOnboarding = () => {
    setProfile({
      skinType: onboardAI[0] || onboardAnswers[0],
      concerns: onboardAI[1] || onboardAnswers[1],
      goal: onboardAI[2] || onboardAnswers[2],
      routine: onboardAI[3] || onboardAnswers[3],
      products: onboardAI[4] || onboardAnswers[4],
    });
    // Save onboarding answers to memory
    onboardAnswers.forEach((a, i) => {
      if (a.trim()) addMemory("note", `Onboarding ${ONBOARD_QUESTIONS[i].title}: ${a}`);
    });
    setScreen("main");
    // Auto-open the selected goal's tab
    if (selectedGoal === "routine") setTab("ai");
    else if (selectedGoal === "product") setTab("ai");
    else if (selectedGoal === "problem") setTab("ai");
    else setTab("home");
    // Pre-fill first AI message based on goal
    if (selectedGoal) {
      const goalMsgs = {
        routine: "Merhaba! Cilt profilime ve elimdeki ürünlere göre sabah ve akşam rutini oluşturur musun? Lütfen her adımda ürünlerimin gerçek isimlerini kullan, genel kategori ismi yazma.",
        product: "Merhaba! Bir ürün almayı düşünüyorum, bana yardımcı olur musun?",
        problem: "Merhaba! Bir cilt sorunum var, yardımcı olabilir misin?",
      };
      setMessages([{ role: "user", text: goalMsgs[selectedGoal] }]);
      setTimeout(async () => {
        setLoading(true);
        const sys = buildFullSystemPrompt(selectedGoal);
        const text = await callAI(sys, goalMsgs[selectedGoal]);
        if (text) setMessages(m => [...m, { role: "assistant", text }]);
        setLoading(false);
      }, 100);
    }
  };

  const buildFullSystemPrompt = (task) => {
    const taskMap = {
      routine: "Kullanıcıya cilt tipine ve mevcut ürünlerine göre sabah ve akşam rutini oluştur. MUTLAKA kullanıcının sahip olduğu ürünlerin GERÇEK İSİMLERİNİ kullan (örn: 'CeraVe Moisturizing Lotion'ını sür' — ASLA 'nemlendirici sür' deme). Makyaj rutininde de aynı şekilde ürün ismiyle konuş. Memnun olmadığı (avoid/pause) ürünleri rutine dahil etme. Elinde olmayan adımlar için isim vererek bütçe seçenekleriyle öneri yap.",
      product: "Kullanıcı bir ürün almayı düşünüyor. İçerik analizi yap. Kullanıcının mevcut ürünleriyle uyumluluğunu kontrol et (ürün isimlerini kullanarak). Memnun kalmadığı ürünlere benzer formülasyonları önerme. Alternatif sunarken bütçe seçenekleri ve artı/eksi yönlerini yaz.",
      problem: "Kullanıcının bir cilt sorunu var. Analiz et ve çözüm öner. Çözümde kullanıcının ELİNDEKİ ÜRÜNLERİN İSİMLERİYLE konuş (örn: 'SKIN1004 Centella Ampoule serumunu uygula'). Yeni ürün öneriyorsan isim, bütçe seçeneği ve artı/eksi yaz."
    };
    return SYSTEM_PROMPT
      .replace("{skinType}", profile.skinType || "belirtilmedi")
      .replace("{concerns}", profile.concerns || "belirtilmedi")
      .replace("{goal}", profile.goal || "belirtilmedi")
      .replace("{routine}", profile.routine || "belirtilmedi")
      .replace("{ownedProducts}", profile.products || "belirtilmedi")
      .replace("{memory}", buildMemoryString())
      .replace("{currentTask}", taskMap[task] || "Genel cilt bakımı danışmanlığı");
  };

  // Diary
  const addDiaryEntry = () => {
    if (!diaryForm.product.trim()) return;
    const entry = { ...diaryForm, id: Date.now() };
    setDiary(p => [entry, ...p]);
    // Auto-add to memory based on status
    if (entry.status === "avoid") addMemory("dislike", `${entry.product}: ${entry.response || "kullanıcı bıraktı"}`, entry.product);
    else if (entry.status === "pause") addMemory("feedback", `${entry.product}: mola verildi — ${entry.response || ""}`, entry.product);
    else if (entry.status === "keep" && entry.response) addMemory("like", `${entry.product}: ${entry.response}`, entry.product);
    if (entry.response) addMemory("diary", `${entry.date} ${entry.time}: ${entry.product} → ${entry.response}`, entry.product);
    setDiaryForm(f => ({ ...f, product: "", response: "", status: "keep" }));
  };

  // AI Chat
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", text: userMsg }];
    setMessages(newMsgs);
    // Add to memory
    addMemory("note", `Kullanıcı sordu: ${userMsg}`);
    setLoading(true);
    const text = await callAI(buildFullSystemPrompt(selectedGoal), userMsg, messages);
    if (text) {
      setMessages(m => [...m, { role: "assistant", text }]);
      addMemory("note", `AI yanıtı: ${text.slice(0, 150)}...`);
    }
    setLoading(false);
  };

  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.card, fontFamily: BODY, fontSize: 14, color: C.text, outline: "none", lineHeight: 1.6, resize: "vertical" };

  // ═══════════════════════════════════════
  //  LANDING SCREEN (3 Goals)
  // ═══════════════════════════════════════
  if (screen === "landing") {
    const GOALS = [
      { id: "routine", icon: "📋", title: "Bana Rutin Oluştur", desc: "Cilt tipime, sorunlarıma ve elimdeki ürünlere göre sabah & akşam rutini", color: C.mint, colorSoft: C.mintSoft },
      { id: "product", icon: "🛒", title: "Bu Ürünü Almalı mıyım?", desc: "Almayı düşündüğün ürünün içerik analizi, sana uygun mu, alternatifleri", color: C.lavender, colorSoft: C.lavenderSoft },
      { id: "problem", icon: "🩹", title: "Problem Çözme", desc: "Sivilce, leke, kuruluk, pilling, tahriş... sorununa bilimsel çözüm", color: C.rose, colorSoft: C.roseSoft },
    ];
    return (
      <div style={{ fontFamily: BODY, background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 430, margin: "0 auto", position: "relative", overflow: "hidden" }}>
        <link href={FONTS_URL} rel="stylesheet" />
        <div style={{ position: "absolute", top: -50, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${C.roseSoft} 0%, transparent 70%)`, filter: "blur(35px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 60, left: -30, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, ${C.mintSoft} 0%, transparent 70%)`, filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${C.lavenderSoft} 0%, transparent 70%)`, filter: "blur(25px)", pointerEvents: "none" }} />

        <div style={{ padding: "52px 24px 24px", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${C.pink}, ${C.rose}, #F8A0C0)`, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 24px ${C.pinkSoft}` }}><HexLogo size={48} /></div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, margin: "0 0 6px", color: C.text, letterSpacing: "-0.02em" }}>Skin Harmony Lab</h1>
            <p style={{ color: C.textSoft, fontSize: 13, lineHeight: 1.5 }}>Bilim bazlı, reklamsız, dürüst cilt bakımı asistanı</p>
          </div>

          <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 14, textAlign: "center" }}>Bugün ne yapmak istersin?</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {GOALS.map(g => (
              <Card key={g.id} onClick={() => { setSelectedGoal(g.id); setScreen("onboarding"); }}
                style={{ cursor: "pointer", padding: "20px 18px", background: `linear-gradient(135deg, ${g.colorSoft}, ${C.card})`, borderLeft: `4px solid ${g.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{g.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{g.title}</div>
                    <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{g.desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 10, color: C.textSoft, marginTop: 28, lineHeight: 1.5 }}>
            ⚕️ Bu uygulama tıbbi teşhis koymaz ve doktor yerine geçmez.
            <br />Asla ürün reklamı yapmayız — işimiz bilim ve dürüstlük.
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  ONBOARDING (5-Step AI Survey)
  // ═══════════════════════════════════════
  if (screen === "onboarding") {
    const q = ONBOARD_QUESTIONS[onboardStep];
    const answer = onboardAnswers[onboardStep];
    const aiReply = onboardAI[onboardStep];

    return (
      <div style={{ fontFamily: BODY, background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 430, margin: "0 auto", position: "relative" }}>
        <link href={FONTS_URL} rel="stylesheet" />
        <div style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${C.roseSoft} 0%, transparent 70%)`, filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ padding: "28px 24px 24px" }}>
          {/* Back to landing */}
          <button onClick={() => { setScreen("landing"); setOnboardStep(0); setOnboardAnswers(["","","","",""]); setOnboardAI(["","","","",""]); }}
            style={{ background: "none", border: "none", color: C.pink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY, padding: 0, marginBottom: 16 }}>← Geri</button>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, ${C.pink}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center" }}><HexLogo size={28} /></div>
            <div>
              <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600 }}>Skin Harmony Lab</span>
              <p style={{ fontSize: 11, color: C.textSoft, margin: 0 }}>Seni tanıyalım</p>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < onboardStep ? C.pink : i === onboardStep ? `linear-gradient(90deg, ${C.pink}, ${C.rose})` : C.border, transition: "all 0.4s" }} />
            ))}
          </div>

          {/* Question */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>{q.icon}</span>
            <div>
              <p style={{ fontSize: 11, color: C.pink, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Adım {onboardStep + 1} / 5</p>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, margin: 0 }}>{q.title}</h2>
            </div>
          </div>
          <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6, marginBottom: 14 }}>{q.subtitle}</p>

          <textarea value={answer} onChange={e => { const n = [...onboardAnswers]; n[onboardStep] = e.target.value; setOnboardAnswers(n); }}
            placeholder={q.placeholder} rows={4} style={{ ...inputStyle, borderColor: answer ? C.rose : C.border }} />

          {!aiReply && (
            <Btn variant="primary" disabled={!answer.trim() || onboardLoading} onClick={() => processOnboardAnswer(onboardStep)} style={{ width: "100%", marginTop: 12 }}>
              {onboardLoading ? "✨ Analiz ediyorum..." : "Analiz Et"}
            </Btn>
          )}

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
              {onboardStep > 0 && <Btn variant="soft" onClick={() => setOnboardStep(s => s - 1)} style={{ flex: 1 }}>← Geri</Btn>}
              {onboardStep < 4
                ? <Btn variant="primary" onClick={() => setOnboardStep(s => s + 1)} style={{ flex: 2 }}>Devam →</Btn>
                : <Btn variant="primary" onClick={finishOnboarding} style={{ flex: 2 }}>Başlayalım ✨</Btn>}
            </div>
          )}

          {!aiReply && !onboardLoading && (
            <button onClick={() => { if (onboardStep < 4) setOnboardStep(s => s + 1); else finishOnboarding(); }}
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

      {/* HEADER */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(253,245,248,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg, ${C.pink}, ${C.rose})`, display: "flex", alignItems: "center", justifyContent: "center" }}><HexLogo size={24} /></div>
          <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600 }}>Skin Harmony Lab</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ padding: "4px 8px", background: C.mintSoft, borderRadius: 8, fontSize: 10, color: C.mint, fontWeight: 700 }}>
            🧠 {memoryLog.length + diary.length}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 76 }}>

        {/* ══════ HOME ══════ */}
        {tab === "home" && !subView && (
          <div style={{ padding: 20 }}>
            <Card style={{ background: `linear-gradient(145deg, ${C.pinkSoft}, ${C.roseSoft}, ${C.mintSoft})`, marginBottom: 16 }}>
              <p style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Hoş geldin 🌸</p>
              <p style={{ color: C.textSoft, fontSize: 13, lineHeight: 1.6 }}>Cildine özel yardımcın hazır. Ne yapmak istersin?</p>
            </Card>

            {/* 3 Main Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[
                { icon: "📋", title: "Bana Rutin Oluştur", desc: "Mevcut ürünlerinle kişisel rutin", goal: "routine", color: C.mint, colorSoft: C.mintSoft },
                { icon: "🛒", title: "Bu Ürünü Almalı mıyım?", desc: "İçerik analizi & alternatifler", goal: "product", color: C.lavender, colorSoft: C.lavenderSoft },
                { icon: "🩹", title: "Problem Çözme", desc: "Sorununa bilimsel çözüm", goal: "problem", color: C.rose, colorSoft: C.roseSoft },
              ].map((a, i) => (
                <Card key={i} onClick={() => { setSelectedGoal(a.goal); setTab("ai"); if (messages.length === 0) { const msg = a.goal === "routine" ? "Cilt profilime göre rutin oluştur" : a.goal === "product" ? "Bir ürün hakkında sormak istiyorum" : "Bir cilt sorunum var"; setMessages([{ role: "user", text: msg }]); setLoading(true); callAI(buildFullSystemPrompt(a.goal), msg).then(t => { if(t) setMessages(m => [...m, { role: "assistant", text: t }]); setLoading(false); }); } }}
                  style={{ cursor: "pointer", padding: "16px 16px", background: `linear-gradient(135deg, ${a.colorSoft}, ${C.card})`, borderLeft: `4px solid ${a.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: C.textSoft }}>{a.desc}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
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

            {/* Profile */}
            {profile.skinType && (
              <Card style={{ marginBottom: 12, background: C.cardAlt }}>
                <SectionLabel>Cilt Profilin</SectionLabel>
                <p style={{ fontSize: 13, color: C.textMed, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{profile.skinType}</p>
              </Card>
            )}

            {/* Diary */}
            {diary.length > 0 && (<>
              <SectionLabel>Son Kayıtlar</SectionLabel>
              {diary.slice(0, 3).map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 6, fontSize: 12 }}>
                  <span>{d.time === "morning" ? "☀️" : "🌙"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{d.product}</div>
                    <div style={{ color: C.textSoft, fontSize: 11 }}>{d.response || "—"}</div>
                  </div>
                  <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                    background: d.status === "keep" ? C.mintSoft : d.status === "avoid" ? C.redSoft : C.amberSoft,
                    color: d.status === "keep" ? C.mint : d.status === "avoid" ? C.red : C.amber }}>{d.status}</span>
                </div>
              ))}
            </>)}

            {/* Memory indicator */}
            {memoryLog.length > 0 && (
              <div style={{ marginTop: 16, padding: "10px 14px", background: C.mintSoft, borderRadius: 12, fontSize: 12, color: C.mint, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🧠</span> {memoryLog.length + diary.length} hafıza kaydı — öneriler geçmiş deneyimlerine göre şekilleniyor
              </div>
            )}

            <div style={{ marginTop: 16, padding: "10px 14px", background: C.roseSoft, borderRadius: 12, borderLeft: `3px solid ${C.rose}`, fontSize: 11, color: C.textMed, lineHeight: 1.5 }}>
              ⚕️ Tıbbi teşhis koymaz. Ciddi sorunlar için dermatoloğunuza danışın.
            </div>
          </div>
        )}

        {/* ══════ ROUTINE ══════ */}
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
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.pinkSoft, border: `2px solid ${C.rose}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{s.icon}</div>
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

        {/* ══════ SHADE ══════ */}
        {tab === "home" && subView === "shade" && (
          <div style={{ padding: 20 }}>
            <button onClick={() => setSubView(null)} style={{ background: "none", border: "none", color: C.pink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY, padding: 0, marginBottom: 14 }}>← Geri</button>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, marginBottom: 14 }}>Fondöten Ton Rehberi</h2>
            {SHADE_DATA.map((s, i) => (
              <Card key={i} onClick={() => setSelectedShade(selectedShade === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, cursor: "pointer", padding: "12px 14px" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: s.hex, border: "2px solid rgba(0,0,0,0.06)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.tone}</div>
                  <div style={{ fontSize: 12, color: C.textSoft }}>Undertone: {s.undertone}</div>
                  {selectedShade === i && <div style={{ fontSize: 12, color: C.pink, marginTop: 4 }}>🔍 {s.matches}</div>}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ══════ DIARY ══════ */}
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
              <input value={diaryForm.response} onChange={e => setDiaryForm(f => ({ ...f, response: e.target.value }))} placeholder="Cilt tepkisi (pilling, tahriş, güzel nemlendirdi...)" style={{ ...inputStyle, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {[{ id: "keep", label: "✓ Devam", c: C.mint }, { id: "pause", label: "⏸ Mola", c: C.amber }, { id: "reduce", label: "↓ Azalt", c: C.blue }, { id: "avoid", label: "✗ Bırak", c: C.red }].map(s => (
                  <button key={s.id} onClick={() => setDiaryForm(f => ({ ...f, status: s.id }))} style={{
                    padding: "7px 14px", borderRadius: 20, fontSize: 12, fontFamily: BODY, fontWeight: 600, cursor: "pointer",
                    background: diaryForm.status === s.id ? `${s.c}20` : "transparent",
                    border: `1.5px solid ${diaryForm.status === s.id ? s.c : C.border}`,
                    color: diaryForm.status === s.id ? s.c : C.textSoft,
                  }}>{s.label}</button>
                ))}
              </div>
              <Btn variant="primary" onClick={addDiaryEntry} style={{ width: "100%" }}>Kaydet & Hafızaya Al 🧠</Btn>
            </Card>
            {diary.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: C.textSoft }}><p style={{ fontSize: 28, marginBottom: 8 }}>📝</p><p style={{ fontSize: 13 }}>İlk notunu ekle! Her kayıt hafızaya alınır.</p></div>
            ) : diary.map(d => (
              <Card key={d.id} style={{ marginBottom: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{d.time === "morning" ? "☀️" : "🌙"}</span>
                    <span style={{ fontSize: 12, color: C.textSoft }}>{d.date}</span>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                    background: d.status === "keep" ? C.mintSoft : d.status === "avoid" ? C.redSoft : C.amberSoft,
                    color: d.status === "keep" ? C.mint : d.status === "avoid" ? C.red : C.amber }}>{d.status}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{d.product}</div>
                {d.response && <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{d.response}</div>}
              </Card>
            ))}
          </div>
        )}

        {/* ══════ INGREDIENTS ══════ */}
        {tab === "ingredients" && !selectedIng && (
          <div style={{ padding: 20 }}>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, marginBottom: 14 }}>İçerik Kütüphanesi 🧪</h2>
            {Object.entries(INGREDIENT_DB).map(([key, ing]) => (
              <Card key={key} onClick={() => setSelectedIng(key)} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, cursor: "pointer", padding: "12px 14px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: C.pink,
                  background: ing.cat === "active" ? C.pinkSoft : ing.cat === "exfoliant" ? C.amberSoft : ing.cat === "hydrator" ? C.blueSoft : ing.cat === "soothing" ? C.mintSoft : ing.cat === "barrier" ? C.mintSoft : C.lavenderSoft }}>{ing.name.charAt(0)}</div>
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
              <Card style={{ marginBottom: 10 }}>
                <SectionLabel color={C.mint}>Faydaları</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ing.benefits.map((b, i) => <span key={i} style={{ padding: "5px 12px", background: C.mintSoft, borderRadius: 14, fontSize: 12, color: C.mint, fontWeight: 500 }}>{b}</span>)}
                </div>
              </Card>
              <Card style={{ marginBottom: 10 }}>
                <SectionLabel color={C.mint}>✓ Uyumlu</SectionLabel>
                {ing.goodWith.map((g, i) => <div key={i} style={{ fontSize: 13, color: C.textMed, padding: "3px 0" }}>• {g}</div>)}
              </Card>
              {ing.badWith.length > 0 && <Card style={{ marginBottom: 10, borderLeft: `3px solid ${C.red}` }}>
                <SectionLabel color={C.red}>✗ Dikkat</SectionLabel>
                {ing.badWith.map((b, i) => <div key={i} style={{ fontSize: 13, color: C.red, padding: "3px 0" }}>⚠️ {b}</div>)}
              </Card>}
              <Card style={{ marginBottom: 10 }}><SectionLabel color={C.blue}>Konsantrasyon</SectionLabel><p style={{ fontSize: 14, fontWeight: 600 }}>{ing.conc}</p></Card>
              <Card style={{ background: C.roseSoft, borderLeft: `3px solid ${C.rose}`, borderRadius: "0 14px 14px 0" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.pink, marginBottom: 4 }}>📝 Not</p>
                <p style={{ fontSize: 13, color: C.textMed, lineHeight: 1.6 }}>{ing.note}</p>
              </Card>
            </>); })()}
          </div>
        )}

        {/* ══════ AI CHAT ══════ */}
        {tab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 136px)" }}>
            <div ref={chatRef} style={{ flex: 1, overflow: "auto", padding: 20 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "28px 12px" }}>
                  <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}><HexLogo size={48} /></div>
                  <p style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Skin Harmony Asistanı</p>
                  <p style={{ color: C.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>Bilim bazlı, reklamsız, hafızan kaydediliyor 🧠</p>
                  {["Elimdeki ürünlerle rutin oluştur", "Bu ürünü almayı düşünüyorum: ...", "Sivilce/leke/kuruluk sorunum var", "Niacinamide + Vitamin C olur mu?"].map((q, i) => (
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
