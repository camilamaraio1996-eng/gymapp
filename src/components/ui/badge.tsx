import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-[var(--primary)] text-black',
        secondary:   'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]',
        destructive: 'bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/25',
        outline:     'border border-[var(--border)] text-[var(--text-muted)]',
        success:     'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25',
        warning:     'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
