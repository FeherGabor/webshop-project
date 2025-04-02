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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    // Csak számokat engedünk beíráskor a telefonszám mezőbe
    if (e.target.name === "phone") {
      const value = e.target.value.replace(/[^0-9+]/g, ""); // csak szám és +
      setForm({ ...form, [e.target.name]: value });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(\+36|06)(20|30|70|1)\d{7}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.password || !form.postcode || !form.city || !form.street) {
      setError("Minden mezőt ki kell tölteni!");
      return;
    }

    if (!validateEmail(form.email)) {
      setError("Érvénytelen email cím!");
      return;
    }

    if (!validatePhone(form.phone)) {
      setError("Hibás telefonszám formátum! (pl. +36201234567 vagy 06201234567)");
      return;
    }

    if (!validatePassword(form.password)) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie!");
      return;
    }

    setError("");

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/register", form);
      alert("Sikeres regisztráció!");
      navigate("/login");
    } catch (error) {
      console.error("Regisztrációs hiba:", error);

      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.message === "Ez az email már használatban van!"
      ) {
        setError("Ezzel az email címmel már regisztráltak!");
      } else if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Hiba történt a regisztráció során!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Regisztráció</h2>
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
          type="tel"
          name="phone"
          placeholder="Telefonszám (pl. +36201234567 vagy 06201234567)"
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
