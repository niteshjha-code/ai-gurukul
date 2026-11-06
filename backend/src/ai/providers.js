// Free LLM providers, tried in order until one succeeds:
//   1. Google Gemini  (free API key, optional)  - GEMINI_API_KEY
//   2. Groq           (free API key, optional)  - GROQ_API_KEY
//   3. Pollinations   (free, no key needed)     - always available unless AI_OFFLINE=1

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 90_000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function httpError(res) {
  const body = (await res.text()).slice(0, 300);
  const err = new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  // Free tiers answer 402/429 with a hint like "Retry after 10s".
  if (res.status === 402 || res.status === 429) {
    const hint = Number(body.match(/retry after (\d+)\s*s/i)?.[1] ?? res.headers.get('retry-after'));
    err.retryAfter = Number.isFinite(hint) && hint > 0 ? hint : 15;
  }
  return err;
}

async function openAICompatible({ url, key, model, messages, json, extra = {} }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ model, messages, ...(json ? { response_format: { type: 'json_object' } } : {}), ...extra }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw await httpError(res);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text?.trim()) throw new Error('empty response');
  return text;
}

async function gemini({ messages, json }) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: json ? { responseMimeType: 'application/json' } : {},
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw await httpError(res);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text?.trim()) throw new Error('empty response');
  return text;
}

export function activeProviders() {
  if (process.env.AI_OFFLINE === '1') return [];
  const list = [];
  if (process.env.GEMINI_API_KEY) list.push({ name: 'gemini', call: gemini });
  if (process.env.GROQ_API_KEY) {
    list.push({
      name: 'groq',
      call: (opts) => openAICompatible({
        ...opts,
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      }),
    });
  }
  // Free and keyless (about 1 reply per 45s per IP); retried once because the anonymous tier is often busy.
  const pollinations = {
    name: 'pollinations',
    call: (opts) => openAICompatible({
      ...opts,
      json: false, // keyless tier ignores response_format; the prompt asks for JSON instead
      url: 'https://text.pollinations.ai/openai',
      key: process.env.POLLINATIONS_TOKEN,
      model: process.env.POLLINATIONS_MODEL || 'openai-fast',
      // The keyless model is a reasoning model: keep reasoning short so the answer fits the token budget.
      // A fresh seed stops the service returning the same cached (possibly broken) answer on retry.
      extra: { reasoning_effort: 'low', max_tokens: 6000, seed: Math.floor(Math.random() * 1e9) },
    }),
  };
  list.push(pollinations, pollinations);
  return list;
}

// Ask each provider in turn; `parse` may throw to reject a malformed answer and move on.
export async function chat(messages, { json = false, parse = (t) => t } = {}) {
  const errors = [];
  const providers = activeProviders();
  for (const [i, provider] of providers.entries()) {
    const retryWait = errors.at(-1)?.retryAfter;
    if (retryWait && providers[i - 1]?.name === provider.name) await sleep(Math.min(retryWait + 5, 45) * 1000);
    try {
      const text = await provider.call({ messages, json });
      return { result: parse(text), provider: provider.name };
    } catch (err) {
      errors.push({ text: `${provider.name}: ${err.message}`, retryAfter: err.retryAfter });
      console.warn(`[ai] ${provider.name} failed - ${err.message}`);
    }
  }
  throw new Error(`All AI providers failed${errors.length ? ` (${errors.map((e) => e.text).join(' | ')})` : ' (none configured)'}`);
}

// LLMs sometimes put raw newlines or unescaped quotes inside JSON strings. Escape them:
// a quote only closes a string when the next non-space character is , } ] or :
function repairJSON(json) {
  let out = '';
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (inString) {
      if (ch === '\\') { out += ch + (json[++i] ?? ''); continue; }
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') continue;
      if (ch === '"') {
        const next = json.slice(i + 1).match(/\S/)?.[0];
        if (next && !',}]:'.includes(next)) { out += '\\"'; continue; }
        inString = false;
      }
      out += ch;
    } else {
      if (ch === '"') inString = true;
      out += ch;
    }
  }
  return out;
}

export function parseJSON(text) {
  const cleaned = text.replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON object in response');
  const json = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(json);
  } catch {
    return JSON.parse(repairJSON(json));
  }
}
