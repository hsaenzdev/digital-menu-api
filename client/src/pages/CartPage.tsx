import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../context/CustomerContext'
import { useCart } from '../context/CartContext'
import { useActiveOrders } from '../hooks/useActiveOrders'

export const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const { customer, location } = useCustomer()
  const { cart, updateItem, removeItem, clearCart, updateTip } = useCart()
  const { hasActiveOrders, activeOrders } = useActiveOrders()
  
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-primary text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              className="text-white hover:text-primary-100 font-medium flex items-center gap-2 transition-colors"
              onClick={() => navigate('/menu')}
            >
              ← Back to Menu
            </button>
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">🛒 Your Cart</h1>
              <p className="text-primary-100 text-sm md:text-base">Review your order</p>
            </div>
            {cart.items.length > 0 && (
              <button 
                className="text-white hover:text-red-200 font-medium flex items-center gap-1 transition-colors"
                onClick={handleClearCart}
              >
                🗑️ <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {customer && location && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              👤 {customer.name}
            </span>
            <span className="flex items-center gap-1">
              📍 {location.address}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {cart.items.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-modal p-12 text-center">
            <div className="text-7xl mb-4">🛒</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items from our menu</p>
            <button 
              className="bg-gradient-primary text-white font-bold px-8 py-3 rounded-xl shadow-card hover:shadow-card-hover transform hover:scale-105 transition-all"
              onClick={handleContinueShopping}
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Order Items ({cart.items.length})</h3>
              
              <div className="space-y-4">
                {cart.items.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800">{item.itemName}</h4>
                        <p className="text-gray-600 mb-2">${item.unitPrice.toFixed(2)} each</p>
                        
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="space-y-1 mb-2">
                            {item.selectedModifiers.map((modifier, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium text-gray-700">{modifier.modifierName}: </span>
                                {modifier.selectedOptions.map((option, optionIndex) => (
                                  <span key={optionIndex} className="text-gray-600">
                                    {option.optionName} (+${option.price.toFixed(2)}){optionIndex < modifier.selectedOptions.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {item.specialNotes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm">
                            <span className="font-medium text-yellow-800">📝 Notes: </span>
                            <span className="text-yellow-700">{item.specialNotes}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex md:flex-col items-center md:items-end gap-3">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                          <button 
                            className="w-8 h-8 bg-white rounded-md font-bold text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                          <button 
                            className="w-8 h-8 bg-white rounded-md font-bold text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-xl font-bold text-primary-600">
                          ${item.totalPrice.toFixed(2)}
                        </div>
                        
                        <button 
                          className="text-red-500 hover:text-red-600 text-2xl transition-colors"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip Selection */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Add Tip</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {[10, 15, 18, 20].map(percentage => (
                  <button
                    key={percentage}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      tipPercentage === percentage
                        ? 'bg-gradient-primary text-white shadow-card'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => handleTipChange(percentage)}
                  >
                    {percentage}%
                  </button>
                ))}
                <button
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    showCustomTip
                      ? 'bg-gradient-primary text-white shadow-card'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setShowCustomTip(true)}
                >
                  Custom
                </button>
              </div>
              
              {showCustomTip && (
                <input
                  type="number"
                  placeholder="Enter custom tip amount"
                  value={customTip}
                  onChange={(e) => handleCustomTipChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                  step="0.01"
                  min="0"
                />
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>Tax (10%)</span>
                  <span className="font-medium">${cart.tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>Tip</span>
                  <span className="font-medium">${cart.tip.toFixed(2)}</span>
                </div>
                
                <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-xl font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-primary-600">${cart.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                className="w-full bg-white text-primary-600 border-2 border-primary-600 font-medium py-3 px-6 rounded-xl hover:bg-primary-50 transition-colors"
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </button>
              
              {hasActiveOrders ? (
                <div className="space-y-2">
                  <button 
                    className="w-full bg-gray-300 text-gray-500 font-bold text-lg py-4 px-6 rounded-xl cursor-not-allowed"
                    disabled
                    title="You have active orders. Please wait for them to complete."
                  >
                    🔒 Checkout Unavailable
                  </button>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ You have {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''}.{' '}
                      <button 
                        className="text-primary-600 hover:text-primary-700 font-medium underline"
                        onClick={() => navigate('/orders')}
                      >
                        View Orders
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <button 
                  className="w-full bg-gradient-primary text-white font-bold text-lg py-4 px-6 rounded-xl shadow-card hover:shadow-card-hover transform hover:scale-105 transition-all"
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Checkout →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}