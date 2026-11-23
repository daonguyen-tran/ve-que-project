/**
 * Tous les textes de l'interface (NF-12). Aucun texte ne doit être écrit en dur dans un
 * composant : on l'ajoute ici et on l'importe via `t`.
 *
 * L'objet est `as const` : TypeScript connaît chaque clé, une faute de frappe dans
 * `t.nav.todya` est donc une erreur de compilation. Pour traduire l'appli plus tard, on créera
 * `en.ts` avec le même type (`Messages`) et on choisira le dictionnaire au démarrage.
 */
export const fr = {
  app: {
    name: 'Về Quê',
  },
  nav: {
    label: 'Navigation principale',
    today: "Aujourd'hui",
    planning: 'Planning',
    ideas: 'Idées',
    expenses: 'Dépenses',
    more: 'Plus',
  },
  quickExpense: {
    button: 'Dépense',
    buttonLabel: 'Ajouter une dépense',
    title: 'Nouvelle dépense',
    comingSoon:
      'La saisie rapide arrive en phase 2 : pavé « 50k », catégorie, et tout le reste pré-rempli.',
  },
  today: {
    welcomeTitle: 'Bienvenue',
    welcomeSubtitle: 'Ton voyage au Vietnam, jour après jour.',
    noTripTitle: 'Aucun voyage pour l’instant',
    noTripBody:
      'Crée ton voyage, ajoute tes étapes, et cet écran te dira chaque jour ce qui est prévu et où en est ton argent.',
    noTripAction: 'Préparer mon voyage',
    previewLink: 'Voir l’écran avec des données d’exemple',
    cashInPocket: 'Espèces en poche',
    recount: 'Recompter',
    spentToday: "Dépensé aujourd'hui",
    program: 'Programme',
    freeTimeLink: "J'ai du temps libre",
    lastExpenses: 'Dernières dépenses',
    now: 'En cours',
    overBudget: (amount: string) => `Budget du jour dépassé de ${amount}`,
    dayOf: (day: number, total: number) => `Jour ${day} sur ${total}`,
  },
  slots: {
    morning: 'Matin',
    afternoon: 'Après-midi',
    evening: 'Soir',
  },
  status: {
    done: 'fait',
    now: 'maintenant',
  },
  categories: {
    accommodation: 'Hébergement',
    transport: 'Transport',
    food: 'Nourriture',
    activities: 'Activités',
    shopping: 'Shopping',
    gifts: 'Cadeaux',
    health: 'Santé',
    communication: 'Communication',
    pre_departure: 'Avant départ',
    bank_fees: 'Frais bancaires',
    misc: 'Divers',
  },
  placeholder: {
    phase: (phase: number) => `Prévu en phase ${phase}`,
    planningTitle: 'Planning',
    planningBody:
      'Étapes, hébergements, trajets et journées découpées en matin, après-midi et soir.',
    ideasTitle: 'Banque d’idées',
    ideasBody: 'Tes idées d’activités par ville, à glisser dans un créneau en un geste.',
    expensesTitle: 'Dépenses',
    expensesBody: 'Toutes tes dépenses, tes portefeuilles et ton budget, prévu contre réel.',
    moreTitle: 'Plus',
  },
  more: {
    budget: 'Budget',
    family: 'Famille et cadeaux',
    checklist: 'Checklist avant départ',
    journal: 'Journal de voyage',
    tools: 'Billets et prix de référence',
    data: 'Sauvegarde et transfert',
    settings: 'Paramètres',
  },
  preview: {
    title: 'Aperçu du design',
    badge: 'Données d’exemple',
    notice: 'Données fictives : cet écran montre le rendu final avec un voyage d’exemple.',
    back: 'Retour',
  },
  pwa: {
    updateAvailable: 'Une nouvelle version de Về Quê est prête.',
    reload: 'Mettre à jour',
    dismiss: 'Plus tard',
    offlineReady: 'Về Quê fonctionne maintenant sans réseau.',
  },
  notFound: {
    title: 'Page introuvable',
    back: "Revenir à aujourd'hui",
  },
} as const;

export type Messages = typeof fr;
