
 // services/geminiService.ts
 // v3.1.0 @ 2025-05-21
 /**
  * @description Сервис для взаимодействия с Google Gemini API.
  * @changelog
  * 1. Исправлена инициализация GoogleGenAI (удален baseUrl).
  * 2. Переход на эксклюзивное использование process.env.API_KEY.
  * 3. Обновлены модели на gemini-3-flash-preview.
  */
import { GoogleGenAI, Type } from "@google/genai";
import { DrawnCard, Spread } from "../types";

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

// --- PUBLIC METHODS ---

/**
 * Анализирует вопрос пользователя и выбирает наиболее подходящий расклад Таро.
 */
export const selectBestSpread = async (
  question: string, 
  availableSpreads: Spread[],
  config?: AIConfig
): Promise<string> => {
  // Always create a new instance right before use to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    const response = await ai.models.generateContent({
      model: config?.model || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spreadId: { 
              type: Type.STRING,
              description: "The ID of the chosen spread"
            },
            reasoning: { 
              type: Type.STRING, 
              description: "Short explanation why this spread was chosen" 
            }
          },
          required: ["spreadId"]
        }
      }
    });
    
    const result = JSON.parse(response.text || "{}");
    return result.spreadId || "three_card_classic";
  } catch (e) {
    console.warn("AI Spread Selection failed, defaulting to 3-card.", e);
    return "three_card_classic";
  }
};

/**
 * Генерирует интерпретацию вытянутых карт.
 */
export const getTarotReading = async (
  question: string,
  spread: Spread,
  cards: DrawnCard[],
  config?: AIConfig
): Promise<string> => {
  // Always create a new instance right before use to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  const systemInstruction = config?.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  const response = await ai.models.generateContent({
    model: config?.model || "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: config?.temperature ?? 1.1, 
      systemInstruction: systemInstruction
    }
  });

  return response.text || "Туман скрывает будущее... Попробуйте еще раз.";
};
