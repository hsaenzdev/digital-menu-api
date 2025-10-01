import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Cart, CartItem } from '../types'

interface CartContextType {
  cart: Cart
  addItem: (item: CartItem) => void
  updateItem: (itemId: string, updates: Partial<CartItem>) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  getItemCount: () => number
  updateTip: (tipAmount: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

const TAX_RATE = 0.1 // 10% tax rate

// Helper function to calculate totals
const calculateTotals = (items: CartItem[], tip: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax + tip
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2))
  }
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('digital-menu-cart')
    if (saved) {
      const parsedCart = JSON.parse(saved)
      // Recalculate totals to ensure they're correct
      const totals = calculateTotals(parsedCart.items || [], parsedCart.tip || 0)
      return {
        ...parsedCart,
        ...totals
      }
    }
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
    }
  })

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('digital-menu-cart', JSON.stringify(cart))
  }, [cart])

  // Calculate totals whenever items or tip change
  useEffect(() => {
    const totals = calculateTotals(cart.items, cart.tip)
    
    // Only update if totals are different to avoid infinite loops
    if (cart.subtotal !== totals.subtotal || cart.tax !== totals.tax || cart.total !== totals.total) {
      setCart(prev => ({
        ...prev,
        ...totals
      }))
    }
  }, [cart.items, cart.tip, cart.subtotal, cart.tax, cart.total])

  const addItem = (item: CartItem) => {
    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(
        existing => 
          existing.itemId === item.itemId && 
          JSON.stringify(existing.selectedModifiers) === JSON.stringify(item.selectedModifiers)
      )

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...prev.items]
        const existingItem = updatedItems[existingItemIndex]
        const newQuantity = existingItem.quantity + item.quantity
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: Number((existingItem.unitPrice * newQuantity).toFixed(2))
        }
        return { ...prev, items: updatedItems }
      } else {
        // Add new item
        return { ...prev, items: [...prev.items, item] }
      }
    })
  }

  const updateItem = (itemId: string, updates: Partial<CartItem>) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { 
              ...item, 
              ...updates,
              totalPrice: updates.quantity 
                ? Number((item.unitPrice * updates.quantity).toFixed(2))
                : item.totalPrice
            }
          : item
      ),
    }))
  }

  const removeItem = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }))
  }

  const clearCart = () => {
    const clearedCart = {
      items: [],
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
    }
    setCart(clearedCart)
    localStorage.removeItem('digital-menu-cart')
  }

  const getItemCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0)
  }

  const updateTip = (tipAmount: number) => {
    setCart(prev => ({ ...prev, tip: Number(tipAmount.toFixed(2)) }))
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        getItemCount,
        updateTip,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}