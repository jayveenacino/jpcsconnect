import React, { useState, useEffect } from "react";
import "./admincss/event.css";
import Swal from "sweetalert2";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    where
} from "firebase/firestore";
import { db } from "../firebase";

export default function CreateEvent() {
    const [showForm, setShowForm] = useState(false);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const [showAttendeesModal, setShowAttendeesModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);

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
            const list = [];

            for (const d of snapshot.docs) {
                const regQuery = query(
                    collection(db, "registrations"),
                    where("eventId", "==", d.id)
                );
                const regSnap = await getDocs(regQuery);

                list.push({
                    id: d.id,
                    ...d.data(),
                    attendees: regSnap.size
                });
            }

            // Sort: Upcoming first, then completed
            list.sort((a, b) => {
                if (a.status === "completed" && b.status !== "completed") return 1;
                if (a.status !== "completed" && b.status === "completed") return -1;
                return b.createdAt?.seconds - a.createdAt?.seconds; // Newest first
            });

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
                    createdAt: serverTimestamp()
                });
                Swal.fire("Created!", "Event created successfully", "success");
            }

            // Reset form and editing state
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

    const handleCancelForm = () => {
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

    const openAttendeesModal = async (event) => {
        setSelectedEvent(event);

        const q = query(
            collection(db, "registrations"),
            where("eventId", "==", event.id)
        );
        const snap = await getDocs(q);

        const list = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        setAttendees(list);
        setShowAttendeesModal(true);
    };

    const closeAttendeesModal = () => {
        setShowAttendeesModal(false);
        setSelectedEvent(null);
        setAttendees([]);
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
                <button
                    className="create-event-btn"
                    onClick={() => {
                        if (showForm) {
                            handleCancelForm();
                        } else {
                            setShowForm(true);
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
                        <input name="name" value={formData.name} placeholder="Event Title" onChange={handleInputChange} required />
                        <input name="location" value={formData.location} placeholder="Event Location" onChange={handleInputChange} required />
                        <textarea name="description" value={formData.description} placeholder="Event Description" onChange={handleInputChange} />
                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required />

                        <button type="submit">{editingEvent ? "Update" : "Create"}</button>
                    </form>
                </div>
            )}

            <div className="events-list">
                {loading ? (
                    <p>Loading events...</p>
                ) : (
                    events.map(event => {
                        const badge = getStatusBadge(event.status);

                        return (
                            <div key={event.id} className="event-card">
                                <h3>{event.name}</h3>
                                <span className={`status-badge ${badge.className}`}>{badge.label}</span>
                                <p><strong>Attendees:</strong> {event.attendees}</p>

                                <div className="event-actions">
                                    <button className="event-btn-secondary" onClick={() => openAttendeesModal(event)}>
                                        View Attendees
                                    </button>
                                    <button className="event-btn-secondary" onClick={() => handleEdit(event)}>
                                        Edit
                                    </button>
                                    <button className="event-btn-secondary"
                                        onClick={async () => {
                                            const res = await Swal.fire({
                                                title: "Mark event as done?",
                                                text: "This will prevent further registrations.",
                                                icon: "warning",
                                                showCancelButton: true,
                                                confirmButtonColor: "#28a745",
                                                confirmButtonText: "Yes, done"
                                            });

                                            if (res.isConfirmed) {
                                                await updateDoc(doc(db, "events", event.id), { status: "completed" });
                                                Swal.fire("Done!", "Event marked as completed.", "success");
                                                fetchEvents();
                                            }
                                        }}>
                                        Mark Done
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

            {showAttendeesModal && selectedEvent && (
                <div className="modal-overlay" onClick={closeAttendeesModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{selectedEvent.name} – Attendees</h3>

                        {attendees.length === 0 ? (
                            <p>No students registered</p>
                        ) : (
                            <table className="attendees-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student Name</th>
                                        <th>Student ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendees.map((a, i) => (
                                        <tr key={a.id}>
                                            <td>{i + 1}</td>
                                            <td>{a.studentName}</td>
                                            <td>{a.studentId}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <button className="event-btn-secondary" onClick={closeAttendeesModal}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
