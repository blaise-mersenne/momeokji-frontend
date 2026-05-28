import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    "Supabase 환경변수가 설정되지 않았습니다. " +
    "NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.";
  console.error("[Supabase] 환경변수 누락:", {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ?? "(없음)",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "(설정됨)" : "(없음)",
  });
  throw new Error(msg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
