const USER_ROLE_LABELS = {
  buyer: "Покупатель",
  moderator: "Модератор",
  admin: "Администратор",
  master: "Мастер",
};

const PART_STATUS_LABELS = {
  published: "В каталоге",
  archived: "Снято",
};

function renderAdminFullPanel(root, user, categories, pendingCount) {
  root.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Панель администратора</h1>
        <span class="admin-role admin-role--admin">Администратор</span>
      </div>
      <a href="parts.html" class="btn btn--outline btn--sm">Сайт</a>
    </div>
    <div class="admin-tabs admin-tabs--wrap">
      <button type="button" class="active" data-tab="stats">Сводка</button>
      <button type="button" data-tab="queue">Очередь <span class="badge" id="tab-pending-badge">${pendingCount}</span></button>
      <button type="button" data-tab="parts">Каталог</button>
      <button type="button" data-tab="masters">Мастера</button>
      <button type="button" data-tab="users">Пользователи</button>
      <button type="button" data-tab="manual">Публикация</button>
    </div>
    <div data-panel="stats" id="panel-stats"><p style="color:var(--gray-500);">Загрузка…</p></div>
    <div data-panel="queue" style="display:none;">
      <p class="admin-panel-hint">Заявки с формы «Подать объявление». Можно редактировать перед одобрением.</p>
      <div id="admin-submissions-list"></div>
    </div>
    <div data-panel="parts" style="display:none;" id="panel-parts"></div>
    <div data-panel="masters" style="display:none;" id="panel-masters"></div>
    <div data-panel="users" style="display:none;" id="panel-users"></div>
    <div data-panel="manual" style="display:none;">
      <p class="admin-panel-hint">Прямая публикация в каталог (WhatsApp / звонок).</p>
      ${renderManualForm(categories)}
    </div>
  `;

  bindTabs(root);
  bindAdminTabLazyLoad(root);
  bindManualForm(root);
  loadStatsPanel();
}

function bindAdminTabLazyLoad(root) {
  const loaded = { stats: true };
  root.querySelectorAll(".admin-tabs button").forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      if (loaded[name]) return;
      loaded[name] = true;
      if (name === "queue") {
        loadSubmissionsList(
          document.getElementById("admin-submissions-list"),
          document.getElementById("tab-pending-badge")
        );
      }
      if (name === "parts") loadPartsPanel();
      if (name === "masters") loadMastersPanel();
      if (name === "users") loadUsersPanel();
    });
  });
}

async function loadStatsPanel() {
  const el = document.getElementById("panel-stats");
  if (!el) return;
  try {
    const s = await api.getAdminStats();
    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><strong>${s.users_total}</strong><span>Пользователей</span></div>
        <div class="stat-card"><strong>${s.users_buyers}</strong><span>Покупателей</span></div>
        <div class="stat-card stat-card--accent"><strong>${s.submissions_pending}</strong><span>В очереди</span></div>
        <div class="stat-card"><strong>${s.parts_published}</strong><span>В каталоге</span></div>
        <div class="stat-card"><strong>${s.parts_archived}</strong><span>Снято</span></div>
        <div class="stat-card"><strong>${s.masters_active}</strong><span>Мастеров</span></div>
        <div class="stat-card"><strong>${s.bookings_total}</strong><span>Записей</span></div>
        <div class="stat-card"><strong>${s.bookings_pending}</strong><span>Ожидают</span></div>
      </div>
      <p class="admin-panel-hint" style="margin-top:20px;">Модератор видит только очередь и ручную публикацию. Вы управляете всем сервисом.</p>`;
  } catch (e) {
    el.innerHTML = `<p class="alert alert--info">${escapeHtml(e.message)}</p>`;
  }
}

async function loadPartsPanel() {
  const el = document.getElementById("panel-parts");
  if (!el) return;
  el.innerHTML = '<p style="color:var(--gray-500);">Загрузка…</p>';
  try {
    const parts = await api.getAdminParts("all");
    if (!parts.length) {
      el.innerHTML = '<div class="admin-empty"><p>Объявлений нет</p></div>';
      return;
    }
    el.innerHTML = `
      <div class="admin-toolbar">
        <label>Фильтр
          <select id="parts-filter">
            <option value="all">Все</option>
            <option value="published">В каталоге</option>
            <option value="archived">Снятые</option>
          </select>
        </label>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table" id="parts-table">
          <thead><tr>
            <th>ID</th><th>Название</th><th>Цена</th><th>Район</th><th>Статус</th><th></th>
          </tr></thead>
          <tbody>${parts.map(renderPartRow).join("")}</tbody>
        </table>
      </div>`;
    el.querySelector("#parts-filter")?.addEventListener("change", async (e) => {
      const filtered = await api.getAdminParts(e.target.value);
      el.querySelector("#parts-table tbody").innerHTML = filtered.map(renderPartRow).join("");
      bindPartsTableActions(el);
    });
    bindPartsTableActions(el);
  } catch (e) {
    el.innerHTML = `<p class="alert alert--info">${escapeHtml(e.message)}</p>`;
  }
}

function renderPartRow(p) {
  const st = PART_STATUS_LABELS[p.status] || p.status;
  return `<tr data-id="${p.id}">
    <td>${p.id}</td>
    <td><strong>${escapeHtml(p.title)}</strong><br><small>${escapeHtml(p.car)}</small></td>
    <td>${p.price.toLocaleString("ru-RU")} сом</td>
    <td>${escapeHtml(p.location)}</td>
    <td><span class="status-pill status-pill--${p.status}">${st}</span></td>
    <td class="admin-table__actions">
      <button type="button" class="btn btn--outline btn--sm btn-part-edit" data-id="${p.id}">Изменить</button>
      ${p.status === "published"
        ? `<button type="button" class="btn btn--danger btn--sm btn-part-archive" data-id="${p.id}">Снять</button>`
        : `<button type="button" class="btn btn--primary btn--sm btn-part-publish" data-id="${p.id}">В каталог</button>`}
    </td>
  </tr>`;
}

function bindPartsTableActions(container) {
  container.querySelectorAll(".btn-part-archive").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Снять объявление с каталога?")) return;
      try {
        await api.archiveAdminPart(btn.dataset.id);
        showToast("Объявление снято");
        loadPartsPanel();
      } catch (e) {
        showToast(e.message, true);
      }
    };
  });
  container.querySelectorAll(".btn-part-publish").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api.publishAdminPart(btn.dataset.id);
        showToast("Снова в каталоге");
        loadPartsPanel();
      } catch (e) {
        showToast(e.message, true);
      }
    };
  });
  container.querySelectorAll(".btn-part-edit").forEach((btn) => {
    btn.onclick = () => openPartEditModal(parseInt(btn.dataset.id, 10), container);
  });
}

async function openPartEditModal(partId, container) {
  const parts = await api.getAdminParts("all");
  const p = parts.find((x) => x.id === partId);
  if (!p) return;
  const catOpts = adminCategories
    .map((c) => `<option value="${c.id}"${c.id === p.category ? " selected" : ""}>${escapeHtml(c.name)}</option>`)
    .join("");

  const overlay = document.createElement("div");
  overlay.className = "admin-modal-overlay open";
  overlay.innerHTML = `
    <div class="admin-modal">
      <button type="button" class="modal__close">×</button>
      <h2>Редактировать #${p.id}</h2>
      <form id="part-edit-form" class="submission-edit-form">
        <div class="form-row"><label>Название</label><input name="title" value="${escAttr(p.title)}" required></div>
        <div class="form-row"><label>Цена</label><input name="price" type="number" value="${p.price}" required min="1"></div>
        <div class="form-row"><label>Состояние</label>
          <select name="condition">
            <option value="used"${p.condition === "used" ? " selected" : ""}>Б/у</option>
            <option value="new"${p.condition === "new" ? " selected" : ""}>Новое</option>
          </select>
        </div>
        <div class="form-row"><label>Категория</label><select name="category">${catOpts}</select></div>
        <div class="form-row"><label>Авто</label><input name="car" value="${escAttr(p.car)}" required></div>
        <div class="form-row"><label>Район</label><input name="location" value="${escAttr(p.location)}" required></div>
        <div class="form-row"><label>Продавец</label><input name="seller_name" value="${escAttr(p.seller_name)}" required></div>
        <div class="submission-actions">
          <button type="submit" class="btn btn--primary">Сохранить</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector(".modal__close").onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  overlay.querySelector("#part-edit-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.updateAdminPart(partId, {
        title: fd.get("title"),
        price: parseInt(fd.get("price"), 10),
        condition: fd.get("condition"),
        category: fd.get("category"),
        car: fd.get("car"),
        location: fd.get("location"),
        seller_name: fd.get("seller_name"),
      });
      showToast("Сохранено");
      overlay.remove();
      loadPartsPanel();
    } catch (err) {
      showToast(err.message, true);
    }
  };
}

async function loadMastersPanel() {
  const el = document.getElementById("panel-masters");
  if (!el) return;
  el.innerHTML = '<p style="color:var(--gray-500);">Загрузка…</p>';
  try {
    const masters = await api.getAdminMasters();
    el.innerHTML = `
      <button type="button" class="btn btn--primary btn--sm" id="btn-add-master" style="margin-bottom:16px;">+ Добавить мастера</button>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>Имя</th><th>Район</th><th>Рейтинг</th><th>От</th><th>Статус</th><th></th>
          </tr></thead>
          <tbody>${masters.map(renderMasterRow).join("")}</tbody>
        </table>
      </div>
      <div id="master-form-box" style="display:none;margin-top:20px;"></div>`;
    el.querySelector("#btn-add-master").onclick = () => showMasterForm(el, null);
    bindMastersTable(el, masters);
  } catch (e) {
    el.innerHTML = `<p class="alert alert--info">${escapeHtml(e.message)}</p>`;
  }
}

function renderMasterRow(m) {
  return `<tr data-id="${m.id}">
    <td><strong>${escapeHtml(m.name)}</strong><br><small>${escapeHtml(m.spec)}</small></td>
    <td>${escapeHtml(m.district)}</td>
    <td>${m.rating} ★ · ${m.jobs_count} работ</td>
    <td>${m.price_from} сом</td>
    <td>${m.is_active ? '<span class="status-pill status-pill--published">Активен</span>' : '<span class="status-pill status-pill--archived">Скрыт</span>'}</td>
    <td><button type="button" class="btn btn--outline btn--sm btn-master-edit" data-id="${m.id}">Изменить</button></td>
  </tr>`;
}

function bindMastersTable(el, masters) {
  el.querySelectorAll(".btn-master-edit").forEach((btn) => {
    btn.onclick = () => {
      const m = masters.find((x) => x.id === parseInt(btn.dataset.id, 10));
      if (m) showMasterForm(el, m);
    };
  });
}

function showMasterForm(el, master) {
  const box = el.querySelector("#master-form-box");
  box.style.display = "block";
  const isNew = !master;
  box.innerHTML = `
    <form id="master-admin-form" class="admin-form">
      <h3>${isNew ? "Новый мастер" : "Редактирование: " + escapeHtml(master.name)}</h3>
      <div class="submission-edit-grid">
        <div class="form-row"><label>Имя</label><input name="name" value="${escAttr(master?.name || "")}" required></div>
        <div class="form-row"><label>Специализация</label><input name="spec" value="${escAttr(master?.spec || "Автоэлектрик")}"></div>
        <div class="form-row"><label>Опыт</label><input name="experience" value="${escAttr(master?.experience || "")}" required></div>
        <div class="form-row"><label>Район</label><input name="district" value="${escAttr(master?.district || "")}" required></div>
        <div class="form-row"><label>ID пользователя (аккаунт)</label><input name="user_id" type="number" min="1" placeholder="из раздела Пользователи" value="${master?.user_id ?? ""}"></div>
        <div class="form-row"><label>Рейтинг</label><input name="rating" type="number" step="0.1" min="0" max="5" value="${master?.rating ?? 5}"></div>
        <div class="form-row"><label>Работ</label><input name="jobs_count" type="number" min="0" value="${master?.jobs_count ?? 0}"></div>
        <div class="form-row"><label>Цена от (сом)</label><input name="price_from" type="number" min="1" value="${master?.price_from ?? 500}"></div>
        <div class="form-row"><label><input type="checkbox" name="is_verified" ${master?.is_verified !== false ? "checked" : ""}> Проверен</label></div>
        <div class="form-row"><label><input type="checkbox" name="is_active" ${master?.is_active !== false ? "checked" : ""}> Показывать на сайте</label></div>
      </div>
      <div class="submission-actions">
        <button type="submit" class="btn btn--primary">${isNew ? "Создать" : "Сохранить"}</button>
        <button type="button" class="btn btn--outline" id="master-form-cancel">Отмена</button>
      </div>
    </form>`;
  box.querySelector("#master-form-cancel").onclick = () => {
    box.style.display = "none";
  };
  box.querySelector("#master-admin-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name"),
      spec: fd.get("spec") || "Автоэлектрик",
      experience: fd.get("experience"),
      district: fd.get("district"),
      rating: parseFloat(fd.get("rating")),
      jobs_count: parseInt(fd.get("jobs_count"), 10),
      price_from: parseInt(fd.get("price_from"), 10),
      is_verified: fd.get("is_verified") === "on",
      is_active: fd.get("is_active") === "on",
    };
    const userIdRaw = fd.get("user_id");
    if (!isNew && userIdRaw) payload.user_id = parseInt(userIdRaw, 10);
    try {
      if (isNew) await api.createAdminMaster(payload);
      else await api.updateAdminMaster(master.id, payload);
      showToast(isNew ? "Мастер добавлен" : "Сохранено");
      box.style.display = "none";
      loadMastersPanel();
    } catch (err) {
      showToast(err.message, true);
    }
  };
}

async function loadUsersPanel() {
  const el = document.getElementById("panel-users");
  if (!el) return;
  el.innerHTML = '<p style="color:var(--gray-500);">Загрузка…</p>';
  try {
    const users = await api.getAdminUsers();
    const currentId = getCurrentUser()?.id;
    el.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Статус</th><th></th>
          </tr></thead>
          <tbody>${users.map((u) => renderUserRow(u, currentId)).join("")}</tbody>
        </table>
      </div>`;
    bindUsersTable(el, users, currentId);
  } catch (e) {
    el.innerHTML = `<p class="alert alert--info">${escapeHtml(e.message)}</p>`;
  }
}

function renderUserRow(u, currentId) {
  const isSelf = u.id === currentId;
  return `<tr data-id="${u.id}">
    <td>${u.id}</td>
    <td>${escapeHtml(u.full_name)}${isSelf ? " <small>(вы)</small>" : ""}</td>
    <td>${escapeHtml(u.email)}</td>
    <td>
      <select class="user-role-select" data-id="${u.id}" ${isSelf ? "disabled" : ""}>
        <option value="buyer"${u.role === "buyer" ? " selected" : ""}>Покупатель</option>
        <option value="moderator"${u.role === "moderator" ? " selected" : ""}>Модератор</option>
        <option value="admin"${u.role === "admin" ? " selected" : ""}>Администратор</option>
      </select>
    </td>
    <td>${u.is_active ? '<span class="status-pill status-pill--published">Активен</span>' : '<span class="status-pill status-pill--archived">Заблокирован</span>'}</td>
    <td>
      ${isSelf ? "" : `<button type="button" class="btn btn--outline btn--sm btn-user-toggle" data-id="${u.id}" data-active="${u.is_active}">${u.is_active ? "Блокировать" : "Разблокировать"}</button>`}
    </td>
  </tr>`;
}

function bindUsersTable(el, users, currentId) {
  el.querySelectorAll(".user-role-select").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const id = parseInt(sel.dataset.id, 10);
      if (!confirm("Изменить роль пользователя?")) {
        loadUsersPanel();
        return;
      }
      try {
        await api.updateAdminUser(id, { role: sel.value });
        showToast("Роль обновлена");
        loadUsersPanel();
      } catch (e) {
        showToast(e.message, true);
        loadUsersPanel();
      }
    });
  });
  el.querySelectorAll(".btn-user-toggle").forEach((btn) => {
    btn.onclick = async () => {
      const id = parseInt(btn.dataset.id, 10);
      const active = btn.dataset.active === "true";
      if (!confirm(active ? "Заблокировать пользователя?" : "Разблокировать?")) return;
      try {
        await api.updateAdminUser(id, { is_active: !active });
        showToast(active ? "Заблокирован" : "Разблокирован");
        loadUsersPanel();
      } catch (e) {
        showToast(e.message, true);
      }
    };
  });
}
