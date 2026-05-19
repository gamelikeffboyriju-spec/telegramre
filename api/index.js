// api/index.js - BRONX OSINT v60 ULTRA - ALL IN ONE
const express = require('express');
const axios = require('axios');
const app = express();

const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = process.env.REAL_API_KEY || 'bot-new';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'BRONX_ULTRA';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'king5';
const MASTER_API_KEY = process.env.MASTER_API_KEY || 'BRONX_MASTER_' + Math.random().toString(36).substring(2, 10).toUpperCase();
const STORAGE_URL = 'https://bromx-db-stroge.onrender.com';

let keyStorage = {};
let customAPIs = [];
let requestLogs = [];
let adminSessions = {};
let permanentTokens = {};
let bannedIPs = [];
let cooldownTimers = {};

async function saveToStorage() {
    try { await axios.post(`${STORAGE_URL}/keys`, { keys: keyStorage, apis: customAPIs, tokens: permanentTokens, banned: bannedIPs, logs: requestLogs.slice(-100) }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } }); console.log('💾 Saved! Keys:', Object.keys(keyStorage).length); } catch (e) {}
}
async function loadFromStorage() {
    try {
        const res = await axios.get(`${STORAGE_URL}/keys`, { timeout: 10000 });
        if (res.data) {
            if (res.data.keys && Object.keys(res.data.keys).length > 0) { keyStorage = res.data.keys; if(!keyStorage[MASTER_API_KEY]) keyStorage[MASTER_API_KEY] = createMasterKey(); }
            if (res.data.apis && Array.isArray(res.data.apis) && res.data.apis.length > 0) customAPIs = res.data.apis;
            if (res.data.tokens) { permanentTokens = res.data.tokens; Object.entries(permanentTokens).forEach(([t]) => { adminSessions[t] = { expiresAt: Date.now() + 365*24*60*60*1000, permanent: true }; }); }
            if (res.data.banned) bannedIPs = res.data.banned;
            if (res.data.logs && Array.isArray(res.data.logs)) requestLogs = res.data.logs;
            return Object.keys(keyStorage).length > 0;
        }
        return false;
    } catch (e) { return false; }
}
function scheduleSave() { setTimeout(async () => { await saveToStorage(); }, 2000); }
setInterval(() => scheduleSave(), 2 * 60 * 1000);

function getIndiaTime() { return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)); }
function getIndiaDate() { return getIndiaTime().toISOString().split('T')[0]; }
function getIndiaDateTime() { return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19); }
function isKeyExpired(d) { if (!d || d === 'LIFETIME') return false; return getIndiaTime() > new Date(d); }
function parseExpiryDate(s) { if (!s || s === 'LIFETIME') return null; const p = s.split('-'); if (p.length === 3) return p[0].length === 4 ? new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59) : new Date(+p[2], +p[1] - 1, +p[0], 23, 59, 59); const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
function checkCooldown(k) { const kd = keyStorage[k]; if (!kd || !kd.cooldown) return { allowed: true }; const n = Date.now(); if (cooldownTimers[k] && (n - cooldownTimers[k]) < (kd.cooldown * 1000)) { return { allowed: false, remaining: Math.ceil((kd.cooldown * 1000 - (n - cooldownTimers[k])) / 1000) }; } cooldownTimers[k] = n; return { allowed: true }; }
function checkKeyValid(k) { if (!k) return { valid: false, error: 'Missing key' }; const kd = keyStorage[k]; if (!kd) return { valid: false, error: 'Key not found' }; if (kd.expiry && isKeyExpired(kd.expiry)) return { valid: false, error: 'Expired' }; if (!kd.unlimited && kd.used >= kd.limit) return { valid: false, error: 'Limit reached' }; const cd = checkCooldown(k); if (!cd.allowed) return { valid: false, error: 'Cooldown ' + cd.remaining + 's' }; return { valid: true, keyData: kd }; }
function incrementKeyUsage(k) { if (keyStorage[k] && !keyStorage[k].unlimited) { keyStorage[k].used++; if (keyStorage[k].used % 3 === 0) scheduleSave(); } }
function checkKeyScope(kd, ep) { if (!kd || !kd.scopes) return { valid: false }; if (kd.scopes.includes('*')) return { valid: true }; if (kd.scopes.includes(ep)) return { valid: true }; return { valid: false }; }
function generateToken() { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let t = ''; for (let i = 0; i < 32; i++) t += c.charAt(Math.floor(Math.random() * c.length)); return t; }
function isAdminAuth(t) { if (!t) return false; if (adminSessions[t]) { if (adminSessions[t].permanent) return true; if (Date.now() < adminSessions[t].expiresAt) return true; delete adminSessions[t]; delete permanentTokens[t]; } return false; }
function isIPBanned(ip) { return ip && ip !== 'unknown' && bannedIPs.includes(ip); }
function banIP(ip) { if (ip && ip !== 'unknown' && !bannedIPs.includes(ip)) { bannedIPs.push(ip); scheduleSave(); } }
function unbanIP(ip) { const i = bannedIPs.indexOf(ip); if (i > -1) { bannedIPs.splice(i, 1); scheduleSave(); } }
function sanitizeResponse(d) { if (!d) return d; try { const c = JSON.parse(JSON.stringify(d)); delete c.truecaller_name; delete c.cached; delete c.cached_at; delete c.by; delete c.channel; delete c.developer; delete c.api_key; delete c.real_url; delete c.source_url; delete c.internal_id; c.powered_by = "BRONX_ULTRA"; return c; } catch (e) { return d; } }
function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function detectBrowser(ua) { if(!ua) return {name:'?',device:'?'}; let n='?'; if(ua.includes('Firefox')) n='Firefox'; else if(ua.includes('Chrome')) n='Chrome'; else if(ua.includes('Safari')) n='Safari'; let d='Desktop'; if(ua.includes('Mobile')) d='Mobile'; return {name:n,device:d}; }
function logRequest(key, ep, param, status, ip, ua) { const b = detectBrowser(ua); requestLogs.push({ timestamp: getIndiaDateTime(), key: key ? key.substring(0, 8) + '***' : '?', endpoint: ep, param: param ? param.substring(0, 20) : '', status, ip: ip || '?', browser: b.name, device: b.device }); if (requestLogs.length > 300) requestLogs = requestLogs.slice(-300); if (requestLogs.length % 5 === 0) scheduleSave(); }
function createMasterKey() { return { name:'👑 OWNER',scopes:['*'],type:'owner',limit:999999,used:0,cooldown:0,expiry:null,expiryStr:'LIFETIME',created:getIndiaDateTime(),unlimited:true,hidden:true }; }

function initDefaultData() {
    const now = getIndiaDateTime(); keyStorage = {}; keyStorage[MASTER_API_KEY] = createMasterKey();
    [{ key:'BRONX_DEMO_001',name:'🎁 Premium',scopes:['*'],limit:1000,cooldown:0,expiry:'31-12-2027' },{ key:'BRONX_DEMO_002',name:'🎁 Basic',scopes:['number','aadhar','pan','upi'],limit:500,cooldown:2,expiry:'30-06-2027' },{ key:'BRONX_DEMO_003',name:'🎁 Starter',scopes:['number','ip','pincode'],limit:200,cooldown:1,expiry:'31-12-2027' },{ key:'BRONX_OP_KEY',name:'🎁 OP',scopes:['*'],limit:999,cooldown:0,expiry:'31-12-2027' },{ key:'BRONX_PRO_KEY',name:'🎁 Pro',scopes:['*'],limit:5000,cooldown:0,expiry:'31-12-2028' },{ key:'BRONX_BOMBER',name:'🎁 Bomber',scopes:['number','custom'],limit:300,cooldown:3,expiry:'31-12-2027' }].forEach(d => { keyStorage[d.key] = { name:d.name,scopes:d.scopes,type:'demo',limit:d.limit,used:0,cooldown:d.cooldown||0,expiry:parseExpiryDate(d.expiry),expiryStr:d.expiry,created:now,unlimited:false,hidden:false }; });
}

function initCustomAPIs() {
    customAPIs = [
        { id:1,name:'Number Info',endpoint:'number-advanced',param:'num',example:'9876543210',visible:true,realAPI:'https://num-tg-info-api.vercel.app/info?number={param}' },
        { id:2,name:'Vehicle RC',endpoint:'rc-details',param:'ca_number',example:'MH02FZ0555',visible:true,realAPI:'https://bronx-rc-api.vercel.app/?ca_number={param}' },
        { id:3,name:'Aadhar',endpoint:'aadhar-verify',param:'aadhar',example:'393933081942',visible:true,realAPI:'https://bronx-king-vip999.vercel.app/api/aadhaar?num={param}' },
        { id:4,name:'Email',endpoint:'email-lookup',param:'mail',example:'user@gmail.com',visible:true,realAPI:'https://bronx-king-mail-opi.vercel.app/mail={param}' },
        { id:5,name:'Telegram',endpoint:'telegram-scan',param:'id',example:'7530266953',visible:true,realAPI:'https://bronx-tg-king-bro.vercel.app/tg?key=BRONXop&query={param}' },
        { id:6,name:'SMS Bomber',endpoint:'sms-bomber',param:'number',example:'1234567890',visible:true,realAPI:'https://bronx-sms-api-ulimate.vercel.app/api/key-bronx-paid-vip?number={param}&counter=10' },
        { id:7,name:'Number Backup',endpoint:'num-op',param:'num',example:'9876543210',visible:true,realAPI:'https://tfqdeadlo-inddataapi.hf.space/search?mobile={param}' },
        { id:8,name:'Slot 8',endpoint:'',param:'',example:'',visible:false,realAPI:'' },{ id:9,name:'Slot 9',endpoint:'',param:'',example:'',visible:false,realAPI:'' },{ id:10,name:'Slot 10',endpoint:'',param:'',example:'',visible:false,realAPI:'' }
    ];
}

const endpoints = {
    number:{p:'num',i:'📱',e:'9876543210',d:'Mobile Lookup',c:'phone'},aadhar:{p:'num',i:'🆔',e:'393933081942',d:'Aadhaar Details',c:'phone'},name:{p:'name',i:'🔍',e:'abhiraaj',d:'Name Search',c:'phone'},numv2:{p:'num',i:'📱',e:'6205949840',d:'Number v2',c:'phone'},adv:{p:'num',i:'📱',e:'9876543210',d:'Advanced Intel',c:'phone'},adharfamily:{p:'num',i:'👨‍👩‍👧‍👦',e:'984154610245',d:'Family Details',c:'phone'},adharration:{p:'num',i:'📋',e:'701984830542',d:'Ration Card',c:'phone'},imei:{p:'imei',i:'📱',e:'357817383506298',d:'IMEI Info',c:'phone'},calltracer:{p:'num',i:'📞',e:'9876543210',d:'Call Tracer',c:'phone'},upi:{p:'upi',i:'💰',e:'example@ybl',d:'UPI Lookup',c:'finance'},ifsc:{p:'ifsc',i:'🏦',e:'SBIN0001234',d:'IFSC Details',c:'finance'},pan:{p:'pan',i:'📄',e:'AXDPR2606K',d:'PAN Card',c:'finance'},pincode:{p:'pin',i:'📍',e:'110001',d:'Pincode',c:'location'},ip:{p:'ip',i:'🌐',e:'8.8.8.8',d:'IP Lookup',c:'location'},vehicle:{p:'vehicle',i:'🚗',e:'MH02FZ0555',d:'Vehicle Info',c:'vehicle'},rc:{p:'owner',i:'📋',e:'UP92P2111',d:'RC Owner',c:'vehicle'},ff:{p:'uid',i:'🎮',e:'123456789',d:'Free Fire',c:'gaming'},bgmi:{p:'uid',i:'🎮',e:'5121439477',d:'BGMI',c:'gaming'},insta:{p:'username',i:'📸',e:'cristiano',d:'Instagram',c:'social'},git:{p:'username',i:'💻',e:'ftgamer2',d:'GitHub',c:'social'},tg:{p:'info',i:'📲',e:'JAUUOWNER',d:'Telegram',c:'social'},tgidinfo:{p:'id',i:'📲',e:'7530266953',d:'TG ID Info',c:'social'},snap:{p:'username',i:'👻',e:'priyapanchal272',d:'Snapchat',c:'social'},pk:{p:'num',i:'🇵🇰',e:'03331234567',d:'Pakistan',c:'pakistan'},pkv2:{p:'num',i:'🇵🇰',e:'3359736848',d:'Pakistan v2',c:'pakistan'}
};

const apiExamples = {
    number:{req:'GET /api/key-bronx/number?key=YOUR_KEY&num=7307841587',res:`{
  "success": true,
  "number": "7307841587",
  "total": 2,
  "results": [
    {
      "mobile": "7307841587",
      "name": "Nemsingh",
      "address": "j gram dabhaura simra post sarsava k tilhar Shahjahanpur Uttar Pradesh 242303",
      "circle": "JIO UPE",
      "alternate": "8542812624",
      "father_name": "jayram",
      "aadhar": "226010868980",
      "email": "akaShguptu@gmail.com",
      "truecaller_name": null
    },
    {
      "mobile": "9219059191",
      "name": "Premraj",
      "address": "s/o itwari Tilhar dabhaura simra tilhar Shahjahanpur Uttar Pradesh 242307",
      "circle": "JIO UPE",
      "alternate": "7307841587",
      "father_name": "itwari",
      "aadhar": "619872770858",
      "email": "N/A",
      "truecaller_name": null
    }
  ],
  "powered_by": "BRONX_ULTRA"
}`},
    aadhar:{req:'GET /api/key-bronx/aadhar?key=YOUR_KEY&num=393933081942',res:`{
  "success": true,
  "aadhar": "393933081942",
  "total": 1,
  "results": [
    {
      "name": "J Vinod",
      "fathersName": "",
      "phoneNumber": "9490160194",
      "aadharNumber": "393933081942",
      "age": "28",
      "gender": "Male",
      "address": "Hyderabad",
      "district": "HYDERABAD",
      "state": "TELANGANA",
      "town": null
    }
  ],
  "powered_by": "BRONX_ULTRA"
}`},
    name:{req:'GET /api/key-bronx/name?key=YOUR_KEY&name=abhiraaj',res:`{
  "success": true,
  "name": "abhiraaj",
  "total": 1,
  "results": [
    {
      "name": "ABHIRAAJ BALASAHEB GAWADE",
      "fathersName": "",
      "phoneNumber": "9823796702",
      "aadharNumber": null,
      "age": "6",
      "gender": "Male",
      "address": "CHAMDGAD",
      "district": "KOLHAPUR",
      "pincode": "416509",
      "state": "MAHARASHTRA",
      "town": "NAGANWADI"
    }
  ],
  "powered_by": "BRONX_ULTRA"
}`},
    numv2:{req:'GET /api/key-bronx/numv2?key=YOUR_KEY&num=6205949840',res:`{
  "success": true,
  "number": "6205949840",
  "results": [
    {
      "name": "RAHUL",
      "mobile": "6205949840",
      "circle": "Airtel",
      "address": "Patna, Bihar"
    }
  ],
  "powered_by": "BRONX_ULTRA"
}`},
    adv:{req:'GET /api/key-bronx/adv?key=YOUR_KEY&num=9876543210',res:`{
  "success": true,
  "number": "9876543210",
  "total": 17,
  "results": [
    {
      "aadharNumber": "527034357255",
      "address": "MUMBAI",
      "age": 24,
      "district": "MUMBAI",
      "gender": "MALE",
      "mobile": "9876543210",
      "name": "RAHUL SHARMA",
      "pincode": "400001",
      "state": "MAHARASHTRA"
    }
  ],
  "powered_by": "BRONX_ULTRA"
}`},
    adharfamily:{req:'GET /api/key-bronx/adharfamily?key=YOUR_KEY&num=984154610245',res:`{
  "success": true,
  "ration_card_id": "202001643745",
  "details": {
    "card_info": {
      "Card Type": "PHH",
      "District": "DHANBAD",
      "Scheme": "NFSA",
      "State": "JHARKHAND"
    },
    "members": [
      {
        "member_name": "Shakuntala Devi",
        "gender": "F",
        "relationship": "SELF",
        "uid_masked": "XXXX-XXXX-5129"
      }
    ]
  },
  "powered_by": "BRONX_ULTRA"
}`},
    adharration:{req:'GET /api/key-bronx/adharration?key=YOUR_KEY&num=701984830542',res:`{
  "success": true,
  "aadhar": "701984830542",
  "ration_details": {
    "card_type": "PHH",
    "state": "JHARKHAND",
    "district": "DHANBAD"
  },
  "powered_by": "BRONX_ULTRA"
}`},
    imei:{req:'GET /api/key-bronx/imei?key=YOUR_KEY&imei=357817383506298',res:`{
  "success": true,
  "imei": "357817383506298",
  "status": "Done",
  "service": "Basic IMEI Check",
  "device": {
    "brand": "APPLE",
    "model": "iPhone 17 Pro",
    "imei": "357817383506298"
  },
  "specs": {
    "Basic Info": {
      "Release Year": "2025",
      "Chipset": "Apple A19 Pro"
    },
    "Display": {
      "Display type": "OLED",
      "Diagonal": "6.3 [in]"
    }
  },
  "powered_by": "BRONX_ULTRA"
}`},
    calltracer:{req:'GET /api/key-bronx/calltracer?key=YOUR_KEY&num=9876543210',res:`{
  "success": true,
  "number": "9876543210",
  "data": {
    "Number": "+91-9876543210",
    "SIM card": "BSNL (Bharat Sanchar Nigam Limited)",
    "Mobile State": "Punjab",
    "Language": "Punjabi",
    "Country": "India",
    "Helpline": "1800-180-1503"
  },
  "powered_by": "BRONX_ULTRA"
}`},
    upi:{req:'GET /api/key-bronx/upi?key=YOUR_KEY&upi=example@ybl',res:`{
  "success": true,
  "upi_id": "example@ybl",
  "valid": true,
  "account_name": "MURENDRA SARABU",
  "bank": "Union Bank of India",
  "ifsc": "UBIN",
  "psp": "PhonePe",
  "is_merchant": false,
  "powered_by": "BRONX_ULTRA"
}`},
    ifsc:{req:'GET /api/key-bronx/ifsc?key=YOUR_KEY&ifsc=SBIN0001234',res:`{
  "success": true,
  "ifsc": "SBIN0001234",
  "bank": "State Bank of India",
  "bank_code": "SBIN",
  "branch": "HAJIGANJ",
  "address": "PATNA, STATE BIHAR, PIN 800008",
  "city": "PATNA",
  "district": "PATNA",
  "state": "BIHAR",
  "payment_modes": {
    "upi": true,
    "imps": true,
    "neft": true,
    "rtgs": true
  },
  "powered_by": "BRONX_ULTRA"
}`},
    pan:{req:'GET /api/key-bronx/pan?key=YOUR_KEY&pan=AXDPR2606K',res:`{
  "success": true,
  "pan": "AXDPR2606K",
  "result": {
    "pan": "AXDPR2606K",
    "total": 1,
    "gstins": [
      {
        "gstin": "192500063179ES0",
        "status": "Active",
        "state": "WEST BENGAL"
      }
    ]
  },
  "powered_by": "BRONX_ULTRA"
}`},
    pincode:{req:'GET /api/key-bronx/pincode?key=YOUR_KEY&pin=110001',res:`{
  "success": true,
  "pincode": "110001",
  "state": "Delhi",
  "district": "Central Delhi",
  "division": "New Delhi Central",
  "region": "Delhi",
  "country": "India",
  "total_offices": 21,
  "powered_by": "BRONX_ULTRA"
}`},
    ip:{req:'GET /api/key-bronx/ip?key=YOUR_KEY&ip=8.8.8.8',res:`{
  "success": true,
  "ip": "8.8.8.8",
  "type": "IPv4",
  "country": "United States",
  "country_code": "US",
  "flag_emoji": "🇺🇸",
  "continent": "North America",
  "region": "California",
  "city": "Mountain View",
  "postal": "94039",
  "latitude": 37.3860517,
  "longitude": -122.0838511,
  "isp": "Google LLC",
  "org": "Google LLC",
  "powered_by": "BRONX_ULTRA"
}`},
    vehicle:{req:'GET /api/key-bronx/vehicle?key=YOUR_KEY&vehicle=MH02FZ0555',res:`{
  "status": "success",
  "data": {
    "rc_number": "MH02FZ0555",
    "owner_name": "SHAH RUKH KHAN",
    "maker_description": "ROLLS-ROYCE MOTOR CARS",
    "maker_model": "BLACK BADGE CULLINAN",
    "fuel_type": "PETROL",
    "color": "ARCTIC WHITE",
    "insurance_company": "ICICI Lombard General Insurance Co. Ltd.",
    "insurance_upto": "2026-03-16",
    "registration_date": "2023-04-12",
    "registered_at": "MUMBAI (WEST), Maharashtra",
    "rc_status": "ACTIVE",
    "vehicle_category": "LMV"
  },
  "powered_by": "BRONX_ULTRA"
}`},
    rc:{req:'GET /api/key-bronx/rc?key=YOUR_KEY&owner=UP92P2111',res:`{
  "success": true,
  "rc": "UP92P2111",
  "result": {
    "Ownership Details": {
      "Owner Name": "SANJU SOLANKI",
      "Father Name": "SUDAMA",
      "Owner Serial No": "Second Owner",
      "Registration Number": "UP92P2111",
      "Registered RTO": "Orai, Uttar Pradesh"
    },
    "Vehicle Details": {
      "Model Name": "HERO MOTOCORP LTD",
      "Maker Model": "HF DELUXE",
      "Fuel Type": "PETROL"
    },
    "Important Dates": {
      "Registration Date": "31-Jul-2013",
      "Vehicle Age": "12 years, 7 months"
    }
  },
  "powered_by": "BRONX_ULTRA"
}`},
    ff:{req:'GET /api/key-bronx/ff?key=YOUR_KEY&uid=3143389983',res:`{
  "success": true,
  "uid": "3143389983",
  "info": {
    "Account Created": "May 13, 2021",
    "Experience (XP)": "2138913",
    "ID": "3143389983",
    "Influencer": "NO",
    "Last Login": "March 13, 2025",
    "Level": "67",
    "Likes": "11431",
    "Nickname": "×͜×BRONX×͜×",
    "Region": "IND"
  },
  "ban_status": "❌ BANNED",
  "powered_by": "BRONX_ULTRA"
}`},
    bgmi:{req:'GET /api/key-bronx/bgmi?key=YOUR_KEY&uid=5121439477',res:`{
  "success": true,
  "uid": "5121439477",
  "game": "BGMI",
  "region": "IND",
  "username": "BRONX",
  "powered_by": "BRONX_ULTRA"
}`},
    insta:{req:'GET /api/key-bronx/insta?key=YOUR_KEY&username=cristiano',res:`{
  "success": true,
  "username": "cristiano",
  "profile": {
    "id": "173560420",
    "username": "cristiano",
    "name": "Cristiano Ronaldo",
    "verified": true,
    "private": false,
    "followers": 672571267,
    "following": 630,
    "posts": 4025
  },
  "powered_by": "BRONX_ULTRA"
}`},
    git:{req:'GET /api/key-bronx/git?key=YOUR_KEY&username=ftgamer2',res:`{
  "success": true,
  "username": "ftgamer2",
  "name": "FTGAMERV2",
  "bio": "Teen dev cooking cool stuff with Python & Java",
  "profile_url": "https://github.com/ftgamer2",
  "avatar": "https://avatars.githubusercontent.com/u/248530312",
  "public_repos": 6,
  "followers": 1,
  "following": 0,
  "powered_by": "BRONX_ULTRA"
}`},
    tg:{req:'GET /api/key-bronx/tg?key=YOUR_KEY&info=6858648491',res:`{
  "success": true,
  "info": "6858648491",
  "number": "9627507420",
  "country": "India",
  "country_code": "+91",
  "powered_by": "BRONX_ULTRA"
}`},
    tgidinfo:{req:'GET /api/key-bronx/tgidinfo?key=YOUR_KEY&id=7530266953',res:`{
  "success": true,
  "id": "7530266953",
  "basic_info": {
    "ID": 7530266953,
    "FIRST_NAME": "Aditya",
    "LAST_NAME": null,
    "USERNAMES_COUNT": 3,
    "NAMES_COUNT": 6
  },
  "status_info": {
    "IS_BOT": false,
    "IS_ACTIVE": true
  },
  "activity_info": {
    "FIRST_MSG_DATE": "2025-01-11T03:05:51Z",
    "LAST_MSG_DATE": "2026-04-24T07:20:04Z",
    "TOTAL_MSG_COUNT": 1940,
    "TOTAL_GROUPS": 47
  },
  "number_info": {
    "NUMBER": "9934846958",
    "COUNTRY_CODE": "+91",
    "COUNTRY": "India"
  },
  "powered_by": "BRONX_ULTRA"
}`},
    snap:{req:'GET /api/key-bronx/snap?key=YOUR_KEY&username=priyapanchal272',res:`{
  "success": true,
  "data": {
    "username": "priyapanchal272",
    "description": "Priya Panchal | 128.6k Subscribers | Noida, India",
    "exists": true,
    "has_stories": true,
    "is_verified": false,
    "subscriber_count": "128.6k",
    "profile_url": "https://www.snapchat.com/add/priyapanchal272"
  },
  "powered_by": "BRONX_ULTRA"
}`},
    pk:{req:'GET /api/key-bronx/pk?key=YOUR_KEY&num=03331234567',res:`{
  "success": true,
  "number": "03331234567",
  "total": 3,
  "results": [
    {
      "name": "ASIM ALI",
      "number": "3331234567",
      "cnic": "3430125586549",
      "address": "DAAK KHANA KALEKI MANDI KARACHI, Sindh"
    },
    {
      "name": "MUHAMMAD SHAHID",
      "number": "3331234567",
      "cnic": "3430313493131",
      "address": "USMANABAD LANDHI KARACHI, Sindh"
    }
  ],
  "powered_by": "BRONX_ULTRA"
}`},
    pkv2:{req:'GET /api/key-bronx/pkv2?key=YOUR_KEY&num=3359736848',res:`{
  "success": true,
  "number": "3359736848",
  "results": [
    {
      "name": "AHMED KHAN",
      "number": "3359736848",
      "address": "LAHORE, Punjab"
    }
  ],
  "powered_by": "BRONX_ULTRA"
}`},
};

app.use(express.json({limit:'50mb'})); app.use(express.urlencoded({extended:true,limit:'50mb'}));
app.use((req,res,next)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,x-api-key,x-admin-token');if(req.method==='OPTIONS')return res.status(200).end();next();});
app.use((req,res,next)=>{req.clientIP=req.headers['x-forwarded-for']?.split(',')[0]?.trim()||'unknown';if(isIPBanned(req.clientIP)&&!req.path.startsWith('/admin')&&!req.path.startsWith('/docs'))return res.status(403).json({error:'IP Banned'});next();});

app.get('/',(req,res)=>{try{res.send(renderHome())}catch(e){res.status(500).send('Error')}});
app.get('/docs',(req,res)=>{try{res.send(renderDocs())}catch(e){res.status(500).send('Error')}});
app.get('/test',(req,res)=>{res.json({status:'✅ BRONX OSINT v60',keys:Object.keys(keyStorage).filter(k=>!keyStorage[k]?.hidden).length})});
app.get('/key-info',(req,res)=>{const k=req.query.key;if(!k)return res.json({error:'Missing key'});const kd=keyStorage[k];if(!kd||kd.hidden)return res.json({error:'Not found'});res.json({key:k.substring(0,4)+'****',owner:kd.name,limit:kd.unlimited?'∞':kd.limit,used:kd.used,expiry:kd.expiryStr||'LIFETIME'})});
app.get('/api/custom/:ep',async(req,res)=>{try{const api=customAPIs.find(a=>a.endpoint===req.params.ep&&a.visible);if(!api)return res.json({error:'Not found'});const key=req.query.key;if(!key)return res.json({error:'Key required'});const kc=checkKeyValid(key);if(!kc.valid)return res.json({error:kc.error});const pv=req.query[api.param]||req.query.number;if(!pv)return res.json({error:'Missing param'});let url=api.realAPI.replace(/\{param\}/gi,encodeURIComponent(pv));if(req.query.count)url=url.replace('counter=10','counter='+req.query.count);const resp=await axios.get(url,{timeout:30000});incrementKeyUsage(key);logRequest(key,'c/'+req.params.ep,pv,'success',req.clientIP,req.userAgent);res.json({...sanitizeResponse(resp.data),api_info:{remaining:kc.keyData?.unlimited?'∞':Math.max(0,(kc.keyData?.limit||0)-(kc.keyData?.used||0)),powered_by:'BRONX_ULTRA'}})}catch(e){res.json({error:'API error'})}});
app.get('/api/key-bronx/:ep',async(req,res)=>{try{const ep=req.params.ep;if(!endpoints[ep])return res.json({error:'Not found'});const key=req.query.key;if(!key)return res.json({error:'Key required'});const kc=checkKeyValid(key);if(!kc.valid)return res.json({error:kc.error});const sc=checkKeyScope(kc.keyData,ep);if(!sc.valid)return res.json({error:'Scope denied'});const pv=req.query[endpoints[ep].p];if(!pv)return res.json({error:'Missing '+endpoints[ep].p});const url=`${REAL_API_BASE}/${ep}?key=${REAL_API_KEY}&${endpoints[ep].p}=${encodeURIComponent(pv)}`;const resp=await axios.get(url,{timeout:30000});incrementKeyUsage(key);logRequest(key,ep,pv,'success',req.clientIP,req.userAgent);res.json({...sanitizeResponse(resp.data),api_info:{remaining:keyStorage[key]?.unlimited?'∞':Math.max(0,(keyStorage[key]?.limit||0)-(keyStorage[key]?.used||0)),powered_by:'BRONX_ULTRA'}})}catch(e){res.json({error:'API error'})}});

app.get('/admin',(req,res)=>{try{const token=req.query.token||req.headers['x-admin-token'];if(token&&isAdminAuth(token))return res.send(renderAdmin(token));res.send(renderLogin())}catch(e){res.status(500).send('<h1>Error</h1>')}});
app.post('/admin/login',async(req,res)=>{const{username,password}=req.body;if(username===ADMIN_USERNAME&&password===ADMIN_PASSWORD){const token=generateToken();adminSessions[token]={expiresAt:Date.now()+(365*24*60*60*1000),permanent:true};permanentTokens[token]={createdAt:getIndiaDateTime()};scheduleSave();res.json({success:true,token,message:'Access Granted',redirect:'/admin?token='+token})}else res.json({success:false,error:'Invalid'})});
app.post('/admin/generate-key',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{keyName,keyOwner,scopes,limit,cooldown,expiryDate,keyType,days}=req.body;if(!keyName||!keyOwner)return res.json({e:'Missing'});if(keyStorage[keyName])return res.json({e:'Exists'});let expiry=null,expiryStr=expiryDate||'LIFETIME';if(days&&!isNaN(days)){const d=new Date(getIndiaTime().getTime()+parseInt(days)*24*60*60*1000);expiry=d;expiryStr=d.toISOString().split('T')[0].split('-').reverse().join('-');}else if(expiryDate&&expiryDate!=='LIFETIME'){expiry=parseExpiryDate(expiryDate);expiryStr=expiryDate;}keyStorage[keyName]={name:keyOwner,scopes:scopes||['number'],type:keyType||'premium',limit:limit==='unlimited'?999999:(parseInt(limit)||100),used:0,cooldown:parseInt(cooldown)||0,expiry:expiry,expiryStr:expiryStr,created:getIndiaDateTime(),unlimited:(!days&&(!expiryDate||expiryDate==='LIFETIME'))||limit==='unlimited'||parseInt(limit)>=999999,hidden:false};scheduleSave();res.json({success:true})});
app.post('/admin/push-key',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{keyName,days}=req.body;if(!keyStorage[keyName])return res.json({e:'Not found'});const d=parseInt(days)||30;const newExp=new Date(getIndiaTime().getTime()+d*24*60*60*1000);keyStorage[keyName].expiry=newExp;keyStorage[keyName].expiryStr=newExp.toISOString().split('T')[0].split('-').reverse().join('-');keyStorage[keyName].used=0;keyStorage[keyName].unlimited=false;scheduleSave();res.json({success:true,message:`Pushed ${d} days`})});
app.post('/admin/delete-key',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});if(req.body.keyName===MASTER_API_KEY)return res.json({e:'Protected'});delete keyStorage[req.body.keyName];scheduleSave();res.json({success:true})});
app.post('/admin/reset-key-usage',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});if(keyStorage[req.body.keyName]){keyStorage[req.body.keyName].used=0;scheduleSave();res.json({success:true})}else res.json({e:'Not found'})});
app.post('/admin/import-keys',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{keys}=req.body;if(!keys||typeof keys!=='object')return res.json({e:'Invalid'});let imported=0;Object.entries(keys).forEach(([kn,kd])=>{if(kn===MASTER_API_KEY||keyStorage[kn])return;keyStorage[kn]={name:kd.name||'Imported',scopes:kd.scopes||['number'],type:kd.type||'imported',limit:kd.limit||100,used:kd.used||0,cooldown:kd.cooldown||0,expiry:kd.expiry||null,expiryStr:kd.expiryStr||'LIFETIME',created:kd.created||getIndiaDateTime(),unlimited:kd.unlimited||false,hidden:kd.hidden||false};imported++});scheduleSave();res.json({success:true,imported})});
app.post('/admin/ban-ip',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{ip}=req.body;if(!ip)return res.json({e:'Missing IP'});banIP(ip);scheduleSave();res.json({success:true})});
app.post('/admin/unban-ip',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{ip}=req.body;if(!ip)return res.json({e:'Missing IP'});unbanIP(ip);scheduleSave();res.json({success:true})});
app.post('/admin/clear-logs',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({});requestLogs=[];scheduleSave();res.json({success:true})});
app.post('/admin/reset-all',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});Object.keys(keyStorage).forEach(k=>{if(k!==MASTER_API_KEY)keyStorage[k].used=0});scheduleSave();res.json({success:true})});
app.use((req,res)=>{res.json({error:'Not found'})});

function renderLogin(){return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BRONX v60 | ADMIN</title><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet"><style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0f;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:'Rajdhani',sans-serif;overflow:hidden}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at center,rgba(139,0,255,.08) 0%,transparent 70%),radial-gradient(ellipse at 80% 20%,rgba(0,200,255,.06) 0%,transparent 50%),radial-gradient(ellipse at 20% 80%,rgba(255,0,128,.05) 0%,transparent 50%);pointer-events:none;z-index:0}
.particles{position:fixed;inset:0;pointer-events:none;z-index:0}.particle{position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;animation:float 6s infinite;opacity:0}
@keyframes float{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh) scale(1);opacity:0}}
.box{background:rgba(15,15,25,.9);padding:50px 40px;border-radius:20px;width:420px;border:1px solid rgba(139,0,255,.2);position:relative;z-index:1;box-shadow:0 0 80px rgba(139,0,255,.15),0 0 150px rgba(0,200,255,.08),inset 0 1px 0 rgba(255,255,255,.03);backdrop-filter:blur(20px)}
.box::before{content:'BRONX OSINT v60';display:block;text-align:center;font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:6px;background:linear-gradient(90deg,#8b00ff,#00c8ff,#ff0080);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px;font-weight:900}
.box h2{color:#fff;text-align:center;margin-bottom:8px;font-size:28px;font-weight:900;font-family:'Orbitron',sans-serif;letter-spacing:2px;text-shadow:0 0 40px rgba(139,0,255,.5)}
.box .sub{text-align:center;color:#666;font-size:12px;margin-bottom:30px;letter-spacing:3px;text-transform:uppercase}
.box input{width:100%;padding:16px 18px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#fff;margin-bottom:14px;font-size:14px;outline:none;font-family:'Rajdhani',sans-serif;transition:.4s;letter-spacing:1px}
.box input:focus{border-color:#8b00ff;box-shadow:0 0 30px rgba(139,0,255,.2),0 0 60px rgba(139,0,255,.05)}.box input::placeholder{color:#444;letter-spacing:2px}
.btn{width:100%;padding:16px;background:linear-gradient(135deg,#8b00ff,#00c8ff);color:#fff;border:none;border-radius:12px;cursor:pointer;font-size:15px;font-weight:700;letter-spacing:3px;font-family:'Orbitron',sans-serif;transition:.4s;text-transform:uppercase;position:relative;overflow:hidden}
.btn:hover{transform:translateY(-2px);box-shadow:0 0 50px rgba(139,0,255,.4),0 0 100px rgba(0,200,255,.2)}
.btn::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent,rgba(255,255,255,.1),transparent);transform:rotate(45deg);animation:shine 3s infinite}
@keyframes shine{0%{left:-50%}100%{left:150%}}
.msg{color:#ff0080;text-align:center;margin-top:14px;font-size:12px;display:none;font-weight:600;letter-spacing:1px}
.fp{text-align:center;margin-top:20px;font-size:10px;color:#333;letter-spacing:2px}
</style></head><body><div class="particles" id="particles"></div><div class="box"><h2>ADMIN ACCESS</h2><p class="sub">Restricted Area</p><input type="text" id="u" placeholder="USERNAME"><input type="password" id="p" placeholder="PASSWORD"><button class="btn" onclick="login()">Authenticate</button><p class="msg" id="msg"></p><p class="fp">BRONX OSINT v60 · GOD TIER</p></div><script>
for(var i=0;i<40;i++){var p=document.createElement('div');p.className='particle';p.style.left=Math.random()*100+'%';p.style.animationDelay=Math.random()*6+'s';p.style.animationDuration=(4+Math.random()*6)+'s';document.getElementById('particles').appendChild(p)}
async function login(){var u=document.getElementById('u').value,p=document.getElementById('p').value,m=document.getElementById('msg');if(!u||!p){m.style.display='block';m.textContent='⚠ FILL ALL FIELDS';return}m.style.display='block';m.style.color='#00c8ff';m.textContent='◌ AUTHENTICATING...';try{var r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});var d=await r.json();if(d.success){m.style.color='#00ff88';m.textContent='✓ '+d.message;setTimeout(function(){location.href=d.redirect},500)}else{m.style.color='#ff0080';m.textContent='✗ '+d.error}}catch(e){m.textContent='✗ CONNECTION ERROR'}}
</script></body></html>`}

function renderAdmin(token){try{
const allKeys=Object.entries(keyStorage).map(([k,d])=>({key:k,name:d.name||'?',type:d.type||'?',limit:d.unlimited?'∞':d.limit,used:d.used||0,left:d.unlimited?'∞':Math.max(0,(d.limit||0)-(d.used||0)),expiry:d.expiryStr||'Lifetime',hidden:d.hidden||false,scopes:d.scopes||[],cooldown:d.cooldown||0,isExpired:d.expiry?isKeyExpired(d.expiry):false,created:d.created||''}));
const totalKeys=allKeys.filter(k=>!k.hidden).length;
const activeKeys=allKeys.filter(k=>!k.hidden&&!k.isExpired&&k.left!=0).length;
const todayReqs=requestLogs.filter(l=>l.timestamp&&l.timestamp.startsWith(getIndiaDate())).length;
const stoken=esc(token);
let keysHTML='';allKeys.forEach(k=>{let s='● ACTIVE',sc='#00ff88';if(k.hidden){s='👑 MASTER';sc='#8b00ff'}else if(k.isExpired){s='⏱ EXPIRED';sc='#ff0080'}else if(k.left==0){s='⚠ LIMIT';sc='#ffaa00'}const acts=k.key!==MASTER_API_KEY?`<button class="ab a-g" onclick="resetKey('${esc(k.key)}')">↺</button><button class="ab a-y" onclick="pushKey('${esc(k.key)}')">↑</button><button class="ab a-r" onclick="deleteKey('${esc(k.key)}')">✕</button>`:'<span style="color:#8b00ff">🔒</span>';keysHTML+=`<tr><td style="color:#00c8ff;font-family:monospace;font-size:9px">${esc(k.key.length>14?k.key.substring(0,12)+'..':k.key)}</td><td>${esc(k.name)}</td><td style="color:#00c8ff">${k.limit}</td><td>${k.used}</td><td>${k.left}</td><td style="font-size:8px">${esc(k.expiry)}</td><td style="color:${sc};font-size:8px">${s}</td><td>${acts}</td></tr>`});
const ipStats={};requestLogs.forEach(l=>{const ip=l.ip||'?';ipStats[ip]=(ipStats[ip]||0)+1});
const ipHTML=Object.entries(ipStats).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([ip,c])=>{const bd=bannedIPs.includes(ip);return`<tr><td style="color:#00c8ff;font-size:9px">${esc(ip)}</td><td>${c}</td><td style="color:${bd?'#ff0080':'#00ff88'}">${bd?'🚫 BANNED':'✅ ACTIVE'}</td><td><button class="ab ${bd?'a-g':'a-r'}" onclick="${bd?`unbanIP('${esc(ip)}')`:`banIP('${esc(ip)}')`}">${bd?'UNBAN':'BAN'}</button></td></tr>`}).join('');
const logsHTML=requestLogs.slice(-25).reverse().map(l=>`<div class="li"><span>${(l.timestamp||'').substring(0,16)}</span><span>${l.key||'?'}</span><code>/${l.endpoint||'?'}</code><span class="${l.status==='success'?'sok':'serr'}">${l.status||'?'}</span><span>${l.ip||'?'}</span></div>`).join('')||'<div style="color:#333;text-align:center;padding:30px">NO LOGS YET</div>';
return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BRONX v60 | ADMIN PANEL</title><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet"><style>
:root{--bg:#06060c;--sur:#0d0d1a;--brd:rgba(139,0,255,.15);--txt:#e0e0f0;--acc:#8b00ff;--acc2:#00c8ff;--green:#00ff88;--red:#ff0080;--yellow:#ffaa00}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--txt);font-family:'Rajdhani',sans-serif;font-size:13px;min-height:100vh}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(139,0,255,.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(0,200,255,.04) 0%,transparent 50%);pointer-events:none;z-index:0}
::selection{background:var(--acc);color:#fff}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--acc);border-radius:10px}
.top{background:rgba(13,13,26,.8);border-bottom:1px solid var(--brd);padding:14px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;position:sticky;top:0;z-index:100;backdrop-filter:blur(30px)}
.top h1{font-family:'Orbitron',sans-serif;font-size:16px;letter-spacing:4px;background:linear-gradient(90deg,var(--acc),var(--acc2),#ff0080);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900}
.tb{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.tb button{background:rgba(139,0,255,.08);color:var(--txt);border:1px solid var(--brd);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:11px;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:1px;transition:.4s}
.tb button:hover{background:rgba(139,0,255,.15);border-color:var(--acc);box-shadow:0 0 25px rgba(139,0,255,.2)}
.ct{padding:20px;max-width:1500px;margin:0 auto;position:relative;z-index:1}
.st{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px}
.sc{background:var(--sur);border:1px solid var(--brd);border-radius:14px;padding:18px;text-align:center;transition:.4s;position:relative;overflow:hidden}
.sc:hover{border-color:var(--acc);box-shadow:0 0 40px rgba(139,0,255,.1)}.sc .v{font-size:30px;font-weight:900;background:linear-gradient(135deg,var(--acc),var(--acc2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:'Orbitron',sans-serif}
.sc .l{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:3px;margin-top:4px;font-weight:600}
.tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}.tab{padding:10px 18px;background:var(--sur);border:1px solid var(--brd);border-radius:10px;color:#666;cursor:pointer;font-size:11px;font-weight:600;letter-spacing:1px;transition:.4s;font-family:'Rajdhani',sans-serif}
.tab:hover{border-color:var(--acc2);color:var(--acc2)}.tab.on{background:rgba(139,0,255,.1);border-color:var(--acc);color:#fff;box-shadow:0 0 30px rgba(139,0,255,.15)}
.pn{display:none}.pn.on{display:block}.sn{background:var(--sur);border:1px solid var(--brd);border-radius:16px;padding:20px;margin-bottom:16px}
.sn h3{color:#fff;margin-bottom:14px;font-size:16px;font-weight:700;letter-spacing:2px;font-family:'Orbitron',sans-serif}
.fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.fg label{display:block;color:#555;font-size:9px;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;font-weight:600}
.fg input,.fg select{width:100%;padding:11px 14px;background:var(--bg);border:1px solid var(--brd);border-radius:10px;color:#fff;font-size:12px;font-family:'Rajdhani',sans-serif;outline:none;transition:.4s;letter-spacing:1px}
.fg input:focus,.fg select:focus{border-color:var(--acc);box-shadow:0 0 25px rgba(139,0,255,.15)}
.btn1{padding:12px 24px;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;border:none;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;letter-spacing:2px;font-family:'Orbitron',sans-serif;transition:.4s;text-transform:uppercase}
.btn1:hover{transform:translateY(-2px);box-shadow:0 0 40px rgba(139,0,255,.3)}
.btn2{padding:12px 24px;background:transparent;color:#666;border:1px solid var(--brd);border-radius:10px;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:1px;transition:.4s;font-family:'Rajdhani',sans-serif}
.btn2:hover{border-color:var(--acc2);color:var(--acc2)}table{width:100%;border-collapse:collapse;font-size:10px}
th{background:rgba(139,0,255,.05);color:#666;padding:10px 6px;text-align:left;font-size:9px;letter-spacing:2px;font-weight:600}
td{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.02)}tr:hover td{background:rgba(139,0,255,.02)}
.ab{padding:5px 10px;font-size:10px;border-radius:6px;border:1px solid;cursor:pointer;margin:0 2px;font-weight:600;letter-spacing:1px;transition:.3s;background:transparent;font-family:'Rajdhani',sans-serif}
.a-g{color:var(--green);border-color:rgba(0,255,136,.2)}.a-g:hover{background:rgba(0,255,136,.08)}
.a-r{color:var(--red);border-color:rgba(255,0,128,.2)}.a-r:hover{background:rgba(255,0,128,.08)}
.a-y{color:var(--yellow);border-color:rgba(255,170,0,.2)}.a-y:hover{background:rgba(255,170,0,.08)}
.eb{background:var(--bg);border:1px solid var(--brd);border-radius:12px;padding:16px;margin-bottom:12px}
.eb h4{color:var(--acc2);font-size:12px;margin-bottom:8px;letter-spacing:2px}
.eb textarea{width:100%;min-height:100px;background:var(--bg);border:1px solid var(--brd);color:var(--acc2);padding:10px;border-radius:8px;font-family:monospace;font-size:10px;resize:vertical}
.lb{max-height:350px;overflow:auto;background:var(--bg);border:1px solid var(--brd);border-radius:10px;padding:12px;font-family:monospace;font-size:9px}
.li{display:flex;gap:10px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.015);flex-wrap:wrap;align-items:center;color:#666}
.li span{min-width:70px;font-size:8px}.li code{color:var(--acc2);font-size:8px}.sok{color:var(--green)}.serr{color:var(--red)}
@media(max-width:768px){.st{grid-template-columns:repeat(2,1fr)}.fg{grid-template-columns:1fr}}
</style></head><body><div class="top"><h1>BRONX_ADMIN_v60</h1><div class="tb"><span style="color:#444;font-size:10px;letter-spacing:1px">[ ${getIndiaDateTime()} ]</span><button onclick="window.open('/')">🏠 HOME</button><button onclick="window.open('/docs')">📚 DOCS</button><button onclick="location.href='/admin'">🚪 LOGOUT</button></div></div><div class="ct">
<div class="st"><div class="sc"><div class="v">${totalKeys}</div><div class="l">Total Keys</div></div><div class="sc"><div class="v">${activeKeys}</div><div class="l">Active</div></div><div class="sc"><div class="v">${todayReqs}</div><div class="l">Today Reqs</div></div><div class="sc"><div class="v">${requestLogs.length}</div><div class="l">Total Reqs</div></div><div class="sc"><div class="v">${bannedIPs.length}</div><div class="l">Banned IPs</div></div></div>
<div class="tabs"><div class="tab on" onclick="st('gen')">⚡ GENERATE</div><div class="tab" onclick="st('keys')">🔑 ALL KEYS</div><div class="tab" onclick="st('io')">📦 IMPORT/EXPORT</div><div class="tab" onclick="st('ips')">🛡 IP MANAGER</div><div class="tab" onclick="st('logs')">📜 LIVE LOGS</div><div class="tab" onclick="st('bulk')">📨 BULK KEYS</div><div class="tab" onclick="st('push')">⬆ PUSH KEY</div><div class="tab" onclick="st('settings')">⚙ SETTINGS</div></div>
<div class="pn on" id="pn-gen"><div class="sn"><h3>⚡ KEY GENERATOR</h3><div class="fg">
<div><label>Key ID</label><input id="gn" placeholder="KEY_NAME"></div><div><label>Owner</label><input id="go" placeholder="Name"></div><div><label>Limit</label><input id="gl" value="100"></div><div><label>Cooldown (sec)</label><input id="gc" value="0"></div>
<div><label>Expiry Mode</label><select id="gem" onchange="toggleExp()"><option value="date">Calendar Date</option><option value="days">Days Counter</option><option value="life">Lifetime</option></select></div>
<div id="de"><label>Expiry Date</label><input type="date" id="ged"></div><div id="dd" style="display:none"><label>Days</label><input type="number" id="gedd" value="30" min="1"></div>
<div><label>Type</label><select id="gt"><option value="premium">Premium</option><option value="demo">Demo</option><option value="vip">VIP</option></select></div>
<div style="grid-column:1/-1"><label>Scopes</label><div style="display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:var(--bg);border:1px solid var(--brd);border-radius:8px;max-height:80px;overflow:auto;font-size:9px"><label style="cursor:pointer;color:#666;font-weight:600"><input type="checkbox" value="*" checked onchange="var v=this.checked;document.querySelectorAll('.scb').forEach(s=>s.checked=v)"> ALL</label>${Object.keys(endpoints).map(e=>'<label style="cursor:pointer;color:#666;margin-left:4px;font-weight:500"><input type="checkbox" value="'+e+'" class="scb"> '+e+'</label>').join('')}</div></div>
<div style="grid-column:1/-1"><button class="btn1" onclick="gk()" style="width:100%">🚀 GENERATE KEY</button></div></div></div></div>
<div class="pn" id="pn-keys"><div class="sn"><h3>🔑 ALL KEYS : ${totalKeys}</h3><div style="max-height:450px;overflow:auto"><table><tr><th>KEY</th><th>OWNER</th><th>LIMIT</th><th>USED</th><th>LEFT</th><th>EXPIRY</th><th>STATUS</th><th>ACTIONS</th></tr>${keysHTML}</table></div></div></div>
<div class="pn" id="pn-io"><div class="sn"><h3>📦 IMPORT / EXPORT</h3><div class="eb" style="border-color:rgba(0,255,136,.2)"><h4 style="color:#00ff88">📤 EXPORT KEYS</h4><textarea readonly id="ed" onclick="this.select()">${esc(JSON.stringify(keyStorage,null,2))}</textarea><button class="btn1" onclick="navigator.clipboard.writeText(document.getElementById('ed').value);toast('[✓] Copied')" style="margin-top:8px">📋 COPY</button></div><div class="eb" style="border-color:rgba(0,200,255,.2)"><h4 style="color:#00c8ff">📥 IMPORT KEYS</h4><textarea id="id" placeholder="Paste JSON here..."></textarea><button class="btn1" onclick="ik()" style="margin-top:8px;background:linear-gradient(135deg,#00c8ff,#8b00ff)">📥 IMPORT</button></div></div></div>
<div class="pn" id="pn-ips"><div class="sn"><h3>🛡 IP MANAGER</h3><div style="margin-bottom:10px"><input id="bip" placeholder="Enter IP to ban..." style="padding:10px;background:var(--bg);border:1px solid var(--brd);color:#fff;font-family:'Rajdhani',sans-serif;width:220px;font-size:11px;border-radius:8px"><button class="ab a-r" onclick="banIP2()" style="margin-left:8px;padding:10px 16px;font-size:11px">🚫 BAN</button></div><div style="max-height:350px;overflow:auto"><table><tr><th>IP ADDRESS</th><th>REQUESTS</th><th>STATUS</th><th>ACTION</th></tr>${ipHTML}</table></div></div></div>
<div class="pn" id="pn-logs"><div class="sn"><h3>📜 LIVE REQUEST LOGS</h3><button class="btn1" onclick="clearLogs()" style="margin-bottom:10px;font-size:11px;padding:8px 16px">🗑 CLEAR LOGS</button><div class="lb">${logsHTML}</div></div></div>
<div class="pn" id="pn-bulk"><div class="sn"><h3>📨 BULK KEY GENERATOR</h3><div class="fg"><div><label>Prefix</label><input id="bp" value="BULK_"></div><div><label>Count</label><input type="number" id="bc" value="5" max="50"></div><div><label>Limit</label><input id="bl" value="100"></div><div><label>Days</label><input type="number" id="bd" value="30"></div><div style="grid-column:1/-1"><button class="btn1" onclick="gb()" style="width:100%">📨 GENERATE BULK</button></div><div style="grid-column:1/-1"><div id="br" style="max-height:180px;overflow:auto;font-family:monospace;font-size:9px;padding:10px;background:var(--bg);border:1px solid var(--brd);border-radius:8px;display:none;color:#00c8ff"></div></div></div></div></div>
<div class="pn" id="pn-push"><div class="sn"><h3>⬆ PUSH KEY</h3><div class="fg"><div><label>Key Name</label><input id="pk" placeholder="KEY_NAME"></div><div><label>Days to Add</label><input type="number" id="pd" value="30" min="1"></div><div style="grid-column:1/-1"><button class="btn1" onclick="pushK()" style="width:100%;background:linear-gradient(135deg,#ffaa00,#ff0080)">⬆ PUSH KEY</button></div></div></div></div>
<div class="pn" id="pn-settings"><div class="sn"><h3>⚙ QUICK SETTINGS</h3><div class="fg"><div style="grid-column:1/-1"><button class="btn1" onclick="resetAll()" style="width:100%">🔄 RESET ALL KEY USAGE</button></div><div style="grid-column:1/-1"><button class="btn2" onclick="clearLogs()" style="width:100%">🗑 CLEAR ALL LOGS</button></div></div></div></div></div>
<script>var TOKEN='${stoken}';function toast(m){var t=document.createElement('div');t.style.cssText='position:fixed;bottom:20px;right:20px;background:var(--sur);color:#00c8ff;padding:12px 20px;border-radius:10px;font-size:11px;z-index:9999;border:1px solid var(--brd);font-family:"Rajdhani",sans-serif;letter-spacing:1px;font-weight:600';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},2000)}
function st(n){document.querySelectorAll('.pn').forEach(p=>p.classList.remove('on'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));document.getElementById('pn-'+n).classList.add('on');event.target.classList.add('on')}
function toggleExp(){var m=document.getElementById('gem').value;document.getElementById('de').style.display=m==='date'?'block':'none';document.getElementById('dd').style.display=m==='days'?'block':'none'}
async function ac(u,b){var o={method:b?'POST':'GET',headers:{'Content-Type':'application/json','x-admin-token':TOKEN}};if(b)o.body=JSON.stringify(b);var r=await fetch(u,o);return await r.json()}
async function gk(){var n=document.getElementById('gn').value.trim(),o=document.getElementById('go').value.trim();if(!n||!o){toast('[!] Fill all fields');return}var sc=[];document.querySelectorAll('#pn-gen input[type=checkbox]:checked').forEach(c=>sc.push(c.value));var em=document.getElementById('gem').value;var exp=null,days=null;if(em==='date'){exp=document.getElementById('ged').value;if(exp){var p=exp.split('-');exp=p[2]+'-'+p[1]+'-'+p[0]}}else if(em==='days'){days=parseInt(document.getElementById('gedd').value)||30}var r=await ac('/admin/generate-key',{keyName:n,keyOwner:o,scopes:sc,limit:document.getElementById('gl').value,cooldown:parseInt(document.getElementById('gc').value)||0,expiryDate:exp,days:days,keyType:document.getElementById('gt').value});r.success?(toast('[✓] Generated: '+n),setTimeout(function(){location.reload()},600)):toast('[!] '+(r.error||r.e))}
async function resetKey(k){if(!confirm('Reset '+k+'?'))return;var r=await ac('/admin/reset-key-usage',{keyName:k});r.success?location.reload():toast('[!] Error')}
async function deleteKey(k){if(!confirm('DELETE '+k+'?'))return;var r=await ac('/admin/delete-key',{keyName:k});r.success?location.reload():toast('[!] Error')}
async function pushKey(k){var d=prompt('Days to extend for '+k+'?','30');if(!d)return;var r=await ac('/admin/push-key',{keyName:k,days:parseInt(d)});r.success?(toast('[✓] '+r.message),setTimeout(function(){location.reload()},600)):toast('[!] '+(r.error||r.e))}
async function pushK(){var k=document.getElementById('pk').value.trim();var d=parseInt(document.getElementById('pd').value)||30;if(!k){toast('[!] Enter key name');return}var r=await ac('/admin/push-key',{keyName:k,days:d});r.success?(toast('[✓] '+r.message),setTimeout(function(){location.reload()},600)):toast('[!] '+(r.error||r.e))}
async function ik(){var d=document.getElementById('id').value.trim();if(!d){toast('[!] Paste JSON');return}try{var ks=JSON.parse(d);var r=await ac('/admin/import-keys',{keys:ks});r.success?(toast('[✓] Imported: '+r.imported),setTimeout(function(){location.reload()},600)):toast('[!] Error')}catch(e){toast('[!] Invalid JSON')}}
async function banIP2(){var ip=document.getElementById('bip').value.trim();if(!ip){toast('[!] Enter IP');return}var r=await ac('/admin/ban-ip',{ip:ip});r.success?(toast('[✓] Banned: '+ip),setTimeout(function(){location.reload()},400)):toast('[!] Error')}
async function banIP(ip){var r=await ac('/admin/ban-ip',{ip:ip});r.success?location.reload():toast('[!] Error')}
async function unbanIP(ip){var r=await ac('/admin/unban-ip',{ip:ip});r.success?location.reload():toast('[!] Error')}
async function clearLogs(){if(!confirm('Clear all logs?'))return;await ac('/admin/clear-logs');location.reload()}
async function resetAll(){if(!confirm('Reset ALL key usage?'))return;await ac('/admin/reset-all');toast('[✓] All reset');setTimeout(function(){location.reload()},400)}
async function gb(){var p=document.getElementById('bp').value.trim()||'BULK_';var c=parseInt(document.getElementById('bc').value)||5;var l=document.getElementById('bl').value||'100';var d=parseInt(document.getElementById('bd').value)||30;if(c>50){toast('[!] Max 50');return}var rd=document.getElementById('br');rd.style.display='block';rd.innerHTML='[*] Generating...';for(var i=1;i<=c;i++){var r=await ac('/admin/generate-key',{keyName:p+i,keyOwner:'Bulk_'+i,scopes:['*'],limit:l,cooldown:0,days:d,keyType:'bulk'});rd.innerHTML+='<div>'+(r.success?'[✓]':'[!]')+' '+p+i+'</div>'}toast('[✓] Done')}
</script></body></html>`}catch(e){return '<html><body style="background:#06060c;color:#ff0080;font-family:sans-serif;padding:30px"><h1>ADMIN ERROR</h1><p>'+e.message+'</p></body></html>'}}

function renderDocs(){try{let html='';const cats={};Object.entries(endpoints).forEach(([n,e])=>{if(!cats[e.c])cats[e.c]=[];cats[e.c].push({name:n,...e});});html+='<div class="hero"><h1>📚 API DOCUMENTATION</h1><p style="color:#666;text-align:center;letter-spacing:3px;font-size:13px">BRONX OSINT v60 · ALL ENDPOINTS</p></div><div class="st"><div class="sc"><div class="v">'+Object.keys(endpoints).length+'</div><div class="l">ENDPOINTS</div></div><div class="sc"><div class="v">JSON</div><div class="l">RESPONSE</div></div><div class="sc"><div class="v">100%</div><div class="l">REAL DATA</div></div></div>';Object.entries(cats).forEach(([c,eps])=>{html+=`<div class="cat-sec"><h2 class="cat-title">${c.toUpperCase()}</h2><div class="ep-grid">`;eps.forEach(e=>{const ex=apiExamples[e.name]||{req:'GET /api/key-bronx/'+e.name+'?key=YOUR_KEY&'+e.p+'='+e.e,res:'{"success":true}'};html+=`<div class="ep-card"><div class="ep-header"><span class="ep-method">GET</span><span class="ep-icon">${e.i}</span></div><b class="ep-name">/${e.name}</b><p class="ep-desc">${e.d}</p><div class="ep-example"><code class="req">${esc(ex.req)}</code><pre class="res">${esc(ex.res)}</pre></div></div>`});html+='</div></div>'});return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BRONX API DOCS v60</title><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet"><style>
:root{--bg:#06060c;--sur:#0d0d1a;--brd:rgba(139,0,255,.15);--txt:#e0e0f0;--acc:#8b00ff;--acc2:#00c8ff;--green:#00ff88}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--txt);font-family:'Rajdhani',sans-serif;font-size:14px;min-height:100vh}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(139,0,255,.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(0,200,255,.04) 0%,transparent 50%);pointer-events:none;z-index:0}
.top{background:rgba(13,13,26,.9);border-bottom:1px solid var(--brd);padding:12px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;position:sticky;top:0;z-index:100;backdrop-filter:blur(30px)}
.top a{color:var(--txt);text-decoration:none;font-size:12px;font-weight:600;letter-spacing:1px;transition:.3s}.top a:hover{color:var(--acc2)}
.ct{max-width:1100px;margin:0 auto;padding:20px;position:relative;z-index:1}
.hero{text-align:center;padding:20px}.hero h1{font-family:'Orbitron',sans-serif;font-size:32px;background:linear-gradient(90deg,var(--acc),var(--acc2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;margin-bottom:8px}
.st{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin:20px 0 30px}.sc{background:var(--sur);border:1px solid var(--brd);border-radius:14px;padding:16px 24px;text-align:center}
.sc .v{font-size:28px;font-weight:900;background:linear-gradient(135deg,var(--acc),var(--acc2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:'Orbitron',sans-serif}
.sc .l{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:3px;margin-top:4px}
.cat-sec{margin-bottom:30px}.cat-title{color:var(--acc);font-size:18px;font-weight:700;letter-spacing:2px;margin-bottom:12px;text-transform:uppercase;font-family:'Orbitron',sans-serif}
.ep-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.ep-card{background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:16px;transition:.3s}
.ep-card:hover{border-color:var(--acc);box-shadow:0 0 25px rgba(139,0,255,.1)}
.ep-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.ep-method{background:rgba(0,200,255,.1);color:var(--acc2);padding:2px 10px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:1px}
.ep-icon{font-size:20px}.ep-name{color:#fff;font-size:16px;font-weight:700}.ep-desc{color:#666;font-size:11px;margin-bottom:8px}
.ep-example{margin-top:8px}.req{display:block;background:rgba(0,0,0,.3);color:var(--acc2);padding:8px;border-radius:6px;font-size:10px;margin-bottom:6px;font-family:monospace;word-break:break-all}
.res{background:rgba(0,255,136,.03);color:var(--green);padding:8px;border-radius:6px;font-size:10px;font-family:monospace;max-height:120px;overflow:auto;white-space:pre-wrap;word-break:break-all}
@media(max-width:768px){.ep-grid{grid-template-columns:1fr}.hero h1{font-size:24px}}
</style></head><body><div class="top"><a href="/" style="font-family:'Orbitron',sans-serif;font-size:14px;letter-spacing:3px;background:linear-gradient(90deg,var(--acc),var(--acc2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900">⚡ BRONX OSINT v60</a><a href="/">🏠 HOME</a><a href="/admin">🔐 ADMIN</a></div><div class="ct">${html}</div></body></html>`}catch(e){return '<h1>Error loading docs</h1>'}}

function renderHome(){try{const vapis=customAPIs.filter(a=>a.visible&&a.endpoint);const totalEndpoints=Object.keys(endpoints).length+vapis.length;const totalKeys=Object.keys(keyStorage).filter(k=>!keyStorage[k]?.hidden).length;const epsJSON=JSON.stringify(endpoints).replace(/</g,'\\u003c');let cardsHTML='';Object.entries(endpoints).forEach(([n,e])=>{cardsHTML+=`<div class="ep" style="--ac:#8b00ff" onclick="cp('${esc(n)}','${esc(e.p)}','${esc(e.e)}')"><span>${e.i}</span><b>/${esc(n)}</b><small>${esc(e.d)}</small><code>${esc(e.p)}=${esc(e.e)}</code></div>`});vapis.forEach(a=>{cardsHTML+=`<div class="ep" style="--ac:#00c8ff" onclick="ccp('${esc(a.endpoint)}','${esc(a.param)}','${esc(a.example)}')"><span>🔧</span><b>/${esc(a.endpoint)}</b><small>${esc(a.desc||'Custom')}</small><code>${esc(a.param)}=${esc(a.example||'v')}</code></div>`});const opts=Object.entries(endpoints).map(([n,e])=>`<option value="${esc(n)}" data-p="${esc(e.p)}" data-ex="${esc(e.e)}">${e.i} /${esc(n)}</option>`).join('')+vapis.map(a=>`<option value="c_${a.id}" data-c="1" data-ep="${esc(a.endpoint)}" data-p="${esc(a.param)}" data-ex="${esc(a.example)}">🔧 /${esc(a.endpoint)}</option>`).join('');return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX OSINT v60 👑</title><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"><style>
:root{--bg:#06060c;--sur:#0d0d1a;--brd:rgba(139,0,255,.15);--txt:#e0e0f0;--acc:#8b00ff;--acc2:#00c8ff;--green:#00ff88;--red:#ff0080;--yellow:#ffaa00;--pink:#ff0080}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--txt);font-family:'Rajdhani',sans-serif;overflow-x:hidden;font-size:14px}
::selection{background:var(--acc);color:#fff}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--acc);border-radius:10px}
.snow{position:fixed;inset:0;pointer-events:none;z-index:0}.snowflake{position:absolute;width:3px;height:3px;background:#fff;border-radius:50%;animation:fall linear infinite;opacity:0}
@keyframes fall{0%{transform:translateY(-10vh) rotate(0deg);opacity:0}10%{opacity:0.7}90%{opacity:0.7}100%{transform:translateY(110vh) rotate(360deg);opacity:0}}
.tb{position:sticky;top:0;z-index:1000;background:rgba(13,13,26,.9);border-bottom:1px solid var(--brd);padding:8px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;backdrop-filter:blur(30px)}
.tb .logo{font-family:'Orbitron',sans-serif;font-size:14px;letter-spacing:4px;background:linear-gradient(90deg,var(--acc),var(--acc2),var(--pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900}
.tb .ba{background:rgba(0,255,136,.1);color:var(--green);padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:1px;border:1px solid rgba(0,255,136,.2);animation:glow 2s infinite}
@keyframes glow{0%,100%{box-shadow:0 0 6px rgba(0,255,136,.2)}50%{box-shadow:0 0 18px rgba(0,255,136,.4)}}
.tb a{color:#666;text-decoration:none;font-size:10px;font-weight:600;letter-spacing:1px;transition:.3s}.tb a:hover{color:var(--acc2)}
.hero{text-align:center;padding:40px 20px 15px;position:relative;z-index:1}
.hero h1{font-size:56px;font-weight:900;background:linear-gradient(90deg,var(--acc),var(--acc2),var(--pink),var(--green));background-size:300% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:rb 4s linear infinite;font-family:'Orbitron',sans-serif;margin-bottom:4px}
@keyframes rb{0%{background-position:0% 50%}100%{background-position:300% 50%}}
.hero .sub{font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#666;margin-bottom:2px}
.ct{max-width:1100px;margin:0 auto;padding:0 16px;position:relative;z-index:1}
.st{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;padding:14px;margin-bottom:18px;background:rgba(13,13,26,.9);border:1px solid var(--brd);border-radius:14px}
.st>div{text-align:center;min-width:60px}.st .v{font-size:26px;font-weight:900;background:linear-gradient(135deg,var(--acc),var(--acc2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:'Orbitron',sans-serif}
.st .l{font-size:7px;color:#555;text-transform:uppercase;letter-spacing:2px}
.pay{background:rgba(13,13,26,.95);border:1px solid var(--brd);border-radius:16px;padding:18px;margin-bottom:18px}
.pay h3{font-size:18px;font-weight:800;text-align:center;margin-bottom:12px;background:linear-gradient(135deg,var(--acc),var(--acc2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:'Orbitron',sans-serif}
.pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:6px;margin-bottom:12px}
.pc{background:rgba(139,0,255,.03);border:1px solid rgba(139,0,255,.1);border-radius:8px;padding:8px;text-align:center;transition:.3s}
.pc:hover{border-color:var(--acc);background:rgba(139,0,255,.06)}.pc .d{font-size:10px;color:#fff;font-weight:600}.pc .a{font-size:14px;color:var(--acc);font-weight:900}
.pm{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:10px}
.pb{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:6px;padding:6px 12px;color:#aaa;cursor:pointer;font-size:9px;font-weight:600;transition:.3s}
.pb:hover{background:rgba(139,0,255,.1);border-color:var(--acc);color:var(--acc)}
.upi{text-align:center;padding:12px;background:rgba(0,0,0,.3);border-radius:8px;margin-bottom:10px}
.upi .pay-btn-glow{display:inline-block;background:linear-gradient(135deg,var(--acc),var(--acc2),var(--pink));background-size:300% 100%;animation:rb 3s linear infinite;color:#fff;padding:12px 30px;border-radius:25px;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer;box-shadow:0 0 30px rgba(139,0,255,.3);transition:.3s;letter-spacing:1px;border:none;font-family:'Orbitron',sans-serif}
.upi .pay-btn-glow:hover{transform:scale(1.05);box-shadow:0 0 50px rgba(139,0,255,.5)}
.upi img{max-width:180px;border-radius:10px;margin:10px auto;display:block;border:2px solid rgba(139,0,255,.15)}
.tgl{text-align:center;font-size:10px;color:#666;margin-top:8px}.tgl a{color:var(--acc2);text-decoration:none;font-weight:600}
.pl{background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:16px;margin-bottom:18px}
.pl h3{font-size:14px;font-weight:700;margin-bottom:10px;background:linear-gradient(135deg,var(--acc2),#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.plf{display:flex;gap:8px;flex-wrap:wrap}.plf select,.plf input{flex:1;min-width:100px;padding:10px 12px;background:var(--bg);border:1px solid var(--brd);border-radius:7px;color:var(--txt);font-size:10px;font-family:monospace;outline:none}
.plf select:focus,.plf input:focus{border-color:var(--acc)}.btx{padding:10px 18px;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;border:none;border-radius:7px;font-weight:700;font-size:10px;cursor:pointer;font-family:'Orbitron',sans-serif}
.rb{margin-top:10px;background:#020210;border:1px solid var(--brd);border-radius:7px;padding:10px;max-height:250px;overflow:auto;font-family:monospace;font-size:8px;display:none;white-space:pre-wrap;color:var(--green)}
.eg{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:18px}
.ep{background:var(--sur);border:1px solid var(--brd);border-radius:10px;padding:14px;cursor:pointer;transition:.3s;border-top:3px solid var(--ac,#8b00ff)}
.ep:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.4)}.ep span{font-size:18px;display:block;margin-bottom:2px}
.ep b{font-size:14px;color:#fff;display:block;margin-bottom:2px}.ep small{font-size:9px;color:#666;display:block;margin-bottom:6px}
.ep code{font-family:monospace;font-size:8px;color:var(--ac,#8b00ff);background:rgba(0,0,0,.3);padding:3px 5px;border-radius:3px}
.ft{text-align:center;padding:20px;border-top:1px solid var(--brd);position:relative;z-index:1}
.ft .fb{font-size:16px;font-weight:900;background:linear-gradient(90deg,var(--acc),var(--acc2),var(--pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:'Orbitron',sans-serif}
.ft .fi{font-size:9px;color:#555;margin-top:2px}.ft .fi a{color:#666;text-decoration:none}
@media(max-width:768px){.hero h1{font-size:30px}.eg{grid-template-columns:1fr}.plf{flex-direction:column}}
</style></head><body><div class="snow" id="snow"></div><div class="tb"><a href="/" class="logo">⚡ BRONX OSINT v60</a><div style="display:flex;gap:10px;align-items:center"><a href="/docs">📚 API DOCS</a><a href="/admin">🔐 ADMIN</a><span class="ba">✅ PAID API</span></div></div><header class="hero"><h1>BRONX OSINT v60</h1><p class="sub">ULTIMATE OSINT SUITE</p><p style="color:#555;font-size:10px;margin-top:4px">👑 King Always King 👑 · Unlimited · Real-Time · No Error</p></header><div class="ct"><div class="st"><div><div class="v">${totalEndpoints}</div><div class="l">ENDPOINTS</div></div><div><div class="v">${totalKeys}</div><div class="l">KEYS</div></div><div><div class="v">∞</div><div class="l">REQUESTS</div></div><div><div class="v">100%</div><div class="l">WORKING</div></div></div><div class="pay"><h3>💎 GET PAID API KEY</h3><div class="pg"><div class="pc"><div class="d">10 Days</div><div class="a">₹100</div></div><div class="pc"><div class="d">20 Days</div><div class="a">₹200</div></div><div class="pc"><div class="d">30 Days</div><div class="a">₹300</div></div><div class="pc"><div class="d">40 Days</div><div class="a">₹400</div></div><div class="pc"><div class="d">50 Days</div><div class="a">₹500</div></div><div class="pc"><div class="d">60 Days</div><div class="a">₹600</div></div><div class="pc" style="grid-column:1/-1;border-color:rgba(204,93,232,.2)"><div class="d">👑 LIFETIME</div><div class="a" style="color:#cc5de8">₹3000</div></div></div><div class="pm"><span class="pb">📱 UPI</span><span class="pb">💳 PhonePe</span><span class="pb">🏦 Navi</span><span class="pb">💰 Paytm</span></div><div class="upi"><a href="upi://pay?pa=8509561376@ibl&pn=BRONX_ULTRA&cu=INR" class="pay-btn-glow">⚡ CLICK TO PAY NOW ⚡</a><img src="https://i.ibb.co/sJwBtnWd/IMG-20260413-080502-825.jpg" alt="QR" onerror="this.style.display='none'"></div><p class="tgl">After Payment Send Screenshot → <a href="https://t.me/BRONX_ULTRA">@BRONX_ULTRA</a></p></div><div class="pl"><h3>🧪 API PLAYGROUND</h3><div class="plf"><select id="es"><option value="">Select Endpoint</option>${opts}</select><input id="ak" placeholder="API Key..."><input id="pv" placeholder="Parameter..."><button class="btx" onclick="ta()">⚡ RUN</button></div><div class="rb" id="rb"></div></div><div class="eg">${cardsHTML}</div></div><footer class="ft"><p class="fb">BRONX OSINT v60 👑</p><p class="fi">@BRONX_ULTRA · <a href="/admin">Admin</a> · <a href="/docs">API Docs</a> · <a href="/test">Status</a></p></footer><script>
var eps=${epsJSON};
function toast(m){var t=document.createElement('div');t.style.cssText='position:fixed;bottom:16px;right:16px;background:#0d0d1a;color:#00c8ff;padding:8px 14px;border-radius:8px;font-size:10px;z-index:9999;border:1px solid rgba(139,0,255,.2)';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},2000)}
function cp(n,p,e){navigator.clipboard.writeText(location.origin+'/api/key-bronx/'+n+'?key=KEY&'+p+'='+e).then(function(){toast('📋 Copied!')})}
function ccp(n,p,e){navigator.clipboard.writeText(location.origin+'/api/custom/'+n+'?key=KEY&'+p+'='+e).then(function(){toast('📋 Copied!')})}
async function ta(){var s=document.getElementById('es'),o=s.options[s.selectedIndex],k=document.getElementById('ak').value,v=document.getElementById('pv').value,rb=document.getElementById('rb');if(!s.value||!k||!v){toast('⚠ Fill all fields');return}var url=o.dataset.c==='1'?'/api/custom/'+o.dataset.ep+'?key='+k+'&'+o.dataset.p+'='+v:'/api/key-bronx/'+s.value+'?key='+k+'&'+eps[s.value].p+'='+v;rb.style.display='block';rb.style.color='#00ff88';rb.textContent='⏳ Loading...';try{var r=await fetch(url);var d=await r.json();rb.textContent=JSON.stringify(d,null,2);if(d.error)rb.style.color='#ff0080'}catch(e){rb.textContent='Error: '+e.message;rb.style.color='#ff0080'}}
for(var i=0;i<30;i++){var sf=document.createElement('div');sf.className='snowflake';sf.style.left=Math.random()*100+'%';sf.style.animationDelay=Math.random()*10+'s';sf.style.animationDuration=(5+Math.random()*10)+'s';sf.style.width=sf.style.height=(2+Math.random()*3)+'px';document.getElementById('snow').appendChild(sf)}
</script></body></html>`}catch(e){return '<html><body><h1>Error</h1></body></html>'}}

(async function(){const loaded=await loadFromStorage();if(!loaded){initDefaultData();initCustomAPIs()}if(!keyStorage[MASTER_API_KEY])keyStorage[MASTER_API_KEY]=createMasterKey();delete keyStorage['BRONX_ULTRA_MASTER_2026'];scheduleSave();console.log('✅ BRONX OSINT v60 ULTRA Ready! Keys:',Object.keys(keyStorage).length)})();

module.exports = app;
