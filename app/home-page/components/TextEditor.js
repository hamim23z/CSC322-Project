"use client";
import React, { useState, useEffect } from "react";
import {
  Button, Input, FormControl, RadioGroup,
  FormControlLabel, Radio, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField
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
  const [sharedNotes, setSharedNotes] = useState([]);
  const [activeSharedNote, setActiveSharedNote] = useState(null);
  const [invites, setInvites] = useState([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareWithUser, setShareWithUser] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [tokenAmount, setTokenAmount] = useState(0);
  const [selfCorrectionDiff, setSelfCorrectionDiff] = useState(null);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [submittedBlacklist, setSubmittedBlacklist] = useState("");
  const [reviewBlacklistOpen, setReviewBlacklistOpen] = useState(false);
  const [pendingBlacklist, setPendingBlacklist] = useState([]);

    

    useEffect(() => {
  const fetchBlacklist = async () => {
    try {
      const res = await fetch("/api/blacklist/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Blacklist fetch error:", err.error || "Unknown error");
        return;
      }

      const dbWords = await res.json();

      if (!Array.isArray(dbWords)) {
        console.error("Expected an array but got:", dbWords);
        return;
      }

      dbWords.forEach((word) => {
        if (!BLACKLIST[word]) {
          BLACKLIST[word] = "*".repeat(word.length);
        }
      });
    } catch (error) {
      console.error("Failed to fetch blacklist:", error);
    }
  };

  fetchBlacklist();
}, []);


  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      if (res.ok) {
        setUserId(user._id); // 👈 add this
        setTokens(user.tokens || 0);
        setIsPaidUser(user.paidUser || false);
        setIsLoggedIn(true);
        setIsAdmin(user.admin || false);
        
      }
    };
    fetchUser();
  }, []);



  const handleBuyTokens = async () => {
    if (!cardName || !cardNumber || !cvv || !tokenAmount) {
      return setMessage("❌ Please fill in all fields.");
    }
  
    const newTokenTotal = tokens + parseInt(tokenAmount);
    const token = localStorage.getItem("token");
  
    const res = await fetch("/api/user/updateTokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tokens: newTokenTotal }),
    });
  
    const data = await res.json();
  
    if (data.success) {
      setTokens(newTokenTotal);
      setBuyDialogOpen(false);
      setCardName(""); setCardNumber(""); setCvv(""); setTokenAmount(0);
      setMessage(`✅ Purchased ${tokenAmount} tokens for $${(tokenAmount * 0.01).toFixed(2)}`);
    } else {
      setMessage("❌ Failed to purchase tokens.");
    }
  };
  

  //pulls status of shared notes
  useEffect(() => {
    const fetchNotes = async () => {
      const token = localStorage.getItem("token");
      if (!token || !userId) return;
  
      const res = await fetch("/api/get-shared-notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const data = await res.json();
      const notes = data.notes || [];
  
      // 🧠 Shared notes: where the invite has been accepted or the current user is creator
      const shared = notes.filter(note => !note.invitePending || note.createdBy === userId);
  
      // 📩 Invites: only if this user did NOT send them
      const invites = notes.filter(note =>
        note.invitePending === true && note.createdBy !== userId
      );
  
      setSharedNotes(shared);
      setInvites(invites);
    };
  
    if (isPaidUser && userId) {
      fetchNotes();
    }
  }, [isPaidUser, userId]);
  


  const handleShareSubmit = async () => {
    const token = localStorage.getItem("token");
  
    const res = await fetch("/api/share-note", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientUsername: shareWithUser,
        title: shareTitle || `Shared on ${new Date().toLocaleDateString()}`,
        text,
        noteId: activeSharedNote?.noteId || null  // 🔁 Existing note, or null
      }),
    });
  
    const result = await res.json();
    if (result.success) {
      setMessage("✅ Invitation sent!");
  
      // 💡 Refresh notes/invites
      const refresh = await fetch("/api/get-shared-notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await refresh.json();
  
      setSharedNotes(data.notes?.filter(n => !n.invitePending) || []);
      setInvites(data.notes?.filter(n => n.invitePending && n.createdBy !== userId) || []);
    } else {
      setMessage(`❌ ${result.error || "Failed to share"}`);
    }
  
    setShareDialogOpen(false);
  };
  

  const respondToInvite = async (noteId, accepted) => {
    if (!accepted) {
      const confirmReject = window.confirm(
        "⚠️ Are you sure you want to reject this invite?\n\nThe sender will lose 3 tokens as a penalty."
      );
      if (!confirmReject) return;
    }
  
    const res = await fetch("/api/respond-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ noteId, accepted }),
    });
  
    const data = await res.json();
  
    if (data.success) {
      setMessage(
        accepted
          ? "✅ Invite accepted!"
          : "❌ Invite rejected. The sender has been penalized 3 tokens."
      );
      setInvites((prev) => prev.filter((i) => i.noteId !== noteId));
      if (accepted) {
        const acceptedNote = invites.find((i) => i.noteId === noteId);
        setSharedNotes((prev) => [...prev, { ...acceptedNote, invitePending: false }]);
      }
    }
  };
  
  
  
  


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
        const res = await fetch("https://gemini-api-322-addz.onrender.com/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: cleanedText }),
        });
    
        const data = await res.json();
        const corrected = extractCorrected(data.corrected);
        const changes = calculateChanges(cleanedText, corrected);
    
        setLlmText(changes === 0 ? "No changes needed." : corrected);
        setLlmCorrections(new Array(changes).fill(true));
        setContainsSpellingCorrections(/spelling|typo|grammar/i.test(data.explanation || ""));
        setShowLLMModal(true);
    
        localStorage.setItem("lastSubmission", cleanedText);

        if (isPaidUser) {
      const bonus = changes === 0 ? 3 : 0;
      const submissionCost = wordCount;
      const totalCostNow = submissionCost + blCost;

      let actualDeducted;
      let finalTokens;

      if (tokens >= totalCostNow) {
        actualDeducted = totalCostNow;
        finalTokens = tokens - totalCostNow + bonus;
        setMessage(`✅ Submission accepted. ${bonus > 0 ? `🎁 +${bonus} bonus tokens.` : ""}`);
      } else {
        // Not enough tokens: fallback to 50% penalty
        actualDeducted = Math.floor(tokens / 2);
        finalTokens = tokens - actualDeducted;
        setMessage(`⚠️ Not enough tokens. Half your tokens were deducted.`);
      }

      setTokens(finalTokens);
      await updateTokensInDB(finalTokens);
      await updateStatsInDB({
        tokensEarned: bonus,
        tokensUsed: actualDeducted,
      });

      if (bonus > 0) setBonusAwarded(true);

}



    
    
      } catch (err) {
        console.error(err);
        setMessage("❌ LLM service unavailable.");
      }
    }
    

     else {
      const prev = localStorage.getItem("lastSubmission") || "";
      const changes = calculateChanges(prev, cleanedText);
      let cost = isFreeUser ? 0 : Math.floor(changes / 2) + blCost;
      let newTokens = tokens;

      if (isPaidUser) {
        let actualCost;

        if (tokens >= cost) {
          actualCost = cost;
          setMessage(`✅ Self-corrected. 💸 Charged ${cost} tokens.`);
        } else {
          actualCost = Math.floor(tokens / 2);
          setMessage(`⚠️ Not enough tokens. Deducted ${actualCost} (half of your tokens).`);
        }

        const newBalance = tokens - actualCost;
        setTokens(newBalance); // ✅ real-time update
        await updateTokensInDB(newBalance);
        await updateStatsInDB({
          selfCorrections: 1,
          tokensUsed: actualCost,
        });
      }

      newTokens = tokens - cost;


      if (newTokens < 0) {
        // Not enough tokens — fallback
        newTokens = Math.floor(tokens / 2);
        cost = tokens - newTokens;
        setMessage("⚠️ Not enough tokens. Deducted half your tokens instead.");
      } else {
        setMessage(
          `✅ Self-corrected.` +
          (isFreeUser ? " (Free user - no charges)" : ` 💸 Charged: ${cost} token${cost !== 1 ? "s" : ""}`) +
          (blCost > 0 ? ` 🚫 Blacklist penalty: ${blCost}` : "") +
          (changes ? ` ✏️ ${changes} word${changes !== 1 ? "s" : ""} changed.` : "")
        );
      }

      

      if (isPaidUser) {
        await updateTokensInDB(newTokens);
        await updateStatsInDB({ selfCorrections: 1, tokensUsed: cost });
      }

      localStorage.setItem("lastSubmission", cleanedText);
      if (changes > 0) {
  setSelfCorrectionDiff({
    before: prev,
    after: cleanedText,
  });
}

    }
  };



  

  const handleAcceptLLM = async () => {
  const acceptedText = llmText === "No changes needed." ? text : llmText;
  setText(acceptedText);
  setShowLLMModal(false);
  localStorage.setItem("lastSubmission", acceptedText);

  if (isPaidUser) {
  let newTokens = tokens - 1;
  if (newTokens < 0) {
    newTokens = Math.floor(tokens / 2);
    setMessage("⚠️ Not enough tokens. Deducted half instead.");
  } else {
    setMessage("✅ LLM corrections accepted. 💸 Charged 1 token.");
  }

  setTokens(newTokens);
  await updateTokensInDB(newTokens);
  await updateStatsInDB({ llmCorrections: 1, tokensUsed: tokens - newTokens });
}


  setMessage("✅ LLM corrections accepted. 💸 Charged 1 token.");
};


  
  const handleRejectLLM = async () => {
    const reason = prompt("Why are you rejecting this correction?");
    if (!reason) return;
  
    await fetch("/api/llm-reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        original: text,
        corrected: llmText,
        reason,
      }),
    });
  
    setShowLLMModal(false);
    setMessage("🕒 Sent to review queue. Awaiting admin decision.");
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

      
      {sharedNotes.length > 0 && (
      <div className="mb-2">
        <strong>📂 Shared Notes:</strong>
        <select
          className="w-full mt-1 p-2 border rounded"
          onChange={(e) => {
            const note = sharedNotes.find(n => n.noteId === e.target.value);
            setText(note?.text || "");
            setActiveSharedNote(note);
          }}
        >
          <option value="">Select shared note</option>
          {sharedNotes.map(note => (
            <option key={note.noteId} value={note.noteId}>{note.title}</option>
          ))}
        </select>
      </div>
    )}

      {invites.length > 0 && (
        <div className="mb-4 bg-yellow-100 p-2 rounded">
          <strong>📨 Pending Invitations:</strong>
          {invites.map((invite) => (
            <div key={invite.noteId} className="my-2 flex items-center justify-between">
              <span>{invite.title}</span>
              <div>
                <Button
                  onClick={() => respondToInvite(invite.noteId, true)}
                  color="primary" variant="contained" size="small"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => respondToInvite(invite.noteId, false)}
                  color="secondary" variant="outlined" size="small"
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}



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

      {selfCorrectionDiff && (
  <div className="bg-blue-100 text-black p-3 rounded mt-3">
    <p><strong>🔄 Self-Correction Diff:</strong></p>
    <p><strong>Before Change:</strong></p>
    <pre className="whitespace-pre-wrap">{selfCorrectionDiff.before}</pre>
    <p><strong>Self-Corrected:</strong></p>
    <pre className="whitespace-pre-wrap">{selfCorrectionDiff.after}</pre>
  </div>
)}



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
          <Button onClick={() => setShareDialogOpen(true)} className="w-full bg-yellow-500 text-white py-2 rounded mt-2">Share Text (3 tokens)</Button>
          <Button onClick={fetchStats} className="w-full bg-gray-700 text-white py-2 rounded mt-2">📊 View Stats</Button>
        </>
      )}

      
      
      {activeSharedNote && isPaidUser && (
      <Button
        onClick={async () => {
          const res = await fetch("/api/update-shared-note", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ noteId: activeSharedNote.noteId, text })
          });
          const result = await res.json();
          if (result.success) {
            setMessage("✅ Shared note updated.");
          }
        }}
        className="w-full bg-teal-600 text-white py-2 rounded mt-2"
      >
        Save Shared Note
      </Button>
    )}

      {isPaidUser && (
        <>
        
          {/* ✅ ADD THIS BLOCK BELOW */}
          {isLoggedIn && isAdmin && (
            <Button
            onClick={() => window.location.href = "/admin/rejects"}
              className="w-full bg-red-600 text-white py-2 rounded mt-2"
            >
              🛠️ Review Reject Queue
            </Button>

            
          )}
          
          
        </>
        
      )}


      {isPaidUser && (
  <>
    <Button
      onClick={() => setBuyDialogOpen(true)}
      className="w-full bg-green-600 text-white py-2 rounded mt-2"
    >
      💰 Buy More Tokens
    </Button>

    <Button
      onClick={() => setBlacklistDialogOpen(true)} // ✅ this controls the dialog
      className="w-full bg-red-500 text-white py-2 rounded mt-2"
    >
      🚫 Submit Blacklist Words
    </Button>
  </>
)}





     {isAdmin && (
  <Button
    onClick={async () => {
      
      try {
        const res = await fetch("/api/blacklist/queue", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            
          },
        });

        if (!res.ok) {
          const error = await res.json();
          console.error("❌ Blacklist fetch failed:", error.error || res.statusText);
          setMessage("❌ Could not load pending blacklist.");
          return;
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          console.error("❌ Expected array, got:", data);
          setMessage("❌ Unexpected server response.");
          return;
        }

        setPendingBlacklist(data);
        setReviewBlacklistOpen(true);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setMessage("❌ Failed to fetch blacklist queue.");
      }
    }}
    className="w-full bg-red-600 text-white py-2 rounded mt-2"
  >
    🛠️ Manage Blacklist
  </Button>
)}



      {message && <p className="mt-2 text-red-500">{message}</p>}

      <Dialog open={reviewBlacklistOpen} onClose={() => setReviewBlacklistOpen(false)}>
  <DialogTitle>🛠️ Review Blacklist Submissions</DialogTitle>
  <DialogContent>
    {pendingBlacklist.length === 0 ? (
      <p>No pending words</p>
    ) : (
      pendingBlacklist.map((entry) => (
        <div key={entry.word} className="flex justify-between items-center my-2">
          <span>{entry.word}</span>
          <div>
            <Button
              onClick={async () => {
                await fetch("/api/blacklist/approve", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}` // ✅ Add this
                },
                body: JSON.stringify({ words: [entry.word] }), // ✅ simple array
              });

                setPendingBlacklist(pendingBlacklist.filter(w => w.word !== entry.word));
              }}
              size="small" color="success" variant="contained"
            >
              Approve
            </Button>
            <Button
              onClick={async () => {
       
                 await fetch("/api/blacklist/reject", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}` // ✅ Add this
                },
                body: JSON.stringify({ words: [entry.word] }), // ✅ simple array
              });

                setPendingBlacklist(pendingBlacklist.filter(w => w.word !== entry.word));
              }}
              size="small" color="error" variant="outlined"
              style={{ marginLeft: "8px" }}
            >
              Reject
            </Button>
          </div>
        </div>
      ))
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setReviewBlacklistOpen(false)}>Close</Button>
  </DialogActions>
</Dialog>


      <Dialog open={showLLMModal} onClose={handleRejectLLM} fullWidth maxWidth="md">
        <DialogTitle>LLM Suggested Edits</DialogTitle>
        <DialogContent>
          <h4>Original:</h4>
          <pre className="bg-gray-200 p-2 rounded text-sm whitespace-pre-wrap text-black">{text}</pre>
          <h4 className="mt-3">Corrected:</h4>
          <div className="bg-green-100 p-2 rounded text-sm whitespace-pre-wrap text-black">
          {llmText === "No changes needed." ? (
            <pre>{text}</pre>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: highlightChanges(text, llmText) }} />
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


      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
  <DialogTitle>🔗 Share Note</DialogTitle>
  <DialogContent>
  <Input
    fullWidth
    placeholder="Enter title for shared note"
    value={shareTitle}
    onChange={(e) => setShareTitle(e.target.value)}
    className="mb-2"
  />
  <Input
    fullWidth
    placeholder="Enter username of paid user to share with"
    value={shareWithUser}
    onChange={(e) => setShareWithUser(e.target.value)}
  />
</DialogContent>
  <DialogActions>
    <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
    <Button onClick={handleShareSubmit} variant="contained" color="primary">
      Send Invite
    </Button>
  </DialogActions>
</Dialog>
<Dialog open={buyDialogOpen} onClose={() => setBuyDialogOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>💰 Buy More Tokens</DialogTitle>
  <DialogContent>
    <TextField
      label="Name on Card"
      fullWidth
      margin="normal"
      value={cardName}
      onChange={(e) => setCardName(e.target.value)}
    />
    <TextField
      label="Card Number"
      fullWidth
      margin="normal"
      value={cardNumber}
      onChange={(e) => setCardNumber(e.target.value)}
    />
    <TextField
      label="CVV"
      fullWidth
      margin="normal"
      value={cvv}
      onChange={(e) => setCvv(e.target.value)}
    />
    <TextField
      label="Tokens to Purchase"
      type="number"
      fullWidth
      margin="normal"
      value={tokenAmount}
      onChange={(e) => setTokenAmount(e.target.value)}
    />
    <p className="mt-2 text-gray-700">
      💵 Total: <strong>${(tokenAmount * 0.01).toFixed(2)}</strong>
    </p>

   
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setBuyDialogOpen(false)}>Cancel</Button>
    <Button
      onClick={() => handleBuyTokens()}
      variant="contained"
      color="primary"
    >
      Confirm Purchase
    </Button>
  </DialogActions>
</Dialog>

<Dialog open={blacklistDialogOpen} onClose={() => setBlacklistDialogOpen(false)}>
  <DialogTitle>🚫 Submit Blacklist Words</DialogTitle>
  <DialogContent>
    <TextField
      label="Enter words (comma-separated)"
      fullWidth
      value={submittedBlacklist}
      onChange={(e) => setSubmittedBlacklist(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setBlacklistDialogOpen(false)}>Cancel</Button>
    <Button
      onClick={async () => {
       await fetch("/api/blacklist/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}` // ✅ Add this
          },
          body: JSON.stringify({ words: submittedBlacklist }),
        });

        setSubmittedBlacklist('');
        setBlacklistDialogOpen(false);
        setMessage("✅ Submitted for review.");
      }}
      variant="contained"
      color="primary"
    >
      Submit
    </Button>
  </DialogActions>
</Dialog>



    </div>

  

    

    
  );

  
};

export default TextEditor;
