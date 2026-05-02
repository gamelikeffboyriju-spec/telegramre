// api/index.js - BRONX OSINT API v7.0 - ULTIMATE FIXED VERSION
const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = 'bot-new';

// ========== ADMIN CONFIG ==========
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'BRONX_ULTRA';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BRONX@2026#OWNER';

// ========== MEMORY STORAGE ==========
let keyStorage = {};
let customAPIs = [];
let requestLogs = [];
let adminSessions = {};

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

// ========== ADMIN AUTH ==========
function generateSessionToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 40; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
}

function isAdminAuthenticated(token) {
    if (!token || !adminSessions[token]) return false;
    if (Date.now() > adminSessions[token].expiresAt) { delete adminSessions[token]; return false; }
    return true;
}

// ========== ENDPOINTS ==========
const endpoints = {
    number: { param: 'num', category: 'Phone Intelligence', icon: '📱', example: '9876543210', desc: 'Indian Mobile Number Lookup' },
    aadhar: { param: 'num', category: 'Phone Intelligence', icon: '🆔', example: '393933081942', desc: 'Aadhaar Number Lookup' },
    name: { param: 'name', category: 'Phone Intelligence', icon: '🔍', example: 'abhiraaj', desc: 'Name to Records Search' },
    numv2: { param: 'num', category: 'Phone Intelligence', icon: '📱', example: '6205949840', desc: 'Number Info v2' },
    adv: { param: 'num', category: 'Phone Intelligence', icon: '📱', example: '9876543210', desc: 'Advanced Phone Lookup' },
    adharfamily: { param: 'num', category: 'Phone Intelligence', icon: '👨‍👩‍👧‍👦', example: '984154610245', desc: 'Aadhar Family Details' },
    adharration: { param: 'num', category: 'Phone Intelligence', icon: '📋', example: '701984830542', desc: 'Aadhar Ration Card' },
    imei: { param: 'imei', category: 'Phone Intelligence', icon: '📱', example: '357817383506298', desc: 'IMEI Number Lookup' },
    calltracer: { param: 'num', category: 'Phone Intelligence', icon: '📞', example: '9876543210', desc: 'Call Tracer Lookup' },
    upi: { param: 'upi', category: 'Financial', icon: '💰', example: 'example@ybl', desc: 'UPI ID Verification' },
    ifsc: { param: 'ifsc', category: 'Financial', icon: '🏦', example: 'SBIN0001234', desc: 'IFSC Code Details' },
    pan: { param: 'pan', category: 'Financial', icon: '📄', example: 'AXDPR2606K', desc: 'PAN to GST Search' },
    pincode: { param: 'pin', category: 'Location', icon: '📍', example: '110001', desc: 'Pincode Details' },
    ip: { param: 'ip', category: 'Location', icon: '🌐', example: '8.8.8.8', desc: 'IP Lookup' },
    vehicle: { param: 'vehicle', category: 'Vehicle', icon: '🚗', example: 'MH02FZ0555', desc: 'Vehicle Registration' },
    rc: { param: 'owner', category: 'Vehicle', icon: '📋', example: 'UP92P2111', desc: 'RC Owner Details' },
    ff: { param: 'uid', category: 'Gaming', icon: '🎮', example: '123456789', desc: 'Free Fire Info' },
    bgmi: { param: 'uid', category: 'Gaming', icon: '🎮', example: '5121439477', desc: 'BGMI Info' },
    insta: { param: 'username', category: 'Social', icon: '📸', example: 'cristiano', desc: 'Instagram Profile' },
    git: { param: 'username', category: 'Social', icon: '💻', example: 'ftgamer2', desc: 'GitHub Profile' },
    tg: { param: 'info', category: 'Social', icon: '📲', example: 'JAUUOWNER', desc: 'Telegram Lookup' },
    tgidinfo: { param: 'id', category: 'Social', icon: '📲', example: '7530266953', desc: 'Telegram ID Info' },
    snap: { param: 'username', category: 'Social', icon: '👻', example: 'priyapanchal272', desc: 'Snapchat Lookup' },
    pk: { param: 'num', category: 'Pakistan', icon: '🇵🇰', example: '03331234567', desc: 'Pakistan Number v1' },
    pkv2: { param: 'num', category: 'Pakistan', icon: '🇵🇰', example: '3359736848', desc: 'Pakistan Number v2' }
};

const allScopes = [
    { value: '*', label: '🌟 ALL SCOPES' },
    { value: 'number', label: '📱 Number' }, { value: 'numv2', label: '📱 Number v2' },
    { value: 'adv', label: '📱 Advanced' }, { value: 'aadhar', label: '🆔 Aadhar' },
    { value: 'adharfamily', label: '👨‍👩‍👧‍👦 Family' }, { value: 'adharration', label: '📋 Ration' },
    { value: 'name', label: '🔍 Name' }, { value: 'upi', label: '💰 UPI' },
    { value: 'ifsc', label: '🏦 IFSC' }, { value: 'pan', label: '📄 PAN' },
    { value: 'pincode', label: '📍 Pin' }, { value: 'ip', label: '🌐 IP' },
    { value: 'vehicle', label: '🚗 Vehicle' }, { value: 'rc', label: '📋 RC' },
    { value: 'ff', label: '🎮 FF' }, { value: 'bgmi', label: '🎮 BGMI' },
    { value: 'insta', label: '📸 Insta' }, { value: 'git', label: '💻 GitHub' },
    { value: 'tg', label: '📲 TG' }, { value: 'tgidinfo', label: '📲 TG ID' },
    { value: 'snap', label: '👻 Snap' }, { value: 'imei', label: '📱 IMEI' },
    { value: 'calltracer', label: '📞 Call' }, { value: 'pk', label: '🇵🇰 PK v1' },
    { value: 'pkv2', label: '🇵🇰 PK v2' }
];

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
    if (ua.includes('Brave')) return 'Brave';
    return 'Other';
}

// ========== ULTRA PREMIUM PUBLIC HOME ==========
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
        const catIcons = { 'Phone Intelligence': '📱', 'Financial': '💰', 'Location': '📍', 'Vehicle': '🚗', 'Gaming': '🎮', 'Social': '🌐', 'Pakistan': '🇵🇰' };
        
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <div class="cat-icon-wrap">
                    <span class="cat-icon">${catIcons[cat] || '🔧'}</span>
                </div>
                <div class="cat-info">
                    <h3>${cat}</h3>
                    <span class="cat-count">${eps.length} endpoints</span>
                </div>
                <div class="cat-line"></div>
            </div>
            <div class="endpoint-grid">
                ${eps.map(ep => `
                <div class="endpoint-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-glow"></div>
                    <div class="ep-inner">
                        <div class="ep-badge-row">
                            <span class="ep-method">GET</span>
                            <span class="ep-icon">${ep.icon}</span>
                        </div>
                        <h4 class="ep-name">/${ep.name}</h4>
                        <p class="ep-desc">${ep.desc}</p>
                        <div class="ep-param-row">
                            <code class="ep-param-key">${ep.param}</code>
                            <span class="ep-param-eq">=</span>
                            <code class="ep-param-val">${ep.example}</code>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>`;
    });
    
    if (visibleAPIs.length > 0) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <div class="cat-icon-wrap custom-cat">
                    <span class="cat-icon">🔧</span>
                </div>
                <div class="cat-info">
                    <h3>Custom Integrations</h3>
                    <span class="cat-count">${visibleAPIs.length} custom APIs</span>
                </div>
                <div class="cat-line custom-line"></div>
            </div>
            <div class="endpoint-grid">
                ${visibleAPIs.map(api => `
                <div class="endpoint-card custom-card" onclick="copyUrlCustom('${api.endpoint}','${api.param}','${api.example}')">
                    <div class="ep-glow custom-glow"></div>
                    <div class="ep-inner">
                        <div class="ep-badge-row">
                            <span class="ep-method custom-method">CUSTOM</span>
                            <span class="ep-icon">🔧</span>
                        </div>
                        <h4 class="ep-name">/${api.endpoint}</h4>
                        <p class="ep-desc">${api.desc}</p>
                        <div class="ep-param-row">
                            <code class="ep-param-key">${api.param}</code>
                            <span class="ep-param-eq">=</span>
                            <code class="ep-param-val">${api.example}</code>
                        </div>
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
    <title>BRONX OSINT — Ultra Intelligence API</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #080808;
            --bg2: #0c0c0c;
            --card: #111111;
            --card-hover: #161616;
            --border: #1f1f1f;
            --border2: #2a2a2a;
            --text: #e8e8e8;
            --text2: #999;
            --text3: #666;
            --green: #00ff88;
            --green2: #00cc6a;
            --green-glow: rgba(0,255,136,0.4);
            --green-glow2: rgba(0,255,136,0.15);
            --blue: #448aff;
            --blue-glow: rgba(68,138,255,0.4);
            --orange: #ff9100;
            --orange-glow: rgba(255,145,0,0.3);
            --red: #ff3d3d;
            --radius: 16px;
            --radius-sm: 10px;
            --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-image: 
                radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.03) 0%, transparent 70%),
                radial-gradient(ellipse at 80% 20%, rgba(68,138,255,0.02) 0%, transparent 50%);
        }
        
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }
        
        .hero {
            position: relative;
            padding: 60px 30px 50px;
            text-align: center;
            background: linear-gradient(180deg, #0a0a0a 0%, var(--bg) 100%);
            border-bottom: 1px solid var(--border);
            overflow: hidden;
        }
        
        .hero-bg {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
        }
        
        .hero-bg-circle {
            position: absolute;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.08;
            animation: floatCircle 8s ease-in-out infinite;
        }
        
        .hero-bg-circle:nth-child(1) {
            width: 500px; height: 500px;
            background: var(--green);
            top: -200px; left: -100px;
            animation-delay: 0s;
        }
        
        .hero-bg-circle:nth-child(2) {
            width: 400px; height: 400px;
            background: var(--blue);
            top: -150px; right: -100px;
            animation-delay: -3s;
        }
        
        .hero-bg-circle:nth-child(3) {
            width: 300px; height: 300px;
            background: var(--orange);
            bottom: -100px; left: 40%;
            animation-delay: -6s;
        }
        
        @keyframes floatCircle {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -20px) scale(1.05); }
            66% { transform: translate(-20px, 10px) scale(0.95); }
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 700px;
            margin: 0 auto;
        }
        
        .hero-avatar-wrap {
            position: relative;
            display: inline-block;
            margin-bottom: 25px;
        }
        
        .hero-avatar-ring {
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 2px solid transparent;
            background: linear-gradient(135deg, var(--green), var(--blue), var(--orange), var(--green)) border-box;
            -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: ringRotate 4s linear infinite;
        }
        
        @keyframes ringRotate {
            0% { transform: rotate(0deg); filter: hue-rotate(0deg); }
            100% { transform: rotate(360deg); filter: hue-rotate(360deg); }
        }
        
        .hero-avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            object-fit: cover;
            display: block;
            border: 3px solid #1a1a1a;
            box-shadow: 0 0 60px var(--green-glow2), 0 0 120px rgba(0,255,136,0.05);
            transition: all var(--transition);
            position: relative;
            z-index: 1;
        }
        
        .hero-avatar:hover {
            box-shadow: 0 0 80px var(--green-glow), 0 0 160px rgba(0,255,136,0.1);
            transform: scale(1.05);
        }
        
        .hero-title {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: -1px;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #fff 0%, #ccc 50%, #fff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero-subtitle {
            font-size: 18px;
            font-weight: 600;
            color: var(--green);
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        
        .hero-desc {
            font-size: 13px;
            color: var(--text3);
            margin-bottom: 22px;
            letter-spacing: 0.3px;
        }
        
        .hero-tags {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .hero-tag {
            padding: 8px 18px;
            border-radius: 50px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            border: 1px solid;
            background: transparent;
            transition: all var(--transition);
            cursor: default;
            position: relative;
            overflow: hidden;
        }
        
        .hero-tag::before {
            content: '';
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity var(--transition);
        }
        
        .hero-tag:hover::before { opacity: 1; }
        
        .tag-green { 
            color: var(--green); 
            border-color: rgba(0,255,136,0.4); 
        }
        .tag-green::before { background: rgba(0,255,136,0.08); }
        .tag-green:hover { box-shadow: 0 0 25px var(--green-glow2); }
        
        .tag-blue { 
            color: var(--blue); 
            border-color: rgba(68,138,255,0.4); 
        }
        .tag-blue::before { background: rgba(68,138,255,0.08); }
        .tag-blue:hover { box-shadow: 0 0 25px var(--blue-glow); }
        
        .tag-orange { 
            color: var(--orange); 
            border-color: rgba(255,145,0,0.4); 
        }
        .tag-orange::before { background: rgba(255,145,0,0.08); }
        .tag-orange:hover { box-shadow: 0 0 25px var(--orange-glow); }
        
        .container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 25px;
        }
        
        .stats-row {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            padding: 28px 25px;
            margin: -35px auto 35px;
            max-width: 750px;
            background: rgba(17,17,17,0.95);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            position: relative;
            z-index: 5;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 40px rgba(0,0,0,0.4);
        }
        
        .stat-item {
            text-align: center;
            min-width: 80px;
            flex: 1;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -1px;
            background: linear-gradient(135deg, var(--green), var(--blue));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--text3);
            margin-top: 4px;
            font-weight: 600;
        }
        
        .stat-divider {
            width: 1px;
            background: var(--border2);
            align-self: stretch;
            margin: 5px 0;
        }
        
        .tester-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 28px;
            margin-bottom: 35px;
            position: relative;
            overflow: hidden;
        }
        
        .tester-section::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--green), var(--blue), transparent);
            opacity: 0.6;
        }
        
        .tester-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .tester-dot {
            width: 10px;
            height: 10px;
            background: var(--green);
            border-radius: 50%;
            box-shadow: 0 0 15px var(--green-glow);
            animation: pulseDot 2s ease-in-out infinite;
        }
        
        @keyframes pulseDot {
            0%, 100% { box-shadow: 0 0 10px var(--green-glow); }
            50% { box-shadow: 0 0 30px var(--green-glow), 0 0 60px var(--green-glow2); }
        }
        
        .tester-header h3 {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.3px;
            color: #fff;
        }
        
        .tester-form {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .tester-form select,
        .tester-form input {
            flex: 1;
            min-width: 160px;
            padding: 13px 16px;
            background: var(--bg);
            border: 1px solid var(--border2);
            border-radius: var(--radius-sm);
            color: var(--text);
            font-size: 13px;
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            transition: all var(--transition);
            outline: none;
        }
        
        .tester-form select:focus,
        .tester-form input:focus {
            border-color: var(--green);
            box-shadow: 0 0 0 3px rgba(0,255,136,0.06), 0 0 20px rgba(0,255,136,0.05);
        }
        
        .btn-execute {
            padding: 13px 30px;
            background: var(--green);
            color: #000;
            border: none;
            border-radius: var(--radius-sm);
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            letter-spacing: 0.5px;
            transition: all var(--transition);
            white-space: nowrap;
            font-family: inherit;
            position: relative;
            overflow: hidden;
        }
        
        .btn-execute::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, transparent, rgba(255,255,255,0.2), transparent);
            transform: translateX(-100%);
            transition: transform 0.6s;
        }
        
        .btn-execute:hover {
            background: var(--green2);
            box-shadow: 0 0 35px var(--green-glow), 0 0 70px var(--green-glow2);
            transform: translateY(-1px);
        }
        
        .btn-execute:hover::before {
            transform: translateX(100%);
        }
        
        .result-box {
            margin-top: 18px;
            background: #050505;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 18px;
            max-height: 350px;
            overflow: auto;
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 12px;
            display: none;
            white-space: pre-wrap;
            color: var(--green);
        }
        
        .category-section {
            margin-bottom: 40px;
        }
        
        .category-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border);
            position: relative;
        }
        
        .cat-icon-wrap {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(0,255,136,0.06);
            border: 1px solid rgba(0,255,136,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }
        
        .custom-cat {
            background: rgba(255,145,0,0.06);
            border-color: rgba(255,145,0,0.15);
        }
        
        .cat-info h3 {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
            letter-spacing: -0.3px;
        }
        
        .cat-count {
            font-size: 10px;
            color: var(--text3);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
        }
        
        .cat-line {
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, rgba(0,255,136,0.2), transparent);
        }
        
        .custom-line {
            background: linear-gradient(90deg, rgba(255,145,0,0.2), transparent);
        }
        
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
        }
        
        .endpoint-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            cursor: pointer;
            transition: all var(--transition);
            position: relative;
            overflow: hidden;
        }
        
        .ep-glow {
            position: absolute;
            inset: -1px;
            border-radius: var(--radius);
            background: linear-gradient(135deg, transparent, var(--green-glow2), transparent);
            opacity: 0;
            transition: opacity var(--transition);
            pointer-events: none;
            z-index: 0;
        }
        
        .custom-glow {
            background: linear-gradient(135deg, transparent, var(--orange-glow), transparent);
        }
        
        .endpoint-card:hover {
            background: var(--card-hover);
            border-color: var(--green);
            transform: translateY(-3px);
            box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(0,255,136,0.05);
        }
        
        .endpoint-card:hover .ep-glow {
            opacity: 1;
        }
        
        .custom-card:hover {
            border-color: var(--orange);
            box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(255,145,0,0.05);
        }
        
        .ep-inner {
            position: relative;
            z-index: 1;
            padding: 20px 22px;
        }
        
        .ep-badge-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .ep-method {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            background: rgba(0,255,136,0.1);
            color: var(--green);
            border: 1px solid rgba(0,255,136,0.25);
        }
        
        .custom-method {
            background: rgba(255,145,0,0.1);
            color: var(--orange);
            border-color: rgba(255,145,0,0.25);
        }
        
        .ep-icon {
            font-size: 22px;
        }
        
        .ep-name {
            font-size: 18px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 5px;
            letter-spacing: -0.3px;
        }
        
        .ep-desc {
            font-size: 12px;
            color: var(--text2);
            margin-bottom: 14px;
        }
        
        .ep-param-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 12px;
        }
        
        .ep-param-key {
            color: var(--green);
            background: rgba(0,255,136,0.06);
            padding: 3px 8px;
            border-radius: 4px;
        }
        
        .ep-param-eq {
            color: var(--text3);
        }
        
        .ep-param-val {
            color: var(--text2);
        }
        
        .custom-card .ep-param-key {
            color: var(--orange);
            background: rgba(255,145,0,0.06);
        }
        
        .footer {
            text-align: center;
            padding: 45px 20px;
            border-top: 1px solid var(--border);
            margin-top: 30px;
            position: relative;
        }
        
        .footer::before {
            content: '';
            position: absolute;
            top: 1px;
            left: 20%;
            right: 20%;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--green), transparent);
            opacity: 0.3;
        }
        
        .footer-brand {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.3px;
            background: linear-gradient(135deg, var(--green), var(--blue));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .footer-info {
            font-size: 12px;
            color: var(--text3);
            margin-top: 6px;
        }
        
        .footer-link {
            color: var(--text2);
            text-decoration: none;
            transition: color var(--transition);
        }
        
        .footer-link:hover {
            color: var(--green);
        }
        
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: var(--card);
            color: var(--green);
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(0,255,136,0.3);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 30px var(--green-glow2);
            pointer-events: none;
        }
        
        @media (max-width: 768px) {
            .hero { padding: 40px 20px 35px; }
            .hero-title { font-size: 28px; }
            .hero-subtitle { font-size: 15px; }
            .hero-avatar { width: 90px; height: 90px; }
            .hero-avatar-ring { inset: -6px; }
            .stats-row { gap: 10px; padding: 18px 12px; margin: -25px 15px 25px; }
            .stat-value { font-size: 22px; }
            .stat-label { font-size: 8px; }
            .endpoint-grid { grid-template-columns: 1fr; }
            .tester-form { flex-direction: column; }
            .tester-form select, .tester-form input { min-width: 100%; }
            .btn-execute { width: 100%; }
        }
    </style>
</head>
<body>
    <header class="hero">
        <div class="hero-bg">
            <div class="hero-bg-circle"></div>
            <div class="hero-bg-circle"></div>
            <div class="hero-bg-circle"></div>
        </div>
        <div class="hero-content">
            <div class="hero-avatar-wrap">
                <div class="hero-avatar-ring"></div>
                <img src="https://i.ibb.co/YTjW35Hs/file-000000007b0872069c1067c615adaa48.png" alt="BRONX_ULTRA" class="hero-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><rect fill=%22%23111%22 width=%22120%22 height=%22120%22 rx=%2260%22/><text fill=%22%230f0%22 x=%2260%22 y=%2270%22 text-anchor=%22middle%22 font-size=%2240%22>B</text></svg>'">
            </div>
            <h1 class="hero-title">WELCOME TO BRONX OSINT</h1>
            <p class="hero-subtitle">Ultra Premium Intelligence API</p>
            <p class="hero-desc">Enterprise-grade OSINT platform with real-time data processing</p>
            <div class="hero-tags">
                <span class="hero-tag tag-green">🔒 Encrypted</span>
                <span class="hero-tag tag-blue">⚡ Real-Time</span>
                <span class="hero-tag tag-orange">💎 Premium</span>
                <span class="hero-tag tag-green">🛡️ Secure</span>
            </div>
        </div>
    </header>
    
    <div class="container">
        <div class="stats-row">
            <div class="stat-item">
                <div class="stat-value">${totalEndpoints}</div>
                <div class="stat-label">Endpoints</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
                <div class="stat-value">${totalKeys}</div>
                <div class="stat-label">Active Keys</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
                <div class="stat-value">JSON</div>
                <div class="stat-label">Response</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
                <div class="stat-value">26+</div>
                <div class="stat-label">APIs</div>
            </div>
        </div>
        
        <div class="tester-section">
            <div class="tester-header">
                <div class="tester-dot"></div>
                <h3>API Playground</h3>
            </div>
            <div class="tester-form">
                <select id="epSelect">
                    <option value="">Select Endpoint</option>
                    ${Object.entries(endpoints).map(([n, e]) => '<option value="' + n + '">' + e.icon + ' ' + n.toUpperCase() + ' — ' + e.desc + '</option>').join('')}
                    ${visibleAPIs.length > 0 ? visibleAPIs.map(a => '<option value="custom_' + a.id + '" data-custom="1" data-ep="' + a.endpoint + '" data-param="' + a.param + '">🔧 ' + a.name + '</option>').join('') : ''}
                </select>
                <input type="text" id="apiKey" placeholder="Enter API Key">
                <input type="text" id="paramVal" placeholder="Parameter Value">
                <button class="btn-execute" onclick="testAPI()">Execute →</button>
            </div>
            <div class="result-box" id="result"></div>
        </div>
        
        ${endpointSections}
    </div>
    
    <footer class="footer">
        <p class="footer-brand">BRONX OSINT</p>
        <p class="footer-info">Powered by <strong>@BRONX_ULTRA</strong> · India (IST) · <a href="/admin" class="footer-link">Admin</a></p>
    </footer>
    
    <script>
        const endpoints=${JSON.stringify(endpoints)};
        function copyUrl(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/key-bronx/'+e+'?key=YOUR_KEY&'+p+'='+ex);showToast('✓ Copied: /'+e)}
        function copyUrlCustom(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/custom/'+e+'?key=YOUR_KEY&'+p+'='+ex);showToast('✓ Custom URL Copied')}
        function showToast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0'},2200)}
        async function testAPI(){
            const s=document.getElementById('epSelect');const o=s.options[s.selectedIndex];
            const isC=o.dataset.custom==='1';const k=document.getElementById('apiKey').value;
            const v=document.getElementById('paramVal').value;const r=document.getElementById('result');
            if(!k||!v||!s.value){showToast('⚠️ Please fill all fields');return}
            let url;
            if(isC){url='/api/custom/'+o.dataset.ep+'?key='+k+'&'+o.dataset.param+'='+v}
            else{const ep=s.value;url='/api/key-bronx/'+ep+'?key='+k+'&'+endpoints[ep].param+'='+v}
            r.style.display='block';r.textContent='⏳ Executing request...';r.style.color='#888';
            try{const re=await fetch(url);const d=await re.json();r.textContent=JSON.stringify(d,null,2);r.style.color='#00ff88'}
            catch(e){r.textContent='✕ Error: '+e.message;r.style.color='#ff3d3d'}
        }
    </script>
</body>
</html>`;
}

// ========== ADMIN LOGIN PAGE ==========
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
        body{background:#080808;min-height:100vh;display:flex;justify-content:center;align-items:center;font-family:'Inter',sans-serif;background-image:radial-gradient(ellipse at center,rgba(0,255,136,0.03) 0%,transparent 70%)}
        .login-box{background:#111;border:1px solid #1f1f1f;border-radius:16px;padding:45px 40px;width:400px;box-shadow:0 16px 60px rgba(0,0,0,0.5);position:relative;overflow:hidden}
        .login-box::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00ff88,#448aff,transparent)}
        .login-icon{width:56px;height:56px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px}
        .login-box h2{text-align:center;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px}
        .login-sub{text-align:center;color:#666;font-size:12px;margin-bottom:28px;letter-spacing:0.5px}
        .form-group{margin-bottom:16px}
        .form-group label{display:block;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:7px;font-weight:700}
        .form-group input{width:100%;padding:13px 16px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:10px;color:#e0e0e0;font-size:14px;font-family:inherit;transition:all 0.3s;outline:none}
        .form-group input:focus{border-color:#00ff88;box-shadow:0 0 0 3px rgba(0,255,136,0.06),0 0 20px rgba(0,255,136,0.05)}
        .btn-login{width:100%;padding:13px;background:#00ff88;color:#000;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:0.5px;transition:all 0.3s;font-family:inherit;margin-top:8px}
        .btn-login:hover{background:#00cc6a;box-shadow:0 0 35px rgba(0,255,136,0.3)}
        .error{color:#ff3d3d;text-align:center;margin-top:14px;font-size:13px;display:none;font-weight:500}
        .back{text-align:center;margin-top:18px}
        .back a{color:#666;text-decoration:none;font-size:12px;transition:color 0.3s}
        .back a:hover{color:#00ff88}
    </style>
</head>
<body>
    <div class="login-box">
        <div class="login-icon">🛡️</div>
        <h2>Admin Access</h2>
        <p class="login-sub">BRONX OSINT Control Panel</p>
        <div class="form-group"><label>Username</label><input type="text" id="username" placeholder="Enter username" autocomplete="off"></div>
        <div class="form-group"><label>Password</label><input type="password" id="password" placeholder="Enter password"></div>
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
                if(d.success){e.style.display='block';e.style.color='#00ff88';e.textContent=d.message;setTimeout(()=>{window.location.href=d.redirect},800)}
                else{e.style.display='block';e.style.color='#ff3d3d';e.textContent=d.error}
            }catch(err){e.style.display='block';e.style.color='#ff3d3d';e.textContent='Connection error'}
        }
        document.addEventListener('keydown',function(ev){if(ev.key==='Enter')login()});
    </script>
</body>
</html>`;
}

// ========== ADMIN PANEL ==========
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
        const sd = k.scopes.includes('*') ? '<span class="scope-tag">ALL</span>' : k.scopes.slice(0,5).map(s => '<span class="scope-tag">'+s+'</span>').join('') + (k.scopes.length>5?' <span class="scope-tag">+'+ (k.scopes.length-5) +'</span>':'');
        
        return '<tr>'+
            '<td><code style="color:#00ff88;font-size:11px" title="'+k.key+'">'+dk+'</code></td>'+
            '<td>'+ (k.name||'—') +'</td>'+
            '<td style="font-size:10px">'+sd+'</td>'+
            '<td>'+ (k.unlimited?'∞':k.limit) +'</td>'+
            '<td>'+k.used+'</td>'+
            '<td>'+ (k.unlimited?'∞':Math.max(0,k.limit-k.used)) +'</td>'+
            '<td>'+ (k.expiryStr||'Lifetime') +'</td>'+
            '<td><span class="status-dot '+sc+'">'+status+'</span></td>'+
            '<td style="white-space:nowrap">'+
                '<button onclick="resetKey(\''+k.key+'\')" class="btn-xs btn-info">Reset</button> '+
                (k.key!=='BRONX_ULTRA_MASTER_2026'?'<button onclick="deleteKey(\''+k.key+'\')" class="btn-xs btn-danger">Delete</button>':'')+
            '</td></tr>';
    }).join('');
    
    let scb = allScopes.map(s => '<label class="cb-label"><input type="checkbox" value="'+s.value+'"> '+s.label+'</label>').join('');
    
    let logs = requestLogs.slice(-25).reverse().map(l => {
        let sc = l.status==='success'?'s-green':(l.status==='failed'?'s-red':'s-orange');
        let browser = getBrowserName(l.browser);
        return '<div class="log-row"><span class="log-time">'+l.timestamp+'</span><span class="log-key">'+l.key+'</span><code class="log-ep">/'+l.endpoint+'</code><span class="log-browser">'+browser+'</span><span class="'+sc+'">'+l.status+'</span></div>';
    }).join('') || '<p style="color:#666;text-align:center;padding:20px">No requests logged</p>';
    
    let usageRows = Object.entries(endpointUsage).sort((a,b) => b[1].total - a[1].total).map(([ep, data]) => {
        return '<tr><td><code style="color:#00ff88">/'+ep+'</code></td><td><b>'+data.total+'</b></td><td style="color:#00ff88">'+data.success+'</td><td style="color:#ff3d3d">'+data.failed+'</td></tr>';
    }).join('') || '<tr><td colspan="4" style="text-align:center;color:#666;padding:20px">No requests yet</td></tr>';
    
    let customAPIRows = customAPIs.map((api, i) => `
        <div class="custom-api-row" id="customRow${i}">
            <div class="custom-api-view">
                <div class="custom-api-info">
                    <b class="custom-slot">#${api.id}</b>
                    <span class="custom-name">${api.name || 'Empty Slot'}</span>
                    ${api.endpoint ? '<code class="custom-ep">/' + api.endpoint + '</code>' : '<span class="custom-empty">No endpoint</span>'}
                    <span class="custom-status ${api.visible ? 'vis' : 'hid'}">${api.visible ? 'VISIBLE' : 'HIDDEN'}</span>
                </div>
                <div class="custom-api-actions">
                    <button class="btn-xs btn-info" onclick="editCustomAPI(${i})">Edit</button>
                    <button class="btn-xs btn-warn" onclick="toggleCustomAPI(${i})">Toggle</button>
                </div>
            </div>
            <div class="custom-api-edit" id="customEdit${i}" style="display:none">
                <div class="form-row" style="margin-top:12px">
                    <div class="form-grp"><label>Name</label><input type="text" id="caName${i}" value="${api.name || ''}"></div>
                    <div class="form-grp"><label>Endpoint</label><input type="text" id="caEp${i}" value="${api.endpoint || ''}"></div>
                    <div class="form-grp"><label>Parameter</label><input type="text" id="caParam${i}" value="${api.param || ''}"></div>
                    <div class="form-grp"><label>Example</label><input type="text" id="caEx${i}" value="${api.example || ''}"></div>
                    <div class="form-grp"><label>Description</label><input type="text" id="caDesc${i}" value="${api.desc || ''}"></div>
                    <div class="form-grp"><label>Real API URL</label><input type="text" id="caReal${i}" value="${api.realAPI || ''}"></div>
                    <div class="form-grp"><label>Visible</label><select id="caVis${i}"><option value="1" ${api.visible?'selected':''}>Yes</option><option value="0" ${!api.visible?'selected':''}>No</option></select></div>
                    <div class="form-grp full-w" style="display:flex;gap:10px">
                        <button class="btn btn-primary btn-sm" onclick="saveCustomAPI(${i})">Save</button>
                        <button class="btn btn-outline btn-sm" onclick="cancelEdit(${i})">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX — Administration Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root{--bg:#080808;--card:#111;--card2:#151515;--border:#1f1f1f;--border2:#2a2a2a;--text:#e0e0e0;--text2:#999;--text3:#666;--g:#00ff88;--g2:#00cc6a;--r:#ff3d3d;--o:#ff9100;--b:#448aff;--purple:#b388ff;--radius:14px;--radius-sm:8px}
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:10px}
        
        .topbar{
            background:var(--card);border-bottom:1px solid var(--border);padding:14px 28px;
            display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;
            position:sticky;top:0;z-index:100;backdrop-filter:blur(20px);
        }
        .topbar h1{font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.5px}
        .topbar h1 span{color:var(--g)}
        .topbar-right{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .topbar-time{font-size:10px;color:var(--text3);font-family:'SF Mono',monospace}
        
        .container{max-width:1400px;margin:0 auto;padding:20px 24px}
        
        .stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
        .stat-card{
            background:var(--card);border:1px solid var(--border);border-radius:var(--radius);
            padding:20px;text-align:center;position:relative;overflow:hidden;
        }
        .stat-card::after{
            content:'';position:absolute;bottom:0;left:20%;right:20%;height:2px;
            background:linear-gradient(90deg,transparent,var(--g),transparent);opacity:0.5;
        }
        .stat-num{font-size:36px;font-weight:900;color:var(--g);letter-spacing:-1px}
        .stat-lbl{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:var(--text3);margin-top:4px;font-weight:600}
        
        .tabs{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap}
        .tab{
            padding:10px 22px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);
            color:var(--text3);cursor:pointer;font-size:13px;font-weight:600;letter-spacing:0.5px;transition:all 0.3s;
        }
        .tab.active{border-color:var(--g);color:var(--g);background:rgba(0,255,136,0.04)}
        .tab:hover{border-color:#333;color:#ccc}
        .panel{display:none}
        .panel.active{display:block}
        
        .section{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:20px;position:relative}
        .section h3{font-size:16px;font-weight:700;color:#fff;margin-bottom:18px;letter-spacing:-0.3px}
        
        .form-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
        .form-grp label{display:block;color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-weight:700}
        .form-grp input,.form-grp select,.form-grp textarea{
            width:100%;padding:10px 14px;background:var(--bg);border:1px solid var(--border2);
            border-radius:var(--radius-sm);color:var(--text);font-size:12px;font-family:inherit;outline:none;transition:all 0.3s;
        }
        .form-grp input:focus,.form-grp select:focus,.form-grp textarea:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(0,255,136,0.05)}
        .form-grp textarea{resize:vertical;min-height:80px;font-family:'SF Mono',monospace;font-size:11px}
        .full-w{grid-column:1/-1}
        
        .cb-wrap{display:flex;flex-wrap:wrap;gap:5px;max-height:150px;overflow:auto;padding:10px;background:var(--bg);border:1px solid var(--border2);border-radius:var(--radius-sm)}
        .cb-label{display:flex;align-items:center;gap:5px;font-size:11px;color:#aaa;cursor:pointer;padding:3px 8px;border-radius:4px;transition:all 0.15s}
        .cb-label:hover{background:rgba(255,255,255,0.03)}
        .cb-label input{accent-color:var(--g)}
        
        .btn{padding:10px 22px;border-radius:var(--radius-sm);font-weight:600;font-size:13px;cursor:pointer;border:none;letter-spacing:0.5px;transition:all 0.3s;font-family:inherit}
        .btn-primary{background:var(--g);color:#000}
        .btn-primary:hover{background:var(--g2);box-shadow:0 0 30px rgba(0,255,136,0.25)}
        .btn-outline{background:transparent;border:1px solid var(--border2);color:var(--text2);padding:10px 18px;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;font-size:12px;transition:all 0.3s;font-family:inherit}
        .btn-outline:hover{border-color:var(--g);color:var(--g)}
        .btn-sm{padding:7px 16px;font-size:11px}
        .btn-xs{padding:4px 10px;font-size:10px;border-radius:4px;border:1px solid;cursor:pointer;font-weight:600;font-family:inherit}
        .btn-info{background:rgba(68,138,255,0.1);color:var(--b);border-color:rgba(68,138,255,0.3)}
        .btn-info:hover{background:rgba(68,138,255,0.2)}
        .btn-danger{background:rgba(255,61,61,0.1);color:var(--r);border-color:rgba(255,61,61,0.3)}
        .btn-danger:hover{background:rgba(255,61,61,0.2)}
        .btn-warn{background:rgba(255,145,0,0.1);color:var(--o);border-color:rgba(255,145,0,0.3)}
        .btn-warn:hover{background:rgba(255,145,0,0.2)}
        
        .tbl-wrap{max-height:400px;overflow:auto;border-radius:var(--radius-sm);border:1px solid var(--border)}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:var(--card2);color:var(--text3);padding:10px 8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:9px;position:sticky;top:0;z-index:10;border-bottom:2px solid var(--border)}
        td{padding:9px 8px;border-bottom:1px solid rgba(255,255,255,0.03)}
        tr:hover{background:rgba(255,255,255,0.02)}
        
        .status-dot{padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700;letter-spacing:1px}
        .s-green{background:rgba(0,255,136,0.1);color:var(--g)}
        .s-red{background:rgba(255,61,61,0.1);color:var(--r)}
        .s-orange{background:rgba(255,145,0,0.1);color:var(--o)}
        .s-purple{background:rgba(179,136,255,0.1);color:var(--purple)}
        
        .scope-tag{display:inline-block;padding:1px 6px;background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.15);border-radius:8px;font-size:9px;margin:1px;color:var(--g)}
        
        .logs-box{max-height:350px;overflow:auto;background:var(--bg);border-radius:var(--radius-sm);padding:14px;font-size:11px;font-family:'SF Mono',monospace}
        .log-row{display:flex;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.02);flex-wrap:wrap;align-items:center}
        .log-time{color:#444;min-width:130px;font-size:10px}
        .log-key{color:var(--g);font-size:10px}
        .log-ep{color:var(--b);font-size:10px}
        .log-browser{color:var(--text3);font-size:9px}
        
        .custom-api-row{
            background:var(--bg);border:1px solid var(--border2);border-radius:var(--radius-sm);
            padding:14px;margin-bottom:10px;transition:all 0.3s;
        }
        .custom-api-row:hover{border-color:#333}
        .custom-api-view{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
        .custom-api-info{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .custom-slot{color:var(--g)}
        .custom-name{color:#fff;font-weight:600}
        .custom-ep{color:var(--b);font-size:11px}
        .custom-empty{color:var(--text3);font-size:11px}
        .custom-status{padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700}
        .custom-status.vis{background:rgba(0,255,136,0.1);color:var(--g)}
        .custom-status.hid{background:rgba(255,61,61,0.1);color:var(--r)}
        .custom-api-actions{display:flex;gap:6px}
        .custom-api-edit{margin-top:10px;padding-top:12px;border-top:1px solid var(--border)}
        
        .import-export-box{
            background:var(--card);border:1px solid var(--o);border-radius:var(--radius);padding:20px;margin-bottom:20px;
        }
        .import-export-box h3{color:var(--o);font-size:15px;margin-bottom:12px}
        .import-export-box textarea{
            width:100%;min-height:120px;background:var(--bg);border:1px solid var(--border2);
            color:var(--text);padding:12px;border-radius:var(--radius-sm);font-family:'SF Mono',monospace;
            font-size:11px;resize:vertical;
        }
        .import-export-box textarea:focus{outline:none;border-color:var(--o)}
        
        .toast{
            position:fixed;bottom:24px;right:24px;background:var(--card);color:var(--g);
            padding:12px 22px;border-radius:var(--radius-sm);font-size:13px;font-weight:600;
            border:1px solid rgba(0,255,136,0.3);z-index:9999;opacity:0;transition:opacity 0.3s;
            box-shadow:0 8px 40px rgba(0,0,0,0.6),0 0 30px rgba(0,255,136,0.1);
        }
        
        @media(max-width:768px){.stat-row{grid-template-columns:repeat(2,1fr)}}
    </style>
</head>
<body>
    <div class="topbar">
        <h1>BRONX <span>OSINT</span> — Admin</h1>
        <div class="topbar-right">
            <span class="topbar-time">🇮🇳 ${getIndiaDateTime()}</span>
            <button class="btn-outline" onclick="window.open('/')">Home</button>
            <button class="btn-outline" onclick="logout()">Logout</button>
        </div>
    </div>
    
    <div class="container">
        <div class="stat-row">
            <div class="stat-card"><div class="stat-num">${totalKeys}</div><div class="stat-lbl">Total Keys</div></div>
            <div class="stat-card"><div class="stat-num">${activeKeys}</div><div class="stat-lbl">Active</div></div>
            <div class="stat-card"><div class="stat-num">${requestLogs.length}</div><div class="stat-lbl">Requests</div></div>
            <div class="stat-card"><div class="stat-num">${todayReq}</div><div class="stat-lbl">Today</div></div>
        </div>
        
        <div class="tabs">
            <div class="tab active" onclick="switchTab('gen')">Key Generator</div>
            <div class="tab" onclick="switchTab('keys')">Manage Keys</div>
            <div class="tab" onclick="switchTab('io')">Import/Export</div>
            <div class="tab" onclick="switchTab('custom')">Custom APIs</div>
            <div class="tab" onclick="switchTab('usage')">API Usage</div>
            <div class="tab" onclick="switchTab('logs')">Request Logs</div>
        </div>
        
        <div class="panel active" id="panel-gen">
            <div class="section">
                <h3>Generate New API Key</h3>
                <div class="form-row">
                    <div class="form-grp"><label>Key Name</label><input type="text" id="gkName" placeholder="e.g. PREMIUM_001"></div>
                    <div class="form-grp"><label>Owner</label><input type="text" id="gkOwner" placeholder="Owner name"></div>
                    <div class="form-grp"><label>Request Limit</label><input type="text" id="gkLimit" placeholder="100 or unlimited"></div>
                    <div class="form-grp"><label>Expiry</label><select id="gkExpiry"><option value="LIFETIME">Lifetime (No Expiry)</option><option value="31-12-2026">31 Dec 2026</option><option value="31-12-2027">31 Dec 2027</option><option value="30-06-2026">30 Jun 2026</option></select></div>
                    <div class="form-grp"><label>Type</label><select id="gkType"><option value="premium">Premium</option><option value="demo">Demo</option><option value="test">Test</option></select></div>
                    <div class="form-grp full-w"><label>Scopes</label><div class="cb-wrap" id="scopeCbs">${scb}</div></div>
                    <div class="form-grp full-w"><button class="btn btn-primary" onclick="generateKey()" style="width:100%">Generate Key</button></div>
                </div>
            </div>
        </div>
        
        <div class="panel" id="panel-keys">
            <div class="section">
                <h3>All API Keys</h3>
                <div style="margin-bottom:12px;display:flex;gap:10px">
                    <input type="text" id="keySearch" placeholder="Search keys..." onkeyup="filterKeys()" style="padding:9px 14px;background:var(--bg);border:1px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:12px;font-family:inherit;width:260px">
                    <button class="btn-outline" onclick="resetAllKeys()">Reset All Usage</button>
                </div>
                <div class="tbl-wrap"><table><thead><tr><th>Key</th><th>Owner</th><th>Scopes</th><th>Limit</th><th>Used</th><th>Left</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody id="keyBody">${keyRows}</tbody></table></div>
            </div>
        </div>
        
        <div class="panel" id="panel-io">
            <div class="import-export-box">
                <h3>📤 Export Keys</h3>
                <p style="font-size:11px;color:var(--text3);margin-bottom:10px">Copy this JSON to backup all keys</p>
                <textarea readonly id="exportData" onclick="this.select()">${JSON.stringify(keyStorage, null, 2).replace(/"/g, '&quot;').replace(/</g, '&lt;')}</textarea>
                <button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="copyExport()">Copy to Clipboard</button>
            </div>
            <div class="import-export-box" style="border-color:var(--b)">
                <h3 style="color:var(--b)">📥 Import Keys</h3>
                <p style="font-size:11px;color:var(--text3);margin-bottom:10px">Paste JSON to import keys (merges with existing)</p>
                <textarea id="importData" placeholder="Paste JSON here..."></textarea>
                <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="importKeys()">Import Keys</button>
            </div>
        </div>
        
        <div class="panel" id="panel-custom">
            <div class="section">
                <h3>Custom API Integrations (10 Slots)</h3>
                <div id="customAPIsContainer">${customAPIRows}</div>
            </div>
        </div>
        
        <div class="panel" id="panel-usage">
            <div class="section">
                <h3>API Usage Statistics</h3>
                <p style="font-size:11px;color:var(--text3);margin-bottom:14px">Endpoint-wise request breakdown</p>
                <div class="tbl-wrap"><table><thead><tr><th>Endpoint</th><th>Total Requests</th><th>Success</th><th>Failed</th></tr></thead><tbody>${usageRows}</tbody></table></div>
            </div>
        </div>
        
        <div class="panel" id="panel-logs">
            <div class="section">
                <h3>Request Logs <span style="font-size:10px;color:var(--text3);font-weight:400">(Browser + IP tracked)</span></h3>
                <div style="margin-bottom:12px"><button class="btn-outline" onclick="clearLogs()">Clear All Logs</button></div>
                <div class="logs-box">${logs}</div>
            </div>
        </div>
    </div>
    
    <script>
        const TOKEN='${token}';
        function toast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2200)}
        function switchTab(n){document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));document.getElementById('panel-'+n).classList.add('active');event.target.classList.add('active')}
        
        async function api(url,body){
            const r=await fetch(url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','x-admin-token':TOKEN},body:body?JSON.stringify(body):undefined});
            return await r.json()
        }
        
        async function generateKey(){
            const n=document.getElementById('gkName').value.trim();
            const o=document.getElementById('gkOwner').value.trim();
            const l=document.getElementById('gkLimit').value.trim();
            const e=document.getElementById('gkExpiry').value;
            const t=document.getElementById('gkType').value;
            if(!n||!o){toast('Key name and owner required');return}
            const sc=[];document.querySelectorAll('#scopeCbs input:checked').forEach(c=>sc.push(c.value));
            if(!sc.length){toast('Select at least one scope');return}
            const d=await api('/admin/generate-key',{keyName:n,keyOwner:o,scopes:sc,limit:l||'100',expiryDate:e,keyType:t});
            d.success?(toast('Key Generated: '+n),setTimeout(()=>location.reload(),1200)):toast(d.error||'Error')
        }
        
        async function deleteKey(k){if(!confirm('Delete '+k+'?'))return;const d=await api('/admin/delete-key',{keyName:k});d.success?(toast(d.message),setTimeout(()=>location.reload(),800)):toast(d.error)}
        async function resetKey(k){const d=await api('/admin/reset-key-usage',{keyName:k});d.success?(toast(d.message),setTimeout(()=>location.reload(),800)):toast(d.error)}
        async function resetAllKeys(){if(!confirm('Reset ALL usage?'))return;const d=await api('/admin/keys');if(d.success)for(const k of d.keys)await api('/admin/reset-key-usage',{keyName:k.key});toast('All usage reset');setTimeout(()=>location.reload(),800)}
        async function clearLogs(){if(!confirm('Clear all logs?'))return;await api('/admin/clear-logs');toast('Logs cleared');setTimeout(()=>location.reload(),800)}
        async function logout(){await api('/admin/logout');window.location.href='/admin'}
        function filterKeys(){const s=document.getElementById('keySearch').value.toLowerCase();document.querySelectorAll('#keyBody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(s)?'':'none'})}
        
        // Import/Export
        function copyExport(){
            const ta=document.getElementById('exportData');
            ta.select();document.execCommand('copy');
            toast('Keys copied to clipboard!')
        }
        
        async function importKeys(){
            const raw=document.getElementById('importData').value.trim();
            if(!raw){toast('Paste JSON data first');return}
            try{
                const data=JSON.parse(raw);
                const d=await api('/admin/import-keys',{keys:data});
                d.success?(toast('Imported: '+d.imported+' keys'),setTimeout(()=>location.reload(),1000)):toast(d.error||'Import failed')
            }catch(e){toast('Invalid JSON format!')}
        }
        
        // Custom API editing
        function editCustomAPI(i){
            document.getElementById('customEdit'+i).style.display='block';
            document.getElementById('customRow'+i).querySelector('.custom-api-view').style.display='none';
        }
        function cancelEdit(i){
            document.getElementById('customEdit'+i).style.display='none';
            document.getElementById('customRow'+i).querySelector('.custom-api-view').style.display='flex';
        }
        async function saveCustomAPI(i){
            const data={
                name:document.getElementById('caName'+i).value,
                endpoint:document.getElementById('caEp'+i).value,
                param:document.getElementById('caParam'+i).value,
                example:document.getElementById('caEx'+i).value,
                desc:document.getElementById('caDesc'+i).value,
                realAPI:document.getElementById('caReal'+i).value,
                visible:document.getElementById('caVis'+i).value==='1'
            };
            const d=await api('/admin/custom-api',{slot:i,api:data});
            d.success?(toast('Custom API #'+(i+1)+' saved!'),setTimeout(()=>location.reload(),800)):toast(d.error||'Error')
        }
        async function toggleCustomAPI(i){
            const d=await api('/admin/custom-api',{slot:i,api:{visible:!${JSON.stringify(customAPIs)}[i].visible}});
            d.success?(toast('Toggled!'),setTimeout(()=>location.reload(),600)):toast(d.error||'Error')
        }
    </script>
</body>
</html>`;
}

// ========== EXPRESS MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || 'unknown';
    req.userAgent = req.headers['user-agent'] || 'Unknown';
    next();
});

// ========== PUBLIC ROUTES ==========
app.get('/', (req, res) => res.send(renderPublicHome()));

app.get('/test', (req, res) => {
    res.json({ status: 'BRONX OSINT API v7.0 Operational', credit: '@BRONX_ULTRA', time: getIndiaDateTime(), timezone: 'Asia/Kolkata', endpoints: Object.keys(endpoints).length, custom_apis: customAPIs.filter(a => a.visible).length, total_keys: Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length });
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

// ========== FIXED CUSTOM API ENDPOINT ==========
app.get('/api/custom/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    
    // Find custom API
    const customAPI = customAPIs.find(function(api) {
        return api.endpoint === endpoint && api.visible === true;
    });
    
    if (!customAPI) {
        logRequest(null, 'custom/' + endpoint, 'not-found', 'failed', req.clientIP, req.userAgent);
        return res.status(404).json({ 
            success: false, 
            error: 'Custom endpoint not found: ' + endpoint,
            availableCustomAPIs: customAPIs.filter(function(a) { return a.visible && a.endpoint; }).map(function(a) { return a.endpoint; })
        });
    }
    
    if (!apiKey) {
        logRequest(null, 'custom/' + endpoint, 'no-key', 'failed', req.clientIP, req.userAgent);
        return res.status(401).json({ success: false, error: "API Key Required. Use ?key=YOUR_KEY" });
    }
    
    const kc = checkKeyValid(apiKey);
    if (!kc.valid) {
        logRequest(apiKey, 'custom/' + endpoint, query[customAPI.param], 'failed', req.clientIP, req.userAgent);
        return res.status(403).json({ 
            success: false, 
            error: kc.error,
            expired: kc.expired || false,
            limitExhausted: kc.limitExhausted || false
        });
    }
    
    const keyData = kc.keyData;
    const paramValue = query[customAPI.param];
    
    if (!paramValue) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing parameter: ' + customAPI.param, 
            example: '?key=YOUR_KEY&' + customAPI.param + '=' + customAPI.example,
            customAPIName: customAPI.name,
            customAPIParam: customAPI.param,
            customAPIEndpoint: customAPI.endpoint
        });
    }
    
    try {
        // FIX: Replace {param} with actual value (handles both {param} and {parma} typos)
        var realUrl = customAPI.realAPI;
        realUrl = realUrl.replace(/\{param\}/gi, encodeURIComponent(paramValue));
        realUrl = realUrl.replace(/\{parma\}/gi, encodeURIComponent(paramValue));
        
        console.log('Custom API Call: ' + endpoint + ' | Param: ' + customAPI.param + '=' + paramValue);
        console.log('Real URL: ' + realUrl);
        
        const response = await axios.get(realUrl, { 
            timeout: 30000,
            headers: { 'User-Agent': 'BRONX-OSINT-API/7.0' }
        });
        
        incrementKeyUsage(apiKey);
        logRequest(apiKey, 'custom/' + endpoint, paramValue, 'success', req.clientIP, req.userAgent);
        
        const cleanedData = cleanResponse(response.data);
        cleanedData.api_info = {
            powered_by: "@BRONX_ULTRA",
            endpoint: endpoint,
            type: 'custom',
            key_owner: keyData.name,
            timestamp: getIndiaDateTime()
        };
        
        res.json(cleanedData);
        
    } catch (error) {
        console.error('Custom API Error [' + endpoint + ']: ' + error.message);
        logRequest(apiKey, 'custom/' + endpoint, paramValue, 'error', req.clientIP, req.userAgent);
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            debug_info: {
                endpoint: endpoint,
                param: customAPI.param,
                value: paramValue,
                called_url: realUrl,
                original_api: customAPI.realAPI
            }
        });
    }
});

// Main API endpoint
app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    
    if (!endpoints[endpoint]) return res.status(404).json({ success: false, error: "Not found: "+endpoint, available: Object.keys(endpoints) });
    if (!apiKey) { logRequest(null, endpoint, 'no-key', 'failed', req.clientIP, req.userAgent); return res.status(401).json({ success: false, error: "API Key Required" }); }
    
    const kc = checkKeyValid(apiKey);
    if (!kc.valid) { logRequest(apiKey, endpoint, req.query[endpoints[endpoint].param], 'failed', req.clientIP, req.userAgent); return res.status(403).json({ success: false, error: kc.error, ...(kc.expired && { expired: true }), ...(kc.limitExhausted && { limit_exhausted: true }) }); }
    
    const sc = checkKeyScope(kc.keyData, endpoint);
    if (!sc.valid) { logRequest(apiKey, endpoint, req.query[endpoints[endpoint].param], 'scope-denied', req.clientIP, req.userAgent); return res.status(403).json({ success: false, error: sc.error }); }
    
    const ep = endpoints[endpoint];
    const pv = req.query[ep.param];
    if (!pv) return res.status(400).json({ success: false, error: 'Missing: '+ep.param, example: '?key=KEY&'+ep.param+'='+ep.example });
    
    try {
        const ru = REAL_API_BASE+'/'+endpoint+'?key='+REAL_API_KEY+'&'+ep.param+'='+encodeURIComponent(pv);
        const resp = await axios.get(ru, { timeout: 30000 });
        const uk = incrementKeyUsage(apiKey);
        logRequest(apiKey, endpoint, pv, 'success', req.clientIP, req.userAgent);
        
        const cd = cleanResponse(resp.data);
        cd.api_info = { powered_by: "@BRONX_ULTRA", endpoint, key_owner: kc.keyData.name, key_type: kc.keyData.type, limit: kc.keyData.unlimited ? 'Unlimited' : kc.keyData.limit, used: uk ? uk.used : kc.keyData.used, remaining: kc.keyData.unlimited ? 'Unlimited' : Math.max(0, kc.keyData.limit - (uk ? uk.used : kc.keyData.used)), expiry: kc.keyData.expiryStr || 'LIFETIME', timezone: 'Asia/Kolkata', timestamp: getIndiaDateTime() };
        res.json(cd);
    } catch (e) { logRequest(apiKey, endpoint, pv, 'error', req.clientIP, req.userAgent); if (e.response) return res.status(e.response.status).json(cleanResponse(e.response.data)); res.status(500).json({ success: false, error: e.message }); }
});

// ========== ADMIN ROUTES ==========
app.get('/admin', (req, res) => {
    const token = req.query.token || req.headers['x-admin-token'];
    isAdminAuthenticated(token) ? res.send(renderAdminPanel(token)) : res.send(renderAdminLogin());
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateSessionToken();
        adminSessions[token] = { expiresAt: Date.now() + (30 * 60 * 1000) };
        res.json({ success: true, token, message: 'Authenticated', redirect: '/admin?token=' + token });
    } else res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.post('/admin/logout', (req, res) => { const token = req.headers['x-admin-token'] || req.query.token; if (token) delete adminSessions[token]; res.json({ success: true }); });
app.get('/admin/check-auth', (req, res) => res.json({ authenticated: isAdminAuthenticated(req.query.token || req.headers['x-admin-token']) }));

app.post('/admin/generate-key', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
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

// ========== KEY IMPORT/EXPORT ==========
app.post('/admin/import-keys', (req, res) => {
    if (!isAdminAuthenticated(req.headers['x-admin-token'] || req.query.token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { keys } = req.body;
    if (!keys || typeof keys !== 'object') return res.status(400).json({ success: false, error: 'Invalid keys data. Provide JSON object.' });
    
    let imported = 0;
    let skipped = 0;
    
    Object.entries(keys).forEach(([keyName, keyData]) => {
        if (keyName === 'BRONX_ULTRA_MASTER_2026') { skipped++; return; }
        if (keyStorage[keyName]) { skipped++; return; }
        
        keyStorage[keyName] = {
            name: keyData.name || 'Imported Key',
            scopes: keyData.scopes || ['number'],
            type: keyData.type || 'imported',
            limit: keyData.limit || 100,
            used: keyData.used || 0,
            expiry: keyData.expiryStr && keyData.expiryStr !== 'LIFETIME' ? parseExpiryDate(keyData.expiryStr) : null,
            expiryStr: keyData.expiryStr || 'LIFETIME',
            created: keyData.created || getIndiaDateTime(),
            resetType: 'never',
            unlimited: keyData.unlimited || false,
            hidden: keyData.hidden || false
        };
        imported++;
    });
    
    res.json({ success: true, message: `Imported ${imported} keys, skipped ${skipped}`, imported, skipped });
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
