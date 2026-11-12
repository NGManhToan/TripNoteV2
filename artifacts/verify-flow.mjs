import { writeFile } from "node:fs/promises";

const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = pages.find((entry) => entry.type === "page");
if (!target) throw new Error("Local app tab not found");

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
const evaluate = async (expression) => {
  const response = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
};
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await command("Emulation.setDeviceMetricsOverride", { width: 360, height: 640, deviceScaleFactor: 1, mobile: true });
await command("Page.navigate", { url: "http://127.0.0.1:5173/" });
await pause(900);
await evaluate("document.querySelector('button[class*=start]')?.click()");
await pause(1900);
const destinationRoute = await evaluate("location.pathname");
await evaluate("document.querySelector('[class*=cardOpen]')?.click()");
await pause(600);
const destinationSheet = await evaluate("document.body.innerText.includes('Vịnh Hạ Long') && document.body.innerText.includes('Tạo kế hoạch chuyến đi')");
const sheetScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile("D:/Project/TripNoteV2/artifacts/final-create-sheet-360x640.png", Buffer.from(sheetScreenshot.data, "base64"));
await evaluate("[...document.querySelectorAll('button')].find((button) => button.innerText.includes('Tự lên kế hoạch'))?.click()");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.innerText.trim() === 'Tiếp tục')?.click()");
await pause(500);
const tripForm = await evaluate("[...document.querySelectorAll('input')].some((input) => input.placeholder.includes('Ví dụ')) && document.body.innerText.includes('Tạo chuyến mới')");
console.log(JSON.stringify({ destinationRoute, destinationSheet, tripForm }));
socket.close();
