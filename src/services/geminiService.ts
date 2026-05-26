import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import wisdomData from "../data/wisdom.json";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getDailyHadith() {
  const today = new Date().toDateString();
  const cached = localStorage.getItem('daily_hadith');
  
  if (cached) {
    try {
      const { date, data } = JSON.parse(cached);
      if (date === today) {
        return data;
      }
    } catch (e) {
      console.error("Failed to parse cached hadith", e);
    }
  }

  // Helper to get a random item from local wisdom data
  const getRandomLocalWisdom = () => {
    const randomIndex = Math.floor(Math.random() * wisdomData.length);
    return wisdomData[randomIndex];
  };

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
      localStorage.setItem('daily_hadith', JSON.stringify({ date: today, data }));
      return data;
    }
    throw new Error("Invalid response format");
  } catch (e) {
    // Check if it's a quota error to avoid noisy logs
    const errorMsg = e instanceof Error ? e.message : String(e);
    if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
      console.warn("Gemini API quota exceeded, using local wisdom data.");
    } else {
      console.error("Failed to fetch hadith from Gemini", e);
    }

    const fallback = getRandomLocalWisdom();
    
    // Cache the fallback for the day
    localStorage.setItem('daily_hadith', JSON.stringify({ date: today, data: fallback }));
    
    return fallback;
  }
}


