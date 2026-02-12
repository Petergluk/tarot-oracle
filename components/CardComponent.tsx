// components/CardComponent.tsx
// v3.3.0 @ 2025-05-21
import React, { useState, useEffect } from 'react';
import { DrawnCard, Suit, ArcanaType } from '../types';
import { 
  Sparkles, Moon, Sun, Sword, Wine, Coins, Club, 
  Wind, Scroll, Crown, Shield, Key, Heart, Compass, 
  Flame, Search, RefreshCw, Scale, Anchor, Skull, 
  Droplets, Ghost, Zap, Star, Megaphone, Globe
} from 'lucide-react';

interface CardComponentProps {
  card: DrawnCard;
  isRevealed: boolean;
  onClick?: () => void;
  className?: string;
}

const getSuitGradient = (suit: Suit) => {
  switch (suit) {
    case Suit.CUPS: return 'from-blue-200 to-cyan-50';
    case Suit.SWORDS: return 'from-slate-300 to-gray-100';
    case Suit.PENTACLES: return 'from-amber-200 to-yellow-50';
    case Suit.WANDS: return 'from-orange-200 to-red-50';
    default: return 'from-indigo-200 to-purple-50'; 
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
  const icons = [Wind, Sparkles, Scroll, Crown, Shield, Key, Heart, Compass, Flame, Search, RefreshCw, Scale, Anchor, Skull, Droplets, Ghost, Zap, Star, Moon, Sun, Megaphone, Globe];
  const Icon = icons[id] || Sparkles;
  return <Icon className={className} />;
};


const bundledCardImages = import.meta.glob('../public/cards/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const bundledCardsByRelativePath = Object.entries(bundledCardImages).reduce<Record<string, string>>((acc, [key, url]) => {
  const marker = '/public/cards/';
  const markerIndex = key.indexOf(marker);
  if (markerIndex >= 0) {
    const relativePath = key.slice(markerIndex + marker.length);
    acc[relativePath] = url;
  }
  return acc;
}, {});


const isTarotImageDebugEnabled = () => {
  if (typeof window === 'undefined') return false;
  return window.location.search.includes('debugImages=1') || localStorage.getItem('debugTarotImages') === '1';
};

const probeImageUrl = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, status: 'network_error', error: error instanceof Error ? error.message : String(error) };
  }
};

const CardComponent: React.FC<CardComponentProps> = ({ card, isRevealed, onClick, className = '' }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setIsImageLoaded(false);
    setImageError(false);
  }, [card.id]);

  const folder = card.arcana === ArcanaType.MAJOR ? 'major' : 'minor';
  const imageRelativePath = `${folder}/${card.imageFileName}`;
  const bundledImagePath = bundledCardsByRelativePath[imageRelativePath];
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const staticImagePath = `${normalizedBaseUrl}cards/${folder}/${card.imageFileName}`;
  const imagePath = bundledImagePath || staticImagePath;

  useEffect(() => {
    if (!isRevealed || !isTarotImageDebugEnabled()) return;

    const runDiagnostics = async () => {
      const [resolvedProbe, staticProbe] = await Promise.all([
        probeImageUrl(imagePath),
        imagePath !== staticImagePath ? probeImageUrl(staticImagePath) : Promise.resolve(null),
      ]);

      console.info('[Tarot image][diagnostics]', {
        cardId: card.id,
        cardName: card.nameRu,
        imageFileName: card.imageFileName,
        bundledImagePath: bundledImagePath || null,
        staticImagePath,
        resolvedImagePath: imagePath,
        probes: {
          resolved: resolvedProbe,
          static: staticProbe,
        },
      });
    };

    runDiagnostics();
  }, [
    isRevealed,
    card.id,
    card.nameRu,
    card.imageFileName,
    bundledImagePath,
    staticImagePath,
    imagePath,
  ]);

  return (
    <div 
      className={`group w-32 h-52 sm:w-48 sm:h-80 cursor-pointer perspective-1000 ${className}`}
      onClick={onClick}
    >
      <div className={`relative w-full h-full duration-700 transition-transform transform-style-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
        
        {/* --- BACK --- */}
        <div className="absolute inset-0 backface-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl flex items-center justify-center overflow-hidden z-10">
           <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-black"></div>
           <Moon className="w-12 h-12 text-amber-700/50 animate-pulse drop-shadow-[0_0_15px_rgba(180,83,9,0.3)]" />
        </div>

        {/* --- FRONT --- */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-lg bg-[#e8e4d9] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 z-10">
           
           {/* Card Top Strip */}
           <div className="w-full px-2 py-1 flex justify-between items-center border-b border-slate-300 bg-[#dcd7cc] h-8 shrink-0">
             <span className="text-xs font-bold font-serif opacity-70">{card.number}</span>
             <div className="opacity-50">
                {card.arcana === ArcanaType.MAJOR ? (
                    <span className="text-[8px] uppercase tracking-tighter font-serif">Arcana</span>
                ) : getSuitIcon(card.suit, "w-4 h-4")}
             </div>
           </div>

           {/* Content Area */}
           <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-200">
              
              {/* Fallback Layer (Always there, visible if image fails or loading) */}
              <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getSuitGradient(card.suit)} opacity-30`}>
                <div className="w-20 h-20 text-slate-400">
                    {card.arcana === ArcanaType.MAJOR ? getMajorArcanaIcon(card.number) : getSuitIcon(card.suit, "w-full h-full")}
                </div>
              </div>

              {/* Real Card Image */}
              {!imageError && (
                <img 
                  src={imagePath} 
                  alt={card.nameRu}
                  onLoad={() => setIsImageLoaded(true)}
                  onError={(event) => {
                    console.error('[Tarot image] failed to load', {
                      cardId: card.id,
                      imageFileName: card.imageFileName,
                      attemptedSrc: event.currentTarget.currentSrc || imagePath,
                    });
                    setImageError(true);
                  }}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-20 ${isImageLoaded ? 'opacity-100' : 'opacity-0'} ${card.isReversed ? 'rotate-180' : ''}`}
                />
              )}
           </div>

           {/* Card Name Footer */}
           <div className="w-full bg-[#dcd7cc] border-t-2 border-slate-300 py-2 px-1 flex flex-col items-center justify-center shrink-0 min-h-[3.5rem]">
             <h3 className="font-serif font-bold text-[11px] sm:text-xs text-center leading-tight uppercase tracking-tight text-slate-800">
               {card.nameRu}
             </h3>
             {card.isReversed && (
                <span className="text-[8px] uppercase tracking-widest text-red-800/60 font-bold mt-1">Перевернутая</span>
             )}
           </div>

        </div>
      </div>
    </div>
  );
};

export default CardComponent;
