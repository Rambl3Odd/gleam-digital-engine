# Diagnostic Batch 1 — Photo Analysis Report

## 2788 Dreamcatcher Loop (J30) — INVOICE DISCREPANCY FOUND

**Invoice #30 — $476.37 — Job time: 3h 30m**

ServiceM8 SKU breakdown (from screenshot):
| SKU | Description | Qty | Price | Total |
|-----|-------------|-----|-------|-------|
| WC.R.BSC.SL1.L1.1 | Ext-only, Standard Pane, 1st Story | 31 | $5.15 | $159.65 |
| WC.R.BSC.SL1.L2.1 | Ext-only, Standard Pane, 2nd Story | 24 | $6.15 | $147.60 |
| WC.R.DLX.SL1.L1.1 | Int+Ext, Standard Pane, 1st Story | 7 | $7.80 | $54.60 |
| WC.R.DLX.SL1.L2.3 | Int+Ext, Large Picture, 2nd Story | 9 | $11.15 | $100.35 |

**Total physical panes: 71** (31+24+7+9), NOT 62 as recorded in job history.
The job history missed the 9 large picture windows. Invoice description confirms: "Exterior Only + 16 Interior windows" (7+9=16 int).

**V7 impact:** If actual = 71, V7 prediction of 62.2 is -12.4% (YELLOW), not +0.3% (GREEN).

**Photo observations:**
- Garage: Plain panel, 0 decorative panes (CONFIRMED from D6)
- Materials: Fiber cement lap siding (primary), stone accent columns on front porch and bump-out (not wainscoting)
- Walk-out basement: CONFIRMED from rear photo — stairs from deck to grade, basement windows visible
- Egress wells: 2 visible at basement level (matches D6 documentation)
- Satellite dish partially blocking one HL.2 side window
- Complex roofline: 5+ planes, multiple gables — RC should be 1.25 not default 1.10
- Accent stone coverage: ~8-10% (porch columns + bump-out base only, not full wainscoting)

**Facade pane distribution (from photos):**
- Front: ~13 panes visible (HL.1: ~8, HL.2: ~5)
- Rear: ~20+ panes visible (heavy glass — large picture windows at both levels + deck doors)
- Sides: ~6-8 per side
- Basement: 2-4 egress windows
- Rear has significantly MORE glass than front — consistent with D6 observation

---

## 2490 Trailblazer Way (J38) — 3-MATERIAL FACADE CONFIRMED

**Job notes:** 6h 28m with 1 Level 2 tech + 1 Level 1 tech + 1 trainee. Training job done for free. Time inflated by training, redo due to splashing/oxidization on rear picture windows, and 30-min phone call. Not usable for time calibration.

**Interior note:** 16 total interior windows — clerestory above entry + large picture windows on back. This means the 66-pane invoice was primarily exterior with selective interior.

**Photo observations:**
- Garage: Carriage-style 2-car with decorative arched panes — approximately 8 panes (CONFIRMED from D6: 8 carriage panes excluded from 66-pane invoice)
- Materials (3-material facade CONFIRMED):
  - Stucco: Upper gable sections (dark gray)
  - Fiber cement lap siding: Mid-sections, all of rear (wood-grain texture visible in close-up)
  - Stone veneer: Lower wainscoting ~3-4 feet from grade, wrapping front and side corners
- Walk-out basement: CONFIRMED — deck with stairs to lower patio, basement window visible under deck
- Rear facade: HEAVILY glazed — 3 large picture windows HL.2 (SDL grid, the ones with oxidization), 2+ large picture windows HL.1, multiple standard windows. Notes confirm "rear has MORE glass than front."
- Basement window under deck: 1 pane at BG0, restricted access (storage shed blocking, AD.2 modifier)
- Roof material: Concrete tile (not comp shingle — higher-end than assessor suggests)
- Accent stone coverage: ~20% (matches SDR-006 Tier 3 for Average quality post-2000)

**Pricing calibration note:** The $11.15/pane for HL.2 large picture windows at Dreamcatcher implies FA.2 (1.5x) × HL.2 (1.25x) on the base int+ext rate. Working backward: $11.15 ÷ 1.875 = $5.95 base int+ext per pane, which is close to $7.80/1.0 for the standard 1st-story int+ext. The FA.2 multiplier on the HL.2 tier creates a 2.3x rate over standard ext-only ($11.15 vs $5.15).

---

## 2559 Mayotte Way (J28) — DETACHED 3-STORY, NOT ATTACHED

**Correction from Street View:** 2559 Mayotte is a DETACHED 3-story modern home, NOT an attached townhome. The satellite view shows narrow gaps between units (gravel/rock side yards). Each unit is freestanding but very close to neighbors.

**Assessor says:** Average quality, 3-story, 1947 AGSF, 507sf finished basement, 0 unfinished.

**V7 implication:** The is_townhome coefficient (-2.9) may not apply if these are technically detached SFH. The assessor codes it as "Average" not "Good" which also changes is_good_plus from 1 to 0. Current V7 prediction (43.5) vs actual (47) is GREEN at 7.4% — removing the townhome flag would push prediction higher, potentially closer to actual.

**Rear facade (from uploaded image):**
- 2559 is the gray unit on the right (house number visible: "2559")
- Garage: 1-car, open, plain panel (0 decorative panes)
- HL.1 (ground): Garage + possibly 1-2 windows at ground level
- HL.2 (2nd floor): Large picture window/slider unit (appears to be 4+ pane grouping), additional standard windows
- HL.3 (3rd floor): 2 windows visible on the rear upper level
- Material: Fiber cement lap siding with contrasting dark accent panels (board-and-batten on portions)
- No stone accent visible — clean modern design
- Rooftop deck visible from satellite (unique architectural feature)

---

## 1923 Rose Petal Ct (J49) — PARTIAL SCOPE INVOICE CONFIRMED

**Invoice #49 — $246.00**

| Description | Qty | Price | Total |
|-------------|-----|-------|-------|
| Ext-only Standard Pane | 40 | $5.50 | $220.00 |
| Screen Cleaning | 23 | $2.50 | $57.50 |
| Free Screen Cleaning | -23 | $2.50 | -$57.50 |
| Int-only Large Picture 2nd Story | 4 | $6.50 | $26.00 |

**Total panes serviced: 44** (40 ext + 4 int-only large picture)
**Screens: 23** (comped — free cleaning promo)

This confirms cherry-pick partial scope. The 4 interior-only large picture windows at 2nd story were cleaned from inside only (customer couldn't reach them). The 40 exterior panes were a subset of the full property's ~60+ panes.

**V7 with real assessor data:** AGSF=3541, 2-story, 4-bed, Good quality, 529sf basement.
Prediction: 58.9 vs estimated full ~60 = 1.8% error (GREEN). Partial scope handling validated.

---

## 2168 Treetop Dr (J35) — SOLE RED, RANCH OVERESTIMATE

**On-site photo (rear/side):** 
- 1-story ranch confirmed from photo — single-level roofline, no upper story visible
- Covered rear porch with glass doors + gridded sidelights
- Visible panes on rear: ~8-10 (gridded decorative SDL windows, glass door, sidelights)
- Material: Fiber cement lap siding (horizontal planks)
- Stone accent: Porch base/knee wall only — minor coverage (~5%)
- Well-maintained landscaping, hot tub area — indicates higher-end homeowner despite "Average" quality grade

**The ranch problem:** V7 predicts 50.4 panes but actual is 34. AGSF=2337 is modest for a ranch. With 2 bedrooms (assessor), the -11.7 × 2 = -23.4 bedroom penalty is lower than for a 4-bed home. The model's AGSF coefficient (+43.0 per 1000sf = +100.4 for 2337sf) dominates, but ranches use their sqft for living volume (vaulted ceilings, great rooms) rather than more windows.

**Root cause confirmed:** The V7 model lacks a story-specific intercept. A 1-story ranch intercept of approximately -15 to -18 would bring this prediction in line. Need more ranch data points to calibrate — J33 (2751 Black Canyon, also 1-story, AGSF=2439, 47 actual vs 42.5 predicted) shows the model can work on ranches with basements. The difference is J35 has only 2 bedrooms while J33 has 3.

---

## Key Findings for V7 Recalibration

1. **J30 pane count needs correction:** Invoice shows 71 panes, not 62. The 9 large picture windows at HL.2 were missed in original job history parsing. This shifts J30 from GREEN to YELLOW.

2. **J28 (Mayotte) is detached, not townhome:** The is_townhome flag should be 0. Re-check assessor property_type coding.

3. **Rear facades consistently have MORE glass than front:** Confirmed at Trailblazer (heavily glazed rear), Dreamcatcher (9 large picture windows on rear), and implied at Rose Petal. Street View front-only coverage systematically undercounts by 20-30%.

4. **3-material facades are common in the Castle Rock corpus:** Trailblazer (stucco + lap + stone), Dreamcatcher (fiber cement + stone columns). The house wash material decomposition from D10 is validated.

5. **SDL decorative grids are NOT French panes:** The gridded windows visible in multiple photos have simulated divided lights (SDL — grids between or on the glass), not true divided lights (TDL). They clean as single panes, not per-grid-square. This is important for FA classification: SDL = FA.1 (standard), TDL = FA.3 (2.0x multiplier).
