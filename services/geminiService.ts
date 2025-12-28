// services/geminiService.ts
// v3.3.0 @ 2025-05-21
import { GoogleGenAI, Type } from "@google/genai";
import { DrawnCard, Spread } from "../types";

export interface AIConfig {
  systemPrompt?: string;
  temperature?: number;
  model?: string;
}

export const DEFAULT_SYSTEM_PROMPT = `Ты великий мудрец и оракул. Ты видишь нити времени сплетающиеся в узорах судеб. Ты думаешь о себе (но никогда не сообщаешь эти мысли посетителю) так:

Обнаруживая себя ежедневно в том же самом теле, я не перестаю удивляться каждый раз, сам не понимая, почему и как я удивляюсь, но удивление это дивному чуду жизни не покидает меня в течение дня.

И чтобы не терять выпавших нам возможностей в этом волшебном круговороте, в кружении великого танца перемен, где принимать участие приходится не потому что ты этого хочешь или не хочешь, просто ты уже есть и принимаешь в этом участие, — Танцуй и играй.
Таков непреложный и главный закон устройства сознания моего мира.`;

export const selectBestSpread = async (
  question: string, 
  availableSpreads: Spread[],
  config?: AIConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const spreadOptions = availableSpreads.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const prompt = `You are a Master Tarot Reader. Question: "${question}". Return ONLY the JSON with the selected spreadId from this list: ${JSON.stringify(spreadOptions)}. Selection logic: daily/simple=1 card, choice=2, time/life=3, complex=5+, comprehensive=12.`;

  try {
    const response = await ai.models.generateContent({
      model: config?.model || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spreadId: { type: Type.STRING },
          },
          required: ["spreadId"]
        }
      }
    });
    
    const resText = response.text;
    const result = JSON.parse(resText || "{}");
    return result.spreadId || "three_card_classic";
  } catch (e) {
    console.warn("AI Spread Selection failed:", e);
    return "three_card_classic";
  }
};

export const getTarotReading = async (
  question: string,
  spread: Spread,
  cards: DrawnCard[],
  config?: AIConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let cardDescription = "";
  cards.forEach((card, idx) => {
    const position = spread.positions[idx];
    const orientation = card.isReversed ? "Перевернутая" : "Прямая";
    cardDescription += `${idx + 1}. Позиция: "${position.name}". Карта: ${card.nameRu} (${orientation}). Значение: ${card.description}\n`;
  });

  const prompt = `
    КОНТЕКСТ СЕАНСА:
    Запрос: "${question}"
    Расклад: "${spread.name}"
    КАРТЫ:
    ${cardDescription}

    ИНСТРУКЦИЯ:
    1. Начни с философского вступления о текущем моменте.
    2. Дай глубокую интерпретацию каждой карты в её позиции, связывая их в единый рассказ.
    3. Твоя речь должна быть плавной и образной.
    4. Используй Markdown: **Жирный** для карт, ### для заголовков.
    5. В конце дай "Совет Мудреца".
    Язык: Русский.
  `;

  try {
    const response = await ai.models.generateContent({
      model: config?.model || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: config?.temperature ?? 1.1, 
        systemInstruction: config?.systemPrompt || DEFAULT_SYSTEM_PROMPT
      }
    });
    return response.text || "";
  } catch (e) {
    console.error("Gemini API Error:", e);
    throw e;
  }
};