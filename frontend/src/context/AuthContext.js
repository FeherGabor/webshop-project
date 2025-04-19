import { createContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Hibás JSON a localStorage-ban:", error);
      return null;
    }
  });

  const login = (userData) => {
    if (!userData || !userData.token || !userData.user) {
      console.error("Hiányzó token vagy user adat a login válaszból!");
      return;
    }
  
    const fullUser = {
      ...userData.user,
      token: userData.token,
    };
  
    setUser(fullUser);
    localStorage.setItem("user", JSON.stringify(fullUser));
  };
  

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user"); // Kilépéskor eltávolítjuk a localStorage-ból
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
