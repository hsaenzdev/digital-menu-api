import React, { useState, useEffect } from 'react'
import type { MenuItem, ModifierGroup, SelectedModifier } from '../types'

interface ModifierSelectionModalProps {
  item: MenuItem
  onClose: () => void
  onAddToCart: (selectedModifiers: SelectedModifier[], specialNotes: string, quantity: number) => void
}

export const ModifierSelectionModal: React.FC<ModifierSelectionModalProps> = ({
  item,
  onClose,
  onAddToCart
}) => {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
  const [specialNotes, setSpecialNotes] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [errors, setErrors] = useState<string[]>([])

  // Initialize selected modifiers
  useEffect(() => {
    const initial: Record<string, string[]> = {}
    item.modifierGroups?.forEach(group => {
      initial[group.id] = []
    })
    setSelectedModifiers(initial)
  }, [item])

  const handleModifierToggle = (groupId: string, modifierId: string, group: ModifierGroup) => {
    setSelectedModifiers(prev => {
      const currentSelections = prev[groupId] || []
      const isSelected = currentSelections.includes(modifierId)

      if (isSelected) {
        // Deselect
        return {
          ...prev,
          [groupId]: currentSelections.filter(id => id !== modifierId)
        }
      } else {
        // Check max selection limit
        if (group.maxSelection && currentSelections.length >= group.maxSelection) {
          if (group.maxSelection === 1) {
            // Replace selection for single-choice groups
            return {
              ...prev,
              [groupId]: [modifierId]
            }
          }
          return prev // Already at max
        }

        // Add selection
        return {
          ...prev,
          [groupId]: [...currentSelections, modifierId]
        }
      }
    })
  }

  const calculateTotalPrice = () => {
    let total = item.price * quantity

    // Add modifier prices
    item.modifierGroups?.forEach(group => {
      const selected = selectedModifiers[group.id] || []
      selected.forEach(modifierId => {
        const modifier = group.modifiers.find(m => m.id === modifierId)
        if (modifier) {
          total += modifier.priceAdjustment * quantity
        }
      })
    })

    return total
  }

  const validateSelections = (): boolean => {
    const newErrors: string[] = []

    item.modifierGroups?.forEach(group => {
      const selected = selectedModifiers[group.id] || []

      // Check required groups
      if (group.isRequired && selected.length < group.minSelection) {
        newErrors.push(`Please select at least ${group.minSelection} option(s) for ${group.name}`)
      }

      // Check min selection
      if (group.minSelection > 0 && selected.length < group.minSelection) {
        newErrors.push(`Please select at least ${group.minSelection} option(s) for ${group.name}`)
      }

      // Check max selection
      if (group.maxSelection && selected.length > group.maxSelection) {
        newErrors.push(`Please select no more than ${group.maxSelection} option(s) for ${group.name}`)
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleAddToCart = () => {
    if (!validateSelections()) {
      return
    }

    // Transform selected modifiers to the format expected by cart
    const transformedModifiers: SelectedModifier[] = item.modifierGroups
      ?.filter(group => selectedModifiers[group.id]?.length > 0)
      .map(group => ({
        modifierId: group.id,
        modifierName: group.name,
        selectedOptions: selectedModifiers[group.id].map(modId => {
          const modifier = group.modifiers.find(m => m.id === modId)!
          return {
            optionId: modifier.id,
            optionName: modifier.name,
            price: modifier.priceAdjustment
          }
        })
      })) || []

    onAddToCart(transformedModifiers, specialNotes, quantity)
    onClose()
  }

  const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {item.description && (
            <p className="item-description">{item.description}</p>
          )}
          
          <div className="base-price">
            Base Price: ${item.price.toFixed(2)}
          </div>

          {errors.length > 0 && (
            <div className="modifier-errors">
              {errors.map((error, index) => (
                <div key={index} className="error-message">⚠️ {error}</div>
              ))}
            </div>
          )}

          {hasModifiers ? (
            <div className="modifier-groups">
              {item.modifierGroups!.map(group => (
                <div key={group.id} className="modifier-group">
                  <div className="group-header">
                    <h3>{group.name}</h3>
                    {group.isRequired && <span className="required-badge">Required</span>}
                  </div>
                  {group.description && (
                    <p className="group-description">{group.description}</p>
                  )}
                  <div className="group-info">
                    {group.maxSelection === 1 ? (
                      <span>Select 1 option</span>
                    ) : (
                      <span>
                        Select {group.minSelection > 0 && `${group.minSelection} to `}
                        {group.maxSelection ? group.maxSelection : 'multiple'} option(s)
                      </span>
                    )}
                  </div>

                  <div className="modifier-options">
                    {group.modifiers.map(modifier => {
                      const isSelected = selectedModifiers[group.id]?.includes(modifier.id)
                      const selectionType = group.maxSelection === 1 ? 'radio' : 'checkbox'

                      return (
                        <label
                          key={modifier.id}
                          className={`modifier-option ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type={selectionType}
                            checked={isSelected}
                            onChange={() => handleModifierToggle(group.id, modifier.id, group)}
                          />
                          <span className="modifier-name">{modifier.name}</span>
                          {modifier.priceAdjustment !== 0 && (
                            <span className="modifier-price">
                              {modifier.priceAdjustment > 0 ? '+' : ''}
                              ${modifier.priceAdjustment.toFixed(2)}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-modifiers">No customization options available for this item.</p>
          )}

          <div className="special-notes">
            <label htmlFor="special-notes">Special Instructions:</label>
            <textarea
              id="special-notes"
              placeholder="Any special requests? (e.g., no onions, extra sauce)"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="quantity-selector">
            <label>Quantity:</label>
            <div className="quantity-controls">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="quantity-display">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Add {quantity} to Cart - ${calculateTotalPrice().toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}
