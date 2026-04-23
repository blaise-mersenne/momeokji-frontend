"use client";

import { useState } from "react";

// ── Data Model ────────────────────────────────────────────────

interface RestaurantEntry {
  restaurantName: string;
  menuName: string;
  price: number;
  walkMinutes: number;
}

interface MenuItem {
  id: number;
  menuName: string;
  restaurants: RestaurantEntry[];
}

const MENUS: MenuItem[] = [
  {
    id: 1,
    menuName: "까르보나라",
    restaurants: [
      { restaurantName: "파스타노", menuName: "까르보나라 스파게티", price: 12000, walkMinutes: 8 },
      { restaurantName: "이탈리안 키친", menuName: "크림 까르보나라", price: 10000, walkMinutes: 5 },
      { restaurantName: "라 포르케타", menuName: "까르보나라", price: 13000, walkMinutes: 12 },
    ],
  },
  {
    id: 2,
    menuName: "제육볶음",
    restaurants: [
      { restaurantName: "한솥도시락", menuName: "제육볶음 도시락", price: 8500, walkMinutes: 3 },
      { restaurantName: "뚝배기집", menuName: "제육볶음 정식", price: 9000, walkMinutes: 7 },
    ],
  },
  {
    id: 3,
    menuName: "김치찌개",
    restaurants: [
      { restaurantName: "엄마손 식당", menuName: "묵은지 김치찌개", price: 8000, walkMinutes: 4 },
      { restaurantName: "청국장마을", menuName: "돼지고기 김치찌개", price: 8500, walkMinutes: 9 },
      { restaurantName: "24시감자탕", menuName: "김치찌개", price: 7500, walkMinutes: 6 },
    ],
  },
  {
    id: 4,
    menuName: "삼계탕",
    restaurants: [
      { restaurantName: "고려삼계탕", menuName: "전통 삼계탕", price: 16000, walkMinutes: 11 },
      { restaurantName: "토담골", menuName: "삼계탕", price: 14000, walkMinutes: 8 },
    ],
  },
  {
    id: 5,
    menuName: "라멘",
    restaurants: [
      { restaurantName: "멘야무사시", menuName: "쇼유라멘", price: 12000, walkMinutes: 6 },
      { restaurantName: "잇푸도", menuName: "시로마루모토", price: 13500, walkMinutes: 14 },
      { restaurantName: "라멘야", menuName: "돈코츠라멘", price: 11000, walkMinutes: 5 },
    ],
  },
  {
    id: 6,
    menuName: "비빔밥",
    restaurants: [
      { restaurantName: "전주비빔밥집", menuName: "전주 돌솥비빔밥", price: 9500, walkMinutes: 7 },
      { restaurantName: "한옥마을식당", menuName: "비빔밥 정식", price: 8000, walkMinutes: 10 },
    ],
  },
  {
    id: 7,
    menuName: "순대국밥",
    restaurants: [
      { restaurantName: "진주집", menuName: "순대국밥", price: 8000, walkMinutes: 3 },
      { restaurantName: "할머니순대", menuName: "순대국밥 (곱빼기)", price: 9000, walkMinutes: 8 },
    ],
  },
];

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
                  도보 {r.walkMinutes}분
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

          <div style={{ padding: "12px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {MENUS.map((item, i) => (
              <RecommendCard
                key={item.id}
                item={item}
                expanded={expanded === i}
                onToggle={() => setExpanded(expanded === i ? null : i)}
              />
            ))}
          </div>
        </div>

        <FAB />
      </div>
    </div>
  );
}
