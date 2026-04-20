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
  // 내일 DB에 추가될 컬럼들을 프론트엔드에 미리 정의해 둡니다.
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
    // 배경을 시안과 동일한 연회색(gray-50)으로 교정
    <div className="min-h-screen bg-gray-50 p-4 font-['Pretendard','Noto_Sans_KR',sans-serif] text-[#495057]">
      <div className="max-w-md mx-auto">
        
        {/* 상단: 불필요한 말풍선 제거, 토글 버튼만 직관적으로 배치 */}
        <header className="pt-4 pb-6 flex flex-col items-center">
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100 mb-8">
            <button className="bg-[#FF6B00] text-white px-6 py-2 rounded-full text-sm font-bold shadow-md">
              🍽️ 외식하기
            </button>
            <button className="text-gray-400 px-6 py-2 rounded-full text-sm font-semibold">
              🏠 집밥 해먹기
            </button>
          </div>

          <div className="w-full">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight mb-1 text-gray-900">
              오늘의 맞춤 추천
            </h1>
            <p className="text-[14px] text-gray-500 font-medium mb-4">당신의 취향에 맞춰 선별했어요</p>
            
            <input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="w-full bg-white p-3 rounded-[12px] border border-gray-200 text-[18px] font-bold text-gray-800 shadow-sm focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
            />
          </div>
        </header>

        {/* 리스트: 피그마 시안과 동일한 좌우 분할 카드 디자인 적용 */}
        <main className="flex flex-col gap-[12px]">
          {isLoading ? (
            <div className="text-center py-20 text-gray-400 font-medium">데이터를 불러오는 중입니다...</div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[16px] text-gray-400 border border-gray-100 shadow-sm">
              해당 시간에 영업 중인 식당이 없습니다.
            </div>
          ) : (
            restaurants.map((place) => (
              <div key={place.id} className="bg-white p-4 rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
                
                {/* 상단: 썸네일 + 정보 영역 (Flex Row) */}
                <div className="flex gap-4">
                  {/* 1. 더미 썸네일 영역 */}
                  <div className="w-[100px] h-[100px] flex-shrink-0 bg-gray-100 rounded-[12px] flex items-center justify-center border border-gray-200">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">no image</span>
                  </div>

                  {/* 2. 우측 텍스트 정보 영역 */}
                  <div className="flex flex-col flex-grow justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-[17px] font-bold text-gray-900 leading-tight">{place.name}</h3>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {/* DB에 서브 타이틀이 없으므로 임시로 식당 이름 반복, 추후 DB 확장 시 변경 */}
                          {place.name}
                        </p>
                      </div>
                      <div className="bg-[#FF6B00] text-white text-[13px] font-bold px-2 py-0.5 rounded-md">
                        {place.base_score}%
                      </div>
                    </div>

                    {/* 3. 별점, 소요시간, 거리 (내일 DB 연결 전까지 기본값(Fallback) 노출) */}
                    <div className="flex items-center text-[12px] text-gray-500 font-medium mt-2">
                      <span className="text-[#FFC107] mr-1">⭐</span>
                      <span>{place.rating || "4.8"}</span>
                      <span className="mx-1.5 text-gray-300">|</span>
                      <span>{place.open_at?.substring(0, 5) || "미상"} ~ {place.close_at?.substring(0, 5) || "미상"}</span>
                      <span className="mx-1.5 text-gray-300">|</span>
                      <span>{place.distance_km || "1.2"}km</span>
                    </div>

                    {/* 4. 가격 정보 */}
                    <div className="text-[15px] font-extrabold text-gray-900 mt-1">
                      {place.price ? place.price.toLocaleString() : "9,000"}원
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full my-3" />

                {/* 하단: 2-Tier 태그 시스템 (시안 스타일 적용) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      try {
                        return JSON.parse(place.condition_tags || "[]").map((tag: string, i: number) => (
                          <span key={`cond-${i}`} className="bg-gray-50 text-gray-600 text-[11px] font-medium px-2 py-1 rounded-md border border-gray-100">
                            {tag}
                          </span>
                        ));
                      } catch (e) { return null; }
                    })()}
                    {(() => {
                      try {
                        return JSON.parse(place.taste_tags || "[]").map((tag: string, i: number) => (
                          <span key={`taste-${i}`} className="bg-gray-50 text-gray-600 text-[11px] font-medium px-2 py-1 rounded-md border border-gray-100">
                            {tag}
                          </span>
                        ));
                      } catch (e) { return null; }
                    })()}
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