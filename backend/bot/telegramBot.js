const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();
const db = require('../config/db'); 

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID; 
const bot = new TelegramBot(token, { polling: true });

const userStates = {};

const amharicMonths = ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];
const englishMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ========================================================
// 📥 ፈንክሽን፦ ፋይሎችን ከቴሌግራም ሰርቨር ወደ ኮምፒውተር ማውረጃ
// ========================================================
async function downloadTelegramFile(fileId, customFileName) {
    try {
        const fileInfo = await bot.getFile(fileId);
        const telegramFilePath = fileInfo.file_path;
        
        const ext = path.extname(telegramFilePath) || '.jpg';
        const finalFileName = `${customFileName}_${Date.now()}${ext}`;
        
        const downloadDir = path.join(__dirname, '..', 'public', 'uploads');
        
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }
        
        const absolutePath = path.join(downloadDir, finalFileName);
        const downloadUrl = `https://api.telegram.org/file/bot${token}/${telegramFilePath}`;
        
        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(absolutePath);
            https.get(downloadUrl, (response) => {
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`💾 ፋይሉ በተሳካ ሁኔታ ወርዷል፦ ${finalFileName}`);
                    resolve(finalFileName); 
                });
            }).on('error', (err) => {
                fs.unlink(absolutePath, () => {}); 
                reject(err);
            });
        });
    } catch (error) {
        console.error("❌ ፋይሉን ከቴሌግራም ማውረድ አልተቻለም፦", error.message);
        return null;
    }
}

// ==========================================
// የሰዓት ፎርማት መቀየሪያ ፈንክሽን (ወደ ደቂቃ)
// ==========================================
function getEATMinutes(timeStr) {
    if (!timeStr) return null;
    timeStr = timeStr.toLowerCase().trim();
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);

    if (!/[a-z\u1200-\u137F]/i.test(timeStr)) {
        return (hour * 60) + minute;
    }

    if (timeStr.includes('am') || timeStr.includes('pm')) {
        if (timeStr.includes('pm') && hour !== 12) hour += 12;
        if (timeStr.includes('am') && hour === 12) hour = 0;
        return (hour * 60) + minute;
    }

    if (timeStr.includes('ማታ') || timeStr.includes('ምሽት') || timeStr.includes('ሌሊት')) {
        hour = (hour === 12) ? 18 : hour + 18;
    } else {
        hour = (hour === 12) ? 6 : hour + 6; 
    }
    
    if (hour >= 24) hour -= 24;
    return (hour * 60) + minute;
}

// ========================================================
// የሰዓት መለወጫ ወደ መደበኛ ፈንክሽን (ወደ ፈረንጂ 24-ሰዓት HH:MM)
// ========================================================
function convertToStandard24Hour(timeStr) {
    const totalMinutes = getEATMinutes(timeStr);
    if (totalMinutes === null) return null;

    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;

    const formattedHours = hours < 10 ? '0' + hours : hours;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${formattedHours}:${formattedMinutes}`; 
}

// 🔘 Official Bot Menu Commands
bot.setMyCommands([
    { command: '/start', description: 'ዋና ገጽ / Main Menu' },
    { command: '/info', description: 'አድራሻ እና መገኛ/ Clinic Address' },
    { command: '/status', description: 'ቀጠሮዎን ለማየት / Check Appointment' },
    { command: '/cancel', description: 'ያቋርጡ / Cancel Process' }
]);

// 🛠️ Database Schema Auto-Verification
(async () => {
    const columnsToAdd = [
        "chat_id VARCHAR(255)", "reminder_sent INT DEFAULT 0", "age VARCHAR(10)", 
        "gender VARCHAR(20)", "country VARCHAR(100)", "reason TEXT", 
        "appointment_time VARCHAR(50)", "ticket_id VARCHAR(50)",
        "media_file_id VARCHAR(255)", "media_type VARCHAR(50)",
        "raw_display_time VARCHAR(100)"
    ];
    for (let col of columnsToAdd) {
        try { await db.query(`ALTER TABLE patients ADD COLUMN ${col}`); } catch (e) {}
    }
    console.log('✅ Professional database columns verified successfully.');
})();

// 🚀 /start Command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    delete userStates[chatId]; 

    const welcomeMessage = `
🏥 *ዶ/ር ጌታነህ የጥርስ ልዩ ህክምና ክሊኒክ* 🏥
✨ *Dr. Getaneh Specialty Dental Clinic* ✨
━━━━━━━━━━━━━━━━━━━━

👋 እንኳን በደህና መጡ! | Welcome!

እባክዎ ቋንቋ ይምረጡ 👇
Please select your language 👇
    `;
    
    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🇪🇹 አማርኛ', callback_data: 'lang_am' }, { text: '🇬🇧 English', callback_data: 'lang_en' }]
            ]
        }
    }).catch(e => console.log(e.message));
});

// 🏢 /info Command
bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    const infoText = `
🏥 *Dr. Getaneh Specialty Dental Clinic*
━━━━━━━━━━━━━━━━━━━━
📞 *ስልክ / Phone:* \`0985952016\`

🕒 *የስራ ሰዓት / Working Hours:*
• ሰኞ - ቅዳሜ (Mon - Sat): 2:30 LT - 12:30 LT (8:30 AM - 6:30 PM)

📍 *አድራሻ (Amharic):*
አዲስ አበባ፣ 5 ኪሎ፣ ከብሔራዊ ሙዚየም ፊት ለፊት፣ ከራዲካል ትምህርት ቤት በታች (በቅድስት ማርያም ቤተክርስቲያን አጠገብ)

📍 *Address (English):*
5 Kilo, Addis Ababa, In front of the National Museum, below Radical School (Near St. Mariam Church)
━━━━━━━━━━━━━━━━━━━━
🗺️ [📍 የጉግል ማፕ አቅጣጫ / Google Maps](https://maps.google.com)
    `; 
    bot.sendMessage(chatId, infoText, { parse_mode: 'Markdown', disable_web_page_preview: false }).catch(e => console.log(e.message));
});

// 🔍 /status Command
bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const [rows] = await db.query(`SELECT * FROM patients WHERE chat_id = ? ORDER BY id DESC LIMIT 1`, [chatId]);
        if (rows && rows.length > 0) {
            const appt = rows[0];
            let statusBadge = "⏳ በመጠባበቅ ላይ (Pending)";
            if (appt.reminder_sent === 2) statusBadge = "❌ አልፏል/ተሰርዟል (Expired)";
            
            const displayTime = appt.raw_display_time || appt.appointment_time;

            const statusText = `
🔍 *የቀጠሮ መረጃዎ / Your Status*
━━━━━━━━━━━━━━━━━━━━
🎫 *Ticket ID:* \`${appt.ticket_id}\`
📌 *ሁኔታ / Status:* ${statusBadge}

👤 *ስም / Name:* ${appt.full_name}
📅 *ቀን / Date:* ${appt.appointment_date}
⏰ *ሰዓት / Time:* ${displayTime}
🦷 *ምክንያት / Reason:* ${appt.reason}
━━━━━━━━━━━━━━━━━━━━
📞 *ለበለጠ መረጃ:* \`0985952016\`
            `;
            bot.sendMessage(chatId, statusText, { parse_mode: 'Markdown' }).catch(e => console.log(e.message));
        } else {
            bot.sendMessage(chatId, `❌ ምንም የተመዘገበ ቀጠሮ አላገኘሁም። አዲስ ለመያዝ /start ይበሉ።\n❌ No active appointment found. Type /start to book.`).catch(e => console.log(e.message));
        }
    } catch (error) {
        bot.sendMessage(chatId, `❌ ሲስተም ላይ ችግር አጋጥሟል። እባክዎ ትንሽ ቆይተው ይሞክሩ።`).catch(e => console.log(e.message));
    }
});

// 🚫 /cancel Command
bot.onText(/\/cancel/, (msg) => {
    const chatId = msg.chat.id;
    if (userStates[chatId]) {
        const lang = userStates[chatId].lang || 'am';
        delete userStates[chatId];
        const reply = lang === 'am' ? `🚫 ሂደቱ ተቋርጧል። አዲስ ለመጀመር /start ይበሉ።` : `🚫 Process cancelled. Type /start to begin again.`;
        bot.sendMessage(chatId, reply, { reply_markup: { remove_keyboard: true } }).catch(e => console.log(e.message));
    }
});

// 🖱️ Buttons Callback Actions
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (!userStates[chatId]) userStates[chatId] = {};

    if (data === 'lang_am' || data === 'lang_en') {
        const lang = data === 'lang_am' ? 'am' : 'en';
        userStates[chatId] = { step: 'WAITING_FOR_NAME', lang: lang }; 
        const prompt = lang === 'am' ? `👤 እባክዎ ሙሉ ስምዎን ከአያትዎ ጋር ያስገቡ (3 ቃላት መሆን አለበት)፦\n*(ምሳሌ፦ ዋሲሁን ጣሴ እንዳለ)*` : `👤 Please enter your full name including your grandfather's name (Must be at least 3 words):\n*(e.g., Wasihun Tassie Endale)*`;
        bot.sendMessage(chatId, prompt, { parse_mode: 'Markdown' }).catch(e => console.log(e.message));
    }

    else if (data.startsWith('month_')) {
        const selectedMonth = data.replace('month_', '');
        userStates[chatId].tempMonth = selectedMonth;
        userStates[chatId].step = 'SELECTING_DAY';

        const lang = userStates[chatId].lang;
        const maxDays = selectedMonth === 'ጳጉሜ' ? 6 : 31;

        const dayButtons = [];
        let row = [];
        for (let i = 1; i <= maxDays; i++) {
            row.push({ text: `${i}`, callback_data: `day_${i}` });
            if (row.length === 5 || i === maxDays) {
                dayButtons.push(row);
                row = [];
            }
        }

        const prompt = lang === 'am' ? `📅 እባክዎ ቀኑን ይምረጡ 👇` : `📅 Please select the Day 👇`;
        bot.sendMessage(chatId, prompt, { reply_markup: { inline_keyboard: dayButtons } }).catch(e => console.log(e.message));
    }

    else if (data.startsWith('day_')) {
        const selectedDay = data.replace('day_', '');
        userStates[chatId].tempDay = selectedDay;
        userStates[chatId].step = 'SELECTING_YEAR';

        const lang = userStates[chatId].lang;
        
        const yearButtons = lang === 'am' 
            ? [
                [{ text: '2018 ዓ.ም', callback_data: 'year_2018 ዓ.ም' }, { text: '2019 ዓ.ም', callback_data: 'year_2019 ዓ.ም' }],
                [{ text: '2020 ዓ.ም', callback_data: 'year_2020 ዓ.ም' }, { text: '2021 ዓ.ም', callback_data: 'year_2021 ዓ.ም' }],
                [{ text: '2022 ዓ.ም', callback_data: 'year_2022 ዓ.ም' }, { text: '2023 ዓ.ም', callback_data: 'year_2023 ዓ.ም' }]
              ]
            : [
                [{ text: '2026', callback_data: 'year_2026' }, { text: '2027', callback_data: 'year_2027' }],
                [{ text: '2028', callback_data: 'year_2028' }, { text: '2029', callback_data: 'year_2029' }],
                [{ text: '2030', callback_data: 'year_2030' }, { text: '2031', callback_data: 'year_2031' }]
              ];

        const prompt = lang === 'am' ? `📅 እባክዎ ዓመተ ምህረቱን ይምረጡ 👇` : `📅 Please select the Year 👇`;
        bot.sendMessage(chatId, prompt, { reply_markup: { inline_keyboard: yearButtons } }).catch(e => console.log(e.message));
    }

    else if (data.startsWith('year_')) {
        const selectedYear = data.replace('year_', '');
        const { tempMonth, tempDay, lang } = userStates[chatId];
        
        const appointmentDate = lang === 'am' 
            ? `${tempMonth} ${tempDay}፤ ${selectedYear}`
            : `${tempMonth} ${tempDay}, ${selectedYear}`;

        // 🛑 🚀 NEW DATE-ONLY VALIDATION 🚀 🛑
        const now = new Date();
        const eatNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        const currEnYear = eatNow.getUTCFullYear();
        const currEnMonth = eatNow.getUTCMonth(); 
        const currEnDay = eatNow.getUTCDate();

        let isPastDate = false;
        let isToday = false;

        if (lang === 'en') {
            const selMonthIdx = englishMonths.indexOf(tempMonth);
            const selDayInt = parseInt(tempDay, 10);
            const selYearInt = parseInt(selectedYear, 10);

            if (selYearInt < currEnYear) { isPastDate = true; }
            else if (selYearInt === currEnYear) {
                if (selMonthIdx < currEnMonth) { isPastDate = true; }
                else if (selMonthIdx === currEnMonth) {
                    if (selDayInt < currEnDay) { isPastDate = true; }
                    else if (selDayInt === currEnDay) { isToday = true; }
                }
            }
        } else if (lang === 'am') {
            const amharicDateFormatter = new Intl.DateTimeFormat('am-ET', { calendar: 'ethiopic', year: 'numeric', month: 'long', day: 'numeric' });
            const currentAmDateParts = amharicDateFormatter.formatToParts(now);
            let currAmYear = 2018; 
            let currAmMonthStr = "";
            let currAmDay = 1;

            for (let part of currentAmDateParts) {
                if (part.type === 'month') currAmMonthStr = part.value;
                if (part.type === 'day') currAmDay = parseInt(part.value, 10);
                if (part.type === 'year') currAmYear = parseInt(part.value, 10);
            }
            
            const currAmMonthIdx = amharicMonths.indexOf(currAmMonthStr);
            const selAmMonthIdx = amharicMonths.indexOf(tempMonth);
            const selAmDayInt = parseInt(tempDay, 10);
            const selAmYearInt = parseInt(selectedYear.replace(' ዓ.ም', ''), 10);

            if (selAmYearInt < currAmYear) { isPastDate = true; }
            else if (selAmYearInt === currAmYear) {
                if (selAmMonthIdx !== -1 && currAmMonthIdx !== -1) {
                    if (selAmMonthIdx < currAmMonthIdx) { isPastDate = true; }
                    else if (selAmMonthIdx === currAmMonthIdx) {
                        if (selAmDayInt < currAmDay) { isPastDate = true; }
                        else if (selAmDayInt === currAmDay) { isToday = true; }
                    }
                }
            }
        }

        // 🛑 ቀኑ ካለፈ (Past Date)
        if (isPastDate) {
            const errorMsg = lang === 'am' 
                ? `❌ ይቅርታ፣ የመረጡት ቀን (${appointmentDate}) አስቀድሞ አልፏል!\n\nእባክዎ ትክክለኛ እና ወደፊት ያለ ቀን ይምረጡ 👇`
                : `❌ Sorry, the selected date (${appointmentDate}) has already passed!\n\nPlease select a valid future date 👇`;
            
            userStates[chatId].step = 'SELECTING_MONTH'; 
            
            const monthList = lang === 'am' ? amharicMonths : englishMonths;
            const monthButtons = [];
            let row = [];
            monthList.forEach((m, idx) => {
                row.push({ text: m, callback_data: `month_${m}` });
                if (row.length === 3 || idx === monthList.length - 1) {
                    monthButtons.push(row);
                    row = [];
                }
            });
            
            bot.sendMessage(chatId, errorMsg, { reply_markup: { inline_keyboard: monthButtons } }).catch(e => console.log(e.message));
            return;
        }

        // ✅ ቀኑ ትክክል ከሆነ (ዛሬ ወይም ወደፊት ከሆነ)
        userStates[chatId].appointmentDate = appointmentDate;
        userStates[chatId].isToday = isToday; 
        userStates[chatId].step = 'WAITING_FOR_TIME';

        const prompt = lang === 'am' 
            ? `⏰ የሚመጡበትን ሰዓት ያስገቡ፦\n*(ምሳሌ: 4:30 ጠዋት ወይም 8:00 ከሰዓት)*` 
            : `⏰ Enter your preferred time:\n*(e.g., 10:30 AM or 2:00 PM)*`;
        bot.sendMessage(chatId, prompt, { parse_mode: 'Markdown' }).catch(e => console.log(e.message));
    }

    bot.answerCallbackQuery(query.id).catch(() => {});
});

// 💬 Core Messaging Flow
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || ''; 

    if (text.startsWith('/')) return;
    if (!userStates[chatId]) {
        if (text) bot.sendMessage(chatId, `❌ እባክዎ /start ን ይጫኑ።\n❌ Please type /start.`).catch(e => console.log(e.message));
        return;
    }

    const currentState = userStates[chatId].step;
    const lang = userStates[chatId].lang;

    if (currentState === 'WAITING_FOR_NAME') {
        if (!text) return bot.sendMessage(chatId, lang === 'am' ? `❌ ጽሁፍ ብቻ ያስገቡ!` : `❌ Text only please!`).catch(e => console.log(e.message));
        
        const nameParts = text.trim().split(/\s+/);
        if (nameParts.length < 3) {
            const errorName = lang === 'am'
                ? `❌ እባክዎ የአያትዎን ስም ጨምረው ሙሉ ስምዎን ያስገቡ! (ቢያንስ 3 ቃላት መሆን አለበት)፦\n*(ምሳሌ፦ ዋሲሁን ጣሴ እንዳለ)*`
                : `❌ Please enter your full name including grandfather's name! (Must be at least 3 words):\n*(e.g., Wasihun Tassie Endale)*`;
            return bot.sendMessage(chatId, errorName, { parse_mode: 'Markdown' }).catch(e => console.log(e.message));
        }

        userStates[chatId].fullName = text; 
        userStates[chatId].step = 'WAITING_FOR_AGE'; 
        bot.sendMessage(chatId, lang === 'am' ? `🎂 እባክዎ ዕድሜዎን ያስገቡ፦` : `🎂 Please enter your age:`).catch(e => console.log(e.message));
    }

    else if (currentState === 'WAITING_FOR_AGE') {
        if (!text || isNaN(text) || text <= 0 || text > 110) {
            return bot.sendMessage(chatId, lang === 'am' ? `❌ እባክዎ ትክክለኛ ዕድሜ በቁጥር ያስገቡ፦` : `❌ Please enter a valid number for age:`).catch(e => console.log(e.message));
        }
        userStates[chatId].age = text; 
        userStates[chatId].step = 'WAITING_FOR_GENDER'; 
        
        const keyboard = lang === 'am' ? [[{ text: 'ወንድ' }, { text: 'ሴት' }]] : [[{ text: 'Male' }, { text: 'Female' }]];
        bot.sendMessage(chatId, lang === 'am' ? `🚻 እባክዎ ጾታዎን ይምረጡ፦` : `🚻 Please select your gender:`, { reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }).catch(e => console.log(e.message));
    }

    else if (currentState === 'WAITING_FOR_GENDER') {
        userStates[chatId].gender = text; 
        userStates[chatId].step = 'WAITING_FOR_COUNTRY'; 
        
        const keyboard = lang === 'am' ? [[{ text: '🇪🇹 ኢትዮጵያ' }, { text: '🌍 ውጭ ሀገር' }]] : [[{ text: '🇪🇹 Ethiopia' }, { text: '🌍 International' }]];
        bot.sendMessage(chatId, lang === 'am' ? `🌍 ያሉበትን ሀገር ይምረጡ፦` : `🌍 Please select your country:`, { reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }).catch(e => console.log(e.message));
    }

    else if (currentState === 'WAITING_FOR_COUNTRY') {
        userStates[chatId].country = text;
        userStates[chatId].step = 'WAITING_FOR_PHONE';
        
        let prompt = lang === 'am'
            ? (text.includes('ኢትዮጵያ') ? `📱 የኢትዮጵያ ስልክ ቁጥርዎን ያስገቡ፦\n*(ምሳሌ: 0985952016)*` : `📱 የውጭ ስልክ ቁጥርዎን ከሀገር ኮድ ጋር ያስገቡ፦\n*(ምሳሌ: +251985952016)*`)
            : (text.toLowerCase().includes('ethiopia') ? `📱 Please enter your phone number:\n*(e.g., 0985952016)*` : `📱 Please enter international phone number:\n*(e.g., +251985952016)*`);
            
        bot.sendMessage(chatId, prompt, { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } }).catch(e => console.log(e.message));
    }

    else if (currentState === 'WAITING_FOR_PHONE') {
        const phoneRegex = /^\+?[0-9\s\-]{9,16}$/;
        if (!phoneRegex.test(text)) {
            const errorMsg = lang === 'am' ? `❌ የተሳሳተ ስልክ ቁጥር ነው። እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ፦\n*(ምሳሌ: 0985952016)*` : `❌ Invalid phone number. Please enter a valid number:\n*(e.g., 0985952016)*`;
            return bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown' }).catch(e => console.log(e.message));
        }

        userStates[chatId].phoneNumber = text; 
        userStates[chatId].step = 'WAITING_FOR_REASON'; 
        
        const keyboard = lang === 'am'
            ? [
                [{ text: 'የጥርስ ህመም' }, { text: 'ማሳጠብ / ማጽዳት' }], 
                [{ text: 'ማስነቀል' }, { text: 'የጥርስ መሙላት' }],
                [{ text: 'የስር ህክምና' }, { text: 'የጥርስ ብረት' }],
                [{ text: 'አጠቃላይ ምርመራ' }, { text: 'ሌላ ምክንያት' }]
              ]
            : [
                [{ text: 'Toothache' }, { text: 'Cleaning' }], 
                [{ text: 'Extraction' }, { text: 'Filling' }],
                [{ text: 'Root Canal' }, { text: 'Braces' }],
                [{ text: 'General Checkup' }, { text: 'Other Reason' }]
              ];
            
        bot.sendMessage(chatId, lang === 'am' ? `🦷 የሚመጡበትን ዋና ምክንያት ይምረጡ፦` : `🦷 Select the primary reason for your visit:`, { reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }).catch(e => console.log(e.message));
    }

    else if (currentState === 'WAITING_FOR_REASON') {
        userStates[chatId].reason = text; 
        userStates[chatId].step = 'WAITING_FOR_MEDIA'; 
        
        const keyboard = [[{ text: 'እለፍ ⏭️ / Skip ⏭️' }]];
        const prompt = lang === 'am' 
            ? `📸 የጥርስዎን ፎቶ፣ ኤክስሬይ (X-ray) ወይም ቪዲዮ ካለዎት አሁን ይላኩ። ከሌለዎት **«እለፍ ⏭️»** የሚለውን ይጫኑ።` 
            : `📸 Please send any relevant photo, X-ray, or video of your teeth. If you don't have any, click **«Skip ⏭️»**`;
            
        bot.sendMessage(chatId, prompt, { parse_mode: 'Markdown', reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }).catch(e => console.log(e.message));
    }

    else if (currentState === 'WAITING_FOR_MEDIA') {
        let hasMedia = false;
        let fileId = null;
        let mediaType = null;

        if (msg.photo) { fileId = msg.photo[msg.photo.length - 1].file_id; mediaType = 'photo'; hasMedia = true; }
        else if (msg.video) { fileId = msg.video.file_id; mediaType = 'video'; hasMedia = true; }
        else if (msg.document) { fileId = msg.document.file_id; mediaType = 'document'; hasMedia = true; }

        if (hasMedia) {
            const statusAlert = await bot.sendMessage(chatId, lang === 'am' ? '⏳ ፋይሉን በማስቀመጥ ላይ... እባክዎ ይጠብቁ' : '⏳ Saving file... please wait').catch(() => {});
            
            const localFileName = `patient_${chatId}`;
            const localFileUrl = await downloadTelegramFile(fileId, localFileName);
            
            if (localFileUrl) {
                userStates[chatId].mediaFileId = localFileUrl; 
                userStates[chatId].mediaType = mediaType;
                userStates[chatId].rawTelegramFileId = fileId; 
                if (statusAlert) bot.deleteMessage(chatId, statusAlert.message_id).catch(() => {});
            } else {
                return bot.sendMessage(chatId, lang === 'am' ? `❌ ፋይሉን ማውረድ አልተቻለም። እባክዎ ድጋሚ ይሞክሩ ወይም «እለፍ ⏭️» ን ይጫኑ።` : `❌ Failed to process file. Try again or click «Skip ⏭️».`).catch(e => console.log(e.message));
            }
        } else if (text.includes('Skip') || text.includes('እለፍ')) {
            userStates[chatId].mediaFileId = 'None';
            userStates[chatId].mediaType = 'None';
            userStates[chatId].rawTelegramFileId = 'None';
        } else {
            return bot.sendMessage(chatId, lang === 'am' ? `❌ እባክዎ ፋይል ይላኩ ወይም «እለፍ⏭️» ን ይጫኑ።` : `❌ Send a file or click «Skip ⏭️».`).catch(e => console.log(e.message));
        }

        userStates[chatId].step = 'SELECTING_MONTH'; 
        const monthList = lang === 'am' ? amharicMonths : englishMonths;
        
        const monthButtons = [];
        let row = [];
        monthList.forEach((m, idx) => {
            row.push({ text: m, callback_data: `month_${m}` });
            if (row.length === 3 || idx === monthList.length - 1) {
                monthButtons.push(row);
                row = [];
            }
        });

        const ackMsg = hasMedia 
            ? (lang === 'am' ? '✅ ፋይሉን ተቀብለናል' : '✅ File Received') 
            : (lang === 'am' ? '⏭️ አልፈነዋል' : '⏭️ Skipped');

        bot.sendMessage(chatId, ackMsg, { reply_markup: { remove_keyboard: true } }).then(() => {
            const prompt = lang === 'am' ? `📅 እባክዎ የሚመጡበትን ወር ይምረጡ 👇` : `📅 Please select your preferred Month 👇`;
            bot.sendMessage(chatId, prompt, { reply_markup: { inline_keyboard: monthButtons } }).catch(e => console.log(e.message));
        }).catch(e => console.log(e.message));
    }
else if (currentState === 'WAITING_FOR_TIME') {
        let timeInput = text.trim().toLowerCase();
        
        // 🚀 AUTO-SANITIZE EDGE CASE (ምስል 4 ላይ ላጋጠመው ስህተት መፍትሄ)
        // ተጠቃሚው የ24-ሰዓት አቆጣጠር (ለምሳሌ ከ12 ሰዓት በላይ የሆኑትን 14:30፣ 23:06) ጽፎ AM/PM ወይም የአማርኛ ማሻሻያዎችን ከቀላቀለ በራሱ ያጠፋቸዋል
        const match24h = timeInput.match(/^(\d{1,2}):(\d{2})/);
        if (match24h) {
            const hr = parseInt(match24h[1]);
            if (hr >= 12) {
                // ሰዓቱ ከ12 በላይ ከሆነ am/pm ወይም የአማርኛ ማሻሻያዎችን ያስወግዳል
                timeInput = timeInput.replace(/(am|pm|ጠዋት|ከሰዓት|ማታ|ምሽት|ሌሊት)/g, '').trim();
            }
        }

        const totalMinutes = getEATMinutes(timeInput);
        const standardTime = convertToStandard24Hour(timeInput);
        
        if (totalMinutes === null || !standardTime || totalMinutes >= 1440) {
            const errorMsg = lang === 'am' 
                ? '❌ የተሳሳተ የሰዓት አገባብ! እባክዎ በትክክል ያስገቡ (ምሳሌ፡ 4:30 ጠዋት፣ 2:00 PM ወይም 14:30)፦' 
                : '❌ Invalid time format! Please try again (e.g., 10:30 AM, 2:00 PM or 14:30):';
            return bot.sendMessage(chatId, errorMsg);
        }

        // 🛑 1. NIGHT / CLOSED HOURS CHECK 🌙
        // ክሊኒኩ ከ 8:30 AM (510 min) እስከ 6:30 PM (1110 min) የሚሰራበት ጊዜ
        if (totalMinutes < 510 || totalMinutes > 1110) { 
            const closedMsg = lang === 'am' 
                ? `🌙 ይቅርታ፣ ክሊኒኩ በዚህ ሰዓት ዝግ ነው።\n\n🕒 *የስራ ሰዓት፡* ከጠዋቱ 2:30 እስከ ምሽቱ 12:30 (8:30 AM - 6:30 PM) ብቻ ነው።\nእባክዎ በስራ ሰዓት ውስጥ ያለ ሰዓት ያስገቡ 👇`
                : `🌙 Sorry, the clinic is closed at this time.\n\n🕒 *Working hours:* 8:30 AM to 6:30 PM.\nPlease enter a time within working hours 👇`;
            return bot.sendMessage(chatId, closedMsg, { parse_mode: 'Markdown' });
        }

        // 🛑 2. PAST TIME TODAY CHECK ⏳ (ቀጠሮው ለዛሬ ከሆነ ብቻ ነው የሚመረምረው)
        const now = new Date();
        const eatNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
        const currentTotalMinutes = (eatNow.getUTCHours() * 60) + eatNow.getUTCMinutes();

        if (userStates[chatId].isToday && totalMinutes <= currentTotalMinutes) {
            let curHour = eatNow.getUTCHours();
            let curMin = eatNow.getUTCMinutes();
            let ampm = curHour >= 12 ? 'PM' : 'AM';
            curHour = curHour % 12 || 12;
            const curTimeStr = `${curHour}:${curMin < 10 ? '0'+curMin : curMin} ${ampm}`;

            const pastMsg = lang === 'am'
                ? `⏳ ይቅርታ፣ ያስገቡት ሰዓት አልፏል! አሁን ሰዓቱ ${curTimeStr} ነው።\nእባክዎ ወደፊት ያለ ሰዓት ያስገቡ 👇`
                : `⏳ Sorry, this time has already passed! Current local time is ${curTimeStr}.\nPlease enter a valid future time 👇`;
            return bot.sendMessage(chatId, pastMsg);
        }

        // 🛑 3. DOUBLE-BOOKING CONFLICT CHECK ❌
        const selectedDate = userStates[chatId].appointmentDate;

        try {
            const [conflictSlots] = await db.query(
                'SELECT id FROM patients WHERE TRIM(appointment_date) = ? AND TRIM(appointment_time) = ? AND reminder_sent != 2',
                [String(selectedDate).trim(), String(standardTime).trim()]
            );

            if (conflictSlots && conflictSlots.length > 0) {
                const conflictMsg = lang === 'am'
                    ? `❌ ይቅርታ፣ የመረጡት ሰዓት (${text}) አሁን በሌላ ታካሚ ተይዟል። እባክዎ ሌላ የተለየ ሰዓት ያስገቡ👇፦`
                    : `❌ Sorry, the selected time (${text}) is already booked by another patient. Please enter a different time👇:`;
                return bot.sendMessage(chatId, conflictMsg).catch(e => console.log(e.message));
            }
        } catch (dbErr) {
            console.error("❌ የቀጠሮ መደራረብ ፍተሻ ላይ ስህተት ተፈጠረ፦", dbErr.message);
            return bot.sendMessage(chatId, lang === 'am' ? `❌ ሲስተም ላይ ችግር አጋጥሟል። እባክዎ ሰዓቱን ድጋሚ ይጻፉ፦` : `❌ Database error. Please enter the time again:`).catch(e => console.log(e.message));
        }

        userStates[chatId].appointmentTime = standardTime; 
        userStates[chatId].rawDisplayTime = text; // ተጠቃሚው ያስገባውን ኦሪጅናል ሰዓት ያስቀምጣል
        userStates[chatId].step = 'CONFIRMATION_STEP';

        const { fullName, age, gender, country, phoneNumber, reason, mediaFileId } = userStates[chatId];
        const attached = mediaFileId === 'None' ? (lang === 'am' ? 'የለም' : 'No') : (lang === 'am' ? 'አዎ (ተያይዟል)' : 'Yes (Attached)');

        const summaryMsg = lang === 'am'
            ? `📝 *እባክዎ መረጃዎን በጥንቃቄ ያረጋግጡ*:\n━━━━━━━━━━━━━━━━━━━━\n👤 *ስም:* ${fullName}\n🔢 *ዕድሜ:* ${age}\n🚻 *ጾታ:* ${gender}\n🌍 *ሀገር:* ${country}\n📱 *ስልክ:* ${phoneNumber}\n🦷 *ምክንያት:* ${reason}\n📁 *ፋይል:* ${attached}\n📅 *ቀን:* ${selectedDate}\n⏰ *ሰዓት:* ${text}\n━━━━━━━━━━━━━━━━━━━━\nያስገቡት መረጃ ትክክል መሆኑን ያረጋግጣሉ?`
            : `📝 *Please Review Your Details*:\n━━━━━━━━━━━━━━━━━━━━\n👤 *Name:* ${fullName}\n🔢 *Age:* ${age}\n🚻 *Gender:* ${gender}\n🌍 *Country:* ${country}\n📱 *Phone:* ${phoneNumber}\n🦷 *Reason:* ${reason}\n📁 *File:* ${attached}\n📅 *Date:* ${selectedDate}\n⏰ *Time:* ${text}\n━━━━━━━━━━━━━━━━━━━━\nConfirm that all information is correct?`;

        const keyboard = lang === 'am'
            ? [[{ text: '✅ አዎ፣ አረጋግጣለሁ' }, { text: '❌ ስህተት አለበት (እንደገና ጀምር)' }]]
            : [[{ text: '✅ Yes, I Confirm' }, { text: '❌ No, Restart Process' }]];

        bot.sendMessage(chatId, summaryMsg, { parse_mode: 'Markdown', reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }).catch(e => console.log(e.message));
    }

    else if (currentState === 'CONFIRMATION_STEP') {
        if (text.includes('❌') || text.toLowerCase().includes('no')) {
            delete userStates[chatId];
            const restartMsg = lang === 'am' ? `🔄 የቀጠሮ ምዝገባው ተሰርዟል። እንደገና ለመጀመር እባክዎ /start ይበሉ።` : `🔄 Registration discarded. Please type /start to try again.`;
            return bot.sendMessage(chatId, restartMsg, { reply_markup: { remove_keyboard: true } }).catch(e => console.log(e.message));
        }

        if (text.includes('✅') || text.toLowerCase().includes('yes')) {
            const { fullName, age, gender, country, phoneNumber, reason, appointmentDate, appointmentTime, rawDisplayTime, mediaFileId, mediaType, rawTelegramFileId } = userStates[chatId];
            
            try {
                // 🛑 FINAL RACE CONDITION DOUBLE-BOOKING SHIELD
                const [raceConditionCheck] = await db.query(
                    'SELECT id FROM patients WHERE TRIM(appointment_date) = ? AND TRIM(appointment_time) = ? AND reminder_sent != 2',
                    [String(appointmentDate).trim(), String(appointmentTime).trim()]
                );

                if (raceConditionCheck && raceConditionCheck.length > 0) {
                    delete userStates[chatId]; 
                    const blockMsg = lang === 'am'
                        ? `⚠️ *ይቅርታ፣ ይህ ሰዓት አሁን ከጥቂት ሰከንዶች በፊት በሌላ ታካሚ ተይዟል!* እባክዎ /start ብለው አዲስ ሰዓት በድጋሚ ይምረጡ።`
                        : `⚠️ *Sorry, this time slot was just booked by another patient a few seconds ago!* Please type /start to choose another time.`;
                    return bot.sendMessage(chatId, blockMsg, { reply_keyboard: true, reply_markup: { remove_keyboard: true } }).catch(e => console.log(e.message));
                }

                const ticketId = 'DG-' + Math.floor(1000 + Math.random() * 9000); 
                const insertQuery = `INSERT INTO patients (full_name, age, gender, country, phone_number, reason, appointment_date, appointment_time, chat_id, ticket_id, reminder_sent, media_file_id, media_type, raw_display_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`;
                
                await db.query(insertQuery, [fullName, age, gender, country, phoneNumber, reason, appointmentDate, appointmentTime, chatId, ticketId, mediaFileId, mediaType, rawDisplayTime]);
                
                delete userStates[chatId]; 
                
                const successMsg = lang === 'am'
                    ? `✅ *ቀጠሮዎ በተሳካ ሁኔታ ተረጋግጧል!*\n\n🎫 *የቀጠሮ መለያ (Ticket ID):* \`${ticketId}\`\n\n👤 *ስም:* ${fullName}\n📅 *ቀን:* ${appointmentDate}\n⏰ *ሰዓት:* ${rawDisplayTime}\n━━━━━━━━━━━━━━━━━━━━\n💬 *ማሳሰቢያ፦* ከተያዘልዎ የቀጠሮ ሰዓት አስቀድሞ የማስታወሻ መልእክት በዚሁ ቦት በኩል ይላክልዎታል።\n━━━━━━━━━━━━━━━━━━━━\n📞 *ለበለጠ መረጃ ደውሉ:* \`0985952016\`\n📍 *አድራሻ:* 5 ኪሎ፤ ከብሔራዊ ሙዚየም ፊት ለፊት\n🗺️ [የጉግል ማፕ አቅጣጫ ለመክፈት እዚህ ይጫኑ](http://maps.google.com/?q=5+Kilo+National+Museum+Addis+Ababa)\n\n🙏 ክሊኒክ ሲመጡ ይህንን መለያ ቁጥር (\`${ticketId}\`) ያሳዩ። ቀጠሮዎን ለማየት በማንኛውም ጊዜ /status ብለው ይጫኑ!`
                    : `✅ *Appointment Confirmed!*\n\n🎫 *Ticket ID:* \`${ticketId}\`\n\n👤 *Name:* ${fullName}\n📅 *Date:* ${appointmentDate}\n⏰ *Time:* ${rawDisplayTime}\n━━━━━━━━━━━━━━━━━━━━\n💬 *Note:* A reminder message will be sent to you via this bot before your appointment time.\n━━━━━━━━━━━━━━━━━━━━\n📞 *Call for info:* \`0985952016\`\n📍 *Address:* 5 Kilo, In front of National Museum\n🗺️ [Click here for Google Maps](http://maps.google.com/?q=5+Kilo+National+Museum+Addis+Ababa)\n\n🙏 Present this Ticket ID (\`${ticketId}\`) upon arrival. Type /status anytime to check your appointment!`;
                
                bot.sendMessage(chatId, successMsg, { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true }, disable_web_page_preview: false }).catch(e => console.log(e.message));

                if (adminChatId) {
                    const adminAlert = `🚨 *New Confirmed Appointment!*\n━━━━━━━━━━━━━━━━━━━━\n🎫 *Ticket ID:* \`${ticketId}\`\n👤 *Name:* ${fullName}\n📱 *Phone:* ${phoneNumber}\n🦷 *Reason:* ${reason}\n📅 *Date:* ${appointmentDate} at ${rawDisplayTime} (${appointmentTime})\n📁 *File Attached:* ${mediaFileId !== 'None' ? 'Yes 👇' : 'No'}`;
                    await bot.sendMessage(adminChatId, adminAlert, { parse_mode: 'Markdown' }).catch(e => console.log("Admin alert failed.", e.message));
                    
                    if (rawTelegramFileId && rawTelegramFileId !== 'None') {
                        if (mediaType === 'photo') bot.sendPhoto(adminChatId, rawTelegramFileId, { caption: `Patient: ${fullName}` }).catch(() => {});
                        else if (mediaType === 'video') bot.sendVideo(adminChatId, rawTelegramFileId, { caption: `Patient: ${fullName}` }).catch(() => {});
                        else if (mediaType === 'document') bot.sendDocument(adminChatId, rawTelegramFileId, { caption: `Patient: ${fullName}` }).catch(() => {});
                    }
                }
                
            } catch (error) {
                console.error(error);
                bot.sendMessage(chatId, `❌ ይቅርታ፣ ሲስተም ላይ ስህተት አጋጥሟል። እባክዎ በድጋሚ /start ብለው ይሞክሩ።`).catch(e => console.log(e.message));
            }
        }
    }
// ========================================================
// 3. የጀርባ ክሮን ሲስተም (የቴሌግራም ብቻ ማስታወሻ እና መሰረዣ)
// ========================================================
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const ethiopiaTimeOptions = { timeZone: "Africa/Addis_Ababa", hour: '2-digit', minute: '2-digit', hour12: false };
        const timeStr = now.toLocaleTimeString("en-US", ethiopiaTimeOptions);
        const [currentHour, currentMinute] = timeStr.split(':').map(Number);
        const currentTotalMinutes = (currentHour * 60) + currentMinute;

        const amharicDateStr = new Intl.DateTimeFormat('am-ET', { calendar: 'ethiopic', month: 'long', day: 'numeric' }).format(now);
        const englishDateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        
        const currentYearAm = "2018 ዓ.ም"; 
        const currentYearEn = "2026";
        
        const todayAmComma = `${amharicDateStr}፣ ${currentYearAm}`.replace(/\s+/g, ' ').trim();
        const todayAmSemicolon = `${amharicDateStr}፤ ${currentYearAm}`.replace(/\s+/g, ' ').trim();
        const todayEnFull = `${englishDateStr}, ${currentYearEn}`.replace(/\s+/g, ' ').trim();

        // 🔍 ሀ. ማስታወሻ መላክ
        const [upcomingPatients] = await db.query(
            'SELECT * FROM patients WHERE chat_id IS NOT NULL AND (appointment_date = ? OR appointment_date = ? OR appointment_date = ?) AND reminder_sent = 0', 
            [todayAmComma, todayAmSemicolon, todayEnFull]
        );

        for (const patient of upcomingPatients) {
            const apptTotalMinutes = getEATMinutes(patient.raw_display_time || patient.appointment_time);
            if (apptTotalMinutes === null) continue;

            const minutesUntilAppointment = apptTotalMinutes - currentTotalMinutes;

            if (minutesUntilAppointment <= 120 && minutesUntilAppointment >= 0) {
                const [updateResult] = await db.query('UPDATE patients SET reminder_sent = 1 WHERE id = ? AND reminder_sent = 0', [patient.id]);
                
                if (updateResult.affectedRows > 0) {
                    let remainingTextAm = "";
                    let remainingTextEn = "";
                    
                    let h = Math.floor(minutesUntilAppointment / 60);
                    let m = minutesUntilAppointment % 60;

                    if (h > 0 && m > 0) {
                        remainingTextAm = `ከ ${h} ሰዓት እና ${m} ደቂቃ በኋላ`;
                        remainingTextEn = `in ${h} hour(s) and ${m} minute(s)`;
                    } else if (h > 0 && m === 0) {
                        remainingTextAm = `ከ ${h} ሰዓት በኋላ`;
                        remainingTextEn = `in ${h} hour(s)`;
                    } else if (h === 0 && m > 0) {
                        remainingTextAm = `ከ ${m} ደቂቃ በኋላ`;
                        remainingTextEn = `in ${m} minute(s)`;
                    } else {
                        remainingTextAm = `አሁን`;
                        remainingTextEn = `right now`;
                    }

                    const displayTime = patient.raw_display_time || patient.appointment_time;
                    const reminderMsg = `🔔 *የቀጠሮ ማስታወሻ | Appointment Reminder*\n\nጤና ይስጥልኝ *${patient.full_name}*፤ ለዶክተር ጌታነህ የጥርስ ክሊኒክ የያዙት ቀጠሮ ${remainingTextAm} ይደርሳል።\n\nHello *${patient.full_name}*, your appointment at Dr. Getaneh Specialty Dental Clinic is coming up ${remainingTextEn}.\n\n📅 *ቀን | Date:* ${patient.appointment_date}\n⏰ *ሰዓት | Time:* ${displayTime}\n\nእባክዎ በሰዓቱ ይገኙ። እናመሰግናለን! 🙏`;
                    
                    await bot.sendMessage(patient.chat_id, reminderMsg, { parse_mode: 'Markdown' }).catch(() => {});
                    
                    if (adminChatId) {
                        await bot.sendMessage(adminChatId, `⚠️ *Reminder Sent:* ለ ${patient.full_name} የማስታወሻ መልእክት ተልኳል። (${remainingTextAm})`, { parse_mode: 'Markdown' }).catch(() => {});
                    }
                }
            }
        }

        // 🔍 ለ. 20 ደቂቃ ሲያረፍዱ ቀጠሮ መሰረዝ
        const [activePatients] = await db.query(
            'SELECT * FROM patients WHERE chat_id IS NOT NULL AND (appointment_date = ? OR appointment_date = ? OR appointment_date = ?) AND reminder_sent = 1', 
            [todayAmComma, todayAmSemicolon, todayEnFull]
        );

        for (const patient of activePatients) {
            const apptTotalMinutes = getEATMinutes(patient.raw_display_time || patient.appointment_time);
            if (apptTotalMinutes === null) continue; 

            const minutesPassed = currentTotalMinutes - apptTotalMinutes;

            if (minutesPassed >= 20 && minutesPassed < 1440) {
                const [updateResult] = await db.query('UPDATE patients SET reminder_sent = 2 WHERE id = ? AND reminder_sent = 1', [patient.id]);
                
                if (updateResult.affectedRows > 0) {
                    const lateMsg = `❌ *የቀጠሮ ማሳሰቢያ | Appointment Expired*\n\nይቅርታ *${patient.full_name}*፤ ከተያዘልዎ የቀጠሮ ሰዓት ላይ 20 ደቂቃ በማረፈድዎ ምክንያት በሰዓቱ መገኘት ስላልቻሉ ቀጠሮዎ ተሰርዟል። እባክዎ እንደገና አዲስ ቀጠሮ ይያዙ።\n\nSorry *${patient.full_name}*, because you could not arrive on time (over 20 minutes late), your appointment has expired. Please book another appointment.`;
                    
                    await bot.sendMessage(patient.chat_id, lateMsg, { parse_mode: 'Markdown' }).catch(() => {});
                    
                    if (adminChatId) {
                        await bot.sendMessage(adminChatId, `❌ *Appointment Expired:* የ ${patient.full_name} ቀጠሮ (20 ደቂቃ በማረፈዱ) ተሰርዟል።`, { parse_mode: 'Markdown' }).catch(() => {});
                    }
                }
            }
        }
    } catch (error) {
        console.error("❌ ክሮን ስራ ላይ ስህተት ተከስቷል፦", error.message);
    }
});

console.log('🏁 የቦት ሲስተም እና የቴሌግራም ክሮን ጃብ በተሳካ ሁኔታ ተነስተዋል...');

module.exports = bot;
});