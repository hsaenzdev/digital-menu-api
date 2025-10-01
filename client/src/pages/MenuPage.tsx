import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomer } from '../context/CustomerContext'
import { useCart } from '../context/CartContext'
import { useActiveOrders } from '../hooks/useActiveOrders'
import { ModifierSelectionModal } from '../components/ModifierSelectionModal'
import type { MenuCategory, MenuItem, CartItem, ApiResponse, SelectedModifier } from '../types'

export const MenuPage: React.FC = () => {
  const navigate = useNavigate()
  const { customer, location } = useCustomer()
  const { addItem, getItemCount } = useCart()
  const { hasActiveOrders, activeOrders } = useActiveOrders()
  
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showModifierModal, setShowModifierModal] = useState(false)

  // Redirect if no customer info (temporarily disabled for testing)
  useEffect(() => {
    // if (!customer || !location) {
    //   navigate('/customer-info')
    // }
  }, [customer, location, navigate])

  // Fetch categories on load
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch items when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryItems(selectedCategory)
    }
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories')
      const data: ApiResponse<MenuCategory[]> = await response.json()
      
      console.log('Categories response:', data) // Debug log
      
      if (data.success && data.data) {
        setCategories(data.data)
        // Auto-select first category
        if (data.data.length > 0) {
          setSelectedCategory(data.data[0].id)
        }
      } else {
        setError('Failed to load menu categories')
      }
    } catch {
      setError('Network error loading categories')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryItems = async (categoryId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/menu/categories/${categoryId}/items`)
      const data: ApiResponse<MenuItem[]> = await response.json()
      
      console.log('Items response:', data) // Debug log
      
      if (data.success && data.data) {
        // Process the items to parse allergens JSON string
        const processedItems = data.data.map(item => ({
          ...item,
          allergens: typeof item.allergens === 'string' ? JSON.parse(item.allergens) : (item.allergens || [])
        }))
        setItems(processedItems as MenuItem[])
      } else {
        setError('Failed to load menu items')
      }
    } catch {
      setError('Network error loading items')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item: MenuItem) => {
    // Check if item has modifiers
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      // Show modifier selection modal
      setSelectedItem(item)
      setShowModifierModal(true)
    } else {
      // Add directly to cart without modifiers
      const cartItem: CartItem = {
        id: `${item.id}-${Date.now()}`, // Unique ID for cart item
        itemId: item.id,
        itemName: item.name,
        itemPrice: item.price,
        quantity: 1,
        unitPrice: item.price,
        totalPrice: item.price,
        selectedModifiers: []
      }
      
      addItem(cartItem)
    }
  }

  const handleModifierAddToCart = (selectedModifiers: SelectedModifier[], specialNotes: string, quantity: number) => {
    if (!selectedItem) return
    
    // Calculate total price with modifiers
    const modifiersTotal = selectedModifiers.reduce((sum, mod) => {
      const modGroupTotal = mod.selectedOptions.reduce((optSum, opt) => optSum + opt.price, 0)
      return sum + modGroupTotal
    }, 0)
    const unitPrice = selectedItem.price + modifiersTotal
    const totalPrice = unitPrice * quantity
    
    const cartItem: CartItem = {
      id: `${selectedItem.id}-${Date.now()}`, // Unique ID for cart item
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemPrice: selectedItem.price,
      quantity,
      unitPrice,
      totalPrice,
      selectedModifiers,
      specialNotes: specialNotes || undefined
    }
    
    addItem(cartItem)
    setShowModifierModal(false)
    setSelectedItem(null)
  }

  const handleModifierCancel = () => {
    setShowModifierModal(false)
    setSelectedItem(null)
  }

  const goToCart = () => {
    navigate('/cart')
  }

  if (!customer || !location) {
    // return <div>Redirecting...</div>
    // Temporarily allow access for testing
  }

  return (
    <div className="menu-page">
      <div className="menu-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/customer-info')}
        >
          ← Back
        </button>
        <div className="header-info">
          <h1>🍽️ Our Menu</h1>
          <p>Choose your favorite dishes</p>
        </div>
        
        {getItemCount() > 0 && (
          <button className="cart-btn" onClick={goToCart}>
            🛒 Cart ({getItemCount()})
          </button>
        )}
      </div>

      <div className="customer-summary">
        <div className="customer-info">
          {customer && <span className="customer-name">👤 {customer.name}</span>}
          {location && <span className="customer-location">📍 {location.address}</span>}
        </div>
      </div>

      {/* Active Orders Warning Banner */}
      {hasActiveOrders && (
        <div className="active-orders-banner">
          <div className="banner-content">
            <div className="banner-icon">⚠️</div>
            <div className="banner-text">
              <h4>Active Order{activeOrders.length > 1 ? 's' : ''} in Progress</h4>
              <p>You have {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''}. Browse the menu, but wait for current orders to complete before placing a new one.</p>
            </div>
            <button 
              className="view-orders-btn"
              onClick={() => navigate('/orders')}
            >
              View Orders
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      <div className="menu-content">
        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Selected Category Info */}
        {selectedCategory && (
          <div className="category-info">
            {categories.find(c => c.id === selectedCategory)?.description}
          </div>
        )}

        {/* Menu Items */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading menu items...</p>
          </div>
        ) : (
          <div className="menu-items">
            {items.map(item => (
              <div key={item.id} className="menu-item">
                <div className="item-info">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-description">{item.description}</p>
                  
                  {item.allergens && Array.isArray(item.allergens) && item.allergens.length > 0 && (
                    <div className="item-allergens">
                      <span className="allergens-label">⚠️ Contains:</span>
                      <span className="allergens-list">{item.allergens.join(', ')}</span>
                    </div>
                  )}
                  
                  <div className="item-price">${item.price.toFixed(2)}</div>
                </div>
                
                <div className="item-actions">
                  {item.isAvailable ? (
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(item)}
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <button className="unavailable-btn" disabled>
                      Not Available
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {items.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🍽️</div>
                <h3>No items in this category</h3>
                <p>Please select another category</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Cart Footer */}
      {getItemCount() > 0 && (
        <div className="cart-footer">
          <button className="view-cart-btn" onClick={goToCart}>
            View Cart ({getItemCount()} items) →
          </button>
        </div>
      )}

      {/* Modifier Selection Modal */}
      {showModifierModal && selectedItem && (
        <ModifierSelectionModal
          item={selectedItem}
          onClose={handleModifierCancel}
          onAddToCart={handleModifierAddToCart}
        />
      )}
    </div>
  )
}