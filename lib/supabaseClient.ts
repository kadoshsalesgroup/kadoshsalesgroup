import * as supabaseJs from '@supabase/supabase-js';

const { createClient } = supabaseJs;

export const supabase = createClient(
  'https://rlfbiqzmjevbolrdxjzm.supabase.co', // SUPABASE_URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZmJpcXptamV2Ym9scmR4anptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTY5NTMsImV4cCI6MjA3NTI5Mjk1M30.WlNVwXNVvpSmXZOSC3W47OOm9QxnVfuBeAywU_Wosz8' // SUPABASE_ANON_KEY
);
