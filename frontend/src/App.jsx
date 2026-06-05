import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Calendar, Phone, CheckCircle, Clock, Search, RefreshCw, 
  User, PlusCircle, LayoutDashboard, ShieldCheck, MapPin, Award, 
  ChevronRight, Upload, ExternalLink, Trash2, Download, Square, CheckSquare,
  HeartPulse, Star, Stethoscope, Sparkles, HelpCircle, ArrowUp, 
  ImageIcon, UsersRound, BookOpen, Baby, Syringe, Lightbulb, LogIn, LogOut, Key, UserCheck
} from 'lucide-react';
import './App.css';

// 📸 1. ACTUAL PHYSICAL FILE IMPORTS (Matching your VS Code Explorer sidebar)
import dentalScanImg from "./assets/dental-scan.jpg"; 
import sergery from "./assets/sergery-ex.jpg";                       
import modernReception from "./assets/modern-reception.jpg";       
import clinicLogo from "./assets/logo.jpg";
import clinicBuildingImg from "./assets/clinic-main.jpg"; 

// 🛡️ 2. PERMANENT SAFETY NET ALIASES 
const dental = dentalScanImg; 
const scan = dentalScanImg;

import drGetanehImg from "./assets/getaneh.jpg";
import drAbelImg from "./assets/abel.jpg";
import drMahletImg from "./assets/mahlet.jpg";

const BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://clinic-backend-qi86.onrender.com";

function App() {
  // 🔐 AUTHENTICATION & VIEW STATES
  const [view, setView] = useState("public"); // "public", "login_page", "dashboard"
  const [loginType, setLoginType] = useState("Patient"); 
  const [userRole, setUserRole] = useState("User"); // "User", "Receptionist", "Admin"
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // 📊 DATA & UI MANAGEMENT STATES
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [activeTab, setActiveTab] = useState("home");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedPatientIds, setSelectedPatientIds] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null); 

  const [formData, setFormData] = useState({
    fullName: '', 
    age: '', 
    gender: 'Male', 
    phoneNumber: '', 
    reason: 'General Checkup', 
    appointmentDate: '', 
    appointmentTime: ''
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  // 🔑 UNIFIED LOGIN SUBMIT LOGIC
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");

    if (loginType === "Patient") {
      setUserRole("User");
      setView("public");
      setActiveTab("book-now");
      setTimeout(() => {
        document.getElementById("book-now")?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      if (loginPassword === "admin123") {
        setUserRole("Admin");
        setView("dashboard");
        setActiveTab("dashboard");
        setLoginPassword("");
      } else if (loginPassword === "recep123") {
        setUserRole("Receptionist");
        setView("dashboard");
        setActiveTab("dashboard");
        setLoginPassword("");
      } else {
        setLoginError("ያስገቡት የይለፍ ቃል የተሳሳተ ነው! እባክዎ እንደገና ይሞክሩ። / Invalid Password!");
      }
    }
  };

  // 🚪 SYSTEM LOGOUT HANDLER
  const handleLogout = () => {
    setUserRole("User");
    setView("public");
    setActiveTab("home");
    setLoginType("Patient");
    setLoginPassword("");
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/patients`);
      if (!response.ok) throw new Error("Could not connect to the database API. / ከዳታቤዝ ጋር መገናኘት አልተቻለም።");
      const data = await response.json();
      setPatients(data);
      setSelectedPatientIds([]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ticket_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone_number?.includes(searchTerm)
  );

  const handleSelectRow = (id) => {
    if (selectedPatientIds.includes(id)) {
      setSelectedPatientIds(selectedPatientIds.filter(item => item !== id));
    } else {
      setSelectedPatientIds([...selectedPatientIds, id]);
    }
  };

  const handleSelectAllRows = () => {
    if (selectedPatientIds.length === filteredPatients.length) {
      setSelectedPatientIds([]);
    } else {
      setSelectedPatientIds(filteredPatients.map(p => p.id));
    }
  };

  const deletePatientRecord = async (id) => {
    if (userRole !== 'Admin') {
      alert("ይህን ተግባር ለማከናወን የአስተዳዳሪ (Admin) መብት ያስፈልጋል። / Admin privileges required to execute this operation.");
      return;
    }

    if (window.confirm("የዚህን ታካሚ መረጃ በቋሚነት ለመሰረዝ እርግጠኛ ነዎት? / Are you sure you want to permanently delete this patient record?")) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/patients/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (response.ok && data.success) {
          alert(data.message);
          setPatients(prev => prev.filter(p => p.id !== id));
          setSelectedPatientIds(prev => prev.filter(item => item !== id));
        } else {
          alert("ስህተት (Error)፦ " + (data.message || "መረጃውን መሰረዝ አልተቻለም (Could not delete)."));
        }
      } catch (err) {
        alert("ከሰርቨር ጋር መገናኘት አልተቻለም (Server connection failed).");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (userRole !== 'Admin') {
      alert("የጅምላ መረጃዎችን ለመሰረዝ የአስተዳዳሪ (Admin) መብት ያስፈልጋል። / Admin privileges required for bulk deletion operations.");
      return;
    }

    const totalCount = selectedPatientIds.length;
    if (window.confirm(`የመረጧቸውን ${totalCount} ታካሚዎች መረጃ ለመሰረዝ እርግጠኛ ነዎት? / Are you sure you want to delete ${totalCount} selected records?`)) {
      setLoading(true);
      let successCount = 0; let failureCount = 0;
      for (const id of selectedPatientIds) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/patients/${id}`, { method: 'DELETE' });
          if (response.ok) successCount++; else failureCount++;
        } catch (err) {
          failureCount++;
        }
      }
      alert(`ሂደቱ ተጠናቋል። በተሳካ ሁኔታ የተሰረዙ (Deleted): ${successCount} | ያልተሳኩ (Failed): ${failureCount}`);
      fetchPatients(); 
    }
  };

  const exportToCSV = () => {
    if (filteredPatients.length === 0) return alert("ሊወርድ የሚችል ዳታ አልተገኘም / No data available to download.");
    const headers = ["Ticket ID", "Full Name", "Age", "Gender", "Phone Number", "Reason", "Appointment Date", "Appointment Time"];
    const csvRows = [
      headers.join(','), 
      ...filteredPatients.map(p => [
        `"${p.ticket_id || ('DG-' + p.id)}"`,
        `"${p.full_name?.replace(/"/g, '""')}"`,
        `"${p.age || ''}"`,
        `"${p.gender || ''}"`,
        `"${p.phone_number || ''}"`,
        `"${p.reason || ''}"`,
        `"${p.appointment_date || ''}"`,
        `"${p.appointment_time || ''}"`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Patients_5Kilo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMediaLink = (mediaFileId) => {
    if (!mediaFileId || mediaFileId === 'None' || mediaFileId === '') return null;
    if (mediaFileId.startsWith('http://') || mediaFileId.startsWith('https://')) return mediaFileId;
    if (mediaFileId.startsWith('patient_') || mediaFileId.startsWith('web-') || mediaFileId.includes('.')) {
      return `${BACKEND_URL}/uploads/${mediaFileId}`;
    }
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    return `https://api.telegram.org/file/bot${botToken}/${mediaFileId}`;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "appointmentDate") {
      const takenSlots = patients
        .filter(p => p.appointment_date === value)
        .map(p => p.appointment_time);
      setBookedSlots(takenSlots);
    }
  };

  const handleFileChange = (e) => setMediaFile(e.target.files[0]);

  const handleResetForm = () => {
    setFormData({
      fullName: '', age: '', gender: 'Male',
      phoneNumber: '', reason: 'General Checkup', appointmentDate: '', appointmentTime: ''
    });
    setMediaFile(null);
    setBookingResult(null);
    setBookedSlots([]);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!formData.appointmentTime) {
      alert("እባክዎ የቀጠሮ ሰዓት ይምረጡ! (Please select a time slot!)");
      return;
    }

    setBookingLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (mediaFile) data.append('mediaFile', mediaFile);

    try {
      const response = await fetch(`${BACKEND_URL}/api/web-book`, { method: 'POST', body: data });
      const result = await response.json();
      if (response.ok && result.success) {
        setBookingResult(result);
        fetchPatients();
      } else {
        alert(result.message || 'ቀጠሮ መያዝ አልተሳካም። / Booking failed.');
      }
    } catch (error) {
      alert('ከማዕከላዊ ሰርቨር ጋር መገናኘት አልተቻለም። / Cannot connect to server.');
    } finally {
      setBookingLoading(false);
    }
  };

  const navigateToSection = (sectionId) => {
    setView("public");
    setActiveTab(sectionId);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="app-container">
      
   {/* 📅 CLINIC WORKING HOURS TOP BAR (Updated 🚀) */}
      {view === "public" && (
        <div className="emergency-top-bar">
          <div className="top-bar-content">
            <span className="pulse-dot"></span>
            <p>
              <strong>የስራ ቀናት፦ ከሰኞ - ቅዳሜ (እስከ ማታ 11:30) | Working Hours: Mon - Sat (Until 5:30 PM):</strong> 
              {" "}ይደውሉልን (Call Us) <a href="tel:+251930641483" className="top-bar-phone">+251 930 64 14 83</a>
            </p>
          </div>
        </div>
      )}

      {/* 🌐 NAVBAR */}
      <nav className="main-navbar">
        <div className="nav-brand" onClick={() => { navigateToSection("home"); setDropdownOpen(false); }}>
          <img src={clinicLogo} alt="Clinic Logo" className="brand-logo-img" />
          <div className="nav-brand-text">
            <h1>ዶ/ር ጌታነህ የጥርስ ልዩ ህክምና</h1>
            <p>Dr. Getaneh Specialty Dental Clinic</p>
          </div>
        </div>
        
        <div className="nav-links">
          {view === "public" && (
            <>
              <a href="#home" onClick={() => { navigateToSection("home"); setDropdownOpen(false); }} className={activeTab === "home" ? "active-nav-item" : ""}>ዋና ገጽ (Home)</a>
              <a href="#about" onClick={() => { navigateToSection("about"); setDropdownOpen(false); }} className={activeTab === "about" ? "active-nav-item" : ""}>ስለ እኛ (About)</a>
              <a href="#services" onClick={() => { navigateToSection("services"); setDropdownOpen(false); }} className={activeTab === "services" ? "active-nav-item" : ""}>አገልግሎቶች (Services)</a>
              <a href="#book-now" onClick={() => { navigateToSection("book-now"); setDropdownOpen(false); }} className="highlight-link">ቀጠሮ ይያዙ (Book Now)</a>
              
              <div className="nav-dropdown-container" ref={dropdownRef} data-visible={dropdownOpen ? "true" : "false"}>
                <button type="button" className={`dropdown-toggle-btn ${["team", "gallery", "tips", "why-us", "faq", "pricing"].includes(activeTab) ? "active-nav-item" : ""}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                  ተጨማሪ መረጃ (Explore) <span className="dropdown-chevron">▶</span>
                </button>
                <div className="nav-dropdown-menu">
                  <a href="#pricing" onClick={() => { navigateToSection("pricing"); setDropdownOpen(false); }}>ዋጋዎች (Pricing)</a>
                  <a href="#why-us" onClick={() => { navigateToSection("why-us"); setDropdownOpen(false); }}>ለምን እኛን? (Why Us)</a>
                  <a href="#team" onClick={() => { navigateToSection("team"); setDropdownOpen(false); }}>ባለሙያዎች (Team)</a>
                  <a href="#gallery" onClick={() => { navigateToSection("gallery"); setDropdownOpen(false); }}>ገጽታ (Gallery)</a>
                  <a href="#tips" onClick={() => { navigateToSection("tips"); setDropdownOpen(false); }}>ምክሮች (Tips)</a>
                  <a href="#faq" onClick={() => { navigateToSection("faq"); setDropdownOpen(false); }}>ጥያቄዎች (FAQs)</a>
                </div>
              </div>
            </>
          )}

          {view === "public" && (
            <button type="button" className="admin-toggle-btn" onClick={() => { setDropdownOpen(false); setView("login_page"); }}>
              <LogIn size={15} /> <span>ግባ (Login)</span>
            </button>
          )}

          {view === "login_page" && (
            <button type="button" className="admin-toggle-btn" onClick={() => setView("public")}>
              <span>ወደ ገጹ ተመለስ (Back)</span>
            </button>
          )}

          {view === "dashboard" && (
            <button type="button" className="admin-toggle-btn logout-theme" onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}>
              <LogOut size={15} /> <span>ውጣ (Logout) [{userRole}]</span>
            </button>
          )}
        </div>
      </nav>

      {/* 🔒 VIEW 1: UNIFIED LOGIN GATEWAY */}
      {view === "login_page" && (
        <div className="login-screen-wrapper" style={{ padding: '80px 20px', display: 'flex', justifyContent: 'center', backgroundColor: '#f1f5f9', minHeight: '70vh', alignItems: 'center' }}>
          <div className="login-card" style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <UserCheck size={40} color="#2563eb" style={{ margin: '0 auto 10px' }} />
              <h2 style={{ fontSize: '1.6rem', color: '#1e3a8a' }}>እንኳን ደህና መጡ | Welcome</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>እባክዎ የማንነት አይነትዎን ይምረጡ</p>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#334155' }}>የመግቢያ አይነት (Login As)</label>
                <select value={loginType} onChange={(e) => { setLoginType(e.target.value); setLoginError(""); }} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}>
                  <option value="Patient">ታካሚ / ተጠቃሚ (Patient / User)</option>
                  <option value="Staff">የክሊኒክ ሰራተኛ (Clinic Staff Member)</option>
                </select>
              </div>

              {loginType === "Staff" && (
                <div className="form-group animate-fade-in" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#334155' }}>የሰራተኛ የይለፍ ቃል (Staff Password)</label>
                  <input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }} required />
                </div>
              )}

              {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' }}>{loginError}</p>}

              <button type="submit" className="submit-booking-btn" style={{ width: '100%', padding: '12px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white' }}>
                <LogIn size={16} /> ቀጥል (Proceed)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🌐 VIEW 2: PATIENT WEBSITE PUBLIC PORTAL */}
      {view === "public" && (
        <div className="public-website animate-fade-in">
          
          {/* HERO MODULE */}
          <section id="home" className="hero-section">
            <div className="hero-content">
              <span className="badge">📍 5 ኪሎ ቅርንጫፍ (5 Kilo Branch)</span>
              <h2>ለእናንተ እና ለቤተሰባችሁ የሚሆን እምነት የሚጣልበት የጥርስ ህክምና!</h2>
              <h2 style={{ fontSize: '1.5rem', color: '#64748b', marginTop: '10px' }}>Trusted dental care for you and your family!</h2>
              <p>በተረጋገጡ ስፔሻሊስቶች እንክብካቤ ስር ዓለም አቀፍ ደረጃውን የጠበቀ ዲጂታል የጥርስ ህክምና ያግኙ። <br/> <i>Experience world-class digital dentistry under the care of certified specialists. Your radiant, healthy smile starts here.</i></p>
              
              <div className="hero-actions">
                <a href="#book-now" onClick={() => { navigateToSection("book-now"); setDropdownOpen(false); }} className="btn btn-primary">
                  አሁኑኑ ቀጠሮ ይያዙ (Book Now) <ChevronRight size={16} />
                </a>
                <a href="#services" onClick={() => { navigateToSection("services"); setDropdownOpen(false); }} className="btn btn-secondary">
                  አገልግሎቶቻችን (Our Services)
                </a>
              </div>

              <div className="hero-features">
                <div><ShieldCheck size={18} /> 100% የተረጋገጠ ህክምና (Certified Care)</div>
                <div><Award size={18} /> ዘመናዊ ቴክኖሎጂ (Modern Tech)</div>
              </div>
            </div>
            
            <div className="hero-image-wrapper">
              <img src={clinicBuildingImg} alt="Dr. Getaneh Clinic" className="hero-real-image" />
              <div className="experience-badge">
                <h3>12+</h3>
                <p>ዓመታት ልምድ<br/>(Years Exp)</p>
              </div>
            </div>
          </section>

          {/* ABOUT MODULE */}
          <section id="about" className="about-section">
            <div className="about-container">
              <div className="about-text">
                <span className="section-tag">ስለ ክሊኒካችን (About Us)</span>
                <h3>እጅግ ዘመናዊ የህክምና መሣሪያዎችና የክህሎት ጥምረት <br/> <span style={{fontSize: '1.2rem', color: '#475569'}}>Advanced Medical Equipment meets Expert Skill</span></h3>
                <p>ዶ/ር ጌታነህ የጥርስ ልዩ ህክምና ክሊኒክ ለረጅም ዓመታት ጥራት ያለውና አስተማማኝ የአፍና ጥርስ ህክምና አገልግሎት ሲሰጥ የቆየ ግንባር ቀደም ተቋም ነው። እያንዳንዱ ህክምና የሚሰጠው በዘመናዊ ቴክኖሎጂ እና በከፍተኛ ባለሙያዎች ነው።</p>
                <p style={{ marginTop: '10px', color: '#475569' }}><i>Dr. Getaneh Specialty Dental Clinic is a leading institution that has been providing high-quality and reliable oral and dental care for many years. Every treatment is delivered using modern technology and by highly skilled professionals.</i></p>
                <div className="about-mini-grids">
                  <div className="mini-box"><strong>99%</strong><p>የታካሚዎች እርካታ <br/> (Patient Satisfaction)</p></div>
                  <div className="mini-box"><strong>24/7</strong><p>ፈጣን ቀጠሮ <br/> (Quick Booking)</p></div>
                </div>
              </div>
              <div className="about-graphic-wrapper">
                <img src={dentalScanImg} alt="Dental Tech" className="about-real-image" />
              </div>
            </div>
          </section>

          {/* SERVICES MODULE */}
          <section id="services" className="services-section" style={{ padding: '80px 5%' }}>
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
              <span className="section-tag">የምንሰጣቸው አገልግሎቶች (Our Services)</span>
              <h2>ልዩ የጥርስ ህክምና አገልግሎቶች</h2>
              <p style={{ color: '#64748b' }}>Comprehensive Premium Dental Care Services</p>
            </div>
            <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
              <div className="service-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Stethoscope size={32} color="#2563eb" style={{ marginBottom: '15px' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#1e3a8a' }}>አጠቃላይ ምርመራ (Checkups)</h3>
                <p style={{ color: '#475569', fontSize: '0.95rem' }}>የአፍና ጥርስ ጤና ሁኔታን በዲጂታል መሣሪያዎች በጥራት መመርመር እና ማማከር።</p>
              </div>
              <div className="service-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Sparkles size={32} color="#2563eb" style={{ marginBottom: '15px' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#1e3a8a' }}>የጥርስ ማጽዳት (Scaling)</h3>
                <p style={{ color: '#475569', fontSize: '0.95rem' }}>በተራቀቀ የአልትራሶኒክ መሣሪያ አማካኝነት የጥርስ ካልሲየምና ቆሻሻዎችን ማስወገድ።</p>
              </div>
              <div className="service-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <HeartPulse size={32} color="#2563eb" style={{ marginBottom: '15px' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#1e3a8a' }}>የነርቭ ህክምና (Root Canal)</h3>
                <p style={{ color: '#475569', fontSize: '0.95rem' }}>የተጎዱ ወይም ህመም ያላቸውን ጥርሶች ነርቭ በማከም ጥርስ እንዳይነቀል ማዳን።</p>
              </div>
            </div>
          </section>

          {/* WHY CHOOSE US MODULE */}
          <section id="why-us" className="why-choose-us-section">
            <div className="section-header">
              <h2>ለምን እኛን ይመርጣሉ?</h2>
              <p className="section-subtitle-en">Why Choose Us? / Why Patients Trust Our Specialty Clinic</p>
            </div>
            
            <div className="features-grid">
              <div className="feature-grid-card">
                <div className="feature-icon-box"><Stethoscope size={24} /></div>
                <h3>ከፍተኛ ባለሙያ ዶክተሮች</h3>
                <p>ህክምናዎች የሚሰጡት ሰፊ የክሊኒካዊ ልምድ ባላቸውና ፈቃድ በተሰጣቸው ስፔሻሊስቶች ነው ።</p>
                <span className="en-subtext">Treatments are strictly conducted by licensed, certified dental specialists with extensive clinical experience.</span>
              </div>
              <div className="feature-grid-card">
                <div className="feature-icon-box"><Sparkles size={24} /></div>
                <h3>ዘመናዊ ዲጂታል መሣሪያዎች</h3>
                <p>አነስተኛ ጨረር ባላቸው ዲጂታል የኤክስሬይ እና ኮምፒዩተራይዝድ መመርመሪያዎችን እንጠቀማለን።</p>
                <span className="en-subtext">We leverage ultra-low radiation digital X-rays and precise computerized diagnostics for accurate assessments.</span>
              </div>
              <div className="feature-grid-card">
                <div className="feature-icon-box"><HeartPulse size={24} /></div>
                <h3>ከህመም የጸዳ አሰራር</h3>
                <p>በህክምና ጊዜ ምቾትዎን ለመጠበቅ ዘመናዊ ማደንዘዣዎችንና የተሻሻሉ አሰራሮችን እንተገብራለን።</p>
                <span className="en-subtext">Modern localized anesthesia and advanced clinical techniques designed to maximize your absolute comfort.</span>
              </div>
              <div className="feature-grid-card">
                <div className="feature-icon-box"><ShieldCheck size={24} /></div>
                <h3>ታማኝና ፍጹም ንጽህና</h3>
                <p>የእርስዎን ደህንነት ለመጠበቅ አለምአቀፍ ደረጃቸውን የጠበቁ የማምከኛ (Sterilization) ቴክኖሎጂዎችን እንጠቀማለን።</p>
                <span className="en-subtext">We enforce hospital-grade autoclaving and strict infection control protocols for your absolute safety.</span>
              </div>
              <div className="feature-grid-card">
                <div className="feature-icon-box"><Clock size={24} /></div>
                <h3>አስቸኳይ የጥርስ ህክምና</h3>
                <p>ለድንገተኛ የጥርስ ህመም እና ከፍተኛ ስቃይ ፈጣን ምላሽ የሚሰጡ ባለሙያዎች ሁልጊዜ ዝግጁ ናቸው።</p>
                <span className="en-subtext">Prompt, reliable emergency dental interventions when you suffer from unexpected severe pain or injuries.</span>
              </div>
              <div className="feature-grid-card">
                <div className="feature-icon-box"><Award size={24} /></div>
                <h3>ግልጽና ተመጣጣኝ ዋጋ</h3>
                <p>ያለ ምንም ድብቅ ክፍያጥራቱን የጠበቀ ልዩ የጥርስ ህክምና በተመጣጣኝ ዋጋ እናቀርባለን።</p>
                <span className="en-subtext">Premium specialty dental treatments delivered with transparent pricing, honest counseling, and no hidden fees.</span>
              </div>
            </div>
          </section>

          {/* TEAM MODULE */}
          <section id="team" className="team-section" style={{ padding: '80px 5%' }}>
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
              <span className="section-tag">ባለሙያዎቻችን (Our Medical Team)</span>
              <h2>ከፍተኛ ክሊኒካዊ ልምድ ያላቸው ስፔሻሊስቶች</h2>
              <p style={{ color: '#64748b' }}>Meet Our Elite Licensed Dental Doctors</p>
            </div>
            <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
              <div className="team-card" style={{ textAlign: 'center', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <img src={drGetanehImg} alt="Dr. Getaneh" style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '3px solid #2563eb' }} />
                <h3 style={{ color: '#1e3a8a', margin: '5px 0' }}>ዶ/ር ጌታነህ ታደሰ</h3>
                <p style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>ከፍተኛ የጥርስ ቀዶ ጥገና ስፔሻሊስት</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '5px' }}>Senior Dental Surgeon & Clinic Founder</p>
              </div>
              <div className="team-card" style={{ textAlign: 'center', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <img src={drAbelImg} alt="Dr. Abel" style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '3px solid #2563eb' }} />
                <h3 style={{ color: '#1e3a8a', margin: '5px 0' }}>ዶ/ር አቤል ተስፋዬ</h3>
                <p style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>የጥርስ ነርቭ ህክምና ስፔሻሊስት</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '5px' }}>Endodontics Specialist</p>
              </div>
              <div className="team-card" style={{ textAlign: 'center', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <img src={drMahletImg} alt="Dr. Mahlet" style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '3px solid #2563eb' }} />
                <h3 style={{ color: '#1e3a8a', margin: '5px 0' }}>ዶ/ር ማህሌት በቀለ</h3>
                <p style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>የህጻናት ጥርስ ህክምና ባለሙያ</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '5px' }}>Pediatric Dentist Specialist</p>
              </div>
            </div>
          </section>
          
          {/* GALLERY MODULE */}
          <section id="gallery" className="gallery-section" style={{ padding: '80px 5%' }}>
            <div className="section-header">
              <h2><ImageIcon size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px'}}/> የክሊኒካችን ገጽታ (Clinic Gallery)</h2>
              <p>ዘመናዊ የህክምና መስጫ አካባቢያችን / Our Modern Facility & Patient Care Environment</p>
            </div>
            
            <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <img src={modernReception} alt="Clinic Interior" style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '15px', backgroundColor: 'white', textAlign: 'center', fontWeight: 'bold' }}>ዘመናዊ መስተንግዶ (Modern Reception)</div>
              </div>
              <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <img src={dentalScanImg} alt="Dental Tech" style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '15px', backgroundColor: 'white', textAlign: 'center', fontWeight: 'bold' }}>ምርመራ ክፍሎች (Digital Diagnostic Rooms)</div>
              </div>
              <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <img src={sergery} alt="Surgery Room" style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '15px', backgroundColor: 'white', textAlign: 'center', fontWeight: 'bold' }}>ቀዶ ጥገና ክፍል (Surgery Room)</div>
              </div>
              <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '315px' }}>
                <Sparkles size={48} color="#94a3b8" style={{ marginBottom: '15px' }} />
                <h3 style={{ color: '#475569', margin: '0 0 5px 0' }}>ተጨማሪ ፎቶዎች በቅርቡ ይካተታሉ</h3>
                <p style={{ color: '#64748b', margin: 0 }}>More Photos Coming Soon...</p>
              </div>
            </div> 
          </section>

          {/* HEALTH TIPS MODULE */}
          <section id="tips" className="health-tips-section" style={{ padding: '80px 5%', backgroundColor: '#eff6ff' }}>
            <div className="section-header">
              <h2><BookOpen size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px'}}/> የጥርስ ጤና ምክሮች (Health Tips)</h2>
              <p>ጠቃሚ የጥርስ እንክብካቤ ጽሑፎች / Educational Dental Health Articles & Tips</p>
            </div>
            <div className="services-grid">
              <div className="service-card">
                <Lightbulb size={24} color="#f59e0b" style={{ marginBottom: '15px' }} />
                <h3>ትክክለኛ አቦራረሽ (Proper Brushing)</h3>
                <p>ጥርስዎን በቀን ቢያንስ ሁለት ጊዜ፣ ለሁለት ደቂቃዎች ለስላሳ ብሩሽ በመጠቀም በክብ ቅርጽ ይቦርሹ። <br/> <i>Brush your teeth at least twice a day for two minutes using a soft-bristled brush in circular motions.</i></p>
              </div>
              <div className="service-card">
                <Lightbulb size={24} color="#f59e0b" style={{ marginBottom: '15px' }} />
                <h3>የጥርስ ክር አጠቃቀም (Daily Flossing)</h3>
                <p>ብሩሽ ሊደርስባቸው የማይችሉ ክፍተቶችን ለማጽዳት በቀን አንዴ የጥርስ ክር መጠቀም መቦርቦርን ይከላከላል። <br/> <i>Floss daily to clean tight spaces between your teeth that a normal toothbrush cannot reach.</i></p>
              </div>
              <div className="service-card">
                <Lightbulb size={24} color="#f59e0b" style={{ marginBottom: '15px' }} />
                <h3>የምግብ ልማድ (Dietary Habits)</h3>
                <p>ከረሜላ እና አሲዳማ የሆኑ ምግቦችን ይቀንሱ። ከተመገቡ በኋላ ሁልጊዜ ውሃ መጉመጥመጥን አይርሱ። <br/> <i>Reduce sugary and highly acidic foods. Always remember to rinse your mouth with water after eating.</i></p>
              </div>
            </div>
          </section>

          {/* PRICING GRID MODULE */}
          <section id="pricing" className="pricing-section">
            <div className="section-header">
              <h2>ግልጽ የህክምና ዋጋ ዝርዝር (Pricing Guide)</h2>
              <p>ግልጽ እና ተመጣጣኝ ዋጋዎች / Transparent & Affordable Pricing</p>
            </div>
            <div className="pricing-grid">
              <div className="pricing-card">
                <span className="pricing-tag">መሰረታዊ (Basic)</span>
                <h3>አጠቃላይ ምርመራ <br/> (General Checkup)</h3>
                <div className="price-amount">ዋጋ ከ <span>ቁርጥ (Fixed)</span></div>
                <div className="price-feature-item">✓ የዶክተር ማማከር (Consultation)</div>
                <div className="price-feature-item">✓ የህክምና እቅድ (Treatment Plan)</div>
                <div className="price-feature-item">✓ የጤና ግምገማ (Health Assessment)</div>
              </div>
              <div className="pricing-card highlighted-price">
                <span className="pricing-tag popular">ተመራጭ (Popular)</span>
                <h3>የጥርስ ማጽዳት <br/> (Teeth Scaling)</h3>
                <div className="price-amount">ተመጣጣኝ (Affordable)</div>
                <div className="price-feature-item">✓ ሙሉ አፍ ማጽዳት (Full Cleaning)</div>
                <div className="price-feature-item">✓ ማውለብለብ (Polishing)</div>
                <div className="price-feature-item">✓ ድድ መከላከያ (Gum Care)</div>
              </div>
              <div className="pricing-card">
                <span className="pricing-tag">ልዩ ህክምና (Specialty)</span>
                <h3>የነርቭ ህክምና <br/> (Root Canal)</h3>
                <div className="price-amount">በጥራት (High Quality)</div>
                <div className="price-feature-item">✓ ከህመም ነፃ (Pain-Free)</div>
                <div className="price-feature-item">✓ ዲጂታል ኤክስሬይ (Digital X-ray)</div>
                <div className="price-feature-item">✓ ቋሚ መሙላት (Permanent Filling)</div>
              </div>
            </div>
          </section>

          {/* FAQ MODULE */}
          <section id="faq" className="faq-section" style={{ padding: '80px 5%' }}>
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
              <HelpCircle size={32} color="#2563eb" style={{ display: 'inline-block', marginBottom: '10px' }} />
              <h2>ተደጋግመው የሚነሱ ጥያቄዎች (FAQs)</h2>
              <p>በብዛት ለሚነሱ ጥያቄዎች የተሰጡ ምላሾች / Frequently Asked Questions</p>
            </div>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h4 style={{ color: '#1e3a8a', marginBottom: '8px' }}>ጥያቄ፦ ቀጠሮ ለመያዝ መክፈል ይኖርብኛል?</h4>
                <p style={{ color: '#475569' }}>መልስ፦ አይደለም፤ በመስመር ላይ ቀጠሮ መያዝ ፍጹም ነፃ ነው። ህክምና ካገኙ በኋላ በክሊኒኩ ይከፍላሉ። <br/><i>No, online booking is completely free. You will pay at the clinic after receiving treatment.</i></p>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h4 style={{ color: '#1e3a8a', marginBottom: '8px' }}>ጥያቄ፦ የኤክስሬይ ወይም የህክምና ፎቶ ማያያዝ ግዴታ ነው?</h4>
                <p style={{ color: '#475569' }}>መልስ፦ አይደለም፤ ነገር ግን ቀደም ሲል የተነሱ የጥርስ ፎቶዎች ካሉዎት ማያያዝዎ ዶክተሮች አስቀድመው ሁኔታዎን እንዲረዱ ይረዳቸዋል። <br/><i>No, it's optional. But uploading past scans helps doctors understand your case beforehand.</i></p>
              </div>
            </div>
          </section>

          {/* APPOINTMENT ONLINE BOOKING MODULE */}
          <section id="book-now" className="booking-section">
            <div className="booking-container">
              <div className="booking-info-panel">
                <h2>ቀጠሮዎን በቀላሉ በመስመር ላይ ይያዙ <br/><span style={{fontSize: '1.5rem', opacity: '0.9'}}>Book Your Appointment Online</span></h2>
                <p>ይህንን ፎርም በመሙላት ለምርመራ ፈጣን ቀጠሮ ያግኙ። <br/> <i>Fill out our secure digital intake form to claim an immediate evaluation slot at our 5 Kilo branch.</i></p>
                <div className="contact-details">
                  <div className="contact-item">
                    <Phone size={20} />
                    <div><h4>ለጥያቄዎች ይደውሉ (Call Us)</h4><p>+251 930 64 14 83</p></div>
                  </div>
                  <div className="contact-item">
                    <MapPin size={20} />
                    <div><h4>አድራሻችን (Location)</h4><p>5 ኪሎ ፣ አዲስ አበባ (5 Kilo, Addis Ababa)</p></div>
                  </div>
                </div>
              </div>

              <div className="booking-form-wrapper">
                {bookingResult ? (
                  <div className="booking-success-box">
                    <CheckCircle size={56} className="color-success" />
                    <h3>🎉 ቀጠሮዎ በተሳካ ሁኔታ ተይዟል! <br/> (Successfully Booked!)</h3>
                    <div className="ticket-display">
                      <p>የቀጠሮ መለያ ቁጥር (Ticket ID)</p>
                      <strong>{bookingResult.ticketId || bookingResult.ticket_id || "DG-SUCCESS"}</strong>
                    </div>
                    <p className="note">እባክዎ ይህንን የቲኬት ቁጥር ስክሪንሾት በማድረግ ክሊኒኩ ሲመጡ ያሳዩ። <br/> <i>Please screenshot this Ticket ID and show it at the reception when you arrive.</i></p>
                    <button onClick={handleResetForm} className="btn btn-primary w-full">ሌላ ቀጠሮ ይያዙ (Book Another)</button>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="professional-form">
                    <h3 className="form-title">የታካሚ መረጃ መሙያ ቅጽ (Patient Intake Form)</h3>
                    
                    <div className="form-group">
                      <label>ሙሉ ስም (Full Name) <span>*</span></label>
                      <input type="text" name="fullName" value={formData.fullName} required onChange={handleFormChange} />
                    </div>

                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>ዕድሜ (Age) <span>*</span></label>
                        <input type="number" name="age" value={formData.age} required onChange={handleFormChange} />
                      </div>
                      <div className="form-group flex-1">
                        <label>ጾታ (Gender) <span>*</span></label>
                        <select name="gender" value={formData.gender} onChange={handleFormChange}>
                          <option value="Male">ወንድ (Male)</option>
                          <option value="Female">ሴት (Female)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>ስልክ ቁጥር (Phone) <span>*</span></label>
                        <input type="text" name="phoneNumber" value={formData.phoneNumber} required onChange={handleFormChange} />
                      </div>
                      <div className="form-group flex-1">
                        <label>የህክምና ምክንያት (Reason)</label>
                        <select name="reason" value={formData.reason} onChange={handleFormChange}>
                          <option value="General Checkup">ምርመራ (General Checkup)</option>
                          <option value="Toothache">የጥርስ ህመም (Toothache)</option>
                          <option value="Cleaning">ማጽዳት (Cleaning)</option>
                          <option value="Extraction">ማስነቀል (Extraction)</option>
                          <option value="Filling">መሙላት (Filling)</option>
                          <option value="Root Canal">የነርቭ ህክምና (Root Canal)</option>
                          <option value="Braces">ጥርስ ማስተካከል (Orthodontics)</option>
                          <option value="Whitening">የጥርስ ማንጣት (Whitening)</option>
                          <option value="Pediatric">የህፃናት ህክምና (Pediatric)</option>
                          <option value="Implant">የጥርስ ተከላ (Implant)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>ቀጠሮ ቀን (Date) <span>*</span></label>
                        <input type="date" name="appointmentDate" value={formData.appointmentDate} required onChange={handleFormChange} />
                      </div>
                    </div>

                    {/* ⏰ TIME-SLOT INTUITION MATRIX CONTAINER */}
                    {formData.appointmentDate && (
                      <div className="time-slot-selection-wrapper" style={{ marginTop: '15px', marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', color: '#334155', marginBottom: '10px' }}>
                          የቀጠሮ ሰዓት ይምረጡ (Select Time Slot) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                          {[
                            { value: '08:30', label: '2:30 ጠዋት (08:30 AM)' },
                            { value: '10:00', label: '4:00 ጠዋት (10:00 AM)' },
                            { value: '11:30', label: '5:30 ጠዋት (11:30 AM)' },
                            { value: '14:00', label: '8:00 ከሰዓት (02:00 PM)' },
                            { value: '15:30', label: '9:30 ከሰዓት (03:30 PM)' },
                            { value: '17:00', label: '11:00 ምሽት (05:00 PM)' },
                          ].map((slot) => {
                            const isBooked = typeof bookedSlots !== 'undefined' && bookedSlots && bookedSlots.includes(slot.value);
                            const isSelected = formData.appointmentTime === slot.value;

                            return (
                              <button 
                                key={slot.value} 
                                type="button" 
                                disabled={isBooked} 
                                onClick={() => setFormData({ ...formData, appointmentTime: slot.value })} 
                                style={{ 
                                  width: '100%', 
                                  padding: '12px 15px', 
                                  borderRadius: '8px', 
                                  border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1', 
                                  textAlign: 'left', 
                                  fontWeight: '600', 
                                  fontSize: '0.9rem', 
                                  cursor: isBooked ? 'not-allowed' : 'pointer', 
                                  backgroundColor: isBooked ? '#f1f5f9' : isSelected ? '#eff6ff' : 'white', 
                                  color: isBooked ? '#94a3b8' : isSelected ? '#2563eb' : '#334155', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  transition: 'all 0.2s ease' 
                                }}
                              >
                                <span>{slot.label}</span>
                                {isBooked ? (
                                  <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>የተያዘ ❌</span>
                                ) : isSelected ? (
                                  <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 'bold' }}>✓</span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="file-upload-zone" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer', marginTop: '15px' }}>
                      <label><Upload size={16} /> {mediaFile ? mediaFile.name : "ኤክስሬይ ወይም ፎቶ ያያይዙ (Upload X-Ray / Photo)"}</label>
                      <input type="file" ref={fileInputRef} accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                    </div>

                    <button type="submit" disabled={bookingLoading} className="submit-booking-btn" style={{ width: '100%', padding: '14px', fontWeight: 'bold', fontSize: '1rem', border: 'none', borderRadius: '6px', cursor: bookingLoading ? 'not-allowed' : 'pointer', backgroundColor: '#2563eb', color: 'white', marginTop: '20px' }}>
                      {bookingLoading ? 'በማስኬድ ላይ... (Processing...)' : 'ቀጠሮውን አረጋግጥ (Confirm Appointment)'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* DUAL LANGUAGE CORPORATE FOOTER */}
          <footer id="contact" className="public-footer">
            <div className="footer-grid-container">
              
              {/* BRAND IDENTITY */}
              <div className="footer-brand-column">
                <div className="footer-brand-title">
                  <span className="footer-emoji">🦷</span>
                  <div>
                    <h2>ዶ/ር ጌታነህ ክሊኒክ</h2>
                    <h3>Dr. Getaneh Clinic</h3>
                  </div>
                </div>
                <p className="brand-description-am">የጥርስዎን ጤንነት ከዘመናዊ የዲጂታል ቴክኖሎጂዎችና ከከፍተኛ ባለሙያ ክህሎት ጋር በማጣመር እንከባከባለን።</p>
                <p className="footer-en-text">We care for your dental health by combining modern digital technologies with expert professional skills.</p>
                
                {/* SOCIAL MEDIA CHANNELS */}
                <div className="footer-social-wrapper">
                  <a href="https://t.me/Wasihun16" target="_blank" rel="noreferrer" className="social-icon-link telegram" title="Telegram">
                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" alt="TG" className="social-png" />
                  </a>
                  <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="social-icon-link tiktok" title="TikTok">
                    <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TT" className="social-png" />
                  </a>
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon-link facebook" title="Facebook">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="FB" className="social-png" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon-link instagram" title="Instagram">
                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="IG" className="social-png" />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-icon-link youtube" title="YouTube">
                    <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YT" className="social-png" />
                  </a>
                </div>
              </div>

              {/* QUICK LINKS */}
              <div className="footer-links-column">
                <h4>ማያያዣዎች (Quick Links)</h4>
                <div className="vertical-link-stack">
                  <a href="#about" onClick={() => { navigateToSection("about"); setDropdownOpen(false); }}>ስለ እኛ (About Us)</a>
                  <a href="#services" onClick={() => { navigateToSection("services"); setDropdownOpen(false); }}>አገልግሎቶች (Services)</a>
                  <a href="#team" onClick={() => { navigateToSection("team"); setDropdownOpen(false); }}>ባለሙያዎች (Our Team)</a>
                  <a href="#gallery" onClick={() => { navigateToSection("gallery"); setDropdownOpen(false); }}>ገጽታ (Gallery)</a>
                  <a href="#tips" onClick={() => { navigateToSection("tips"); setDropdownOpen(false); }}>ምክሮችና ጥያቄዎች (Tips & FAQ)</a>
                </div>
              </div>

              {/* WORKING HOURS */}
              <div className="footer-hours-column">
                <h4>የስራ ሰዓታት (Working Hours)</h4>
                <p>📆 ሰኞ - አርብ (Mon - Fri):<br/> <span className="time-highlight">2:00 LT - 11:00 LT</span> <br/>(8:00 AM - 5:00 PM)</p>
                <p>📆 ቅዳሜ (Saturday):<br/> <span className="time-highlight">2:00 LT - 6:00 LT</span> <br/>(8:00 AM - 12:00 PM)</p>
                <p>🛑 እሁድ (Sunday):<br/> <span className="closed-highlight">ዝግ ነው (Closed)</span></p>
              </div>

              {/* CONTACT INFO */}
              <div className="footer-contact-column">
                <h4>አድራሻ (Contact Info)</h4>
                <p>📍 5 ኪሎ ፣ አዲስ አበባ <br/> (5 Kilo, Addis Ababa)</p>
                <p>📞 +251 930 64 14 83</p>
                <a 
                  href="https://t.me/DrGetanehDentalBot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',    
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    backgroundColor: '#22A5E2', 
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '30px',      
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    boxShadow: '4px 5px 0px #1A5C8A, 0px 4px 10px rgba(0,0,0,0.15)',
                    transition: 'all 0.15s ease-in-out',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translate(2px, 2px)';
                    e.currentTarget.style.boxShadow = '2px 3px 0px #1A5C8A, 0px 2px 5px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translate(0, 0)';
                    e.currentTarget.style.boxShadow = '4px 5px 0px #1A5C8A, 0px 4px 10px rgba(0,0,0,0.15)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  <span>በቴሌግራም ቦት ያግኙን (Contact us on Telegram Bot)</span>
                </a>
              </div>

            </div> 

            <div className="footer-bottom-bar">
              <p>© {new Date().getFullYear()} Dr. Getaneh Specialty Dental Clinic. All Rights Reserved.</p>
            </div>
          </footer>
        </div>
      )}

      {/* ==========================================================================
         📊 VIEW 3: ADMIN / RECEPTIONIST SECURED CONTROL DASHBOARD
         ========================================================================== */}
      {view === "dashboard" && (
        <div className="admin-dashboard-wrapper animate-fade-in" style={{ padding: '40px 5%' }}>
          
          <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
            <div>
              <h2 style={{ color: '#1e3a8a', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard /> የቁጥጥር ሰሌዳ (Control Dashboard)
              </h2>
              <p style={{ color: '#64748b' }}>የክሊኒኩ ታካሚዎች የቀጠሮ መረጃዎች ማስተዳደሪያ</p>
            </div>
            <button onClick={exportToCSV} className="action-btn csv-download" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Download size={16} /> ኤክስፖርት (Export CSV)
            </button>
          </header>

          <section className="metrics-container">
            <div className="metric-card blue">
              <div className="card-info"><h3>{patients.length}</h3><p>ጠቅላላ ታካሚዎች (Total Patients)</p></div>
              <Users size={32} className="card-icon" />
            </div>
            <div className="metric-card orange">
              <div className="card-info"><h3>{patients.filter(p => p.reminder_sent === 0).length}</h3><p>በመጠባበቅ ላይ (Pending Appointments)</p></div>
              <Clock size={32} className="card-icon" />
            </div>
            <div className="metric-card green">
              <div className="card-info"><h3>{patients.filter(p => p.reminder_sent === 1).length}</h3><p>ማስታወሻ የተላከላቸው (Reminded)</p></div>
              <CheckCircle size={32} className="card-icon" />
            </div>
          </section>

          {selectedPatientIds.length > 0 && (
            <div className="bulk-actions-context-banner animate-fade-in">
              <div className="banner-left">
                <CheckSquare size={18} className="banner-icon" />
                <span>📌 <strong>{selectedPatientIds.length}</strong> መረጃዎች ተመርጠዋል (Selected)</span>
              </div>
              <button onClick={handleBulkDelete} className="bulk-delete-execute-btn">
                <Trash2 size={15} /> የተመረጡትን ሰርዝ (Delete Selected)
              </button>
            </div>
          )}

          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="በስም፣ በስልክ ወይም በመለያ ይፈልጉ... (Search by name, phone, ticket...)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={fetchPatients} className="action-btn refresh">
              <RefreshCw size={16} /> ዳታ አመሳስል (Sync)
            </button>
          </div>

          <main className="table-container">
            {loading && <div className="status-indicator">🔄 መረጃ በመፈለግ ላይ... (Loading...)</div>}
            {error && <div className="status-indicator error">❌ ስህተት (Error): {error}</div>}

            {!loading && !error && (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th className="checkbox-column-width">
                      <button 
                        type="button" 
                        onClick={handleSelectAllRows} 
                        className="custom-checkbox-header-btn"
                        title="ሁሉንም ምረጥ (Select All)"
                      >
                        {selectedPatientIds.length === filteredPatients.length && filteredPatients.length > 0 ? (
                          <CheckSquare size={18} className="checkbox-icon checked" />
                        ) : (
                          <Square size={18} className="checkbox-icon" />
                        )}
                      </button>
                    </th>
                    <th>መለያ (Ticket ID)</th>
                    <th>ሙሉ ስም (Full Name)</th>
                    <th>ዕድሜ / ጾታ (Age/Sex)</th>
                    <th>ስልክ ቁጥር (Phone)</th>
                    <th>ምክንያት (Reason)</th>
                    <th>የቀጠሮ ጊዜ (Schedule)</th>
                    <th>ፋይል (Media)</th>
                    <th>ድርጊት (Action)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr><td colSpan="9" className="empty-row">ምንም የገባ የታካሚ መረጃ አልተገኘም / No Patient Records Found</td></tr>
                  ) : (
                    filteredPatients.map((patient) => {
                      const isChecked = selectedPatientIds.includes(patient.id);
                      const finalFileUrl = renderMediaLink(patient.media_file_id);
                      return (
                        <tr key={patient.id} className={isChecked ? 'selected-row-highlight' : ''}>
                          <td>
                            <button type="button" onClick={() => handleSelectRow(patient.id)} className="custom-checkbox-row-btn">
                              {isChecked ? <CheckSquare size={18} className="checkbox-icon checked" /> : <Square size={18} className="checkbox-icon" />}
                            </button>
                          </td>
                          <td><span className="ticket-badge">{patient.ticket_id || `DG-${patient.id}`}</span></td>
                          <td className="patient-name-cell"><User size={13} className="inline-icon" /> {patient.full_name}</td>
                          <td>{patient.age ? `${patient.age} (${patient.gender})` : '-'}</td>
                          <td>{patient.phone_number || 'No Phone'}</td>
                          <td><span className="reason-text">{patient.reason || 'General Checkup'}</span></td>
                          <td>
                            <div className="time-badge"><Calendar size={12} /> <span>{patient.appointment_date}</span></div>
                            <div className="time-badge secondary"><Clock size={12} /> <span>{patient.appointment_time || 'Not Fixed'}</span></div>
                          </td>
                          <td>
                            {finalFileUrl ? (
                              <a href={finalFileUrl} target="_blank" rel="noreferrer" className="view-media-btn">📁 ክፈት (Open) <ExternalLink size={10} /></a>
                            ) : (
                              <span className="no-media">የለም (None)</span>
                            )}
                          </td>
                          <td>
                            <button 
                              onClick={() => deletePatientRecord(patient.id)}
                              className="admin-delete-action-btn"
                              style={{ opacity: userRole === 'Admin' ? 1 : 0.4, cursor: userRole === 'Admin' ? 'pointer' : 'not-allowed' }}
                              title={userRole !== 'Admin' ? "የአስተዳዳሪ መብት ብቻ ያስፈልጋል (Admin Access Required)" : "Delete Record"}
                            >
                              <Trash2 size={13} /> ሰርዝ (Delete)
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </main>
        </div>
      )}

      {/* 🚀 SCROLL TO TOP & FLOATING ACTIONS */}
      {showScrollTop && (
        <button className="scroll-to-top-btn" onClick={scrollToTop} style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#2563eb', border: 'none', borderRadius: '50%', padding: '12px', cursor: 'pointer', zIndex: 999 }}>
          <ArrowUp size={20} color="white" />
        </button>
      )}

      <a 
        href="https://t.me/DrGetanehDentalBot" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',    
          alignItems: 'center',
          justifyContent: 'center',
          width: '60px',
          height: '60px',
          backgroundColor: '#22A5E2', 
          borderRadius: '50%',
          color: 'white',
          textDecoration: 'none',
          boxShadow: '4px 5px 0px #1A5C8A, 0px 4px 10px rgba(0,0,0,0.2)',
          transition: 'all 0.15s ease-in-out',
          cursor: 'pointer',
          position: 'fixed',
          bottom: '20px',
          right: '90px',
          zIndex: 999
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translate(2px, 2px)';
          e.currentTarget.style.boxShadow = '2px 3px 0px #1A5C8A, 0px 2px 5px rgba(0,0,0,0.2)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)';
          e.currentTarget.style.boxShadow = '4px 5px 0px #1A5C8A, 0px 4px 10px rgba(0,0,0,0.2)';
        }}
      >
        <svg 
          width="26" 
          height="26" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ transform: 'translate(-1px, 1px)' }}
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </a>

    </div>
  );
}

export default App;