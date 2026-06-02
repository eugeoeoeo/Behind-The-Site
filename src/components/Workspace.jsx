import React, { useState, useEffect } from "react";
import { CHAPTERS } from "../data/courseData";
import { queryAITutor } from "../services/apiService";
import FolderSandbox from "./editor/FolderSandbox";
import TerminalConsole from "./simulator/TerminalConsole";

export default function Workspace({
  user,
  progress,
  activeChapterIndex,
  activeLessonIndex,
  onBackToDashboard,
  onLessonSelect,
  onProgressUpdate
}) {
  // Navigation markers
  const currentChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];
  const currentLesson = currentChapter.lessons[activeLessonIndex] || currentChapter.lessons[0];

  // Editor and simulation states
  const [codeValue, setCodeValue] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [sandboxPassed, setSandboxPassed] = useState(false);
  const [sandboxResult, setSandboxResult] = useState(null);

  // Console output
  const [logs, setLogs] = useState([]);
  const [success, setSuccess] = useState(null);
  const [validationTips, setValidationTips] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // AI assistant popup
  const [tutorMessage, setTutorMessage] = useState("");
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Mobile adapter
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeMobileTab, setActiveMobileTab] = useState("instructions");

  // Sync window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset workspace state whenever active lesson switches
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
      setActiveMobileTab("instructions");
    }
  }, [activeChapterIndex, activeLessonIndex]);

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
      
      const completedList = [...progress.completedLessons];
      if (!completedList.includes(currentLesson.id)) {
        completedList.push(currentLesson.id);
      }
      
      const newXP = progress.xp + currentLesson.xp;
      const achievements = [...progress.achievements];
      
      if (!achievements.includes("first_steps")) {
        achievements.push("first_steps");
      }
      if (currentLesson.activityType === "sandbox" && !achievements.includes("folder_master")) {
        achievements.push("folder_master");
      }
      if (currentChapter.id === 3 && !achievements.includes("route_architect")) {
        achievements.push("route_architect");
      }

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
      
      await onProgressUpdate(updatedProgress);
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
    
    const updatedProgress = {
      ...progress,
      xp: Math.max(0, progress.xp - 10)
    };
    await onProgressUpdate(updatedProgress);

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
      onLessonSelect(nextChapIdx, nextLesIdx);
    } else {
      setLogs((prev) => [...prev, { type: "success", text: "Congratulations! You have completed BehindTheSite!" }]);
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

  return (
    <div className="workspace-view-root" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* 1. HEADER BAR */}
      <header className="dashboard-header" style={{ height: "52px" }}>
        <div className="header-left-side">
          <button className="hamburger-menu-btn" onClick={onBackToDashboard} title="Back to Student Dashboard">
            ✕
          </button>
          <div className="breadcrumbs-path">
            <span className="chapter-label">CH {currentChapter.id}</span>
            <span className="path-arrow">➔</span>
            <span className="lesson-label">{currentLesson.id}. {currentLesson.title}</span>
          </div>
        </div>

        <div className="header-right-stats">
          <div className="stat-pill streak" title="Activity Streak">
            🔥 <span className="stat-val">{progress.streak}</span>
          </div>
          <div className="stat-pill xp" title="Student Experience Points">
            ⚡ <span className="stat-val">{progress.xp} XP</span>
          </div>
          <button className="badges-trigger-btn" style={{ borderColor: "rgba(3, 239, 98, 0.4)", color: "var(--dc-green)" }}>
            👤 {user.email.split("@")[0]}
          </button>
        </div>
      </header>

      {/* 2. MOBILE RESPONSIVE TAB BARS */}
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

      {/* 3. WORKSPACE COLUMNS SPLIT */}
      <div className="workspace-layout">
        {/* LEFT COLUMN PANEL (Instructions - Light themed) */}
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
                  <code>python main.py</code>
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
                      <span>Read the security question and select the single best option matching professional guidelines.</span>
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

        {/* RIGHT COLUMN PANEL (IDE - Dark themed) */}
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

          {/* Terminal Console (IPython shell) */}
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

        {/* FLOATING AI TUTOR CHAT POPUP */}
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
