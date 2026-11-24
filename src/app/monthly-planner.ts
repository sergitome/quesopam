import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { DAYS, type DayId, type Recipe } from './recipes';
import { supabaseConfig } from './supabase-config';

import { newRecipe, RecipeEditor } from './recipe-editor';
import { parseRecipePage } from './recipe-import';

let sharedClient: SupabaseClient | undefined;
const today = new Date();
const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');

@Component({
  selector: 'app-monthly-planner', imports: [FormsModule, RecipeEditor],
  templateUrl: './monthly-planner.html', styleUrl: './monthly-planner.css'
})
export class MonthlyPlanner implements OnInit {
  selectedDays = input.required<DayId[]>();
  toggleDay = output<DayId>();
  openRecipe = output<Recipe>();
  catalogLoaded = output<Recipe[] | null>();
  readonly weekdays = DAYS;
  readonly configured = !!supabaseConfig.url && !!supabaseConfig.publishableKey;
  private db?: SupabaseClient;
  private destroy = inject(DestroyRef);
  private accountVersion = 0;
  private monthVersion = 0;
  readonly user = signal<User | null>(null);
  readonly editor = signal(false);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly month = signal(currentMonth);
  private readonly catalog = signal<(Recipe & {arxivada: boolean})[]>([]);
  readonly recipes = computed(() => this.catalog().filter(recipe => !recipe.arxivada));
  readonly entries = signal<{dia: string; recepta_id: string}[]>([]);
  readonly calendar = computed(() => this.entries().map(entry => ({
    date: entry.dia,
    label: new Date(entry.dia + 'T12:00:00').toLocaleDateString('ca', {weekday:'long', day:'numeric', month:'long'}),
    recipe: this.catalog().find(recipe => recipe.id === entry.recepta_id)
  })));
  email = '';
  password = '';
  draft = newRecipe();
  sourceUrl = '';
  writing = signal(false);

  async ngOnInit() {
    if (!this.configured) return;
    const { createClient } = await import('@supabase/supabase-js');
    if (this.destroy.destroyed) return;
    this.db = sharedClient ??= createClient(supabaseConfig.url, supabaseConfig.publishableKey);
    const { data } = this.db.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (user?.id === this.user()?.id) return;
      this.accountVersion++;
      this.user.set(user);
      this.catalog.set([]);
      this.catalogLoaded.emit(null);
      this.entries.set([]);
      this.editor.set(false);
      this.message.set('');
      this.error.set('');
      this.writing.set(false);
      this.draft = newRecipe();
      this.sourceUrl = '';
      if (user) setTimeout(() => { if (!this.destroy.destroyed && this.user()?.id === user.id) void this.loadAccount(); });
    });
    this.destroy.onDestroy(() => { this.accountVersion++; data.subscription.unsubscribe(); });
  }

  private report(error: unknown) {
    this.error.set(error && typeof error === 'object' && 'message' in error ? String(error.message) : 'No s’ha pogut completar l’operació.');
  }

  async login() {
    if (!this.db || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const { error } = await this.db.auth.signInWithPassword({email: this.email.trim(), password: this.password});
      if (error) throw error;
      this.password = '';
    } catch (err) { this.report(err); } finally { this.busy.set(false); }
  }

  async logout() {
    const result = await this.db?.auth.signOut({scope: 'local'});
    if (result?.error) this.report(result.error);
  }

  async loadAccount() {
    const user = this.user();
    if (!this.db || !user) return;
    const version = this.accountVersion;
    this.error.set('');
    try {
      const [profile, catalog] = await Promise.all([
        this.db.from('usuaris').select('rol').eq('id', user.id).single(),
        this.db.from('receptes').select('id,arxivada,name,emoji,minutes,servings,tags,instructions,ingredients(name,amount,unit,category,posicio)').order('name')
      ]);
      if (version !== this.accountVersion) return;
      if (profile.error) throw profile.error;
      if (catalog.error) throw catalog.error;
      this.editor.set(profile.data.rol === 'editor');
      this.catalog.set(catalog.data.map(recipe => ({ ...recipe, ingredients: recipe.ingredients.sort((a,b) => a.posicio - b.posicio) })));
      this.catalogLoaded.emit(this.recipes());
      await this.loadMonth();
    } catch (err) { if (version === this.accountVersion) this.report(err); }
  }

  async loadMonth() {
    const month = this.month(), user = this.user(), version = ++this.monthVersion;
    this.entries.set([]);
    if (!this.db || !user || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return;
    const [year, number] = month.split('-').map(Number);
    const last = new Date(year, number, 0).getDate();
    const result = await this.db.from('sopars_mensuals').select('dia,recepta_id')
      .eq('usuari_id', user.id).gte('dia', month + '-01').lte('dia', month + '-' + last).order('dia');
    if (version !== this.monthVersion || user.id !== this.user()?.id) return;
    if (result.error) this.report(result.error);
    else this.entries.set(result.data);
  }

  async distribute() {
    if (!this.db || this.busy() || !this.month() || !this.user()) return;
    const month = this.month(), version = this.accountVersion;
    const weekdays = this.selectedDays().map(day => DAYS.findIndex(d => d.id === day) + 1);
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      let confirmation: string | null = null;
      while (true) {
        const {data, error}: {data: {desat?: boolean; confirmacio: string | null} | null; error: unknown} = await this.db.rpc('distribueix_mes', {mes: month + '-01', dies: weekdays, confirmacio: confirmation});
        if (version !== this.accountVersion) return;
        if (error) throw error;
        if (!data) throw new Error('Resposta buida del servidor.');
        if (data.desat) { this.message.set('Menú mensual desat.'); break; }
        confirmation = data.confirmacio;
        if (!window.confirm('Ja hi ha un menú per a ' + month + '. Vols substituir tots els sopars del mes pels nous dies i receptes?')) break;
      }
      await this.loadAccount();
    } catch (err) { this.report(err); } finally { this.busy.set(false); }
  }

  startRecipe(recipe?: Recipe) {
    this.draft = recipe ? structuredClone(recipe) : newRecipe();
    this.sourceUrl = '';
    this.writing.set(true);
    this.error.set('');
    this.message.set('');
  }

  async importRecipe() {
    if (!this.db || !this.editor() || this.busy()) return;
    const version = this.accountVersion;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const url = new URL(this.sourceUrl.trim());
      if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Introdueix un enllaç HTTPS públic.');
      const {data, error} = await this.db.functions.invoke('importa-recepta', {body: {url: url.href}});
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      let html = data.html;
      if (data.direct) {
        try {
          const response = await fetch(url, {credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(12000)});
          if (!response.ok) throw new Error();
          html = await response.text();
        } catch { throw new Error('Aquest web no permet llegir la recepta des del navegador.'); }
      }
      if (version !== this.accountVersion) return;
      this.draft = parseRecipePage(html);
      this.writing.set(true);
      this.message.set('Revisa les quantitats, les unitats, les categories i els passos abans de publicar.');
    } catch (err) { if (version === this.accountVersion) this.report(err); }
    finally { this.busy.set(false); }
  }

  async publish(recipe: Recipe) {
    await this.changeCatalog(recipe.id ? 'modifica_recepta' : 'publica_recepta',
      recipe.id ? {recepta: recipe.id, plat: recipe} : {plat: recipe},
      recipe.id ? 'Canvis desats.' : 'Recepta publicada.');
  }

  async remove(recipe: Recipe) {
    if (window.confirm('Vols esborrar «' + recipe.name + '» del receptari compartit?'))
      await this.changeCatalog('esborra_recepta', {recepta: recipe.id}, 'Recepta esborrada.');
  }

  private async changeCatalog(operation: string, params: Record<string, unknown>, message: string) {
    if (!this.db || !this.editor() || this.busy()) return;
    const version = this.accountVersion;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const {error} = await this.db.rpc(operation, params);
      if (version !== this.accountVersion) return;
      if (error) throw error;
      this.writing.set(false);
      this.sourceUrl = '';
      this.message.set(message);
      await this.loadAccount();
    } catch (err) { if (version === this.accountVersion) this.report(err); }
    finally { this.busy.set(false); }
  }
}
