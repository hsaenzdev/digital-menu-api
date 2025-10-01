import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../context/CustomerContext'
import type { Order, ApiResponse } from '../types'

export const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { customer } = useCustomer()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer?.id) {
        setError('No customer information available')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/customers/${customer.id}/orders`)
        const data: ApiResponse<Order[]> = await response.json()

        if (data.success && data.data) {
          setOrders(data.data)
        } else {
          setError(data.error || 'Failed to load orders')
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError('Failed to load order history')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [customer?.id])

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

  const isActiveOrder = (status: string) => {
    return ['pending', 'confirmed', 'preparing', 'ready'].includes(status)
  }

  if (loading) {
    return (
      <div className="order-history-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/menu')}>
            ← Back
          </button>
          <h1>📋 Order History</h1>
        </div>
        <div className="page-content">
          <div className="loading-card">
            <div className="loading-icon">⏳</div>
            <p>Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="order-history-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/menu')}>
            ← Back
          </button>
          <h1>📋 Order History</h1>
        </div>
        <div className="page-content">
          <div className="error-card">
            <div className="error-icon">❌</div>
            <h3>Error Loading Orders</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const activeOrders = orders.filter(order => isActiveOrder(order.status))
  const completedOrders = orders.filter(order => !isActiveOrder(order.status))

  return (
    <div className="order-history-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/menu')}>
          ← Back
        </button>
        <h1>📋 Your Orders</h1>
        <p>Track your current and past orders</p>
      </div>

      <div className="page-content">
        {/* Active Orders Warning */}
        {activeOrders.length > 0 && (
          <div className="active-orders-alert">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h3>Active Orders in Progress</h3>
              <p>You have {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''}. 
              Please wait for {activeOrders.length > 1 ? 'them' : 'it'} to be completed before placing a new order.</p>
            </div>
          </div>
        )}

        {/* No Orders */}
        {orders.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders. Start browsing our menu!</p>
            <button className="browse-menu-btn" onClick={() => navigate('/menu')}>
              Browse Menu
            </button>
          </div>
        )}

        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <div className="orders-section">
            <h2>🔥 Active Orders</h2>
            <div className="orders-list">
              {activeOrders.map(order => (
                <div key={order.id} className="order-card active">
                  <div className="order-header">
                    <div className="order-number">
                      <span className="label">Order #</span>
                      <span className="value">{order.orderNumber}</span>
                    </div>
                    <div 
                      className="order-status"
                      style={{ 
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontWeight: 'bold'
                      }}
                    >
                      {getStatusIcon(order.status)} {order.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="detail-label">📅 Date:</span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">🍽️ Items:</span>
                      <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">💰 Total:</span>
                      <span className="total-amount">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="order-items-preview">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="item-preview">
                        <span className="item-name">{item.itemName}</span>
                        <span className="item-qty">x{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="more-items">
                        +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <button 
                    className="view-details-btn"
                    onClick={() => navigate(`/order-status/${order.id}`)}
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Orders Section */}
        {completedOrders.length > 0 && (
          <div className="orders-section">
            <h2>✅ Order History</h2>
            <div className="orders-list">
              {completedOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-number">
                      <span className="label">Order #</span>
                      <span className="value">{order.orderNumber}</span>
                    </div>
                    <div 
                      className="order-status"
                      style={{ 
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}
                    >
                      {getStatusIcon(order.status)} {order.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="detail-label">📅 Date:</span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">🍽️ Items:</span>
                      <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">💰 Total:</span>
                      <span className="total-amount">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="order-items-preview">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="item-preview">
                        <span className="item-name">{item.itemName}</span>
                        <span className="item-qty">x{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="more-items">
                        +{order.items.length - 2} more
                      </div>
                    )}
                  </div>

                  <button 
                    className="view-details-btn secondary"
                    onClick={() => navigate(`/order-status/${order.id}`)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="page-footer">
        {activeOrders.length === 0 && (
          <button 
            className="new-order-btn"
            onClick={() => navigate('/menu')}
          >
            Place New Order
          </button>
        )}
      </div>
    </div>
  )
}
