import React, { useState, useEffect } from "react";
import "../css/AdminEvents.css";
import * as localDB from "../localStorage";
import Swal from "sweetalert2";
import { QRCodeSVG } from "qrcode.react";

export default function AdminEvents() {
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
            const snapshot = await localDB.getDocs("events");
            const eventsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsList);
        } catch (error) {
            console.error("Error fetching events:", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            if (editingEvent) {
                // Update existing event
                await localDB.updateDoc("events", editingEvent.id, formData);
                
                await Swal.fire({
                    icon: "success",
                    title: "Event Updated Successfully!",
                    text: `${formData.name} has been updated`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                // Create new event
                const newEvent = {
                    ...formData,
                    status: "upcoming",
                    attendees: 0,
                    createdAt: new Date().toISOString()
                };
                
                await localDB.addDoc("events", newEvent);
                
                await Swal.fire({
                    icon: "success",
                    title: "Event Created Successfully!",
                    text: `${formData.name} has been added`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            
            // Reset form and close
            setFormData({
                name: "",
                description: "",
                date: "",
                startTime: "",
                location: ""
            });
            setShowForm(false);
            setEditingEvent(null);
            
            // Refresh events list
            await fetchEvents();
        } catch (error) {
            console.error("Error saving event:", error);
            Swal.fire({
                icon: "error",
                title: "Error Saving Event",
                text: error.message || "Failed to save event. Please try again.",
                confirmButtonColor: "#a900f7"
            });
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

    const handleViewQR = (event) => {
        setSelectedEventForQR(event);
        setShowQRModal(true);
    };

    const handleCloseQRModal = () => {
        setShowQRModal(false);
        setSelectedEventForQR(null);
    };

    const handleDelete = async (eventId) => {
        const result = await Swal.fire({
            title: "Delete Event?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete"
        });

        if (result.isConfirmed) {
            try {
                await localDB.deleteDoc("events", eventId);
                Swal.fire("Deleted!", "Event has been deleted.", "success");
                fetchEvents();
            } catch (error) {
                console.error("Error deleting event:", error);
                Swal.fire("Error", "Failed to delete event", "error");
            }
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            upcoming: { label: "Upcoming", className: "status-upcoming" },
            ongoing: { label: "Ongoing", className: "status-ongoing" },
            completed: { label: "Completed", className: "status-completed" }
        };
        return badges[status] || badges.upcoming;
    };

    return (
        <div className="event-management">
            <div className="event-header">
                <h2>Event Management</h2>
                <button
                    className="create-event-btn"
                    onClick={() => {
                        if (showForm && editingEvent) {
                            handleCancelEdit();
                        } else {
                            setShowForm(!showForm);
                        }
                    }}
                >
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
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Location *</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={submitting}
                            >
                                {submitting ? (editingEvent ? "Updating..." : "Creating...") : (editingEvent ? "Update Event" : "Create Event")}
                            </button>
                            {editingEvent && (
                                <button 
                                    type="button"
                                    className="event-btn-secondary"
                                    onClick={handleCancelEdit}
                                    style={{ marginLeft: "1rem" }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="events-list">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        Loading events...
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        No events yet
                    </div>
                ) : (
                    events.map((event) => {
                        const statusBadge = getStatusBadge(event.status);
                        return (
                            <div key={event.id} className="event-card">
                                <div className="event-card-header">
                                    <h3>{event.name}</h3>
                                    <span className={`status-badge ${statusBadge.className}`}>
                                        {statusBadge.label}
                                    </span>
                                </div>

                                <div className="event-details">
                                    <div className="event-detail-item">
                                        <span className="detail-label">Date:</span>
                                        <span>{event.date}</span>
                                    </div>
                                    <div className="event-detail-item">
                                        <span className="detail-label">Time:</span>
                                        <span>{event.startTime}</span>
                                    </div>
                                    <div className="event-detail-item">
                                        <span className="detail-label">Location:</span>
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="event-detail-item">
                                        <span className="detail-label">Attendees:</span>
                                        <span>{event.attendees || 0}</span>
                                    </div>
                                </div>

                                <div className="event-actions">
                                    <button 
                                        className="event-btn-secondary"
                                        onClick={() => handleViewQR(event)}
                                    >
                                        View QR
                                    </button>
                                    <button 
                                        className="event-btn-secondary"
                                        onClick={() => handleEdit(event)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="event-btn-danger"
                                        onClick={() => handleDelete(event.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* QR Code Modal */}
            {showQRModal && selectedEventForQR && (
                <div className="modal-overlay" onClick={handleCloseQRModal}>
                    <div className="modal-content qr-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Event QR Code</h3>
                            <button className="modal-close" onClick={handleCloseQRModal}>
                                &times;
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: "center", padding: "2rem" }}>
                            <h4 style={{ marginBottom: "1rem", color: "#333" }}>{selectedEventForQR.name}</h4>
                            <div style={{ 
                                display: "flex", 
                                justifyContent: "center", 
                                marginBottom: "1rem",
                                padding: "1rem",
                                backgroundColor: "#fff",
                                borderRadius: "8px"
                            }}>
                                <QRCodeSVG 
                                    value={selectedEventForQR.id} 
                                    size={256}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            <p style={{ fontSize: "0.9rem", color: "#666" }}>
                                Scan this QR code to mark attendance for this event
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="event-btn-secondary" 
                                onClick={handleCloseQRModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

