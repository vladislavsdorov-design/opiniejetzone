import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import "./styles/App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем аутентификацию при загрузке
    const adminAuth = localStorage.getItem("jetzone24_admin");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (password) => {
    // Простая аутентификация (можно заменить на более безопасную)
    if (password === "admin123") {
      // Смените пароль!
      localStorage.setItem("jetzone24_admin", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem("jetzone24_admin");
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="loading-screen">Загрузка...</div>;
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && (
          <button onClick={handleLogout} className="logout-btn">
            Выйти из админки
          </button>
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <AdminPage onLogout={handleLogout} />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
