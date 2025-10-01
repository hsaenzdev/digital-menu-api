import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../context/CustomerContext'

export const CustomerInfoPage: React.FC = () => {
  const navigate = useNavigate()
  const { customer, location, setCustomer } = useCustomer()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if no location
  useEffect(() => {
    if (!location) {
      navigate('/location')
    }
  }, [location, navigate])

  // Redirect if no customer (should come from URL)
  useEffect(() => {
    if (!customer) {
      // No customer loaded from URL - shouldn't happen in normal flow
      setError('No customer information available. Please start from the link provided.')
    }
  }, [customer])

  // Pre-fill name if customer already has one
  useEffect(() => {
    if (customer?.name) {
      setName(customer.name)
    }
  }, [customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      setError('Please enter your name')
      return
    }

    if (!customer?.id) {
      setError('No customer ID available. Please start from the link provided.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update customer with name if it's new or changed
      if (!customer.name || customer.name !== name.trim()) {
        const response = await fetch(`/api/customers/${customer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            defaultAddress: location?.address || '',
            defaultLocation: `${location?.latitude},${location?.longitude}`
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update customer')
        }
      }

      // Update customer context with name
      setCustomer({
        ...customer,
        name: name.trim()
      })

      navigate('/menu')
    } catch {
      setError('Failed to save customer information')
    } finally {
      setLoading(false)
    }
  }

  if (!location) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="customer-info-page">
      <div className="customer-info-container">
        <div className="page-header">
          <button 
            className="back-btn"
            onClick={() => navigate('/location')}
          >
            ← Back
          </button>
          <h1>👤 Your Information</h1>
          <p>We need your contact details to process your order</p>
        </div>

        <div className="location-summary">
          <div className="location-info">
            <span className="location-icon">📍</span>
            <span className="location-text">{location.address}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="customer-form">
          {customer?.phoneNumber && (
            <div className="info-display">
              <div className="info-item">
                <span className="info-label">📱 Phone Number:</span>
                <span className="info-value">{customer.phoneNumber}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={customer?.name ? customer.name : "Enter your full name"}
              required
            />
            {customer?.name && (
              <div className="field-note">
                ✅ Name on file: {customer.name}
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          <div className="form-footer">
            <button 
              type="submit"
              className="continue-btn"
              disabled={loading || !name}
            >
              {loading ? 'Processing...' : 'Continue to Menu →'}
            </button>
          </div>
        </form>

        <div className="privacy-note">
          <p>🔒 Your information is secure and will only be used for order processing</p>
        </div>
      </div>
    </div>
  )
}