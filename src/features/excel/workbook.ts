import type * as SheetJS from "xlsx";
import { destinationCatalog, normalizeVietnamese } from "../destinations/catalog";
import type { ShoppingItem, Trip, TripActivity, TripDay, TripPlace } from "../trips/data";

export type ImportPreview = { trip: Trip; missingSheets: string[]; activityCount: number };
const SHEET_NAMES = ["Tổng hợp", "DS quán", "DS Mua sắm"];
const text = (value: unknown) => value === null || value === undefined ? "" : String(value).trim();
const money = (value: unknown): number | null => {
  const source = text(value);
  if (!source) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value >= 0 ? value : null;
  const number = Number(source.replace(/[^\d-]/g, ""));
  return Number.isFinite(number) && number >= 0 ? number : null;
};
function dateValue(value: unknown, xlsx: typeof SheetJS): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  if (typeof value === "number") {
    const serial = xlsx.SSF.parse_date_code(value);
    if (serial) return `${serial.y}-${String(serial.m).padStart(2, "0")}-${String(serial.d).padStart(2, "0")}`;
  }
  const source = text(value);
  if (!source) return "";
  const vietnameseDate = source.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (vietnameseDate) return `${vietnameseDate[3]}-${vietnameseDate[2]!.padStart(2, "0")}-${vietnameseDate[1]!.padStart(2, "0")}`;
  const parsed = new Date(source);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  const match = source.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : "";
}
function timeValue(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  if (typeof value === "number" && value >= 0 && value < 1) {
    const minutes = Math.round(value * 1440);
    return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }
  const source = text(value);
  const match = source.match(/^(\d{1,2})[:.](\d{2})/);
  return match ? `${match[1]!.padStart(2, "0")}:${match[2]}` : source;
}
function toRows(workbook: SheetJS.WorkBook, sheetName: string, xlsx: typeof SheetJS): unknown[][] {
  const sheet = workbook.Sheets[sheetName];
  return sheet ? xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true }) : [];
}

export function inferImportedDestination(fileName: string, activities: Array<{ activity: TripActivity }>, places: TripPlace[]): string {
  const filename = normalizeVietnamese(fileName.replace(/\.xlsx?$/i, ""));
  const searchableContent = normalizeVietnamese([
    ...activities.flatMap(({ activity }) => [activity.name, activity.location, activity.address, activity.note]),
    ...places.flatMap((place) => [place.name, place.address, place.note]),
  ].filter(Boolean).join(" "));
  const knownDestinations = destinationCatalog.filter((place) => place.id.startsWith("ha-long") || ["phu-quoc", "sa-pa", "hoi-an", "da-lat", "ha-noi", "hue", "da-nang", "ninh-binh", "ha-giang", "ho-chi-minh-city"].includes(place.id));
  const filenameMatch = knownDestinations
    .filter((place) => filename.includes(place.normalizedName) || filename.includes(normalizeVietnamese(place.province)))
    .sort((a, b) => b.normalizedName.length - a.normalizedName.length)[0];
  if (filenameMatch) return filenameMatch.name;

  const contentMatch = knownDestinations
    .filter((place) => searchableContent.includes(place.normalizedName) || searchableContent.includes(normalizeVietnamese(place.province)))
    .sort((a, b) => {
      const aScore = Number(searchableContent.includes(a.normalizedName)) * 2 + Number(searchableContent.includes(normalizeVietnamese(a.province)));
      const bScore = Number(searchableContent.includes(b.normalizedName)) * 2 + Number(searchableContent.includes(normalizeVietnamese(b.province)));
      return bScore - aScore || b.normalizedName.length - a.normalizedName.length;
    })[0];
  return contentMatch?.name ?? "Chưa xác định";
}

export async function parseTripWorkbook(file: File): Promise<ImportPreview> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  const missingSheets = SHEET_NAMES.filter((name) => !workbook.Sheets[name]);
  const rows = toRows(workbook, "Tổng hợp", XLSX);
  if (!workbook.Sheets["Tổng hợp"] || rows.length < 2) throw new Error("Không tìm thấy dữ liệu lịch trình trong sheet “Tổng hợp”.");
  const headers = (rows[0] ?? []).map((item) => text(item).toLocaleLowerCase("vi-VN"));
  const requiredHeaders = ["ngày", "giờ", "hạng mục", "nội dung"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) throw new Error(`Sheet “Tổng hợp” thiếu cột bắt buộc: ${missingHeaders.join(", ")}.`);
  const activities: Array<{ date: string; activity: TripActivity }> = [];
  const sheetDates = new Set<string>();
  let currentDate = "";
  let declaredBudget: number | null = null;
  rows.slice(1).forEach((row, rowIndex) => {
    const values = row as unknown[];
    const rowText = values.map(text);
    if (rowText.some((value) => value.toLocaleUpperCase("vi-VN") === "TỔNG")) {
      declaredBudget = money(values[5]) ?? declaredBudget;
      return;
    }
    const rowDate = dateValue(values[0], XLSX);
    if (rowDate) {
      currentDate = rowDate;
      sheetDates.add(rowDate);
    }
    const rawNote = text(values[7]);
    const name = text(values[3]) || text(values[2]) || rawNote;
    if (!name || !currentDate) return;
    const mapUrl = rawNote.match(/https?:\/\/\S+/i)?.[0];
    const dayDestination = rawNote.match(/(?:Điểm đến|Destination)\s*:\s*([^\r\n]+)/i)?.[1]?.trim();
    const note = rawNote.replace(/https?:\/\/\S+/gi, "").replace(/(?:Bản đồ\s*:\s*)/gi, "").replace(/(?:Điểm đến|Destination)\s*:\s*[^\r\n]+/gi, "").trim();
    const activity: TripActivity = {
      id: `xlsx-${rowIndex}-${crypto.randomUUID()}`, name, location: text(values[4]), time: timeValue(values[1]), category: text(values[2]) || "Khác", destination: dayDestination,
      cost: money(values[5]), plannedCost: money(values[5]), actualCost: money(values[6]), note: note || undefined, mapUrl,
      status: values[6] !== null && values[6] !== undefined && values[6] !== "" ? "Đã lên kế hoạch" : "Dự kiến",
    };
    activities.push({ date: currentDate, activity });
  });
  if (!activities.length) throw new Error("Không có hoạt động hợp lệ trong sheet “Tổng hợp”. Hãy kiểm tra ngày và tên hoạt động.");
  const dateKeys = [...new Set([...sheetDates, ...activities.map(({ date }) => date)])].sort();
  const startDate = dateKeys[0] ?? "";
  const endDate = dateKeys.at(-1) ?? startDate;
  const grouped = new Map<string, TripActivity[]>();
  for (const item of activities) grouped.set(item.date, [...(grouped.get(item.date) ?? []), item.activity]);
  const dayKeys: string[] = [];
  if (startDate && endDate) {
    for (let date = new Date(`${startDate}T00:00:00Z`); date <= new Date(`${endDate}T00:00:00Z`) && dayKeys.length < 90; date = new Date(date.getTime() + 86_400_000)) dayKeys.push(date.toISOString().slice(0, 10));
  }
  const itinerary: TripDay[] = dayKeys.map((date) => {
    const dayActivities = grouped.get(date) ?? [];
    return { date, expectedBudget: dayActivities.reduce((sum, item) => sum + (item.plannedCost ?? 0), 0) || null, activities: dayActivities, destination: dayActivities.find((item) => item.destination)?.destination };
  });
  const places: TripPlace[] = toRows(workbook, "DS quán", XLSX).slice(1).map((raw, i) => {
    const row = raw as unknown[];
    const name = text(row[2]) || text(row[1]);
    return { id: `place-${i}-${crypto.randomUUID()}`, name, category: text(row[1]) || undefined, type: text(row[3]) || undefined, openingHours: text(row[4]) || undefined, address: text(row[5]) || undefined, pricePerPerson: money(row[6]), mapUrl: text(row[7]) || undefined, note: text(row[8]) || undefined };
  }).filter((place) => place.name);
  const shoppingItems: ShoppingItem[] = toRows(workbook, "DS Mua sắm", XLSX).slice(1).map((raw, i) => {
    const row = raw as unknown[];
    return { id: `shopping-${i}-${crypto.randomUUID()}`, name: text(row[1]), quantity: typeof row[2] === "number" || typeof row[2] === "string" ? row[2] : null, cost: money(row[3]), purchased: /đã có|đã mua/i.test(text(row[4])) };
  }).filter((item) => item.name);
  const planned = activities.reduce((sum, item) => sum + (item.activity.plannedCost ?? 0), 0);
  const actual = activities.reduce((sum, item) => sum + (item.activity.actualCost ?? 0), 0);
  const total = declaredBudget ?? (planned || null);
  const fileBaseName = file.name.replace(/\.xlsx?$/i, "").trim();
  const inferredDestination = inferImportedDestination(file.name, activities, places);
  const routeDestinations = [...new Set(itinerary.map((day) => day.destination).filter((value): value is string => Boolean(value)))].map((name) => ({ name }));
  const destinations = routeDestinations.length ? routeDestinations : inferredDestination !== "Chưa xác định" ? [{ name: inferredDestination }] : [];
  const destination = destinations[0]?.name ?? inferredDestination;
  const formatDate = (value: string) => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "";
  const trip: Trip = {
    id: `import-${crypto.randomUUID()}`, name: destination !== "Chưa xác định" ? destination : fileBaseName || "Lịch trình đã nhập", destination, destinations, image: "", dateRange: `${formatDate(startDate)} – ${formatDate(endDate)}`, startDate, endDate,
    spent: actual, estimate: total, isDemo: false, itinerary, places, shoppingItems, importSource: file.name,
  };
  return { trip, missingSheets, activityCount: activities.length };
}

function setTemplateCell(sheet: SheetJS.WorkSheet, address: string, value: unknown): void {
  const original = sheet[address] as SheetJS.CellObject | undefined;
  if (value === null || value === undefined || value === "") {
    if (original) { original.v = undefined; original.t = "z"; delete original.f; delete original.w; }
    return;
  }
  const type: SheetJS.ExcelDataType = typeof value === "number" ? "n" : "s";
  sheet[address] = { ...(original ?? {}), t: type, v: value };
  delete sheet[address]!.f;
  delete sheet[address]!.w;
}

function clearTemplateRange(sheet: SheetJS.WorkSheet, firstRow: number, lastRow: number, firstColumn: number, lastColumn: number, xlsx: typeof SheetJS): void {
  for (let row = firstRow; row <= lastRow; row += 1) for (let column = firstColumn; column <= lastColumn; column += 1) setTemplateCell(sheet, xlsx.utils.encode_cell({ r: row - 1, c: column - 1 }), undefined);
}

function insertTemplateRows(sheet: SheetJS.WorkSheet, beforeRow: number, count: number, xlsx: typeof SheetJS): void {
  if (count <= 0) return;
  const start = beforeRow - 1;
  const moved: Array<[string, SheetJS.CellObject]> = [];
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith("!")) continue;
    const point = xlsx.utils.decode_cell(address);
    if (point.r >= start) moved.push([address, cell as SheetJS.CellObject]);
  }
  moved.forEach(([address]) => { delete sheet[address]; });
  moved.forEach(([address, cell]) => {
    const point = xlsx.utils.decode_cell(address);
    sheet[xlsx.utils.encode_cell({ r: point.r + count, c: point.c })] = cell;
  });
  if (sheet["!ref"]) {
    const range = xlsx.utils.decode_range(sheet["!ref"]);
    range.e.r += count;
    sheet["!ref"] = xlsx.utils.encode_range(range);
  }
  if (sheet["!rows"]) sheet["!rows"] = [...sheet["!rows"].slice(0, start), ...Array.from({ length: count }, () => ({ ...(sheet["!rows"]?.[start - 1] ?? {}) })), ...sheet["!rows"].slice(start)];
}

function copyTemplateRowStyle(sheet: SheetJS.WorkSheet, sourceRow: number, targetRow: number, columns: number, xlsx: typeof SheetJS): void {
  for (let column = 1; column <= columns; column += 1) {
    const sourceAddress = xlsx.utils.encode_cell({ r: sourceRow - 1, c: column - 1 });
    const targetAddress = xlsx.utils.encode_cell({ r: targetRow - 1, c: column - 1 });
    const source = sheet[sourceAddress] as SheetJS.CellObject | undefined;
    if (source) sheet[targetAddress] = { s: source.s, z: source.z, t: "z" };
  }
}

export function createTripWorkbook(trip: Trip, xlsx: typeof SheetJS, template: ArrayBuffer): Uint8Array {
  const workbook = xlsx.read(template, { type: "array", cellDates: true, cellStyles: true });
  const summarySheet = workbook.Sheets["Tổng hợp"];
  const placesSheet = workbook.Sheets["DS quán"];
  const shoppingSheet = workbook.Sheets["DS Mua sắm"];
  if (!summarySheet || !placesSheet || !shoppingSheet) throw new Error("Tệp Excel mẫu thiếu một trong ba sheet chuẩn.");
  const activities = (trip.itinerary ?? []).flatMap((day) => day.activities.map((activity) => ({ day, activity }))).sort((a, b) => a.day.date.localeCompare(b.day.date) || a.activity.time.localeCompare(b.activity.time));
  if (activities.length > 22) insertTemplateRows(summarySheet, 24, activities.length - 22, xlsx);
  const totalRow = Math.max(24, activities.length + 2);
  clearTemplateRange(summarySheet, 2, totalRow, 1, 9, xlsx);
  if (activities.length > 22) for (let row = 24; row < totalRow; row += 1) copyTemplateRowStyle(summarySheet, 23, row, 9, xlsx);
  let previousDate = "";
  activities.forEach(({ day, activity }, index) => {
    const row = index + 2;
    const mapNote = [activity.note, activity.mapUrl, day.destination ? `Điểm đến: ${day.destination}` : ""].filter(Boolean).join("\n");
    if (day.date !== previousDate) {
      setTemplateCell(summarySheet, `A${row}`, (Date.parse(`${day.date}T00:00:00Z`) - Date.parse("1899-12-30T00:00:00Z")) / 86_400_000);
      (summarySheet[`A${row}`] as SheetJS.CellObject).z = "d/m";
    }
    if (activity.time) {
      const [hour, minute] = activity.time.split(":").map(Number);
      setTemplateCell(summarySheet, `B${row}`, (hour * 60 + minute) / 1440);
      (summarySheet[`B${row}`] as SheetJS.CellObject).z = "hh:mm";
    }
    setTemplateCell(summarySheet, `C${row}`, activity.category);
    setTemplateCell(summarySheet, `D${row}`, activity.name);
    setTemplateCell(summarySheet, `E${row}`, activity.address || activity.location);
    setTemplateCell(summarySheet, `F${row}`, activity.plannedCost ?? activity.cost);
    setTemplateCell(summarySheet, `G${row}`, activity.actualCost);
    setTemplateCell(summarySheet, `H${row}`, mapNote);
    previousDate = day.date;
  });
  setTemplateCell(summarySheet, `F${totalRow}`, activities.reduce((total, item) => total + (item.activity.plannedCost ?? item.activity.cost ?? 0), 0));
  const totalCell = summarySheet[`F${totalRow}`] as SheetJS.CellObject;
  totalCell.f = `SUM(F2:F${totalRow - 1})`;

  const placeCapacity = 997;
  const places = trip.places ?? [];
  if (places.length > placeCapacity) throw new Error(`Mẫu hiện hỗ trợ tối đa ${placeCapacity} địa điểm quán.`);
  clearTemplateRange(placesSheet, 2, 998, 1, 9, xlsx);
  places.forEach((place, index) => {
    const row = index + 2;
    setTemplateCell(placesSheet, `A${row}`, index + 1);
    setTemplateCell(placesSheet, `B${row}`, place.category);
    setTemplateCell(placesSheet, `C${row}`, place.name);
    setTemplateCell(placesSheet, `D${row}`, place.type);
    setTemplateCell(placesSheet, `E${row}`, place.openingHours);
    setTemplateCell(placesSheet, `F${row}`, place.address);
    setTemplateCell(placesSheet, `G${row}`, place.pricePerPerson);
    setTemplateCell(placesSheet, `H${row}`, place.mapUrl);
    setTemplateCell(placesSheet, `I${row}`, place.note);
  });
  const shoppingCapacity = 999;
  const shopping = trip.shoppingItems ?? [];
  if (shopping.length > shoppingCapacity) throw new Error(`Mẫu hiện hỗ trợ tối đa ${shoppingCapacity} món mua sắm.`);
  clearTemplateRange(shoppingSheet, 2, 1000, 1, 5, xlsx);
  shopping.forEach((item, index) => {
    const row = index + 2;
    setTemplateCell(shoppingSheet, `A${row}`, index + 1);
    setTemplateCell(shoppingSheet, `B${row}`, item.name);
    setTemplateCell(shoppingSheet, `C${row}`, item.quantity);
    setTemplateCell(shoppingSheet, `D${row}`, item.cost);
    setTemplateCell(shoppingSheet, `E${row}`, item.purchased ? "Đã có" : "");
  });
  const output = xlsx.write(workbook, { bookType: "xlsx", type: "array", cellStyles: true }) as ArrayBuffer | Uint8Array;
  return output instanceof Uint8Array ? output : new Uint8Array(output);
}

export async function exportTripWorkbook(trip: Trip): Promise<File> {
  const XLSX = await import("xlsx");
  const safeName = trip.name.replace(/[\\/:*?"<>|]/g, "-");
  const response = await fetch(`${import.meta.env.BASE_URL}templates/tripnote-plan-template.xlsx`);
  if (!response.ok) throw new Error("Không tải được tệp mẫu Excel TripNote.");
  const workbookBytes = createTripWorkbook(trip, XLSX, await response.arrayBuffer());
  const buffer = new ArrayBuffer(workbookBytes.byteLength);
  new Uint8Array(buffer).set(workbookBytes);
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const file = new File([blob], `TripNote-${safeName}.xlsx`, { type: blob.type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `TripNote-${safeName}.xlsx`;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return file;
}

