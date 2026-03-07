# Section 14 Customer Interface Companion
## Gleam 3.0 — Customer Estimation & Booking Interface

**Parent Document:** Master Architecture & Design Specification v1, Section 14  
**Last Updated:** 2026-03-06  
**Status:** Active — incorporates progressive disclosure pipeline, tiered package anchoring, partial scope customizer, interior/exterior scope selection, and 3-tap field observation form

---

## 1. Purpose

Section 14 defines the customer-facing estimation and booking experience: the progressive disclosure wizard (M1.1), the confidence-based quote routing (BIND/RANGE/ONSITE), the tightener question system, the tiered package presentation, and the booking hub. This companion carries the operational detail, UX logic, and pricing psychology that the Master Architecture references but does not fully specify.

---

## 2. Confidence Progression Pipeline

The estimation system is designed so that a customer who engages with the wizard can push a RANGE quote across the BIND threshold (0.85 composite confidence) WITHOUT ever needing a tech visit.

### 2.1 Four Stages of Confidence Accumulation

**STAGE 1 — Address Entry (Tier A, <200ms)**

System executes Supabase lookup → D1 property record → D6 ZCTA prior → V7 regression → D11 component seed at Tier A confidence.

Typical confidence at this stage:
- Window panes: 0.45 | Gutter LF: 0.50 | Roof area: 0.40 | Siding material: 0.48
- Composite: ~0.45 → **RANGE mode**
- Customer sees: Asymmetric price range (P25 to P85)
- Trust builder: "We pulled public records for your home — does 3,060 sq ft and 2 stories sound right?"

**STAGE 2 — Vision Enrichment (Tier B, ~4-5 seconds background)**

Make.com fires T2 Gemini Vision against Street View panoramic, satellite, and Solar API while customer sees animated loading text ("Analyzing your property...").

Typical confidence uplift:
- Window panes: 0.45 → 0.68 | Gutter: 0.50 → 0.93 | Roof: 0.40 → 0.95 | Siding: 0.48 → 0.82
- Some primitives cross BIND threshold (gutters, roof, driveway often BIND-eligible after vision)
- Windows typically stay in RANGE (rear elevation unobserved from Street View)

**STAGE 3 — Tightener Round 1 (Customer input, ~30 seconds)**

System identifies top 2 variance-contributing VTM dimensions from Monte Carlo run. Renders targeted questions.

Example tightener questions for window cleaning:
- "Roughly how many windows are on the rear of your house?" → [2-4] [5-8] [9-12] [More than 12] [Not sure]
- "When you open most of your windows, do they slide up and down, crank outward, or slide sideways?" → [Up and down] [Crank outward] [Slide sideways] [Mix] [Not sure]

Typical confidence uplift: +0.10 to +0.15 per question answered.

**STAGE 4 — Tightener Round 2 (Customer input, ~30 seconds)**

Remaining variance sources addressed. Common Round 2 questions:
- "Does your home have a walk-out basement with windows visible from outside?" → [Yes] [No] [Not sure]
- "How would you describe your windows?" → [3 photos: Crystal Clear / Light Film / Heavy Buildup]

Typical result: composite crosses 0.85 → **BIND mode**. Customer sees exact locked price.

### 2.2 Complete Confidence Journey (Worked Example: 2490 Trailblazer Way)

```
ADDRESS ENTRY ─── 0.45 ──→ RANGE ($310-$405)     spread = $95
     │
VISION RUNS ───── 0.68 ──→ RANGE ($310-$370)     spread = $60
     │
TIGHTENER R1 ─── 0.78 ──→ RANGE ($335-$365)     spread = $30
     │
TIGHTENER R2 ─── 0.86 ──→ BIND ($348)            spread = $0
     │
CUSTOMER BOOKS    30-day price lock guarantee
     │
TECH ARRIVES      2-min walkthrough → D8 → D11 → D6 ZIP DNA learns
```

Total customer time: ~90 seconds. Total API cost: ~$0.03. Onsite visit: NOT required.

### 2.3 Confidence Uplift by Tightener Type

| Tightener Question | Confidence Uplift | Best For |
|-------------------|-------------------|----------|
| Rear window count (range select) | +0.10 to +0.15 | WIN pane count |
| Window type (up/down vs crank) | +0.15 to +0.25 | WIN type distribution / pane multiplier |
| Walk-out basement (yes/no) | +0.05 to +0.10 | WIN egress count, SDG walkout area |
| Gutter guards (yes/no/not sure) | +0.10 to +0.15 | GUT-CLN pricing gate |
| Soiling level (photo match) | +0.08 to +0.12 | SL VTM for all services |
| Confirm stories (1/2/3) | +0.05 | HL distribution |
| Rear photo upload | +0.15 to +0.25 | ALL rear components |
| Roof accessibility (walkable/steep) | +0.10 to +0.15 | PT pitch tier |

System picks top 2 by variance contribution. Max 2 rounds × 2 questions = 4 tightener taps maximum. Rear photo upload is offered only if first 2 rounds don't cross BIND threshold (high friction).

### 2.4 The "Not Sure" Rule (REQ-Z-021)

When a customer answers "Not sure" to any tightener question:
- Do NOT default to worst case (causes massive over-quoting)
- Do NOT default to best case (causes margin risk)
- Keep the ZCTA prior distribution (wider variance)
- Drop confidence by 0.10 instead of collapsing to a single value
- Monte Carlo naturally widens the RANGE band
- Customer stays in RANGE with competitive midpoint
- Customer CAN book from RANGE price — P85 protects margin

### 2.5 Satisficing Decay Threshold

If a customer answers a property-observable question in fewer than 2,000 milliseconds from when it appeared, the answer is flagged `satisficing_detected: true`. The system does NOT reject the answer or ask the customer to reconsider. The flag silently reduces the confidence uplift from that answer by 50%, preventing rapid tapping from artificially inflating confidence scores.

---

## 3. Tiered Package Presentation (Anchoring Strategy)

### 3.1 Design Philosophy

The quote result page uses behavioral anchoring: lead with the premium option (Complete Care) to establish the high-value reference point, present the most common bundle (Pick 3) as the smart middle choice, and position exterior-only as the floor. Scope customization is accessible but not primary — it exists as a text link below the tiers, not as the default interface.

**Anti-pattern (avoid):** Presenting zone-level scope reduction checkboxes as the primary interface. This makes it too easy to reduce scope and anchors the customer to a lower number.

### 3.2 Tier Structure (Window & Glass Care)

**Tier 1 — Complete Care (anchor)**
Every cleanable window, inside and out, screens, tracks. Full pane count × Deluxe int+ext rate + screens + tracks, bundle discount applied.
- Price position: Highest
- Purpose: Establish value anchor; ~15-20% of customers select this
- Microcopy: "The works — every window sparkling, inside and out"

**Tier 2 — Pick 3 Bundle (sweet spot)**
Customer's choice of 3 from the 6 service tiles (Exterior, Interior, Screens, Tracks, Tint/Film, Restoration). Most common combo: Exterior + Screens + Tracks. Full pane count × appropriate rates, 10% bundle discount.
- Price position: Middle (shows savings vs Complete Care)
- Purpose: Where most customers land; feels like a smart deal
- Microcopy: "Most popular — pick 3 services, save 10%"

**Tier 3 — Exterior Only (floor)**
Full pane count × exterior rate. No bundle discount (only 1 service).
- Price position: Lowest standard option
- Purpose: Price-sensitive customers; still full property scope
- Microcopy: "Just the outside — a great place to start"

**Customize link (below tiers)**
Small text link: "Need something different? Customize your service →"
Opens the zone-level scope customizer for the ~15% who need partial scope.

### 3.3 Step 1 Service Picker (Current Implementation)

The existing 6-tile service picker with bundle discount nudging remains Step 1:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Exterior   │  │   Interior   │  │   Screen     │
│   Window     │  │   Window     │  │   Cleaning   │
│   Cleaning   │  │   Cleaning   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Window     │  │  Window Tint │  │  Window &    │
│   Track      │  │   & Film     │  │  Glass       │
│   Cleaning   │  │              │  │  Restoration │
└──────────────┘  └──────────────┘  └──────────────┘

Pick 2: 5% off | Pick 3: 10% off | Pick 4: 12% off
```

Nudge bar at top cues "+1 more for extra savings" when customer has selected N services.

### 3.4 Wizard Flow

Step 1 → Service selection (tiles + bundle nudge)
Step 2 → Address entry (triggers D1 lookup + T2 vision in background)
Step 3 → Results (tiered package presentation with computed prices)
         ↳ Tightener questions if RANGE
         ↳ Customize link for partial scope

---

## 4. Partial Scope Customizer

### 4.1 When It Appears

Only when customer clicks "Customize your service" link below the three tiers. Not the default path.

### 4.2 Spatial Scope (Layer 1)

Checkboxes for zone groups in customer language:

| Customer Label | Zone Mapping | Default |
|---------------|-------------|---------|
| Upper story windows | Z-2F, Z-2L, Z-2R, Z-2B (HL.2) | ☑ Checked |
| Ground floor windows | Z-1F, Z-1L, Z-1R, Z-1B (HL.1) | ☑ Checked |
| Basement windows | BG0 zones | ☐ Unchecked (common exclusion) |
| Garage windows | GAR_WIN component | ☐ Unchecked (always starts unchecked per v1.8 rule) |

Each row shows the estimated pane count and line price for that zone group.

### 4.3 Service Scope (Layer 2)

For each checked zone group, service type selection:

| Option | Description | Default |
|--------|-------------|---------|
| Exterior only | Outside glass cleaned | ○ Selected |
| Interior + Exterior | Both sides, screens, sills | ○ |
| Hard-to-reach interiors only | Full exterior + selective interior (tech confirms on-site) | ○ |

The "hard-to-reach interiors" option addresses the 2788 Dreamcatcher pattern. System estimates ~30-40% of total panes as interior scope based on ZCTA prior, shows a range price, and the tech confirms actual count during the 2-minute walkthrough.

### 4.4 D8 Tagging for Partial Scope Bookings

When a customer books via the customizer, the M1 payload includes:

```json
{
  "scope_type": "partial",
  "scope_zones_included": ["Z-2F","Z-2L","Z-2R","Z-2B","Z-1F","Z-1L","Z-1R","Z-1B"],
  "scope_zones_excluded": ["BG0","GAR_WIN"],
  "scope_int_ext": "ext_only",
  "scope_int_selective": false
}
```

This tag flows through to D8 on job completion, preventing partial scope pane counts from contaminating the D6 Bayesian shrinkage.

---

## 5. Booking Hub Three-Panel Experience

### 5.1 Panel 1 — Quote Confirmation

Displays computed quote from T5 payload. Shows:
- Selected tier/package with price
- Service breakdown (pane count, rate, line totals)
- Gleam-On upgrade offer with savings calculator (highest-intent conversion moment: 22% vs 8% take rate)
- Upsell row: "Add to your visit" pre-priced from T5 output
- For RANGE: midpoint as "estimated price" with range displayed smaller, note about on-site confirmation

### 5.2 Panel 2 — Schedule Selection

Available appointment slots from ServiceM8 scheduling grid.

### 5.3 Panel 3 — Checkout

Stripe embedded checkout. For BIND: exact price charged. For RANGE: midpoint authorized, final adjustment within range after tech walkthrough.

---

## 6. The Targeted Verification Workflow

### 6.1 When Triggered

When a customer books from RANGE mode (composite confidence between 0.55 and 0.85 after all tightener rounds), the tech's on-site walkthrough serves as the final confidence push. But unlike traditional estimates, the tech only verifies the DELTA — the specific components the system flagged as low-confidence.

### 6.2 Tech UX (Amber-Highlighted Checklist)

Make.com pre-fills the ServiceM8 job card with only the unresolved questions:

```
VERIFICATION NEEDED:
  Task 1: Confirm rear window count (AI estimate: 8, Confidence: 0.68)
    → Dropdown: [Confirm 8] [Correct count: ___]
  
  Task 2: Confirm basement walk-out windows present (AI suspects: yes)
    → Dropdown: [Yes, walk-out windows] [No walk-out] 
```

Tech walks to the rear, taps 2 answers, hits Submit. Total time: 60 seconds.

### 6.3 Instant Bind (Automated Loop)

1. ServiceM8 webhook fires to Make.com
2. Make.com writes D8 observation (COMP_QUANTITY_CORRECTION)
3. Bayesian math updates D11 → confidence spikes to 0.94
4. Pricing engine recalculates with confirmed data
5. ServiceM8 quote auto-converts from Estimate to Binding Quote
6. SMS to customer: "Great news! Your locked-in price is $385. Reply YES to approve."

### 6.4 Business Impact

Traditional estimate visit: 45 min drive + 30 min measure = $68.75 labor cost, 31% conversion.
Gleam progressive disclosure + targeted verification: 90 sec customer + 60 sec tech = ~$1 labor cost, 74% conversion (BIND) / 48% conversion (RANGE).

---

## 7. Quote Mode Rendering

### 7.1 BIND

Exact price with checkmark icon. "Your price: $348 — locked for 30 days." 30-day price lock guarantee. Checkout button prominent.

Threshold: composite ≥ 0.85 AND Monte Carlo P90 spread ≤ ±12%.

### 7.2 RANGE

Asymmetric range displayed as low-midpoint-high: "$335 – $348 – $365". Midpoint is P50 (most likely). Low is P25. High is P85. Customer anchors to midpoint.

Tightener panel appears below. Max 2 rounds of 2 questions each.

After 2 rounds without reaching BIND: "We've narrowed your estimate. For an exact price, we can visit your property for a quick 15-minute assessment — no charge for Gleam-On members."

Customer CAN book from RANGE without assessment. Midpoint is charged; adjustment within range after tech walkthrough.

### 7.3 ONSITE

Price fully suppressed. "Your property has some details we want to get right before we quote you." $60 assessment presented as professional quality signal, not failure. "Our most precise quotes start here."

Triggered by: composite < 0.55 OR safety/compliance gate fired (SL.4 post-construction, PT.4 steep roof, HL.4 4+ stories, IGU thermal stress risk for tint).

---

## 8. Interior/Exterior Scope Selection (Refined)

### 8.1 The 2788 Dreamcatcher Pattern

The most common partial scope pattern (~9/10 of int+ext jobs): customer wants ALL exterior windows cleaned, then cherry-picks specific interior windows they can't reach from inside. The customer typically can't specify which interior windows ahead of time — they know they want "some" interiors but need the tech to identify which ones are hard to access.

### 8.2 Three Interior Scope Options

The booking hub presents interior cleaning as a single selection per spatial group:

| Option | Label | Behavior | Pricing |
|--------|-------|----------|---------|
| `ext_only` | Exterior cleaning only | Default. All selected zone windows cleaned outside only. | Exterior rate per pane |
| `int_ext_full` | All windows inside + outside | Every selected zone window cleaned both sides. Screens, sills, frames included. | Int+ext rate per pane (complete care tier) |
| `int_ext_selective` | Just the hard-to-reach interiors | Full exterior + tech identifies interior scope on-site during walkthrough. | Exterior rate + estimated 30-40% interior add-on |

### 8.3 Selective Interior Estimation

For `int_ext_selective`, the system estimates interior pane count as a percentage of total cleanable panes. The percentage is initially seeded from ZCTA prior data:

- Castle Rock tract 2-story (default): 35% of panes have hard-to-reach interiors
- Ranch/1-story: 15% (most ground-floor windows are easy to reach from inside)
- 3-story / townhome: 50% (upper-story interiors are almost all hard to reach)

As D8 observations accumulate, the subdivision-specific interior selectivity percentage tightens through Bayesian shrinkage, same formula as pane count convergence.

### 8.4 Booking Hub UX for Interior Selection

```
HOW WOULD YOU LIKE YOUR WINDOWS CLEANED?

○ Exterior only (outside glass cleaned)                    — $280
○ Inside + outside (every window, both sides)              — $480  
○ Outside everything + inside the hard-to-reach ones       — $348 est.
  "Our tech will identify which interior windows need attention 
   during a quick walkthrough. Most customers have 15-20 windows 
   that are tough to reach from inside."

[Selected: Outside everything + hard-to-reach interiors]
```

This maps to the existing tier structure: Complete Care = `int_ext_full`, Pick 3 bundle's default = `ext_only` + screens + tracks, and the selective interior option slots naturally into the middle tier price point.

---

## 9. 3-Tap ServiceM8 Field Observation Form

### 9.1 Purpose

When the tech arrives on-site — whether for a targeted verification walkthrough or during normal service delivery — they may need to report material corrections, upsell opportunities, or safety blocks. The Field Observation Form captures this in structured JSON via 3 taps and a photo, with zero typing.

### 9.2 Form Structure

**Field 1 — What are you reporting? (Trigger)**
Dropdown: `Material/Quantity Correction` | `Upsell/Damage Found` | `Safety/Compliance Block`

**Field 2 — Which service area? (Context)**
Dropdown: `Windows & Doors (WIN)` | `Siding/House Wash (SDG)` | `Gutters & Roof (GUT/RFS)` | `Ground/Hardscape (DRV/PAT)`

**Field 3 — Specifics (Conditional per Field 1 + Field 2)**

Example for WIN + Material Correction:
`Pane Count Higher` | `Pane Count Lower` | `Glass is Low-E/IGU` | `True Divided Light grid present`

Example for SDG + Upsell/Damage:
`Heavy Oxidation` | `Artillery Fungus` | `Rust Stains` | `Peeling Paint (EPA Risk)` | `Wood Rot`

**Photo: Required for all upsell/damage reports.**

### 9.3 Make.com Processing

The webhook payload from ServiceM8 is structured JSON (dropdown values, not free text). Zero risk of misspellings or parsing failures.

- **Correction path:** Updates D11 component record (variant_id, quantity). Pricing engine recalculates. Tech checklist updates in real-time.
- **Upsell path:** Writes D8 observation. Auto-drafts a branded estimate in ServiceM8 with the tech's photo attached. Texts customer: "While our tech was completing your service, they noticed [issue]. We've attached a photo and an optional estimate."
- **Safety block path:** Applies D5 compliance flag to the job. Blocks job completion until mandatory safety form is filled.

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-05 | Created companion document from calibration session findings. | Captures progressive disclosure pipeline, tiered anchoring strategy, and partial scope customizer. |
| 2026-03-05 | Defined 4 partial scope patterns from custom-scope job analysis (J49, J41, J39, J56, J30). | Informs booking hub customizer design with zone-based deselection in customer language. |
| 2026-03-05 | Added tiered package presentation (Complete Care / Pick 3 / Exterior Only / Customize). | Replaces flat scope-reduction interface with anchoring-first sales psychology. |
| 2026-03-05 | Added "hard-to-reach interiors" option for selective interior pattern (J30/2788 Dreamcatcher). | System estimates ~30-40% interior selectivity, tech confirms on-site. |
| 2026-03-05 | Documented TouchUp20/30/50 failure mode — customers don't think in pane counts. | Zone-based customizer uses spatial language mapped to zone model. System counts, customer decides. |
| 2026-03-05 | Added satisficing decay threshold spec (2000ms minimum per question). | Prevents rapid tapping from inflating confidence scores. |
| 2026-03-06 | Refined interior/exterior scope selection (Section 8). Added 3-option UX (ext_only / int_ext_full / int_ext_selective) with ZCTA-based interior selectivity percentage. | Addresses 2788 Dreamcatcher "full exterior + cherry-pick interior" pattern. Selective interior priced at estimated 30-40%, confirmed on-site. |
| 2026-03-06 | Added 3-Tap ServiceM8 Field Observation Form spec (Section 9). | Structured JSON capture for material corrections, upsells, and safety blocks. Zero typing, photo-required for upsells. Make.com processes webhook for auto-draft estimates and D11 updates. |
