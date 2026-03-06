require('dotenv').config({ path: '../../.env' }); // Load variables from root .env

/**
 * Fetches property data from RentCast API
 */
async function getPropertyData(address) {
    // We add .trim() to completely remove any hidden Windows newline characters (\r\n)
    const apiKey = process.env.RENTCAST_API_KEY.trim(); 
    
    if (!apiKey) {
        console.error("Error: RENTCAST_API_KEY is missing from .env file.");
        return;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.rentcast.io/v1/properties?address=${encodedAddress}`;

    try {
        console.log(`Fetching data for: ${address}...`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey,
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            // This will capture the EXACT error message from RentCast's servers
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}\nRentCast says: ${errorText}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const property = data[0];
            
            console.log(`\n--- Data Found ---`);
            console.log(`Square Footage: ${property.squareFootage || 'N/A'}`);
            console.log(`Year Built: ${property.yearBuilt || 'N/A'}`);
            console.log(`Property Type: ${property.propertyType || 'N/A'}`);
            
            return {
                squareFootage: property.squareFootage,
                yearBuilt: property.yearBuilt,
                propertyType: property.propertyType
            };
        } else {
            console.log(`No data found for address: ${address}`);
            return null;
        }

    } catch (error) {
        console.error("Failed to fetch property data:\n", error.message);
    }
}

// Notice the added comma between CO and the Zip code to perfectly match RentCast docs
getPropertyData("1202 Wildcat Bend Ct, Castle Rock, CO 80108");