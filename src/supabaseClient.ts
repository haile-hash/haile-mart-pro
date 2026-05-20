// @ts-nocheck
import { createClient } from "@supabase/supabase-js";

// Đây là URL và Key thật của dự án MiniMart của bạn
const supabaseUrl = "https://jojirxgpfrxemwpghkkz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvamlyeGdwZnJ4ZW13cGdoa2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzUyNTQsImV4cCI6MjA5NDExMTI1NH0.Sny-Sft5hooh5X3J_yuUuHrZ-V1bh_8nLT5zd4uDek8";

export const supabase = createClient(supabaseUrl, supabaseKey);
