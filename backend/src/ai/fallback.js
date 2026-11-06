// Offline content used when no AI provider is reachable, so the app keeps working.

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function fallbackStory({ topic }) {
  return {
    title: `Leo and the Secret of ${cap(topic)}`,
    content: [
      `Deep in the green Gurukul jungle, Leo the little lion woke up with a big question buzzing in his head: "What is ${topic} all about?"`,
      `He padded over to the old banyan tree, where Guru Owl sat reading a leafy book. "Guru Owl," said Leo, "can you teach me about ${topic}?" Guru Owl smiled and fluffed her feathers. "The best way to learn," she said, "is to explore, ask questions and never give up."`,
      `So Leo set off with his friends Ellie the elephant and Momo the monkey. Ellie remembered every fact they found, Momo asked the funniest questions, and Leo drew pictures of everything in his leaf notebook.`,
      `By sunset they had learned so much about ${topic} that they could not wait to share it. "Learning together is the best adventure!" laughed Momo, swinging from a vine.`,
    ].join('\n\n'),
    moral: 'Asking questions and exploring with friends makes learning fun.',
    funFact: 'Owls can turn their heads almost all the way around - about 270 degrees!',
    vocabulary: [
      { word: 'explore', meaning: 'to look around and discover new things' },
      { word: 'banyan', meaning: 'a huge tree whose branches grow roots down to the ground' },
      { word: 'curious', meaning: 'wanting to know or learn something' },
      { word: 'adventure', meaning: 'an exciting journey or experience' },
    ],
    imagePrompt: `a happy lion cub, an elephant and a monkey learning about ${topic} with a wise owl under a banyan tree`,
  };
}

function shuffleQuestion(question, options, answer, explanation) {
  const order = options.map((_, i) => i).sort(() => Math.random() - 0.5);
  return { question, options: order.map((i) => options[i]), answer: order.indexOf(answer), explanation };
}

// Build a quiz without AI. Works for offline stories, or any story with 4+ vocabulary words.
export function fallbackQuiz(story) {
  const questions = [];
  const vocab = story.vocabulary ?? [];
  if (vocab.length >= 4) {
    for (const v of vocab.slice(0, 4)) {
      const wrong = vocab.filter((o) => o !== v).slice(0, 3).map((o) => o.meaning);
      questions.push(shuffleQuestion(`What does "${v.word}" mean?`, [v.meaning, ...wrong], 0, `"${cap(v.word)}" means ${v.meaning}.`));
    }
  }
  if (story.source === 'offline') {
    questions.push(
      shuffleQuestion('Who did Leo ask for help?', ['Guru Owl', 'Momo the monkey', 'Ellie the elephant', 'A busy bee'], 0, 'Leo asked wise Guru Owl under the banyan tree.'),
      shuffleQuestion('What did Ellie the elephant do best?', ['Remember every fact', 'Ask funny questions', 'Draw pictures', 'Climb trees'], 0, 'Ellie remembered every fact they found.'),
    );
  }
  if (questions.length < 3) return null;
  return questions;
}
