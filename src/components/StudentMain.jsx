import React, { useState, useEffect } from "react";
import "../css/StudentMain.css";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import ViewProfile from "./ViewProfile";

export default function StudentMain() {
    const [open, setOpen] = useState(false);
    const [photo, setPhoto] = useState("");
    const [name, setName] = useState("");
    const [showProfile, setShowProfile] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate("/register");
            } else {
                setPhoto(user.photoURL || "");
                setName(user.displayName || "");
                console.log("PHOTO URL:", user.photoURL); // debug
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem("profileCompleted");
        navigate("/register");
    };

    return (
        <div className="umattend-student-page">
            {/* NAVBAR */}
            <header className="umattend-student-navbar">
                <div className="umattend-student-left">
                    <span className="umattend-student-menu">☰</span>
                    <span
                        className="umattend-student-logo"
                        onClick={() => setShowProfile(false)}
                        style={{ cursor: "pointer" }}
                    >
                        <span className="umattend-student-logo-highlight">JPCS</span>Connect
                    </span>

                </div>

                <div className="umattend-student-profile-wrap">
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
                                        <span>{name ? name.charAt(0).toUpperCase() : "U"}</span>
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
                                    setOpen(false);
                                }}
                            >
                                View Profile
                            </div>

                            <div className="umattend-student-dropdown-item">
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

            {/* CONTENT */}
            <section className="umattend-student-content">
                {showProfile ? (
                    <ViewProfile
                        name={name}
                        email={auth.currentUser?.email}
                        photo={photo}
                        onBack={() => setShowProfile(false)}
                    />
                ) : (
                    <>
                        <h2 className="umattend-student-title">Events</h2>

                        <div className="umattend-student-empty">
                            <div className="umattend-student-calendar">📅</div>
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
