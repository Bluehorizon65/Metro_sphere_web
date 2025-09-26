import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../App.css";


function LoginRegister({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder login logic: only allow user 'zach@metro.com' and password '123'
    if (!isRegister) {
      if (email === "zach@metro.com" && password === "123") {
        setError("");
        if (onLogin) onLogin();
      } else {
        setError("Invalid email or password. (Try zach@metro.com / 123)");
      }
    } else {
      // Placeholder: registration logic would go here
      // For now, just show error or success as needed
      setError("Registration is disabled in demo.");
    }
  };

  return (
    <div className="metro-container">
      <h2 className="metro-title">Metro Sphere</h2>
      <form className="metro-form" onSubmit={handleSubmit}>
        {/* Placeholder login: user 'zach', password '123' */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="metro-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="metro-input-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="metro-eye-btn"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {isRegister && (
          <div className="metro-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="metro-input-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="metro-eye-btn"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        )}
        <button type="submit" className="metro-btn">
          {isRegister ? "Register" : "Login"}
        </button>
        {error && (
          <div style={{ color: '#e11d48', marginTop: 10, fontWeight: 500, fontSize: '1rem' }}>{error}</div>
        )}
      </form>
      <div className="metro-switch">
        {isRegister ? (
          <span>
            Already have an account?{' '}
            <button className="metro-link" onClick={() => setIsRegister(false)}>
              Login Here
            </button>
          </span>
        ) : (
          <span>
            Don’t have account?{' '}
            <button className="metro-link" onClick={() => setIsRegister(true)}>
              Register Here
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

export default LoginRegister;
