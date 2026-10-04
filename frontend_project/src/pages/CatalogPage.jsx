import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';

export const CatalogPage = () => {
  // Хранилище для списка товаров
  const [products, setProducts] = useState([]);
  // Состояние загрузки (пока данные летят от сервера)
  const [loading, setLoading] = useState(true);
  // Состояние для возможных ошибок сервера
  const [error, setError] = useState(null);

  // Функция для получения данных с бэкенда Django
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Укажите адрес, на котором запущен ваш Django (по умолчанию 8000 порт)
      const response = await axios.get('/api/products/');
      
      // Записываем полученный массив товаров в состояние
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error("Ошибка при получении товаров:", err);
      setError("Не удалось загрузить товары. Проверьте, запущен ли бэкенд.");
    } finally {
      setLoading(false);
    }
  };

  // Вызываем функцию fetchProducts один раз при монтировании (старте) страницы
  useEffect(() => {
    fetchProducts();
  }, []);

  // Если данные ещё загружаются
  if (loading) {
    return <div style={styles.center}>Загрузка витрины украшений...</div>;
  }

  // Если бэкенд вернул ошибку (например, выключен)
  if (error) {
    return <div style={{ ...styles.center, color: 'red' }}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      
      {/* Проверка: если в базе вообще нет товаров */}
      {products.length === 0 ? (
        <p style={styles.center}>В магазине пока нет товаров.</p>
      ) : (
        // Сетка для вывода карточек
        <div style={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    // На компьютерах ширина 95%, на телефонах — 100% с аккуратными полями по бокам
    width: '100%',
    maxWidth: '1600px', 
    margin: '0 auto',
    padding: '0 15px',       // Одинаковые отступы слева и справа для мобильных!
    paddingTop: '100px',     // Отступ сверху под черную шапку
    boxSizing: 'border-box', // Гарантирует правильный расчет ширины экрана
  },
  grid: {
    display: 'grid',
    // Изменили minmax: теперь минимальная ширина карточки на ПК 350px, 
    // но если экран телефона меньше (например, 100%), карточка плавно ужмется до 100% ширины экрана
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))',
    gap: '20px', // Уменьшили зазор для мобильных, чтобы он не косил экран
  },
  center: {
    textAlign: 'center',
    marginTop: '100px',
    fontSize: '18px',
    fontFamily: 'sans-serif',
  }
};