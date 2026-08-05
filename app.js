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
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  truck: '<path d="M1 3h13v13H1z"/><path d="M14 8h4l4 4v4h-8V8z"/><circle cx="6" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/>',
  tag: '<path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L3 3v6.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.59-4.59a2 2 0 0 0 0-2.83Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
};
function icon(name, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

/* ---------------- تحميل المكتبات الثقيلة عند الحاجة فقط (يقلل وقت فتح البرنامج) ---------------- */
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("تعذر تحميل المكتبة: " + src)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = () => reject(new Error("تعذر تحميل المكتبة: " + src));
    document.head.appendChild(s);
  });
}
function ensureXLSX() {
  if (typeof XLSX !== "undefined") return Promise.resolve();
  return loadScriptOnce("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
}
function ensureBarcodeLib() {
  if (typeof JsBarcode !== "undefined") return Promise.resolve();
  return loadScriptOnce("https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js");
}

const CATS_FALLBACK = ["أقمشة", "خيوط", "أزرار وسحابات", "بطانات", "إكسسوارات", "أخرى"];

const state = {
  user: null, profile: null,
  settings: { workshop_name: "مصنع نسيج", logo_base64: null, alert_threshold_percent: 15, warning_threshold_percent: 30 },
  categories: [], items: [], transactions: [], profiles: [], auditLog: [], backups: [], suppliers: [], telegramUsers: [],
  tab: "dashboard", selectedItem: null, pollTimer: null, lang: (localStorage.getItem("lang") || "ar"), reportItemFocus: null,
  _alertOpen: false,
};

const I18N = {
  ar: {
    dir: "rtl", loginTitle: "تسجيل الدخول لإدارة المخازن", loginUser: "اسم المستخدم", loginPass: "كلمة المرور",
    loginBtn: "تسجيل الدخول", loginLoading: "...جارِ الدخول", loginError: "اسم المستخدم أو كلمة المرور غير صحيحة",
    brandSub: "إدارة المخازن",
    navDashboard: "لوحة التحكم", navIn: "إدخال مخزون", navOut: "سحب من المخزن", navStock: "المخزون الحالي",
    navReports: "التقارير", navAudit: "سجل العمليات", navUsers: "إدارة المستخدمين", navSettings: "الإعدادات",
    navItems: "إدارة الأصناف", navSuppliers: "الموردون", navTelegram: "مستخدمو تيليجرام",
    logout: "خروج",
    // عام
    save: "حفظ", add: "إضافة", delete: "حذف", edit: "تعديل", cancel: "إلغاء", search: "بحث", confirmBtn: "تأكيد",
    print: "طباعة / PDF", exportExcelBtn: "تصدير Excel", all: "الكل", unit: "الوحدة", category: "الفئة",
    quantity: "الكمية", status: "الحالة", code: "الكود", itemName: "الصنف", worker: "العامل", note: "ملاحظة",
    date: "التاريخ", dateTime: "التاريخ والساعة",
    statusCritical: "حرج", statusWarning: "منخفض", statusOk: "جيد",
    // لوحة التحكم
    dashboardTitle: "لوحة التحكم", dashboardSub: "نظرة سريعة على حالة المخزن اليوم",
    statTotalItems: "إجمالي الأصناف", statCritical: "أصناف حرجة", statTodayIn: "عمليات إدخال اليوم", statTodayOut: "عمليات سحب اليوم",
    sectionUrgent: "أصناف تحتاج انتباه فوري", sectionRecentTx: "آخر الحركات",
    viewAllStock: "عرض كل المخزون", allReports: "كل التقارير", noLowStock: "لا توجد أصناف منخفضة حاليًا.", noTx: "لا توجد حركات مسجّلة بعد.",
    chartMovement: "حركة المخزون — آخر 7 أيام", chartTopConsumed: "الأصناف الأكثر استهلاكًا",
    legendIn: "إدخال", legendOut: "سحب", noData: "لا توجد بيانات كافية بعد.",
    // المخزون
    stockTitle: "المخزون الحالي", itemsRegistered: "صنف مسجّل بالمخزن", searchByNameCode: "ابحث بالاسم أو الكود...",
    // الإدخال/السحب
    inTitle: "إدخال مخزون", inSub: "أضف كمية جديدة وصلت للمصنع",
    outTitle: "سحب من المخزن", outSub: "اسحب المواد التي تحتاجها للعمل مباشرة",
    searchItem: "ابحث عن الصنف بالاسم أو الفئة...", confirmIn: "تأكيد الإدخال", confirmOut: "تأكيد السحب",
    qtyLabel: "الكمية", workerLabel: "اسم العامل *", noteLabel: "ملاحظة (اختياري)", available: "المتوفر حاليًا",
    // التقارير
    reportsTitle: "التقارير", reportsSub: "تغطية كاملة لحركة المخزن والأصناف المنخفضة",
    lowStockSection: "تقرير الأصناف المنخفضة والحرجة", consumptionSection: "الأصناف الأكثر سحبًا (إجمالي الاستهلاك)",
    dailySection: "الملخص اليومي (الإدخال والسحب لكل يوم)", txLogSection: "سجل الحركات (بالتاريخ والساعة)",
    printSectionsTitle: "أقسام التقرير المطلوب طباعتها/تصديرها", quickRange: "فترة سريعة", dateFrom: "من تاريخ", dateTo: "إلى تاريخ",
    typeAll: "الكل", typeIn: "إدخال فقط", typeOut: "سحب فقط", allItems: "كل الأصناف", clearFilters: "مسح الفلاتر",
    voucherBtn: "طباعة إذن",
    // الإعدادات
    settingsTitle: "الإعدادات", settingsSub: "اسم المصنع، الشعار، بيانات الاتصال، ونسب التنبيه",
    factoryInfo: "بيانات المصنع", factoryName: "اسم المصنع", factoryLogo: "شعار المصنع",
    factoryAddress: "عنوان المصنع", factoryPhone: "رقم الهاتف",
    criticalPct: "نسبة التنبيه الحرج %", warningPct: 'نسبة تنبيه "منخفض" %', saveFactoryInfo: "حفظ بيانات المصنع",
    itemsAdminTitle: "إدارة الأصناف", itemsAdminSub: "أنواع المنتجات (الفئات)، والأصناف تحت كل فئة",
    categoriesTitle: "أنواع المنتجات (الفئات)", newCategoryPlaceholder: "اسم فئة جديدة، مثال: خامات تطريز",
    itemsTitle: "الأصناف", newItemBtn: "صنف جديد", maxQty: "الحد الأقصى", currentQty: "الكمية الحالية",
    // المستخدمون
    usersTitle: "إدارة المستخدمين", usersSub: "إنشاء الحسابات، تحديد الصلاحيات، إيقاف أو حذف المستخدمين",
    newUserBtn: "مستخدم جديد", fullNameLabel: "الاسم الكامل", roleLabel: "الدور",
    lastLogin: "آخر دخول", deviceLabel: "الجهاز", activeLabel: "نشط", suspendedLabel: "موقوف", youLabel: "(أنت)",
    // سجل العمليات
    auditTitle: "سجل العمليات (Audit Log)", auditSub: "من قام بالعملية، وقتها، الجهاز، والكمية قبل وبعد التعديل",
    actionCol: "العملية", entityCol: "الصنف / العنصر", beforeCol: "قبل", afterCol: "بعد", timeCol: "الوقت",
    noAudit: "لا توجد عمليات مسجّلة بعد.",
    usernameLabel: "اسم المستخدم (بالإنجليزي، بدون مسافات)", passwordLabel: "كلمة المرور", createAccountBtn: "إنشاء الحساب",
    // الموردون
    suppliersTitle: "الموردون", suppliersSub: "بيانات الموردين للتواصل السريع والربط بالأصناف",
    newSupplierBtn: "مورد جديد", supplierName: "اسم المورد", supplierPhone: "الهاتف", supplierEmail: "البريد الإلكتروني",
    supplierNotes: "ملاحظات", noSuppliers: "لا يوجد موردون مسجّلون بعد.",
    // حقول الصنف الموسّعة
    itemSupplier: "المورد", itemPrice: "السعر", itemStorage: "مكان التخزين", itemImage: "صورة الصنف", noneOption: "بدون",
    // تيليجرام
    telegramTitle: "مستخدمو تيليجرام", telegramSub: "المستخدمون المسجَّلون تلقائيًا عبر بوت تيليجرام، وأدوارهم للإشعارات",
    telegramNoUsers: "لسه محدش سجّل في البوت. شارك رابط البوت مع الفريق واطلب منهم الضغط على Start.",
    telegramActive: "نشط", telegramBlocked: "محظور/موقف", telegramRole: "دور الإشعارات", telegramNoRole: "بدون دور محدد",
    telegramLastSeen: "آخر ظهور", telegramGenLink: "توليد رابط ربط لمستخدم", telegramGenLinkBtn: "توليد الرابط",
    telegramLinkGenerated: "انسخ الرابط وابعته للمستخدم — صالح لمدة 24 ساعة ولاستخدام واحد فقط",
    telegramSendTest: "إرسال رسالة تجريبية لكل المسجَّلين",
  },
  tr: {
    dir: "ltr", loginTitle: "Depo Yönetimi Girişi", loginUser: "Kullanıcı Adı", loginPass: "Şifre",
    loginBtn: "Giriş Yap", loginLoading: "...Giriş yapılıyor", loginError: "Kullanıcı adı veya şifre hatalı",
    brandSub: "Depo Yönetimi",
    navDashboard: "Kontrol Paneli", navIn: "Stok Girişi", navOut: "Depodan Çıkış", navStock: "Mevcut Stok",
    navReports: "Raporlar", navAudit: "İşlem Kaydı", navUsers: "Kullanıcı Yönetimi", navSettings: "Ayarlar",
    navItems: "Ürün Yönetimi", navSuppliers: "Tedarikçiler", navTelegram: "Telegram Kullanıcıları",
    logout: "Çıkış",
    // genel
    save: "Kaydet", add: "Ekle", delete: "Sil", edit: "Düzenle", cancel: "İptal", search: "Ara", confirmBtn: "Onayla",
    print: "Yazdır / PDF", exportExcelBtn: "Excel'e Aktar", all: "Tümü", unit: "Birim", category: "Kategori",
    quantity: "Miktar", status: "Durum", code: "Kod", itemName: "Ürün", worker: "Çalışan", note: "Not",
    date: "Tarih", dateTime: "Tarih ve Saat",
    statusCritical: "Kritik", statusWarning: "Düşük", statusOk: "İyi",
    // Kontrol paneli
    dashboardTitle: "Kontrol Paneli", dashboardSub: "Bugünkü depo durumuna hızlı bakış",
    statTotalItems: "Toplam Ürün", statCritical: "Kritik Ürünler", statTodayIn: "Bugünkü Girişler", statTodayOut: "Bugünkü Çıkışlar",
    sectionUrgent: "Acil Dikkat Gereken Ürünler", sectionRecentTx: "Son Hareketler",
    viewAllStock: "Tüm Stoku Görüntüle", allReports: "Tüm Raporlar", noLowStock: "Şu anda düşük stoklu ürün yok.", noTx: "Henüz kayıtlı hareket yok.",
    chartMovement: "Stok Hareketi — Son 7 Gün", chartTopConsumed: "En Çok Tüketilen Ürünler",
    legendIn: "Giriş", legendOut: "Çıkış", noData: "Henüz yeterli veri yok.",
    // Stok
    stockTitle: "Mevcut Stok", itemsRegistered: "kayıtlı ürün", searchByNameCode: "İsim veya kod ile ara...",
    // Giriş/Çıkış
    inTitle: "Stok Girişi", inSub: "Fabrikaya yeni gelen miktarı ekle",
    outTitle: "Depodan Çıkış", outSub: "İhtiyacın olan malzemeyi doğrudan çek",
    searchItem: "İsim veya kategoriye göre ürün ara...", confirmIn: "Girişi Onayla", confirmOut: "Çıkışı Onayla",
    qtyLabel: "Miktar", workerLabel: "Çalışan Adı *", noteLabel: "Not (isteğe bağlı)", available: "Mevcut miktar",
    // Raporlar
    reportsTitle: "Raporlar", reportsSub: "Depo hareketlerinin ve düşük stokların tam kapsamı",
    lowStockSection: "Düşük ve Kritik Stok Raporu", consumptionSection: "En Çok Çekilen Ürünler (Toplam Tüketim)",
    dailySection: "Günlük Özet (Her Gün Giriş ve Çıkış)", txLogSection: "Hareket Kaydı (Tarih ve Saat ile)",
    printSectionsTitle: "Yazdırılacak/Aktarılacak Rapor Bölümleri", quickRange: "Hızlı Aralık", dateFrom: "Başlangıç Tarihi", dateTo: "Bitiş Tarihi",
    typeAll: "Tümü", typeIn: "Sadece Giriş", typeOut: "Sadece Çıkış", allItems: "Tüm Ürünler", clearFilters: "Filtreleri Temizle",
    voucherBtn: "Fiş Yazdır",
    // Ayarlar
    settingsTitle: "Ayarlar", settingsSub: "Fabrika adı, logo, iletişim bilgileri ve uyarı oranları",
    factoryInfo: "Fabrika Bilgileri", factoryName: "Fabrika Adı", factoryLogo: "Fabrika Logosu",
    factoryAddress: "Fabrika Adresi", factoryPhone: "Telefon Numarası",
    criticalPct: "Kritik Uyarı Oranı %", warningPct: 'Düşük Uyarı Oranı %', saveFactoryInfo: "Fabrika Bilgilerini Kaydet",
    itemsAdminTitle: "Ürün Yönetimi", itemsAdminSub: "Ürün türleri (kategoriler) ve her kategori altındaki ürünler",
    categoriesTitle: "Ürün Türleri (Kategoriler)", newCategoryPlaceholder: "Yeni kategori adı, örn: Nakış Malzemeleri",
    itemsTitle: "Ürünler", newItemBtn: "Yeni Ürün", maxQty: "Maksimum", currentQty: "Mevcut Miktar",
    // Kullanıcılar
    usersTitle: "Kullanıcı Yönetimi", usersSub: "Hesap oluşturma, yetki belirleme, kullanıcıları durdurma veya silme",
    newUserBtn: "Yeni Kullanıcı", fullNameLabel: "Tam Ad", roleLabel: "Rol",
    lastLogin: "Son Giriş", deviceLabel: "Cihaz", activeLabel: "Aktif", suspendedLabel: "Durduruldu", youLabel: "(Siz)",
    // İşlem Kaydı
    auditTitle: "İşlem Kaydı (Audit Log)", auditSub: "İşlemi kim yaptı, ne zaman, hangi cihazda ve değişiklik öncesi/sonrası miktar",
    actionCol: "İşlem", entityCol: "Ürün / Öğe", beforeCol: "Önce", afterCol: "Sonra", timeCol: "Zaman",
    noAudit: "Henüz kayıtlı işlem yok.",
    usernameLabel: "Kullanıcı Adı (İngilizce, boşluksuz)", passwordLabel: "Şifre", createAccountBtn: "Hesap Oluştur",
    suppliersTitle: "Tedarikçiler", suppliersSub: "Hızlı iletişim ve ürünlerle ilişkilendirme için tedarikçi bilgileri",
    newSupplierBtn: "Yeni Tedarikçi", supplierName: "Tedarikçi Adı", supplierPhone: "Telefon", supplierEmail: "E-posta",
    supplierNotes: "Notlar", noSuppliers: "Henüz kayıtlı tedarikçi yok.",
    itemSupplier: "Tedarikçi", itemPrice: "Fiyat", itemStorage: "Depolama Yeri", itemImage: "Ürün Görseli", noneOption: "Yok",
    // Telegram
    telegramTitle: "Telegram Kullanıcıları", telegramSub: "Bot üzerinden otomatik kaydolan kullanıcılar ve bildirim rolleri",
    telegramNoUsers: "Henüz kimse bota kaydolmadı. Bot bağlantısını ekiple paylaşın ve Start'a basmalarını isteyin.",
    telegramActive: "Aktif", telegramBlocked: "Engelli/Durduruldu", telegramRole: "Bildirim Rolü", telegramNoRole: "Rol belirlenmedi",
    telegramLastSeen: "Son Görülme", telegramGenLink: "Kullanıcı için bağlantı oluştur", telegramGenLinkBtn: "Bağlantı Oluştur",
    telegramLinkGenerated: "Bağlantıyı kopyalayıp kullanıcıya gönderin — 24 saat ve tek kullanım için geçerli",
    telegramSendTest: "Tüm kayıtlı kullanıcılara test mesajı gönder",
  },
};
function t(key) { return (I18N[state.lang] && I18N[state.lang][key]) || I18N.ar[key] || key; }
function setLang(lang) {
  state.lang = lang; localStorage.setItem("lang", lang);
  document.documentElement.dir = I18N[lang].dir;
  document.documentElement.lang = lang;
  applyLoginTexts();
  const logoutBtn = $("#logout-btn"); if (logoutBtn) logoutBtn.textContent = t("logout");
  const brandSubEl = $("#brand-sub"); if (brandSubEl) brandSubEl.textContent = t("brandSub");
  if (state.user) { document.title = (state.settings.workshop_name || "مصنع نسيج") + " — " + t("brandSub"); render(); }
}
function applyLoginTexts() {
  const subEl = $("#login-sub"); if (subEl) subEl.textContent = t("loginTitle");
  const uLbl = $("#login-user-label"); if (uLbl) uLbl.textContent = t("loginUser");
  const pLbl = $("#login-pass-label"); if (pLbl) pLbl.textContent = t("loginPass");
  const btn = $("#login-submit"); if (btn && !btn.disabled) btn.textContent = t("loginBtn");
  $$(".lang-btn").forEach(b => b.classList.toggle("active-lang", b.dataset.lang === state.lang));
}

const ROLE_LABELS = {
  admin: "مدير النظام",
  factory_manager: "مدير المصنع",
  keeper: "أمين مخزن",
  production_manager: "مدير الإنتاج",
  accountant: "المحاسب",
  quality: "مراقب الجودة",
  viewer: "للقراءة فقط",
};
// كل تبويب مسموح لمين — طبقًا لمصفوفة الصلاحيات المتفق عليها
const TAB_ROLES = {
  dashboard: ["admin", "factory_manager", "keeper", "production_manager", "quality", "viewer"],
  stock: ["admin", "factory_manager", "keeper", "production_manager", "accountant", "quality", "viewer"],
  in: ["admin", "keeper"],
  out: ["admin", "keeper"],
  reports: ["admin", "factory_manager", "keeper", "production_manager", "accountant", "quality", "viewer"],
  audit: ["admin", "factory_manager", "keeper"],
  items: ["admin", "keeper"],
  suppliers: ["admin", "keeper"],
  users: ["admin"],
  telegram: ["admin"],
  settings: ["admin"],
};
function myRole() { return state.profile?.role || "viewer"; }
function isAdmin() { return myRole() === "admin"; }
function canEdit() { return myRole() === "admin" || myRole() === "keeper"; }
function firstAllowedTab() { return Object.keys(TAB_ROLES).find(id => TAB_ROLES[id].includes(myRole())) || "stock"; }
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
  critical: { label: "حرج", cls: "pill-critical", color: "#C85D51" },
  warning: { label: "منخفض", cls: "pill-warning", color: "#B87A28" },
  ok: { label: "جيد", cls: "pill-ok", color: "#2F8F5B" },
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
async function loadBackups() {
  const { data } = await sb.from("backups").select("id, created_at, created_by").order("created_at", { ascending: false }).limit(10);
  state.backups = data || [];
}
async function loadSuppliers() {
  const { data } = await sb.from("suppliers").select("*").order("name");
  state.suppliers = data || [];
}
async function loadTelegramUsers() {
  const { data } = await sb.from("telegram_users").select("*").order("created_at", { ascending: false });
  state.telegramUsers = data || [];
}
async function loadAll() {
  await Promise.all([loadSettings(), loadCategories(), loadItems(), loadTransactions(), loadProfile()]);
}
// تحميل كسول (lazy load): البيانات دي مش لازمة فورًا وقت الدخول، بنجيبها بس أول ما المستخدم
// يفتح التبويب اللي محتاجها فعليًا — ده بيقلل وقت انتظار تسجيل الدخول بشكل كبير.
let _profilesLoaded = false, _suppliersLoaded = false, _auditLoaded = false;
async function ensureProfiles() { if (!_profilesLoaded) { await loadProfiles(); _profilesLoaded = true; } }
async function ensureSuppliers() { if (!_suppliersLoaded) { await loadSuppliers(); _suppliersLoaded = true; } }
async function ensureAuditLog() { if (!_auditLoaded) { await loadAuditLog(); _auditLoaded = true; } }

/* ---------------- app boot ---------------- */
async function boot() {
  // إظهار صفحة الدخول مباشرة وعدم انتظار التحميل
  showLogin();

  try {
    await loadSettingsForLogin();

    const { data: { session } } = await sb.auth.getSession();

    if (session) {
      state.user = session.user;
      await loadAll();

      if (state.profile && state.profile.is_active === false) {
        await sb.auth.signOut();
        state.user = null;
        state.profile = null;
        showLogin();
        $("#login-error").textContent = "هذا الحساب موقوف حاليًا. تواصل مع مدير النظام.";
        $("#login-error").classList.remove("hidden");
      } else {
        showApp();
      }
    }
  } catch (e) {
    console.error("boot error:", e);
    showLogin();
  }

  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      showLogin();
    }
  });
}
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
  document.title = name + " — " + t("brandSub");
  const brandSubEl = $("#brand-sub"); if (brandSubEl) brandSubEl.textContent = t("brandSub");
  const loginLogo = $("#login-logo"), sideLogo = $("#side-logo");
  loginLogo.innerHTML = logo ? `<img src="${logo}">` : icon("scissors", 30);
  sideLogo.innerHTML = logo ? `<img src="${logo}">` : icon("scissors", 19);
}

function hideBootLoader() {
  const el = document.getElementById("boot-loader");
  if (el) { el.classList.add("boot-loader-hidden"); setTimeout(() => el.remove(), 300); }
}
function showLogin() {
  $("#login-screen").classList.remove("hidden");
  $("#app-shell").classList.add("hidden");
  $("#login-error").classList.add("hidden");
  hideBootLoader();
}
function showApp() {
  $("#login-screen").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  hideBootLoader();
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
  { id: "dashboard", labelKey: "navDashboard", icon: "grid" },
  { id: "in", labelKey: "navIn", icon: "in" },
  { id: "out", labelKey: "navOut", icon: "out" },
  { id: "stock", labelKey: "navStock", icon: "package" },
  { id: "reports", labelKey: "navReports", icon: "chart" },
  { id: "audit", labelKey: "navAudit", icon: "history" },
  { id: "items", labelKey: "navItems", icon: "tag" },
  { id: "suppliers", labelKey: "navSuppliers", icon: "truck" },
  { id: "users", labelKey: "navUsers", icon: "users" },
  { id: "telegram", labelKey: "navTelegram", icon: "send" },
  { id: "settings", labelKey: "navSettings", icon: "gear" },
];
function renderNav() {
  const critical = state.items.filter(i => statusOf(i) === "critical").length;
  const visible = NAV.filter(n => (TAB_ROLES[n.id] || []).includes(myRole()));
  $("#nav-list").innerHTML = visible.map(n => `
    <button class="nav-btn ${state.tab === n.id ? "active" : ""}" data-tab="${n.id}">
      ${icon(n.icon, 18)}<span>${t(n.labelKey)}</span>
      ${n.id === "dashboard" && critical ? `<span class="badge">${critical}</span>` : ""}
    </button>`).join("");
  $$(".nav-btn").forEach(b => b.onclick = async () => {
    state.tab = b.dataset.tab; state.selectedItem = null;
    if (state.tab === "audit") await loadAuditLog();
    if (state.tab === "users") await loadProfiles();
    if (state.tab === "suppliers") await loadSuppliers();
    if (state.tab === "telegram") await loadTelegramUsers();
    $("#nav-list").classList.remove("mobile-open");
    $("#mobile-extra-controls").classList.remove("mobile-open");
    render();
  });
  const roleTag = $("#who-role"); if (roleTag) roleTag.textContent = ROLE_LABELS[myRole()] || "";
}

/* ---------------- render dispatcher ---------------- */
function render() {
  renderNav();
  renderBell();
  const critItems = state.items.filter(i => statusOf(i) === "critical");
  const banner = $("#alert-banner");
  if (critItems.length) {
    banner.classList.remove("hidden");
    const isOpen = state._alertOpen;
    banner.innerHTML = `
      <div class="alert-banner-row">
        ${icon("alert", 16)}
        <span class="alert-msg">تنبيه: ${critItems.length} صنف وصل إلى أقل من ${state.settings.alert_threshold_percent || 15}% من الحد الأقصى للمخزون</span>
        <button id="alert-toggle-btn" class="alert-toggle-btn ${isOpen ? "open" : ""}">${isOpen ? "إخفاء" : "عرض التفاصيل"} ${icon("chevronDown", 13)}</button>
      </div>
      <div class="alert-details ${isOpen ? "open" : ""}"><div class="alert-details-inner">
        ${critItems.map(i => `<span class="alert-chip" data-alert-item="${i.name}">${icon("alert", 12)} ${i.name} — ${Math.round(pctOf(i))}%</span>`).join("")}
      </div></div>`;
    const toggleBtn = $("#alert-toggle-btn");
    if (toggleBtn) toggleBtn.onclick = () => { state._alertOpen = !state._alertOpen; render(); };
    $$("[data-alert-item]").forEach(chip => chip.onclick = () => { state.tab = "stock"; render(); });
  } else banner.classList.add("hidden");

  const main = $("#main");
  if (!TAB_ROLES[state.tab] || !TAB_ROLES[state.tab].includes(myRole())) state.tab = firstAllowedTab();
  if (state.tab === "dashboard") renderDashboard(main);
  else if (state.tab === "in") renderMove(main, "in");
  else if (state.tab === "out") renderMove(main, "out");
  else if (state.tab === "stock") renderStock(main);
  else if (state.tab === "reports") renderReports(main);
  else if (state.tab === "audit") renderAudit(main);
  else if (state.tab === "items") renderItemsAdmin(main);
  else if (state.tab === "suppliers") renderSuppliers(main);
  else if (state.tab === "users") renderUsers(main);
  else if (state.tab === "telegram") renderTelegramUsers(main);
  else if (state.tab === "settings") renderSettings(main);
}

/* ---------------- جرس الإشعارات ---------------- */
function renderBell() {
  const needsAttention = state.items.filter(i => statusOf(i) !== "ok").sort((a, b) => pctOf(a) - pctOf(b));
  const badge = $("#bell-badge");
  if (needsAttention.length) { badge.textContent = needsAttention.length; badge.classList.remove("hidden"); }
  else badge.classList.add("hidden");

  const dd = $("#bell-dropdown");
  dd.innerHTML = `
    <div class="bell-title">${needsAttention.length ? `🔔 يوجد ${needsAttention.length} صنف يحتاج شراء` : "لا توجد تنبيهات حاليًا"}</div>
    ${needsAttention.length ? needsAttention.slice(0, 8).map(it => `
      <div class="bell-item">
        <span style="width:8px; height:8px; border-radius:50%; background:${STATUS_META[statusOf(it)].color}; flex-shrink:0;"></span>
        <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${it.name}</span>
        <span class="mono" style="color:var(--ink70);">${Math.round(pctOf(it))}%</span>
      </div>`).join("") : `<div class="bell-empty">كل الأصناف ضمن الحدود الآمنة.</div>`}
    ${needsAttention.length > 8 ? `<div class="bell-empty">و${needsAttention.length - 8} أصناف أخرى...</div>` : ""}`;
}
document.addEventListener("click", (e) => {
  const btn = document.getElementById("bell-btn"), dd = document.getElementById("bell-dropdown");
  if (!btn || !dd) return;
  if (btn.contains(e.target)) { dd.classList.toggle("hidden"); return; }
  if (!dd.contains(e.target)) dd.classList.add("hidden");
});

// مستمع عام لزر "طباعة إذن" — مستقل عن أي إعادة رسم للجدول، عشان يشتغل دايمًا مهما اتغيّر الفلتر
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-voucher]");
  if (!btn) return;
  const tx = state.transactions.find(x => x.id === btn.dataset.voucher);
  if (!tx) { toast("تعذر إيجاد بيانات هذه الحركة", true); return; }
  printVoucher(tx);
});

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
    { label: t("statTotalItems"), value: items.length, icon: "package", color: "var(--ink)" },
    { label: `${t("statCritical")} (< ${state.settings.alert_threshold_percent || 15}%)`, value: critical.length, icon: "alert", color: "var(--red)" },
    { label: t("statTodayIn"), value: todayIn, icon: "in", color: "var(--green)" },
    { label: t("statTodayOut"), value: todayOut, icon: "out", color: "#B87A28" },
  ];

  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">${t("dashboardTitle")}</div><div class="section-sub">${t("dashboardSub")}</div></div></div>
    <div class="stats-grid">
      ${stats.map(s => `<div class="card"><div style="color:${s.color}">${icon(s.icon, 20)}</div><div class="stat-value" style="color:${s.color}">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join("")}
    </div>
    <div class="dash-grid-main">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="font-weight:800; font-size:15px;">${t("sectionUrgent")}</div>
          <button class="link-btn" data-goto="stock">${t("viewAllStock")}</button>
        </div>
        ${critical.length === 0 && warning.length === 0 ? `<div class="empty-note">${t("noLowStock")}</div>` :
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
          <div style="font-weight:800; font-size:15px;">${t("sectionRecentTx")}</div>
          <button class="link-btn" data-goto="reports">${t("allReports")}</button>
        </div>
        ${tx.length === 0 ? `<div class="empty-note">${t("noTx")}</div>` :
      `<div style="display:flex; flex-direction:column; gap:9px;">
          ${tx.slice(0, 8).map(t => `
            <div style="display:flex; align-items:center; gap:9px; font-size:12.8px;">
              <span style="color:${t.type === "in" ? "var(--green)" : "var(--red)"}; display:flex; align-items:center;">${icon(t.type === "in" ? "in" : "out", 15)}</span>
              <span style="font-weight:700; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.item_name}</span>
              <span class="mono" style="color:${t.type === "in" ? "var(--green)" : "var(--red)"}; font-weight:700;">${t.type === "in" ? "+" : "-"}${t.qty} ${t.unit || ""}</span>
            </div>`).join("")}
        </div>`}
      </div>
    </div>

    <div class="dash-grid-charts">
      <div class="card">
        <div style="font-weight:800; font-size:15px; margin-bottom:14px;">${t("chartMovement")}</div>
        <div id="movement-chart"></div>
      </div>
      <div class="card">
        <div style="font-weight:800; font-size:15px; margin-bottom:14px;">${t("chartTopConsumed")}</div>
        <div id="top-consumed-chart"></div>
      </div>
    </div>`;
  $$("[data-goto]").forEach(b => b.onclick = () => { state.tab = b.dataset.goto; render(); });

  // حركة المخزون آخر 7 أيام
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0); days.push(d); }
  const dayTotals = days.map(d => {
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const dayTx = tx.filter(x => { const dt = new Date(x.created_at); return dt >= d && dt < next; });
    return {
      label: d.toLocaleDateString("ar-EG", { weekday: "short" }),
      inQty: dayTx.filter(x => x.type === "in").reduce((s, x) => s + Number(x.qty), 0),
      outQty: dayTx.filter(x => x.type === "out").reduce((s, x) => s + Number(x.qty), 0),
    };
  });
  const maxDay = Math.max(1, ...dayTotals.map(d => Math.max(d.inQty, d.outQty)));
  $("#movement-chart").innerHTML = `
    <div style="display:flex; align-items:flex-end; gap:8px; height:120px; margin-bottom:8px;">
      ${dayTotals.map(d => `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; height:100%; justify-content:flex-end;">
          <div style="display:flex; align-items:flex-end; gap:2px; height:100%;">
            <div style="width:9px; background:var(--green); border-radius:3px 3px 0 0; height:${Math.max(3, (d.inQty / maxDay) * 100)}%;" title="${t("legendIn")}: ${d.inQty}"></div>
            <div style="width:9px; background:var(--red); border-radius:3px 3px 0 0; height:${Math.max(3, (d.outQty / maxDay) * 100)}%;" title="${t("legendOut")}: ${d.outQty}"></div>
          </div>
          <div style="font-size:10px; color:var(--ink50);">${d.label}</div>
        </div>`).join("")}
    </div>
    <div style="display:flex; gap:14px; font-size:11.5px; color:var(--ink70);">
      <span style="display:flex; align-items:center; gap:5px;"><span style="width:9px; height:9px; border-radius:3px; background:var(--green); display:inline-block;"></span>${t("legendIn")}</span>
      <span style="display:flex; align-items:center; gap:5px;"><span style="width:9px; height:9px; border-radius:3px; background:var(--red); display:inline-block;"></span>${t("legendOut")}</span>
    </div>`;

  // الأصناف الأكثر استهلاكًا (أعلى 5)
  const consMap = {};
  tx.filter(x => x.type === "out").forEach(x => { consMap[x.item_name] = (consMap[x.item_name] || 0) + Number(x.qty); });
  const topCons = Object.entries(consMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCons = Math.max(1, ...topCons.map(c => c[1]));
  $("#top-consumed-chart").innerHTML = topCons.length ? `
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${topCons.map(([name, val]) => `
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:110px; font-size:12.5px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</div>
          <div style="flex:1; background:var(--paper-deep); border-radius:8px; height:14px; position:relative; overflow:hidden;">
            <div style="position:absolute; inset:0; width:${(val / maxCons) * 100}%; background:var(--mustard); border-radius:8px;"></div>
          </div>
          <div class="mono" style="width:40px; font-size:12px; font-weight:700;">${val}</div>
        </div>`).join("")}
    </div>` : `<div class="empty-note">${t("noData")}</div>`;
}

/* ---------------- stock in / out ---------------- */
function renderMove(main, mode) {
  const isIn = mode === "in";
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">${isIn ? t("inTitle") : t("outTitle")}</div>
    <div class="section-sub">${isIn ? t("inSub") : t("outSub")}</div></div></div>
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
        <input id="move-search" class="input" style="width:100%; padding-right:38px;" placeholder="${t("searchItem")}">
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
        if (qa) qa.onclick = async () => { await ensureSuppliers(); openItemModal(null, $("#move-search").value, () => renderMoveBody(mode)); };
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
        <div><div style="font-weight:800; font-size:17px;">${sel.name}</div><div style="font-size:12.5px; color:var(--ink70);">${sel.category || "—"} · ${t("available")}: ${sel.qty} ${sel.unit}</div></div>
        <button class="close-x" id="move-cancel">${icon("x", 16)}</button>
      </div>
      ${tape(sel)}
      <div style="margin:18px 0;">
        <label style="display:block; font-size:12.5px; font-weight:700; color:var(--ink70); margin-bottom:6px;">${t("qtyLabel")}</label>
        <div class="step-row">
          <button class="step-btn" id="qty-minus">${icon("minus", 16)}</button>
          <input id="qty-input" type="number" min="1" value="${sel.qty_input}" class="input mono" style="width:90px; text-align:center;">
          <button class="step-btn" id="qty-plus">${icon("plus", 16)}</button>
          <span style="color:var(--ink70); font-size:13px;">${sel.unit}</span>
        </div>
      </div>
      ${!isIn ? `<div class="field"><label>${t("workerLabel")}</label><input id="worker-input" class="input" style="width:100%;" value="${state.profile?.full_name || ""}" placeholder="مثال: أحمد محمد"></div>` : ""}
      <div class="field"><label>${t("noteLabel")}</label><input id="note-input" class="input" style="width:100%;" placeholder="${isIn ? "مثال: توريد جديد من المورد" : "مثال: لتفصيلة قميص رجالي"}"></div>
      ${willCrit ? `<div style="display:flex; gap:8px; align-items:center; background:var(--red-soft); color:var(--red); padding:9px 12px; border-radius:10px; font-size:12.5px; font-weight:700; margin-bottom:14px;">${icon("alert", 15)} بعد هذه العملية سيصبح الصنف ضمن المستوى الحرج (أقل من ${state.settings.alert_threshold_percent || 15}%)</div>` : ""}
      <button class="btn-primary" id="move-submit" style="background:${isIn ? "var(--green)" : "var(--ink)"}; display:flex; align-items:center; justify-content:center; gap:8px;">
        ${icon(isIn ? "in" : "out", 18)} ${isIn ? t("confirmIn") : t("confirmOut")}
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
    // تنبيه التكرار: هل تم بالفعل تنفيذ نفس نوع العملية (إدخال/سحب) على نفس الصنف اليوم؟
    const todayStr = new Date().toDateString();
    const dupToday = state.transactions.find(t => t.item_id === sel.id && t.type === mode && new Date(t.created_at).toDateString() === todayStr);
    if (dupToday) {
      const proceed = confirm(`⚠️ تم بالفعل تنفيذ عملية "${isIn ? "إدخال" : "سحب"}" على صنف "${sel.name}" اليوم الساعة ${new Date(dupToday.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} بكمية ${dupToday.qty} ${dupToday.unit}.\n\nهل ده تكرار بالغلط؟\n\nاضغط "موافق" للاستمرار وتنفيذ العملية دي كمان (لو فعلاً حصلت مرتين اليوم)، أو "إلغاء" لإلغاء هذه العملية المكررة.`);
      if (!proceed) return;
    }
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
    // إشعارات تلقائية عند عبور الصنف لحالة أسوأ بسبب عملية سحب (مرة واحدة بس وقت العبور،
    // مش مع كل عملية سحب بعد كده لتجنّب الإغراق بالإشعارات) — عبر Email و Telegram معًا،
    // كل قناة مستقلة عن التانية (لو Telegram معطّل أو مش متظبط، الإيميل يفضل يشتغل والعكس)
    if (!isIn) {
      // منطق الحالة الحرجة الأصلي — لم يتغيّر
      const wasCritical = statusOf(sel) === "critical";
      const nowCritical = statusOf({ ...sel, qty: newQty }) === "critical";
      if (!wasCritical && nowCritical) {
        notifyStockAlert(sel.name, newQty, sel.max_qty, sel.unit, sel.max_qty ? (newQty / sel.max_qty) * 100 : 0, "critical");
      }
      // تنبيه المخزون المنخفض الجديد: بس أول ما الصنف يعدّي من "جيد" لـ"منخفض"
      const wasLow = statusOf(sel) !== "ok";
      const nowLow = statusOf({ ...sel, qty: newQty }) === "warning";
      if (!wasLow && nowLow) {
        notifyStockAlert(sel.name, newQty, sel.max_qty, sel.unit, sel.max_qty ? (newQty / sel.max_qty) * 100 : 0, "low");
      }
    }
    toast(isIn ? `تم إدخال ${qty} ${sel.unit} إلى "${sel.name}"` : `تم سحب ${qty} ${sel.unit} من "${sel.name}"`);
    state.selectedItem = null;
    await Promise.all([loadItems(), loadTransactions()]);
    render();
  };
}

/* ---------------- stock table ---------------- */
function renderStock(main) {
  const collapsedCats = new Set();
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">${t("stockTitle")}</div><div class="section-sub">${state.items.length} ${t("itemsRegistered")}</div></div></div>
    <div class="toolbar">
      <div style="position:relative;"><span style="position:absolute; right:12px; top:11px; color:var(--ink50);">${icon("search", 15)}</span>
        <input id="stock-search" class="input" style="width:240px; padding-right:34px;" placeholder="${t("searchByNameCode")}"></div>
      <select id="stock-cat" class="input"><option value="__all__">${t("all")}</option>${state.categories.map(c => `<option value="${c}">${c}</option>`).join("")}</select>
      <button class="icon-btn" id="stock-toggle-all" style="width:auto; padding:0 12px; gap:6px; display:inline-flex; align-items:center; font-size:12.5px; font-weight:700;" title="طي/فرد كل الفئات">${icon("grid", 14)} طي الكل</button>
    </div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>${t("code")}</th><th>${t("itemName")}</th><th>${t("category")}</th><th>${t("quantity")}</th><th>%</th><th>${t("status")}</th><th></th></tr></thead><tbody id="stock-body"></tbody></table>
    </div>`;
  const draw = () => {
    const q = ($("#stock-search").value || "").toLowerCase();
    const cat = $("#stock-cat").value;
    const filtered = state.items.filter(i => (cat === "__all__" || i.category === cat) && (i.name.toLowerCase().includes(q) || (i.code || "").toLowerCase().includes(q)));
    if (!filtered.length) { $("#stock-body").innerHTML = `<tr><td colspan="7"><div class="empty-note">لا توجد نتائج مطابقة.</div></td></tr>`; return; }
    const groups = {};
    filtered.forEach(it => { const c = it.category || "بدون فئة"; (groups[c] = groups[c] || []).push(it); });
    $("#stock-body").innerHTML = Object.entries(groups).map(([catName, catItems]) => {
      const isCollapsed = collapsedCats.has(catName);
      return `
      <tr class="cat-row ${isCollapsed ? "is-collapsed" : ""}" data-cat-toggle="${catName}"><td colspan="7" style="background:var(--paper-deep); font-weight:800; font-size:12.5px; padding:8px 16px; border-top:2px solid var(--mustard);"><span class="cat-chevron">${icon("chevronDown", 13)}</span>${catName} <span style="font-weight:600; color:var(--ink50); font-size:11.5px;">(${catItems.length} صنف)</span></td></tr>
      ${catItems.map(it => `
        <tr data-cat-row="${catName}" style="${isCollapsed ? "display:none;" : ""}"><td class="mono" style="color:var(--mustard); font-weight:700;">${it.code || "—"}</td><td style="font-weight:700; padding-right:26px;">${it.name}</td><td style="color:var(--ink70);">${it.category || "—"}</td>
        <td class="mono">${it.qty} / ${it.max_qty} ${it.unit}</td><td style="width:200px;">${tape(it, true)}</td><td>${pill(statusOf(it))}</td>
        <td><button class="icon-btn" data-movement="${it.name}" title="عرض حركة هذا الصنف">${icon("history", 13)}</button></td></tr>`).join("")}
    `}).join("");
    $$("[data-movement]").forEach(b => b.onclick = () => { state.pendingItemFilter = b.dataset.movement; state.tab = "reports"; render(); });
    $$("[data-cat-toggle]").forEach(row => row.onclick = () => {
      const cat = row.dataset.catToggle;
      if (collapsedCats.has(cat)) collapsedCats.delete(cat); else collapsedCats.add(cat);
      row.classList.toggle("is-collapsed");
      $$(`[data-cat-row="${cat}"]`).forEach(r => r.style.display = collapsedCats.has(cat) ? "none" : "");
    });
  };
  $("#stock-search").oninput = draw; $("#stock-cat").onchange = draw;
  $("#stock-toggle-all").onclick = () => {
    const allCats = state.categories.length ? state.categories : [...new Set(state.items.map(i => i.category || "بدون فئة"))];
    const collapsingAll = collapsedCats.size < allCats.length;
    collapsedCats.clear();
    if (collapsingAll) allCats.forEach(c => collapsedCats.add(c));
    draw();
  };
  draw();
}

/* ---------------- reports ---------------- */
function renderReports(main) {
  const genTime = fmtDate(new Date().toISOString());
  main.innerHTML = `
    <div class="section-header no-print">
      <div><div class="section-title">${t("reportsTitle")}</div><div class="section-sub">${t("reportsSub")}</div></div>
      <div style="display:flex; gap:8px;">
        <button class="btn-dark" id="print-report">${icon("history", 14)} ${t("print")}</button>
        <button class="btn-dark" id="export-excel">${icon("download", 14)} ${t("exportExcelBtn")}</button>
      </div>
    </div>

    <div class="card no-print" style="margin-bottom:18px;">
      <div style="font-weight:800; font-size:14px; margin-bottom:12px; display:flex; align-items:center; gap:7px;">${icon("check", 15)} ${t("printSectionsTitle")}</div>
      <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:16px;">
        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="inc-lowstock" checked> ${t("lowStockSection")}</label>
        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="inc-consumption" checked> ${t("consumptionSection")}</label>
        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="inc-daily" checked> ${t("dailySection")}</label>
        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="inc-txlog" checked> ${t("txLogSection")}</label>
      </div>
      <div style="border-top:1px solid var(--line); padding-top:14px; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:12.5px; font-weight:800; color:var(--ink70);">${icon("grid", 14)} طباعة فئات معيّنة فقط <span style="font-weight:600; color:var(--ink50);">(اختَر الفئات اللي عايز تطبعها بس)</span></div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <label class="chip" style="cursor:pointer; background:var(--mustard-soft); color:var(--mustard);"><input type="checkbox" id="cat-filter-all" checked style="accent-color:var(--mustard);"> الكل</label>
          ${state.categories.map(c => `<label class="chip" style="cursor:pointer;"><input type="checkbox" class="cat-filter-item" value="${c}" checked style="accent-color:var(--mustard);"> ${c}</label>`).join("")}
        </div>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:end;">
        <div><label style="display:block; font-size:11.5px; color:var(--ink70); margin-bottom:4px;">${t("quickRange")}</label>
          <select id="range-filter" class="input" style="font-size:12.5px; padding:7px 10px;">
            <option value="all">${t("all")}</option><option value="today">اليوم</option><option value="week">آخر أسبوع</option><option value="month">آخر شهر</option>
          </select>
        </div>
        <div><label style="display:block; font-size:11.5px; color:var(--ink70); margin-bottom:4px;">${t("dateFrom")}</label><input type="date" id="date-from" class="input" style="font-size:12.5px; padding:7px 10px;"></div>
        <div><label style="display:block; font-size:11.5px; color:var(--ink70); margin-bottom:4px;">${t("dateTo")}</label><input type="date" id="date-to" class="input" style="font-size:12.5px; padding:7px 10px;"></div>
        <div><label style="display:block; font-size:11.5px; color:var(--ink70); margin-bottom:4px;">${t("status")}</label>
          <select id="type-filter" class="input" style="font-size:12.5px; padding:7px 10px;">
            <option value="all">${t("typeAll")}</option><option value="in">${t("typeIn")}</option><option value="out">${t("typeOut")}</option>
          </select>
        </div>
        <div><label style="display:block; font-size:11.5px; color:var(--ink70); margin-bottom:4px;">${t("itemName")}</label>
          <select id="item-filter" class="input" style="font-size:12.5px; padding:7px 10px; max-width:180px;">
            <option value="all">${t("allItems")}</option>
            ${[...new Set(state.items.map(i => i.name))].sort().map(n => `<option value="${n}">${n}</option>`).join("")}
          </select>
        </div>
        <div><label style="display:block; font-size:11.5px; color:var(--ink70); margin-bottom:4px;">${t("worker")}</label><input id="worker-filter" class="input" style="font-size:12.5px; padding:7px 10px; width:120px;" placeholder="${t("worker")}"></div>
        <button class="btn-dark" id="clear-filters" style="padding:7px 12px; font-size:12.5px;">${t("clearFilters")}</button>
      </div>
    </div>

    <div id="report-print-area">
      <div class="print-only print-header">
        <div style="font-weight:800; font-size:18px;">${state.settings.workshop_name || "مصنع نسيج"} — تقرير المخزون</div>
        <div style="font-size:12px; color:#555;">تم إنشاء التقرير في: ${genTime}</div>
      </div>

      <div class="card" id="section-lowstock" style="margin-bottom:18px;">
        <div style="font-weight:800; font-size:15px; margin-bottom:12px; display:flex; align-items:center; gap:7px;">${icon("alert", 16)} ${t("lowStockSection")}</div>
        <div id="low-stock-list"></div>
      </div>

      <div class="card" id="section-consumption" style="margin-bottom:18px;">
        <div style="font-weight:800; font-size:15px; margin-bottom:14px; display:flex; align-items:center; gap:7px;">${icon("chart", 16)} ${t("consumptionSection")}</div>
        <div id="consumption-list"></div>
      </div>

      <div class="card" id="section-daily" style="margin-bottom:18px;">
        <div style="font-weight:800; font-size:15px; margin-bottom:14px; display:flex; align-items:center; gap:7px;">${icon("grid", 16)} ${t("dailySection")}</div>
        <div style="overflow:auto;"><table><thead><tr><th>اليوم</th><th>عدد عمليات الإدخال</th><th>إجمالي الكمية المُدخلة</th><th>عدد عمليات السحب</th><th>إجمالي الكمية المسحوبة</th></tr></thead><tbody id="daily-body"></tbody></table></div>
      </div>

      <div class="card" id="section-txlog">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
          <div style="font-weight:800; font-size:15px; display:flex; align-items:center; gap:7px;">${icon("history", 16)} ${t("txLogSection")} — <span id="tx-count" class="mono" style="font-weight:600; color:var(--ink70); font-size:12.5px;"></span></div>
        </div>
        <div style="max-height:340px; overflow:auto;" class="print-scroll">
          <table><thead><tr><th>${t("itemName")}</th><th>${t("status")}</th><th>${t("quantity")}</th><th>${t("worker")}</th><th>${t("note")}</th><th>${t("dateTime")}</th><th class="no-print"></th></tr></thead><tbody id="tx-body"></tbody></table>
        </div>
      </div>
    </div>`;

  // خريطة اسم الصنف → الفئة، لاستخدامها في تصفية الحركات حسب الفئة المختارة للطباعة
  const nameToCat = {};
  state.items.forEach(i => { nameToCat[i.name] = i.category || "بدون فئة"; });
  const getAllowedCats = () => {
    const boxes = $$(".cat-filter-item");
    if (!boxes.length) return null;
    return new Set(boxes.filter(b => b.checked).map(b => b.value));
  };
  const updateMasterCatCheckbox = () => {
    const boxes = $$(".cat-filter-item"), allEl = $("#cat-filter-all");
    if (allEl && boxes.length) allEl.checked = boxes.every(b => b.checked);
  };

  let lowStock = [], cons = [], dailyRows = [];
  const refreshScopedLists = () => {
    const allowed = getAllowedCats();
    const passCat = (c) => !allowed || allowed.has(c);

    // الملخص اليومي: تجميع الحركات حسب اليوم (الوقت الدقيق لكل حركة يظهر بسجل الحركات بالأسفل)
    const dailyMap = {};
    state.transactions.filter(tx => passCat(nameToCat[tx.item_name] || "بدون فئة")).forEach(tx => {
      const day = new Date(tx.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit" });
      if (!dailyMap[day]) dailyMap[day] = { inCount: 0, inQty: 0, outCount: 0, outQty: 0 };
      if (tx.type === "in") { dailyMap[day].inCount++; dailyMap[day].inQty += Number(tx.qty); }
      else { dailyMap[day].outCount++; dailyMap[day].outQty += Number(tx.qty); }
    });
    dailyRows = Object.entries(dailyMap).sort((a, b) => b[0].localeCompare(a[0]));
    $("#daily-body").innerHTML = dailyRows.length ? dailyRows.map(([day, d]) => `
      <tr><td style="font-weight:700;" class="mono">${day}</td><td class="mono">${d.inCount}</td><td class="mono" style="color:var(--green);">+${d.inQty}</td>
      <td class="mono">${d.outCount}</td><td class="mono" style="color:var(--red);">-${d.outQty}</td></tr>`).join("")
      : `<tr><td colspan="5"><div class="empty-note">لا توجد حركات مسجّلة بعد.</div></td></tr>`;

    lowStock = state.items.filter(i => statusOf(i) !== "ok" && passCat(i.category || "بدون فئة")).sort((a, b) => pctOf(a) - pctOf(b));
    $("#low-stock-list").innerHTML = lowStock.length ? lowStock.map(it => `
      <div class="report-row" style="display:flex; align-items:center; gap:12px; margin-bottom:9px;">
        <div style="width:160px; font-size:13.3px; font-weight:700;">${it.name}</div>
        <div style="flex:1;">${tape(it, true)}</div>
        <div class="mono" style="width:110px; font-size:12px; color:var(--ink70);">${Math.round(pctOf(it))}% (${it.qty}/${it.max_qty})</div>
        ${pill(statusOf(it))}
      </div>`).join("") : `<div class="empty-note">لا توجد أصناف منخفضة ضمن الفئات المختارة.</div>`;

    const consMap = {};
    state.transactions.filter(tx => tx.type === "out" && passCat(nameToCat[tx.item_name] || "بدون فئة")).forEach(tx => { consMap[tx.item_name] = (consMap[tx.item_name] || 0) + Number(tx.qty); });
    cons = Object.entries(consMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCons = Math.max(1, ...cons.map(c => c[1]));
    $("#consumption-list").innerHTML = cons.length ? cons.map(([name, val]) => `
      <div class="report-row" style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
        <div style="width:160px; font-size:13px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</div>
        <div style="flex:1; background:var(--paper-deep); border-radius:8px; height:16px; position:relative; overflow:hidden;">
          <div style="position:absolute; inset:0; width:${(val / maxCons) * 100}%; background:var(--mustard); border-radius:8px;"></div>
        </div>
        <div class="mono" style="width:46px; font-size:12.5px; font-weight:700;">${val}</div>
      </div>`).join("") : `<div class="empty-note">لا توجد عمليات سحب ضمن الفئات المختارة.</div>`;
  };
  refreshScopedLists();

  const drawTx = () => {
    const range = $("#range-filter").value, type = $("#type-filter").value;
    const itemFilter = $("#item-filter").value, workerFilter = ($("#worker-filter").value || "").trim().toLowerCase();
    const fromVal = $("#date-from").value, toVal = $("#date-to").value;
    const allowedCats = getAllowedCats();
    let cutoffFrom = null, cutoffTo = null;
    if (fromVal || toVal) {
      if (fromVal) cutoffFrom = new Date(fromVal + "T00:00:00");
      if (toVal) cutoffTo = new Date(toVal + "T23:59:59");
    } else if (range !== "all") {
      const d = new Date();
      if (range === "today") d.setHours(0, 0, 0, 0);
      else if (range === "week") d.setDate(d.getDate() - 7);
      else if (range === "month") d.setMonth(d.getMonth() - 1);
      cutoffFrom = d;
    }
    const filtered = state.transactions.filter(t => {
      const dt = new Date(t.created_at);
      if (cutoffFrom && dt < cutoffFrom) return false;
      if (cutoffTo && dt > cutoffTo) return false;
      if (type !== "all" && t.type !== type) return false;
      if (itemFilter !== "all" && t.item_name !== itemFilter) return false;
      if (workerFilter && !(t.worker || "").toLowerCase().includes(workerFilter)) return false;
      if (allowedCats && !allowedCats.has(nameToCat[t.item_name] || "بدون فئة")) return false;
      return true;
    });
    $("#tx-count").textContent = `${filtered.length} حركة`;
    const voucherLabel = t("voucherBtn");
    $("#tx-body").innerHTML = filtered.length ? filtered.map(t => `
      <tr><td style="font-weight:700;">${t.item_name}</td>
      <td>${t.type === "in" ? '<span style="color:var(--green); font-weight:700;">إدخال</span>' : '<span style="color:var(--red); font-weight:700;">سحب</span>'}</td>
      <td class="mono">${t.qty} ${t.unit || ""}</td><td>${t.worker || "—"}</td><td style="color:var(--ink70);">${t.note || "—"}</td>
      <td class="mono" style="color:var(--ink70);">${fmtDate(t.created_at)}</td>
      <td class="no-print"><button class="icon-btn" data-voucher="${t.id}" title="${voucherLabel}">${icon("history", 13)}</button></td></tr>`).join("") : `<tr><td colspan="7"><div class="empty-note">لا توجد حركات ضمن هذا الفلتر.</div></td></tr>`;
    // ملحوظة: التعامل مع نقر زر الطباعة بيتم عن طريق مستمع عام (event delegation) في نهاية الملف
    return filtered;
  };
  let currentFiltered = drawTx();
  $("#cat-filter-all").onchange = (e) => { $$(".cat-filter-item").forEach(cb => cb.checked = e.target.checked); refreshScopedLists(); currentFiltered = drawTx(); };
  $$(".cat-filter-item").forEach(cb => cb.onchange = () => { updateMasterCatCheckbox(); refreshScopedLists(); currentFiltered = drawTx(); });
  if (state.pendingItemFilter) {
    const itemSel = $("#item-filter");
    if ([...itemSel.options].some(o => o.value === state.pendingItemFilter)) {
      itemSel.value = state.pendingItemFilter;
      currentFiltered = drawTx();
      // اختصار مباشر لتقرير حركة الصنف: امسح باقي الفلاتر، واقفل الأقسام التانية مؤقتًا، وانزل على طول لسجل الحركات
      $("#range-filter").value = "all"; $("#type-filter").value = "all"; $("#date-from").value = ""; $("#date-to").value = ""; $("#worker-filter").value = "";
      ["inc-lowstock", "inc-consumption", "inc-daily"].forEach(id => { $(`#${id}`).checked = false; });
      $("#section-lowstock").classList.add("hidden"); $("#section-consumption").classList.add("hidden"); $("#section-daily").classList.add("hidden");
      setTimeout(() => $("#section-txlog").scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
    state.pendingItemFilter = null;
  }
  ["range-filter", "type-filter", "item-filter"].forEach(id => $(`#${id}`).onchange = () => { currentFiltered = drawTx(); });
  ["date-from", "date-to"].forEach(id => $(`#${id}`).onchange = () => { $("#range-filter").value = "all"; currentFiltered = drawTx(); });
  $("#worker-filter").oninput = () => { currentFiltered = drawTx(); };
  $("#clear-filters").onclick = () => {
    $("#range-filter").value = "all"; $("#type-filter").value = "all"; $("#item-filter").value = "all";
    $("#date-from").value = ""; $("#date-to").value = ""; $("#worker-filter").value = "";
    currentFiltered = drawTx();
  };

  $("#print-report").onclick = () => {
    const sections = { lowstock: "inc-lowstock", consumption: "inc-consumption", daily: "inc-daily", txlog: "inc-txlog" };
    Object.entries(sections).forEach(([key, chkId]) => {
      const el = $(`#section-${key}`);
      el.classList.toggle("print-exclude", !$(`#${chkId}`).checked);
    });
    window.print();
  };
  window.addEventListener("afterprint", () => $$(".print-exclude").forEach(el => el.classList.remove("print-exclude")), { once: true });

  $("#export-excel").onclick = async () => {
   const exportBtn = $("#export-excel"); const exportBtnOrigText = exportBtn.innerHTML;
   try {
    exportBtn.disabled = true; exportBtn.innerHTML = "...جارِ التجهيز";
    await ensureXLSX();
    const genTime2 = fmtDate(new Date().toISOString());
    const wb = XLSX.utils.book_new();

    if ($("#inc-lowstock").checked) {
      const lowRows = lowStock.map(it => ({
        "الصنف": it.name, "الكود": it.code || "", "الفئة": it.category || "",
        "الكمية": it.qty, "الحد الأقصى": it.max_qty, "النسبة %": Math.round(pctOf(it)), "الحالة": STATUS_META[statusOf(it)].label,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lowRows.length ? lowRows : [{ "ملاحظة": "لا توجد أصناف منخفضة" }]), "الأصناف المنخفضة");
    }

    if ($("#inc-consumption").checked) {
      const consRows = cons.map(([name, val]) => ({ "الصنف": name, "إجمالي الكمية المسحوبة": val }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(consRows.length ? consRows : [{ "ملاحظة": "لا توجد عمليات سحب" }]), "الأكثر سحبًا");
    }

    // المخزون الحالي (مرجعي دايمًا)
    const stockRows = state.items.map(it => ({
      "الصنف": it.name, "الكود": it.code || "", "الفئة": it.category || "", "الوحدة": it.unit,
      "الكمية الحالية": it.qty, "الحد الأقصى": it.max_qty,
      "النسبة %": Math.round(pctOf(it)), "الحالة": STATUS_META[statusOf(it)].label,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockRows), "المخزون الحالي");

    if ($("#inc-daily").checked) {
      const dailySheetRows = dailyRows.map(([day, d]) => ({
        "اليوم": day, "عدد عمليات الإدخال": d.inCount, "إجمالي الكمية المُدخلة": d.inQty,
        "عدد عمليات السحب": d.outCount, "إجمالي الكمية المسحوبة": d.outQty,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailySheetRows.length ? dailySheetRows : [{ "ملاحظة": "لا توجد بيانات" }]), "الملخص اليومي");
    }

    if ($("#inc-txlog").checked) {
      const txRows = currentFiltered.map(t => ({
        "الصنف": t.item_name, "النوع": t.type === "in" ? "إدخال" : "سحب", "الكمية": t.qty,
        "الوحدة": t.unit || "", "العامل": t.worker || "", "ملاحظة": t.note || "",
        "التاريخ والساعة": fmtDate(t.created_at),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows.length ? txRows : [{ "ملاحظة": "لا توجد حركات ضمن هذا الفلتر" }]), "سجل الحركات");
    }

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ "المصنع": state.settings.workshop_name || "", "تاريخ إنشاء التقرير": genTime2 }]), "معلومات التقرير");

    XLSX.writeFile(wb, `تقرير_المخزون_${new Date().toISOString().slice(0, 10)}.xlsx`);
   } catch (e) {
    console.error("export-excel error:", e);
    toast("حدث خطأ أثناء تصدير Excel — " + (e && e.message ? e.message : ""), true);
   } finally {
    exportBtn.disabled = false; exportBtn.innerHTML = exportBtnOrigText;
   }
  };
}

/* ---------------- settings (branding + categories + items) ---------------- */
function renderSettings(main) {
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">${t("settingsTitle")}</div><div class="section-sub">${t("settingsSub")}</div></div></div>
    <div class="card" style="margin-bottom:18px; max-width:480px;">
      <div class="card-title">${icon("gear", 17)} ${t("factoryInfo")}</div>
      <div class="field"><label>${t("factoryName")}</label><input id="ws-name" class="input" style="width:100%;" value="${state.settings.workshop_name || ""}"></div>
      <div class="field">
        <label>${t("factoryLogo")}</label>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:52px; height:52px; border-radius:12px; background:var(--mustard); display:flex; align-items:center; justify-content:center; overflow:hidden;">
            ${state.settings.logo_base64 ? `<img src="${state.settings.logo_base64}" style="width:100%; height:100%; object-fit:cover;">` : icon("scissors", 24)}
          </div>
          <input id="ws-logo" type="file" accept="image/*">
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;"><label>${t("factoryAddress")}</label><input id="ws-address" class="input" style="width:100%;" value="${state.settings.address || ""}"></div>
        <div class="field" style="flex:1;"><label>${t("factoryPhone")}</label><input id="ws-phone" class="input" style="width:100%;" value="${state.settings.phone || ""}"></div>
      </div>
      <div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;"><label>${t("criticalPct")}</label><input id="ws-crit" type="number" min="1" max="90" class="input mono" style="width:100%;" value="${state.settings.alert_threshold_percent || 15}"></div>
        <div class="field" style="flex:1;"><label>${t("warningPct")}</label><input id="ws-warn" type="number" min="1" max="95" class="input mono" style="width:100%;" value="${state.settings.warning_threshold_percent || 30}"></div>
      </div>
      <button class="btn-primary" id="ws-save">${t("saveFactoryInfo")}</button>
    </div>

    <div class="card" style="margin-bottom:18px; max-width:560px;">
      <div class="card-title" style="margin-bottom:6px;">${icon("alert", 17)} إشعارات المخزون المنخفض (إيميل وتليجرام)</div>
      <div style="font-size:11.5px; color:var(--ink70); margin-bottom:14px;">لما أي صنف يوصل لمستوى منخفض أو حرج، النظام يبعت إشعار تلقائي فورًا. الخطوات الكاملة لإنشاء المفاتيح موجودة في ملف <code>migration_notifications.sql</code>.</div>
      <div class="field"><label>إيميلات الإشعارات (مفصولة بفاصلة)</label><input id="ws-emails" class="input" style="width:100%;" value="${state.settings.notify_emails || ""}" placeholder="admin@example.com, manager@example.com"></div>
      <div class="field">
        <label>مفتاح Resend (لإرسال الإيميلات)</label>
        <input id="ws-resend" class="input" style="width:100%;" value="${state.settings.resend_api_key || ""}" placeholder="re_xxxxxxxx">
        <div id="resend-key-status" style="font-size:11.5px; margin-top:6px; min-height:16px;"></div>
      </div>
      <div class="field" style="background:var(--paper); border-radius:10px; padding:12px;">
        <label>اختبار إرسال بريد إلكتروني حقيقي</label>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
          <input id="ws-test-email-to" class="input" style="flex:1; min-width:200px;" value="${(state.settings.notify_emails || "").split(",")[0].trim()}" placeholder="ابعت الاختبار على إيميل إيه؟ مثال: you@example.com">
          <button class="btn-dark" id="ws-test-email" type="button">${icon("alert", 14)} إرسال بريد اختباري</button>
        </div>
        <div id="test-email-status" style="font-size:12px; margin-top:8px; min-height:16px;"></div>
      </div>
      <div class="field"><label>توكن بوت تليجرام</label><input id="ws-tg-token" class="input" style="width:100%;" value="${state.settings.telegram_bot_token || ""}" placeholder="123456:ABC-..."></div>
      <div class="field">
        <label>سر التحقق من Webhook</label>
        <div style="display:flex; gap:6px;">
          <input id="ws-tg-webhook-secret" class="input" style="width:100%;" value="${state.settings.telegram_webhook_secret || ""}" placeholder="قيمة عشوائية طويلة من اختيارك">
          <button class="icon-btn" id="ws-tg-gen-secret" type="button" title="توليد قيمة عشوائية" style="flex-shrink:0; width:auto; padding:0 10px;">${icon("search", 13)}</button>
        </div>
        <div style="font-size:11px; color:var(--ink70); margin-top:4px;">لازم تحط نفس القيمة دي بالظبط كـ Supabase Secret باسم TELEGRAM_WEBHOOK_SECRET.</div>
      </div>
      <div id="tg-key-status" style="font-size:11.5px; margin:-6px 0 8px; min-height:16px;"></div>
      <div class="field" style="background:var(--paper); border-radius:10px; padding:12px;">
        <label>تفعيل استقبال التسجيل التلقائي من تيليجرام</label>
        <div style="font-size:11.5px; color:var(--ink70); margin:4px 0 8px;">أي شخص يضغط Start على البوت يتسجل تلقائيًا ويوصله أي تنبيه — من غير أي إدخال Chat ID يدوي. راجع تبويب "${t("navTelegram")}" لإدارة المسجَّلين وأدوارهم.</div>
        <button class="btn-dark" id="ws-tg-webhook-activate" type="button">${icon("send", 14)} تفعيل / تحديث Webhook</button>
        <div id="webhook-status" style="font-size:12px; margin-top:8px; min-height:16px;"></div>
      </div>
      <div class="field" style="background:var(--paper); border-radius:10px; padding:12px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div>
          <label style="margin-bottom:2px;">تقرير المخزن اليومي</label>
          <div style="font-size:11.5px; color:var(--ink70);">لو مفعّل، هيتبعت تلقائيًا كل يوم الساعة ${state.settings.daily_report_time || "16:00"} (بتوقيت اسطنبول) عبر الإيميل وTelegram المتظبطين فوق</div>
        </div>
        <button type="button" id="ws-daily-report-toggle" class="lang-btn ${state.settings.daily_report_enabled ? "active-lang" : ""}" style="flex-shrink:0; padding:8px 16px;" data-on="${state.settings.daily_report_enabled ? "1" : "0"}">${state.settings.daily_report_enabled ? "✓ مفعّل (ON)" : "متوقف (OFF)"}</button>
      </div>
      <button class="btn-primary" id="ws-save-notify">حفظ إعدادات الإشعارات</button>
    </div>

    ${isAdmin() ? `
    <div class="card" style="margin-bottom:18px; max-width:560px;">
      <div class="card-title" style="margin-bottom:6px;">${icon("history", 17)} النسخ الاحتياطي</div>
      <div style="font-size:11.5px; color:var(--ink70); margin-bottom:14px;">نسخة تلقائية كل يوم + إمكانية إنشاء نسخة يدوية أو استعادة نسخة سابقة. الاستعادة ترجّع الأصناف والفئات وبيانات المصنع فقط، وسجل الحركات لا يتأثر أبدًا.</div>
      <button class="btn-dark" id="backup-now" style="margin-bottom:16px;">${icon("download", 14)} إنشاء نسخة احتياطية الآن</button>
      <div id="backups-list"></div>
    </div>` : ""}`;

  if (isAdmin()) loadAndDrawBackups(main);

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
    if (error) { toast("تعذر حفظ الإعدادات — " + (error.message || ""), true); return; }
    await loadSettings(); applyBranding(); logAudit({ action: "تعديل إعدادات المصنع", entity: "settings" }); toast("تم حفظ بيانات المصنع");
  };

  $("#ws-save-notify").onclick = async () => {
    const saveBtn = $("#ws-save-notify");
    const statusEl = $("#resend-key-status");
    const tgStatusEl = $("#tg-key-status");
    const resendKey = $("#ws-resend").value.trim();
    const tgToken = $("#ws-tg-token").value.trim();
    const tgWebhookSecret = $("#ws-tg-webhook-secret").value.trim();
    statusEl.textContent = ""; statusEl.style.color = "";
    tgStatusEl.textContent = ""; tgStatusEl.style.color = "";

    // لا نسمح بحفظ مفتاح Resend غير صحيح — نتحقق منه فعليًا مع Resend قبل أي حفظ
    if (resendKey) {
      saveBtn.disabled = true; saveBtn.textContent = "جاري التحقق من مفتاح Resend...";
      const check = await callEmailService({ action: "validate", apiKey: resendKey });
      saveBtn.disabled = false; saveBtn.textContent = "حفظ إعدادات الإشعارات";
      if (check.error || !check.valid) {
        statusEl.style.color = "var(--red)";
        statusEl.textContent = "✗ " + (check.valid === false ? (check.reason || "مفتاح Resend غير صحيح") : check.error);
        toast("لم يتم الحفظ — مفتاح Resend غير صحيح", true);
        return; // إيقاف الحفظ تمامًا — مفيش حفظ لمفتاح غلط
      }
      statusEl.style.color = "var(--green)";
      statusEl.textContent = "✓ تم التحقق من المفتاح بنجاح";
    }

    // التحقق من صحة توكن Telegram Bot (Chat ID مالوش داعي دلوقتي — التسجيل بقى تلقائي بالكامل)
    if (tgToken) {
      saveBtn.disabled = true; saveBtn.textContent = "جاري التحقق من Telegram...";
      const tgCheck = await callTelegramService({ action: "validate", token: tgToken });
      saveBtn.disabled = false; saveBtn.textContent = "حفظ إعدادات الإشعارات";
      if (tgCheck.error || !tgCheck.valid) {
        tgStatusEl.style.color = "var(--red)";
        tgStatusEl.textContent = "✗ " + (tgCheck.valid === false ? (tgCheck.reason || "مفتاح Telegram Bot غير صحيح") : tgCheck.error);
        toast("لم يتم الحفظ — مفتاح Telegram Bot غير صحيح", true);
        return; // إيقاف الحفظ تمامًا — مفيش حفظ لتوكن غلط
      }
      tgStatusEl.style.color = "var(--green)";
      tgStatusEl.textContent = `✓ تم التحقق من البوت بنجاح${tgCheck.botUsername ? " (@" + tgCheck.botUsername + ")" : ""}`;
    }

    const payload = {
      notify_emails: $("#ws-emails").value.trim(),
      resend_api_key: resendKey,
      telegram_bot_token: tgToken,
      telegram_webhook_secret: tgWebhookSecret,
      daily_report_enabled: $("#ws-daily-report-toggle").dataset.on === "1",
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.from("settings").update(payload).eq("id", 1);
    if (error) { toast("تعذر حفظ إعدادات الإشعارات — " + (error.message || ""), true); return; }
    await loadSettings();
    logAudit({ action: "تعديل إعدادات الإشعارات", entity: "settings" });
    toast("تم حفظ إعدادات الإشعارات");
  };

  $("#ws-daily-report-toggle").onclick = () => {
    const btn = $("#ws-daily-report-toggle");
    const isOn = btn.dataset.on === "1";
    btn.dataset.on = isOn ? "0" : "1";
    btn.classList.toggle("active-lang", !isOn);
    btn.textContent = !isOn ? "✓ مفعّل (ON)" : "متوقف (OFF)";
  };

  $("#ws-tg-gen-secret").onclick = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const secret = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    $("#ws-tg-webhook-secret").value = secret;
    toast("تم توليد سر جديد — لازم تحفظ الإعدادات، وتحط نفس القيمة كـ Supabase Secret، ثم تضغط تفعيل Webhook");
  };

  $("#ws-tg-webhook-activate").onclick = async () => {
    const btn = $("#ws-tg-webhook-activate");
    const statusEl = $("#webhook-status");
    const tgToken = $("#ws-tg-token").value.trim();
    const secret = $("#ws-tg-webhook-secret").value.trim();
    statusEl.textContent = ""; statusEl.style.color = "";

    if (!tgToken) { statusEl.style.color = "var(--red)"; statusEl.textContent = "✗ اكتب توكن البوت الأول"; return; }
    if (!secret) { statusEl.style.color = "var(--red)"; statusEl.textContent = "✗ اكتب أو ولّد سر Webhook الأول"; return; }

    btn.disabled = true; btn.textContent = "...جارِ التفعيل";
    try {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;
      const res = await fetch(`https://api.telegram.org/bot${tgToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (data.ok) {
        statusEl.style.color = "var(--green)";
        statusEl.textContent = "✓ تم تفعيل الـ Webhook بنجاح — البرنامج جاهز يستقبل تسجيلات تلقائية";
        toast("تم تفعيل Webhook بنجاح");
      } else {
        statusEl.style.color = "var(--red)";
        statusEl.textContent = "✗ " + (data.description || "فشل التفعيل");
        toast("فشل تفعيل Webhook", true);
      }
    } catch (e) {
      statusEl.style.color = "var(--red)";
      statusEl.textContent = "✗ تعذر الاتصال بتيليجرام — تأكد من توكن البوت والاتصال بالإنترنت";
    } finally {
      btn.disabled = false; btn.innerHTML = `${icon("send", 14)} تفعيل / تحديث Webhook`;
    }
  };

  $("#ws-test-email").onclick = async () => {
    const testBtn = $("#ws-test-email");
    const statusEl = $("#test-email-status");
    const resendKey = $("#ws-resend").value.trim();
    const to = $("#ws-test-email-to").value.trim();
    statusEl.textContent = ""; statusEl.style.color = "";

    if (!resendKey) { statusEl.style.color = "var(--red)"; statusEl.textContent = "✗ اكتب مفتاح Resend الأول قبل الاختبار"; return; }
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { statusEl.style.color = "var(--red)"; statusEl.textContent = "✗ اكتب إيميل صحيح لاستقبال رسالة الاختبار"; return; }

    testBtn.disabled = true; testBtn.textContent = "جاري الإرسال...";
    const res = await callEmailService({ action: "sendTest", apiKey: resendKey, to });
    testBtn.disabled = false; testBtn.textContent = "إرسال بريد اختباري";

    if (res.error || res.success === false) {
      statusEl.style.color = "var(--red)";
      statusEl.textContent = "✗ فشل الإرسال — " + (res.reason || res.error || "خطأ غير معروف");
      toast("فشل إرسال البريد الاختباري", true);
    } else {
      statusEl.style.color = "var(--green)";
      statusEl.textContent = `✓ تم إرسال البريد بنجاح إلى ${to} — تأكد إنه وصل (وتحقق من مجلد Spam لو ملقيتوش)`;
      toast("تم إرسال البريد الاختباري بنجاح");
    }
  };
}

/* ---------------- النسخ الاحتياطي ---------------- */
async function loadAndDrawBackups(main) {
  await loadBackups();
  const list = $("#backups-list");
  if (!list) return;
  list.innerHTML = state.backups.length ? `
    <table><thead><tr><th>التاريخ والوقت</th><th>بواسطة</th><th></th></tr></thead><tbody>
      ${state.backups.map(b => `
        <tr>
          <td class="mono">${fmtDate(b.created_at)}</td>
          <td style="color:var(--ink70);">${b.created_by || "—"}</td>
          <td><div style="display:flex; gap:8px; justify-content:flex-end;">
            <button class="icon-btn" data-dl-backup="${b.id}" title="تنزيل كملف JSON">${icon("download", 13)}</button>
            <button class="icon-btn" style="color:var(--red);" data-restore-backup="${b.id}" title="استعادة هذه النسخة">${icon("history", 13)}</button>
          </div></td>
        </tr>`).join("")}
    </tbody></table>` : `<div class="empty-note">لا توجد نسخ احتياطية بعد — اضغط "إنشاء نسخة احتياطية الآن" لعمل أول نسخة.</div>`;

  $$("[data-dl-backup]").forEach(b => b.onclick = async () => {
    const { data } = await sb.from("backups").select("*").eq("id", b.dataset.dlBackup).maybeSingle();
    if (!data) { toast("تعذر تحميل النسخة", true); return; }
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `نسخة_احتياطية_${data.created_at.slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  });

  $$("[data-restore-backup]").forEach(b => b.onclick = async () => {
    if (!confirm("هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال الأصناف والفئات وبيانات المصنع الحالية بمحتوى هذه النسخة. سجل الحركات لن يتأثر. سيتم أخذ نسخة أمان تلقائية قبل الاستعادة.")) return;
    const { error } = await sb.rpc("restore_backup", { backup_id: b.dataset.restoreBackup });
    if (error) { toast("تعذر الاستعادة: " + error.message, true); return; }
    logAudit({ action: "استعادة نسخة احتياطية", entity: "backup", entityName: b.dataset.restoreBackup });
    await Promise.all([loadItems(), loadCategories(), loadSettings()]);
    applyBranding();
    toast("تمت الاستعادة بنجاح");
    renderSettings(main);
  });

  const btn = $("#backup-now");
  if (btn) btn.onclick = async () => {
    btn.disabled = true; btn.textContent = "...جارِ الإنشاء";
    const { error } = await sb.rpc("create_backup", { actor: state.profile?.full_name || "يدوي" });
    btn.disabled = false; btn.innerHTML = `${icon("download", 14)} إنشاء نسخة احتياطية الآن`;
    if (error) { toast("تعذر إنشاء النسخة: " + error.message, true); return; }
    logAudit({ action: "إنشاء نسخة احتياطية يدوية", entity: "backup" });
    toast("تم إنشاء النسخة الاحتياطية");
    await loadAndDrawBackups(main);
  };
}

/* ---------------- طباعة إذن صرف / إذن استلام لحركة واحدة ---------------- */
function printVoucher(tx) {
  const isIn = tx.type === "in";
  const title = isIn ? "إذن استلام مخزني" : "إذن صرف مخزني";
  const voucherNo = (tx.id || "").slice(0, 8).toUpperCase();
  const w = state.settings;
  const item = state.items.find(i => i.name === tx.item_name);
  const html = `
    <div style="padding:20px; color:#17323C; direction:rtl; max-width:800px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #17323C; padding-bottom:16px; margin-bottom:20px;">
        <div style="display:flex; align-items:center; gap:12px;">
          ${w.logo_base64 ? `<img src="${w.logo_base64}" style="width:52px; height:52px; border-radius:10px; object-fit:cover;">` : ""}
          <div>
            <div style="font-weight:800; font-size:19px;">${w.workshop_name || "مصنع نسيج"}</div>
            <div style="font-size:11.5px; color:#666;">${w.address || ""}${w.address && w.phone ? " · " : ""}${w.phone || ""}</div>
          </div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:22px; font-weight:800; color:${isIn ? "#2F8F5B" : "#C85D51"};">${title}</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">رقم الإذن: ${voucherNo}</div>
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse; margin:22px 0;">
        <tr><th style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px; text-align:right; background:#f2f2f2; width:160px; font-weight:700;">التاريخ والساعة</th><td style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px;">${fmtDate(tx.created_at)}</td></tr>
        <tr><th style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px; text-align:right; background:#f2f2f2; font-weight:700;">الصنف</th><td style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px;">${tx.item_name}${item?.code ? ` (${item.code})` : ""}</td></tr>
        <tr><th style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px; text-align:right; background:#f2f2f2; font-weight:700;">الفئة</th><td style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px;">${item?.category || "—"}</td></tr>
        <tr><th style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px; text-align:right; background:#f2f2f2; font-weight:700;">الكمية</th><td style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px;">${tx.qty} ${tx.unit || ""}</td></tr>
        <tr><th style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px; text-align:right; background:#f2f2f2; font-weight:700;">${isIn ? "المورد / جهة التوريد" : "المستلم / العامل"}</th><td style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px;">${tx.worker || "—"}</td></tr>
        <tr><th style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px; text-align:right; background:#f2f2f2; font-weight:700;">ملاحظات</th><td style="border:1px solid #ccc; padding:10px 14px; font-size:13.5px;">${tx.note || "—"}</td></tr>
      </table>
      <div style="display:flex; justify-content:space-between; margin-top:60px;">
        <div style="width:30%; text-align:center;"><div style="border-top:1px solid #333; margin-top:50px; padding-top:6px; font-size:12.5px; color:#444;">أمين المخزن</div></div>
        <div style="width:30%; text-align:center;"><div style="border-top:1px solid #333; margin-top:50px; padding-top:6px; font-size:12.5px; color:#444;">${isIn ? "المورد" : "المستلم"}</div></div>
        <div style="width:30%; text-align:center;"><div style="border-top:1px solid #333; margin-top:50px; padding-top:6px; font-size:12.5px; color:#444;">اعتماد المدير</div></div>
      </div>
      <div style="margin-top:40px; font-size:10.5px; color:#999; text-align:center;">تم إنشاء هذا الإذن تلقائيًا بواسطة نظام إدارة المخازن — ${fmtDate(new Date().toISOString())}</div>
    </div>`;

  const fullDoc = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>${title} - ${voucherNo}</title>
<style>
  * { box-sizing: border-box; font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; }
  body { margin: 0; }
  @media print { @page { margin: 12mm; } }
</style></head><body>${html}</body></html>`;

  try {
    let frame = document.getElementById("voucher-print-frame");
    if (frame) frame.remove();
    frame = document.createElement("iframe");
    frame.id = "voucher-print-frame";
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);

    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(fullDoc);
    doc.close();

    // ملحوظة مهمة: حدث onload لا يُطلَق بشكل موثوق للـ iframe اللي محتواه اتكتب بـ document.write
    // (ده كان سبب المشكلة الأصلية)، فبننادي الطباعة مباشرة بعد doc.close() بدل ما ننتظر onload
    frame.contentWindow.focus();
    frame.contentWindow.print();
    // تنظيف الإطار المخفي بعد فترة كافية لإتمام الطباعة
    setTimeout(() => { const f = document.getElementById("voucher-print-frame"); if (f) f.remove(); }, 3000);
  } catch (e) {
    toast("تعذّرت طباعة الإذن: " + e.message, true);
  }
}

/* ---------------- إدارة الأصناف والفئات (المدير وأمين المخزن) ---------------- */
async function renderItemsAdmin(main) {
  if (!_suppliersLoaded) { main.innerHTML = `<div class="empty-note">جاري تحميل البيانات...</div>`; await ensureSuppliers(); if (state.tab !== "items") return; }
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">${t("itemsAdminTitle")}</div><div class="section-sub">${t("itemsAdminSub")}</div></div></div>

    <div class="card" style="margin-bottom:18px; max-width:480px;">
      <div class="card-title">${icon("grid", 17)} ${t("categoriesTitle")}</div>
      <div id="cat-chips" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px;"></div>
      <div style="display:flex; gap:8px;">
        <input id="new-cat" class="input" style="flex:1;" placeholder="${t("newCategoryPlaceholder")}">
        <button class="btn-dark" id="add-cat">${icon("plus", 14)} ${t("add")}</button>
      </div>
    </div>

    <details class="collapsible-card" style="max-width:620px;">
      <summary>${icon("download", 17)} استيراد أصناف من Excel <svg class="chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></summary>
      <div class="collapsible-body">
      <div style="font-size:12.5px; color:var(--ink70); margin-bottom:10px;">بيضيف مئات الأصناف دفعة واحدة من ملف Excel. اتبع الخطوات بالترتيب:</div>
      <ol style="font-size:12.5px; color:var(--ink70); margin:0 0 14px; padding-right:20px; line-height:2;">
        <li>اضغط <b>"تنزيل قالب Excel"</b> تحت — هيوصلك ملف فيه صف مثال (اسمه واضح "مثال — احذفه") + شيت تعليمات.</li>
        <li>افتح الملف، احذف صف المثال، واكتب بيانات أصنافك الحقيقية بنفس ترتيب الأعمدة.</li>
        <li>احفظ الملف، وارفعه بزرار <b>"اختيار ملف Excel"</b> تحت.</li>
      </ol>
      <div style="background:var(--paper-deep); border-radius:10px; padding:12px 14px; margin-bottom:14px; font-size:12px;">
        <b>الأعمدة المطلوبة بالظبط (بنفس الأسماء):</b>
        <ul style="margin:8px 0 0; padding-right:18px; line-height:1.9;">
          <li><b>اسم الصنف</b> — إجباري</li>
          <li><b>الفئة</b> — إجباري (لو الفئة مش موجودة عندك، هتتضاف تلقائيًا)</li>
          <li><b>الوحدة</b> — إجباري (مثال: متر، قطعة، بكرة)</li>
          <li><b>الكمية</b> — إجباري (رقم)</li>
          <li><b>الحد الأقصى</b> — إجباري (رقم، أساس حساب نسبة التنبيه)</li>
          <li><b>الكود</b> — اختياري (لو سايبه فاضي هيتولّد تلقائيًا)</li>
          <li><b>الباركود</b> — اختياري</li>
        </ul>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <button class="btn-dark" id="download-template">${icon("download", 14)} تنزيل قالب Excel</button>
        <label class="btn-dark" style="cursor:pointer;">${icon("plus", 14)} اختيار ملف Excel
          <input type="file" id="import-file" accept=".xlsx,.xls" style="display:none;">
        </label>
      </div>
      <div id="import-status" style="margin-top:12px; font-size:12.5px;"></div>
      </div>
    </details>

    <div class="section-header"><div style="font-weight:800; font-size:16px;">${t("itemsTitle")}</div>
      <button class="btn-dark" id="new-item-btn">${icon("plus", 15)} ${t("newItemBtn")}</button></div>
    <div class="toolbar">
      <div style="position:relative; max-width:320px; flex:1;">
        <span style="position:absolute; right:12px; top:11px; color:var(--ink50);">${icon("search", 15)}</span>
        <input id="items-search" class="input" style="width:100%; padding-right:34px;" placeholder="${t("searchByNameCode")}">
      </div>
    </div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>${t("code")}</th><th>${t("itemName")}</th><th>${t("category")}</th><th>${t("unit")}</th><th>${t("currentQty")}</th><th>${t("maxQty")}</th><th>${t("itemSupplier")}</th><th>${t("itemStorage")}</th><th></th></tr></thead><tbody id="items-body"></tbody></table>
    </div>`;

  $("#download-template").onclick = async () => {
    const dtBtn = $("#download-template"); const dtOrigText = dtBtn.innerHTML;
    try {
      dtBtn.disabled = true; dtBtn.innerHTML = "...جارِ التجهيز";
      await ensureXLSX();
    } catch (e) { toast("تعذر تحميل مكتبة Excel — تأكد من الاتصال بالإنترنت", true); dtBtn.disabled = false; dtBtn.innerHTML = dtOrigText; return; }
    dtBtn.disabled = false; dtBtn.innerHTML = dtOrigText;
    const wb = XLSX.utils.book_new();

    const instructions = [
      { "التعليمات": "1. احذف صف المثال في شيت (أصناف) قبل إدخال بياناتك." },
      { "التعليمات": "2. لازم تكتب بيانات كل صنف في صف مستقل تحت صف العناوين." },
      { "التعليمات": "3. الأعمدة الإجبارية: اسم الصنف، الفئة، الوحدة، الكمية، الحد الأقصى." },
      { "التعليمات": "4. الكود والباركود اختياريان — لو سايبهم فاضيين هيتولدوا تلقائيًا." },
      { "التعليمات": "5. لو الفئة اللي كتبتها مش موجودة في النظام، هتتضاف تلقائيًا وقت الاستيراد." },
      { "التعليمات": "6. احفظ الملف بصيغة xlsx وارفعه من زرار (اختيار ملف Excel) في صفحة إدارة الأصناف." },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(instructions), "تعليمات");

    const sample = [
      { "اسم الصنف": "مثال — احذف هذا الصف", "الفئة": "أقمشة", "الوحدة": "متر", "الكمية": 50, "الحد الأقصى": 200, "الكود": "", "الباركود": "" },
      { "اسم الصنف": "خيط بوليستر أسود", "الفئة": "خيوط", "الوحدة": "بكرة", "الكمية": 30, "الحد الأقصى": 100, "الكود": "", "الباركود": "" },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sample), "أصناف");

    XLSX.writeFile(wb, "قالب_استيراد_الأصناف.xlsx");
  };

  $("#import-file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = $("#import-status");
    statusEl.innerHTML = `<span style="color:var(--ink70);">...جارِ قراءة الملف</span>`;
    try {
      await ensureXLSX();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      // نقرأ شيت "أصناف" بالاسم لو موجود (ملف القالب فيه شيت تعليمات كمان)، وإلا أول شيت في الملف للتوافق مع ملفات قديمة
      const sheetName = wb.SheetNames.includes("أصناف") ? "أصناف" : wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const colVal = (row, ...keys) => { for (const k of keys) if (row[k] !== undefined && row[k] !== "") return row[k]; return ""; };
      const validRows = [];
      const skipped = [];
      const newCats = new Set();

      rows.forEach((row, idx) => {
        const name = String(colVal(row, "اسم الصنف", "الصنف", "name")).trim();
        if (name.includes("مثال") && name.includes("احذف")) return; // تجاهل صف المثال لو نسي المستخدم يحذفه
        const category = String(colVal(row, "الفئة", "category")).trim() || (state.categories[0] || "أخرى");
        const unit = String(colVal(row, "الوحدة", "unit")).trim() || "قطعة";
        const qty = Number(colVal(row, "الكمية", "qty")) || 0;
        const maxQty = Number(colVal(row, "الحد الأقصى", "max_qty")) || 0;
        const code = String(colVal(row, "الكود", "code")).trim();
        const barcode = String(colVal(row, "الباركود", "barcode")).trim();
        if (!name || !maxQty) { skipped.push(idx + 2); return; }
        if (!state.categories.includes(category)) newCats.add(category);
        validRows.push({ name, category, unit, qty, max_qty: maxQty, code: code || null, barcode: barcode || null });
      });

      if (!validRows.length) { statusEl.innerHTML = `<span style="color:var(--red); font-weight:700;">لا توجد صفوف صالحة للاستيراد (تأكد من عمودي "اسم الصنف" و"الحد الأقصى").</span>`; e.target.value = ""; return; }

      // كشف التكرار: أصناف بنفس الاسم موجودة بالفعل في النظام، أو مكررة داخل الملف نفسه
      const existingNames = new Set(state.items.map(i => i.name.trim().toLowerCase()));
      const seenInFile = new Set();
      const dupNames = new Set();
      validRows.forEach(r => {
        const key = r.name.trim().toLowerCase();
        if (existingNames.has(key) || seenInFile.has(key)) dupNames.add(r.name);
        seenInFile.add(key);
      });

      let finalRows = validRows;
      if (dupNames.size) {
        const list = [...dupNames].slice(0, 10).join("، ") + (dupNames.size > 10 ? " ..." : "");
        const proceed = confirm(`⚠️ لوحظ ${dupNames.size} صنف مكرر (موجود بالفعل أو مكرر داخل الملف نفسه):\n${list}\n\nاضغط "موافق" لاستيراد الكل بما فيهم المكررات كأصناف منفصلة، أو "إلغاء" لاستبعاد المكررات والاستيراد بالباقي فقط.`);
        if (!proceed) {
          const seen2 = new Set();
          finalRows = validRows.filter(r => {
            const key = r.name.trim().toLowerCase();
            if (existingNames.has(key) || seen2.has(key)) return false;
            seen2.add(key);
            return true;
          });
          if (!finalRows.length) { statusEl.innerHTML = `<span style="color:var(--red); font-weight:700;">كل الصفوف كانت مكررة — لم يتم استيراد أي صنف جديد.</span>`; e.target.value = ""; return; }
          validRows.length = 0; validRows.push(...finalRows);
        }
      }

      statusEl.innerHTML = `<span style="color:var(--ink70);">...جارِ استيراد ${validRows.length} صنف</span>`;

      // إضافة أي فئات جديدة واردة في الملف قبل استيراد الأصناف
      for (const cat of newCats) { await sb.from("categories").insert({ name: cat }).select(); }
      if (newCats.size) await loadCategories();

      // توليد أكواد تلقائية لأي صف من غير كود (بعداد محلي عشان مانكررش نفس الكود لأصناف بنفس الفئة في نفس الملف)
      const localCounters = {};
      validRows.forEach(r => {
        if (r.code) return;
        const base = genItemCode(r.category); // يرجع مثلاً FAB-0007 بناءً على الأصناف الموجودة فعلاً
        const prefix = base.split("-")[0];
        if (!(prefix in localCounters)) localCounters[prefix] = parseInt(base.split("-")[1], 10);
        else localCounters[prefix]++;
        r.code = `${prefix}-${String(localCounters[prefix]).padStart(4, "0")}`;
      });

      const { data: insertedItems, error } = await sb.from("items").insert(validRows).select();
      if (error) {
        statusEl.innerHTML = `<span style="color:var(--red); font-weight:700;">تعذر الاستيراد: ${error.message}</span>`;
      } else {
        // تسجيل رصيد افتتاحي كحركة "إدخال" لكل صنف اتضاف بكمية أكبر من صفر
        const openingTx = (insertedItems || []).filter(it => it.qty > 0).map(it => ({
          item_id: it.id, item_name: it.name, unit: it.unit, type: "in", qty: it.qty,
          worker: state.profile?.full_name || "", note: "رصيد افتتاحي — استيراد Excel",
        }));
        if (openingTx.length) { await sb.from("transactions").insert(openingTx); await loadTransactions(); }
        logAudit({ action: "استيراد أصناف من Excel", entity: "item", details: `تم استيراد ${validRows.length} صنف` });
        statusEl.innerHTML = `<span style="color:var(--green); font-weight:700;">✔ تم استيراد ${validRows.length} صنف بنجاح${skipped.length ? ` — تم تجاهل ${skipped.length} صف ناقص البيانات (السطور: ${skipped.slice(0, 10).join("، ")}${skipped.length > 10 ? "..." : ""})` : ""}</span>`;
        await loadItems();
        renderItemsAdmin(main);
        toast(`تم استيراد ${validRows.length} صنف`);
      }
    } catch (err) {
      statusEl.innerHTML = `<span style="color:var(--red); font-weight:700;">تعذرت قراءة الملف: ${err.message}</span>`;
    }
    e.target.value = "";
  };

  const drawCats = () => {
    $("#cat-chips").innerHTML = state.categories.map(c => `<span class="chip">${c}<button data-cat="${c}">${icon("x", 12)}</button></span>`).join("");
    $$("[data-cat]").forEach(b => b.onclick = async () => {
      if (!confirm(`حذف فئة "${b.dataset.cat}"؟ (لن يتأثر الأصناف الموجودة بها)`)) return;
      await sb.from("categories").delete().eq("name", b.dataset.cat);
      logAudit({ action: "حذف فئة", entity: "category", entityName: b.dataset.cat });
      await loadCategories(); renderItemsAdmin(main);
    });
  };
  drawCats();
  $("#add-cat").onclick = async () => {
    const val = $("#new-cat").value.trim();
    if (!val) { toast("أدخل اسم الفئة", true); return; }
    const { error } = await sb.from("categories").insert({ name: val });
    if (error) { toast("هذه الفئة موجودة بالفعل", true); return; }
    logAudit({ action: "إضافة فئة", entity: "category", entityName: val });
    await loadCategories(); renderItemsAdmin(main); toast("تمت إضافة الفئة");
  };

  const collapsedItemCats = new Set();
  const drawItems = () => {
    const q = ($("#items-search").value || "").toLowerCase().trim();
    const filtered = q ? state.items.filter(it => it.name.toLowerCase().includes(q) || (it.code || "").toLowerCase().includes(q)) : state.items;
    const isNew = (it) => it.created_at && (Date.now() - new Date(it.created_at).getTime()) < 48 * 3600 * 1000; // آخر 48 ساعة
    if (!filtered.length) { $("#items-body").innerHTML = `<tr><td colspan="9"><div class="empty-note">لا توجد نتائج مطابقة.</div></td></tr>`; return; }
    const groups = {};
    filtered.forEach(it => { const c = it.category || "بدون فئة"; (groups[c] = groups[c] || []).push(it); });
    $("#items-body").innerHTML = Object.entries(groups).map(([catName, catItems]) => {
      const isCollapsed = collapsedItemCats.has(catName);
      return `
      <tr class="cat-row ${isCollapsed ? "is-collapsed" : ""}" data-icat-toggle="${catName}"><td colspan="9" style="background:var(--paper-deep); font-weight:800; font-size:12.5px; padding:8px 16px; border-top:2px solid var(--mustard);"><span class="cat-chevron">${icon("chevronDown", 13)}</span>${catName} <span style="font-weight:600; color:var(--ink50); font-size:11.5px;">(${catItems.length} صنف)</span></td></tr>
      ${catItems.map(it => `
      <tr data-icat-row="${catName}" style="${isCollapsed ? "display:none;" : ""}"><td class="mono" style="font-weight:700; color:var(--mustard);">${it.code || "—"}</td>
      <td style="font-weight:700;">${it.name} ${isNew(it) ? `<span class="pill pill-ok" style="margin-right:6px;">جديد</span>` : ""}</td>
      <td style="color:var(--ink70);">${it.category || "—"}</td><td>${it.unit}</td>
      <td class="mono">${it.qty}</td><td class="mono">${it.max_qty}</td>
      <td style="color:var(--ink70); font-size:12.5px;">${(state.suppliers.find(s => s.id === it.supplier_id) || {}).name || "—"}</td>
      <td style="color:var(--ink70); font-size:12.5px;">${it.storage_location || "—"}</td>
      <td><div style="display:flex; gap:6px; justify-content:flex-end;">
        <button class="icon-btn" style="color:var(--green);" data-quick-add="${it.id}" title="إضافة كمية سريعًا">${icon("plus", 14)}</button>
        <button class="icon-btn" data-edit="${it.id}">${icon("pencil", 14)}</button>
        <button class="icon-btn" style="color:var(--red);" data-del="${it.id}">${icon("trash", 14)}</button>
      </div></td></tr>`).join("")}`;
    }).join("");
    $$("[data-edit]").forEach(b => b.onclick = () => openItemModal(state.items.find(i => i.id === b.dataset.edit)));
    $$("[data-quick-add]").forEach(b => b.onclick = () => openQuickAddQtyModal(state.items.find(i => i.id === b.dataset.quickAdd), main));
    $$("[data-del]").forEach(b => b.onclick = async () => {
      const it = state.items.find(i => i.id === b.dataset.del);
      if (!confirm(`حذف "${it.name}" نهائيًا؟`)) return;
      await sb.from("items").delete().eq("id", it.id);
      logAudit({ action: "حذف صنف", entity: "item", entityName: it.name });
      await loadItems(); renderItemsAdmin(main); toast("تم حذف الصنف");
    });
    $$("[data-icat-toggle]").forEach(row => row.onclick = () => {
      const cat = row.dataset.icatToggle;
      if (collapsedItemCats.has(cat)) collapsedItemCats.delete(cat); else collapsedItemCats.add(cat);
      row.classList.toggle("is-collapsed");
      $$(`[data-icat-row="${cat}"]`).forEach(r => r.style.display = collapsedItemCats.has(cat) ? "none" : "");
    });
  };
  drawItems();
  $("#items-search").oninput = drawItems;
  $("#new-item-btn").onclick = () => openItemModal(null);
}

/* ---------------- إضافة كمية سريعة لصنف موجود بالفعل ---------------- */
function openQuickAddQtyModal(item, main) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:360px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div style="font-weight:800; font-size:16px;">إضافة كمية سريعة</div>
        <button class="close-x" id="qa-close">${icon("x", 15)}</button>
      </div>
      <div style="font-size:13px; font-weight:700; margin-bottom:4px;">${item.name}</div>
      <div style="font-size:12px; color:var(--ink70); margin-bottom:14px;">المتوفر حاليًا: ${item.qty} ${item.unit}</div>
      <div class="field">
        <label>الكمية المضافة</label>
        <div class="step-row">
          <button class="step-btn" id="qa-minus">${icon("minus", 16)}</button>
          <input id="qa-qty" type="number" min="1" value="1" class="input mono" style="width:90px; text-align:center;">
          <button class="step-btn" id="qa-plus">${icon("plus", 16)}</button>
          <span style="color:var(--ink70); font-size:13px;">${item.unit}</span>
        </div>
      </div>
      <button class="btn-primary" id="qa-save" style="background:var(--green);">${icon("in", 16)} تأكيد الإضافة</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#qa-close", overlay).onclick = () => overlay.remove();
  $("#qa-minus", overlay).onclick = () => { const inp = $("#qa-qty", overlay); inp.value = Math.max(1, Number(inp.value) - 1); };
  $("#qa-plus", overlay).onclick = () => { const inp = $("#qa-qty", overlay); inp.value = Number(inp.value) + 1; };
  $("#qa-save", overlay).onclick = async () => {
    const qty = Number($("#qa-qty", overlay).value) || 0;
    if (qty <= 0) { toast("أدخل كمية أكبر من صفر", true); return; }
    const newQty = item.qty + qty;
    const { error } = await sb.from("items").update({ qty: newQty }).eq("id", item.id);
    if (error) { toast("تعذر تحديث الكمية", true); return; }
    await sb.from("transactions").insert({
      item_id: item.id, item_name: item.name, unit: item.unit, type: "in", qty,
      worker: state.profile?.full_name || "", note: "إضافة سريعة",
    });
    logAudit({ action: "إدخال", entity: "item", entityName: item.name, qtyBefore: item.qty, qtyAfter: newQty, details: "إضافة سريعة" });
    overlay.remove();
    await Promise.all([loadItems(), loadTransactions()]);
    renderItemsAdmin(main);
    toast(`تم إضافة ${qty} ${item.unit} إلى "${item.name}"`);
  };
}

/* ---------------- الموردون (المدير وأمين المخزن) ---------------- */
async function renderSuppliers(main) {
  if (!_suppliersLoaded) { main.innerHTML = `<div class="empty-note">جاري تحميل بيانات الموردين...</div>`; await ensureSuppliers(); if (state.tab !== "suppliers") return; }
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">${t("suppliersTitle")}</div><div class="section-sub">${t("suppliersSub")}</div></div>
      <button class="btn-dark" id="new-supplier-btn">${icon("plus", 15)} ${t("newSupplierBtn")}</button>
    </div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>${t("supplierName")}</th><th>${t("supplierPhone")}</th><th>${t("supplierEmail")}</th><th>${t("supplierNotes")}</th><th></th></tr></thead><tbody id="suppliers-body"></tbody></table>
    </div>`;

  const draw = () => {
    $("#suppliers-body").innerHTML = state.suppliers.length ? state.suppliers.map(s => `
      <tr>
        <td style="font-weight:700;">${s.name}</td>
        <td class="mono">${s.phone || "—"}</td>
        <td>${s.email || "—"}</td>
        <td style="color:var(--ink70);">${s.notes || "—"}</td>
        <td><div style="display:flex; gap:8px; justify-content:flex-end;">
          <button class="icon-btn" data-edit-sup="${s.id}">${icon("pencil", 14)}</button>
          <button class="icon-btn" style="color:var(--red);" data-del-sup="${s.id}">${icon("trash", 14)}</button>
        </div></td>
      </tr>`).join("") : `<tr><td colspan="5"><div class="empty-note">${t("noSuppliers")}</div></td></tr>`;
    $$("[data-edit-sup]").forEach(b => b.onclick = () => openSupplierModal(state.suppliers.find(s => s.id === b.dataset.editSup), main));
    $$("[data-del-sup]").forEach(b => b.onclick = async () => {
      const s = state.suppliers.find(x => x.id === b.dataset.delSup);
      if (!confirm(`حذف المورد "${s.name}"؟`)) return;
      await sb.from("suppliers").delete().eq("id", s.id);
      logAudit({ action: "حذف مورد", entity: "supplier", entityName: s.name });
      await loadSuppliers(); draw();
      toast("تم حذف المورد");
    });
  };
  draw();
  $("#new-supplier-btn").onclick = () => openSupplierModal(null, main);
}

function openSupplierModal(existing, main) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const form = existing ? { ...existing } : { name: "", phone: "", email: "", notes: "" };
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:16px;">${existing ? t("edit") : t("newSupplierBtn")}</div>
        <button class="close-x" id="sup-close">${icon("x", 15)}</button>
      </div>
      <div class="field"><label>${t("supplierName")}</label><input id="sup-name" class="input" style="width:100%;" value="${form.name}"></div>
      <div class="field"><label>${t("supplierPhone")}</label><input id="sup-phone" class="input" style="width:100%;" value="${form.phone || ""}"></div>
      <div class="field"><label>${t("supplierEmail")}</label><input id="sup-email" class="input" style="width:100%;" value="${form.email || ""}"></div>
      <div class="field"><label>${t("supplierNotes")}</label><input id="sup-notes" class="input" style="width:100%;" value="${form.notes || ""}"></div>
      <button class="btn-primary" id="sup-save">${t("save")}</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#sup-close", overlay).onclick = () => overlay.remove();
  $("#sup-save", overlay).onclick = async () => {
    const payload = {
      name: $("#sup-name", overlay).value.trim(),
      phone: $("#sup-phone", overlay).value.trim(),
      email: $("#sup-email", overlay).value.trim(),
      notes: $("#sup-notes", overlay).value.trim(),
    };
    if (!payload.name) { toast("أدخل اسم المورد", true); return; }
    let error;
    if (existing) ({ error } = await sb.from("suppliers").update(payload).eq("id", existing.id));
    else ({ error } = await sb.from("suppliers").insert(payload));
    if (error) { toast("تعذر حفظ بيانات المورد — " + (error.message || "خطأ غير معروف"), true); return; }
    logAudit({ action: existing ? "تعديل مورد" : "إضافة مورد", entity: "supplier", entityName: payload.name });
    overlay.remove();
    await loadSuppliers();
    renderSuppliers(main);
    toast(existing ? "تم تحديث بيانات المورد" : "تمت إضافة المورد");
  };
}

/* ---------------- شاشة إدارة مستخدمي تيليجرام (للمدير فقط) ---------------- */
async function renderTelegramUsers(main) {
  if (!_profilesLoaded) await ensureProfiles();

  let botUsername = null;
  if (state.settings.telegram_bot_token) {
    const check = await callTelegramService({ action: "validate", token: state.settings.telegram_bot_token });
    if (check && check.valid) botUsername = check.botUsername || null;
  }
  const botLink = botUsername ? `https://t.me/${botUsername}` : null;

  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">${t("telegramTitle")}</div><div class="section-sub">${t("telegramSub")}</div></div>
      <div style="display:flex; gap:8px;">
        <button class="btn-dark" id="tg-send-test">${icon("send", 14)} ${t("telegramSendTest")}</button>
      </div>
    </div>

    ${!state.settings.telegram_bot_token ? `
      <div class="card" style="margin-bottom:18px;">
        <div style="color:var(--ink70); font-size:13px;">لازم تحط توكن بوت تليجرام في تبويب "${t("navSettings")}" الأول.</div>
      </div>` : `
      <div class="card" style="margin-bottom:18px;">
        ${botLink ? `
          <div style="font-size:13px; margin-bottom:10px;">شارك الرابط ده مع أي حد عايز يستقبل الإشعارات — يضغط عليه، وبعدين Start، ويتسجل تلقائيًا:</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <code style="background:var(--paper); padding:8px 12px; border-radius:8px; font-size:12.5px;">${botLink}</code>
            <button class="btn-dark" id="tg-copy-bot-link" type="button">نسخ</button>
          </div>` : `<div style="color:var(--red); font-size:13px;">تعذر التحقق من توكن البوت — راجعه في الإعدادات.</div>`}

        <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
          <label style="display:block; margin-bottom:8px; font-weight:700; font-size:13px;">${t("telegramGenLink")}</label>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <select id="tg-link-user-select" class="input" style="flex:1; min-width:200px;">
              ${(state.profiles || []).map(p => `<option value="${p.id}">${p.full_name || p.username || p.id}</option>`).join("")}
            </select>
            <button class="btn-primary" id="tg-gen-link-btn" type="button">${t("telegramGenLinkBtn")}</button>
          </div>
          <div id="tg-gen-link-result" style="margin-top:10px; font-size:12.5px;"></div>
        </div>
      </div>`}

    <div class="card">
      ${!state.telegramUsers.length ? `<div class="empty-note">${t("telegramNoUsers")}</div>` : `
      <div style="overflow-x:auto;">
        <table class="table">
          <thead><tr>
            <th>${t("fullNameLabel")}</th><th>Username</th><th>${t("status")}</th>
            <th>${t("telegramRole")}</th><th>${t("telegramLastSeen")}</th><th></th>
          </tr></thead>
          <tbody>
            ${state.telegramUsers.map(u => `
              <tr>
                <td>${[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</td>
                <td>${u.username ? "@" + u.username : "—"}</td>
                <td>${u.is_active ? `<span class="chip chip-ok">${t("telegramActive")}</span>` : `<span class="chip chip-critical">${t("telegramBlocked")}</span>`}</td>
                <td>
                  <select class="input" data-tg-role="${u.id}" style="min-width:150px;">
                    <option value="">${t("telegramNoRole")}</option>
                    ${Object.keys(ROLE_LABELS).map(r => `<option value="${r}" ${u.role === r ? "selected" : ""}>${ROLE_LABELS[r]}</option>`).join("")}
                  </select>
                </td>
                <td style="white-space:nowrap;">${u.last_seen_at ? fmtDate(u.last_seen_at) : "—"}</td>
                <td>
                  <button class="icon-btn" data-tg-toggle="${u.id}" data-active="${u.is_active}" title="${u.is_active ? t("telegramBlocked") : t("telegramActive")}">${icon(u.is_active ? "x" : "check", 14)}</button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`}
    </div>
  `;

  const copyBtn = $("#tg-copy-bot-link");
  if (copyBtn) copyBtn.onclick = () => { navigator.clipboard.writeText(botLink); toast("تم نسخ الرابط"); };

  const genBtn = $("#tg-gen-link-btn");
  if (genBtn) genBtn.onclick = async () => {
    const profileId = $("#tg-link-user-select").value;
    const resultEl = $("#tg-gen-link-result");
    if (!profileId) return;
    genBtn.disabled = true; genBtn.textContent = "...";
    const token = crypto.randomUUID().replace(/-/g, "");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await sb.from("telegram_link_tokens").insert({ token, profile_id: profileId, expires_at: expires });
    genBtn.disabled = false; genBtn.textContent = t("telegramGenLinkBtn");
    if (error) { toast("تعذر توليد الرابط — " + error.message, true); return; }
    const link = `${botLink}?start=${token}`;
    resultEl.innerHTML = `<div style="color:var(--ink70); margin-bottom:6px;">${t("telegramLinkGenerated")}</div><code style="background:var(--paper); padding:8px 12px; border-radius:8px; display:inline-block;">${link}</code>`;
  };

  $$("[data-tg-role]").forEach(sel => sel.onchange = async () => {
    const id = sel.dataset.tgRole;
    const role = sel.value || null;
    const { error } = await sb.from("telegram_users").update({ role }).eq("id", id);
    if (error) { toast("تعذر حفظ الدور — " + error.message, true); return; }
    const u = state.telegramUsers.find(x => x.id === id); if (u) u.role = role;
    toast("تم تحديث الدور");
  });

  $$("[data-tg-toggle]").forEach(btn => btn.onclick = async () => {
    const id = btn.dataset.tgToggle;
    const isActive = btn.dataset.active === "true";
    const { error } = await sb.from("telegram_users").update({ is_active: !isActive, blocked_at: !isActive ? null : new Date().toISOString() }).eq("id", id);
    if (error) { toast("تعذر تحديث الحالة — " + error.message, true); return; }
    await loadTelegramUsers();
    renderTelegramUsers(main);
  });

  $("#tg-send-test").onclick = async () => {
    const btn = $("#tg-send-test");
    btn.disabled = true; btn.innerHTML = "...جارِ الإرسال";
    const res = await callSendTelegram({ type: "manual", target: { mode: "all" }, message: "✅ رسالة تجريبية من نظام إدارة المخزن — لو وصلتك يبقى كل حاجة شغالة تمام." });
    btn.disabled = false; btn.innerHTML = `${icon("send", 14)} ${t("telegramSendTest")}`;
    if (res.error) { toast("فشل الإرسال — " + res.error, true); return; }
    toast(`تم الإرسال: ${res.sent} نجح، ${res.failed} فشل، ${res.blocked} محظور (من إجمالي ${res.total})`);
  };
}

/* ---------------- user management (admin only) ---------------- */
async function renderUsers(main) {
  if (!_profilesLoaded) { main.innerHTML = `<div class="empty-note">جاري تحميل بيانات المستخدمين...</div>`; await ensureProfiles(); if (state.tab !== "users") return; }
  const roleLabels = ROLE_LABELS;
  main.innerHTML = `
    <div class="section-header">
      <div><div class="section-title">${t("usersTitle")}</div><div class="section-sub">${t("usersSub")}</div></div>
      <button class="btn-dark" id="new-user-btn">${icon("plus", 15)} ${t("newUserBtn")}</button>
    </div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>${t("fullNameLabel")}</th><th>${t("roleLabel")}</th><th>${t("status")}</th><th>${t("lastLogin")}</th><th>${t("deviceLabel")}</th><th></th></tr></thead><tbody id="users-body"></tbody></table>
    </div>`;
  $("#users-body").innerHTML = state.profiles.map(p => `
    <tr>
      <td style="font-weight:700;">${p.full_name || "—"}${p.id === state.user.id ? ` <span style="color:var(--ink50); font-size:11px;">${t("youLabel")}</span>` : ""}</td>
      <td>
        <select class="input" style="padding:6px 10px; font-size:12.5px;" data-role="${p.id}" ${p.id === state.user.id ? "disabled" : ""}>
          ${Object.entries(roleLabels).map(([val, label]) => `<option value="${val}" ${p.role === val ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </td>
      <td>
        <button data-toggle="${p.id}" ${p.id === state.user.id ? "disabled" : ""} class="pill ${p.is_active !== false ? "pill-ok" : "pill-critical"}" style="border:none; cursor:${p.id === state.user.id ? "default" : "pointer"};">
          ${p.is_active !== false ? t("activeLabel") : t("suspendedLabel")}
        </button>
      </td>
      <td style="color:var(--ink70); font-size:12.5px;" class="mono">${p.last_login ? fmtDate(p.last_login) : "—"}</td>
      <td style="color:var(--ink70); font-size:12.5px;">${p.last_login_device || "—"}</td>
      <td><div style="display:flex; gap:6px; justify-content:flex-end;">
        <button class="icon-btn" data-edit-user="${p.id}" title="تعديل الاسم / اسم المستخدم">${icon("pencil", 14)}</button>
        ${p.id === state.user.id ? "" : `<button class="icon-btn" style="color:var(--mustard);" data-reset-pass="${p.id}" title="إعادة تعيين كلمة المرور">${icon("key", 14)}</button>`}
        ${p.id === state.user.id ? "" : `<button class="icon-btn" style="color:var(--red);" data-del-user="${p.id}">${icon("trash", 14)}</button>`}
      </div></td>
    </tr>`).join("");
  $$("[data-role]").forEach(sel => sel.onchange = async () => {
    const { error } = await sb.from("profiles").update({ role: sel.value }).eq("id", sel.dataset.role);
    if (error) { toast("تعذر تحديث الدور — " + (error.message || "تأكد إنك مسجل بحساب مدير"), true); return; }
    const p = state.profiles.find(x => x.id === sel.dataset.role);
    logAudit({ action: "تغيير دور مستخدم", entity: "user", entityName: p?.full_name, details: `الدور الجديد: ${roleLabels[sel.value]}` });
    await loadProfiles(); renderUsers(main); toast("تم تحديث الدور");
  });
  $$("[data-del-user]").forEach(btn => btn.onclick = async () => {
    const p = state.profiles.find(x => x.id === btn.dataset.delUser);
    if (!confirm(`حذف حساب "${p.full_name}" نهائيًا؟ الحساب مش هيقدر يسجل دخول تاني، والعملية دي لا يمكن التراجع عنها.`)) return;
    const res = await callManageUsers({ action: "delete", userId: p.id });
    if (res.error) { toast(res.error, true); return; }
    logAudit({ action: "حذف حساب مستخدم نهائيًا", entity: "user", entityName: p.full_name });
    await loadProfiles(); renderUsers(main); toast("تم حذف الحساب نهائيًا");
  });
  $$("[data-edit-user]").forEach(btn => btn.onclick = () => {
    openEditUserModal(state.profiles.find(x => x.id === btn.dataset.editUser), main);
  });
  $$("[data-reset-pass]").forEach(btn => btn.onclick = () => {
    openResetPasswordModal(state.profiles.find(x => x.id === btn.dataset.resetPass), main);
  });
  $("#new-user-btn").onclick = () => openNewUserModal(main);
  $$("[data-toggle]").forEach(btn => btn.onclick = async () => {
    const p = state.profiles.find(x => x.id === btn.dataset.toggle);
    const newVal = !(p.is_active !== false);
    const { error } = await sb.from("profiles").update({ is_active: newVal }).eq("id", p.id);
    if (error) { toast("تعذر تحديث الحالة — " + (error.message || ""), true); return; }
    logAudit({ action: newVal ? "تفعيل حساب" : "إيقاف حساب", entity: "user", entityName: p.full_name });
    await loadProfiles(); renderUsers(main); toast(newVal ? "تم تفعيل الحساب" : "تم إيقاف الحساب");
  });
}

/* ---------------- استدعاء Edge Function الخاصة بإدارة المستخدمين ---------------- */
async function callManageUsers(payload) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || "حدث خطأ غير متوقع" };
    return json;
  } catch (e) {
    return { error: "تعذر الاتصال بخدمة إدارة المستخدمين — تأكد إن الـ Edge Function متنشرة (راجع README)" };
  }
}

/* ---------------- استدعاء Edge Function الخاصة بـ Telegram ---------------- */
async function callTelegramService(payload) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-service`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || "حدث خطأ غير متوقع" };
    return json;
  } catch (e) {
    return { error: "تعذر الاتصال بخدمة Telegram — تأكد إن الـ Edge Function \"telegram-service\" متنشرة على Supabase" };
  }
}
/* إرسال إشعار تيليجرام لكل المستخدمين المسجَّلين تلقائيًا (أو حسب الدور/مستخدم/مجموعة)
   عبر فنكشن send-telegram الجديد — بديل نظام Chat ID الواحد القديم */
async function callSendTelegram({ type, target, message }) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ type, target, message }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || "حدث خطأ غير متوقع" };
    return json;
  } catch (e) {
    return { error: "تعذر الاتصال بخدمة send-telegram — تأكد إنها متنشرة على Supabase" };
  }
}

/* ---------------- طبقة إشعارات مشتركة: Email + Telegram معًا ----------------
   كل قناة مستقلة تمامًا عن التانية: فشل Telegram ميوقفش الإيميل، والعكس. */
async function notifyStockAlert(itemName, qty, maxQty, unit, pct, level) {
  const results = { email: null, telegram: null };
  if (state.settings.resend_api_key) {
    const recipients = (state.settings.notify_emails || "").split(",").map(e => e.trim()).filter(Boolean);
    if (recipients.length) {
      try {
        results.email = await callEmailService({
          action: "sendLowStockAlert", apiKey: state.settings.resend_api_key, to: recipients,
          itemName, qty, maxQty, unit, pct, level,
        });
      } catch (e) { results.email = { error: String(e) }; }
      if (results.email?.error || results.email?.success === false) console.warn("تعذر إرسال تنبيه المخزون بالإيميل:", results.email.reason || results.email.error);
    }
  }
  if (state.settings.telegram_bot_token) {
    const isCritical = level === "critical";
    const text = `${isCritical ? "🚨" : "⚠️"} تنبيه مخزون ${isCritical ? "حرج" : "منخفض"}\n\nالصنف:\n${itemName}\n\nالكمية الحالية:\n${qty} ${unit || ""}\n\nالحد الأقصى:\n${maxQty} ${unit || ""}\n\nالنسبة:\n${Math.round(pct)}%`;
    try {
      results.telegram = await callSendTelegram({
        type: isCritical ? "stock_critical" : "stock_warning",
        target: { mode: "all" },
        message: text,
      });
    } catch (e) { results.telegram = { error: String(e) }; }
    if (results.telegram?.error) console.warn("تعذر إرسال تنبيه المخزون بتيليجرام:", results.telegram.error);
  }
  return results;
}
async function callEmailService(payload) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/email-service`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error || "حدث خطأ غير متوقع" };
    return json;
  } catch (e) {
    return { error: "تعذر الاتصال بخدمة البريد الإلكتروني — تأكد إن الـ Edge Function \"email-service\" متنشرة على Supabase" };
  }
}

function openNewUserModal(main) {
  const roleLabels = ROLE_LABELS;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:16px;">${t("newUserBtn")}</div>
        <button class="close-x" id="nu-close">${icon("x", 15)}</button>
      </div>
      <div class="field"><label>${t("usernameLabel")}</label><input id="nu-username" class="input" style="width:100%;" placeholder="مثال: sara"></div>
      <div class="field"><label>${t("fullNameLabel")}</label><input id="nu-fullname" class="input" style="width:100%;" placeholder="مثال: سارة أحمد"></div>
      <div class="field"><label>${t("passwordLabel")}</label><input id="nu-password" type="password" class="input" style="width:100%;" placeholder="6 أحرف على الأقل"></div>
      <div class="field"><label>${t("roleLabel")}</label>
        <select id="nu-role" class="input" style="width:100%;">
          ${Object.entries(roleLabels).map(([val, label]) => `<option value="${val}" ${val === "keeper" ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>
      <button class="btn-primary" id="nu-save">${t("createAccountBtn")}</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#nu-close", overlay).onclick = () => overlay.remove();
  $("#nu-save", overlay).onclick = async () => {
    const username = $("#nu-username", overlay).value.trim().toLowerCase();
    const fullName = $("#nu-fullname", overlay).value.trim();
    const password = $("#nu-password", overlay).value;
    const role = $("#nu-role", overlay).value;
    if (!username || !/^[a-z0-9._-]+$/.test(username)) { toast("اسم المستخدم لازم يكون بالإنجليزي بدون مسافات", true); return; }
    if (password.length < 6) { toast("كلمة المرور لازم تكون 6 أحرف على الأقل", true); return; }
    const email = username + USERNAME_SUFFIX;
    const btn = $("#nu-save", overlay); btn.disabled = true; btn.textContent = "...جارِ الإنشاء";
    const res = await callManageUsers({ action: "create", email, password, fullName, role });
    btn.disabled = false; btn.textContent = "إنشاء الحساب";
    if (res.error) { toast(res.error, true); return; }
    const newUserId = res.userId || res.user?.id || res.id;
    if (newUserId) await sb.from("profiles").update({ username }).eq("id", newUserId);
    logAudit({ action: "إنشاء حساب مستخدم", entity: "user", entityName: fullName || username, details: `الدور: ${roleLabels[role]}` });
    overlay.remove();
    await loadProfiles(); renderUsers(main); toast(`تم إنشاء الحساب — اسم المستخدم: ${username}`);
  };
}

/* ---------------- audit log view ---------------- */
async function renderAudit(main) {
  if (!_auditLoaded) { main.innerHTML = `<div class="empty-note">جاري تحميل سجل الأنشطة...</div>`; await ensureAuditLog(); if (state.tab !== "audit") return; }
  main.innerHTML = `
    <div class="section-header"><div><div class="section-title">${t("auditTitle")}</div><div class="section-sub">${t("auditSub")}</div></div></div>
    <div class="card" style="padding:0; overflow:hidden;">
      <table><thead><tr><th>${t("fullNameLabel")}</th><th>${t("actionCol")}</th><th>${t("entityCol")}</th><th>${t("beforeCol")}</th><th>${t("afterCol")}</th><th>${t("deviceLabel")}</th><th>${t("timeCol")}</th></tr></thead><tbody id="audit-body"></tbody></table>
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
    </tr>`).join("") : `<tr><td colspan="7"><div class="empty-note">${t("noAudit")}</div></td></tr>`;
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
        <div class="field" style="flex:1;">
          <label>${t("itemSupplier")}</label>
          <select id="f-supplier" class="input" style="width:100%;">
            <option value="">${t("noneOption")}</option>
            ${state.suppliers.map(s => `<option value="${s.id}" ${form.supplier_id === s.id ? "selected" : ""}>${s.name}</option>`).join("")}
          </select>
        </div>
        <div class="field" style="flex:1;"><label>${t("itemPrice")}</label><input id="f-price" type="number" step="0.01" class="input mono" style="width:100%;" value="${form.price ?? ""}"></div>
      </div>
      <div class="field"><label>${t("itemStorage")}</label><input id="f-storage" class="input" style="width:100%;" value="${form.storage_location || ""}" placeholder="مثال: رف A3 — مخزن 2"></div>
      <div class="field">
        <label>${t("itemImage")}</label>
        <div style="display:flex; align-items:center; gap:12px;">
          <div id="item-image-preview" style="width:52px; height:52px; border-radius:10px; background:var(--paper-deep); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
            ${form.image_base64 ? `<img src="${form.image_base64}" style="width:100%; height:100%; object-fit:cover;">` : icon("package", 22)}
          </div>
          <input type="file" id="f-image" accept="image/*">
        </div>
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
  let pendingImageData;
  $("#f-image", overlay).onchange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingImageData = reader.result;
      $("#item-image-preview", overlay).innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
  };
  const drawBarcode = () => {
    const val = $("#f-barcode", overlay).value.trim();
    const prev = $("#barcode-preview", overlay);
    if (!val) { prev.innerHTML = ""; return; }
    if (typeof JsBarcode === "undefined") {
      prev.innerHTML = `<span style="font-size:11px; color:var(--ink50);">...جارِ تحميل مكتبة الباركود</span>`;
      ensureBarcodeLib().then(() => { if ($("#f-barcode", overlay) && $("#f-barcode", overlay).value.trim() === val) drawBarcode(); }).catch(() => { prev.innerHTML = ""; });
      return;
    }
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
      supplier_id: $("#f-supplier", overlay).value || null,
      price: $("#f-price", overlay).value ? Number($("#f-price", overlay).value) : null,
      storage_location: $("#f-storage", overlay).value.trim() || null,
      image_base64: pendingImageData !== undefined ? pendingImageData : (form.image_base64 || null),
    };
    if (!payload.name) { toast("أدخل اسم الصنف", true); return; }
    if (!payload.max_qty || payload.max_qty <= 0) { toast("أدخل الحد الأقصى للمخزون", true); return; }
    // تنبيه التكرار: لو ده صنف جديد (مش تعديل) واسمه مطابق لصنف موجود بالفعل
    if (!existing) {
      const dup = state.items.find(i => i.name.trim().toLowerCase() === payload.name.trim().toLowerCase());
      if (dup) {
        const proceed = confirm(`⚠️ يوجد صنف بنفس الاسم "${dup.name}" بالفعل (الفئة: ${dup.category || "—"}، الكمية الحالية: ${dup.qty} ${dup.unit}).\n\nاضغط "موافق" لإضافته كصنف منفصل على أي حال، أو "إلغاء" للتراجع (يمكنك بدلًا من ذلك تعديل الصنف الموجود أو عمل "إدخال مخزون" عليه بدل إنشاء نسخة جديدة).`);
        if (!proceed) return;
      }
    }
    let error, newItemId = existing?.id;
    if (existing) {
      ({ error } = await sb.from("items").update(payload).eq("id", existing.id));
    } else {
      const { data: inserted, error: insErr } = await sb.from("items").insert(payload).select().single();
      error = insErr;
      if (inserted) newItemId = inserted.id;
    }
    if (error) { toast(error.message.includes("duplicate") ? "هذا الكود مستخدم بالفعل لصنف آخر" : "تعذر حفظ الصنف — " + error.message, true); return; }
    logAudit({
      action: existing ? "تعديل صنف" : "إضافة صنف", entity: "item", entityName: payload.name,
      qtyBefore: existing ? existing.qty : null, qtyAfter: payload.qty,
    });
    // لو صنف جديد وبكمية ابتدائية أكبر من صفر، نسجّلها كحركة "إدخال" (رصيد افتتاحي)
    // عشان تظهر في لوحة التحكم والتقارير وسجل الحركات زي أي عملية إدخال عادية
    if (!existing && payload.qty > 0 && newItemId) {
      await sb.from("transactions").insert({
        item_id: newItemId, item_name: payload.name, unit: payload.unit, type: "in", qty: payload.qty,
        worker: state.profile?.full_name || "", note: "رصيد افتتاحي عند إضافة الصنف",
      });
      await loadTransactions();
    }
    overlay.remove();
    await loadItems();
    if (typeof onDone === "function") onDone(); else render();
    toast(existing ? "تم تحديث الصنف" : "تمت إضافة الصنف");
  };
}

/* ---------------- تغيير كلمة المرور (ذاتيًا) ---------------- */
/* ---------------- المساعدة ودليل الاستخدام ---------------- */
function openHelpModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const role = myRole();
  const guides = [
    { roles: ["admin", "factory_manager", "keeper", "production_manager", "quality", "viewer"], title: "لوحة التحكم", body: "نظرة سريعة على حالة المخزن: عدد الأصناف، الأصناف الحرجة، حركة آخر 7 أيام، وأكثر الأصناف استهلاكًا." },
    { roles: ["admin", "keeper"], title: "إدخال مخزون / سحب من المخزن", body: "ابحث عن الصنف أو اخترته من قائمة الفئات، حدد الكمية بالأزرار +/-، واضغط تأكيد. لو الصنف مش موجود أصلاً، هيظهرلك زر لإضافته مباشرة." },
    { roles: ["admin", "factory_manager", "keeper", "production_manager", "accountant", "quality", "viewer"], title: "المخزون الحالي", body: "جدول بكل الأصناف مقسّم حسب الفئة، مع نسبة الامتلاء والحالة (جيد / منخفض / حرج). اضغط أيقونة الساعة بجانب أي صنف لعرض سجل حركته بالكامل." },
    { roles: ["admin", "factory_manager", "keeper", "production_manager", "accountant", "quality", "viewer"], title: "التقارير", body: "فلترة كاملة (تاريخ، نوع، صنف، عامل)، طباعة/PDF متعددة الصفحات، تصدير Excel، وطباعة إذن صرف/استلام لكل حركة على حدة." },
    { roles: ["admin", "keeper"], title: "إدارة الأصناف", body: "إضافة/تعديل/حذف الأصناف والفئات، توليد كود وباركود تلقائي، واستيراد مئات الأصناف دفعة واحدة من ملف Excel." },
    { roles: ["admin", "keeper"], title: "الموردون", body: "بيانات التواصل مع الموردين، وربطها بالأصناف من نموذج إضافة/تعديل الصنف." },
    { roles: ["admin"], title: "إدارة المستخدمين", body: "إنشاء حسابات جديدة بأي دور من 7 أدوار، تحديد الصلاحيات، إيقاف أو حذف أي حساب نهائيًا." },
    { roles: ["admin"], title: "الإعدادات", body: "اسم المصنع، الشعار، العنوان والهاتف، نسب التنبيه الحرج والمنخفض، والنسخ الاحتياطي (يدوي وتلقائي يوميًا)." },
    { roles: ["admin", "factory_manager", "keeper", "production_manager", "quality", "viewer"], title: "الجرس 🔔", body: "يظهر عدد الأصناف اللي تحتاج شراء (منخفضة أو حرجة)، اضغط عليه لعرض القائمة كاملة." },
    { roles: ["admin", "factory_manager", "keeper", "production_manager", "accountant", "quality", "viewer"], title: "تغيير كلمة المرور والخروج", body: "زر 🔑 بجانب زر الخروج في القائمة الجانبية لتغيير كلمة مرورك في أي وقت. النظام بيسجّل خروجك تلقائيًا بعد 20 دقيقة من عدم النشاط." },
  ].filter(g => g.roles.includes(role));

  overlay.innerHTML = `
    <div class="modal-box" style="width:560px; max-width:92vw;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:17px;">دليل الاستخدام</div>
        <button class="close-x" id="help-close">${icon("x", 15)}</button>
      </div>
      <div style="font-size:12px; color:var(--ink70); margin-bottom:14px;">الدليل ده مخصّص حسب صلاحياتك الحالية (${ROLE_LABELS[role]}).</div>
      <div style="display:flex; flex-direction:column; gap:14px; max-height:60vh; overflow:auto;">
        ${guides.map(g => `
          <div>
            <div style="font-weight:700; font-size:13.5px; color:var(--ink); margin-bottom:4px;">${g.title}</div>
            <div style="font-size:12.5px; color:var(--ink70); line-height:1.8;">${g.body}</div>
          </div>`).join("")}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#help-close", overlay).onclick = () => overlay.remove();
}

/* ---------------- حول النظام ---------------- */
function openAboutModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box" style="width:480px; max-width:92vw; text-align:center;">
      <div style="display:flex; justify-content:flex-end;">
        <button class="close-x" id="about-close">${icon("x", 15)}</button>
      </div>
      <div style="width:60px; height:60px; border-radius:16px; background:var(--mustard); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; overflow:hidden;">
        ${state.settings.logo_base64 ? `<img src="${state.settings.logo_base64}" style="width:100%; height:100%; object-fit:cover;">` : icon("scissors", 28)}
      </div>
      <div style="font-weight:800; font-size:18px;">${state.settings.workshop_name || "مصنع نسيج"}</div>
      <div style="font-size:12.5px; color:var(--ink70); margin-bottom:18px;">نظام إدارة المخازن</div>
      <div style="text-align:right; background:var(--paper); border-radius:12px; padding:14px 16px; font-size:12.5px; color:var(--ink70); line-height:2;">
        <div>✔ إدارة مستخدمين بـ 7 أدوار وصلاحيات مفصّلة</div>
        <div>✔ إدخال وسحب مخزون بأكواد وباركود</div>
        <div>✔ تقارير كاملة قابلة للطباعة والتصدير</div>
        <div>✔ إذن صرف/استلام لكل حركة</div>
        <div>✔ سجل عمليات كامل (Audit Log)</div>
        <div>✔ نسخ احتياطي يدوي وتلقائي يومي</div>
        <div>✔ استيراد أصناف بالجملة من Excel</div>
        <div>✔ دعم لغتين: عربي وتركي</div>
      </div>
      <div style="margin-top:16px; font-size:11px; color:var(--ink50);">تم التطوير خصيصًا لـ ${state.settings.workshop_name || "المصنع"} — جميع البيانات مخزّنة بأمان على Supabase.</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#about-close", overlay).onclick = () => overlay.remove();
}

function openEditUserModal(p, main) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:16px;">${icon("pencil", 16)} تعديل بيانات المستخدم</div>
        <button class="close-x" id="eu-close">${icon("x", 15)}</button>
      </div>
      <div class="field"><label>الاسم الكامل</label><input id="eu-fullname" class="input" style="width:100%;" value="${p.full_name || ""}"></div>
      <div class="field">
        <label>اسم المستخدم (لتسجيل الدخول)</label>
        <input id="eu-username" class="input" style="width:100%;" value="${(p.username || "")}" placeholder="مثال: ahmed">
        <div style="font-size:11px; color:var(--ink50); margin-top:6px;">بالإنجليزي وبدون مسافات. تغييره يحتاج إعادة نشر Edge Function (راجع README).</div>
      </div>
      <button class="btn-primary" id="eu-save">حفظ التعديلات</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#eu-close", overlay).onclick = () => overlay.remove();
  $("#eu-save", overlay).onclick = async () => {
    const newName = $("#eu-fullname", overlay).value.trim();
    const newUsername = $("#eu-username", overlay).value.trim().toLowerCase();
    if (!newName) { toast("اكتب الاسم الكامل", true); return; }
    const btn = $("#eu-save", overlay); btn.disabled = true; btn.textContent = "جاري الحفظ...";
    if (newName !== p.full_name) {
      const { error } = await sb.from("profiles").update({ full_name: newName }).eq("id", p.id);
      if (error) { toast("تعذر تحديث الاسم — " + (error.message || ""), true); btn.disabled = false; btn.textContent = "حفظ التعديلات"; return; }
    }
    if (newUsername && newUsername !== (p.username || "") && /^[a-z0-9._-]+$/.test(newUsername)) {
      const res = await callManageUsers({ action: "updateUsername", userId: p.id, newUsername });
      if (res.error) { toast(res.error, true); btn.disabled = false; btn.textContent = "حفظ التعديلات"; return; }
    }
    logAudit({ action: "تعديل بيانات مستخدم", entity: "user", entityName: newName });
    await loadProfiles(); renderUsers(main); overlay.remove();
    toast("تم حفظ التعديلات");
  };
}

function openResetPasswordModal(p, main) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:16px;">${icon("key", 16)} إعادة تعيين كلمة مرور "${p.full_name}"</div>
        <button class="close-x" id="rp-close">${icon("x", 15)}</button>
      </div>
      <div id="rp-step1">
        <div style="font-size:13px; color:var(--ink70); line-height:1.8; margin-bottom:16px;">
          هيتم توليد كلمة مرور مؤقتة جديدة للحساب ده. المستخدم هيُطلب منه تغييرها فور تسجيل الدخول. سلّمها له مباشرة (تليفون / واتساب) بدون ما تكتبها في أي مكان تاني.
        </div>
        <button class="btn-primary" id="rp-generate">توليد كلمة مرور مؤقتة</button>
      </div>
      <div id="rp-step2" class="hidden">
        <div style="font-size:12.5px; color:var(--ink70); margin-bottom:8px;">كلمة المرور المؤقتة (هتظهر مرة واحدة بس):</div>
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:16px;">
          <div id="rp-temp-pass" class="mono" style="flex:1; background:var(--paper-deep); border-radius:10px; padding:12px 14px; font-size:16px; font-weight:800; letter-spacing:1px; text-align:center;"></div>
          <button class="icon-btn" id="rp-copy" title="نسخ">${icon("copy", 15)}</button>
        </div>
        <button class="btn-dark" id="rp-done" style="width:100%;">تم — أغلق</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#rp-close", overlay).onclick = () => overlay.remove();
  $("#rp-generate", overlay).onclick = async () => {
    const btn = $("#rp-generate", overlay); btn.disabled = true; btn.textContent = "جاري التوليد...";
    const res = await callManageUsers({ action: "resetPassword", userId: p.id });
    if (res.error) { toast(res.error, true); btn.disabled = false; btn.textContent = "توليد كلمة مرور مؤقتة"; return; }
    logAudit({ action: "إعادة تعيين كلمة مرور", entity: "user", entityName: p.full_name });
    $("#rp-temp-pass", overlay).textContent = res.tempPassword;
    $("#rp-step1", overlay).classList.add("hidden");
    $("#rp-step2", overlay).classList.remove("hidden");
  };
  $("#rp-copy", overlay).onclick = () => {
    navigator.clipboard.writeText($("#rp-temp-pass", overlay).textContent).then(() => toast("تم النسخ"));
  };
  $("#rp-done", overlay).onclick = () => overlay.remove();
}

function openChangePasswordModal(forced) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:16px;">${forced ? "لازم تغيّر كلمة المرور المؤقتة" : "تغيير كلمة المرور"}</div>
        ${forced ? "" : `<button class="close-x" id="cp-close">${icon("x", 15)}</button>`}
      </div>
      ${forced ? `<div style="font-size:12.5px; color:var(--ink70); background:var(--amber-soft); padding:10px 12px; border-radius:10px; margin-bottom:14px;">تم إعادة تعيين كلمة مرورك من المدير. اختر كلمة مرور جديدة وخاصة بيك عشان تكمّل.</div>` : ""}
      <div class="field"><label>كلمة المرور الجديدة</label><input id="cp-new" type="password" class="input" style="width:100%;" placeholder="6 أحرف على الأقل"></div>
      <div class="field"><label>تأكيد كلمة المرور</label><input id="cp-confirm" type="password" class="input" style="width:100%;" placeholder="أعد كتابتها"></div>
      <button class="btn-primary" id="cp-save">حفظ كلمة المرور الجديدة</button>
    </div>`;
  document.body.appendChild(overlay);
  if (!forced) { overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); }; $("#cp-close", overlay).onclick = () => overlay.remove(); }
  $("#cp-save", overlay).onclick = async () => {
    const p1 = $("#cp-new", overlay).value, p2 = $("#cp-confirm", overlay).value;
    if (p1.length < 6) { toast("كلمة المرور لازم تكون 6 أحرف على الأقل", true); return; }
    if (p1 !== p2) { toast("كلمتا المرور غير متطابقتين", true); return; }
    const { error } = await sb.auth.updateUser({ password: p1 });
    if (error) { toast("تعذر تغيير كلمة المرور — " + (error.message || ""), true); return; }
    if (forced) await sb.from("profiles").update({ must_change_password: false }).eq("id", state.user.id);
    logAudit({ action: "تغيير كلمة المرور", entity: "user", entityName: state.profile?.full_name });
    overlay.remove();
    toast("تم تغيير كلمة المرور بنجاح");
  };
}

function openForgotPasswordModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-weight:800; font-size:16px;">${icon("key", 16)} نسيت كلمة المرور؟</div>
        <button class="close-x" id="fp-close">${icon("x", 15)}</button>
      </div>
      <div style="font-size:13px; color:var(--ink70); line-height:2;">
        محدّش يقدر يعمل استعادة لنفسه — ده أأمن لبيانات المصنع. كل اللي محتاجه:
        <ol style="padding-right:18px; margin-top:8px;">
          <li>كلّم <b>مدير النظام</b> (تليفون أو واتساب).</li>
          <li>هو هيدخل تبويب "إدارة المستخدمين" ويضغط 🔑 جنب اسمك.</li>
          <li>هيبعتلك كلمة مرور مؤقتة، وهيُطلب منك تغييرها أول ما تدخل.</li>
        </ol>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  $("#fp-close", overlay).onclick = () => overlay.remove();
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
      if (state.profile && state.profile.must_change_password) openChangePasswordModal(true);
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
  $("#sidebar-toggle-btn").addEventListener("click", () => {
    $("#app-shell").classList.toggle("sidebar-collapsed");
    $("#nav-list").classList.toggle("mobile-open");
    $("#mobile-extra-controls").classList.toggle("mobile-open");
  });
  $("#change-pass-btn").addEventListener("click", () => openChangePasswordModal(false));
  $("#forgot-pass-link").addEventListener("click", openForgotPasswordModal);
  $("#help-btn").addEventListener("click", openHelpModal);
  $("#about-btn").addEventListener("click", openAboutModal);
  $("#help-btn-mobile").addEventListener("click", openHelpModal);
  $("#about-btn-mobile").addEventListener("click", openAboutModal);
  boot().catch((e) => { console.error("boot() error:", e); hideBootLoader(); showLogin(); });
});
