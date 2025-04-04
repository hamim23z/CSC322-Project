/**
 * Developer: Sadia Nawaz
 * pro-req => functionaility 1 and 2 UI
 */
"use client"; // This is a client component 👈🏽
import React, { useState } from "react";
import { Button, Input, Textarea } from "@mui/material";

const BLACKLIST = {
  badword: "*******",
  example: "*******",
};

const INITIAL_TOKENS = 100;

const TextEditor = () => {
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [message, setMessage] = useState("");

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

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-2">Text Editor</h2>
      <p className="mb-2">Available Tokens: {tokens}</p>
      <Input type="file" accept=".txt" onChange={handleFileUpload} className="mb-2" />
      <textarea
        value={text}
        onChange={handleTextChange}
        className="w-full p-2 border rounded mb-2"
        placeholder="Type or paste text here..."
      />
      <Button onClick={processText} className="w-full bg-blue-500 text-white py-2 rounded">
        Submit
      </Button>
      {message && <p className="mt-2 text-red-500">{message}</p>}
    </div>
  );
};

export default TextEditor;
