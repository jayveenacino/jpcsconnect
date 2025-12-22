import React, { useState, useEffect } from "react";
import "./admincss/event.css";
import Swal from "sweetalert2";
import { QRCodeSVG } from "qrcode.react";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

export default function CreateEvent() {
    const [showForm, setShowForm] = useState(false);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedEventForQR, setSelectedEventForQR] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        date: "",
        startTime: "",
        location: ""
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const snapshot = await getDocs(collection(db, "events"));
            const list = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            setEvents(list);
        } catch {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingEvent) {
                await updateDoc(doc(db, "events", editingEvent.id), { ...formData });
                Swal.fire("Updated!", "Event updated successfully", "success");
            } else {
                await addDoc(collection(db, "events"), {
                    ...formData,
                    status: "upcoming",
                    attendees: 0,
                    createdAt: serverTimestamp()
                });
                Swal.fire("Created!", "Event created successfully", "success");
            }

            setFormData({
                name: "",
                description: "",
                date: "",
                startTime: "",
                location: ""
            });

            setEditingEvent(null);
            setShowForm(false);
            fetchEvents();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            description: event.description || "",
            date: event.date,
            startTime: event.startTime,
            location: event.location
        });
        setShowForm(true);
    };

    const handleCancelEdit = () => {
        setEditingEvent(null);
        setFormData({
            name: "",
            description: "",
            date: "",
            startTime: "",
            location: ""
        });
        setShowForm(false);
    };

    const handleDelete = async (id) => {
        const res = await Swal.fire({
            title: "Delete Event?",
            text: "This cannot be undone",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626"
        });

        if (res.isConfirmed) {
            await deleteDoc(doc(db, "events", id));
            Swal.fire("Deleted!", "Event removed", "success");
            fetchEvents();
        }
    };

    const handleCloseQRModal = () => {
        setShowQRModal(false);
        setSelectedEventForQR(null);
    };

    const getStatusBadge = (status) => {
        const map = {
            upcoming: { label: "Upcoming", className: "status-upcoming" },
            ongoing: { label: "Ongoing", className: "status-ongoing" },
            completed: { label: "Completed", className: "status-completed" }
        };
        return map[status] || map.upcoming;
    };

    return (
        <div className="event-management">
            <div className="event-header">
                <h2>Event Management</h2>
                <button className="create-event-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "+ Create Event"}
                </button>
            </div>

            {showForm && (
                <div className="event-form-card">
                    <h3>{editingEvent ? "Edit Event" : "Create New Event"}</h3>

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-field">
                                <label>Event Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Description</label>
                                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Date *</label>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                            </div>

                            <div className="form-field">
                                <label>Start Time *</label>
                                <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Location *</label>
                                <input type="text" name="location" value={formData.location} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="submit-btn" disabled={submitting}>
                                {submitting ? (editingEvent ? "Updating..." : "Creating...") : (editingEvent ? "Update Event" : "Create Event")}
                            </button>

                            {editingEvent && (
                                <button type="button" className="event-btn-secondary" style={{ marginLeft: "1rem" }} onClick={handleCancelEdit}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="events-list">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Loading events...</div>
                ) : events.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>No events yet</div>
                ) : (
                    events.map((event) => {
                        const badge = getStatusBadge(event.status);

                        return (
                            <div key={event.id} className="event-card">
                                <div className="event-card-header">
                                    <h3>{event.name}</h3>
                                    <span className={`status-badge ${badge.className}`}>{badge.label}</span>
                                </div>

                                <div className="event-details">
                                    <div className="event-detail-item"><span className="detail-label">Date:</span><span>{event.date}</span></div>
                                    <div className="event-detail-item"><span className="detail-label">Time:</span><span>{event.startTime}</span></div>
                                    <div className="event-detail-item"><span className="detail-label">Location:</span><span>{event.location}</span></div>
                                    <div className="event-detail-item"><span className="detail-label">Attendees:</span><span>{event.attendees || 0}</span></div>
                                </div>

                                <div className="event-actions">
                                    <button className="event-btn-secondary" onClick={() => { setSelectedEventForQR(event); setShowQRModal(true); }}>
                                        View QR
                                    </button>

                                    <button className="event-btn-secondary" onClick={() => handleEdit(event)}>
                                        Edit
                                    </button>

                                    <button className="event-btn-danger" onClick={() => handleDelete(event.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showQRModal && selectedEventForQR && (
                <div className="modal-overlay" onClick={handleCloseQRModal}>
                    <div className="modal-content qr-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Event QR Code</h3>
                            <button className="modal-close" onClick={handleCloseQRModal}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ textAlign: "center", padding: "2rem" }}>
                            <h4 style={{ marginBottom: "1rem", color: "#333" }}>{selectedEventForQR.name}</h4>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", padding: "1rem", backgroundColor: "#fff", borderRadius: "8px" }}>
                                <QRCodeSVG value={selectedEventForQR.id} size={256} level="H" includeMargin />
                            </div>
                            <p style={{ fontSize: "0.9rem", color: "#666" }}>Scan this QR code to mark attendance for this event</p>
                        </div>
                        <div className="modal-footer">
                            <button className="event-btn-secondary" onClick={handleCloseQRModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
