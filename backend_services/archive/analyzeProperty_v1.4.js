require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. DATA CENTER: Regional Architectural DNA
const regionalDNA = {
    "80108": "Luxury/Custom. High walk-out prevalence. Massive picture windows. High-tier VTMs.",
    "80109": "Tract/Custom Hybrid (The Meadows). Modern (post-2015) standards. 3-pane sliders common.",
    "80104": "Historic/Mixed. Older standard panes. Fewer massive custom glass walls.",
    "99352": "PNW Contemporary. Single-story Ramblers. Low basement prevalence. High irrigation soiling."
};

async function analyzePropertyWithAI(address, agsf, bgsf, totalBeds, basementBeds, yearBuilt, stories) {
    const mapsApiKey = process.env.GOOGLE_MAPS_HTTP_KEY.trim();
    const zipMatch = address.match(/\b\d{5}\b/);
    const zipCode = zipMatch ? zipMatch[0] : "Default";
    const zipProfile = regionalDNA[zipCode] || "Standard Residential DNA";

    // 2. TRIPLE-ANGLE VISION: Driving the camera past the house
    const encodedAddress = encodeURIComponent(address);
    const urls = [
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=100&pitch=0&key=${mapsApiKey}`, // Wide Center
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=40&key=${mapsApiKey}`,   // Right Angle
        `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&fov=90&heading=-40&key=${mapsApiKey}` // Left Angle
    ];

    console.log(`\n🚀 ENGAGING HYPER-SYNTHESIS ENGINE...`);
    console.log(`📍 ${address} | ZIP DNA: ${zipCode}`);

    try {
        const responses = await Promise.all(urls.map(url => fetch(url)));
        const buffers = await Promise.all(responses.map(res => res.arrayBuffer()));
        const imageParts = buffers.map(buf => ({
            inlineData: { data: Buffer.from(buf).toString('base64'), mimeType: "image/jpeg" }
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert actuarial estimator. Synthesize the 3 attached images with the provided property data.

        CONTEXTUAL DATA:
        - Above-Grade (AGSF): ${agsf} | Basement (BGSF): ${bgsf}
        - Bedrooms: ${totalBeds} total (${basementBeds} in basement)
        - Year Built: ${yearBuilt} | Stories: ${stories}
        - Regional DNA: ${zipProfile}

        ESTIMATION STEPS (CRITICAL):
        1. DRIVE-BY VISION: Use all 3 angles to count the front and side facades.
        2. GARAGE DECOUPLING: Count "Garage Door Panes" (panes physically in the door) separately. 
        3. 1st FLOOR AUDIT: Explicitly look for the entryway and side-wall windows.
        4. BASEMENT IRC LOGIC: Assign 2 panes per egress window. Factor in walk-out topography visible in the shots.
        5. HYPER-SCALE GUARDRAIL: If AGSF > 4500, apply logarithmic decay (larger rooms, not more windows).

        JSON RESPONSE SCHEMA:
        {
            "visibility_confidence": "High/Low",
            "topography": "Walk-out/Garden/Submerged",
            "house_panes": {
                "level_1_standard": <int>,
                "level_2_standard": <int>,
                "large_picture_or_sliders": <int>
            },
            "basement_panes": {
                "egress": <int>,
                "standard": <int>
            },
            "optional_add_ons": {
                "garage_door_panes": <int>
            },
            "total_house_estimate": <int (sum of house + basement only)>
        }
        `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log("\n--- REFINED ACTUARIAL ESTIMATE ---");
        console.log(cleanJson);

    } catch (error) {
        console.error("❌ ERROR:", error.message);
    }
}

// THE TEST: 2154 Treetop Dr
analyzePropertyWithAI("2154 Treetop Dr, Castle Rock, CO 80109", 3400, 1700, 5, 2, 2017, 2);