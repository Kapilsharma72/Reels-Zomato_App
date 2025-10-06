import React from 'react'
// import './App.css'
// import './styles/global.css'
// import './styles/variables.css'
// import './styles/theme.css'
import AppRoutes from './routes/appRoutes'

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#1a1a2e',
      margin: 0,
      padding: 0,
      fontFamily: 'Inter, sans-serif'
    }}>
      <AppRoutes />
    </div>
  )
}

export default App
