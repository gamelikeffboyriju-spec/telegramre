// api/index.js - BRONX OSINT API v4.0 - VER CEL READY
const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = 'bronx';

// ========== ADMIN CONFIG (Change these!) ==========
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'BRONX_ULTRA';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BRONX@2026#OWNER';

// ========== MEMORY STORAGE (Vercel ke liye) ==========
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
    
    // MASTER OWNER KEY (Hidden)
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
    
    // Demo keys
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
    
    // Custom APIs
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

// Initialize on startup
initializeData();

// ========== KEY MANAGEMENT FUNCTIONS ==========
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
    
    // Keep only last 500 logs in memory
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
    pkv2: { param: 'num', category: '🇵🇰 Pakistan', example: '3359736848', desc: 'Pakistan Number v2' },
    // NEW ENDPOINTS
    adharfamily: { param: 'num', category: '📱 Phone Intelligence', example: '984154610245', desc: 'Aadhar Family Details' },
    adharration: { param: 'num', category: '📱 Phone Intelligence', example: '701984830542', desc: 'Aadhar Ration Card' },
    tgidinfo: { param: 'id', category: '🌐 Social', example: '7530266953', desc: 'Telegram ID Info' },
    snap: { param: 'username', category: '🌐 Social', example: 'priyapanchal272', desc: 'Snapchat Lookup' },
    imei: { param: 'imei', category: '📱 Phone Intelligence', example: '357817383506298', desc: 'IMEI Number Lookup' },
    calltracer: { param: 'num', category: '📱 Phone Intelligence', example: '9876543210', desc: 'Call Tracer Lookup' }
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

// ========== HTML HELPER FUNCTIONS ==========
function renderAdminLogin() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 BRONX ADMIN LOGIN</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{
            background:linear-gradient(135deg,#0a0a0a 0%,#1a0033 100%);
            min-height:100vh;display:flex;justify-content:center;align-items:center;
            font-family:'Courier New',monospace;
        }
        .login-box{
            background:rgba(10,10,10,0.95);border:3px solid #ff00ff;
            border-radius:20px;padding:50px 40px;width:400px;
            box-shadow:0 0 60px #ff00ff66,0 0 100px #00ff4166;
            animation:glow 3s infinite;
        }
        @keyframes glow{
            0%,100%{box-shadow:0 0 60px #ff00ff66,0 0 100px #00ff4166}
            50%{box-shadow:0 0 80px #00ff4166,0 0 120px #ff00ff66}
        }
        .login-box h1{
            text-align:center;font-size:36px;margin-bottom:10px;
            background:linear-gradient(45deg,#ff00ff,#00ff41,#ffff00);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;
            background-clip:text;letter-spacing:3px;
        }
        .login-box .icon{text-align:center;font-size:60px;margin-bottom:15px}
        .login-box p{text-align:center;color:#ffff00;font-size:12px;margin-bottom:30px}
        .input-group{margin-bottom:20px}
        .input-group label{display:block;color:#00ff41;margin-bottom:8px;font-size:14px;letter-spacing:2px}
        .input-group input{
            width:100%;padding:15px 20px;background:#000;
            border:2px solid #00ff41;border-radius:50px;color:#00ff41;
            font-size:16px;font-family:'Courier New',monospace;outline:none;
            transition:all 0.3s;
        }
        .input-group input:focus{border-color:#ff00ff;box-shadow:0 0 30px #ff00ff66}
        .login-btn{
            width:100%;padding:15px;background:linear-gradient(45deg,#ff00ff,#00ff41);
            border:none;border-radius:50px;color:#000;font-weight:bold;font-size:18px;
            cursor:pointer;letter-spacing:3px;transition:all 0.3s;font-family:'Courier New',monospace;
        }
        .login-btn:hover{transform:scale(1.05);box-shadow:0 0 50px #00ff41}
        .error{color:#ff0000;text-align:center;margin-top:15px;font-size:14px;display:none}
        .back-link{text-align:center;margin-top:25px}
        .back-link a{color:#ffff00;text-decoration:none;font-size:14px}
    </style>
</head>
<body>
    <div class="login-box">
        <div class="icon">🛡️</div>
        <h1>ADMIN PANEL</h1>
        <p>BRONX OSINT API</p>
        <div class="input-group">
            <label>👤 USERNAME</label>
            <input type="text" id="username" placeholder="Enter Admin Username" autocomplete="off">
        </div>
        <div class="input-group">
            <label>🔒 PASSWORD</label>
            <input type="password" id="password" placeholder="Enter Admin Password">
        </div>
        <button class="login-btn" onclick="login()">🚀 LOGIN</button>
        <div class="error" id="errorMsg"></div>
        <div class="back-link"><a href="/">← Back to Home</a></div>
    </div>
    <script>
        async function login(){
            const u=document.getElementById('username').value;
            const p=document.getElementById('password').value;
            const e=document.getElementById('errorMsg');
            if(!u||!p){e.style.display='block';e.textContent='❌ Fill all fields!';return}
            try{
                const r=await fetch('/admin/login',{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({username:u,password:p})
                });
                const d=await r.json();
                if(d.success){
                    e.style.display='block';e.style.color='#00ff41';e.textContent=d.message;
                    setTimeout(()=>{window.location.href=d.redirect},1000);
                }else{
                    e.style.display='block';e.style.color='#ff0000';e.textContent=d.error;
                }
            }catch(err){e.style.display='block';e.style.color='#ff0000';e.textContent='❌ Connection error!'}
        }
        document.addEventListener('keydown',function(ev){if(ev.key==='Enter')login()});
    </script>
</body>
</html>`;
}

function renderAdminPanel(token) {
    const allKeys = Object.entries(keyStorage).map(([key, data]) => ({
        key: key,
        ...data,
        isExpired: data.expiry && isKeyExpired(data.expiry),
        isExhausted: !data.unlimited && data.used >= data.limit,
        remaining: data.unlimited ? 'Unlimited' : Math.max(0, data.limit - data.used)
    }));
    
    const totalKeys = allKeys.filter(k => !k.hidden).length;
    const activeKeys = allKeys.filter(k => !k.hidden && !k.isExpired && !k.isExhausted).length;
    const todayRequests = requestLogs.filter(log => log.timestamp.startsWith(getIndiaDate())).length;
    
    let keyRows = allKeys.map(k => {
        let status = '✅ Active';
        let statusClass = 'c-green';
        if (k.hidden) { status = '👑 Hidden'; statusClass = 'c-pink'; }
        else if (k.isExpired) { status = '⏰ Expired'; statusClass = 'c-red'; }
        else if (k.isExhausted) { status = '🛑 Exhausted'; statusClass = 'c-yellow'; }
        
        const displayKey = k.key.length > 28 ? k.key.substring(0, 25) + '...' : k.key;
        const scopesDisplay = k.scopes.includes('*') ? '<span class="tag">🌟 ALL</span>' : k.scopes.slice(0, 4).map(s => '<span class="tag">' + s + '</span>').join('') + (k.scopes.length > 4 ? ' <span class="tag">+' + (k.scopes.length - 4) + '</span>' : '');
        const limitDisp = k.unlimited ? '∞' : k.limit;
        const remainDisp = k.unlimited ? '∞' : Math.max(0, k.limit - k.used);
        
        return '<tr>' +
            '<td><code style="color:#ff00ff;font-size:11px" title="' + k.key + '">' + displayKey + '</code></td>' +
            '<td>' + (k.name || 'N/A') + '</td>' +
            '<td style="font-size:10px">' + scopesDisplay + '</td>' +
            '<td>' + limitDisp + '</td>' +
            '<td>' + k.used + '</td>' +
            '<td>' + remainDisp + '</td>' +
            '<td>' + (k.expiryStr || 'LIFETIME') + '</td>' +
            '<td class="' + statusClass + '"><b>' + status + '</b></td>' +
            '<td style="white-space:nowrap">' +
                '<button onclick="resetKey(\'' + k.key + '\')" class="btn-sm btn-blue">🔄</button> ' +
                (k.key !== 'BRONX_ULTRA_MASTER_2026' ? '<button onclick="deleteKey(\'' + k.key + '\')" class="btn-sm btn-red">🗑️</button>' : '') +
            '</td>' +
        '</tr>';
    }).join('');
    
    let scopeCheckboxes = allScopes.map(s => 
        '<label class="cb-label"><input type="checkbox" value="' + s.value + '" class="scope-cb"> ' + s.label + '</label>'
    ).join('');
    
    let logEntries = requestLogs.slice(-40).reverse().map(log => {
        const sc = log.status === 'success' ? 'c-green' : (log.status === 'failed' ? 'c-red' : 'c-yellow');
        return '<div class="log-entry"><span class="c-gray">' + log.timestamp + '</span> | <span class="c-pink">' + log.key + '</span> | <span class="c-green">/' + log.endpoint + '</span> | <span>' + (log.param||'N/A') + '</span> | <span class="' + sc + '">' + log.status + '</span></div>';
    }).join('') || '<p style="text-align:center;color:#888;padding:20px">No logs yet</p>';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛡️ BRONX ADMIN PANEL</title>
    <style>
        :root{--bg:#0a0a0a;--card:#111;--text:#fff;--g:#00ff41;--p:#ff00ff;--y:#ffff00;--r:#ff4444;--b:#00aaff}
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:var(--bg);font-family:'Courier New',monospace;color:var(--text);min-height:100vh}
        .header{
            background:linear-gradient(135deg,#1a0033,#0a0a0a);border-bottom:3px solid var(--p);
            padding:15px 30px;display:flex;justify-content:space-between;align-items:center;
            flex-wrap:wrap;gap:15px;box-shadow:0 0 40px #ff00ff33;
        }
        .header h1{
            background:linear-gradient(45deg,#ff00ff,#00ff41);-webkit-background-clip:text;
            -webkit-text-fill-color:transparent;background-clip:text;font-size:24px;letter-spacing:3px;
        }
        .header .info{color:#888;font-size:12px}
        .container{max-width:1400px;margin:0 auto;padding:20px}
        
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:25px}
        .stat-card{
            background:var(--card);border:2px solid var(--p);border-radius:15px;
            padding:20px;text-align:center;box-shadow:0 0 30px #ff00ff22;
        }
        .stat-card .num{
            font-size:40px;font-weight:bold;background:linear-gradient(45deg,#ff00ff,#00ff41);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .stat-card .lbl{font-size:11px;letter-spacing:2px;color:#888;margin-top:5px}
        
        .section{
            background:var(--card);border:2px solid var(--g);border-radius:20px;
            padding:25px;margin-bottom:25px;box-shadow:0 0 40px #00ff4122;
        }
        .section h2{color:var(--g);font-size:22px;margin-bottom:20px;text-shadow:0 0 20px #00ff41}
        
        .tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
        .tab-btn{
            padding:10px 20px;background:#111;border:2px solid #333;border-radius:50px;
            color:#888;cursor:pointer;font-weight:bold;font-family:'Courier New',monospace;
            letter-spacing:1px;transition:all 0.3s;font-size:13px;
        }
        .tab-btn.active{border-color:#00ff41;color:#00ff41;box-shadow:0 0 20px #00ff4133}
        .tab-btn:hover{border-color:#ff00ff;color:#ff00ff}
        .tab-panel{display:none}
        .tab-panel.active{display:block}
        
        .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px}
        .form-group label{display:block;color:var(--g);margin-bottom:6px;font-size:12px;letter-spacing:1px}
        .form-group input,.form-group select{
            width:100%;padding:10px 15px;background:#000;border:2px solid #00ff41;
            border-radius:10px;color:#00ff41;font-size:13px;font-family:'Courier New',monospace;
        }
        .form-group input:focus,.form-group select:focus{outline:none;border-color:var(--p)}
        .full-w{grid-column:1/-1}
        
        .cb-group{
            display:flex;flex-wrap:wrap;gap:8px;max-height:180px;overflow-y:auto;
            padding:10px;background:#000;border:1px solid #333;border-radius:10px;
        }
        .cb-label{
            display:flex;align-items:center;gap:6px;color:#ccc;font-size:11px;
            cursor:pointer;padding:4px 10px;border-radius:5px;transition:all 0.2s;
        }
        .cb-label:hover{background:#ffffff10}
        .cb-label input{accent-color:#00ff41}
        
        .btn{
            padding:10px 25px;border:2px solid;border-radius:50px;cursor:pointer;
            font-weight:bold;font-family:'Courier New',monospace;letter-spacing:1px;
            transition:all 0.3s;font-size:13px;
        }
        .btn:hover{transform:scale(1.03)}
        .btn-green{background:#00ff4120;color:#00ff41;border-color:#00ff41}
        .btn-pink{background:#ff00ff20;color:#ff00ff;border-color:#ff00ff}
        .btn-red{background:#ff000020;color:#ff4444;border-color:#ff4444}
        .btn-yellow{background:#ffff0020;color:#ffff00;border-color:#ffff00}
        .btn-blue{background:#00aaff20;color:#00aaff;border-color:#00aaff}
        .btn-sm{padding:4px 10px;font-size:10px;border-radius:8px}
        
        .tbl-wrap{max-height:450px;overflow:auto;border-radius:10px;border:1px solid #333}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{
            background:linear-gradient(45deg,#ff00ff,#00ff41);color:#000;
            padding:10px 8px;font-weight:bold;position:sticky;top:0;z-index:10;
        }
        td{padding:8px;border-bottom:1px solid #ffffff10}
        tr:hover{background:#ffffff05}
        
        .c-green{color:#00ff41}.c-pink{color:#ff00ff}.c-red{color:#ff4444}
        .c-yellow{color:#ffff00}.c-gray{color:#888}.c-blue{color:#00aaff}
        
        .tag{
            display:inline-block;padding:1px 6px;background:#00ff4115;border:1px solid #00ff4140;
            border-radius:10px;font-size:9px;margin:1px;color:#00ff41;
        }
        
        .logs-box{
            max-height:400px;overflow:auto;background:#000;border-radius:10px;padding:15px;font-size:11px;
        }
        .log-entry{padding:6px 0;border-bottom:1px solid #ffffff08}
        
        .toast{
            position:fixed;bottom:30px;right:30px;background:#0a0a0a;color:#00ff41;
            padding:15px 30px;border-radius:50px;font-weight:bold;border:2px solid #00ff41;
            box-shadow:0 0 40px #00ff41;z-index:9999;animation:slide 0.3s;
        }
        @keyframes slide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#000}
        ::-webkit-scrollbar-thumb{background:#00ff41;border-radius:10px}
        
        @media(max-width:768px){
            .stats{grid-template-columns:repeat(2,1fr)}
            .header{flex-direction:column;text-align:center}
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ BRONX ADMIN PANEL</h1>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <span class="info">🇮🇳 ${getIndiaDateTime()}</span>
            <button class="btn btn-yellow btn-sm" onclick="window.open('/')">🏠 HOME</button>
            <button class="btn btn-red btn-sm" onclick="logout()">🚪 LOGOUT</button>
        </div>
    </div>
    
    <div class="container">
        <div class="stats">
            <div class="stat-card"><div class="num">${totalKeys}</div><div class="lbl">TOTAL KEYS</div></div>
            <div class="stat-card"><div class="num">${activeKeys}</div><div class="lbl">ACTIVE KEYS</div></div>
            <div class="stat-card"><div class="num">${requestLogs.length}</div><div class="lbl">TOTAL REQUESTS</div></div>
            <div class="stat-card"><div class="num">${todayRequests}</div><div class="lbl">TODAY</div></div>
        </div>
        
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('gen')">🔑 KEY GENERATOR</button>
            <button class="tab-btn" onclick="switchTab('keys')">📋 MANAGE KEYS</button>
            <button class="tab-btn" onclick="switchTab('custom')">🔧 CUSTOM APIs</button>
            <button class="tab-btn" onclick="switchTab('logs')">📊 LOGS</button>
        </div>
        
        <!-- KEY GENERATOR -->
        <div class="tab-panel active" id="tab-gen">
            <div class="section">
                <h2>🔑 GENERATE NEW API KEY</h2>
                <div class="form-grid">
                    <div class="form-group"><label>🔐 KEY NAME (Unique)</label><input type="text" id="genKeyName" placeholder="e.g., PREMIUM_001"></div>
                    <div class="form-group"><label>👤 KEY OWNER</label><input type="text" id="genKeyOwner" placeholder="Owner name"></div>
                    <div class="form-group"><label>📊 REQUEST LIMIT</label><input type="text" id="genKeyLimit" placeholder="100 or unlimited"></div>
                    <div class="form-group"><label>📅 EXPIRY</label><select id="genKeyExpiry"><option value="LIFETIME">🌟 LIFETIME</option><option value="31-12-2026">31 Dec 2026</option><option value="31-12-2027">31 Dec 2027</option><option value="30-06-2026">30 Jun 2026</option></select></div>
                    <div class="form-group"><label>🏷️ TYPE</label><select id="genKeyType"><option value="premium">💎 Premium</option><option value="demo">🎁 Demo</option><option value="test">🧪 Test</option></select></div>
                    <div class="form-group full-w">
                        <label>🎯 SCOPES (Select allowed APIs)</label>
                        <div class="cb-group" id="scopeChecks">${scopeCheckboxes}</div>
                    </div>
                    <div class="form-group full-w">
                        <button class="btn btn-green" onclick="generateKey()" style="width:100%;padding:14px;font-size:15px">🚀 GENERATE KEY</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- MANAGE KEYS -->
        <div class="tab-panel" id="tab-keys">
            <div class="section">
                <h2>📋 ALL KEYS (${totalKeys})</h2>
                <div style="margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap">
                    <input type="text" id="keySearch" placeholder="🔍 Search..." onkeyup="filterKeys()" style="padding:10px 15px;background:#000;border:2px solid #00ff41;border-radius:50px;color:#00ff41;font-family:'Courier New',monospace;width:280px">
                    <button class="btn btn-yellow btn-sm" onclick="resetAllKeys()">🔄 RESET ALL</button>
                </div>
                <div class="tbl-wrap">
                    <table id="keyTable">
                        <thead><tr><th>KEY</th><th>OWNER</th><th>SCOPES</th><th>LIMIT</th><th>USED</th><th>LEFT</th><th>EXPIRY</th><th>STATUS</th><th>ACT</th></tr></thead>
                        <tbody id="keyBody">${keyRows}</tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- CUSTOM APIs -->
        <div class="tab-panel" id="tab-custom">
            <div class="section">
                <h2>🔧 CUSTOM API SLOTS (10 Total)</h2>
                <div id="customList">
                    ${customAPIs.map((api,i) => '<div style="padding:10px;background:#000;border:1px solid #333;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="color:#ff00ff">#' + api.id + '</b> <span>' + (api.name||'Empty') + '</span> ' + (api.endpoint?'<code style="color:#00ff41">/' + api.endpoint + '</code>':'') + ' <span class="tag" style="' + (api.visible?'color:#00ff41;border-color:#00ff41':'color:#ff4444;border-color:#ff4444') + '">' + (api.visible?'VISIBLE':'HIDDEN') + '</span></div><span style="color:#888;font-size:11px">param: ' + (api.param||'N/A') + '</span></div>').join('')}
                </div>
                <p style="color:#888;font-size:11px;margin-top:10px">⚙️ Custom APIs can be edited via POST /admin/custom-api</p>
            </div>
        </div>
        
        <!-- LOGS -->
        <div class="tab-panel" id="tab-logs">
            <div class="section">
                <h2>📊 REQUEST LOGS</h2>
                <div style="margin-bottom:12px"><button class="btn btn-red btn-sm" onclick="clearLogs()">🗑️ CLEAR LOGS</button></div>
                <div class="logs-box" id="logsBox">${logEntries}</div>
            </div>
        </div>
    </div>
    
    <script>
        const TOKEN='${token}';
        const H=(t)=>document.querySelectorAll(t);
        function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2500)}
        
        function switchTab(n){
            H('.tab-panel').forEach(p=>p.classList.remove('active'));
            H('.tab-btn').forEach(b=>b.classList.remove('active'));
            document.getElementById('tab-'+n).classList.add('active');
            event.target.classList.add('active');
        }
        
        async function apiCall(url,body){
            try{
                const r=await fetch(url,{
                    method:body?'POST':'GET',
                    headers:{'Content-Type':'application/json','x-admin-token':TOKEN},
                    body:body?JSON.stringify(body):undefined
                });
                return await r.json();
            }catch(e){return{success:false,error:e.message}}
        }
        
        async function generateKey(){
            const name=document.getElementById('genKeyName').value.trim();
            const owner=document.getElementById('genKeyOwner').value.trim();
            const limit=document.getElementById('genKeyLimit').value.trim();
            const expiry=document.getElementById('genKeyExpiry').value;
            const type=document.getElementById('genKeyType').value;
            if(!name||!owner){toast('❌ Key Name & Owner required!');return}
            const scopes=[];
            document.querySelectorAll('#scopeChecks input:checked').forEach(c=>scopes.push(c.value));
            if(!scopes.length){toast('❌ Select at least one scope!');return}
            const d=await apiCall('/admin/generate-key',{keyName:name,keyOwner:owner,scopes,limit:limit||'100',expiryDate:expiry,keyType:type});
            if(d.success){toast('✅ Key Generated: '+name);setTimeout(()=>location.reload(),1500)}
            else toast(d.error||'Error')
        }
        
        async function deleteKey(k){if(!confirm('Delete '+k+'?'))return;const d=await apiCall('/admin/delete-key',{keyName:k});if(d.success){toast(d.message);setTimeout(()=>location.reload(),1000)}else toast(d.error)}
        async function resetKey(k){const d=await apiCall('/admin/reset-key-usage',{keyName:k});if(d.success){toast(d.message);setTimeout(()=>location.reload(),1000)}else toast(d.error)}
        async function resetAllKeys(){if(!confirm('Reset ALL usage?'))return;const d=await apiCall('/admin/keys');if(d.success){for(const k of d.keys){await apiCall('/admin/reset-key-usage',{keyName:k.key})}}toast('✅ All reset!');setTimeout(()=>location.reload(),1000)}
        async function clearLogs(){if(!confirm('Clear all logs?'))return;await apiCall('/admin/clear-logs');toast('🗑️ Done!');setTimeout(()=>location.reload(),1000)}
        async function logout(){await apiCall('/admin/logout');window.location.href='/admin'}
        
        function filterKeys(){
            const s=document.getElementById('keySearch').value.toLowerCase();
            document.querySelectorAll('#keyBody tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(s)?'':'none'});
        }
    </script>
</body>
</html>`;
}

function renderPublicHome() {
    const visibleAPIs = customAPIs.filter(a => a.visible && a.endpoint);
    
    // Group endpoints by category
    const categories = {};
    Object.entries(endpoints).forEach(([name, ep]) => {
        if (!categories[ep.category]) categories[ep.category] = [];
        categories[ep.category].push({name, ...ep});
    });
    
    let endpointCards = '';
    Object.entries(categories).forEach(([cat, eps]) => {
        endpointCards += '<h3 style="color:#ff00ff;margin:25px 0 10px;font-size:20px">' + cat + '</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">';
        eps.forEach(ep => {
            endpointCards += '<div style="background:#111;border:2px solid #ff00ff;border-radius:12px;padding:15px;cursor:pointer;transition:all 0.3s" onclick="copyUrl(\'' + ep.name + '\',\'' + ep.param + '\',\'' + ep.example + '\')"><span style="background:#00ff4120;color:#00ff41;padding:3px 10px;border-radius:10px;font-size:10px">GET</span><h4 style="color:#00ff41;margin:8px 0">/' + ep.name + '</h4><code style="font-size:10px;color:#ff00ff">/api/key-bronx/' + ep.name + '</code><p style="font-size:11px;color:#ffff00;margin-top:6px">🔑 ' + ep.param + '=' + ep.example + '</p></div>';
        });
        endpointCards += '</div>';
    });
    
    if (visibleAPIs.length > 0) {
        endpointCards += '<h3 style="color:#ff00ff;margin:25px 0 10px;font-size:20px">🔧 Custom APIs</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">';
        visibleAPIs.forEach(api => {
            endpointCards += '<div style="background:#111;border:2px solid #ff00ff;border-radius:12px;padding:15px;cursor:pointer;transition:all 0.3s" onclick="copyUrlCustom(\'' + api.endpoint + '\',\'' + api.param + '\',\'' + api.example + '\')"><span style="background:#ff00ff20;color:#ff00ff;padding:3px 10px;border-radius:10px;font-size:10px">CUSTOM</span><h4 style="color:#00ff41;margin:8px 0">/' + api.endpoint + '</h4><code style="font-size:10px;color:#ff00ff">/api/custom/' + api.endpoint + '</code><p style="font-size:11px;color:#ffff00;margin-top:6px">🔑 ' + api.param + '=' + api.example + '</p></div>';
        });
        endpointCards += '</div>';
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ BRONX OSINT API</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:linear-gradient(135deg,#0a0a0a,#1a0033);font-family:'Courier New',monospace;color:#fff;min-height:100vh}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#000}::-webkit-scrollbar-thumb{background:#00ff41;border-radius:10px}
        .container{max-width:1200px;margin:0 auto;padding:20px}
        .header{
            text-align:center;padding:40px 20px;border:3px solid;
            border-image:linear-gradient(45deg,#ff00ff,#00ff41,#ffff00)1;
            border-radius:25px;margin:25px 0;background:rgba(10,10,10,0.8);
            animation:glow 3s infinite;
        }
        @keyframes glow{
            0%,100%{box-shadow:0 0 30px #ff00ff33,0 0 60px #00ff4133}
            50%{box-shadow:0 0 50px #00ff4166,0 0 80px #ff00ff66}
        }
        .header h1{
            font-size:40px;background:linear-gradient(45deg,#ff00ff,#00ff41,#ffff00,#ff4444);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;
            background-clip:text;letter-spacing:4px;
        }
        .header p{color:#00ff41;margin-top:12px;font-size:13px;letter-spacing:2px}
        .badges{display:flex;justify-content:center;gap:12px;margin:15px 0;flex-wrap:wrap}
        .badge{padding:8px 20px;border-radius:50px;font-size:12px;font-weight:bold;border:2px solid}
        .b1{background:#ff00ff20;color:#ff00ff;border-color:#ff00ff}
        .b2{background:#00ff4120;color:#00ff41;border-color:#00ff41}
        .b3{background:#ffff0020;color:#ffff00;border-color:#ffff00}
        
        .tester{
            background:rgba(10,10,10,0.9);border:2px solid #00ff41;
            border-radius:18px;padding:25px;margin:25px 0;
        }
        .tester h2{color:#00ff41;margin-bottom:15px}
        .trow{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:15px}
        .trow input,.trow select{
            flex:1;min-width:180px;padding:12px 18px;background:#000;
            border:2px solid #00ff41;border-radius:50px;color:#00ff41;
            font-size:14px;font-family:'Courier New',monospace;
        }
        .btn{
            padding:12px 30px;background:linear-gradient(45deg,#ff00ff,#00ff41);
            border:none;border-radius:50px;color:#000;font-weight:bold;
            cursor:pointer;font-size:15px;font-family:'Courier New',monospace;
        }
        .btn:hover{box-shadow:0 0 40px #00ff41}
        .result{
            background:#000;border:1px solid #00ff41;border-radius:12px;
            padding:18px;max-height:350px;overflow:auto;margin-top:15px;
            font-size:11px;display:none;
        }
        .footer{
            text-align:center;padding:35px;margin-top:40px;
            border-top:2px solid #ff00ff;color:#888;font-size:13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ BRONX OSINT API ⚡</h1>
            <p>Powered by @BRONX_ULTRA</p>
            <div class="badges">
                <span class="badge b1">🔐 PREMIUM</span>
                <span class="badge b2">⚡ REAL-TIME</span>
                <span class="badge b3">🇮🇳 INDIA</span>
            </div>
        </div>
        
        <div class="tester">
            <h2>🧪 API TESTER</h2>
            <div class="trow">
                <select id="epSelect">
                    <option value="">-- Select Endpoint --</option>
                    ${Object.entries(endpoints).map(([n,e]) => '<option value="' + n + '">' + n.toUpperCase() + ' - ' + e.desc + '</option>').join('')}
                    ${visibleAPIs.length>0?visibleAPIs.map(a => '<option value="custom_' + a.id + '" data-custom="1" data-ep="' + a.endpoint + '" data-param="' + a.param + '">🔧 ' + a.name + '</option>').join(''):''}
                </select>
                <input type="text" id="apiKey" placeholder="API Key">
                <input type="text" id="paramVal" placeholder="Parameter">
                <button class="btn" onclick="testAPI()">🚀 TEST</button>
            </div>
            <div class="result" id="result"></div>
        </div>
        
        ${endpointCards}
        
        <div class="footer">
            <p style="color:#ff00ff;font-size:18px">✨ BRONX OSINT API ✨</p>
            <p>@BRONX_ULTRA | 🇮🇳 India | <a href="/admin" style="color:#ffff00">Admin</a></p>
        </div>
    </div>
    <script>
        const endpoints=${JSON.stringify(endpoints)};
        function copyUrl(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/key-bronx/'+e+'?key=KEY&'+p+'='+ex);alert('✅ Copied!')}
        function copyUrlCustom(e,p,ex){navigator.clipboard.writeText(location.origin+'/api/custom/'+e+'?key=KEY&'+p+'='+ex);alert('✅ Copied!')}
        async function testAPI(){
            const s=document.getElementById('epSelect');const o=s.options[s.selectedIndex];
            const isC=o.dataset.custom==='1';const k=document.getElementById('apiKey').value;
            const v=document.getElementById('paramVal').value;const r=document.getElementById('result');
            if(!k||!v||!s.value){alert('❌ Fill all fields!');return}
            let url;
            if(isC){url='/api/custom/'+o.dataset.ep+'?key='+k+'&'+o.dataset.param+'='+v}
            else{const ep=s.value;url='/api/key-bronx/'+ep+'?key='+k+'&'+endpoints[ep].param+'='+v}
            r.style.display='block';r.innerHTML='⏳ Loading...';
            try{const re=await fetch(url);const d=await re.json();r.innerHTML='<pre style="color:#00ff41">'+JSON.stringify(d,null,2)+'</pre>'}
            catch(e){r.innerHTML='<pre style="color:#ff4444">Error: '+e.message+'</pre>'}
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
    next();
});

// ========== PUBLIC ROUTES ==========

app.get('/', (req, res) => {
    res.send(renderPublicHome());
});

app.get('/test', (req, res) => {
    res.json({ 
        status: '✅ BRONX OSINT API Running', 
        credit: '@BRONX_ULTRA', 
        time: getIndiaDateTime(),
        timezone: 'Asia/Kolkata (IST)',
        total_endpoints: Object.keys(endpoints).length,
        total_keys: Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length
    });
});

// NO PUBLIC /keys - SECURITY

app.get('/key-info', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "❌ Missing key parameter" });
    
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "❌ Key not found" });
    }
    
    const now = getIndiaTime();
    const isExpired = keyData.expiry && now > keyData.expiry;
    const isExhausted = !keyData.unlimited && keyData.used >= keyData.limit;
    
    res.json({
        success: true,
        key_masked: apiKey.substring(0, 6) + '****' + apiKey.substring(apiKey.length - 4),
        owner: keyData.name,
        type: keyData.type,
        scopes: keyData.scopes,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit,
        used: keyData.used,
        remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used),
        expiry: keyData.expiryStr || 'LIFETIME',
        expired: isExpired,
        exhausted: isExhausted,
        status: isExpired ? 'expired' : (isExhausted ? 'exhausted' : 'active'),
        created: keyData.created,
        timezone: 'Asia/Kolkata',
        current_time: getIndiaDateTime()
    });
});

app.get('/quota', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "❌ Missing key parameter" });
    
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "❌ Key not found" });
    }
    
    const remaining = keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used);
    
    res.json({ 
        success: true,
        key_masked: apiKey.substring(0, 6) + '****',
        owner: keyData.name,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit, 
        used: keyData.used, 
        remaining: remaining,
        expiry: keyData.expiryStr || 'LIFETIME',
        timezone: 'Asia/Kolkata'
    });
});

// Custom API endpoint
app.get('/api/custom/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    
    const customAPI = customAPIs.find(api => api.endpoint === endpoint && api.visible);
    if (!customAPI) {
        return res.status(404).json({ success: false, error: `❌ Custom endpoint not found: ${endpoint}` });
    }
    
    if (!apiKey) {
        logRequest(null, `custom/${endpoint}`, 'no-key', 'failed', req.clientIP);
        return res.status(401).json({ success: false, error: "❌ API Key Required" });
    }
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) {
        logRequest(apiKey, `custom/${endpoint}`, query[customAPI.param], 'failed', req.clientIP);
        return res.status(403).json({ 
            success: false, 
            error: keyCheck.error,
            ...(keyCheck.expired && { expired: true }),
            ...(keyCheck.limitExhausted && { limit_exhausted: true })
        });
    }
    
    const keyData = keyCheck.keyData;
    const paramValue = query[customAPI.param];
    
    if (!paramValue) {
        return res.status(400).json({ success: false, error: `❌ Missing parameter: ${customAPI.param}`, example: `?key=KEY&${customAPI.param}=${customAPI.example}` });
    }
    
    try {
        const realUrl = customAPI.realAPI.replace('{param}', encodeURIComponent(paramValue));
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        incrementKeyUsage(apiKey);
        logRequest(apiKey, `custom/${endpoint}`, paramValue, 'success', req.clientIP);
        
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
        logRequest(apiKey, `custom/${endpoint}`, paramValue, 'error', req.clientIP);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Main API endpoint
app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    
    if (!endpoints[endpoint]) {
        return res.status(404).json({ success: false, error: `❌ Endpoint not found: ${endpoint}`, available: Object.keys(endpoints) });
    }
    
    if (!apiKey) {
        logRequest(null, endpoint, 'no-key', 'failed', req.clientIP);
        return res.status(401).json({ success: false, error: "❌ API Key Required" });
    }
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) {
        logRequest(apiKey, endpoint, query[endpoints[endpoint].param], 'failed', req.clientIP);
        return res.status(403).json({ 
            success: false, 
            error: keyCheck.error,
            ...(keyCheck.expired && { expired: true, expiry_date: keyCheck.expiredDate }),
            ...(keyCheck.limitExhausted && { limit_exhausted: true })
        });
    }
    
    const keyData = keyCheck.keyData;
    
    const scopeCheck = checkKeyScope(keyData, endpoint);
    if (!scopeCheck.valid) {
        logRequest(apiKey, endpoint, query[endpoints[endpoint].param], 'scope-denied', req.clientIP);
        return res.status(403).json({ success: false, error: scopeCheck.error });
    }
    
    const ep = endpoints[endpoint];
    const paramValue = query[ep.param];
    
    if (!paramValue) {
        return res.status(400).json({ success: false, error: `❌ Missing parameter: ${ep.param}`, example: `?key=KEY&${ep.param}=${ep.example}` });
    }
    
    try {
        const realUrl = `${REAL_API_BASE}/${endpoint}?key=${REAL_API_KEY}&${ep.param}=${encodeURIComponent(paramValue)}`;
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        const updatedKey = incrementKeyUsage(apiKey);
        logRequest(apiKey, endpoint, paramValue, 'success', req.clientIP);
        
        const cleanedData = cleanResponse(response.data);
        cleanedData.api_info = {
            powered_by: "@BRONX_ULTRA",
            endpoint: endpoint,
            key_owner: keyData.name,
            key_type: keyData.type,
            limit: keyData.unlimited ? 'Unlimited' : keyData.limit,
            used: updatedKey ? updatedKey.used : keyData.used,
            remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - (updatedKey ? updatedKey.used : keyData.used)),
            expiry: keyData.expiryStr || 'LIFETIME',
            timezone: 'Asia/Kolkata',
            timestamp: getIndiaDateTime()
        };
        
        res.json(cleanedData);
    } catch (error) {
        logRequest(apiKey, endpoint, paramValue, 'error', req.clientIP);
        if (error.response) {
            return res.status(error.response.status).json(cleanResponse(error.response.data));
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== ADMIN ROUTES ==========

app.get('/admin', (req, res) => {
    const token = req.query.token || req.headers['x-admin-token'];
    
    if (isAdminAuthenticated(token)) {
        res.send(renderAdminPanel(token));
    } else {
        res.send(renderAdminLogin());
    }
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateSessionToken();
        adminSessions[token] = { expiresAt: Date.now() + (30 * 60 * 1000) }; // 30 min
        res.json({ success: true, token, message: '✅ Login Successful!', redirect: '/admin?token=' + token });
    } else {
        res.status(401).json({ success: false, error: '❌ Invalid Credentials!' });
    }
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

// Admin API - all require auth
app.post('/admin/generate-key', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { keyName, keyOwner, scopes, limit, expiryDate, keyType } = req.body;
    if (!keyName || !keyOwner || !scopes || scopes.length === 0) {
        return res.status(400).json({ success: false, error: '❌ Missing fields: keyName, keyOwner, scopes' });
    }
    if (keyStorage[keyName]) {
        return res.status(400).json({ success: false, error: '❌ Key already exists!' });
    }
    
    const isUnlimited = limit === 'unlimited' || parseInt(limit) >= 999999;
    keyStorage[keyName] = {
        name: keyOwner, scopes, type: keyType || 'premium',
        limit: isUnlimited ? 999999 : parseInt(limit) || 100, used: 0,
        expiry: expiryDate && expiryDate !== 'LIFETIME' ? parseExpiryDate(expiryDate) : null,
        expiryStr: expiryDate || 'LIFETIME', created: getIndiaDateTime(),
        resetType: 'never', unlimited: isUnlimited, hidden: false
    };
    
    res.json({ success: true, message: '✅ Key Generated!', key: { name: keyName, owner: keyOwner, scopes, limit: isUnlimited ? 'Unlimited' : keyStorage[keyName].limit, expiry: expiryDate || 'LIFETIME' } });
});

app.post('/admin/delete-key', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { keyName } = req.body;
    if (!keyName) return res.status(400).json({ success: false, error: '❌ Key name required' });
    if (keyName === 'BRONX_ULTRA_MASTER_2026') return res.status(400).json({ success: false, error: '❌ Cannot delete Master Key!' });
    
    if (keyStorage[keyName]) {
        delete keyStorage[keyName];
        res.json({ success: true, message: '🗑️ Key deleted!' });
    } else {
        res.status(404).json({ success: false, error: '❌ Key not found' });
    }
});

app.post('/admin/reset-key-usage', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { keyName } = req.body;
    if (!keyName) return res.status(400).json({ success: false, error: '❌ Key name required' });
    
    if (keyStorage[keyName]) {
        keyStorage[keyName].used = 0;
        res.json({ success: true, message: '🔄 Usage reset!' });
    } else {
        res.status(404).json({ success: false, error: '❌ Key not found' });
    }
});

app.get('/admin/keys', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const allKeys = Object.entries(keyStorage).map(([key, data]) => ({
        key, name: data.name, scopes: data.scopes, type: data.type,
        limit: data.unlimited ? 'Unlimited' : data.limit, used: data.used,
        remaining: data.unlimited ? 'Unlimited' : Math.max(0, data.limit - data.used),
        expiry: data.expiryStr || 'LIFETIME', created: data.created,
        hidden: data.hidden || false,
        isExpired: data.expiry && isKeyExpired(data.expiry),
        isExhausted: !data.unlimited && data.used >= data.limit
    }));
    
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
    res.json({ success: true, message: '🗑️ All logs cleared!' });
});

app.post('/admin/custom-api', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { slot, api } = req.body;
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) {
        return res.status(400).json({ success: false, error: 'Invalid slot' });
    }
    
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    res.json({ success: true, message: 'Custom API updated', api: customAPIs[slot] });
});

app.get('/admin/stats', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    const activeKeys = Object.entries(keyStorage).filter(([_, d]) => !d.hidden && !isKeyExpired(d.expiry) && !(d.used >= d.limit && !d.unlimited)).length;
    
    res.json({
        success: true,
        stats: {
            totalKeys, activeKeys,
            totalRequests: requestLogs.length,
            todayRequests: requestLogs.filter(l => l.timestamp.startsWith(getIndiaDate())).length,
            totalEndpoints: Object.keys(endpoints).length,
            totalCustomAPIs: customAPIs.filter(a => a.visible).length,
            serverTime: getIndiaDateTime()
        }
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: "❌ Not found",
        endpoints: ["/", "/test", "/key-info", "/quota", "/api/key-bronx/:endpoint", "/api/custom/:endpoint", "/admin"],
        contact: "@BRONX_ULTRA"
    });
});

module.exports = app;
