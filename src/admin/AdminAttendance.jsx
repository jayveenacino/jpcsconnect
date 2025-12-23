import React, { useState, useEffect, useRef } from "react";
import "./admincss/AdminAttendance.css";
import Swal from "sweetalert2";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "../firebase"; 
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

export default function AdminAttendance() {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [scannerActive, setScannerActive] = useState(false);
    const [events, setEvents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
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
            const eventsCol = collection(db, "events");
            const snapshot = await getDocs(eventsCol);
            const eventsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsList);
            if (eventsList.length > 0) setSelectedEvent(eventsList[0].id);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const attendanceRef = collection(db, "attendance");
            const q = query(attendanceRef, where("eventId", "==", selectedEvent));
            const snapshot = await getDocs(q);
            const attendanceList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAttendance(attendanceList);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    // Camera initialization logic
    useEffect(() => {
        if (scannerActive) {
            // Delay slightly to ensure the div #qr-reader is rendered in the DOM
            const timer = setTimeout(() => {
                if (!qrScannerRef.current) {
                    qrScannerRef.current = new Html5QrcodeScanner(
                        "qr-reader",
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            rememberLastUsedCamera: true,
                        },
                        false
                    );
                    qrScannerRef.current.render(onScanSuccess, (err) => {
                        if (!err.includes("NotFoundException")) console.warn(err);
                    });
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            if (qrScannerRef.current) {
                qrScannerRef.current.clear().catch(err => console.error(err));
                qrScannerRef.current = null;
            }
        }
    }, [scannerActive]);

    const onScanSuccess = async (decodedText) => {
        if (qrScannerRef.current) {
            await qrScannerRef.current.pause(true);
        }
        await processQRCode(decodedText);
    };

    const processQRCode = async (scannedCode) => {
        try {
            const scannedUid = scannedCode.trim();
            if (!scannedUid || !selectedEvent) {
                await Swal.fire({ icon: "error", title: "Error", text: "Select an event first." });
                if (qrScannerRef.current) await qrScannerRef.current.resume();
                return;
            }

            const registrationsRef = collection(db, "registrations");
            const q = query(
                registrationsRef,
                where("eventId", "==", selectedEvent),
                where("firebaseUid", "==", scannedUid)
            );

            const registrationSnapshot = await getDocs(q);

            if (registrationSnapshot.empty) {
                await Swal.fire({
                    icon: "error",
                    title: "Not Registered",
                    text: "Student is not registered for this event.",
                });
                if (qrScannerRef.current) await qrScannerRef.current.resume();
                return;
            }

            const regData = registrationSnapshot.docs[0].data();

            // Check if already checked in
            const attendanceRef = collection(db, "attendance");
            const attQuery = query(
                attendanceRef,
                where("eventId", "==", selectedEvent),
                where("firebaseUid", "==", scannedUid)
            );
            const attSnapshot = await getDocs(attQuery);

            if (!attSnapshot.empty) {
                await Swal.fire({ icon: "info", title: "Already Logged", text: `${regData.studentName} is already checked in.` });
                if (qrScannerRef.current) await qrScannerRef.current.resume();
                return;
            }

            const currentEvent = events.find(e => e.id === selectedEvent);
            await addDoc(collection(db, "attendance"), {
                firebaseUid: scannedUid,
                studentId: regData.studentId,
                studentName: regData.studentName,
                eventId: selectedEvent,
                eventName: currentEvent?.name || "Event",
                timestamp: new Date().toISOString(),
                status: "attended"
            });

            await Swal.fire({ icon: "success", title: "Confirmed", text: regData.studentName, timer: 1500 });
            await fetchAttendance();
            if (qrScannerRef.current) await qrScannerRef.current.resume();

        } catch (error) {
            console.error(error);
            if (qrScannerRef.current) await qrScannerRef.current.resume();
        }
    };

    return (
        <div className="attendance-view">
            <h2>Attendance Tracking</h2>
            <div className="attendance-controls">
                <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                    {events.map((event) => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                </select>
                <button 
                    className={`scan-btn ${scannerActive ? "active" : ""}`} 
                    onClick={() => setScannerActive(!scannerActive)}
                >
                    {scannerActive ? "Stop Camera" : "Start Camera"}
                </button>
            </div>

            {/* CRITICAL: This div must exist for the library to work */}
            {scannerActive && (
                <div className="scanner-container" style={{ margin: "20px 0" }}>
                    <div id="qr-reader" style={{ width: "100%" }}></div>
                </div>
            )}

            <div className="attendance-table">
                <h3>Attendees ({attendance.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.map((r) => (
                            <tr key={r.id}>
                                <td>{r.studentId}</td>
                                <td>{r.studentName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}