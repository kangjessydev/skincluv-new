-- Migration 053: Tambahkan Misi Konsultasi Chatbot (Harian & Mingguan)
-- Memungkinkan pengguna mengumpulkan credit gratis dari sesi tanya jawab Skinsistant AI

INSERT INTO public.missions (slug, name, description, type, coin_reward, target_count, cooldown_hours, metadata, is_active)
VALUES
  (
    'daily_chatbot',
    'Konsultasi Chatbot Harian',
    'Tanyakan saran perawatan atau konsultasi seputar kulit ke Skinsistant AI hari ini',
    'daily',
    2,
    1,
    20,
    '{"action": "chatbot"}',
    true
  ),
  (
    'weekly_chatbot',
    '3 Sesi Tanya Kulit Minggu Ini',
    'Lakukan 3 sesi konsultasi skincare dengan Skinsistant AI dalam seminggu',
    'weekly',
    5,
    3,
    144,
    '{"action": "chatbot"}',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  coin_reward = EXCLUDED.coin_reward,
  target_count = EXCLUDED.target_count,
  cooldown_hours = EXCLUDED.cooldown_hours,
  metadata = EXCLUDED.metadata,
  is_active = EXCLUDED.is_active;
