import React, { useState, useEffect, useRef } from "react";
import "../css/studentMain.css";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import * as localDB from "../localStorage";
import { useNavigate } from "react-router-dom";
import ViewProfile from "./ViewProfile";
import AccountSettings from "./AccountSettings";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import Swal from "sweetalert2";


export default function StudentMain() {
    const [open, setOpen] = useState(false);
    const [photo, setPhoto] = useState("");
    const [name, setName] = useState("");
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [events, setEvents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);


    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/register");
            } else {
                setPhoto(user.photoURL || "");
                setName(user.displayName || "");
                fetchEventsAndAnnouncements();
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchEventsAndAnnouncements = async () => {
        const startTime = performance.now();
        
        try {
            const [eventsSnapshot, announcementsSnapshot] = await Promise.all([
                localDB.getDocs("events"),
                localDB.queryOrderLimit("announcements", "createdAt", "desc", 3)
            ]);
            
            const fetchTime = performance.now() - startTime;
            
            const eventsList = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            const upcomingEvents = eventsList.filter(event => {
                const eventDate = new Date(event.date);
                const today = new Date();
                return eventDate >= today && event.status !== "completed";
            });
            
            setEvents(upcomingEvents);

            const announcementsList = announcementsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAnnouncements(announcementsList);
        } catch (error) {
            console.error("Error fetching data:", error);
            setEvents([]);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("profileCompleted");
        navigate("/register");
    };

    const handleEventClick = (event) => {
        Swal.fire({
            title: event.name,
            html: `
                <div style="text-align: left; padding: 1rem;">
                    <p><strong>Description:</strong> ${event.description || "No description"}</p>
                    <p><strong>Date:</strong> ${event.date}</p>
                    <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <p><strong>Status:</strong> ${event.status || "upcoming"}</p>
                </div>
            `,
            icon: "info",
            confirmButtonText: "Close",
            confirmButtonColor: "#a900f7"
        });
    };

    return (
        <div className="umattend-student-page">
            <header className="umattend-student-navbar">
                <div className="umattend-student-left">
                    <span className="umattend-student-menu">☰</span>
                    <span
                        className="umattend-student-logo"
                        onClick={() => {
                            setShowProfile(false);
                            setShowSettings(false);
                        }}
                        style={{ cursor: "pointer" }}
                    >
                        <div className="header" style={{ fontSize: "18px", marginTop: "10px" }}>
                            <span className="um">JPCS</span>Connect
                        </div>
                    </span>
                </div>

                <div className="umattend-student-profile-wrap" ref={dropdownRef}>
                    <div
                        className="umattend-student-avatar"
                        onClick={() => setOpen(!open)}
                    >
                        {photo ? (
                            <img
                                src={photo}
                                alt="Profile"
                                className="umattend-student-avatar-img"
                            />
                        ) : (
                            <span>{name ? name.charAt(0).toUpperCase() : "U"}</span>
                        )}
                    </div>

                    {open && (
                        <div className="umattend-student-dropdown">
                            <div className="umattend-student-dropdown-header">
                                <div className="umattend-student-avatar large">
                                    {photo ? (
                                        <img
                                            src={photo}
                                            alt="Profile"
                                            className="umattend-student-avatar-img"
                                        />
                                    ) : (
                                        <span>{name ? name.charAt(0).toUpperCase() : "J"}</span>
                                    )}
                                </div>
                                <div className="umattend-student-user-name">
                                    {name || "User"}
                                </div>
                            </div>

                            <div
                                className="umattend-student-dropdown-item"
                                onClick={() => {
                                    setShowProfile(true);
                                    setShowSettings(false);
                                    setOpen(false);
                                }}
                            >
                                View Profile
                            </div>

                            <div
                                className="umattend-student-dropdown-item"
                                onClick={() => {
                                    setShowSettings(true);
                                    setShowProfile(false);
                                    setOpen(false);
                                }}
                            >
                                Account Settings
                            </div>

                            <div
                                className="umattend-student-dropdown-item umattend-student-logout"
                                onClick={handleLogout}
                            >
                                Sign Out
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <section className="umattend-student-content">
                {showProfile && (
                    <ViewProfile
                        name={name}
                        email={auth.currentUser?.email}
                        photo={photo}
                    />
                )}

                {showSettings && (
                    <AccountSettings
                        name={name}
                        email={auth.currentUser?.email}
                        photo={photo}
                    />
                )}

                {!showProfile && !showSettings && (
                    <>
                        {announcements.length > 0 && (
                            <div style={{ marginBottom: "2rem" }}>
                                <h2 className="umattend-student-title">Announcements</h2>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    {announcements.map((announcement) => (
                                        <div key={announcement.id} style={{
                                            background: "#fff",
                                            padding: "1.5rem",
                                            borderRadius: "12px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                            borderLeft: "4px solid #a900f7"
                                        }}>
                                            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "#333" }}>
                                                {announcement.title}
                                            </h3>
                                            <p style={{ margin: "0", color: "#6b7280", fontSize: "0.95rem" }}>
                                                {announcement.message}
                                            </p>
                                            <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#9ca3af" }}>
                                                {announcement.createdAt?.toDate()?.toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h2 className="umattend-student-title">Upcoming Events</h2>

                        {loading ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                Loading events...
                            </div>
                        ) : events.length === 0 ? (
                            <div className="umattend-student-empty">
                                <div className="umattend-student-calendar">
                                    <FaCalendarAlt />
                                </div>
                                <h3>No Upcoming Events</h3>
                                <p>
                                    There are no upcoming events at the moment.
                                    <br />
                                    Check back soon for new events!
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gap: "1.5rem" }}>
                                {events.map((event) => (
                                    <div 
                                        key={event.id} 
                                        onClick={() => handleEventClick(event)}
                                        style={{
                                            background: "#fff",
                                            padding: "1.5rem",
                                            borderRadius: "12px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                            cursor: "pointer",
                                            transition: "transform 0.2s, box-shadow 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(169,0,247,0.2)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                            <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#333" }}>
                                                {event.name}
                                            </h3>
                                            <span style={{
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "20px",
                                                fontSize: "0.85rem",
                                                fontWeight: "600",
                                                background: event.status === "ongoing" ? "#10b981" : "#a900f7",
                                                color: "#fff"
                                            }}>
                                                {event.status || "upcoming"}
                                            </span>
                                        </div>
                                        {event.description && (
                                            <p style={{ margin: "0 0 1rem 0", color: "#6b7280", fontSize: "0.95rem" }}>
                                                {event.description}
                                            </p>
                                        )}
                                        <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.9rem", color: "#6b7280" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <FaCalendarAlt style={{ color: "#a900f7" }} />
                                                {event.date}
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <FaClock style={{ color: "#a900f7" }} />
                                                {event.startTime} - {event.endTime}
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <FaMapMarkerAlt style={{ color: "#a900f7" }} />
                                                {event.location}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}


            </section>
        </div>
    );
}
