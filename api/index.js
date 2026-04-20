const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.onrender.com/api';
const REAL_API_KEY = 'nobita';

// ========== ADMIN CREDENTIALS (Hardcoded for Vercel) ==========
const ADMIN_CREDENTIALS = {
    username: 'BRONX_ADMIN',
    password: 'Bronx@2026Ultra'
};

// ========== SIMPLE TOKEN AUTH FOR VERCEL ==========
// Generate a simple token for admin authentication
let adminTokens = new Map(); // Store tokens in memory (resets on cold start)

function generateAdminToken() {
    return crypto.randomBytes(32).toString('hex');
}

function verifyAdminToken(token) {
    return adminTokens.has(token);
}

// ========== EXTRA CUSTOM APIS (10 Slots - with LOCK) ==========
let customAPIs = [
    { 
        id: 1, 
        name: 'Number Info backup ✅', 
        endpoint: 'rajput-api', 
        param: 'num', 
        example: '9876543210', 
        desc: 'india Number Lookup Vip Bronx api',
        category: '🔧 Custom APIs',
        visible: true,
        locked: true,
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
        locked: true,
        realAPI: 'https://bronx-rc-api.vercel.app/?ca_number={param}'
    },
    { 
        id: 3, 
        name: 'Adhar Detail api', 
        endpoint: 'aadhar-details', 
        param: 'aadhar', 
        example: '393933081942', 
        desc: 'Aadhar Number Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        locked: true,
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
        locked: true,
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
        locked: true,
        realAPI: 'http://45.91.248.51:3000/api/tgnum?id={param}'
    },
    { id: 6, name: 'Custom API 6', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, locked: false, realAPI: '' },
    { id: 7, name: 'Custom API 7', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, locked: false, realAPI: '' },
    { id: 8, name: 'Custom API 8', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, locked: false, realAPI: '' },
    { id: 9, name: 'Custom API 9', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, locked: false, realAPI: '' },
    { id: 10, name: 'Custom API 10', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, locked: false, realAPI: '' }
];

// ========== INDIA TIME HELPER ==========
function getIndiaTime() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
}

function getIndiaDateTime() {
    return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19);
}

// ========== EXPIRY CHECK ==========
function isKeyExpired(expiryDate) {
    if (!expiryDate) return false;
    const indiaNow = getIndiaTime();
    const expiry = new Date(expiryDate);
    return indiaNow > expiry;
}

function parseExpiryDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59);
}

// ========== ENHANCED KEY STORAGE ==========
let keyStorage = {};

// ========== UNLIMITED MASTER KEY (HIDDEN) ==========
keyStorage['BRONX_ULTRA_MASTER_2026'] = {
    name: '👑 BRONX ULTRA OWNER',
    scopes: ['*'],
    type: 'owner',
    limit: Infinity,
    used: 0,
    expiry: null,
    created: getIndiaDateTime(),
    resetType: 'never',
    unlimited: true,
    hidden: true
};

// ========== 49 PREMIUM KEYS (ALL HIDDEN) ==========
const premiumKeys = [
    { key: 'demo1', name: '📱 Number Hunter Pro', scopes: ['number', 'numv2', 'adv'], limit: 10, expiry: '31-12-2026' },
    { key: 'demo2', name: '🆔 Aadhar Master', scopes: ['aadhar'], limit: 5, expiry: '30-06-2026' },
    { key: 'demo3', name: '🌐 Social Intel', scopes: ['insta', 'git', 'tg'], limit: 20, expiry: '31-12-2026' },
    { key: 'PREMIUM_VEHICLE_001', name: '🚗 Vehicle Tracker Pro', scopes: ['vehicle', 'rc'], limit: 75, expiry: '31-10-2026' },
    { key: 'PREMIUM_GAMING_001', name: '🎮 Gaming Intel', scopes: ['ff', 'bgmi'], limit: 150, expiry: '31-12-2026' },
    { key: 'PREMIUM_FINANCE_001', name: '💰 Finance Pro', scopes: ['upi', 'ifsc', 'pan'], limit: 60, expiry: '30-09-2026' },
    { key: 'PREMIUM_LOCATION_001', name: '📍 Location Master', scopes: ['pincode', 'ip'], limit: 100, expiry: '31-12-2026' },
    { key: 'PREMIUM_NAME_001', name: '🔍 Name Search Pro', scopes: ['name'], limit: 80, expiry: '31-08-2026' },
    { key: 'PREMIUM_PAK_001', name: '🇵🇰 Pakistan Intel', scopes: ['pk', 'pkv2'], limit: 50, expiry: '31-12-2026' },
    { key: 'PREMIUM_COMBO_001', name: '🎯 Combo Pack 1', scopes: ['number', 'aadhar', 'pan'], limit: 120, expiry: '31-12-2026' },
    { key: 'PREMIUM_COMBO_002', name: '🎯 Combo Pack 2', scopes: ['vehicle', 'rc', 'pincode'], limit: 90, expiry: '30-11-2026' },
    { key: 'PREMIUM_COMBO_003', name: '🎯 Combo Pack 3', scopes: ['insta', 'git', 'tg', 'ff'], limit: 180, expiry: '31-12-2026' },
    { key: 'PREMIUM_BASIC_001', name: '⭐ Basic User 1', scopes: ['number'], limit: 30, expiry: '31-07-2026' },
    { key: 'PREMIUM_BASIC_002', name: '⭐ Basic User 2', scopes: ['pincode'], limit: 40, expiry: '31-08-2026' },
    { key: 'PREMIUM_BASIC_003', name: '⭐ Basic User 3', scopes: ['ip'], limit: 50, expiry: '30-09-2026' },
    { key: 'PREMIUM_ADVANCED_001', name: '🌟 Advanced User 1', scopes: ['number', 'numv2', 'adv', 'name'], limit: 200, expiry: '31-12-2026' },
    { key: 'PREMIUM_ADVANCED_002', name: '🌟 Advanced User 2', scopes: ['aadhar', 'pan', 'upi'], limit: 100, expiry: '31-12-2026' },
    { key: 'PREMIUM_ADVANCED_003', name: '🌟 Advanced User 3', scopes: ['vehicle', 'rc', 'pincode', 'ip'], limit: 150, expiry: '31-12-2026' },
    { key: 'PREMIUM_ELITE_001', name: '💎 Elite User 1', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name'], limit: 300, expiry: '31-12-2026' },
    { key: 'PREMIUM_ELITE_002', name: '💎 Elite User 2', scopes: ['insta', 'git', 'tg', 'ff', 'bgmi'], limit: 250, expiry: '31-12-2026' },
    { key: 'PREMIUM_BUSINESS_001', name: '🏢 Business Pack 1', scopes: ['number', 'aadhar', 'pan', 'upi', 'ifsc'], limit: 500, expiry: '31-12-2026' },
    { key: 'PREMIUM_BUSINESS_002', name: '🏢 Business Pack 2', scopes: ['vehicle', 'rc', 'pincode', 'ip', 'name'], limit: 400, expiry: '31-12-2026' },
    { key: 'PREMIUM_STUDENT_001', name: '🎓 Student Pack 1', scopes: ['number', 'pincode', 'ip'], limit: 50, expiry: '31-12-2026' },
    { key: 'PREMIUM_STUDENT_002', name: '🎓 Student Pack 2', scopes: ['insta', 'git', 'ff'], limit: 60, expiry: '31-12-2026' },
    { key: 'PREMIUM_DEV_001', name: '💻 Developer 1', scopes: ['number', 'ip', 'git'], limit: 200, expiry: '31-12-2026' },
    { key: 'PREMIUM_DEV_002', name: '💻 Developer 2', scopes: ['number', 'numv2', 'adv', 'ip', 'git'], limit: 250, expiry: '31-12-2026' },
    { key: 'PREMIUM_SECURITY_001', name: '🛡️ Security Pro', scopes: ['aadhar', 'pan', 'vehicle'], limit: 100, expiry: '31-12-2026' },
    { key: 'PREMIUM_INVESTIGATOR_001', name: '🔎 Investigator', scopes: ['number', 'numv2', 'adv', 'aadhar', 'vehicle', 'rc'], limit: 350, expiry: '31-12-2026' },
    { key: 'PREMIUM_SOCIALPRO_001', name: '📸 Social Media Pro', scopes: ['insta', 'git', 'tg'], limit: 300, expiry: '31-12-2026' },
    { key: 'PREMIUM_GAMERPRO_001', name: '🎮 Gamer Pro', scopes: ['ff', 'bgmi'], limit: 200, expiry: '31-12-2026' },
    { key: 'PREMIUM_FINANCEPRO_001', name: '💵 Finance Pro Max', scopes: ['upi', 'ifsc', 'pan'], limit: 150, expiry: '31-12-2026' },
    { key: 'PREMIUM_LOCATIONPRO_001', name: '🗺️ Location Pro', scopes: ['pincode', 'ip'], limit: 200, expiry: '31-12-2026' },
    { key: 'PREMIUM_PREMIUM_001', name: '👔 Premium User 1', scopes: ['number', 'aadhar', 'name', 'pincode'], limit: 150, expiry: '31-12-2026' },
    { key: 'PREMIUM_PREMIUM_002', name: '👔 Premium User 2', scopes: ['vehicle', 'rc', 'pan', 'upi'], limit: 120, expiry: '30-11-2026' },
    { key: 'PREMIUM_PREMIUM_003', name: '👔 Premium User 3', scopes: ['insta', 'tg', 'ff', 'bgmi'], limit: 180, expiry: '31-10-2026' },
    { key: 'PREMIUM_GOLD_001', name: '🥇 Gold Member 1', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'pincode'], limit: 400, expiry: '31-12-2026' },
    { key: 'PREMIUM_GOLD_002', name: '🥇 Gold Member 2', scopes: ['vehicle', 'rc', 'pan', 'upi', 'ifsc', 'ip'], limit: 350, expiry: '31-12-2026' },
    { key: 'PREMIUM_PLATINUM_001', name: '💠 Platinum User 1', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'vehicle', 'rc'], limit: 500, expiry: '31-12-2026' },
    { key: 'PREMIUM_PLATINUM_002', name: '💠 Platinum User 2', scopes: ['insta', 'git', 'tg', 'ff', 'bgmi', 'ip', 'pincode'], limit: 450, expiry: '31-12-2026' },
    { key: 'PREMIUM_DIAMOND_001', name: '💎 Diamond User', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'pan', 'upi'], limit: 600, expiry: '31-12-2026' },
    { key: 'PREMIUM_ULTIMATE_001', name: '🏆 Ultimate User', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'vehicle', 'rc', 'pan', 'upi', 'ifsc'], limit: 750, expiry: '31-12-2026' },
    { key: 'PREMIUM_STARTER_001', name: '🌱 Starter Pack', scopes: ['number', 'pincode'], limit: 25, expiry: '31-07-2026' },
    { key: 'PREMIUM_STARTER_002', name: '🌱 Starter Pack 2', scopes: ['ip', 'git'], limit: 30, expiry: '31-08-2026' },
    { key: 'PREMIUM_WEEKLY_001', name: '📅 Weekly Pass', scopes: ['number', 'aadhar', 'name'], limit: 40, expiry: '30-06-2026' },
    { key: 'PREMIUM_MONTHLY_001', name: '📆 Monthly Pass', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name'], limit: 100, expiry: '31-07-2026' },
    { key: 'PREMIUM_QUARTERLY_001', name: '📊 Quarterly Pass', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'vehicle', 'rc'], limit: 250, expiry: '30-09-2026' },
    { key: 'PREMIUM_YEARLY_001', name: '🎯 Yearly Pass', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'vehicle', 'rc', 'pan', 'upi', 'ifsc', 'pincode', 'ip'], limit: 1000, expiry: '31-12-2026' },
    { key: 'PREMIUM_VIP_001', name: '👑 VIP Member', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'insta', 'git', 'tg'], limit: 500, expiry: '31-12-2026' }
];

// Initialize premium keys (all hidden)
premiumKeys.forEach(keyData => {
    keyStorage[keyData.key] = {
        name: keyData.name,
        scopes: keyData.scopes,
        type: 'premium',
        limit: keyData.limit,
        used: 0,
        expiry: parseExpiryDate(keyData.expiry),
        expiryStr: keyData.expiry,
        created: getIndiaDateTime(),
        resetType: 'never',
        unlimited: false,
        hidden: true,
        isCustom: false
    };
});

// Demo keys (hidden)
keyStorage['DEMO_KEY_2026'] = {
    name: '🎁 Demo User',
    scopes: ['number', 'aadhar', 'pincode'],
    type: 'demo',
    limit: 10,
    used: 0,
    expiry: parseExpiryDate('31-12-2026'),
    expiryStr: '31-12-2026',
    created: getIndiaDateTime(),
    resetType: 'never',
    unlimited: false,
    hidden: true,
    isCustom: false
};

keyStorage['TEST_KEY_2026'] = {
    name: '🧪 Test User',
    scopes: ['number'],
    type: 'test',
    limit: 5,
    used: 0,
    expiry: parseExpiryDate('30-06-2026'),
    expiryStr: '30-06-2026',
    created: getIndiaDateTime(),
    resetType: 'never',
    unlimited: false,
    hidden: true,
    isCustom: false
};

// ========== CUSTOM GENERATED KEYS STORAGE ==========
let customGeneratedKeys = {};

// ========== KEY MANAGEMENT FUNCTIONS ==========
function checkKeyValid(apiKey) {
    const keyData = keyStorage[apiKey] || customGeneratedKeys[apiKey];
    if (!keyData) {
        return { valid: false, error: '❌ Invalid API Key. Contact @BRONX_ULTRA to purchase.' };
    }
    
    if (keyData.expiry && isKeyExpired(keyData.expiry)) {
        return { 
            valid: false, 
            error: '⏰ Your Key has EXPIRED! Please purchase a new key.',
            expired: true,
            expiredDate: keyData.expiryStr
        };
    }
    
    if (!keyData.unlimited && keyData.used >= keyData.limit) {
        return {
            valid: false,
            error: `🛑 Limit Exhausted! You have used ${keyData.used}/${keyData.limit} requests.`,
            limitExhausted: true
        };
    }
    
    return { valid: true, keyData };
}

function incrementKeyUsage(apiKey) {
    if (keyStorage[apiKey]) {
        if (!keyStorage[apiKey].unlimited) {
            keyStorage[apiKey].used++;
        }
        return keyStorage[apiKey];
    }
    if (customGeneratedKeys[apiKey]) {
        if (!customGeneratedKeys[apiKey].unlimited) {
            customGeneratedKeys[apiKey].used++;
        }
        return customGeneratedKeys[apiKey];
    }
    return null;
}

function checkKeyScope(keyData, endpoint) {
    if (keyData.scopes.includes('*')) return { valid: true };
    if (keyData.scopes.includes(endpoint)) return { valid: true };
    return { 
        valid: false, 
        error: `❌ This key cannot access '${endpoint}'. Allowed scopes: ${keyData.scopes.join(', ')}` 
    };
}

function generateAPIKey(prefix = 'BRONX') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = prefix + '_';
    for (let i = 0; i < 16; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
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

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin auth middleware using token
function requireAdminAuth(req, res, next) {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!token || !verifyAdminToken(token)) {
        return res.status(401).json({ success: false, error: 'Unauthorized. Invalid or missing admin token.' });
    }
    next();
}

// ========== AUTH ROUTES ==========
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const token = generateAdminToken();
        adminTokens.set(token, { username, loginTime: getIndiaDateTime() });
        
        // Clean old tokens (keep last 5)
        if (adminTokens.size > 5) {
            const firstKey = adminTokens.keys().next().value;
            adminTokens.delete(firstKey);
        }
        
        return res.json({ 
            success: true, 
            message: '✅ Login successful!',
            token: token
        });
    }
    
    res.status(401).json({ success: false, error: '❌ Invalid username or password!' });
});

app.post('/admin/logout', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token) {
        adminTokens.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
});

// ========== CUSTOM KEY GENERATOR ROUTES ==========
app.post('/admin/generate-key', requireAdminAuth, (req, res) => {
    const { name, expiryDate, requestLimit, scopes, unlimited } = req.body;
    
    if (!name) {
        return res.status(400).json({ success: false, error: 'Owner name is required' });
    }
    
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one scope is required' });
    }
    
    const newKey = generateAPIKey('BRONX');
    const expiry = expiryDate ? parseExpiryDate(expiryDate) : null;
    const limit = unlimited ? Infinity : (parseInt(requestLimit) || 100);
    
    customGeneratedKeys[newKey] = {
        name: name,
        scopes: scopes,
        type: 'custom',
        limit: limit,
        used: 0,
        expiry: expiry,
        expiryStr: expiryDate || 'Never',
        created: getIndiaDateTime(),
        resetType: 'never',
        unlimited: unlimited || false,
        hidden: false,
        isCustom: true
    };
    
    res.json({
        success: true,
        message: '✅ Custom key generated successfully!',
        key: newKey,
        details: customGeneratedKeys[newKey]
    });
});

app.get('/admin/custom-keys', requireAdminAuth, (req, res) => {
    const keysList = Object.entries(customGeneratedKeys).map(([key, data]) => ({
        key: key,
        name: data.name,
        scopes: data.scopes,
        limit: data.unlimited ? 'Unlimited' : data.limit,
        used: data.used,
        remaining: data.unlimited ? 'Unlimited' : Math.max(0, data.limit - data.used),
        expiry: data.expiryStr || 'Never',
        created: data.created,
        unlimited: data.unlimited,
        status: (() => {
            if (data.expiry && isKeyExpired(data.expiry)) return 'expired';
            if (!data.unlimited && data.used >= data.limit) return 'exhausted';
            return 'active';
        })()
    }));
    
    res.json({ success: true, total: keysList.length, keys: keysList });
});

app.delete('/admin/custom-key/:key', requireAdminAuth, (req, res) => {
    const keyToDelete = req.params.key;
    
    if (customGeneratedKeys[keyToDelete]) {
        delete customGeneratedKeys[keyToDelete];
        return res.json({ success: true, message: '✅ Key deleted successfully!' });
    }
    
    res.status(404).json({ success: false, error: 'Key not found' });
});

app.post('/admin/reset-key-usage/:key', requireAdminAuth, (req, res) => {
    const keyToReset = req.params.key;
    
    if (customGeneratedKeys[keyToReset]) {
        customGeneratedKeys[keyToReset].used = 0;
        return res.json({ success: true, message: '✅ Key usage reset successfully!' });
    }
    
    res.status(404).json({ success: false, error: 'Key not found' });
});

// ========== CUSTOM API MANAGEMENT ==========
app.post('/admin/custom-api', requireAdminAuth, (req, res) => {
    const { slot, api } = req.body;
    
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) {
        return res.status(400).json({ success: false, error: "Invalid slot" });
    }
    
    if (customAPIs[slot].locked) {
        return res.status(403).json({ 
            success: false, 
            error: "🔒 This API slot is LOCKED and cannot be modified!" 
        });
    }
    
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    
    res.json({ success: true, message: "Custom API updated", api: customAPIs[slot] });
});

app.post('/admin/custom-api/clear', requireAdminAuth, (req, res) => {
    const { slot } = req.body;
    
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) {
        return res.status(400).json({ success: false, error: "Invalid slot" });
    }
    
    if (customAPIs[slot].locked) {
        return res.status(403).json({ 
            success: false, 
            error: "🔒 This API slot is LOCKED and cannot be cleared!" 
        });
    }
    
    customAPIs[slot] = {
        ...customAPIs[slot],
        name: `Custom API ${slot + 1}`,
        endpoint: '',
        param: '',
        example: '',
        desc: '',
        realAPI: '',
        visible: false,
        locked: false
    };
    
    res.json({ success: true, message: "✅ Custom API slot cleared", api: customAPIs[slot] });
});

app.post('/admin/custom-api/toggle-lock', requireAdminAuth, (req, res) => {
    const { slot } = req.body;
    
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) {
        return res.status(400).json({ success: false, error: "Invalid slot" });
    }
    
    customAPIs[slot].locked = !customAPIs[slot].locked;
    
    res.json({ 
        success: true, 
        message: `🔒 Slot ${slot + 1} is now ${customAPIs[slot].locked ? 'LOCKED' : 'UNLOCKED'}`,
        locked: customAPIs[slot].locked 
    });
});

app.get('/admin/custom-apis', requireAdminAuth, (req, res) => {
    res.json({ success: true, customAPIs });
});

// ========== PUBLIC HTML PAGES ==========

function getAdminLoginPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 BRONX ADMIN LOGIN</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #0a0a0a, #1a0033);
            font-family: 'Courier New', monospace;
        }
        .login-container {
            background: rgba(10,10,10,0.95);
            border: 3px solid;
            border-image: linear-gradient(45deg, #ff00ff, #00ff41) 1;
            border-radius: 30px;
            padding: 50px 40px;
            width: 400px;
            box-shadow: 0 0 60px #ff00ff66;
        }
        h1 {
            text-align: center;
            color: #00ff41;
            font-size: 32px;
            margin-bottom: 10px;
            text-shadow: 0 0 30px #00ff41;
        }
        .subtitle {
            text-align: center;
            color: #ff00ff;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .input-group {
            margin-bottom: 25px;
        }
        .input-group label {
            display: block;
            color: #ffff00;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .input-group input {
            width: 100%;
            padding: 15px;
            background: #000;
            border: 2px solid #00ff41;
            border-radius: 12px;
            color: #00ff41;
            font-size: 16px;
            font-family: 'Courier New', monospace;
            outline: none;
        }
        .input-group input:focus {
            border-color: #ff00ff;
            box-shadow: 0 0 20px #ff00ff66;
        }
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            border: none;
            border-radius: 12px;
            color: #000;
            font-weight: bold;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 0 30px #ff00ff66;
        }
        button:hover {
            transform: scale(1.02);
            box-shadow: 0 0 50px #00ff41;
        }
        .error-message {
            color: #ff0000;
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
        }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: #00ff41;
            text-decoration: none;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>🔐 BRONX ADMIN</h1>
        <div class="subtitle">CUSTOM KEY GENERATOR ACCESS</div>
        
        <div class="input-group">
            <label>👤 USERNAME</label>
            <input type="text" id="username" placeholder="Enter admin username">
        </div>
        
        <div class="input-group">
            <label>🔑 PASSWORD</label>
            <input type="password" id="password" placeholder="Enter admin password">
        </div>
        
        <button onclick="login()">🚀 LOGIN TO PANEL</button>
        
        <div id="error" class="error-message"></div>
        
        <div class="back-link">
            <a href="/">← Back to API Home</a>
        </div>
    </div>
    
    <script>
        async function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error');
            
            if (!username || !password) {
                errorDiv.textContent = '❌ Please enter username and password';
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
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = '/admin-panel?token=' + data.token;
                } else {
                    errorDiv.textContent = data.error || '❌ Login failed';
                }
            } catch (err) {
                errorDiv.textContent = '❌ Connection error';
            }
        }
        
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    </script>
</body>
</html>`;
}

function getAdminPanelPage(token) {
    const availableScopes = Object.keys(endpoints);
    const keysList = Object.entries(customGeneratedKeys).map(([key, data]) => ({
        key,
        ...data,
        status: (() => {
            if (data.expiry && isKeyExpired(data.expiry)) return 'expired';
            if (!data.unlimited && data.used >= data.limit) return 'exhausted';
            return 'active';
        })()
    }));
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔧 BRONX ADMIN PANEL</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a0a, #1a0033);
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            color: #fff;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
            background: rgba(10,10,10,0.9);
            border: 2px solid #ff00ff;
            border-radius: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #00ff41;
            text-shadow: 0 0 20px #00ff41;
        }
        .logout-btn {
            padding: 12px 25px;
            background: #ff000020;
            border: 2px solid #ff0000;
            border-radius: 50px;
            color: #ff6b6b;
            cursor: pointer;
            font-weight: bold;
        }
        .logout-btn:hover {
            background: #ff000040;
            box-shadow: 0 0 20px #ff000066;
        }
        .section {
            background: rgba(10,10,10,0.9);
            border: 2px solid #00ff41;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .section h2 {
            color: #ffff00;
            margin-bottom: 25px;
            font-size: 24px;
            border-bottom: 2px solid #ff00ff;
            padding-bottom: 10px;
        }
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
        }
        .form-group label {
            color: #00ff41;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .form-group input {
            padding: 12px;
            background: #000;
            border: 2px solid #00ff41;
            border-radius: 10px;
            color: #00ff41;
            font-size: 14px;
            font-family: 'Courier New', monospace;
        }
        .scope-checkboxes {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            padding: 15px;
            background: #000;
            border: 2px solid #00ff41;
            border-radius: 10px;
            max-height: 200px;
            overflow-y: auto;
        }
        .scope-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #fff;
            padding: 5px 10px;
            background: #1a0033;
            border-radius: 20px;
        }
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }
        .btn-primary {
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            color: #000;
        }
        .btn-danger {
            background: #ff0000;
            color: #fff;
        }
        .btn-warning {
            background: #ffff00;
            color: #000;
        }
        .btn-success {
            background: #00ff41;
            color: #000;
        }
        .btn:hover {
            transform: scale(1.02);
        }
        .key-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 13px;
        }
        .key-table th {
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            color: #000;
            padding: 12px;
        }
        .key-table td {
            padding: 10px;
            border-bottom: 1px solid #ffffff20;
        }
        .status-active { color: #00ff41; }
        .status-expired { color: #ff0000; }
        .status-exhausted { color: #ffff00; }
        .key-code {
            font-family: monospace;
            background: #000;
            padding: 3px 8px;
            border-radius: 5px;
            color: #ff00ff;
        }
        .api-slot {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px;
            background: #1a0033;
            border: 1px solid #00ff41;
            border-radius: 10px;
            margin-bottom: 10px;
        }
        .api-slot.locked {
            border-color: #ff0000;
            background: #33000020;
        }
        .api-info {
            flex: 1;
        }
        .api-actions {
            display: flex;
            gap: 8px;
        }
        .locked-badge {
            background: #ff0000;
            color: #fff;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
        }
        .unlocked-badge {
            background: #00ff41;
            color: #000;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
        }
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #0a0a0a;
            color: #00ff41;
            padding: 15px 30px;
            border-radius: 50px;
            border: 2px solid #00ff41;
            z-index: 9999;
        }
        .token-info {
            background: #1a0033;
            padding: 10px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 12px;
            color: #ffff00;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 BRONX ADMIN PANEL</h1>
            <button class="logout-btn" onclick="logout()">🚪 LOGOUT</button>
        </div>
        
        <div class="token-info">
            🔑 Admin Token: ${token.substring(0, 20)}... (stored in localStorage)
        </div>
        
        <div class="section">
            <h2>🔑 CUSTOM KEY GENERATOR</h2>
            
            <div class="form-grid">
                <div class="form-group">
                    <label>👤 Owner Name *</label>
                    <input type="text" id="keyName" placeholder="e.g., John Doe">
                </div>
                
                <div class="form-group">
                    <label>📅 Expiry Date (DD-MM-YYYY)</label>
                    <input type="text" id="keyExpiry" placeholder="31-12-2026">
                </div>
                
                <div class="form-group">
                    <label>📊 Request Limit</label>
                    <input type="number" id="keyLimit" placeholder="100" value="100">
                </div>
                
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="keyUnlimited"> ♾️ Unlimited Requests
                    </label>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label>🎯 Select Scopes *</label>
                <div class="scope-checkboxes" id="scopeCheckboxes">
                    ${availableScopes.map(scope => `
                        <label class="scope-item">
                            <input type="checkbox" value="${scope}"> ${scope}
                        </label>
                    `).join('')}
                    <label class="scope-item">
                        <input type="checkbox" value="*" id="allScopes"> ⭐ ALL SCOPES
                    </label>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="generateKey()">🔨 GENERATE CUSTOM KEY</button>
            
            <div style="margin-top: 30px;">
                <h3 style="color: #00ff41; margin-bottom: 15px;">📋 GENERATED KEYS LIST</h3>
                <button class="btn btn-success" style="margin-bottom: 15px;" onclick="loadKeys()">🔄 Refresh Keys</button>
                <table class="key-table">
                    <thead>
                        <tr>
                            <th>API Key</th>
                            <th>Owner</th>
                            <th>Scopes</th>
                            <th>Limit</th>
                            <th>Used</th>
                            <th>Remaining</th>
                            <th>Expiry</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="keysTableBody">
                        <tr><td colspan="9" style="text-align: center; padding: 30px;">Click Refresh to load keys</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="section">
            <h2>🔧 CUSTOM API MANAGER (10 Slots)</h2>
            <p style="color: #ffff00; margin-bottom: 20px;">⚠️ Slots 1-5 are LOCKED. Slots 6-10 are editable.</p>
            
            <button class="btn btn-success" style="margin-bottom: 15px;" onclick="loadAPIs()">🔄 Refresh APIs</button>
            
            <div id="apiSlotsContainer">
                <p style="color: #888;">Click Refresh to load API slots...</p>
            </div>
            
            <div id="editForm" style="display: none; margin-top: 30px; padding: 20px; background: #1a0033; border-radius: 15px;">
                <h3 style="color: #00ff41; margin-bottom: 20px;">✏️ Edit API Slot</h3>
                <input type="hidden" id="editSlotIndex">
                <div class="form-grid">
                    <div class="form-group"><label>API Name</label><input type="text" id="editApiName"></div>
                    <div class="form-group"><label>Endpoint</label><input type="text" id="editApiEndpoint"></div>
                    <div class="form-group"><label>Parameter</label><input type="text" id="editApiParam"></div>
                    <div class="form-group"><label>Example Value</label><input type="text" id="editApiExample"></div>
                    <div class="form-group"><label>Description</label><input type="text" id="editApiDesc"></div>
                    <div class="form-group"><label>Real API URL</label><input type="text" id="editApiRealUrl"></div>
                </div>
                <button class="btn btn-primary" onclick="saveAPIEdit()">💾 Save Changes</button>
                <button class="btn" onclick="cancelEdit()">❌ Cancel</button>
            </div>
        </div>
    </div>
    
    <script>
        const adminToken = localStorage.getItem('adminToken') || '${token}';
        let currentAPIs = [];
        
        function showToast(message, isError = false) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.style.color = isError ? '#ff0000' : '#00ff41';
            toast.innerHTML = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        async function logout() {
            await fetch('/admin/logout', {
                method: 'POST',
                headers: { 'x-admin-token': adminToken }
            });
            localStorage.removeItem('adminToken');
            window.location.href = '/';
        }
        
        async function apiCall(endpoint, method = 'GET', body = null) {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }
            };
            if (body) options.body = JSON.stringify(body);
            
            const response = await fetch(endpoint, options);
            return response.json();
        }
        
        async function generateKey() {
            const name = document.getElementById('keyName').value;
            const expiryDate = document.getElementById('keyExpiry').value;
            const requestLimit = document.getElementById('keyLimit').value;
            const unlimited = document.getElementById('keyUnlimited').checked;
            
            const scopes = Array.from(document.querySelectorAll('#scopeCheckboxes input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            
            if (!name) return showToast('❌ Owner name required!', true);
            if (scopes.length === 0) return showToast('❌ Select at least one scope!', true);
            
            const data = await apiCall('/admin/generate-key', 'POST', { name, expiryDate, requestLimit, scopes, unlimited });
            
            if (data.success) {
                showToast('✅ Key generated: ' + data.key);
                loadKeys();
            } else {
                showToast('❌ ' + data.error, true);
            }
        }
        
        async function loadKeys() {
            const data = await apiCall('/admin/custom-keys');
            const tbody = document.getElementById('keysTableBody');
            
            if (data.success && data.keys.length > 0) {
                tbody.innerHTML = data.keys.map(k => `
                    <tr>
                        <td><code class="key-code">${k.key}</code></td>
                        <td>${k.name}</td>
                        <td>${k.scopes.includes('*') ? 'ALL' : k.scopes.slice(0, 2).join(', ') + (k.scopes.length > 2 ? '...' : '')}</td>
                        <td>${k.unlimited ? '∞' : k.limit}</td>
                        <td>${k.used}</td>
                        <td>${k.unlimited ? '∞' : k.remaining}</td>
                        <td>${k.expiry}</td>
                        <td class="status-${k.status}">${k.status.toUpperCase()}</td>
                        <td>
                            <button class="btn btn-warning" style="padding: 5px 10px;" onclick="resetKey('${k.key}')">🔄</button>
                            <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteKey('${k.key}')">🗑️</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 30px;">No custom keys yet</td></tr>';
            }
        }
        
        async function deleteKey(key) {
            if (!confirm('Delete this key?')) return;
            const data = await apiCall('/admin/custom-key/' + encodeURIComponent(key), 'DELETE');
            if (data.success) { showToast('✅ Key deleted!'); loadKeys(); }
            else showToast('❌ ' + data.error, true);
        }
        
        async function resetKey(key) {
            const data = await apiCall('/admin/reset-key-usage/' + encodeURIComponent(key), 'POST');
            if (data.success) { showToast('✅ Usage reset!'); loadKeys(); }
            else showToast('❌ ' + data.error, true);
        }
        
        async function loadAPIs() {
            const data = await apiCall('/admin/custom-apis');
            const container = document.getElementById('apiSlotsContainer');
            
            if (data.success) {
                currentAPIs = data.customAPIs;
                container.innerHTML = currentAPIs.map((api, i) => `
                    <div class="api-slot ${api.locked ? 'locked' : ''}">
                        <div class="api-info">
                            <strong style="color: #ff00ff;">Slot ${api.id}</strong> - 
                            <span style="color: #fff;">${api.name}</span>
                            <code style="color: #00ff41; margin-left: 10px;">/${api.endpoint || 'not-set'}</code>
                            <span style="margin-left: 10px;">${api.visible ? '👁️ Visible' : '🔒 Hidden'}</span>
                            <span class="${api.locked ? 'locked-badge' : 'unlocked-badge'}" style="margin-left: 10px;">
                                ${api.locked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
                            </span>
                        </div>
                        <div class="api-actions">
                            ${!api.locked ? `
                                <button class="btn btn-primary" style="padding: 8px 15px;" onclick="editAPISlot(${i})">✏️ Edit</button>
                                <button class="btn btn-danger" style="padding: 8px 15px;" onclick="clearAPISlot(${i})">🗑️ Clear</button>
                            ` : ''}
                            <button class="btn btn-warning" style="padding: 8px 15px;" onclick="toggleLock(${i})">
                                ${api.locked ? '🔓 Unlock' : '🔒 Lock'}
                            </button>
                            <button class="btn btn-success" style="padding: 8px 15px;" onclick="toggleVisibility(${i})">
                                ${api.visible ? '👁️ Hide' : '👁️ Show'}
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        function editAPISlot(index) {
            const api = currentAPIs[index];
            document.getElementById('editSlotIndex').value = index;
            document.getElementById('editApiName').value = api.name || '';
            document.getElementById('editApiEndpoint').value = api.endpoint || '';
            document.getElementById('editApiParam').value = api.param || '';
            document.getElementById('editApiExample').value = api.example || '';
            document.getElementById('editApiDesc').value = api.desc || '';
            document.getElementById('editApiRealUrl').value = api.realAPI || '';
            document.getElementById('editForm').style.display = 'block';
        }
        
        function cancelEdit() {
            document.getElementById('editForm').style.display = 'none';
        }
        
        async function saveAPIEdit() {
            const index = parseInt(document.getElementById('editSlotIndex').value);
            const api = {
                name: document.getElementById('editApiName').value,
                endpoint: document.getElementById('editApiEndpoint').value,
                param: document.getElementById('editApiParam').value,
                example: document.getElementById('editApiExample').value,
                desc: document.getElementById('editApiDesc').value,
                realAPI: document.getElementById('editApiRealUrl').value
            };
            
            const data = await apiCall('/admin/custom-api', 'POST', { slot: index, api });
            if (data.success) { showToast('✅ API saved!'); loadAPIs(); cancelEdit(); }
            else showToast('❌ ' + data.error, true);
        }
        
        async function clearAPISlot(index) {
            if (!confirm('Clear this API slot?')) return;
            const data = await apiCall('/admin/custom-api/clear', 'POST', { slot: index });
            if (data.success) { showToast('✅ Slot cleared!'); loadAPIs(); }
            else showToast('❌ ' + data.error, true);
        }
        
        async function toggleLock(index) {
            const data = await apiCall('/admin/custom-api/toggle-lock', 'POST', { slot: index });
            if (data.success) { showToast(data.message); loadAPIs(); }
            else showToast('❌ ' + data.error, true);
        }
        
        async function toggleVisibility(index) {
            const api = { ...currentAPIs[index], visible: !currentAPIs[index].visible };
            const data = await apiCall('/admin/custom-api', 'POST', { slot: index, api });
            if (data.success) { showToast('✅ Visibility toggled!'); loadAPIs(); }
            else showToast('❌ ' + data.error, true);
        }
        
        document.getElementById('allScopes').addEventListener('change', function() {
            document.querySelectorAll('#scopeCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = this.checked);
        });
        
        // Initial load
        loadKeys();
        loadAPIs();
    </script>
</body>
</html>`;
}

// Main homepage (simplified, keys hidden)
function serveHTML(res) {
    const visibleCustomAPIs = customAPIs.filter(api => api.visible && api.endpoint);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ BRONX OSINT | NEON API</title>
    <style>
        :root {
            --bg-primary: #0a0a0a;
            --bg-card: rgba(10,10,10,0.9);
            --text-primary: #fff;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a0a, #1a0033);
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            color: var(--text-primary);
        }
        .container { max-width: 1300px; margin: 0 auto; padding: 20px; }
        .admin-link {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 9999;
            padding: 12px 20px;
            border-radius: 50px;
            border: 2px solid #ff00ff;
            background: #1a0033;
            color: #ff00ff;
            text-decoration: none;
            font-weight: bold;
        }
        .header {
            text-align: center;
            padding: 40px;
            border: 3px solid;
            border-image: linear-gradient(45deg, #ff00ff, #00ff41) 1;
            border-radius: 30px;
            margin-bottom: 30px;
            background: var(--bg-card);
        }
        .header h1 {
            font-size: 56px;
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .badge-container {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        .badge {
            padding: 10px 25px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid;
        }
        .badge-1 { background: #ff00ff20; color: #ff00ff; border-color: #ff00ff; }
        .badge-2 { background: #00ff4120; color: #00ff41; border-color: #00ff41; }
        .badge-3 { background: #ffff0020; color: #ffff00; border-color: #ffff00; }
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
        }
        .stat-card {
            background: var(--bg-card);
            border: 2px solid;
            border-radius: 20px;
            padding: 20px 35px;
            text-align: center;
        }
        .stat-num { font-size: 42px; font-weight: bold; color: #00ff41; }
        .stat-label { font-size: 12px; letter-spacing: 3px; }
        .auth-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .auth-card {
            background: var(--bg-card);
            border: 2px solid;
            border-radius: 20px;
            padding: 25px;
        }
        .code {
            background: #000;
            border: 1px solid #00ff41;
            border-radius: 12px;
            padding: 15px;
            color: #00ff41;
        }
        .category {
            font-size: 28px;
            font-weight: bold;
            margin: 40px 0 20px;
            color: #ff00ff;
        }
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 18px;
        }
        .endpoint {
            background: var(--bg-card);
            border: 2px solid;
            border-radius: 16px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .endpoint:hover { transform: translateY(-5px); }
        .method {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
        }
        .method.get { background: #00ff4120; color: #00ff41; border: 1px solid #00ff41; }
        .method.custom { background: #ff00ff20; color: #ff00ff; border: 1px solid #ff00ff; }
        .endpoint-name {
            font-size: 22px;
            font-weight: bold;
            margin: 12px 0 8px;
            color: #fff;
        }
        .endpoint-url {
            font-size: 11px;
            color: #ff00ff;
        }
        .param { 
            font-size: 12px; 
            color: #ffff00; 
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #ffffff30;
        }
        .api-panel {
            background: linear-gradient(135deg, #1a0033, #0a0a0a);
            border: 3px solid #ff00ff;
            border-radius: 20px;
            padding: 30px;
            margin: 40px 0;
        }
        .api-panel h2 { color: #00ff41; margin-bottom: 20px; }
        .api-panel .input-group {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .api-panel input, .api-panel select {
            flex: 1;
            padding: 15px;
            background: #0a0a0a;
            border: 2px solid #00ff41;
            border-radius: 50px;
            color: #00ff41;
            font-size: 16px;
        }
        .api-panel button {
            padding: 15px 30px;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            border: none;
            border-radius: 50px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
        }
        .api-result {
            margin-top: 20px;
            padding: 20px;
            background: #000;
            border: 1px solid #00ff41;
            border-radius: 12px;
            max-height: 300px;
            overflow-y: auto;
            color: #00ff41;
        }
        .footer {
            text-align: center;
            padding: 40px;
            margin-top: 50px;
            border-top: 2px solid #ff00ff;
        }
        .key-notice {
            background: linear-gradient(135deg, #ff00ff10, #00ff4110);
            border: 2px solid #ff00ff;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            color: #00ff41;
        }
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #0a0a0a;
            color: #00ff41;
            padding: 15px 30px;
            border-radius: 50px;
            border: 2px solid #00ff41;
            z-index: 9999;
        }
        @media (max-width: 768px) {
            .header h1 { font-size: 32px; }
        }
    </style>
</head>
<body>
    <a href="/admin-panel" class="admin-link">🔐 ADMIN PANEL</a>

    <div class="container">
        <div class="header">
            <h1>⚡ BRONX OSINT ⚡</h1>
            <div class="badge-container">
                <span class="badge badge-1">🔐 NEON INTELLIGENCE</span>
                <span class="badge badge-2">🌐 PREMIUM API</span>
                <span class="badge badge-3">🔧 CUSTOM APIs</span>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-num">${Object.keys(endpoints).length + visibleCustomAPIs.length}</div>
                <div class="stat-label">ENDPOINTS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">10</div>
                <div class="stat-label">CUSTOM SLOTS</div>
            </div>
        </div>
        
        <div class="key-notice">
            <div>🔑 CONTACT @BRONX_ULTRA ON TELEGRAM TO GET API KEY</div>
            <div style="margin-top: 10px; font-size: 14px;">Use /key-info?key=YOUR_KEY to check your key details</div>
        </div>
        
        <div class="auth-grid">
            <div class="auth-card">
                <h3>🔐 AUTHENTICATION</h3>
                <div class="code">GET /api/key-bronx/number?key=YOUR_KEY&num=9876543210</div>
            </div>
            <div class="auth-card">
                <h3>📊 CHECK QUOTA</h3>
                <div class="code">GET /quota?key=YOUR_KEY</div>
            </div>
            <div class="auth-card">
                <h3>🔑 KEY INFO</h3>
                <div class="code">GET /key-info?key=YOUR_KEY</div>
            </div>
        </div>
        
        <div class="api-panel">
            <h2>🧪 API TESTING PANEL</h2>
            <div class="input-group">
                <select id="endpointSelect">
                    <optgroup label="📱 Built-in APIs">
                        ${Object.entries(endpoints).map(([name, ep]) => `<option value="${name}">${name.toUpperCase()} - ${ep.desc}</option>`).join('')}
                    </optgroup>
                    ${visibleCustomAPIs.length > 0 ? `
                        <optgroup label="🔧 Custom APIs">
                            ${visibleCustomAPIs.map(api => `<option value="custom_${api.id}" data-custom="true" data-endpoint="${api.endpoint}" data-param="${api.param}">🔧 ${api.name}</option>`).join('')}
                        </optgroup>
                    ` : ''}
                </select>
                <input type="text" id="apiKeyInput" placeholder="Enter API Key">
                <input type="text" id="paramInput" placeholder="Parameter Value">
                <button onclick="testAPI()">🚀 TEST API</button>
            </div>
            <div id="apiResult" class="api-result" style="display:none;"></div>
        </div>
        
        ${Object.entries({
            '📱 Phone Intelligence': ['number', 'aadhar', 'name', 'numv2', 'adv'],
            '💰 Financial': ['upi', 'ifsc', 'pan'],
            '📍 Location': ['pincode', 'ip'],
            '🚗 Vehicle': ['vehicle', 'rc'],
            '🎮 Gaming': ['ff', 'bgmi'],
            '🌐 Social': ['insta', 'git', 'tg'],
            '🇵🇰 Pakistan': ['pk', 'pkv2']
        }).map(([cat, names]) => `
            <div class="category">${cat}</div>
            <div class="endpoint-grid">
                ${names.filter(n => endpoints[n]).map(name => {
                    const ep = endpoints[name];
                    return `
                    <div class="endpoint" onclick="copyUrl('${name}', '${ep.param}', '${ep.example}')">
                        <span class="method get">GET</span>
                        <div class="endpoint-name">/${name}</div>
                        <div class="endpoint-url">/api/key-bronx/${name}</div>
                        <div class="param">📝 ${ep.desc}</div>
                        <div class="param">🔑 ${ep.param}=${ep.example}</div>
                    </div>
                `}).join('')}
            </div>
        `).join('')}
        
        ${visibleCustomAPIs.length > 0 ? `
            <div class="category">🔧 Custom APIs</div>
            <div class="endpoint-grid">
                ${visibleCustomAPIs.map(api => `
                    <div class="endpoint" onclick="copyCustomUrl('${api.endpoint}', '${api.param}', '${api.example}')">
                        <span class="method custom">CUSTOM</span>
                        <div class="endpoint-name">/${api.endpoint}</div>
                        <div class="endpoint-url">/api/custom/${api.endpoint}</div>
                        <div class="param">📝 ${api.desc}</div>
                        <div class="param">🔑 ${api.param}=${api.example}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="footer">
            <p style="color: #ff00ff;">Powered by @BRONX_ULTRA</p>
            <p style="color: #00ff41;">🇮🇳 India Time Zone | Premium Keys | Custom API Support</p>
        </div>
    </div>
    
    <script>
        const endpoints = ${JSON.stringify(endpoints)};
        
        function copyUrl(endpoint, param, example) {
            const url = location.origin + '/api/key-bronx/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example;
            navigator.clipboard.writeText(url);
            showToast('✅ URL Copied!');
        }
        
        function copyCustomUrl(endpoint, param, example) {
            const url = location.origin + '/api/custom/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example;
            navigator.clipboard.writeText(url);
            showToast('✅ Custom API URL Copied!');
        }
        
        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        }
        
        async function testAPI() {
            const select = document.getElementById('endpointSelect');
            const selected = select.options[select.selectedIndex];
            const isCustom = selected.dataset.custom === 'true';
            const apiKey = document.getElementById('apiKeyInput').value;
            const paramValue = document.getElementById('paramInput').value;
            const resultDiv = document.getElementById('apiResult');
            
            if (!apiKey) return showToast('❌ Enter API Key');
            if (!paramValue) return showToast('❌ Enter parameter value');
            
            let url;
            if (isCustom) {
                url = '/api/custom/' + selected.dataset.endpoint + '?key=' + apiKey + '&' + selected.dataset.param + '=' + paramValue;
            } else {
                const ep = endpoints[select.value];
                url = '/api/key-bronx/' + select.value + '?key=' + apiKey + '&' + ep.param + '=' + paramValue;
            }
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '⏳ Loading...';
            
            try {
                const res = await fetch(url);
                const data = await res.json();
                resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (err) {
                resultDiv.innerHTML = '<pre style="color: #ff0000;">Error: ' + err.message + '</pre>';
            }
        }
        
        document.getElementById('endpointSelect').addEventListener('change', function() {
            const selected = this.options[this.selectedIndex];
            if (selected.dataset.custom) {
                document.getElementById('paramInput').placeholder = selected.dataset.param;
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

app.get('/admin-panel', (req, res) => {
    const token = req.query.token;
    if (token && verifyAdminToken(token)) {
        res.send(getAdminPanelPage(token));
    } else {
        res.send(getAdminLoginPage());
    }
});

app.get('/test', (req, res) => {
    res.json({ 
        status: '✅ BRONX OSINT API Running', 
        credit: '@BRONX_ULTRA', 
        time: getIndiaDateTime()
    });
});

app.get('/key-info', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    
    let keyData = keyStorage[apiKey] || customGeneratedKeys[apiKey];
    
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "Key not found" });
    }
    
    const now = getIndiaTime();
    const isExpired = keyData.expiry && now > keyData.expiry;
    const isExhausted = !keyData.unlimited && keyData.used >= keyData.limit;
    
    res.json({
        success: true,
        key: apiKey,
        owner: keyData.name,
        scopes: keyData.scopes,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit,
        used: keyData.used,
        remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used),
        expiry: keyData.expiryStr || 'Never',
        status: isExpired ? 'expired' : (isExhausted ? 'exhausted' : 'active')
    });
});

app.get('/quota', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    
    const keyData = keyStorage[apiKey] || customGeneratedKeys[apiKey];
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "Key not found" });
    }
    
    res.json({ 
        success: true,
        key: apiKey,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit, 
        used: keyData.used, 
        remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used)
    });
});

app.get('/api/custom/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    
    const customAPI = customAPIs.find(api => api.endpoint === endpoint && api.visible);
    if (!customAPI) {
        return res.status(404).json({ success: false, error: `Custom endpoint not found: ${endpoint}` });
    }
    
    if (!apiKey) {
        return res.status(401).json({ success: false, error: "API Key Required" });
    }
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) {
        return res.status(403).json({ success: false, error: keyCheck.error });
    }
    
    const paramValue = req.query[customAPI.param];
    if (!paramValue) {
        return res.status(400).json({ 
            success: false, 
            error: `Missing parameter: ${customAPI.param}`
        });
    }
    
    try {
        const realUrl = customAPI.realAPI.replace('{param}', encodeURIComponent(paramValue));
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        incrementKeyUsage(apiKey);
        
        const cleanedData = cleanResponse(response.data);
        cleanedData.api_info = {
            powered_by: "@BRONX_ULTRA",
            endpoint: endpoint,
            timestamp: getIndiaDateTime()
        };
        
        res.json(cleanedData);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    
    if (!endpoints[endpoint]) {
        return res.status(404).json({ success: false, error: `Endpoint not found: ${endpoint}` });
    }
    
    if (!apiKey) {
        return res.status(401).json({ success: false, error: "API Key Required" });
    }
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) {
        return res.status(403).json({ success: false, error: keyCheck.error });
    }
    
    const keyData = keyCheck.keyData;
    
    const scopeCheck = checkKeyScope(keyData, endpoint);
    if (!scopeCheck.valid) {
        return res.status(403).json({ success: false, error: scopeCheck.error });
    }
    
    const ep = endpoints[endpoint];
    const paramValue = req.query[ep.param];
    
    if (!paramValue) {
        return res.status(400).json({ 
            success: false, 
            error: `Missing parameter: ${ep.param}`
        });
    }
    
    try {
        const realUrl = `${REAL_API_BASE}/${endpoint}?key=${REAL_API_KEY}&${ep.param}=${encodeURIComponent(paramValue)}`;
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        const updatedKey = incrementKeyUsage(apiKey);
        
        const cleanedData = cleanResponse(response.data);
        cleanedData.api_info = {
            powered_by: "@BRONX_ULTRA",
            endpoint: endpoint,
            remaining: updatedKey.unlimited ? 'Unlimited' : Math.max(0, updatedKey.limit - updatedKey.used),
            timestamp: getIndiaDateTime()
        };
        
        res.json(cleanedData);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "Endpoint not found" });
});

module.exports = app;
