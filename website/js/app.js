const WHATSAPP_MSG = encodeURIComponent(
  "Здравствуйте! Хочу выложить объявление на FTservice — пришлю название, цену и фото."
);

const TELEGRAM_MSG = encodeURIComponent(
  "Здравствуйте! Хочу выложить объявление на FTservice."
);

function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}

function initModals() {
  document.querySelectorAll("[data-modal]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.modal));
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
    overlay.querySelector(".modal__close")?.addEventListener("click", () => overlay.classList.remove("open"));
  });
}

let appConfig = null;

async function getAppConfig() {
  if (appConfig) return appConfig;
  appConfig = (await loadConfig()) || { whatsapp: WHATSAPP, telegram: "ftservice_kg" };
  return appConfig;
}

async function initWhatsApp() {
  const cfg = await getAppConfig();
  const phone = cfg.whatsapp || WHATSAPP;
  const url = `https://wa.me/${phone}?text=${WHATSAPP_MSG}`;
  document.querySelectorAll("[data-whatsapp]").forEach(el => {
    el.href = url;
    el.target = "_blank";
    el.rel = "noopener";
  });
}

async function initTelegram() {
  const cfg = await getAppConfig();
  const user = (cfg.telegram || "ftservice_kg").replace("@", "");
  const url = `https://t.me/${user}?text=${TELEGRAM_MSG}`;
  document.querySelectorAll("[data-telegram]").forEach(el => {
    el.href = url;
    el.target = "_blank";
    el.rel = "noopener";
  });
}

async function initMessengers() {
  await initWhatsApp();
  await initTelegram();
}

function escHtml(s) {
  if (s == null) return "";
  const d = document.createElement("div");
  d.textContent = String(s);
  return d.innerHTML;
}

function fitsChipsHTML(fits) {
  if (!fits?.length) return "";
  return `<div class="fits-block"><span class="fits-block__label">Подходит для</span><div class="fits-chips">${fits
    .map((f) => `<span class="fits-chip">${escHtml(f)}</span>`)
    .join("")}</div></div>`;
}

function phoneLink(phone) {
  if (!phone) return "";
  const tel = phone.replace(/\s/g, "");
  return `<a href="tel:${escHtml(tel)}" class="detail-contact">${escHtml(phone)}</a>`;
}

async function initSubmitListingModal() {
  const overlay = document.getElementById("add-modal");
  if (!overlay) return;
  const modal = overlay.querySelector(".modal");
  if (!modal || modal.dataset.submitReady) return;
  modal.dataset.submitReady = "1";

  const categories = (await loadCategories()) || CATEGORIES;
  const catOptions = categories
    .map((c) => `<option value="${c.id}">${escHtml(c.name)}</option>`)
    .join("");

  modal.innerHTML = `
    <button type="button" class="modal__close">закрыть</button>
    <h2>Подать объявление</h2>
    <p class="submit-modal__lead">Проверим и выложим в каталог.</p>
    <div id="submit-form-wrap">
      <form id="listing-submit-form" class="submit-form">
        <div class="form-row"><label>Ваше имя</label><input name="contact_name" required minlength="2"></div>
        <div class="form-row"><label>Телефон</label><input name="contact_phone" type="tel" required placeholder="+996 555 123 456"></div>
        <div class="form-row"><label>Название</label><input name="title" required minlength="3"></div>
        <div class="form-row"><label>Артикул / OEM</label><input name="part_number" placeholder="27060-0H010"></div>
        <div class="form-row form-row--half">
          <div><label>Цена (сом)</label><input name="price" type="number" required min="1"></div>
          <div><label>Состояние</label><select name="condition" required><option value="used">Б/у</option><option value="new">Новое</option></select></div>
        </div>
        <div class="form-row form-row--half">
          <div><label>Категория</label><select name="category" required>${catOptions}</select></div>
          <div><label>Авто</label><input name="car" required></div>
        </div>
        <div class="form-row"><label>Подходит для (через запятую)</label><input name="fits" placeholder="Camry 40, Camry 50"></div>
        <div class="form-row"><label>Район</label><input name="location" required></div>
        <div class="form-row"><label>Комментарий</label><textarea name="notes"></textarea></div>
        <button type="submit" class="btn btn--primary btn--lg" style="width:100%;">Отправить</button>
      </form>
    </div>
    <div id="submit-success" style="display:none;"><div class="alert alert--success">Заявка отправлена.</div></div>
    <div class="submit-modal__wa messenger-row">
      <span>или</span>
      <a class="btn btn--wa btn--outline" data-whatsapp>WhatsApp</a>
      <a class="btn btn--tg btn--outline" data-telegram>Telegram</a>
    </div>
  `;

  initModals();
  await initMessengers();

  document.getElementById("listing-submit-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      if (!(await checkApi())) throw new Error("Сервер недоступен");
      await api.submitPart({
        contact_name: fd.get("contact_name"),
        contact_phone: fd.get("contact_phone"),
        title: fd.get("title"),
        part_number: fd.get("part_number") || null,
        price: parseInt(fd.get("price"), 10),
        condition: fd.get("condition"),
        category: fd.get("category"),
        car: fd.get("car"),
        fits: fd.get("fits") || null,
        location: fd.get("location"),
        notes: fd.get("notes") || null,
      });
      document.getElementById("submit-form-wrap").style.display = "none";
      document.getElementById("submit-success").style.display = "block";
      document.querySelector(".submit-modal__wa")?.style.setProperty("display", "none");
    } catch (err) {
      alert(err.message);
      btn.disabled = false;
    }
  });
}

function listingCardHTML(p) {
  const cond = p.condition === "new" ? "Новая" : "Б/У";
  const verified = p.verified
    ? `<span class="listing-card__badge badge--verified">${icon("shield", "icon icon--sm")} Проверен</span>`
    : "";
  const oem = p.part_number
    ? `<div class="listing-card__oem">Артикул: <strong>${escHtml(p.part_number)}</strong></div>`
    : "";
  return `<a href="parts.html?id=${p.id}" class="listing-card">
    <div class="listing-card__img">
      ${categoryIcon(p.category, "icon icon--xl icon--muted")}
      <span class="listing-card__badge badge--${p.condition}">${cond}</span>
      ${verified}
    </div>
    <div class="listing-card__body">
      <div class="listing-card__title">${escHtml(p.title)}</div>
      ${oem}
      <div class="listing-card__meta">${icon("part", "icon icon--sm")} ${escHtml(p.car)} · ${icon("pin", "icon icon--sm")} ${escHtml(p.location)}</div>
      <div class="listing-card__seller">${escHtml(p.seller)}</div>
      <div class="listing-card__price">${formatPrice(p.price)}</div>
    </div>
  </a>`;
}

function partDetailHTML(p) {
  const cond = p.condition === "new" ? "Новая" : "Б/У";
  const cat = getCategory(p.category);
  return `
    <article class="part-detail">
      <div class="part-detail__gallery">
        ${categoryIcon(p.category, "icon icon--xl icon--muted")}
        <span class="listing-card__badge badge--${p.condition}">${cond}</span>
      </div>
      <div class="part-detail__main">
        <h1>${escHtml(p.title)}</h1>
        <div class="part-detail__price">${formatPrice(p.price)}</div>
        ${p.part_number ? `<p class="part-detail__oem"><strong>Артикул:</strong> ${escHtml(p.part_number)}</p>` : ""}
        <p class="part-detail__meta">${escHtml(cat.name)} · ${escHtml(p.car)} · ${escHtml(p.location)}</p>
        ${p.description ? `<div class="part-detail__desc">${escHtml(p.description)}</div>` : ""}
        ${fitsChipsHTML(p.fits)}
        <div class="part-detail__seller card-box">
          <h3>Продавец</h3>
          <p><strong>${escHtml(p.seller)}</strong></p>
          ${p.phone ? `<p>${icon("chat", "icon icon--sm")} ${phoneLink(p.phone)}</p>` : ""}
          ${p.working_hours ? `<p>${icon("calendar", "icon icon--sm")} ${escHtml(p.working_hours)}</p>` : ""}
          ${p.address ? `<p>${icon("pin", "icon icon--sm")} ${escHtml(p.address)}</p>` : ""}
        </div>
        <div class="messenger-row part-detail__contacts">
          <a class="btn btn--wa" data-whatsapp>WhatsApp</a>
          <a class="btn btn--tg" data-telegram>Telegram</a>
        </div>
        <a href="parts.html" class="btn btn--outline">← К каталогу</a>
      </div>
    </article>
  `;
}

function masterCardHTML(m) {
  const initials = getInitials(m.name);
  const dist = m.distance_km != null ? `<span class="master-card__distance">${icon("pin", "icon icon--sm")} ${m.distance_km} км</span>` : "";
  const phone = m.phone ? `<span class="master-card__phone">${phoneLink(m.phone)}</span>` : "";
  const hours = m.working_hours ? `<span class="master-card__hours">${escHtml(m.working_hours)}</span>` : "";
  return `<div class="master-card">
    <div class="master-card__avatar" aria-hidden="true">${initials}<span class="master-card__avatar-badge">${icon("wrench", "icon icon--sm icon--white")}</span></div>
    <div class="master-card__info">
      <div class="master-card__head">
        <div>
          <div class="master-card__name">${escHtml(m.name)}</div>
          <div class="master-card__spec">${escHtml(m.spec)}</div>
        </div>
        <div class="master-card__rating">${icon("star", "icon icon--sm")} ${m.rating}</div>
      </div>
      <div class="master-card__meta">
        <span>${icon("calendar", "icon icon--sm")} ${escHtml(m.exp)}</span> · ${m.jobs} заказов ·
        <span>${icon("pin", "icon icon--sm")} ${escHtml(m.district)}</span> ${dist}
      </div>
      <div class="master-card__extra">${phone} ${hours}</div>
      <div class="master-card__actions">
        <a href="booking.html?master=${m.id}" class="btn btn--primary btn--sm">Записаться</a>
        <span class="master-card__from">от ${formatPrice(m.priceFrom)}</span>
      </div>
    </div>
  </div>`;
}

function renderListings(container, items) {
  if (!container) return;
  container.innerHTML = items.map(listingCardHTML).join("");
}

function renderMasters(container, items) {
  if (!container) return;
  container.innerHTML = items.map(masterCardHTML).join("");
}

function initSearch() {
  document.querySelectorAll(".search-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const q = form.querySelector("[name=q]")?.value || "";
      const type = form.querySelector("[name=type]")?.value || "parts";
      const oem = form.querySelector("[name=part_number]")?.value || "";
      if (type === "masters") {
        window.location.href = `masters.html?q=${encodeURIComponent(q)}`;
      } else {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (oem) params.set("part_number", oem);
        window.location.href = `parts.html?${params.toString()}`;
      }
    });
  });
}

function initFiltersNote() {
  const note = document.getElementById("filters-return-note");
  if (note && typeof icon === "function") {
    note.innerHTML = `${icon("return", "icon icon--sm")} Возврат запчасти — 3 дня`;
  }
}

async function initPartDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const root = document.getElementById("part-detail-root");
  if (!id || !root) return false;

  const layout = document.querySelector(".page-layout");
  if (layout) layout.style.display = "none";

  root.style.display = "block";
  root.innerHTML = "<p>Загрузка…</p>";

  let part = await loadPart(id);
  if (!part) {
    part = PARTS.find((p) => String(p.id) === String(id));
  }
  if (!part) {
    root.innerHTML = '<div class="alert alert--info">Объявление не найдено. <a href="parts.html">К каталогу</a></div>';
    return true;
  }

  document.title = `${part.title} — FTservice`;
  root.innerHTML = partDetailHTML(part);
  await initMessengers();
  return true;
}

async function initFilters() {
  if (await initPartDetail()) return;

  const grid = document.getElementById("parts-grid");
  if (!grid) return;
  initFiltersNote();

  const params = new URLSearchParams(location.search);
  const qParam = params.get("q") || "";
  const oemParam = params.get("part_number") || "";
  const carFitParam = params.get("car_fit") || "";
  const catParam = params.get("category");

  const oemInput = document.querySelector("[name=part_number_filter]");
  if (oemInput && oemParam) oemInput.value = oemParam;
  const carFitInput = document.querySelector("[name=car_fit]");
  if (carFitInput && carFitParam) carFitInput.value = carFitParam;

  if (catParam) {
    const sel = document.querySelector("[name=category]");
    if (sel) sel.value = catParam;
  }

  async function filter() {
    const cond = document.querySelector("[name=condition]:checked")?.value;
    const cat = document.querySelector("[name=category]")?.value;
    const maxVal = document.querySelector("[name=maxprice]")?.value;
    const max = maxVal ? parseInt(maxVal, 10) : undefined;
    const oem = document.querySelector("[name=part_number_filter]")?.value?.trim() || oemParam;
    const carFit = document.querySelector("[name=car_fit]")?.value?.trim() || undefined;

    let items = await loadParts({
      q: qParam || undefined,
      part_number: oem || undefined,
      car_fit: carFit,
      category: cat,
      condition: cond !== "all" ? cond : undefined,
      maxPrice: max,
    });

    if (!items) {
      const q = qParam.toLowerCase();
      items = PARTS.filter(p => {
        if (oem && !(p.part_number || "").toLowerCase().includes(oem.toLowerCase())) return false;
        if (q && !p.title.toLowerCase().includes(q) && !(p.car || "").toLowerCase().includes(q)) return false;
        if (cond && cond !== "all" && p.condition !== cond) return false;
        if (cat && cat !== "all" && p.category !== cat) return false;
        if (max && p.price > max) return false;
        return true;
      });
    }

    renderListings(grid, items);
    const count = document.getElementById("results-count");
    if (count) count.textContent = items.length;
  }

  document.querySelectorAll(".filters select, .filters input").forEach(el => {
    el.addEventListener("change", filter);
    el.addEventListener("input", filter);
  });
  await filter();
}

async function initMastersPage() {
  const list = document.getElementById("masters-list");
  if (!list) return;

  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";
  const statusEl = document.getElementById("masters-gps-status");

  async function loadAndRender(geoParams) {
    let items = await loadMasters({ q, ...geoParams });
    if (!items) {
      const ql = q.toLowerCase();
      items = MASTERS.filter(m =>
        !ql || m.name.toLowerCase().includes(ql) || m.spec.toLowerCase().includes(ql)
      );
    }
    renderMasters(list, items);
    if (statusEl && geoParams?.lat != null) {
      statusEl.textContent = items.length
        ? `Найдено мастеров рядом: ${items.length}`
        : "Рядом мастеров не найдено — показан полный список";
    }
  }

  await loadAndRender({});

  document.getElementById("btn-nearby-masters")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Геолокация недоступна в этом браузере");
      return;
    }
    if (statusEl) statusEl.textContent = "Определяем местоположение…";
    navigator.geolocation.getCurrentPosition(
      async pos => {
        await loadAndRender({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radius_km: 20,
        });
      },
      () => {
        if (statusEl) statusEl.textContent = "";
        alert("Не удалось получить GPS. Разрешите доступ к геолокации.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}

function initTimeSlots() {
  document.querySelectorAll(".time-slot").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".time-slot").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
}

function initBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const params = new URLSearchParams(location.search);
  const masterId = params.get("master");
  if (masterId) {
    const sel = form.querySelector("[name=master]");
    if (sel) sel.value = masterId;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const timeBtn = document.querySelector(".time-slot.selected");
    const timeStr = timeBtn?.textContent?.trim() || "10:00";
    const payload = {
      master_id: parseInt(fd.get("master"), 10),
      service: fd.get("service"),
      booking_date: fd.get("date"),
      booking_time: timeStr.length === 5 ? `${timeStr}:00` : timeStr,
      phone: fd.get("phone"),
      problem: fd.get("problem") || null,
    };

    const ok = document.getElementById("booking-success");
    try {
      if (!(await checkApi())) {
        alert("Сервис временно недоступен. Попробуйте позже.");
        return;
      }
      if (!getToken()) {
        const next = encodeURIComponent("booking.html" + location.search);
        location.href = `login.html?next=${next}`;
        return;
      }
      await api.createBooking(payload);
      if (ok) {
        form.style.display = "none";
        ok.style.display = "block";
      }
    } catch (err) {
      alert(err.message || "Ошибка записи");
    }
  });
}

function setActiveNav() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(a => {
    const href = a.getAttribute("href");
    a.classList.toggle("active", href === page);
  });
}

function initHeroIllus() {
  const el = document.getElementById("hero-illus");
  if (el) el.innerHTML = heroIllustration();
}

function initDiagnosticIcon() {
  const el = document.getElementById("diagnostic-icon");
  if (el) el.innerHTML = icon("diagnostic", "icon icon--lg");
}

function initHelpIcons() {
  const map = { buyers: "buyer", sellers: "seller", masters: "master" };
  document.querySelectorAll(".help-section-card").forEach(card => {
    const href = card.getAttribute("href") || "";
    const key = Object.keys(map).find(k => href.includes(k));
    const box = card.querySelector(".help-section-card__icon");
    if (box && key) box.innerHTML = icon(map[key], "icon icon--lg");
  });
}

function initInfoList() {
  const list = document.getElementById("info-list");
  if (!list) return;
  const icons = ["price", "shield", "return", "chat", "master", "truck"];
  list.querySelectorAll("li").forEach((li, i) => {
    const inner = li.innerHTML;
    li.innerHTML = `<span class="info-list__icon">${icon(icons[i] || "part", "icon icon--md")}</span><span>${inner}</span>`;
  });
}

async function initCategories() {
  const cats = document.getElementById("categories");
  if (!cats) return;
  const list = (await loadCategories()) || CATEGORIES;
  cats.innerHTML = list.map(c =>
    `<a href="parts.html?category=${c.id}" class="cat-card">
      <div class="cat-card__icon-wrap">${categoryIcon(c.id)}</div>
      <div class="cat-card__name">${c.name}</div>
    </a>`
  ).join("");
}

async function initHomeData() {
  const partsEl = document.getElementById("featured-parts");
  const mastersEl = document.getElementById("featured-masters");
  const parts = (await loadParts({})) || PARTS;
  const masters = (await loadMasters()) || MASTERS;
  if (partsEl) renderListings(partsEl, parts.slice(0, 4));
  if (mastersEl) renderMasters(mastersEl, masters.slice(0, 3));

  const stats = document.querySelector(".hero__stats");
  if (stats) {
    const nums = stats.querySelectorAll("strong");
    if (nums[0]) nums[0].textContent = String(masters.length);
    if (nums[2] && parts.length) nums[2].textContent = parts.length >= 100 ? "100+" : String(parts.length);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  initModals();
  await initMessengers();
  initSearch();
  await initFilters();
  await initMastersPage();
  initTimeSlots();
  initBookingForm();
  setActiveNav();
  await initCategories();
  initHeroIllus();
  initDiagnosticIcon();
  initInfoList();
  initHelpIcons();
  await initHomeData();
  await initSubmitListingModal();
});
