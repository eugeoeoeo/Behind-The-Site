import React, { useState, useEffect } from "react";

export default function FolderSandbox({ lesson, onCompletedChange }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [assignments, setAssignments] = useState({}); // { fileId: folderId }
  const [errors, setErrors] = useState({}); // { fileId: boolean }
  const [isDone, setIsDone] = useState(false);

  const sandboxConfig = lesson.sandbox || {};
  const files = sandboxConfig.files || [];
  const folders = sandboxConfig.folders || [];
  const correctAssignments = sandboxConfig.correctAssignments || {};

  useEffect(() => {
    // Reset state on lesson change
    setSelectedFile(null);
    setAssignments({});
    setErrors({});
    setIsDone(false);
  }, [lesson]);

  const handleFileClick = (file) => {
    if (isDone) return;
    setSelectedFile(selectedFile?.id === file.id ? null : file);
  };

  const handleFolderClick = (folder) => {
    if (isDone || !selectedFile) return;

    // Check if the selected file matches the correct assigned folder
    const isCorrect = correctAssignments[selectedFile.id] === folder.id;

    const newAssignments = { ...assignments, [selectedFile.id]: folder.id };
    const newErrors = { ...errors, [selectedFile.id]: !isCorrect };

    setAssignments(newAssignments);
    setErrors(newErrors);
    setSelectedFile(null);

    // Evaluate overall completion
    const allAssigned = files.every(f => newAssignments[f.id]);
    const allCorrect = files.every(f => newAssignments[f.id] && !newErrors[f.id]);

    if (allAssigned) {
      if (allCorrect) {
        setIsDone(true);
        onCompletedChange(true, "All backend layers arranged perfectly! Routes handle APIs, controllers handle parameters, services handle calculations, and models handle database layers.");
      } else {
        onCompletedChange(false, "Some files are placed in incorrect architectural folders. Review errors highlighted in red!");
      }
    }
  };

  const handleReset = () => {
    setAssignments({});
    setErrors({});
    setSelectedFile(null);
    setIsDone(false);
    onCompletedChange(false, null);
  };

  return (
    <div className="folder-sandbox-container">
      <div className="sandbox-instructions">
        <h3>📁 Layer Architecture Sandbox</h3>
        <p>{sandboxConfig.instructions || "Arrange the files below:"}</p>
      </div>

      <div className="sandbox-columns-grid">
        {/* Source Files list */}
        <div className="sandbox-source-card">
          <h4>🗂️ Unsorted Backend Files</h4>
          <div className="files-stack">
            {files.map(file => {
              const assignedFolderId = assignments[file.id];
              const isAssigned = !!assignedFolderId;
              const hasError = errors[file.id];
              const isSelected = selectedFile?.id === file.id;
              const folderName = folders.find(f => f.id === assignedFolderId)?.name || "";

              return (
                <button
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  disabled={isDone}
                  className={`sandbox-file-button ${isSelected ? "selected" : ""} ${isAssigned ? "assigned" : ""} ${hasError ? "error" : ""}`}
                >
                  <span className="file-icon">📄</span>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-desc">{file.desc}</span>
                  </div>
                  {isAssigned && (
                    <span className="assignment-badge">
                      {hasError ? "❌" : "➡️ " + folderName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Folders list */}
        <div className="sandbox-target-card">
          <h4>📂 Backend Directory Tree</h4>
          <div className="folders-grid">
            {folders.map(folder => {
              // Find files assigned to this folder
              const assignedHere = files.filter(
                f => assignments[f.id] === folder.id
              );

              return (
                <div
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  className={`sandbox-folder-box ${selectedFile ? "listening" : ""}`}
                >
                  <div className="folder-header">
                    <span className="folder-icon">📁</span>
                    <span className="folder-name">{folder.name}</span>
                  </div>
                  <span className="folder-hint">{folder.hint}</span>

                  <div className="folder-contents">
                    {assignedHere.length === 0 ? (
                      <span className="empty-placeholder">[Empty Directory]</span>
                    ) : (
                      assignedHere.map(f => (
                        <div key={f.id} className={`folder-assigned-file ${errors[f.id] ? "error" : "success"}`}>
                          📄 {f.name} {errors[f.id] ? "❌" : "✓"}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sandbox-actions">
        <button className="sandbox-reset-btn" onClick={handleReset}>
          🔄 Reset Sandbox Layers
        </button>
      </div>
    </div>
  );
}
