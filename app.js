/* =========================================================================
   PortNet – Module Empreinte Carbone MACF
   app.js — Routage, rendu dynamique, interactions
   ========================================================================= */

(function () {
  "use strict";

  const PAGE_TITLES = {
    "home": "Tableau de bord",
    "new-calc": "Nouveau calcul",
    "referentiels": "Référentiels unifiés",
    "calcul": "Calcul carbone",
    "resultats": "Résultats & KPI",
    "rapport": "Rapport final",
  };

  /* ---------------------------------------------------------------------
     ICONS: inject every [data-icon] placeholder
  --------------------------------------------------------------------- */
  function hydrateIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach(el => {
      const name = el.getAttribute("data-icon");
      if (ICONS[name]) el.innerHTML = ICONS[name];
    });
  }

  /* ---------------------------------------------------------------------
     ROUTING
  --------------------------------------------------------------------- */
  function navigate(view) {
    if (!PAGE_TITLES[view]) view = "home";

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const target = document.getElementById("view-" + view);
    if (target) target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    const navEl = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navEl) navEl.classList.add("active");

    document.getElementById("crumb-current").textContent = PAGE_TITLES[view];
    document.getElementById("page-heading").textContent = PAGE_TITLES[view];

    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleHash() {
    const view = (location.hash || "#home").replace("#", "");
    navigate(view);
  }

  /* ---------------------------------------------------------------------
     TOASTS
  --------------------------------------------------------------------- */
  function toast(message, icon = "check") {
    const region = document.getElementById("toast-region");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="icon">${ICONS[icon] || ICONS.check}</span><span>${message}</span>`;
    region.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .3s ease, transform .3s ease";
      el.style.opacity = "0";
      el.style.transform = "translateX(20px)";
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  /* ---------------------------------------------------------------------
     HOME: hero journey signature diagram
  --------------------------------------------------------------------- */
  function renderJourney() {
    const stages = [
      { icon: ICONS.factory, label: "Usine", sub: "Jorf Lasfar", emis: "0.22 t" },
      { icon: ICONS.truck,   label: "Route", sub: DEMO.input.distanceRoute + " km", emis: "0.64 t" },
      { icon: ICONS.ship,    label: "Port → Mer", sub: DEMO.input.distanceMer + " km", emis: "1.49 t" },
      { icon: ICONS.flag,    label: "Frontière UE", sub: "Marseille", emis: "MACF" },
    ];
    const W = 1040, H = 148, n = stages.length;
    const stepX = (W - 120) / (n - 1);
    let nodes = "", path = "";
    stages.forEach((s, i) => {
      const x = 60 + i * stepX;
      const y = 58;
      if (i > 0) {
        const px = 60 + (i - 1) * stepX;
        path += `<line x1="${px + 26}" y1="${y}" x2="${x - 26}" y2="${y}" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-dasharray="1 8" stroke-linecap="round"/>`;
      }
      nodes += `
        <g>
          <circle cx="${x}" cy="${y}" r="25" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.35)" stroke-width="1.4"/>
          <g transform="translate(${x - 11} ${y - 11})" fill="none" stroke="#8FF0C7" stroke-width="1.6">
            <g transform="scale(0.917)">${s.icon.replace(/<svg[^>]*>|<\/svg>/g, "")}</g>
          </g>
          <text x="${x}" y="${y + 46}" text-anchor="middle" font-family="Manrope, sans-serif" font-size="12.5" font-weight="700" fill="#fff">${s.label}</text>
          <text x="${x}" y="${y + 63}" text-anchor="middle" font-family="Inter, sans-serif" font-size="10.5" fill="rgba(255,255,255,.55)">${s.sub}</text>
          <text x="${x}" y="${y - 40}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600" fill="#8FF0C7">${s.emis}</text>
        </g>`;
    });
    const svg = `<svg class="journey-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${path}${nodes}</svg>`;
    document.getElementById("journey-svg").innerHTML = svg;
  }

  /* ---------------------------------------------------------------------
     HOME: KPI cards
  --------------------------------------------------------------------- */
  function renderHomeKPIs() {
    const r = DEMO.resultats;
    const items = [
      { icon: "cloud", cls: "navy", lbl: "Bilan global du lot", val: r.bilanGlobal.toFixed(3) + " t", trend: null },
      { icon: "leaf", cls: "green", lbl: "Intensité carbone globale", val: r.intensiteGlobale.toFixed(4) + " t/t", trend: "−52% vs défaut" },
      { icon: "scale", cls: "blue", lbl: "Poids du lot traité", val: DEMO.input.poidsLot + " t", trend: null },
      { icon: "check", cls: "amber", lbl: "Mode de données", val: "Réel usine", trend: "Module B" },
    ];
    document.getElementById("home-kpis").innerHTML = items.map(kpiCard).join("");
    hydrateIcons(document.getElementById("home-kpis"));
  }

  function kpiCard(k) {
    return `
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon ${k.cls}" data-icon="${k.icon}"></div>
          ${k.trend ? `<span class="kpi-trend up">${k.trend}</span>` : ""}
        </div>
        <div class="kpi-val">${k.val}</div>
        <div class="kpi-lbl">${k.lbl}</div>
      </div>`;
  }

  /* ---------------------------------------------------------------------
     HOME: navigation cards
  --------------------------------------------------------------------- */
  function renderNavCards() {
    const cards = [
      { view: "new-calc", icon: "plus", cls: "blue", title: "Nouveau calcul", desc: "Saisir les données d'un nouveau lot exporté : produit, code SH, transport et distances." },
      { view: "referentiels", icon: "database", cls: "green", title: "Référentiels unifiés", desc: "Consulter les codes SH, facteurs d'émission, valeurs par défaut et distances de référence." },
      { view: "calcul", icon: "calculator", cls: "navy", title: "Calcul carbone", desc: "Suivre le déroulé du calcul DMADV : fabrication, transport, agrégation du bilan MACF." },
      { view: "resultats", icon: "chart", cls: "blue", title: "Résultats & KPI", desc: "Visualiser la répartition des émissions par Scope 1, 2 et 3 et l'intensité carbone." },
      { view: "rapport", icon: "report", cls: "green", title: "Rapport final", desc: "Générer le document de synthèse officiel prêt à être joint à la déclaration MACF." },
      { view: "referentiels", icon: "globe", cls: "amber", title: "Conformité réglementaire", desc: "Cadre Règlements UE 2023/956, 2023/1773 et norme ISO 14083:2023." },
    ];
    document.getElementById("home-nav-cards").innerHTML = cards.map(c => `
      <a href="#${c.view}" class="nav-card">
        <div class="nc-icon kpi-icon ${c.cls}" data-icon="${c.icon}"></div>
        <div>
          <div class="nc-title">${c.title}</div>
          <div class="nc-desc">${c.desc}</div>
        </div>
        <div class="nc-go">Ouvrir <span class="icon" data-icon="chevronRight"></span></div>
      </a>`).join("");
    hydrateIcons(document.getElementById("home-nav-cards"));
  }

  /* ---------------------------------------------------------------------
     REFERENTIELS: tables
  --------------------------------------------------------------------- */
  function renderReferentiels() {
    document.getElementById("tab-hs").innerHTML = tableWrap(
      "Rechercher un code SH ou une désignation…",
      ["Code SH", "Famille", "Désignation", "Facteur d'émission", "Unité", "Module"],
      DEMO.hsCodes.map(h => [
        `<span class="mono">${h.code}</span>`,
        h.famille,
        h.designation,
        `<span class="mono">${h.fe}</span>`,
        h.unite,
        `<span class="tag module-c">${h.module.replace("Module C — ", "Module C · ")}</span>`,
      ])
    );

    document.getElementById("tab-transport").innerHTML = tableWrap(
      "Rechercher un mode de transport…",
      ["Mode", "Véhicule / Vecteur", "Facteur d'émission", "Coeff. détour", "Norme", "Scope"],
      DEMO.transportModesRef.map(t => [
        t.mode,
        t.vehicule,
        `<span class="mono">${t.fe}</span> ${t.unite}`,
        `<span class="mono">×${t.detour}</span>`,
        t.norme,
        `<span class="tag scope3">${t.scope}</span>`,
      ])
    );

    document.getElementById("tab-fe").innerHTML = tableWrap(
      "Rechercher un facteur d'émission…",
      ["Élément", "Catégorie", "Facteur d'émission", "Unité", "Scope", "Module"],
      DEMO.emissionFactorsRef.map(e => [
        e.element,
        e.categorie,
        `<span class="mono">${e.fe}</span>`,
        e.unite,
        scopeTag(e.scope),
        `<span class="tag module-b">${e.module.replace("Module B — ", "")}</span>`,
      ])
    );

    document.getElementById("tab-default").innerHTML = tableWrap(
      "Rechercher une valeur par défaut MACF…",
      ["Code SH", "Désignation", "Valeur par défaut", "Unité", "Note"],
      DEMO.defaultValuesRef.map(d => [
        `<span class="mono">${d.code}</span>`,
        d.designation,
        `<span class="mono">${d.fe}</span>`,
        d.unite,
        d.note,
      ])
    );

    document.getElementById("tab-dist").innerHTML = tableWrap(
      "Rechercher une origine ou destination…",
      ["Origine", "Destination", "Mode", "Distance de référence"],
      DEMO.distancesRef.map(d => [
        d.origine,
        d.destination,
        `<span class="tag scope3">${d.mode}</span>`,
        `<span class="mono">${d.distance} km</span>`,
      ])
    );
  }

  function scopeTag(scope) {
    const cls = scope === "Scope 1" ? "scope1" : scope === "Scope 2" ? "scope2" : "scope3";
    return `<span class="tag ${cls}">${scope}</span>`;
  }

  function tableWrap(placeholder, headers, rows) {
    return `
      <div class="tbl-search">
        <div class="input-group">
          <span class="icon-prefix"><span class="icon" style="font-size:15px;">${ICONS.search}</span></span>
          <input class="input" type="text" placeholder="${placeholder}" onkeyup="window.__filterTable(this)">
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  window.__filterTable = function (input) {
    const table = input.closest(".tab-panel").querySelector(".data-table tbody");
    const q = input.value.trim().toLowerCase();
    table.querySelectorAll("tr").forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  };

  /* ---------------------------------------------------------------------
     CALCUL: process steps
  --------------------------------------------------------------------- */
  function renderCalcSteps() {
    const r = DEMO.resultats, i = DEMO.input;
    const steps = [
      {
        title: "Détection du mode de données",
        desc: "PortNet vérifie si l'exportateur a fourni ses données industrielles réelles (Module B) ou si les valeurs par défaut MACF (Module C) doivent être appliquées.",
        formula: `SI données_réelles = OUI  →  Module B (facteurs réels usine)\nSINON                     →  Module C (valeurs par défaut MACF)`,
        result: "MODE RÉEL USINE ACTIVÉ",
      },
      {
        title: "Calcul de fabrication — Scope 1 (Gaz naturel)",
        desc: "Émissions directes liées à la combustion de gaz naturel, allouées au lot au prorata de la production annuelle.",
        formula: `Scope 1 = (Conso. Gaz annuelle × FE Gaz) / (1000 × Production annuelle) × Poids du lot\n        = (${i.consoGaz} × 2.04) / (1000 × ${i.productionAnnuelle}) × ${i.poidsLot}`,
        result: r.scope1.toFixed(4) + " t CO2e",
      },
      {
        title: "Calcul de fabrication — Scope 2 (Électricité)",
        desc: "Émissions indirectes liées à la consommation électrique du site (mix ONEE), allouées au lot exporté.",
        formula: `Scope 2 = (Conso. Élec annuelle × FE Élec) / (1000 × Production annuelle) × Poids du lot\n        = (${i.consoElec} × 0.672) / (1000 × ${i.productionAnnuelle}) × ${i.poidsLot}`,
        result: r.scope2.toFixed(4) + " t CO2e",
      },
      {
        title: "Sous-total Fabrication",
        desc: "Somme des émissions directes et indirectes de production, converties en intensité carbone de fabrication.",
        formula: `Sous-total = Scope 1 + Scope 2\nIntensité fabrication = Sous-total / Poids du lot`,
        result: r.sousTotalFabrication.toFixed(4) + " t CO2e  ·  " + r.intensiteFabrication.toFixed(4) + " t/t",
      },
      {
        title: "Calcul logistique — Scope 3 (Transport routier)",
        desc: "Émissions du trajet usine → port, norme ISO 14083, avec coefficient de détour appliqué.",
        formula: `Scope 3 route = Poids du lot × Distance route × FE routier × Coeff. détour\n             = ${i.poidsLot} × ${i.distanceRoute} × 0.000085 × 1.10`,
        result: r.scope3Route.toFixed(4) + " t CO2e",
      },
      {
        title: "Calcul logistique — Scope 3 (Transport maritime)",
        desc: "Émissions du trajet port → port Europe, norme ISO 14083, avec coefficient de détour maritime.",
        formula: `Scope 3 mer = Poids du lot × Distance mer × FE maritime × Coeff. détour\n           = ${i.poidsLot} × ${i.distanceMer} × 0.000015 × 1.15`,
        result: r.scope3Mer.toFixed(4) + " t CO2e",
      },
      {
        title: "Agrégation du bilan MACF",
        desc: "Somme de la fabrication et de la logistique pour obtenir le bilan global du lot et son intensité carbone finale.",
        formula: `Bilan global = Sous-total Fabrication + Sous-total Logistique\nIntensité globale = Bilan global / Poids du lot`,
        result: r.bilanGlobal.toFixed(4) + " t CO2e  ·  " + r.intensiteGlobale.toFixed(4) + " t/t",
        final: true,
      },
    ];

    document.getElementById("calc-steps").innerHTML = steps.map((s, idx) => `
      <div class="step-card">
        <div class="step-marker">
          <div class="step-num ${s.final ? "done" : ""}">${s.final ? "✓" : idx + 1}</div>
          <div class="step-line"></div>
        </div>
        <div class="step-body">
          <div class="step-title-row">
            <div class="step-title">${s.title}</div>
          </div>
          <div class="step-desc">${s.desc}</div>
          <div class="formula-box"><span class="fx-label">Formule appliquée</span>${escapeHtml(s.formula)}</div>
          <div class="step-result-chip"><span class="icon" data-icon="check"></span> Résultat : <span class="val">${s.result}</span></div>
        </div>
      </div>`).join("");
    hydrateIcons(document.getElementById("calc-steps"));
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------------------------------------------------------------------
     RESULTATS
  --------------------------------------------------------------------- */
  function renderResultats() {
    const r = DEMO.resultats;

    const kpis = [
      { icon: "cloud", cls: "navy", lbl: "Total CO₂e émis", val: r.bilanGlobal.toFixed(3) + " t" },
      { icon: "leaf", cls: "green", lbl: "Intensité carbone", val: r.intensiteGlobale.toFixed(4) + " t/t" },
      { icon: "factory", cls: "blue", lbl: "Scope 1 — Direct", val: r.scope1.toFixed(4) + " t" },
      { icon: "scale", cls: "amber", lbl: "Scope 2 — Énergie", val: r.scope2.toFixed(4) + " t" },
    ];
    document.getElementById("results-kpis").innerHTML = kpis.map(kpiCard).join("");
    hydrateIcons(document.getElementById("results-kpis"));

    renderDonut(document.getElementById("donut-chart"), [
      { label: "Scope 1 — Gaz naturel", value: r.scope1, color: "#0B3D5C" },
      { label: "Scope 2 — Électricité", value: r.scope2, color: "#1C7FD1" },
      { label: "Scope 3 — Transport", value: r.sousTotalLogistique, color: "#1CB37F" },
    ]);

    const total = r.bilanGlobal;
    const fab = r.sousTotalFabrication, log = r.sousTotalLogistique;
    document.getElementById("scope-breakdown").innerHTML = `
      <div class="scope-row">
        <div class="sc-icon kpi-icon navy" data-icon="factory"></div>
        <div class="sc-body">
          <div class="sc-top"><span>Fabrication (Scope 1+2)</span><span class="mono">${fab.toFixed(4)} t</span></div>
          <div class="sc-bar-track"><div class="sc-bar-fill" style="width:${(fab/total*100).toFixed(1)}%; background:#0B3D5C;"></div></div>
        </div>
      </div>
      <div class="scope-row">
        <div class="sc-icon kpi-icon green" data-icon="ship"></div>
        <div class="sc-body">
          <div class="sc-top"><span>Logistique (Scope 3)</span><span class="mono">${log.toFixed(4)} t</span></div>
          <div class="sc-bar-track"><div class="sc-bar-fill" style="width:${(log/total*100).toFixed(1)}%; background:#1CB37F;"></div></div>
        </div>
      </div>
      <div style="margin-top:6px; padding-top:14px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; font-size:12.5px; color:var(--slate); font-weight:700;">
        <span>Intensité fabrication</span><span class="mono" style="color:var(--navy-deep);">${r.intensiteFabrication.toFixed(4)} t/t</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12.5px; color:var(--slate); font-weight:700;">
        <span>Intensité transport</span><span class="mono" style="color:var(--navy-deep);">${r.intensiteTransport.toFixed(4)} t/t</span>
      </div>`;
    hydrateIcons(document.getElementById("scope-breakdown"));

    renderBarChart(document.getElementById("bar-chart"), [
      { label: "Transport routier — usine → port (120 km)", value: r.scope3Route, color: "#1568A8" },
      { label: "Transport maritime — port → Europe (1500 km)", value: r.scope3Mer, color: "#14976B" },
    ]);
  }

  /* ---------------------------------------------------------------------
     RAPPORT
  --------------------------------------------------------------------- */
  function renderRapport() {
    const rp = DEMO.rapport, r = DEMO.resultats, m = DEMO.meta;
    document.getElementById("report-doc").innerHTML = `
      <div class="report-header">
        <div>
          <div class="rh-title">Rapport de déclaration carbone — Conformité MACF</div>
          <div class="rh-meta">
            Référence : ${m.reference}<br>
            Généré le ${m.dateCalcul} par ${m.utilisateur}
          </div>
        </div>
        <div class="rh-logo">
          <div class="rl-name">PortNet</div>
          <div class="rl-sub">Module Empreinte Carbone MACF</div>
        </div>
      </div>

      <div class="report-body">
        <div class="report-section">
          <h3>Résumé</h3>
          <p class="report-summary">
            Le lot exporté par <b>${m.entreprise}</b> (${rp.produit}, code SH <b>${rp.hsCode}</b>), d'une masse nette de
            <b>${rp.masse}</b> à destination de <b>${rp.destination}</b>, présente une empreinte carbone totale de
            <b>${rp.empreinteTotale}</b>, calculée selon la méthode « ${rp.methode} » conformément au Règlement UE 2023/956
            et à la norme ISO 14083:2023.
          </p>
        </div>

        <div class="report-section">
          <h3>Détails du calcul</h3>
          <div class="table-wrap">
            <table class="data-table">
              <tbody>
                <tr><td>Émissions de fabrication (Scope 1+2)</td><td class="mono">${rp.emissionsFabrication}</td></tr>
                <tr><td>Émissions de transport (Scope 3)</td><td class="mono">${rp.emissionsTransport}</td></tr>
                <tr><td>Empreinte carbone totale du lot</td><td class="mono">${rp.empreinteTotale}</td></tr>
                <tr><td>Intensité carbone (MACF)</td><td class="mono">${rp.intensiteCarbone}</td></tr>
                <tr><td>Méthode utilisée</td><td>${rp.methode}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="report-section">
          <h3>Indicateurs clés</h3>
          <div class="indicator-grid">
            <div class="indicator-cell"><div class="ic-lbl">Scope 1</div><div class="ic-val">${r.scope1.toFixed(3)} t</div></div>
            <div class="indicator-cell"><div class="ic-lbl">Scope 2</div><div class="ic-val">${r.scope2.toFixed(3)} t</div></div>
            <div class="indicator-cell"><div class="ic-lbl">Scope 3</div><div class="ic-val">${r.sousTotalLogistique.toFixed(3)} t</div></div>
            <div class="indicator-cell"><div class="ic-lbl">Intensité globale</div><div class="ic-val">${r.intensiteGlobale.toFixed(4)} t/t</div></div>
          </div>
        </div>

        <div class="report-section">
          <h3>Statut de la déclaration</h3>
          <span class="status-pill"><span class="icon" data-icon="check"></span> ${rp.statut}</span>
        </div>
      </div>

      <div class="report-footer">
        <span class="rf-note">Document généré automatiquement par PortNet — prototype d'interface, données d'exemple à des fins de démonstration académique (PFE).</span>
        <span class="rf-note">Page 1/1</span>
      </div>`;
    hydrateIcons(document.getElementById("report-doc"));
  }

  /* ---------------------------------------------------------------------
     FORM INTERACTIONS
  --------------------------------------------------------------------- */
  function initForm() {
    const toggle = document.getElementById("f-real-toggle");
    const block = document.getElementById("real-data-block");

    function syncReveal() {
      block.classList.toggle("collapsed", !toggle.checked);
    }
    toggle.addEventListener("change", syncReveal);
    syncReveal();

    document.getElementById("calc-form").addEventListener("submit", e => {
      e.preventDefault();
      toast("Calcul lancé avec succès — redirection vers le moteur de calcul…", "check");
      setTimeout(() => { location.hash = "#calcul"; }, 700);
    });

    // Product -> HS code auto mapping (demo)
    const productMap = {
      "Engrais azoté — Nitrate d'ammonium": { hs: "3102", fe: "2.56" },
      "Ciment Portland": { hs: "2523", fe: "1.49" },
      "Produits laminés (fer & acier)": { hs: "7208", fe: "1.894" },
      "Aluminium brut": { hs: "7601", fe: "0.396" },
      "Hydrogène": { hs: "2804", fe: "11.92" },
    };
    document.getElementById("f-product").addEventListener("change", e => {
      const m = productMap[e.target.value];
      if (m) {
        document.getElementById("f-hs").value = m.hs;
        document.getElementById("f-fe-prod").value = m.fe;
        toast("Facteurs d'émission mis à jour depuis le référentiel", "database");
      }
    });
  }

  /* ---------------------------------------------------------------------
     REFERENTIELS TABS
  --------------------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll("#ref-tabs .tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#ref-tabs .tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
      });
    });
  }

  /* ---------------------------------------------------------------------
     MOBILE SIDEBAR
  --------------------------------------------------------------------- */
  function initSidebarToggle() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    document.getElementById("hamburger").addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("show");
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }

  /* ---------------------------------------------------------------------
     REPORT ACTIONS
  --------------------------------------------------------------------- */
  function initReportActions() {
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
      toast("Génération du PDF en cours…", "download");
      setTimeout(() => window.print(), 500);
    });
    document.getElementById("btn-share").addEventListener("click", () => {
      toast("Lien de partage copié dans le presse-papiers", "check");
    });
  }

  /* ---------------------------------------------------------------------
     INIT
  --------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    hydrateIcons();
    renderJourney();
    renderHomeKPIs();
    renderNavCards();
    renderReferentiels();
    renderCalcSteps();
    renderResultats();
    renderRapport();

    initForm();
    initTabs();
    initSidebarToggle();
    initReportActions();

    window.addEventListener("hashchange", handleHash);
    handleHash();

    setTimeout(() => toast("Bienvenue sur le module Empreinte Carbone MACF", "leaf"), 500);
  });
})();
