# 1. Project Overview & Strategic Positioning

We are building "Gleam 3.0," an enterprise-grade digital architecture that fundamentally transforms Gleam from a commodity exterior cleaning service into a **Home Asset Management firm**. This architecture operates on a strict "Dumb Frontend / Genius Backend" topology, eliminating human estimating errors to achieve perfect unit economics and infinite scalability.

## 1.1 The Core Philosophy (Home Asset Management)

* **The 1% Rule:** The foundational economic principle of Gleam 3.0 is that homeowners should spend roughly 1% of their home's total value annually on maintenance and preservation. This metric dictates our cross-sell logic, Gleam-On subscription pricing tiers, and lead-scoring algorithms.
* **Equity Insurance vs. Discretionary Luxury:** We are executing a strict strategic pivot in our market positioning. We no longer sell "clean windows" or "power washing" as a discretionary aesthetic luxury. We sell **essential maintenance and equity preservation**. 
* **Framing Structural Threats:** The marketing, sales, and operational computing narratives frame localized environmental factors as active structural threats to the home's lifespan and the homeowner's equity. Specifically:
  * *High-Altitude UV Exposure:* Accelerates the breakdown of vinyl siding, window seals, and fiberglass screens.
  * *Wildfire Ash Deposition:* Creates acidic etching on glass and paint when mixed with morning dew.
  * *High-PPM Hard Water:* Colorado's severe water mineralization (e.g., 222 PPM in Castle Rock) causes permanent Stage-2 glass degradation if evaporating sprinklers are left unchecked.

## 1.2 The "Digital Twin" Concept

At the core of the Gleam 3.0 architecture is the **Digital Twin**. Rather than relying on human guesswork, subjective customer input, or flat-rate estimating, every property processed by our system generates a highly structured, dynamically updating JSON-based profile.

This Digital Twin acts as the "brain" of the specific property. It is the central data payload that dictates all algorithmic pricing, Multi-Agent dispatch routing, partner cross-selling, and automated retention marketing. It is constructed by aggregating distinct data layers:

* **The Persona & Conversion Twin:** Captures digital identity, UTM attribution parameters, Affirm BNPL propensity, cognitive "satisficing" UI behavior, and computes the 0-100 Lead Score.
* **The Actuarial & Structural Twin:** The deterministic mathematical ground-truth. Pulls Above/Below Grade SqFt (AGSF/BGSF), Year Built, Basement Bedrooms, and Property Type (e.g., Townhome vs. Detached) via real estate APIs to establish a rigid quoting baseline.
* **The Sensory & Chemistry Twin:** Unstructured visual data reconciled via AI and LLM scraping. Captures exact fenestration geometry (pane counts, sliders, French grids), siding material types (Hardie vs. Stucco), window coatings (Low-E), and roof composites.
* **The Environmental & Geospatial Twin:** High-resolution topological data mapping roof pitch (degrees), yard slope/grade (Google Elevation), vegetation density (NDVI), local water hardness (PPM), and solar exposure to calculate physical friction and material degradation over time.
* **The Friction, Hazard & Legal Twin:** Hyper-granular operational variables tracking interior access obstructions, security sensors, and window screen brittleness. Contains automated tripwires for EPA storm drain proximity (NPDES compliance), OSHA fall-protection limits, lead-based paint/asbestos probability, and mandatory scratch-liability waivers.
* **The Relationship & Financial Twin:** The CRM and ledger reality. Tracks NPS sentiment, callback/rework propensity, Gleam-On subscription wallet breakage (ASC 606 compliance), and exact Unit Economics / Effective Hourly Rate (EHR) per job.

By aggregating these layers into a single digital entity, the Make.com "Genius Backend" can mathematically calculate the exact execution time, asymmetric risk, net margin, and ideal schedule block required to service the asset *before* a technician ever turns an ignition key.



# 2. System Topology & N-Tier Architecture


The Gleam 3.0 architecture abandons flat, monolithic structures in favor of a strict **5-Tier DevSecOps Architecture**. This enforces "Defense in Depth" and a rigid "Separation of Concerns." 

Under this topology, the outer layers (user interfaces and ad networks) operate on a **Zero-Trust** basis. They contain no mathematical pricing logic, no direct database access, and no private API keys. Data must sequentially pass through strict security and validation gateways before reaching the computational core or the permanent database ledgers.

## 2.1 Layer 1: The Presentation & Acquisition Edge (Zero-Trust)



This is the outermost perimeter of the architecture. Its sole objective is traffic acquisition and low-friction, progressive data capture. Because this layer exists on third-party networks (Meta, Google) and the public internet, it is inherently untrusted. 

### 2.1.1 The Acquisition Pathways (Ad Strategies)
Traffic enters the Gleam 3.0 ecosystem through three distinct, engineered advertising pathways:
* **Strategy 1: "Click-to-Land" Attribution Engine (Standard Ad Flow)**
  * *Source:* Google Search Ads, Facebook/Instagram Visual Ads.
  * *Flow:* User clicks the ad and is routed to a Domain-Specific Estimator on `getgleaming.com`.
  * *Data Handling:* The URL contains UTM parameters. A Vanilla JS script instantly captures these UTMs and stores them in `sessionStorage`, ensuring attribution is not lost if the user navigates across pages before quoting.
* **Strategy 2: Conversational "Click-to-Message" (In-Ad Quoting)**
  * *Source:* Facebook/Instagram "Click-to-Messenger" Ads, Google Ads "Click-to-Text" Extensions.
  * *Flow:* User clicks the ad, opening their native text app (SMS or Messenger). They text their address directly to the Sona or Tawk.to agent.
  * *Data Handling:* Bypasses the website UI entirely. Dynamic Number Insertion (DNI) captures the campaign attribution, and the user's mobile number or Facebook ID is instantly captured without a form fill.
* **Strategy 3: Native Lead Forms (Progressive Profiling)**
  * *Source:* Facebook/Instagram Native Lead Generation Ads.
  * *Flow:* User clicks the ad, and a native Meta form captures strictly their Address and Email.
  * *Data Handling:* Bypasses Layer 1 UI completely and fires a webhook directly into Layer 2. Make.com calculates the price, generates a "Magic Link" UUID, and sends an automated email with the quote. The user clicks the link to hit Layer 4 (The Booking Hub) to finish progressive profiling.

### 2.1.2 The Intake Interfaces (Data Capture Spokes)
Once traffic is acquired via Strategy 1 or 2, it interacts with these interfaces:
* **1A, 1B, 1C: Domain-Specific Estimators (Window Care, Surface Washing, Homecare)**
  * *Functional:* Pure Vanilla JS user interfaces built into Squarespace. They utilize psychological "Proxy Questions" (e.g., "Do you have French-pane windows?") rather than asking users to execute exact mathematical counts, preventing cognitive overload and data satisficing.
  * *Technical / Security:* Captures only Contact Primitives (Address, Email). Transfers state data to Layer 4 strictly via `sessionStorage` for same-device continuity. **Strictly prohibits passing Personally Identifiable Information (PII) or property data via Base64 URL parameters.**
* **1D: Quo (Sona) Voice & SMS Agent**
  * *Functional:* Answers questions, aggregates ZIP/Address data, and weighs the customer's upsell tolerance (tone + 1% home value budget) to pitch congruent services via SMS or Voice.
  * *Technical / Security:* Connects to Layer 2 via an OpenAPI schema. Prompts are strictly engineered with latency-buffering filler (e.g., *"Let me run that address through our satellite quoting engine..."*) to mask the 4-to-8 second AI visual audit delay occurring in Layer 3.
* **1E: Tawk.to (Apollo) Webchat Agent**
  * *Functional:* Mirrors Sona's logic via text for website visitors and Facebook Messenger users. Collects property data, cross-sells services, and allows for seamless human-agent takeover.
  * *Technical / Security:* Connects via OpenAPI/MCP gateway. Strictly restricted from calculating its own math; relies entirely on Layer 3 for pricing outputs.

## 2.2 Layer 2: The API Gateway & Security Perimeter (The Bouncer)
Before any data from Layer 1 triggers heavy computational APIs, it must pass through this security layer (Make.com Webhook 1).
* **Objective:** Sanitize inputs, prevent API budget exhaustion (DDoS protection), and enforce data constraints.
* **Functional & Technical Guardrails:**
  * *Bot Mitigation:* Evaluates server-side Google reCAPTCHA v3 tokens to block automated bot submissions.
  * *Network Security:* Enforces Cross-Origin Resource Sharing (CORS) policies, accepting web payloads strictly from `getgleaming.com`. Protected by Cloudflare WAF/Rate Limiting to prevent payload queue flooding.
  * *Poka-Yoke Data Clamps:* Hard-clamps manual inputs (e.g., forcing UI SqFt inputs >15,000 down to 15,000 to prevent infinite-loop hyper-scale pricing errors).

## 2.3 Layer 3: The Application Core & Logic Layer (The Genius Backend)
This is the heavily guarded "Brain" of the architecture. It is completely invisible to the public internet. 
* **Objective:** Execute the ETL pipeline, compute the Digital Twin math, and enforce unit economics.
* **Functional & Technical Sequence:** * Orchestrated entirely within Make.com and secure Node.js serverless scripts.
  * Pings proprietary APIs (RentCast, Google Maps, Solar, Elevation) and AI models (Gemini 2.5 Flash, Firecrawl) to build the Actuarial and Sensory Twins.
  * Executes the Cost-Plus margin formulas, applies Variable Time Modifiers (VTMs), and executes the LINEX asymmetric risk reconciliation.
  * **Generates the UUID "Magic Link"** (e.g., `quote_8f72a9b`) and stores the pending payload in a Google Sheet ledger. This UUID is passed back to Layer 1 for asynchronous booking resumption without exposing data in the URL.

## 2.4 Layer 4: The Conversion & Commitment Layer (The Secure Hub)
Users only arrive at this layer once they have been quoted by Layer 3 and have indicated an intent to purchase (e.g., clicking the UUID Magic Link).
* **Central Booking Hub (`/finish-booking` hidden UI):**
  * **Objective:** Maximize ticket size, lock in the scheduling block, and securely capture financial commitment.
  * **Functional:** A Vanilla JS Squarespace page that reads the UUID from the URL parameter and queries Layer 3 to hydrate the UI with the exact quote. 
  * **Technical:** Executes the final user-facing form (collecting First/Last Name, mobile number, and exact appointment time). Injects Stripe checkout modals and Affirm BNPL financing. Triggers the final Layer 5 dispatch webhook.

## 2.5 Layer 5: The Data Persistence & Operational Layer (The Ledgers)
This is the permanent database and operational reality layer. It only accepts structured, validated data from Layer 3/Layer 4. No external web traffic can reach this layer directly.
* **ServiceM8 (Operational Dispatch Ledger):**
  * Flawless job execution routing. Make.com synthesizes the Layer 3 API data to write highly detailed `job_description` notes (e.g., warning technicians of EPA storm drain proximity or OSHA roof pitch hazards). Enforces Idempotency (preventing duplicate customer records).
* **Stripe (Financial Ledger):**
  * Manages the Gleam-On "Maintenance Wallet" (credit banking), processes payments, and tracks deferred subscription liability (ASC 606 compliance). 
* **Admin Control Panel (Unit Economics GUI):**
  * A password-protected backend interface allowing management to update Base Prices, VTMs, and ZIP-code density arrays without editing the raw Make.com codebase.
* **Asynchronous Automation (Retention & QC):**
  * *Abandoned Cart Ledger:* Make.com checks the "Pending Quotes" Google Sheet daily. If a UUID is 24 hours old and unbooked, it triggers automated SMS/Email recovery sequences.
  * *Weather QC:* Make.com monitors OpenWeather APIs post-job; if rain hits the exact coordinates within 5 days, it automatically appends a Rework badge to the ServiceM8 board to fulfill the "5x5 Spot Free Guarantee."

## 2.6 The Gleam Digital Architecture: Comprehensive Site Map
To visualize how Layer 1 routes traffic into Layer 4 and manages operational workflows, the website structure is mapped as follows:

[ROOT: HOME PAGE]
|-- Hero: "Gleam-Gold" Primary CTA (Get Online Estimate)
|-- Trust Bar: LocalBusiness Schema / Compliance Badges (IWCA/PWNA)
|-- Asset Preservation Narrative: "From Cleaning to Structural Preservation"
|
|---- [TIER 1 QUOTING ENGINE: SUB-60 SECOND FLOW]
|     |-- Step 1: Zip Code / Data Binning (SqFt Brackets)
|     |-- Step 2: Instant Ballpark Range (Asynchronous Pricing Logic)
|     |-- Step 3: Tier 2 Detailed/Bind Quote (Contact Capture Lock-in)
|
|---- [RESIDENTIAL SERVICES]
|     |-- Window & Glass Care
|     |   |-- Exterior/Interior Detailing -- /window-cleaning-estimate (Spoke 1A)
|     |   |-- Track Detailing & Screen Repair 
|     |   |-- Window Tint & Film (UV Protection Focus)
|     |-- Exterior Surface Washing /surface-washing-estimate (Spoke 1B)
|     |   |-- Softwashing (Roof & Siding Preservation)
|     |   |-- Pressure Washing (Restoration for Decks/Driveways)
|     |-- Home Care & Maintenance /homecare-maintenance-estimate (Spoke 1C)
|     |   |-- Gutter Cleaning (Water Diversion)
|     |   |-- Solar Panel Efficiency Restore (ROI-Focused)
|     |   |-- Dryer Vent Fire Prevention (Safety-Critical)
|
|---- [COMMERCIAL SERVICES]
|     |-- Storefront Maintenance Programs
|     |-- Multi-Site Management
|     |-- Reliability & First Impression Branding

|---- [THE SECURE CONVERSION HUB - HIDDEN FROM NAV]
|     |-- /finish-booking?quote_id={UUID} (Layer 4 Booking Hub)
|     |-- /admin-portal (Layer 5 Password-Protected Configuration GUI)

|---- [GLEAM-ON MEMBERSHIP](To be added at later phase)
|     |-- The "Credit Wallet" Hub
|     |-- Maintenance Ecosystem (Lawn, Snow, Local Partners)
|     |-- Predictable MRR Enrollment
|
|---- [PARTNER PORTALS](To be added at later phase)
|     |-- Realtor Portal (Listing Linda)
|     |   |-- Listing Prep Verification
|     |   |-- Before/After Documentation
|     |-- Commercial Property Manager Hub
|
|---- [REGIONAL LANDING PAGES (SEO CLUSTERS)]
|     |-- Castle Rock, CO
|     |-- Highlands Ranch, CO
|     |-- Tri-Cities, WA
|
|---- [THE GLEAM GUARANTEE]
|     |-- 100% Satisfaction Policy
|     |-- 5x5 Spot-Free Guarantee
|     |-- Price Lock Transparency
|
|---- [ABOUT & SOCIAL MISSION]
      |-- Inclusive Hiring Model
      |-- Community Equity & Career Paths  (Hiring Model)
	  |-- Privacy Policy (CPA/Consent Mode Compliance)

STRATEGY IMPLEMENTATION

* *STRATEGIC POSITIONING:
   * Pivot from "discretionary luxury" (cleaning) to "essential maintenance" 
     (preservation). Frame UV exposure, wildfire ash, and mineralization as 
     structural threats to home equity.

* *CONVERSION OPTIMIZATION (CRO):
   * Use one color EXCLUSIVELY for conversion buttons.
   * Implement a "Sticky Footer" with a 44x44 pixel "Thumb Zone" CTA for mobile.
   * Utilize "Progressive Disclosure" to prevent cognitive overload.

* *QUOTING LOGIC:
   * Employ "Data Binning" for square footage to minimize user friction.
   * Gate the "Binding Quote" behind contact capture (Psychology of Sunk Cost).

* *RETENTION & LTV:
   * Transition customers to the "Gleam-On" ecosystem using a credit-wallet 
     concept to increase Lifetime Value and brand stickiness.

* *TECHNICAL FORTIFICATION:
   * Implement FAQPage and LocalBusiness Schema to optimize for AEO 
     (AI Answer Engines like Gemini/Perplexity) and the "Zero-Click" era.
   * Hyper-local landing pages to dominate specific regional search volumes.

# 3. Repository Structure, Environments & APIs

The Gleam 3.0 codebase is structurally segmented to enforce the 5-Tier DevSecOps Architecture. The system strictly separates client-side rendering repositories from server-side computational logic and cloud-based orchestration environments.



## 3.1 Environments & Codebase Directory Structure

To maintain lightweight frontend widget injection into Squarespace and secure backend execution, the architecture spans three primary environments: The Frontend Repository, the Node.js Prototyping Sandbox, and the Make.com Production Cloud.

### 1. The Frontend Repository (Layer 1 & Layer 4 UIs)
Hosted on GitHub and injected into Squarespace. Strictly modularized to prevent UI breakage and optimize load times (no React/Babel dependencies).
* **`/estimator_widget/` (Layer 1 - The Intake Spoke)**
  * `index.html`: The structural DOM shell (contains no math or state).
  * `js/api-client.js`: Handles Google reCAPTCHA v3 token generation and the secure `fetch()` handoff to Layer 2 (Make.com).
  * `js/state-manager.js`: Manages UI state, "Proxy Question" logic, and UTM persistence via `sessionStorage`.
  * `js/ui-components.js`: Handles DOM manipulation, input clamping, and interactive slider rendering.
* **`/booking_hub_widget/` (Layer 4 - The Conversion Hub)**
  * `index.html`: The hidden `/finish-booking` checkout and scheduling interface.
  * `js/api-client.js`: Triggers the Make.com data retrieval webhook using the UUID.
  * `js/state-manager.js`: Parses the URL to extract the `quote_id` UUID and hydrates the local state.
  * `js/ui-components.js`: Renders the final UI, Stripe Elements checkout modal, and ServiceM8 scheduling block selector.

### 2. The Server-Side Prototyping Sandbox (Layer 3 Dev)
The secure local environment used for developing, testing, and version-controlling complex backend algorithms before mapping them into Make.com visual scenarios.
* **`/backend_services/`**
  * `analyzeProperty.js`: The core script chaining RentCast actuarial data with the Gemini 2.5 Flash Vision audit and LINEX asymmetric math.
  * `fetchPropertyData.js`: Helper functions for geospatial processing (Google Elevation/Solar).
  * `package.json`: Manages server-side dependencies (e.g., `@google/genai`, `axios`).
* **Root Configuration Files:**
  * `.env`: The local environment variables file storing all private server-side API keys.
  * `.gitignore`: Strictly configured to ensure `.env` and `node_modules` are never committed to the public repository.
  * `project-context.md`: This master architectural blueprint.

### 3. The Production Cloud Orchestrator (Layer 3 Live)
* **Make.com Workspace:** Acts as the central ETL (Extract, Transform, Load) middleware. Hosts all webhook endpoints, executes the 5-Module microservice pipeline, and holds the encrypted credentials for all third-party APIs.

## 3.2 Active APIs & Integrations Matrix

The Gleam 3.0 "Genius Backend" acts as a central nervous system, connecting multiple enterprise-grade APIs to execute the Digital Twin computations, Multi-Agent routing, and financial ledgers.

**1. The Actuarial & Environmental Twin APIs:**
* **RentCast API:** Extracts deterministic DNA (Year Built, AGSF, BGSF, Basement Beds, Property Type, Tenure).
* **Google Solar API:** Extracts roof geometry (`maxArrayAreaMeters2`), pitch degrees, and UV exposure thresholds.
* **Google Elevation API:** Calculates yard slope gradients (%) for ladder hazard routing.
* **US Census ACS & Esri Tapestry APIs:** Fetches Median Household Income and demographic segmentation (via ZIP) to inform cross-sell logic and ad copy tone.

**2. The Sensory & Chemistry Twin APIs:**
* **Google Gemini (2.5 Flash):** Executes the Quad-View visual fenestration audit, material hazard detection, and powerline/drop proximity checks.
* **Firecrawl (LLM Scraper):** Scrapes Zillow and Realtor.com MLS listings to extract siding material (Hardie vs. Vinyl) and window coatings (Low-E/Cardinal i89).
* **SiteRecon / Civils.ai (Computer Vision):** Extracts Turf Area (SqFt) and Boundary Fencing (Linear Ft) for instant partner-ecosystem cross-sell quoting.

**3. Social Sentiment & Commercial Compliance APIs:**
* **Apify Scrapers:** Monitors Nextdoor and local Facebook groups for hyper-local micro-weather events (ash/hail) and HOA compliance drives.
* **HigherGov / OSHA Public Database:** Queries contractor safety records and prevailing wage/union requirements for commercial multi-site bids.
* **Waze / Google Traffic API:** Determines storefront pedestrian/traffic volume to trigger mandatory "After-Hours" service multipliers for commercial jobs.

**4. Conversational Edge APIs (Layer 1/2):**
* **Sona (Quo):** Inbound/Outbound voice and SMS agent.
* **Apollo (Tawk.to):** Real-time webchat and Facebook Messenger agent.

**5. Operational & Financial Ledger APIs (Layer 5):**
* **ServiceM8 REST API:** The operational CRM. Manages `Company`, `CompanyContact`, `Job`, `Job Material` creation, and asynchronous Weather QC workflows (via OpenWeather API).
* **Stripe API:** Processes payments, manages Gleam-On subscriptions, and tracks ASC 606 wallet breakage liability.
* **Affirm API:** Provides Point-of-Sale (BNPL) financing data.

**6. Marketing Telemetry APIs:**
* **Meta Conversions API (CAPI):** Server-side POST requests sending SHA-256 hashed customer data for ad attribution.
* **Google Analytics 4 (GA4) Measurement Protocol:** Server-side event tracking.
* **Google Ads API:** Server-side Enhanced Conversions tracking using developer tokens.

## 3.3 API Security & Secrets Management (DevSecOps Rules)



To prevent catastrophic data breaches, unauthorized API billing exhaustion (DDoS), and Cross-Site Scripting (XSS), the following credential management rules are strictly enforced. **They must not be violated by any human developer or AI agent contributing to this codebase.**

**1. The "Public/Frontend" Allowed Keys (Layer 1):**
Only three specific keys are legally allowed to be present in the frontend Vanilla JS code (`/estimator_widget/` and `/booking_hub_widget/`):
* `Google reCAPTCHA v3 Site Key` (Public token generator).
* `Google Tag Manager (GTM) Container ID`.
* `Google Places Autocomplete API Key` **(CRITICAL: This key must be strictly HTTP Referer-restricted within the Google Cloud Console to accept requests ONLY from `*.getgleaming.com/*` to prevent quota theft).**

**2. The "Private/Backend" Hidden Secrets (Layers 2-5):**
Absolutely **NO** other API keys, bearer tokens, or database credentials may ever touch the frontend code. This includes:
* Make.com Webhook URLs (which contain routing identifiers).
* RentCast, Gemini, OpenAI, Firecrawl, or Esri API keys.
* ServiceM8 OAuth tokens, Stripe Secret Keys, Google Ads Developer Tokens, or Meta CAPI access tokens.
* *Implementation Rule:* All private keys live exclusively inside encrypted Make.com connection modules or the server-side `.env` file for Node.js prototyping.

**3. Webhook Security & The Data Handoff:**
When the frontend (`api-client.js`) hands data to Layer 2 (Make.com), it must do so securely:
* The `fetch()` request must include the payload, the client-generated reCAPTCHA token, and a basic `x-gleam-auth` custom header.
* *Note:* The `x-gleam-auth` header is visible to anyone inspecting the network payload and serves only as a rudimentary filter for basic web crawlers. The true DevSecOps barrier is the **server-side validation of the reCAPTCHA token** within the first module of the Make.com scenario. Make.com must drop the payload immediately if the reCAPTCHA score is below `0.5`.

**4. PII Hashing & State Transfer (No Base64 URLs):**
* **Inbound Transfer:** Under no circumstances should user names, exact addresses, phone numbers, or property actuarial data be passed via URL parameters (e.g., `?address=123+Main`). Data transfer between pages must rely on `sessionStorage` or the backend-generated, non-identifiable UUID (`?quote_id=quote_8f72a9b`).
* **Outbound Telemetry:** When Make.com pushes conversion data to Meta CAPI or Google Ads API, all customer PII (Email, Phone) must be one-way hashed using **SHA-256** before the payload leaves the Layer 3 environment.

# 3. Repository Structure, Environments & APIs

The Gleam 3.0 codebase is structurally segmented to enforce the 5-Tier DevSecOps Architecture. The system strictly separates client-side rendering repositories from server-side computational logic and cloud-based orchestration environments.



## 3.1 Environments & Codebase Directory Structure

To maintain lightweight frontend widget injection into Squarespace and secure backend execution, the architecture spans three primary environments: The Frontend Repository, the Node.js Prototyping Sandbox, and the Make.com Production Cloud.

### 1. The Frontend Repository (Layer 1 & Layer 4 UIs)
Hosted on GitHub and injected into Squarespace via custom code blocks. Strictly modularized to prevent UI breakage and optimize load times (Zero React/Babel dependencies).
* **`/estimator_widget/` (Layer 1 - The Intake Spokes)**
  * `index.html`: The structural DOM shell (contains no math or state).
  * `js/api-client.js`: Handles Google reCAPTCHA v3 token generation and the secure `fetch()` POST handoff to **Make.com Webhook M1.1**.
  * `js/state-manager.js`: Manages UI state, "Proxy Question" logic, and UTM persistence via `sessionStorage`.
  * `js/ui-components.js`: Handles DOM manipulation, input clamping, and interactive slider rendering.
* **`/booking_hub_widget/` (Layer 4 - The Secure Conversion Hub)**
  * `index.html`: The hidden `/finish-booking` checkout and scheduling interface.
  * `js/api-client.js`: Triggers **Make.com Webhook M4.2** to securely fetch the calculated quote using the UUID.
  * `js/state-manager.js`: Parses the URL to extract the `quote_id` UUID and hydrates the local state.
  * `js/ui-components.js`: Renders the final UI, Stripe Elements checkout modal, and ServiceM8 scheduling block selector.

### 2. The Server-Side Prototyping Sandbox (Layer 3 Dev)
The secure local environment used for developing, testing, and version-controlling complex backend algorithms before mapping them into Make.com visual scenarios.
* **`/backend_services/`**
  * `analyzeProperty.js`: The core script chaining RentCast actuarial data with the Gemini 2.5 Flash Vision audit and LINEX asymmetric math.
  * `fetchPropertyData.js`: Helper functions for geospatial processing (Google Elevation/Solar).
  * `package.json`: Manages server-side dependencies (e.g., `@google/genai`, `axios`).
* **Root Configuration Files:**
  * `.env`: The local environment variables file storing all private server-side API keys.
  * `.gitignore`: Strictly configured to ensure `.env` and `node_modules` are never committed to the public repository.
  * `project-context.md`: This master architectural blueprint.

### 3. The Production Cloud Orchestrator (Layer 3 & 5 Live)
* **Make.com Workspace:** Acts as the central ETL (Extract, Transform, Load) middleware. Hosts all webhook endpoints, executes the 5-Module microservice pipeline, and holds the encrypted credentials for all third-party APIs.
* **Make.com Data Stores (Layer 5 Admin Base):** Acts as the backend database for the Admin Control Panel. Stores the mutable JSON arrays for Base Pricing, VTM multipliers, and ZIP-code density arrays.

## 3.2 Active APIs & Integrations Matrix

The Gleam 3.0 "Genius Backend" acts as a central nervous system, connecting multiple enterprise-grade APIs to execute the Digital Twin computations, Multi-Agent routing, and financial ledgers.

**1. The Actuarial & Environmental Twin APIs:**
* **RentCast API:** Extracts deterministic DNA (Year Built, AGSF, BGSF, Basement Beds, Property Type, Tenure).
* **Google Solar API:** Extracts roof geometry (`maxArrayAreaMeters2`), pitch degrees, and UV exposure thresholds.
* **Google Elevation API:** Calculates yard slope gradients (%) for ladder hazard routing.
* **US Census ACS & Esri Tapestry APIs:** Fetches Median Household Income and demographic segmentation (via ZIP) to inform cross-sell logic and ad copy tone.

**2. The Sensory & Chemistry Twin APIs:**
* **Google Gemini (2.5 Flash):** Executes the Quad-View visual fenestration audit, material hazard detection, and powerline/drop proximity checks.
* **Firecrawl (LLM Scraper):** Scrapes Zillow and Realtor.com MLS listings to extract siding material (Hardie vs. Vinyl) and window coatings (Low-E/Cardinal i89).
* **SiteRecon / Civils.ai (Computer Vision):** Extracts Turf Area (SqFt) and Boundary Fencing (Linear Ft) for instant partner-ecosystem cross-sell quoting.

**3. Social Sentiment & Commercial Compliance APIs:**
* **Apify Scrapers:** Monitors Nextdoor and local Facebook groups for hyper-local micro-weather events (ash/hail) and HOA compliance drives.
* **HigherGov / OSHA Public Database:** Queries contractor safety records and prevailing wage/union requirements for commercial multi-site bids.
* **Waze / Google Traffic API:** Determines storefront pedestrian/traffic volume to trigger mandatory "After-Hours" service multipliers for commercial jobs.

**4. Conversational Edge APIs (Layer 1/2):**
* **Sona (Quo):** Inbound/Outbound voice and SMS agent. Connects via OpenAPI to Make.com Webhook M1.2.
* **Apollo (Tawk.to):** Real-time webchat and Facebook Messenger agent. Connects via OpenAPI to Make.com Webhook M1.3.

**5. Operational & Financial Ledger APIs (Layer 5):**
* **ServiceM8 REST API:** The operational CRM. Manages `Company`, `CompanyContact`, `Job`, `Job Material` creation, and asynchronous Weather QC workflows.
* **OpenWeather API:** Monitored asynchronously post-job to trigger the "5x5 Spot Free Guarantee" rework routing if rain occurs.
* **Stripe API:** Processes payments, manages Gleam-On subscriptions, and tracks ASC 606 wallet breakage liability.
* **Affirm API:** Provides Point-of-Sale (BNPL) financing data.

**6. Marketing Telemetry APIs:**
* **Meta Conversions API (CAPI):** Server-side POST requests sending SHA-256 hashed customer data for ad attribution.
* **Google Analytics 4 (GA4) Measurement Protocol:** Server-side event tracking.
* **Google Ads API:** Server-side Enhanced Conversions tracking using developer tokens.

## 3.3 API Security & Secrets Management (DevSecOps Rules)



To prevent catastrophic data breaches, unauthorized API billing exhaustion (DDoS), and Cross-Site Scripting (XSS), the following credential management rules are strictly enforced. **They must not be violated by any human developer or AI agent contributing to this codebase.**

**1. The "Public/Frontend" Allowed Keys (Layer 1 & 4):**
Only the following specific keys and scripts are legally allowed to be present in the frontend Vanilla JS code (`/estimator_widget/` and `/booking_hub_widget/`):
* `Google reCAPTCHA v3 Site Key` (Public token generator).
* `Google Tag Manager (GTM) Container ID`.
* `Consent Management Platform (CMP) Script` (Required for Google Consent Mode v2 / CPA compliance).
* `Dynamic Number Insertion (DNI) Script` (For Sona ad attribution).
* `Google Places Autocomplete API Key` **(CRITICAL: This key must be strictly HTTP Referer-restricted within the Google Cloud Console to accept requests ONLY from `*.getgleaming.com/*` to prevent quota theft).**

**2. The "Private/Backend" Hidden Secrets (Layers 2-5):**
Absolutely **NO** other API keys, bearer tokens, or database credentials may ever touch the frontend code. This includes:
* Make.com Webhook URLs (which contain routing identifiers).
* RentCast, Gemini, OpenAI, Firecrawl, or Esri API keys.
* ServiceM8 OAuth tokens, Stripe Secret Keys, Google Ads Developer Tokens, or Meta CAPI access tokens.
* *Implementation Rule:* All private keys live exclusively inside encrypted Make.com connection modules or the server-side `.env` file for Node.js prototyping.

**3. Webhook Security & The Data Handoff:**
When the frontend (`api-client.js`) hands data to Layer 2 (Make.com), it must do so securely:
* The `fetch()` request must include the payload, the client-generated reCAPTCHA token, and a basic `x-gleam-auth` custom header.
* *Note:* The `x-gleam-auth` header is visible to anyone inspecting the network payload and serves only as a rudimentary filter for basic web crawlers. The true DevSecOps barrier is the **server-side validation of the reCAPTCHA token** within the first module of the Make.com scenario. Make.com must drop the payload immediately if the reCAPTCHA score is below `0.5`.

**4. PII Hashing & State Transfer (No Base64 URLs):**
* **Inbound Transfer:** Under no circumstances should user names, exact addresses, phone numbers, or property actuarial data be passed via URL parameters (e.g., `?address=123+Main`). Data transfer between pages must rely on `sessionStorage` or the backend-generated, non-identifiable UUID (`?quote_id=quote_8f72a9b`).
* **Outbound Telemetry:** When Make.com pushes conversion data to Meta CAPI or Google Ads API, all customer PII (Email, Phone) must be one-way hashed using **SHA-256** before the payload leaves the Layer 3 environment.

# 5. CRM (ServiceM8) & Operational Constraints

ServiceM8 operates strictly as the Layer 5 Data Persistence and Operational Ledger. Because it drives physical dispatch, schedule blocks, and field technician safety, the Make.com integration (Module 5) must adhere to rigid relational database rules. **Violating these constraints will result in orphaned database records, deleted safety warnings, and corrupted financial reporting.**

## 5.1 Relational Database Hierarchy & Idempotency

Make.com must never blindly push a payload into ServiceM8. To prevent duplicate customer records and ensure the property is permanently linked to the human paying the bill, the following sequential REST API calls must be executed:

1. **The Idempotency Check (Search):**
   * Before creating a new record, Make.com must perform a `GET /api_1.0/client.json?$filter=email eq '{{email}}'` (or equivalent mobile phone match). 
   * *Logic:* If a record exists, retrieve the existing `company_uuid` and proceed to Job creation. If no record exists, proceed to Step 2.
2. **Create the Entity (`Company`):**
   * Execute a `POST` request to create the `Company`. In Gleam 3.0 B2C logic, the "Company" represents the physical property/household.
   * Retrieve the generated `company_uuid`.
3. **Create the Human (`CompanyContact`):**
   * Execute a `POST` request to create the `CompanyContact` (First Name, Last Name, Mobile, Email). 
   * **CRITICAL:** You must explicitly pass the `company_uuid` in this JSON payload to permanently link the human to the property. Failure to do so creates an "Orphan Contact."
4. **Create the Entity (`Job`):**
   * Execute a `POST` request to create the Job, explicitly linking it to the `company_uuid`.

## 5.2 Badge Array Appending (Critical Safety Rule)

In ServiceM8, Badges dictate life-safety protocols (e.g., "Elevated Work", "Electrical Hazard") and legal compliance (e.g., "Waiver Required"). 

**The Overwrite Vulnerability:** The ServiceM8 API handles Badges as an array of UUID strings. If Make.com sends a `POST` or `PUT` request containing only a single new Badge UUID, **ServiceM8 will overwrite and permanently delete every existing safety badge on that job.**

**The DevSecOps Standard for Badge Injection:**
To add a new badge to an existing job (e.g., appending a "Rework" badge after a weather event), Make.com must:
1. `GET` the current Job payload via the Job UUID.
2. Extract the existing `badges` array.
3. Append the new Badge UUID to that array within Make.com's working memory.
4. `POST` the entire, combined array back to the ServiceM8 API to safely update the record without data loss.

## 5.3 Custom Field Budgets & Reporting Taxonomy

ServiceM8 enforces a hard limit of **10 Custom Fields per job**. To prevent hitting this ceiling and breaking the API mapping, Gleam 3.0 utilizes a strict taxonomy for how data is classified.

* **Categories (The Physical Work):** * *Purpose:* Defines the actual labor being performed for strict revenue reporting.
  * *Examples:* `Window Care`, `Surface Washing`, `Gutter Maintenance`. 
  * *Override Rule:* `IF (category_count >= 2) THEN Category = "Bundle Package"`. This mathematically overrides individual service categories to track the specific operational ROI of bundled sales.
* **Custom Fields (The Market Segments):**
  * *Purpose:* Used strictly for marketing analytics, lead scoring, and subscription routing.
  * *Examples:* `customfield_lead_source` (e.g., Facebook Ads), `customfield_quote_type` (e.g., Instant vs. ONSITE), `customfield_gleamon_plan`.
* **Badges (The Operational Statuses):**
  * *Purpose:* Used for visual dispatch board flags, technician safety, and VIP identification.
  * *Examples:* `Waiver Required`, `RO/DI Pure Water Required`, `5x5 Guarantee Invoked`, `VIP Client`.

## 5.4 Job Material & SKU Validation Logic

When Make.com maps the Layer 3 Cost-Plus pricing output into ServiceM8 `Job Materials` (Line Items), it must perfectly respect ServiceM8's internal accounting validation.

* **The Validation Constraint:** ServiceM8 servers independently calculate `quantity * unit_price`. If the payload passed by Make.com contains a `displayed_amount` (Total Price) that does not perfectly match the server's internal math, the API will reject the payload with a `[400] Provided displayed_amount is incorrect` error.
* **The Implementation Rule:** Make.com must pass the exact `quantity` and `unit_price`, and allow ServiceM8 to calculate the total. Do not attempt to force rounded numbers or mismatched tax-inclusive totals that break the `qty * price` logic.

## 5.5 Asynchronous Webhook Triggers (Post-Job)

ServiceM8 is not just a receiver of data; it is an active trigger for Layer 6 (Asynchronous Ledgers). 
* **Job Completion Trigger:** When a technician marks a job "Completed" in the field, ServiceM8 fires a webhook to Make.com.
* **Make.com Action:** Make.com captures the property coordinates, checks the OpenWeather API for rain over the next 5 days, pushes the final invoice total to Meta CAPI/GA4 for marketing attribution, and checks Stripe to deduct Gleam-On credits if applicable.


# 6. Hard-Coded Compliance & Safety Gates



To protect the business from federal fines, technician injury, and structural damage liability, Layer 3 (The Application Core) is programmed with strict, autonomous safety tripwires. 

When the Digital Twin (Actuarial or Sensory) detects a violation of these thresholds, the system executes the **"ONSITE Pivot."** This logic immediately suppresses the bindable automated quote, overrides the standard $125 job minimum, and routes the customer to schedule a $60 physical safety inspection.

## 6.1 Environmental & OSHA Escapes (The "ONSITE" Pivot)

The Make.com computational pipeline must evaluate the following geospatial and visual data points before generating a final price:

* **OSHA 1926.501 (Fall Protection) & 1910 (Ladder Mechanics):**
  * *Data Source:* Google Solar API (`pitchDegrees`), Google Elevation API (Topography/Slope percentage), and Gemini 2.5 Flash Vision (Stories count).
  * *Triggers:* * Roof pitch exceeds **6:12 (26.5 degrees)**.
    * Structure exceeds **3 stories** (approx. 30-36 feet eave height).
    * Terrain slope/grade surrounding the property exceeds **10%** (violating safe Werner ladder 75.5-degree placement rules).
  * *Action:* Suppress instant quote. Trigger ONSITE pivot to evaluate the need for a boom lift or specialized fall-arrest roof anchoring.

* **EPA NPDES (Stormwater Runoff & Wastewater):**
  * *Data Source:* Google Maps Satellite and Gemini 2.5 Flash Vision.
  * *Triggers:* Hardscaping (driveways, commercial sidewalks) slopes directly into municipal storm drains within a 50-foot radius.
  * *Action:* If the requested service includes chemical Softwashing (e.g., Sodium Hypochlorite) or heavy particulate pressure washing, trigger the ONSITE pivot. A technician must physically verify if water reclamation berms and sump-pumps are required to prevent federal Clean Water Act violations.

## 6.2 Trade-Specific Compliance & Legal Liability

Certain ancillary services and historical property profiles carry hidden liabilities that must override standard quoting logic.

* **Material Degradation (Lead Paint & Asbestos):**
  * *Data Source:* RentCast API (`YearBuilt`) and Firecrawl (Siding material).
  * *Triggers:* Property built prior to **1980**.
  * *Action:* The system strictly locks out all high-pressure washing SKUs to prevent atomizing lead-based paint or asbestos siding. It permanently restricts the available services for that UUID to "Low-Pressure Softwash" or "Pure Water Glass Care" only, and flags the requirement for EPA Lead-Safe certified protocols.

* **NFPA 211 / IRC (Dryer Vent Fire Safety):**
  * *Data Source:* Proxy Questions (Layer 1 UI) or historical ServiceM8 technician notes.
  * *Triggers:* Total equivalent vent run length exceeds **35 feet** (accounting for a 5-foot penalty per 90-degree elbow).
  * *Action:* System triggers a "Fire Hazard" flag. If the duct cannot be cleaned within code limits, the system pivots to quote an HVAC duct-rerouting partner service.

* **Electrical Safety (GFCI for Holiday Lighting):**
  * *Data Source:* Proxy Questions (Layer 1 UI) and Gemini 2.5 Flash Vision (Exterior outlet visibility).
  * *Triggers:* Unverified exterior GFCI (Ground Fault Circuit Interrupter) receptacles or proximity to uninsulated carbon utility drops.
  * *Action:* Installation quotes for Trimlight or seasonal lighting are suppressed. Triggers ONSITE pivot to verify electrical load capacities and GFCI compliance before binding the contract.

## 6.3 The Make.com "ONSITE" Routing Logic (Payload Transformation)

When any of the above safety gates are triggered, Make.com (Module 4 & Module 5) must execute the following exact JSON payload adjustments before communicating with Layer 4 (The UI) or Layer 5 (ServiceM8):

1. **Price Suppression:** Clear the calculated $125+ service price from the active memory.
2. **SKU Replacement:** Swap the originally requested service SKU (e.g., `RES-WIN-EXT`) for the `ASSESS-ONSITE` SKU.
3. **Price Override & Validation:** To respect ServiceM8's internal accounting validation, set the payload to `quantity: 1` and `unit_price: 60.00` to yield a flawless `displayed_amount` of $60.00.
4. **Badge Array Appending:** Make.com must safely `GET` the current job, append the corresponding hazard badge UUID (e.g., `OSHA Fall Risk`, `EPA Runoff Risk`, `Pre-1980 Lead Risk`) to the existing `badges` array, and `POST` it back (respecting the overwrite vulnerability rule from Section 5.2).
5. **UI Notification (The Handoff):** The JSON payload sent back to Layer 4 (Booking Hub) must include a specific boolean flag: `"onsite_required": true`. This commands the Vanilla JS frontend to hide the standard pricing UI and display the hazard-specific messaging (e.g., *"Due to the steep pitch of your roof, we need to do a quick $60 safety assessment before cleaning..."*).


# 7. DevSecOps & Marketing Analytics Standards

To protect the system from data breaches, ensure legal privacy compliance (CPA), and guarantee mathematically accurate Return on Ad Spend (ROAS) for franchise scaling, the architecture must strictly enforce the following security and tracking protocols.

## 7.1 Webhook Security & DDoS Mitigation

The handoff between Layer 1 (The Frontend) and Layer 2 (The Bouncer/API Gateway) is the most vulnerable point in the architecture. It must be locked down using multiple sequential perimeters:

* **Webhook CORS & Headers:** The Make.com webhook must strictly enforce Cross-Origin Resource Sharing (CORS) policies, accepting requests ONLY from `*.getgleaming.com`. A custom validation header (e.g., `x-gleam-auth`) must be required to drop unauthorized direct-POST attacks instantly.
* **reCAPTCHA v3 Server-Side Validation:** The custom header is only a rudimentary filter. The true DevSecOps barrier is Google reCAPTCHA v3. The frontend must generate a token, pass it in the JSON payload, and Module 1 in Make.com must validate it server-side with Google. If the score is `< 0.5`, Make.com drops the payload before triggering any compute-heavy, paid APIs.
* **Network Rate Limiting:** To prevent API billing exhaustion, the Make.com endpoints should be protected by Cloudflare WAF (Web Application Firewall) rate-limiting rules to drop excess simultaneous payloads from malicious IP addresses.

## 7.2 Data State Transfer & Latency Fallbacks

* **Strict State Transfer Security (No Base64):** The frontend must strictly use `sessionStorage` for cross-widget state handoff on the same device. **NEVER pass Personally Identifiable Information (PII) or property actuarial data via Base64 URL parameters.** For cross-device or asynchronous state resumption, rely exclusively on the backend-generated, non-identifiable UUID (e.g., `?quote_id=quote_8f72a9b`).
* **Latency Fallbacks:** Make.com routing must include strict timeout error handlers. If the Gemini 2.5 Flash Vision API takes >8 seconds to process an image, Make.com must immediately bypass the visual audit and return the deterministic Actuarial Math baseline to prevent Layer 1 UI timeout failures.

## 7.3 Marketing Analytics, CAPI & Dual-Tracking



To bypass ad-blockers (like iOS App Tracking Transparency) and calculate true ROAS, the system utilizes a Dual-Tracking Deduplication architecture.

* **UTM Persistence:** The Squarespace global header must run a Vanilla JS script to instantly capture URL UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`) and store them in `sessionStorage`. This ensures attribution is not lost if the user navigates across multiple service pages before requesting a quote.
* **Dual-Tracking Deduplication:** * *Client-Side (GTM):* Behavioral events (e.g., `Start_Form`, `View_Services`) are tracked via Google Tag Manager and browser pixels.
  * *Server-Side (Make.com):* High-value, authoritative events (e.g., `Job_Booked`, `Invoice_Paid`) are pushed server-side from Layer 3 to the Meta Conversions API (CAPI) and GA4 Measurement Protocol.
  * *The Deduplication Key:* Both streams MUST share a dynamically generated, unique `event_id` to allow Meta/Google to deduplicate the signals, preventing the double-counting of revenue.
* **Google Ads Enhanced Conversions & PII Hashing:** For maximum offline attribution, Make.com must one-way hash (SHA-256 algorithm) the customer's email and phone number before pushing the `Job_Booked` event to the Google Ads API. Raw PII must never be transmitted to analytics endpoints.

## 7.4 Omnichannel Attribution & Privacy Compliance

To prevent "Dark Traffic" (traffic where the source is unknown, skewing organic vs. paid metrics) and ensure legal compliance, strict rules apply to all edge assets.

* **Local SEO "Dark Traffic" Prevention:** All website links originating from the Google Business Profile (GBP) must be hardcoded with strict UTMs (e.g., `?utm_source=google&utm_medium=organic&utm_campaign=gbp_listing`). This isolates local map-pack SEO traffic from standard organic Direct traffic.
* **Voice Attribution via DNI:** Sona's (Spoke 2) phone operations must be fronted by a Dynamic Number Insertion (DNI) script via GTM. This swaps the displayed phone number based on the UTM source, capturing the digital attribution of inbound callers before forwarding them to the Sona AI agent.
* **Privacy Compliance (CPA/Consent Mode v2):** GTM must be integrated with a compliant Consent Management Platform (CMP). Google Consent Mode v2 must be active. If a Colorado user denies tracking cookies, the system must use "cookieless pings" to allow Google to model the conversions without violating the Colorado Privacy Act.

## 7.5 Franchise Readiness (Multi-Tenant Routing)

To ensure the architecture can scale beyond a single location without requiring a complete codebase rewrite, the backend must be engineered for multi-tenancy.

* **No Hardcoded Root Credentials:** Make.com backend logic should never hardcode ServiceM8 OAuth tokens, Stripe Secret Keys, or Meta CAPI pixels at the root level of the scenario.
* **ZIP-Code Based Credential Mapping:** The logic must be structured so that the incoming `ZIP_Code` payload queries a Layer 5 Data Store (the Admin Mapping Database) to retrieve the territory-specific API credentials, Stripe accounts, and Ad-Account routing parameters before executing the downstream webhooks.

## 7.6 Poka-Yoke UI Constraints (Frontend Mistake-Proofing)

The frontend UI must be designed so that it is physically impossible for the user to submit data that could crash the backend mathematical models.

* **Input Clamping:** Hard-clamp manual numerical inputs in Vanilla JS. For example, if a user attempts to type "50000" for Square Footage, the UI component must instantly clamp the `sessionStorage` value down to `15000` (the maximum supported scale) before allowing API submission.
* **No Density Proxies in UI:** The frontend MUST NEVER ask the user to input exact window counts or evaluate complex architectural density. That is strictly reserved for the Make.com AI backend. The UI must rely entirely on binary or multiple-choice proxy questions (e.g., "Do you have storm doors? Yes/No").


# 8. The Microservices Architecture (The ETL Pipeline)



To ensure enterprise scalability, error isolation, and idempotency, the "Genius Backend" (Layer 3 & 5) is divided into 5 discrete microservices (modules), plus an asynchronous financial ledger. 

Data flows sequentially through this Extract, Transform, Load (ETL) pipeline via internal HTTP requests. **The Dead Letter Queue (DLQ) Rule:** If a payload fails at any module (e.g., a `500 Internal Server Error` from the RentCast API), the Make.com error handler must instantly route the payload to a "DLQ" Google Sheet and send a Slack alert to the Admin, preventing the entire architecture from crashing.

## 8.1 Module 1: The Ingestion & Validation Gateway (The Bouncer)

**DevOps Function:** Data sanitization, rate-limiting, and error-proofing (Poka-Yoke). This module receives the initial JSON payload from the Layer 1 Edge Spokes, validates the user's intent, and evaluates the cognitive reliability of the data *before* passing it to the heavy-compute APIs.

**A. Trigger & Handoff Routing**
* **Trigger:** Webhooks from Squarespace Estimators (M1.1), Sona SMS (M1.2), or Tawk.to (M1.3).
* **Destination Handoff:** Executes a secure internal `HTTP POST` passing the sanitized JSON to Module 2.

**B. Logic Gates & Guardrails**
* **Webhook Security Validation:** `IF (x-gleam-auth != Valid OR reCAPTCHA_Score < 0.5) THEN DROP_PAYLOAD`.
* **Satisficing Decay Threshold:** If task difficulty exceeds motivation, users guess. 
  * *Logic:* `IF (Time_on_Slider < 2s AND Input_Value > 30) THEN Flag = "Low_Confidence_Satisficed"`. This flags the system to ignore the user's input and rely entirely on the Bayesian baseline in Module 2.
* **Poka-Yoke Data Clamping:** `IF (SqFt_Input > 15000) THEN SqFt = 15000`.

## 8.2 Module 2: The Actuarial & Environmental ETL (The Deterministic Twin)

**DevOps Function:** The deterministic data aggregation layer. This module pings structured public and proprietary APIs to build a mathematical baseline of the property and its environment *before* AI vision is introduced.

**A. Trigger & Handoff Routing**
* **Trigger:** Internal Webhook receiving the Module 1 payload.
* **Destination Handoff:** Executes an `HTTP POST` passing the combined Primitives + Actuarial JSON to Module 3.

**B. Formulas & Mathematical Priors**
* **Data Extracted:** `AGSF`, `BGSF`, `YearBuilt`, `PropertyType`, `pitchDegrees`, `Elevation_Meters`, `Median_Household_Income`, `Base_UV_Index`.
* **Standard Pane Baseline Calculation:** $P_{Standard} = (AGSF / 100) \times \rho_{Bayesian} \times \phi_{Bayesian}$
* **Hyper-Scale Logarithmic Decay:** `IF (AGSF > 4500) THEN`: 
  $P_{Standard} = 55 + (\log_{10}(AGSF - 4400) \times 15)$
* **Architectural Multipliers:** * `IF (YearBuilt < 1980) THEN` $P_{Standard} = P_{Standard} \times 1.40$ (Historic French Grid Adder).
  * `IF (PropertyType == "Townhome") THEN` $P_{Standard} = P_{Standard} \times 0.65$ (Shared Wall Dampener).

## 8.3 Module 3: AI Vision, Scraping & Physics (The Sensory Twin)

**DevOps Function:** The unstructured data engine. Pulls visual feeds and applies ML architectures (Gemini 2.5 Flash, Firecrawl) to reconcile the Module 2 math against the physical reality of the property, outputting precise continuous friction multipliers (VTMs).

**A. Trigger & Handoff Routing**
* **Trigger:** Internal Webhook receiving the Module 2 payload.
* **Destination Handoff:** Executes an `HTTP POST` passing the fully reconciled Digital Twin JSON to Module 4.

**B. ML Architectures & Advanced Formulas**
* **Data Extracted:** Exact pane geometries, `Siding_Material`, `Window_Coatings`, `Turf_SqFt_Area`, `Has_Storm_Door`.
* **LINEX Asymmetric Risk Reconciliation:** Compares Actuarial Math ($P_{Base}$) to AI Vision Math ($P_{AI}$). If AI undercounts, the function mathematically penalizes the variance, skewing the final quote higher to protect margin.
* **The "Remainder Dump" Guardrail:** `IF (P_Base > P_AI) THEN Unverified_Area = (P_Base - P_AI)`. Forces unverified panes into the "Standard" SKU; prevents the AI from hallucinating expensive picture windows.
* **Ladder Trigonometry Reach Validations:** $Reach = Length \times \sin(75.5^{\circ}) - 3\text{ft}$

## 8.4 Module 4: The Pricing & Orchestration Engine (The Calculator)

**DevOps Function:** The core business logic and margin protection layer. Applies strict Cost-Plus economic formulas, generates the secure UUID, and returns the price to the user.

**A. Trigger & Handoff Routing**
* **Trigger:** Internal Webhook receiving the Module 3 payload.
* **Destination Handoff 1 (Ledger):** Writes the "Pending Quote" row (Price, Address, Phone, UUID) to the Google Sheets Ledger.
* **Destination Handoff 2 (User UI):** Returns an `HTTP 200 Webhook Response` directly back to the Layer 1 Frontend (Estimator UI or Sona Agent) containing the formatted price and the UUID Magic Link (`quote_id=...`).

**B. Formulas, Logic Gates & Guardrails**
* **Cost-Plus Sequence:** Executes the math established in Section 4.4, ensuring a strict **30% Gross Margin** and allocating a **15% indirect overhead buffer**.
* **Hard Financial Guardrails:** Enforces the **$125.00** Job Value floor (or **$60.00** for `ASSESS-ONSITE`) and the **20%** Maximum Discount stack.
* **Compliance Escapes (ONSITE Pivot):** `IF (EPA_Storm_Drain_Risk == TRUE OR OSHA_Pitch > 6:12) THEN Status = "ONSITE"`. Executes the payload transformations defined in Section 6.3.

---
*(STATE BREAK: The automated pipeline pauses here. The user reviews the price in Layer 1 and clicks the "Magic Link" to navigate to Layer 4: The Booking Hub.)*
---

## 8.5 Module 5: CRM & Dispatch Router (ServiceM8)

**DevOps Function:** The database writer. Triggered only when the user commits to booking. Enforces relational database hierarchy to push the calculated quote into the field without causing duplicate records or wiping out critical safety data.

**A. Trigger & Handoff Routing**
* **Trigger:** Layer 4 (The Booking Hub UI) fires Webhook M5.1 when the user submits their final scheduling form and Stripe payment.
* **Destination Handoff:** REST API calls to ServiceM8.

**B. Formulas & Guardrails**
* **ServiceM8 Relational Hierarchy:** Executes the strict `Idempotency Check (Search Email)` $\rightarrow$ `Create Company` $\rightarrow$ `Create CompanyContact` (passing `company_uuid`) $\rightarrow$ `Create Job` sequence.
* **Badge Array Appending (Critical Safety):** `GET` the current badge array, append new UUIDs (e.g., "Waiver Required"), and `POST` the full array back to prevent overwrite deletion.

## 8.6 The Financial & Analytics Ledger (Asynchronous Post-Job Twin)

**DevOps Function:** Runs asynchronously in the background. Acts as the corporate financial controller, tracking ad spend effectiveness, unit economics, and subscription liability.

**A. Triggers & Routing**
* **Triggers:** ServiceM8 "Job Complete" Webhooks, Stripe Webhooks, and Daily Scheduled CRON Jobs.
* **Dual-Tracking & CAPI Server-Side Events:** Pushes authoritative events (Job Booked, Invoice Paid) server-side via Meta CAPI and GA4 using SHA-256 hashed PII and shared `event_id`s.
* **ASC 606 Wallet Breakage:** Tracks deferred subscription liability. 
  $Breakage\_Rate = Unredeemed\_Credits / Total\_Credits\_Issued$
* **Incrementality (North Star) Check:** Ensures Gleam-On is profitable. 
  $(Avg\_Rev\_Member) / (Avg\_Rev\_NonMember) \geq 1.40$
* **Abandoned Cart Ledger:** Checks the Module 4 Google Sheet daily; triggers SMS recovery via Sona if a UUID is >24 hours old and unbooked.

# 9. Make.com DevOps & Scenario Architecture


To build an enterprise-grade backend in Make.com, scenarios must be treated like a strict, compiled codebase. This prevents logic entanglement, isolates API errors, and allows for rapid debugging without taking physical business operations offline. 

This architecture relies on a rigid Folder Hierarchy, a strict Naming Convention Protocol, and the absolute prohibition of "Monolithic" scenarios.

## 9.1 Folder Organization (The Microservice Workspaces)

Do not dump all scenarios into the default Make.com workspace folder. Folders must strictly mirror the microservices defined in Section 8 to isolate functions and manage variable scope.

* **📁 00_Dev_Sandbox:** Where all new scenarios are built, mocked, and tested before moving to production.
* **📁 01_M1_Intake_Gateway:** Frontend webhooks, reCAPTCHA validation, Poka-Yoke clamping, and Sona/Tawk.to initial routing.
* **📁 02_M2_Actuarial_Math:** RentCast APIs, Google Elevation, and Bayesian density baseline calculations.
* **📁 03_M3_AI_Vision:** Gemini 2.5 Flash image buffering, Firecrawl scrapers, and LINEX risk reconciliation.
* **📁 04_M4_Pricing_Engine:** Cost-plus math, VTM continuous multiplier application, discount firewalls, and UUID generation.
* **📁 05_M5_CRM_Dispatch:** ServiceM8 CRUD operations, Idempotency checks, and Badge array appending.
* **📁 06_Asynchronous_Ledgers:** Stripe breakage math, Meta CAPI/GA4 server-side events, and 24hr abandoned cart text triggers.
* **📁 07_Admin_&_Config:** Scenarios that process payload updates from the Layer 5 Admin Panel GUI to mutate the Make.com Data Stores (Base Prices, VTMs).
* **📁 99_DLQ_and_Errors:** Dead Letter Queues, error handling, payload catchers, and Slack/Admin alerts.

## 9.2 Standardized Naming Convention Formula

Every scenario and API Connection must follow this exact naming formula. This allows developers, system admins, and future AI agents to know exactly what the scenario does, what triggers it, and where the data goes next, without having to open the visual builder.

**The Scenario Formula:**
`[ENV] [MODULE_ID] : [Trigger] ➔ [Core Function] ➔ [Destination]`

* **`[ENV]`:** The deployment environment. 
  * `[PROD]` = Live Production (Routing real customer data).
  * `[DEV]` = Testing/Sandbox (Do not connect to live Stripe/ServiceM8).
  * `[OFF]` = Deprecated/old versions preserved for rollback.
* **`[MODULE_ID]`:** Ties the scenario to its parent folder (e.g., `M1.1`, `M4.2`).
* **`[Trigger]`:** What initiates the scenario (e.g., `Wbhk` for Webhook, `Sched` for Scheduled Time, `SM8` for ServiceM8 API trigger).
* **`[Core Function]`:** A concise 3-to-4 word summary of the math or action performed.
* **`[Destination]`:** Where the payload goes next (e.g., `HTTP (M2.1)`, `GSheets (Pending)`, `SM8 API`).

**The API Connection Formula:**
`[ENV]_[Platform]_[Scope/Account]` (e.g., `PROD_ServiceM8_Master`, `DEV_Stripe_TestMode`).

## 9.3 Core Pipeline Scenario Index

Below is the required scenario index for the core Gleam 3.0 pipeline. Any modifications to the data flow must be reflected in these specific titles.

**Folder: 01_M1_Intake_Gateway**
* `[PROD] M1.1 : Wbhk (Squarespace) ➔ Validate Auth & Clamp Data ➔ HTTP (M2.1)`
* `[PROD] M1.2 : Wbhk (Sona SMS) ➔ Parse Address ➔ HTTP (M2.1)`
* `[PROD] M1.3 : Wbhk (Tawk.to) ➔ Filter Intent ➔ HTTP (M2.1)`

**Folder: 02_M2_Actuarial_Math**
* `[PROD] M2.1 : Wbhk (Internal) ➔ RentCast & Elevation Math ➔ HTTP (M3.1)`

**Folder: 03_M3_AI_Vision**
* `[PROD] M3.1 : Wbhk (Internal) ➔ Gemini Audit & LINEX Recon ➔ HTTP (M4.1)`
* `[PROD] M3.2 : Wbhk (Internal) ➔ Firecrawl MLS Scrape ➔ Array (M3.1)` *(Helper module executed in parallel)*

**Folder: 04_M4_Pricing_Engine**
* `[PROD] M4.1 : Wbhk (Internal) ➔ Compute Cost-Plus & VTMs ➔ GSheets (Pending)`
* `[PROD] M4.2 : Wbhk (Squarespace) ➔ Hydrate UI from UUID ➔ Webhook Response` *(Magic Link retrieval)*

**Folder: 05_M5_CRM_Dispatch**
* `[PROD] M5.1 : Wbhk (Squarespace) ➔ Idempotency Check & Create Job ➔ SM8 API`
* `[PROD] M5.2 : SM8 (Job Complete) ➔ Append Rework Badge Array ➔ SM8 API`

**Folder: 06_Asynchronous_Ledgers**
* `[PROD] L6.1 : Sched (Daily 10AM) ➔ Check GSheets for Abandoned ➔ HTTP (Sona SMS)`
* `[PROD] L6.2 : Wbhk (Stripe Paid) ➔ Hash PII & Push Event ➔ Meta CAPI`

**Folder: 07_Admin_&_Config**
* `[PROD] C7.1 : Wbhk (Admin UI) ➔ Validate Admin Auth ➔ Update Make Data Store`

**Folder: 99_DLQ_and_Errors**
* `[PROD] E99.1 : Wbhk (Error) ➔ Route Failed Payload ➔ Slack Alert & GSheets DLQ`

## 9.4 Critical Make.com DevOps Rules

Make.com does not support native Git-style version control or pull requests. Therefore, the following strict operational rules apply to all development:

1. **Never Build a Monolith:** If a scenario exceeds 15-20 modules, it is too complex, brittle, and uses too much active server memory. Break it apart. Have the end of one scenario use an "HTTP Request" module to POST the JSON payload to the "Custom Webhook" trigger of the next logical scenario in the pipeline.
2. **Use "Clones" for Version Control:** Before editing a critical production scenario (e.g., `[PROD] M4.1`), you must clone it. Name the clone `[DEV] M4.1_v2`. Test the new math in the DEV clone. Once validated, turn off the old scenario, rename it to `[OFF] M4.1_v1`, and rename the newly validated clone to `[PROD] M4.1`.
3. **Strict Data Structures (Type Safety):** Webhooks must never be set to dynamically determine their data structure in production. You must explicitly define and lock the Make.com "Data Structure" (specifying exactly which variables are Strings, Arrays, or Numbers). If a payload violates the schema, it is rejected instantly, preventing cascading mathematical errors.
4. **Error Handling Directives (The DLQ Route):** All critical API modules (e.g., RentCast, Gemini, ServiceM8) must have an Error Route attached.
   * Use the **"Break"** directive if the error is likely temporary (e.g., API rate limit). This stores the incomplete execution in Make.com's memory and automatically retries it later.
   * Use the **"Ignore"** directive combined with an HTTP POST to `[PROD] E99.1` if the error is fatal (e.g., Invalid Address). This pushes the payload to the Dead Letter Queue Google Sheet for manual human review.
5. **The "Notes" Module is Core Documentation:** Every scenario must have a Make.com "Note" attached to its initial trigger module containing the exact JSON schema that the webhook expects to receive. This allows developers to instantly mock payloads via Postman when debugging.
# 10. Master Data Attribute & Algorithmic Matrix (The "Twins")



This document is the comprehensive index of every data attribute, formula, and machine learning model required to operate the Gleam 3.0 "Genius Backend." It acts as the ultimate reference variable list for Make.com data structures, Node.js payloads, and Layer 5 database mapping.

## 10.1 B2C Customer & Property Data (The 6 Core Twins)

### 1. The Persona & Conversion Twin
| Attribute | Purpose / Impact | Source / Collection | Layer 5 Destination |
| :--- | :--- | :--- | :--- |
| `Contact_Primitives` | Baseline routing (Name, Email, Mobile). | Layer 1 UIs. | `ServiceM8 CompanyContact` |
| `Property_Class` | Routes logic (Residential vs. Commercial). | UI Proxy Question. | `ServiceM8 Custom Field 1` |
| `Household_Income` | Validates purchasing power for Gleam-On. | Census ACS API (ZIP). | `Make.com Data Store` |
| `Lead_Score` (0-100) | Server-side prioritization for office follow-up. | Make.com Computed. | `ServiceM8 Custom Field 2` |
| `BNPL_Propensity` | High propensity triggers Affirm integration. | Stripe/Affirm SDK. | `Stripe Customer Metadata` |
| `UTM_Attribution` | Connects lead to exact Ad source for CAC. | `sessionStorage`. | `ServiceM8 Custom Field 3` |
| `Abandonment_Node` | Tracks UI drop-off to trigger contextual SMS. | UI Event Listeners. | `GSheets DLQ / Abandoned` |

### 2. The Actuarial & Structural Twin
| Attribute | Purpose / Impact | Source / Collection | Layer 5 Destination |
| :--- | :--- | :--- | :--- |
| `AGSF` (Above-Grade) | Baseline density for standard panes; caps blowouts. | RentCast API. | `ServiceM8 Job Description` |
| `BGSF` (Below-Grade) | Dictates exact basement egress window counts. | RentCast API. | `ServiceM8 Job Description` |
| `Year_Built` | Pre-1980 triggers 1.40x French Grid multiplier. | RentCast API. | `ServiceM8 Job Description` |
| `Property_Type` | Shared walls (Townhomes) trigger 0.65x dampening. | RentCast API. | `ServiceM8 Job Description` |
| `Property_Turnover` | Active MLS listings trigger "Listing Linda" promos. | RentCast API. | `Make.com Automation Trigger` |

### 3. The Sensory & Chemistry Twin
| Attribute | Purpose / Impact | Source / Collection | Layer 5 Destination |
| :--- | :--- | :--- | :--- |
| `Fenestration_Array` | Exact counts of Standard, Slider, and Grids. | Gemini 2.5 Flash. | `ServiceM8 Job Materials` (SKUs) |
| `Siding_Material` | Hardie/Stucco locks out high-pressure washing. | Firecrawl LLM. | `ServiceM8 Badge` (Chemistry) |
| `Window_Coatings` | Flags Low-E glass (Cardinal i89); bans scrapers. | Firecrawl LLM. | `ServiceM8 Badge` (Delicate Glass) |
| `Storm_Doors` | Adds +10 mins of additive (ET) labor per door. | Gemini 2.5 Flash. | `ServiceM8 Job Materials` (Upsell) |

### 4. The Environmental & Geospatial Twin
| Attribute | Purpose / Impact | Source / Collection | Layer 5 Destination |
| :--- | :--- | :--- | :--- |
| `Water_Hardness` | >100 PPM mandates RO/DI pure water system. | Local Water Auth. | `ServiceM8 Badge` (RO/DI Req) |
| `Roof_Pitch` | >6:12 triggers mandatory OSHA routing (ONSITE). | Google Solar API. | `ServiceM8 Badge` (OSHA Risk) |
| `Yard_Grade_Slope` | >10% presents ladder hazards; triggers ONSITE. | Google Elevation API. | `ServiceM8 Badge` (Ladder Risk) |
| `Canopy_Density` | Heavy NDVI triggers Gleam-On gutter upsells. | Google Earth Engine. | `ServiceM8 Custom Field 4` |
| `Altitude_UV_Index` | High UV accelerates screen breakdown (Upsell). | Demographic Data. | `ServiceM8 Job Description` |

### 5. The Friction, Hazard & Legal Twin (Micro-Logistics)
| Attribute | Purpose / Impact | Source / Collection | Layer 5 Destination |
| :--- | :--- | :--- | :--- |
| `Height_Modifier` | Multiplicative (SF) time modifier for 3rd story. | Layer 1 Proxy. | Math memory (Alters final price) |
| `Soiling_Level` | Additive (ET) time modifier for heavy grime. | Layer 1 Proxy. | Math memory (Alters final price) |
| `Lead_Asbestos_Risk`| Homes <1980 require EPA "Lead-Safe" protocols. | RentCast API. | `ServiceM8 Badge` (Lead/Asbestos) |
| `Storm_Drain_Prox` | Closeness to drains triggers EPA runoff berms. | Maps / Elevation. | `ServiceM8 Badge` (EPA Runoff) |

### 6. The Relationship & Financial Twin (The Ledgers)
| Attribute | Purpose / Impact | Source / Collection | Layer 5 Destination |
| :--- | :--- | :--- | :--- |
| `Wallet_Balance` | Available Gleam-On credits for redemption. | Stripe Billing. | `ServiceM8 Custom Field 5` |
| `ASC_606_Liability` | Tracks deferred revenue from unused credits. | Make.com Ledger. | `Stripe Customer Metadata` |
| `EHR_Actual` | Tracks Effective Hourly Rate post-job vs $52/hr goal. | ServiceM8 Timeclock. | `Google Sheets Financial DB` |
| `Rework_Propensity` | Flags jobs invoking the 5x5 Spot-Free Guarantee. | OpenWeather API. | `ServiceM8 Badge` (Rework/QA) |
| `VIP_Status` | >3 completed jobs triggers white-glove leave-behinds.| ServiceM8 History. | `ServiceM8 Badge` (VIP Client) |

---

## 10.2 Ecosystem & B2B Data (The Growth Twins)

| Attribute | Purpose / Impact | Source / Collection | Layer 5 Destination |
| :--- | :--- | :--- | :--- |
| `Turf_SqFt_Area` | Generates flat-rate quotes for Lawn Care partners. | SiteRecon / Civils.ai | `ServiceM8 Job Description` |
| `Dryer_Vent_Length` | Runs >35 feet violate IRC codes; triggers HVAC upsell. | Onsite Tech Audit. | `ServiceM8 Job Description` |
| `Storefront_Lin_Ft` | Commercial quotes priced per linear foot vs. pane. | Computer Vision. | `ServiceM8 Job Materials` |
| `Traffic_Volume` | High pedestrian traffic mandates "After-Hours" work. | Waze Traffic API. | `ServiceM8 Badge` (Night Shift) |

---

## 10.3 Unstructured Data & Social Intelligence (The Sentiment Twin)

| Attribute | Purpose / Impact | Source / Collection | Destination |
| :--- | :--- | :--- | :--- |
| `Hyper_Local_Weather` | "Ash" or "Hail" keywords trigger localized ad spend. | Apify (Facebook). | Meta Ads API (Trigger Campaign) |
| `HOA_Compliance` | Identifies HOA fine drives for targeted direct mail. | Apify (Nextdoor). | Postalytics API (Direct Mail) |
| `Civic_Code_Violations`| Citations for mildew trigger remediation offers. | Municipal Data. | Postalytics API (Direct Mail) |

---

## 10.4 Advanced Formulas & Operations Research

This section defines the strict mathematical algorithms executed inside Layer 3 (Make.com/Node.js) to manage risk, safety, and logistical fleet routing.

### 1. Risk & Quoting Algorithms



* **Asymmetric Risk (LINEX Loss Function):**
  Symmetrical variance is dangerous in quoting. This function penalizes the AI under-quoting more heavily than over-quoting when comparing AI Vision math against the Actuarial baseline.
  $$L(\Delta) = b[e^{a\Delta} - a\Delta - 1]$$
* **Bayesian Shrinkage Prior:**
  Blends historical local job data with Census averages to prevent geographic overfitting in baseline pricing.
  $$\hat{\theta}_i = w_i \bar{x}_i + (1 - w_i) \mu$$
* **Satisficing Decay Threshold:**
  If a user completes a complex UI slider in `< 2 seconds`, the system flags the data as a guess and defaults to the Bayesian prior.
  $$Error\_Rate \propto \frac{Task\_Difficulty}{User\_Motivation}$$

### 2. Logistics & Operational Physics



* **Ladder Trigonometry (OSHA):**
  Validates if standard Werner ladders can safely reach the geometric eave height without requiring an aerial boom lift (Triggering the ONSITE pivot if unsafe).
  $$Reach = Length \times \sin(75.5^{\circ}) - 3\text{ft}$$
* **Vehicle Routing Problem with Time Windows (VRPTW):**
  Minimizes travel cost for autonomous dispatching. Automatically offers a 5% "Neighborhood Route" discount if a new lead is within a 5-mile radius of an already booked job.
  $$\min \sum c_{ij} x_{ij}$$
* **The Bathtub Curve (Material Failure):**
  Maps home age to material failure (e.g., fiberglass screen UV rot) to autonomously trigger targeted replacement upsells around Year 10.
  $$\lambda(t) = Early\_Failures + Random\_Events + Wear\_Out$$
  
=====================================================================================================
                             GLEAM 3.0: 5-TIER DEVSECOPS ARCHITECTURE
=====================================================================================================
                      "Dumb Frontend / Genius Backend" Separation of Concerns
=====================================================================================================

  [ ADVERTISING NETWORKS ] -> Meta CAPI / Google Ads / LSA (Dual-Tracking & Deduplication)
             │
             ▼ (UTM & DNI Capture)
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: PRESENTATION & ACQUISITION EDGE (ZERO-TRUST PERIMETER)                                   │
├──────────────────────────────┬──────────────────────────────┬─────────────────────────────────────┤
│ 1A/B/C: ESTIMATOR SPOKES     │ SPOKE 2: SONA (VOICE/SMS)    │ SPOKE 3: APOLLO (WEBCHAT)           │
│ - Squarespace DOM Shell      │ - Inbound/Outbound Agent     │ - Tawk.to Messenger Agent           │
│ - state-manager.js (Storage) │ - Latency-Buffering Prompts  │ - Real-Time Objection Handling      │
│ - ui-components.js (Clamps)  │ - OpenAPI / MCP Gateway      │ - OpenAPI / MCP Gateway             │
│ - api-client.js (reCAPTCHA)  │ - DNI Attribution Routing    │ - FB Messenger Sync                 │
└────────────┬─────────────────┴──────────────┬───────────────┴──────────────────┬──────────────────┘
             │ (fetch HTTP POST)              │ (JSON payload)                   │ (JSON payload)
             ▼                                ▼                                  ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: API GATEWAY & SECURITY PERIMETER (THE BOUNCER)                                           │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MAKE.COM [M1.1 - M1.3] INTAKE MODULES                                                             │
│  ► Cloudflare WAF & CORS Enforcement          ► Custom Header Auth (x-gleam-auth)                 │
│  ► reCAPTCHA v3 Server-Side Validation        ► Poka-Yoke Data Clamping (e.g., Max 15k SqFt)      │
│  ► Satisficing Decay Threshold Check          ► DLQ (Dead Letter Queue) Routing for Bad Payloads  │
└─────────────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                              │ (Sanitized JSON Payload)
                                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: APPLICATION CORE & LOGIC (THE GENIUS BACKEND)                                            │
├────────────────────────────┬──────────────────────────────┬───────────────────────────────────────┤
│ M2: DETERMINISTIC TWIN     │ M3: SENSORY TWIN (AI)        │ M4: PRICING & LOGISTICS ENGINE        │
│ - RentCast (AGSF/BGSF/Age) │ - Gemini 2.5 Flash Vision    │ - Cost-Plus Math (15% OH, 30% Margin) │
│ - Google Elev/Solar API    │ - Firecrawl (Low-E/Siding)   │ - VTMs (Additive & Multiplicative)    │
│ - US Census/Esri Demogs.   │ - LINEX Asymmetric Risk      │ - CEF (Crew Efficiency Factor)        │
│ - Bayesian Shrinkage Prior │ - "Remainder Dump" Anchoring │ - $125 Floor / 20% Discount Max       │
├────────────────────────────┴──────────────────────────────┴───────────────────────────────────────┤
│  [!] SAFETY GATES: OSHA Fall Risk (>6:12) | EPA Storm Runoff | NFPA 211 ---> Triggers ONSITE Pivot│
└─────────────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                              │ (Generates UUID Magic Link & Sends to Layer 1/SMS)
              ┌───────────────────────────────┴──────────────────────────────┐
              ▼                                                              ▼
┌──────────────────────────────────────────┐   ┌────────────────────────────────────────────────────┐
│ ASYNC ABANDONMENT (LEDGER 6.1)           │   │ LAYER 4: CONVERSION & COMMITMENT (THE SECURE HUB)  │
├──────────────────────────────────────────┤   ├────────────────────────────────────────────────────┤
│ ► Daily CRON checks Google Sheets Ledger │   │ [ /finish-booking?quote_id={UUID} ]                │
│ ► Triggers SMS via Sona if UUID > 24hrs  │   │ ► Hydrates state via Make.com M4.2 webhook         │
└──────────────────────────────────────────┘   │ ► Stripe Elements Checkout & Affirm BNPL Inject    │
                                               │ ► Vanilla JS DOM UI (ServiceM8 Schedule Blocks)    │
                                               └─────────────────────────────┬──────────────────────┘
                                                                             │ (M5.1 Webhook POST)
                                                                             ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 5: DATA PERSISTENCE & OPERATIONAL LEDGERS                                                   │
├──────────────────────────────┬──────────────────────────────┬─────────────────────────────────────┤
│ SERVICEM8 (M5.1 & M5.2)      │ STRIPE / FINANCIAL           │ MAKE.COM DATA STORES (ADMIN)        │
│ - Idempotency Checks (Email) │ - Payment Processing         │ - Password-Protected Config GUI     │
│ - Create Company -> Contact  │ - Gleam-On Wallet Engine     │ - ZIP-Code Density Arrays           │
│ - Validate `qty * price`     │ - ASC 606 Liability Tracking │ - Base Pricing & VTM Multipliers    │
│ - Badge Array Appending      │ - Multi-Tenant Route/Auth    │ - Multi-Tenant Franchise API Keys   │
└──────────────────────────────┴──────────────┬───────────────┴─────────────────────────────────────┘
                                              │ (Job Complete Webhook / Payment Success Webhook)
                                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 6: ASYNCHRONOUS TELEMETRY & QUALITY CONTROL                                                 │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ► Meta CAPI & GA4 (SHA-256 Hashed PII, Shared event_id Deduplication)                            │
│  ► OpenWeather API Monitoring (Post-Job checking for rain -> Triggers 5x5 Rework Badge in SM8)    │
│  ► Incrementality Reporting (Gleam-On LTV / Non-Member LTV >= 1.40)                               │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘  
  
  # 11. Required LLM Output Protocol (The Change Log)

This `project-context.md` file is the master architectural blueprint for Gleam 3.0. It is a living document, but it is strictly governed. 

**ATTENTION ALL LLMs, AI AGENTS, AND HUMAN DEVELOPERS:** By ingesting this file, you agree to operate under the absolute constraints of the 5-Tier DevSecOps Architecture (Section 2), the strict API mapping rules (Section 3), and the Make.com DevOps rules (Section 9). You are strictly prohibited from suggesting monolithic code structures, bypassing Layer 2 security, or generating UI code that contains mathematical pricing logic.

## 11.1 The Pre-Execution Validation Checklist

Before generating any code, Make.com JSON schemas, or architectural advice, the AI must silently validate the user's request against the following constraints:

1. **Topology Check:** Does this request violate the "Dumb Frontend / Genius Backend" rule? (If the user asks to put a pricing formula in Vanilla JS, the AI must refuse and route the logic to Layer 3).
2. **Security Check:** Does this request expose a hidden API key or pass PII/Actuarial data via Base64 URL parameters? (If yes, force the use of `sessionStorage` or the backend UUID Magic Link).
3. **Database Check:** Does this request write to ServiceM8 (Layer 5)? If yes, enforce the Idempotency Check and Badge Array Appending rules to prevent data overwrites.
4. **Safety Check:** Does this request bypass the OSHA/EPA safety tripwires? (If yes, enforce the "ONSITE Pivot").

## 11.2 The Status Log Maintenance Protocol

To prevent the architecture from degrading over time, every structural change, new API integration, or altered mathematical formula must be meticulously recorded in the table below. 

**Rules for updating the Status Log:**
* The AI must automatically prompt the user to update this table whenever a verified change is made to the production environment.
* The `Module / Repo` column must use the exact Make.com naming conventions defined in Section 9.2 (e.g., `[PROD] M4.1`).
* The `DevSecOps Rule Validated` column must explicitly state which architectural constraint was checked to ensure the system remains compliant.

# 11. Required LLM Output Protocol (The Status Log)

This `project-context.md` file is the master architectural blueprint for Gleam 3.0. It is a living document, but it is strictly governed. 

**ATTENTION ALL LLMs, AI AGENTS, AND HUMAN DEVELOPERS:** By ingesting this file, you agree to operate under the absolute constraints of the 5-Tier DevSecOps Architecture (Section 2), the strict API mapping rules (Section 3), and the Make.com DevOps rules (Section 9). You are strictly prohibited from suggesting monolithic code structures, bypassing Layer 2 security, or generating UI code that contains mathematical pricing logic.

## 11.1 The Pre-Execution Validation Checklist

Before generating any code, Make.com JSON schemas, or architectural advice, the AI must silently validate the user's request against the following constraints:

1. **Topology Check:** Does this request violate the "Dumb Frontend / Genius Backend" rule? (If the user asks to put a pricing formula in Vanilla JS, the AI must refuse and route the logic to Layer 3).
2. **Security Check:** Does this request expose a hidden API key or pass PII/Actuarial data via Base64 URL parameters? (If yes, force the use of `sessionStorage` or the backend UUID Magic Link).
3. **Database Check:** Does this request write to ServiceM8 (Layer 5)? If yes, enforce the Idempotency Check and Badge Array Appending rules to prevent data overwrites.
4. **Safety Check:** Does this request bypass the OSHA/EPA safety tripwires? (If yes, enforce the "ONSITE Pivot").

## 11.2 The Status Log Maintenance Protocol (Technical & DevSecOps)

To prevent the architecture from degrading over time, every technical structural change, new API integration, or altered mathematical formula must be meticulously recorded in the Status Log. 

**Rules for updating the Status Log:**
* The AI must automatically prompt the user to update this table whenever a verified technical change is made to the production environment.
* The `Module / Repo` column must use the exact Make.com naming conventions defined in Section 9.2 (e.g., `[PROD] M4.1`).
* The `DevSecOps Rule Validated` column must explicitly state which architectural constraint was checked to ensure the system remains compliant.

### Gleam 3.0 Master Status Log

| Date | Version | Module / Repo | Description of Structural / Technical Change | DevSecOps Rule Validated |
| :--- | :--- | :--- | :--- | :--- |
| 2024-10-27 | 3.0.0 | `project-context.md` | Master document initialized. 5-Tier DevSecOps Architecture established. | N/A (Baseline) |
| [YYYY-MM-DD] | [X.X.X] | [e.g., `[PROD] M4.1`] | [e.g., Updated LINEX asymmetric risk penalty to favor higher margin due to canopy occlusion.] | [e.g., Section 4.2 Guardrails] |
| | | | | |


### Status entry 02/24/2026

* **WBS Element Label (Deliverable/Feature):** 1.0 Master System Architecture Context & 4.5.1 Estimator Frontend Modularization
* **Work Package Label (User Story):** As a System Architect and Developer, I need to completely modularize the frontend into isolated JS components and exhaustively document the entire DevSecOps, Pricing, API, and Compliance architecture to ensure enterprise scalability and strictly prevent LLM logic hallucinations.
* **Tasks & Sub-tasks:**
  * **Frontend Modularization (Phase 4.5.1):** Gutted the 300+ line monolithic HTML file. Extracted logic into `state-manager.js`, `api-client.js`, and `ui-components.js`. Replaced with `<script>` tags and injected the Google reCAPTCHA v3 CDN.
  * **Topology & Security:** Restructured the ecosystem around a "Dumb Frontend/Genius Backend" Hub-and-Spoke model. Defined GitHub folder mappings, `.env` secrets management rules, webhook CORS/Header security, and strictly banned Base64 PII transfers.
  * **Pricing Math & Guardrails:** Locked in the Cost-Plus sequence (15% overhead, 30% margin), hard financial guardrails ($125 floor, 20% max discount), Bayesian/LINEX loss functions, Logarithmic Decay (>4,500 sq ft), CEF isolation, and Poka-Yoke UI clamps. 
  * **Compliance & CRM Restrictions:** Documented federal safety gates (OSHA fall risks, EPA runoff, NFPA fire codes, GFCI rules) and mapped strict ServiceM8 API constraints (10-field limit, taxonomy, and mandatory `company_uuid` linking).
  * **Omnichannel & AI Integrations:** Detailed OpenAPI/MCP gateway requirements for conversational agents (Quo/Tawk.to) and established enterprise marketing tracking (UTM persistence, Meta CAPI, GA4 deduplication).
* **Notes:**
  * **Files Modified:** `/estimator_widget/index.html`, `state-manager.js`, `api-client.js`, `ui-components.js`, and `/estimator_widget/project-context.md`.
  * **Reasoning:** Enforces the Single Responsibility Principle on the frontend while creating an airtight set of boundaries for future AI instances to prevent margin loss, CRM data corruption, and code regressions.
  * **Current State/Next Steps:** The frontend is fully modular and the system context is exhaustively documented. The immediate next step is to execute Phase 4.1: Configure the Make.com webhook URL inside `api-client.js` and run a live test of the payload handoff.


### Status entry 02/24/2026

* **WBS Element Label (Deliverable/Feature):** 1.10 Digital Architecture System Context (Omnichannel Marketing Data)
* **Work Package Label (User Story):** As an Advertising Lead, I need privacy-compliant, omnichannel tracking defined so we can capture offline conversions accurately without violating the CPA.
* **Tasks & Sub-tasks:**
  * Detailed Dual-Tracking Deduplication using shared `event_id`s.
  * Added Google Ads Enhanced Conversions rules (SHA-256 hashing).
  * Mandated Google Business Profile UTMs and Dynamic Number Insertion (DNI) for Sona voice.
  * Documented Google Consent Mode v2 compliance.
* **Notes:**
  * **Files Modified:** `/estimator_widget/project-context.md`
  * **Reasoning:** Bridges the gap between operational job routing and ad network ROI modeling.
  * **Current State/Next Steps:** Omnichannel tracking defined. Next step: Implement UTM Persistence script on the frontend.

---

### Status entry 02/24/2026

* **WBS Element Label (Deliverable/Feature):** 5.1.1 Booking Hub Modularization (State Manager)
* **Work Package Label (User Story):** As a frontend architect, I need to strip the legacy React framework out of the Booking Hub to drastically improve load speeds and enforce the Vanilla JS standard.
* **Tasks & Sub-tasks:**
  * Extracted state, dynamic upsell logic, and payload assembly into `state-manager.js`.
  * Added logic to parse `sessionStorage` for Digital Twin JSON and UTM parameters.
* **Notes:**
  * **Files Modified:** `/booking_hub_widget/js/state-manager.js`, `/booking_hub_widget/booking-hub-widget_v3.4.0.html`
  * **Reasoning:** Enforces Vanilla JS mandate and ensures tracking persistence from Lead capture to final checkout.
  * **Current State/Next Steps:** State management isolated. Next step is creating `api-client.js` for the Booking Hub.

---

### Status entry 02/24/2026

* **WBS Element Label (Deliverable/Feature):** 5.1.2 Booking Hub Modularization (API Client)
* **Work Package Label (User Story):** As a DevSecOps Architect, I need network communication isolated from UI rendering in the Booking Hub so backend timeouts do not crash the user experience.
* **Tasks & Sub-tasks:**
  * Extracted API communication logic to `api-client.js`.
  * Implemented `fetchAvailability` and `submitBooking` methods.
  * Enforced the `x-gleam-auth` custom HTTP header for Make.com webhook security.
* **Notes:**
  * **Files Modified:** `/booking_hub_widget/js/api-client.js`
  * **Reasoning:** Fulfills Section 8 DevSecOps constraints and enforces the Single Responsibility Principle.

---


## 11.3 The Change Log (Project Scope & Requirements)

While the Status Log tracks technical reality, the Change Log tracks business strategy. Any fundamental shifts in the business model, target unit economics, new service vertical additions, or compliance requirements must be logged here before technical architecture is altered to support it.

### Scope & Requirements Change Log

| Date | Business Driver / Requirement Shift | Impacted Layers | Architectural Implication | Status |
| :--- | :--- | :--- | :--- | :--- |
| 2024-10-27 | Pivot to 100% Data-Driven Pricing. | Layers 1, 3, 4 | Required removal of density guessing from UI; introduced Gemini 2.5 Flash Vision audit. | Approved |
| [YYYY-MM-DD] | [e.g., Addition of B2B Multi-Site Retail Route] | [e.g., Layers 1 & 5] | [e.g., Requires new "Storefront_Lin_Ft" data matrix and HigherGov API integration.] | [Pending] |
| | | | | |

## 11.4 AI System Prompt Injection (For Future Chats)

When starting a new session with an AI, the human developer should paste the following prompt alongside this document to initialize the strict DevSecOps constraints:

> **Initialization Prompt:** > *"Attached is the `project-context.md` file for Gleam 3.0. You are acting as a Senior DevSecOps Architect. Ingest this document fully. Acknowledge receipt by briefly summarizing the 5-Tier Architecture and the Make.com Microservice ETL flow. Do not generate any code or solutions until you have verified your proposed solution against the Security, Safety, and ServiceM8 relational database constraints defined within this document."*

## 11.5 Context Window Management

As this document grows, it may consume a large portion of an LLM's context token window. 
* **Rule:** Do not delete historical architectural definitions to save space. 
* **Rule:** If the Status Log or Change Log exceeds 25 rows, the AI is authorized to synthesize the oldest 15 rows into a single "Archived Updates" summary bullet to preserve context tokens for active problem-solving.