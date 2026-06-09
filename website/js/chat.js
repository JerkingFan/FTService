/** Чаты на сайте — список диалогов и переписка */

let activeConversationId = null;
let pollTimer = null;
let listPollTimer = null;
let lastMessageCount = 0;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function formatChatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatMsgTime(iso) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sameId(a, b) {
  return Number(a) === Number(b);
}

async function ensureChatAuth() {
  if (typeof refreshSession === "function") {
    return !!(await refreshSession());
  }
  if (!getToken()) return false;
  try {
    await api.me();
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

function updateAccountBanner(user) {
  const el = document.getElementById("chat-account");
  if (!el) return;

  if (!user) {
    el.innerHTML = `<div class="alert alert--info">Войдите в аккаунт, чтобы видеть переписку. <a href="login.html?next=messages.html">Войти</a></div>`;
    return;
  }

  let hint = "Покупатель — здесь ваши диалоги с продавцами.";
  if (user.role === "seller") {
    hint = "Продавец — сюда приходят сообщения от покупателей по вашим объявлениям.";
    document.querySelector(".chat-page .section__title")?.replaceChildren(document.createTextNode("Сообщения покупателей"));
  } else if (user.role === "master") {
    hint = "Чаты по запчастям доступны аккаунту продавца. Если вы продаёте запчасти — войдите как продавец.";
  }

  el.innerHTML = `<div class="chat-account__bar"><strong>${esc(user.full_name)}</strong> · ${esc(user.email)}<span>${hint}</span></div>`;
}

async function openPartChatFromWeb(partId, partTitle) {
  if (!getToken()) {
    location.href = `login.html?next=${encodeURIComponent(`messages.html?start=${partId}`)}`;
    return;
  }
  try {
    const msg = partTitle ? `Здравствуйте! Интересует: ${partTitle}` : undefined;
    const conv = await api.startConversation(partId, msg);
    location.href = `messages.html?chat=${conv.id}`;
  } catch (e) {
    alert(e.message || "Не удалось открыть чат");
  }
}

function renderConversationList(items) {
  const listEl = document.getElementById("chat-list");
  if (!listEl) return;

  if (!items.length) {
    const user = getCurrentUser();
    let emptyHint = "Нажмите «Написать в чате» на карточке объявления.";
    if (user?.role === "seller") {
      emptyHint = "Когда покупатель напишет по объявлению, диалог появится здесь.";
    } else if (user?.role === "master") {
      emptyHint = "У кабинета мастера нет чатов по запчастям. Войдите как продавец (seller@test.kg).";
    }
    listEl.innerHTML = `<div class="chat-empty"><p>Пока нет диалогов</p><p>${emptyHint}</p></div>`;
    return;
  }

  listEl.innerHTML = items
    .map(
      (c) => `
      <button type="button" class="chat-item${sameId(activeConversationId, c.id) ? " active" : ""}" data-id="${c.id}">
        <div class="chat-item__avatar">
          ${c.part_image_url ? `<img src="${esc(c.part_image_url)}" alt="">` : "📦"}
        </div>
        <div class="chat-item__body">
          <div class="chat-item__top">
            <span class="chat-item__name">${esc(c.peer_name)}</span>
            <span class="chat-item__time">${formatChatTime(c.last_message_at)}</span>
          </div>
          <div class="chat-item__part">${esc(c.part_title)}</div>
          <div class="chat-item__preview">${esc(c.last_message || "Нет сообщений")}</div>
        </div>
        ${c.unread_count > 0 ? `<span class="chat-item__badge">${c.unread_count > 9 ? "9+" : c.unread_count}</span>` : ""}
      </button>`
    )
    .join("");
}

async function loadConversationList() {
  const listEl = document.getElementById("chat-list");
  if (!listEl) return [];

  if (!getToken()) {
    listEl.innerHTML = `<div class="chat-empty"><p>Войдите, чтобы видеть сообщения</p><a href="login.html?next=messages.html" class="btn btn--primary">Войти</a></div>`;
    return [];
  }

  try {
    const items = await api.getConversations();
    renderConversationList(items);
    return items;
  } catch (e) {
    listEl.innerHTML = `<div class="chat-empty"><p>Ошибка загрузки: ${esc(e.message)}</p><button type="button" class="btn btn--outline btn--sm" id="chat-retry">Повторить</button></div>`;
    document.getElementById("chat-retry")?.addEventListener("click", () => initChatPage());
    return [];
  }
}

function renderMessages(messages) {
  const msgsEl = document.getElementById("chat-messages");
  if (!msgsEl) return;

  msgsEl.innerHTML = messages.length
    ? messages
        .map(
          (m) => `
        <div class="chat-bubble ${m.is_mine ? "chat-bubble--mine" : "chat-bubble--theirs"}">
          ${esc(m.body)}
          <span class="chat-bubble__time">${formatMsgTime(m.created_at)}</span>
        </div>`
        )
        .join("")
    : `<div class="chat-empty">Напишите первое сообщение</div>`;

  msgsEl.scrollTop = msgsEl.scrollHeight;
  lastMessageCount = messages.length;
}

function showThreadPanel(show) {
  const threadEl = document.getElementById("chat-thread");
  const layout = document.querySelector(".chat-layout");
  if (!threadEl) return;
  threadEl.style.display = show ? "flex" : "none";
  layout?.classList.toggle("thread-open", show);
}

function showThreadPlaceholder() {
  const msgsEl = document.getElementById("chat-messages");
  const topicEl = document.getElementById("chat-topic");
  if (topicEl) topicEl.textContent = "";
  if (msgsEl) {
    msgsEl.innerHTML = `<div class="chat-empty chat-empty--pick"><p>Выберите диалог слева</p><p>или дождитесь нового сообщения от покупателя</p></div>`;
  }
  showThreadPanel(true);
}

async function loadThread(convId, { silent = false } = {}) {
  activeConversationId = convId;
  const threadEl = document.getElementById("chat-thread");
  const msgsEl = document.getElementById("chat-messages");
  const topicEl = document.getElementById("chat-topic");
  if (!threadEl || !msgsEl) return;

  showThreadPanel(true);
  if (!silent) {
    msgsEl.innerHTML = `<div class="chat-empty">Загрузка…</div>`;
  }

  try {
    const [messages, convs] = await Promise.all([
      api.getChatMessages(convId),
      api.getConversations(),
    ]);
    const conv = convs.find((c) => sameId(c.id, convId));
    if (topicEl && conv) {
      topicEl.textContent = `${conv.part_title} · ${conv.peer_name}`;
    }

    if (silent && messages.length === lastMessageCount) {
      renderConversationList(convs);
      return;
    }

    renderMessages(messages);
    renderConversationList(convs);
  } catch (e) {
    msgsEl.innerHTML = `<div class="chat-empty"><p>${esc(e.message)}</p><button type="button" class="btn btn--outline btn--sm" id="chat-thread-retry">Повторить</button></div>`;
    document.getElementById("chat-thread-retry")?.addEventListener("click", () => loadThread(convId));
  }
}

async function sendCurrentMessage() {
  const input = document.getElementById("chat-input");
  const body = input?.value?.trim();
  if (!body || !activeConversationId) return;
  const btn = document.getElementById("chat-send");
  if (btn) btn.disabled = true;
  try {
    await api.sendChatMessage(activeConversationId, body);
    input.value = "";
    await loadThread(activeConversationId);
  } catch (e) {
    alert(e.message || "Не удалось отправить");
  } finally {
    if (btn) btn.disabled = false;
  }
}

function pickDefaultConversation(items, chatId) {
  if (chatId && items.some((c) => sameId(c.id, chatId))) {
    return Number(chatId);
  }
  if (!items.length) return null;
  const unread = items.find((c) => c.unread_count > 0);
  return unread ? unread.id : items[0].id;
}

function startPolling() {
  clearInterval(pollTimer);
  clearInterval(listPollTimer);

  pollTimer = setInterval(() => {
    if (activeConversationId) loadThread(activeConversationId, { silent: true });
  }, 4000);

  listPollTimer = setInterval(async () => {
    if (!getToken()) return;
    const items = await loadConversationList();
    if (!activeConversationId && items.length) {
      const next = pickDefaultConversation(items, null);
      if (next) {
        history.replaceState(null, "", `messages.html?chat=${next}`);
        await loadThread(next);
      }
    }
  }, 12000);
}

function bindChatEvents() {
  if (bindChatEvents.done) return;
  bindChatEvents.done = true;
  document.getElementById("chat-list")?.addEventListener("click", (e) => {
    const item = e.target.closest(".chat-item");
    if (!item) return;
    const id = Number(item.dataset.id);
    if (!id) return;
    history.pushState(null, "", `messages.html?chat=${id}`);
    loadThread(id);
    startPolling();
  });

  document.getElementById("chat-send")?.addEventListener("click", sendCurrentMessage);
  document.getElementById("chat-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCurrentMessage();
    }
  });
  document.getElementById("chat-back")?.addEventListener("click", (e) => {
    e.preventDefault();
    activeConversationId = null;
    showThreadPanel(false);
    history.pushState(null, "", "messages.html");
    loadConversationList();
  });

  window.addEventListener("popstate", () => {
    const chatId = new URLSearchParams(location.search).get("chat");
    if (chatId) {
      loadThread(Number(chatId));
      startPolling();
    } else {
      activeConversationId = null;
      showThreadPanel(false);
      loadConversationList();
    }
  });
}

async function initChatPage() {
  if (!document.getElementById("chat-list")) return;

  bindChatEvents();

  const params = new URLSearchParams(location.search);
  const chatId = params.get("chat");
  const startPart = params.get("start");

  if (startPart) {
    const authed = await ensureChatAuth();
    if (authed) {
      await openPartChatFromWeb(Number(startPart), "");
    }
    return;
  }

  const authed = await ensureChatAuth();
  updateAccountBanner(authed ? getCurrentUser() : null);

  if (!authed) {
    document.getElementById("chat-list").innerHTML =
      `<div class="chat-empty"><p>Войдите, чтобы видеть сообщения</p><a href="login.html?next=messages.html" class="btn btn--primary">Войти</a></div>`;
    showThreadPanel(false);
    return;
  }

  const items = await loadConversationList();
  const convId = pickDefaultConversation(items, chatId);

  if (convId) {
    if (!chatId) {
      history.replaceState(null, "", `messages.html?chat=${convId}`);
    }
    await loadThread(convId);
    startPolling();
  } else {
    showThreadPlaceholder();
  }
}

document.addEventListener("DOMContentLoaded", initChatPage);
