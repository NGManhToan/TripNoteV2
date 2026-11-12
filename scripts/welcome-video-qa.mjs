import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../artifacts/qa/", import.meta.url);
const frames = new URL("../artifacts/qa/welcome-video-frames/", import.meta.url);
const ffmpeg = "C:/Users/ASUS/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";
await rm(frames, { recursive: true, force: true });
await mkdir(frames, { recursive: true });
const page = await fetch("http://127.0.0.1:9231/json/new?about:blank", { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let nextId = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => { const message = JSON.parse(data); const resolve = pending.get(message.id); if (resolve) { pending.delete(message.id); resolve(message); } });
const command = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message.result)); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => { const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await command("Page.enable");
await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await command("Page.navigate", { url: "http://127.0.0.1:5174/" });
await wait(250);
const fps = 12;
const frameCount = 180;
let startClicked = false;
for (let index = 0; index < frameCount; index += 1) {
  const frameStart = Date.now();
  if (!startClicked && index >= fps * 10.5) {
    await evaluate("[...document.querySelectorAll('button')].find((button)=>button.innerText.includes('Bắt đầu hành trình'))?.click()");
    startClicked = true;
  }
  const shot = await command("Page.captureScreenshot", { format: "jpeg", quality: 72, captureBeyondViewport: false });
  await writeFile(new URL(`frame-${String(index + 1).padStart(4, "0")}.jpg`, frames), Buffer.from(shot.data, "base64"));
  await wait(Math.max(0, 1000 / fps - (Date.now() - frameStart)));
}
const videoPath = new URL("welcome-animation-transition-390x844.mp4", root);
const videoFile = fileURLToPath(videoPath);
const encode = spawnSync(ffmpeg, ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", join(fileURLToPath(frames), "frame-%04d.jpg"), "-frames:v", String(frameCount), "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoFile], { encoding: "utf8" });
if (encode.status !== 0) throw new Error(encode.error?.message || encode.stderr || "ffmpeg encoding failed");
const probe = spawnSync(ffmpeg, ["-i", videoFile, "-hide_banner"], { encoding: "utf8" });
const mediaText = probe.stderr || probe.stdout;
const media = { duration: mediaText.match(/Duration: ([\d:.]+)/)?.[1] ?? null, dimensions: mediaText.match(/Video:.*?, (\d+x\d+)/)?.[1] ?? null, fps: mediaText.match(/, (\d+(?:\.\d+)?) fps/)?.[1] ?? null };
const result = { video: videoFile, frames: frameCount, clickedCTA: startClicked, finalRoute: await evaluate("location.pathname"), media };
await writeFile(new URL("welcome-video-qa.json", root), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
socket.close();
