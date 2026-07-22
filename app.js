/* ================= نظام إدارة مخزون المصنع — المنطق الرئيسي ================= */

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ICONS = {
  package: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  alert: '<path d="M12 2 1 21h22L12 2Z"/><path d="M12 9v5"/><path d="M12 17.5h.01"/>',
  down: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6l4 2"/>',
  in: '<circle cx="12" cy="12" r="10"/><path d="M12 7v7M9 11l3 3 3-3"/>',
  out: '<circle cx="12" cy="12" r="10"/><path d="M12 17V10M9 13l3-3 3 3"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  minus: '<path d="M5 12h14"/>',
  history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
};
function icon(name, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

const CATS_FALLBACK = ["أقمشة", "خيوط", "أزرار وسحابات", "بطانات", "إكسسوارات", "أخرى"];

const state = {
  user: null, profile: null,
  settings: { workshop_name: "مصنع نسيج", logo_base64: null, alert_threshold_percent: 15, warning_threshold_percent: 30 },
  categories: [], items: [], transactions: [], profiles: [], auditLog: [],
  tab: "dashboard", selectedItem: null, pollTimer: null, lang: (localStorage.getItem("lang") || "ar"),
};

const I18N = {
  ar: {
    dir: "rtl", loginTitle: "تسجيل الدخول لإدارة المخازن", loginUser: "اسم المستخدم", loginPass: "كلمة المرور",
    loginBtn: "تسجيل الدخول", loginLoading: "...جارِ الدخول", loginError: "اسم المستخدم أو كلمة المرور غير صحيحة",
    navDashboard: "لوحة التحكم", navIn: "إدخال مخزون", navOut: "سحب من المخزن", navStock: "المخزون الحالي",
    navReports: "التقارير", navAudit: "سجل العمليات", navUsers: "إدارة المستخدمين", navSettings: "الإعدادات والأصناف",
    logout: "خروج",
  },
  tr: {
    dir: "ltr", loginTitle: "Depo Yönetimi Girişi", loginUser: "Kullanıcı Adı", loginPass: "Şifre",
    loginBtn: "Giriş Yap", loginLoading: "...Giriş yapılıyor", loginError: "Kullanıcı adı veya şifre hatalı",
    navDashboard: "Kontrol Paneli", navIn: "Stok Girişi", navOut: "Depodan Çıkış", navStock: "Mevcut Stok",
    navReports: "Raporlar", navAudit: "İşlem Kaydı", navUsers: "Kullanıcı Yönetimi", navSettings: "Ayarlar ve Ürünler",
    logout: "Çıkış",
  },
};
function t(key) { return (I18N[state.lang] && I18N[state.lang][key]) || I18N.ar[key] || key; }
function setLang(lang) {
  state.lang = lang; localStorage.setItem("lang", lang);
  document.documentElement.dir = I18N[lang].dir;
  document.documentElement.lang = lang;
  applyLoginTexts();
  const logoutBtn = $("#logout-btn"); if (logoutBtn) logoutBtn.textContent = t("logout");
  if (state.user) render();
}
function applyLoginTexts() {
  const subEl = $("#login-sub"); if (subEl) subEl.textContent = t("loginTitle");
  const uLbl = $("#login-user-label"); if (uLbl) uLbl.textContent = t("loginUser");
  const pLbl = $("#login-pass-label"); if (pLbl) pLbl.textContent = t("loginPass");
  const btn = $("#login-submit"); if (btn && !btn.disabled) btn.textContent = t("loginBtn");
  $$(".lang-btn").forEach(b => b.classList.toggle("active-lang", b.dataset.lang === state.lang));
}

function myRole() { return state.profile?.role || "keeper"; }
function isAdmin() { return myRole() === "admin"; }
function canEdit() { return myRole() === "admin" || myRole() === "keeper"; }
function deviceInfo() {
  const ua = navigator.userAgent || "";
  let dev = "جهاز غير معروف";
  if (/Mobi|Android/i.test(ua)) dev = "موبايل";
  else if (/Tablet|iPad/i.test(ua)) dev = "تابلت";
  else dev = "كمبيوتر";
  const browser = /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Safari/i.test(ua) ? "Safari" : /Edg/i.test(ua) ? "Edge" : "متصفح";
  return `${dev} · ${browser}`;
}
async function logAudit({ action, entity, entityName, qtyBefore, qtyAfter, details }) {
  try {
    await sb.from("audit_log").insert({
      actor_id: state.user?.id || null,
      actor_name: state.profile?.full_name || state.user?.email?.split("@")[0] || "غير معروف",
      action, entity: entity || null, entity_name: entityName || null,
      qty_before: qtyBefore ?? null, qty_after: qtyAfter ?? null,
      device: deviceInfo(), details: details || null,
    });
  } catch (e) { /* لا نوقف العملية الأساسية لو فشل تسجيل السجل */ }
}

/* ---------------- helpers ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function pctOf(item) { if (!item.max_qty || item.max_qty <= 0) return 100; return Math.max(0, Math.min(100, (item.qty / item.max_qty) * 100)); }
function statusOf(item) {
  const p = pctOf(item);
  const critT = (state.settings && state.settings.alert_threshold_percent) || 15;
  const warnT = (state.settings && state.settings.warning_threshold_percent) || 30;
  if (p <= critT) return "critical";
  if (p <= warnT) return "warning";
  return "ok";
}
const STATUS_META = {
  critical: { label: "حرج", cls: "pill-critical", color: "#B8433A" },
  warning: { label: "منخفض", cls: "pill-warning", color: "#C9971F" },
  ok: { label: "جيد", cls: "pill-ok", color: "#4C7A5E" },
};
function pill(status) {
  const m = STATUS_META[status];
  return `<span class="pill ${m.cls}"><span class="pill-dot" style="background:${m.color}"></span>${m.label}</span>`;
}
function tape(item, sm = false) {
  const p = pctOf(item), st = statusOf(item);
  return `<div class="tape ${sm ? "sm" : ""}"><div class="tape-fill" style="width:${p}%;background:${STATUS_META[st].color}"></div></div>`;
}
function toast(msg, err = false) {
  const el = document.createElement("div");
  el.className = "toast" + (err ? " err" : "");
  el.innerHTML = `${icon(err ? "alert" : "check", 16)}<span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/* ---------------- auth ---------------- */
async function tryLogin(username, password) {
  const email = username.trim().toLowerCase() + USERNAME_SUFFIX;
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
async function doLogout(reason) {
  await sb.auth.signOut();
  state.user = null; state.profile = null;
  clearInterval(state.pollTimer);
  clearInactivityTimer();
  showLogin();
  if (reason) { $("#login-error").textContent = reason; $("#login-error").classList.remove("hidden"); }
}

/* ---------------- تسجيل خروج تلقائي بعد عدم النشاط ---------------- */
const INACTIVITY_LIMIT_MS = 20 * 60 * 1000; // 20 دقيقة
let inactivityTimer = null;
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  if (!state.user) return;
  inactivityTimer = setTimeout(() => {
    doLogout("تم تسجيل الخروج تلقائيًا بعد فترة من عدم النشاط. سجّل دخولك مرة أخرى للمتابعة.");
  }, INACTIVITY_LIMIT_MS);
}
function clearInactivityTimer() { clearTimeout(inactivityTimer); }
["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(evt => {
  document.addEventListener(evt, () => { if (state.user) resetInactivityTimer(); }, { passive: true });
});

/* ---------------- data loading ---------------- */
async function loadSettings() {
  const { data } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
  if (data) state.settings = data;
}
async function loadCategories() {
  const { data } = await sb.from("categories").select("*").order("name");
  state.categories = (data && data.length) ? data.map(c => c.name) : CATS_FALLBACK;
}
async function loadItems() {
  const { data } = await sb.from("items").select("*").order("name");
  state.items = data || [];
}
async function loadTransactions() {
  const { data } = await sb.from("transactions").select("*").order("created_at", { ascending: false }).limit(300);
  state.transactions = data || [];
}
async function loadProfile() {
  const { data } = await sb.from("profiles").select("*").eq("id", state.user.id).maybeSingle();
  state.profile = data;
}
async function loadProfiles() {
  const { data } = await sb.from("profiles").select("*").order("full_name");
  state.profiles = data || [];
}
async function loadAuditLog() {
  const { data } = await sb.from("audit_log").select("*").order("created_at", { ascending: false }).limit(300);
  state.auditLog = data || [];
}
async function loadAll() {
  await Promise.all([loadSettings(), loadCategories(), loadItems(), loadTransactions(), loadProfile()]);
  await Promise.all([loadProfiles(), loadAuditLog()]);
}

/* ---------------- app boot ---------------- */
async function boot() {
  await loadSettingsForLogin();
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    state.user = session.user;
    await loadAll();
    if (state.profile && state.profile.is_active === false) {
      await sb.auth.signOut();
      state.user = null; state.profile = null;
      showLogin();
      $("#login-error").textContent = "هذا الحساب موقوف حاليًا. تواصل مع مدير النظام.";
      $("#login-error").classList.remove("hidden");
    } else {
      showApp();
    }
  } else {
    showLogin();
  }
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") { showLogin(); }
  });
}
async function loadSettingsForLogin() {
  try { await loadSettings(); } catch (e) {}
  applyBranding();
}
function applyBranding() {
  const name = state.settings.workshop_name || "مصنع نسيج";
  const logo = state.settings.logo_base64;
  $("#login-name").textContent = name;
  $("#brand-name").textContent = name;
  document.title = name + " — إدارة المخزون";
  const loginLogo = $("#login-logo"), sideLogo = $("#side-logo");
  loginLogo.innerHTML = logo ? `<img src="${logo}">` : icon("scissors", 30);
  sideLogo.innerHTML = logo ? `<img src="${logo}">` : icon("scissors", 19);
}

function showLogin() {
  $("#login-screen").classList.remove("hidden");
  $("#app-shell").classList.add("hidden");
  $("#login-error").classList.add("hidden");
}
function showApp() {
  $("#login-screen").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  applyBranding();
  const wname = state.profile?.full_name || state.user.email.split("@")[0];
  $("#who-name").textContent = wname;
  $("#logout-btn").textContent = t("logout");
  $$(".lang-btn").forEach(b => b.classList.toggle("active-lang", b.dataset.lang === state.lang));
  render();
  resetInactivityTimer();
  clearInterval(state.pollTimer);
  state.pollTimer = setInterval(async () => {
    if (document.querySelector(".modal-overlay")) return;
    await Promise.all([loadItems(), loadTransactions()]);
    render();
  }, 25000);
}

/* ---------------- nav ---------------- */
const NAV = [
  { id: "dashboard", labelKey: "navDashboard", icon: "grid", roles: ["admin", "keeper", "viewer"] },
  { id: "in", labelKey: "navIn", icon: "in", roles: ["admin", "keeper"] },
  { id: "out", labelKey: "navOut", icon: "out", roles: ["admin", "keeper"] },
  { id: "stock", labelKey: "navStock", icon: "package", roles: ["admin", "keeper", "viewer"] },
  { id: "reports", labelKey: "navReports", icon: "chart", roles: ["admin", "keeper", "viewer"] },
  { id: "audit", labelKey: "navAudit", icon: "history", roles: ["admin", "keeper", "viewer"] },
  { id: "users", labelKey: "navUsers", icon: "gear", roles: ["admin"] },
  { id: "settings", labelKey: "navSettings", icon: "gear", roles: ["admin", "keeper"] },
];
function renderNav() {
  const critical = state.items.filter(i => statusOf(i) === "critical").length;
  const visible = NAV.filter(n => n.roles.includes(myRole()));
  $("#nav-list").innerHTML = visible.map(n => `
    <button class="nav-btn ${state.tab === n.id ? "active" : ""}" data-tab="${n.id}">
      ${icon(n.icon, 18)}<span>${t(n.labelKey)}</span>
      ${n.id === "dashboard" && critical ? `<span class="badge">${critical}</span>` : ""}
    </button>`).join("");
  $$(".nav-btn").forEach(b => b.onclick = async () => {
    state.tab = b.dataset.tab; state.selectedItem = null;
    if (state.tab === "audit") await loadAuditLog();
    if (state.tab === "users") await loadProfiles();
    render();
  });
  const roleLabels = { admin: "مدير النظام", keeper: "أمين مخزن", viewer: "موظف (قراءة فقط)" };
  const roleTag = $("#who-role"); if (roleTag) roleTag.textContent = roleLabels[myRole()] || "";
}

/* ---------------- render dispatcher ---------------- */
function render() {
  renderNav();
  const critItems = state.items.filter(i => statusOf(i) === "critical");
  const banner = $("#alert-banner");
  if (critItems.length) {
    banner.classList.remove("hidden");
    banner.innerHTML = `${icon("alert", 17)} تنبيه: ${critItems.length} صنف وصل إلى أقل من ${state.settings.alert_threshold_percent || 15}% من الحد الأقصى للمخزون — ${critItems.slice(0, 4).map(i => i.name).join("، ")}${critItems.length > 4 ? " ..." : ""}`;
  } else banner.classList.add("hidden");

  const main = $("#main");
  const allowed = NAV.find(n => n.id === state.tab);
  if (!allowed || !allowed.roles.includes(myRole())) state.tab = "dashboard";
  if (state.tab === "dashboard") renderDashboard(main);
  else if (state.tab === "in") renderMove(main, "in");
  else if (state.tab === "out") renderMove(main, "out");
  else if (state.tab === "stock") renderStock(main);
  else if (state.tab === "reports") renderReports(main);
  else if (state.tab === "audit") renderAudit(main);
  else if (state.tab === "users") renderUsers(main);
  else if (state.tab === "settings") renderSettings(main);
}

/* ---------------- dashboard ---------------- */
function renderDashboard(main) {
  const items = state.items, tx = state.transactions;
  const critical = items.filter(i => statusOf(i) === "critical");
  const warning = items.filter(i => statusOf(i) === "warning");
  const todayStr = new Date().toDateString();
  const todayTx = tx.filter(t => new Date(t.created_at).toDateString() === todayStr);
  const todayIn = todayTx.filter(t => t.type === "in").length;
  const todayOut = todayTx.filter(t => t.type === "out").length;

  const stats = [
    { label: "إجمالي الأصناف", value: items.length, icon: "package", color: "var(--ink)" },
    { label: `أصناف حرجة (أقل من ${state.settings.alert_threshold_percent || 15}%)`, value: critical.length, icon: "alert", color: "var(--red)" },
    { label: "عمليات إدخال اليوم", value: todayIn, icon: "in", color: "var(--green)" },
    { label: "عمليات سحب اليوم", value: todayOut, icon: "out", color: "#8A6A16" },
  ];

  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">لوحة التحكم</div><div class="section-sub">نظرة سريعة على حالة المخزن اليوم</div></div></div>
    <div class="stats-grid">
      ${stats.map(s => `<div class="card"><div style="color:${s.color}">${icon(s.icon, 20)}</div><div class="stat-value" style="color:${s.color}">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join("")}
    </div>
    <div style="display:grid; grid-template-columns:1.3fr 1fr; gap:16px;">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-weight:800; font-size:15px;">أصناف تحتاج انتباه فوري</div>
          <button class="link-btn" data-goto="stock">عرض كل المخزون</button>
        </div>
        ${critical.length === 0 && warning.length === 0 ? `<div class="empty-note">لا توجد أصناف منخفضة حاليًا — كل شيء ضمن الحدود الآمنة.</div>` :
      `<div style="display:flex; flex-direction:column; gap:10px;">
          ${[...critical, ...warning].slice(0, 7).map(it => `
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:130px; font-size:13.5px; font-weight:700; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${it.name}</div>
              <div style="flex:1;">${tape(it, true)}</div>
              <div class="mono" style="width:70px; font-size:12px; color:var(--ink70);">${it.qty}/${it.max_qty}</div>
              ${pill(statusOf(it))}
            </div>`).join("")}
        </div>`}
      </div>
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-weight:800; font-size:15px;">آخر الحركات</div>
          <button class="link-btn" data-goto="reports">كل التقارير</button>
        </div>
        ${tx.length === 0 ? `<div class="empty-note">لا توجد حركات مسجّلة بعد.</div>` :
      `<div style="display:flex; flex-direction:column; gap:9px;">
          ${tx.slice(0, 8).map(t => `
            <div style="display:flex; align-items:center; gap:9px; font-size:12.8px;">
              ${icon(t.type === "in" ? "in" : "out", 15)}
              <span style="font-weight:700; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.item_name}</span>
              <span class="mono" style="color:var(--ink70)">${t.type === "in" ? "+" : "-"}${t.qty} ${t.unit || ""}</span>
            </div>`).join("")}
        </div>`}
      </div>
    </div>`;
  $$("[data-goto]").forEach(b => b.onclick = () => { state.tab = b.dataset.goto; render(); });
}

/* ---------------- stock in / out ---------------- */
function renderMove(main, mode) {
  const isIn = mode === "in";
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">${isIn ? "إدخال مخزون" : "سحب من المخزن"}</div>
    <div class="section-sub">${isIn ? "أضف كمية جديدة وصلت للمصنع" : "اسحب المواد التي تحتاجها للعمل مباشرة"}</div></div></div>
    <div id="move-body"></div>`;
  renderMoveBody(mode);
}
function renderMoveBody(mode) {
  const body = $("#move-body");
  const isIn = mode === "in";
  if (!state.selectedItem) {
    body.innerHTML = `
      <div style="position:relative; margin-bottom:16px; max-width:420px;">
        <span style="position:absolute; right:14px; top:11px; color:var(--ink50);">${icon("search", 16)}</span>
        <input id="move-search" class="input" style="width:100%; padding-right:38px;" placeholder="ابحث عن الصنف بالاسم أو الفئة...">
      </div>
      <div id="move-groups"></div>`;
    const renderTiles = () => {
      const q = ($("#move-search").value || "").toLowerCase();
      const filtered = state.items.filter(i => i.name.toLowerCase().includes(q) || (i.category || "").includes(q) || (i.code || "").toLowerCase().includes(q));
      if (!filtered.length) {
        $("#move-groups").innerHTML = `
          <div class="empty-note">لا توجد أصناف مطابقة لـ "${$("#move-search").value}".</div>
          <button class="btn-dark" id="quick-add-item">${icon("plus", 14)} إضافة صنف جديد باسم "${$("#move-search").value}"</button>`;
        const qa = $("#quick-add-item");
        if (qa) qa.onclick = () => openItemModal(null, $("#move-search").value, () => renderMoveBody(mode));
        return;
      }
      // تجميع الأصناف تحت عناوين الفئات (مثال: خيوط -> كل أنواع الخيوط تحتها)
      const groups = {};
      filtered.forEach(it => { const c = it.category || "بدون فئة"; (groups[c] = groups[c] || []).push(it); });
      $("#move-groups").innerHTML = Object.entries(groups).map(([cat, catItems]) => `
        <div style="margin-bottom:22px;">
          <div style="font-weight:800; font-size:14px; color:var(--ink); margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid var(--mustard); display:inline-block;">${cat} <span style="color:var(--ink50); font-weight:600; font-size:12px;">(${catItems.length})</span></div>
          <div class="tile-grid">
            ${catItems.map(it => `
              <button class="tile" data-id="${it.id}">
                <div class="tile-head"><div style="font-weight:700; font-size:13.8px;">${it.name}</div>${pill(statusOf(it))}</div>
                ${tape(it, true)}
                <div class="tile-qty mono">${it.qty} / ${it.max_qty} ${it.unit}</div>
              </button>`).join("")}
          </div>
        </div>`).join("");
      $$(".tile", $("#move-groups")).forEach(t => t.onclick = () => { state.selectedItem = { ...state.items.find(i => i.id === t.dataset.id), qty_input: 1 }; renderMoveBody(mode); });
    };
    $("#move-search").oninput = renderTiles;
    renderTiles();
    return;
  }

  const sel = state.selectedItem;
  const resultQty = isIn ? sel.qty + sel.qty_input : Math.max(0, sel.qty - sel.qty_input);
  const willCrit = sel.max_qty > 0 && (resultQty / sel.max_qty) * 100 <= (state.settings.alert_threshold_percent || 15);
  body.innerHTML = `
    <div class="card move-panel">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div><div style="font-weight:800; font-size:17px;">${sel.name}</div><div style="font-size:12.5px; color:var(--ink70);">${sel.category || "—"} · المتوفر حاليًا: ${sel.qty} ${sel.unit}</div></div>
        <button class="close-x" id="move-cancel">${icon("x", 16)}</button>
      </div>
      ${tape(sel)}
      <div style="margin:18px 0;">
        <label style="display:block; font-size:12.5px; font-weight:700; color:var(--ink70); margin-bottom:6px;">الكمية</label>
        <div class="step-row">
          <button class="step-btn" id="qty-minus">${icon("minus", 16)}</button>
          <input id="qty-input" type="number" min="1" value="${sel.qty_input}" class="input mono" style="width:90px; text-align:center;">
          <button class="step-btn" id="qty-plus">${icon("plus", 16)}</button>
          <span style="color:var(--ink70); font-size:13px;">${sel.unit}</span>
        </div>
      </div>
      ${!isIn ? `<div class="field"><label>اسم العامل *</label><input id="worker-input" class="input" style="width:100%;" value="${state.profile?.full_name || ""}" placeholder="مثال: أحمد محمد"></div>` : ""}
      <div class="field"><label>ملاحظة (اختياري)</label><input id="note-input" class="input" style="width:100%;" placeholder="${isIn ? "مثال: توريد جديد من المورد" : "مثال: لتفصيلة قميص رجالي"}"></div>
      ${willCrit ? `<div style="display:flex; gap:8px; align-items:center; background:var(--red-soft); color:var(--red); padding:9px 12px; border-radius:10px; font-size:12.5px; font-weight:700; margin-bottom:14px;">${icon("alert", 15)} بعد هذه العملية سيصبح الصنف ضمن المستوى الحرج (أقل من ${state.settings.alert_threshold_percent || 15}%)</div>` : ""}
      <button class="btn-primary" id="move-submit" style="background:${isIn ? "var(--green)" : "var(--ink)"}; display:flex; align-items:center; justify-content:center; gap:8px;">
        ${icon(isIn ? "in" : "out", 18)} ${isIn ? "تأكيد الإدخال" : "تأكيد السحب"}
      </button>
    </div>`;

  $("#move-cancel").onclick = () => { state.selectedItem = null; renderMoveBody(mode); };
  $("#qty-minus").onclick = () => { sel.qty_input = Math.max(1, sel.qty_input - 1); renderMoveBody(mode); };
  $("#qty-plus").onclick = () => { sel.qty_input = sel.qty_input + 1; renderMoveBody(mode); };
  $("#qty-input").onchange = (e) => { sel.qty_input = Math.max(1, Number(e.target.value) || 1); renderMoveBody(mode); };
  $("#move-submit").onclick = async () => {
    const qty = sel.qty_input;
    const worker = isIn ? "" : ($("#worker-input")?.value || "").trim();
    const note = ($("#note-input")?.value || "").trim();
    if (qty <= 0) { toast("أدخل كمية أكبر من صفر", true); return; }
    if (!isIn && qty > sel.qty) { toast("الكمية المطلوبة أكبر من المتوفر بالمخزن", true); return; }
    if (!isIn && !worker) { toast("يرجى إدخال اسم العامل الذي يسحب المادة", true); return; }
    const newQty = isIn ? sel.qty + qty : Math.max(0, sel.qty - qty);
    const { error: e1 } = await sb.from("items").update({ qty: newQty }).eq("id", sel.id);
    if (e1) { toast("حدث خطأ أثناء الحفظ", true); return; }
    await sb.from("transactions").insert({
      item_id: sel.id, item_name: sel.name, unit: sel.unit, type: mode, qty, worker, note,
    });
    logAudit({
      action: isIn ? "إدخال" : "صرف", entity: "item", entityName: sel.name,
      qtyBefore: sel.qty, qtyAfter: newQty,
      details: worker ? `بمعرفة: ${worker}${note ? " — " + note : ""}` : (note || null),
    });
    toast(isIn ? `تم إدخال ${qty} ${sel.unit} إلى "${sel.name}"` : `تم سحب ${qty} ${sel.unit} من "${sel.name}"`);
    state.selectedItem = null;
    await Promise.all([loadItems(), loadTransactions()]);
    render();
  };
}

/* ---------------- stock table ---------------- */
function renderStock(main) {
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">المخزون الحالي</div><div class="section-sub">${state.items.length} صنف مسجّل بالمخزن</div></div></div>
    <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
      <div style="position:relative;"><span style="position:absolute; right:12px; top:11px; color:var(--ink50);">${icon("search", 15)}</span>
        <input id="stock-search" class="input" style="width:240px; padding-right:34px;" placeholder="ابحث بالاسم أو الكود..."></div>
      <select id="stock-cat" class="input"><option>الكل</option>${state.categories.map(c => `<option>${c}</option>`).join("")}</select>
    </div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>الكود</th><th>الصنف</th><th>الفئة</th><th>الكمية</th><th>نسبة الامتلاء</th><th>الحالة</th></tr></thead><tbody id="stock-body"></tbody></table>
    </div>`;
  const draw = () => {
    const q = ($("#stock-search").value || "").toLowerCase();
    const cat = $("#stock-cat").value;
    const filtered = state.items.filter(i => (cat === "الكل" || i.category === cat) && (i.name.toLowerCase().includes(q) || (i.code || "").toLowerCase().includes(q)));
    if (!filtered.length) { $("#stock-body").innerHTML = `<tr><td colspan="6"><div class="empty-note">لا توجد نتائج مطابقة.</div></td></tr>`; return; }
    const groups = {};
    filtered.forEach(it => { const c = it.category || "بدون فئة"; (groups[c] = groups[c] || []).push(it); });
    $("#stock-body").innerHTML = Object.entries(groups).map(([catName, catItems]) => `
      <tr><td colspan="6" style="background:var(--paper-deep); font-weight:800; font-size:12.5px; padding:8px 16px; border-top:2px solid var(--mustard);">${catName} <span style="font-weight:600; color:var(--ink50); font-size:11.5px;">(${catItems.length} صنف)</span></td></tr>
      ${catItems.map(it => `
        <tr><td class="mono" style="color:var(--mustard); font-weight:700;">${it.code || "—"}</td><td style="font-weight:700; padding-right:26px;">${it.name}</td><td style="color:var(--ink70);">${it.category || "—"}</td>
        <td class="mono">${it.qty} / ${it.max_qty} ${it.unit}</td><td style="width:200px;">${tape(it, true)}</td><td>${pill(statusOf(it))}</td></tr>`).join("")}
    `).join("");
  };
  $("#stock-search").oninput = draw; $("#stock-cat").onchange = draw; draw();
}

/* ---------------- reports ---------------- */
function renderReports(main) {
  const genTime = fmtDate(new Date().toISOString());
  main.innerHTML = `
    <div class="section-header no-print">
      <div><div class="section-title">التقارير</div><div class="section-sub">تغطية كاملة لحركة المخزن والأصناف المنخفضة</div></div>
      <div style="display:flex; gap:8px;">
        <button class="btn-dark" id="print-report">${icon("history", 14)} طباعة / PDF</button>
        <button class="btn-dark" id="export-excel">${icon("download", 14)} تصدير Excel</button>
      </div>
    </div>

    <div id="report-print-area">
      <div class="print-only print-header">
        <div style="font-weight:800; font-size:18px;">${state.settings.workshop_name || "مصنع نسيج"} — تقرير المخزون</div>
        <div style="font-size:12px; color:#555;">تم إنشاء التقرير في: ${genTime}</div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div style="font-weight:800; font-size:15px; margin-bottom:12px; display:flex; align-items:center; gap:7px;">${icon("alert", 16)} تقرير الأصناف المنخفضة والحرجة</div>
        <div id="low-stock-list"></div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div style="font-weight:800; font-size:15px; margin-bottom:14px;">الأصناف الأكثر سحبًا (إجمالي الاستهلاك)</div>
        <div id="consumption-list"></div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div style="font-weight:800; font-size:15px; margin-bottom:14px;">الملخص اليومي (الإدخال والسحب لكل يوم)</div>
        <div style="overflow:auto;"><table><thead><tr><th>اليوم</th><th>عدد عمليات الإدخال</th><th>إجمالي الكمية المُدخلة</th><th>عدد عمليات السحب</th><th>إجمالي الكمية المسحوبة</th></tr></thead><tbody id="daily-body"></tbody></table></div>
      </div>

      <div class="card">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
          <div style="font-weight:800; font-size:15px; display:flex; align-items:center; gap:7px;">${icon("history", 16)} سجل جميع الحركات (بالتاريخ والساعة)</div>
          <div class="no-print" style="display:flex; gap:8px;">
            <select id="range-filter" class="input" style="font-size:12.5px; padding:7px 10px;">
              <option value="all">كل الفترات</option><option value="today">اليوم</option><option value="week">آخر أسبوع</option><option value="month">آخر شهر</option>
            </select>
            <select id="type-filter" class="input" style="font-size:12.5px; padding:7px 10px;">
              <option value="all">الكل</option><option value="in">إدخال فقط</option><option value="out">سحب فقط</option>
            </select>
          </div>
        </div>
        <div style="max-height:340px; overflow:auto;" class="print-scroll">
          <table><thead><tr><th>الصنف</th><th>النوع</th><th>الكمية</th><th>العامل</th><th>ملاحظة</th><th>التاريخ والساعة</th></tr></thead><tbody id="tx-body"></tbody></table>
        </div>
      </div>
    </div>`;

  // الملخص اليومي: تجميع الحركات حسب اليوم (الوقت الدقيق لكل حركة يظهر بسجل الحركات بالأسفل)
  const dailyMap = {};
  state.transactions.forEach(t => {
    const day = new Date(t.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit" });
    if (!dailyMap[day]) dailyMap[day] = { inCount: 0, inQty: 0, outCount: 0, outQty: 0 };
    if (t.type === "in") { dailyMap[day].inCount++; dailyMap[day].inQty += Number(t.qty); }
    else { dailyMap[day].outCount++; dailyMap[day].outQty += Number(t.qty); }
  });
  const dailyRows = Object.entries(dailyMap).sort((a, b) => b[0].localeCompare(a[0]));
  $("#daily-body").innerHTML = dailyRows.length ? dailyRows.map(([day, d]) => `
    <tr><td style="font-weight:700;" class="mono">${day}</td><td class="mono">${d.inCount}</td><td class="mono" style="color:var(--green);">+${d.inQty}</td>
    <td class="mono">${d.outCount}</td><td class="mono" style="color:var(--red);">-${d.outQty}</td></tr>`).join("")
    : `<tr><td colspan="5"><div class="empty-note">لا توجد حركات مسجّلة بعد.</div></td></tr>`;

  const lowStock = state.items.filter(i => statusOf(i) !== "ok").sort((a, b) => pctOf(a) - pctOf(b));
  $("#low-stock-list").innerHTML = lowStock.length ? lowStock.map(it => `
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:9px;">
      <div style="width:160px; font-size:13.3px; font-weight:700;">${it.name}</div>
      <div style="flex:1;">${tape(it, true)}</div>
      <div class="mono" style="width:110px; font-size:12px; color:var(--ink70);">${Math.round(pctOf(it))}% (${it.qty}/${it.max_qty})</div>
      ${pill(statusOf(it))}
    </div>`).join("") : `<div class="empty-note">لا توجد أصناف منخفضة حاليًا.</div>`;

  const consMap = {};
  state.transactions.filter(t => t.type === "out").forEach(t => { consMap[t.item_name] = (consMap[t.item_name] || 0) + Number(t.qty); });
  const cons = Object.entries(consMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCons = Math.max(1, ...cons.map(c => c[1]));
  $("#consumption-list").innerHTML = cons.length ? cons.map(([name, val]) => `
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
      <div style="width:160px; font-size:13px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</div>
      <div style="flex:1; background:var(--paper-deep); border-radius:8px; height:16px; position:relative; overflow:hidden;">
        <div style="position:absolute; inset:0; width:${(val / maxCons) * 100}%; background:var(--mustard); border-radius:8px;"></div>
      </div>
      <div class="mono" style="width:46px; font-size:12.5px; font-weight:700;">${val}</div>
    </div>`).join("") : `<div class="empty-note">لا توجد عمليات سحب مسجّلة بعد.</div>`;

  const drawTx = () => {
    const range = $("#range-filter").value, type = $("#type-filter").value;
    let cutoff = null;
    const d = new Date();
    if (range === "today") d.setHours(0, 0, 0, 0);
    else if (range === "week") d.setDate(d.getDate() - 7);
    else if (range === "month") d.setMonth(d.getMonth() - 1);
    if (range !== "all") cutoff = d;
    const filtered = state.transactions.filter(t => (!cutoff || new Date(t.created_at) >= cutoff) && (type === "all" || t.type === type));
    $("#tx-body").innerHTML = filtered.length ? filtered.map(t => `
      <tr><td style="font-weight:700;">${t.item_name}</td>
      <td>${t.type === "in" ? '<span style="color:var(--green); font-weight:700;">إدخال</span>' : '<span style="color:var(--red); font-weight:700;">سحب</span>'}</td>
      <td class="mono">${t.qty} ${t.unit || ""}</td><td>${t.worker || "—"}</td><td style="color:var(--ink70);">${t.note || "—"}</td>
      <td class="mono" style="color:var(--ink70);">${fmtDate(t.created_at)}</td></tr>`).join("") : `<tr><td colspan="6"><div class="empty-note">لا توجد حركات ضمن هذا الفلتر.</div></td></tr>`;
    return filtered;
  };
  let currentFiltered = drawTx();
  $("#range-filter").onchange = () => { currentFiltered = drawTx(); };
  $("#type-filter").onchange = () => { currentFiltered = drawTx(); };

  $("#print-report").onclick = () => window.print();

  $("#export-excel").onclick = () => {
    const genTime2 = fmtDate(new Date().toISOString());
    const wb = XLSX.utils.book_new();

    // ورقة: المخزون الحالي
    const stockRows = state.items.map(it => ({
      "الصنف": it.name, "الفئة": it.category || "", "الوحدة": it.unit,
      "الكمية الحالية": it.qty, "الحد الأقصى": it.max_qty,
      "النسبة %": Math.round(pctOf(it)), "الحالة": STATUS_META[statusOf(it)].label,
    }));
    const ws1 = XLSX.utils.json_to_sheet(stockRows);
    XLSX.utils.book_append_sheet(wb, ws1, "المخزون الحالي");

    // ورقة: الملخص اليومي
    const dailySheetRows = dailyRows.map(([day, d]) => ({
      "اليوم": day, "عدد عمليات الإدخال": d.inCount, "إجمالي الكمية المُدخلة": d.inQty,
      "عدد عمليات السحب": d.outCount, "إجمالي الكمية المسحوبة": d.outQty,
    }));
    const ws2 = XLSX.utils.json_to_sheet(dailySheetRows);
    XLSX.utils.book_append_sheet(wb, ws2, "الملخص اليومي");

    // ورقة: سجل الحركات (بالتاريخ والساعة)
    const txRows = currentFiltered.map(t => ({
      "الصنف": t.item_name, "النوع": t.type === "in" ? "إدخال" : "سحب", "الكمية": t.qty,
      "الوحدة": t.unit || "", "العامل": t.worker || "", "ملاحظة": t.note || "",
      "التاريخ والساعة": fmtDate(t.created_at),
    }));
    const ws3 = XLSX.utils.json_to_sheet(txRows.length ? txRows : [{ "ملاحظة": "لا توجد حركات ضمن هذا الفلتر" }]);
    XLSX.utils.book_append_sheet(wb, ws3, "سجل الحركات");

    // ورقة: معلومات التقرير
    const ws4 = XLSX.utils.json_to_sheet([{ "المصنع": state.settings.workshop_name || "", "تاريخ إنشاء التقرير": genTime2 }]);
    XLSX.utils.book_append_sheet(wb, ws4, "معلومات التقرير");

    XLSX.writeFile(wb, `تقرير_المخزون_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
}

/* ---------------- settings (branding + categories + items) ---------------- */
function renderSettings(main) {
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">الإعدادات والأصناف</div><div class="section-sub">اسم المصنع، الشعار، أنواع المنتجات، وإدارة الأصناف</div></div></div>

    ${isAdmin() ? `
    <div class="card" style="margin-bottom:18px; max-width:480px;">
      <div style="font-weight:800; font-size:15px; margin-bottom:14px;">بيانات المصنع</div>
      <div class="field"><label>اسم المصنع</label><input id="ws-name" class="input" style="width:100%;" value="${state.settings.workshop_name || ""}"></div>
      <div class="field">
        <label>شعار المصنع</label>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:52px; height:52px; border-radius:12px; background:var(--mustard); display:flex; align-items:center; justify-content:center; overflow:hidden;">
            ${state.settings.logo_base64 ? `<img src="${state.settings.logo_base64}" style="width:100%; height:100%; object-fit:cover;">` : icon("scissors", 24)}
          </div>
          <input id="ws-logo" type="file" accept="image/*">
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;"><label>عنوان المصنع</label><input id="ws-address" class="input" style="width:100%;" value="${state.settings.address || ""}"></div>
        <div class="field" style="flex:1;"><label>رقم الهاتف</label><input id="ws-phone" class="input" style="width:100%;" value="${state.settings.phone || ""}"></div>
      </div>
      <div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;"><label>نسبة التنبيه الحرج %</label><input id="ws-crit" type="number" min="1" max="90" class="input mono" style="width:100%;" value="${state.settings.alert_threshold_percent || 15}"></div>
        <div class="field" style="flex:1;"><label>نسبة تنبيه "منخفض" %</label><input id="ws-warn" type="number" min="1" max="95" class="input mono" style="width:100%;" value="${state.settings.warning_threshold_percent || 30}"></div>
      </div>
      <button class="btn-primary" id="ws-save">حفظ بيانات المصنع</button>
    </div>` : `
    <div class="card" style="margin-bottom:18px; max-width:480px;">
      <div style="font-size:12.5px; color:var(--ink70);">بيانات المصنع (الاسم، الشعار، نسب التنبيه) يتحكم بيها مدير النظام فقط. تقدر تدير الفئات والأصناف تحت.</div>
    </div>`}

    <div class="card" style="margin-bottom:18px; max-width:480px;">
      <div style="font-weight:800; font-size:15px; margin-bottom:14px;">أنواع المنتجات (الفئات)</div>
      <div id="cat-chips" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px;"></div>
      <div style="display:flex; gap:8px;">
        <input id="new-cat" class="input" style="flex:1;" placeholder="اسم فئة جديدة، مثال: خامات تطريز">
        <button class="btn-dark" id="add-cat">${icon("plus", 14)} إضافة</button>
      </div>
    </div>

    <div class="section-header"><div style="font-weight:800; font-size:16px;">إدارة الأصناف</div>
      <button class="btn-dark" id="new-item-btn">${icon("plus", 15)} صنف جديد</button></div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>الكود</th><th>الصنف</th><th>الفئة</th><th>الوحدة</th><th>الكمية الحالية</th><th>الحد الأقصى</th><th></th></tr></thead><tbody id="items-body"></tbody></table>
    </div>`;

  // branding (admin only — القسم ده أصلًا مش ظاهر في الواجهة لغير المدير)
  if (isAdmin()) {
    let logoData = state.settings.logo_base64 || null;
    $("#ws-logo").onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { logoData = reader.result; toast("تم اختيار الشعار — اضغط حفظ لتأكيده"); };
      reader.readAsDataURL(file);
    };
    $("#ws-save").onclick = async () => {
      const name = $("#ws-name").value.trim() || "مصنع نسيج";
      const payload = {
        workshop_name: name, logo_base64: logoData,
        address: $("#ws-address").value.trim(), phone: $("#ws-phone").value.trim(),
        alert_threshold_percent: Number($("#ws-crit").value) || 15,
        warning_threshold_percent: Number($("#ws-warn").value) || 30,
        updated_at: new Date().toISOString(),
      };
      const { error } = await sb.from("settings").update(payload).eq("id", 1);
      if (error) { toast("تعذر حفظ الإعدادات", true); return; }
      await loadSettings(); applyBranding(); logAudit({ action: "تعديل إعدادات المصنع", entity: "settings" }); toast("تم حفظ بيانات المصنع");
    };
  }

  // categories (متاحة للمدير وأمين المخزن)
  const drawCats = () => {
    $("#cat-chips").innerHTML = state.categories.map(c => `<span class="chip">${c}<button data-cat="${c}">${icon("x", 12)}</button></span>`).join("");
    $$("[data-cat]").forEach(b => b.onclick = async () => {
      if (!confirm(`حذف فئة "${b.dataset.cat}"؟ (لن يتأثر الأصناف الموجودة بها)`)) return;
      await sb.from("categories").delete().eq("name", b.dataset.cat);
      logAudit({ action: "حذف فئة", entity: "category", entityName: b.dataset.cat });
      await loadCategories(); renderSettings(main);
    });
  };
  drawCats();
  $("#add-cat").onclick = async () => {
    const val = $("#new-cat").value.trim();
    if (!val) { toast("أدخل اسم الفئة", true); return; }
    const { error } = await sb.from("categories").insert({ name: val });
    if (error) { toast("هذه الفئة موجودة بالفعل", true); return; }
    logAudit({ action: "إضافة فئة", entity: "category", entityName: val });
    await loadCategories(); renderSettings(main); toast("تمت إضافة الفئة");
  };

  // items table (متاحة للمدير وأمين المخزن)
  const drawItems = () => {
    $("#items-body").innerHTML = state.items.map(it => `
      <tr><td class="mono" style="font-weight:700; color:var(--mustard);">${it.code || "—"}</td><td style="font-weight:700;">${it.name}</td><td style="color:var(--ink70);">${it.category || "—"}</td><td>${it.unit}</td>
      <td class="mono">${it.qty}</td><td class="mono">${it.max_qty}</td>
      <td><div style="display:flex; gap:8px; justify-content:flex-end;">
        <button class="icon-btn" data-edit="${it.id}">${icon("pencil", 14)}</button>
        <button class="icon-btn" style="color:var(--red);" data-del="${it.id}">${icon("trash", 14)}</button>
      </div></td></tr>`).join("");
    $$("[data-edit]").forEach(b => b.onclick = () => openItemModal(state.items.find(i => i.id === b.dataset.edit)));
    $$("[data-del]").forEach(b => b.onclick = async () => {
      const it = state.items.find(i => i.id === b.dataset.del);
      if (!confirm(`حذف "${it.name}" نهائيًا؟`)) return;
      await sb.from("items").delete().eq("id", it.id);
      logAudit({ action: "حذف صنف", entity: "item", entityName: it.name });
      await loadItems(); renderSettings(main); toast("تم حذف الصنف");
    });
  };
  drawItems();
  $("#new-item-btn").onclick = () => openItemModal(null);
}

/* ---------------- user management (admin only) ---------------- */
function renderUsers(main) {
  const roleLabels = { admin: "مدير النظام", keeper: "أمين مخزن", viewer: "موظف (قراءة فقط)" };
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">إدارة المستخدمين</div><div class="section-sub">تحديد صلاحيات كل مستخدم، وإيقاف أو تفعيل الحسابات</div></div></div>
    <div style="background:var(--mustard-soft); color:#8A6A16; font-size:12px; font-weight:600; padding:10px 14px; border-radius:10px; margin-bottom:16px;">
      إنشاء حسابات الدخول (اسم المستخدم وكلمة المرور) لازم يتم من لوحة تحكم Supabase حاليًا. من هنا تقدر تتحكم في صلاحية كل حساب موجود بالفعل (مدير / أمين مخزن / قراءة فقط) وتوقف أو تفعّل أي حساب.
    </div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>الاسم</th><th>الدور</th><th>الحالة</th><th>آخر دخول</th><th>الجهاز</th></tr></thead><tbody id="users-body"></tbody></table>
    </div>`;
  $("#users-body").innerHTML = state.profiles.map(p => `
    <tr>
      <td style="font-weight:700;">${p.full_name || "—"}${p.id === state.user.id ? ' <span style="color:var(--ink50); font-size:11px;">(أنت)</span>' : ""}</td>
      <td>
        <select class="input" style="padding:6px 10px; font-size:12.5px;" data-role="${p.id}" ${p.id === state.user.id ? "disabled" : ""}>
          ${Object.entries(roleLabels).map(([val, label]) => `<option value="${val}" ${p.role === val ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </td>
      <td>
        <button data-toggle="${p.id}" ${p.id === state.user.id ? "disabled" : ""} class="pill ${p.is_active !== false ? "pill-ok" : "pill-critical"}" style="border:none; cursor:${p.id === state.user.id ? "default" : "pointer"};">
          ${p.is_active !== false ? "نشط" : "موقوف"}
        </button>
      </td>
      <td style="color:var(--ink70); font-size:12.5px;" class="mono">${p.last_login ? fmtDate(p.last_login) : "—"}</td>
      <td style="color:var(--ink70); font-size:12.5px;">${p.last_login_device || "—"}</td>
    </tr>`).join("");
  $$("[data-role]").forEach(sel => sel.onchange = async () => {
    const { error } = await sb.from("profiles").update({ role: sel.value }).eq("id", sel.dataset.role);
    if (error) { toast("تعذر تحديث الدور — تأكد إنك مسجل بحساب مدير", true); return; }
    const p = state.profiles.find(x => x.id === sel.dataset.role);
    logAudit({ action: "تغيير دور مستخدم", entity: "user", entityName: p?.full_name, details: `الدور الجديد: ${roleLabels[sel.value]}` });
    await loadProfiles(); renderUsers(main); toast("تم تحديث الدور");
  });
  $$("[data-toggle]").forEach(btn => btn.onclick = async () => {
    const p = state.profiles.find(x => x.id === btn.dataset.toggle);
    const newVal = !(p.is_active !== false);
    const { error } = await sb.from("profiles").update({ is_active: newVal }).eq("id", p.id);
    if (error) { toast("تعذر تحديث الحالة", true); return; }
    logAudit({ action: newVal ? "تفعيل حساب" : "إيقاف حساب", entity: "user", entityName: p.full_name });
    await loadProfiles(); renderUsers(main); toast(newVal ? "تم تفعيل الحساب" : "تم إيقاف الحساب");
  });
}

/* ---------------- audit log view ---------------- */
function renderAudit(main) {
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">سجل العمليات (Audit Log)</div><div class="section-sub">من قام بالعملية، وقتها، الجهاز، والكمية قبل وبعد التعديل</div></div></div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>المستخدم</th><th>العملية</th><th>الصنف / العنصر</th><th>قبل</th><th>بعد</th><th>الجهاز</th><th>الوقت</th></tr></thead><tbody id="audit-body"></tbody></table>
    </div>`;
  $("#audit-body").innerHTML = state.auditLog.length ? state.auditLog.map(a => `
    <tr>
      <td style="font-weight:700;">${a.actor_name || "—"}</td>
      <td>${a.action}</td>
      <td>${a.entity_name || "—"}${a.details ? `<div style="font-size:11px; color:var(--ink50);">${a.details}</div>` : ""}</td>
      <td class="mono">${a.qty_before ?? "—"}</td>
      <td class="mono">${a.qty_after ?? "—"}</td>
      <td style="color:var(--ink70); font-size:12px;">${a.device || "—"}</td>
      <td class="mono" style="color:var(--ink70); font-size:12px;">${fmtDate(a.created_at)}</td>
    </tr>`).join("") : `<tr><td colspan="7"><div class="empty-note">لا توجد عمليات مسجّلة بعد.</div></td></tr>`;
}

function genItemCode(category) {
  const letters = (category || "GEN").replace(/[^a-zA-Zء-ي]/g, "");
  let prefix = letters.slice(0, 3).toUpperCase();
  if (!prefix || /[ء-ي]/.test(prefix)) {
    const map = { "أ": "A", "ب": "B", "ت": "T", "خ": "K", "س": "S", "ز": "Z", "ط": "F", "إ": "E" };
    prefix = (category || "GEN").split("").map(ch => map[ch] || "").join("").slice(0, 3).toUpperCase() || "GEN";
  }
  const existing = state.items.filter(i => (i.code || "").startsWith(prefix + "-"));
  const nums = existing.map(i => parseInt((i.code || "").split("-")[1], 10)).filter(n => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}
function openItemModal(existing, prefillName, onDone) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const form = existing ? { ...existing } : { name: prefillName || "", category: state.categories[0] || "", unit: "قطعة", qty: 0, max_qty: 100, code: "", barcode: "" };
  if (!form.code) form.code = genItemCode(form.category);
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:16px;">${existing ? "تعديل صنف" : "صنف جديد"}</div>
        <button class="close-x" id="modal-close">${icon("x", 15)}</button>
      </div>
      <div class="field"><label>اسم الصنف</label><input id="f-name" class="input" style="width:100%;" value="${form.name}" placeholder="مثال: خيط حرير أحمر"></div>
      <div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;">
          <label>الفئة (العنوان الرئيسي)</label>
          <select id="f-cat" class="input" style="width:100%;">
            ${state.categories.map(c => `<option ${c === form.category ? "selected" : ""}>${c}</option>`).join("")}
            <option value="__new__">+ فئة جديدة...</option>
          </select>
          <input id="f-cat-new" class="input hidden" style="width:100%; margin-top:8px;" placeholder="اكتب اسم الفئة الجديدة، مثال: خيوط">
        </div>
        <div class="field" style="width:110px;"><label>الوحدة</label><input id="f-unit" class="input" style="width:100%;" value="${form.unit}"></div>
      </div>
      <div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;"><label>الكمية الحالية</label><input id="f-qty" type="number" class="input mono" style="width:100%;" value="${form.qty}"></div>
        <div class="field" style="flex:1;"><label>الحد الأقصى للمخزون</label><input id="f-max" type="number" class="input mono" style="width:100%;" value="${form.max_qty}"></div>
      </div>
      <div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;"><label>كود الصنف</label><input id="f-code" class="input mono" style="width:100%;" value="${form.code}"></div>
      </div>
      <div class="field">
        <label>الباركود (اختياري)</label>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="f-barcode" class="input mono" style="flex:1;" value="${form.barcode || ""}" placeholder="اضغط توليد أو اكتب رقمًا يدويًا">
          <button type="button" id="f-barcode-gen" class="step-btn" style="width:auto; padding:0 12px; font-size:12px;">توليد</button>
        </div>
        <div id="barcode-preview" style="margin-top:8px; background:#fff; padding:6px; border-radius:8px; border:1px solid var(--ink12); text-align:center;"></div>
      </div>
      <div style="font-size:11.5px; color:var(--ink50); margin-bottom:12px;">* التنبيه الحرج يظهر تلقائيًا حسب النسبة المحددة بالإعدادات. يمكنك إنشاء فئة جديدة (عنوان) وتحتها أي عدد من الأصناف مباشرة من هنا. الإدخال والسحب اليدوي يبقى شغالًا دايمًا حتى مع استخدام الباركود.</div>
      <button class="btn-primary" id="f-save">${existing ? "حفظ التعديلات" : "إضافة الصنف"}</button>
    </div>`;
  document.body.appendChild(overlay);
  const drawBarcode = () => {
    const val = $("#f-barcode", overlay).value.trim();
    const prev = $("#barcode-preview", overlay);
    if (!val || typeof JsBarcode === "undefined") { prev.innerHTML = ""; return; }
    prev.innerHTML = `<svg id="bc-svg"></svg>`;
    try { JsBarcode("#bc-svg", val, { height: 40, fontSize: 12, margin: 4 }); } catch (e) { prev.innerHTML = `<span style="font-size:11px; color:var(--ink50);">قيمة غير صالحة للباركود</span>`; }
  };
  $("#f-barcode-gen", overlay).onclick = () => { $("#f-barcode", overlay).value = $("#f-code", overlay).value || genItemCode($("#f-cat", overlay).value); drawBarcode(); };
  $("#f-barcode", overlay).oninput = drawBarcode;
  drawBarcode();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#modal-close", overlay).onclick = () => overlay.remove();
  $("#f-cat", overlay).onchange = (e) => {
    $("#f-cat-new", overlay).classList.toggle("hidden", e.target.value !== "__new__");
    if (e.target.value === "__new__") $("#f-cat-new", overlay).focus();
  };
  $("#f-save", overlay).onclick = async () => {
    let category = $("#f-cat", overlay).value;
    if (category === "__new__") {
      category = $("#f-cat-new", overlay).value.trim();
      if (!category) { toast("أدخل اسم الفئة الجديدة", true); return; }
      const { error: catErr } = await sb.from("categories").insert({ name: category });
      if (!catErr) await loadCategories();
    }
    const payload = {
      name: $("#f-name", overlay).value.trim(),
      category,
      unit: $("#f-unit", overlay).value.trim() || "قطعة",
      qty: Number($("#f-qty", overlay).value) || 0,
      max_qty: Number($("#f-max", overlay).value) || 0,
      code: $("#f-code", overlay).value.trim() || null,
      barcode: $("#f-barcode", overlay).value.trim() || null,
    };
    if (!payload.name) { toast("أدخل اسم الصنف", true); return; }
    if (!payload.max_qty || payload.max_qty <= 0) { toast("أدخل الحد الأقصى للمخزون", true); return; }
    let error;
    if (existing) ({ error } = await sb.from("items").update(payload).eq("id", existing.id));
    else ({ error } = await sb.from("items").insert(payload));
    if (error) { toast(error.message.includes("duplicate") ? "هذا الكود مستخدم بالفعل لصنف آخر" : "تعذر حفظ الصنف", true); return; }
    logAudit({
      action: existing ? "تعديل صنف" : "إضافة صنف", entity: "item", entityName: payload.name,
      qtyBefore: existing ? existing.qty : null, qtyAfter: payload.qty,
    });
    overlay.remove();
    await loadItems();
    if (typeof onDone === "function") onDone(); else render();
    toast(existing ? "تم تحديث الصنف" : "تمت إضافة الصنف");
  };
}

/* ---------------- تغيير كلمة المرور (ذاتيًا) ---------------- */
function openChangePasswordModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:16px;">تغيير كلمة المرور</div>
        <button class="close-x" id="cp-close">${icon("x", 15)}</button>
      </div>
      <div class="field"><label>كلمة المرور الجديدة</label><input id="cp-new" type="password" class="input" style="width:100%;" placeholder="6 أحرف على الأقل"></div>
      <div class="field"><label>تأكيد كلمة المرور</label><input id="cp-confirm" type="password" class="input" style="width:100%;" placeholder="أعد كتابتها"></div>
      <button class="btn-primary" id="cp-save">حفظ كلمة المرور الجديدة</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#cp-close", overlay).onclick = () => overlay.remove();
  $("#cp-save", overlay).onclick = async () => {
    const p1 = $("#cp-new", overlay).value, p2 = $("#cp-confirm", overlay).value;
    if (p1.length < 6) { toast("كلمة المرور لازم تكون 6 أحرف على الأقل", true); return; }
    if (p1 !== p2) { toast("كلمتا المرور غير متطابقتين", true); return; }
    const { error } = await sb.auth.updateUser({ password: p1 });
    if (error) { toast("تعذر تغيير كلمة المرور", true); return; }
    logAudit({ action: "تغيير كلمة المرور", entity: "user", entityName: state.profile?.full_name });
    overlay.remove();
    toast("تم تغيير كلمة المرور بنجاح");
  };
}

/* ---------------- منع تسجيل الدخول المتكرر (حماية بسيطة من محاولات القوة الغاشمة) ---------------- */
const LOGIN_LOCK_KEY = "login-lock-";
const MAX_ATTEMPTS = 5, LOCK_MINUTES = 5;
function getLoginLock(username) {
  try { return JSON.parse(localStorage.getItem(LOGIN_LOCK_KEY + username) || "null"); } catch (e) { return null; }
}
function setLoginLock(username, data) { localStorage.setItem(LOGIN_LOCK_KEY + username, JSON.stringify(data)); }
function checkLoginLock(username) {
  const lock = getLoginLock(username);
  if (lock && lock.lockUntil && Date.now() < lock.lockUntil) {
    const mins = Math.ceil((lock.lockUntil - Date.now()) / 60000);
    return `تم إيقاف تسجيل الدخول مؤقتًا بعد محاولات فاشلة متكررة. حاول بعد ${mins} دقيقة.`;
  }
  return null;
}
function recordLoginFailure(username) {
  const lock = getLoginLock(username) || { count: 0 };
  lock.count = (lock.count || 0) + 1;
  if (lock.count >= MAX_ATTEMPTS) { lock.lockUntil = Date.now() + LOCK_MINUTES * 60000; lock.count = 0; }
  setLoginLock(username, lock);
}
function clearLoginFailures(username) { localStorage.removeItem(LOGIN_LOCK_KEY + username); }
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dir = I18N[state.lang].dir;
  document.documentElement.lang = state.lang;
  applyLoginTexts();
  $$(".lang-btn").forEach(b => b.onclick = () => setLang(b.dataset.lang));

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = $("#login-username").value.trim();
    const password = $("#login-password").value;
    $("#login-error").classList.add("hidden");
    const lockMsg = checkLoginLock(username.toLowerCase());
    if (lockMsg) { $("#login-error").textContent = lockMsg; $("#login-error").classList.remove("hidden"); return; }
    const btn = $("#login-submit"); btn.disabled = true; btn.textContent = t("loginLoading");
    try {
      const { user } = await tryLogin(username, password);
      state.user = user;
      await loadAll();
      if (state.profile && state.profile.is_active === false) {
        await sb.auth.signOut();
        state.user = null; state.profile = null;
        $("#login-error").textContent = "هذا الحساب موقوف حاليًا. تواصل مع مدير النظام.";
        $("#login-error").classList.remove("hidden");
        return;
      }
      clearLoginFailures(username.toLowerCase());
      await sb.from("profiles").update({ last_login: new Date().toISOString(), last_login_device: deviceInfo() }).eq("id", user.id);
      logAudit({ action: "تسجيل دخول", entity: "user", entityName: state.profile?.full_name || username });
      showApp();
    } catch (err) {
      recordLoginFailure(username.toLowerCase());
      const lockMsg2 = checkLoginLock(username.toLowerCase());
      $("#login-error").textContent = lockMsg2 || t("loginError");
      $("#login-error").classList.remove("hidden");
    } finally {
      btn.disabled = false; btn.textContent = t("loginBtn");
    }
  });
  $("#logout-btn").addEventListener("click", () => doLogout());
  $("#change-pass-btn").addEventListener("click", openChangePasswordModal);
  boot();
});
