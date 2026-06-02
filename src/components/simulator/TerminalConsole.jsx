import React from "react";

export default function TerminalConsole({ logs, success, validationTips }) {
  return (
    <div className="terminal-console-container">
      <div className="terminal-header">
        <div className="terminal-controls">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <div className="terminal-title">bash - python - behindthesite@server</div>
      </div>
      
      <div className="terminal-body">
        <div className="terminal-line system-welcome">
          <span>Python 3.12.1 (main, Jan 24 2026, 10:14:22)</span>
          <br />
          <span>Type "help", "copyright", "credits" or "license" for more information.</span>
        </div>

        {logs.map((log, idx) => (
          <div key={idx} className={`terminal-line ${log.type || "stdout"}`}>
            {log.type === "error" && <span className="term-err-tag">❌ [ERROR]</span>}
            {log.type === "success" && <span className="term-ok-tag">✓ [SUCCESS]</span>}
            {log.type === "info" && <span className="term-info-tag">⚙️ [SYSTEM]</span>}
            <span className="line-text"> {log.text}</span>
          </div>
        ))}

        {success === true && (
          <div className="terminal-result-banner success">
            <h4>🎉 EXERCISE RESOLVED SUCCESSFULLY!</h4>
            <p>{validationTips || "All tests passed. You have successfully fulfilled all backend assertions!"}</p>
          </div>
        )}

        {success === false && (
          <div className="terminal-result-banner failure">
            <h4>⚠️ RUNTIME OR SCHEMATIC ASSERTION FAILED</h4>
            <p>{validationTips || "Your code did not satisfy the logical expressions. Review the instructions and request hints if needed."}</p>
          </div>
        )}

        <div className="terminal-input-prompt">
          <span className="prompt-indicator">behindthesite:~/project$</span>
          <span className="cursor-caret">█</span>
        </div>
      </div>
    </div>
  );
}
