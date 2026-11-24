import { CommonModule } from '@angular/common';
import { Component, computed, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DayId, Category, Recipe, PlannedDinner, ShoppingItem, DAYS, CATEGORIES } from './recipes';
import { MonthlyPlanner } from './monthly-planner';

@Component({ selector: 'app-root', imports: [CommonModule, FormsModule, MonthlyPlanner], templateUrl: './app.html', styleUrl: './app.css' })
export class App {
  readonly days = DAYS; readonly categories = CATEGORIES;
  activeTab = signal<'plan' | 'recipes' | 'shopping' | 'month'>('plan'); shoppingDay = signal<DayId>('dl'); servings = signal(4);
  selectedDays = signal<DayId[]>(['dl', 'dt', 'dc', 'dj', 'dv']); recipes = signal<Recipe[]>([]); plan = signal<PlannedDinner[]>([]);
  cloudDetail = signal(false);
  checkedItems = signal<string[]>([]); selectedRecipe = signal<Recipe | null>(null);
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
  readonly monthly = viewChild(MonthlyPlanner);
  constructor() { this.restore(); this.save(); }
  useCatalog(recipes: Recipe[] | null) {
    this.recipes.set(recipes ?? []);
    this.cloudDetail.set(false);
    this.selectedRecipe.set(null);
    if (recipes === null) return;
    const valid = this.plan().filter(item => recipes.some(recipe => recipe.id === item.recipeId) && this.selectedDays().includes(item.day));
    const needsPlan = valid.length !== this.plan().length || valid.length !== this.selectedDays().length;
    this.plan.set(valid);
    if (needsPlan) this.generatePlan(true);
    else {
      const keys = new Set(this.shoppingItems().map(item => item.key));
      this.checkedItems.update(items => items.filter(key => keys.has(key)));
      this.save();
    }
  }
  toggleDay(day: DayId): void { const next = this.selectedDays().includes(day) ? this.selectedDays().filter(d => d !== day) : DAYS.filter(d => [...this.selectedDays(), day].includes(d.id)).map(d => d.id); if (!next.length) return; this.selectedDays.set(next); this.plan.update(plan => plan.filter(item => next.includes(item.day))); this.generatePlan(true); }
  setShoppingDay(day: DayId): void { this.shoppingDay.set(day); this.save(); }
  setServings(value: number): void { this.servings.set(Math.max(1, Math.min(12, Number(value) || 1))); this.checkedItems.set([]); this.save(); }
  generatePlan(onlyMissing = false): void { const selected = this.selectedDays(); const recipes = this.recipes(); if (!recipes.length) { this.plan.set([]); this.checkedItems.set([]); this.save(); return; } const existing = onlyMissing ? this.plan().filter(item => selected.includes(item.day)) : []; const used = new Set(existing.map(item => item.recipeId)); const shuffled = [...recipes].sort(() => Math.random() - .5); let cursor = 0; const next = selected.map(day => { const current = existing.find(item => item.day === day); if (current) return current; let available = shuffled.find(recipe => !used.has(recipe.id)); if (!available) available = shuffled[cursor++ % shuffled.length]; used.add(available.id); return { day, recipeId: available.id }; }); this.plan.set(next); this.checkedItems.set([]); this.save(); }
  changeRecipe(day: DayId, recipeId: string): void { this.plan.update(plan => plan.map(item => item.day === day ? { ...item, recipeId } : item)); this.checkedItems.set([]); this.save(); }
  recipeById(id: string): Recipe | undefined { return this.recipes().find(recipe => recipe.id === id); }
  dayLabel(id: DayId): string { return DAYS.find(day => day.id === id)?.label ?? id; }
  categoryIcon(category: Category): string { return ({ 'Fruita i verdura': '🥬', 'Carn i peix': '🐟', 'Làctics i ous': '🥚', 'Rebost': '🫙', 'Forn': '🥖', 'Congelats': '❄️', 'Altres': '🧺' } as Record<Category, string>)[category]; }
  formatAmount(amount: number): string { return Number.isInteger(amount) ? `${amount}` : `${Math.round(amount * 10) / 10}`.replace('.', ','); }
  toggleShoppingItem(key: string): void { this.checkedItems.update(items => items.includes(key) ? items.filter(item => item !== key) : [...items, key]); this.save(); }
  editRecipe(recipe?: Recipe) {
    this.selectedRecipe.set(null);
    this.cloudDetail.set(false);
    this.activeTab.set('month');
    this.monthly()?.startRecipe(recipe);
  }
  async deleteRecipe(recipe: Recipe) {
    this.selectedRecipe.set(null);
    this.activeTab.set('month');
    await this.monthly()?.remove(recipe);
  }
  async copyShoppingList(): Promise<void> { const text = [`Llista de la compra · ${this.dayLabel(this.shoppingDay())}`, '', ...this.groupedShopping().flatMap(group => [group.category.toUpperCase(), ...group.items.map(item => `☐ ${this.formatAmount(item.amount)} ${item.unit} · ${item.name}`), ''])].join('\n'); try { await navigator.clipboard.writeText(text); } catch { /* El navegador pot bloquejar el porta-retalls. */ } }
  private save(): void { localStorage.setItem('sopars-setmanals-v1', JSON.stringify({ shoppingDay: this.shoppingDay(), servings: this.servings(), selectedDays: this.selectedDays(), plan: this.plan(), checkedItems: this.checkedItems() })); }
  private restore(): void { try { const state = JSON.parse(localStorage.getItem('sopars-setmanals-v1') ?? 'null'); if (!state) return; if (state.shoppingDay) this.shoppingDay.set(state.shoppingDay); if (state.servings) this.servings.set(state.servings); if (state.selectedDays?.length) this.selectedDays.set(state.selectedDays); if (state.plan) this.plan.set(state.plan); if (state.checkedItems) this.checkedItems.set(state.checkedItems); } catch { localStorage.removeItem('sopars-setmanals-v1'); } }
}
