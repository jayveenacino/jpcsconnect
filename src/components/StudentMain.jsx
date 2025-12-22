import React, { useState, useEffect, useRef } from "react";
import "../css/studentMain.css";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import ViewProfile from "./ViewProfile";
import AccountSettings from "./AccountSettings";
import { FaCalendarAlt } from "react-icons/fa";

export default function StudentMain() {
    const [open, setOpen] = useState(false);
    const [photo, setPhoto] = useState("");
    const [name, setName] = useState("");
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
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

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("profileCompleted");
        navigate("/register", { replace: true });
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
                    </>
                )}
            </section>
        </div>
    );
}
