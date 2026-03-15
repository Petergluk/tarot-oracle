import { ArcanaType, Spread, Suit, TarotCard } from './types';

// Полная карта соответствия ID карт к именам файлов
// Основана на предоставленном списке файлов пользователя
const IMAGE_MAP: Record<string, string> = {
  // --- MAJOR ARCANA (0-21) ---
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

  // --- WANDS (01-14) ---
  'ace_of_wands': '01_ace_of_wands.jpg',
  'two_of_wands': '02_two_of_wands.jpg',
  'three_of_wands': '03_three_of_wands.jpg',
  'four_of_wands': '04_four_of_wands.jpg',
  'five_of_wands': '05_five_of_wands.jpg',
  'six_of_wands': '06_six_of_wands.jpg',
  'seven_of_wands': '07_seven_of_wands.jpg',
  'eight_of_wands': '08_eight_of_wands.jpg',
  'nine_of_wands': '09_nine_of_wands.jpg',
  'ten_of_wands': '10_ten_of_wands.jpg',
  'page_of_wands': '11_page_of_wands.jpg',
  'knight_of_wands': '12_knight_of_wands.jpg',
  'queen_of_wands': '13_queen_of_wands.jpg',
  'king_of_wands': '14_king_of_wands.jpg',

  // --- CUPS (15-28) ---
  'ace_of_cups': '15_ace_of_cups.jpg',
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

  // --- SWORDS (29-42) - Mixed naming convention ---
  'ace_of_swords': '29_ace_of_swords.jpg',
  'two_of_swords': '30_swords_two.jpg',         // Irregular
  'three_of_swords': '31_swords_three.jpg',
  'four_of_swords': '32_swords_four.jpg',       // Irregular
  'five_of_swords': '33_swords_five.jpg',       // Irregular
  'six_of_swords': '34_swords_six.jpg',         // Irregular
  'seven_of_swords': '35_seven_of_swords.jpg',  // Back to standard?
  'eight_of_swords': '36_eight_of_swords.jpg',
  'nine_of_swords': '37_nine_of_swords.jpg',
  'ten_of_swords': '38_swords_ten.jpg',         // Irregular
  'page_of_swords': '39_page_of_swords.jpg',
  'knight_of_swords': '40_swords_knight.jpg',   // Irregular
  'queen_of_swords': '41_swords_queen.jpg',     // Irregular
  'king_of_swords': '42_swords_king.jpg',       // Irregular

  // --- PENTACLES (43-56) - Mixed naming convention ---
  'ace_of_pentacles': '43_ace_of_pentacles.jpg',
  'two_of_pentacles': '44_pentacles_two.jpg',     // Irregular
  'three_of_pentacles': '45_three_of_pentacles.jpg',
  'four_of_pentacles': '46_pentacles_four.jpg',   // Irregular
  'five_of_pentacles': '47_pentacles_five.jpg',   // Irregular
  'six_of_pentacles': '48_six_of_pentacles.jpg',
  'seven_of_pentacles': '49_pentacles_seven.jpg', // Irregular
  'eight_of_pentacles': '50_eight_of_pentacles.jpg',
  'nine_of_pentacles': '51_nine_of_pentacles.jpg',
  'ten_of_pentacles': '52_pentacles_ten.jpg',     // Irregular
  'page_of_pentacles': '53_pentacles_page.jpg',   // Irregular
  'knight_of_pentacles': '54_pentacles_knight.jpg',// Irregular
  'queen_of_pentacles': '55_pentacles_queen.jpg',  // Irregular
  'king_of_pentacles': '56_pentacles_king.jpg'     // Irregular
};

const SUIT_MEANINGS: Record<Suit, { upright: string; reversed: string }> = {
  [Suit.WANDS]: {
    upright: 'рост инициативы, смелость и движение к цели',
    reversed: 'расфокус, выгорание или импульсивные шаги без стратегии'
  },
  [Suit.CUPS]: {
    upright: 'эмоции, близость, эмпатия и внутреннее удовлетворение',
    reversed: 'эмоциональные качели, идеализация или закрытость чувств'
  },
  [Suit.SWORDS]: {
    upright: 'ясность ума, решения, границы и честный взгляд',
    reversed: 'тревожные мысли, внутренний конфликт или жесткость выводов'
  },
  [Suit.PENTACLES]: {
    upright: 'практичность, ресурсы, стабильность и материальный результат',
    reversed: 'застой в делах, тревога о деньгах или неверная опора'
  },
  [Suit.NONE]: {
    upright: 'глубокий архетипический сдвиг и важный жизненный урок',
    reversed: 'сопротивление переменам или непрожитый внутренний этап'
  }
};

const RANK_MEANINGS: Record<string, { upright: string; reversed: string }> = {
  Ace: {
    upright: 'импульс нового цикла и чистый потенциал',
    reversed: 'потенциал есть, но запуск блокируется сомнениями'
  },
  Two: {
    upright: 'выбор, баланс и согласование противоположностей',
    reversed: 'колебания, откладывание решения и внутренний раскол'
  },
  Three: {
    upright: 'развитие, объединение сил и первые видимые результаты',
    reversed: 'задержка роста, слабая координация или разочарование'
  },
  Four: {
    upright: 'структура, опора и закрепление достигнутого',
    reversed: 'жесткость, застой или хрупкая стабильность'
  },
  Five: {
    upright: 'поворот через кризис, конкуренцию или нехватку',
    reversed: 'выход из турбулентности и поиск новой опоры'
  },
  Six: {
    upright: 'гармонизация, обмен и восстановление равновесия',
    reversed: 'дисбаланс, долгие хвосты прошлого или неравный обмен'
  },
  Seven: {
    upright: 'проверка стратегии, зрелый выбор и защита позиции',
    reversed: 'сомнения в пути, самообман или рассеянность'
  },
  Eight: {
    upright: 'интенсивный процесс, фокус и ускорение',
    reversed: 'перегруз, суета или торможение процесса'
  },
  Nine: {
    upright: 'сбор плодов, личная зрелость и итоговый рубеж',
    reversed: 'тревога перед финалом или неполное удовлетворение'
  },
  Ten: {
    upright: 'завершение цикла и итог накопленного опыта',
    reversed: 'переутомление, избыточный груз или страх отпускать'
  },
  Page: {
    upright: 'новости, обучение и свежий взгляд ученика',
    reversed: 'незрелый подход, распыление или непринятое сообщение'
  },
  Knight: {
    upright: 'движение, решительность и активная реализация',
    reversed: 'рывки без курса, конфликтность или упрямый форсаж'
  },
  Queen: {
    upright: 'зрелое управление ресурсом, эмпатия и внутренняя власть',
    reversed: 'контроль из страха, закрытость или эмоциональная усталость'
  },
  King: {
    upright: 'ответственность, мастерство и устойчивое лидерство',
    reversed: 'жесткость, перегиб контроля или неустойчивая власть'
  }
};

const buildMinorDescription = (rankName: string, suit: Suit): { upright: string; reversed: string } => {
  const rank = RANK_MEANINGS[rankName];
  const suitMeaning = SUIT_MEANINGS[suit];

  return {
    upright: `${rank.upright}. В этой масти это про ${suitMeaning.upright}.`,
    reversed: `${rank.reversed}. Теневая сторона масти проявляется как ${suitMeaning.reversed}.`
  };
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

    // Explicitly use the map.
    const fileName = IMAGE_MAP[id] || `${id}.jpg`;

    const meanings = buildMinorDescription(rank.name, suit);

    cards.push({
      id: id,
      name: `${rank.name} of ${suit}`,
      nameRu: `${rank.nameRu} ${suitRu}`,
      number: rank.num,
      suit: suit,
      arcana: ArcanaType.MINOR,
      description: meanings.upright,
      reversedDescription: meanings.reversed,
      imageFileName: fileName
    });
  });
  return cards;
};

// Major Arcana Data
const majorArcanaData = [
  {
    id: 0,
    name: 'The Fool',
    nameRu: 'Шут',
    desc: 'Нулевой аркан о смелом шаге в неизвестность, доверии жизни и начале нового пути без лишнего багажа.',
    reversedDesc: 'Риск без опоры, инфантильность или страх сделать шаг; важно соединить свободу с осознанностью.'
  },
  {
    id: 1,
    name: 'The Magician',
    nameRu: 'Маг',
    desc: 'Сила намерения, фокус и способность превращать идею в результат через личное мастерство.',
    reversedDesc: 'Манипуляция, распыление ресурса или неуверенность в своих инструментах; нужна честная концентрация.'
  },
  {
    id: 2,
    name: 'The High Priestess',
    nameRu: 'Жрица',
    desc: 'Тихое знание, интуиция и глубокое понимание процессов, которые еще не проявились внешне.',
    reversedDesc: 'Игнор интуиции, путаница сигналов или уход в пассивность; пора вернуть контакт с внутренним голосом.'
  },
  {
    id: 3,
    name: 'The Empress',
    nameRu: 'Императрица',
    desc: 'Рост, плодородие и бережное созидание: идеи и отношения получают питание и начинают цвести.',
    reversedDesc: 'Гиперопека, застой комфорта или творческий блок; важно восстановить живой поток и заботу о себе.'
  },
  {
    id: 4,
    name: 'The Emperor',
    nameRu: 'Император',
    desc: 'Структура, ответственность и зрелая опора, которая помогает удерживать курс и защищать границы.',
    reversedDesc: 'Жесткий контроль, упрямство или потеря дисциплины; нужно сбалансировать силу и гибкость.'
  },
  {
    id: 5,
    name: 'The Hierophant',
    nameRu: 'Иерофант',
    desc: 'Традиция, обучение и ценностный ориентир: поиск правильного пути через смысл и опыт старших.',
    reversedDesc: 'Слепое следование правилам или бунт без основания; стоит найти собственную зрелую позицию.'
  },
  {
    id: 6,
    name: 'The Lovers',
    nameRu: 'Влюбленные',
    desc: 'Выбор сердцем и согласование ценностей, где важна честность с собой и партнерство на равных.',
    reversedDesc: 'Разрыв ценностей, колебания или зависимость от одобрения; пора выбрать осознанно, а не из страха.'
  },
  {
    id: 7,
    name: 'The Chariot',
    nameRu: 'Колесница',
    desc: 'Воля в действии: управление импульсами, концентрация и уверенное движение к цели.',
    reversedDesc: 'Потеря управления, суета или конфликт направлений; сначала выровнять курс, потом ускоряться.'
  },
  {
    id: 8,
    name: 'Strength',
    nameRu: 'Сила',
    desc: 'Мягкая внутренняя мощь: выдержка, самообладание и умение приручать хаос без насилия.',
    reversedDesc: 'Сомнение в себе, вспышки раздражения или выгорание; ресурс восстанавливается через бережную дисциплину.'
  },
  {
    id: 9,
    name: 'The Hermit',
    nameRu: 'Отшельник',
    desc: 'Пауза для переоценки: поиск истины, тишины и внутреннего компаса перед следующим шагом.',
    reversedDesc: 'Изоляция ради избегания, застревание в сомнениях или отказ слышать себя; нужна живая связь с миром.'
  },
  {
    id: 10,
    name: 'Wheel of Fortune',
    nameRu: 'Колесо Фортуны',
    desc: 'Смена цикла, поворот судьбы и шанс поймать волну времени, если быть гибким и внимательным.',
    reversedDesc: 'Ощущение застревания, повтор старых сценариев или сопротивление переменам; важно менять паттерн.'
  },
  {
    id: 11,
    name: 'Justice',
    nameRu: 'Справедливость',
    desc: 'Честный баланс причин и следствий: ясность, ответственность и трезвая оценка фактов.',
    reversedDesc: 'Субъективность, самооправдание или перекос в оценках; нужно вернуть объективность и меры.'
  },
  {
    id: 12,
    name: 'The Hanged Man',
    nameRu: 'Повешенный',
    desc: 'Пауза ради нового взгляда: отпускание старого контроля открывает нестандартное решение.',
    reversedDesc: 'Бесплодная жертва, затяжная пауза или упрямство; пора перестать висеть между и выбрать действие.'
  },
  {
    id: 13,
    name: 'Death',
    nameRu: 'Смерть',
    desc: 'Глубокая трансформация: завершение старой формы, чтобы освободить место новому этапу.',
    reversedDesc: 'Страх отпускания, затянутая агония старого или отрицание перемен; принятие ускоряет обновление.'
  },
  {
    id: 14,
    name: 'Temperance',
    nameRu: 'Умеренность',
    desc: 'Алхимия баланса: постепенная настройка ритма, исцеление и гармоничное объединение противоположностей.',
    reversedDesc: 'Крайности, спешка или внутренний дисбаланс; нужно вернуться к умеренному темпу и целостности.'
  },
  {
    id: 15,
    name: 'The Devil',
    nameRu: 'Дьявол',
    desc: 'Привязки, соблазны и цепи привычек: карта показывает, где власть отдана страху или зависимости.',
    reversedDesc: 'Освобождение из зависимости, разрыв токсичного паттерна или первый шаг к зрелой свободе.'
  },
  {
    id: 16,
    name: 'The Tower',
    nameRu: 'Башня',
    desc: 'Резкий слом иллюзий: правда врывается внезапно, разрушая неустойчивую конструкцию ради обновления.',
    reversedDesc: 'Внутренний кризис, откладывание неизбежного или мягкий демонтаж старого; перемена все равно назрела.'
  },
  {
    id: 17,
    name: 'The Star',
    nameRu: 'Звезда',
    desc: 'Надежда, восстановление и чистый ориентир будущего после сложного периода.',
    reversedDesc: 'Угасшая вера, апатия или недоверие к пути; важно вернуть контакт с мечтой и смыслом.'
  },
  {
    id: 18,
    name: 'The Moon',
    nameRu: 'Луна',
    desc: 'Туман подсознания: тонкая чувствительность, сны и неочевидные мотивы, требующие бережной проверки.',
    reversedDesc: 'Выход из иллюзии, но через тревогу и путаницу; нужна факт-проверка и заземление.'
  },
  {
    id: 19,
    name: 'The Sun',
    nameRu: 'Солнце',
    desc: 'Ясность, радость и жизненная сила: успех приходит через открытость и честное проявление себя.',
    reversedDesc: 'Тень эго, выгорание от перегруза или временное затмение; свет возвращается через простой ритм.'
  },
  {
    id: 20,
    name: 'Judgement',
    nameRu: 'Страшный Суд',
    desc: 'Пробуждение и зов предназначения: время подвести итоги и подняться на новый уровень осознанности.',
    reversedDesc: 'Страх оценки, застревание в вине или откладывание важного решения; пора ответить на внутренний зов.'
  },
  {
    id: 21,
    name: 'The World',
    nameRu: 'Мир',
    desc: 'Целостность и завершение большого цикла: признание результата и переход к следующему горизонту.',
    reversedDesc: 'Незакрытый цикл, чувство незавершенности или отложенный финальный шаг; важно поставить точку.'
  },
];

const majorArcanaCards: TarotCard[] = majorArcanaData.map((c) => {
  const id = `major_${c.id}`;
  const fileName = IMAGE_MAP[id] || `${id}.jpg`;

  return {
    id: id,
    name: c.name,
    nameRu: c.nameRu,
    number: c.id,
    suit: Suit.NONE,
    arcana: ArcanaType.MAJOR,
    description: c.desc,
    reversedDescription: c.reversedDesc,
    imageFileName: fileName
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
  {
    id: 'three_card_choice',
    name: 'Три Пути',
    description: 'Сравнение трех возможных вариантов действий.',
    cardCount: 3,
    positions: [
      { index: 0, name: 'Вариант A', description: 'К чему приведет первый вариант.' },
      { index: 1, name: 'Вариант B', description: 'К чему приведет второй вариант.' },
      { index: 2, name: 'Вариант C', description: 'К чему приведет третий вариант.' },
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
  {
    id: 'four_card_choice_advice',
    name: 'Три Варианта + Совет',
    description: 'Подробный расклад для выбора из трех вариантов с итоговым советом.',
    cardCount: 4,
    positions: [
      { index: 0, name: 'Вариант A', description: 'Сильные/слабые стороны первого выбора.' },
      { index: 1, name: 'Вариант B', description: 'Сильные/слабые стороны второго выбора.' },
      { index: 2, name: 'Вариант C', description: 'Сильные/слабые стороны третьего выбора.' },
      { index: 3, name: 'Совет Оракула', description: 'Какой путь мудрее выбрать сейчас.' },
    ],
  },
  {
    id: 'four_card_relationships',
    name: 'Отношения: Диалог Сердец',
    description: 'Понимание динамики пары и шага к гармонии.',
    cardCount: 4,
    positions: [
      { index: 0, name: 'Я в отношениях', description: 'Ваш текущий вклад и состояние.' },
      { index: 1, name: 'Партнер', description: 'Состояние и намерения другой стороны.' },
      { index: 2, name: 'Динамика', description: 'Что реально происходит между вами.' },
      { index: 3, name: 'Шаг к гармонии', description: 'Практический совет для улучшения связи.' },
    ],
  },
  {
    id: 'four_card_risk_decision',
    name: 'Риск и Решение',
    description: 'Оценка решения через выгоды, риски и скрытые факторы.',
    cardCount: 4,
    positions: [
      { index: 0, name: 'Потенциал', description: 'Что можно выиграть.' },
      { index: 1, name: 'Риск', description: 'Что можно потерять или недооценить.' },
      { index: 2, name: 'Скрытый фактор', description: 'Невидимое влияние на исход.' },
      { index: 3, name: 'Решение', description: 'Как действовать мудро сейчас.' },
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
  {
    id: 'five_card_career_choice',
    name: 'Карьерный Выбор',
    description: 'Сравнение карьерных путей и определение лучшего следующего шага.',
    cardCount: 5,
    positions: [
      { index: 0, name: 'Текущая точка', description: 'Ваша профессиональная позиция сейчас.' },
      { index: 1, name: 'Путь A', description: 'Перспектива первого варианта.' },
      { index: 2, name: 'Путь B', description: 'Перспектива второго варианта.' },
      { index: 3, name: 'Ключевой ресурс', description: 'Что даст преимущество в решении.' },
      { index: 4, name: 'Оптимальный шаг', description: 'Что делать в ближайшее время.' },
    ],
  },
  {
    id: 'five_card_mission_ray',
    name: 'Луч Миссии',
    description: 'Расклад о предназначении: от внутреннего дара к реализации в мире.',
    cardCount: 5,
    positions: [
      { index: 0, name: 'Ядро дара', description: 'Ваш главный врожденный талант.' },
      { index: 1, name: 'Урок души', description: 'Ключевая задача личностного роста.' },
      { index: 2, name: 'Тень/блок', description: 'Что мешает раскрытию миссии.' },
      { index: 3, name: 'Канал служения', description: 'Где и как ваш дар приносит пользу людям.' },
      { index: 4, name: 'Лучший вектор', description: 'Направление, в котором стоит действовать сейчас.' },
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
