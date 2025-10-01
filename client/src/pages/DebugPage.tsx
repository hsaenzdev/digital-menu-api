import React from 'react'
import { useCart } from '../context/CartContext'
import { useCustomer } from '../context/CustomerContext'

export const DebugPage: React.FC = () => {
  const { cart, addItem } = useCart()
  const { customer, setCustomer, location, setLocation } = useCustomer()

  const addTestItem = () => {
    const testItem = {
      id: 'test-' + Date.now(),
      itemId: 'test-pizza-123',
      itemName: 'Test Pizza',
      itemPrice: 15.99,
      quantity: 1,
      unitPrice: 15.99,
      totalPrice: 15.99,
      specialNotes: 'Test order',
      selectedModifiers: []
    }
    addItem(testItem)
  }

  const setTestCustomer = () => {
    setCustomer({
      id: 'test-customer-id',
      phoneNumber: '+1234567890',
      name: 'Test Customer',
      defaultAddress: '123 Test Street'
    })
    setLocation({
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Test Street, New York, NY'
    })
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🧪 Debug Page</h1>
      
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Customer Info:</h3>
        <pre>{JSON.stringify(customer, null, 2)}</pre>
        <h3>Location Info:</h3>
        <pre>{JSON.stringify(location, null, 2)}</pre>
        <button onClick={setTestCustomer} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
          Set Test Customer & Location
        </button>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Cart Info:</h3>
        <p>Items count: {cart.items.length}</p>
        <p>Total: ${cart.total.toFixed(2)}</p>
        <pre>{JSON.stringify(cart, null, 2)}</pre>
        <button onClick={addTestItem} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
          Add Test Item
        </button>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>LocalStorage Debug:</h3>
        <div style={{ marginBottom: '1rem' }}>
          <h4>Cart in localStorage:</h4>
          <pre style={{ fontSize: '0.8rem' }}>
            {localStorage.getItem('digital-menu-cart') || 'null'}
          </pre>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <h4>Customer in localStorage:</h4>
          <pre style={{ fontSize: '0.8rem' }}>
            {localStorage.getItem('digital-menu-customer') || 'null'}
          </pre>
        </div>
        <div>
          <h4>Location in localStorage:</h4>
          <pre style={{ fontSize: '0.8rem' }}>
            {localStorage.getItem('digital-menu-location') || 'null'}
          </pre>
        </div>
        <button 
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          style={{ 
            padding: '0.5rem 1rem', 
            marginTop: '1rem',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Clear All LocalStorage
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Navigation Tests:</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/menu" style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Go to Menu
          </a>
          <a href="/cart" style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Go to Cart
          </a>
          <a href="/order-confirmation" style={{ padding: '0.5rem 1rem', background: '#ffc107', color: 'black', textDecoration: 'none', borderRadius: '4px' }}>
            Go to Order Confirmation
          </a>
          <a href="/customer-info" style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Go to Customer Info
          </a>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <button 
            onClick={() => {
              // Ensure we have both customer and cart data before testing
              if (!customer?.phone || cart.items.length === 0) {
                alert('Please set customer info and add at least one cart item first!')
                return
              }
              window.location.href = '/order-confirmation'
            }}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              marginRight: '1rem'
            }}
          >
            🚀 Test Order Confirmation (with validation)
          </button>
          
          <button 
            onClick={() => {
              console.log('Opening order confirmation WITHOUT validation check')
              console.log('Current cart items:', cart.items)
              console.log('Current customer:', customer)
              window.location.href = '/order-confirmation'
            }}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            🔧 Force Order Confirmation (no validation)
          </button>
        </div>
      </div>
    </div>
  )
}