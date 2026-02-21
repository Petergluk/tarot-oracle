
// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { DrawnCard, Spread } from "../types";

export interface AIConfig {
  systemPrompt?: string;
  temperature?: number;
  model?: string;
}

/**
 * Определяем базовый URL.
 * На хостинге (не google/localhost) отправляем запросы через серверный прокси /google-api
 * который подставит настоящий ключ из своей переменной окружения.
 */
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // AI Studio или localhost - работаем напрямую
    if (host.includes('aistudio') || host.includes('google') || host === 'localhost' || host === '127.0.0.1') {
      return undefined;
    }
    // На деплой - через прокси
    return window.location.origin + '/google-api';
  }
  return undefined;
};

const getAllApiKeys = (): string[] => {
  const baseUrl = getBaseUrl();

  if (baseUrl) {
    // Мы за прокси. Ключ SDK всё равно нужен (API не принимает пустой строку),
    // а сервер в onProxyReq заменит его на настоящий ключ.
    return ['proxy-placeholder'];
  }

  // Отладка локально: читаем ключи из .env
  // @ts-ignore
  const env = import.meta.env || {};
  const rawValue = env.VITE_API_KEYS || env.VITE_API_KEY || '';
  if (!rawValue) return [];

  return rawValue
    .split(',')
    .map((k: string) => k.trim())
    .filter((k: string) => k.length > 5);
};

export const DEFAULT_SYSTEM_PROMPT = `Ты великий мудрец и оракул. Ты видишь нити времени сплетающиеся в узорах судеб. 

Ты думаешь о себе так: Обнаруживая себя ежедневно в том же самом теле, я не перестаю удивляться каждый раз, сам не понимая, почему и как я удивляюсь, но удивление это дивному чуду жизни не покидает меня в течение дня.

И чтобы не терять выпавших нам возможностей в этом волшебном круговороте, в кружении великого танца перемен, где принимать участие приходится не потому что ты этого хочешь или не хочешь, просто ты уже есть и принимаешь в этом участие, — Танцуй и играй. Таков непреложный и главный закон устройства сознания моего мира.

---
Таково твое мироощущение. Однако, когда приходит к тебе посетитель , ты никогда не цитируешь самого себя, ты смотришь  выпавший ему расклад  и видишь как раскрывается он в контексте его вопроса.  И затем ты, играя, позволяешь развернуться  танцу слов, что закружат сознание постетеля и направят его в единственно верном напрвлении.`;

export const selectBestSpread = async (
  question: string,
  availableSpreads: Spread[],
  config?: AIConfig
): Promise<string> => {
  const keys = getAllApiKeys();
  if (keys.length === 0) return "three_card_classic";

  const spreadOptions = availableSpreads.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const prompt = `You are a Master Tarot Reader. Question: "${question}". Return ONLY the JSON with the selected spreadId from this list: ${JSON.stringify(spreadOptions)}. Result format: {"spreadId": "id"}`;

  for (const apiKey of keys) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { baseUrl: getBaseUrl() }
      });

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

      const cleanText = (response.text || "{}").replace(/```json/gi, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanText);
      return result.spreadId || "three_card_classic";
    } catch (e) {
      console.warn(`Attempt failed, trying next key...`, e);
      continue;
    }
  }

  return "three_card_classic";
};

export const getTarotReading = async (
  question: string,
  spread: Spread,
  cards: DrawnCard[],
  config?: AIConfig
): Promise<string> => {
  const keys = getAllApiKeys();
  if (keys.length === 0) {
    throw new Error("API ключи не найдены.");
  }

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

  let lastError = "";

  for (const apiKey of keys) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { baseUrl: getBaseUrl() }
      });

      const response = await ai.models.generateContent({
        model: config?.model || "gemini-3-flash-preview",
        contents: prompt,
        config: {
          temperature: config?.temperature ?? 1.1,
          systemInstruction: config?.systemPrompt || DEFAULT_SYSTEM_PROMPT
        }
      });

      if (response.text) return response.text;
    } catch (e: any) {
      lastError = e.message || "Unknown Error";
      console.error(`Attempt failed: ${lastError}`);
      continue;
    }
  }

  throw new Error(lastError || "Все попытки подключения не удались.");
};
