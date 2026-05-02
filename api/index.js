const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = 'bronx';

// ========== ADMIN CONFIG ==========
const ADMIN_USERNAME = 'BRONX_ULTRA';
const ADMIN_PASSWORD = 'BRONX@2026#OWNER';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// ========== DATA STORAGE PATHS ==========
const DATA_DIR = path.join(__dirname, 'data');
const KEY_STORAGE_FILE = path.join(DATA_DIR, 'keyStorage.json');
const CUSTOM_APIS_FILE = path.join(DATA_DIR, 'customAPIs.json');
const REQUEST_LOGS_FILE = path.join(DATA_DIR, 'requestLogs.json');
const ADMIN_SESSION_FILE = path.join(DATA_DIR, 'adminSession.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ========== LOAD/SAVE FUNCTIONS ==========
function loadJSON(filePath, defaultData) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error(`Error loading ${filePath}:`, err.message);
    }
    return defaultData;
}

function saveJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error(`Error saving ${filePath}:`, err.message);
        return false;
    }
}

// ========== DEFAULT CUSTOM APIS ==========
const defaultCustomAPIs = [
    { 
        id: 1, 
        name: 'Number Info backup ✅', 
        endpoint: 'rajput-api', 
        param: 'num', 
        example: '9876543210', 
        desc: 'india Number Lookup Vip Bronx api',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://rajput-api.vercel.app/search?num={param}'
    },
    { 
        id: 2, 
        name: 'vehcial Ditails Api 🚕', 
        endpoint: 'rc-details', 
        param: 'ca_number', 
        example: 'MH02FZ0555', 
        desc: 'Vehicle RC Details Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://bronx-rc-api.vercel.app/?ca_number={param}'
    },
    { 
        id: 3, 
        name: 'Adhar Detail api ', 
        endpoint: 'aadhar-details', 
        param: 'aadhar', 
        example: '393933081942', 
        desc: 'Aadhar Number Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://bronx-adhar-api.vercel.app/aadhar={param}'
    },
    { 
        id: 4, 
        name: '📧 Email Lookup API', 
        endpoint: 'email-lookup', 
        param: 'mail', 
        example: 'user@gmail.com', 
        desc: 'Email Information Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://bronx-mail-api.vercel.app/mail={param}'
    },
    { 
        id: 5, 
        name: '📲 Telegram Number API', 
        endpoint: 'telegram-num', 
        param: 'id', 
        example: '7530266953', 
        desc: 'Telegram Number Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'http://45.91.248.51:3000/api/tgnum?id={param}'
    },
    { 
        id: 6, 
        name: 'Custom API 6', 
        endpoint: '', 
        param: '', 
        example: '', 
        desc: '',
        category: '🔧 Custom APIs',
        visible: false,
        realAPI: ''
    },
    { 
        id: 7, 
        name: 'Custom API 7', 
        endpoint: '', 
        param: '', 
        example: '', 
        desc: '',
        category: '🔧 Custom APIs',
        visible: false,
        realAPI: ''
    },
    { 
        id: 8, 
        name: 'Custom API 8', 
        endpoint: '', 
        param: '', 
        example: '', 
        desc: '',
        category: '🔧 Custom APIs',
        visible: false,
        realAPI: ''
    },
    { 
        id: 9, 
        name: 'Custom API 9', 
        endpoint: '', 
        param: '', 
        example: '', 
        desc: '',
        category: '🔧 Custom APIs',
        visible: false,
        realAPI: ''
    },
    { 
        id: 10, 
        name: 'Custom API 10', 
        endpoint: '', 
        param: '', 
        example: '', 
        desc: '',
        category: '🔧 Custom APIs',
        visible: false,
        realAPI: ''
    }
];

// ========== DEFAULT KEY STORAGE ==========
function getDefaultKeyStorage() {
    const now = getIndiaDateTime();
    
    const storage = {};
    
    // Master Owner Key (HIDDEN)
    storage['BRONX_ULTRA_MASTER_2026'] = {
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
    storage['DEMO_KEY_2026'] = {
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
    
    storage['TEST_KEY_2026'] = {
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
    
    return storage;
}

// Load data from files
let keyStorage = loadJSON(KEY_STORAGE_FILE, getDefaultKeyStorage());
let customAPIs = loadJSON(CUSTOM_APIS_FILE, defaultCustomAPIs);
let requestLogs = loadJSON(REQUEST_LOGS_FILE, []);
let adminSession = loadJSON(ADMIN_SESSION_FILE, { token: null, expiresAt: null });

// Save initial data if files don't exist
if (!fs.existsSync(KEY_STORAGE_FILE)) saveJSON(KEY_STORAGE_FILE, keyStorage);
if (!fs.existsSync(CUSTOM_APIS_FILE)) saveJSON(CUSTOM_APIS_FILE, customAPIs);
if (!fs.existsSync(REQUEST_LOGS_FILE)) saveJSON(REQUEST_LOGS_FILE, []);
if (!fs.existsSync(ADMIN_SESSION_FILE)) saveJSON(ADMIN_SESSION_FILE, adminSession);

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
    saveJSON(KEY_STORAGE_FILE, keyStorage);
    return keyStorage[apiKey];
}

function getRemainingQuota(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) return 0;
    if (keyData.unlimited) return Infinity;
    return Math.max(0, keyData.limit - keyData.used);
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
        key: key ? key.substring(0, 8) + '...' : 'unknown',
        endpoint: endpoint,
        param: param,
        status: status,
        ip: ip || 'unknown'
    });
    
    // Keep only last 1000 logs
    if (requestLogs.length > 1000) {
        requestLogs = requestLogs.slice(-1000);
    }
    saveJSON(REQUEST_LOGS_FILE, requestLogs);
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

// All scope options for admin panel
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

// ========== ADMIN AUTHENTICATION ==========
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

function isAdminAuthenticated(token) {
    if (!token || !adminSession.token || !adminSession.expiresAt) return false;
    if (token !== adminSession.token) return false;
    if (Date.now() > adminSession.expiresAt) {
        // Session expired
        adminSession = { token: null, expiresAt: null };
        saveJSON(ADMIN_SESSION_FILE, adminSession);
        return false;
    }
    return true;
}

// ========== EXPRESS MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IP tracking middleware
app.use((req, res, next) => {
    req.clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    next();
});

// ========== PUBLIC ROUTES ==========

// Home page
app.get('/', (req, res) => {
    servePublicHome(res);
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        status: '✅ BRONX OSINT API Running', 
        credit: '@BRONX_ULTRA', 
        time: getIndiaDateTime(),
        timezone: 'Asia/Kolkata (IST)',
        total_endpoints: Object.keys(endpoints).length,
        custom_apis: customAPIs.filter(api => api.visible).length
    });
});

// ========== REMOVED PUBLIC /keys ENDPOINT - SECURITY ==========
// NO PUBLIC KEY LISTING - Only admin can view keys

// Public key-info (only shows OWN key info, not all keys)
app.get('/key-info', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "❌ Missing key parameter. Use ?key=YOUR_KEY" });
    
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "❌ Key not found! Contact @BRONX_ULTRA to purchase." });
    }
    
    const now = getIndiaTime();
    const isExpired = keyData.expiry && now > keyData.expiry;
    const isExhausted = !keyData.unlimited && keyData.used >= keyData.limit;
    
    res.json({
        success: true,
        key: apiKey.substring(0, 6) + '****' + apiKey.substring(apiKey.length - 4),
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

// Quota check
app.get('/quota', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "❌ Missing key parameter. Use ?key=YOUR_KEY" });
    
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "❌ Key not found!" });
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
        resetType: 'never',
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
        return res.status(401).json({ success: false, error: "❌ API Key Required. Use ?key=YOUR_KEY" });
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
        return res.status(400).json({ 
            success: false, 
            error: `❌ Missing parameter: ${customAPI.param}`, 
            example: `?key=YOUR_KEY&${customAPI.param}=${customAPI.example}` 
        });
    }
    
    try {
        const realUrl = customAPI.realAPI.replace('{param}', encodeURIComponent(paramValue));
        console.log(`📡 [Custom] ${endpoint} -> ${paramValue} | Key: ${apiKey.substring(0, 8)}...`);
        
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
        console.error(`❌ Custom API Error [${endpoint}]:`, error.message);
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
        return res.status(404).json({ 
            success: false, 
            error: `❌ Endpoint not found: ${endpoint}`, 
            available_endpoints: Object.keys(endpoints) 
        });
    }
    
    if (!apiKey) {
        logRequest(null, endpoint, 'no-key', 'failed', req.clientIP);
        return res.status(401).json({ success: false, error: "❌ API Key Required. Use ?key=YOUR_KEY" });
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
        return res.status(400).json({ 
            success: false, 
            error: `❌ Missing parameter: ${ep.param}`, 
            example: `?key=YOUR_KEY&${ep.param}=${ep.example}` 
        });
    }
    
    try {
        const realUrl = `${REAL_API_BASE}/${endpoint}?key=${REAL_API_KEY}&${ep.param}=${encodeURIComponent(paramValue)}`;
        console.log(`📡 [${getIndiaDateTime()}] ${endpoint} -> ${paramValue} | Key: ${apiKey.substring(0, 8)}...`);
        
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
        console.error(`❌ Error [${endpoint}]:`, error.message);
        logRequest(apiKey, endpoint, paramValue, 'error', req.clientIP);
        if (error.response) {
            return res.status(error.response.status).json(cleanResponse(error.response.data));
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== ADMIN ROUTES ==========

// Admin login page
app.get('/admin', (req, res) => {
    const token = req.query.token || req.headers['x-admin-token'];
    
    if (isAdminAuthenticated(token)) {
        serveAdminPanel(res);
    } else {
        serveAdminLogin(res);
    }
});

// Admin login API
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateSessionToken();
        adminSession = {
            token: token,
            expiresAt: Date.now() + SESSION_TIMEOUT
        };
        saveJSON(ADMIN_SESSION_FILE, adminSession);
        
        res.json({ 
            success: true, 
            token: token,
            message: '✅ Login Successful! Redirecting...',
            redirect: '/admin?token=' + token
        });
    } else {
        res.status(401).json({ 
            success: false, 
            error: '❌ Invalid Credentials! Access Denied.' 
        });
    }
});

// Admin logout
app.post('/admin/logout', (req, res) => {
    adminSession = { token: null, expiresAt: null };
    saveJSON(ADMIN_SESSION_FILE, adminSession);
    res.json({ success: true, message: 'Logged out' });
});

// Admin check auth
app.get('/admin/check-auth', (req, res) => {
    const token = req.query.token || req.headers['x-admin-token'];
    res.json({ authenticated: isAdminAuthenticated(token) });
});

// ========== ADMIN API ENDPOINTS ==========

// Generate new key
app.post('/admin/generate-key', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { keyName, keyOwner, scopes, limit, expiryDate, keyType } = req.body;
    
    if (!keyName || !keyOwner || !scopes || scopes.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: '❌ Missing required fields: keyName, keyOwner, scopes' 
        });
    }
    
    if (keyStorage[keyName]) {
        return res.status(400).json({ 
            success: false, 
            error: '❌ Key already exists! Please use a different key name.' 
        });
    }
    
    const isUnlimited = limit === 'unlimited' || limit === 'Unlimited' || parseInt(limit) >= 999999;
    const keyLimit = isUnlimited ? 999999 : parseInt(limit) || 100;
    
    keyStorage[keyName] = {
        name: keyOwner,
        scopes: scopes,
        type: keyType || 'premium',
        limit: keyLimit,
        used: 0,
        expiry: expiryDate && expiryDate !== 'LIFETIME' ? parseExpiryDate(expiryDate) : null,
        expiryStr: expiryDate || 'LIFETIME',
        created: getIndiaDateTime(),
        resetType: 'never',
        unlimited: isUnlimited,
        hidden: false
    };
    
    saveJSON(KEY_STORAGE_FILE, keyStorage);
    
    res.json({ 
        success: true, 
        message: '✅ Key Generated Successfully!',
        key: {
            name: keyName,
            owner: keyOwner,
            scopes: scopes,
            limit: isUnlimited ? 'Unlimited' : keyLimit,
            expiry: expiryDate || 'LIFETIME',
            created: getIndiaDateTime()
        }
    });
});

// Delete key
app.post('/admin/delete-key', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { keyName } = req.body;
    
    if (!keyName) {
        return res.status(400).json({ success: false, error: '❌ Key name required' });
    }
    
    if (keyName === 'BRONX_ULTRA_MASTER_2026') {
        return res.status(400).json({ success: false, error: '❌ Cannot delete Master Key!' });
    }
    
    if (keyStorage[keyName]) {
        delete keyStorage[keyName];
        saveJSON(KEY_STORAGE_FILE, keyStorage);
        res.json({ success: true, message: '🗑️ Key deleted successfully!' });
    } else {
        res.status(404).json({ success: false, error: '❌ Key not found' });
    }
});

// Reset key usage
app.post('/admin/reset-key-usage', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { keyName } = req.body;
    
    if (!keyName) {
        return res.status(400).json({ success: false, error: '❌ Key name required' });
    }
    
    if (keyStorage[keyName]) {
        keyStorage[keyName].used = 0;
        saveJSON(KEY_STORAGE_FILE, keyStorage);
        res.json({ success: true, message: '🔄 Key usage reset successfully!' });
    } else {
        res.status(404).json({ success: false, error: '❌ Key not found' });
    }
});

// Get all keys (ADMIN ONLY)
app.get('/admin/keys', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const allKeys = Object.entries(keyStorage).map(([key, data]) => ({
        key: key,
        name: data.name,
        scopes: data.scopes,
        type: data.type,
        limit: data.unlimited ? 'Unlimited' : data.limit,
        used: data.used,
        remaining: data.unlimited ? 'Unlimited' : Math.max(0, data.limit - data.used),
        expiry: data.expiryStr || 'LIFETIME',
        created: data.created,
        hidden: data.hidden || false,
        isExpired: data.expiry && isKeyExpired(data.expiry),
        isExhausted: !data.unlimited && data.used >= data.limit
    }));
    
    res.json({ success: true, totalKeys: allKeys.length, keys: allKeys });
});

// Get request logs (ADMIN ONLY)
app.get('/admin/logs', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const limit = parseInt(req.query.limit) || 100;
    const logs = requestLogs.slice(-limit).reverse();
    
    res.json({ success: true, totalLogs: requestLogs.length, logs: logs });
});

// Clear logs
app.post('/admin/clear-logs', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    requestLogs = [];
    saveJSON(REQUEST_LOGS_FILE, []);
    res.json({ success: true, message: '🗑️ All logs cleared!' });
});

// Manage custom APIs
app.post('/admin/custom-api', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const { slot, api } = req.body;
    
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) {
        return res.status(400).json({ success: false, error: "Invalid slot" });
    }
    
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    saveJSON(CUSTOM_APIS_FILE, customAPIs);
    
    res.json({ success: true, message: "Custom API updated", api: customAPIs[slot] });
});

// Get custom APIs
app.get('/admin/custom-apis', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    res.json({ success: true, customAPIs });
});

// Get dashboard stats
app.get('/admin/stats', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!isAdminAuthenticated(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    const hiddenKeys = Object.keys(keyStorage).filter(k => keyStorage[k].hidden).length;
    const activeKeys = Object.entries(keyStorage).filter(([_, d]) => !d.hidden && !isKeyExpired(d.expiry) && !(d.used >= d.limit && !d.unlimited)).length;
    const totalRequests = requestLogs.length;
    const todayRequests = requestLogs.filter(log => log.timestamp.startsWith(getIndiaDate())).length;
    
    res.json({
        success: true,
        stats: {
            totalKeys,
            hiddenKeys,
            activeKeys,
            totalRequests,
            todayRequests,
            totalEndpoints: Object.keys(endpoints).length,
            totalCustomAPIs: customAPIs.filter(a => a.visible).length,
            serverTime: getIndiaDateTime()
        }
    });
});

// ========== SERVE HTML PAGES ==========

function serveAdminLogin(res) {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 BRONX ADMIN LOGIN</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Courier New', monospace;
        }
        .login-container {
            background: rgba(10,10,10,0.95);
            border: 3px solid #ff00ff;
            border-radius: 20px;
            padding: 50px 40px;
            width: 400px;
            box-shadow: 0 0 60px #ff00ff66, 0 0 100px #00ff4166;
            animation: glowPulse 3s infinite;
        }
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 60px #ff00ff66, 0 0 100px #00ff4166; }
            50% { box-shadow: 0 0 80px #00ff4166, 0 0 120px #ff00ff66; }
        }
        .login-header {
            text-align: center;
            margin-bottom: 40px;
        }
        .login-header h1 {
            font-size: 36px;
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: 3px;
        }
        .login-header .shield {
            font-size: 60px;
            display: block;
            margin-bottom: 10px;
        }
        .input-group {
            margin-bottom: 25px;
        }
        .input-group label {
            display: block;
            color: #00ff41;
            margin-bottom: 8px;
            font-size: 14px;
            letter-spacing: 2px;
        }
        .input-group input {
            width: 100%;
            padding: 15px 20px;
            background: #000;
            border: 2px solid #00ff41;
            border-radius: 50px;
            color: #00ff41;
            font-size: 16px;
            font-family: 'Courier New', monospace;
            outline: none;
            transition: all 0.3s;
        }
        .input-group input:focus {
            border-color: #ff00ff;
            box-shadow: 0 0 30px #ff00ff66;
        }
        .login-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            border: none;
            border-radius: 50px;
            color: #000;
            font-weight: bold;
            font-size: 18px;
            cursor: pointer;
            letter-spacing: 3px;
            transition: all 0.3s;
            font-family: 'Courier New', monospace;
        }
        .login-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 50px #00ff41;
        }
        .error-msg {
            color: #ff0000;
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
            display: none;
        }
        .back-link {
            text-align: center;
            margin-top: 25px;
        }
        .back-link a {
            color: #ffff00;
            text-decoration: none;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <span class="shield">🛡️</span>
            <h1>ADMIN PANEL</h1>
            <p style="color: #ffff00; font-size: 12px; margin-top: 10px;">BRONX OSINT API</p>
        </div>
        <div class="input-group">
            <label>👤 USERNAME</label>
            <input type="text" id="username" placeholder="Enter Admin Username" autocomplete="off">
        </div>
        <div class="input-group">
            <label>🔒 PASSWORD</label>
            <input type="password" id="password" placeholder="Enter Admin Password">
        </div>
        <button class="login-btn" onclick="login()">🚀 LOGIN</button>
        <div class="error-msg" id="errorMsg"></div>
        <div class="back-link">
            <a href="/">← Back to Home</a>
        </div>
    </div>
    
    <script>
        async function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMsg');
            
            if (!username || !password) {
                errorMsg.style.display = 'block';
                errorMsg.textContent = '❌ Please fill all fields!';
                return;
            }
            
            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    errorMsg.style.display = 'block';
                    errorMsg.style.color = '#00ff41';
                    errorMsg.textContent = data.message;
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                } else {
                    errorMsg.style.display = 'block';
                    errorMsg.style.color = '#ff0000';
                    errorMsg.textContent = data.error;
                }
            } catch (err) {
                errorMsg.style.display = 'block';
                errorMsg.style.color = '#ff0000';
                errorMsg.textContent = '❌ Connection error!';
            }
        }
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') login();
        });
    </script>
</body>
</html>`);
}

function serveAdminPanel(res) {
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
    
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🛡️ BRONX ADMIN PANEL</title>
    <style>
        :root {
            --bg: #0a0a0a;
            --card-bg: #111;
            --text: #fff;
            --green: #00ff41;
            --pink: #ff00ff;
            --yellow: #ffff00;
            --red: #ff4444;
            --blue: #00aaff;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: var(--bg);
            font-family: 'Courier New', monospace;
            color: var(--text);
            min-height: 100vh;
        }
        .admin-header {
            background: linear-gradient(135deg, #1a0033, #0a0a0a);
            border-bottom: 3px solid var(--pink);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 0 40px #ff00ff33;
        }
        .admin-header h1 {
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 28px;
            letter-spacing: 3px;
        }
        .admin-header .actions {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .btn {
            padding: 10px 20px;
            border: 2px solid;
            border-radius: 50px;
            cursor: pointer;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
            transition: all 0.3s;
            font-size: 13px;
        }
        .btn:hover { transform: scale(1.05); }
        .btn-pink { background: #ff00ff20; color: #ff00ff; border-color: #ff00ff; }
        .btn-green { background: #00ff4120; color: #00ff41; border-color: #00ff41; }
        .btn-red { background: #ff000020; color: #ff4444; border-color: #ff4444; }
        .btn-yellow { background: #ffff0020; color: #ffff00; border-color: #ffff00; }
        .btn-blue { background: #00aaff20; color: #00aaff; border-color: #00aaff; }
        .container { max-width: 1400px; margin: 0 auto; padding: 30px; }
        
        .stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: var(--card-bg);
            border: 2px solid var(--pink);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 0 30px #ff00ff22;
        }
        .stat-card .num {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stat-card .label {
            font-size: 12px;
            letter-spacing: 2px;
            color: #888;
            margin-top: 5px;
        }
        
        .section {
            background: var(--card-bg);
            border: 2px solid var(--green);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 0 40px #00ff4122;
        }
        .section h2 {
            color: var(--green);
            font-size: 24px;
            margin-bottom: 25px;
            text-shadow: 0 0 20px #00ff41;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .form-group label {
            display: block;
            color: var(--green);
            margin-bottom: 8px;
            font-size: 13px;
            letter-spacing: 1px;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px 15px;
            background: #000;
            border: 2px solid #00ff41;
            border-radius: 10px;
            color: #00ff41;
            font-size: 14px;
            font-family: 'Courier New', monospace;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: var(--pink);
            box-shadow: 0 0 20px #ff00ff44;
        }
        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            max-height: 200px;
            overflow-y: auto;
            padding: 10px;
            background: #000;
            border: 1px solid #333;
            border-radius: 10px;
        }
        .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #ccc;
            font-size: 12px;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 5px;
            transition: all 0.2s;
        }
        .checkbox-group label:hover {
            background: #ffffff10;
        }
        .checkbox-group input[type="checkbox"] {
            accent-color: #00ff41;
            width: 16px;
            height: 16px;
        }
        .full-width {
            grid-column: 1 / -1;
        }
        
        .key-table-container {
            max-height: 500px;
            overflow-y: auto;
            border-radius: 10px;
            border: 1px solid #333;
        }
        .key-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .key-table th {
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            color: #000;
            padding: 12px 10px;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        .key-table td {
            padding: 10px;
            border-bottom: 1px solid #ffffff15;
        }
        .key-table tr:hover { background: #ffffff08; }
        .status-active { color: #00ff41; }
        .status-expired { color: #ff4444; }
        .status-exhausted { color: #ffff00; }
        .key-code {
            color: #ff00ff;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            word-break: break-all;
        }
        .scope-tag {
            display: inline-block;
            padding: 2px 8px;
            background: #00ff4120;
            border: 1px solid #00ff41;
            border-radius: 20px;
            font-size: 10px;
            margin: 2px;
            color: #00ff41;
        }
        
        .tab-nav {
            display: flex;
            gap: 5px;
            margin-bottom: 25px;
            flex-wrap: wrap;
        }
        .tab-btn {
            padding: 12px 25px;
            background: #111;
            border: 2px solid #333;
            border-radius: 50px;
            color: #888;
            cursor: pointer;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
            transition: all 0.3s;
        }
        .tab-btn.active {
            border-color: #00ff41;
            color: #00ff41;
            box-shadow: 0 0 20px #00ff4133;
        }
        .tab-btn:hover {
            border-color: #ff00ff;
            color: #ff00ff;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .logs-container {
            max-height: 400px;
            overflow-y: auto;
            background: #000;
            border-radius: 10px;
            padding: 15px;
            font-size: 12px;
        }
        .log-entry {
            padding: 8px;
            border-bottom: 1px solid #ffffff10;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .log-entry .time { color: #888; }
        .log-entry .key { color: #ff00ff; }
        .log-entry .endpoint { color: #00ff41; }
        .log-entry .status-success { color: #00ff41; }
        .log-entry .status-failed { color: #ff4444; }
        .log-entry .status-error { color: #ffff00; }
        
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #0a0a0a;
            color: #00ff41;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: bold;
            border: 2px solid #00ff41;
            box-shadow: 0 0 40px #00ff41;
            z-index: 9999;
            animation: slideIn 0.3s;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .custom-api-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #000;
            border: 1px solid #333;
            border-radius: 10px;
            margin-bottom: 10px;
            gap: 15px;
            flex-wrap: wrap;
        }
        .custom-api-item .api-info {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
        }
        .badge-visible { background: #00ff4120; color: #00ff41; border: 1px solid #00ff41; }
        .badge-hidden { background: #ff000020; color: #ff4444; border: 1px solid #ff4444; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #00ff41; border-radius: 10px; }
        
        @media (max-width: 768px) {
            .stats-row { grid-template-columns: repeat(2, 1fr); }
            .admin-header { flex-direction: column; gap: 15px; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="admin-header">
        <h1>🛡️ BRONX ADMIN PANEL</h1>
        <div class="actions">
            <span style="color: #888; font-size: 12px;">🇮🇳 ${getIndiaDateTime()}</span>
            <button class="btn btn-yellow" onclick="window.open('/')">🏠 HOME</button>
            <button class="btn btn-red" onclick="logout()">🚪 LOGOUT</button>
        </div>
    </div>
    
    <div class="container">
        <div class="stats-row">
            <div class="stat-card">
                <div class="num" id="totalKeys">${totalKeys}</div>
                <div class="label">TOTAL KEYS</div>
            </div>
            <div class="stat-card">
                <div class="num" id="activeKeys">${activeKeys}</div>
                <div class="label">ACTIVE KEYS</div>
            </div>
            <div class="stat-card">
                <div class="num" id="totalRequests">${requestLogs.length}</div>
                <div class="label">TOTAL REQUESTS</div>
            </div>
            <div class="stat-card">
                <div class="num" id="todayRequests">${todayRequests}</div>
                <div class="label">TODAY REQUESTS</div>
            </div>
        </div>
        
        <div class="tab-nav">
            <button class="tab-btn active" onclick="switchTab('generate')">🔑 KEY GENERATOR</button>
            <button class="tab-btn" onclick="switchTab('manage')">📋 MANAGE KEYS</button>
            <button class="tab-btn" onclick="switchTab('custom')">🔧 CUSTOM APIs</button>
            <button class="tab-btn" onclick="switchTab('logs')">📊 LOGS</button>
        </div>
        
        <!-- KEY GENERATOR TAB -->
        <div class="tab-content active" id="tab-generate">
            <div class="section">
                <h2>🔑 GENERATE NEW API KEY</h2>
                <div class="form-grid">
                    <div class="form-group">
                        <label>🔐 KEY NAME (Unique)</label>
                        <input type="text" id="genKeyName" placeholder="e.g., PREMIUM_USER_001">
                    </div>
                    <div class="form-group">
                        <label>👤 KEY OWNER NAME</label>
                        <input type="text" id="genKeyOwner" placeholder="e.g., John Doe">
                    </div>
                    <div class="form-group">
                        <label>📊 REQUEST LIMIT</label>
                        <input type="text" id="genKeyLimit" placeholder="e.g., 100 or unlimited">
                    </div>
                    <div class="form-group">
                        <label>📅 EXPIRY DATE</label>
                        <select id="genKeyExpiry">
                            <option value="LIFETIME">🌟 LIFETIME (No Expiry)</option>
                            <option value="31-12-2026">31 December 2026</option>
                            <option value="31-12-2027">31 December 2027</option>
                            <option value="30-06-2026">30 June 2026</option>
                            <option value="30-09-2026">30 September 2026</option>
                            <option value="31-03-2026">31 March 2026</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>🏷️ KEY TYPE</label>
                        <select id="genKeyType">
                            <option value="premium">💎 Premium</option>
                            <option value="demo">🎁 Demo</option>
                            <option value="test">🧪 Test</option>
                            <option value="custom">🔧 Custom</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>🎯 SCOPES (Select APIs this key can access)</label>
                        <div class="checkbox-group" id="scopeCheckboxes">
                            ${allScopes.map(scope => '<label><input type="checkbox" value="' + scope.value + '"> ' + scope.label + '</label>').join('')}
                        </div>
                    </div>
                    <div class="form-group full-width">
                        <button class="btn btn-green" onclick="generateKey()" style="width:100%; padding:15px; font-size:16px;">🚀 GENERATE KEY</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- MANAGE KEYS TAB -->
        <div class="tab-content" id="tab-manage">
            <div class="section">
                <h2>📋 ALL API KEYS <span style="font-size:14px;color:#888;">(${totalKeys} keys)</span></h2>
                <div style="margin-bottom:15px; display:flex; gap:10px;">
                    <input type="text" id="keySearch" placeholder="🔍 Search keys..." onkeyup="filterKeys()" style="padding:10px 15px; background:#000; border:2px solid #00ff41; border-radius:50px; color:#00ff41; font-family:'Courier New',monospace; width:300px;">
                    <button class="btn btn-yellow" onclick="resetAllKeyUsage()">🔄 RESET ALL USAGE</button>
                </div>
                <div class="key-table-container">
                    <table class="key-table" id="keyTable">
                        <thead>
                            <tr>
                                <th>KEY</th>
                                <th>OWNER</th>
                                <th>SCOPES</th>
                                <th>LIMIT</th>
                                <th>USED</th>
                                <th>REMAINING</th>
                                <th>EXPIRY</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="keyTableBody">
                            ${allKeys.map(k => renderKeyRow(k)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- CUSTOM APIs TAB -->
        <div class="tab-content" id="tab-custom">
            <div class="section">
                <h2>🔧 CUSTOM API MANAGEMENT</h2>
                <div id="customAPIsList">
                    ${customAPIs.map((api, index) => renderCustomAPIRow(api, index)).join('')}
                </div>
            </div>
        </div>
        
        <!-- LOGS TAB -->
        <div class="tab-content" id="tab-logs">
            <div class="section">
                <h2>📊 REQUEST LOGS <span style="font-size:14px;color:#888;">(Last ${Math.min(50, requestLogs.length)} entries)</span></h2>
                <div style="margin-bottom:15px;">
                    <button class="btn btn-red" onclick="clearLogs()">🗑️ CLEAR ALL LOGS</button>
                </div>
                <div class="logs-container" id="logsContainer">
                    ${requestLogs.slice(-50).reverse().map(log => renderLogEntry(log)).join('') || '<p style="color:#888;text-align:center;padding:20px;">No logs yet</p>'}
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const ADMIN_TOKEN = new URLSearchParams(window.location.search).get('token') || '';
        
        function getToken() {
            return ADMIN_TOKEN || localStorage.getItem('adminToken') || '';
        }
        
        function showToast(msg) {
            const t = document.createElement('div');
            t.className = 'toast';
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 3000);
        }
        
        function switchTab(name) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('tab-' + name).classList.add('active');
            event.target.classList.add('active');
        }
        
        async function generateKey() {
            const keyName = document.getElementById('genKeyName').value.trim();
            const keyOwner = document.getElementById('genKeyOwner').value.trim();
            const keyLimit = document.getElementById('genKeyLimit').value.trim();
            const keyExpiry = document.getElementById('genKeyExpiry').value;
            const keyType = document.getElementById('genKeyType').value;
            
            if (!keyName || !keyOwner) {
                showToast('❌ Key Name and Owner are required!');
                return;
            }
            
            const scopes = [];
            document.querySelectorAll('#scopeCheckboxes input:checked').forEach(cb => {
                scopes.push(cb.value);
            });
            
            if (scopes.length === 0) {
                showToast('❌ Select at least one scope!');
                return;
            }
            
            try {
                const response = await fetch('/admin/generate-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': getToken()
                    },
                    body: JSON.stringify({
                        keyName,
                        keyOwner,
                        scopes,
                        limit: keyLimit || '100',
                        expiryDate: keyExpiry,
                        keyType
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    showToast('✅ Key Generated: ' + keyName);
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast(data.error || '❌ Error generating key');
                }
            } catch (err) {
                showToast('❌ Connection error');
            }
        }
        
        async function deleteKey(keyName) {
            if (!confirm('⚠️ Delete key: ' + keyName + '? This cannot be undone!')) return;
            
            try {
                const response = await fetch('/admin/delete-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': getToken()
                    },
                    body: JSON.stringify({ keyName })
                });
                
                const data = await response.json();
                if (data.success) {
                    showToast(data.message);
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showToast(data.error);
                }
            } catch (err) {
                showToast('❌ Error');
            }
        }
        
        async function resetKeyUsage(keyName) {
            try {
                const response = await fetch('/admin/reset-key-usage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': getToken()
                    },
                    body: JSON.stringify({ keyName })
                });
                
                const data = await response.json();
                if (data.success) {
                    showToast(data.message);
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showToast(data.error);
                }
            } catch (err) {
                showToast('❌ Error');
            }
        }
        
        async function resetAllKeyUsage() {
            if (!confirm('⚠️ Reset ALL key usage to 0? This cannot be undone!')) return;
            
            try {
                const resp = await fetch('/admin/keys?token=' + getToken());
                const data = await resp.json();
                
                for (const key of data.keys) {
                    await fetch('/admin/reset-key-usage', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-token': getToken()
                        },
                        body: JSON.stringify({ keyName: key.key })
                    });
                }
                
                showToast('✅ All keys reset!');
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                showToast('❌ Error');
            }
        }
        
        async function clearLogs() {
            if (!confirm('⚠️ Clear all request logs?')) return;
            
            try {
                await fetch('/admin/clear-logs', {
                    method: 'POST',
                    headers: { 'x-admin-token': getToken() }
                });
                showToast('🗑️ Logs cleared!');
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                showToast('❌ Error');
            }
        }
        
        function filterKeys() {
            const search = document.getElementById('keySearch').value.toLowerCase();
            const rows = document.querySelectorAll('#keyTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(search) ? '' : 'none';
            });
        }
        
        async function logout() {
            await fetch('/admin/logout', { method: 'POST' });
            localStorage.removeItem('adminToken');
            window.location.href = '/admin';
        }
        
        // Store token
        if (ADMIN_TOKEN) {
            localStorage.setItem('adminToken', ADMIN_TOKEN);
        }
    </script>
</body>
</html>`);
}

function renderKeyRow(k) {
    let status = '✅ Active';
    let statusClass = 'status-active';
    if (k.hidden) {
        status = '👑 Hidden';
        statusClass = 'status-active';
    } else if (k.isExpired) {
        status = '⏰ Expired';
        statusClass = 'status-expired';
    } else if (k.isExhausted) {
        status = '🛑 Exhausted';
        statusClass = 'status-exhausted';
    }
    
    const limitDisplay = k.unlimited ? '∞' : k.limit;
    const displayKey = k.key.length > 25 ? k.key.substring(0, 22) + '...' : k.key;
    const scopesDisplay = k.scopes.includes('*') ? '<span class="scope-tag">🌟 ALL</span>' : k.scopes.slice(0, 5).map(s => '<span class="scope-tag">' + s + '</span>').join('') + (k.scopes.length > 5 ? ' <span class="scope-tag">+' + (k.scopes.length - 5) + '</span>' : '');
    
    return '<tr>' +
        '<td><code class="key-code" title="' + k.key + '">' + displayKey + '</code></td>' +
        '<td>' + (k.name || 'N/A') + '</td>' +
        '<td style="font-size:10px;">' + scopesDisplay + '</td>' +
        '<td>' + limitDisplay + '</td>' +
        '<td>' + k.used + '</td>' +
        '<td>' + (k.unlimited ? '∞' : Math.max(0, k.limit - k.used)) + '</td>' +
        '<td>' + (k.expiryStr || 'LIFETIME') + '</td>' +
        '<td class="' + statusClass + '">' + status + '</td>' +
        '<td>' +
            '<button class="btn btn-blue" style="padding:4px 10px; font-size:10px;" onclick="resetKeyUsage(\'' + k.key + '\')">🔄</button> ' +
            (k.key !== 'BRONX_ULTRA_MASTER_2026' ? '<button class="btn btn-red" style="padding:4px 10px; font-size:10px;" onclick="deleteKey(\'' + k.key + '\')">🗑️</button>' : '') +
        '</td>' +
        '</tr>';
}

function renderCustomAPIRow(api, index) {
    return '<div class="custom-api-item">' +
        '<div class="api-info">' +
            '<strong style="color:#ff00ff;">#' + api.id + '</strong>' +
            '<span style="color:#fff;">' + (api.name || 'Empty Slot') + '</span>' +
            (api.endpoint ? '<code style="color:#00ff41;">/' + api.endpoint + '</code>' : '<span style="color:#888;">No endpoint</span>') +
            '<span class="status-badge ' + (api.visible ? 'badge-visible' : 'badge-hidden') + '">' + (api.visible ? 'VISIBLE' : 'HIDDEN') + '</span>' +
        '</div>' +
        '<span style="color:#888; font-size:11px;">' + (api.param || 'N/A') + '</span>' +
    '</div>';
}

function renderLogEntry(log) {
    const statusClass = log.status === 'success' ? 'status-success' : (log.status === 'failed' ? 'status-failed' : 'status-error');
    return '<div class="log-entry">' +
        '<span class="time">' + log.timestamp + '</span>' +
        '<span class="key">' + (log.key || 'N/A') + '</span>' +
        '<span class="endpoint">/' + log.endpoint + '</span>' +
        '<span>' + (log.param || 'N/A') + '</span>' +
        '<span class="' + statusClass + '">' + log.status.toUpperCase() + '</span>' +
        '<span style="color:#888;">' + (log.ip || 'N/A') + '</span>' +
    '</div>';
}

function servePublicHome(res) {
    const visibleCustomAPIs = customAPIs.filter(api => api.visible && api.endpoint);
    
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ BRONX OSINT API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a0a, #1a0033);
            font-family: 'Courier New', monospace;
            color: #fff;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            text-align: center;
            padding: 50px 20px;
            border: 3px solid;
            border-image: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00) 1;
            border-radius: 30px;
            margin: 30px 0;
            background: rgba(10,10,10,0.8);
            backdrop-filter: blur(10px);
            animation: glow 3s infinite;
        }
        @keyframes glow {
            0%, 100% { box-shadow: 0 0 30px #ff00ff33, 0 0 60px #00ff4133; }
            50% { box-shadow: 0 0 50px #00ff4166, 0 0 80px #ff00ff66; }
        }
        .header h1 {
            font-size: 48px;
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00, #ff4444);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: 5px;
        }
        .header p {
            color: #00ff41;
            margin-top: 15px;
            font-size: 14px;
            letter-spacing: 2px;
        }
        .badges {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .badge {
            padding: 10px 25px;
            border-radius: 50px;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 2px;
            border: 2px solid;
        }
        .badge-1 { background: #ff00ff20; color: #ff00ff; border-color: #ff00ff; }
        .badge-2 { background: #00ff4120; color: #00ff41; border-color: #00ff41; }
        .badge-3 { background: #ffff0020; color: #ffff00; border-color: #ffff00; }
        
        .api-panel {
            background: rgba(10,10,10,0.9);
            border: 2px solid #00ff41;
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
        }
        .api-panel h2 {
            color: #00ff41;
            margin-bottom: 20px;
            text-shadow: 0 0 20px #00ff41;
        }
        .input-row {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        .input-row input, .input-row select {
            flex: 1;
            min-width: 200px;
            padding: 12px 20px;
            background: #000;
            border: 2px solid #00ff41;
            border-radius: 50px;
            color: #00ff41;
            font-size: 14px;
            font-family: 'Courier New', monospace;
        }
        .btn {
            padding: 12px 30px;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            border: none;
            border-radius: 50px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
        }
        .btn:hover { box-shadow: 0 0 40px #00ff41; }
        .result {
            background: #000;
            border: 1px solid #00ff41;
            border-radius: 12px;
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
            margin-top: 15px;
            font-size: 12px;
            display: none;
        }
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
            margin-top: 30px;
        }
        .endpoint-card {
            background: rgba(10,10,10,0.8);
            border: 2px solid #ff00ff;
            border-radius: 15px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .endpoint-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 0 30px #ff00ff66;
        }
        .endpoint-card .method {
            font-size: 11px;
            padding: 4px 12px;
            background: #00ff4120;
            border: 1px solid #00ff41;
            border-radius: 20px;
            color: #00ff41;
        }
        .endpoint-card h3 {
            margin: 10px 0;
            color: #00ff41;
        }
        .endpoint-card .url {
            font-size: 11px;
            color: #ff00ff;
            word-break: break-all;
        }
        .endpoint-card .param {
            font-size: 12px;
            color: #ffff00;
            margin-top: 8px;
        }
        .footer {
            text-align: center;
            padding: 40px;
            margin-top: 50px;
            border-top: 2px solid #ff00ff;
            color: #888;
        }
        .category-title {
            font-size: 24px;
            color: #ff00ff;
            margin: 30px 0 15px;
            text-shadow: 0 0 20px #ff00ff;
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #00ff41; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ BRONX OSINT API ⚡</h1>
            <p>Powered by @BRONX_ULTRA</p>
            <div class="badges">
                <span class="badge badge-1">🔐 PREMIUM API</span>
                <span class="badge badge-2">⚡ REAL-TIME</span>
                <span class="badge badge-3">🇮🇳 INDIA</span>
            </div>
        </div>
        
        <div class="api-panel">
            <h2>🧪 API TESTER</h2>
            <div class="input-row">
                <select id="endpointSelect">
                    ${Object.entries(endpoints).map(([name, ep]) => '<option value="' + name + '">' + name.toUpperCase() + ' - ' + ep.desc + '</option>').join('')}
                    ${visibleCustomAPIs.length > 0 ? visibleCustomAPIs.map(api => '<option value="custom_' + api.id + '" data-custom="true" data-endpoint="' + api.endpoint + '" data-param="' + api.param + '">🔧 ' + api.name + '</option>').join('') : ''}
                </select>
                <input type="text" id="apiKey" placeholder="Enter API Key">
                <input type="text" id="paramValue" placeholder="Parameter Value">
                <button class="btn" onclick="testAPI()">🚀 TEST</button>
            </div>
            <div class="result" id="result"></div>
        </div>
        
        ${Object.entries({
            '📱 Phone Intelligence': '📱 Phone Intelligence',
            '💰 Financial': '💰 Financial',
            '📍 Location': '📍 Location',
            '🚗 Vehicle': '🚗 Vehicle',
            '🎮 Gaming': '🎮 Gaming',
            '🌐 Social': '🌐 Social',
            '🇵🇰 Pakistan': '🇵🇰 Pakistan',
            '🔧 Custom APIs': '🔧 Custom APIs'
        }).map(([display, cat]) => {
            const catEndpoints = cat === '🔧 Custom APIs' ? [] : Object.entries(endpoints).filter(([_, e]) => e.category === cat);
            const catCustom = cat === '🔧 Custom APIs' ? visibleCustomAPIs : [];
            
            if (catEndpoints.length === 0 && catCustom.length === 0) return '';
            
            let cards = '';
            
            if (cat === '🔧 Custom APIs') {
                cards = catCustom.map(api => '<div class="endpoint-card" onclick="copyUrlCustom(\'' + api.endpoint + '\',\'' + api.param + '\',\'' + api.example + '\')"><span class="method">CUSTOM</span><h3>/' + api.endpoint + '</h3><div class="url">/api/custom/' + api.endpoint + '</div><div class="param">📝 ' + api.desc + '</div><div class="param">🔑 ' + api.param + '=' + api.example + '</div></div>').join('');
            } else {
                cards = catEndpoints.map(([name, ep]) => '<div class="endpoint-card" onclick="copyUrl(\'' + name + '\',\'' + ep.param + '\',\'' + ep.example + '\')"><span class="method">GET</span><h3>/' + name + '</h3><div class="url">/api/key-bronx/' + name + '</div><div class="param">📝 ' + ep.desc + '</div><div class="param">🔑 ' + ep.param + '=' + ep.example + '</div></div>').join('');
            }
            
            return '<div class="category-title">' + display + '</div><div class="endpoint-grid">' + cards + '</div>';
        }).join('')}
        
        <div class="footer">
            <p style="color:#ff00ff;font-size:18px;">✨ BRONX OSINT API ✨</p>
            <p>Powered by @BRONX_ULTRA | 🇮🇳 India Time Zone</p>
            <p style="color:#ffff00;">Contact @BRONX_ULTRA on Telegram for API Keys</p>
        </div>
    </div>
    
    <script>
        const endpoints = ${JSON.stringify(endpoints)};
        
        function copyUrl(endpoint, param, example) {
            const url = window.location.origin + '/api/key-bronx/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example;
            navigator.clipboard.writeText(url).then(() => alert('✅ URL Copied!'));
        }
        
        function copyUrlCustom(endpoint, param, example) {
            const url = window.location.origin + '/api/custom/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example;
            navigator.clipboard.writeText(url).then(() => alert('✅ URL Copied!'));
        }
        
        async function testAPI() {
            const select = document.getElementById('endpointSelect');
            const option = select.options[select.selectedIndex];
            const isCustom = option.dataset.custom === 'true';
            const apiKey = document.getElementById('apiKey').value;
            const paramValue = document.getElementById('paramValue').value;
            const resultDiv = document.getElementById('result');
            
            if (!apiKey || !paramValue) {
                alert('❌ Please fill all fields!');
                return;
            }
            
            let url;
            if (isCustom) {
                url = '/api/custom/' + option.dataset.endpoint + '?key=' + apiKey + '&' + option.dataset.param + '=' + paramValue;
            } else {
                const endpoint = select.value;
                url = '/api/key-bronx/' + endpoint + '?key=' + apiKey + '&' + endpoints[endpoint].param + '=' + paramValue;
            }
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '⏳ Loading...';
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                resultDiv.innerHTML = '<pre style="color:#00ff41;">' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (err) {
                resultDiv.innerHTML = '<pre style="color:#ff4444;">Error: ' + err.message + '</pre>';
            }
        }
    </script>
</body>
</html>`);
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: "❌ Endpoint not found",
        available_endpoints: ["/", "/test", "/key-info", "/quota", "/api/key-bronx/:endpoint", "/api/custom/:endpoint", "/admin"],
        contact: "@BRONX_ULTRA"
    });
});

module.exports = app;
