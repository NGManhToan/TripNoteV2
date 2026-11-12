export type TripPlace = { id: string; name: string; category?: string; type?: string; openingHours?: string; address?: string; pricePerPerson?: number | null; mapUrl?: string; note?: string };
export type ShoppingItem = { id: string; name: string; quantity?: number | string | null; cost: number | null; purchased?: boolean };
export type TripPreparationTask = { id: string; title: string; done: boolean };
export type TripDestination = { id?: string; name: string };
export type Trip = {
  id: string;
  name: string;
  image: string;
  dateRange: string;
  spent: number;
  estimate: number | null;
  isDemo: boolean;
  startDate?: string;
  endDate?: string;
  destination?: string;
  destinationId?: string;
  destinations?: TripDestination[];
  tripIcon?: string;
  coverAttachmentId?: string;
  itinerary?: TripDay[];
  places?: TripPlace[];
  shoppingItems?: ShoppingItem[];
  preparation?: TripPreparationTask[];
  importSource?: string;
};

export type TripActivityStatus = "Dự kiến" | "Đã lên kế hoạch" | "Đã hoàn thành" | "Đã hủy";
export type TripActivity = { id: string; name: string; location: string; time: string; category: string; categoryGroup?: string; customTypeId?: string; cost: number | null; plannedCost?: number | null; actualCost?: number | null; address?: string; note?: string; mapUrl?: string; attachmentId?: string; destination?: string; status: TripActivityStatus };
export type TripDay = { date: string; expectedBudget: number | null; activities: TripActivity[]; destination?: string };

export function tripRouteLabel(trip: Pick<Trip, "name" | "destination" | "destinations">): string {
  const stops = trip.destinations?.map((stop) => stop.name.trim()).filter(Boolean) ?? [];
  return stops.length ? stops.join(" → ") : trip.destination || trip.name;
}

export const sampleTrips: Trip[] = [
  { id: "sample-dalat", name: "Đà Lạt", destination: "Đà Lạt", image: "", dateRange: "10/12/2026 – 12/12/2026", startDate: "2026-12-10", endDate: "2026-12-12", spent: 0, estimate: 3_410_000, isDemo: true, itinerary: [
    { date: "2026-12-10", expectedBudget: null, activities: [] },
    { date: "2026-12-11", expectedBudget: 550_000, activities: [
      { id: "demo-market", name: "Săn mây Đồi Chè Cầu Đất", location: "Uống cà phê container", time: "06:00", category: "Tham quan", cost: 200_000, status: "Dự kiến" },
      { id: "demo-dinner", name: "Cơm lam gà nướng", location: "Thung lũng ngàn hoa", time: "12:00", category: "Ăn trưa", cost: 350_000, status: "Đã lên kế hoạch" },
    ] },
    { date: "2026-12-12", expectedBudget: 420_000, activities: [
      { id: "demo-lake", name: "Dạo quanh hồ Xuân Hương", location: "Trung tâm Đà Lạt", time: "09:00", category: "Tham quan", cost: 120_000, status: "Dự kiến" },
    ] },
  ] },
];

export const multiStopPreviewTrip: Trip = {
  id: "demo-multi-stop-preview",
  name: "Dữ liệu thử · tuyến 2 điểm",
  destination: "Đà Lạt",
  destinationId: "da-lat",
  destinations: [{ id: "da-lat", name: "Đà Lạt" }, { id: "nha-trang", name: "Nha Trang" }],
  image: "",
  dateRange: "10/12/2026 – 12/12/2026",
  startDate: "2026-12-10",
  endDate: "2026-12-12",
  spent: 450_000,
  estimate: 3_200_000,
  isDemo: true,
  itinerary: [
    { date: "2026-12-10", destination: "Đà Lạt", expectedBudget: 850_000, activities: [
      { id: "multi-stop-day-1-a", name: "Đến Đà Lạt, nhận phòng", location: "Trung tâm Đà Lạt", time: "09:00", category: "Lưu trú", cost: 500_000, status: "Dự kiến" },
      { id: "multi-stop-day-1-b", name: "Tham quan hồ Xuân Hương", location: "Đà Lạt", time: "15:00", category: "Tham quan", cost: 350_000, status: "Dự kiến" },
    ] },
    { date: "2026-12-11", destination: "Đà Lạt", expectedBudget: 650_000, activities: [
      { id: "multi-stop-day-2-a", name: "Đồi chè Cầu Đất", location: "Xuân Trường, Đà Lạt", time: "06:30", category: "Tham quan", cost: 250_000, status: "Dự kiến" },
      { id: "multi-stop-day-2-b", name: "Di chuyển đến Nha Trang", location: "Đà Lạt → Nha Trang", time: "13:00", category: "Di chuyển", cost: 400_000, status: "Dự kiến" },
    ] },
    { date: "2026-12-12", destination: "Nha Trang", expectedBudget: 1_250_000, activities: [
      { id: "multi-stop-day-3-a", name: "Tham quan Tháp Bà Ponagar", location: "Nha Trang", time: "09:00", category: "Tham quan", cost: 250_000, status: "Dự kiến" },
      { id: "multi-stop-day-3-b", name: "Dạo biển Trần Phú", location: "Nha Trang", time: "16:00", category: "Nghỉ dưỡng", cost: 1_000_000, status: "Dự kiến" },
    ] },
  ],
};

export function formatDong(amount: number) {
  return `${amount.toLocaleString("vi-VN")} đ`;
}
