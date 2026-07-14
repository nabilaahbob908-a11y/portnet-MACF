/* =========================================================================
   PortNet – Module Empreinte Carbone MACF
   calc-engine.js — Moteur de calcul dynamique.

   Aucune valeur de résultat n'est codée en dur ici : tout est recalculé
   à partir de l'objet `input` fourni (lu en direct depuis le formulaire
   par app.js). Formules appliquées :

     Émissions de transport = Distance × Poids × Facteur d'émission transport
     Émissions de production = Activité de production × Facteur d'émission production
     Émissions totales = Émissions de production + Émissions de transport
     Intensité carbone = Émissions totales / Poids

   Répartition par Scope :
     Scope 1 (émissions directes)   — combustion de gaz naturel sur site
     Scope 2 (énergie indirecte)    — électricité consommée sur site
     Scope 3 (transport & logistique) — route + maritime (+ autres modes)

   Mode "réel usine" (Module B)  : Scope 1 et Scope 2 sont calculés séparément
   à partir des consommations réelles de gaz/électricité, allouées au lot
   au prorata de la production annuelle.
   Mode "valeurs par défaut" (Module C) : l'émission de production est une
   valeur globale par tonne (Scope 1 = 0, Scope 2 = émission de production),
   conformément à l'absence de distinction de scope dans les valeurs par
   défaut MACF.
   ========================================================================= */

const CalcEngine = (function () {

  const FE = DEMO.facteurs;
  const DETOUR = DEMO.coefficientsDetour;

  /**
   * input shape:
   * {
   *   poids: number (tonnes),
   *   distanceRoute: number (km),
   *   distanceMer: number (km),
   *   transportModes: { routier, maritime, ferroviaire, aerien } (bool),
   *   isReal: bool,
   *   prodAnnuelle: number (t/an),
   *   consoGaz: number (m3/an),
   *   consoElec: number (kWh/an),
   *   feProdDefault: number (t CO2e / t) — facteur de production (mode défaut)
   *   scopesIncluded: { s1, s2, s3 } (bool) — périmètre de déclaration
   * }
   */
  function compute(input) {
    const poids = num(input.poids);

    // --- Émissions de production (Scope 1 + Scope 2) ---
    let scope1 = 0, scope2 = 0;
    let productionActivityLabel = "", productionFELabel = "";

    if (input.isReal) {
      const allocFactor = input.prodAnnuelle > 0 ? (poids / num(input.prodAnnuelle)) : 0;
      const gazAlloue = num(input.consoGaz) * allocFactor;   // m3 alloués au lot
      const elecAlloue = num(input.consoElec) * allocFactor; // kWh alloués au lot

      // Émissions de production = Activité de production × Facteur d'émission production
      scope1 = (gazAlloue * FE.gazNaturel.valeur) / 1000;       // kg -> t
      scope2 = (elecAlloue * FE.electriciteONEE.valeur) / 1000; // kg -> t

      productionActivityLabel = `Gaz alloué ${round(gazAlloue,2)} m³ · Élec allouée ${round(elecAlloue,2)} kWh`;
      productionFELabel = `${FE.gazNaturel.valeur} kg/m³ (Scope1) · ${FE.electriciteONEE.valeur} kg/kWh (Scope2)`;
    } else {
      // Mode valeurs par défaut : Activité de production = poids du lot
      const feDefault = num(input.feProdDefault);
      scope1 = 0;
      scope2 = poids * feDefault;
      productionActivityLabel = `${poids} t (poids du lot)`;
      productionFELabel = `${feDefault} t CO2e/t (valeur par défaut MACF)`;
    }

    // --- Émissions de transport (Scope 3) ---
    const feRouteEff = FE.transportRoutier.valeur * DETOUR.route;
    const feMerEff = FE.transportMaritime.valeur * DETOUR.mer;

    const scope3Route = input.transportModes.routier
      ? num(input.distanceRoute) * poids * feRouteEff : 0;
    const scope3Mer = input.transportModes.maritime
      ? num(input.distanceMer) * poids * feMerEff : 0;

    let scope3 = scope3Route + scope3Mer;

    // --- Périmètre de déclaration (scopes inclus/exclus) ---
    const inc = input.scopesIncluded || { s1: true, s2: true, s3: true };
    if (!inc.s1) scope1 = 0;
    if (!inc.s2) scope2 = 0;
    let scope3RouteFinal = scope3Route, scope3MerFinal = scope3Mer;
    if (!inc.s3) { scope3 = 0; scope3RouteFinal = 0; scope3MerFinal = 0; }

    const sousTotalFabrication = scope1 + scope2;
    const sousTotalLogistique = scope3;
    const bilanGlobal = sousTotalFabrication + sousTotalLogistique;

    const intensiteFabrication = poids ? sousTotalFabrication / poids : 0;
    const intensiteTransport = poids ? sousTotalLogistique / poids : 0;
    const intensiteGlobale = poids ? bilanGlobal / poids : 0;

    return {
      mode: input.isReal ? "MODE RÉEL USINE ACTIVÉ" : "MODE VALEURS PAR DÉFAUT (MACF)",
      isReal: input.isReal,
      poidsLot: poids,
      scope1, scope2,
      scope3Route: scope3RouteFinal, scope3Mer: scope3MerFinal,
      sousTotalFabrication, sousTotalLogistique, bilanGlobal,
      intensiteFabrication, intensiteTransport, intensiteGlobale,
      feRouteEff, feMerEff,
      productionActivityLabel, productionFELabel,
      scopesIncluded: inc,
    };
  }

  /**
   * Construit la description pédagogique des étapes de calcul (pour la page
   * "Calcul carbone"), avec les formules réellement appliquées et les
   * valeurs substituées à partir de l'input courant.
   */
  function buildSteps(input, r) {
    const poids = num(input.poids);
    const steps = [];

    steps.push({
      title: "Détection du mode de données",
      desc: "PortNet vérifie si l'exportateur a fourni ses données industrielles réelles (Module B) ou si les valeurs par défaut MACF (Module C) doivent être appliquées.",
      formula: `SI données_réelles = OUI  →  Module B (facteurs réels usine)\nSINON                     →  Module C (valeurs par défaut MACF)`,
      result: r.mode,
    });

    if (input.isReal) {
      const allocFactor = input.prodAnnuelle > 0 ? (poids / num(input.prodAnnuelle)) : 0;
      steps.push({
        title: "Calcul de fabrication — Scope 1 (Gaz naturel)",
        desc: "Émissions directes liées à la combustion de gaz naturel, allouées au lot au prorata de la production annuelle.",
        formula: `Activité de production (gaz) = Conso. Gaz annuelle × (Poids du lot / Production annuelle)\n  = ${input.consoGaz} × (${poids} / ${input.prodAnnuelle}) = ${round(input.consoGaz*allocFactor,2)} m³\n\nÉmissions de production (Scope 1) = Activité de production × Facteur d'émission\n  = ${round(input.consoGaz*allocFactor,2)} m³ × ${FE.gazNaturel.valeur} kg/m³ / 1000`,
        result: round(r.scope1, 4) + " t CO2e",
      });
      steps.push({
        title: "Calcul de fabrication — Scope 2 (Électricité)",
        desc: "Émissions indirectes liées à la consommation électrique du site (mix ONEE), allouées au lot exporté.",
        formula: `Activité de production (élec) = Conso. Élec annuelle × (Poids du lot / Production annuelle)\n  = ${input.consoElec} × (${poids} / ${input.prodAnnuelle}) = ${round(input.consoElec*allocFactor,2)} kWh\n\nÉmissions de production (Scope 2) = Activité de production × Facteur d'émission\n  = ${round(input.consoElec*allocFactor,2)} kWh × ${FE.electriciteONEE.valeur} kg/kWh / 1000`,
        result: round(r.scope2, 4) + " t CO2e",
      });
    } else {
      steps.push({
        title: "Calcul de fabrication — Valeurs par défaut (Module C)",
        desc: "En l'absence de données industrielles réelles, l'émission de production est calculée à partir de la valeur par défaut MACF associée au code SH du produit. Le Module C ne distingue pas Scope 1 / Scope 2.",
        formula: `Émissions de production = Activité de production × Facteur d'émission production\n  = ${poids} t × ${input.feProdDefault} t CO2e/t`,
        result: round(r.scope2, 4) + " t CO2e (Scope 1 = 0, non distingué en mode défaut)",
      });
    }

    steps.push({
      title: "Sous-total Fabrication",
      desc: "Somme des émissions directes et indirectes de production, converties en intensité carbone de fabrication.",
      formula: `Sous-total = Scope 1 + Scope 2 = ${round(r.scope1,4)} + ${round(r.scope2,4)}\nIntensité fabrication = Sous-total / Poids du lot`,
      result: round(r.sousTotalFabrication, 4) + " t CO2e  ·  " + round(r.intensiteFabrication, 4) + " t/t",
    });

    if (input.transportModes.routier) {
      steps.push({
        title: "Calcul logistique — Scope 3 (Transport routier)",
        desc: "Émissions du trajet usine → port, norme ISO 14083, facteur d'émission ajusté du coefficient de détour routier.",
        formula: `Émissions de transport = Distance × Poids × Facteur d'émission transport\n  = ${input.distanceRoute} km × ${poids} t × (${FE.transportRoutier.valeur} × ${DETOUR.route}) t CO2e/t.km`,
        result: round(r.scope3Route, 4) + " t CO2e",
      });
    }
    if (input.transportModes.maritime) {
      steps.push({
        title: "Calcul logistique — Scope 3 (Transport maritime)",
        desc: "Émissions du trajet port → port Europe, norme ISO 14083, facteur d'émission ajusté du coefficient de détour maritime.",
        formula: `Émissions de transport = Distance × Poids × Facteur d'émission transport\n  = ${input.distanceMer} km × ${poids} t × (${FE.transportMaritime.valeur} × ${DETOUR.mer}) t CO2e/t.km`,
        result: round(r.scope3Mer, 4) + " t CO2e",
      });
    }
    if (!input.transportModes.routier && !input.transportModes.maritime) {
      steps.push({
        title: "Calcul logistique — Scope 3 (Transport)",
        desc: "Aucun mode de transport modélisé (Routier / Maritime) n'a été sélectionné dans le formulaire.",
        formula: `Émissions de transport = 0 (aucun mode sélectionné)`,
        result: "0.0000 t CO2e",
      });
    }

    steps.push({
      title: "Agrégation du bilan MACF",
      desc: "Somme de la fabrication et de la logistique pour obtenir le bilan global du lot et son intensité carbone finale.",
      formula: `Émissions totales = Émissions de production + Émissions de transport\n  = ${round(r.sousTotalFabrication,4)} + ${round(r.sousTotalLogistique,4)}\n\nIntensité carbone = Émissions totales / Poids\n  = ${round(r.bilanGlobal,4)} / ${poids}`,
      result: round(r.bilanGlobal, 4) + " t CO2e  ·  " + round(r.intensiteGlobale, 4) + " t/t",
      final: true,
    });

    return steps;
  }

  function num(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  function round(v, d) {
    const f = Math.pow(10, d);
    return Math.round(v * f) / f;
  }

  return { compute, buildSteps };
})();
