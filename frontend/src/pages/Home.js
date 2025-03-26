import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div>
      {/* Termékek menü */}
      <nav style={styles.productNav}>
        <Link to="/productlist" style={styles.productLink}>🛍 Termékek</Link>
      </nav>

      {/* Fő tartalom */}
      <div style={styles.content}>
        <h1>Üdvözöljük Fehér Gábor webshopjában!</h1>
        <p>Válogasson számítógépes kiegészítőink és hardvereink között.</p>

        {/* Kiemelt termékek */}
        <div style={styles.products}>
          <div style={styles.product}>
            <img src="/monitor.jpg" alt="Monitor" style={styles.productImage} />
            <p>Monitor</p>
          </div>
          <div style={styles.product}>
            <img src="/mouse.jpg" alt="Egér" style={styles.productImage} />
            <p>Egér</p>
          </div>
          <div style={styles.product}>
            <img src="/keyboard.jpg" alt="Billentyűzet" style={styles.productImage} />
            <p>Billentyűzet</p>
          </div>
        </div>

        {/* További termékek gomb */}
        <Link to="/productlist" style={styles.moreProducts}>További termékek →</Link>
      </div>
    </div>
  );
};

// Stílusok objektumként
const styles = {
  productNav: {
    textAlign: "center",
    padding: "10px",
    background: "#eee",
    fontSize: "18px",
  },
  productLink: {
    textDecoration: "none",
    color: "#333",
    fontWeight: "bold",
  },
  content: {
    textAlign: "center",
    padding: "50px",
  },
  products: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "20px",
  },
  product: {
    textAlign: "center",
  },
  productImage: {
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "10px",
  },
  moreProducts: {
    display: "block",
    marginTop: "20px",
    textDecoration: "none",
    color: "#007bff",
    fontWeight: "bold",
    fontSize: "18px",
  },
};

export default Home;
