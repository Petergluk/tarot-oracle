
// App.tsx
// v3.8.0 @ 2025-05-21
import React, { useState, useCallback, useEffect } from 'react';
import { Loader2, Sparkles, RefreshCw, Eye, ChevronDown, Settings, X, AlertCircle, Info, Coffee, Star, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Internal imports
import { AppState, Spread, DrawnCard, TarotCard, ArcanaType } from './types';
import { DECK, SPREADS } from './constants';
import { getTarotReading, selectBestSpread, AIConfig, DEFAULT_SYSTEM_PROMPT } from './services/geminiService';
import CardComponent from './components/CardComponent';

type ExtendedAppState = AppState | 'consulting';

const LOCAL_STATS_KEYS = {
  startedAt: 'oracle_stats_started_at',
  totalVisitors: 'oracle_stats_total_visitors',
  totalQuestions: 'oracle_stats_total_questions',
  todayDate: 'oracle_stats_today_date',
  todayQuestions: 'oracle_stats_today_questions',
  todayVisitors: 'oracle_stats_today_visitors',
  visitorMarker: 'oracle_stats_visitor_marked'
} as const;

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const toInt = (value: string | null, fallback = 0): number => {
  const num = Number.parseInt(value || '', 10);
  return Number.isFinite(num) ? num : fallback;
};

const ensureLocalStatsInitialized = () => {
  const today = getTodayDate();
  if (!localStorage.getItem(LOCAL_STATS_KEYS.startedAt)) {
    localStorage.setItem(LOCAL_STATS_KEYS.startedAt, new Date().toISOString());
  }
  const storedDate = localStorage.getItem(LOCAL_STATS_KEYS.todayDate);
  if (storedDate !== today) {
    localStorage.setItem(LOCAL_STATS_KEYS.todayDate, today);
    localStorage.setItem(LOCAL_STATS_KEYS.todayQuestions, '0');
    localStorage.setItem(LOCAL_STATS_KEYS.todayVisitors, '0');
  }
};

const ensureLocalVisitorTracked = () => {
  try {
    ensureLocalStatsInitialized();
    if (localStorage.getItem(LOCAL_STATS_KEYS.visitorMarker) === 'true') return;

    const totalVisitors = toInt(localStorage.getItem(LOCAL_STATS_KEYS.totalVisitors));
    const todayVisitors = toInt(localStorage.getItem(LOCAL_STATS_KEYS.todayVisitors));

    localStorage.setItem(LOCAL_STATS_KEYS.totalVisitors, String(totalVisitors + 1));
    localStorage.setItem(LOCAL_STATS_KEYS.todayVisitors, String(todayVisitors + 1));
    localStorage.setItem(LOCAL_STATS_KEYS.visitorMarker, 'true');
  } catch {
    // ignore localStorage errors
  }
};

const recordLocalQuestion = () => {
  try {
    ensureLocalStatsInitialized();
    const totalQuestions = toInt(localStorage.getItem(LOCAL_STATS_KEYS.totalQuestions));
    const todayQuestions = toInt(localStorage.getItem(LOCAL_STATS_KEYS.todayQuestions));
    localStorage.setItem(LOCAL_STATS_KEYS.totalQuestions, String(totalQuestions + 1));
    localStorage.setItem(LOCAL_STATS_KEYS.todayQuestions, String(todayQuestions + 1));
  } catch {
    // ignore localStorage errors
  }
};

const getLocalStatsSnapshot = () => {
  const now = Date.now();
  const startedAtRaw = localStorage.getItem(LOCAL_STATS_KEYS.startedAt) || new Date().toISOString();
  const startedAtMs = Date.parse(startedAtRaw);
  const uptimeSec = Number.isFinite(startedAtMs) ? Math.max(0, Math.round((now - startedAtMs) / 1000)) : 0;

  return {
    startedAt: startedAtRaw,
    totalVisitors: toInt(localStorage.getItem(LOCAL_STATS_KEYS.totalVisitors)),
    uniqueVisitors: toInt(localStorage.getItem(LOCAL_STATS_KEYS.todayVisitors)),
    totalQuestions: toInt(localStorage.getItem(LOCAL_STATS_KEYS.totalQuestions)),
    todayQuestions: toInt(localStorage.getItem(LOCAL_STATS_KEYS.todayQuestions)),
    todayDate: localStorage.getItem(LOCAL_STATS_KEYS.todayDate) || getTodayDate(),
    uptime: `${uptimeSec}s`,
    db: false,
    source: 'local'
  };
};

const shuffleDeck = (cards: TarotCard[]): TarotCard[] => {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const createHiddenSlots = (count: number): DrawnCard[] => {
  const base = DECK[0];
  return Array.from({ length: count }, (_, index) => ({
    ...base,
    id: `hidden_slot_${index}`,
    positionIndex: index,
    isReversed: false
  }));
};

const getCardImagePath = (card: DrawnCard) => {
  const folder = card.arcana === ArcanaType.MAJOR ? 'major' : 'minor';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}cards/${folder}/${card.imageFileName}`;
};

const getOrientationHint = (isReversed: boolean) => {
  if (isReversed) {
    return 'Перевернутая позиция';
  }
  return 'Прямая позиция';
};

const getCardMeaning = (card: DrawnCard) => {
  if (card.isReversed) {
    return card.reversedDescription || 'Перевернутая позиция указывает на внутренний конфликт или задержку проявления энергии карты.';
  }
  return card.description;
};

const trackAnalyticsEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') return;
  const w = window as any;

  if (typeof w.gtag === 'function') {
    w.gtag('event', eventName, params);
  }

  if (typeof w.ym === 'function') {
    w.ym(107710413, 'reachGoal', eventName, params);
  }
};

interface QuestionLogItem {
  id: string | number;
  asked_at: string;
  question_text: string;
}

const SettingsModal: React.FC<{ config: AIConfig; onConfigChange: (config: AIConfig) => void; onClose: () => void; }> = ({ config, onConfigChange, onClose }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'stats' | 'logs'>('settings');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [logs, setLogs] = useState<QuestionLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  React.useEffect(() => {
    if (activeTab === 'stats') {
      setLoadingStats(true);
      fetch('/api/stats', { cache: 'no-store' })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          setStats({ ...getLocalStatsSnapshot(), ...data });
          setLoadingStats(false);
        })
        .catch(() => {
          setStats(getLocalStatsSnapshot());
          setLoadingStats(false);
        });
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== 'logs') return;

    setLoadingLogs(true);
    setLogsError(null);
    fetch('/api/questions?limit=300', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
        setLoadingLogs(false);
      })
      .catch(() => {
        setLogsError('Не удалось загрузить вопросы.');
        setLoadingLogs(false);
      });
  }, [activeTab]);

  const downloadLogs = (format: 'json' | 'txt') => {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const content = format === 'json'
      ? JSON.stringify(logs, null, 2)
      : logs
          .map((item) => `[${new Date(item.asked_at).toLocaleString('ru-RU')}] ${item.question_text}`)
          .join('\n');

    const blob = new Blob([content], { type: format === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oracle-questions-${stamp}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-left">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg p-6 rounded-lg shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-amber-500">
            <Settings className="w-5 h-5" />
            <h2 className="font-serif text-xl tracking-wide">Система</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition"><X className="w-6 h-6" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-6 font-bold uppercase tracking-widest text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 pb-3 text-center transition-colors ${activeTab === 'settings' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Настройки ИИ
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 pb-3 text-center transition-colors ${activeTab === 'stats' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Статистика
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 pb-3 text-center transition-colors ${activeTab === 'logs' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Логи
          </button>
        </div>

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400 tracking-widest font-bold">Модель AI</label>
              <select value={config.model} onChange={(e) => onConfigChange({ ...config, model: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2 text-sm rounded focus:border-amber-500 outline-none">
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-flash-lite-latest">Gemini Flash Lite</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase text-slate-400 tracking-widest font-bold"><span>Температура</span><span className="text-amber-500">{config.temperature}</span></div>
              <input type="range" min="0.1" max="2.0" step="0.1" value={config.temperature} onChange={(e) => onConfigChange({ ...config, temperature: parseFloat(e.target.value) })} className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400 tracking-widest font-bold">Системный промпт</label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => onConfigChange({ ...config, systemPrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-3 text-sm rounded h-48 focus:border-amber-500 outline-none font-sans resize-none"
                placeholder="Инструкции для ИИ..."
              />
            </div>
            <button onClick={onClose} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-widest rounded transition-colors shadow-lg">Сохранить</button>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4 animate-fade-in text-slate-300">
            {loadingStats ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : !stats ? (
              <div className="text-center py-10 text-slate-500 text-sm">Нет данных о статистике</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 border border-slate-800 rounded text-center">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Посетители (Всего)</div>
                  <div className="text-3xl font-serif text-amber-500">{stats.totalVisitors}</div>
                </div>
                <div className="bg-slate-950 p-4 border border-slate-800 rounded text-center">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Вопросы (Всего)</div>
                  <div className="text-3xl font-serif text-amber-500">{stats.totalQuestions}</div>
                </div>
                <div className="bg-slate-950 p-4 border border-slate-800 rounded text-center">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Уники ({stats.todayDate})</div>
                  <div className="text-xl font-serif text-amber-400">{stats.uniqueVisitors}</div>
                </div>
                <div className="bg-slate-950 p-4 border border-slate-800 rounded text-center">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Вопросы ({stats.todayDate})</div>
                  <div className="text-xl font-serif text-amber-400">{stats.todayQuestions}</div>
                </div>

                <div className="col-span-2 mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest flex justify-between">
                  <span>База данных: {stats.db ? <span className="text-green-500">PostgreSQL</span> : <span className="text-amber-500">Local/In-Memory</span>}</span>
                  <span>Uptime: {stats.uptime}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4 animate-fade-in text-slate-300">
            <div className="flex gap-2">
              <button
                onClick={() => downloadLogs('txt')}
                disabled={logs.length === 0}
                className="flex-1 py-2 px-3 text-xs uppercase tracking-widest border border-slate-700 rounded hover:border-amber-500 disabled:opacity-40"
              >
                Скачать TXT
              </button>
              <button
                onClick={() => downloadLogs('json')}
                disabled={logs.length === 0}
                className="flex-1 py-2 px-3 text-xs uppercase tracking-widest border border-slate-700 rounded hover:border-amber-500 disabled:opacity-40"
              >
                Скачать JSON
              </button>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : logsError ? (
              <div className="text-center py-10 text-red-400 text-sm">{logsError}</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Пока нет сохраненных вопросов</div>
            ) : (
              <div className="max-h-[52vh] overflow-y-auto space-y-2 pr-1">
                {logs.map((item) => (
                  <div key={String(item.id)} className="bg-slate-950 border border-slate-800 rounded p-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                      {new Date(item.asked_at).toLocaleString('ru-RU')}
                    </div>
                    <div className="text-sm text-slate-200 leading-relaxed break-words">{item.question_text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-left">
    <div className="bg-slate-900 border border-slate-700 w-full max-w-lg p-6 sm:p-8 rounded-lg shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3 text-amber-500">
          <Info className="w-6 h-6" />
          <h2 className="font-serif text-2xl tracking-wide">Об Оракуле</h2>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1 bg-slate-800/50 rounded-full"><X className="w-5 h-5" /></button>
      </div>

      <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
        <p>
          <strong className="text-amber-200 font-serif text-base">Мистический Оракул</strong> — это веб-приложение, объединяющее древнюю мудрость
          карт Таро с возможностями современных нейросетей (Google Gemini AI).
        </p>

        <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg">
          <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Важно знать
          </h3>
          <p className="text-slate-400 text-xs">
            Трактовки генерируются Искусственным Интеллектом "на лету" на основе ваших вопросов.
            Проект использует личные API-ключи автора, которые имеют жесткие суточные лимиты от Google.
            По этой причине приложение работает <strong>"как есть"</strong>, и его стабильность и доступность не гарантируются.
          </p>
          <p className="text-slate-400 text-xs mt-3 pt-3 border-t border-amber-900/30">
            Эта версия (t-oracle) работает через прокси и доступна без VPN. Если у вас <strong>уже включен VPN</strong>, вы можете использовать <a href="https://tarot-oracle.onrender.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline font-bold transition-colors">статичную версию (tarot-oracle)</a> — она быстрее и не отключается (не засыпает).
          </p>
        </div>

        <p className="text-xs text-slate-500 italic">
          Ваш IP-адрес скрыт от серверов ИИ для обеспечения конфиденциальности. Вопросы обрабатываются анонимно.
        </p>

        <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
          <a
            href="https://pay.cloudtips.ru/p/012f0b15"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#ff8a00]/10 border border-[#ff8a00]/30 hover:bg-[#ff8a00]/20 text-[#ff8a00] font-bold uppercase tracking-widest rounded transition-colors shadow-lg"
          >
            <Coffee className="w-5 h-5" /> Угостить автора кофе (РФ)
          </a>
          <a
            href="https://t.me/tribute/app?startapp=dsA1"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#2AABEE]/10 border border-[#2AABEE]/30 hover:bg-[#2AABEE]/20 text-[#2AABEE] font-bold uppercase tracking-widest rounded transition-colors shadow-lg"
          >
            <Coffee className="w-5 h-5 shrink-0" /> Донат через Telegram (World)
          </a>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [appState, setAppState] = useState<ExtendedAppState>('intro');
  const [question, setQuestion] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<Spread | null>(null);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [readingText, setReadingText] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [footerStats, setFooterStats] = useState<{ totalQuestions: number }>({ totalQuestions: 0 });
  const [readingsCount, setReadingsCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('oracle_readings_count') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [dismissedPwaHint, setDismissedPwaHint] = useState<boolean>(() => {
    return localStorage.getItem('oracle_dismissed_pwa') === 'true';
  });
  const [canShowPwaHint, setCanShowPwaHint] = useState(false);
  const [remainingDeck, setRemainingDeck] = useState<TarotCard[]>([]);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [revealFlashIndex, setRevealFlashIndex] = useState<number | null>(null);

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    temperature: 1.1,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview'
  });

  React.useEffect(() => {
    ensureLocalVisitorTracked();
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const nav = navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      nav.standalone === true;

    const ua = navigator.userAgent || '';
    const isMobileUa = /Android|iPhone|iPad|iPod/i.test(ua);
    const isLikelyTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isMobileDevice = isMobileUa || isLikelyTouchMac;

    setCanShowPwaHint(isMobileDevice && !isStandalone);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const loadFooterStats = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setFooterStats({ totalQuestions: Number(data?.totalQuestions) || 0 });
        }
      } catch {
        const local = getLocalStatsSnapshot();
        if (!cancelled) {
          setFooterStats({ totalQuestions: Number(local?.totalQuestions) || 0 });
        }
      }
    };

    loadFooterStats();
    const intervalId = window.setInterval(loadFooterStats, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const normalizedQuestion = question.trim();

    setAppState('consulting');
    setApiError(null);

    trackAnalyticsEvent('question_submitted', {
      question_length: normalizedQuestion.length,
    });

    fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: normalizedQuestion })
    }).catch(() => {
      // Silent fail: reading flow should not break on logging issue.
    });

    let spread = SPREADS[2];
    try {
      const spreadId = await Promise.race([
        selectBestSpread(normalizedQuestion, SPREADS, aiConfig),
        new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 15000))
      ]);
      spread = SPREADS.find(s => s.id === spreadId) || SPREADS[2];
    } catch (err) {
      console.warn("Spread selection issue, fallback to classic.");
    }

    setSelectedSpread(spread);
    setAppState('shuffling');

    setTimeout(() => {
      const shuffledDeck = shuffleDeck(DECK);
      setRemainingDeck(shuffledDeck);
      setDrawnCards(createHiddenSlots(spread.cardCount));
      setRevealedCount(0);
      setReadingText('');
      setAppState('revealing');
    }, 2000);
  };

  const fetchFinalReading = useCallback(async (currentQuestion: string, currentSpread: Spread, cards: DrawnCard[]) => {
    setIsLoading(true);
    setAppState('reading');
    setApiError(null);

    try {
      const text = await getTarotReading(currentQuestion, currentSpread, cards, aiConfig);
      setReadingText(text || "Оракул промолчал...");

      setReadingsCount(prev => {
        const next = prev + 1;
        localStorage.setItem('oracle_readings_count', next.toString());
        return next;
      });
      recordLocalQuestion();
      setFooterStats(prev => ({ totalQuestions: prev.totalQuestions + 1 }));

      trackAnalyticsEvent('reading_generated', {
        spread_id: currentSpread.id,
        cards_count: cards.length,
      });
    } catch (err: any) {
      setApiError(err.message || "Ошибка соединения");

      trackAnalyticsEvent('reading_error', {
        spread_id: currentSpread.id,
        error_message: String(err?.message || 'unknown_error').slice(0, 200)
      });
    } finally {
      setIsLoading(false);
    }
  }, [aiConfig]);

  const handleRevealCard = (index: number) => {
    if (index < revealedCount) {
      setGalleryIndex(index);
      return;
    }
    if (index !== revealedCount || !selectedSpread || appState !== 'revealing') return;
    if (remainingDeck.length === 0) return;

    const nextDeck = [...remainingDeck];
    const randomDeckIndex = Math.floor(Math.random() * nextDeck.length);
    const pickedCard = nextDeck.splice(randomDeckIndex, 1)[0];

    const revealedCard: DrawnCard = {
      ...pickedCard,
      positionIndex: index,
      isReversed: Math.random() > 0.7
    };

    const nextCount = revealedCount + 1;
    const updatedCards = [...drawnCards];
    updatedCards[index] = revealedCard;

    setDrawnCards(updatedCards);
    setRemainingDeck(nextDeck);
    setRevealedCount(nextCount);
    setRevealFlashIndex(index);

    if (nextCount === selectedSpread.cardCount) {
      setTimeout(() => fetchFinalReading(question, selectedSpread, updatedCards), 800);
    }
  };

  const retryLastReading = () => {
    if (!selectedSpread) return;
    if (revealedCount !== selectedSpread.cardCount) return;
    fetchFinalReading(question, selectedSpread, drawnCards);
  };

  const copyReadingWithCards = async () => {
    const cardsText = drawnCards
      .slice(0, revealedCount)
      .map((card, idx) => {
        const position = selectedSpread?.positions[idx]?.name || `Позиция ${idx + 1}`;
        const orientation = card.isReversed ? 'перевернутая' : 'прямая';
        return `${idx + 1}. ${position}: ${card.nameRu} (${orientation})`;
      })
      .join('\n');

    const payload = [
      `Вопрос: ${question}`,
      `Расклад: ${selectedSpread?.name || '—'}`,
      '',
      'Выпавшие карты:',
      cardsText || '—',
      '',
      'Ответ Оракула:',
      readingText || '—'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
      setCopyStatus('ok');
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = payload;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopyStatus('ok');
      } catch {
        setCopyStatus('error');
      }
    }

    setTimeout(() => setCopyStatus('idle'), 1800);
  };

  useEffect(() => {
    if (revealFlashIndex === null) return;
    const timer = setTimeout(() => setRevealFlashIndex(null), 450);
    return () => clearTimeout(timer);
  }, [revealFlashIndex]);

  const closeGallery = () => setGalleryIndex(null);

  const showPrevCard = () => {
    if (galleryIndex === null || revealedCount === 0) return;
    setGalleryIndex((galleryIndex - 1 + revealedCount) % revealedCount);
  };

  const showNextCard = () => {
    if (galleryIndex === null || revealedCount === 0) return;
    setGalleryIndex((galleryIndex + 1) % revealedCount);
  };

  useEffect(() => {
    if (galleryIndex === null) return;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGallery();
      if (event.key === 'ArrowLeft') showPrevCard();
      if (event.key === 'ArrowRight') showNextCard();
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [galleryIndex, revealedCount]);

  const resetApp = () => {
    setAppState('intro');
    setQuestion('');
    setSelectedSpread(null);
    setRemainingDeck([]);
    setDrawnCards([]);
    setRevealedCount(0);
    setReadingText('');
    setApiError(null);
    setIsLoading(false);
    setGalleryIndex(null);
    setRevealFlashIndex(null);
  };

  return (
    <main className="bg-slate-900 min-h-screen text-slate-200 font-sans relative overflow-x-hidden selection:bg-amber-500/30">
      <div className="fixed top-0 left-0 w-16 h-16 z-[60] cursor-default" onClick={() => setSecretClickCount(p => (p + 1 > 4 ? (setShowSettings(true), 0) : p + 1))} />

      {/* Top right info button */}
      <div className="fixed top-4 right-4 z-[60]">
        <button
          onClick={() => setShowInfo(true)}
          className="p-2 text-amber-500/60 hover:text-amber-400 bg-slate-900/80 hover:bg-slate-800 rounded-full backdrop-blur transition-all border border-slate-700/50 hover:border-amber-500/50 shadow-lg"
          title="Справка"
        >
          <Info className="w-6 h-6" />
        </button>
      </div>

      {showSettings && <SettingsModal config={aiConfig} onConfigChange={setAiConfig} onClose={() => setShowSettings(false)} />}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      {galleryIndex !== null && drawnCards[galleryIndex] && galleryIndex < revealedCount && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white"
            title="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>

          {revealedCount > 1 && (
            <button
              onClick={showPrevCard}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white"
              title="Предыдущая карта"
            >
              ←
            </button>
          )}

          <div className="max-w-4xl w-full flex flex-col items-center gap-4">
            <img
              src={getCardImagePath(drawnCards[galleryIndex])}
              alt={drawnCards[galleryIndex].nameRu}
              className={`max-h-[75vh] w-auto max-w-full object-contain rounded-xl border-4 border-slate-700 shadow-2xl ${drawnCards[galleryIndex].isReversed ? 'rotate-180' : ''}`}
            />
            <div className="text-center">
              <p className="text-amber-500 uppercase tracking-widest text-xs mb-1">
                {galleryIndex + 1}. {selectedSpread?.positions[galleryIndex]?.name}
              </p>
              <p className="text-slate-100 text-lg font-serif">
                {drawnCards[galleryIndex].nameRu}
                {drawnCards[galleryIndex].isReversed ? ' (Перевернутая)' : ''}
              </p>
              <p className="text-slate-300 text-sm mt-3 max-w-2xl">
                {getCardMeaning(drawnCards[galleryIndex])}
              </p>
              <p className="text-slate-400 text-xs mt-2 max-w-2xl">
                {getOrientationHint(drawnCards[galleryIndex].isReversed)}
              </p>
            </div>
          </div>

          {revealedCount > 1 && (
            <button
              onClick={showNextCard}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white"
              title="Следующая карта"
            >
              →
            </button>
          )}
        </div>
      )}

      {appState === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 animate-fade-in relative pb-32">
          <Sparkles className="w-16 h-16 text-amber-200 mb-8 animate-pulse" />
          <h1 className="text-4xl sm:text-7xl font-bold text-amber-100 mb-8 font-serif tracking-widest uppercase px-4 max-w-full leading-tight flex flex-col sm:flex-row items-center gap-0 sm:gap-4">
            <span className="whitespace-nowrap">Мистический</span>
            <span className="whitespace-nowrap">Оракул</span>
          </h1>
          <button onClick={() => setAppState('input')} className="px-12 py-5 border border-amber-500/50 hover:bg-amber-900/30 text-amber-100 font-serif text-xl tracking-widest transition-all uppercase">
            Просить совета
          </button>

          {readingsCount > 0 && !dismissedPwaHint && canShowPwaHint && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md animate-slide-up group">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-amber-100/80 backdrop-blur-md shadow-2xl flex items-start gap-4 text-left relative pr-10">
                <button
                  onClick={() => {
                    setDismissedPwaHint(true);
                    localStorage.setItem('oracle_dismissed_pwa', 'true');
                  }}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="bg-amber-500/20 p-2 sm:p-2.5 rounded-full shrink-0">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <div className="leading-relaxed">
                  <strong className="text-amber-500 block mb-1 uppercase tracking-widest font-bold text-[10px] sm:text-[11px]">Совет Оракула</strong>
                  Добавьте Оракула <strong>на экран «Домой»</strong>, чтобы обращаться к нему в один клик! Нажмите «Поделиться» или меню (в виде трех точек) в браузере и выберите «На экран Домой» / «Добавить ярлык». Приложение откроется в удобном <strong>полноэкранном режиме</strong>, работая как нативное приложение без лишних рамок браузера!
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {appState === 'input' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in text-center">
          <h2 className="text-2xl sm:text-3xl font-serif text-amber-100 mb-12 px-4">Что желаете узнать у Вселенной?</h2>
          <form onSubmit={handleQuestionSubmit} className="w-full max-w-2xl">
            <textarea
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-700 focus:border-amber-500 text-center py-4 text-white outline-none font-serif text-2xl sm:text-4xl transition-colors placeholder:text-slate-800"
              rows={2}
              placeholder="Ваш вопрос..."
            />
            <button type="submit" disabled={!question.trim()} className="mt-16 px-12 py-4 bg-amber-700 hover:bg-amber-600 disabled:opacity-20 text-slate-950 font-bold uppercase tracking-widest rounded-full transition-all shadow-xl">
              Спросить Оракула
            </button>
          </form>
        </div>
      )}

      {appState === 'consulting' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fade-in">
          <Eye className="w-16 h-16 text-amber-500 animate-pulse mb-4" />
          <h3 className="text-xl font-serif text-amber-100 tracking-widest uppercase px-4">Оракул выбирает расклад...</h3>
        </div>
      )}

      {appState === 'shuffling' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fade-in p-6">
          <h2 className="text-3xl sm:text-4xl font-serif text-amber-100 mb-4 uppercase tracking-tighter">{selectedSpread?.name}</h2>
          <p className="text-slate-400 italic mb-16 max-w-md px-4 text-sm sm:text-base">{selectedSpread?.description}</p>
          <div className="w-28 h-40 sm:w-32 sm:h-48 border-2 border-amber-500/30 bg-slate-800 rounded-xl flex items-center justify-center animate-bounce shadow-2xl">
            <RefreshCw className="text-amber-500 w-10 h-10 animate-spin" />
          </div>
          <p className="mt-10 text-amber-200/50 font-serif tracking-[0.3em] uppercase text-xs sm:text-sm">Тасуем колоду...</p>
        </div>
      )}

      {(appState === 'revealing' || appState === 'reading') && (
        <div className="flex flex-col min-h-screen bg-slate-950">
          <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-950/80 border-b border-white/5 p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3 cursor-pointer overflow-hidden max-w-[70%]" onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}>
              <ChevronDown className={`text-amber-500 shrink-0 transition-transform ${isQuestionExpanded ? 'rotate-180' : ''}`} />
              <span className="text-amber-100 font-serif truncate text-xs sm:text-sm">{question}</span>
            </div>
            {/* Added margin-right to prevent overlap with the global Info button on the right */}
            <button onClick={resetApp} className="mr-14 p-2 text-slate-500 hover:text-white transition-colors shrink-0 bg-slate-900/50 hover:bg-slate-800 rounded-full"><RefreshCw className="w-5 h-5" /></button>
          </header>

          <div className="flex-1 p-4 sm:p-6 flex flex-col items-center pb-24">
            <h3 className="text-xl sm:text-2xl font-serif text-amber-500 mb-8 sm:mb-12 uppercase tracking-widest text-center">{selectedSpread?.name}</h3>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-12 mb-16">
              {drawnCards.map((card, idx) => (
                <div key={idx} className={`flex flex-col items-center gap-4 transition-all duration-300 ${revealFlashIndex === idx ? 'scale-105 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]' : ''}`}>
                  <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-widest ${revealedCount > idx ? 'text-amber-500' : 'text-slate-700'}`}>
                    {idx + 1}. {selectedSpread?.positions[idx].name}
                  </span>
                  <CardComponent card={card} isRevealed={revealedCount > idx} onClick={() => handleRevealCard(idx)} />
                </div>
              ))}
            </div>

            {revealedCount < (selectedSpread?.cardCount || 0) ? (
              <div className="text-center animate-bounce">
                <p className="text-amber-200 font-serif text-lg sm:text-xl tracking-wide">Откройте карту #{revealedCount + 1}</p>
              </div>
            ) : (
              <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800 p-6 sm:p-16 rounded-xl shadow-2xl animate-slide-up backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-8 sm:mb-10 border-b border-slate-800 pb-6">
                  <Sparkles className="text-amber-500 w-6 h-6 sm:w-8 sm:h-8" />
                  <h2 className="text-2xl sm:text-5xl font-serif text-amber-100">Голос Оракула</h2>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center gap-6 py-12">
                    <Loader2 className="animate-spin text-amber-500 w-12 h-12" />
                    <span className="font-serif text-amber-200/60 tracking-widest uppercase animate-pulse text-sm">Трактовка знаков...</span>
                  </div>
                ) : apiError ? (
                  <div className="bg-red-950/30 border border-red-900/50 p-6 rounded-lg text-red-200">
                    <div className="flex items-center gap-3 mb-4 text-red-400 font-bold uppercase tracking-widest text-sm">
                      <AlertCircle className="w-5 h-5" />
                      Связь прервана
                    </div>

                    {apiError?.toLowerCase().includes('429') || apiError?.toLowerCase().includes('quota') || apiError?.toLowerCase().includes('все попытки') ? (
                      <>
                        <p className="mb-4 font-serif text-lg text-red-100 text-left leading-relaxed">
                          Сегодня Оракул ответил на множество вопросов, и <strong>лимит API исчерпан. Мудрецу тоже надо спать...</strong>
                        </p>
                        <p className="mb-6 text-sm text-red-200/90 text-left bg-red-900/20 p-4 rounded border border-red-900/40">
                          Вы можете поддержать мотивацию автора развивать приложение (и оплачивать серверы без лимитов), угостив Оракула кофе! ☕️
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                          <a
                            href="https://pay.cloudtips.ru/p/012f0b15"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#ff8a00]/10 border border-[#ff8a00]/30 hover:bg-[#ff8a00]/20 text-[#ff8a00] font-bold uppercase tracking-widest text-xs rounded transition-colors"
                          >
                            <Coffee className="w-4 h-4" /> CloudTips (РФ)
                          </a>
                          <a
                            href="https://t.me/tribute/app?startapp=dsA1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#2AABEE]/10 border border-[#2AABEE]/30 hover:bg-[#2AABEE]/20 text-[#2AABEE] font-bold uppercase tracking-widest text-xs rounded transition-colors"
                          >
                            <Coffee className="w-4 h-4" /> Донат через Telegram (World)
                          </a>
                        </div>
                      </>
                    ) : apiError?.toLowerCase().includes('location') || apiError?.toLowerCase().includes('supported') ? (
                      <>
                        <p className="mb-4 font-serif text-lg text-red-100 text-left leading-relaxed">
                          Ваше местоположение скрыто <strong>Серым Туманом</strong> (блокировка сервисов Google в вашем регионе).
                        </p>
                        <p className="mb-4 text-sm text-red-200/90 text-left bg-red-900/20 p-4 rounded border border-red-900/40">
                          Пожалуйста, <strong>включите VPN</strong> (например, Нидерланды, Германия или любая другая страна Европы), чтобы Оракул смог с вами связаться, и попробуйте снова.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mb-4 font-serif text-lg text-red-100 text-left leading-relaxed">
                          Связь с тонкими мирами прервалась...
                        </p>
                        <p className="mb-4 text-sm text-red-200/60 text-left">
                          (Произошла техническая ошибка. Возможно, сервер временно недоступен или обновляется).
                        </p>
                      </>
                    )}

                    <div className="bg-black/40 p-3 rounded font-mono text-[10px] text-red-500/70 break-all border border-red-900/20 text-left cursor-text select-text mt-4">
                      {apiError}
                    </div>
                    <button
                      onClick={retryLastReading}
                      className="mt-4 w-full py-4 bg-amber-900/20 border border-amber-800/50 hover:bg-amber-900/40 transition text-amber-100 uppercase tracking-widest text-xs font-bold rounded"
                    >
                      Повторить запрос
                    </button>
                    <button onClick={resetApp} className="mt-8 w-full py-4 bg-red-900/20 border border-red-900/40 hover:bg-red-900/40 transition text-red-100 uppercase tracking-widest text-xs font-bold rounded">
                      Вернуться на главную
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-200 leading-relaxed font-light text-left">
                    <ReactMarkdown components={{
                      h1: (props) => <h1 className="text-2xl sm:text-4xl font-serif text-amber-500 mb-8 mt-12 border-b border-amber-500/20 pb-2 uppercase" {...props} />,
                      h2: (props) => <h2 className="text-xl sm:text-3xl font-serif text-amber-200 mb-6 mt-10" {...props} />,
                      h3: (props) => <h3 className="text-lg sm:text-2xl font-serif text-amber-100 mb-4 mt-8" {...props} />,
                      strong: (props) => <strong className="text-amber-400 font-bold" {...props} />,
                      p: (props) => <p className="mb-6 text-base sm:text-xl leading-relaxed" {...props} />,
                      blockquote: (props) => <blockquote className="border-l-4 border-amber-600/50 pl-4 sm:pl-6 italic text-slate-400 my-8 py-4 bg-amber-900/5 rounded-r-lg" {...props} />,
                    }}>
                      {readingText}
                    </ReactMarkdown>
                    <div className="mt-16">
                      <div className="flex justify-center mb-6">
                        <button
                          onClick={copyReadingWithCards}
                          className="w-14 h-14 rounded-full flex items-center justify-center border border-emerald-700/60 hover:border-emerald-500 hover:bg-emerald-900/10 text-emerald-200 transition-all"
                          title={copyStatus === 'ok' ? 'Скопировано' : copyStatus === 'error' ? 'Ошибка копирования' : 'Копировать ответ'}
                          aria-label={copyStatus === 'ok' ? 'Скопировано' : copyStatus === 'error' ? 'Ошибка копирования' : 'Копировать ответ'}
                        >
                          {copyStatus === 'ok' ? (
                            <Check className="w-5 h-5" />
                          ) : copyStatus === 'error' ? (
                            <AlertCircle className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={resetApp} className="w-full sm:flex-1 py-5 border border-slate-700 hover:border-amber-500 hover:bg-amber-900/10 text-amber-100 font-serif uppercase tracking-widest transition-all whitespace-nowrap">
                          Задать новый вопрос
                        </button>
                        <a
                          href="https://t.me/tribute/app?startapp=dsA1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:flex-1 flex items-center justify-center gap-3 py-5 border border-amber-600/30 bg-amber-900/10 hover:bg-amber-800/20 text-amber-500 font-serif uppercase tracking-widest transition-all whitespace-nowrap"
                        >
                          <Coffee className="w-5 h-5 shrink-0" /> Угостить Оракула кофе
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 backdrop-blur px-4 py-3 text-[11px] sm:text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
          <span>
            Оракул ответил на <span className="text-amber-400 font-semibold">{footerStats.totalQuestions}</span> вопросов
          </span>
          <span className="text-slate-600">|</span>
          <a
            href="https://www.danzasemantica.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-300 transition-colors"
          >
            (c) 2025 Petergluk
          </a>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => setShowInfo(true)}
            className="hover:text-amber-300 transition-colors"
          >
            О проекте
          </button>
        </div>
      </footer>
    </main>
  );
};

export default App;
