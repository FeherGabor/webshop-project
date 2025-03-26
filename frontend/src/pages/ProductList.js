import { useState, useEffect, useContext } from "react";
import axios from "axios";
import CartContext from "../context/CartContext"; // CartContext importálása
import "../styles/ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  const { addToCart } = useContext(CartContext); // Kosár kontextus használata

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/products");
        setProducts(response.data);
        setFilteredProducts(response.data);

        // Egyedi kategóriák kinyerése a termékekből
        const uniqueCategories = [
          ...new Set(response.data.map((product) => product.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Hiba történt a termékek betöltésekor:", error);
        setError("Hiba történt a termékek betöltésekor!");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Szűrés a kiválasztott kategória alapján
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((product) => product.category === selectedCategory)
      );
    }
  }, [selectedCategory, products]);

  return (
    <div>
      <h2>Termékek</h2>

      {/* Szűrő legördülő lista */}
      <div className="filter-container">
        <label htmlFor="category-filter">Szűrés kategória szerint:</label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Összes</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="product-list">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-item">
              <img
                src={`http://localhost:5000/images/${product.image}`}
                alt={product.name}
                style={{ width: "200px", height: "200px" }}
              />
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>{product.price} Ft</p>
              <button onClick={() => addToCart(product)}>Kosárba Rak</button> {/* Kosárba rakás */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;