// api/index.js - BRONX OSINT API v5.0 - PROFESSIONAL DARK THEME
const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = 'bronx';

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
    
    // MASTER OWNER KEY
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
    if (!keyData) {
        return { valid: false, error: '❌ Invalid API Key. Contact @BRONX_ULTRA to purchase.' };
    }
    
    if (keyData.expiry && isKeyExpired(keyData.expiry)) {
        return { 
            valid: false, 
            error: '⏰ Your Key has EXPIRED! Please purchase a new key. Contact @BRONX_ULTRA on Telegram.',
            expired: true,
            expiredDate: keyData.expiryStr
        };
    }
    
    if (!keyData.unlimited && keyData.used >= keyData.limit) {
        return {
            valid: false,
            error: `🛑 Limit Exhausted! You have used ${keyData.used}/${keyData.limit} requests. Contact @BRONX_ULTRA for more.`,
            limitExhausted: true
        };
    }
    
    return { valid: true, keyData };
}

function incrementKeyUsage(apiKey) {
    if (keyStorage[apiKey] && !keyStorage[apiKey].unlimited) {
        keyStorage[apiKey].used++;
    }
    return keyStorage[apiKey];
}

function checkKeyScope(keyData, endpoint) {
    if (keyData.scopes.includes('*')) return { valid: true };
    if (keyData.scopes.includes(endpoint)) return { valid: true };
    return { 
        valid: false, 
        error: `❌ This key cannot access '${endpoint}'. Allowed scopes: ${keyData.scopes.join(', ')}` 
    };
}

function logRequest(key, endpoint, param, status, ip) {
    requestLogs.push({
        timestamp: getIndiaDateTime(),
        key: key ? key.substring(0, 10) + '...' : 'unknown',
        endpoint: endpoint,
        param: param,
        status: status,
        ip: ip || 'unknown'
    });
    
    if (requestLogs.length > 500) {
        requestLogs = requestLogs.slice(-500);
    }
}

// ========== ADMIN AUTH ==========
function generateSessionToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 40; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

function isAdminAuthenticated(token) {
    if (!token || !adminSessions[token]) return false;
    if (Date.now() > adminSessions[token].expiresAt) {
        delete adminSessions[token];
        return false;
    }
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
    { value: 'number', label: '📱 Number Lookup' },
    { value: 'numv2', label: '📱 Number v2' },
    { value: 'adv', label: '📱 Advanced Lookup' },
    { value: 'aadhar', label: '🆔 Aadhar' },
    { value: 'adharfamily', label: '👨‍👩‍👧‍👦 Aadhar Family' },
    { value: 'adharration', label: '📋 Aadhar Ration' },
    { value: 'name', label: '🔍 Name Search' },
    { value: 'upi', label: '💰 UPI' },
    { value: 'ifsc', label: '🏦 IFSC' },
    { value: 'pan', label: '📄 PAN' },
    { value: 'pincode', label: '📍 Pincode' },
    { value: 'ip', label: '🌐 IP Lookup' },
    { value: 'vehicle', label: '🚗 Vehicle' },
    { value: 'rc', label: '📋 RC Details' },
    { value: 'ff', label: '🎮 Free Fire' },
    { value: 'bgmi', label: '🎮 BGMI' },
    { value: 'insta', label: '📸 Instagram' },
    { value: 'git', label: '💻 GitHub' },
    { value: 'tg', label: '📲 Telegram' },
    { value: 'tgidinfo', label: '📲 Telegram ID' },
    { value: 'snap', label: '👻 Snapchat' },
    { value: 'imei', label: '📱 IMEI' },
    { value: 'calltracer', label: '📞 Call Tracer' },
    { value: 'pk', label: '🇵🇰 Pakistan v1' },
    { value: 'pkv2', label: '🇵🇰 Pakistan v2' }
];

// ========== CLEAN RESPONSE ==========
function cleanResponse(data) {
    if (!data) return data;
    let cleaned = JSON.parse(JSON.stringify(data));
    
    function removeFields(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
            obj.forEach(item => removeFields(item));
            return;
        }
        delete obj.by;
        delete obj.channel;
        delete obj.BY;
        delete obj.CHANNEL;
        delete obj.developer;
        Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object') {
                removeFields(obj[key]);
            }
        });
    }
    
    removeFields(cleaned);
    cleaned.by = "@BRONX_ULTRA";
    cleaned.powered_by = "BRONX OSINT API";
    return cleaned;
}

// ========== PROFESSIONAL DARK THEME - PUBLIC HOME ==========
function renderPublicHome() {
    const visibleAPIs = customAPIs.filter(a => a.visible && a.endpoint);
    
    // Group by category
    const categories = {};
    Object.entries(endpoints).forEach(([name, ep]) => {
        if (!categories[ep.category]) categories[ep.category] = [];
        categories[ep.category].push({name, ...ep});
    });
    
    let endpointSections = '';
    
    // Phone Intelligence
    if (categories['Phone Intelligence']) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <span class="category-icon">📱</span>
                <h3>Phone Intelligence</h3>
                <span class="category-badge">${categories['Phone Intelligence'].length} APIs</span>
            </div>
            <div class="endpoint-grid">
                ${categories['Phone Intelligence'].map(ep => `
                <div class="endpoint-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-top">
                        <span class="ep-method get">GET</span>
                        <span class="ep-icon">${ep.icon}</span>
                    </div>
                    <h4 class="ep-name">${ep.name}</h4>
                    <p class="ep-desc">${ep.desc}</p>
                    <code class="ep-path">/api/key-bronx/${ep.name}</code>
                    <div class="ep-param"><span>${ep.param}</span>=<span>${ep.example}</span></div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    // Financial
    if (categories['Financial']) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <span class="category-icon">💰</span>
                <h3>Financial</h3>
                <span class="category-badge">${categories['Financial'].length} APIs</span>
            </div>
            <div class="endpoint-grid">
                ${categories['Financial'].map(ep => `
                <div class="endpoint-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-top">
                        <span class="ep-method get">GET</span>
                        <span class="ep-icon">${ep.icon}</span>
                    </div>
                    <h4 class="ep-name">${ep.name}</h4>
                    <p class="ep-desc">${ep.desc}</p>
                    <code class="ep-path">/api/key-bronx/${ep.name}</code>
                    <div class="ep-param"><span>${ep.param}</span>=<span>${ep.example}</span></div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    // Location
    if (categories['Location']) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <span class="category-icon">📍</span>
                <h3>Location</h3>
                <span class="category-badge">${categories['Location'].length} APIs</span>
            </div>
            <div class="endpoint-grid">
                ${categories['Location'].map(ep => `
                <div class="endpoint-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-top">
                        <span class="ep-method get">GET</span>
                        <span class="ep-icon">${ep.icon}</span>
                    </div>
                    <h4 class="ep-name">${ep.name}</h4>
                    <p class="ep-desc">${ep.desc}</p>
                    <code class="ep-path">/api/key-bronx/${ep.name}</code>
                    <div class="ep-param"><span>${ep.param}</span>=<span>${ep.example}</span></div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    // Vehicle
    if (categories['Vehicle']) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <span class="category-icon">🚗</span>
                <h3>Vehicle</h3>
                <span class="category-badge">${categories['Vehicle'].length} APIs</span>
            </div>
            <div class="endpoint-grid">
                ${categories['Vehicle'].map(ep => `
                <div class="endpoint-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-top">
                        <span class="ep-method get">GET</span>
                        <span class="ep-icon">${ep.icon}</span>
                    </div>
                    <h4 class="ep-name">${ep.name}</h4>
                    <p class="ep-desc">${ep.desc}</p>
                    <code class="ep-path">/api/key-bronx/${ep.name}</code>
                    <div class="ep-param"><span>${ep.param}</span>=<span>${ep.example}</span></div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    // Gaming
    if (categories['Gaming']) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <span class="category-icon">🎮</span>
                <h3>Gaming</h3>
                <span class="category-badge">${categories['Gaming'].length} APIs</span>
            </div>
            <div class="endpoint-grid">
                ${categories['Gaming'].map(ep => `
                <div class="endpoint-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-top">
                        <span class="ep-method get">GET</span>
                        <span class="ep-icon">${ep.icon}</span>
                    </div>
                    <h4 class="ep-name">${ep.name}</h4>
                    <p class="ep-desc">${ep.desc}</p>
                    <code class="ep-path">/api/key-bronx/${ep.name}</code>
                    <div class="ep-param"><span>${ep.param}</span>=<span>${ep.example}</span></div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    // Social
    if (categories['Social']) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <span class="category-icon">🌐</span>
                <h3>Social Intelligence</h3>
                <span class="category-badge">${categories['Social'].length} APIs</span>
            </div>
            <div class="endpoint-grid">
                ${categories['Social'].map(ep => `
                <div class="endpoint-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-top">
                        <span class="ep-method get">GET</span>
                        <span class="ep-icon">${ep.icon}</span>
                    </div>
                    <h4 class="ep-name">${ep.name}</h4>
                    <p class="ep-desc">${ep.desc}</p>
                    <code class="ep-path">/api/key-bronx/${ep.name}</code>
                    <div class="ep-param"><span>${ep.param}</span>=<span>${ep.example}</span></div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    // Pakistan
    if (categories['Pakistan']) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <span class="category-icon">🇵🇰</span>
                <h3>Pakistan</h3>
                <span class="category-badge">${categories['Pakistan'].length} APIs</span>
            </div>
            <div class="endpoint-grid">
                ${categories['Pakistan'].map(ep => `
                <div class="endpoint-card" onclick="copyUrl('${ep.name}','${ep.param}','${ep.example}')">
                    <div class="ep-top">
                        <span class="ep-method get">GET</span>
                        <span class="ep-icon">${ep.icon}</span>
                    </div>
                    <h4 class="ep-name">${ep.name}</h4>
                    <p class="ep-desc">${ep.desc}</p>
                    <code class="ep-path">/api/key-bronx/${ep.name}</code>
                    <div class="ep-param"><span>${ep.param}</span>=<span>${ep.example}</span></div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    // Custom APIs
    if (visibleAPIs.length > 0) {
        endpointSections += `
        <div class="category-section">
            <div class="category-header">
                <span class="category-icon">🔧</span>
                <h3>Custom Integrations</h3>
                <span class="category-badge">${visibleAPIs.length} APIs</span>
            </div>
            <div class="endpoint-grid">
                ${visibleAPIs.map(api => `
                <div class="endpoint-card custom" onclick="copyUrlCustom('${api.endpoint}','${api.param}','${api.example}')">
                    <div class="ep-top">
                        <span class="ep-method custom-m">CUSTOM</span>
                        <span class="ep-icon">🔧</span>
                    </div>
                    <h4 class="ep-name">${api.name}</h4>
                    <p class="ep-desc">${api.desc}</p>
                    <code class="ep-path">/api/custom/${api.endpoint}</code>
                    <div class="ep-param"><span>${api.param}</span>=<span>${api.example}</span></div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX OSINT — Intelligence API</title>
    <style>
        :root {
            --bg-primary: #0d0d0d;
            --bg-secondary: #141414;
            --bg-card: #1a1a1a;
            --bg-card-hover: #222222;
            --border: #2a2a2a;
            --border-hover: #3a3a3a;
            --text-primary: #e0e0e0;
            --text-secondary: #999;
            --text-muted: #666;
            --accent: #00e676;
            --accent-dim: #00c853;
            --accent-glow: rgba(0, 230, 118, 0.15);
            --danger: #ff5252;
            --warning: #ffb74d;
            --info: #448aff;
            --header-bg: #0a0a0a;
            --overlay: rgba(0,0,0,0.4);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            min-height: 100vh;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        
        /* ===== SCROLLBAR ===== */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg-primary); }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
        
        /* ===== HERO HEADER ===== */
        .hero {
            position: relative;
            width: 100%;
            background: var(--header-bg);
            border-bottom: 1px solid var(--border);
            overflow: hidden;
        }
        
        .hero-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
            z-index: 1;
        }
        
        .hero-bg-pattern {
            position: absolute;
            inset: 0;
            background-image: 
                radial-gradient(circle at 20% 50%, rgba(0,230,118,0.03) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(68,138,255,0.03) 0%, transparent 50%);
            z-index: 0;
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 900px;
            margin: 0 auto;
            padding: 50px 30px 40px;
            text-align: center;
        }
        
        .hero-avatar {
            width: 110px;
            height: 110px;
            border-radius: 50%;
            border: 3px solid var(--accent);
            box-shadow: 0 0 40px var(--accent-glow), 0 0 80px rgba(0,230,118,0.08);
            margin: 0 auto 20px;
            display: block;
            object-fit: cover;
            background: #1a1a1a;
            transition: all 0.3s ease;
        }
        
        .hero-avatar:hover {
            box-shadow: 0 0 60px rgba(0,230,118,0.25), 0 0 100px rgba(0,230,118,0.1);
            transform: scale(1.03);
        }
        
        .hero-title {
            font-size: 38px;
            font-weight: 700;
            color: #fff;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
        }
        
        .hero-subtitle {
            font-size: 16px;
            color: var(--accent);
            font-weight: 500;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
        }
        
        .hero-tags {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .hero-tag {
            padding: 7px 18px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            border: 1px solid;
            background: transparent;
            transition: all 0.2s;
        }
        
        .tag-secure { color: var(--accent); border-color: rgba(0,230,118,0.4); background: rgba(0,230,118,0.05); }
        .tag-realtime { color: var(--info); border-color: rgba(68,138,255,0.4); background: rgba(68,138,255,0.05); }
        .tag-premium { color: var(--warning); border-color: rgba(255,183,77,0.4); background: rgba(255,183,77,0.05); }
        
        /* ===== CONTAINER ===== */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 25px;
        }
        
        /* ===== STATS BAR ===== */
        .stats-bar {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            padding: 25px 20px;
            margin: -30px auto 30px;
            max-width: 700px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            position: relative;
            z-index: 3;
        }
        
        .stat-item {
            text-align: center;
            min-width: 90px;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--accent);
            letter-spacing: -0.5px;
        }
        
        .stat-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--text-secondary);
            margin-top: 3px;
        }
        
        .stat-divider {
            width: 1px;
            background: var(--border);
        }
        
        /* ===== API TESTER ===== */
        .tester-section {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 28px 30px;
            margin-bottom: 35px;
        }
        
        .tester-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .tester-header h3 {
            font-size: 18px;
            font-weight: 600;
            color: #fff;
        }
        
        .tester-dot {
            width: 8px;
            height: 8px;
            background: var(--accent);
            border-radius: 50%;
            box-shadow: 0 0 10px var(--accent-glow);
            animation: pulse-dot 2s infinite;
        }
        
        @keyframes pulse-dot {
            0%, 100% { opacity: 1; box-shadow: 0 0 10px var(--accent-glow); }
            50% { opacity: 0.5; box-shadow: 0 0 20px var(--accent-glow); }
        }
        
        .tester-form {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .tester-form select,
        .tester-form input {
            flex: 1;
            min-width: 180px;
            padding: 12px 16px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-primary);
            font-size: 13px;
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            transition: all 0.2s;
            outline: none;
        }
        
        .tester-form select:focus,
        .tester-form input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(0,230,118,0.08);
        }
        
        .btn-execute {
            padding: 12px 28px;
            background: var(--accent);
            color: #000;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            letter-spacing: 0.5px;
            transition: all 0.2s;
            white-space: nowrap;
            font-family: inherit;
        }
        
        .btn-execute:hover {
            background: var(--accent-dim);
            box-shadow: 0 0 25px var(--accent-glow);
        }
        
        .result-box {
            margin-top: 20px;
            background: #0a0a0a;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            max-height: 350px;
            overflow: auto;
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 12px;
            display: none;
            white-space: pre-wrap;
            color: var(--accent);
        }
        
        /* ===== CATEGORY ===== */
        .category-section {
            margin-bottom: 35px;
        }
        
        .category-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border);
        }
        
        .category-icon {
            font-size: 20px;
        }
        
        .category-header h3 {
            font-size: 17px;
            font-weight: 600;
            color: #fff;
            letter-spacing: -0.3px;
        }
        
        .category-badge {
            margin-left: auto;
            padding: 4px 12px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 20px;
            font-size: 10px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* ===== ENDPOINT GRID ===== */
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 14px;
        }
        
        .endpoint-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 18px 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .endpoint-card:hover {
            background: var(--bg-card-hover);
            border-color: var(--accent);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            transform: translateY(-2px);
        }
        
        .endpoint-card.custom:hover {
            border-color: var(--warning);
        }
        
        .ep-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .ep-method {
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        
        .ep-method.get {
            background: rgba(0,230,118,0.1);
            color: var(--accent);
            border: 1px solid rgba(0,230,118,0.3);
        }
        
        .ep-method.custom-m {
            background: rgba(255,183,77,0.1);
            color: var(--warning);
            border: 1px solid rgba(255,183,77,0.3);
        }
        
        .ep-icon { font-size: 18px; }
        
        .ep-name {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 4px;
            letter-spacing: -0.2px;
        }
        
        .ep-desc {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 10px;
        }
        
        .ep-path {
            display: block;
            font-size: 11px;
            color: var(--text-muted);
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            margin-bottom: 8px;
            word-break: break-all;
        }
        
        .ep-param {
            font-size: 11px;
            color: var(--info);
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        }
        
        .ep-param span:first-child { color: var(--warning); }
        .ep-param span:last-child { color: var(--text-muted); }
        
        /* ===== FOOTER ===== */
        .footer {
            text-align: center;
            padding: 40px 20px;
            border-top: 1px solid var(--border);
            margin-top: 20px;
        }
        
        .footer-brand {
            font-size: 16px;
            font-weight: 700;
            color: var(--accent);
            letter-spacing: 0.5px;
        }
        
        .footer-info {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 6px;
        }
        
        .footer-link {
            color: var(--warning);
            text-decoration: none;
            transition: color 0.2s;
        }
        
        .footer-link:hover { color: var(--accent); }
        
        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
            .hero-title { font-size: 26px; }
            .hero-subtitle { font-size: 14px; }
            .hero-avatar { width: 85px; height: 85px; }
            .stats-bar { gap: 15px; padding: 18px 12px; margin: -20px 15px 25px; }
            .stat-value { font-size: 22px; }
            .stat-label { font-size: 9px; }
            .endpoint-grid { grid-template-columns: 1fr; }
            .tester-form select, .tester-form input { min-width: 100%; }
        }
    </style>
</head>
<body>
    <!-- ===== HERO HEADER ===== -->
    <header class="hero">
        <div class="hero-bg-pattern"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <!-- BRONX PROFILE PHOTO - Replace src with your image URL -->
            <img 
                src="https://i.ibb.co/YOUR-BRONX-PHOTO.jpg" 
                alt="BRONX_ULTRA" 
                class="hero-avatar"
                onerror="this.style.display='none'"
            >
            <h1 class="hero-title">WELCOME TO BRONX OSINT</h1>
            <p class="hero-subtitle">Premium Intelligence & Investigation API</p>
            <div class="hero-tags">
                <span class="hero-tag tag-secure">🔒 SECURE</span>
                <span class="hero-tag tag-realtime">⚡ REAL-TIME</span>
                <span class="hero-tag tag-premium">💎 PREMIUM</span>
            </div>
        </div>
    </header>
    
    <div class="container">
        <!-- ===== STATS ===== -->
        <div class="stats-bar">
            <div class="stat-item">
                <div class="stat-value">${Object.keys(endpoints).length + visibleAPIs.length}</div>
                <div class="stat-label">Endpoints</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
                <div class="stat-value">${Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length}</div>
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
        
        <!-- ===== API TESTER ===== -->
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
                <input type="text" id="apiKey" placeholder="API Key">
                <input type="text" id="paramVal" placeholder="Parameter Value">
                <button class="btn-execute" onclick="testAPI()">Execute →</button>
            </div>
            <div class="result-box" id="result"></div>
        </div>
        
        <!-- ===== ENDPOINTS ===== -->
        ${endpointSections}
    </div>
    
    <!-- ===== FOOTER ===== -->
    <footer class="footer">
        <p class="footer-brand">BRONX OSINT</p>
        <p class="footer-info">Powered by <strong>@BRONX_ULTRA</strong> · India Timezone (IST)</p>
        <p class="footer-info" style="margin-top:4px;">
            <a href="/admin" class="footer-link">Admin Panel</a> · 
            <a href="/test" class="footer-link">API Status</a>
        </p>
    </footer>
    
    <script>
        const endpoints = ${JSON.stringify(endpoints)};
        
        function copyUrl(ep, param, ex) {
            navigator.clipboard.writeText(location.origin + '/api/key-bronx/' + ep + '?key=YOUR_KEY&' + param + '=' + ex);
            showToast('URL Copied: /' + ep);
        }
        
        function copyUrlCustom(ep, param, ex) {
            navigator.clipboard.writeText(location.origin + '/api/custom/' + ep + '?key=YOUR_KEY&' + param + '=' + ex);
            showToast('Custom URL Copied');
        }
        
        function showToast(msg) {
            let t = document.getElementById('toast');
            if (!t) {
                t = document.createElement('div');
                t.id = 'toast';
                t.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#1a1a1a;color:#00e676;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;border:1px solid #00e676;z-index:9999;transition:all 0.3s;opacity:0;box-shadow:0 4px 20px rgba(0,0,0,0.5)';
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.style.opacity = '1';
            clearTimeout(t._timeout);
            t._timeout = setTimeout(() => { t.style.opacity = '0'; }, 2000);
        }
        
        async function testAPI() {
            const s = document.getElementById('epSelect');
            const o = s.options[s.selectedIndex];
            const isC = o.dataset.custom === '1';
            const k = document.getElementById('apiKey').value;
            const v = document.getElementById('paramVal').value;
            const r = document.getElementById('result');
            
            if (!k || !v || !s.value) {
                showToast('Please fill all fields');
                return;
            }
            
            let url;
            if (isC) {
                url = '/api/custom/' + o.dataset.ep + '?key=' + k + '&' + o.dataset.param + '=' + v;
            } else {
                const ep = s.value;
                url = '/api/key-bronx/' + ep + '?key=' + k + '&' + endpoints[ep].param + '=' + v;
            }
            
            r.style.display = 'block';
            r.textContent = 'Executing request...';
            r.style.color = '#999';
            
            try {
                const re = await fetch(url);
                const d = await re.json();
                r.textContent = JSON.stringify(d, null, 2);
                r.style.color = '#00e676';
            } catch (e) {
                r.textContent = 'Error: ' + e.message;
                r.style.color = '#ff5252';
            }
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
    <title>BRONX — Admin Authentication</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{
            background:#0d0d0d;min-height:100vh;display:flex;justify-content:center;align-items:center;
            font-family:'Inter',-apple-system,sans-serif;
        }
        .login-box{
            background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;
            padding:45px 40px;width:380px;box-shadow:0 8px 40px rgba(0,0,0,0.5);
        }
        .login-box .icon{
            width:50px;height:50px;background:rgba(0,230,118,0.1);border-radius:50%;
            display:flex;align-items:center;justify-content:center;margin:0 auto 20px;
            font-size:24px;
        }
        .login-box h2{
            text-align:center;color:#fff;font-size:22px;font-weight:700;
            letter-spacing:-0.5px;margin-bottom:5px;
        }
        .login-box .subtitle{
            text-align:center;color:#666;font-size:12px;margin-bottom:30px;
            letter-spacing:0.5px;
        }
        .form-group{margin-bottom:18px}
        .form-group label{
            display:block;color:#999;font-size:11px;text-transform:uppercase;
            letter-spacing:1px;margin-bottom:7px;font-weight:600;
        }
        .form-group input{
            width:100%;padding:12px 16px;background:#0d0d0d;border:1px solid #2a2a2a;
            border-radius:8px;color:#e0e0e0;font-size:14px;font-family:inherit;
            transition:all 0.2s;outline:none;
        }
        .form-group input:focus{border-color:#00e676;box-shadow:0 0 0 3px rgba(0,230,118,0.08)}
        .btn-login{
            width:100%;padding:13px;background:#00e676;color:#000;border:none;
            border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;
            letter-spacing:0.5px;transition:all 0.2s;font-family:inherit;margin-top:5px;
        }
        .btn-login:hover{background:#00c853;box-shadow:0 0 30px rgba(0,230,118,0.2)}
        .error{color:#ff5252;text-align:center;margin-top:15px;font-size:13px;display:none}
        .back-link{text-align:center;margin-top:20px}
        .back-link a{color:#666;text-decoration:none;font-size:12px;transition:color 0.2s}
        .back-link a:hover{color:#00e676}
    </style>
</head>
<body>
    <div class="login-box">
        <div class="icon">🛡️</div>
        <h2>Admin Access</h2>
        <p class="subtitle">BRONX OSINT Control Panel</p>
        <div class="form-group">
            <label>Username</label>
            <input type="text" id="username" placeholder="Enter username" autocomplete="off">
        </div>
        <div class="form-group">
            <label>Password</label>
            <input type="password" id="password" placeholder="Enter password">
        </div>
        <button class="btn-login" onclick="login()">Authenticate</button>
        <div class="error" id="errorMsg"></div>
        <div class="back-link"><a href="/">← Back to Home</a></div>
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
                    e.style.display='block';e.style.color='#00e676';e.textContent=d.message;
                    setTimeout(()=>{window.location.href=d.redirect},800);
                }else{
                    e.style.display='block';e.style.color='#ff5252';e.textContent=d.error;
                }
            }catch(err){e.style.display='block';e.style.color='#ff5252';e.textContent='Connection error'}
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
    
    let keyRows = allKeys.map(k => {
        let status = 'Active', sc = 's-green';
        if (k.hidden) { status = 'Master'; sc = 's-purple'; }
        else if (k.isExpired) { status = 'Expired'; sc = 's-red'; }
        else if (k.isExhausted) { status = 'Limit'; sc = 's-orange'; }
        
        const dk = k.key.length > 30 ? k.key.substring(0,27)+'...' : k.key;
        const sd = k.scopes.includes('*') ? '<span class="scope-tag">ALL</span>' : k.scopes.slice(0,5).map(s => '<span class="scope-tag">'+s+'</span>').join('') + (k.scopes.length>5?' <span class="scope-tag">+'+ (k.scopes.length-5) +'</span>':'');
        
        return '<tr>'+
            '<td><code style="color:#00e676;font-size:11px" title="'+k.key+'">'+dk+'</code></td>'+
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
    
    let logs = requestLogs.slice(-30).reverse().map(l => {
        let sc = l.status==='success'?'s-green':(l.status==='failed'?'s-red':'s-orange');
        return '<div class="log-row"><span class="log-time">'+l.timestamp+'</span><span class="log-key">'+l.key+'</span><code>'+l.endpoint+'</code><span class="'+sc+'">'+l.status+'</span></div>';
    }).join('') || '<p style="color:#666;text-align:center;padding:20px">No requests logged</p>';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX — Administration</title>
    <style>
        :root{--bg:#0d0d0d;--card:#1a1a1a;--border:#2a2a2a;--text:#e0e0e0;--g:#00e676;--g-dim:#00c853;--r:#ff5252;--o:#ffb74d;--b:#448aff;--purple:#b388ff}
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:var(--bg);color:var(--text);font-family:'Inter',-apple-system,sans-serif;min-height:100vh}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        
        .topbar{
            background:var(--card);border-bottom:1px solid var(--border);padding:14px 28px;
            display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;
        }
        .topbar h1{font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.5px}
        .topbar h1 span{color:var(--g)}
        .topbar-right{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .topbar-time{font-size:11px;color:#666;font-family:'SF Mono',monospace}
        
        .container{max-width:1350px;margin:0 auto;padding:22px}
        
        .stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
        .stat-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px;text-align:center}
        .stat-num{font-size:36px;font-weight:700;color:var(--g)}
        .stat-lbl{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#888;margin-top:4px}
        
        .tabs{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap}
        .tab{
            padding:9px 20px;background:var(--card);border:1px solid var(--border);border-radius:6px;
            color:#888;cursor:pointer;font-size:13px;font-weight:600;letter-spacing:0.5px;transition:all 0.2s;
        }
        .tab.active{border-color:var(--g);color:var(--g);background:rgba(0,230,118,0.05)}
        .tab:hover{border-color:#444;color:#ccc}
        .panel{display:none}
        .panel.active{display:block}
        
        .section{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:24px;margin-bottom:20px}
        .section h3{font-size:16px;font-weight:600;color:#fff;margin-bottom:18px}
        
        .form-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
        .form-grp label{display:block;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:600}
        .form-grp input,.form-grp select{
            width:100%;padding:10px 14px;background:var(--bg);border:1px solid var(--border);
            border-radius:6px;color:var(--text);font-size:13px;font-family:inherit;outline:none;transition:all 0.2s;
        }
        .form-grp input:focus,.form-grp select:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(0,230,118,0.06)}
        .full-w{grid-column:1/-1}
        
        .cb-wrap{display:flex;flex-wrap:wrap;gap:6px;max-height:160px;overflow:auto;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:6px}
        .cb-label{display:flex;align-items:center;gap:5px;font-size:11px;color:#aaa;cursor:pointer;padding:3px 8px;border-radius:4px;transition:all 0.15s}
        .cb-label:hover{background:rgba(255,255,255,0.04)}
        .cb-label input{accent-color:var(--g)}
        
        .btn{padding:10px 22px;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer;border:none;letter-spacing:0.5px;transition:all 0.2s;font-family:inherit}
        .btn-primary{background:var(--g);color:#000}
        .btn-primary:hover{background:var(--g-dim)}
        .btn-xs{padding:4px 10px;font-size:10px;border-radius:4px;border:1px solid;cursor:pointer;font-weight:600}
        .btn-info{background:rgba(68,138,255,0.1);color:var(--b);border-color:rgba(68,138,255,0.3)}
        .btn-info:hover{background:rgba(68,138,255,0.2)}
        .btn-danger{background:rgba(255,82,82,0.1);color:var(--r);border-color:rgba(255,82,82,0.3)}
        .btn-danger:hover{background:rgba(255,82,82,0.2)}
        .btn-outline{padding:7px 16px;font-size:11px;background:transparent;border:1px solid var(--border);color:#aaa;border-radius:6px}
        .btn-outline:hover{border-color:var(--g);color:var(--g)}
        
        .tbl-wrap{max-height:420px;overflow:auto;border-radius:8px;border:1px solid var(--border)}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:var(--bg);color:#999;padding:10px 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-size:10px;position:sticky;top:0;z-index:10;border-bottom:2px solid var(--border)}
        td{padding:9px 8px;border-bottom:1px solid rgba(255,255,255,0.04)}
        tr:hover{background:rgba(255,255,255,0.02)}
        
        .status-dot{padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:0.5px}
        .s-green{background:rgba(0,230,118,0.1);color:var(--g)}
        .s-red{background:rgba(255,82,82,0.1);color:var(--r)}
        .s-orange{background:rgba(255,183,77,0.1);color:var(--o)}
        .s-purple{background:rgba(179,136,255,0.1);color:var(--purple)}
        
        .scope-tag{display:inline-block;padding:1px 6px;background:rgba(0,230,118,0.08);border:1px solid rgba(0,230,118,0.2);border-radius:8px;font-size:9px;margin:1px;color:var(--g)}
        
        .logs-box{max-height:380px;overflow:auto;background:var(--bg);border-radius:8px;padding:14px;font-size:11px;font-family:'SF Mono',monospace}
        .log-row{display:flex;gap:12px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.03);flex-wrap:wrap;align-items:center}
        .log-time{color:#555;min-width:130px}
        .log-key{color:var(--g)}
        
        .toast{
            position:fixed;bottom:24px;right:24px;background:var(--card);color:var(--g);
            padding:12px 22px;border-radius:8px;font-size:13px;font-weight:600;
            border:1px solid var(--g);z-index:9999;opacity:0;transition:opacity 0.3s;
            box-shadow:0 4px 20px rgba(0,0,0,0.5);
        }
        
        @media(max-width:768px){
            .stat-row{grid-template-columns:repeat(2,1fr)}
        }
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
            <div class="tab" onclick="switchTab('custom')">Custom APIs</div>
            <div class="tab" onclick="switchTab('logs')">Logs</div>
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
                    <input type="text" id="keySearch" placeholder="Search keys..." onkeyup="filterKeys()" style="padding:9px 14px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;font-family:inherit;width:260px">
                    <button class="btn-outline" onclick="resetAllKeys()">Reset All Usage</button>
                </div>
                <div class="tbl-wrap"><table><thead><tr><th>Key</th><th>Owner</th><th>Scopes</th><th>Limit</th><th>Used</th><th>Left</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody id="keyBody">${keyRows}</tbody></table></div>
            </div>
        </div>
        
        <div class="panel" id="panel-custom">
            <div class="section">
                <h3>Custom API Integrations (10 Slots)</h3>
                ${customAPIs.map((a,i) => '<div style="padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div style="display:flex;gap:10px;align-items:center"><b style="color:var(--g)">#'+a.id+'</b> <span>'+(a.name||'Empty')+'</span> '+(a.endpoint?'<code style="color:#aaa">/'+a.endpoint+'</code>':'')+' <span style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;'+(a.visible?'background:rgba(0,230,118,0.1);color:#00e676':'background:rgba(255,82,82,0.1);color:#ff5252')+'">'+(a.visible?'VISIBLE':'HIDDEN')+'</span></div><span style="color:#666;font-size:10px">param: '+(a.param||'—')+'</span></div>').join('')}
                <p style="color:#555;font-size:10px;margin-top:10px">Edit via POST /admin/custom-api with slot & api data</p>
            </div>
        </div>
        
        <div class="panel" id="panel-logs">
            <div class="section">
                <h3>Request Logs</h3>
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
    </script>
</body>
</html>`;
}

// ========== EXPRESS MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    req.clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || 'unknown';
    next();
});

// ========== PUBLIC ROUTES ==========
app.get('/', (req, res) => res.send(renderPublicHome()));
app.get('/test', (req, res) => {
    res.json({ 
        status: 'BRONX OSINT API Operational', 
        credit: '@BRONX_ULTRA', 
        time: getIndiaDateTime(),
        timezone: 'Asia/Kolkata',
        endpoints: Object.keys(endpoints).length,
        custom_apis: customAPIs.filter(a => a.visible).length
    });
});

app.get('/key-info', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) return res.status(404).json({ success: false, error: "Key not found" });
    const now = getIndiaTime();
    const isExpired = keyData.expiry && now > keyData.expiry;
    const isExhausted = !keyData.unlimited && keyData.used >= keyData.limit;
    res.json({
        success: true,
        key_masked: apiKey.substring(0, 6) + '****' + apiKey.substring(apiKey.length - 4),
        owner: keyData.name, type: keyData.type, scopes: keyData.scopes,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit, used: keyData.used,
        remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used),
        expiry: keyData.expiryStr || 'LIFETIME', expired: isExpired, exhausted: isExhausted,
        status: isExpired ? 'expired' : (isExhausted ? 'exhausted' : 'active'),
        created: keyData.created, timezone: 'Asia/Kolkata', current_time: getIndiaDateTime()
    });
});

app.get('/quota', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) return res.status(404).json({ success: false, error: "Key not found" });
    const remaining = keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used);
    res.json({ success: true, key_masked: apiKey.substring(0, 6) + '****', owner: keyData.name, limit: keyData.unlimited ? 'Unlimited' : keyData.limit, used: keyData.used, remaining, expiry: keyData.expiryStr || 'LIFETIME', timezone: 'Asia/Kolkata' });
});

app.get('/api/custom/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    const customAPI = customAPIs.find(api => api.endpoint === endpoint && api.visible);
    if (!customAPI) return res.status(404).json({ success: false, error: `Custom endpoint not found: ${endpoint}` });
    if (!apiKey) { logRequest(null, `custom/${endpoint}`, 'no-key', 'failed', req.clientIP); return res.status(401).json({ success: false, error: "API Key Required" }); }
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) { logRequest(apiKey, `custom/${endpoint}`, query[customAPI.param], 'failed', req.clientIP); return res.status(403).json({ success: false, error: keyCheck.error, ...(keyCheck.expired && { expired: true }), ...(keyCheck.limitExhausted && { limit_exhausted: true }) }); }
    const keyData = keyCheck.keyData;
    const paramValue = query[customAPI.param];
    if (!paramValue) return res.status(400).json({ success: false, error: `Missing parameter: ${customAPI.param}`, example: `?key=KEY&${customAPI.param}=${customAPI.example}` });
    try {
        const realUrl = customAPI.realAPI.replace('{param}', encodeURIComponent(paramValue));
        const response = await axios.get(realUrl, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        logRequest(apiKey, `custom/${endpoint}`, paramValue, 'success', req.clientIP);
        const cleanedData = cleanResponse(response.data);
        cleanedData.api_info = { powered_by: "@BRONX_ULTRA", endpoint, type: 'custom', key_owner: keyData.name, timestamp: getIndiaDateTime() };
        res.json(cleanedData);
    } catch (error) { logRequest(apiKey, `custom/${endpoint}`, paramValue, 'error', req.clientIP); res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    if (!endpoints[endpoint]) return res.status(404).json({ success: false, error: `Endpoint not found: ${endpoint}`, available: Object.keys(endpoints) });
    if (!apiKey) { logRequest(null, endpoint, 'no-key', 'failed', req.clientIP); return res.status(401).json({ success: false, error: "API Key Required" }); }
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) { logRequest(apiKey, endpoint, query[endpoints[endpoint].param], 'failed', req.clientIP); return res.status(403).json({ success: false, error: keyCheck.error, ...(keyCheck.expired && { expired: true }), ...(keyCheck.limitExhausted && { limit_exhausted: true }) }); }
    const keyData = keyCheck.keyData;
    const scopeCheck = checkKeyScope(keyData, endpoint);
    if (!scopeCheck.valid) { logRequest(apiKey, endpoint, query[endpoints[endpoint].param], 'scope-denied', req.clientIP); return res.status(403).json({ success: false, error: scopeCheck.error }); }
    const ep = endpoints[endpoint];
    const paramValue = query[ep.param];
    if (!paramValue) return res.status(400).json({ success: false, error: `Missing parameter: ${ep.param}`, example: `?key=KEY&${ep.param}=${ep.example}` });
    try {
        const realUrl = `${REAL_API_BASE}/${endpoint}?key=${REAL_API_KEY}&${ep.param}=${encodeURIComponent(paramValue)}`;
        const response = await axios.get(realUrl, { timeout: 30000 });
        const updatedKey = incrementKeyUsage(apiKey);
        logRequest(apiKey, endpoint, paramValue, 'success', req.clientIP);
        const cleanedData = cleanResponse(response.data);
        cleanedData.api_info = { powered_by: "@BRONX_ULTRA", endpoint, key_owner: keyData.name, key_type: keyData.type, limit: keyData.unlimited ? 'Unlimited' : keyData.limit, used: updatedKey ? updatedKey.used : keyData.used, remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - (updatedKey ? updatedKey.used : keyData.used)), expiry: keyData.expiryStr || 'LIFETIME', timezone: 'Asia/Kolkata', timestamp: getIndiaDateTime() };
        res.json(cleanedData);
    } catch (error) { logRequest(apiKey, endpoint, paramValue, 'error', req.clientIP); if (error.response) return res.status(error.response.status).json(cleanResponse(error.response.data)); res.status(500).json({ success: false, error: error.message }); }
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
        res.json({ success: true, token, message: 'Authenticated successfully', redirect: '/admin?token=' + token });
    } else { res.status(401).json({ success: false, error: 'Invalid credentials' }); }
});

app.post('/admin/logout', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token) delete adminSessions[token];
    res.json({ success: true, message: 'Logged out' });
});

app.get('/admin/check-auth', (req, res) => {
    const token = req.query.token || req.headers['x-admin-token'];
    res.json({ authenticated: isAdminAuthenticated(token) });
});

app.post('/admin/generate-key', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { keyName, keyOwner, scopes, limit, expiryDate, keyType } = req.body;
    if (!keyName || !keyOwner || !scopes || scopes.length === 0) return res.status(400).json({ success: false, error: 'Missing required fields' });
    if (keyStorage[keyName]) return res.status(400).json({ success: false, error: 'Key already exists' });
    const isUnlimited = limit === 'unlimited' || parseInt(limit) >= 999999;
    keyStorage[keyName] = { name: keyOwner, scopes, type: keyType || 'premium', limit: isUnlimited ? 999999 : parseInt(limit) || 100, used: 0, expiry: expiryDate && expiryDate !== 'LIFETIME' ? parseExpiryDate(expiryDate) : null, expiryStr: expiryDate || 'LIFETIME', created: getIndiaDateTime(), resetType: 'never', unlimited: isUnlimited, hidden: false };
    res.json({ success: true, message: 'Key generated successfully', key: { name: keyName, owner: keyOwner, scopes, limit: isUnlimited ? 'Unlimited' : keyStorage[keyName].limit, expiry: expiryDate || 'LIFETIME' } });
});

app.post('/admin/delete-key', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { keyName } = req.body;
    if (!keyName) return res.status(400).json({ success: false, error: 'Key name required' });
    if (keyName === 'BRONX_ULTRA_MASTER_2026') return res.status(400).json({ success: false, error: 'Cannot delete master key' });
    if (keyStorage[keyName]) { delete keyStorage[keyName]; res.json({ success: true, message: 'Key deleted' }); }
    else res.status(404).json({ success: false, error: 'Key not found' });
});

app.post('/admin/reset-key-usage', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { keyName } = req.body;
    if (!keyName) return res.status(400).json({ success: false, error: 'Key name required' });
    if (keyStorage[keyName]) { keyStorage[keyName].used = 0; res.json({ success: true, message: 'Usage reset' }); }
    else res.status(404).json({ success: false, error: 'Key not found' });
});

app.get('/admin/keys', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const allKeys = Object.entries(keyStorage).map(([key, data]) => ({ key, name: data.name, scopes: data.scopes, type: data.type, limit: data.unlimited ? 'Unlimited' : data.limit, used: data.used, remaining: data.unlimited ? 'Unlimited' : Math.max(0, data.limit - data.used), expiry: data.expiryStr || 'LIFETIME', created: data.created, hidden: data.hidden || false, isExpired: data.expiry && isKeyExpired(data.expiry), isExhausted: !data.unlimited && data.used >= data.limit }));
    res.json({ success: true, totalKeys: allKeys.length, keys: allKeys });
});

app.get('/admin/logs', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const limit = parseInt(req.query.limit) || 100;
    res.json({ success: true, totalLogs: requestLogs.length, logs: requestLogs.slice(-limit).reverse() });
});

app.post('/admin/clear-logs', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    requestLogs = [];
    res.json({ success: true, message: 'All logs cleared' });
});

app.post('/admin/custom-api', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { slot, api } = req.body;
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) return res.status(400).json({ success: false, error: 'Invalid slot' });
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    res.json({ success: true, message: 'Custom API updated', api: customAPIs[slot] });
});

app.get('/admin/stats', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    const activeKeys = Object.entries(keyStorage).filter(([_, d]) => !d.hidden && !isKeyExpired(d.expiry) && !(d.used >= d.limit && !d.unlimited)).length;
    res.json({ success: true, stats: { totalKeys, activeKeys, totalRequests: requestLogs.length, todayRequests: requestLogs.filter(l => l.timestamp.startsWith(getIndiaDate())).length, totalEndpoints: Object.keys(endpoints).length, totalCustomAPIs: customAPIs.filter(a => a.visible).length, serverTime: getIndiaDateTime() } });
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "Not found", endpoints: ["/", "/test", "/key-info", "/quota", "/api/key-bronx/:endpoint", "/api/custom/:endpoint", "/admin"], contact: "@BRONX_ULTRA" });
});

module.exports = app;
