"use client";
import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Sitemark from "./SitemarkIcon";
import { useEffect, useState } from 'react';
import Link from 'next/link';





const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: "8px 12px",
}));

export default function AppAppBar() {
  const [open, setOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // optional if you want to track login status
 


  //fetch information for user from MongoDB
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      const res = await fetch('/api/user/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
  
      const user = await res.json();
      if (res.ok) {
        setTokens(user.tokens || 0);
        setIsPaidUser(user.paidUser || false);
        setUser(user); // ✅ This line was missing!
        console.log("user set")
      } else {
        console.warn("Failed to load user:", user.error);
      }
    };
  
    fetchUser();
  }, []);
  
  
  

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 'calc(var(--template-frame-height, 0px) + 28px)',
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <Sitemark />
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Link href="/pricing">
                <Button variant="text" color="info" size="small">Pricing</Button>
              </Link>
              <Link href="/documentation">
                <Button variant="text" color="info" size="small">Documentation</Button>
              </Link>
              <Link href="/about-us">
                <Button variant="text" color="info" size="small">About Us</Button>
              </Link>
            </Box>
          </Box>

          {/* Desktop Auth Buttons */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ marginRight: '1rem', fontWeight: 'bold' }}>
                  Welcome, {user.firstName}
                </span>
                <Button
                  color="secondary"
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    setUser(null);
                    window.location.href = '/';
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button color="primary" variant="text" size="small">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button color="primary" variant="contained" size="small">Sign up</Button>
                </Link>
              </>
            )}
          </Box>

          {/* Mobile Drawer */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{ sx: { top: 'var(--template-frame-height, 0px)' } }}
            >
              <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>

                <Link href="/pricing" style={{ textDecoration: 'none', color: '#fff' }}>
                  <MenuItem>Pricing</MenuItem>
                </Link>
                <Link href="/documentation" style={{ textDecoration: 'none', color: '#fff' }}>
                  <MenuItem>Documentation</MenuItem>
                </Link>
                <Link href="/about-us" style={{ textDecoration: 'none', color: '#fff' }}>
                  <MenuItem>About Us</MenuItem>
                </Link>
                <Divider sx={{ my: 3 }} />

                {user ? (
                  <>
                    <MenuItem disabled>
                      Welcome, {user.firstName}
                    </MenuItem>
                    <MenuItem onClick={() => {
                      localStorage.removeItem('user');
                      localStorage.removeItem('token');
                      setUser(null);
                      window.location.href = '/homepage';
                    }}>
                      <Button color="secondary" variant="outlined" fullWidth>Logout</Button>
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <Link href="/signup">
                      <MenuItem>
                        <Button color="primary" variant="contained" fullWidth>Sign up</Button>
                      </MenuItem>
                    </Link>
                    <Link href="/login">
                      <MenuItem>
                        <Button color="primary" variant="outlined" fullWidth>Sign in</Button>
                      </MenuItem>
                    </Link>
                  </>
                )}
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
