// api/index.js - BRONX OSINT API v8.0 - GOD LEVEL PERMANENT FIX
const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = 'bot-new';

// ========== ADMIN CONFIG ==========
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'BRONX_ULTRA';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BRONX@2026#OWNER';

// ========== PERMANENT ADMIN TOKEN STORAGE ==========
const PERMANENT_TOKENS_FILE = '/tmp/bronx_permanent_tokens.json';
let permanentTokens = {};

// Try to load permanent tokens
try {
    if (typeof require !== 'undefined') {
        const fs = require('fs');
        if (fs.existsSync(PERMANENT_TOKENS_FILE)) {
            permanentTokens = JSON.parse(fs.readFileSync(PERMANENT_TOKENS_FILE, 'utf8'));
        }
    }
} catch(e) {
    console.log('Running in serverless mode - permanent tokens in memory');
}

function savePermanentTokens() {
    try {
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            fs.writeFileSync(PERMANENT_TOKENS_FILE, JSON.stringify(permanentTokens), 'utf8');
        }
    } catch(e) {}
}

// ========== MEMORY STORAGE ==========
let keyStorage = {};
let customAPIs = [];
let requestLogs = [];
let adminSessions = {};

// Restore permanent tokens as sessions
Object.entries(permanentTokens).forEach(([token, data]) => {
    adminSessions[token] = { 
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
        permanent: true,
        createdAt: data.createdAt
    };
});

// ========== INDIA TIME HELPER ==========
function getIndiaTime() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
}

function getIndiaDate() {
    return getIndiaTime().toISOString().split('T')[0];
}

function getIndiaDateTime() {
    return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19);
}

// ========== EXPIRY CHECK ==========
function isKeyExpired(expiryDate) {
    if (!expiryDate || expiryDate === null) return false;
    const indiaNow = getIndiaTime();
    const expiry = new Date(expiryDate);
    return indiaNow > expiry;
}

function parseExpiryDate(dateStr) {
    if (!dateStr || dateStr === 'LIFETIME' || dateStr === 'NEVER') return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
}

// ========== INITIALIZE DEFAULT DATA ==========
function initializeData() {
    const now = getIndiaDateTime();
    
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

initializeData();

// ========== KEY MANAGEMENT ==========
function checkKeyValid(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) return { valid: false, error: '❌ Invalid API Key. Contact @BRONX_ULTRA to purchase.' };
    if (keyData.expiry && isKeyExpired(keyData.expiry)) return { valid: false, error: '⏰ Your Key has EXPIRED! Contact @BRONX_ULTRA on Telegram.', expired: true, expiredDate: keyData.expiryStr };
    if (!keyData.unlimited && keyData.used >= keyData.limit) return { valid: false, error: `🛑 Limit Exhausted! Used ${keyData.used}/${keyData.limit}. Contact @BRONX_ULTRA.`, limitExhausted: true };
    return { valid: true, keyData };
}

function incrementKeyUsage(apiKey) {
    if (keyStorage[apiKey] && !keyStorage[apiKey].unlimited) keyStorage[apiKey].used++;
    return keyStorage[apiKey];
}

function checkKeyScope(keyData, endpoint) {
    if (keyData.scopes.includes('*')) return { valid: true };
    if (keyData.scopes.includes(endpoint)) return { valid: true };
    return { valid: false, error: `❌ Key cannot access '${endpoint}'. Scopes: ${keyData.scopes.join(', ')}` };
}

function logRequest(key, endpoint, param, status, ip, userAgent) {
    requestLogs.push({
        timestamp: getIndiaDateTime(),
        key: key ? key.substring(0, 10) + '...' : 'unknown',
        endpoint: endpoint,
        param: param,
        status: status,
        ip: ip || 'unknown',
        browser: userAgent || 'Unknown'
    });
    if (requestLogs.length > 500) requestLogs = requestLogs.slice(-500);
}

// ========== DATA SANITIZER - REMOVES REAL API INFO ==========
function sanitizeCustomAPIResponse(data, customAPI) {
    if (!data) return data;
    
    // Deep clone
    let cleaned = JSON.parse(JSON.stringify(data));
    
    // Remove fields that could leak real API info
    function cleanObject(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(item => cleanObject(item)); return; }
        
        // Remove common leak fields
        const fieldsToRemove = [
            'by', 'channel', 'BY', 'CHANNEL', 'developer', 'Developer',
            'api_key', 'apikey', 'API_KEY', 'ApiKey',
            'real_url', 'source_url', 'origin_url', 'internal_url',
            'server_ip', 'host', 'internal_host', 'proxy',
            'raw_response', 'original_data', 'upstream'
        ];
        fieldsToRemove.forEach(f => delete obj[f]);
        
        // Recursively clean nested objects
        Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object') {
                cleanObject(obj[key]);
            }
        });
    }
    
    cleanObject(cleaned);
    
    // Add BRONX branding
    cleaned.by = "@BRONX_ULTRA";
    cleaned.powered_by = "BRONX OSINT API";
    cleaned.api_name = customAPI.name;
    cleaned.api_endpoint = customAPI.endpoint;
    
    return cleaned;
}

// ========== CLEAN RESPONSE ==========
function cleanResponse(data) {
    if (!data) return data;
    let cleaned = JSON.parse(JSON.stringify(data));
    function removeFields(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(item => removeFields(item)); return; }
        delete obj.by; delete obj.channel; delete obj.BY; delete obj.CHANNEL; delete obj.developer;
        Object.keys(obj).forEach(key => { if (obj[key] && typeof obj[key] === 'object') removeFields(obj[key]); });
    }
    removeFields(cleaned);
    cleaned.by = "@BRONX_ULTRA";
    cleaned.powered_by = "BRONX OSINT API";
    return cleaned;
}

function getBrowserName(ua) {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return 'Other';
}

// ========== GOD LEVEL PUBLIC HOME ==========
function renderPublicHome() {
    const visibleAPIs = customAPIs.filter(a => a.visible && a.endpoint);
    const categories = {};
    Object.entries(endpoints).forEach(([name, ep]) => {
        if (!categories[ep.category]) categories[ep.category] = [];
        categories[ep.category].push({name, ...ep});
    });
    
    const catOrder = ['Phone Intelligence', 'Financial', 'Location', 'Vehicle', 'Gaming', 'Social', 'Pakistan'];
    
    let endpointSections = '';
    
    catOrder.forEach(cat => {
        if (!categories[cat]) return;
        const eps = categories[cat];
        
        endpointSections += `
        <div class="cat-section">
            <div class="cat-head">
                <div class="cat-icon-box"><span>${eps[0].icon}</span></div>
                <div><h3>${cat}</h3><span class="cat-sub">${eps.length} endpoints</span></div>
                <div class="cat-line-glow"></div>
            </div>
            <div class="ep-grid">
                ${eps.map(ep => `
                <div class="ep-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-card-glow"></div>
                    <div class="ep-card-inner">
                        <div class="ep-top-row"><span class="ep-badge">GET</span><span class="ep-ico">${ep.icon}</span></div>
                        <h4>/${ep.name}</h4>
                        <p>${ep.desc}</p>
                        <div class="ep-params"><code>${ep.param}</code><span>=</span><code>${ep.example}</code></div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>`;
    });
    
    if (visibleAPIs.length > 0) {
        endpointSections += `
        <div class="cat-section">
            <div class="cat-head custom-head">
                <div class="cat-icon-box custom-icon-box"><span>🔧</span></div>
                <div><h3>Custom Integrations</h3><span class="cat-sub">${visibleAPIs.length} custom APIs</span></div>
                <div class="cat-line-glow custom-line-glow"></div>
            </div>
            <div class="ep-grid">
                ${visibleAPIs.map(api => `
                <div class="ep-card custom-ep-card" onclick="copyUrlCustom('${api.endpoint}','${api.param}','${api.example}')">
                    <div class="ep-card-glow custom-card-glow"></div>
                    <div class="ep-card-inner">
                        <div class="ep-top-row"><span class="ep-badge custom-badge">CUSTOM</span><span class="ep-ico">🔧</span></div>
                        <h4>/${api.endpoint}</h4>
                        <p>${api.desc}</p>
                        <div class="ep-params custom-params"><code>${api.param}</code><span>=</span><code>${api.example}</code></div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    const totalEndpoints = Object.keys(endpoints).length + visibleAPIs.length;
    const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX OSINT — God Level Intelligence</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg:#060606;--card:#0d0d0d;--card2:#141414;--b1:#1a1a1a;--b2:#252525;
            --t1:#f0f0f0;--t2:#999;--t3:#555;--g:#00ff88;--g2:#00cc6a;
            --glow-g:0 0 20px rgba(0,255,136,0.3),0 0 40px rgba(0,255,136,0.1);
            --glow-b:0 0 20px rgba(68,138,255,0.3),0 0 40px rgba(68,138,255,0.1);
            --glow-o:0 0 20px rgba(255,145,0,0.3),0 0 40px rgba(255,145,0,0.1);
            --r:12px;--t:0.35s;
        }
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:var(--bg);color:var(--t1);font-family:'Inter',sans-serif;min-height:100vh;line-height:1.5}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:10px}
        
        .hero{
            position:relative;padding:70px 30px 55px;text-align:center;
            background:linear-gradient(180deg,#050505 0%,var(--bg) 100%);
            border-bottom:1px solid var(--b1);overflow:hidden;
        }
        .hero::before{
            content:'';position:absolute;inset:0;
            background:radial-gradient(ellipse at 50% 0%,rgba(0,255,136,0.04) 0%,transparent 60%),
                      radial-gradient(ellipse at 80% 30%,rgba(68,138,255,0.03) 0%,transparent 50%);
            z-index:0;
        }
        .hero-particles{position:absolute;inset:0;z-index:0;pointer-events:none}
        .hero-orb{
            position:absolute;border-radius:50%;filter:blur(100px);opacity:0.06;
            animation:orbFloat 10s ease-in-out infinite;
        }
        .hero-orb:nth-child(1){width:500px;height:500px;background:var(--g);top:-200px;left:-100px}
        .hero-orb:nth-child(2){width:400px;height:400px;background:#448aff;top:-100px;right:-100px;animation-delay:-4s}
        .hero-orb:nth-child(3){width:300px;height:300px;background:#ff9100;bottom:-100px;left:40%;animation-delay:-7s}
        @keyframes orbFloat{0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(30px,-30px)scale(1.08)}66%{transform:translate(-20px,20px)scale(0.92)}}
        
        .hero-content{position:relative;z-index:2;max-width:700px;margin:0 auto}
        .avatar-wrap{position:relative;display:inline-block;margin-bottom:28px}
        .avatar-ring{
            position:absolute;inset:-6px;border-radius:50%;
            background:conic-gradient(var(--g),#448aff,#ff9100,var(--g));
            animation:ringSpin 3s linear infinite;z-index:0;
        }
        @keyframes ringSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        .avatar-ring::after{
            content:'';position:absolute;inset:3px;background:var(--bg);border-radius:50%;
        }
        .avatar-img{
            width:130px;height:130px;border-radius:50%;object-fit:cover;
            display:block;position:relative;z-index:1;border:3px solid #1a1a1a;
            box-shadow:var(--glow-g);transition:all var(--t);
        }
        .avatar-img:hover{box-shadow:0 0 40px rgba(0,255,136,0.5),0 0 80px rgba(0,255,136,0.2);transform:scale(1.06)}
        
        .hero-title{
            font-size:46px;font-weight:900;letter-spacing:-1.5px;margin-bottom:8px;
            background:linear-gradient(135deg,#fff 0%,#aaa 40%,#fff 80%,#aaa 100%);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
            text-shadow:0 0 40px rgba(255,255,255,0.1);
        }
        .hero-sub{font-size:19px;font-weight:700;color:var(--g);letter-spacing:0.5px;margin-bottom:5px}
        .hero-desc{font-size:13px;color:var(--t3);margin-bottom:22px}
        .hero-tags{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
        .h-tag{
            padding:9px 20px;border-radius:50px;font-size:11px;font-weight:700;
            letter-spacing:1.5px;text-transform:uppercase;border:1px solid;
            background:transparent;transition:all var(--t);cursor:default;
        }
        .h-tag:hover{transform:translateY(-2px)}
        .t-g{color:var(--g);border-color:rgba(0,255,136,0.35)}.t-g:hover{box-shadow:var(--glow-g)}
        .t-b{color:#448aff;border-color:rgba(68,138,255,0.35)}.t-b:hover{box-shadow:var(--glow-b)}
        .t-o{color:#ff9100;border-color:rgba(255,145,0,0.35)}.t-o:hover{box-shadow:var(--glow-o)}
        
        .container{max-width:1300px;margin:0 auto;padding:0 25px}
        
        .stats-bar{
            display:flex;justify-content:center;gap:25px;flex-wrap:wrap;
            padding:30px;margin:-35px auto 35px;max-width:780px;
            background:rgba(13,13,13,0.95);border:1px solid var(--b1);border-radius:var(--r);
            position:relative;z-index:5;backdrop-filter:blur(20px);
            box-shadow:0 10px 50px rgba(0,0,0,0.5);
        }
        .stat-item{text-align:center;min-width:80px;flex:1}
        .stat-val{
            font-size:34px;font-weight:900;letter-spacing:-1px;
            background:linear-gradient(135deg,var(--g),#448aff);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .stat-lbl{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-top:4px;font-weight:700}
        .stat-div{width:1px;background:var(--b2);align-self:stretch;margin:5px 0}
        
        .playground{
            background:var(--card);border:1px solid var(--b1);border-radius:var(--r);
            padding:28px;margin-bottom:35px;position:relative;overflow:hidden;
        }
        .playground::before{
            content:'';position:absolute;top:0;left:0;right:0;height:2px;
            background:linear-gradient(90deg,transparent,var(--g),#448aff,transparent);opacity:0.6;
        }
        .pg-head{display:flex;align-items:center;gap:12px;margin-bottom:20px}
        .pg-dot{
            width:12px;height:12px;background:var(--g);border-radius:50%;
            box-shadow:0 0 15px rgba(0,255,136,0.5);animation:dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse{0%,100%{box-shadow:0 0 10px rgba(0,255,136,0.4)}50%{box-shadow:0 0 25px rgba(0,255,136,0.7),0 0 50px rgba(0,255,136,0.3)}}
        .pg-head h3{font-size:18px;font-weight:700;letter-spacing:-0.3px}
        
        .pg-form{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .pg-form select,.pg-form input{
            flex:1;min-width:160px;padding:14px 18px;background:#050505;border:1px solid var(--b2);
            border-radius:10px;color:var(--t1);font-size:13px;font-family:'SF Mono',monospace;
            transition:all var(--t);outline:none;
        }
        .pg-form select:focus,.pg-form input:focus{
            border-color:var(--g);box-shadow:0 0 0 3px rgba(0,255,136,0.06),0 0 20px rgba(0,255,136,0.05);
        }
        .btn-run{
            padding:14px 32px;background:var(--g);color:#000;border:none;border-radius:10px;
            font-weight:700;font-size:13px;cursor:pointer;letter-spacing:0.5px;
            transition:all var(--t);white-space:nowrap;font-family:inherit;
            box-shadow:0 0 15px rgba(0,255,136,0.2);
        }
        .btn-run:hover{
            background:var(--g2);box-shadow:0 0 35px rgba(0,255,136,0.4),0 0 70px rgba(0,255,136,0.15);
            transform:translateY(-2px);
        }
        .result-box{
            margin-top:18px;background:#020202;border:1px solid var(--b1);
            border-radius:10px;padding:18px;max-height:350px;overflow:auto;
            font-family:'SF Mono',monospace;font-size:12px;display:none;
            white-space:pre-wrap;color:var(--g);
        }
        
        .cat-section{margin-bottom:45px}
        .cat-head{
            display:flex;align-items:center;gap:14px;margin-bottom:22px;
            padding-bottom:18px;border-bottom:1px solid var(--b1);position:relative;
        }
        .cat-icon-box{
            width:48px;height:48px;border-radius:14px;background:rgba(0,255,136,0.05);
            border:1px solid rgba(0,255,136,0.15);display:flex;align-items:center;
            justify-content:center;font-size:22px;flex-shrink:0;
            box-shadow:0 0 20px rgba(0,255,136,0.05);
        }
        .custom-icon-box{background:rgba(255,145,0,0.05);border-color:rgba(255,145,0,0.15);box-shadow:0 0 20px rgba(255,145,0,0.05)}
        .cat-head h3{font-size:19px;font-weight:700;color:#fff;letter-spacing:-0.3px}
        .cat-sub{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:1.5px;font-weight:600}
        .cat-line-glow{flex:1;height:1px;background:linear-gradient(90deg,rgba(0,255,136,0.25),transparent)}
        .custom-line-glow{background:linear-gradient(90deg,rgba(255,145,0,0.25),transparent)}
        
        .ep-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px}
        .ep-card{
            background:var(--card);border:1px solid var(--b1);border-radius:var(--r);
            cursor:pointer;transition:all var(--t);position:relative;overflow:hidden;
        }
        .ep-card-glow{
            position:absolute;inset:-1px;border-radius:var(--r);
            background:linear-gradient(135deg,transparent,rgba(0,255,136,0.08),transparent);
            opacity:0;transition:opacity var(--t);pointer-events:none;z-index:0;
        }
        .custom-card-glow{background:linear-gradient(135deg,transparent,rgba(255,145,0,0.08),transparent)}
        .ep-card:hover{
            background:var(--card2);border-color:var(--g);
            transform:translateY(-3px);
            box-shadow:0 10px 50px rgba(0,0,0,0.5),0 0 50px rgba(0,255,136,0.04);
        }
        .ep-card:hover .ep-card-glow{opacity:1}
        .custom-ep-card:hover{border-color:#ff9100;box-shadow:0 10px 50px rgba(0,0,0,0.5),0 0 50px rgba(255,145,0,0.04)}
        .ep-card-inner{position:relative;z-index:1;padding:22px 24px}
        .ep-top-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
        .ep-badge{
            padding:4px 14px;border-radius:6px;font-size:10px;font-weight:800;
            letter-spacing:1.5px;text-transform:uppercase;
            background:rgba(0,255,136,0.08);color:var(--g);border:1px solid rgba(0,255,136,0.2);
            box-shadow:0 0 10px rgba(0,255,136,0.1);
        }
        .custom-badge{background:rgba(255,145,0,0.08);color:#ff9100;border-color:rgba(255,145,0,0.2);box-shadow:0 0 10px rgba(255,145,0,0.1)}
        .ep-ico{font-size:24px}
        .ep-card h4{font-size:19px;font-weight:700;color:#fff;margin-bottom:5px;letter-spacing:-0.3px}
        .ep-card p{font-size:12px;color:var(--t2);margin-bottom:14px}
        .ep-params{display:flex;align-items:center;gap:6px;font-family:'SF Mono',monospace;font-size:12px}
        .ep-params code:first-child{color:var(--g);background:rgba(0,255,136,0.05);padding:3px 8px;border-radius:4px}
        .ep-params span{color:var(--t3)}
        .ep-params code:last-child{color:var(--t2)}
        .custom-params code:first-child{color:#ff9100;background:rgba(255,145,0,0.05)}
        
        .footer{
            text-align:center;padding:50px 20px;border-top:1px solid var(--b1);
            margin-top:30px;position:relative;
        }
        .footer::before{
            content:'';position:absolute;top:1px;left:15%;right:15%;height:1px;
            background:linear-gradient(90deg,transparent,var(--g),transparent);opacity:0.3;
        }
        .footer-brand{font-size:20px;font-weight:800;color:var(--g);letter-spacing:-0.3px}
        .footer-info{font-size:12px;color:var(--t3);margin-top:6px}
        .footer-link{color:var(--t2);text-decoration:none;transition:color var(--t)}
        .footer-link:hover{color:var(--g)}
        
        .toast{
            position:fixed;bottom:30px;right:30px;background:var(--card);color:var(--g);
            padding:14px 24px;border-radius:12px;font-size:13px;font-weight:600;
            border:1px solid rgba(0,255,136,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;
            box-shadow:0 10px 50px rgba(0,0,0,0.6),0 0 30px rgba(0,255,136,0.1);
            pointer-events:none;
        }
        @media(max-width:768px){
            .hero{padding:45px 20px 35px}.hero-title{font-size:30px}.hero-sub{font-size:15px}
            .avatar-img{width:100px;height:100px}.stats-bar{gap:12px;padding:18px 12px;margin:-25px 15px 25px}
            .stat-val{font-size:24px}.stat-lbl{font-size:7px}.ep-grid{grid-template-columns:1fr}
            .pg-form{flex-direction:column}.pg-form select,.pg-form input{min-width:100%}.btn-run{width:100%}
        }
    </style>
</head>
<body>
    <header class="hero">
        <div class="hero-particles">
            <div class="hero-orb"></div><div class="hero-orb"></div><div class="hero-orb"></div>
        </div>
        <div class="hero-content">
            <div class="avatar-wrap">
                <div class="avatar-ring"></div>
                <img src="https://i.ibb.co/YTjW35Hs/file-000000007b0872069c1067c615adaa48.png" alt="BRONX_ULTRA" class="avatar-img" onerror="this.style.display='none'">
            </div>
            <h1 class="hero-title">WELCOME TO BRONX OSINT</h1>
            <p class="hero-sub">God Level Intelligence API</p>
            <p class="hero-desc">Enterprise OSINT Platform — Secure · Fast · Reliable</p>
            <div class="hero-tags">
                <span class="h-tag t-g">🔒 Encrypted</span>
                <span class="h-tag t-b">⚡ Real-Time</span>
                <span class="h-tag t-o">💎 Premium</span>
                <span class="h-tag t-g">🛡️ Fort Knox</span>
            </div>
        </div>
    </header>
    
    <div class="container">
        <div class="stats-bar">
            <div class="stat-item"><div class="stat-val">${totalEndpoints}</div><div class="stat-lbl">Endpoints</div></div>
            <div class="stat-div"></div>
            <div class="stat-item"><div class="stat-val">${totalKeys}</div><div class="stat-lbl">Active Keys</div></div>
            <div class="stat-div"></div>
            <div class="stat-item"><div class="stat-val">JSON</div><div class="stat-lbl">Response</div></div>
            <div class="stat-div"></div>
            <div class="stat-item"><div class="stat-val">26+</div><div class="stat-lbl">APIs</div></div>
        </div>
        
        <div class="playground">
            <div class="pg-head"><div class="pg-dot"></div><h3>API Playground</h3></div>
            <div class="pg-form">
                <select id="epSelect">
                    <option value="">Select Endpoint</option>
                    ${Object.entries(endpoints).map(([n,e]) => '<option value="'+n+'">'+e.icon+' '+n.toUpperCase()+' — '+e.desc+'</option>').join('')}
                    ${visibleAPIs.length>0?visibleAPIs.map(a=>'<option value="custom_'+a.id+'" data-custom="1" data-ep="'+a.endpoint+'" data-param="'+a.param+'">🔧 '+a.name+'</option>').join(''):''}
                </select>
                <input type="text" id="apiKey" placeholder="Enter API Key">
                <input type="text" id="paramVal" placeholder="Parameter Value">
                <button class="btn-run" onclick="testAPI()">Execute →</button>
            </div>
            <div class="result-box" id="result"></div>
        </div>
        
        ${endpointSections}
    </div>
    
    <footer class="footer">
        <p class="footer-brand">BRONX OSINT</p>
        <p class="footer-info">Powered by <strong>@BRONX_ULTRA</strong> · India (IST) · <a href="/admin" class="footer-link">Admin Panel</a></p>
    </footer>
    
    <script>
        const endpoints=${JSON.stringify(endpoints)};
        function copyUrl(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/key-bronx/'+e+'?key=KEY&'+p+'='+ex);showToast('✓ /'+e)}
        function copyUrlCustom(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/custom/'+e+'?key=KEY&'+p+'='+ex);showToast('✓ Custom URL')}
        function showToast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2200)}
        async function testAPI(){
            const s=document.getElementById('epSelect');const o=s.options[s.selectedIndex];
            const isC=o.dataset.custom==='1';const k=document.getElementById('apiKey').value;
            const v=document.getElementById('paramVal').value;const r=document.getElementById('result');
            if(!k||!v||!s.value){showToast('⚠️ Fill all fields');return}
            let url=isC?'/api/custom/'+o.dataset.ep+'?key='+k+'&'+o.dataset.param+'='+v:'/api/key-bronx/'+s.value+'?key='+k+'&'+endpoints[s.value].param+'='+v;
            r.style.display='block';r.textContent='⏳ Executing...';r.style.color='#888';
            try{const re=await fetch(url);const d=await re.json();r.textContent=JSON.stringify(d,null,2);r.style.color='#00ff88'}
            catch(e){r.textContent='✕ '+e.message;r.style.color='#ff3d3d'}
        }
    </script>
</body>
</html>`;
}

// ========== ADMIN PANEL WITH PERMANENT SESSION ==========
function renderAdminLogin() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX — Admin Auth</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#060606;min-height:100vh;display:flex;justify-content:center;align-items:center;font-family:'Inter',sans-serif}
        .login-box{
            background:#0d0d0d;border:1px solid #1a1a1a;border-radius:16px;
            padding:50px 40px;width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.5);
            position:relative;overflow:hidden;
        }
        .login-box::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00ff88,#448aff,transparent)}
        .login-icon{width:60px;height:60px;background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;font-size:26px;box-shadow:0 0 30px rgba(0,255,136,0.1)}
        .login-box h2{text-align:center;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px}
        .login-sub{text-align:center;color:#555;font-size:12px;margin-bottom:30px;letter-spacing:0.5px}
        .fg{margin-bottom:18px}
        .fg label{display:block;color:#888;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:7px;font-weight:700}
        .fg input{width:100%;padding:14px 18px;background:#050505;border:1px solid #252525;border-radius:10px;color:#e0e0e0;font-size:14px;font-family:inherit;transition:all 0.3s;outline:none}
        .fg input:focus{border-color:#00ff88;box-shadow:0 0 0 3px rgba(0,255,136,0.06),0 0 20px rgba(0,255,136,0.05)}
        .btn-login{width:100%;padding:14px;background:#00ff88;color:#000;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:0.5px;transition:all 0.3s;font-family:inherit;margin-top:8px;box-shadow:0 0 20px rgba(0,255,136,0.2)}
        .btn-login:hover{background:#00cc6a;box-shadow:0 0 40px rgba(0,255,136,0.4)}
        .error{color:#ff3d3d;text-align:center;margin-top:14px;font-size:13px;display:none;font-weight:500}
        .back{text-align:center;margin-top:20px}
        .back a{color:#555;text-decoration:none;font-size:12px;transition:color 0.3s}
        .back a:hover{color:#00ff88}
    </style>
</head>
<body>
    <div class="login-box">
        <div class="login-icon">🛡️</div>
        <h2>Admin Access</h2>
        <p class="login-sub">BRONX OSINT Control Panel</p>
        <div class="fg"><label>Username</label><input type="text" id="username" placeholder="Enter username" autocomplete="off"></div>
        <div class="fg"><label>Password</label><input type="password" id="password" placeholder="Enter password"></div>
        <button class="btn-login" onclick="login()">Authenticate</button>
        <div class="error" id="errorMsg"></div>
        <div class="back"><a href="/">← Back to Home</a></div>
    </div>
    <script>
        async function login(){
            const u=document.getElementById('username').value;
            const p=document.getElementById('password').value;
            const e=document.getElementById('errorMsg');
            if(!u||!p){e.style.display='block';e.textContent='All fields are required';return}
            try{
                const r=await fetch('/admin/login',{
                    method:'POST',headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({username:u,password:p})
                });
                const d=await r.json();
                if(d.success){
                    e.style.display='block';e.style.color='#00ff88';e.textContent=d.message;
                    // SAVE TOKEN PERMANENTLY
                    localStorage.setItem('bronx_admin_token', d.token);
                    setTimeout(()=>{window.location.href=d.redirect},800)
                }else{e.style.display='block';e.style.color='#ff3d3d';e.textContent=d.error}
            }catch(err){e.style.display='block';e.style.color='#ff3d3d';e.textContent='Connection error'}
        }
        document.addEventListener('keydown',function(ev){if(ev.key==='Enter')login()});
    </script>
</body>
</html>`;
}

function renderAdminPanel(token) {
    const allKeys = Object.entries(keyStorage).map(([key, data]) => ({
        key, ...data,
        isExpired: data.expiry && isKeyExpired(data.expiry),
        isExhausted: !data.unlimited && data.used >= data.limit,
        remaining: data.unlimited ? '∞' : Math.max(0, data.limit - data.used)
    }));
    
    const totalKeys = allKeys.filter(k => !k.hidden).length;
    const activeKeys = allKeys.filter(k => !k.hidden && !k.isExpired && !k.isExhausted).length;
    const todayReq = requestLogs.filter(l => l.timestamp.startsWith(getIndiaDate())).length;
    
    const endpointUsage = {};
    requestLogs.forEach(log => {
        const ep = log.endpoint || 'unknown';
        if (!endpointUsage[ep]) endpointUsage[ep] = { total: 0, success: 0, failed: 0 };
        endpointUsage[ep].total++;
        if (log.status === 'success') endpointUsage[ep].success++;
        else endpointUsage[ep].failed++;
    });
    
    let keyRows = allKeys.map(k => {
        let status = 'Active', sc = 's-green';
        if (k.hidden) { status = 'Master'; sc = 's-purple'; }
        else if (k.isExpired) { status = 'Expired'; sc = 's-red'; }
        else if (k.isExhausted) { status = 'Limit'; sc = 's-orange'; }
        const dk = k.key.length > 32 ? k.key.substring(0,29)+'...' : k.key;
        const sd = k.scopes.includes('*') ? '<span class="stag">ALL</span>' : k.scopes.slice(0,5).map(s=>'<span class="stag">'+s+'</span>').join('')+(k.scopes.length>5?' <span class="stag">+'+ (k.scopes.length-5) +'</span>':'');
        return '<tr><td><code style="color:#00ff88;font-size:11px" title="'+k.key+'">'+dk+'</code></td><td>'+(k.name||'—')+'</td><td style="font-size:10px">'+sd+'</td><td>'+(k.unlimited?'∞':k.limit)+'</td><td>'+k.used+'</td><td>'+(k.unlimited?'∞':Math.max(0,k.limit-k.used))+'</td><td>'+(k.expiryStr||'Lifetime')+'</td><td><span class="sd '+sc+'">'+status+'</span></td><td style="white-space:nowrap"><button onclick="resetKey(\''+k.key+'\')" class="bxs bi">Reset</button> '+(k.key!=='BRONX_ULTRA_MASTER_2026'?'<button onclick="deleteKey(\''+k.key+'\')" class="bxs bd">Del</button>':'')+'</td></tr>';
    }).join('');
    
    let scb = allScopes.map(s=>'<label class="cbl"><input type="checkbox" value="'+s.value+'"> '+s.label+'</label>').join('');
    
    let logs = requestLogs.slice(-25).reverse().map(l=>{
        let sc=l.status==='success'?'s-green':(l.status==='failed'?'s-red':'s-orange');
        return '<div class="lr"><span class="lt">'+l.timestamp+'</span><span class="lk">'+l.key+'</span><code class="le">/'+l.endpoint+'</code><span class="lb">'+getBrowserName(l.browser)+'</span><span class="'+sc+'">'+l.status+'</span></div>';
    }).join('')||'<p style="color:#555;text-align:center;padding:20px">No requests</p>';
    
    let usageRows = Object.entries(endpointUsage).sort((a,b)=>b[1].total-a[1].total).map(([ep,d])=>'<tr><td><code style="color:#00ff88">/'+ep+'</code></td><td><b>'+d.total+'</b></td><td style="color:#00ff88">'+d.success+'</td><td style="color:#ff3d3d">'+d.failed+'</td></tr>').join('')||'<tr><td colspan="4" style="text-align:center;color:#555;padding:20px">No requests</td></tr>';
    
    let car = customAPIs.map((a,i)=>`
        <div class="car" id="cr${i}">
            <div class="cav">
                <div class="cai"><b class="cs">#${a.id}</b><span class="cn">${a.name||'Empty'}</span>${a.endpoint?'<code class="ce">/'+a.endpoint+'</code>':'<span class="cempty">No endpoint</span>'}<span class="cst ${a.visible?'vis':'hid'}">${a.visible?'VISIBLE':'HIDDEN'}</span></div>
                <div class="caa"><button class="bxs bi" onclick="editCA(${i})">Edit</button><button class="bxs bw" onclick="toggleCA(${i})">Toggle</button></div>
            </div>
            <div class="cae" id="ce${i}" style="display:none">
                <div class="fr" style="margin-top:12px">
                    <div class="fg"><label>Name</label><input type="text" id="cn${i}" value="${a.name||''}"></div>
                    <div class="fg"><label>Endpoint</label><input type="text" id="cep${i}" value="${a.endpoint||''}"></div>
                    <div class="fg"><label>Parameter</label><input type="text" id="cp${i}" value="${a.param||''}"></div>
                    <div class="fg"><label>Example</label><input type="text" id="cex${i}" value="${a.example||''}"></div>
                    <div class="fg"><label>Description</label><input type="text" id="cd${i}" value="${a.desc||''}"></div>
                    <div class="fg"><label>Real API URL</label><input type="text" id="crl${i}" value="${a.realAPI||''}"></div>
                    <div class="fg"><label>Visible</label><select id="cv${i}"><option value="1" ${a.visible?'selected':''}>Yes</option><option value="0" ${!a.visible?'selected':''}>No</option></select></div>
                    <div class="fg fw" style="display:flex;gap:10px"><button class="btn bp btn-sm" onclick="saveCA(${i})">Save</button><button class="btn bo btn-sm" onclick="cancelCA(${i})">Cancel</button></div>
                </div>
            </div>
        </div>`).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX — Admin Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root{--bg:#060606;--c:#0d0d0d;--c2:#141414;--b1:#1a1a1a;--b2:#252525;--t:#e0e0e0;--t2:#999;--t3:#555;--g:#00ff88;--g2:#00cc6a;--r:#ff3d3d;--o:#ff9100;--bl:#448aff;--p:#b388ff;--rad:14px;--rs:8px}
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:var(--bg);color:var(--t);font-family:'Inter',sans-serif;min-height:100vh}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:10px}
        .tb{background:var(--c);border-bottom:1px solid var(--b1);padding:14px 28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;position:sticky;top:0;z-index:100}
        .tb h1{font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.5px}.tb h1 span{color:var(--g)}
        .tbr{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tbt{font-size:10px;color:var(--t3);font-family:'SF Mono',monospace}
        .container{max-width:1450px;margin:0 auto;padding:20px 24px}
        .sr{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
        .sc{background:var(--c);border:1px solid var(--b1);border-radius:var(--rad);padding:20px;text-align:center;position:relative;overflow:hidden}
        .sc::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:2px;background:linear-gradient(90deg,transparent,var(--g),transparent);opacity:0.5}
        .sn{font-size:36px;font-weight:900;color:var(--g);letter-spacing:-1px}.sl{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--t3);margin-top:4px;font-weight:600}
        .tabs{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap}
        .tab{padding:10px 22px;background:var(--c);border:1px solid var(--b1);border-radius:var(--rs);color:var(--t3);cursor:pointer;font-size:13px;font-weight:600;letter-spacing:0.5px;transition:all 0.3s}
        .tab.active{border-color:var(--g);color:var(--g);background:rgba(0,255,136,0.04);box-shadow:0 0 20px rgba(0,255,136,0.05)}
        .tab:hover{border-color:#333;color:#ccc}
        .panel{display:none}.panel.active{display:block}
        .sec{background:var(--c);border:1px solid var(--b1);border-radius:var(--rad);padding:24px;margin-bottom:20px;position:relative}
        .sec h3{font-size:16px;font-weight:700;color:#fff;margin-bottom:18px;letter-spacing:-0.3px}
        .fr{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
        .fg label{display:block;color:var(--t3);font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:700}
        .fg input,.fg select,.fg textarea{width:100%;padding:10px 14px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs);color:var(--t);font-size:12px;font-family:inherit;outline:none;transition:all 0.3s}
        .fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(0,255,136,0.05),0 0 15px rgba(0,255,136,0.03)}
        .fw{grid-column:1/-1}
        .cbw{display:flex;flex-wrap:wrap;gap:5px;max-height:150px;overflow:auto;padding:10px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs)}
        .cbl{display:flex;align-items:center;gap:5px;font-size:11px;color:#aaa;cursor:pointer;padding:3px 8px;border-radius:4px;transition:all 0.15s}
        .cbl:hover{background:rgba(255,255,255,0.03)}.cbl input{accent-color:var(--g)}
        .btn{padding:10px 22px;border-radius:var(--rs);font-weight:600;font-size:13px;cursor:pointer;border:none;letter-spacing:0.5px;transition:all 0.3s;font-family:inherit}
        .bp{background:var(--g);color:#000;box-shadow:0 0 20px rgba(0,255,136,0.15)}.bp:hover{background:var(--g2);box-shadow:0 0 35px rgba(0,255,136,0.3)}
        .bo{background:transparent;border:1px solid var(--b2);color:var(--t2);padding:10px 18px;border-radius:var(--rs);cursor:pointer;font-weight:600;font-size:12px;transition:all 0.3s;font-family:inherit}
        .bo:hover{border-color:var(--g);color:var(--g)}
        .bxs{padding:4px 10px;font-size:10px;border-radius:4px;border:1px solid;cursor:pointer;font-weight:600;font-family:inherit}
        .bi{background:rgba(68,138,255,0.1);color:var(--bl);border-color:rgba(68,138,255,0.3)}.bi:hover{background:rgba(68,138,255,0.2)}
        .bd{background:rgba(255,61,61,0.1);color:var(--r);border-color:rgba(255,61,61,0.3)}.bd:hover{background:rgba(255,61,61,0.2)}
        .bw{background:rgba(255,145,0,0.1);color:var(--o);border-color:rgba(255,145,0,0.3)}.bw:hover{background:rgba(255,145,0,0.2)}
        .tw{max-height:400px;overflow:auto;border-radius:var(--rs);border:1px solid var(--b1)}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:var(--c2);color:var(--t3);padding:10px 8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:9px;position:sticky;top:0;z-index:10;border-bottom:2px solid var(--b1)}
        td{padding:9px 8px;border-bottom:1px solid rgba(255,255,255,0.03)}tr:hover{background:rgba(255,255,255,0.02)}
        .sd{padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700;letter-spacing:1px}
        .s-green{background:rgba(0,255,136,0.1);color:var(--g)}.s-red{background:rgba(255,61,61,0.1);color:var(--r)}
        .s-orange{background:rgba(255,145,0,0.1);color:var(--o)}.s-purple{background:rgba(179,136,255,0.1);color:var(--p)}
        .stag{display:inline-block;padding:1px 6px;background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.12);border-radius:8px;font-size:9px;margin:1px;color:var(--g)}
        .lbx{max-height:350px;overflow:auto;background:var(--bg);border-radius:var(--rs);padding:14px;font-size:11px;font-family:'SF Mono',monospace}
        .lr{display:flex;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.02);flex-wrap:wrap;align-items:center}
        .lt{color:#333;min-width:130px;font-size:10px}.lk{color:var(--g);font-size:10px}.le{color:var(--bl);font-size:10px}.lb{color:var(--t3);font-size:9px}
        .car{background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs);padding:14px;margin-bottom:10px;transition:all 0.3s}
        .car:hover{border-color:#333}.cav{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
        .cai{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.cs{color:var(--g)}.cn{color:#fff;font-weight:600}
        .ce{color:var(--bl);font-size:11px}.cempty{color:var(--t3);font-size:11px}
        .cst{padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700}.cst.vis{background:rgba(0,255,136,0.1);color:var(--g)}.cst.hid{background:rgba(255,61,61,0.1);color:var(--r)}
        .caa{display:flex;gap:6px}.cae{margin-top:10px;padding-top:12px;border-top:1px solid var(--b1)}
        .iebox{background:var(--c);border:1px solid var(--o);border-radius:var(--rad);padding:20px;margin-bottom:20px}
        .iebox h3{color:var(--o);font-size:15px;margin-bottom:12px}
        .iebox textarea{width:100%;min-height:120px;background:var(--bg);border:1px solid var(--b2);color:var(--t);padding:12px;border-radius:var(--rs);font-family:'SF Mono',monospace;font-size:11px;resize:vertical}
        .iebox textarea:focus{outline:none;border-color:var(--o)}
        .toast{position:fixed;bottom:24px;right:24px;background:var(--c);color:var(--g);padding:12px 22px;border-radius:var(--rs);font-size:13px;font-weight:600;border:1px solid rgba(0,255,136,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;box-shadow:0 10px 50px rgba(0,0,0,0.6),0 0 30px rgba(0,255,136,0.1)}
        @media(max-width:768px){.sr{grid-template-columns:repeat(2,1fr)}}
    </style>
</head>
<body>
    <div class="tb">
        <h1>BRONX <span>OSINT</span> — Admin</h1>
        <div class="tbr"><span class="tbt">🇮🇳 ${getIndiaDateTime()}</span><button class="bo" onclick="window.open('/')">Home</button><button class="bo" onclick="logout()">Logout</button></div>
    </div>
    <div class="container">
        <div class="sr"><div class="sc"><div class="sn">${totalKeys}</div><div class="sl">Total Keys</div></div><div class="sc"><div class="sn">${activeKeys}</div><div class="sl">Active</div></div><div class="sc"><div class="sn">${requestLogs.length}</div><div class="sl">Requests</div></div><div class="sc"><div class="sn">${todayReq}</div><div class="sl">Today</div></div></div>
        <div class="tabs">
            <div class="tab active" onclick="st('gen')">Key Generator</div><div class="tab" onclick="st('keys')">Manage Keys</div>
            <div class="tab" onclick="st('io')">Import/Export</div><div class="tab" onclick="st('custom')">Custom APIs</div>
            <div class="tab" onclick="st('usage')">API Usage</div><div class="tab" onclick="st('logs')">Request Logs</div>
        </div>
        <div class="panel active" id="p-gen"><div class="sec"><h3>Generate New API Key</h3><div class="fr"><div class="fg"><label>Key Name</label><input type="text" id="gkName" placeholder="e.g. PREMIUM_001"></div><div class="fg"><label>Owner</label><input type="text" id="gkOwner" placeholder="Owner name"></div><div class="fg"><label>Request Limit</label><input type="text" id="gkLimit" placeholder="100 or unlimited"></div><div class="fg"><label>Expiry</label><select id="gkExpiry"><option value="LIFETIME">Lifetime (No Expiry)</option><option value="31-12-2026">31 Dec 2026</option><option value="31-12-2027">31 Dec 2027</option><option value="30-06-2026">30 Jun 2026</option></select></div><div class="fg"><label>Type</label><select id="gkType"><option value="premium">Premium</option><option value="demo">Demo</option><option value="test">Test</option></select></div><div class="fg fw"><label>Scopes</label><div class="cbw" id="scopeCbs">${scb}</div></div><div class="fg fw"><button class="btn bp" onclick="gk()" style="width:100%">Generate Key</button></div></div></div></div>
        <div class="panel" id="p-keys"><div class="sec"><h3>All API Keys</h3><div style="margin-bottom:12px;display:flex;gap:10px"><input type="text" id="keySearch" placeholder="Search keys..." onkeyup="fk()" style="padding:9px 14px;background:var(--bg);border:1px solid var(--b2);border-radius:var(--rs);color:var(--t);font-size:12px;font-family:inherit;width:260px"><button class="bo" onclick="rak()">Reset All Usage</button></div><div class="tw"><table><thead><tr><th>Key</th><th>Owner</th><th>Scopes</th><th>Limit</th><th>Used</th><th>Left</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody id="keyBody">${keyRows}</tbody></table></div></div></div>
        <div class="panel" id="p-io">
            <div class="iebox"><h3>📤 Export Keys</h3><p style="font-size:11px;color:var(--t3);margin-bottom:10px">Copy this JSON to backup all keys</p><textarea readonly id="ed" onclick="this.select()">${JSON.stringify(keyStorage,null,2).replace(/"/g,'&quot;').replace(/</g,'&lt;')}</textarea><button class="btn bo btn-sm" style="margin-top:10px" onclick="ce()">Copy to Clipboard</button></div>
            <div class="iebox" style="border-color:var(--bl)"><h3 style="color:var(--bl)">📥 Import Keys</h3><p style="font-size:11px;color:var(--t3);margin-bottom:10px">Paste JSON to import keys (merges with existing)</p><textarea id="id" placeholder="Paste JSON here..."></textarea><button class="btn bp btn-sm" style="margin-top:10px" onclick="ik()">Import Keys</button></div>
        </div>
        <div class="panel" id="p-custom"><div class="sec"><h3>Custom API Integrations (10 Slots)</h3><div id="cc">${car}</div></div></div>
        <div class="panel" id="p-usage"><div class="sec"><h3>API Usage Statistics</h3><p style="font-size:11px;color:var(--t3);margin-bottom:14px">Endpoint-wise request breakdown</p><div class="tw"><table><thead><tr><th>Endpoint</th><th>Total Requests</th><th>Success</th><th>Failed</th></tr></thead><tbody>${usageRows}</tbody></table></div></div></div>
        <div class="panel" id="p-logs"><div class="sec"><h3>Request Logs <span style="font-size:10px;color:var(--t3);font-weight:400">(Browser + IP tracked)</span></h3><div style="margin-bottom:12px"><button class="bo" onclick="cl()">Clear All Logs</button></div><div class="lbx">${logs}</div></div></div>
    </div>
    <script>
        const TOKEN='${token}';
        // SAVE TOKEN PERMANENTLY
        if(TOKEN)localStorage.setItem('bronx_admin_token',TOKEN);
        function toast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2200)}
        function st(n){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));document.getElementById('p-'+n).classList.add('active');event.target.classList.add('active')}
        async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','x-admin-token':TOKEN},body:body?JSON.stringify(body):undefined});return await r.json()}
        async function gk(){const n=document.getElementById('gkName').value.trim();const o=document.getElementById('gkOwner').value.trim();const l=document.getElementById('gkLimit').value.trim();const e=document.getElementById('gkExpiry').value;const t=document.getElementById('gkType').value;if(!n||!o){toast('Key name and owner required');return}const sc=[];document.querySelectorAll('#scopeCbs input:checked').forEach(c=>sc.push(c.value));if(!sc.length){toast('Select at least one scope');return}const d=await api('/admin/generate-key',{keyName:n,keyOwner:o,scopes:sc,limit:l||'100',expiryDate:e,keyType:t});d.success?(toast('Key Generated: '+n),setTimeout(()=>location.reload(),1200)):toast(d.error||'Error')}
        async function deleteKey(k){if(!confirm('Delete '+k+'?'))return;const d=await api('/admin/delete-key',{keyName:k});d.success?(toast(d.message),setTimeout(()=>location.reload(),800)):toast(d.error)}
        async function resetKey(k){const d=await api('/admin/reset-key-usage',{keyName:k});d.success?(toast(d.message),setTimeout(()=>location.reload(),800)):toast(d.error)}
        async function rak(){if(!confirm('Reset ALL usage?'))return;const d=await api('/admin/keys');if(d.success)for(const k of d.keys)await api('/admin/reset-key-usage',{keyName:k.key});toast('All usage reset');setTimeout(()=>location.reload(),800)}
        async function cl(){if(!confirm('Clear all logs?'))return;await api('/admin/clear-logs');toast('Logs cleared');setTimeout(()=>location.reload(),800)}
        async function logout(){localStorage.removeItem('bronx_admin_token');await api('/admin/logout');window.location.href='/admin'}
        function fk(){const s=document.getElementById('keySearch').value.toLowerCase();document.querySelectorAll('#keyBody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(s)?'':'none'})}
        function ce(){const ta=document.getElementById('ed');ta.select();document.execCommand('copy');toast('Copied!')}
        async function ik(){const raw=document.getElementById('id').value.trim();if(!raw){toast('Paste JSON first');return}try{const data=JSON.parse(raw);const d=await api('/admin/import-keys',{keys:data});d.success?(toast('Imported: '+d.imported+' keys'),setTimeout(()=>location.reload(),1000)):toast(d.error||'Import failed')}catch(e){toast('Invalid JSON!')}}
        function editCA(i){document.getElementById('ce'+i).style.display='block';document.getElementById('cr'+i).querySelector('.cav').style.display='none'}
        function cancelCA(i){document.getElementById('ce'+i).style.display='none';document.getElementById('cr'+i).querySelector('.cav').style.display='flex'}
        async function saveCA(i){const data={name:document.getElementById('cn'+i).value,endpoint:document.getElementById('cep'+i).value,param:document.getElementById('cp'+i).value,example:document.getElementById('cex'+i).value,desc:document.getElementById('cd'+i).value,realAPI:document.getElementById('crl'+i).value,visible:document.getElementById('cv'+i).value==='1'};const d=await api('/admin/custom-api',{slot:i,api:data});d.success?(toast('API #'+(i+1)+' saved!'),setTimeout(()=>location.reload(),800)):toast(d.error||'Error')}
        async function toggleCA(i){const d=await api('/admin/custom-api',{slot:i,api:{visible:!${JSON.stringify(customAPIs)}[i].visible}});d.success?(toast('Toggled!'),setTimeout(()=>location.reload(),600)):toast(d.error||'Error')}
    </script>
</body>
</html>`;
}

// ========== EXPRESS ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || 'unknown';
    req.userAgent = req.headers['user-agent'] || 'Unknown';
    next();
});

// ========== PUBLIC ==========
app.get('/', (req, res) => res.send(renderPublicHome()));

app.get('/test', (req, res) => {
    res.json({ status: 'BRONX OSINT v8.0 God Level', credit: '@BRONX_ULTRA', time: getIndiaDateTime(), timezone: 'Asia/Kolkata', endpoints: Object.keys(endpoints).length, custom_apis: customAPIs.filter(a => a.visible).length, total_keys: Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length });
});

app.get('/key-info', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) return res.status(404).json({ success: false, error: "Key not found" });
    const now = getIndiaTime();
    res.json({ success: true, key_masked: apiKey.substring(0, 6) + '****', owner: keyData.name, type: keyData.type, scopes: keyData.scopes, limit: keyData.unlimited ? 'Unlimited' : keyData.limit, used: keyData.used, remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used), expiry: keyData.expiryStr || 'LIFETIME', status: (keyData.expiry && now > keyData.expiry) ? 'expired' : ((!keyData.unlimited && keyData.used >= keyData.limit) ? 'exhausted' : 'active'), created: keyData.created, timezone: 'Asia/Kolkata' });
});

app.get('/quota', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) return res.status(404).json({ success: false, error: "Key not found" });
    res.json({ success: true, key_masked: apiKey.substring(0, 6) + '****', owner: keyData.name, limit: keyData.unlimited ? 'Unlimited' : keyData.limit, used: keyData.used, remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used), expiry: keyData.expiryStr || 'LIFETIME' });
});

// ========== FIXED CUSTOM API - NO DATA LEAK ==========
app.get('/api/custom/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    
    const customAPI = customAPIs.find(function(api) {
        return api.endpoint === endpoint && api.visible === true;
    });
    
    if (!customAPI) {
        logRequest(null, 'custom/' + endpoint, 'not-found', 'failed', req.clientIP, req.userAgent);
        return res.status(404).json({ success: false, error: 'Custom endpoint not found: ' + endpoint });
    }
    
    if (!apiKey) {
        logRequest(null, 'custom/' + endpoint, 'no-key', 'failed', req.clientIP, req.userAgent);
        return res.status(401).json({ success: false, error: "API Key Required" });
    }
    
    const kc = checkKeyValid(apiKey);
    if (!kc.valid) {
        logRequest(apiKey, 'custom/' + endpoint, query[customAPI.param], 'failed', req.clientIP, req.userAgent);
        return res.status(403).json({ success: false, error: kc.error, expired: kc.expired || false, limitExhausted: kc.limitExhausted || false });
    }
    
    const keyData = kc.keyData;
    const paramValue = query[customAPI.param];
    
    if (!paramValue) {
        return res.status(400).json({ success: false, error: 'Missing parameter: ' + customAPI.param, example: '?key=KEY&' + customAPI.param + '=' + customAPI.example });
    }
    
    try {
        var realUrl = customAPI.realAPI;
        realUrl = realUrl.replace(/\{param\}/gi, encodeURIComponent(paramValue));
        realUrl = realUrl.replace(/\{parma\}/gi, encodeURIComponent(paramValue));
        
        const response = await axios.get(realUrl, { timeout: 30000, headers: { 'User-Agent': 'BRONX-OSINT/8.0' } });
        
        incrementKeyUsage(apiKey);
        logRequest(apiKey, 'custom/' + endpoint, paramValue, 'success', req.clientIP, req.userAgent);
        
        // SANITIZE - Remove real API data, only show cleaned BRONX response
        const cleanedData = sanitizeCustomAPIResponse(response.data, customAPI);
        cleanedData.api_info = {
            powered_by: "@BRONX_ULTRA",
            endpoint: endpoint,
            type: 'custom',
            key_owner: keyData.name,
            timestamp: getIndiaDateTime()
        };
        
        res.json(cleanedData);
        
    } catch (error) {
        logRequest(apiKey, 'custom/' + endpoint, paramValue, 'error', req.clientIP, req.userAgent);
        res.status(500).json({ success: false, error: 'External API error' }); // DON'T expose real error
    }
});

// Main API
app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    if (!endpoints[endpoint]) return res.status(404).json({ success: false, error: "Not found" });
    if (!apiKey) { logRequest(null, endpoint, 'no-key', 'failed', req.clientIP, req.userAgent); return res.status(401).json({ success: false, error: "API Key Required" }); }
    const kc = checkKeyValid(apiKey);
    if (!kc.valid) { logRequest(apiKey, endpoint, req.query[endpoints[endpoint].param], 'failed', req.clientIP, req.userAgent); return res.status(403).json({ success: false, error: kc.error }); }
    const sc = checkKeyScope(kc.keyData, endpoint);
    if (!sc.valid) { return res.status(403).json({ success: false, error: sc.error }); }
    const ep = endpoints[endpoint];
    const pv = req.query[ep.param];
    if (!pv) return res.status(400).json({ success: false, error: 'Missing: ' + ep.param });
    try {
        const ru = REAL_API_BASE + '/' + endpoint + '?key=' + REAL_API_KEY + '&' + ep.param + '=' + encodeURIComponent(pv);
        const resp = await axios.get(ru, { timeout: 30000 });
        const uk = incrementKeyUsage(apiKey);
        logRequest(apiKey, endpoint, pv, 'success', req.clientIP, req.userAgent);
        const cd = cleanResponse(resp.data);
        cd.api_info = { powered_by: "@BRONX_ULTRA", endpoint, key_owner: kc.keyData.name, limit: kc.keyData.unlimited ? 'Unlimited' : kc.keyData.limit, used: uk ? uk.used : kc.keyData.used, remaining: kc.keyData.unlimited ? 'Unlimited' : Math.max(0, kc.keyData.limit - (uk ? uk.used : kc.keyData.used)), expiry: kc.keyData.expiryStr || 'LIFETIME', timestamp: getIndiaDateTime() };
        res.json(cd);
    } catch (e) { logRequest(apiKey, endpoint, pv, 'error', req.clientIP, req.userAgent); res.status(500).json({ success: false, error: 'API error' }); }
});

// ========== ADMIN ==========
app.get('/admin', (req, res) => {
    const token = req.query.token || req.headers['x-admin-token'];
    isAdminAuthenticated(token) ? res.send(renderAdminPanel(token)) : res.send(renderAdminLogin());
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateSessionToken();
        // PERMANENT SESSION - 365 days
        adminSessions[token] = { expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), permanent: true, createdAt: getIndiaDateTime() };
        permanentTokens[token] = { createdAt: getIndiaDateTime() };
        savePermanentTokens();
        res.json({ success: true, token, message: '✅ Authenticated (Session Permanent)', redirect: '/admin?token=' + token });
    } else res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.post('/admin/logout', (req, res) => { 
    const token = req.headers['x-admin-token'] || req.query.token; 
    if (token) { 
        delete adminSessions[token]; 
        delete permanentTokens[token];
        savePermanentTokens();
    } 
    res.json({ success: true }); 
});

app.get('/admin/check-auth', (req, res) => res.json({ authenticated: isAdminAuthenticated(req.query.token || req.headers['x-admin-token']) }));

app.post('/admin/generate-key', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    const { keyName, keyOwner, scopes, limit, expiryDate, keyType } = req.body;
    if (!keyName || !keyOwner || !scopes?.length) return res.status(400).json({ success: false, error: 'Missing fields' });
    if (keyStorage[keyName]) return res.status(400).json({ success: false, error: 'Key exists' });
    const isUnl = limit === 'unlimited' || parseInt(limit) >= 999999;
    keyStorage[keyName] = { name: keyOwner, scopes, type: keyType || 'premium', limit: isUnl ? 999999 : parseInt(limit) || 100, used: 0, expiry: expiryDate && expiryDate !== 'LIFETIME' ? parseExpiryDate(expiryDate) : null, expiryStr: expiryDate || 'LIFETIME', created: getIndiaDateTime(), resetType: 'never', unlimited: isUnl, hidden: false };
    res.json({ success: true, message: 'Key generated', key: keyName });
});

app.post('/admin/delete-key', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    const { keyName } = req.body;
    if (keyName === 'BRONX_ULTRA_MASTER_2026') return res.status(400).json({ success: false, error: 'Cannot delete master key' });
    if (keyStorage[keyName]) { delete keyStorage[keyName]; res.json({ success: true }); } else res.status(404).json({ success: false });
});

app.post('/admin/reset-key-usage', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    const { keyName } = req.body;
    if (keyStorage[keyName]) { keyStorage[keyName].used = 0; res.json({ success: true }); } else res.status(404).json({ success: false });
});

app.get('/admin/keys', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    res.json({ success: true, keys: Object.entries(keyStorage).map(([k,d]) => ({ key: k, name: d.name, scopes: d.scopes, type: d.type, limit: d.unlimited?'Unlimited':d.limit, used: d.used, remaining: d.unlimited?'Unlimited':Math.max(0,d.limit-d.used), expiry: d.expiryStr||'LIFETIME', hidden: d.hidden })) });
});

app.post('/admin/import-keys', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    const { keys } = req.body;
    if (!keys || typeof keys !== 'object') return res.status(400).json({ success: false });
    let imported = 0, skipped = 0;
    Object.entries(keys).forEach(([kn, kd]) => {
        if (kn === 'BRONX_ULTRA_MASTER_2026') { skipped++; return; }
        if (keyStorage[kn]) { skipped++; return; }
        keyStorage[kn] = { name: kd.name || 'Imported', scopes: kd.scopes || ['number'], type: kd.type || 'imported', limit: kd.limit || 100, used: kd.used || 0, expiry: kd.expiryStr && kd.expiryStr !== 'LIFETIME' ? parseExpiryDate(kd.expiryStr) : null, expiryStr: kd.expiryStr || 'LIFETIME', created: kd.created || getIndiaDateTime(), resetType: 'never', unlimited: kd.unlimited || false, hidden: kd.hidden || false };
        imported++;
    });
    res.json({ success: true, message: `Imported ${imported}, skipped ${skipped}`, imported, skipped });
});

app.post('/admin/custom-api', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    const { slot, api } = req.body;
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) return res.status(400).json({ success: false });
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    res.json({ success: true, api: customAPIs[slot] });
});

app.get('/admin/logs', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    res.json({ success: true, logs: requestLogs.slice(-(parseInt(req.query.limit)||100)).reverse() });
});

app.post('/admin/clear-logs', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    requestLogs = []; res.json({ success: true });
});

app.get('/admin/stats', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false });
    const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    res.json({ success: true, stats: { totalKeys, activeKeys: Object.entries(keyStorage).filter(([_,d])=>!d.hidden&&!isKeyExpired(d.expiry)&&!(d.used>=d.limit&&!d.unlimited)).length, totalRequests: requestLogs.length, todayRequests: requestLogs.filter(l=>l.timestamp.startsWith(getIndiaDate())).length, totalEndpoints: Object.keys(endpoints).length, totalCustomAPIs: customAPIs.filter(a=>a.visible).length, serverTime: getIndiaDateTime() } });
});

app.use((req, res) => res.status(404).json({ success: false, error: "Not found", contact: "@BRONX_ULTRA" }));

module.exports = app;
