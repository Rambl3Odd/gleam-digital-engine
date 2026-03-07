# D6 Geographic Priors Companion
## Gleam 3.0 — Domain 6: Geographic Prior Domain

**Parent Document:** Master Architecture & Design Specification v1, Section 8  
**Last Updated:** 2026-03-06  
**Status:** Active — coefficients calibrated from 19 full-scope jobs + 117K assessor records, Solar API blindspot documented

---

## 1. Purpose

D6 provides the Bayesian prior estimates for property component quantities (window panes, gutter linear footage, roof area, siding area, driveway area) using only Tier A assessor data. These priors anchor the Bayesian blend in T2 and prevent wild vision-only counts when Street View coverage is incomplete. D6 is the ONLY data source that carries significant weight for **window pane estimation**; all other primitives (gutter, roof, siding, driveway) are primarily measured by Solar API / satellite / Street View depth, with D6 serving as a sanity-check fallback.

---

## 2. V7 Fenestration Regression Model (Current Best)

### 2.1 Formula

```
predicted_cleanable_panes = -17.1
  + (AGSF / 1000) × 43.0
  + (AGSF / 1000)² × (-3.3)
  + is_2story × 22.0
  + (bsmt_total / 1000) × 4.9
  + bedrooms × (-11.7)
  + is_good_plus × (-12.7)
  + is_townhome × (-2.9)
```

### 2.2 Variable Definitions

| Variable | Source | Definition |
|----------|--------|------------|
| AGSF | Property_Improvements.txt Col 8 | Above-Grade Square Footage. NEVER total sqft. |
| is_2story | Col 5 (Style) or Col 21 (Stories) | 1 if stories ≥ 2, else 0. Split-levels (Style="Split Level") treated as is_2story=1. |
| bsmt_total | Col 14 + Col 15 | Basement finished + unfinished sqft combined. |
| bedrooms | Col 24 | Bedroom count from assessor. |
| is_good_plus | Col 6 (Quality Grade) | 1 if quality IN ('Good', 'Very Good', 'Excellent'), else 0. |
| is_townhome | Col 2 (Property Type) | 1 if property_type = 'Townhouse', else 0. |

### 2.3 Performance (Full-Scope Jobs Only)

**Calibration corpus:** 19 full-scope jobs from 2025 job history (J39, J41, J49, J56 excluded as partial scope).

| Metric | Value |
|--------|-------|
| MAPE | ~10.5% |
| MAE | ~4.8 panes |
| GREEN (±15%) | 15/19 (79%) |
| YELLOW (15-25%) | 3/19 (16%) |
| RED (>25%) | 1/19 (5%) — J35 only |

### 2.4 Key Coefficient Interpretations

- **Negative bedroom coefficient (-11.7):** At constant AGSF, more bedrooms = more partition walls = fewer windows per room. Empirically proven, contradicts industry assumption.
- **Negative quality coefficient (-12.7):** Good/VG/Excellent homes have FEWER individual panes but LARGER glass (picture windows, floor-to-ceiling). Total glass area may be higher but pane COUNT is lower.
- **Quadratic AGSF (-3.3):** Pane count decelerates above ~3500sf. Extra sqft becomes room volume, not more windows.
- **Basement coefficient (+4.9 per 1000sf):** Captures walk-out fenestration. Castle Rock's rolling terrain produces walk-outs on 20-55% of properties depending on subdivision.
- **Townhome dampening (-2.9):** Castle Rock townhomes are 2-story split levels with substantial front/rear glass. Shared walls only eliminate ~3 panes. Modern 3-story townhomes (e.g., Mayotte Way) may need a smaller coefficient (-1.0 to -2.0) but N=1 prevents fitting.

### 2.5 Known Limitations

- **1-story ranches:** J35 (2337sf, 1-story, Average) remains the sole genuine RED at +38.9%. The model consistently overestimates ranches. May need a story-specific intercept adjustment when more ranch data accumulates.
- **Modern 3-story townhomes:** Only J28 (Mayotte Way) in the corpus. The -2.9 townhome coefficient may be too aggressive for modern designs that compensate for shared walls with dramatic front-face glass.
- **Post-2020 construction:** Limited data. Modern builds may use fewer, larger windows. J56 was suspected as a "modern build" error but turned out to be partial scope.

---

## 3. Garage Window Treatment

### 3.1 Core Rule

Garage windows are ALWAYS a separate component from cleanable residential windows. They are NEVER included in the default V7 prediction or the default customer quote.

**Rationale (validated through analyzeProperty.js v1.0→v1.8 evolution):**
- Glass is inherently different (decorative inserts, sometimes not real glass)
- Homeowner often doesn't care about them
- Better to show a lower number and add later than inflate the quote
- Prevents conversion-killing quote inflation on ~45% of homes with decorative garage doors

### 3.2 D11 Schema

```
Cleanable windows: class_id = WIN, default_included = true
Garage windows:    class_id = GAR_WIN, default_included = false
```

### 3.3 Garage Pane Counts by Configuration (from photo evidence)

| Config | Decorative % | Avg Panes | Notes |
|--------|-------------|-----------|-------|
| Plain panel (any size) | 0% | 0 | e.g., 2788 Dreamcatcher |
| Carriage-style 1-car | ~40% | 2-4 | |
| Carriage-style 2-car | ~50% | 6-10 | e.g., 2490 Trailblazer (8 panes) |
| Carriage-style 3-car | ~50% | 10-16 | e.g., 1923 Rose Petal (~16 panes) |

Weighted average exposure in Castle Rock: ~3.9 panes per property.

### 3.4 Service-Specific Garage Rules

| Service | Garage Treatment |
|---------|-----------------|
| Window Cleaning | Garage PANES = optional add-on. Omit from default estimate. D11 class: GAR_WIN, default_included: false |
| House Wash | Garage DOOR SURFACE = always included. Separate component for material/chemistry routing. D11 class: GAR.MTL/WDS, svc_wash: true |
| Gutter Cleaning | Garage roofline section = always included. Lower height tier (HL.1) over garage |
| Holiday/Permanent Lighting | Garage fascia = included in roofline linear footage |

### 3.5 Vision Detection

Garage door style (plain_panel vs decorative_windows) is NOT inferable from assessor data. Col 12 (garage_sqft) only gives area. Detection requires T2 vision (Street View). Confidence on garage detection: 0.90+ (high contrast, predictable location at HL.1 on front elevation).

---

## 4. Partial Scope Handling

### 4.1 The Problem

Approximately 15%+ of window cleaning jobs are partial scope — the customer intentionally excludes certain windows from the service. Without proper tagging, partial scope jobs contaminate the D6 Bayesian shrinkage by teaching the model that a property has fewer panes than it actually does.

### 4.2 Four Partial Scope Patterns (from 2025 job history)

**Pattern 1 — "DIY the Easy Ones" (J41, J39)**
Customer cleans ground-floor windows themselves, hires Gleam for hard-to-reach upper story. Scope selector: height tier (HL.2+ only).

**Pattern 2 — "Cherry-Pick by Preference" (J49)**
Customer selects specific windows based on personal preference, mix of ext-only and int-only. Scope selector: per-window (hardest to systematize).

**Pattern 3 — "Level Select" (J56)**
Customer wants all AGSF panes but excludes basement. Common when basement is unfinished. Scope selector: building level (AGSF vs basement).

**Pattern 4 — "Full Exterior, Selective Interior" (J30/2788 Dreamcatcher)**
Customer gets all exterior windows cleaned, then adds interior cleaning only for windows they can't reach from inside. Most common pattern (~9/10 of int+ext jobs).

### 4.3 Detection and Tagging

**Density filter (existing):** Jobs with pane density < 7 panes/1000sf AGSF are flagged as likely partial scope and excluded from calibration. This catches extreme cases (J39 at 4.3, J41 at 5.3) but misses moderate partial scope (J49 at 12.4, J56 at 15.8).

**Required D8 tag (new):** Every booking must carry:
```json
{
  "scope_type": "full" | "partial",
  "scope_exclusions": ["BG0", "GAR_WIN", "Z-1F", "Z-1L", "Z-1R", "Z-1B"],
  "scope_int_ext": "ext_only" | "int_ext_full" | "int_ext_selective"
}
```

**Calibration rule:** Only jobs with `scope_type: "full"` feed into the V7 regression recalibration and the D6 Bayesian shrinkage. Partial scope jobs still write D8 observations for component-level data (material confirmation, soiling level) but their pane counts are excluded from the ZCTA prior updates.

### 4.4 Impact of Partial Scope Reclassification

Before reclassification: 3 RED jobs (J35, J49, J56), V7 MAPE 13.8%  
After reclassification: 1 RED job (J35 only), V7 MAPE ~10.5%  
Two-thirds of "model errors" were data contamination from untagged partial scope.

---

## 5. Estimation Hierarchy by Service Primitive

### 5.1 Confidence Levels and Data Source Roles

| Primitive | Tier A (Assessor) | Tier B (Vision/Solar) | Tier A Role |
|-----------|-------------------|----------------------|-------------|
| Window panes (cleanable) | 0.45-0.65 (V7 regression) | 0.70-0.85 (Street View) | **CRITICAL** — primary Bayesian anchor |
| Garage windows | 0.00 (not inferable) | 0.90 (Street View) | Not estimated. Vision-only, optional add-on |
| Gutter linear ft | 0.50 (SQRT proxy) | 0.93 (Solar API) | Sanity check only |
| Roof area sqft | 0.40 (footprint × pitch) | 0.95 (Solar API) | Sanity check only |
| Siding wall sqft | 0.45 (perimeter × height) | 0.80 (Street View) | Fallback blend |
| Driveway sqft | 0.35 (garage_type proxy) | 0.85 (satellite) | Not needed |
| Fence linear ft | 0.00 (not inferable) | 0.80 (satellite + SV) | Cannot infer |

### 5.2 MAPE Tolerances

| Primitive | Tier A MAPE Tolerance | Rationale |
|-----------|----------------------|-----------|
| Windows | ±20% | Vision corrects; prior must be close enough for asymmetric tolerance rule |
| Gutter/Roof | ±30% | Solar API is primary source; assessor is backup only |
| Siding area | ±25% | Vision confirms material; area from Solar API |
| Driveway | ±40% | Satellite hardscape detection is primary |

---

## 6. Non-Window Primitive Formulas (Tier A Fallback)

These formulas produce the assessor-only estimates used when Solar API / vision data is unavailable. They are sanity checks, not primary estimates.

### 6.1 Gutter Linear Footage

```
est_gutter_linear_ft = SQRT(AGSF / stories_ag) × 4 × AC × CF
```

| Factor | Value | Condition |
|--------|-------|-----------|
| AC (aspect correction) | 1.08 | Ranch 1-story |
| | 1.12 | 2-story + garage |
| | 1.15 | Townhome |
| | 1.10 | Split-level |
| CF (complexity factor) | 1.20 | 1-story, simple roofline |
| | 1.35 | 2-story, standard |
| | 1.50 | 2-story, complex (multiple dormers/bump-outs) |

Downspout count: `ROUND(est_gutter_linear_ft / 40)`, minimum 2.

Confidence: 0.50 (assessor-only). Photo-validated within ±10% on 3 properties.

### 6.2 Roof Area

```
est_roof_area_sqft = (AGSF / stories_ag) × PF × RC
```

| Factor | Value | Condition |
|--------|-------|-----------|
| PF (pitch factor) | 1.05 | Low pitch (3-4/12) |
| | 1.15 | Standard (5/12) — Douglas County default |
| | 1.20 | Moderate (6-7/12) |
| | 1.30 | Steep (8-10/12) |
| | 1.42 | Very steep (>10/12) |
| RC (roof complexity) | 1.00 | Simple (1-2 planes) |
| | 1.10 | Standard (3-4 planes) |
| | 1.25 | Complex (5-7 planes) |
| | 1.40 | Very complex (7+ planes) |

RC is NOT inferable from assessor data. Requires satellite or Solar API. Default RC=1.10 when unknown.

Confidence: 0.40 (assessor-only, no complexity), 0.80 with Solar API.

### 6.3 Siding / House Wash Wall Area

```
gross_wall_sqft = est_perimeter_adj × (stories_ag × 10) + walkout_addition
```

Where:
- `est_perimeter_adj = SQRT(AGSF / stories_ag) × 4 × aspect_correction`
- `walkout_addition = (perimeter × 0.35) × 9 × walkout_probability` (if bsmt_total > 0)

**CRITICAL:** Total billable wash area = gross_wall_sqft. Nothing is subtracted. Fenestration stays in (chemical hits glass, rinse is labor). Garage door stays in (gets washed, separate material routing). Accent stone stays in (different production rate, not area reduction).

**Material decomposition** (rate routing, not area reduction):
- Component A — Primary siding: `gross_wall - garage_door_area - accent_area`
- Component B — Accent stone: `gross_wall × accent_percentage`
- Component C — Garage door: 112 sqft (2-car) or garage_type lookup
- Sum of A + B + C = gross_wall (always)

**Accent stone tripwire logic:**

| Tier | Condition | Accent % | Confidence |
|------|-----------|----------|------------|
| 1 | quality IN ('Very Good','Excellent','Custom') | 20% | 0.75 |
| 2 | quality = 'Good' OR (year_built ≥ 2005 AND stories ≥ 2) | 15% | 0.60 |
| 3 | quality = 'Average' AND year_built ≥ 2000 AND Castle Rock ZCTA | 8% | 0.45 |
| 4 | quality = 'Average' AND year_built < 2000 | 3% | 0.70 |

Note: Assessor exterior_wall_code only captures dominant material. Castle Rock builders after ~2000 almost universally added stone/brick wainscoting regardless of quality grade. Quality correlates with HOW MUCH stone, not WHETHER stone exists.

### 6.4 Driveway / Flatwork Area

```
est_driveway_sqft = garage_base + walkway_allowance
```

| Garage Type | Base sqft |
|-------------|-----------|
| None | 0 |
| Attached 1-car | 300 |
| Attached 2-car | 500 |
| Attached 3-car | 700 |
| Detached | 350 |

Walkway allowance: 80 sqft. Rear patio (if lot_sqft available): `lot_sqft × 0.03`, capped at 500.

Confidence: 0.35 (assessor-only), 0.85 (satellite hardscape detection).

### 6.5 Fence Linear Footage

NOT inferable from assessor data. Default: NULL, confidence 0.00. Requires parcel polygon + satellite/vision overlay. Typical Castle Rock: 150-250 lnft privacy fence enclosing rear yard.

---

## 7. Bayesian Shrinkage (ZIP DNA Convergence)

### 7.1 Formula

```
posterior_estimate = (N / (N + K)) × subdivision_average + (K / (N + K)) × zcta_average
```

Where:
- N = completed full-scope jobs in the specific subdivision
- K = confidence constant (5 jobs)

### 7.2 Convergence Behavior

| N (jobs in subdivision) | Weight on subdivision data | Behavior |
|------------------------|---------------------------|----------|
| 1 | 17% | Heavily relies on broad ZCTA prior |
| 5 | 50% | Equal weight between subdivision and ZCTA |
| 15 | 75% | Subdivision dominates; ZCTA is minor correction |
| 30+ | 86%+ | System has "memorized" builder floorplans; near-zero API cost quotes |

### 7.3 Protection Rules

- Only `scope_type: "full"` jobs feed into shrinkage
- Partial scope jobs update component-level observations (material, soiling) but NOT pane count priors
- New subdivision strands auto-create when ≥3 jobs share a subdivision name from Property_Location.txt legal description

---

## 8. Photo-Validated Property Observations

### 8.1 Properties Analyzed in This Session

| Property | Job | Key Finding |
|----------|-----|-------------|
| 2490 Trailblazer Way | J38 | 8 carriage-style garage panes confirmed excluded from 66-pane invoice. 3 materials (stucco + lap siding + stone). Walk-out basement confirmed. Rear has MORE glass than front. |
| 2788 Dreamcatcher Loop | J30 | Plain panel garage (0 panes). Full exterior + selective interior (7 of 55 panes int). Walk-out basement with 2 egress wells. Fiber cement primary, stone columns only. |
| 2154 Treetop Dr | ref | Split garage (1-car + 2-car) with 4-8 decorative panes. Complex Craftsman with bay window. 3 materials (shake cement + lap siding + stone). |
| 1923 Rose Petal Court | J49 | **Partial scope confirmed.** 3-car garage with ~16 decorative panes (red X in photos). Deck-blocked basement windows excluded. 4 large picture windows int-only. Actual total ~60+ panes, customer paid for 44. V7 prediction of 59 is accurate for full property. |
| 2559 Mayotte Way | J28 | Modern 3-story townhome. Front face has majority of glass. Rear nearly blank (garage + 4 panes). HL.3 tower windows at $15.95/pane (2.3× standard rate). Rooftop deck unique to this section. |
| 3132 Keepsake Way | J39 | **Partial scope: 2nd story exterior only.** 23 of ~56 total panes. Height-tier select pattern. |
| 2182 Treetop Dr | J41 | **Partial scope: DIY remainder.** 13 of ~30 panes. Customer skipped garage, basement, most of house. First-time hire-out from DIY. |
| 3310 Hardin St | J56 | **Partial scope: AGSF only.** 29 of ~38-40 total. Excluded basement (unfinished). 2021 build — NOT a "modern fewer windows" issue as previously hypothesized. Attached townhome-style with shared wall. |

---

## 9. Google Solar API Coverage Blindspot (Critical Discovery)

### 9.1 The Problem

During the pre-build data snapshot run (March 2026), Google Solar API returned `404 Not Found` for the **majority** of Castle Rock (80104/80109) properties. Google has not yet mapped these areas with the 3D LiDAR required for Solar API responses. This means the primary data source for roof area, building footprint polygon, roof pitch per segment, and cardinal azimuth is UNAVAILABLE for the Castle Rock operational theater at launch.

### 9.2 Impact on Estimation Hierarchy

The estimation hierarchy (Section 5) assumed Solar API would provide 0.93-0.95 confidence on gutter/roof measurements. Without Solar API, these primitives fall back to the Tier A assessor formulas documented in Section 6, which operate at 0.40-0.50 confidence. This widens the gap between assessor estimates and ground truth, particularly for:

- **Roof area:** The `footprint × pitch_factor` formula underestimates complex rooflines by 25-40% without the roof complexity multiplier (RC), which itself requires satellite or Solar API to determine plane count.
- **Gutter linear footage:** The `SQRT(footprint) × 4 × AC × CF` formula is ±10% on standard homes but degrades on irregular footprints that Solar API's building polygon would have corrected.
- **Cardinal azimuth:** Not available without Solar API. T3 Environmental Twin cannot compute per-face UV/wind exposure. Default to NULL.

### 9.3 Fallback Strategy

Until Solar API coverage reaches Castle Rock:

1. **Roof and gutter:** Use Tier A formulas (Section 6.1, 6.2) as primary, supplemented by satellite overhead analysis through Gemini. The satellite view allows Gemini to count roof planes (for the RC complexity multiplier) and estimate pitch from shadow geometry, partially compensating for the missing LiDAR.
2. **Building footprint:** Use the rectangular `AGSF / stories` approximation. For L-shaped homes and irregular footprints, Gemini satellite analysis can provide a corrected footprint estimate at ~0.80 confidence.
3. **Cardinal azimuth:** Defer T3 per-face solar exposure calculations until Solar API coverage arrives. Use the Douglas County parcel polygon orientation as a rough proxy (lot frontage typically aligns with street).
4. **Monitor Solar API coverage:** Check quarterly whether Google has expanded LiDAR coverage to Castle Rock. When available, trigger a bulk re-hydration pass for all properties to upgrade from Tier A to Solar API-backed estimates.

### 9.4 Implication for Franchise Scaling

The Solar API blindspot may be Castle Rock-specific (newer suburban development). Dense urban areas and established suburbs typically have full Solar API coverage. Each new franchise market must be tested for Solar API availability during the provisioning process (Section 15.4 of Master Architecture). Add a `solar_api_available: boolean` field to the franchise locale configuration table.

---

## 10. Golden Set Test Harness — Data Hygiene Rules

### 10.1 Purpose

The Golden Set (`golden_set.json`) is a set of reference properties used to validate that any pricing algorithm change produces results within <5% variance of known-good outputs. It enforces a Poka-Yoke constraint: no deployment without passing the Golden Set.

### 10.2 Partial Scope Contamination Warning

If the Golden Set includes J49 (1923 Rose Petal Court) or J56 (3310 Hardin St), the test runner MUST know these are partial scope jobs. Their invoice totals (44 and 29 panes respectively) are NOT full-property ground truth:

- J49: Property has ~60+ total panes. Customer paid for 44 (cherry-pick partial scope).
- J56: Property has ~38-40 total panes. Customer paid for 29 (AGSF-only, excluded basement).

**Required handling:** Golden Set entries must carry `scope_type` tags. The test runner validates:
- Full-scope jobs: V7 prediction vs invoice total (standard validation)
- Partial-scope jobs: V7 prediction vs full-property estimate, NOT vs invoice total. Or: V7 × (included_zones / all_zones) vs invoice total.

Validating the pricing algorithm against partial-scope invoices as if they're full-property truth will enforce the wrong answer and cause the algorithm to systematically undercount panes.

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-05 | Reclassified J49 and J56 as partial scope. V7 calibration corpus reduced from 21 to 19 full-scope jobs. | V7 MAPE improved from 13.8% to ~10.5%. Only 1 RED job remains (J35). |
| 2026-03-05 | Added scope_type tagging requirement for D8 feedback loop. | Prevents partial scope contamination of Bayesian shrinkage. |
| 2026-03-05 | Added GAR_WIN component class for garage window separation (v1.8 approach). | Default quote excludes garage panes. Optional add-on in booking hub. |
| 2026-03-05 | Revised accent stone tripwire to 4-tier logic using quality + year_built + ZCTA. | Catches Average-quality post-2000 homes that have stone accent (confirmed at 2490 Trailblazer). |
| 2026-03-05 | Established estimation hierarchy: D6 is critical for windows, sanity-check-only for all other primitives. | Solar API / satellite / Street View are primary for gutter, roof, siding, driveway. |
| 2026-03-05 | Added non-window primitive formulas (gutter, roof, siding, driveway, fence) as Tier A fallbacks. | Production-ready at stated confidence levels. |
| 2026-03-05 | Documented four partial scope patterns from custom-scope job analysis. | Informs booking hub scope customizer UX design. |
| 2026-03-05 | Identified house wash material decomposition correction: nothing gets washed for free. Garage door and fenestration stay in gross wall billable area. | Prevents $170/job margin leak on mixed-material properties. |
| 2026-03-06 | Added Google Solar API coverage blindspot (Section 9). Castle Rock 80104/80109 returns 404 for majority of properties. | Tier A formulas become primary for roof/gutter until Solar API coverage arrives. Satellite + Gemini partially compensates. |
| 2026-03-06 | Added Golden Set data hygiene rules (Section 10). | Prevents partial scope invoice totals from contaminating test harness validation. |
