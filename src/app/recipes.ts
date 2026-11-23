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
export const STARTER_RECIPES: Recipe[] = [
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

