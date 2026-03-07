# D3 Manufacturer Intelligence Companion
## Gleam 3.0 — Domain 3: Manufacturer Intelligence

**Parent Document:** Master Architecture & Design Specification v1, Section 5  
**Last Updated:** 2026-03-06  
**Status:** Active — initial companion build. Covers ref_manufacturer_specs schema, ref_maintenance_actions schema (new), ref_approved_chemistry schema (new), ref_weibull_defaults table (new), GPT-4o extraction pipeline spec, Douglas County bootstrap population scope, and D3↔D4↔T4 integration formula chain

---

## 1. Purpose

D3 stores what manufacturers say about their products: how long they last, under what maintenance regimes, using what approved cleaning chemistry, and subject to what warranty terms. It is the authoritative source for the "as-designed" lifecycle parameters that the Lifecycle Twin (T4) uses as its prior before D4 environmental exposure data and D8 ground truth observations apply corrections.

D3 exists as a separate domain from D2 for a precise architectural reason. D2's `ref_material_variants` carries a single `typical_lifespan_years` seed value per variant — sufficient for component hydration initialization. D3 carries the full specification record: Weibull distribution parameters, maintenance intervals, chemistry restrictions, pressure limits, temperature constraints, and warranty terms. Conflating these in D2 would make the component catalog both too heavy and too brittle.

D3 is also the compliance anchor for manufacturer-specific service restrictions that, if violated, expose Gleam to warranty-voiding claims from homeowners. These restrictions flow through the D5 compliance gate and D10 service dispatcher — they are checked before a job is dispatched, not after a claim arrives.

---

## 2. Downstream Consumers

D3 is read by four systems. Each consumes different fields for different purposes:

| Consumer | Fields Read | Purpose |
|----------|------------|---------|
| T4 (Lifecycle Twin) | `weibull_k`, `weibull_lambda` | Survival probability curve computation. T4 applies D4 environmental multiplier to λ before computing condition scores |
| D5 (Regulatory Compliance) | `chemistry_restriction_code`, `max_application_pressure_psi` | Compliance gate evaluation. Manufacturer warranty violations are flagged at the same gate as OSHA/EPA violations |
| D10 (Service Definitions) | `recommended_cleaning_interval_months` | Gleam-On subscription scheduling. Manufacturer interval × D4 environmental compression = locale-adjusted service cadence |
| T6 (Persona Twin) | `warranty_years_material`, `warranty_remaining_years` (computed) | Nudge framing. "Your roof warranty expires in ~3 years" is D3-informed copy, not generic |

---

## 3. The `ref_manufacturer_specs` Table

One row per manufacturer-variant combination. A single material variant (e.g., ASH — asphalt composite shingle) may have multiple manufacturer rows if Gleam services properties with different brands carrying meaningfully different warranty terms or cleaning restrictions.

### 3.1 Schema

| Field | Type | Notes |
|-------|------|-------|
| `spec_id` | UUID | Primary key |
| `variant_id` | TEXT | FK to `ref_material_variants.variant_id` |
| `manufacturer_name` | TEXT | e.g., GAF, CertainTeed, James Hardie, 3M, LLumar |
| `product_line` | TEXT | e.g., "Timberline HDZ", "HardiePlank Lap Siding", "Prestige Series Film" |
| `warranty_years_material` | SMALLINT | Manufacturer's stated material defect warranty term in years |
| `warranty_years_labor` | SMALLINT | Installer labor warranty, if separate. NULL if not offered |
| `warranty_condition_notes` | TEXT | Plain-language summary of conditions required to keep warranty in force |
| `typical_lifespan_years` | SMALLINT | Manufacturer's stated expected service life. This is the Weibull λ seed — the characteristic life at which ~63% of units have failed |
| `weibull_k` | NUMERIC(4,2) | Shape parameter. Seeded from `ref_weibull_defaults` by class_id. Updated as D8 accumulates ground truth |
| `weibull_lambda` | NUMERIC(6,2) | Scale parameter in years. Initialized from `typical_lifespan_years`. Adjusted by D4 multiplier before T4 uses it |
| `recommended_cleaning_interval_months` | SMALLINT | Manufacturer's stated cleaning frequency. NULL if not specified |
| `max_application_pressure_psi` | SMALLINT | Maximum allowable PSI for cleaning. Violations void warranty. NULL if no limit |
| `approved_chemistry_group` | TEXT | FK to `ref_approved_chemistry.group_id` |
| `prohibited_chemistry_notes` | TEXT | Specific prohibited agents. e.g., "Ammonia-based cleaners void adhesive warranty" |
| `min_application_temp_f` | SMALLINT | Minimum ambient temp for service. Critical for film and sealant services |
| `max_application_temp_f` | SMALLINT | Maximum ambient temp for service |
| `altitude_adjustment_note` | TEXT | Manufacturer guidance on high-altitude performance modifications |
| `source_document_url` | TEXT | Direct URL to the manufacturer warranty/TDS document |
| `source_document_hash` | TEXT | SHA-256 hash of the source document at extraction time. Used for change detection |
| `extraction_confidence` | JSONB | Per-field confidence scores from GPT-4o extraction (Step 2 of pipeline) |
| `spec_status` | TEXT | `active`, `pending_review`, `document_not_found`, `superseded` |
| `reviewed_by` | TEXT | Human reviewer who approved the extraction |
| `reviewed_at` | TIMESTAMPTZ | When the human review was completed |
| `valid_from` | TIMESTAMPTZ | SCD Type 2 — when this spec version became active |
| `valid_to` | TIMESTAMPTZ | SCD Type 2 — NULL for current row. Set when superseded |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

### 3.2 Indexes

```sql
CREATE INDEX idx_mfr_specs_variant ON ref_manufacturer_specs(variant_id);
CREATE INDEX idx_mfr_specs_status ON ref_manufacturer_specs(spec_status);
CREATE INDEX idx_mfr_specs_active ON ref_manufacturer_specs(variant_id) 
  WHERE valid_to IS NULL AND spec_status = 'active';
```

### 3.3 Query Pattern

The standard D3 read query always filters for the current active spec:

```sql
SELECT * FROM ref_manufacturer_specs 
WHERE variant_id = $1 
  AND valid_to IS NULL 
  AND spec_status = 'active';
```

When multiple manufacturers exist for the same variant (e.g., GAF vs CertainTeed for asphalt shingles), the system resolves by matching the `manufacturer_name` against the D11 component's `manufacturer_detected` field (populated by T2 vision or technician observation). If no manufacturer is known for a specific property's component, the system uses the **most conservative** spec row — the one with the lowest `max_application_pressure_psi` and shortest `recommended_cleaning_interval_months`. This protects warranty compliance under uncertainty.

---

## 4. The `ref_maintenance_actions` Table (NEW)

This table maps component condition states to recommended actions. It is the bridge between T4's lifecycle scoring output and D10's nudge engine. Each row defines what Gleam recommends when a component reaches a specific urgency band.

### 4.1 Schema

| Field | Type | Notes |
|-------|------|-------|
| `action_id` | UUID | Primary key |
| `class_id` | TEXT | FK to `ref_component_classes.class_id`. e.g., RFS, GUT, WIN, SDG |
| `urgency_band` | TEXT | `excellent_to_good`, `good_to_fair`, `fair_to_poor`, `poor_to_degraded` |
| `urgency_score` | SMALLINT | 1–5. Maps to D10 recommendation urgency. 2=informational, 3=moderate, 4=high, 5=critical |
| `schedule_within_days` | SMALLINT | Recommended scheduling window. 60, 30, 14, or 7 days |
| `is_gleam_service` | BOOLEAN | TRUE = Gleam performs this action. FALSE = partner referral |
| `recommended_service_id` | TEXT | Gleam service ID when `is_gleam_service = TRUE`. e.g., `HW-SFT`, `GUT-CLN`, `WIN-EXT` |
| `partner_category` | TEXT | Partner referral category when `is_gleam_service = FALSE`. e.g., `roofer`, `hvac`, `concrete_sealer` |
| `action_description` | TEXT | Human-readable action. e.g., "Professional soft-wash to remove biological growth and restore surface" |
| `consequence_of_inaction_text` | TEXT | Framing text for nudge copy. e.g., "Biological growth left untreated accelerates shingle granule loss. Average replacement cost is 4× the annual maintenance cost." |
| `cost_ratio_maintenance_vs_replace` | TEXT | The manufacturer-evidence-backed ratio. e.g., "1:4" means $1 maintenance prevents $4 replacement cost |
| `warranty_impact_note` | TEXT | Warranty-specific consequence. e.g., "GAF requires documented annual cleaning to maintain coverage. Undocumented years may void material warranty." |
| `active` | BOOLEAN | DEFAULT TRUE. Set FALSE to retire without deleting |

### 4.2 Urgency Band Mapping (from T4 Condition Score Thresholds)

| T4 Score Transition | Urgency Band | Urgency Score | Schedule Within | Nudge Tone |
|---------------------|-------------|---------------|-----------------|------------|
| 7.50 → 6.50 (Excellent → Good) | `excellent_to_good` | 2 | 60 days | Informational — "approaching first maintenance window" |
| 6.50 → 5.00 (Good → Fair) | `good_to_fair` | 3 | 30 days | Moderate — "schedule recommended within 30 days" |
| 5.00 → 3.50 (Fair → Poor) | `fair_to_poor` | 4 | 14 days | High — "service urgent, delay risks accelerated deterioration" |
| 3.50 → 2.00 (Poor → Degraded) | `poor_to_degraded` | 5 | 7 days | Critical — "proactive outreach, possible onsite assessment" |

### 4.3 Worked Examples — Maintenance Action Rows for Roof (RFS)

**Row 1: Roof approaches first maintenance interval**

```
class_id: RFS
urgency_band: excellent_to_good
urgency_score: 2
schedule_within_days: 60
is_gleam_service: TRUE
recommended_service_id: RF-SFT
action_description: Professional soft-wash to remove early biological growth 
  and mineral deposits before they establish root systems in shingle granules.
consequence_of_inaction_text: Biological growth left untreated for 12+ months 
  establishes root systems that accelerate granule loss. Each year of delayed 
  cleaning approximately doubles removal difficulty and chemical volume required.
cost_ratio_maintenance_vs_replace: 1:4
warranty_impact_note: GAF Timberline HDZ requires documented professional 
  cleaning to maintain coverage on algae-related claims after year 10.
```

**Row 2: Roof reaches Fair — significant degradation**

```
class_id: RFS
urgency_band: fair_to_poor
urgency_score: 4
schedule_within_days: 14
is_gleam_service: FALSE
recommended_service_id: NULL
partner_category: roofer
action_description: Professional roofing inspection recommended. Condition 
  score indicates potential structural degradation beyond cleaning scope.
consequence_of_inaction_text: Roofs in Poor condition that are not inspected 
  within 60 days have a 35% probability of developing leaks within the next 
  hail season. Average emergency repair cost: $2,800-$6,500 vs. $800-$1,200 
  for planned maintenance repair.
cost_ratio_maintenance_vs_replace: 1:5
warranty_impact_note: Most manufacturer warranties exclude coverage for 
  damage attributable to deferred maintenance. Document current condition 
  before filing any future claim.
```

### 4.4 Gleam vs. Partner Routing Logic

The `is_gleam_service` flag determines whether D10's nudge engine routes the recommendation to the Gleam booking pipeline or the partner referral pipeline:

- **Gleam service (TRUE):** D10 generates a `LIFECYCLE_INTERVAL` or `CONDITION_ALERT` recommendation with `recommended_service_id` pointing to the Gleam SKU. Customer receives a nudge with a direct booking link.
- **Partner referral (FALSE):** D10 generates a recommendation with `partner_category` that routes to the Partner Ecosystem's Tier A co-sell pipeline. Customer receives a nudge framed as "Our tech noticed [condition] — we've connected you with [partner name] who specializes in this." Gleam earns the referral commission without performing out-of-scope work.

The routing threshold is typically at `fair_to_poor` or `poor_to_degraded` — early bands are Gleam services (cleaning, maintenance), later bands are partner referrals (repair, replacement).

---

## 5. The `ref_approved_chemistry` Table (NEW)

This reference table formalizes the chemistry groups referenced by `ref_manufacturer_specs.approved_chemistry_group`. It links manufacturer restrictions to the specific chemical formulations techs use in the field.

### 5.1 Schema

| Field | Type | Notes |
|-------|------|-------|
| `group_id` | TEXT | Primary key. Short code, e.g., `SH_MAX_2PCT`, `RINSE_ONLY`, `PH_NEUTRAL` |
| `group_name` | TEXT | Human-readable name |
| `primary_agent` | TEXT | Primary cleaning chemical. e.g., "Sodium Hypochlorite", "Deionized Water", "Sodium Percarbonate" |
| `max_concentration_pct` | NUMERIC(4,2) | Maximum active ingredient concentration. e.g., 2.00 for 2% SH |
| `ph_range_low` | NUMERIC(3,1) | Minimum acceptable pH of working solution |
| `ph_range_high` | NUMERIC(3,1) | Maximum acceptable pH |
| `prohibited_agents` | TEXT[] | Array of prohibited chemical names. e.g., `{'ammonia','hydrofluoric_acid','muriatic_acid'}` |
| `rinse_requirement` | TEXT | `tap_water`, `rodi_required`, `rodi_recommended`, `none` |
| `dwell_time_max_minutes` | SMALLINT | Maximum chemical dwell time before rinse. NULL if unrestricted |
| `tech_brief_summary` | TEXT | One-line field-ready instruction for ServiceM8 checklist |
| `applies_to_class_ids` | TEXT[] | Component classes this chemistry group is typically used on |

### 5.2 Bootstrap Chemistry Groups

| Group ID | Name | Primary Agent | Max Conc. | Prohibited | Used For |
|----------|------|--------------|-----------|------------|----------|
| `SH_STD` | Standard Soft Wash | Sodium Hypochlorite | 3.00% | `{'ammonia','acid'}` | Vinyl siding, concrete, most exteriors |
| `SH_MAX_2PCT` | Reduced SH (Delicate) | Sodium Hypochlorite | 2.00% | `{'ammonia','acid','abrasive'}` | Painted wood, stained surfaces |
| `SH_MAX_1PCT` | Minimal SH (Sensitive) | Sodium Hypochlorite | 1.00% | `{'ammonia','acid','bleach_gel'}` | Window film adjacent surfaces, Low-E glass |
| `PH_NEUTRAL` | pH Neutral Only | Non-ionic surfactant | N/A | `{'ammonia','bleach','acid','alcohol'}` | Window film (3M, LLumar, Solar Gard), coated glass |
| `RINSE_ONLY` | Water Rinse Only | Deionized Water | N/A | `{'all_chemicals'}` | Post-film-install cure period, specialty coatings |
| `MASONRY_SAFE` | Masonry/Stone Safe | Sodium Percarbonate | 5.00% | `{'muriatic_acid','hydrochloric'}` | Stone veneer, brick, natural stone |
| `OXALIC_RUST` | Rust/Oxidation Treatment | Oxalic Acid | 3.00% | `{'bleach','ammonia'}` | Metal oxidation removal, rust staining |

### 5.3 D5 Compliance Gate Integration

When the D5 compliance gate evaluates a proposed service, it reads the D11 component's `variant_id`, looks up the D3 `approved_chemistry_group`, and checks whether the Make.com service payload's specified chemical matches the approved group. A mismatch triggers a FLAG (not a BLOCK) — the service can proceed but the tech brief is updated with a mandatory chemistry substitution instruction and the original chemical is locked out of the ServiceM8 checklist for that component.

---

## 6. The `ref_weibull_defaults` Table (NEW)

This table provides the initial Weibull shape parameter (k) by component class. These are population-level defaults used to seed D3 `weibull_k` when a new manufacturer spec is created. They are NOT per-property values — per-property lifecycle computation happens in T4.

### 6.1 Schema

| Field | Type | Notes |
|-------|------|-------|
| `class_id` | TEXT | PK. FK to `ref_component_classes.class_id` |
| `default_weibull_k` | NUMERIC(4,2) | Default shape parameter for this material class |
| `failure_profile` | TEXT | `wear_out` (k > 1), `random` (k ≈ 1), `infant_mortality` (k < 1) |
| `calibration_source` | TEXT | Source of the default value. `industry_actuarial`, `manufacturer_data`, `gleam_field_data` |
| `sample_n` | INTEGER | Number of data points backing this default. 0 = industry estimate, no Gleam data yet |
| `min_calibration_n` | INTEGER | Minimum field observations required before T4 trusts MLE-recalibrated parameters over manufacturer defaults. DEFAULT 10. Prevents single-observation curve swings |
| `last_recalibrated_at` | TIMESTAMPTZ | NULL until first MLE recalibration from D8 data |

### 6.2 Bootstrap Defaults

| Class ID | Component Class | Default k | λ Seed (years) | Failure Profile | Calibration Source |
|----------|----------------|-----------|----------------|-----------------|-------------------|
| RFS | Roof Surface | 2.50 | 25–30 | Wear-out | Industry actuarial (asphalt shingle claim data) |
| GUT | Gutter Run | 2.20 | 20–25 | Wear-out | Industry actuarial |
| DSP | Downspout | 2.20 | 20–25 | Wear-out | Same profile as gutter |
| SDG | Wall Siding (vinyl) | 2.80 | 30–40 | Wear-out | Manufacturer stated life |
| SDG | Wall Siding (fiber cement) | 3.20 | 40–50 | Wear-out, steep curve | James Hardie warranty data |
| SDG | Wall Siding (wood) | 1.80 | 15–25 | Moderate wear-out | Industry actuarial (higher variance) |
| STN | Stone/Masonry Veneer | 3.50 | 50+ | Very steep wear-out | Negligible degradation absent physical damage |
| WIN | Window Unit (vinyl frame) | 2.50 | 20–30 | Wear-out | Seal failure as primary mode |
| WIN | Window Unit (wood frame) | 1.80 | 15–25 | Moderate wear-out | Rot/paint failure accelerated by moisture |
| FSC | Fascia Board | 2.00 | 15–20 | Wear-out | Paint/stain failure primary mode |
| DRV | Driveway (concrete) | 2.80 | 25–35 | Wear-out | Freeze-thaw spalling as primary mode |
| DKP | Deck Surface (composite) | 2.50 | 20–30 | Wear-out | UV/moisture degradation |
| DKP | Deck Surface (wood) | 1.80 | 10–15 | Moderate wear-out | Rapid if not sealed annually |
| FNC | Fence (wood) | 1.60 | 10–15 | Low k, high variance | Ground contact rot, UV, wind |
| SLR | Solar Panel | 3.50 | 25–30 | Very steep wear-out | Manufacturer 25-year performance warranties |
| TRL | Trimlight/Permanent LED | 2.80 | 15–20 | Wear-out | LED degradation, wiring exposure |

### 6.3 Interpretation Notes

**k > 2.5 (steep wear-out):** Component performs reliably for most of its life, then degrades rapidly. Maintenance nudges should be timed to catch the knee of the curve — T4's threshold crossings do this automatically.

**k ≈ 1.5–2.0 (moderate wear-out):** Component degrades more gradually with higher variance. Nudges should start earlier and be more frequent because the "time to act" window is less predictable.

**k < 1.5 (high variance):** Component condition depends heavily on maintenance history and site-specific factors. The D4 environmental multiplier and D8 ground truth observations carry more weight than the manufacturer baseline for these classes.

### 6.4 T4 Confidence Gating on Uncalibrated Weibull Parameters

At bootstrap, every `ref_weibull_defaults` row has `sample_n = 0`. Until `sample_n` reaches `min_calibration_n` (default: 10 field observations per class), T4 must apply the following protections:

**Rule 1 — Manufacturer baseline dominance.** When `sample_n < min_calibration_n`, T4 uses the manufacturer default k and λ values directly. No field-derived adjustments are applied to the Weibull parameters themselves. The D4 environmental multiplier still applies (it is locale data, not field calibration data), but the shape and scale parameters remain at manufacturer baseline.

**Rule 2 — Wide confidence intervals on condition scores.** T4 outputs a condition score confidence band alongside the point estimate. When `sample_n < min_calibration_n`, the confidence band is widened by a factor of `(min_calibration_n - sample_n) / min_calibration_n`. At `sample_n = 0`, the band is at maximum width. At `sample_n = 9`, it is 10% of maximum. At `sample_n ≥ min_calibration_n`, the band narrows to the standard statistical confidence interval from the MLE fit.

**Rule 3 — Nudge suppression at low confidence.** D10's nudge engine reads the T4 confidence band. When the band width exceeds ±1.5 score points (e.g., condition score = 6.2 ± 1.8), the nudge is routed to `urgency_score = 2` (informational) regardless of the threshold crossing, with copy framing: "Based on your home's age and typical material performance, we recommend scheduling a maintenance check." This prevents premature "your roof needs replacement" nudges based on uncalibrated curves.

### 6.5 MLE Recalibration Trigger

When D8 accumulates ≥ `min_calibration_n` condition observations for a specific `(class_id, variant_id)` combination across completed jobs, the system flags the `ref_weibull_defaults` row for MLE (Maximum Likelihood Estimation) recalibration. The recalibration is NOT automatic — it surfaces in the admin dashboard as a recommendation with the proposed new k and λ values alongside the current defaults. The owner approves or rejects. This follows the same human-in-the-loop principle as the GPT-4o extraction review.

The full MLE recalibration threshold (where the system recommends replacing the manufacturer default entirely) is set at `sample_n ≥ 30`. Between `min_calibration_n` (10) and 30, the system blends manufacturer defaults with field data using a shrinkage formula analogous to D6's Bayesian convergence: `effective_k = (sample_n / (sample_n + K_prior)) × field_k + (K_prior / (sample_n + K_prior)) × default_k` where `K_prior = 15`.

---

## 7. D3 → D4 → T4 Integration Formula Chain

### 7.1 The Core Formula

```
locale_adjusted_lambda = D3.weibull_lambda × D4.env_degradation_multiplier
```

T4 uses `locale_adjusted_lambda` (not the raw D3 value) in the survival probability computation:

```
S(t) = exp(-(t / locale_adjusted_lambda)^k)
```

Where:
- `t` = effective age of the component (years since installation, adjusted for any renovation flag overrides from D1)
- `k` = D3.weibull_k (shape, from ref_weibull_defaults or MLE recalibrated)
- `locale_adjusted_lambda` = D3.weibull_lambda × D4.env_degradation_multiplier

### 7.2 D4 Environmental Multiplier Composition

The `D4.env_degradation_multiplier` is a composite figure stored in D4's `ref_env_multipliers` table, pre-computed per ZCTA per material class:

```
env_degradation_multiplier = Σ(stressor_weight_i × stressor_value_i) 
                             for all stressor dimensions
```

| Stressor Dimension | Affects Most | D4 Source Field |
|-------------------|-------------|-----------------|
| UV index annual dose | Asphalt shingles, paint, wood, film | `uv_index_annual_avg` |
| Freeze-thaw cycle count | Concrete, gutters, masonry, wood | `freeze_thaw_cycles_annual` |
| Water hardness (ppm CaCO3) | Glass, aluminum, metal components | `water_hardness_ppm` |
| Wind abrasion exposure | Siding, fascia, fencing | `sustained_wind_days_annual` |
| Biological growth pressure | All organic surfaces, gutters | `bio_growth_pressure_index` |
| Hail event frequency | Roof, siding, solar panels | `hail_events_annual_avg` |

Each stressor has a per-material-class weight reflecting its relative degradation contribution. These weights live in a `ref_stressor_weights` sub-table keyed on `(class_id, stressor_dimension)`.

### 7.3 Worked Example — Asphalt Shingle Roof in Castle Rock (80109)

```
D3 inputs (GAF Timberline HDZ):
  weibull_k = 2.50
  weibull_lambda = 30.0 years (manufacturer stated life)

D4 inputs (Castle Rock 80109 ZCTA):
  UV index: 6.2 annual avg (7% above national avg) → UV stressor = 1.07
  Freeze-thaw: 85 cycles/year (high) → FT stressor = 1.15
  Hail: 2.3 events/year (moderate-high) → Hail stressor = 1.08
  Bio growth: moderate (semi-arid) → Bio stressor = 0.95
  Wind: 22 sustained days/year → Wind stressor = 1.03
  
  Weighted composite for RFS class:
    env_degradation_multiplier = (0.30 × 1.07) + (0.25 × 1.15) + (0.20 × 1.08) 
                                + (0.10 × 0.95) + (0.10 × 1.03) + (0.05 × 1.00)
                               = 0.321 + 0.288 + 0.216 + 0.095 + 0.103 + 0.050
                               = 1.073

  NOTE: Multiplier > 1.0 means the locale REDUCES effective lifespan.
  The multiplier is applied as a DIVISOR to lambda (shorter life):
  
  locale_adjusted_lambda = 30.0 / 1.073 = 27.96 years

T4 computation for a roof installed in 2010 (effective age = 16 years):
  S(16) = exp(-(16 / 27.96)^2.50)
        = exp(-(0.572)^2.50)
        = exp(-0.247)
        = 0.781 → 78.1% survival probability

  Condition score (0-10 scale): 10 × 0.781 = 7.81 → "Good" band
  
  Next threshold crossing (Good → Fair at 6.50):
    Solve: 6.50 = 10 × exp(-(t / 27.96)^2.50) → t ≈ 20.4 years → ~2030
    
  Nudge: "Your roof is in good condition. First maintenance recommended 
  within the next 4 years to maintain GAF warranty compliance."
```

### 7.4 Castle Rock Elevation Note

Castle Rock sits at ~6,200 ft elevation. The UV index at elevation is 7-12% higher per 1,000 ft above sea level than NOAA station readings (which are typically measured at lower elevations). The D4 record for Castle Rock ZCTAs should include an `elevation_uv_correction` factor of 1.08–1.12 applied to the raw NOAA UV data before computing the stressor value. This correction is locale-specific — a Phoenix franchise at 1,100 ft would have a correction near 1.00.

### 7.5 Solar API Blindspot Fallback (SDR-008)

The T4 integration formula chain depends on D4's `env_degradation_multiplier`, which in the full architecture includes per-face solar exposure derived from Google Solar API cardinal azimuth data. Per SDR-008, Solar API returns 404 for the majority of Castle Rock properties.

**Bootstrap fallback:** When `solar_api_available = FALSE` for a franchise locale (Castle Rock at launch), T4 uses a **uniform env_degradation_multiplier of 1.0 for all faces**, effectively running the survival curve computation at manufacturer baseline parameters adjusted only by the non-directional environmental stressors (freeze-thaw, water hardness, bio growth, wind, hail). The per-face UV acceleration factor — which would otherwise differentiate south-facing roof surfaces (higher UV, faster degradation) from north-facing (lower UV, slower) — is deferred until Solar API coverage arrives.

**Impact on condition scores:** Without per-face UV differentiation, T4's condition scores will be slightly optimistic for south/west-facing components and slightly pessimistic for north/east-facing components. The net effect at the property level is approximately correct because the uniform multiplier is calibrated to the ZCTA average, not to zero. The per-face refinement is an accuracy improvement, not a correctness requirement.

**Trigger for upgrade:** When quarterly Solar API coverage monitoring (SDR-008, step 4) detects that Castle Rock properties return valid responses, the system triggers a bulk T4 re-computation pass. D4's `ref_env_multipliers` table is updated with per-face UV multipliers, and all condition scores are recalculated. No D3 changes are required — D3 stores manufacturer baselines, not locale-adjusted values.

### 7.6 D3 → D10 Chemistry Crosswalk

D3 is the **authoritative source** for cleaning chemistry restrictions. D10's chemistry flags table (D10 Companion Section 2.6) is a downstream consumer that renders D3 data into tech-facing briefs — it does not independently specify chemistry rules.

The data flow is:

```
D3 ref_manufacturer_specs.approved_chemistry_group
  → D3 ref_approved_chemistry (full restriction record)
    → D5 compliance gate (validates proposed chemistry against restrictions)
      → D10 service dispatcher (generates tech brief with chemistry instructions)
        → ServiceM8 checklist (tech sees restrictions before starting work)
```

When a house wash job is assembled for a mixed-material property (e.g., 2490 Trailblazer: stucco + lap siding + stone veneer + metal garage door), the Make.com scenario reads each material zone's D3 chemistry group and builds a per-zone chemistry instruction set:

| Material Zone | D3 Chemistry Group | Max PSI | Tech Brief (from D3) |
|--------------|-------------------|---------|---------------------|
| Stucco (upper) | SH_STD | 800 | Standard SH 1.5-3%, extended dwell OK, porous surface |
| Lap siding (mid) | SH_STD | 1500 (Hardie) or 2500 (vinyl) | SH standard, fan tip. Hardie: confirm max 1,500 PSI |
| Stone veneer (lower) | MASONRY_SAFE | 600 | Sodium percarbonate or pH-neutral masonry cleaner. No acid. Extended dwell 20 min |
| Garage door (metal) | SH_MAX_1PCT | 800 | SH max 1%. Low PSI only. ⚠ Oxidation risk — strong bleach strips factory paint. Confirm with customer |

D10's chemistry flags table is a **presentation layer** of this D3 data, not a separate specification. If D3 is updated (e.g., a manufacturer changes their approved cleaning method), D10's rendered output updates automatically because it reads from D3 at job assembly time.

**Critical rule:** D10 never overrides D3 chemistry restrictions. If a tech encounters a situation not covered by D3 (e.g., a material variant not in the catalog), the job is flagged for manual chemistry review before proceeding — the tech does not improvise.

---

## 8. Douglas County Bootstrap Population Scope

### 8.1 Prioritization Criteria

The full D3 domain will eventually contain 300-400+ manufacturer spec rows. For the Douglas County bootstrap, the target is **30-40 rows** covering the material variants that appear on 85%+ of Castle Rock residential properties based on assessor data distribution and photo-validated job history.

### 8.2 Priority 1 — Roof Envelope (SYS-01)

| Variant ID | Material | Representative Manufacturer | Prevalence in Castle Rock |
|-----------|----------|---------------------------|--------------------------|
| ASH | Asphalt architectural shingle | GAF (Timberline HDZ) | ~75% of SFH |
| ASH | Asphalt architectural shingle | CertainTeed (Landmark) | ~15% |
| ASH | Asphalt architectural shingle | Owens Corning (Duration) | ~8% |
| CSH | Concrete/slate shingle | DaVinci Roofscapes | <2% (Good+ quality) |

**Priority rationale:** Roof is the highest-value component for lifecycle nudges, the strongest warranty compliance story (30-year warranties with maintenance conditions), and the primary partner referral trigger for roofer co-sell.

### 8.3 Priority 2 — Wall Cladding (SYS-03)

| Variant ID | Material | Representative Manufacturer | Prevalence |
|-----------|----------|---------------------------|------------|
| VNL | Vinyl lap siding | Various (generic spec) | ~35% |
| FIB | Fiber cement lap siding | James Hardie (HardiePlank) | ~40% |
| WDS | Painted wood siding | Various (generic spec) | ~5% |
| STU | Stucco/EIFS | Various (generic spec) | ~10% |
| MSV | Manufactured stone veneer | Eldorado, Boral | ~50% as accent (per D6 tripwire) |

**Priority rationale:** House wash is a high-frequency Gleam service. Material-specific chemistry restrictions (max PSI, SH concentration) directly prevent warranty claims and equipment damage. Fiber cement (Hardie) is especially critical — 1,500 PSI max is strictly enforced in warranty terms.

### 8.4 Priority 3 — Fenestration (SYS-04)

| Variant ID | Material | Representative Manufacturer | Prevalence |
|-----------|----------|---------------------------|------------|
| VNL_DH | Vinyl double-hung window | Various (generic spec) | ~60% |
| VNL_CS | Vinyl casement window | Various (generic spec) | ~15% |
| WD_DH | Wood-frame double-hung | Andersen, Pella, Marvin | ~10% |
| ALM_SLD | Aluminum sliding door | Various | ~40% of homes |

**Note:** Window cleaning chemistry is gentle (squeegee + minimal solution), so manufacturer restrictions on windows themselves are minimal. The critical D3 entries for SYS-04 are on the FILM side — see Priority 5.

### 8.5 Priority 4 — Gutter & Drainage (SYS-02)

| Variant ID | Material | Representative Manufacturer | Prevalence |
|-----------|----------|---------------------------|------------|
| ALM_K | Aluminum K-style gutter | Various (generic spec) | ~85% |
| ALM_R | Aluminum half-round gutter | Various | ~5% (Good+ quality) |
| STL_K | Steel gutter | Various | ~5% |
| COP_R | Copper half-round | Various | <1% (Excellent quality) |

### 8.6 Priority 5 — Window Film (SYS-04 subclass)

| Variant ID | Material | Representative Manufacturer | Prevalence |
|-----------|----------|---------------------------|------------|
| FILM_3M_PR | Ceramic film (non-metallic) | 3M (Prestige Series) | Gleam installs |
| FILM_LL_CR | Ceramic film | LLumar (Ceramic Series) | Gleam installs |
| FILM_SG_HL | Ceramic film | Solar Gard (Hilite Series) | Gleam installs |
| FILM_DL | Decorative/privacy film | Various | Gleam installs |

**Priority rationale:** Film is Gleam's highest-margin service line ($450 minimum). Chemistry restrictions are absolute (ammonia voids all adhesive warranties). IGU thermal stress risk on Low-E double-pane units is a D5 BLOCK gate that D3 feeds directly. These specs must be in place before any film service quotes are automated.

### 8.7 Priority 6 — Hardscape & Other (SYS-06, SYS-08, SYS-10)

| Variant ID | Material | Representative Manufacturer | Prevalence |
|-----------|----------|---------------------------|------------|
| CON_STD | Standard concrete flatwork | Generic | ~95% of driveways |
| CON_STM | Stamped/colored concrete | Generic | ~15% of patios |
| PAV_BRK | Brick pavers | Various | ~5% of walkways |
| CMP_DK | Composite decking | Trex, TimberTech | ~30% of decks |
| WD_DK | Wood decking (cedar/PT) | Generic | ~50% of decks |
| TRL_LED | Permanent LED track | Trimlight | Gleam installs |
| HLD_LED | Holiday lighting wire | Various UL-588 rated | Gleam seasonal |

---

## 9. GPT-4o Extraction Pipeline

### 9.1 Pipeline Architecture

The pipeline uses OpenAI GPT-4o for document retrieval and structured extraction, with a mandatory human review gate on every field that carries liability exposure.

```
TRIGGER: New variant added to ref_material_variants (D2)
    OR: Batch bootstrap CSV uploaded via admin panel
         │
    ┌────▼──────────────────────────────────┐
    │  Step 1: Document Retrieval            │
    │  GPT-4o searches for warranty/TDS URL  │
    │  Fully automated. No human needed.     │
    │  Output: source_document_url           │
    │  If NULL → spec_status = 'document_    │
    │             not_found' → manual queue  │
    └────┬──────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │  Step 2: Structured Field Extraction   │
    │  GPT-4o extracts fields from document  │
    │  Per-field confidence scores (0-1.0)   │
    │  Output: JSON with all spec fields     │
    │  spec_status = 'pending_review'        │
    └────┬──────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │  Step 3: Human Review Gate             │
    │  Admin panel shows extracted values    │
    │  alongside source document excerpt     │
    │  Reviewer: Approve or Reject per field │
    │  Rejected → requires_manual_entry      │
    │  Output: reviewed_by, reviewed_at      │
    │  spec_status = 'active'                │
    └────┬──────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │  Step 4: Weibull Parameter Assignment  │
    │  weibull_lambda ← typical_lifespan_yrs │
    │  weibull_k ← ref_weibull_defaults      │
    │  NOT generated by AI. Lookup only.     │
    │  Fully deterministic. No hallucination. │
    └───────────────────────────────────────┘
```

### 9.2 Step 1 — Document Retrieval Prompt

```
System: You are a document retrieval agent for a home services company. 
Your task is to find manufacturer warranty and technical specification 
documents for building materials.

User: Search for and return the direct URL to the current manufacturer 
warranty document and technical data sheet for [manufacturer_name] 
[product_line]. Return only direct document URLs — no search result pages, 
no aggregator sites, no retailer pages. If you cannot locate a direct 
document URL with high confidence, return null.

Response format (JSON only):
{
  "warranty_url": "https://...",
  "tds_url": "https://...",
  "retrieval_confidence": 0.0-1.0
}
```

### 9.3 Step 2 — Structured Extraction Prompt

```
System: You are a data extraction agent. Read the attached manufacturer 
document and extract ONLY the following fields. For each field, return 
the value exactly as stated in the document and a confidence score 
between 0.00 and 1.00 reflecting how explicitly the document states 
this value. If a field is not explicitly stated in the document, return 
null with confidence 0.00. Do not infer, estimate, or reason beyond 
what the document explicitly states. Return your response as JSON only.

Fields to extract:
{
  "warranty_years_material": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "warranty_years_labor": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "warranty_condition_notes": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "typical_lifespan_years": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "recommended_cleaning_interval_months": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "max_application_pressure_psi": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "approved_cleaning_method": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "prohibited_chemicals": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "min_application_temp_f": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "max_application_temp_f": { "value": null, "confidence": 0.0, "source_excerpt": "" },
  "altitude_notes": { "value": null, "confidence": 0.0, "source_excerpt": "" }
}
```

### 9.4 Step 3 — Human Review Interface

The admin panel (Supabase form view or lightweight custom page) displays each extracted field alongside its `source_excerpt` and `confidence` score. The reviewer reads the excerpt, compares it to the extracted value, and clicks Approve or Reject per field.

Review time estimate: 3-5 minutes per record. 30-40 bootstrap records = 2-3 hours total review time.

A single rejected field does not block the record — it flags that field as `requires_manual_entry` and the record activates with that field NULL until resolved.

### 9.5 Step 4 — Weibull Parameter Assignment

Weibull parameters are NEVER generated by GPT-4o. The AI cannot reliably derive failure distribution statistics from marketing documents — that would be hallucination territory.

- `weibull_lambda` is set to the confirmed `typical_lifespan_years` value
- `weibull_k` is looked up from `ref_weibull_defaults` by `class_id`

Both are deterministic assignments. No AI reasoning involved.

### 9.6 Batch Bootstrap Mode

For the initial 30-40 record population, build a standalone Make.com scenario that:

1. Accepts a CSV upload: `(manufacturer_name, product_line, variant_id, class_id)`
2. Iterates each row through Steps 1-3
3. Outputs a Supabase-ready JSON array
4. Batch inserts to `ref_manufacturer_specs` with `spec_status = 'pending_review'`
5. Admin reviews and activates in the Supabase form view

After the batch is loaded, wire the trigger version (Step 1 auto-fires on new D2 variant addition) for ongoing maintenance.

### 9.7 Ongoing Change Detection

Make.com scheduled scenario (quarterly) compares `source_document_hash` against the current document at `source_document_url`. If the hash differs:

1. Re-run Step 2 extraction on the new document
2. GPT-4o diffs the new extraction against the existing D3 row
3. Only changed fields are surfaced for human review
4. Existing row receives `valid_to = NOW()`
5. New row inserted with `valid_from = NOW()`
6. All existing D11 component computations retain their prior spec reference — no retroactive recalculation occurs

### 9.8 LLM Provider Note (Gemini Alternative)

The extraction pipeline is specified for GPT-4o because the MLS description parsing (D1 hydration) already uses GPT-4o, maintaining a single LLM provider for structured data extraction tasks. However, per SDR-010 (Vertex AI Deferred to Post-V1), the architecture minimizes vendor lock-in.

Gemini 2.5 Flash with grounding could handle this extraction at lower per-query cost. The structured extraction prompt (Step 2) is model-agnostic — it requests JSON-only output with per-field confidence scores, which both GPT-4o and Gemini handle reliably. The migration path is straightforward: swap the Make.com HTTP module's endpoint from OpenAI to Gemini, adjust the prompt wrapper for Gemini's API format, and re-run the extraction on 3-5 known manufacturer documents to validate output parity.

**Decision:** Use GPT-4o for the bootstrap batch (consistency with existing MLS pipeline). Evaluate Gemini for ongoing maintenance extractions during the SDR-010 Vertex AI assessment, which is already triggered when monthly API costs or rate limits become constraining.

---

## 10. Franchise Scaling Considerations

### 10.1 D3 Is Global Reference Data

A GAF Timberline HDZ shingle has the same warranty terms in Castle Rock as in Phoenix as in Charlotte. The manufacturer spec record requires no market-specific modification. When a new franchise market is onboarded, D3 is unchanged — D4 is updated with locale-specific environmental multipliers, and T4 automatically produces locale-adjusted survival curves because it always computes `locale_adjusted_lambda = D3.weibull_lambda × D4.env_multiplier`.

### 10.2 New Variant Exception

When a franchise market introduces a material variant that does not exist in the Douglas County catalog (Spanish clay tile in Phoenix, wood shake in the Pacific Northwest, standing seam metal in mountain resort markets), a new D3 entry is required. That entry is then globally available to all franchise markets.

Over time, as the franchise network expands, D3 accumulates a progressively richer manufacturer specification library that benefits every market. This is a network effect — the 50th franchise market inherits all D3 entries created by the first 49.

### 10.3 Chemistry Group Portability

`ref_approved_chemistry` is fully portable across markets. Sodium Hypochlorite at 2% in Castle Rock is the same chemistry in Phoenix. The only market-variable chemical consideration is water hardness affecting rinse quality — but that lives in D4, not D3. The `rinse_requirement` field in the chemistry table (`rodi_required` vs `tap_water`) is a per-chemistry-group constant, not a per-market variable.

---

## 11. Supabase DDL — All D3 Tables

Run these in the Supabase SQL editor to create all D3 tables:

```sql
-- ============================================================
-- D3 Manufacturer Intelligence Domain — Table Creation
-- ============================================================

-- 1. Approved Chemistry Groups (reference, must exist before specs)
CREATE TABLE IF NOT EXISTS ref_approved_chemistry (
  group_id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  primary_agent TEXT,
  max_concentration_pct NUMERIC(4,2),
  ph_range_low NUMERIC(3,1),
  ph_range_high NUMERIC(3,1),
  prohibited_agents TEXT[],
  rinse_requirement TEXT DEFAULT 'tap_water',
  dwell_time_max_minutes SMALLINT,
  tech_brief_summary TEXT,
  applies_to_class_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Weibull Defaults (reference, must exist before specs)
CREATE TABLE IF NOT EXISTS ref_weibull_defaults (
  class_id TEXT PRIMARY KEY,
  default_weibull_k NUMERIC(4,2) NOT NULL,
  failure_profile TEXT NOT NULL,
  calibration_source TEXT DEFAULT 'industry_actuarial',
  sample_n INTEGER DEFAULT 0,
  min_calibration_n INTEGER DEFAULT 10,
  last_recalibrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Manufacturer Specs (main D3 table)
CREATE TABLE IF NOT EXISTS ref_manufacturer_specs (
  spec_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id TEXT NOT NULL,
  manufacturer_name TEXT NOT NULL,
  product_line TEXT,
  warranty_years_material SMALLINT,
  warranty_years_labor SMALLINT,
  warranty_condition_notes TEXT,
  typical_lifespan_years SMALLINT,
  weibull_k NUMERIC(4,2),
  weibull_lambda NUMERIC(6,2),
  recommended_cleaning_interval_months SMALLINT,
  max_application_pressure_psi SMALLINT,
  approved_chemistry_group TEXT REFERENCES ref_approved_chemistry(group_id),
  prohibited_chemistry_notes TEXT,
  min_application_temp_f SMALLINT,
  max_application_temp_f SMALLINT,
  altitude_adjustment_note TEXT,
  source_document_url TEXT,
  source_document_hash TEXT,
  extraction_confidence JSONB,
  spec_status TEXT DEFAULT 'pending_review',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mfr_specs_variant ON ref_manufacturer_specs(variant_id);
CREATE INDEX idx_mfr_specs_status ON ref_manufacturer_specs(spec_status);
CREATE INDEX idx_mfr_specs_active ON ref_manufacturer_specs(variant_id) 
  WHERE valid_to IS NULL AND spec_status = 'active';

-- 4. Maintenance Actions (nudge engine source)
CREATE TABLE IF NOT EXISTS ref_maintenance_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  urgency_band TEXT NOT NULL,
  urgency_score SMALLINT NOT NULL,
  schedule_within_days SMALLINT NOT NULL,
  is_gleam_service BOOLEAN NOT NULL,
  recommended_service_id TEXT,
  partner_category TEXT,
  action_description TEXT NOT NULL,
  consequence_of_inaction_text TEXT,
  cost_ratio_maintenance_vs_replace TEXT,
  warranty_impact_note TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_routing CHECK (
    (is_gleam_service = TRUE AND recommended_service_id IS NOT NULL) OR
    (is_gleam_service = FALSE AND partner_category IS NOT NULL)
  )
);

CREATE INDEX idx_maint_actions_class ON ref_maintenance_actions(class_id);
CREATE INDEX idx_maint_actions_band ON ref_maintenance_actions(urgency_band);
CREATE INDEX idx_maint_actions_active ON ref_maintenance_actions(class_id, urgency_band) 
  WHERE active = TRUE;

-- 5. Stressor Weights (D3↔D4 bridge, per material class)
CREATE TABLE IF NOT EXISTS ref_stressor_weights (
  class_id TEXT NOT NULL,
  stressor_dimension TEXT NOT NULL,
  weight NUMERIC(4,3) NOT NULL,
  notes TEXT,
  PRIMARY KEY (class_id, stressor_dimension)
);

-- Trigger for updated_at on ref_weibull_defaults
CREATE TRIGGER weibull_defaults_updated
  BEFORE UPDATE ON ref_weibull_defaults
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

---

## 12. Implementation Sequence

| Step | Action | Dependency | Time Estimate |
|------|--------|------------|---------------|
| 1 | Run DDL (Section 11) in Supabase SQL editor | D1 properties table exists | 15 min |
| 2 | Seed `ref_approved_chemistry` with 7 bootstrap groups (Section 5.2) | Step 1 | 30 min |
| 3 | Seed `ref_weibull_defaults` with class-level defaults (Section 6.2) | Step 1 | 30 min |
| 4 | Seed `ref_stressor_weights` for top 8 material classes | Step 1 | 1 hr |
| 5 | Build batch bootstrap CSV (30-40 manufacturer-variant rows from Section 8) | Section 8 scope list | 1 hr |
| 6 | Build Make.com batch extraction scenario (Section 9.6) | Steps 2-3 done, OpenAI API key | 3-4 hr |
| 7 | Run batch extraction → `spec_status = 'pending_review'` | Step 6 | 1 hr |
| 8 | Human review gate — approve/reject per field (Section 9.4) | Step 7 | 2-3 hr |
| 9 | Seed `ref_maintenance_actions` for top 6 component classes × 4 urgency bands | Step 1 | 2 hr |
| 10 | Build D4 `ref_env_multipliers` and `ref_stressor_weights` for Douglas County ZCTAs | D4 companion (parallel track) | 4-6 hr |

**Step 10 note (SDR-008):** D4 per-face UV computation is deferred until Solar API coverage arrives in Castle Rock. Use uniform env_degradation_multiplier (1.0) for all faces at bootstrap. Non-directional stressors (freeze-thaw, water hardness, bio growth, wind, hail) can be computed from NOAA data without Solar API. See Section 7.5.

| 11 | Wire trigger-based extraction for ongoing D2 → D3 flow | Step 6 validated | 2 hr |
| 12 | Validate T4 computation against known-age components from 2025 job history | Steps 8 + 10 done | 2-3 hr |

**Total estimated effort: 18-24 hours across 2-3 work sessions.**

Steps 1-5 can be done in a single session. Steps 6-8 require the Make.com build. Step 10 is a parallel track with the D4 companion (not yet created). Step 12 is the validation gate — until this passes, D3 data is directional only.

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-06 | Created D3 companion document. Carries ref_manufacturer_specs schema (from Master Architecture Section 5.3), plus three NEW tables: ref_maintenance_actions, ref_approved_chemistry, ref_weibull_defaults. | Fills the largest spec gap in the companion document set. Unblocks T4 Lifecycle Twin, D5 chemistry compliance gate, and D10 nudge engine. |
| 2026-03-06 | Defined maintenance action → nudge engine mapping with worked examples for roof (RFS) component class. | D10 can now route lifecycle recommendations to either Gleam booking pipeline or partner referral pipeline based on urgency band. |
| 2026-03-06 | Documented D3→D4→T4 integration formula chain with Castle Rock worked example (GAF Timberline HDZ, 80109 ZCTA). | Demonstrates full survival probability computation from manufacturer baseline through locale adjustment to condition score output. |
| 2026-03-06 | Scoped Douglas County bootstrap to 30-40 manufacturer spec rows across 6 priority groups covering 85%+ of Castle Rock housing stock. | Prevents scope creep. Full 300-400 variant coverage deferred to franchise scaling phase. |
| 2026-03-06 | Added ref_stressor_weights table bridging D3 and D4 for composite environmental multiplier computation. | Completes the D3↔D4 interface contract. Each material class has its own stressor sensitivity profile. |
| 2026-03-06 | Added Supabase DDL for all 5 D3 tables with indexes, constraints, and routing CHECK constraint on maintenance actions. | Production-ready SQL. Run in Supabase SQL editor as Step 1 of implementation sequence. |
| 2026-03-06 | v1.1: Added `min_calibration_n` column to `ref_weibull_defaults` schema and DDL. Added T4 confidence gating rules (Section 6.4): manufacturer baseline dominance when sample_n < threshold, wide confidence bands, nudge suppression at low confidence. | Prevents premature lifecycle nudges from uncalibrated Weibull curves. Shrinkage formula blends field data with manufacturer defaults between n=10 and n=30. |
| 2026-03-06 | v1.1: Added D3 → D10 chemistry crosswalk (Section 7.6). D3 is authoritative source; D10 chemistry flags table is a presentation layer that reads from D3 at job assembly time. Worked example for 2490 Trailblazer 4-material house wash. | Eliminates parallel specification risk between D3 and D10. Per-zone chemistry instructions built from D3 records, not hardcoded in D10. |
| 2026-03-06 | v1.1: Added Solar API blindspot fallback (Section 7.5). Uniform env_multiplier = 1.0 when Solar API unavailable. Per-face UV differentiation deferred until coverage arrives. | T4 runs at manufacturer baseline + non-directional stressors at bootstrap. Condition scores approximately correct at property level. |
| 2026-03-06 | v1.1: Added Gemini alternative note (Section 9.8). GPT-4o for bootstrap consistency; Gemini evaluation deferred to SDR-010 Vertex AI assessment. | Preserves vendor migration path without adding complexity at bootstrap. |
| 2026-03-06 | v1.1: Updated implementation Step 10 with explicit Solar API fallback note per SDR-008. | Prevents blocking on D4 companion for data that requires Solar API coverage. |
