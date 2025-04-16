// components/SignUp/SignUpForm.js
"use client";
import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import FormFields from "./FormFields";

export default function SignUpForm() {
  const [formValues, setFormValues] = React.useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Signup successful! 🎉");
        window.location.href = "/";
        // Optionally: reset form or redirect
      } else {
        alert(`Error: ${result.error || "Something went wrong."}`);
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("There was an error signing up.");
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        py: "250px",
      }}
    >
      <Stack spacing={3}>
        <Typography variant="h4" align="center">
          Create your account
        </Typography>
        <form onSubmit={handleSubmit}>
          <FormFields values={formValues} setValues={setFormValues} />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 3, width: "100%" }}
          >
            Sign Up
          </Button>
        </form>
      </Stack>
    </Container>
  );
}
