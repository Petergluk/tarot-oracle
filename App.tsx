import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Send, RefreshCw, ChevronRight, BrainCircuit, Eye, ChevronDown, Settings, X, Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Internal imports
import { AppState, Spread, DrawnCard } from './types';
import { DECK, SPREADS } from './constants';
import { getTarotReading, selectBestSpread, AIConfig, DEFAULT_SYSTEM_PROMPT } from './services/geminiService';
import CardComponent from './components/CardComponent';

// Extended AppState to include 'consulting' phase where AI picks the spread
type ExtendedAppState = AppState | 'consulting';

// --- EXTRACTED COMPONENTS TO PREVENT RE-RENDERS ---

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
          {/* Model Select */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 tracking-widest font-bold">Модель AI</label>
            <select 
              value={config.model}
              onChange={(e) => onConfigChange({...config, model: e.target.value})}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 p-2 text-sm rounded focus:border-amber-500 outline-none"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
              <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-3-pro-preview">Gemini 3 Pro Preview</option>
            </select>
          </div>

           {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs uppercase text-slate-400 tracking-widest font-bold">
              <span>Температура (Креативность)</span>
              <span className="text-amber-500">{config.temperature}</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="2.0" 
              step="0.1"
              value={config.temperature}
              onChange={(e) => onConfigChange({...config, temperature: parseFloat(e.target.value)})}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400 tracking-widest font-bold">Системный Промпт (Личность)</label>
            <textarea 
              value={config.systemPrompt}
              onChange={(e) => onConfigChange({...config, systemPrompt: e.target.value})}
              placeholder="По умолчанию: Ты мистический оракул..."
              className="w-full h-32 bg-slate-950 border border-slate-700 text-slate-300 p-3 text-xs font-mono rounded focus:border-amber-500 outline-none resize-none placeholder-slate-700"
            />
            <p className="text-[10px] text-slate-600">Оставьте пустым для стандартной личности Оракула.</p>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

// --- DIAGNOSTIC PANEL FOR IMAGE PATHS ---
const DebugPanel: React.FC = () => {
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [isVisible, setIsVisible] = useState(false);

  const testPaths = [
    '/cards/major/01_the_fool.jpg',
    '/cards/minor/01_ace_of_wands.jpg',
    '/public/cards/major/01_the_fool.jpg', // Test incorrect path
    '/cards/wands/01_ace_of_wands.jpg' // Test old incorrect logic
  ];

  const checkPaths = async () => {
    const newResults: Record<string, boolean> = {};
    for (const path of testPaths) {
      try {
        const res = await fetch(path, { method: 'HEAD' });
        newResults[path] = res.ok;
      } catch (e) {
        newResults[path] = false;
      }
    }
    setResults(newResults);
  };

  useEffect(() => {
    checkPaths();
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-2 right-2 z-[9999] opacity-50 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsVisible(true)}
          className="bg-slate-800 text-xs text-slate-400 p-1 rounded border border-slate-700"
        >
          Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-[9999] bg-slate-900 border-t border-l border-slate-700 p-4 w-full sm:w-96 shadow-2xl text-xs font-mono max-h-60 overflow-y-auto">
      <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
        <h3 className="text-amber-500 font-bold">Image Path Diagnostic</h3>
        <button onClick={() => setIsVisible(false)}><X className="w-4 h-4 text-slate-500" /></button>
      </div>
      <div className="space-y-2">
        {testPaths.map(path => (
          <div key={path} className="flex items-center gap-2">
            {results[path] === true ? (
              <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
            ) : results[path] === false ? (
              <XCircle className="w-3 h-3 text-red-500 shrink-0" />
            ) : (
              <Loader2 className="w-3 h-3 text-yellow-500 animate-spin shrink-0" />
            )}
            <span className={results[path] ? 'text-green-200' : 'text-red-300'}>{path}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
        Green check means the file exists on server. Red cross means 404/Error.
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // State
  const [appState, setAppState] = useState<ExtendedAppState>('intro');
  const [question, setQuestion] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<Spread | null>(null);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [readingText, setReadingText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // UI State
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    temperature: 1.1,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    model: 'gemini-2.5-flash'
  });

  // Helper: Shuffle and Draw
  const drawCards = (count: number): DrawnCard[] => {
    // Fisher-Yates Shuffle
    const deckCopy = [...DECK];
    for (let i = deckCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckCopy[i], deckCopy[j]] = [deckCopy[j], deckCopy[i]];
    }
    
    // Take top N cards and decide reversal randomly (30% chance)
    return deckCopy.slice(0, count).map((card, index) => ({
      ...card,
      positionIndex: index,
      isReversed: Math.random() > 0.7
    }));
  };

  // Handlers
  const handleStart = () => setAppState('input');

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Transition to AI Consultation
    setAppState('consulting');

    // 1. AI Selects the Spread based on Question
    const spreadId = await selectBestSpread(question, SPREADS, aiConfig);
    const spread = SPREADS.find(s => s.id === spreadId) || SPREADS[2]; // Default to 3-card if fail
    
    // Small delay to let the user see the "Thinking" state
    setTimeout(() => {
        setSelectedSpread(spread);
        setAppState('shuffling');
        
        // 2. Auto-Shuffle after spread is shown
        setTimeout(() => {
            const cards = drawCards(spread.cardCount);
            setDrawnCards(cards);
            setRevealedCount(0);
            setReadingText('');
            setAppState('revealing');
        }, 3500); // Time to read the chosen spread name
    }, 2000);
  };

  const handleRevealCard = (index: number) => {
    if (index === revealedCount) {
      setRevealedCount(prev => prev + 1);
    }
  };

  const handleRetry = () => {
      setError(null);
      // Если ошибка произошла на этапе чтения (интерпретации),
      // возвращаем состояние 'revealing', чтобы сработал триггер useEffect
      if (appState === 'reading') {
          setAppState('revealing');
      }
      setRetryTrigger(prev => prev + 1); // Trigger useEffect
  };

  // Auto-trigger reading when all cards revealed
  useEffect(() => {
    if (appState === 'revealing' && selectedSpread && revealedCount === selectedSpread.cardCount) {
      const fetchReading = async () => {
        setIsLoading(true);
        setError(null);
        setAppState('reading'); 
        try {
            const text = await getTarotReading(question, selectedSpread, drawnCards, aiConfig);
            setReadingText(text);
        } catch (err: any) {
            console.error("Error fetching reading:", err);
            setError(err.message || "Произошла ошибка при связи с оракулом.");
        } finally {
            setIsLoading(false);
        }
      };
      
      // Small delay before AI starts thinking visually
      setTimeout(fetchReading, 1000);
    }
  }, [revealedCount, appState, selectedSpread, drawnCards, question, aiConfig, retryTrigger]);

  const resetApp = () => {
    setAppState('intro');
    setQuestion('');
    setSelectedSpread(null);
    setDrawnCards([]);
    setRevealedCount(0);
    setReadingText('');
    setIsQuestionExpanded(false);
    setError(null);
  };

  // Secret Menu Logic
  const handleSecretClick = () => {
    setSecretClickCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 4) {
            setShowSettings(true);
            return 0;
        }
        return newCount;
    });
    
    // Reset counter if idle
    setTimeout(() => setSecretClickCount(0), 1000);
  };

  // --- RENDER SECTIONS ---

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 animate-fade-in relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-900/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="mb-8 relative z-10">
        <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full"></div>
        <Sparkles className="w-24 h-24 text-amber-200 relative z-10 animate-pulse" />
      </div>
      {/* Responsive Typography Fix: scaled down on mobile, large on desktop */}
      <h1 className="relative z-10 text-3xl sm:text-5xl md:text-7xl font-bold text-amber-100 mb-6 tracking-wider serif-font drop-shadow-lg break-words w-full px-2">
        МИСТИЧЕСКИЙ<br />ОРАКУЛ
      </h1>
      <p className="relative z-10 text-slate-400 text-lg md:text-xl max-w-lg mb-12 font-light leading-relaxed">
        Задайте вопрос вселенной. Искусственный интеллект подберет идеальный расклад Таро и истолкует знаки судьбы.
      </p>
      <button 
        onClick={handleStart}
        className="relative z-10 group px-10 py-4 bg-transparent border border-amber-500/50 hover:bg-amber-900/20 text-amber-100 font-serif text-xl tracking-widest transition-all duration-500 overflow-hidden rounded-sm"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
        НАЧАТЬ ГАДАНИЕ
      </button>
    </div>
  );

  const renderInput = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
      <h2 className="text-3xl font-serif text-amber-100 mb-8">Что вас беспокоит?</h2>
      <form onSubmit={handleQuestionSubmit} className="w-full max-w-xl flex flex-col items-center">
        <div className="relative group w-full">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Опишите ситуацию или задайте вопрос..."
            rows={3}
            className="w-full bg-slate-900/50 border-b-2 border-slate-600 focus:border-amber-500 text-center py-4 text-white placeholder-slate-600 outline-none transition-colors font-serif resize-y"
            style={{ fontSize: '1.3rem', lineHeight: '1.5' }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuestionSubmit(e);
              }
            }}
          />
          <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-amber-500 transition-all duration-700 group-hover:w-full"></div>
        </div>
        <div className="mt-12 flex justify-center">
          <button 
            type="submit" 
            disabled={!question.trim()}
            className="flex items-center gap-3 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-amber-100/80 hover:text-amber-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-full border border-slate-700 hover:border-amber-500/50 uppercase tracking-widest text-sm"
          >
            Спросить Оракула <BrainCircuit className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );

  const renderConsulting = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-ping"></div>
        <Eye className="w-16 h-16 text-indigo-300 relative z-10 animate-pulse" />
      </div>
      <h3 className="text-2xl font-serif text-indigo-100 mb-2">Оракул размышляет...</h3>
      <p className="text-slate-500 text-sm max-w-md animate-pulse">
        Анализируем ваш вопрос "{question}" чтобы подобрать лучший метод предсказания.
      </p>
    </div>
  );

  const renderShuffling = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in text-center">
      <div className="mb-2 text-amber-500/50 text-xs font-bold tracking-[0.3em] uppercase">Расклад Выбран</div>
      <h2 className="text-3xl md:text-5xl font-serif text-amber-100 mb-4 drop-shadow-xl animate-slide-up">
        {selectedSpread?.name}
      </h2>
      <p className="text-slate-400 max-w-lg mb-12 italic text-sm animate-fade-in">
        {selectedSpread?.description}
      </p>

      <div className="relative w-40 h-64">
        {/* Animated shuffling effect */}
        <div className="absolute inset-0 border-2 border-amber-600/30 bg-slate-800 rounded-xl animate-ping opacity-20"></div>
        <div className="absolute inset-0 border border-slate-600 bg-slate-900 rounded-xl flex items-center justify-center shadow-2xl">
           <Sparkles className="text-amber-500 animate-spin-slow" />
        </div>
      </div>
      <p className="mt-8 text-amber-200/60 font-serif text-lg tracking-widest animate-pulse">ПЕРЕМЕШИВАНИЕ КОЛОДЫ...</p>
    </div>
  );

  const renderError = () => (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-red-900/50 w-full max-w-lg rounded-lg shadow-2xl text-center relative flex flex-col max-h-[90vh]">
               <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none rounded-lg"></div>
               
               <div className="relative z-10 flex flex-col items-center p-6 sm:p-8 overflow-y-auto">
                   <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mb-4 shrink-0" />
                   <h2 className="font-serif text-xl sm:text-2xl text-red-200 mb-2 shrink-0">Космические Помехи</h2>
                   <p className="text-slate-400 mb-6 font-light text-sm sm:text-base shrink-0">
                       Связь с астралом была прервана. Возможно, звезды встали не так, или исчерпан лимит энергии.
                   </p>
                   
                   <div className="bg-black/50 p-4 rounded border border-slate-800 mb-6 w-full text-left shrink-0 flex flex-col max-h-60 sm:max-h-80">
                       <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 shrink-0">Техническая причина:</p>
                       <div className="overflow-y-auto pr-2 custom-scrollbar">
                           <p className="text-red-400 font-mono text-xs break-words whitespace-pre-wrap">{error}</p>
                       </div>
                   </div>

                   <div className="flex gap-3 sm:gap-4 w-full shrink-0 mt-auto">
                       <button 
                           onClick={resetApp}
                           className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold uppercase tracking-widest rounded transition-colors text-xs"
                       >
                           В начало
                       </button>
                       <button 
                           onClick={handleRetry}
                           className="flex-1 py-3 bg-red-900/80 hover:bg-red-800 text-red-100 font-bold uppercase tracking-widest rounded transition-colors text-xs flex items-center justify-center gap-2"
                       >
                           <RefreshCw className="w-4 h-4" /> {appState === 'reading' ? 'Повторить запрос' : 'Повторить'}
                       </button>
                   </div>
               </div>
          </div>
      </div>
  );

  const renderTable = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 pb-20">
      {/* Accordion Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-white/5 transition-all duration-300">
        <div 
            onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
            className="w-full max-w-4xl mx-auto px-4 py-3 flex justify-between items-center cursor-pointer group"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-300 shrink-0 ${isQuestionExpanded ? 'rotate-180' : ''}`} />
                <span className="text-[10px] text-amber-500/70 uppercase tracking-widest font-bold shrink-0">Ваш запрос</span>
                {!isQuestionExpanded && (
                    <span className="text-slate-300 text-sm font-serif truncate max-w-[200px] sm:max-w-md opacity-70 group-hover:opacity-100 transition-opacity">
                        {question}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
                 <button 
                    onClick={(e) => { e.stopPropagation(); resetApp(); }} 
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition" 
                    title="Начать заново"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
        </div>
        
        {/* Expandable Content */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isQuestionExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="max-w-4xl mx-auto px-4 pb-4">
                <p className="text-amber-100 font-serif text-lg md:text-xl italic leading-relaxed border-l-2 border-amber-500/30 pl-4 py-2 bg-white/5 rounded-r-lg whitespace-pre-wrap">
                    "{question}"
                </p>
            </div>
        </div>
      </header>

      {/* Cards Area */}
      <div className="flex-1 flex flex-col items-center justify-start pt-8 pb-8 px-4 w-full">
        
        <div className="text-center mb-8">
            <span className="text-slate-500 text-[10px] uppercase tracking-widest">Выбранный расклад</span>
            <h3 className="text-2xl font-serif text-amber-100 mt-1">{selectedSpread?.name}</h3>
        </div>

        {/* Cards Grid - Responsive grid adapting to card count */}
        <div className={`
            grid gap-4 sm:gap-8 w-full max-w-6xl justify-center
            ${drawnCards.length === 1 ? 'grid-cols-1' : ''}
            ${drawnCards.length === 2 ? 'grid-cols-2' : ''}
            ${drawnCards.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : ''}
            ${drawnCards.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : ''}
            ${drawnCards.length === 5 ? 'grid-cols-2 md:grid-cols-5' : ''}
            ${drawnCards.length > 5 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : ''}
        `}>
          {drawnCards.map((card, idx) => (
            <div key={card.id} className="flex flex-col items-center gap-2 group">
               {/* Position Label */}
               <div className="h-8 flex items-end">
                   <span className={`text-[10px] uppercase tracking-wider font-bold text-center transition-colors duration-500 ${revealedCount > idx ? 'text-amber-500/80' : 'text-slate-700'}`}>
                     {idx + 1}. {selectedSpread?.positions[idx].name}
                   </span>
               </div>
               
               {/* Card */}
               <CardComponent 
                 card={card}
                 isRevealed={revealedCount > idx}
                 onClick={() => handleRevealCard(idx)}
                 className={`${revealedCount === idx ? 'ring-4 ring-amber-500/40 rounded-xl animate-pulse cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]' : ''} transition-all duration-300`}
               />
            </div>
          ))}
        </div>

        {/* Action / Status */}
        <div className="mt-12 min-h-[100px] w-full max-w-2xl flex justify-center items-center">
            {revealedCount < drawnCards.length ? (
                <div className="text-center animate-bounce cursor-pointer" onClick={() => handleRevealCard(revealedCount)}>
                    <p className="text-amber-200 font-serif text-lg">Коснитесь карты #{revealedCount + 1}</p>
                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Чтобы открыть "{selectedSpread?.positions[revealedCount].name}"</p>
                </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center gap-4 text-amber-200/80 animate-pulse">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                    <span className="font-serif text-xl tracking-wide">Оракул трактует знаки...</span>
                </div>
            ) : null}
        </div>

        {/* Reading Result */}
        {readingText && (
           <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-700/50 p-8 md:p-12 rounded-sm shadow-2xl mt-4 animate-slide-up backdrop-blur-md relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-amber-500/20"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-amber-500/20"></div>

              <div className="flex items-center gap-3 mb-8 border-b border-slate-700/50 pb-4">
                 <Sparkles className="text-purple-400 w-6 h-6" />
                 <h2 className="text-3xl font-serif text-amber-100">Голос Оракула</h2>
              </div>
              
              <div className="text-slate-300 font-light leading-relaxed">
                <ReactMarkdown
                    components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-serif text-amber-500 mb-6 mt-8 border-b border-amber-500/20 pb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-serif text-amber-200 mb-4 mt-6" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-serif text-indigo-300 mb-3 mt-4 uppercase tracking-wide" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-amber-400 font-semibold" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4" style={{ fontSize: '15px', lineHeight: '1.3', fontWeight: 400 }} {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-300/90" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-300/90" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-amber-500/40 pl-4 italic text-slate-400 my-4" {...props} />,
                    }}
                >
                    {readingText}
                </ReactMarkdown>
              </div>
              
              <div className="mt-12 pt-8 border-t border-slate-800 flex justify-center">
                <button 
                  onClick={resetApp}
                  className="group px-8 py-3 bg-slate-800 hover:bg-slate-700 text-amber-100 text-sm tracking-[0.2em] uppercase transition-all rounded-sm border border-slate-600 hover:border-amber-500"
                >
                  <span className="group-hover:mr-2 transition-all">Задать новый вопрос</span> 
                  <span className="opacity-0 group-hover:opacity-100 transition-all">→</span>
                </button>
              </div>
           </div>
        )}

      </div>
      <DebugPanel />
    </div>
  );

  return (
    <main className="bg-slate-900 min-h-screen text-slate-200 selection:bg-amber-500/30 overflow-x-hidden font-sans relative">
      {/* SECRET TRIGGER AREA (Top Left) */}
      <div 
        className="fixed top-0 left-0 w-16 h-16 z-[60] cursor-default select-none"
        onClick={handleSecretClick}
        onMouseDown={(e) => e.preventDefault()} // Prevent text selection on repeated clicks
        onDoubleClick={(e) => e.preventDefault()} // Prevent double click selection
        title="" // No title to keep it secret
      />

      {showSettings && (
        <SettingsModal 
          config={aiConfig} 
          onConfigChange={setAiConfig} 
          onClose={() => setShowSettings(false)} 
        />
      )}
      
      {/* Error Modal */}
      {error && renderError()}

      {appState === 'intro' && renderIntro()}
      {appState === 'input' && renderInput()}
      {appState === 'consulting' && renderConsulting()}
      {appState === 'shuffling' && renderShuffling()}
      {(appState === 'revealing' || appState === 'reading') && renderTable()}
    </main>
  );
};

export default App;