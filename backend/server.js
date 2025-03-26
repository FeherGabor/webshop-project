const express = require("express");
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
  host: "localhost",
  user: "root",
  password: "root",
  database: "webshop",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL csatlakozva...");
});

// Token autentikációs middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Nincs token, hozzáférés megtagadva!" });

  jwt.verify(token, "secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Érvénytelen token!" });
    req.user = user;
    next();
  });
};

// Regisztráció
app.post("/register", async (req, res) => {
  const { name, email, phone, password, postcode, city, street } = req.body;

  // E-mail validálás
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Érvénytelen email cím!" });
  }

  // Jelszó validálás (minimum 6 karakter)
  if (password.length < 6) {
    return res.status(400).json({ message: "A jelszónak legalább 6 karakter hosszúnak kell lennie!" });
  }

  // Jelszó hashelése
  const hashedPassword = await bcrypt.hash(password, 10);

  // Felhasználó hozzáadása az adatbázishoz
  db.query(
    "INSERT INTO users (name, email, phone, password, postcode, city, street) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, email, phone, hashedPassword, postcode, city, street],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Regisztráció sikeres!" });
    }
  );
});

// Bejelentkezés
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // E-mail validálás
  if (!email || !password) {
    return res.status(400).json({ message: "Email és jelszó megadása kötelező!" });
  }

  // Felhasználó keresése az adatbázisban
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Adatbázis hiba!" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Hibás email vagy jelszó!" });
    }

    const user = results[0]; // Az első találatot vesszük

    // Jelszó ellenőrzése
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Hibás email vagy jelszó!" });
    }

    // Ha a jelszó helyes, generáljuk a JWT token-t
    const token = jwt.sign(
      { id: user.id, email: user.email },
      "secret", // A titkos kulcs
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  });
});

// Felhasználói adatok lekérése (hitelesített kérés)
app.get("/users", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query(
    "SELECT name, email, phone, postcode, city, street FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ message: "Felhasználó nem található!" });
      res.json(results[0]);
    }
  );
});

// Termékek lekérése (kép hozzáadásával)
app.get("/products", (req, res) => {
  db.query("SELECT id, name, description, price, stock, category, image FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: "Adatbázis hiba!" });
    res.json(results); // Visszaadjuk a termékek listáját
  });
});

// Képek kiszolgálása
app.use("/images", express.static(path.join(__dirname, "public", "images")));
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return next();

  jwt.verify(token, "secret", (err, user) => {
    if (!err) {
      req.user = user;
    }
    next(); // akár hibás, akár nem, továbbmegyünk
  });
};
// Rendelés létrehozása (frissítve fizetési móddal)
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
    if (err) {
      return res.status(500).json({ error: "Hiba történt a tranzakció indítása közben!" });
    }

    db.query(
      "INSERT INTO orders (user_id, guest_email, total, billing_address, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, guestEmail, total, billingAddress, shippingAddress, payment_method],
      (err, result) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ error: "Hiba történt a rendelés mentése közben." });
          });
        }

        const orderId = result.insertId;

        const orderItems = cart.map(item => [
          orderId, item.product_id, item.product_name, item.price, item.quantity, item.subtotal,
        ]);

        db.query(
          "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES ?",
          [orderItems],
          (err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: "Hiba történt a kosár tételeinek mentése közben." });
              });
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: "Hiba történt a tranzakció véglegesítése közben." });
                });
              }

              res.status(200).json({ message: "Rendelés sikeresen mentve!", orderId });
            });
          }
        );
      }
    );
  });
});
// Felhasználó korábbi rendeléseinek lekérése
app.get("/api/orders", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    "SELECT id, total, billing_address, shipping_address, created_at, payment_method FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ message: "Hiba a rendelések lekérésekor", error: err });
      }

      if (orders.length === 0) {
        return res.json([]);
      }

      const orderIds = orders.map(order => order.id);

      db.query(
        "SELECT * FROM order_items WHERE order_id IN (?)",
        [orderIds],
        (err, orderItems) => {
          if (err) {
            return res.status(500).json({ message: "Hiba a rendelés tételeinek lekérésekor", error: err });
          }
          const ordersWithItems = orders.map(order => {
            const cleanOrder = {
              id: order.id,
              total: order.total,
              billing_address: order.billing_address,
              shipping_address: order.shipping_address,
              created_at: order.created_at,
              payment_method: order.payment_method, 
            };
          
            return {
              ...cleanOrder,
              items: orderItems.filter(item => item.order_id === order.id),
            };
          });

          console.log("Szerver oldali válasz (ordersWithItems):", ordersWithItems); 
          res.json(ordersWithItems);
        }
      );
    }
  );
});

// Szerver futtatása
app.listen(5000, () => console.log("Szerver fut az 5000-es porton"));
app.get("/", (req, res) => {
  res.send("A szerver fut és működik!");
});