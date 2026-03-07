#!/usr/bin/env node
/**
 * Gleam 3.0 — County Assessor ETL Pipeline (v3 - Auto-Detect)
 * 
 * Modes:
 *   --mode detect    Auto-detect file formats, generate county_config.json
 *   --mode preview   Show mapped columns for verification
 *   --mode dry-run   Parse + validate + compute + Golden Set search (no upload)
 *   --mode bootstrap First load to Supabase
 *   --mode refresh   Quarterly upsert (protects Gleam-enriched fields)
 *
 * For a new county:
 *   1. Place raw files in county_data/<county_name>/
 *   2. node gleam_etl.js --county <name> --mode detect
 *   3. node gleam_etl.js --county <name> --mode preview   (verify)
 *   4. node gleam_etl.js --county <name> --mode dry-run
 *   5. node gleam_etl.js --county <name> --mode bootstrap
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = parseArgs(process.argv.slice(2));
const COUNTY = args.county || 'douglas_co';
const MODE = args.mode || 'detect';
const BATCH_SIZE = 1000;
const BASE_DIR = __dirname;
const COUNTY_DIR = path.join(BASE_DIR, COUNTY);

// ═══════════════════════════════════════════════════════════════
// HEADER PATTERNS: known column header names -> canonical fields
// ═══════════════════════════════════════════════════════════════
const HEADER_PATTERNS = [
  { field: 'parcel_id', patterns: [/^account.?no$/i, /^parcel.?id$/i, /^apn$/i, /^pin$/i, /^parcel.?num/i, /^account$/i] },
  { field: 'agsf', patterns: [/above.?grade/i, /agsf/i, /ag.?sq/i, /sqft.?ag/i, /living.?area/i, /heated.?area/i, /^sq.?ft$/i, /finished.?area/i] },
  { field: 'stories', patterns: [/^stories$/i, /stories.?above/i, /^floors$/i, /num.?stories/i] },
  { field: 'bedrooms', patterns: [/^bed/i, /bedroom/i, /^bdrm/i] },
  { field: 'bathrooms', patterns: [/^bath/i, /bathroom/i, /full.?bath/i] },
  { field: 'year_built', patterns: [/year.?built/i, /yr.?built/i, /^built$/i, /construct.?year/i] },
  { field: 'quality_grade', patterns: [/^quality/i, /^grade$/i, /^class$/i] },
  { field: 'property_type', patterns: [/property.?type/i, /prop.?type/i, /use.?code/i, /land.?use/i, /account.?type/i] },
  { field: 'style', patterns: [/^style$/i, /arch.?style/i, /building.?style/i] },
  { field: 'garage_sqft', patterns: [/garage.?(?:sq|area|size)/i, /gar.?sf/i] },
  { field: 'has_basement', patterns: [/has.?base/i, /basement.?flag/i] },
  { field: 'basement_finished_sqft', patterns: [/base.?fin/i, /finished.?base/i, /bsmt.?fin/i] },
  { field: 'basement_unfinished_sqft', patterns: [/base.?unfin/i, /unfinished.?base/i, /bsmt.?unfin/i] },
  { field: 'exterior_wall', patterns: [/exter.?wall/i, /wall.?type/i, /siding/i, /exterior.?type/i] },
  { field: 'roof_material', patterns: [/roof.?mat/i, /roofing/i, /roof.?type/i] },
  { field: 'roof_style', patterns: [/roof.?style/i, /roof.?shape/i] },
  { field: 'hvac_type', patterns: [/hvac/i, /heat.?type/i, /heating/i] },
  { field: 'address_street', patterns: [/^address$/i, /street.?add/i, /site.?add/i, /location.?add/i, /^situs$/i] },
  { field: 'address_city', patterns: [/^city$/i, /city.?name/i] },
  { field: 'address_state', patterns: [/^state$/i, /state.?code/i, /location.?state/i] },
  { field: 'address_zip', patterns: [/^zip$/i, /zip.?code/i, /postal/i, /location.?zip/i] },
  { field: 'house_number', patterns: [/house.?num/i, /address.?num/i, /street.?num/i] },
  { field: 'street_name', patterns: [/street.?name/i] },
  { field: 'street_suffix', patterns: [/street.?type/i, /street.?suffix/i] },
  { field: 'direction_prefix', patterns: [/pre.?dir/i, /direction/i] },
  { field: 'latitude', patterns: [/^lat/i, /latitude/i] },
  { field: 'longitude', patterns: [/^lon/i, /longitude/i] },
  { field: 'lot_sqft', patterns: [/lot.?sq/i, /lot.?size/i, /land.?area/i] },
  { field: 'lot_acres', patterns: [/^acres$/i, /lot.?acres/i, /deeded.?area/i, /net.?acres/i, /total.?net/i] },
  { field: 'last_sale_date', patterns: [/sale.?date/i, /deed.?date/i, /transfer.?date/i] },
  { field: 'last_sale_price', patterns: [/sale.?price/i, /sale.?amount/i, /deed.?amount/i] },
  { field: 'total_actual_value', patterns: [/actual.?value/i, /market.?value/i, /appraised/i, /total.?value/i] },
  { field: 'subdivision_name', patterns: [/subdiv/i, /plat/i, /filing.?name/i] },
  { field: 'legal_description', patterns: [/legal/i] },
];

// DATA PATTERNS: for headerless files, match by value shape
const DATA_PATTERNS = [
  { field: 'parcel_id', test: v => /^[A-Z]\d{6,8}$/.test(v) || /^\d{10,15}$/.test(v), pri: 10 },
  { field: 'year_built', test: v => /^\d{4}$/.test(v) && +v >= 1850 && +v <= 2030, pri: 5 },
  { field: 'agsf', test: v => /^\d{3,5}$/.test(v) && +v >= 200 && +v <= 15000, pri: 3 },
  { field: 'address_zip', test: v => /^[0-9]{5}$/.test(v) && +v >= 10000, pri: 8 },
  { field: 'latitude', test: v => /^-?\d{2}\.\d{4,}$/.test(v) && Math.abs(+v) >= 20 && Math.abs(+v) <= 50, pri: 7 },
  { field: 'longitude', test: v => /^-?\d{2,3}\.\d{4,}$/.test(v) && +v >= -130 && +v <= -60, pri: 7 },
  { field: 'quality_grade', test: v => /^(excellent|very good|good|average|fair|low|poor)/i.test(v), pri: 9 },
  { field: 'property_type', test: v => /^(single|residential|townhouse|condo|mobile|duplex)/i.test(v), pri: 9 },
  { field: 'exterior_wall', test: v => /^(vinyl|brick|stone|stucco|lap|metal|hard|wood|fiber)/i.test(v), pri: 6 },
  { field: 'roof_material', test: v => /^(shingle|metal|tile|slate|comp|asphalt)/i.test(v), pri: 6 },
  { field: 'has_basement', test: v => /^[YN]$/i.test(v), pri: 4 },
  { field: 'style', test: v => /^(ranch|story|split|level|wide|bi.?level|colonial)/i.test(v), pri: 7 },
  { field: 'last_sale_date', test: v => /\d{4}-\d{2}-\d{2}/.test(v), pri: 6 },
  { field: 'last_sale_price', test: v => /^\d{4,7}\.?\d{0,2}$/.test(v) && +v >= 10000, pri: 3 },
  { field: 'bedrooms', test: v => /^\d\.?\d{0,2}$/.test(v) && +v >= 1 && +v <= 10, pri: 2 },
  { field: 'stories', test: v => /^[123]$/.test(v), pri: 4 },
];

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('='.repeat(70));
  console.log('GLEAM ETL v3 - County: ' + COUNTY + ' | Mode: ' + MODE);
  console.log('='.repeat(70));
  if (!fs.existsSync(COUNTY_DIR)) { console.error('ERROR: ' + COUNTY_DIR + ' not found'); process.exit(1); }
  if (MODE === 'detect') { await detectAndGenerate(); return; }
  const cfgPath = path.join(COUNTY_DIR, 'county_config.json');
  if (!fs.existsSync(cfgPath)) { console.log('No config. Run: node gleam_etl.js --county '+COUNTY+' --mode detect'); process.exit(1); }
  const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  console.log('County: ' + config.county_name + ' (FIPS: ' + config.county_fips + ')');
  const env = loadEnv(path.join(BASE_DIR, '.env'));
  if (MODE === 'preview') { await previewFiles(config); return; }
  const computed = await runPipeline(config);
  if (MODE === 'dry-run') {
    fs.writeFileSync(path.join(COUNTY_DIR, 'etl_sample_50.json'), JSON.stringify(computed.slice(0, 50), null, 2));
    searchGoldenSet(computed);
    console.log('\n-- DRY RUN COMPLETE --');
    return;
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) { console.error('ERROR: need .env with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
  if (MODE === 'bootstrap') await uploadBatch(computed, env, 'bootstrap');
  else if (MODE === 'refresh') await uploadBatch(computed, env, 'refresh');
  console.log('\n-- ETL COMPLETE --');
}

// ═══════════════════════════════════════════════════════════════
// AUTO-DETECT
// ═══════════════════════════════════════════════════════════════
async function detectAndGenerate() {
  console.log('\n-- AUTO-DETECT: Scanning ' + COUNTY_DIR + ' --\n');
  const dataFiles = fs.readdirSync(COUNTY_DIR).filter(f => /\.(txt|csv|tsv)$/i.test(f));
  const geoFiles = fs.readdirSync(COUNTY_DIR).filter(f => /\.geojson$/i.test(f));
  console.log('Found ' + dataFiles.length + ' data files, ' + geoFiles.length + ' GeoJSON');
  dataFiles.forEach(f => { const s = fs.statSync(path.join(COUNTY_DIR,f)); console.log('  ' + f + ' (' + (s.size/1024/1024).toFixed(1) + ' MB)'); });

  const analyses = [];
  for (const fname of dataFiles) {
    console.log('\n  Analyzing ' + fname + '...');
    const a = await analyzeFile(fname);
    analyses.push(a);
    console.log('    Cols: ' + a.colCount + ' | Header: ' + a.hasHeader + ' | Role: ' + a.role + ' (' + a.confidence + '%)');
    a.mappings.slice(0, 12).forEach(m => console.log('      Col ' + String(m.idx).padStart(3) + ': ' + m.field.padEnd(28) + ' = "' + m.sample + '" (' + m.method + ')'));
  }

  const roles = assignRoles(analyses);
  const config = buildConfig(roles, geoFiles);
  const cfgPath = path.join(COUNTY_DIR, 'county_config.json');
  if (fs.existsSync(cfgPath)) fs.copyFileSync(cfgPath, cfgPath + '.bak');
  fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2));
  console.log('\n' + '='.repeat(70));
  console.log('Config written: county_config.json');
  console.log('Next: node gleam_etl.js --county ' + COUNTY + ' --mode preview');
  console.log('='.repeat(70));
}

async function analyzeFile(fname) {
  const fp = path.join(COUNTY_DIR, fname);
  const lines = []; let count = 0;
  const rl = readline.createInterface({ input: fs.createReadStream(fp, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) { lines.push(line); if (++count >= 80) break; }
  const delim = detectDelim(lines[0] || '');
  const parsed = lines.map(l => parseLine(l, delim));
  const colCount = Math.max(...parsed.map(r => r.length));
  const hasHeader = checkHeader(parsed);
  let mappings;
  if (hasHeader) { mappings = matchHeaders(parsed[0], parsed.slice(1, 20)); }
  else { mappings = matchData(parsed.slice(0, 50)); }
  const { role, confidence } = guessRole(mappings, colCount, fname, hasHeader ? parsed[0] : null);
  return { file: fname, colCount, hasHeader, delim, role, confidence, mappings, header: hasHeader ? parsed[0] : null };
}

function detectDelim(line) {
  const c = {',':0,'\t':0,'|':0,';':0}; let q = false;
  for (const ch of line) { if (ch==='"') q=!q; if (!q && c.hasOwnProperty(ch)) c[ch]++; }
  return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];
}

function checkHeader(parsed) {
  if (parsed.length < 2) return false;
  const r0 = parsed[0], r1 = parsed[1];
  let t0=0,n0=0,t1=0,n1=0;
  for (let i = 0; i < Math.min(r0.length, 20); i++) {
    const a = clean(r0[i]), b = clean(r1[i]);
    if (a && isNaN(a)) t0++; else n0++;
    if (b && isNaN(b)) t1++; else n1++;
  }
  if (t0 > n0 * 2 && n1 > t1) return true;
  if (r0.some(c => HEADER_PATTERNS.some(hp => hp.patterns.some(p => p.test(clean(c)))))) return true;
  return false;
}

function matchHeaders(hdr, dataRows) {
  const mappings = [], used = new Set();
  for (let i = 0; i < hdr.length; i++) {
    const h = clean(hdr[i]); if (!h) continue;
    for (const hp of HEADER_PATTERNS) {
      if (used.has(hp.field)) continue;
      if (hp.patterns.some(p => p.test(h))) {
        const sv = dataRows.length > 0 ? clean(dataRows[0][i]) : '';
        mappings.push({ idx: i, header: h, field: hp.field, method: 'header', sample: sv.substring(0,50) });
        used.add(hp.field); break;
      }
    }
  }
  return mappings;
}

function matchData(rows) {
  if (!rows.length) return [];
  const colCount = Math.max(...rows.map(r=>r.length));
  const scores = [];
  for (let col = 0; col < colCount; col++) {
    const vals = rows.map(r => clean(r[col])).filter(v => v);
    if (!vals.length) continue;
    for (const dp of DATA_PATTERNS) {
      const rate = vals.filter(v => dp.test(v)).length / vals.length;
      if (rate >= 0.4) scores.push({ col, field: dp.field, rate, pri: dp.pri, sample: vals[0] });
    }
  }
  scores.sort((a,b) => (b.pri*b.rate) - (a.pri*a.rate));
  const mappings = [], usedF = new Set(), usedC = new Set();
  for (const s of scores) {
    if (usedF.has(s.field) || usedC.has(s.col)) continue;
    mappings.push({ idx: s.col, field: s.field, method: 'data_' + Math.round(s.rate*100) + '%', sample: s.sample.substring(0,50) });
    usedF.add(s.field); usedC.add(s.col);
  }
  return mappings;
}

function guessRole(mappings, colCount, fname, hdr) {
  const fn = fname.toLowerCase(), fields = new Set(mappings.map(m=>m.field));
  if (fn.includes('improvement') || fn.includes('building')) return { role: 'improvements', confidence: 90 };
  if (fn.includes('location') || fn.includes('address') || fn.includes('situs')) return { role: 'location', confidence: 90 };
  if (fn.includes('sale') || fn.includes('transfer') || fn.includes('deed')) return { role: 'sales', confidence: 90 };
  if (fn.includes('parcel') && fn.includes('.csv')) return { role: 'parcels', confidence: 85 };
  if (fields.has('agsf') || fields.has('bedrooms') || fields.has('year_built')) return { role: 'improvements', confidence: 80 };
  if (fields.has('last_sale_price')) return { role: 'sales', confidence: 80 };
  if (fields.has('latitude') || fields.has('lot_acres')) return { role: 'parcels', confidence: 70 };
  if (colCount > 25) return { role: 'improvements', confidence: 40 };
  if (colCount > 15) return { role: 'location', confidence: 35 };
  return { role: 'unknown', confidence: 10 };
}

function assignRoles(analyses) {
  const roles = {}, used = new Set();
  analyses.sort((a,b) => b.confidence - a.confidence);
  for (const a of analyses) {
    let r = a.role;
    if (used.has(r)) { const alt = ['improvements','location','sales','parcels'].filter(x=>!used.has(x)); r = alt[0]||'extra'; }
    if (r !== 'unknown') { roles[r] = a; used.add(r); }
  }
  return roles;
}

function buildConfig(roles, geoFiles) {
  const cfg = {
    county_name: path.basename(COUNTY_DIR).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
    county_fips: "FILL_IN", state: "CO", default_state: "CO",
    _auto_detected: true, _detect_date: new Date().toISOString(),
    files: {},
    value_mappings: {
      property_type: { "Single Family Residential":"sfh","Residential":"sfh","Townhouse":"townhome","Condominium":"condo","Duplex":"duplex","Mobile Home":"manufactured" },
      quality_grade: { "Excellent":"superior","Very Good":"above_average","Good":"above_average","Average":"average","Fair":"below_average","Low":"low_cost" },
      is_good_plus: { values: ["Good","Very Good","Excellent"] },
      garage_type_inference: { rules: [{max_sqft:0,value:"none"},{max_sqft:300,value:"attached_1car"},{max_sqft:550,value:"attached_2car"},{max_sqft:999999,value:"attached_3car"}] },
      stories_from_style: {"Ranch 1 Story":1,"1 Story":1,"2 Story":2,"Split Level":2,"Bi-Level":2,"3 Story":3,"Tri-Level":3,"Single Wide":1,"Double Wide":1}
    },
    derived_geometry: {
      aspect_correction: {"1_story":1.08,"2_story_garage":1.12,"townhome":1.15,"default":1.10},
      complexity_factor: {"1_story_simple":1.20,"2_story_standard":1.35,"default":1.35},
      default_pitch_factor: 1.15, default_roof_complexity: 1.10
    }
  };
  for (const [role, a] of Object.entries(roles)) {
    const cm = {};
    for (const m of a.mappings) { cm[m.field] = a.hasHeader && m.header ? m.header : m.idx; }
    cfg.files[role] = {
      filename: a.file, has_header: a.hasHeader, delimiter: a.delim,
      column_map: cm,
      ...(a.mappings.some(m=>m.field==='house_number') ? {address_assembly:'component'} : {}),
      ...(role==='sales' ? {dedup_strategy:'keep_latest_sale'} : {}),
      _confidence: a.confidence + '%'
    };
  }
  if (geoFiles.length) cfg.files.geometry = { filename: geoFiles[0], parcel_id_field: "ACCOUNT_NO", srid: 4326 };
  return cfg;
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE (Stages 1-3)
// ═══════════════════════════════════════════════════════════════
async function runPipeline(config) {
  console.log('\n-- Stage 1: PARSE --');
  const fd = {};
  for (const [role, fc] of Object.entries(config.files)) {
    if (role === 'geometry') continue;
    console.log('  ' + role + ' (' + fc.filename + ')...');
    fd[role] = await parseFile(config, role);
    console.log('    ' + fd[role].length + ' records');
  }
  // Dedup sales
  const sm = new Map();
  if (fd.sales) { for (const s of fd.sales) { if (!s.parcel_id) continue; const e=sm.get(s.parcel_id); if(!e||(s.last_sale_date&&s.last_sale_date>(e.last_sale_date||''))) sm.set(s.parcel_id,s); } console.log('  Sales deduped: '+fd.sales.length+' -> '+sm.size); }
  const locMap = new Map();
  if (fd.location) { for (const l of fd.location) { if(!l.parcel_id)continue; l.address_street=l.address_street||assembleStreet(l); l.address_city=titleCase(l.address_city||''); l.address_state=config.default_state||config.state||''; l.address_zip=(l.address_zip||'').trim(); if(l.address_street&&l.address_zip) l.address_full=l.address_street+', '+l.address_city+', '+l.address_state+' '+l.address_zip; locMap.set(l.parcel_id,l); } }
  const pm = new Map(); if (fd.parcels) { for (const p of fd.parcels) { if(p.parcel_id) pm.set(p.parcel_id,p); } }
  console.log('  Joining...');
  const src = fd.improvements || fd.location || [];
  const joined = [];
  for (const imp of src) {
    if (!imp.parcel_id) continue;
    const loc=locMap.get(imp.parcel_id)||{}, sale=sm.get(imp.parcel_id)||{}, par=pm.get(imp.parcel_id)||{};
    const lat=parseFloat(par.latitude)||parseFloat(loc.latitude)||null, lng=parseFloat(par.longitude)||parseFloat(loc.longitude)||null;
    const acres=parseFloat(par.total_net_acres||par.lot_acres||loc.lot_acres)||null;
    joined.push({...imp, address_street:loc.address_street||par.parcels_full_address||null, address_city:loc.address_city||titleCase(par.city_name||'')||null, address_state:loc.address_state||config.default_state||'', address_zip:loc.address_zip||par.parcels_zip||par.zip_code||null, address_full:loc.address_full||null, latitude:lat, longitude:lng, lot_sqft:acres?Math.round(acres*43560):null, last_sale_date:sale.last_sale_date||null, last_sale_price:sale.last_sale_price||null, est_market_value:parseFloat(par.total_actual_value)||null, subdivision_name:par.subdivision_name||null, fips_county:config.county_fips });
  }
  console.log('  Joined: ' + joined.length);
  const mapped = joined.map(r => applyMappings(r, config));
  console.log('\n-- Stage 2: VALIDATE --');
  const {valid,rejected,warnings} = validate(mapped);
  console.log('  Valid: '+valid.length+'  Rejected: '+rejected.length+'  Warnings: '+warnings.length);
  if (rejected.length) { const rr={}; rejected.forEach(r=>{rr[r.reason]=(rr[r.reason]||0)+1}); Object.entries(rr).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([r,c])=>console.log('    '+c+'x - '+r)); }
  console.log('\n-- Stage 3: COMPUTE --');
  const computed = valid.map(r => computeDerived(r, config));
  console.log('  Computed: ' + computed.length);
  printStats(computed);
  return computed;
}

// ═══════════════════════════════════════════════════════════════
// PARSING & MAPPING
// ═══════════════════════════════════════════════════════════════
function assembleStreet(loc) { const p=[]; ['house_number','direction_prefix','street_name','street_suffix'].forEach(k=>{const v=(loc[k]||'').trim();if(v)p.push(k==='house_number'||k==='direction_prefix'?v:titleCase(v))}); const u=(loc.unit||'').trim(); if(u)p.push('Unit '+u); return p.join(' '); }
function titleCase(s) { return s ? s.toLowerCase().replace(/(?:^|\s)\S/g,c=>c.toUpperCase()) : ''; }
function clean(v) { return (v||'').replace(/^"|"$/g,'').trim(); }

async function parseFile(config, role) {
  const fc = config.files[role]; if (!fc) return [];
  const fp = path.join(COUNTY_DIR, fc.filename);
  if (!fs.existsSync(fp)) { console.warn('    WARNING: '+fc.filename+' not found'); return []; }
  const cm=fc.column_map, recs=[]; let hSkip=false, hRow=null, lc=0;
  const rl = readline.createInterface({ input: fs.createReadStream(fp,{encoding:'utf8'}), crlfDelay: Infinity });
  for await (const line of rl) {
    lc++;
    if (fc.has_header && !hSkip) { hRow=parseLine(line,fc.delimiter||','); hSkip=true; continue; }
    const cols = parseLine(line, fc.delimiter||',');
    const rec = {};
    for (const [field, ref] of Object.entries(cm)) {
      let idx = typeof ref==='number' ? ref : (hRow ? hRow.indexOf(ref) : -1);
      if (idx>=0 && idx<cols.length) { let v=cols[idx]?.trim()||null; if(v&&v.startsWith('"')&&v.endsWith('"'))v=v.slice(1,-1); rec[field]=v; }
    }
    if (rec.parcel_id) recs.push(rec);
    if (lc%50000===0) process.stdout.write('    ...'+lc+' lines\r');
  }
  return recs;
}

function parseLine(line, d=',') { const r=[]; let c='',q=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'){if(q&&i+1<line.length&&line[i+1]==='"'){c+='"';i++}else q=!q}else if(ch===d&&!q){r.push(c);c=''}else c+=ch} r.push(c); return r; }

function applyMappings(r, config) {
  const m=config.value_mappings||{}, o={...r};
  if(m.property_type&&o.property_type) o.property_type=m.property_type[o.property_type]||o.property_type;
  if(m.quality_grade&&o.quality_grade){o.quality_grade_raw=o.quality_grade;o.assessor_quality=m.quality_grade[o.quality_grade]||'average';}
  o.agsf=parseFloat(o.agsf)||0; o.garage_sqft=parseFloat(o.garage_sqft)||0;
  o.basement_finished_sqft=parseFloat(o.basement_finished_sqft)||0; o.basement_unfinished_sqft=parseFloat(o.basement_unfinished_sqft)||0;
  o.bedrooms=Math.round(parseFloat(o.bedrooms)||0); o.bathrooms=Math.round(parseFloat(o.bathrooms)||0);
  o.year_built=parseInt(o.year_built)||null; o.stories=parseInt(o.stories)||null; o.lot_sqft=parseFloat(o.lot_sqft)||null;
  if((!o.stories||o.stories===0)&&o.style&&m.stories_from_style) o.stories=m.stories_from_style[o.style]||null;
  if(m.garage_type_inference){o.garage_type='none';for(const rule of m.garage_type_inference.rules){if(o.garage_sqft<=rule.max_sqft){o.garage_type=rule.value;break;}}}
  o.sqft_bg=o.basement_finished_sqft+o.basement_unfinished_sqft;
  const bf=(o.has_basement||'').trim().toUpperCase();
  if(bf==='N'||bf==='NO'){o.basement_type=o.sqft_bg>0?(o.basement_finished_sqft>0?'full':'crawl'):'slab';}
  else if(o.basement_finished_sqft>0&&o.basement_unfinished_sqft>0) o.basement_type='partial';
  else if(o.basement_finished_sqft>0) o.basement_type='full';
  else if(o.basement_unfinished_sqft>0) o.basement_type='full';
  else o.basement_type=(bf==='Y'||bf==='YES')?'crawl':'slab';
  if(o.last_sale_date&&typeof o.last_sale_date==='string'){const d=o.last_sale_date.split(' ')[0];const p=new Date(d);o.last_sale_date=isNaN(p.getTime())?null:p.toISOString().split('T')[0];}
  o.last_sale_price=parseFloat(o.last_sale_price)||null;
  return o;
}

function validate(recs) {
  const v=[],rj=[],w=[],seen=new Set();
  for(const r of recs){
    if(seen.has(r.parcel_id)){rj.push({parcel_id:r.parcel_id,reason:'DUPLICATE'});continue;} seen.add(r.parcel_id);
    if(!r.agsf||r.agsf<=0){rj.push({parcel_id:r.parcel_id,reason:'AGSF_ZERO_OR_NULL'});continue;}
    if(!r.address_full&&!r.address_street){rj.push({parcel_id:r.parcel_id,reason:'MISSING_ADDRESS'});continue;}
    if(!r.address_zip){rj.push({parcel_id:r.parcel_id,reason:'MISSING_ZIP'});continue;}
    if(r.agsf>4000&&r.sqft_bg>500) w.push({parcel_id:r.parcel_id,type:'POSSIBLE_TOTAL_SQFT'});
    if(!r.stories||r.stories===0){w.push({parcel_id:r.parcel_id,type:'MISSING_STORIES'});r.stories=1;}
    v.push(r);
  }
  return {valid:v,rejected:rj,warnings:w};
}

function computeDerived(r, config) {
  const o={...r}, g=config.derived_geometry||{}, s=o.stories||1;
  o.est_footprint_sqft=rnd(o.agsf/s);
  let ac=(g.aspect_correction||{}).default||1.10;
  if(o.property_type==='townhome')ac=(g.aspect_correction||{}).townhome||1.15;
  else if(s===1)ac=(g.aspect_correction||{})['1_story']||1.08;
  else ac=(g.aspect_correction||{})['2_story_garage']||1.12;
  o.est_perimeter_ft=rnd(Math.sqrt(o.est_footprint_sqft)*4*ac);
  o.est_roof_area_sqft=rnd(o.est_footprint_sqft*(g.default_pitch_factor||1.15)*(g.default_roof_complexity||1.10));
  let cf=(g.complexity_factor||{}).default||1.35; if(s===1)cf=(g.complexity_factor||{})['1_story_simple']||1.20;
  o.est_gutter_linear_ft=rnd(o.est_perimeter_ft*cf);
  o.zcta=o.address_zip;
  o.zcta_cluster=o.address_zip+'_'+(o.property_type||'sfh')+'_'+s+'s_'+(o.year_built?(o.year_built<2000?'pre2000':'post2000'):'unk');
  return o;
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD
// ═══════════════════════════════════════════════════════════════
async function uploadBatch(recs, env, mode) {
  console.log('\n-- Stage 4: UPLOAD ('+mode+') --');
  let ok=0,err=0; const t0=Date.now();
  for (let i=0; i<recs.length; i+=BATCH_SIZE) {
    const batch = recs.slice(i,i+BATCH_SIZE).map(r => {
      const row = toRow(r);
      if (mode==='refresh') { row.assessor_loaded_at=new Date().toISOString(); delete row.hydration_status; }
      return row;
    });
    const pref = mode==='refresh' ? 'return=minimal,resolution=merge-duplicates' : 'return=minimal';
    const res = await fetch(env.SUPABASE_URL+'/rest/v1/properties', {
      method:'POST', headers:{'Content-Type':'application/json','apikey':env.SUPABASE_SERVICE_ROLE_KEY,'Authorization':'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Prefer':pref},
      body:JSON.stringify(batch)
    });
    if(res.ok) ok+=batch.length; else { console.error('  Batch err: '+res.status+' - '+(await res.text()).substring(0,200)); err+=batch.length; }
    if((Math.floor(i/BATCH_SIZE)+1)%10===0||i+BATCH_SIZE>=recs.length) console.log('    '+Math.min(Math.round((i+BATCH_SIZE)/recs.length*100),100)+'% | '+ok+' ok, '+err+' err');
  }
  console.log('  Done: '+ok+' '+(mode==='refresh'?'upserted':'inserted')+', '+err+' errors in '+((Date.now()-t0)/1000).toFixed(1)+'s');
}

function toRow(r) {
  var zip5 = (r.address_zip || '').substring(0, 5) || null;
  return {
    parcel_id: r.parcel_id,
    address_full: r.address_full || ((r.address_street || '') + ', ' + (r.address_zip || '')),
    address_street: r.address_street || null,
    address_city: r.address_city || null,
    address_state: (r.address_state || '').substring(0, 2) || null,
    address_zip: zip5,
    zcta: zip5,
    latitude: r.latitude || null,
    longitude: r.longitude || null,
    fips_county: (r.fips_county || '').substring(0, 5) || null,
    year_built: r.year_built || null,
    stories_ag: r.stories || null,
    sqft_ag: r.agsf,
    sqft_bg: r.sqft_bg || null,
    sqft_bg_finished: r.basement_finished_sqft || null,
    bedrooms: r.bedrooms || null,
    bathrooms_full: r.bathrooms || null,
    exterior_wall_code: r.exterior_wall || null,
    roof_material_code: r.roof_material || null,
    heating_type: r.hvac_type || null,
    garage_type: r.garage_type || null,
    garage_sqft: r.garage_sqft || null,
    basement_type: r.basement_type || null,
    lot_sqft: r.lot_sqft || null,
    assessor_quality: r.assessor_quality || 'average',
    property_type: r.property_type || null,
    last_sale_date: r.last_sale_date || null,
    last_sale_price: r.last_sale_price || null,
    est_market_value: r.est_market_value || null,
    est_footprint_sqft: r.est_footprint_sqft || null,
    est_perimeter_ft: r.est_perimeter_ft || null,
    est_roof_area_sqft: r.est_roof_area_sqft || null,
    est_gutter_linear_ft: r.est_gutter_linear_ft || null,
    zcta_cluster: r.zcta_cluster || null,
    data_source_primary: COUNTY + '_assessor',
    hydration_status: 'tier_a_complete'
  };
}

// ═══════════════════════════════════════════════════════════════
// GOLDEN SET, STATS, PREVIEW, UTILS
// ═══════════════════════════════════════════════════════════════
function searchGoldenSet(recs) {
  console.log('\n-- Golden Set Search --');
  const terms=['TREETOP','HAYSTACK','TRAILBLAZER','MAYOTTE','BELLAVISTA','KEEPSAKE','BLACK CANYON','DREAMCATCHER','NEZ PERCE','AMBER','ROSE PETAL','EAGLESONG','FOREVER','HARDIN','RISING MOON','DRAGONFLY','SPRINGMEADOW','MALDIVES','CHENEY','MILLER','CHAMPION','CARSON','HIGHWAY 83','HWY 83'];
  const nums=new Set(['15720','244','276','320','1923','1999','2154','2159','2168','2182','2379','2490','2559','2625','2633','2683','2751','2788','2796','3105','3132','3179','3300','3310','3469','3496','3502','3638','3642','3911','4033','44']);
  const matches=[];
  for(const r of recs){const st=(r.address_street||'').toUpperCase(); if(terms.some(t=>st.includes(t))){const n=st.match(/^(\d+)\s/)?.[1]; if(n&&nums.has(n))matches.push(r);}}
  matches.sort((a,b)=>(a.address_full||'').localeCompare(b.address_full||''));
  for(const r of matches) console.log('  '+(r.address_full||'?').padEnd(52)+' AGSF:'+String(r.agsf).padStart(5)+' Bed:'+r.bedrooms+' Q:'+(r.quality_grade_raw||r.assessor_quality||'?').padEnd(12)+' Sto:'+r.stories+' BF:'+r.basement_finished_sqft+' BU:'+r.basement_unfinished_sqft+' Gar:'+r.garage_sqft+' Yr:'+r.year_built);
  console.log('  Found: '+matches.length+'/32 (out-of-market properties wont match: Rexburg ID, CO Springs, Aurora)');
}

function printStats(recs) {
  console.log('\n-- SUMMARY --');
  console.log('  Total: '+recs.length);
  const t={}; recs.forEach(r=>{const k=r.property_type||'?';t[k]=(t[k]||0)+1});
  console.log('  Types:'); Object.entries(t).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('    '+k+': '+v));
  const z={}; recs.forEach(r=>{const k=r.address_zip||'?';z[k]=(z[k]||0)+1});
  console.log('  ZIPs:'); Object.entries(z).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v])=>console.log('    '+k+': '+v));
  console.log('  Lat/lng: '+recs.filter(r=>r.latitude).length+'/'+recs.length);
  console.log('  Addresses: '+recs.filter(r=>r.address_full).length+'/'+recs.length);
}

async function previewFiles(config) {
  console.log('\n-- PREVIEW --');
  for(const [role,fc] of Object.entries(config.files)){
    if(role==='geometry')continue;
    const fp=path.join(COUNTY_DIR,fc.filename);
    if(!fs.existsSync(fp)){console.log('  '+fc.filename+': NOT FOUND');continue;}
    console.log('\n'+'-'.repeat(70)+'\n'+role.toUpperCase()+': '+fc.filename+'\n'+'-'.repeat(70));
    const rl=readline.createInterface({input:fs.createReadStream(fp,{encoding:'utf8'}),crlfDelay:Infinity});
    let c=0,hRow=null;
    for await(const line of rl){
      if(fc.has_header&&c===0){hRow=parseLine(line,fc.delimiter||',');c++;continue;}
      if(c>=4)break;
      const cols=parseLine(line,fc.delimiter||',');
      console.log('\n  Row '+c+' ('+cols.length+' cols):');
      for(const[f,ref]of Object.entries(fc.column_map)){
        let idx=typeof ref==='number'?ref:(hRow?hRow.indexOf(ref):-1);
        if(idx>=0&&idx<cols.length){let v=clean(cols[idx]);if(v.length>50)v=v.substring(0,50)+'...';console.log('    '+f.padEnd(30)+'['+String(idx).padStart(3)+'] = "'+v+'"');}
      }
      c++;
    }
  }
  console.log('\n'+'='.repeat(70)+'\nVerify, then: node gleam_etl.js --county '+COUNTY+' --mode dry-run\n'+'='.repeat(70));
}

function rnd(n){return Math.round(n*10)/10}
function parseArgs(a){const o={};for(let i=0;i<a.length;i++){if(a[i].startsWith('--')&&i+1<a.length){o[a[i].substring(2)]=a[i+1];i++}}return o}
function loadEnv(p){const e={};if(!fs.existsSync(p))return e;for(const l of fs.readFileSync(p,'utf8').split('\n')){const t=l.trim();if(!t||t.startsWith('#'))continue;const q=t.indexOf('=');if(q>0)e[t.substring(0,q).trim()]=t.substring(q+1).trim()}return e}

main().catch(e=>{console.error('FATAL:',e);process.exit(1)});
