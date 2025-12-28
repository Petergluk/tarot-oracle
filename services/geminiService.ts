// services/geminiService.ts
// v3.6.0 @ 2025-05-21
import { GoogleGenAI, Type } from "@google/genai";
import { DrawnCard, Spread } from "../types";

export interface AIConfig {
  systemPrompt?: string;
  temperature?: number;
  model?: string;
}

/**
 * Получение ключа API. 
 * В Vite на хостинге переменные из render.yaml подставляются только если есть префикс VITE_.
 */
const getApiKey = () => {
  // @ts-ignore
  const env = import.meta.env || {};
  // Пытаемся найти ключ по всем возможным вариантам
  const key = env.VITE_API_KEYS || env.VITE_API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : null);
  
  if (!key) return null;
  
  // Если ключей несколько (через запятую), берем первый
  return key.split(',')[0].trim();
};

export const DEFAULT_SYSTEM_PROMPT = `Ты великий мудрец и оракул. Ты видишь нити времени сплетающиеся в узорах судеб. Ты думаешь о себе (но никогда не сообщаешь эти мысли посетителю) так:

Обнаруживая себя ежедневно в том же самом теле, я не перестаю удивляться каждый раз, сам не понимая, почему и как я удивляюсь, но удивление это дивному чуду жизни не покидает меня в течение дня.

И чтобы не терять выпавших нам возможностей в этом волшебном круговороте, в кружении великого танца перемен, где принимать участие приходится не потому что ты этого хочешь или не хочешь, просто ты уже есть и принимаешь в этом участие, — Танцуй и играй.
Таков непреложный и главный закон устройства сознания моего мира.`;

export const selectBestSpread = async (
  question: string, 
  availableSpreads: Spread[],
  config?: AIConfig
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "three_card_classic";

  const ai = new GoogleGenAI({ apiKey });
  const spreadOptions = availableSpreads.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const prompt = `You are a Master Tarot Reader. Question: "${question}". Return ONLY the JSON with the selected spreadId from this list: ${JSON.stringify(spreadOptions)}. Result format: {"spreadId": "id"}`;

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
    
    const result = JSON.parse(response.text || "{}");
    return result.spreadId || "three_card_classic";
  } catch (e) {
    return "three_card_classic";
  }
};

export const getTarotReading = async (
  question: string,
  spread: Spread,
  cards: DrawnCard[],
  config?: AIConfig
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_API_KEYS in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let cardDescription = "";
  cards.forEach((card, idx) => {
    const position = spread.positions[idx];
    const orientation = card.isReversed ? "Перевернутая" : "Прямая";
    cardDescription += `${idx + 1}. Позиция: "${position.name}". Карта: ${card.nameRu} (${orientation}). Значение: ${card.description}\n`;
  });

  const prompt = `
    СЕАНС ТАРО:
    Вопрос вопрошающего: "${question}"
    Выбранный расклад: "${spread.name}"
    
    ВЫПАВШИЕ КАРТЫ:
    ${cardDescription}

    ТВОЯ ЗАДАЧА:
    1. Напиши глубокое, мистическое толкование на русском языке.
    2. Используй Markdown: # для заголовков, ## для описания карт, > для советов.
    3. Обязательно начни с вступления и закончи "Советом Оракула".
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
    
    if (!response.text) {
      throw new Error("The API returned an empty response. This might be due to safety filters.");
    }
    
    return response.text;
  } catch (e: any) {
    // Выбрасываем ошибку с сообщением, которое пришло от Google
    const errorDetail = e.message || "Unknown error occurring during API call.";
    throw new Error(errorDetail);
  }
};
