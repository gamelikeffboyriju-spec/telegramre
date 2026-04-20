const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Keys file path
const KEYS_FILE = path.join(process.cwd(), 'keys.json');

// Load keys from file
function loadKeys() {
    try {
        if (fs.existsSync(KEYS_FILE)) {
            return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

// Save keys to file
function saveKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Available scopes
const AVAILABLE_SCOPES = [
    'number', 'numv2', 'adv', 'aadhar', 'name',
    'upi', 'ifsc', 'pan', 'pincode', 'ip',
    'vehicle', 'rc', 'ff', 'bgmi', 'insta',
    'git', 'tg', 'pk', 'pkv2'
];

// Admin password (change this!)
const ADMIN_PASSWORD = 'BRONX2026';

// ========== ADMIN ROUTES ==========

// Get all keys
router.get('/keys', (req, res) => {
    const keys = loadKeys();
    res.json({ success: true, keys });
});

// Generate new key
router.post('/generate-key', (req, res) => {
    const { password, keyName, ownerName, scopes, limit, expiryDate } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
    
    if (!keyName || !ownerName || !scopes || scopes.length === 0) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const keys = loadKeys();
    
    if (keys[keyName]) {
        return res.status(400).json({ success: false, error: 'Key already exists' });
    }
    
    // Parse expiry date
    let expiry = null;
    let expiryStr = 'Never';
    if (expiryDate) {
        const [year, month, day] = expiryDate.split('-').map(Number);
        expiry = new Date(year, month - 1, day, 23, 59, 59).toISOString();
        expiryStr = `${day}-${month}-${year}`;
    }
    
    keys[keyName] = {
        name: ownerName,
        scopes: scopes,
        type: 'custom',
        limit: parseInt(limit) || 100,
        used: 0,
        expiry: expiry,
        expiryStr: expiryStr,
        created: new Date().toISOString(),
        resetType: 'never',
        unlimited: limit === 'unlimited',
        hidden: false
    };
    
    saveKeys(keys);
    
    res.json({ 
        success: true, 
        message: 'Key generated successfully!',
        key: keyName,
        details: keys[keyName]
    });
});

// Delete key
router.delete('/delete-key', (req, res) => {
    const { password, keyName } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
    
    const keys = loadKeys();
    
    if (!keys[keyName]) {
        return res.status(404).json({ success: false, error: 'Key not found' });
    }
    
    delete keys[keyName];
    saveKeys(keys);
    
    res.json({ success: true, message: 'Key deleted successfully!' });
});

// Reset key usage
router.post('/reset-usage', (req, res) => {
    const { password, keyName } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
    
    const keys = loadKeys();
    
    if (!keys[keyName]) {
        return res.status(404).json({ success: false, error: 'Key not found' });
    }
    
    keys[keyName].used = 0;
    saveKeys(keys);
    
    res.json({ success: true, message: 'Usage reset successfully!' });
});

// Update key
router.post('/update-key', (req, res) => {
    const { password, keyName, ownerName, scopes, limit, expiryDate } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
    
    const keys = loadKeys();
    
    if (!keys[keyName]) {
        return res.status(404).json({ success: false, error: 'Key not found' });
    }
    
    if (ownerName) keys[keyName].name = ownerName;
    if (scopes) keys[keyName].scopes = scopes;
    if (limit) {
        keys[keyName].limit = limit === 'unlimited' ? Infinity : parseInt(limit);
        keys[keyName].unlimited = limit === 'unlimited';
    }
    if (expiryDate) {
        const [year, month, day] = expiryDate.split('-').map(Number);
        keys[keyName].expiry = new Date(year, month - 1, day, 23, 59, 59).toISOString();
        keys[keyName].expiryStr = `${day}-${month}-${year}`;
    }
    
    saveKeys(keys);
    
    res.json({ success: true, message: 'Key updated successfully!' });
});

// Get scopes list
router.get('/scopes', (req, res) => {
    res.json({ success: true, scopes: AVAILABLE_SCOPES });
});

module.exports = router;
