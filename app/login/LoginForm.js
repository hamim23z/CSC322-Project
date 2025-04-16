"use client";
import React, { useState } from "react";
import { TextField, Button, Container, Typography, Stack } from "@mui/material";

export default function LoginForm() {
  const [values, setValues] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Logged in! 🎉");
        console.log("JWT Token:", result.token);
        // Save token and user in localStorage
        localStorage.setItem("token", result.token);

        window.location.href = "/";
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: "250px",
      }}
    >
      <Stack spacing={3} sx={{ width: "100%" }}>
        <Typography variant="h4" align="center">
          Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            fullWidth
            value={values.email}
            onChange={handleChange}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            fullWidth
            value={values.password}
            onChange={handleChange}
          />
          <Button
            variant="contained"
            type="submit"
            sx={{ mt: 2, width: "100%" }}
          >
            Log In
          </Button>
        </form>
      </Stack>
    </Container>
  );
}
