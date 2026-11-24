import { newRecipe } from './recipe-editor';
import type { Ingredient } from './recipes';

type Fields = Record<string, unknown>;
const record = (v: unknown): v is Fields => !!v && typeof v === 'object' && !Array.isArray(v);

function findRecipe(value: unknown): Fields | undefined {
  if (Array.isArray(value)) {
    for (const item of value) { const found = findRecipe(item); if (found) return found; }
  } else if (record(value)) {
    const types = [value['@type']].flat();
    if (types.some(t => typeof t === 'string' && /(?:^|[/#])Recipe$/i.test(t))) return value;
    return findRecipe(Object.values(value));
  }
  return undefined;
}

function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  const template = document.createElement('template');
  template.innerHTML = value.replace(/<br\s*\/?>/gi, '\n');
  return (template.content.textContent || '').trim();
}

function steps(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(steps);
  if (record(value)) return steps(value['itemListElement'] ?? value['text'] ?? value['name']);
  return clean(value).split(/\n+/).map(s => s.trim()).filter(Boolean);
}

const fractions: Record<string, string> = {'½':'1/2','¼':'1/4','¾':'3/4','⅓':'1/3','⅔':'2/3','⅛':'1/8'};
function ingredient(line: string): Ingredient {
  const normalized = line.replace(/[½¼¾⅓⅔⅛]/g, c => ' ' + fractions[c]).trim();
  const match = normalized.match(/^(?:(\d+)\s+)?(\d+\/\d+|\d+(?:[.,]\d+)?)(?![\d/])\s*(.*)$/);
  let name = line, amount = 0, unit = '';
  if (match) {
    const [n, d = 1] = match[2].replace(',', '.').split('/').map(Number);
    amount = Number(match[1] || 0) + n / d;
    const rest = match[3].match(/^(kg|mg|gr?|grams?|gramos?|ml|cl|dl|l|litres?|litros?|cups?|tsp|tbsp|oz|lbs?|cullerades?|culleradetes?|cucharadas?|cucharaditas?|unitats?|u)\b\.?\s*(?:de\s+|d['’])?(.+)$/i);
    name = rest ? rest[2] : match[3];
    unit = rest ? rest[1] : 'u';
    if (!name || /^[-–]/.test(name)) { name = line; amount = 0; unit = ''; }
  }
  return {name, amount, unit, category: 'Altres'};
}

export function parseRecipePage(html: string) {
  const page = document.createElement('template');
  page.innerHTML = html;
  let data: Fields | undefined;
  for (const script of page.content.querySelectorAll('script[type="application/ld+json"]')) {
    try { data = findRecipe(JSON.parse(script.textContent || '')); } catch { continue; }
    if (data) break;
  }
  const root = page.content.querySelector('[itemtype$="/Recipe"]');
  const prop = (key: string) => Array.from(root?.querySelectorAll('[itemprop~="' + key + '"]') || [],
    el => (el.getAttribute('content') ?? el.getAttribute('datetime') ?? el.textContent ?? '').trim());
  const raw = data?.['recipeIngredient'] ?? prop('recipeIngredient');
  const lines = [raw].flat().flatMap(v => clean(v).split(/\n+/)).map(s => s.trim()).filter(Boolean);
  if (!lines.length) throw new Error('No s’han trobat ingredients de recepta en aquesta pàgina.');
  const draft = newRecipe();
  draft.name = clean(data?.['name'] ?? prop('name')[0]);
  draft.ingredients = lines.map(ingredient);
  const instructions = steps(data?.['recipeInstructions'] ?? prop('recipeInstructions'));
  draft.instructions = instructions.length ? instructions : [''];
  const duration = String(data?.['totalTime'] ?? prop('totalTime')[0] ?? '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (duration) draft.minutes = Number(duration[1] || 0) * 60 + Number(duration[2] || 0) || draft.minutes;
  const servings = String(data?.['recipeYield'] ?? prop('recipeYield')[0] ?? '').match(/\d+/);
  if (servings && Number(servings[0]) > 0) draft.servings = Number(servings[0]);
  return draft;
}
