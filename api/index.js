const express = require('express');
const axios = require('axios');
const session = require('express-session');
const crypto = require('crypto');

const app = express();

// ========== SESSION CONFIG ==========
app.use(session({
    secret: 'bronx-ultra-secret-key-2026-' + crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== ADMIN CREDENTIALS ==========
const ADMIN_CREDENTIALS = {
    username: 'BRONX',
    password: 'Bronx' // Change this to your secure password
};

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.onrender.com/api';
const REAL_API_KEY = 'nobita';

// ========== EXTRA CUSTOM APIS (10 Slots - Hidden/Public Toggle with LOCK) ==========
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
        locked: true, // LOCKED - cannot be edited/deleted
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

function getIndiaDate() {
    return getIndiaTime().toISOString().split('T')[0];
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

// ========== UNLIMITED MASTER KEY (HIDDEN FROM PUBLIC) ==========
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

// ========== 49 PREMIUM KEYS ==========
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

// Initialize premium keys
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
        hidden: true, // HIDE ALL PREMIUM KEYS FROM PUBLIC
        isCustom: false
    };
});

// Demo/Test keys - also hidden
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

// ========== AUTH MIDDLEWARE ==========
function requireAuth(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized. Please login first.' });
}

// ========== KEY MANAGEMENT FUNCTIONS ==========
function checkKeyValid(apiKey) {
    const keyData = keyStorage[apiKey] || customGeneratedKeys[apiKey];
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

function getRemainingQuota(apiKey) {
    const keyData = keyStorage[apiKey] || customGeneratedKeys[apiKey];
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

// Generate random API key
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

// ========== AUTH ROUTES ==========
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        req.session.isAuthenticated = true;
        req.session.username = username;
        req.session.loginTime = getIndiaDateTime();
        return res.json({ 
            success: true, 
            message: '✅ Login successful! Welcome BRONX ADMIN!',
            redirect: '/admin-panel'
        });
    }
    
    res.status(401).json({ success: false, error: '❌ Invalid username or password!' });
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/admin/check-auth', (req, res) => {
    res.json({ 
        authenticated: !!req.session.isAuthenticated,
        username: req.session.username || null
    });
});

// ========== CUSTOM KEY GENERATOR ROUTES (PROTECTED) ==========

// Generate new custom key
app.post('/admin/generate-key', requireAuth, (req, res) => {
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

// Get all custom generated keys
app.get('/admin/custom-keys', requireAuth, (req, res) => {
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

// Delete custom key
app.delete('/admin/custom-key/:key', requireAuth, (req, res) => {
    const keyToDelete = req.params.key;
    
    if (customGeneratedKeys[keyToDelete]) {
        delete customGeneratedKeys[keyToDelete];
        return res.json({ success: true, message: '✅ Key deleted successfully!' });
    }
    
    res.status(404).json({ success: false, error: 'Key not found' });
});

// Reset key usage
app.post('/admin/reset-key-usage/:key', requireAuth, (req, res) => {
    const keyToReset = req.params.key;
    
    if (customGeneratedKeys[keyToReset]) {
        customGeneratedKeys[keyToReset].used = 0;
        return res.json({ success: true, message: '✅ Key usage reset successfully!' });
    }
    
    res.status(404).json({ success: false, error: 'Key not found' });
});

// ========== CUSTOM API MANAGEMENT (PROTECTED WITH LOCK) ==========

app.post('/admin/custom-api', requireAuth, (req, res) => {
    const { slot, api } = req.body;
    
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) {
        return res.status(400).json({ success: false, error: "Invalid slot" });
    }
    
    // Check if API is locked
    if (customAPIs[slot].locked) {
        return res.status(403).json({ 
            success: false, 
            error: "🔒 This API slot is LOCKED and cannot be modified! Only unlocked slots can be edited." 
        });
    }
    
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    
    res.json({ success: true, message: "Custom API updated", api: customAPIs[slot] });
});

// Delete custom API (clear it) - only for unlocked slots
app.post('/admin/custom-api/clear', requireAuth, (req, res) => {
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

// Toggle lock on API slot (master function)
app.post('/admin/custom-api/toggle-lock', requireAuth, (req, res) => {
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

app.get('/admin/custom-apis', requireAuth, (req, res) => {
    res.json({ success: true, customAPIs });
});

// ========== PUBLIC ROUTES ==========

app.get('/admin-panel', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.send(loginPage());
    }
    res.send(adminPanelPage(customAPIs, customGeneratedKeys));
});

function loginPage() {
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
            backdrop-filter: blur(10px);
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
            transition: all 0.3s;
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
        .back-link a:hover {
            color: #ff00ff;
        }
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 20px #ff00ff33, 0 0 40px #00ff4133; }
            50% { box-shadow: 0 0 30px #00ff4133, 0 0 50px #ff00ff33; }
        }
        .login-container {
            animation: glowPulse 3s infinite;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>🔐 BRONX ADMIN</h1>
        <div class="subtitle">CUSTOM KEY GENERATOR ACCESS</div>
        
        <div class="input-group">
            <label>👤 USERNAME</label>
            <input type="text" id="username" placeholder="Enter admin username" autocomplete="off">
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
                    window.location.href = '/admin-panel';
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

function adminPanelPage(customAPIs, customKeys) {
    const keysList = Object.entries(customKeys).map(([key, data]) => ({
        key,
        ...data,
        status: (() => {
            if (data.expiry && isKeyExpired(data.expiry)) return 'expired';
            if (!data.unlimited && data.used >= data.limit) return 'exhausted';
            return 'active';
        })()
    }));
    
    const availableScopes = Object.keys(endpoints);
    
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
            backdrop-filter: blur(10px);
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
            transition: all 0.3s;
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
            backdrop-filter: blur(10px);
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
        .form-group input, .form-group select {
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
        .scope-item input {
            width: 18px;
            height: 18px;
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
            box-shadow: 0 0 20px currentColor;
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
            font-weight: bold;
        }
        .key-table td {
            padding: 10px;
            border-bottom: 1px solid #ffffff20;
        }
        .key-table tr:hover {
            background: #ffffff10;
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
            animation: slideIn 0.3s;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 BRONX ADMIN PANEL</h1>
            <button class="logout-btn" onclick="logout()">🚪 LOGOUT</button>
        </div>
        
        <!-- Custom Key Generator Section -->
        <div class="section">
            <h2>🔑 CUSTOM KEY GENERATOR</h2>
            
            <div class="form-grid">
                <div class="form-group">
                    <label>👤 Owner Name *</label>
                    <input type="text" id="keyName" placeholder="e.g., John Doe">
                </div>
                
                <div class="form-group">
                    <label>📅 Expiry Date (DD-MM-YYYY)</label>
                    <input type="text" id="keyExpiry" placeholder="31-12-2026 (leave empty for never)">
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
                        ${keysList.map(k => `
                            <tr id="key-row-${k.key.replace(/[^a-zA-Z0-9]/g, '')}">
                                <td><code class="key-code">${k.key.substring(0, 12)}...</code></td>
                                <td>${k.name}</td>
                                <td>${k.scopes.includes('*') ? 'ALL' : k.scopes.slice(0, 2).join(', ') + (k.scopes.length > 2 ? '...' : '')}</td>
                                <td>${k.unlimited ? '∞' : k.limit}</td>
                                <td>${k.used}</td>
                                <td>${k.unlimited ? '∞' : Math.max(0, k.limit - k.used)}</td>
                                <td>${k.expiryStr || 'Never'}</td>
                                <td class="status-${k.status}">${k.status.toUpperCase()}</td>
                                <td>
                                    <button class="btn btn-warning" style="padding: 5px 10px;" onclick="resetKeyUsage('${k.key}')">🔄 Reset</button>
                                    <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteKey('${k.key}')">🗑️ Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                        ${keysList.length === 0 ? '<tr><td colspan="9" style="text-align: center; padding: 30px;">No custom keys generated yet</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Custom API Manager Section -->
        <div class="section">
            <h2>🔧 CUSTOM API MANAGER (10 Slots)</h2>
            <p style="color: #ffff00; margin-bottom: 20px;">⚠️ Slots 1-5 are LOCKED and cannot be modified. Slots 6-10 are editable.</p>
            
            <div id="apiSlotsContainer">
                ${customAPIs.map((api, index) => `
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
                                <button class="btn btn-primary" style="padding: 8px 15px;" onclick="editAPISlot(${index})">✏️ Edit</button>
                                <button class="btn btn-danger" style="padding: 8px 15px;" onclick="clearAPISlot(${index})">🗑️ Clear</button>
                            ` : `
                                <button class="btn" style="padding: 8px 15px; background: #555; cursor: not-allowed;" disabled>🔒 Locked</button>
                            `}
                            <button class="btn btn-warning" style="padding: 8px 15px;" onclick="toggleLock(${index})">
                                ${api.locked ? '🔓 Unlock' : '🔒 Lock'}
                            </button>
                            <button class="btn btn-success" style="padding: 8px 15px;" onclick="toggleVisibility(${index})">
                                ${api.visible ? '👁️ Hide' : '👁️ Show'}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Edit Form (Hidden by default) -->
            <div id="editForm" style="display: none; margin-top: 30px; padding: 20px; background: #1a0033; border-radius: 15px;">
                <h3 style="color: #00ff41; margin-bottom: 20px;">✏️ Edit API Slot</h3>
                <input type="hidden" id="editSlotIndex">
                <div class="form-grid">
                    <div class="form-group">
                        <label>API Name</label>
                        <input type="text" id="editApiName">
                    </div>
                    <div class="form-group">
                        <label>Endpoint</label>
                        <input type="text" id="editApiEndpoint">
                    </div>
                    <div class="form-group">
                        <label>Parameter</label>
                        <input type="text" id="editApiParam">
                    </div>
                    <div class="form-group">
                        <label>Example Value</label>
                        <input type="text" id="editApiExample">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="editApiDesc">
                    </div>
                    <div class="form-group">
                        <label>Real API URL (use {param})</label>
                        <input type="text" id="editApiRealUrl">
                    </div>
                </div>
                <button class="btn btn-primary" onclick="saveAPIEdit()">💾 Save Changes</button>
                <button class="btn" onclick="cancelEdit()">❌ Cancel</button>
            </div>
        </div>
    </div>
    
    <script>
        const customAPIs = ${JSON.stringify(customAPIs)};
        
        function showToast(message, isError = false) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.style.color = isError ? '#ff0000' : '#00ff41';
            toast.innerHTML = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        async function logout() {
            await fetch('/admin/logout', { method: 'POST' });
            window.location.href = '/';
        }
        
        // Key Generator Functions
        document.getElementById('allScopes').addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('#scopeCheckboxes input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
        
        async function generateKey() {
            const name = document.getElementById('keyName').value;
            const expiryDate = document.getElementById('keyExpiry').value;
            const requestLimit = document.getElementById('keyLimit').value;
            const unlimited = document.getElementById('keyUnlimited').checked;
            
            const scopes = Array.from(document.querySelectorAll('#scopeCheckboxes input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            
            if (!name) {
                showToast('❌ Owner name is required!', true);
                return;
            }
            
            if (scopes.length === 0) {
                showToast('❌ At least one scope must be selected!', true);
                return;
            }
            
            try {
                const response = await fetch('/admin/generate-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, expiryDate, requestLimit, scopes, unlimited })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Key generated: ' + data.key);
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast('❌ ' + data.error, true);
                }
            } catch (err) {
                showToast('❌ Connection error', true);
            }
        }
        
        async function deleteKey(key) {
            if (!confirm('Are you sure you want to delete this key?')) return;
            
            try {
                const response = await fetch('/admin/custom-key/' + encodeURIComponent(key), {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Key deleted!');
                    location.reload();
                } else {
                    showToast('❌ ' + data.error, true);
                }
            } catch (err) {
                showToast('❌ Connection error', true);
            }
        }
        
        async function resetKeyUsage(key) {
            try {
                const response = await fetch('/admin/reset-key-usage/' + encodeURIComponent(key), {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Usage reset!');
                    location.reload();
                } else {
                    showToast('❌ ' + data.error, true);
                }
            } catch (err) {
                showToast('❌ Connection error', true);
            }
        }
        
        // API Slot Functions
        function editAPISlot(index) {
            const api = customAPIs[index];
            if (api.locked) {
                showToast('🔒 This slot is LOCKED!', true);
                return;
            }
            
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
            
            try {
                const response = await fetch('/admin/custom-api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slot: index, api })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ API saved!');
                    location.reload();
                } else {
                    showToast('❌ ' + data.error, true);
                }
            } catch (err) {
                showToast('❌ Connection error', true);
            }
        }
        
        async function clearAPISlot(index) {
            if (!confirm('Clear this API slot?')) return;
            
            try {
                const response = await fetch('/admin/custom-api/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slot: index })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Slot cleared!');
                    location.reload();
                } else {
                    showToast('❌ ' + data.error, true);
                }
            } catch (err) {
                showToast('❌ Connection error', true);
            }
        }
        
        async function toggleLock(index) {
            try {
                const response = await fetch('/admin/custom-api/toggle-lock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slot: index })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast(data.message);
                    location.reload();
                } else {
                    showToast('❌ ' + data.error, true);
                }
            } catch (err) {
                showToast('❌ Connection error', true);
            }
        }
        
        async function toggleVisibility(index) {
            const api = customAPIs[index];
            api.visible = !api.visible;
            
            try {
                const response = await fetch('/admin/custom-api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slot: index, api })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Visibility toggled!');
                    location.reload();
                } else {
                    showToast('❌ ' + data.error, true);
                }
            } catch (err) {
                showToast('❌ Connection error', true);
            }
        }
    </script>
</body>
</html>`;
}

// ========== SERVE ENHANCED HTML UI (MODIFIED - HIDE KEY LIST) ==========
function serveHTML(res) {
    const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length + Object.keys(customGeneratedKeys).length;
    
    // Get visible custom APIs
    const visibleCustomAPIs = customAPIs.filter(api => api.visible && api.endpoint);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ BRONX OSINT | NEON API</title>
    <style>
        /* ========== LIGHT MODE VARIABLES ========== */
        :root {
            --bg-primary: #0a0a0a;
            --bg-secondary: #1a0033;
            --bg-card: rgba(10,10,10,0.9);
            --text-primary: #fff;
            --text-secondary: #00ff41;
            --border-glow: #ff00ff;
            --header-gradient: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #0a0a0a 100%);
            --card-border: 2px solid;
            --code-bg: #000;
            --table-header: linear-gradient(45deg, #ff00ff, #00ff41);
        }
        
        /* ========== LIGHT MODE ========== */
        body.light-mode {
            --bg-primary: #f5f5f5;
            --bg-secondary: #e0e0e0;
            --bg-card: rgba(255,255,255,0.95);
            --text-primary: #1a1a1a;
            --text-secondary: #0066cc;
            --border-glow: #0066cc;
            --header-gradient: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f5f5f5 100%);
            --card-border: 2px solid #0066cc;
            --code-bg: #1e1e1e;
            --table-header: linear-gradient(45deg, #0066cc, #00aa00);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: var(--header-gradient);
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
            color: var(--text-primary);
            transition: all 0.3s ease;
        }
        body::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, transparent 1px, transparent 2px);
            pointer-events: none;
            z-index: 1;
        }
        .container { max-width: 1300px; margin: 0 auto; padding: 20px; position: relative; z-index: 2; }
        
        /* Theme Toggle */
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            gap: 10px;
        }
        .theme-btn {
            padding: 12px 20px;
            border-radius: 50px;
            border: 2px solid;
            cursor: pointer;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        }
        .theme-btn.dark {
            background: #0a0a0a;
            color: #00ff41;
            border-color: #00ff41;
            box-shadow: 0 0 20px #00ff4166;
        }
        .theme-btn.light {
            background: #f5f5f5;
            color: #0066cc;
            border-color: #0066cc;
            box-shadow: 0 0 20px #0066cc66;
        }
        .theme-btn:hover {
            transform: scale(1.1);
        }
        
        /* Admin Link */
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
            backdrop-filter: blur(10px);
            transition: all 0.3s;
        }
        .admin-link:hover {
            box-shadow: 0 0 30px #ff00ff;
            transform: scale(1.05);
        }
        
        /* Animated Background */
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 20px #ff00ff33, 0 0 40px #00ff4133, 0 0 60px #ffff0033; }
            33% { box-shadow: 0 0 30px #00ff4133, 0 0 50px #ff00ff33, 0 0 70px #00ffff33; }
            66% { box-shadow: 0 0 25px #ffff0033, 0 0 45px #ff000033, 0 0 65px #00ff4133; }
        }
        
        /* Header */
        .header {
            text-align: center;
            padding: 40px;
            border: 3px solid;
            border-image: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00, #ff0000) 1;
            border-radius: 30px;
            margin-bottom: 30px;
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            animation: glowPulse 3s infinite;
            position: relative;
            overflow: hidden;
        }
        .header h1 {
            font-size: 56px;
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00, #ff6b6b, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 30px #ff00ff66;
            letter-spacing: 5px;
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
            letter-spacing: 2px;
            border: 2px solid;
        }
        .badge-1 { background: #ff00ff20; color: #ff00ff; border-color: #ff00ff; box-shadow: 0 0 20px #ff00ff66; }
        .badge-2 { background: #00ff4120; color: #00ff41; border-color: #00ff41; box-shadow: 0 0 20px #00ff4166; }
        .badge-3 { background: #ffff0020; color: #ffff00; border-color: #ffff00; box-shadow: 0 0 20px #ffff0066; }
        .badge-4 { background: #ff000020; color: #ff6b6b; border-color: #ff0000; box-shadow: 0 0 20px #ff000066; }
        
        /* Stats */
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .stat-card {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: var(--card-border);
            border-radius: 20px;
            padding: 20px 35px;
            text-align: center;
            transition: all 0.3s;
        }
        .stat-card:nth-child(1) { border-color: #ff00ff; box-shadow: 0 0 30px #ff00ff33; }
        .stat-card:nth-child(2) { border-color: #00ff41; box-shadow: 0 0 30px #00ff4133; }
        .stat-card:nth-child(3) { border-color: #ffff00; box-shadow: 0 0 30px #ffff0033; }
        .stat-card:nth-child(4) { border-color: #ff0000; box-shadow: 0 0 30px #ff000033; }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-num { 
            font-size: 42px; 
            font-weight: bold;
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stat-label { 
            font-size: 12px; 
            letter-spacing: 3px;
            color: var(--text-primary);
            text-shadow: 0 0 10px currentColor;
        }
        
        /* Auth Grid */
        .auth-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .auth-card {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: var(--card-border);
            border-radius: 20px;
            padding: 25px;
            transition: all 0.3s;
        }
        .auth-card:nth-child(1) { border-color: #ff00ff; }
        .auth-card:nth-child(2) { border-color: #00ff41; }
        .auth-card:nth-child(3) { border-color: #ffff00; }
        .auth-card:hover { transform: translateY(-3px); box-shadow: 0 0 40px currentColor; }
        .auth-card h3 {
            color: var(--text-primary);
            margin-bottom: 15px;
            font-size: 20px;
        }
        .code {
            background: var(--code-bg);
            border: 1px solid #00ff41;
            border-radius: 12px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            color: #00ff41;
            box-shadow: inset 0 0 20px #00ff4133;
        }
        
        /* Categories */
        .category {
            font-size: 28px;
            font-weight: bold;
            margin: 40px 0 20px;
            padding-left: 20px;
            border-left: 6px solid;
            background: linear-gradient(90deg, currentColor 0%, transparent 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Endpoint Grid */
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 18px;
        }
        .endpoint {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: 2px solid;
            border-radius: 16px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .endpoint:hover { transform: translateY(-5px) scale(1.02); }
        .endpoint[data-category="📱 Phone Intelligence"] { border-color: #ff00ff; }
        .endpoint[data-category="💰 Financial"] { border-color: #00ff41; }
        .endpoint[data-category="📍 Location"] { border-color: #ffff00; }
        .endpoint[data-category="🚗 Vehicle"] { border-color: #ff0000; }
        .endpoint[data-category="🎮 Gaming"] { border-color: #00ffff; }
        .endpoint[data-category="🌐 Social"] { border-color: #ff8800; }
        .endpoint[data-category="🇵🇰 Pakistan"] { border-color: #00ff88; }
        .endpoint[data-category="🔧 Custom APIs"] { border-color: #ff00ff; background: linear-gradient(135deg, var(--bg-card), #ff00ff10); }
        
        .method {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .method.get { background: #00ff4120; color: #00ff41; border: 1px solid #00ff41; }
        .method.custom { background: #ff00ff20; color: #ff00ff; border: 1px solid #ff00ff; }
        .endpoint-name {
            font-size: 22px;
            font-weight: bold;
            margin: 12px 0 8px;
            background: linear-gradient(45deg, var(--text-primary), #00ff41);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .endpoint-url {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #ff00ff;
            word-break: break-all;
            opacity: 0.9;
        }
        .param { 
            font-size: 12px; 
            color: #ffff00; 
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #ffffff30;
        }
        
        /* API Testing Panel */
        .api-panel {
            background: linear-gradient(135deg, #1a0033, #0a0a0a);
            border: 3px solid #ff00ff;
            border-radius: 20px;
            padding: 30px;
            margin: 40px 0;
            box-shadow: 0 0 60px #ff00ff66;
        }
        .api-panel h2 {
            color: #00ff41;
            font-size: 28px;
            margin-bottom: 20px;
            text-shadow: 0 0 30px #00ff41;
        }
        .api-panel .input-group {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .api-panel input, .api-panel select {
            flex: 1;
            padding: 15px 20px;
            background: #0a0a0a;
            border: 2px solid #00ff41;
            border-radius: 50px;
            color: #00ff41;
            font-size: 16px;
            font-family: 'Courier New', monospace;
        }
        .api-panel button {
            padding: 15px 30px;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            border: none;
            border-radius: 50px;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 0 30px #ff00ff66;
        }
        .api-panel button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 50px #00ff41;
        }
        .api-result {
            margin-top: 20px;
            padding: 20px;
            background: #000;
            border: 1px solid #00ff41;
            border-radius: 12px;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
            color: #00ff41;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 40px;
            margin-top: 50px;
            border-top: 2px solid;
            border-image: linear-gradient(90deg, #ff00ff, #00ff41, #ffff00, #ff0000) 1;
            background: linear-gradient(180deg, transparent, var(--bg-primary));
        }
        .footer p {
            margin: 10px 0;
            font-size: 14px;
            color: var(--text-primary);
        }
        .footer .glow-text {
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 18px;
            font-weight: bold;
        }
        
        /* Toast */
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #0a0a0a, #1a0033);
            color: #00ff41;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: bold;
            border: 2px solid #00ff41;
            box-shadow: 0 0 40px #00ff41;
            animation: slideIn 0.3s, glowPulse 2s infinite;
            z-index: 9999;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* Key Info Notice */
        .key-notice {
            background: linear-gradient(135deg, #ff00ff10, #00ff4110);
            border: 2px solid #ff00ff;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            color: #00ff41;
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 32px; }
            .stat-num { font-size: 28px; }
            .theme-toggle { top: 10px; right: 10px; }
            .admin-link { top: 10px; left: 10px; padding: 8px 15px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <a href="/admin-panel" class="admin-link">🔐 ADMIN PANEL</a>
    
    <div class="theme-toggle">
        <button class="theme-btn dark" onclick="setTheme('dark')">🌙 DARK</button>
        <button class="theme-btn light" onclick="setTheme('light')">☀️ LIGHT</button>
    </div>

    <div class="container">
        <div class="header">
            <h1>
                <span>⚡</span> BRONX OSINT <span>⚡</span>
            </h1>
            <div class="badge-container">
                <span class="badge badge-1">🔐 NEON INTELLIGENCE</span>
                <span class="badge badge-2">🌐 PREMIUM API</span>
                <span class="badge badge-3">🔧 CUSTOM APIs</span>
                <span class="badge badge-4">⚡ REAL-TIME DATA</span>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-num">${Object.keys(endpoints).length + visibleCustomAPIs.length}</div>
                <div class="stat-label">ENDPOINTS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${totalKeys}</div>
                <div class="stat-label">ACTIVE KEYS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">10</div>
                <div class="stat-label">CUSTOM SLOTS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">JSON</div>
                <div class="stat-label">RESPONSE</div>
            </div>
        </div>
        
        <div class="key-notice">
            <div>🔑 PREMIUM KEYS ARE HIDDEN - CONTACT @BRONX_ULTRA ON TELEGRAM TO PURCHASE</div>
            <div style="margin-top: 10px; font-size: 14px;">Use /key-info?key=YOUR_KEY to check your key details</div>
        </div>
        
        <div class="auth-grid">
            <div class="auth-card">
                <h3>🔐 AUTHENTICATION</h3>
                <div class="code">GET /api/key-bronx/number?key=YOUR_KEY&num=9876543210</div>
                <div style="margin-top: 15px; color: #ffff00; font-size: 12px;">Header: x-api-key also supported</div>
            </div>
            <div class="auth-card">
                <h3>📊 CHECK QUOTA</h3>
                <div class="code">GET /quota?key=YOUR_KEY</div>
                <div style="margin-top: 15px; color: #00ff41; font-size: 12px;">Returns remaining requests</div>
            </div>
            <div class="auth-card">
                <h3>🔑 KEY INFO</h3>
                <div class="code">GET /key-info?key=YOUR_KEY</div>
                <div style="margin-top: 15px; color: #ff00ff; font-size: 12px;">Check expiry & limits</div>
            </div>
        </div>
        
        <!-- API Testing Panel -->
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
            '📱 Phone Intelligence': '📱 Phone Intelligence',
            '💰 Financial': '💰 Financial',
            '📍 Location': '📍 Location',
            '🚗 Vehicle': '🚗 Vehicle',
            '🎮 Gaming': '🎮 Gaming',
            '🌐 Social': '🌐 Social',
            '🇵🇰 Pakistan': '🇵🇰 Pakistan'
        }).filter(([_, cat]) => Object.values(endpoints).some(e => e.category === cat)).map(([display, cat]) => `
            <div class="category">${display}</div>
            <div class="endpoint-grid">
                ${Object.entries(endpoints).filter(([_, e]) => e.category === cat).map(([name, ep]) => `
                    <div class="endpoint" data-category="${cat}" onclick="copyUrl('${name}', '${ep.param}', '${ep.example}')">
                        <span class="method get">GET</span>
                        <div class="endpoint-name">/${name}</div>
                        <div class="endpoint-url">/api/key-bronx/${name}</div>
                        <div class="param">📝 ${ep.desc}</div>
                        <div class="param">🔑 ${ep.param}=${ep.example}</div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        ${visibleCustomAPIs.length > 0 ? `
            <div class="category">🔧 Custom APIs</div>
            <div class="endpoint-grid">
                ${visibleCustomAPIs.map(api => `
                    <div class="endpoint" data-category="🔧 Custom APIs" onclick="copyCustomUrl('${api.endpoint}', '${api.param}', '${api.example}')">
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
            <p class="glow-text">✨ BRONX OSINT API - NEON EDITION ✨</p>
            <p style="color: #ff00ff;">Powered by @BRONX_ULTRA</p>
            <p style="color: #00ff41;">🇮🇳 India Time Zone | Premium Keys | Custom API Support</p>
            <p style="color: #ffff00; margin-top: 15px;">⚠️ Contact @BRONX_ULTRA on Telegram for API Keys</p>
        </div>
    </div>
    
    <script>
        const endpoints = ${JSON.stringify(endpoints)};
        
        function setTheme(theme) {
            if (theme === 'light') {
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
            }
        }
        
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        
        function copyUrl(endpoint, param, example) {
            const url = window.location.origin + '/api/key-bronx/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example;
            navigator.clipboard.writeText(url);
            showToast('✅ URL Copied! ' + endpoint.toUpperCase());
        }
        
        function copyCustomUrl(endpoint, param, example) {
            const url = window.location.origin + '/api/custom/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example;
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
            const selectedOption = select.options[select.selectedIndex];
            const isCustom = selectedOption.dataset.custom === 'true';
            const apiKey = document.getElementById('apiKeyInput').value;
            const paramValue = document.getElementById('paramInput').value;
            const resultDiv = document.getElementById('apiResult');
            
            if (!apiKey) {
                showToast('❌ Please enter API Key');
                return;
            }
            
            if (!paramValue) {
                showToast('❌ Please enter parameter value');
                return;
            }
            
            let url;
            if (isCustom) {
                const endpoint = selectedOption.dataset.endpoint;
                const param = selectedOption.dataset.param;
                url = '/api/custom/' + endpoint + '?key=' + apiKey + '&' + param + '=' + paramValue;
            } else {
                const endpoint = select.value;
                const ep = endpoints[endpoint];
                url = '/api/key-bronx/' + endpoint + '?key=' + apiKey + '&' + ep.param + '=' + paramValue;
            }
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '⏳ Loading...';
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                resultDiv.innerHTML = '<pre style="color: #00ff41;">' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                resultDiv.innerHTML = '<pre style="color: #ff0000;">Error: ' + error.message + '</pre>';
            }
        }
        
        document.getElementById('endpointSelect').addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const isCustom = selectedOption.dataset.custom === 'true';
            
            if (isCustom) {
                document.getElementById('paramInput').placeholder = selectedOption.dataset.param;
            } else {
                const endpoint = this.value;
                const ep = endpoints[endpoint];
                document.getElementById('paramInput').placeholder = ep.param + ' (e.g., ' + ep.example + ')';
            }
        });
        document.getElementById('endpointSelect').dispatchEvent(new Event('change'));
    </script>
</body>
</html>`;
    res.send(html);
}

// ========== EXPRESS ROUTES ==========

app.get('/', (req, res) => serveHTML(res));

app.get('/test', (req, res) => {
    res.json({ 
        status: '✅ BRONX OSINT API Running', 
        credit: '@BRONX_ULTRA', 
        time: getIndiaDateTime(),
        timezone: 'Asia/Kolkata (IST)',
        total_keys: Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length + Object.keys(customGeneratedKeys).length,
        custom_apis: customAPIs.filter(api => api.visible).length
    });
});

app.get('/keys', (req, res) => {
    const keyList = {};
    for (const [key, data] of Object.entries(keyStorage)) {
        if (!data.hidden) {
            keyList[key] = { 
                owner: data.name, 
                scopes: data.scopes, 
                type: data.type,
                limit: data.unlimited ? 'Unlimited' : data.limit,
                used: data.used,
                remaining: data.unlimited ? 'Unlimited' : Math.max(0, data.limit - data.used),
                expiry: data.expiryStr || 'Never',
                created: data.created
            };
        }
    }
    // Also include non-hidden custom keys
    for (const [key, data] of Object.entries(customGeneratedKeys)) {
        if (!data.hidden) {
            keyList[key] = { 
                owner: data.name, 
                scopes: data.scopes, 
                type: data.type,
                limit: data.unlimited ? 'Unlimited' : data.limit,
                used: data.used,
                remaining: data.unlimited ? 'Unlimited' : Math.max(0, data.limit - data.used),
                expiry: data.expiryStr || 'Never',
                created: data.created
            };
        }
    }
    res.json({ success: true, total_keys: Object.keys(keyList).length, keys: keyList });
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
        type: keyData.type,
        scopes: keyData.scopes,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit,
        used: keyData.used,
        remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used),
        expiry: keyData.expiryStr || 'Never',
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
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    
    const keyData = keyStorage[apiKey] || customGeneratedKeys[apiKey];
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "Key not found" });
    }
    
    const remaining = keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used);
    
    res.json({ 
        success: true,
        key: apiKey,
        owner: keyData.name,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit, 
        used: keyData.used, 
        remaining: remaining,
        expiry: keyData.expiryStr || 'Never',
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
        return res.status(404).json({ success: false, error: `Custom endpoint not found: ${endpoint}` });
    }
    
    if (!apiKey) {
        return res.status(401).json({ success: false, error: "❌ API Key Required" });
    }
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) {
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
            error: `Missing parameter: ${customAPI.param}`, 
            example: `?key=YOUR_KEY&${customAPI.param}=${customAPI.example}` 
        });
    }
    
    try {
        const realUrl = customAPI.realAPI.replace('{param}', encodeURIComponent(paramValue));
        console.log(`📡 [Custom] ${endpoint} -> ${paramValue}`);
        
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        incrementKeyUsage(apiKey);
        
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
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    
    if (!endpoints[endpoint]) {
        return res.status(404).json({ success: false, error: `Endpoint not found: ${endpoint}`, available_endpoints: Object.keys(endpoints) });
    }
    
    if (!apiKey) {
        return res.status(401).json({ success: false, error: "❌ API Key Required. Use ?key=YOUR_KEY" });
    }
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) {
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
        return res.status(403).json({ success: false, error: scopeCheck.error });
    }
    
    const ep = endpoints[endpoint];
    const paramValue = query[ep.param];
    
    if (!paramValue) {
        return res.status(400).json({ 
            success: false, 
            error: `Missing parameter: ${ep.param}`, 
            example: `?key=YOUR_KEY&${ep.param}=${ep.example}` 
        });
    }
    
    try {
        const realUrl = `${REAL_API_BASE}/${endpoint}?key=${REAL_API_KEY}&${ep.param}=${encodeURIComponent(paramValue)}`;
        console.log(`📡 [${getIndiaDateTime()}] ${endpoint} -> ${paramValue}`);
        
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        const updatedKey = incrementKeyUsage(apiKey);
        
        const cleanedData = cleanResponse(response.data);
        cleanedData.api_info = {
            powered_by: "@BRONX_ULTRA",
            endpoint: endpoint,
            key_owner: keyData.name,
            key_type: keyData.type,
            limit: keyData.unlimited ? 'Unlimited' : keyData.limit,
            used: updatedKey.used,
            remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - updatedKey.used),
            expiry: keyData.expiryStr || 'Never',
            timezone: 'Asia/Kolkata',
            timestamp: getIndiaDateTime()
        };
        
        res.json(cleanedData);
    } catch (error) {
        console.error(`❌ Error [${endpoint}]:`, error.message);
        if (error.response) {
            return res.status(error.response.status).json(cleanResponse(error.response.data));
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: "Endpoint not found",
        available_endpoints: ["/", "/test", "/keys", "/key-info", "/quota", "/api/key-bronx/:endpoint", "/api/custom/:endpoint", "/admin-panel"],
        contact: "@BRONX_ULTRA"
    });
});

// Install required package: npm install express-session

module.exports = app;
