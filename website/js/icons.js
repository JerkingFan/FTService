/** SVG-иконки Bazardrom (нарисованы под стиль сайта) */
function icon(name, className = "icon") {
  const svg = ICONS[name];
  if (!svg) return "";
  return `<span class="${className}" aria-hidden="true">${svg}</span>`;
}

const ICONS = {
  engine: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="14" width="32" height="22" rx="3" stroke="currentColor" stroke-width="2.2"/><path d="M14 14V10a10 10 0 0120 0v4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="38" r="4" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="38" r="4" stroke="currentColor" stroke-width="2"/><path d="M20 22h8M24 18v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  electrical: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28 6L14 26h10l-4 16 18-24H28l4-12z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" fill="currentColor" fill-opacity=".12"/></svg>`,

  body: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 30h32l-3-10a6 6 0 00-5.5-4H16.5a6 6 0 00-5.5 4L8 30z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 30l2-8h20l2 8" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="32" r="3" fill="currentColor"/><circle cx="33" cy="32" r="3" fill="currentColor"/><path d="M18 18c0-4 3-7 6-7s6 3 6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  brakes: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="14" stroke="currentColor" stroke-width="2.2"/><circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="2"/><path d="M24 10v4M24 34v4M10 24h4M34 24h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  suspension: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 8v32M32 8v32" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 14h8M28 14h8M10 24h10M28 24h10M12 34h8M28 34h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  cooling: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="12" width="28" height="24" rx="2" stroke="currentColor" stroke-width="2.2"/><path d="M16 12V8h16v4M14 20h4M22 20h4M30 20h4M14 28h4M22 28h4M30 28h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M34 18l4-2v16l-4-2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,

  transmission: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="24" r="10" stroke="currentColor" stroke-width="2.2"/><circle cx="32" cy="24" r="7" stroke="currentColor" stroke-width="2.2"/><path d="M28 24H22" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="24" r="3" fill="currentColor" fill-opacity=".3"/><circle cx="32" cy="24" r="2" fill="currentColor" fill-opacity=".3"/></svg>`,

  interior: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 22c0-6 6-10 14-10s14 4 14 10v14H10V22z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 28h20M16 22h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  part: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 20l10-8 10 8v16H14V20z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="28" r="5" stroke="currentColor" stroke-width="2"/></svg>`,

  wrench: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 34l12-12 4 4-12 12-6-4z" fill="currentColor" fill-opacity=".15"/><path d="M28 12a8 8 0 015.7 13.7L22 37l-5-5 11.7-11.7A8 8 0 0128 12z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,

  star: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 6l5.5 11.2 12.3 1.8-8.9 8.7 2.1 12.2L24 33.8l-10.9 5.7 2.1-12.2-8.9-8.7 12.3-1.8L24 6z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,

  pin: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 42s12-10 12-20a12 12 0 10-24 0c0 10 12 20 12 20z" stroke="currentColor" stroke-width="2.2"/><circle cx="24" cy="20" r="4" fill="currentColor" fill-opacity=".25"/></svg>`,

  return: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 10H14v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 22c6 8 14 12 24 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,

  shield: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 6L10 12v10c0 10 6 16 14 20 8-4 14-10 14-20V12L24 6z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M18 24l4 4 8-8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  camera: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="14" width="32" height="24" rx="4" stroke="currentColor" stroke-width="2.2"/><circle cx="24" cy="26" r="7" stroke="currentColor" stroke-width="2"/><path d="M18 14l2-4h8l2 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  price: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2.2"/><path d="M24 14v4M20 30h8a4 4 0 000-8h-4a4 4 0 010-8h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  chat: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 10h28v20H18l-8 8V10z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M18 20h12M18 26h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  calendar: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="32" height="30" rx="3" stroke="currentColor" stroke-width="2.2"/><path d="M8 18h32M16 6v8M32 6v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="16" y="24" width="6" height="6" rx="1" fill="currentColor" fill-opacity=".3"/></svg>`,

  diagnostic: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="10" width="36" height="26" rx="3" stroke="currentColor" stroke-width="2.2"/><path d="M14 34h20" stroke="currentColor" stroke-width="2"/><path d="M20 22l4 4 8-10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  buyer: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="16" r="6" stroke="currentColor" stroke-width="2.2"/><path d="M10 38c0-8 5-12 10-12s10 4 10 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M30 22h12v20H30V22z" stroke="currentColor" stroke-width="2.2"/><path d="M34 28h4M34 34h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  seller: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 16l16-8 16 8v24H8V16z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M18 28h12M18 34h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="20" y="20" width="8" height="6" rx="1" stroke="currentColor" stroke-width="2"/></svg>`,

  master: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="14" r="6" stroke="currentColor" stroke-width="2.2"/><path d="M12 40c0-8 5-12 12-12s12 4 12 12" stroke="currentColor" stroke-width="2.2"/><path d="M32 20l6-4v12l-6-4" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="2"/></svg>`,

  truck: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 20h22v14H6V20zM28 24h8l6 6v4H28V24z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="14" cy="36" r="3" fill="currentColor"/><circle cx="36" cy="36" r="3" fill="currentColor"/></svg>`,

  search: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="12" stroke="currentColor" stroke-width="2.5"/><path d="M32 32l10 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,

  logo: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 32l8-18h8l4 10 4-10h8l8 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 32h20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,

  heroCar: `<svg class="hero-car" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M40 120h240l-18-48a28 28 0 00-26-18H84a28 28 0 00-26 18L40 120z" fill="#fff" stroke="#e8640a" stroke-width="3"/><path d="M70 54h36l12 20H58L70 54z" fill="#fff4ed" stroke="#e8640a" stroke-width="2"/><circle cx="90" cy="128" r="18" fill="#fff" stroke="#2d2d2d" stroke-width="3"/><circle cx="90" cy="128" r="8" fill="#e8640a"/><circle cx="230" cy="128" r="18" fill="#fff" stroke="#2d2d2d" stroke-width="3"/><circle cx="230" cy="128" r="8" fill="#e8640a"/><path d="M120 90h100" stroke="#e8640a" stroke-width="2" stroke-linecap="round" stroke-dasharray="6 6"/><rect x="130" y="72" width="40" height="24" rx="4" fill="#e8640a" fill-opacity=".15" stroke="#e8640a" stroke-width="2"/><path d="M250 100l24 8v16h-24v-24z" fill="#fff4ed" stroke="#e8640a" stroke-width="2"/></svg>`,
};

function heroIllustration() {
  return '<div class="hero-illus">' + ICONS.heroCar + '</div>';
}

const CATEGORY_ICON = {
  engine: "engine",
  electrical: "electrical",
  body: "body",
  brakes: "brakes",
  suspension: "suspension",
  cooling: "cooling",
  transmission: "transmission",
  interior: "interior",
};

function categoryIcon(id, className = "icon icon--lg") {
  return icon(CATEGORY_ICON[id] || "part", className);
}
