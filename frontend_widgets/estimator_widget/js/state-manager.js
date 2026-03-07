/**
 * Gleam Services - State Manager
 * Holds the user's current selections and handles all pricing calculations.
 * Completely decoupled from the UI.
 */

const AppConfig = {
    validZips: [
        "80109", "80108", "80104", "80131", "80134", "80124", "80130", "80126", "80163", "80116", "80125", "80112", "80118", "80129", "80138", "80122", "80121", "80120", "80111", "80128", "80162", "80015", "80160", "80161", "80165", "80166", "80135", "80237", "80016", "80127", "80113", "80123", "80107", "80014", "80425", "80150", "80151", "80155", "80044", "80110", "80133", "80236", "80222", "80231", "80013", "80210", "80224", "80208", "80046", "80433", "80247", "80235", "80132", "80012", "80246", "80223", "80017", "80209", "80227", "80219", "80465", "80230", "80018", "80232", "80220", "80206", "80011", "80218", "80921", "80203", "80010", "80042", "80040", "80201", "80217", "80243", "80248", "80250", "80256", "80259", "80261", "80263", "80271", "80273", "80274", "80281", "80291", "80045", "80226", "80264", "80047", "80290", "80204", "80293", "80299", "80117", "80228", "80257", "80265", "80294", "80454", "80207", "80470", "80202", "80205", "80225", "80106", "80041", "80214", "80841", "80238", "80211", "80453", "80215", "80216", "80137", "80212", "80239", "80266", "80908", "80866", "80034", "80840", "80457", "80019", "80437", "80419", "80033", "80863", "80401", "80037", "80819", "80002", "80221", "80001", "80006", "80402", "80924", "80920", "80036", "80030", "80024", "80035", "80003", "80229", "80004", "80919", "80249", "80102", "80809", "80439", "80831", "80260", "80923", "80918", "80640", "80022", "80927", "80005", "80031", "80233", "80814", "80917", "80907", "80475", "80938", "80007", "80922", "80234", "80614", "80904", "80241", "80021", "80939", "80909", "80020", "80038", "80601", "80915", "80951", "80950", "80602", "80942", "80931", "80932", "80933", "80934", "80935", "80936", "80937", "80941", "80946", "80947", "80949", "80960", "80962", "80970", "80995", "80997", "80901", "80829", "80903", "80827", "80448", "80905",
        "97882", "97838", "99346", "97875", "97844", "99338", "99337", "99345", "97826", "97835", "99336", "99363", "99352", "99302", "97818", "99350", "99353", "99323", "99320", "97839", "99354", "99360", "97801", "97813", "98930", "97843", "97810"
    ],
    pricingVariables: {
        baseRate: 1.95, logisticsFee: 60.00,
        soiling: { low: 0.02, mid: 1.18, high: 1.81 },
        height2ndStory: 0.88, height3rdStory: 1.79,
        largePaneSurcharge: 1.85, frenchPaneRate: 4.42,
        skylightPrice: 15.00, basementSurcharge: 2.50,
        screenPrice: 2.50, trackPrice: 3.50, sealingPrice: 1.50,
        largePaneRatio: 0.10, largePaneRatioUpper: 0.05
    },
    density: { low: 0.010, mid: 0.014, high: 0.016 },
    timeModifiers: { screen: 1.17, track: 3.60, logistics: 40, skylight: 7.5 }
};

const StateManager = {
    // 1. The Single Source of Truth for Data
    state: {
        step: 1,
        selectedServices: new Set(),
        sqft: 3000,
        stories: 2,
        history: 'mid',
        basement: false,
        skylights: 0,
        customerType: 'res',
        zipCode: '',
        zipCodeValidated: false,
        
        // Calculated Outputs
        panes: 0,
        basePanes: 0,
        hubLineItems: [],
        estimateResult: null
    },

    // 2. State Mutators (How we safely change the data)
    setCustomerType(type) {
        this.state.customerType = type;
    },

    validateZip(zipCode) {
        if (AppConfig.validZips.includes(zipCode)) {
            this.state.zipCode = zipCode;
            this.state.zipCodeValidated = true;
            return true;
        }
        return false;
    },

    toggleService(serviceId) {
        if (this.state.selectedServices.has(serviceId)) {
            this.state.selectedServices.delete(serviceId);
        } else {
            this.state.selectedServices.add(serviceId);
        }
        return this.state.selectedServices.size;
    },

    setSqft(val) {
        const numVal = parseInt(val, 10);
        if (!isNaN(numVal) && numVal >= 500 && numVal <= 10000) {
            this.state.sqft = numVal;
        }
    },

    calcSqftFromRooms(beds, baths) {
        const b = parseInt(beds) || 0;
        const ba = parseInt(baths) || 0;
        if (b > 0 || ba > 0) {
            this.setSqft((b * 850) + (ba * 300));
        }
        return this.state.sqft;
    },

    setStories(val) { this.state.stories = val; },
    setHistory(val) { this.state.history = val; },
    setBasement(isChecked) { this.state.basement = isChecked; },
    
    updateSkylights(change) {
        let newVal = this.state.skylights + change;
        this.state.skylights = Math.max(0, newVal);
        return this.state.skylights;
    },

    setStep(stepNum) {
        this.state.step = stepNum;
    },

    // 3. The Math Execution Engine
    calculateEstimate() {
        const { sqft, stories, basement, skylights, history, selectedServices } = this.state;
        const PRICING = AppConfig.pricingVariables;

        const packageType = selectedServices.has('int') ? 'deluxe' : 'exterior';
        const includeScreens = selectedServices.has('scr');
        const includeTracks = selectedServices.has('trk');
        const isFrenchPanes = false; // Add to UI input later
        const includeSealing = false; // Add to UI input later

        // Distribute panes across levels
        const distributePanes = (totalPanes) => {
            let p1 = 0, p2 = 0, p3 = 0;
            if (stories === 1) { p1 = totalPanes; }
            else if (stories === 2) { p1 = Math.ceil(totalPanes * 0.65); p2 = totalPanes - p1; }
            else if (stories === 3) { p1 = Math.ceil(totalPanes * 0.60); p2 = Math.ceil(totalPanes * 0.30); p3 = totalPanes - p1 - p2; }
            return { p1, p2, p3 };
        };

        // Core pricing loop
        const getPrice = (densityKey) => {
            let basePanes = Math.ceil(sqft * AppConfig.density[densityKey]);
            let basementPanes = basement ? 8 : 0; // *Note: AI architectural correction needed here later*
            let counts = distributePanes(basePanes);
            
            let total = PRICING.logisticsFee;
            let effectiveBase = isFrenchPanes ? PRICING.frenchPaneRate : PRICING.baseRate;
            let soilFee = PRICING.soiling[history] || PRICING.soiling.mid;
            
            let price1st = effectiveBase + soilFee;
            let price2nd = effectiveBase + soilFee + PRICING.height2ndStory;
            let price3rd = effectiveBase + soilFee + PRICING.height3rdStory;
            let priceBsmt = effectiveBase + soilFee + PRICING.basementSurcharge;
            
            let extTotal = (counts.p1 * price1st) + (counts.p2 * price2nd) + (counts.p3 * price3rd) + (basementPanes * priceBsmt);
            
            if (!isFrenchPanes) {
                let largeCount = Math.ceil(counts.p1 * PRICING.largePaneRatio);
                let largeCountUpper = Math.ceil((counts.p2 + counts.p3) * PRICING.largePaneRatioUpper); 
                extTotal += (largeCount + largeCountUpper) * PRICING.largePaneSurcharge;
            }
            total += extTotal;
            
            let intTotal = 0;
            if (packageType === 'deluxe') {
                let totalPanes = counts.p1 + counts.p2 + counts.p3 + basementPanes;
                intTotal = totalPanes * effectiveBase;
                if (!isFrenchPanes) {
                    let largeCountInt = Math.ceil(counts.p1 * PRICING.largePaneRatio);
                    intTotal += largeCountInt * PRICING.largePaneSurcharge;
                }
                total += intTotal;
            }
            
            let skyTotal = skylights > 0 ? (skylights * PRICING.skylightPrice) : 0;
            total += skyTotal;
            
            let totalPanes = counts.p1 + counts.p2 + counts.p3 + basementPanes;
            let screenTotal = includeScreens ? (totalPanes * PRICING.screenPrice) : 0;
            let trackTotal = includeTracks ? (totalPanes * PRICING.trackPrice) : 0;
            
            total += (screenTotal + trackTotal);
            if (includeSealing) total += totalPanes * PRICING.sealingPrice;
            
            return { 
                total: Math.ceil(total), ext: extTotal, int: intTotal, 
                sky: skyTotal, scr: screenTotal, trk: trackTotal, logistics: PRICING.logisticsFee 
            };
        };

        // Execute calculations
        let lowResult = getPrice('low');
        let midResult = getPrice('mid');
        let highResult = getPrice('high');

        // Discount logic
        let svcCount = (packageType === 'deluxe' ? 2 : 1) + (includeScreens ? 1 : 0) + (includeTracks ? 1 : 0);
        let discount = svcCount >= 4 ? 0.10 : (svcCount === 3 ? 0.075 : (svcCount === 2 ? 0.05 : 0));
        
        // Update State
        this.state.basePanes = Math.ceil(sqft * AppConfig.density.mid);
        this.state.panes = this.state.basePanes + (basement ? 8 : 0);

        // Build Breakdown Array for Handoff
        const items = [];
        let extTime = this.state.panes * 2.57;
        items.push({ name: 'Exterior Cleaning', cost: midResult.ext, time: extTime });
        
        if (selectedServices.has('int')) {
            let intTime = this.state.panes * 1.57;
            items.push({ name: 'Interior Cleaning', cost: midResult.int, time: intTime });
        }
        if (selectedServices.has('scr')) {
            let sTime = this.state.panes * AppConfig.timeModifiers.screen;
            items.push({ name: 'Screens', cost: midResult.scr, time: sTime });
        }
        if (selectedServices.has('trk')) {
            let tTime = this.state.panes * AppConfig.timeModifiers.track;
            items.push({ name: 'Deep Track Clean', cost: midResult.trk, time: tTime });
        }
        if (skylights > 0) {
            let skyTime = skylights * AppConfig.timeModifiers.skylight;
            items.push({ name: `Skylights (x${skylights})`, cost: midResult.sky, time: skyTime });
        }
        items.push({ name: 'Logistics & Setup', cost: midResult.logistics, time: AppConfig.timeModifiers.logistics });

        // Update Hub Line Items state for API handoff
        this.state.hubLineItems = items.map(item => ({
            name: item.name,
            sub: item.name === 'Exterior Cleaning' ? 'Glass, Frames & Sills' : 
                 item.name === 'Interior Cleaning' ? 'Inside Glass & Sills' : '',
            price: item.cost,
            time: item.time > 60 ? `${Math.floor(item.time/60)}h ${Math.round(item.time%60)}m` : `${Math.round(item.time)}m`
        }));

        let totalMinutes = items.reduce((sum, i) => sum + i.time, 0);

        this.state.estimateResult = {
            priceLow: Math.ceil(lowResult.total * (1 - discount)),
            priceMid: Math.ceil(midResult.total * (1 - discount)),
            priceHigh: Math.ceil(highResult.total * (1 - discount)),
            rawTotal: midResult.total,
            discount: discount,
            itemsBreakdown: items,
            onsiteMinutes: totalMinutes / 1.47
        };

        return this.state.estimateResult;
    }
};

// Expose to window for UI usage
window.StateManager = StateManager;