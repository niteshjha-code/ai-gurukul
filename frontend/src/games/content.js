// Game content, built entirely in the browser: no AI or API calls.
// A "pack" is what every word game plays with: { id, title, subject, storyId, words, sequence }.

export const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Shuffle, but never hand back the original order (when that is possible).
export function shuffleChanged(list, same = (a, b) => a === b) {
  if (list.length < 2) return [...list];
  for (let tries = 0; tries < 12; tries++) {
    const out = shuffle(list);
    if (out.some((x, i) => !same(x, list[i]))) return out;
  }
  return [...list.slice(1), list[0]];
}

export const GAMES = [
  {
    id: 'memory',
    name: 'Memory Match',
    emoji: '🃏',
    color: '#2BB8BA',
    dark: '#13797B',
    skill: 'Words',
    blurb: 'Flip the cards and match each word to its meaning.',
    howTo: ['Tap a card to flip it over.', 'Find a word and the card that tells its meaning.', 'Match them all with as few tries as you can!'],
  },
  {
    id: 'scramble',
    name: 'Word Scramble',
    emoji: '🔤',
    color: '#8B5CF6',
    dark: '#5B34C2',
    skill: 'Spelling',
    blurb: 'The letters got jumbled! Use the clue to fix the word.',
    howTo: ['Read the clue to guess the word.', 'Tap the letters (or type them) in the right order.', 'Stuck? Use a hint, but solving it alone scores more.'],
  },
  {
    id: 'order',
    name: 'Put in Order',
    emoji: '🧩',
    color: '#F68B2F',
    dark: '#B4560E',
    skill: 'Reading',
    blurb: 'What happened first? Put the steps in the right order.',
    howTo: ['Read all the cards.', 'Tap the card that comes first, then the next one.', 'Get it right without mistakes for 3 stars!'],
  },
  {
    id: 'catch',
    name: 'Fruit Catch',
    emoji: '🍌',
    color: '#2E9A1C',
    dark: '#1D6B10',
    skill: 'Words',
    blurb: 'Move the basket to catch the fruit with the right word.',
    howTo: ['Read the clue at the top.', 'Move the basket with your finger, mouse or the arrow keys.', 'Catch the right fruit. Wrong fruits cost a heart!'],
  },
  {
    id: 'math',
    name: 'Monkey Math',
    emoji: '🐒',
    color: '#EC5B8E',
    dark: '#A82A58',
    skill: 'Maths',
    blurb: 'Solve as many sums as you can in 60 seconds!',
    howTo: ['Pick your level.', 'Tap the right answer (or press 1, 2, 3 or 4).', 'Get answers right in a row for a banana combo!'],
    needsContent: false,
  },
];

export const gameById = (id) => GAMES.find((g) => g.id === id);

// Built-in word packs so children can play before they have made any stories.
export const PACKS = [
  {
    id: 'science',
    subject: 'science',
    title: 'Water & Weather',
    words: [
      { word: 'evaporate', meaning: 'to change from a liquid into a gas called vapour', example: 'Puddles evaporate when the Sun warms them.' },
      { word: 'condense', meaning: 'to change from a gas back into tiny drops of liquid', example: 'Steam will condense into drops on a cold mirror.' },
      { word: 'magnet', meaning: 'an object that pulls things made of iron towards it', example: 'The magnet picked up all the paper clips.' },
      { word: 'gravity', meaning: 'the pull that makes things fall down to the ground', example: 'When you drop a ball, gravity pulls it down.' },
      { word: 'shadow', meaning: 'a dark shape made when something blocks light', example: 'In the evening my shadow is very long.' },
      { word: 'energy', meaning: 'the power that makes things move, grow or work', example: 'Food gives our bodies energy to run and play.' },
    ],
    sequence: {
      title: 'The water cycle',
      steps: [
        'The Sun warms the water in seas, rivers and lakes.',
        'The water evaporates and rises into the sky as vapour.',
        'High up, the vapour cools and makes tiny drops: clouds!',
        'The drops join together and fall as rain.',
        'The rain flows back into rivers and seas.',
      ],
    },
  },
  {
    id: 'math',
    subject: 'math',
    title: 'Shapes & Numbers',
    words: [
      { word: 'triangle', meaning: 'a shape with 3 straight sides and 3 corners', example: 'A slice of pizza looks like a triangle.' },
      { word: 'circle', meaning: 'a perfectly round shape', example: 'A bicycle wheel is a circle.' },
      { word: 'double', meaning: 'to make something two times as much', example: 'If you double 4, you get 8.' },
      { word: 'half', meaning: 'one of two equal parts', example: 'I ate half of the apple and you ate the rest.' },
      { word: 'sum', meaning: 'the answer you get when you add numbers', example: 'The sum of 3 and 4 is 7.' },
      { word: 'even', meaning: 'a number you can share into two equal groups', example: 'Two, four and six are even numbers.' },
    ],
    sequence: {
      title: 'Smallest answer to biggest answer',
      steps: ['2 + 1', '2 × 3', '10 − 2', '5 + 6', '4 × 4'],
    },
  },
  {
    id: 'english',
    subject: 'english',
    title: 'Word Wizards',
    words: [
      { word: 'noun', meaning: 'a naming word for a person, place or thing', example: 'The word tiger is a noun.' },
      { word: 'verb', meaning: 'a doing word, like run, jump or sing', example: 'The word jump is a verb.' },
      { word: 'adjective', meaning: 'a describing word, like fluffy or tall', example: 'In a fluffy cat, fluffy is an adjective.' },
      { word: 'opposite', meaning: 'a word that means the very different thing', example: 'Hot is the opposite of cold.' },
      { word: 'rhyme', meaning: 'words that end with the same sound', example: 'Cat and hat rhyme with each other.' },
      { word: 'plural', meaning: 'the word for more than one of something', example: 'Apples is the plural of apple.' },
    ],
    sequence: {
      title: 'ABC order',
      steps: ['ant', 'bear', 'bee', 'camel', 'cat'],
    },
  },
  {
    id: 'space',
    subject: 'space',
    title: 'Space Explorers',
    words: [
      { word: 'planet', meaning: 'a huge round world that travels around a star', example: 'Earth is the planet we live on.' },
      { word: 'orbit', meaning: 'the path something takes as it goes around a planet or star', example: 'The Moon takes about a month to orbit the Earth.' },
      { word: 'astronaut', meaning: 'a person trained to travel into space', example: 'The astronaut floated inside the space station.' },
      { word: 'comet', meaning: 'a ball of ice and dust with a long glowing tail', example: 'We saw a comet with a bright tail.' },
      { word: 'telescope', meaning: 'a tool that makes faraway things look closer', example: 'Through the telescope, Saturn looked amazing.' },
      { word: 'crater', meaning: 'a round hollow made when a space rock crashes', example: 'A big crater sits on the Moon.' },
    ],
    sequence: {
      title: 'Planets, nearest the Sun first',
      steps: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter'],
    },
  },
  {
    id: 'animals',
    subject: 'animals',
    title: 'Animal Friends',
    words: [
      { word: 'habitat', meaning: 'the natural home of a plant or animal', example: 'The forest is the tiger’s habitat.' },
      { word: 'herbivore', meaning: 'an animal that eats only plants', example: 'A cow is a herbivore.' },
      { word: 'pollen', meaning: 'a yellow powder that flowers make', example: 'Bees carry pollen from flower to flower.' },
      { word: 'camouflage', meaning: 'colours or patterns that help an animal hide', example: 'A chameleon uses camouflage to hide on a leaf.' },
      { word: 'nocturnal', meaning: 'awake at night and asleep in the day', example: 'Owls are nocturnal birds.' },
      { word: 'hibernate', meaning: 'to sleep through the cold winter', example: 'Some bears hibernate in winter.' },
    ],
    sequence: {
      title: 'Life of a butterfly',
      steps: [
        'A tiny egg is laid on a leaf.',
        'A caterpillar hatches and munches lots of leaves.',
        'The caterpillar makes a chrysalis around itself.',
        'A butterfly comes out and dries its wings.',
        'The butterfly lays eggs, and the cycle starts again.',
      ],
    },
  },
  {
    id: 'history',
    subject: 'history',
    title: 'Time Travellers',
    words: [
      { word: 'ancient', meaning: 'very, very old; from long ago', example: 'The pyramids are ancient buildings.' },
      { word: 'pharaoh', meaning: 'a king of ancient Egypt', example: 'The pharaoh ruled over all of Egypt.' },
      { word: 'emperor', meaning: 'a ruler of a big empire', example: 'Ashoka was a great emperor of India.' },
      { word: 'fossil', meaning: 'the remains of a plant or animal from long ago, turned into rock', example: 'We found a fossil of a sea shell.' },
      { word: 'invention', meaning: 'something new that someone makes for the very first time', example: 'The wheel was an amazing invention.' },
      { word: 'museum', meaning: 'a building where old and special things are kept', example: 'We saw dinosaur bones at the museum.' },
    ],
    sequence: {
      title: 'Oldest to newest',
      steps: [
        'Dinosaurs walk the Earth',
        'The pyramids of Egypt are built',
        'Emperor Ashoka rules in India',
        'The first aeroplane flies',
        'People walk on the Moon',
      ],
    },
  },
  {
    id: 'geography',
    subject: 'geography',
    title: 'World Explorers',
    words: [
      { word: 'continent', meaning: 'one of the seven huge areas of land on Earth', example: 'Asia is the biggest continent.' },
      { word: 'river', meaning: 'a long stream of water that flows to the sea', example: 'The Ganga is a long river in India.' },
      { word: 'desert', meaning: 'a very dry place that gets very little rain', example: 'Camels can walk across the hot desert.' },
      { word: 'volcano', meaning: 'a mountain that can throw out hot melted rock', example: 'Red lava poured out of the volcano.' },
      { word: 'island', meaning: 'land with water all around it', example: 'Sri Lanka is an island.' },
      { word: 'ocean', meaning: 'a huge area of salty water', example: 'The Pacific is the biggest ocean.' },
    ],
    sequence: {
      title: 'Smallest to biggest',
      steps: ['House', 'Street', 'City', 'Country', 'Continent'],
    },
  },
  {
    id: 'values',
    subject: 'values',
    title: 'Kind Hearts',
    words: [
      { word: 'honest', meaning: 'always telling the truth', example: 'Being honest means telling the truth even when it is hard.' },
      { word: 'kind', meaning: 'friendly, caring and helpful to others', example: 'It is kind to share your snack.' },
      { word: 'patient', meaning: 'able to wait calmly without getting upset', example: 'Be patient while your friend has a turn.' },
      { word: 'grateful', meaning: 'thankful for what you have', example: 'I feel grateful for my family.' },
      { word: 'brave', meaning: 'ready to do something even when it feels scary', example: 'She was brave and said sorry first.' },
      { word: 'teamwork', meaning: 'working together to reach a goal', example: 'With teamwork, we cleaned the classroom fast.' },
    ],
    sequence: {
      title: 'Fixing a mistake',
      steps: [
        'Stop and think about what happened.',
        'Say sorry and really mean it.',
        'Ask how you can help to fix it.',
        'Try to do better next time.',
      ],
    },
  },
];

export const packById = (id) => PACKS.find((p) => p.id === id);

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const wordRegExp = (word) => new RegExp(`(^|[^\\p{L}])(${escapeRegExp(word)})(?=$|[^\\p{L}])`, 'iu');

function sentencesOf(text) {
  return text
    .split(/(?<=[.!?]["'”’]?)\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function clip(text, max = 110) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : max).replace(/[,;:\s]+$/, '')}…`;
}

// A short sentence from the story that uses the word, for "fill the gap" rounds.
function exampleFor(content, word) {
  const re = wordRegExp(word);
  return sentencesOf(content).find((s) => s.length >= 20 && s.length <= 170 && re.test(s)) ?? null;
}

// The story's paragraphs (or stanzas) as short cards to put in order.
function storySequence(story) {
  const paragraphs = story.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const verse = story.kind !== 'story';
  let parts;
  if (verse) {
    parts = paragraphs.map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 2).join(' / '));
  } else {
    const firstSentence = (p) => {
      const [a = p, b] = sentencesOf(p);
      return a.length < 30 && b ? `${a} ${b}` : a;
    };
    parts = paragraphs.length >= 3 ? paragraphs.map(firstSentence) : sentencesOf(story.content);
  }
  const steps = [];
  for (const part of parts.map((p) => clip(p))) {
    if (!steps.some((s) => s.toLowerCase() === part.toLowerCase())) steps.push(part);
  }
  // Keep at most 6 cards, spread evenly through the story.
  const picked = steps.length <= 6 ? steps : Array.from({ length: 6 }, (_, i) => steps[Math.round((i * (steps.length - 1)) / 5)]);
  if (picked.length < 3) return null;
  return { title: verse ? `Put the ${story.kind} in order` : 'Put the story in order', steps: picked };
}

export function packFromStory(story) {
  const seen = new Set();
  const words = (story.vocabulary ?? [])
    .map((v) => ({ word: String(v.word ?? '').trim(), meaning: String(v.meaning ?? '').trim() }))
    .filter((v) => v.word && v.meaning && !seen.has(v.word.toLowerCase()) && seen.add(v.word.toLowerCase()))
    .map((v) => ({ ...v, example: exampleFor(story.content ?? '', v.word) }));
  return {
    id: `story-${story.id}`,
    storyId: story.id,
    subject: story.subject,
    title: story.title,
    words,
    // Library lists leave out the story text, so the sequence is unknown (undefined) until the story is opened.
    sequence: story.content ? storySequence(story) : undefined,
  };
}

// Words a child can rebuild from letter tiles.
export const scrambleWords = (pack) => pack.words.filter((w) => /^[a-z]{3,12}$/i.test(w.word));

// Whether a game has enough material in this pack. Monkey Math needs none.
export function canPlay(gameId, pack) {
  if (gameId === 'math') return true;
  if (!pack) return false;
  if (gameId === 'memory' || gameId === 'catch') return pack.words.length >= 3;
  if (gameId === 'scramble') return scrambleWords(pack).length >= 2;
  if (gameId === 'order') return pack.sequence === undefined || (pack.sequence?.steps.length ?? 0) >= 3;
  return false;
}

// Extra wrong answers for small packs, borrowed from the built-in packs.
export function distractors(exclude, count) {
  const taken = new Set(exclude.map((w) => w.toLowerCase()));
  return shuffle(PACKS.flatMap((p) => p.words.map((w) => w.word))).filter((w) => !taken.has(w.toLowerCase())).slice(0, count);
}
