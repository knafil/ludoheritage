import { useEffect, useMemo, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const STORAGE_KEY = "ludoheritage-user";
const FAV_KEY    = "ludoheritage-favs";
const RECENT_KEY = "ludoheritage-recent";

const ALL_ACHIEVEMENTS = [
  { id: "first-view",   icon: "◆", label: "Premier pas",      desc: "Ouvrir votre premier jeu" },
  { id: "explorer",     icon: "◎", label: "Explorateur",      desc: "Consulter 5 jeux" },
  { id: "scholar",      icon: "◈", label: "Erudit",           desc: "Consulter 10 jeux" },
  { id: "first-fav",    icon: "♥", label: "Premier favori",   desc: "Ajouter 1 jeu en favori" },
  { id: "collector",    icon: "★", label: "Collectionneur",   desc: "5 jeux en favoris" },
  { id: "globetrotter", icon: "●", label: "Globetrotteur",    desc: "Explorer 3 regions" },
  { id: "world",        icon: "◉", label: "Monde entier",     desc: "Explorer toutes les regions" },
  { id: "historian",    icon: "▼", label: "Historien",        desc: "Consulter 3 jeux anciens" },
  { id: "contributor",  icon: "✦", label: "Contributeur",     desc: "Publier dans la communaute" },
  { id: "active",       icon: "▲", label: "Membre actif",     desc: "3 publications communautaires" },
];

function checkAchievement(id, { viewCount, favCount, regionCount, ancientCount, postCount }) {
  switch (id) {
    case "first-view":   return viewCount >= 1;
    case "explorer":     return viewCount >= 5;
    case "scholar":      return viewCount >= 10;
    case "first-fav":    return favCount >= 1;
    case "collector":    return favCount >= 5;
    case "globetrotter": return regionCount >= 3;
    case "world":        return regionCount >= 4;
    case "historian":    return ancientCount >= 3;
    case "contributor":  return postCount >= 1;
    case "active":       return postCount >= 3;
    default:             return false;
  }
}

const FALLBACK_GAMES = [
  { id: 1, name: "Awale", region: "Afrique", country: "Afrique de l'Ouest", period: "Ancient", type: "Strategie", difficulty: "Debutant", description: "Jeu de semailles du groupe Mancala.", rules: "Semez et capturez.", history: "Tradition orale d'Afrique de l'Ouest.", players: "2 joueurs", duration: "15-30 min", age: "6+", year: "~3000 av. J.-C.", reconstructionStatus: "Done", playable: true, ludemeSummary: "Sow, capture", aliases: ["Oware"], categories: ["Board", "Sow"], ludemes: ["sow", "capture"], tutorialSteps: [] },
];

const ONBOARDING_QUESTIONS = [
  { key: "niveau", title: "Quel est votre niveau ?", options: ["Debutant", "Amateur", "Passionne"] },
  { key: "typeJeuPrefere", title: "Quel type de jeu vous attire ?", options: ["Strategie", "Hasard", "Hasard et strategie", "Adresse"] },
  { key: "regionPreferee", title: "Quelle region explorer ?", options: ["Afrique", "Asie", "Europe", "Amerique"] },
  { key: "langue", title: "Langue de discussion", options: ["Francais", "English", "Arabic"] },
];

const NAV = ["Catalogue", "Carte", "Chronologie", "Ludemes", "Comparer", "Quiz", "Communaute", "Profil"];
const PERIODS = ["Tous", "Ancient", "Medieval", "Modern"];
const LEVELS = ["Tous", "Debutant", "Amateur", "Passionne"];

const REGION_MAP = {
  "Afrique":   { cx: 362, cy: 268, spread: 55, color: "#7a5230" },
  "Asie":      { cx: 590, cy: 158, spread: 75, color: "#2a5580" },
  "Europe":    { cx: 375, cy: 108, spread: 38, color: "#3a6a5a" },
  "Amerique":  { cx: 155, cy: 205, spread: 48, color: "#5a3a8a" },
};

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}
function readFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
}

async function getJson(url, fallback) {
  try {
    const r = await fetch(url);
    if (!r.ok) return fallback;
    return await r.json().catch(() => fallback);
  } catch { return fallback; }
}

function initials(name = "Joueur") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "J";
}
function timeAgo(value) {
  if (!value) return "maintenant";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "maintenant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} j`;
}
function parseYear(y) {
  if (!y) return 0;
  const m = y.match(/(-?\d+)/);
  if (!m) return 0;
  return y.toLowerCase().includes("av") ? -parseInt(m[1]) : parseInt(m[1]);
}
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// ─── Auth ────────────────────────────────────────────────────────────────────

function AuthGate({ mode, setMode, form, setForm, submit, loading, error }) {
  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <p className="eyebrow">LudoHeritage Portal</p>
        <h1>Une bibliotheque vivante des jeux traditionnels.</h1>
        <p>Explorez 20 jeux du monde entier, leurs origines, leurs mecaniques et leur heritage culturel.</p>
      </section>
      <section className="auth-panel">
        <div className="segmented">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Connexion</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Creer un compte</button>
        </div>
        <form onSubmit={submit} className="form-grid">
          {mode === "register" && (
            <label>Nom complet<input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} required minLength={2} /></label>
          )}
          <label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Mot de passe<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></label>
          {mode === "register" && (
            <label>Confirmer le mot de passe<input type="password" value={form.confirm || ""} onChange={e => setForm({ ...form, confirm: e.target.value })} required minLength={6} /></label>
          )}
          {error && <div className="error">{error}</div>}
          <button className="primary" disabled={loading}>{loading ? "Veuillez patienter..." : "Continuer"}</button>
        </form>
      </section>
    </main>
  );
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

function OnboardingFlow({ user, answers, setAnswers, submit, loading, error }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_QUESTIONS[step];
  const isLast = step === ONBOARDING_QUESTIONS.length - 1;
  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel">
        <p className="eyebrow">Profil joueur</p>
        <h1>Bienvenue {user.displayName}</h1>
        <div className="progress">
          {ONBOARDING_QUESTIONS.map((q, i) => <span key={q.key} className={i <= step ? "active" : ""} />)}
        </div>
        <h2>{current.title}</h2>
        <div className="option-list">
          {current.options.map(opt => (
            <button key={opt} className={answers[current.key] === opt ? "selected" : ""} onClick={() => setAnswers({ ...answers, [current.key]: opt })}>{opt}</button>
          ))}
        </div>
        {error && <div className="error">{error}</div>}
        <div className="row-actions">
          <button className="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Precedent</button>
          {isLast
            ? <button className="primary" disabled={!answers[current.key] || loading} onClick={submit}>Terminer</button>
            : <button className="primary" disabled={!answers[current.key]} onClick={() => setStep(step + 1)}>Suivant</button>}
        </div>
      </section>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReconBadge({ status }) {
  const cls = status === "Done" ? "badge-done" : status === "Pending" ? "badge-pending" : "badge-partial";
  const label = status === "Done" ? "Reconstruit" : status === "Pending" ? "En cours" : status || "Inconnu";
  return <span className={`recon-badge ${cls}`}>{label}</span>;
}

function GameCard({ game, onOpen, isFav, onToggleFav }) {
  return (
    <article className="game-card" onClick={() => onOpen(game)}>
      <div className="game-card-top">
        <span className={`period-pill ${game.period?.toLowerCase()}`}>{game.period}</span>
        <ReconBadge status={game.reconstructionStatus} />
      </div>
      <h3>{game.name}</h3>
      <p className="card-country">{game.country}</p>
      <div className="tag-row">
        {(game.categories || []).slice(0, 4).map(c => <span key={c}>{c}</span>)}
      </div>
      <div className="game-card-bottom">
        <span>{game.players}</span>
        <button className={`fav-btn ${isFav ? "faved" : ""}`} onClick={e => { e.stopPropagation(); onToggleFav(game.id); }}>{isFav ? "♥" : "♡"}</button>
      </div>
    </article>
  );
}

function BoardSnapshot({ title, rows = [] }) {
  return (
    <div className="board-snapshot">
      <span>{title}</span>
      <div className="snapshot-board">
        {rows.map((row, ri) => (
          <div className="snapshot-row" key={ri}>
            {row.split(" ").map((cell, ci) => <div className="snapshot-cell" key={ci}>{cell}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function TutorialPrototype({ steps = [] }) {
  const [idx, setIdx] = useState(0);
  if (!steps.length) return <p className="muted">Pas de prototype tutorial disponible.</p>;
  const step = steps[idx];
  return (
    <section className="tutorial-prototype">
      <div className="tutorial-head">
        <div><h3>Prototype Tutorial</h3><p>{step.title}</p></div>
        <span>{idx + 1} / {steps.length}</span>
      </div>
      <p className="tutorial-explanation">{step.explanation}</p>
      {step.legend?.length > 0 && <div className="tutorial-legend">{step.legend.map(i => <span key={i}>{i}</span>)}</div>}
      <div className="snapshot-grid">
        <BoardSnapshot title="Avant" rows={step.beforeBoard} />
        <BoardSnapshot title="Apres" rows={step.afterBoard} />
      </div>
      <div className="row-actions compact-row">
        <button className="secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Precedent</button>
        <button className="secondary" onClick={() => setIdx(0)}>Recommencer</button>
        <button className="primary" disabled={idx === steps.length - 1} onClick={() => setIdx(idx + 1)}>Suivant</button>
      </div>
    </section>
  );
}

// ─── Awale Game ───────────────────────────────────────────────────────────────

function AwaleGame() {
  const INIT = Array(12).fill(4);
  const [pits, setPits] = useState([...INIT]);
  const [stores, setStores] = useState([0, 0]);
  const [turn, setTurn] = useState(0);   // 0 = bottom (J1), 1 = top (J2)
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("Joueur 1 — choisissez une case (rangee du bas)");

  function sow(idx) {
    if (done || pits[idx] === 0) return;
    if (turn === 0 && idx >= 6) return;
    if (turn === 1 && idx < 6) return;

    const np = [...pits];
    const ns = [...stores];
    let seeds = np[idx];
    np[idx] = 0;
    let pos = idx;

    // Sow counter-clockwise; skip starting pit on full rounds (12+ seeds)
    while (seeds > 0) {
      pos = (pos + 1) % 12;
      if (seeds >= 12 && pos === idx) continue;
      np[pos]++;
      seeds--;
    }

    // Capture backwards while last pit is in opponent zone with 2 or 3 seeds
    const [oppStart, oppEnd] = turn === 0 ? [6, 11] : [0, 5];
    let cp = pos;
    while (cp >= oppStart && cp <= oppEnd && (np[cp] === 2 || np[cp] === 3)) {
      ns[turn] += np[cp];
      np[cp] = 0;
      cp--;
    }

    // Game over when one side has no seeds left
    const sum0 = np.slice(0, 6).reduce((a, b) => a + b, 0);
    const sum1 = np.slice(6).reduce((a, b) => a + b, 0);
    if (sum0 === 0 || sum1 === 0) {
      ns[0] += sum0;
      ns[1] += sum1;
      setPits(Array(12).fill(0));
      setStores(ns);
      setDone(true);
      setMsg(ns[0] > ns[1] ? "Joueur 1 gagne !" : ns[1] > ns[0] ? "Joueur 2 gagne !" : "Egalite !");
      return;
    }

    const next = 1 - turn;
    setPits(np);
    setStores(ns);
    setTurn(next);
    setMsg(`Joueur ${next + 1} — ${next === 0 ? "rangee du bas" : "rangee du haut"}`);
  }

  function reset() {
    setPits([...INIT]);
    setStores([0, 0]);
    setTurn(0);
    setDone(false);
    setMsg("Joueur 1 — choisissez une case (rangee du bas)");
  }

  return (
    <div className="awale-game">
      <div className="awale-scoreline">
        <span className={turn === 1 && !done ? "awale-active" : ""}>
          Joueur 2 &nbsp;<strong>{stores[1]}</strong>
        </span>
        <span className="awale-msg">{msg}</span>
        <span className={turn === 0 && !done ? "awale-active" : ""}>
          <strong>{stores[0]}</strong>&nbsp; Joueur 1
        </span>
      </div>

      <div className="awale-board">
        {/* Player 2 top row — displayed right to left */}
        <div className="awale-row top">
          {[11, 10, 9, 8, 7, 6].map(i => (
            <button key={i}
              className={`awale-pit${pits[i] === 0 ? " empty" : ""}${turn === 1 && !done && pits[i] > 0 ? " selectable" : ""}`}
              onClick={() => sow(i)} disabled={turn !== 1 || done || pits[i] === 0}>
              {pits[i]}
            </button>
          ))}
        </div>
        <div className="awale-divider" />
        {/* Player 1 bottom row */}
        <div className="awale-row bottom">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <button key={i}
              className={`awale-pit${pits[i] === 0 ? " empty" : ""}${turn === 0 && !done && pits[i] > 0 ? " selectable" : ""}`}
              onClick={() => sow(i)} disabled={turn !== 0 || done || pits[i] === 0}>
              {pits[i]}
            </button>
          ))}
        </div>
      </div>

      {done
        ? <div className="awale-restart"><button className="primary" onClick={reset}>Nouvelle partie</button></div>
        : <p className="awale-hint">2 joueurs en local · J1 = bas · J2 = haut</p>
      }
    </div>
  );
}

// ─── Game Modal (tabbed) ──────────────────────────────────────────────────────

function GameModal({ game, onClose, isFav, onToggleFav }) {
  const [tab, setTab] = useState("apercu");
  if (!game) return null;
  const TABS = [
    { id: "apercu",    label: "Apercu" },
    { id: "regles",    label: "Regles" },
    { id: "histoire",  label: "Histoire" },
    { id: "mecanique", label: "Mecanique" },
    ...(game.playable ? [{ id: "jouer", label: "Jouer ▶" }] : []),
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">DLP.Game.{String(game.id).padStart(3, "0")}</p>
            <h2>{game.name}</h2>
            <p className="modal-aliases">{game.aliases?.length ? game.aliases.join(" · ") : "Aucun alias connu"}</p>
          </div>
          <div className="modal-header-actions">
            <button className={`fav-btn-lg ${isFav ? "faved" : ""}`} onClick={() => onToggleFav(game.id)} title="Favori">{isFav ? "♥" : "♡"}</button>
            <button className="icon-button" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="facts">
          <span>{game.period}</span>
          <span>{game.region}</span>
          <span>{game.type}</span>
          <span>{game.players}</span>
          <span>{game.duration}</span>
          <span>{game.year}</span>
          <ReconBadge status={game.reconstructionStatus} />
        </div>
        <div className="modal-tabs">
          {TABS.map(t => <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
        <div className="modal-body">
          {tab === "apercu" && (
            <div className="tab-content">
              <h3>Description</h3>
              <p>{game.description}</p>
              <div className="quick-facts">
                {[["Pays", game.country], ["Periode", game.period], ["Joueurs", game.players], ["Duree", game.duration], ["Age", game.age], ["Annee", game.year], ["Auteur", game.author]].map(([k, v]) => v && (
                  <div className="quick-fact" key={k}><span>{k}</span><strong>{v}</strong></div>
                ))}
              </div>
            </div>
          )}
          {tab === "regles" && (
            <div className="tab-content">
              <h3>Comment jouer</h3>
              <p>{game.rules}</p>
              <TutorialPrototype steps={game.tutorialSteps || []} />
            </div>
          )}
          {tab === "histoire" && (
            <div className="tab-content">
              <h3>Heritage culturel et historique</h3>
              <p>{game.history}</p>
              {game.references?.length > 0 && (
                <>
                  <h3>References</h3>
                  <ul>{game.references.map(r => <li key={r}>{r}</li>)}</ul>
                </>
              )}
            </div>
          )}
          {tab === "jouer" && (
            <div className="tab-content">
              <AwaleGame key={game.id} />
            </div>
          )}

          {tab === "mecanique" && (
            <div className="tab-content">
              <h3>Resume mecanique</h3>
              <p>{game.ludemeSummary}</p>
              <h3>Ludemes (mecaniques)</h3>
              <div className="tag-row large">{(game.ludemes || []).map(l => <span key={l}>{l}</span>)}</div>
              <h3>Categories</h3>
              <div className="tag-row large">{(game.categories || []).map(c => <span key={c}>{c}</span>)}</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── World Map ────────────────────────────────────────────────────────────────

function WorldMap({ games, onOpen, onFilterRegion }) {
  const gamePositions = useMemo(() => {
    const pos = {};
    const byRegion = {};
    games.forEach(g => {
      if (!byRegion[g.region]) byRegion[g.region] = [];
      byRegion[g.region].push(g);
    });
    Object.entries(byRegion).forEach(([region, list]) => {
      const c = REGION_MAP[region] || { cx: 400, cy: 210, spread: 40 };
      list.forEach((g, i) => {
        const angle = (i / list.length) * 2 * Math.PI - Math.PI / 2;
        const r = list.length <= 4 ? c.spread * 0.45 : c.spread * 0.75;
        pos[g.id] = { x: c.cx + Math.cos(angle) * r, y: c.cy + Math.sin(angle) * r * 0.72 };
      });
    });
    return pos;
  }, [games]);

  return (
    <div className="world-map-wrapper">
      <svg viewBox="0 0 800 420" className="world-map-svg">
        {/* Ocean */}
        <rect width="800" height="420" fill="#0f2a40" rx="10" />
        {/* Grid */}
        {[105,210,315].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#1a3a55" strokeWidth="0.6" />)}
        {[160,320,480,640].map(x => <line key={x} x1={x} y1="0" x2={x} y2="420" stroke="#1a3a55" strokeWidth="0.6" />)}

        {/* North America */}
        <path d="M68,70 Q130,52 195,72 Q238,84 248,128 Q245,175 225,218 Q198,258 165,272 Q136,268 112,238 Q80,198 68,158 Z" fill="#5a4a8a" opacity="0.85" style={{ cursor: "pointer" }} onClick={() => onFilterRegion("Amerique")} />
        <text x="158" y="175" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" style={{ pointerEvents: "none" }}>Amerique</text>

        {/* South America */}
        <path d="M165,285 Q210,278 235,300 Q252,330 240,370 Q220,395 195,398 Q165,394 148,368 Q132,336 140,308 Z" fill="#5a4a8a" opacity="0.65" />

        {/* Europe */}
        <path d="M315,55 Q366,46 410,64 Q442,82 448,110 Q438,138 415,148 Q388,158 360,152 Q330,144 312,124 Q302,104 315,55 Z" fill="#3a6a5a" opacity="0.85" style={{ cursor: "pointer" }} onClick={() => onFilterRegion("Europe")} />
        <text x="378" y="105" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" style={{ pointerEvents: "none" }}>Europe</text>

        {/* Africa */}
        <path d="M325,165 Q368,158 400,170 Q428,184 434,228 Q440,272 424,315 Q408,348 383,360 Q354,366 328,350 Q302,330 292,290 Q282,248 288,210 Q294,174 325,165 Z" fill="#7a5230" opacity="0.85" style={{ cursor: "pointer" }} onClick={() => onFilterRegion("Afrique")} />
        <text x="363" y="268" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" style={{ pointerEvents: "none" }}>Afrique</text>

        {/* Middle East */}
        <path d="M448,114 Q478,108 504,122 Q516,138 508,156 Q486,166 460,162 Q438,152 436,136 Z" fill="#3a6a5a" opacity="0.45" />

        {/* Asia */}
        <path d="M455,50 Q542,36 645,50 Q716,62 736,108 Q746,152 722,192 Q698,232 655,248 Q614,258 566,242 Q522,226 488,196 Q458,164 448,128 Q442,90 455,50 Z" fill="#2a5580" opacity="0.85" style={{ cursor: "pointer" }} onClick={() => onFilterRegion("Asie")} />
        <text x="595" y="158" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" style={{ pointerEvents: "none" }}>Asie</text>

        {/* SE Asia / Oceania hint */}
        <ellipse cx="690" cy="305" rx="52" ry="30" fill="#2a5580" opacity="0.35" />

        {/* Game dots */}
        {games.map(g => {
          const p = gamePositions[g.id];
          if (!p) return null;
          return (
            <g key={g.id} style={{ cursor: "pointer" }} onClick={() => onOpen(g)}>
              <circle cx={p.x} cy={p.y} r="6" fill="white" opacity="0.92" />
              <circle cx={p.x} cy={p.y} r="6" fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth="2" className="game-dot-ring" />
              <title>{g.name} — {g.country}</title>
            </g>
          );
        })}
      </svg>
      <p className="map-hint">Cliquez sur un continent pour filtrer · Cliquez sur un point blanc pour voir le jeu</p>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ games, onOpen }) {
  const sorted = useMemo(() => [...games].sort((a, b) => parseYear(a.year) - parseYear(b.year)), [games]);
  return (
    <div className="timeline-outer">
      <div className="timeline-scroll">
        <div className="timeline-track">
          <div className="timeline-line" />
          {sorted.map((g, i) => (
            <div key={g.id} className={`timeline-node ${i % 2 === 0 ? "above" : "below"}`}>
              <div className="timeline-card" onClick={() => onOpen(g)}>
                <span className={`period-pill ${g.period?.toLowerCase()}`}>{g.period}</span>
                <strong>{g.name}</strong>
                <span className="tl-year">{g.year}</span>
                <span className="tl-region">{g.region}</span>
              </div>
              <div className="timeline-stem" />
              <div className="timeline-dot" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Compare ─────────────────────────────────────────────────────────────────

const COMPARE_FIELDS = [
  { label: "Region", key: "region" },
  { label: "Pays", key: "country" },
  { label: "Epoque", key: "period" },
  { label: "Type", key: "type" },
  { label: "Difficulte", key: "difficulty" },
  { label: "Joueurs", key: "players" },
  { label: "Duree", key: "duration" },
  { label: "Age", key: "age" },
  { label: "Annee", key: "year" },
  { label: "Playable", fn: g => g.playable ? "Oui" : "Non" },
  { label: "Reconstruction", key: "reconstructionStatus" },
];

function ComparePage({ games, onOpen }) {
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const gA = games.find(g => String(g.id) === idA);
  const gB = games.find(g => String(g.id) === idB);
  const sharedLudemes = gA && gB ? (gA.ludemes || []).filter(l => (gB.ludemes || []).includes(l)) : [];

  return (
    <section>
      <div className="section-title"><h2>Comparer deux jeux</h2><span>Analyse comparative</span></div>
      <div className="compare-pickers">
        <select value={idA} onChange={e => setIdA(e.target.value)}>
          <option value="">Choisir le jeu A</option>
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="compare-vs">VS</div>
        <select value={idB} onChange={e => setIdB(e.target.value)}>
          <option value="">Choisir le jeu B</option>
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {gA && gB && (
        <>
          <div className="compare-header-row">
            <div className="compare-game-hero" onClick={() => onOpen(gA)}>
              <ReconBadge status={gA.reconstructionStatus} />
              <h3>{gA.name}</h3>
              <p>{gA.country} · {gA.year}</p>
            </div>
            <div className="compare-game-hero" onClick={() => onOpen(gB)}>
              <ReconBadge status={gB.reconstructionStatus} />
              <h3>{gB.name}</h3>
              <p>{gB.country} · {gB.year}</p>
            </div>
          </div>

          <div className="compare-table">
            {COMPARE_FIELDS.map(f => {
              const vA = f.fn ? f.fn(gA) : (gA[f.key] || "—");
              const vB = f.fn ? f.fn(gB) : (gB[f.key] || "—");
              return (
                <div key={f.label} className={`compare-row ${vA === vB ? "same" : "diff"}`}>
                  <span className="compare-label">{f.label}</span>
                  <span className="compare-val">{vA}</span>
                  <span className="compare-val">{vB}</span>
                </div>
              );
            })}
          </div>

          <div className="compare-ludemes-grid">
            <div>
              <h4>Ludemes — {gA.name}</h4>
              <div className="tag-row">{(gA.ludemes || []).map(l => <span key={l} className={(gB.ludemes || []).includes(l) ? "shared-tag" : ""}>{l}</span>)}</div>
            </div>
            <div>
              <h4>Ludemes — {gB.name}</h4>
              <div className="tag-row">{(gB.ludemes || []).map(l => <span key={l} className={(gA.ludemes || []).includes(l) ? "shared-tag" : ""}>{l}</span>)}</div>
            </div>
          </div>

          {sharedLudemes.length > 0 && (
            <div className="shared-ludemes-box">
              <strong>Ludemes communs ({sharedLudemes.length})</strong>
              <div className="tag-row">{sharedLudemes.map(l => <span key={l} className="shared-tag">{l}</span>)}</div>
            </div>
          )}
        </>
      )}

      {(!gA || !gB) && (
        <div className="compare-placeholder">
          <p>Selectionnez deux jeux ci-dessus pour voir une comparaison detaillee.</p>
        </div>
      )}
    </section>
  );
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

function generateQuestions(games) {
  const regions = [...new Set(games.map(g => g.region))];
  const periods = [...new Set(games.map(g => g.period))];
  const types = [...new Set(games.map(g => g.type))];
  const difficulties = [...new Set(games.map(g => g.difficulty))];
  const qs = [];

  games.forEach(g => {
    const wR = shuffle(regions.filter(r => r !== g.region)).slice(0, 3);
    qs.push({ q: `De quelle region provient "${g.name}" ?`, correct: g.region, opts: shuffle([g.region, ...wR]) });

    const wP = shuffle(periods.filter(p => p !== g.period)).slice(0, 3);
    qs.push({ q: `A quelle epoque remonte "${g.name}" ?`, correct: g.period, opts: shuffle([g.period, ...wP]) });

    const wT = shuffle(types.filter(t => t !== g.type)).slice(0, 3);
    qs.push({ q: `Quel est le type de jeu de "${g.name}" ?`, correct: g.type, opts: shuffle([g.type, ...wT]) });

    const wD = shuffle(difficulties.filter(d => d !== g.difficulty)).slice(0, 3);
    qs.push({ q: `Quel niveau est recommande pour "${g.name}" ?`, correct: g.difficulty, opts: shuffle([g.difficulty, ...wD]) });
  });

  return shuffle(qs);
}

function QuizPage({ user, games, leaderboard, onScoreSubmit }) {
  const TOTAL = 10;
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [phase, setPhase] = useState("start"); // start | playing | done

  function startQuiz() {
    setQs(generateQuestions(games).slice(0, TOTAL));
    setIdx(0); setScore(0); setSelected(null); setAnswered(false); setPhase("playing");
  }

  function pick(opt) {
    if (answered) return;
    const correct = qs[idx].correct;
    setSelected(opt);
    setAnswered(true);
    if (opt === correct) setScore(s => s + 1);
  }

  function next() {
    if (idx + 1 >= qs.length) {
      setPhase("done");
      onScoreSubmit(score + (selected === qs[idx]?.correct ? 0 : 0), TOTAL);
      return;
    }
    setIdx(i => i + 1); setSelected(null); setAnswered(false);
  }

  if (phase === "start") return (
    <section>
      <div className="section-title"><h2>Quiz</h2><span>Testez vos connaissances</span></div>
      <div className="quiz-layout">
        <div className="quiz-start-card">
          <h3>Quiz — Jeux Traditionnels</h3>
          <p>{TOTAL} questions sur les origines, periodes, types et niveaux des jeux du catalogue.</p>
          <button className="primary" onClick={startQuiz}>Commencer</button>
        </div>
        <div className="quiz-leaderboard-card">
          <h3>Classement</h3>
          {leaderboard.length === 0
            ? <p className="muted">Aucun score. Soyez le premier !</p>
            : <ol className="leaderboard-list">
                {leaderboard.map((e, i) => (
                  <li key={e.id} className={i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}>
                    <span className="lb-rank">#{i + 1}</span>
                    <span className="lb-name">{e.displayName}</span>
                    <span className="lb-score">{e.score}/{e.total}</span>
                  </li>
                ))}
              </ol>
          }
        </div>
      </div>
    </section>
  );

  if (phase === "done") {
    const pct = Math.round((score / TOTAL) * 100);
    const msg = pct >= 80 ? "Excellent ! Vous etes un expert !" : pct >= 60 ? "Bien joue !" : "Continuez a explorer le catalogue !";
    return (
      <section>
        <div className="quiz-result-screen">
          <h2>Quiz termine !</h2>
          <div className="quiz-score-circle">{score}<span>/{TOTAL}</span></div>
          <p>{msg}</p>
          <div className="row-actions" style={{ justifyContent: "center" }}>
            <button className="secondary" onClick={() => setPhase("start")}>Voir classement</button>
            <button className="primary" onClick={startQuiz}>Rejouer</button>
          </div>
        </div>
      </section>
    );
  }

  const q = qs[idx];
  if (!q) return null;
  return (
    <section>
      <div className="quiz-progress-wrap">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${((idx + 1) / TOTAL) * 100}%` }} />
        </div>
        <span>{idx + 1} / {TOTAL} · Score: {score}</span>
      </div>
      <div className="quiz-card">
        <h3 className="quiz-question">{q.q}</h3>
        <div className="quiz-options">
          {q.opts.map(opt => {
            let cls = "quiz-option";
            if (answered) cls += opt === q.correct ? " correct" : opt === selected ? " wrong" : " dimmed";
            return <button key={opt} className={cls} onClick={() => pick(opt)} disabled={answered}>{opt}</button>;
          })}
        </div>
        {answered && (
          <div className="quiz-feedback">
            <p className={selected === q.correct ? "fb-correct" : "fb-wrong"}>
              {selected === q.correct ? "Bonne reponse !" : `Reponse correcte : ${q.correct}`}
            </p>
            <button className="primary" onClick={next}>
              {idx + 1 >= TOTAL ? "Voir mon score" : "Question suivante"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function LudoApp({ user, onLogout, onUpdateUser }) {
  const [page, setPage] = useState("Catalogue");
  const [games, setGames] = useState(FALLBACK_GAMES);
  const [regions, setRegions] = useState(["Afrique", "Asie", "Europe", "Amerique"]);
  const [categories, setCategories] = useState(["Board", "Sow", "Race", "War"]);
  const [gameOfDay, setGameOfDay] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("Tous");
  const [period, setPeriod] = useState("Tous");
  const [category, setCategory] = useState("Tous");
  const [level, setLevel] = useState("Tous");
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityError, setCommunityError] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postGameId, setPostGameId] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{ role: "agent", text: "Bonjour. Je peux recommander un jeu, expliquer des regles ou comparer des ludemes." }]);
  const [botTyping, setBotTyping] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [favs, setFavs] = useState(readFavs);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [recentIds, setRecentIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    niveau: user.profile?.niveau || "",
    typeJeuPrefere: user.profile?.typeJeuPrefere || "",
    regionPreferee: user.profile?.regionPreferee || "",
    langue: user.profile?.langue || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    getJson(`${API_BASE}/api/jeux`, FALLBACK_GAMES).then(setGames);
    getJson(`${API_BASE}/api/jeux/regions`, regions).then(setRegions);
    getJson(`${API_BASE}/api/jeux/categories`, categories).then(setCategories);
    getJson(`${API_BASE}/api/jeux/day`, null).then(setGameOfDay);
    getJson(`${API_BASE}/api/quiz/leaderboard`, []).then(setLeaderboard);
    loadCommunity();
  }, []);

  const filteredGames = useMemo(() => {
    const q = query.toLowerCase();
    return games.filter(g => {
      const text = [g.name, g.country, g.description, g.ludemeSummary, ...(g.aliases || []), ...(g.categories || []), ...(g.ludemes || [])].join(" ").toLowerCase();
      return (!q || text.includes(q))
        && (region === "Tous" || g.region === region)
        && (period === "Tous" || g.period === period)
        && (category === "Tous" || (g.categories || []).includes(category) || g.type === category)
        && (level === "Tous" || g.difficulty === level);
    });
  }, [games, query, region, period, category, level]);

  const ludemeGroups = useMemo(() => {
    return categories.map(name => ({
      name,
      count: games.filter(g => (g.categories || []).includes(name)).length,
      games: games.filter(g => (g.categories || []).includes(name)).slice(0, 5),
    })).filter(gr => gr.count > 0);
  }, [categories, games]);

  function toggleFav(id) {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function loadCommunity() {
    setCommunityPosts(await getJson(`${API_BASE}/api/community/posts`, []));
  }

  async function submitPost() {
    if (!postContent.trim()) { setCommunityError("Ecrivez un message avant de publier."); return; }
    setCommunityError("");
    const selectedPostGame = games.find(g => String(g.id) === String(postGameId));
    const r = await fetch(`${API_BASE}/api/community/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: user.id, authorName: user.displayName, authorEmail: user.email, content: postContent, linkedGameId: selectedPostGame ? String(selectedPostGame.id) : null, linkedGameName: selectedPostGame?.name || null }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data) { setCommunityError("Publication impossible."); return; }
    setCommunityPosts([data, ...communityPosts]); setPostContent(""); setPostGameId("");
  }

  async function toggleLike(postId) {
    const r = await fetch(`${API_BASE}/api/community/posts/${postId}/likes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
    const data = await r.json().catch(() => null);
    if (r.ok && data) setCommunityPosts(posts => posts.map(p => p.id === postId ? data : p));
  }

  async function submitComment(postId) {
    const content = (commentDrafts[postId] || "").trim();
    if (!content) return;
    const r = await fetch(`${API_BASE}/api/community/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authorId: user.id, authorName: user.displayName, content }) });
    const data = await r.json().catch(() => null);
    if (r.ok && data) { setCommunityPosts(posts => posts.map(p => p.id === postId ? data : p)); setCommentDrafts({ ...commentDrafts, [postId]: "" }); }
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages(m => [...m, { role: "user", text }]); setChatInput(""); setBotTyping(true);
    try {
      const r = await fetch(`${API_BASE}/api/agent/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, message: text, profile: user.profile }) });
      const data = await r.json().catch(() => ({}));
      setChatMessages(m => [...m, { role: "agent", text: data.reply || "Je n'ai pas de reponse pour le moment." }]);
    } catch {
      setChatMessages(m => [...m, { role: "agent", text: "Connexion au backend impossible." }]);
    } finally { setBotTyping(false); }
  }

  async function handleScoreSubmit(score, total) {
    try {
      await fetch(`${API_BASE}/api/quiz/scores`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, displayName: user.displayName, score, total }) });
      getJson(`${API_BASE}/api/quiz/leaderboard`, []).then(setLeaderboard);
    } catch {}
  }

  function openGame(game) {
    setSelectedGame(game);
    setRecentIds(prev => {
      const next = [game.id, ...prev.filter(id => id !== game.id)].slice(0, 10);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }
  function filterByRegion(r) { setRegion(r); setPage("Catalogue"); }

  async function saveProfile() {
    setProfileSaving(true); setProfileMsg("");
    try {
      const r = await fetch(`${API_BASE}/api/auth/users/${user.id}/onboarding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileDraft),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Erreur serveur");
      onUpdateUser(data.user);
      setProfileMsg("ok");
      setEditingProfile(false);
    } catch (e) {
      setProfileMsg(e.message || "Echec de la sauvegarde.");
    } finally {
      setProfileSaving(false);
    }
  }

  function startEditProfile() {
    setProfileDraft({
      niveau: user.profile?.niveau || "",
      typeJeuPrefere: user.profile?.typeJeuPrefere || "",
      regionPreferee: user.profile?.regionPreferee || "",
      langue: user.profile?.langue || "",
    });
    setProfileMsg("");
    setEditingProfile(true);
  }

  const favGames = games.filter(g => favs.includes(g.id));

  const recentGameObjects = useMemo(() =>
    recentIds.slice(0, 8).map(id => games.find(g => g.id === id)).filter(Boolean),
    [recentIds, games]
  );

  const recommendedGames = useMemo(() => {
    const prof = user.profile;
    if (!prof) return [];
    return games.filter(g =>
      !favs.includes(g.id) &&
      !recentIds.includes(g.id) &&
      (g.region === prof.regionPreferee || g.type === prof.typeJeuPrefere || g.difficulty === prof.niveau)
    ).slice(0, 4);
  }, [games, user.profile, favs, recentIds]);

  const achievements = useMemo(() => {
    const viewed = games.filter(g => recentIds.includes(g.id));
    const data = {
      viewCount:   recentIds.length,
      favCount:    favs.length,
      regionCount: new Set(viewed.map(g => g.region)).size,
      ancientCount: viewed.filter(g => g.period === "Ancient").length,
      postCount:   communityPosts.filter(p => p.authorId === user.id).length,
    };
    return ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: checkAchievement(a.id, data) }));
  }, [recentIds, favs, games, communityPosts, user.id]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">LH</span>
          <div><strong>LudoHeritage</strong><small>Digital Ludeme Project</small></div>
        </div>
        <nav className="topbar-nav">
          {NAV.map(item => <button key={item} className={page === item ? "active" : ""} onClick={() => setPage(item)}>{item}</button>)}
        </nav>
        <button className="secondary compact" onClick={onLogout}>Deconnexion</button>
      </header>

      <main className="workspace">
        {/* Hero */}
        <section className="hero-band">
          <div>
            <p className="eyebrow">Jeu du jour</p>
            <h1>{gameOfDay?.name || "Catalogue mondial des jeux"}</h1>
            <p>{gameOfDay?.description || "Explorez les jeux par periode, region, categorie et ludemes."}</p>
            {gameOfDay && <button className="primary" style={{ marginTop: 16 }} onClick={() => openGame(gameOfDay)}>Decouvrir ce jeu</button>}
          </div>
          <div className="hero-stats">
            <span><strong>{games.length}</strong><small>jeux</small></span>
            <span><strong>{regions.length}</strong><small>regions</small></span>
            <span><strong>{categories.length}</strong><small>categories</small></span>
            <span><strong>{favs.length}</strong><small>favoris</small></span>
          </div>
        </section>

        {/* Catalogue */}
        {page === "Catalogue" && (
          <section>
            <div className="library-toolbar">
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nom / Alias / Ludeme / Pays..." />
              <select value={period} onChange={e => setPeriod(e.target.value)}>{PERIODS.map(i => <option key={i}>{i}</option>)}</select>
              <select value={region} onChange={e => setRegion(e.target.value)}>{["Tous", ...regions].map(i => <option key={i}>{i}</option>)}</select>
              <select value={category} onChange={e => setCategory(e.target.value)}>{["Tous", ...categories].map(i => <option key={i}>{i}</option>)}</select>
              <select value={level} onChange={e => setLevel(e.target.value)}>{LEVELS.map(i => <option key={i}>{i}</option>)}</select>
            </div>
            <div className="section-title"><h2>Bibliotheque de jeux</h2><span>{filteredGames.length} resultats</span></div>
            <div className="game-grid">
              {filteredGames.map(g => <GameCard key={g.id} game={g} onOpen={openGame} isFav={favs.includes(g.id)} onToggleFav={toggleFav} />)}
            </div>
          </section>
        )}

        {/* Carte */}
        {page === "Carte" && (
          <section>
            <div className="section-title"><h2>Carte mondiale</h2><span>Distribution geographique</span></div>
            <WorldMap games={games} onOpen={openGame} onFilterRegion={filterByRegion} />
            <div className="region-stats">
              {regions.map(name => {
                const rGames = games.filter(g => g.region === name);
                return (
                  <button key={name} className="region-card" onClick={() => filterByRegion(name)}>
                    <strong>{name}</strong>
                    <span>{rGames.length} jeux documentes</span>
                    <p>{rGames.slice(0, 3).map(g => g.name).join(", ")}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Chronologie */}
        {page === "Chronologie" && (
          <section>
            <div className="section-title"><h2>Chronologie</h2><span>De l'Antiquite a nos jours</span></div>
            <div className="period-legend">
              {["Ancient", "Medieval", "Modern"].map(p => <span key={p} className={`period-pill ${p.toLowerCase()}`}>{p}</span>)}
            </div>
            <Timeline games={games} onOpen={openGame} />
          </section>
        )}

        {/* Ludemes */}
        {page === "Ludemes" && (
          <section>
            <div className="section-title"><h2>Ludemes &amp; Concepts</h2><span>Mecaniques partagees entre jeux</span></div>
            <div className="concept-grid">
              {ludemeGroups.map(gr => (
                <article key={gr.name} className="concept-card" onClick={() => { setCategory(gr.name); setPage("Catalogue"); }}>
                  <strong>{gr.name}</strong>
                  <span className="concept-count">{gr.count} jeux</span>
                  <p>{gr.games.map(g => g.name).join(", ")}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Comparer */}
        {page === "Comparer" && <ComparePage games={games} onOpen={openGame} />}

        {/* Quiz */}
        {page === "Quiz" && <QuizPage user={user} games={games} leaderboard={leaderboard} onScoreSubmit={handleScoreSubmit} />}

        {/* Communaute */}
        {page === "Communaute" && (
          <section>
            <div className="section-title"><h2>Forum communautaire</h2><span>Contributions, questions et variantes</span></div>
            <div className="composer-card">
              <div className="avatar">{initials(user.displayName)}</div>
              <div>
                <select value={postGameId} onChange={e => setPostGameId(e.target.value)}>
                  <option value="">Associer un jeu (optionnel)</option>
                  {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Partagez une source, une variante ou une question..." />
                {communityError && <div className="error">{communityError}</div>}
                <button className="primary" onClick={submitPost}>Publier</button>
              </div>
            </div>
            <div className="feed">
              {communityPosts.map(post => (
                <article className="post-card" key={post.id}>
                  <div className="post-head">
                    <span className="avatar small">{initials(post.authorName)}</span>
                    <div><strong>{post.authorName}</strong><small>{timeAgo(post.createdAt)}{post.linkedGameName ? ` · ${post.linkedGameName}` : ""}</small></div>
                  </div>
                  <p>{post.content}</p>
                  <div className="post-actions">
                    <button onClick={() => toggleLike(post.id)}>J'aime ({post.likeCount || 0})</button>
                    <span>{post.comments?.length || 0} commentaires</span>
                  </div>
                  <div className="comments">
                    {(post.comments || []).map(c => <p key={c.id}><strong>{c.authorName}</strong> {c.content}</p>)}
                    <div className="comment-row">
                      <input value={commentDrafts[post.id] || ""} onChange={e => setCommentDrafts({ ...commentDrafts, [post.id]: e.target.value })} placeholder="Ajouter un commentaire" />
                      <button onClick={() => submitComment(post.id)}>Envoyer</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Profil */}
        {page === "Profil" && (
          <section>

            {/* ── Header ── */}
            <div className="profile-header-card">
              <div className="profile-avatar-xl">{initials(user.displayName)}</div>
              <div className="profile-header-info">
                <h2>{user.displayName}</h2>
                <p className="muted">{user.email}</p>
                <div className="profile-quick-stats">
                  <span><strong>{favs.length}</strong><small>Favoris</small></span>
                  <span><strong>{recentIds.length}</strong><small>Consultes</small></span>
                  <span><strong>{communityPosts.filter(p => p.authorId === user.id).length}</strong><small>Posts</small></span>
                  <span><strong>{achievements.filter(a => a.unlocked).length}</strong><small>Succes</small></span>
                </div>
              </div>
              <button className="secondary" onClick={editingProfile ? () => setEditingProfile(false) : startEditProfile}>
                {editingProfile ? "Annuler" : "Modifier les preferences"}
              </button>
            </div>

            {/* ── Edit preferences ── */}
            {editingProfile && (
              <div className="profile-edit-card">
                <h3>Modifier mes preferences de jeu</h3>
                <div className="profile-edit-grid">
                  {[
                    { key: "niveau",         label: "Niveau",        opts: ["Debutant", "Amateur", "Passionne"] },
                    { key: "typeJeuPrefere", label: "Type prefere",  opts: ["Strategie", "Hasard", "Hasard et strategie", "Adresse"] },
                    { key: "regionPreferee", label: "Region",        opts: ["Afrique", "Asie", "Europe", "Amerique"] },
                    { key: "langue",         label: "Langue",        opts: ["Francais", "English", "Arabic"] },
                  ].map(({ key, label, opts }) => (
                    <label key={key}>
                      {label}
                      <select value={profileDraft[key] || ""} onChange={e => setProfileDraft({ ...profileDraft, [key]: e.target.value })}>
                        <option value="">-- choisir --</option>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                {profileMsg && profileMsg !== "ok" && <p className="error">{profileMsg}</p>}
                <button className="primary" disabled={profileSaving} onClick={saveProfile}>
                  {profileSaving ? "Enregistrement..." : "Sauvegarder"}
                </button>
              </div>
            )}

            {/* ── Current preferences ── */}
            <div className="section-title" style={{ marginTop: 24 }}><h2>Preferences</h2></div>
            <div className="profile-grid">
              {[
                ["Niveau",        user.profile?.niveau          || "A definir"],
                ["Type prefere",  user.profile?.typeJeuPrefere  || "A definir"],
                ["Region",        user.profile?.regionPreferee  || "A definir"],
                ["Langue",        user.profile?.langue          || "A definir"],
              ].map(([label, value]) => (
                <div className="profile-tile" key={label}><span>{label}</span><strong>{value}</strong></div>
              ))}
            </div>

            {/* ── Achievements ── */}
            <div className="section-title" style={{ marginTop: 28 }}>
              <h2>Succes</h2>
              <span>{achievements.filter(a => a.unlocked).length} / {ALL_ACHIEVEMENTS.length} debloqués</span>
            </div>
            <div className="achievements-grid">
              {achievements.map(a => (
                <div key={a.id} className={`achievement-card ${a.unlocked ? "unlocked" : "locked"}`}>
                  <span className="ach-icon">{a.icon}</span>
                  <strong>{a.label}</strong>
                  <p>{a.desc}</p>
                </div>
              ))}
            </div>

            {/* ── Recommended ── */}
            {recommendedGames.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 28 }}>
                  <h2>Recommandes pour vous</h2>
                  <span>Bases sur vos preferences</span>
                </div>
                <div className="game-grid">
                  {recommendedGames.map(g => <GameCard key={g.id} game={g} onOpen={openGame} isFav={favs.includes(g.id)} onToggleFav={toggleFav} />)}
                </div>
              </>
            )}

            {/* ── Recently viewed ── */}
            {recentGameObjects.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 28 }}>
                  <h2>Recemment consultes</h2>
                  <span>{recentGameObjects.length} jeux</span>
                </div>
                <div className="game-grid">
                  {recentGameObjects.map(g => <GameCard key={g.id} game={g} onOpen={openGame} isFav={favs.includes(g.id)} onToggleFav={toggleFav} />)}
                </div>
              </>
            )}

            {/* ── Favorites ── */}
            {favGames.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 28 }}>
                  <h2>Mes Favoris</h2>
                  <span>{favGames.length} jeux</span>
                </div>
                <div className="game-grid">
                  {favGames.map(g => <GameCard key={g.id} game={g} onOpen={openGame} isFav={true} onToggleFav={toggleFav} />)}
                </div>
              </>
            )}

            {/* ── My community posts ── */}
            {communityPosts.filter(p => p.authorId === user.id).length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 28 }}>
                  <h2>Mes publications</h2>
                  <span>{communityPosts.filter(p => p.authorId === user.id).length} posts</span>
                </div>
                <div className="feed">
                  {communityPosts.filter(p => p.authorId === user.id).map(post => (
                    <article className="post-card" key={post.id}>
                      <div className="post-head">
                        <span className="avatar small">{initials(post.authorName)}</span>
                        <div><strong>{post.authorName}</strong><small>{timeAgo(post.createdAt)}{post.linkedGameName ? ` · ${post.linkedGameName}` : ""}</small></div>
                      </div>
                      <p>{post.content}</p>
                      <div className="post-actions">
                        <span>J'aime ({post.likeCount || 0})</span>
                        <span>{post.comments?.length || 0} commentaires</span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {recentIds.length === 0 && favs.length === 0 && (
              <div className="profile-empty">
                <p>Explorez le catalogue, ajoutez des favoris et completez un quiz pour enrichir votre profil !</p>
                <button className="primary" onClick={() => setPage("Catalogue")}>Explorer le catalogue</button>
              </div>
            )}

          </section>
        )}
      </main>

      {/* Floating Chat */}
      {chatOpen && (
        <aside className="chat-panel">
          <header>
            <div>
              <strong>LudoBot</strong>
              {ollamaStatus === null && <small className="ollama-pinging">connexion…</small>}
              {ollamaStatus?.status === "ok"   && <small className="ollama-ok">Ollama · {ollamaStatus.model}</small>}
              {ollamaStatus?.status === "error" && <small className="ollama-err">Ollama hors ligne</small>}
            </div>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </header>
          <div className="chat-body">
            {chatMessages.map((m, i) => <div key={i} className={`bubble ${m.role === "user" ? "user" : "agent"}`}>{m.text}</div>)}
            {botTyping && <div className="bubble agent typing">...</div>}
          </div>
          <footer>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Question sur les jeux..." />
            <button onClick={sendChat}>Envoyer</button>
          </footer>
        </aside>
      )}
      <button className="chat-fab" onClick={() => {
        const opening = !chatOpen;
        setChatOpen(opening);
        if (opening && ollamaStatus === null) {
          getJson(`${API_BASE}/api/agent/ping`, null).then(setOllamaStatus);
        }
      }}>
        {chatOpen ? "✕" : "LudoBot"}
      </button>

      <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} isFav={selectedGame ? favs.includes(selectedGame.id) : false} onToggleFav={toggleFav} />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ displayName: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [onboardingAnswers, setOnboardingAnswers] = useState(() => ({
    niveau: readStoredUser()?.profile?.niveau || "",
    typeJeuPrefere: readStoredUser()?.profile?.typeJeuPrefere || "",
    regionPreferee: readStoredUser()?.profile?.regionPreferee || "",
    langue: readStoredUser()?.profile?.langue || "",
  }));
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  function persistUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setOnboardingAnswers({ niveau: user.profile?.niveau || "", typeJeuPrefere: user.profile?.typeJeuPrefere || "", regionPreferee: user.profile?.regionPreferee || "", langue: user.profile?.langue || "" });
  }

  async function submitAuth(e) {
    e.preventDefault();
    if (authMode === "register" && authForm.password !== authForm.confirm) {
      setAuthError("Les mots de passe ne correspondent pas.");
      return;
    }
    setAuthLoading(true); setAuthError("");
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = authMode === "login" ? { email: authForm.email, password: authForm.password } : authForm;
      const r = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Echec de l'authentification.");
      persistUser(data.user); setAuthForm({ displayName: "", email: "", password: "" });
    } catch (err) { setAuthError(err.message || "Impossible de continuer."); }
    finally { setAuthLoading(false); }
  }

  async function submitOnboarding() {
    if (!currentUser) return;
    setOnboardingLoading(true); setOnboardingError("");
    try {
      const r = await fetch(`${API_BASE}/api/auth/users/${currentUser.id}/onboarding`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(onboardingAnswers) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || "Impossible d'enregistrer le profil.");
      persistUser(data.user);
    } catch (err) { setOnboardingError(err.message || "Erreur."); }
    finally { setOnboardingLoading(false); }
  }

  function logout() { localStorage.removeItem(STORAGE_KEY); setCurrentUser(null); }

  if (!currentUser) return <AuthGate mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} submit={submitAuth} loading={authLoading} error={authError} />;
  if (!currentUser.onboardingCompleted) return <OnboardingFlow user={currentUser} answers={onboardingAnswers} setAnswers={setOnboardingAnswers} submit={submitOnboarding} loading={onboardingLoading} error={onboardingError} />;
  return <LudoApp user={currentUser} onLogout={logout} onUpdateUser={persistUser} />;
}
