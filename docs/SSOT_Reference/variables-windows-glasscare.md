# Window & Glass Care: Variable Time/Risk Modifiers

This document outlines the risk multipliers, added time, and cost logic strictly for Window, Glass, Screen, and Tint services. Optimized for LLM ingestion context.

## Execution Time

### Unit Contamination
- **Variable:** `Recent (<6 months)`
  - **Applies To:** Window Cleaning: Exterior
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Recent cleaning means light dust, no extra effort; baseline (Window Cleaning Frequency).
- **Variable:** `Moderate (6–12 months)`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior
  - **Impact:** +1.0 mins | $0.05 cost
  - **Rationalization:** Typical soiling (pollen) needs slight extra scrubbing; cost for soap (Moderate Window Cleaning).
- **Variable:** `Heavy (>12 months)`
  - **Applies To:** Window Cleaning: Exterior
  - **Impact:** +3.0 mins | $0.15 cost
  - **Rationalization:** Heavy buildup requires more time and solution; cost for extra cleaner (Heavy Window Cleaning).
- **Variable:** `Post-Construction`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior
  - **Impact:** +6.0 mins | $0.25 cost
  - **Rationalization:** Paint/adhesives double time with razor blades; cost for heavy-duty cleaner (Post-Construction Cleaning).

### Unit Features
- **Variable:** `Small`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior, Window Tint Installation, Screen Repair: Rescreening, Screen Repair: Custom Screen and Frame Replacement, Glass Restoration: Scratch Restoration, Window Screen Cleaning & Sealing
  - **Impact:** +-1.0 mins | -$0.02 cost
  - **Rationalization:** Smaller units reduce cleaning time and solution; savings from efficiency (Small Surface Cleaning).
- **Variable:** `Standard (>8 sq. ft.)`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior, Window Tint Installation, Screen Repair: Rescreening, Screen Repair: Custom Screen and Frame Replacement, Glass Restoration: Scratch Restoration, Window Screen Cleaning & Sealing
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Baseline size for standard cleaning methods (Standard Surface Cleaning).
- **Variable:** `Large (>16 sq. ft.)`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior, Window Tint Installation, Screen Repair: Rescreening, Screen Repair: Custom Screen and Frame Replacement, Glass Restoration: Scratch Restoration, Window Screen Cleaning & Sealing
  - **Impact:** +2.0 mins | $0.10 cost
  - **Rationalization:** Larger surfaces need more passes and solution; cost for extra cleaner (Large Surface Cleaning).
- **Variable:** `Skylights/Storm Windows`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior, Window Tint Installation, Screen Repair: Rescreening, Screen Repair: Custom Screen and Frame Replacement, Glass Restoration: Scratch Restoration, Window Screen Cleaning & Sealing
  - **Impact:** +3.0 mins | $0.15 cost
  - **Rationalization:** Awkward angles add time and care; cost for solution and tools (Skylight Cleaning).
- **Variable:** `Multipane/French Pane`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior, Window Tint Installation, Screen Repair: Rescreening, Screen Repair: Custom Screen and Frame Replacement, Glass Restoration: Scratch Restoration, Window Screen Cleaning & Sealing
  - **Impact:** +4.0 mins | $0.20 cost
  - **Rationalization:** Multiple panes require individual passes; cost for more solution (Multipane Cleaning).

## Optional: Execution Time

### Equipment Efficiency
- **Variable:** `Water-Fed Pole`
  - **Applies To:** Window Cleaning: Exterior
  - **Impact:** +-1.0 mins | -$0.05 cost
  - **Rationalization:** Pole reduces ladder time and solution use; savings from efficiency (Water-Fed Pole Benefits).

## Optional: Modifier

### Weather Impact
- **Variable:** `Sun`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior, Glass Restoration: Hard Water Stain Restoration, Glass Restoration: Hard Water Mitigation
  - **Impact:** +1.0 mins | $0.02 cost
  - **Rationalization:** Sun causes streaking, adding wiping time; cost for extra solution (Sunny Day Cleaning).

## Safety/Set-up

### Unit Accessibility
- **Variable:** `Non-obstructed`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior, Window Track Cleaning, Window Screen Cleaning, Window Screen Cleaning & Sealing, Screen Repair: Rescreening, Screen Repair: Screen Refurbish, Screen Repair: Custom Screen and Frame Replacement, Window Tint Installation, Glass Restoration: Hard Water Stain Restoration, Glass Restoration: Hard Water Mitigation, Glass Restoration: Scratch Restoration
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Direct access requires no additional effort; baseline for all exterior tasks (General Accessibility).
- **Variable:** `Obstructed`
  - **Applies To:** Window Cleaning: Exterior
  - **Impact:** +1.0 mins | $0.02 cost
  - **Rationalization:** Shrubs or fences slow hose or ladder moves; cost for minor hose wear (Window Cleaning Obstacles).
- **Variable:** `Inaccessible`
  - **Applies To:** Window Cleaning: Exterior
  - **Impact:** +4.0 mins | $0.10 cost
  - **Rationalization:** Lifts or ropes for high, blocked panes add significant setup; cost for equipment (High Window Access).

### Unit Height
- **Variable:** `1 Story`
  - **Applies To:** Window Cleaning: Exterior, Window Cleaning: Interior, Window Tint Installation
  - **Impact:** +0.0 mins | $0.00 cost
  - **Rationalization:** Ground-level access requires no additional setup; baseline for pole or manual cleaning (How to Clean Windows).
- **Variable:** `2 Stories`
  - **Applies To:** Window Cleaning: Exterior, Window Tint Installation
  - **Impact:** +1.0 mins | $0.02 cost
  - **Rationalization:** Pole extension or ladder repositioning adds minimal time; cost reflects extra hose wear (Water-Fed Pole Cleaning).
- **Variable:** `3 Stories`
  - **Applies To:** Window Cleaning: Exterior, Window Tint Installation
  - **Impact:** +2.0 mins | $0.05 cost
  - **Rationalization:** Extended pole or ladder setup increases time; cost for additional hose length or gear wear (High Window Cleaning).
- **Variable:** `4+ Stories`
  - **Applies To:** Window Cleaning: Exterior, Window Tint Installation
  - **Impact:** +5.0 mins | $0.10 cost
  - **Rationalization:** Scissor lifts or harnesses required, significantly increasing setup time; cost for equipment use (Commercial Window Cleaning).

