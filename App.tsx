// App.tsx
// v3.3.0 @ 2025-05-21
/**
 * @description Главный компонент приложения "Мистический Оракул".
 * @changelog
 * 1. Исправлен баг "пустого толкования": толкование теперь вызывается сразу по открытию последней карты.
 * 2. Восстановлен оригинальный дизайн Markdown и заголовков.
 * 3. Улучшена обработка ошибок API на хостинге.
 */
import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, RefreshCw, Eye, ChevronDown, Settings, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Internal imports
import { AppState, Spread, DrawnCard } from './types';
import { DECK, SPREADS } from './constants';
import { getTarotReading, selectBestSpread, AIConfig, DEFAULT_SYSTEM_PROMPT } from './services/geminiService';
import CardComponent from './components/CardComponent';

type ExtendedAppState = AppState | 'consulting';

const SettingsModal: React.FC<{ config: AIConfig; onConfigChange: (config: AIConfig) => void; onClose: () => void; }> = ({ config, onConfigChange, onClose }) => (
  <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
    <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-lg shadow-2xl animate-fade-in relative text-left">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-amber-500">
          <Settings className="w-5 h-5" />
          <h2 className="font-serif text-xl tracking-wide">Настройки</h2>
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
        <button onClick={onClose} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-widest rounded transition-colors">Готово</button>
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
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);

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
    try {
      const spreadId = await selectBestSpread(question, SPREADS, aiConfig);
      const spread = SPREADS.find(s => s.id === spreadId) || SPREADS[2];
      setSelectedSpread(spread);
      setTimeout(() => {
        setAppState('shuffling');
        setTimeout(() => {
          setDrawnCards(drawCards(spread.cardCount));
          setRevealedCount(0);
          setReadingText('');
          setAppState('revealing');
        }, 2000);
      }, 1000);
    } catch (err) {
      const fallback = SPREADS[2];
      setSelectedSpread(fallback);
      setAppState('shuffling');
      setTimeout(() => {
        setDrawnCards(drawCards(fallback.cardCount));
        setAppState('revealing');
      }, 2000);
    }
  };

  const handleRevealCard = (index: number) => {
    if (index === revealedCount) setRevealedCount(prev => prev + 1);
  };

  useEffect(() => {
    if (appState === 'revealing' && selectedSpread && revealedCount === selectedSpread.cardCount) {
      const fetchReading = async () => {
        setAppState('reading');
        setIsLoading(true);
        try {
          const text = await getTarotReading(question, selectedSpread, drawnCards, aiConfig);
          setReadingText(text || "Оракул молчит... попробуйте переформулировать вопрос.");
        } catch (err) {
          setReadingText("Туман окутал знаки. Связь с астралом прервана.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchReading();
    }
  }, [revealedCount, appState, selectedSpread, drawnCards, question, aiConfig]);

  const resetApp = () => {
    setAppState('intro');
    setQuestion('');
    setSelectedSpread(null);
    setRevealedCount(0);
    setReadingText('');
  };

  return (
    <main className="bg-slate-900 min-h-screen text-slate-200 font-sans relative overflow-x-hidden selection:bg-amber-500/30">
      <div className="fixed top-0 left-0 w-16 h-16 z-[60]" onClick={() => setSecretClickCount(p => (p + 1 > 4 ? (setShowSettings(true), 0) : p + 1))} />
      {showSettings && <SettingsModal config={aiConfig} onConfigChange={setAiConfig} onClose={() => setShowSettings(false)} />}
      
      {appState === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 animate-fade-in">
          <Sparkles className="w-20 h-20 text-amber-200 mb-8 animate-pulse" />
          <h1 className="text-5xl sm:text-7xl font-bold text-amber-100 mb-8 font-serif tracking-widest">МИСТИЧЕСКИЙ ОРАКУЛ</h1>
          <button onClick={() => setAppState('input')} className="px-12 py-5 border border-amber-500/50 hover:bg-amber-900/30 text-amber-100 font-serif text-xl tracking-widest transition-all uppercase">Просить совета</button>
        </div>
      )}

      {appState === 'input' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in text-center">
          <h2 className="text-3xl font-serif text-amber-100 mb-12">Что желаете узнать у Вселенной?</h2>
          <form onSubmit={handleQuestionSubmit} className="w-full max-w-2xl">
            <textarea
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-700 focus:border-amber-500 text-center py-4 text-white outline-none font-serif text-2xl sm:text-3xl transition-colors placeholder:text-slate-800"
              rows={2}
              placeholder="Ваш вопрос..."
            />
            <button type="submit" disabled={!question.trim()} className="mt-16 px-12 py-4 bg-amber-700 hover:bg-amber-600 disabled:opacity-20 text-slate-950 font-bold uppercase tracking-widest rounded-full transition-all shadow-xl">Спросить Оракула</button>
          </form>
        </div>
      )}

      {appState === 'consulting' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fade-in">
          <Eye className="w-16 h-16 text-amber-500 animate-pulse mb-4" />
          <h3 className="text-2xl font-serif text-amber-100 tracking-widest uppercase">Оракул выбирает расклад...</h3>
        </div>
      )}

      {appState === 'shuffling' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fade-in p-6">
          <h2 className="text-4xl font-serif text-amber-100 mb-4 uppercase tracking-tighter">{selectedSpread?.name}</h2>
          <p className="text-slate-400 italic mb-16 max-w-md">{selectedSpread?.description}</p>
          <div className="w-32 h-48 border-2 border-amber-500/30 bg-slate-800 rounded-xl flex items-center justify-center animate-bounce shadow-2xl">
            <RefreshCw className="text-amber-500 w-10 h-10 animate-spin" />
          </div>
          <p className="mt-10 text-amber-200/50 font-serif tracking-[0.3em] uppercase text-sm">Карты ложатся в ряд</p>
        </div>
      )}

      {(appState === 'revealing' || appState === 'reading') && (
        <div className="flex flex-col min-h-screen bg-slate-950">
          <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-950/80 border-b border-white/5 p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}>
              <ChevronDown className={`text-amber-500 shrink-0 transition-transform ${isQuestionExpanded ? 'rotate-180' : ''}`} />
              <span className="text-amber-100 font-serif truncate text-sm sm:text-base">{question}</span>
            </div>
            <button onClick={resetApp} className="p-2 text-slate-500 hover:text-white transition-colors shrink-0"><RefreshCw className="w-5 h-5" /></button>
          </header>

          <div className="flex-1 p-6 flex flex-col items-center pb-24">
            <h3 className="text-2xl font-serif text-amber-500 mb-12 uppercase tracking-widest">{selectedSpread?.name}</h3>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-16">
              {drawnCards.map((card, idx) => (
                <div key={idx} className="flex flex-col items-center gap-4">
                  <span className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${revealedCount > idx ? 'text-amber-500' : 'text-slate-700'}`}>
                    {idx + 1}. {selectedSpread?.positions[idx].name}
                  </span>
                  <CardComponent card={card} isRevealed={revealedCount > idx} onClick={() => handleRevealCard(idx)} />
                </div>
              ))}
            </div>

            {revealedCount < (selectedSpread?.cardCount || 0) ? (
              <div className="text-center animate-bounce">
                <p className="text-amber-200 font-serif text-xl tracking-wide">Откройте карту знамения #{revealedCount + 1}</p>
              </div>
            ) : (
              <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800 p-8 md:p-16 rounded-xl shadow-2xl animate-slide-up backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-10 border-b border-slate-800 pb-6">
                  <Sparkles className="text-amber-500 w-8 h-8" />
                  <h2 className="text-3xl sm:text-4xl font-serif text-amber-100">Голос Оракула</h2>
                </div>
                
                {isLoading ? (
                  <div className="flex flex-col items-center gap-6 py-12">
                    <Loader2 className="animate-spin text-amber-500 w-12 h-12" />
                    <span className="font-serif text-amber-200/60 tracking-widest uppercase animate-pulse">Трактовка знаков...</span>
                  </div>
                ) : (
                  <div className="text-slate-300 leading-relaxed">
                    <ReactMarkdown components={{
                      h1: (props) => <h1 className="text-3xl font-serif text-amber-500 mb-6 mt-10 border-b border-amber-500/20 pb-2 uppercase tracking-wide" {...props} />,
                      h2: (props) => <h2 className="text-2xl font-serif text-amber-200 mb-4 mt-8" {...props} />,
                      strong: (props) => <strong className="text-amber-400 font-bold" {...props} />,
                      p: (props) => <p className="mb-6 text-lg sm:text-xl font-light" {...props} />,
                      blockquote: (props) => <blockquote className="border-l-4 border-amber-600/50 pl-6 italic text-slate-400 my-8 py-2 bg-amber-900/5" {...props} />,
                    }}>
                      {readingText}
                    </ReactMarkdown>
                    <button onClick={resetApp} className="mt-16 w-full py-5 border border-slate-700 hover:border-amber-500 hover:bg-amber-900/10 text-amber-100 font-serif uppercase tracking-widest transition-all">Задать иной вопрос</button>
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