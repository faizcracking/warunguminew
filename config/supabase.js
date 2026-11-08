const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Warning: Supabase URL or Anon Key is missing in environment variables.");
}

// Client for public / authenticated client actions
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with Service Role (backend server-side operations only!)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase;

module.exports = {
  supabase,
  supabaseAdmin
};