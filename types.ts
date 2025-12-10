export enum ArcanaType {
  MAJOR = 'Major',
  MINOR = 'Minor'
}

export enum Suit {
  WANDS = 'Wands', // Жезлы
  CUPS = 'Cups',   // Чаши
  SWORDS = 'Swords', // Мечи
  PENTACLES = 'Pentacles', // Пентакли
  NONE = 'None' // For Major Arcana
}

export interface TarotCard {
  id: string;
  name: string;
  nameRu: string;
  number: number;
  suit: Suit;
  arcana: ArcanaType;
  description: string; // Brief keyword description
  imagePrompt?: string; // For potential image generation, unused for now
}

export interface SpreadPosition {
  index: number;
  name: string;
  description: string;
}

export interface Spread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: SpreadPosition[];
}

export interface DrawnCard extends TarotCard {
  positionIndex: number;
  isReversed: boolean; // Tarot cards can be reversed
}

export type AppState = 'intro' | 'input' | 'shuffling' | 'revealing' | 'reading';