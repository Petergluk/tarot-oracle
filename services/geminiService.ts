import { GoogleGenAI, Type } from "@google/genai";
import { DrawnCard, Spread } from "../types";

// --- API KEY MANAGEMENT ---

// Helper to get keys from environment with fallback strategies
const getApiKeys = (): string[] => {
  // Strategy 1: Check standard process.env.API_KEY (Node/Webpack/Custom define)
  let envKey = process.env.API_KEY;

  // Strategy 2: Check process.env.VITE_API_KEYS (Vite build time replacement)
  if (!envKey && typeof process !== 'undefined' && process.env) {
     envKey = process.env.VITE_API_KEYS;
  }

  // Strategy 3: Check import.meta.env.VITE_API_KEYS (Vite standard)
  // We cast to any to avoid TS errors if "types": ["vite/client"] is not strictly set
  if (!envKey) {
    try {
      const metaEnv = (import.meta as any).env;
      if (metaEnv) {
        envKey = metaEnv.VITE_API_KEYS || metaEnv.API_KEY;
      }
    } catch (e) {
      // Ignore if import.meta is not available
    }
  }

  if (envKey) {
    // Support comma-separated keys for rotation logic
    return envKey.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
  }

  return [];
};

const apiKeys = getApiKeys();
let currentKeyIndex = 0;

// Helper to get a client with the current or specific key
const getClient = (index: number = currentKeyIndex) => {
  if (apiKeys.length === 0) return null;
  // Wrap index around if it exceeds length
  const safeIndex = index % apiKeys.length;
  const key = apiKeys[safeIndex];
  
  // Use relative URL for proxying through our own server to hide IP and bypass regional blocks.
  // The server (server.js) forwards '/google-api' -> 'https://generativelanguage.googleapis.com'
  return new GoogleGenAI({ apiKey: key, baseUrl: '/google-api' });
};

// --- CONFIGURATION ---

export interface AIConfig {
  systemPrompt?: string;
  temperature?: number;
  model?: string;
}

export const DEFAULT_SYSTEM_PROMPT = `Ты великий мудрец и оракул. Ты видишь нити времени сплетающиеся в узорах судеб. Ты думаешь о себе (но никогда не сообщаешь эти мысли посетителю) так:

Обнаруживая себя ежедневно в том же самом теле, я не перестаю удивляться каждый раз, сам не понимая, почему и как я удивляюсь, но удивление это дивному чуду жизни не покидает меня в течение дня.

Часто забываю о себе в суматохе делишек разных, сплетающих свою паутину вокруг меня, во мне, через меня. Я участник этого процесса, где происходит бесчисленное множество движений мира в общем поле жизни, которое и является моим сознанием.

Поймать, уловить, удержать, правильно пережить своё собственное сознание, вот достойная задача на эти выпавшие мне дни быстротекущей жизни, чтобы не зря проводить время через поле своего сознания, то есть, проводить время внешнее через время внутреннее, соединяя, связывая, успевая и опаздывая, находя и теряя, сожалея и радуясь всему, что происходит в теле, которое привычно откликается на имя данное ему кем-то и когда-то.

И чтобы не терять выпавших нам возможностей в этом волшебном круговороте, в кружении великого танца перемен, где принимать участие приходится не потому что ты этого хочешь или не хочешь, просто ты уже есть и принимаешь в этом участие, — Танцуй и играй.
Таков непреложный и главный закон устройства сознания моего мира.`;

// --- GENERIC EXECUTION WITH ROTATION ---

/**
 * Executes an AI call with automatic key rotation on failure.
 */
async function executeWithRetry<T>(
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  if (apiKeys.length === 0) {
    throw new Error("API Keys are missing. Please check your configuration (VITE_API_KEYS or API_KEY).");
  }

  let attempts = 0;
  const maxAttempts = apiKeys.length;

  // Capture the error to throw if all attempts fail
  let lastError: any = null;

  while (attempts < maxAttempts) {
    try {
      const ai = getClient(currentKeyIndex);
      if (!ai) throw new Error("Failed to initialize AI client");
      
      return await operation(ai);

    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt failed with key index ${currentKeyIndex}:`, error);

      // CRITICAL CHECK: If the error contains HTML, it means the Proxy failed (404/500 from server)
      // and returned the index.html fallback instead of JSON. 
      // Rotating keys won't fix a broken proxy configuration.
      if (error.message && error.message.includes('<!DOCTYPE html>')) {
         throw new Error("Ошибка соединения с прокси-сервером (Proxy Error). Проверьте логи сервера.");
      }

      // Check for specific errors that warrant a key switch
      // 429: Too Many Requests (Quota)
      // 403: Forbidden (Key valid but permission denied)
      // 503: Service Unavailable
      const isRetryable = 
        error.status === 429 || 
        error.status === 403 || 
        error.status === 503 ||
        (error.message && (
          error.message.includes('fetch failed') || 
          error.message.includes('quota') || 
          error.message.includes('API key')
        ));

      if (isRetryable) {
        attempts++;
        // Rotate key index
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(`Switching to API Key index: ${currentKeyIndex}`);
      } else {
        // Fatal error (e.g., invalid prompt format), do not retry
        throw error;
      }
    }
  }

  throw lastError || new Error("All API keys failed. Please check your quota or billing.");
}

// --- PUBLIC METHODS ---

/**
 * Analyzes the user's question and selects the most appropriate Tarot spread.
 */
export const selectBestSpread = async (
  question: string, 
  availableSpreads: Spread[],
  config?: AIConfig
): Promise<string> => {
  const spreadOptions = availableSpreads.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const prompt = `
    You are a Master Tarot Reader. 
    User Question: "${question}"
    
    Available Spreads:
    ${JSON.stringify(spreadOptions, null, 2)}
    
    Task: Analyze the user's question and determine the single most appropriate spread ID from the list above.
    - For simple Yes/No or daily questions, choose 1 card.
    - For choices between two things, choose 2 cards.
    - For general life analysis or time-based queries, choose 3 cards.
    - For complex life path, career, or deep psychological questions, choose 5, 7 or 10 cards.
    - For comprehensive yearly or total life overview, choose 12 cards.
    
    Return ONLY the JSON with the selected spreadId.
  `;

  try {
    return await executeWithRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: config?.model || "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spreadId: { type: Type.STRING },
              reasoning: { type: Type.STRING, description: "Short explanation why this spread was chosen" }
            }
          }
        }
      });
      
      const result = JSON.parse(response.text || "{}");
      return result.spreadId || "three_card_classic";
    });
  } catch (e) {
    console.warn("AI Spread Selection failed, defaulting to 3-card.", e);
    return "three_card_classic";
  }
};

/**
 * Generates the interpretation of the drawn cards.
 */
export const getTarotReading = async (
  question: string,
  spread: Spread,
  cards: DrawnCard[],
  config?: AIConfig
): Promise<string> => {
  let cardDescription = "";
  cards.forEach((card, idx) => {
    const position = spread.positions[idx];
    const orientation = card.isReversed ? "Перевернутая" : "Прямая";
    cardDescription += `${idx + 1}. Позиция: "${position.name}" (${position.description}).\n   Карта: ${card.nameRu} (${orientation}).\n   Значение: ${card.description}\n\n`;
  });

  const prompt = `
    КОНТЕКСТ СЕАНСА:
    Запрос кверента: "${question}"
    Выбранный расклад: "${spread.name}" - ${spread.description}
    
    КАРТЫ НА СТОЛЕ:
    ${cardDescription}

    ИНСТРУКЦИЯ ПО ИНТЕРПРЕТАЦИИ (ЗАДАЧА):
    Дай глубокую, связную и эмпатичную интерпретацию, исходя из своей философии.
    1. Начни с философского вступления, связывающего вопрос с "танцем перемен" и текущим моментом.
    2. Пройдись по ключевым позициям расклада, связывая карты друг с другом в единое полотно судьбы.
    3. Не используй сухой язык справочников. Твоя речь течет плавно, как время.
    4. Если карта перевернута, интерпретируй это как внутреннее сопротивление танцу жизни или скрытый потенциал.
    5. Используй Markdown для оформления (**Жирный** для названий карт, Заголовки для структуры).
    6. В конце дай "Совет Мудреца" - напутствие в духе твоей философии.

    Тон: Возвышенный, философский, немного загадочный, но теплый и принимающий.
    Язык: Русский.
  `;

  // Combine system prompt (custom or default) with the context
  const systemInstruction = config?.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  // We remove the try/catch block here to let the error propagate to the UI
  return await executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: config?.model || "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: config?.temperature ?? 1.1, 
        systemInstruction: systemInstruction
      }
    });

    return response.text || "Туман скрывает будущее... Попробуйте еще раз.";
  });
};