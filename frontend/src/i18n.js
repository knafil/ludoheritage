import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      catalogue: "Catalog",
      carte: "Map",
      chronologie: "Timeline",
      ludemes: "Ludemes",
      comparer: "Compare",
      quiz: "Quiz",
      communaute: "Community",
      profil: "Profile",
      logout: "Logout",
      login: "Login",
      register: "Create Account",

      // Auth
      authIntroTitle: "A living library of traditional games.",
      authIntroSubtitle: "Explore 20 games from around the world, their origins, mechanics, and cultural heritage.",
      fullName: "Full Name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      pleaseWait: "Please wait...",
      continue: "Continue",
      passwordsDontMatch: "Passwords do not match",
      authFailed: "Authentication failed",

      // Onboarding
      playerProfile: "Player Profile",
      welcome: "Welcome",
      previous: "Previous",
      next: "Next",
      finish: "Finish",
      onboarding: {
        levelTitle: "What is your experience level?",
        typeTitle: "What is your preferred game type?",
        regionTitle: "Which region are you interested in?",
        langTitle: "Preferred language"
      },

      // Hero / Game of the day
      gameOfDay: "GAME OF THE DAY",
      discover: "Discover this game",
      fanoronaDesc: "National game of Madagascar featuring a unique capture mechanic: by approach or by withdrawal.",
      games: "games",
      regions: "regions",
      categories: "categories",
      favorites: "favorites",

      // Catalog / Modals
      searchPlaceholder: "Name / Alias / Ludeme / Country...",
      all: "All",
      gameLibrary: "Game Library",
      results: "results",
      overview: "Overview",
      rules: "Rules",
      history: "History",
      mechanics: "Mechanics",
      play: "Play ▶",
      noAlias: "No known aliases",
      description: "Description",
      country: "Country",
      period: "Period",
      players: "Players",
      duration: "Duration",
      age: "Age",
      year: "Year",
      author: "Author",
      howToPlay: "How to Play",
      heritageTitle: "Cultural and Historical Heritage",
      references: "References",
      mechanicalSummary: "Mechanical Summary",
      ludemesTitle: "Ludemes (Mechanics)",
      reconstructed: "Reconstructed",
      inProgress: "In progress",
      unknown: "Unknown",
      noTutorial: "No prototype tutorial available.",
      before: "Before",
      after: "After",
      restart: "Restart",

      // Map / Timeline / Compare
      america: "America",
      africa: "Africa",
      asia: "Asia",
      mapHint: "Click on a continent to filter · Click on a white dot to view game",
      compareTitle: "Compare Two Games",
      comparativeAnalysis: "Comparative Analysis",
      chooseGameA: "Choose Game A",
      chooseGameB: "Choose Game B",
      region: "Region",
      type: "Type",
      difficulty: "Difficulty",
      playable: "Playable",
      reconstructionStatus: "Reconstruction",
      yes: "Yes",
      no: "No",
      commonLudemes: "Common Ludemes",
      comparePlaceholder: "Select two games above to see a detailed comparison.",

      // Quiz
      testKnowledge: "Test your knowledge",
      traditionalGames: "Traditional Games",
      quizSub: "questions on origins, periods, types, and difficulty levels.",
      start: "Start",
      leaderboard: "Leaderboard",
      noScores: "No scores yet. Be the first!",
      quizFinished: "Quiz Finished!",
      quizExc: "Excellent! You are an expert!",
      quizGood: "Well done!",
      quizMore: "Keep exploring the catalog!",
      viewLeaderboard: "View Leaderboard",
      playAgain: "Play Again",
      seeResults: "See Results",
      nextQuestion: "Next Question",

      // Awale Game
      awaleP1Turn: "Player 1 — choose a pit (bottom row)",
      awaleP2Turn: "Player 2 — choose a pit (top row)",
      p1Wins: "Player 1 wins!",
      p2Wins: "Player 2 wins!",
      draw: "Draw!",
      player: "Player",
      newGame: "New Game",
      awaleHint: "Local 2 Players · P1 = Bottom · P2 = Top",

      // Achievements
      achievements: {
        firstViewLabel: "First Discovery",
        firstViewDesc: "View your first game page",
        explorerLabel: "Explorer",
        explorerDesc: "Explore at least 5 games",
        scholarLabel: "Scholar",
        scholarDesc: "Explore 10 or more games",
        firstFavLabel: "Favorite",
        firstFavDesc: "Add a game to your favorites",
        collectorLabel: "Collector",
        collectorDesc: "Save at least 5 favorite games",
        globetrotterLabel: "Globetrotter",
        globetrotterDesc: "Discover games from 3 different regions",
        worldLabel: "World Citizen",
        worldDesc: "Discover games from all 4 regions",
        historianLabel: "Historian",
        historianDesc: "Explore 3 ancient games",
        contributorLabel: "Contributor",
        contributorDesc: "Post your first community message",
        activeLabel: "Active Voice",
        activeDesc: "Post 3 or more community messages"
      }
    }
  },
  fr: {
    translation: {
      // Navigation
      catalogue: "Catalogue",
      carte: "Carte",
      chronologie: "Chronologie",
      ludemes: "Ludemes",
      comparer: "Comparer",
      quiz: "Quiz",
      communaute: "Communauté",
      profil: "Profil",
      logout: "Déconnexion",
      login: "Connexion",
      register: "Créer un compte",

      // Auth
      authIntroTitle: "Une bibliothèque vivante des jeux traditionnels.",
      authIntroSubtitle: "Explorez 20 jeux du monde entier, leurs origines, leurs mécaniques et leur héritage culturel.",
      fullName: "Nom complet",
      email: "Email",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      pleaseWait: "Veuillez patienter...",
      continue: "Continuer",
      passwordsDontMatch: "Les mots de passe ne correspondent pas",
      authFailed: "Échec de l'authentification",

      // Onboarding
      playerProfile: "Profil joueur",
      welcome: "Bienvenue",
      previous: "Précédent",
      next: "Suivant",
      finish: "Terminer",
      onboarding: {
        levelTitle: "Quel est votre niveau ?",
        typeTitle: "Quel est votre type de jeu préféré ?",
        regionTitle: "Quelle est votre région préférée ?",
        langTitle: "Langue préférée"
      },

      // Hero / Game of the day
      gameOfDay: "JEU DU JOUR",
      discover: "Découvrir ce jeu",
      fanoronaDesc: "Jeu national de Madagascar avec un système de capture unique : par approche ou par retrait.",
      games: "jeux",
      regions: "régions",
      categories: "catégories",
      favorites: "favoris",

      // Catalog / Modals
      searchPlaceholder: "Nom / Alias / Ludeme / Pays...",
      all: "Tous",
      gameLibrary: "Bibliothèque de jeux",
      results: "résultats",
      overview: "Aperçu",
      rules: "Règles",
      history: "Histoire",
      mechanics: "Mécanique",
      play: "Jouer ▶",
      noAlias: "Aucun alias connu",
      description: "Description",
      country: "Pays",
      period: "Période",
      players: "Joueurs",
      duration: "Durée",
      age: "Âge",
      year: "Année",
      author: "Auteur",
      howToPlay: "Comment jouer",
      heritageTitle: "Héritage culturel et historique",
      references: "Références",
      mechanicalSummary: "Résumé mécanique",
      ludemesTitle: "Ludemes (mécaniques)",
      reconstructed: "Reconstruit",
      inProgress: "En cours",
      unknown: "Inconnu",
      noTutorial: "Pas de prototype tutorial disponible.",
      before: "Avant",
      after: "Après",
      restart: "Recommencer",

      // Map / Timeline / Compare
      america: "Amérique",
      africa: "Afrique",
      asia: "Asie",
      mapHint: "Cliquez sur un continent pour filtrer · Cliquez sur un point blanc pour voir le jeu",
      compareTitle: "Comparer deux jeux",
      comparativeAnalysis: "Analyse comparative",
      chooseGameA: "Choisir le jeu A",
      chooseGameB: "Choisir le jeu B",
      region: "Région",
      type: "Type",
      difficulty: "Difficulté",
      playable: "Jouable",
      reconstructionStatus: "Reconstruction",
      yes: "Oui",
      no: "Non",
      commonLudemes: "Ludemes communs",
      comparePlaceholder: "Sélectionnez deux jeux ci-dessus pour voir une comparaison détaillée.",

      // Quiz
      testKnowledge: "Testez vos connaissances",
      traditionalGames: "Jeux Traditionnels",
      quizSub: "questions sur les origines, périodes, types et niveaux des jeux du catalogue.",
      start: "Commencer",
      leaderboard: "Classement",
      noScores: "Aucun score. Soyez le premier !",
      quizFinished: "Quiz terminé !",
      quizExc: "Excellent ! Vous êtes un expert !",
      quizGood: "Bien joué !",
      quizMore: "Continuez à explorer le catalogue !",
      viewLeaderboard: "Voir classement",
      playAgain: "Rejouer",
      seeResults: "Voir le résultat",
      nextQuestion: "Question suivante",

      // Awale Game
      awaleP1Turn: "Joueur 1 — choisissez une case (rangée du bas)",
      awaleP2Turn: "Joueur 2 — choisissez une case (rangée du haut)",
      p1Wins: "Joueur 1 gagne !",
      p2Wins: "Joueur 2 gagne !",
      draw: "Égalité !",
      player: "Joueur",
      newGame: "Nouvelle partie",
      awaleHint: "2 joueurs en local · J1 = bas · J2 = haut",

      // Achievements
      achievements: {
        firstViewLabel: "Première découverte",
        firstViewDesc: "Consulter la fiche d'un premier jeu",
        explorerLabel: "Explorateur",
        explorerDesc: "Consulter au moins 5 jeux",
        scholarLabel: "Érudit",
        scholarDesc: "Consulter 10 jeux ou plus",
        firstFavLabel: "Coup de cœur",
        firstFavDesc: "Ajouter un jeu aux favoris",
        collectorLabel: "Collectionneur",
        collectorDesc: "Garder au moins 5 jeux favoris",
        globetrotterLabel: "Globe-trotteur",
        globetrotterDesc: "Découvrir des jeux de 3 régions",
        worldLabel: "Citoyen du monde",
        worldDesc: "Découvrir des jeux des 4 régions",
        historianLabel: "Historien",
        historianDesc: "Consulter 3 jeux de l'Antiquité",
        contributorLabel: "Contributeur",
        contributorDesc: "Poster un 1er message communautaire",
        activeLabel: "Voix active",
        activeDesc: "Poster 3 messages ou plus"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Anglais par défaut
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
