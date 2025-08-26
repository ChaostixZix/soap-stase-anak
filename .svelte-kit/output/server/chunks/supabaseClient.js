import { createClient } from "@supabase/supabase-js";
import { P as PUBLIC_SUPABASE_URL, a as PUBLIC_SUPABASE_ANON_KEY } from "./public.js";
createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
