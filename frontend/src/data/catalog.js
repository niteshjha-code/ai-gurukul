// Mirrors backend/src/catalog.js, plus colours for the UI.

export const SUBJECTS = [
  { id: 'science', name: 'Science', emoji: '🔬', color: '#2BB8BA', dark: '#13797B' },
  { id: 'math', name: 'Math', emoji: '➗', color: '#F68B2F', dark: '#B4560E' },
  { id: 'english', name: 'English', emoji: '📝', color: '#8B5CF6', dark: '#5B34C2' },
  { id: 'space', name: 'Space', emoji: '🪐', color: '#3B6FD9', dark: '#234A9E' },
  { id: 'animals', name: 'Animals & Nature', emoji: '🦁', color: '#4CC433', dark: '#2E8A1A' },
  { id: 'history', name: 'History', emoji: '🏛️', color: '#D9A21B', dark: '#8A6206' },
  { id: 'geography', name: 'Geography', emoji: '🌍', color: '#1C9E6B', dark: '#0E6B47' },
  { id: 'values', name: 'Good Values', emoji: '💛', color: '#EC5B8E', dark: '#A82A58' },
];

export const subjectById = (id) => SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];

export const KINDS = [
  { id: 'story', name: 'Story', emoji: '📖' },
  { id: 'poem', name: 'Poem', emoji: '✍️' },
  { id: 'rhyme', name: 'Rhyme', emoji: '🎵' },
];

export const TOPIC_IDEAS = {
  science: ['How rainbows are made', 'Why ice floats', 'The water cycle', 'How plants make food', 'How magnets work'],
  math: ['Fractions with pizza', 'Counting in tens', 'Shapes all around us', 'Telling the time', 'Adding big numbers'],
  english: ['Nouns and verbs', 'Rhyming words', 'Opposites', 'Punctuation marks', 'Building a sentence'],
  space: ['The solar system', 'Why the Moon changes shape', 'The life of a star', 'Astronauts in space', 'Why we have day and night'],
  animals: ['How bees make honey', 'Life of a butterfly', 'Elephant families', 'Animals of the rainforest', 'Why leaves change colour'],
  history: ['The pyramids of Egypt', 'Emperor Ashoka', 'The invention of the wheel', 'The story of writing', 'Dinosaurs and fossils'],
  geography: ['Rivers of India', 'Mountains and volcanoes', 'The seven continents', 'Deserts of the world', 'Oceans and seas'],
  values: ['Sharing with friends', 'Being honest', 'Kindness to animals', 'Never giving up', 'Teamwork'],
};

export const AVATARS = [
  { id: 'lion', name: 'Leo the Lion' },
  { id: 'elephant', name: 'Ellie the Elephant' },
  { id: 'monkey', name: 'Momo the Monkey' },
  { id: 'owl', name: 'Ollie the Owl' },
];

export const FUN_FACTS = [
  'Honeybees dance to tell their friends where flowers are!',
  'An octopus has three hearts.',
  'A day on Venus is longer than a year on Venus.',
  'Elephants can recognise themselves in a mirror.',
  'Bananas are berries, but strawberries are not!',
  'The Sun is so big that about a million Earths could fit inside it.',
  'Owls cannot move their eyes, so they turn their heads instead.',
  'The Ganga river is about 2,500 km long.',
  'Butterflies taste with their feet.',
  'Zero was first used as a number in ancient India.',
];
