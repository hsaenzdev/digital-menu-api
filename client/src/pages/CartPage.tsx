import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../context/CustomerContext'
import { useCart } from '../context/CartContext'

export const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const { customer, location } = useCustomer()
  const { cart, updateItem, removeItem, clearCart, updateTip } = useCart()
  
  const [tipPercentage, setTipPercentage] = useState<number>(15)
  const [customTip, setCustomTip] = useState<string>('')
  const [showCustomTip, setShowCustomTip] = useState(false)

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
    } else {
      updateItem(itemId, { quantity: newQuantity })
    }
  }

  const handleTipChange = (percentage: number) => {
    setTipPercentage(percentage)
    setShowCustomTip(false)
    setCustomTip('')
    const tipAmount = (cart.subtotal * percentage) / 100
    updateTip(tipAmount)
  }

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value)
    const tipAmount = parseFloat(value) || 0
    updateTip(tipAmount)
    setTipPercentage(0) // Reset percentage when using custom tip
  }

  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) {
      return
    }
    navigate('/order-confirmation')
  }

  const handleContinueShopping = () => {
    navigate('/menu')
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/menu')}
        >
          ← Back to Menu
        </button>
        <div className="header-info">
          <h1>🛒 Your Cart</h1>
          <p>Review your order</p>
        </div>
        
        {cart.items.length > 0 && (
          <button className="clear-cart-btn" onClick={handleClearCart}>
            🗑️ Clear
          </button>
        )}
      </div>

      {customer && location && (
        <div className="customer-summary">
          <div className="customer-info">
            <span className="customer-name">👤 {customer.name}</span>
            <span className="customer-location">📍 {location.address}</span>
          </div>
        </div>
      )}

      <div className="cart-content">
        {cart.items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some delicious items from our menu</p>
            <button className="continue-shopping-btn" onClick={handleContinueShopping}>
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="cart-items">
              <h3>Order Items ({cart.items.length})</h3>
              
              {cart.items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <h4 className="item-name">{item.itemName}</h4>
                    <p className="item-price">${item.unitPrice.toFixed(2)} each</p>
                    
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="item-modifiers">
                        {item.selectedModifiers.map((modifier, index) => (
                          <div key={index} className="modifier">
                            <span className="modifier-name">{modifier.modifierName}:</span>
                            {modifier.selectedOptions.map((option, optionIndex) => (
                              <span key={optionIndex} className="modifier-option">
                                {option.optionName} (+${option.price.toFixed(2)})
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {item.specialNotes && (
                      <div className="item-notes">
                        <span className="notes-label">📝 Notes:</span>
                        <span className="notes-text">{item.specialNotes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="item-total">
                      ${item.totalPrice.toFixed(2)}
                    </div>
                    
                    <button 
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip Selection */}
            <div className="tip-section">
              <h3>Add Tip</h3>
              <div className="tip-options">
                {[10, 15, 18, 20].map(percentage => (
                  <button
                    key={percentage}
                    className={`tip-btn ${tipPercentage === percentage ? 'active' : ''}`}
                    onClick={() => handleTipChange(percentage)}
                  >
                    {percentage}%
                  </button>
                ))}
                <button
                  className={`tip-btn ${showCustomTip ? 'active' : ''}`}
                  onClick={() => setShowCustomTip(true)}
                >
                  Custom
                </button>
              </div>
              
              {showCustomTip && (
                <div className="custom-tip">
                  <input
                    type="number"
                    placeholder="Enter custom tip amount"
                    value={customTip}
                    onChange={(e) => handleCustomTipChange(e.target.value)}
                    className="custom-tip-input"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-line">
                <span>Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="summary-line">
                <span>Tax (10%)</span>
                <span>${cart.tax.toFixed(2)}</span>
              </div>
              
              <div className="summary-line">
                <span>Tip</span>
                <span>${cart.tip.toFixed(2)}</span>
              </div>
              
              <div className="summary-line total">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="cart-actions">
              <button 
                className="continue-shopping-btn secondary"
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </button>
              
              <button 
                className="checkout-btn"
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}