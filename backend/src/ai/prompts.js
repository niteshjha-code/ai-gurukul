const SAFETY = 'You are talking to a child. Everything you write must be 100% child-safe, kind, inclusive and factually accurate: no violence, scary content, romance, brand names or requests for personal information. If a request is unsuitable, gently steer to a related safe learning topic.';

const LEVEL_GUIDE = {
  1: 'very simple words and very short sentences, about 150 words',
  2: 'simple words and short sentences, about 200 words',
  3: 'clear everyday language with a few new words, about 260 words',
  4: 'richer vocabulary and interesting details, about 320 words',
  5: 'rich vocabulary, deeper facts and a little challenge, about 380 words',
};

const KIND_GUIDE = {
  story: 'an engaging educational STORY with friendly characters and a clear beginning, middle and end. Weave real, accurate facts about the topic into the plot',
  poem: 'a fun educational POEM of 4 to 6 short stanzas that teaches real facts about the topic. Put each line on its own line and leave a blank line between stanzas',
  rhyme: 'a catchy RHYME for kids with a repeating chorus that teaches real facts about the topic. Put each line on its own line and leave a blank line between verses',
};

const HOMEWORK_MODES = {
  hint: 'Give ONE small, helpful hint and a guiding question so the child can work it out. Do NOT reveal the final answer.',
  steps: 'Walk through the solution step by step as a numbered list, explaining why each step works, then give the final answer.',
  explain: 'Explain the idea behind the question simply, using a real-life example a child knows. Do not solve their exact question.',
};

export function storyMessages({ topic, subject, kind, level, age }) {
  return [
    {
      role: 'system',
      content: `You are Guru Owl, the friendly storyteller of AI Gurukul, a jungle-themed learning world. ${SAFETY} Reply with ONLY a valid JSON object and no other text.`,
    },
    {
      role: 'user',
      content: `Write ${KIND_GUIDE[kind]}.
Topic: "${topic}"
Subject: ${subject}
Reader: a ${age}-year-old child. Reading level ${level} of 5: ${LEVEL_GUIDE[level]}.

Return a JSON object with exactly these keys:
{
  "title": "a short, catchy title",
  "content": "the full text, with paragraphs or stanzas separated by a blank line (\\n\\n)",
  "moral": "one short sentence: the key thing to remember",
  "funFact": "one surprising, true fact about the topic",
  "vocabulary": [{ "word": "a word used in the text", "meaning": "a kid-friendly meaning" }],
  "imagePrompt": "a short visual description of one happy scene from the text for an illustrator",
  "quiz": [{ "question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explanation": "..." }]
}
"vocabulary" must have exactly 4 items.
Inside JSON text values, write any dialogue with single quotes ('like this'), never double quotes.
${QUIZ_RULES(age, level)}
"quiz" must have exactly 5 items.`,
    },
  ];
}

const QUIZ_RULES = (age, level) => `Quiz rules: questions check a ${age}-year-old's understanding of the text (difficulty ${level} of 5), mixing "remember" and "understand" questions that use facts from the text. Each question has exactly 4 short options with only one correct; "answer" is the 0-based index of the correct option, and the correct position varies. Each explanation is one short, encouraging sentence.`;

export function quizMessages({ story, level, age, count = 5 }) {
  return [
    {
      role: 'system',
      content: `You are Guru Owl, the quiz master of AI Gurukul. ${SAFETY} Reply with ONLY a valid JSON object and no other text.`,
    },
    {
      role: 'user',
      content: `Create ${count} multiple-choice questions about the text below.
${QUIZ_RULES(age, level)}

TITLE: ${story.title}
TEXT:
${story.content}

Return a JSON object:
{ "questions": [ { "question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explanation": "..." } ] }`,
    },
  ];
}

export function homeworkMessages({ question, subject, mode, age, grade, history }) {
  return [
    {
      role: 'system',
      content: `You are Guru Owl, a patient and cheerful homework tutor at AI Gurukul helping a ${age}-year-old${grade ? ` in grade ${grade}` : ''} with ${subject}. ${SAFETY}
Teaching style for this reply: ${HOMEWORK_MODES[mode]}
Format: short paragraphs, **bold** for key ideas, numbered steps when useful, no more than about 150 words. Finish with one short encouraging question.
Write maths as plain text a child can read (3/4 + 1/8, 5 x 6, 2^3), never LaTeX.
Help the child understand; never write full essays or complete graded work for them.`,
    },
    ...history,
    { role: 'user', content: question },
  ];
}
