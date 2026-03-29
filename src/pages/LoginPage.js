import React, { useState } from "react";
import "../styles/AdminPage.css";

function LoginPage({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(password)) {
      setError("");
    } else {
      setError("Неверный пароль");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>JetZone24 Админка</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Войти</button>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
