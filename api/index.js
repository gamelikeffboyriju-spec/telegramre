const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.onrender.com/api';
const REAL_API_KEY = 'nobita';

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
    const indiaTime = getIndiaTime();
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59);
}

// ========== ENHANCED KEY STORAGE ==========
let keyStorage = {};

// ========== UNLIMITED MASTER KEY ==========
keyStorage['BRONX_ULTRA_MASTER_2026'] = {
    name: '👑 BRONX ULTRA OWNER',
    scopes: ['*'],
    type: 'owner',
    limit: Infinity,
    used: 0,
    expiry: null,
    created: getIndiaDateTime(),
    resetType: 'never',
    unlimited: true
};

// ========== 49 PREMIUM KEYS WITH LIMITS & EXPIRY ==========
const premiumKeys = [
    { key: 'PREMIUM_NUMBER_001', name: '📱 Number Hunter Pro', scopes: ['number', 'numv2', 'adv'], limit: 100, expiry: '31-12-2026' },
    { key: 'PREMIUM_AADHAR_001', name: '🆔 Aadhar Master', scopes: ['aadhar'], limit: 50, expiry: '30-06-2026' },
    { key: 'PREMIUM_SOCIAL_001', name: '🌐 Social Intel', scopes: ['insta', 'git', 'tg'], limit: 200, expiry: '31-12-2026' },
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
        unlimited: false
    };
});

// ========== ADDITIONAL DEMO/TEST KEYS ==========
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
    unlimited: false
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
    unlimited: false
};

// ========== KEY MANAGEMENT FUNCTIONS ==========
function checkKeyValid(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) {
        return { valid: false, error: '❌ Invalid API Key. Contact @BRONX_ULTRA to purchase.' };
    }
    
    // Check expiry
    if (keyData.expiry && isKeyExpired(keyData.expiry)) {
        return { 
            valid: false, 
            error: '⏰ Your Key has EXPIRED! Please purchase a new key. Contact @BRONX_ULTRA on Telegram.',
            expired: true,
            expiredDate: keyData.expiryStr
        };
    }
    
    // Check limit
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

function getRemainingQuota(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) return 0;
    if (keyData.unlimited) return Infinity;
    return Math.max(0, keyData.limit - keyData.used);
}

// ========== SCOPE CHECK ==========
function checkKeyScope(keyData, endpoint) {
    if (keyData.scopes.includes('*')) return { valid: true };
    if (keyData.scopes.includes(endpoint)) return { valid: true };
    return { 
        valid: false, 
        error: `❌ This key cannot access '${endpoint}'. Allowed scopes: ${keyData.scopes.join(', ')}` 
    };
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

// ========== SERVE ENHANCED HTML UI ==========
function serveHTML(res) {
    const totalKeys = Object.keys(keyStorage).length;
    const premiumCount = Object.values(keyStorage).filter(k => k.type === 'premium').length;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ BRONX OSINT | NEON API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #0a0a0a 100%);
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
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
            background: rgba(10,10,10,0.9);
            backdrop-filter: blur(10px);
            animation: glowPulse 3s infinite;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, #ff00ff10, #00ff4110, #ffff0010, transparent);
            animation: rotate 10s linear infinite;
        }
        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .header h1 {
            font-size: 56px;
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00, #ff6b6b, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 30px #ff00ff66;
            letter-spacing: 5px;
            position: relative;
            z-index: 2;
        }
        .header h1 span {
            display: inline-block;
            animation: flicker 2s infinite;
        }
        @keyframes flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .badge-container {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
            position: relative;
            z-index: 2;
        }
        .badge {
            padding: 10px 25px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
            border: 2px solid;
            animation: badgeGlow 2s infinite;
        }
        .badge-1 { background: #ff00ff20; color: #ff00ff; border-color: #ff00ff; box-shadow: 0 0 20px #ff00ff66; }
        .badge-2 { background: #00ff4120; color: #00ff41; border-color: #00ff41; box-shadow: 0 0 20px #00ff4166; }
        .badge-3 { background: #ffff0020; color: #ffff00; border-color: #ffff00; box-shadow: 0 0 20px #ffff0066; }
        .badge-4 { background: #ff000020; color: #ff6b6b; border-color: #ff0000; box-shadow: 0 0 20px #ff000066; }
        @keyframes badgeGlow {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* Stats */
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .stat-card {
            background: rgba(10,10,10,0.9);
            backdrop-filter: blur(10px);
            border: 2px solid;
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
            color: #fff;
            text-shadow: 0 0 10px currentColor;
        }
        
        /* Limit Alert */
        .limit-alert {
            background: linear-gradient(135deg, #ff00ff10, #00ff4110, #ffff0010);
            border: 2px solid;
            border-image: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00) 1;
            border-radius: 20px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        .limit-alert div:first-child {
            font-size: 20px;
            background: linear-gradient(45deg, #ff00ff, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: bold;
        }
        .reset-time {
            font-weight: bold;
            font-size: 20px;
            color: #00ff41;
            text-shadow: 0 0 20px #00ff41;
        }
        
        /* Owner Section */
        .owner-section {
            background: linear-gradient(135deg, #ffd70020, #ff00ff20);
            border: 3px solid #ffd700;
            border-radius: 20px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
            box-shadow: 0 0 50px #ffd70066;
            animation: ownerPulse 2s infinite;
        }
        @keyframes ownerPulse {
            0%, 100% { box-shadow: 0 0 30px #ffd70066, 0 0 60px #ff00ff33; }
            50% { box-shadow: 0 0 50px #ffd70099, 0 0 80px #ff00ff66; }
        }
        .owner-title {
            font-size: 32px;
            background: linear-gradient(45deg, #ffd700, #ff00ff, #00ff41);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .owner-key {
            font-size: 24px;
            background: #0a0a0a;
            padding: 15px 30px;
            border-radius: 50px;
            display: inline-block;
            border: 2px solid #ffd700;
            color: #ffd700;
            text-shadow: 0 0 20px #ffd700;
            letter-spacing: 3px;
        }
        .unlimited-badge {
            background: #ff00ff;
            color: #000;
            padding: 5px 15px;
            border-radius: 30px;
            font-weight: bold;
            margin-left: 15px;
            font-size: 14px;
        }
        
        /* Auth Grid */
        .auth-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .auth-card {
            background: rgba(10,10,10,0.9);
            backdrop-filter: blur(10px);
            border: 2px solid;
            border-radius: 20px;
            padding: 25px;
            transition: all 0.3s;
        }
        .auth-card:nth-child(1) { border-color: #ff00ff; }
        .auth-card:nth-child(2) { border-color: #00ff41; }
        .auth-card:nth-child(3) { border-color: #ffff00; }
        .auth-card:hover { transform: translateY(-3px); box-shadow: 0 0 40px currentColor; }
        .auth-card h3 {
            color: #fff;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .code {
            background: #000;
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
        .category i { margin-right: 10px; }
        
        /* Endpoint Grid */
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 18px;
        }
        .endpoint {
            background: rgba(10,10,10,0.8);
            backdrop-filter: blur(10px);
            border: 2px solid;
            border-radius: 16px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .endpoint::before {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transition: left 0.5s;
        }
        .endpoint:hover::before { left: 100%; }
        .endpoint:hover { transform: translateY(-5px) scale(1.02); }
        .endpoint[data-category="📱 Phone Intelligence"] { border-color: #ff00ff; }
        .endpoint[data-category="💰 Financial"] { border-color: #00ff41; }
        .endpoint[data-category="📍 Location"] { border-color: #ffff00; }
        .endpoint[data-category="🚗 Vehicle"] { border-color: #ff0000; }
        .endpoint[data-category="🎮 Gaming"] { border-color: #00ffff; }
        .endpoint[data-category="🌐 Social"] { border-color: #ff8800; }
        .endpoint[data-category="🇵🇰 Pakistan"] { border-color: #00ff88; }
        
        .method {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .method.get { background: #00ff4120; color: #00ff41; border: 1px solid #00ff41; }
        .endpoint-name {
            font-size: 22px;
            font-weight: bold;
            margin: 12px 0 8px;
            background: linear-gradient(45deg, #fff, #00ff41);
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
        
        /* Key Info Section */
        .key-info-section {
            margin: 40px 0;
            padding: 30px;
            background: rgba(10,10,10,0.9);
            backdrop-filter: blur(10px);
            border: 2px solid #ff00ff;
            border-radius: 20px;
        }
        .key-info-title {
            font-size: 24px;
            color: #00ff41;
            margin-bottom: 20px;
            text-shadow: 0 0 20px #00ff41;
        }
        .key-table-container {
            max-height: 400px;
            overflow-y: auto;
            border-radius: 12px;
        }
        .key-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        .key-table th {
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            color: #000;
            padding: 12px;
            font-weight: bold;
            position: sticky;
            top: 0;
        }
        .key-table td {
            padding: 10px;
            border-bottom: 1px solid #ffffff20;
            color: #fff;
        }
        .key-table tr:hover { background: #ffffff10; }
        .status-active { color: #00ff41; }
        .status-expired { color: #ff0000; }
        .status-exhausted { color: #ffff00; }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 40px;
            margin-top: 50px;
            border-top: 2px solid;
            border-image: linear-gradient(90deg, #ff00ff, #00ff41, #ffff00, #ff0000) 1;
            background: linear-gradient(180deg, transparent, #0a0a0a);
        }
        .footer p {
            margin: 10px 0;
            font-size: 14px;
        }
        .footer .glow-text {
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 18px;
            font-weight: bold;
        }
        
        /* Toast Notification */
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
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(#ff00ff, #00ff41, #ffff00); border-radius: 10px; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .header h1 { font-size: 32px; }
            .stat-num { font-size: 28px; }
            .owner-key { font-size: 14px; word-break: break-all; }
        }
        
        /* Extra API Operation Panel */
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <span>⚡</span> BRONX OSINT <span>⚡</span>
            </h1>
            <div class="badge-container">
                <span class="badge badge-1">🔐 NEON INTELLIGENCE</span>
                <span class="badge badge-2">🌐 50+ PREMIUM KEYS</span>
                <span class="badge badge-3">👑 UNLIMITED OWNER</span>
                <span class="badge badge-4">⚡ REAL-TIME DATA</span>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-num">${Object.keys(endpoints).length}</div>
                <div class="stat-label">ENDPOINTS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${totalKeys}</div>
                <div class="stat-label">ACTIVE KEYS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">∞</div>
                <div class="stat-label">OWNER LIMIT</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">JSON</div>
                <div class="stat-label">RESPONSE</div>
            </div>
        </div>
        
        <div class="limit-alert">
            <div>⚡ KEY-BASED LIMIT SYSTEM</div>
            <div style="margin-top: 10px;">🔑 Premium Keys: Fixed Lifetime Limits | 👑 Owner: UNLIMITED</div>
            <div style="margin-top: 10px;">⏰ Key Expiry: Auto-checked | 🇮🇳 India Time Zone</div>
        </div>
        
        <div class="owner-section">
            <div class="owner-title">👑 BRONX ULTRA OWNER KEY 👑</div>
            <div>
                <span class="owner-key">BRONX_ULTRA_MASTER_2026</span>
                <span class="unlimited-badge">∞ UNLIMITED ∞</span>
            </div>
            <div style="margin-top: 15px; color: #ffd700; font-size: 14px;">
                ⭐ All Scopes Access | Never Expires | No Request Limit ⭐
            </div>
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
        
        <!-- Extra API Operation Panel -->
        <div class="api-panel">
            <h2>🧪 API TESTING PANEL</h2>
            <div class="input-group">
                <select id="endpointSelect">
                    ${Object.entries(endpoints).map(([name, ep]) => `<option value="${name}">${name.toUpperCase()} - ${ep.desc}</option>`).join('')}
                </select>
                <input type="text" id="apiKeyInput" placeholder="Enter API Key" value="BRONX_ULTRA_MASTER_2026">
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
        
        <div class="key-info-section">
            <div class="key-info-title">🔑 PREMIUM KEYS LIST (49 Keys)</div>
            <div class="key-table-container">
                <table class="key-table">
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Owner</th>
                            <th>Scopes</th>
                            <th>Limit</th>
                            <th>Used</th>
                            <th>Expiry</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="keyTableBody">
                        <!-- Populated by JavaScript -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p class="glow-text">✨ BRONX OSINT API - NEON EDITION ✨</p>
            <p style="color: #ff00ff;">Powered by @BRONX_ULTRA</p>
            <p style="color: #00ff41;">🇮🇳 India Time Zone | 50+ Premium Keys | Unlimited Owner Access</p>
            <p style="color: #ffff00; margin-top: 15px;">⚠️ Keys are lifetime limited - No reset! Contact @BRONX_ULTRA for new keys.</p>
        </div>
    </div>
    
    <script>
        const endpoints = ${JSON.stringify(endpoints)};
        const keyStorage = ${JSON.stringify(keyStorage)};
        
        function copyUrl(endpoint, param, example) {
            const url = window.location.origin + '/api/key-bronx/' + endpoint + '?key=BRONX_ULTRA_MASTER_2026&' + param + '=' + example;
            navigator.clipboard.writeText(url);
            showToast('✅ URL Copied! ' + endpoint.toUpperCase());
        }
        
        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        }
        
        async function testAPI() {
            const endpoint = document.getElementById('endpointSelect').value;
            const apiKey = document.getElementById('apiKeyInput').value;
            const paramValue = document.getElementById('paramInput').value;
            const resultDiv = document.getElementById('apiResult');
            
            if (!paramValue) {
                showToast('❌ Please enter parameter value');
                return;
            }
            
            const ep = endpoints[endpoint];
            const url = '/api/key-bronx/' + endpoint + '?key=' + apiKey + '&' + ep.param + '=' + paramValue;
            
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
        
        function populateKeyTable() {
            const tbody = document.getElementById('keyTableBody');
            const keys = Object.entries(keyStorage).filter(([k, d]) => d.type !== 'owner');
            
            tbody.innerHTML = keys.map(([key, data]) => {
                const now = new Date();
                const expiry = data.expiry ? new Date(data.expiry) : null;
                const isExpired = expiry && now > expiry;
                const isExhausted = !data.unlimited && data.used >= data.limit;
                let status = '✅ Active';
                let statusClass = 'status-active';
                
                if (isExpired) {
                    status = '⏰ Expired';
                    statusClass = 'status-expired';
                } else if (isExhausted) {
                    status = '🛑 Exhausted';
                    statusClass = 'status-exhausted';
                }
                
                const limitDisplay = data.unlimited ? '∞' : data.limit;
                
                return '<tr>' +
                    '<td><code style="color: #ff00ff;">' + key.substring(0, 15) + '...</code></td>' +
                    '<td>' + (data.name || 'User') + '</td>' +
                    '<td style="font-size: 11px;">' + (data.scopes.includes('*') ? 'ALL' : data.scopes.slice(0, 3).join(', ') + (data.scopes.length > 3 ? '...' : '')) + '</td>' +
                    '<td>' + limitDisplay + '</td>' +
                    '<td>' + data.used + '</td>' +
                    '<td>' + (data.expiryStr || 'Never') + '</td>' +
                    '<td class="' + statusClass + '">' + status + '</td>' +
                    '</tr>';
            }).join('');
        }
        
        populateKeyTable();
        
        // Update endpoint select with param placeholder
        document.getElementById('endpointSelect').addEventListener('change', function() {
            const endpoint = this.value;
            const ep = endpoints[endpoint];
            document.getElementById('paramInput').placeholder = ep.param + ' (e.g., ' + ep.example + ')';
        });
        document.getElementById('endpointSelect').dispatchEvent(new Event('change'));
    </script>
</body>
</html>`;
    res.send(html);
}

// ========== EXPRESS ROUTES ==========
app.use(express.json());

app.get('/', (req, res) => serveHTML(res));

app.get('/test', (req, res) => {
    res.json({ 
        status: '✅ BRONX OSINT API Running', 
        credit: '@BRONX_ULTRA', 
        time: getIndiaDateTime(),
        timezone: 'Asia/Kolkata (IST)',
        total_keys: Object.keys(keyStorage).length,
        premium_keys: Object.values(keyStorage).filter(k => k.type === 'premium').length
    });
});

app.get('/keys', (req, res) => {
    const keyList = {};
    for (const [key, data] of Object.entries(keyStorage)) {
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
    res.json({ success: true, total_keys: Object.keys(keyList).length, keys: keyList });
});

app.get('/key-info', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    
    const keyData = keyStorage[apiKey];
    if (!keyData) {
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
    
    const keyData = keyStorage[apiKey];
    if (!keyData) {
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
    
    // Check key validity
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
    
    // Check scope
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
        console.log(`📡 [${getIndiaDateTime()}] ${endpoint} -> ${paramValue} | Key: ${apiKey.substring(0, 8)}...`);
        
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        // Increment usage
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: "Endpoint not found",
        available_endpoints: ["/", "/test", "/keys", "/key-info", "/quota", "/api/key-bronx/:endpoint"],
        contact: "@BRONX_ULTRA"
    });
});

module.exports = app;
