import React, { useState, useEffect } from "react";
import "./admincss/adminDashboard.css";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import AdminAttendance from "./AdminAttendance";
import StudentList from "./StudentList";


export default function AdminDashboard() {
    const [photo, setPhoto] = useState("");
    const [name, setName] = useState("");
    const [showProfile, setShowProfile] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeEvents: 0,
        totalAttendance: 0,
        avgAttendance: 0
    });
    const [topEvents, setTopEvents] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [timeRange, setTimeRange] = useState("month");
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin") === "true";

        if (!isAdmin) {
            navigate("/aut/jpcsconnect/adminlogin", { replace: true });
            return;
        }

        setName("Admin");
        setPhoto("");
    }, [navigate]);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        const startTime = performance.now();

        try {
            const [usersSnapshot, eventsSnapshot, attendanceSnapshot] = await Promise.all([
                localDB.getDocs("users"),
                localDB.getDocs("events"),
                localDB.getDocs("attendance")
            ]);

            const eventsList = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const attendanceList = attendanceSnapshot.docs.map(doc => doc.data());
            const totalEvents = eventsList.length;
            const totalAttendance = attendanceList.length;
            const totalStudents = usersSnapshot.size;
            const avgAttendance = totalEvents > 0 ? Math.round(totalAttendance / totalEvents) : 0;

            setStats({
                totalStudents,
                activeEvents: totalEvents,
                totalAttendance,
                avgAttendance
            });

            const eventAttendanceCounts = {};
            attendanceList.forEach(attendance => {
                const eventId = attendance.eventId;
                if (eventId) {
                    eventAttendanceCounts[eventId] = (eventAttendanceCounts[eventId] || 0) + 1;
                }
            });

            const eventsWithAttendance = eventsList.map(event => ({
                name: event.name,
                attendees: eventAttendanceCounts[event.id] || 0,
                rate: totalStudents > 0
                    ? `${Math.round(((eventAttendanceCounts[event.id] || 0) / totalStudents) * 100)}%`
                    : "0%"
            }));

            eventsWithAttendance.sort((a, b) => b.attendees - a.attendees);
            setTopEvents(eventsWithAttendance.slice(0, 5));
        } catch (error) {
            setStats({
                totalStudents: 0,
                activeEvents: 0,
                totalAttendance: 0,
                avgAttendance: 0
            });
            setTopEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserMenu && !event.target.closest('.admin-user-section')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const handleLogout = async () => {
        const isAdminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

        if (isAdminLoggedIn) {
            localStorage.removeItem("adminLoggedIn");
        } else {
            await signOut(auth);
        }

        localStorage.removeItem("isAdmin");

        localStorage.removeItem("profileCompleted");

        navigate("/aut/jpcsconnect/adminlogin", { replace: true });
    };

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "events", label: "Events" },
        { id: "attendance", label: "Attendance" },
        { id: "students", label: "Students" },
        { id: "announcements", label: "Announcements" }
    ];

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-header-left">
                    <div className="admin-logo-group">
                        <div className="header" style={{ fontSize: "18px", marginTop: "10px" }}>
                            <span className="um">JPCS</span>Connect
                        </div>
                        <span className="admin-divider">|</span>
                        <div className="admin-label">
                            Admin Dashboard
                        </div>
                    </div>
                </div>

                <div className="admin-header-center">
                    <div className="admin-tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setShowProfile(false);
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="admin-header-right">
                    <div className="admin-user-section">
                        <button
                            className="admin-user-btn"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <div className="admin-avatar">
                                {photo ? (
                                    <img src={photo} alt="Profile" />
                                ) : (
                                    <span>{name ? name.charAt(0).toUpperCase() : "A"}</span>
                                )}
                            </div>
                            <span className="admin-user-name">{name || "Admin"}</span>
                            <span className="admin-dropdown-arrow">▼</span>
                        </button>

                        {showUserMenu && (
                            <div className="admin-user-menu">
                                <div className="admin-menu-header">
                                    <div className="admin-menu-avatar">
                                        {photo ? (
                                            <img src={photo} alt="Profile" />
                                        ) : (
                                            <span>{name ? name.charAt(0).toUpperCase() : "A"}</span>
                                        )}
                                    </div>
                                    <div className="admin-menu-info">
                                        <div className="admin-menu-name">{name || "Admin"}</div>
                                        <div className="admin-menu-role">Administrator</div>
                                    </div>
                                </div>
                                <button
                                    className="admin-menu-item"
                                    onClick={() => {
                                        setShowProfile(true);
                                        setActiveTab("profile");
                                        setShowUserMenu(false);
                                    }}
                                >
                                    View Profile
                                </button>
                                <button
                                    className="admin-menu-item"
                                    onClick={() => {
                                        navigate("/student");
                                    }}
                                >
                                    Student View
                                </button>
                                <button
                                    className="admin-menu-item logout"
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        handleLogout();
                                    }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="quick-actions-bar" style={{
                background: "#fff",
                borderBottom: "1px solid #e5e7eb",
                padding: "0.75rem 2rem",
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap"
            }}>
                <button
                    onClick={() => setActiveTab("attendance")}
                    style={{
                        padding: "0.5rem 1rem",
                        background: "#a900f7",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#9708da"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#a900f7"}
                >
                    Scan QR Code
                </button>
                <button
                    onClick={() => setActiveTab("events")}
                    style={{
                        padding: "0.5rem 1rem",
                        background: "#a900f7",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#9708da"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#a900f7"}
                >
                    Create New Event
                </button>
                <button
                    onClick={() => setActiveTab("announcements")}
                    style={{
                        padding: "0.5rem 1rem",
                        background: "#a900f7",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#9708da"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#a900f7"}
                >
                    Send Announcement
                </button>
            </div>

            <main className="admin-main">
                {activeTab === "profile" && showProfile ? (
                    <ViewProfile
                        name={name}
                        email={auth.currentUser?.email}
                        photo={photo}
                        onBack={() => {
                            setShowProfile(false);
                            setActiveTab("dashboard");
                        }}
                    />
                ) : activeTab === "events" ? (
                    <AdminEvents />
                ) : activeTab === "attendance" ? (
                    <AdminAttendance />
                ) : activeTab === "students" ? (
                    <StudentList />
                ) : activeTab === "announcements" ? (
                    <AdminAnnouncements />
                ) : (
                    <div className="admin-dashboard">
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                No data available
                            </div>
                        ) : stats.totalEvents === 0 && stats.totalStudents === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                No data available. Create events and add students to see analytics.
                            </div>
                        ) : (
                            <>
                                <div className="admin-stats-bar">
                                    <div className="admin-stat-item">
                                        <span className="admin-stat-icon">👥</span>
                                        <div className="admin-stat-info">
                                            <div className="admin-stat-value">{stats.totalStudents}</div>
                                            <div className="admin-stat-label">Total Students</div>
                                        </div>
                                    </div>
                                    <div className="admin-stat-item">
                                        <span className="admin-stat-icon">📅</span>
                                        <div className="admin-stat-info">
                                            <div className="admin-stat-value">{stats.activeEvents}</div>
                                            <div className="admin-stat-label">Active Events</div>
                                        </div>
                                    </div>
                                    <div className="admin-stat-item">
                                        <span className="admin-stat-icon">✅</span>
                                        <div className="admin-stat-info">
                                            <div className="admin-stat-value">{stats.totalAttendance}</div>
                                            <div className="admin-stat-label">Total Attendance</div>
                                        </div>
                                    </div>
                                    <div className="admin-stat-item">
                                        <span className="admin-stat-icon">📊</span>
                                        <div className="admin-stat-info">
                                            <div className="admin-stat-value">{stats.avgAttendance}</div>
                                            <div className="admin-stat-label">Avg. Attendance</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-content-grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
                                    <div className="analytics-card chart-card">
                                        <h3>Attendance Per Event</h3>
                                        <div className="chart-container">
                                            {topEvents.length === 0 ? (
                                                <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                                    No event data available
                                                </div>
                                            ) : (
                                                <div className="line-graph">
                                                    <svg width="100%" height="300" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
                                                        {/* Grid lines */}
                                                        {[0, 1, 2, 3, 4].map((i) => (
                                                            <line
                                                                key={i}
                                                                x1="50"
                                                                y1={50 + i * 50}
                                                                x2="580"
                                                                y2={50 + i * 50}
                                                                stroke="#e5e7eb"
                                                                strokeWidth="1"
                                                            />
                                                        ))}

                                                        {/* Y-axis labels */}
                                                        {(() => {
                                                            const maxAttendance = Math.max(...topEvents.slice(0, 6).map(e => e.attendees), 1);
                                                            return [0, 1, 2, 3, 4].map((i) => {
                                                                const value = Math.round(maxAttendance * (4 - i) / 4);
                                                                return (
                                                                    <text
                                                                        key={i}
                                                                        x="40"
                                                                        y={55 + i * 50}
                                                                        textAnchor="end"
                                                                        fontSize="12"
                                                                        fill="#6b7280"
                                                                    >
                                                                        {value}
                                                                    </text>
                                                                );
                                                            });
                                                        })()}

                                                        {/* Line path */}
                                                        {(() => {
                                                            const maxAttendance = Math.max(...topEvents.slice(0, 6).map(e => e.attendees), 1);
                                                            const events = topEvents.slice(0, 6);
                                                            const points = events.map((event, index) => {
                                                                const x = 80 + (index * (500 / Math.max(events.length - 1, 1)));
                                                                const y = 250 - ((event.attendees / maxAttendance) * 200);
                                                                return `${x},${y}`;
                                                            }).join(' ');

                                                            return (
                                                                <>
                                                                    {/* Area fill */}
                                                                    <polygon
                                                                        points={`50,250 ${points} ${80 + ((events.length - 1) * (500 / Math.max(events.length - 1, 1)))},250`}
                                                                        fill="url(#gradient)"
                                                                        opacity="0.3"
                                                                    />
                                                                    {/* Line */}
                                                                    <polyline
                                                                        points={points}
                                                                        fill="none"
                                                                        stroke="#a900f7"
                                                                        strokeWidth="3"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                    {/* Points */}
                                                                    {events.map((event, index) => {
                                                                        const x = 80 + (index * (500 / Math.max(events.length - 1, 1)));
                                                                        const y = 250 - ((event.attendees / maxAttendance) * 200);
                                                                        return (
                                                                            <g key={index}>
                                                                                <circle
                                                                                    cx={x}
                                                                                    cy={y}
                                                                                    r="6"
                                                                                    fill="#a900f7"
                                                                                    stroke="#fff"
                                                                                    strokeWidth="2"
                                                                                />
                                                                                <text
                                                                                    x={x}
                                                                                    y={y - 15}
                                                                                    textAnchor="middle"
                                                                                    fontSize="12"
                                                                                    fontWeight="600"
                                                                                    fill="#a900f7"
                                                                                >
                                                                                    {event.attendees}
                                                                                </text>
                                                                                <text
                                                                                    x={x}
                                                                                    y={270}
                                                                                    textAnchor="middle"
                                                                                    fontSize="11"
                                                                                    fill="#6b7280"
                                                                                    style={{ maxWidth: "60px" }}
                                                                                >
                                                                                    {event.name.length > 10 ? event.name.substring(0, 10) + '...' : event.name}
                                                                                </text>
                                                                            </g>
                                                                        );
                                                                    })}
                                                                </>
                                                            );
                                                        })()}

                                                        {/* Gradient definition */}
                                                        <defs>
                                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                                <stop offset="0%" stopColor="#a900f7" stopOpacity="0.8" />
                                                                <stop offset="100%" stopColor="#a900f7" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="analytics-card ranking-card">
                                        <h3>Most Attended Events</h3>
                                        <div className="top-events-ranking">
                                            {topEvents.length === 0 ? (
                                                <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                                    No events available
                                                </div>
                                            ) : (
                                                topEvents.slice(0, 5).map((event, index) => (
                                                    <div key={index} className={`ranking-item rank-${index + 1}`}>
                                                        <div className="ranking-badge">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="ranking-info">
                                                            <div className="ranking-name">{event.name}</div>
                                                            <div className="ranking-stats">
                                                                <span className="ranking-attendees">{event.attendees} attendees</span>
                                                                <span className="ranking-rate">{event.rate}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
