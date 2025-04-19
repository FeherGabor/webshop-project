import React, { useEffect, useState, useContext, useCallback } from "react";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import "../styles/Admin.css";

const Admin = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [availableImages, setAvailableImages] = useState([]);
  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState(null);
  const [showProducts, setShowProducts] = useState(true);
  const [showUsers, setShowUsers] = useState(false);

  const fetchProducts = useCallback(() => {
    axios
      .get("http://localhost:5000/api/admin/products", {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Admin fetch error", err));
  }, [user.token]);

  const fetchImages = useCallback(() => {
    axios
      .get("http://localhost:5000/api/admin/images", {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((res) => setAvailableImages(res.data))
      .catch((err) => console.error("Image fetch error", err));
  }, [user.token]);

  const fetchUsers = useCallback(() => {
    axios
      .get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("User fetch error", err));
  }, [user.token]);

  useEffect(() => {
    if (user?.is_admin !== 1) return;
    fetchProducts();
    fetchImages();
    fetchUsers();
  }, [user, fetchProducts, fetchImages, fetchUsers]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice || !newDescription || !newImage || !newStock || !newCategory) {
      setMessage("Minden mezőt ki kell tölteni!");
      return;
    }

    try {
      if (editId) {
        await axios.put(
          `http://localhost:5000/api/admin/products/${editId}`,
          {
            name: newName,
            price: parseFloat(newPrice),
            description: newDescription,
            image: newImage,
            stock: parseInt(newStock),
            category: newCategory,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setMessage("Termék módosítva!");
      } else {
        await axios.post(
          "http://localhost:5000/api/admin/products",
          {
            name: newName,
            price: parseFloat(newPrice),
            description: newDescription,
            image: newImage,
            stock: parseInt(newStock),
            category: newCategory,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setMessage("Termék hozzáadva!");
      }

      setNewName("");
      setNewPrice("");
      setNewDescription("");
      setNewImage("");
      setNewStock("");
      setNewCategory("");
      setEditId(null);
      fetchProducts();
    } catch (error) {
      console.error("Hiba termék mentésekor:", error);
      setMessage("Hiba történt a mentés során.");
    }
  };

  const handleEdit = (product) => {
    setEditId(product.id);
    setNewName(product.name);
    setNewPrice(product.price);
    setNewDescription(product.description);
    setNewImage(product.image);
    setNewStock(product.stock);
    setNewCategory(product.category);
    setMessage("Szerkesztési mód");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Biztosan törlöd ezt a terméket?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessage("Termék törölve.");
      fetchProducts();
    } catch (error) {
      console.error("Hiba törléskor:", error);
      setMessage("Hiba történt a törlés során.");
    }
  };

  const handleToggleAdmin = async (id, currentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${id}/admin`,
        { is_admin: currentStatus ? 0 : 1 },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error("Hiba admin státusz módosításakor:", err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a felhasználót?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Hiba felhasználó törlésénél:", err);
    }
  };

  if (user?.is_admin !== 1) return <h2>Hozzáférés megtagadva</h2>;

  const categories = ["monitor", "eger", "egerpad", "billentyuzet", "ssd", "gpu", "cpu", "ram"];

  return (
    <div className="admin-container">
      <h1>Admin felület</h1>

      {/* TERMÉKEK toggle */}
      <button
        className="toggle-button"
        onClick={() => {
          setShowProducts((prev) => !prev);
          setShowUsers(false);
        }}
      >
        {showProducts ? "🔽 Termékek kezelése" : "▶️ Termékek kezelése"}
      </button>

      {showProducts && (
        <>
          <h2>{editId ? "Termék szerkesztése" : "Új termék hozzáadása"}</h2>
          {message && <p className="message">{message}</p>}
          <form className="admin-form" onSubmit={handleAddProduct}>
            <input type="text" placeholder="Termék neve" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input type="number" placeholder="Ár (Ft)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            <input type="text" placeholder="Leírás" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            <input type="number" placeholder="Készlet" value={newStock} onChange={(e) => setNewStock(e.target.value)} />
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              <option value="">-- Kategória kiválasztása --</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select value={newImage} onChange={(e) => setNewImage(e.target.value)}>
              <option value="">-- Kép kiválasztása --</option>
              {availableImages.map((img, idx) => (
                <option key={idx} value={img}>{img}</option>
              ))}
            </select>

            {newImage && (
              <div className="preview-image">
                <p>Kiválasztott kép:</p>
                <img
                  src={`http://localhost:5000/images/${newImage}`}
                  alt="Előnézet"
                  width="150"
                />
              </div>
            )}

            <button type="submit">{editId ? "Mentés" : "Hozzáadás"}</button>
          </form>

          <h2>Termékek listája</h2>
          <ul className="admin-product-list">
            {products.map((p) => (
              <li className="admin-product-item" key={p.id}>
                <strong>{p.name}</strong> - {p.price.toLocaleString()} Ft<br />
                <small>{p.description}</small><br />
                <strong>Készlet:</strong> {p.stock} db, <strong>Kategória:</strong> {p.category}<br />
                <img src={`http://localhost:5000/images/${p.image}`} alt={p.name} width="100" /><br />
                <button onClick={() => handleEdit(p)}>✏️ Szerkesztés</button>
                <button onClick={() => handleDelete(p.id)}>🗑️ Törlés</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* FELHASZNÁLÓK toggle */}
      <button
        className="toggle-button"
        onClick={() => {
          setShowUsers((prev) => !prev);
          setShowProducts(false);
        }}
      >
        {showUsers ? "🔽 Felhasználók kezelése" : "▶️ Felhasználók kezelése"}
      </button>

      {showUsers && (
        <>
          <h2>Felhasználók kezelése</h2>
          <table className="user-table">
            <thead>
              <tr>
                <th>Név</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Cím</th>
                <th>Admin</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.postcode} {u.city}, {u.street}</td>
                  <td>{u.is_admin ? "✅" : "❌"}</td>
                  <td>
                    <button onClick={() => handleToggleAdmin(u.id, u.is_admin)}>
                      {u.is_admin ? "Admin eltávolítása" : "Admin hozzáadása"}
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)}>🗑 Törlés</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Admin;
