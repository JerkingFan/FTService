/** Панель модерации для admin / moderator */

const CATEGORY_LABELS = {
  engine: "Двигатель",
  electrical: "Электрика",
  body: "Кузов",
  brakes: "Тормоза",
  suspension: "Подвеска",
  cooling: "Охлаждение",
  transmission: "КПП",
  interior: "Салон",
};

const CONDITION_LABELS = { used: "Б/у", new: "Новое" };

let adminCategories = [];
const submissionsCache = new Map();

function isStaff(user) {
  return user && (user.role === "admin" || user.role === "moderator");
}

function roleLabel(role) {
  return role === "admin" ? "Администратор" : "Модератор";
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showToast(msg, isError) {
  const el = document.getElementById("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "admin-toast visible" + (isError ? " admin-toast--error" : "");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("visible"), 3200);
}

function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function renderDenied(root) {
  root.innerHTML = `
    <div class="admin-denied cabinet-panel">
      <h2>Доступ запрещён</h2>
      <p style="color:var(--gray-500);margin:16px 0;">Панель только для модераторов и администраторов.</p>
      <a href="login.html?next=admin.html" class="btn btn--primary">Войти</a>
      <a href="index.html" class="btn btn--outline" style="margin-left:8px;">На главную</a>
    </div>`;
}

function renderSubmissionCard(sub) {
  const cat = CATEGORY_LABELS[sub.category] || sub.category;
  const cond = CONDITION_LABELS[sub.condition] || sub.condition;
  const notes = sub.notes
    ? `<div class="submission-notes"><strong>Комментарий:</strong> ${escapeHtml(sub.notes)}</div>`
    : "";

  return `
    <article class="submission-card" data-id="${sub.id}">
      <div class="submission-card__head">
        <div>
          <h3>${escapeHtml(sub.title)}</h3>
          <span style="font-size:12px;color:var(--gray-500);">#${sub.id} · ${formatDate(sub.created_at)}</span>
        </div>
        <div class="submission-card__price">${sub.price.toLocaleString("ru-RU")} сом</div>
      </div>
      <dl class="submission-meta">
        <div><dt>Контакт</dt><dd>${escapeHtml(sub.contact_name)} · ${escapeHtml(sub.contact_phone)}</dd></div>
        <div><dt>Авто</dt><dd>${escapeHtml(sub.car)}</dd></div>
        <div><dt>Район</dt><dd>${escapeHtml(sub.location)}</dd></div>
        <div><dt>Категория</dt><dd>${escapeHtml(cat)}</dd></div>
        <div><dt>Состояние</dt><dd>${escapeHtml(cond)}</dd></div>
      </dl>
      ${notes}
      <div class="submission-actions">
        <button type="button" class="btn btn--outline btn-edit" data-id="${sub.id}">Редактировать</button>
        <button type="button" class="btn btn--primary btn-approve" data-id="${sub.id}">Одобрить</button>
        <button type="button" class="btn btn--danger btn-reject" data-id="${sub.id}">Отклонить</button>
      </div>
    </article>`;
}

function renderSubmissionEditForm(sub) {
  const catOpts = adminCategories
    .map(
      (c) =>
        `<option value="${c.id}"${c.id === sub.category ? " selected" : ""}>${escapeHtml(c.name)}</option>`
    )
    .join("");

  return `
    <form class="submission-edit-form" data-id="${sub.id}">
      <h3 style="margin:0 0 14px;font-size:17px;">Редактирование #${sub.id}</h3>
      <div class="submission-edit-grid">
        <div class="form-row">
          <label>Имя продавца</label>
          <input name="contact_name" value="${escAttr(sub.contact_name)}" required minlength="2">
        </div>
        <div class="form-row">
          <label>Телефон</label>
          <input name="contact_phone" value="${escAttr(sub.contact_phone)}" required>
        </div>
        <div class="form-row" style="grid-column:1/-1;">
          <label>Название</label>
          <input name="title" value="${escAttr(sub.title)}" required minlength="3">
        </div>
        <div class="form-row">
          <label>Цена (сом)</label>
          <input name="price" type="number" value="${sub.price}" required min="1">
        </div>
        <div class="form-row">
          <label>Состояние</label>
          <select name="condition" required>
            <option value="used"${sub.condition === "used" ? " selected" : ""}>Б/у</option>
            <option value="new"${sub.condition === "new" ? " selected" : ""}>Новое</option>
          </select>
        </div>
        <div class="form-row">
          <label>Категория</label>
          <select name="category" required>${catOpts}</select>
        </div>
        <div class="form-row">
          <label>Авто / марка</label>
          <input name="car" value="${escAttr(sub.car)}" required>
        </div>
        <div class="form-row">
          <label>Район</label>
          <input name="location" value="${escAttr(sub.location)}" required>
        </div>
        <div class="form-row" style="grid-column:1/-1;">
          <label>Комментарий</label>
          <textarea name="notes">${escapeHtml(sub.notes || "")}</textarea>
        </div>
      </div>
      <div class="submission-actions">
        <button type="submit" class="btn btn--primary">Сохранить</button>
        <button type="button" class="btn btn--outline btn-cancel-edit">Отмена</button>
      </div>
    </form>`;
}

function replaceCardWithView(card, sub) {
  submissionsCache.set(sub.id, sub);
  const wrap = document.createElement("div");
  wrap.innerHTML = renderSubmissionCard(sub);
  const newCard = wrap.firstElementChild;
  card.replaceWith(newCard);
  bindSubmissionButtons(newCard.parentElement);
}

function openEditMode(card, sub) {
  card.classList.add("submission-card--editing");
  card.innerHTML = renderSubmissionEditForm(sub);
  const form = card.querySelector("form");
  form.addEventListener("submit", (e) => handleSaveEdit(e, sub.id, card));
  card.querySelector(".btn-cancel-edit")?.addEventListener("click", () => {
    replaceCardWithView(card, submissionsCache.get(sub.id) || sub);
  });
}

async function handleSaveEdit(e, id, card) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Сохранение…";
  try {
    const updated = await api.updateSubmission(id, {
      contact_name: fd.get("contact_name"),
      contact_phone: fd.get("contact_phone"),
      title: fd.get("title"),
      price: parseInt(fd.get("price"), 10),
      condition: fd.get("condition"),
      category: fd.get("category"),
      car: fd.get("car"),
      location: fd.get("location"),
      notes: fd.get("notes") || null,
    });
    showToast("Изменения сохранены");
    replaceCardWithView(card, updated);
  } catch (err) {
    showToast(err.message, true);
    btn.disabled = false;
    btn.textContent = "Сохранить";
  }
}

function renderManualForm(categories) {
  const opts = (categories || [])
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join("");

  return `
    <form id="admin-part-form" class="admin-form">
      <h2 style="margin-bottom:16px;">Опубликовать вручную</h2>
      <div class="form-row">
        <label>Название</label>
        <input name="title" required minlength="3" placeholder="Генератор Toyota Camry">
      </div>
      <div class="form-row">
        <label>Цена (сом)</label>
        <input name="price" type="number" required min="1" placeholder="8500">
      </div>
      <div class="form-row">
        <label>Состояние</label>
        <select name="condition" required>
          <option value="used">Б/у</option>
          <option value="new">Новое</option>
        </select>
      </div>
      <div class="form-row">
        <label>Категория</label>
        <select name="category" required>${opts}</select>
      </div>
      <div class="form-row">
        <label>Авто / марка</label>
        <input name="car" required placeholder="Toyota Camry">
      </div>
      <div class="form-row">
        <label>Район</label>
        <input name="location" required placeholder="рынок Кудайберген">
      </div>
      <div class="form-row">
        <label>Продавец</label>
        <input name="seller_name" required placeholder="Азамат К.">
      </div>
      <button type="submit" class="btn btn--primary">Опубликовать</button>
    </form>`;
}

async function loadSubmissionsList(container, badgeEl) {
  container.innerHTML = '<p style="color:var(--gray-500);">Загрузка заявок…</p>';
  try {
    const subs = await api.getPendingSubmissions();
    if (badgeEl) badgeEl.textContent = subs.length;
    if (subs.length === 0) {
      container.innerHTML = `
        <div class="admin-empty">
          <p><strong>Очередь пуста</strong></p>
          <p>Новые заявки появятся после отправки с сайта или WhatsApp.</p>
        </div>`;
      return;
    }
    submissionsCache.clear();
    subs.forEach((s) => submissionsCache.set(s.id, s));
    container.innerHTML = subs.map(renderSubmissionCard).join("");
    bindSubmissionButtons(container);
  } catch (e) {
    container.innerHTML = `<p class="alert alert--info">${escapeHtml(e.message)}</p>`;
  }
}

function bindSubmissionButtons(container) {
  container.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      const sub = submissionsCache.get(id);
      const card = btn.closest(".submission-card");
      if (sub && card) openEditMode(card, sub);
    });
  });
  container.querySelectorAll(".btn-approve").forEach((btn) => {
    btn.addEventListener("click", () => handleApprove(btn));
  });
  container.querySelectorAll(".btn-reject").forEach((btn) => {
    btn.addEventListener("click", () => handleReject(btn));
  });
}

async function handleApprove(btn) {
  const id = btn.dataset.id;
  const card = btn.closest(".submission-card");
  if (!card || !confirm("Опубликовать объявление в каталоге?")) return;
  card.classList.add("processing");
  btn.disabled = true;
  try {
    const part = await api.approveSubmission(id);
    showToast(`Опубликовано: ${part.title}`);
    card.remove();
    updatePendingBadge();
  } catch (e) {
    showToast(e.message, true);
    card.classList.remove("processing");
    btn.disabled = false;
  }
}

async function handleReject(btn) {
  const id = btn.dataset.id;
  const card = btn.closest(".submission-card");
  if (!card || !confirm("Отклонить заявку?")) return;
  card.classList.add("processing");
  try {
    await api.rejectSubmission(id);
    showToast("Заявка отклонена");
    card.remove();
    updatePendingBadge();
  } catch (e) {
    showToast(e.message, true);
    card.classList.remove("processing");
  }
}

async function updatePendingBadge() {
  const badge = document.getElementById("tab-pending-badge");
  if (!badge) return;
  try {
    const subs = await api.getPendingSubmissions();
    badge.textContent = subs.length;
    const list = document.getElementById("admin-submissions-list");
    if (subs.length === 0 && list) {
      list.innerHTML = `
        <div class="admin-empty">
          <p><strong>Очередь пуста</strong></p>
        </div>`;
    }
  } catch (_) {}
}

function bindTabs(root) {
  const tabs = root.querySelectorAll(".admin-tabs button");
  const panels = root.querySelectorAll("[data-panel]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      panels.forEach((p) => {
        p.style.display = p.dataset.panel === name ? "block" : "none";
      });
    });
  });
}

function bindManualForm(root) {
  const form = root.querySelector("#admin-part-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Публикация…";
    try {
      const part = await api.createPart({
        title: fd.get("title"),
        price: parseInt(fd.get("price"), 10),
        condition: fd.get("condition"),
        category: fd.get("category"),
        car: fd.get("car"),
        location: fd.get("location"),
        seller_name: fd.get("seller_name"),
        verified: true,
      });
      showToast(`Добавлено: ${part.title}`);
      form.reset();
    } catch (err) {
      showToast(err.message, true);
    }
    btn.disabled = false;
    btn.textContent = "Опубликовать";
  });
}

async function initAdminPage() {
  const root = document.getElementById("admin-root");
  if (!root) return;

  if (!(await checkApi())) {
    root.innerHTML = '<p class="alert alert--info">Запустите API на порту 8000.</p>';
    return;
  }

  if (!getToken()) {
    location.href = "login.html?next=admin.html";
    return;
  }

  const user = await refreshSession();
  if (!user) {
    location.href = "login.html?next=admin.html";
    return;
  }

  if (!isStaff(user)) {
    renderDenied(root);
    return;
  }

  renderAuthHeader();

  let categories = [];
  try {
    categories = (await api.getCategories()) || [];
  } catch (_) {}
  adminCategories = categories;

  let pendingCount = 0;
  try {
    const subs = await api.getPendingSubmissions();
    pendingCount = subs.length;
  } catch (_) {}

  if (user.role === "admin") {
    renderAdminFullPanel(root, user, categories, pendingCount);
    return;
  }
  await renderModeratorPanel(root, user, categories, pendingCount);
}

async function renderModeratorPanel(root, user, categories, pendingCount) {
  root.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Модерация</h1>
        <span class="admin-role">${roleLabel(user.role)}</span>
      </div>
      <a href="parts.html" class="btn btn--outline btn--sm">Каталог</a>
    </div>
    <div class="admin-tabs">
      <button type="button" class="active" data-tab="queue">
        Очередь <span class="badge" id="tab-pending-badge">${pendingCount}</span>
      </button>
      <button type="button" data-tab="manual">Публикация вручную</button>
    </div>
    <div data-panel="queue">
      <p class="admin-panel-hint">Заявки с сайта («Подать объявление»). Одобрите — попадёт в каталог.</p>
      <div id="admin-submissions-list"><p style="color:var(--gray-500);">Загрузка…</p></div>
    </div>
    <div data-panel="manual" style="display:none;">
      <p class="admin-panel-hint">После проверки в WhatsApp — публикуйте сразу, минуя очередь.</p>
      ${renderManualForm(categories)}
    </div>
  `;
  bindTabs(root);
  bindManualForm(root);
  await loadSubmissionsList(
    document.getElementById("admin-submissions-list"),
    document.getElementById("tab-pending-badge")
  );
}

document.addEventListener("DOMContentLoaded", () => {
  initAdminPage();
});
