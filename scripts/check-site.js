const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/itinerary.js",
  "assets/seoul-night.jpg",
  ".github/workflows/pages.yml",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function loadTripData() {
  global.window = {};
  require(path.join(root, "assets/itinerary.js"));
  return global.window.TRIP_DATA;
}

function minutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function checkFiles() {
  requiredFiles.forEach((file) => assert(exists(file), `${file} がありません`));
}

function checkContent() {
  const html = read("index.html");
  assert(html.includes("韓国男旅のしおり"), "タイトルがありません");
  assert(html.includes("dayTabs"), "日別タブがありません");
  assert(html.includes("infoTabs"), "旅行情報タブがありません");
  assert(html.includes("info-panel"), "旅行情報パネルがありません");
  assert(html.includes("keyFactList"), "未確定情報のTODO表示欄がありません");
  assert(html.includes("guideMemoList"), "現地メモ表示欄がありません");
  assert(html.includes("openTodoList"), "未消化Todoリストがありません");
  assert(html.includes("dayRouteAllList"), "1日分の一括経路リンクがありません");
  assert(html.includes("dayRouteList"), "日別経路リストがありません");
  assert(html.includes('<details class="day-routes"'), "日別経路が折りたたみではありません");
  assert(html.includes("wantList"), "行きたいこと回収リストがありません");
  assert(!html.includes('id="friends"'), "別行動が独立セクションに戻っています");
}

function checkImage() {
  const image = fs.statSync(path.join(root, "assets/seoul-night.jpg"));
  assert(image.size > 50000, "画像ファイルが小さすぎます");
}

function checkQuarterHours(events) {
  events.forEach((event) => {
    if (isExactTravelTime(event)) return;
    assert(minutes(event.time) % 15 === 0, `${event.time} が15分単位ではありません`);
  });
}

function isExactTravelTime(event) {
  const text = `${event.title} ${event.detail}`;
  return text.includes("成田") || text.includes("出発3時間前");
}

function checkRoutes(events) {
  events.forEach((event) => assert(event.from, `${event.title} の場所がありません`));
}

function checkDayRoutes(days) {
  days.forEach((day) => assert(day.events.some((event) => event.to), `${day.date} の移動経路が不足`));
}

function checkCasino(days) {
  const text = JSON.stringify(days);
  assert(text.includes("Paradise Casino Walkerhill"), "カジノがParadiseではありません");
  assert(!text.includes("Seven Luck"), "Seven Luckが残っています");
  assert(!text.includes("COEXカジノ"), "COEXカジノが残っています");
}

function checkFriendRoutes(days) {
  const daysWithRoutes = days.filter((day) => day.friendRoutes?.length);
  assert(daysWithRoutes.length === 1, "別行動ルートは1日だけにしてください");
  assert(daysWithRoutes[0].id === "day2", "別行動ルートは7/17に置いてください");
}

function checkRouteUrlFormat() {
  const app = read("assets/app.js");
  assert(app.includes("nmap://"), "Naver MapアプリURLではありません");
  assert(app.includes("intent://"), "Android向けNaver Map起動URLがありません");
  assert(app.includes("route/public"), "Naver公共交通経路URLではありません");
  assert(app.includes('setNaverEndpoint(params, "s"'), "Naver起点座標がありません");
  assert(app.includes('setNaverEndpoint(params, "d"'), "Naver目的地座標がありません");
  assert(app.includes("MAX_NAVER_WAYPOINTS"), "Naver Mapの経由地上限がありません");
  assert(app.includes("Naver Mapで見る"), "区間リンクがNaver Map表記ではありません");
}

function checkWantList(trip) {
  const required = ["DMZ", "サンナクジ", "ジムジルバン", "プロミス整形外科", "聖水", "美容院"];
  const text = JSON.stringify(trip);
  required.forEach((name) => assert(text.includes(name), `${name} がありません`));
  assert(trip.wantList.length >= 14, "行きたいこと回収リストが不足しています");
}

function checkClinicSchedule(trip) {
  const clinic = keyFact(trip, "施術クリニック");
  const day = trip.days.find((item) => item.id === "day2");
  const text = JSON.stringify(day);
  assert(clinic.value.includes("7/17 09:00〜13:00"), "クリニック確定時刻が不足しています");
  assert(text.includes("プロミス整形外科"), "7/17にプロミス整形外科がありません");
  assert(text.includes('"09:00"') && text.includes('"13:00"'), "クリニック滞在時間が不正です");
}

function checkTravelGuideData(trip) {
  const text = JSON.stringify(trip);
  const required = ["e-Arrival Card", "1330", "NAVER Map", "KakaoMap", "海外旅行保険"];
  required.forEach((name) => assert(text.includes(name), `${name} がありません`));
  assert(trip.keyFacts.length >= 6, "未確定情報のTODO欄が不足しています");
  assert(trip.keyFacts.some((item) => item.value === "TODO"), "未確定TODOがありません");
  checkFlightFacts(trip);
  assert(trip.guideMemos.length >= 6, "現地メモが不足しています");
  assert(trip.openTodos.length >= 3, "未消化Todoグループが不足しています");
}

function checkFlightFacts(trip) {
  const arrival = keyFact(trip, "到着便");
  const departure = keyFact(trip, "帰国便");
  assert(arrival.value.includes("12:30") && arrival.value.includes("15:10"), "到着便の時刻が不足しています");
  assert(departure.value.includes("07:25") && departure.value.includes("09:50"), "帰国便の時刻が不足しています");
}

function keyFact(trip, label) {
  const item = trip.keyFacts.find((fact) => fact.label === label);
  assert(item, `${label} がありません`);
  return item;
}

function routeStops(events) {
  const stops = events.flatMap((event) => [event.from, event.to].filter(Boolean));
  return stops.filter((stop, index) => stop !== stops[index - 1]);
}

function checkPlaceCoordinates(trip) {
  const stops = trip.days.flatMap((day) => routeStops(day.events));
  stops.forEach((stop) => assert(trip.places[stop], `${stop} のNaver Map座標がありません`));
  Object.values(trip.places).forEach((place) => assert(place.lat && place.lng, `${place.name} の座標が不正です`));
}

function checkFullDayRoutes(days) {
  days.forEach((day) => {
    const stops = routeStops(day.events);
    assert(stops.length >= 2, `${day.date} の一括経路地点が不足しています`);
  });
}

function checkData() {
  const trip = loadTripData();
  assert(trip.days.length === 5, "5日分の日程がありません");
  trip.days.forEach((day) => checkQuarterHours(day.events));
  trip.days.forEach((day) => checkRoutes(day.events));
  checkDayRoutes(trip.days);
  checkCasino(trip.days);
  checkFriendRoutes(trip.days);
  checkRouteUrlFormat();
  checkWantList(trip);
  checkTravelGuideData(trip);
  checkClinicSchedule(trip);
  checkPlaceCoordinates(trip);
  checkFullDayRoutes(trip.days);
}

function run() {
  checkFiles();
  checkContent();
  checkImage();
  checkData();
  console.log("site check passed");
}

run();
