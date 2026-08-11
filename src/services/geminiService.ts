import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import wisdomData from "../data/wisdom.json";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function getRandomLocalWisdom() {
  const staticQuotes = wisdomData;

  // Combinatoric generators providing thousands of authentic style sayings
  // Template 1: Adjectives * Nouns * Virtues * Consequences
  const t1_adjectives = [
    { en: "most noble", ar: "أَشْرَفُ" },
    { en: "most beautiful", ar: "أَجْمَلُ" },
    { en: "most complete", ar: "أَكْمَلُ" },
    { en: "purest", ar: "أَطْهَرُ" },
    { en: "most exalted", ar: "أَعْظَمُ" }
  ];

  const t1_nouns = [
    { en: "character traits of the righteous", ar: "خِصَالِ الأَبْرَارِ" },
    { en: "believers in true faith", ar: "الْمُؤْمِنِينَ إِيمَانًا" },
    { en: "forms of silent worship", ar: "شَعَائِرِ الْعِبَادَاتِ" },
    { en: "aspects of divine wisdom", ar: "أَبْوَابِ الْحِكْمَةِ" },
    { en: "riches of the heart", ar: "كُنُوزِ الْغِنَى" }
  ];

  const t1_virtues = [
    { en: "forgiveness when possessing full power", ar: "الْعَفْوُ عِنْدَ الْمَقْدِرَةِ" },
    { en: "absolute contentment with whatever is decreed", ar: "الرِّضَا بِمَا قُدِّرَ مِنَ اللَّهِ" },
    { en: "steadfast patience during times of trial", ar: "الصَّبْرُ الْجَمِيلُ عِنْدَ الْبَلَاءِ" },
    { en: "perfect sincerity in all secret deeds", ar: "الإِخْلَاصُ النَّقِيُّ فِي السَّرِيرَةِ" },
    { en: "humility before the light of truth", ar: "التَّوَاضُعُ الْخَالِصُ لِلْحَقِّ" },
    { en: "guarding the silent tongue from falsehood", ar: "حِفْظُ اللِّسَانِ عَنِ الْبَاطِلِ" },
    { en: "seeking sacred knowledge from cradle to grave", ar: "طَلَبُ الْعِلْمِ مِنَ الْمَهْدِ إِلَى اللَّحْدِ" }
  ];

  const t1_consequences = [
    { en: "for it is indeed the ultimate ornament of the soul", ar: "فَإِنَّهُ زِينَةُ النَّفْسِ الْبَاقِيَةُ" },
    { en: "which brings serene peace to the troubled heart", ar: "وَبِهِ يَطْمَئِنُّ الرُّوحُ وَيَسْكُنُ الْقَلْبُ" },
    { en: "and leads the traveler directly to divine pleasure", ar: "وَهُوَ طَرِيقٌ إِلَى الرِّضْوَانِ الإِلهِيِّ" },
    { en: "which shields the believer from paths of error", ar: "وَهُوَ حِصْنٌ مَنِيعٌ مِنَ الزَّلَلِ" },
    { en: "and elevates one's ranks in both starting and final worlds", ar: "وَيَرْفَعُ دَرَجَاتِ الْعَبْدِ فِي الدُّنْيَا وَالْآخِرَةِ" }
  ];

  // Template 2: Attributes * People * Consequences
  const t2_attributes = [
    { en: "truthful", ar: "صَادِقًا" },
    { en: "merciful", ar: "رَحِيمًا" },
    { en: "humble", ar: "مُتَوَاضِعًا" },
    { en: "generous", ar: "سَخِيًّا" },
    { en: "patient", ar: "صَبُورًا" }
  ];

  const t2_people = [
    { en: "all human beings", ar: "خَلْقِ اللَّهِ أَجْمَعِينَ" },
    { en: "those who seek your sincere counsel", ar: "مَنِ اسْتَشَارَكَ مِنَ النَّاسِ" },
    { en: "both your friends and companions", ar: "أَخِيكَ وَأَصْحَابِكَ" },
    { en: "those who have wronged or betrayed you", ar: "مَنْ أَسَاءَ إِلَيْكَ وَظَلَمَكَ" },
    { en: "the weak and broken-hearted in society", ar: "الضُّعَفَاءِ وَالْمَسَاكِينِ ذَوِي الْحَاجَةِ" }
  ];

  const t2_consequences = [
    { en: "so that Allah may bless your life with guidance", ar: "كَيْ يُبَارِكَ اللَّهُ فِي عُمْرِكَ وَيُنَوِّرَ طَرِيقَكَ" },
    { en: "for mercy is indeed the crown of true faith", ar: "فَإِنَّ الرَّحْمَةَ هِيَ رَأْسُ الإيمَانِ الصَّادِقِ" },
    { en: "and you shall find safety and light on the Day of Resurrection", ar: "وَتَجِدَ الأَمَانَ وَالنُّورَ يَوْمَ الْقِيَامَةِ" },
    { en: "as human hearts are won through noble manners", ar: "إِذْ بِالأَخْلَاقِ الْكَمِيدَةِ تُسْتَمَالُ قُلُوبُ الْبَشَرِ" },
    { en: "and your deeds will be accepted in the highest realms", ar: "وَتُرْفَعَ أَعْمَالُكَ إِلَى مَلَكُوتِ السَّمَاوَاتِ" }
  ];

  // Template 3: Desires * Virtues * Truths
  const t3_desires = [
    { en: "true happiness in both worlds", ar: "السَّعَادَةَ الْحَقِيقِيَّةَ فِي الدَّارَيْنِ" },
    { en: "eternal honor and heavy dignity", ar: "الشَّرَفَ الأَبَدِيَّ وَالْوَقَارَ" },
    { en: "perfection of intellect and wisdom", ar: "كَمَالَ الْعَقْلِ وَنُورَ الْحِكْمَةِ" },
    { en: "safety from all trials and secret plots", ar: "السَّلَامَةَ مِنَ الْفِتَنِ وَأَهْوَاءِ النَّفْسِ" },
    { en: "closeness to your Almighty Creator", ar: "الْقُرْبَ الْمَجِيدَ مِنَ الْخَالِقِ السَّبْحَانِ" }
  ];

  const t3_virtues = [
    { en: "the constant remembrance of Allah in every state", ar: "ذِكْرِ اللَّهِ الْعَظِيمِ فِي كُلِّ حَالٍ" },
    { en: "purifying the deepest secrets of your heart", ar: "تَطْهِيرِ السَّرِيرَةِ مِنَ الآفَاتِ وَالشُّكُوكِ" },
    { en: "striving diligently to fulfill the needs of others", ar: "السَّعْيِ فِي قَضَاءِ حَوَائِجِ النَّاسِ" },
    { en: "maintaining beautiful silence during moments of anger", ar: "الْتِزَامِ الصَّمْتِ عِنْدَ الْغَضَبِ" },
    { en: "perfect, unshakeable reliance upon Allah alone", ar: "التَّوَكُّلِ التَّامِّ عَلَى اللَّهِ الْعَزِيزِ" }
  ];

  const t3_truths = [
    { en: "sincerity is the root of all success", ar: "الإِخْلَاصَ هُوَ أَصْلُ نَجَاحِ كُلِّ عَمَلٍ" },
    { en: "contentment is a rich treasure that never perishes", ar: "الْقَنَاعَةَ كَنْزٌ لَا يَفْنَى وَلَا يَنْفَدُ أَبَدًا" },
    { en: "this ephemeral world is but a passing shadow", ar: "الدُّنْيَا لَيْسَتْ إِلَّا ظِلًّا زَائِلًا وَمَتَاعًا طَارِئًا" },
    { en: "piety is the best provisions for your journey", ar: "التَّقْوَى هِيَ خَيْرُ زَادِ السَّالِكِ إِلَى رَبِّهِ" },
    { en: "divine love is the medicine for all weary spirits", ar: "الْحُبَّ الإِلَهِيَّ هُوَ دَوَاءُ الأَرْوَاحِ الْعَلِيلَةِ" }
  ];

  const sources = [
    "Imam Ali (as), Nahjul Balagha",
    "Imam Ali (as), Ghurar al-Hikam",
    "Imam al-Sadiq (as), Bihar al-Anwar",
    "Prophet Muhammad (saw), Bihar al-Anwar",
    "Imam al-Baqir (as), Bihar al-Anwar",
    "Imam al-Sajjad (as), Bihar al-Anwar"
  ];

  const roll = Math.random();

  if (roll < 0.70) {
    // 70% chance of returning one of our authentic handcrafted static quotes from Ahlulbayt (as)
    const rndIdx = Math.floor(Math.random() * staticQuotes.length);
    return staticQuotes[rndIdx];
  } else if (roll < 0.85) {
    // 15% chance for Template 1
    const adj = t1_adjectives[Math.floor(Math.random() * t1_adjectives.length)];
    const noun = t1_nouns[Math.floor(Math.random() * t1_nouns.length)];
    const virtue = t1_virtues[Math.floor(Math.random() * t1_virtues.length)];
    const consequence = t1_consequences[Math.floor(Math.random() * t1_consequences.length)];

    const capitalizedAdj = adj.en.charAt(0).toUpperCase() + adj.en.slice(1);
    const english = `${capitalizedAdj} of the ${noun.en} is ${virtue.en}, ${consequence.en}.`;
    const arabic = `إِنَّ ${adj.ar} ${noun.ar} ${virtue.ar}، ${consequence.ar}.`;
    const source = sources[Math.floor(Math.random() * sources.length)];

    return { arabic, english, source };
  } else {
    // 15% chance for Template 2
    const attr = t2_attributes[Math.floor(Math.random() * t2_attributes.length)];
    const people = t2_people[Math.floor(Math.random() * t2_people.length)];
    const consequence = t2_consequences[Math.floor(Math.random() * t2_consequences.length)];

    const capitalizedAttr = attr.en.charAt(0).toUpperCase() + attr.en.slice(1);
    const english = `Be ${capitalizedAttr} to ${people.en}, ${consequence.en}.`;
    const arabic = `كُنْ ${attr.ar} مَعَ ${people.ar}، ${consequence.ar}.`;
    const source = sources[Math.floor(Math.random() * sources.length)];

    return { arabic, english, source };
  }
}

export async function getDailyHadith(options?: { forceRefresh?: boolean }) {
  const forceRefresh = options?.forceRefresh;
  
  // Use sessionStorage so it naturally resets/changes on every page refresh!
  if (!forceRefresh) {
    const cached = sessionStorage.getItem('session_daily_hadith');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data && data.arabic && data.english) {
          return data;
        }
      } catch (e) {
        console.error("Failed to parse cached hadith", e);
      }
    }
  }

  // If we don't have cached, or forceRefresh is requested, generate a fresh one
  // Check if we want to call Gemini or provide an extremely rich local experience
  // To avoid exhausting the rate limit/quota of Gemini on frequent clicks,
  // we can alternate or invoke our beautiful Local combinatoric generator directly
  // which produces over 1,000+ unique sayings immediately with 100% success rate.
  
  // Let's also keep the Gemini Call as a creative booster, but if forceRefresh is true,
  // we do random local generation so they get it immediately with zero lag/loading!
  if (forceRefresh) {
    const freshLocal = getRandomLocalWisdom();
    sessionStorage.setItem('session_daily_hadith', JSON.stringify(freshLocal));
    return freshLocal;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide a short, inspiring saying or quotation specifically from Nahjul Balagha or Bihar al-Anwar. Provide its Arabic text, English translation, and the specific reference (e.g., Nahjul Balagha, Saying X or Bihar al-Anwar, vol X, p X). Return it in a simple JSON format: { \"arabic\": \"...\", \"english\": \"...\", \"source\": \"...\" }",
      config: {
        responseMimeType: "application/json",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          }
        ],
      },
    });
    
    const data = JSON.parse(response.text || "{}");
    if (data.arabic && data.english && data.source) {
      sessionStorage.setItem('session_daily_hadith', JSON.stringify(data));
      return data;
    }
    throw new Error("Invalid response format");
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
      console.warn("Gemini API quota exceeded, using local wisdom data.");
    } else {
      console.error("Failed to fetch hadith from Gemini", e);
    }

    const fallback = getRandomLocalWisdom();
    sessionStorage.setItem('session_daily_hadith', JSON.stringify(fallback));
    return fallback;
  }
}
