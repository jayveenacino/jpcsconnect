import React, { useState, useEffect } from "react";
import "../css/AnalyticsView.css";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AnalyticsView() {
    const [timeRange, setTimeRange] = useState("month");
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalStudents: 0,
        totalAttendance: 0,
        avgAttendance: 0
    });
    const [topEvents, setTopEvents] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const eventsSnapshot = await getDocs(collection(db, "events"));
            const eventsList = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const totalEvents = eventsList.length;

            const usersSnapshot = await getDocs(collection(db, "users"));
            const totalStudents = usersSnapshot.size;

            const attendanceSnapshot = await getDocs(collection(db, "attendance"));
            const attendanceList = attendanceSnapshot.docs.map(doc => doc.data());
            const totalAttendance = attendanceList.length;

            const avgAttendance = totalEvents > 0 ? (totalAttendance / totalEvents).toFixed(1) : 0;

            setStats({
                totalEvents,
                totalStudents,
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

            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const currentMonth = new Date().getMonth();
            const last6Months = [];

            for (let i = 5; i >= 0; i--) {
                const monthIndex = (currentMonth - i + 12) % 12;
                const month = monthNames[monthIndex];
                
                const eventsInMonth = eventsList.filter(event => {
                    if (!event.date) return false;
                    const eventDate = new Date(event.date);
                    return eventDate.getMonth() === monthIndex;
                }).length;

                const attendanceInMonth = attendanceList.filter(attendance => {
                    if (!attendance.checkIn) return false;
                    const checkInDate = new Date(attendance.checkIn);
                    return checkInDate.getMonth() === monthIndex;
                }).length;

                last6Months.push({
                    month,
                    events: eventsInMonth,
                    attendance: attendanceInMonth
                });
            }

            setMonthlyData(last6Months);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            setStats({
                totalEvents: 0,
                totalStudents: 0,
                totalAttendance: 0,
                avgAttendance: 0
            });
            setTopEvents([]);
            setMonthlyData([]);
        } finally {
            setLoading(false);
        }
    };

    const overviewStats = [
        { label: "Total Events Held", value: stats.totalEvents.toString(), change: "+0", trend: "up" },
        { label: "Total Attendance", value: stats.totalAttendance.toString(), change: "+0", trend: "up" },
        { label: "Avg. Attendance Rate", value: `${stats.avgAttendance}`, change: "+0%", trend: "up" },
        { label: "Active Students", value: stats.totalStudents.toString(), change: "+0", trend: "up" }
    ];

    const attendanceDistribution = [
        { range: "90-100%", count: 0, percentage: 0 },
        { range: "80-89%", count: 0, percentage: 0 },
        { range: "70-79%", count: 0, percentage: 0 },
        { range: "60-69%", count: 0, percentage: 0 },
        { range: "Below 60%", count: 0, percentage: 0 }
    ];

    const maxAttendance = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.attendance)) : 1;

    return (
        <div className="analytics-view">
            <div className="analytics-header">
                <h2>Analytics & Reports</h2>
                <div className="time-range-selector">
                    <button
                        className={timeRange === "week" ? "active" : ""}
                        onClick={() => setTimeRange("week")}
                    >
                        Week
                    </button>
                    <button
                        className={timeRange === "month" ? "active" : ""}
                        onClick={() => setTimeRange("month")}
                    >
                        Month
                    </button>
                    <button
                        className={timeRange === "year" ? "active" : ""}
                        onClick={() => setTimeRange("year")}
                    >
                        Year
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                    Loading analytics...
                </div>
            ) : stats.totalEvents === 0 && stats.totalStudents === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                    No data available. Create events and add students to see analytics.
                </div>
            ) : (
                <>
                    <div className="overview-stats">
                        {overviewStats.map((stat, index) => (
                            <div key={index} className="overview-card">
                                <div className="overview-label">{stat.label}</div>
                                <div className="overview-value">{stat.value}</div>
                                <div className={`overview-change ${stat.trend}`}>
                                    <span className="change-icon">
                                        {stat.trend === "up" ? "↑" : "↓"}
                                    </span>
                                    {stat.change} this month
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="analytics-grid">
                <div className="analytics-card chart-card">
                    <h3>Monthly Attendance Trends</h3>
                    <div className="chart-container">
                        {monthlyData.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                No monthly data available
                            </div>
                        ) : (
                            <div className="bar-chart">
                                {monthlyData.map((data, index) => (
                                    <div key={index} className="bar-group">
                                        <div className="bar-wrapper">
                                            <div
                                                className="bar"
                                                style={{
                                                    height: `${maxAttendance > 0 ? (data.attendance / maxAttendance) * 100 : 0}%`
                                                }}
                                            >
                                                <span className="bar-value">{data.attendance}</span>
                                            </div>
                                        </div>
                                        <div className="bar-label">{data.month}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="analytics-card">
                    <h3>Top Performing Events</h3>
                    <div className="top-events-list">
                        {topEvents.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                                No events available
                            </div>
                        ) : (
                            topEvents.map((event, index) => (
                                <div key={index} className="event-item">
                                    <div className="event-rank">{index + 1}</div>
                                    <div className="event-details">
                                        <div className="event-name">{event.name}</div>
                                        <div className="event-stats">
                                            {event.attendees} attendees • {event.rate} rate
                                        </div>
                                    </div>
                                    <div className="event-progress">
                                        <div
                                            className="progress-bar"
                                            style={{ width: event.rate }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="analytics-card">
                    <h3>Attendance Rate Distribution</h3>
                    <div className="distribution-list">
                        {attendanceDistribution.map((item, index) => (
                            <div key={index} className="distribution-item">
                                <div className="distribution-header">
                                    <span className="distribution-range">{item.range}</span>
                                    <span className="distribution-count">
                                        {item.count} students
                                    </span>
                                </div>
                                <div className="distribution-bar">
                                    <div
                                        className="distribution-fill"
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="distribution-percentage">
                                    {item.percentage}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

                    <div className="export-section">
                        <button className="export-btn">
                            Export Full Report
                        </button>
                        <button className="export-btn secondary">
                            Generate PDF
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
