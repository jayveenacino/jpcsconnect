import { useEffect, useState } from "react";
import { FaUniversity, FaGraduationCap } from "react-icons/fa";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../css/profile.css";
import Swal from "sweetalert2";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";


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
            Swal.fire("Missing Student ID", "Please enter your student number", "warning");
            return;
        }

        if (!department) {
            Swal.fire("Missing Department", "Please select your department", "warning");
            return;
        }

        if (!program) {
            Swal.fire("Missing Program", "Please select your program", "warning");
            return;
        }

        const user = auth.currentUser;
        if (!user) return;

        try {
            const userRef = doc(db, "users", user.uid);

            await updateDoc(userRef, {
                studentId,
                department,
                program,
                profileCompleted: true,
                updatedAt: new Date()
            });

            Swal.fire({
                title: "Profile Completed",
                html: "Dashboard is preparing for you in <b></b> seconds...",
                icon: "success",
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                    const b = Swal.getHtmlContainer().querySelector("b");
                    let seconds = 3;
                    b.textContent = seconds;

                    const interval = setInterval(() => {
                        seconds--;
                        if (b) b.textContent = seconds;
                    }, 1000);

                    Swal.willClose = () => clearInterval(interval);
                },
                didClose: () => {
                    navigate("/student");
                }
            });

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to save profile", "error");
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

                <button className="logout-btn">Logout</button>

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
