import { ArcanaType, Spread, Suit, TarotCard } from './types';

// Helper to generate Minor Arcana
const generateMinorArcana = (suit: Suit, suitRu: string): TarotCard[] => {
  const cards: TarotCard[] = [];
  const ranks = [
    { name: 'Ace', nameRu: 'Туз', num: 1 },
    { name: 'Two', nameRu: 'Двойка', num: 2 },
    { name: 'Three', nameRu: 'Тройка', num: 3 },
    { name: 'Four', nameRu: 'Четверка', num: 4 },
    { name: 'Five', nameRu: 'Пятерка', num: 5 },
    { name: 'Six', nameRu: 'Шестерка', num: 6 },
    { name: 'Seven', nameRu: 'Семерка', num: 7 },
    { name: 'Eight', nameRu: 'Восьмерка', num: 8 },
    { name: 'Nine', nameRu: 'Девятка', num: 9 },
    { name: 'Ten', nameRu: 'Десятка', num: 10 },
    { name: 'Page', nameRu: 'Паж', num: 11 },
    { name: 'Knight', nameRu: 'Рыцарь', num: 12 },
    { name: 'Queen', nameRu: 'Королева', num: 13 },
    { name: 'King', nameRu: 'Король', num: 14 },
  ];

  ranks.forEach((rank) => {
    cards.push({
      id: `${rank.name.toLowerCase()}_of_${suit.toLowerCase()}`,
      name: `${rank.name} of ${suit}`,
      nameRu: `${rank.nameRu} ${suitRu}`,
      number: rank.num,
      suit: suit,
      arcana: ArcanaType.MINOR,
      description: `Энергия масти ${suitRu}, проявленная через ${rank.nameRu}`,
    });
  });
  return cards;
};

// Major Arcana Data
const majorArcanaData = [
  { id: 0, name: 'The Fool', nameRu: 'Шут', desc: 'Новые начала, невинность, спонтанность' },
  { id: 1, name: 'The Magician', nameRu: 'Маг', desc: 'Воля, мастерство, концентрация' },
  { id: 2, name: 'The High Priestess', nameRu: 'Жрица', desc: 'Интуиция, тайное знание' },
  { id: 3, name: 'The Empress', nameRu: 'Императрица', desc: 'Плодородие, женственность, природа' },
  { id: 4, name: 'The Emperor', nameRu: 'Император', desc: 'Власть, структура, авторитет' },
  { id: 5, name: 'The Hierophant', nameRu: 'Иерофант', desc: 'Традиция, духовное руководство' },
  { id: 6, name: 'The Lovers', nameRu: 'Влюбленные', desc: 'Любовь, гармония, выбор' },
  { id: 7, name: 'The Chariot', nameRu: 'Колесница', desc: 'Контроль, воля, победа' },
  { id: 8, name: 'Strength', nameRu: 'Сила', desc: 'Мужество, убеждение, влияние' },
  { id: 9, name: 'The Hermit', nameRu: 'Отшельник', desc: 'Самоанализ, поиск истины' },
  { id: 10, name: 'Wheel of Fortune', nameRu: 'Колесо Фортуны', desc: 'Судьба, поворотный момент' },
  { id: 11, name: 'Justice', nameRu: 'Справедливость', desc: 'Истина, закон, причинность' },
  { id: 12, name: 'The Hanged Man', nameRu: 'Повешенный', desc: 'Жертва, новая перспектива' },
  { id: 13, name: 'Death', nameRu: 'Смерть', desc: 'Конец, трансформация, переход' },
  { id: 14, name: 'Temperance', nameRu: 'Умеренность', desc: 'Баланс, терпение, цель' },
  { id: 15, name: 'The Devil', nameRu: 'Дьявол', desc: 'Зависимость, материализм' },
  { id: 16, name: 'The Tower', nameRu: 'Башня', desc: 'Катастрофа, внезапные перемены' },
  { id: 17, name: 'The Star', nameRu: 'Звезда', desc: 'Надежда, вера, цель' },
  { id: 18, name: 'The Moon', nameRu: 'Луна', desc: 'Иллюзия, страх, подсознание' },
  { id: 19, name: 'The Sun', nameRu: 'Солнце', desc: 'Радость, успех, позитив' },
  { id: 20, name: 'Judgement', nameRu: 'Страшный Суд', desc: 'Возрождение, призвание' },
  { id: 21, name: 'The World', nameRu: 'Мир', desc: 'Завершение, интеграция, путешествие' },
];

const majorArcanaCards: TarotCard[] = majorArcanaData.map((c) => ({
  id: `major_${c.id}`,
  name: c.name,
  nameRu: c.nameRu,
  number: c.id,
  suit: Suit.NONE,
  arcana: ArcanaType.MAJOR,
  description: c.desc,
}));

export const DECK: TarotCard[] = [
  ...majorArcanaCards,
  ...generateMinorArcana(Suit.WANDS, 'Жезлов'),
  ...generateMinorArcana(Suit.CUPS, 'Чаш'),
  ...generateMinorArcana(Suit.SWORDS, 'Мечей'),
  ...generateMinorArcana(Suit.PENTACLES, 'Пентаклей'),
];

export const SPREADS: Spread[] = [
  // 1 CARD
  {
    id: 'one_card_day',
    name: 'Карта Мгновенного Ответа',
    description: 'Идеально для простых вопросов "Да/Нет" или совета на день.',
    cardCount: 1,
    positions: [{ index: 0, name: 'Ответ', description: 'Суть ситуации или прямой ответ Оракула.' }],
  },
  // 2 CARDS
  {
    id: 'two_card_choice',
    name: 'Перекресток (Выбор)',
    description: 'Помогает выбрать между двумя вариантами действий.',
    cardCount: 2,
    positions: [
      { index: 0, name: 'Путь А', description: 'Что будет, если выбрать первый вариант.' },
      { index: 1, name: 'Путь Б', description: 'Что будет, если выбрать второй вариант.' },
    ],
  },
  // 3 CARDS
  {
    id: 'three_card_classic',
    name: 'Нить Времени',
    description: 'Классический анализ развития ситуации: Прошлое, Настоящее, Будущее.',
    cardCount: 3,
    positions: [
      { index: 0, name: 'Прошлое', description: 'Корни ситуации.' },
      { index: 1, name: 'Настоящее', description: 'Текущий момент.' },
      { index: 2, name: 'Будущее', description: 'Вероятный исход.' },
    ],
  },
  {
    id: 'three_card_psych',
    name: 'Разум, Душа, Тело',
    description: 'Анализ вашего состояния: мысли, чувства и действия.',
    cardCount: 3,
    positions: [
      { index: 0, name: 'Мысль', description: 'Что вы думаете об этом (рациональное).' },
      { index: 1, name: 'Чувство', description: 'Что вы чувствуете (эмоциональное).' },
      { index: 2, name: 'Действие', description: 'Что вы делаете (физическое проявление).' },
    ],
  },
  // 4 CARDS
  {
    id: 'four_card_elements',
    name: 'Крест Стихий',
    description: 'Анализ ситуации через призму четырех природных стихий.',
    cardCount: 4,
    positions: [
      { index: 0, name: 'Земля', description: 'Материальное, ресурсы, деньги.' },
      { index: 1, name: 'Воздух', description: 'Мысли, идеи, общение.' },
      { index: 2, name: 'Огонь', description: 'Страсть, энергия, действия.' },
      { index: 3, name: 'Вода', description: 'Чувства, отношения, интуиция.' },
    ],
  },
  // 5 CARDS
  {
    id: 'five_card_path',
    name: 'Путь к Цели',
    description: 'Стратегический расклад для достижения желаемого.',
    cardCount: 5,
    positions: [
      { index: 0, name: 'Вы сейчас', description: 'Ваша исходная позиция.' },
      { index: 1, name: 'Препятствие', description: 'Что мешает движению.' },
      { index: 2, name: 'Скрытый ресурс', description: 'Что поможет, но не очевидно.' },
      { index: 3, name: 'Шаг', description: 'Конкретное действие, которое нужно предпринять.' },
      { index: 4, name: 'Итог', description: 'Результат, если следовать совету.' },
    ],
  },
  // 7 CARDS
  {
    id: 'seven_card_chakras',
    name: 'Семь Чакр',
    description: 'Глубокая диагностика энергетического состояния и духовного здоровья.',
    cardCount: 7,
    positions: [
      { index: 0, name: 'Муладхара', description: 'Корни, выживание, безопасность.' },
      { index: 1, name: 'Свадхистана', description: 'Творчество, сексуальность, удовольствие.' },
      { index: 2, name: 'Манипура', description: 'Воля, власть, социальный успех.' },
      { index: 3, name: 'Анахата', description: 'Любовь, сострадание, принятие.' },
      { index: 4, name: 'Вишудха', description: 'Самовыражение, правда, общение.' },
      { index: 5, name: 'Аджна', description: 'Интуиция, мудрость, видение.' },
      { index: 6, name: 'Сахасрара', description: 'Связь с Космосом, духовность.' },
    ],
  },
  // 10 CARDS
  {
    id: 'ten_card_celtic',
    name: 'Кельтский Крест',
    description: 'Один из старейших и самых подробных раскладов для полного анализа судьбы.',
    cardCount: 10,
    positions: [
      { index: 0, name: 'Сигнификатор', description: 'Суть проблемы, вы в текущий момент.' },
      { index: 1, name: 'Встречный ветер', description: 'Что пересекает вас (помощь или помеха).' },
      { index: 2, name: 'Корона', description: 'Ваши осознанные цели и мысли.' },
      { index: 3, name: 'Корни', description: 'Бессознательное, прошлое, основа.' },
      { index: 4, name: 'Прошлое', description: 'Уходящие влияния.' },
      { index: 5, name: 'Будущее', description: 'Приближающиеся влияния.' },
      { index: 6, name: 'Вы сами', description: 'Ваше отношение к ситуации.' },
      { index: 7, name: 'Окружение', description: 'Как вас видят другие, внешняя среда.' },
      { index: 8, name: 'Надежды и Страхи', description: 'Ваши внутренние ожидания.' },
      { index: 9, name: 'Итог', description: 'Кульминация, окончательный результат.' },
    ],
  },
  // 12 CARDS
  {
    id: 'twelve_card_zodiac',
    name: 'Зодиакальный Круг',
    description: 'Масштабный прогноз по всем сферам жизни (домам гороскопа).',
    cardCount: 12,
    positions: [
      { index: 0, name: 'I Дом (Овен)', description: 'Личность, внешность, характер.' },
      { index: 1, name: 'II Дом (Телец)', description: 'Ресурсы, деньги, ценности.' },
      { index: 2, name: 'III Дом (Близнецы)', description: 'Общение, обучение, близкие поездки.' },
      { index: 3, name: 'IV Дом (Рак)', description: 'Дом, семья, корни.' },
      { index: 4, name: 'V Дом (Лев)', description: 'Творчество, любовь, дети, хобби.' },
      { index: 5, name: 'VI Дом (Дева)', description: 'Работа, здоровье, рутина.' },
      { index: 6, name: 'VII Дом (Весы)', description: 'Партнерство, брак, враги.' },
      { index: 7, name: 'VIII Дом (Скорпион)', description: 'Трансформация, кризисы, чужие деньги.' },
      { index: 8, name: 'IX Дом (Стрелец)', description: 'Философия, путешествия, высшее образование.' },
      { index: 9, name: 'X Дом (Козерог)', description: 'Карьера, статус, цель жизни.' },
      { index: 10, name: 'XI Дом (Водолей)', description: 'Друзья, планы, мечты, коллективы.' },
      { index: 11, name: 'XII Дом (Рыбы)', description: 'Тайны, подсознание, изоляция.' },
    ],
  }
];