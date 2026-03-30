import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getDailyHadith() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Provide a short, inspiring Hadith from Shia sources (e.g., Nahj al-Balagha, Al-Kafi) with its English translation and source. Return it in a simple JSON format: { \"arabic\": \"...\", \"english\": \"...\", \"source\": \"...\" }",
    config: {
      responseMimeType: "application/json",
    },
  });
  
  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse hadith", e);
    return {
      arabic: "أَكْمَلُ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا",
      english: "The most complete of believers in faith is the one with the best character.",
      source: "Imam Ali (as), Nahj al-Balagha"
    };
  }
}

export async function askReligiousQuestion(question: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: question,
    config: {
      systemInstruction: "You are a knowledgeable and respectful assistant for Shia Muslims. Provide answers based on Jafari jurisprudence and Shia traditions. Always cite sources where possible (Quran, Nahj al-Balagha, etc.). Keep answers concise and helpful.",
    },
  });
  return response.text;
}
