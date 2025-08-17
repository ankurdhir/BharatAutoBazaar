import React from 'react'

export default function Test() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      color: '#333',
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>🎉 React is Working!</h1>
        <p>If you can see this, React is rendering correctly.</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
} 