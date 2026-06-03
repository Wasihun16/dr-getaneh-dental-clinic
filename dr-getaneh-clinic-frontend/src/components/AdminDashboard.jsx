import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Calendar, Phone, CheckCircle, Clock, Search, RefreshCw, 
  User, PlusCircle, LayoutDashboard, ShieldCheck, MapPin, Award, 
  ChevronRight, Upload, ExternalLink, Trash2, Download, Square, CheckSquare,
  HeartPulse, Star, Stethoscope, Sparkles, HelpCircle, ArrowUp, 
  Image as ImageIcon, UsersRound, BookOpen, Baby, Syringe, Lightbulb, LogOut, KeyRound
} from 'lucide-react';
import './App.css';

// 📸 IMPORT IMAGES DIRECTLY FROM YOUR ASSETS FOLDER
import clinicBuildingImg from './assets/clinic-building.jpg';
import dentalScanImg from './assets/dental-scan.jpg';
import clinicLogoexport from './assets/logo.jpg';

// Dynamic Environment Switch
const BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://clinic-backend-qi86.onrender.com";

function App() {
  const [view, setView] = useState("public"); // Core Routing Switcher: "public", "login-portal", or "dashboard"
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [activeTab, setActiveTab] = useState("home");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedPatientIds, setSelectedPatientIds] = useState([]);
  
  // 🌟 Dropdown display toggle matching click-driven navigation rules
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 👥 ROLE-BASED ACCESS CONTROL (RBAC) AUTONOMOUS STATE
  const [userRole, setUserRole] = useState('Receptionist'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState("Staff_Member");

  // Temporary transient input fields holding states for portal logins
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null); // Reference point for closing when clicking outside

  const [formData, setFormData] = useState({
    fullName: '', 
    age: '', 
    gender: 'Male', 
    country: 'Ethiopia',
    phoneNumber: '', 
    reason: 'General Checkup', 
    appointmentDate: '', 
    appointmentTime: ''
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

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
    
    // Global Event Listener to close dropdown if user clicks elsewhere on the page
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

  /**
   * 🔒 PRIVILEGED CONTROL MECHANISM: Single Record Wipe
   */
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

  /**
   * 🔒 PRIVILEGED CONTROL MECHANISM: Bulk Records Delete
   */
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

  // 🔐 BACKEND STAFF SIGN IN ROUTING OPERATION MATRIX
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCredentials)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setUserRole(data.user.role); 
        setCurrentUser(data.user.username);
        setView("dashboard");
        setLoginCredentials({ username: '', password: '' });
      } else {
        setAuthError(data.message || "የተሳሳተ መለያ ስም ወይም የይለፍ ቃል! / Invalid credentials.");
      }
    } catch (err) {
      setAuthError("ከማዕከላዊ ሰርቨር ጋር መገናኘት አልተቻለም (Auth server unreachable).");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('Receptionist');
    setCurrentUser("Staff_Member");
    setView("public");
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

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setMediaFile(e.target.files[0]);

  const handleResetForm = () => {
    setFormData({
      fullName: '', age: '', gender: 'Male', country: 'Ethiopia',
      phoneNumber: '', reason: 'General Checkup', appointmentDate: '', appointmentTime: ''
    });
    setMediaFile(null);
    setBookingResult(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
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
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 80);
  };

  return (
    <div className="app-container">
      
      {/* 🔴 EMERGENCY TOP BAR */}
      {view === "public" && (
        <div className="emergency-top-bar">
          <div className="top-bar-content">
            <span className="pulse-dot"></span>
            <p><strong>አስቸኳይ የጥርስ ህክምና / 24/7 Dental Emergency:</strong> ይደውሉልን (Call Us) +251 930 64 14 83</p>
          </div>
        </div>
      )}

      {/* ⚙️ IDENTITY framework MONITOR */}
      <div className="system-test-bar">
        <span className="test-engine-label">⚙️ Identity Framework Environment Monitor:</span>
        <div className="test-actions-group">
          <label htmlFor="role-select" className="visually-hidden">Test Active Actor Role Context</label>
          <select 
            id="role-select"
            value={userRole} 
            onChange={(e) => setUserRole(e.target.value)}
            className="test-role-select"
          >
            <option value="Receptionist">Actor context: Receptionist (Restricted Actions)</option>
            <option value="Admin">Actor context: Admin / Dentist (Full Clearance)</option>
          </select>
          <span className="current-view-pill">Active View Context: <strong>{view.toUpperCase()}</strong></span>
        </div>
      </div>

      {/* 🏙️ PRIMARY STRUCTURAL NAVBAR */}
      <nav className="main-navbar">
        <div className="nav-brand" onClick={() => { navigateToSection("home"); setDropdownOpen(false); }}>
          <img src={clinicLogoexport} alt="Dr. Getaneh Dental Clinic Logo" className="brand-logo-img" />
          <div>
            <h1>ዶ/ር ጌታነህ የጥርስ ልዩ ህክምና</h1>
            <p>Dr. Getaneh Specialty Dental Clinic</p>
          </div>
        </div>
        <div className="nav-links">
          <a href="#home" onClick={(e) => { e.preventDefault(); navigateToSection("home"); setDropdownOpen(false); }} className={activeTab === "home" ? "active-nav-item" : ""}>ዋና ገጽ (Home)</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); navigateToSection("about"); setDropdownOpen(false); }} className={activeTab === "about" ? "active-nav-item" : ""}>ስለ እኛ (About)</a>
          <a href="#services" onClick={(e) => { e.preventDefault(); navigateToSection("services"); setDropdownOpen(false); }} className={activeTab === "services" ? "active-nav-item" : ""}>አገልግሎቶች (Services)</a>
          
          {/* ▾ FIXED CLICK-TRIGGERED DROPDOWN SYSTEM (NO HOVER FLICKER) ▾ */}
          <div 
            className="nav-dropdown-container"
            ref={dropdownRef}
            data-visible={dropdownOpen ? "true" : "false"}
          >
            <button 
              type="button"
              className={`dropdown-toggle-btn ${["team", "gallery", "tips", "pricing", "faq"].includes(activeTab) ? "active-nav-item" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              ተጨማሪ መረጃ (Explore) <span className="dropdown-chevron">▼</span>
            </button>
            <div className={`nav-dropdown-menu ${dropdownOpen ? "show" : ""}`}>
              <a href="#team" onClick={(e) => { e.preventDefault(); navigateToSection("team"); setDropdownOpen(false); }}>ባለሙያዎች (Team)</a>
              <a href="#gallery" onClick={(e) => { e.preventDefault(); navigateToSection("gallery"); setDropdownOpen(false); }}>ገጽታ (Gallery)</a>
              <a href="#tips" onClick={(e) => { e.preventDefault(); navigateToSection("tips"); setDropdownOpen(false); }}>ምክሮች (Tips)</a>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); navigateToSection("pricing"); setDropdownOpen(false); }}>ዋጋዎች (Pricing)</a>
              <a href="#faq" onClick={(e) => { e.preventDefault(); navigateToSection("faq"); setDropdownOpen(false); }}>ጥያቄዎች (FAQs)</a>
            </div>
          </div>

          <a href="#book-now" onClick={(e) => { e.preventDefault(); navigateToSection("book-now"); setDropdownOpen(false); }} className="highlight-link">ቀጠሮ ይያዙ (Book Now)</a>
          
          {isAuthenticated ? (
            <button className="admin-toggle-btn dashboard-link-highlight" onClick={() => { setView("dashboard"); setDropdownOpen(false); }}>
              <LayoutDashboard size={15} /> መቆጣጠሪያ ፓነል (Dashboard)
            </button>
          ) : (
            <button className={`admin-toggle-btn ${view === 'login-portal' ? 'active-nav-item' : ''}`} onClick={() => { setView("login-portal"); setDropdownOpen(false); }}>
              <KeyRound size={15} /> የሰራተኞች መግቢያ (Staff)
            </button>
          )}
        </div>
      </nav>

      {/* 🔐 STAFF LOGIN GATE PORTAL */}
      {view === "login-portal" && (
        <div className="login-portal-wrapper">
          <div className="login-card">
            <div className="login-header">
              <ShieldCheck className="auth-gateway-shield-icon" size={44} />
              <h3>የባለሙያ መግቢያ መድረክ</h3>
              <h4>Dr. Getaneh Staff Authentication Gate</h4>
            </div>
            
            {authError && <div className="auth-error-banner">{authError}</div>}
            
            <form onSubmit={handleLoginSubmit} className="auth-structural-form">
              <div className="form-input-group">
                <label htmlFor="login-username">መለያ ስም (Username)</label>
                <input 
                  id="login-username"
                  type="text" 
                  name="username" 
                  required 
                  value={loginCredentials.username}
                  onChange={(e) => setLoginCredentials({...loginCredentials, username: e.target.value})}
                  placeholder="e.g., wasihun_admin"
                />
              </div>
              
              <div className="form-input-group">
                <label htmlFor="login-password">የይለፍ ቃል (Password)</label>
                <input 
                  id="login-password"
                  type="password" 
                  name="password" 
                  required 
                  value={loginCredentials.password}
                  onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              
              <button type="submit" className="login-submit-btn" disabled={authLoading}>
                {authLoading ? "በማረጋገጥ ላይ..." : "ግባ (Sign In)"}
              </button>
            </form>
            
            <button onClick={() => setView("public")} className="back-to-public-btn">
              ← ወደ ህዝባዊ ገጽ ተመለስ (Back to Homepage)
            </button>
          </div>
        </div>
      )}

      {/* 📊 INTERNAL WORKSPACE BADGE STRIP */}
      {view === "dashboard" && (
        <div className="dashboard-status-strip">
          <div className="user-context-badge">
            <User className="badge-icon" size={16} />
            <span>ንቁ ሰራተኛ (Active User): <strong>{currentUser}</strong></span>
            <span className={`role-tag ${userRole.toLowerCase()}`}>
              {userRole === 'Admin' ? '🛡️ Admin Access' : '📋 Receptionist Access'}
            </span>
          </div>
          
          <div className="dashboard-view-actions">
            <button onClick={() => setView("public")} className="nav-back-home-btn">
              ← ወደ ዋናው ድረ-ገጽ (Public Site)
            </button>
            <button onClick={handleLogout} className="logout-action-trigger">
              <LogOut size={14} /> ውጣ (Sign Out)
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🌟 VIEW 1: PATIENT WEBSITE PUBLIC UI */}
      {/* ======================================================== */}
      {view === "public" && (
        <div className="public-website animate-fade-in">
          
          {/* HERO SECTION */}
          <section id="home" className="hero-section">
            <div className="hero-content">
              <span className="badge">📍 5 ኪሎ ቅርንጫፍ (5 Kilo Branch)</span>
              <h2>ለእናንተ እና ለቤተሰባችሁ የሚሆን እምነት የሚጣልበት የጥርስ ህክምና!</h2>
              <h2 style={{ fontSize: '1.5rem', color: '#64748b', marginTop: '10px' }}>Trusted dental care for you and your family!</h2>
              <p>በተረጋገጡ ስፔሻሊስቶች እንክብካቤ ስር ዓለም አቀፍ ደረጃውን የጠበቀ ዲጂታል የጥርስ ህክምና ያግኙ። <br/> <i>Experience world-class digital dentistry under the care of certified specialists. Your radiant, healthy smile starts here.</i></p>
              
              <div className="hero-actions">
                <a href="#book-now" onClick={(e) => { e.preventDefault(); navigateToSection("book-now"); }} className="btn btn-primary">
                  አሁኑኑ ቀጠሮ ይያዙ (Book Now) <ChevronRight size={16} />
                </a>
                <a href="#services" onClick={(e) => { e.preventDefault(); navigateToSection("services"); }} className="btn btn-secondary">
                  አገልግሎቶቻችን (Our Services)
                </a>
              </div>
              
              <div className="hero-features">
                <div><ShieldCheck size={18} /> 100% የተረጋገጠ ህክምና (Certified Care)</div>
                <div><Award size={18} /> ዘመናዊ ቴክኖሎጂ (Modern Tech)</div>
              </div>
            </div>
            
            <div className="hero-image-wrapper">
              <img src={clinicBuildingImg} alt="Dr. Getaneh Clinic Building" className="hero-real-image" />
              <div className="experience-badge">
                <h3>12+</h3>
                <p>ዓመታት ልምድ<br/>(Years Exp)</p>
              </div>
            </div>
          </section>

          {/* ABOUT SECTION */}
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
                <img src={dentalScanImg} alt="Dental Scanner Technology" className="about-real-image" />
              </div>
            </div>
          </section>

          {/* WHY CHOOSE US SECTION */}
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
                <p>ያለ ምንም ድብቅ ክፍያ ጥራቱን የጠበቀ ልዩ የጥርስ ህክምና በተመጣጣኝ ዋጋ እናቀርባለን።</p>
                <span className="en-subtext">Premium specialty dental treatments delivered with transparent pricing, honest counseling, and no hidden fees.</span>
              </div>
            </div>
          </section>

          {/* SERVICES SECTION */}
          <section id="services" className="services-section">
            <div className="section-header">
              <h2>የምንሰጣቸው አገልግሎቶች (Our Services)</h2>
              <p>አጠቃላይ እና ልዩ የህክምና አገልግሎቶች / Comprehensive Specialty Clinical Care Solutions</p>
            </div>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">🦷</div>
                <h3>የጥርስ መሙላትና ማስነቀል <br/> (Fillings & Extractions)</h3>
                <p>ዘመናዊ የጥርስ መሙላት እና ከህመም ነጻ የሆነ የጥርስ ማስነቀል አገልግሎት። <br/> <i>Advanced cosmetic composite fillings and completely pain-free extractions.</i></p>
              </div>
              <div className="service-card">
                <div className="service-icon">✨</div>
                <h3>የጥርስ ማጽዳት <br/> (Teeth Cleaning)</h3>
                <p>ጥርሶን ከአልትራሶኒክ ማሽን በማጽዳት እድፍን ማስወገድ። <br/> <i>Complete prophylactic ultrasonic cleaning, specialized scaling, and deep stain removals.</i></p>
              </div>
              <div className="service-card">
                <div className="service-icon">🔬</div>
                <h3>ዲጂታል ኤክስሬይ <br/> (Digital X-Ray)</h3>
                <p>ከፍተኛ ጥራት ያለው ዲጂታል ኤክስሬይ ምርመራ። <br/> <i>Instant high-frequency digital radiographical tracking to safely map internal decay.</i></p>
              </div>
              <div className="service-card">
                <div className="service-icon">💎</div>
                <h3>ሰው ሰራሽ ጥርስ <br/> (Prosthesis & Crowns)</h3>
                <p>የጥርስ አክሊሎች፣ ድልድዮች እና ተነቃይ ሰው ሰራሽ ጥርሶች። <br/> <i>Premium fixed crowns, bridges, and removable partial/full dentures.</i></p>
              </div>
              <div className="service-card">
                <div className="service-icon">🌿</div>
                <h3>የነርቭ ህክምና <br/> (Root Canal)</h3>
                <p>የተጎዳን የጥርስ ነርቭ በማጽዳት ጥርስዎን እናድናለን። <br/> <i>Advanced endodontic root canal treatments to salvage infected teeth perfectly.</i></p>
              </div>
              <div className="service-card">
                <div className="service-icon">📏</div>
                <h3>የጥርስ ማስተካከል <br/> (Orthodontics / Braces)</h3>
                <p>የተጣመሙ ጥርሶችን በብሬስ እና ዘመናዊ አላይነሮች ማስተካከል። <br/> <i>Specialized treatment for crowded teeth utilizing modern fixed bracket braces.</i></p>
              </div>
              <div className="service-card">
                <div className="service-icon"><Sparkles size={28} /></div>
                <h3>የጥርስ ማንጣት <br/> (Teeth Whitening)</h3>
                <p>በሌዘር እና በኬሚካል ጥርስን በማንጣት ውብ ፈገግታን መጎናጸፍ። <br/> <i>Professional treatments to safely remove discolorations and brighten your smile.</i></p>
              </div>
              <div className="service-card">
                <div className="service-icon"><Baby size={28} /></div>
                <h3>የህፃናት ህክምና <br/> (Pediatric Dentistry)</h3>
                <p>ለህጻናት ልዩ ጥንቃቄ የተሞላበት፣ ፍርሃት አልባ የጥርስ እንክብካቤ። <br/> <i>Gentle, fear-free dental care dedicated exclusively to children.</i></p>
              </div>
              <div className="service-card">
                <div className="service-icon"><Syringe size={28} /></div>
                <h3>የጥርስ ተከላ <br/> (Dental Implants)</h3>
                <p>የጠፋን ጥርስ በቋሚ መንገድ በተፈጥሯዊ ሁኔታ መተካት። <br/> <i>Permanent surgical titanium root placements to perfectly replace missing teeth.</i></p>
              </div>
            </div>
          </section>

          {/* TEAM SECTION */}
          <section id="team" className="team-section" style={{ padding: '80px 5%', backgroundColor: '#f0f4f8' }}>
            <div className="section-header">
              <h2><UsersRound size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px'}}/> የህክምና ባለሙያዎቻችን (Our Team)</h2>
              <p>የእኛን የጥርስ ስፔሻሊስቶች ያግኙ / Meet Our Expert Dental Specialists</p>
            </div>
            <div className="services-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <div className="service-card" style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '30px', fontWeight: 'bold' }}>Dr. G</div>
                <h3>ዶ/ር ጌታነህ (Dr. Getaneh)</h3>
                <span style={{ color: '#2563eb', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>ዋና ስፔሻሊስት (Lead Specialist)</span>
                <p>በአፍ እና ጥርስ ቀዶ ጥገና፣ እንዲሁም አጠቃላይ የጥርስ ህክምና ከ12 ዓመታት በላይ ልምድ ያካበቱ። <br/> <i>Over 12+ years of clinical excellence in advanced prosthodontics and oral surgery.</i></p>
              </div>
              <div className="service-card" style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '30px', fontWeight: 'bold' }}>Dr. A</div>
                <h3>ዶ/ር አቤል (Dr. Abel)</h3>
                <span style={{ color: '#3b82f6', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>ጥርስ ማስተካከል (Orthodontist)</span>
                <p>ብሬስን እና ዘመናዊ ቴክኖሎጂን በመጠቀም የተጣመሙ ጥርሶችን በማስተካከል የተካኑ። <br/> <i>Specializes in aligning teeth perfectly using traditional braces and modern aligner technology.</i></p>
              </div>
              <div className="service-card" style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#60a5fa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '30px', fontWeight: 'bold' }}>Dr. M</div>
                <h3>ዶ/ር ማህሌት (Dr. Mahlet)</h3>
                <span style={{ color: '#60a5fa', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>የህፃናት ህክምና (Pediatric Dentist)</span>
                <p>ህጻናት ከፍርሃት ነጻ የሆነና ምቹ የህክምና ጊዜ እንዲያሳልፉ ከፍተኛ ትኩረት የሚሰጡ። <br/> <i>Dedicated to ensuring children have a comfortable, positive experience during visits.</i></p>
              </div>
            </div>
          </section>

          {/* GALLERY SECTION */}
          <section id="gallery" className="gallery-section" style={{ padding: '80px 5%' }}>
            <div className="section-header">
              <h2><ImageIcon size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px'}}/> የክሊኒካችን ገጽታ (Clinic Gallery)</h2>
              <p>ዘመናዊ የህክምና መስጫ አካባቢያችን / Our Modern Facility & Patient Care Environment</p>
            </div>
            <div className="services-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <img src={clinicBuildingImg} alt="Clinic Interior Hub" style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '15px', backgroundColor: 'white', textAlign: 'center', fontWeight: 'bold' }}>ዘመናዊ መስተንግዶ (Modern Reception)</div>
              </div>
              <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <img src={dentalScanImg} alt="Dental Tech Suite" style={{ width: '100%', height: '250px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '15px', backgroundColor: 'white', textAlign: 'center', fontWeight: 'bold' }}>ዲጂታል ምርመራ ክፍሎች (Digital Diagnostic Rooms)</div>
              </div>
              <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px' }}>
                <Sparkles size={48} color="#94a3b8" style={{ marginBottom: '15px' }} />
                <h3 style={{ color: '#475569' }}>ተጨማሪ ፎቶዎች በቅርቡ ይካተታሉ</h3>
                <p style={{ color: '#64748b' }}>More Photos Coming Soon...</p>
              </div>
            </div>
          </section>

          {/* HEALTH TIPS */}
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

          {/* PRICING GRID */}
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

          {/* FAQ SECTION */}
          <section id="faq" className="faq-section">
            <div className="section-header">
              <h2>ተደጋግመው የሚነሱ ጥያቄዎች (FAQs)</h2>
              <p>በብዛት የሚጠየቁ ጥያቄዎችና መልሶቻቸው / Commonly Asked Questions</p>
            </div>
            <div className="faq-grid">
              <div className="faq-item">
                <h4><HelpCircle size={18} className="faq-icon"/> የክሊኒኩ የስራ ቀናት መቼ መቼ ናቸው? / What are the clinic hours?</h4>
                <p>ከሰኞ እስከ አርብ (2:00 LT - 11:00 LT) እንዲሁም ቅዳሜ (2:00 LT - 6:00 LT) ክፍት ነው። እሁድ ዝግ ነው። <br/> <i>We are open Mon-Fri (8:00 AM - 5:00 PM) and Sat (8:00 AM - 12:00 PM). Closed on Sundays.</i></p>
              </div>
              <div className="faq-item">
                <h4><HelpCircle size={18} className="faq-icon"/> ጥርሴን በምን ያህል ጊዜ ማፅዳት አለብኝ? / How often should I clean my teeth?</h4>
                <p>በየ 6 ወሩ የጥርስ ማጽዳት (Scaling) እና አጠቃላይ ምርመራ እንዲያደርጉ ይመከራል። <br/> <i>Dentists highly recommend professional scaling and a full checkup every 6 months.</i></p>
              </div>
              <div className="faq-item">
                <h4><HelpCircle size={18} className="faq-icon"/> በዲጂታል መክፈል ይቻላል? / Do you accept digital payments?</h4>
                <p>አዎ፣ ሲቢኢ ብር፣ ቴሌብር እና የቀጥታ ባንክ ዝውውር እንቀበላለን። <br/> <i>Yes, we accept all major platforms including CBE Birr, Telebirr, and direct transfers.</i></p>
              </div>
              <div className="faq-item">
                <h4><HelpCircle size={18} className="faq-icon"/> የቀጠሮ ሰዓቴን መቀየር እችላለሁ? / Can I change my appointment time?</h4>
                <p>አዎ፣ ነገር ግን እባክዎ ቀጠሮዎ ከመድረሱ ቢያንስ ከ24 ሰዓታት በፊት በስልክ ቁጥራችን በማሳወቅ ይቀይሩ። <br/> <i>Yes, but please notify us by calling our office at least 24 hours in advance.</i></p>
              </div>
            </div>
          </section>

          {/* APPOINTMENT BOOKING SECTION */}
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
                    <CheckCircle size={56} style={{ color: '#22c55e' }} />
                    <h3>🎉 ቀጠሮዎ በተሳካ ሁኔታ ተይዟል! <br/> (Successfully Booked!)</h3>
                    <div className="ticket-display">
                      <p>የቀጠሮ መለያ ቁጥር (Ticket ID)</p>
                      <strong>{bookingResult.ticketId}</strong>
                    </div>
                    <p className="note">እባክዎ ይህንን የቲኬት ቁጥር ስክሪንሾት በማድረግ ክሊኒኩ ሲመጡ ያሳዩ። <br/> <i>Please screenshot this Ticket ID and show it at the reception when you arrive.</i></p>
                    <button onClick={handleResetForm} className="btn btn-primary w-full">ሌላ ቀጠሮ ይያዙ (Book Another)</button>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="professional-form">
                    <h3 className="form-title">የታካሚ መረጃ መሙያ ቅጽ (Patient Intake Form)</h3>
                    
                    <div className="form-group">
                      <label htmlFor="fullName">ሙሉ ስም (Full Name) <span>*</span></label>
                      <input type="text" id="fullName" name="fullName" value={formData.fullName} required onChange={handleFormChange} />
                    </div>

                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label htmlFor="age">ዕድሜ (Age) <span>*</span></label>
                        <input type="number" id="age" name="age" value={formData.age} required onChange={handleFormChange} />
                      </div>
                      <div className="form-group flex-1">
                        <label htmlFor="gender">ጾታ (Gender) <span>*</span></label>
                        <select id="gender" name="gender" value={formData.gender} onChange={handleFormChange}>
                          <option value="Male">ወንድ (Male)</option>
                          <option value="Female">ሴት (Female)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label htmlFor="phoneNumber">ስልክ ቁጥር (Phone) <span>*</span></label>
                        <input type="text" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} required onChange={handleFormChange} />
                      </div>
                      <div className="form-group flex-1">
                        <label htmlFor="reason">የህክምና ምክንያት (Reason)</label>
                        <select id="reason" name="reason" value={formData.reason} onChange={handleFormChange}>
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
                        <label htmlFor="appointmentDate">ቀጠሮ ቀን (Date) <span>*</span></label>
                        <input type="date" id="appointmentDate" name="appointmentDate" value={formData.appointmentDate} required onChange={handleFormChange} />
                      </div>
                      <div className="form-group flex-1">
                        <label htmlFor="appointmentTime">ሰዓት (Time) <span>*</span></label>
                        <input type="time" id="appointmentTime" name="appointmentTime" value={formData.appointmentTime} required onChange={handleFormChange} />
                      </div>
                    </div>

                    <div className="file-upload-zone">
                      <label htmlFor="mediaFile"><Upload size={16} /> ኤክስሬይ ወይም ፎቶ ያያይዙ (Upload X-Ray / Photo)</label>
                      <input type="file" id="mediaFile" ref={fileInputRef} accept="image/*,application/pdf" onChange={handleFileChange} />
                    </div>

                    <button type="submit" disabled={bookingLoading} className="submit-booking-btn">
                      {bookingLoading ? 'በማስኬድ ላይ... (Processing...)' : 'ቀጠሮውን አረጋግጥ (Confirm Appointment)'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* 🗺️ DUAL LANGUAGE FOOTER */}
          <footer id="contact" className="public-footer">
            <div className="footer-grid-container">
              
              {/* COLUMN 1: BRAND IDENTITY */}
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
                
                {/* SOCIAL MEDIA LINKS */}
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

              {/* COLUMN 2: QUICK LINKS */}
              <div className="footer-links-column">
                <h4>маያያዣዎች (Quick Links)</h4>
                <div className="vertical-link-stack">
                  <button onClick={() => navigateToSection("home")} className="footer-anchor-btn">ዋና ገጽ (Home)</button>
                  <button onClick={() => navigateToSection("about")} className="footer-anchor-btn">ስለ እኛ (About Us)</button>
                  <button onClick={() => navigateToSection("services")} className="footer-anchor-btn">አገልግሎቶች (Services)</button>
                  <button onClick={() => navigateToSection("team")} className="footer-anchor-btn">ባለሙያዎች (Our Team)</button>
                  <button onClick={() => navigateToSection("gallery")} className="footer-anchor-btn">ገጽታ (Gallery)</button>
                </div>
              </div>

              {/* COLUMN 3: WORKING HOURS */}
              <div className="footer-hours-column">
                <h4>የስራ ሰዓታት (Working Hours)</h4>
                <div className="hours-vertical-stack">
                  <div className="hours-row">
                    <span className="row-icon">📆</span>
                    <div className="hours-details">
                      <span className="day-title">ሰኞ - አርብ (Mon - Fri)</span>
                      <span className="time-tag">2:00 LT - 11:00 LT <span className="time-highlight">(8:00 AM - 5:00 PM)</span></span>
                    </div>
                  </div>
                  <div className="hours-row">
                    <span className="row-icon">📆</span>
                    <div className="hours-details">
                      <span className="day-title">ቅዳሜ (Saturday)</span>
                      <span className="time-tag">2:00 LT - 6:00 LT <span className="time-highlight">(8:00 AM - 12:00 PM)</span></span>
                    </div>
                  </div>
                  <div className="hours-row">
                    <span className="row-icon">🛑</span>
                    <div className="hours-details">
                      <span className="day-title">እሁድ (Sunday)</span>
                      <span className="closed-highlight">ዝግ ነው (Closed)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 4: CONTACT INFO */}
              <div className="footer-contact-column">
                <h4>አድራሻ (Contact Info)</h4>
                <div className="contact-vertical-stack">
                  <div className="contact-row">
                    <span className="row-icon">📍</span>
                    <span>5 ኪሎ ፣ አዲስ አበባ<br/><small className="footer-en-text">(5 Kilo, Addis Ababa)</small></span>
                  </div>
                  <div className="contact-row">
                    <span className="row-icon">📞</span>
                    <a href="tel:+251930641483" className="contact-direct-link">+251 930 64 14 83</a>
                  </div>
                  <div className="contact-row">
                    <span className="row-icon">📧</span>
                    <a href="mailto:info@drgetanehclinic.com" className="contact-direct-link">info@drgetanehclinic.com</a>
                  </div>
                </div>
              </div>

            </div>
            
            {/* SYSTEM STRIP */}
            <div className="footer-bottom-bar">
              <p>© {new Date().getFullYear()} Dr. Getaneh Specialty Dental Clinic. መብቱ በህግ የተጠበቀ ነው። All Rights Reserved.</p>
            </div>
          </footer>
          
          {/* SCROLL TO TOP */}
          {showScrollTop && (
            <button className="scroll-to-top-btn animate-fade-in" onClick={scrollToTop} title="ወደ ላይ ተመለስ (Back to Top)">
              <ArrowUp size={24} color="white" />
            </button>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* 📊 VIEW 2: INTERNAL ADMIN DASHBOARD WORKSPACE */}
      {/* ======================================================== */}
      {view === "dashboard" && (
        <div className="dashboard-view-wrapper animate-fade-in">
          <div className="dashboard-sub-header">
            <div className="dashboard-headline-flex">
              <div>
                <h2>📊 ዳሽቦርድ መቆጣጠሪያ (Admin Dashboard)</h2>
                <p>የታካሚዎች መረጃ አስተዳደር ስርዓት / Patient Data Management System</p>
              </div>
              <div className="dashboard-shortcut-actions">
                <button onClick={exportToCSV} className="action-btn csv-download">
                  <Download size={16} /> ኤክስፖርት (Export CSV)
                </button>
                <button 
                  onClick={() => { 
                    setView("public"); 
                    setTimeout(() => {
                      document.getElementById("book-now")?.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  }} 
                  className="action-btn register-shortcut"
                >
                  <PlusCircle size={16} /> አዲስ ቀጠሮ (New Booking)
                </button>
              </div>
            </div>
          </div>

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
                            <button 
                              type="button" 
                              onClick={() => handleSelectRow(patient.id)} 
                              className="custom-checkbox-row-btn"
                            >
                              {isChecked ? (
                                <CheckSquare size={18} className="checkbox-icon checked" />
                              ) : (
                                <Square size={18} className="checkbox-icon" />
                              )}
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
                              title="ይህን መረጃ ብቻ ሰርዝ (Delete this row)"
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
    </div>
  );
}

export default App;