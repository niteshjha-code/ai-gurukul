// Static learning catalog shared by the API and the AI prompts.

export const SUBJECTS = [
  { id: 'science', name: 'Science', emoji: '🔬' },
  { id: 'math', name: 'Math', emoji: '➗' },
  { id: 'english', name: 'English', emoji: '📝' },
  { id: 'space', name: 'Space', emoji: '🪐' },
  { id: 'animals', name: 'Animals & Nature', emoji: '🦁' },
  { id: 'history', name: 'History', emoji: '🏛️' },
  { id: 'geography', name: 'Geography', emoji: '🌍' },
  { id: 'values', name: 'Good Values', emoji: '💛' },
];

export const SUBJECT_IDS = SUBJECTS.map((s) => s.id);

export const KINDS = ['story', 'poem', 'rhyme'];

export const HOMEWORK_MODES = ['hint', 'steps', 'explain'];

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

export const RANKS = [
  { min: 0, name: 'Seedling', emoji: '🌱' },
  { min: 100, name: 'Sprout', emoji: '🌿' },
  { min: 250, name: 'Explorer', emoji: '🧭' },
  { min: 500, name: 'Ranger', emoji: '🏕️' },
  { min: 900, name: 'Guardian', emoji: '🛡️' },
  { min: 1400, name: 'Jungle Legend', emoji: '👑' },
];

export const BADGES = [
  { id: 'first_story', name: 'Storyteller', emoji: '📖', desc: 'Create your first story', test: (s) => s.stories >= 1 },
  { id: 'bookworm', name: 'Bookworm', emoji: '🐛', desc: 'Create 5 stories', test: (s) => s.stories >= 5 },
  { id: 'first_quiz', name: 'Quiz Cub', emoji: '🐾', desc: 'Finish your first quiz', test: (s) => s.quizzes >= 1 },
  { id: 'sharp_eye', name: 'Sharp Eye', emoji: '🎯', desc: 'Get every answer right in a quiz', test: (s) => s.perfect >= 1 },
  { id: 'quiz_master', name: 'Quiz Master', emoji: '🏆', desc: 'Finish 10 quizzes', test: (s) => s.quizzes >= 10 },
  { id: 'homework_hero', name: 'Homework Hero', emoji: '🦸', desc: 'Ask Guru Owl 3 homework questions', test: (s) => s.homework >= 3 },
  { id: 'explorer', name: 'Explorer', emoji: '🧭', desc: 'Learn in 3 different subjects', test: (s) => s.subjects >= 3 },
  { id: 'on_fire', name: 'On Fire', emoji: '🔥', desc: 'Learn 3 days in a row', test: (s) => s.streak >= 3 },
  { id: 'game_on', name: 'Game On', emoji: '🎮', desc: 'Play 5 learning games', test: (s) => s.games >= 5 },
];

// Learning games run entirely in the browser (no AI). The API only records results and awards XP.
export const GAMES = [
  { id: 'memory', name: 'Memory Match', emoji: '🃏' },
  { id: 'scramble', name: 'Word Scramble', emoji: '🔤' },
  { id: 'order', name: 'Put in Order', emoji: '🧩' },
  { id: 'catch', name: 'Fruit Catch', emoji: '🍌' },
  { id: 'math', name: 'Monkey Math', emoji: '🐒' },
];

// Game XP is capped per day so games stay a bonus and quizzes stay the main way to level up.
export const GAME_XP_DAILY_CAP = 50;

export const AVATARS = ['lion', 'elephant', 'monkey', 'owl'];
