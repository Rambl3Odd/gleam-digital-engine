-- =============================================================
-- GLEAM ETL — Post-Load Data Quality Checks (§8)
-- Run these after every load to catch issues early.
-- =============================================================

-- 1. AGSF violations (should be 0)
SELECT COUNT(*) as bad_agsf FROM properties 
WHERE sqft_ag IS NULL OR sqft_ag <= 0;

-- 2. Suspected total-sqft contamination
SELECT parcel_id, address_full, sqft_ag, sqft_bg, 
       sqft_ag + COALESCE(sqft_bg, 0) as total
FROM properties 
WHERE sqft_ag > 4000 AND sqft_bg > 500
ORDER BY sqft_ag DESC LIMIT 20;

-- 3. Property type distribution
SELECT property_type, COUNT(*) as cnt 
FROM properties GROUP BY property_type ORDER BY cnt DESC;

-- 4. Year built distribution
SELECT 
  CASE 
    WHEN year_built < 1980 THEN 'pre-1980'
    WHEN year_built < 2000 THEN '1980-1999'
    WHEN year_built < 2010 THEN '2000-2009'
    WHEN year_built < 2020 THEN '2010-2019'
    ELSE '2020+'
  END as era,
  COUNT(*) as cnt
FROM properties GROUP BY era ORDER BY era;

-- 5. Geometry load status
SELECT 
  COUNT(*) as total,
  COUNT(parcel_polygon) as has_polygon,
  COUNT(*) - COUNT(parcel_polygon) as missing_polygon
FROM properties;

-- 6. ZIP code distribution
SELECT address_zip, COUNT(*) as cnt 
FROM properties GROUP BY address_zip ORDER BY cnt DESC LIMIT 10;

-- 7. Quality grade distribution
SELECT assessor_quality, COUNT(*) as cnt 
FROM properties GROUP BY assessor_quality ORDER BY cnt DESC;


-- =============================================================
-- GOLDEN SET EXTRACTION
-- Pull assessor data for the 32 Golden Set properties.
-- These are the addresses from the property corpus that need
-- real AGSF to unblock the V7 fenestration test module.
-- =============================================================

SELECT 
  address_full,
  parcel_id,
  sqft_ag as agsf,
  stories_ag,
  bedrooms,
  assessor_quality,
  sqft_bg_finished as bsmt_finished,
  COALESCE(sqft_bg, 0) - COALESCE(sqft_bg_finished, 0) as bsmt_unfinished,
  garage_sqft,
  garage_type,
  year_built,
  exterior_wall_code,
  property_type,
  lot_sqft,
  est_footprint_sqft,
  est_perimeter_ft,
  est_roof_area_sqft,
  est_gutter_linear_ft
FROM properties
WHERE address_full ILIKE ANY(ARRAY[
  '%15720 State Highway 83%',
  '%244 Cheney%',
  '%276 Steiner%',
  '%320 E Miller%',
  '%1923 Rose Petal%',
  '%1999 Champion%',
  '%2154 Treetop%',
  '%2159 Treetop%',
  '%2168 Treetop%',
  '%2182 Treetop%',
  '%2379 Haystack%',
  '%2490 Trailblazer%',
  '%2559 Mayotte%',
  '%2625 Bellavista%',
  '%2633 Bellavista%',
  '%2683 Keepsake%',
  '%2751 Black Canyon%',
  '%2788 Dreamcatcher%',
  '%2796 Black Canyon%',
  '%3105 Rising Moon%',
  '%3132 Keepsake%',
  '%3179 Dragonfly%',
  '%3300 Springmeadow%',
  '%3310 Hardin%',
  '%3469 Amber%Sun%',
  '%3496 Nez Perce%',
  '%3502 Nez Perce%',
  '%3638 Eaglesong%',
  '%3642 Maldives%',
  '%3911 Forever%',
  '%4033 S Carson%',
  '%44 Aries%'
])
ORDER BY address_full;
