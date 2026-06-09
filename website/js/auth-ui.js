function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function getInitialsFromName(name) {
  const parts = name.replace(/\./g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function logout() {
  clearAuth();
  window.location.href = "index.html";
}

function isMasterAccount(user) {
  return !!(user && (user.role === "master" || user.master_id != null));
}

async function detectMasterAccount() {
  const user = getCurrentUser();
  if (isMasterAccount(user)) return true;
  if (!getToken() || !(await checkApi())) return false;
  try {
    await api.getMasterCabinet();
    return true;
  } catch {
    return false;
  }
}

function masterCabinetUrl() {
  return "master.html";
}

function buyerCabinetUrl() {
  return "cabinet.html";
}

async function redirectAfterLogin() {
  if (await detectMasterAccount()) {
    location.href = masterCabinetUrl();
  } else {
    location.href = buyerCabinetUrl();
  }
}

function setCabinetPageMode(isMaster) {
  document.body.classList.toggle("page--master-cabinet", isMaster);
  document.body.classList.toggle("page--buyer-cabinet", !isMaster);
  const crumb = document.getElementById("cabinet-breadcrumb");
  if (crumb) {
    crumb.innerHTML = isMaster
      ? '<a href="index.html">Главная</a> / <strong>Кабинет мастера</strong>'
      : '<a href="index.html">Главная</a> / Личный кабинет';
  }
  if (isMaster) {
    document.title = "Кабинет мастера — FTservice";
  }
}

function renderAuthHeader() {
  const el = document.querySelector(".header__actions");
  if (!el) return;

  const user = getCurrentUser();
  const addBtn =
    '<button type="button" class="btn btn--primary btn--sm" data-modal="add-modal">Подать объявление</button>';

  if (user && getToken()) {
    const initials = getInitialsFromName(user.full_name);
    let modLink = "";
    if (user.role === "admin") {
      modLink = '<a href="admin.html" class="btn btn--primary btn--sm">Админ</a>';
    } else if (user.role === "moderator") {
      modLink = '<a href="admin.html" class="btn btn--primary btn--sm">Модерация</a>';
    }
    const isMaster = isMasterAccount(user);
    const cabinetHref = isMaster ? masterCabinetUrl() : buyerCabinetUrl();
    const cabinetLabel = isMaster ? "Кабинет мастера" : escapeHtml(user.full_name);
    el.innerHTML = `
      <a href="${cabinetHref}" class="header-user" title="${escapeHtml(user.email)}">
        <span class="header-user__avatar">${initials}</span>
        <span class="header-user__name">${cabinetLabel}</span>
      </a>
      ${modLink}
      <button type="button" class="btn btn--outline btn--sm" id="btn-logout">Выйти</button>
      ${addBtn}
    `;
    document.getElementById("btn-logout")?.addEventListener("click", logout);
  } else {
    el.innerHTML = `
      <a href="login.html" class="btn btn--outline btn--sm">Войти</a>
      <a href="register.html" class="btn btn--outline btn--sm">Регистрация</a>
      ${addBtn}
    `;
  }

  if (typeof initModals === "function") initModals();
  if (typeof initMessengers === "function") initMessengers();
  else if (typeof initWhatsApp === "function") initWhatsApp();
}

async function refreshSession() {
  if (!getToken()) return null;
  try {
    const user = await api.me();
    setAuth(getToken(), user);
    if (isMasterAccount(user)) {
      await pollMasterNotifications(false);
      startMasterPolling();
    }
    return user;
  } catch {
    clearAuth();
    return null;
  }
}

async function requireAuth() {
  if (!(await checkApi())) {
    alert("Сервис временно недоступен.");
    return false;
  }
  if (!getToken()) {
    const next = encodeURIComponent(location.pathname.split("/").pop() + location.search);
    location.href = `login.html?next=${next}`;
    return false;
  }
  const user = await refreshSession();
  if (!user) {
    const next = encodeURIComponent(location.pathname.split("/").pop() + location.search);
    location.href = `login.html?next=${next}`;
    return false;
  }
  renderAuthHeader();
  return true;
}

function formatBookingDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function formatISODate(iso) {
  const [y, m, day] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function formatTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

const SERVICE_LABELS = {
  diagnostic: "Диагностика",
  repair: "Ремонт электрики",
  install: "Установка запчасти",
};

function serviceLabel(key) {
  return SERVICE_LABELS[key] || key;
}

function statusLabel(status) {
  const map = {
    pending: ["Новая", "status-badge--pending"],
    confirmed: ["Подтверждена", "status-badge--confirmed"],
    completed: ["Выполнена", "status-badge--completed"],
    cancelled: ["Отменена", "status-badge--cancelled"],
  };
  const [text, cls] = map[status] || [status, ""];
  return `<span class="status-badge ${cls}">${text}</span>`;
}

const MASTER_LAST_SEEN_KEY = "ftservice_master_last_seen";
let masterPollTimer = null;
let masterCalState = null;
let masterBookingsCache = [];

function phoneHref(phone) {
  if (!phone) return "";
  return `tel:${String(phone).replace(/\s/g, "")}`;
}

function dateKeyFromParts(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function bookingDateKey(b) {
  return String(b.booking_date).slice(0, 10);
}

function pluralPending(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "новая запись";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "новые записи";
  return "новых записей";
}

function showMasterToast(msg) {
  let el = document.getElementById("master-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "master-toast";
    el.className = "master-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.hidden = false;
  el.classList.add("master-toast--visible");
  clearTimeout(showMasterToast._timer);
  showMasterToast._timer = setTimeout(() => {
    el.classList.remove("master-toast--visible");
    setTimeout(() => {
      el.hidden = true;
    }, 300);
  }, 7000);
}

function updateMasterHeaderBadge(count) {
  const link = document.querySelector(".header-user");
  if (!link) return;
  let badge = link.querySelector(".header-user__badge");
  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "header-user__badge";
      link.appendChild(badge);
    }
    badge.textContent = count > 9 ? "9+" : String(count);
  } else if (badge) {
    badge.remove();
  }
}

function markMasterBookingsSeen(bookings, summary) {
  const ids = bookings.map((b) => b.id);
  const maxId = Math.max(summary?.latest_booking_id || 0, ...ids, 0);
  if (maxId > 0) localStorage.setItem(MASTER_LAST_SEEN_KEY, String(maxId));
}

async function pollMasterNotifications(showToast) {
  if (!getToken()) return null;
  const user = getCurrentUser();
  if (!isMasterAccount(user)) {
    const ok = await detectMasterAccount();
    if (!ok) return null;
  }
  if (!(await checkApi())) return null;
  try {
    const summary = await api.getMasterSummary();
    updateMasterHeaderBadge(summary.pending_count);
    const lastSeen = parseInt(localStorage.getItem(MASTER_LAST_SEEN_KEY) || "0", 10);
    if (showToast && summary.latest_booking_id > lastSeen && summary.pending_count > 0) {
      showMasterToast(`К вам записались — ${summary.pending_count} ${pluralPending(summary.pending_count)}`);
    }
    return summary;
  } catch {
    return null;
  }
}

async function startMasterPolling() {
  if (masterPollTimer) return;
  if (!getToken()) return;
  if (!(await detectMasterAccount())) return;
  pollMasterNotifications(true);
  masterPollTimer = setInterval(() => pollMasterNotifications(true), 30000);
}

function renderMasterCalendar(bookings, state) {
  const { year, month, selectedDate } = state;
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  const dayMeta = new Map();
  for (const b of bookings) {
    if (b.status === "cancelled" || b.status === "completed") continue;
    const k = bookingDateKey(b);
    const cur = dayMeta.get(k) || { count: 0, pending: false };
    cur.count += 1;
    if (b.status === "pending") cur.pending = true;
    dayMeta.set(k, cur);
  }

  const today = dateKeyFromParts(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  );

  let cells = "";
  for (let i = 0; i < startDow; i++) cells += '<span class="cal__pad" aria-hidden="true"></span>';
  for (let d = 1; d <= daysInMonth; d++) {
    const k = dateKeyFromParts(year, month + 1, d);
    const meta = dayMeta.get(k);
    let cls = "cal__day";
    if (k === today) cls += " cal__day--today";
    if (meta) cls += " cal__day--busy";
    if (meta?.pending) cls += " cal__day--pending";
    if (selectedDate === k) cls += " cal__day--selected";
    const dot = meta ? `<span class="cal__dot" aria-hidden="true"></span>` : "";
    cells += `<button type="button" class="${cls}" data-cal-date="${k}">${d}${dot}</button>`;
  }

  return `<div class="cal">
    <div class="cal__head">
      <button type="button" class="cal__nav" data-cal-prev aria-label="Прошлый месяц">‹</button>
      <span class="cal__title">${monthLabel}</span>
      <button type="button" class="cal__nav" data-cal-next aria-label="Следующий месяц">›</button>
    </div>
    <div class="cal__weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>
    <div class="cal__grid">${cells}</div>
    ${selectedDate ? '<button type="button" class="cal__clear" data-cal-clear>Показать все дни</button>' : ""}
  </div>`;
}

function bindMasterCalendar(root, state, rerender) {
  root.querySelector("[data-cal-prev]")?.addEventListener("click", () => {
    state.month -= 1;
    if (state.month < 0) {
      state.month = 11;
      state.year -= 1;
    }
    rerender();
  });
  root.querySelector("[data-cal-next]")?.addEventListener("click", () => {
    state.month += 1;
    if (state.month > 11) {
      state.month = 0;
      state.year += 1;
    }
    rerender();
  });
  root.querySelectorAll("[data-cal-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedDate = btn.dataset.calDate;
      rerender();
    });
  });
  root.querySelector("[data-cal-clear]")?.addEventListener("click", () => {
    state.selectedDate = null;
    rerender();
  });
}

function masterBookingCardHTML(b) {
  const problem = b.problem ? `<p class="master-booking__problem">${escapeHtml(b.problem)}</p>` : "";
  return `<div class="master-booking booking-slot ${b.status === "pending" ? "booking-slot--upcoming" : ""}" data-booking-id="${b.id}">
    <div class="master-booking__main">
      <div class="master-booking__head">
        <strong>${formatBookingDate(b.booking_date)}, ${formatTime(b.booking_time)}</strong>
        ${statusLabel(b.status)}
      </div>
      <div class="master-booking__client">${escapeHtml(b.buyer_name)} · ${escapeHtml(serviceLabel(b.service))}</div>
      <a href="${phoneHref(b.phone)}" class="master-booking__phone">${escapeHtml(b.phone)}</a>
      ${problem}
    </div>
    ${masterBookingActions(b)}
  </div>`;
}

function masterBookingActions(b) {
  if (b.status === "pending") {
    return `<div class="booking-actions">
      <button type="button" class="btn btn--primary btn--sm" data-booking-action="confirmed" data-booking-id="${b.id}">Подтвердить</button>
      <button type="button" class="btn btn--outline btn--sm" data-booking-action="cancelled" data-booking-id="${b.id}">Отклонить</button>
    </div>`;
  }
  if (b.status === "confirmed") {
    return `<div class="booking-actions">
      <button type="button" class="btn btn--primary btn--sm" data-booking-action="completed" data-booking-id="${b.id}">Выполнено</button>
      <button type="button" class="btn btn--outline btn--sm" data-booking-action="cancelled" data-booking-id="${b.id}">Отменить</button>
    </div>`;
  }
  return "";
}

function bindMasterBookingActions(root) {
  root.querySelectorAll("[data-booking-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.bookingId;
      const status = btn.dataset.bookingAction;
      btn.disabled = true;
      try {
        await api.updateBookingStatus(id, status);
        await loadMasterCabinetPage();
      } catch (err) {
        alert(err.message || "Не удалось обновить запись");
        btn.disabled = false;
      }
    });
  });
}

function renderMasterCabinetDOM(root, data, summary) {
  const profile = data.profile;
  masterBookingsCache = data.bookings;

  if (!masterCalState) {
    const now = new Date();
    masterCalState = { year: now.getFullYear(), month: now.getMonth(), selectedDate: null };
  }

  let profileNote = "";
  if (!profile.is_verified || !profile.is_active) {
    profileNote =
      '<div class="alert alert--info">Профиль на проверке. Записи уже видны здесь, в каталоге появитесь после одобрения.</div>';
  }

  const pendingAlert =
    data.pending_count > 0
      ? `<div class="master-alert" role="status">У вас ${data.pending_count} ${pluralPending(data.pending_count)} — подтвердите или отклоните</div>`
      : "";

  const pendingBadge =
    data.pending_count > 0 ? `<span class="cabinet-nav__badge">${data.pending_count}</span>` : "";

  const filtered = masterCalState.selectedDate
    ? data.bookings.filter((b) => bookingDateKey(b) === masterCalState.selectedDate)
    : data.bookings;

  const listTitle = masterCalState.selectedDate
    ? `Записи на ${formatISODate(masterCalState.selectedDate)}`
    : "Все записи";

  const bookingsHtml =
    filtered.length === 0
      ? `<p class="section__subtitle">${masterCalState.selectedDate ? "На этот день записей нет." : "Пока никто не записался."}</p>`
      : filtered.map(masterBookingCardHTML).join("");

  root.innerHTML = `
    <div class="master-cabinet">
      <header class="master-cabinet__hero">
        <div class="master-cabinet__hero-top">
          <span class="master-cabinet__tag">Кабинет мастера</span>
          ${data.pending_count > 0 ? `<span class="master-cabinet__pending">${data.pending_count} новых</span>` : ""}
        </div>
        <h1 class="master-cabinet__title">Записи клиентов</h1>
        <p class="master-cabinet__sub">${escapeHtml(profile.name)} · ${escapeHtml(profile.district)}</p>
        ${profileNote}
        ${pendingAlert}
      </header>
      <div class="master-cabinet__grid">
        <aside class="master-cabinet__aside">
          <h2 class="master-cabinet__section-title">Календарь ${pendingBadge}</h2>
          <div id="master-calendar-wrap">${renderMasterCalendar(data.bookings, masterCalState)}</div>
        </aside>
        <section class="master-cabinet__main">
          <h2 class="master-cabinet__section-title">${listTitle}</h2>
          <div id="master-bookings-list" class="master-cabinet__bookings">${bookingsHtml}</div>
        </section>
      </div>
    </div>
  `;

  markMasterBookingsSeen(data.bookings, summary);
  updateMasterHeaderBadge(data.pending_count);
  bindMasterBookingActions(root);
  bindMasterCalendar(document.getElementById("master-calendar-wrap"), masterCalState, () =>
    renderMasterCabinetDOM(root, data, summary)
  );
}

async function loadMasterCabinetPage() {
  const root = document.getElementById("cabinet-root");
  if (!root) return;

  if (!(await requireAuth())) return;

  setCabinetPageMode(true);
  root.innerHTML = '<p class="loading-hint">Загрузка кабинета мастера…</p>';

  try {
    const [data, summary] = await Promise.all([api.getMasterCabinet(), api.getMasterSummary()]);
    renderMasterCabinetDOM(root, data, summary);
  } catch (e) {
    root.innerHTML = `
      <div class="master-cabinet master-cabinet--error">
        <header class="master-cabinet__hero">
          <span class="master-cabinet__tag">Кабинет мастера</span>
          <h1 class="master-cabinet__title">Профиль не подключён</h1>
        </header>
        <div class="alert alert--info">${escapeHtml(e.message)}</div>
        <p class="section__subtitle">Напишите менеджеру — привяжут аккаунт к профилю в каталоге.</p>
      </div>`;
  }
}

async function loadBuyerCabinetPage() {
  const root = document.getElementById("cabinet-root");
  if (!root) return;

  if (!(await requireAuth())) return;

  if (await detectMasterAccount()) {
    location.href = masterCabinetUrl();
    return;
  }

  setCabinetPageMode(false);
  root.innerHTML = '<p class="loading-hint">Загрузка…</p>';

  try {
    const data = await api.getCabinet();
    const bookingsHtml =
      data.bookings.length === 0
        ? '<p class="section__subtitle">Нет записей. <a href="booking.html">Записаться к мастеру</a></p>'
        : data.bookings
            .map(
              (b) => `
        <div class="booking-slot ${b.status === "confirmed" ? "booking-slot--upcoming" : ""}">
          <div>
            <strong>${formatBookingDate(b.booking_date)}, ${formatTime(b.booking_time)}</strong><br>
            ${escapeHtml(b.master_name)} · ${escapeHtml(serviceLabel(b.service))}
          </div>
          ${statusLabel(b.status)}
        </div>`
            )
            .join("");

    const repairsHtml =
      data.repairs.length === 0
        ? '<p class="section__subtitle">История пуста</p>'
        : data.repairs
            .map((r) => {
              const d = new Date(r.date);
              return `
        <div class="timeline-item">
          <div class="timeline-item__date">
            <strong>${d.getDate()}</strong>
            <span>${d.toLocaleDateString("ru-RU", { month: "short" })}</span>
          </div>
          <div>
            <strong>${escapeHtml(r.title)}</strong><br>
            ${escapeHtml(r.master)} · ${r.cost.toLocaleString("ru-RU")} сом
            ${r.part ? `<br><small>${escapeHtml(r.part)}</small>` : ""}
          </div>
        </div>`;
            })
            .join("");

    root.innerHTML = `
      <div class="buyer-cabinet">
        <header class="buyer-cabinet__head">
          <span class="buyer-cabinet__tag">Кабинет покупателя</span>
          <h1 class="buyer-cabinet__title">Мои записи и история</h1>
          <p class="buyer-cabinet__lead">Здесь — куда <strong>вы</strong> записались к мастерам. Это не панель мастера.</p>
          <p class="buyer-cabinet__master-link">Вы мастер? Откройте <a href="master.html">кабинет мастера</a> (нужен аккаунт с привязанным профилем).</p>
        </header>
        <div class="cabinet-layout">
          <nav class="cabinet-nav">
            <a href="#bookings" class="active">Мои записи</a>
            <a href="#history">История</a>
            <a href="booking.html">Записаться</a>
          </nav>
          <div>
            <div class="cabinet-panel" id="bookings">
              <h2>Записи к мастерам</h2>
              ${bookingsHtml}
            </div>
            <div class="cabinet-panel buyer-cabinet__history" id="history">
              <h2>История ремонтов</h2>
              ${repairsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    root.innerHTML = `<div class="alert alert--info">${escapeHtml(e.message)}</div>`;
  }
}

function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  const errEl = document.getElementById("auth-error");

  if (getToken()) {
    refreshSession().then(() => {
      if (next) location.href = next;
      else redirectAfterLogin();
    });
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl?.classList.remove("visible");
    const fd = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Вход…";
    try {
      if (!(await checkApi())) throw new Error("Сервис временно недоступен");
      await api.login(fd.get("email"), fd.get("password"));
      renderAuthHeader();
      if (next) location.href = next;
      else await redirectAfterLogin();
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.classList.add("visible");
      }
      btn.disabled = false;
      btn.textContent = "Войти";
    }
  });
}

function initRegisterRoleFields() {
  const roleSel = document.getElementById("reg-role");
  const masterFields = document.getElementById("master-fields");
  if (!roleSel || !masterFields) return;
  const toggle = () => {
    masterFields.style.display = roleSel.value === "master" ? "block" : "none";
  };
  roleSel.addEventListener("change", toggle);
  toggle();
}

function initRegisterPage() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const errEl = document.getElementById("auth-error");
  initRegisterRoleFields();

  if (getToken()) {
    redirectAfterLogin();
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl?.classList.remove("visible");
    const fd = new FormData(form);
    const password = fd.get("password");
    if (password !== fd.get("password2")) {
      if (errEl) {
        errEl.textContent = "Пароли не совпадают";
        errEl.classList.add("visible");
      }
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Регистрация…";
    try {
      if (!(await checkApi())) throw new Error("Сервис временно недоступен");
      const data = await api.register({
        email: fd.get("email"),
        password,
        full_name: fd.get("full_name"),
        phone: fd.get("phone"),
        role: fd.get("role") || "buyer",
        district: fd.get("district"),
        spec: fd.get("spec"),
      });
      renderAuthHeader();
      if (data.message) alert(data.message);
      if (fd.get("role") === "master") location.href = masterCabinetUrl();
      else await redirectAfterLogin();
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.classList.add("visible");
      }
      btn.disabled = false;
      btn.textContent = "Зарегистрироваться";
    }
  });
}

async function loadBookingMasters() {
  const sel = document.querySelector('#booking-form select[name="master"]');
  if (!sel) return;
  const masters = await loadMasters();
  if (!masters?.length) {
    sel.innerHTML = '<option value="">Нет мастеров</option>';
    return;
  }
  const user = getCurrentUser();
  const ownId = user?.master_id;
  const list = ownId != null ? masters.filter((m) => String(m.id) !== String(ownId)) : masters;
  const params = new URLSearchParams(location.search);
  let pre = params.get("master");
  if (ownId != null && String(pre) === String(ownId)) pre = null;
  if (!list.length) {
    sel.innerHTML = '<option value="">Нет других мастеров</option>';
    return;
  }
  sel.innerHTML =
    '<option value="">Выберите</option>' +
    list
      .map(
        (m) =>
          `<option value="${m.id}"${pre && String(pre) === String(m.id) ? " selected" : ""}>${escapeHtml(m.name)}</option>`
      )
      .join("");
}

async function initBookingAuth() {
  const notice = document.getElementById("booking-auth-notice");
  const masterNotice = document.getElementById("booking-master-notice");
  const form = document.getElementById("booking-form");
  if (!form) return;

  await loadBookingMasters();

  const user = getCurrentUser();
  if (user && getToken()) {
    if (notice) notice.style.display = "none";
    if (masterNotice) masterNotice.style.display = isMasterAccount(user) ? "block" : "none";
    const phone = form.querySelector('[name="phone"]');
    if (phone && user.phone && !phone.value) phone.value = user.phone;
    return true;
  }

  if (notice) notice.style.display = "block";
  if (masterNotice) masterNotice.style.display = "none";
  return false;
}

document.addEventListener("DOMContentLoaded", async () => {
  await refreshSession();
  renderAuthHeader();
  initLoginPage();
  initRegisterPage();
  if (document.getElementById("cabinet-root")) {
    if (location.pathname.endsWith("master.html")) {
      await loadMasterCabinetPage();
    } else {
      await loadBuyerCabinetPage();
    }
  }
  initBookingAuth();
  await startMasterPolling();
});
