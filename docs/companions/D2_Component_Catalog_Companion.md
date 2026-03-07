# D2 Component Catalog Companion
## Gleam 3.0 — Property Intelligence Assessment Protocol

**Parent Document:** Master Architecture & Design Specification v1, Section 4
**Last Updated:** 2026-03-07
**Status:** Draft — built from Batch 1 photo analysis findings + all service line requirements

---

## 1. Purpose

This document serves two functions:

1. **D2 Reference Catalog** — The complete taxonomy of systems, classes, and variants that can exist on a residential property in the Gleam service area.
2. **Assessment Protocol** — The comprehensive checklist that any assessor (Gemini vision, tech on-site, or photo reviewer) uses to evaluate a property across ALL five layers of the Property Intelligence Dossier.

Every property photo review, every tech field visit, and every Gemini vision pass runs against this protocol. Nothing gets missed because the checklist is the checklist — it doesn't change per property, only the answers do.

---

## 2. The 12 Building Systems

### SYS-01: Roof Envelope

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| RFS | Roof Surface | area_sqft | RFS-WSH (roof wash), RFS-RPR (roof repair referral) |
| RDG | Ridge Cap | linear_ft | RFS-WSH |
| VLY | Valley | linear_ft | RFS-WSH, GUT-CLN (debris accumulation zone) |
| HSP | Hip Segment | linear_ft | RFS-WSH |
| DMR | Dormer | count | RFS-WSH, WIN-EXT (dormer windows), LIT-HLD/LIT-PRM |
| PJP | Pipe Jack / Roof Penetration | count | Inspection only — sealant age flag |
| CHM | Chimney / Flue Cap | count | CHM-INS (chimney inspection referral) |
| SKY | Skylight Unit | count | WIN-EXT (FA.5 + HL modifier), SKY-CLN |
| FLG | Flashing (rake/counter/step) | linear_ft | Inspection only — leak risk flag |

**Assessment Checklist:**
- [ ] Roof material identified (comp shingle / concrete tile / metal / cedar shake / slate / flat/TPO)
- [ ] Pitch estimated (low 3-4/12, standard 5/12, moderate 6-7/12, steep 8-10/12, very steep >10/12)
- [ ] Pitch tier gate: PT.3 (steep) = enhanced fall protection; PT.4 (>10/12) = ONSITE escape hatch
- [ ] Roof plane count (simple 1-2, standard 3-4, complex 5-7, very complex 7+)
- [ ] Biological growth visible? (algae streaking, moss, lichen) — RFS-WSH trigger
- [ ] Age assessment: year_built + visible condition → remaining life estimate
- [ ] Satellite dish present? (location, cable routing — do-not-disturb constraint)
- [ ] Solar panels present? → SYS-11 evaluation
- [ ] Skylights visible? Count and location per facade
- [ ] Chimney present? Material (masonry/metal/pre-fab), cap condition
- [ ] Pipe jacks visible? Count — sealant degradation indicator (age > 15yr = flag)
- [ ] Dormer count and type (shed/gable/hip) — affects roofline LF for lighting

**Risk/Compliance Gates:**
- OSHA 1926.501: Roof work above 6ft requires fall protection plan
- PT.3/PT.4: Mandatory lift/anchor evaluation at steep/very steep pitch
- Hail damage history: Check D4 regional hail events for this ZCTA
- WCI loading: Roof work = highest WCI rate tier ($1.63/$100 payroll vs $0.82 for ground work)

**Partner Triggers:**
- Roof age > 20yr (comp shingle) or > 30yr (tile) or > 40yr (metal) → roofer referral
- Storm damage visible (missing shingles, dented metal, cracked tile) → emergency roofer referral
- Chimney deterioration → chimney sweep/mason referral

---

### SYS-02: Gutter & Drainage

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| GUT | Gutter Run | linear_ft | GUT-CLN (gutter cleaning) |
| DSP | Downspout | count | GUT-CLN (flush), DSP-EXT (extension install) |
| GRD | Gutter Guard System | linear_ft | GRD-RMV (removal for cleaning), GRD-INS (install referral) |
| SPL | Splash Block | count | Inspection only |
| UND | Underground Drain Extension | count | Inspection only — clog flag |

**Assessment Checklist:**
- [ ] Gutter material (aluminum K-style / half-round / copper / vinyl / steel)
- [ ] Gutter condition (good / sagging sections / separated joints / overflow staining)
- [ ] Gutter guard present? Type if visible (mesh / foam / brush / micro-mesh / helmet)
- [ ] Guard type UNKNOWN → force RANGE or ONSITE (removal time is unknowable)
- [ ] Downspout count visible per facade
- [ ] Downspout extensions present? (above-ground / buried)
- [ ] Underground drain — clog indicators (standing water near foundation)
- [ ] Debris type assessment: leaf litter (deciduous), needles (conifer), moss, shingle granules
- [ ] Tree canopy overhead? (drives seasonal debris acceleration — SL modifier)
- [ ] Tree species if identifiable: cottonwood (worst), maple, oak, pine (needles clog differently)

**VTM Application:**
- Height: HL.1 (1.00x), HL.2 (1.25x) — MULTIPLICATIVE with debris severity
- Debris severity: SL.1 (1.00x), SL.2 (1.33x), SL.3 (1.75x) — MULTIPLICATIVE, not additive
- Guard removal/reinstall: +15-45 min fixed block depending on guard type
- Seasonal calibration: Castle Rock cottonwood season (Oct-Nov) = auto SL.2 minimum

**Risk/Compliance Gates:**
- OSHA: Gutter work at HL.2+ requires ladder safety protocol
- Wind gate: >15mph sustained = reschedule gutter work (debris blowback)
- WCI loading: HL.2 gutter work = elevated WCI tier

**Partner Triggers:**
- Gutter guard recommendation: If property has mature trees + no guards → guard installer referral
- Foundation drainage issues visible → landscaper/drainage contractor referral

---

### SYS-03: Wall Cladding

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| SDG | Primary Siding | area_sqft | HW-SFT (house wash soft), HW-PRS (pressure wash) |
| ACC | Accent Siding | area_sqft | HW-SFT |
| STN | Stone/Masonry Veneer | area_sqft | HW-SFT (masonry detergent) |
| STU | Stucco/EIFS | area_sqft | HW-SFT (extended dwell) |
| SFT | Soffit Panel | area_sqft | HW-SFT, inspection (vent blockage) |

**Material Variants (critical for chemistry routing):**
| Variant ID | Material | Code | Wash Rate (sqft/hr) | Chemistry | PSI Limit |
|-----------|----------|------|---------------------|-----------|-----------|
| SDG.VNL | Vinyl siding | MA1 | 800 | Standard SH 1-2% | 1500 |
| SDG.FIB | Fiber cement (Hardie) | MA2 | 700 | Standard SH | 2000 (avoid painted faces) |
| SDG.WDS | Painted wood | MA3 | 500 | Standard SH | 800 (high damage risk) |
| STU.SYN | Synthetic stucco/EIFS | MA4 | 600 | Higher SH 1.5-3%, extended dwell | 1000 |
| STN.MSV | Stone/brick veneer | MA5 | 450 | Low PSI, masonry detergent | 800 |
| GAR.MTL | Metal garage door | — | 800 | Low-pressure rinse ONLY | 1000 (oxidation risk) |
| GAR.WDS | Wood garage door | — | 500 | Standard SH | 800 (stain strip risk) |
| SFT.VNL | Vinyl soffit | — | 600 | Standard SH | 1000 |
| SFT.ALM | Aluminum soffit | — | 700 | Standard SH | 1200 |

**Assessment Checklist:**
- [ ] Primary siding material identified (vinyl / fiber cement / wood / stucco / brick / log)
- [ ] Accent material identified (stone veneer / brick wainscoting / board-and-batten / shake)
- [ ] Accent coverage percentage estimated (5% / 10% / 15% / 20% / 25%+)
- [ ] Accent location (lower wainscoting / gable accents / full chimney chase / columns only)
- [ ] Garage door material (steel painted / wood stained / composite / aluminum)
- [ ] Garage door style (plain panel / carriage decorative / contemporary flush)
- [ ] Siding condition per facade (excellent / good / fair / paint peeling / damaged)
- [ ] Oxidation present? (chalking on painted surfaces — noted at Trailblazer rear)
- [ ] Mold/mildew/algae on siding? (north-facing facades in shade — HW-SFT trigger)
- [ ] Caulk condition around windows/trim (intact / cracking / missing — age indicator)
- [ ] Soffit vents clear or blocked? (pest intrusion indicator)

**UV Exposure Assessment (per facade):**
- [ ] Cardinal orientation of each facade (N/S/E/W or NE/NW/SE/SW)
- [ ] South-facing: HIGHEST UV degradation — paint fade, vinyl warping, window seal stress
- [ ] West-facing: HIGH UV (afternoon sun) — window tint/film candidate, screen degradation
- [ ] North-facing: LOWEST UV but HIGHEST moisture retention — mold/algae zone
- [ ] East-facing: Moderate UV — morning sun, generally lowest maintenance

**Revenue Implications:**
- Nothing washed for free (SDR-004): gross wall = total billable area
- Material decomposition drives rate, not area reduction
- 3-material properties (e.g., Trailblazer: stucco + lap + stone) are 35-45% more revenue than flat-rate
- Oxidation flag = potential rework cost — build into VTM or warn customer

**Partner Triggers:**
- Paint peeling/fading → painter referral
- Stucco cracking → stucco repair specialist
- Wood rot visible → siding replacement contractor
- Caulk failure → weatherization contractor

---

### SYS-04: Fenestration

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| WIN | Window Unit (exterior cleanable) | count | WIN-EXT, WIN-INT, WIN-DLX |
| GAR_WIN | Garage Window (decorative) | count | WIN-EXT (optional add-on, default excluded) |
| SCR | Window Screen | count | SCR-CLN, SCR-RPR, SCR-RPL |
| TRK | Window Track | count | TRK-CLN |
| SLD | Sliding Door | count | WIN-EXT, WIN-INT |
| ENT | Entry Door (glass insert) | count | WIN-EXT |
| EGR | Egress Window (in well) | count | WIN-EXT + AD modifier |
| WLC | Window Well Cover | count | WLC-CLN, WLC-RPL |
| TRM | Transom (above door/window) | count | WIN-EXT |
| SKL | Skylight (fenestration instance) | count | SKY-CLN (FA.5 + HL) |

**Assessment Checklist — Quantity:**
- [ ] Total cleanable pane count (front + sides + rear + basement, garage excluded)
- [ ] Garage pane count (separate — GAR_WIN class, default_included: false)
- [ ] Pane count by facade (front / left / right / rear)
- [ ] Pane count by height tier (HL.1 ground / HL.2 2nd story / HL.3 3rd story / BG0 basement)
- [ ] Screen count (typically 60-80% of operable windows)
- [ ] Track count (same as operable window count)
- [ ] Sliding door count
- [ ] Entry door glass insert count
- [ ] Transom count
- [ ] Skylight count

**Assessment Checklist — Type & Condition:**
- [ ] FA classification per window: FA.1 standard / FA.2 large picture (≥21 sqft) / FA.3 French/TDL / FA.4 egress / FA.5 skylight
- [ ] SDL vs TDL: Simulated divided lights (grids on glass) = FA.1. True divided lights (separate panes) = FA.3 (2.0x)
- [ ] Glass type if determinable: single pane / double-pane IGU / Low-E / tempered / laminated
- [ ] Glass age indicator: fogged/failed IGU seals = replacement referral, NOT cleaning
- [ ] Screen condition: intact / torn / bent frame / missing / UV-degraded mesh
- [ ] Screen UV degradation: South and west-facing screens degrade 2-3x faster. Age > 10yr + south-facing = likely repair/replace candidate
- [ ] Window seal condition: caulk cracking around frames = moisture intrusion risk
- [ ] Hardwater staining visible? (irrigation overspray, sprinkler proximity)
- [ ] Construction debris on glass? (post-construction SL.4 = ONSITE escape hatch)

**Window Tint / Privacy Film Assessment:**
- [ ] Which panes face south or west? (UV hammered — tint candidate)
- [ ] Neighbor proximity per facade: <20ft = privacy concern. <10ft = strong privacy film candidate
- [ ] Large picture windows at HL.1 facing street = privacy film upsell
- [ ] Existing tint visible? (color shift, bubbling = replacement candidate)
- [ ] Glass type compatibility: Low-E IGU + film = thermal stress fracture risk → mandatory IGU assessment gate
- [ ] Year built > 2000 = high probability of Low-E → film requires thermal stress analysis before binding

**Screen Repair/Replacement Assessment:**
- [ ] Screen material: fiberglass (standard, UV-vulnerable) / aluminum (durable) / pet-resistant / solar screen
- [ ] UV exposure by facade orientation: south/west screens degrade fastest
- [ ] Age proxy: year_built + facade orientation → expected screen life
- [ ] Torn/damaged screens visible in photos?
- [ ] Missing screens = customer removed (replacement candidate) or never installed
- [ ] Screen count × replacement cost ($15-40/screen) = repair revenue sizing

**Risk/Compliance Gates:**
- Year built < 1978 + interior work = EPA lead paint disclosure required (D5 hard gate)
- HL.4 (4+ stories) = ONSITE escape hatch — requires motorized boom lift assessment
- Film on unknown glass type = IGU thermal stress fracture risk (MFR_FILM_IGU gate)
- WCI loading: HL.2 = elevated rate, HL.3 = highest rate, ladder work = fall risk premium
- Hardwood floor protection: interior work requires drop cloths, booties, ladder pads

**Partner Triggers:**
- Fogged/failed IGU seals → window replacement company referral
- Severe hardwater staining → irrigation system adjustment referral
- Blinds/shutters visible and dated → window covering retailer referral
- Privacy need identified (proximity + orientation) → blinds company OR privacy film upsell

---

### SYS-05: Fascia & Trim

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| FSC | Fascia Board | linear_ft | HW-SFT, LIT-HLD, LIT-PRM (mounting surface) |
| RKB | Rake Board | linear_ft | HW-SFT |
| CRN | Corner Trim | linear_ft | HW-SFT |
| SRD | Window/Door Surround | count | HW-SFT, inspection |

**Assessment Checklist:**
- [ ] Fascia material (wood painted / composite / aluminum-wrapped / vinyl / fiber cement)
- [ ] Fascia condition: critical for permanent lighting mounting — must be structurally sound
- [ ] Paint peeling on fascia? = painter referral + delays lighting install
- [ ] Rot visible? = fascia replacement required before lighting install (hard gate)
- [ ] Trim color contrast (affects how visible cleaning results are — customer satisfaction factor)

**Lighting Install Dependency:**
- Fascia condition gates both holiday and permanent lighting install
- Rotted fascia = NO lighting installation until repaired → carpenter/trim referral
- Aluminum-wrapped fascia = ideal Trimlight mounting surface (no paint touch-up needed)

---

### SYS-06: Hardscape & Flatwork

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| DRV | Driveway | area_sqft | PW-FLT (pressure wash flatwork) |
| WLK | Walkway / Sidewalk | area_sqft | PW-FLT |
| PAT | Patio / Stoop | area_sqft | PW-FLT |
| STP | Steps (exterior) | count | PW-FLT, inspection |
| RWL | Retaining Wall | linear_ft | HW-PRS, inspection |

**Assessment Checklist:**
- [ ] Driveway material (concrete / asphalt / pavers / gravel)
- [ ] Driveway area estimate (garage_type → base sqft from D6 §6.4)
- [ ] Driveway condition (excellent / good / oil stains / cracking / heaving / scaling)
- [ ] Patio material (concrete / stamped concrete / flagstone / pavers / composite)
- [ ] Walkway material and approximate LF
- [ ] Retaining walls present? Material and height
- [ ] Staining: oil/rust/organic — drives chemical selection and pricing
- [ ] Efflorescence on concrete? (white mineral deposits — acid wash needed, different chemistry)
- [ ] Sealing needed? (concrete age > 5yr without sealer = candidate)
- [ ] NPDES assessment: storm drain proximity to driveway/patio. Municipal drain within 20ft = containment required.

**Risk/Compliance Gates:**
- NPDES: Pressure wash runoff entering municipal storm drains violates EPA NPDES and local MS4 rules
- Containment requirement: If storm drain proximity = high, append containment fee or gate to ONSITE
- Chemical runoff: SH/bleach runoff near plantings = vegetation damage liability
- Surface damage: excessive PSI on pavers/stamped concrete = liability

**Partner Triggers:**
- Severe cracking/heaving → concrete contractor referral
- Sealing needed → concrete sealing service (could be Gleam add-on)
- Retaining wall failure → landscape/hardscape contractor

---

### SYS-07: Perimeter Elements

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| FNC | Fence | linear_ft | HW-PRS (fence wash), FNC-STN (stain referral) |
| GTG | Gate | count | Inspection only |

**Assessment Checklist:**
- [ ] Fence material (wood privacy / wood split-rail / vinyl / chain-link / iron / composite)
- [ ] Fence height (4ft / 6ft / 8ft)
- [ ] Fence approximate LF (lot perimeter proxy or visible count)
- [ ] Fence condition (excellent / good / weathered / leaning / broken boards)
- [ ] Stain/paint condition on wood fences
- [ ] Gate count and type (pedestrian / vehicle / automatic)

**Partner Triggers:**
- Weathered/leaning fence → fence company referral
- Wood fence needs staining → painter/stainer referral
- Missing fence + pool/hot tub visible → safety/code compliance flag

---

### SYS-08: Outdoor Living

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| DKP | Deck Surface | area_sqft | PW-DK (deck wash), DK-STN (deck stain) |
| DKR | Deck Railing | linear_ft | PW-DK, inspection |
| PGO | Pergola / Covered Patio | area_sqft | HW-SFT, LIT-HLD |
| SPR | Screened Porch | area_sqft | SCR-RPR (screen repair) |

**Assessment Checklist:**
- [ ] Deck present? Material (wood / composite / Trex / PVC)
- [ ] Deck level (ground / elevated HL.1 / elevated HL.2)
- [ ] Deck condition (excellent / good / weathered / splintering / structurally compromised)
- [ ] Railing material (wood / composite / metal / cable)
- [ ] Pergola present? Material
- [ ] Screened porch present?
- [ ] Hot tub present? (on deck or patio — weight/access consideration)
- [ ] Outdoor kitchen/grill station? (access obstruction for wash work)
- [ ] Furniture quantity (must be moved/covered for wash — time adder)

**Operational Impact:**
- Elevated deck with stairs = access path to walk-out basement
- Deck furniture = mandatory cover/move before any wash work on that facade (10-15 min adder)
- Hot tub = chemical overspray containment required

**Partner Triggers:**
- Deck needing stain/seal → deck maintenance contractor
- Structural concerns → deck builder/carpenter
- Screen damage on screened porch → screen repair (Gleam service)

---

### SYS-09: Mechanical Penetrations

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| DRY | Dryer Vent Termination | count | DRY-CLN (dryer vent cleaning) |
| FLU | HVAC / B-Vent Termination | count | Inspection only — HVAC referral |
| PLB | Plumbing Stack Cap | count | Inspection only |
| ACU | AC Condenser Unit | count | ACU-CLN (condenser cleaning) |

**Assessment Checklist:**
- [ ] Dryer vent termination visible? Location (wall / soffit / roof)
- [ ] Dryer vent type (rigid metal / flex / vinyl — vinyl is code-noncompliant fire hazard)
- [ ] Dryer vent lint buildup visible at termination? (cleaning trigger)
- [ ] Dryer vent height: wall-level = AD.1; roof-level = requires roof access
- [ ] Dryer vent estimated run length: short (<10ft) / medium (10-25ft) / long (25-35ft IRC max)
- [ ] Dryer vent bends visible? Each 90° bend = -5ft equivalent length
- [ ] HVAC flue/B-vent termination visible? Count and location
- [ ] AC condenser unit location: proximity to service access, vegetation clearance
- [ ] AC condenser condition: bent fins, debris accumulation, vegetation encroachment

**Dryer Vent Cleaning Pricing:**
- Base: 30 min setup + inspection
- Standard clean (wall termination, <15ft run, <2 bends): 45-60 min total
- Complex (roof termination, 15-35ft, 3+ bends): 90-120 min, may need roof access
- Code-noncompliant vent (vinyl flex) → gate to ONSITE, recommend replacement

**Risk/Compliance Gates:**
- IRC/IMC: Max 35ft dryer vent length, minus 5ft per 90° bend
- Vinyl flex duct: Fire hazard, code-noncompliant in most jurisdictions → flag for replacement
- Roof termination: Requires roof access → OSHA fall protection applies

**Partner Triggers:**
- HVAC condenser age > 15yr → HVAC replacement referral
- HVAC visible issues (rust, noise) → HVAC service referral
- Dryer vent noncompliant → vent replacement referral

---

### SYS-10: Electrical & Lighting

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| ELC | Exterior GFCI Outlet | count | Inspection — required for lighting |
| LIT | Existing Roofline Lighting | linear_ft | LIT-HLD (holiday), LIT-PRM (permanent/Trimlight) |
| TRL | Trimlight / Permanent LED Track | linear_ft | LIT-PRM installation + maintenance |
| CND | Low-Voltage Conduit Run | linear_ft | LIT-PRM installation |
| LSC | Landscape Lighting | count | Inspection only — partner referral |

**Assessment Checklist:**
- [ ] GFCI outlet locations (how many, which facades)
- [ ] GFCI outlet availability for lighting circuits (overloaded? dedicated circuit available?)
- [ ] Existing roofline lighting? (C9 string / LED string / permanent track / none)
- [ ] Existing lighting condition (working / partial / damaged / removed)
- [ ] Roofline linear footage for lighting estimate (same as gutter LF + garage fascia)
- [ ] Architectural features affecting lighting: peaks, dormers, covered entry, garage bay returns
- [ ] Holiday lighting: standard (roofline only) vs custom (includes peaks, dormers, trees, shrubs)
- [ ] Permanent lighting candidacy: fascia condition, power source proximity, HOA restrictions?
- [ ] Landscape lighting present? Working?

**Holiday vs Permanent Lighting Assessment:**
- [ ] Roofline LF measured/estimated
- [ ] Peak count (each peak = +$35-50 for holiday, built into permanent pricing)
- [ ] Dormer count (each dormer = +$25-40 for holiday)
- [ ] Height tier distribution: HL.1 (1.00x), HL.2 (1.25x), HL.3 (1.50x) for install labor
- [ ] Power drop count: how many GFCI outlets needed? (1 per ~200ft of LED, 1 per ~150ft incandescent)
- [ ] Overloaded circuit check: >3 incandescent strands on one circuit = UL 588 violation
- [ ] Timer/smart controller present or needed?

**Risk/Compliance Gates:**
- UL 588: Maximum 3 incandescent strands end-to-end; LED strands have higher limits (check manufacturer)
- NEC Article 410/422: Permanent lighting requires proper electrical connection, not extension cords
- GFCI: All outdoor lighting circuits must be GFCI-protected
- Roof pitch: PT.3/PT.4 = enhanced fall protection for roofline install
- WCI loading: Roofline lighting install = elevated WCI (ladder/roof work)

**Partner Triggers:**
- Landscape lighting needed → landscape lighting installer
- Electrical capacity insufficient → electrician referral (dedicated circuit install)
- No GFCI outlets → electrician referral (code requirement for outdoor lighting)

---

### SYS-11: Solar & Energy

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| SLR | Solar Panel Array | count / area_sqft | SLR-CLN (solar panel cleaning) |
| INV | Inverter Enclosure | count | Inspection only |
| BRD | Bird Guard Perimeter | linear_ft | BRD-INS (install), BRD-CLN (cleaning) |

**Assessment Checklist:**
- [ ] Solar panels present? Count and approximate array size
- [ ] Panel orientation (south-facing preferred — also indicates which roof face)
- [ ] Panel tilt angle (flush mount / tilted rack)
- [ ] Soiling visible? (dust, bird droppings, tree debris)
- [ ] Bird nesting under panels? → bird guard install opportunity
- [ ] Inverter location (garage wall / exterior wall / ground)
- [ ] Shading: tree canopy casting shadows on panels? → tree service referral

**Service Opportunity:**
- Solar panel cleaning: 2-4x per year in CO (dust, pollen, snow residue)
- Bird guard install: prevents nesting under panels, protects wiring
- Bundle with window cleaning (already on-site with WFP and pure water)

---

### SYS-12: Interior Access Features

**Classes:**
| Class ID | Name | Primitive | Serviceable By |
|----------|------|-----------|----------------|
| INT | Interior Window Unit | count | WIN-INT, WIN-DLX |
| VLT | Vaulted Ceiling Zone | count | INT-ACC (interior access — ladder/scaffold in vaulted space) |
| FYR | Foyer / Stairwell Void | count | INT-ACC |
| CLR | Clerestory Window | count | WIN-INT (high interior access) |

**Assessment Checklist:**
- [ ] Interior window count (if int+ext service)
- [ ] Vaulted ceilings present? (visible through windows or from invoice history)
- [ ] Foyer/stairwell voids? (2+ story interior open spaces requiring tall ladder)
- [ ] Clerestory windows? (high wall windows above main roofline — interior access only)
- [ ] Floor type in work areas (hardwood = protection required, carpet = lower risk, tile = no concern)
- [ ] Furniture density (light / moderate / heavy — affects access time and liability)
- [ ] Interior ladder placement constraints (stairwell, over furniture, over railings)

**Risk/Compliance Gates:**
- Hardwood floor damage: mandatory drop cloths + ladder pads (5 min setup per room)
- Interior furniture: customer responsible for moving or Gleam crew moves (liability waiver)
- Pets: must be secured before interior work begins (scheduling requirement)
- Lead paint: year_built < 1978 + interior work = EPA RRP disclosure

---

## 3. Cross-System Environmental Assessment

This section evaluates environmental factors that affect ALL systems on the property.

**Per-Facade Orientation Analysis:**
- [ ] Front facade cardinal direction (N/NE/E/SE/S/SW/W/NW)
- [ ] Each subsequent facade +90° clockwise
- [ ] South-facing facades: highest UV degradation on all materials, fastest screen degradation, strongest tint/film candidate
- [ ] West-facing facades: high afternoon UV, glare into home = privacy film/tint candidate
- [ ] North-facing facades: lowest UV but highest moisture/mold risk
- [ ] Prevailing wind direction (Castle Rock: typically W/SW) → chemical overspray routing

**Neighbor Proximity Analysis:**
- [ ] Distance to nearest neighbor per side (<10ft / 10-20ft / 20-50ft / >50ft)
- [ ] Zero-lot-line condition? (triggers OSHA access gate + AD modifier)
- [ ] Privacy need per facade: large windows facing neighbor at <20ft = privacy film/blinds candidate
- [ ] Noise considerations: early morning work next to bedroom windows
- [ ] Overspray risk: wash chemicals on neighbor property at <10ft spacing

**Tree & Vegetation Analysis:**
- [ ] Trees within 20ft of roofline? Species if identifiable
- [ ] Canopy coverage over roof: <25% / 25-50% / >50%
- [ ] Deciduous vs evergreen (drives seasonal gutter debris pattern)
- [ ] Root intrusion risk near foundation/driveway
- [ ] Vegetation touching siding? (moisture trap, pest pathway)
- [ ] Flower beds/landscaping near foundation that chemical runoff could damage

---

## 4. Cross-System Compliance & Risk Register

Every property assessment must evaluate these gates regardless of requested service:

| Gate | Trigger | Classification | Action |
|------|---------|---------------|--------|
| OSHA Fall Protection | Any work ≥6ft (1926.501) | HARD | Fall protection plan required |
| OSHA Aerial Lift | HL.4 (4+ stories) | HARD | Motorized boom lift assessment |
| EPA NPDES | Wash runoff near storm drain | HARD | Containment + recovery required |
| EPA RRP | Year built <1978 + interior work | HARD | Lead paint disclosure |
| NEC Electrical | Permanent lighting install | HARD | Proper electrical connection |
| UL 588 | Holiday lighting strand count | HARD | Max 3 incandescent end-to-end |
| Manufacturer Warranty | Film on unknown IGU glass | HARD | Thermal stress assessment gate |
| IRC Dryer Vent | >35ft or vinyl flex | SOFT | Flag for code compliance |
| OSHA Chemical | SH concentration >3% | SOFT | Enhanced PPE required |
| Wind Speed | >15mph sustained | SOFT | Reschedule gutter/roof work |
| Temperature | <32°F | SOFT | No film install, no wet cleaning |
| Roof Pitch | PT.3 (steep) | SOFT | Enhanced fall protection |
| Roof Pitch | PT.4 (very steep) | HARD | ONSITE escape hatch |

**WCI Cost Loading by Activity:**
| Activity | WCI Rate Tier | Cost per $100 Payroll | Notes |
|----------|--------------|----------------------|-------|
| Ground-level work (HL.1) | Standard | $0.82 | Window cleaning, pressure wash |
| Ladder work (HL.2) | Elevated | $1.15 | 2nd story windows, gutter cleaning |
| Roof/high work (HL.3+) | Maximum | $1.63 | 3rd story, roof wash, lighting install |
| Chemical handling (SH) | Enhanced | +$0.31 surcharge | All soft wash, house wash |
| Electrical (permanent lighting) | Specialized | $1.45 | NEC-governed installation |

---

## 5. Complete Service-to-Component Matrix

Every Gleam and partner service mapped to the D2 components it operates on:

| Service ID | Service Name | Primary Component | Secondary Components | VTM Formula Type |
|-----------|-------------|------------------|---------------------|-----------------|
| WIN-EXT | Exterior Window Cleaning | WIN | SCR, TRK, SLD, ENT, EGR, TRM, SKL | Per-pane × HL × FA |
| WIN-INT | Interior Window Cleaning | INT | VLT, FYR, CLR | Per-pane × HL (interior) |
| WIN-DLX | Deluxe (Int+Ext) | WIN + INT | All fenestration | Combined |
| SCR-CLN | Screen Cleaning | SCR | — | Per-screen flat |
| SCR-RPR | Screen Repair | SCR | — | Per-screen + material |
| SCR-RPL | Screen Replacement | SCR | — | Per-screen + material + measurement |
| TRK-CLN | Track Cleaning | TRK | — | Per-track flat |
| HW-SFT | House Wash (soft) | SDG, ACC, STN, STU | SFT, GAR door | Production rate × area × HL × material |
| HW-PRS | Pressure Wash (surfaces) | DRV, WLK, PAT, RWL | STP | Production rate × area × soiling |
| PW-DK | Deck Wash | DKP | DKR | Production rate × area |
| GUT-CLN | Gutter Cleaning | GUT | DSP, GRD | Per-LF × HL × debris severity (MULT) |
| RFS-WSH | Roof Wash (soft) | RFS | RDG, VLY | Production rate × area × pitch |
| DRY-CLN | Dryer Vent Cleaning | DRY | — | Base + length + complexity |
| ACU-CLN | AC Condenser Cleaning | ACU | — | Per-unit flat |
| SLR-CLN | Solar Panel Cleaning | SLR | — | Per-panel × access |
| LIT-HLD | Holiday Lighting Install | LIT, FSC | DMR, ELC | Per-LF × HL × complexity + per-feature |
| LIT-TDN | Holiday Lighting Takedown | LIT | — | Per-LF (faster than install) |
| LIT-PRM | Permanent Lighting Install | TRL, FSC | CND, ELC | Per-LF × HL + electrical |
| FLM-RES | Window Film (residential) | WIN | — | Per-sqft × film type × HL |
| FLM-COM | Window Film (commercial) | WIN | — | Per-sqft × film type |

**Partner Referral Services (not Gleam-performed):**
| Trigger | Partner Category | Component(s) | Referral Condition |
|---------|-----------------|-------------|-------------------|
| Roof replacement | Roofer (Tier A) | RFS | Age > expected life OR storm damage |
| Gutter guard install | Gutter company | GRD | Trees + no guards |
| Window replacement | Window company | WIN | Failed IGU seals |
| Fence repair/replace | Fence company | FNC | Structural failure OR severe weathering |
| Deck stain/seal | Deck contractor | DKP | Wood deck, weathered condition |
| Tree trimming | Tree service (Tier A) | — | Canopy over roof/gutters |
| HVAC service | HVAC (Tier A) | FLU, ACU | Age > 15yr OR visible issues |
| Landscaping | Landscaper (Tier A) | — | Overgrown, drainage issues |
| Interior cleaning | Interior cleaner (Tier A) | INT | Customer buys interior window service |
| Painting | Painter | SDG, FSC | Paint peeling/fading |
| Blinds/window coverings | Blinds retailer | WIN | Privacy need identified |
| Electrician | Electrician | ELC | No GFCI, insufficient circuits |
| Chimney service | Chimney sweep | CHM | Chimney present, no recent service |

---

## 6. Property Intelligence Dossier Template (v2)

When analyzing a property, produce one JSON record per property following this schema. Every field must be assessed — use `null` for not-observable, never omit the field.

```
{
  "address": "",
  "parcel_id": "",
  "assessor": { /* from D1 properties table */ },
  "invoice": { /* if job history exists */ },

  "L1_physical_inventory": {
    "SYS01_roof": { /* per checklist above */ },
    "SYS02_gutter": { },
    "SYS03_wall_cladding": { },
    "SYS04_fenestration": { },
    "SYS05_fascia_trim": { },
    "SYS06_hardscape": { },
    "SYS07_perimeter": { },
    "SYS08_outdoor_living": { },
    "SYS09_mechanical": { },
    "SYS10_electrical_lighting": { },
    "SYS11_solar": { },
    "SYS12_interior_access": { }
  },

  "L2_gleam_services": {
    /* Every service from the matrix evaluated: candidate true/false, scope, price range */
  },

  "L3_partner_triggers": {
    /* Every partner category evaluated: trigger true/false, reason, urgency */
  },

  "L4_operational_context": {
    "environmental": {
      "facade_orientations": { "front": "", "left": "", "right": "", "rear": "" },
      "uv_exposure_by_facade": { },
      "neighbor_proximity_by_side": { },
      "prevailing_wind": "",
      "tree_canopy_coverage": ""
    },
    "access_difficulty_by_facade": { },
    "compliance_gates_triggered": [ ],
    "wci_cost_tier": "",
    "sequencer_constraints": [ ],
    "crew_estimates": { }
  },

  "L5_persona_signal": {
    "likely_persona": "",
    "confidence": 0.0,
    "signals": [ ],
    "gleam_on_candidate": "",
    "upsell_path": ""
  }
}
```

---

## Change Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-07 | Initial D2 Companion created from Master Architecture §4 + Batch 1 photo analysis findings. | Establishes complete assessment protocol for property photo analysis. |
| 2026-03-07 | Added SYS-09 dryer vent cleaning assessment, screen UV degradation protocol, window tint/film evaluation, neighbor proximity scoring, WCI cost loading table, and complete compliance gate register. | Addresses gaps identified during Batch 1 review. |
