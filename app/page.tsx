"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

interface Restaurant {
  id: number;
  name: string;
  base_score: number;
  open_at: string;
  close_at: string;
  condition_tags: string;
  taste_tags: string;
  rating?: number;
  distance_km?: number;
  price?: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [targetTime, setTargetTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    setTargetTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (targetTime) fetchRestaurants();
  }, [targetTime]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("restaurants").select("*");
    if (!error) {
      const filtered = (data || []).filter((place: Restaurant) => {
        if (!place.open_at || !place.close_at) return true;
        return targetTime >= place.open_at.substring(0, 5) && targetTime <= place.close_at.substring(0, 5);
      });
      setRestaurants(filtered.slice(0, 5));
    }
    setIsLoading(false);
  };

  return (
    // bg-brand-bg: 전역 설정에서 관리되는 배경색
    <div className="min-h-screen bg-brand-bg p-4 font-sans text-text-main">
      <div className="max-w-md mx-auto">
        
        <header className="pt-4 pb-6 flex flex-col items-center">
          <div className="flex bg-brand-card rounded-full p-1 shadow-sm mb-8">
            <button className="bg-brand-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-md">
              🍽️ 외식하기
            </button>
            <button className="text-text-sub px-6 py-2 rounded-full text-sm font-semibold">
              🏠 집밥 해먹기
            </button>
          </div>

          <div className="w-full">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight-brand mb-1">
              오늘의 맞춤 추천
            </h1>
            <p className="text-[14px] text-text-sub font-medium mb-4">당신의 취향에 맞춰 선별했어요</p>
            
            <input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="w-full bg-brand-card p-3 rounded-[12px] border border-gray-100 text-[18px] font-bold shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </header>

        <main className="flex flex-col gap-3">
          {isLoading ? (
            <div className="text-center py-20 text-text-sub">데이터 로딩 중...</div>
          ) : (
            restaurants.map((place) => (
              // rounded-card, bg-brand-card 적용
              <div key={place.id} className="bg-brand-card p-4 rounded-card shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
                <div className="flex gap-4">
                  <div className="w-[100px] h-[100px] flex-shrink-0 bg-ui-tagBg rounded-[12px] flex items-center justify-center border border-gray-200">
                    <span className="text-[11px] text-text-sub font-medium uppercase">no image</span>
                  </div>

                  <div className="flex flex-col flex-grow justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-[17px] font-bold leading-tight">{place.name}</h3>
                        <p className="text-[12px] text-text-sub mt-0.5">{place.name}</p>
                      </div>
                      <div className="bg-brand-primary text-white text-[13px] font-bold px-2 py-0.5 rounded-md">
                        {place.base_score}%
                      </div>
                    </div>

                    <div className="flex items-center text-[12px] text-text-sub font-medium mt-2">
                      <span className="text-[#FFC107] mr-1">⭐</span>
                      <span>{place.rating || "4.8"}</span>
                      <span className="mx-1.5 text-gray-300">|</span>
                      <span>{place.open_at?.substring(0, 5) || "미상"} ~ {place.close_at?.substring(0, 5) || "미상"}</span>
                      <span className="mx-1.5 text-gray-300">|</span>
                      <span>{place.distance_km || "1.2"}km</span>
                    </div>

                    <div className="text-[15px] font-extrabold mt-1">
                      {place.price ? place.price.toLocaleString() : "9,000"}원
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-50 w-full my-3" />

                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {/* ui-tagBg, text-text-tag 적용 */}
                    {JSON.parse(place.condition_tags || "[]").map((tag: string, i: number) => (
                      <span key={i} className="bg-ui-tagBg text-text-tag text-[11px] font-medium px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                    {JSON.parse(place.taste_tags || "[]").map((tag: string, i: number) => (
                      <span key={i} className="bg-ui-tagBg text-text-tag text-[11px] font-medium px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}