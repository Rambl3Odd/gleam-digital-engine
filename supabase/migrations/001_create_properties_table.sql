-- =============================================================
-- GLEAM 3.0 — D1 Property Registry: Supabase Table Setup
-- Source: County_Assessor_ETL_Spec.md §4, Master Architecture §3.4
-- Run this in the Supabase SQL editor ONCE before the first ETL load.
-- =============================================================

-- Enable PostGIS extension (required for parcel polygons)
CREATE EXTENSION IF NOT EXISTS postgis;

-- D1 Properties table (canonical schema)
CREATE TABLE IF NOT EXISTS properties (
  property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity & Location
  parcel_id TEXT UNIQUE NOT NULL,
  address_full TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_city TEXT,
  address_state CHAR(2),
  address_zip CHAR(5) NOT NULL,
  zcta CHAR(5),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  fips_county CHAR(5),

  -- Structural Characteristics (Tier A — deterministic from assessor)
  year_built SMALLINT,
  stories_ag SMALLINT,
  sqft_ag NUMERIC(8,1) NOT NULL,          -- AGSF: ABOVE-GRADE ONLY. Never total sqft.
  sqft_bg NUMERIC(8,1),                   -- Total below-grade (finished + unfinished)
  sqft_bg_finished NUMERIC(8,1),          -- Finished basement — drives egress window inference
  bedrooms SMALLINT,
  bathrooms_full SMALLINT,
  bathrooms_half SMALLINT,
  construction_type TEXT,
  exterior_wall_code TEXT,                -- Maps to D2 siding material variants
  roof_material_code TEXT,
  heating_type TEXT,
  cooling_type TEXT,
  fireplace_count SMALLINT DEFAULT 0,
  garage_type TEXT,                       -- Inferred from garage_sqft
  garage_sqft NUMERIC(8,1),
  basement_type TEXT,                     -- slab | crawl | partial | full
  lot_sqft NUMERIC(10,1),
  assessor_quality TEXT,                  -- superior | above_average | average | below_average
  property_type TEXT,                     -- sfh | townhome | condo | duplex

  -- Sale & Market
  last_sale_date DATE,
  last_sale_price NUMERIC(12,2),
  est_market_value NUMERIC(12,2),
  mls_description_text TEXT,

  -- Computed Geometry (calculated at ETL time from Tier A fields)
  est_footprint_sqft NUMERIC(8,1),
  est_perimeter_ft NUMERIC(8,1),
  est_roof_area_sqft NUMERIC(8,1),
  est_gutter_linear_ft NUMERIC(8,1),
  cardinal_azimuth_front NUMERIC(5,1),    -- NULL until Solar API provides
  zcta_cluster TEXT,

  -- PostGIS Geometry
  parcel_polygon GEOMETRY(Polygon, 4326),
  building_footprint GEOMETRY(Polygon, 4326),

  -- Operational Metadata
  data_source_primary TEXT DEFAULT 'douglas_county_assessor',
  assessor_loaded_at TIMESTAMPTZ DEFAULT NOW(),
  rentcast_enriched_at TIMESTAMPTZ,
  solar_api_loaded_at TIMESTAMPTZ,
  hydration_status TEXT DEFAULT 'pending',
  has_mls_history BOOLEAN DEFAULT FALSE,
  renovation_flags JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_properties_parcel ON properties(parcel_id);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(address_zip);
CREATE INDEX IF NOT EXISTS idx_properties_zcta ON properties(zcta);
CREATE INDEX IF NOT EXISTS idx_properties_hydration ON properties(hydration_status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_geo ON properties USING GIST(parcel_polygon);
CREATE INDEX IF NOT EXISTS idx_properties_footprint ON properties USING GIST(building_footprint);
CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(address_full);
CREATE INDEX IF NOT EXISTS idx_properties_street ON properties(address_street);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_updated ON properties;
CREATE TRIGGER properties_updated
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Verification
SELECT 'Properties table created successfully' as status,
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'properties') as column_count;
