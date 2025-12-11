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

const getSuitColor = (suit: Suit) => {
  switch (suit) {
    case Suit.CUPS: return 'text-blue-500';
    case Suit.SWORDS: return 'text-slate-600';
    case Suit.PENTACLES: return 'text-amber-600';
    case Suit.WANDS: return 'text-orange-600';
    default: return 'text-purple-600';
  }
};

const getSuitGradient = (suit: Suit) => {
  switch (suit) {
    case Suit.CUPS: return 'from-blue-100 to-cyan-50 border-blue-200';
    case Suit.SWORDS: return 'from-slate-200 to-gray-100 border-slate-300';
    case Suit.PENTACLES: return 'from-amber-100 to-yellow-50 border-amber-200';
    case Suit.WANDS: return 'from-orange-100 to-red-50 border-orange-200';
    default: return 'from-indigo-100 to-purple-50 border-indigo-200'; // Major
  }
};

const getSuitIcon = (suit: Suit, className: string = "w-6 h-6") => {
  switch (suit) {
    case Suit.CUPS: return <Wine className={className} />;
    case Suit.SWORDS: return <Sword className={className} />;
    case Suit.PENTACLES: return <Coins className={className} />;
    case Suit.WANDS: return <Club className={className} />;
    default: return <Sparkles className={className} />;
  }
};

const getMajorArcanaIcon = (id: number, className: string = "w-full h-full") => {
  switch (id) {
    case 0: return <Wind className={className} />;
    case 1: return <Sparkles className={className} />;
    case 2: return <Scroll className={className} />;
    case 3: return <Crown className={className} />;
    case 4: return <Shield className={className} />;
    case 5: return <Key className={className} />;
    case 6: return <Heart className={className} />;
    case 7: return <Compass className={className} />;
    case 8: return <Flame className={className} />;
    case 9: return <Search className={className} />;
    case 10: return <RefreshCw className={className} />;
    case 11: return <Scale className={className} />;
    case 12: return <Anchor className={className} />;
    case 13: return <Skull className={className} />;
    case 14: return <Droplets className={className} />;
    case 15: return <Ghost className={className} />;
    case 16: return <Zap className={className} />;
    case 17: return <Star className={className} />;
    case 18: return <Moon className={className} />;
    case 19: return <Sun className={className} />;
    case 20: return <Megaphone className={className} />;
    case 21: return <Globe className={className} />;
    default: return <Sparkles className={className} />;
  }
};

const CardComponent: React.FC<CardComponentProps> = ({ card, isRevealed, onClick, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset states when card changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [card.id]);

  // Determine Folder Path Logic
  // User confirmed structure: /major/ and /minor/
  const folder = card.arcana === ArcanaType.MAJOR 
    ? 'major' 
    : 'minor'; 
    
  const imagePath = `/cards/${folder}/${card.imageFileName}`;

  // Determine fallback styles (used if image fails)
  const fallbackGradient = getSuitGradient(card.suit);
  const fallbackTextColor = getSuitColor(card.suit);

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
                 getSuitIcon(card.suit, "w-4 h-4 text-slate-700")
               )}
             </div>
           </div>

           {/* 2. Main Image Area */}
           <div className={`flex-1 relative overflow-hidden flex items-center justify-center bg-slate-200`}>
              
              {/* Image Layer */}
              {!imageError && (
                <img 
                  src={imagePath} 
                  alt={card.nameRu}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${card.isReversed ? 'rotate-180' : ''}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                      // Debugging log to see exactly what path is failing
                      console.error(`Failed to load image at: ${imagePath}`);
                      setImageError(true);
                  }}
                />
              )}

              {/* Fallback / Loading Layer (Visible if error or loading) */}
              {(imageError || !imageLoaded) && (
                <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br ${fallbackGradient} ${card.isReversed ? 'rotate-180' : ''}`}>
                  
                  {/* Central Icon */}
                  <div className={`w-20 h-20 sm:w-32 sm:h-32 mb-2 opacity-90 drop-shadow-sm ${fallbackTextColor}`}>
                    {card.arcana === ArcanaType.MAJOR 
                      ? getMajorArcanaIcon(card.number, "w-full h-full stroke-[1.5]") 
                      : getSuitIcon(card.suit, "w-full h-full stroke-[1.5]")
                    }
                  </div>
                  
                  {/* Decorative Elements for Minors to show quantity (e.g. 3 of cups) */}
                  {card.arcana === ArcanaType.MINOR && card.number <= 10 && (
                     <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap content-center justify-center gap-2 p-4">
                        {Array.from({ length: card.number }).map((_, i) => (
                           <div key={i} className="w-4 h-4">{getSuitIcon(card.suit, "w-full h-full")}</div>
                        ))}
                     </div>
                  )}

                  {card.isReversed && (
                     <div className="absolute top-2 right-2 rotate-180">
                        <RefreshCw className="w-4 h-4 text-red-500/50" />
                     </div>
                  )}
                </div>
              )}
           </div>

           {/* 3. Footer: Title */}
           <div className="w-full bg-[#dcd7cc] border-t-2 border-slate-300 py-2 px-1 flex flex-col items-center justify-center shrink-0 min-h-[3.5rem] relative z-10">
             <div className="flex items-center gap-1">
               <h3 className="font-serif font-bold text-xs sm:text-sm text-center leading-tight uppercase tracking-wide text-slate-900">
                 {card.nameRu}
               </h3>
             </div>
             {card.isReversed && (
               <span className="text-[8px] uppercase tracking-widest text-red-700/60 mt-0.5">Перевернутая</span>
             )}
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