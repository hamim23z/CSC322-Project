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
        setIsLoggedIn(true);
      } else {
        console.warn("Failed to load user:", user.error);
      }
    };
  
    fetchUser();
  }, []);
  