import React, { useState, useEffect } from "react";
import "../css/AdminAnnouncements.css";
import Swal from "sweetalert2";
import * as localDB from "../localStorage";

export default function AdminAnnouncements() {
    const [showForm, setShowForm] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        priority: "normal",
        recipients: "all"
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const snapshot = await localDB.getDocs("announcements");
            const announcementsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            announcementsList.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
            setAnnouncements(announcementsList);
        } catch (error) {
            console.error("Error fetching announcements:", error);
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

        try {
            await localDB.addDoc("announcements", {
                ...formData,
                author: "Admin Team",
                views: 0,
                status: "sent",
                createdAt: new Date()
            });
            
            Swal.fire({
                icon: "success",
                title: "Announcement Sent",
                text: `Your announcement has been sent to ${formData.recipients === "all" ? "all students" : "selected recipients"}`,
                confirmButtonText: "OK",
                confirmButtonColor: "#a900f7"
            }).then(() => {
                setShowForm(false);
                setFormData({
                    title: "",
                    message: "",
                    priority: "normal",
                    recipients: "all"
                });
                fetchAnnouncements();
            });
        } catch (error) {
            console.error("Error sending announcement:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to send announcement. Please try again.",
                confirmButtonColor: "#a900f7"
            });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Announcement?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete"
        });

        if (result.isConfirmed) {
            try {
                await localDB.deleteDoc("announcements", id);
                Swal.fire({
                    icon: "success",
                    title: "Deleted!",
                    text: "Announcement has been deleted.",
                    confirmButtonColor: "#a900f7"
                });
                fetchAnnouncements();
            } catch (error) {
                console.error("Error deleting announcement:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to delete announcement.",
                    confirmButtonColor: "#a900f7"
                });
            }
        }
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            high: { label: "High Priority", className: "priority-high" },
            normal: { label: "Normal", className: "priority-normal" },
            low: { label: "Low Priority", className: "priority-low" }
        };
        return badges[priority];
    };

    return (
        <div className="announcements-view">
            <div className="announcements-header">
                <h2>Announcements</h2>
                <button
                    className="create-announcement-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? "Cancel" : "+ New Announcement"}
                </button>
            </div>

            {showForm && (
                <div className="announcement-form-card">
                    <h3>Create New Announcement</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Message *</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows="5"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High Priority</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Recipients</label>
                                <select
                                    name="recipients"
                                    value={formData.recipients}
                                    onChange={handleInputChange}
                                >
                                    <option value="all">All Students</option>
                                    <option value="active">Active Members Only</option>
                                    <option value="specific">Specific Students</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="send-btn">
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="announcement-stats">
                <div className="stat-card">
                    <div className="stat-value">{announcements.length}</div>
                    <div className="stat-label">Total Sent</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {announcements.length > 0 ? Math.round(announcements.reduce((sum, a) => sum + (a.views || 0), 0) / announcements.length) : 0}
                    </div>
                    <div className="stat-label">Avg. Views</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {announcements.length > 0 ? Math.round((announcements.reduce((sum, a) => sum + (a.views || 0), 0) / (announcements.length * 156)) * 100) : 0}%
                    </div>
                    <div className="stat-label">View Rate</div>
                </div>
            </div>

            <div className="announcements-list">
                <h3>Recent Announcements</h3>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        Loading announcements...
                    </div>
                ) : announcements.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        No announcements yet
                    </div>
                ) : (
                    announcements.map((announcement) => {
                        const priorityBadge = getPriorityBadge(announcement.priority);
                        const date = announcement.createdAt ? new Date(announcement.createdAt) : null;
                        return (
                            <div key={announcement.id} className="announcement-card">
                                <div className="announcement-header">
                                    <div className="announcement-title-section">
                                        <h4>{announcement.title}</h4>
                                        <span className={`priority-badge ${priorityBadge.className}`}>
                                            {priorityBadge.label}
                                        </span>
                                    </div>
                                    <div className="announcement-meta">
                                        <span className="announcement-date">
                                            {date ? date.toLocaleDateString() : "N/A"} at {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="announcement-body">
                                    <p>{announcement.message}</p>
                                </div>

                                <div className="announcement-footer">
                                    <div className="announcement-info">
                                        <span className="info-item">
                                            By: {announcement.author}
                                        </span>
                                        <span className="info-item">
                                            {announcement.views || 0} views
                                        </span>
                                        <span className="info-item">
                                            Sent to: {announcement.recipients === "all" ? "All Students" : "Selected"}
                                        </span>
                                    </div>
                                    <div className="announcement-actions">
                                        <button className="action-btn-secondary">View Details</button>
                                        <button className="action-btn-secondary">Edit</button>
                                        <button 
                                            className="action-btn-danger"
                                            onClick={() => handleDelete(announcement.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
