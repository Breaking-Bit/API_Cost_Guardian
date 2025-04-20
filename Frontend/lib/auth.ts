import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      setIsAuthenticated(!!storedToken);
      setToken(storedToken);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading, token };
}