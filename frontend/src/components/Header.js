import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import CartContext from "../context/CartContext"; // Kosár kontextus importálása
import "./Header.css";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext); // Kosár adatok lekérése
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/");
  };

  // Kosárban lévő összes termék számának kiszámítása
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header">
      <div className="header-logo">
        <Link to="/">
          <img src="/logo.png" alt="Logo" className="logo" />
        </Link>
      </div>
      <nav className="header-links">
        {user ? (
          <div className="account-menu" ref={menuRef}>
            <button onClick={toggleMenu} className="button">Fiók</button>
            {menuOpen && (
              <div className="dropdown-menu">
                <Link to="/account" className="dropdown-item">Adataim módosítása</Link>
                {user && (
                  <Link to="/orders" className="dropdown-item">Korábbi rendelések</Link>
                )}
                <button onClick={handleLogout} className="dropdown-item">Kijelentkezés</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="button">Bejelentkezés</Link>
            <Link to="/register" className="button">Regisztráció</Link>
          </>
        )}
        <Link to="/cart" className="cart-icon">
          🛒 Kosár {totalItems > 0 && `(${totalItems})`}
        </Link>
      </nav>
    </header>
  );
};

export default Header;
