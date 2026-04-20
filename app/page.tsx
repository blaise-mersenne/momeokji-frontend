import FoodRecommendationCard from '../components/FoodRecommendationCard';

export default function Home() {
  // Supabase에서 가져올 데이터를 가정하여 만든 더미 데이터입니다.
  const dummyData = {
    name: '제육볶음 정식 (할머니 손맛)',
    base_score: 95,
    condition_tags: ['점심한정', '11:00~14:00'],
    taste_tags: ['#계란후라이', '#매콤달콤', '#밥도둑']
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        {/* 모바일 화면 너비를 시뮬레이션하기 위한 래퍼입니다 */}
        <h1 className="text-2xl font-bold text-center mb-6">뭐먹지 메인 홈 미리보기</h1>
        
        {/* 방금 만든 카드를 불러옵니다 */}
        <FoodRecommendationCard data={dummyData} />
      </div>
    </main>
  );
}