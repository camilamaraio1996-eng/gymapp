'use client'

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] shadow-lg rounded-xl',
          description: 'text-[var(--muted-foreground)]',
          actionButton: 'bg-[var(--primary)] text-[var(--primary-foreground)]',
          cancelButton: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
          success: 'border-green-600/30',
          error: 'border-red-600/30',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
