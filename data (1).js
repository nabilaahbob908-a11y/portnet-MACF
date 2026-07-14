/* =========================================================================
   PortNet – Module Empreinte Carbone MACF
   data.js — Référentiel unifié (données de référence) et constantes.
   IMPORTANT : ce fichier ne contient plus aucun résultat de calcul.
   Tous les indicateurs (Scope 1/2/3, bilan, intensité, rapport) sont
   recalculés dynamiquement par calc-engine.js à partir des valeurs
   saisies dans le formulaire — voir app.js / calc-engine.js.
   ========================================================================= */

const DEMO = {
  // Métadonnées d'affichage (utilisateur, référence document) — non liées au calcul
  meta: {
    utilisateur: "A. Ahboub — Chargée MACF",
    reference: "PN-MACF-2026-00417",
  },

  // Facteurs d'émission de référence (constantes utilisées par le moteur de calcul)
  facteurs: {
    gazNaturel:      { valeur: 2.04,      unite: "kg CO2e / m3",   scope: "Scope 1", source: "Coefficient officiel" },
    electriciteONEE: { valeur: 0.672,     unite: "kg CO2e / kWh",  scope: "Scope 2", source: "Mix électrique moyen Maroc" },
    fioulLourd:      { valeur: 3.19,      unite: "kg CO2e / kg",   scope: "Scope 1", source: "Mode réel" },
    transportRoutier:{ valeur: 0.000085,  unite: "t CO2e / t.km",  scope: "Scope 3", source: "ISO 14083 — Camion 35t" },
    transportMaritime:{ valeur: 0.000015, unite: "t CO2e / t.km",  scope: "Scope 3", source: "ISO 14083 — Porte-conteneurs" },
  },

  coefficientsDetour: {
    route: 1.10,
    mer: 1.15,
  },

  // Référentiel HS Codes / Modules MACF
  hsCodes: [
    { code: "2716", famille: "1. Électricité", designation: "Électricité réseau (défaut UE)", fe: 0.39, unite: "t CO2e / MWh", module: "Module C — Valeurs par défaut" },
    { code: "2804", famille: "2. Hydrogène", designation: "Hydrogène", fe: 11.92, unite: "t CO2e / t", module: "Module C — Valeurs par défaut" },
    { code: "2523", famille: "3. Ciment", designation: "Ciment Portland", fe: 1.49, unite: "t CO2e / t", module: "Module C — Valeurs par défaut" },
    { code: "3102", famille: "4. Engrais", designation: "Nitrate d'ammonium (par défaut)", fe: 2.56, unite: "t CO2e / t", module: "Module C — Valeurs par défaut" },
    { code: "7208", famille: "5. Fer & Acier", designation: "Produits laminés (tôles, bobines)", fe: 1.894, unite: "t CO2e / t", module: "Module C — Valeurs par défaut" },
    { code: "7601", famille: "6. Aluminium", designation: "Aluminium brut", fe: 0.396, unite: "t CO2e / t", module: "Module C — Valeurs par défaut" },
  ],

  transportModesRef: [
    { mode: "Transport routier", vehicule: "Camion remorque 35t", fe: 0.000085, unite: "t CO2e / t.km", detour: 1.10, norme: "ISO 14083", scope: "Scope 3" },
    { mode: "Transport maritime", vehicule: "Navire porte-conteneurs", fe: 0.000015, unite: "t CO2e / t.km", detour: 1.15, norme: "ISO 14083", scope: "Scope 3" },
  ],

  emissionFactorsRef: [
    { element: "Gaz naturel", categorie: "Production — Usine", fe: 2.04, unite: "kg CO2e / m3", scope: "Scope 1", module: "Module B — Facteurs réels" },
    { element: "Fioul lourd", categorie: "Production — Usine", fe: 3.19, unite: "kg CO2e / kg", scope: "Scope 1", module: "Module B — Facteurs réels" },
    { element: "Électricité ONEE", categorie: "Énergie — Usine", fe: 0.672, unite: "kg CO2e / kWh", scope: "Scope 2", module: "Module B — Facteurs réels" },
    { element: "Camion remorque", categorie: "Logistique — Route", fe: 0.000085, unite: "t CO2e / t.km", scope: "Scope 3", module: "Module B — Facteurs réels" },
    { element: "Porte-conteneurs", categorie: "Logistique — Mer", fe: 0.000015, unite: "t CO2e / t.km", scope: "Scope 3", module: "Module B — Facteurs réels" },
  ],

  defaultValuesRef: [
    { code: "2716", designation: "Électricité réseau (défaut UE)", fe: 0.39, unite: "t CO2e / MWh", note: "Réseau de base historique" },
    { code: "2804", designation: "Hydrogène", fe: 11.92, unite: "t CO2e / t", note: "Procédé de vaporisation" },
    { code: "2523", designation: "Ciment Portland", fe: 1.49, unite: "t CO2e / t", note: "Standard de secours" },
    { code: "3102", designation: "Nitrate d'ammonium", fe: 2.56, unite: "t CO2e / t", note: "Standard de secours" },
    { code: "7208", designation: "Produits laminés (fer & acier)", fe: 1.894, unite: "t CO2e / t", note: "Standard de secours" },
    { code: "7601", designation: "Aluminium brut", fe: 0.396, unite: "t CO2e / t", note: "Électrolyse standard" },
  ],

  distancesRef: [
    { origine: "Jorf Lasfar (Maroc)", destination: "Port de Jorf Lasfar", mode: "Routier", distance: 120 },
    { origine: "Jorf Lasfar (Maroc)", destination: "Marseille (France)", mode: "Maritime", distance: 1500 },
    { origine: "Casablanca (Maroc)", destination: "Marseille (France)", mode: "Maritime", distance: 1450 },
    { origine: "Tanger Med (Maroc)", destination: "Algésiras (Espagne)", mode: "Maritime", distance: 40 },
    { origine: "Safi (Maroc)", destination: "Rotterdam (Pays-Bas)", mode: "Maritime", distance: 2650 },
    { origine: "Usine (Nador)", destination: "Port de Nador", mode: "Routier", distance: 45 },
  ],

  // Association Produit -> Code SH -> Facteur d'émission de production par défaut (Module C)
  productMap: {
    "Engrais azoté — Nitrate d'ammonium": { hs: "3102", fe: 2.56 },
    "Ciment Portland":                     { hs: "2523", fe: 1.49 },
    "Produits laminés (fer & acier)":      { hs: "7208", fe: 1.894 },
    "Aluminium brut":                      { hs: "7601", fe: 0.396 },
    "Hydrogène":                           { hs: "2804", fe: 11.92 },
  },
};
