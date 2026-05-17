// api/index.js - BRONX OSINT v21 - KING ULTRA EDITION (OWN STORAGE)
const express = require('express');
const axios = require('axios');
const app = express();

// ========== 🔒 SECURE CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = process.env.REAL_API_KEY || 'bot-new';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'BRONX_ULTRA';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BRONX@2026#OWNER';
const MASTER_API_KEY = process.env.MASTER_API_KEY || 'BRONX_MASTER_' + Math.random().toString(36).substring(2, 10).toUpperCase();

// ========== 👑 YOUR PAYMENT DETAILS (UPDATE THESE 2!) ==========
const PAYMENT_INFO = {
    upiId: '👇8509561376@ibl👇',
    scannerImage: '👇https://ibb.co/G3xPH6Pg👇',
    telegramUser: '@BRONX_ULTRA'
};

// ========== 🗄️ YOUR OWN STORAGE API ==========
const STORAGE_URL = 'https://bromx-db-stroge.onrender.com';

// ========== MEMORY STORAGE ==========
let keyStorage = {};
let customAPIs = [];
let requestLogs = [];
let adminSessions = {};
let permanentTokens = {};
let bannedIPs = [];
let cooldownTimers = {};

// ========== STORAGE FUNCTIONS (USING YOUR API) ==========
async function saveToStorage() {
    try {
        await axios.post(`${STORAGE_URL}/keys`, {
            keys: keyStorage,
            apis: customAPIs,
            tokens: permanentTokens,
            banned: bannedIPs,
            timestamp: new Date().toISOString()
        }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });
        console.log('💾 Saved to storage');
        return true;
    } catch (e) {
        console.log('⚠️ Save error:', e.message);
        return false;
    }
}

async function loadFromStorage() {
    try {
        const res = await axios.get(`${STORAGE_URL}/keys`, { timeout: 10000 });
        if (res.data && res.data.keys) {
            keyStorage = res.data.keys;
            if (res.data.apis) customAPIs = res.data.apis;
            if (res.data.tokens) {
                permanentTokens = res.data.tokens;
                Object.entries(permanentTokens).forEach(([token, data]) => {
                    adminSessions[token] = { expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), permanent: true };
                });
            }
            if (res.data.banned) bannedIPs = res.data.banned;
            console.log('📥 Loaded from storage');
            return true;
        }
        return false;
    } catch (e) {
        console.log('⚠️ Load error:', e.message);
        return false;
    }
}

function scheduleSave() {
    setTimeout(async () => { await saveToStorage(); }, 2000);
}
setInterval(() => scheduleSave(), 3 * 60 * 1000);

// ========== LOAD DATA ==========
async function loadAllData() {
    const loaded = await loadFromStorage();
    if (!loaded) {
        initDefaultData();
        initCustomAPIs();
    }
    if (!keyStorage[MASTER_API_KEY]) keyStorage[MASTER_API_KEY] = createMasterKey();
    delete keyStorage['BRONX_ULTRA_MASTER_2026'];
    scheduleSave();
}

// ========== DEFAULT DATA ==========
function createMasterKey() { return { name: '👑 BRONX ULTRA OWNER', scopes: ['*'], type: 'owner', limit: 999999, used: 0, cooldown: 0, expiry: null, expiryStr: 'LIFETIME', created: getIndiaDateTime(), unlimited: true, hidden: true }; }

function initDefaultData() {
    const now = getIndiaDateTime(); keyStorage = {}; keyStorage[MASTER_API_KEY] = createMasterKey();
    const demoKeys = [
        {key:'BRONX_DEMO_001',name:'🎁 Demo Premium',scopes:['*'],limit:1000,cooldown:0,expiry:'31-12-2027'},
        {key:'BRONX_DEMO_002',name:'🎁 Demo Basic',scopes:['number','aadhar','pan','upi'],limit:500,cooldown:2,expiry:'30-06-2027'},
        {key:'BRONX_DEMO_003',name:'🎁 Demo Starter',scopes:['number','ip','pincode'],limit:200,cooldown:1,expiry:'31-12-2027'},
        {key:'BRONX_OP_KEY',name:'🎁 OP Access',scopes:['*'],limit:999,cooldown:0,expiry:'31-12-2027'},
        {key:'BRONX_PRO_KEY',name:'🎁 Pro Access',scopes:['*'],limit:5000,cooldown:0,expiry:'31-12-2028'},
        {key:'BRONX_BOMBER_KEY',name:'🎁 Bomber Access',scopes:['number','sms-bomber','custom'],limit:300,cooldown:3,expiry:'31-12-2027'},
    ];
    demoKeys.forEach(dk => { keyStorage[dk.key] = { name: dk.name, scopes: dk.scopes, type: 'demo', limit: dk.limit, used: 0, cooldown: dk.cooldown || 0, expiry: parseExpiryDate(dk.expiry), expiryStr: dk.expiry, created: now, unlimited: false, hidden: false }; });
}

function initCustomAPIs() {
    customAPIs = [
        {id:1,name:'Number Info v2',endpoint:'number-advanced',param:'num',example:'9876543210',desc:'Advanced Number Lookup',visible:true,realAPI:'https://num-tg-info-api.vercel.app/info?number={param}'},
        {id:2,name:'Vehicle RC Details',endpoint:'rc-details',param:'ca_number',example:'MH02FZ0555',desc:'Complete RC Information',visible:true,realAPI:'https://bronx-rc-api.vercel.app/?ca_number={param}'},
        {id:3,name:'Aadhar Verification',endpoint:'aadhar-verify',param:'aadhar',example:'393933081942',desc:'Aadhar Card Details',visible:true,realAPI:'https://bronx-king-vip999.vercel.app/api/aadhaar?num={param}'},
        {id:4,name:'Email Intelligence',endpoint:'email-lookup',param:'mail',example:'user@gmail.com',desc:'Email OSINT Lookup',visible:true,realAPI:'https://bronx-king-mail-opi.vercel.app/mail={param}'},
        {id:5,name:'Telegram Scanner',endpoint:'telegram-scan',param:'id',example:'7530266953',desc:'TG Account Scanner',visible:true,realAPI:'https://bronx-tg-king-bro.vercel.app/tg?key=BRONXop&query={param}'},
        {id:6,name:'SMS Bomber',endpoint:'sms-bomber',param:'number',example:'1234567890',desc:'SMS Testing (number=NUM&count=10)',visible:true,realAPI:'https://bronx-sms-api-ulimate.vercel.app/api/key-bronx-paid-vip?number={param}&counter=10'},
        {id:7,name:'Custom API 7',endpoint:'',param:'',example:'',desc:'',visible:false,realAPI:''},
        {id:8,name:'Custom API 8',endpoint:'',param:'',example:'',desc:'',visible:false,realAPI:''},
        {id:9,name:'Custom API 9',endpoint:'',param:'',example:'',desc:'',visible:false,realAPI:''},
        {id:10,name:'Custom API 10',endpoint:'',param:'',example:'',desc:'',visible:false,realAPI:''}
    ];
}

// ========== HELPERS ==========
function getIndiaTime(){return new Date(new Date().getTime()+(5.5*60*60*1000));}
function getIndiaDate(){return getIndiaTime().toISOString().split('T')[0];}
function getIndiaDateTime(){return getIndiaTime().toISOString().replace('T',' ').substring(0,19);}
function isKeyExpired(expiryDate){if(!expiryDate||expiryDate==='LIFETIME')return false;return getIndiaTime()>new Date(expiryDate);}
function parseExpiryDate(dateStr){if(!dateStr||dateStr==='LIFETIME'||dateStr==='Lifetime')return null;const parts=dateStr.split('-');if(parts.length===3){if(parts[0].length===4)return new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]),23,59,59,999);else return new Date(parseInt(parts[2]),parseInt(parts[1])-1,parseInt(parts[0]),23,59,59,999);}const date=new Date(dateStr);return isNaN(date.getTime())?null:date;}
function checkCooldown(apiKey){const kd=keyStorage[apiKey];if(!kd||!kd.cooldown||kd.cooldown<=0)return{allowed:true};const now=Date.now();if(cooldownTimers[apiKey]&&(now-cooldownTimers[apiKey])<(kd.cooldown*1000)){const remaining=Math.ceil((kd.cooldown*1000-(now-cooldownTimers[apiKey]))/1000);return{allowed:false,remaining,cooldown:kd.cooldown};}cooldownTimers[apiKey]=now;return{allowed:true};}
function checkKeyValid(apiKey){if(!apiKey||typeof apiKey!=='string')return{valid:false,error:'Invalid API Key'};const kd=keyStorage[apiKey];if(!kd)return{valid:false,error:'Key not found'};if(kd.expiry&&isKeyExpired(kd.expiry))return{valid:false,error:'Key Expired',expired:true};if(!kd.unlimited&&kd.used>=kd.limit)return{valid:false,error:'Limit Exhausted',limitExhausted:true};const cd=checkCooldown(apiKey);if(!cd.allowed)return{valid:false,error:'Cooldown '+cd.remaining+'s',cooldown:true,remaining:cd.remaining};return{valid:true,keyData:kd};}
function incrementKeyUsage(apiKey){if(keyStorage[apiKey]&&!keyStorage[apiKey].unlimited){keyStorage[apiKey].used++;if(keyStorage[apiKey].used%5===0)scheduleSave();}return keyStorage[apiKey];}
function checkKeyScope(kd,ep){if(!kd||!kd.scopes)return{valid:false};if(kd.scopes.includes('*'))return{valid:true};if(kd.scopes.includes(ep))return{valid:true};if(ep.startsWith('c/')&&kd.scopes.includes('custom'))return{valid:true};return{valid:false};}
function detectBrowser(ua){if(!ua)return{name:'Unknown',device:'Unknown'};let name='Unknown';if(ua.includes('Firefox/'))name='Firefox';else if(ua.includes('Edg/'))name='Edge';else if(ua.includes('Chrome/')&&!ua.includes('Edg/'))name='Chrome';else if(ua.includes('Safari/')&&!ua.includes('Chrome/'))name='Safari';let device='Desktop';if(ua.includes('Mobile'))device='Mobile';return{name,device};}
function logRequest(key,ep,param,status,ip,ua){const browser=detectBrowser(ua);requestLogs.push({timestamp:getIndiaDateTime(),key:key?key.substring(0,8)+'***':'unknown',endpoint:ep,param:param?param.substring(0,20):'',status,ip:ip||'unknown',browser:browser.name,device:browser.device});if(requestLogs.length>1000)requestLogs=requestLogs.slice(-1000);}
function generateToken(){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';let token='';for(let i=0;i<32;i++)token+=chars.charAt(Math.floor(Math.random()*chars.length));return token;}
function isAdminAuth(token){if(!token)return false;if(adminSessions[token]){if(adminSessions[token].permanent)return true;if(Date.now()<adminSessions[token].expiresAt)return true;delete adminSessions[token];delete permanentTokens[token];scheduleSave();}return false;}
function isIPBanned(ip){if(!ip||ip==='unknown')return false;return bannedIPs.includes(ip);}
function banIP(ip){if(!bannedIPs.includes(ip)&&ip&&ip!=='unknown'){bannedIPs.push(ip);scheduleSave();return true;}return false;}
function unbanIP(ip){const index=bannedIPs.indexOf(ip);if(index>-1){bannedIPs.splice(index,1);scheduleSave();return true;}return false;}
function sanitizeResponse(data){if(!data)return data;try{const cleaned=JSON.parse(JSON.stringify(data));function clean(obj){if(!obj||typeof obj!=='object')return;if(Array.isArray(obj)){obj.forEach(clean);return;}['by','channel','developer','api_key','apikey','real_url','source_url','internal_id'].forEach(f=>delete obj[f]);Object.keys(obj).forEach(k=>{if(obj[k]&&typeof obj[k]==='object')clean(obj[k]);});}clean(cleaned);cleaned.powered_by="BRONX OSINT v21 KING ULTRA";return cleaned;}catch(e){return data;}}
function escapeHTML(str){if(!str)return'';return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

// ========== ENDPOINTS ==========
const endpoints = {
    number:{p:'num',i:'📱',e:'9876543210',d:'Mobile Number Complete Lookup',c:'phone'},
    aadhar:{p:'num',i:'🆔',e:'393933081942',d:'Aadhaar Card Details',c:'phone'},
    name:{p:'name',i:'🔍',e:'abhiraaj',d:'Name Search Intelligence',c:'phone'},
    numv2:{p:'num',i:'📱',e:'6205949840',d:'Number Lookup v2',c:'phone'},
    adv:{p:'num',i:'📱',e:'9876543210',d:'Advanced Number Intel',c:'phone'},
    adharfamily:{p:'num',i:'👨‍👩‍👧‍👦',e:'984154610245',d:'Aadhaar Family Details',c:'phone'},
    adharration:{p:'num',i:'📋',e:'701984830542',d:'Aadhaar Ration Card',c:'phone'},
    imei:{p:'imei',i:'📱',e:'357817383506298',d:'IMEI Device Info',c:'phone'},
    calltracer:{p:'num',i:'📞',e:'9876543210',d:'Call Location Tracer',c:'phone'},
    upi:{p:'upi',i:'💰',e:'example@ybl',d:'UPI ID Verification',c:'finance'},
    ifsc:{p:'ifsc',i:'🏦',e:'SBIN0001234',d:'IFSC Code Bank Details',c:'finance'},
    pan:{p:'pan',i:'📄',e:'AXDPR2606K',d:'PAN Card Verification',c:'finance'},
    pincode:{p:'pin',i:'📍',e:'110001',d:'Pincode Area Details',c:'location'},
    ip:{p:'ip',i:'🌐',e:'8.8.8.8',d:'IP Geolocation',c:'location'},
    vehicle:{p:'vehicle',i:'🚗',e:'MH02FZ0555',d:'Vehicle Registration',c:'vehicle'},
    rc:{p:'owner',i:'📋',e:'UP92P2111',d:'RC Owner Information',c:'vehicle'},
    ff:{p:'uid',i:'🎮',e:'123456789',d:'Free Fire Account Info',c:'gaming'},
    bgmi:{p:'uid',i:'🎮',e:'5121439477',d:'BGMI Account Details',c:'gaming'},
    insta:{p:'username',i:'📸',e:'cristiano',d:'Instagram Profile Info',c:'social'},
    git:{p:'username',i:'💻',e:'ftgamer2',d:'GitHub Profile Lookup',c:'social'},
    tg:{p:'info',i:'📲',e:'JAUUOWNER',d:'Telegram Username Info',c:'social'},
    tgidinfo:{p:'id',i:'📲',e:'7530266953',d:'Telegram ID Information',c:'social'},
    snap:{p:'username',i:'👻',e:'priyapanchal272',d:'Snapchat Profile Lookup',c:'social'},
    pk:{p:'num',i:'🇵🇰',e:'03331234567',d:'Pakistan Number Lookup',c:'pakistan'},
    pkv2:{p:'num',i:'🇵🇰',e:'3359736848',d:'Pakistan Number v2',c:'pakistan'}
};

// ========== EXPRESS MIDDLEWARE ==========
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true,limit:'50mb'}));
app.use((req,res,next)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,x-api-key,x-admin-token');if(req.method==='OPTIONS')return res.status(200).end();next();});
app.use((req,res,next)=>{req.clientIP=req.headers['x-forwarded-for']?.split(',')[0]?.trim()||req.headers['x-real-ip']||req.connection?.remoteAddress||'unknown';req.userAgent=req.headers['user-agent']||'Unknown';if(isIPBanned(req.clientIP)&&!req.path.startsWith('/admin'))return res.status(403).json({error:'🚫 IP Banned',banned:true});next();});

// ========== PUBLIC ROUTES ==========
app.get('/',(req,res)=>{try{res.send(renderHome())}catch(e){res.status(500).json({error:e.message})}});
app.get('/test',(req,res)=>{res.json({status:'✅ BRONX OSINT v21 KING ULTRA',time:getIndiaDateTime(),storage:STORAGE_URL,keys:Object.keys(keyStorage).filter(k=>!keyStorage[k]?.hidden).length,endpoints:Object.keys(endpoints).length})});
app.get('/key-info',(req,res)=>{const key=req.query.key;if(!key)return res.status(400).json({error:'Missing key'});const kd=keyStorage[key];if(!kd||kd.hidden)return res.status(404).json({error:'Key not found'});res.json({success:true,key:key.substring(0,4)+'****'+key.substring(key.length-4),owner:kd.name,type:kd.type,scopes:kd.scopes,limit:kd.unlimited?'∞':kd.limit,used:kd.used,remaining:kd.unlimited?'∞':Math.max(0,kd.limit-kd.used),cooldown:kd.cooldown||0,expiry:kd.expiryStr||'LIFETIME'})});
app.get('/quota',(req,res)=>{const key=req.query.key;if(!key)return res.status(400).json({error:'Missing key'});const kd=keyStorage[key];if(!kd||kd.hidden)return res.status(404).json({error:'Key not found'});if(kd.expiry&&isKeyExpired(kd.expiry))return res.json({remaining:0,status:'expired'});if(!kd.unlimited&&kd.used>=kd.limit)return res.json({remaining:0,status:'exhausted'});res.json({remaining:kd.unlimited?'∞':Math.max(0,kd.limit-kd.used),status:'active'})});

// ========== API ROUTES ==========
app.get('/api/custom/:ep',async(req,res)=>{try{const{ep}=req.params;const apiKey=req.query.key||req.headers['x-api-key'];const customAPI=customAPIs.find(a=>a.endpoint===ep&&a.visible);if(!customAPI)return res.status(404).json({error:'Not found'});if(!apiKey)return res.status(401).json({error:'API Key required'});const keyCheck=checkKeyValid(apiKey);if(!keyCheck.valid)return res.status(403).json({error:keyCheck.error});const paramValue=req.query[customAPI.param]||req.query.number;if(!paramValue)return res.status(400).json({error:'Missing parameter: '+customAPI.param});let realURL=customAPI.realAPI.replace(/\{param\}/gi,encodeURIComponent(paramValue));if(req.query.count)realURL=realURL.replace('counter=10','counter='+req.query.count);const response=await axios.get(realURL,{timeout:30000});incrementKeyUsage(apiKey);logRequest(apiKey,'c/'+ep,paramValue,'success',req.clientIP,req.userAgent);res.json({...sanitizeResponse(response.data),api_info:{endpoint:ep,powered_by:'@BRONX_ULTRA',remaining:keyCheck.keyData?.unlimited?'∞':Math.max(0,(keyCheck.keyData?.limit||0)-(keyCheck.keyData?.used||0))}})}catch(e){res.status(500).json({error:'API error',message:e.message?.substring(0,100)})}});

app.get('/api/key-bronx/:ep',async(req,res)=>{try{const{ep}=req.params;const apiKey=req.query.key||req.headers['x-api-key'];if(!endpoints[ep])return res.status(404).json({error:'Not found',available:Object.keys(endpoints)});if(!apiKey)return res.status(401).json({error:'API Key required'});const keyCheck=checkKeyValid(apiKey);if(!keyCheck.valid)return res.status(403).json({error:keyCheck.error});const scopeCheck=checkKeyScope(keyCheck.keyData,ep);if(!scopeCheck.valid)return res.status(403).json({error:'Scope denied'});const endpoint=endpoints[ep];const paramValue=req.query[endpoint.p];if(!paramValue)return res.status(400).json({error:'Missing '+endpoint.p});const realURL=`${REAL_API_BASE}/${ep}?key=${REAL_API_KEY}&${endpoint.p}=${encodeURIComponent(paramValue)}`;const response=await axios.get(realURL,{timeout:30000});incrementKeyUsage(apiKey);logRequest(apiKey,ep,paramValue,'success',req.clientIP,req.userAgent);const updatedKey=keyStorage[apiKey];res.json({...sanitizeResponse(response.data),api_info:{endpoint:ep,powered_by:'@BRONX_ULTRA',remaining:updatedKey?.unlimited?'∞':Math.max(0,(updatedKey?.limit||0)-(updatedKey?.used||0))}})}catch(e){res.status(500).json({error:'API error',message:e.message?.substring(0,100)})}});

// ========== RENDER HOME (KING ULTRA PREMIUM THEME) ==========
function renderHome() {
    try {
        const vapis = customAPIs.filter(a => a.visible && a.endpoint);
        const totalEndpoints = Object.keys(endpoints).length + vapis.length;
        const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k]?.hidden).length;
        const endpointsJSON = JSON.stringify(endpoints).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
        const esc = escapeHTML;
        
        // Build endpoint cards
        let cardsHTML = '';
        Object.entries(endpoints).forEach(([n, e]) => {
            cardsHTML += `<div class="ep-card" style="--accent:#ff6b6b" onclick="copyEP('${esc(n)}','${esc(e.p)}','${esc(e.e)}')"><span class="ep-icon">${e.i}</span><span class="ep-name">/${esc(n)}</span><span class="ep-desc">${esc(e.d)}</span><code class="ep-param">${esc(e.p)}=${esc(e.e)}</code></div>`;
        });
        vapis.forEach(a => {
            cardsHTML += `<div class="ep-card" style="--accent:#ff9100" onclick="copyCEP('${esc(a.endpoint)}','${esc(a.param)}','${esc(a.example)}')"><span class="ep-icon">🔧</span><span class="ep-name">/${esc(a.endpoint)}</span><span class="ep-desc">${esc(a.desc||'Custom')}</span><code class="ep-param">${esc(a.param)}=${esc(a.example||'value')}</code></div>`;
        });

        const selectOpts = Object.entries(endpoints).map(([n,e]) => `<option value="${esc(n)}" data-p="${esc(e.p)}" data-ex="${esc(e.e)}">${e.i} /${esc(n)}</option>`).join('') + vapis.map(a => `<option value="c_${a.id}" data-c="1" data-ep="${esc(a.endpoint)}" data-p="${esc(a.param)}" data-ex="${esc(a.example)}">🔧 /${esc(a.endpoint)}</option>`).join('');

        return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX OSINT v21 👑 KING ULTRA</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"><style>
:root{--bg:#03030a;--sur:#08081a;--brd:#1a1a3a;--txt:#e0e0f0}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--txt);font-family:'Inter',sans-serif;overflow-x:hidden}
::selection{background:#ff6b6b;color:#fff}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:linear-gradient(#ff6b6b,#cc5de8);border-radius:10px}

/* BG */
.bg{position:fixed;inset:0;pointer-events:none;z-index:0}
.bg .o{position:absolute;border-radius:50%;filter:blur(120px);opacity:.05;animation:fl 14s infinite}
.bg .o:nth-child(1){width:500px;height:500px;background:#ff6b6b;top:-150px;left:-80px}
.bg .o:nth-child(2){width:400px;height:400px;background:#ff922b;top:-80px;right:-80px;animation-delay:-4s}
.bg .o:nth-child(3){width:350px;height:350px;background:#51cf66;bottom:-80px;left:20%;animation-delay:-8s}
.bg .o:nth-child(4){width:300px;height:300px;background:#339af0;bottom:-50px;right:10%;animation-delay:-2s}
.bg .o:nth-child(5){width:250px;height:250px;background:#cc5de8;top:40%;left:40%;animation-delay:-6s}
@keyframes fl{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(50px,-30px) scale(1.1)}50%{transform:translate(-20px,40px) scale(.9)}75%{transform:translate(-40px,-20px) scale(1.05)}}

/* TOP BAR */
.topbar{position:sticky;top:0;z-index:1000;background:linear-gradient(90deg,#ff6b6b,#ff922b,#fcc419,#51cf66,#339af0,#cc5de8,#ff6b6b);background-size:300% 100%;animation:rb 6s linear infinite;padding:8px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;box-shadow:0 4px 30px rgba(255,107,107,.3)}
@keyframes rb{0%{background-position:0% 50%}100%{background-position:300% 50%}}
.topbar .ba{background:rgba(0,0,0,.35);color:#fff;padding:5px 14px;border-radius:20px;font-size:10px;font-weight:700;animation:gl 2s infinite}
@keyframes gl{0%,100%{box-shadow:0 0 8px rgba(255,255,255,.2)}50%{box-shadow:0 0 22px rgba(255,255,255,.6)}}
.topbar .tx{font-size:11px;color:#000;font-weight:800}

/* HERO */
.hero{position:relative;z-index:1;text-align:center;padding:40px 20px 20px}
.hero h1{font-size:56px;font-weight:900;letter-spacing:-3px;background:linear-gradient(90deg,#ff6b6b,#ff922b,#fcc419,#51cf66,#339af0,#cc5de8,#ff6b6b);background-size:400% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:rb 6s linear infinite;margin-bottom:8px;filter:drop-shadow(0 0 30px rgba(255,107,107,.4))}
.hero .sub{font-size:13px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:#666;margin-bottom:4px}
.hero .tag{display:inline-block;background:linear-gradient(135deg,#ff6b6b,#cc5de8);color:#fff;padding:4px 18px;border-radius:20px;font-size:10px;font-weight:800;margin-top:10px;letter-spacing:2px;box-shadow:0 0 25px rgba(204,93,232,.4)}

/* CONTAINER */
.ct{max-width:1100px;margin:0 auto;padding:0 18px;position:relative;z-index:1}

/* STATS */
.st{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;padding:16px;margin-bottom:24px;background:rgba(8,8,26,.9);border:1px solid var(--brd);border-radius:16px;backdrop-filter:blur(20px)}
.st>div{text-align:center;min-width:65px;padding:8px}
.st .v{font-size:26px;font-weight:900;background:linear-gradient(135deg,#ff6b6b,#cc5de8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.st .l{font-size:7px;text-transform:uppercase;letter-spacing:2px;color:#555;margin-top:2px;font-weight:700}

/* PAYMENT */
.pay{background:rgba(8,8,26,.95);border:2px solid #ff922b;border-radius:20px;padding:22px;margin-bottom:24px;box-shadow:0 0 40px rgba(255,146,43,.1)}
.pay h3{font-size:20px;font-weight:800;background:linear-gradient(135deg,#ff922b,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center;margin-bottom:16px}
.pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:16px}
.pc{background:rgba(255,146,43,.03);border:1px solid rgba(255,146,43,.12);border-radius:10px;padding:10px;text-align:center;transition:.3s}
.pc:hover{background:rgba(255,146,43,.08);border-color:#ff922b;transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,146,43,.15)}
.pc .d{font-size:11px;font-weight:700;color:#fff}
.pc .a{font-size:16px;font-weight:900;color:#ff922b;margin-top:3px}
.pc.lt{grid-column:1/-1;background:rgba(204,93,232,.05);border-color:rgba(204,93,232,.2)}
.pc.lt .a{color:#cc5de8}
.pm{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:14px}
.pb{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:8px 14px;color:#ccc;cursor:pointer;font-size:10px;font-weight:600;transition:.3s;font-family:'Inter',sans-serif}
.pb:hover,.pb.on{background:rgba(255,146,43,.12);border-color:#ff922b;color:#ff922b;box-shadow:0 0 15px rgba(255,146,43,.15)}
.upi{text-align:center;padding:14px;background:rgba(0,0,0,.3);border-radius:10px;margin-bottom:12px;display:none}
.upi.s{display:block}
.upi .id{font-size:16px;font-weight:800;color:#ff922b;font-family:'JetBrains Mono',monospace}
.upi img{max-width:180px;border-radius:10px;margin:8px auto;display:block;border:2px solid rgba(255,146,43,.2)}
.cpb{background:linear-gradient(135deg,#ff6b6b,#cc5de8);color:#fff;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:10px;margin-top:6px;font-family:'Inter',sans-serif}
.tgl{text-align:center;margin-top:10px;font-size:11px;color:#777}
.tgl a{color:#339af0;text-decoration:none;font-weight:700}

/* PLAYGROUND */
.pl{background:var(--sur);border:1px solid var(--brd);border-radius:14px;padding:20px;margin-bottom:24px}
.pl h3{font-size:16px;font-weight:700;margin-bottom:12px;background:linear-gradient(135deg,#ff922b,#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.plf{display:flex;gap:8px;flex-wrap:wrap}
.plf select,.plf input{flex:1;min-width:110px;padding:11px 12px;background:var(--bg);border:1px solid var(--brd);border-radius:8px;color:var(--txt);font-size:11px;font-family:'JetBrains Mono',monospace;outline:none;transition:.3s}
.plf select:focus,.plf input:focus{border-color:#ff922b;box-shadow:0 0 0 3px rgba(255,146,43,.08)}
.btx{padding:11px 20px;background:linear-gradient(135deg,#ff6b6b,#cc5de8);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:11px;cursor:pointer;font-family:'Inter',sans-serif;transition:.3s}
.btx:hover{transform:translateY(-2px);box-shadow:0 6px 25px rgba(204,93,232,.4)}
.rb{margin-top:12px;background:#020210;border:1px solid var(--brd);border-radius:8px;padding:12px;max-height:300px;overflow:auto;font-family:'JetBrains Mono',monospace;font-size:9px;display:none;white-space:pre-wrap;color:#51cf66}

/* ENDPOINT GRID */
.eg{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-bottom:24px}
.ep-card{background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:16px;cursor:pointer;transition:.3s;border-top:3px solid var(--accent,#ff6b6b);position:relative;overflow:hidden}
.ep-card:hover{transform:translateY(-3px);box-shadow:0 12px 35px rgba(0,0,0,.5)}
.ep-card .ep-icon{font-size:20px;display:block;margin-bottom:4px}
.ep-card .ep-name{font-size:15px;font-weight:700;color:#fff;display:block;margin-bottom:2px}
.ep-card .ep-desc{font-size:10px;color:#666;display:block;margin-bottom:6px}
.ep-card .ep-param{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--accent,#ff6b6b);background:rgba(0,0,0,.3);padding:3px 6px;border-radius:4px}

/* FOOTER */
.ft{text-align:center;padding:24px;border-top:1px solid var(--brd);position:relative;z-index:1}
.ft .fb{font-size:18px;font-weight:900;background:linear-gradient(90deg,#ff6b6b,#ff922b,#fcc419,#51cf66,#339af0,#cc5de8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.ft .fi{font-size:10px;color:#555;margin-top:4px}
.ft .fi a{color:#777;text-decoration:none}
.ft .fi a:hover{color:#ff922b}

@media(max-width:768px){.hero h1{font-size:30px}.eg{grid-template-columns:1fr}.plf{flex-direction:column}}
</style></head><body>
<div class="bg"><div class="o"></div><div class="o"></div><div class="o"></div><div class="o"></div><div class="o"></div></div>
<div class="topbar"><span class="tx">👑 BRONX ULTRA KING</span><span class="ba">✅ Paid API Available</span></div>
<header class="hero"><h1>BRONX OSINT v21</h1><p class="sub">KILLER ULTRA KING EDITION</p><p style="color:#555;font-size:10px">👑 King Always King 👑 · Unlimited Access · Real-Time DATA · No Error</p><div class="tag">⚡ KING ULTRA ⚡</div></header>
<div class="ct">
<div class="st"><div><div class="v">${totalEndpoints}</div><div class="l">Endpoints</div></div><div><div class="v">${totalKeys}</div><div class="l">Keys</div></div><div><div class="v">∞</div><div class="l">Requests</div></div><div><div class="v">100%</div><div class="l">Working</div></div></div>
<div class="pay">
<h3>💎 GET YOUR PAID API KEY</h3>
<div class="pg"><div class="pc"><div class="d">10 Days</div><div class="a">₹100</div></div><div class="pc"><div class="d">20 Days</div><div class="a">₹200</div></div><div class="pc"><div class="d">30 Days</div><div class="a">₹300</div></div><div class="pc"><div class="d">40 Days</div><div class="a">₹400</div></div><div class="pc"><div class="d">50 Days</div><div class="a">₹500</div></div><div class="pc"><div class="d">60 Days</div><div class="a">₹600</div></div><div class="pc lt"><div class="d">👑 LIFETIME</div><div class="a">₹3000</div></div></div>
<h4 style="color:#fff;text-align:center;margin-bottom:10px;font-size:13px">Your Payment Method?</h4>
<div class="pm"><button class="pb on" onclick="swPM('upi')">📱 UPI</button><button class="pb" onclick="swPM('phonepe')">💳 PhonePe</button><button class="pb" onclick="swPM('navi')">🏦 Navi</button><button class="pb" onclick="swPM('paytm')">💰 Paytm</button><button class="pb" onclick="swPM('other')">🔗 Other</button></div>
<div class="upi s" id="up"><p class="id">${PAYMENT_INFO.upiId}</p><img src="${PAYMENT_INFO.scannerImage}" alt="QR" onerror="this.style.display='none'"><button class="cpb" onclick="navigator.clipboard.writeText('${PAYMENT_INFO.upiId}').then(()=>toast('📋 Copied!'))">📋 Copy UPI</button></div>
<p class="tgl">After Payment ✅ Send Screenshot → <a href="https://t.me/${PAYMENT_INFO.telegramUser.replace('@','')}" target="_blank">${PAYMENT_INFO.telegramUser}</a></p>
</div>
<div class="pl"><h3>🧪 API Playground</h3><div class="plf"><select id="es"><option value="">Select Endpoint</option>${selectOpts}</select><input type="text" id="ak" placeholder="API Key..."><input type="text" id="pv" placeholder="Parameter..."><button class="btx" onclick="tAPI()">⚡ Execute</button></div><div class="rb" id="rb"></div></div>
<div class="eg">${cardsHTML}</div>
</div>
<footer class="ft"><p class="fb">BRONX OSINT v21 👑 KING ULTRA</p><p class="fi">Powered by <strong>@BRONX_ULTRA</strong> · <a href="/admin">Admin Panel</a> · <a href="/test">Status</a></p></footer>
<script>
var eps=${endpointsJSON};
function toast(m){var t=document.createElement('div');t.style.cssText='position:fixed;bottom:20px;right:20px;background:#08081a;color:#ff922b;padding:10px 18px;border-radius:10px;font-size:11px;font-weight:600;border:1px solid rgba(255,146,43,.3);z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.7)';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},2000)}
function copyEP(n,p,e){navigator.clipboard.writeText(location.origin+'/api/key-bronx/'+n+'?key=KEY&'+p+'='+e).then(()=>toast('📋 Copied!'))}
function copyCEP(n,p,e){navigator.clipboard.writeText(location.origin+'/api/custom/'+n+'?key=KEY&'+p+'='+e).then(()=>toast('📋 Copied!'))}
function swPM(t){document.querySelectorAll('.pb').forEach(b=>b.classList.remove('on'));event.target.classList.add('on')}
async function tAPI(){var s=document.getElementById('es');var o=s.options[s.selectedIndex];var k=document.getElementById('ak').value;var v=document.getElementById('pv').value;var rb=document.getElementById('rb');if(!s.value||!k||!v){toast('⚠️ Fill all fields');return}var url;if(o.dataset.c==='1')url='/api/custom/'+o.dataset.ep+'?key='+k+'&'+o.dataset.p+'='+v;else url='/api/key-bronx/'+s.value+'?key='+k+'&'+eps[s.value].p+'='+v;rb.style.display='block';rb.style.color='#51cf66';rb.textContent='⏳ Loading...';try{var r=await fetch(url);var d=await r.json();rb.textContent=JSON.stringify(d,null,2);if(d.error)rb.style.color='#ff6b6b'}catch(e){rb.textContent='Error: '+e.message;rb.style.color='#ff6b6b'}}
</script></body></html>`;
    } catch (e) { return '<html><body><h1>Error loading page</h1></body></html>'; }
}

// ========== ADMIN ROUTES ==========
app.get('/admin',(req,res)=>{const token=req.query.token||req.headers['x-admin-token'];if(token&&isAdminAuth(token))return res.send(renderAdminPanel(token));res.send(renderAdminLogin())});

function renderAdminLogin(){return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BRONX Admin</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#03030a;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif}.box{background:#08081a;padding:40px;border-radius:20px;width:380px;border:1px solid #1a1a3a;box-shadow:0 20px 80px rgba(0,0,0,.6);position:relative;overflow:hidden}.box::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#ff6b6b,#ff922b,#fcc419,#51cf66,#339af0,#cc5de8)}.box h2{color:#fff;text-align:center;margin-bottom:20px;font-size:22px}.box input{width:100%;padding:13px;background:#03030a;border:1px solid #1a1a3a;border-radius:10px;color:#fff;margin-bottom:12px;font-size:12px;outline:none}.box input:focus{border-color:#ff922b}.box button{width:100%;padding:13px;background:linear-gradient(135deg,#ff6b6b,#cc5de8);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px}.msg{color:#ff6b6b;text-align:center;margin-top:10px;font-size:11px;display:none}</style></head><body><div class="box"><h2>🔐 Admin Login</h2><input type="text" id="u" placeholder="Username"><input type="password" id="p" placeholder="Password"><button onclick="login()">🔓 Authenticate</button><p class="msg" id="msg"></p></div><script>async function login(){var u=document.getElementById('u').value;var p=document.getElementById('p').value;var m=document.getElementById('msg');if(!u||!p){m.style.display='block';m.textContent='Fill all fields';return}m.style.display='block';m.style.color='#888';m.textContent='Loading...';try{var r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});var d=await r.json();if(d.success){m.style.color='#51cf66';m.textContent='✅ '+d.message;setTimeout(function(){location.href=d.redirect},500)}else{m.style.color='#ff6b6b';m.textContent='❌ '+d.error}}catch(e){m.textContent='❌ Error'}}</script></body></html>`}

function renderAdminPanel(token){
    const allKeys=Object.entries(keyStorage).map(([k,d])=>({key:k,...d,isExpired:d.expiry?isKeyExpired(d.expiry):false,isExhausted:!d.unlimited&&d.used>=d.limit,remaining:d.unlimited?'∞':Math.max(0,d.limit-d.used)}));
    const safeToken=escapeHTML(token);
    const keysHTML=allKeys.map(k=>{
        let s='Active',sc='g';if(k.hidden){s='Master'}else if(k.isExpired){s='Expired';sc='r'}else if(k.isExhausted){s='Limit';sc='o'}
        return `<tr><td class="kc">${escapeHTML(k.key.length>16?k.key.substring(0,14)+'..':k.key)}</td><td>${escapeHTML(k.name||'—')}</td><td>${k.unlimited?'∞':k.limit}</td><td>${k.used}</td><td>${k.remaining}</td><td>${escapeHTML(k.expiryStr||'Lifetime')}</td><td><span class="ba b${sc}">${s}</span></td><td>${k.key!==MASTER_API_KEY?`<button class="ab" onclick="resetKey('${escapeHTML(k.key)}')">↺</button><button class="ar" onclick="deleteKey('${escapeHTML(k.key)}')">✕</button>`:'🔒'}</td></tr>`;
    }).join('');
    const logsHTML=requestLogs.slice(-15).reverse().map(l=>`<div class="li"><span>${l.timestamp||''}</span> <span class="lc">${l.key||''}</span> <code>/${l.endpoint||''}</code> <span style="color:${l.status==='success'?'#51cf66':'#ff6b6b'}">${l.status||''}</span></div>`).join('')||'No logs';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BRONX Admin 👑</title><style>
:root{--bg:#03030a;--sur:#08081a;--brd:#1a1a3a;--txt:#e0e0f0}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--txt);font-family:'Inter',sans-serif}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:linear-gradient(#ff6b6b,#cc5de8)}
.top{background:linear-gradient(90deg,#ff6b6b,#ff922b,#fcc419,#51cf66,#339af0,#cc5de8);background-size:300% 100%;animation:rb 6s linear infinite;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;position:sticky;top:0;z-index:100}
@keyframes rb{0%{background-position:0% 50%}100%{background-position:300% 50%}}
.top h1{font-size:15px;color:#000;font-weight:900}
.ct{padding:16px;max-width:1300px;margin:0 auto}
.st{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px}
.sc{background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:14px;text-align:center}
.sc .v{font-size:26px;font-weight:900;background:linear-gradient(135deg,#ff6b6b,#cc5de8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.sc .l{font-size:7px;color:#555;text-transform:uppercase;letter-spacing:2px}
.tabs{display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap}
.tab{padding:7px 12px;background:var(--sur);border:1px solid var(--brd);border-radius:7px;color:#888;cursor:pointer;font-size:9px;font-weight:600;font-family:'Inter',sans-serif}
.tab.on{background:rgba(255,146,43,.1);border-color:#ff922b;color:#ff922b}
.pn{display:none}.pn.on{display:block}
.sn{background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:18px;margin-bottom:14px}
.sn h3{color:#fff;margin-bottom:12px;font-size:15px}
.fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.fg label{display:block;color:#888;font-size:7px;text-transform:uppercase;margin-bottom:3px}
.fg input,.fg select{width:100%;padding:9px;background:var(--bg);border:1px solid var(--brd);border-radius:6px;color:#fff;font-size:10px;font-family:inherit;outline:none}
.fg input:focus,.fg select:focus{border-color:#ff922b}
.btn1{padding:9px 18px;background:linear-gradient(135deg,#ff6b6b,#cc5de8);color:#fff;border:none;border-radius:6px;font-weight:700;font-size:11px;cursor:pointer;font-family:'Inter',sans-serif}
.btn2{padding:9px 18px;background:transparent;border:1px solid var(--brd);color:#888;border-radius:6px;cursor:pointer;font-size:11px;font-family:'Inter',sans-serif}
table{width:100%;border-collapse:collapse;font-size:8px}
th{background:#0a0a20;color:#888;padding:7px 5px;text-align:left}
td{padding:5px;border-bottom:1px solid rgba(255,255,255,.02)}
tr:hover td{background:rgba(255,255,255,.01)}
.kc{color:#ff922b;font-family:monospace}
.ba{padding:1px 6px;border-radius:8px;font-size:6px;font-weight:700}
.bg{background:rgba(81,207,102,.1);color:#51cf66}
.br{background:rgba(255,107,107,.1);color:#ff6b6b}
.bo{background:rgba(255,146,43,.1);color:#ff922b}
.ab,.ar{padding:3px 6px;font-size:8px;border-radius:3px;border:1px solid;cursor:pointer;margin:0 1px;font-weight:600}
.ab{background:rgba(51,154,240,.1);color:#339af0;border-color:rgba(51,154,240,.3)}
.ar{background:rgba(255,107,107,.1);color:#ff6b6b;border-color:rgba(255,107,107,.3)}
.lb{max-height:280px;overflow:auto;background:var(--bg);border-radius:6px;padding:10px;font-family:monospace;font-size:8px}
.li{display:flex;gap:6px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.01);flex-wrap:wrap;align-items:center}
.lc{color:#ff922b}
.eb{background:var(--bg);border:1px solid #ff922b;border-radius:10px;padding:14px;margin-bottom:12px}
.eb h4{color:#ff922b;font-size:12px;margin-bottom:8px}
.eb textarea{width:100%;min-height:80px;background:var(--bg);border:1px solid var(--brd);color:#fff;padding:8px;border-radius:6px;font-family:monospace;font-size:8px;resize:vertical}
.boo{padding:6px 12px;background:rgba(0,0,0,.2);border:1px solid rgba(0,0,0,.3);color:#fff;border-radius:5px;cursor:pointer;font-size:9px;font-family:'Inter',sans-serif}
</style></head><body>
<div class="top"><h1>🔒 BRONX OSINT v21 👑 KING ADMIN</h1><div style="display:flex;gap:6px;align-items:center"><span style="font-size:8px;color:#000">${getIndiaDateTime()}</span><button class="boo" onclick="window.open('/')">🏠 Home</button><button class="boo" onclick="logout()">🚪 Logout</button></div></div>
<div class="ct">
<div class="st"><div class="sc"><div class="v">${allKeys.filter(k=>!k.hidden).length}</div><div class="l">Total Keys</div></div><div class="sc"><div class="v">${allKeys.filter(k=>!k.hidden&&!k.isExpired&&!k.isExhausted).length}</div><div class="l">Active</div></div><div class="sc"><div class="v">${requestLogs.length}</div><div class="l">Requests</div></div><div class="sc"><div class="v">${bannedIPs.length}</div><div class="l">Banned IPs</div></div></div>
<div class="tabs"><div class="tab on" onclick="st('gen')">🔑 Generator</div><div class="tab" onclick="st('keys')">📋 Keys</div><div class="tab" onclick="st('io')">📦 Import/Export</div><div class="tab" onclick="st('logs')">📜 Logs</div><div class="tab" onclick="st('bulk')">📨 Bulk Keys</div></div>
<div class="pn on" id="pn-gen"><div class="sn"><h3>🔑 Generate Key</h3><div class="fg"><div><label>Key Name</label><input id="gn" placeholder="PREMIUM_001"></div><div><label>Owner</label><input id="go" placeholder="Name"></div><div><label>Limit</label><input id="gl" value="100"></div><div><label>Cooldown</label><input id="gc" value="0"></div><div><label>Expiry</label><select id="ge"><option value="LIFETIME">Lifetime</option><option value="31-12-2027">31 Dec 2027</option><option value="31-12-2028">31 Dec 2028</option></select></div><div><label>Type</label><select id="gt"><option value="premium">Premium</option><option value="demo">Demo</option><option value="vip">VIP</option></select></div><div style="grid-column:1/-1"><label>Scopes</label><div style="display:flex;flex-wrap:wrap;gap:3px;padding:6px;background:var(--bg);border-radius:6px;max-height:80px;overflow:auto;font-size:8px"><label style="cursor:pointer;color:#aaa"><input type="checkbox" value="*" checked onchange="document.querySelectorAll('.scb').forEach(s=>s.checked=this.checked)"> ALL</label>${Object.keys(endpoints).map(e=>'<label style="cursor:pointer;color:#aaa;margin-left:3px"><input type="checkbox" value="'+e+'" class="scb"> '+e+'</label>').join('')}</div></div><div style="grid-column:1/-1"><button class="btn1" onclick="gk()" style="width:100%">🚀 Generate</button></div></div></div></div>
<div class="pn" id="pn-keys"><div class="sn"><h3>📋 All Keys</h3><div style="max-height:400px;overflow:auto"><table><tr><th>Key</th><th>Owner</th><th>Limit</th><th>Used</th><th>Left</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>${keysHTML}</table></div></div></div>
<div class="pn" id="pn-io"><div class="sn"><h3>📦 Import/Export</h3><div class="eb" style="border-color:#51cf66"><h4 style="color:#51cf66">📤 Export</h4><textarea readonly id="ed" onclick="this.select()">${escapeHTML(JSON.stringify(keyStorage,null,2))}</textarea><button class="btn1" onclick="navigator.clipboard.writeText(document.getElementById('ed').value);toast('📋 Copied')" style="margin-top:6px">📋 Copy</button></div><div class="eb" style="border-color:#339af0"><h4 style="color:#339af0">📥 Import</h4><textarea id="id" placeholder="Paste JSON..."></textarea><button class="btn1" onclick="ik()" style="margin-top:6px;background:#339af0">📥 Import</button></div></div></div>
<div class="pn" id="pn-logs"><div class="sn"><h3>📜 Logs</h3><button class="btn1" onclick="cl()" style="margin-bottom:8px;font-size:10px;padding:6px 12px">🗑️ Clear</button><div class="lb">${logsHTML}</div></div></div>
<div class="pn" id="pn-bulk"><div class="sn"><h3>📨 Bulk Keys</h3><div class="fg"><div><label>Prefix</label><input id="bp" value="BULK_"></div><div><label>Count</label><input type="number" id="bc" value="5" max="50"></div><div><label>Limit</label><input id="bl" value="100"></div><div><label>Expiry</label><input id="be" value="31-12-2027"></div><div style="grid-column:1/-1"><button class="btn1" onclick="gb()">📨 Generate</button></div><div style="grid-column:1/-1"><div id="br" style="max-height:150px;overflow:auto;font-family:monospace;font-size:8px;padding:8px;background:var(--bg);border-radius:6px;display:none"></div></div></div></div></div>
</div>
<script>
var TOKEN='${safeToken}';
function toast(m){var t=document.createElement('div');t.style.cssText='position:fixed;bottom:20px;right:20px;background:#08081a;color:#ff922b;padding:10px 16px;border-radius:10px;font-size:11px;font-weight:600;border:1px solid rgba(255,146,43,.3);z-index:9999';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},2000)}
function st(n){document.querySelectorAll('.pn').forEach(p=>p.classList.remove('on'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));document.getElementById('pn-'+n).classList.add('on');event.target.classList.add('on')}
async function ac(u,b){var o={method:b?'POST':'GET',headers:{'Content-Type':'application/json','x-admin-token':TOKEN}};if(b)o.body=JSON.stringify(b);var r=await fetch(u,o);return await r.json()}
async function gk(){var n=document.getElementById('gn').value.trim();var o=document.getElementById('go').value.trim();if(!n||!o){toast('Fill fields');return}var sc=[];document.querySelectorAll('#pn-gen input[type=checkbox]:checked').forEach(c=>sc.push(c.value));var r=await ac('/admin/generate-key',{keyName:n,keyOwner:o,scopes:sc,limit:document.getElementById('gl').value,cooldown:parseInt(document.getElementById('gc').value)||0,expiryDate:document.getElementById('ge').value,keyType:document.getElementById('gt').value});r.success?(toast('✅ '+n),setTimeout(()=>location.reload(),600)):toast('❌ '+(r.error||r.e))}
async function resetKey(k){if(!confirm('Reset?'))return;var r=await ac('/admin/reset-key-usage',{keyName:k});r.success?location.reload():toast('❌')}
async function deleteKey(k){if(!confirm('Delete?'))return;var r=await ac('/admin/delete-key',{keyName:k});r.success?location.reload():toast('❌')}
async function cl(){if(!confirm('Clear?'))return;await ac('/admin/clear-logs');location.reload()}
async function ik(){var d=document.getElementById('id').value.trim();if(!d){toast('Paste JSON');return}try{var ks=JSON.parse(d);var r=await ac('/admin/import-keys',{keys:ks});r.success?(toast('✅ '+r.imported),setTimeout(()=>location.reload(),600)):toast('❌')}catch(e){toast('❌ Invalid JSON')}}
async function gb(){var p=document.getElementById('bp').value.trim()||'BULK_';var c=parseInt(document.getElementById('bc').value)||5;var l=document.getElementById('bl').value||'100';var e=document.getElementById('be').value||'31-12-2027';if(c>50){toast('Max 50');return}var rd=document.getElementById('br');rd.style.display='block';rd.innerHTML='Generating...';for(var i=1;i<=c;i++){var r=await ac('/admin/generate-key',{keyName:p+i,keyOwner:'Bulk_'+i,scopes:['*'],limit:l,cooldown:0,expiryDate:e,keyType:'bulk'});rd.innerHTML+='<div>'+(r.success?'✅':'❌')+' '+p+i+'</div>'}toast('✅ Done')}
function logout(){location.href='/admin'}
</script></body></html>`;
}

// ========== ADMIN API ==========
app.post('/admin/login',async(req,res)=>{const{username,password}=req.body;if(username===ADMIN_USERNAME&&password===ADMIN_PASSWORD){const token=generateToken();adminSessions[token]={expiresAt:Date.now()+(365*24*60*60*1000),permanent:true};permanentTokens[token]={createdAt:getIndiaDateTime()};scheduleSave();res.json({success:true,token,message:'✅ Welcome!',redirect:'/admin?token='+token})}else res.status(401).json({success:false,error:'Invalid'})});
app.post('/admin/generate-key',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.status(401).json({e:'Unauthorized'});const{keyName,keyOwner,scopes,limit,cooldown,expiryDate,keyType}=req.body;if(!keyName||!keyOwner||!scopes?.length)return res.status(400).json({e:'Missing'});if(keyStorage[keyName])return res.status(400).json({e:'Exists'});const isUnlimited=limit==='unlimited'||parseInt(limit)>=999999;keyStorage[keyName]={name:keyOwner,scopes,type:keyType||'premium',limit:isUnlimited?999999:(parseInt(limit)||100),used:0,cooldown:parseInt(cooldown)||0,expiry:(expiryDate&&expiryDate!=='LIFETIME')?parseExpiryDate(expiryDate):null,expiryStr:expiryDate||'LIFETIME',created:getIndiaDateTime(),unlimited:isUnlimited,hidden:false};scheduleSave();res.json({success:true})});
app.post('/admin/delete-key',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.status(401).json({e:'Unauthorized'});if(req.body.keyName===MASTER_API_KEY)return res.status(400).json({e:'Protected'});delete keyStorage[req.body.keyName];scheduleSave();res.json({success:true})});
app.post('/admin/reset-key-usage',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.status(401).json({e:'Unauthorized'});if(keyStorage[req.body.keyName]){keyStorage[req.body.keyName].used=0;scheduleSave();res.json({success:true})}else res.status(404).json({e:'Not found'})});
app.get('/admin/keys',(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.status(401).json({e:'Unauthorized'});res.json({success:true,keys:Object.entries(keyStorage).map(([k,d])=>({key:k===MASTER_API_KEY?'[SECURE]':k,name:d.name}))})});
app.post('/admin/clear-logs',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.status(401).json({});requestLogs=[];res.json({success:true})});
app.post('/admin/import-keys',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.status(401).json({e:'Unauthorized'});const{keys}=req.body;if(!keys||typeof keys!=='object')return res.status(400).json({e:'Invalid'});let imported=0;Object.entries(keys).forEach(([kn,kd])=>{if(kn===MASTER_API_KEY||keyStorage[kn])return;keyStorage[kn]={name:kd.name||'Imported',scopes:kd.scopes||['number'],type:kd.type||'imported',limit:kd.limit||100,used:kd.used||0,cooldown:kd.cooldown||0,expiry:kd.expiry||null,expiryStr:kd.expiryStr||'LIFETIME',created:kd.created||getIndiaDateTime(),unlimited:kd.unlimited||false,hidden:kd.hidden||false};imported++});scheduleSave();res.json({success:true,imported})});

app.use((req,res)=>{res.status(404).json({error:'Not found'})});

// ========== INIT ==========
(async function(){await loadAllData();if(!keyStorage[MASTER_API_KEY])keyStorage[MASTER_API_KEY]=createMasterKey();scheduleSave();console.log('✅ BRONX OSINT v21 KING ULTRA - OWN STORAGE READY!')})();

module.exports = app;
