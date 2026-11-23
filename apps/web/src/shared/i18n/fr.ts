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
  common: {
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    back: 'Page précédente',
    edit: 'Modifier',
    optional: 'facultatif',
    days: (count: number) => (count > 1 ? `${count} jours` : `${count} jour`),
    travellers: (count: number) => (count > 1 ? `${count} voyageurs` : `${count} voyageur`),
  },
  validation: {
    required: 'Ce champ est obligatoire',
    dateRequired: 'Choisis une date',
    endBeforeStart: 'Le retour doit être le jour du départ ou après',
    maxLength: (max: number) => `${max} caractères maximum`,
    saveFailed: 'L’enregistrement a échoué. Réessaie ; tes données saisies sont conservées.',
  },
  trips: {
    listTitle: 'Mes voyages',
    newTrip: 'Nouveau voyage',
    newTripShort: 'Nouveau',
    noTripsTitle: 'Aucun voyage',
    noTripsBody: 'Crée ton premier voyage : ses dates, puis les personnes qui partent avec toi.',
    create: 'Créer le voyage',
    nameLabel: 'Nom du voyage',
    namePlaceholder: 'Ex. : Vietnam 2027',
    startLabel: 'Départ',
    endLabel: 'Retour',
    datesHint: 'Tu pourras les changer quand tes billets seront réservés.',
    currencyLabel: 'Devise des budgets',
    currencyHint: 'Les dépenses en đồng seront converties dans cette devise.',
    currencies: { EUR: 'Euro (€)', VND: 'Đồng vietnamien (₫)' },
    whoTitle: 'Qui part ?',
    ownerLabel: 'Ton prénom',
    companionLabel: (index: number) => `Voyageur ${index}`,
    companionPlaceholder: 'Prénom',
    addCompanion: 'Ajouter un voyageur',
    removeCompanion: (name: string) => (name ? `Retirer ${name}` : 'Retirer ce voyageur'),
    editTitle: 'Modifier le voyage',
    openTrip: 'Afficher ce voyage',
    displayed: 'Voyage affiché',
    change: 'Changer',
    settingsLink: 'Réglages du voyage',
    settingsShort: 'Réglages',
    phase: {
      upcoming: (days: number) =>
        days === 0
          ? 'Départ aujourd’hui'
          : days === 1
            ? 'Départ demain'
            : `Départ dans ${days} jours`,
      ongoing: (day: number, total: number) => `En cours · jour ${day} sur ${total}`,
      past: 'Terminé',
      archived: 'Archivé',
    },
    archive: 'Archiver le voyage',
    unarchive: 'Désarchiver le voyage',
    archiveHint: 'Un voyage archivé n’est plus affiché par défaut, mais reste consultable ici.',
    delete: 'Supprimer le voyage',
    deleteTitle: 'Supprimer ce voyage ?',
    deleteMessage: (name: string) =>
      `« ${name} » et tout ce qu’il contient (membres, étapes, idées, dépenses) seront supprimés de cet appareil. Pense à faire un export avant si tu veux garder une copie.`,
    dangerZone: 'Zone sensible',
    notFound: 'Ce voyage n’existe pas ou a été supprimé.',
    detailsTitle: 'Informations',
    duration: 'Durée',
    dates: 'Dates',
    currency: 'Devise des budgets',
  },
  members: {
    title: 'Voyageurs',
    me: 'moi',
    add: 'Ajouter un voyageur',
    addTitle: 'Nouveau voyageur',
    editTitle: 'Modifier le voyageur',
    nameLabel: 'Prénom',
    edit: (name: string) => `Modifier ${name}`,
    remove: 'Retirer du voyage',
    removeTitle: 'Retirer ce voyageur ?',
    removeMessage: (name: string) =>
      `${name} ne fera plus partie du voyage. Ses avis et dépenses éventuels resteront visibles sous son nom.`,
    ownerHint: 'C’est toi : tu ne peux pas te retirer du voyage.',
  },
  stops: {
    title: 'Étapes',
    add: 'Ajouter une étape',
    addTitle: 'Nouvelle étape',
    editTitle: 'Modifier l’étape',
    edit: (name: string) => `Modifier l’étape ${name}`,
    nameLabel: 'Nom',
    namePlaceholder: 'Ex. : Hoi An',
    vietnameseLabel: 'Nom en vietnamien',
    vietnamesePlaceholder: 'Ex. : Hội An',
    vietnameseHint: 'Avec les accents, pour le montrer à un chauffeur ou sur un panneau.',
    kindLabel: 'Type',
    kinds: { city: 'Ville', village: 'Village', island: 'Île' },
    arrivalLabel: 'Arrivée',
    departureLabel: 'Départ',
    datesHint: 'Le jour du départ, tu peux arriver à l’étape suivante.',
    notesLabel: 'Notes',
    notesPlaceholder: 'Ex. : chez cô Lan, apporter les cadeaux',
    nights: (count: number) => (count > 1 ? `${count} nuits` : `${count} nuit`),
    until: (date: string) => `jusqu’au ${date}`,
    delete: 'Supprimer l’étape',
    deleteTitle: 'Supprimer cette étape ?',
    deleteMessage: (name: string) =>
      `« ${name} » sera supprimée, avec ses hébergements et les trajets qui la relient aux autres étapes.`,
    emptyTitle: 'Aucune étape pour l’instant',
    emptyBody:
      'Ajoute les villes, îles et villages où vous dormirez, dans l’ordre du voyage. Les jours du voyage se rangeront tout seuls dans chaque étape.',
    gap: (nights: string, range: string) => `${nights} sans étape · ${range}`,
    fillGap: 'Ajouter une étape ici',
    transition: (date: string) => `Changement d’étape · ${date}`,
    overlapWarning: (a: string, b: string) =>
      `« ${a} » et « ${b} » se chevauchent : modifie les dates de l’une des deux.`,
    allCovered: 'Toutes les nuits du voyage ont une étape.',
    nightsCovered: (covered: number, total: number) =>
      `${covered} nuits sur ${total} ont une étape`,
    stripLabel: (summary: string) => `Répartition des nuits du voyage : ${summary}`,
    stripUncovered: 'sans étape',
    errors: {
      noNight: 'Le départ doit être au moins le lendemain de l’arrivée',
      outsideTrip: (range: string) => `L’étape doit être comprise dans le voyage (${range})`,
      overlap: (name: string) => `Ces dates chevauchent l’étape « ${name} »`,
    },
  },
  planning: {
    tripDates: (range: string, length: string) => `${range} · ${length}`,
    stopsTitle: 'Étapes du voyage',
    stopsBody:
      'Hô Chi Minh-Ville, Hoi An, les villages de la famille… Les étapes, hébergements et trajets arrivent au prochain lot.',
    noTripBody:
      'Commence par créer ton voyage avec ses dates et ses voyageurs. Tu pourras ensuite ajouter les étapes.',
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
    countdownTitle: (days: number) =>
      days === 0
        ? 'C’est le grand jour'
        : days === 1
          ? 'Départ demain'
          : `Départ dans ${days} jours`,
    upcomingBody:
      'Prépare ton itinéraire : étapes, hébergements, trajets. Le programme du jour et ton argent s’afficheront ici pendant le voyage.',
    upcomingAction: 'Ouvrir le planning',
    ongoingBody:
      'Le programme du jour et le suivi de tes dépenses arrivent avec les prochaines phases.',
    pastTitle: 'Voyage terminé',
    pastBody: 'Retrouve tes dépenses, tes adresses et ton journal dans les écrans dédiés.',
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
    trips: 'Mes voyages',
    places: 'Carnet d’adresses',
    budget: 'Budget',
    family: 'Famille et cadeaux',
    checklist: 'Checklist avant départ',
    journal: 'Journal de voyage',
    tools: 'Aide aux billets',
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
