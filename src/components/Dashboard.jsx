import React, { useState, useEffect } from "react";
import { CHAPTERS } from "../data/courseData";
import { fetchUserProgress, saveUserProgress, resetUserProgress, queryAITutor, logoutUser, loginUser, signupUser } from "../services/apiService";
import { supabase } from "../services/supabaseClient";
import FolderSandbox from "./editor/FolderSandbox";
import TerminalConsole from "./simulator/TerminalConsole";

export default function Dashboard() {
  // Progress & Session states
  const [progress, setProgress] = useState(null);
  const [user, setUser] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  
  // Navigation & UI Triggers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  // Responsive device adapters
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeMobileTab, setActiveMobileTab] = useState("instructions"); // "instructions" | "workspace"

  // Gateway form states (when unauthenticated)
  const [gatewayView, setGatewayView] = useState("login"); // "login" | "signup"
  const [gatewayEmail, setGatewayEmail] = useState("");
  const [gatewayPassword, setGatewayPassword] = useState("");
  const [gatewayConfirmPassword, setGatewayConfirmPassword] = useState("");
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState(null);

  // Lesson workspace states
  const currentChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];
  const currentLesson = currentChapter.lessons[activeLessonIndex] || currentChapter.lessons[0];

  // Editor states
  const [codeValue, setCodeValue] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [sandboxPassed, setSandboxPassed] = useState(false);
  const [sandboxResult, setSandboxResult] = useState(null);

  // Console and feedback states
  const [logs, setLogs] = useState([]);
  const [success, setSuccess] = useState(null);
  const [validationTips, setValidationTips] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // AI Tutor state
  const [tutorMessage, setTutorMessage] = useState("");
  const [loadingTutor, setLoadingTutor] = useState(false);

  // 1. Fetch user progress from Supabase
  const loadProgress = async (currentUser) => {
    if (!currentUser) return;
    try {
      const data = await fetchUserProgress();
      setProgress(data);
      
      // Find matching chapter and lesson index from loaded progress ID
      if (data.activeLessonId) {
        let found = false;
        for (let cIdx = 0; cIdx < CHAPTERS.length; cIdx++) {
          const chap = CHAPTERS[cIdx];
          for (let lIdx = 0; lIdx < chap.lessons.length; lIdx++) {
            if (chap.lessons[lIdx].id === data.activeLessonId) {
              setActiveChapterIndex(cIdx);
              setActiveLessonIndex(lIdx);
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }
    } catch (e) {
      console.error("Failed to load student progress from API gateway", e);
    }
  };

  // 2. Setup resize listener and Supabase session state on mount
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);

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
      }
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      subscription.unsubscribe();
    };
  }, []);

  // 3. Sync editor, sandbox, and terminal logs whenever lesson changes
  useEffect(() => {
    if (currentLesson && user) {
      if (currentLesson.activityType === "code") {
        setCodeValue(currentLesson.startingCode);
      } else {
        setCodeValue("");
      }
      setSelectedOption(null);
      setSandboxPassed(false);
      setSandboxResult(null);
      setLogs([
        { type: "info", text: `Loaded Lesson ${currentLesson.id}: ${currentLesson.title}` }
      ]);
      setSuccess(null);
      setValidationTips("");
      setTutorMessage("");
      setActiveMobileTab("instructions");
    }
  }, [activeChapterIndex, activeLessonIndex, user]);

  // 4. Helper to update and persist progress
  const updateProgressState = async (newProgress) => {
    setProgress(newProgress);
    try {
      await saveUserProgress(newProgress);
    } catch (e) {
      console.error("Failed to sync progress to database", e);
    }
  };

  const handleLessonSelect = (chapIdx, lesIdx) => {
    setActiveChapterIndex(chapIdx);
    setActiveLessonIndex(lesIdx);
    setDrawerOpen(false); 
  };

  const handleRunCode = async () => {
    if (currentLesson.activityType !== "code") return;

    setIsRunning(true);
    setLogs((prev) => [...prev, { type: "info", text: "Compiling Python script..." }]);
    
    await new Promise((r) => setTimeout(r, 1000));
    setIsRunning(false);

    const pattern = new RegExp(currentLesson.validationRegex, "i");
    const isCodePassed = !codeValue.includes("____") && pattern.test(codeValue);

    if (isCodePassed) {
      setLogs((prev) => [
        ...prev,
        { type: "stdout", text: ">>> Running automated assert checks..." },
        { type: "success", text: "✓ Test Suite OK: Execution returned the expected structure." }
      ]);
      setSuccess(true);
      setValidationTips(`Checks passed! Click 'Submit Answer' to claim your +${currentLesson.xp} XP!`);
    } else {
      setLogs((prev) => [
        ...prev,
        { type: "error", text: "AssertionError: Expected outcome not met or syntax error placeholder found." }
      ]);
      setSuccess(false);
      setValidationTips("Assertion check failed. Review placeholders and correct standard API keywords.");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!progress) return;

    let passed = false;
    let feedback = "";

    if (currentLesson.activityType === "quiz") {
      if (selectedOption === currentLesson.correctAnswer) {
        passed = true;
        feedback = "Correct! Objective achieved.";
      } else {
        feedback = "Incorrect option chosen. Think about the concept rules and choose again.";
      }
    } else if (currentLesson.activityType === "code") {
      const pattern = new RegExp(currentLesson.validationRegex, "i");
      passed = !codeValue.includes("____") && pattern.test(codeValue);
      feedback = passed 
        ? "Excellent job! Python interpreter passed all constraints." 
        : "Failed checks. Try running your script to trace exceptions.";
    } else if (currentLesson.activityType === "sandbox") {
      passed = sandboxPassed;
      feedback = sandboxResult || "Arrange directory structure layers perfectly.";
    }

    if (passed) {
      setSuccess(true);
      setValidationTips(feedback);
      setLogs((prev) => [...prev, { type: "success", text: `Lesson ${currentLesson.id} complete! +${currentLesson.xp} XP` }]);
      
      // Award XP, check streak, unlock achievements
      const completedList = [...progress.completedLessons];
      if (!completedList.includes(currentLesson.id)) {
        completedList.push(currentLesson.id);
      }
      
      const newXP = progress.xp + currentLesson.xp;
      const achievements = [...progress.achievements];
      
      // Unlock first steps achievement
      if (!achievements.includes("first_steps")) {
        achievements.push("first_steps");
      }
      // Unlock folder master achievement
      if (currentLesson.activityType === "sandbox" && !achievements.includes("folder_master")) {
        achievements.push("folder_master");
      }
      // Unlock api architect achievement
      if (currentChapter.id === 3 && !achievements.includes("route_architect")) {
        achievements.push("route_architect");
      }

      // Check learning streak
      const today = new Date().toDateString();
      let streak = progress.streak;
      if (progress.lastActivityDate !== today) {
        streak = streak === 0 ? 1 : streak + 1;
      }

      const updatedProgress = {
        ...progress,
        completedLessons: completedList,
        xp: newXP,
        streak,
        lastActivityDate: today,
        achievements,
        activeLessonId: currentLesson.id
      };
      
      await updateProgressState(updatedProgress);
    } else {
      setSuccess(false);
      setValidationTips(feedback);
      setLogs((prev) => [...prev, { type: "error", text: "Verification rejected. Revise solutions." }]);
    }
  };

  const handleGetHint = async () => {
    if (!progress || progress.xp < 10) {
      setLogs((prev) => [...prev, { type: "error", text: "Insufficient XP balance! Hints require at least 10 XP." }]);
      return;
    }
    
    // Deduct 10 XP
    const updatedProgress = {
      ...progress,
      xp: Math.max(0, progress.xp - 10)
    };
    await updateProgressState(updatedProgress);

    setLogs((prev) => [
      ...prev,
      { type: "info", text: `Deducted 10 XP for hint request. XP Balance: ${updatedProgress.xp}` },
      { type: "info", text: `💡 Hint: ${currentLesson.hint}` }
    ]);
    setValidationTips(`💡 Hint: ${currentLesson.hint}`);
  };

  const handleShowSolution = () => {
    if (currentLesson.activityType === "code") {
      setCodeValue(currentLesson.correctCode);
      setLogs((prev) => [...prev, { type: "info", text: "Solution loaded into the editor panel." }]);
    } else if (currentLesson.activityType === "quiz") {
      setSelectedOption(currentLesson.correctAnswer);
      setLogs((prev) => [...prev, { type: "info", text: `Correct answer highlighted: option ${currentLesson.correctAnswer + 1}.` }]);
    }
  };

  const handleNextLesson = () => {
    let nextLesIdx = activeLessonIndex + 1;
    let nextChapIdx = activeChapterIndex;

    if (nextLesIdx >= currentChapter.lessons.length) {
      nextLesIdx = 0;
      nextChapIdx = activeChapterIndex + 1;
    }

    if (nextChapIdx < CHAPTERS.length) {
      setActiveChapterIndex(nextChapIdx);
      setActiveLessonIndex(nextLesIdx);
    } else {
      setLogs((prev) => [...prev, { type: "success", text: "Congratulations! You have completed all micro-lessons!" }]);
    }
  };

  const handleAskTutor = async () => {
    setLoadingTutor(true);
    setTutorMessage("");
    try {
      const prompt = currentLesson.activityType === "code" ? codeValue : `Question choice: ${selectedOption}`;
      const feedback = await queryAITutor(prompt, currentLesson);
      setTutorMessage(feedback);
    } catch (e) {
      setTutorMessage("Failed to connect to AI tutor endpoint. Try again later.");
    } finally {
      setLoadingTutor(false);
    }
  };

  const handleResetCourse = async () => {
    if (window.confirm("Are you sure you want to reset all your cloud streak, achievements, and XP progress?")) {
      try {
        const resetProgressData = await resetUserProgress();
        setProgress(resetProgressData);
        setActiveChapterIndex(0);
        setActiveLessonIndex(0);
      } catch (e) {
        console.error("Failed to reset student progress via API", e);
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await logoutUser();
      } catch (e) {
        console.error("Logout failed", e);
      }
    }
  };

  // Gateway form submits
  const handleGatewaySubmit = async (e) => {
    e.preventDefault();
    setGatewayLoading(true);
    setGatewayMessage(null);

    try {
      if (gatewayView === "login") {
        if (!gatewayEmail || !gatewayPassword) throw new Error("Email and password are required.");
        await loginUser(gatewayEmail, gatewayPassword);
        setGatewayMessage({ type: "success", text: "Signed in successfully! Loading course workspace..." });
      } else {
        if (!gatewayEmail || !gatewayPassword) throw new Error("Email and password are required.");
        if (gatewayPassword !== gatewayConfirmPassword) throw new Error("Passwords do not match.");
        if (gatewayPassword.length < 6) throw new Error("Password must be at least 6 characters.");
        
        await signupUser(gatewayEmail, gatewayPassword);
        setGatewayMessage({ type: "success", text: "Account created successfully! Check your email to confirm or log in." });
        setTimeout(() => {
          setGatewayView("login");
          setGatewayMessage(null);
          setGatewayPassword("");
          setGatewayConfirmPassword("");
        }, 3000);
      }
    } catch (err) {
      setGatewayMessage({ type: "error", text: err.message || "An authentication error occurred." });
    } finally {
      setGatewayLoading(false);
    }
  };

  // 1. STRICT LOCK: Renders the full-screen Welcome Gateway if unauthenticated
  if (!user) {
    return (
      <div className="welcome-gateway-container">
        <div className="gateway-center-card">
          {/* Left section: Features list */}
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

          {/* Right section: Auth Form Stack */}
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

            {/* Social logins matching DataCamp */}
            <div className="gateway-social-grid">
              <button type="button" className="gateway-social-btn" onClick={() => alert("Google Single Sign-On is simulated in development mode.")}>
                <svg viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.69 5.69 0 0 1 8.24 12.8a5.69 5.69 0 0 1 5.751-5.714c2.519 0 4.13 1.094 5.084 2.01l3.003-2.946C20.25 4.347 17.202 3 13.99 3A9.79 9.79 0 0 0 4.24 12.8a9.79 9.79 0 0 0 9.75 9.8c5.444 0 9.76-3.834 9.76-9.8 0-.596-.058-1.184-.158-1.515H12.24Z"/>
                </svg>
                Google
              </button>
              <button type="button" className="gateway-social-btn" onClick={() => alert("GitHub Single Sign-On is simulated in development mode.")}>
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

  // 2. LOADING STATE: Renders while fetching authenticated student profile from Supabase
  if (!progress) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Connecting to BehindTheSite Database...</p>
      </div>
    );
  }

  // 3. WORKSPACE: Renders only when user has a valid Supabase authenticated session
  return (
    <div className="dashboard-container">
      {/* HEADER BAR */}
      <header className="dashboard-header">
        <div className="header-left-side">
          <button className="hamburger-menu-btn" onClick={() => setDrawerOpen(!drawerOpen)} title="Open Course Syllabus">
            ☰
          </button>
          <div className="breadcrumbs-path">
            <span className="chapter-label">CH {currentChapter.id}</span>
            <span className="path-arrow">➔</span>
            <span className="lesson-label">{currentLesson.id}</span>
          </div>
        </div>

        <div className="header-right-stats">
          <div className="stat-pill streak" title="Activity Streak">
            🔥 <span className="stat-val">{progress.streak}</span>
          </div>
          <div className="stat-pill xp" title="Student Experience Points">
            ⚡ <span className="stat-val">{progress.xp} XP</span>
          </div>
          <button className="badges-trigger-btn" onClick={() => setShowBadges(!showBadges)}>
            🏆 {progress.achievements.length}
          </button>

          <button className="badges-trigger-btn" style={{ borderColor: "rgba(59, 130, 246, 0.4)", color: "#3b82f6" }} title={`Logged in as ${user.email}`}>
            👤 {user.email.split("@")[0]}
          </button>
          <button className="reset-api-btn" onClick={handleLogout} title="Log Out">
            🚪
          </button>
        </div>
      </header>

      {/* MOBILE RESPONSIVE TAB BARS */}
      {isMobile && (
        <div className="mobile-viewport-tabs">
          <button 
            className={`mobile-tab-btn ${activeMobileTab === "instructions" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("instructions")}
          >
            📖 Instructions
          </button>
          <button 
            className={`mobile-tab-btn ${activeMobileTab === "workspace" ? "active" : ""}`}
            onClick={() => setActiveMobileTab("workspace")}
          >
            💻 Workspace & Console
          </button>
        </div>
      )}

      {/* FLOATING SYLLABUS OVERLAY DRAWER */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-side-menu" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-menu-header">
              <h3>BehindTheSite Syllabus</h3>
              <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
            <div className="drawer-chapters-container">
              {CHAPTERS.map((chap, cIdx) => {
                const isCurrentChap = cIdx === activeChapterIndex;
                return (
                  <div key={chap.id} className={`drawer-chapter-block ${isCurrentChap ? "active" : ""}`}>
                    <div className="drawer-chap-info">
                      <span className="drawer-chap-num">Chapter {chap.id}</span>
                      <h4>{chap.title}</h4>
                    </div>
                    <div className="drawer-lessons-block">
                      {chap.lessons.map((les, lIdx) => {
                        const isCurrentLes = isCurrentChap && lIdx === activeLessonIndex;
                        const isCompleted = progress.completedLessons.includes(les.id);
                        return (
                          <button
                            key={les.id}
                            onClick={() => handleLessonSelect(cIdx, lIdx)}
                            className={`drawer-lesson-button ${isCurrentLes ? "current" : ""} ${isCompleted ? "completed" : ""}`}
                          >
                            <span className="lesson-status-bullet">{isCompleted ? "✓" : "○"}</span>
                            <span className="lesson-id-title">{les.id}. {les.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS MODAL */}
      {showBadges && (
        <div className="badges-drawer-overlay" onClick={() => setShowBadges(false)}>
          <div className="badges-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>🏆 Unlocked Badges</h3>
              <button className="close-btn" onClick={() => setShowBadges(false)}>×</button>
            </div>
            <div className="badges-grid">
              {progress.achievementsList.map((ach) => {
                const isUnlocked = progress.achievements.includes(ach.id);
                return (
                  <div key={ach.id} className={`badge-card ${isUnlocked ? "unlocked" : "locked"}`}>
                    <div className="badge-icon">{isUnlocked ? ach.icon : "🔒"}</div>
                    <div className="badge-details">
                      <h4>{ach.title}</h4>
                      <p>{ach.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE LAYOUT */}
      <div className="workspace-layout">
        {/* LEFT COLUMN PANEL (Instructions) */}
        <div className={`workspace-left-instructions-pane ${(!isMobile || activeMobileTab === "instructions") ? "active-tab" : ""}`}>
          <div className="instructions-scrollable-content">
            <div className="instructions-section-tag">
              Section {currentLesson.id.split(".")[0]} ➔ Micro-Lesson {currentLesson.id}
            </div>
            <h2 className="lesson-title-heading">{currentLesson.title}</h2>

            <div className="instructions-markdown-body">
              <p className="concept-paragraph">{currentLesson.concept}</p>
              
              {currentLesson.startingCode && currentLesson.activityType === "code" && (
                <div className="instructions-code-callout">
                  <code>python -m bts.service</code>
                </div>
              )}

              <p className="concept-paragraph">{currentLesson.problem}</p>
            </div>

            <div className="datacamp-instructions-checklist-box">
              <div className="instructions-box-header">
                <span className="box-title">INSTRUCTIONS</span>
              </div>
              <div className="instructions-box-body">
                <ul className="instructions-steps-list">
                  {currentLesson.activityType === "code" && (
                    <li>
                      <span className="step-bullet">■</span>
                      <span>Modify/Build code in <code>main.py</code>. Complete all <code>____</code> placeholders to meet the validations.</span>
                    </li>
                  )}
                  {currentLesson.activityType === "quiz" && (
                    <li>
                      <span className="step-bullet">■</span>
                      <span>Read the question and select the single best option matching professional guidelines.</span>
                    </li>
                  )}
                  {currentLesson.activityType === "sandbox" && (
                    <li>
                      <span className="step-bullet">■</span>
                      <span>Link all modular folder layers on the matchsandbox directory to organize folders correctly.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN PANEL (IDE) */}
        <div className={`workspace-right-ide-pane ${(!isMobile || activeMobileTab === "workspace") ? "active-tab" : ""}`}>
          <div className="workspace-right-top-editor">
            {/* Tab Bar */}
            <div className="editor-tab-bar">
              <div className="active-tab-file">
                <span className="file-icon">📄</span>
                <span className="file-name">
                  {currentLesson.activityType === "code" ? "main.py" : currentLesson.activityType === "quiz" ? "Assessment" : "matchsandbox"}
                </span>
              </div>
              <div className="editor-language-tag">
                <span>{currentLesson.activityType === "code" ? "Python 3" : "Active Exercise"}</span>
              </div>
            </div>

            {/* Editor Workspace */}
            <div className="editor-workspace-content">
              {/* CODE WORKSPACE */}
              {currentLesson.activityType === "code" && (
                <div className="datacamp-textarea-editor">
                  <div className="editor-line-numbers">
                    {codeValue.split("\n").map((_, idx) => (
                      <div key={idx} className="line-num">{idx + 1}</div>
                    ))}
                  </div>
                  <textarea
                    value={codeValue}
                    onChange={(e) => setCodeValue(e.target.value)}
                    spellCheck="false"
                    className="monospaced-textarea"
                  />
                </div>
              )}

              {/* QUIZ WORKSPACE */}
              {currentLesson.activityType === "quiz" && (
                <div className="datacamp-quiz-selection-stack">
                  <div className="quiz-question-title">
                    <h3>{currentLesson.question}</h3>
                  </div>
                  <div className="quiz-options-list">
                    {currentLesson.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedOption(idx)}
                          className={`quiz-option-row-btn ${isSelected ? "selected" : ""}`}
                        >
                          <span className="option-index">{String.fromCharCode(65 + idx)}</span>
                          <span className="option-text-label">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SANDBOX WORKSPACE */}
              {currentLesson.activityType === "sandbox" && (
                <FolderSandbox
                  lesson={currentLesson}
                  onCompletedChange={(passed, resultText) => {
                    setSandboxPassed(passed);
                    setSandboxResult(resultText);
                  }}
                />
              )}
            </div>
          </div>

          {/* Terminal Console */}
          <div className="workspace-right-bottom-console">
            <TerminalConsole 
              logs={logs} 
              success={success} 
              validationTips={validationTips} 
            />
          </div>

          {/* INTEGRATED ACTION FOOTER */}
          <footer className="ide-control-footer">
            <div className="footer-left-controls">
              <button className="control-action-btn show-sol" onClick={handleShowSolution} title="Review correct script">
                🔑 Solution
              </button>
              <button className="control-action-btn get-hint" onClick={handleGetHint} title="Costs 10 XP">
                💡 Hint (-10)
              </button>
              <button className="control-action-btn consult-tutor" onClick={handleAskTutor} disabled={loadingTutor}>
                🤖 {loadingTutor ? "..." : "Ask Tutor"}
              </button>
            </div>

            <div className="footer-right-actions">
              {currentLesson.activityType === "code" && (
                <button className="action-main-btn run-code-btn" onClick={handleRunCode}>
                  ▶ Run Code
                </button>
              )}
              
              {success === true ? (
                <button className="action-main-btn next-lesson-btn glow" onClick={handleNextLesson}>
                  Next ➔
                </button>
              ) : (
                <button className="action-main-btn submit-answer-btn" onClick={handleSubmitAnswer}>
                  🚀 Submit
                </button>
              )}
            </div>
          </footer>
        </div>

        {/* AI TUTOR CHAT POPUP */}
        {tutorMessage && (
          <div className="floating-ai-tutor-bubble">
            <div className="floating-tutor-header">
              <h4>🤖 AI Tutor Feedback</h4>
              <button onClick={() => setTutorMessage("")} className="floating-tutor-close">×</button>
            </div>
            <div className="floating-tutor-body">
              <p>{tutorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
