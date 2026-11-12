import { mkdir, writeFile } from "node:fs/promises";

const outputDir = new URL("../artifacts/qa/", import.meta.url);
await mkdir(outputDir, { recursive: true });
const target = await fetch("http://127.0.0.1:9231/json/new?about:blank", { method: "PUT" }).then((response) => response.json());
if (!target.webSocketDebuggerUrl) throw new Error("Could not open an isolated Chrome page.");
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let nextId = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  const resolve = pending.get(message.id);
  if (resolve) { pending.delete(message.id); resolve(message); }
});
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message.result));
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const capture = async (name, url, width, height, mobile = true, waitMs = 900) => {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await command("Page.navigate", { url: `http://127.0.0.1:5174${url}` });
  await pause(waitMs);
  await evaluate("document.fonts.ready.then(() => window.scrollTo(0,0))");
  await pause(250);
  const details = await evaluate("JSON.stringify({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,bodyHeight:document.documentElement.scrollHeight,title:document.title,main:document.querySelector('main')?.innerText.slice(0,180),error:document.body.innerText.includes('Application error'),layoutBounds:[...document.querySelectorAll('[role=search],[aria-label=\"Danh mục điểm đến\"],[aria-label=\"Danh mục điểm đến\"] button,.sectionHeading,[aria-label=\"Điều hướng chuyến đi\"]')].map((element)=>{const rect=element.getBoundingClientRect();return{className:element.className?.baseVal??element.className,left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,overflow:rect.right>innerWidth+1||rect.left< -1||element.scrollWidth>element.clientWidth+1}})})");
  const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(new URL(name, outputDir), Buffer.from(screenshot.data, "base64"));
  return JSON.parse(details);
};

const results = [];
results.push({ view: "welcome", ...await capture("welcome-414x906.png", "/", 414, 906, true, 7600), cards: JSON.parse(await evaluate("JSON.stringify([...document.querySelectorAll('figure')].map((card)=>({className:card.className,rect:(()=>{const r=card.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})(),opacity:getComputedStyle(card).opacity,zIndex:getComputedStyle(card).zIndex})))")) });
results.push({ view: "welcome", ...await capture("welcome-390x844.png", "/", 390, 844, true, 7600) });
results.push({ view: "welcome", ...await capture("welcome-414x896.png", "/", 414, 896, true, 7600) });
await evaluate("[...document.querySelectorAll('button')].find((button) => button.innerText.includes('Bắt đầu hành trình'))?.click()");
await pause(750);
const transitionShot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(new URL("welcome-transition-750ms.png", outputDir), Buffer.from(transitionShot.data, "base64"));
await pause(1100);
results.push({ view: "welcome-transition", ...JSON.parse(await evaluate("JSON.stringify({path:location.pathname,dashboardVisible:document.body.innerText.includes('Hôm nay bạn muốn đi đâu?')})")) });
results.push({ view: "dashboard-discover", ...await capture("dashboard-414x906.png", "/home", 414, 906) });
await evaluate("[...document.querySelectorAll('button')].find((button) => button.innerText.trim() === 'Chuyến đi')?.click()");
await pause(400);
const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(new URL("trip-list-414x906.png", outputDir), Buffer.from(screenshot.data, "base64"));
results.push({ view: "trip-list", ...JSON.parse(await evaluate("JSON.stringify({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,bodyHeight:document.documentElement.scrollHeight,hasTrips:document.body.innerText.includes('Đà Lạt')})")) });
for (const [width, height] of [[360, 640], [375, 812], [390, 844], [414, 896], [414, 906], [430, 932], [768, 1024], [1280, 800], [1440, 900]]) {
  results.push({ view: "trip-detail", ...(await capture(`trip-detail-${width}x${height}.png`, "/home/trip/sample-dalat", width, height, width < 600)) });
}
results.push({ view: "trip-report", ...await capture("trip-report-414x906.png", "/home/trip/sample-dalat/report", 414, 906) });
await writeFile(new URL("visual-qa.json", outputDir), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
socket.close();
