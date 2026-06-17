import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const toasts = useToast()
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-lg border px-4 py-3 shadow-lg text-sm pointer-events-auto',
            t.variant === 'destructive' && 'bg-red-600 text-white border-red-700',
            t.variant === 'success' && 'bg-green-600 text-white border-green-700',
            (!t.variant || t.variant === 'default') && 'bg-white text-gray-900 border-gray-200'
          )}
        >
          <p className="font-medium">{t.title}</p>
          {t.description && <p className="text-xs mt-0.5 opacity-80">{t.description}</p>}
        </div>
      ))}
    </div>
  )
}
