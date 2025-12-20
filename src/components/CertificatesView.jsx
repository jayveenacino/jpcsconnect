import React, { useState, useEffect } from "react";
import "../css/CertificatesView.css";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Swal from "sweetalert2";

export default function CertificatesView() {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [awardType, setAwardType] = useState("certificate");
    const [view, setView] = useState("event-based");
    const [events, setEvents] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [students, setStudents] = useState([]);
    const [customBadges, setCustomBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadedTemplate, setUploadedTemplate] = useState(null);
    const [showCreateBadge, setShowCreateBadge] = useState(false);
    const [badgeForm, setBadgeForm] = useState({
        name: "",
        description: "",
        logo: null
    });

    useEffect(() => {
        fetchEvents();
        fetchStudents();
        fetchCustomBadges();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchAttendees();
        }
    }, [selectedEvent]);

    const fetchStudents = async () => {
        try {
            const usersCollection = collection(db, "users");
            const snapshot = await getDocs(usersCollection);
            const studentsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(studentsList);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchCustomBadges = async () => {
        try {
            const badgesCollection = collection(db, "customBadges");
            const snapshot = await getDocs(badgesCollection);
            const badgesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomBadges(badgesList);
        } catch (error) {
            console.error("Error fetching badges:", error);
        }
    };

    const fetchEvents = async () => {
        try {
            const eventsCollection = collection(db, "events");
            const snapshot = await getDocs(eventsCollection);
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
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendees = async () => {
        try {
            const attendanceQuery = query(
                collection(db, "attendance"),
                where("eventId", "==", selectedEvent),
                where("status", "==", "completed")
            );
            const snapshot = await getDocs(attendanceQuery);
            const attendeesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAttendees(attendeesList);
        } catch (error) {
            console.error("Error fetching attendees:", error);
        }
    };

    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedTemplate(file.name);
            Swal.fire({
                icon: "success",
                title: "Template Uploaded",
                text: `Template "${file.name}" uploaded successfully`,
                confirmButtonColor: "#a900f7"
            });
        }
    };

    const selectedEventData = events.find(e => e.id === selectedEvent);
    const eligibleAttendees = attendees;

    const handleGenerateAll = () => {
        Swal.fire({
            icon: "info",
            title: "Generating Certificates",
            text: `Generating ${templateType}s for ${eligibleAttendees.length} attendees`,
            confirmButtonColor: "#a900f7"
        });
    };

    const handleGenerateIndividual = (attendee) => {
        Swal.fire({
            icon: "success",
            title: `${awardType === "certificate" ? "Certificate" : "Badge"} Generated`,
            text: `${awardType === "certificate" ? "Certificate" : "Badge"} generated for ${attendee.studentName}`,
            confirmButtonColor: "#a900f7"
        });
    };

    const handleCreateBadge = async () => {
        if (!badgeForm.name || !badgeForm.description) {
            Swal.fire({
                icon: "warning",
                title: "Missing Information",
                text: "Please provide badge name and description",
                confirmButtonColor: "#a900f7"
            });
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Badge Created",
            text: `Custom badge "${badgeForm.name}" has been created`,
            confirmButtonColor: "#a900f7"
        });

        setBadgeForm({ name: "", description: "", logo: null });
        setShowCreateBadge(false);
    };

    const handleAwardCustomBadge = (student, badge) => {
        Swal.fire({
            icon: "success",
            title: "Badge Awarded",
            text: `Badge "${badge.name}" awarded to ${student.displayName}`,
            confirmButtonColor: "#a900f7"
        });
    };

    return (
        <div className="certificates-view">
            <h2>Certificates & Badges</h2>

            <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
                <button
                    onClick={() => setView("event-based")}
                    style={{
                        padding: "0.5rem 1.5rem",
                        background: view === "event-based" ? "#a900f7" : "#f3f4f6",
                        color: view === "event-based" ? "#fff" : "#374151",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    Event Certificates & Badges
                </button>
                <button
                    onClick={() => setView("custom-badges")}
                    style={{
                        padding: "0.5rem 1.5rem",
                        background: view === "custom-badges" ? "#a900f7" : "#f3f4f6",
                        color: view === "custom-badges" ? "#fff" : "#374151",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    Custom Badges
                </button>
            </div>

            {view === "event-based" ? (
                <>
                    <div className="certificates-controls">
                        <div className="control-row">
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

                            <div className="control-group">
                                <label>Type</label>
                                <select
                                    value={awardType}
                                    onChange={(e) => setAwardType(e.target.value)}
                                    className="type-select"
                                >
                                    <option value="certificate">Certificate</option>
                                    <option value="badge">Event Badge</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                            Loading...
                        </div>
                    ) : events.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                            No events available. Create an event first.
                        </div>
                    ) : (
                        <>
                            <div className="certificates-summary">
                                <div className="summary-box">
                                    <div className="summary-title">Event Details</div>
                                    <div className="summary-content">
                                        <div className="summary-item">
                                            <span className="summary-label">Event:</span>
                                            <span className="summary-value">{selectedEventData?.name || "N/A"}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Date:</span>
                                            <span className="summary-value">{selectedEventData?.date || "N/A"}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Eligible Attendees:</span>
                                            <span className="summary-value">{eligibleAttendees.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="attendees-section">
                                <h3>Eligible Attendees (Event Attendees Only)</h3>
                                <div className="attendees-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Student ID</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {eligibleAttendees.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                                        No eligible attendees
                                                    </td>
                                                </tr>
                                            ) : (
                                                eligibleAttendees.map((attendee) => (
                                                    <tr key={attendee.id}>
                                                        <td className="attendee-name">{attendee.studentName || "Unknown"}</td>
                                                        <td>{attendee.studentId || "N/A"}</td>
                                                        <td>
                                                            <span className="status-completed">Attended</span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="generate-btn"
                                                                onClick={() => handleGenerateIndividual(attendee)}
                                                            >
                                                                Award
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h3>Custom Badges</h3>
                        <button
                            onClick={() => setShowCreateBadge(!showCreateBadge)}
                            style={{
                                padding: "0.5rem 1rem",
                                background: "#a900f7",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            {showCreateBadge ? "Cancel" : "+ Create Badge"}
                        </button>
                    </div>

                    {showCreateBadge && (
                        <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                            <h4>Create New Badge</h4>
                            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Badge Name</label>
                                    <input
                                        type="text"
                                        value={badgeForm.name}
                                        onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                                        placeholder="e.g., Excellence Award"
                                        style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Description</label>
                                    <textarea
                                        value={badgeForm.description}
                                        onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                                        placeholder="Badge description..."
                                        rows="3"
                                        style={{ width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "6px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Badge Logo (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setBadgeForm({ ...badgeForm, logo: e.target.files[0] })}
                                        style={{ width: "100%" }}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateBadge}
                                    style={{
                                        padding: "0.75rem",
                                        background: "#a900f7",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >
                                    Create Badge
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
