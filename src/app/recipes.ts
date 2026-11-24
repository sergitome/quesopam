export type DayId = 'dl' | 'dt' | 'dc' | 'dj' | 'dv' | 'ds' | 'dg';
export type Category = 'Fruita i verdura' | 'Carn i peix' | 'Làctics i ous' | 'Rebost' | 'Forn' | 'Congelats' | 'Altres';
export interface Ingredient { name: string; amount: number; unit: string; category: Category; }
export interface Recipe { id: string; name: string; emoji: string; minutes: number; servings: number; tags: string[]; ingredients: Ingredient[]; instructions: string[]; custom?: boolean; }
export interface PlannedDinner { day: DayId; recipeId: string; }
export interface ShoppingItem extends Ingredient { key: string; }

export const DAYS: { id: DayId; short: string; label: string }[] = [
  { id: 'dl', short: 'Dl', label: 'Dilluns' }, { id: 'dt', short: 'Dt', label: 'Dimarts' }, { id: 'dc', short: 'Dc', label: 'Dimecres' },
  { id: 'dj', short: 'Dj', label: 'Dijous' }, { id: 'dv', short: 'Dv', label: 'Divendres' }, { id: 'ds', short: 'Ds', label: 'Dissabte' }, { id: 'dg', short: 'Dg', label: 'Diumenge' }
];
export const CATEGORIES: Category[] = ['Fruita i verdura', 'Carn i peix', 'Làctics i ous', 'Rebost', 'Forn', 'Congelats', 'Altres'];

