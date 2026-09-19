import { type CSSProperties, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ChefHat,
  ChevronDown,
  CircleHelp,
  Clock3,
  Play,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { ingredientGroups, recipes, type Mood, type Recipe, type Skill } from './recipes';

const queryClient = new QueryClient();
const startingIngredients = ['eggs', 'tomato', 'garlic', 'onion', 'spinach'];
const timeOptions = [
  { value: 'Any', label: 'Any time' },
  { value: '20', label: 'Under 20 min' },
  { value: '30', label: 'Under 30 min' },
  { value: '45', label: 'Under 45 min' },
];
const skillOptions: Array<'Any' | Skill> = ['Any', 'Easy', 'Comfortable', 'Project'];
const moodOptions: Array<'Any' | Mood> = ['Any', 'Cosy', 'Fresh', 'Bright', 'Hearty', 'Quick'];

type Match = Recipe & {
  matched: string[];
  missing: string[];
  score: number;
};

function scoreRecipe(recipe: Recipe, selected: string[]): Match {
  const selectedSet = new Set(selected);
  const matched = recipe.ingredients.filter((ingredient) => selectedSet.has(ingredient));
  const missing = recipe.ingredients.filter((ingredient) => !selectedSet.has(ingredient));
  const coverage = matched.length / recipe.ingredients.length;
  const score = selected.length === 0 ? 0 : Math.round(coverage * 80 + (missing.length === 0 ? 20 : 0));
  return { ...recipe, matched, missing, score };
}

function Home() {
  const [, setLocation] = useLocation();
  const [selectedIngredients, setSelectedIngredients] = useState(startingIngredients);
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState('Any');
  const [skill, setSkill] = useState<'Any' | Skill>('Any');
  const [mood, setMood] = useState<'Any' | Mood>('Any');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((current) =>
      current.includes(ingredient) ? current.filter((item) => item !== ingredient) : [...current, ingredient],
    );
  };

  const resetAll = () => {
    setSelectedIngredients([]);
    setSearchQuery('');
    setTime('Any');
    setSkill('Any');
    setMood('Any');
    setActiveTab('all');
    setExpandedRecipe(null);
  };

  const matches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return recipes
      .map((recipe) => scoreRecipe(recipe, selectedIngredients))
      .filter((recipe) => {
        const textMatch =
          !query ||
          [recipe.title, recipe.description, recipe.category, ...recipe.ingredients].some((value) =>
            value.toLowerCase().includes(query),
          );
        const timeMatch = time === 'Any' || recipe.time <= Number(time);
        const skillMatch = skill === 'Any' || recipe.skill === skill;
        const moodMatch = mood === 'Any' || recipe.mood === mood;
        const savedMatch = activeTab === 'all' || favorites.includes(recipe.id);
        return textMatch && timeMatch && skillMatch && moodMatch && savedMatch;
      })
      .sort((a, b) => b.score - a.score || a.time - b.time);
  }, [activeTab, favorites, mood, searchQuery, selectedIngredients, skill, time]);

  const exactCount = useMemo(() => matches.filter((recipe) => recipe.missing.length === 0).length, [matches]);
  const activeFilterCount = [time !== 'Any', skill !== 'Any', mood !== 'Any'].filter(Boolean).length;
  const heroRecipe = matches[0];

  return (
    <div className="app-shell min-h-[100dvh]">
      <aside className="side-rail" aria-label="Main navigation">
        <button className="brand-lockup" onClick={() => setLocation('/')} data-testid="button-home">
          <span className="brand-mark" aria-hidden="true">
            <ChefHat size={21} strokeWidth={2.4} />
          </span>
          <span>
            <span className="brand-name">Cook what</span>
            <span className="brand-name brand-name-offset">you have</span>
          </span>
        </button>

        <div className="rail-rule" />
        <p className="rail-kicker">Your kitchen, ranked</p>
        <nav className="rail-nav">
          <button
            className={`rail-link ${activeTab === 'all' ? 'rail-link-active' : ''}`}
            onClick={() => setActiveTab('all')}
            data-testid="button-nav-discover"
          >
            <Utensils size={17} />
            <span>Discover recipes</span>
            <span className="rail-count">{matches.length}</span>
          </button>
          <button
            className={`rail-link ${activeTab === 'saved' ? 'rail-link-active' : ''}`}
            onClick={() => setActiveTab('saved')}
            data-testid="button-nav-saved"
          >
            <Bookmark size={17} />
            <span>Saved for later</span>
            {favorites.length > 0 && <span className="rail-count">{favorites.length}</span>}
          </button>
        </nav>

        <div className="rail-tip">
          <Sparkles size={17} />
          <div>
            <p className="rail-tip-title">A little nudge</p>
            <p className="rail-tip-copy">Start with the ingredients that need using first.</p>
          </div>
        </div>

        <div className="rail-bottom">
          <div className="rail-meta"><span className="status-dot" />18 recipes, all local</div>
          <button className="rail-help" data-testid="button-help"><CircleHelp size={16} />How it works</button>
        </div>
      </aside>

      <main className="main-canvas">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark"><ChefHat size={18} /></span>
            <span>Cook what you have</span>
          </div>
          <p className="topbar-note">No shopping list required.</p>
          <button className="reset-button" onClick={resetAll} data-testid="button-reset-top">
            <RotateCcw size={14} /> Reset all
          </button>
        </header>

        <section className="intro-section">
          <div className="intro-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> Dinner starts here</p>
            <h1>Make something<br /><em>good</em> from what’s around.</h1>
            <p className="intro-blurb">
              Tell us what’s in your kitchen. We’ll sort the possibilities by how close you are to a great dinner.
            </p>
          </div>
          <div className="intro-stamp" aria-label="Ingredient first recipe finder">
            <span className="stamp-number">01</span>
            <span className="stamp-text">Ingredient<br />first</span>
            <span className="stamp-arrow">↘</span>
          </div>
        </section>

        <section className="pantry-panel" aria-labelledby="pantry-heading">
          <div className="pantry-heading-row">
            <div>
              <p className="section-label">01 / Pantry</p>
              <h2 id="pantry-heading">What do you have?</h2>
            </div>
            <div className="pantry-count" data-testid="text-pantry-count">
              <strong>{selectedIngredients.length}</strong>
              <span>selected</span>
            </div>
          </div>
          <div className="selected-strip" aria-live="polite">
            {selectedIngredients.length === 0 ? (
              <span className="selected-empty">Pick anything below to get started.</span>
            ) : (
              selectedIngredients.map((ingredient) => (
                <button
                  className="selected-chip"
                  key={ingredient}
                  onClick={() => toggleIngredient(ingredient)}
                  aria-label={`Remove ${ingredient}`}
                  data-testid={`button-remove-ingredient-${ingredient.replaceAll(' ', '-')}`}
                >
                  <Check size={13} /> {ingredient}<X size={13} />
                </button>
              ))
            )}
          </div>
          <div className="ingredient-groups">
            {ingredientGroups.map((group) => (
              <div className="ingredient-group" key={group.label}>
                <span className="ingredient-group-label">{group.label}</span>
                <div className="ingredient-options">
                  {group.items.map((ingredient) => {
                    const isSelected = selectedIngredients.includes(ingredient);
                    return (
                      <button
                        key={ingredient}
                        className={`ingredient-pill ${isSelected ? 'ingredient-pill-selected' : ''}`}
                        onClick={() => toggleIngredient(ingredient)}
                        aria-pressed={isSelected}
                        data-testid={`button-ingredient-${ingredient.replaceAll(' ', '-')}`}
                      >
                        {isSelected ? <Check size={13} /> : <Plus size={13} />}
                        {ingredient}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="filter-section" aria-labelledby="filters-heading">
          <div className="filter-topline">
            <div className="filter-heading">
              <p className="section-label">02 / Tune it</p>
              <h2 id="filters-heading">Set the table for tonight</h2>
            </div>
            <button
              className={`filter-toggle ${showFilters ? 'filter-toggle-active' : ''}`}
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal size={16} /> {showFilters ? 'Hide filters' : 'More filters'}
              {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              <ChevronDown className={showFilters ? 'rotate-180' : ''} size={15} />
            </button>
          </div>
          <div className="filter-row">
            <label className="search-field">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search a dish or ingredient"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                data-testid="input-search-recipes"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" data-testid="button-clear-search"><X size={15} /></button>}
            </label>
            <div className="filter-control">
              <label htmlFor="time-filter">I have</label>
              <select id="time-filter" value={time} onChange={(event) => setTime(event.target.value)} data-testid="select-time">
                {timeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="filter-control">
              <label htmlFor="skill-filter">I feel like</label>
              <select id="skill-filter" value={skill} onChange={(event) => setSkill(event.target.value as 'Any' | Skill)} data-testid="select-skill">
                {skillOptions.map((option) => <option key={option} value={option}>{option === 'Any' ? 'Any skill level' : option}</option>)}
              </select>
            </div>
          </div>
          {showFilters && (
            <div className="filter-drawer">
              <span className="filter-drawer-label">Mood for the meal</span>
              <div className="mood-options">
                {moodOptions.map((option) => (
                  <button
                    key={option}
                    className={`mood-pill ${mood === option ? 'mood-pill-active' : ''}`}
                    onClick={() => setMood(option)}
                    aria-pressed={mood === option}
                    data-testid={`button-mood-${option.toLowerCase()}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button className="clear-filters" onClick={() => { setTime('Any'); setSkill('Any'); setMood('Any'); }} data-testid="button-clear-filters">
                <RotateCcw size={13} /> Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="results-section" aria-labelledby="results-heading">
          <div className="results-header">
            <div>
              <p className="section-label">03 / Your shortlist</p>
              <h2 id="results-heading">{activeTab === 'saved' ? 'Saved for later' : 'Tonight’s best bets'}</h2>
            </div>
            <div className="results-meta">
              <span data-testid="text-results-count">{matches.length} {matches.length === 1 ? 'recipe' : 'recipes'}</span>
              <span className="meta-divider" />
              <span>{exactCount > 0 ? `${exactCount} use everything` : 'Ranked by pantry fit'}</span>
            </div>
          </div>

          {activeTab === 'all' && heroRecipe && selectedIngredients.length > 0 && (
            <div className="best-match-banner" data-testid="banner-best-match">
              <div className="best-match-icon"><Sparkles size={19} /></div>
              <div className="best-match-copy">
                <span className="best-match-label">Closest match right now</span>
                <strong>{heroRecipe.title}</strong>
                <span>{heroRecipe.score}% of the ingredients are already in your pantry.</span>
              </div>
              <button className="text-button" onClick={() => setExpandedRecipe(heroRecipe.id)} data-testid="button-open-best-match">
                Take a look <ArrowUpRight size={15} />
              </button>
            </div>
          )}

          {matches.length === 0 ? (
            <div className="empty-state" data-testid="empty-recipes">
              <div className="empty-illustration"><Utensils size={29} /></div>
              <h3>{activeTab === 'saved' ? 'Nothing saved yet' : 'That combination is a little elusive'}</h3>
              <p>{activeTab === 'saved' ? 'Tap the bookmark on a recipe and it will live here for your next hungry moment.' : 'Try removing a filter, adding another pantry staple, or search for a broader dish.'}</p>
              <button className="primary-button" onClick={resetAll} data-testid="button-reset-empty"><RotateCcw size={15} /> Start over</button>
            </div>
          ) : (
            <div className="recipe-grid">
              {matches.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isFavorite={favorites.includes(recipe.id)}
                  isExpanded={expandedRecipe === recipe.id}
                  onFavorite={() => setFavorites((current) => current.includes(recipe.id) ? current.filter((id) => id !== recipe.id) : [...current, recipe.id])}
                  onExpand={() => setExpandedRecipe((current) => current === recipe.id ? null : recipe.id)}
                  onAddIngredient={(ingredient) => {
                    if (!selectedIngredients.includes(ingredient)) setSelectedIngredients((current) => [...current, ingredient]);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>Cook with what’s close.</span>
          <span className="footer-mark">CWYH / 2024</span>
          <span>Recipes are suggestions, not rules.</span>
        </footer>
      </main>
    </div>
  );
}

function RecipeCard({
  recipe,
  isFavorite,
  isExpanded,
  onFavorite,
  onExpand,
  onAddIngredient,
}: {
  recipe: Match;
  isFavorite: boolean;
  isExpanded: boolean;
  onFavorite: () => void;
  onExpand: () => void;
  onAddIngredient: (ingredient: string) => void;
}) {
  const youtubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.searchTerms)}`;
  const isExact = recipe.missing.length === 0;

  return (
    <article className={`recipe-card ${isExpanded ? 'recipe-card-expanded' : ''}`} style={{ '--recipe-accent': recipe.accent } as CSSProperties} data-testid={`card-recipe-${recipe.id}`}>
      <div className="recipe-card-top">
        <span className={`match-label ${isExact ? 'match-label-exact' : ''}`}>
          {isExact ? <Check size={12} /> : <span className="match-dot" />}
          {isExact ? 'You have it all' : `${recipe.score}% pantry match`}
        </span>
        <button
          className={`save-button ${isFavorite ? 'save-button-active' : ''}`}
          onClick={onFavorite}
          aria-label={isFavorite ? `Remove ${recipe.title} from saved` : `Save ${recipe.title}`}
          data-testid={`button-save-${recipe.id}`}
        >
          {isFavorite ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
        </button>
      </div>
      <div className="recipe-art" aria-hidden="true">
        <span className="art-category">{recipe.category}</span>
        <span className="art-letter">{recipe.title.charAt(0)}</span>
        <span className="art-orbit orbit-one" />
        <span className="art-orbit orbit-two" />
      </div>
      <div className="recipe-content">
        <div className="recipe-title-row">
          <h3>{recipe.title}</h3>
          <span className="recipe-time"><Clock3 size={14} />{recipe.time}m</span>
        </div>
        <p className="recipe-description">{recipe.description}</p>
        <div className="recipe-tags">
          <span>{recipe.skill}</span><span>{recipe.mood}</span>
        </div>
        <div className="match-ingredients">
          <div className="ingredient-status-line">
            <span className="status-caption">In your pantry</span>
            <span className="ingredient-count">{recipe.matched.length}/{recipe.ingredients.length}</span>
          </div>
          <div className="mini-ingredient-list">
            {recipe.matched.slice(0, 4).map((ingredient) => <span className="mini-ingredient matched" key={ingredient}><Check size={11} />{ingredient}</span>)}
            {recipe.missing.slice(0, 2).map((ingredient) => (
              <button className="mini-ingredient missing" key={ingredient} onClick={() => onAddIngredient(ingredient)} title={`Add ${ingredient} to pantry`} data-testid={`button-add-missing-${recipe.id}-${ingredient.replaceAll(' ', '-')}`}>
                <Plus size={11} />{ingredient}
              </button>
            ))}
          </div>
        </div>
        <button className="recipe-open-button" onClick={onExpand} aria-expanded={isExpanded} data-testid={`button-view-recipe-${recipe.id}`}>
          {isExpanded ? 'Close recipe' : 'View recipe'} <ArrowUpRight size={15} />
        </button>
        {isExpanded && (
          <div className="recipe-detail">
            <div className="detail-heading"><span>How to make it</span><a href={youtubeSearch} target="_blank" rel="noreferrer" data-testid={`link-youtube-${recipe.id}`}><Play size={12} /> Watch a search</a></div>
            <ol>
              {recipe.method.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
            </ol>
            {recipe.missing.length > 0 && <p className="missing-note">Missing: {recipe.missing.join(', ')}. The add buttons above keep your shortlist live.</p>}
          </div>
        )}
      </div>
    </article>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;