import { writeFile } from "node:fs/promises";

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const route = process.argv[2] ?? "/home";
const outputPath = process.argv[3] ?? "D:/Project/TripNoteV2/artifacts/final-dashboard-360x640.png";
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("Dashboard tab not found");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  const resolve = pending.get(message.id);
  if (resolve) {
    pending.delete(message.id);
    resolve(message.result);
  }
});
const command = (method, params = {}) => new Promise((resolve) => {
  const commandId = ++id;
  pending.set(commandId, resolve);
  socket.send(JSON.stringify({ id: commandId, method, params }));
});

await command("Emulation.setDeviceMetricsOverride", { width: 360, height: 640, deviceScaleFactor: 1, mobile: true });
await command("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
if (!target.url.endsWith(route)) await command("Page.navigate", { url: `http://127.0.0.1:5173${route}` });
await new Promise((resolve) => setTimeout(resolve, 2000));
const geometry = await command("Runtime.evaluate", { expression: "JSON.stringify((() => { const b=document.querySelector('[class*=brand]'); const s=b?.querySelector('strong'); const c=s&&getComputedStyle(s); return { viewport:[innerWidth,innerHeight], brand:b?.outerHTML, bounds:b?.getBoundingClientRect().toJSON(), color:c?.color, opacity:c?.opacity, visibility:c?.visibility, display:c?.display, z:c?.zIndex, headerActions:document.querySelector('[class*=headerActions]')?.getBoundingClientRect().toJSON() }; })())", returnByValue: true });
console.log(geometry.result.value);
const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
socket.close();
