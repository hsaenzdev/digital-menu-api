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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-primary text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button 
              className="text-white hover:text-primary-100 font-medium flex items-center gap-2 transition-colors"
              onClick={() => navigate('/customer-info')}
            >
              ← Back
            </button>
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">🍽️ Our Menu</h1>
              <p className="text-primary-100 text-sm md:text-base">Choose your favorite dishes</p>
            </div>
            {getItemCount() > 0 && (
              <button 
                className="bg-white text-primary-600 font-bold px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-2"
                onClick={goToCart}
              >
                🛒 <span className="hidden sm:inline">Cart</span> ({getItemCount()})
              </button>
            )}
          </div>

          {/* Customer Summary */}
          {(customer || location) && (
            <div className="flex flex-wrap gap-2 text-sm text-primary-100">
              {customer && (
                <span className="flex items-center gap-1">
                  👤 {customer.name}
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1">
                  📍 {location.address}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Orders Warning Banner */}
      {hasActiveOrders && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-bold text-yellow-800 mb-1">
                Active Order{activeOrders.length > 1 ? 's' : ''} in Progress
              </h4>
              <p className="text-yellow-700 text-sm">
                You have {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''}. Browse the menu, but wait for current orders to complete before placing a new one.
              </p>
            </div>
            <button 
              className="bg-yellow-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm whitespace-nowrap"
              onClick={() => navigate('/orders')}
            >
              View Orders
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-lg flex items-center gap-2 text-red-700">
          <span className="text-2xl">❌</span>
          <span>{error}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category.id}
              className={`px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === category.id 
                  ? 'bg-gradient-primary text-white shadow-card' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Selected Category Info */}
        {selectedCategory && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 text-gray-700">
            {categories.find(c => c.id === selectedCategory)?.description}
          </div>
        )}

        {/* Menu Items */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-3">{item.description}</p>
                    
                    {item.allergens && Array.isArray(item.allergens) && item.allergens.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3 text-sm">
                        <span className="text-orange-600 font-medium">⚠️ Contains: </span>
                        <span className="text-orange-800">{item.allergens.join(', ')}</span>
                      </div>
                    )}
                    
                    <div className="text-2xl font-bold text-primary-600">${item.price.toFixed(2)}</div>
                  </div>
                  
                  <div className="flex md:flex-col items-center gap-2">
                    {item.isAvailable ? (
                      <button 
                        className="w-full md:w-auto bg-gradient-primary text-white font-bold px-6 py-3 rounded-xl shadow-card hover:shadow-card-hover transform hover:scale-105 transition-all whitespace-nowrap"
                        onClick={() => handleAddToCart(item)}
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button 
                        className="w-full md:w-auto bg-gray-300 text-gray-500 font-medium px-6 py-3 rounded-xl cursor-not-allowed"
                        disabled
                      >
                        Not Available
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {items.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-7xl mb-4">🍽️</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No items in this category</h3>
                <p className="text-gray-600">Please select another category</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Cart Footer */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20">
          <div className="max-w-7xl mx-auto">
            <button 
              className="w-full bg-gradient-primary text-white font-bold text-lg py-4 rounded-xl shadow-card hover:shadow-card-hover transform hover:scale-105 transition-all"
              onClick={goToCart}
            >
              View Cart ({getItemCount()} items) →
            </button>
          </div>
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