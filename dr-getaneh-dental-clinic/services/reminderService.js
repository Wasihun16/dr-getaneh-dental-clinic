const cron = require('node-cron');
const db = require('../config/db');
require('dotenv').config();

// 🤖 Telegram Bot Setup
const TelegramBot = require('node-telegram-bot-api');
const reminderBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const adminChatId = process.env.ADMIN_CHAT_ID;

// ⏱️ Converts Ethiopian, 12h English, and 24h Web times to EAT Day Minutes
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

function startReminderService() {
    console.log('🔔 የማስታወሻ ሲስተም (Telegram-Only Reminder) በጀርባ መሥራት ጀምሯል...');

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            
            const ethiopiaTimeOptions = { timeZone: "Africa/Addis_Ababa", hour: '2-digit', minute: '2-digit', hour12: false };
            const timeStr = now.toLocaleTimeString("en-US", ethiopiaTimeOptions);
            const [currentHour, currentMinute] = timeStr.split(':').map(Number);
            const currentTotalMinutes = (currentHour * 60) + currentMinute;

            const amharicDateStr = new Intl.DateTimeFormat('am-ET', { timeZone: "Africa/Addis_Ababa", calendar: 'ethiopic', month: 'long', day: 'numeric' }).format(now);
            const englishDateStr = now.toLocaleDateString('en-US', { timeZone: "Africa/Addis_Ababa", month: 'long', day: 'numeric' });
            
            const currentYearAm = "2018 ዓ.ም"; 
            const currentYearEn = "2026";
            
            const todayAmComma = `${amharicDateStr}፣ ${currentYearAm}`.replace(/\s+/g, ' ').trim();
            const todayAmSemicolon = `${amharicDateStr}፤ ${currentYearAm}`.replace(/\s+/g, ' ').trim();
            const todayEnFull = `${englishDateStr}, ${currentYearEn}`.replace(/\s+/g, ' ').trim();

            // ========================================================
            // 🔍 ሀ. የቀጠሮ ማስታወሻ (Telegram Alert Only)
            // ========================================================
            const [upcomingPatients] = await db.query(
                'SELECT * FROM patients WHERE (appointment_date = ? OR appointment_date = ? OR appointment_date = ?) AND reminder_sent = 0', 
                [todayAmComma, todayAmSemicolon, todayEnFull]
            );

            for (const patient of upcomingPatients) {
                const apptTotalMinutes = getEATMinutes(patient.appointment_time);
                if (apptTotalMinutes === null) continue;

                const minutesUntilAppointment = apptTotalMinutes - currentTotalMinutes;

                // ከቀጠሮው 2 ሰዓት (120 ደቂቃ) ሲቀረው ማስታወሻ ይልካል
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

                        // Telegram Push Delivery
                        if (patient.chat_id && /^\d+$/.test(patient.chat_id.trim())) {
                            try {
                                const reminderMsg = `🔔 **የቀጠሮ ማስታወሻ | Appointment Reminder**\n\nጤና ይስጥልኝ **${patient.full_name}**፤ ለዶክተር ጌታነህ የጥርስ ክሊኒክ የያዙት ቀጠሮ ${remainingTextAm} ይደርሳል።\n\nHello **${patient.full_name}**, your appointment at Dr. Getaneh Specialty Dental Clinic is coming up ${remainingTextEn}.\n\n📅 **ቀን | Date:** ${patient.appointment_date}\n⏰ **ሰዓት | Time:** ${patient.appointment_time}\n\nእባክዎ በሰዓቱ ይገኙ። እናመሰግናለን! 🙏`;
                                await reminderBot.sendMessage(patient.chat_id, reminderMsg, { parse_mode: 'Markdown' });
                                console.log(`📩 Telegram ማስታወሻ ለ ${patient.full_name} በተሳካ ሁኔታ ተልኳል።`);
                            } catch (tgErr) {
                                console.error(`❌ Failed to send Telegram alert for ${patient.full_name}:`, tgErr.message);
                            }
                        }

                        if (adminChatId) {
                            await reminderBot.sendMessage(adminChatId, `⚠️ **Reminder Issued:** Telegram notification sent to patient: **${patient.full_name}**.`, { parse_mode: 'Markdown' }).catch(() => {});
                        }
                    }
                }
            }

            // ========================================================
            // 🔍 ለ. የቀጠሮ ማለፊያ ማሳሰቢያ (20-Minute Expiration)
            // ========================================================
            const [activePatients] = await db.query(
                'SELECT * FROM patients WHERE (appointment_date = ? OR appointment_date = ? OR appointment_date = ?) AND reminder_sent = 1', 
                [todayAmComma, todayAmSemicolon, todayEnFull]
            );

            for (const patient of activePatients) {
                const apptTotalMinutes = getEATMinutes(patient.appointment_time);
                if (apptTotalMinutes === null) continue; 

                const minutesPassed = currentTotalMinutes - apptTotalMinutes;

                if (minutesPassed >= 20 && minutesPassed < 1440) {
                    const [updateResult] = await db.query('UPDATE patients SET reminder_sent = 2 WHERE id = ? AND reminder_sent = 1', [patient.id]);
                    
                    if (updateResult.affectedRows > 0) {
                        if (patient.chat_id && /^\d+$/.test(patient.chat_id.trim())) {
                            try {
                                const lateMsg = `❌ **የቀጠሮ ማሳሰቢያ | Appointment Expired**\n\nይቅርታ **${patient.full_name}**፤ ከተያዘልዎ የቀጠሮ ሰዓት ላይ 20 ደቂቃ በማረፈድዎ ምክንያት በሰዓቱ መገኘት ስላልቻሉ ቀጠሮዎ ተሰርዟል። እባክዎ እንደገና አዲስ ቀጠሮ ይያዙ।\n\nSorry **${patient.full_name}**, because you could not arrive on time (over 20 minutes late), your appointment has expired. Please book another appointment.`;
                                await reminderBot.sendMessage(patient.chat_id, lateMsg, { parse_mode: 'Markdown' });
                            } catch (tgErr) {
                                console.error(`❌ Could not message expired status to Telegram user ${patient.full_name}`);
                            }
                        }
                        
                        console.log(`❌ System auto-expired appointment slot for ${patient.full_name} due to latency.`);
                        
                        if (adminChatId) {
                            await reminderBot.sendMessage(adminChatId, `❌ **Appointment Canceled:** ${patient.full_name} marked as expired (20-minute rule).`, { parse_mode: 'Markdown' }).catch(() => {});
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ ማስታወሻ ላይ ስህተት ተፈጠረ፦', error.message);
        }
    });
}

module.exports = { startReminderService };