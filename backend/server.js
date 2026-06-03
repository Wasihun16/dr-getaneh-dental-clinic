const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const db = require('./config/db'); 

// 🔗 1. የቦት እና የማስታወሻ ፋይሎችን እዚህ ጋር መጥራት
const bot = require('./bot/telegramBot');
const { startReminderService } = require('./services/reminderService');

const app = express();

// 🌐 Configure upstream proxy trust for Render's environment
app.set('trust proxy', true);

app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000',
        'https://dr-getaneh-specialty-dental-clinic.onrender.com' 
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// 📁 Ensure the local uploads directory exists cleanly using strict absolute paths
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 📦 Strong Absolute Static routing to safely serve web assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// 📦 የሪአክት ቪት (Vite) ቢልድ ፋይሎችን ማስተዋወቂያ ኮድ (React Production Build Assets)
app.use(express.static(path.join(__dirname, 'dist')));

// ⚙️ Multer Web Upload Storage Engine Setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'web-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 🔔 2. የማስታወሻ ሲስተሙን እዚህ ጋር ማስነሳት
if (bot) {
    startReminderService(bot);
}

// ዳታቤዙ መገናኘቱን መሞከሪያ እና ሰንጠረዥ መፍጠሪያ
db.getConnection()
    .then(async (connection) => {
        console.log('✅ ከ Aiven ኦንላይን MySQL ዳታቤዝ ጋር በተሳካ ሁኔታ ተገናኝቷል!');
        
        // 🏛️ Create base table architecture safely
        const createPatientsTable = `
            CREATE TABLE IF NOT EXISTS patients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                phone_number VARCHAR(50),
                appointment_date VARCHAR(255),
                chat_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createPatientsTable);

        // 🛠️ Dynamic Database Column Auto-Verification (Ensures schema consistency)
        const columnsToAdd = [
            "appointment_time VARCHAR(50)", "age VARCHAR(10)", 
            "gender VARCHAR(20)", "country VARCHAR(100)", "reason TEXT", 
            "ticket_id VARCHAR(50)", "reminder_sent INT DEFAULT 0",
            "media_file_id TEXT", "media_type VARCHAR(50)", "raw_display_time VARCHAR(100)"
        ];
        for (let col of columnsToAdd) {
            try { 
                await connection.query(`ALTER TABLE patients ADD COLUMN ${col}`); 
            } catch (e) {
                // Column already exists, safe to ignore
            }
        }
        
        console.log('📁 የታካሚዎች ሰንጠረዥ (Patients Table Layout) ሙሉ በሙሉ ተረጋግጧል!');
        connection.release();
    })
    .catch((err) => {
        console.error('❌ የዳታቤዝ ግንኙነት አልተሳካም! ምክንያቱ፦', err.message);
    });


// 📊 የአድሚን API ለ React Frontend መረጃ መላኪያ
app.get('/api/patients', async (req, res) => {
    try {
        const [patients] = await db.query('SELECT * FROM patients ORDER BY id DESC');
        console.log(`📊 Sent ${patients.length} patient rows to React Frontend.`);
        res.status(200).json(patients);
    } catch (error) {
        console.error('❌ Database Query Error:', error.message);
        res.status(500).json({ error: 'Failed to retrieve data from database' });
    }
});

// 🌐 📥 ኒው ዌብሳይት ፎርም ቀጠሮ መያዣ API
app.post('/api/web-book', upload.single('mediaFile'), async (req, res) => {
    try {
        const { fullName, age, gender, country, phoneNumber, reason, appointmentDate, appointmentTime } = req.body;
        
        const targetDate = String(appointmentDate).trim();
        const targetTime = String(appointmentTime).trim();

        // 🛑 PREVENT DOUBLE-BOOKING: Strict verification with SQL TRIM()
        const [existingAppointments] = await db.query(
            'SELECT id FROM patients WHERE TRIM(appointment_date) = ? AND TRIM(appointment_time) = ? AND reminder_sent != 2',
            [targetDate, targetTime]
        );

        if (existingAppointments.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'ይቅርታ፣ ይህ ሰዓት በሌላ ሰው ተይዟል። እባክዎ ሌላ ሰዓት ወይም ቀን ይምረጡ! (This time slot is already booked. Please choose another time.)'
            });
        }

        const ticketId = 'DG-W' + Math.floor(1000 + Math.random() * 9000); 
        
        let dbMediaFileId = 'None';
        let mediaType = 'None';
        
        if (req.file) {
            dbMediaFileId = req.file.filename;
            
            if (req.file.mimetype.startsWith('image/')) mediaType = 'photo';
            else if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
            else mediaType = 'document';
        }

        const insertQuery = `
            INSERT INTO patients 
            (full_name, age, gender, country, phone_number, reason, appointment_date, appointment_time, ticket_id, reminder_sent, media_file_id, media_type, chat_id, raw_display_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'Website Form', ?)
        `;
        
        await db.query(insertQuery, [
            fullName, age, gender, country, phoneNumber, reason, targetDate, targetTime, ticketId, dbMediaFileId, mediaType, targetTime
        ]);

        res.status(200).json({
            success: true,
            message: 'Appointment booked successfully via Web Portal!',
            ticketId: ticketId
        });

    } catch (error) {
        console.error('❌ Web booking route system execution failure:', error);
        res.status(500).json({ success: false, message: 'Server database error. Please try again.' });
    }
});

// 🗑️ ⚙️ NEW: SECURE MANUAL PATIENT DELETION ROUTE FOR ADMIN PANEL
app.delete('/api/patients/:id', async (req, res) => {
    const patientId = req.params.id;
    try {
        const [targetPatient] = await db.query('SELECT full_name FROM patients WHERE id = ?', [patientId]);
        
        if (targetPatient.length === 0) {
            return res.status(404).json({ success: false, message: 'የታካሚው መረጃ አልተገኘም። (Patient record not found.)' });
        }

        await db.query('DELETE FROM patients WHERE id = ?', [patientId]);
        console.log(`🗑️ Admin dropped row ID ${patientId} (${targetPatient[0].full_name}) directly from Aiven Cloud.`);

        res.status(200).json({
            success: true,
            message: `የታካሚ ${targetPatient[0].full_name} መረጃ በተሳካ ሁኔታ ተሰርዟል። (Patient deleted successfully.)`
        });
    } catch (error) {
        console.error('❌ Admin deletion API sequence failed:', error.message);
        res.status(500).json({ success: false, message: 'የመረጃ መሰረዝ ሂደቱ አልተሳካም። (Internal Server Database Error.)' });
    }
});

// 🔄 3. ሁሉንም ገጾች ወደ ሪአክት index.html የሚመራው Fallback Middleware (ከ APIዎች በታች መሆን አለበት)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 🚀 4. ሰርቨሩን በይፋ ማስነሻ ኮድ (እጅግ መጨረሻ ላይ መሆን አለበት)
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running perfectly on port ${PORT}`);
});