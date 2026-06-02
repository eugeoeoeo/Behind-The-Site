import React, { useState, useEffect } from "react";
import { CHAPTERS } from "../data/courseData";
import { fetchUserProgress, saveUserProgress, resetUserProgress, logoutUser, loginUser, signupUser } from "../services/apiService";
import { supabase } from "../services/supabaseClient";
import Workspace from "./Workspace";

export default function Dashboard() {
  // Authentication & Progress Session states
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);

  // Active indices inside track
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  // Toggle between Student Dashboard Hub and split-pane Workspace
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // Expanded chapters index dictionary for the dashboard accordions
  const [expandedChapters, setExpandedChapters] = useState({ 0: true });

  // Gateway credentials (when unauthenticated)
  const [gatewayView, setGatewayView] = useState("login"); // "login" | "signup"
  const [gatewayEmail, setGatewayEmail] = useState("");
  const [gatewayPassword, setGatewayPassword] = useState("");
  const [gatewayConfirmPassword, setGatewayConfirmPassword] = useState("");
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState(null);

  // Total lessons count in the course syllabus mapping
  const totalLessonsCount = CHAPTERS.reduce((sum, chap) => sum + chap.lessons.length, 0);

  // 1. Fetch user progress from Supabase
  const loadProgress = async (currentUser) => {
    if (!currentUser) return;
    try {
      const data = await fetchUserProgress();
      setProgress(data);
      
      // Auto-locate current chapter and lesson indices matching active tracking lesson
      if (data.activeLessonId) {
        let found = false;
        for (let cIdx = 0; cIdx < CHAPTERS.length; cIdx++) {
          const chap = CHAPTERS[cIdx];
          for (let lIdx = 0; lIdx < chap.lessons.length; lIdx++) {
            if (chap.lessons[lIdx].id === data.activeLessonId) {
              setActiveChapterIndex(cIdx);
              setActiveLessonIndex(lIdx);
              // Expand active chapter accordion by default
              setExpandedChapters((prev) => ({ ...prev, [cIdx]: true }));
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }
    } catch (e) {
      console.error("Failed to load progress from database", e);
    }
  };

  // 2. Setup auth listening on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      loadProgress(activeUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      if (activeUser) {
        loadProgress(activeUser);
      } else {
        setProgress(null);
        setWorkspaceOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Persist progress state upgrades
  const updateProgressState = async (newProgress) => {
    setProgress(newProgress);
    try {
      await saveUserProgress(newProgress);
    } catch (e) {
      console.error("Failed to sync progress to database", e);
    }
  };

  // 4. Handle Gateway Submissions
  const handleGatewaySubmit = async (e) => {
    e.preventDefault();
    setGatewayMessage(null);
    setGatewayLoading(true);

    try {
      if (gatewayView === "signup") {
        if (gatewayPassword !== gatewayConfirmPassword) {
          throw new Error("Passwords do not match.");
        }
        await signupUser(gatewayEmail, gatewayPassword);
        setGatewayMessage({
          type: "success",
          text: "Registration complete! You are logged in."
        });
      } else {
        await loginUser(gatewayEmail, gatewayPassword);
      }
    } catch (err) {
      setGatewayMessage({ type: "error", text: err.message || "An authentication error occurred." });
    } finally {
      setGatewayLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setProgress(null);
      setWorkspaceOpen(false);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const handleResetProgress = async () => {
    if (!window.confirm("Are you sure you want to reset your curriculum progress? This will reset your XP and streak to 0.")) return;
    try {
      const freshProgress = await resetUserProgress();
      setProgress(freshProgress);
      setActiveChapterIndex(0);
      setActiveLessonIndex(0);
      alert("Progress successfully reset!");
    } catch (e) {
      console.error("Failed to reset progress", e);
    }
  };

  const toggleChapter = (cIdx) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [cIdx]: !prev[cIdx]
    }));
  };

  // Render Authentication overlay if session does not exist
  if (!user) {
    return (
      <div className="welcome-gateway-container">
        <div className="gateway-center-card">
          {/* Left info panel */}
          <div className="gateway-info-section">
            <div className="gateway-logo-block">
              <span className="gateway-logo-icon" style={{ color: "var(--dc-green)" }}>🛤️</span>
              <span className="gateway-logo-text">BehindTheSite</span>
            </div>
            <h1>Master Backend Engineering</h1>
            <p>Go from complete coding beginner to building production-ready modular APIs, AI connections, and PostgreSQL database triggers.</p>

            <div className="gateway-bullets-list">
              <div className="gateway-bullet-item">
                <span className="bullet-icon-check" style={{ color: "var(--dc-green)" }}>✓</span>
                <div className="bullet-details">
                  <h4>Concept-Isolated Micro-Lessons</h4>
                  <p>Each module isolates exactly one target backend rule with interactive exercises under 5 minutes.</p>
                </div>
              </div>
              <div className="gateway-bullet-item">
                <span className="bullet-icon-check" style={{ color: "var(--dc-green)" }}>✓</span>
                <div className="bullet-details">
                  <h4>Sleek DataCamp Split-Screen</h4>
                  <p>Read instructions, write python code, and execute live tests in a side-by-side layout.</p>
                </div>
              </div>
              <div className="gateway-bullet-item">
                <span className="bullet-icon-check" style={{ color: "var(--dc-green)" }}>✓</span>
                <div className="bullet-details">
                  <h4>Dynamic Layer Sandbox</h4>
                  <p>Drag and structure modular directories (routes, controllers, configurations) like a senior architect.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right credentials panel */}
          <div className="gateway-form-section">
            <h2>{gatewayView === "login" ? "Welcome Back!" : "Start Learning Free"}</h2>
            <p className="gateway-subtitle">
              {gatewayView === "login" ? "Sign in to synchronize your backend progress." : "Create your student account to unlock the course."}
            </p>

            {gatewayMessage && (
              <div className={`auth-status-banner ${gatewayMessage.type}`} style={{ marginBottom: "16px" }}>
                {gatewayMessage.type === "error" ? "⚠️ " : "✓ "} {gatewayMessage.text}
              </div>
            )}

            <div className="gateway-social-grid">
              <button type="button" className="gateway-social-btn" onClick={() => alert("Google SSO is simulated in development mode.")}>
                <svg viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.69 5.69 0 0 1 8.24 12.8a5.69 5.69 0 0 1 5.751-5.714c2.519 0 4.13 1.094 5.084 2.01l3.003-2.946C20.25 4.347 17.202 3 13.99 3A9.79 9.79 0 0 0 4.24 12.8a9.79 9.79 0 0 0 9.75 9.8c5.444 0 9.76-3.834 9.76-9.8 0-.596-.058-1.184-.158-1.515H12.24Z"/>
                </svg>
                Google
              </button>
              <button type="button" className="gateway-social-btn" onClick={() => alert("GitHub SSO is simulated in development mode.")}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                GitHub
              </button>
            </div>

            <div className="gateway-divider">or</div>

            <form onSubmit={handleGatewaySubmit} className="auth-form-stack">
              <div className="auth-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={gatewayEmail}
                  onChange={(e) => setGatewayEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={gatewayPassword}
                  onChange={(e) => setGatewayPassword(e.target.value)}
                  required
                />
              </div>

              {gatewayView === "signup" && (
                <div className="auth-input-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={gatewayConfirmPassword}
                    onChange={(e) => setGatewayConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={gatewayLoading}>
                {gatewayLoading ? "Processing..." : gatewayView === "login" ? "Log In" : "Sign Up"}
              </button>
            </form>

            <div className="auth-footer-toggle">
              {gatewayView === "login" ? (
                <div>
                  Don't have an account?{" "}
                  <button className="auth-link-btn" onClick={() => { setGatewayView("signup"); setGatewayMessage(null); }}>
                    Register here
                  </button>
                </div>
              ) : (
                <div>
                  Already registered?{" "}
                  <button className="auth-link-btn" onClick={() => { setGatewayView("login"); setGatewayMessage(null); }}>
                    Log in here
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Loader if progress database fetch hasn't resolved
  if (!progress) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Connecting to BehindTheSite Database...</p>
      </div>
    );
  }

  // CONDITIONALLY RENDER SPLIT WORKSPACE IDE VIEW
  if (workspaceOpen) {
    return (
      <Workspace
        user={user}
        progress={progress}
        activeChapterIndex={activeChapterIndex}
        activeLessonIndex={activeLessonIndex}
        onBackToDashboard={() => setWorkspaceOpen(false)}
        onLessonSelect={(chapIdx, lesIdx) => {
          setActiveChapterIndex(chapIdx);
          setActiveLessonIndex(lesIdx);
        }}
        onProgressUpdate={updateProgressState}
      />
    );
  }

  // OTHERWISE, RENDER DATACAMP AUTHENTIC STUDENT LEARNING PORTAL/DASHBOARD
  const completionRate = Math.round((progress.completedLessons.length / totalLessonsCount) * 100);

  return (
    <div className="student-dashboard-portal" style={{ minHeight: "100vh", backgroundColor: "var(--dc-bg-editor)", color: "var(--dc-text-main)", overflowY: "auto" }}>
      {/* Navigation Header */}
      <header className="dashboard-header" style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <div className="header-left-side">
          <div className="gateway-logo-block" style={{ margin: 0, gap: "6px" }}>
            <span className="gateway-logo-icon" style={{ fontSize: "20px", color: "var(--dc-green)" }}>🛤️</span>
            <span className="gateway-logo-text" style={{ fontSize: "16px" }}>BehindTheSite</span>
          </div>
          <nav className="header-navigation-tabs" style={{ display: "flex", gap: "16px", marginLeft: "24px" }}>
            <button className="nav-tab-link active" style={{ background: "none", border: "none", color: "var(--dc-text-bright)", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
              Learn
            </button>
            <button className="nav-tab-link" onClick={handleResetProgress} style={{ background: "none", border: "none", color: "var(--dc-text-muted)", cursor: "pointer", fontSize: "14px" }}>
              Reset Track
            </button>
          </nav>
        </div>

        <div className="header-right-stats">
          <div className="stat-pill streak" title="Streak Days">
            🔥 <span className="stat-val">{progress.streak}</span>
          </div>
          <div className="stat-pill xp" title="Total XP">
            ⚡ <span className="stat-val">{progress.xp} XP</span>
          </div>
          <button className="badges-trigger-btn" onClick={handleLogout} style={{ color: "var(--dc-red)", borderColor: "rgba(239, 68, 68, 0.3)" }}>
            Sign Out 🚪
          </button>
        </div>
      </header>

      {/* Main Dashboard Portal Container */}
      <div className="dashboard-portal-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
        {/* Responsive Grid Setup for Desktop (Syllabus vs Leaderboard panels) */}
        <div className="dashboard-grid-layout" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
          {/* Apply CSS Grid dynamically on large viewports */}
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 992px) {
              .dashboard-grid-layout {
                grid-template-columns: 2.2fr 1fr !important;
              }
            }
          `}} />

          {/* LEFT AREA: Course Card & expandable roadmaps */}
          <div className="portal-left-section" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Active Track Course Card */}
            <div className="active-track-hero-card" style={{ backgroundColor: "var(--dc-bg-card)", border: "1px solid var(--dc-border)", borderRadius: "8px", padding: "30px", display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
              <div className="hero-card-header">
                <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--dc-green)", textTransform: "uppercase", letterSpacing: "1px" }}>Track ➔ Python Backend Development</span>
                <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", marginTop: "6px", letterSpacing: "-0.5px" }}>BehindTheSite: Complete Backend Master</h1>
                <p style={{ color: "var(--dc-text-muted)", fontSize: "14px", marginTop: "8px", lineHeight: "1.5" }}>
                  Complete 15 Chapters and master the full stack: HTTP REST, environment safety, modular folder systems, routes, JSON assertions, database engines, and CORS controllers.
                </p>
              </div>

              {/* Course Progress meters */}
              <div className="course-progress-block" style={{ borderTop: "1px solid var(--dc-border)", paddingTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "13.5px" }}>
                  <span style={{ fontWeight: "700", color: "#ffffff" }}>Course Progress</span>
                  <span style={{ fontWeight: "800", color: "var(--dc-green)" }}>{completionRate}% Complete ({progress.completedLessons.length}/{totalLessonsCount} lessons)</span>
                </div>
                <div className="progress-bar-track" style={{ height: "8px", backgroundColor: "var(--dc-bg-editor)", borderRadius: "999px", overflow: "hidden" }}>
                  <div className="progress-bar-fill" style={{ width: `${completionRate}%`, height: "100%", backgroundColor: "var(--dc-green)", borderRadius: "999px", transition: "width 0.5s ease" }} />
                </div>
              </div>

              {/* Play Button */}
              <button 
                onClick={() => setWorkspaceOpen(true)}
                className="auth-submit-btn" 
                style={{ alignSelf: "flex-start", padding: "0 24px", height: "46px", marginTop: "10px" }}
              >
                ▶ Resume Track
              </button>
            </div>

            {/* SYLLABUS ROADMAP EXPANDABLE CHAPTERS */}
            <div className="syllabus-roadmap-block">
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Syllabus Track Directory</h2>
              <div className="chapters-accordion-stack" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {CHAPTERS.map((chap, cIdx) => {
                  const isExpanded = !!expandedChapters[cIdx];
                  const chapCompletedCount = chap.lessons.filter(l => progress.completedLessons.includes(l.id)).length;
                  const isChapDone = chapCompletedCount === chap.lessons.length;

                  return (
                    <div 
                      key={chap.id} 
                      className={`chapter-accordion-card ${isExpanded ? "open" : ""}`}
                      style={{ 
                        backgroundColor: "var(--dc-bg-card)", 
                        border: "1px solid var(--dc-border)", 
                        borderRadius: "8px", 
                        overflow: "hidden", 
                        transition: "all 0.2s ease" 
                      }}
                    >
                      {/* Chapter Summary Header Tab */}
                      <div 
                        onClick={() => toggleChapter(cIdx)}
                        className="accordion-header-tab"
                        style={{ 
                          padding: "20px", 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          cursor: "pointer", 
                          backgroundColor: isExpanded ? "rgba(255, 255, 255, 0.02)" : "transparent",
                          borderBottom: isExpanded ? "1px solid var(--dc-border)" : "none",
                          transition: "background-color 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ 
                            width: "28px", 
                            height: "28px", 
                            borderRadius: "50%", 
                            backgroundColor: isChapDone ? "var(--dc-green-glow)" : "var(--dc-bg-editor)", 
                            border: `1px solid ${isChapDone ? "var(--dc-green)" : "var(--dc-border)"}`,
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            fontSize: "12px", 
                            fontWeight: "800",
                            color: isChapDone ? "var(--dc-green)" : "var(--dc-text-muted)"
                          }}>
                            {isChapDone ? "✓" : chap.id}
                          </span>
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--dc-text-muted)", textTransform: "uppercase" }}>Chapter {chap.id}</span>
                            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{chap.title}</h3>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "12px", color: "var(--dc-text-muted)", fontWeight: "600" }}>
                            {chapCompletedCount} / {chap.lessons.length} complete
                          </span>
                          <span style={{ 
                            fontSize: "16px", 
                            color: "var(--dc-text-muted)", 
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s"
                          }}>
                            ▼
                          </span>
                        </div>
                      </div>

                      {/* Expandable Sub-lessons Stack */}
                      {isExpanded && (
                        <div className="accordion-body-lessons" style={{ padding: "10px 20px" }}>
                          {chap.lessons.map((les, lIdx) => {
                            const isCompleted = progress.completedLessons.includes(les.id);
                            return (
                              <div 
                                key={les.id}
                                onClick={() => {
                                  setActiveChapterIndex(cIdx);
                                  setActiveLessonIndex(lIdx);
                                  setWorkspaceOpen(true);
                                }}
                                className="syllabus-lesson-item"
                                style={{ 
                                  padding: "12px 10px", 
                                  display: "flex", 
                                  justifyContent: "space-between", 
                                  alignItems: "center", 
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  marginTop: "4px",
                                  marginBottom: "4px"
                                }}
                              >
                                {/* Inject Lesson Hover CSS rules dynamically */}
                                <style dangerouslySetInnerHTML={{__html: `
                                  .syllabus-lesson-item:hover {
                                    background-color: rgba(3, 239, 98, 0.05) !important;
                                  }
                                  .syllabus-lesson-item:hover .lesson-launch-indicator {
                                    opacity: 1 !important;
                                  }
                                `}} />

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <span style={{ 
                                    color: isCompleted ? "var(--dc-green)" : "var(--dc-text-muted)", 
                                    fontWeight: "800",
                                    fontSize: "14px"
                                  }}>
                                    {isCompleted ? "✓" : "○"}
                                  </span>
                                  <div>
                                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                                      {les.id}. {les.title}
                                    </h4>
                                    <span style={{ fontSize: "11px", color: "var(--dc-text-muted)" }}>
                                      Type: {les.activityType.toUpperCase()} ➔ reward: +{les.xp} XP
                                    </span>
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <span className="lesson-launch-indicator" style={{ opacity: 0, fontSize: "12px", color: "var(--dc-green)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", transition: "opacity 0.15s ease" }}>
                                    ▶ Start
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT AREA: Streaks & achievements sidebar */}
          <div className="portal-right-section" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Streaks & Stats Dashboard Panel */}
            <div style={{ backgroundColor: "var(--dc-bg-card)", border: "1px solid var(--dc-border)", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff", borderBottom: "1px solid var(--dc-border)", paddingBottom: "10px", margin: 0 }}>
                ⚡ STUDENT PROGRESS PROFILE
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ backgroundColor: "var(--dc-bg-editor)", borderRadius: "6px", padding: "14px", border: "1px solid var(--dc-border)", textAlign: "center" }}>
                  <span style={{ fontSize: "24px" }}>🔥</span>
                  <h4 style={{ margin: "6px 0 2px 0", fontSize: "18px", fontWeight: "800", color: "var(--dc-amber)" }}>{progress.streak}</h4>
                  <p style={{ margin: 0, fontSize: "10.5px", color: "var(--dc-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Day Streak</p>
                </div>
                <div style={{ backgroundColor: "var(--dc-bg-editor)", borderRadius: "6px", padding: "14px", border: "1px solid var(--dc-border)", textAlign: "center" }}>
                  <span style={{ fontSize: "24px" }}>⚡</span>
                  <h4 style={{ margin: "6px 0 2px 0", fontSize: "18px", fontWeight: "800", color: "var(--dc-green)" }}>{progress.xp}</h4>
                  <p style={{ margin: 0, fontSize: "10.5px", color: "var(--dc-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Total XP</p>
                </div>
              </div>

              {/* Progress Summary stat blocks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--dc-text-muted)" }}>
                  <span>Completed chapters:</span>
                  <span style={{ fontWeight: "700", color: "#ffffff" }}>
                    {CHAPTERS.filter(c => c.lessons.every(l => progress.completedLessons.includes(l.id))).length} / 15
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--dc-text-muted)" }}>
                  <span>Active track focus:</span>
                  <span style={{ fontWeight: "700", color: "var(--dc-green)" }}>Chapter {activeChapterIndex + 1}</span>
                </div>
              </div>
            </div>

            {/* Achievements/Medals Sidebar Panel */}
            <div style={{ backgroundColor: "var(--dc-bg-card)", border: "1px solid var(--dc-border)", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff", borderBottom: "1px solid var(--dc-border)", paddingBottom: "10px", margin: 0 }}>
                🏆 ACQUIRED TROPHIES ({progress.achievements.length})
              </h3>

              <div className="achievements-dashboard-grid" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {progress.achievementsList.map((ach) => {
                  const isUnlocked = progress.achievements.includes(ach.id);
                  return (
                    <div 
                      key={ach.id} 
                      className={`medal-card ${isUnlocked ? "unlocked" : "locked"}`}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        backgroundColor: isUnlocked ? "rgba(255, 255, 255, 0.01)" : "transparent",
                        border: `1px solid ${isUnlocked ? "var(--dc-border-hover)" : "rgba(255,255,255,0.03)"}`, 
                        borderRadius: "6px", 
                        padding: "10px",
                        opacity: isUnlocked ? 1 : 0.4
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{isUnlocked ? ach.icon : "🔒"}</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: isUnlocked ? "#ffffff" : "var(--dc-text-muted)" }}>{ach.title}</h4>
                        <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--dc-text-muted)", lineHeight: "1.3" }}>{ach.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
