import React from "react";
import "../css/ViewProfile.css";
import { QRCodeCanvas } from "qrcode.react";
import { auth } from "../firebase";
import { MdEmail } from "react-icons/md";
import { FaUserGraduate } from "react-icons/fa";


export default function ViewProfile({ name, email, photo }) {
    const firstLetter = name ? name.charAt(0).toUpperCase() : "U";

    const qrValue = JSON.stringify({
        uid: auth.currentUser?.uid,
        email: email,
        role: "student"
    });

    return (
        <div className="umattend-viewprofile-wrapper">
            <div className="umattend-viewprofile-card">

                {/* HEADER */}
                <div className="umattend-viewprofile-header">
                    <div className="umattend-viewprofile-avatar">
                        {photo ? (
                            <img
                                src={photo}
                                alt="Profile"
                                className="umattend-viewprofile-avatar-img"
                            />
                        ) : (
                            <span>{firstLetter}</span>
                        )}
                    </div>

                    <div className="umattend-viewprofile-name">
                        {name || "User"}
                    </div>

                    <div className="umattend-viewprofile-sub">
                        Bachelor of Science in Computer Science<br />
                        Junior Philippine Computer Society
                    </div>

                    <button className="umattend-viewprofile-settings"> ⚙ Account Settings </button>
                </div>

                {/* QR SECTION */}
                <div className="qrpanel">
                    <div className="umattend-viewprofile-qrbox">
                        <QRCodeCanvas
                            value={qrValue}
                            size={180}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="H"
                            includeMargin={true}
                        />

                        <div className="umattend-viewprofile-qrtext">
                            <strong>Your Digital Pass</strong>
                            <p>
                                Use this QR code to check in and out of events. <br />
                                Event organizers can scan it to verify your attendance.
                            </p>
                        </div>

                    </div>

                    <div className="umattend-viewprofile-warning">
                        This QR code updates periodically for security, Always use the version shown in your account
                    </div>
                </div>

                <div className="umattend-viewprofile-info">
                    <div className="umattend-viewprofile-info-item">
                        <label>
                            <MdEmail className="umattend-viewprofile-info-icon" />
                            Email
                        </label>
                        <span>{email}</span>
                    </div>

                    <div className="umattend-viewprofile-info-item">
                        <label>
                            <FaUserGraduate className="umattend-viewprofile-info-icon" />
                            Member Type
                        </label>
                        <span>Student</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
