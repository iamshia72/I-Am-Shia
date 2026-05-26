import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "dummy_key" });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
test();
