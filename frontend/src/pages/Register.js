import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    postcode: "",
    city: "",
    street: "",
  });
  const [error, setError] = useState(""); // Hibák megjelenítése
  const [loading, setLoading] = useState(false); // Betöltési állapot
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // E-mail validálás
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Jelszó validálás
  const validatePassword = (password) => {
    return password.length >= 6; // Legalább 6 karakter
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Input validálás
    if (!form.name || !form.email || !form.password || !form.postcode || !form.city || !form.street) {
      setError("Minden mezőt ki kell tölteni!");
      return;
    }

    if (!validateEmail(form.email)) {
      setError("Érvénytelen email cím!");
      return;
    }

    if (!validatePassword(form.password)) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie!");
      return;
    }

    setError(""); // Töröljük a hibát, ha minden rendben van

    try {
      setLoading(true); // Betöltési állapot bekapcsolása
      await axios.post("http://localhost:5000/register", form);
      alert("Sikeres regisztráció!");
      navigate("/login");
    } catch (error) {
      console.error(error);
      setError("Hiba történt a regisztráció során!"); // Hibaüzenet
    } finally {
      setLoading(false); // Betöltési állapot kikapcsolása
    }
  };

  return (
    <div className="register-container">
      <h2>Regisztráció</h2>

      {/* Hibaüzenet megjelenítése */}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          name="name"
          placeholder="Név"
          value={form.name}
          onChange={handleChange}
          required
          className="register-input"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="register-input"
        />
        <input
          type="text"
          name="phone"
          placeholder="Telefonszám"
          value={form.phone}
          onChange={handleChange}
          required
          className="register-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Jelszó"
          value={form.password}
          onChange={handleChange}
          required
          className="register-input"
        />
        <input
          type="text"
          name="postcode"
          placeholder="Irányítószám"
          value={form.postcode}
          onChange={handleChange}
          required
          className="register-input"
        />
        <input
          type="text"
          name="city"
          placeholder="Város"
          value={form.city}
          onChange={handleChange}
          required
          className="register-input"
        />
        <input
          type="text"
          name="street"
          placeholder="Utca, házszám"
          value={form.street}
          onChange={handleChange}
          required
          className="register-input"
        />
        <button type="submit" className="register-button" disabled={loading}>
          {loading ? "Regisztrálás..." : "Regisztráció"}
        </button>
      </form>
    </div>
  );
};

export default Register;
