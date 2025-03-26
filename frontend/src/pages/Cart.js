import { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import CartContext from "../context/CartContext";
import "../styles/Cart.css";

const Cart = () => {
  const { user } = useContext(AuthContext);
  const { cart, total, clearCart, updateQuantity, removeFromCart } = useContext(CartContext);

  // Inicializálás
  const [name, setName] = useState(user?.name || "");
  const [billingZip, setBillingZip] = useState(user?.billingZip || "");
  const [billingCity, setBillingCity] = useState(user?.billingCity || "");
  const [billingStreet, setBillingStreet] = useState(user?.billingStreet || "");
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [shippingZip, setShippingZip] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card"); // Alapértelmezett: kártyás fizetés
  const [isFormValid, setIsFormValid] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");

  // Frissítés ha a felhasználó bejelentkezik
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBillingZip(user.billingZip || "");
      setBillingCity(user.billingCity || "");
      setBillingStreet(user.billingStreet || "");
    }
  }, [user]);

  // Ha a "Ugyanaz mint a számlázási cím" checkbox be van pipálva
  useEffect(() => {
    if (sameAsBilling) {
      setShippingZip(billingZip);
      setShippingCity(billingCity);
      setShippingStreet(billingStreet);
    } else {
      setShippingZip("");
      setShippingCity("");
      setShippingStreet("");
    }
  }, [sameAsBilling, billingZip, billingCity, billingStreet]);

  // Form validáció
  useEffect(() => {
    const isValid =
      name.trim() !== "" &&
      billingZip.trim() !== "" &&
      billingCity.trim() !== "" &&
      billingStreet.trim() !== "" &&
      cart.length > 0 &&
      (!sameAsBilling
        ? shippingZip.trim() !== "" &&
          shippingCity.trim() !== "" &&
          shippingStreet.trim() !== ""
        : true);
  
    setIsFormValid(isValid);
  }, [name, billingZip, billingCity, billingStreet, sameAsBilling, shippingZip, shippingCity, shippingStreet, cart, paymentMethod]);
  // Rendelés elküldése
  const handleOrder = async () => {
    const token = localStorage.getItem("token");

    if (!token && !guestEmail.trim()) {
      alert("Vendégként kérjük, adjon meg egy email címet!");
      return;
    }

    const orderData = {
      user_id: user ? user.id : null,
      guest_email: user ? null : guestEmail.trim(),
      total,
      billing: { 
        zip: (billingZip || "").trim(), 
        city: (billingCity || "").trim(), 
        street: (billingStreet || "").trim() 
      },
      shipping: { 
        zip: (shippingZip || "").trim(), 
        city: (shippingCity || "").trim(), 
        street: (shippingStreet || "").trim() 
      },
      payment_method: paymentMethod,
      cart: cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
    };

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Rendelés sikertelen");
      }

      alert("Megrendelés leadva!");
      clearCart();
    } catch (error) {
      console.error("Hiba történt:", error);
      alert("Hiba történt a rendelés során.");
    }
  };

  return (
    <div className="cart-container">
      <h2 className="cart-header">Kosár</h2>
      {cart.length === 0 ? (
        <p>A kosár üres.</p>
      ) : (
        <>
          <ul className="cart-list">
            {cart.map((item) => (
              <li key={item.id} className="cart-item">
                <span>{item.name} - {item.price.toLocaleString()} Ft × {item.quantity}</span>
                <div className="cart-controls">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                  <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value)))}/>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  <button className="remove-button" onClick={() => removeFromCart(item.id)}>🗑</button>
                </div>
              </li>
            ))}
          </ul>
          <h3 className="cart-total">Összesen: {total.toLocaleString()} Ft</h3>

          <div className="form-section">
            <h2>Számlázási adatok</h2>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Név" />
            <input type="text" value={billingZip} onChange={(e) => setBillingZip(e.target.value)} placeholder="Irányítószám" />
            <input type="text" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} placeholder="Város" />
            <input type="text" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} placeholder="Utca, házszám" />
          </div>

          <div className="form-section">
            <h2>Szállítási adatok</h2>
            <label>
              <input type="checkbox" checked={sameAsBilling} onChange={() => setSameAsBilling(!sameAsBilling)} />
              Ugyanaz, mint a számlázási cím
            </label>
            {!sameAsBilling && (
              <>
                <input type="text" value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} placeholder="Irányítószám" />
                <input type="text" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="Város" />
                <input type="text" value={shippingStreet} onChange={(e) => setShippingStreet(e.target.value)} placeholder="Utca, házszám" />
              </>
            )}
          </div>

          <div className="form-section">
            <h2>Fizetési mód</h2>
            <label>
              <input type="radio" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
              Kártyás fizetés
            </label>
            <label>
              <input type="radio" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} />
              Készpénzes fizetés
            </label>
          </div>
          {!user && (
          <div className="form-section">
            <h2>Kapcsolattartó Email</h2>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Email cím"
            />
          </div>
        )}
          <button className="order-button" onClick={handleOrder} disabled={!isFormValid}>
            Megrendelés
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;