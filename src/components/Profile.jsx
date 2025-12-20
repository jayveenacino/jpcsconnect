import { useEffect, useState } from "react";
import { FaUniversity, FaGraduationCap } from "react-icons/fa";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../css/profile.css";
import Swal from "sweetalert2";

export default function Profile() {
    const [fullName, setFullName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");
    const [photo, setPhoto] = useState("");
    const [department, setDepartment] = useState("");
    const [program, setProgram] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setFullName(user.displayName || "");
                setEmail(user.email || "");
                setPhoto(user.photoURL || "");
            }
        });

        return () => unsubscribe();
    }, []);

    const handleStudentIdChange = (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 6) value = value.slice(0, 6);
        if (value.length > 2) {
            value = value.slice(0, 2) + "-" + value.slice(2);
        }
        setStudentId(value);
    };

    const handleSubmit = async () => {
        if (!studentId.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Missing Student ID",
                text: "Please enter your student number",
            });
            return;
        }

        if (!department) {
            Swal.fire({
                icon: "warning",
                title: "Missing Department",
                text: "Please select your department",
            });
            return;
        }

        if (!program) {
            Swal.fire({
                icon: "warning",
                title: "Missing Program",
                text: "Please select your program",
            });
            return;
        }

        try {
            const user = auth.currentUser;
            if (user) {
                // Save to Firebase for backup
                await setDoc(doc(db, "users", user.uid), {
                    displayName: fullName,
                    email: email,
                    studentId: studentId,
                    department: department,
                    program: program,
                    photoURL: photo,
                    createdAt: new Date().toISOString(),
                    eventsAttended: 0
                });

                // Also save to localStorage with studentId as key
                const existingUsers = JSON.parse(localStorage.getItem('jpcs_users') || '[]');
                const userIndex = existingUsers.findIndex(u => u.id === user.uid);
                const userData = {
                    id: user.uid,
                    displayName: fullName,
                    email: email,
                    studentId: studentId,
                    fullName: fullName,
                    department: department,
                    program: program,
                    photoURL: photo,
                    createdAt: new Date().toISOString(),
                    eventsAttended: 0,
                    firebaseUid: user.uid
                };

                if (userIndex !== -1) {
                    existingUsers[userIndex] = userData;
                } else {
                    existingUsers.push(userData);
                }
                localStorage.setItem('jpcs_users', JSON.stringify(existingUsers));
            }

            Swal.fire({
                icon: "success",
                title: "Profile Completed",
                text: "Your profile information has been saved",
                confirmButtonText: "Continue",
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.setItem("profileCompleted", "true");
                    navigate("/student");
                }
            });
        } catch (error) {
            console.error("Error saving profile:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to save profile. Please try again.",
            });
        }
    };

    return (
        <div className="profile-wrapper">
            <div className="profile-card">
                <h2 className="profile-title">Complete Your Profile</h2>
                <p className="profile-sub">
                    Help us personalize your experience by providing your academic information
                </p>

                <hr />

                <h3 className="section-title">Academic Information</h3>
                <p className="section-sub">
                    Your information is securely stored and will only be used for event management
                </p>

                <div className="info-box">
                    {photo ? (
                        <img src={photo} alt="profile" className="avatar-img" />
                    ) : (
                        <div className="avatar">
                            {fullName ? fullName.charAt(0) : "U"}
                        </div>
                    )}

                    <div className="info-grid">
                        <div className="info-item">
                            <label>FULL NAME</label>
                            <input
                                type="text"
                                className="info-input"
                                value={fullName}
                                readOnly
                            />
                        </div>

                        <div className="info-item">
                            <label>STUDENT NUMBER</label>
                            <input
                                type="text"
                                className="info-input"
                                placeholder="00-0000"
                                value={studentId}
                                onChange={handleStudentIdChange}
                            />
                        </div>

                        <div className="info-item full">
                            <label>EMAIL</label>
                            <input
                                type="email"
                                className="info-input"
                                value={email}
                                disabled
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="label-with-icon">
                        <FaUniversity className="label-icon" />
                        <span style={{ color: "black" }}>Department</span>{" "}
                        <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                    >
                        <option value="">Select your department</option>
                        <option>Bachelor of Science in Computer Science</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="label-with-icon">
                        <FaGraduationCap className="label-icon" />
                        <span style={{ color: "black" }}>Program</span>{" "}
                        <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                    >
                        <option value="">Please select a department first</option>
                        <option>Junior Philippine Computer Society</option>
                    </select>
                </div>

                <button className="submit-btn" onClick={handleSubmit}>
                    Continue to Dashboard
                </button>

                <button 
                    className="logout-btn"
                    onClick={async () => {
                        await signOut(auth);
                        localStorage.removeItem("profileCompleted");
                        navigate("/register");
                    }}
                >
                    Logout
                </button>

                <p className="terms">
                    By continuing, you agree to our{" "}
                    <a href="#">Terms of Service</a> and{" "}
                    <a href="#">Privacy Policy</a>
                </p>

                <p className="support">
                    Need assistance? <a href="#">Contact Support</a>
                </p>
            </div>
        </div>
    );
}
