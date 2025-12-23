import React, { useState, useEffect, useRef } from "react";
import "../css/studentMain.css";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import ViewProfile from "./ViewProfile";
import AccountSettings from "./AccountSettings";
import { FaCalendarAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

export default function StudentMain() {
    const [open, setOpen] = useState(false);
    const [photo, setPhoto] = useState("");
    const [name, setName] = useState("");
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/register", { replace: true });
            } else {
                setPhoto(user.photoURL || "");
                setName(user.displayName || "");
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventQuery = query(
                    collection(db, "events"),
                    where("status", "in", ["upcoming", "ongoing"])
                );
                const eventSnap = await getDocs(eventQuery);
                const eventList = eventSnap.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }));
                setEvents(eventList);

                const regQuery = query(
                    collection(db, "registrations"),
                    where("studentId", "==", auth.currentUser.uid)
                );
                const regSnap = await getDocs(regQuery);
                const regEventIds = regSnap.docs.map(d => d.data().eventId);
                setRegisteredEvents(regEventIds);

            } catch {
                setEvents([]);
            } finally {
                setLoadingEvents(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("profileCompleted");
        navigate("/register", { replace: true });
    };

    const handleRegister = async (event) => {
        const res = await Swal.fire({
            title: "Register for this event?",
            text: event.name,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            confirmButtonColor: "#28a745"
        });

        if (!res.isConfirmed) return;

        try {
            await addDoc(collection(db, "registrations"), {
                eventId: event.id,
                eventName: event.name,
                studentId: auth.currentUser.uid,
                studentName: name,
                createdAt: serverTimestamp()
            });

            setRegisteredEvents(prev => [...prev, event.id]);

            Swal.fire("Registered!", "You are successfully registered.", "success");
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
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
                            <img src={photo} alt="Profile" className="umattend-student-avatar-img" />
                        ) : (
                            <span>{name ? name.charAt(0).toUpperCase() : "U"}</span>
                        )}
                    </div>

                    {open && (
                        <div className="umattend-student-dropdown">
                            <div className="umattend-student-dropdown-header">
                                <div className="umattend-student-avatar large">
                                    {photo ? (
                                        <img src={photo} alt="Profile" className="umattend-student-avatar-img" />
                                    ) : (
                                        <span>{name ? name.charAt(0).toUpperCase() : "J"}</span>
                                    )}
                                </div>
                                <div className="umattend-student-user-name">{name || "User"}</div>
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
                        <h2 className="umattend-student-title">Events</h2>

                        {loadingEvents ? (
                            <p>Loading events...</p>
                        ) : events.length === 0 ? (
                            <div className="umattend-student-empty">
                                <div className="umattend-student-calendar">
                                    <FaCalendarAlt />
                                </div>
                                <h3>No Upcoming Events</h3>
                                <p>Check back soon for new events!</p>
                            </div>
                        ) : (
                            <div className="student-event-list">
                                {events.map(event => {
                                    const isRegistered = registeredEvents.includes(event.id);

                                    return (
                                        <div key={event.id} className="student-event-card">
                                            <div className="student-event-card-header">
                                                <h3>{event.name}</h3>
                                            </div>

                                            {event.description && (
                                                <p className="student-event-description">{event.description}</p>
                                            )}

                                            <div className="student-event-details">
                                                <div><strong>Date:</strong> {event.date}</div>
                                                <div>
                                                    <strong>Time:</strong>{" "}
                                                    {(() => {
                                                        if (!event.startTime) return "";
                                                        const [hour, minute] = event.startTime.split(":").map(Number);
                                                        const ampm = hour >= 12 ? "PM" : "AM";
                                                        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                                                        return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
                                                    })()}
                                                </div>

                                                <div><strong>Location:</strong> {event.location}</div>
                                            </div>

                                            <button
                                                className={`register-btn ${isRegistered ? "registered" : ""}`}
                                                disabled={isRegistered}
                                                onClick={() => handleRegister(event)}
                                            >
                                                {isRegistered ? "✅ REGISTERED" : "Register Now"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
