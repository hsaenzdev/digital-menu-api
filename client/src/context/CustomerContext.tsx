import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Customer, LocationData } from '../types'

interface CustomerContextType {
  customer: Customer | null
  location: LocationData | null
  setCustomer: (customer: Customer) => void
  setLocation: (location: LocationData) => void
  clearCustomer: () => void
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

interface CustomerProviderProps {
  children: ReactNode
}

export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const [customer, setCustomerState] = useState<Customer | null>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('digital-menu-customer')
    return saved ? JSON.parse(saved) : null
  })
  
  const [location, setLocationState] = useState<LocationData | null>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('digital-menu-location')
    return saved ? JSON.parse(saved) : null
  })

  // Save to localStorage whenever customer changes
  useEffect(() => {
    if (customer) {
      localStorage.setItem('digital-menu-customer', JSON.stringify(customer))
    } else {
      localStorage.removeItem('digital-menu-customer')
    }
  }, [customer])

  // Save to localStorage whenever location changes
  useEffect(() => {
    if (location) {
      localStorage.setItem('digital-menu-location', JSON.stringify(location))
    } else {
      localStorage.removeItem('digital-menu-location')
    }
  }, [location])

  const setCustomer = (customer: Customer) => {
    setCustomerState(customer)
  }

  const setLocation = (location: LocationData) => {
    setLocationState(location)
  }

  const clearCustomer = () => {
    setCustomerState(null)
    setLocationState(null)
    localStorage.removeItem('digital-menu-customer')
    localStorage.removeItem('digital-menu-location')
  }

  return (
    <CustomerContext.Provider
      value={{
        customer,
        location,
        setCustomer,
        setLocation,
        clearCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}