// server.js
const express = require("express");
require("dotenv").config();
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Adatbázis kapcsolat beállítása
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL csatlakozva...");
});

const JWT_SECRET = process.env.JWT_SECRET;

// Token autentikációs middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Nincs token, hozzáférés megtagadva!" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Érvénytelen token!" });
    req.user = user;
    next();
  });
};

// Nem kötelező autentikációs middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

// Admin middleware
function adminOnly(req, res, next) {
  if (req.user && req.user.is_admin === 1) {
    next();
  } else {
    res.status(403).json({ message: "Admin jogosultság szükséges." });
  }
}

// Admin termékek lekérdezése
app.get('/api/admin/products', authenticateToken, adminOnly, (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: "Adatbázis hiba!" });
    res.json(results);
  });
});

// Regisztráció
app.post("/register", async (req, res) => {
  const { name, email, phone, password, postcode, city, street } = req.body;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Érvénytelen email cím!" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "A jelszónak legalább 6 karakter hosszúnak kell lennie!" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name, email, phone, password, postcode, city, street) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, email, phone, hashedPassword, postcode, city, street],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Ez az email már használatban van!" });
        }
        return res.status(500).json({ message: "Adatbázis hiba történt!" });
      }
      res.status(201).json({ message: "Regisztráció sikeres!" });
    }
  );
});

// Bejelentkezés
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email és jelszó megadása kötelező!" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Adatbázis hiba!" });
    if (results.length === 0) return res.status(401).json({ message: "Hibás email vagy jelszó!" });

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Hibás email vagy jelszó!" });

    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_admin: user.is_admin
      }
    });
  });
});

// Felhasználói adatok lekérése
app.get("/users", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT name, email, phone, postcode, city, street FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Felhasználó nem található!" });
    res.json(results[0]);
  });
});

// Felhasználói adatok frissítése
app.put("/users", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name, email, phone, postcode, city, street } = req.body;

  db.query("UPDATE users SET name = ?, email = ?, phone = ?, postcode = ?, city = ?, street = ? WHERE id = ?",
    [name, email, phone, postcode, city, street, userId],
    (err) => {
      if (err) return res.status(500).json({ message: "Hiba történt az adatok frissítése során!" });
      res.json({ message: "Adataid sikeresen frissítve lettek!" });
    });
});

// Jelszó módosítás
app.put("/users/password", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "A jelszónak legalább 6 karakteresnek kell lennie." });
  }

  db.query("SELECT password FROM users WHERE id = ?", [userId], async (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: "Hiba a felhasználó ellenőrzésénél." });

    const valid = await bcrypt.compare(oldPassword, results[0].password);
    if (!valid) return res.status(401).json({ message: "A régi jelszó hibás." });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId], (err) => {
      if (err) return res.status(500).json({ message: "Hiba a jelszó frissítése során." });
      res.json({ message: "A jelszó sikeresen módosítva." });
    });
  });
});

// Termékek lekérése
app.get("/products", (req, res) => {
  db.query("SELECT id, name, description, price, stock, category, image FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: "Adatbázis hiba!" });
    res.json(results);
  });
});

// Képek kiszolgálása
app.use("/images", express.static(path.join(__dirname, "public", "images")));

// Rendelés leadása
app.post("/api/orders", optionalAuth, (req, res) => {
  const { total, billing, shipping, cart, payment_method } = req.body;
  const userId = req.user?.id || null;
  const guestEmail = req.body.guest_email || null;

  if (!userId && !guestEmail) {
    return res.status(400).json({ message: "Bejelentkezés vagy vendég email szükséges!" });
  }

  if (!["cash", "card"].includes(payment_method)) {
    return res.status(400).json({ message: "Érvénytelen fizetési mód!" });
  }

  const billingAddress = `${billing.zip}, ${billing.city}, ${billing.street}`;
  const shippingAddress = `${shipping.zip}, ${shipping.city}, ${shipping.street}`;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Hiba a tranzakció indításakor!" });

    db.query(
      "INSERT INTO orders (user_id, guest_email, total, billing_address, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, guestEmail, total, billingAddress, shippingAddress, payment_method],
      (err, result) => {
        if (err) return db.rollback(() => res.status(500).json({ error: "Hiba a rendelés mentésekor." }));

        const orderId = result.insertId;
        const orderItems = cart.map(item => [orderId, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]);

        db.query(
          "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES ?",
          [orderItems],
          (err) => {
            if (err) return db.rollback(() => res.status(500).json({ error: "Hiba a rendelési tételek mentésekor." }));

            const updateStockQueries = cart.map((item) =>
              new Promise((resolve, reject) => {
                db.query(
                  "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                  [item.quantity, item.product_id, item.quantity],
                  (err, result) => {
                    if (err) return reject("Adatbázis hiba a készletfrissítésnél!");
                    if (result.affectedRows === 0)
                      return reject(`Nincs elegendő készlet ebből a termékből: ${item.product_name}`);
                    resolve();
                  }
                );
              })
            );

            Promise.all(updateStockQueries)
              .then(() => {
                db.commit((err) => {
                  if (err) return db.rollback(() => res.status(500).json({ error: "Hiba a rendelés véglegesítésekor." }));
                  res.status(200).json({ message: "Rendelés sikeresen mentve!", orderId });
                });
              })
              .catch((error) => {
                db.rollback(() => res.status(400).json({ message: error || "Hiba a készlet frissítés során!" }));
              });
          }
        );
      }
    );
  });
});

// Korábbi rendelések lekérése
app.get("/api/orders", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT id, total, billing_address, shipping_address, created_at, payment_method FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, orders) => {
      if (err) return res.status(500).json({ message: "Hiba a rendelések lekérésekor" });
      if (orders.length === 0) return res.json([]);

      const orderIds = orders.map(order => order.id);
      db.query("SELECT * FROM order_items WHERE order_id IN (?)", [orderIds], (err, items) => {
        if (err) return res.status(500).json({ message: "Hiba a tételek lekérésekor" });

        const combined = orders.map(order => ({
          ...order,
          items: items.filter(i => i.order_id === order.id),
        }));
        res.json(combined);
      });
    }
  );
});

// Teszt endpoint
app.get("/", (req, res) => {
  res.send("A szerver fut és működik!");
});
const fs = require("fs");

// Admin képek listázása a public/images mappából
app.get("/api/admin/images", authenticateToken, adminOnly, (req, res) => {
  const imagesDir = path.join(__dirname, "public", "images");

  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error("Képek olvasási hiba:", err);
      return res.status(500).json({ message: "Nem sikerült a képek betöltése." });
    }

    // Csak kép kiterjesztésű fájlok szűrése (opcionális, de ajánlott)
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    res.json(imageFiles);
  });
});
// Admin új termék hozzáadása
app.post("/api/admin/products", authenticateToken, adminOnly, (req, res) => {
  const { name, price, description, image, stock, category } = req.body;

  if (!name || !price || !description || !image || stock === undefined || !category) {
    return res.status(400).json({ message: "Minden mezőt ki kell tölteni!" });
  }

  db.query(
    "INSERT INTO products (name, price, description, image, stock, category) VALUES (?, ?, ?, ?, ?, ?)",
    [name, price, description, image, stock, category],
    (err, result) => {
      if (err) {
        console.error("Adatbázis hiba:", err);
        return res.status(500).json({ message: "Hiba a termék mentésekor." });
      }
      res.status(201).json({ message: "Termék sikeresen hozzáadva!", id: result.insertId });
    }
  );
});//admin modositas
app.put("/api/admin/products/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  const { name, price, description, image, stock, category } = req.body;

  if (!name || !price || !description || !image || stock === undefined || !category) {
    return res.status(400).json({ message: "Minden mezőt ki kell tölteni!" });
  }

  db.query(
    "UPDATE products SET name = ?, price = ?, description = ?, image = ?, stock = ?, category = ? WHERE id = ?",
    [name, price, description, image, stock, category, id],
    (err, result) => {
      if (err) {
        console.error("Hiba a termék módosításakor:", err);
        return res.status(500).json({ message: "Hiba történt a termék frissítésekor." });
      }
      res.json({ message: "Termék sikeresen frissítve!" });
    }
  );
});
//admin torles
app.delete("/api/admin/products/:id", authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Hiba a törlés során:", err);
      return res.status(500).json({ message: "Hiba történt a termék törlésekor." });
    }

    res.json({ message: "Termék törölve!" });
  });
});
//admin user lekeres
app.get("/api/admin/users", authenticateToken, adminOnly, (req, res) => {
  db.query("SELECT id, name, email, phone, postcode, city, street, is_admin FROM users", (err, results) => {
    if (err) return res.status(500).json({ message: "Hiba a felhasználók lekérésekor." });
    res.json(results);
  });
});
//admin user torles
app.delete("/api/admin/users/:id", authenticateToken, adminOnly, (req, res) => {
  const userId = req.params.id;

  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "Hiba a felhasználó törlésekor." });
    res.json({ message: "Felhasználó törölve." });
  });
});
//admin statusz modositas
app.put("/api/admin/users/:id/admin", authenticateToken, adminOnly, (req, res) => {
  const userId = req.params.id;
  const { is_admin } = req.body;

  db.query("UPDATE users SET is_admin = ? WHERE id = ?", [is_admin ? 1 : 0, userId], (err) => {
    if (err) return res.status(500).json({ message: "Hiba az admin státusz frissítésekor." });
    res.json({ message: "Admin jogosultság módosítva." });
  });
});
// Szerver indítása
app.listen(5000, () => console.log("Szerver fut az 5000-es porton"));