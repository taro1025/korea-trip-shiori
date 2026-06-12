const data = window.TRIP_DATA;
const $ = (selector) => document.querySelector(selector);

function mapUrl(item) {
  if (!item.to) {
    return `https://www.google.com/maps/search/?api=1&query=${encode(item.from)}`;
  }
  const params = new URLSearchParams({
    api: "1",
    origin: item.from,
    destination: item.to,
    travelmode: item.mode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function encode(value) {
  return encodeURIComponent(value);
}

function renderTabs() {
  const tabs = $("#dayTabs");
  tabs.innerHTML = "";
  data.days.forEach((day) => tabs.appendChild(createTab(day)));
}

function createTab(day) {
  const button = document.createElement("button");
  button.className = "day-tab";
  button.type = "button";
  button.role = "tab";
  button.dataset.dayId = day.id;
  button.textContent = `${day.label} ${day.title}`;
  button.addEventListener("click", () => showDay(day.id));
  return button;
}

function showDay(dayId) {
  const day = data.days.find((item) => item.id === dayId) || data.days[0];
  $("#dayDate").textContent = day.date;
  $("#dayTitle").textContent = day.title;
  $("#dayTheme").textContent = day.theme;
  renderNotes(day.notes);
  renderTimeline(day.events);
  updateTabs(day.id);
}

function updateTabs(dayId) {
  document.querySelectorAll(".day-tab").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.dayId === dayId));
  });
}

function renderNotes(notes) {
  const list = $("#dayNotes");
  list.innerHTML = "";
  notes.forEach((note) => list.appendChild(noteItem(note)));
}

function noteItem(note) {
  const item = document.createElement("li");
  item.textContent = note;
  return item;
}

function renderTimeline(events) {
  const list = $("#timeline");
  list.innerHTML = "";
  events.forEach((item) => list.appendChild(timelineItem(item)));
}

function timelineItem(item) {
  const li = document.createElement("li");
  li.innerHTML = timelineHtml(item);
  return li;
}

function timelineHtml(item) {
  const move = item.move ? `<span class="move">${item.move}</span>` : "";
  return `<time>${item.time}</time><div><h4>${item.title}</h4><p>${item.detail}</p>${move}${routeLink(item)}</div>`;
}

function routeLink(item) {
  return `<a class="route-link" href="${mapUrl(item)}" target="_blank" rel="noreferrer">Google Mapsで見る</a>`;
}

function renderFriendRoutes() {
  const grid = $("#friendRoutes");
  grid.innerHTML = "";
  data.friendRoutes.forEach((route) => grid.appendChild(friendCard(route)));
}

function friendCard(route) {
  const article = document.createElement("article");
  article.className = "friend-card";
  article.innerHTML = `<h3>${route.title}</h3><p>${route.merit}</p><ol>${friendSteps(route.steps)}</ol>`;
  return article;
}

function friendSteps(steps) {
  return steps.map((step) => `<li>${stepHtml(step)}</li>`).join("");
}

function stepHtml(step) {
  const move = step.move ? `<span>${step.move}</span>` : "";
  return `<time>${step.time}</time><strong>${step.title}</strong><p>${step.detail}</p>${move}${routeLink(step)}`;
}

function renderSimpleList(selector, items) {
  const list = $(selector);
  list.innerHTML = "";
  items.forEach((text) => list.appendChild(simpleItem(text)));
}

function simpleItem(text) {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}

function init() {
  renderTabs();
  renderFriendRoutes();
  renderSimpleList("#checkList", data.checkList);
  renderSimpleList("#todoList", data.todoList);
  showDay(data.days[0].id);
}

init();
