import { Navigate } from "react-router-dom";

export default function AdminGuard({ children }) {
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if (!isAdmin) {
        return <Navigate to="/aut/jpcsconnect/adminlogin" replace />;
    }

    return children;
}
