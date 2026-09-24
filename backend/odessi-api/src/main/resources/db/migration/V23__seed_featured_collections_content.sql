-- ══════════════════════════════════════════════════════════════
-- V23 — Seed Featured Collections (Dark Verse) Homepage Content
-- ══════════════════════════════════════════════════════════════

INSERT INTO homepage_content (
    section_key,
    title,
    eyebrow,
    headline,
    sub_headline,
    body,
    primary_cta_label,
    primary_cta_url,
    is_active,
    custom_payload
) VALUES (
    'FEATURED_COLLECTIONS',
    'Dark Verse / Featured Collections',
    'THE LATEST DROP',
    'DARK VERSE',
    'Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.',
    'Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.',
    'VIEW ALL COLLECTIONS',
    '/collections',
    TRUE,
    '[{"id":"dark-verse","title":"DARK VERSE","description":"Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.","collectionUrl":"/collections/dark-verse","ctaLabel":"EXPLORE","image":"https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85","active":true,"displayOrder":1},{"id":"monochrome-edit","title":"MONOCHROME EDIT","description":"High-density monochrome staples cut from 280 GSM combed cotton.","collectionUrl":"/collections/monochrome-edit","ctaLabel":"EXPLORE","image":"https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=85","active":true,"displayOrder":2},{"id":"rogue-arc","title":"ROGUE ARC","description":"Distressed treatments and industrial graphics inspired by cinematic antiheroes.","collectionUrl":"/collections/rogue-arc","ctaLabel":"EXPLORE","image":"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=85","active":true,"displayOrder":3}]'
) ON CONFLICT (section_key) DO UPDATE SET
    eyebrow = EXCLUDED.eyebrow,
    headline = EXCLUDED.headline,
    sub_headline = EXCLUDED.sub_headline,
    custom_payload = COALESCE(homepage_content.custom_payload, EXCLUDED.custom_payload);
