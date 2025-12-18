import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./components/Register";
import Profile from "./components/Profile";
import StudentMain from "./components/StudentMain";
import AuthRedirect from "./components/AuthRedirect";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Entry point */}
                <Route path="/" element={<AuthRedirect />} />

                {/* Public */}
                <Route path="/register" element={<Register />} />

                {/* Protected */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/student" element={<StudentMain />} />
            </Routes>
        </BrowserRouter>
    );
}
