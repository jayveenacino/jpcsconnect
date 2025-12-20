import React, { useState, useEffect, useRef } from "react";
import "../css/AdminAttendance.css";
import * as localDB from "../localStorage";
import Swal from "sweetalert2";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function AdminAttendance() {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [scannerActive, setScannerActive] = useState(false);
    const [events, setEvents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const scannerRef = useRef(null);
    const qrScannerRef = useRef(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchAttendance();
        }
    }, [selectedEvent]);

    const fetchEvents = async () => {
        try {
            const snapshot = await localDB.getDocs("events");
            const eventsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsList);
            if (eventsList.length > 0) {
                setSelectedEvent(eventsList[0].id);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const snapshot = await localDB.queryWhere("attendance", "eventId", "==", selectedEvent);
            const attendanceList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAttendance(attendanceList);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    const handleScanToggle = () => {
        if (scannerActive) {
            if (qrScannerRef.current) {
                qrScannerRef.current.clear().catch(err => console.error("Failed to clear scanner:", err));
                qrScannerRef.current = null;
            }
            setScannerActive(false);
        } else {
            setScannerActive(true);
        }
    };

    useEffect(() => {
        if (scannerActive && scannerRef.current && !qrScannerRef.current) {
            qrScannerRef.current = new Html5QrcodeScanner(
                "qr-reader",
                { 
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    rememberLastUsedCamera: true,
                    supportedScanTypes: [0, 1]
                },
                false
            );

            qrScannerRef.current.render(onScanSuccess, onScanError);
        }

        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.clear().catch(err => console.error("Cleanup error:", err));
                qrScannerRef.current = null;
            }
        };
    }, [scannerActive]);

    const onScanSuccess = async (decodedText) => {
        if (qrScannerRef.current) {
            await qrScannerRef.current.pause(true);
        }
        await processQRCode(decodedText);
    };

    const onScanError = (error) => {
        if (!error.includes("NotFoundException")) {
            console.warn("QR Scan Error:", error);
        }
    };

    const processQRCode = async (scannedCode) => {
        try {
            if (!scannedCode || scannedCode.trim().length === 0) {
                await Swal.fire({
                    icon: "error",
                    title: "Invalid QR Code",
                    text: "The scanned QR code is empty or invalid",
                    confirmButtonColor: "#a900f7",
                    timer: 2000
                });
                if (qrScannerRef.current) {
                    await qrScannerRef.current.resume();
                }
                return;
            }

            const studentSnapshot = await localDB.queryWhere("users", "studentId", "==", scannedCode.trim());
            
            let studentData;
            let isNewStudent = false;
            
            if (studentSnapshot.empty || studentSnapshot.docs.length === 0) {
                // Student not registered - create a new entry in localStorage
                const newStudentData = {
                    studentId: scannedCode.trim(),
                    displayName: `Student ${scannedCode.trim()}`,
                    fullName: `Unregistered Student ${scannedCode.trim()}`,
                    email: "",
                    department: "Unknown",
                    program: "Unknown",
                    photoURL: "",
                    createdAt: new Date().toISOString(),
                    eventsAttended: 0,
                    firebaseUid: null,
                    isRegistered: false
                };
                
                // Add to localStorage
                await localDB.addDoc("users", newStudentData);
                studentData = newStudentData;
                isNewStudent = true;
            } else {
                studentData = studentSnapshot.docs[0].data();
            }
            
            const existingAttendance = attendance.find(
                a => a.studentId === scannedCode.trim()
            );
            
            if (existingAttendance) {
                await Swal.fire({
                    icon: "warning",
                    title: "Already Checked In",
                    text: `${studentData.fullName || studentData.displayName} has already been checked in for this event.`,
                    confirmButtonColor: "#a900f7"
                });
                
                if (qrScannerRef.current) {
                    await qrScannerRef.current.resume();
                }
                return;
            }

            const event = events.find(e => e.id === selectedEvent);
            await localDB.addDoc("attendance", {
                studentId: scannedCode.trim(),
                studentName: studentData.fullName || studentData.displayName || "Unknown",
                eventId: selectedEvent,
                eventName: event?.name || "Unknown Event",
                status: "attended",
                timestamp: new Date().toISOString()
            });

            await Swal.fire({
                icon: "success",
                title: "Check-in Successful!",
                text: isNewStudent 
                    ? `New student ${scannedCode.trim()} checked in successfully` 
                    : `${studentData.fullName || studentData.displayName} checked in successfully`,
                timer: 1500,
                showConfirmButton: false
            });

            await fetchAttendance();
            
            if (qrScannerRef.current) {
                await qrScannerRef.current.resume();
            }
            
        } catch (error) {
            console.error("Error processing QR scan:", error);
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to process check-in. Please try again.",
                confirmButtonColor: "#a900f7"
            });
            
            if (qrScannerRef.current) {
                await qrScannerRef.current.resume();
            }
        }
    };

    const handleExportCSV = () => {
        if (attendance.length === 0) {
            Swal.fire({
                icon: "info",
                title: "No Data",
                text: "No attendance records to export.",
                confirmButtonColor: "#a900f7"
            });
            return;
        }

        const headers = ["Student ID", "Student Name", "Event", "Date", "Status"];
        const rows = attendance.map(record => {
            const event = events.find(e => e.id === record.eventId);
            const statusLabel = record.status === "registered" ? "Registered" : "Attended";
            return [
                record.studentId,
                record.studentName,
                event?.name || "Unknown Event",
                event?.date || "N/A",
                statusLabel
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        const event = events.find(e => e.id === selectedEvent);
        const filename = `attendance_${event?.name.replace(/\\s+/g, "_") || "export"}_${new Date().toISOString().split("T")[0]}.csv`;
        
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
            icon: "success",
            title: "Export Successful!",
            text: `Downloaded ${attendance.length} attendance records`,
            timer: 2000,
            showConfirmButton: false
        });
    };

    const getStatusBadge = (status) => {
        return { label: "Attended", className: "attendance-status-completed" };
    };

    return (
        <div className="attendance-view">
            <h2>Attendance Tracking</h2>

            <div className="attendance-controls">
                <div className="control-group">
                    <label>Select Event</label>
                    <select
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        className="event-select"
                    >
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name} - {event.date}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    className={`scan-btn ${scannerActive ? "active" : ""}`}
                    onClick={handleScanToggle}
                >
                    {scannerActive ? "Stop Scanner" : "Start Scanner"}
                </button>
            </div>

            {scannerActive && (
                <div className="scanner-panel">
                    <div className="scanner-box" ref={scannerRef}>
                        <div id="qr-reader" style={{ width: "100%" }}></div>
                    </div>
                    <div className="scanner-instructions">
                        <h4>Camera Scanner Active</h4>
                        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                            Position the QR code within the camera frame
                        </p>
                        <div className="scanner-stats">
                            <div className="stat-item">
                                <span className="stat-value">{attendance.length}</span>
                                <span className="stat-label">Scanned</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="attendance-summary">
                <div className="summary-card">
                    <div className="summary-value">{attendance.length}</div>
                    <div className="summary-label">Total Attendees</div>
                </div>
            </div>

            <div className="attendance-table-container">
                <div className="table-header">
                    <h3>Attendance Records</h3>
                    <button 
                        className="export-btn"
                        onClick={handleExportCSV}
                        disabled={attendance.length === 0}
                    >
                        Export CSV
                    </button>
                </div>

                <div className="attendance-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                        No attendance records
                                    </td>
                                </tr>
                            ) : (
                                attendance.map((record) => {
                                    const statusLabel = record.status === "registered" ? "Registered" : "Attended";
                                    const statusClass = record.status === "registered" ? "attendance-status-registered" : "attendance-status-attended";
                                    return (
                                        <tr key={record.id}>
                                            <td style={{ maxWidth: "120px", wordBreak: "break-word", fontWeight: "600" }}>
                                                {typeof record.studentId === 'string' ? record.studentId : String(record.studentId || 'N/A')}
                                            </td>
                                            <td className="student-name" style={{ maxWidth: "200px", wordBreak: "break-word" }}>
                                                {record.studentName || "Unknown"}
                                            </td>
                                            <td>
                                                <span className={`attendance-badge ${statusClass}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
