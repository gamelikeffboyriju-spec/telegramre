// api/index.js - BRONX OSINT v11 - KILLER LUXURY + PERMANENT REDIS STORAGE
const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = 'bronx';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'BRONX_ULTRA';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BRONX@2026#OWNER';

// ========== UPSTASH REDIS CONFIG ==========
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://inspired-boa-113876.upstash.io';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'ggAAAAAAAbzUAAIgcDK9UwWhFQIuPQyBNiogt3it9dRhMOs8WCQCerXQbnRIcw';

// Redis helper functions
async function redisGet(key) {
    try {
        const res = await axios.get(`${REDIS_URL}/get/${key}`, {
            headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` },
            timeout: 5000
        });
        return res.data.result ? JSON.parse(res.data.result) : null;
    } catch (e) { console.log('Redis GET error:', e.message); return null; }
}

async function redisSet(key, value) {
    try {
        await axios.post(`${REDIS_URL}/set/${key}`, JSON.stringify(value), {
            headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` },
            timeout: 5000
        });
        return true;
    } catch (e) { console.log('Redis SET error:', e.message); return false; }
}

async function redisDel(key) {
    try {
        await axios.post(`${REDIS_URL}/del/${key}`, '', {
            headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` },
            timeout: 5000
        });
        return true;
    } catch (e) { return false; }
}

// ========== MEMORY STORAGE ==========
let keyStorage = {};
let customAPIs = [];
let requestLogs = [];
let adminSessions = {};
let permanentTokens = {};

// ========== PERSISTENCE FUNCTIONS ==========
async function saveData() {
    await redisSet('bronx_keys', keyStorage);
    await redisSet('bronx_custom_apis', customAPIs);
    await redisSet('bronx_logs', requestLogs.slice(-100));
    await redisSet('bronx_tokens', permanentTokens);
}

async function loadData() {
    console.log('📥 Loading data from Redis...');
    const keys = await redisGet('bronx_keys');
    const apis = await redisGet('bronx_custom_apis');
    const logs = await redisGet('bronx_logs');
    const tokens = await redisGet('bronx_tokens');
    
    if (keys) { keyStorage = keys; console.log('✅ Keys loaded:', Object.keys(keyStorage).length); }
    else { initDefaultData(); console.log('📝 Default keys created'); }
    
    if (apis) { customAPIs = apis; console.log('✅ Custom APIs loaded:', customAPIs.length); }
    else { initCustomAPIs(); console.log('📝 Default custom APIs created'); }
    
    if (logs) { requestLogs = logs; console.log('✅ Logs loaded:', requestLogs.length); }
    if (tokens) { 
        permanentTokens = tokens; 
        Object.entries(permanentTokens).forEach(([token, data]) => {
            adminSessions[token] = { expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), permanent: true };
        });
        console.log('✅ Permanent tokens restored:', Object.keys(permanentTokens).length);
    }
    
    await saveData();
}

function initDefaultData() {
    const now = getIndiaDateTime();
    keyStorage = {};
    keyStorage['BRONX_ULTRA_MASTER_2026'] = {
        name: '👑 BRONX ULTRA OWNER', scopes: ['*'], type: 'owner', limit: 999999, used: 0,
        expiry: null, expiryStr: 'LIFETIME', created: now, resetType: 'never', unlimited: true, hidden: true
    };
    keyStorage['DEMO_KEY_2026'] = {
        name: '🎁 Demo User', scopes: ['number', 'aadhar', 'pincode'], type: 'demo', limit: 10, used: 0,
        expiry: parseExpiryDate('31-12-2026'), expiryStr: '31-12-2026', created: now, resetType: 'never', unlimited: false, hidden: false
    };
}

function initCustomAPIs() {
    customAPIs = [
        { id: 1, name: 'Number Info backup ✅', endpoint: 'rajput-api', param: 'num', example: '9876543210', desc: 'India Number Lookup Vip Bronx api', category: '🔧 Custom APIs', visible: true, realAPI: 'https://rajput-api.vercel.app/search?num={param}' },
        { id: 2, name: 'Vehicle Details Api 🚕', endpoint: 'rc-details', param: 'ca_number', example: 'MH02FZ0555', desc: 'Vehicle RC Details Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-rc-api.vercel.app/?ca_number={param}' },
        { id: 3, name: 'Adhar Detail api', endpoint: 'aadhar-details', param: 'aadhar', example: '393933081942', desc: 'Aadhar Number Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-adhar-api.vercel.app/aadhar={param}' },
        { id: 4, name: '📧 Email Lookup API', endpoint: 'email-lookup', param: 'mail', example: 'user@gmail.com', desc: 'Email Information Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-mail-api.vercel.app/mail={param}' },
        { id: 5, name: '📲 Telegram Number API', endpoint: 'telegram-num', param: 'id', example: '7530266953', desc: 'Telegram Number Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'http://45.91.248.51:3000/api/tgnum?id={param}' },
        { id: 6, name: 'Custom API 6', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
        { id: 7, name: 'Custom API 7', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
        { id: 8, name: 'Custom API 8', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
        { id: 9, name: 'Custom API 9', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
        { id: 10, name: 'Custom API 10', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' }
    ];
}

// ========== INDIA TIME HELPERS ==========
function getIndiaTime() { return new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000); }
function getIndiaDate() { return getIndiaTime().toISOString().split('T')[0]; }
function getIndiaDateTime() { return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19); }

// ========== EXPIRY CHECK ==========
function isKeyExpired(expiryDate) { return expiryDate ? getIndiaTime() > new Date(expiryDate) : false; }
function parseExpiryDate(dateStr) {
    if (!dateStr || dateStr === 'LIFETIME' || dateStr === 'NEVER') return null;
    const parts = dateStr.split('-');
    if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59, 999);
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 23, 59, 59, 999);
}

// ========== KEY MANAGEMENT ==========
function checkKeyValid(apiKey) {
    const kd = keyStorage[apiKey];
    if (!kd) return { valid: false, error: '❌ Invalid API Key' };
    if (kd.expiry && isKeyExpired(kd.expiry)) return { valid: false, error: '⏰ Key Expired', expired: true };
    if (!kd.unlimited && kd.used >= kd.limit) return { valid: false, error: '🛑 Limit Exhausted', limitExhausted: true };
    return { valid: true, keyData: kd };
}
function incrementKeyUsage(apiKey) { if (keyStorage[apiKey] && !keyStorage[apiKey].unlimited) keyStorage[apiKey].used++; return keyStorage[apiKey]; }
function checkKeyScope(kd, ep) { return kd.scopes.includes('*') || kd.scopes.includes(ep) ? { valid: true } : { valid: false, error: `❌ Scope denied` }; }
function logRequest(key, ep, param, status, ip, ua) {
    requestLogs.push({ timestamp: getIndiaDateTime(), key: key ? key.substring(0, 10) + '...' : 'unknown', endpoint: ep, param, status, ip: ip || 'unknown', browser: ua || 'Unknown' });
    if (requestLogs.length > 500) requestLogs = requestLogs.slice(-500);
}

// ========== ADMIN AUTH ==========
function generateToken() { let t = ''; const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; for (let i = 0; i < 40; i++) t += c.charAt(Math.floor(Math.random() * c.length)); return t; }
function isAdminAuth(token) {
    if (!token || !adminSessions[token]) return false;
    if (Date.now() > adminSessions[token].expiresAt) { delete adminSessions[token]; return false; }
    return true;
}

// ========== DATA SANITIZER ==========
function sanitizeResponse(data) {
    if (!data) return data;
    const cleaned = JSON.parse(JSON.stringify(data));
    (function clean(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(clean); return; }
        ['by','channel','BY','CHANNEL','developer','Developer','api_key','apikey','real_url','source_url','internal_url','server_ip','host','proxy'].forEach(f => delete obj[f]);
        Object.keys(obj).forEach(k => { if (obj[k] && typeof obj[k] === 'object') clean(obj[k]); });
    })(cleaned);
    cleaned.by = "@BRONX_ULTRA"; cleaned.powered_by = "BRONX OSINT API";
    return cleaned;
}
function getBrowser(ua) { if (!ua) return 'Unknown'; if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'; if (ua.includes('Firefox')) return 'Firefox'; return 'Other'; }

// ========== ENDPOINTS ==========
const endpoints = {
    number: { param: 'num', cat: 'phone', icon: '📱', example: '9876543210', desc: 'Indian Mobile Number Lookup' },
    aadhar: { param: 'num', cat: 'phone', icon: '🆔', example: '393933081942', desc: 'Aadhaar Number Lookup' },
    name: { param: 'name', cat: 'phone', icon: '🔍', example: 'abhiraaj', desc: 'Name to Records Search' },
    numv2: { param: 'num', cat: 'phone', icon: '📱', example: '6205949840', desc: 'Number Info v2' },
    adv: { param: 'num', cat: 'phone', icon: '📱', example: '9876543210', desc: 'Advanced Phone Lookup' },
    adharfamily: { param: 'num', cat: 'phone', icon: '👨‍👩‍👧‍👦', example: '984154610245', desc: 'Aadhar Family Details' },
    adharration: { param: 'num', cat: 'phone', icon: '📋', example: '701984830542', desc: 'Aadhar Ration Card' },
    imei: { param: 'imei', cat: 'phone', icon: '📱', example: '357817383506298', desc: 'IMEI Number Lookup' },
    calltracer: { param: 'num', cat: 'phone', icon: '📞', example: '9876543210', desc: 'Call Tracer Lookup' },
    upi: { param: 'upi', cat: 'finance', icon: '💰', example: 'example@ybl', desc: 'UPI ID Verification' },
    ifsc: { param: 'ifsc', cat: 'finance', icon: '🏦', example: 'SBIN0001234', desc: 'IFSC Code Details' },
    pan: { param: 'pan', cat: 'finance', icon: '📄', example: 'AXDPR2606K', desc: 'PAN to GST Search' },
    pincode: { param: 'pin', cat: 'location', icon: '📍', example: '110001', desc: 'Pincode Details' },
    ip: { param: 'ip', cat: 'location', icon: '🌐', example: '8.8.8.8', desc: 'IP Lookup' },
    vehicle: { param: 'vehicle', cat: 'vehicle', icon: '🚗', example: 'MH02FZ0555', desc: 'Vehicle Registration' },
    rc: { param: 'owner', cat: 'vehicle', icon: '📋', example: 'UP92P2111', desc: 'RC Owner Details' },
    ff: { param: 'uid', cat: 'gaming', icon: '🎮', example: '123456789', desc: 'Free Fire Info' },
    bgmi: { param: 'uid', cat: 'gaming', icon: '🎮', example: '5121439477', desc: 'BGMI Info' },
    insta: { param: 'username', cat: 'social', icon: '📸', example: 'cristiano', desc: 'Instagram Profile' },
    git: { param: 'username', cat: 'social', icon: '💻', example: 'ftgamer2', desc: 'GitHub Profile' },
    tg: { param: 'info', cat: 'social', icon: '📲', example: 'JAUUOWNER', desc: 'Telegram Lookup' },
    tgidinfo: { param: 'id', cat: 'social', icon: '📲', example: '7530266953', desc: 'Telegram ID Info' },
    snap: { param: 'username', cat: 'social', icon: '👻', example: 'priyapanchal272', desc: 'Snapchat Lookup' },
    pk: { param: 'num', cat: 'pakistan', icon: '🇵🇰', example: '03331234567', desc: 'Pakistan Number v1' },
    pkv2: { param: 'num', cat: 'pakistan', icon: '🇵🇰', example: '3359736848', desc: 'Pakistan Number v2' }
};

const allScopes = [
    { v: '*', l: '🌟 ALL' },{ v: 'number', l: '📱 Number' },{ v: 'numv2', l: '📱 v2' },{ v: 'adv', l: '📱 Adv' },
    { v: 'aadhar', l: '🆔 Aadhar' },{ v: 'adharfamily', l: '👨‍👩‍👧‍👦 Family' },{ v: 'adharration', l: '📋 Ration' },
    { v: 'name', l: '🔍 Name' },{ v: 'upi', l: '💰 UPI' },{ v: 'ifsc', l: '🏦 IFSC' },{ v: 'pan', l: '📄 PAN' },
    { v: 'pincode', l: '📍 Pin' },{ v: 'ip', l: '🌐 IP' },{ v: 'vehicle', l: '🚗 Vehicle' },{ v: 'rc', l: '📋 RC' },
    { v: 'ff', l: '🎮 FF' },{ v: 'bgmi', l: '🎮 BGMI' },{ v: 'insta', l: '📸 Insta' },{ v: 'git', l: '💻 Git' },
    { v: 'tg', l: '📲 TG' },{ v: 'tgidinfo', l: '📲 TG ID' },{ v: 'snap', l: '👻 Snap' },{ v: 'imei', l: '📱 IMEI' },
    { v: 'calltracer', l: '📞 Call' },{ v: 'pk', l: '🇵🇰 PK' },{ v: 'pkv2', l: '🇵🇰 PK v2' }
];

// ========== LUXURY THEME COLORS ==========
const luxuryColors = {
    gold: '#d4a574', rose: '#e8b4b8', platinum: '#e5e4e2', diamond: '#b9f2ff',
    emerald: '#50c878', sapphire: '#0f52ba', amethyst: '#9966cc', ruby: '#e0115f',
    onyx: '#353839', obsidian: '#1a1a1a', midnight: '#0a0a1a'
};

// ========== RENDER HOME (LUXURY THEME) ==========
function renderHome() {
    const vapis = customAPIs.filter(a => a.visible && a.endpoint);
    const cats = {};
    Object.entries(endpoints).forEach(([n, e]) => {
        if (!cats[e.cat]) cats[e.cat] = [];
        cats[e.cat].push({n, ...e});
    });
    
    const catNames = { phone: '📱 Phone Intelligence', finance: '💰 Financial APIs', location: '📍 Location Services', vehicle: '🚗 Vehicle Lookup', gaming: '🎮 Gaming Intelligence', social: '🌐 Social OSINT', pakistan: '🇵🇰 Pakistan Data' };
    const catColors = { phone: '#d4a574', finance: '#50c878', location: '#0f52ba', vehicle: '#e0115f', gaming: '#9966cc', social: '#e8b4b8', pakistan: '#b9f2ff' };
    
    let epsHTML = '';
    Object.entries(catNames).forEach(([key, name]) => {
        if (!cats[key]) return;
        const cc = catColors[key];
        epsHTML += `<div class="cat-sec">
            <div class="cat-head" style="border-left:3px solid ${cc}">
                <div class="cat-dot" style="background:${cc};box-shadow:0 0 15px ${cc}"></div>
                <h3 style="background:linear-gradient(135deg,${cc},#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${name}</h3>
                <span class="cat-badge" style="border-color:${cc};color:${cc}">${cats[key].length} APIs</span>
            </div>
            <div class="ep-grid">${cats[key].map(e => `
                <div class="ep-card" onclick="copyUrl('${e.n}','${e.param}','${e.example}')" style="border-top:2px solid ${cc}">
                    <div class="ep-glow" style="background:radial-gradient(circle at 50% 0%,${cc}15,transparent 70%)"></div>
                    <div class="ep-inner">
                        <div class="ep-badge-row"><span class="ep-badge" style="background:${cc}20;color:${cc};border-color:${cc}40">GET</span><span class="ep-icon">${e.icon}</span></div>
                        <h4>/${e.n}</h4><p>${e.desc}</p>
                        <div class="ep-param"><code style="color:${cc}">${e.param}</code><span>=</span><code>${e.example}</code></div>
                    </div>
                </div>`).join('')}</div>
        </div>`;
    });
    
    if (vapis.length) {
        epsHTML += `<div class="cat-sec">
            <div class="cat-head" style="border-left:3px solid #ff9100">
                <div class="cat-dot" style="background:#ff9100;box-shadow:0 0 15px #ff9100"></div>
                <h3 style="background:linear-gradient(135deg,#ff9100,#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent">🔧 Custom Integrations</h3>
                <span class="cat-badge" style="border-color:#ff9100;color:#ff9100">${vapis.length} APIs</span>
            </div>
            <div class="ep-grid">${vapis.map(a => `
                <div class="ep-card" onclick="copyUrlC('${a.endpoint}','${a.param}','${a.example}')" style="border-top:2px solid #ff9100">
                    <div class="ep-glow" style="background:radial-gradient(circle at 50% 0%,#ff910015,transparent 70%)"></div>
                    <div class="ep-inner">
                        <div class="ep-badge-row"><span class="ep-badge" style="background:#ff910020;color:#ff9100;border-color:#ff910040">CUSTOM</span><span>🔧</span></div>
                        <h4>/${a.endpoint}</h4><p>${a.desc}</p>
                        <div class="ep-param"><code style="color:#ff9100">${a.param}</code><span>=</span><code>${a.example}</code></div>
                    </div>
                </div>`).join('')}</div>
        </div>`;
    }
    
    const te = Object.keys(endpoints).length + vapis.length;
    const tk = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX OSINT — Luxury Intelligence</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700;800&display=swap" rel="stylesheet"><style>
:root{--bg:#050510;--c1:#0a0a1a;--c2:#0f0f20;--c3:#151528;--b1:#1e1e35;--b2:#2a2a45;--t1:#f0f0f5;--t2:#a0a0bb;--t3:#555580;--gold:#d4a574;--rose:#e8b4b8;--emerald:#50c878;--sapphire:#0f52ba;--ruby:#e0115f;--amethyst:#9966cc;--diamond:#b9f2ff}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--t1);font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 0%,#0f52ba08 0%,transparent 50%),radial-gradient(ellipse at 80% 0%,#e0115f08 0%,transparent 50%),radial-gradient(ellipse at 50% 100%,#d4a57408 0%,transparent 50%);pointer-events:none;z-index:0}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:linear-gradient(var(--gold),var(--ruby));border-radius:10px}
.hero{position:relative;padding:80px 30px 60px;text-align:center;overflow:hidden;z-index:1}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#d4a57410,#e8b4b808,transparent 60%);z-index:0}
.hero-orb{position:absolute;border-radius:50%;filter:blur(120px);opacity:0.04;animation:orb 12s ease-in-out infinite}
.hero-orb:nth-child(1){width:600px;height:600px;background:var(--gold);top:-250px;left:-150px}
.hero-orb:nth-child(2){width:500px;height:500px;background:var(--ruby);top:-150px;right:-150px;animation-delay:-4s}
.hero-orb:nth-child(3){width:400px;height:400px;background:var(--sapphire);bottom:-150px;left:30%;animation-delay:-8s}
@keyframes orb{0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(40px,-30px)scale(1.1)}66%{transform:translate(-30px,25px)scale(0.9)}}
.hc{position:relative;z-index:2;max-width:750px;margin:0 auto}
.aw{position:relative;display:inline-block;margin-bottom:30px}
.ar{position:absolute;inset:-8px;border-radius:50%;background:conic-gradient(var(--gold),var(--rose),var(--ruby),var(--emerald),var(--sapphire),var(--amethyst),var(--gold));animation:rspin 4s linear infinite;filter:blur(2px)}
.ar::after{content:'';position:absolute;inset:4px;background:var(--bg);border-radius:50%}
@keyframes rspin{0%{transform:rotate(0deg);filter:hue-rotate(0deg) blur(2px)}100%{transform:rotate(360deg);filter:hue-rotate(360deg) blur(2px)}}
.ai{width:140px;height:140px;border-radius:50%;object-fit:cover;display:block;position:relative;z-index:1;border:3px solid #1a1a2e;box-shadow:0 0 40px rgba(212,167,116,0.2),0 0 80px rgba(212,167,116,0.1)}
.ht{font-size:52px;font-weight:900;letter-spacing:-2px;margin-bottom:8px;font-family:'Playfair Display',serif;background:linear-gradient(135deg,var(--gold) 0%,var(--rose) 25%,#fff 50%,var(--diamond) 75%,var(--gold) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-shadow:none;filter:drop-shadow(0 0 30px rgba(212,167,116,0.3))}
.hs{font-size:20px;font-weight:600;letter-spacing:3px;text-transform:uppercase;background:linear-gradient(90deg,var(--gold),var(--rose),var(--diamond));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}
.hd{font-size:14px;color:var(--t3);letter-spacing:1px;margin-bottom:25px}
.htg{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}
.ht1{padding:10px 22px;border-radius:50px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:1px solid;cursor:default;transition:all 0.4s;backdrop-filter:blur(10px)}
.ht1:hover{transform:translateY(-3px)}
.tg{border-color:var(--gold);color:var(--gold);box-shadow:0 0 15px rgba(212,167,116,0.15)}.tg:hover{box-shadow:0 0 30px rgba(212,167,116,0.4)}
.tr{border-color:var(--ruby);color:var(--ruby);box-shadow:0 0 15px rgba(224,17,95,0.15)}.tr:hover{box-shadow:0 0 30px rgba(224,17,95,0.4)}
.ts{border-color:var(--sapphire);color:var(--sapphire);box-shadow:0 0 15px rgba(15,82,186,0.15)}.ts:hover{box-shadow:0 0 30px rgba(15,82,186,0.4)}
.te{border-color:var(--emerald);color:var(--emerald);box-shadow:0 0 15px rgba(80,200,120,0.15)}.te:hover{box-shadow:0 0 30px rgba(80,200,120,0.4)}
.ct{max-width:1320px;margin:0 auto;padding:0 25px;position:relative;z-index:1}
.sb{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;padding:28px;margin:-35px auto 40px;max-width:800px;background:rgba(15,15,32,0.9);border:1px solid var(--b1);border-radius:16px;z-index:5;backdrop-filter:blur(30px);box-shadow:0 15px 60px rgba(0,0,0,0.5)}
.si{text-align:center;min-width:80px;flex:1}.sv{font-size:36px;font-weight:900;background:linear-gradient(135deg,var(--gold),var(--rose));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.sl{font-size:9px;text-transform:uppercase;letter-spacing:2.5px;color:var(--t3);margin-top:4px;font-weight:700}.sdiv{width:1px;background:var(--b2);align-self:stretch;margin:5px 0}
.pg{background:var(--c1);border:1px solid var(--b1);border-radius:16px;padding:28px;margin-bottom:40px;position:relative;overflow:hidden}
.pg::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),var(--rose),var(--sapphire),transparent)}
.pgh{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.pgd{width:10px;height:10px;background:var(--gold);border-radius:50%;box-shadow:0 0 15px var(--gold);animation:dp 2s ease-in-out infinite}
@keyframes dp{0%,100%{box-shadow:0 0 10px var(--gold)}50%{box-shadow:0 0 25px var(--gold),0 0 40px rgba(212,167,116,0.5)}}
.pgh h3{font-size:18px;font-weight:700;color:var(--t1)}
.pgf{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.pgf select,.pgf input{flex:1;min-width:160px;padding:14px 18px;background:var(--bg);border:1px solid var(--b2);border-radius:12px;color:var(--t1);font-size:13px;font-family:'SF Mono',monospace;transition:all 0.3s;outline:none}
.pgf select:focus,.pgf input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,167,116,0.08),0 0 20px rgba(212,167,116,0.05)}
.br{padding:14px 32px;background:linear-gradient(135deg,var(--gold),var(--rose));color:#000;border:none;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;letter-spacing:0.5px;transition:all 0.3s;white-space:nowrap;font-family:inherit;box-shadow:0 0 20px rgba(212,167,116,0.2)}
.br:hover{transform:translateY(-2px);box-shadow:0 0 40px rgba(212,167,116,0.4)}
.rb{margin-top:18px;background:#020210;border:1px solid var(--b1);border-radius:12px;padding:18px;max-height:350px;overflow:auto;font-family:'SF Mono',monospace;font-size:12px;display:none;white-space:pre-wrap;color:var(--gold)}
.cat-sec{margin-bottom:50px}
.cat-head{display:flex;align-items:center;gap:12px;margin-bottom:22px;padding:10px 0 14px 16px;border-left:3px solid transparent}
.cat-dot{width:8px;height:8px;border-radius:50%}
.cat-head h3{font-size:20px;font-weight:700;letter-spacing:-0.5px}
.cat-badge{padding:4px 14px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:1px solid}
.ep-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
.ep-card{background:var(--c1);border:1px solid var(--b1);border-radius:14px;cursor:pointer;transition:all 0.4s;position:relative;overflow:hidden;border-top:2px solid transparent}
.ep-card:hover{background:var(--c2);transform:translateY(-4px);box-shadow:0 15px 50px rgba(0,0,0,0.4)}
.ep-glow{position:absolute;inset:0;opacity:0;transition:opacity 0.4s;pointer-events:none;z-index:0}
.ep-card:hover .ep-glow{opacity:1}
.ep-inner{position:relative;z-index:1;padding:22px 24px}
.ep-badge-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.ep-badge{padding:4px 14px;border-radius:6px;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;border:1px solid}
.ep-icon{font-size:22px}.ep-card h4{font-size:19px;font-weight:700;color:var(--t1);margin-bottom:4px}.ep-card p{font-size:12px;color:var(--t2);margin-bottom:12px}
.ep-param{display:flex;align-items:center;gap:6px;font-family:'SF Mono',monospace;font-size:12px}
.ep-param span{color:var(--t3)}.ep-param code:last-child{color:var(--t2)}
.ft{text-align:center;padding:50px 20px;border-top:1px solid var(--b1);margin-top:30px;position:relative;z-index:1}
.ft::before{content:'';position:absolute;top:1px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--gold),var(--rose),transparent);opacity:0.5}
.fb{font-size:22px;font-weight:800;font-family:'Playfair Display',serif;background:linear-gradient(135deg,var(--gold),var(--rose));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.fi{font-size:12px;color:var(--t3);margin-top:6px}.fl{color:var(--t2);text-decoration:none}.fl:hover{color:var(--gold)}
.toast{position:fixed;bottom:30px;right:30px;background:var(--c1);color:var(--gold);padding:14px 24px;border-radius:12px;font-size:13px;font-weight:600;border:1px solid rgba(212,167,116,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;box-shadow:0 10px 50px rgba(0,0,0,0.6);pointer-events:none}
@media(max-width:768px){.ht{font-size:32px}.ai{width:100px;height:100px}.ep-grid{grid-template-columns:1fr}}
</style></head><body>
<div class="hero-orb"></div><div class="hero-orb"></div><div class="hero-orb"></div>
<header class="hero"><div class="hc"><div class="aw"><div class="ar"></div><img src="https://i.ibb.co/YTjW35Hs/file-000000007b0872069c1067c615adaa48.png" alt="BRONX" class="ai" onerror="this.style.display='none'"></div><h1 class="ht">BRONX OSINT</h1><p class="hs">Luxury Intelligence Suite</p><p class="hd">Premium OSINT Platform · Fort Knox Security · Real-Time Data</p><div class="htg"><span class="ht1 tg">💎 Luxury</span><span class="ht1 tr">🛡️ Military Grade</span><span class="ht1 ts">⚡ Quantum Speed</span><span class="ht1 te">🌟 Elite Access</span></div></div></header>
<div class="ct"><div class="sb"><div class="si"><div class="sv">${te}</div><div class="sl">Endpoints</div></div><div class="sdiv"></div><div class="si"><div class="sv">${tk}</div><div class="sl">Active Keys</div></div><div class="sdiv"></div><div class="si"><div class="sv">JSON</div><div class="sl">Response</div></div><div class="sdiv"></div><div class="si"><div class="sv">26+</div><div class="sl">APIs</div></div></div>
<div class="pg"><div class="pgh"><div class="pgd"></div><h3>API Playground</h3></div><div class="pgf"><select id="es"><option value="">Select Endpoint</option>${Object.entries(endpoints).map(([n,e])=>'<option value="'+n+'">'+e.icon+' '+n.toUpperCase()+' — '+e.desc+'</option>').join('')}${vapis.length>0?vapis.map(a=>'<option value="c_'+a.id+'" data-c="1" data-ep="'+a.endpoint+'" data-p="'+a.param+'">🔧 '+a.name+'</option>').join(''):''}</select><input type="text" id="ak" placeholder="API Key"><input type="text" id="pv" placeholder="Parameter"><button class="br" onclick="ta()">Execute</button></div><div class="rb" id="rb"></div></div>
${epsHTML}</div>
<footer class="ft"><p class="fb">BRONX OSINT</p><p class="fi">Powered by <strong>@BRONX_ULTRA</strong> · India (IST) · <a href="/admin" class="fl">Admin Panel</a></p></footer>
<script>const ep=${JSON.stringify(endpoints)};function copyUrl(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/key-bronx/'+e+'?key=KEY&'+p+'='+ex);st('✓ Copied')}function copyUrlC(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/custom/'+e+'?key=KEY&'+p+'='+ex);st('✓ Copied')}function st(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2200)}async function ta(){const s=document.getElementById('es');const o=s.options[s.selectedIndex];const ic=o.dataset.c==='1';const k=document.getElementById('ak').value;const v=document.getElementById('pv').value;const r=document.getElementById('rb');if(!k||!v||!s.value){st('⚠️ Fill all');return}let url=ic?'/api/custom/'+o.dataset.ep+'?key='+k+'&'+o.dataset.p+'='+v:'/api/key-bronx/'+s.value+'?key='+k+'&'+ep[s.value].param+'='+v;r.style.display='block';r.textContent='⏳ Executing...';r.style.color='#888';try{const re=await fetch(url);const d=await re.json();r.textContent=JSON.stringify(d,null,2);r.style.color='#d4a574'}catch(e){r.textContent='Error: '+e.message;r.style.color='#e0115f'}}</script></body></html>`;
}

// ========== RENDER ADMIN ==========
function renderAdminLogin() { return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX — Admin</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#050510;min-height:100vh;display:flex;justify-content:center;align-items:center;font-family:'Inter',sans-serif;background-image:radial-gradient(ellipse at center,#d4a57408,transparent 70%)}.lb{background:#0a0a1a;border:1px solid #1e1e35;border-radius:20px;padding:50px 45px;width:440px;box-shadow:0 25px 80px rgba(0,0,0,0.6);position:relative;overflow:hidden}.lb::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#d4a574,#e8b4b8,#0f52ba,transparent)}.li{width:65px;height:65px;background:rgba(212,167,116,0.06);border:2px solid rgba(212,167,116,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;font-size:28px;box-shadow:0 0 30px rgba(212,167,116,0.1)}.lb h2{text-align:center;color:#fff;font-size:26px;font-weight:800;font-family:'Playfair Display',serif;margin-bottom:4px}.ls{text-align:center;color:#555580;font-size:12px;letter-spacing:1px;margin-bottom:30px}.fg{margin-bottom:18px}.fg label{display:block;color:#888;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:7px;font-weight:700}.fg input{width:100%;padding:14px 18px;background:#050510;border:1px solid #2a2a45;border-radius:12px;color:#e0e0e0;font-size:14px;font-family:inherit;transition:all 0.3s;outline:none}.fg input:focus{border-color:#d4a574;box-shadow:0 0 0 3px rgba(212,167,116,0.06)}.bl{width:100%;padding:15px;background:linear-gradient(135deg,#d4a574,#e8b4b8);color:#000;border:none;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:1px;transition:all 0.3s;font-family:inherit;margin-top:8px;box-shadow:0 0 25px rgba(212,167,116,0.2)}.bl:hover{transform:translateY(-2px);box-shadow:0 0 45px rgba(212,167,116,0.4)}.err{color:#e0115f;text-align:center;margin-top:14px;font-size:13px;display:none}.bk{text-align:center;margin-top:20px}.bk a{color:#555580;text-decoration:none;font-size:12px}.bk a:hover{color:#d4a574}</style></head><body><div class="lb"><div class="li">🛡️</div><h2>Admin Access</h2><p class="ls">BRONX OSINT Control</p><div class="fg"><label>Username</label><input type="text" id="u" placeholder="Enter username" autocomplete="off"></div><div class="fg"><label>Password</label><input type="password" id="p" placeholder="Enter password"></div><button class="bl" onclick="li()">Authenticate</button><div class="err" id="er"></div><div class="bk"><a href="/">← Home</a></div></div><script>async function li(){const u=document.getElementById('u').value;const p=document.getElementById('p').value;const e=document.getElementById('er');if(!u||!p){e.style.display='block';e.textContent='Fill all fields';return}try{const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});const d=await r.json();if(d.success){e.style.display='block';e.style.color='#d4a574';e.textContent=d.message;localStorage.setItem('btk',d.token);setTimeout(()=>window.location.href=d.redirect,800)}else{e.style.display='block';e.style.color='#e0115f';e.textContent=d.error}}catch(err){e.style.display='block';e.style.color='#e0115f';e.textContent='Connection error'}}document.addEventListener('keydown',ev=>{if(ev.key==='Enter')li()});</script></body></html>`; }

function renderAdminPanel(token) {
    const allKeys = Object.entries(keyStorage).map(([k,d]) => ({key:k,...d,isExpired:d.expiry&&isKeyExpired(d.expiry),isExhausted:!d.unlimited&&d.used>=d.limit,remaining:d.unlimited?'∞':Math.max(0,d.limit-d.used)}));
    const tk = allKeys.filter(k=>!k.hidden).length, ak = allKeys.filter(k=>!k.hidden&&!k.isExpired&&!k.isExhausted).length;
    const tr = requestLogs.filter(l=>l.timestamp.startsWith(getIndiaDate())).length;
    const eus = {}; requestLogs.forEach(l=>{const e=l.endpoint||'?';if(!eus[e])eus[e]={t:0,s:0,f:0};eus[e].t++;l.status==='success'?eus[e].s++:eus[e].f++});
    
    let kr = allKeys.map(k=>{let st='Active',sc='sg';if(k.hidden){st='Master';sc='sp'}else if(k.isExpired){st='Expired';sc='sr'}else if(k.isExhausted){st='Limit';sc='so'}const dk=k.key.length>32?k.key.substring(0,29)+'...':k.key;const sd=k.scopes.includes('*')?'<span class="st">ALL</span>':k.scopes.slice(0,5).map(s=>'<span class="st">'+s+'</span>').join('')+(k.scopes.length>5?' <span class="st">+'+ (k.scopes.length-5) +'</span>':'');return'<tr><td><code style="color:#d4a574;font-size:11px" title="'+k.key+'">'+dk+'</code></td><td>'+(k.name||'—')+'</td><td style="font-size:10px">'+sd+'</td><td>'+(k.unlimited?'∞':k.limit)+'</td><td>'+k.used+'</td><td>'+(k.unlimited?'∞':Math.max(0,k.limit-k.used))+'</td><td>'+(k.expiryStr||'Lifetime')+'</td><td><span class="sd '+sc+'">'+st+'</span></td><td style="white-space:nowrap"><button onclick="rk(\''+k.key+'\')" class="bxs bi">R</button> '+(k.key!=='BRONX_ULTRA_MASTER_2026'?'<button onclick="dk(\''+k.key+'\')" class="bxs bd">D</button>':'')+'</td></tr>';}).join('');
    
    let scb = allScopes.map(s=>'<label class="cbl"><input type="checkbox" value="'+s.v+'"> '+s.l+'</label>').join('');
    let logs = requestLogs.slice(-25).reverse().map(l=>{let sc=l.status==='success'?'sg':(l.status==='failed'?'sr':'so');return'<div class="lr"><span class="lt">'+l.timestamp+'</span><span class="lk">'+l.key+'</span><code class="le">/'+l.endpoint+'</code><span class="lb">'+getBrowser(l.browser)+'</span><span class="'+sc+'">'+l.status+'</span></div>';}).join('')||'<p style="color:#555;text-align:center;padding:20px">No requests</p>';
    let ur = Object.entries(eus).sort((a,b)=>b[1].t-a[1].t).map(([e,d])=>'<tr><td><code style="color:#d4a574">/'+e+'</code></td><td><b>'+d.t+'</b></td><td style="color:#50c878">'+d.s+'</td><td style="color:#e0115f">'+d.f+'</td></tr>').join('')||'<tr><td colspan="4" style="text-align:center;color:#555;padding:20px">No requests</td></tr>';
    let car = customAPIs.map((a,i)=>`<div class="car"><div class="cav"><div class="cai"><b class="cs">#${a.id}</b><span class="cn">${a.name||'Empty'}</span>${a.endpoint?'<code class="ce">/'+a.endpoint+'</code>':'<span class="cempty">No endpoint</span>'}<span class="cst ${a.visible?'vis':'hid'}">${a.visible?'VISIBLE':'HIDDEN'}</span></div><div class="caa"><button class="bxs bi" onclick="eca(${i})">Edit</button><button class="bxs bw" onclick="tca(${i})">Toggle</button></div></div><div class="cae" id="ce${i}" style="display:none"><div class="fr" style="margin-top:12px"><div class="fg"><label>Name</label><input type="text" id="cn${i}" value="${a.name||''}"></div><div class="fg"><label>Endpoint</label><input type="text" id="cep${i}" value="${a.endpoint||''}"></div><div class="fg"><label>Parameter</label><input type="text" id="cp${i}" value="${a.param||''}"></div><div class="fg"><label>Example</label><input type="text" id="cex${i}" value="${a.example||''}"></div><div class="fg"><label>Description</label><input type="text" id="cd${i}" value="${a.desc||''}"></div><div class="fg"><label>Real API URL</label><input type="text" id="crl${i}" value="${a.realAPI||''}"></div><div class="fg"><label>Visible</label><select id="cv${i}"><option value="1" ${a.visible?'selected':''}>Yes</option><option value="0" ${!a.visible?'selected':''}>No</option></select></div><div class="fg fw" style="display:flex;gap:10px"><button class="btn bp btn-sm" onclick="sca(${i})">Save</button><button class="btn bo btn-sm" onclick="cca(${i})">Cancel</button></div></div></div></div>`).join('');
    
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX — Admin Panel</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>
:root{--bg:#050510;--c:#0a0a1a;--c2:#0f0f20;--b1:#1e1e35;--b2:#2a2a45;--t:#e0e0e8;--t2:#a0a0bb;--t3:#555580;--g:#50c878;--gold:#d4a574;--r:#e0115f;--o:#ff9100;--bl:#0f52ba;--p:#9966cc;--rad:14px;--rs:8px}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--t);font-family:'Inter',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:linear-gradient(var(--gold),var(--r));border-radius:10px}
.tb{background:var(--c);border-bottom:1px solid var(--b1);padding:14px 28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;position:sticky;top:0;z-index:100}
.tb h1{font-size:17px;font-weight:800;color:#fff}.tb h1 span{color:var(--gold)}
.tbr{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tbt{font-size:10px;color:var(--t3);font-family:'SF Mono',monospace}
.ct{max-width:1450px;margin:0 auto;padding:20px 24px}
.sr{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.sc{background:var(--c);border:1px solid var(--b1);border-radius:var(--rad);padding:20px;text-align:center;position:relative;overflow:hidden}
.sc::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:0.5}
.sn{font-size:36px;font-weight:900;color:var(--gold)}.sl{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-top:4px;font-weight:600}
.tabs{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap}
.tab{padding:10px 22px;background:var(--c);border:1px solid var(--b1);border-radius:var(--rs);color:var(--t3);cursor:pointer;font-size:13px;font-weight:600;transition:all 0.3s}
.tab.active{border-color:var(--gold);color:var(--gold);background:rgba(212,167,116,0.04)}
.tab:hover{border-color:#333;color:#ccc}
.panel{display:none}.panel.active{display:block}
.sec{background:var(--c);border:1px solid var(--b1);border-radius:var(--rad);padding:24px;margin-bottom:20px}
.sec h3{font-size:16px;font-weight:700;color:#fff;margin-bottom:18px}
.fr{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.fg label{display:block;color:var(--t3);font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:700}
.fg input,.fg select,.fg textarea{width:100%;padding:10px 14px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs);color:var(--t);font-size:12px;font-family:inherit;outline:none;transition:all 0.3s}
.fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,167,116,0.05)}
.fw{grid-column:1/-1}
.cbw{display:flex;flex-wrap:wrap;gap:5px;max-height:150px;overflow:auto;padding:10px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs)}
.cbl{display:flex;align-items:center;gap:5px;font-size:11px;color:#aaa;cursor:pointer;padding:3px 8px;border-radius:4px;transition:all 0.15s}
.cbl:hover{background:rgba(255,255,255,0.03)}.cbl input{accent-color:var(--gold)}
.btn{padding:10px 22px;border-radius:var(--rs);font-weight:600;font-size:13px;cursor:pointer;border:none;letter-spacing:0.5px;transition:all 0.3s;font-family:inherit}
.bp{background:linear-gradient(135deg,var(--gold),#e8b4b8);color:#000;box-shadow:0 0 20px rgba(212,167,116,0.15)}.bp:hover{box-shadow:0 0 35px rgba(212,167,116,0.3)}
.bo{background:transparent;border:1px solid var(--b2);color:var(--t2);padding:10px 18px;border-radius:var(--rs);cursor:pointer;font-weight:600;font-size:12px;transition:all 0.3s;font-family:inherit}
.bo:hover{border-color:var(--gold);color:var(--gold)}
.bxs{padding:4px 10px;font-size:10px;border-radius:4px;border:1px solid;cursor:pointer;font-weight:600;font-family:inherit}
.bi{background:rgba(15,82,186,0.1);color:var(--bl);border-color:rgba(15,82,186,0.3)}.bi:hover{background:rgba(15,82,186,0.2)}
.bd{background:rgba(224,17,95,0.1);color:var(--r);border-color:rgba(224,17,95,0.3)}.bd:hover{background:rgba(224,17,95,0.2)}
.bw{background:rgba(255,145,0,0.1);color:var(--o);border-color:rgba(255,145,0,0.3)}.bw:hover{background:rgba(255,145,0,0.2)}
.tw{max-height:400px;overflow:auto;border-radius:var(--rs);border:1px solid var(--b1)}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:var(--c2);color:var(--t3);padding:10px 8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:9px;position:sticky;top:0;z-index:10;border-bottom:2px solid var(--b1)}
td{padding:9px 8px;border-bottom:1px solid rgba(255,255,255,0.03)}tr:hover{background:rgba(255,255,255,0.02)}
.sd{padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700;letter-spacing:1px}
.sg{background:rgba(80,200,120,0.1);color:var(--g)}.sr{background:rgba(224,17,95,0.1);color:var(--r)}.so{background:rgba(255,145,0,0.1);color:var(--o)}.sp{background:rgba(153,102,204,0.1);color:var(--p)}
.st{display:inline-block;padding:1px 6px;background:rgba(212,167,116,0.05);border:1px solid rgba(212,167,116,0.12);border-radius:8px;font-size:9px;margin:1px;color:var(--gold)}
.lbx{max-height:350px;overflow:auto;background:var(--bg);border-radius:var(--rs);padding:14px;font-size:11px;font-family:'SF Mono',monospace}
.lr{display:flex;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.02);flex-wrap:wrap;align-items:center}
.lt{color:#333;min-width:130px;font-size:10px}.lk{color:var(--gold);font-size:10px}.le{color:var(--bl);font-size:10px}.lb{color:var(--t3);font-size:9px}
.car{background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs);padding:14px;margin-bottom:10px;transition:all 0.3s}
.car:hover{border-color:#333}.cav{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.cai{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.cs{color:var(--gold)}.cn{color:#fff;font-weight:600}.ce{color:var(--bl);font-size:11px}.cempty{color:var(--t3);font-size:11px}
.cst{padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700}.cst.vis{background:rgba(80,200,120,0.1);color:var(--g)}.cst.hid{background:rgba(224,17,95,0.1);color:var(--r)}
.caa{display:flex;gap:6px}.cae{margin-top:10px;padding-top:12px;border-top:1px solid var(--b1)}
.iebox{background:var(--c);border:1px solid var(--o);border-radius:var(--rad);padding:20px;margin-bottom:20px}
.iebox h3{color:var(--o);font-size:15px;margin-bottom:12px}
.iebox textarea{width:100%;min-height:120px;background:var(--bg);border:1px solid var(--b2);color:var(--t);padding:12px;border-radius:var(--rs);font-family:'SF Mono',monospace;font-size:11px;resize:vertical}
.iebox textarea:focus{outline:none;border-color:var(--o)}
.fg input[type="date"]{color-scheme:dark;cursor:pointer}.fg input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.7);cursor:pointer}
.esg{display:flex;gap:8px;align-items:center}.esg select{flex:1}
.toast{position:fixed;bottom:24px;right:24px;background:var(--c);color:var(--gold);padding:12px 22px;border-radius:var(--rs);font-size:13px;font-weight:600;border:1px solid rgba(212,167,116,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;box-shadow:0 10px 50px rgba(0,0,0,0.6)}
</style></head><body>
<div class="tb"><h1>BRONX <span>OSINT</span> — Admin</h1><div class="tbr"><span class="tbt">🇮🇳 ${getIndiaDateTime()}</span><button class="bo" onclick="window.open('/')">Home</button><button class="bo" onclick="lo()">Logout</button></div></div>
<div class="ct">
<div class="sr"><div class="sc"><div class="sn">${tk}</div><div class="sl">Keys</div></div><div class="sc"><div class="sn">${ak}</div><div class="sl">Active</div></div><div class="sc"><div class="sn">${requestLogs.length}</div><div class="sl">Requests</div></div><div class="sc"><div class="sn">${tr}</div><div class="sl">Today</div></div></div>
<div class="tabs"><div class="tab active" onclick="st('gen')">Generator</div><div class="tab" onclick="st('keys')">Keys</div><div class="tab" onclick="st('io')">Import/Export</div><div class="tab" onclick="st('custom')">Custom APIs</div><div class="tab" onclick="st('usage')">Usage</div><div class="tab" onclick="st('logs')">Logs</div></div>
<div class="panel active" id="p-gen"><div class="sec"><h3>🔑 Generate Key</h3><div class="fr">
<div class="fg"><label>Key Name</label><input type="text" id="gkn" placeholder="PREMIUM_001"></div>
<div class="fg"><label>Owner</label><input type="text" id="gko" placeholder="Name"></div>
<div class="fg"><label>Limit</label><input type="text" id="gkl" placeholder="100 or unlimited"></div>
<div class="fg"><label>Expiry</label><div class="esg"><select id="ges" onchange="hes()"><option value="LIFETIME">🌟 Lifetime</option><option value="31-12-2026">31 Dec 2026</option><option value="31-12-2027">31 Dec 2027</option><option value="30-06-2026">30 Jun 2026</option><option value="custom">📅 Custom</option></select></div><input type="date" id="gec" style="display:none;margin-top:6px" onchange="uec()"></div>
<div class="fg"><label>Type</label><select id="gkt"><option value="premium">💎 Premium</option><option value="demo">🎁 Demo</option><option value="test">🧪 Test</option></select></div>
<div class="fg fw"><label>Scopes</label><div class="cbw" id="scb">${scb}</div></div>
<div class="fg fw"><button class="btn bp" onclick="gk()" style="width:100%">Generate</button></div>
</div></div></div>
<div class="panel" id="p-keys"><div class="sec"><h3>All Keys</h3><div style="margin-bottom:12px;display:flex;gap:10px"><input type="text" id="ks" placeholder="Search..." onkeyup="fk()" style="padding:9px 14px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs);color:var(--t);font-size:12px;width:260px"><button class="bo" onclick="rak()">Reset All</button></div><div class="tw"><table><thead><tr><th>Key</th><th>Owner</th><th>Scopes</th><th>Limit</th><th>Used</th><th>Left</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody id="kb">${kr}</tbody></table></div></div></div>
<div class="panel" id="p-io"><div class="iebox"><h3>📤 Export</h3><textarea readonly id="ed" onclick="this.select()">${JSON.stringify(keyStorage,null,2).replace(/"/g,'&quot;')}</textarea><button class="btn bo btn-sm" style="margin-top:10px" onclick="ce()">Copy</button></div><div class="iebox" style="border-color:var(--bl)"><h3 style="color:var(--bl)">📥 Import</h3><textarea id="id" placeholder="Paste JSON..."></textarea><button class="btn bp btn-sm" style="margin-top:10px" onclick="ik()">Import</button></div></div>
<div class="panel" id="p-custom"><div class="sec"><h3>Custom APIs</h3><div>${car}</div></div></div>
<div class="panel" id="p-usage"><div class="sec"><h3>API Usage</h3><div class="tw"><table><thead><tr><th>Endpoint</th><th>Total</th><th>Success</th><th>Failed</th></tr></thead><tbody>${ur}</tbody></table></div></div></div>
<div class="panel" id="p-logs"><div class="sec"><h3>Request Logs</h3><div style="margin-bottom:12px"><button class="bo" onclick="cl()">Clear</button></div><div class="lbx">${logs}</div></div></div>
</div>
<script>
const TOKEN='${token}';if(TOKEN)localStorage.setItem('btk',TOKEN);
function toast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2200)}
function st(n){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));document.getElementById('p-'+n).classList.add('active');event.target.classList.add('active')}
async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','x-admin-token':TOKEN},body:body?JSON.stringify(body):undefined});return await r.json()}
function hes(){const s=document.getElementById('ges');const c=document.getElementById('gec');if(s.value==='custom'){c.style.display='block'}else{c.style.display='none'}}
function uec(){document.getElementById('ges').value='custom'}
function ge(){const s=document.getElementById('ges');if(s.value==='custom'){const c=document.getElementById('gec');if(!c.value){toast('Select date');return null}const p=c.value.split('-');return p[2]+'-'+p[1]+'-'+p[0]}return s.value}
async function gk(){const n=document.getElementById('gkn').value.trim();const o=document.getElementById('gko').value.trim();const l=document.getElementById('gkl').value.trim();const e=ge();if(!e)return;const t=document.getElementById('gkt').value;if(!n||!o){toast('Fill all');return}const sc=[];document.querySelectorAll('#scb input:checked').forEach(c=>sc.push(c.value));if(!sc.length){toast('Select scope');return}const d=await api('/admin/generate-key',{keyName:n,keyOwner:o,scopes:sc,limit:l||'100',expiryDate:e,keyType:t});d.success?(toast('✅ '+n),setTimeout(()=>location.reload(),1200)):toast(d.error)}
async function dk(k){if(!confirm('Delete?'))return;const d=await api('/admin/delete-key',{keyName:k});d.success?(toast('Deleted'),setTimeout(()=>location.reload(),800)):toast(d.error)}
async function rk(k){const d=await api('/admin/reset-key-usage',{keyName:k});d.success?(toast('Reset'),setTimeout(()=>location.reload(),800)):toast(d.error)}
async function rak(){if(!confirm('Reset all?'))return;const d=await api('/admin/keys');if(d.success)for(const k of d.keys)await api('/admin/reset-key-usage',{keyName:k.key});toast('Done');setTimeout(()=>location.reload(),800)}
async function cl(){if(!confirm('Clear?'))return;await api('/admin/clear-logs');toast('Cleared');setTimeout(()=>location.reload(),800)}
async function lo(){localStorage.removeItem('btk');await api('/admin/logout');window.location.href='/admin'}
function fk(){const s=document.getElementById('ks').value.toLowerCase();document.querySelectorAll('#kb tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(s)?'':'none'})}
function ce(){document.getElementById('ed').select();document.execCommand('copy');toast('Copied')}
async function ik(){const r=document.getElementById('id').value.trim();if(!r){toast('Paste JSON');return}try{const d=JSON.parse(r);const re=await api('/admin/import-keys',{keys:d});re.success?(toast('Imported: '+re.imported),setTimeout(()=>location.reload(),1000)):toast(re.error)}catch(e){toast('Invalid JSON')}}
function eca(i){document.getElementById('ce'+i).style.display='block';document.getElementById('ce'+i).parentElement.querySelector('.cav').style.display='none'}
function cca(i){document.getElementById('ce'+i).style.display='none';document.getElementById('ce'+i).parentElement.querySelector('.cav').style.display='flex'}
async function sca(i){const d={name:document.getElementById('cn'+i).value,endpoint:document.getElementById('cep'+i).value,param:document.getElementById('cp'+i).value,example:document.getElementById('cex'+i).value,desc:document.getElementById('cd'+i).value,realAPI:document.getElementById('crl'+i).value,visible:document.getElementById('cv'+i).value==='1'};const re=await api('/admin/custom-api',{slot:i,api:d});re.success?(toast('Saved'),setTimeout(()=>location.reload(),800)):toast(re.error)}
async function tca(i){const re=await api('/admin/custom-api',{slot:i,api:{visible:!${JSON.stringify(customAPIs)}[i].visible}});re.success?(toast('Toggled'),setTimeout(()=>location.reload(),600)):toast(re.error)}
</script></body></html>`;
}

// ========== EXPRESS ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { req.clientIP = req.headers['x-forwarded-for'] || 'unknown'; req.userAgent = req.headers['user-agent'] || 'Unknown'; next(); });

// ========== PUBLIC ROUTES ==========
app.get('/', (req, res) => res.send(renderHome()));
app.get('/test', (req, res) => res.json({ status: 'BRONX OSINT v11 Luxury', time: getIndiaDateTime() }));
app.get('/key-info', (req, res) => { const k = req.query.key; if (!k) return res.status(400).json({ e: 'Missing key' }); const d = keyStorage[k]; if (!d || d.hidden) return res.status(404).json({ e: 'Not found' }); res.json({ s: true, masked: k.substring(0,6)+'****', owner: d.name, limit: d.unlimited?'∞':d.limit, used: d.used, remaining: d.unlimited?'∞':Math.max(0,d.limit-d.used) }); });
app.get('/quota', (req, res) => { const k = req.query.key; if (!k) return res.status(400).json({ e: 'Missing' }); const d = keyStorage[k]; if (!d || d.hidden) return res.status(404).json({ e: 'Not found' }); res.json({ s: true, remaining: d.unlimited?'∞':Math.max(0,d.limit-d.used) }); });

app.get('/api/custom/:ep', async (req, res) => {
    const { ep } = req.params; const apiKey = req.query.key || req.headers['x-api-key'];
    const ca = customAPIs.find(a => a.endpoint === ep && a.visible);
    if (!ca) return res.status(404).json({ e: 'Not found' });
    if (!apiKey) return res.status(401).json({ e: 'Key required' });
    const kc = checkKeyValid(apiKey);
    if (!kc.valid) return res.status(403).json({ e: kc.error });
    const pv = req.query[ca.param];
    if (!pv) return res.status(400).json({ e: 'Missing: '+ca.param });
    try {
        let ru = ca.realAPI.replace(/\{param\}/gi, encodeURIComponent(pv)).replace(/\{parma\}/gi, encodeURIComponent(pv));
        const resp = await axios.get(ru, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        logRequest(apiKey,'c/'+ep,pv,'success',req.clientIP,req.userAgent);
        const cd = sanitizeResponse(resp.data);
        cd.api_info = { by:'@BRONX_ULTRA', ts:getIndiaDateTime() };
        res.json(cd);
    } catch (e) { logRequest(apiKey,'c/'+ep,pv,'error',req.clientIP,req.userAgent); res.status(500).json({ e: 'API error' }); }
});

app.get('/api/key-bronx/:ep', async (req, res) => {
    const { ep } = req.params; const apiKey = req.query.key || req.headers['x-api-key'];
    if (!endpoints[ep]) return res.status(404).json({ e: 'Not found' });
    if (!apiKey) return res.status(401).json({ e: 'Key required' });
    const kc = checkKeyValid(apiKey);
    if (!kc.valid) return res.status(403).json({ e: kc.error });
    if (!checkKeyScope(kc.keyData, ep).valid) return res.status(403).json({ e: 'Scope denied' });
    const e = endpoints[ep], pv = req.query[e.param];
    if (!pv) return res.status(400).json({ e: 'Missing param' });
    try {
        const ru = `${REAL_API_BASE}/${ep}?key=${REAL_API_KEY}&${e.param}=${encodeURIComponent(pv)}`;
        const resp = await axios.get(ru, { timeout: 30000 });
        const uk = incrementKeyUsage(apiKey);
        logRequest(apiKey,ep,pv,'success',req.clientIP,req.userAgent);
        const cd = sanitizeResponse(resp.data);
        cd.api_info = { by:'@BRONX_ULTRA', ep, used:uk?uk.used:kc.keyData.used, remaining:kc.keyData.unlimited?'∞':Math.max(0,kc.keyData.limit-(uk?uk.used:kc.keyData.used)), ts:getIndiaDateTime() };
        res.json(cd);
    } catch (e) { res.status(500).json({ e: 'API error' }); }
});

// ========== ADMIN ROUTES ==========
app.get('/admin', (req, res) => { const t = req.query.token || req.headers['x-admin-token']; isAdminAuth(t) ? res.send(renderAdminPanel(t)) : res.send(renderAdminLogin()); });
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateToken();
        adminSessions[token] = { expiresAt: Date.now() + (365*24*60*60*1000), permanent: true };
        permanentTokens[token] = { createdAt: getIndiaDateTime() };
        saveData();
        res.json({ success: true, token, message: '✅ Welcome!', redirect: '/admin?token=' + token });
    } else res.status(401).json({ success: false, error: 'Invalid' });
});
app.post('/admin/logout', (req, res) => { const t = req.headers['x-admin-token'] || req.query.token; if (t) { delete adminSessions[t]; delete permanentTokens[t]; saveData(); } res.json({ success: true }); });
app.get('/admin/check-auth', (req, res) => res.json({ auth: isAdminAuth(req.query.token || req.headers['x-admin-token']) }));

app.post('/admin/generate-key', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ e: 'Unauthorized' });
    const { keyName, keyOwner, scopes, limit, expiryDate, keyType } = req.body;
    if (!keyName || !keyOwner || !scopes?.length) return res.status(400).json({ e: 'Missing fields' });
    if (keyStorage[keyName]) return res.status(400).json({ e: 'Exists' });
    const isU = limit === 'unlimited' || parseInt(limit) >= 999999;
    keyStorage[keyName] = { name: keyOwner, scopes, type: keyType || 'premium', limit: isU ? 999999 : parseInt(limit) || 100, used: 0, expiry: (expiryDate && expiryDate !== 'LIFETIME') ? parseExpiryDate(expiryDate) : null, expiryStr: expiryDate || 'LIFETIME', created: getIndiaDateTime(), unlimited: isU, hidden: false };
    await saveData();
    res.json({ success: true, msg: '✅ Generated: ' + keyName });
});
app.post('/admin/delete-key', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ e: 'Unauthorized' });
    const { keyName } = req.body;
    if (keyName === 'BRONX_ULTRA_MASTER_2026') return res.status(400).json({ e: 'Cannot delete master' });
    if (keyStorage[keyName]) { delete keyStorage[keyName]; await saveData(); res.json({ success: true }); } else res.status(404).json({ e: 'Not found' });
});
app.post('/admin/reset-key-usage', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ e: 'Unauthorized' });
    const { keyName } = req.body;
    if (keyStorage[keyName]) { keyStorage[keyName].used = 0; await saveData(); res.json({ success: true }); } else res.status(404).json({ e: 'Not found' });
});
app.get('/admin/keys', (req, res) => { if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ e: 'Unauthorized' }); res.json({ success: true, keys: Object.entries(keyStorage).map(([k,d])=>({key:k,name:d.name,scopes:d.scopes,limit:d.unlimited?'∞':d.limit,used:d.used,remaining:d.unlimited?'∞':Math.max(0,d.limit-d.used),expiry:d.expiryStr||'LIFETIME'})) }); });
app.post('/admin/import-keys', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ e: 'Unauthorized' });
    const { keys } = req.body;
    if (!keys || typeof keys !== 'object') return res.status(400).json({ e: 'Invalid' });
    let imp = 0, skip = 0;
    Object.entries(keys).forEach(([kn, kd]) => { if (kn === 'BRONX_ULTRA_MASTER_2026' || keyStorage[kn]) { skip++; return; } keyStorage[kn] = { name: kd.name || 'Imported', scopes: kd.scopes || ['number'], type: kd.type || 'imported', limit: kd.limit || 100, used: 0, expiry: (kd.expiryStr && kd.expiryStr !== 'LIFETIME') ? parseExpiryDate(kd.expiryStr) : null, expiryStr: kd.expiryStr || 'LIFETIME', created: getIndiaDateTime(), unlimited: kd.unlimited || false, hidden: false }; imp++; });
    await saveData();
    res.json({ success: true, imported: imp, skipped: skip });
});
app.post('/admin/custom-api', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ e: 'Unauthorized' });
    const { slot, api } = req.body;
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) return res.status(400).json({ e: 'Invalid slot' });
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    await saveData();
    res.json({ success: true });
});
app.get('/admin/logs', (req, res) => { if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ e: 'Unauthorized' }); res.json({ success: true, logs: requestLogs.slice(-50).reverse() }); });
app.post('/admin/clear-logs', async (req, res) => { if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json(); requestLogs = []; await saveData(); res.json({ success: true }); });
app.get('/admin/stats', (req, res) => { if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({}); res.json({ s:true, keys:Object.keys(keyStorage).filter(k=>!keyStorage[k].hidden).length, reqs:requestLogs.length, today:requestLogs.filter(l=>l.timestamp.startsWith(getIndiaDate())).length }); });
app.use((req, res) => res.status(404).json({ e: 'Not found' }));

// ========== STARTUP ==========
async function startup() {
    await loadData();
    console.log('🚀 BRONX OSINT v11 LUXURY READY');
    console.log('💾 Keys:', Object.keys(keyStorage).length);
    console.log('🔧 Custom APIs:', customAPIs.filter(a=>a.visible).length);
    console.log('👑 Permanent Tokens:', Object.keys(permanentTokens).length);
}
startup();

module.exports = app;
