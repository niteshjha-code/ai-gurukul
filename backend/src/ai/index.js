import { chat, parseJSON } from './providers.js';
import { storyMessages, quizMessages, homeworkMessages } from './prompts.js';
import { fallbackStory, fallbackQuiz } from './fallback.js';
import { HttpError } from '../errors.js';

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function cleanQuestions(list) {
  return (Array.isArray(list) ? list : [])
    .map((q) => ({
      question: str(q?.question, 300),
      options: Array.isArray(q?.options) ? q.options.map((o) => str(String(o), 150)) : [],
      answer: Number(q?.answer),
      explanation: str(q?.explanation, 300),
    }))
    .filter((q) => q.question && q.options.length === 4 && q.options.every(Boolean) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)
    .slice(0, 6);
}

function normalizeStory(raw) {
  const data = parseJSON(raw);
  const quiz = cleanQuestions(data.quiz);
  const story = {
    title: str(data.title, 120),
    content: str(data.content, 6000).replace(/\r\n/g, '\n'),
    moral: str(data.moral, 300),
    funFact: str(data.funFact ?? data.fun_fact, 400),
    vocabulary: (Array.isArray(data.vocabulary) ? data.vocabulary : [])
      .map((v) => ({ word: str(v?.word, 40), meaning: str(v?.meaning, 200) }))
      .filter((v) => v.word && v.meaning)
      .slice(0, 6),
    imagePrompt: str(data.imagePrompt ?? data.image_prompt, 300),
    // Quiz made in the same AI call, so opening the quiz later needs no extra request.
    quiz: quiz.length >= 3 ? quiz : null,
  };
  if (!story.title || story.content.length < 80) throw new Error('story JSON missing title/content');
  return story;
}

function normalizeQuiz(raw) {
  const questions = cleanQuestions(parseJSON(raw).questions);
  if (questions.length < 3) throw new Error('quiz JSON had fewer than 3 valid questions');
  return questions;
}

export async function generateStory(params) {
  try {
    const { result, provider } = await chat(storyMessages(params), { json: true, parse: normalizeStory });
    return { ...result, source: provider };
  } catch (err) {
    console.warn(`[ai] using offline story: ${err.message}`);
    return { ...fallbackStory(params), quiz: null, source: 'offline' };
  }
}

export async function generateQuiz({ story, level, age }) {
  try {
    const { result } = await chat(quizMessages({ story, level, age }), { json: true, parse: normalizeQuiz });
    return result;
  } catch (err) {
    console.warn(`[ai] quiz generation failed: ${err.message}`);
    const offline = fallbackQuiz(story);
    if (offline) return offline;
    throw new HttpError(503, 'Guru Owl is busy right now. Please try the quiz again in a moment!');
  }
}

export async function homeworkHelp(params) {
  try {
    const { result } = await chat(homeworkMessages(params), { parse: (t) => t.trim().slice(0, 4000) });
    return result;
  } catch (err) {
    console.warn(`[ai] homework help failed: ${err.message}`);
    throw new HttpError(503, 'Guru Owl is taking a quick nap. Please ask again in a moment!');
  }
}
