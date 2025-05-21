import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  
  // Check if user is already authenticated on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const { isAuth, user } = JSON.parse(storedAuth);
      setIsAuthenticated(isAuth);
      setUsername(user);
    }
  }, []);
  
  // Login function
  const login = (username: string, password: string): boolean => {
    // In a real app, you would validate against a server
    // For this example, we'll use hardcoded credentials
    if (username === 'admin' && password === 'password') {
      setIsAuthenticated(true);
      setUsername(username);
      localStorage.setItem('auth', JSON.stringify({ isAuth: true, user: username }));
      return true;
    }
    return false;
  };
  
  // Logout function
  const logout = (): void => {
    setIsAuthenticated(false);
    setUsername('');
    localStorage.removeItem('auth');
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
