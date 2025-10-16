/**
 * Response Transformers
 * 
 * Utility functions to transform raw database responses into API-friendly formats
 */

/**
 * Parse order data from database format to API format
 * Converts selectedModifiers from JSON string to parsed array
 * 
 * @param order - Raw order object from database
 * @returns Order with parsed selectedModifiers in items
 */
export const parseOrderData = (order: any) => {
  return {
    ...order,
    items: order.items.map((item: any) => ({
      ...item,
      selectedModifiers: item.selectedModifiers 
        ? JSON.parse(item.selectedModifiers) 
        : []
    }))
  }
}
