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

function WorldMap({ games = [], onSelectGame, onOpen }) {
  const { t } = useTranslation();
  const [hoveredGame, setHoveredGame] = useState(null);

  const handleGameClick = (game) => {
    if (onSelectGame) onSelectGame(game);
    else if (onOpen) onOpen(game);
  };

  // Fonction pour supprimer les accents et mettre en minuscules
  const normalizeStr = (str = "") =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Coordonnées ajustées spécifiquement à la projection du SVG Wikimedia
  const getBaseCoordinates = (game) => {
    const region = normalizeStr(game.region);
    const country = normalizeStr(game.country);
    const text = `${region} ${country}`;

    // 1. Pays & Lieux très spécifiques
    if (text.includes("japan") || text.includes("japon")) return { x: 87, y: 35 };
    if (text.includes("korea") || text.includes("coree")) return { x: 82, y: 36 };
    if (text.includes("china") || text.includes("chine")) return { x: 78, y: 38 };
    if (text.includes("nepal")) return { x: 68, y: 38 }; // Bagh Chal
    if (text.includes("india") || text.includes("inde") || text.includes("sri lanka")) return { x: 70, y: 46 }; // Carrom / Échecs (Décalé vers la droite, sur le continent indien)
    if (text.includes("madagascar")) return { x: 62, y: 65 }; // Fanorona
    if (text.includes("scandinavie") || text.includes("viking") || text.includes("scandinavia")) return { x: 50, y: 19 }; // Hnefatafl
    if (text.includes("france")) return { x: 48, y: 26 }; // Dames
    if (text.includes("al-andalus") || text.includes("espagne") || text.includes("spain")) return { x: 45, y: 31 }; // Alquerque
    // Ajustements Proche-Orient / Mésopotamie
    if (text.includes("mesopotamie") || text.includes("irak") || text.includes("iraq")) return { x: 59, y: 39 }; // Jeu Royal d'Ur (remonté un peu plus bas, au sud de la Mer Noire)
    if (text.includes("egypt") || text.includes("egypte")) return { x: 55, y: 40 }; // Égypte (descendu sur les terres égyptiennes)
    if (text.includes("iran") || text.includes("perse")) return { x: 61, y: 35 }; // Backgammon
    if (text.includes("greece") || text.includes("grece") || text.includes("italy") || text.includes("italie")) return { x: 51, y: 28 };

    // 2. Régions Afrique
    if (text.includes("ouest") && text.includes("afriq")) return { x: 47, y: 44 }; // Awalé (Décalé un peu vers l'est pour rentrer dans le continent)
    if (text.includes("est") && text.includes("afriq")) return { x: 58, y: 50 }; // Mancala
    if (text.includes("nord") && text.includes("afriq")) return { x: 48, y: 34 };
    if (text.includes("sud") && text.includes("afriq")) return { x: 53, y: 68 };
    if (text.includes("sub-saharan") || text.includes("subsaharienne")) return { x: 52, y: 52 };
    if (text.includes("afrique") || text.includes("africa")) return { x: 52, y: 50 };

    // 3. Autres Régions du monde
    if (text.includes("moyen-orient") || text.includes("middle east") || text.includes("arab")) return { x: 57, y: 36 };
    if (text.includes("asie de l'est") || text.includes("east asia")) return { x: 79, y: 38 };
    if (text.includes("asie du sud") || text.includes("south asia")) return { x: 70, y: 44 };
    if (text.includes("sud-est") || text.includes("southeast")) return { x: 75, y: 48 };
    if (text.includes("asie") || text.includes("asia")) return { x: 72, y: 35 };

    if (text.includes("europe")) return { x: 49, y: 22 };
    if (text.includes("amerique du nord") || text.includes("north america")) return { x: 22, y: 32 };
    if (text.includes("amerique du sud") || text.includes("south america")) return { x: 30, y: 65 };
    if (text.includes("oceanie") || text.includes("oceania")) return { x: 86, y: 72 };

    return { x: 50, y: 42 };
  };
  // Dispersion resserrée
  const processedGames = useMemo(() => {
    const mapGroups = {};

    games.forEach((game) => {
      const coords = getBaseCoordinates(game);
      const key = `${coords.x}_${coords.y}`;
      if (!mapGroups[key]) mapGroups[key] = [];
      mapGroups[key].push(game);
    });

    const result = [];
    Object.values(mapGroups).forEach((group) => {
      if (group.length === 1) {
        const coords = getBaseCoordinates(group[0]);
        result.push({ ...group[0], mapX: coords.x, mapY: coords.y });
      } else {
        const total = group.length;
        group.forEach((game, index) => {
          const coords = getBaseCoordinates(game);
          const angle = (index / total) * 2 * Math.PI;
          const radius = 1.5; // Rayon réduit à 1.5%
          result.push({
            ...game,
            mapX: coords.x + Math.cos(angle) * radius,
            mapY: coords.y + Math.sin(angle) * radius
          });
        });
      }
    });

    return result;
  }, [games]);

  const getRegionColor = (regionStr = "", countryStr = "") => {
    const text = normalizeStr(regionStr + " " + countryStr);
    if (text.includes("africa") || text.includes("afrique") || text.includes("arab") || text.includes("egypt") || text.includes("madagascar")) return "#e69c55"; // Orange
    if (text.includes("europe") || text.includes("greece") || text.includes("rome") || text.includes("scandinavie")) return "#82b366"; // Vert
    if (text.includes("america") || text.includes("amerique")) return "#9673a6"; // Violet
    if (text.includes("asia") || text.includes("asie") || text.includes("japan") || text.includes("china") || text.includes("india") || text.includes("nepal")) return "#4ba3e3"; // Bleu Asie
    return "#36b3a0"; // Turquoise
  };

  return (
    <section style={{ padding: "10px 0", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "580px",
          backgroundColor: "#071624",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #1a2b3c",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.25,
            filter: "invert(40%) sepia(50%) saturate(1000%) hue-rotate(180deg)",
            pointerEvents: "none"
          }}
        />

        {processedGames.map((game) => {
          const color = getRegionColor(game.region, game.country);
          const isHovered = hoveredGame?.id === game.id || hoveredGame?.name === game.name;

          return (
            <div
              key={game.id || game.name}
              onClick={(e) => {
                e.stopPropagation();
                handleGameClick(game);
              }}
              onMouseEnter={() => setHoveredGame(game)}
              onMouseLeave={() => setHoveredGame(null)}
              style={{
                position: "absolute",
                left: `${game.mapX}%`,
                top: `${game.mapY}%`,
                transform: "translate(-50%, -50%)",
                cursor: "pointer",
                padding: "8px",
                zIndex: isHovered ? 100 : 20
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: `2px solid ${color}`,
                  backgroundColor: "rgba(255, 255, 255, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  transform: isHovered ? "scale(1.4)" : "scale(1)",
                  boxShadow: isHovered ? `0 0 14px ${color}` : "none"
                }}
              >
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ffffff" }} />
              </div>

              {isHovered && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "32px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#ffffff",
                    borderRadius: "6px",
                    padding: "12px 16px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                    width: "220px",
                    pointerEvents: "none",
                    zIndex: 200,
                    textAlign: "left"
                  }}
                >
                  <h4 style={{ margin: "0 0 2px 0", color: "#1a2b3c", fontSize: "15px", fontWeight: "bold" }}>
                    {game.name}
                  </h4>
                  <p style={{ margin: "0 0 8px 0", color: "#7a8a99", fontSize: "11px" }}>
                    {game.country ? `${game.country} (${game.region})` : game.region || "Traditionnel"}
                  </p>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ backgroundColor: "#f0f4f8", color: "#4a5a6a", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                      {game.type || "Stratégie"}
                    </span>
                    <span style={{ backgroundColor: "#e6f2ed", color: "#2e7d5b", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" }}>
                      {game.difficulty || "Facile"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
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
function LudemesPage({ games = [], onSelectGame, onOpen }) {
  const { t } = useTranslation();

  const handleOpenGame = (game) => {
    if (onSelectGame) onSelectGame(game);
    else if (onOpen) onOpen(game);
  };

  // Liste des ludèmes avec mots-clés de recherche associés
  const ludemesList = [
    {
      id: "alignment",
      name: "Alignment",
      desc: "Games based on aligning pieces in a row",
      keywords: ["alignment", "alignement", "row", "line", "morris", "tictactoe", "alquerque"]
    },
    {
      id: "race",
      name: "Race",
      desc: "Games where players race pieces along a track",
      keywords: ["race", "parcheesi", "ludo", "senet", "backgammon", "track", "course"]
    },
    {
      id: "mancala",
      name: "Sowing / Mancala",
      desc: "Games involving counting and distributing seeds",
      keywords: ["mancala", "sowing", "awale", "oware", "seeds", "egrenage", "semence"]
    },
    {
      id: "blocking",
      name: "Blocking",
      desc: "Games focused on trapping or blocking opponent movement",
      keywords: ["blocking", "trap", "block", "trapping", "blocage", "impasses"]
    },
    {
      id: "territory",
      name: "Territory",
      desc: "Games about occupying and controlling space",
      keywords: ["territory", "go", "reversi", "othello", "occupy", "territoire", "domination"]
    }
  ];

  // Filtre les jeux correspondant à un ludème spécifique
  const getMatchingGames = (ludeme) => {
    return games.filter((game) => {
      const textToSearch = [
        game.category,
        game.family,
        game.ludeme,
        game.type,
        game.description,
        game.name
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return ludeme.keywords.some((keyword) => textToSearch.includes(keyword.toLowerCase()));
    });
  };

  return (
    <section style={{ padding: "20px 0", maxWidth: "1100px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "26px", color: "#1a2b3c", marginBottom: "6px" }}>Ludemes</h2>
      <p style={{ color: "#7a8a99", marginBottom: "28px", fontSize: "14px" }}>
        Explore games grouped by their core conceptual building blocks (ludemes).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {ludemesList.map((ludeme) => {
          const matchingGames = getMatchingGames(ludeme);

          return (
            <div
              key={ludeme.id}
              style={{
                background: "#ffffff",
                borderRadius: "10px",
                padding: "22px",
                border: "1px solid #eef2f5",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "19px", color: "#1a2b3c", fontWeight: "bold" }}>{ludeme.name}</h3>
                  <span
                    style={{
                      background: "#f0f4f8",
                      color: "#2c4d6f",
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "4px 10px",
                      borderRadius: "12px"
                    }}
                  >
                    {matchingGames.length} jeux
                  </span>
                </div>
                <p style={{ color: "#6a7a89", fontSize: "13px", lineHeight: "1.5", marginBottom: "18px" }}>
                  {ludeme.desc}
                </p>
              </div>

              <div style={{ borderTop: "1px solid #f0f4f8", paddingTop: "14px", marginTop: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#8a9aA9", marginBottom: "10px", letterSpacing: "0.5px" }}>
                  EXEMPLES :
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {matchingGames.length > 0 ? (
                    matchingGames.map((game) => (
                      <button
                        key={game.id || game.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGame(game);
                        }}
                        style={{
                          background: "#f5f0e6",
                          border: "1px solid #dfd5c3",
                          color: "#1a2b3c",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#eadaa8";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f5f0e6";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {game.name}
                      </button>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#a0acb8", fontStyle: "italic" }}>
                      Aucun jeu trouvé pour ce ludème
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}



function CommunityPage({ user, games }) {
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState("");
  const [postText, setPostText] = useState("");
  const [commentInputs, setCommentInputs] = useState({});

  const [posts, setPosts] = useState([
    {
      id: 1,
      author: "Mehdi Lahlou",
      avatar: "ML",
      timeAgo: "409d",
      linkedGame: "Jeu Royal d'Ur",
      content: "Irving Finkel du British Museum a joué au Jeu Royal d'Ur EN DIRECT sur YouTube contre un gamer moderne, avec un plateau vieux de 4000 ans — et il a GAGNÉ. Une vidéo incontournable.",
      likes: 7,
      comments: [
        { author: "Youssef Idrissi", text: "He translated the rules from a 177 BC clay tablet and then beat a modern gamer. Absolutely incredible." },
        { author: "Omar Chakroun", text: "Sans ce scribe babylonien qui a eu l'idée d'écrire les règles, ce jeu serait perdu à jamais." },
        { author: "Amina Benali", text: "LudoHeritage existe justement pour qu'aucun jeu ne disparaisse. Belle mission !" }
      ]
    },
    {
      id: 2,
      author: "Fatima Zahra Alaoui",
      avatar: "FZ",
      timeAgo: "410d",
      linkedGame: "Bagh Chal",
      content: "Quelqu'un a déjà tenté une variante de Bagh Chal à 5 tigres au lieu de 4 ? Est-ce que cela rééquilibre le jeu pour les chèvres ?",
      likes: 3,
      comments: []
    }
  ]);

  const handlePublish = () => {
    if (!postText.trim()) return;
    const newEntry = {
      id: Date.now(),
      author: user?.displayName || "Utilisateur",
      avatar: (user?.displayName || "U").slice(0, 2).toUpperCase(),
      timeAgo: "À l'instant",
      linkedGame: selectedGame,
      content: postText,
      likes: 0,
      comments: []
    };
    setPosts([newEntry, ...posts]);
    setPostText("");
    setSelectedGame("");
  };

  const handleAddComment = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, { author: user?.displayName || "Utilisateur", text }]
        };
      }
      return p;
    }));

    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  return (
    <section style={{ maxWidth: "800px", margin: "0 auto", padding: "20px 0" }}>
      {/* En-tête Forum */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>
          {t("communityForum", "Community forum")}
        </h1>
        <span style={{ color: "#8a99a8", fontSize: "14px" }}>
          {t("communitySubtitle", "Contributions, questions and variants")}
        </span>
      </div>

      {/* Bloc de publication */}
      <div className="card" style={{ background: "#ffffff", borderRadius: "8px", padding: "16px", marginBottom: "24px", border: "1px solid #eef2f5" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", background: "#0e6b85", color: "#fff", fontWeight: "bold", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", shrink: 0 }}>
            {(user?.displayName || "C").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
            <select 
              value={selectedGame} 
              onChange={(e) => setSelectedGame(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", color: "#4b5563", background: "#fff" }}
            >
              <option value="">{t("linkGameOptional", "Link a game (optional)")}</option>
              {(games || []).map(g => (
                <option key={g.id || g.name} value={g.name}>{g.name}</option>
              ))}
            </select>

            <textarea 
              rows={3}
              placeholder={t("sharePlaceholder", "Share a source, variant or question...")}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", resize: "vertical", fontFamily: "inherit" }}
            />

            <button 
              className="primary"
              onClick={handlePublish}
              style={{ background: "#1b2a38", color: "#fff", padding: "10px 0", borderRadius: "4px", border: "none", fontWeight: "bold", cursor: "pointer" }}
            >
              {t("publish", "Publish")}
            </button>
          </div>
        </div>
      </div>

      {/* Fil des publications */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {posts.map((post) => (
          <div key={post.id} className="card" style={{ background: "#ffffff", borderRadius: "8px", padding: "20px", border: "1px solid #eef2f5" }}>
            {/* Header du post */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: "#0e6b85", color: "#fff", fontWeight: "bold", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {post.avatar}
              </div>
              <div>
                <div style={{ fontWeight: "bold", color: "#1a2b3c" }}>{post.author}</div>
                <div style={{ fontSize: "12px", color: "#8a99a8" }}>
                  {post.timeAgo} {post.linkedGame && `· ${post.linkedGame}`}
                </div>
              </div>
            </div>

            {/* Contenu */}
            <p style={{ color: "#334155", lineHeight: "1.5", marginBottom: "16px" }}>
              {post.content}
            </p>

            {/* Infoline (Likes et Nb commentaires) */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "12px" }}>
              <span>Like ({post.likes})</span>
              <span>{post.comments.length} comments</span>
            </div>

            {/* Liste des commentaires */}
            {post.comments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {post.comments.map((c, i) => (
                  <div key={i} style={{ fontSize: "13px", color: "#334155", lineHeight: "1.4" }}>
                    <strong>{c.author}</strong> {c.text}
                  </div>
                ))}
              </div>
            )}

            {/* Champ pour commenter */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input 
                type="text" 
                placeholder={t("addComment", "Add a comment")}
                value={commentInputs[post.id] || ""}
                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "13px" }}
              />
              <button 
                onClick={() => handleAddComment(post.id)}
                style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "0 16px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
              >
                {t("send", "Send")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePage({ user, games, favs, onOpen }) {
  const { t, i18n } = useTranslation();
  const favGames = games.filter((g) => favs.includes(g.id));

  // Données fictives/dynamiques pour correspondre à l'interface originale
  const achievements = [
    { title: "First step", desc: "Open your first game", icon: "◆", unlocked: true },
    { title: "Explorer", desc: "View 5 games", icon: "◎", unlocked: true },
    { title: "Scholar", desc: "View 10 games", icon: "◈", unlocked: false },
    { title: "First favorite", desc: "Add 1 game to favorites", icon: "♥", unlocked: false },
    { title: "Collector", desc: "5 games in favorites", icon: "★", unlocked: false },
    { title: "Globetrotter", desc: "Explore 3 regions", icon: "●", unlocked: true }
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 0" }}>
      {/* 1. Bandeau supérieur : Game of the Day + Stats */}
      <div
        className="card"
        style={{
          background: "#f7f5f0",
          borderRadius: "8px",
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid #eae6df"
        }}
      >
        <div style={{ maxWidth: "60%" }}>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#7a8a99", letterSpacing: "1px" }}>
            {t("gameOfDay", "GAME OF THE DAY")}
          </span>
          <h2 style={{ margin: "8px 0", fontSize: "32px", color: "#1a2b3c" }}>Mu Torere</h2>
          <p style={{ color: "#5a6a79", fontSize: "14px", lineHeight: "1.4", marginBottom: "16px" }}>
            The only traditional board game of the Māori people — played on an eight-pointed star with a central hub.
          </p>
          <button
            onClick={() => onOpen && onOpen(games.find((g) => g.name === "Mu Torere") || games[0])}
            style={{
              background: "#1b2a38",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            {t("discover", "Discover this game")}
          </button>
        </div>

        {/* Blocs de statistiques à droite */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "180px" }}>
          {[
            { count: games.length || 42, label: t("games", "games") },
            { count: 4, label: t("regions", "regions") },
            { count: 30, label: t("categories", "categories") },
            { count: favs.length, label: t("favorites", "favorites") }
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: "#ffffff",
                padding: "8px 16px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <strong style={{ fontSize: "18px", color: "#1a2b3c" }}>{stat.count}</strong>
              <small style={{ color: "#7a8a99", fontSize: "12px" }}>{stat.label}</small>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Carte d'identité Profil */}
      <div
        className="card"
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          padding: "24px",
          marginBottom: "28px",
          border: "1px solid #eef2f5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}
      >
        <div style={{ display: "flex", gap: "20px" }}>
          {/* Avatar carré bleu/vert */}
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "#0e6b85",
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: "bold",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {(user?.displayName || "C").slice(0, 1).toUpperCase()}
          </div>

          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#1a2b3c" }}>
              {user?.displayName || "ClientName"}
            </h2>
            <p style={{ margin: "0 0 16px 0", color: "#7a8a99", fontSize: "14px" }}>
              {user?.email || "clientname@gmail.com"}
            </p>

            {/* Grille de métriques personnelles */}
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { label: "FAVORITES", value: favs.length },
                { label: "VIEWED", value: 7 },
                { label: "POSTS", value: 0 },
                { label: "ACHIEVEMENTS", value: unlockedCount }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#f4f0e8",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    textAlign: "center",
                    minWidth: "75px"
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a2b3c" }}>{item.value}</div>
                  <div style={{ fontSize: "9px", color: "#7a8a99", fontWeight: "bold", marginTop: "2px" }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          style={{
            background: "#ffffff",
            border: "1px solid #1a2b3c",
            color: "#1a2b3c",
            padding: "8px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "13px",
            cursor: "pointer"
          }}
        >
          {t("editPreferences", "Edit preferences")}
        </button>
      </div>

      {/* 3. Section Preferences */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "16px", color: "#1a2b3c" }}>Preferences</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { tag: "LEVEL", val: "Amateur" },
            { tag: "PREFERRED TYPE", val: "Strategy" },
            { tag: "REGION", val: "Europe" },
            { tag: "LANGUAGE", val: i18n.language === "fr" ? "French" : "English" }
          ].map((pref, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                background: "#ffffff",
                padding: "16px",
                borderRadius: "6px",
                border: "1px solid #eef2f5"
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: "bold", color: "#7a8a99", marginBottom: "6px" }}>
                {pref.tag}
              </div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a2b3c" }}>{pref.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Section Achievements */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "22px", margin: 0, color: "#1a2b3c" }}>Achievements</h2>
          <span style={{ fontSize: "13px", color: "#7a8a99" }}>
            {unlockedCount} / {achievements.length} unlocked
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
          {achievements.map((ach, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                background: ach.unlocked ? "#e6f0f2" : "#ffffff",
                padding: "16px 12px",
                borderRadius: "6px",
                border: ach.unlocked ? "1px solid #b3d4dc" : "1px solid #eef2f5",
                textAlign: "center",
                opacity: ach.unlocked ? 1 : 0.6
              }}
            >
              <div style={{ fontSize: "20px", marginBottom: "8px", color: "#0e6b85" }}>{ach.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1a2b3c", marginBottom: "4px" }}>
                {ach.title}
              </div>
              <div style={{ fontSize: "11px", color: "#7a8a99", lineHeight: "1.2" }}>{ach.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
        {tab === "Ludemes" && <LudemesPage games={games} onOpen={setSelectedGame} onSelectGame={setSelectedGame}/>}
        {tab === "Communaute" && <CommunityPage user={user} />}
        {tab === "Profil" && <ProfilePage user={user} games={games} favs={favs} onOpen={setSelectedGame} />}
        
     </main>

      <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} isFav={selectedGame && favs.includes(selectedGame.id)} onToggleFav={toggleFav} />
    </div>
  );
}
