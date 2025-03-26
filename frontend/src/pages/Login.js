import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css"; 
import AuthContext from "../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const [error, setError] = useState("");  // Az error állapot a hibaüzenethez
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", form);
      console.log("Szerver válasza:", response.data);
  
      if (response.data.token) {
        // Ha van token, akkor bejelentkezés sikeres
        localStorage.setItem("token", response.data.token); // token mentése
        localStorage.setItem("email", form.email); // email mentése
  
        login({
          token: response.data.token,
          email: form.email,
        });
  
        alert("Sikeres bejelentkezés!");
        navigate("/"); // Navigálás a főoldalra
      } else {
        setError("Hibás email vagy jelszó!"); // Hibaüzenet a bejelentkezési problémákra
      }
    } catch (error) {
      console.error("Bejelentkezési hiba:", error.response?.data?.message || error);
      setError(error.response?.data?.message || "Bejelentkezési hiba történt!"); // Hiba kezelése
    }
  };
  
  return (
    <div className="login-container">
      <h2>Bejelentkezés</h2>
      {error && <p className="error-message">{error}</p>}  {/* Hibaüzenet megjelenítése */}
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="login-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Jelszó"
          value={form.password}
          onChange={handleChange}
          required
          className="login-input"
        />
        <button type="submit" className="login-button">Bejelentkezés</button>
      </form>
      <p>Még nincs fiókod? <Link to="/register" className="login-link">Regisztrálj itt</Link></p>
    </div>
  );
};

export default Login;
