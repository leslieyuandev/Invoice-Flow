-- Seed EventCategory (top-level)
INSERT INTO "EventCategory" ("id","name","slug","parentId","sortOrder","createdAt","updatedAt") VALUES
  ('ecat_wedding',    'Wedding',             'wedding',          NULL, 1, NOW(), NOW()),
  ('ecat_cardelivery','Car Delivery',         'car-delivery',     NULL, 2, NOW(), NOW()),
  ('ecat_birthday',   'Birthday',             'birthday',         NULL, 3, NOW(), NOW()),
  ('ecat_kinder',     'Kindergarten',         'kindergarten',     NULL, 4, NOW(), NOW()),
  ('ecat_proposal',   'Proposal — Marriage',  'proposal-marriage', NULL, 5, NOW(), NOW()),
  ('ecat_party',      'Party Theme',          'party-theme',      NULL, 6, NOW(), NOW()),
  ('ecat_festival',   'Festival',             'festival',         NULL, 7, NOW(), NOW()),
  ('ecat_gender',     'Gender Reveal',        'gender-reveal',    NULL, 8, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Sub-category: Wedding Dinner (child of Wedding)
INSERT INTO "EventCategory" ("id","name","slug","parentId","sortOrder","createdAt","updatedAt") VALUES
  ('ecat_weddingdinner','Wedding Dinner','wedding-dinner','ecat_wedding',1,NOW(),NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Sub-categories: Festival children
INSERT INTO "EventCategory" ("id","name","slug","parentId","sortOrder","createdAt","updatedAt") VALUES
  ('ecat_mothersday',  'Mother''s Day',     'festival-mothers-day', 'ecat_festival', 1, NOW(), NOW()),
  ('ecat_fathersday',  'Father''s Day',     'festival-fathers-day', 'ecat_festival', 2, NOW(), NOW()),
  ('ecat_cny',         'Chinese New Year',  'festival-cny',         'ecat_festival', 3, NOW(), NOW()),
  ('ecat_deepavali',   'Deepavali',         'festival-deepavali',   'ecat_festival', 4, NOW(), NOW()),
  ('ecat_hariraya',    'Hari Raya',         'festival-hari-raya',   'ecat_festival', 5, NOW(), NOW()),
  ('ecat_christmas',   'Christmas',         'festival-christmas',   'ecat_festival', 6, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Wedding Dinner Packages
INSERT INTO "CatalogPackage" ("id","categoryId","name","tagline","price","originalPrice","imageUrl","isBestSeller","isActive","sortOrder","createdAt","updatedAt") VALUES
  ('cpkg_wd1','ecat_weddingdinner','Package 1','The Final Flourish',  88800,128800,NULL,false,true,1,NOW(),NOW()),
  ('cpkg_wd2','ecat_weddingdinner','Package 2','Prosperity Welcome', 188800,208800,NULL,false,true,2,NOW(),NOW()),
  ('cpkg_wd3','ecat_weddingdinner','Package 3','Lunar Aerial Garden',  88800,108800,NULL,false,true,3,NOW(),NOW())
ON CONFLICT DO NOTHING;

-- Wedding Dinner Package Features
INSERT INTO "CatalogPackageFeature" ("id","packageId","text","sortOrder") VALUES
  ('cpf_wd1_1','cpkg_wd1','1x 7ft "Money Tree" Sculpture',0),
  ('cpf_wd1_2','cpkg_wd1','30x "Lucky Ang Pao" Hanging Tags',1),
  ('cpf_wd1_3','cpkg_wd1','Gold Ingots (Yuan Bao) balloon art at the base',2),
  ('cpf_wd2_1','cpkg_wd2','1x Grand Archway Entrance (8ft×10ft)',0),
  ('cpf_wd2_2','cpkg_wd2','2x "Prosperity Pillars" flanking the main stage',1),
  ('cpf_wd2_3','cpkg_wd2','Custom Wording (Company Name in Balloon Vinyl on the Arch)',2),
  ('cpf_wd3_1','cpkg_wd3','1x 7ft "Money Tree" Sculpture',0),
  ('cpf_wd3_2','cpkg_wd3','30x "Lucky Ang Pao" Hanging Tags',1),
  ('cpf_wd3_3','cpkg_wd3','Gold Ingots (Yuan Bao) balloon art at the base',2)
ON CONFLICT DO NOTHING;

-- Car Delivery Packages
INSERT INTO "CatalogPackage" ("id","categoryId","name","tagline","price","originalPrice","imageUrl","isBestSeller","isActive","sortOrder","createdAt","updatedAt") VALUES
  ('cpkg_cd1','ecat_cardelivery','Basic Package',   NULL, 18800, NULL, NULL,false,true,1,NOW(),NOW()),
  ('cpkg_cd2','ecat_cardelivery','Standard Package',NULL, 28800, NULL, NULL,true, true,2,NOW(),NOW()),
  ('cpkg_cd3','ecat_cardelivery','Premium Package', NULL, 48800,65000, NULL,false,true,3,NOW(),NOW()),
  ('cpkg_cd4','ecat_cardelivery','Luxury Package',  NULL, 68800,100000,NULL,false,true,4,NOW(),NOW())
ON CONFLICT DO NOTHING;

-- Car Delivery Package Features
INSERT INTO "CatalogPackageFeature" ("id","packageId","text","sortOrder") VALUES
  ('cpf_cd1_1','cpkg_cd1','12x Helium Balloons',0),
  ('cpf_cd1_2','cpkg_cd1','12x Floor Balloons',1),
  ('cpf_cd1_3','cpkg_cd1','2x Gift Sculpture Balloons',2),
  ('cpf_cd2_1','cpkg_cd2','12x Helium Balloons',0),
  ('cpf_cd2_2','cpkg_cd2','12x Floor Balloons',1),
  ('cpf_cd2_3','cpkg_cd2','2x Gift Sculpture Balloons',2),
  ('cpf_cd2_4','cpkg_cd2','1x 24'' Bubble Helium Balloon with 5'' small balloons, tassel & wording',3),
  ('cpf_cd3_1','cpkg_cd3','12x Helium Balloons',0),
  ('cpf_cd3_2','cpkg_cd3','12x Floor Balloons',1),
  ('cpf_cd3_3','cpkg_cd3','2x Gift Sculpture Balloons',2),
  ('cpf_cd3_4','cpkg_cd3','1x 24'' Bubble Helium Balloon with accessories',3),
  ('cpf_cd3_5','cpkg_cd3','1x Balloon Garland',4),
  ('cpf_cd3_6','cpkg_cd3','Explode star foil balloon touch up on balloon garland (Optional)',5),
  ('cpf_cd4_1','cpkg_cd4','10x Helium Balloons',0),
  ('cpf_cd4_2','cpkg_cd4','12x Floor Balloons',1),
  ('cpf_cd4_3','cpkg_cd4','2x Gift Sculpture Balloons',2),
  ('cpf_cd4_4','cpkg_cd4','1x 24'' Bubble Balloon Standee with 5'' small balloons & tassel',3),
  ('cpf_cd4_5','cpkg_cd4','2x Balloon Garlands',4),
  ('cpf_cd4_6','cpkg_cd4','Bobo balloons touch up on balloon garland',5)
ON CONFLICT DO NOTHING;

-- Global Add-Ons
INSERT INTO "CatalogAddOn" ("id","name","price","priceLabel","imageUrl","isActive","sortOrder","createdAt","updatedAt") VALUES
  ('cao_flower',  'Flower Bouquet', 10000, 'RM100',         NULL,true,1,NOW(),NOW()),
  ('cao_foil',    'Foil Balloon',    2000, 'RM20/pcs',      NULL,true,2,NOW(),NOW()),
  ('cao_pillar',  'Stand Pillar',   10000, 'RM100',         NULL,true,3,NOW(),NOW()),
  ('cao_helium',  'Helium Balloon',    800, 'RM8/pcs',      NULL,true,4,NOW(),NOW()),
  ('cao_number',  'Number Balloon',   NULL, 'RM8–RM50/pcs', NULL,true,5,NOW(),NOW()),
  ('cao_bubble',  'Bubble Balloon',  8800, 'RM88',          NULL,true,6,NOW(),NOW()),
  ('cao_ktboard', 'KT Board',         NULL, 'RM100/meter',  NULL,true,7,NOW(),NOW())
ON CONFLICT DO NOTHING;
