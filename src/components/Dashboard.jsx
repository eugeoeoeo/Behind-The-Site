import React, { useState, useEffect } from "react";
import { CHAPTERS } from "../data/courseData";
import { fetchUserProgress, saveUserProgress, resetUserProgress, queryAITutor, logoutUser } from "../services/apiService";
import { supabase } from "../services/supabaseClient";
import FolderSandbox from "./editor/FolderSandbox";
import TerminalConsole from "./simulator/TerminalConsole";
import AuthModal from "./auth/AuthModal";

export default function Dashboard() {
  // Progress & Session states
  const [progress, setProgress] = useState(null);
  const [user, setUser] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  
  // Modals & Navigation triggers
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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

  // 1. Fetch user progress from Supabase or Local Guest fallback
  const loadProgress = async (currentUser) => {
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

  // 2. Setup Supabase Auth state listener on mount
  useEffect(() => {
    // Check active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      loadProgress(activeUser);
    });

    // Listen for Auth updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      loadProgress(activeUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Sync editor, sandbox, and terminal logs whenever lesson changes
  useEffect(() => {
    if (currentLesson) {
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
    }
  }, [activeChapterIndex, activeLessonIndex]);

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
    setDrawerOpen(false); // Close nav drawer automatically on selection
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

  if (!progress) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Connecting to BehindTheSite Database...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* 1. TOP HEADER (Pure DataCamp style: chapter breadcrumbs and stats) */}
      <header className="dashboard-header">
        <div className="header-left-side">
          <button className="hamburger-menu-btn" onClick={() => setDrawerOpen(!drawerOpen)} title="Open Course Syllabus">
            ☰
          </button>
          <div className="breadcrumbs-path">
            <span className="chapter-label">CH {currentChapter.id}: {currentChapter.title}</span>
            <span className="path-arrow">➔</span>
            <span className="lesson-label">{currentLesson.id}: {currentLesson.title}</span>
          </div>
        </div>

        <div className="header-right-stats">
          <div className="stat-pill streak" title="Activity Streak">
            🔥 <span className="stat-val">{progress.streak} Day Streak</span>
          </div>
          <div className="stat-pill xp" title="Student Experience Points">
            ⚡ <span className="stat-val">{progress.xp} XP</span>
          </div>
          <button className="badges-trigger-btn" onClick={() => setShowBadges(!showBadges)}>
            🏆 Badges ({progress.achievements.length})
          </button>

          {user ? (
            <>
              <button className="badges-trigger-btn" style={{ borderColor: "rgba(59, 130, 246, 0.4)", color: "#3b82f6" }} title={`Logged in as ${user.email}`}>
                👤 {user.email.split("@")[0]}
              </button>
              <button className="reset-api-btn" onClick={handleLogout} title="Log Out">
                🚪 Logout
              </button>
            </>
          ) : (
            <button className="badges-trigger-btn" style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none" }} onClick={() => setIsAuthOpen(true)}>
              🔑 Login / Sign Up
            </button>
          )}

          <button className="reset-api-btn" onClick={handleResetCourse} title="Reset Course Data">
            🔄 Reset
          </button>
        </div>
      </header>

      {/* 1.1 GUEST WARNING TOP BANNER */}
      {progress.isGuest && (
        <div className="guest-warning-top-banner">
          <span>⚠️ Guest Sandbox: Your XP and completed chapters are saved in-memory only.</span>
          <button onClick={() => setIsAuthOpen(true)}>🔑 Create Account to Save Progress</button>
        </div>
      )}

      {/* 2. FLOATING SYLLABUS OVERLAY DRAWER (Sliding menu outline of 15 chapters) */}
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

      {/* 3. ACHIEVEMENTS MODAL */}
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

      {/* 4. WORKSPACE LAYOUT (DataCamp Side-by-Side 40% Left / 60% Right split screen) */}
      <div className="workspace-layout">
        {/* LEFT COLUMN PANEL (40% width - pure lesson texts & objectives instructions) */}
        <div className="workspace-left-instructions-pane">
          <div className="instructions-scrollable-content">
            {/* Breadcrumb section indicator */}
            <div className="instructions-section-tag">
              <span>Section A ➔ Micro-Lesson {currentLesson.type}</span>
            </div>

            {/* Concept text explanation */}
            <div className="instructions-markdown-body">
              <p className="concept-lead-text">{currentLesson.concept}</p>
              
              <div className="instructions-concept-block">
                <h4>🧠 Focus Concept</h4>
                <p>{currentLesson.problem}</p>
              </div>
            </div>

            {/* Strict, Bordered DataCamp Instructions Checklist Box */}
            <div className="datacamp-instructions-checklist-box">
              <div className="instructions-box-header">
                <span className="box-title">INSTRUCTIONS</span>
              </div>
              <div className="instructions-box-body">
                <p className="instructions-step-intro">Write code or answers to accomplish the following:</p>
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
                      <span>Read the security question and select the single best option matching professional guidelines.</span>
                    </li>
                  )}
                  {currentLesson.activityType === "sandbox" && (
                    <li>
                      <span className="step-bullet">■</span>
                      <span>Link all modular folder layers on the matchsandbox directory to organize routes, models, services, and configs correctly.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Embedded AI Tutor Assistant Dialogue directly below instruction card */}
            {tutorMessage && (
              <div className="embedded-tutor-assistant-card">
                <div className="tutor-card-header">
                  <span>🤖 AI Tutor Assistant</span>
                  <button onClick={() => setTutorMessage("")} className="tutor-close-btn">×</button>
                </div>
                <div className="tutor-card-body">
                  <p>{tutorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN PANEL (60% width - active coding editor/choices and console outputs) */}
        <div className="workspace-right-ide-pane">
          {/* TOP RIGHT: Editor / Quiz Stack */}
          <div className="workspace-right-top-editor">
            {/* Tab Bar (pure DataCamp IDE design) */}
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

            {/* Dynamic Workspace Workspace */}
            <div className="editor-workspace-content">
              {/* 1. CODE WORKSPACE */}
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

              {/* 2. QUIZ WORKSPACE */}
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

              {/* 3. SANDBOX WORKSPACE */}
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

          {/* BOTTOM RIGHT: IPython-like Command Terminal Output */}
          <div className="workspace-right-bottom-console">
            <TerminalConsole 
              logs={logs} 
              success={success} 
              validationTips={validationTips} 
            />
          </div>

          {/* INTEGRATED ACTION FOOTER BAR (Replicating DataCamp controls exactly) */}
          <footer className="ide-control-footer">
            <div className="footer-left-controls">
              <button className="control-action-btn show-sol" onClick={handleShowSolution} title="Review correct script">
                🔑 Show Solution
              </button>
              <button className="control-action-btn get-hint" onClick={handleGetHint} title="Costs 10 XP">
                💡 Hint (-10 XP)
              </button>
              <button className="control-action-btn consult-tutor" onClick={handleAskTutor} disabled={loadingTutor}>
                🤖 {loadingTutor ? "Consulting AI..." : "Consult AI Tutor"}
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
                  Next Lesson ➔
                </button>
              ) : (
                <button className="action-main-btn submit-answer-btn" onClick={handleSubmitAnswer}>
                  🚀 Submit Answer
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      {/* 5. GORGEOUS SLEEK AUTHENTICATION MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => loadProgress(user)}
      />
    </div>
  );
}
