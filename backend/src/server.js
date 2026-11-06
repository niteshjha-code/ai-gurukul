import { app } from './app.js';
import { activeProviders } from './ai/providers.js';

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  const ai = [...new Set(activeProviders().map((p) => p.name))].join(' -> ') || 'offline only';
  console.log(`AI Gurukul API running on http://localhost:${PORT}  (AI: ${ai})`);
});
