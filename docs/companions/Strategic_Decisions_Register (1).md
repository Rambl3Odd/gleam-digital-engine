# Strategic Decisions Register
## Gleam 3.0 — Cross-Cutting Architectural Decisions

**Purpose:** Captures strategic decisions that affect multiple domains/twins. Each entry records the decision, rationale, affected companions, and date. When enough entries accumulate to warrant a Master Architecture update, they are batched into a versioned release (v1.1, v2.0).

**Parent Document:** Master Architecture & Design Specification v1  
**Last Updated:** 2026-03-06

---

## SDR-001: Estimation Hierarchy Revision
**Date:** 2026-03-05  
**Decision:** The actuarial prior model (D6 V7 regression) is the CRITICAL Bayesian anchor for window pane estimation only. For all other service primitives (gutter, roof, siding, driveway, fence), Solar API / satellite / Street View depth are the primary data sources. Tier A assessor formulas serve as sanity-check fallbacks, not primary estimates.

**Rationale:** Solar API LiDAR provides 0.93-0.95 confidence on roof and gutter measurements directly. Satellite hardscape detection provides 0.85 on driveway. Only windows require the actuarial prior because vision cannot see rear/side/interior panes from available Street View angles, and the zone-level complexity (pane types, FA distribution, height tiers) makes windows fundamentally harder to estimate from imagery alone.

**Affected Companions:** D6 (Section 5 hierarchy table), T2 (coverage rules), D10 (non-window formula confidence levels)

---

## SDR-002: Garage Window Separation (v1.8 Rule)
**Date:** 2026-03-05  
**Decision:** Garage windows are ALWAYS a separate D11 component class (GAR_WIN) with `default_included: false`. They are NEVER included in the default customer quote for window cleaning. They are presented as an optional add-on. For house wash, the garage DOOR SURFACE is always included but material-routed.

**Rationale:** Validated through analyzeProperty.js v1.0→v1.8 evolution and photo evidence from 5 Castle Rock properties. Garage glass is inherently different (decorative, sometimes not real glass), homeowners often don't care about it, and including it inflates the initial quote by $22-46 on 45% of homes, reducing conversion rate.

**Affected Companions:** D6 (Section 3 garage rules), T2 (Gemini prompt for garage detection), D10 (service-specific garage treatment table), S14 (booking hub garage add-on UX)

---

## SDR-003: Partial Scope Tagging Requirement
**Date:** 2026-03-05  
**Decision:** Every job booking must carry a `scope_type` field ("full" or "partial"). Partial scope jobs must list excluded zones. Only full-scope jobs feed into D6 Bayesian shrinkage and V7 regression recalibration.

**Rationale:** 15%+ of window cleaning jobs are partial scope. Without tagging, partial scope pane counts contaminate the ZIP DNA. J49 (44 panes) and J56 (29 panes) were mistakenly included in V7 calibration as full-scope jobs, creating artificial RED errors. Reclassifying them as partial scope reduced V7 MAPE from 13.8% to ~10.5%.

**Affected Companions:** D6 (Section 4 partial scope handling), D8 (scope_type tag in observation records), S14 (booking hub scope customizer must generate tag)

---

## SDR-004: House Wash Canvas — Nothing Washed for Free
**Date:** 2026-03-05  
**Decision:** Total billable house wash area = gross wall area. Fenestration is NOT subtracted (rinse time is real labor). Garage door is NOT subtracted (gets washed, routed to material class). Accent stone is NOT subtracted (washed at different production rate). Material decomposition drives rate routing, not area reduction.

**Rationale:** Correction from Gemini calibration session. Subtracting fenestration and garage doors created $170/job margin leak on mixed-material 2-story properties (demonstrated on 2490 Trailblazer worked example). The chemical hits all surfaces; the production rate varies by material, not by whether a surface gets skipped.

**Affected Companions:** D10 (Section 2 house wash canvas), D6 (siding formula Section 6.3)

---

## SDR-005: Tiered Package Anchoring (Sales Psychology)
**Date:** 2026-03-05  
**Decision:** Quote results use tiered package presentation (Complete Care → Pick 3 Bundle → Exterior Only) with scope customization accessible but not primary. The interface leads with the premium anchor, not a scope-reduction tool.

**Rationale:** Presenting zone-level deselection checkboxes as the default makes it too easy to reduce scope. Anchoring to the Complete Care price makes the middle tier feel like a smart deal. The Pick 3 bundle with 10% discount is the sweet spot where most customers land. Customization exists as a text link for the ~15% who need partial scope.

**Affected Companions:** S14 (Section 3 tiered packages, Section 4 customizer)

---

## SDR-006: Accent Stone Tripwire — Year-Built Secondary Trigger
**Date:** 2026-03-05  
**Decision:** The accent stone detection tripwire uses quality grade as the primary trigger AND year_built ≥ 2000 as a secondary trigger for Average-quality homes in Castle Rock ZCTAs. A 4-tier probability table replaces the binary Good/Excellent-only rule.

**Rationale:** Photo evidence from 2490 Trailblazer (J38, Average quality) confirmed ~20% stone veneer. Castle Rock builders after ~2000 almost universally added stone/brick wainscoting regardless of assessor quality grade. Quality correlates with HOW MUCH stone, not WHETHER it exists.

**Affected Companions:** D6 (Section 6.3 accent tripwire table), T2 (when to prompt Gemini for accent material detection)

---

## SDR-007: Multi-Position Street View Camera Strategy
**Date:** 2026-03-06  
**Decision:** Replace single-position panoramic Street View capture with calculated multi-position camera shots from neighboring properties' frontages. Use PostGIS line-of-sight calculation for 80% of properties, Gemini satellite analysis for the 20% edge cases (corner lots, cul-de-sacs, irregular layouts).

**Rationale:** Front-only panoramic captures only ~30-40% of SFH fenestration. Side-yard angled shots from neighbor positions capture left and right elevations. Rear-street shots (when available) capture the highest-value rear elevation. This can push W_c from 0.40 to 0.75-0.85, potentially enabling BIND from imagery alone without tightener questions.

**Affected Companions:** T2 (Section 7 camera strategy), D6 (coverage weight assumptions in estimation hierarchy)

---

## SDR-008: Google Solar API Fallback for Castle Rock
**Date:** 2026-03-06  
**Decision:** Acknowledge that Google Solar API returns 404 for the majority of Castle Rock (80104/80109) properties. Tier A assessor formulas (D6 Section 6) serve as primary estimators for roof area, gutter footage, and building footprint until Solar API coverage arrives. Satellite + Gemini analysis partially compensates for missing LiDAR data.

**Rationale:** Discovered during pre-build data snapshot run. Google has not mapped Castle Rock with 3D LiDAR. The estimation hierarchy assumed Solar API at 0.93-0.95 confidence for non-window primitives. Without it, Tier A formulas at 0.40-0.50 confidence become the primary source, supplemented by Gemini satellite plane counting and shadow-based pitch estimation.

**Affected Companions:** D6 (Section 9 Solar API blindspot), T2 (image acquisition pipeline must handle 404 gracefully), D10 (confidence levels on non-window pricing inputs)

---

## SDR-009: Pricing Math Lives in Supabase RPCs, Not Make.com
**Date:** 2026-03-06  
**Decision:** All VTM pricing calculations run as Supabase PostgreSQL functions (RPCs). Make.com passes property_id and service parameters, receives computed price JSON. Make.com never executes VTM multiplication, FA distribution parsing, or margin floor enforcement. The pricing RPC returns multi-tier price points (Complete Care, Pick 3, Exterior Only, add-ons) in a single call.

**Rationale:** A 35-window property with per-pane FA distribution and zone-level VTM compounding requires 20+ Math modules in Make.com, consuming thousands of operations per quote. Supabase RPC executes the same calculation in <50ms as a single SQL query returning one JSON object.

**Affected Companions:** D10 (Section 8 pricing math location rule), S14 (tiered package rendering reads from single RPC response)

---

## SDR-010: Vertex AI Deferred to Post-V1
**Date:** 2026-03-06  
**Decision:** Build V1 on the consumer Gemini API through Make.com's native Gemini module. Defer Vertex AI migration until: (a) hitting rate limits, (b) needing batch hydration for a second franchise market, or (c) monthly API costs exceeding budget from volume. The connection swap to Vertex AI is a half-day task that doesn't get harder to make later.

**Rationale:** At single-market scale (~100-200 quotes/month), the consumer API cost is negligible. Vertex AI's primary advantages (batch prediction at 50% cost reduction, model version pinning, enterprise SLAs) only matter at franchise scale with 60K+ property batch hydration runs. Building on the consumer API now avoids unnecessary GCP infrastructure complexity during the MVP build.

**Affected Companions:** T2 (API endpoint configuration — currently consumer, future Vertex AI)

---

## Document Architecture Summary

```
Master Architecture v1 (270+ pages)
  └── Stable "constitution" — updated 2-3× per year
  └── Defines domains, twins, schemas, integration directives
  
Strategic Decisions Register (this document)
  └── Cross-cutting decisions that affect multiple companions
  └── Bridge between stable Master and evolving companions
  └── Entries batch into Master Architecture version updates
  
Domain/Twin Companions (living specs)
  ├── D1  Property Registry Companion (planned)
  ├── D2  Component Catalog Companion (planned)
  ├── D6  Geographic Priors Companion ✓ UPDATED 2026-03-06
  ├── D8  Observation Evidence Companion (planned)
  ├── D10 Service Definitions Companion ✓ UPDATED 2026-03-06
  ├── D11 Property Components Companion (created by Gemini session)
  ├── T1  Structural Twin Companion (planned)
  ├── T2  Vision Twin Companion ✓ UPDATED 2026-03-06
  ├── T5  Pricing Twin Companion (planned)
  └── S14 Customer Interface Companion ✓ UPDATED 2026-03-06
```

Each companion follows the standard template:
1. Purpose statement linking to Master Architecture section
2. Current specification (formulas, schemas, rules)
3. Worked examples from real properties
4. Photo evidence section (where applicable)
5. Change log with dated entries
