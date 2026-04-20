const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const adminRouter = require('./admin');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint.onrender.com/api';
const REAL_API_KEY = 'nobita';
const KEYS_FILE = path.join(process.cwd(), 'keys.json');

// ========== LOAD KEYS FROM FILE ==========
function loadKeysFromFile() {
    try {
        if (fs.existsSync(KEYS_FILE)) {
            return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading keys:', e);
    }
    return {};
}

// ========== CUSTOM APIS (10 Slots) ==========
let customAPIs = [
    { id: 1, name: '📱 Rajpu Number Info', endpoint: 'rajpu-number', param: 'num', example: '9876543210', desc: 'Indian Number Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://rajpu-api.vercel.app/search?num={param}' },
    { id: 2, name: '🚗 RC Details API', endpoint: 'rc-details', param: 'ca_number', example: 'MH02FZ0555', desc: 'Vehicle RC Details', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-rc-api.vercel.app/?ca_number={param}' },
    { id: 3, name: '🆔 Aadhar Details API', endpoint: 'aadhar-details', param: 'aadhar', example: '393933081942', desc: 'Aadhar Number Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-adhar-api.vercel.app/aadhar={param}' },
    { id: 4, name: '📧 Email Lookup API', endpoint: 'email-lookup', param: 'email', example: 'user@gmail.com', desc: 'Email Information', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-mail-api.vercel.app/mail={param}' },
    { id: 5, name: '📲 Telegram Number API', endpoint: 'telegram-num', param: 'id', example: '7530266953', desc: 'Telegram Number Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'http://45.91.24.51:3000/api/tgnum?id={param}' },
    { id: 6, name: 'Custom API 6', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 7, name: 'Custom API 7', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 8, name: 'Custom API 8', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 9, name: 'Custom API 9', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 10, name: 'Custom API 10', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' }
];

// ========== DEFAULT KEYS (If no keys file) ==========
const DEFAULT_KEYS = {
    'BRONX_ULTRA_MASTER_2026': { name: '👑 BRONX ULTRA OWNER', scopes: ['*'], type: 'owner', limit: Infinity, used: 0, expiry: null, created: new Date().toISOString(), resetType: 'never', unlimited: true, hidden: true },
    'DEMO_KEY_2026': { name: '🎁 Demo User', scopes: ['number', 'aadhar', 'pincode'], type: 'demo', limit: 10, used: 0, expiry: new Date(2026, 11, 31).toISOString(), expiryStr: '31-12-2026', created: new Date().toISOString(), resetType: 'never', unlimited: false, hidden: false }
};

// Initialize keys
let keyStorage = loadKeysFromFile();
if (Object.keys(keyStorage).length === 0) {
    keyStorage = DEFAULT_KEYS;
}

// ========== INDIA TIME HELPERS ==========
function getIndiaTime() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
}

function getIndiaDateTime() {
    return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19);
}

function isKeyExpired(expiryDate) {
    if (!expiryDate) return false;
    return getIndiaTime() > new Date(expiryDate);
}

// ========== KEY FUNCTIONS ==========
function checkKeyValid(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) {
        return { valid: false, error: '❌ Invalid API Key. Contact @BRONX_ULTRA to purchase.' };
    }
    if (keyData.expiry && isKeyExpired(keyData.expiry)) {
        return { valid: false, error: '⏰ Your Key has EXPIRED! Please purchase a new key. Contact @BRONX_ULTRA on Telegram.', expired: true };
    }
    if (!keyData.unlimited && keyData.used >= keyData.limit) {
        return { valid: false, error: `🛑 Limit Exhausted! ${keyData.used}/${keyData.limit} requests used.`, limitExhausted: true };
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
    return { valid: false, error: `❌ Key cannot access '${endpoint}'. Allowed: ${keyData.scopes.join(', ')}` };
}

// ========== ENDPOINTS ==========
const endpoints = {
    number: { param: 'num', category: '📱 Phone Intelligence', example: '9876543210', desc: 'Indian Mobile Number Lookup' },
    aadhar: { param: 'num', category: '📱 Phone Intelligence', example: '393933081942', desc: 'Aadhaar Number Lookup' },
    name: { param: 'name', category: '📱 Phone Intelligence', example: 'abhiraaj', desc: 'Name to Records Search' },
    numv2: { param: 'num', category: '📱 Phone Intelligence', example: '6205949840', desc: 'Number Info v2' },
    adv: { param: 'num', category: '📱 Phone Intelligence', example: '9876543210', desc: 'Advanced Phone Lookup' },
    upi: { param: 'upi', category: '💰 Financial', example: 'example@ybl', desc: 'UPI ID Verification' },
    ifsc: { param: 'ifsc', category: '💰 Financial', example: 'SBIN0001234', desc: 'IFSC Code Details' },
    pan: { param: 'pan', category: '💰 Financial', example: 'AXDPR2606K', desc: 'PAN to GST Search' },
    pincode: { param: 'pin', category: '📍 Location', example: '110001', desc: 'Pincode Details' },
    ip: { param: 'ip', category: '📍 Location', example: '8.8.8.8', desc: 'IP Lookup' },
    vehicle: { param: 'vehicle', category: '🚗 Vehicle', example: 'MH02FZ0555', desc: 'Vehicle Registration' },
    rc: { param: 'owner', category: '🚗 Vehicle', example: 'UP92P2111', desc: 'RC Owner Details' },
    ff: { param: 'uid', category: '🎮 Gaming', example: '123456789', desc: 'Free Fire Info' },
    bgmi: { param: 'uid', category: '🎮 Gaming', example: '5121439477', desc: 'BGMI Info' },
    insta: { param: 'username', category: '🌐 Social', example: 'cristiano', desc: 'Instagram Profile' },
    git: { param: 'username', category: '🌐 Social', example: 'ftgamer2', desc: 'GitHub Profile' },
    tg: { param: 'info', category: '🌐 Social', example: 'JAUUOWNER', desc: 'Telegram Lookup' },
    pk: { param: 'num', category: '🇵🇰 Pakistan', example: '03331234567', desc: 'Pakistan Number v1' },
    pkv2: { param: 'num', category: '🇵🇰 Pakistan', example: '3359736848', desc: 'Pakistan Number v2' }
};

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

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use('/admin', adminRouter);

// ========== HTML UI ==========
function serveHTML(res) {
    const visibleKeys = Object.entries(keyStorage).filter(([k, v]) => !v.hidden);
    const totalKeys = visibleKeys.length;
    const visibleCustomAPIs = customAPIs.filter(api => api.visible && api.endpoint);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ BRONX OSINT | NEON API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg: #0a0a0a; --bg2: #1a0033; --card: rgba(10,10,10,0.9);
            --text: #fff; --accent: #00ff41; --border: #ff00ff;
        }
        body.light-mode {
            --bg: #f5f5f5; --bg2: #e0e0e0; --card: rgba(255,255,255,0.95);
            --text: #1a1a1a; --accent: #0066cc; --border: #0066cc;
        }
        body {
            background: linear-gradient(135deg, var(--bg) 0%, var(--bg2) 50%, var(--bg) 100%);
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            color: var(--text);
            transition: all 0.3s;
        }
        .container { max-width: 1300px; margin: 0 auto; padding: 20px; }
        
        /* Theme Toggle */
        .theme-toggle {
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            display: flex; gap: 10px;
        }
        .theme-btn {
            padding: 10px 18px; border-radius: 50px; border: 2px solid;
            cursor: pointer; font-weight: bold; font-family: inherit;
        }
        .theme-btn.dark { background: #0a0a0a; color: #00ff41; border-color: #00ff41; }
        .theme-btn.light { background: #f5f5f5; color: #0066cc; border-color: #0066cc; }
        
        /* Admin Login Button */
        .admin-btn {
            position: fixed; bottom: 20px; left: 20px; z-index: 9999;
            padding: 12px 25px; background: #ff00ff; color: #000;
            border: none; border-radius: 50px; font-weight: bold;
            cursor: pointer; box-shadow: 0 0 30px #ff00ff66;
        }
        
        /* Admin Panel Modal */
        .modal {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 10000; justify-content: center;
            align-items: center; overflow-y: auto; padding: 20px;
        }
        .modal-content {
            background: var(--card); backdrop-filter: blur(10px);
            border: 3px solid var(--border); border-radius: 30px;
            padding: 30px; max-width: 900px; width: 100%; max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 25px;
        }
        .modal-header h2 { color: var(--accent); font-size: 28px; }
        .close-btn {
            font-size: 30px; cursor: pointer; color: var(--text);
        }
        
        /* Form Styles */
        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block; margin-bottom: 8px; color: var(--accent);
            font-weight: bold;
        }
        .form-group input, .form-group select {
            width: 100%; padding: 12px 15px; background: #0a0a0a;
            border: 2px solid var(--accent); border-radius: 10px;
            color: var(--accent); font-family: inherit; font-size: 14px;
        }
        body.light-mode .form-group input,
        body.light-mode .form-group select {
            background: #fff; color: #1a1a1a;
        }
        
        /* Scope Checkboxes */
        .scope-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px; max-height: 200px; overflow-y: auto;
            padding: 15px; background: #0a0a0a; border-radius: 10px;
        }
        .scope-item {
            display: flex; align-items: center; gap: 8px;
        }
        .scope-item input { width: auto; }
        
        /* Buttons */
        .btn {
            padding: 12px 25px; border: none; border-radius: 10px;
            font-weight: bold; cursor: pointer; font-family: inherit;
            transition: all 0.3s; margin: 5px;
        }
        .btn-primary {
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            color: #000;
        }
        .btn-danger { background: #ff0000; color: #fff; }
        .btn-success { background: #00ff41; color: #000; }
        .btn:hover { transform: scale(1.05); }
        
        /* Keys Table */
        .keys-table-container { max-height: 400px; overflow-y: auto; margin-top: 20px; }
        .keys-table {
            width: 100%; border-collapse: collapse; font-size: 12px;
        }
        .keys-table th {
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            color: #000; padding: 10px; position: sticky; top: 0;
        }
        .keys-table td { padding: 8px; border-bottom: 1px solid #ffffff20; }
        
        /* Header & Stats */
        .header {
            text-align: center; padding: 40px; border: 3px solid;
            border-image: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00, #ff0000) 1;
            border-radius: 30px; margin-bottom: 30px;
            background: var(--card); backdrop-filter: blur(10px);
        }
        .header h1 {
            font-size: 48px; background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00, #ff6b6b, #00ffff);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .stats {
            display: flex; justify-content: center; gap: 30px; margin: 30px 0;
            flex-wrap: wrap;
        }
        .stat-card {
            background: var(--card); border: 2px solid; border-radius: 20px;
            padding: 20px 35px; text-align: center;
        }
        .stat-num { font-size: 42px; font-weight: bold; color: var(--accent); }
        .stat-label { font-size: 12px; letter-spacing: 3px; }
        
        /* Endpoint Grid */
        .category {
            font-size: 24px; font-weight: bold; margin: 30px 0 20px;
            padding-left: 20px; border-left: 6px solid; color: var(--accent);
        }
        .endpoint-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
        }
        .endpoint {
            background: var(--card); border: 2px solid; border-radius: 16px;
            padding: 20px; cursor: pointer; transition: all 0.3s;
        }
        .endpoint:hover { transform: translateY(-5px); }
        .endpoint-name {
            font-size: 20px; font-weight: bold; margin: 10px 0;
            color: var(--accent);
        }
        .endpoint-url { font-size: 11px; color: #ff00ff; }
        .param { font-size: 12px; color: #ffff00; margin-top: 10px; }
        
        /* Testing Panel */
        .api-panel {
            background: var(--card); border: 3px solid var(--border);
            border-radius: 20px; padding: 30px; margin: 40px 0;
        }
        .input-group {
            display: flex; gap: 15px; flex-wrap: wrap;
        }
        .input-group input, .input-group select {
            flex: 1; padding: 15px; background: #0a0a0a;
            border: 2px solid var(--accent); border-radius: 50px;
            color: var(--accent); font-family: inherit;
        }
        .api-result {
            margin-top: 20px; padding: 20px; background: #000;
            border-radius: 12px; max-height: 300px; overflow-y: auto;
            font-family: monospace; font-size: 12px; color: #00ff41;
        }
        
        .footer {
            text-align: center; padding: 40px; margin-top: 50px;
            border-top: 2px solid; border-image: linear-gradient(90deg, #ff00ff, #00ff41) 1;
        }
        .toast {
            position: fixed; bottom: 30px; right: 30px; z-index: 9999;
            background: #0a0a0a; color: #00ff41; padding: 15px 30px;
            border-radius: 50px; border: 2px solid #00ff41;
        }
    </style>
</head>
<body>
    <div class="theme-toggle">
        <button class="theme-btn dark" onclick="setTheme('dark')">🌙 DARK</button>
        <button class="theme-btn light" onclick="setTheme('light')">☀️ LIGHT</button>
    </div>
    
    <button class="admin-btn" onclick="openAdminPanel()">🔐 ADMIN PANEL</button>
    
    <!-- Admin Panel Modal -->
    <div class="modal" id="adminModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>🔐 ADMIN PANEL - KEY GENERATOR</h2>
                <span class="close-btn" onclick="closeAdminPanel()">&times;</span>
            </div>
            
            <div id="loginSection">
                <div class="form-group">
                    <label>🔑 Admin Password</label>
                    <input type="password" id="adminPassword" placeholder="Enter admin password">
                </div>
                <button class="btn btn-primary" onclick="adminLogin()">Login</button>
            </div>
            
            <div id="adminContent" style="display:none;">
                <!-- Generate Key Form -->
                <h3 style="color: #00ff41; margin: 20px 0;">✨ Generate New Key</h3>
                <div class="form-group">
                    <label>🔐 Key Name (Unique ID)</label>
                    <input type="text" id="newKeyName" placeholder="e.g., PREMIUM_USER_001">
                </div>
                <div class="form-group">
                    <label>👤 Owner Name</label>
                    <input type="text" id="newOwnerName" placeholder="e.g., John Doe">
                </div>
                <div class="form-group">
                    <label>📋 Select Scopes</label>
                    <div style="margin-bottom: 10px;">
                        <button class="btn btn-success" onclick="selectAllScopes()" style="padding:5px 15px;">Select All</button>
                        <button class="btn btn-danger" onclick="clearAllScopes()" style="padding:5px 15px;">Clear All</button>
                    </div>
                    <div class="scope-grid" id="scopeGrid"></div>
                </div>
                <div class="form-group">
                    <label>📊 Request Limit</label>
                    <input type="text" id="newLimit" placeholder="100 (or type 'unlimited')" value="100">
                </div>
                <div class="form-group">
                    <label>📅 Expiry Date</label>
                    <input type="date" id="newExpiry" min="${new Date().toISOString().split('T')[0]}">
                </div>
                <button class="btn btn-primary" onclick="generateKey()">🚀 Generate Key</button>
                
                <!-- Existing Keys Table -->
                <h3 style="color: #00ff41; margin: 30px 0 20px;">📋 Existing Keys</h3>
                <div class="keys-table-container">
                    <table class="keys-table" id="keysTable">
                        <thead>
                            <tr>
                                <th>Key</th><th>Owner</th><th>Scopes</th><th>Limit</th><th>Used</th><th>Expiry</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="keysTableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="header">
            <h1><span>⚡</span> BRONX OSINT <span>⚡</span></h1>
            <div style="display:flex; justify-content:center; gap:15px; margin-top:20px; flex-wrap:wrap;">
                <span class="badge" style="background:#ff00ff20; color:#ff00ff; border:2px solid #ff00ff; padding:8px 20px; border-radius:50px;">🔐 NEON INTELLIGENCE</span>
                <span class="badge" style="background:#00ff4120; color:#00ff41; border:2px solid #00ff41; padding:8px 20px; border-radius:50px;">🌐 ${totalKeys}+ KEYS</span>
                <span class="badge" style="background:#ffff0020; color:#ffff00; border:2px solid #ffff00; padding:8px 20px; border-radius:50px;">🔧 ${visibleCustomAPIs.length} CUSTOM APIs</span>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card" style="border-color:#ff00ff;"><div class="stat-num">${Object.keys(endpoints).length + visibleCustomAPIs.length}</div><div class="stat-label">ENDPOINTS</div></div>
            <div class="stat-card" style="border-color:#00ff41;"><div class="stat-num">${totalKeys}</div><div class="stat-label">ACTIVE KEYS</div></div>
            <div class="stat-card" style="border-color:#ffff00;"><div class="stat-num">10</div><div class="stat-label">CUSTOM SLOTS</div></div>
            <div class="stat-card" style="border-color:#ff0000;"><div class="stat-num">JSON</div><div class="stat-label">RESPONSE</div></div>
        </div>
        
        <!-- Testing Panel -->
        <div class="api-panel">
            <h2 style="color:#00ff41; margin-bottom:20px;">🧪 API TESTING PANEL</h2>
            <div class="input-group">
                <select id="endpointSelect">
                    <optgroup label="📱 Built-in APIs">
                        ${Object.entries(endpoints).map(([name, ep]) => \`<option value="\${name}">\${name.toUpperCase()} - \${ep.desc}</option>\`).join('')}
                    </optgroup>
                    ${visibleCustomAPIs.length > 0 ? \`
                        <optgroup label="🔧 Custom APIs">
                            ${visibleCustomAPIs.map(api => \`<option value="custom_\${api.id}" data-endpoint="\${api.endpoint}" data-param="\${api.param}">🔧 \${api.name}</option>\`).join('')}
                        </optgroup>
                    \` : ''}
                </select>
                <input type="text" id="apiKeyInput" placeholder="Enter API Key" value="DEMO_KEY_2026">
                <input type="text" id="paramInput" placeholder="Parameter Value">
                <button class="btn btn-primary" onclick="testAPI()" style="border-radius:50px;">🚀 TEST</button>
            </div>
            <div id="apiResult" class="api-result" style="display:none;"></div>
        </div>
        
        <!-- Built-in Endpoints -->
        ${Object.entries({'📱 Phone Intelligence':'📱 Phone Intelligence','💰 Financial':'💰 Financial','📍 Location':'📍 Location','🚗 Vehicle':'🚗 Vehicle','🎮 Gaming':'🎮 Gaming','🌐 Social':'🌐 Social','🇵🇰 Pakistan':'🇵🇰 Pakistan'}).filter(([_,cat]) => Object.values(endpoints).some(e => e.category === cat)).map(([display,cat]) => \`
            <div class="category">\${display}</div>
            <div class="endpoint-grid">
                ${Object.entries(endpoints).filter(([_,e]) => e.category === cat).map(([name,ep]) => \`
                    <div class="endpoint" onclick="copyUrl('\${name}','\${ep.param}','\${ep.example}')">
                        <span style="background:#00ff4120; color:#00ff41; padding:4px 12px; border-radius:20px; font-size:11px;">GET</span>
                        <div class="endpoint-name">/\${name}</div>
                        <div class="endpoint-url">/api/key-bronx/\${name}</div>
                        <div class="param">📝 \${ep.desc}</div>
                        <div class="param">🔑 \${ep.param}=\${ep.example}</div>
                    </div>
                \`).join('')}
            </div>
        \`).join('')}
        
        <!-- Custom APIs -->
        ${visibleCustomAPIs.length > 0 ? \`
            <div class="category">🔧 Custom APIs</div>
            <div class="endpoint-grid">
                ${visibleCustomAPIs.map(api => \`
                    <div class="endpoint" onclick="copyCustomUrl('\${api.endpoint}','\${api.param}','\${api.example}')">
                        <span style="background:#ff00ff20; color:#ff00ff; padding:4px 12px; border-radius:20px; font-size:11px;">CUSTOM</span>
                        <div class="endpoint-name">/\${api.endpoint}</div>
                        <div class="endpoint-url">/api/custom/\${api.endpoint}</div>
                        <div class="param">📝 \${api.desc}</div>
                        <div class="param">🔑 \${api.param}=\${api.example}</div>
                    </div>
                \`).join('')}
            </div>
        \` : ''}
        
        <div class="footer">
            <p style="background:linear-gradient(45deg,#ff00ff,#00ff41,#ffff00); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-size:18px; font-weight:bold;">✨ BRONX OSINT API - NEON EDITION ✨</p>
            <p style="color:#ff00ff;">Powered by @BRONX_ULTRA</p>
        </div>
    </div>
    
    <script>
        const endpoints = ${JSON.stringify(endpoints)};
        let adminPassword = '';
        const AVAILABLE_SCOPES = ['number','numv2','adv','aadhar','name','upi','ifsc','pan','pincode','ip','vehicle','rc','ff','bgmi','insta','git','tg','pk','pkv2'];
        
        // Theme
        function setTheme(t) {
            document.body.classList.toggle('light-mode', t === 'light');
            localStorage.setItem('theme', t);
        }
        setTheme(localStorage.getItem('theme') || 'dark');
        
        // Toast
        function showToast(msg) {
            const t = document.createElement('div'); t.className = 'toast';
            t.innerHTML = msg; document.body.appendChild(t);
            setTimeout(() => t.remove(), 2500);
        }
        
        // Copy URLs
        function copyUrl(endpoint, param, example) {
            navigator.clipboard.writeText(window.location.origin + '/api/key-bronx/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example);
            showToast('✅ URL Copied!');
        }
        function copyCustomUrl(endpoint, param, example) {
            navigator.clipboard.writeText(window.location.origin + '/api/custom/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example);
            showToast('✅ Custom URL Copied!');
        }
        
        // Test API
        async function testAPI() {
            const select = document.getElementById('endpointSelect');
            const opt = select.options[select.selectedIndex];
            const isCustom = opt.value.startsWith('custom_');
            const apiKey = document.getElementById('apiKeyInput').value;
            const paramValue = document.getElementById('paramInput').value;
            const resultDiv = document.getElementById('apiResult');
            
            if (!apiKey || !paramValue) { showToast('❌ Fill all fields'); return; }
            
            let url;
            if (isCustom) {
                url = '/api/custom/' + opt.dataset.endpoint + '?key=' + apiKey + '&' + opt.dataset.param + '=' + paramValue;
            } else {
                const ep = endpoints[select.value];
                url = '/api/key-bronx/' + select.value + '?key=' + apiKey + '&' + ep.param + '=' + paramValue;
            }
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '⏳ Loading...';
            try {
                const res = await fetch(url);
                const data = await res.json();
                resultDiv.innerHTML = '<pre style="color:#00ff41;">' + JSON.stringify(data, null, 2) + '</pre>';
            } catch(e) {
                resultDiv.innerHTML = '<pre style="color:#ff0000;">Error: ' + e.message + '</pre>';
            }
        }
        
        // Admin Panel Functions
        function openAdminPanel() { document.getElementById('adminModal').style.display = 'flex'; }
        function closeAdminPanel() { document.getElementById('adminModal').style.display = 'none'; }
        
        function populateScopeGrid() {
            const grid = document.getElementById('scopeGrid');
            grid.innerHTML = AVAILABLE_SCOPES.map(s => \`
                <div class="scope-item">
                    <input type="checkbox" value="\${s}" id="scope_\${s}">
                    <label for="scope_\${s}">\${s}</label>
                </div>
            \`).join('');
        }
        populateScopeGrid();
        
        function selectAllScopes() { document.querySelectorAll('#scopeGrid input').forEach(c => c.checked = true); }
        function clearAllScopes() { document.querySelectorAll('#scopeGrid input').forEach(c => c.checked = false); }
        
        async function adminLogin() {
            const pass = document.getElementById('adminPassword').value;
            adminPassword = pass;
            
            const res = await fetch('/admin/keys');
            if (res.ok) {
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('adminContent').style.display = 'block';
                loadKeysTable();
            } else {
                showToast('❌ Wrong password');
            }
        }
        
        async function loadKeysTable() {
            const res = await fetch('/admin/keys');
            const data = await res.json();
            const tbody = document.getElementById('keysTableBody');
            
            tbody.innerHTML = Object.entries(data.keys).filter(([k,v]) => !v.hidden).map(([key, val]) => \`
                <tr>
                    <td><code>\${key.substring(0,15)}...</code></td>
                    <td>\${val.name || '-'}</td>
                    <td>\${val.scopes.includes('*') ? 'ALL' : val.scopes.slice(0,3).join(', ')}</td>
                    <td>\${val.unlimited ? '∞' : val.limit}</td>
                    <td>\${val.used || 0}</td>
                    <td>\${val.expiryStr || 'Never'}</td>
                    <td>
                        <button class="btn btn-success" style="padding:4px 10px;" onclick="resetUsage('\${key}')">↻</button>
                        <button class="btn btn-danger" style="padding:4px 10px;" onclick="deleteKey('\${key}')">🗑️</button>
                    </td>
                </tr>
            \`).join('');
        }
        
        async function generateKey() {
            const keyName = document.getElementById('newKeyName').value;
            const ownerName = document.getElementById('newOwnerName').value;
            const limit = document.getElementById('newLimit').value;
            const expiry = document.getElementById('newExpiry').value;
            const scopes = Array.from(document.querySelectorAll('#scopeGrid input:checked')).map(c => c.value);
            
            if (!keyName || !ownerName || scopes.length === 0) {
                showToast('❌ Fill all required fields'); return;
            }
            
            const res = await fetch('/admin/generate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword, keyName, ownerName, scopes, limit, expiryDate: expiry })
            });
            
            const data = await res.json();
            if (data.success) {
                showToast('✅ Key Generated: ' + keyName);
                loadKeysTable();
                document.getElementById('newKeyName').value = '';
                document.getElementById('newOwnerName').value = '';
                clearAllScopes();
            } else {
                showToast('❌ ' + data.error);
            }
        }
        
        async function resetUsage(keyName) {
            if (!confirm('Reset usage for ' + keyName + '?')) return;
            const res = await fetch('/admin/reset-usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword, keyName })
            });
            const data = await res.json();
            showToast(data.success ? '✅ Usage reset!' : '❌ Failed');
            if (data.success) loadKeysTable();
        }
        
        async function deleteKey(keyName) {
            if (!confirm('Delete ' + keyName + '?')) return;
            const res = await fetch('/admin/delete-key', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword, keyName })
            });
            const data = await res.json();
            showToast(data.success ? '✅ Key deleted!' : '❌ Failed');
            if (data.success) loadKeysTable();
        }
        
        // Update placeholder on endpoint change
        document.getElementById('endpointSelect').addEventListener('change', function() {
            const opt = this.options[this.selectedIndex];
            if (opt.value.startsWith('custom_')) {
                document.getElementById('paramInput').placeholder = opt.dataset.param + ' (e.g., value)';
            } else {
                const ep = endpoints[this.value];
                document.getElementById('paramInput').placeholder = ep.param + ' (e.g., ' + ep.example + ')';
            }
        });
        document.getElementById('endpointSelect').dispatchEvent(new Event('change'));
    </script>
</body>
</html>`;
    res.send(html);
}

// ========== ROUTES ==========
app.get('/', (req, res) => serveHTML(res));

app.get('/test', (req, res) => {
    res.json({ status: '✅ BRONX OSINT API Running', credit: '@BRONX_ULTRA', time: getIndiaDateTime() });
});

app.get('/api/custom/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    
    const customAPI = customAPIs.find(api => api.endpoint === endpoint && api.visible);
    if (!customAPI) return res.status(404).json({ success: false, error: 'Custom endpoint not found' });
    
    if (!apiKey) return res.status(401).json({ success: false, error: 'API Key Required' });
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) return res.status(403).json({ success: false, error: keyCheck.error });
    
    const paramValue = req.query[customAPI.param];
    if (!paramValue) return res.status(400).json({ success: false, error: \`Missing parameter: \${customAPI.param}\` });
    
    try {
        const realUrl = customAPI.realAPI.replace('{param}', encodeURIComponent(paramValue));
        const response = await axios.get(realUrl, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        res.json(cleanResponse(response.data));
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    
    if (!endpoints[endpoint]) return res.status(404).json({ success: false, error: 'Endpoint not found' });
    if (!apiKey) return res.status(401).json({ success: false, error: 'API Key Required' });
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) return res.status(403).json({ success: false, error: keyCheck.error });
    
    const scopeCheck = checkKeyScope(keyCheck.keyData, endpoint);
    if (!scopeCheck.valid) return res.status(403).json({ success: false, error: scopeCheck.error });
    
    const ep = endpoints[endpoint];
    const paramValue = req.query[ep.param];
    if (!paramValue) return res.status(400).json({ success: false, error: \`Missing parameter: \${ep.param}\` });
    
    try {
        const realUrl = \`\${REAL_API_BASE}/\${endpoint}?key=\${REAL_API_KEY}&\${ep.param}=\${encodeURIComponent(paramValue)}\`;
        const response = await axios.get(realUrl, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        res.json(cleanResponse(response.data));
    } catch (error) {
        res.status(error.response?.status || 500).json(cleanResponse(error.response?.data || { error: error.message }));
    }
});

module.exports = app;
