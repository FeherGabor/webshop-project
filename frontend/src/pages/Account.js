import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Account.css";

const Account = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    postcode: "",
    city: "",
    street: "",
  });
  const [message, setMessage] = useState(""); // Üzenet, hogy mi történt

  useEffect(() => {
    // Az email és token a localStorage-ból
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");

    if (!token || !email) {
      setMessage("Be kell jelentkezni!");
      return;
    }

    // Felhasználói adatokat lekérjük a backendtől
    fetchUserData(email, token);
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token"); // Token lekérése
      if (!token) {
        console.error("Nincs token elmentve!");
        return;
      }
  
      const response = await axios.get("http://localhost:5000/users", {
        headers: { Authorization: `Bearer ${token}` }, // Token használata
      });
  
      // Betöltjük a formba az adatokat
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value }); // Form mezők kezelése
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Ne frissítse az oldalt
    try {
      const token = localStorage.getItem("token"); // Token lekérése
      if (!token) {
        setMessage("Be kell jelentkezni!");
        return;
      }

      const response = await axios.put("http://localhost:5000/users", form, {
        headers: { Authorization: `Bearer ${token}` }, // Token küldése a kéréshez
      });

      setMessage(response.data.message); // Sikeres üzenet a válaszból

      // Frissítjük a localStorage-ot a módosított adatokkal
      localStorage.setItem("email", form.email);
      localStorage.setItem("user", JSON.stringify({
        email: form.email,
        name: form.name,
        phone: form.phone,
        postcode: form.postcode,
        city: form.city,
        street: form.street,
      }));

    } catch (error) {
      console.error("Hiba történt a frissítés során!", error);
      setMessage("Hiba történt a frissítés során!");
    }
  };

  return (
    <div className="account-container">
      <h2>Adataim módosítása</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit} className="account-form">
        <label>Név:
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>Email:
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>Telefonszám:
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </label>
        <label>Irányítószám:
          <input
            type="text"
            name="postcode"
            value={form.postcode}
            onChange={handleChange}
            required
          />
        </label>
        <label>Város:
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
          />
        </label>
        <label>Utca, házszám:
          <input
            type="text"
            name="street"
            value={form.street}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit">Mentés</button>
      </form>
    </div>
  );
};

export default Account;
