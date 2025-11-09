-- SATRIA Initial Seed Data
-- Run this after database migrations to populate default data

-- Insert default intelligence categories
INSERT INTO categories (id, name, slug, description, color, is_active, created_at) VALUES
  (gen_random_uuid(), 'Regional Security', 'regional-security', 'ASEAN and regional developments', '#3b82f6', true, NOW()),
  (gen_random_uuid(), 'Terrorism & Extremism', 'terrorism', 'Terrorist activities and threats', '#ef4444', true, NOW()),
  (gen_random_uuid(), 'Military & Defense', 'military-defense', 'Military operations and defense news', '#059669', true, NOW()),
  (gen_random_uuid(), 'Cyber Security', 'cyber-security', 'Cyber threats and attacks', '#8b5cf6', true, NOW()),
  (gen_random_uuid(), 'Political Instability', 'political-instability', 'Political unrest and transitions', '#f97316', true, NOW()),
  (gen_random_uuid(), 'Maritime Security', 'maritime-security', 'Piracy and maritime threats', '#0891b2', true, NOW()),
  (gen_random_uuid(), 'Critical Infrastructure', 'critical-infrastructure', 'Infrastructure security', '#eab308', true, NOW()),
  (gen_random_uuid(), 'Weapons & Proliferation', 'weapons-proliferation', 'WMD and arms trafficking', '#dc2626', true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert default data sources
INSERT INTO sources (id, name, source_type, url, is_active, credibility_score, status, error_count, created_at) VALUES
  (gen_random_uuid(), 'NewsAPI', 'news_api', 'https://newsapi.org', true, 85, 'online', 0, NOW()),
  (gen_random_uuid(), 'GNews', 'news_api', 'https://gnews.io', true, 80, 'online', 0, NOW()),
  (gen_random_uuid(), 'AlienVault OTX', 'osint', 'https://otx.alienvault.com', true, 90, 'online', 0, NOW()),
  (gen_random_uuid(), 'VirusTotal', 'osint', 'https://www.virustotal.com', true, 95, 'online', 0, NOW()),
  (gen_random_uuid(), 'Reuters RSS', 'rss', 'https://www.reuters.com/rssfeed/worldnews', true, 95, 'online', 0, NOW()),
  (gen_random_uuid(), 'BBC World News RSS', 'rss', 'http://feeds.bbci.co.uk/news/world/rss.xml', true, 95, 'online', 0, NOW()),
  (gen_random_uuid(), 'Al Jazeera RSS', 'rss', 'https://www.aljazeera.com/xml/rss/all.xml', true, 85, 'online', 0, NOW())
ON CONFLICT DO NOTHING;

-- Initialize system status (single row)
INSERT INTO system_status (id, system_version, articles_collected_today, aggregation_running, updated_at)
VALUES (1, '1.0.0', 0, false, NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Insert default keywords for each category
-- First get category IDs for reference
DO $$
DECLARE
  regional_sec_id UUID;
  terrorism_id UUID;
  military_id UUID;
  cyber_id UUID;
  political_id UUID;
  maritime_id UUID;
  infrastructure_id UUID;
  weapons_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO regional_sec_id FROM categories WHERE slug = 'regional-security';
  SELECT id INTO terrorism_id FROM categories WHERE slug = 'terrorism';
  SELECT id INTO military_id FROM categories WHERE slug = 'military-defense';
  SELECT id INTO cyber_id FROM categories WHERE slug = 'cyber-security';
  SELECT id INTO political_id FROM categories WHERE slug = 'political-instability';
  SELECT id INTO maritime_id FROM categories WHERE slug = 'maritime-security';
  SELECT id INTO infrastructure_id FROM categories WHERE slug = 'critical-infrastructure';
  SELECT id INTO weapons_id FROM categories WHERE slug = 'weapons-proliferation';

  -- Regional Security keywords
  IF regional_sec_id IS NOT NULL THEN
    INSERT INTO keywords (id, category_id, keyword, keyword_type, is_active, created_at) VALUES
      (gen_random_uuid(), regional_sec_id, 'ASEAN', 'default', true, NOW()),
      (gen_random_uuid(), regional_sec_id, 'Southeast Asia', 'default', true, NOW()),
      (gen_random_uuid(), regional_sec_id, 'regional security', 'default', true, NOW()),
      (gen_random_uuid(), regional_sec_id, 'border conflict', 'default', true, NOW()),
      (gen_random_uuid(), regional_sec_id, 'territorial dispute', 'default', true, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Terrorism & Extremism keywords
  IF terrorism_id IS NOT NULL THEN
    INSERT INTO keywords (id, category_id, keyword, keyword_type, is_active, created_at) VALUES
      (gen_random_uuid(), terrorism_id, 'terrorism', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'terrorist attack', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'bombing', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'hostage', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'kidnapping', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'militant', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'extremist', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'insurgent', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'jihadist', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'ISIS', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'Al-Qaeda', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'Jemaah Islamiyah', 'default', true, NOW()),
      (gen_random_uuid(), terrorism_id, 'Abu Sayyaf', 'default', true, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Military & Defense keywords
  IF military_id IS NOT NULL THEN
    INSERT INTO keywords (id, category_id, keyword, keyword_type, is_active, created_at) VALUES
      (gen_random_uuid(), military_id, 'military', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'defense', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'army', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'navy', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'air force', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'weapons', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'missile', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'drone', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'submarine', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'fighter jet', 'default', true, NOW()),
      (gen_random_uuid(), military_id, 'military exercise', 'default', true, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Cyber Security keywords
  IF cyber_id IS NOT NULL THEN
    INSERT INTO keywords (id, category_id, keyword, keyword_type, is_active, created_at) VALUES
      (gen_random_uuid(), cyber_id, 'cyber attack', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'cyberattack', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'hack', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'data breach', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'malware', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'ransomware', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'APT', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'vulnerability', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'exploit', 'default', true, NOW()),
      (gen_random_uuid(), cyber_id, 'cybersecurity', 'default', true, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Political Instability keywords
  IF political_id IS NOT NULL THEN
    INSERT INTO keywords (id, category_id, keyword, keyword_type, is_active, created_at) VALUES
      (gen_random_uuid(), political_id, 'coup', 'default', true, NOW()),
      (gen_random_uuid(), political_id, 'political unrest', 'default', true, NOW()),
      (gen_random_uuid(), political_id, 'protest', 'default', true, NOW()),
      (gen_random_uuid(), political_id, 'demonstration', 'default', true, NOW()),
      (gen_random_uuid(), political_id, 'election', 'default', true, NOW()),
      (gen_random_uuid(), political_id, 'government instability', 'default', true, NOW()),
      (gen_random_uuid(), political_id, 'civil conflict', 'default', true, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Maritime Security keywords
  IF maritime_id IS NOT NULL THEN
    INSERT INTO keywords (id, category_id, keyword, keyword_type, is_active, created_at) VALUES
      (gen_random_uuid(), maritime_id, 'South China Sea', 'default', true, NOW()),
      (gen_random_uuid(), maritime_id, 'Spratly', 'default', true, NOW()),
      (gen_random_uuid(), maritime_id, 'Paracel', 'default', true, NOW()),
      (gen_random_uuid(), maritime_id, 'piracy', 'default', true, NOW()),
      (gen_random_uuid(), maritime_id, 'illegal fishing', 'default', true, NOW()),
      (gen_random_uuid(), maritime_id, 'naval', 'default', true, NOW()),
      (gen_random_uuid(), maritime_id, 'maritime security', 'default', true, NOW()),
      (gen_random_uuid(), maritime_id, 'shipping lane', 'default', true, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Critical Infrastructure keywords
  IF infrastructure_id IS NOT NULL THEN
    INSERT INTO keywords (id, category_id, keyword, keyword_type, is_active, created_at) VALUES
      (gen_random_uuid(), infrastructure_id, 'critical infrastructure', 'default', true, NOW()),
      (gen_random_uuid(), infrastructure_id, 'energy security', 'default', true, NOW()),
      (gen_random_uuid(), infrastructure_id, 'power grid', 'default', true, NOW()),
      (gen_random_uuid(), infrastructure_id, 'water security', 'default', true, NOW()),
      (gen_random_uuid(), infrastructure_id, 'food security', 'default', true, NOW()),
      (gen_random_uuid(), infrastructure_id, 'transportation infrastructure', 'default', true, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Weapons & Proliferation keywords
  IF weapons_id IS NOT NULL THEN
    INSERT INTO keywords (id, category_id, keyword, keyword_type, is_active, created_at) VALUES
      (gen_random_uuid(), weapons_id, 'nuclear', 'default', true, NOW()),
      (gen_random_uuid(), weapons_id, 'chemical weapons', 'default', true, NOW()),
      (gen_random_uuid(), weapons_id, 'biological weapons', 'default', true, NOW()),
      (gen_random_uuid(), weapons_id, 'WMD', 'default', true, NOW()),
      (gen_random_uuid(), weapons_id, 'arms trafficking', 'default', true, NOW()),
      (gen_random_uuid(), weapons_id, 'weapons testing', 'default', true, NOW()),
      (gen_random_uuid(), weapons_id, 'non-proliferation', 'default', true, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- Create default admin user (password: Admin@123456)
-- Note: This should be changed immediately after first login
INSERT INTO users (id, email, password_hash, full_name, role, mfa_enabled, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@satria.army.mil.my',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5UpJ7.H9vG/4u',
  'System Administrator',
  'admin',
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Seed data inserted successfully';
  RAISE NOTICE 'Default admin credentials: admin@satria.army.mil.my / Admin@123456';
  RAISE NOTICE 'Please change the admin password immediately after first login';
END $$;
