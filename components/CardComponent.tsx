
import React, { useState, useEffect } from 'react';
import { DrawnCard, Suit, ArcanaType } from '../types';
import { 
  Sparkles, Moon, Sun, Sword, Wine, Coins, Club, 
  Wind, Scroll, Crown, Shield, Key, Heart, Compass, 
  Flame, Search, RefreshCw, Scale, Anchor, Skull, 
  Droplets, Ghost, Zap, Star, Megaphone, Globe,
  ImageOff
} from 'lucide-react';

interface CardComponentProps {
  card: DrawnCard;
  isRevealed: boolean;
  onClick?: () => void;
  className?: string;
}

const getSuitIcon = (suit: Suit) => {
  switch (suit) {
    case Suit.CUPS: return <Wine className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />;
    case Suit.SWORDS: return <Sword className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />;
    case Suit.PENTACLES: return <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />;
    case Suit.WANDS: return <Club className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />;
    default: return <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />;
  }
};

const getMajorArcanaIcon = (id: number) => {
  switch (id) {
    case 0: return <Wind className="w-full h-full text-sky-300" />;
    case 1: return <Sparkles className="w-full h-full text-yellow-400" />;
    case 2: return <Scroll className="w-full h-full text-blue-300" />;
    case 3: return <Crown className="w-full h-full text-green-400" />;
    case 4: return <Shield className="w-full h-full text-red-500" />;
    case 5: return <Key className="w-full h-full text-amber-600" />;
    case 6: return <Heart className="w-full h-full text-pink-500" />;
    case 7: return <Compass className="w-full h-full text-orange-400" />;
    case 8: return <Flame className="w-full h-full text-red-400" />;
    case 9: return <Search className="w-full h-full text-slate-400" />;
    case 10: return <RefreshCw className="w-full h-full text-purple-400" />;
    case 11: return <Scale className="w-full h-full text-indigo-400" />;
    case 12: return <Anchor className="w-full h-full text-teal-600" />;
    case 13: return <Skull className="w-full h-full text-slate-300" />;
    case 14: return <Droplets className="w-full h-full text-blue-500" />;
    case 15: return <Ghost className="w-full h-full text-red-900" />;
    case 16: return <Zap className="w-full h-full text-yellow-500" />;
    case 17: return <Star className="w-full h-full text-cyan-300" />;
    case 18: return <Moon className="w-full h-full text-indigo-300" />;
    case 19: return <Sun className="w-full h-full text-amber-500" />;
    case 20: return <Megaphone className="w-full h-full text-orange-300" />;
    case 21: return <Globe className="w-full h-full text-green-500" />;
    default: return <Sparkles className="w-full h-full text-purple-400" />;
  }
};

const CardComponent: React.FC<CardComponentProps> = ({ card, isRevealed, onClick, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset error state when card changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [card.id]);

  const imagePath = `/cards/${card.id}.jpg`;

  return (
    <div 
      className={`group w-32 h-52 sm:w-48 sm:h-80 cursor-pointer perspective-1000 ${className}`}
      onClick={onClick}
    >
      <div className={`relative w-full h-full duration-700 transition-transform transform-style-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
        
        {/* --- CARD BACK --- */}
        <div className="absolute w-full h-full backface-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center overflow-hidden">
           {/* Mystic Pattern Background */}
           <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/50 via-slate-950 to-black"></div>
           <div className="absolute inset-2 border border-amber-900/30 rounded-md flex items-center justify-center">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border border-amber-600/20 flex items-center justify-center animate-pulse">
                <Moon className="w-8 h-8 sm:w-12 sm:h-12 text-amber-700/50" />
              </div>
           </div>
        </div>

        {/* --- CARD FRONT --- */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-lg bg-[#e8e4d9] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col relative text-slate-900">
           
           {/* 1. Header: Number & Suit */}
           <div className="w-full px-2 py-1 flex justify-between items-center border-b border-slate-300 bg-[#dcd7cc] h-8 shrink-0">
             <span className="text-xs sm:text-sm font-bold font-serif text-slate-700">
               {card.arcana === ArcanaType.MAJOR ? (card.number === 0 ? '0' : romanize(card.number)) : card.number}
             </span>
             <div className="opacity-80">
               {card.arcana === ArcanaType.MAJOR ? (
                 <span className="text-[10px] font-serif uppercase tracking-tighter">Major</span>
               ) : (
                 getSuitIcon(card.suit)
               )}
             </div>
           </div>

           {/* 2. Main Image Area */}
           <div className="flex-1 relative bg-slate-200 overflow-hidden flex items-center justify-center">
              {/* Image Container with 1:1 Aspect Ratio Preservation logic or Cover */}
              {!imageError ? (
                <div className={`relative w-full h-full transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                  <img 
                    src={imagePath} 
                    alt={card.nameRu}
                    className={`w-full h-full object-cover transition-transform duration-700 ${card.isReversed ? 'rotate-180' : ''}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                  {/* Reversed Indicator Overlay (Subtle) */}
                  {card.isReversed && (
                    <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-2 bg-gradient-to-t from-black/40 to-transparent">
                       {/* Optional visual cue for reversed if needed, though rotation is enough */}
                    </div>
                  )}
                </div>
              ) : (
                // Fallback to Icon if Image Missing
                <div className={`w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b ${
                    card.arcana === ArcanaType.MAJOR ? 'from-purple-50 to-indigo-50' : 'from-amber-50 to-orange-50'
                }`}>
                  <div className={`w-16 h-16 sm:w-24 sm:h-24 mb-2 opacity-80 ${card.isReversed ? 'rotate-180' : ''}`}>
                    {card.arcana === ArcanaType.MAJOR ? getMajorArcanaIcon(card.number) : getSuitIcon(card.suit)}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    <ImageOff className="w-3 h-3" /> art missing
                  </span>
                </div>
              )}
           </div>

           {/* 3. Footer: Title & Keywords */}
           <div className="w-full bg-[#dcd7cc] border-t-2 border-slate-300 py-2 px-1 flex flex-col items-center justify-center shrink-0 min-h-[3.5rem]">
             <div className="flex items-center gap-1">
               {card.isReversed && <RefreshCw className="w-3 h-3 text-red-600" />}
               <h3 className="font-serif font-bold text-xs sm:text-sm text-center leading-tight uppercase tracking-wide text-slate-900">
                 {card.nameRu}
               </h3>
             </div>
             {/* Optional Keyword for quick reading */}
             {/* <p className="text-[9px] text-slate-600 mt-0.5 italic truncate max-w-full px-2">
               {card.description.split(',')[0]}
             </p> */}
           </div>

        </div>
      </div>
    </div>
  );
};

// Helper for Roman Numerals
function romanize(num: number): string {
  if (isNaN(num)) return "";
  const digits = String(+num).split("");
  const key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"];
  let roman = "";
  let i = 3;
  while (i--) {
    // @ts-ignore
    roman = (key[+digits.pop() + (i * 10)] || "") + roman;
  }
  return Array(+digits.join("") + 1).join("M") + roman;
}

export default CardComponent;
