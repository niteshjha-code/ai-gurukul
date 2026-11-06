import { HttpError } from '../errors.js';

const BLOCKED = /\b(kill(ing|ed|er)?|murder|guns?|weapons?|bombs?|drugs?|cocaine|alcohol|beer|vodka|whisk(e)?y|cigarettes?|vap(e|ing)|sex(y|ual)?|porn\w*|nude|naked|suicide|self[- ]harm|gore|blood(y)?|terroris[mt]\w*|gambl\w*|casino)\b/i;

// Reject topics that are not suitable for children before they reach the AI.
export function assertKidSafe(text) {
  if (BLOCKED.test(text)) {
    throw new HttpError(400, "Hmm, Guru Owl can't help with that one. Let's pick a different learning topic!");
  }
}
