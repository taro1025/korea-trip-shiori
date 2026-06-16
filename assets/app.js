const data = window.TRIP_DATA;
const $ = (selector) => document.querySelector(selector);
const EARTH_RADIUS = 6378137;
const MAX_NAVER_WAYPOINTS = 5;
const MAX_NAVER_ROUTE_STOPS = MAX_NAVER_WAYPOINTS + 2;

function mapUrl(item) {
  if (!item.to) return naverSearchUrl(item.from);
  return naverRouteUrl([item.from, item.to], item.mode);
}

function naverSearchUrl(placeName) {
  const place = data.places[placeName];
  return `https://map.naver.com/p/search/${encode(place?.name || placeName)}`;
}

function naverRouteUrl(stops, mode) {
  const points = stops.map(naverPoint).join("/");
  return `https://map.naver.com/p/directions/${points}/-/${naverMode(mode)}?c=12.00,0,0,0,dh`;
}

function naverPoint(placeName) {
  const place = placeInfo(placeName);
  const { x, y } = mercator(place);
  return `${x.toFixed(7)},${y.toFixed(7)},${encode(place.name)},0,PLACE_POI`;
}

function mercator({ lat, lng }) {
  const x = (EARTH_RADIUS * lng * Math.PI) / 180;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (EARTH_RADIUS * Math.log((1 + sin) / (1 - sin))) / 2;
  return { x, y };
}

function placeInfo(placeName) {
  const place = data.places[placeName];
  if (!place) throw new Error(`${placeName} のNaver Map座標がありません`);
  return place;
}

function naverMode(mode) {
  return { driving: "car", transit: "transit", walking: "walk" }[mode] || "transit";
}

function routeStops(events) {
  const stops = events.flatMap((item) => [item.from, item.to].filter(Boolean));
  return stops.filter((stop, index) => stop !== stops[index - 1]);
}

function routeChunks(events) {
  const stops = routeStops(events);
  const chunks = [];
  for (let start = 0; start < stops.length - 1; start += MAX_NAVER_ROUTE_STOPS - 1) {
    chunks.push(stops.slice(start, start + MAX_NAVER_ROUTE_STOPS));
  }
  return chunks.filter((chunk) => chunk.length > 1);
}

function routeHint(events) {
  if (routeChunks(events).length > 1) {
    return "Naver Mapの経由地上限に合わせて分割。現在地ではなく予定地点から開きます。";
  }
  return "Naver Mapで開きます。現在地ではなく、この日の最初の予定地点から開きます。";
}

function dayRouteMode(events) {
  const routes = events.filter((item) => item.to);
  if (routes.every((item) => item.mode === "driving")) return "driving";
  return "transit";
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
  return `<a class="route-link" href="${mapUrl(item)}" target="_blank" rel="noreferrer">Naver Mapで見る</a>`;
}

function renderDayRouteAll(events) {
  const list = $("#dayRouteAllList");
  const chunks = routeChunks(events);
  list.innerHTML = "";
  list.hidden = chunks.length === 0;
  chunks.forEach((chunk, index) => list.appendChild(dayRouteAllLink(chunk, index, chunks.length, dayRouteMode(events))));
  $("#dayRouteHint").textContent = routeHint(events);
}

function dayRouteAllLink(stops, index, total, mode) {
  const link = document.createElement("a");
  link.className = "day-route-all";
  link.href = naverRouteUrl(stops, mode);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = dayRouteAllLabel(index, total);
  return link;
}

function dayRouteAllLabel(index, total) {
  if (total === 1) return "1日分をNaver Mapで見る";
  return `Naver Mapで見る ${index + 1}/${total}`;
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
