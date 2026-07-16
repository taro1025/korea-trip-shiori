const data = window.TRIP_DATA;
const $ = (selector) => document.querySelector(selector);
const DAY_DATES = ["2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19", "2026-07-20"];
const KIND_ICON = { transit: "🚇", walking: "🚶", driving: "🚗", clinic: "🏥", meal: "🍽", care: "💆", lodge: "🏨", sight: "📸" };
const KIND_COLOR = { move: "var(--teal)", clinic: "var(--red)", meal: "var(--gold)", care: "#8a63d2", lodge: "#7a828f", sight: "#2c8a4a" };
let currentDay = null;
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
  currentDay = day;
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
  const nowIndex = isViewingToday() ? currentSlotIndex(events) : -1;
  events.forEach((item, index) => list.appendChild(timelineItem(item, index === nowIndex)));
  renderNowBar(events, nowIndex);
}

function timelineItem(item, isNow) {
  const li = document.createElement("li");
  const kind = eventKind(item);
  li.dataset.kind = kind;
  li.style.setProperty("--kind", KIND_COLOR[kind] || "var(--line)");
  if (isNow) li.classList.add("is-now");
  li.innerHTML = timelineHtml(item, kind, isNow);
  return li;
}

function timelineHtml(item, kind, isNow) {
  const move = item.move ? `<span class="move">${item.move}</span>` : "";
  const nowPill = isNow ? '<span class="now-pill">今ここ</span>' : "";
  const icon = `<span class="ev-ic" aria-hidden="true">${kindIcon(item, kind)}</span>`;
  return `<time>${item.time}</time><div><h4>${icon}${item.title}${nowPill}</h4><p>${item.detail}</p>${move}${routeLink(item)}</div>`;
}

function kindIcon(item, kind) {
  if (kind === "move") return KIND_ICON[item.mode] || "🚇";
  return KIND_ICON[kind] || "📍";
}

function eventKind(item) {
  if (item.to) return "move";
  const text = `${item.title} ${item.detail}`;
  if (/クリニック|整形|施術|受付|プロミス/.test(text)) return "clinic";
  if (/美容院|マッサージ|チムジルバン|ジムジル/.test(text)) return "care";
  if (/食|居酒屋|カフェ|市場|ラーメン|屋台|ブランチ|ポチャ/.test(text)) return "meal";
  if (/起床|準備|チェックイン|チェックアウト|宿|帰還|休養|就寝/.test(text)) return "lodge";
  return "sight";
}

function isViewingToday() {
  return currentDay && currentDay.id === tripTodayId();
}

function tripTodayId() {
  const index = DAY_DATES.indexOf(todayIso());
  return index >= 0 ? data.days[index].id : null;
}

function todayIso() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function toMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function currentSlotIndex(events) {
  const now = nowMinutes();
  let index = -1;
  events.forEach((item, i) => {
    if (toMinutes(item.time) <= now) index = i;
  });
  return index;
}

function renderNowBar(events, nowIndex) {
  const bar = $("#nowBar");
  if (!isViewingToday()) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  bar.innerHTML = nowBarHtml(events[nowIndex], events[nowIndex + 1]);
}

function nowBarHtml(current, next) {
  const now = current
    ? `<span class="now-bar__seg"><b>今</b>${current.time} ${current.title}</span>`
    : '<span class="now-bar__seg"><b>本日</b>まもなく開始</span>';
  const upcoming = next
    ? `<span class="now-bar__seg now-bar__seg--next"><b>次</b>${next.time} ${next.title}</span>`
    : '<span class="now-bar__seg now-bar__seg--next"><b>次</b>本日は終了</span>';
  return now + upcoming;
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
  heading.innerHTML = "<span>Clinic Plan</span><h4>施術する人のスケジュール</h4>";
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

function renderCheckList(selector, items, storeKey) {
  const list = $(selector);
  list.innerHTML = "";
  items.forEach((text) => list.appendChild(checkItem(text, storeKey)));
}

function checkItem(text, storeKey) {
  const li = document.createElement("li");
  const key = `check:${storeKey}:${text}`;
  const done = readStore(key) === "1";
  li.className = done ? "is-done" : "";
  li.innerHTML = `<label><input type="checkbox" ${done ? "checked" : ""} /><span>${text}</span></label>`;
  const box = li.querySelector("input");
  box.addEventListener("change", () => toggleCheck(li, box, key));
  return li;
}

function toggleCheck(li, box, key) {
  li.classList.toggle("is-done", box.checked);
  if (box.checked) writeStore(key, "1");
  else removeStore(key);
}

function renderEmergency() {
  const bar = $("#emergencyBar");
  if (!bar || !data.emergency) return;
  bar.innerHTML = "";
  data.emergency.forEach(([label, num]) => bar.appendChild(emergencyChip(label, num)));
}

function emergencyChip(label, num) {
  const link = document.createElement("a");
  link.className = "emergency-chip";
  link.href = `tel:${num}`;
  link.innerHTML = `<span class="emergency-chip__label">${label}</span><span class="emergency-chip__num">${num}</span>`;
  return link;
}

function initHotel() {
  const address = $("#hotelAddress");
  const map = $("#hotelMap");
  const copy = $("#copyHotel");
  if (map) map.href = `https://map.naver.com/p/search/${encode("서강로9길 30")}`;
  if (copy && address) copy.addEventListener("click", () => copyText(address.textContent.trim(), copy));
}

function copyText(text, button) {
  const label = button.textContent;
  navigator.clipboard?.writeText(text).then(() => flashButton(button, label, "コピーしました"));
}

function flashButton(button, label, message) {
  button.textContent = message;
  setTimeout(() => (button.textContent = label), 1500);
}

function initLodging() {
  const form = $("#lodgingAuth");
  if (!form || !data.lodging) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    unlockLodging();
  });
}

async function unlockLodging() {
  const id = $("#lodgingId").value.trim();
  const pw = $("#lodgingPw").value;
  try {
    revealLodging(await decryptLodging(`${id}:${pw}`));
  } catch (error) {
    $("#lodgingError").hidden = false;
  }
}

function revealLodging(html) {
  $("#lodgingContent").innerHTML = html;
  $("#lodgingContent").hidden = false;
  $("#lodgingAuth").hidden = true;
}

async function decryptLodging(passphrase) {
  const raw = Uint8Array.from(atob(data.lodging.cipher), (ch) => ch.charCodeAt(0));
  const key = await lodgingKey(passphrase, raw.slice(0, 16));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(16, 28) }, key, raw.slice(28));
  return new TextDecoder().decode(plain);
}

async function lodgingKey(passphrase, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const params = { name: "PBKDF2", salt, iterations: data.lodging.iterations, hash: "SHA-256" };
  return crypto.subtle.deriveKey(params, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
}

function initQuickbar() {
  const route = $("#qbRoute");
  if (route) route.addEventListener("click", openTodayRoute);
}

function openTodayRoute() {
  const todayId = tripTodayId();
  if (todayId && currentDay && currentDay.id !== todayId) showDay(todayId);
  const routes = $("#dayRoutes");
  if (!routes) return;
  routes.open = true;
  routes.scrollIntoView({ behavior: "smooth", block: "center" });
}

function initTheme() {
  const saved = readStore("theme");
  if (saved) document.documentElement.dataset.theme = saved;
  const button = $("#themeToggle");
  if (!button) return;
  updateThemeIcon(button);
  button.addEventListener("click", () => toggleTheme(button));
}

function toggleTheme(button) {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  writeStore("theme", next);
  updateThemeIcon(button);
}

function currentTheme() {
  if (document.documentElement.dataset.theme) return document.documentElement.dataset.theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeIcon(button) {
  button.textContent = currentTheme() === "dark" ? "☀️" : "🌙";
}

function readStore(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    /* localStorage 不可でも動作は継続 */
  }
}

function removeStore(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    /* localStorage 不可でも動作は継続 */
  }
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
  initTheme();
  renderTabs();
  initInfoTabs();
  renderFacts();
  renderMemos();
  renderEmergency();
  initHotel();
  initLodging();
  initQuickbar();
  renderCheckList("#checkList", data.checkList, "pack");
  renderCheckList("#todoList", data.todoList, "prep");
  renderWantList();
  renderOpenTodos();
  showDay(tripTodayId() || data.days[0].id);
  window.setInterval(refreshNow, 60000);
}

function refreshNow() {
  if (currentDay) renderTimeline(currentDay.events);
}

init();
