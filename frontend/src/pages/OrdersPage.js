import React, { useEffect, useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/OrdersPage.css";

const OrdersPage = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/orders", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Hiba: ${response.status}`);
        }

        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Hiba a rendelések lekérésekor:", error);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  return (
    <div className="orders-page">
      <h2>Korábbi rendeléseim</h2>
      {orders.length === 0 ? (
        <p>Még nincs korábbi rendelésed.</p>
      ) : (
        <ul className="orders-list">
          {orders.map((order) => (
            <li key={order.id} className="order-item">
              <p><strong>Rendelés ID:</strong> {order.id}</p>
              <p><strong>Dátum:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Összeg:</strong> {order.total} Ft</p>
              <p><strong>Fizetés módja:</strong> {
                order.payment_method === "card"
                  ? "Kártyás fizetés"
                  : order.payment_method === "cash"
                  ? "Készpénzes fizetés"
                  : "Nincs adat"
              }</p>
              <p><strong>Termékek:</strong></p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.product_id}>
                    <strong>{item.product_name}</strong> – {item.quantity} db ({item.price} Ft/db)
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrdersPage;
