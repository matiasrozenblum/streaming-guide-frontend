'use client'
import { useEffect } from 'react'
import Clarity from '@microsoft/clarity'

export function ClarityLoader() {
  useEffect(() => {
    // Reemplaza aquí con tu Clarity Project ID
    Clarity.init('rbxriarjwi')
  }, [])

  return null
}
