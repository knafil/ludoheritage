import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import './styles.css';
const rawApiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
// Supprime le slash final s'il existe
const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;
const STORAGE_KEY = "ludoheritage-user";
const FAV_KEY     = "ludoheritage-favs";
const RECENT_KEY  = "ludoheritage-recent";

const ALL_ACHIEVEMENTS = [
  { id: "first-view",   icon: "◆", labelKey: "achievements.firstViewLabel",   descKey: "achievements.firstViewDesc" },
  { id: "explorer",     icon: "◎", labelKey: "achievements.explorerLabel",    descKey: "achievements.explorerDesc" },
  { id: "scholar",      icon: "◈", labelKey: "achievements.scholarLabel",     descKey: "achievements.scholarDesc" },
  { id: "first-fav",    icon: "♥", labelKey: "achievements.firstFavLabel",    descKey: "achievements.firstFavDesc" },
  { id: "collector",    icon: "★", labelKey: "achievements.collectorLabel",   descKey: "achievements.collectorDesc" },
  { id: "globetrotter", icon: "●", labelKey: "achievements.globetrotterLabel",descKey: "achievements.globetrotterDesc" },
  { id: "world",        icon: "◉", labelKey: "achievements.worldLabel",       descKey: "achievements.worldDesc" },
  { id: "historian",    icon: "▼", labelKey: "achievements.historianLabel",   descKey: "achievements.historianDesc" },
  { id: "contributor",  icon: "✦", labelKey: "achievements.contributorLabel", descKey: "achievements.contributorDesc" },
  { id: "active",       icon: "▲", labelKey: "achievements.activeLabel",      descKey: "achievements.activeDesc" },
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
  { key: "niveau", titleKey: "onboarding.levelTitle", options: ["Debutant", "Amateur", "Passionne"] },
  { key: "typeJeuPrefere", titleKey: "onboarding.typeTitle", options: ["Strategie", "Hasard", "Hasard et strategie", "Adresse"] },
  { key: "regionPreferee", titleKey: "onboarding.regionTitle", options: ["Afrique", "Asie", "Europe", "Amerique"] },
  { key: "langue", titleKey: "onboarding.langTitle", options: ["Francais", "English", "Arabic"] },
];

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
function parseYear(y) {
  if (!y) return 0;
  const m = y.match(/(-?\d+)/);
  if (!m) return 0;
  return y.toLowerCase().includes("av") ? -parseInt(m[1]) : parseInt(m[1]);
}
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// ─── Auth ────────────────────────────────────────────────────────────────────

function AuthGate({ mode, setMode, form, setForm, submit, loading, error }) {
  const { t } = useTranslation();
  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <p className="eyebrow">LudoHeritage Portal</p>
        <h1>{t('authIntroTitle', 'Une bibliothèque vivante des jeux traditionnels.')}</h1>
        <p>{t('authIntroSubtitle', 'Explorez 20 jeux du monde entier, leurs origines, leurs mécaniques et leur héritage culturel.')}</p>
      </section>
      <section className="auth-panel">
        <div className="segmented">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>{t('login', 'Connexion')}</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>{t('register', 'Créer un compte')}</button>
        </div>
        <form onSubmit={submit} className="form-grid">
          {mode === "register" && (
            <label>{t('fullName', 'Nom complet')}<input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} required minLength={2} /></label>
          )}
          <label>{t('email', 'Email')}<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
          <label>{t('password', 'Mot de passe')}<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></label>
          {mode === "register" && (
            <label>{t('confirmPassword', 'Confirmer le mot de passe')}<input type="password" value={form.confirm || ""} onChange={e => setForm({ ...form, confirm: e.target.value })} required minLength={6} /></label>
          )}
          {error && <div className="error">{error}</div>}
          <button className="primary" disabled={loading}>{loading ? t('pleaseWait', 'Veuillez patienter...') : t('continue', 'Continuer')}</button>
        </form>
      </section>
    </main>
  );
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

function OnboardingFlow({ user, answers, setAnswers, submit, loading, error }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = ONBOARDING_QUESTIONS[step];
  const isLast = step === ONBOARDING_QUESTIONS.length - 1;
  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel">
        <p className="eyebrow">{t('playerProfile', 'Profil joueur')}</p>
        <h1>{t('welcome', 'Bienvenue')} {user.displayName}</h1>
        <div className="progress">
          {ONBOARDING_QUESTIONS.map((q, i) => <span key={q.key} className={i <= step ? "active" : ""} />)}
        </div>
        <h2>{t(current.titleKey, current.key)}</h2>
        <div className="option-list">
          {current.options.map(opt => (
            <button key={opt} className={answers[current.key] === opt ? "selected" : ""} onClick={() => setAnswers({ ...answers, [current.key]: opt })}>{opt}</button>
          ))}
        </div>
        {error && <div className="error">{error}</div>}
        <div className="row-actions">
          <button className="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{t('previous', 'Précédent')}</button>
          {isLast
            ? <button className="primary" disabled={!answers[current.key] || loading} onClick={submit}>{t('finish', 'Terminer')}</button>
            : <button className="primary" disabled={!answers[current.key]} onClick={() => setStep(step + 1)}>{t('next', 'Suivant')}</button>}
        </div>
      </section>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReconBadge({ status }) {
  const { t } = useTranslation();
  const cls = status === "Done" ? "badge-done" : status === "Pending" ? "badge-pending" : "badge-partial";
  const label = status === "Done" ? t('reconstructed', 'Reconstruit') : status === "Pending" ? t('inProgress', 'En cours') : status || t('unknown', 'Inconnu');
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
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  if (!steps.length) return <p className="muted">{t('noTutorial', 'Pas de prototype tutorial disponible.')}</p>;
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
        <BoardSnapshot title={t('before', 'Avant')} rows={step.beforeBoard} />
        <BoardSnapshot title={t('after', 'Après')} rows={step.afterBoard} />
      </div>
      <div className="row-actions compact-row">
        <button className="secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>{t('previous', 'Précédent')}</button>
        <button className="secondary" onClick={() => setIdx(0)}>{t('restart', 'Recommencer')}</button>
        <button className="primary" disabled={idx === steps.length - 1} onClick={() => setIdx(idx + 1)}>{t('next', 'Suivant')}</button>
      </div>
    </section>
  );
}

// ─── Awale Game ───────────────────────────────────────────────────────────────

function AwaleGame() {
  const { t } = useTranslation();
  const INIT = Array(12).fill(4);
  const [pits, setPits] = useState([...INIT]);
  const [stores, setStores] = useState([0, 0]);
  const [turn, setTurn] = useState(0);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState(t('awaleP1Turn', 'Joueur 1 — choisissez une case (rangée du bas)'));

  function sow(idx) {
    if (done || pits[idx] === 0) return;
    if (turn === 0 && idx >= 6) return;
    if (turn === 1 && idx < 6) return;

    const np = [...pits];
    const ns = [...stores];
    let seeds = np[idx];
    np[idx] = 0;
    let pos = idx;

    while (seeds > 0) {
      pos = (pos + 1) % 12;
      if (seeds >= 12 && pos === idx) continue;
      np[pos]++;
      seeds--;
    }

    const [oppStart, oppEnd] = turn === 0 ? [6, 11] : [0, 5];
    let cp = pos;
    while (cp >= oppStart && cp <= oppEnd && (np[cp] === 2 || np[cp] === 3)) {
      ns[turn] += np[cp];
      np[cp] = 0;
      cp--;
    }

    const sum0 = np.slice(0, 6).reduce((a, b) => a + b, 0);
    const sum1 = np.slice(6).reduce((a, b) => a + b, 0);
    if (sum0 === 0 || sum1 === 0) {
      ns[0] += sum0;
      ns[1] += sum1;
      setPits(Array(12).fill(0));
      setStores(ns);
      setDone(true);
      setMsg(ns[0] > ns[1] ? t('p1Wins', 'Joueur 1 gagne !') : ns[1] > ns[0] ? t('p2Wins', 'Joueur 2 gagne !') : t('draw', 'Égalité !'));
      return;
    }

    const next = 1 - turn;
    setPits(np);
    setStores(ns);
    setTurn(next);
    setMsg(next === 0 ? t('awaleP1Turn', 'Joueur 1 — rangée du bas') : t('awaleP2Turn', 'Joueur 2 — rangée du haut'));
  }

  function reset() {
    setPits([...INIT]);
    setStores([0, 0]);
    setTurn(0);
    setDone(false);
    setMsg(t('awaleP1Turn', 'Joueur 1 — choisissez une case (rangée du bas)'));
  }

  return (
    <div className="awale-game">
      <div className="awale-scoreline">
        <span className={turn === 1 && !done ? "awale-active" : ""}>
          {t('player', 'Joueur')} 2 &nbsp;<strong>{stores[1]}</strong>
        </span>
        <span className="awale-msg">{msg}</span>
        <span className={turn === 0 && !done ? "awale-active" : ""}>
          <strong>{stores[0]}</strong>&nbsp; {t('player', 'Joueur')} 1
        </span>
      </div>

      <div className="awale-board">
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
        ? <div className="awale-restart"><button className="primary" onClick={reset}>{t('newGame', 'Nouvelle partie')}</button></div>
        : <p className="awale-hint">{t('awaleHint', '2 joueurs en local · J1 = bas · J2 = haut')}</p>
      }
    </div>
  );
}

// ─── Game Modal (tabbed) ──────────────────────────────────────────────────────

function GameModal({ game, onClose, isFav, onToggleFav }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("apercu");
  if (!game) return null;
  const TABS = [
    { id: "apercu",    label: t('overview', 'Aperçu') },
    { id: "regles",    label: t('rules', 'Règles') },
    { id: "histoire",  label: t('history', 'Histoire') },
    { id: "mecanique", label: t('mechanics', 'Mécanique') },
    ...(game.playable ? [{ id: "jouer", label: t('play', 'Jouer ▶') }] : []),
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">DLP.Game.{String(game.id).padStart(3, "0")}</p>
            <h2>{game.name}</h2>
            <p className="modal-aliases">{game.aliases?.length ? game.aliases.join(" · ") : t('noAlias', 'Aucun alias connu')}</p>
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
              <h3>{t('description', 'Description')}</h3>
              <p>{game.description}</p>
              <div className="quick-facts">
                {[[t('country', 'Pays'), game.country], [t('period', 'Période'), game.period], [t('players', 'Joueurs'), game.players], [t('duration', 'Durée'), game.duration], [t('age', 'Âge'), game.age], [t('year', 'Année'), game.year], [t('author', 'Auteur'), game.author]].map(([k, v]) => v && (
                  <div className="quick-fact" key={k}><span>{k}</span><strong>{v}</strong></div>
                ))}
              </div>
            </div>
          )}
          {tab === "regles" && (
            <div className="tab-content">
              <h3>{t('howToPlay', 'Comment jouer')}</h3>
              <p>{game.rules}</p>
              <TutorialPrototype steps={game.tutorialSteps || []} />
            </div>
          )}
          {tab === "histoire" && (
            <div className="tab-content">
              <h3>{t('heritageTitle', 'Héritage culturel et historique')}</h3>
              <p>{game.history}</p>
              {game.references?.length > 0 && (
                <>
                  <h3>{t('references', 'Références')}</h3>
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
              <h3>{t('mechanicalSummary', 'Résumé mécanique')}</h3>
              <p>{game.ludemeSummary}</p>
              <h3>{t('ludemesTitle', 'Ludemes (mécaniques)')}</h3>
              <div className="tag-row large">{(game.ludemes || []).map(l => <span key={l}>{l}</span>)}</div>
              <h3>{t('categories', 'Catégories')}</h3>
              <div className="tag-row large">{(game.categories || []).map(c => <span key={c}>{c}</span>)}</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── World Map ────────────────────────────────────────────────────────────────
function WorldMap({ games, onOpen, selectedRegion, onFilterRegion }) {
  const regions = [
    { name: "Africa", label: "Afrique", path: "M 390 280 C 370 200, 480 200, 480 280 C 510 380, 390 420, 390 280 Z", color: "#8c5a32" },
    { name: "America", label: "Amérique", path: "M 180 120 C 130 110, 310 110, 300 240 C 290 320, 150 280, 180 120 Z", color: "#4c3f77" },
    { name: "Europe", label: "Europe", path: "M 400 110 C 390 80, 510 80, 500 150 C 490 200, 390 180, 400 110 Z", color: "#2d5d4f" },
    { name: "Asia", label: "Asie", path: "M 510 100 C 500 40, 750 40, 780 170 C 800 280, 500 300, 510 100 Z", color: "#1e4d79" }
  ];

  // Helper pour associer n'importe quelle variante de nom de région (FR/EN)
  const getRegionKey = (regionName) => {
    if (!regionName) return "Europe";
    const r = regionName.toLowerCase();
    if (r.includes("afri")) return "Africa";
    if (r.includes("americ") || r.includes("amér")) return "America";
    if (r.includes("eur")) return "Europe";
    if (r.includes("as") || r.includes("orie")) return "Asia";
    return "Europe";
  };

  const regionCoords = {
    Africa: { cx: 430, cy: 310 },
    America: { cx: 230, cy: 230 },
    Europe: { cx: 445, cy: 140 },
    Asia: { cx: 640, cy: 200 }
  };

  return (
    <div className="map-container" style={{ position: "relative", background: "#0b253a", borderRadius: "12px", padding: "20px" }}>
      <svg viewBox="0 0 900 500" style={{ width: "100%", height: "auto" }}>
        {/* Formes des continents */}
        {regions.map((reg) => {
          const isSelected = selectedRegion === reg.name;
          return (
            <g 
              key={reg.name} 
              onClick={() => onFilterRegion && onFilterRegion(reg.name)}
              style={{ cursor: "pointer", transition: "all 0.3s ease" }}
            >
              <path
                d={reg.path}
                fill={reg.color}
                opacity={selectedRegion && !isSelected ? 0.25 : 0.85}
                stroke={isSelected ? "#ffffff" : "none"}
                strokeWidth={isSelected ? 3 : 0}
              />
              <text
                x={reg.name === "Africa" ? 430 : reg.name === "America" ? 230 : reg.name === "Europe" ? 445 : 640}
                y={reg.name === "Africa" ? 310 : reg.name === "America" ? 230 : reg.name === "Europe" ? 140 : 200}
                fill="#ffffff"
                fontWeight="bold"
                fontSize="16"
                textAnchor="middle"
                style={{ pointerEvents: "none" }}
              >
                {reg.name}
              </text>
            </g>
          );
        })}

        {/* Points des jeux calculés dynamiquement sans chevauchement */}
        {regions.map((reg) => {
          const regionGames = games.filter(g => getRegionKey(g.region) === reg.name);
          const base = regionCoords[reg.name];
          const count = regionGames.length;

          return regionGames.map((game, idx) => {
            const angle = (idx * (360 / Math.max(count, 1))) * (Math.PI / 180);
            const radius = count > 6 ? 42 : 30;
            const cx = base.cx + radius * Math.cos(angle);
            const cy = base.cy + radius * Math.sin(angle);

            return (
              <circle
                key={game.id || `${reg.name}-${idx}`}
                cx={cx}
                cy={cy}
                r={6}
                fill="#ffffff"
                stroke="#0b253a"
                strokeWidth={2}
                style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(game);
                }}
              >
                <title>{game.name}</title>
              </circle>
            );
          });
        })}
      </svg>
      <div style={{ textAlign: "center", color: "#8a99a8", marginTop: "10px", fontSize: "14px" }}>
        {selectedRegion ? `Filtré sur : ${selectedRegion} (cliquez à nouveau pour réinitialiser)` : "Cliquez sur un continent pour filtrer · Cliquez sur un point blanc pour voir le jeu"}
      </div>
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

function ComparePage({ games, onOpen }) {
  const { t } = useTranslation();
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const gA = games.find(g => String(g.id) === idA);
  const gB = games.find(g => String(g.id) === idB);
  const sharedLudemes = gA && gB ? (gA.ludemes || []).filter(l => (gB.ludemes || []).includes(l)) : [];

  const COMPARE_FIELDS = [
    { label: t('region', 'Région'), key: "region" },
    { label: t('country', 'Pays'), key: "country" },
    { label: t('period', 'Époque'), key: "period" },
    { label: t('type', 'Type'), key: "type" },
    { label: t('difficulty', 'Difficulté'), key: "difficulty" },
    { label: t('players', 'Joueurs'), key: "players" },
    { label: t('duration', 'Durée'), key: "duration" },
    { label: t('age', 'Âge'), key: "age" },
    { label: t('year', 'Année'), key: "year" },
    { label: t('playable', 'Playable'), fn: g => g.playable ? t('yes', 'Oui') : t('no', 'Non') },
    { label: t('reconstructionStatus', 'Reconstruction'), key: "reconstructionStatus" },
  ];

  return (
    <section>
      <div className="section-title"><h2>{t('compareTitle', 'Comparer deux jeux')}</h2><span>{t('comparativeAnalysis', 'Analyse comparative')}</span></div>
      <div className="compare-pickers">
        <select value={idA} onChange={e => setIdA(e.target.value)}>
          <option value="">{t('chooseGameA', 'Choisir le jeu A')}</option>
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="compare-vs">VS</div>
        <select value={idB} onChange={e => setIdB(e.target.value)}>
          <option value="">{t('chooseGameB', 'Choisir le jeu B')}</option>
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
              <strong>{t('commonLudemes', 'Ludemes communs')} ({sharedLudemes.length})</strong>
              <div className="tag-row">{sharedLudemes.map(l => <span key={l} className="shared-tag">{l}</span>)}</div>
            </div>
          )}
        </>
      )}

      {(!gA || !gB) && (
        <div className="compare-placeholder">
          <p>{t('comparePlaceholder', 'Sélectionnez deux jeux ci-dessus pour voir une comparaison détaillée.')}</p>
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
    qs.push({ q: `De quelle région provient "${g.name}" ?`, correct: g.region, opts: shuffle([g.region, ...wR]) });

    const wP = shuffle(periods.filter(p => p !== g.period)).slice(0, 3);
    qs.push({ q: `À quelle époque remonte "${g.name}" ?`, correct: g.period, opts: shuffle([g.period, ...wP]) });

    const wT = shuffle(types.filter(t => t !== g.type)).slice(0, 3);
    qs.push({ q: `Quel est le type de jeu de "${g.name}" ?`, correct: g.type, opts: shuffle([g.type, ...wT]) });

    const wD = shuffle(difficulties.filter(d => d !== g.difficulty)).slice(0, 3);
    qs.push({ q: `Quel niveau est recommandé pour "${g.name}" ?`, correct: g.difficulty, opts: shuffle([g.difficulty, ...wD]) });
  });

  return shuffle(qs);
}

function QuizPage({ user, games, leaderboard, onScoreSubmit }) {
  const { t } = useTranslation();
  const TOTAL = 10;
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [phase, setPhase] = useState("start");

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
      onScoreSubmit(score, TOTAL);
      return;
    }
    setIdx(i => i + 1); setSelected(null); setAnswered(false);
  }

  if (phase === "start") return (
    <section>
      <div className="section-title"><h2>{t('quiz', 'Quiz')}</h2><span>{t('testKnowledge', 'Testez vos connaissances')}</span></div>
      <div className="quiz-layout">
        <div className="quiz-start-card">
          <h3>Quiz — {t('traditionalGames', 'Jeux Traditionnels')}</h3>
          <p>{TOTAL} {t('quizSub', 'questions sur les origines, périodes, types et niveaux des jeux du catalogue.')}</p>
          <button className="primary" onClick={startQuiz}>{t('start', 'Commencer')}</button>
        </div>
        <div className="quiz-leaderboard-card">
          <h3>{t('leaderboard', 'Classement')}</h3>
          {leaderboard.length === 0
            ? <p className="muted">{t('noScores', 'Aucun score. Soyez le premier !')}</p>
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
    const msg = pct >= 80 ? t('quizExc', 'Excellent ! Vous êtes un expert !') : pct >= 60 ? t('quizGood', 'Bien joué !') : t('quizMore', 'Continuez à explorer le catalogue !');
    return (
      <section>
        <div className="quiz-result-screen">
          <h2>{t('quizFinished', 'Quiz terminé !')}</h2>
          <div className="quiz-score-circle">{score}<span>/{TOTAL}</span></div>
          <p>{msg}</p>
          <div className="row-actions" style={{ justifyContent: "center" }}>
            <button className="secondary" onClick={() => setPhase("start")}>{t('viewLeaderboard', 'Voir classement')}</button>
            <button className="primary" onClick={startQuiz}>{t('playAgain', 'Rejouer')}</button>
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
          <div className="quiz-footer">
            <button className="primary" onClick={next}>{idx + 1 === TOTAL ? t('seeResults', 'Voir le résultat') : t('nextQuestion', 'Question suivante')}</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Main App Shell ──────────────────────────────────────────────────────────
// ─── Main App Shell ──────────────────────────────────────────────────────────
// ─── Main App Shell ──────────────────────────────────────────────────────────

const RENDER_BACKEND_URL = "https://ludoheritage.onrender.com";

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(readStoredUser);
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [onboardingAnswers, setOnboardingAnswers] = useState({});
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  const [tab, setTab] = useState("Catalogue");
  const [games, setGames] = useState(FALLBACK_GAMES);
  const [selectedGame, setSelectedGame] = useState(null);
  const [favs, setFavs] = useState(readFavs);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Base API URL depuis Vercel ou fallback Render direct
  const apiBaseUrl = import.meta.env.VITE_API_URL || RENDER_BACKEND_URL;

  // Changer la langue
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    // Appel sur la route exacte du contrôleur Spring Boot (/api/jeux)
    getJson(`${apiBaseUrl}/api/jeux`, FALLBACK_GAMES).then(fetchedGames => {
      if (Array.isArray(fetchedGames) && fetchedGames.length > 0) {
        setGames(fetchedGames);
      }
    });
  }, [apiBaseUrl]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    if (mode === "register" && authForm.password !== authForm.confirm) {
      setAuthError(t('passwordsDontMatch', 'Les mots de passe ne correspondent pas'));
      setAuthLoading(false);
      return;
    }

    const endpoint = mode === "login" ? `${apiBaseUrl}/api/auth/login` : `${apiBaseUrl}/api/auth/register`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || t('authFailed', 'Échec de l\'authentification'));
      }
      const data = await res.json();
      setUser(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboardingSubmit = async () => {
    setOnboardingError("");
    setOnboardingLoading(true);
    try {
      const updatedUser = { ...user, onboardingCompleted: true, preferences: onboardingAnswers };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (err) {
      setOnboardingError(err.message);
    } finally {
      setOnboardingLoading(false);
    }
  };

  const toggleFav = (id) => {
    const next = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
    setFavs(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!user) {
    return <AuthGate mode={mode} setMode={setMode} form={authForm} setForm={setAuthForm} submit={handleAuthSubmit} loading={authLoading} error={authError} />;
  }

  if (!user.onboardingCompleted) {
    return <OnboardingFlow user={user} answers={onboardingAnswers} setAnswers={setOnboardingAnswers} submit={handleOnboardingSubmit} loading={onboardingLoading} error={onboardingError} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">LH</span>
          <div>
            <strong>LudoHeritage</strong>
            <small>Digital Ludeme Project</small>
          </div>
        </div>
        <nav className="topbar-nav">
          {["Catalogue", "Carte", "Chronologie", "Ludemes", "Comparer", "Quiz", "Communaute", "Profil"].map(n => (
            <button key={n} className={tab === n ? "active" : ""} onClick={() => setTab(n)}>
              {t(n.toLowerCase(), n)}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Sélecteur de langue */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="secondary compact" style={{ fontWeight: i18n.language === 'en' ? '800' : '400' }} onClick={() => changeLanguage('en')}>EN</button>
            <button className="secondary compact" style={{ fontWeight: i18n.language === 'fr' ? '800' : '400' }} onClick={() => changeLanguage('fr')}>FR</button>
          </div>
          <button className="secondary compact" onClick={logout}>{t('logout', 'Déconnexion')}</button>
        </div>
      </header>

      <main className="workspace">
        {tab === "Catalogue" && (
          <section>
            <div className="hero-band">
              <div>
                <p className="eyebrow">{t('gameOfDay', 'JEU DU JOUR')}</p>
                <h1>Fanorona</h1>
                <p>{t('fanoronaDesc', 'Jeu national de Madagascar avec un système de capture unique : par approche ou par retrait.')}</p>
                <br />
                <button className="primary" onClick={() => setSelectedGame(games.find(g => g.name === "Fanorona") || games[0])}>{t('discover', 'Découvrir ce jeu')}</button>
              </div>
              <div className="hero-stats">
                <span><strong>{games.length}</strong><small>{t('games', 'jeux')}</small></span>
                <span><strong>4</strong><small>{t('regions', 'régions')}</small></span>
                <span><strong>20</strong><small>{t('categories', 'catégories')}</small></span>
                <span><strong>{favs.length}</strong><small>{t('favorites', 'favoris')}</small></span>
              </div>
            </div>

            <div className="game-grid">
              {games.map(g => (
                <GameCard key={g.id || g.name} game={g} onOpen={setSelectedGame} isFav={favs.includes(g.id)} onToggleFav={toggleFav} />
              ))}
            </div>
          </section>
        )}
        {tab === "Carte" && (
  <WorldMap 
    games={selectedRegion ? games.filter(g => {
      const r = (g.region || "").toLowerCase();
      if (selectedRegion === "Africa") return r.includes("afri");
      if (selectedRegion === "America") return r.includes("americ") || r.includes("amér");
      if (selectedRegion === "Europe") return r.includes("eur");
      if (selectedRegion === "Asia") return r.includes("as") || r.includes("orie");
      return true;
    }) : games} 
    onOpen={setSelectedGame} 
    selectedRegion={selectedRegion}
    onFilterRegion={(region) => setSelectedRegion(selectedRegion === region ? null : region)} 
  />
)}
        
        {tab === "Chronologie" && <Timeline games={games} onOpen={setSelectedGame} />}
        {tab === "Comparer" && <ComparePage games={games} onOpen={setSelectedGame} />}
        {tab === "Quiz" && <QuizPage user={user} games={games} leaderboard={leaderboard} onScoreSubmit={(sc, tot) => setLeaderboard([...leaderboard, { id: Date.now(), displayName: user.displayName, score: sc, total: tot }])} />}
      </main>

      <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} isFav={selectedGame && favs.includes(selectedGame.id)} onToggleFav={toggleFav} />
    </div>
  );
}
