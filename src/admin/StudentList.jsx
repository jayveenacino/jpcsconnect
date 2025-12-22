import React, { useState, useEffect } from "react";
import "./admincss/studentlist.css";
import Swal from "sweetalert2";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function AdminStudents() {
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const snapshot = await getDocs(collection(db, "users"), { source: "server" });

            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isRegistered: true,
                status: "Registered"
            }));

            setStudents(usersList);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching students:", error);
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        return (
            student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentId?.includes(searchTerm) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });


    return (
        <div className="student-list">
            <h2>Student Management</h2>

            <div className="student-controls">
                <input
                    className="search-input"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="student-stats">
                <div className="stat-box">
                    <span className="stat-number">{students.length}</span>
                    <span className="stat-text">Total Students</span>
                </div>
            </div>

            <div className="students-list">
                {loading ? (
                    <div style={{ padding: "2rem" }}>Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="no-results">
                        <h3>No Students Found</h3>
                    </div>
                ) : (
                    filteredStudents.map(student => {
                        const displayName =
                            student.displayName ||
                            student.email ||
                            student.studentId ||
                            "Unknown";

                        return (
                            <div key={student.id} className="student-list-item">
                                <div className="student-list-avatar">
                                    {student.photoURL ? (
                                        <img src={student.photoURL} alt={displayName} />
                                    ) : (
                                        <span>{displayName.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>

                                <div className="student-list-info">
                                    <div className="student-list-name">
                                        {student.studentId || "No ID"}
                                    </div>

                                    <div className="student-list-meta">
                                        <span>{displayName}</span>
                                        <span>•</span>
                                        <span>{student.email || "No email"}</span>
                                        <span>•</span>
                                        <span>{student.eventsAttended || 0} events</span>
                                        <span>•</span>
                                        <span className="student-status-badge registered">
                                            Registered
                                        </span>
                                    </div>
                                </div>

                                <div className="student-list-actions">
                                    <button
                                        className="action-btn-primary"
                                        onClick={() =>
                                            Swal.fire({
                                                title: displayName,
                                                html: `
                                                    <p><strong>Email:</strong> ${student.email || "N/A"}</p>
                                                    <p><strong>UID:</strong> ${student.firebaseUid}</p>
                                                `,
                                                confirmButtonColor: "#a900f7"
                                            })
                                        }
                                    >
                                        Profile
                                    </button>

                                    <button
                                        className="action-btn-secondary"
                                        onClick={async () => {
                                            const { value } = await Swal.fire({
                                                title: "Edit Student",
                                                html: `
                                                    <input id="n" class="swal2-input" value="${student.displayName || ""}">
                                                    <input id="i" class="swal2-input" value="${student.studentId || ""}">
                                                `,
                                                preConfirm: () => ({
                                                    displayName: document.getElementById("n").value,
                                                    studentId: document.getElementById("i").value
                                                }),
                                                showCancelButton: true,
                                                confirmButtonColor: "#a900f7"
                                            });

                                            if (value) {
                                                await updateDoc(doc(db, "users", student.id), value);
                                                fetchStudents();
                                            }
                                        }}
                                    >
                                        Edit
                                    </button>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
