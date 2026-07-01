const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Enable JSON parser for large payloads (logos, study materials, base64 drawings)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static frontend files
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Read KV API
// PHP query syntax: /api/kv.php?school_id=sch008 or /api/kv.php?school_id=sch008&key=students
app.get('/api/kv.php', (req, res) => {
  const schoolId = req.query.school_id;
  const key = req.query.key;

  if (!schoolId) {
    return res.status(400).send('Missing school_id');
  }

  const filePath = path.join(DATA_DIR, `${schoolId}.json`);
  let data = {};
  if (fs.existsSync(filePath)) {
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      data = {};
    }
  }

  if (key) {
    // Returns the exact string stored in the database for this key
    return res.send(data[key] || '');
  } else {
    // Returns a JSON mapping of all keys to their string values
    return res.json(data);
  }
});

// Write KV API
// Handles both JSON bodies and URL-encoded forms
app.post('/api/kv.php', (req, res) => {
  let { school_id, key, value } = req.body;

  // Handle case where body might be a raw string or sent with different headers
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      school_id = parsed.school_id;
      key = parsed.key;
      value = parsed.value;
    } catch (e) {}
  }

  if (!school_id || !key) {
    return res.status(400).send('Missing school_id or key');
  }

  const filePath = path.join(DATA_DIR, `${school_id}.json`);
  let data = {};
  if (fs.existsSync(filePath)) {
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      data = {};
    }
  }

  // Values in MySQL are stored as JSON strings.
  // If the received value is already an object or array, serialize it.
  // If it is a string representation, keep it as is.
  data[key] = typeof value === 'string' ? value : JSON.stringify(value);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).send('Failed to write data');
  }
});

app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`School Management Portal running at: http://localhost:${PORT}`);
  console.log(`School: School Gyan Nikunja`);
  console.log(`Credentials: Username: school, Password: school123`);
  console.log(`=============================================================\n`);
});
