/* =========================================================================
   PortNet – Module Empreinte Carbone MACF
   charts.js — Générateurs de graphiques SVG (sans librairie externe)
   ========================================================================= */

/**
 * Donut chart. data: [{label, value, color}]
 */
function renderDonut(container, data, opts = {}) {
  const size = opts.size || 220;
  const stroke = opts.stroke || 26;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);

  let offset = 0;
  let segments = "";
  data.forEach(d => {
    const frac = total ? d.value / total : 0;
    const len = frac * circumference;
    const gap = circumference - len;
    segments += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}"
      stroke-width="${stroke}" stroke-dasharray="${len} ${gap}"
      stroke-dashoffset="${-offset}" stroke-linecap="butt"
      transform="rotate(-90 ${cx} ${cy})" style="transition: stroke-dasharray .6s ease;"/>`;
    offset += len;
  });

  const svg = `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block;margin:0 auto;">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EFF4F7" stroke-width="${stroke}"/>
      ${segments}
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="22" font-weight="600" fill="#0B3D5C">${total.toFixed(2)}</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#64798A">t CO2e total</text>
    </svg>`;

  const legend = `
    <div class="legend">
      ${data.map(d => `
        <div class="legend-item">
          <span class="legend-swatch" style="background:${d.color}"></span>
          <span class="li-label">${d.label}</span>
          <span class="li-val">${d.value.toFixed(4)} t</span>
        </div>`).join("")}
    </div>`;

  container.innerHTML = svg + legend;
}

/**
 * Simple horizontal bar chart. data: [{label, value, color, unit}]
 */
function renderBarChart(container, data, opts = {}) {
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const rows = data.map(d => {
    const pct = max ? (d.value / max) * 100 : 0;
    return `
      <div style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:700; color:#3C4E5C; margin-bottom:7px;">
          <span>${d.label}</span>
          <span style="font-family:'IBM Plex Mono',monospace; color:#0B3D5C;">${d.value.toFixed(4)} ${d.unit || "t CO2e"}</span>
        </div>
        <div style="height:14px; border-radius:7px; background:#EFF4F7; overflow:hidden;">
          <div style="height:100%; width:${pct}%; border-radius:7px; background:${d.color}; transition: width .7s ease;"></div>
        </div>
      </div>`;
  }).join("");
  container.innerHTML = rows;
}
