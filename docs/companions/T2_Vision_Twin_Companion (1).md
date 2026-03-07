# T2 Sensory & Vision Twin Companion
## Gleam 3.0 — Twin 2: Sensory & Vision Twin

**Parent Document:** Master Architecture & Design Specification v1, Section 12.3  
**Last Updated:** 2026-03-06  
**Status:** Active — incorporates garage pane separation, material detection, vision coverage rules, multi-position camera strategy, and wrong house defense

---

## 1. Purpose

T2 is the Gemini 2.5 Flash vision audit engine. It reads the T1 output payload, analyzes available imagery (Street View panoramic, satellite, Solar API), and produces Bayesian quantity updates and VTM probability distributions. T2 elevates D11 component records from `tier_a_only` to `vision_uplifted`. A T2 failure degrades confidence but never halts quoting — T1 priors stand and the confidence ceiling caps at 0.70.

---

## 2. Garage Pane Separation (v1.8 Architecture)

### 2.1 Evolution from analyzeProperty.js

| Version | Behavior | Problem |
|---------|----------|---------|
| v1.0-v1.3 | Counted all visible panes including garage inserts | Overcounted cleanable panes by 4-16 depending on garage style |
| v1.4 | Added garage detection — subtracted garage panes from total | Correct direction but subtraction approach was fragile |
| v1.5 | Added walk-out basement inference from slope + basement sqft | Independent improvement |
| v1.6 | Added townhome dampening | Independent improvement |
| v1.7 | Refined large-glass detection | Independent improvement |
| v1.8 | **FINAL:** Bayesian blend assessor + vision, garage as SEPARATE component class | Correct architecture — garage is never combined with cleanable, always its own class |

### 2.2 Gemini Prompt Addition for Garage Detection

The T2 prompt must include:

```
GARAGE WINDOWS: Identify any decorative window inserts in garage doors.
These are NOT cleanable residential windows. Return as separate fields:
  - garage_door_count: integer (number of garage doors)
  - garage_door_style: "plain_panel" | "decorative_windows" | "carriage_style"
  - garage_pane_count: integer (total decorative inserts across all garage doors)
  
Do NOT include garage_pane_count in the residential window count.
Report them as a distinct observation class: GAR_WIN.
Confidence on garage detection should be 0.90+ (high-contrast, predictable location).
```

### 2.3 Garage Styles Observed in Castle Rock (Photo Evidence)

| Style | Example Property | Panes | Prevalence |
|-------|-----------------|-------|------------|
| Plain panel | 2788 Dreamcatcher (J30) | 0 | ~50-55% |
| Carriage-style 2-car | 2490 Trailblazer (J38) | 8 arched inserts | ~30% |
| Carriage-style 3-car | 1923 Rose Petal (J49) | 16 diamond inserts | ~10% |
| Split config (1+2 car) | 2154 Treetop Dr | 4-8 mixed | ~5% |

**Critical finding:** Garage door style varies WITHIN the same subdivision and street. 2788 (plain) and its neighbor 2800 (decorative) are on the same block. This is a per-property variable, not inferable from subdivision or assessor data.

---

## 3. Vision Coverage and Asymmetric Tolerance

### 3.1 Coverage Weight Formula

```
W_c = (front_coverage × 0.40) + (side_coverage × 0.30) + 
      (rear_coverage × 0.20) + (overhead_coverage × 0.10)
```

W_c drives the Bayesian blend weight between T1's quantity prior and T2's vision count.

### 3.2 Asymmetric Tolerance Rule

When W_c < 0.75:
- If T2 count < T1 prior × 0.80 → Do NOT trust vision (likely occlusion undercount). Reduce confidence by 0.10, flag for RANGE routing.
- If T2 count > T1 prior × 1.20 → TRUST vision (found real glass the prior didn't expect). Update D11 with vision count.

### 3.3 Property-Type Coverage Modifier

**SFH (detached):** Front-only Street View captures ~30-40% of total fenestration. Rear elevations frequently have MORE glass than fronts (e.g., 2490 Trailblazer: 18 rear panes vs 13 front panes). Multi-view coverage is essential.

**Townhome (attached):** Front-only Street View captures ~70-80% of total fenestration. Rear is nearly blank (garage + few panes). Shared walls have zero. The asymmetric tolerance rule can be RELAXED for townhomes because front vision coverage is much more representative.

**Implication:** For townhomes, front-only Street View with W_c = 0.40 may be sufficient for RANGE-eligible quotes. For SFHs, front-only produces dangerously low coverage and should stay in wide RANGE until tightener or multi-view data is available.

---

## 4. Material Detection for House Wash

### 4.1 Vision Must Detect

T2 must identify and separately tag:
- Primary siding material (vinyl, fiber cement, stucco, wood)
- Accent/secondary material (stone veneer, brick wainscoting) with approximate coverage percentage
- Garage door material (standard metal, painted wood/fiberglass, custom wood)
- Material transition boundaries (which height tier each material occupies)

### 4.2 Photo-Validated Material Observations

| Property | Primary | Accent | Garage | Notes |
|----------|---------|--------|--------|-------|
| 2490 Trailblazer | Stucco + lap siding | Stone veneer ~20% | Metal carriage | THREE materials — breaks Gemini's 2-material assumption |
| 2788 Dreamcatcher | Fiber cement lap | Stone columns ~5% | Plain metal | Relatively uniform — simple detection |
| 2154 Treetop Dr | Shake cement + lap | Stone veneer ~15% | Metal carriage (split) | Complex: 2 siding types + stone |
| 2559 Mayotte Way | Lap siding | Dark stone tower column | Plain metal | Modern contemporary — stone is architectural feature, not wainscoting |
| 3310 Hardin St | Fiber cement shingle + lap | Stone base ~10% | No garage visible (rear access) | Attached townhome |

### 4.3 Accent Detection Tripwire Update

Assessor exterior_wall_code captures only dominant material. Vision must confirm accent presence. The D6 companion documents the 4-tier tripwire logic that tells T2 when to actively look for accent materials vs assume uniform siding.

---

## 5. Entry Door and Transom Handling

Entry door sidelights and transoms ARE cleanable windows (observed at 2490 Trailblazer and 2154 Treetop). Typically 2-4 panes per entry. The V7 model implicitly includes these because invoices include them. Vision must count them as cleanable (type: FX — fixed non-operable).

Garage door decorative inserts are NOT cleanable by default. Vision must separate them into GAR_WIN class.

---

## 6. Walk-Out Basement Detection

### 6.1 From Vision

Walk-out basements visible in rear/side Street View as exposed foundation wall with windows below the main floor deck line. Confirmed at:
- 2490 Trailblazer (J38): rear deck with stairs, egress window under deck (AD.2 access)
- 2788 Dreamcatcher (J30): 3-level rear visible, 2 basement window wells on side

### 6.2 From Assessor + Terrain

bsmt_total > 0 combined with Castle Rock's rolling terrain creates 20-55% walk-out probability by subdivision. The V7 model captures this through the +4.9 panes/1000sf basement coefficient.

### 6.3 Egress Windows in Window Wells

Small, at ground level, easy for vision to miss entirely. These create systematic UNDERCOUNT risk (opposite of garage overcount). Vision prompt should specifically instruct: "Look for small rectangular windows at or below grade level, often surrounded by corrugated metal or concrete window wells."

---

## 7. Multi-Position Street View Camera Strategy

### 7.1 The Problem with Default Street View

The default Street View Static API request uses the target property's lat/lng and returns an image from the nearest available Street View car position — typically the road directly in front of the house. Even with panoramic spread (center, left -40°, right +40°), this only captures the **front facade**. For SFH properties where 50-60% of fenestration is on the sides and rear, front-only imagery produces dangerously incomplete coverage (W_c ≈ 0.40).

The fix is not wider panoramic spread from one position. It's **physically different camera positions** on adjacent streets that give angled views of the target property's side and rear elevations.

### 7.2 The Multi-Position Approach

Instead of requesting 3 images from one position, the system calculates optimal camera positions from multiple streets and pulls targeted shots from each.

**Interior tract lot (standard):** Request images from in front of the left neighbor (looking right at the target's left elevation) and from in front of the right neighbor (looking left at the target's right elevation). These capture the side-yard gap views.

**Corner lot:** The property has two or three street frontages. Request images from each street, pointed at the exposed facades. Corner lots have MORE vision coverage potential, not less.

**Rear-alley / backs-to-street lot:** Request an additional image from the street behind the property, pointed at the rear elevation. This is the highest-value shot in the system because rear facades are where the actuarial prior is weakest and where most unobserved glass lives.

**Attached townhome:** Shared walls mean zero side exposure. Skip neighbor-angle shots. Focus on front (primary glass face) and rear/alley if accessible.

**Open lot / acreage:** Neighbors too far away for angled shots. Front-only + satellite is the available coverage.

### 7.3 Camera Position Calculation Pipeline

**Step 1 — Property type classification:** Before requesting any Street View images, the system determines the property type and street access geometry. Two approaches:

**Deterministic (PostGIS — handles 80% of properties):**
Using data already in Supabase: parcel polygon (from Douglas County GeoJSON), building footprint (from Solar API when available), and street centerline data (from OpenStreetMap or county). A Supabase PostGIS function calculates line-of-sight from every adjacent street segment to every building face and returns optimal camera positions with heading angles.

```sql
-- Pseudocode for PostGIS camera position calculation
SELECT
  street_segment_id,
  ST_ClosestPoint(street_geom, building_face_centroid) AS camera_position,
  ST_Azimuth(camera_position, building_face_centroid) AS heading,
  building_face_name  -- 'front', 'left', 'right', 'rear'
FROM street_segments, building_faces
WHERE ST_DWithin(street_geom, building_face_centroid, 50)  -- within 50m
ORDER BY coverage_value DESC;
```

**AI-assisted (Gemini — handles the 20% edge cases):**
For properties where the PostGIS geometry returns low-confidence positions (unusual layouts, cul-de-sacs, flag lots), feed Gemini the satellite overhead + street map layer:

```
Analyze this property's surroundings. Identify all streets with 
line-of-sight to any facade of the building. Classify the property 
as: interior_tract | corner_lot | rear_alley | open_lot | attached_unit.

For each street with line-of-sight, return the optimal camera lat/lng 
and heading to capture the maximum visible facade area of the target 
building. Consider tree canopy and structure obstructions visible in 
the satellite image.
```

**Step 2 — Camera array request:** The `collect_raw_snapshots.js` script (or the Make.com M3 scenario) takes the calculated camera positions and requests Street View Static API images from each position with the computed heading.

Example output for an interior tract lot:

```json
{
  "property_type": "interior_tract",
  "camera_positions": [
    {
      "name": "front_center",
      "lat": 39.3872, "lng": -104.8534,
      "heading": 185,
      "expected_coverage": "front_face_full",
      "confidence": 0.95
    },
    {
      "name": "left_neighbor_angle",
      "lat": 39.3873, "lng": -104.8537,
      "heading": 145,
      "expected_coverage": "left_side_partial",
      "confidence": 0.70
    },
    {
      "name": "right_neighbor_angle",
      "lat": 39.3871, "lng": -104.8531,
      "heading": 225,
      "expected_coverage": "right_side_partial",
      "confidence": 0.70
    }
  ]
}
```

**Step 3 — Coverage weight update:** The W_c formula incorporates the actual facades captured:
- Front center shot: front_coverage = 0.90+
- Left neighbor angle: side_coverage += 0.30-0.50
- Right neighbor angle: side_coverage += 0.30-0.50
- Rear street shot (if available): rear_coverage = 0.60-0.80
- Satellite overhead: overhead_coverage = 0.80+

A tract home with all four shots can achieve W_c ≈ 0.75-0.85 — potentially BIND-eligible from imagery alone without tightener questions.

### 7.4 Street View Coverage Availability Constraint

Google Street View imagery is only available where the Street View car actually drove. The API snaps requested lat/lng to the nearest available coverage point. In dense Castle Rock subdivisions, coverage exists on most residential streets. However:

- **Cul-de-sacs:** The car may not have driven to the end. Deepest homes have no nearby coverage.
- **Private roads / gated communities:** No Street View coverage at all.
- **New construction (post-2022):** Google's most recent Street View pass for Castle Rock is typically 2019-2021. Homes built after the latest pass have no imagery.
- **Alleys:** Coverage is inconsistent. Some alleys were driven, most were not.

**Handling `ZERO_RESULTS`:** When the Street View API returns no image for a calculated camera position, the system must handle it gracefully:
1. Log the failed position with the expected coverage it would have provided
2. Reduce the W_c calculation to reflect the missing facade
3. Do NOT retry with a shifted position (risks capturing the wrong property)
4. Fall back to the Tier A actuarial prior for the unobserved components
5. Route to RANGE mode if the missing coverage drops W_c below BIND threshold

**New construction note:** Properties built after the latest Street View pass are the hardest to quote. They have no Street View imagery, often no Solar API coverage (the 404 issue discovered in Castle Rock), and no job history. These properties rely entirely on Tier A assessor data + satellite overhead + customer tightener questions. The system should detect `year_built > latest_streetview_year` and automatically flag for wider RANGE bands.

### 7.5 Wrong House Detection (Three-Layer Defense)

Even with calculated headings, dense neighborhoods can cause camera drift to adjacent properties.

**Layer 1 — Geospatial heading correction:** Calculate the geometric angle between the Street View car position and the target building's footprint centroid. Pass this exact bearing as the `heading` parameter. This prevents the default "looking down the street" behavior.

**Layer 2 — AI cross-verification:** The Gemini prompt includes an identity verification gate:

```
Before extracting any component data, complete these checks:
1. Look for a house number in the Street View image. Does it match [TARGET_NUMBER]?
2. Compare the roofline shape in the Street View image against the satellite overhead. 
   Does the structure match?
If check 2 is NO, return {"wrong_house_detected": true} and halt extraction.
```

**Layer 3 — Prior-posterior collision:** If vision returns `stories_visible = 1` but the assessor record says `stories_ag = 2`, or if the vision pane count is more than 20% below the ZCTA prior, the Bayesian reconciliation engine rejects the entire vision payload. This uses the same asymmetric tolerance code path that handles the "right house, occluded rear" case — no duplicate logic needed.

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-05 | Created companion document. Documented v1.0→v1.8 garage evolution and formalized GAR_WIN separation. | Garage panes always separate from cleanable count. Default excluded from quotes. |
| 2026-03-05 | Added property-type coverage modifier (SFH vs townhome). | Townhome front-only coverage is ~70-80% representative vs SFH ~30-40%. Asymmetric tolerance can be relaxed for townhomes. |
| 2026-03-05 | Documented material detection requirements for house wash from 5 photo-validated properties. | T2 must detect primary siding, accent material with %, garage door material, and material transition boundaries. |
| 2026-03-05 | Added egress window well detection guidance. | Prevents systematic undercount of below-grade fenestration. |
| 2026-03-06 | Added multi-position Street View camera strategy (Section 7). | Replaces single-position panoramic with calculated neighbor-angle shots for side/rear coverage. W_c can reach 0.75-0.85 on tract homes. |
| 2026-03-06 | Added Street View coverage availability constraint (Section 7.4). | Handles ZERO_RESULTS gracefully. New construction detection for wider RANGE bands. |
| 2026-03-06 | Added wrong house detection three-layer defense (Section 7.5). | Geospatial heading + AI cross-verification + prior-posterior collision. Uses existing asymmetric tolerance code path. |
