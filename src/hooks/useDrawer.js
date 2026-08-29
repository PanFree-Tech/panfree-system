'use client'

import { useState, useCallback } from 'react'

export function useDrawer() {
  const [isOpen, setIsOpen] = useState(false)

  const openDrawer = useCallback(() => setIsOpen(true), [])
  const closeDrawer = useCallback(() => setIsOpen(false), [])
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), [])

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  }
}