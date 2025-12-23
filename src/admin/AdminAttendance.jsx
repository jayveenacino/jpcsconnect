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
            const snapshot = await getDocs(collection(db, "events"));
            const eventsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsList);
            if (eventsList.length > 0) setSelectedEvent(eventsList[0].id);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const q = query(
                collection(db, "attendance"),
                where("eventId", "==", selectedEvent)
            );
            const snapshot = await getDocs(q);
            setAttendance(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        } catch (error) {
            console.error(error);
        }
    };

    const handleScanToggle = () => {
        if (scannerActive) {
            if (qrScannerRef.current) {
                qrScannerRef.current.clear();
                qrScannerRef.current = null;
            }
            setScannerActive(false);
        } else {
            setScannerActive(true);
        }
    };

    useEffect(() => {
        if (scannerActive && !qrScannerRef.current) {
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
                qrScannerRef.current.clear();
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

    const onScanError = () => {};

    const processQRCode = async (scannedCode) => {
        try {
            const scannedUid = scannedCode.trim();
            if (!scannedUid || !selectedEvent) {
                await Swal.fire({ icon: "error", title: "Error", text: "Please select an event first." });
                if (qrScannerRef.current) await qrScannerRef.current.resume();
                return;
            }

            const q = query(
                collection(db, "registrations"),
                where("eventId", "==", selectedEvent),
                where("studentId", "==", scannedUid)
            );

            const registrationSnapshot = await getDocs(q);

            if (registrationSnapshot.empty) {
                await Swal.fire({
                    icon: "error",
                    title: "Not Registered",
                    text: "Student has not registered for this specific event."
                });
                if (qrScannerRef.current) await qrScannerRef.current.resume();
                return;
            }

            const regData = registrationSnapshot.docs[0].data();

            const attQuery = query(
                collection(db, "attendance"),
                where("eventId", "==", selectedEvent),
                where("studentId", "==", scannedUid)
            );

            const attSnapshot = await getDocs(attQuery);

            if (!attSnapshot.empty) {
                await Swal.fire({
                    icon: "warning",
                    title: "Already Present",
                    text: `${regData.studentName} is already checked in.`
                });
                if (qrScannerRef.current) await qrScannerRef.current.resume();
                return;
            }

            const currentEvent = events.find(e => e.id === selectedEvent);

            await addDoc(collection(db, "attendance"), {
                studentId: scannedUid,
                studentName: regData.studentName,
                eventId: selectedEvent,
                eventName: currentEvent?.name,
                timestamp: new Date().toISOString(),
                status: "attended"
            });

            await Swal.fire({
                icon: "success",
                title: "Success!",
                text: `Attendance recorded for ${regData.studentName}`,
                timer: 1500,
                showConfirmButton: false
            });

            fetchAttendance();
            if (qrScannerRef.current) await qrScannerRef.current.resume();
        } catch (error) {
            console.error(error);
            await Swal.fire({ icon: "error", title: "Error", text: "System error during scanning." });
            if (qrScannerRef.current) await qrScannerRef.current.resume();
        }
    };

    const handleExportCSV = () => {
        if (attendance.length === 0) return;
        const headers = ["Student ID", "Student Name", "Timestamp"];
        const rows = attendance.map(r => [r.studentId, r.studentName, r.timestamp]);
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${selectedEvent}.csv`;
        a.click();
    };

    return (
        <div className="attendance-view">
            <h2>Attendance Tracking</h2>

            <div className="attendance-controls">
                <div className="control-group">
                    <label>Select Event</label>
                    <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
                </div>

                <button onClick={handleScanToggle}>
                    {scannerActive ? "Stop Scanner" : "Start Scanner"}
                </button>
            </div>

            {scannerActive && <div id="qr-reader" />}

            <table>
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {attendance.map(record => (
                        <tr key={record.id}>
                            <td>{record.studentId}</td>
                            <td>{record.studentName}</td>
                            <td>Attended</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button onClick={handleExportCSV}>Export CSV</button>
        </div>
    );
}
