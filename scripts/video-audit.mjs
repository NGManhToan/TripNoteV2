import { mkdir, writeFile } from "node:fs/promises";

const out = new URL("../artifacts/qa/video-audit/", import.meta.url);
await mkdir(out, { recursive: true });
const [designPath = "C:/Users/ASUS/Downloads/gemini_generated_video_b193f30c.mp4", currentPath = "C:/Users/ASUS/AppData/Local/Packages/Microsoft.ScreenSketch_8wekyb3d8bbwe/TempState/Recordings/20261111-0755-01.8094025.mp4"] = process.argv.slice(2);
const page = await fetch("http://127.0.0.1:9231/json/new?about:blank", { method: "PUT" }).then((r) => r.json());
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
let id = 0; const pending = new Map();
ws.addEventListener("message", ({ data }) => { const m = JSON.parse(data); if (pending.has(m.id)) { const resolve = pending.get(m.id); pending.delete(m.id); resolve(m); } });
const cmd = (method, params = {}) => new Promise((resolve, reject) => { const commandId = ++id; pending.set(commandId, (m) => m.error ? reject(new Error(m.error.message)) : resolve(m.result)); ws.send(JSON.stringify({ id: commandId, method, params })); });
const evalJs = async (expression) => { const r = await cmd("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };
await cmd("Page.enable"); await cmd("DOM.enable"); await cmd("Page.navigate", { url: "http://127.0.0.1:5174/" }); await new Promise((r) => setTimeout(r, 400));
await evalJs("document.body.innerHTML='<input type=file accept=video/mp4><div id=frame></div>'");
const root = await cmd("DOM.getDocument"); const input = await cmd("DOM.querySelector", { nodeId: root.root.nodeId, selector: "input[type=file]" });

async function inspect(file, baseName, stepSeconds) {
  await cmd("DOM.setFileInputFiles", { nodeId: input.nodeId, files: [file] });
  const keyTimes = baseName === "design" ? [1, 3, 5, 8, 11, 13, 16, 19, 23, 27] : [2, 6, 12, 20, 32, 44, 60, 80, 112];
  const result = await evalJs(`(async()=>{const f=document.querySelector('input').files[0];const v=document.createElement('video');v.muted=true;v.preload='auto';v.src=URL.createObjectURL(f);document.querySelector('#frame').replaceChildren(v);await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=()=>reject(new Error('Video decode failed'));});await new Promise((resolve)=>{v.oncanplaythrough=resolve;setTimeout(resolve,2500)});const duration=v.duration;const times=[];for(let t=0;t<duration;t+=${stepSeconds})times.push(t);const columns=7,tw=196,th=126,rows=Math.ceil(times.length/columns),canvas=document.createElement('canvas');canvas.width=columns*tw;canvas.height=rows*th;const c=canvas.getContext('2d');c.fillStyle='#0b1422';c.fillRect(0,0,canvas.width,canvas.height);const selected={};let seeks=0;const seek=async(t)=>{await new Promise(resolve=>{v.onseeked=resolve;v.currentTime=t;setTimeout(resolve,1500)});seeks++};for(let i=0;i<times.length;i++){const t=times[i];if(i)await seek(t);const x=(i%columns)*tw,y=Math.floor(i/columns)*th;c.drawImage(v,x,y,tw,th-22);c.fillStyle='white';c.font='12px sans-serif';c.fillText(t.toFixed(1)+'s',x+5,y+th-7)}for(const t of ${JSON.stringify(keyTimes)}.filter((t)=>t<duration-.5)){await seek(t);const raw=document.createElement('canvas');raw.width=v.videoWidth;raw.height=v.videoHeight;raw.getContext('2d').drawImage(v,0,0);selected[t]=raw.toDataURL('image/jpeg',0.9)}return JSON.stringify({duration,width:v.videoWidth,height:v.videoHeight,frames:times.length,seeks,selected,data:canvas.toDataURL('image/jpeg',0.86)})})()`);
  const parsed = JSON.parse(result); await writeFile(new URL(`${baseName}-contact.jpg`, out), Buffer.from(parsed.data.split(",")[1], "base64"));
  const moments = [];
  for (const [time, image] of Object.entries(parsed.selected)) { const name = `${baseName}-${String(time).padStart(3, "0")}s.jpg`; await writeFile(new URL(name, out), Buffer.from(image.split(",")[1], "base64")); moments.push(name); }
  return { file, duration: parsed.duration, resolution: `${parsed.width}x${parsed.height}`, framesReviewed: parsed.frames, seeks: parsed.seeks, image: `${baseName}-contact.jpg`, moments };
}
const results = [];
results.push(await inspect(designPath, "design", 1));
results.push(await inspect(currentPath, "current-0755", 2));
await writeFile(new URL("video-audit.json", out), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2)); ws.close();
