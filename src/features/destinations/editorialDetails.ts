export type DestinationEditorialDetails = {
  description?: string;
  season: string;
  cost: string;
  experiences: string[];
  sourceUrl?: string;
};

export type DestinationEntryPrice = {
  amount: string;
  audience: string;
  sourceName: string;
  sourceUrl: string;
};

const destinationBudgetEstimates: { types: string[]; amount: string }[] = [
  { types: ["Biển", "Đảo"], amount: "200.000–800.000 đ/người/lượt" },
  { types: ["Thác nước", "Suối", "Vườn quốc gia", "Khu bảo tồn", "Thiên nhiên", "Sinh thái", "Sông nước"], amount: "50.000–300.000 đ/người/lượt" },
  { types: ["Núi", "Cao nguyên", "Phiêu lưu"], amount: "100.000–600.000 đ/người/lượt" },
  { types: ["Văn hóa", "Di sản", "Tâm linh", "Kiến trúc"], amount: "50.000–250.000 đ/người/lượt" },
  { types: ["Đô thị", "Ẩm thực", "Nghỉ dưỡng"], amount: "100.000–500.000 đ/người/ngày" },
];

export function estimateDestinationBudget(types: readonly string[]): string {
  const estimate = destinationBudgetEstimates.find((item) => item.types.some((type) => types.includes(type)));
  return estimate?.amount ?? "100.000–400.000 đ/người/lượt";
}

// Ticket prices are kept separate from whole-trip budgets and include their
// primary source so the UI never presents an unsourced number as a live quote.
export const destinationEntryPrices: Record<string, DestinationEntryPrice> = {
  "hoi-an": {
    amount: "80.000–120.000 đ/vé",
    audience: "Vé tham quan phố cổ; chọn 3 hoặc 5 công trình văn hóa",
    sourceName: "Trung tâm Bảo tồn Di sản Văn hóa Thế giới Hội An · 2026",
    sourceUrl: "https://hoianheritage.danang.gov.vn/vi/news/Tin-tuc-su-kien/thong-bao-ve-hoat-dong-tham-quan-khu-pho-co-hoi-an-1711.html",
  },
  "vnt-vuon-quoc-gia-cat-ba": {
    amount: "160.000 đ/lượt",
    audience: "Người lớn; trẻ em từ 6 tuổi: 80.000 đ/lượt",
    sourceName: "Cổng thông tin thành phố Hải Phòng · mức thu năm 2026",
    sourceUrl: "https://thanhphohaiphong.gov.vn/hai-phong-dieu-chinh-muc-thu-phi-tham-quan-danh-lam-thang-canh-tu-nam-2026.html",
  },
};

// Editorial figures are deliberately limited to destinations with curated data.
// Do not fill missing values with generated ratings or prices.
export const destinationEditorialDetails: Record<string, DestinationEditorialDetails> = {
  "ha-long": {
    description: "Quần thể vịnh biển nổi tiếng với hàng nghìn đảo đá vôi, hang động và hoạt động tham quan bằng tàu.",
    season: "Tháng 3 – Tháng 5 & Tháng 9 – Tháng 11",
    cost: "Vé tham quan vịnh từ 150.000đ/người/lượt",
    experiences: ["Ngủ đêm trên du thuyền giữa vịnh di sản", "Chèo kayak khám phá hang Luồn và làng chài", "Ngắm hoàng hôn trên đỉnh đảo Titop"],
    sourceUrl: "https://visitquangninh.com/vi/chi-phi-du-lich-ha-long-2-ngay-1-dem-chi-tiet-theo-tung-hang-muc-18970",
  },
  "phu-quoc": {
    description: "Đảo lớn ở An Giang, nổi bật với bãi biển, các đảo phía nam và những làng chài ven biển.",
    season: "Tháng 11 – Tháng 4 năm sau (mùa khô)",
    cost: "4–5tr/người · 3N2Đ (tiết kiệm)",
    experiences: ["Lặn ngắm san hô tại Hòn Móng Tay và Hòn Gầm Ghì", "Trải nghiệm cáp treo vượt biển Hòn Thơm", "Thưởng thức hải sản tại làng chài Hàm Ninh"],
    sourceUrl: "https://visitphuquoc.com.vn/vi/du-lich-phu-quoc-tu-tuc-bao-nhieu-tien-chi-tiet-tung-khoan-13988",
  },
  "da-lat": {
    description: "Thành phố cao nguyên có khí hậu mát, hồ, rừng thông, vườn hoa và các điểm tham quan ngoại ô.",
    season: "Tháng 11 – tháng 3 (mùa khô, trời mát)",
    cost: "2,2–4tr/người · 3N2Đ, chưa gồm vé đi đến Đà Lạt",
    experiences: ["Dạo quanh hồ Xuân Hương và trung tâm thành phố", "Tham quan đồi chè và các điểm ngoại ô", "Thưởng thức cà phê và ẩm thực địa phương"],
    sourceUrl: "https://hoadalattravel.vn/kinh-nghiem-du-lich/chi-phi-di-da-lat/",
  },
  "ha-noi": {
    description: "Thủ đô của Việt Nam với khu phố cổ, hồ Hoàn Kiếm, di tích lịch sử và nền ẩm thực đặc sắc.",
    season: "Tháng 9 – tháng 11 (mùa thu)",
    cost: "2,2–3,8tr/người · 3N2Đ, chưa gồm vé máy bay",
    experiences: ["Dạo khu phố cổ và hồ Hoàn Kiếm", "Tham quan các di tích, bảo tàng trong nội đô", "Khám phá ẩm thực Hà Nội"],
    sourceUrl: "https://tindulich.net/chi-phi-du-lich-ha-noi-3-ngay-tu-tuc-ton-bao-nhieu/",
  },
  "ninh-binh": {
    description: "Vùng cảnh quan núi đá vôi, sông nước và di tích lịch sử Hoa Lư ở phía nam đồng bằng sông Hồng.",
    season: "Tháng 1 – tháng 3 và tháng 9 – tháng 11",
    cost: "2,6–3,4tr/người · 3N2Đ (tham khảo)",
    experiences: ["Đi thuyền tham quan Tràng An hoặc Tam Cốc", "Tham quan Hang Múa và các điểm cảnh quan lân cận", "Kết hợp tham quan di tích Hoa Lư"],
    sourceUrl: "https://visitninhbinh.com.vn/vi/goi-y-chi-phi-du-lich-ninh-binh-tu-tuc-moi-nhat-16187",
  },
  "hue": {
    description: "Cố đô bên sông Hương, được biết đến với quần thể di tích triều Nguyễn và lăng tẩm hoàng gia.",
    season: "Tháng 1 – tháng 4 (thời tiết thường dịu hơn)",
    cost: "Đại Nội 200.000đ/người; vé tuyến di tích từ 200.000đ",
    experiences: ["Tham quan Đại Nội Huế", "Khám phá các lăng vua triều Nguyễn", "Dạo bên sông Hương và tìm hiểu ẩm thực Huế"],
    sourceUrl: "https://phongphu.hue.gov.vn/Du-khach/Thong-tin-du-khach/Thong-tin-can-biet/Gia-ve-tham-quan/tb/Gia-ve-tham-quan-Quan-the-di-tich-Co-do-Hue-160018?page=1",
  },
  "sa-pa": {
    description: "Thị trấn vùng cao nổi tiếng với ruộng bậc thang, thung lũng Mường Hoa và đỉnh Fansipan.",
    season: "Tháng 9 – tháng 11; tháng 3 – tháng 5",
    cost: "3,4–5,7tr/người · 3N2Đ, chưa gồm vé đến Sa Pa",
    experiences: ["Đi bộ qua ruộng bậc thang và bản làng", "Đi cáp treo lên đỉnh Fansipan", "Ngắm thung lũng Mường Hoa và núi Hoàng Liên Sơn"],
    sourceUrl: "https://vietnam.travel/place-to-go/northern-midlands-mountains/sapa/",
  },
  "da-nang": {
    description: "Thành phố biển miền Trung với bãi biển Mỹ Khê, bán đảo Sơn Trà và các điểm tham quan ven đô.",
    season: "Tháng 3 – tháng 5 (thời tiết thường thuận lợi)",
    cost: "3–3,5tr/người · 3N2Đ tại chỗ, chưa gồm vé máy bay",
    experiences: ["Tắm biển Mỹ Khê", "Tham quan bán đảo Sơn Trà", "Khám phá Ngũ Hành Sơn và ẩm thực địa phương"],
    sourceUrl: "https://misstourismdanang.com/da-nang/chi-phi/bang-chi-phi-du-lich-da-nang-3-ngay-2-dem/",
  },
  "ha-giang": {
    description: "Vùng núi phía bắc với cao nguyên đá Đồng Văn, đèo Mã Pí Lèng và dòng Nho Quế.",
    season: "Tháng 9 – tháng 11 (mùa lúa chín và hoa tam giác mạch)",
    cost: "4,2–4,7tr/người · tour vòng cung 3N2Đ có Easy Rider",
    experiences: ["Chạy cung Đồng Văn – Mèo Vạc", "Ngắm đèo Mã Pí Lèng và sông Nho Quế", "Thăm phố cổ Đồng Văn và các bản vùng cao"],
    sourceUrl: "https://ha-giang.org/en/cost/",
  },
  "hoi-an": {
    description: "Đô thị di sản ven sông Thu Bồn, nổi bật với phố cổ, kiến trúc truyền thống và làng nghề.",
    season: "Tháng 2 – tháng 4 (thời tiết thường dễ chịu)",
    cost: "4–15tr/cặp · 3N2Đ, chưa gồm vé di chuyển đường dài",
    experiences: ["Dạo phố cổ và các hội quán", "Đi thuyền trên sông Hoài buổi tối", "Đạp xe đến làng rau Trà Quế hoặc biển An Bàng"],
    sourceUrl: "https://senstay.vn/blog/du-lich-hoi-an-3-ngay-2-dem-ngan-sach-2026",
  },
};
