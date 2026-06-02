import React, { useEffect, useState } from "react";

export default function FlowVisualizer({ activeNode, isRunning }) {
  const steps = [
    { name: "Client", icon: "💻", desc: "User Browser" },
    { name: "Request", icon: "➡️", desc: "HTTP HTTP/2" },
    { name: "Route", icon: "🛤️", desc: "FastAPI Endpoint" },
    { name: "Controller", icon: "🧠", desc: "Route Controller" },
    { name: "Service", icon: "⚙️", desc: "Business Logic" },
    { name: "Database", icon: "🗄️", desc: "SQL Model ORM" },
    { name: "Response", icon: "⬅️", desc: "JSON/Status" }
  ];

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (isRunning) {
      // Create a sequential lighting pulse across all steps
      let current = 0;
      setHighlightedIndex(0);
      const interval = setInterval(() => {
        current += 1;
        if (current < steps.length) {
          setHighlightedIndex(current);
        } else {
          clearInterval(interval);
          setHighlightedIndex(-1);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      // Fallback: highlight index matching activeNode description
      if (activeNode) {
        const idx = steps.findIndex(s => s.name.toLowerCase() === activeNode.toLowerCase());
        setHighlightedIndex(idx);
      } else {
        setHighlightedIndex(-1);
      }
    }
  }, [isRunning, activeNode]);

  return (
    <div className="flow-visualizer-card">
      <div className="flow-title">
        <span>🔄 BACKEND REQUEST PIPELINE VISUALIZER</span>
        {isRunning && <span className="pulse-tag">PROCESSING REQUEST...</span>}
      </div>
      
      <div className="flow-pipeline-row">
        {steps.map((step, idx) => {
          const isActive = idx === highlightedIndex;
          const isCompleted = isRunning && highlightedIndex !== -1 && idx < highlightedIndex;
          
          return (
            <React.Fragment key={step.name}>
              <div 
                className={`flow-node ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                title={step.desc}
              >
                <div className="node-icon">{step.icon}</div>
                <div className="node-name">{step.name}</div>
                <div className="node-glow-ring"></div>
              </div>
              
              {idx < steps.length - 1 && (
                <div className={`flow-connector ${isCompleted ? "completed" : ""}`}>
                  <div className="connector-arrow">➔</div>
                  <div className="connector-pulse"></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flow-caption">
        {highlightedIndex === -1 ? (
          <p>👉 Write code or answer questions, then click <strong>Run Code</strong> or <strong>Submit</strong> to watch the HTTP transaction cycle through the pipeline!</p>
        ) : (
          <p className="flow-active-text">
            🟢 Active Layer: <strong>{steps[highlightedIndex].name}</strong> — {steps[highlightedIndex].desc}
          </p>
        )}
      </div>
    </div>
  );
}
