const data = window.TRIP_DATA;
const $ = (selector) => document.querySelector(selector);
const MAX_NAVER_WAYPOINTS = 5;
const MAX_NAVER_ROUTE_STOPS = MAX_NAVER_WAYPOINTS + 2;
const NAVER_APP_NAME = "https://taro1025.github.io/korea-trip-shiori/";

function mapUrl(item) {
  if (!item.to) return naverSearchUrl(item.from);
  return naverRouteUrl([item.from, item.to], item.mode);
}

function linkUrl(url) {
  if (url.startsWith("nmap://") && isAndroid()) return androidIntentUrl(url);
  return url;
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function androidIntentUrl(url) {
  const intentPath = url.replace("nmap://", "intent://");
  return `${intentPath}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end`;
}

function naverSearchUrl(placeName) {
  const place = data.places[placeName];
  return `https://map.naver.com/p/search/${encode(place?.name || placeName)}`;
}

function naverRouteUrl(stops, mode) {
  const path = naverRoutePath(mode);
  const params = naverRouteParams(stops);
  return `nmap://${path}?${params.toString()}`;
}

function naverRoutePath(mode) {
  return { driving: "route/car", transit: "route/public", walking: "route/walk" }[mode] || "route/public";
}

function naverRouteParams(stops) {
  const places = stops.map(placeInfo);
  const params = new URLSearchParams({ appname: NAVER_APP_NAME });
  setNaverEndpoint(params, "s", places[0]);
  setNaverEndpoint(params, "d", places[places.length - 1]);
  places.slice(1, -1).forEach((place, index) => setNaverEndpoint(params, `v${index + 1}`, place));
  return params;
}

function setNaverEndpoint(params, prefix, place) {
  params.set(`${prefix}lat`, String(place.lat));
  params.set(`${prefix}lng`, String(place.lng));
  params.set(`${prefix}name`, place.name);
}

function placeInfo(placeName) {
  const place = data.places[placeName];
  if (!place) throw new Error(`${placeName} のNaver Map座標がありません`);
  return place;
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
    return "Naver Mapアプリで開きます。経由地上限に合わせて分割しています。";
  }
  return "Naver Mapアプリで開きます。現在地ではなく、この日の最初の予定地点から開きます。";
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

function initInfoTabs() {
  const tabs = document.querySelectorAll(".info-tab");
  tabs.forEach((tab) => tab.addEventListener("click", () => showInfoPanel(tab.dataset.panel)));
  initInfoLinks();
  showInfoPanel(defaultInfoPanel(tabs));
}

function defaultInfoPanel(tabs) {
  return [...tabs].find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.panel;
}

function initInfoLinks() {
  document.querySelectorAll("[data-info-panel]").forEach((link) => {
    link.addEventListener("click", () => showInfoPanel(link.dataset.infoPanel));
  });
}

function showInfoPanel(panelId) {
  if (!panelId) return;
  document.querySelectorAll(".info-panel").forEach((panel) => {
    panel.hidden = panel.id !== panelId;
  });
  updateInfoTabs(panelId);
}

function updateInfoTabs(panelId) {
  document.querySelectorAll(".info-tab").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.panel === panelId));
  });
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
  const url = mapUrl(item);
  return `<a class="route-link" href="${linkUrl(url)}"${routeAttrs(url)}>Naver Mapで見る</a>`;
}

function routeAttrs(url) {
  if (!url.startsWith("https://")) return "";
  return ' target="_blank" rel="noreferrer"';
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
  link.href = linkUrl(naverRouteUrl(stops, mode));
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
  link.href = linkUrl(mapUrl(item));
  setExternalAttrs(link);
  link.innerHTML = `<strong>${item.time} ${routeName(item)}</strong><span>${item.move || modeLabel(item.mode)}</span>`;
  return link;
}

function setExternalAttrs(link) {
  if (link.href.startsWith("https://")) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }
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
  initInfoTabs();
  renderFacts();
  renderMemos();
  renderSimpleList("#checkList", data.checkList);
  renderSimpleList("#todoList", data.todoList);
  renderWantList();
  renderOpenTodos();
  showDay(data.days[0].id);
}

init();
