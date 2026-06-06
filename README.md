# 🦷 Dr. Getaneh Specialty Dental Clinic

A modern, full-stack clinic management and patient dashboard web application built for **Dr. Getaneh Specialty Dental Clinic**. This system streamlines appointment booking, generates unique patient ticket IDs, and automates notifications using a custom Telegram Bot integration.

🌍 **Live Demo:** [Dr. Getaneh Specialty Dental Clinic](https://dr-getaneh-specialty-dental-clinic.onrender.com)

---

## ✨ Features

* **Double-Booking Prevention:** Strict frontend and backend validation ensures that no two patients can book the exact same date and time slot. The UI instantly disables taken slots, and the database acts as a final safeguard against race conditions.
* **Bilingual Patient Dashboard:** Important clinic instructions and appointment details provided in both Amharic and English.
* **Smart Ticketing System:** Automatically generates unique appointment Ticket IDs (e.g., `DG-W1714`) for seamless receptionist check-ins.
* **Telegram Bot Integration:** * Real-time notifications for new appointments.
  * Automated background Cron Jobs for patient reminders.
* **Responsive UI:** Modern, mobile-friendly interface built with React.
* **Cloud Database:** Secure and reliable data storage using Aiven online MySQL database.

---

## 🛠️ Tech Stack

**Frontend:**
* React.js
* Vite (Build Tool)
* Lucide React (Icons)
* CSS3 / HTML5

**Backend:**
* Node.js
* Express.js
* Node-Telegram-Bot-API

**Database & Deployment:**
* MySQL (Hosted on Aiven)
* Render (Full-stack zero-downtime deployment)

---

## 🚀 Local Development Setup

To run this project locally on your machine, follow these steps:

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v16 or higher)
* Git

### 2. Clone the Repository
```bash
git clone [https://github.com/Wasihun16/dr-getaneh-dental-clinic.git](https://github.com/Wasihun16/dr-getaneh-dental-clinic.git)
cd dr-getaneh-dental-clinic
