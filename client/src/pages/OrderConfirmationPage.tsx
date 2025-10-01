import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useCustomer } from '../context/CustomerContext'
import type { Order } from '../types'

export const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { customer } = useCustomer()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [orderSubmissionInProgress, setOrderSubmissionInProgress] = useState(false)

  // Give time for contexts to load from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 50) // Reduced delay since contexts are more reliable
    
    return () => clearTimeout(timer)
  }, [])

  // Debug logging
  console.log('OrderConfirmationPage Debug:')
  console.log('- isLoading:', isLoading)
  console.log('- Cart object:', cart)
  console.log('- Cart items (raw):', cart.items)
  console.log('- Cart items type:', typeof cart.items)
  console.log('- Cart items is Array:', Array.isArray(cart.items))
  console.log('- Cart items length:', cart.items?.length)
  console.log('- Customer:', customer)
  console.log('- Has customer ID:', !!customer?.id)
  console.log('- Has customer phone:', !!customer?.phoneNumber)
  console.log('- Has customer name:', !!customer?.name)

  // Show loading while contexts initialize
  if (isLoading) {
    return (
      <div className="order-confirmation-page">
        <div className="confirmation-header">
          <h1>📋 Loading Order</h1>
          <p>Preparing your order confirmation...</p>
        </div>
        <div className="confirmation-content">
          <div className="loading-card">
            <div className="loading-icon">⏳</div>
            <p>Loading your order details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if we have required data - with extra safety checks
  const hasCartItems = cart && cart.items && Array.isArray(cart.items) && cart.items.length > 0
  const hasCustomerInfo = customer?.id && customer?.phoneNumber && customer?.name

  console.log('- hasCartItems:', hasCartItems)
  console.log('- hasCustomerInfo:', hasCustomerInfo)
  console.log('- cart existence check:', !!cart)
  console.log('- cart.items existence check:', !!cart?.items)
  console.log('- cart.items is array check:', Array.isArray(cart?.items))
  console.log('- cart.items length check:', cart?.items?.length)
  console.log('- orderSubmissionInProgress:', orderSubmissionInProgress)
  console.log('- submittedOrder exists:', !!submittedOrder)

  // Skip validation if order has been submitted or is being submitted
  const shouldSkipValidation = submittedOrder || orderSubmissionInProgress

  // If missing data AND not in submission process, show appropriate message
  if (!shouldSkipValidation && (!hasCartItems || !hasCustomerInfo)) {
    return (
      <div className="order-confirmation-page">
        <div className="confirmation-header">
          <h1>⚠️ Missing Information</h1>
          <p>Please complete the required steps</p>
        </div>
        <div className="confirmation-content">
          <div className="error-card">
            {!hasCartItems && (
              <div className="missing-info">
                <h3>🛒 Empty Cart</h3>
                <p>You need to add items to your cart before proceeding to checkout.</p>
                <p><strong>Debug Info:</strong></p>
                <pre style={{ fontSize: '0.8rem', background: '#f8f9fa', padding: '0.5rem' }}>
                  {JSON.stringify({
                    hasCartItems,
                    cartExists: !!cart,
                    cartItemsExists: !!cart?.items,
                    cartItemsType: typeof cart?.items,
                    cartItemsIsArray: Array.isArray(cart?.items),
                    cartItemsLength: cart?.items?.length,
                    actualCartItems: cart?.items
                  }, null, 2)}
                </pre>
                <button 
                  className="back-home-btn"
                  onClick={() => navigate('/menu')}
                >
                  Go to Menu
                </button>
                <button 
                  className="back-home-btn"
                  onClick={() => navigate('/debug')}
                  style={{ marginLeft: '1rem', background: '#17a2b8' }}
                >
                  Go to Debug
                </button>
                <button 
                  className="back-home-btn"
                  onClick={() => {
                    console.log('FORCE CONTINUING - Bypassing validation')
                    setIsLoading(false)
                    // Force the component to re-render by updating a dummy state
                    window.location.reload()
                  }}
                  style={{ marginLeft: '1rem', background: '#dc3545' }}
                >
                  🚨 Force Continue (Debug)
                </button>
              </div>
            )}
            {!hasCustomerInfo && (
              <div className="missing-info">
                <h3>📞 Missing Customer Information</h3>
                <p>Please provide your contact information to place an order.</p>
                <p><strong>Debug Info:</strong></p>
                <pre style={{ fontSize: '0.8rem', background: '#f8f9fa', padding: '0.5rem' }}>
                  {JSON.stringify({
                    hasCustomerInfo,
                    customerExists: !!customer,
                    customerId: customer?.id,
                    customerPhone: customer?.phoneNumber,
                    customerName: customer?.name
                  }, null, 2)}
                </pre>
                <button 
                  className="back-home-btn"
                  onClick={() => navigate('/customer-info')}
                >
                  Enter Customer Info
                </button>
                <button 
                  className="back-home-btn"
                  onClick={() => navigate('/debug')}
                  style={{ marginLeft: '1rem', background: '#17a2b8' }}
                >
                  Go to Debug
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const submitOrder = async () => {
    if (!customer) return
    
    console.log('🚀 Starting order submission...')
    console.log('Cart before submission:', cart)
    console.log('Customer before submission:', customer)
    
    setIsSubmitting(true)
    setOrderSubmissionInProgress(true) // Mark submission as in progress
    setError(null)

    try {
      // Prepare order data for API
      const orderData = {
        customerPhone: customer.phoneNumber || customer.phone || '', // Support both old and new field names
        customerName: customer.name,
        location: customer.defaultLocation || customer.location || '',
        address: customer.defaultAddress || customer.address || '',
        subtotal: cart.subtotal,
        tax: cart.tax,
        tip: cart.tip,
        total: cart.total,
        items: cart.items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          itemPrice: item.itemPrice,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          specialNotes: item.specialNotes || '',
          selectedModifiers: item.selectedModifiers
        }))
      }

      console.log('📤 Sending order data:', orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      console.log('📥 Response status:', response.status)
      const result = await response.json()
      console.log('📥 Response data:', result)

      if (!response.ok || !result.success) {
        console.error('❌ Order submission failed:', result.error)
        throw new Error(result.error || 'Failed to submit order')
      }

      // Order submitted successfully - double check we have a valid order
      if (!result.data || !result.data.id) {
        console.error('❌ Invalid order response - no order ID')
        throw new Error('Invalid order response from server')
      }
      
      console.log('✅ Order submitted successfully! Order ID:', result.data.id)
      setSubmittedOrder(result.data)
      // Don't clear orderSubmissionInProgress here - let it stay true to prevent validation
      console.log('🗑️ Clearing cart after successful submission...')
      clearCart() // Clear the cart ONLY after successful submission

    } catch (err) {
      console.error('❌ Error during order submission:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit order')
      setOrderSubmissionInProgress(false) // Reset only on error so user can try again
      console.log('Cart should NOT be cleared due to error. Current cart:', cart)
    } finally {
      console.log('🏁 Order submission process finished. isSubmitting set to false.')
      setIsSubmitting(false)
    }
  }

  // If order has been submitted, show confirmation
  if (submittedOrder) {
    return (
      <div className="order-confirmation-page">
        <div className="confirmation-header">
          <div className="success-icon">✅</div>
          <h1>Order Confirmed!</h1>
          <p className="order-number">Order #{submittedOrder.orderNumber}</p>
        </div>

        <div className="confirmation-content">
          <div className="confirmation-card">
            <h3>🎉 Thank you for your order!</h3>
            <p>Your order has been successfully submitted and we've sent you a WhatsApp confirmation.</p>
            
            <div className="order-details">
              <div className="detail-row">
                <span>Customer:</span>
                <span>{submittedOrder.customerName}</span>
              </div>
              <div className="detail-row">
                <span>Phone:</span>
                <span>{submittedOrder.customerPhone}</span>
              </div>
              <div className="detail-row">
                <span>Total:</span>
                <span>${submittedOrder.total.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span>Status:</span>
                <span className="status-badge">{submittedOrder.status}</span>
              </div>
            </div>

            <div className="notification-info">
              <h4>📱 What happens next?</h4>
              <ul>
                <li>You'll receive a WhatsApp confirmation shortly</li>
                <li>The restaurant will start preparing your order</li>
                <li>You'll get updates on your order status via WhatsApp</li>
                <li>Estimated preparation time: 15-25 minutes</li>
              </ul>
            </div>
          </div>

          <div className="confirmation-actions">
            <button 
              className="track-order-btn"
              onClick={() => navigate('/orders')}
            >
              View All Orders
            </button>
            <button 
              className="new-order-btn"
              onClick={() => navigate('/menu')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show order review and confirmation form
  return (
    <div className="order-confirmation-page">
      <div className="confirmation-header">
        <h1>Review Your Order</h1>
        <p>Please review your order details before confirming</p>
      </div>

      <div className="confirmation-content">
        {/* Customer Information */}
        <div className="customer-info-section">
          <h3>📞 Customer Information</h3>
          <div className="info-card">
            <div className="info-row">
              <span>Name:</span>
              <span>{customer?.name}</span>
            </div>
            <div className="info-row">
              <span>Phone:</span>
              <span>{customer?.phoneNumber || customer?.phone}</span>
            </div>
            {(customer?.defaultAddress || customer?.address) && (
              <div className="info-row">
                <span>Address:</span>
                <span>{customer.defaultAddress || customer.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-section">
          <h3>🍽️ Order Items ({cart.items.length})</h3>
          <div className="items-list">
            {cart.items.map((item) => (
              <div key={item.id} className="order-item">
                <div className="item-details">
                  <div className="item-name">{item.itemName}</div>
                  <div className="item-quantity">Qty: {item.quantity}</div>
                  {item.selectedModifiers.length > 0 && (
                    <div className="item-modifiers">
                      {item.selectedModifiers.map((modifier, idx) => (
                        <div key={idx} className="modifier">
                          <span className="modifier-name">{modifier.modifierName}:</span>
                          {modifier.selectedOptions.map((option, optIdx) => (
                            <span key={optIdx} className="modifier-option">
                              {option.optionName}
                              {option.price > 0 && ` (+$${option.price.toFixed(2)})`}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {item.specialNotes && (
                    <div className="item-notes">
                      <span className="notes-label">Notes:</span>
                      {item.specialNotes}
                    </div>
                  )}
                </div>
                <div className="item-price">${item.totalPrice.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary-section">
          <h3>💰 Order Summary</h3>
          <div className="summary-card">
            <div className="summary-line">
              <span>Subtotal:</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Tax (10%):</span>
              <span>${cart.tax.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Tip:</span>
              <span>${cart.tip.toFixed(2)}</span>
            </div>
            <div className="summary-line total">
              <span>Total:</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {/* Confirmation Actions */}
        <div className="confirmation-actions">
          <button 
            className="back-btn"
            onClick={() => navigate('/cart')}
            disabled={isSubmitting}
          >
            ← Back to Cart
          </button>
          <button 
            className="confirm-order-btn"
            onClick={submitOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting Order...' : 'Confirm Order 🚀'}
          </button>
        </div>
      </div>
    </div>
  )
}