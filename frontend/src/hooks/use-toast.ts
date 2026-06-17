import { useState, useEffect } from 'react'

export type ToastVariant = 'default' | 'destructive' | 'success'

export interface ToastData {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

type Listener = (toasts: ToastData[]) => void

let toasts: ToastData[] = []
const listeners: Listener[] = []
let counter = 0

function notify() {
  listeners.forEach((l) => l([...toasts]))
}

export function toast(data: Omit<ToastData, 'id'>) {
  const id = String(++counter)
  toasts = [...toasts, { ...data, id }]
  notify()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, 4000)
}

export function useToast() {
  const [list, setList] = useState<ToastData[]>([...toasts])
  useEffect(() => {
    listeners.push(setList)
    return () => {
      const idx = listeners.indexOf(setList)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])
  return list
}
