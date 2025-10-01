import { useState, useEffect, useCallback } from 'react'
import { useCustomer } from '../context/CustomerContext'
import type { Order, ApiResponse } from '../types'

interface UseActiveOrdersResult {
  hasActiveOrders: boolean
  activeOrders: Order[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useActiveOrders = (): UseActiveOrdersResult => {
  const { customer } = useCustomer()
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!customer?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${customer.id}/orders`)
      const data: ApiResponse<Order[]> = await response.json()

      if (data.success && data.data) {
        // Filter for active orders (pending, confirmed, preparing, ready)
        const active = data.data.filter(order => 
          ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
        )
        setActiveOrders(active)
      } else {
        setError(data.error || 'Failed to load orders')
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to check active orders')
    } finally {
      setLoading(false)
    }
  }, [customer?.id])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    hasActiveOrders: activeOrders.length > 0,
    activeOrders,
    loading,
    error,
    refetch: fetchOrders
  }
}
