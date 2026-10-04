import React from 'react';

export const ProductCard = ({ product }) => {

// Если ссылка содержит хост контейнера, мы делаем её относительной.
  const cleanImageUrl = product.image && typeof product.image === 'string'
    ? product.image.replace('http://backend:8000', '')
    : product.image;

  return (
    <div style={styles.card}>
      <img 
        src={cleanImageUrl}
        alt={product.title} 
        style={styles.image} 
      />
      <div style={styles.info}>
        {/* Название товара */}
        <h3 style={styles.title}>{product.title}</h3>
        
        {/* Описание товара */}
        <p style={styles.description}>
          {product.description || "Описание отсутствует"}
        </p>
        
        {/* Цена товара */}
        <div style={styles.priceContainer}>
          <span style={styles.price}>{parseFloat(product.price).toLocaleString()} ₽</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
    width: '100%',
    // Убираем жесткий minWidth, чтобы сетка сама красиво управляла шириной
  },
  image: {
    width: '100%',
    height: '300px',       // Оптимальная высота для широкой карточки
    objectFit: 'cover',    // Картинка заполняет всё пространство без рамок
    // УБРАЛИ backgroundColor (серый фон)
    // УБРАЛИ padding (внутренние рамки-отступы)
  },
  info: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '20px',    
    color: '#333',
    textAlign: 'center', 
    width: '100%',       
  },
  description: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center', 
    width: '100%',       
    lineHeight: '1.4',
  },
  priceContainer: {
    display: 'flex',
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 'auto',        
    width: '100%',
  },
  price: {
    fontSize: '24px',          
    fontWeight: 'bold',
    color: '#b12704',
  }
};