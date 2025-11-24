// Zentrale neutrale Terminologie ohne KI/AI-Begriffe.
// Keine Mock-Daten – nur Mapping & Utility.

export const NEUTRAL_TERM_MAP: Record<string, string> = {
  // Entfernte Abkürzungen 'KI' & ausgeschriebene Form, nur verbleibende allgemeine Modell-/Analysebegriffe
  'ML': 'Algorithmus',
  'Machine Learning': 'Algorithmus-Auswertung',
  'AI Insights': 'Insights',
  'AI Analysis': 'Analysis',
  'AI-Powered': 'Automated',
  'AI powered': 'Automated',
  'AI-based': 'software-based',
  'AI based': 'software-based',
  'Artificial Intelligence': 'Data Processing',
  'AI/ML': 'Software',
  'Predictive AI': 'Predictive Model',
  'AI risk': 'Technology risk'
};

const termRegexes = Object.keys(NEUTRAL_TERM_MAP).map(k => ({
  key: k,
  regex: new RegExp('(\\b' + k.replace(/[-/]/g, m => m === '-' ? '\\-' : m === '/' ? '\\/' : m) + '\\b)', 'gi')
}));

export function sanitizeText(input: string): string {
  let out = input;
  for (const { key, regex } of termRegexes) {
    out = out.replace(regex, () => NEUTRAL_TERM_MAP[key]);
  }
  return out;
}

// Utility für komponentenweite Bereinigung (z.B. bei dynamischen Texten)
export function sanitizeObjectDeep<T>(value: T): T {
  if (typeof value === 'string') return sanitizeText(value) as unknown as T;
  if (Array.isArray(value)) return value.map(v => sanitizeObjectDeep(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) {
      out[k] = sanitizeObjectDeep(v);
    }
    return out;
  }
  return value;
}
