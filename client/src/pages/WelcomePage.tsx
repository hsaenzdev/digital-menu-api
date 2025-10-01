import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomer } from '../context/CustomerContext'
import type { Customer, ApiResponse } from '../types'

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate()
  const { customerId } = useParams<{ customerId: string }>()
  const { setCustomer } = useCustomer()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        setError('No customer ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/customers/${customerId}`)
        const data: ApiResponse<Customer> = await response.json()

        if (data.success && data.data) {
          // Customer exists - store in context
          setCustomer(data.data)
        } else {
          // Customer not found - this should not happen as WA creates customer first
          // But we'll handle it gracefully
          console.warn('Customer not found, will need to create')
        }
      } catch (err) {
        console.error('Error fetching customer:', err)
        setError('Failed to load customer information')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [customerId, setCustomer])

  const handleStartOrder = () => {
    navigate('/customer-info')
  }

  if (loading) {
    return (
      <div className="welcome-page">
        <div className="welcome-container">
          <div className="loading-icon">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="welcome-page">
        <div className="welcome-container">
          <div className="error-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="restaurant-header">
          <h1>🍽️ Digital Menu</h1>
          <p className="restaurant-subtitle">Delicious food delivered to your door</p>
        </div>

        <div className="welcome-content">
          <div className="welcome-image">
            <div className="food-icon">🍔🍟🥤</div>
          </div>

          <div className="welcome-text">
            <h2>Welcome to our restaurant!</h2>
            <p>Order your favorite meals with just a few taps</p>
            
            <div className="features-list">
              <div className="feature">
                <span className="feature-icon">📱</span>
                <span>Easy mobile ordering</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🚚</span>
                <span>Fast delivery</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💳</span>
                <span>Secure payment</span>
              </div>
            </div>
          </div>

          <button 
            className="start-order-btn"
            onClick={handleStartOrder}
          >
            Start Your Order
          </button>
          
          {/* Temporary test button for development */}
          <button 
            className="test-menu-btn"
            onClick={() => navigate('/menu')}
            style={{ 
              background: '#28a745', 
              marginTop: '1rem',
              fontSize: '0.9rem',
              padding: '0.8rem 2rem'
            }}
          >
            🧪 Test Menu (Dev)
          </button>
        </div>

        <div className="welcome-footer">
          <p>🕐 Open daily: 10:00 AM - 10:00 PM</p>
          <p>📞 Questions? Call us at (555) 123-4567</p>
        </div>
      </div>
    </div>
  )
}