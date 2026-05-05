"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
  restaurants: RestaurantEntry[];
}

async function fetchMenusFromDB(): Promise<MenuItem[]> {
  // 1단계: menus 테이블 조회 (실제 컬럼명: id, name, avg_price, parent_group)
  const { data: menusData, error: menusError } = await supabase
    .from("menus")
    .select("id, name, avg_price, parent_group")
    .limit(6);

  if (menusError) {
    console.error("[Supabase] menus 조회 실패:", menusError);
    throw new Error(menusError.message);
  }

  // 2단계: parent_group(text)으로 restaurants 조회
  // parent_group이 text 타입이라 FK 제약이 없으므로 ! 조인 대신 수동 조인
  const restaurantIds = [...new Set(
    (menusData ?? []).map((m) => m.parent_group).filter(Boolean)
  )];

  if (restaurantIds.length === 0) return [];

  const { data: restaurantsData, error: restaurantsError } = await supabase
    .from("restaurants")
    .select("id, name, price, distance_km")
    .in("id", restaurantIds);

  if (restaurantsError) {
    console.error("[Supabase] restaurants 조회 실패:", restaurantsError);
    throw new Error(restaurantsError.message);
  }

  // 3단계: id → restaurant 맵 (parent_group이 text이므로 String으로 통일)
  const restaurantMap = new Map(
    (restaurantsData ?? []).map((r) => [String(r.id), r])
  );

  // 4단계: menu.name 기준으로 그룹핑
  const groupMap = new Map<string, MenuItem>();
  for (const menu of menusData ?? []) {
    const restaurant = restaurantMap.get(String(menu.parent_group));
    if (!groupMap.has(menu.name)) {
      groupMap.set(menu.name, { id: menu.id, menuName: menu.name, restaurants: [] });
    }
    if (restaurant) {
      groupMap.get(menu.name)!.restaurants.push({
        restaurantName: restaurant.name,
        menuName: menu.name,
        price: restaurant.price ?? menu.avg_price ?? 0,
        distanceKm: restaurant.distance_km ?? 0,
      });
    }
  }
  return Array.from(groupMap.values());
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
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "var(--bg-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconUser />
      </div>
    </header>
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
  item, expanded, onToggle,
}: {
  item: MenuItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{
      borderRadius: 16, background: "#fff",
      boxShadow: "var(--shadow-1)",
      overflow: "hidden",
      transition: "box-shadow .2s",
    }}>
      {/* 메뉴명 헤더 */}
      <div
        onClick={onToggle}
        style={{
          padding: "18px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>
          {item.menuName}
        </span>
        <IconChevron dir={expanded ? "up" : "down"} />
      </div>

      {/* 아코디언: 식당 목록 */}
      {expanded && (
        <>
          <div style={{ height: 1, background: "var(--border)" }} />
          <div>
            {item.restaurants.map((r, i) => (
              <a
                key={i}
                href={`https://map.naver.com/p/search/${encodeURIComponent(r.restaurantName)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "13px 20px",
                  gap: 12,
                  textDecoration: "none",
                  borderBottom: i < item.restaurants.length - 1 ? "1px solid var(--border)" : "none",
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
                  {r.price.toLocaleString()}원
                </div>
                <div style={{
                  fontSize: 12, color: "var(--text-mid)",
                  whiteSpace: "nowrap", flexShrink: 0, minWidth: 52, textAlign: "right",
                }}>
                  {r.distanceKm}km
                </div>
              </a>
            ))}
          </div>
        </>
      )}
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

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    fetchMenusFromDB()
      .then(setMenus)
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function renderCardList() {
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
        {menus.map((item, i) => (
          <RecommendCard
            key={item.id}
            item={item}
            expanded={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)}
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
          <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 24 }}>
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
      </div>
    </div>
  );
}
