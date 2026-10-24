import axios from 'axios'; 
import React, { useState, useEffect } from 'react';

export const Header = () => {

const [settings, setSettings] = useState({ site_name: 'Загрузка...', phone: '', logo: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ваша функция, переписанная под эндпоинт настроек
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings/');
      setSettings(response.data); // У axios данные лежат в .data
      setError(null);
    } catch (err) {
      console.error("Ошибка при получении настроек сайта:", err);
      setError("Не удалось загрузить шапку сайта.");
    } finally {
      setLoading(false);
    }
  };

  // Вызываем функцию один раз при загрузке компонента Header
  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) return <header style={styles.header}>Загрузка шапки...</header>;

  const logoUrl = settings && settings.logo && typeof settings.logo === 'string'
  ? settings.logo.replace('http://backend:8000', '')
  : (settings?.logo || '');

  return (
    <header style={styles.header}>
      <div style={styles.container}>
       {/* Логотип / Название магазина слева */}
        <div style={styles.logo}>
          {settings.logo ? (
            // Если менеджер загрузил логотип в Django, показываем картинку
            <img src={logoUrl} alt={settings.site_name} style={styles.logoImage} />
          ) : (
            // Если логотипа нет, показываем текстовое название из БД
            <span>{settings.site_name}</span>
          )}
        </div>
        
        {/* Контакты справа */}
         <div style={styles.contacts}>
          {settings.phone && (
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} style={styles.phone}>
              {settings.phone}
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

const styles = {
 header: {
  backgroundColor: '#640a0a',
  color: '#ffffff',
  padding: '15px 0',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  position: 'fixed', // Изменили на fixed для более стабильного поведения
  top: 0,
  left: 0,
  width: '100%',     // Шапка растягивается на весь экран
  zIndex: 1000,      // Гарантирует, что шапка ВСЕГДА будет поверх карточек
  fontFamily: 'sans-serif',
},
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between', // Разносит элементы по краям (влево и вправо)
    alignItems: 'center', // Выравнивает текст строго по центру высоты
  },
  logo: {
    fontSize: '22px',
    fontWeight: 'bold',
    letterSpacing: '2px', // Красивый отступ между буквами
    cursor: 'pointer',
  },
  shopText: {
    color: '#d4af37', // Элегантный золотой цвет для слова SHOP
    fontWeight: '300',
  },
  contacts: {
    display: 'flex',
    alignItems: 'center',
  },
  phone: {
    color: '#ffffff',
    textDecoration: 'none', // Убираем стандартное подчеркивание ссылки
    fontSize: '16px',
    fontWeight: '500',
    transition: 'color 0.2s',
  },

   logoImage: {
    maxHeight: '40px', // Ограничиваем по высоте, чтобы шапка не расползалась
    width: 'auto',
    display: 'block',
  }
};