"use strict";

/* ===== Constants ===== */
const APP_VERSION = "1.04";
const SCHEMA = 5;
const APP_DATA_KEY = "myLedgerAppData";
const RATE_KEY = "myLedger.rates.v1";
const RATE_URL = "https://open.er-api.com/v6/latest/SGD";
const RATE_URL_2 = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-exchange-api@latest/v1/currencies/sgd.json";
const BUILTIN_DATE = "2026-11-01";
/* Approximate reference rates (1 SGD = x). Only a safety net: replaced by live rates, and records saved with them are re-calculated. */
const BUILTIN_RATES = { SGD: 1, USD: 0.77, EUR: 0.66, GBP: 0.58, JPY: 118, CNY: 5.5, HKD: 6, MYR: 3.3, AUD: 1.18, CAD: 1.08, CHF: 0.62, NZD: 1.33, KRW: 1100, THB: 25, IDR: 12700, INR: 68, TWD: 24, PHP: 45, VND: 20000, AED: 2.83, SAR: 2.89, BND: 1, MOP: 6.2, BRL: 4.1, MXN: 14, ZAR: 14, SEK: 7.3, NOK: 7.7, DKK: 4.9, TRY: 33 };
const DAY_MS = 864e5;
const isEstRate = (code) => !(rates.real && rates.real[code] > 0);
const BASE = "SGD";
const GEN = "GEN";
const MASK = "••••";
const DEFAULT_CURRENCIES = [
  { id: "cur-sgd", code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { id: "cur-myr", code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { id: "cur-usd", code: "USD", symbol: "$", name: "US Dollar" },
  { id: "cur-cny", code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { id: "cur-gen", code: GEN, symbol: "$", name: "Generic (no conversion)", generic: true }
];
const DEFAULT_CATEGORIES = [
  { id: "cat-food", kind: "expense", name: "Food & Drink", icon: "🍽️", color: "#f97316", tags: ["Breakfast", "Lunch", "Dinner", "Snacks", "Coffee"] },
  { id: "cat-shopping", kind: "expense", name: "Shopping", icon: "🛍️", color: "#ec4899", tags: ["Household", "Accessories", "Digital", "Clothing"] },
  { id: "cat-transport", kind: "expense", name: "Transportation", icon: "🚌", color: "#3b82f6", tags: ["Public", "Taxi", "Fuel", "Parking"] },
  { id: "cat-housing", kind: "expense", name: "Housing", icon: "🏠", color: "#a16207", tags: ["Rent", "Utilities", "Maintenance"] },
  { id: "cat-salary", kind: "income", name: "Salary", icon: "💵", color: "#22c55e", tags: ["Monthly", "Bonus"] },
  { id: "cat-invest", kind: "income", name: "Investment", icon: "📈", color: "#14b8a6", tags: ["Dividend", "Interest"] }
];
const ACCENTS = ["#3478F6", "#0A84FF", "#2563EB", "#5AC8FA", "#22D3EE", "#06B6D4", "#00C7BE", "#14B8A6", "#10B981", "#34D399", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF"];
const PALETTE = ["#3478F6", "#0A84FF", "#5AC8FA", "#32ADE6", "#00C7BE", "#30B0C7", "#34C759", "#30D158", "#A3D977", "#FFD60A", "#eab308", "#FF9F0A",
  "#FF9500", "#FF6B35", "#FF3B30", "#FF2D55", "#EC4899", "#BF5AF2", "#AF52DE", "#5856D6", "#6366F1", "#8E8E93", "#64748B", "#A2845E", "#0F766E", "#15803D", "#B91C1C", "#1E293B"];
const SKINS_COOL = [["classic", "#e5e5ea"], ["ocean", "#0ea5e9"], ["forest", "#22c55e"], ["sky", "#38bdf8"], ["lavender", "#8b5cf6"], ["slate", "#64748b"], ["ice", "#22d3ee"]];
const SKINS_WARM = [["sand", "#eab308"], ["peach", "#fb923c"], ["rose", "#f43f5e"], ["coral", "#f87171"], ["cream", "#d6a96a"], ["amber", "#f59e0b"]];
const SKINS = SKINS_COOL.concat(SKINS_WARM);
const ICONS = ["🍽️", "🛍️", "🚌", "🏠", "💵", "☕", "🍔", "🛒", "🎮", "🎬", "✈️", "🏥", "💊", "📚", "🎁", "👕", "💡", "📱", "🚗", "⛽", "🐶", "💼", "🏋️", "🎓", "🧾", "💳", "🏦", "🛠️", "🎵", "📈", "🏷️", "🎂"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const KINDS = ["recurring", "subscription", "installment"];
const FREQS = ["daily", "weekly", "monthly", "yearly"];
const FREQ_LABEL = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
const FREQ_UNIT = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };

/* ===== Utils ===== */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const makeId = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, "0");
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const dim = (y, m) => new Date(y, m, 0).getDate();
const todayStr = () => { const d = new Date(); return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate()); };
const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const parseYMD = (s) => { const [y, m, d] = s.split("-").map(Number); return { y, m, d }; };
const isYMD = (s) => { if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const { y, m, d } = parseYMD(s); return m >= 1 && m <= 12 && d >= 1 && d <= dim(y, m); };
const addMonths = (y, m, k) => { const t = y * 12 + (m - 1) + k; return { y: Math.floor(t / 12), m: (t % 12) + 1 }; };
const mkOf = (s) => s.slice(0, 7);
const addDays = (s, n) => { const { y, m, d } = parseYMD(s); const dt = new Date(y, m - 1, d + n); return ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()); };
const toNum = (v) => (v === null || v === undefined || v === "" || typeof v === "boolean" || !Number.isFinite(Number(v))) ? null : Number(v);
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const fmtNum = (x) => Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (x) => { const a = Math.abs(x); return a >= 1e6 ? (x / 1e6).toFixed(1) + "M" : a >= 1e4 ? (x / 1e3).toFixed(1) + "k" : a >= 1000 ? Math.round(x) + "" : a === 0 ? "0" : String(round2(x)); };
const monthLabel = (y, m) => MONTHS[m - 1] + " " + y;
const safeSymbol = (s) => String(s ?? "").replace(/[<>"'&]/g, "").slice(0, 4);
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : "#8e8e93");
const clone = (o) => JSON.parse(JSON.stringify(o));
function fmtDate(s) {
  if (!isYMD(s)) return "—";
  const { y, m, d } = parseYMD(s), f = state.settings.dateFormat;
  return f === "YYYY-MM-DD" ? s : f === "MM/DD/YYYY" ? `${pad(m)}/${pad(d)}/${y}` : `${pad(d)}/${pad(m)}/${y}`;
}

/* ===== State ===== */
let state = null;
let recoveryMode = false;
let rawCorrupt = null;
let rates = { base: BASE, rates: { ...BUILTIN_RATES }, real: {}, date: BUILTIN_DATE, source: "builtin", fetchedAt: 0 };
const ui = { tab: "home", pages: [], homeMonth: null, detailsMonth: null, statsMonth: null, homeScope: "month", statsScope: "month", view: "list", type: "all",
  search: "", from: "", to: "", fCat: "", fTag: "", catFilter: "expense", catEdit: false, homeEdit: false, ruleFilter: "active" };

function defaultSettings() {
  return { defaultCurrencyId: "cur-sgd", dateFormat: "DD/MM/YYYY", timeFormat: "24", appearanceMode: "system", skinColor: "classic", themeColor: "#3478F6",
    hideIncome: false, removedCurrencies: [], userName: "Alex", userId: "", userAvatar: "", fontSize: "medium", fontFormat: "system", monthlyBudget: 1000,
    homeExpanded: { expense: true, income: false }, lock: { enabled: false, salt: "", hash: "", recSalt: "", recHash: "" } };
}
function createDefaultState() {
  return { version: APP_VERSION, schema: SCHEMA, categories: normalizeCategories(clone(DEFAULT_CATEGORIES)), currencies: clone(DEFAULT_CURRENCIES), records: [], recurringRules: [], quickTemplates: [], quarantine: [], settings: defaultSettings() };
}
function normalizeCategories(list) {
  const seen = new Set();
  return list.filter((c) => c && c.id && !seen.has(String(c.id)) && seen.add(String(c.id))).map((c, i) => {
    const names = new Set(), tags = [];
    (Array.isArray(c.tags) ? c.tags : []).forEach((t, j) => {
      const o = typeof t === "string" ? { name: t } : (t && typeof t === "object" ? t : null);
      const name = o ? String(o.name ?? "").trim() : "";
      if (!name || names.has(name.toLowerCase())) return;
      names.add(name.toLowerCase());
      tags.push({ id: o.id || makeId("tag"), name, order: toNum(o.order) ?? j, archived: !!o.archived });
    });
    return { id: String(c.id), kind: c.kind === "income" || c.kind === "expense" ? c.kind : null, name: String(c.name ?? "Untitled"), icon: c.icon || "🏷️", color: c.color || "#3478F6", order: toNum(c.order) ?? i, archived: !!c.archived, tags };
  });
}
/* Category kind (Expense/Income) for legacy data: Salary is income, otherwise inferred from the records already filed under it. */
function inferKinds(cats, records) {
  cats.forEach((c) => {
    if (c.kind) return;
    if (c.id === "cat-salary") { c.kind = "income"; return; }
    let inc = 0, exp = 0;
    records.forEach((r) => { if (r.categoryId === c.id && !r.isRefund) { if (r.type === "income") inc++; else exp++; } });
    c.kind = inc > exp ? "income" : "expense";
  });
}

/* Non-destructive normalization: repairs fields, never drops a record (invalid ones are quarantined). */
function normalizeState(data) {
  const out = createDefaultState();
  if (!data || typeof data !== "object") return out;
  const sIn = data.settings && typeof data.settings === "object" ? data.settings : {};
  out.settings = { ...out.settings, ...sIn };
  if (!["system", "light", "dark"].includes(out.settings.appearanceMode)) out.settings.appearanceMode = "system";
  if (!SKINS.some((s) => s[0] === out.settings.skinColor)) out.settings.skinColor = "classic";
  if (!/^#[0-9a-f]{6}$/i.test(out.settings.themeColor || "")) out.settings.themeColor = "#3478F6";
  if (!["small", "medium", "large"].includes(out.settings.fontSize)) out.settings.fontSize = "medium";
  if (!["system", "rounded", "serif", "mono", "script"].includes(out.settings.fontFormat)) out.settings.fontFormat = "system";
  const he = out.settings.homeExpanded; out.settings.homeExpanded = { expense: !(he && he.expense === false), income: !!(he && he.income) };
  const lk = out.settings.lock; out.settings.lock = { enabled: !!(lk && lk.enabled && lk.hash), salt: String(lk?.salt || ""), hash: String(lk?.hash || ""), recSalt: String(lk?.recSalt || ""), recHash: String(lk?.recHash || "") };
  out.settings.userName = String(out.settings.userName || "Alex").slice(0, 20); out.settings.userId = String(out.settings.userId || "").slice(0, 24);
  out.quarantine = Array.isArray(data.quarantine) ? data.quarantine.slice() : [];
  const rem = Array.isArray(out.settings.removedCurrencies) ? out.settings.removedCurrencies.filter((x) => typeof x === "string") : []; out.settings.removedCurrencies = rem;
  out.currencies = out.currencies.filter((c) => !rem.includes(c.code));
  if (!out.currencies.some((c) => c.id === out.settings.defaultCurrencyId)) out.settings.defaultCurrencyId = out.currencies.find((c) => !c.generic)?.id || "";
  if (Array.isArray(data.currencies)) {
    const extra = data.currencies.filter((c) => c && /^[A-Z]{3}$/.test(c.code || "") && !rem.includes(c.code) && !out.currencies.some((d) => d.code === c.code))
      .map((c) => ({ id: c.id || makeId("cur"), code: c.code, symbol: safeSymbol(c.symbol) || c.code, name: String(c.name || c.code).slice(0, 30), custom: true }));
    data.currencies.forEach((c) => { const d = out.currencies.find((x) => c && x.code === c.code); if (d && c.symbol) d.symbol = safeSymbol(c.symbol) || d.symbol; });
    out.currencies = out.currencies.concat(extra);
  }
  if (Array.isArray(data.categories)) out.categories = normalizeCategories(data.categories);
  const ids = new Set(), records = [];
  (Array.isArray(data.records) ? data.records : []).forEach((r) => {
    if (!r || typeof r !== "object") { out.quarantine.push({ reason: "not an object", raw: r }); return; }
    const amount = toNum(r.amount);
    if (amount === null || amount < 0 || !isYMD(r.date)) { out.quarantine.push({ reason: amount === null || amount < 0 ? "invalid amount" : "invalid date", raw: r }); return; }
    let id = String(r.id ?? ""); if (!id || ids.has(id)) id = makeId("rec"); ids.add(id);
    const code = /^[A-Z]{3}$/.test(r.currencyCode || "") ? r.currencyCode : BASE;
    let base = toNum(r.baseAmount);
    if (base === null || (base === 0 && amount > 0)) base = code === BASE ? amount : null; /* never turn null into 0 */
    const cat = out.categories.find((c) => c.id === r.categoryId);
    const isRefund = !!r.isRefund || !!r.originalRecordId, tag = String(r.tag ?? "");
    records.push({ ...r, id, type: isRefund || r.type === "income" ? "income" : "expense", amount, baseAmount: base, currencyCode: code,
      currencySymbol: safeSymbol(r.currencySymbol) || (out.currencies.find((c) => c.code === code)?.symbol || code), exchangeRate: toNum(r.exchangeRate),
      date: r.date, time: /^\d{2}:\d{2}$/.test(r.time || "") ? r.time : "00:00", note: String(r.note ?? ""),
      categoryNameSnapshot: r.categoryNameSnapshot || cat?.name || "Unassigned", tag, tagNameSnapshot: r.tagNameSnapshot || tag,
      tagId: r.tagId || cat?.tags.find((t) => t.name === tag)?.id || null, isRefund, originalRecordId: r.originalRecordId || null });
  });
  out.records = records;
  inferKinds(out.categories, records);
  out.recurringRules = (Array.isArray(data.recurringRules) ? data.recurringRules : []).filter((r) => r && r.id).map((r, i) => {
    const kind = KINDS.includes(r.kind) ? r.kind : KINDS.includes(r.ruleType) ? r.ruleType : "recurring", freq = FREQS.includes(r.freq) ? r.freq : "monthly";
    const gen = new Set(Array.isArray(r.generatedMonths) ? r.generatedMonths : []);
    records.forEach((x) => { if (x.recurringRuleId === r.id) gen.add(x.ruleKey || (freq === "monthly" ? mkOf(x.date) : x.date)); }); /* marker rebuild: prevents duplicates */
    return { ...r, id: String(r.id), kind, freq, interval: Math.max(1, Math.min(99, Math.floor(toNum(r.interval) || 1))), installmentTotal: kind === "installment" ? Math.max(1, Math.floor(toNum(r.installmentTotal) || 12)) : null,
      type: r.type === "income" ? "income" : "expense", amount: toNum(r.amount) ?? 0, currencyCode: r.currencyCode || BASE,
      tag: String(r.tag ?? ""), tagId: r.tagId || null, note: String(r.note ?? ""), endDate: r.endDate || "", active: r.active !== false, archived: !!r.archived,
      generatedMonths: [...gen].sort(), history: Array.isArray(r.history) ? r.history : [], overrides: r.overrides && typeof r.overrides === "object" ? r.overrides : {},
      pausedRanges: Array.isArray(r.pausedRanges) ? r.pausedRanges : [], order: toNum(r.order) ?? i, ruleType: kind };
  });
  out.quickTemplates = (Array.isArray(data.quickTemplates) ? data.quickTemplates : []).filter((t) => t && t.id)
    .map((t) => ({ ...t, label: String(t.label ?? "Template"), type: t.type === "income" ? "income" : "expense", currencyCode: t.currencyCode || BASE, tag: String(t.tag ?? ""), note: String(t.note ?? "") }));
  out.version = APP_VERSION; out.schema = SCHEMA;
  return out;
}

function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(APP_DATA_KEY); } catch (e) { raw = null; }
  if (raw === null) return createDefaultState();
  let data;
  try { data = JSON.parse(raw); } catch (e) {
    recoveryMode = true; rawCorrupt = raw;
    try { localStorage.setItem(APP_DATA_KEY + "_corrupt_" + Date.now(), raw); } catch (e2) { /* ignore */ }
    return createDefaultState();
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) { recoveryMode = true; rawCorrupt = raw; return createDefaultState(); }
  if (data.schema !== SCHEMA) { try { localStorage.setItem(APP_DATA_KEY + "_premigrate_" + (data.schema || "v" + data.version), raw); } catch (e) { /* ignore */ } }
  return normalizeState(data);
}
function saveState() {
  if (recoveryMode) { toast("Read-only recovery mode. Export raw data first."); return false; }
  try { localStorage.setItem(APP_DATA_KEY, JSON.stringify(state)); cloudQueue(); return true; } catch (e) { console.error(e); return false; }
}
/* ===== Cloud copy (artifact db capability; private per viewer, silently absent when unavailable) ===== */
const cloud = { col: null, timer: null, last: "", busy: false };
const CLOUD_CHUNK = 180000;
function cloudQueue() { if (!cloud.col || recoveryMode) return; clearTimeout(cloud.timer); cloud.timer = setTimeout(cloudPush, 1500); }
async function cloudPush() {
  if (!cloud.col || cloud.busy) return; cloud.busy = true;
  try {
    const raw = JSON.stringify(state), parts = []; for (let i = 0; i < raw.length; i += CLOUD_CHUNK) parts.push(raw.slice(i, i + CLOUD_CHUNK));
    for (let i = 0; i < parts.length; i++) await cloud.col.doc("ledger_" + i).set({ s: parts[i] });
    await cloud.col.doc("ledger_meta").set({ n: parts.length, at: new Date().toISOString(), records: state.records.length });
    cloud.last = new Date().toISOString(); if (state && ui.pages) renderSettings();
  } catch (e) { console.error("cloud push", e); }
  cloud.busy = false;
}
async function cloudPull() {
  const meta = await cloud.col.doc("ledger_meta").get(); if (!meta.exists) return null;
  const m = meta.data(); let raw = "";
  for (let i = 0; i < m.n; i++) { const d = await cloud.col.doc("ledger_" + i).get(); if (!d.exists) return null; raw += d.data().s; }
  return { raw, at: m.at, records: m.records };
}
async function cloudInit() {
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]); if (!db || !user) return;
    cloud.col = db.collection("data/users/" + (await user.id()));
    const empty = !state.records.length && !state.recurringRules.length;
    if (empty && !recoveryMode) { const c = await cloudPull(); if (c) { applyCloud(c); toast(`Restored ${c.records} record(s) from your cloud copy`); return; } }
    const meta = await cloud.col.doc("ledger_meta").get(); if (meta.exists) cloud.last = meta.data().at;
    if (!empty) cloudPush(); else renderSettings();
  } catch (e) { console.error("cloud init", e); }
}
function applyCloud(c) {
  try { state = normalizeState(JSON.parse(c.raw)); cloud.last = c.at; saveState(); runReconcile(); applyTheme(); renderAll(); } catch (e) { toast("Cloud copy could not be read."); }
}
function commit(fn) {
  const snap = JSON.stringify(state);
  try { fn(); if (!saveState()) throw new Error("save failed"); return true; }
  catch (e) { state = JSON.parse(snap); toast("Could not save. Change rolled back."); console.error(e); return false; }
}

/* ===== Rates / currency ===== */
function loadRatesCache() {
  try {
    const c = JSON.parse(localStorage.getItem(RATE_KEY));
    if (c && c.rates && typeof c.rates === "object" && Number(c.rates[BASE]) === 1 && c.source !== "builtin") rates = { base: BASE, rates: { ...BUILTIN_RATES, ...c.rates }, real: c.rates, date: String(c.date || "cached"), source: "cache", fetchedAt: Number(c.fetchedAt) || 0 };
  } catch (e) { /* ignore corrupt cache */ }
}
async function getJson(url) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 8000);
  try { const res = await fetch(url, { signal: ctl.signal }); if (!res.ok) throw new Error("http " + res.status); return await res.json(); } finally { clearTimeout(timer); }
}
async function fetchRates(force) {
  const stale = !rates.fetchedAt || Date.now() - rates.fetchedAt > DAY_MS - 36e5 || rates.source === "builtin";
  if (!force && !stale) return;
  let got = null;
  try { const j = await getJson(RATE_URL); if (j && j.rates && Number(j.rates[BASE]) === 1) got = { rates: j.rates, date: String(j.time_last_update_utc || "").slice(5, 16) || todayStr(), src: "open.er-api.com" }; } catch (e) { /* try backup */ }
  if (!got) try { const j = await getJson(RATE_URL_2); const t = j && j.sgd; if (t && typeof t === "object") { const r = { SGD: 1 }; Object.keys(t).forEach((k) => { if (typeof t[k] === "number" && t[k] > 0) r[k.toUpperCase()] = t[k]; }); got = { rates: r, date: String(j.date || todayStr()), src: "currency-api (backup)" }; } } catch (e) { /* offline */ }
  if (got) {
    rates = { base: BASE, rates: { ...BUILTIN_RATES, ...got.rates }, real: got.rates, date: got.date, source: "live", src: got.src, fetchedAt: Date.now() };
    try { localStorage.setItem(RATE_KEY, JSON.stringify(rates)); } catch (e) { /* ignore */ }
    if (state) fixUnconverted();
  }
  if (state) renderAll();
}
function fixUnconverted() {
  const need = (r) => r.currencyCode !== GEN && r.currencyCode !== BASE && (baseOf(r) === null || (r.rateEst && !isEstRate(r.currencyCode)));
  if (state.records.some(need)) commit(() => state.records.forEach((r) => {
    if (!need(r)) return; const rt = rateOf(r.currencyCode); if (!rt) return;
    r.baseAmount = r.amount / rt; r.exchangeRate = rt; if (isEstRate(r.currencyCode)) r.rateEst = true; else delete r.rateEst;
  }));
  if (ui.pages.includes("currencies")) renderCurrenciesPage();
  if (ui.pages.includes("templates")) renderTemplatesPage();
  if (ui.pages.includes("quarantine")) renderQuarantine();
}
const curOf = (code) => state.currencies.find((c) => c.code === code);
const symOf = (code) => curOf(code)?.symbol || code;
const rateOf = (code) => { if (code === BASE) return 1; if (code === GEN) return null; const r = rates.rates[code]; return typeof r === "number" && r > 0 ? r : null; };
const baseOf = (r) => { if (r.currencyCode === GEN) return null; const b = toNum(r.baseAmount); return b !== null ? b : (r.currencyCode === BASE ? r.amount : null); };
const dispCode = () => { const c = state.currencies.find((x) => x.id === state.settings.defaultCurrencyId)?.code || BASE; return rateOf(c) ? c : BASE; };
const fmtBase = (b) => symOf(dispCode()) + fmtNum(b * rateOf(dispCode()));
const fmtBaseNum = (b) => fmtNum(b * rateOf(dispCode()));
const fmtRec = (r) => (r.currencySymbol || r.currencyCode) + fmtNum(r.amount);

/* ===== Queries / stats ===== */
const catOf = (id) => state.categories.find((c) => c.id === id);
const sortedCats = (kind, incArchived) => state.categories.filter((c) => (incArchived || !c.archived) && (!kind || c.kind === kind)).slice().sort((a, b) => a.order - b.order);
const activeTags = (cat) => (cat ? cat.tags.filter((t) => !t.archived).slice().sort((a, b) => a.order - b.order) : []);
const isHiddenInc = (r) => state.settings.hideIncome && r.type === "income" && !r.isRefund;
const shownRecords = () => state.records;
function sumRecords(list) {
  let inc = 0, exp = 0, ref = 0, unc = 0;
  for (const r of list) {
    if (r.currencyCode === GEN) continue;
    const b = baseOf(r); if (b === null) { unc++; continue; }
    if (r.isRefund) ref += b; else if (r.type === "income") inc += b; else exp += b;
  }
  return { inc, exp, ref, unc, net: Math.max(0, exp - ref) };
}
const inPeriod = (r, scope, mo) => r.date.startsWith(scope === "year" ? mo.y + "-" : `${mo.y}-${pad(mo.m)}`);
const periodRecords = (scope, mo, list) => (list || shownRecords()).filter((r) => inPeriod(r, scope, mo));
function streakDays() {
  const days = new Set(state.records.map((r) => r.date)); let d = todayStr(); if (!days.has(d)) d = addDays(d, -1);
  let n = 0; while (days.has(d)) { n++; d = addDays(d, -1); } return n;
}
function tagUsed(catId, tag) {
  const hit = (r) => r.categoryId === catId && (r.tagId ? r.tagId === tag.id : r.tag === tag.name);
  return state.records.some(hit) || state.recurringRules.some(hit);
}
function catUsed(id) { return state.records.some((r) => r.categoryId === id) || state.recurringRules.some((r) => r.categoryId === id) || state.quickTemplates.some((t) => t.categoryId === id); }

/* ===== Recurring engine (kinds: recurring / subscription / installment · freq: daily / weekly / monthly / yearly) ===== */
const inPaused = (rule, date) => (rule.pausedRanges || []).some((p) => p && p.from <= date && (!p.to || date < p.to));
function occDate(rule, n) {
  const iv = Math.max(1, Math.floor(rule.interval) || 1), sp = parseYMD(rule.startDate);
  if (rule.freq === "daily") return addDays(rule.startDate, n * iv);
  if (rule.freq === "weekly") return addDays(rule.startDate, 7 * n * iv);
  const t = addMonths(sp.y, sp.m, n * iv * (rule.freq === "yearly" ? 12 : 1));
  return ymd(t.y, t.m, Math.min(sp.d, dim(t.y, t.m)));
}
const occKey = (rule, date) => (rule.freq === "monthly" ? mkOf(date) : date);
const occEnded = (rule, n, date) => (rule.endDate && date > rule.endDate) || (rule.kind === "installment" && rule.installmentTotal && n >= rule.installmentTotal);
function ruleFieldsAt(rule, key) {
  const f = { type: rule.type, amount: rule.amount, currencyCode: rule.currencyCode, categoryId: rule.categoryId, tag: rule.tag || "", tagId: rule.tagId || null, note: rule.note || "" };
  (rule.history || []).filter((h) => h && typeof h.from === "string" && h.fields && typeof h.fields === "object" && h.from <= key)
    .sort((a, b) => (a.from < b.from ? -1 : 1)).forEach((h) => Object.assign(f, h.fields));
  const o = (rule.overrides || {})[key]; if (o) Object.assign(f, o);
  return f;
}
function makeRuleRecord(rule, key, date, n) {
  const f = ruleFieldsAt(rule, key), cat = catOf(f.categoryId), rt = rateOf(f.currencyCode), now = new Date().toISOString();
  const tg = cat ? (cat.tags.find((t) => t.id === f.tagId) || cat.tags.find((t) => t.name === f.tag)) : null, tagName = tg ? tg.name : f.tag;
  return { id: makeId("rec"), type: f.type, amount: f.amount, currencyCode: f.currencyCode, currencySymbol: symOf(f.currencyCode), exchangeRate: rt,
    baseAmount: f.currencyCode === BASE ? f.amount : (rt ? f.amount / rt : null), categoryId: f.categoryId, categoryNameSnapshot: cat?.name || "Unassigned",
    tag: tagName, tagNameSnapshot: tagName, tagId: tg ? tg.id : null, date, time: "00:00", note: f.note, photo: "",
    recurringRuleId: rule.id, ruleKey: key, repeatKind: rule.kind, repeatFreq: rule.freq, installmentIndex: n + 1, installmentTotal: rule.installmentTotal || null,
    isRefund: false, originalRecordId: null, createdAt: now, updatedAt: now, ...(rt && f.currencyCode !== BASE && isEstRate(f.currencyCode) ? { rateEst: true } : {}) };
}
/* Idempotent: key = ruleId + occurrence key (generatedMonths). Never generates before start, clamps 29/30/31, endDate inclusive. */
function reconcileRecurring() {
  const today = todayStr(); let changed = false;
  for (const rule of state.recurringRules) {
    if (rule.archived || rule.active === false || !isYMD(rule.startDate)) continue;
    const gen = new Set(rule.generatedMonths || []); let made = 0;
    for (let n = 0; n < 6000 && made < 400; n++) {
      const date = occDate(rule, n);
      if (date > today || occEnded(rule, n, date)) break;
      const key = occKey(rule, date); if (gen.has(key)) continue;
      const ov = (rule.overrides || {})[key];
      if (!inPaused(rule, date) && !(ov && ov.skip)) { state.records.push(makeRuleRecord(rule, key, date, n)); made++; }
      gen.add(key); changed = true;
    }
    rule.generatedMonths = [...gen].sort();
  }
  return changed;
}
function runReconcile() {
  const snap = JSON.stringify(state);
  if (reconcileRecurring()) { if (JSON.stringify(state) !== snap) commit(() => {}); }
}
function nextOcc(rule) {
  if (!isYMD(rule.startDate)) return null;
  const gen = new Set(rule.generatedMonths || []);
  for (let n = 0; n < 6000; n++) {
    const date = occDate(rule, n); if (occEnded(rule, n, date)) return null;
    const key = occKey(rule, date); if (!gen.has(key)) return { n, date, key };
  }
  return null;
}

/* ===== Calculator state machine (+/− and ×/÷ are single toggle keys) ===== */
let calc = { left: "0", op: null, right: "" };
const OPS = { pm: ["+", "−"], md: ["×", "÷"] };
const calcReset = (v) => { calc = { left: v == null ? "0" : String(v), op: null, right: "" }; };
function calcDigit(k) {
  const key = calc.op ? "right" : "left"; let s = calc[key];
  if (k === ".") { if (s.includes(".")) return; s = s === "" ? "0." : s + "."; }
  else { if (s.includes(".") && s.split(".")[1].length >= 2) return; s = s === "0" ? k : s + k; }
  if (s.length > 12) return; calc[key] = s;
}
function calcOperator(group) {
  const g = OPS[group]; if (!g) return;
  if (calc.left === "0" && !calc.op) return;       /* ignore operator as first key */
  if (calc.op && calc.right === "") { calc.op = g.includes(calc.op) ? g[1 - g.indexOf(calc.op)] : g[0]; return; }
  if (calc.op && !calcEval()) return;
  calc.op = g[0];
}
function calcEval() {
  if (!calc.op) return true;
  if (calc.right === "") { calc.op = null; return true; }
  const a = Number(calc.left), b = Number(calc.right); let r;
  if (calc.op === "+") r = a + b; else if (calc.op === "−") r = a - b; else if (calc.op === "×") r = a * b; else { if (b === 0) { toast("Cannot divide by zero"); return false; } r = a / b; }
  if (r < 0) { toast("Amount cannot be negative"); return false; }
  calc = { left: String(round2(r)), op: null, right: "" }; return true;
}
function calcBackspace() {
  if (calc.op) { if (calc.right !== "") calc.right = calc.right.slice(0, -1); else calc.op = null; }
  else calc.left = calc.left.length > 1 ? calc.left.slice(0, -1) : "0";
}
const calcValue = () => Number(calc.op ? (calc.right || calc.left) : calc.left) || 0;

/* ===== UI infrastructure ===== */
let toastTimer = null, swipeGuard = 0, ctxItems = [], sheetItems = [];
const lastDialog = () => [...document.querySelectorAll("dialog[open]")].pop() || null;
const mount = (rootId) => { const r = $(rootId); (lastDialog() || document.body).appendChild(r); return r; };
const openDlg = (id) => { const d = $(id); if (d.open) return; try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } };
const closeDlg = (id) => { const d = $(id); if (d.open) d.close(); };
function toast(msg) {
  const el = $("toast"); (lastDialog() || document.body).appendChild(el);
  el.textContent = msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}
function closeCtx() { $("ctxRoot").innerHTML = ""; ctxItems = []; }
function showCtx(x, y, items) {
  const root = mount("ctxRoot"); ctxItems = items;
  root.innerHTML = `<div class="ctx-menu">${items.map((it, i) => `<button type="button" class="ctx-item${it.danger ? " danger" : ""}" data-ctx="${i}">${esc(it.label)}</button>`).join("")}</div>`;
  const m = root.firstChild, w = m.offsetWidth || 200, h = m.offsetHeight || 150;
  m.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + "px"; m.style.top = Math.max(8, Math.min(y, window.innerHeight - h - 8)) + "px";
}
function closeSheet() { $("sheetRoot").innerHTML = ""; sheetItems = []; }
function showSheet(title, items) {
  const root = mount("sheetRoot"); sheetItems = items;
  root.innerHTML = `<div class="sheet-backdrop" data-action="sheet-close"></div><div class="action-sheet"><div class="group">${title ? `<div class="row-hint">${esc(title)}</div>` : ""}${items.map((it, i) =>
    `<button type="button" class="ctx-item${it.danger ? " danger" : ""}" data-sheet="${i}">${esc(it.label)}</button>`).join("")}</div><button type="button" class="ctx-item cancel" data-action="sheet-close">Cancel</button></div>`;
}
function confirmSheet(title, label, run) { showSheet(title, [{ label, danger: true, run }]); }
const lum = (hex) => { const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
function applyTheme() {
  const s = state.settings, b = document.body;
  b.dataset.skin = s.skinColor;
  const dark = s.appearanceMode === "dark" || (s.appearanceMode === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  b.classList.toggle("dark", !!dark);
  ["small", "medium", "large"].forEach((x) => b.classList.toggle("font-" + x, x === s.fontSize));
  ["system", "rounded", "serif", "mono", "script"].forEach((x) => b.classList.toggle("font-" + x, x === s.fontFormat));
  const c = safeColor(s.themeColor), st = document.documentElement.style;
  st.setProperty("--accent", c); st.setProperty("--accent-contrast", lum(c) > 0.55 ? "#111111" : "#ffffff");
}

/* ===== Swipe (left to reveal actions) ===== */
function closeSwipes(except) { document.querySelectorAll(".swipe-content.open").forEach((c) => { if (c !== except) { c.classList.remove("open"); c.style.transform = ""; } }); }
function enableSwipe(box) {
  let st = null;
  box.addEventListener("pointerdown", (e) => {
    const c = e.target.closest(".swipe-content"); if (!c || e.target.closest(".row-handle") || (e.pointerType === "mouse" && e.button !== 0)) return;
    const max = c.parentElement.querySelector(".swipe-actions")?.offsetWidth || 0;
    st = { c, x: e.clientX, y: e.clientY, base: c.classList.contains("open") ? -max : 0, max, moved: false, id: e.pointerId, cur: 0 };
  });
  box.addEventListener("pointermove", (e) => {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.moved) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { st = null; return; }
      if (Math.abs(dx) <= 8) return;
      st.moved = true; st.c.classList.add("dragging"); closeSwipes(st.c);
      try { st.c.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    st.cur = Math.max(-st.max, Math.min(0, st.base + dx)); st.c.style.transform = `translateX(${st.cur}px)`;
  });
  const end = (e) => {
    if (!st || e.pointerId !== st.id) return; const s = st; st = null; s.c.classList.remove("dragging");
    if (!s.moved) return; swipeGuard = Date.now();
    const open = s.cur < -s.max / 2; s.c.classList.toggle("open", open); s.c.style.transform = open ? `translateX(${-s.max}px)` : "";
  };
  box.addEventListener("pointerup", end); box.addEventListener("pointercancel", end);
}

/* ===== Drag to reorder (handle mode or immediate mode) ===== */
function startDrag(box, it, e, sel, onDone, needMove) {
  const r = it.getBoundingClientRect(), gx = e.clientX - r.left, gy = e.clientY - r.top, x0 = e.clientX, y0 = e.clientY;
  let active = false, moved = false;
  const place = (cx, cy) => { it.style.transform = ""; const b = it.getBoundingClientRect(); it.style.transform = `translate(${cx - gx - b.left}px,${cy - gy - b.top}px)`; };
  const begin = () => { active = true; it.classList.add("dragging"); if (navigator.vibrate) navigator.vibrate(10); };
  if (!needMove) begin();
  const mv = (ev) => {
    if (!active) { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) begin(); else return; }
    ev.preventDefault(); place(ev.clientX, ev.clientY);
    for (const s of box.querySelectorAll(sel)) {
      if (s === it) continue; const sr = s.getBoundingClientRect();
      if (ev.clientX >= sr.left && ev.clientX <= sr.right && ev.clientY >= sr.top && ev.clientY <= sr.bottom) {
        if (it.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) s.after(it); else s.before(it);
        moved = true; place(ev.clientX, ev.clientY); break;
      }
    }
    const sc = box.closest(".sub-content");
    if (ev.clientY < 70) (sc || window).scrollBy(0, -12); else if (ev.clientY > window.innerHeight - 70) (sc || window).scrollBy(0, 12);
  };
  const up = () => {
    document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
    if (!active) return; it.classList.remove("dragging"); it.style.transform = ""; swipeGuard = Date.now();
    if (moved) onDone([...box.querySelectorAll(sel)].map((el) => el.dataset.id));
  };
  document.addEventListener("pointermove", mv, { passive: false }); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
}
function makeSortable(box, sel, handle, onDone, immediate) {
  box.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const it = e.target.closest(sel); if (!it || !box.contains(it)) return;
    if (handle) { if (!e.target.closest(handle)) return; e.preventDefault(); startDrag(box, it, e, sel, onDone, false); }
    else if (immediate && immediate()) startDrag(box, it, e, sel, onDone, true);
  });
}
function applyOrder(list, ids) {
  const sorted = list.slice().sort((a, b) => a.order - b.order), full = sorted.map((x) => x.id);
  const slots = full.map((id, i) => (ids.includes(id) ? i : -1)).filter((i) => i >= 0);
  slots.forEach((slot, k) => { full[slot] = ids[k]; });
  full.forEach((id, i) => { const o = list.find((x) => x.id === id); if (o) o.order = i; });
}

/* ===== Unified DatePicker (the only calendar; optional time row + Done) ===== */
const DP = { o: null, y: 2026, m: 1, view: "day", yb: 2020 };
function openDatePicker(o) {
  const p = parseYMD(isYMD(o.value) ? o.value : todayStr());
  Object.assign(DP, { o, y: p.y, m: p.m, view: o.mode === "month" ? "month" : "day", yb: p.y - 4 });
  const wt = o.time !== undefined;
  $("dpHeading").textContent = o.title || (o.mode === "month" ? "Select Month" : "Select Date");
  $("dpClearBtn").classList.toggle("hidden", !o.allowClear); $("dpTimeRow").classList.toggle("hidden", !wt); $("dpDoneBtn").classList.toggle("hidden", !wt);
  if (wt) { $("dpTime").value = o.time || "00:00"; fillWheel(); }
  renderDP(); openDlg("datePickerDialog"); if (wt) setTimeout(() => setWheel($("dpTime").value), 30);
}
function fillWheel() {
  if ($("whH").childElementCount) return;
  $("whH").innerHTML = Array.from({ length: 24 }, (_, i) => `<div>${pad(i)}</div>`).join(""); $("whM").innerHTML = Array.from({ length: 60 }, (_, i) => `<div>${pad(i)}</div>`).join("");
  let tm = null; const read = () => { const h = Math.min(23, Math.max(0, Math.round($("whH").scrollTop / 36))), m = Math.min(59, Math.max(0, Math.round($("whM").scrollTop / 36))); $("dpTime").value = pad(h) + ":" + pad(m); };
  ["whH", "whM"].forEach((id) => $(id).addEventListener("scroll", () => { clearTimeout(tm); tm = setTimeout(read, 90); }));
}
function setWheel(v) { const [h, m] = String(v || "00:00").split(":").map(Number); $("whH").scrollTop = (h || 0) * 36; $("whM").scrollTop = (m || 0) * 36; }
function renderDP() {
  const { y, m, view, o } = DP, sel = isYMD(o.value) ? parseYMD(o.value) : null, today = todayStr();
  $("dpDayView").classList.toggle("hidden", view !== "day"); $("dpMonthGrid").classList.toggle("hidden", view !== "month"); $("dpYearGrid").classList.toggle("hidden", view !== "year");
  if (view === "day") {
    $("dpTitle").textContent = monthLabel(y, m);
    const first = new Date(y, m - 1, 1).getDay(), days = dim(y, m), has = new Set(state.records.filter((r) => mkOf(r.date) === `${y}-${pad(m)}`).map((r) => r.date));
    let h = ""; for (let i = 0; i < first; i++) h += `<span></span>`;
    for (let d = 1; d <= days; d++) {
      const ds = ymd(y, m, d), off = (o.min && ds < o.min) || (o.max && ds > o.max);
      h += `<button type="button" class="dp-day${ds === o.value ? " selected" : ""}${ds === today ? " today" : ""}${has.has(ds) ? " has-data" : ""}${off ? " muted" : ""}" data-dp-day="${ds}"${off ? " disabled" : ""}>${d}</button>`;
    }
    $("dpGrid").innerHTML = h;
  } else if (view === "month") {
    $("dpTitle").textContent = String(y);
    $("dpMonthGrid").innerHTML = MONTHS.map((n, i) => `<button type="button" class="dp-cell${sel && sel.y === y && sel.m === i + 1 ? " selected" : ""}" data-dp-month="${i + 1}">${n.slice(0, 3)}</button>`).join("");
  } else {
    $("dpTitle").textContent = `${DP.yb} – ${DP.yb + 11}`;
    $("dpYearGrid").innerHTML = Array.from({ length: 12 }, (_, i) => DP.yb + i).map((yy) => `<button type="button" class="dp-cell${sel && sel.y === yy ? " selected" : ""}" data-dp-year="${yy}">${yy}</button>`).join("");
  }
}
function dpFinish(v, t) { closeDlg("datePickerDialog"); const cb = DP.o && DP.o.onSelect; if (cb) cb(v, t); }
function dpPick(ds) { if (DP.o.time !== undefined) { DP.o.value = ds; renderDP(); } else dpFinish(ds); }
function dpNav(k) {
  if (DP.view === "day") { const n = addMonths(DP.y, DP.m, k); DP.y = n.y; DP.m = n.m; } else if (DP.view === "month") DP.y += k; else DP.yb += 12 * k;
  renderDP();
}

/* ===== Rendering ===== */
function renderAll() {
  if (!state) return;
  applyTheme(); renderBanners(); renderAvatar(); renderHome(); renderDetails(); renderStats(); renderSettings();
  if (ui.pages.includes("profile")) renderSecurity();
  if (ui.pages.includes("categories")) renderCategoriesPage();
  if (ui.pages.includes("categoryEdit")) renderCategoryEdit();
  if (ui.pages.includes("recurring")) renderRecurringPage();
  if (ui.pages.includes("currencies")) renderCurrenciesPage();
  if (ui.pages.includes("templates")) renderTemplatesPage();
  if (ui.pages.includes("quarantine")) renderQuarantine();
}
function renderBanners() {
  $("recoveryBanner").classList.toggle("hidden", !recoveryMode);
  const n = state.records.filter((r) => r.currencyCode !== GEN && baseOf(r) === null).length;
  const staleRates = rates.source === "builtin" || (rates.fetchedAt && Date.now() - rates.fetchedAt > 3 * DAY_MS);
  $("ratesBanner").classList.toggle("hidden", !staleRates);
  if (staleRates) { $("ratesBannerText").textContent = rates.source === "builtin" ? "Live exchange rates could not be loaded. Using built-in estimates; records will be corrected automatically once live rates arrive." : `Exchange rates are out of date (last update ${rates.date}).`;
    $("ratesReport").href = "mailto:rek9090@gmail.com?subject=" + encodeURIComponent("My Ledger: exchange rate source problem") + "&body=" + encodeURIComponent(`Rates could not be refreshed.\nLast update: ${rates.date} (${rates.source})\nApp v${APP_VERSION}\n${navigator.userAgent}`); }
  $("unconvertedBanner").classList.toggle("hidden", n === 0);
  if (n) $("unconvertedText").textContent = `${n} record(s) are waiting for an exchange rate. They are saved and will be converted automatically when online.`;
}
function renderAvatar() {
  const s = state.settings, has = typeof s.userAvatar === "string" && s.userAvatar.startsWith("data:image/"), ch = (s.userName || "A").trim().charAt(0).toUpperCase() || "A";
  [["avatarImg", "avatarFallback"], ["profileAvatarBig", "profileAvatarFallback"]].forEach(([i, f]) => {
    const im = $(i); if (has) im.src = s.userAvatar; im.classList.toggle("hidden", !has); $(f).classList.toggle("hidden", has); $(f).textContent = ch;
  });
  $("profileName").textContent = s.userName || "User";
}
const eyeSync = () => ["homeEye", "detailsEye"].forEach((id) => { $(id).classList.toggle("off", !!state.settings.hideIncome); $(id).setAttribute("aria-pressed", String(!!state.settings.hideIncome)); });
const moOf = (scope, key) => ui[key];
const periodLabel = (scope, mo) => (scope === "year" ? String(mo.y) : monthLabel(mo.y, mo.m));
const setSeg = (id, attr, val) => document.querySelectorAll(`#${id} .segment`).forEach((b) => b.classList.toggle("active", b.dataset[attr] === val));

function renderHome() {
  const s = state.settings, sc = ui.homeScope, mo = ui.homeMonth, recs = periodRecords(sc, mo), tot = sumRecords(recs), hide = s.hideIncome;
  $("homeLabel").textContent = periodLabel(sc, mo); setSeg("homeScope", "scope", sc); eyeSync();
  $("homeExpense").textContent = fmtBase(tot.net); $("homeIncome").textContent = hide ? MASK : fmtBase(tot.inc);
  const kx = rateOf(dispCode()) || 1, budget = (toNum(s.monthlyBudget) || 0) * (sc === "year" ? 12 : 1), pct = budget > 0 ? Math.round((tot.net * kx / budget) * 100) : 0, fill = $("homeBudgetFill");
  fill.style.width = Math.min(100, pct) + "%"; fill.className = "budget-bar-fill" + (pct > 100 ? " over" : pct >= 80 ? " warn" : "");
  const tpls = state.quickTemplates.slice(0, 6);
  $("quickTemplates").innerHTML = tpls.map((t) => `<button type="button" class="template-btn" data-action="use-template" data-id="${esc(t.id)}"><span class="t-icon">${esc(catOf(t.categoryId)?.icon || "⚡")}</span><span class="t-label">${esc(t.label)}</span></button>`).join("") +
    (tpls.length < 6 ? `<button type="button" class="template-btn template-add-btn" data-action="add-template" aria-label="Add template"><span class="t-label">+ Template</span></button>` : "");
  $("homeEditDoneBtn").classList.toggle("hidden", !ui.homeEdit);
  ["expense", "income"].forEach((g) => {
    const open = !!s.homeExpanded[g];
    $(g + "Group").classList.toggle("open", open); $(g + "Grid").classList.toggle("hidden", !open);
    $(g + "Group").querySelector("[data-group]").setAttribute("aria-expanded", String(open));
    const grid = $(g + "Grid"); grid.classList.toggle("edit-mode", ui.homeEdit);
    grid.innerHTML = sortedCats(g).map((c) => {
      const t = sumRecords(recs.filter((r) => r.categoryId === c.id)), v = g === "expense" ? t.net : t.inc, col = safeColor(c.color);
      return `<button type="button" class="category-card" data-action="cat-tap" data-id="${esc(c.id)}"${ui.homeEdit ? ' style="touch-action:none"' : ""}><span class="category-icon" style="background:${col}33">${esc(c.icon)}</span><span class="category-name">${esc(c.name)}</span><span class="category-total">${g === "income" && hide ? MASK : fmtBase(v)}</span></button>`;
    }).join("") || `<p class="muted">No ${g} categories. Add one in Settings → Categories.</p>`;
  });
}

function filteredRecords(ignoreType) {
  let list = shownRecords(); const rangeOk = !(ui.from && ui.to && ui.from > ui.to);
  if ((ui.from || ui.to) && rangeOk) list = list.filter((r) => (!ui.from || r.date >= ui.from) && (!ui.to || r.date <= ui.to));
  else list = periodRecords("month", ui.detailsMonth, list);
  if (ui.fCat) list = list.filter((r) => r.categoryId === ui.fCat);
  if (ui.fTag) list = list.filter((r) => r.tagId === ui.fTag || (!r.tagId && r.tag === (catOf(ui.fCat)?.tags.find((t) => t.id === ui.fTag)?.name)));
  const q = ui.search.trim().toLowerCase();
  if (q) list = list.filter((r) => [r.note, r.categoryNameSnapshot, catOf(r.categoryId)?.name, r.tag, isHiddenInc(r) ? "" : String(r.amount)].some((v) => String(v ?? "").toLowerCase().includes(q)));
  if (!ignoreType && ui.type !== "all") list = list.filter((r) => ui.type === "refund" ? r.isRefund : (r.type === ui.type && !r.isRefund));
  return list;
}
function repeatBadge(r) {
  if (r.isRefund) return { t: "Refund", c: "b-refund" };
  let kind = r.repeatKind, freq = r.repeatFreq;
  if (!kind && r.recurringRuleId) { const ru = state.recurringRules.find((x) => x.id === r.recurringRuleId); kind = ru ? ru.kind : "recurring"; freq = ru ? ru.freq : "monthly"; }
  if (!kind) return null;
  if (kind === "subscription") return { t: "Subscription", c: "b-subscription" };
  if (kind === "installment") return { t: `Installment ${r.installmentIndex || "?"}/${r.installmentTotal || "?"}`, c: "b-installment" };
  return { t: FREQ_LABEL[freq] || "Monthly", c: "b-recurring" };
}
function recordRow(r) {
  const cat = catOf(r.categoryId), col = safeColor(cat?.color), cls = r.isRefund ? "refund-amount" : r.type === "income" ? "income-amount" : "expense-amount";
  const sign = r.type === "income" && !r.isRefund ? "+" : r.isRefund ? "↩" : "−", b = baseOf(r);
  const conv = r.currencyCode === GEN ? `<span class="record-tag">Not counted</span>` : r.currencyCode === BASE ? "" : (b === null ? `<span class="flag-badge">No rate</span>` : `<span class="record-tag">≈ ${esc(fmtBase(b))}${r.rateEst ? " est." : ""}</span>`);
  const btns = [`<button type="button" class="swipe-btn edit" data-action="rec-edit" data-id="${esc(r.id)}">Edit</button>`];
  if (r.type === "expense" && !r.isRefund) btns.push(`<button type="button" class="swipe-btn refund" data-action="rec-refund" data-id="${esc(r.id)}">Refund</button>`);
  btns.push(`<button type="button" class="swipe-btn copy" data-action="rec-copy" data-id="${esc(r.id)}">Copy</button>`, `<button type="button" class="swipe-btn delete" data-action="rec-delete" data-id="${esc(r.id)}">Delete</button>`);
  const bd = repeatBadge(r), head = r.categoryNameSnapshot + (r.tagNameSnapshot ? " - " + r.tagNameSnapshot : "");
  return `<div class="swipe-container"><div class="swipe-actions">${btns.join("")}</div><div class="swipe-content" data-action="open-detail" data-id="${esc(r.id)}">` +
    `<span class="record-icon" style="background:${col}33">${esc(cat?.icon || "🏷️")}</span><div class="record-main"><div class="record-title"><span class="t-text">${esc(head)}</span>${bd ? `<span class="flag-badge ${bd.c}">${esc(bd.t)}</span>` : ""}</div>` +
    `<div class="record-subtitle">${r.note ? esc(r.note) + " · " : ""}${esc(r.time)}</div></div>` +
    `<div class="record-side"><span class="record-amount ${cls}">${isHiddenInc(r) ? MASK : sign + esc(fmtRec(r))}</span>${isHiddenInc(r) ? "" : conv}</div></div></div>`;
}
function renderDetails() {
  const mo = ui.detailsMonth, hide = state.settings.hideIncome; $("detailsLabel").textContent = monthLabel(mo.y, mo.m); eyeSync();
  setSeg("viewSeg", "view", ui.view); $("calendarView").classList.toggle("hidden", ui.view !== "calendar"); $("listView").classList.toggle("hidden", ui.view !== "list");
  const s = sumRecords(ui.view === "calendar" ? periodRecords("month", mo) : filteredRecords(true));
  $("monthIncome").textContent = hide ? MASK : fmtBase(s.inc); $("monthExpense").textContent = fmtBase(s.net);
  const bal = s.inc - s.net, be = $("monthBalance"); be.textContent = hide ? MASK : fmtBase(bal); be.className = "summary-value " + (hide ? "" : bal < 0 ? "negative" : "positive");
  if (ui.view === "calendar") { renderCalendar(mo); return; }
  const fc = $("filterCategory"); fc.innerHTML = `<option value="">All</option>` + sortedCats(null, true).map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join(""); fc.value = ui.fCat;
  const cat = catOf(ui.fCat), ft = $("filterTag");
  ft.innerHTML = `<option value="">All</option>` + (cat ? cat.tags.map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("") : ""); ft.value = ui.fTag; ft.disabled = !cat;
  $("filterFromBtn").textContent = ui.from ? fmtDate(ui.from) : "Any"; $("filterToBtn").textContent = ui.to ? fmtDate(ui.to) : "Any";
  const bad = ui.from && ui.to && ui.from > ui.to; $("filterError").classList.toggle("hidden", !bad); if (bad) $("filterError").textContent = "From date must not be after To date.";
  document.querySelectorAll("#typeChips .chip").forEach((c) => c.classList.toggle("active", c.dataset.type === ui.type));
  $("filterToggleBtn").textContent = ui.from || ui.to || ui.fCat || ui.fTag ? "Filter •" : "Filter";
  const list = filteredRecords(false).sort((a, b) => (a.date === b.date ? (a.time < b.time ? 1 : -1) : a.date < b.date ? 1 : -1));
  let h = "", last = "";
  list.forEach((r) => { if (r.date !== last) { last = r.date; h += `<div class="record-day-heading" data-day="${esc(r.date)}">${esc(fmtDate(r.date))}</div>`; } h += recordRow(r); });
  $("recordList").innerHTML = h || `<div class="empty-state">No records</div>`;
}
function renderCalendar(mo) {
  const recs = periodRecords("month", mo), days = dim(mo.y, mo.m), first = new Date(mo.y, mo.m - 1, 1).getDay(), today = todayStr(), by = {};
  recs.forEach((r) => { const t = (by[r.date] = by[r.date] || []); t.push(r); });
  let h = ""; for (let i = 0; i < first; i++) h += `<span class="cal-day empty"></span>`;
  for (let d = 1; d <= days; d++) {
    const ds = ymd(mo.y, mo.m, d), s = sumRecords(by[ds] || []), exp = s.net;
    h += `<button type="button" class="cal-day${ds === today ? " today" : ""}" data-action="cal-day" data-date="${ds}"><span class="n">${d}</span>${s.inc > 0 ? `<span class="cal-inc">${state.settings.hideIncome ? "•••" : fmtShort(s.inc)}</span>` : ""}${exp > 0 ? `<span class="cal-exp">${fmtShort(exp)}</span>` : ""}</button>`;
  }
  $("calGrid").innerHTML = h;
}
function jumpToDay(ds) {
  const p = parseYMD(ds); ui.detailsMonth = { y: p.y, m: p.m }; ui.from = ui.to = ""; ui.type = "all"; ui.fCat = ui.fTag = ""; ui.search = ""; $("searchInput").value = ""; ui.view = "list"; renderAll();
  const el = document.querySelector(`.record-day-heading[data-day="${ds}"]`);
  if (!el) return toast("No records on this day");
  if (el.scrollIntoView) el.scrollIntoView({ block: "start" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600);
}

function bars(vals, labels, colors) {
  const n = labels.length, w = 300, bw = Math.max(3, Math.floor(w / n) - 3), mx = Math.max(1, ...vals.flat()), k = vals.length, sw = Math.max(2, Math.floor(bw / k) - 2);
  let h = `<svg viewBox="0 0 ${w} 120" width="100%" role="img" aria-label="Chart">`;
  labels.forEach((l, i) => {
    vals.forEach((series, j) => { const bh = Math.round((series[i] / mx) * 88), x = i * (w / n) + 2 + j * sw; h += `<rect x="${x.toFixed(1)}" y="${100 - bh}" width="${sw - 1}" height="${bh}" rx="2" fill="${colors[j]}"/>`; });
    if (l !== "") h += `<text x="${(i * (w / n) + (w / n) / 2).toFixed(1)}" y="115" text-anchor="middle" font-size="8" fill="var(--muted)">${l}</text>`;
  });
  return h + "</svg>";
}
function renderStats() {
  const sc = ui.statsScope, mo = ui.statsMonth, hide = state.settings.hideIncome, recs = periodRecords(sc, mo), tot = sumRecords(recs), isY = sc === "year";
  $("statsLabel").textContent = periodLabel(sc, mo); setSeg("statsScope", "scope", sc);
  const kx = rateOf(dispCode()) || 1, used = tot.net * kx, budget = (toNum(state.settings.monthlyBudget) || 0) * (isY ? 12 : 1), pct = budget > 0 ? Math.round((used / budget) * 100) : 0, left = budget - used;
  $("budgetCard").querySelector(".eyebrow").textContent = isY ? "Yearly Budget (monthly × 12)" : "Monthly Budget";
  $("budgetUsed").textContent = fmtNum(used); $("budgetTotal").textContent = budget > 0 ? fmtNum(budget) : "Set budget";
  const fill = $("budgetBarFill"); fill.style.width = Math.min(100, pct) + "%"; fill.className = "budget-bar-fill" + (pct > 100 ? " over" : pct >= 80 ? " warn" : "");
  $("budgetPercent").textContent = budget > 0 ? `${pct}% Used` : "Tap the amount to set a budget";
  const bl = $("budgetLeft"); bl.className = "budget-left" + (left < 0 ? " over" : ""); bl.textContent = budget > 0 ? (left < 0 ? `Over by ${fmtNum(-left)}` : `${fmtNum(left)} Left`) : "";
  const now = new Date(), cur = isY ? mo.y === now.getFullYear() : (mo.y === now.getFullYear() && mo.m === now.getMonth() + 1);
  const total = isY ? ((mo.y % 4 === 0 && mo.y % 100 !== 0) || mo.y % 400 === 0 ? 366 : 365) : dim(mo.y, mo.m);
  const dayN = cur ? (isY ? Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(mo.y, 0, 1)) / 864e5) + 1 : now.getDate()) : total;
  { const n = streakDays(); $("kpiStreak").textContent = `Streak ${n} ${n === 1 ? "day" : "days"}`; } $("kpiRecords").textContent = `${recs.length} / ${state.records.length}`; $("kpiRecLabel").textContent = (isY ? "Year" : "Month") + " / All records"; $("kpiAvg").textContent = fmtBaseNum(tot.net / Math.max(1, dayN));
  const net = tot.inc - tot.net, kn = $("kpiNet"); kn.textContent = hide ? MASK : fmtBaseNum(net); kn.className = hide ? "" : net < 0 ? "negative" : "positive";
  const by = {}; recs.forEach((r) => { if (r.type !== "expense" || r.isRefund || r.currencyCode === GEN) return; const b = baseOf(r); if (b === null) return; const k = r.categoryId || r.categoryNameSnapshot; (by[k] = by[k] || { name: r.categoryNameSnapshot, col: catOf(r.categoryId)?.color, v: 0 }).v += b; });
  const rows = Object.values(by).sort((a, b) => b.v - a.v), sum = rows.reduce((s, x) => s + x.v, 0);
  $("statsCategory").innerHTML = rows.map((x) => `<div class="mb"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(x.name)}</span><b>${esc(fmtBase(x.v))} · ${Math.round((x.v / sum) * 100)}%</b></div><div class="budget-bar" style="margin:4px 0 0"><div class="budget-bar-fill" style="width:${((x.v / sum) * 100).toFixed(1)}%;background:${safeColor(x.col)}"></div></div></div>`).join("") || `<div class="empty-state">No spending in this period</div>`;
  {
    const k = rateOf(dispCode()) || 1, all = shownRecords(), e = [], inc = [], labels = [];
    if (!isY) for (let m = 1; m <= 12; m++) { const s = sumRecords(periodRecords("month", { y: mo.y, m }, all)); e.push(s.net * k); inc.push(s.inc * k); labels.push(MONTHS[m - 1].slice(0, 3)); }
    else for (let y = mo.y - 4; y <= mo.y; y++) { const s = sumRecords(periodRecords("year", { y, m: 1 }, all)); e.push(s.net * k); inc.push(s.inc * k); labels.push(String(y)); }
    const un = isY ? "Yearly" : "Monthly"; $("statsTrendTitle").textContent = hide ? un + " Spending" : un + " Income vs Expense";
    $("statsTrend").innerHTML = bars(hide ? [e] : [inc, e], labels, hide ? ["var(--accent)"] : ["var(--positive)", "var(--negative)"]);
  }
}
function renderSwatches(id, colors, selected) {
  $(id).innerHTML = colors.map((c) => { const v = Array.isArray(c) ? c[0] : c, col = Array.isArray(c) ? c[1] : c;
    return `<button type="button" class="swatch${String(v).toLowerCase() === String(selected).toLowerCase() ? " selected" : ""}" style="background:${col}" data-value="${esc(v)}" aria-label="${esc(v)}"></button>`; }).join("");
}
function renderSettings() {
  const s = state.settings;
  $("appearanceMode").value = s.appearanceMode === "system" ? "auto" : s.appearanceMode; $("fontSizeSelect").value = s.fontSize; $("fontFormatSelect").value = s.fontFormat;
  $("dateFormatSelect").value = s.dateFormat;
  renderSwatches("accentSwatches", ACCENTS, s.themeColor); renderSwatches("skinCool", SKINS_COOL, s.skinColor); renderSwatches("skinWarm", SKINS_WARM, s.skinColor);
  $("accentPreview").style.background = safeColor(s.themeColor); $("skinPreview").style.background = (SKINS.find((k) => k[0] === s.skinColor) || SKINS[0])[1];
  $("profileSummary").textContent = [s.userName, s.userId && "@" + s.userId].filter(Boolean).join(" · "); $("quarantineCount").textContent = state.quarantine.length ? `${state.quarantine.length} item(s)` : "None";
  $("cloudStatus").textContent = !cloud.col ? "Not available in this view" : cloud.last ? "Last synced " + cloud.last.slice(0, 16).replace("T", " ") : "Waiting for first save";
  $("versionLabel").textContent = `My Ledger v${APP_VERSION}`;
}
function renderSecurity() {
  const lk = state.settings.lock; $("lockToggle").checked = lk.enabled; $("lockState").textContent = lk.enabled ? "On · PIN required on launch" : "Off"; $("changePinRow").classList.toggle("hidden", !lk.enabled);
}

/* ----- Categories page ----- */
function renderCategoriesPage() {
  $("categoriesEditBtn").textContent = ui.catEdit ? "Done" : "Edit"; setSeg("categoriesSegment", "filter", ui.catFilter);
  const list = sortedCats(null, true).filter((c) => (ui.catFilter === "archived" ? c.archived : !c.archived && c.kind === ui.catFilter));
  $("categoriesList").innerHTML = list.map((c) => `<div class="row${c.archived ? " archived" : ""}" data-id="${esc(c.id)}" data-action="edit-category">` +
    (ui.catEdit && !c.archived ? `<button type="button" class="row-minus" data-action="cat-minus" data-id="${esc(c.id)}" aria-label="Delete">−</button>` : "") +
    `<span class="row-icon" style="background:${safeColor(c.color)}33">${esc(c.icon)}</span><span class="row-label">${esc(c.name)}<small>${c.tags.filter((t) => !t.archived).length} subcategories${c.archived ? " · Archived · " + c.kind : ""}</small></span>` +
    (c.archived ? `<button type="button" class="button button-secondary" data-action="cat-restore" data-id="${esc(c.id)}">Restore</button>` : "") +
    (c.archived ? "" : `<span class="row-handle" aria-label="Reorder">≡</span>`) + `</div>`).join("") || `<p class="row-hint">Nothing here.</p>`;
}
let catDraft = null;
function openCategoryEdit(id) {
  const c = id ? catOf(id) : null;
  catDraft = c ? { ...clone(c), isNew: false } : { id: makeId("cat"), isNew: true, kind: ui.catFilter === "income" ? "income" : "expense", name: "", icon: "🏷️", color: PALETTE[state.categories.length % PALETTE.length], order: state.categories.length, archived: false, tags: [] };
  $("categoryEditTitle").textContent = c ? "Edit Category" : "New Category"; $("categoryDangerGroup").classList.toggle("hidden", !c);
  $("catNameInput").value = catDraft.name; showPage("categoryEdit"); renderCategoryEdit();
}
function renderCategoryEdit() {
  const d = catDraft; if (!d) return;
  setSeg("catKindSeg", "kind", d.kind);
  $("catIconPreview").textContent = d.icon; $("catIconPreview").style.background = safeColor(d.color) + "33"; $("catColorPreview").style.background = safeColor(d.color);
  renderSwatches("catColorSwatches", PALETTE, d.color);
  const act = d.tags.filter((t) => !t.archived).sort((a, b) => a.order - b.order), arc = d.tags.filter((t) => t.archived);
  $("tagList").innerHTML = act.map((t) => `<div class="row" data-id="${esc(t.id)}"><button type="button" class="row-minus" data-action="tag-minus" data-id="${esc(t.id)}" aria-label="Remove">−</button>` +
    `<input class="row-input tag-name" style="text-align:left;color:var(--text)" data-id="${esc(t.id)}" value="${esc(t.name)}" maxlength="12" placeholder="Subcategory name" aria-label="Subcategory name"><span class="row-handle" aria-label="Reorder">≡</span></div>`).join("") +
    arc.map((t) => `<div class="row archived"><span class="row-label">${esc(t.name)}<small>Archived (used by records)</small></span><button type="button" class="button button-secondary" data-action="tag-restore" data-id="${esc(t.id)}">Restore</button></div>`).join("") ||
    `<p class="row-hint">No subcategories yet.</p>`;
}

/* ----- Currencies / templates / recurring / quarantine pages ----- */
function renderCurrenciesPage() {
  $("currencyList").innerHTML = state.currencies.map((c) => { const rt = rateOf(c.code), isDef = c.id === state.settings.defaultCurrencyId;
    const btns = (!c.generic && !isDef ? `<button type="button" class="swipe-btn copy" data-action="currency-default" data-code="${esc(c.code)}">Default</button>` : "") + `<button type="button" class="swipe-btn delete" data-action="currency-delete" data-code="${esc(c.code)}">Delete</button>`;
    return `<div class="swipe-container" data-id="${esc(c.id)}"><div class="swipe-actions">${btns}</div><div class="swipe-content"><span class="record-icon" style="background:var(--surface-soft)">${esc(c.symbol)}</span><div class="record-main"><div class="record-title"><span class="t-text">${esc(c.code)}</span>${isDef ? `<span class="flag-badge b-recurring">Default</span>` : ""}</div><div class="record-subtitle">${c.generic ? "no conversion, not counted in totals" : rt ? "1 SGD = " + rt.toFixed(4) + " " + esc(c.code) : "rate unavailable"}</div></div><span class="row-handle" aria-label="Reorder">≡</span></div></div>`; }).join("") || `<p class="row-hint">No currencies. Tap + to add one.</p>`;
  $("ratesInfo").textContent = rates.source === "builtin" ? `Rates: built-in estimates (${BUILTIN_DATE}) — live rates not loaded yet. Base currency: ${BASE}.` : `Rates updated: ${rates.date} · ${rates.src || "saved copy"}. Refreshes once a day. Base currency: ${BASE}.`;
}
function renderTemplatesPage() {
  $("templateList").innerHTML = state.quickTemplates.map((t) => `<div class="swipe-container" data-id="${esc(t.id)}"><div class="swipe-actions"><button type="button" class="swipe-btn edit" data-action="edit-template" data-id="${esc(t.id)}">Edit</button><button type="button" class="swipe-btn delete" data-action="tpl-delete" data-id="${esc(t.id)}">Delete</button></div>` +
    `<div class="swipe-content" data-action="edit-template" data-id="${esc(t.id)}"><span class="record-icon" style="background:var(--surface-soft)">${esc(catOf(t.categoryId)?.icon || "⚡")}</span><div class="record-main"><div class="record-title"><span class="t-text">${esc(t.label)}</span></div><div class="record-subtitle">${esc(catOf(t.categoryId)?.name || "No category")}${t.tag ? " - " + esc(t.tag) : ""}${toNum(t.amount) ? " · " + esc(symOf(t.currencyCode) + fmtNum(t.amount)) : ""}</div></div><span class="row-handle" aria-label="Reorder">≡</span></div></div>`).join("") || `<p class="row-hint">No templates yet. The first 6 appear on Home.</p>`;
}
function ruleRow(r) {
  const nx = r.archived ? null : nextOcc(r), f = ruleFieldsAt(r, nx ? nx.key : "9999"), cat = catOf(f.categoryId), sign = f.type === "income" ? "+" : "−";
  const btns = r.archived ? `<button type="button" class="swipe-btn edit" data-action="rule-restore" data-id="${esc(r.id)}">Restore</button><button type="button" class="swipe-btn delete" data-action="rule-delete" data-id="${esc(r.id)}">Delete</button>`
    : `<button type="button" class="swipe-btn edit" data-action="rule-edit" data-id="${esc(r.id)}">Edit</button><button type="button" class="swipe-btn copy" data-action="rule-archive" data-id="${esc(r.id)}">Archive</button>`;
  const every = `${r.kind[0].toUpperCase() + r.kind.slice(1)} · ${r.interval > 1 ? "every " + r.interval + " " + FREQ_UNIT[r.freq] + "s" : FREQ_LABEL[r.freq]}`;
  const prog = r.kind === "installment" ? ` · ${(r.generatedMonths || []).length}/${r.installmentTotal}` : "";
  return `<div class="swipe-container" data-id="${esc(r.id)}"><div class="swipe-actions">${btns}</div><div class="swipe-content" data-action="rule-edit" data-id="${esc(r.id)}">` +
    `<span class="record-icon" style="background:${safeColor(cat?.color)}33">${esc(cat?.icon || "🏷️")}</span><div class="record-main"><div class="record-title"><span class="t-text">${esc(f.note || cat?.name || "Rule")}</span></div>` +
    `<div class="record-subtitle">${esc(every)}${prog} · ${r.archived ? "Archived" : nx ? "next " + esc(fmtDate(nx.date)) : "Ended"}</div></div>` +
    `<div class="record-side"><span class="record-amount ${f.type === "income" ? "income-amount" : "expense-amount"}">${sign}${esc(symOf(f.currencyCode) + fmtNum(f.amount))}</span></div>${r.archived ? "" : `<span class="row-handle" aria-label="Reorder">≡</span>`}</div></div>`;
}
function renderRecurringPage() {
  setSeg("recurringSegment", "filter", ui.ruleFilter);
  const list = state.recurringRules.filter((r) => (ui.ruleFilter === "archived") === !!r.archived).sort((a, b) => a.order - b.order);
  $("recurringList").innerHTML = list.map(ruleRow).join("") || `<div class="empty-state">No ${ui.ruleFilter} rules</div>`;
}
function renderQuarantine() {
  $("quarantineList").innerHTML = state.quarantine.map((q) => `<div class="row"><span class="row-label">${esc(q.reason)}<small>${esc(JSON.stringify(q.raw).slice(0, 140))}</small></span></div>`).join("") || `<p class="row-hint">Nothing quarantined.</p>`;
}

/* ===== Page navigation ===== */
function setTab(t) {
  ui.tab = t; closeSwipes();
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + t));
  document.querySelectorAll(".tab-item").forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
  renderAll();
}
function showPage(name) { $("sub-" + name).classList.remove("hidden"); if (!ui.pages.includes(name)) ui.pages.push(name); }
let prof = { avatar: null };
function openPage(name) {
  if (name === "profile") { prof = { avatar: null }; $("profileNameInput").value = state.settings.userName || ""; $("profileIdInput").value = state.settings.userId || ""; }
  showPage(name); renderAll();
}
function goBack() {
  const n = ui.pages.pop(); if (!n) return; $("sub-" + n).classList.add("hidden");
  if (n === "categoryEdit") catDraft = null; if (n === "categories") ui.catEdit = false; renderAll();
}

/* ===== Unified form: Record · Template · Recurring Rule ===== */
const fm = { mode: "record", ex: null, type: "expense", currency: BASE, date: "", time: "", photo: "", refundOf: null, catId: null, subId: "", legacy: "", panel: "", typeLocked: false,
  rep: { on: false, kind: "recurring", interval: 1, freq: "monthly", total: "", end: "" } };
function refundsOf(id, skipId) { return state.records.filter((r) => r.isRefund && r.originalRecordId === id && r.id !== skipId); }
function resolveSub(catId, cur) {
  const cat = catOf(catId); if (!cat || !cur || !(cur.tagId || cur.tag)) return { subId: "", legacy: "" };
  const tags = activeTags(cat), m = tags.find((t) => t.id === cur.tagId) || tags.find((t) => t.name === cur.tag);
  return m ? { subId: m.id, legacy: "" } : { subId: "legacy", legacy: cur.tag || cur.tagNameSnapshot || "" };
}
function openForm(o = {}) {
  const mode = o.mode || "record"; let ex = null, base = null, orig = null;
  if (mode === "record") { ex = o.id ? state.records.find((r) => r.id === o.id) || null : null; base = ex || (o.copyOf ? state.records.find((r) => r.id === o.copyOf) : null) || o.tpl || null; orig = o.refundOf ? state.records.find((r) => r.id === o.refundOf) : null; }
  else if (mode === "template") { ex = o.id ? state.quickTemplates.find((t) => t.id === o.id) || null : null; base = ex; }
  else { ex = o.id ? state.recurringRules.find((r) => r.id === o.id) || null : null; if (ex) { const nx = nextOcc(ex); base = ruleFieldsAt(ex, nx ? nx.key : "9999"); } }
  const preCat = o.categoryId ? catOf(o.categoryId) : null;
  const type = orig ? "income" : base ? base.type : preCat ? preCat.kind : (o.type || "expense");
  let amt = base && toNum(base.amount) ? base.amount : 0, catId = orig ? orig.categoryId : base ? base.categoryId : preCat ? preCat.id : sortedCats(type)[0]?.id || null;
  if (orig) amt = round2(orig.amount - refundsOf(orig.id, null).reduce((s, r) => s + r.amount, 0));
  const sub = resolveSub(catId, orig ? { tag: orig.tag, tagId: orig.tagId } : base && base.categoryId === catId ? base : null);
  Object.assign(fm, { catOpen: false, mode, ex, type, currency: orig ? orig.currencyCode : base ? base.currencyCode : dispCode(), catId, subId: sub.subId, legacy: sub.legacy, photo: base && base.photo ? base.photo : "", refundOf: orig ? orig.id : (ex && ex.isRefund ? ex.originalRecordId : null),
    date: mode === "record" ? (ex ? ex.date : todayStr()) : mode === "rule" ? (ex ? ex.startDate : todayStr()) : todayStr(), time: mode === "record" && ex ? ex.time : nowTime(), panel: "", typeLocked: !!orig || (mode === "record" && !!ex && !!ex.isRefund) || (mode === "rule" && !!ex),
    rep: ex && mode === "rule" ? { on: true, kind: ex.kind, interval: ex.interval, freq: ex.freq, total: ex.installmentTotal || "", end: ex.endDate || "" } : { on: false, kind: "recurring", interval: 1, freq: "monthly", total: "", end: "" } });
  $("formNote").value = orig ? "" : base && base.note ? base.note : ""; if ($("formNote").value) fm.panel = "note";
  $("formName").value = mode === "template" && ex ? ex.label : "";
  $("formTitle").textContent = mode === "template" ? (ex ? "Edit Template" : "New Template") : mode === "rule" ? (ex ? "Edit Recurring" : "New Recurring") : ex ? "Edit Record" : orig ? "Refund" : o.copyOf ? "Copy Record" : "Add Record";
  $("opPM").textContent = "+/−"; $("opMD").textContent = "×/÷"; $("formError").classList.add("hidden");
  calcReset(amt > 0 ? amt : 0); renderForm(); openDlg("formDialog");
}
function renderForm() {
  const isRec = fm.mode === "record", isTpl = fm.mode === "template", isRule = fm.mode === "rule", rp = fm.rep, ex = fm.ex;
  $("formNameRow").classList.toggle("hidden", !isTpl); setSeg("formTypeSeg", "type", fm.type); $("formTypeSeg").classList.toggle("locked", fm.typeLocked);
  $("toolDate").classList.toggle("hidden", isTpl); $("toolPhoto").classList.toggle("hidden", !isRec); $("toolRepeat").classList.toggle("hidden", !(isRec && !ex && !fm.refundOf));
  $("toolNote").classList.toggle("on", !!$("formNote").value.trim()); $("toolPhoto").classList.toggle("on", !!fm.photo); $("toolRepeat").classList.toggle("on", rp.on && !isRule);
  $("toolInfo").textContent = isRec ? `${fmtDate(fm.date)} ${fm.time}` : isRule ? "Starts " + fmtDate(fm.date) : "";
  $("notePanel").classList.toggle("hidden", fm.panel !== "note"); $("photoPanel").classList.toggle("hidden", fm.panel !== "photo"); $("repeatPanel").classList.toggle("hidden", !(isRule || (fm.panel === "repeat" && rp.on)));
  $("photoPreview").classList.toggle("hidden", !fm.photo); $("photoPreview").src = fm.photo.startsWith("data:image/") ? fm.photo : ""; $("photoRemove").classList.toggle("hidden", !fm.photo);
  const lockStruct = isRule && ex && (ex.generatedMonths || []).length > 0;
  setSeg("repeatKind", "kind", rp.kind); $("repeatKind").classList.toggle("locked", !!lockStruct);
  $("repeatInterval").value = rp.interval; $("repeatFreq").value = rp.freq; $("repeatTotal").value = rp.total;
  $("repeatInterval").disabled = $("repeatFreq").disabled = !!lockStruct; $("repeatTotalWrap").classList.toggle("hidden", rp.kind !== "installment");
  $("repeatEndBtn").classList.toggle("hidden", rp.kind === "installment"); $("repeatEndBtn").textContent = "End: " + (rp.end ? fmtDate(rp.end) : "None");
  const cur = catOf(fm.catId), pill = $("formCatBtn"); pill.innerHTML = cur ? `<span>${esc(cur.icon)}</span><span>${esc(cur.name)}</span>` : "Choose category"; pill.disabled = !!fm.refundOf;
  const subs = activeTags(cur).slice(0, 8);
  $("formSubs").innerHTML = subs.map((t) => `<button type="button" class="chip label-chip${t.id === fm.subId ? " active" : ""}" data-sub="${esc(t.id)}">${esc(t.name)}</button>`).join("") +
    (fm.subId === "legacy" ? `<button type="button" class="chip label-chip active" data-sub="legacy">${esc(fm.legacy)}</button>` : "") + (cur ? `<button type="button" class="chip gear" data-action="form-subs" aria-label="Manage subcategories">⚙</button>` : "");
  updateNumpad();
}
function updateNumpad() {
  $("numpadAmount").textContent = calc.op ? (calc.right || calc.left) : calc.left; $("numpadExpression").textContent = calc.op ? `${calc.left} ${calc.op} ${calc.right}` : "";
  $("currencyBtn").textContent = fm.currency;
  const mk = $("numpadMainKey"), rt = rateOf(fm.currency), gen = fm.currency === GEN; mk.textContent = calc.op ? "=" : "✓"; mk.setAttribute("aria-label", calc.op ? "Equals" : "Save");
  mk.classList.toggle("eq-key", !!calc.op); mk.classList.toggle("save-key", !calc.op);
  let hint = ""; if (gen) hint = "No conversion · not counted in totals"; else if (fm.currency !== BASE) hint = rt ? `≈ ${symOf(BASE)}${fmtNum(calcValue() / rt)} (1 SGD = ${rt.toFixed(4)} ${fm.currency})` : "No exchange rate yet — saved now, converted automatically when online";
  $("conversionHint").textContent = hint; mk.disabled = false;
}
const formErr = (m) => { $("formError").textContent = m; $("formError").classList.remove("hidden"); };
function subFields(cat, ex) {
  const sel = fm.subId; let tag = "", tagId = null, snap = "";
  if (sel === "legacy") { tag = fm.legacy || (ex && ex.tag) || ""; tagId = ex ? ex.tagId || null : null; snap = (ex && ex.tagNameSnapshot) || tag; }
  else if (sel) { const t = cat.tags.find((x) => x.id === sel); if (t) { tag = t.name; tagId = t.id; snap = t.name; } }
  if (ex && tagId && ex.tagId === tagId && ex.tagNameSnapshot) { snap = ex.tagNameSnapshot; tag = ex.tag || tag; } /* keep history names */
  return { tag, tagId, snap };
}
function saveForm() {
  const amount = round2(calcValue()), cat = catOf(fm.catId);
  if (fm.mode === "template") return saveTemplateForm(amount, cat);
  if (!(amount > 0)) return formErr("Enter an amount greater than 0.");
  if (!cat) return formErr("Choose a category.");
  if (fm.mode === "rule") return saveRuleForm(amount, cat);
  const ex = fm.ex, code = fm.currency, note = $("formNote").value.trim(), sf = subFields(cat, ex), rp = fm.rep, repeat = rp.on && !ex && !fm.refundOf;
  if (!isYMD(fm.date)) return formErr("Choose a date.");
  let rate = rateOf(code), base, est = false;
  if (code === BASE) { rate = 1; base = amount; }
  else if (code === GEN) { rate = null; base = null; }
  else if (ex && ex.currencyCode === code && ex.amount === amount && toNum(ex.exchangeRate) > 0 && baseOf(ex) !== null) { rate = ex.exchangeRate; base = baseOf(ex); est = !!ex.rateEst; }
  else if (rate) { base = amount / rate; est = isEstRate(code); } else { rate = null; base = null; } /* saved without rate; filled in automatically when rates arrive */
  if (fm.refundOf) {
    const o = state.records.find((r) => r.id === fm.refundOf), others = refundsOf(fm.refundOf, ex ? ex.id : null).reduce((s, r) => s + r.amount, 0);
    if (o && o.currencyCode === code && amount + others > o.amount + 1e-9) return formErr(`Refund exceeds the original amount (${fmtRec(o)}).`);
  }
  let rule = null;
  if (repeat) {
    const total = Math.floor(toNum(rp.total) || 0), end = rp.kind === "installment" ? "" : rp.end;
    if (rp.kind === "installment" && total < 2) return formErr("Enter the total number of payments (2 or more).");
    if (end && end < fm.date) return formErr("End date must not be before the date.");
    rule = { id: makeId("rule"), type: fm.type, amount, currencyCode: code, currencySymbol: symOf(code), categoryId: cat.id, tag: sf.tag, tagId: sf.tagId, note, kind: rp.kind, freq: rp.freq, interval: Math.max(1, Math.floor(toNum(rp.interval) || 1)),
      installmentTotal: rp.kind === "installment" ? total : null, startDate: fm.date, endDate: end, active: true, archived: false, ruleType: rp.kind, generatedMonths: [], history: [], overrides: {}, pausedRanges: [], order: state.recurringRules.length };
    rule.generatedMonths = [occKey(rule, fm.date)];
  }
  const now = new Date().toISOString(), same = ex && ex.categoryId === cat.id;
  const rec = { ...(ex || { createdAt: now, recurringRuleId: null }), id: ex ? ex.id : makeId("rec"), type: fm.refundOf ? "income" : fm.type, amount, currencyCode: code,
    currencySymbol: ex && ex.currencyCode === code && ex.currencySymbol ? ex.currencySymbol : symOf(code), exchangeRate: rate, baseAmount: base, categoryId: cat.id,
    categoryNameSnapshot: same && ex.categoryNameSnapshot ? ex.categoryNameSnapshot : cat.name, tag: sf.tag, tagId: sf.tagId, tagNameSnapshot: sf.snap, date: fm.date, time: fm.time || "00:00",
    note, photo: fm.photo || "", isRefund: ex ? !!ex.isRefund : !!fm.refundOf, originalRecordId: ex ? ex.originalRecordId || null : (fm.refundOf || null), updatedAt: now };
  if (est) rec.rateEst = true; else delete rec.rateEst;
  if (rule) Object.assign(rec, { recurringRuleId: rule.id, ruleKey: rule.generatedMonths[0], repeatKind: rule.kind, repeatFreq: rule.freq, installmentIndex: 1, installmentTotal: rule.installmentTotal });
  const ok = commit(() => { if (rule) state.recurringRules.push(rule); if (ex) { const i = state.records.findIndex((r) => r.id === ex.id); state.records[i] = rec; } else state.records.push(rec); });
  if (!ok) return;
  closeDlg("formDialog"); closeSwipes(); if (rule) runReconcile(); renderAll();
  toast(ex ? "Record updated" : rule ? "Record saved with repeat" : "Record saved");
}
function saveTemplateForm(amount, cat) {
  const label = $("formName").value.trim(), ex = fm.ex;
  if (!label) return formErr("Enter a template name."); if (!cat) return formErr("Choose a category.");
  const sf = subFields(cat, null), obj = { id: ex ? ex.id : makeId("tpl"), label, type: fm.type, amount: amount > 0 ? amount : null, currencyCode: fm.currency, categoryId: cat.id, tag: sf.tag, tagId: sf.tagId, note: $("formNote").value.trim() };
  commit(() => { const i = state.quickTemplates.findIndex((x) => x.id === obj.id); if (i >= 0) state.quickTemplates[i] = { ...state.quickTemplates[i], ...obj }; else state.quickTemplates.push(obj); });
  closeDlg("formDialog"); renderAll(); toast("Template saved");
}
function saveRuleForm(amount, cat) {
  const ex = fm.ex, rp = fm.rep, sf = subFields(cat, ex), note = $("formNote").value.trim(), gens = ex ? (ex.generatedMonths || []).length : 0;
  const total = Math.floor(toNum(rp.total) || 0), end = rp.kind === "installment" ? "" : rp.end, interval = Math.max(1, Math.floor(toNum(rp.interval) || 1));
  if (!isYMD(fm.date)) return formErr("Choose a start date."); if (end && end < fm.date) return formErr("End date must not be before the start date.");
  if (rp.kind === "installment" && (total < 2 || total < gens)) return formErr(gens > 2 ? `Total payments must be at least ${gens} (already generated).` : "Enter the total number of payments (2 or more).");
  const fields = { amount, currencyCode: fm.currency, categoryId: cat.id, tag: sf.tag, tagId: sf.tagId, note }, struct = { kind: rp.kind, ruleType: rp.kind, freq: rp.freq, interval, startDate: fm.date, currencySymbol: symOf(fm.currency) };
  const tot = rp.kind === "installment" ? total : null;
  if (!ex) {
    commit(() => state.recurringRules.push({ id: makeId("rule"), type: fm.type, ...fields, ...struct, installmentTotal: tot, endDate: end, active: true, archived: false, generatedMonths: [], history: [], overrides: {}, pausedRanges: [], order: state.recurringRules.length }));
    closeDlg("formDialog"); runReconcile(); renderAll(); toast("Recurring saved"); return;
  }
  if (!gens) { commit(() => { Object.assign(ex, fields, struct, { installmentTotal: tot, endDate: end }); }); closeDlg("formDialog"); runReconcile(); renderAll(); toast("Recurring saved"); return; }
  fm.pending = { fields, end, tot }; openDlg("scopeDialog");
}
function applyRuleScope(scope) {
  const p = fm.pending, ex = fm.ex; if (!p || !ex) return;
  commit(() => {
    const rule = state.recurringRules.find((r) => r.id === ex.id), nx = nextOcc(rule), key = nx ? nx.key : "9999";
    if (scope === "future") { rule.history.push({ from: key, fields: p.fields }); rule.endDate = p.end; if (rule.kind === "installment") rule.installmentTotal = p.tot; } else rule.overrides[key] = { ...p.fields };
  });
  fm.pending = null; closeDlg("scopeDialog"); closeDlg("formDialog"); runReconcile(); renderAll(); toast("Recurring updated");
}

/* ===== Detail / delete ===== */
function openDetail(id) {
  const r = state.records.find((x) => x.id === id); if (!r) return; const b = baseOf(r), cat = catOf(r.categoryId), bd = repeatBadge(r);
  const row = (l, v) => `<div class="row"><span class="row-label">${esc(l)}</span><span class="row-value">${esc(v)}</span></div>`;
  const orig = r.originalRecordId ? state.records.find((x) => x.id === r.originalRecordId) : null, rf = refundsOf(r.id, null);
  let h = `<div class="group inset">${row("Amount", isHiddenInc(r) ? MASK : (r.type === "income" && !r.isRefund ? "+" : "−") + fmtRec(r))}${r.currencyCode !== BASE && r.currencyCode !== GEN && !isHiddenInc(r) ? row("In SGD", b === null ? "Rate unavailable" : symOf(BASE) + fmtNum(b)) : ""}${r.currencyCode === GEN ? row("Totals", "Not counted (generic currency)") : ""}` +
    row("Type", r.isRefund ? "Refund" : r.type === "income" ? "Income" : "Expense") + row("Category", r.categoryNameSnapshot + (cat && cat.name !== r.categoryNameSnapshot ? ` (now ${cat.name})` : "")) +
    (r.tagNameSnapshot ? row("Subcategory", r.tagNameSnapshot) : "") + row("Date", fmtDate(r.date) + " " + r.time) + (r.note ? row("Note", r.note) : "") +
    (bd && !r.isRefund ? row("Repeat", bd.t) : "") + (orig ? row("Refund of", fmtRec(orig) + " · " + fmtDate(orig.date)) : "") + (rf.length ? row("Refunded", symOf(r.currencyCode) + fmtNum(rf.reduce((s, x) => s + x.amount, 0))) : "") + `</div>`;
  if (r.photo && r.photo.startsWith("data:image/")) h += `<div class="form-field"><img src="${esc(r.photo)}" alt="Attachment" style="max-width:100%;border-radius:10px"></div>`;
  h += `<div class="dialog-actions" style="flex-wrap:wrap"><button type="button" class="button button-secondary" data-action="rec-edit" data-id="${esc(r.id)}">Edit</button>` +
    (r.type === "expense" && !r.isRefund ? `<button type="button" class="button button-secondary" data-action="rec-refund" data-id="${esc(r.id)}">Refund</button>` : "") +
    `<button type="button" class="button button-secondary" data-action="rec-copy" data-id="${esc(r.id)}">Copy</button><button type="button" class="button button-danger" data-action="rec-delete" data-id="${esc(r.id)}">Delete</button></div>`;
  $("detailBody").innerHTML = h; openDlg("detailDialog");
}
function deleteRecord(id) {
  const rec = state.records.find((r) => r.id === id), rule = rec && rec.recurringRuleId ? state.recurringRules.find((x) => x.id === rec.recurringRuleId) : null;
  if (rule) {
    showSheet("This record repeats. Delete which?", [
      { label: "This record only", danger: true, run: () => { commit(() => { state.records = state.records.filter((r) => r.id !== id); }); renderAll(); toast("Deleted"); } },
      { label: "This and future (archive the rule)", danger: true, run: () => { commit(() => {
        state.records = state.records.filter((r) => !(r.id === id || (r.recurringRuleId === rule.id && r.date >= rec.date)));
        rule.archived = true; rule.active = false; rule.pausedRanges = (rule.pausedRanges || []).concat([{ from: rec.date, to: null }]);
      }); renderAll(); toast("Deleted · rule archived"); } }]);
    return;
  }
  const n = refundsOf(id, null).length;
  confirmSheet(n ? `This record has ${n} refund(s). The refunds will be kept.` : "Delete this record?", "Delete", () => { commit(() => { state.records = state.records.filter((r) => r.id !== id); }); renderAll(); toast("Deleted"); });
}

/* ===== Currencies / images / backup ===== */
const curSym = (code) => { try { const p = new Intl.NumberFormat("en", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((x) => x.type === "currency"); return safeSymbol(p ? p.value : code) || code; } catch (e) { return code; } };
const curName = (code) => { try { return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) || code; } catch (e) { return code; } };
function renderCurrencyAddList() {
  const q = $("curSearch").value.trim().toLowerCase();
  const codes = Object.keys(rates.rates).filter((c) => /^[A-Z]{3}$/.test(c) && !curOf(c) && (!q || c.toLowerCase().includes(q) || curName(c).toLowerCase().includes(q))).sort();
  $("curAddList").innerHTML = codes.map((c) => `<button type="button" class="row" data-action="currency-pick" data-code="${esc(c)}"><span class="row-icon" style="background:var(--surface-soft)">${esc(curSym(c))}</span><span class="row-label">${esc(c)}<small>${esc(curName(c))}</small></span></button>`).join("") || `<p class="row-hint">No matching currency.</p>`;
}
function openCurrencyAdd() { $("curSearch").value = ""; renderCurrencyAddList(); openDlg("currencyEditDialog"); }
function readImage(file, max, q, cb) {
  const fr = new FileReader();
  fr.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL("image/jpeg", q)); }; img.onerror = () => toast("Could not read this image"); img.src = fr.result; };
  fr.readAsDataURL(file);
}
function download(name, text, type) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function validateBackup(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return "This file is not a My Ledger backup.";
  if (!Array.isArray(o.records) || !Array.isArray(o.categories)) return "Backup is missing records or categories.";
  if (o.settings !== undefined && (typeof o.settings !== "object" || o.settings === null)) return "Backup settings are invalid.";
  return null;
}
let pendingRestore = null;
function handleRestoreFile(file) { const fr = new FileReader(); fr.onload = () => previewRestore(String(fr.result)); fr.readAsText(file); }
function previewRestore(text) {
  {
    let o; try { o = JSON.parse(text); } catch (e) { toast("Not a valid backup. Nothing changed."); return; }
    const bad = validateBackup(o); if (bad) { toast(bad + " Nothing changed."); return; }
    pendingRestore = normalizeState(o); const dates = pendingRestore.records.map((r) => r.date).sort();
    $("restorePreviewBody").innerHTML = `<p>Records: <b>${pendingRestore.records.length}</b><br>Categories: <b>${pendingRestore.categories.length}</b><br>Recurring rules: <b>${pendingRestore.recurringRules.length}</b><br>` +
      `Date range: <b>${esc(dates[0] || "—")} → ${esc(dates[dates.length - 1] || "—")}</b><br>Needs review: <b>${pendingRestore.quarantine.length}</b></p><p class="muted">Current data (${state.records.length} records) will be replaced. A safety copy is saved first. Your PIN settings are kept.</p>`;
    openDlg("restorePreviewDialog");
  }
}
function confirmRestore() {
  if (!pendingRestore) return;
  try { localStorage.setItem(APP_DATA_KEY + "_prerestore_" + Date.now(), JSON.stringify(state)); } catch (e) { toast("Cannot create safety copy. Restore cancelled."); return; }
  const incoming = pendingRestore; pendingRestore = null; incoming.settings.lock = clone(state.settings.lock);
  if (commit(() => { state = incoming; })) { closeDlg("restorePreviewDialog"); runReconcile(); renderAll(); toast("Backup restored"); }
}
const backupJSON = () => JSON.stringify({ ...state, settings: { ...state.settings, lock: { enabled: false, salt: "", hash: "", recSalt: "", recHash: "" } } }, null, 2);
function csvCell(v) { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function exportCSV() {
  const rows = [["Date", "Time", "Type", "Label", "Category", "Subcategory", "Note", "Amount", "Currency", "Amount SGD"].join(",")];
  state.records.slice().sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1)).forEach((r) => {
    const b = baseOf(r), bd = repeatBadge(r); rows.push([r.date, r.time, r.type, csvCell(bd ? bd.t : ""), csvCell(r.categoryNameSnapshot), csvCell(r.tagNameSnapshot), csvCell(r.note), r.amount, r.currencyCode, b === null ? "" : round2(b)].join(","));
  });
  download(`my-ledger-${todayStr()}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
}

/* ===== Category helpers ===== */
function deleteOrArchive(id, after) {
  const c = catOf(id); if (!c) return;
  if (catUsed(id)) confirmSheet("This category has history. It will be archived (hidden) and its history stays intact.", "Archive", () => { commit(() => { catOf(id).archived = true; }); if (after) after(); renderAll(); });
  else confirmSheet("Delete this category?", "Delete", () => { commit(() => { state.categories = state.categories.filter((x) => x.id !== id); }); if (after) after(); renderAll(); });
}
function saveCategory() {
  const d = catDraft; if (!d) return; const name = $("catNameInput").value.trim();
  if (!name) return toast("Enter a category name.");
  const tags = d.tags.filter((t) => t.archived || t.name.trim()).map((t) => ({ ...t, name: t.name.trim() })), seen = new Set();
  for (const t of tags) { const k = t.name.toLowerCase(); if (seen.has(k)) return toast(`Duplicate subcategory: ${t.name}`); seen.add(k); }
  const act = tags.filter((t) => !t.archived).sort((a, b) => a.order - b.order); act.forEach((t, i) => { t.order = i; });
  commit(() => {
    if (d.isNew) state.categories.push({ id: d.id, kind: d.kind, name, icon: d.icon, color: d.color, order: state.categories.length, archived: false, tags });
    else Object.assign(catOf(d.id), { kind: d.kind, name, icon: d.icon, color: d.color, tags });
  });
  goBack(); toast("Category saved");
}

/* ===== App lock (PIN only; Log out = lock, never deletes data) ===== */
async function sha(text) {
  try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); } } catch (e) { /* fall through */ }
  let h = 5381; for (const c of text) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return "f" + h.toString(16);
}
let lk = { mode: "unlock", buf: "", first: "", after: null };
function renderDots() { $("lockDots").innerHTML = [0, 1, 2, 3].map((i) => `<i class="${i < lk.buf.length ? "on" : ""}"></i>`).join(""); }
function showLock(mode, title, after) {
  lk = { mode, buf: "", first: "", after: after || null }; $("lockTitle").textContent = title; $("lockMsg").textContent = "";
  $("lockCancel").classList.toggle("hidden", mode === "unlock"); $("lockRecovery").classList.toggle("hidden", mode !== "unlock"); $("lockScreen").classList.remove("hidden"); renderDots();
}
const hideLock = () => { $("lockScreen").classList.add("hidden"); lk.buf = ""; };
async function lockKey(k) {
  if (k === "del") lk.buf = lk.buf.slice(0, -1); else if (lk.buf.length < 4) lk.buf += k;
  renderDots(); if (lk.buf.length < 4) return;
  const pin = lk.buf, L = state.settings.lock; lk.buf = "";
  if (lk.mode === "unlock" || lk.mode === "verify") {
    if ((await sha(L.salt + pin)) === L.hash) { const a = lk.after; hideLock(); if (a) a(); } else { $("lockMsg").textContent = "Wrong PIN. Try again."; renderDots(); }
  } else if (lk.mode === "set1") { lk.first = pin; lk.mode = "set2"; $("lockTitle").textContent = "Confirm PIN"; $("lockMsg").textContent = ""; renderDots(); }
  else if (lk.mode === "set2") {
    if (pin !== lk.first) { lk.mode = "set1"; $("lockTitle").textContent = "Create a 4-digit PIN"; $("lockMsg").textContent = "PINs did not match."; renderDots(); } else await savePin(pin);
  }
}
async function savePin(pin) {
  const salt = makeId("s"), recSalt = makeId("r"), alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = "";
  for (let i = 0; i < 8; i++) code += alpha[Math.floor(Math.random() * alpha.length)];
  const hash = await sha(salt + pin), recHash = await sha(recSalt + code);
  commit(() => { state.settings.lock = { enabled: true, salt, hash, recSalt, recHash }; });
  hideLock(); renderAll(); showSheet(`Recovery code: ${code.slice(0, 4)}-${code.slice(4)}. Write it down; it is shown only once.`, [{ label: "I saved it", run: () => {} }]);
}
async function recoverPin() {
  const code = (window.prompt ? window.prompt("Enter your recovery code") : "") || "", L = state.settings.lock;
  if (!code) return;
  if ((await sha(L.recSalt + code.toUpperCase().replace(/[^A-Z0-9]/g, ""))) === L.recHash) {
    commit(() => { state.settings.lock = { enabled: false, salt: "", hash: "", recSalt: "", recHash: "" }; }); hideLock(); renderAll(); toast("Lock removed. Your data is untouched. Set a new PIN in Profile.");
  } else $("lockMsg").textContent = "Recovery code did not match.";
}

/* ===== Event handling ===== */
let lpTimer = null, lpFired = 0;
const shiftPeriod = (key, scopeKey, k) => { const mo = ui[key]; ui[key] = ui[scopeKey] === "year" ? { y: mo.y + k, m: mo.m } : addMonths(mo.y, mo.m, k); renderAll(); };
const setSetting = (k, v) => { commit(() => { state.settings[k] = v; }); renderAll(); };
const pickMonth = (key) => openDatePicker({ mode: "month", value: ymd(ui[key].y, ui[key].m, 1), onSelect: (d) => { const p = parseYMD(d); ui[key] = { y: p.y, m: p.m }; renderAll(); } });
const recId = (el) => el.dataset.id;
function endBudget(save) {
  const i = $("budgetInput"); if (i.classList.contains("hidden")) return;
  if (save) { const v = toNum(i.value); commit(() => { state.settings.monthlyBudget = v !== null && v >= 0 ? v : 0; }); }
  i.classList.add("hidden"); $("budgetTotal").classList.remove("hidden"); renderAll();
}
const A = {
  "recovery-export": () => { download("my-ledger-raw-data.txt", rawCorrupt || "", "text/plain"); recoveryMode = false; renderAll(); toast("Raw data exported. A fresh ledger was started."); },
  "retry-rates": () => { fetchRates(true); toast("Updating rates…"); },
  "home-prev": () => shiftPeriod("homeMonth", "homeScope", -1), "home-next": () => shiftPeriod("homeMonth", "homeScope", 1),
  "details-prev": () => shiftPeriod("detailsMonth", "x", -1), "details-next": () => shiftPeriod("detailsMonth", "x", 1),
  "stats-prev": () => shiftPeriod("statsMonth", "statsScope", -1), "stats-next": () => shiftPeriod("statsMonth", "statsScope", 1),
  "open-month-picker": (el) => pickMonth(el.dataset.target + "Month"),
  "home-edit-done": () => { ui.homeEdit = false; renderAll(); },
  "toggle-group": (el) => { const g = el.dataset.group, h = state.settings.homeExpanded; commit(() => { state.settings.homeExpanded = { ...h, [g]: !h[g] }; }); renderAll(); },
  "toggle-hide-income": () => setSetting("hideIncome", !state.settings.hideIncome),
  "edit-budget": () => { if (ui.statsScope === "year") return toast("Edit the budget in Month view"); const i = $("budgetInput"); i.value = state.settings.monthlyBudget || ""; $("budgetTotal").classList.add("hidden"); i.classList.remove("hidden"); i.focus(); },
  "cal-day": (el) => jumpToDay(el.dataset.date),
  "toggle-filter": (el) => { const p = $("filterPanel"); p.classList.toggle("hidden"); el.setAttribute("aria-expanded", String(!p.classList.contains("hidden"))); },
  "clear-filter": () => { ui.from = ui.to = ui.fCat = ui.fTag = ""; renderAll(); },
  "pick-date": (el) => {
    const t = el.dataset.target;
    if (t === "form") { if (fm.mode === "rule" && fm.ex && (fm.ex.generatedMonths || []).length) return toast("Start date is locked once records exist."); openDatePicker({ value: fm.date, time: fm.mode === "record" ? fm.time : undefined, title: fm.mode === "rule" ? "Start date" : "Date & time", onSelect: (d, tm) => { fm.date = d; if (tm) fm.time = tm; renderForm(); } }); }
    else if (t === "filterFrom") openDatePicker({ value: ui.from, allowClear: true, title: "From date", onSelect: (d) => { ui.from = d; renderAll(); } });
    else if (t === "filterTo") openDatePicker({ value: ui.to, allowClear: true, title: "To date", onSelect: (d) => { ui.to = d; renderAll(); } });
    else if (t === "ruleEnd") openDatePicker({ value: fm.rep.end || fm.date, min: fm.date, allowClear: true, title: "End date", onSelect: (d) => { fm.rep.end = d; renderForm(); } });
  },
  "toggle-accordion": (el) => { const a = el.closest(".accordion"), was = a.classList.contains("open"); a.classList.toggle("open", !was); el.setAttribute("aria-expanded", String(!was)); },
  "toggle-swatches": (el) => { const g = $(el.dataset.target); g.classList.toggle("hidden"); el.setAttribute("aria-expanded", String(!g.classList.contains("hidden"))); },
  "open-page": (el) => openPage(el.dataset.page),
  "backup": async () => { const name = `my-ledger-backup-${todayStr()}.json`, text = backupJSON();
    try { const f = new File([text], name, { type: "application/json" }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "My Ledger backup" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    download(name, text, "application/json"); },
  "copy-backup": async () => { const text = backupJSON(); let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { try { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); ok = document.execCommand("copy"); t.remove(); } catch (e2) { ok = false; } }
    toast(ok ? `Backup copied (${state.records.length} records). Paste it into Notes to keep it.` : "Could not copy. Use the backup file instead."); },
  "paste-restore": () => { $("pasteBackup").value = ""; openDlg("pasteDialog"); },
  "paste-restore-go": () => { const t = $("pasteBackup").value.trim(); if (!t) return toast("Paste the backup text first."); closeDlg("pasteDialog"); previewRestore(t); },
  "restore": () => $("restoreFileInput").click(), "restore-confirm": () => confirmRestore(), "export-csv": () => exportCSV(),
  "add-record": () => openForm({}), "back": () => goBack(), "close-dialog": (el) => { const d = el.closest("dialog"); if (d) d.close(); },
  "sheet-close": () => closeSheet(),
  "pick-currency": () => {
    $("currencyPickerList").innerHTML = !state.currencies.length ? `<p class="row-hint">No currencies. Add one in Settings → Currencies.</p>` : state.currencies.map((c) => `<button type="button" class="row" data-action="select-currency" data-code="${esc(c.code)}"><span class="row-icon" style="background:var(--surface-soft)">${esc(c.symbol)}</span><span class="row-label">${esc(c.code)}<small>${esc(c.name)}</small></span>${c.code === fm.currency ? "✓" : ""}</button>`).join("");
    openDlg("currencyPickerDialog");
  },
  "select-currency": (el) => { fm.currency = el.dataset.code; closeDlg("currencyPickerDialog"); updateNumpad(); },
  "backspace": () => { calcBackspace(); updateNumpad(); },
  "numpad-main": () => { if (calc.op) { calcEval(); updateNumpad(); } else saveForm(); },
  "tool-note": () => { fm.panel = fm.panel === "note" ? "" : "note"; renderForm(); if (fm.panel === "note") $("formNote").focus(); },
  "tool-photo": () => { fm.panel = fm.panel === "photo" ? "" : "photo"; renderForm(); },
  "tool-repeat": () => { if (fm.rep.on && fm.panel === "repeat") { fm.rep.on = false; fm.panel = ""; } else { fm.rep.on = true; fm.panel = "repeat"; } renderForm(); },
  "photo-remove": () => { fm.photo = ""; renderForm(); },
  "form-subs": () => { const id = fm.catId; if (!id) return; closeDlg("formDialog"); openCategoryEdit(id); },
  "dp-prev": () => dpNav(-1), "dp-next": () => dpNav(1),
  "dp-title": () => { if (DP.view === "day") DP.view = "month"; else if (DP.view === "month") { DP.view = "year"; DP.yb = DP.y - 4; } renderDP(); },
  "dp-clear": () => dpFinish(""), "dp-done": () => dpFinish(DP.o.value, $("dpTime").value || "00:00"),
  "dp-today": () => { const t = todayStr(); if (DP.o.mode === "month") dpFinish(t.slice(0, 7) + "-01"); else if (DP.o.time !== undefined) { DP.o.value = t; const p = parseYMD(t); DP.y = p.y; DP.m = p.m; DP.view = "day"; renderDP(); } else dpFinish(t); },
  "scope-choice": (el) => applyRuleScope(el.dataset.scope),
  "open-detail": (el) => { const c = el.closest(".swipe-content"); if (c && c.classList.contains("open")) closeSwipes(); else openDetail(recId(el)); },
  "rec-edit": (el) => { closeDlg("detailDialog"); closeSwipes(); openForm({ id: recId(el) }); },
  "rec-refund": (el) => { closeDlg("detailDialog"); closeSwipes(); openForm({ refundOf: recId(el) }); },
  "rec-copy": (el) => { closeDlg("detailDialog"); closeSwipes(); openForm({ copyOf: recId(el) }); },
  "rec-delete": (el) => { closeDlg("detailDialog"); closeSwipes(); deleteRecord(recId(el)); },
  "use-template": (el) => { const t = state.quickTemplates.find((x) => x.id === recId(el)); if (t) openForm({ tpl: t }); },
  "add-template": () => openForm({ mode: "template" }), "edit-template": (el) => { const c = el.closest(".swipe-content"); if (c && c.classList.contains("open")) closeSwipes(); else { closeSwipes(); openForm({ mode: "template", id: recId(el) }); } },
  "tpl-delete": (el) => confirmSheet("Delete this template?", "Delete", () => { commit(() => { state.quickTemplates = state.quickTemplates.filter((t) => t.id !== recId(el)); }); renderAll(); }),
  "cat-tap": (el) => { if (Date.now() - lpFired < 700 || Date.now() - swipeGuard < 350) return; if (ui.homeEdit) openCategoryEdit(recId(el)); else openForm({ categoryId: recId(el) }); },
  "categories-toggle-edit": () => { ui.catEdit = !ui.catEdit; renderCategoriesPage(); },
  "add-category": () => openCategoryEdit(null), "edit-category": (el) => openCategoryEdit(recId(el)),
  "cat-minus": (el) => deleteOrArchive(recId(el)), "cat-restore": (el) => { commit(() => { catOf(recId(el)).archived = false; }); renderAll(); },
  "save-category": () => saveCategory(),
  "change-icon": () => { $("iconGrid").innerHTML = ICONS.map((i) => `<button type="button" class="dp-cell" data-icon="${esc(i)}">${esc(i)}</button>`).join(""); openDlg("iconDialog"); },
  "add-tag": () => { const n = catDraft.tags.reduce((m, t) => Math.max(m, t.order), -1) + 1; catDraft.tags.push({ id: makeId("tag"), name: "", order: n, archived: false }); renderCategoryEdit(); const inp = [...document.querySelectorAll("#tagList .tag-name")].pop(); if (inp) inp.focus(); },
  "tag-minus": (el) => { const t = catDraft.tags.find((x) => x.id === recId(el)); if (!t) return; if (!catDraft.isNew && t.name && tagUsed(catDraft.id, t)) { t.archived = true; toast("Used by records — archived instead of deleted"); } else catDraft.tags = catDraft.tags.filter((x) => x !== t); renderCategoryEdit(); },
  "tag-restore": (el) => { const t = catDraft.tags.find((x) => x.id === recId(el)); if (t) { t.archived = false; t.order = catDraft.tags.length; renderCategoryEdit(); } },
  "delete-category": () => deleteOrArchive(catDraft.id, () => goBack()),
  "add-rule": () => openForm({ mode: "rule" }), "rule-edit": (el) => { const c = el.closest(".swipe-content"); if (c && c.classList.contains("open")) closeSwipes(); else { closeSwipes(); openForm({ mode: "rule", id: recId(el) }); } },
  "rule-archive": (el) => confirmSheet("Archive this rule? Records already generated stay untouched.", "Archive", () => { commit(() => { const r = state.recurringRules.find((x) => x.id === recId(el)); r.archived = true; r.active = false; r.pausedRanges.push({ from: todayStr(), to: null }); }); renderAll(); }),
  "rule-restore": (el) => { const id = recId(el); closeSwipes(); openDatePicker({ value: todayStr(), title: "Resume from", onSelect: (d) => { commit(() => { const r = state.recurringRules.find((x) => x.id === id); const open = r.pausedRanges.filter((p) => !p.to).pop(); if (open) open.to = d; r.archived = false; r.active = true; }); runReconcile(); renderAll(); toast("Rule resumed"); } }); },
  "rule-delete": (el) => confirmSheet("Delete this rule? Records already generated are kept.", "Delete", () => { commit(() => { state.recurringRules = state.recurringRules.filter((r) => r.id !== recId(el)); }); renderAll(); }),
  "form-cat-pick": () => { const cats = sortedCats(fm.type), cur = catOf(fm.catId); const list = cur && !cats.includes(cur) ? [cur].concat(cats) : cats;
    $("catPickGrid").innerHTML = list.map((c) => `<button type="button" class="chip cat-chip${c.id === fm.catId ? " active" : ""}" data-action="form-cat-select" data-cat="${esc(c.id)}"><span>${esc(c.icon)}</span><span>${esc(c.name)}</span></button>`).join("") || `<span class="muted">No ${fm.type} categories.</span>`; openDlg("catPickDialog"); },
  "form-cat-select": (el) => { fm.catId = el.dataset.cat; fm.subId = ""; fm.legacy = ""; closeDlg("catPickDialog"); renderForm(); },
  "cloud-restore": async () => { if (!cloud.col) return toast("Cloud copy is not available here."); const c = await cloudPull().catch(() => null); if (!c) return toast("No cloud copy yet.");
    confirmSheet(`Replace this device's data with the cloud copy (${c.records} records, ${c.at.slice(0, 16).replace("T", " ")})?`, "Restore", () => { applyCloud(c); toast("Restored from cloud copy"); }); },
  "add-currency": () => openCurrencyAdd(),
  "currency-pick": (el) => { const code = el.dataset.code; if (curOf(code)) return; commit(() => { state.currencies.push({ id: makeId("cur"), code, symbol: curSym(code), name: curName(code), custom: true }); state.settings.removedCurrencies = (state.settings.removedCurrencies || []).filter((x) => x !== code); }); closeDlg("currencyEditDialog"); renderAll(); toast(code + " added"); },
  "currency-default": (el) => { closeSwipes(); const c = curOf(el.dataset.code); if (c) setSetting("defaultCurrencyId", c.id); },
  "currency-delete": (el) => { closeSwipes(); const code = el.dataset.code, c = curOf(code); if (!c) return; const n = state.records.filter((r) => r.currencyCode === code).length;
    confirmSheet(n ? `${n} record(s) use ${code}. They keep their amounts; the currency just leaves your list.` : `Delete ${code}?`, "Delete", () => { commit(() => {
      state.currencies = state.currencies.filter((x) => x.id !== c.id); if (!c.custom && !state.settings.removedCurrencies.includes(code)) state.settings.removedCurrencies.push(code);
      if (state.settings.defaultCurrencyId === c.id) state.settings.defaultCurrencyId = state.currencies.find((x) => !x.generic)?.id || ""; }); renderAll(); toast("Currency deleted"); }); },
  "save-profile": () => {
    commit(() => { const s = state.settings; s.userName = $("profileNameInput").value.trim().slice(0, 20) || "Alex"; s.userId = $("profileIdInput").value.trim().replace(/\s+/g, "").slice(0, 24); if (prof.avatar) s.userAvatar = prof.avatar; });
    goBack(); toast("Profile saved");
  },
  "change-pin": () => showLock("verify", "Enter current PIN", () => showLock("set1", "Create a 4-digit PIN")),
  "logout": () => { if (!state.settings.lock.enabled) return toast("Turn on App Lock first. Log out only locks the app; your data is kept."); showLock("unlock", "Enter PIN"); },
  "lock-cancel": () => { hideLock(); renderAll(); }, "lock-recovery": () => { recoverPin(); }
};
function catMenu(id, x, y) {
  showCtx(x, y, [
    { label: "Edit Category & Subcategories", run: () => openCategoryEdit(id) },
    { label: "Add Subcategory", run: () => { openCategoryEdit(id); A["add-tag"](); } },
    { label: "Reorder Categories", run: () => { ui.homeEdit = true; renderAll(); } },
    { label: "Archive / Delete", danger: true, run: () => deleteOrArchive(id) }
  ]);
}
const segHandlers = {
  viewSeg: (s) => { ui.view = s.dataset.view; renderDetails(); },
  homeScope: (s) => { ui.homeScope = s.dataset.scope; renderHome(); },
  statsScope: (s) => { ui.statsScope = s.dataset.scope; renderStats(); },
  formTypeSeg: (s) => { if (fm.typeLocked) return; fm.type = s.dataset.type; const c = catOf(fm.catId); if (!c || c.kind !== fm.type) { fm.catId = sortedCats(fm.type)[0]?.id || null; fm.subId = ""; fm.legacy = ""; } renderForm(); },
  repeatKind: (s) => { if ($("repeatKind").classList.contains("locked")) return; fm.rep.kind = s.dataset.kind; renderForm(); },
  catKindSeg: (s) => { if (catDraft) { catDraft.kind = s.dataset.kind; renderCategoryEdit(); } },
  categoriesSegment: (s) => { ui.catFilter = s.dataset.filter; renderCategoriesPage(); },
  recurringSegment: (s) => { ui.ruleFilter = s.dataset.filter; renderRecurringPage(); }
};
function onClick(e) {
  const t = e.target;
  if (t.closest("[data-ctx]")) { const it = ctxItems[Number(t.closest("[data-ctx]").dataset.ctx)]; closeCtx(); if (it) it.run(); return; }
  if (t.closest("[data-sheet]")) { const it = sheetItems[Number(t.closest("[data-sheet]").dataset.sheet)]; closeSheet(); if (it) it.run(); return; }
  const pk = t.closest("[data-pin]"); if (pk) return void lockKey(pk.dataset.pin);
  if (t.closest(".row-handle")) return;
  const sw = t.closest(".swatch");
  if (sw) {
    const st = sw.parentElement.dataset.setting, v = sw.dataset.value;
    if (st === "themeColor" || st === "skinColor") setSetting(st, v); else if (st === "catColor" && catDraft) { catDraft.color = v; renderCategoryEdit(); }
    return;
  }
  const dd = t.closest("[data-dp-day]"); if (dd) return dpPick(dd.dataset.dpDay);
  const dm = t.closest("[data-dp-month]"); if (dm) { if (DP.o.mode === "month") return dpFinish(ymd(DP.y, Number(dm.dataset.dpMonth), 1)); DP.m = Number(dm.dataset.dpMonth); DP.view = "day"; return renderDP(); }
  const dy = t.closest("[data-dp-year]"); if (dy) { DP.y = Number(dy.dataset.dpYear); DP.view = "month"; return renderDP(); }
  const ic = t.closest("[data-icon]"); if (ic) { catDraft.icon = ic.dataset.icon; closeDlg("iconDialog"); return renderCategoryEdit(); }
  const fs = t.closest("[data-sub]"); if (fs && fs.closest("#formSubs")) { fm.subId = fm.subId === fs.dataset.sub ? "" : fs.dataset.sub; return renderForm(); }
  const tab = t.closest(".tab-item[data-tab]"); if (tab) return setTab(tab.dataset.tab);
  const chip = t.closest("#typeChips .chip"); if (chip) { ui.type = chip.dataset.type; return renderDetails(); }
  const seg = t.closest(".segment");
  if (seg) { const h = segHandlers[seg.parentElement.id]; if (h) h(seg); return; }
  const key = t.closest(".numpad-key");
  if (key && key.dataset.key !== undefined) { calcDigit(key.dataset.key); return updateNumpad(); }
  if (key && key.dataset.op) { calcOperator(key.dataset.op); return updateNumpad(); }
  const act = t.closest("[data-action]");
  if (act && A[act.dataset.action]) {
    if (Date.now() - swipeGuard < 350 && act.closest(".swipe-content")) return;
    A[act.dataset.action](act, e);
  }
}
function wire() {
  document.addEventListener("click", onClick);
  document.addEventListener("pointerdown", (e) => { if ($("ctxRoot").firstChild && !e.target.closest(".ctx-menu")) closeCtx(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCtx(); closeSheet(); } });
  enableSwipe($("recordList")); enableSwipe($("recurringList")); enableSwipe($("currencyList")); enableSwipe($("templateList"));
  makeSortable($("currencyList"), ".swipe-container", ".row-handle", (ids) => { commit(() => { const m = new Map(state.currencies.map((c) => [c.id, c])); state.currencies = ids.map((i) => m.get(i)).filter(Boolean).concat(state.currencies.filter((c) => !ids.includes(c.id))); }); renderAll(); });
  makeSortable($("templateList"), ".swipe-container", ".row-handle", (ids) => { commit(() => { const m = new Map(state.quickTemplates.map((t) => [t.id, t])); state.quickTemplates = ids.map((i) => m.get(i)).filter(Boolean).concat(state.quickTemplates.filter((t) => !ids.includes(t.id))); }); renderAll(); });
  makeSortable($("categoriesList"), ".row[data-id]", ".row-handle", (ids) => { commit(() => applyOrder(state.categories, ids)); renderAll(); });
  makeSortable($("tagList"), ".row[data-id]", ".row-handle", (ids) => { applyOrder(catDraft.tags.filter((t) => !t.archived), ids); renderCategoryEdit(); });
  makeSortable($("recurringList"), ".swipe-container", ".row-handle", (ids) => { commit(() => applyOrder(state.recurringRules.filter((r) => !r.archived), ids)); renderAll(); });
  ["expenseGrid", "incomeGrid"].forEach((gid) => {
    const grid = $(gid);
    makeSortable(grid, ".category-card", null, (ids) => { commit(() => applyOrder(state.categories, ids)); renderAll(); }, () => ui.homeEdit);
    grid.addEventListener("pointerdown", (e) => {
      const c = e.target.closest(".category-card"); if (!c || ui.homeEdit) return; const x = e.clientX, y = e.clientY;
      clearTimeout(lpTimer); lpTimer = setTimeout(() => { lpFired = Date.now(); catMenu(c.dataset.id, x, y); }, 450);
      const cancel = (ev) => { if (ev.type === "pointermove" && Math.hypot(ev.clientX - x, ev.clientY - y) < 8) return; clearTimeout(lpTimer); document.removeEventListener("pointermove", cancel); document.removeEventListener("pointerup", cancel); document.removeEventListener("pointercancel", cancel); };
      document.addEventListener("pointermove", cancel); document.addEventListener("pointerup", cancel); document.addEventListener("pointercancel", cancel);
    });
    grid.addEventListener("contextmenu", (e) => { const c = e.target.closest(".category-card"); if (c) { e.preventDefault(); lpFired = Date.now(); catMenu(c.dataset.id, e.clientX, e.clientY); } });
  });
  let dpx = null; const dg = $("dpGrid");
  dg.addEventListener("pointerdown", (e) => { dpx = e.clientX; });
  dg.addEventListener("pointerup", (e) => { if (dpx === null) return; const dx = e.clientX - dpx; dpx = null; if (Math.abs(dx) > 50) { swipeGuard = Date.now(); dpNav(dx < 0 ? 1 : -1); } });
  $("searchInput").addEventListener("input", (e) => { ui.search = e.target.value; renderDetails(); });
  $("filterCategory").addEventListener("change", (e) => { ui.fCat = e.target.value; ui.fTag = ""; renderDetails(); });
  $("filterTag").addEventListener("change", (e) => { ui.fTag = e.target.value; renderDetails(); });
  $("appearanceMode").addEventListener("change", (e) => setSetting("appearanceMode", e.target.value === "auto" ? "system" : e.target.value));
  $("fontSizeSelect").addEventListener("change", (e) => setSetting("fontSize", e.target.value));
  $("fontFormatSelect").addEventListener("change", (e) => setSetting("fontFormat", e.target.value));
  $("dateFormatSelect").addEventListener("change", (e) => setSetting("dateFormat", e.target.value));
  $("lockToggle").addEventListener("change", (e) => { if (e.target.checked) showLock("set1", "Create a 4-digit PIN"); else showLock("verify", "Enter PIN to turn off", () => { commit(() => { state.settings.lock = { enabled: false, salt: "", hash: "", recSalt: "", recHash: "" }; }); renderAll(); toast("App Lock off"); }); });
  const bi = $("budgetInput"); bi.addEventListener("change", () => endBudget(true)); bi.addEventListener("blur", () => endBudget(true)); bi.addEventListener("keydown", (e) => { if (e.key === "Enter") bi.blur(); else if (e.key === "Escape") endBudget(false); });
  $("formNote").addEventListener("input", () => $("toolNote").classList.toggle("on", !!$("formNote").value.trim()));
  $("repeatInterval").addEventListener("input", (e) => { fm.rep.interval = e.target.value; }); $("repeatFreq").addEventListener("change", (e) => { fm.rep.freq = e.target.value; });
  $("repeatTotal").addEventListener("input", (e) => { fm.rep.total = e.target.value; });
  $("tagList").addEventListener("input", (e) => { const i = e.target.closest(".tag-name"); if (i && catDraft) { const t = catDraft.tags.find((x) => x.id === i.dataset.id); if (t) t.name = i.value; } });
  $("restoreFileInput").addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) handleRestoreFile(f); e.target.value = ""; });
  ["photoCamera", "photoLibrary"].forEach((id) => $(id).addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) readImage(f, 1280, 0.7, (u) => { fm.photo = u; renderForm(); }); e.target.value = ""; }));
  $("profileAvatarInput").addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) readImage(f, 160, 0.8, (u) => { prof.avatar = u; $("profileAvatarBig").src = u; $("profileAvatarBig").classList.remove("hidden"); $("profileAvatarFallback").classList.add("hidden"); }); e.target.value = ""; });
  $("formEl").addEventListener("submit", (e) => e.preventDefault());
  $("curSearch").addEventListener("input", renderCurrencyAddList);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { runReconcile(); renderAll(); if (state.records.some((r) => r.currencyCode !== GEN && baseOf(r) === null)) fetchRates(); } });
  window.addEventListener("online", () => fetchRates());
}
function makeHomeIcon() {
  try {
    const c = document.createElement("canvas"); c.width = c.height = 180; const x = c.getContext("2d");
    x.fillStyle = "#3478F6"; x.fillRect(0, 0, 180, 180); x.fillStyle = "#fff"; const r = (a, b, w, h, k) => { x.beginPath(); x.roundRect ? x.roundRect(a, b, w, h, k) : x.rect(a, b, w, h); x.fill(); };
    r(35, 44, 110, 92, 10); x.fillStyle = "#3478F6"; x.fillRect(87, 44, 6, 92); [68, 88, 108].forEach((y) => { r(47, y, 34, 6, 3); r(99, y, 34, 6, 3); });
    const l = $("touchIcon"); if (l) l.href = c.toDataURL("image/png");
  } catch (e) { /* icon is cosmetic */ }
}
function init() {
  loadRatesCache(); state = loadState();
  const n = new Date(), mo = { y: n.getFullYear(), m: n.getMonth() + 1 };
  ui.homeMonth = { ...mo }; ui.detailsMonth = { ...mo }; ui.statsMonth = { ...mo };
  fixUnconverted(); runReconcile(); wire(); renderAll();
  if (state.settings.lock.enabled) showLock("unlock", "Enter PIN");
  fetchRates(); cloudInit(); makeHomeIcon();
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && document.querySelector('link[rel="manifest"]')) navigator.serviceWorker.register("sw.js").catch(() => {});
}
document.addEventListener("DOMContentLoaded", init);
