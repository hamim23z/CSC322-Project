/*
 * Developer: Sadia Nawaz
 * Refactored to use external CSS (TextEditor.css)
 */

"use client";
import React, { useState } from "react";
import {
  Button,
  Input,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from "@mui/material";
import "./TextEditor.css";

const BLACKLIST = {
  badword: "*******",
  example: "*******",
};

const INITIAL_TOKENS = 100;

const TextEditor = () => {
  const [userRole, setUserRole] = useState("free");
  const [lastSubmitTime, setLastSubmitTime] = useState(null);
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [message, setMessage] = useState("");
  const [correctionType, setCorrectionType] = useState("self");
  const [corrections, setCorrections] = useState([]);
  const [llmText, setLlmText] = useState("");
  const [llmCorrections, setLlmCorrections] = useState([]);
  const [reason, setReason] = useState("");
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [userRequests, setUserRequests] = useState([
    { id: 1, name: "Alice Johnson" },
    { id: 2, name: "Bob Smith" },
    { id: 3, name: "Charlie Lee" },
  ]);

  const handleTextChange = (e) => setText(e.target.value);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setText(e.target.result);
      reader.readAsText(file);
    }
  };

  const processText = () => {
    const now = new Date();
    if (userRole === "free") {
      const words = text.trim().split(/\s+/);
      if (words.length > 20) {
        setMessage("Free users can only submit up to 20 words.");
        return;
      }
      if (lastSubmitTime && now - lastSubmitTime < 3 * 60 * 1000) {
        setMessage("Please wait 3 minutes before submitting again.");
        return;
      }
      setLastSubmitTime(now);
    }

    const words = text.split(/\s+/);
    const wordCount = words.length;
    let tokenCost = wordCount;
    let processedText = text;

    Object.keys(BLACKLIST).forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = text.match(regex);
      if (matches) {
        tokenCost += matches.length * word.length;
        processedText = processedText.replace(regex, BLACKLIST[word]);
      }
    });

    if (tokens < wordCount) {
      setTokens(Math.max(0, tokens / 2));
      setMessage("Not enough tokens! Half of your remaining tokens have been deducted.");
    } else {
      setTokens(tokens - tokenCost);
      setText(processedText);
      setMessage("Text processed successfully.");
    }
  };

  const handleCorrectionTypeChange = (event) => setCorrectionType(event.target.value);

  const handleLLMProcess = () => {
    const simulatedCorrections = [
      { word: "badword", corrected: "goodword" },
      { word: "example", corrected: "sample" },
    ];
    setLlmCorrections(simulatedCorrections);
    setLlmText(text.replace("badword", "goodword").replace("example", "sample"));
  };

  const acceptLLMCorrection = (word) => {
    setCorrections([...corrections, word]);
    setTokens(tokens - 1);
  };

  const rejectLLMCorrection = (word, reason) => {
    const isValidReason = reason.trim() !== "";
    setTokens(tokens - (isValidReason ? 1 : 5));
    setMessage(`Rejected correction for ${word}`);
  };

  const saveText = () => {
    if (tokens >= 5) {
      setTokens(tokens - 5);
      setMessage("Text saved successfully.");
    } else {
      setMessage("Not enough tokens to save.");
    }
  };

  const shareText = () => {
    if (tokens >= 3) {
      setTokens(tokens - 3);
      setMessage("Text shared successfully.");
    } else {
      setMessage("Not enough tokens to share.");
    }
  };

  const handleApproveUser = (id) => {
    const user = userRequests.find((u) => u.id === id);
    if (user) {
      setApprovedUsers([...approvedUsers, user]);
      setUserRequests(userRequests.filter((u) => u.id !== id));
    }
  };

  const handleRejectUser = (id) => {
    const user = userRequests.find((u) => u.id === id);
    if (user) {
      setRejectedUsers([...rejectedUsers, user]);
      setUserRequests(userRequests.filter((u) => u.id !== id));
      setBlacklist([...blacklist, user.name]);
    }
  };

  return (
    <div className="text-editor-container">
      <h2 className="text-editor-heading">Text Editor</h2>
      <p className="text-editor-token">Available Tokens: {tokens}</p>

      <Input type="file" accept=".txt" onChange={handleFileUpload} className="text-editor-file-input" />

      <textarea
        value={text}
        onChange={handleTextChange}
        className="text-editor-textarea"
        placeholder="Type or paste text here..."
      />

      <FormControl className="text-editor-radio-group">
        <RadioGroup value={correctionType} onChange={handleCorrectionTypeChange} row>
          <FormControlLabel value="self" control={<Radio />} label="Self Correction" />
          <FormControlLabel value="llm" control={<Radio />} label="LLM Correction" />
        </RadioGroup>
      </FormControl>

      {correctionType === "llm" && (
        <div>
          <Button onClick={handleLLMProcess}>Get LLM Suggestions</Button>
          {llmCorrections.length > 0 && (
            <div>
              <h3>LLM Suggested Corrections:</h3>
              {llmCorrections.map((correction, index) => (
                <div key={index}>
                  <span>{correction.word}</span> ➔ <span>{correction.corrected}</span>
                  <Button onClick={() => acceptLLMCorrection(correction)}>Accept</Button>
                  <Button onClick={() => rejectLLMCorrection(correction.word, reason)}>Reject</Button>
                  <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Button onClick={processText}>Submit</Button>
      <Button onClick={saveText}>Save Text (5 tokens)</Button>
      <Button onClick={shareText}>Share Text (3 tokens)</Button>

      {message && <p className="text-editor-message">{message}</p>}

      <FormControl fullWidth style={{ marginTop: "20px" }}>
        <label htmlFor="role">Select User Role:</label>
        <select
          id="role"
          value={userRole}
          onChange={(e) => setUserRole(e.target.value)}
          className="text-editor-role-selector"
        >
          <option value="free">Free User</option>
          <option value="paid">Paid User</option>
          <option value="super">Super User</option>
        </select>
      </FormControl>

      {/* ✅ Super User Panel (Now correctly placed) */}
      {userRole === "super" && (
        <div className="super-user-panel">
          <h3>Pending User Approvals:</h3>
          {userRequests.length === 0 && <p>No pending requests.</p>}
          {userRequests.map((user) => (
            <div key={user.id} className="super-user-row">
              <span>{user.name}</span>
              <Button onClick={() => handleApproveUser(user.id)} color="success" size="small" style={{ margin: "0 10px" }}>
                Approve
              </Button>
              <Button onClick={() => handleRejectUser(user.id)} color="error" size="small">
                Reject
              </Button>
            </div>
          ))}

          <div className="blacklist-section">
            <h4>Blacklisted Users:</h4>
            {blacklist.length === 0 ? (
              <p>No blacklisted users.</p>
            ) : (
              <ul>
                {blacklist.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditor;