require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzePropertyWithAI(address, agsf, bgsf, totalBeds, basementBeds, yearBuilt, stories) {
    const mapsApiKey = process.env.GOOGLE_MAPS_HTTP_KEY.trim();
    if (!mapsApiKey || !process.env.GEMINI_API_KEY) return console.error("Missing API keys.");

    const encodedAddress = encodeURIComponent(address);
    
    // FETCHING THREE ANGLES: Left Approach (-30 heading), Center, Right Approach (+30 heading)
    // Note: In a production app, we would use the Street View Metadata API to find the exact street heading.
    // For this prototype, we will use three field-of-view/pitch variations to simulate 'moving up the street'.
    const urls = [
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=110&pitch=0&source=outdoor&key=${mapsApiKey}`, // Wide Center
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=45&source=outdoor&key=${mapsApiKey}`,  // Right Perspective
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=-45&source=outdoor&key=${mapsApiKey}` // Left Perspective
    ];

    console.log(`\n=================================================`);
    console.log(`🏠 ANALYZING: ${address} (Triple-Angle Vision)`);
    console.log(`=================================================\n`);

    try {
        const responses = await Promise.all(urls.map(url => fetch(url)));
        const buffers = await Promise.all(responses.map(res => res.arrayBuffer()));
        const imageParts = buffers.map(buf => ({
            inlineData: { data: Buffer.from(buf).toString('base64'), mimeType: "image/jpeg" }
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert window cleaning estimator. Analyze the THREE attached perspectives of this property to provide a comprehensive count.
        
        PROPERTY DATA: ${agsf} AGSF | ${bgsf} BGSF | ${totalBeds} Beds | Built ${yearBuilt}

        COUNTING INSTRUCTIONS:
        1. House Panes (Level 1 & 2): Count all visible standard windows on the house structure. Be sure to look for entryway windows and side windows visible in the angled shots.
        2. Garage DOOR Panes: Look specifically at the garage doors. Count every small pane of glass actually IN the garage doors. This is an OPTIONAL add-on.
        3. Garage WALL Windows: If the garage has a standard window on its wall (not in the door), count that as a Level 1 House Pane.
        4. Basement: ${bgsf} sq ft in 80109. Expect exactly 2 panes per egress window opening. Use the 'Walk-out' topography in the photos as a secondary check.

        CRITICAL: Do NOT include 'Garage DOOR Panes' in the 'level_1_panes' count. Keep them isolated.

        Return JSON:
        {
            "visibility_report": "Summary of what was found across all 3 angles",
            "house_panes": {
                "level_1": <int>,
                "level_2": <int>,
                "picture_or_sliders": <int>
            },
            "basement_panes": {
                "egress_panes": <int>,
                "standard_panes": <int>
            },
            "optional_add_ons": {
                "garage_door_panes": <int>
            },
            "estimated_house_total": <total of house and basement only>
        }
        `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const cleanText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log(cleanText);

    } catch (error) {
        console.error("\n❌ ANALYSIS FAILED:", error.message);
    }
}

// THE TEST: 2154 Treetop Dr
analyzePropertyWithAI("2154 Treetop Dr, Castle Rock, CO 80109", 3400, 1700, 5, 2, 2017, 2);