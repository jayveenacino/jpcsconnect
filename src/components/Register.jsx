import React, { useEffect, useState } from "react";
import "../css/register.css";
import { auth, provider } from "../firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import gLogo from "../assets/Glogo.png";


export default function Register() {
    const navigate = useNavigate();
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminUsername, setAdminUsername] = useState("admin");
    const [adminPassword, setAdminPassword] = useState("admin");
    const [loginError, setLoginError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate("/student", { replace: true });
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);

            const isNewUser = result._tokenResponse?.isNewUser;

            if (isNewUser) {
                navigate("/profile", { replace: true });
            } else {
                navigate("/student", { replace: true });
            }
        } catch (error) {
            console.error("Registration error:", error);
        }
    };

    useEffect(() => {
        const container = document.getElementById("bg-squares");
        if (!container) return;

        container.innerHTML = "";
        for (let i = 0; i < 20; i++) {
            const s = document.createElement("div");
            s.classList.add("float-square");
            s.style.left = Math.random() * 100 + "%";
            s.style.width = Math.random() * 40 + 10 + "px";
            s.style.height = s.style.width;
            s.style.animationDuration = Math.random() * 4 + 3 + "s";
            container.appendChild(s);
        }
    }, []);

    const handleAdminLogin = (e) => {
        e.preventDefault();
        if (adminUsername === "admin" && adminPassword === "admin") {
            const adminData = {
                name: "Admin",
                username: "admin",
                role: "Administrator",
                loginTime: new Date().toISOString(),
                permissions: ["events", "attendance", "students", "analytics", "announcements", "certificates"]
            };
            localStorage.setItem("adminLoggedIn", "true");
            localStorage.setItem("adminData", JSON.stringify(adminData));
            setShowAdminLogin(false);
            navigate("/admin");
        } else {
            setLoginError("Invalid username or password");
        }
    };

    return (
        <div id="register-container">
            <div id="bg-squares"></div>

            <div className="header">
                <span className="um">JPCS</span>Connect
            </div>

            <div className="subheader">
                Your National Launchpad into the Digital World
            </div>

            <div className="card">
                <h2 className="welcome-title">Welcome JPCSIANS!</h2>
                <p className="signin-instruction">
                    Sign in with your Google account to continue
                </p>

                <button className="google-button" onClick={handleGoogleLogin}>
                    <img className="logo" src={gLogo} alt="Google" />
                    Continue with Google
                </button>

                <p className="privacy-text">
                    By continuing, you agree to our{" "}
                    <a href="#">Terms of Service</a> and{" "}
                    <a href="#">Privacy Policy</a>
                </p>
            </div>

            <div className="footer-links">
                <button 
                    className="admin-login-btn"
                    onClick={() => setShowAdminLogin(true)}
                >
                    Login as Admin
                </button>
            </div>

            {showAdminLogin && (
                <div className="admin-overlay" onClick={() => setShowAdminLogin(false)}>
                    <div className="admin-login" onClick={(e) => e.stopPropagation()}>
                        <button className="admin-close" onClick={() => setShowAdminLogin(false)}>
                            ×
                        </button>
                        <h2 className="admin-title">Admin Login</h2>
                        <form onSubmit={handleAdminLogin}>
                            <div className="admin-form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={adminUsername}
                                    onChange={(e) => {
                                        setAdminUsername(e.target.value);
                                        setLoginError("");
                                    }}
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => {
                                        setAdminPassword(e.target.value);
                                        setLoginError("");
                                    }}
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                            {loginError && <div className="admin-error">{loginError}</div>}
                            <button type="submit" className="admin-submit">
                                Login
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="footer-links">
                Need help?{" "}
                <a href="#" className="contact-support">
                    Contact Support
                </a>
            </div>
        </div>
    );
}
