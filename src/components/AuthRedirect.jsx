import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AuthRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate("/student", { replace: true });
            } else {
                navigate("/register", { replace: true });
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    return null;
}
