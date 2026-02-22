
// App.tsx
// v3.8.0 @ 2025-05-21
import React, { useState, useCallback } from 'react';
import { Loader2, Sparkles, RefreshCw, Eye, ChevronDown, Settings, X, AlertCircle, Info, Coffee, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Internal imports
import { AppState, Spread, DrawnCard } from './types';
import { DECK, SPREADS } from './constants';
import { getTarotReading, selectBestSpread, AIConfig, DEFAULT_SYSTEM_PROMPT } from './services/geminiService';
import CardComponent from './components/CardComponent';

type ExtendedAppState = AppState | 'consulting';

const SettingsModal: React.FC<{ config: AIConfig; onConfigChange: (config: AIConfig) => void; onClose: () => void; }> = ({ config, onConfigChange, onClose }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'stats'>('settings');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'stats') {
      setLoadingStats(true);
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoadingStats(false);
        })
        .catch(err => {
          console.error("Failed to load stats:", err);
          setLoadingStats(false);
        });
    }
  }, [activeTab]);

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
                  <span>База данных: {stats.db ? <span className="text-green-500">PostgreSQL</span> : <span className="text-amber-500">In-Memory</span>}</span>
                  <span>Uptime: {stats.uptime}</span>
                </div>
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

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    temperature: 1.1,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview'
  });

  const drawCards = (count: number): DrawnCard[] => {
    const deckCopy = [...DECK].sort(() => Math.random() - 0.5);
    return deckCopy.slice(0, count).map((card, index) => ({
      ...card, positionIndex: index, isReversed: Math.random() > 0.7
    }));
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setAppState('consulting');
    setApiError(null);

    let spread = SPREADS[2];
    try {
      const spreadId = await Promise.race([
        selectBestSpread(question, SPREADS, aiConfig),
        new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 15000))
      ]);
      spread = SPREADS.find(s => s.id === spreadId) || SPREADS[2];
    } catch (err) {
      console.warn("Spread selection issue, fallback to classic.");
    }

    setSelectedSpread(spread);
    setAppState('shuffling');

    setTimeout(() => {
      setDrawnCards(drawCards(spread.cardCount));
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

      const newCount = readingsCount + 1;
      setReadingsCount(newCount);
      localStorage.setItem('oracle_readings_count', newCount.toString());
    } catch (err: any) {
      setApiError(err.message || "Ошибка соединения");
    } finally {
      setIsLoading(false);
    }
  }, [aiConfig]);

  const handleRevealCard = (index: number) => {
    if (index === revealedCount) {
      const newCount = revealedCount + 1;
      setRevealedCount(newCount);

      if (selectedSpread && newCount === selectedSpread.cardCount) {
        setTimeout(() => fetchFinalReading(question, selectedSpread, drawnCards), 800);
      }
    }
  };

  const resetApp = () => {
    setAppState('intro');
    setQuestion('');
    setSelectedSpread(null);
    setRevealedCount(0);
    setReadingText('');
    setApiError(null);
    setIsLoading(false);
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

          {readingsCount > 0 && !dismissedPwaHint && (
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
                <div key={idx} className="flex flex-col items-center gap-4">
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
                    <div className="mt-16 flex flex-col sm:flex-row gap-4">
                      <button onClick={resetApp} className="flex-1 py-5 border border-slate-700 hover:border-amber-500 hover:bg-amber-900/10 text-amber-100 font-serif uppercase tracking-widest transition-all">
                        Задать иной вопрос
                      </button>
                      <a
                        href="https://t.me/tribute/app?startapp=dsA1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-3 py-5 border border-amber-600/30 bg-amber-900/10 hover:bg-amber-800/20 text-amber-500 font-serif uppercase tracking-widest transition-all"
                      >
                        <Coffee className="w-5 h-5 shrink-0" /> Угостить Оракула кофе
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
