// components/SignUp/FormFields.js
'use client';
import * as React from 'react';
import { TextField, InputLabel } from '@mui/material';
import Stack from '@mui/material/Stack';

export default function FormFields({ values, setValues }) {
  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  return (
    <Stack spacing={2}>
      <TextField
        name="firstName"
        label="First Name"
        variant="outlined"
        value={values.firstName}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        name="lastName"
        label="Last Name"
        variant="outlined"
        value={values.lastName}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        name="username"
        label="Username"
        variant="outlined"
        value={values.username}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        name="email"
        label="Email"
        variant="outlined"
        value={values.email}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        variant="outlined"
        value={values.password}
        onChange={handleChange}
        fullWidth
      />
    </Stack>
  );
}
