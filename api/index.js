// api/index.js - BRONX OSINT v21 - GOD LEVEL ADMIN v30
const express = require('express');
const axios = require('axios');
const app = express();

const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = process.env.REAL_API_KEY || 'bot-new';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'BRONX_ULTRA';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BRONX@2026#OWNER';
const MASTER_API_KEY = process.env.MASTER_API_KEY || 'BRONX_MASTER_' + Math.random().toString(36).substring(2, 10).toUpperCase();
const STORAGE_URL = 'https://bromx-db-stroge.onrender.com';

let keyStorage = {};
let customAPIs = [];
let requestLogs = [];
let adminSessions = {};
let permanentTokens = {};
let bannedIPs = [];
let cooldownTimers = {};

// ========== STORAGE (FIXED) ==========
async function saveToStorage() {
    try {
        const data = { 
            keys: keyStorage, 
            apis: customAPIs, 
            tokens: permanentTokens, 
            banned: bannedIPs 
        };
        await axios.post(`${STORAGE_URL}/keys`, data, { 
            timeout: 10000, 
            headers: { 'Content-Type': 'application/json' } 
        });
        console.log('💾 Saved! Keys:', Object.keys(keyStorage).length);
    } catch (e) { 
        console.log('⚠️ Save error:', e.message); 
    }
}

async function loadFromStorage() {
    try {
        const res = await axios.get(`${STORAGE_URL}/keys`, { timeout: 10000 });
        if (res.data) {
            const d = res.data;
            // Keys - ensure master key exists
            if (d.keys && typeof d.keys === 'object' && Object.keys(d.keys).length > 0) {
                keyStorage = d.keys;
                if (!keyStorage[MASTER_API_KEY]) {
                    keyStorage[MASTER_API_KEY] = createMasterKey();
                }
            }
            // APIs
            if (d.apis && Array.isArray(d.apis) && d.apis.length > 0) {
                customAPIs = d.apis;
            }
            // Tokens
            if (d.tokens && typeof d.tokens === 'object') {
                permanentTokens = d.tokens;
                Object.entries(permanentTokens).forEach(([t]) => { 
                    adminSessions[t] = { 
                        expiresAt: Date.now() + (365*24*60*60*1000), 
                        permanent: true 
                    }; 
                });
            }
            // Banned IPs
            if (d.banned && Array.isArray(d.banned)) {
                bannedIPs = d.banned;
            }
            console.log('📥 Loaded! Keys:', Object.keys(keyStorage).length, 'Tokens:', Object.keys(adminSessions).length);
            return Object.keys(keyStorage).length > 0;
        }
        return false;
    } catch (e) { 
        console.log('⚠️ Load error:', e.message); 
        return false; 
    }
}

function scheduleSave() { 
    setTimeout(async () => { 
        await saveToStorage(); 
    }, 2000); 
}
setInterval(() => scheduleSave(), 3 * 60 * 1000);

// ========== HELPERS ==========
function getIndiaTime() { return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)); }
function getIndiaDate() { return getIndiaTime().toISOString().split('T')[0]; }
function getIndiaDateTime() { return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19); }
function isKeyExpired(d) { if (!d || d === 'LIFETIME') return false; return getIndiaTime() > new Date(d); }
function parseExpiryDate(s) { if (!s || s === 'LIFETIME') return null; const p = s.split('-'); if (p.length === 3) return p[0].length === 4 ? new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59) : new Date(+p[2], +p[1] - 1, +p[0], 23, 59, 59); const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
function checkCooldown(k) { const kd = keyStorage[k]; if (!kd || !kd.cooldown) return { allowed: true }; const n = Date.now(); if (cooldownTimers[k] && (n - cooldownTimers[k]) < (kd.cooldown * 1000)) { const r = Math.ceil((kd.cooldown * 1000 - (n - cooldownTimers[k])) / 1000); return { allowed: false, remaining: r }; } cooldownTimers[k] = n; return { allowed: true }; }
function checkKeyValid(k) { if (!k) return { valid: false, error: 'Missing key' }; const kd = keyStorage[k]; if (!kd) return { valid: false, error: 'Key not found' }; if (kd.expiry && isKeyExpired(kd.expiry)) return { valid: false, error: 'Expired' }; if (!kd.unlimited && kd.used >= kd.limit) return { valid: false, error: 'Limit reached' }; const cd = checkCooldown(k); if (!cd.allowed) return { valid: false, error: 'Cooldown ' + cd.remaining + 's' }; return { valid: true, keyData: kd }; }
function incrementKeyUsage(k) { if (keyStorage[k] && !keyStorage[k].unlimited) { keyStorage[k].used++; if (keyStorage[k].used % 5 === 0) scheduleSave(); } }
function checkKeyScope(kd, ep) { if (!kd || !kd.scopes) return { valid: false }; if (kd.scopes.includes('*')) return { valid: true }; if (kd.scopes.includes(ep)) return { valid: true }; if (ep.startsWith('c/') && kd.scopes.includes('custom')) return { valid: true }; return { valid: false }; }
function generateToken() { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let t = ''; for (let i = 0; i < 32; i++) t += c.charAt(Math.floor(Math.random() * c.length)); return t; }
function isAdminAuth(t) { if (!t) return false; if (adminSessions[t]) { if (adminSessions[t].permanent) return true; if (Date.now() < adminSessions[t].expiresAt) return true; delete adminSessions[t]; delete permanentTokens[t]; } return false; }
function isIPBanned(ip) { return ip && ip !== 'unknown' && bannedIPs.includes(ip); }
function banIP(ip) { if (ip && ip !== 'unknown' && !bannedIPs.includes(ip)) { bannedIPs.push(ip); scheduleSave(); } }
function unbanIP(ip) { const i = bannedIPs.indexOf(ip); if (i > -1) { bannedIPs.splice(i, 1); scheduleSave(); } }
function sanitizeResponse(d) { if (!d) return d; try { const c = JSON.parse(JSON.stringify(d)); delete c.truecaller_name; delete c.cached; delete c.cached_at; delete c.by; delete c.channel; delete c.developer; delete c.api_key; delete c.real_url; delete c.source_url; delete c.internal_id; c.powered_by = "BRONX_ULTRA"; return c; } catch (e) { return d; } }
function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function createMasterKey() { return { name:'👑 OWNER',scopes:['*'],type:'owner',limit:999999,used:0,cooldown:0,expiry:null,expiryStr:'LIFETIME',created:getIndiaDateTime(),unlimited:true,hidden:true }; }

function initDefaultData() {
    const now = getIndiaDateTime(); keyStorage = {}; keyStorage[MASTER_API_KEY] = createMasterKey();
    const dk = [
        { key:'BRONX_DEMO_001',name:'🎁 Premium',scopes:['*'],limit:1000,cooldown:0,expiry:'31-12-2027' },
        { key:'BRONX_DEMO_002',name:'🎁 Basic',scopes:['number','aadhar','pan','upi'],limit:500,cooldown:2,expiry:'30-06-2027' },
        { key:'BRONX_DEMO_003',name:'🎁 Starter',scopes:['number','ip','pincode'],limit:200,cooldown:1,expiry:'31-12-2027' },
        { key:'BRONX_OP_KEY',name:'🎁 OP',scopes:['*'],limit:999,cooldown:0,expiry:'31-12-2027' },
        { key:'BRONX_PRO_KEY',name:'🎁 Pro',scopes:['*'],limit:5000,cooldown:0,expiry:'31-12-2028' },
        { key:'BRONX_BOMBER',name:'🎁 Bomber',scopes:['number','custom'],limit:300,cooldown:3,expiry:'31-12-2027' },
    ];
    dk.forEach(d => { keyStorage[d.key] = { name:d.name,scopes:d.scopes,type:'demo',limit:d.limit,used:0,cooldown:d.cooldown||0,expiry:parseExpiryDate(d.expiry),expiryStr:d.expiry,created:now,unlimited:false,hidden:false }; });
}

function initCustomAPIs() {
    customAPIs = [
        { id:1,name:'Number Info',endpoint:'number-advanced',param:'num',example:'9876543210',visible:true,realAPI:'https://num-tg-info-api.vercel.app/info?number={param}' },
        { id:2,name:'Vehicle RC',endpoint:'rc-details',param:'ca_number',example:'MH02FZ0555',visible:true,realAPI:'https://bronx-rc-api.vercel.app/?ca_number={param}' },
        { id:3,name:'Aadhar',endpoint:'aadhar-verify',param:'aadhar',example:'393933081942',visible:true,realAPI:'https://bronx-king-vip999.vercel.app/api/aadhaar?num={param}' },
        { id:4,name:'Email',endpoint:'email-lookup',param:'mail',example:'user@gmail.com',visible:true,realAPI:'https://bronx-king-mail-opi.vercel.app/mail={param}' },
        { id:5,name:'Telegram',endpoint:'telegram-scan',param:'id',example:'7530266953',visible:true,realAPI:'https://bronx-tg-king-bro.vercel.app/tg?key=BRONXop&query={param}' },
        { id:6,name:'SMS Bomber',endpoint:'sms-bomber',param:'number',example:'1234567890',visible:true,realAPI:'https://bronx-sms-api-ulimate.vercel.app/api/key-bronx-paid-vip?number={param}&counter=10' },
        { id:7,name:'Number info Backup',endpoint:'num-op',param:'num',example:'9876543210',visible:true,realAPI:'https://tfqdeadlo-inddataapi.hf.space/search?mobile={param}' },
        { id:8,name:'Slot 8',endpoint:'',param:'',example:'',visible:false,realAPI:'' },
        { id:9,name:'Slot 9',endpoint:'',param:'',example:'',visible:false,realAPI:'' },
        { id:10,name:'Slot 10',endpoint:'',param:'',example:'',visible:false,realAPI:'' }
    ];
}

const endpoints = {
    number:{p:'num',i:'📱',e:'9876543210',d:'Mobile Lookup',c:'phone'},aadhar:{p:'num',i:'🆔',e:'393933081942',d:'Aadhaar Details',c:'phone'},
    name:{p:'name',i:'🔍',e:'abhiraaj',d:'Name Search',c:'phone'},numv2:{p:'num',i:'📱',e:'6205949840',d:'Number v2',c:'phone'},
    adv:{p:'num',i:'📱',e:'9876543210',d:'Advanced Intel',c:'phone'},adharfamily:{p:'num',i:'👨‍👩‍👧‍👦',e:'984154610245',d:'Family Details',c:'phone'},
    adharration:{p:'num',i:'📋',e:'701984830542',d:'Ration Card',c:'phone'},imei:{p:'imei',i:'📱',e:'357817383506298',d:'IMEI Info',c:'phone'},
    calltracer:{p:'num',i:'📞',e:'9876543210',d:'Call Tracer',c:'phone'},upi:{p:'upi',i:'💰',e:'example@ybl',d:'UPI Lookup',c:'finance'},
    ifsc:{p:'ifsc',i:'🏦',e:'SBIN0001234',d:'IFSC Details',c:'finance'},pan:{p:'pan',i:'📄',e:'AXDPR2606K',d:'PAN Card',c:'finance'},
    pincode:{p:'pin',i:'📍',e:'110001',d:'Pincode',c:'location'},ip:{p:'ip',i:'🌐',e:'8.8.8.8',d:'IP Lookup',c:'location'},
    vehicle:{p:'vehicle',i:'🚗',e:'MH02FZ0555',d:'Vehicle Info',c:'vehicle'},rc:{p:'owner',i:'📋',e:'UP92P2111',d:'RC Owner',c:'vehicle'},
    ff:{p:'uid',i:'🎮',e:'123456789',d:'Free Fire',c:'gaming'},bgmi:{p:'uid',i:'🎮',e:'5121439477',d:'BGMI',c:'gaming'},
    insta:{p:'username',i:'📸',e:'cristiano',d:'Instagram',c:'social'},git:{p:'username',i:'💻',e:'ftgamer2',d:'GitHub',c:'social'},
    tg:{p:'info',i:'📲',e:'JAUUOWNER',d:'Telegram',c:'social'},tgidinfo:{p:'id',i:'📲',e:'7530266953',d:'TG ID Info',c:'social'},
    snap:{p:'username',i:'👻',e:'priyapanchal272',d:'Snapchat',c:'social'},pk:{p:'num',i:'🇵🇰',e:'03331234567',d:'Pakistan',c:'pakistan'},
    pkv2:{p:'num',i:'🇵🇰',e:'3359736848',d:'Pakistan v2',c:'pakistan'}
};

// ========== EXPRESS ==========
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({extended:true,limit:'50mb'}));
app.use((req,res,next)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,x-api-key,x-admin-token');if(req.method==='OPTIONS')return res.status(200).end();next();});
app.use((req,res,next)=>{req.clientIP=req.headers['x-forwarded-for']?.split(',')[0]?.trim()||'unknown';if(isIPBanned(req.clientIP)&&!req.path.startsWith('/admin'))return res.status(403).json({error:'IP Banned'});next();});

app.get('/',(req,res)=>{try{res.send(renderHome())}catch(e){res.status(500).send('Error')}});
app.get('/test',(req,res)=>{res.json({status:'✅ OK',keys:Object.keys(keyStorage).filter(k=>!keyStorage[k]?.hidden).length})});
app.get('/key-info',(req,res)=>{const k=req.query.key;if(!k)return res.json({error:'Missing key'});const kd=keyStorage[k];if(!kd||kd.hidden)return res.json({error:'Not found'});res.json({key:k.substring(0,4)+'****',owner:kd.name,limit:kd.unlimited?'∞':kd.limit,used:kd.used,expiry:kd.expiryStr||'LIFETIME'})});
app.get('/api/custom/:ep',async(req,res)=>{try{const api=customAPIs.find(a=>a.endpoint===req.params.ep&&a.visible);if(!api)return res.json({error:'Not found'});const key=req.query.key;if(!key)return res.json({error:'Key required'});const kc=checkKeyValid(key);if(!kc.valid)return res.json({error:kc.error});const pv=req.query[api.param]||req.query.number;if(!pv)return res.json({error:'Missing param'});let url=api.realAPI.replace(/\{param\}/gi,encodeURIComponent(pv));if(req.query.count)url=url.replace('counter=10','counter='+req.query.count);const resp=await axios.get(url,{timeout:30000});incrementKeyUsage(key);res.json({...sanitizeResponse(resp.data),api_info:{remaining:kc.keyData?.unlimited?'∞':Math.max(0,(kc.keyData?.limit||0)-(kc.keyData?.used||0))}})}catch(e){res.json({error:'API error'})}});
app.get('/api/key-bronx/:ep',async(req,res)=>{try{const ep=req.params.ep;if(!endpoints[ep])return res.json({error:'Not found'});const key=req.query.key;if(!key)return res.json({error:'Key required'});const kc=checkKeyValid(key);if(!kc.valid)return res.json({error:kc.error});const sc=checkKeyScope(kc.keyData,ep);if(!sc.valid)return res.json({error:'Scope denied'});const pv=req.query[endpoints[ep].p];if(!pv)return res.json({error:'Missing '+endpoints[ep].p});const url=`${REAL_API_BASE}/${ep}?key=${REAL_API_KEY}&${endpoints[ep].p}=${encodeURIComponent(pv)}`;const resp=await axios.get(url,{timeout:30000});incrementKeyUsage(key);res.json({...sanitizeResponse(resp.data),api_info:{remaining:keyStorage[key]?.unlimited?'∞':Math.max(0,(keyStorage[key]?.limit||0)-(keyStorage[key]?.used||0))}})}catch(e){res.json({error:'API error'})}});

// ========== ADMIN ROUTES ==========
app.get('/admin',(req,res)=>{try{const token=req.query.token||req.headers['x-admin-token'];if(token&&isAdminAuth(token))return res.send(renderAdmin(token));res.send(renderLogin())}catch(e){res.status(500).send('<h1>Error</h1>')}});
app.post('/admin/login',async(req,res)=>{const{username,password}=req.body;if(username===ADMIN_USERNAME&&password===ADMIN_PASSWORD){const token=generateToken();adminSessions[token]={expiresAt:Date.now()+(365*24*60*60*1000),permanent:true};permanentTokens[token]={createdAt:getIndiaDateTime()};scheduleSave();res.json({success:true,token,message:'Access Granted',redirect:'/admin?token='+token})}else res.json({success:false,error:'Invalid'})});
app.post('/admin/generate-key',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{keyName,keyOwner,scopes,limit,cooldown,expiryDate,keyType,days}=req.body;if(!keyName||!keyOwner)return res.json({e:'Missing'});if(keyStorage[keyName])return res.json({e:'Exists'});let expiry=null,expiryStr=expiryDate||'LIFETIME';if(days&&!isNaN(days)){const d=new Date(getIndiaTime().getTime()+parseInt(days)*24*60*60*1000);expiry=d;expiryStr=d.toISOString().split('T')[0].split('-').reverse().join('-');}else if(expiryDate&&expiryDate!=='LIFETIME'){expiry=parseExpiryDate(expiryDate);expiryStr=expiryDate;}keyStorage[keyName]={name:keyOwner,scopes:scopes||['number'],type:keyType||'premium',limit:limit==='unlimited'?999999:(parseInt(limit)||100),used:0,cooldown:parseInt(cooldown)||0,expiry:expiry,expiryStr:expiryStr,created:getIndiaDateTime(),unlimited:(!days&&(!expiryDate||expiryDate==='LIFETIME'))||limit==='unlimited'||parseInt(limit)>=999999,hidden:false};scheduleSave();res.json({success:true})});
app.post('/admin/push-key',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{keyName,days}=req.body;if(!keyStorage[keyName])return res.json({e:'Not found'});const d=parseInt(days)||30;const newExp=new Date(getIndiaTime().getTime()+d*24*60*60*1000);keyStorage[keyName].expiry=newExp;keyStorage[keyName].expiryStr=newExp.toISOString().split('T')[0].split('-').reverse().join('-');keyStorage[keyName].used=0;keyStorage[keyName].unlimited=false;scheduleSave();res.json({success:true,message:`Pushed ${d} days`})});
app.post('/admin/delete-key',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});if(req.body.keyName===MASTER_API_KEY)return res.json({e:'Protected'});delete keyStorage[req.body.keyName];scheduleSave();res.json({success:true})});
app.post('/admin/reset-key-usage',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});if(keyStorage[req.body.keyName]){keyStorage[req.body.keyName].used=0;scheduleSave();res.json({success:true})}else res.json({e:'Not found'})});
app.get('/admin/keys',(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});res.json({success:true,keys:Object.keys(keyStorage)})});
app.post('/admin/import-keys',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{keys}=req.body;if(!keys||typeof keys!=='object')return res.json({e:'Invalid'});let imported=0;Object.entries(keys).forEach(([kn,kd])=>{if(kn===MASTER_API_KEY||keyStorage[kn])return;keyStorage[kn]={name:kd.name||'Imported',scopes:kd.scopes||['number'],type:kd.type||'imported',limit:kd.limit||100,used:kd.used||0,cooldown:kd.cooldown||0,expiry:kd.expiry||null,expiryStr:kd.expiryStr||'LIFETIME',created:kd.created||getIndiaDateTime(),unlimited:kd.unlimited||false,hidden:kd.hidden||false};imported++});scheduleSave();res.json({success:true,imported})});
app.post('/admin/ban-ip',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{ip}=req.body;if(!ip)return res.json({e:'Missing IP'});banIP(ip);scheduleSave();res.json({success:true})});
app.post('/admin/unban-ip',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});const{ip}=req.body;if(!ip)return res.json({e:'Missing IP'});unbanIP(ip);scheduleSave();res.json({success:true})});
app.post('/admin/clear-logs',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({});requestLogs=[];res.json({success:true})});
app.post('/admin/reset-all',async(req,res)=>{if(!isAdminAuth(req.headers['x-admin-token']||req.query.token))return res.json({e:'Unauthorized'});Object.keys(keyStorage).forEach(k=>{if(k!==MASTER_API_KEY)keyStorage[k].used=0});scheduleSave();res.json({success:true})});
app.use((req,res)=>{res.json({error:'Not found'})});

// ========== RENDER FUNCTIONS ==========
function renderLogin(){return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>// BRONX_ROOT //</title><style>
*{margin:0;padding:0;box-sizing:border-box}@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
body{background:#000a00;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:'Share Tech Mono',monospace;overflow:hidden}
body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,0,.02) 2px,rgba(0,255,0,.02) 4px);animation:scan 8s linear infinite;pointer-events:none;z-index:0}
@keyframes scan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
.box{background:rgba(0,15,0,.95);padding:40px;border-radius:2px;width:400px;border:1px solid #00ff0030;position:relative;z-index:1;box-shadow:0 0 60px rgba(0,255,0,.1),inset 0 0 60px rgba(0,255,0,.02)}
.box::before{content:'[ SYSTEM AUTHENTICATION ]';display:block;color:#00ff00;text-align:center;font-size:10px;letter-spacing:4px;margin-bottom:25px;text-shadow:0 0 10px #00ff00;animation:flicker 3s infinite}
@keyframes flicker{0%,100%{opacity:1}92%{opacity:0.8}94%{opacity:1}96%{opacity:0.9}}
.box h2{color:#00ff00;text-align:center;margin-bottom:20px;font-size:20px;text-shadow:0 0 15px #00ff00;letter-spacing:2px}
.box input{width:100%;padding:14px;background:#000a00;border:1px solid #00ff0040;border-radius:2px;color:#00ff00;margin-bottom:12px;font-size:13px;outline:none;font-family:'Share Tech Mono',monospace;transition:.3s}
.box input:focus{border-color:#00ff00;box-shadow:0 0 20px rgba(0,255,0,.2)}
.box input::placeholder{color:#006600}
.btn{width:100%;padding:14px;background:transparent;color:#00ff00;border:1px solid #00ff00;border-radius:2px;cursor:pointer;font-size:14px;font-weight:700;letter-spacing:3px;font-family:'Share Tech Mono',monospace;transition:.3s;text-transform:uppercase}
.btn:hover{background:#00ff0020;box-shadow:0 0 40px rgba(0,255,0,.3),inset 0 0 40px rgba(0,255,0,.1)}
.msg{color:#ff0040;text-align:center;margin-top:12px;font-size:11px;display:none;text-shadow:0 0 10px #ff0040}
.fp{text-align:center;margin-top:20px;font-size:10px;color:#006600;letter-spacing:1px}
</style></head><body><div class="box"><h2>// BRONX ADMIN //</h2><input type="text" id="u" placeholder="USERNAME"><input type="password" id="p" placeholder="PASSWORD"><button class="btn" onclick="login()">[ AUTHENTICATE ]</button><p class="msg" id="msg"></p><p class="fp">BRONX OSINT v30 · GOD LEVEL</p></div><script>
async function login(){var u=document.getElementById('u').value,p=document.getElementById('p').value,m=document.getElementById('msg');if(!u||!p){m.style.display='block';m.textContent='[!] ACCESS DENIED: Fill all fields';return}m.style.display='block';m.style.color='#00ff00';m.textContent='[*] Authenticating...';try{var r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});var d=await r.json();if(d.success){m.style.color='#00ff00';m.textContent='[+] '+d.message;setTimeout(function(){location.href=d.redirect},500)}else{m.style.color='#ff0040';m.textContent='[!] '+d.error}}catch(e){m.textContent='[!] Connection Error'}}
</script></body></html>`}

function renderAdmin(token){try{
const allKeys=Object.entries(keyStorage).map(([k,d])=>({key:k,name:d.name||'?',type:d.type||'?',limit:d.unlimited?'∞':d.limit,used:d.used||0,left:d.unlimited?'∞':Math.max(0,(d.limit||0)-(d.used||0)),expiry:d.expiryStr||'Lifetime',hidden:d.hidden||false,scopes:d.scopes||[],cooldown:d.cooldown||0,isExpired:d.expiry?isKeyExpired(d.expiry):false,created:d.created||''}));
const totalKeys=allKeys.filter(k=>!k.hidden).length;
const activeKeys=allKeys.filter(k=>!k.hidden&&!k.isExpired&&k.left!=0).length;
const todayReqs=requestLogs.filter(l=>l.timestamp&&l.timestamp.startsWith(getIndiaDate())).length;
const stoken=esc(token);

let keysHTML='';
allKeys.forEach(k=>{
let s='● ACTIVE',sc='#00ff00';
if(k.hidden){s='👑 MASTER';sc='#ff00ff'}
else if(k.isExpired){s='⏱ EXPIRED';sc='#ff0040'}
else if(k.left==0){s='⚠ LIMIT';sc='#ffcc00'}
const acts=k.key!==MASTER_API_KEY?`<button class="ab a-g" onclick="resetKey('${esc(k.key)}')">↺</button><button class="ab a-y" onclick="pushKey('${esc(k.key)}')">↑</button><button class="ab a-r" onclick="deleteKey('${esc(k.key)}')">✕</button>`:'<span style="color:#ff00ff">🔒</span>';
keysHTML+=`<tr><td style="color:#00ff00;font-family:monospace;font-size:8px">${esc(k.key.length>14?k.key.substring(0,12)+'..':k.key)}</td><td>${esc(k.name)}</td><td style="color:#00ccff">${k.limit}</td><td>${k.used}</td><td>${k.left}</td><td style="font-size:7px">${esc(k.expiry)}</td><td style="color:${sc};font-size:7px">${s}</td><td>${acts}</td></tr>`;
});

const ipStats={};requestLogs.forEach(l=>{const ip=l.ip||'?';ipStats[ip]=(ipStats[ip]||0)+1});
const ipHTML=Object.entries(ipStats).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([ip,c])=>{const bd=bannedIPs.includes(ip);return`<tr><td style="color:#00ccff;font-size:8px">${esc(ip)}</td><td>${c}</td><td style="color:${bd?'#ff0040':'#00ff00'}">${bd?'🚫 BANNED':'✅ ACTIVE'}</td><td><button class="ab ${bd?'a-g':'a-r'}" onclick="${bd?`unbanIP('${esc(ip)}')`:`banIP('${esc(ip)}')`}">${bd?'UNBAN':'BAN'}</button></td></tr>`}).join('');

const logsHTML=requestLogs.slice(-20).reverse().map(l=>`<div style="padding:2px 0;border-bottom:1px solid rgba(0,255,0,.05);font-size:8px"><span style="color:#006600">${(l.timestamp||'').substring(0,16)}</span> <span style="color:#00ccff">${l.key||'?'}</span> <span style="color:#ffcc00">/${l.endpoint||'?'}</span> <span style="color:${l.status==='success'?'#00ff00':'#ff0040'}">${l.status||'?'}</span></div>`).join('')||'<div style="color:#006600;text-align:center;padding:20px">[ NO LOGS ]</div>';

return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>// BRONX ADMIN v30 //</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet"><style>
:root{--bg:#000a00;--sur:#001400;--brd:#00ff0020;--txt:#00ff00;--dim:#006600}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--txt);font-family:'Share Tech Mono',monospace;font-size:11px;min-height:100vh}
::selection{background:#00ff00;color:#000}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--txt);border-radius:0}
body::after{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,0,.01) 2px,rgba(0,255,0,.01) 4px);pointer-events:none;z-index:0;animation:scan 8s linear infinite}
@keyframes scan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
.top{background:#001400;border-bottom:1px solid #00ff0030;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;position:sticky;top:0;z-index:100}
.top h1{font-size:14px;color:#00ff00;text-shadow:0 0 15px #00ff00;letter-spacing:3px}
.tb{display:flex;gap:6px;flex-wrap:wrap}
.tb button{background:transparent;color:#00ff00;border:1px solid #00ff0040;padding:5px 10px;cursor:pointer;font-size:9px;font-family:'Share Tech Mono',monospace;transition:.3s}
.tb button:hover{background:#00ff0010;box-shadow:0 0 15px rgba(0,255,0,.2)}
.ct{padding:12px;max-width:1400px;margin:0 auto;position:relative;z-index:1}
.st{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:14px}
.sc{background:var(--sur);border:1px solid var(--brd);padding:12px;text-align:center}
.sc .v{font-size:22px;color:#00ff00;text-shadow:0 0 10px #00ff00}
.sc .l{font-size:7px;color:var(--dim);text-transform:uppercase;letter-spacing:2px;margin-top:2px}
.tabs{display:flex;gap:3px;margin-bottom:12px;flex-wrap:wrap}
.tab{padding:6px 12px;background:var(--sur);border:1px solid var(--brd);color:var(--dim);cursor:pointer;font-size:9px;font-family:'Share Tech Mono',monospace;transition:.3s}
.tab.on{background:rgba(0,255,0,.05);border-color:#00ff00;color:#00ff00;text-shadow:0 0 10px #00ff00}
.pn{display:none}.pn.on{display:block}
.sn{background:var(--sur);border:1px solid var(--brd);padding:14px;margin-bottom:12px}
.sn h3{color:#00ff00;margin-bottom:10px;font-size:13px;letter-spacing:2px}
.fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.fg label{display:block;color:var(--dim);font-size:7px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.fg input,.fg select{width:100%;padding:8px;background:var(--bg);border:1px solid var(--brd);border-radius:2px;color:#00ff00;font-size:10px;font-family:'Share Tech Mono',monospace;outline:none}
.fg input:focus,.fg select:focus{border-color:#00ff00;box-shadow:0 0 10px rgba(0,255,0,.1)}
.btn1{padding:8px 16px;background:transparent;color:#00ff00;border:1px solid #00ff00;cursor:pointer;font-size:10px;font-family:'Share Tech Mono',monospace;letter-spacing:2px;transition:.3s}
.btn1:hover{background:#00ff0010;box-shadow:0 0 20px rgba(0,255,0,.2)}
.btn2{padding:8px 16px;background:transparent;color:var(--dim);border:1px solid var(--brd);cursor:pointer;font-size:10px;font-family:'Share Tech Mono',monospace;transition:.3s}
.btn2:hover{border-color:#00ff00;color:#00ff00}
table{width:100%;border-collapse:collapse;font-size:8px}
th{background:#001a00;color:var(--dim);padding:6px 4px;text-align:left;font-size:7px;letter-spacing:1px}
td{padding:4px;border-bottom:1px solid rgba(0,255,0,.03)}
tr:hover td{background:rgba(0,255,0,.01)}
.ab{padding:3px 6px;font-size:8px;border-radius:2px;border:1px solid;cursor:pointer;margin:0 1px;font-family:'Share Tech Mono',monospace;background:transparent;transition:.3s}
.a-g{color:#00ff00;border-color:#00ff0040}.a-g:hover{background:rgba(0,255,0,.1)}
.a-r{color:#ff0040;border-color:#ff004040}.a-r:hover{background:rgba(255,0,64,.1)}
.a-y{color:#ffcc00;border-color:#ffcc0040}.a-y:hover{background:rgba(255,204,0,.1)}
.eb{background:var(--bg);border:1px solid #00ff0030;padding:12px;margin-bottom:10px}
.eb h4{color:#00ff00;font-size:10px;margin-bottom:6px}
.eb textarea{width:100%;min-height:80px;background:var(--bg);border:1px solid var(--brd);color:#00ff00;padding:8px;border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:8px;resize:vertical}
.lb{max-height:300px;overflow:auto;background:var(--bg);border:1px solid var(--brd);padding:8px;font-family:monospace;font-size:8px}
@media(max-width:768px){.st{grid-template-columns:repeat(2,1fr)}.fg{grid-template-columns:1fr}}
</style></head><body>
<div class="top"><h1>// BRONX_ADMIN_v30 //</h1><div class="tb"><span style="color:var(--dim);font-size:8px">[ ${getIndiaDateTime()} ]</span><button onclick="window.open('/')">HOME</button><button onclick="location.href='/admin'">LOGOUT</button></div></div>
<div class="ct">
<div class="st">
<div class="sc"><div class="v">${totalKeys}</div><div class="l">Total Keys</div></div>
<div class="sc"><div class="v">${activeKeys}</div><div class="l">Active</div></div>
<div class="sc"><div class="v">${todayReqs}</div><div class="l">Today Reqs</div></div>
<div class="sc"><div class="v">${requestLogs.length}</div><div class="l">Total Reqs</div></div>
<div class="sc"><div class="v">${bannedIPs.length}</div><div class="l">Banned IPs</div></div>
</div>
<div class="tabs">
<div class="tab on" onclick="st('gen')">[ GENERATE ]</div>
<div class="tab" onclick="st('keys')">[ ALL KEYS ]</div>
<div class="tab" onclick="st('io')">[ IMPORT/EXPORT ]</div>
<div class="tab" onclick="st('ips')">[ IP MANAGER ]</div>
<div class="tab" onclick="st('logs')">[ LIVE LOGS ]</div>
<div class="tab" onclick="st('bulk')">[ BULK KEYS ]</div>
<div class="tab" onclick="st('push')">[ PUSH KEY ]</div>
<div class="tab" onclick="st('settings')">[ SETTINGS ]</div>
</div>
<div class="pn on" id="pn-gen"><div class="sn"><h3>[ KEY GENERATOR ]</h3><div class="fg">
<div><label>Key ID</label><input id="gn" placeholder="KEY_NAME"></div>
<div><label>Owner</label><input id="go" placeholder="Name"></div>
<div><label>Limit</label><input id="gl" value="100"></div>
<div><label>Cooldown (sec)</label><input id="gc" value="0"></div>
<div><label>Expiry Mode</label><select id="gem" onchange="toggleExp()"><option value="date">Calendar Date</option><option value="days">Days Counter</option><option value="life">Lifetime</option></select></div>
<div id="de"><label>Expiry Date</label><input type="date" id="ged"></div>
<div id="dd" style="display:none"><label>Days</label><input type="number" id="gedd" value="30" min="1"></div>
<div><label>Type</label><select id="gt"><option value="premium">Premium</option><option value="demo">Demo</option><option value="vip">VIP</option></select></div>
<div style="grid-column:1/-1"><label>Scopes</label><div style="display:flex;flex-wrap:wrap;gap:2px;padding:6px;background:var(--bg);border:1px solid var(--brd);max-height:70px;overflow:auto;font-size:7px"><label style="cursor:pointer;color:var(--dim)"><input type="checkbox" value="*" checked onchange="var v=this.checked;document.querySelectorAll('.scb').forEach(s=>s.checked=v)"> ALL</label>${Object.keys(endpoints).map(e=>'<label style="cursor:pointer;color:var(--dim);margin-left:2px"><input type="checkbox" value="'+e+'" class="scb"> '+e+'</label>').join('')}</div></div>
<div style="grid-column:1/-1"><button class="btn1" onclick="gk()" style="width:100%">[ GENERATE KEY ]</button></div>
</div></div></div>
<div class="pn" id="pn-keys"><div class="sn"><h3>[ ALL KEYS : ${totalKeys} ]</h3><div style="max-height:400px;overflow:auto"><table><tr><th>KEY</th><th>OWNER</th><th>LIMIT</th><th>USED</th><th>LEFT</th><th>EXPIRY</th><th>STATUS</th><th>ACTIONS</th></tr>${keysHTML}</table></div></div></div>
<div class="pn" id="pn-io"><div class="sn"><h3>[ IMPORT / EXPORT ]</h3><div class="eb" style="border-color:#00ff0030"><h4>[ EXPORT KEYS ]</h4><textarea readonly id="ed" onclick="this.select()">${esc(JSON.stringify(keyStorage,null,2))}</textarea><button class="btn1" onclick="navigator.clipboard.writeText(document.getElementById('ed').value);toast('[+] Copied')" style="margin-top:6px">[ COPY ]</button></div><div class="eb" style="border-color:#00ccff30"><h4 style="color:#00ccff">[ IMPORT KEYS ]</h4><textarea id="id" placeholder="Paste JSON here..."></textarea><button class="btn1" onclick="ik()" style="margin-top:6px;border-color:#00ccff;color:#00ccff">[ IMPORT ]</button></div></div></div>
<div class="pn" id="pn-ips"><div class="sn"><h3>[ IP MANAGER ]</h3><div style="margin-bottom:8px"><input id="bip" placeholder="Enter IP to ban..." style="padding:6px;background:var(--bg);border:1px solid var(--brd);color:#00ff00;font-family:'Share Tech Mono',monospace;width:200px;font-size:9px"><button class="ab a-r" onclick="banIP2()" style="margin-left:6px;padding:6px 10px">[ BAN ]</button></div><div style="max-height:300px;overflow:auto"><table><tr><th>IP ADDRESS</th><th>REQUESTS</th><th>STATUS</th><th>ACTION</th></tr>${ipHTML}</table></div></div></div>
<div class="pn" id="pn-logs"><div class="sn"><h3>[ LIVE REQUEST LOGS ]</h3><button class="btn1" onclick="clearLogs()" style="margin-bottom:8px;font-size:9px;padding:5px 10px">[ CLEAR LOGS ]</button><div class="lb">${logsHTML}</div></div></div>
<div class="pn" id="pn-bulk"><div class="sn"><h3>[ BULK KEY GENERATOR ]</h3><div class="fg"><div><label>Prefix</label><input id="bp" value="BULK_"></div><div><label>Count</label><input type="number" id="bc" value="5" max="50"></div><div><label>Limit</label><input id="bl" value="100"></div><div><label>Days</label><input type="number" id="bd" value="30"></div><div style="grid-column:1/-1"><button class="btn1" onclick="gb()" style="width:100%">[ GENERATE BULK ]</button></div><div style="grid-column:1/-1"><div id="br" style="max-height:150px;overflow:auto;font-family:monospace;font-size:8px;padding:8px;background:var(--bg);border:1px solid var(--brd);display:none;color:#00ff00"></div></div></div></div></div>
<div class="pn" id="pn-push"><div class="sn"><h3>[ PUSH KEY (EXTEND/RESTART) ]</h3><div class="fg"><div><label>Key Name</label><input id="pk" placeholder="KEY_NAME"></div><div><label>Days to Add</label><input type="number" id="pd" value="30" min="1"></div><div style="grid-column:1/-1"><button class="btn1 a-y" onclick="pushK()" style="width:100%;border-color:#ffcc00;color:#ffcc00">[ PUSH KEY ]</button></div></div></div></div>
<div class="pn" id="pn-settings"><div class="sn"><h3>[ QUICK SETTINGS ]</h3><div class="fg"><div style="grid-column:1/-1"><button class="btn1" onclick="resetAll()" style="width:100%">[ RESET ALL KEY USAGE ]</button></div><div style="grid-column:1/-1"><button class="btn2" onclick="clearLogs()" style="width:100%">[ CLEAR ALL LOGS ]</button></div></div></div></div>
</div>
<script>
var TOKEN='${stoken}';
function toast(m){var t=document.createElement('div');t.style.cssText='position:fixed;bottom:16px;right:16px;background:#001400;color:#00ff00;padding:8px 14px;border:1px solid #00ff0030;font-size:10px;z-index:9999;font-family:"Share Tech Mono",monospace';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},2000)}
function st(n){document.querySelectorAll('.pn').forEach(p=>p.classList.remove('on'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));document.getElementById('pn-'+n).classList.add('on');event.target.classList.add('on')}
function toggleExp(){var m=document.getElementById('gem').value;document.getElementById('de').style.display=m==='date'?'block':'none';document.getElementById('dd').style.display=m==='days'?'block':'none'}
async function ac(u,b){var o={method:b?'POST':'GET',headers:{'Content-Type':'application/json','x-admin-token':TOKEN}};if(b)o.body=JSON.stringify(b);var r=await fetch(u,o);return await r.json()}
async function gk(){var n=document.getElementById('gn').value.trim(),o=document.getElementById('go').value.trim();if(!n||!o){toast('[!] Fill all fields');return}var sc=[];document.querySelectorAll('#pn-gen input[type=checkbox]:checked').forEach(c=>sc.push(c.value));var em=document.getElementById('gem').value;var exp=null,days=null;if(em==='date'){exp=document.getElementById('ged').value;if(exp){var p=exp.split('-');exp=p[2]+'-'+p[1]+'-'+p[0]}}else if(em==='days'){days=parseInt(document.getElementById('gedd').value)||30}var r=await ac('/admin/generate-key',{keyName:n,keyOwner:o,scopes:sc,limit:document.getElementById('gl').value,cooldown:parseInt(document.getElementById('gc').value)||0,expiryDate:exp,days:days,keyType:document.getElementById('gt').value});r.success?(toast('[+] Generated: '+n),setTimeout(function(){location.reload()},600)):toast('[!] '+(r.error||r.e))}
async function resetKey(k){if(!confirm('Reset '+k+'?'))return;var r=await ac('/admin/reset-key-usage',{keyName:k});r.success?location.reload():toast('[!] Error')}
async function deleteKey(k){if(!confirm('DELETE '+k+'?'))return;var r=await ac('/admin/delete-key',{keyName:k});r.success?location.reload():toast('[!] Error')}
async function pushKey(k){var d=prompt('Days to extend for '+k+'?','30');if(!d)return;var r=await ac('/admin/push-key',{keyName:k,days:parseInt(d)});r.success?(toast('[+] '+r.message),setTimeout(function(){location.reload()},600)):toast('[!] '+(r.error||r.e))}
async function pushK(){var k=document.getElementById('pk').value.trim();var d=parseInt(document.getElementById('pd').value)||30;if(!k){toast('[!] Enter key name');return}var r=await ac('/admin/push-key',{keyName:k,days:d});r.success?(toast('[+] '+r.message),setTimeout(function(){location.reload()},600)):toast('[!] '+(r.error||r.e))}
async function ik(){var d=document.getElementById('id').value.trim();if(!d){toast('[!] Paste JSON');return}try{var ks=JSON.parse(d);var r=await ac('/admin/import-keys',{keys:ks});r.success?(toast('[+] Imported: '+r.imported),setTimeout(function(){location.reload()},600)):toast('[!] Error')}catch(e){toast('[!] Invalid JSON')}}
async function banIP2(){var ip=document.getElementById('bip').value.trim();if(!ip){toast('[!] Enter IP');return}var r=await ac('/admin/ban-ip',{ip:ip});r.success?(toast('[+] Banned: '+ip),setTimeout(function(){location.reload()},400)):toast('[!] Error')}
async function banIP(ip){var r=await ac('/admin/ban-ip',{ip:ip});r.success?location.reload():toast('[!] Error')}
async function unbanIP(ip){var r=await ac('/admin/unban-ip',{ip:ip});r.success?location.reload():toast('[!] Error')}
async function clearLogs(){if(!confirm('Clear all logs?'))return;await ac('/admin/clear-logs');location.reload()}
async function resetAll(){if(!confirm('Reset ALL key usage?'))return;await ac('/admin/reset-all');toast('[+] All reset');setTimeout(function(){location.reload()},400)}
async function gb(){var p=document.getElementById('bp').value.trim()||'BULK_';var c=parseInt(document.getElementById('bc').value)||5;var l=document.getElementById('bl').value||'100';var d=parseInt(document.getElementById('bd').value)||30;if(c>50){toast('[!] Max 50');return}var rd=document.getElementById('br');rd.style.display='block';rd.innerHTML='[*] Generating...';for(var i=1;i<=c;i++){var r=await ac('/admin/generate-key',{keyName:p+i,keyOwner:'Bulk_'+i,scopes:['*'],limit:l,cooldown:0,days:d,keyType:'bulk'});rd.innerHTML+='<div>'+(r.success?'[+]':'[!]')+' '+p+i+'</div>'}toast('[+] Done')}
</script></body></html>`;
}catch(e){return '<html><body style="background:#000a00;color:#ff0040;font-family:monospace;padding:20px"><h1>[!] ADMIN ERROR</h1><p>'+e.message+'</p></body></html>'}}

// ========== RENDER HOME ==========
function renderHome(){try{const vapis=customAPIs.filter(a=>a.visible&&a.endpoint);const totalEndpoints=Object.keys(endpoints).length+vapis.length;const totalKeys=Object.keys(keyStorage).filter(k=>!keyStorage[k]?.hidden).length;const epsJSON=JSON.stringify(endpoints).replace(/</g,'\\u003c');let cardsHTML='';Object.entries(endpoints).forEach(([n,e])=>{cardsHTML+=`<div class="ep" style="--ac:#ff6b6b" onclick="cp('${esc(n)}','${esc(e.p)}','${esc(e.e)}')"><span>${e.i}</span><b>/${esc(n)}</b><small>${esc(e.d)}</small><code>${esc(e.p)}=${esc(e.e)}</code></div>`});vapis.forEach(a=>{cardsHTML+=`<div class="ep" style="--ac:#ff9100" onclick="ccp('${esc(a.endpoint)}','${esc(a.param)}','${esc(a.example)}')"><span>🔧</span><b>/${esc(a.endpoint)}</b><small>${esc(a.desc||'Custom')}</small><code>${esc(a.param)}=${esc(a.example||'v')}</code></div>`});const opts=Object.entries(endpoints).map(([n,e])=>`<option value="${esc(n)}" data-p="${esc(e.p)}" data-ex="${esc(e.e)}">${e.i} /${esc(n)}</option>`).join('')+vapis.map(a=>`<option value="c_${a.id}" data-c="1" data-ep="${esc(a.endpoint)}" data-p="${esc(a.param)}" data-ex="${esc(a.example)}">🔧 /${esc(a.endpoint)}</option>`).join('');return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX OSINT v21 👑</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=JetBrains+Mono&display=swap" rel="stylesheet"><style>:root{--bg:#03030a;--sur:#08081a;--brd:#1a1a3a;--txt:#e0e0f0}*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--txt);font-family:'Inter',sans-serif;overflow-x:hidden}::selection{background:#ff6b6b;color:#fff}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:linear-gradient(#ff6b6b,#cc5de8);border-radius:8px}.bg{position:fixed;inset:0;pointer-events:none;z-index:0}.bg .o{position:absolute;border-radius:50%;filter:blur(100px);opacity:.04;animation:fl 12s infinite}.bg .o:nth-child(1){width:500px;height:500px;background:#ff6b6b;top:-150px;left:-80px}.bg .o:nth-child(2){width:400px;height:400px;background:#51cf66;top:-80px;right:-80px;animation-delay:-4s}.bg .o:nth-child(3){width:350px;height:350px;background:#339af0;bottom:-80px;left:20%;animation-delay:-8s}@keyframes fl{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.1)}66%{transform:translate(-20px,30px) scale(.9)}}.tb{position:sticky;top:0;z-index:1000;background:linear-gradient(90deg,#ff6b6b,#ff922b,#fcc419,#51cf66,#339af0,#cc5de8,#ff6b6b);background-size:300% 100%;animation:rb 6s linear infinite;padding:8px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px}@keyframes rb{0%{background-position:0% 50%}100%{background-position:300% 50%}}.tb .ba{background:rgba(0,0,0,.35);color:#fff;padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;animation:gl 2s infinite}@keyframes gl{0%,100%{box-shadow:0 0 6px rgba(255,255,255,.2)}50%{box-shadow:0 0 18px rgba(255,255,255,.5)}}.hero{text-align:center;padding:30px 20px 15px;position:relative;z-index:1}.hero h1{font-size:48px;font-weight:900;background:linear-gradient(90deg,#ff6b6b,#ff922b,#fcc419,#51cf66,#339af0,#cc5de8,#ff6b6b);background-size:400% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:rb 6s linear infinite;margin-bottom:4px}.hero .sub{font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#666;margin-bottom:2px}.ct{max-width:1000px;margin:0 auto;padding:0 16px;position:relative;z-index:1}.st{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;padding:14px;margin-bottom:20px;background:rgba(8,8,26,.9);border:1px solid var(--brd);border-radius:14px}.st>div{text-align:center;min-width:60px}.st .v{font-size:24px;font-weight:900;background:linear-gradient(135deg,#ff6b6b,#cc5de8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.st .l{font-size:7px;color:#555;text-transform:uppercase;letter-spacing:2px}.pay{background:rgba(8,8,26,.95);border:1px solid #ff922b;border-radius:16px;padding:18px;margin-bottom:20px}.pay h3{font-size:18px;font-weight:800;text-align:center;margin-bottom:12px;background:linear-gradient(135deg,#ff922b,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:6px;margin-bottom:12px}.pc{background:rgba(255,146,43,.03);border:1px solid rgba(255,146,43,.1);border-radius:8px;padding:8px;text-align:center;transition:.3s}.pc:hover{border-color:#ff922b;background:rgba(255,146,43,.06)}.pc .d{font-size:10px;color:#fff;font-weight:600}.pc .a{font-size:14px;color:#ff922b;font-weight:900}.pc.lt{grid-column:1/-1}.pc.lt .a{color:#cc5de8}.pm{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:10px}.pb{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:6px;padding:6px 12px;color:#aaa;cursor:pointer;font-size:9px;font-weight:600;transition:.3s;font-family:'Inter',sans-serif}.pb:hover{background:rgba(255,146,43,.1);border-color:#ff922b;color:#ff922b}.upi{text-align:center;padding:12px;background:rgba(0,0,0,.3);border-radius:8px;margin-bottom:10px}.upi .pay-btn-glow{display:inline-block;background:linear-gradient(135deg,#ff6b6b,#ff922b,#fcc419,#51cf66,#cc5de8);background-size:300% 100%;animation:rb 3s linear infinite;color:#fff;padding:12px 30px;border-radius:25px;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer;box-shadow:0 0 30px rgba(255,107,107,.5),0 0 60px rgba(204,93,232,.3);transition:.3s;letter-spacing:1px;border:none;font-family:'Inter',sans-serif}.upi .pay-btn-glow:hover{transform:scale(1.05);box-shadow:0 0 50px rgba(255,146,43,.7),0 0 80px rgba(255,107,107,.4)}.upi img{max-width:180px;border-radius:10px;margin:10px auto;display:block;border:2px solid rgba(255,146,43,.15)}.tgl{text-align:center;font-size:10px;color:#666;margin-top:8px}.tgl a{color:#339af0;text-decoration:none;font-weight:600}.pl{background:var(--sur);border:1px solid var(--brd);border-radius:12px;padding:16px;margin-bottom:20px}.pl h3{font-size:14px;font-weight:700;margin-bottom:10px;background:linear-gradient(135deg,#ff922b,#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.plf{display:flex;gap:8px;flex-wrap:wrap}.plf select,.plf input{flex:1;min-width:100px;padding:10px 12px;background:var(--bg);border:1px solid var(--brd);border-radius:7px;color:var(--txt);font-size:10px;font-family:'JetBrains Mono',monospace;outline:none}.plf select:focus,.plf input:focus{border-color:#ff922b}.btx{padding:10px 18px;background:linear-gradient(135deg,#ff6b6b,#cc5de8);color:#fff;border:none;border-radius:7px;font-weight:700;font-size:10px;cursor:pointer;font-family:'Inter',sans-serif}.rb{margin-top:10px;background:#020210;border:1px solid var(--brd);border-radius:7px;padding:10px;max-height:250px;overflow:auto;font-family:'JetBrains Mono',monospace;font-size:8px;display:none;white-space:pre-wrap;color:#51cf66}.eg{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:20px}.ep{background:var(--sur);border:1px solid var(--brd);border-radius:10px;padding:14px;cursor:pointer;transition:.3s;border-top:3px solid var(--ac,#ff6b6b)}.ep:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.4)}.ep span{font-size:18px;display:block;margin-bottom:2px}.ep b{font-size:14px;color:#fff;display:block;margin-bottom:2px}.ep small{font-size:9px;color:#666;display:block;margin-bottom:6px}.ep code{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--ac,#ff6b6b);background:rgba(0,0,0,.3);padding:3px 5px;border-radius:3px}.ft{text-align:center;padding:20px;border-top:1px solid var(--brd);position:relative;z-index:1}.ft .fb{font-size:16px;font-weight:900;background:linear-gradient(90deg,#ff6b6b,#ff922b,#51cf66,#339af0,#cc5de8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.ft .fi{font-size:9px;color:#555;margin-top:2px}.ft .fi a{color:#666;text-decoration:none}@media(max-width:768px){.hero h1{font-size:30px}.eg{grid-template-columns:1fr}.plf{flex-direction:column}}</style></head><body><div class="bg"><div class="o"></div><div class="o"></div><div class="o"></div></div><div class="tb"><span style="color:#000;font-weight:800;font-size:10px">👑 BRONX ULTRA KING</span><span class="ba">✅ Paid API Available</span></div><header class="hero"><h1>BRONX OSINT v21</h1><p class="sub">KILLER ULTRA KING</p><p style="color:#555;font-size:9px;margin-top:4px">👑 King Always King 👑 · Unlimited · Real-Time · No Error</p></header><div class="ct"><div class="st"><div><div class="v">${totalEndpoints}</div><div class="l">Endpoints</div></div><div><div class="v">${totalKeys}</div><div class="l">Keys</div></div><div><div class="v">∞</div><div class="l">Requests</div></div><div><div class="v">100%</div><div class="l">Working</div></div></div><div class="pay"><h3>💎 GET PAID API KEY</h3><div class="pg"><div class="pc"><div class="d">10 Days</div><div class="a">₹100</div></div><div class="pc"><div class="d">20 Days</div><div class="a">₹200</div></div><div class="pc"><div class="d">30 Days</div><div class="a">₹300</div></div><div class="pc"><div class="d">40 Days</div><div class="a">₹400</div></div><div class="pc"><div class="d">50 Days</div><div class="a">₹500</div></div><div class="pc"><div class="d">60 Days</div><div class="a">₹600</div></div><div class="pc lt"><div class="d">👑 LIFETIME</div><div class="a">₹3000</div></div></div><div class="pm"><span class="pb">📱 UPI</span><span class="pb">💳 PhonePe</span><span class="pb">🏦 Navi</span><span class="pb">💰 Paytm</span></div><div class="upi"><a href="upi://pay?pa=8509561376@ibl&pn=BRONX_ULTRA&cu=INR" class="pay-btn-glow">⚡ CLICK TO PAY NOW ⚡</a><img src="https://i.ibb.co/sJwBtnWd/IMG-20260413-080502-825.jpg" alt="QR" onerror="this.style.display='none'"></div><p class="tgl">After Payment Send Screenshot → <a href="https://t.me/BRONX_ULTRA">@BRONX_ULTRA</a></p></div><div class="pl"><h3>🧪 API Playground</h3><div class="plf"><select id="es"><option value="">Select</option>${opts}</select><input id="ak" placeholder="API Key..."><input id="pv" placeholder="Parameter..."><button class="btx" onclick="ta()">⚡ Run</button></div><div class="rb" id="rb"></div></div><div class="eg">${cardsHTML}</div></div><footer class="ft"><p class="fb">BRONX OSINT v21 👑</p><p class="fi">@BRONX_ULTRA · <a href="/admin">Admin</a> · <a href="/test">Status</a></p></footer><script>var eps=${epsJSON};function toast(m){var t=document.createElement('div');t.style.cssText='position:fixed;bottom:16px;right:16px;background:#08081a;color:#ff922b;padding:8px 14px;border-radius:8px;font-size:10px;z-index:9999;border:1px solid rgba(255,146,43,.3)';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.remove()},2000)}function cp(n,p,e){navigator.clipboard.writeText(location.origin+'/api/key-bronx/'+n+'?key=KEY&'+p+'='+e).then(function(){toast('Copied!')})}function ccp(n,p,e){navigator.clipboard.writeText(location.origin+'/api/custom/'+n+'?key=KEY&'+p+'='+e).then(function(){toast('Copied!')})}async function ta(){var s=document.getElementById('es'),o=s.options[s.selectedIndex],k=document.getElementById('ak').value,v=document.getElementById('pv').value,rb=document.getElementById('rb');if(!s.value||!k||!v){toast('Fill all fields');return}var url=o.dataset.c==='1'?'/api/custom/'+o.dataset.ep+'?key='+k+'&'+o.dataset.p+'='+v:'/api/key-bronx/'+s.value+'?key='+k+'&'+eps[s.value].p+'='+v;rb.style.display='block';rb.style.color='#51cf66';rb.textContent='Loading...';try{var r=await fetch(url);var d=await r.json();rb.textContent=JSON.stringify(d,null,2);if(d.error)rb.style.color='#ff6b6b'}catch(e){rb.textContent='Error: '+e.message;rb.style.color='#ff6b6b'}}</script></body></html>`}catch(e){return '<html><body><h1>Error</h1></body></html>'}}

(async function(){const loaded=await loadFromStorage();if(!loaded){initDefaultData();initCustomAPIs()}if(!keyStorage[MASTER_API_KEY])keyStorage[MASTER_API_KEY]=createMasterKey();delete keyStorage['BRONX_ULTRA_MASTER_2026'];scheduleSave();console.log('✅ BRONX OSINT v21 GOD LEVEL Ready!')})();

module.exports = app;
