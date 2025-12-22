import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase";
import { saveUserToFirestore } from "./utils/saveUserToFirestore";

import Register from "./components/Register";
import Profile from "./components/Profile";
import StudentMain from "./components/StudentMain";
import AuthRedirect from "./components/AuthRedirect";

import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminGuard from "./admin/AdminGuard";

function AuthGuard({ children }) {
    if (!auth.currentUser) {
        return <Navigate to="/register" replace />;
    }
    return children;
}

export default function App() {
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await saveUserToFirestore(user);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AuthRedirect />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/profile"
                    element={
                        <AuthGuard>
                            <Profile />
                        </AuthGuard>
                    }
                />

                <Route
                    path="/student"
                    element={
                        <AuthGuard>
                            <StudentMain />
                        </AuthGuard>
                    }
                />

                <Route path="/aut/jpcsconnect/adminlogin" element={<AdminLogin />} />

                <Route
                    path="/aut/jpcsconnect/admindashboard"
                    element={
                        <AdminGuard>
                            <AdminDashboard />
                        </AdminGuard>
                    }
                />

                <Route path="*" element={<Navigate to="/register" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
