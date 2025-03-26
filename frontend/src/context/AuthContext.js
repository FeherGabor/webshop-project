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
    // Ellenőrizzük, hogy van-e token és adat
    if (!userData || !userData.token) {
      console.error("Hiányzó token a login válaszból!");
      return;
    }
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // User adatokat mentjük a localStorage-ba
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
