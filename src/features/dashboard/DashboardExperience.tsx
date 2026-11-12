import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BookOpen, Building2, CalendarDays, Check, ChevronRight, Coins, Ellipsis, FileSpreadsheet, Heart, MapPin, Moon, Mountain, Palmtree, Plus, Search, Send, SlidersHorizontal, Star, Trash2, UserRound, Waves, X } from "lucide-react";
import { createPortal } from "react-dom";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import earth from "../../assets/images/welcome/earth.png";
import plane from "../../assets/images/welcome/plane.png";
import defaultTripCover from "../../assets/images/dashboard/mountain-valley.png";
import { tripRouteLabel, type Trip } from "../trips/data";
import { destinationRegions, destinationTypes, normalizeVietnamese, searchDestinations, type Destination } from "../destinations/catalog";
import type { DashboardSection } from "../../ui/navigation/types";
import MobileDock from "../../ui/navigation/MobileDock";
import { GlassSheet } from "../../ui/sheets/GlassSheet";
import styles from "./DashboardExperience.module.css";

const favoritesKey = "tripnote-v2-favorite-destinations";
const themeKey = "tripnote-v2-dark-navy";
const destinationCategories = [
  { label: "Địa điểm", type: "Tất cả", Icon: Star },
  { label: "Núi non", type: "Núi", Icon: Mountain },
  { label: "Đô thị", type: "Đô thị", Icon: Building2 },
  { label: "Có biển", type: "Biển", Icon: Palmtree },
] as const;
type Props = { trips: Trip[]; onSelectTrip: (index: number) => void; onOpenTrip: (trip: Trip) => void; onCreateTrip: () => void; onDeleteTrip: (trip: Trip) => void; onChooseDestination: (destination: Destination) => void; onImport: () => void; onExport: (trip: Trip) => void; active: DashboardSection; onChange: (section: DashboardSection) => void; query: string; onQueryChange: (value: string) => void; dockVisible?: boolean };

type DestinationCardProps = {
  place: Destination;
  favorite: boolean;
  reduced: boolean;
  onChoose: (place: Destination) => void;
  onToggleFavorite: (id: string) => void;
};

const DestinationCard = memo(function DestinationCard({ place, favorite, reduced, onChoose, onToggleFavorite }: DestinationCardProps) {
  return <article className={styles.destinationCard}>
    <motion.button className={styles.cardOpen} type="button" aria-label={`Lập kế hoạch cho ${place.name}`} onClick={() => onChoose(place)} onContextMenu={(event) => event.preventDefault()} whileTap={reduced ? undefined : { scale: .985, transition: { duration: .12 } }}>
      {place.cover && <img src={place.cover} alt={`Phong cảnh ${place.name}`} loading="lazy" decoding="async" />}
      <span className={styles.destinationShade} />
      <span className={styles.destinationTag}>{place.types[0] ?? "Khám phá"}</span>
      <span className={styles.destinationCopy}><span className={styles.destinationMeta}><span><MapPin />{place.macroRegion}</span></span><strong>{place.name}</strong></span>
    </motion.button>
    <motion.button type="button" className={styles.favorite} aria-label={favorite ? `Bỏ lưu ${place.name}` : `Lưu ${place.name}`} aria-pressed={favorite} onClick={() => onToggleFavorite(place.id)} onContextMenu={(event) => event.preventDefault()} whileTap={reduced ? undefined : { scale: .9, transition: { type: "spring", stiffness: 500, damping: 22 } }}>
      <Heart fill={favorite ? "currentColor" : "none"} />
    </motion.button>
  </article>;
});

export default function DashboardExperience({ trips, onSelectTrip, onOpenTrip, onCreateTrip, onDeleteTrip, onChooseDestination, onImport, onExport, active, onChange, query, onQueryChange, dockVisible = true }: Props) {
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
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(favoritesKey) ?? "[]") as string[]; } catch { return []; } });
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteTripTarget, setDeleteTripTarget] = useState<Trip | null>(null);
  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const suppressTripClickRef = useRef<{ tripId: string; until: number } | null>(null);
  const tripMenuRef = useRef<HTMLElement>(null);
  useEffect(() => { try { localStorage.setItem(favoritesKey, JSON.stringify(favorites)); } catch { /* local preferences are optional */ } }, [favorites]);
  useEffect(() => { try { localStorage.setItem(themeKey, String(darkNavy)); } catch { /* local preferences are optional */ } }, [darkNavy]);
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
  const searchSuggestions = useMemo(() => query.trim() ? searchDestinations(query, regions[0] ?? "Tất cả", categoryType || selectedTypes[0] || "Tất cả").slice(0, 4) : [], [categoryType, query, regions, selectedTypes]);
  const visibleDestinations = useMemo(() => active === "Yêu thích" ? matchingDestinations.filter((place) => favorites.includes(place.id) || favorites.includes(place.name)) : matchingDestinations, [active, favorites, matchingDestinations]);
  const showDiscover = active === "Khám phá";
  const emptySearch = showDiscover && Boolean(query.trim()) && visibleDestinations.length === 0;
  const filteredTrips = trips.map((trip, index) => ({ trip, index })).filter(({ trip }) => normalizeVietnamese(`${tripRouteLabel(trip)} ${trip.name} ${trip.destinations?.map((stop) => stop.name).join(" ") ?? ""} ${trip.places?.map((place) => place.name).join(" ") ?? ""}`).includes(normalizeVietnamese(tripQuery)));
  const tripDayTotal = trips.reduce((total, trip) => total + (trip.itinerary?.length ?? 0), 0);
  const tripActionTotal = trips.reduce((total, trip) => total + (trip.itinerary?.reduce((count, day) => count + day.activities.length, 0) ?? 0) + (trip.places?.length ?? 0), 0);
  const toggleFavorite = useCallback((id: string) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]), []);
  const closeFilters = () => { setDraftRegions(regions); setDraftTypes(selectedTypes); setFiltersOpen(false); };
  const openFilters = () => { setDraftRegions(regions); setDraftTypes(selectedTypes); setFiltersOpen(true); };
  const openExport = () => { setExportTripId(""); setExportQuery(""); setMenuOpen(false); setExportOpen(true); };
  const exportTrip = trips.find((item) => item.id === exportTripId);
  const exportableTrips = trips.filter((item) => normalizeVietnamese(`${tripRouteLabel(item)} ${item.name} ${item.dateRange}`).includes(normalizeVietnamese(exportQuery)));
  const applyFilters = () => { setRegions(draftRegions); setCategoryType(""); setDestinationTypesSelected(draftTypes); setFiltersOpen(false); };
  const clearDraftFilters = () => { setDraftRegions([]); setDraftTypes([]); };
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
  const tripMenuDismiss = menuOpen ? createPortal(<button type="button" className={styles.menuDismiss} aria-label="Đóng menu tùy chọn" onPointerDown={(event) => { event.preventDefault(); setMenuOpen(false); }} />, document.body) : null;
  const tripFab = active === "Chuyến đi" && dockVisible && !filtersOpen && !exportOpen && !deleteTripTarget ? createPortal(<motion.button type="button" className={styles.tripFab} aria-label="Tạo chuyến đi mới" onClick={onCreateTrip} whileTap={reduced ? undefined : { scale: .92 }}><Plus /></motion.button>, document.body) : null;

  return <motion.main id="dashboard-scroll-container" className={`${styles.page} ${showDiscover ? styles.discoverMode : ""} ${active === "Chuyến đi" ? styles.tripMode : ""} ${active === "Cá nhân" ? styles.profileMode : ""} ${active === "Cá nhân" && !darkNavy ? styles.lightProfile : ""}`} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .18, ease: [.22, 1, .36, 1] }}>
    <div className={styles.ambient} aria-hidden="true" />
    <div className={`${styles.environment} ${active === "Chuyến đi" ? styles.tripEnvironment : ""} ${active === "Cá nhân" ? styles.profileEnvironment : ""} ${emptySearch ? styles.emptySearchEnvironment : ""}`} aria-hidden="true"><div className={styles.starField} /><motion.img className={styles.environmentEarth} src={earth} alt="" animate={reduced ? undefined : { rotate: [0, 2, 0, -2, 0], y: [0, -4, 0, 4, 0] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }} /><motion.img className={styles.environmentPlane} src={plane} alt="" animate={reduced ? undefined : { x: [0, -8, 0, 7, 0], y: [0, 5, 0, -4, 0], rotate: [-8, -5, -9, -11, -8] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} /><span className={styles.flightTrail} /></div>
    {active === "Chuyến đi" ? <header ref={tripMenuRef} className={`${styles.header} ${styles.tripManagerHeader} ${menuOpen ? styles.menuOpen : ""}`}><button type="button" className={styles.tripBack} aria-label="Quay lại khám phá" onClick={() => onChange("Khám phá")}><ArrowLeft /></button><strong>Quản lý chuyến đi</strong><div className={styles.tripHeaderActions}><button type="button" className={styles.menuButton} aria-label="Mở tùy chọn" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Ellipsis /></button></div>
      <AnimatePresence>{menuOpen && <motion.div className={styles.menu} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}><button type="button" onClick={() => { setMenuOpen(false); onImport(); }}><FileSpreadsheet />Nhập từ Excel</button><button type="button" onClick={openExport}><BookOpen />Xuất dữ liệu</button></motion.div>}</AnimatePresence>
    </header> : active === "Cá nhân" ? <header className={`${styles.header} ${styles.profileHeader}`}><strong>Hồ sơ cá nhân</strong></header> : <header className={`${styles.header} ${showDiscover ? styles.discoverHeader : ""}`}><div className={styles.brand}>{showDiscover && <span className={styles.brandMark}><Send /></span>}<span><strong>{showDiscover ? <>Trip<span>Vibe</span></> : "Trip Note"}</strong></span>{showDiscover && <><i /><small>Khám phá</small></>}</div><div className={styles.headerActions}>{showDiscover ? <span className={styles.discoverCount}>{matchingDestinations.length} điểm đến</span> : <button type="button" className={styles.avatar} aria-label="Hồ sơ cá nhân" onClick={() => onChange("Cá nhân")}><UserRound /></button>}</div></header>}

    {active === "Cá nhân" ? <section className={styles.profile}>
      <div className={styles.profileIdentity}><div className={styles.profileAvatar} aria-hidden="true">TN</div><div className={styles.profileIdentityCopy}><strong>Nhà khám phá</strong><span>Hồ sơ TripNote · Lưu trên thiết bị này</span><small><i /> Không gian cá nhân</small></div></div>
      <div className={styles.profileStats}><div><strong>{trips.length}</strong><span>Chuyến đi</span></div><div><strong>{new Set(trips.flatMap((trip) => trip.destinations?.map((stop) => stop.name) ?? [trip.destination || trip.name])).size}</strong><span>Địa điểm</span></div><div><strong>{favorites.length}</strong><span>Yêu thích</span></div></div>
      <section className={styles.profileSettings}><h2>TÙY CHỈNH ỨNG DỤNG</h2>
        <div className={styles.settingRow}><span className={styles.settingIcon}><Moon /></span><span className={styles.settingCopy}><strong>Giao diện Dark Navy</strong><small>Tối ưu hiển thị ban đêm</small></span><button type="button" role="switch" aria-checked={darkNavy} className={`${styles.themeSwitch} ${darkNavy ? styles.themeSwitchOn : ""}`} onClick={() => setDarkNavy((value) => !value)} aria-label="Bật hoặc tắt giao diện Dark Navy"><i /></button></div>
        <div className={styles.settingRow}><span className={styles.settingIcon}><Coins /></span><span className={styles.settingCopy}><strong>Đơn vị tiền tệ</strong><small>Đơn vị ngân sách chuyến đi</small></span><span className={styles.currencyPill}>VND (đ)</span></div>
      </section>
    </section> : <>
      {showDiscover && <section className={styles.greeting}><div className={styles.greetingTopline}><div><h1>Chào mừng bạn!</h1><p>Hôm nay bạn muốn đi đâu?</p></div></div></section>}
      {showDiscover && <div className={styles.stickySearch}>
        <div className={styles.search} role="search"><Search /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm kiếm điểm đến..." aria-label="Tìm kiếm điểm đến" /><button className={styles.filterToggle} type="button" aria-label="Mở bộ lọc điểm đến" aria-expanded={filtersOpen} onClick={openFilters}><SlidersHorizontal /></button></div>
        <p className={styles.filterStatus}>{regions.length || selectedTypes.length ? `Đã chọn ${regions.length + selectedTypes.length} bộ lọc` : "Chưa chọn bộ lọc nào"}</p>
        {query.trim() && visibleDestinations.length === 0 && <p className={styles.searchEmpty}>Không tìm thấy điểm đến phù hợp.</p>}
        {normalizeVietnamese(query).startsWith("ha nam") && visibleDestinations.length > 0 && <p className={styles.searchContext}>Hà Nam hiện thuộc tỉnh Ninh Bình. Đang hiển thị điểm đến của Ninh Bình.</p>}
        {searchSuggestions.length > 0 && <div className={styles.suggestions} role="listbox" aria-label="Gợi ý điểm đến">{searchSuggestions.map((place) => <button key={place.id} type="button" onClick={() => { onQueryChange(place.name); setRegions([]); setDestinationTypesSelected([]); setCategoryType(""); }}>{place.name}<small>{place.province}</small></button>)}</div>}
      </div>}

      {showDiscover && <nav className={styles.categoryRail} aria-label="Danh mục điểm đến"><div className={styles.categoryList}>{destinationCategories.map(({ label, type, Icon }) => { const selected = categoryType === type || (!categoryType && type === "Tất cả"); return <button key={label} type="button" className={selected ? styles.categoryActive : styles.category} aria-pressed={selected} onClick={() => { setCategoryType(type === "Tất cả" || categoryType === type ? "" : type); setDestinationTypesSelected([]); }}><Icon /><span>{label}</span></button>; })}</div></nav>}

      {active === "Chuyến đi" ? <section className={styles.tripList}>
        <div className={styles.tripIntro}><h1>Quản lý chuyến đi</h1><p>Tệp cần thiết cho chuyến đi · {tripDayTotal} ngày · {tripActionTotal} thao tác</p></div>
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
        <section className={styles.destinations}><div className={styles.sectionHeading}><h2>{active === "Yêu thích" ? "Địa điểm yêu thích" : "Khám phá điểm đến"}</h2>{active === "Khám phá" && <button type="button" className={styles.textAction} onClick={() => { onQueryChange(""); setRegions([]); setDestinationTypesSelected([]); setCategoryType(""); }}>Xem tất cả<ChevronRight /></button>}</div><div className={styles.destinationGrid}>
          {visibleDestinations.map((place) => <DestinationCard key={place.id} place={place} favorite={favorites.includes(place.id) || favorites.includes(place.name)} reduced={Boolean(reduced)} onChoose={onChooseDestination} onToggleFavorite={toggleFavorite} />)}
          {visibleDestinations.length === 0 && !(showDiscover && query.trim()) && <p className={styles.empty}>{active === "Yêu thích" ? "Chưa lưu điểm đến nào. Chạm trái tim trên một thẻ để lưu." : "Không tìm thấy điểm đến phù hợp."}</p>}
        </div></section>
      </>}
    </>}
    <MobileDock active={active} visible={dockVisible && !filtersOpen && !exportOpen && !deleteTripTarget} onChange={onChange} />
    {filterSheet}
    {exportSheet}
    {deleteTripSheet}
    {tripMenuDismiss}
    {tripFab}
  </motion.main>;
}
