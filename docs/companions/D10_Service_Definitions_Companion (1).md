# D10 Service Definitions Companion
## Gleam 3.0 — Domain 10: Service Definitions

**Parent Document:** Master Architecture & Design Specification v1, Section 10  
**Last Updated:** 2026-03-06  
**Status:** Active — incorporates corrected house wash canvas math, material decomposition, production rate tables, labor rate reconciliation, and partial scope pricing interface

---

## 1. Purpose

D10 maps component quantities from D11 to labor time, materials cost, and customer price through the VTM (Variable Time Modifier) architecture. This companion carries the service-specific formulas, production rates, and the corrected house wash canvas decomposition that prevents margin leakage from flat-rate material assumptions.

---

## 2. House Wash — Material-Decomposed Canvas

### 2.1 Core Correction

**Nothing gets washed for free.** The total billable wash area = gross wall area. Fenestration (glass) is NOT subtracted — chemical hits windows during wash and rinse time is real labor. Garage door surface is NOT subtracted — it gets washed, just routed to its own material class for chemistry. Accent stone is NOT subtracted — it gets washed at a different production rate.

Material decomposition drives PRICING RATE, not area reduction. The sum of all material zones always equals gross wall area.

### 2.2 Formula

```
gross_wall_sqft = est_perimeter_adj × (stories_ag × 10) + walkout_addition

Material decomposition:
  Component A (Primary siding) = gross_wall - garage_door_area - accent_area
  Component B (Accent stone)   = gross_wall × accent_percentage
  Component C (Garage door)    = 112 sqft (2-car) or by garage_type
  
  VALIDATION: A + B + C = gross_wall (always)
```

### 2.3 Production Rates by Material

| Material | Code | Production Rate (sqft/hr) | Notes |
|----------|------|--------------------------|-------|
| Vinyl siding | SDG.VNL | 800 | Standard soft-wash, fast rinse |
| Fiber cement (Hardie) | SDG.FIB | 700 | Slightly slower, harder rinse |
| Stucco / EIFS | SDG.STU | 600 | Porous, more chemical dwell |
| Painted wood | SDG.WDS | 500 | Delicate, low PSI required |
| Stone / brick veneer | STN.MSV | 450 | MA1 heavy-texture modifier |
| Metal garage door | GAR.MTL | 800 | Same as vinyl rate, oxidation flag |
| Wood garage door | GAR.WDS | 500 | Same as painted wood, stain risk flag |

### 2.4 Height Tier Split

| Stories | HL.1 (ground) | HL.2 (2nd story) | HL.3 (3rd) |
|---------|--------------|-----------------|------------|
| 1-story | 100% | 0% | 0% |
| 2-story | 50% | 50% | 0% |
| 3-story | 33% | 33% | 33% |

Height multipliers: HL.1 = 1.00×, HL.2 = 1.25×, HL.3 = 1.50×

Walk-out basement addition: 100% HL.1 (ground accessible).
Accent stone: almost always HL.1 only (lower elevation wainscoting).
Garage door: always HL.1.

### 2.5 Worked Example — 2490 Trailblazer Way (J38)

Gross wall: ~2700 sqft (2-story, 3060 AGSF)

Photo-confirmed decomposition:
- Stucco (upper): 945 sqft → 50% HL.1, 50% HL.2
- Lap siding (mid): 1080 sqft → 50% HL.1, 50% HL.2
- Stone veneer (lower): 540 sqft → 100% HL.1
- Garage door (MTL): 112 sqft → 100% HL.1

Execution time:
| Zone | Area | Rate | HL Mult | Time |
|------|------|------|---------|------|
| Stucco HL.1 | 472 sqft | 600/hr | 1.00× | 0.79 hr |
| Stucco HL.2 | 472 sqft | 600/hr | 1.25× | 0.98 hr |
| Siding HL.1 | 540 sqft | 700/hr | 1.00× | 0.77 hr |
| Siding HL.2 | 540 sqft | 700/hr | 1.25× | 0.96 hr |
| Stone HL.1 | 540 sqft | 450/hr | 1.00× | 1.20 hr |
| Garage HL.1 | 112 sqft | 800/hr | 1.00× | 0.14 hr |
| **Total cleaning** | | | | **4.84 hr** |

+ Fixed buffers (JHA, setup, verification): 0.75 hr
+ Compliance buffer (25%): 1.21 hr
Total hours: 6.80 hr

Labor: 6.80 × $55/hr = $374
Materials: (2700/100) × $0.65 = $17.55
Total cost: ~$392
**Minimum price (30% margin): $560**

vs. FLAT-RATE (treating everything as vinyl): $390
**Margin leak from ignoring materials: $170 (30% of correct price)**

### 2.6 Chemistry Flags by Material

| Material | Chemistry Restriction | Tech Brief |
|----------|----------------------|------------|
| SDG.VNL (vinyl) | Standard SH mix 1.0-2.0% | No restrictions |
| SDG.FIB (fiber cement) | Standard SH, can handle moderate PSI | Avoid direct high-pressure on painted surfaces |
| SDG.STU (stucco) | Higher SH 1.5-3.0%, extended dwell | Porous — needs more chemical |
| SDG.WDS (painted wood) | Low PSI only, standard SH | High damage risk — never direct high pressure |
| STN.MSV (stone) | Low PSI, extended dwell, masonry detergent | MA1 modifier — heavy texture absorbs chemical |
| GAR.MTL (metal door) | Low-pressure rinse only | ⚠ Oxidation risk — strong bleach strips paint |
| GAR.WDS (wood door) | Low PSI, standard SH | ⚠ Will strip stain — confirm with customer first |

---

## 3. Window Cleaning — Pane-Level Pricing

### 3.1 Base Times (from Playbook SSOT)

| Service | Base Time | Unit |
|---------|-----------|------|
| Exterior pane | 3.3 min | per pane |
| Interior pane | 3.3 min | per pane |
| Screen cleaning | ~1.0 min | per screen |
| Track cleaning | ~1.5 min | per track |

### 3.2 FA (Fenestration Area) Multipliers

| FA Class | Description | Time Multiplier |
|----------|-------------|----------------|
| FA.1 | Standard pane (<21 sqft) | 1.0× |
| FA.2 | Large format / picture (≥21 sqft) | 1.5× |
| FA.3 | French grid / true divided light | 2.0× (or +3.0 min additive) |
| FA.4 | Egress / obstructed | 1.0× + AD.2 access modifier |
| FA.5 | Skylight | 1.5× + HL.3 height modifier |

### 3.3 Height Multipliers (Window Cleaning)

| Tier | Description | Multiplier |
|------|-------------|-----------|
| HL.1 | Ground / 1st story | 1.00× |
| HL.2 | 2nd story (extension pole or ladder) | 1.25× |
| HL.3 | 3rd story (40ft+ WFP) | 1.50× |
| HL.4 | 4+ stories | ONSITE escape hatch — custom quote |

HL.3 confirmed as real operational tier at Mayotte Way (J28): 6 panes priced at $15.95 vs $6.80 standard = 2.3× rate, consistent with FA.2 (1.5×) × HL.3 (1.5×) compounding.

---

## 4. Gutter Cleaning

### 4.1 VTM Formula (MULTIPLICATIVE, not additive)

```
Adjusted_Minutes = Base_Min_per_LnFt × Quantity_LnFt × HL_mult × SL_mult
```

| Component | Value | Notes |
|-----------|-------|-------|
| Base_Min_per_LnFt | 2.00 min/lnft | GUT-CLN SKU |
| Sell rate | $1.50/lnft | |
| HL.1 | 1.00× | 1-story baseline |
| HL.2 | 1.25× | 2-story, ladder repositioning |
| SL (light debris) | 1.00× | |
| SL (moderate) | 1.33× | |
| SL (heavy) | 1.75× | |

**Critical:** Gutter debris level is MULTIPLICATIVE with height. Heavy debris at HL.2 compounds ladder time (more trips up/down, more bag-offs). Additive modifiers on elevated gutter tasks is a known bias trap that drastically underprices the work.

### 4.2 Gutter Guard Gate

If gutter guards are present and type is unknown → force RANGE or ONSITE. Guard removal/reinstall adds significant variable time depending on guard type (snap-in vs screw-in vs foam vs brush).

Tightener question: "Do you have gutter guards?" [Yes] [No] [Not sure]. "Not sure" → RANGE mode with widened confidence interval.

---

## 5. Pressure Wash / Soft Wash — Flatwork & Surfaces

### 5.1 Base Production Rates

| Surface | Rate (sqft/hr) | Method |
|---------|----------------|--------|
| Concrete flatwork (light) | 1,600-2,000 | Surface cleaner, cold water |
| Concrete flatwork (hot) | 2,400 | Surface cleaner, hot water |
| Vinyl siding | 800 | Soft wash |
| Stucco | 600 | Soft wash |
| Roof (soft wash prep) | 400 | Soft wash, overhead application |

### 5.2 5-Step VTM Formula

```
Step 1: BaseRate = lookup by surface type
Step 2: EffectiveRate = BaseRate × Π(all multipliers) ÷ ReclamationDivisor
Step 3: TotalHours = (SqFt ÷ EffectiveRate) + ΣFixedBuffers + (ComplianceBuffer% × cleaning hrs)
Step 4: TotalCost = (TotalHours × $55/hr blended × CrewFactor) + Materials + Fuel
Step 5: MinimumPrice = TotalCost ÷ 0.70  ← enforces 30%+ gross margin
```

---

## 6. Labor Rate Reconciliation

### 6.1 The Two Rates

The architecture uses two distinct labor rates that must not be confused:

| Rate | Value | Used For | Source |
|------|-------|----------|--------|
| Loaded labor rate | $36.00/hr ($0.60/min) | Margin floor calculation for window cleaning and per-unit pricing | D10 base anchor, Playbook SSOT |
| Blended crew rate | $55.00/hr | Full job cost buildups for washing/pressure services (includes crew burden, equipment amortization) | Exterior Washing VTM Audit |

**Rule:** Window cleaning pricing uses the $36/hr loaded labor rate as the base for per-pane time-to-cost conversion. Washing services (house wash, roof wash, pressure wash) use the $55/hr blended crew rate in the 5-step formula because washing deploys heavier equipment, more chemical, and typically a 2-person crew.

### 6.2 Margin Floor Enforcement

Both rate paths converge at the same margin gate:
```
MinimumPrice = TotalCost ÷ 0.70  → enforces 30%+ gross margin
```

Additional hard floors:
- Job minimum: $125.00 (regardless of calculated price)
- Film/tint minimum: $450.00
- Maximum discount cap: 20% (Gleam-On + bundle + promo combined)

---

## 7. Partial Scope Pricing

### 7.1 The Problem

~15% of window cleaning jobs are partial scope. The pricing engine must handle zone-level scope selection without always pricing the full property.

### 7.2 Supabase RPC Interface

The pricing RPC must accept a zone inclusion filter:

```sql
-- Pricing RPC signature
SELECT calculate_window_quote(
  property_id UUID,
  service_type TEXT,            -- 'WIN-EXT', 'WIN-INT-EXT', etc.
  included_zones TEXT[],        -- ['Z-2F','Z-2L','Z-2R','Z-2B','Z-1F','Z-1L','Z-1R','Z-1B']
  excluded_zones TEXT[],        -- ['BG0','GAR_WIN']
  int_ext_mode TEXT             -- 'ext_only', 'int_ext_full', 'int_ext_selective'
) RETURNS JSON;
```

When `included_zones` is NULL, the RPC prices the full property (default behavior). When zones are specified, only D11 components in those zones are included in the calculation.

### 7.3 Tiered Package Output

The pricing RPC should return multiple price points in a single call for the tiered package presentation:

```json
{
  "complete_care": {
    "panes": 58, "price": 480, "includes": "int+ext, screens, tracks"
  },
  "pick_3_bundle": {
    "panes": 58, "price": 348, "discount_pct": 10,
    "includes": "ext + screens + tracks (default combo)"
  },
  "exterior_only": {
    "panes": 58, "price": 280, "includes": "exterior only"
  },
  "garage_addon": {
    "panes": 8, "price": 44, "default_included": false
  },
  "basement_addon": {
    "panes": 6, "price": 52, "default_included": false
  }
}
```

The booking hub reads this single response and renders all three tiers plus the add-on options without additional API calls.

---

## 8. Pricing Math Location Rule

### 8.1 Division of Labor

All VTM pricing calculations MUST run in Supabase as SQL Views or RPC functions. Make.com is the orchestrator — it passes property_id and service parameters to Supabase and receives the computed price. Make.com never executes VTM multiplication, FA distribution parsing, or margin floor enforcement.

**Why:** A 35-window property with per-pane FA distribution, HL tier splits, and zone-level VTM compounding would require 20+ Make.com Math modules running sequentially. This consumes thousands of operations per quote and risks the 300-second scenario execution limit. A Supabase RPC executes the same calculation in <50ms as a single SQL query.

### 8.2 CEF Isolation Rule

The Crew Efficiency Factor (CEF) measures individual technician speed (Master Tech at 0.85×, Trainee at 1.25×). CEF applies ONLY to the CP-SAT Sequencer for scheduling duration. It is NEVER applied to the pricing engine.

**Customer price is anchored to the 1-tech baseline.** If a skilled crew finishes a 4-hour quoted job in 3 hours, Gleam captures the margin expansion. The customer price does not fluctuate based on which employee is dispatched.

### 8.3 Escape Hatches (Force ONSITE)

| Trigger | Condition | Reason |
|---------|-----------|--------|
| HL.4 | 4+ stories | Requires motorized boom lift assessment |
| PT.4 | Roof pitch > 10/12 | Dual-rope access required |
| SL.4 | Post-construction soiling | Chemical testing required |
| MFR_FILM_IGU | Film on unknown glass type | Thermal stress fracture risk |
| Pre-1978 + interior work | year_built < 1978 | EPA lead paint disclosure required |

When any escape hatch fires, D10 blocks BIND mode and forces ONSITE routing regardless of confidence scores.

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-05 | Created companion document. Corrected house wash canvas: nothing washed for free. Garage door and fenestration stay in gross wall billable area. | Prevents $170/job margin leak on mixed-material properties. |
| 2026-03-05 | Added material decomposition worked example from 2490 Trailblazer (photo-validated 3-material facade). | Demonstrates flat-rate vs material-decomposed pricing delta. |
| 2026-03-05 | Documented HL.3 as confirmed operational tier from Mayotte Way (J28). | 3rd-story windows require 40ft+ WFP, priced at 2.3× standard rate. |
| 2026-03-05 | Added chemistry flags table for house wash material variants. | Ensures tech gets correct chemical/PSI guidance per material zone. |
| 2026-03-06 | Added labor rate reconciliation (Section 6). | Clarifies $36/hr loaded vs $55/hr blended crew rate. Prevents cross-contamination between window and wash pricing paths. |
| 2026-03-06 | Added partial scope pricing interface (Section 7). | Supabase RPC accepts zone inclusion filter. Returns tiered package prices in single call. |
| 2026-03-06 | Added pricing math location rule (Section 8). | All VTM math in Supabase RPCs. Make.com is orchestrator only. CEF isolation enforced. Escape hatches documented. |
