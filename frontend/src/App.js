import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; // Importáld a CartProvider-t
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Cart from "./pages/Cart";
import ProductList from "./pages/ProductList";
import Orders from "./pages/OrdersPage";

function App() {
  return (
    <AuthProvider>
      <CartProvider> {/* Itt becsomagoljuk */}
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<Account />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/productlist" element={<ProductList />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;