import React, { useState } from "react";
import "../css/AccountSettings.css";
import { MdEmail, MdSecurity, MdOpenInNew, MdInfo } from "react-icons/md";
import { FaUserCircle, FaBell } from "react-icons/fa";
import sirJomar from "../assets/sirjomar.png";
import presJayvee from "../assets/presJayvee.png";
import devThomas from "../assets/thomas.png";
import devJae from "../assets/jae.png";

export default function AccountSettings({ name, email, photo }) {
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(true);

    const firstLetter = name ? name.charAt(0).toUpperCase() : "U";

    return (
        <>
            <div className="umattend-account-wrapper">
                <div className="umattend-account-card">

                    <div className="umattend-account-header">
                        <div className="umattend-account-avatar">
                            {photo ? (
                                <img
                                    src={photo}
                                    alt="Profile"
                                    className="umattend-account-avatar-img"
                                />
                            ) : (
                                <span>{firstLetter}</span>
                            )}
                        </div>

                        <div className="umattend-account-name">
                            Account Settings
                        </div>

                        <div className="umattend-account-sub">
                            Google-connected account
                        </div>
                    </div>

                    <div className="umattend-account-info">


                        <div className="umattend-account-info-item">
                            <label>
                                <MdSecurity className="umattend-account-icon" />
                                Security
                            </label>
                            <span>Managed by Google</span>
                        </div>

                        <div className="umattend-account-info-item">
                            <label>
                                <MdOpenInNew className="umattend-account-icon" />
                                Google Account
                            </label>
                            <button
                                className="umattend-account-action"
                                onClick={() =>
                                    window.open(
                                        "https://myaccount.google.com",
                                        "_blank",
                                        "noopener,noreferrer"
                                    )
                                }
                            >
                                Manage Google Account
                            </button>
                        </div>

                        <div className="umattend-account-info-item">
                            <label>
                                <MdInfo className="umattend-account-icon" />
                                About
                            </label>
                            <button
                                className="umattend-account-action"
                                onClick={() => setShowAboutModal(true)}
                            >
                                About This App
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {showNotifModal && (
                <div className="umattend-modal-overlay">
                    <div className="umattend-modal">
                        <h3>Notification Preferences</h3>

                        <div className="umattend-toggle-row">
                            <span>Email Notifications</span>
                            <input
                                type="checkbox"
                                checked={notifEnabled}
                                onChange={() => setNotifEnabled(!notifEnabled)}
                            />
                        </div>

                        <div className="umattend-modal-actions">
                            <button
                                onClick={() => setShowNotifModal(false)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAboutModal && (
                <div
                    className="umattend-modal-overlay"
                    onClick={() => setShowAboutModal(false)}
                >
                    <div
                        className="umattend-modal umattend-about-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <h3>About this App</h3>

                        <div className="umattend-org-chart">

                            {/* ADVISER */}
                            <div className="umattend-org-level">
                                <div className="umattend-org-node">
                                    <img src={sirJomar} alt="Jomar Gonzaga" />
                                    <strong>Jomar Gonzaga</strong>
                                    <span>JPCS Adviser & Dev Ops (Faculty)</span>
                                </div>
                            </div>

                            {/* PRESIDENT */}
                            <div className="umattend-org-level">
                                <div className="umattend-org-node">
                                    <img src={presJayvee} alt="Jayvee Madriaga Nacino" />
                                    <strong>Jayvee Madriaga Nacino</strong>
                                    <span>JPCS President & Lead Developer</span>
                                </div>
                            </div>

                            {/* DEVELOPERS */}
                            <div className="umattend-org-level umattend-org-row">

                                <div className="umattend-org-node">
                                    <img src={devThomas} alt="John Thomas Alog" />
                                    <strong>John Thomas Alog</strong>
                                    <span>API Integrations & Backend Developer</span>
                                </div>

                                <div className="umattend-org-node">
                                    <img src={devJae} alt="Jan Emyl Dela Cruz" />
                                    <strong>Jan Emyl Dela Cruz</strong>
                                    <span>Full Stack Developer</span>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>
            )}

        </>
    );
}
