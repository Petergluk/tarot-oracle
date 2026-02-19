
// App.tsx
// v3.8.0 @ 2025-05-21
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Loader2, Sparkles, RefreshCw, Eye, ChevronDown, Settings, X, AlertCircle, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Internal imports
import { AppState, Spread, DrawnCard } from './types';
import { DECK, SPREADS } from './constants';
import { getTarotReading, selectBestSpread, AIConfig, DEFAULT_SYSTEM_PROMPT } from './services/geminiService';
import CardComponent from './components/CardComponent';

type ExtendedAppState = AppState | 'consulting';


type DebugProbeResult = {
  label: string;
  url: string;
  ok: boolean;
  status: number | string;
  contentType?: string | null;
  looksLikeImage?: boolean;
};

type RuntimeDebugInfo = {
  loaded: boolean;
  cardsStatusHttpCode: number | null;
  cardsStatusPayload: unknown;
  probes: DebugProbeResult[];
};

type ImageErrorEventPayload = {
  cardId: string;
  imageFileName: string;
  attemptedSrc: string;
  imageCandidates: string[];
  willRetryWith: string | null;
};

const SettingsModal: React.FC<{ config: AIConfig; onConfigChange: (config: AIConfig) => void; onClose: () => void; }> = ({ config, onConfigChange, onClose }) => (
  <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-left">
    <div className="bg-slate-900 border border-slate-700 w-full max-w-lg p-6 rounded-lg shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-amber-500">
          <Settings className="w-5 h-5" />
          <h2 className="font-serif text-xl tracking-wide">Настройки Оракула</h2>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition"><X className="w-6 h-6" /></button>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-400 tracking-widest font-bold">Модель AI</label>
          <select value={config.model} onChange={(e) => onConfigChange({...config, model: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2 text-sm rounded focus:border-amber-500 outline-none">
            <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
            <option value="gemini-flash-lite-latest">Gemini Flash Lite</option>
            <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
          </select>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs uppercase text-slate-400 tracking-widest font-bold"><span>Температура</span><span className="text-amber-500">{config.temperature}</span></div>
          <input type="range" min="0.1" max="2.0" step="0.1" value={config.temperature} onChange={(e) => onConfigChange({...config, temperature: parseFloat(e.target.value)})} className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-400 tracking-widest font-bold">Системный промпт</label>
          <textarea 
            value={config.systemPrompt} 
            onChange={(e) => onConfigChange({...config, systemPrompt: e.target.value})}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-3 text-sm rounded h-48 focus:border-amber-500 outline-none font-sans resize-none"
            placeholder="Инструкции для ИИ..."
          />
        </div>
        <button onClick={onClose} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-widest rounded transition-colors shadow-lg">Сохранить</button>
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
  const [secretClickCount, setSecretClickCount] = useState(0);


  const debugImagesEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('debugImages=1') || localStorage.getItem('debugTarotImages') === '1';
  }, []);

  const [runtimeDebugInfo, setRuntimeDebugInfo] = useState<RuntimeDebugInfo>({
    loaded: false,
    cardsStatusHttpCode: null,
    cardsStatusPayload: null,
    probes: [],
  });
  const [imageErrors, setImageErrors] = useState<ImageErrorEventPayload[]>([]);

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    temperature: 1.1,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    model: 'gemini-3-flash-preview'
  });


  const shouldShowDebugPanel = debugImagesEnabled || imageErrors.length > 0;

  useEffect(() => {
    if (!shouldShowDebugPanel || typeof window === 'undefined') return;

    const runRuntimeDebug = async () => {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

      const probeTargets = [
        { label: 'Static card from public/cards', url: `${normalizedBaseUrl}cards/major/01_the_fool.jpg` },
        { label: 'Another static card', url: `${normalizedBaseUrl}cards/minor/02_two_of_wands.jpg` },
      ];

      const probes: DebugProbeResult[] = [];
      for (const target of probeTargets) {
        try {
          const response = await fetch(target.url, { method: 'GET', cache: 'no-store' });
          const contentType = response.headers.get('content-type');
          const looksLikeImage = Boolean(contentType && contentType.startsWith('image/'));

          probes.push({
            label: target.label,
            url: target.url,
            ok: response.ok && looksLikeImage,
            status: response.status,
            contentType,
            looksLikeImage,
          });
        } catch (error) {
          probes.push({
            label: target.label,
            url: target.url,
            ok: false,
            status: error instanceof Error ? error.message : 'network_error',
            contentType: null,
            looksLikeImage: false,
          });
        }
      }

      let cardsStatusHttpCode: number | null = null;
      let cardsStatusPayload: unknown = null;
      try {
        const response = await fetch(`${normalizedBaseUrl}debug/cards-status`, { cache: 'no-store' });
        cardsStatusHttpCode = response.status;
        cardsStatusPayload = await response.text();
      } catch (error) {
        cardsStatusPayload = error instanceof Error ? error.message : String(error);
      }

      console.info('[Tarot runtime debug]', {
        location: window.location.href,
        cardsStatusHttpCode,
        cardsStatusPayload,
        probes,
      });

      setRuntimeDebugInfo({
        loaded: true,
        cardsStatusHttpCode,
        cardsStatusPayload,
        probes,
      });
    };

    runRuntimeDebug();
  }, [shouldShowDebugPanel]);


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ImageErrorEventPayload>;
      if (!customEvent.detail) return;
      setImageErrors((prev) => [customEvent.detail, ...prev].slice(0, 6));
    };

    window.addEventListener('tarot:image-error', handler as EventListener);
    return () => window.removeEventListener('tarot:image-error', handler as EventListener);
  }, []);

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
        new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 6000))
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
      {showSettings && <SettingsModal config={aiConfig} onConfigChange={setAiConfig} onClose={() => setShowSettings(false)} />}
      
      {appState === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 animate-fade-in">
          <Sparkles className="w-16 h-16 text-amber-200 mb-8 animate-pulse" />
          <h1 className="text-4xl sm:text-7xl font-bold text-amber-100 mb-8 font-serif tracking-widest uppercase px-4 max-w-full break-words leading-tight">
            Мистический Оракул
          </h1>
          <button onClick={() => setAppState('input')} className="px-12 py-5 border border-amber-500/50 hover:bg-amber-900/30 text-amber-100 font-serif text-xl tracking-widest transition-all uppercase">
            Просить совета
          </button>
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
            <button onClick={resetApp} className="p-2 text-slate-500 hover:text-white transition-colors shrink-0"><RefreshCw className="w-5 h-5" /></button>
          </header>

          <div className="flex-1 p-4 sm:p-6 flex flex-col items-center pb-24">
            <h3 className="text-xl sm:text-2xl font-serif text-amber-500 mb-8 sm:mb-12 uppercase tracking-widest text-center">{selectedSpread?.name}</h3>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-12 mb-16">
              {drawnCards.map((card, idx) => (
                <div key={idx} className="flex flex-col items-center gap-4">
                  <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-widest ${revealedCount > idx ? 'text-amber-500' : 'text-slate-700'}`}>
                    {idx + 1}. {selectedSpread?.positions[idx].name}
                  </span>
                  <CardComponent
                    card={card}
                    isRevealed={revealedCount > idx}
                    onClick={() => handleRevealCard(idx)}
                    onImageError={(payload) => setImageErrors((prev) => [payload, ...prev].slice(0, 6))}
                  />
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
                    <p className="mb-4 font-serif italic text-lg text-red-100/70 text-left">Оракул столкнулся с земным препятствием:</p>
                    <div className="bg-black/40 p-4 rounded font-mono text-xs text-red-400 break-all border border-red-900/20 text-left">
                      {apiError}
                    </div>
                    <button onClick={resetApp} className="mt-8 w-full py-4 bg-red-900/20 border border-red-900/40 hover:bg-red-900/40 transition text-red-100 uppercase tracking-widest text-xs font-bold rounded">
                      Попробовать снова
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
                    <button onClick={resetApp} className="mt-16 w-full py-5 border border-slate-700 hover:border-amber-500 hover:bg-amber-900/10 text-amber-100 font-serif uppercase tracking-widest transition-all">
                      Задать иной вопрос
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {shouldShowDebugPanel && (
        <div className="fixed bottom-3 right-3 z-[120] w-[22rem] max-w-[92vw] bg-black/85 border border-amber-600/40 rounded-lg p-3 text-[11px] text-left shadow-2xl backdrop-blur">
          <div className="font-bold text-amber-300 uppercase tracking-wider mb-2">Image Debug Panel {debugImagesEnabled ? '(manual)' : '(auto)'}</div>
          {!runtimeDebugInfo.loaded ? (
            <div className="text-slate-300">Проверяем runtime-статус...</div>
          ) : (
            <>
              <div className="text-slate-200 mb-1">`/debug/cards-status`: <span className={runtimeDebugInfo.cardsStatusHttpCode === 200 ? 'text-emerald-300' : 'text-red-300'}>{String(runtimeDebugInfo.cardsStatusHttpCode)}</span></div>
              <div className="text-slate-400 break-all mb-2 max-h-16 overflow-auto">{String(runtimeDebugInfo.cardsStatusPayload)}</div>
              <div className="space-y-1">
                {runtimeDebugInfo.probes.map((probe) => (
                  <div key={probe.url} className="text-slate-300">
                    <span className={probe.ok ? 'text-emerald-300' : 'text-red-300'}>{probe.ok ? 'OK' : 'FAIL'}</span>{' '}
                    {probe.status} ({probe.contentType || 'no-content-type'}) — {probe.label}
                  </div>
                ))}
              </div>

              {imageErrors.length > 0 && (
                <div className="mt-2 border-t border-slate-700 pt-2 max-h-28 overflow-auto space-y-1">
                  {imageErrors.map((errorItem, index) => (
                    <div key={`${errorItem.cardId}-${index}`} className="text-red-300 break-all">
                      {errorItem.cardId}: {errorItem.attemptedSrc}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

    </main>
  );
};

export default App;
