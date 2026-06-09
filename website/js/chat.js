/** Чаты на сайте — список диалогов и переписка */

let activeConversationId = null;
let pollTimer = null;

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

async function loadConversationList() {
  const listEl = document.getElementById("chat-list");
  if (!listEl) return;

  if (!getToken()) {
    listEl.innerHTML = `<div class="chat-empty"><p>Войдите, чтобы видеть сообщения</p><a href="login.html?next=messages.html" class="btn btn--primary">Войти</a></div>`;
    return;
  }

  try {
    const items = await api.getConversations();
    if (!items.length) {
      listEl.innerHTML = `<div class="chat-empty"><p>Пока нет диалогов</p><p>Нажмите «Написать в чате» на карточке объявления</p></div>`;
      return;
    }
    listEl.innerHTML = items
      .map(
        (c) => `
      <a href="messages.html?chat=${c.id}" class="chat-item${activeConversationId == c.id ? " active" : ""}" data-id="${c.id}">
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
      </a>`
      )
      .join("");
  } catch (e) {
    listEl.innerHTML = `<div class="chat-empty">${esc(e.message)}</div>`;
  }
}

async function loadThread(convId) {
  activeConversationId = convId;
  const threadEl = document.getElementById("chat-thread");
  const msgsEl = document.getElementById("chat-messages");
  const topicEl = document.getElementById("chat-topic");
  if (!threadEl || !msgsEl) return;

  document.querySelector(".chat-layout")?.classList.add("thread-open");

  try {
    const messages = await api.getChatMessages(convId);
    const convs = await api.getConversations();
    const conv = convs.find((c) => c.id === convId);
    if (topicEl && conv) topicEl.textContent = conv.part_title;

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
    threadEl.style.display = "flex";
    await loadConversationList();
  } catch (e) {
    msgsEl.innerHTML = `<div class="chat-empty">${esc(e.message)}</div>`;
  }
}

async function sendCurrentMessage() {
  const input = document.getElementById("chat-input");
  const body = input?.value?.trim();
  if (!body || !activeConversationId) return;
  try {
    await api.sendChatMessage(activeConversationId, body);
    input.value = "";
    await loadThread(activeConversationId);
  } catch (e) {
    alert(e.message || "Не удалось отправить");
  }
}

function startPolling() {
  clearInterval(pollTimer);
  if (!activeConversationId) return;
  pollTimer = setInterval(() => {
    if (activeConversationId) loadThread(activeConversationId);
  }, 8000);
}

async function initChatPage() {
  const params = new URLSearchParams(location.search);
  const chatId = params.get("chat");
  const startPart = params.get("start");

  if (startPart && getToken()) {
    await openPartChatFromWeb(Number(startPart), "");
    return;
  }

  await loadConversationList();

  if (chatId) {
    await loadThread(Number(chatId));
    startPolling();
  }

  document.getElementById("chat-send")?.addEventListener("click", sendCurrentMessage);
  document.getElementById("chat-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCurrentMessage();
    }
  });
  document.getElementById("chat-back")?.addEventListener("click", (e) => {
    e.preventDefault();
    location.href = "messages.html";
  });
}

document.addEventListener("DOMContentLoaded", initChatPage);
