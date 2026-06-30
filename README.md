# School Management System
A production-ready, lightweight, and modern **School Management Portal** built with a mobile-first Progressive Web App (PWA) layout. It supports a multi-school tenant architecture using a highly resilient client-side storage engine that mirrors state with a centralized MySQL database (or local JSON database) through a lightweight Key-Value REST API.
---
## 🌟 Key Features
### 1. 🛡️ Super Admin Control Panel
- **School Registry**: Register new schools, edit school details, and assign custom tenant IDs.
- **Subscription Management**: Track demo trials, yearly subscriptions, lifetime plans, and payment histories.
- **System Settings**: Control global configurations and manage admin password reset requests.
### 2. 👑 School Admin Dashboard
- **Academics**: Manage classes, students, and teachers. Mark student attendance, issue homework, assign timetables, and schedule exams.
- **Administration**: Handle school fees (generate statements, track payments), account books (income/expense journals), staff payroll receipts, and printable student ID cards and certificates.
- **Monitoring**: Access mock CCTV feeds and track school vehicles via a visual GPS map.
- **Admissions Review**: Approve or reject online admission applications and automatically generate student credentials.
### 3. 👩‍🏫 Teacher Panel
- **Daily Operations**: Mark class attendance, assign homework, upload syllabus details, and entry exam marks.
- **Academics Tooling**: Access a shared Question Bank, study materials library, and a smart Paper Creator module with Tesseract OCR scanner integrations.
- **Leaves & Tasks**: Submit personal leave requests to the admin and track tasks assigned by the administration.
### 4. 🎒 Student & Parent Panel
- **Academic Performance**: View personal timetables, homework schedules, exam mark sheets, and download digital report cards.
- **Fee Management**: Review due fees, open the secure mobile payment drawer, pay via UPI, and submit payment status confirmations.
- **School Utilities**: Access live school camera mockups, view bus routes on Leaflet maps, read school notice boards, and chat with teachers.
---
## 🛠️ Technology Stack
- **Frontend**: Pure HTML5, Vanilla JavaScript (ES6+), and custom CSS3 variables (Day/Night responsive fluid styling with glassmorphism overlays).
- **Icons & Visuals**: UTF-8 Emojis and canvas drawing buffers (spinners).
- **Libraries**:
  - `Chart.js` (Lazy-loaded for analytics & performance graphs)
  - `Leaflet.js` (Lazy-loaded for GPS bus mapping)
  - `jsQR.js` & `qrcode.js` (For QR code ID generation and scanner attendance)
  - `Tesseract.js` (Lazy-loaded OCR for exam paper extraction)
- **Local Dev Server**: Node.js & Express.
- **Production Backend**: PHP 7.4+ & MySQL.
---
## 📁 Repository Directory Structure
```text
├── index.html                  # Landing & Main Login Page
├── admin.html                  # School Admin Portal Interface
├── teacher.html                # Teacher Portal Interface
├── student.html                # Student & Parent Portal Interface
├── super-admin.html            # Super Admin Control Panel
├── favicon.svg                 # SVG Site Favicon
├── manifest.json               # PWA App Manifest
├── css/
│   └── style.css               # Core Stylesheet (themes & layouts)
├── js/
│   ├── utils.js                # Core storage utilities & shared components
│   ├── admin.js                # School Admin Panel JS Controller
│   ├── teacher.js              # Teacher Panel JS Controller
│   ├── student.js              # Student Panel JS Controller
│   ├── super-admin.js          # Super Admin Panel JS Controller
│   ├── i18n.js                 # Multi-language translator module
│   ├── pwa.js                  # PWA service worker register
│   ├── calendar.js             # Visual calendar handler
│   ├── fee-statement.js        # Fee receipt generation
│   ├── idcard-templates.js     # ID card templates
│   ├── report-templates.js     # Report card templates
│   ├── certificate-templates.js# Certificate print layouts
│   ├── birthday-cards.js       # Student birthday templates
│   ├── face-attendance.js      # Mock facial attendance module
│   ├── geo-attendance.js       # Geolocation coordinate verification
│   ├── messaging.js            # School chat engine
│   ├── paper-creator.js        # Exam paper OCR parser
│   └── curriculum-data.js      # Curricular library datasets
├── data/                       # Local JSON database files (Git ignored in production)
├── package.json                # Local Node server package manager
└── server.js                   # Node.js local Express server
```
---
## 💻 Local Development Setup
To run this platform on your local machine using Node.js:
1. **Clone the Repository**:
   ```bash
   git clone <https://github.com/abhimanyu-chaudhary/school/>
   cd school
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Local Server**:
   ```bash
   npm start
   ```
4. **Access the Application**:
   Open [http://localhost:8080](http://localhost:8080) in your web browser.
5. **Login Credentials**:
   - **Super Admin Panel** (`/super-admin.html`): `superadmin` / `super@123`
   - **School Admin (Shishu Gyan Nikunja)**: Select *Shishu Gyan Nikunja* -> Select Role *Admin* -> Credentials: `school` / `school123`
---
## 🌐 Production Deployment Guide
Follow these steps to deploy the application on a live PHP/MySQL cPanel server securely:
### Part 1: Database Setup
1. Log in to your cPanel hosting account.
2. Open **MySQL Database Wizard** to create a database (e.g., `school_sms`) and assign a user with full privileges.
3. Access **phpMyAdmin**, select the newly created database, and run this SQL query to initialize the key-value storage table:
```sql
CREATE TABLE IF NOT EXISTS `kv_store` (
  `school_id` VARCHAR(50) NOT NULL,
  `key_name` VARCHAR(100) NOT NULL,
  `key_val` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`school_id`, `key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
---
### Part 2: Backend Sync API Configuration
Create a folder named `api` in your public web directory and save this script as **`api/kv.php`**. Update the database credentials at the top of the file:
```php
<?php
// api/kv.php - Centralized Key-Value Sync Engine
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
// 1. DATABASE CONFIGURATION
$db_host = 'localhost';          // Standard cPanel default
$db_name = 'your_database_name'; // Replace with DB Name
$db_user = 'your_database_user'; // Replace with DB User
$db_pass = 'your_database_password'; // Replace with DB Password
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}
$method = $_SERVER['REQUEST_METHOD'];
// 2. GET OPERATION
if ($method === 'GET') {
    $school_id = $_GET['school_id'] ?? null;
    $key = $_GET['key'] ?? null;
    if (!$school_id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing school_id"]);
        exit;
    }
    if ($key) {
        $stmt = $pdo->prepare("SELECT key_val FROM kv_store WHERE school_id = ? AND key_name = ?");
        $stmt->execute([$school_id, $key]);
        $row = $stmt->fetch();
        echo $row ? $row['key_val'] : "";
    } else {
        $stmt = $pdo->prepare("SELECT key_name, key_val FROM kv_store WHERE school_id = ?");
        $stmt->execute([$school_id]);
        $rows = $stmt->fetchAll();
        
        $result = [];
        foreach ($rows as $row) {
            $result[$row['key_name']] = $row['key_val'];
        }
        echo json_encode($result);
    }
} 
// 3. POST OPERATION
else if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (!$data) {
        $data = $_POST;
    }
    $school_id = $data['school_id'] ?? null;
    $key = $data['key'] ?? null;
    $value = $data['value'] ?? null;
    if (!$school_id || !$key) {
        http_response_code(400);
        echo json_encode(["error" => "Missing school_id or key"]);
        exit;
    }
    if (is_array($value) || is_object($value)) {
        $value = json_encode($value);
    }
    // Secure Prepared Upsert Statement
    $stmt = $pdo->prepare("
        INSERT INTO kv_store (school_id, key_name, key_val) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE key_val = VALUES(key_val)
    ");
    
    try {
        $stmt->execute([$school_id, $key, $value]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to write key: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method Not Allowed"]);
}
```
---
### Part 3: Deploying Front-End Code
1. Zip the repository contents (`css`, `js`, `api`, and all `.html` pages).
2. Upload the zip directly to the root of your public web folder (usually `public_html`) using cPanel **File Manager**.
3. Extract the contents.
---
### Part 4: Security and Backup Recommendations
#### 🔒 Mandatory SSL Certificate
To enable the camera module (for QR checking, Paper Creator OCR, and Face ID) and allow secure local storage database handshakes, the application must run on **HTTPS**. 
1. In cPanel, find **SSL/TLS Status**.
2. Select your domain, click **Run AutoSSL**, and wait for Let's Encrypt to issue a certificate.
#### 🔄 Database Automated Backups
Protect against data loss from database file corruption or migration issues:
1. Configure automated daily backups inside your hosting panel under **JetBackup** or **Backups**.
2. Alternatively, set up a cron job using cPanel **Cron Jobs** to execute a daily `mysqldump` and email it or sync it to a private folder.
#### 🔗 Enforce HTTPS Redirects
Create a `.htaccess` file in the root `public_html` directory to redirect all insecure HTTP traffic to HTTPS:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```
