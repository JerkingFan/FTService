/** Авторизация: шапка, защита страниц, кабинет */

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
    el.innerHTML = `
      <a href="cabinet.html" class="header-user" title="${escapeHtml(user.email)}">
        <span class="header-user__avatar">${initials}</span>
        <span class="header-user__name">${escapeHtml(user.full_name)}</span>
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
    return user;
  } catch {
    clearAuth();
    return null;
  }
}

async function requireAuth() {
  if (!(await checkApi())) {
    alert("API не запущен. Запустите бэкенд на порту 8000.");
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
    pending: ["Ожидает", "status-badge--pending"],
    confirmed: ["Подтверждено", "status-badge--confirmed"],
    completed: ["Выполнено", "status-badge--completed"],
    cancelled: ["Отменено", "status-badge--cancelled"],
  };
  const [text, cls] = map[status] || [status, ""];
  return `<span class="status-badge ${cls}">${text}</span>`;
}

async function loadCabinetPage() {
  const root = document.getElementById("cabinet-root");
  if (!root) return;

  if (!(await requireAuth())) return;

  root.innerHTML = '<p style="padding:24px;color:var(--gray-500);">Загрузка…</p>';

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
      <div class="cabinet-layout">
        <nav class="cabinet-nav">
          <a href="#bookings" class="active">Записи</a>
          <a href="#history">История</a>
          <a href="booking.html">Новая запись</a>
        </nav>
        <div>
          <div class="cabinet-panel" id="bookings">
            <h2>Мои записи</h2>
            ${bookingsHtml}
          </div>
          <div class="cabinet-panel" id="history" style="margin-top:20px;">
            <h2>История ремонтов</h2>
            ${repairsHtml}
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
  const next = params.get("next") || "cabinet.html";
  const errEl = document.getElementById("auth-error");

  if (getToken()) {
    refreshSession().then(() => {
      location.href = next;
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
      if (!(await checkApi())) throw new Error("Сервер не отвечает. Запустите API: uvicorn app.main:app --reload");
      await api.login(fd.get("email"), fd.get("password"));
      renderAuthHeader();
      location.href = next;
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
    location.href = "cabinet.html";
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
      if (!(await checkApi())) throw new Error("Сервер не отвечает. Запустите API на порту 8000");
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
      location.href = "cabinet.html";
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
    sel.innerHTML = '<option value="">Нет мастеров (запустите API)</option>';
    return;
  }
  const params = new URLSearchParams(location.search);
  const pre = params.get("master");
  sel.innerHTML =
    '<option value="">Выберите</option>' +
    masters
      .map(
        (m) =>
          `<option value="${m.id}"${String(pre) === String(m.id) ? " selected" : ""}>${escapeHtml(m.name)}</option>`
      )
      .join("");
}

async function initBookingAuth() {
  const notice = document.getElementById("booking-auth-notice");
  const form = document.getElementById("booking-form");
  if (!form) return;

  await loadBookingMasters();

  const user = getCurrentUser();
  if (user && getToken()) {
    if (notice) notice.style.display = "none";
    const phone = form.querySelector('[name="phone"]');
    if (phone && user.phone && !phone.value) phone.value = user.phone;
    return true;
  }

  if (notice) notice.style.display = "block";
  return false;
}

document.addEventListener("DOMContentLoaded", async () => {
  await refreshSession();
  renderAuthHeader();
  initLoginPage();
  initRegisterPage();
  loadCabinetPage();
  initBookingAuth();
});
