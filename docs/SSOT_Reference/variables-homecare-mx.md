# Home Care & Maintenance: Variable Time/Risk Modifiers

This document outlines the risk multipliers, added time, and cost logic strictly for home care and maintenance services (Gutter Cleaning, Dryer Vent Cleaning/Inspection, Solar Panel Cleaning/Inspection/Bird Guard). Optimized for LLM ingestion context.

## Execution Time

### Unit Contamination
- **Variable:** `Light`
  - **Applies To:** Dryer Vent Cleaning
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Light lint needs no extra effort; baseline for vacuum use (Dryer Vent Cleaning).
- **Variable:** `Moderate`
  - **Applies To:** Dryer Vent Cleaning
  - **Impact:** +2.0 mins | $0.05 cost
  - **Rationalization:** Moderate buildup needs vacuum and brush; cost for minimal cleaner (Moderate Dryer Vent).
- **Variable:** `Heavy`
  - **Applies To:** Dryer Vent Cleaning
  - **Impact:** +4.0 mins | $0.10 cost
  - **Rationalization:** Heavy lint requires rotary brush and deep cleaning; cost for tools (Heavy Dryer Vent).
- **Variable:** `Light`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Light debris needs no extra effort; baseline for scoop (Light Gutter Cleaning).
- **Variable:** `Moderate`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +1.0 mins | $0.05 cost
  - **Rationalization:** Moderate leaves need scoop and flush; cost for water (Moderate Gutter Cleaning).
- **Variable:** `Heavy`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +3.0 mins | $0.10 cost
  - **Rationalization:** Thick debris needs extensive scooping and flushing; cost for water/tools (Heavy Gutter Cleaning).

## Safety/Set-up

### Unit Accessibility
- **Variable:** `Non-obstructed`
  - **Applies To:** Solar Panel Inspection, Solar Panel Cleaning, Solar Panel Bird Guard, Gutter Cleaning, Dryer Vent Cleaning, Dryer Vent Inspection
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Direct access requires no additional effort; baseline for all exterior tasks (General Accessibility).
- **Variable:** `Obstructed`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +1.0 mins | $0.02 cost
  - **Rationalization:** Fences delay ladder repositioning; cost for ladder adjustments (Gutter Accessibility).
- **Variable:** `Obstructed`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +1.0 mins | $0.02 cost
  - **Rationalization:** Obstacles to roof access add minimal time; cost for pole wear (Solar Panel Accessibility).
- **Variable:** `Inaccessible`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +3.0 mins | $0.10 cost
  - **Rationalization:** Roof-only access delays work; cost for harness setup (Inaccessible Gutters).
- **Variable:** `Inaccessible`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +5.0 mins | $0.15 cost
  - **Rationalization:** Harnesses or lifts for steep roofs add setup; cost for equipment (Solar Panel Safety).

### Unit Height
- **Variable:** `1 Story`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Ground-level access with no extra setup; baseline for scoop or wand use (How to Clean Gutters).
- **Variable:** `2 Stories`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +1.0 mins | $0.02 cost
  - **Rationalization:** Quick ladder moves per section add minimal time; cost for ladder wear (Gutter Cleaning Tips).
- **Variable:** `3 Stories`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +2.0 mins | $0.05 cost
  - **Rationalization:** Longer ladders or multiple repositions increase time; cost for extended tools (High Gutter Cleaning).
- **Variable:** `4+ Stories`
  - **Applies To:** Gutter Cleaning
  - **Impact:** +4.0 mins | $0.10 cost
  - **Rationalization:** Roof access or lifts needed, less frequent than windows but significant setup; cost for equipment (Commercial Gutter Cleaning).
- **Variable:** `1 Story`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Ground-level or flat roof access; baseline for pole cleaning (How to Clean Solar Panels).
- **Variable:** `2 Stories`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +2.0 mins | $0.02 cost
  - **Rationalization:** Ladder climb or pole extension adds time; cost for minimal wear (Solar Panel Roof Access).
- **Variable:** `3 Stories`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +3.0 mins | $0.05 cost
  - **Rationalization:** Higher ladder or harness prep increases time; cost for gear (High Solar Panel Cleaning).
- **Variable:** `4+ Stories`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +6.0 mins | $0.15 cost
  - **Rationalization:** Lifts or harnesses for tall structures add significant setup; cost for equipment (Commercial Solar Cleaning).

### Unit Navigability
- **Variable:** `Flat (0/12–2/12)`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Flat roofs need no extra setup; baseline for pole use (Flat Solar Cleaning).
- **Variable:** `Low Slope (3/12–5/12)`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +0.5 mins | $0.02 cost
  - **Rationalization:** Slight slope adds minimal pole adjustment; cost for wear (Low Slope Solar).
- **Variable:** `Moderate (6/12–8/12)`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +1.0 mins | $0.03 cost
  - **Rationalization:** Pole efficiency reduces time vs. Roof Washing; cost for gear (Moderate Solar).
- **Variable:** `Steep (9/12+)`
  - **Applies To:** Solar Panel Cleaning, Solar Panel Inspection, Solar Panel Bird Guard
  - **Impact:** +2.0 mins | $0.05 cost
  - **Rationalization:** Harnesses needed, but poles lessen runoff impact; cost for safety (Steep Solar Cleaning).

