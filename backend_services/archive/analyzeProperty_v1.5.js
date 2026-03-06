require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. DETERMINISTIC CALCULATOR: Before we look at the photos, we do the math
function calculateParametricBaseline(agsf, bgsf, basementBeds, yearBuilt) {
    // Above-Grade: (SqFt / 100) * Density * Style Modifier
    const rho = 1.15; // Base density for 80109
    const phi = (yearBuilt >= 2015) ? 1.45 : 1.15; // Style multiplier for modern glass
    const housePanes = Math.round((agsf / 100) * rho * phi);

    // Below-Grade: Bed_Proxy + (Remainder / 600)
    const basementPanes = (basementBeds * 2) + Math.round(((bgsf - (basementBeds * 250)) / 600) * 2);

    return { housePanes, basementPanes };
}

async function analyzePropertyWithAI(address, agsf, bgsf, totalBeds, basementBeds, yearBuilt, stories) {
    const mapsApiKey = process.env.GOOGLE_MAPS_HTTP_KEY.trim();
    const encodedAddress = encodeURIComponent(address);

    // Baseline Math
    const baseline = calculateParametricBaseline(agsf, bgsf, basementBeds, yearBuilt);

    // 2. TRIPLE-ANGLE VISION: Center, Left (-35°), Right (+35°)
    const urls = [
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=100&pitch=0&key=${mapsApiKey}`,
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=-35&key=${mapsApiKey}`,
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=35&key=${mapsApiKey}`
    ];

    console.log(`\n=================================================`);
    console.log(`🏠 GLEAM ACTUARIAL AUDIT: ${address}`);
    console.log(`📊 MATH BASELINE: ~${baseline.housePanes} House | ~${baseline.basementPanes} Basement`);
    console.log(`=================================================\n`);

    try {
        const responses = await Promise.all(urls.map(url => fetch(url)));
        const buffers = await Promise.all(responses.map(res => res.arrayBuffer()));
        const imageParts = buffers.map(buf => ({
            inlineData: { data: Buffer.from(buf).toString('base64'), mimeType: "image/jpeg" }
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert Window Cleaning Auditor. Audit the 3 attached images against the Actuarial Math Baseline.

        ESTABLISHED FACTS (Do not ignore):
        - Above-Grade Math Baseline: ${baseline.housePanes} House Panes
        - Basement Math Baseline: ${baseline.basementPanes} Basement Panes
        - Year Built: ${yearBuilt} (High probability of multi-panel rear sliders)

        AUDIT INSTRUCTIONS:
        1. GARAGE DOOR AUDIT: Using the angled shots, count ONLY the panes physically located IN the garage doors. Do NOT include these in the House count.
        2. ENTRYWAY & SIDE-WALL AUDIT: Look for side-lights, transoms, and windows on side-walls visible in angled shots.
        3. GLASS CHARACTER: Determine if the home is "Mostly Standard" (0.50 screen ratio) or "Lots of Large Glass" (0.13 screen ratio).

        OUTPUT JSON:
        {
            "visibility_confidence": "High",
            "topography": "Walk-out OR Flat",
            "audit_adjustments": "Explain any visual delta from the math baseline",
            "house_panes": {
                "level_1": <int>,
                "level_2": <int>,
                "picture_or_sliders": <int>
            },
            "basement_panes": {
                "egress_and_standard": <int>
            },
            "optional_add_ons": {
                "garage_door_panes": <int>
            },
            "glass_character_profile": "Mostly Standard OR Some Picture OR Large Glass"
        }
        `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const cleanText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        // 3. SERVICE ESTIMATION CALCULATION
        const houseTotal = data.house_panes.level_1 + data.house_panes.level_2 + data.house_panes.picture_or_sliders + data.basement_panes.egress_and_standard;
        
        // Operability Ratio Selection
        const o_ratio = data.glass_character_profile === "Mostly Standard" ? 0.50 : 0.33;
        
        // Calculate Screens/Tracks (EXCLUDING optional garage door panes)
        const screens = Math.round(houseTotal * o_ratio);

        console.log("\n--- FINAL AUDITED QUOTE DATA ---");
        console.log(`- House Panes: ${houseTotal}`);
        console.log(`- Est. Screens/Tracks: ${screens}`);
        console.log(`- OPTIONAL Garage Door Panes: ${data.optional_add_ons.garage_door_panes}`);
        console.log("\nFull Audit Details:", data);

    } catch (error) {
        console.error("\n❌ AUDIT FAILED:", error.message);
    }
}

// THE TEST: 2154 Treetop Dr
analyzePropertyWithAI("2154 Treetop Dr, Castle Rock, CO 80109", 3400, 1700, 5, 2, 2017, 2);