"use client";
import React, { useState, useEffect } from "react";
import {
  Button, Input, FormControl, RadioGroup,
  FormControlLabel, Radio, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from "@mui/material";

const BLACKLIST = {
  stupid: "******", dumb: "****", idiot: "*****",
  lame: "****", damn: "****", heck: "****", loser: "*****",
  sucks: "*****", crap: "****", trash: "*****", hate: "****",
  ugly: "****", noob: "****", kill: "****", stupidhead: "**********",
  wtf: "***", omg: "***"
};

const TextEditor = () => {
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState(0);
  const [correctionType, setCorrectionType] = useState("self");
  const [llmText, setLlmText] = useState("");
  const [llmCorrections, setLlmCorrections] = useState([]);
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [blacklistCost, setBlacklistCost] = useState(0);
  const [containsSpellingCorrections, setContainsSpellingCorrections] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      if (res.ok) {
        setTokens(user.tokens || 0);
        setIsPaidUser(user.paidUser || false);
        setIsLoggedIn(true);
      }
    };
    fetchUser();
  }, []);

  const updateTokensInDB = async (newTokenCount) => {
    if (!isPaidUser) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch("/api/user/updateTokens", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tokens: newTokenCount }),
    });
  };

  const updateStatsInDB = async (data) => {
    if (!isPaidUser) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch("/api/user/updateStats", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  };

  const handleTextChange = (e) => setText(e.target.value);

  const handleFileUpload = (e) => {
    if (!isLoggedIn) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setText(e.target.result);
      reader.readAsText(file);
    }
  };

  const handleCorrectionTypeChange = (e) => setCorrectionType(e.target.value);

  const extractCorrected = (response) => {
    return response.replace(/^["']|["']$/g, "").trim();
  };

  const calculateChanges = (original, updated) => {
    const o = original.trim().split(/\s+/);
    const u = updated.trim().split(/\s+/);
    const length = Math.max(o.length, u.length);
    let diffCount = 0;
    for (let i = 0; i < length; i++) {
      if (o[i] !== u[i]) diffCount++;
    }
    return diffCount;
  };

  const highlightChanges = (original, corrected) => {
    const o = original.trim().split(/\s+/);
    const u = corrected.trim().split(/\s+/);
    return u.map((word, i) => word !== o[i] ? `<mark>${word}</mark>` : word).join(" ");
  };

  const processText = async () => {
    setMessage("");
    setBonusAwarded(false);
    setContainsSpellingCorrections(false);
    setBlacklistCost(0);

    const originalText = text.trim();
    const wordCount = originalText.split(/\s+/).length;

    if (!isPaidUser && wordCount > 20) {
      return setMessage("⚠️ Free users can only submit up to 20 words.");
    }

    const isFreeUser = !isLoggedIn || !isPaidUser;
    let cleanedText = originalText;
    let blCost = 0;

    Object.entries(BLACKLIST).forEach(([bad, replacement]) => {
      const regex = new RegExp(`\\b${bad}\\b`, "gi");
      const matches = cleanedText.match(regex);
      if (matches) {
        blCost += matches.length * bad.length;
        cleanedText = cleanedText.replace(regex, replacement);
      }
    });

    setBlacklistCost(blCost);

    if (correctionType === "llm") {
      try {
        const res = await fetch("http://localhost:5001/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: cleanedText }),
        });

        const data = await res.json();
        const corrected = extractCorrected(data.corrected);
        const changes = calculateChanges(cleanedText, corrected);

        setLlmText(changes === 0 ? "No changes needed." : corrected);
        setLlmCorrections(new Array(changes).fill(true));  // Replace with:

        if (changes === 0) {
          setLlmText("No changes needed.");
          setLlmCorrections([]); // Important: ensure 0 corrections
        } else {
          setLlmText(corrected);
          setLlmCorrections(new Array(changes).fill(true));
        }

        setContainsSpellingCorrections(/spelling|typo|grammar/i.test(data.explanation || ""));
        setShowLLMModal(true);

        localStorage.setItem("lastSubmission", cleanedText);

        if (isPaidUser) {
          const bonus = changes === 0 ? 3 : 0;
          if (bonus > 0) {
            setBonusAwarded(true);
            setTokens(tokens + bonus);
            await updateTokensInDB(tokens + bonus);
            await updateStatsInDB({ tokensEarned: bonus });
          }
        }

        if (isPaidUser) {
          const submissionCost = wordCount;
          await updateStatsInDB({ tokensUsed: submissionCost });
          setTokens(tokens - submissionCost);
          await updateTokensInDB(tokens - submissionCost);
        }

      } catch (err) {
        console.error(err);
        setMessage("❌ LLM service unavailable.");
      }
    } else {
      const prev = localStorage.getItem("lastSubmission") || "";
      const changes = calculateChanges(prev, cleanedText);
      const cost = isFreeUser ? 0 : Math.floor(changes / 2) + blCost;
      const newTokens = tokens - cost;

      setText(cleanedText);
      setTokens(newTokens);
      setMessage(
        `✅ Self-corrected.${isFreeUser ? " (Free user - no charges)" : ""} ${
          blCost > 0 ? `🚫 ${blCost} tokens for blacklist.` : ""
        } ${changes ? `✏️ ${changes} words changed.` : ""}`
      );

      if (isPaidUser) {
        await updateTokensInDB(newTokens);
        await updateStatsInDB({ selfCorrections: 1, tokensUsed: cost });
      }

      localStorage.setItem("lastSubmission", cleanedText);
    }
  };

  const handleAcceptLLM = async () => {
    const wordCount = text.trim().split(/\s+/).length;
    const baseCost = isPaidUser ? wordCount + 1 + blacklistCost : 0;

    setText(llmText === "No changes needed." ? text : llmText);
    setShowLLMModal(false);
    localStorage.setItem("lastSubmission", llmText === "No changes needed." ? text : llmText);

    if (isPaidUser) {
      const newTokens = tokens - baseCost;
      setTokens(newTokens);
      await updateTokensInDB(newTokens);
      await updateStatsInDB({ llmCorrections: 1, tokensUsed: baseCost });
    }

    setMessage("✅ LLM corrections accepted.");
  };

  const handleRejectLLM = () => {
    setShowLLMModal(false);
    setMessage("❌ LLM corrections rejected.");
  };

  const saveText = async () => {
    if (!isPaidUser) return setMessage("Only paid users can save.");
    if (tokens < 5) return setMessage("❌ Not enough tokens to save.");

    const newTokens = tokens - 5;
    setTokens(newTokens);
    await updateTokensInDB(newTokens);
    await updateStatsInDB({ tokensUsed: 5 });

    const blob = new Blob([text], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "corrected_text.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setMessage("✅ Text saved and downloaded.");
  };

  const shareText = async () => {
    if (!isPaidUser) return setMessage("Only paid users can share.");
    if (tokens < 3) return setMessage("❌ Not enough tokens to share.");
    const newTokens = tokens - 3;
    setTokens(newTokens);
    await updateTokensInDB(newTokens);
    await updateStatsInDB({ tokensUsed: 3 });
    setMessage("✅ Text shared.");
  };

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/user/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setStats(data);
    setShowStats(true);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-2">Text Editor</h2>
      <p className="mb-2">Available Tokens: {isPaidUser ? tokens : "Free"}</p>

      <Input type="file" accept=".txt" onChange={handleFileUpload} className="mb-2" disabled={!isLoggedIn} />
      <textarea
        value={text}
        onChange={handleTextChange}
        disabled={false}
        placeholder="Type or paste text here..."
        style={{
          width: '80%', margin: '20px', padding: '12px', border: '2px solid #ccc',
          borderRadius: '8px', background: 'white', color: '#000',
          fontFamily: "'Courier New', Courier, monospace", fontSize: '14px', height: '200px'
        }}
        className="w-full p-2 border rounded mb-2"
      />

      <FormControl className="mb-2">
        <RadioGroup value={correctionType} onChange={handleCorrectionTypeChange} row>
          <FormControlLabel value="self" control={<Radio />} label="Self Correction" />
          <FormControlLabel value="llm" control={<Radio />} label="LLM Correction" />
        </RadioGroup>
      </FormControl>

      <Button onClick={processText} className="w-full bg-blue-500 text-white py-2 rounded mt-2">Submit</Button>
      {isPaidUser && (
        <>
          <Button onClick={saveText} className="w-full bg-purple-500 text-white py-2 rounded mt-2">Save Text (5 tokens)</Button>
          <Button onClick={shareText} className="w-full bg-yellow-500 text-white py-2 rounded mt-2">Share Text (3 tokens)</Button>
          <Button onClick={fetchStats} className="w-full bg-gray-700 text-white py-2 rounded mt-2">📊 View Stats</Button>
        </>
      )}

      {message && <p className="mt-2 text-red-500">{message}</p>}

      <Dialog open={showLLMModal} onClose={handleRejectLLM} fullWidth maxWidth="md">
        <DialogTitle>LLM Suggested Edits</DialogTitle>
        <DialogContent>
          <h4>Original:</h4>
          <pre className="bg-gray-200 p-2 rounded text-sm whitespace-pre-wrap text-black">{text}</pre>
          <h4 className="mt-3">Corrected:</h4>
          <div className="bg-green-100 p-2 rounded text-sm whitespace-pre-wrap text-black">
          {isPaidUser ? (
            llmText === "No changes needed." ? (
              <pre>{text}</pre>  // show original input if clean
            ) : (
              <span dangerouslySetInnerHTML={{ __html: highlightChanges(text, llmText) }} />
            )
          ) : (
            <pre>{llmText}</pre>
          )}
        </div>

        {llmText === "No changes needed." ? (
          isPaidUser && <p className="text-green-600 font-semibold mt-2">🎉 Clean text! +3 bonus tokens</p>
        ) : llmCorrections.length > 0 ? (
          <p>🔁 {llmCorrections.length} corrections</p>
        ) : null}

          {isPaidUser && (
            <>
              <p><strong>💸 Total cost:</strong> {text.trim().split(/\s+/).length + 1 + blacklistCost} tokens</p>
              <ul className="text-sm text-gray-700 ml-4 list-disc">
                <li>📝 Submission cost: {text.trim().split(/\s+/).length} tokens</li>
                <li>✅ LLM correction fee: 1 token</li>
                <li>🚫 Blacklist penalty: {blacklistCost} tokens</li>
              </ul>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectLLM}>Reject</Button>
          <Button onClick={handleAcceptLLM} variant="contained" color="primary">Accept</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showStats} onClose={() => setShowStats(false)} fullWidth maxWidth="sm">
        <DialogTitle>📈 Usage Statistics</DialogTitle>
        <DialogContent>
          {stats ? (
            <>
              <p>🧠 Self Corrections: {stats.selfCorrections}</p>
              <p>🤖 LLM Corrections: {stats.llmCorrections}</p>
              <p>🔋 Tokens Used: {stats.tokensUsed}</p>
              <p>🎁 Tokens Earned: {stats.tokensEarned}</p>
            </>
          ) : <p>Loading...</p>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStats(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TextEditor;
