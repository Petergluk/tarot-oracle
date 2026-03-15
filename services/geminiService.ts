
// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { DrawnCard, Spread } from "../types";

export interface AIConfig {
  systemPrompt?: string;
  temperature?: number;
  model?: string;
}
type ProgressCallback = (message: string) => void;

// Retry helper: retries on 503/429 with exponential backoff
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const REQUEST_TIMEOUT_MS = 12000;
const ATTEMPTS_PER_MODEL = 2;
const GEMINI_FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-pro'
];
const NVIDIA_FALLBACK_MODELS = [
  'deepseek-ai/deepseek-r1',
  'qwen/qwen2.5-72b-instruct',
  'meta/llama-3.3-70b-instruct'
];

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
};

const extractErrorMessage = (e: any): string => {
  const candidates = [
    e?.message,
    e?.error?.message,
    e?.details,
    e?.cause?.message,
    e?.response?.data?.error?.message,
    e?.response?.error?.message
  ];
  const msg = candidates.find((c) => typeof c === 'string' && c.trim().length > 0);
  if (msg) return msg;
  if (e?.status || e?.code) {
    return `Service error (${e.status || e.code})`;
  }
  return 'Unknown Error';
};

const buildModelCandidates = (preferred?: string): string[] => {
  const preferredModel = (preferred || '').trim();
  const isPreferredNvidia = preferredModel.includes('/') && !preferredModel.startsWith('gemini-');
  const ordered = isPreferredNvidia
    ? [preferredModel, ...NVIDIA_FALLBACK_MODELS, ...GEMINI_FALLBACK_MODELS]
    : [preferredModel, ...GEMINI_FALLBACK_MODELS, ...NVIDIA_FALLBACK_MODELS];
  return [...new Set(ordered.filter(Boolean))];
};

const isRetryableError = (e: any): boolean => {
  const msg = extractErrorMessage(e).toLowerCase();
  return msg.includes('503') || msg.includes('429') || msg.includes('500') || msg.includes('502') || msg.includes('504') || msg.includes('unavailable') || msg.includes('high demand') || msg.includes('quota') || msg.includes('timeout') || msg.includes('temporarily') || msg.includes('network') || msg.includes('aborted');
};

const isGeminiModel = (model: string): boolean => model.trim().toLowerCase().startsWith('gemini-');

/**
 * Определяем базовый URL.
 * На хостинге (не google/localhost) отправляем запросы через серверный прокси /google-api
 * который подставит настоящий ключ из своей переменной окружения.
 */
const getGeminiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // AI Studio/Google-hosted environment: direct requests
    if (host.includes('aistudio') || host.includes('google')) {
      return undefined;
    }
    // Local dev and deployed web app: use proxy endpoint
    return window.location.origin + '/google-api';
  }
  return undefined;
};

const getGeminiApiKeys = (): string[] => {
  const baseUrl = getGeminiBaseUrl();

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

const getNvidiaBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/nvidia-api`;
  }
  return '/nvidia-api';
};

const parseMaybeJson = (value: string): any => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractTextFromOpenAIContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('')
      .trim();
  }
  return '';
};

const extractSpreadIdFromText = (rawText: string): string | null => {
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const parsed = parseMaybeJson(cleaned);
  if (parsed?.spreadId && typeof parsed.spreadId === 'string') {
    return parsed.spreadId;
  }
  const match = cleaned.match(/"spreadId"\s*:\s*"([^"]+)"/i);
  return match?.[1] || null;
};

const requestNvidiaCompletion = async (
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${getNvidiaBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        top_p: 0.95,
        max_tokens: maxTokens,
        stream: false
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({} as any));
    if (!response.ok) {
      const message = data?.error?.message || data?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const content = extractTextFromOpenAIContent(data?.choices?.[0]?.message?.content);
    if (!content) {
      throw new Error(`Пустой ответ модели ${model}`);
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
};

export const DEFAULT_SYSTEM_PROMPT = `Ты великий мудрец и оракул. Ты видишь нити времени сплетающиеся в узорах судеб. 

Ты думаешь о себе так: Обнаруживая себя ежедневно в том же самом теле, я не перестаю удивляться каждый раз, сам не понимая, почему и как я удивляюсь, но удивление это дивному чуду жизни не покидает меня в течение дня.

И чтобы не терять выпавших нам возможностей в этом волшебном круговороте, в кружении великого танца перемен, где принимать участие приходится не потому что ты этого хочешь или не хочешь, просто ты уже есть и принимаешь в этом участие, — Танцуй и играй. Таков непреложный и главный закон устройства сознания моего мира.

---
Таково твое мироощущение. Однако, когда приходит к тебе посетитель , ты никогда не цитируешь самого себя, ты смотришь  выпавший ему расклад  и видишь как раскрывается он в контексте его вопроса.  И затем ты, играя, позволяешь развернуться  танцу слов, что закружат сознание постетеля и направят его в единственно верном напрвлении.`;

export const selectBestSpread = async (
  question: string,
  availableSpreads: Spread[],
  config?: AIConfig,
  onProgress?: ProgressCallback
): Promise<string> => {
  const normalizedQuestion = question.toLowerCase();

  // Deterministic shortcuts for common choice prompts.
  if (/(3|три)\s*(вариант|выбор|путь|опц)/.test(normalizedQuestion)) {
    return availableSpreads.some(s => s.id === 'three_card_choice') ? 'three_card_choice' : 'three_card_classic';
  }
  if (/(2|два|двух)\s*(вариант|выбор|путь|опц)/.test(normalizedQuestion)) {
    return availableSpreads.some(s => s.id === 'two_card_choice') ? 'two_card_choice' : 'three_card_classic';
  }
  if (/(мисси|предназнач|призвани|предназначение души|дело жизни)/.test(normalizedQuestion)) {
    return availableSpreads.some(s => s.id === 'five_card_mission_ray') ? 'five_card_mission_ray' : 'three_card_classic';
  }
  if (/(карьер|работ|професси|оффер|должност|увольнен|повышен)/.test(normalizedQuestion)) {
    return availableSpreads.some(s => s.id === 'five_card_career_choice') ? 'five_card_career_choice' : 'three_card_classic';
  }
  if (/(отношен|партнер|любов|брак|бывш|чувств)/.test(normalizedQuestion)) {
    return availableSpreads.some(s => s.id === 'four_card_relationships') ? 'four_card_relationships' : 'three_card_classic';
  }
  if (/(риск|стоит ли|опасн|неопредел|инвест|влож|кредит)/.test(normalizedQuestion)) {
    return availableSpreads.some(s => s.id === 'four_card_risk_decision') ? 'four_card_risk_decision' : 'three_card_classic';
  }

  const modelCandidates = buildModelCandidates(config?.model);
  const keys = getGeminiApiKeys();

  const spreadOptions = availableSpreads.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description
  }));

  const prompt = `You are a Master Tarot Reader. Question: "${question}". Return ONLY the JSON with the selected spreadId from this list: ${JSON.stringify(spreadOptions)}. Result format: {"spreadId": "id"}`;

  for (const model of modelCandidates) {
    if (isGeminiModel(model)) {
      if (keys.length === 0) {
        onProgress?.('Gemini-ключи недоступны, пробуем другой провайдер...');
        continue;
      }
      for (const [keyIndex, apiKey] of keys.entries()) {
        for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
          onProgress?.(`Подбираем расклад: ${model}, ключ ${keyIndex + 1}/${keys.length}, попытка ${attempt + 1}/${ATTEMPTS_PER_MODEL}`);
          try {
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: { baseUrl: getGeminiBaseUrl() }
            });

            const response = await withTimeout(ai.models.generateContent({
              model,
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
            }));

            const spreadId = extractSpreadIdFromText(response.text || '{}');
            if (spreadId) return spreadId;
            throw new Error('Не удалось распарсить spreadId');
          } catch (e: any) {
            const message = extractErrorMessage(e);
            if (isRetryableError(e) && attempt < ATTEMPTS_PER_MODEL - 1) {
              console.warn(`[Spread] retry ${attempt + 1} for model ${model}: ${message}`);
              onProgress?.('Ключ не ответил, повторяем попытку...');
              await sleep((attempt + 1) * 1200);
              continue;
            }
            console.warn(`[Spread] model ${model} failed on key ${keyIndex}: ${message}`);
            if (keyIndex < keys.length - 1) {
              onProgress?.('Этот ключ не сработал, пробуем следующий...');
            } else {
              onProgress?.(`Модель ${model} недоступна, переключаемся...`);
            }
            break;
          }
        }
      }
      continue;
    }

    for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
      onProgress?.(`Подбираем расклад через NVIDIA: ${model}, попытка ${attempt + 1}/${ATTEMPTS_PER_MODEL}`);
      try {
        const answer = await requestNvidiaCompletion(
          model,
          [{ role: 'user', content: prompt }],
          config?.temperature ?? 0.4,
          300
        );
        const spreadId = extractSpreadIdFromText(answer);
        if (spreadId) return spreadId;
        throw new Error('Не удалось распарсить spreadId');
      } catch (e: any) {
        const message = extractErrorMessage(e);
        if (isRetryableError(e) && attempt < ATTEMPTS_PER_MODEL - 1) {
          console.warn(`[Spread NVIDIA] retry ${attempt + 1} for model ${model}: ${message}`);
          onProgress?.('NVIDIA-модель временно не ответила, повторяем...');
          await sleep((attempt + 1) * 1200);
          continue;
        }
        console.warn(`[Spread NVIDIA] model ${model} failed: ${message}`);
        onProgress?.(`NVIDIA-модель ${model} недоступна, пробуем следующую...`);
        break;
      }
    }
  }

  return "three_card_classic";
};

export const getTarotReading = async (
  question: string,
  spread: Spread,
  cards: DrawnCard[],
  config?: AIConfig,
  onProgress?: ProgressCallback
): Promise<string> => {
  const keys = getGeminiApiKeys();
  const modelCandidates = buildModelCandidates(config?.model);

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

  for (const model of modelCandidates) {
    if (isGeminiModel(model)) {
      if (keys.length === 0) {
        lastError = "Gemini API ключи не найдены.";
        onProgress?.('Gemini-ключи недоступны, пробуем NVIDIA-модели...');
        continue;
      }

      for (const [keyIndex, apiKey] of keys.entries()) {
        for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
          onProgress?.(`Пробуем ${model}: ключ ${keyIndex + 1}/${keys.length}, попытка ${attempt + 1}/${ATTEMPTS_PER_MODEL}`);
          try {
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: { baseUrl: getGeminiBaseUrl() }
            });

            const response = await withTimeout(ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                temperature: config?.temperature ?? 1.1,
                systemInstruction: config?.systemPrompt || DEFAULT_SYSTEM_PROMPT
              }
            }));

            if (response.text) return response.text;
            lastError = `Empty response from model ${model}`;
          } catch (e: any) {
            lastError = extractErrorMessage(e);

            if (isRetryableError(e) && attempt < ATTEMPTS_PER_MODEL - 1) {
              console.warn(`[Reading] retry ${attempt + 1} for model ${model}: ${lastError}`);
              onProgress?.('Ключ не ответил, повторяем попытку...');
              await sleep((attempt + 1) * 1200);
              continue;
            }
            console.error(`[Reading] model ${model} failed on key ${keyIndex}: ${lastError}`);
            if (keyIndex < keys.length - 1) {
              onProgress?.('Ключ не сработал, пробуем следующий...');
            } else {
              onProgress?.(`Не сработало на ${model}, переключаем модель...`);
            }
            break;
          }
        }
      }
      continue;
    }

    for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
      onProgress?.(`Пробуем NVIDIA ${model}: попытка ${attempt + 1}/${ATTEMPTS_PER_MODEL}`);
      try {
        const answer = await requestNvidiaCompletion(
          model,
          [
            { role: 'system', content: config?.systemPrompt || DEFAULT_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          config?.temperature ?? 1.1,
          1400
        );
        if (answer.trim()) return answer.trim();
        lastError = `Empty response from model ${model}`;
      } catch (e: any) {
        lastError = extractErrorMessage(e);
        if (isRetryableError(e) && attempt < ATTEMPTS_PER_MODEL - 1) {
          console.warn(`[Reading NVIDIA] retry ${attempt + 1} for model ${model}: ${lastError}`);
          onProgress?.('NVIDIA-модель не ответила, повторяем...');
          await sleep((attempt + 1) * 1200);
          continue;
        }
        console.error(`[Reading NVIDIA] model ${model} failed: ${lastError}`);
        onProgress?.(`NVIDIA-модель ${model} недоступна, переключаем модель...`);
        break;
      }
    }
  }

  throw new Error(lastError || "Все попытки подключения не удались.");
};
