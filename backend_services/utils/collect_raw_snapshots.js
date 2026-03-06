const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// 1. Load your local API secrets
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.RENTCAST_API_KEY) {
    console.error("🛑 ERROR: RENTCAST_API_KEY not found! Check your .env file.");
    process.exit(1);
}
const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY.trim(); 
const GOOGLE_API_KEY = (process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_HTTP_KEY || "").trim(); 

// Load the list of properties
const targetsPath = path.join(__dirname, 'targets.json');
const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));

// Create the main output directory
const mainOutputDir = path.join(__dirname, 'raw_snapshots');
if (!fs.existsSync(mainOutputDir)) {
    fs.mkdirSync(mainOutputDir);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchAndSaveRawData() {
    console.log(`🚀 Gleam Dossier Generator: Building Multi-Modal Twins for ${targets.length} properties...\\n`);

    for (let i = 0; i < targets.length; i++) {
        const address = targets[i];
        console.log(`\\n======================================================`);
        console.log(`Processing [${i + 1}/${targets.length}]: ${address}`);
        const cleanName = address.toLowerCase().replace(/,/g, '').replace(/\\s+/g, '-');

        // Create a specific folder for this property
        const propertyDir = path.join(mainOutputDir, cleanName);
        if (!fs.existsSync(propertyDir)) {
            fs.mkdirSync(propertyDir);
        }

        let lat = null;
        let lng = null;

        // --- CALL 1: RENTCAST (Text/Actuarial) ---
        try {
            const rentCastUrl = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`;
            const rentCastResponse = await axios.get(rentCastUrl, {
                headers: { 'X-Api-Key': RENTCAST_API_KEY, 'accept': 'application/json' }
            });
            const propertyData = rentCastResponse.data[0]; 
            if (propertyData) {
                fs.writeFileSync(path.join(propertyDir, `rentcast.json`), JSON.stringify(propertyData, null, 2));
                console.log(`   ✅ RentCast Actuarial Data Saved.`);
                lat = propertyData.latitude;
                lng = propertyData.longitude;
            }
        } catch (error) {
            console.error(`   ❌ RentCast FAIL: ${error.message}`);
        }

        if (lat && lng && GOOGLE_API_KEY) {
            // --- CALL 2: GOOGLE SOLAR (Roofing/LiDAR) ---
            try {
                const solarUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${GOOGLE_API_KEY}`;
                const solarResponse = await axios.get(solarUrl);
                fs.writeFileSync(path.join(propertyDir, `google-solar.json`), JSON.stringify(solarResponse.data, null, 2));
                console.log(`   ✅ Google Solar Saved.`);
            } catch (error) {
                console.log(`   ⚠️ Google Solar: Not Mapped in 3D yet (404).`);
            }

            // --- CALL 3: GOOGLE ELEVATION (Topography Risk) ---
            try {
                const elevUrl = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${GOOGLE_API_KEY}`;
                const elevResponse = await axios.get(elevUrl);
                fs.writeFileSync(path.join(propertyDir, `elevation.json`), JSON.stringify(elevResponse.data, null, 2));
                console.log(`   ✅ Google Elevation Saved.`);
            } catch (error) {
                console.error(`   ❌ Google Elevation FAIL.`);
            }

            // --- CALL 4: NWS WEATHER API (Zero-Cost Partner/Nudge Data) ---
            try {
                // NWS requires a User-Agent header
                const nwsUrl = `https://api.weather.gov/points/${lat},${lng}`;
                const nwsResponse = await axios.get(nwsUrl, { headers: { 'User-Agent': 'GleamDigitalEngine/1.0' } });
                fs.writeFileSync(path.join(propertyDir, `nws-climate-grid.json`), JSON.stringify(nwsResponse.data, null, 2));
                console.log(`   ✅ NWS Climate Grid Saved (Zero Cost).`);
            } catch (error) {
                console.error(`   ❌ NWS Climate FAIL: ${error.message}`);
            }

            // --- CALL 5: GOOGLE MAPS SATELLITE (Vision Twin) ---
            try {
                const satUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=600x600&maptype=satellite&key=${GOOGLE_API_KEY}`;
                const satResponse = await axios.get(satUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(path.join(propertyDir, `satellite.jpg`), satResponse.data);
                console.log(`   ✅ Satellite Imagery Saved.`);
            } catch (error) {
                console.error(`   ❌ Satellite Imagery FAIL.`);
            }

            // --- CALL 6: GOOGLE STREET VIEW TRIPLE-ANGLE (Vision Twin) ---
            try {
                const svBase = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&key=${GOOGLE_API_KEY}`;
                
                // Center
                const svCenter = await axios.get(`${svBase}&fov=100`, { responseType: 'arraybuffer' });
                fs.writeFileSync(path.join(propertyDir, `streetview-center.jpg`), svCenter.data);
                
                // Pan Left 40 degrees
                const svLeft = await axios.get(`${svBase}&fov=90&heading=-40`, { responseType: 'arraybuffer' });
                fs.writeFileSync(path.join(propertyDir, `streetview-left.jpg`), svLeft.data);

                // Pan Right 40 degrees
                const svRight = await axios.get(`${svBase}&fov=90&heading=40`, { responseType: 'arraybuffer' });
                fs.writeFileSync(path.join(propertyDir, `streetview-right.jpg`), svRight.data);

                console.log(`   ✅ Street View (Triple Angle) Saved.`);
            } catch (error) {
                console.error(`   ❌ Street View FAIL.`);
            }
        }

        // Delay to respect API rate limits (2 seconds between houses)
        await delay(2000);
    }

    console.log("\\n🏁 Master Dossier Collection Complete. Check your raw_snapshots folder!");
}

fetchAndSaveRawData();