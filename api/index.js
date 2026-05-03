// api/index.js - BRONX OSINT v12 - FINAL REDIS PERMANENT STORAGE
const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.onrender.com/api';
const REAL_API_KEY = 'bronx';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'BRONX_ULTRA';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BRONX@2026#OWNER';

// ========== UPSTASH REDIS CONFIG ==========
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://inspired-boa-113876.upstash.io';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'ggAAAAAAAbzUAAIgcDK9UwWhFQIuPQyBNiogt3it9dRhMOs8WCQCerXQbnRIcw';

// ========== MEMORY STORAGE ==========
let keyStorage = {};
let customAPIs = [];
let requestLogs = [];
let adminSessions = {};
let permanentTokens = {};

// ========== REDIS FUNCTIONS ==========
const redisAxios = axios.create({
    baseURL: REDIS_URL,
    headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` },
    timeout: 8000
});

async function redisGet(key) {
    try {
        const res = await redisAxios.get(`/get/${key}`);
        return res.data && res.data.result ? JSON.parse(res.data.result) : null;
    } catch (e) {
        console.log('Redis GET error:', e.message);
        return null;
    }
}

async function redisSet(key, value) {
    try {
        await redisAxios.post(`/set/${key}`, JSON.stringify(value));
        return true;
    } catch (e) {
        console.log('Redis SET error:', e.message);
        return false;
    }
}

async function redisDel(key) {
    try {
        await redisAxios.post(`/del/${key}`, '');
        return true;
    } catch (e) {
        return false;
    }
}

// ========== SAVE & LOAD ==========
async function saveAllData() {
    console.log('💾 Saving to Redis...');
    const r1 = await redisSet('bronx_keys', keyStorage);
    const r2 = await redisSet('bronx_apis', customAPIs);
    const r3 = await redisSet('bronx_logs', requestLogs.slice(-100));
    const r4 = await redisSet('bronx_tokens', permanentTokens);
    console.log('💾 Save result:', { keys: r1, apis: r2, logs: r3, tokens: r4 });
    return r1 && r2;
}

async function loadAllData() {
    console.log('📥 Loading from Redis...');
    console.log('📥 Redis URL:', REDIS_URL.substring(0, 40) + '...');
    
    // Load keys
    const savedKeys = await redisGet('bronx_keys');
    if (savedKeys && Object.keys(savedKeys).length > 0) {
        keyStorage = savedKeys;
        console.log('✅ Keys loaded:', Object.keys(keyStorage).length);
    } else {
        initDefaultData();
        console.log('📝 Default keys created:', Object.keys(keyStorage).length);
        await redisSet('bronx_keys', keyStorage);
    }
    
    // Load custom APIs
    const savedAPIs = await redisGet('bronx_apis');
    if (savedAPIs && Array.isArray(savedAPIs) && savedAPIs.length > 0) {
        customAPIs = savedAPIs;
        console.log('✅ Custom APIs loaded:', customAPIs.length);
    } else {
        initCustomAPIs();
        console.log('📝 Default custom APIs created');
        await redisSet('bronx_apis', customAPIs);
    }
    
    // Load logs
    const savedLogs = await redisGet('bronx_logs');
    if (savedLogs && Array.isArray(savedLogs)) {
        requestLogs = savedLogs;
        console.log('✅ Logs loaded:', requestLogs.length);
    }
    
    // Load permanent tokens
    const savedTokens = await redisGet('bronx_tokens');
    if (savedTokens && typeof savedTokens === 'object') {
        permanentTokens = savedTokens;
        // Restore sessions
        Object.entries(permanentTokens).forEach(([token, data]) => {
            adminSessions[token] = { 
                expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), 
                permanent: true,
                createdAt: data.createdAt || getIndiaDateTime()
            };
        });
        console.log('✅ Tokens restored:', Object.keys(permanentTokens).length);
    }
}

// ========== DEFAULT DATA ==========
function initDefaultData() {
    const now = getIndiaDateTime();
    keyStorage = {};
    keyStorage['BRONX_ULTRA_MASTER_2026'] = {
        name: '👑 BRONX ULTRA OWNER',
        scopes: ['*'],
        type: 'owner',
        limit: 999999,
        used: 0,
        expiry: null,
        expiryStr: 'LIFETIME',
        created: now,
        resetType: 'never',
        unlimited: true,
        hidden: true
    };
    keyStorage['DEMO_KEY_2026'] = {
        name: '🎁 Demo User',
        scopes: ['number', 'aadhar', 'pincode', 'adharfamily', 'adharration', 'tgidinfo', 'snap', 'imei', 'calltracer'],
        type: 'demo',
        limit: 10,
        used: 0,
        expiry: parseExpiryDate('31-12-2026'),
        expiryStr: '31-12-2026',
        created: now,
        resetType: 'never',
        unlimited: false,
        hidden: false
    };
    keyStorage['TEST_KEY_2026'] = {
        name: '🧪 Test User',
        scopes: ['number'],
        type: 'test',
        limit: 5,
        used: 0,
        expiry: parseExpiryDate('30-06-2026'),
        expiryStr: '30-06-2026',
        created: now,
        resetType: 'never',
        unlimited: false,
        hidden: false
    };
}

function initCustomAPIs() {
    customAPIs = [
        { id: 1, name: 'Number Info backup', endpoint: 'rajput-api', param: 'num', example: '9876543210', desc: 'India Number Lookup', category: 'Custom', visible: true, realAPI: 'https://rajput-api.vercel.app/search?num={param}' },
        { id: 2, name: 'Vehicle Details', endpoint: 'rc-details', param: 'ca_number', example: 'MH02FZ0555', desc: 'Vehicle RC Details', category: 'Custom', visible: true, realAPI: 'https://bronx-rc-api.vercel.app/?ca_number={param}' },
        { id: 3, name: 'Aadhar Details', endpoint: 'aadhar-details', param: 'aadhar', example: '393933081942', desc: 'Aadhar Lookup', category: 'Custom', visible: true, realAPI: 'https://bronx-adhar-api.vercel.app/aadhar={param}' },
        { id: 4, name: 'Email Lookup', endpoint: 'email-lookup', param: 'mail', example: 'user@gmail.com', desc: 'Email Info', category: 'Custom', visible: true, realAPI: 'https://bronx-mail-api.vercel.app/mail={param}' },
        { id: 5, name: 'Telegram Number', endpoint: 'telegram-num', param: 'id', example: '7530266953', desc: 'Telegram Lookup', category: 'Custom', visible: true, realAPI: 'http://45.91.248.51:3000/api/tgnum?id={param}' },
        { id: 6, name: 'Empty Slot 6', endpoint: '', param: '', example: '', desc: '', category: 'Custom', visible: false, realAPI: '' },
        { id: 7, name: 'Empty Slot 7', endpoint: '', param: '', example: '', desc: '', category: 'Custom', visible: false, realAPI: '' },
        { id: 8, name: 'Empty Slot 8', endpoint: '', param: '', example: '', desc: '', category: 'Custom', visible: false, realAPI: '' },
        { id: 9, name: 'Empty Slot 9', endpoint: '', param: '', example: '', desc: '', category: 'Custom', visible: false, realAPI: '' },
        { id: 10, name: 'Empty Slot 10', endpoint: '', param: '', example: '', desc: '', category: 'Custom', visible: false, realAPI: '' }
    ];
}

// ========== TIME HELPERS ==========
function getIndiaTime() { 
    return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)); 
}
function getIndiaDate() { 
    return getIndiaTime().toISOString().split('T')[0]; 
}
function getIndiaDateTime() { 
    return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19); 
}

// ========== EXPIRY ==========
function isKeyExpired(expiryDate) {
    if (!expiryDate || expiryDate === null || expiryDate === 'LIFETIME') return false;
    return getIndiaTime() > new Date(expiryDate);
}

function parseExpiryDate(dateStr) {
    if (!dateStr || dateStr === 'LIFETIME' || dateStr === 'NEVER') return null;
    const parts = dateStr.split('-');
    let day, month, year;
    if (parts[0].length === 4) {
        year = parseInt(parts[0]); month = parseInt(parts[1]); day = parseInt(parts[2]);
    } else {
        day = parseInt(parts[0]); month = parseInt(parts[1]); year = parseInt(parts[2]);
    }
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day, 23, 59, 59, 999);
}

// ========== KEY MANAGEMENT ==========
function checkKeyValid(apiKey) {
    const kd = keyStorage[apiKey];
    if (!kd) return { valid: false, error: '❌ Invalid API Key' };
    if (kd.expiry && isKeyExpired(kd.expiry)) return { valid: false, error: '⏰ Key Expired', expired: true };
    if (!kd.unlimited && kd.used >= kd.limit) return { valid: false, error: '🛑 Limit Exhausted', limitExhausted: true };
    return { valid: true, keyData: kd };
}

function incrementKeyUsage(apiKey) {
    if (keyStorage[apiKey] && !keyStorage[apiKey].unlimited) {
        keyStorage[apiKey].used++;
        // Auto-save every 10 increments
        if (keyStorage[apiKey].used % 10 === 0) saveAllData();
    }
    return keyStorage[apiKey];
}

function checkKeyScope(kd, ep) {
    if (kd.scopes.includes('*') || kd.scopes.includes(ep)) return { valid: true };
    return { valid: false, error: '❌ Scope denied' };
}

function logRequest(key, ep, param, status, ip, ua) {
    requestLogs.push({
        timestamp: getIndiaDateTime(),
        key: key ? key.substring(0, 10) + '...' : 'unknown',
        endpoint: ep, param, status,
        ip: ip || 'unknown',
        browser: ua || 'Unknown'
    });
    if (requestLogs.length > 500) requestLogs = requestLogs.slice(-500);
}

// ========== ADMIN AUTH ==========
function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let t = '';
    for (let i = 0; i < 40; i++) t += chars.charAt(Math.floor(Math.random() * chars.length));
    return t;
}

function isAdminAuth(token) {
    if (!token || !adminSessions[token]) return false;
    if (Date.now() > adminSessions[token].expiresAt) {
        delete adminSessions[token];
        return false;
    }
    return true;
}

// ========== CLEAN RESPONSE ==========
function sanitizeResponse(data) {
    if (!data) return data;
    const cleaned = JSON.parse(JSON.stringify(data));
    (function clean(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(clean); return; }
        ['by','channel','BY','CHANNEL','developer','Developer','api_key','apikey','real_url','source_url','internal_url','server_ip','host','proxy'].forEach(f => delete obj[f]);
        Object.keys(obj).forEach(k => { if (obj[k] && typeof obj[k] === 'object') clean(obj[k]); });
    })(cleaned);
    cleaned.by = "@BRONX_ULTRA";
    cleaned.powered_by = "BRONX OSINT API";
    return cleaned;
}

function getBrowser(ua) {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    return 'Other';
}

// ========== ENDPOINTS ==========
const endpoints = {
    number: { param: 'num', icon: '📱', example: '9876543210', desc: 'Indian Mobile Number Lookup', cat: 'phone' },
    aadhar: { param: 'num', icon: '🆔', example: '393933081942', desc: 'Aadhaar Number Lookup', cat: 'phone' },
    name: { param: 'name', icon: '🔍', example: 'abhiraaj', desc: 'Name to Records Search', cat: 'phone' },
    numv2: { param: 'num', icon: '📱', example: '6205949840', desc: 'Number Info v2', cat: 'phone' },
    adv: { param: 'num', icon: '📱', example: '9876543210', desc: 'Advanced Phone Lookup', cat: 'phone' },
    adharfamily: { param: 'num', icon: '👨‍👩‍👧‍👦', example: '984154610245', desc: 'Aadhar Family Details', cat: 'phone' },
    adharration: { param: 'num', icon: '📋', example: '701984830542', desc: 'Aadhar Ration Card', cat: 'phone' },
    imei: { param: 'imei', icon: '📱', example: '357817383506298', desc: 'IMEI Number Lookup', cat: 'phone' },
    calltracer: { param: 'num', icon: '📞', example: '9876543210', desc: 'Call Tracer Lookup', cat: 'phone' },
    upi: { param: 'upi', icon: '💰', example: 'example@ybl', desc: 'UPI ID Verification', cat: 'finance' },
    ifsc: { param: 'ifsc', icon: '🏦', example: 'SBIN0001234', desc: 'IFSC Code Details', cat: 'finance' },
    pan: { param: 'pan', icon: '📄', example: 'AXDPR2606K', desc: 'PAN to GST Search', cat: 'finance' },
    pincode: { param: 'pin', icon: '📍', example: '110001', desc: 'Pincode Details', cat: 'location' },
    ip: { param: 'ip', icon: '🌐', example: '8.8.8.8', desc: 'IP Lookup', cat: 'location' },
    vehicle: { param: 'vehicle', icon: '🚗', example: 'MH02FZ0555', desc: 'Vehicle Registration', cat: 'vehicle' },
    rc: { param: 'owner', icon: '📋', example: 'UP92P2111', desc: 'RC Owner Details', cat: 'vehicle' },
    ff: { param: 'uid', icon: '🎮', example: '123456789', desc: 'Free Fire Info', cat: 'gaming' },
    bgmi: { param: 'uid', icon: '🎮', example: '5121439477', desc: 'BGMI Info', cat: 'gaming' },
    insta: { param: 'username', icon: '📸', example: 'cristiano', desc: 'Instagram Profile', cat: 'social' },
    git: { param: 'username', icon: '💻', example: 'ftgamer2', desc: 'GitHub Profile', cat: 'social' },
    tg: { param: 'info', icon: '📲', example: 'JAUUOWNER', desc: 'Telegram Lookup', cat: 'social' },
    tgidinfo: { param: 'id', icon: '📲', example: '7530266953', desc: 'Telegram ID Info', cat: 'social' },
    snap: { param: 'username', icon: '👻', example: 'priyapanchal272', desc: 'Snapchat Lookup', cat: 'social' },
    pk: { param: 'num', icon: '🇵🇰', example: '03331234567', desc: 'Pakistan Number v1', cat: 'pakistan' },
    pkv2: { param: 'num', icon: '🇵🇰', example: '3359736848', desc: 'Pakistan Number v2', cat: 'pakistan' }
};

const scopeOptions = [
    { v: '*', l: 'ALL' }, { v: 'number', l: 'Number' }, { v: 'numv2', l: 'Number v2' },
    { v: 'adv', l: 'Advanced' }, { v: 'aadhar', l: 'Aadhar' }, { v: 'adharfamily', l: 'Family' },
    { v: 'adharration', l: 'Ration' }, { v: 'name', l: 'Name' }, { v: 'upi', l: 'UPI' },
    { v: 'ifsc', l: 'IFSC' }, { v: 'pan', l: 'PAN' }, { v: 'pincode', l: 'Pincode' },
    { v: 'ip', l: 'IP' }, { v: 'vehicle', l: 'Vehicle' }, { v: 'rc', l: 'RC' },
    { v: 'ff', l: 'FreeFire' }, { v: 'bgmi', l: 'BGMI' }, { v: 'insta', l: 'Instagram' },
    { v: 'git', l: 'GitHub' }, { v: 'tg', l: 'Telegram' }, { v: 'tgidinfo', l: 'TG ID' },
    { v: 'snap', l: 'Snapchat' }, { v: 'imei', l: 'IMEI' }, { v: 'calltracer', l: 'Call' },
    { v: 'pk', l: 'Pakistan' }, { v: 'pkv2', l: 'Pakistan v2' }
];

// ========== RENDER HOME ==========
function renderHome() {
    const vapis = customAPIs.filter(a => a.visible && a.endpoint);
    const cats = {};
    Object.entries(endpoints).forEach(([n, e]) => {
        if (!cats[e.cat]) cats[e.cat] = [];
        cats[e.cat].push({ n, ...e });
    });

    const catInfo = {
        phone: { name: '📱 Phone Intelligence', color: '#d4a574' },
        finance: { name: '💰 Financial APIs', color: '#50c878' },
        location: { name: '📍 Location Services', color: '#0f52ba' },
        vehicle: { name: '🚗 Vehicle Lookup', color: '#e0115f' },
        gaming: { name: '🎮 Gaming Intelligence', color: '#9966cc' },
        social: { name: '🌐 Social OSINT', color: '#e8b4b8' },
        pakistan: { name: '🇵🇰 Pakistan Data', color: '#b9f2ff' }
    };

    let epsHTML = '';
    Object.entries(catInfo).forEach(([key, info]) => {
        if (!cats[key]) return;
        epsHTML += `<div style="margin-bottom:45px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;padding:8px 0 12px 14px;border-left:3px solid ${info.color}">
                <div style="width:8px;height:8px;border-radius:50%;background:${info.color};box-shadow:0 0 12px ${info.color}"></div>
                <h3 style="font-size:18px;font-weight:700;background:linear-gradient(135deg,${info.color},#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${info.name}</h3>
                <span style="padding:3px 12px;border-radius:15px;font-size:9px;font-weight:700;border:1px solid ${info.color};color:${info.color}">${cats[key].length}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px">${cats[key].map(e => `
                <div onclick="cp('${e.n}','${e.param}','${e.example}')" style="background:#0a0a1a;border:1px solid #1e1e35;border-radius:12px;cursor:pointer;transition:all 0.3s;border-top:2px solid ${info.color};padding:20px" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 10px 40px rgba(0,0,0,0.4)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                        <span style="padding:3px 12px;border-radius:5px;font-size:10px;font-weight:800;background:${info.color}20;color:${info.color};border:1px solid ${info.color}40">GET</span>
                        <span style="font-size:22px">${e.icon}</span>
                    </div>
                    <h4 style="font-size:17px;font-weight:700;color:#fff;margin-bottom:3px">/${e.n}</h4>
                    <p style="font-size:11px;color:#888;margin-bottom:10px">${e.desc}</p>
                    <div style="display:flex;gap:5px;font-family:monospace;font-size:11px"><code style="color:${info.color};background:${info.color}10;padding:2px 6px;border-radius:3px">${e.param}</code><span style="color:#555">=</span><code style="color:#aaa">${e.example}</code></div>
                </div>`).join('')}</div>
        </div>`;
    });

    if (vapis.length) {
        epsHTML += `<div style="margin-bottom:45px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;padding:8px 0 12px 14px;border-left:3px solid #ff9100">
                <div style="width:8px;height:8px;border-radius:50%;background:#ff9100;box-shadow:0 0 12px #ff9100"></div>
                <h3 style="font-size:18px;font-weight:700;background:linear-gradient(135deg,#ff9100,#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent">🔧 Custom Integrations</h3>
                <span style="padding:3px 12px;border-radius:15px;font-size:9px;font-weight:700;border:1px solid #ff9100;color:#ff9100">${vapis.length}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px">${vapis.map(a => `
                <div onclick="cpc('${a.endpoint}','${a.param}','${a.example}')" style="background:#0a0a1a;border:1px solid #1e1e35;border-radius:12px;cursor:pointer;transition:all 0.3s;border-top:2px solid #ff9100;padding:20px" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 10px 40px rgba(0,0,0,0.4)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                        <span style="padding:3px 12px;border-radius:5px;font-size:10px;font-weight:800;background:#ff910020;color:#ff9100;border:1px solid #ff910040">CUSTOM</span>
                        <span style="font-size:22px">🔧</span>
                    </div>
                    <h4 style="font-size:17px;font-weight:700;color:#fff;margin-bottom:3px">/${a.endpoint}</h4>
                    <p style="font-size:11px;color:#888;margin-bottom:10px">${a.desc}</p>
                    <div style="display:flex;gap:5px;font-family:monospace;font-size:11px"><code style="color:#ff9100;background:#ff910010;padding:2px 6px;border-radius:3px">${a.param}</code><span style="color:#555">=</span><code style="color:#aaa">${a.example}</code></div>
                </div>`).join('')}</div>
        </div>`;
    }

    const te = Object.keys(endpoints).length + vapis.length;
    const tk = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    const epOpts = Object.entries(endpoints).map(([n, e]) => `<option value="${n}">${e.icon} ${n.toUpperCase()} — ${e.desc}</option>`).join('');
    const custOpts = vapis.map(a => `<option value="c_${a.id}" data-c="1" data-ep="${a.endpoint}" data-p="${a.param}">🔧 ${a.name}</option>`).join('');

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX OSINT — Intelligence Platform</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>
:root{--bg:#050510;--c1:#0a0a1a;--b1:#1e1e35;--b2:#2a2a45;--t:#e0e0e5;--t2:#888;--t3:#555;--gold:#d4a574;--g2:#e8b4b8}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--t);font-family:'Inter',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:#2a2a45;border-radius:10px}
.hr{position:relative;padding:70px 25px 55px;text-align:center;overflow:hidden}
.hr::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,#d4a57408,#e8b4b806,transparent 60%);z-index:0}
.ho{position:absolute;border-radius:50%;filter:blur(100px);opacity:0.04;animation:oa 12s infinite}
.ho:nth-child(1){width:550px;height:550px;background:#d4a574;top:-200px;left:-100px}
.ho:nth-child(2){width:450px;height:450px;background:#e0115f;top:-100px;right:-100px;animation-delay:-4s}
.ho:nth-child(3){width:350px;height:350px;background:#0f52ba;bottom:-100px;left:35%;animation-delay:-8s}
@keyframes oa{0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(30px,-20px)scale(1.08)}66%{transform:translate(-20px,15px)scale(0.92)}}
.hc{position:relative;z-index:2;max-width:700px;margin:0 auto}
.aw{position:relative;display:inline-block;margin-bottom:25px}
.ar{position:absolute;inset:-7px;border-radius:50%;background:conic-gradient(#d4a574,#e8b4b8,#e0115f,#50c878,#0f52ba,#9966cc,#d4a574);animation:rs 3s linear infinite;filter:blur(1px)}
.ar::after{content:'';position:absolute;inset:3px;background:var(--bg);border-radius:50%}
@keyframes rs{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.ai{width:130px;height:130px;border-radius:50%;object-fit:cover;display:block;position:relative;z-index:1;border:3px solid #1a1a2e;box-shadow:0 0 30px rgba(212,167,116,0.2)}
.ht{font-size:44px;font-weight:900;letter-spacing:-1.5px;margin-bottom:6px;background:linear-gradient(135deg,#d4a574,#e8b4b8,#fff,#b9f2ff,#d4a574);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hs{font-size:17px;font-weight:600;letter-spacing:2px;text-transform:uppercase;background:linear-gradient(90deg,#d4a574,#e8b4b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.hd{font-size:12px;color:#555;letter-spacing:1px;margin-bottom:22px}
.htgs{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
.htg{padding:8px 20px;border-radius:50px;font-size:10px;font-weight:700;letter-spacing:1.5px;border:1px solid;cursor:default;transition:all 0.3s}
.htg:hover{transform:translateY(-2px)}
.g1{border-color:#d4a574;color:#d4a574;box-shadow:0 0 12px rgba(212,167,116,0.1)}.g1:hover{box-shadow:0 0 25px rgba(212,167,116,0.3)}
.g2{border-color:#e0115f;color:#e0115f;box-shadow:0 0 12px rgba(224,17,95,0.1)}.g2:hover{box-shadow:0 0 25px rgba(224,17,95,0.3)}
.g3{border-color:#0f52ba;color:#0f52ba;box-shadow:0 0 12px rgba(15,82,186,0.1)}.g3:hover{box-shadow:0 0 25px rgba(15,82,186,0.3)}
.g4{border-color:#50c878;color:#50c878;box-shadow:0 0 12px rgba(80,200,120,0.1)}.g4:hover{box-shadow:0 0 25px rgba(80,200,120,0.3)}
.ct{max-width:1300px;margin:0 auto;padding:0 25px}
.sb{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;padding:24px;margin:-30px auto 35px;max-width:750px;background:rgba(10,10,26,0.9);border:1px solid #1e1e35;border-radius:14px;z-index:5;backdrop-filter:blur(20px);box-shadow:0 10px 50px rgba(0,0,0,0.4)}
.si{text-align:center;min-width:75px;flex:1}.sv{font-size:30px;font-weight:900;background:linear-gradient(135deg,#d4a574,#e8b4b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.sl{font-size:8px;text-transform:uppercase;letter-spacing:2px;color:#555;margin-top:3px;font-weight:600}.sdiv{width:1px;background:#2a2a45;align-self:stretch;margin:4px 0}
.pg{background:var(--c1);border:1px solid var(--b1);border-radius:14px;padding:24px;margin-bottom:35px;position:relative;overflow:hidden}
.pg::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#d4a574,#e8b4b8,transparent)}
.pgh{display:flex;align-items:center;gap:10px;margin-bottom:18px}.pgd{width:10px;height:10px;background:#d4a574;border-radius:50%;box-shadow:0 0 12px #d4a574;animation:dp 2s infinite}@keyframes dp{0%,100%{box-shadow:0 0 8px #d4a574}50%{box-shadow:0 0 20px #d4a574,0 0 30px rgba(212,167,116,0.4)}}
.pgh h3{font-size:17px;font-weight:700}
.pgf{display:flex;gap:8px;flex-wrap:wrap}.pgf select,.pgf input{flex:1;min-width:150px;padding:12px 16px;background:var(--bg);border:1px solid var(--b2);border-radius:10px;color:var(--t);font-size:12px;font-family:monospace;outline:none;transition:all 0.3s}.pgf select:focus,.pgf input:focus{border-color:#d4a574;box-shadow:0 0 0 3px rgba(212,167,116,0.05)}
.br{padding:12px 28px;background:linear-gradient(135deg,#d4a574,#e8b4b8);color:#000;border:none;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;transition:all 0.3s;font-family:inherit;box-shadow:0 0 15px rgba(212,167,116,0.15)}.br:hover{transform:translateY(-1px);box-shadow:0 0 30px rgba(212,167,116,0.3)}
.rb{margin-top:16px;background:#020210;border:1px solid var(--b1);border-radius:10px;padding:16px;max-height:300px;overflow:auto;font-family:monospace;font-size:11px;display:none;white-space:pre-wrap;color:#d4a574}
.ft{text-align:center;padding:40px 20px;border-top:1px solid var(--b1);margin-top:40px}.fb{font-size:20px;font-weight:800;background:linear-gradient(135deg,#d4a574,#e8b4b8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.fi{font-size:11px;color:#555;margin-top:5px}.fl{color:#888;text-decoration:none}.fl:hover{color:#d4a574}
.tst{position:fixed;bottom:25px;right:25px;background:var(--c1);color:#d4a574;padding:12px 22px;border-radius:10px;font-size:12px;font-weight:600;border:1px solid rgba(212,167,116,0.25);z-index:9999;opacity:0;transition:opacity 0.3s;box-shadow:0 8px 40px rgba(0,0,0,0.5);pointer-events:none}
@media(max-width:768px){.ht{font-size:28px}.ai{width:100px;height:100px}.pgf{flex-direction:column}.pgf select,.pgf input{min-width:100%}.br{width:100%}}
</style></head><body>
<div class="ho"></div><div class="ho"></div><div class="ho"></div>
<header class="hr"><div class="hc"><div class="aw"><div class="ar"></div><img src="https://i.ibb.co/YTjW35Hs/file-000000007b0872069c1067c615adaa48.png" alt="BRONX" class="ai" onerror="this.style.display='none'"></div><h1 class="ht">BRONX OSINT</h1><p class="hs">Intelligence Platform</p><p class="hd">Enterprise OSINT · Real-Time Data · Military Grade Security</p><div class="htgs"><span class="htg g1">💎 Premium</span><span class="htg g2">🛡️ Secure</span><span class="htg g3">⚡ Realtime</span><span class="htg g4">🌟 Elite</span></div></div></header>
<div class="ct">
<div class="sb"><div class="si"><div class="sv">${te}</div><div class="sl">Endpoints</div></div><div class="sdiv"></div><div class="si"><div class="sv">${tk}</div><div class="sl">Keys</div></div><div class="sdiv"></div><div class="si"><div class="sv">JSON</div><div class="sl">Response</div></div><div class="sdiv"></div><div class="si"><div class="sv">26+</div><div class="sl">APIs</div></div></div>
<div class="pg"><div class="pgh"><div class="pgd"></div><h3>API Playground</h3></div><div class="pgf"><select id="es"><option value="">Select Endpoint</option>${epOpts}${custOpts}</select><input type="text" id="ak" placeholder="API Key"><input type="text" id="pv" placeholder="Parameter"><button class="br" onclick="ta()">Execute</button></div><div class="rb" id="rb"></div></div>
${epsHTML}</div>
<footer class="ft"><p class="fb">BRONX OSINT</p><p class="fi">Powered by <strong>@BRONX_ULTRA</strong> · India (IST) · <a href="/admin" class="fl">Admin</a></p></footer>
<script>
const ep=${JSON.stringify(endpoints)};
function cp(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/key-bronx/'+e+'?key=KEY&'+p+'='+ex);st('URL Copied')}
function cpc(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/custom/'+e+'?key=KEY&'+p+'='+ex);st('URL Copied')}
function st(m){let t=document.getElementById('tst');if(!t){t=document.createElement('div');t.id='tst';t.className='tst';document.body.appendChild(t)}t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2000)}
async function ta(){const s=document.getElementById('es');const o=s.options[s.selectedIndex];const ic=o.dataset.c==='1';const k=document.getElementById('ak').value;const v=document.getElementById('pv').value;const r=document.getElementById('rb');if(!k||!v||!s.value){st('Fill all fields');return}let url=ic?'/api/custom/'+o.dataset.ep+'?key='+k+'&'+o.dataset.p+'='+v:'/api/key-bronx/'+s.value+'?key='+k+'&'+ep[s.value].param+'='+v;r.style.display='block';r.textContent='Loading...';r.style.color='#888';try{const re=await fetch(url);const d=await re.json();r.textContent=JSON.stringify(d,null,2);r.style.color='#d4a574'}catch(e){r.textContent='Error: '+e.message;r.style.color='#e0115f'}}
</script></body></html>`;
}

// ========== RENDER ADMIN LOGIN ==========
function renderAdminLogin() {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX — Admin</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#050510;min-height:100vh;display:flex;justify-content:center;align-items:center;font-family:'Inter',sans-serif}
.lb{background:#0a0a1a;border:1px solid #1e1e35;border-radius:16px;padding:45px 40px;width:400px;box-shadow:0 20px 70px rgba(0,0,0,0.5)}.lb::before{content:'';display:block;height:2px;background:linear-gradient(90deg,transparent,#d4a574,#e8b4b8,transparent);margin-bottom:30px}
.lb h2{text-align:center;color:#fff;font-size:22px;font-weight:800;margin-bottom:4px}.lb .sub{text-align:center;color:#555;font-size:11px;margin-bottom:25px}
.fg{margin-bottom:16px}.fg label{display:block;color:#888;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;font-weight:700}
.fg input{width:100%;padding:12px 16px;background:#050510;border:1px solid #2a2a45;border-radius:10px;color:#e0e0e0;font-size:13px;font-family:inherit;outline:none;transition:all 0.3s}.fg input:focus{border-color:#d4a574}
.bl{width:100%;padding:13px;background:linear-gradient(135deg,#d4a574,#e8b4b8);color:#000;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.3s;font-family:inherit;margin-top:6px}.bl:hover{box-shadow:0 0 30px rgba(212,167,116,0.3)}
.err{color:#e0115f;text-align:center;margin-top:12px;font-size:12px;display:none}.bk{text-align:center;margin-top:18px}.bk a{color:#555;text-decoration:none;font-size:11px}.bk a:hover{color:#d4a574}
</style></head><body><div class="lb"><h2>Admin Access</h2><p class="sub">BRONX OSINT Control</p><div class="fg"><label>Username</label><input type="text" id="u" placeholder="Username" autocomplete="off"></div><div class="fg"><label>Password</label><input type="password" id="p" placeholder="Password"></div><button class="bl" onclick="li()">Authenticate</button><div class="err" id="er"></div><div class="bk"><a href="/">← Home</a></div></div>
<script>
async function li(){const u=document.getElementById('u').value;const p=document.getElementById('p').value;const e=document.getElementById('er');if(!u||!p){e.style.display='block';e.textContent='Fill all';return}try{const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});const d=await r.json();if(d.success){e.style.display='block';e.style.color='#d4a574';e.textContent=d.message;localStorage.setItem('btk',d.token);setTimeout(()=>window.location.href=d.redirect,700)}else{e.style.display='block';e.style.color='#e0115f';e.textContent=d.error}}catch(er){e.style.display='block';e.style.color='#e0115f';e.textContent='Error'}}
document.addEventListener('keydown',ev=>{if(ev.key==='Enter')li()});
</script></body></html>`;
}

// ========== RENDER ADMIN PANEL ==========
function renderAdminPanel(token) {
    const allKeys = Object.entries(keyStorage).map(([k, d]) => ({ key: k, ...d, isExpired: d.expiry && isKeyExpired(d.expiry), isExhausted: !d.unlimited && d.used >= d.limit, remaining: d.unlimited ? '∞' : Math.max(0, d.limit - d.used) }));
    const tk = allKeys.filter(k => !k.hidden).length;
    const ak = allKeys.filter(k => !k.hidden && !k.isExpired && !k.isExhausted).length;
    const tr = requestLogs.filter(l => l.timestamp.startsWith(getIndiaDate())).length;

    const eus = {};
    requestLogs.forEach(l => { const ep = l.endpoint || '?'; if (!eus[ep]) eus[ep] = { t: 0, s: 0, f: 0 }; eus[ep].t++; l.status === 'success' ? eus[ep].s++ : eus[ep].f++; });

    let keyRows = allKeys.map(k => {
        let sts = 'Active', sc = 'sg';
        if (k.hidden) { sts = 'Master'; sc = 'sp'; } else if (k.isExpired) { sts = 'Expired'; sc = 'sr'; } else if (k.isExhausted) { sts = 'Limit'; sc = 'so'; }
        const dk = k.key.length > 30 ? k.key.substring(0, 27) + '...' : k.key;
        const sd = k.scopes.includes('*') ? '<span class="stg">ALL</span>' : k.scopes.slice(0, 5).map(s => '<span class="stg">' + s + '</span>').join('') + (k.scopes.length > 5 ? ' <span class="stg">+' + (k.scopes.length - 5) + '</span>' : '');
        return '<tr><td><code style="color:#d4a574;font-size:10px" title="' + k.key + '">' + dk + '</code></td><td>' + (k.name || '—') + '</td><td style="font-size:9px">' + sd + '</td><td>' + (k.unlimited ? '∞' : k.limit) + '</td><td>' + k.used + '</td><td>' + (k.unlimited ? '∞' : Math.max(0, k.limit - k.used)) + '</td><td>' + (k.expiryStr || 'Lifetime') + '</td><td><span class="sd ' + sc + '">' + sts + '</span></td><td>' + '<button onclick="rk(\'' + k.key + '\')" class="bxs bi">R</button> ' + (k.key !== 'BRONX_ULTRA_MASTER_2026' ? '<button onclick="dk(\'' + k.key + '\')" class="bxs bd">D</button>' : '') + '</td></tr>';
    }).join('');

    let scopeHTML = scopeOptions.map(s => '<label class="cbl"><input type="checkbox" value="' + s.v + '"> ' + s.l + '</label>').join('');

    let logHTML = requestLogs.slice(-20).reverse().map(l => {
        let sc = l.status === 'success' ? 'sg' : (l.status === 'failed' ? 'sr' : 'so');
        return '<div class="lr"><span class="lt">' + l.timestamp + '</span><span class="lk">' + l.key + '</span><code class="le">/' + l.endpoint + '</code><span class="lb">' + getBrowser(l.browser) + '</span><span class="' + sc + '">' + l.status + '</span></div>';
    }).join('') || '<p style="color:#555;text-align:center;padding:20px">No requests</p>';

    let usageHTML = Object.entries(eus).sort((a, b) => b[1].t - a[1].t).map(([ep, d]) => '<tr><td><code style="color:#d4a574">/' + ep + '</code></td><td><b>' + d.t + '</b></td><td style="color:#50c878">' + d.s + '</td><td style="color:#e0115f">' + d.f + '</td></tr>').join('') || '<tr><td colspan="4" style="text-align:center;color:#555;padding:20px">No data</td></tr>';

    let customHTML = customAPIs.map((a, i) => `
        <div style="background:#050510;border:1px solid #1e1e35;border-radius:8px;padding:12px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px" id="cv${i}">
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <b style="color:#d4a574">#${a.id}</b>
                    <span style="color:#fff;font-weight:600;font-size:13px">${a.name || 'Empty'}</span>
                    ${a.endpoint ? '<code style="color:#0f52ba;font-size:11px">/' + a.endpoint + '</code>' : '<span style="color:#555;font-size:11px">No endpoint</span>'}
                    <span style="padding:2px 10px;border-radius:10px;font-size:9px;font-weight:700;${a.visible ? 'background:rgba(80,200,120,0.1);color:#50c878' : 'background:rgba(224,17,95,0.1);color:#e0115f'}">${a.visible ? 'ON' : 'OFF'}</span>
                </div>
                <div style="display:flex;gap:5px">
                    <button onclick="eca(${i})" class="bxs bi">Edit</button>
                    <button onclick="tca(${i})" class="bxs bw">Toggle</button>
                </div>
            </div>
            <div id="ce${i}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid #1e1e35">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">
                    <div class="fg"><label>Name</label><input type="text" id="cn${i}" value="${a.name || ''}"></div>
                    <div class="fg"><label>Endpoint</label><input type="text" id="cep${i}" value="${a.endpoint || ''}"></div>
                    <div class="fg"><label>Parameter</label><input type="text" id="cp${i}" value="${a.param || ''}"></div>
                    <div class="fg"><label>Example</label><input type="text" id="cex${i}" value="${a.example || ''}"></div>
                    <div class="fg"><label>Description</label><input type="text" id="cd${i}" value="${a.desc || ''}"></div>
                    <div class="fg"><label>Real API URL</label><input type="text" id="crl${i}" value="${a.realAPI || ''}"></div>
                    <div class="fg"><label>Visible</label><select id="cv${i}"><option value="1" ${a.visible ? 'selected' : ''}>Yes</option><option value="0" ${!a.visible ? 'selected' : ''}>No</option></select></div>
                    <div class="fg" style="grid-column:1/-1;display:flex;gap:8px">
                        <button class="btn bp btn-sm" onclick="sca(${i})">Save</button>
                        <button class="btn bo btn-sm" onclick="cca(${i})">Cancel</button>
                    </div>
                </div>
            </div>
        </div>`).join('');

    const exportJSON = JSON.stringify(keyStorage, null, 2).replace(/"/g, '&quot;').replace(/</g, '&lt;');

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX — Admin Panel</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"><style>
:root{--bg:#050510;--c:#0a0a1a;--c2:#0f0f20;--b1:#1e1e35;--b2:#2a2a45;--t:#e0e0e5;--t2:#888;--t3:#555;--g:#50c878;--gold:#d4a574;--r:#e0115f;--o:#ff9100;--bl:#0f52ba;--p:#9966cc;--rad:12px;--rs:7px}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--t);font-family:'Inter',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:#1e1e35;border-radius:10px}
.tb{background:var(--c);border-bottom:1px solid var(--b1);padding:12px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;position:sticky;top:0;z-index:100}
.tb h1{font-size:16px;font-weight:800;color:#fff}.tb h1 span{color:var(--gold)}.tbr{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.tbt{font-size:9px;color:var(--t3);font-family:monospace}
.ct{max-width:1400px;margin:0 auto;padding:18px 22px}
.sr{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
.sc{background:var(--c);border:1px solid var(--b1);border-radius:var(--rad);padding:18px;text-align:center}.sn{font-size:32px;font-weight:900;color:var(--gold)}.sl{font-size:8px;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-top:3px;font-weight:600}
.tabs{display:flex;gap:5px;margin-bottom:16px;flex-wrap:wrap}
.tab{padding:8px 18px;background:var(--c);border:1px solid var(--b1);border-radius:var(--rs);color:var(--t3);cursor:pointer;font-size:12px;font-weight:600;transition:all 0.3s}
.tab.active{border-color:var(--gold);color:var(--gold);background:rgba(212,167,116,0.04)}.tab:hover{border-color:#333;color:#ccc}
.panel{display:none}.panel.active{display:block}
.sec{background:var(--c);border:1px solid var(--b1);border-radius:var(--rad);padding:22px;margin-bottom:18px}
.sec h3{font-size:15px;font-weight:700;color:#fff;margin-bottom:16px}
.fr{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.fg label{display:block;color:var(--t3);font-size:8px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;font-weight:700}
.fg input,.fg select,.fg textarea{width:100%;padding:9px 12px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs);color:var(--t);font-size:11px;font-family:inherit;outline:none;transition:all 0.3s}
.fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--gold)}
.fw{grid-column:1/-1}
.cbw{display:flex;flex-wrap:wrap;gap:4px;max-height:130px;overflow:auto;padding:8px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs)}
.cbl{display:flex;align-items:center;gap:4px;font-size:10px;color:#aaa;cursor:pointer;padding:2px 7px;border-radius:3px}.cbl:hover{background:rgba(255,255,255,0.02)}.cbl input{accent-color:var(--gold)}
.btn{padding:9px 20px;border-radius:var(--rs);font-weight:600;font-size:12px;cursor:pointer;border:none;transition:all 0.3s;font-family:inherit}
.bp{background:linear-gradient(135deg,var(--gold),#e8b4b8);color:#000;box-shadow:0 0 15px rgba(212,167,116,0.1)}.bp:hover{box-shadow:0 0 25px rgba(212,167,116,0.25)}
.bo{background:transparent;border:1px solid var(--b2);color:var(--t2);padding:9px 16px;border-radius:var(--rs);cursor:pointer;font-weight:600;font-size:11px;transition:all 0.3s;font-family:inherit}.bo:hover{border-color:var(--gold);color:var(--gold)}
.bxs{padding:3px 8px;font-size:9px;border-radius:3px;border:1px solid;cursor:pointer;font-weight:600;font-family:inherit}
.bi{background:rgba(15,82,186,0.1);color:var(--bl);border-color:rgba(15,82,186,0.25)}.bi:hover{background:rgba(15,82,186,0.2)}
.bd{background:rgba(224,17,95,0.1);color:var(--r);border-color:rgba(224,17,95,0.25)}.bd:hover{background:rgba(224,17,95,0.2)}
.bw{background:rgba(255,145,0,0.1);color:var(--o);border-color:rgba(255,145,0,0.25)}.bw:hover{background:rgba(255,145,0,0.2)}
.tw{max-height:380px;overflow:auto;border-radius:var(--rs);border:1px solid var(--b1)}
table{width:100%;border-collapse:collapse;font-size:10px}
th{background:var(--c2);color:var(--t3);padding:9px 7px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:8px;position:sticky;top:0;z-index:10;border-bottom:2px solid var(--b1)}
td{padding:8px 7px;border-bottom:1px solid rgba(255,255,255,0.02)}tr:hover{background:rgba(255,255,255,0.01)}
.sd{padding:2px 8px;border-radius:10px;font-size:8px;font-weight:700;letter-spacing:1px}
.sg{background:rgba(80,200,120,0.1);color:var(--g)}.sr{background:rgba(224,17,95,0.1);color:var(--r)}.so{background:rgba(255,145,0,0.1);color:var(--o)}.sp{background:rgba(153,102,204,0.1);color:var(--p)}
.stg{display:inline-block;padding:1px 5px;background:rgba(212,167,116,0.04);border:1px solid rgba(212,167,116,0.1);border-radius:6px;font-size:8px;margin:1px;color:var(--gold)}
.lbx{max-height:320px;overflow:auto;background:var(--bg);border-radius:var(--rs);padding:12px;font-size:10px;font-family:monospace}
.lr{display:flex;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.015);flex-wrap:wrap;align-items:center}
.lt{color:#333;min-width:120px;font-size:9px}.lk{color:var(--gold);font-size:9px}.le{color:var(--bl);font-size:9px}.lb{color:var(--t3);font-size:8px}
.iebox{background:var(--c);border:1px solid var(--o);border-radius:var(--rad);padding:18px;margin-bottom:18px}
.iebox h3{color:var(--o);font-size:14px;margin-bottom:10px}
.iebox textarea{width:100%;min-height:100px;background:var(--bg);border:1px solid var(--b2);color:var(--t);padding:10px;border-radius:var(--rs);font-family:monospace;font-size:10px;resize:vertical}
.fg input[type="date"]{color-scheme:dark;cursor:pointer}.fg input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.6)}
.esg{display:flex;gap:6px;align-items:center}
.toast{position:fixed;bottom:20px;right:20px;background:var(--c);color:var(--gold);padding:10px 20px;border-radius:var(--rs);font-size:12px;font-weight:600;border:1px solid rgba(212,167,116,0.25);z-index:9999;opacity:0;transition:opacity 0.3s;box-shadow:0 8px 30px rgba(0,0,0,0.5)}
@media(max-width:768px){.sr{grid-template-columns:repeat(2,1fr)}}
</style></head><body>
<div class="tb"><h1>BRONX <span>OSINT</span> — Admin</h1><div class="tbr"><span class="tbt">🇮🇳 ${getIndiaDateTime()}</span><button class="bo" onclick="window.open('/')">Home</button><button class="bo" onclick="lo()">Logout</button></div></div>
<div class="ct">
<div class="sr"><div class="sc"><div class="sn">${tk}</div><div class="sl">Total Keys</div></div><div class="sc"><div class="sn">${ak}</div><div class="sl">Active</div></div><div class="sc"><div class="sn">${requestLogs.length}</div><div class="sl">Requests</div></div><div class="sc"><div class="sn">${tr}</div><div class="sl">Today</div></div></div>
<div class="tabs"><div class="tab active" onclick="st('gen')">Generator</div><div class="tab" onclick="st('keys')">Keys</div><div class="tab" onclick="st('io')">Import/Export</div><div class="tab" onclick="st('custom')">Custom APIs</div><div class="tab" onclick="st('usage')">Usage</div><div class="tab" onclick="st('logs')">Logs</div></div>
<div class="panel active" id="p-gen"><div class="sec"><h3>Generate API Key</h3><div class="fr">
<div class="fg"><label>Key Name</label><input type="text" id="gkn" placeholder="PREMIUM_001"></div>
<div class="fg"><label>Owner</label><input type="text" id="gko" placeholder="Name"></div>
<div class="fg"><label>Limit</label><input type="text" id="gkl" placeholder="100 or unlimited"></div>
<div class="fg"><label>Expiry</label><div class="esg"><select id="ges" onchange="hes()"><option value="LIFETIME">🌟 Lifetime</option><option value="31-12-2026">31 Dec 2026</option><option value="31-12-2027">31 Dec 2027</option><option value="30-06-2026">30 Jun 2026</option><option value="custom">📅 Custom</option></select></div><input type="date" id="gec" style="display:none;margin-top:5px" onchange="uec()"></div>
<div class="fg"><label>Type</label><select id="gkt"><option value="premium">Premium</option><option value="demo">Demo</option><option value="test">Test</option></select></div>
<div class="fg fw"><label>Scopes</label><div class="cbw" id="scb">${scopeHTML}</div></div>
<div class="fg fw"><button class="btn bp" onclick="gk()" style="width:100%">Generate Key</button></div>
</div></div></div>
<div class="panel" id="p-keys"><div class="sec"><h3>All Keys (${tk})</h3><div style="margin-bottom:10px;display:flex;gap:8px"><input type="text" id="ks" placeholder="Search..." onkeyup="fk()" style="padding:8px 12px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs);color:var(--t);font-size:11px;width:240px"><button class="bo" onclick="rak()">Reset All</button></div><div class="tw"><table><thead><tr><th>Key</th><th>Owner</th><th>Scopes</th><th>Limit</th><th>Used</th><th>Left</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody id="kb">${keyRows}</tbody></table></div></div></div>
<div class="panel" id="p-io"><div class="iebox"><h3>📤 Export</h3><textarea readonly id="ed" onclick="this.select()">${exportJSON}</textarea><button class="btn bo btn-sm" style="margin-top:8px" onclick="ce()">Copy</button></div><div class="iebox" style="border-color:var(--bl)"><h3 style="color:var(--bl)">📥 Import</h3><textarea id="id" placeholder="Paste JSON..."></textarea><button class="btn bp btn-sm" style="margin-top:8px" onclick="ik()">Import Keys</button></div></div>
<div class="panel" id="p-custom"><div class="sec"><h3>Custom APIs</h3>${customHTML}</div></div>
<div class="panel" id="p-usage"><div class="sec"><h3>API Usage</h3><div class="tw"><table><thead><tr><th>Endpoint</th><th>Total</th><th>Success</th><th>Failed</th></tr></thead><tbody>${usageHTML}</tbody></table></div></div></div>
<div class="panel" id="p-logs"><div class="sec"><h3>Request Logs</h3><div style="margin-bottom:10px"><button class="bo" onclick="cl()">Clear</button></div><div class="lbx">${logHTML}</div></div></div>
</div>
<script>
const TOKEN='${token}';if(TOKEN)localStorage.setItem('btk',TOKEN);
function toast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2000)}
function st(n){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));document.getElementById('p-'+n).classList.add('active');event.target.classList.add('active')}
async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','x-admin-token':TOKEN},body:body?JSON.stringify(body):undefined});return await r.json()}
function hes(){const s=document.getElementById('ges');const c=document.getElementById('gec');c.style.display=s.value==='custom'?'block':'none'}
function uec(){document.getElementById('ges').value='custom'}
function ge(){const s=document.getElementById('ges');if(s.value==='custom'){const c=document.getElementById('gec');if(!c.value){toast('Select date');return null}const p=c.value.split('-');return p[2]+'-'+p[1]+'-'+p[0]}return s.value}
async function gk(){const n=document.getElementById('gkn').value.trim();const o=document.getElementById('gko').value.trim();const l=document.getElementById('gkl').value.trim();const e=ge();if(!e)return;const t=document.getElementById('gkt').value;if(!n||!o){toast('Fill all');return}const sc=[];document.querySelectorAll('#scb input:checked').forEach(c=>sc.push(c.value));if(!sc.length){toast('Select scope');return}const d=await api('/admin/generate-key',{keyName:n,keyOwner:o,scopes:sc,limit:l||'100',expiryDate:e,keyType:t});d.success?(toast('✅ '+n),setTimeout(()=>location.reload(),1000)):toast(d.error)}
async function dk(k){if(!confirm('Delete?'))return;const d=await api('/admin/delete-key',{keyName:k});d.success?(toast('Deleted'),setTimeout(()=>location.reload(),700)):toast(d.error)}
async function rk(k){const d=await api('/admin/reset-key-usage',{keyName:k});d.success?(toast('Reset'),setTimeout(()=>location.reload(),700)):toast(d.error)}
async function rak(){if(!confirm('Reset all?'))return;const d=await api('/admin/keys');if(d.success)for(const k of d.keys)await api('/admin/reset-key-usage',{keyName:k.key});toast('Done');setTimeout(()=>location.reload(),700)}
async function cl(){if(!confirm('Clear?'))return;await api('/admin/clear-logs');toast('Cleared');setTimeout(()=>location.reload(),700)}
async function lo(){localStorage.removeItem('btk');await api('/admin/logout');window.location.href='/admin'}
function fk(){const s=document.getElementById('ks').value.toLowerCase();document.querySelectorAll('#kb tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(s)?'':'none'})}
function ce(){document.getElementById('ed').select();document.execCommand('copy');toast('Copied')}
async function ik(){const r=document.getElementById('id').value.trim();if(!r){toast('Paste JSON');return}try{const d=JSON.parse(r);const re=await api('/admin/import-keys',{keys:d});re.success?(toast('Imported: '+re.imported),setTimeout(()=>location.reload(),1000)):toast(re.error)}catch(e){toast('Invalid JSON')}}
function eca(i){document.getElementById('ce'+i).style.display='block';document.getElementById('cv'+i).style.display='none'}
function cca(i){document.getElementById('ce'+i).style.display='none';document.getElementById('cv'+i).style.display='flex'}
async function sca(i){const d={name:document.getElementById('cn'+i).value,endpoint:document.getElementById('cep'+i).value,param:document.getElementById('cp'+i).value,example:document.getElementById('cex'+i).value,desc:document.getElementById('cd'+i).value,realAPI:document.getElementById('crl'+i).value,visible:document.getElementById('cv'+i).value==='1'};const re=await api('/admin/custom-api',{slot:i,api:d});re.success?(toast('Saved'),setTimeout(()=>location.reload(),700)):toast(re.error)}
async function tca(i){const re=await api('/admin/custom-api',{slot:i,api:{visible:!${JSON.stringify(customAPIs)}[i].visible}});re.success?(toast('Toggled'),setTimeout(()=>location.reload(),600)):toast(re.error)}
</script></body></html>`;
}

// ========== EXPRESS MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    req.clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    req.userAgent = req.headers['user-agent'] || 'Unknown';
    next();
});

// ========== DIAGNOSTIC ENDPOINT ==========
app.get('/redis-check', async (req, res) => {
    try {
        const testKey = 'bronx_connection_test_' + Date.now();
        await redisSet(testKey, { test: true, time: getIndiaDateTime() });
        const readBack = await redisGet(testKey);
        await redisDel(testKey);
        
        res.json({
            success: readBack && readBack.test === true,
            redis_url: REDIS_URL ? REDIS_URL.substring(0, 40) + '...' : 'NOT SET',
            redis_token: REDIS_TOKEN ? REDIS_TOKEN.substring(0, 12) + '...' : 'NOT SET',
            keys_in_storage: Object.keys(keyStorage).length,
            admin_tokens: Object.keys(permanentTokens).length,
            total_logs: requestLogs.length,
            test_write_read: readBack ? 'PASSED' : 'FAILED',
            server_time: getIndiaDateTime()
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ========== PUBLIC ROUTES ==========
app.get('/', (req, res) => res.send(renderHome()));
app.get('/test', (req, res) => res.json({ status: 'BRONX OSINT v12', time: getIndiaDateTime(), redis: REDIS_URL ? 'CONFIGURED' : 'NOT CONFIGURED' }));

app.get('/key-info', (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Missing key' });
    const kd = keyStorage[key];
    if (!kd || kd.hidden) return res.status(404).json({ error: 'Not found' });
    const remaining = kd.unlimited ? 'Unlimited' : Math.max(0, kd.limit - kd.used);
    res.json({ success: true, owner: kd.name, limit: kd.unlimited ? 'Unlimited' : kd.limit, used: kd.used, remaining, expiry: kd.expiryStr || 'LIFETIME' });
});

app.get('/quota', (req, res) => {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Missing key' });
    const kd = keyStorage[key];
    if (!kd || kd.hidden) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, remaining: kd.unlimited ? 'Unlimited' : Math.max(0, kd.limit - kd.used) });
});

// ========== CUSTOM API ==========
app.get('/api/custom/:ep', async (req, res) => {
    const { ep } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    const ca = customAPIs.find(a => a.endpoint === ep && a.visible);
    if (!ca) return res.status(404).json({ error: 'Not found' });
    if (!apiKey) return res.status(401).json({ error: 'Key required' });
    const kc = checkKeyValid(apiKey);
    if (!kc.valid) return res.status(403).json({ error: kc.error });
    const pv = req.query[ca.param];
    if (!pv) return res.status(400).json({ error: 'Missing: ' + ca.param });
    try {
        let ru = ca.realAPI.replace(/\{param\}/gi, encodeURIComponent(pv));
        const resp = await axios.get(ru, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        logRequest(apiKey, 'c/' + ep, pv, 'success', req.clientIP, req.userAgent);
        const cd = sanitizeResponse(resp.data);
        cd.api_info = { by: '@BRONX_ULTRA', ts: getIndiaDateTime() };
        res.json(cd);
    } catch (e) { res.status(500).json({ error: 'API error' }); }
});

// ========== MAIN API ==========
app.get('/api/key-bronx/:ep', async (req, res) => {
    const { ep } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    if (!endpoints[ep]) return res.status(404).json({ error: 'Not found' });
    if (!apiKey) return res.status(401).json({ error: 'Key required' });
    const kc = checkKeyValid(apiKey);
    if (!kc.valid) return res.status(403).json({ error: kc.error });
    if (!checkKeyScope(kc.keyData, ep).valid) return res.status(403).json({ error: 'Scope denied' });
    const e = endpoints[ep], pv = req.query[e.param];
    if (!pv) return res.status(400).json({ error: 'Missing param' });
    try {
        const ru = `${REAL_API_BASE}/${ep}?key=${REAL_API_KEY}&${e.param}=${encodeURIComponent(pv)}`;
        const resp = await axios.get(ru, { timeout: 30000 });
        const uk = incrementKeyUsage(apiKey);
        logRequest(apiKey, ep, pv, 'success', req.clientIP, req.userAgent);
        const cd = sanitizeResponse(resp.data);
        cd.api_info = { by: '@BRONX_ULTRA', ep, used: uk ? uk.used : kc.keyData.used, remaining: kc.keyData.unlimited ? '∞' : Math.max(0, kc.keyData.limit - (uk ? uk.used : kc.keyData.used)), ts: getIndiaDateTime() };
        res.json(cd);
    } catch (e) { res.status(500).json({ error: 'API error' }); }
});

// ========== ADMIN ROUTES ==========
app.get('/admin', (req, res) => {
    const t = req.query.token || req.headers['x-admin-token'];
    isAdminAuth(t) ? res.send(renderAdminPanel(t)) : res.send(renderAdminLogin());
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateToken();
        adminSessions[token] = { expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), permanent: true };
        permanentTokens[token] = { createdAt: getIndiaDateTime() };
        await saveAllData();
        res.json({ success: true, token, message: '✅ Welcome!', redirect: '/admin?token=' + token });
    } else res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.post('/admin/logout', async (req, res) => {
    const t = req.headers['x-admin-token'] || req.query.token;
    if (t) { delete adminSessions[t]; delete permanentTokens[t]; await saveAllData(); }
    res.json({ success: true });
});

app.get('/admin/check-auth', (req, res) => {
    res.json({ auth: isAdminAuth(req.query.token || req.headers['x-admin-token']) });
});

app.post('/admin/generate-key', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    const { keyName, keyOwner, scopes, limit, expiryDate, keyType } = req.body;
    if (!keyName || !keyOwner || !scopes?.length) return res.status(400).json({ error: 'Missing fields' });
    if (keyStorage[keyName]) return res.status(400).json({ error: 'Key exists' });
    const isU = limit === 'unlimited' || parseInt(limit) >= 999999;
    keyStorage[keyName] = {
        name: keyOwner, scopes, type: keyType || 'premium',
        limit: isU ? 999999 : parseInt(limit) || 100, used: 0,
        expiry: (expiryDate && expiryDate !== 'LIFETIME') ? parseExpiryDate(expiryDate) : null,
        expiryStr: expiryDate || 'LIFETIME', created: getIndiaDateTime(),
        resetType: 'never', unlimited: isU, hidden: false
    };
    await saveAllData();
    res.json({ success: true, message: '✅ Generated: ' + keyName });
});

app.post('/admin/delete-key', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    const { keyName } = req.body;
    if (keyName === 'BRONX_ULTRA_MASTER_2026') return res.status(400).json({ error: 'Cannot delete master' });
    if (keyStorage[keyName]) { delete keyStorage[keyName]; await saveAllData(); res.json({ success: true }); }
    else res.status(404).json({ error: 'Not found' });
});

app.post('/admin/reset-key-usage', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    const { keyName } = req.body;
    if (keyStorage[keyName]) { keyStorage[keyName].used = 0; await saveAllData(); res.json({ success: true }); }
    else res.status(404).json({ error: 'Not found' });
});

app.get('/admin/keys', (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ success: true, keys: Object.entries(keyStorage).map(([k, d]) => ({ key: k, name: d.name, scopes: d.scopes, limit: d.unlimited ? '∞' : d.limit, used: d.used, remaining: d.unlimited ? '∞' : Math.max(0, d.limit - d.used), expiry: d.expiryStr || 'LIFETIME' })) });
});

app.post('/admin/import-keys', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    const { keys } = req.body;
    if (!keys || typeof keys !== 'object') return res.status(400).json({ error: 'Invalid data' });
    let imp = 0, skip = 0;
    Object.entries(keys).forEach(([kn, kd]) => {
        if (kn === 'BRONX_ULTRA_MASTER_2026' || keyStorage[kn]) { skip++; return; }
        keyStorage[kn] = {
            name: kd.name || 'Imported', scopes: kd.scopes || ['number'], type: kd.type || 'imported',
            limit: kd.limit || 100, used: kd.used || 0,
            expiry: (kd.expiryStr && kd.expiryStr !== 'LIFETIME') ? parseExpiryDate(kd.expiryStr) : null,
            expiryStr: kd.expiryStr || 'LIFETIME', created: kd.created || getIndiaDateTime(),
            resetType: 'never', unlimited: kd.unlimited || false, hidden: kd.hidden || false
        };
        imp++;
    });
    await saveAllData();
    res.json({ success: true, imported: imp, skipped: skip });
});

app.post('/admin/custom-api', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    const { slot, api } = req.body;
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) return res.status(400).json({ error: 'Invalid slot' });
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    await saveAllData();
    res.json({ success: true });
});

app.get('/admin/logs', (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ success: true, logs: requestLogs.slice(-50).reverse() });
});

app.post('/admin/clear-logs', async (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    requestLogs = [];
    await saveAllData();
    res.json({ success: true });
});

app.get('/admin/stats', (req, res) => {
    if (!isAdminAuth(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ success: true, totalKeys: Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length, totalRequests: requestLogs.length, todayRequests: requestLogs.filter(l => l.timestamp.startsWith(getIndiaDate())).length });
});

app.use((req, res) => res.status(404).json({ error: 'Not found', contact: '@BRONX_ULTRA' }));

// ========== STARTUP ==========
(async function startup() {
    console.log('🚀 BRONX OSINT v12 STARTING...');
    await loadAllData();
    console.log('✅ READY - Keys:', Object.keys(keyStorage).length, '| Sessions:', Object.keys(adminSessions).length);
})();

module.exports = app;
