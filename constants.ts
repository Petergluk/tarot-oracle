import { ArcanaType, Spread, Suit, TarotCard } from './types';

// Map logical IDs to specific filenames provided by user
// Corrections made based on loading errors: trying alternative naming conventions for failed cards
const IMAGE_MAP: Record<string, string> = {
  // Major Arcana
  'major_0': '01_the_fool.jpg',
  'major_1': '02_the_magician.jpg',
  'major_2': '03_the_high_priestess.jpg',
  'major_3': '04_the_empress.jpg',
  'major_4': '05_the_emperor.jpg',
  'major_5': '06_the_hierophant.jpg', 
  'major_6': '07_the_lovers.jpg',
  'major_7': '08_the_chariot.jpg',
  'major_8': '09_strength.jpg',
  'major_9': '10_the_hermit.jpg',
  'major_10': '11_wheel_of_fortune.jpg',
  'major_11': '12_justice.jpg',
  'major_12': '13_the_hanged_man.jpg',
  'major_13': '14_death.jpg',
  'major_14': '15_temperance.jpg',
  'major_15': '16_the_devil.jpg',
  'major_16': '17_the_tower.jpg',
  'major_17': '18_the_star.jpg',
  'major_18': '19_the_moon.jpg',
  'major_19': '20_the_sun.jpg',
  'major_20': '21_judgement.jpg',
  'major_21': '22_the_world.jpg',

  // Wands
  'ace_of_wands': '01_ace_of_wands.jpg',
  'two_of_wands': '02_two_of_wands.jpg',
  'three_of_wands': '03_wands_three.jpg', // Swapped based on failure
  'four_of_wands': '04_four_of_wands.jpg',
  'five_of_wands': '05_five_of_wands.jpg',
  'six_of_wands': '06_six_of_wands.jpg',
  'seven_of_wands': '07_seven_of_wands.jpg',
  'eight_of_wands': '08_wands_eight.jpg', // Swapped naming convention
  'nine_of_wands': '09_nine_of_wands.jpg',
  'ten_of_wands': '10_ten_of_wands.jpg',
  'page_of_wands': '11_page_of_wands.jpg',
  'knight_of_wands': '12_knight_of_wands.jpg',
  'queen_of_wands': '13_queen_of_wands.jpg',
  'king_of_wands': '14_king_of_wands.jpg',

  // Cups
  'ace_of_cups': '15_cups_ace.jpg', // Swapped based on failure
  'two_of_cups': '16_two_of_cups.jpg',
  'three_of_cups': '17_three_of_cups.jpg',
  'four_of_cups': '18_four_of_cups.jpg',
  'five_of_cups': '19_five_of_cups.jpg',
  'six_of_cups': '20_six_of_cups.jpg',
  'seven_of_cups': '21_seven_of_cups.jpg',
  'eight_of_cups': '22_eight_of_cups.jpg',
  'nine_of_cups': '23_nine_of_cups.jpg',
  'ten_of_cups': '24_ten_of_cups.jpg',
  'page_of_cups': '25_page_of_cups.jpg',
  'knight_of_cups': '26_knight_of_cups.jpg',
  'queen_of_cups': '27_queen_of_cups.jpg',
  'king_of_cups': '28_king_of_cups.jpg',

  // Swords
  'ace_of_swords': '29_swords_ace.jpg', // Swapped
  'two_of_swords': '30_swords_two.jpg',
  'three_of_swords': '31_swords_three.jpg', // Removed _png suffix and swapped
  'four_of_swords': '32_swords_four.jpg',
  'five_of_swords': '33_swords_five.jpg',
  'six_of_swords': '34_swords_six.jpg',
  'seven_of_swords': '35_swords_seven.jpg', // Swapped
  'eight_of_swords': '36_eight_of_swords.jpg',
  'nine_of_swords': '37_swords_nine.jpg', // Swapped based on failure
  'ten_of_swords': '38_swords_ten.jpg',
  'page_of_swords': '39_swords_page.jpg', // Swapped
  'knight_of_swords': '40_swords_knight.jpg',
  'queen_of_swords': '41_swords_queen.jpg',
  'king_of_swords': '42_king_of_swords.jpg', // Swapped

  // Pentacles
  'ace_of_pentacles': '43_ace_of_pentacles.jpg',
  'two_of_pentacles': '44_pentacles_two.jpg',
  'three_of_pentacles': '45_pentacles_three.jpg', // Swapped based on failure
  'four_of_pentacles': '46_pentacles_four.jpg',
  'five_of_pentacles': '47_pentacles_five.jpg',
  'six_of_pentacles': '48_six_of_pentacles.jpg',
  'seven_of_pentacles': '49_pentacles_seven.jpg',
  'eight_of_pentacles': '50_eight_of_pentacles.jpg',
  'nine_of_pentacles': '51_nine_of_pentacles.jpg',
  'ten_of_pentacles': '52_pentacles_ten.jpg',
  'page_of_pentacles': '53_page_of_pentacles.jpg', // Swapped
  'knight_of_pentacles': '54_knight_of_pentacles.jpg', // Swapped
  'queen_of_pentacles': '55_queen_of_pentacles.jpg', // Swapped
  'king_of_pentacles': '56_pentacles_king.jpg'
};

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
    const id = `${rank.name.toLowerCase()}_of_${suit.toLowerCase()}`;
    cards.push({
      id: id,
      name: `${rank.name} of ${suit}`,
      nameRu: `${rank.nameRu} ${suitRu}`,
      number: rank.num,
      suit: suit,
      arcana: ArcanaType.MINOR,
      description: `Энергия масти ${suitRu}, проявленная через ${rank.nameRu}`,
      imageFileName: IMAGE_MAP[id] || `${id}.jpg`
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

const majorArcanaCards: TarotCard[] = majorArcanaData.map((c) => {
  const id = `major_${c.id}`;
  return {
    id: id,
    name: c.name,
    nameRu: c.nameRu,
    number: c.id,
    suit: Suit.NONE,
    arcana: ArcanaType.MAJOR,
    description: c.desc,
    imageFileName: IMAGE_MAP[id] || `${id}.jpg`
  };
});

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