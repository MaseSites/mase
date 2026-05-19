// ============================================================
// MASE Supabase Configuration
// Fill in your credentials from: supabase.com → Project Settings → API
// ============================================================

window.MASE_SUPABASE = {
  url:      'PASTE_YOUR_SUPABASE_URL_HERE',      // e.g. https://abcxyz.supabase.co
  anonKey:  'PASTE_YOUR_SUPABASE_ANON_KEY_HERE', // public anon key (safe for INSERT)

  // Admin dashboard password (SHA-256 hash of your chosen password)
  // Default password: mase2025  →  change this!
  // To generate hash: https://emn178.github.io/online-tools/sha256.html
  adminPasswordHash: 'a1c2e3b4d5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',

  // Your admin email (used to sign in to Supabase to view dashboard data)
  adminEmail: 'severin.buerki9@gmail.com',
};
