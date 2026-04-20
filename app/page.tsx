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
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setTargetTime(`${hours}:${minutes}`);
  }, []);

  useEffect(() => {
    if (!targetTime) return;
    fetchRestaurants();
  }, [targetTime]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("restaurants").select("*");

    if (error) {
      console.error("데이터 로딩 에러:", error);
      setIsLoading(false);
      return;
    }

    const filtered = (data || []).filter((place: Restaurant) => {
      if (!place.open_at || !place.close_at) return true;
      const open = place.open_at.substring(0, 5);
      const close = place.close_at.substring(0, 5);
      return targetTime >= open && targetTime <= close;
    });

    setRestaurants(filtered.slice(0, 5));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      <div className="max-w-md mx-auto">
        <header className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold mb-2">언제 드실 예정인가요?</h1>
          <p className="text-sm text-gray-500 mb-4">선택하신 시간에 영업 중인 식당만 큐레이션 합니다.</p>
          <input
            type="time"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-colors"
          />
        </header>

        <main>
          <div className="flex justify-between items-end mb-4 px-1">
            <h2 className="text-lg font-bold">추천 식당 Top 5</h2>
            <span className="text-sm text-[#FF6B00] font-medium">{restaurants.length}곳 발견</span>
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-gray-400">알고리즘 계산 중...</div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500 shadow-sm">
              해당 시간에 영업 중인 식당이 없습니다.<br/>시간을 변경해 보세요.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {restaurants.map((place, index) => (
                <div key={place.id || index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{place.name}</h3>
                    <span className="bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-bold px-2 py-1 rounded-md">
                      매칭 {place.base_score}%
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-3 flex gap-2 font-medium">
                    <span>⏰ 영업시간: {place.open_at?.substring(0, 5)} ~ {place.close_at?.substring(0, 5)}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {(() => {
                      // 배열에 들어갈 데이터가 string(문자열) 타입임을 명시합니다.
                      let tags: string[] = []; 
                      try {
                        const cTags = typeof place.condition_tags === 'string' ? JSON.parse(place.condition_tags) : (place.condition_tags || []);
                        const tTags = typeof place.taste_tags === 'string' ? JSON.parse(place.taste_tags) : (place.taste_tags || []);
                        tags = [...cTags, ...tTags];
                      } catch(e) { tags = []; }
                      
                      return tags.map((tag: string, i: number) => (
                        <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                          {tag}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}