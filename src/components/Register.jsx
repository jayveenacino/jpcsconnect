import React, { useEffect } from "react";
import "../css/register.css";
import { auth, provider } from "../firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import gLogo from "../assets/Glogo.png";

export default function Register() {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate("/student", { replace: true });
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleGoogleLogin = async () => {
        const result = await signInWithPopup(auth, provider);
        const isNewUser = result._tokenResponse?.isNewUser;
        navigate(isNewUser ? "/profile" : "/student", { replace: true });
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
                Need help?{" "}
                <a href="#" className="contact-support">
                    Contact Support
                </a>
            </div>
        </div>
    );
}
