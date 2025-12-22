import React, { useEffect, useState } from "react";
import "./admincss/adminLogin.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AdminLogin() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin") === "true";

        if (isAdmin) {
            navigate("/aut/jpcsconnect/admindashboard", { replace: true });
        } else {
            setChecked(true);
        }
    }, [navigate]);

    useEffect(() => {
        if (!checked) return;

        const container = document.getElementById("admin-bg-squares");
        if (!container) return;

        container.innerHTML = "";
        for (let i = 0; i < 20; i++) {
            const s = document.createElement("div");
            s.classList.add("admin-float-square");
            s.style.left = Math.random() * 100 + "%";
            s.style.width = Math.random() * 40 + 10 + "px";
            s.style.height = s.style.width;
            s.style.animationDuration = Math.random() * 4 + 3 + "s";
            container.appendChild(s);
        }
    }, [checked]);

    const handleAdminLogin = (e) => {
        e.preventDefault();

        if (username === "JPCSAdmin" && password === "JPCSMasarap") {
            Swal.fire({
                icon: "success",
                title: "Access Granted",
                text: "Welcome, Administrator",
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                localStorage.setItem("isAdmin", "true");
                navigate("/aut/jpcsconnect/admindashboard");
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Access Denied",
                text: "Invalid admin credentials",
                confirmButtonColor: "#2c3e50",
            });
        }
    };

    if (!checked) return null;

    return (
        <div className="admin-login-container">
            <div id="admin-bg-squares"></div>

            <div className="admin-headerz">
                <span className="admin-highlight">JPCS</span>Connect
            </div>

            <div className="admin-subheader">
                Administrator Access Portal
            </div>

            <div className="admin-card">
                <h2 className="admin-title">Admin Login</h2>

                <form onSubmit={handleAdminLogin} className="admin-form">
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        className="admin-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="admin-login-btn">
                        Login
                    </button>
                </form>

                <p className="admin-note">
                    Authorized personnel only
                </p>
            </div>

            <div className="admin-footer">
                Need help? <a href="#">Contact System Admin</a>
            </div>
        </div>
    );
}
