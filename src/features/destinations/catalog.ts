import haLong from "../../assets/images/dashboard/island-bay.png";
import phuQuoc from "../../assets/images/dashboard/reference-phu-quoc.png";
import saPa from "../../assets/images/dashboard/reference-sa-pa.png";
import hoiAn from "../../assets/images/dashboard/reference-hoi-an.png";
import thacPhuCuong from "../../assets/images/destinations/thac-phu-cuong.jpg";
import thacLeKim from "../../assets/images/destinations/thac-le-kim.jpg";
import thacChinTang from "../../assets/images/destinations/thac-chin-tang.jpg";
import thacBauCan from "../../assets/images/destinations/thac-bau-can.jpg";
import nuiHamRong from "../../assets/images/destinations/nui-ham-rong.jpg";
import thanhDiaLaVang from "../../assets/images/destinations/thanh-dia-la-vang.jpg";
import thacTaPuong from "../../assets/images/destinations/thac-ta-puong.jpg";
import thacChenhVenh from "../../assets/images/destinations/thac-chenh-venh.jpg";
import muiTreo from "../../assets/images/destinations/mui-treo.jpg";
import langCoBichLa from "../../assets/images/destinations/lang-co-bich-la.jpg";
import hangBrai from "../../assets/images/destinations/hang-brai.jpg";
import daoConCo from "../../assets/images/destinations/dao-con-co.jpg";
import daLatPhoto from "../../assets/images/destinations/da-lat-pines.jpg";
import daNangPhoto from "../../assets/images/destinations/da-nang-beach.jpg";
import huePhoto from "../../assets/images/destinations/hue-citadel.jpg";
import haGiangPhoto from "../../assets/images/destinations/ha-giang-road.jpg";
import haNoiPhoto from "../../assets/images/destinations/ha-noi-old-quarter.jpg";
import ninhBinhPhoto from "../../assets/images/destinations/ninh-binh-trang-an.jpg";
import dinhHaiChauPhoto from "../../assets/images/destinations/dinh-hai-chau.jpg";
import asiaParkPhoto from "../../assets/images/destinations/asia-park-da-nang.jpg";
import linhUngPhoto from "../../assets/images/destinations/chua-linh-ung.jpg";
import buddhistMuseumPhoto from "../../assets/images/destinations/bao-tang-phat-giao-da-nang.jpg";
import fineArtsMuseumPhoto from "../../assets/images/destinations/bao-tang-my-thuat-da-nang.jpg";
import bayMauPhoto from "../../assets/images/destinations/rung-dua-bay-mau.jpg";
import heroicMotherPhoto from "../../assets/images/destinations/tuong-dai-me-vietnam-anh-hung.jpg";
import chuaHienPhoto from "../../assets/images/destinations/chua-hien-hung-yen-01.jpg";
import chuaNeChauPhoto from "../../assets/images/destinations/chua-ne-chau-01.jpg";
import denMauPhoto from "../../assets/images/destinations/den-mau-hung-yen-01.jpg";
import denDauAnPhoto from "../../assets/images/destinations/den-dau-an.jpg";
import kimBoiPhoto from "../../assets/images/destinations/kim-boi-hot-spring.jpg";
import suoiGiangPhoto from "../../assets/images/destinations/suoi-giang-tea.jpg";
import thuyDienHoaBinhPhoto from "../../assets/images/destinations/thuy-dien-hoa-binh.jpg";
import hoDakKePhoto from "../../assets/images/destinations/ho-dak-ke.jpg";
import hangMoLuongPhoto from "../../assets/images/destinations/hang-mo-luong.jpg";
import thacPuNhuPhoto from "../../assets/images/destinations/thac-pu-nhu.jpg";
import thacPaSyPhoto from "../../assets/images/destinations/thac-pa-sy-kon-tum.jpg";
import konKlorBridgePhoto from "../../assets/images/destinations/cau-treo-kon-klor.jpg";
import chuHrengPhoto from "../../assets/images/destinations/nui-chu-hreng.jpg";
import konTumMuseumPhoto from "../../assets/images/destinations/bao-tang-kon-tum.jpg";
import hoChiMinhCityPhoto from "../../assets/images/destinations/ho-chi-minh-city.jpg";
import { officialDestinationRecords } from "./officialRecords";

export type Destination = {
  id: string;
  name: string;
  normalizedName: string;
  province: string;
  region: string;
  macroRegion: "Miền Bắc" | "Miền Trung" | "Miền Nam";
  slug: string;
  types: string[];
  description: string;
  cover?: string;
  gallery: string[];
  coordinates: { latitude: number; longitude: number } | null;
  sources: string[];
  verification: "official-source" | "unverified";
};

const portal = "https://vietnam.travel/vi/place-to-go/";
const officialSources: Record<string, string> = {
  "ha-long": `${portal}red-river-delta/ha-long/`,
  "phu-quoc": `${portal}mekong-delta/phu-quoc/`,
  "sa-pa": "https://vietnam.travel/vi/place-to-go/northern-midlands-mountains/sapa/",
  "hoi-an": portal,
  "da-lat": "https://vietnam.travel/vi/places-to-go/central-vietnam/da-lat",
  "ha-noi": `${portal}red-river-delta/ha-noi/`,
  "hue": `${portal}north-central-coast/hue/`,
  "da-nang": `${portal}south-central-coast-central-highlands/da-nang/`,
  "ninh-binh": `${portal}red-river-delta/ninh-binh/`,
  "ha-giang": "https://www.vietnam.travel/vi/places-to-go/northern-vietnam/ha-giang",
};
const destination = (item: Omit<Destination, "slug" | "normalizedName" | "gallery" | "coordinates" | "sources" | "verification">): Destination => ({
  ...item,
  normalizedName: normalizeVietnamese(item.name),
  slug: normalizeVietnamese(item.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  gallery: item.cover ? [item.cover] : [],
  coordinates: null,
  sources: [officialSources[item.id] ?? portal],
  verification: "official-source",
});

const provincesByMacroRegion: Record<Destination["macroRegion"], string[]> = {
  "Miền Bắc": ["Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Cao Bằng", "Điện Biên", "Hà Giang", "Hà Nam", "Hà Nội", "Hải Dương", "Hải Phòng", "Hòa Bình", "Hưng Yên", "Lai Châu", "Lạng Sơn", "Lào Cai", "Nam Định", "Ninh Bình", "Phú Thọ", "Quảng Ninh", "Sơn La", "Thái Bình", "Thái Nguyên", "Tuyên Quang", "Vĩnh Phúc", "Yên Bái"],
  "Miền Trung": ["Bình Định", "Bình Thuận", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Gia Lai", "Hà Tĩnh", "Huế", "Khánh Hòa", "Kon Tum", "Lâm Đồng", "Nghệ An", "Ninh Thuận", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Trị", "Thanh Hóa"],
  "Miền Nam": ["An Giang", "Bạc Liêu", "Bến Tre", "Bình Dương", "Bình Phước", "Cà Mau", "Cần Thơ", "Đồng Nai", "Đồng Tháp", "Hậu Giang", "Kiên Giang", "Long An", "Sóc Trăng", "Tây Ninh", "Tiền Giang", "Trà Vinh", "Vĩnh Long", "Thành phố Hồ Chí Minh"],
};

const macroRegionFor = (province: string): Destination["macroRegion"] => {
  const match = Object.entries(provincesByMacroRegion).find(([, provinces]) => provinces.includes(province));
  if (!match) throw new Error(`No macro-region mapping for ${province}`);
  return match[0] as Destination["macroRegion"];
};
const inferredTypes = (name: string): string[] => {
  const normalized = normalizeVietnamese(name);
  const types: string[] = [];
  if (/nui|deo /.test(normalized)) types.push("Núi");
  if (/bien|vinh|dao|cat ba|cua viet|ca na/.test(normalized)) types.push("Biển");
  if (/nui|thac|hang|vuon quoc gia|vuon chim|rung|ho |suoi|dong mo|dong mo/.test(normalized)) types.push("Thiên nhiên");
  if (/den|chua|dinh|bao tang|di tich|le hoi|thanh dia|phu hien|nha co|nha tho|lang nghe|tuong dai/.test(normalized)) types.push("Văn hóa");
  if (types.length === 0) types.push("Đô thị");
  return [...new Set(types)];
};

const imageForDestination = (name: string): string | undefined => {
  const normalized = normalizeVietnamese(name);
  const destinationCovers: Record<string, string> = {
    "thac phu cuong": thacPhuCuong,
    "thac le kim": thacLeKim,
    "thac chin tang": thacChinTang,
    "thac bau can": thacBauCan,
    "nui ham rong": nuiHamRong,
    "thanh dia la vang": thanhDiaLaVang,
    "thac ta puong": thacTaPuong,
    "thac chenh venh": thacChenhVenh,
    "mui treo": muiTreo,
    "lang co bich la": langCoBichLa,
    "hang dong brai": hangBrai,
    "dao con co": daoConCo,
    "vinh ha long": haLong,
    "phu quoc": phuQuoc,
    "sa pa": saPa,
    "hoi an": hoiAn,
    "da lat": daLatPhoto,
    "ha noi": haNoiPhoto,
    "hue": huePhoto,
    "da nang": daNangPhoto,
    "ninh binh": ninhBinhPhoto,
    "ha giang": haGiangPhoto,
    "dinh lang hai chau": dinhHaiChauPhoto,
    "cong vien chau a": asiaParkPhoto,
    "chua linh ung son tra": linhUngPhoto,
    "bao tang van hoa phat giao": buddhistMuseumPhoto,
    "bao tang my thuat da nang": fineArtsMuseumPhoto,
    "rung dua bay mau": bayMauPhoto,
    "tuong dai me viet nam anh hung": heroicMotherPhoto,
    "chua hien": chuaHienPhoto,
    "chua ne chau": chuaNeChauPhoto,
    "den dau an": denDauAnPhoto,
    "den mau hung yen": denMauPhoto,
    "suoi nuoc nong kim boi": kimBoiPhoto,
    "suoi giang": suoiGiangPhoto,
    "thuy dien hoa binh": thuyDienHoaBinhPhoto,
    "ho dak ke": hoDakKePhoto,
    "hang mo luong": hangMoLuongPhoto,
    "thac pu nhu": thacPuNhuPhoto,
    "thac pa sy": thacPaSyPhoto,
    "cau treo kon klor": konKlorBridgePhoto,
    "nui chu hreng": chuHrengPhoto,
    "bao tang kon tum": konTumMuseumPhoto,
  };
  const curatedCover = destinationCovers[normalized] ?? Object.entries(destinationCovers)
    .filter(([placeName]) => placeName.length >= 10)
    .sort(([left], [right]) => right.length - left.length)
    .find(([placeName]) => normalized.includes(placeName))?.[1];
  return curatedCover;
};

const officialDestinations: Destination[] = officialDestinationRecords.map((record) => {
  const id = `vnt-${normalizeVietnamese(record.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const macroRegion = macroRegionFor(record.province);
  const types = inferredTypes(record.name);
  const cover = imageForDestination(record.name);
  return {
    id,
    slug: normalizeVietnamese(record.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name: record.name,
    normalizedName: normalizeVietnamese(record.name),
    province: record.province,
    macroRegion,
    region: macroRegion,
    types,
    description: "Tên địa điểm và địa phương được ghi trong Cơ sở dữ liệu ngành Du lịch Việt Nam.",
    cover,
    gallery: cover ? [cover] : [],
    coordinates: null,
    sources: [`https://csdl.vietnamtourism.gov.vn/dest?page=${record.page}`],
    verification: "official-source",
  };
});

export function normalizeVietnamese(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLocaleLowerCase("vi-VN").trim();
}

const matchesSearchText = (value: string, term: string): boolean => {
  const words = normalizeVietnamese(value).split(/[^a-z0-9]+/).filter(Boolean);
  const queryWords = term.split(/\s+/).filter(Boolean);
  return queryWords.every((queryWord) => words.some((word) => word.startsWith(queryWord)));
};

const curatedDestinations: Destination[] = [
  destination({ id: "ha-long", name: "Vịnh Hạ Long", province: "Quảng Ninh", macroRegion: "Miền Bắc", region: "Đồng bằng sông Hồng", types: ["Biển", "Thiên nhiên", "Di sản"], description: "Vịnh biển với những đảo đá vôi và cảnh quan được UNESCO ghi danh.", cover: haLong }),
  destination({ id: "phu-quoc", name: "Phú Quốc", province: "An Giang", macroRegion: "Miền Nam", region: "Đồng bằng sông Cửu Long", types: ["Biển", "Đảo", "Nghỉ dưỡng"], description: "Đảo với bãi biển cát trắng và hệ sinh thái được bảo tồn.", cover: phuQuoc }),
  destination({ id: "sa-pa", name: "Sa Pa", province: "Lào Cai", macroRegion: "Miền Bắc", region: "Trung du & Miền núi Bắc Bộ", types: ["Núi", "Thiên nhiên", "Văn hóa"], description: "Thung lũng, ruộng bậc thang và các tuyến đi bộ miền núi.", cover: saPa }),
  destination({ id: "hoi-an", name: "Hội An", province: "Đà Nẵng", macroRegion: "Miền Trung", region: "Nam Trung Bộ & Tây Nguyên", types: ["Di sản", "Văn hóa", "Biển"], description: "Phố cổ ven sông, di sản kiến trúc và bãi biển lân cận.", cover: hoiAn }),
  destination({ id: "da-lat", name: "Đà Lạt", province: "Lâm Đồng", macroRegion: "Miền Trung", region: "Nam Trung Bộ & Tây Nguyên", types: ["Cao nguyên", "Thiên nhiên", "Văn hóa"], description: "Thành phố cao nguyên với hồ, đồi núi và hoạt động ngoài trời.", cover: daLatPhoto }),
  destination({ id: "ha-noi", name: "Hà Nội", province: "Hà Nội", macroRegion: "Miền Bắc", region: "Đồng bằng sông Hồng", types: ["Đô thị", "Văn hóa", "Ẩm thực"], description: "Thủ đô với khu phố cổ, hồ, di tích lịch sử và ẩm thực.", cover: haNoiPhoto }),
  destination({ id: "hue", name: "Huế", province: "Huế", macroRegion: "Miền Trung", region: "Bắc Trung Bộ", types: ["Di sản", "Văn hóa", "Ẩm thực"], description: "Cố đô với di sản triều Nguyễn và cảnh quan sông Hương.", cover: huePhoto }),
  destination({ id: "da-nang", name: "Đà Nẵng", province: "Đà Nẵng", macroRegion: "Miền Trung", region: "Nam Trung Bộ & Tây Nguyên", types: ["Biển", "Đô thị", "Thiên nhiên"], description: "Thành phố biển, bán đảo Sơn Trà và các cung đường ven biển.", cover: daNangPhoto }),
  destination({ id: "ninh-binh", name: "Ninh Bình", province: "Ninh Bình", macroRegion: "Miền Bắc", region: "Đồng bằng sông Hồng", types: ["Thiên nhiên", "Di sản", "Sông nước"], description: "Dãy núi đá vôi, sông nước và di sản Hoa Lư.", cover: ninhBinhPhoto }),
  destination({ id: "ha-giang", name: "Hà Giang", province: "Tuyên Quang", macroRegion: "Miền Bắc", region: "Trung du & Miền núi Bắc Bộ", types: ["Núi", "Thiên nhiên", "Phiêu lưu"], description: "Cao nguyên đá, cung đường miền núi và dòng Nho Quế.", cover: haGiangPhoto }),
  destination({ id: "ho-chi-minh-city", name: "Thành phố Hồ Chí Minh", province: "Thành phố Hồ Chí Minh", macroRegion: "Miền Nam", region: "Đông Nam Bộ", types: ["Đô thị", "Văn hóa", "Ẩm thực"], description: "Thành phố năng động với di sản lịch sử, kiến trúc và văn hóa ẩm thực.", cover: hoChiMinhCityPhoto }),
];

export const destinationCatalog: Destination[] = [...curatedDestinations, ...officialDestinations].filter((place, index, entries) => entries.findIndex((item) => item.normalizedName === place.normalizedName) === index);

export const destinationRegions = ["Miền Bắc", "Miền Trung", "Miền Nam"];
export const destinationTypes = ["Biển", "Núi", "Đô thị", "Văn hóa", "Ẩm thực", "Thiên nhiên", ...new Set(destinationCatalog.flatMap((place) => place.types))].filter((type, index, all) => all.indexOf(type) === index);

const mergedProvinceAliases: Record<string, string[]> = {
  "ninh binh": ["ninh binh", "ha nam", "nam dinh"],
  "thanh pho ho chi minh": ["thanh pho ho chi minh", "ho chi minh", "sai gon", "tp hcm", "tphcm"],
};

export function searchDestinations(query: string, region = "Tất cả", type = "Tất cả"): Destination[] {
  const term = normalizeVietnamese(query);
  const filteredPlaces = destinationCatalog.filter((place) =>
    (region === "Tất cả" || place.macroRegion === region || place.region === region) &&
    (type === "Tất cả" || place.types.includes(type)),
  );
  if (!term) return filteredPlaces;

  const matchingNames = filteredPlaces.filter((place) => matchesSearchText(place.name, term));
  // Short inputs such as "ha" are ambiguous across province names (Hà Nội,
  // Hải Phòng, ...). Prefer destination names until the query is specific.
  if (term.length <= 2 && matchingNames.length > 0) return matchingNames;

  const matchingProvinceGroup = Object.values(mergedProvinceAliases).find((aliases) => aliases.some((alias) => alias === term || (term.length >= 3 && alias.startsWith(term))));
  const matchingProvinces = filteredPlaces.filter((place) => {
    return matchesSearchText(place.province, term) || Boolean(matchingProvinceGroup?.includes(normalizeVietnamese(place.province)));
  });
  if (matchingProvinces.length > 0) return matchingProvinces;

  if (matchingNames.length > 0) return matchingNames;

  return filteredPlaces.filter((place) => matchesSearchText(`${place.province} ${place.types.join(" ")}`, term));
}
