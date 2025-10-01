import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../context/CustomerContext'
import type { LocationData } from '../types'

export const LocationPage: React.FC = () => {
  const navigate = useNavigate()
  const { setLocation } = useCustomer()
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [manualAddress, setManualAddress] = useState('')
  const [useManualAddress, setUseManualAddress] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getCurrentLocation = () => {
    setLoading(true)
    setError('')

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // In a real app, you would use a geocoding service to get the address
          // For now, we'll use a mock address
          const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          
          const location: LocationData = {
            latitude,
            longitude,
            address: `Near ${address}` // Mock address
          }
          
          setLocationData(location)
          setLoading(false)
        } catch {
          setError('Failed to get address for your location')
          setLoading(false)
        }
      },
      (error) => {
        setError(`Location error: ${error.message}`)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleManualAddressSubmit = () => {
    if (!manualAddress.trim()) {
      setError('Please enter your address')
      return
    }

    // Mock coordinates for manual address
    const location: LocationData = {
      latitude: 40.7128, // Mock NYC coordinates
      longitude: -74.0060,
      address: manualAddress.trim()
    }
    
    setLocationData(location)
  }

  const handleContinue = () => {
    if (!locationData) {
      setError('Please provide your location')
      return
    }

    setLocation(locationData)
    navigate('/customer-info')
  }

  useEffect(() => {
    // Auto-try to get location on load
    if (!useManualAddress) {
      getCurrentLocation()
    }
  }, [useManualAddress])

  return (
    <div className="location-page">
      <div className="location-container">
        <div className="page-header">
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          <h1>📍 Your Location</h1>
          <p>We need your location to calculate delivery time and fees</p>
        </div>

        <div className="location-content">
          {!useManualAddress ? (
            <div className="auto-location">
              <div className="location-icon">🎯</div>
              
              {loading && (
                <div className="loading-state">
                  <p>Getting your location...</p>
                  <div className="loading-spinner"></div>
                </div>
              )}

              {locationData && !loading && (
                <div className="location-success">
                  <h3>✅ Location Found</h3>
                  <p className="address">{locationData.address}</p>
                  <p className="coordinates">
                    {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
                  </p>
                </div>
              )}

              {error && (
                <div className="error-state">
                  <p className="error-message">❌ {error}</p>
                </div>
              )}

              <div className="location-actions">
                <button 
                  className="get-location-btn"
                  onClick={getCurrentLocation}
                  disabled={loading}
                >
                  {loading ? 'Getting Location...' : '📍 Use My Location'}
                </button>
                
                <button 
                  className="manual-address-btn"
                  onClick={() => setUseManualAddress(true)}
                >
                  📝 Enter Address Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="manual-location">
              <div className="manual-header">
                <h3>📝 Enter Your Address</h3>
                <button 
                  className="use-gps-btn"
                  onClick={() => setUseManualAddress(false)}
                >
                  📍 Use GPS Instead
                </button>
              </div>

              <div className="address-input">
                <label htmlFor="address">Delivery Address</label>
                <textarea
                  id="address"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Enter your full address including street, city, and postal code"
                  rows={3}
                />
                <button 
                  className="confirm-address-btn"
                  onClick={handleManualAddressSubmit}
                >
                  Confirm Address
                </button>
              </div>

              {locationData && (
                <div className="location-success">
                  <h4>✅ Address Confirmed</h4>
                  <p className="address">{locationData.address}</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="location-footer">
          <button 
            className="continue-btn"
            onClick={handleContinue}
            disabled={!locationData}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}