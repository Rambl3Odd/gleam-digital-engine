/**
 * Gleam Central Booking Hub - State Manager
 * Completely decoupled from the UI. Vanilla JS Only.
 * Replaces legacy React state hooks and handles dynamic pricing/upsells.
 */

const BookingConfig = {
    makeWebhookUrl: "https://hook.us2.make.com/wprk61uaaa1jvii7bsrxto5k64y36pny",
    availabilityWebhook: "https://hook.us2.make.com/m8074aeoa757vitmyqdo4v5tx2m9dmxw",
    authToken: "GleamSecure2026!",
    
    // Core Add-on Catalog
    addonsCatalog: [
        { 
            id: 'dv', sku: 'RES-DRY-CLN', name: 'Dryer Vent Cleaning', 
            sub: 'Prevent fire hazards & save energy.', 
            img: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/e67ea7aa-f0b8-452c-9b82-a66743d6e2dc/service-homecare%26mx-dryervent%28300x300%29.png?format=750w', 
            price: 99, reg: 149, popular: true, defaultQty: 1, editable: false, category: 'all' 
        },
        { 
            id: 'seal', sku: 'RES-SCR-SEL', name: 'Window Screen Sealing', 
            sub: 'UV protection for your screens.', 
            img: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/db20b51d-8504-4373-8879-6b4f5966ea4f/service-window%26glass-screens%28300x300%29.png?format=750w', 
            price: 1.50, reg: 3.00, popular: false, defaultQty: 1, unit: 'screen', editable: false, category: 'window_only' 
        },
        { 
            id: 'rescreen', sku: 'RES-SCR-RMD', name: 'Rescreening (Mesh)', 
            sub: 'Replace torn mesh.', 
            img: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/01f57e76-9d1e-4a39-b174-c7212af39a6f/service-exteriorsurface-deck%28300x300%29_1.png?format=750w', 
            isMultiSize: true, sizes: [
                { key: 'small', label: 'Under 5 sq.ft.', price: 30 },
                { key: 'med', label: '5-10 sq.ft.', price: 40 },
                { key: 'large', label: '10-15 sq.ft.', price: 50 }
            ], popular: false, editable: true, category: 'window' 
        },
        {
            id: 'frame_build', sku: 'RES-SCR-NEW', name: 'Custom Frame Build',
            sub: 'Complete frame and mesh fabrication.',
            img: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/5795b46f-0446-4d83-8565-f1392a5a1bb6/service-exteriorsurface-deck%28300x300%29_2.png?format=750w',
            isMultiSize: true, sizes: [
                { key: 'small', label: 'Under 5 sq.ft.', price: 80 },
                { key: 'med', label: '5-10 sq.ft.', price: 110 },
                { key: 'large', label: '10-15 sq.ft.', price: 140 }
            ], popular: false, editable: true, category: 'window'
        },
        { 
            id: 'window_touchup', sku: 'RES-WIN-TCH', name: 'Exterior Window Wash', 
            sub: 'Remove hard water & runoff spots.', 
            img: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/4cf77caa-aaf4-41ad-bd1a-2d39ba9d1ab4/service-window%26glass-exterior%28300x300%29.png?format=300w', 
            price: 199, reg: 249, popular: true, defaultQty: 1, editable: true, category: 'exterior' 
        },
        { 
            id: 'gutter_flush', sku: 'RES-HMX-GUT', name: 'Gutter Flush', 
            sub: 'Ensure proper drainage.', 
            img: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/e67ea7aa-f0b8-452c-9b82-a66743d6e2dc/service-homecare%26mx-dryervent%28300x300%29.png?format=750w', 
            price: 149, reg: 199, popular: false, defaultQty: 1, editable: true, category: 'exterior' 
        },
        { 
            id: 'walkway_wash', sku: 'RES-EXT-WLK', name: 'Walkway Pressure Wash', 
            sub: 'Boost curb appeal & safety.', 
            img: 'https://images.squarespace-cdn.com/content/v1/619afe45ad84012af3853c29/01f57e76-9d1e-4a39-b174-c7212af39a6f/service-exteriorsurface-deck%28300x300%29_1.png?format=750w', 
            price: 129, reg: 179, popular: true, defaultQty: 1, editable: true, category: 'maintenance' 
        }
    ]
};

const BookingStateManager = {
    state: {
        step: 1,
        inbound: {
            panes: '--',
            basePrice: 0,
            inboundSavings: 0,
            onsiteTime: '--',
            homeSize: '--',
            lineItems: []
        },
        addons: { dv: 1 }, // Default addon
        contact: { firstName: '', lastName: '', email: '', phone: '' },
        address: '',
        schedule: {
            mode: 'suggested', // 'suggested' or 'all'
            selectedSlot: null,
            availableSlots: [],
            isLoadingSlots: false
        },
        timeLeft: 900, // 15 minutes
        utms: {} // Marketing attribution
    },

    // --- 1. DATA INGESTION ---
    parseInboundData() {
        // Priority 1: Secure sessionStorage (Phase 4.5.3)
        const sessionData = sessionStorage.getItem('gleam_digital_twin');
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                this.state.inbound = {
                    panes: parsed.panes || '--',
                    basePrice: parseFloat(parsed.estimateResult?.rawTotal || 0),
                    inboundSavings: parseFloat(parsed.estimateResult?.rawTotal - parsed.estimateResult?.priceMid) || 0,
                    onsiteTime: parsed.estimateResult?.onsiteMinutes ? `${Math.round(parsed.estimateResult.onsiteMinutes)} mins` : '--',
                    homeSize: `${parsed.sqft || 0} sq ft`,
                    lineItems: parsed.hubLineItems || []
                };
            } catch(e) { console.error("Session storage parse failed", e); }
        } else {
            // Priority 2: Fallback to URL parsing (Legacy support)
            const params = new URLSearchParams(window.location.search);
            let parsedItems = [];
            try {
                const rawBreakdown = params.get('breakdown');
                if (rawBreakdown) parsedItems = JSON.parse(decodeURIComponent(rawBreakdown));
            } catch (e) { console.error("URL Breakdown parse error", e); }

            this.state.inbound = {
                panes: params.get('panes') || '--',
                basePrice: parseFloat(params.get('base')) || 0,
                inboundSavings: parseFloat(params.get('savings')) || 0,
                onsiteTime: params.get('onsite') ? decodeURIComponent(params.get('onsite')) : '--',
                homeSize: params.get('sqft') ? `${parseInt(params.get('sqft')).toLocaleString()} sq ft` : '--',
                lineItems: parsedItems
            };
        }

        // Grab UTMs for tracking
        this.state.utms = {
            source: sessionStorage.getItem('utm_source') || 'direct',
            medium: sessionStorage.getItem('utm_medium') || '',
            campaign: sessionStorage.getItem('utm_campaign') || ''
        };
    },

    // --- 2. DYNAMIC UPSELL ENGINE ---
    getAvailableAddons() {
        const serviceNames = this.state.inbound.lineItems.map(i => i.name.toLowerCase()).join(' ');
        let category = 'window'; 
        if (serviceNames.includes('wash') || serviceNames.includes('driveway') || serviceNames.includes('roof')) category = 'exterior';
        if (serviceNames.includes('gutter') || serviceNames.includes('solar')) category = 'maintenance';

        const hasScreenCleaning = serviceNames.includes('screen');
        const estScreens = Math.round(parseInt(this.state.inbound.panes)) || 20;

        return BookingConfig.addonsCatalog.filter(addon => {
            if (addon.category === 'all') return true;
            if (addon.id === 'seal' && hasScreenCleaning && estScreens > 0) {
                addon.sub = `UV protection for your ${estScreens} screens.`;
                addon.defaultQty = estScreens;
                return true;
            }
            return addon.category === category || (addon.category === 'window' && category === 'window');
        });
    },

    // --- 3. STATE MUTATORS ---
    toggleAddon(id, defaultQty, isMultiSize) {
        if (id in this.state.addons) {
            delete this.state.addons[id];
        } else {
            if (isMultiSize) {
                this.state.addons[id] = { small: 0, med: 1, large: 0 };
            } else {
                this.state.addons[id] = defaultQty || 1;
            }
        }
        return this.state.addons;
    },

    updateAddonQty(id, delta, sizeKey) {
        const current = this.state.addons[id];
        if (typeof current === 'object' && sizeKey) {
            this.state.addons[id][sizeKey] = Math.max(0, current[sizeKey] + delta);
        } else {
            this.state.addons[id] = Math.max(1, current + delta);
        }
        return this.state.addons;
    },

    updateContactForm(field, value) {
        this.state.contact[field] = value;
    },

    setAddress(val) { this.state.address = val; },
    setStep(step) { this.state.step = step; },
    setSelectedSlot(slot) { this.state.schedule.selectedSlot = slot; },
    setScheduleMode(mode) { this.state.schedule.mode = mode; },
    
    validateForm() {
        return this.state.contact.firstName.trim() !== '' && 
               this.state.contact.lastName.trim() !== '' && 
               this.state.contact.email.trim() !== '' && 
               this.state.contact.phone.trim() !== '' &&
               this.state.address.trim() !== '';
    },

    // --- 4. PRICING CALCULATOR ---
    calculateTotals() {
        let addOnPrice = 0; 
        let addOnSavings = 0;
        const availableAddons = this.getAvailableAddons();

        Object.entries(this.state.addons).forEach(([id, val]) => {
            const addon = availableAddons.find(a => a.id === id);
            if (addon) {
                if (addon.isMultiSize) {
                    Object.entries(val).forEach(([sizeKey, qty]) => {
                        const sizeConfig = addon.sizes.find(s => s.key === sizeKey);
                        if (sizeConfig) {
                            addOnPrice += sizeConfig.price * qty;
                            addOnSavings += (sizeConfig.price * 0.1) * qty; 
                        }
                    });
                } else {
                    const qty = val;
                    addOnPrice += addon.price * qty;
                    addOnSavings += (addon.reg - addon.price) * qty;
                }
            }
        });

        const final = this.state.inbound.basePrice + addOnPrice;
        
        return { 
            total: final.toFixed(0), 
            savings: addOnSavings + 60, // Includes $60 waived setup fee
            baseLow: Math.floor(this.state.inbound.basePrice * 0.92), 
            baseHigh: Math.ceil(this.state.inbound.basePrice * 1.08) 
        };
    },

    // --- 5. PAYLOAD ASSEMBLY (Make.com Contract) ---
    buildFinalPayload() {
        const totals = this.calculateTotals();
        const addonItems = [];
        const availableAddons = this.getAvailableAddons();

        Object.entries(this.state.addons).forEach(([id, val]) => {
            const addon = availableAddons.find(a => a.id === id);
            if (!addon) return;
            if (addon.isMultiSize) {
                Object.entries(val).forEach(([sizeKey, qty]) => {
                    if (qty > 0) {
                        const sizeConfig = addon.sizes.find(s => s.key === sizeKey);
                        addonItems.push({
                            name: `${addon.name} (${sizeConfig.label})`,
                            qty: qty,
                            price: sizeConfig.price,
                            sku: `${addon.sku}-${sizeKey.toUpperCase()}`,
                            man_hours: 'N/A'
                        });
                    }
                });
            } else {
                addonItems.push({
                    name: addon.name,
                    qty: val,
                    price: addon.price,
                    sku: addon.sku || 'UNKNOWN',
                    man_hours: 'N/A'
                });
            }
        });

        const unifiedLineItems = [
            ...this.state.inbound.lineItems.map(item => ({
                ...item,
                qty: 1, 
                sku: item.sku || 'UNKNOWN',
                man_hours: item.time || 'N/A'
            })),
            ...addonItems
        ];

        const totalSavings = parseFloat(totals.savings) + this.state.inbound.inboundSavings;
        if (totalSavings > 0) {
            unifiedLineItems.push({
                name: 'Bundle Savings',
                qty: 1,
                price: -Math.abs(totalSavings),
                sku: 'PROMO-BUN-DIS',
                man_hours: 'Included'
            });
        }

        return {
            contact: this.state.contact,
            address: this.state.address,
            marketing_attribution: this.state.utms, // From Section 8 requirements
            booking: {
                date: this.state.schedule.selectedSlot?.day,
                window: this.state.schedule.selectedSlot?.window,
                tag: this.state.schedule.selectedSlot?.tag || 'Standard'
            },
            details: {
                panes: this.state.inbound.panes,
                homeSize: this.state.inbound.homeSize,
                onsiteTime: this.state.inbound.onsiteTime
            },
            financials: {
                base_price: this.state.inbound.basePrice,
                total_price: totals.total,
                savings: totalSavings
            },
            line_items: unifiedLineItems,
            source: 'Gleam Central Booking Hub V6.1'
        };
    }
};

// Expose to window for UI usage
window.BookingStateManager = BookingStateManager;