
 // App.tsx
 // v3.2.0 @ 2025-05-21
import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, RefreshCw, BrainCircuit, Eye, ChevronDown, Settings, X, Save, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Internal imports
import { AppState, Spread, DrawnCard } from './types';
import { DECK, SPREADS } from './constants';
import { getTarotReading, selectBestSpread, AIConfig, DEFAULT_SYSTEM_PROMPT } from './services/geminiService';
import CardComponent from './components/CardComponent';

// Extended AppState to include 'consulting' phase where AI picks the spread
type ExtendedAppState = AppState | 'consulting';

interface SettingsModalProps {
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, onConfigChange, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-lg shadow-2xl animate-fade-in relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-amber-500">
            <Settings className="w-5 h-5" />
            <h2 className="font-serif text-xl tracking-wide">Настройки Гримуара</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 tracking-widest font-bold">Модель AI</label>
            <select 
              value={config.model}
              onChange={(e) => onConfigChange({...config, model: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2 text-sm rounded focus:border-amber-500 outline-none"
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash (Default)</option>
              <option value="gemini-flash-lite-latest">Gemini Flash Lite</option>
              <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs uppercase text-slate-400 tracking-widest font-bold">
              <span>Температура</span>
              <span className="text-amber-500">{config.temperature}</span>
            </div>
            <input 
              type="range" min="0.1" max="2.0" step="0.1"
              value={config.temperature}
              onChange={(e) => onConfigChange({...config, temperature: parseFloat(e.target.value)})}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 tracking-widest font-bold">Системный Промпт</label>
            <textarea 
              value={config.systemPrompt}
              onChange={(e) => onConfigChange({...config, systemPrompt: e.target.value})}
              className="w-full h-32 bg-slate-950 border border-slate-700 text-slate-300 p-3 text-xs font-mono rounded focus:border-amber-500 outline-none resize-none"
            />
          </div>
          <button onClick={onClose} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-widest rounded transition-colors">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<ExtendedAppState>('intro');
  const [question, setQuestion] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<Spread | null>(null);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [readingText, setReadingText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      ...card,
      positionIndex: index,
      isReversed: Math.random() > 0.7
    }));
  };

  const handleStart = () => setAppState('input');

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAppState('consulting');

    try {
      // AI выбирает расклад
      const spreadId = await selectBestSpread(question, SPREADS, aiConfig);
      const spread = SPREADS.find(s => s.id === spreadId) || SPREADS[2];
      
      setTimeout(() => {
        setSelectedSpread(spread);
        setAppState('shuffling');
        setTimeout(() => {
          setDrawnCards(drawCards(spread.cardCount));
          setRevealedCount(0);
          setReadingText('');
          setAppState('revealing');
        }, 3000);
      }, 1500);
    } catch (err) {
      // Фолбэк если API упал на хостинге
      console.warn("AI selection failed, using fallback spread");
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
        setIsLoading(true);
        setAppState('reading');
        try {
          const text = await getTarotReading(question, selectedSpread, drawnCards, aiConfig);
          setReadingText(text);
        } catch (err: any) {
          setError(err.message || "Ошибка связи с астралом.");
        } finally {
          setIsLoading(false);
        }
      };
      setTimeout(fetchReading, 1000);
    }
  }, [revealedCount, appState, selectedSpread, drawnCards, question, aiConfig]);

  const resetApp = () => {
    setAppState('intro');
    setQuestion('');
    setSelectedSpread(null);
    setRevealedCount(0);
    setReadingText('');
    setError(null);
  };

  const handleSecretClick = () => {
    setSecretClickCount(prev => (prev + 1 > 4 ? (setShowSettings(true), 0) : prev + 1));
    setTimeout(() => setSecretClickCount(0), 1000);
  };

  return (
    <main className="bg-slate-900 min-h-screen text-slate-200 selection:bg-amber-500/30 overflow-x-hidden font-sans relative">
      <div className="fixed top-0 left-0 w-16 h-16 z-[60]" onClick={handleSecretClick} />
      {showSettings && <SettingsModal config={aiConfig} onConfigChange={setAiConfig} onClose={() => setShowSettings(false)} />}
      
      {appState === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 animate-fade-in">
          <Sparkles className="w-24 h-24 text-amber-200 mb-8 animate-pulse" />
          <h1 className="text-4xl sm:text-7xl font-bold text-amber-100 mb-6 font-serif tracking-widest">МИСТИЧЕСКИЙ ОРАКУЛ</h1>
          <button onClick={handleStart} className="px-10 py-4 border border-amber-500/50 hover:bg-amber-900/20 text-amber-100 font-serif text-xl tracking-widest transition-all">
            НАЧАТЬ ГАДАНИЕ
          </button>
        </div>
      )}

      {appState === 'input' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
          <h2 className="text-3xl font-serif text-amber-100 mb-8">Что вас беспокоит?</h2>
          <form onSubmit={handleQuestionSubmit} className="w-full max-w-xl">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-slate-900/50 border-b-2 border-slate-600 focus:border-amber-500 text-center py-4 text-white outline-none font-serif text-2xl"
              rows={3}
              placeholder="..."
            />
            <button type="submit" disabled={!question.trim()} className="w-full mt-12 py-4 bg-slate-800 hover:bg-slate-700 text-amber-100 uppercase tracking-widest rounded-full border border-slate-700">
              Спросить Оракула
            </button>
          </form>
        </div>
      )}

      {appState === 'consulting' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fade-in">
          <Eye className="w-16 h-16 text-indigo-300 animate-pulse mb-4" />
          <h3 className="text-2xl font-serif text-indigo-100">Оракул размышляет...</h3>
        </div>
      )}

      {appState === 'shuffling' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center animate-fade-in p-6">
          <h2 className="text-4xl font-serif text-amber-100 mb-4">{selectedSpread?.name}</h2>
          <p className="text-slate-400 italic mb-12">{selectedSpread?.description}</p>
          <div className="w-40 h-64 border border-amber-500/30 bg-slate-800 rounded-xl flex items-center justify-center animate-bounce shadow-2xl">
            <RefreshCw className="text-amber-500 w-12 h-12 animate-spin" />
          </div>
          <p className="mt-8 text-amber-200/60 font-serif tracking-widest uppercase">Перемешивание...</p>
        </div>
      )}

      {(appState === 'revealing' || appState === 'reading') && (
        <div className="flex flex-col min-h-screen bg-slate-950 pb-20">
          <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-white/5 p-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}>
              <ChevronDown className={`text-amber-500 transition-transform ${isQuestionExpanded ? 'rotate-180' : ''}`} />
              <span className="text-amber-100 font-serif truncate max-w-xs">{question}</span>
            </div>
            <button onClick={resetApp} className="p-2 text-slate-500 hover:text-white"><RefreshCw className="w-5 h-5" /></button>
          </header>

          <div className="flex-1 p-6 flex flex-col items-center">
            <h3 className="text-2xl font-serif text-amber-500 mb-12">{selectedSpread?.name}</h3>
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              {drawnCards.map((card, idx) => (
                <div key={idx} className="flex flex-col items-center gap-4">
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${revealedCount > idx ? 'text-amber-500' : 'text-slate-700'}`}>
                    {idx + 1}. {selectedSpread?.positions[idx].name}
                  </span>
                  <CardComponent card={card} isRevealed={revealedCount > idx} onClick={() => handleRevealCard(idx)} />
                </div>
              ))}
            </div>

            {revealedCount < (selectedSpread?.cardCount || 0) ? (
              <p className="text-amber-200 font-serif text-xl animate-bounce">Откройте карту #{revealedCount + 1}</p>
            ) : (
              <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-700/50 p-8 md:p-12 rounded-sm shadow-2xl animate-slide-up">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                  <Sparkles className="text-purple-400" />
                  <h2 className="text-3xl font-serif text-amber-100">Голос Оракула</h2>
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-4 animate-pulse"><Loader2 className="animate-spin text-amber-500" /> <span className="font-serif">Трактовка знаков...</span></div>
                ) : (
                  <div className="text-slate-300 font-light">
                    <ReactMarkdown components={{
                      h1: (props) => <h1 className="text-3xl font-serif text-amber-500 mb-6 mt-8 border-b border-amber-500/20 pb-2" {...props} />,
                      h2: (props) => <h2 className="text-2xl font-serif text-amber-200 mb-4 mt-6" {...props} />,
                      strong: (props) => <strong className="text-amber-400 font-semibold" {...props} />,
                      p: (props) => <p className="mb-4 text-lg leading-relaxed" {...props} />,
                      blockquote: (props) => <blockquote className="border-l-4 border-amber-500/40 pl-4 italic text-slate-400 my-4" {...props} />,
                    }}>
                      {readingText}
                    </ReactMarkdown>
                  </div>
                )}
                <button onClick={resetApp} className="mt-12 w-full py-4 border border-slate-700 hover:border-amber-500 text-amber-100 uppercase tracking-widest transition-all">Задать новый вопрос</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
