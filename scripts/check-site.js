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
  assert(html.includes("dayRouteLink"), "日別経路リンクがありません");
  assert(html.includes("wantList"), "行きたいこと回収リストがありません");
  assert(!html.includes('id="friends"'), "別行動が独立セクションに戻っています");
}

function checkImage() {
  const image = fs.statSync(path.join(root, "assets/seoul-night.jpg"));
  assert(image.size > 50000, "画像ファイルが小さすぎます");
}

function checkQuarterHours(events) {
  events.forEach((event) => {
    assert(minutes(event.time) % 15 === 0, `${event.time} が15分単位ではありません`);
  });
}

function checkRoutes(events) {
  events.forEach((event) => assert(event.from, `${event.title} の場所がありません`));
}

function checkDayRoutes(days) {
  days.forEach((day) => assert(routeStops(day.events).length > 1, `${day.date} の経路が不足`));
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
  assert(daysWithRoutes[0].id === "day4", "別行動ルートは7/19に置いてください");
}

function checkRouteUrlFormat() {
  const app = read("assets/app.js");
  assert(app.includes("google.com/maps/dir/${"), "経路URLがpath形式ではありません");
  assert(!app.includes("waypoints"), "waypoints形式が残っています");
}

function checkWantList(trip) {
  const required = ["DMZ", "サンナクジ", "ジムジルバン", "ポテンツァ", "二重整形", "美容院"];
  const text = JSON.stringify(trip);
  required.forEach((name) => assert(text.includes(name), `${name} がありません`));
  assert(trip.wantList.length >= 14, "行きたいこと回収リストが不足しています");
}

function routeStops(events) {
  const stops = events.flatMap((item) => [item.from, item.to].filter(Boolean));
  return stops.filter((stop, index) => stop !== stops[index - 1]);
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
}

function run() {
  checkFiles();
  checkContent();
  checkImage();
  checkData();
  console.log("site check passed");
}

run();
