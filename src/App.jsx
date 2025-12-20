import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./components/Register";
import Profile from "./components/Profile";
import StudentMain from "./components/StudentMain";
import AuthRedirect from "./components/AuthRedirect";
import AdminDash from "./components/AdminDash";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AuthRedirect />} />

                <Route path="/register" element={<Register />} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/student" element={<StudentMain />} />
                <Route path="/admin" element={<AdminDash />} />
            </Routes>
        </BrowserRouter>
    );
}
