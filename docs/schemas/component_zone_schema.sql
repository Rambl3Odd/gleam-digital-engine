-- ═══════════════════════════════════════════════════════════════════════════
-- GLEAM SERVICES LLC — Component-Zone Architecture
-- Supabase PostgreSQL Schema v1.0
-- March 2026
--
-- Two-Level Zone Model:
--   Level 1: Component-Zone (atomic unit of pricing, quality, lifecycle)
--   Level 2: Access Cluster (scheduling unit for sequencer optimization)
--
-- Layer Architecture:
--   Reference Layer  → Slowly changing domain knowledge (systems, materials,
--                      degradation physics, manufacturer specs, regulations)
--   Property Layer   → Per-address structured data (assessor, RentCast,
--                      computed component inventory, spatial groupings)
--   Observation Layer → Append-only evidence log (vision, tech, customer,
--                      photo analysis — never overwritten, always appended)
--   Operational Layer → Service definitions, precedence edges, priors,
--                      and the computed lifecycle/nudge outputs
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";       -- for parcel polygons & spatial queries


-- ─────────────────────────────────────────────────────────────────────────
-- ██  REFERENCE LAYER — Domain Knowledge (rarely changes)
-- ─────────────────────────────────────────────────────────────────────────

-- ┌─────────────────────────────────────────────────────────────┐
-- │  ref_systems                                                 │
-- │  Top-level grouping: Roof Envelope, Gutter & Drainage, etc. │
-- │  ~12 rows. Changes only when adding a new service vertical.  │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE ref_systems (
    system_id           TEXT PRIMARY KEY,          -- 'roof_envelope', 'gutter_drainage', etc.
    display_name        TEXT NOT NULL,             -- 'Roof Envelope'
    display_order       INT NOT NULL DEFAULT 0,    -- sort order for customer-facing views
    icon_key            TEXT,                      -- UI icon reference
    description         TEXT,
    is_gleam_direct     BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = partner-only system
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data (representative, not exhaustive)
INSERT INTO ref_systems (system_id, display_name, display_order, is_gleam_direct) VALUES
    ('roof_envelope',       'Roof Envelope',            1,  TRUE),
    ('gutter_drainage',     'Gutter & Drainage',        2,  TRUE),
    ('building_envelope',   'Building Envelope (Siding)', 3, TRUE),
    ('fenestration',        'Windows & Doors',          4,  TRUE),
    ('deck_outdoor',        'Deck & Outdoor Living',    5,  TRUE),
    ('fence_boundary',      'Fence & Boundary',         6,  TRUE),
    ('hardscape',           'Hardscape & Flatwork',     7,  TRUE),
    ('electrical_lighting', 'Electrical & Lighting',    8,  TRUE),
    ('hvac_ventilation',    'HVAC & Ventilation',       9,  FALSE),
    ('landscape_vegetation','Landscape & Vegetation',   10, FALSE),
    ('plumbing_exterior',   'Plumbing (Exterior)',      11, FALSE),
    ('solar_panels',        'Solar Panel System',       12, TRUE);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  ref_component_classes                                       │
-- │  Component types within each system. ~120-150 rows.          │
-- │  Each class maps to one or more zones in the spatial model.  │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE ref_component_classes (
    class_id            TEXT PRIMARY KEY,          -- 'roof_surface', 'gutter_trough', etc.
    system_id           TEXT NOT NULL REFERENCES ref_systems(system_id),
    display_name        TEXT NOT NULL,
    description         TEXT,

    -- Spatial pattern: tells the hydration engine WHERE to expect this component
    -- and HOW to auto-generate component-zones from assessor data
    typical_zone_pattern    TEXT NOT NULL,         -- 'roof_plane', 'perimeter_eave',
                                                   -- 'face_band', 'face_unit', 'ground',
                                                   -- 'interior', 'point_feature'
    typical_height_tiers    TEXT[] NOT NULL DEFAULT '{}', -- e.g. {'HL.1','HL.2'}
    quantity_unit           TEXT NOT NULL,         -- 'sqft', 'linear_ft', 'count', 'each'
    quantity_estimation_method TEXT,               -- 'footprint_area_x_pitch',
                                                   -- 'perimeter_x_factor',
                                                   -- 'zcta_prior', 'bedroom_proxy', etc.

    -- Lifecycle tracking
    is_lifecycle_tracked    BOOLEAN NOT NULL DEFAULT TRUE,
    failure_consequence     TEXT,                  -- 'cosmetic', 'structural', 'safety', 'water_intrusion'
    consequence_cost_low    NUMERIC(10,2),         -- $ low end of failure consequence
    consequence_cost_high   NUMERIC(10,2),         -- $ high end of failure consequence

    -- Partner referral
    partner_category        TEXT,                  -- null = Gleam-direct, else partner type
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data (Gleam-direct components — representative sample)
INSERT INTO ref_component_classes (class_id, system_id, display_name, typical_zone_pattern, typical_height_tiers, quantity_unit, quantity_estimation_method, failure_consequence, consequence_cost_low, consequence_cost_high) VALUES
    -- Roof Envelope
    ('roof_surface',        'roof_envelope',    'Roof Surface',             'roof_plane',       '{"HL.3"}',         'sqft',     'footprint_area_x_pitch',   'water_intrusion',  8000, 25000),
    ('roof_jack_boot',      'roof_envelope',    'Roof Jack Boot Flashing',  'point_feature',    '{"HL.3"}',         'count',    'fixture_count_proxy',      'water_intrusion',  5000, 15000),
    ('ridge_cap',           'roof_envelope',    'Ridge Cap',                'perimeter_ridge',  '{"HL.3"}',         'linear_ft','ridge_length_from_solar',  'water_intrusion',  2000, 8000),
    ('valley_flashing',     'roof_envelope',    'Valley Flashing',          'perimeter_valley', '{"HL.3"}',         'linear_ft','valley_count_from_solar',  'water_intrusion',  3000, 12000),
    ('chimney_cap',         'roof_envelope',    'Chimney Cap & Crown',      'point_feature',    '{"HL.3"}',         'count',    'fireplace_count_proxy',    'water_intrusion',  2000, 10000),
    ('soffit_panel',        'roof_envelope',    'Soffit Panel',             'perimeter_eave',   '{"HL.1","HL.2"}',  'sqft',     'perimeter_x_depth',        'cosmetic',         500,  3000),
    ('fascia_board',        'roof_envelope',    'Fascia Board',             'perimeter_eave',   '{"HL.1","HL.2"}',  'linear_ft','eave_perimeter',           'structural',       1000, 5000),
    ('drip_edge',           'roof_envelope',    'Drip Edge',                'perimeter_eave',   '{"HL.1","HL.2"}',  'linear_ft','eave_perimeter',           'water_intrusion',  500,  3000),

    -- Gutter & Drainage
    ('gutter_trough',       'gutter_drainage',  'Gutter Trough',            'perimeter_eave',   '{"HL.1","HL.2"}',  'linear_ft','perimeter_x_factor',       'water_intrusion',  2000, 10000),
    ('gutter_sealant',      'gutter_drainage',  'Gutter Seam Sealant',      'perimeter_eave',   '{"HL.1","HL.2"}',  'count',    'gutter_length_div_10',     'water_intrusion',  500,  5000),
    ('downspout',           'gutter_drainage',  'Downspout',                'face_vertical',    '{"HL.1","HL.2"}',  'count',    'gutter_length_div_35',     'water_intrusion',  500,  3000),
    ('downspout_extension', 'gutter_drainage',  'Downspout Extension',      'ground',           '{"HL.1"}',         'count',    'downspout_count',          'water_intrusion',  200,  2000),
    ('gutter_guard',        'gutter_drainage',  'Gutter Guard System',      'perimeter_eave',   '{"HL.1","HL.2"}',  'linear_ft','unknown_default',          'cosmetic',         NULL, NULL),

    -- Building Envelope (Siding)
    ('siding',              'building_envelope','Siding',                   'face_band',        '{"HL.1","HL.2"}',  'sqft',     'wall_area_by_face',        'structural',       3000, 20000),
    ('trim_board',          'building_envelope','Trim / Accent Board',      'face_band',        '{"HL.1","HL.2"}',  'linear_ft','window_perimeter_proxy',   'cosmetic',         500,  3000),
    ('stone_veneer',        'building_envelope','Stone Veneer',             'face_band',        '{"HL.1"}',         'sqft',     'vision_required',          'structural',       2000, 15000),

    -- Fenestration
    ('window_unit',         'fenestration',     'Window Unit',              'face_unit',        '{"HL.1","HL.2"}',  'count',    'zcta_prior',               'cosmetic',         300,  2000),
    ('window_egress',       'fenestration',     'Basement Egress Window',   'face_unit',        '{"HL.1"}',         'count',    'bedroom_proxy',            'safety',           500,  3000),
    ('window_skylight',     'fenestration',     'Skylight',                 'roof_plane',       '{"HL.3"}',         'count',    'vision_required',          'water_intrusion',  1000, 5000),
    ('entry_door',          'fenestration',     'Entry Door',               'face_unit',        '{"HL.1"}',         'count',    'fixed_default_2',          'cosmetic',         500,  3000),
    ('sliding_door',        'fenestration',     'Sliding / Patio Door',     'face_unit',        '{"HL.1"}',         'count',    'bedroom_proxy_rear',       'cosmetic',         800,  4000),
    ('window_track',        'fenestration',     'Window Track & Sill',      'face_unit',        '{"HL.1","HL.2"}',  'count',    'window_count_match',       'cosmetic',         NULL, NULL),

    -- Deck & Outdoor
    ('deck_surface',        'deck_outdoor',     'Deck Surface',             'ground',           '{"HL.1"}',         'sqft',     'assessor_or_vision',       'structural',       2000, 15000),
    ('deck_railing',        'deck_outdoor',     'Deck Railing',             'ground',           '{"HL.1"}',         'linear_ft','deck_perimeter_proxy',     'safety',           500,  5000),
    ('patio_cover',         'deck_outdoor',     'Patio Cover / Pergola',    'ground',           '{"HL.1"}',         'sqft',     'vision_required',          'cosmetic',         1000, 8000),

    -- Fence
    ('fence_panel',         'fence_boundary',   'Fence Panel',              'perimeter_ground', '{"HL.1"}',         'linear_ft','parcel_perimeter_minus_front', 'cosmetic',     1000, 8000),

    -- Hardscape
    ('driveway',            'hardscape',        'Driveway',                 'ground',           '{"HL.1"}',         'sqft',     'footprint_x_factor',       'cosmetic',         1000, 8000),
    ('walkway',             'hardscape',        'Walkway / Sidewalk',       'ground',           '{"HL.1"}',         'sqft',     'fixed_default_estimate',   'cosmetic',         200,  2000),
    ('patio_hardscape',     'hardscape',        'Patio (Concrete/Paver)',   'ground',           '{"HL.1"}',         'sqft',     'assessor_or_vision',       'cosmetic',         500,  5000),

    -- Electrical & Lighting
    ('perm_lighting_track', 'electrical_lighting','Permanent Lighting Track','perimeter_eave',  '{"HL.1","HL.2","HL.3"}','linear_ft','eave_perimeter',      'cosmetic',         NULL, NULL),
    ('outlet_exterior',     'electrical_lighting','Exterior Outlet / GFCI', 'point_feature',    '{"HL.1"}',         'count',    'vision_or_onsite',         'safety',           200,  1000),
    ('service_drop',        'electrical_lighting','Electrical Service Drop', 'point_feature',    '{"HL.2","HL.3"}',  'count',    'fixed_default_1',          'safety',           NULL, NULL),

    -- HVAC (partner-level, shallow detail)
    ('ac_condenser',        'hvac_ventilation', 'AC Condenser Unit',        'point_feature',    '{"HL.1"}',         'count',    'assessor_cooling_type',    'comfort',          3000, 12000),
    ('furnace_bvent',       'hvac_ventilation', 'Furnace B-Vent / Flue',   'point_feature',    '{"HL.3"}',         'count',    'assessor_heating_type',    'safety',           500,  5000),
    ('dryer_vent',          'hvac_ventilation', 'Dryer Vent Termination',   'face_unit',        '{"HL.1"}',         'count',    'fixed_default_1',          'safety',           200,  15000),

    -- Plumbing (partner-level)
    ('plumbing_vent',       'plumbing_exterior','Plumbing Vent Stack',      'point_feature',    '{"HL.3"}',         'count',    'bathroom_count_proxy',     'cosmetic',         NULL, NULL),
    ('hose_bib',            'plumbing_exterior','Hose Bib / Spigot',       'point_feature',    '{"HL.1"}',         'count',    'vision_or_onsite',         'cosmetic',         100,  500),

    -- Solar
    ('solar_panel_array',   'solar_panels',     'Solar Panel Array',        'roof_plane',       '{"HL.3"}',         'count',    'vision_required',          'structural',       5000, 30000);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  ref_material_variants                                       │
-- │  Material options per component class, with degradation      │
-- │  physics parameters. ~300-400 rows.                          │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE ref_material_variants (
    variant_id          TEXT PRIMARY KEY,          -- 'asphalt_architectural', 'cedar_shake', etc.
    class_id            TEXT NOT NULL REFERENCES ref_component_classes(class_id),
    display_name        TEXT NOT NULL,
    description         TEXT,

    -- Degradation Physics (Weibull parameters)
    rated_life_years        NUMERIC(5,1),          -- manufacturer baseline at sea level
    weibull_shape           NUMERIC(4,2) DEFAULT 3.0,  -- >1 = aging failure (most components)
    uv_acceleration_factor  NUMERIC(4,2) DEFAULT 1.0,  -- multiplier per 1000 ft elevation
    freeze_thaw_accel       NUMERIC(4,2) DEFAULT 1.0,  -- multiplier for >60 annual cycles
    humidity_accel          NUMERIC(4,2) DEFAULT 1.0,  -- multiplier for >70% avg humidity
    hail_vulnerability      TEXT DEFAULT 'low',        -- 'none','low','moderate','high','extreme'

    -- Service compatibility (what can/can't be done to this material)
    max_psi                 INT,                       -- NULL = no pressure wash applicable
    soft_wash_compatible    BOOLEAN DEFAULT TRUE,
    chemical_restrictions   TEXT[],                     -- e.g. {'no_bleach','no_acid'}

    -- VTM modifiers specific to this material
    production_rate_sqft_hr NUMERIC(6,1),              -- for area-based services
    production_rate_lnft_hr NUMERIC(6,1),              -- for linear services
    detail_time_multiplier  NUMERIC(3,2) DEFAULT 1.0,  -- 1.0 = standard, 1.3 = detail work

    -- Probability of occurrence by era (for hydration inference)
    -- Stored as JSONB: {"pre_1980": 0.05, "1980_1999": 0.15, "2000_2010": 0.70, "post_2010": 0.85}
    era_probability         JSONB,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data (representative sample across key systems)
INSERT INTO ref_material_variants (variant_id, class_id, display_name, rated_life_years, uv_acceleration_factor, freeze_thaw_accel, hail_vulnerability, max_psi, production_rate_sqft_hr, detail_time_multiplier, era_probability) VALUES
    -- Roof surfaces
    ('asphalt_architectural','roof_surface','Asphalt Architectural Shingle', 30, 1.35, 1.10, 'high',     NULL, NULL, 1.0, '{"pre_1980":0.0,"1980_1999":0.40,"2000_2010":0.75,"post_2010":0.85}'),
    ('asphalt_3tab',         'roof_surface','Asphalt 3-Tab Shingle',         20, 1.40, 1.15, 'high',     NULL, NULL, 1.0, '{"pre_1980":0.60,"1980_1999":0.50,"2000_2010":0.15,"post_2010":0.05}'),
    ('concrete_tile',        'roof_surface','Concrete Tile',                 50, 1.10, 1.20, 'moderate', NULL, NULL, 1.0, '{"pre_1980":0.05,"1980_1999":0.10,"2000_2010":0.08,"post_2010":0.05}'),
    ('cedar_shake',          'roof_surface','Cedar Shake',                   20, 1.40, 1.20, 'low',      NULL, NULL, 1.3, '{"pre_1980":0.15,"1980_1999":0.10,"2000_2010":0.05,"post_2010":0.02}'),
    ('standing_seam_metal',  'roof_surface','Standing Seam Metal',           50, 1.05, 1.05, 'moderate', NULL, NULL, 1.0, '{"pre_1980":0.02,"1980_1999":0.03,"2000_2010":0.05,"post_2010":0.08}'),

    -- Roof jack boots
    ('epdm_rubber',          'roof_jack_boot','EPDM Rubber Boot',            12, 1.35, 1.10, 'low',      NULL, NULL, 1.0, '{"pre_1980":0.90,"1980_1999":0.95,"2000_2010":0.95,"post_2010":0.90}'),
    ('thermoplastic_boot',   'roof_jack_boot','Thermoplastic Boot',           20, 1.15, 1.05, 'low',      NULL, NULL, 1.0, '{"pre_1980":0.0,"1980_1999":0.0,"2000_2010":0.05,"post_2010":0.10}'),

    -- Gutters
    ('aluminum_kstyle',      'gutter_trough','Aluminum K-Style',              25, 1.10, 1.05, 'moderate', NULL, NULL, 1.0, '{"pre_1980":0.20,"1980_1999":0.70,"2000_2010":0.90,"post_2010":0.92}'),
    ('vinyl_gutter',         'gutter_trough','Vinyl Gutter',                  15, 1.30, 1.25, 'high',     NULL, NULL, 1.0, '{"pre_1980":0.0,"1980_1999":0.10,"2000_2010":0.05,"post_2010":0.03}'),
    ('galvanized_steel',     'gutter_trough','Galvanized Steel',              20, 1.15, 1.10, 'moderate', NULL, NULL, 1.0, '{"pre_1980":0.70,"1980_1999":0.15,"2000_2010":0.02,"post_2010":0.01}'),
    ('copper_gutter',        'gutter_trough','Copper Gutter',                 80, 1.02, 1.02, 'low',      NULL, NULL, 1.2, '{"pre_1980":0.05,"1980_1999":0.02,"2000_2010":0.01,"post_2010":0.02}'),

    -- Siding
    ('fiber_cement_lap',     'siding','Fiber Cement Lap (Hardie)',           50, 1.05, 1.05, 'low',       2000, 120.0, 1.0, '{"pre_1980":0.0,"1980_1999":0.05,"2000_2010":0.55,"post_2010":0.65}'),
    ('vinyl_siding',         'siding','Vinyl Siding',                        25, 1.30, 1.15, 'high',      800,  150.0, 0.9, '{"pre_1980":0.10,"1980_1999":0.40,"2000_2010":0.25,"post_2010":0.15}'),
    ('wood_lap_siding',      'siding','Wood Lap Siding',                     20, 1.35, 1.15, 'low',       800,  100.0, 1.2, '{"pre_1980":0.60,"1980_1999":0.20,"2000_2010":0.05,"post_2010":0.03}'),
    ('stucco',               'siding','Stucco / EIFS',                       30, 1.10, 1.20, 'low',       500,   80.0, 1.3, '{"pre_1980":0.10,"1980_1999":0.15,"2000_2010":0.10,"post_2010":0.10}'),
    ('cedar_shake_siding',   'siding','Cedar Shake Accent',                  20, 1.40, 1.20, 'low',       NULL,  80.0, 1.3, '{"pre_1980":0.10,"1980_1999":0.08,"2000_2010":0.15,"post_2010":0.10}'),
    ('brick_veneer',         'building_envelope','Brick Veneer',             100, 1.02, 1.05, 'low',       800,   60.0, 1.4, '{"pre_1980":0.30,"1980_1999":0.20,"2000_2010":0.10,"post_2010":0.08}'),

    -- Stone veneer
    ('natural_stone_veneer', 'stone_veneer','Natural Stone Veneer',          100, 1.02, 1.10, 'low',       500,  60.0, 1.5, '{"pre_1980":0.05,"1980_1999":0.08,"2000_2010":0.25,"post_2010":0.30}'),
    ('manufactured_stone',   'stone_veneer','Manufactured Stone Veneer',      50, 1.05, 1.15, 'low',       500,  65.0, 1.4, '{"pre_1980":0.0,"1980_1999":0.05,"2000_2010":0.20,"post_2010":0.25}'),

    -- Windows
    ('single_pane',          'window_unit','Single Pane',                     40, 1.0, 1.0, 'moderate',   NULL, NULL, 0.9, '{"pre_1980":0.80,"1980_1999":0.30,"2000_2010":0.02,"post_2010":0.0}'),
    ('double_pane_clear',    'window_unit','Double Pane (Clear)',             30, 1.0, 1.0, 'moderate',   NULL, NULL, 1.0, '{"pre_1980":0.10,"1980_1999":0.50,"2000_2010":0.25,"post_2010":0.05}'),
    ('double_pane_lowe',     'window_unit','Double Pane Low-E',              30, 1.0, 1.0, 'moderate',   NULL, NULL, 1.0, '{"pre_1980":0.0,"1980_1999":0.15,"2000_2010":0.70,"post_2010":0.90}'),
    ('triple_pane_lowe',     'window_unit','Triple Pane Low-E',              40, 1.0, 1.0, 'low',        NULL, NULL, 1.1, '{"pre_1980":0.0,"1980_1999":0.0,"2000_2010":0.02,"post_2010":0.05}'),

    -- Deck surfaces
    ('pressure_treated_wood','deck_surface','Pressure Treated Wood',         15, 1.30, 1.15, 'low',      1500,  90.0, 1.1, '{"pre_1980":0.60,"1980_1999":0.55,"2000_2010":0.35,"post_2010":0.25}'),
    ('composite_deck',       'deck_surface','Composite (Trex/TimberTech)',   30, 1.05, 1.05, 'low',       800, 110.0, 1.0, '{"pre_1980":0.0,"1980_1999":0.05,"2000_2010":0.50,"post_2010":0.65}'),
    ('cedar_deck',           'deck_surface','Cedar Deck',                    15, 1.35, 1.15, 'low',      1200,  85.0, 1.2, '{"pre_1980":0.20,"1980_1999":0.25,"2000_2010":0.10,"post_2010":0.05}'),

    -- Fence
    ('wood_privacy_fence',   'fence_panel','Wood Privacy Fence (Cedar/PT)',  15, 1.30, 1.15, 'low',       800, 100.0, 1.0, '{"pre_1980":0.50,"1980_1999":0.60,"2000_2010":0.55,"post_2010":0.45}'),
    ('vinyl_fence',          'fence_panel','Vinyl Privacy Fence',            25, 1.20, 1.10, 'moderate',  500, 130.0, 0.9, '{"pre_1980":0.0,"1980_1999":0.10,"2000_2010":0.30,"post_2010":0.40}'),
    ('composite_fence',      'fence_panel','Composite Fence',                30, 1.05, 1.05, 'low',       600, 120.0, 1.0, '{"pre_1980":0.0,"1980_1999":0.0,"2000_2010":0.05,"post_2010":0.10}');


-- ┌─────────────────────────────────────────────────────────────┐
-- │  ref_maintenance_actions                                     │
-- │  Maps component condition → recommended action.              │
-- │  Each row: "when this component is in this condition range,  │
-- │  recommend this service at this urgency tier."               │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE ref_maintenance_actions (
    action_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id            TEXT NOT NULL REFERENCES ref_component_classes(class_id),
    condition_pct_min   INT NOT NULL,              -- condition range lower bound (0-100)
    condition_pct_max   INT NOT NULL,              -- condition range upper bound (0-100)
    urgency_tier        TEXT NOT NULL CHECK (urgency_tier IN ('routine','advisory','recommended','urgent')),
    action_name         TEXT NOT NULL,              -- 'clean', 'inspect', 'reseal', 'replace', 'refer'
    action_description  TEXT NOT NULL,              -- customer-facing description
    gleam_service_sku   TEXT,                       -- NULL = not a Gleam service
    partner_category    TEXT,                       -- NULL = Gleam-direct
    estimated_cost_low  NUMERIC(10,2),
    estimated_cost_high NUMERIC(10,2),
    consequence_framing TEXT,                       -- customer-facing consequence of inaction
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  ref_manufacturer_specs                                      │
-- │  Raw manufacturer warranty and maintenance guidance.          │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE ref_manufacturer_specs (
    spec_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id          TEXT NOT NULL REFERENCES ref_material_variants(variant_id),
    manufacturer        TEXT,                      -- 'GAF', 'James Hardie', '3M', etc.
    product_line        TEXT,                      -- 'Timberline HDZ', 'HardiePlank', etc.
    warranty_years      INT,
    warranty_conditions TEXT,                       -- plain text summary of voiding conditions
    maintenance_interval_months INT,               -- manufacturer recommended
    maintenance_action  TEXT,                       -- 'inspect', 'clean', 'reseal', 'repaint'
    prohibited_methods  TEXT[],                     -- e.g. {'pressure_wash_above_1500psi','bleach_direct'}
    compatibility_notes TEXT,                       -- e.g. '3M film: TSER < 0.50 on Low-E'
    source_url          TEXT,                       -- link to manufacturer spec sheet
    spec_date           DATE,                       -- when this spec was published/verified
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  ref_regulatory_rules                                        │
-- │  OSHA, NPDES, NEC, NFPA, UL, CO-specific rules.             │
-- │  Maps: regulation × condition → required action.             │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE ref_regulatory_rules (
    rule_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regulation_code     TEXT NOT NULL,              -- 'OSHA_1926.501', 'NPDES_CWA', etc.
    regulation_name     TEXT NOT NULL,
    jurisdiction        TEXT NOT NULL DEFAULT 'federal', -- 'federal','colorado','douglas_county'
    effective_date      DATE,
    
    -- Applicability: which component-zones trigger this rule
    applies_to_classes  TEXT[] NOT NULL,            -- e.g. {'roof_surface','gutter_trough'}
    applies_to_services TEXT[],                     -- e.g. {'roof_wash','gutter_clean'}
    trigger_condition   JSONB NOT NULL,             -- e.g. {"height_above_grade_ft": {">": 6}}
    
    -- Required action when triggered
    required_action     TEXT NOT NULL,              -- 'harness_setup', 'containment', 'permit', etc.
    constraint_type     TEXT NOT NULL CHECK (constraint_type IN ('hard_gate','soft_gate','documentation')),
    time_block_minutes  INT DEFAULT 0,             -- added to job time when triggered
    cost_block_dollars  NUMERIC(8,2) DEFAULT 0,    -- added to job cost when triggered
    escape_to_onsite    BOOLEAN DEFAULT FALSE,      -- TRUE = blocks automated quoting
    
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────
-- ██  PROPERTY LAYER — Per-Address Structured Data
-- ─────────────────────────────────────────────────────────────────────────

-- ┌─────────────────────────────────────────────────────────────┐
-- │  properties                                                  │
-- │  One row per address. Bulk-loaded from assessor/RentCast.    │
-- │  ~60,000+ rows per county. The Digital Twin anchor.          │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE properties (
    property_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address             TEXT NOT NULL,
    address_normalized  TEXT NOT NULL,              -- standardized for dedup
    city                TEXT,
    state               TEXT DEFAULT 'CO',
    zip                 TEXT NOT NULL,
    county              TEXT,
    parcel_id           TEXT,                       -- county assessor parcel number

    -- Assessor / RentCast fields (Tier A deterministic)
    year_built          INT,
    stories_ag          INT,                        -- above grade stories
    sqft_ag             NUMERIC(8,1),               -- above grade square footage
    sqft_bg             NUMERIC(8,1),               -- below grade total
    sqft_bg_finished    NUMERIC(8,1),               -- below grade finished
    bedrooms            INT,
    bathrooms_full      INT,
    bathrooms_half      INT,
    construction_type   TEXT,                        -- 'frame', 'masonry', 'steel', etc.
    exterior_wall_code  TEXT,                        -- assessor code → material variant
    roof_material_code  TEXT,                        -- assessor code → material variant
    roof_pitch_code     TEXT,                        -- if available from assessor
    heating_type        TEXT,
    cooling_type        TEXT,
    fireplace_count     INT DEFAULT 0,
    garage_type         TEXT,                        -- 'attached_2car', 'detached_1car', etc.
    basement_type       TEXT,                        -- 'full', 'partial', 'crawl', 'slab'
    lot_sqft            NUMERIC(10,1),
    assessor_quality    TEXT,                        -- 'superior','above_average','average', etc.

    -- Sale / Value (from RentCast)
    last_sale_date      DATE,
    last_sale_price     NUMERIC(12,2),
    est_market_value    NUMERIC(12,2),
    property_tax_annual NUMERIC(10,2),

    -- Computed structural estimates
    est_footprint_sqft  NUMERIC(8,1),               -- sqft_ag / stories_ag
    est_perimeter_ft    NUMERIC(6,1),               -- √footprint × 4 (rectangular approx)
    est_roof_area_sqft  NUMERIC(8,1),               -- footprint × pitch_factor
    est_gutter_linear_ft NUMERIC(6,1),              -- perimeter × complexity_factor
    est_wall_area_sqft  NUMERIC(8,1),               -- perimeter × wall_height × stories - 15%

    -- Spatial data
    parcel_polygon      GEOMETRY(Polygon, 4326),    -- from county GIS
    building_footprint  GEOMETRY(Polygon, 4326),    -- from Google Solar / Open Buildings
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),
    elevation_ft        NUMERIC(7,1),               -- from DEM or Google Elevation API
    cardinal_azimuth_front NUMERIC(5,1),            -- compass bearing of front face

    -- Classification
    zcta_cluster        TEXT,                        -- 'castle_rock_craftsman_2000s', etc.
    property_archetype  TEXT,                        -- 'tract_sfh', 'custom_sfh', 'townhome', etc.
    subdivision_name    TEXT,

    -- Gleam relationship
    gleam_customer_id   UUID,                        -- FK to customer table if exists
    gleam_on_status     TEXT DEFAULT 'none',         -- 'none','active','lapsed','prospect'
    first_service_date  DATE,
    last_service_date   DATE,
    total_jobs          INT DEFAULT 0,

    -- Data management
    data_source         TEXT NOT NULL,               -- 'douglas_county_assessor', 'rentcast', etc.
    data_freshness_date DATE,                        -- when the source was last queried
    hydration_status    TEXT DEFAULT 'raw',           -- 'raw','hydrated','vision_complete','verified'
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(address_normalized)
);

CREATE INDEX idx_properties_zip ON properties(zip);
CREATE INDEX idx_properties_zcta ON properties(zcta_cluster);
CREATE INDEX idx_properties_hydration ON properties(hydration_status);
CREATE INDEX idx_properties_gleam_on ON properties(gleam_on_status) WHERE gleam_on_status != 'none';
CREATE INDEX idx_properties_geom ON properties USING GIST(parcel_polygon);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  property_components                                         │
-- │  THE HEART OF THE SYSTEM.                                    │
-- │  Each row = one component instance at one spatial position   │
-- │  on one property. This IS the component-zone.                │
-- │  ~30-80 rows per property.                                   │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE property_components (
    component_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id         UUID NOT NULL REFERENCES properties(property_id),
    class_id            TEXT NOT NULL REFERENCES ref_component_classes(class_id),
    variant_id          TEXT REFERENCES ref_material_variants(variant_id),  -- NULL if unknown

    -- ═══ SPATIAL TAG (Level 2 grouping key) ═══
    face                TEXT CHECK (face IN ('front','left','right','rear','roof','interior','ground','perimeter')),
    height_tier         TEXT CHECK (height_tier IN ('HL.1','HL.2','HL.3')),
    vertical_band       TEXT CHECK (vertical_band IN ('upper','mid','lower','ground','roof','ceiling')),
    lateral_position    TEXT CHECK (lateral_position IN ('left','center','right','full_span')),
    compass_bearing     NUMERIC(5,1),              -- degrees, for solar exposure calc
    height_above_grade_ft NUMERIC(5,1),            -- for OSHA tier and equipment selection

    -- Access cluster assignment (computed, used by sequencer)
    access_cluster_id   TEXT,                       -- e.g. '2F_center', '1R_full', 'GND_front'
    
    -- For perimeter/linear components
    linear_start_ft     NUMERIC(6,1),              -- position along perimeter (clockwise from front-left)
    linear_end_ft       NUMERIC(6,1),
    
    -- For ground components
    surface_type        TEXT,                       -- 'hardscape','landscape','deck','fence'
    slope_direction     TEXT,                       -- 'toward_street','toward_garage','toward_yard'

    -- Geospatial point (center of component-zone, for map display)
    geom                GEOMETRY(Point, 4326),

    -- ═══ QUANTITY & MEASUREMENT ═══
    quantity_value      NUMERIC(10,2),              -- area in sqft, length in ft, or count
    quantity_unit       TEXT NOT NULL,              -- 'sqft','linear_ft','count'
    quantity_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50,  -- 0.00 to 1.00
    quantity_source     TEXT NOT NULL DEFAULT 'inference',    -- 'assessor','inference','vision','tech','customer','measurement_platform'

    -- ═══ MATERIAL & INSTALL ═══
    variant_confidence  NUMERIC(3,2) NOT NULL DEFAULT 0.50,
    variant_source      TEXT NOT NULL DEFAULT 'inference',
    install_year        INT,
    install_year_confidence NUMERIC(3,2) DEFAULT 0.50,
    install_year_source TEXT DEFAULT 'assessor_year_built',
    last_service_date   DATE,                       -- last time Gleam or anyone serviced this component
    last_service_type   TEXT,                        -- 'cleaned','repaired','replaced','inspected'

    -- ═══ COMPUTED LIFECYCLE (refreshed on observation) ═══
    effective_life_years    NUMERIC(5,1),            -- rated_life / (accel_factors)
    lifecycle_pct_consumed  NUMERIC(5,1),            -- (years_installed / effective_life) × 100
    condition_estimate_pct  NUMERIC(5,1),            -- 100 - sigmoid(lifecycle_pct_consumed)
    urgency_tier            TEXT DEFAULT 'routine' CHECK (urgency_tier IN ('routine','advisory','recommended','urgent')),
    next_maintenance_date   DATE,
    next_maintenance_action TEXT,

    -- ═══ SERVICE APPLICABILITY FLAGS ═══
    -- Which Gleam services apply to this component-zone
    svc_roof_wash       BOOLEAN DEFAULT FALSE,
    svc_house_wash      BOOLEAN DEFAULT FALSE,
    svc_soft_wash       BOOLEAN DEFAULT FALSE,
    svc_pressure_wash   BOOLEAN DEFAULT FALSE,
    svc_window_ext      BOOLEAN DEFAULT FALSE,
    svc_window_int      BOOLEAN DEFAULT FALSE,
    svc_window_track    BOOLEAN DEFAULT FALSE,
    svc_gutter_clean    BOOLEAN DEFAULT FALSE,
    svc_screen_repair   BOOLEAN DEFAULT FALSE,
    svc_holiday_light   BOOLEAN DEFAULT FALSE,
    svc_perm_light      BOOLEAN DEFAULT FALSE,
    svc_tint_film       BOOLEAN DEFAULT FALSE,
    svc_solar_clean     BOOLEAN DEFAULT FALSE,
    svc_deck_wash       BOOLEAN DEFAULT FALSE,
    svc_fence_wash      BOOLEAN DEFAULT FALSE,

    -- ═══ DATA MANAGEMENT ═══
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          TEXT NOT NULL DEFAULT 'hydration_engine' -- 'hydration_engine','vision','tech','customer'
);

CREATE INDEX idx_pc_property ON property_components(property_id);
CREATE INDEX idx_pc_class ON property_components(class_id);
CREATE INDEX idx_pc_access_cluster ON property_components(property_id, access_cluster_id);
CREATE INDEX idx_pc_urgency ON property_components(urgency_tier) WHERE urgency_tier IN ('recommended','urgent');
CREATE INDEX idx_pc_service_gutter ON property_components(property_id) WHERE svc_gutter_clean = TRUE;
CREATE INDEX idx_pc_service_window ON property_components(property_id) WHERE svc_window_ext = TRUE;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  access_clusters                                             │
-- │  LEVEL 2: Scheduling units for the sequencer.                │
-- │  Computed from property_components spatial tags.              │
-- │  One row per spatial grouping — typically 15-25 per property. │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE access_clusters (
    cluster_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id         UUID NOT NULL REFERENCES properties(property_id),
    access_cluster_id   TEXT NOT NULL,              -- matches property_components.access_cluster_id
    
    -- Spatial summary
    face                TEXT NOT NULL,
    height_tier         TEXT NOT NULL,
    lateral_position    TEXT,
    compass_bearing     NUMERIC(5,1),
    height_above_grade_ft NUMERIC(5,1),

    -- Sequencer fields
    component_count     INT NOT NULL DEFAULT 0,     -- how many component-zones in this cluster
    total_estimated_minutes NUMERIC(6,1),           -- sum of VTM times for all components
    equipment_required  TEXT[],                      -- e.g. {'extension_ladder_24ft','wfp_pole'}
    
    -- Precedence edges (computed from gravity cascade + bundle overlays)
    hard_predecessors   TEXT[],                      -- access_cluster_ids that MUST complete first
    soft_predecessors   TEXT[],                      -- access_cluster_ids that SHOULD complete first
    
    -- Regulatory flags
    osha_fall_protection BOOLEAN DEFAULT FALSE,
    npdes_containment   BOOLEAN DEFAULT FALSE,
    electrical_proximity BOOLEAN DEFAULT FALSE,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(property_id, access_cluster_id)
);

CREATE INDEX idx_ac_property ON access_clusters(property_id);


-- ─────────────────────────────────────────────────────────────────────────
-- ██  OBSERVATION LAYER — Append-Only Evidence Log
-- ─────────────────────────────────────────────────────────────────────────

-- ┌─────────────────────────────────────────────────────────────┐
-- │  component_observations                                      │
-- │  APPEND-ONLY. Never update, never delete.                    │
-- │  Every data point from every source is logged here.          │
-- │  The "current state" is always the most recent highest-      │
-- │  confidence observation for each attribute.                  │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE component_observations (
    observation_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id         UUID NOT NULL REFERENCES properties(property_id),
    component_id        UUID REFERENCES property_components(component_id), -- NULL if creating new component
    class_id            TEXT NOT NULL REFERENCES ref_component_classes(class_id),

    -- What was observed
    observed_attribute  TEXT NOT NULL,               -- 'quantity', 'variant', 'condition', 'soiling_level',
                                                     -- 'guard_presence', 'fa_class', 'damage', etc.
    observed_value      JSONB NOT NULL,              -- flexible: {"count": 32} or {"level": "SL.2"}
                                                     -- or {"fa_distribution": {"FA1":24,"FA2":4,"FA3":2}}
    
    -- Observation quality
    confidence          NUMERIC(3,2) NOT NULL,       -- 0.00 to 1.00
    coverage_map        NUMERIC(3,2),                -- for vision: what % of the zone was visible
    source_type         TEXT NOT NULL CHECK (source_type IN (
                            'assessor',              -- bulk county data
                            'rentcast',              -- RentCast API
                            'mls_history',           -- listing photos/descriptions
                            'gemini_vision',         -- AI analysis of imagery
                            'google_solar',          -- Google Solar API
                            'measurement_platform',  -- RoofSnap, EagleView, Hover
                            'customer_input',        -- progressive disclosure answers
                            'tech_observation',      -- on-site technician input
                            'completion_photo',      -- post-job Gemini analysis
                            'depth_estimation',      -- Depth Anything V2
                            'inference'              -- statistical computation
                        )),
    source_detail       TEXT,                         -- e.g. 'street_view_front', 'satellite_2024', 'tech_JSmith'
    imagery_url         TEXT,                         -- link to source image if applicable
    
    -- Spatial context (if observation is location-specific)
    face                TEXT,
    height_tier         TEXT,

    -- For reconciliation engine
    supersedes_observation_id UUID,                   -- if this corrects a prior observation
    reconciled           BOOLEAN DEFAULT FALSE,       -- TRUE once the reconciliation engine has processed it
    reconciled_at        TIMESTAMPTZ,

    observed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_obs_property ON component_observations(property_id);
CREATE INDEX idx_obs_component ON component_observations(component_id);
CREATE INDEX idx_obs_unreconciled ON component_observations(reconciled) WHERE reconciled = FALSE;
CREATE INDEX idx_obs_source ON component_observations(source_type);
CREATE INDEX idx_obs_time ON component_observations(observed_at DESC);


-- ─────────────────────────────────────────────────────────────────────────
-- ██  OPERATIONAL LAYER — Service Definitions, Priors, Weather
-- ─────────────────────────────────────────────────────────────────────────

-- ┌─────────────────────────────────────────────────────────────┐
-- │  ref_services                                                │
-- │  Gleam's 14+ service definitions with VTM formula type.      │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE ref_services (
    service_id          TEXT PRIMARY KEY,            -- 'WIN_EXT', 'GUT_CLN', 'HSE_WSH', etc.
    display_name        TEXT NOT NULL,
    service_group       TEXT NOT NULL,               -- 'window_glass', 'gutter', 'surface_wash',
                                                     -- 'lighting', 'tint_film', 'specialty'
    vtm_formula_type    TEXT NOT NULL,               -- 'multiplicative_hl_additive_sl',
                                                     -- 'multiplicative_hl_multiplicative_sl',
                                                     -- 'production_rate_sqft',
                                                     -- 'per_linear_ft_tiered'
    base_time_unit      TEXT NOT NULL,               -- 'min_per_pane', 'min_per_lnft', 'sqft_per_hr'
    base_time_value     NUMERIC(6,2) NOT NULL,       -- e.g. 3.3 (min per pane for WIN_EXT)
    min_job_floor       NUMERIC(8,2) DEFAULT 125.00, -- minimum price
    requires_water      BOOLEAN DEFAULT TRUE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  service_component_applicability                             │
-- │  Junction table: which services apply to which component     │
-- │  classes, under what conditions.                             │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE service_component_applicability (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id          TEXT NOT NULL REFERENCES ref_services(service_id),
    class_id            TEXT NOT NULL REFERENCES ref_component_classes(class_id),
    is_primary          BOOLEAN DEFAULT FALSE,       -- TRUE = this is the main thing the service acts on
    condition_filter    JSONB,                        -- e.g. {"variant_id": {"in": ["fiber_cement_lap","vinyl_siding"]}}
    vtm_override        JSONB,                        -- if this component needs different VTM params for this service

    UNIQUE(service_id, class_id)
);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  zcta_priors                                                 │
-- │  Hierarchical Bayesian priors by ZIP/ZCTA cluster.           │
-- │  Used for component quantity estimation when no observation.  │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE zcta_priors (
    prior_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zcta                TEXT NOT NULL,
    property_archetype  TEXT NOT NULL,               -- 'tract_sfh_2story', 'ranch_1story', etc.
    class_id            TEXT NOT NULL REFERENCES ref_component_classes(class_id),

    -- Prior distribution parameters
    prior_mean          NUMERIC(8,2) NOT NULL,
    prior_std           NUMERIC(8,2) NOT NULL,
    prior_sample_size   INT NOT NULL DEFAULT 0,      -- how many ground-truth observations inform this
    prior_confidence    NUMERIC(3,2) NOT NULL,

    -- Conditional priors (JSONB for flexibility)
    -- e.g. for window_unit: {"4bed_2500sqft": {"mean":35,"std":4}, "3bed_2000sqft": {"mean":28,"std":5}}
    conditional_priors  JSONB,

    last_calibrated     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(zcta, property_archetype, class_id)
);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  regional_weather_exposure                                   │
-- │  Cumulative environmental exposure by region.                │
-- │  Slowly Changing Dimension Type 2 — historical + current.    │
-- │  Updated weekly from NOAA Climate Data Online + NWS API.     │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE regional_weather_exposure (
    exposure_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code         TEXT NOT NULL,               -- NOAA climate division or county FIPS
    zip                 TEXT,                         -- specific ZIP override if available
    year                INT NOT NULL,
    
    -- Annual cumulative metrics
    uv_index_avg        NUMERIC(4,2),                -- annual average UV index
    uv_hours_total      NUMERIC(8,1),                -- total hours above UV index 6
    freeze_thaw_cycles  INT,                         -- number of times crossing 32°F
    hail_events         INT,                         -- events with hail >= 1"
    hail_max_diameter_in NUMERIC(3,1),               -- largest hail stone recorded
    precipitation_in    NUMERIC(6,1),                -- annual total rainfall + snowmelt
    wind_events_40mph   INT,                         -- days with sustained >40mph
    wildfire_smoke_days INT,                         -- AQI > 100 days
    avg_humidity_pct    NUMERIC(4,1),
    heating_degree_days INT,
    cooling_degree_days INT,

    data_source         TEXT DEFAULT 'noaa_cdo',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(region_code, zip, year)
);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  precedence_edges                                            │
-- │  HARD and SOFT edges for the sequencer graph.                │
-- │  Defines ordering constraints between access clusters.       │
-- └─────────────────────────────────────────────────────────────┘
CREATE TABLE precedence_edges (
    edge_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    edge_type           TEXT NOT NULL CHECK (edge_type IN ('hard','soft')),
    
    -- From → To (using component class or access cluster pattern)
    from_class_id       TEXT,                        -- e.g. 'roof_surface'
    from_cluster_pattern TEXT,                       -- e.g. 'RF_*' or '2F_*'
    to_class_id         TEXT,
    to_cluster_pattern  TEXT,
    
    -- Applicability
    service_context     TEXT[],                       -- which service bundles activate this edge
    bundle_overlay_id   TEXT,                         -- NULL = base graph, else overlay name
    
    rationale           TEXT NOT NULL,
    penalty_weight      NUMERIC(4,2) DEFAULT 1.0,    -- for soft edges: optimization weight
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────
-- ██  VIEWS — Computed Projections of the Component-Zone Model
-- ─────────────────────────────────────────────────────────────────────────

-- ┌─────────────────────────────────────────────────────────────┐
-- │  v_current_component_state                                   │
-- │  The "current truth" for each component — latest highest-    │
-- │  confidence observation for each attribute. This is what     │
-- │  the pricing engine and lifecycle engine read.               │
-- └─────────────────────────────────────────────────────────────┘
CREATE OR REPLACE VIEW v_current_component_state AS
SELECT
    pc.component_id,
    pc.property_id,
    pc.class_id,
    pc.variant_id,
    pc.face,
    pc.height_tier,
    pc.access_cluster_id,
    pc.quantity_value,
    pc.quantity_confidence,
    pc.condition_estimate_pct,
    pc.urgency_tier,
    pc.install_year,
    mv.rated_life_years,
    mv.uv_acceleration_factor,
    mv.freeze_thaw_accel,
    mv.display_name AS material_name,
    cc.display_name AS component_name,
    cc.failure_consequence,
    cc.consequence_cost_low,
    cc.consequence_cost_high,
    rs.display_name AS system_name,
    p.year_built,
    p.elevation_ft,
    p.zcta_cluster,
    p.gleam_on_status
FROM property_components pc
JOIN ref_component_classes cc ON pc.class_id = cc.class_id
JOIN ref_systems rs ON cc.system_id = rs.system_id
JOIN properties p ON pc.property_id = p.property_id
LEFT JOIN ref_material_variants mv ON pc.variant_id = mv.variant_id;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  v_property_health_summary                                   │
-- │  Customer-facing property health dashboard.                  │
-- │  Groups component-zones by system, shows worst urgency.      │
-- └─────────────────────────────────────────────────────────────┘
CREATE OR REPLACE VIEW v_property_health_summary AS
SELECT
    pc.property_id,
    rs.system_id,
    rs.display_name AS system_name,
    rs.display_order,
    COUNT(*) AS component_count,
    MIN(pc.condition_estimate_pct) AS worst_condition_pct,
    MAX(CASE 
        WHEN pc.urgency_tier = 'urgent' THEN 4
        WHEN pc.urgency_tier = 'recommended' THEN 3
        WHEN pc.urgency_tier = 'advisory' THEN 2
        ELSE 1
    END) AS worst_urgency_score,
    (ARRAY_AGG(pc.urgency_tier ORDER BY 
        CASE WHEN pc.urgency_tier = 'urgent' THEN 1
             WHEN pc.urgency_tier = 'recommended' THEN 2
             WHEN pc.urgency_tier = 'advisory' THEN 3
             ELSE 4 END
    ))[1] AS worst_urgency_tier,
    AVG(pc.quantity_confidence) AS avg_data_confidence,
    BOOL_OR(pc.urgency_tier = 'urgent') AS has_urgent_items
FROM property_components pc
JOIN ref_component_classes cc ON pc.class_id = cc.class_id
JOIN ref_systems rs ON cc.system_id = rs.system_id
GROUP BY pc.property_id, rs.system_id, rs.display_name, rs.display_order;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  v_service_scope                                             │
-- │  For a given property + service, shows all applicable        │
-- │  component-zones with VTM inputs and confidence.             │
-- │  This is what the pricing engine queries.                    │
-- └─────────────────────────────────────────────────────────────┘
CREATE OR REPLACE VIEW v_service_scope AS
SELECT
    pc.property_id,
    pc.component_id,
    pc.class_id,
    pc.variant_id,
    pc.face,
    pc.height_tier,
    pc.access_cluster_id,
    pc.quantity_value,
    pc.quantity_unit,
    pc.quantity_confidence,
    pc.variant_confidence,
    mv.production_rate_sqft_hr,
    mv.production_rate_lnft_hr,
    mv.detail_time_multiplier,
    mv.max_psi,
    mv.soft_wash_compatible,
    -- Service applicability flags (pivot-friendly)
    pc.svc_roof_wash, pc.svc_house_wash, pc.svc_soft_wash,
    pc.svc_pressure_wash, pc.svc_window_ext, pc.svc_window_int,
    pc.svc_window_track, pc.svc_gutter_clean, pc.svc_screen_repair,
    pc.svc_holiday_light, pc.svc_perm_light, pc.svc_tint_film,
    pc.svc_solar_clean, pc.svc_deck_wash, pc.svc_fence_wash
FROM property_components pc
LEFT JOIN ref_material_variants mv ON pc.variant_id = mv.variant_id;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  v_nudge_candidates                                          │
-- │  Weekly nudge scan: components approaching or past           │
-- │  maintenance thresholds on Gleam-On subscriber properties.   │
-- └─────────────────────────────────────────────────────────────┘
CREATE OR REPLACE VIEW v_nudge_candidates AS
SELECT
    pc.component_id,
    pc.property_id,
    p.address,
    p.gleam_on_status,
    p.gleam_customer_id,
    cc.display_name AS component_name,
    cc.system_id,
    rs.display_name AS system_name,
    mv.display_name AS material_name,
    pc.face,
    pc.height_tier,
    pc.condition_estimate_pct,
    pc.urgency_tier,
    pc.next_maintenance_date,
    pc.next_maintenance_action,
    cc.failure_consequence,
    cc.consequence_cost_low,
    cc.consequence_cost_high,
    cc.partner_category,
    rs.is_gleam_direct
FROM property_components pc
JOIN ref_component_classes cc ON pc.class_id = cc.class_id
JOIN ref_systems rs ON cc.system_id = rs.system_id
JOIN properties p ON pc.property_id = p.property_id
LEFT JOIN ref_material_variants mv ON pc.variant_id = mv.variant_id
WHERE pc.urgency_tier IN ('advisory', 'recommended', 'urgent')
  AND p.gleam_on_status = 'active'
ORDER BY
    CASE WHEN pc.urgency_tier = 'urgent' THEN 1
         WHEN pc.urgency_tier = 'recommended' THEN 2
         ELSE 3 END,
    pc.condition_estimate_pct ASC;


-- ─────────────────────────────────────────────────────────────────────────
-- ██  FUNCTIONS — Lifecycle Computation & Reconciliation
-- ─────────────────────────────────────────────────────────────────────────

-- ┌─────────────────────────────────────────────────────────────┐
-- │  fn_compute_lifecycle                                        │
-- │  Computes lifecycle position for a single component.         │
-- │  Called after hydration or new observation.                   │
-- └─────────────────────────────────────────────────────────────┘
CREATE OR REPLACE FUNCTION fn_compute_lifecycle(p_component_id UUID)
RETURNS VOID AS $$
DECLARE
    v_rated_life        NUMERIC;
    v_uv_accel          NUMERIC;
    v_ft_accel          NUMERIC;
    v_elevation         NUMERIC;
    v_install_year      INT;
    v_years_installed   NUMERIC;
    v_effective_life    NUMERIC;
    v_pct_consumed      NUMERIC;
    v_condition         NUMERIC;
    v_urgency           TEXT;
    v_region_code       TEXT;
    v_avg_ft_cycles     NUMERIC;
BEGIN
    -- Get component + material + property data
    SELECT
        mv.rated_life_years,
        mv.uv_acceleration_factor,
        mv.freeze_thaw_accel,
        p.elevation_ft,
        pc.install_year,
        p.zip
    INTO v_rated_life, v_uv_accel, v_ft_accel, v_elevation, v_install_year, v_region_code
    FROM property_components pc
    JOIN properties p ON pc.property_id = p.property_id
    LEFT JOIN ref_material_variants mv ON pc.variant_id = mv.variant_id
    WHERE pc.component_id = p_component_id;

    -- If no rated life (unknown material), skip
    IF v_rated_life IS NULL OR v_install_year IS NULL THEN
        RETURN;
    END IF;

    -- Get average freeze-thaw cycles for region (last 5 years avg)
    SELECT AVG(freeze_thaw_cycles)
    INTO v_avg_ft_cycles
    FROM regional_weather_exposure
    WHERE region_code = v_region_code
      AND year >= EXTRACT(YEAR FROM NOW()) - 5;

    -- Compute elevation-adjusted UV acceleration
    -- Factor scales linearly: 1.0 at sea level, value at rated elevation
    v_uv_accel := 1.0 + (v_uv_accel - 1.0) * COALESCE(v_elevation, 5280) / 5000.0;

    -- Compute freeze-thaw acceleration (if >60 cycles)
    IF COALESCE(v_avg_ft_cycles, 0) > 60 THEN
        v_ft_accel := v_ft_accel;
    ELSE
        v_ft_accel := 1.0;
    END IF;

    -- Effective life = rated / (UV × freeze-thaw)
    v_effective_life := v_rated_life / (v_uv_accel * v_ft_accel);
    v_years_installed := EXTRACT(YEAR FROM NOW()) - v_install_year;
    v_pct_consumed := (v_years_installed / NULLIF(v_effective_life, 0)) * 100;

    -- Sigmoid condition curve: rapid degradation past 100% consumed
    v_condition := GREATEST(0, 100 - (100 / (1 + EXP(-0.05 * (v_pct_consumed - 100)))));

    -- Urgency tier
    v_urgency := CASE
        WHEN v_condition > 70 THEN 'routine'
        WHEN v_condition > 40 THEN 'advisory'
        WHEN v_condition > 15 THEN 'recommended'
        ELSE 'urgent'
    END;

    -- Update the component record
    UPDATE property_components SET
        effective_life_years = v_effective_life,
        lifecycle_pct_consumed = v_pct_consumed,
        condition_estimate_pct = v_condition,
        urgency_tier = v_urgency,
        updated_at = NOW()
    WHERE component_id = p_component_id;
END;
$$ LANGUAGE plpgsql;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  fn_compute_all_lifecycles                                   │
-- │  Batch lifecycle computation for an entire property.         │
-- │  Called after initial hydration or bulk observation import.   │
-- └─────────────────────────────────────────────────────────────┘
CREATE OR REPLACE FUNCTION fn_compute_all_lifecycles(p_property_id UUID)
RETURNS INT AS $$
DECLARE
    v_count INT := 0;
    v_comp RECORD;
BEGIN
    FOR v_comp IN
        SELECT component_id
        FROM property_components
        WHERE property_id = p_property_id
          AND variant_id IS NOT NULL
          AND install_year IS NOT NULL
    LOOP
        PERFORM fn_compute_lifecycle(v_comp.component_id);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  fn_composite_confidence                                     │
-- │  Computes composite confidence for a property + service.     │
-- │  Returns the confidence score that drives Quote vs Estimate. │
-- └─────────────────────────────────────────────────────────────┘
CREATE OR REPLACE FUNCTION fn_composite_confidence(
    p_property_id UUID,
    p_service_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_total_weight NUMERIC := 0;
    v_weighted_conf NUMERIC := 0;
    v_min_conf NUMERIC := 1.0;
    v_count INT := 0;
    v_comp RECORD;
    v_svc_col TEXT;
BEGIN
    -- Determine which service flag column to check
    v_svc_col := CASE p_service_id
        WHEN 'WIN_EXT' THEN 'svc_window_ext'
        WHEN 'WIN_INT' THEN 'svc_window_int'
        WHEN 'GUT_CLN' THEN 'svc_gutter_clean'
        WHEN 'HSE_WSH' THEN 'svc_house_wash'
        WHEN 'SFT_WSH' THEN 'svc_soft_wash'
        WHEN 'PRE_WSH' THEN 'svc_pressure_wash'
        WHEN 'HLD_LGT' THEN 'svc_holiday_light'
        WHEN 'PRM_LGT' THEN 'svc_perm_light'
        WHEN 'TNT_FLM' THEN 'svc_tint_film'
        WHEN 'DK_WSH'  THEN 'svc_deck_wash'
        WHEN 'FNC_WSH' THEN 'svc_fence_wash'
        WHEN 'SLR_CLN' THEN 'svc_solar_clean'
        ELSE 'svc_house_wash'  -- fallback
    END;

    -- Calculate weighted confidence across all applicable component-zones
    FOR v_comp IN EXECUTE format(
        'SELECT quantity_confidence, variant_confidence, quantity_value
         FROM property_components
         WHERE property_id = $1 AND %I = TRUE', v_svc_col)
    USING p_property_id
    LOOP
        v_count := v_count + 1;
        -- Weight by quantity (bigger components matter more to price accuracy)
        v_total_weight := v_total_weight + COALESCE(v_comp.quantity_value, 1);
        v_weighted_conf := v_weighted_conf + 
            (LEAST(v_comp.quantity_confidence, v_comp.variant_confidence) 
             * COALESCE(v_comp.quantity_value, 1));
        v_min_conf := LEAST(v_min_conf, v_comp.quantity_confidence);
    END LOOP;

    IF v_count = 0 THEN
        RETURN jsonb_build_object(
            'composite_confidence', 0,
            'component_count', 0,
            'quote_mode', 'onsite',
            'reason', 'no_applicable_components'
        );
    END IF;

    v_weighted_conf := v_weighted_conf / NULLIF(v_total_weight, 0);

    RETURN jsonb_build_object(
        'composite_confidence', ROUND(v_weighted_conf, 3),
        'min_field_confidence', ROUND(v_min_conf, 3),
        'component_count', v_count,
        'quote_mode', CASE
            WHEN v_weighted_conf >= 0.85 AND v_min_conf >= 0.60 THEN 'quote'
            WHEN v_weighted_conf >= 0.60 THEN 'estimate'
            ELSE 'onsite'
        END,
        'reason', CASE
            WHEN v_weighted_conf >= 0.85 AND v_min_conf >= 0.60 THEN 'high_confidence_all_fields'
            WHEN v_weighted_conf >= 0.60 THEN 'partial_confidence_needs_verification'
            ELSE 'insufficient_data_for_remote_pricing'
        END
    );
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────────────────
-- ██  ROW-LEVEL SECURITY (Supabase-specific)
-- ─────────────────────────────────────────────────────────────────────────

-- Enable RLS on tables with customer-facing data
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_observations ENABLE ROW LEVEL SECURITY;

-- Service role (Make.com, backend) gets full access
CREATE POLICY "Service role full access" ON properties
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON property_components
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON component_observations
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users see only their own properties (when customer portal is built)
-- Placeholder: will need gleam_customer_id → auth.uid() mapping
-- CREATE POLICY "Customers see own properties" ON properties
--     FOR SELECT USING (gleam_customer_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────
-- ██  COMMENTS — Schema Documentation
-- ─────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE ref_systems IS 'Top-level component groupings. ~12 rows. Roof Envelope, Gutter & Drainage, etc.';
COMMENT ON TABLE ref_component_classes IS 'Component types within systems. ~120-150 rows. Each maps to zone spatial patterns.';
COMMENT ON TABLE ref_material_variants IS 'Material options per class with degradation physics. ~300-400 rows.';
COMMENT ON TABLE ref_maintenance_actions IS 'Condition range → recommended action mapping. Powers the nudge engine.';
COMMENT ON TABLE ref_manufacturer_specs IS 'Raw manufacturer warranty/maintenance data. Powers partner referral intelligence.';
COMMENT ON TABLE ref_regulatory_rules IS 'OSHA/NPDES/NEC/CO rules. Maps to component-zones as HARD sequencer constraints.';
COMMENT ON TABLE properties IS 'One row per address. Bulk-loaded from assessor/RentCast. The Digital Twin anchor. ~60K+ per county.';
COMMENT ON TABLE property_components IS 'THE HEART. One row per component-zone instance. ~30-80 per property. Pricing, lifecycle, quality all read from here.';
COMMENT ON TABLE access_clusters IS 'Level 2 scheduling units. Spatial groupings of component-zones sharing a ladder position. ~15-25 per property.';
COMMENT ON TABLE component_observations IS 'APPEND-ONLY evidence log. Every data point from every source. Never update, never delete.';
COMMENT ON TABLE zcta_priors IS 'Hierarchical Bayesian priors by ZIP cluster. Tightens over time as ground truth accumulates.';
COMMENT ON TABLE regional_weather_exposure IS 'Annual cumulative environmental metrics by region. SCD Type 2. Updated weekly from NOAA.';
COMMENT ON TABLE precedence_edges IS 'HARD/SOFT sequencer edges. Base graph + bundle overlays. Powers the CP-SAT constraint solver.';

COMMENT ON FUNCTION fn_compute_lifecycle IS 'Computes lifecycle position for one component using Weibull degradation with environmental acceleration.';
COMMENT ON FUNCTION fn_compute_all_lifecycles IS 'Batch lifecycle computation for all components on a property.';
COMMENT ON FUNCTION fn_composite_confidence IS 'Computes Quote vs Estimate routing decision for a property + service combination.';


-- ═══════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- Version: 1.0
-- Tables: 15
-- Views: 4
-- Functions: 3
-- Indexes: 12
-- ═══════════════════════════════════════════════════════════════════════════
