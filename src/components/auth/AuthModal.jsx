import React, { useState } from "react";
import { loginUser, signupUser, forgotPassword } from "../../services/apiService";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [view, setView] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }

  if (!isOpen) return null;

  const handleToggleView = (newView) => {
    setView(newView);
    setMessage(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (view === "login") {
        if (!email || !password) throw new Error("Email and password are required.");
        await loginUser(email, password);
        setMessage({ type: "success", text: "Logged in successfully! Loading progress..." });
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 800);
      } else if (view === "signup") {
        if (!email || !password) throw new Error("Email and password are required.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        
        await signupUser(email, password);
        setMessage({ type: "success", text: "Account created successfully! Check your email to confirm or log in." });
        setTimeout(() => {
          setView("login");
          setMessage(null);
        }, 3000);
      } else if (view === "forgot") {
        if (!email) throw new Error("Please enter your email address.");
        await forgotPassword(email);
        setMessage({ type: "success", text: "Password reset link sent to your email!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "An authentication error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h3>
            {view === "login" && "Login to BehindTheSite"}
            {view === "signup" && "Sign Up (Free)"}
            {view === "forgot" && "Reset Password"}
          </h3>
          <button className="auth-close-btn" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`auth-status-banner ${message.type}`} style={{ marginBottom: "16px" }}>
            {message.type === "error" ? "⚠️ " : "✓ "} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-stack">
          <div className="auth-input-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="e.g. you@backend.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {view !== "forgot" && (
            <div className="auth-input-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {view === "signup" && (
            <div className="auth-input-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                id="auth-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Processing..." : view === "login" ? "Log In" : view === "signup" ? "Create Account" : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-footer-toggle">
          {view === "login" ? (
            <>
              <div>
                Don't have an account?{" "}
                <button className="auth-link-btn" onClick={() => handleToggleView("signup")}>
                  Sign up here
                </button>
              </div>
              <div>
                Forgot your password?{" "}
                <button className="auth-link-btn" onClick={() => handleToggleView("forgot")}>
                  Reset password
                </button>
              </div>
            </>
          ) : view === "signup" ? (
            <div>
              Already have an account?{" "}
              <button className="auth-link-btn" onClick={() => handleToggleView("login")}>
                Log in here
              </button>
            </div>
          ) : (
            <div>
              Back to{" "}
              <button className="auth-link-btn" onClick={() => handleToggleView("login")}>
                Log in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
