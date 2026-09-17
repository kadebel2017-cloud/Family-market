-- Phase 10 seed: safe defaults only (no invented business data).

-- StoreSettings: single record id='default'. Contact/social/address left NULL
-- (phone is nullable). Preserves any existing row.
INSERT INTO "StoreSettings"
  ("id", "storeNameFr", "storeNameAr", "openingTime", "closingTime", "isOpenAutomatically", "createdAt", "updatedAt")
VALUES
  ('default', 'Family Market', 'فاميلي ماركت', '08:00', '23:00', true, now(), now())
ON CONFLICT ("id") DO NOTHING;

-- Categories: bilingual structure placeholders. Never overwrite an existing
-- image/description; only refresh names, order, active flag.
INSERT INTO "Category"
  ("id", "nameFr", "nameAr", "slug", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Fruits & Légumes', 'الفواكه والخضروات', 'fruits-legumes', true, 1, now(), now()),
  (gen_random_uuid(), 'Boissons', 'المشروبات', 'boissons', true, 2, now(), now()),
  (gen_random_uuid(), 'Produits Laitiers', 'منتجات الألبان', 'produits-laitiers', true, 3, now(), now()),
  (gen_random_uuid(), 'Épicerie', 'البقالة', 'epicerie', true, 4, now(), now()),
  (gen_random_uuid(), 'Surgelés', 'المجمدات', 'surgeles', true, 5, now(), now()),
  (gen_random_uuid(), 'Biscuits & Confiseries', 'البسكويت والحلويات', 'biscuits-confiseries', true, 6, now(), now()),
  (gen_random_uuid(), 'Hygiène & Beauté', 'النظافة والجمال', 'hygiene-beaute', true, 7, now(), now()),
  (gen_random_uuid(), 'Produits d''Entretien', 'مواد التنظيف', 'produits-entretien', true, 8, now(), now()),
  (gen_random_uuid(), 'Produits pour la Maison', 'منتجات المنزل', 'produits-maison', true, 9, now(), now()),
  (gen_random_uuid(), 'Produits pour Bébé', 'منتجات الأطفال', 'produits-bebe', true, 10, now(), now()),
  (gen_random_uuid(), 'Céréales & Petit Déjeuner', 'الحبوب ووجبة الإفطار', 'cereales-petit-dejeuner', true, 11, now(), now()),
  (gen_random_uuid(), 'Conserves & Sauces', 'المعلبات والصلصات', 'conserves-sauces', true, 12, now(), now())
ON CONFLICT ("slug") DO UPDATE SET
  "nameFr" = EXCLUDED."nameFr",
  "nameAr" = EXCLUDED."nameAr",
  "isActive" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = now();