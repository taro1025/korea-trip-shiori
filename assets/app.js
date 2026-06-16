const data = window.TRIP_DATA;
const $ = (selector) => document.querySelector(selector);
const MAX_WAYPOINTS = 9;
const MAX_ROUTE_STOPS = MAX_WAYPOINTS + 2;

function mapUrl(item) {
  if (!item.to) {
    return `https://www.google.com/maps/search/?api=1&query=${encode(item.from)}`;
  }
  return directionUrl(item.from, item.to, item.mode);
}

function directionUrl(origin, destination, mode) {
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function dayRouteUrl(events) {
  const stops = routeStops(events).slice(0, MAX_ROUTE_STOPS);
  if (stops.length < 2) return mapUrl({ from: stops[0] || data.base });
  const params = new URLSearchParams({
    api: "1",
    origin: stops[0],
    destination: stops[stops.length - 1],
  });
  const waypoints = stops.slice(1, -1);
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function routeStops(events) {
  const stops = events.flatMap((item) => [item.from, item.to].filter(Boolean));
  return stops.filter((stop, index) => stop !== stops[index - 1]);
}

function routeHint(events) {
  if (routeStops(events).length > MAX_ROUTE_STOPS) {
    return `Google Mapsの上限に合わせ、最初の${MAX_ROUTE_STOPS}地点まで開きます。`;
  }
  return "現在地ではなく、この日の最初の地点から開きます。スマホで経由地が省略される場合は下の区間リンクで確認。";
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
  renderDayRouteAll(day.events);
  renderDayRoutes(day.events);
  renderNotes(day.notes);
  renderTimeline(day.events);
  renderDayExtra(day.friendRoutes || []);
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

function renderDayRouteAll(events) {
  const link = $("#dayRouteAll");
  link.href = dayRouteUrl(events);
  link.hidden = routeStops(events).length < 2;
  $("#dayRouteHint").textContent = routeHint(events);
}

function renderDayRoutes(events) {
  const routes = events.filter((item) => item.to);
  const list = $("#dayRouteList");
  list.innerHTML = "";
  routes.forEach((item) => list.appendChild(dayRouteItem(item)));
}

function dayRouteItem(item) {
  const link = document.createElement("a");
  link.href = mapUrl(item);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.innerHTML = `<strong>${item.time} ${routeName(item)}</strong><span>${item.move || modeLabel(item.mode)}</span>`;
  return link;
}

function routeName(item) {
  return `${shortPlace(item.from)} → ${shortPlace(item.to)}`;
}

function shortPlace(place) {
  return place.split(",")[0];
}

function modeLabel(mode) {
  return { driving: "車で移動", transit: "電車で移動", walking: "徒歩で移動" }[mode] || "移動";
}

function renderDayExtra(routes) {
  const extra = $("#dayExtra");
  extra.hidden = routes.length === 0;
  extra.innerHTML = "";
  if (!routes.length) return;
  extra.appendChild(extraHeading());
  routes.forEach((route) => extra.appendChild(friendCard(route)));
}

function extraHeading() {
  const heading = document.createElement("div");
  heading.className = "day-extra__heading";
  heading.innerHTML = "<span>Friend Plan</span><h4>整形中の友人別行動</h4>";
  return heading;
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

function renderWantList() {
  const list = $("#wantList");
  list.innerHTML = "";
  data.wantList.forEach((item) => list.appendChild(wantItem(item)));
}

function renderFacts() {
  const list = $("#keyFactList");
  list.innerHTML = "";
  data.keyFacts.forEach((item) => list.appendChild(factItem(item)));
}

function factItem(item) {
  const row = document.createElement("div");
  row.innerHTML = `<dt>${item.label}</dt><dd><strong>${item.value}</strong><span>${item.detail}</span></dd>`;
  return row;
}

function renderMemos() {
  const list = $("#guideMemoList");
  list.innerHTML = "";
  data.guideMemos.forEach((item) => list.appendChild(memoListItem(item)));
}

function memoListItem(item) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${item.title}</strong><span>${item.detail}</span>`;
  return li;
}

function renderOpenTodos() {
  const list = $("#openTodoList");
  list.innerHTML = "";
  data.openTodos.forEach((group) => list.appendChild(openTodoGroup(group)));
}

function openTodoGroup(group) {
  const article = document.createElement("article");
  article.className = "open-todo-card";
  article.innerHTML = `<h3>${group.category}</h3><ul>${openTodoItems(group.items)}</ul>`;
  return article;
}

function openTodoItems(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function wantItem([name, timing]) {
  const item = document.createElement("li");
  item.innerHTML = `<strong>${name}</strong><span>${timing}</span>`;
  return item;
}

function simpleItem(text) {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}

function init() {
  renderTabs();
  renderFacts();
  renderMemos();
  renderSimpleList("#checkList", data.checkList);
  renderSimpleList("#todoList", data.todoList);
  renderWantList();
  renderOpenTodos();
  showDay(data.days[0].id);
}

init();
