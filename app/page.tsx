"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ── Location Types & Constants ────────────────────────────────

type LocationId = "bucheon" | "magok";

interface LocationOption {
  id: LocationId;
  label: string;
  shortLabel: string;
  tag: string;
  lat: number;
  lng: number;
}

const LOCATIONS: LocationOption[] = [
  {
    id: "bucheon",
    label: "부천 범박동/옥길동",
    shortLabel: "부천 범박동",
    tag: "부천",
    lat: 37.4786,
    lng: 126.8195,
  },
  {
    id: "magok",
    label: "서울 마곡동",
    shortLabel: "서울 마곡동",
    tag: "마곡",
    lat: 37.5594,
    lng: 126.83,
  },
];

const DEFAULT_LOCATION: LocationId = "magok";
const LOCATION_STORAGE_KEY = "momeokji_location";

// ── Location Utils ────────────────────────────────────────────

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectLocationByGPS(): Promise<LocationId> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(DEFAULT_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest = LOCATIONS[0];
        let minDist = Infinity;
        for (const loc of LOCATIONS) {
          const d = getDistanceKm(latitude, longitude, loc.lat, loc.lng);
          if (d < minDist) { minDist = d; nearest = loc; }
        }
        resolve(nearest.id);
      },
      () => resolve(DEFAULT_LOCATION),
      { timeout: 5000 }
    );
  });
}

// ── Data Model ────────────────────────────────────────────────

interface RestaurantEntry {
  restaurantName: string;
  menuName: string;
  price: number;
  distanceKm: number;
}

interface MenuItem {
  id: number;
  menuName: string;
  displayName?: string;
  restaurants: RestaurantEntry[];
}

interface MenuItemWithGenre extends MenuItem {
  genre: string;
  mealTime: string;
}

// ── 평가(eval_simple) 타입 ─────────────────────────────────────

type EvalValue = "bad" | "okay" | "good";

interface EvalState {
  recordId: string;
  status: "pending" | EvalValue | "skipped";
}

const EVAL_OPTIONS: { value: EvalValue; label: string }[] = [
  { value: "bad", label: "내 입맛 아님 😞" },
  { value: "okay", label: "그냥저냥 😐" },
  { value: "good", label: "완전 내 스타일 😍" },
];

const EVAL_RESULT_TEXT: Record<EvalValue, string> = {
  bad: "내 입맛 아님으로 기록했어요 😞",
  okay: "그냥저냥으로 기록했어요 😐",
  good: "완전 내 스타일로 기록했어요 😍",
};

// ── 시간대 유틸 ──────────────────────────────────────────────

const MEAL_TIME_KEYWORDS: { tag: string; keywords: string[] }[] = [
  { tag: "lunch",   keywords: ["런치", "lunch", "점심", "Lunch"] },
  { tag: "dinner",  keywords: ["디너", "dinner", "저녁", "Dinner"] },
  { tag: "morning", keywords: ["모닝", "morning", "아침", "브런치"] },
  { tag: "dawn",    keywords: ["24시", "24H", "새벽"] },
];

function detectMealTime(name: string): string {
  for (const { tag, keywords } of MEAL_TIME_KEYWORDS) {
    if (keywords.some((k) => name.includes(k))) return tag;
  }
  return "all";
}

function getCurrentTimeSlot(): "morning" | "lunch" | "break" | "dinner" | "dawn" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11)  return "morning";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 17) return "break";
  if (hour >= 17)               return "dinner";
  return "dawn";
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function selectByGenreDiversity(items: MenuItemWithGenre[], count: number): MenuItemWithGenre[] {
  if (items.length <= count) return shuffle(items);

  const genreMap = new Map<string, MenuItemWithGenre[]>();
  for (const item of items) {
    const genre = item.genre || "기타";
    if (!genreMap.has(genre)) genreMap.set(genre, []);
    genreMap.get(genre)!.push(item);
  }
  for (const [g, group] of genreMap) genreMap.set(g, shuffle(group));

  const selected: MenuItemWithGenre[] = [];

  for (const genre of shuffle([...genreMap.keys()])) {
    if (selected.length >= count) break;
    const group = genreMap.get(genre)!;
    selected.push(group.shift()!);
  }

  while (selected.length < count) {
    const remaining = shuffle([...genreMap.entries()].filter(([, g]) => g.length > 0));
    if (remaining.length === 0) break;
    for (const [, group] of remaining) {
      if (selected.length >= count) break;
      selected.push(group.shift()!);
    }
  }

  return shuffle(selected);
}

async function fetchMenusFromDB(locationTag: string): Promise<MenuItem[]> {
  // 1단계: 지역 태그로 restaurants 먼저 조회
  const { data: restaurantsData, error: restaurantsError } = await supabase
    .from("restaurants")
    .select("id, name, distance_km")
    .filter("condition_tags", "cs", `["${locationTag}"]`);

  if (restaurantsError) {
    console.error("[Supabase] restaurants 조회 실패:", restaurantsError);
    throw new Error(restaurantsError.message);
  }

  if (!restaurantsData || restaurantsData.length === 0) return [];

  const restaurantIds = restaurantsData.map((r) => r.id);
  const restaurantMap = new Map(restaurantsData.map((r) => [r.id, r]));

  // 2단계: 해당 식당의 menus 조회
  const { data: menusData, error: menusError } = await supabase
    .from("menus")
    .select("id, name, display_name, genre, avg_price, parent_group")
    .in("parent_group", restaurantIds)
    .eq("is_side", false);

  if (menusError) {
    console.error("[Supabase] menus 조회 실패:", menusError);
    throw new Error(menusError.message);
  }

  if (!menusData || menusData.length === 0) return [];

  // 3단계: menu.name 기준으로 그룹핑
  const groupMap = new Map<string, MenuItemWithGenre>();
  for (const menu of menusData) {
    const restaurant = restaurantMap.get(menu.parent_group);
    if (!groupMap.has(menu.name)) {
      groupMap.set(menu.name, {
        id: menu.id,
        menuName: menu.name,
        displayName: menu.display_name ?? undefined,
        genre: menu.genre ?? "기타",
        mealTime: detectMealTime(menu.name),
        restaurants: [],
      });
    }
    if (restaurant) {
      groupMap.get(menu.name)!.restaurants.push({
        restaurantName: restaurant.name,
        menuName: menu.name,
        price: menu.avg_price ?? 0,
        distanceKm: restaurant.distance_km ?? 0,
      });
    }
  }

  // 4단계: 시간대 필터링 후 장르 다양성 기반으로 6개 선별
  const allItems = Array.from(groupMap.values());
  const hideTagsMap: Record<string, string[]> = {
    morning: ["dinner", "lunch"],
    lunch:   ["dinner", "morning"],
    break:   ["morning"],
    dinner:  ["morning", "lunch"],
    dawn:    ["morning", "lunch", "dinner"],
  };
  const hideTags = hideTagsMap[getCurrentTimeSlot()] ?? [];
  const filteredItems = allItems.filter((item) => !hideTags.includes(item.mealTime));
  return selectByGenreDiversity(filteredItems, 6).map(({ genre: _g, mealTime: _m, ...item }) => item);
}

// ── Icons ────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-mid)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconChevron({ dir = "down", size = 18, color = "var(--orange-deep)" }: { dir?: "up" | "down"; size?: number; color?: string }) {
  const d = dir === "down" ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ── GlobalHeader ─────────────────────────────────────────────

function GlobalHeader() {
  return (
    <header style={{
      height: 56, flexShrink: 0,
      borderBottom: "1px solid var(--border)",
      padding: "0 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{
        fontFamily: '"Noto Sans KR", sans-serif',
        fontWeight: 900, fontSize: 22,
        color: "var(--orange-bright)",
        letterSpacing: "-0.5px",
      }}>
        뭐먹지
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link
          href="/history"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "var(--bg-2)", borderRadius: 999,
            padding: "7px 12px",
            fontSize: 13, fontWeight: 600,
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          📋 식사 기록 보기
        </Link>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "var(--bg-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconUser />
        </div>
      </div>
    </header>
  );
}

// ── LocationPicker ────────────────────────────────────────────

function LocationPicker({
  location,
  onLocationChange,
}: {
  location: LocationId;
  onLocationChange: (id: LocationId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCATIONS.find((l) => l.id === location)!;

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  async function handleGPS() {
    setGpsLoading(true);
    setOpen(false);
    const id = await detectLocationByGPS();
    localStorage.setItem(LOCATION_STORAGE_KEY, id);
    onLocationChange(id);
    setGpsLoading(false);
  }

  function handleSelect(id: LocationId) {
    localStorage.setItem(LOCATION_STORAGE_KEY, id);
    onLocationChange(id);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative", alignSelf: "flex-start" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "var(--bg-2)", border: "none",
          borderRadius: 999, padding: "7px 12px 7px 10px",
          cursor: "pointer", fontSize: 14, fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        <span style={{ fontSize: 14 }}>📍</span>
        <span>{gpsLoading ? "위치 감지 중…" : current.shortLabel}</span>
        <IconChevron dir={open ? "up" : "down"} size={15} color="var(--text-mid)" />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          background: "#fff", borderRadius: 12,
          boxShadow: "var(--shadow-3)",
          minWidth: 210, zIndex: 100,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}>
          <button
            onClick={handleGPS}
            style={{
              width: "100%", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, color: "var(--ink-2)",
              borderBottom: "1px solid var(--border)",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 15 }}>🎯</span>
            현재 위치 사용 (GPS)
          </button>

          {LOCATIONS.map((loc, idx) => (
            <button
              key={loc.id}
              onClick={() => handleSelect(loc.id)}
              style={{
                width: "100%", padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10,
                background: loc.id === location ? "#FFF7ED" : "none",
                border: "none", cursor: "pointer",
                fontSize: 14,
                fontWeight: loc.id === location ? 700 : 400,
                color: loc.id === location ? "var(--orange-hot)" : "var(--ink)",
                borderBottom: idx < LOCATIONS.length - 1 ? "1px solid var(--border)" : "none",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 15 }}>📍</span>
              {loc.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ModeTabs ─────────────────────────────────────────────────

const TABS = [
  { id: "dineout",  label: "외식하기",   icon: "🍽️" },
  { id: "homecook", label: "집밥 해먹기", icon: "🏠" },
];

function ModeTabs({ mode, setMode }: { mode: string; setMode: (m: string) => void }) {
  return (
    <div style={{
      display: "flex", background: "var(--bg-2)",
      borderRadius: 999, padding: 4, height: 52,
    }}>
      {TABS.map((tab) => {
        const active = mode === tab.id;
        return (
          <button key={tab.id} onClick={() => setMode(tab.id)} style={{
            flex: 1, height: 44, borderRadius: 999, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontSize: 14, fontWeight: 700,
            background: active ? "var(--orange-hot)" : "transparent",
            color: active ? "#fff" : "var(--text-mid)",
            boxShadow: active ? "var(--shadow-2)" : "none",
            transition: "all .18s ease",
          }}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── HintBubble ───────────────────────────────────────────────

function HintBubble({ text }: { text: string }) {
  return (
    <div style={{
      background: "var(--bg-2)",
      color: "var(--ink-2)",
      fontSize: 14, lineHeight: "22px",
      padding: "14px 18px",
      borderRadius: "8px 24px 24px 24px",
      maxWidth: 336,
    }}>
      {text}
    </div>
  );
}

// ── SkeletonCard (로딩 중 플레이스홀더) ───────────────────────

function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 16, background: "#fff",
      boxShadow: "var(--shadow-1)",
      padding: "18px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{
        height: 18, width: "45%",
        borderRadius: 6,
        background: "linear-gradient(90deg, var(--bg-2) 25%, #e8e8e8 50%, var(--bg-2) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }} />
      <div style={{
        height: 18, width: 18,
        borderRadius: "50%",
        background: "var(--bg-2)",
      }} />
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ── GpsLoadingState ───────────────────────────────────────────

function GpsLoadingState() {
  return (
    <div style={{
      padding: "48px 20px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 48, height: 48,
        border: "4px solid var(--bg-2)",
        borderTop: "4px solid var(--orange-hot)",
        borderRadius: "50%",
        animation: "spin 0.9s linear infinite",
      }} />
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
        위치 감지 중…
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", lineHeight: "20px" }}>
        GPS로 가까운 지역을 찾고 있어요
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      padding: "48px 20px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 40 }}>🍽️</span>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
        추천 메뉴가 없어요
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", lineHeight: "20px" }}>
        아직 등록된 추천 메뉴가 없습니다.<br />조금 뒤 다시 확인해 주세요.
      </div>
    </div>
  );
}

// ── ErrorState ────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      padding: "48px 20px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 40 }}>⚠️</span>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
        데이터를 불러오지 못했어요
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", lineHeight: "20px" }}>
        {message}
      </div>
    </div>
  );
}

// ── RecommendCard ─────────────────────────────────────────────

function RecommendCard({
  item, expanded, onToggle, loggedKeys, onLogMeal, evalState, onEval,
}: {
  item: MenuItem;
  expanded: boolean;
  onToggle: () => void;
  loggedKeys: Set<string>;
  onLogMeal: (item: MenuItem, key: string) => void;
  evalState: Record<string, EvalState>;
  onEval: (key: string, value: EvalValue | "skip") => void;
}) {
  return (
    <div style={{
      borderRadius: 16, background: "#fff",
      boxShadow: "var(--shadow-1)",
      overflow: "hidden",
      transition: "box-shadow .2s",
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: "18px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
          {item.displayName ?? item.menuName}
        </span>
        <IconChevron dir={expanded ? "up" : "down"} />
      </div>

      {expanded && (
        <>
          <div style={{ height: 1, background: "var(--border)" }} />
          <div>
            {item.restaurants.map((r, i) => {
              const logKey = `${item.id}_${i}`;
              const logged = loggedKeys.has(logKey);
              const rowEvalState = evalState[logKey];
              return (
                <div
                  key={i}
                  style={{
                    borderBottom: i < item.restaurants.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "13px 20px",
                    gap: 12,
                  }}
                >
                  <a
                    href={`https://map.naver.com/p/search/${encodeURIComponent(r.restaurantName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, minWidth: 0,
                      display: "flex", alignItems: "center", gap: 12,
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: "var(--ink)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {r.restaurantName}
                      </div>
                      <div style={{
                        fontSize: 12, color: "var(--text-muted)", marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {r.menuName}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: "var(--ink)",
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {Math.round(r.price).toLocaleString('ko-KR')}원
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--text-mid)",
                      whiteSpace: "nowrap", flexShrink: 0, minWidth: 52, textAlign: "right",
                    }}>
                      {r.distanceKm}km
                    </div>
                  </a>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onLogMeal(item, logKey);
                    }}
                    disabled={logged}
                    style={{
                      flexShrink: 0,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid",
                      borderColor: logged ? "var(--border)" : "var(--orange-hot)",
                      background: logged ? "var(--bg-2)" : "#fff",
                      color: logged ? "var(--text-muted)" : "var(--orange-hot)",
                      fontSize: 12, fontWeight: 700,
                      cursor: logged ? "default" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {logged ? "기록됨 ✓" : "이거 먹었어요 ✓"}
                  </button>
                </div>
                {rowEvalState && (
                  <EvalUI
                    state={rowEvalState}
                    onEval={(value) => onEval(logKey, value)}
                    onSkip={() => onEval(logKey, "skip")}
                  />
                )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── BreaktimeBanner ───────────────────────────────────────────

function BreaktimeBanner() {
  return (
    <div style={{
      background: "#FFF7ED",
      border: "1px solid #FED7AA",
      borderRadius: 12,
      padding: "12px 16px",
      display: "flex", alignItems: "flex-start", gap: 10,
      marginBottom: 2,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <span style={{ fontSize: 13, color: "#92400E", lineHeight: "20px" }}>
        브레이크타임 시간대입니다. 방문 전 영업 여부를 확인해 주세요.
      </span>
    </div>
  );
}

// ── EvalUI ───────────────────────────────────────────────────

function EvalUI({
  state, onEval, onSkip,
}: {
  state: EvalState;
  onEval: (value: EvalValue) => void;
  onSkip: () => void;
}) {
  if (state.status === "skipped") return null;

  if (state.status !== "pending") {
    return (
      <div style={{
        padding: "0 20px 13px",
        fontSize: 13, color: "var(--text-mid)",
      }}>
        {EVAL_RESULT_TEXT[state.status]}
      </div>
    );
  }

  return (
    <div style={{
      padding: "0 20px 13px",
      display: "flex", flexWrap: "wrap", gap: 8,
    }}>
      {EVAL_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEval(opt.value);
          }}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "#fff",
            color: "var(--ink)",
            fontSize: 12, fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {opt.label}
        </button>
      ))}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSkip();
        }}
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          border: "none",
          background: "none",
          color: "var(--text-muted)",
          fontSize: 12, fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        나중에 평가할게요
      </button>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────

function Toast({ text }: { text: string }) {
  return (
    <div style={{
      position: "absolute", bottom: 96, left: "50%", transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.8)", color: "#fff",
      fontSize: 14, fontWeight: 600,
      padding: "10px 20px", borderRadius: 999,
      whiteSpace: "nowrap", zIndex: 200,
    }}>
      {text}
    </div>
  );
}

// ── FAB ──────────────────────────────────────────────────────

function FAB() {
  return (
    <button style={{
      position: "absolute", right: 20, bottom: 24,
      width: 56, height: 56, borderRadius: "50%",
      background: "var(--orange-hot)", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)",
    }}>
      <IconSearch />
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState("dineout");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationId>(DEFAULT_LOCATION);
  const [locationReady, setLocationReady] = useState(false);
  const [loggedKeys, setLoggedKeys] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [evalState, setEvalState] = useState<Record<string, EvalState>>({});

  // 앱 최초 실행: localStorage 확인 → GPS 폴백
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY) as LocationId | null;
    if (saved && LOCATIONS.some((l) => l.id === saved)) {
      setLocation(saved);
      setLocationReady(true);
    } else {
      detectLocationByGPS().then((id) => {
        localStorage.setItem(LOCATION_STORAGE_KEY, id);
        setLocation(id);
        setLocationReady(true);
      });
    }
  }, []);

  // 지역이 확정되거나 변경될 때 메뉴 재조회
  useEffect(() => {
    if (!locationReady) return;
    const locationOption = LOCATIONS.find((l) => l.id === location)!;
    setLoading(true);
    setFetchError(null);
    setExpanded(null);
    fetchMenusFromDB(locationOption.tag)
      .then(setMenus)
      .catch((err: Error) => {
        console.error("[fetchMenus] 메뉴 조회 실패:", {
          location: locationOption.id,
          tag: locationOption.tag,
          message: err.message,
          error: err,
        });
        setFetchError(err.message);
      })
      .finally(() => setLoading(false));
  }, [location, locationReady]);

  function handleLocationChange(id: LocationId) {
    setLocation(id);
  }

  async function handleLogMeal(item: MenuItem, key: string) {
    const { data, error } = await supabase
      .from("food_logs")
      .insert({
        menu_id: item.id,
        menu_name: item.displayName ?? item.menuName,
        eaten_at: new Date().toISOString(),
        eval_simple: null,
        user_id: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Supabase] food_logs 저장 실패:", error);
      return;
    }

    setLoggedKeys((prev) => new Set(prev).add(key));
    setEvalState((prev) => ({ ...prev, [key]: { recordId: data.id, status: "pending" } }));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }

  async function handleEval(key: string, value: EvalValue | "skip") {
    const current = evalState[key];
    if (!current) return;

    if (value === "skip") {
      setEvalState((prev) => ({ ...prev, [key]: { ...current, status: "skipped" } }));
      return;
    }

    const { error } = await supabase
      .from("food_logs")
      .update({ eval_simple: value })
      .eq("id", current.recordId);

    if (error) {
      console.error("[Supabase] eval_simple 업데이트 실패:", error);
      return;
    }

    setEvalState((prev) => ({ ...prev, [key]: { ...current, status: value } }));
  }

  function renderCardList() {
    if (!locationReady) {
      return <GpsLoadingState />;
    }
    if (loading) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      );
    }
    if (fetchError) {
      return <ErrorState message={fetchError} />;
    }
    if (menus.length === 0) {
      return <EmptyState />;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {getCurrentTimeSlot() === "break" && <BreaktimeBanner />}
        {menus.map((item, i) => (
          <RecommendCard
            key={item.id}
            item={item}
            expanded={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)}
            loggedKeys={loggedKeys}
            onLogMeal={handleLogMeal}
            evalState={evalState}
            onEval={handleEval}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", justifyContent: "center" }}>
      <div style={{
        width: "100%", maxWidth: 390,
        background: "#fff",
        position: "relative",
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
      }}>
        <GlobalHeader />

        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>
          <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 20 }}>
            <LocationPicker location={location} onLocationChange={handleLocationChange} />
            <ModeTabs mode={mode} setMode={setMode} />
            <HintBubble text="오늘 하루 힘들었죠? 따뜻한 국물 요리 어때요?" />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: "28px" }}>
                오늘의 맞춤 추천
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
                당신의 취향에 맞춰 선별했어요
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 20px 0" }}>
            {renderCardList()}
          </div>
        </div>

        <FAB />
        {showToast && <Toast text="기록되었어요! 🎉" />}
      </div>
    </div>
  );
}
