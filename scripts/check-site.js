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
}

function run() {
  checkFiles();
  checkContent();
  checkImage();
  checkData();
  console.log("site check passed");
}

run();
