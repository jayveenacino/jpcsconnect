import React, { useState, useEffect } from "react";
import "../css/AdminStudents.css";
import * as localDB from "../localStorage";
import Swal from "sweetalert2";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminStudents() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("all");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const snapshot = await localDB.getDocs("users");
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            const studentsWithStatus = usersList.map(student => ({
                ...student,
                isRegistered: !!student.firebaseUid,
                status: student.firebaseUid ? 'Registered' : 'Unregistered'
            }));
            
            setStudents(studentsWithStatus);
            setLoading(false);
            
            syncWithFirebase(usersList);
        } catch (error) {
            console.error("Error fetching students:", error);
            setLoading(false);
        }
    };

    const syncWithFirebase = async (currentUsers) => {
        try {
            const firebaseUsersRef = collection(db, "users");
            const firebaseSnapshot = await getDocs(firebaseUsersRef);
            
            const firebaseUsersMap = {};
            firebaseSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.studentId) {
                    firebaseUsersMap[data.studentId] = {
                        firebaseUid: doc.id,
                        ...data
                    };
                }
            });
            
            let hasUpdates = false;
            
            for (const localUser of currentUsers) {
                if (localUser.studentId && firebaseUsersMap[localUser.studentId]) {
                    const firebaseData = firebaseUsersMap[localUser.studentId];
                    
                    const needsUpdate = 
                        localUser.firebaseUid !== firebaseData.firebaseUid ||
                        localUser.displayName !== firebaseData.displayName ||
                        localUser.email !== firebaseData.email ||
                        localUser.photoURL !== firebaseData.photoURL;
                    
                    if (needsUpdate) {
                        hasUpdates = true;
                        await localDB.updateDoc("users", localUser.id, {
                            ...localUser,
                            firebaseUid: firebaseData.firebaseUid,
                            displayName: firebaseData.displayName || localUser.displayName,
                            email: firebaseData.email || localUser.email,
                            photoURL: firebaseData.photoURL || localUser.photoURL
                        });
                    }
                }
            }
            
            if (hasUpdates) {
                const updatedSnapshot = await localDB.getDocs("users");
                const updatedUsersList = updatedSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const studentsWithStatus = updatedUsersList.map(student => ({
                    ...student,
                    isRegistered: !!student.firebaseUid,
                    status: student.firebaseUid ? 'Registered' : 'Unregistered'
                }));
                
                setStudents(studentsWithStatus);
            }
        } catch (firebaseError) {
            console.warn("Firebase sync skipped:", firebaseError);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.studentId?.includes(searchTerm);
        return matchesSearch;
    });

    return (
        <div className="student-list">
            <h2>Student Management</h2>

            <div className="student-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="student-stats">
                <div className="stat-box">
                    <span className="stat-number">{students.length}</span>
                    <span className="stat-text">Total Students</span>
                </div>
                <div className="stat-box">
                    <span className="stat-number">{filteredStudents.length}</span>
                    <span className="stat-text">Recently Registered</span>
                </div>
            </div>

            <div className="students-list">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                        Loading students...
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="no-results">
                        <h3>No Students Found</h3>
                    </div>
                ) : (
                    filteredStudents.map((student) => {
                        const displayName = student.displayName || student.email || student.studentId || "Unknown";
                        return (
                        <div key={student.id} className="student-list-item">
                            <div className="student-list-avatar">
                                {student.photoURL ? (
                                    <img src={student.photoURL} alt={displayName} />
                                ) : (
                                    <span>{displayName?.charAt(0).toUpperCase() || "S"}</span>
                                )}
                            </div>
                            
                            <div className="student-list-info">
                                <div className="student-list-name" style={{
                                    fontSize: "18px",
                                    fontWeight: "700",
                                    color: "#222",
                                    marginBottom: "6px"
                                }}>
                                    {student.studentId || "No ID"}
                                </div>
                                <div className="student-list-meta">
                                    <span className="student-meta-item" style={{
                                        fontWeight: "500",
                                        color: "#374151"
                                    }}>
                                        {displayName}
                                    </span>
                                    <span className="student-meta-separator">•</span>
                                    <span className="student-meta-item">{student.email || "No email"}</span>
                                    <span className="student-meta-separator">•</span>
                                    <span className="student-meta-item">{student.eventsAttended || 0} events</span>
                                    <span className="student-meta-separator">•</span>
                                    <span className={`student-status-badge ${student.isRegistered ? 'registered' : 'unregistered'}`}>
                                        {student.status}
                                    </span>
                                </div>
                            </div>

                            
                            <div className="student-list-actions">
                                <button 
                                    className="action-btn-primary"
                                    onClick={() => {
                                        Swal.fire({
                                            title: displayName,
                                            html: `
                                                <div style="text-align: left; padding: 1rem;">
                                                    <p><strong>Student ID:</strong> ${student.studentId || "N/A"}</p>
                                                    <p><strong>Email:</strong> ${student.email || "N/A"}</p>
                                                    <p><strong>Events Attended:</strong> ${student.eventsAttended || 0}</p>
                                                    <p><strong>Status:</strong> ${student.status || "Active"}</p>
                                                </div>
                                            `,
                                            icon: "info",
                                            confirmButtonColor: "#a900f7"
                                        });
                                    }}
                                >
                                    Profile
                                </button>
                                <button 
                                    className="action-btn-secondary"
                                    onClick={async () => {
                                        const { value: formValues } = await Swal.fire({
                                            title: 'Edit Student Information',
                                            html: `
                                                <input id="swal-input-name" class="swal2-input" placeholder="Full Name" value="${student.displayName || ''}">
                                                <input id="swal-input-studentid" class="swal2-input" placeholder="Student ID" value="${student.studentId || ''}">
                                                <input id="swal-input-email" class="swal2-input" placeholder="Email" value="${student.email || ''}">
                                            `,
                                            focusConfirm: false,
                                            showCancelButton: true,
                                            confirmButtonColor: "#a900f7",
                                            cancelButtonColor: "#6b7280",
                                            confirmButtonText: "Save",
                                            preConfirm: () => {
                                                return {
                                                    displayName: document.getElementById('swal-input-name').value,
                                                    studentId: document.getElementById('swal-input-studentid').value,
                                                    email: document.getElementById('swal-input-email').value
                                                };
                                            }
                                        });
                                        
                                        if (formValues) {
                                            try {
                                                const oldStudentId = student.studentId;
                                                
                                                await localDB.updateDoc("users", student.id, {
                                                    ...student,
                                                    ...formValues
                                                });
                                                
                                                await localDB.updateStudentAttendance(oldStudentId, formValues);
                                                
                                                Swal.fire({
                                                    icon: "success",
                                                    title: "Updated!",
                                                    text: "Student information and attendance records have been updated.",
                                                    confirmButtonColor: "#a900f7"
                                                });
                                                fetchStudents();
                                            } catch (error) {
                                                console.error("Error updating student:", error);
                                                Swal.fire({
                                                    icon: "error",
                                                    title: "Error",
                                                    text: "Failed to update student information.",
                                                    confirmButtonColor: "#a900f7"
                                                });
                                            }
                                        }
                                    }}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="action-btn-secondary"
                                    onClick={async () => {
                                        try {
                                            const attendanceSnapshot = await localDB.queryWhere(
                                                "attendance",
                                                "studentId",
                                                "==",
                                                student.studentId
                                            );
                                            const attendanceList = attendanceSnapshot.docs.map(doc => doc.data());
                                            
                                            if (attendanceList.length === 0) {
                                                Swal.fire({
                                                    title: "No Attendance History",
                                                    text: "This student has not attended any events yet.",
                                                    icon: "info",
                                                    confirmButtonColor: "#a900f7"
                                                });
                                                return;
                                            }
                                            
                                            // Get all events to map event IDs to names
                                            const eventsSnapshot = await localDB.getDocs("events");
                                            const eventsMap = {};
                                            eventsSnapshot.docs.forEach(doc => {
                                                eventsMap[doc.id] = doc.data().name;
                                            });
                                            
                                            const historyHtml = attendanceList.map((att, index) => {
                                                const eventName = eventsMap[att.eventId] || "Unknown Event";
                                                const checkInDate = att.checkIn ? new Date(att.checkIn) : null;
                                                return `
                                                    <div style="padding: 1rem; margin-bottom: 0.75rem; background: #f9fafb; border-left: 4px solid #a900f7; border-radius: 6px; text-align: left;">
                                                        <div style="font-size: 15px; font-weight: 600; color: #222; margin-bottom: 0.5rem;">
                                                            ${index + 1}. ${eventName}
                                                        </div>
                                                        <div style="font-size: 13px; color: #6b7280;">
                                                            <strong>Date:</strong> ${checkInDate ? checkInDate.toLocaleDateString() : "N/A"}<br/>
                                                            <strong>Time:</strong> ${checkInDate ? checkInDate.toLocaleTimeString() : "N/A"}
                                                        </div>
                                                    </div>
                                                `;
                                            }).join("");
                                            
                                            Swal.fire({
                                                title: `${displayName}'s Event History`,
                                                html: `<div style="padding: 0.5rem;">${historyHtml}</div>`,
                                                confirmButtonColor: "#a900f7",
                                                width: "600px",
                                                confirmButtonText: "Close"
                                            });
                                        } catch (error) {
                                            console.error("Error fetching attendance history:", error);
                                            Swal.fire({
                                                title: "Error",
                                                text: "Failed to load attendance history.",
                                                icon: "error",
                                                confirmButtonColor: "#a900f7"
                                            });
                                        }
                                    }}
                                >
                                    History
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
