import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BookOpen, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, Coins, Ellipsis, FileSpreadsheet, Heart, MapPin, Moon, Mountain, Palmtree, Plus, Search, Send, SlidersHorizontal, Smartphone, Star, Trash2, UserRound, Waves, X } from "lucide-react";
import { createPortal } from "react-dom";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import earth from "../../assets/images/welcome/earth.png";
import plane from "../../assets/images/welcome/plane.png";
import defaultTripCover from "../../assets/images/dashboard/mountain-valley.png";
import { tripRouteLabel, type Trip } from "../trips/data";
import { destinationRegions, destinationTypes, getDestinationDisplayType, normalizeVietnamese, searchDestinations, type Destination } from "../destinations/catalog";
import { destinationEditorialDetails, destinationEntryPrices, estimateDestinationBudget } from "../destinations/editorialDetails";
import { fetchOpenStreetMapClassification, type FeaturedPlaceRating } from "../destinations/featuredRatings";
import { fetchOnlineDestinationInfo } from "../destinations/onlineDestinationInfo";
import type { DashboardSection } from "../../ui/navigation/types";
import MobileDock from "../../ui/navigation/MobileDock";
import type { TripSyncState } from "../firebase/useTripSync";
import { useFavoritesSync } from "../firebase/useFavoritesSync";
import { GlassSheet } from "../../ui/sheets/GlassSheet";
import DestinationDetailSheet from "../destinations/DestinationDetailSheet";
import styles from "./DashboardExperience.module.css";

const favoritesKey = "tripnote-v2-favorite-destinations";
const themeKey = "tripnote-v2-dark-navy";
const appIconKey = "tripnote-v2-custom-app-icon";
type Props = { trips: Trip[]; onSelectTrip: (index: number) => void; onOpenTrip: (trip: Trip) => void; onCreateTrip: () => void; onDeleteTrip: (trip: Trip) => void; onChooseDestination: (destination: Destination) => void; onImport: () => void; onExport: (trip: Trip) => void; active: DashboardSection; onChange: (section: DashboardSection) => void; query: string; onQueryChange: (value: string) => void; dockVisible?: boolean; syncStatus?: TripSyncState };

type FeaturedDestination = { destination: Destination; rating: FeaturedPlaceRating };

type DestinationCardProps = {
  place: Destination;
  favorite: boolean;
  reduced: boolean;
  loading: "eager" | "lazy";
  highPriority: boolean;
  rating?: FeaturedPlaceRating;
  onChoose: (place: Destination) => void;
  onPlan: (place: Destination) => void;
  onToggleFavorite: (id: string) => void;
  onRequestRating: (place: Destination) => void;
  compactFavorite: boolean;
};

const DestinationCard = memo(function DestinationCard({ place, favorite, reduced, loading, highPriority, rating, onChoose, onPlan, onToggleFavorite, onRequestRating, compactFavorite }: DestinationCardProps) {
  const editorial = destinationEditorialDetails[place.id];
  const cardRef = useRef<HTMLElement>(null);
  const [onlineDescription, setOnlineDescription] = useState("");
  const genericDescription = place.description.includes("Cơ sở dữ liệu ngành Du lịch Việt Nam");

  useEffect(() => {
    if (!genericDescription) return;
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void fetchOnlineDestinationInfo(place.id, place.name).then((info) => {
        setOnlineDescription(info?.summary ?? "Mở chi tiết để xem nguồn thông tin du lịch địa phương.");
      });
    }, { rootMargin: "240px 0px" });
    observer.observe(card);
    return () => observer.disconnect();
  }, [genericDescription, place.id, place.name]);

  const description = genericDescription ? onlineDescription : place.description;
  const entryPrice = destinationEntryPrices[place.id];
  const exactOsmCharge = rating?.charge && !["yes", "true", "1"].includes(rating.charge.toLowerCase())
    ? `Phí ${rating.charge}`
    : "";
  const budgetAmount = editorial?.cost ?? (entryPrice?.amount ? entryPrice.amount : exactOsmCharge || (rating?.fee === "no" ? "0 đ vé vào cửa" : estimateDestinationBudget(place.types)));
  const budget = budgetAmount;
  const cardBudget = budget
    .replace(/^Vé tham quan vịnh từ\s*/i, "")
    .replace(/\s+·\s+.*$/i, "")
    .replace(/,\s*(?:chưa gồm|không gồm)\b.*$/i, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\/lượt\b/gi, "")
    .split(";")[0]
    .trim();
  const displayType = getDestinationDisplayType(place);
  const displayRating = "4.5/5";
  return <article ref={cardRef} className={`${styles.destinationCard} ${styles.editorialDestinationCard}`}>
    <div className={styles.editorialMedia}>
      <motion.button className={styles.cardOpen} type="button" aria-label={`Xem ${place.name}`} onClick={() => { onRequestRating(place); onChoose(place); }} onContextMenu={(event) => event.preventDefault()} whileTap={reduced ? undefined : { scale: .99, transition: { duration: .12 } }}>
        {place.cover && <img src={place.cover} alt={`Phong cảnh ${place.name}`} loading={loading} fetchPriority={highPriority ? "high" : "auto"} decoding="async" />}
        <span className={styles.destinationShade} />
        <span className={styles.destinationTag}>{displayType}</span>
      </motion.button>
      <motion.button type="button" className={styles.favorite} aria-label={favorite ? `Bỏ lưu ${place.name}` : `Lưu ${place.name}`} aria-pressed={favorite} onClick={() => onToggleFavorite(place.id)} onContextMenu={(event) => event.preventDefault()} whileTap={reduced ? undefined : { scale: .9, transition: { type: "spring", stiffness: 500, damping: 22 } }}>
        <Heart fill={favorite ? "currentColor" : "none"} />
      </motion.button>
      {compactFavorite && <span className={styles.favoriteCardRating}><Star aria-hidden="true" fill="currentColor" />4.5 ★</span>}
    </div>
    {compactFavorite ? <div className={`${styles.editorialCardBody} ${styles.favoriteCardBody}`}>
      <button className={styles.favoriteCardOpen} type="button" onClick={() => { onRequestRating(place); onChoose(place); }}>
        <strong>{place.name}</strong>
        <span className={styles.favoriteCardDescription}>{description || (genericDescription ? "Đang tải giới thiệu trực tuyến…" : "")}</span>
        <span className={styles.favoriteCardLocation}><MapPin aria-hidden="true" />{place.province}<i />{displayType}</span>
      </button>
      <div className={styles.favoriteCardFooter}>
        <span className={styles.favoriteCardBudget}>{cardBudget}</span>
        <button type="button" className={styles.favoriteCardPlan} onClick={() => onPlan(place)}><Plus aria-hidden="true" />Hành trình</button>
      </div>
    </div> : <button className={styles.editorialCardBody} type="button" onClick={() => { onRequestRating(place); onChoose(place); }}>
      <span className={styles.editorialTitleRow}><strong>{place.name}</strong><span className={styles.editorialRating} aria-label="Đánh giá 4.5 trên 5"><Star aria-hidden="true" fill="currentColor" />{displayRating}</span></span>
      <span className={styles.editorialDescription}>{description || (genericDescription ? "Đang tải giới thiệu trực tuyến…" : "")}</span>
      <span className={styles.editorialMeta}>
        <span><MapPin aria-hidden="true" />{place.province}</span>
        <span className={styles.editorialBudget}><Coins aria-hidden="true" /><span>{cardBudget}</span></span>
      </span>
    </button>}
  </article>;
});

export default function DashboardExperience({ trips, onSelectTrip, onOpenTrip, onCreateTrip, onDeleteTrip, onChooseDestination, onImport, onExport, active, onChange, query, onQueryChange, dockVisible = true, syncStatus = "local" }: Props) {
  const reduced = useReducedMotion();
  const [regions, setRegions] = useState<string[]>([]);
  const [destinationTypesSelected, setDestinationTypesSelected] = useState<string[]>([]);
  const [draftRegions, setDraftRegions] = useState<string[]>([]);
  const [draftTypes, setDraftTypes] = useState<string[]>([]);
  const [categoryType, setCategoryType] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTripId, setExportTripId] = useState("");
  const [exportQuery, setExportQuery] = useState("");
  const [tripQuery, setTripQuery] = useState("");
  const [darkNavy, setDarkNavy] = useState(() => { try { return localStorage.getItem(themeKey) !== "false"; } catch { return true; } });
  const [customAppIcon, setCustomAppIcon] = useState(() => { try { return localStorage.getItem(appIconKey) ?? ""; } catch { return ""; } });
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(favoritesKey) ?? "[]") as string[]; } catch { return []; } });
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteTripTarget, setDeleteTripTarget] = useState<Trip | null>(null);
  const [detailDestination, setDetailDestination] = useState<Destination | null>(null);
  const [planningDestination, setPlanningDestination] = useState<Destination | null>(null);
  const [destinationRatings, setDestinationRatings] = useState<Record<string, FeaturedPlaceRating>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const [destinationWindow, setDestinationWindow] = useState({ key: "", count: 36 });
  const suppressTripClickRef = useRef<{ tripId: string; until: number } | null>(null);
  const tripMenuRef = useRef<HTMLElement>(null);
  const destinationSentinelRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const appIconInputRef = useRef<HTMLInputElement>(null);
  const requestedRatingIdsRef = useRef(new Set<string>());
  useFavoritesSync(favorites, setFavorites);
  useEffect(() => { try { localStorage.setItem(favoritesKey, JSON.stringify(favorites)); } catch { /* local preferences are optional */ } }, [favorites]);
  useEffect(() => { try { localStorage.setItem(themeKey, String(darkNavy)); } catch { /* local preferences are optional */ } }, [darkNavy]);
  useEffect(() => () => { if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current); }, []);
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(""), 2400);
  }, []);
  const chooseCustomAppIcon = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      showToast("Chọn ảnh dưới 10 MB để tạo icon");
      return;
    }
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) { URL.revokeObjectURL(sourceUrl); showToast("Không thể xử lý ảnh này"); return; }
      context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
      URL.revokeObjectURL(sourceUrl);
      const iconData = canvas.toDataURL("image/webp", .88);
      try {
        localStorage.setItem(appIconKey, iconData);
        setCustomAppIcon(iconData);
        showToast("Đã cập nhật icon Trip Note trên thiết bị này");
      } catch {
        showToast("Ảnh quá lớn để lưu. Hãy thử ảnh khác");
      }
    };
    image.onerror = () => { URL.revokeObjectURL(sourceUrl); showToast("Không đọc được ảnh này"); };
    image.src = sourceUrl;
  };
  useEffect(() => {
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!iconLink) return;
    iconLink.href = customAppIcon || "/app-icon.svg";
  }, [customAppIcon]);
  const requestDestinationRating = useCallback((destination: Destination) => {
    if (requestedRatingIdsRef.current.has(destination.id) || destinationRatings[destination.id]) return;
    requestedRatingIdsRef.current.add(destination.id);
    void fetchOpenStreetMapClassification(destination.id).then((rating) => {
      if (rating) setDestinationRatings((current) => ({ ...current, [destination.id]: rating }));
    }).catch(() => {
      // OSM classifications stay absent unless the source has an exact match.
      requestedRatingIdsRef.current.delete(destination.id);
    });
  }, [destinationRatings]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const menu = tripMenuRef.current;
      const target = event.target;
      if (menu && target instanceof Node && !menu.contains(target)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOnOutsidePointer, true); document.removeEventListener("keydown", closeOnEscape); };
  }, [menuOpen]);
  const selectedTypes = useMemo(() => [...new Set([...destinationTypesSelected, ...(categoryType ? [categoryType] : [])])], [categoryType, destinationTypesSelected]);
  const matchingDestinations = useMemo(() => searchDestinations(query).filter((place) => (!regions.length || regions.includes(place.macroRegion)) && (!selectedTypes.length || place.types.some((type) => selectedTypes.includes(type)))), [query, regions, selectedTypes]);
  const draftDestinationCount = useMemo(() => searchDestinations(query).filter((place) => (!draftRegions.length || draftRegions.includes(place.macroRegion)) && (!draftTypes.length || place.types.some((type) => draftTypes.includes(type)))).length, [query, draftRegions, draftTypes]);
  const visibleDestinations = useMemo(() => active === "Yêu thích" ? matchingDestinations.filter((place) => favorites.includes(place.id) || favorites.includes(place.name)) : matchingDestinations, [active, favorites, matchingDestinations]);
  const destinationListKey = `${active}|${query}|${regions.join(",")}|${selectedTypes.join(",")}|${active === "Yêu thích" ? favorites.join(",") : ""}`;
  const visibleDestinationCount = destinationWindow.key === destinationListKey ? destinationWindow.count : 36;
  const renderedDestinations = useMemo(() => visibleDestinations.slice(0, visibleDestinationCount), [visibleDestinations, visibleDestinationCount]);
  const showDiscover = active === "Khám phá";
  const emptySearch = showDiscover && Boolean(query.trim()) && visibleDestinations.length === 0;
  useEffect(() => {
    const sentinel = destinationSentinelRef.current;
    const scrollRoot = document.getElementById("dashboard-scroll-container");
    if (!sentinel || !scrollRoot || visibleDestinationCount >= visibleDestinations.length) return;
    const listKey = destinationListKey;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setDestinationWindow((current) => ({ key: listKey, count: Math.min((current.key === listKey ? current.count : 36) + 24, visibleDestinations.length) }));
    }, { root: scrollRoot, rootMargin: "900px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [destinationListKey, visibleDestinationCount, visibleDestinations.length]);
  useEffect(() => {
    if (active !== "Chuyến đi") return;
    const covers = [...new Set(matchingDestinations.slice(0, 24).flatMap((place) => place.cover ? [place.cover] : []))];
    let cancelled = false;
    const timers: number[] = [];
    const warmCovers = () => {
      covers.forEach((src, index) => {
        timers.push(window.setTimeout(() => {
          if (cancelled) return;
          const image = new Image();
          image.decoding = "async";
          image.src = src;
        }, index * 55));
      });
    };
    const idleWindow = window as unknown as { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const idleId = idleWindow.requestIdleCallback ? idleWindow.requestIdleCallback(warmCovers, { timeout: 800 }) : window.setTimeout(warmCovers, 180);
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      if (idleWindow.requestIdleCallback) idleWindow.cancelIdleCallback?.(idleId);
      else window.clearTimeout(idleId);
    };
  }, [active, matchingDestinations]);
  const filteredTrips = trips.map((trip, index) => ({ trip, index })).filter(({ trip }) => normalizeVietnamese(`${tripRouteLabel(trip)} ${trip.name} ${trip.destinations?.map((stop) => stop.name).join(" ") ?? ""} ${trip.places?.map((place) => place.name).join(" ") ?? ""}`).includes(normalizeVietnamese(tripQuery)));
  const tripDayTotal = trips.reduce((total, trip) => total + (trip.itinerary?.length ?? 0), 0);
  const tripActionTotal = trips.reduce((total, trip) => total + (trip.itinerary?.reduce((count, day) => count + day.activities.length, 0) ?? 0) + (trip.places?.length ?? 0), 0);
  const toggleFavorite = useCallback((id: string) => {
    const isSaved = favorites.includes(id);
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    showToast(isSaved ? "Đã bỏ khỏi mục yêu thích" : "Đã lưu vào mục yêu thích");
  }, [favorites, showToast]);
  const featuredDestinations = useMemo<FeaturedDestination[]>(() => {
    return searchDestinations("")
      .flatMap((destination) => {
        const rating = destinationRatings[destination.id];
        return rating?.stars ? [{ destination, rating: { ...rating, stars: rating.stars } }] : [];
      })
      .sort((a, b) => Number.parseFloat(b.rating.stars) - Number.parseFloat(a.rating.stars))
      .slice(0, 8);
  }, [destinationRatings]);
  const openAllDestinations = () => {
    onQueryChange("");
    setRegions([]);
    setCategoryType("");
    setDestinationTypesSelected([]);
    window.requestAnimationFrame(() => document.getElementById("discover-destinations")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }));
  };
  const closeFilters = () => { setDraftRegions(regions); setDraftTypes(selectedTypes); setFiltersOpen(false); };
  const openFilters = () => { setDraftRegions(regions); setDraftTypes(selectedTypes); setFiltersOpen(true); };
  const openExport = () => { setExportTripId(""); setExportQuery(""); setMenuOpen(false); setExportOpen(true); };
  const exportTrip = trips.find((item) => item.id === exportTripId);
  const exportableTrips = trips.filter((item) => normalizeVietnamese(`${tripRouteLabel(item)} ${item.name} ${item.dateRange}`).includes(normalizeVietnamese(exportQuery)));
  const applyFilters = () => { setRegions(draftRegions); setCategoryType(""); setDestinationTypesSelected(draftTypes); setFiltersOpen(false); showToast(`Đã áp dụng bộ lọc · ${draftDestinationCount} địa điểm`); };
  const clearDraftFilters = () => { setDraftRegions([]); setDraftTypes([]); showToast("Đã đặt lại bộ lọc"); };
  const toggleDraftRegion = (region: string) => setDraftRegions((current) => current.includes(region) ? current.filter((value) => value !== region) : [...current, region]);
  const toggleDraftType = (type: string) => setDraftTypes((current) => current.includes(type) ? current.filter((value) => value !== type) : [...current, type]);
  const filterSheet = createPortal(<AnimatePresence>
    {filtersOpen && <motion.div className={styles.filterBackdrop} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }} onClick={closeFilters}>
      <motion.section className={styles.filterSheet} role="dialog" aria-modal="true" aria-labelledby="destination-filter-title" initial={reduced ? false : { y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={reduced ? { duration: 0 } : { duration: .3, ease: [.22, 1, .36, 1] }} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Escape") closeFilters(); }}>
        <div className={styles.filterHandle} aria-hidden="true" />
        <div className={styles.filterSheetHeader}><div><h2 id="destination-filter-title">Bộ lọc</h2></div><button type="button" className={styles.filterReset} onClick={clearDraftFilters}>Đặt lại</button><button type="button" className={styles.filterClose} aria-label="Đóng bộ lọc" onClick={closeFilters}><X /></button></div>
        <div className={styles.filterContent}>
          <section className={styles.filterSection} aria-labelledby="region-filter-title"><div className={styles.filterSectionHeading}><h3 id="region-filter-title">KHU VỰC</h3><span>Chọn nhiều</span></div><div className={styles.filterTileGrid}>
            {destinationRegions.map((region, index) => { const RegionIcon = [Mountain, Waves, Palmtree][index]; const selected = draftRegions.includes(region); return <button key={region} type="button" aria-pressed={selected} className={selected ? styles.filterTileSelected : styles.filterTile} onClick={() => toggleDraftRegion(region)} onContextMenu={(event) => event.preventDefault()}><span className={styles.filterTileIcon}><RegionIcon /></span><strong>{region}</strong><i className={styles.filterCheck}>{selected && <Check />}</i></button>; })}
          </div></section>
          <section className={styles.filterSection} aria-labelledby="type-filter-title"><div className={styles.filterSectionHeading}><h3 id="type-filter-title">LOẠI HÌNH DU LỊCH</h3><span>Chọn nhiều</span></div><div className={`${styles.filterTileGrid} ${styles.typeTileGrid}`}>
            {destinationTypes.map((type, index) => { const TypeIcon = [Waves, Star, BookOpen, Mountain, Palmtree, MapPin, Building2, CalendarDays, SlidersHorizontal][index % 9]; const selected = draftTypes.includes(type); return <button key={type} type="button" aria-pressed={selected} className={selected ? styles.filterTileSelected : styles.filterTile} onClick={() => toggleDraftType(type)} onContextMenu={(event) => event.preventDefault()}><span className={styles.filterTileIcon}><TypeIcon /></span><strong>{type}</strong><i className={styles.filterCheck}>{selected && <Check />}</i></button>; })}
          </div></section>
        </div>
        <div className={styles.filterFooter}><button type="button" className={styles.filterApply} onClick={applyFilters}>Xem {draftDestinationCount} địa điểm</button></div>
      </motion.section>
    </motion.div>}
  </AnimatePresence>, document.body);
  const exportSheet = exportOpen && <GlassSheet title="Xuất dữ liệu" subtitle="Tìm và chọn chuyến đi cần xuất." icon={<FileSpreadsheet aria-hidden="true" />} variant="sheet" dense onClose={() => setExportOpen(false)}><div className={styles.exportChooser}><label className={styles.exportSearch}><Search aria-hidden="true" /><input value={exportQuery} onChange={(event) => setExportQuery(event.target.value)} placeholder="Tìm theo địa danh, tên hoặc ngày..." aria-label="Tìm chuyến đi để xuất" /></label>{exportableTrips.length > 4 && <p className={styles.exportScrollHint}>Cuộn danh sách để xem thêm · {exportableTrips.length} chuyến</p>}<div className={styles.exportTripList} role="listbox" aria-label="Danh sách chuyến đi">{exportableTrips.map((item) => { const selected = exportTripId === item.id; const destinationName = tripRouteLabel(item); const distinctName = item.name !== destinationName ? item.name : ""; return <button key={item.id} type="button" role="option" aria-selected={selected} className={`${styles.exportTripOption} ${selected ? styles.exportTripOptionSelected : ""}`} onClick={() => setExportTripId(item.id)}><span><strong>{destinationName}</strong><small>{[distinctName, item.dateRange].filter(Boolean).join(" · ")}</small></span><b>{item.estimate === null ? "Chưa có ngân sách" : `${item.estimate.toLocaleString("vi-VN")} đ`}</b></button>; })}{exportableTrips.length === 0 && <p className={styles.exportNoResults}>{trips.length ? "Không tìm thấy chuyến đi phù hợp." : "Chưa có chuyến đi để xuất."}</p>}</div><button type="button" className={styles.exportConfirm} disabled={!exportTrip} onClick={() => { if (!exportTrip) return; onExport(exportTrip); setExportOpen(false); }}><FileSpreadsheet aria-hidden="true" />{exportTrip ? `Xuất ${tripRouteLabel(exportTrip)} ra Excel` : "Chọn chuyến đi để tiếp tục"}</button></div></GlassSheet>;
  const deleteTripSheet = deleteTripTarget && <GlassSheet title="Xóa chuyến đi?" subtitle={`Bạn có chắc muốn xóa ${deleteTripTarget.destination || deleteTripTarget.name}?`} icon={<Trash2 aria-hidden="true" />} variant="sheet" onClose={() => setDeleteTripTarget(null)}><div className={styles.deleteTripActions}><button type="button" className={styles.deleteTripCancel} onClick={() => setDeleteTripTarget(null)}>Giữ chuyến đi</button><button type="button" className={styles.deleteTripConfirm} onClick={() => { onDeleteTrip(deleteTripTarget); setDeleteTripTarget(null); }}>Xóa chuyến đi</button></div></GlassSheet>;
  const modalOpen = filtersOpen || exportOpen || Boolean(deleteTripTarget) || Boolean(detailDestination) || Boolean(planningDestination);
  const tripFab = active === "Chuyến đi" && dockVisible && !modalOpen ? createPortal(<motion.button type="button" className={styles.tripFab} aria-label="Tạo chuyến đi mới" onClick={onCreateTrip} whileTap={reduced ? undefined : { scale: .92 }}><Plus /></motion.button>, document.body) : null;
  const toast = createPortal(<AnimatePresence>{toastMessage && <motion.div className={styles.successToast} role="status" aria-live="polite" initial={reduced ? false : { opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .98 }} transition={{ duration: reduced ? 0 : .18 }}><CheckCircle2 aria-hidden="true" /><span>{toastMessage}</span></motion.div>}</AnimatePresence>, document.body);

  return <motion.main id="dashboard-scroll-container" className={`${styles.page} ${showDiscover ? styles.discoverMode : ""} ${active === "Yêu thích" ? styles.favoritesMode : ""} ${active === "Chuyến đi" ? styles.tripMode : ""} ${active === "Cá nhân" ? styles.profileMode : ""} ${active === "Cá nhân" && !darkNavy ? styles.lightProfile : ""}`} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .18, ease: [.22, 1, .36, 1] }}>
    <div className={styles.ambient} aria-hidden="true" />
    <div className={`${styles.environment} ${active === "Chuyến đi" ? styles.tripEnvironment : ""} ${active === "Cá nhân" ? styles.profileEnvironment : ""} ${emptySearch ? styles.emptySearchEnvironment : ""}`} aria-hidden="true"><div className={styles.starField} /><motion.img className={styles.environmentEarth} src={earth} alt="" animate={reduced || showDiscover ? undefined : { rotate: [0, 2, 0, -2, 0], y: [0, -4, 0, 4, 0] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }} /><motion.img className={styles.environmentPlane} src={plane} alt="" animate={reduced || showDiscover ? undefined : { x: [0, -8, 0, 7, 0], y: [0, 5, 0, -4, 0], rotate: [-8, -5, -9, -11, -8] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} /><span className={styles.flightTrail} /></div>
    {active === "Chuyến đi" ? <header ref={tripMenuRef} className={`${styles.header} ${styles.tripManagerHeader} ${menuOpen ? styles.menuOpen : ""}`}><button type="button" className={styles.tripBack} aria-label="Quay lại khám phá" onClick={() => onChange("Khám phá")}><ArrowLeft /></button><strong>Quản lý chuyến đi</strong><div className={styles.tripHeaderActions}><button type="button" className={styles.menuButton} aria-label="Mở tùy chọn" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Ellipsis /></button></div>
      <AnimatePresence>{menuOpen && <motion.div className={styles.menu} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}><button type="button" onClick={() => { setMenuOpen(false); onImport(); }}><FileSpreadsheet />Nhập từ Excel</button><button type="button" onClick={openExport}><BookOpen />Xuất dữ liệu</button></motion.div>}</AnimatePresence>
    </header> : active === "Cá nhân" ? <header className={`${styles.header} ${styles.profileHeader}`}><strong>Hồ sơ cá nhân</strong></header> : <header className={`${styles.header} ${showDiscover ? styles.discoverHeader : ""}`}><div className={styles.brand}>{showDiscover && <span className={styles.brandMark}>{customAppIcon ? <img src={customAppIcon} alt="" /> : <Send />}</span>}<span className={showDiscover ? styles.brandCopy : ""}><strong>{showDiscover ? <>Trip<span>Vibe</span></> : "Trip Note"}</strong>{showDiscover && <small>Khám phá Việt Nam</small>}</span></div><div className={styles.headerActions}>{showDiscover ? <span className={styles.discoverCount}>{matchingDestinations.length} điểm đến</span> : <button type="button" className={styles.avatar} aria-label="Hồ sơ cá nhân" onClick={() => onChange("Cá nhân")}>{customAppIcon ? <img src={customAppIcon} alt="" /> : <UserRound />}</button>}</div></header>}

    {active === "Cá nhân" ? <section className={styles.profile}>
      <div className={styles.profileIdentity}><div className={styles.profileAvatar} aria-hidden="true">{customAppIcon ? <img src={customAppIcon} alt="" /> : "TN"}</div><div className={styles.profileIdentityCopy}><strong>TripNote</strong><span>Không gian dùng chung qua link</span><small><i /> {syncStatus === "synced" ? "Đồng bộ trên các thiết bị" : syncStatus === "connecting" ? "Đang kết nối dữ liệu" : syncStatus === "offline" ? "Đang chờ kết nối mạng" : "Lưu trên thiết bị này"}</small></div></div>
      <div className={styles.profileStats}><div><strong>{trips.length}</strong><span>Chuyến đi</span></div><div><strong>{new Set(trips.flatMap((trip) => trip.destinations?.map((stop) => stop.name) ?? [trip.destination || trip.name])).size}</strong><span>Địa điểm</span></div><div><strong>{favorites.length}</strong><span>Yêu thích</span></div></div>
      <section className={styles.profileSettings}><h2>TÙY CHỈNH ỨNG DỤNG</h2>
        <div className={styles.settingRow}><span className={styles.settingIcon}><Moon /></span><span className={styles.settingCopy}><strong>Giao diện Dark Navy</strong><small>Tối ưu hiển thị ban đêm</small></span><button type="button" role="switch" aria-checked={darkNavy} className={`${styles.themeSwitch} ${darkNavy ? styles.themeSwitchOn : ""}`} onClick={() => setDarkNavy((value) => !value)} aria-label="Bật hoặc tắt giao diện Dark Navy"><i /></button></div>
        <div className={styles.settingRow}><span className={styles.settingIcon}><Coins /></span><span className={styles.settingCopy}><strong>Đơn vị tiền tệ</strong><small>Đơn vị ngân sách chuyến đi</small></span><span className={styles.currencyPill}>VND (đ)</span></div>
        <div className={styles.settingRow}><span className={styles.settingIcon}>{customAppIcon ? <img className={styles.settingIconImage} src={customAppIcon} alt="" /> : <Smartphone />}</span><span className={styles.settingCopy}><strong>Tạo icon từ ảnh</strong><small>Chọn ảnh và dùng làm icon trong Trip Note</small></span><span className={styles.settingActions}><button type="button" className={styles.settingAction} onClick={() => appIconInputRef.current?.click()}>{customAppIcon ? "Đổi ảnh" : "Chọn ảnh"}</button>{customAppIcon && <button type="button" className={styles.resetIcon} aria-label="Khôi phục icon mặc định" onClick={() => { localStorage.removeItem(appIconKey); setCustomAppIcon(""); showToast("Đã khôi phục icon mặc định"); }}>×</button>}</span></div>
        <input ref={appIconInputRef} className={styles.hiddenIconInput} type="file" accept="image/*" aria-label="Chọn ảnh để tạo icon Trip Note" onChange={chooseCustomAppIcon} />
      </section>
      <section className={styles.profileSettings}><h2>TÀI KHOẢN & ĐỒNG BỘ</h2>
        <div className={styles.settingRow}><span className={styles.settingIcon}><UserRound /></span><span className={styles.settingCopy}><strong>Không gian TripNote</strong><small>Dữ liệu chia sẻ cho mọi thiết bị mở cùng link</small></span><span className={`${styles.syncState} ${syncStatus === "synced" ? styles.syncOnline : ""}`}><i />{syncStatus === "synced" ? "Đã đồng bộ" : syncStatus === "connecting" ? "Đang kết nối" : syncStatus === "offline" ? "Đang chờ mạng" : "Cục bộ"}</span></div>
      </section>
    </section> : <>
      {showDiscover && <div className={styles.stickySearch}>
        <div className={styles.search} role="search"><Search /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm điểm đến, bãi biển, di sản..." aria-label="Tìm kiếm điểm đến" /><button className={styles.filterToggle} type="button" aria-label="Mở bộ lọc điểm đến" aria-expanded={filtersOpen} onClick={openFilters}><SlidersHorizontal /></button></div>
        {(regions.length > 0 || selectedTypes.length > 0) && <p className={styles.filterStatus}>Đang lọc · {[...regions, ...selectedTypes].join(" · ")}</p>}
        {query.trim() && visibleDestinations.length === 0 && <p className={styles.searchEmpty}>Không tìm thấy điểm đến phù hợp.</p>}
        {normalizeVietnamese(query).startsWith("ha nam") && visibleDestinations.length > 0 && <p className={styles.searchContext}>Hà Nam hiện thuộc tỉnh Ninh Bình. Đang hiển thị điểm đến của Ninh Bình.</p>}
        {normalizeVietnamese(query).startsWith("long an") && visibleDestinations.length > 0 && <p className={styles.searchContext}>Long An cũ nay thuộc tỉnh Tây Ninh. Đang hiển thị các điểm đến khu vực Long An cũ.</p>}
      </div>}

      {showDiscover && !query.trim() && !regions.length && !selectedTypes.length && featuredDestinations.length > 0 && <section className={styles.featuredSection} aria-labelledby="featured-title">
        <div className={styles.featuredHeading}><div><span>GỢI Ý HÀNH TRÌNH</span><h2 id="featured-title">Địa điểm nổi bật</h2></div><button className={styles.featuredSwipe} type="button" aria-label={`Xem tất cả ${matchingDestinations.length} địa điểm`} onClick={openAllDestinations}><span>Xem tất cả</span><small>{matchingDestinations.length}</small><ChevronRight aria-hidden="true" /></button></div>
        <div className={styles.featuredRail}>{featuredDestinations.map(({ destination: place }, index) => <motion.button key={place.id} type="button" className={styles.featuredCard} onClick={() => { requestDestinationRating(place); setDetailDestination(place); }} whileTap={reduced ? undefined : { scale: .975 }}>
          {place.cover && <img src={place.cover} alt={`Phong cảnh ${place.name}`} loading={index === 0 ? "eager" : "lazy"} decoding="async" />}
          <span className={styles.featuredShade} />
          <span className={styles.featuredBadge}><MapPin />{place.province}</span>
          <span className={styles.featuredRating}><Star aria-hidden="true" fill="currentColor" />4.5/5</span>
          <span className={styles.featuredCopy}><small>{getDestinationDisplayType(place)}</small><strong>{place.name}</strong></span>
        </motion.button>)}</div>
      </section>}

      {active === "Chuyến đi" ? <section className={styles.tripList}>
        <div className={styles.tripIntro}><p>{tripDayTotal} ngày · {tripActionTotal} thao tác</p></div>
        <label className={styles.tripSearch}><Search /><input value={tripQuery} onChange={(event) => setTripQuery(event.target.value)} placeholder="Tìm kiếm chuyến đi..." aria-label="Tìm kiếm chuyến đi" /></label>
        <div className={styles.tripCards}>{filteredTrips.length ? filteredTrips.map(({ trip, index }) => {
          const activityCount = trip.itinerary?.reduce((count, day) => count + day.activities.length, 0) ?? 0;
          const durationDays = trip.itinerary?.length ?? (trip.startDate && trip.endDate ? Math.floor((Date.parse(`${trip.endDate}T00:00:00Z`) - Date.parse(`${trip.startDate}T00:00:00Z`)) / 86_400_000) + 1 : null);
          const spent = trip.itinerary?.flatMap((day) => day.activities).reduce((sum, activity) => sum + (activity.actualCost ?? 0), 0) ?? trip.spent;
          const remaining = trip.estimate === null ? null : Math.max(0, trip.estimate - spent);
          const cover = trip.image || searchDestinations(trip.destination || trip.name).find((place) => place.cover)?.cover || defaultTripCover;
          const formatTripDate = (value: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
          const date = trip.startDate && trip.endDate
            ? `${formatTripDate(trip.startDate)} – ${formatTripDate(trip.endDate)}`
            : trip.dateRange.split(/[–-]/)[0]?.trim();
          return <div key={trip.id} className={`${styles.tripCardRow} ${revealedDeleteId === trip.id ? styles.tripCardRowRevealed : ""}`}>
            <button type="button" className={styles.tripDeleteButton} aria-label={`Xóa chuyến ${tripRouteLabel(trip)}`} tabIndex={revealedDeleteId === trip.id ? 0 : -1} onClick={() => { setRevealedDeleteId(null); setDeleteTripTarget(trip); }}><Trash2 /><span>Xóa</span></button>
            <motion.button type="button" className={styles.tripListCard} drag="x" dragConstraints={{ left: -76, right: 0 }} dragElastic={0.04} dragMomentum={false} animate={{ x: revealedDeleteId === trip.id ? -76 : 0 }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 34 }} onDragEnd={(_, info) => { const wasOpen = revealedDeleteId === trip.id; if (Math.abs(info.offset.x) > 12) suppressTripClickRef.current = { tripId: trip.id, until: Date.now() + 500 }; if (info.offset.x < -28 || info.velocity.x < -400) setRevealedDeleteId(trip.id); else if (info.offset.x > 28 || info.velocity.x > 400) setRevealedDeleteId(null); else if (wasOpen) setRevealedDeleteId(trip.id); else setRevealedDeleteId(null); }} onClick={() => { const suppressed = suppressTripClickRef.current; if (suppressed?.tripId === trip.id && Date.now() < suppressed.until) { suppressTripClickRef.current = null; return; } if (revealedDeleteId === trip.id) { setRevealedDeleteId(null); return; } setRevealedDeleteId(null); onSelectTrip(index); onOpenTrip(trip); }}>
            <span className={styles.tripCover}>{cover && <img src={cover} alt="" loading="lazy" />}</span>
            <span className={styles.tripListCopy}>
              <strong>{tripRouteLabel(trip)}{date ? ` - ${date}` : ""}</strong>
              <small>Còn lại</small>
              <b>{remaining === null ? "Chưa đặt ngân sách" : `${remaining.toLocaleString("vi-VN")} đ`}</b>
              <span>Đã chi {spent.toLocaleString("vi-VN")} đ</span>
              {(durationDays || trip.places?.length || activityCount) ? <span className={styles.tripBadges}>{durationDays ? <i>{durationDays} ngày</i> : null}{trip.places?.length ? <i>{trip.places.length} tour</i> : activityCount ? <i>{activityCount} hoạt động</i> : null}</span> : null}
            </span>
          </motion.button></div>;
        }) : <p className={styles.tripListEmpty}>{tripQuery ? "Không tìm thấy chuyến đi phù hợp." : "Chưa có chuyến đi. Tạo chuyến đầu tiên để bắt đầu lên kế hoạch."}</p>}</div>
      </section> : <>
        <section className={styles.destinations} id="discover-destinations"><div className={styles.sectionHeading}><div><span className={styles.editorialEyebrow}>{active === "Yêu thích" ? "BỘ SƯU TẬP CỦA BẠN" : "KHÁM PHÁ VIỆT NAM"}</span><h2>{active === "Yêu thích" ? "Điểm đến yêu thích" : "Khám phá điểm đến"}</h2></div><span className={styles.editorialFeedMeta}>{visibleDestinations.length} địa điểm</span></div><div className={styles.destinationGrid}>
          {renderedDestinations.map((place, index) => <DestinationCard key={place.id} place={place} favorite={favorites.includes(place.id) || favorites.includes(place.name)} reduced={Boolean(reduced)} loading={index < 4 ? "eager" : "lazy"} highPriority={index < 2} rating={destinationRatings[place.id]} onChoose={setDetailDestination} onPlan={setPlanningDestination} onToggleFavorite={toggleFavorite} onRequestRating={requestDestinationRating} compactFavorite={active === "Yêu thích"} />)}
          {visibleDestinations.length === 0 && !(showDiscover && query.trim()) && <p className={styles.empty}>{active === "Yêu thích" ? "Chưa lưu điểm đến nào. Chạm trái tim trên một thẻ để lưu." : "Không tìm thấy điểm đến phù hợp."}</p>}
          {renderedDestinations.length < visibleDestinations.length && <div ref={destinationSentinelRef} className={styles.destinationSentinel} aria-hidden="true" />}
        </div></section>
      </>}
    </>}
    <MobileDock active={active} visible={dockVisible && !modalOpen} favoriteCount={favorites.length} tripCount={trips.length} onChange={onChange} />
    {filterSheet}
    {exportSheet}
    {deleteTripSheet}
    {detailDestination && <DestinationDetailSheet destination={detailDestination} rating={destinationRatings[detailDestination.id]} isFavorite={favorites.includes(detailDestination.id) || favorites.includes(detailDestination.name)} onToggleFavorite={() => toggleFavorite(detailDestination.id)} onClose={() => setDetailDestination(null)} onPlan={() => { setPlanningDestination(detailDestination); setDetailDestination(null); }} />}
    {planningDestination && <GlassSheet title="Thêm lên kế hoạch" subtitle={planningDestination.name} icon={<Plus aria-hidden="true" />} variant="sheet" dense className={styles.planChoiceSheet} onClose={() => setPlanningDestination(null)}><div className={styles.planChoiceList}><button type="button" onClick={() => { onChooseDestination(planningDestination); setPlanningDestination(null); }}><span className={styles.planChoiceIcon}><Plus /></span><span><strong>Tạo lịch thủ công</strong><small>Tự nhập ngày đi và các điểm dừng.</small></span><ChevronRight /></button><button type="button" onClick={() => { setPlanningDestination(null); onImport(); }}><span className={styles.planChoiceIcon}><FileSpreadsheet /></span><span><strong>Nhập lịch từ Excel</strong><small>Dùng lịch trình bạn đã có sẵn.</small></span><ChevronRight /></button></div></GlassSheet>}
    {tripFab}
    {toast}
  </motion.main>;
}
