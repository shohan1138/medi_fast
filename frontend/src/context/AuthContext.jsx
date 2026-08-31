import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";
// import { useNavigate, Link } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      setUser(res.data);
    } catch {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchCurrentUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);

    const res = await apiClient.post("/auth/login/", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("access_token", res.data.access_token);
    await fetchCurrentUser();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };
  const hasRole = (...roleNames) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    const userRoleNames = (user.roles || []).map((r) => r.RoleName);
    return roleNames.some((r) => userRoleNames.includes(r));
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
