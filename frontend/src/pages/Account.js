import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/Account.css";
import AuthContext from "../context/AuthContext";

const Account = () => {
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    postcode: "",
    city: "",
    street: "",
  });

  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = user?.token;
    const email = user?.email;

    if (!token || !email) {
      setMessage("Be kell jelentkezni!");
      return;
    }

    fetchUserData(token);
  }, [user]);

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForm({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone,
        postcode: response.data.postcode,
        city: response.data.city,
        street: response.data.street,
      });
    } catch (error) {
      console.error("Hiba történt az adatok lekérésekor!", error);
      setMessage("Hiba történt az adatok lekérésekor!");
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(\+36|06)(20|30|70|1)\d{7}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const cleaned = value.replace(/[^0-9+]/g, "");
      setForm({ ...form, [name]: cleaned });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = user?.token;
    if (!token) {
      setMessage("Be kell jelentkezni!");
      return;
    }

    if (!validatePhone(form.phone)) {
      setMessage("Hibás telefonszám formátum! (pl. +36201234567 vagy 06201234567)");
      return;
    }

    try {
      const response = await axios.put("http://localhost:5000/users", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(response.data.message);
    } catch (error) {
      console.error("Hiba történt a frissítés során!", error);
      setMessage("Hiba történt a frissítés során!");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const token = user?.token;
    if (!token) {
      setMessage("Be kell jelentkezni!");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage("A jelszónak legalább 6 karakter hosszúnak kell lennie!");
      return;
    }

    try {
      const res = await axios.put("http://localhost:5000/users/password", passwords, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(res.data.message);
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (error) {
      console.error("Hiba a jelszó módosításakor!", error);
      setMessage(error.response?.data?.message || "Hiba történt a jelszó módosításakor!");
    }
  };

  return (
    <div className="account-container">
      <h2>Adataim módosítása</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit} className="account-form">
        <label>
          Név:
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email:
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Telefonszám:
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            placeholder="+36201234567 vagy 06201234567"
          />
        </label>
        <label>
          Irányítószám:
          <input type="text" name="postcode" value={form.postcode} onChange={handleChange} required />
        </label>
        <label>
          Város:
          <input type="text" name="city" value={form.city} onChange={handleChange} required />
        </label>
        <label>
          Utca, házszám:
          <input type="text" name="street" value={form.street} onChange={handleChange} required />
        </label>
        <button type="submit">Mentés</button>
      </form>

      <h2>Jelszó módosítása</h2>
      <form onSubmit={handlePasswordSubmit} className="account-form">
        <label>
          Régi jelszó:
          <input type="password" name="oldPassword" value={passwords.oldPassword} onChange={handlePasswordChange} required />
        </label>
        <label>
          Új jelszó:
          <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} required />
        </label>
        <button type="submit">Jelszó frissítése</button>
      </form>
    </div>
  );
};

export default Account;