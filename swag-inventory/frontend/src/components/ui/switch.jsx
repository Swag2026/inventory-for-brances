/* shadcn/ui Switch (Radix) — ported to JSX, Odoo colours, RTL-aware */
import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/cn'

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(113,75,103,.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
      'disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-line2',
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
        'data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5',
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

/** Switch with a clickable label + optional hint, used for on/off settings */
function SwitchField({ checked, onCheckedChange, label, hint, disabled, className }) {
  const id = React.useId()
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <label htmlFor={id} className={cn('min-w-0 cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

export { Switch, SwitchField }
