import React, { useState, useRef } from 'react';

// Dynamic Environment Switch (Switches automatically between local test and live Render build)
const BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://clinic-backend-qi86.onrender.com";

export default function BookingForm() {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        fullName: '', 
        age: '', 
        gender: 'Male', 
        country: 'Ethiopia',
        phoneNumber: '', 
        reason: 'Toothache', 
        appointmentDate: '', 
        appointmentTime: ''
    });
    const [mediaFile, setMediaFile] = useState(null);
    const [bookingResult, setBookingResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // 📝 Track string text shifts smoothly
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 📁 Handle file state adjustments cleanly
    const handleFileChange = (e) => {
        setMediaFile(e.target.files[0]);
    };

    // 🔄 Complete application structure wipe when initiating another appointment booking
    const handleResetForm = () => {
        setFormData({
            fullName: '', 
            age: '', 
            gender: 'Male', 
            country: 'Ethiopia',
            phoneNumber: '', 
            reason: 'Toothache', 
            appointmentDate: '', 
            appointmentTime: ''
        });
        setMediaFile(null);
        setBookingResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Physically clears out the selected file element
        }
    };

    // 🚀 Handle Submission Packages securely
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Web forms with files must wrap elements into a FormData object
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (mediaFile) {
            data.append('mediaFile', mediaFile);
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/web-book`, {
                method: 'POST',
                body: data // Sent automatically as multipart/form-data
            });
            
            const result = await response.json();
            if (result.success) {
                setBookingResult(result);
            } else {
                alert('ቀጠሮ መያዝ አልተሳካም: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting appointment:', error);
            alert('ከማዕከላዊ ሰርቨር ጋር መገናኘት አልተቻለም። Please ensure your backend is active.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '550px', margin: '40px auto', padding: '30px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <h2 style={{ textAlign: 'center', color: '#1e3a8a', margin: '0 0 5px 0', fontSize: '22px', fontWeight: 'bold' }}>ዶ/ር ጌታነህ የጥርስ ልዩ ህክምና ክሊኒክ</h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', margin: '0 0 25px 0' }}>Online Appointment Booking Portal</p>
            
            {bookingResult ? (
                <div style={{ padding: '25px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>🎉 ቀጠሮዎ በተሳካ ሁኔታ ተይዟል!</h3>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>Your Ticket ID Code is: <strong style={{ background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>{bookingResult.ticketId}</strong></p>
                    <p style={{ fontSize: '13px', color: '#475569', marginTop: '10px' }}>Please save or screenshot this ID code to present upon your arrival at the clinic front desk.</p>
                    <button 
                        onClick={handleResetForm} 
                        style={{ marginTop: '20px', padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                    >
                        ሌላ አዲስ ቀጠሮ ያዙ / Book Another
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    
                    <div>
                        <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>ሙሉ ስም (Full Name) <span style={{ color: '#ef4444' }}>*</span></label>
                        <input 
                            type="text" 
                            name="fullName" 
                            value={formData.fullName}
                            required 
                            onChange={handleChange} 
                            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }} 
                            placeholder="e.g. Wasihun Tassie" 
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>ዕድሜ (Age) <span style={{ color: '#ef4444' }}>*</span></label>
                            <input 
                                type="number" 
                                name="age" 
                                value={formData.age}
                                required 
                                onChange={handleChange} 
                                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }} 
                                placeholder="30"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>ጾታ (Gender) <span style={{ color: '#ef4444' }}>*</span></label>
                            <select 
                                name="gender" 
                                value={formData.gender}
                                onChange={handleChange} 
                                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', background: '#fff', boxSizing: 'border-box', height: '41px' }}
                            >
                                <option value="Male">Male (ወንድ)</option>
                                <option value="Female">Female (ሴት)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>ሀገር (Country)</label>
                            <input 
                                type="text" 
                                name="country" 
                                value={formData.country}
                                onChange={handleChange} 
                                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }} 
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>ስልክ ቁጥር (Phone Number) <span style={{ color: '#ef4444' }}>*</span></label>
                            <input 
                                type="text" 
                                name="phoneNumber" 
                                value={formData.phoneNumber}
                                required 
                                onChange={handleChange} 
                                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }} 
                                placeholder="0911XXXXXX" 
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>የህክምና ምክንያት (Reason for Visit)</label>
                        <select 
                            name="reason" 
                            value={formData.reason}
                            onChange={handleChange} 
                            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', background: '#fff', boxSizing: 'border-box' }}
                        >
                            <option value="Toothache">Toothache (የጥርስ ህመም)</option>
                            <option value="Cleaning">Cleaning (ማጽዳት)</option>
                            <option value="Extraction">Extraction (ማስነቀል)</option>
                            <option value="Filling">Filling (የጥርስ መሙላት)</option>
                            <option value="General Checkup">General Checkup (ምርመራ)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>ቀጠሮ ቀን (Date) <span style={{ color: '#ef4444' }}>*</span></label>
                            <input 
                                type="date" 
                                name="appointmentDate" 
                                value={formData.appointmentDate}
                                required 
                                onChange={handleChange} 
                                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }} 
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>ሰዓት (Time) <span style={{ color: '#ef4444' }}>*</span></label>
                            <input 
                                type="time" 
                                name="appointmentTime" 
                                value={formData.appointmentTime}
                                required 
                                onChange={handleChange} 
                                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box' }} 
                            />
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px', fontSize: '14px' }}>📸 ኤክስሬይ ወይም ፎቶ ያያይዙ (Upload X-Ray / Photo File)</label>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/*,application/pdf" 
                            onChange={handleFileChange} 
                            style={{ fontSize: '13px', marginTop: '5px', display: 'block' }} 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginTop: '10px' }}
                    >
                        {loading ? 'በማስኬድ ላይ... (Processing...)' : 'ቀጠሮ ያዙ / Confirm Appointment'}
                    </button>
                </form>
            )}
        </div>
    );
}