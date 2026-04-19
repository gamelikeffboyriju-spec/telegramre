const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.onrender.com/api';
const REAL_API_KEY = 'nobita';

// ========== KEYS DATABASE ==========
// Format: 
// MASTER KEY: unlimited requests, no expiry, all scopes
// NORMAL KEYS: limited requests, expiry date, specific scopes

const KEYS_DB = {
    // MASTER KEY (Unlimited - Owner only)
    'BRONX_ULTRA_MASTER': {
        type: 'master',
        owner: '@BRONX_ULTRA',
        scopes: ['*'],
        unlimited: true,
        expiry: null,
        requestsUsed: 0,
        requestsLimit: null,
        createdAt: '2026-01-01',
        status: 'active'
    },
    
    // 49 Limited Keys
    'KEY_001': {
        type: 'limited',
        owner: 'User_001',
        scopes: ['number', 'aadhar', 'tg'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 50,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_002': {
        type: 'limited',
        owner: 'User_002',
        scopes: ['number', 'numv2', 'adv'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 100,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_003': {
        type: 'limited',
        owner: 'User_003',
        scopes: ['aadhar', 'pan', 'upi'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 75,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_004': {
        type: 'limited',
        owner: 'User_004',
        scopes: ['insta', 'git', 'tg'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 60,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_005': {
        type: 'limited',
        owner: 'User_005',
        scopes: ['vehicle', 'rc'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 40,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_006': {
        type: 'limited',
        owner: 'User_006',
        scopes: ['ff', 'bgmi'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 80,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_007': {
        type: 'limited',
        owner: 'User_007',
        scopes: ['pincode', 'ip'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 90,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_008': {
        type: 'limited',
        owner: 'User_008',
        scopes: ['number', 'aadhar'],
        unlimited: false,
        expiry: '2026-11-30',
        requestsUsed: 0,
        requestsLimit: 55,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_009': {
        type: 'limited',
        owner: 'User_009',
        scopes: ['pk', 'pkv2'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 45,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_010': {
        type: 'limited',
        owner: 'User_010',
        scopes: ['name', 'number'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 70,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_011': {
        type: 'limited',
        owner: 'User_011',
        scopes: ['upi', 'ifsc'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 65,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_012': {
        type: 'limited',
        owner: 'User_012',
        scopes: ['pan', 'aadhar'],
        unlimited: false,
        expiry: '2026-10-15',
        requestsUsed: 0,
        requestsLimit: 50,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_013': {
        type: 'limited',
        owner: 'User_013',
        scopes: ['insta', 'tg'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 85,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_014': {
        type: 'limited',
        owner: 'User_014',
        scopes: ['number', 'adv'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 95,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_015': {
        type: 'limited',
        owner: 'User_015',
        scopes: ['vehicle', 'pincode'],
        unlimited: false,
        expiry: '2026-09-30',
        requestsUsed: 0,
        requestsLimit: 35,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_016': {
        type: 'limited',
        owner: 'User_016',
        scopes: ['ff', 'bgmi', 'insta'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 120,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_017': {
        type: 'limited',
        owner: 'User_017',
        scopes: ['number', 'numv2'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 110,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_018': {
        type: 'limited',
        owner: 'User_018',
        scopes: ['aadhar', 'pan', 'upi', 'ifsc'],
        unlimited: false,
        expiry: '2026-08-20',
        requestsUsed: 0,
        requestsLimit: 150,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_019': {
        type: 'limited',
        owner: 'User_019',
        scopes: ['tg', 'git'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 40,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_020': {
        type: 'limited',
        owner: 'User_020',
        scopes: ['rc', 'vehicle'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 55,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_021': {
        type: 'limited',
        owner: 'User_021',
        scopes: ['pk', 'pkv2', 'number'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 60,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_022': {
        type: 'limited',
        owner: 'User_022',
        scopes: ['name', 'insta', 'git'],
        unlimited: false,
        expiry: '2026-11-15',
        requestsUsed: 0,
        requestsLimit: 75,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_023': {
        type: 'limited',
        owner: 'User_023',
        scopes: ['number', 'aadhar', 'pan'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 130,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_024': {
        type: 'limited',
        owner: 'User_024',
        scopes: ['ip', 'pincode', 'vehicle'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 45,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_025': {
        type: 'limited',
        owner: 'User_025',
        scopes: ['ff', 'bgmi', 'tg'],
        unlimited: false,
        expiry: '2026-10-10',
        requestsUsed: 0,
        requestsLimit: 100,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_026': {
        type: 'limited',
        owner: 'User_026',
        scopes: ['number', 'numv2', 'adv', 'pk'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 200,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_027': {
        type: 'limited',
        owner: 'User_027',
        scopes: ['aadhar', 'upi', 'ifsc'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 80,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_028': {
        type: 'limited',
        owner: 'User_028',
        scopes: ['insta', 'git', 'tg', 'name'],
        unlimited: false,
        expiry: '2026-09-05',
        requestsUsed: 0,
        requestsLimit: 90,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_029': {
        type: 'limited',
        owner: 'User_029',
        scopes: ['vehicle', 'rc', 'pincode'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 50,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_030': {
        type: 'limited',
        owner: 'User_030',
        scopes: ['number', 'aadhar', 'name'],
        unlimited: false,
        expiry: '2026-11-20',
        requestsUsed: 0,
        requestsLimit: 115,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_031': {
        type: 'limited',
        owner: 'User_031',
        scopes: ['pan', 'upi', 'ifsc'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 70,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_032': {
        type: 'limited',
        owner: 'User_032',
        scopes: ['ff', 'bgmi', 'insta', 'tg'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 140,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_033': {
        type: 'limited',
        owner: 'User_033',
        scopes: ['number', 'adv', 'pkv2'],
        unlimited: false,
        expiry: '2026-08-30',
        requestsUsed: 0,
        requestsLimit: 65,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_034': {
        type: 'limited',
        owner: 'User_034',
        scopes: ['aadhar', 'pan', 'name'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 85,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_035': {
        type: 'limited',
        owner: 'User_035',
        scopes: ['rc', 'vehicle', 'ip'],
        unlimited: false,
        expiry: '2026-10-25',
        requestsUsed: 0,
        requestsLimit: 30,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_036': {
        type: 'limited',
        owner: 'User_036',
        scopes: ['number', 'numv2', 'adv', 'pk', 'pkv2'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 250,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_037': {
        type: 'limited',
        owner: 'User_037',
        scopes: ['insta', 'git', 'tg', 'name', 'number'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 180,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_038': {
        type: 'limited',
        owner: 'User_038',
        scopes: ['aadhar', 'upi', 'pan', 'ifsc'],
        unlimited: false,
        expiry: '2026-09-15',
        requestsUsed: 0,
        requestsLimit: 120,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_039': {
        type: 'limited',
        owner: 'User_039',
        scopes: ['ff', 'bgmi'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 95,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_040': {
        type: 'limited',
        owner: 'User_040',
        scopes: ['vehicle', 'rc', 'pincode', 'ip'],
        unlimited: false,
        expiry: '2026-11-10',
        requestsUsed: 0,
        requestsLimit: 60,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_041': {
        type: 'limited',
        owner: 'User_041',
        scopes: ['number', 'aadhar', 'pan', 'name'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 160,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_042': {
        type: 'limited',
        owner: 'User_042',
        scopes: ['tg', 'git', 'insta'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 55,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_043': {
        type: 'limited',
        owner: 'User_043',
        scopes: ['pk', 'pkv2', 'number', 'adv'],
        unlimited: false,
        expiry: '2026-10-05',
        requestsUsed: 0,
        requestsLimit: 75,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_044': {
        type: 'limited',
        owner: 'User_044',
        scopes: ['upi', 'ifsc', 'pan'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 90,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_045': {
        type: 'limited',
        owner: 'User_045',
        scopes: ['number', 'numv2'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 105,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_046': {
        type: 'limited',
        owner: 'User_046',
        scopes: ['aadhar', 'name', 'insta'],
        unlimited: false,
        expiry: '2026-08-15',
        requestsUsed: 0,
        requestsLimit: 50,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_047': {
        type: 'limited',
        owner: 'User_047',
        scopes: ['ff', 'bgmi', 'tg', 'insta'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 125,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_048': {
        type: 'limited',
        owner: 'User_048',
        scopes: ['vehicle', 'rc', 'pincode'],
        unlimited: false,
        expiry: '2026-09-25',
        requestsUsed: 0,
        requestsLimit: 40,
        createdAt: '2026-01-01',
        status: 'active'
    },
    'KEY_049': {
        type: 'limited',
        owner: 'User_049',
        scopes: ['number', 'aadhar', 'pan', 'upi', 'ifsc'],
        unlimited: false,
        expiry: '2026-12-31',
        requestsUsed: 0,
        requestsLimit: 200,
        createdAt: '2026-01-01',
        status: 'active'
    }
};

// ========== ENDPOINTS ==========
const endpoints = {
    number: { param: 'num', category: 'Phone Intelligence', example: '9876543210', desc: 'Indian Mobile Number Lookup' },
    aadhar: { param: 'num', category: 'Phone Intelligence', example: '393933081942', desc: 'Aadhaar Number Lookup' },
    name: { param: 'name', category: 'Phone Intelligence', example: 'abhiraaj', desc: 'Name to Records Search' },
    numv2: { param: 'num', category: 'Phone Intelligence', example: '6205949840', desc: 'Number Info v2' },
    adv: { param: 'num', category: 'Phone Intelligence', example: '9876543210', desc: 'Advanced Phone Lookup' },
    upi: { param: 'upi', category: 'Financial', example: 'example@ybl', desc: 'UPI ID Verification' },
    ifsc: { param: 'ifsc', category: 'Financial', example: 'SBIN0001234', desc: 'IFSC Code Details' },
    pan: { param: 'pan', category: 'Financial', example: 'AXDPR2606K', desc: 'PAN to GST Search' },
    pincode: { param: 'pin', category: 'Location', example: '110001', desc: 'Pincode Details' },
    ip: { param: 'ip', category: 'Location', example: '8.8.8.8', desc: 'IP Lookup' },
    vehicle: { param: 'vehicle', category: 'Vehicle', example: 'MH02FZ0555', desc: 'Vehicle Registration' },
    rc: { param: 'owner', category: 'Vehicle', example: 'UP92P2111', desc: 'RC Owner Details' },
    ff: { param: 'uid', category: 'Gaming', example: '123456789', desc: 'Free Fire Info' },
    bgmi: { param: 'uid', category: 'Gaming', example: '5121439477', desc: 'BGMI Info' },
    insta: { param: 'username', category: 'Social', example: 'cristiano', desc: 'Instagram Profile' },
    git: { param: 'username', category: 'Social', example: 'ftgamer2', desc: 'GitHub Profile' },
    tg: { param: 'info', category: 'Social', example: 'JAUUOWNER', desc: 'Telegram Lookup' },
    pk: { param: 'num', category: 'Pakistan', example: '03331234567', desc: 'Pakistan Number v1' },
    pkv2: { param: 'num', category: 'Pakistan', example: '3359736848', desc: 'Pakistan Number v2' }
};

// ========== HELPER FUNCTIONS ==========
function getIndiaDate() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate;
}

function isKeyExpired(keyData) {
    if (!keyData.expiry) return false;
    const now = getIndiaDate();
    const expiryDate = new Date(keyData.expiry);
    return now > expiryDate;
}

function checkKeyAndLimits(apiKey, endpoint) {
    // Check if key exists
    if (!KEYS_DB[apiKey]) {
        return { valid: false, error: '❌ Invalid API Key. Purchase new key from @BRONX_ULTRA' };
    }
    
    const keyData = KEYS_DB[apiKey];
    
    // Check if key is expired
    if (isKeyExpired(keyData)) {
        return { valid: false, error: '❌ Your Key expired! Please purchase new key from @BRONX_ULTRA' };
    }
    
    // Check if key is active
    if (keyData.status !== 'active') {
        return { valid: false, error: '❌ Your Key is inactive. Contact @BRONX_ULTRA' };
    }
    
    // For master key - unlimited access
    if (keyData.type === 'master') {
        return { valid: true, keyData };
    }
    
    // For limited keys - check scopes
    if (!keyData.scopes.includes('*') && !keyData.scopes.includes(endpoint)) {
        return { valid: false, error: `❌ This key cannot access '${endpoint}'. Allowed: ${keyData.scopes.join(', ')}` };
    }
    
    // Check request limit
    if (keyData.requestsUsed >= keyData.requestsLimit) {
        return { valid: false, error: `❌ Your request limit exhausted! (${keyData.requestsUsed}/${keyData.requestsLimit}). Purchase new key from @BRONX_ULTRA`, limitExhausted: true };
    }
    
    return { valid: true, keyData };
}

function incrementRequestCount(apiKey) {
    if (KEYS_DB[apiKey] && KEYS_DB[apiKey].type !== 'master') {
        KEYS_DB[apiKey].requestsUsed++;
        return KEYS_DB[apiKey].requestsUsed;
    }
    return null;
}

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
    return cleaned;
}

// ========== SERVE HTML UI ==========
function serveHTML(res) {
    const masterKey = Object.keys(KEYS_DB).find(k => KEYS_DB[k].type === 'master');
    const totalKeys = Object.keys(KEYS_DB).length;
    const activeKeys = Object.values(KEYS_DB).filter(k => k.status === 'active' && !isKeyExpired(k)).length;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX OSINT | NEON API v2.0</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #0a0a0a 100%);
            font-family: 'Courier New', 'Fira Code', monospace;
            min-height: 100vh;
            color: #fff;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, rgba(0,255,65,0.03) 2px, transparent 2px, transparent 6px),
                repeating-linear-gradient(90deg, rgba(255,0,255,0.03) 0px, rgba(255,0,255,0.03) 2px, transparent 2px, transparent 6px);
            pointer-events: none;
            z-index: 0;
        }
        
        .glow-text {
            text-shadow: 0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 20px #00ff41;
        }
        
        .glow-pink {
            text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff;
        }
        
        .glow-yellow {
            text-shadow: 0 0 5px #ffff00, 0 0 10px #ffff00;
        }
        
        .glow-red {
            text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            position: relative;
            z-index: 1;
        }
        
        /* Header */
        .header {
            text-align: center;
            padding: 40px;
            background: rgba(0,0,0,0.7);
            border: 2px solid #00ff41;
            border-radius: 30px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
            animation: borderPulse 2s infinite;
            box-shadow: 0 0 50px rgba(0,255,65,0.3);
        }
        
        @keyframes borderPulse {
            0%, 100% { border-color: #00ff41; box-shadow: 0 0 30px rgba(0,255,65,0.3); }
            50% { border-color: #ff00ff; box-shadow: 0 0 50px rgba(255,0,255,0.5); }
        }
        
        .header h1 {
            font-size: 56px;
            background: linear-gradient(45deg, #00ff41, #ffff00, #ff00ff, #00ff41);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: gradientShift 3s ease infinite;
            letter-spacing: 5px;
        }
        
        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .badge {
            display: inline-block;
            background: linear-gradient(135deg, #00ff4133, #ff00ff33);
            padding: 10px 25px;
            border-radius: 40px;
            font-size: 14px;
            margin-top: 20px;
            border: 1px solid #00ff41;
            animation: glowPulse 2s infinite;
        }
        
        @keyframes glowPulse {
            0%, 100% { border-color: #00ff41; }
            50% { border-color: #ff00ff; }
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
            background: rgba(0,0,0,0.7);
            border: 1px solid;
            border-radius: 15px;
            padding: 20px 40px;
            text-align: center;
            backdrop-filter: blur(5px);
            transition: all 0.3s;
            animation: statGlow 3s infinite;
        }
        
        .stat-card:nth-child(1) { border-color: #00ff41; animation-delay: 0s; }
        .stat-card:nth-child(2) { border-color: #ffff00; animation-delay: 0.5s; }
        .stat-card:nth-child(3) { border-color: #ff00ff; animation-delay: 1s; }
        .stat-card:nth-child(4) { border-color: #ff0000; animation-delay: 1.5s; }
        
        @keyframes statGlow {
            0%, 100% { box-shadow: 0 0 10px currentColor; }
            50% { box-shadow: 0 0 30px currentColor; }
        }
        
        .stat-num { font-size: 42px; font-weight: bold; }
        .stat-label { font-size: 11px; letter-spacing: 2px; margin-top: 5px; }
        
        /* Alert */
        .alert {
            background: linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,255,0,0.2));
            border: 1px solid #ff0000;
            border-radius: 15px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            animation: alertPulse 1s infinite;
        }
        
        @keyframes alertPulse {
            0%, 100% { border-color: #ff0000; }
            50% { border-color: #ffff00; }
        }
        
        .reset-time {
            font-weight: bold;
            font-size: 18px;
            color: #ffff00;
        }
        
        /* Auth Cards */
        .auth-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin: 30px 0;
        }
        
        .auth-card {
            background: rgba(0,0,0,0.8);
            border: 1px solid;
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(5px);
            transition: all 0.3s;
        }
        
        .auth-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,255,65,0.3);
        }
        
        .auth-card.master { border-color: #ff00ff; }
        .auth-card.limited { border-color: #ffff00; }
        
        .code {
            background: #0a0a0a;
            border: 1px solid #00ff41;
            border-radius: 10px;
            padding: 12px;
            font-family: monospace;
            font-size: 11px;
            overflow-x: auto;
            margin: 15px 0;
            color: #00ff41;
        }
        
        .copy-btn {
            background: #00ff4120;
            border: 1px solid #00ff41;
            color: #00ff41;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .copy-btn:hover {
            background: #00ff41;
            color: #0a0a0a;
        }
        
        /* Categories */
        .category {
            font-size: 28px;
            font-weight: bold;
            margin: 40px 0 20px;
            padding-left: 20px;
            border-left: 5px solid;
            animation: categoryGlow 2s infinite;
        }
        
        .category:nth-child(odd) { border-left-color: #00ff41; }
        .category:nth-child(even) { border-left-color: #ff00ff; }
        
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .endpoint {
            background: rgba(0,0,0,0.7);
            border: 1px solid #00ff4133;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
            backdrop-filter: blur(5px);
        }
        
        .endpoint:hover {
            border-color: #00ff41;
            transform: translateY(-3px);
            box-shadow: 0 5px 20px rgba(0,255,65,0.2);
        }
        
        .method {
            background: linear-gradient(135deg, #00ff41, #00aa2a);
            padding: 3px 10px;
            border-radius: 5px;
            font-size: 10px;
            font-weight: bold;
            display: inline-block;
        }
        
        .endpoint-name {
            font-size: 20px;
            font-weight: bold;
            margin: 12px 0;
            color: #00ff41;
        }
        
        .endpoint-url {
            font-family: monospace;
            font-size: 10px;
            color: #ff00ff;
            word-break: break-all;
        }
        
        .param {
            font-size: 11px;
            color: #ffff00;
            margin-top: 10px;
        }
        
        /* Key List */
        .keys-section {
            margin: 50px 0;
        }
        
        .keys-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .key-item {
            background: rgba(0,0,0,0.6);
            border: 1px solid;
            border-radius: 10px;
            padding: 15px;
            font-size: 11px;
        }
        
        .key-item.valid { border-color: #00ff41; }
        .key-item.expired { border-color: #ff0000; opacity: 0.6; }
        
        .footer {
            text-align: center;
            padding: 40px;
            margin-top: 50px;
            border-top: 1px solid #00ff4133;
            font-size: 12px;
        }
        
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #00ff41, #00aa2a);
            color: #0a0a0a;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: bold;
            animation: slideIn 0.3s, fadeOut 0.3s 2.7s;
            z-index: 1000;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; visibility: hidden; }
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 32px; }
            .stat-num { font-size: 28px; }
            .category { font-size: 22px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ BRONX OSINT v2.0</h1>
            <div class="badge">
                <span class="glow-text">🔐 NEON INTELLIGENCE API</span> | 
                <span class="glow-pink">🎯 50 ACTIVE KEYS</span> | 
                <span class="glow-yellow">⚡ UNLIMITED MASTER</span>
            </div>
            <div class="stats">
                <div class="stat-card"><div class="stat-num">${totalKeys}</div><div class="stat-label">TOTAL KEYS</div></div>
                <div class="stat-card"><div class="stat-num">${activeKeys}</div><div class="stat-label">ACTIVE KEYS</div></div>
                <div class="stat-card"><div class="stat-num">${Object.keys(endpoints).length}</div><div class="stat-label">ENDPOINTS</div></div>
                <div class="stat-card"><div class="stat-num">JSON</div><div class="stat-label">RESPONSE</div></div>
            </div>
        </div>
        
        <div class="alert">
            <div>⚠️ <span class="glow-red">LIMITED KEYS:</span> Request limits are PERMANENT (no daily reset)</div>
            <div style="margin-top: 8px;">👑 <span class="glow-pink">MASTER KEY:</span> Unlimited requests | No expiry | All endpoints</div>
            <div style="margin-top: 5px;">🔄 <span class="glow-yellow">EXPIRY SYSTEM:</span> Keys expire on specific dates (India Time)</div>
            <div style="margin-top: 5px;">💡 <span class="reset-time">Purchase new key: @BRONX_ULTRA on Telegram</span></div>
        </div>
        
        <div class="auth-grid">
            <div class="auth-card master">
                <h3 class="glow-pink">👑 MASTER KEY (Unlimited)</h3>
                <div class="code" id="masterKeyCode">BRONX_ULTRA_MASTER</div>
                <button class="copy-btn" onclick="copyText('BRONX_ULTRA_MASTER')">📋 COPY MASTER KEY</button>
                <div style="margin-top: 15px; font-size: 12px;">
                    ✅ Unlimited requests | ✅ No expiry | ✅ All endpoints
                </div>
            </div>
            <div class="auth-card limited">
                <h3 class="glow-yellow">🔑 HOW TO USE</h3>
                <div class="code">GET /api/key-bronx/number?key=YOUR_KEY&num=9876543210</div>
                <div style="margin-top: 10px; font-size: 12px;">
                    📡 Base URL: <span id="baseUrl"></span><br>
                    🔐 Replace YOUR_KEY with any key from list below
                </div>
            </div>
        </div>
        
        <!-- Key List Section -->
        <div class="keys-section">
            <div class="category" style="border-left-color: #ffff00;">🗝️ AVAILABLE KEYS (50 Total)</div>
            <div class="keys-grid" id="keysGrid"></div>
        </div>
        
        ${Object.entries({
            '📱 Phone Intelligence': 'Phone Intelligence',
            '💰 Financial Services': 'Financial',
            '📍 Location Services': 'Location',
            '🚗 Vehicle Records': 'Vehicle',
            '🎮 Gaming Profiles': 'Gaming',
            '🌐 Social Media': 'Social',
            '🇵🇰 Pakistan Services': 'Pakistan'
        }).filter(([_, cat]) => Object.values(endpoints).some(e => e.category === cat)).map(([display, cat]) => `
            <div class="category">${display}</div>
            <div class="endpoint-grid">
                ${Object.entries(endpoints).filter(([_, e]) => e.category === cat).map(([name, ep]) => `
                    <div class="endpoint" onclick="copyUrl('${name}', '${ep.param}', '${ep.example}')">
                        <span class="method">GET</span>
                        <div class="endpoint-name">${name.toUpperCase()}</div>
                        <div class="endpoint-url">/api/key-bronx/${name}</div>
                        <div class="param">📝 ${ep.desc}</div>
                        <div class="param">🔑 ${ep.param}=${ep.example}</div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        <div class="footer">
            <p class="glow-text">✨ BRONX OSINT API v2.0 | Developed by @BRONX_ULTRA</p>
            <p class="glow-yellow">⚡ Master Key: Unlimited | Limited Keys: Permanent limits | Expiry System Active</p>
            <p class="glow-pink">🔐 For new keys & support: Contact @BRONX_ULTRA on Telegram</p>
        </div>
    </div>
    <script>
        const baseUrl = window.location.origin;
        document.getElementById('baseUrl').innerText = baseUrl;
        
        // Generate keys grid
        const keysData = ${JSON.stringify(Object.entries(KEYS_DB).map(([key, data]) => ({
            key: key,
            type: data.type,
            owner: data.owner,
            expiry: data.expiry,
            limit: data.requestsLimit,
            used: data.requestsUsed,
            scopes: data.scopes
        })))};
        
        const keysGrid = document.getElementById('keysGrid');
        const now = new Date();
        
        keysData.forEach(k => {
            const isExpired = k.expiry && new Date(k.expiry) < now;
            const statusClass = isExpired ? 'expired' : 'valid';
            const statusText = isExpired ? '❌ EXPIRED' : (k.type === 'master' ? '👑 MASTER' : '✅ ACTIVE');
            
            const keyDiv = document.createElement('div');
            keyDiv.className = `key-item ${statusClass}`;
            keyDiv.innerHTML = \`
                <div style="font-weight: bold; margin-bottom: 8px;">\${k.key}</div>
                <div>👤 \${k.owner}</div>
                <div>📊 Type: \${k.type.toUpperCase()}</div>
                <div>🔧 Scopes: \${k.scopes.includes('*') ? 'ALL' : k.scopes.join(', ')}</div>
                \${k.limit ? \`<div>📈 Limit: \${k.used}/\${k.limit}</div>\` : '<div>📈 Limit: UNLIMITED</div>'}
                \${k.expiry ? \`<div>⏰ Expiry: \${k.expiry}</div>\` : '<div>⏰ Expiry: NEVER</div>'}
                <div>🔘 Status: \${statusText}</div>
                <button class="copy-btn" style="margin-top: 10px;" onclick="copyText('\${k.key}')">📋 COPY KEY</button>
            \`;
            keysGrid.appendChild(keyDiv);
        });
        
        function copyUrl(endpoint, param, example) {
            const url = baseUrl + '/api/key-bronx/' + endpoint + '?key=BRONX_ULTRA_MASTER&' + param + '=' + example;
            copyText(url);
        }
        
        function copyText(text) {
            navigator.clipboard.writeText(text);
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = '✅ Copied to clipboard!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
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
        status: '✅ BRONX OSINT API v2.0 Running', 
        credit: '@BRONX_ULTRA', 
        time: getIndiaDate().toISOString(),
        totalKeys: Object.keys(KEYS_DB).length,
        masterKey: 'BRONX_ULTRA_MASTER'
    });
});

app.get('/keys', (req, res) => {
    const keyList = {};
    for (const [key, data] of Object.entries(KEYS_DB)) {
        keyList[key] = {
            owner: data.owner,
            type: data.type,
            scopes: data.scopes,
            expiry: data.expiry || 'Never',
            requestsUsed: data.requestsUsed,
            requestsLimit: data.requestsLimit || 'Unlimited',
            status: isKeyExpired(data) ? 'expired' : data.status
        };
    }
    res.json({ success: true, totalKeys: Object.keys(KEYS_DB).length, keys: keyList });
});

app.get('/quota', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    
    if (!KEYS_DB[apiKey]) {
        return res.status(404).json({ error: "Invalid API Key" });
    }
    
    const keyData = KEYS_DB[apiKey];
    const expired = isKeyExpired(keyData);
    
    res.json({
        apiKey: apiKey,
        type: keyData.type,
        limit: keyData.requestsLimit || 'Unlimited',
        used: keyData.requestsUsed || 0,
        remaining: keyData.requestsLimit ? (keyData.requestsLimit - keyData.requestsUsed) : 'Unlimited',
        expiry: keyData.expiry || 'Never',
        expired: expired,
        status: expired ? 'EXPIRED' : 'ACTIVE'
    });
});

app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    
    if (!endpoints[endpoint]) {
        return res.status(404).json({ success: false, error: `Endpoint not found: ${endpoint}` });
    }
    
    if (!apiKey) {
        return res.status(401).json({ success: false, error: "❌ API Key Required. Get keys from @BRONX_ULTRA" });
    }
    
    // Check key validity, expiry, scopes, and limits
    const keyCheck = checkKeyAndLimits(apiKey, endpoint);
    if (!keyCheck.valid) {
        return res.status(403).json({ success: false, error: keyCheck.error });
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
        console.log(`📡 ${endpoint} -> ${paramValue} | Key: ${apiKey.substring(0, 8)}...`);
        
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        // Increment request count for limited keys only
        const usedCount = incrementRequestCount(apiKey);
        
        const cleanedData = cleanResponse(response.data);
        
        // Add key info to response
        const keyData = KEYS_DB[apiKey];
        cleanedData.key_info = {
            key_type: keyData.type,
            remaining_requests: keyData.requestsLimit ? (keyData.requestsLimit - (keyData.requestsUsed || 0)) : 'Unlimited',
            used_requests: keyData.requestsUsed || 0,
            total_limit: keyData.requestsLimit || 'Unlimited',
            expiry: keyData.expiry || 'Never',
            status: isKeyExpired(keyData) ? 'EXPIRED' : 'ACTIVE'
        };
        
        res.json(cleanedData);
    } catch (error) {
        console.error(error.message);
        if (error.response) {
            return res.status(error.response.status).json(cleanResponse(error.response.data));
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;
