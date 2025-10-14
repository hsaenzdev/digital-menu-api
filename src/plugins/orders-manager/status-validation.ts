/**
 * Order status validation and transitions
 * Ensures orders follow the correct workflow
 */

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

/**
 * Valid status transitions
 * Maps current status to allowed next statuses
 */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [], // Terminal state - no further transitions
  cancelled: []  // Terminal state - no further transitions
}

/**
 * Validate if a status transition is allowed
 */
export function isValidTransition(currentStatus: string, newStatus: string): boolean {
  const allowed = STATUS_TRANSITIONS[currentStatus as OrderStatus]
  return allowed ? allowed.includes(newStatus as OrderStatus) : false
}

/**
 * Get the next logical status in the workflow
 */
export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const transitions = STATUS_TRANSITIONS[currentStatus]
  if (transitions.length === 0) return null
  // Return the first non-cancelled option
  return transitions.find(s => s !== 'cancelled') || null
}

/**
 * Check if a status is terminal (no further transitions)
 */
export function isTerminalStatus(status: string): boolean {
  return status === 'delivered' || status === 'cancelled'
}

/**
 * Get all active order statuses (not terminal)
 */
export function getActiveStatuses(): OrderStatus[] {
  return ['pending', 'confirmed', 'preparing', 'ready']
}

/**
 * Get color coding for status badges
 */
export function getStatusColor(status: string): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'yellow',
    confirmed: 'blue',
    preparing: 'purple',
    ready: 'green',
    delivered: 'gray',
    cancelled: 'red'
  }
  return colors[status as OrderStatus] || 'gray'
}

/**
 * Get display label for status
 */
export function getStatusLabel(status: string): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'New Order',
    confirmed: 'Confirmed',
    preparing: 'In Kitchen',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }
  return labels[status as OrderStatus] || status
}
