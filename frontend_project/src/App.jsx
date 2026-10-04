import { useState } from 'react'
import { Header } from './components/Header'; // Импортируем шапку
import { CatalogPage } from './pages/CatalogPage'; 
import './App.css'

function App() {
  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Черная панель теперь будет на самом верху */}
      <Header /> 
      
      {/* Ниже идет содержимое страницы */}
      <CatalogPage />
    </div>
  )
}

export default App
