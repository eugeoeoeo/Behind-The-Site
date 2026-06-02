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
        <div className="terminal-title">IPython Shell</div>
      </div>
      
      <div className="terminal-body" style={{ backgroundColor: "#020d18" }}>
        <div className="terminal-line system-welcome" style={{ color: "#617d98", marginBottom: "8px" }}>
          <span>In [1]: # IPython interactive session synced to Supabase database.</span>
        </div>

        {logs.map((log, idx) => {
          const promptNum = idx + 2;
          let promptColor = "#03ef62"; // Neon Green
          let textColor = "#ffffff";
          let tag = "";

          if (log.type === "error") {
            promptColor = "#ef4444";
            textColor = "#ff6b6b";
            tag = "AssertionError: ";
          } else if (log.type === "info") {
            promptColor = "#3b82f6";
            textColor = "#8fa0ba";
          } else if (log.type === "success") {
            promptColor = "#03ef62";
            textColor = "#03ef62";
          }

          return (
            <div key={idx} className={`terminal-line ${log.type || "stdout"}`} style={{ marginBottom: "6px" }}>
              <span className="prompt-indicator" style={{ color: promptColor, marginRight: "8px", fontWeight: "700" }}>
                In [{promptNum}]:
              </span>
              <span className="line-text" style={{ color: textColor }}>
                {tag}{log.text}
              </span>
            </div>
          );
        })}

        {success === true && (
          <div className="terminal-result-banner success" style={{ backgroundColor: "rgba(3, 239, 98, 0.08)", border: "1px solid #03ef62", borderRadius: "4px", padding: "10px", marginTop: "10px", color: "#03ef62" }}>
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800" }}>✓ SUCCESS: EXERCISE RESOLVED</h4>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#d0dbe9" }}>{validationTips || "All assertions passed successfully."}</p>
          </div>
        )}

        {success === false && (
          <div className="terminal-result-banner failure" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid #ef4444", borderRadius: "4px", padding: "10px", marginTop: "10px", color: "#ef4444" }}>
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800" }}>❌ ASSERTION ERROR</h4>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#d0dbe9" }}>{validationTips || "Review the checklist requirements and run checks again."}</p>
          </div>
        )}

        <div className="terminal-input-prompt" style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
          <span className="prompt-indicator" style={{ color: "#3b82f6", fontWeight: "700" }}>In [{logs.length + 2}]:</span>
          <span className="cursor-caret" style={{ color: "#ffffff" }}>█</span>
        </div>
      </div>
    </div>
  );
}
