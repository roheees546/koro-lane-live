import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://suzwhnfftfaadqslmjfo.supabase.co", // Asli Base URL
  "sb_publishable_Eto0G9aaz1MOuYiaFSeUjA_lO_iDENs" // Tumhari API Key
);