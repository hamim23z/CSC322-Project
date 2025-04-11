/**
 * Developer: Sadia Nawaz
 * pro-req => functionaility 1 and 2 UI
 */
"use client"; // This is a client component 👈🏽
import React, { useState } from "react";
import { Button, Input, Textarea, FormControl, RadioGroup, FormControlLabel, Radio, TextField } from "@mui/material";

const BLACKLIST = {
  badword: "*******",
  example: "*******",
};

const INITIAL_TOKENS = 100;

const TextEditor = () => {
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [message, setMessage] = useState("");
  const [correctionType, setCorrectionType] = useState("self"); // self or llm
  const [corrections, setCorrections] = useState([]);
  const [llmText, setLlmText] = useState("");
  const [llmCorrections, setLlmCorrections] = useState([]);
  const [reason, setReason] = useState("");
  const [isPaidUser, setIsPaidUser] = useState(false); // Simulate if the user is paid

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setText(e.target.result);
      reader.readAsText(file);
    }
  };

  const processText = () => {
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

  const handleCorrectionTypeChange = (event) => {
    setCorrectionType(event.target.value);
  };

  const handleLLMProcess = () => {
    // Simulate an LLM response for the text
    const simulatedCorrections = [
      { word: "badword", corrected: "goodword" },
      { word: "example", corrected: "sample" },
    ];
    setLlmCorrections(simulatedCorrections);
    setLlmText(
      text.replace("badword", "goodword").replace("example", "sample")
    );
  };

  const acceptLLMCorrection = (word) => {
    const newCorrections = corrections.concat(word);
    setCorrections(newCorrections);
    setTokens(tokens - 1); // Deduct 1 token for accepting correction
  };

  const rejectLLMCorrection = (word, reason) => {
    const isValidReason = reason.trim() !== "";
    if (isValidReason) {
      setTokens(tokens - 1); // Deduct 1 token if the reason is valid
    } else {
      setTokens(tokens - 5); // Deduct 5 tokens for invalid reason
    }
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

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-2">Text Editor</h2>
      <p className="mb-2">Available Tokens: {tokens}</p>
      
      <Input type="file" accept=".txt" onChange={handleFileUpload} className="mb-2" />

      <textarea style={{
    width: '80%',
    resize: 'vertical', // allows the user to adjust the height
    margin: '20px',
    padding: '12px',
    border: '2px solid #ccc',
    borderRadius: '8px',
    background: 'linear-gradient(145deg, #f0f0f0, #dcdcdc)',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '14px',
    color: '#333',
    boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 -2px 5px rgba(0, 0, 0, 0.1)',
    resize: 'none',
    transition: 'all 0.3s ease',
    height: '200px' 
  }}
        value={text}
        onChange={handleTextChange}
        className="w-full p-2 border rounded mb-2"
        placeholder="Type or paste text here..."
      />
  
      <FormControl className="mb-2">
        <RadioGroup
          value={correctionType}
          onChange={handleCorrectionTypeChange}
          row
        >
          <FormControlLabel value="self" control={<Radio />} label="Self Correction" />
          <FormControlLabel value="llm" control={<Radio />} label="LLM Correction" />
        </RadioGroup>
      </FormControl>

      {correctionType === "llm" && (
        <div>
          <Button
            onClick={handleLLMProcess}
            className="w-full bg-green-500 text-white py-2 rounded"
          >
            Get LLM Suggestions
          </Button>
          {llmCorrections.length > 0 && (
            <div>
              <h3 className="font-semibold">LLM Suggested Corrections:</h3>
              {llmCorrections.map((correction, index) => (
                <div key={index} className="mb-2">
                  <span className="text-red-500">{correction.word}</span> ➔{" "}
                  <span className="text-green-500">{correction.corrected}</span>
                  <Button
                    onClick={() => acceptLLMCorrection(correction)}
                    className="ml-2 text-blue-500"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => rejectLLMCorrection(correction.word, reason)}
                    className="ml-2 text-red-500"
                  >
                    Reject
                  </Button>
                  <TextField
                    label="Reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <Button
        onClick={processText}
        className="w-full bg-blue-500 text-white py-2 rounded mt-2"
      >
        Submit
      </Button>

      <Button
        onClick={saveText}
        className="w-full bg-purple-500 text-white py-2 rounded mt-2"
      >
        Save Text (5 tokens)
      </Button>

      <Button
        onClick={shareText}
        className="w-full bg-yellow-500 text-white py-2 rounded mt-2"
      >
        Share Text (3 tokens)
      </Button>
      
      {message && <p className="mt-2 text-red-500">{message}</p>}
    </div>
  );
};

export default TextEditor;
