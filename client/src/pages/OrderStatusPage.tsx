import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Order } from '../types'

export const OrderStatusPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('No order ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch order')
        }

        setOrder(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000)
    return () => clearInterval(interval)
  }, [orderId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'confirmed':
        return '✅'
      case 'preparing':
        return '👨‍🍳'
      case 'ready':
        return '🔔'
      case 'delivered':
        return '🎉'
      case 'cancelled':
        return '❌'
      default:
        return '📋'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order has been received and is being reviewed.'
      case 'confirmed':
        return 'Your order has been confirmed and will be prepared shortly.'
      case 'preparing':
        return 'Our kitchen is preparing your delicious order!'
      case 'ready':
        return 'Your order is ready for pickup or delivery!'
      case 'delivered':
        return 'Your order has been delivered. Enjoy your meal!'
      case 'cancelled':
        return 'Your order has been cancelled.'
      default:
        return 'Status unknown'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ffc107'
      case 'confirmed':
        return '#17a2b8'
      case 'preparing':
        return '#fd7e14'
      case 'ready':
        return '#28a745'
      case 'delivered':
        return '#6f42c1'
      case 'cancelled':
        return '#dc3545'
      default:
        return '#6c757d'
    }
  }

  if (loading) {
    return (
      <div className="order-status-page">
        <div className="status-header">
          <h1>📋 Order Status</h1>
        </div>
        <div className="status-content">
          <div className="loading-card">
            <div className="loading-icon">⏳</div>
            <p>Loading your order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="order-status-page">
        <div className="status-header">
          <h1>📋 Order Status</h1>
        </div>
        <div className="status-content">
          <div className="error-card">
            <div className="error-icon">❌</div>
            <h3>Order Not Found</h3>
            <p>{error || 'Could not find your order'}</p>
            <button 
              className="back-home-btn"
              onClick={() => navigate('/welcome')}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-status-page">
      <div className="status-header">
        <h1>📋 Order Status</h1>
        <p>Order #{order.orderNumber}</p>
      </div>

      <div className="status-content">
        {/* Current Status */}
        <div className="current-status-card">
          <div 
            className="status-icon"
            style={{ color: getStatusColor(order.status) }}
          >
            {getStatusIcon(order.status)}
          </div>
          <h2 style={{ color: getStatusColor(order.status) }}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </h2>
          <p className="status-message">
            {getStatusMessage(order.status)}
          </p>
          <p className="order-time">
            Order placed: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${['pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
            <div className="step-icon">⏳</div>
            <span>Order Received</span>
          </div>
          <div className={`step ${['confirmed', 'preparing', 'ready', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
            <div className="step-icon">✅</div>
            <span>Confirmed</span>
          </div>
          <div className={`step ${['preparing', 'ready', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
            <div className="step-icon">👨‍🍳</div>
            <span>Preparing</span>
          </div>
          <div className={`step ${['ready', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
            <div className="step-icon">🔔</div>
            <span>Ready</span>
          </div>
          <div className={`step ${order.status === 'delivered' ? 'completed' : ''}`}>
            <div className="step-icon">🎉</div>
            <span>Delivered</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="order-details-card">
          <h3>📋 Order Details</h3>
          
          <div className="order-info">
            <div className="info-row">
              <span>Customer:</span>
              <span>{order.customerName}</span>
            </div>
            <div className="info-row">
              <span>Phone:</span>
              <span>{order.customerPhone}</span>
            </div>
            {order.address && (
              <div className="info-row">
                <span>Address:</span>
                <span>{order.address}</span>
              </div>
            )}
            <div className="info-row">
              <span>Total:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="order-items">
            <h4>Items:</h4>
            {order.items.map((item, index) => (
              <div key={index} className="status-item">
                <div className="item-info">
                  <span className="item-name">{item.itemName}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                  
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="item-modifiers">
                      {item.selectedModifiers.map((modifier, idx) => (
                        <div key={idx} className="modifier">
                          <span className="modifier-name">{modifier.modifierName}:</span>
                          {modifier.selectedOptions.map((option, optIdx) => (
                            <span key={optIdx} className="modifier-option">
                              {option.optionName} (+${option.price.toFixed(2)})
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {item.specialNotes && (
                    <div className="item-notes">
                      <span className="notes-label">📝</span>
                      <span className="notes-text">{item.specialNotes}</span>
                    </div>
                  )}
                </div>
                <span className="item-price">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-card">
          <h3>📞 Need Help?</h3>
          <p>If you have any questions about your order, please contact us:</p>
          <div className="contact-info">
            <div>📱 WhatsApp: You'll receive updates automatically</div>
            <div>🕒 Estimated time: 15-25 minutes</div>
          </div>
        </div>

        {/* Actions */}
        <div className="status-actions">
          <button 
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            🔄 Refresh Status
          </button>
          <button 
            className="new-order-btn"
            onClick={() => navigate('/welcome')}
          >
            Place New Order
          </button>
        </div>
      </div>
    </div>
  )
}