import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIES, type Ingredient, type Recipe } from './recipes';

export const emptyIngredient = (): Ingredient => ({name: '', amount: 1, unit: 'u', category: 'Altres'});
export const newRecipe = (): Recipe => ({
  id: '', name: '', emoji: '🍽️', minutes: 30, servings: 4, tags: [],
  ingredients: [emptyIngredient()], instructions: ['']
});

@Component({
  selector: 'app-recipe-editor', imports: [FormsModule], styleUrl: './monthly-planner.css',
  template: `
  <form #form="ngForm" (ngSubmit)="submit()">
    <fieldset class="fields" [disabled]="busy()">
      <label>Nom de la recepta<input required pattern=".*\\S.*" name="name" [(ngModel)]="draft().name"></label>
      <label>Emoji<input name="emoji" [(ngModel)]="draft().emoji"></label>
      <label>Temps en minuts<input required type="number" min="1" name="minutes" [(ngModel)]="draft().minutes"></label>
      <label>Racions base<input required type="number" min="1" name="servings" [(ngModel)]="draft().servings"></label>
      <label>Etiquetes separades per comes<input name="tags" [ngModel]="draft().tags.join(',')" (ngModelChange)="draft().tags = $event.split(',')"></label>
      <h3>Ingredients</h3>
      @for (item of draft().ingredients; track item; let i = $index) {
        <fieldset class="ingredient"><legend>Ingredient {{ i + 1 }}</legend>
          <label>Nom<input required name="ingredient-{{i}}" [(ngModel)]="item.name"></label>
          <label>Quantitat<input required type="number" step="any" min="0" name="amount-{{i}}" [(ngModel)]="item.amount"></label>
          <label>Unitat<input required name="unit-{{i}}" [(ngModel)]="item.unit"></label>
          <label>Categoria<select name="category-{{i}}" [(ngModel)]="item.category">@for (cat of categories; track cat) {<option>{{ cat }}</option>}</select></label>
          <button type="button" class="quiet" [disabled]="draft().ingredients.length === 1" (click)="draft().ingredients.splice(i, 1)">Treu l’ingredient</button>
        </fieldset>
      }
      <button type="button" class="quiet" (click)="addIngredient()">Afegeix un ingredient</button>
      <h3>Preparació</h3>
      @for (step of draft().instructions; track $index; let i = $index) {
        <label>Pas {{ i + 1 }}<textarea required name="step-{{i}}" [ngModel]="step" (ngModelChange)="draft().instructions[i] = $event"></textarea></label>
        <div class="actions">
          <button type="button" class="quiet" [disabled]="i === 0" (click)="moveStep(i, -1)">Puja</button>
          <button type="button" class="quiet" [disabled]="i + 1 === draft().instructions.length" (click)="moveStep(i, 1)">Baixa</button>
          <button type="button" class="quiet" [disabled]="draft().instructions.length === 1" (click)="draft().instructions.splice(i, 1)">Treu el pas</button>
        </div>
      }
      <button type="button" class="quiet" (click)="draft().instructions.push('')">Afegeix un pas</button>
      <div class="actions"><button [disabled]="form.invalid || !valid()">{{ draft().id ? 'Desa els canvis' : 'Publica la recepta' }}</button>
      <button type="button" class="quiet" (click)="cancel.emit()">Cancel·la</button></div>
    </fieldset>
  </form>`
})
export class RecipeEditor {
  draft = input.required<Recipe>();
  busy = input(false);
  saved = output<Recipe>();
  cancel = output<void>();
  categories = CATEGORIES;
  addIngredient() { this.draft().ingredients.push(emptyIngredient()); }
  moveStep(index: number, offset: number) {
    const steps = this.draft().instructions;
    [steps[index], steps[index + offset]] = [steps[index + offset], steps[index]];
  }
  valid() {
    const r = this.draft();
    return r.name.trim() && Number.isInteger(r.minutes) && r.minutes > 0 && Number.isInteger(r.servings) && r.servings > 0
      && r.ingredients.length && r.ingredients.every(i => i.name.trim() && i.unit.trim() && Number.isFinite(i.amount) && i.amount > 0)
      && r.instructions.length && r.instructions.every(step => step.trim());
  }
  submit() {
    if (this.valid() && !this.busy()) this.saved.emit({...this.draft(), name: this.draft().name.trim(),
      tags: this.draft().tags.map(t => t.trim()).filter(Boolean), instructions: this.draft().instructions.map(s => s.trim())});
  }
}
