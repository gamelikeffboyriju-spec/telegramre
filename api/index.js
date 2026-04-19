const axios = require('axios');

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint.onrender.com/api';
const REAL_API_KEY = 'nobita';

// ========== API KEYS ==========
const VALID_KEYS = ['BRONX_MASTER_KEY', 'BRONX_KEY_2026', 'DEMO_KEY', 'test123'];

// ========== REQUEST COUNTS ==========
let requestCounts = {};

function getIndiaDate() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
}

function checkAndResetLimit(apiKey) {
    const today = getIndiaDate();
    if (!requestCounts[apiKey]) {
        requestCounts[apiKey] = { count: 0, date: today };
        return true;
    }
    if (requestCounts[apiKey].date !== today) {
        requestCounts[apiKey] = { count: 0, date: today };
        return true;
    }
    return requestCounts[apiKey].count < 1000;
}

function incrementRequestCount(apiKey) {
    const today = getIndiaDate();
    if (!requestCounts[apiKey] || requestCounts[apiKey].date !== today) {
        requestCounts[apiKey] = { count: 1, date: today };
    } else {
        requestCounts[apiKey].count++;
    }
    return requestCounts[apiKey].count;
}

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
            if (obj[key] && typeof obj[key] === 'object') removeFields(obj[key]);
        });
    }
    removeFields(cleaned);
    cleaned.by = "@BRONX_ULTRA";
    return cleaned;
}

const endpoints = [
    { path: '/number', param: 'num', example: '9876543210', desc: 'Indian Mobile Number Lookup' },
    { path: '/aadhar', param: 'num', example: '393933081942', desc: 'Aadhaar Number Lookup' },
    { path: '/name', param: 'name', example: 'abhiraaj', desc: 'Search by Name' },
    { path: '/numv2', param: 'num', example: '6205949840', desc: 'Number Info v2' },
    { path: '/adv', param: 'num', example: '9876543210', desc: 'Advanced Phone Lookup' },
    { path: '/upi', param: 'upi', example: 'example@ybl', desc: 'UPI ID Verification' },
    { path: '/ifsc', param: 'ifsc', example: 'SBIN0001234', desc: 'IFSC Code Details' },
    { path: '/pan', param: 'pan', example: 'AXDPR2606K', desc: 'PAN to GST Search' },
    { path: '/pincode', param: 'pin', example: '110001', desc: 'Pincode Details' },
    { path: '/ip', param: 'ip', example: '8.8.8.8', desc: 'IP Address Lookup' },
    { path: '/vehicle', param: 'vehicle', example: 'MH02FZ0555', desc: 'Vehicle Registration Info' },
    { path: '/rc', param: 'owner', example: 'UP92P2111', desc: 'RC Owner Details' },
    { path: '/ff', param: 'uid', example: '123456789', desc: 'Free Fire Player Info' },
    { path: '/bgmi', param: 'uid', example: '5121439477', desc: 'BGMI Player Info' },
    { path: '/insta', param: 'username', example: 'cristiano', desc: 'Instagram Profile Data' },
    { path: '/git', param: 'username', example: 'ftgamer2', desc: 'GitHub Profile' },
    { path: '/tg', param: 'info', example: 'JAUUOWNER', desc: 'Telegram User Lookup' },
    { path: '/pk', param: 'num', example: '03331234567', desc: 'Pakistan Number v1' },
    { path: '/pkv2', param: 'num', example: '3359736848', desc: 'Pakistan Number v2' }
];

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-API-Key, Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const url = req.url;
    const query = req.query || {};
    
    // ROOT ROUTE - HTML UI
    if (url === '/' || url === '' || url === '/docs') {
        const categories = {
            '📱 Phone Intelligence': ['number', 'aadhar', 'name', 'numv2', 'adv'],
            '💰 Financial': ['upi', 'ifsc', 'pan'],
            '📍 Location': ['pincode', 'ip'],
            '🚗 Vehicle': ['vehicle', 'rc'],
            '🎮 Gaming': ['ff', 'bgmi'],
            '🌐 Social': ['insta', 'git', 'tg'],
            '🇵🇰 Pakistan': ['pk', 'pkv2']
        };
        
        let endpointsHTML = '';
        for (const [cat, names] of Object.entries(categories)) {
            endpointsHTML += `<div class="category">${cat}</div><div class="endpoints-grid">`;
            for (const name of names) {
                const ep = endpoints.find(e => e.path.replace('/', '') === name);
                if (ep) {
                    endpointsHTML += `
                        <div class="endpoint-card" onclick="copyUrl('${name}', '${ep.param}', '${ep.example}')">
                            <span class="method">GET</span>
                            <div class="endpoint-name">${name.toUpperCase()}</div>
                            <div class="endpoint-url">/api/key-bronx/${name}</div>
                            <div class="param">📌 ${ep.desc}</div>
                            <div class="param">🔑 ${ep.param}=${ep.example}</div>
                            <div class="copy-btn">📋 COPY URL</div>
                        </div>
                    `;
                }
            }
            endpointsHTML += `</div>`;
        }
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX OSINT API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0a; font-family: 'Courier New', monospace; color: #00ff41; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px; border: 2px solid #00ff41; border-radius: 20px; margin-bottom: 30px; background: #0a0a0a; }
        .header h1 { font-size: 48px; text-shadow: 0 0 10px #00ff41; }
        .badge { display: inline-block; background: #00ff4120; padding: 8px 20px; border-radius: 30px; font-size: 12px; margin-top: 15px; border: 1px solid #00ff41; }
        .stats { display: flex; justify-content: center; gap: 30px; margin: 30px 0; flex-wrap: wrap; }
        .stat { background: #0a0a0a; border: 1px solid #00ff41; border-radius: 12px; padding: 15px 30px; text-align: center; }
        .stat-num { font-size: 36px; font-weight: bold; }
        .stat-label { font-size: 10px; letter-spacing: 2px; }
        .limit-box { background: #0a0a0a; border: 1px solid #00ff41; border-radius: 12px; padding: 15px; margin: 20px 0; text-align: center; }
        .auth-box { background: #0a0a0a; border: 1px solid #00ff41; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
        .code { background: #0a0a0a; border: 1px solid #00ff41; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 11px; overflow-x: auto; margin: 10px 0; }
        .category { font-size: 22px; font-weight: bold; margin: 30px 0 15px; padding-left: 15px; border-left: 4px solid #00ff41; }
        .endpoints-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .endpoint-card { background: #0a0a0a; border: 1px solid #00ff4133; border-radius: 10px; padding: 15px; transition: 0.3s; cursor: pointer; }
        .endpoint-card:hover { border-color: #00ff41; transform: translateY(-2px); box-shadow: 0 0 15px #00ff41; }
        .method { background: #00ff4120; padding: 2px 8px; border-radius: 5px; font-size: 10px; }
        .endpoint-name { font-size: 18px; font-weight: bold; margin: 10px 0; }
        .endpoint-url { font-family: monospace; font-size: 10px; color: #00ff4190; }
        .param { font-size: 11px; color: #00ff4190; margin-top: 8px; }
        .copy-btn { margin-top: 12px; color: #00ff41; font-size: 10px; text-align: center; padding: 5px; border: 1px solid #00ff41; border-radius: 6px; }
        .footer { text-align: center; padding: 30px; margin-top: 40px; border-top: 1px solid #00ff4133; font-size: 11px; }
        .toast { position: fixed; bottom: 20px; right: 20px; background: #00ff41; color: #0a0a0a; padding: 10px 20px; border-radius: 8px; animation: slideIn 0.3s; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @media (max-width: 768px) { .header h1 { font-size: 28px; } .stat-num { font-size: 24px; } }
        a { color: #00ff41; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ BRONX OSINT</h1>
            <div class="badge">🔐 PRIVATE INTELLIGENCE API</div>
            <div class="stats">
                <div class="stat"><div class="stat-num">${endpoints.length}</div><div class="stat-label">ENDPOINTS</div></div>
                <div class="stat"><div class="stat-num">JSON</div><div class="stat-label">RESPONSE</div></div>
                <div class="stat"><div class="stat-num">KEY</div><div class="stat-label">ACCESS</div></div>
            </div>
        </div>
        
        <div class="limit-box">
            <div>⚡ DAILY LIMIT: <strong>1000</strong> REQUESTS PER KEY</div>
            <div>🔄 RESET: <strong>🇮🇳 2:00 AM IST</strong></div>
        </div>
        
        <div class="auth-box">
            <h3>🔐 AUTHENTICATION</h3>
            <div class="code">GET /api/key-bronx/number?key=BRONX_KEY_2026&num=9876543210</div>
            <p>💡 Contact <strong style="color:#00ff41;">@BRONX_ULTRA</strong> on Telegram</p>
        </div>
        
        ${endpointsHTML}
        
        <div class="footer">
            <p>✨ BRONX OSINT API | @BRONX_ULTRA</p>
            <p>⚡ 1000 requests/day | Resets 2:00 AM IST</p>
            <p><a href="/test">📡 Test API</a> | <a href="/quota?key=BRONX_KEY_2026">📊 Check Quota</a></p>
        </div>
    </div>
    <script>
        function copyUrl(endpoint, param, example) {
            const url = window.location.origin + '/api/key-bronx/' + endpoint + '?key=BRONX_KEY_2026&' + param + '=' + example;
            navigator.clipboard.writeText(url);
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = '✅ URL Copied!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }
    </script>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
    }
    
    // TEST ROUTE
    if (url === '/test') {
        return res.status(200).json({ status: '✅ BRONX OSINT API Running', credit: '@BRONX_ULTRA', time: new Date().toISOString() });
    }
    
    // QUOTA ROUTE
    if (url === '/quota') {
        const key = query.key;
        if (!key) return res.status(400).json({ error: "Missing key" });
        if (!VALID_KEYS.includes(key)) return res.status(403).json({ error: "Invalid key" });
        const today = getIndiaDate();
        const used = requestCounts[key] && requestCounts[key].date === today ? requestCounts[key].count : 0;
        return res.status(200).json({ success: true, key: key.substring(0,8)+'...', limit: 1000, used, remaining: 1000-used, reset: "2:00 AM IST" });
    }
    
    // KEYS ROUTE
    if (url === '/keys') {
        return res.status(200).json({ success: true, keys: VALID_KEYS, contact: "@BRONX_ULTRA" });
    }
    
    // API PROXY
    if (url.startsWith('/api/key-bronx/')) {
        const endpointName = url.replace('/api/key-bronx/', '').split('?')[0];
        const ep = endpoints.find(e => e.path.replace('/', '') === endpointName);
        if (!ep) return res.status(404).json({ success: false, error: `Endpoint not found: ${endpointName}` });
        
        const apiKey = query.key;
        if (!apiKey) return res.status(401).json({ success: false, error: "❌ API Key Required" });
        if (!VALID_KEYS.includes(apiKey)) return res.status(403).json({ success: false, error: "❌ Invalid API Key" });
        if (!checkAndResetLimit(apiKey)) return res.status(429).json({ success: false, error: "❌ Daily quota exceeded (1000/day)" });
        
        const paramValue = query[ep.param];
        if (!paramValue) return res.status(400).json({ success: false, error: `Missing ${ep.param}`, example: `${ep.param}=${ep.example}` });
        
        try {
            const realUrl = `${REAL_API_BASE}${ep.path}?key=${REAL_API_KEY}&${ep.param}=${paramValue}`;
            console.log(`📡 ${endpointName} -> ${paramValue}`);
            const response = await axios.get(realUrl, { timeout: 30000 });
            const used = incrementRequestCount(apiKey);
            const cleanedData = cleanResponse(response.data);
            cleanedData.rate_limit = { limit: 1000, used, remaining: 1000-used, reset: "2:00 AM IST" };
            return res.status(200).json(cleanedData);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    // 404
    return res.status(404).json({ success: false, error: "Route not found. Use /docs for documentation" });
};
