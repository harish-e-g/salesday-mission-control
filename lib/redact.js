'use strict';
// Masks anything that should not leave the build machine before a snapshot is published: e-mail addresses, links, phone numbers,
// key-like tokens, and any extra terms listed in the (git-ignored) local config. Pure functions, no I/O.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const URLS = /\bhttps?:\/\/[^\s)"'<>]+/g;
const PATHS = /(?:~|\/Users\/[\w.-]+|\/home\/[\w.-]+)\/[\w.\/-]*/g;
const KEYS = /\b(?:sk|pk|rk|ghp|gho|ghs|github_pat|xox[abprs]|AKIA|AIza)[-_A-Za-z0-9]{10,}\b/g;
const LONG = /\b[A-Za-z0-9_-]{32,}\b/g;
const PHONE = /(?<![\w-])\+?\d[\d ()-]{8,}\d(?![\w-])/g;
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{2}-\d{2}-\d{4}$/.test(s);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function makeMasker(terms) {
  const list = (terms || []).filter(Boolean).map(esc);
  const extra = list.length ? new RegExp('\\b(?:' + list.join('|') + ')\\b', 'gi') : null;
  return function mask(text) {
    if (typeof text !== 'string' || !text) return text;
    let t = text.replace(EMAIL, '[e-mail]').replace(URLS, '[link]').replace(PATHS, '[path]').replace(KEYS, '[key]').replace(LONG, '[token]');
    t = t.replace(PHONE, (m) => (m.replace(/\D/g, '').length >= 10 && !isDate(m.trim()) ? '[phone]' : m));
    return extra ? t.replace(extra, '[name]') : t;
  };
}
function maskDeep(value, mask) {
  if (typeof value === 'string') return mask(value);
  if (Array.isArray(value)) return value.map((v) => maskDeep(v, mask));
  if (value && typeof value === 'object') { const o = {}; for (const [k, v] of Object.entries(value)) o[k] = maskDeep(v, mask); return o; }
  return value;
}
module.exports = { makeMasker, maskDeep };
