import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type DayId = 'dl' | 'dt' | 'dc' | 'dj' | 'dv' | 'ds' | 'dg';
type Category = 'Fruita i verdura' | 'Carn i peix' | 'Làctics i ous' | 'Rebost' | 'Forn' | 'Congelats' | 'Altres';
interface Ingredient { name: string; amount: number; unit: string; category: Category; }
interface Recipe { id: string; name: string; emoji: string; minutes: number; servings: number; tags: string[]; ingredients: Ingredient[]; instructions: string[]; custom?: boolean; }
interface PlannedDinner { day: DayId; recipeId: string; }
interface ShoppingItem extends Ingredient { key: string; }

const DAYS: { id: DayId; short: string; label: string }[] = [
  { id: 'dl', short: 'Dl', label: 'Dilluns' }, { id: 'dt', short: 'Dt', label: 'Dimarts' }, { id: 'dc', short: 'Dc', label: 'Dimecres' },
  { id: 'dj', short: 'Dj', label: 'Dijous' }, { id: 'dv', short: 'Dv', label: 'Divendres' }, { id: 'ds', short: 'Ds', label: 'Dissabte' }, { id: 'dg', short: 'Dg', label: 'Diumenge' }
];
const CATEGORIES: Category[] = ['Fruita i verdura', 'Carn i peix', 'Làctics i ous', 'Rebost', 'Forn', 'Congelats', 'Altres'];
const STARTER_RECIPES: Recipe[] = [
  { id: 'r1', name: 'Salmó al forn amb verdures', emoji: '🐟', minutes: 30, servings: 2, tags: ['Peix', 'Fàcil'], ingredients: [
    { name: 'Llom de salmó', amount: 2, unit: 'u', category: 'Carn i peix' }, { name: 'Carbassó', amount: 1, unit: 'u', category: 'Fruita i verdura' }, { name: 'Pebrot vermell', amount: 1, unit: 'u', category: 'Fruita i verdura' }, { name: 'Llimona', amount: 1, unit: 'u', category: 'Fruita i verdura' }, { name: 'Oli d’oliva', amount: 20, unit: 'ml', category: 'Rebost' }], instructions: ['Escalfa el forn a 200 °C.', 'Talla les verdures i posa-les en una safata.', 'Afegeix el salmó, amaneix i cou-ho 20 minuts.'] },
  { id: 'r2', name: 'Truita de patata i ceba', emoji: '🍳', minutes: 35, servings: 2, tags: ['Vegetarià', 'Clàssic'], ingredients: [
    { name: 'Ous', amount: 4, unit: 'u', category: 'Làctics i ous' }, { name: 'Patata', amount: 450, unit: 'g', category: 'Fruita i verdura' }, { name: 'Ceba', amount: 1, unit: 'u', category: 'Fruita i verdura' }, { name: 'Oli d’oliva', amount: 80, unit: 'ml', category: 'Rebost' }], instructions: ['Talla i cou la patata i la ceba.', 'Bat els ous i barreja-ho tot.', 'Qualla la truita per les dues bandes.'] },
  { id: 'r3', name: 'Cuscús amb cigrons', emoji: '🥗', minutes: 20, servings: 2, tags: ['Vegà', 'Ràpid'], ingredients: [
    { name: 'Cuscús', amount: 160, unit: 'g', category: 'Rebost' }, { name: 'Cigrons cuits', amount: 240, unit: 'g', category: 'Rebost' }, { name: 'Tomàquet', amount: 2, unit: 'u', category: 'Fruita i verdura' }, { name: 'Cogombre', amount: 1, unit: 'u', category: 'Fruita i verdura' }, { name: 'Llimona', amount: 1, unit: 'u', category: 'Fruita i verdura' }], instructions: ['Hidrata el cuscús.', 'Talla les verdures.', 'Barreja amb els cigrons i amaneix.'] },
  { id: 'r4', name: 'Pollastre al curri amb arròs', emoji: '🍛', minutes: 35, servings: 2, tags: ['Carn', 'Completa'], ingredients: [
    { name: 'Pit de pollastre', amount: 350, unit: 'g', category: 'Carn i peix' }, { name: 'Arròs basmati', amount: 160, unit: 'g', category: 'Rebost' }, { name: 'Llet de coco', amount: 200, unit: 'ml', category: 'Rebost' }, { name: 'Ceba', amount: 1, unit: 'u', category: 'Fruita i verdura' }, { name: 'Curri', amount: 2, unit: 'culleradetes', category: 'Rebost' }], instructions: ['Bull l’arròs.', 'Salta el pollastre i la ceba.', 'Afegeix el curri i la llet de coco; cou 12 minuts.'] },
  { id: 'r5', name: 'Crema de carbassa amb torrades', emoji: '🥣', minutes: 30, servings: 2, tags: ['Vegetarià', 'Suau'], ingredients: [
    { name: 'Carbassa', amount: 600, unit: 'g', category: 'Fruita i verdura' }, { name: 'Patata', amount: 200, unit: 'g', category: 'Fruita i verdura' }, { name: 'Ceba', amount: 1, unit: 'u', category: 'Fruita i verdura' }, { name: 'Pa de pagès', amount: 4, unit: 'llesques', category: 'Forn' }, { name: 'Nata per cuinar', amount: 100, unit: 'ml', category: 'Làctics i ous' }], instructions: ['Cou les verdures amb aigua 20 minuts.', 'Tritura-ho amb la nata.', 'Serveix amb el pa torrat.'] },
  { id: 'r6', name: 'Tacos de vedella i alvocat', emoji: '🌮', minutes: 25, servings: 2, tags: ['Carn', 'Divertit'], ingredients: [
    { name: 'Carn picada de vedella', amount: 300, unit: 'g', category: 'Carn i peix' }, { name: 'Tortilles de blat', amount: 6, unit: 'u', category: 'Forn' }, { name: 'Alvocat', amount: 1, unit: 'u', category: 'Fruita i verdura' }, { name: 'Tomàquet', amount: 2, unit: 'u', category: 'Fruita i verdura' }, { name: 'Formatge ratllat', amount: 100, unit: 'g', category: 'Làctics i ous' }], instructions: ['Dora la carn amb espècies.', 'Talla l’alvocat i el tomàquet.', 'Escalfa les tortilles i munta els tacos.'] },
  { id: 'r7', name: 'Pasta amb pesto i tomàquets', emoji: '🍝', minutes: 18, servings: 2, tags: ['Vegetarià', 'Ràpid'], ingredients: [
    { name: 'Pasta', amount: 180, unit: 'g', category: 'Rebost' }, { name: 'Pesto', amount: 80, unit: 'g', category: 'Rebost' }, { name: 'Tomàquet cirerol', amount: 200, unit: 'g', category: 'Fruita i verdura' }, { name: 'Parmesà', amount: 50, unit: 'g', category: 'Làctics i ous' }], instructions: ['Bull la pasta.', 'Salta breument els tomàquets.', 'Barreja-ho amb el pesto i acaba amb parmesà.'] },
  { id: 'r8', name: 'Lluç amb patata i mongeta tendra', emoji: '🍋', minutes: 30, servings: 2, tags: ['Peix', 'Lleuger'], ingredients: [
    { name: 'Filet de lluç', amount: 400, unit: 'g', category: 'Carn i peix' }, { name: 'Patata', amount: 350, unit: 'g', category: 'Fruita i verdura' }, { name: 'Mongeta tendra', amount: 250, unit: 'g', category: 'Fruita i verdura' }, { name: 'Llimona', amount: 1, unit: 'u', category: 'Fruita i verdura' }], instructions: ['Bull la patata i la mongeta.', 'Cuina el lluç a la planxa.', 'Serveix-ho amb llimona i oli.'] }
];

@Component({ selector: 'app-root', imports: [CommonModule, FormsModule], templateUrl: './app.html', styleUrl: './app.css' })
export class App {
  readonly days = DAYS; readonly categories = CATEGORIES;
  activeTab = signal<'plan' | 'recipes' | 'shopping'>('plan'); shoppingDay = signal<DayId>('dl'); servings = signal(4);
  selectedDays = signal<DayId[]>(['dl', 'dt', 'dc', 'dj', 'dv']); recipes = signal<Recipe[]>(STARTER_RECIPES); plan = signal<PlannedDinner[]>([]);
  checkedItems = signal<string[]>([]); showRecipeForm = signal(false); selectedRecipe = signal<Recipe | null>(null);
  newRecipe = { name: '', emoji: '🍽️', minutes: 30, servings: 2, tags: '', ingredientsText: '', instructionsText: '' };
  plannedRecipes = computed(() => this.plan().map(item => ({ ...item, recipe: this.recipeById(item.recipeId) })).filter(item => !!item.recipe));
  shoppingItems = computed<ShoppingItem[]>(() => {
    const items = new Map<string, ShoppingItem>();
    for (const entry of this.plannedRecipes()) { const recipe = entry.recipe!; const multiplier = this.servings() / recipe.servings;
      for (const ingredient of recipe.ingredients) { const key = `${ingredient.name.toLocaleLowerCase('ca')}|${ingredient.unit}`; const previous = items.get(key); if (previous) previous.amount += ingredient.amount * multiplier; else items.set(key, { ...ingredient, amount: ingredient.amount * multiplier, key }); }
    }
    return [...items.values()].sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name, 'ca'));
  });
  groupedShopping = computed(() => CATEGORIES.map(category => ({ category, items: this.shoppingItems().filter(item => item.category === category) })).filter(group => group.items.length));
  shoppingProgress = computed(() => this.shoppingItems().length ? Math.round((this.checkedItems().filter(key => this.shoppingItems().some(i => i.key === key)).length / this.shoppingItems().length) * 100) : 0);
  constructor() { this.restore(); if (!this.plan().length) this.generatePlan(); }
  toggleDay(day: DayId): void { const next = this.selectedDays().includes(day) ? this.selectedDays().filter(d => d !== day) : DAYS.filter(d => [...this.selectedDays(), day].includes(d.id)).map(d => d.id); if (!next.length) return; this.selectedDays.set(next); this.plan.update(plan => plan.filter(item => next.includes(item.day))); this.generatePlan(true); }
  setShoppingDay(day: DayId): void { this.shoppingDay.set(day); this.save(); }
  setServings(value: number): void { this.servings.set(Math.max(1, Math.min(12, Number(value) || 1))); this.checkedItems.set([]); this.save(); }
  generatePlan(onlyMissing = false): void { const selected = this.selectedDays(); const recipes = this.recipes(); if (!recipes.length) return; const existing = onlyMissing ? this.plan().filter(item => selected.includes(item.day)) : []; const used = new Set(existing.map(item => item.recipeId)); const shuffled = [...recipes].sort(() => Math.random() - .5); let cursor = 0; const next = selected.map(day => { const current = existing.find(item => item.day === day); if (current) return current; let available = shuffled.find(recipe => !used.has(recipe.id)); if (!available) available = shuffled[cursor++ % shuffled.length]; used.add(available.id); return { day, recipeId: available.id }; }); this.plan.set(next); this.checkedItems.set([]); this.save(); }
  changeRecipe(day: DayId, recipeId: string): void { this.plan.update(plan => plan.map(item => item.day === day ? { ...item, recipeId } : item)); this.checkedItems.set([]); this.save(); }
  recipeById(id: string): Recipe | undefined { return this.recipes().find(recipe => recipe.id === id); }
  dayLabel(id: DayId): string { return DAYS.find(day => day.id === id)?.label ?? id; }
  categoryIcon(category: Category): string { return ({ 'Fruita i verdura': '🥬', 'Carn i peix': '🐟', 'Làctics i ous': '🥚', 'Rebost': '🫙', 'Forn': '🥖', 'Congelats': '❄️', 'Altres': '🧺' } as Record<Category, string>)[category]; }
  formatAmount(amount: number): string { return Number.isInteger(amount) ? `${amount}` : `${Math.round(amount * 10) / 10}`.replace('.', ','); }
  toggleShoppingItem(key: string): void { this.checkedItems.update(items => items.includes(key) ? items.filter(item => item !== key) : [...items, key]); this.save(); }
  addRecipe(): void { if (!this.newRecipe.name.trim()) return; const ingredients: Ingredient[] = this.newRecipe.ingredientsText.split('\n').map(line => line.trim()).filter(Boolean).map(line => { const [name = '', amount = '1', unit = 'u', category = 'Altres'] = line.split('|').map(part => part.trim()); return { name, amount: Number(amount.replace(',', '.')) || 1, unit, category: CATEGORIES.includes(category as Category) ? category as Category : 'Altres' }; }); const recipe: Recipe = { id: `custom-${Date.now()}`, name: this.newRecipe.name.trim(), emoji: this.newRecipe.emoji || '🍽️', minutes: Number(this.newRecipe.minutes) || 30, servings: Number(this.newRecipe.servings) || 2, tags: this.newRecipe.tags.split(',').map(tag => tag.trim()).filter(Boolean), ingredients, instructions: this.newRecipe.instructionsText.split('\n').map(step => step.trim()).filter(Boolean), custom: true }; this.recipes.update(recipes => [...recipes, recipe]); this.newRecipe = { name: '', emoji: '🍽️', minutes: 30, servings: 2, tags: '', ingredientsText: '', instructionsText: '' }; this.showRecipeForm.set(false); this.save(); }
  deleteRecipe(recipe: Recipe): void { if (this.recipes().length <= 1) return; this.recipes.update(recipes => recipes.filter(item => item.id !== recipe.id)); this.plan.update(plan => plan.filter(item => item.recipeId !== recipe.id)); this.selectedRecipe.set(null); this.generatePlan(true); }
  async copyShoppingList(): Promise<void> { const text = [`Llista de la compra · ${this.dayLabel(this.shoppingDay())}`, '', ...this.groupedShopping().flatMap(group => [group.category.toUpperCase(), ...group.items.map(item => `☐ ${this.formatAmount(item.amount)} ${item.unit} · ${item.name}`), ''])].join('\n'); try { await navigator.clipboard.writeText(text); } catch { /* El navegador pot bloquejar el porta-retalls. */ } }
  private save(): void { localStorage.setItem('sopars-setmanals-v1', JSON.stringify({ shoppingDay: this.shoppingDay(), servings: this.servings(), selectedDays: this.selectedDays(), recipes: this.recipes(), plan: this.plan(), checkedItems: this.checkedItems() })); }
  private restore(): void { try { const state = JSON.parse(localStorage.getItem('sopars-setmanals-v1') ?? 'null'); if (!state) return; if (state.shoppingDay) this.shoppingDay.set(state.shoppingDay); if (state.servings) this.servings.set(state.servings); if (state.selectedDays?.length) this.selectedDays.set(state.selectedDays); if (state.recipes?.length) this.recipes.set(state.recipes); if (state.plan) this.plan.set(state.plan); if (state.checkedItems) this.checkedItems.set(state.checkedItems); } catch { localStorage.removeItem('sopars-setmanals-v1'); } }
}
