import { useI18n } from '@/context/I18n'
import { cn } from '@/lib/cn'
import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from './select'

const NONE = '__none__' // Radix items can't use "" as a value

/**
 * App-wide dropdown built on the shadcn Select.
 * options: array of strings or {value, label}
 * emptyLabel: adds a first "All / —" item that maps to ''
 * variant: 'input' (bordered, for filters) | 'field' (Odoo underline, for forms)
 */
export function Dropdown({ value, onChange, options = [], placeholder, emptyLabel, variant = 'input', className, contentClassName, disabled }) {
  const { lang } = useI18n()
  const empty = value === '' || value == null
  const current = empty ? (emptyLabel ? NONE : '') : String(value)
  return (
    <Select dir={lang === 'ar' ? 'rtl' : 'ltr'} value={current} disabled={disabled} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
      <SelectTrigger
        className={cn(
          variant === 'field' && 'h-auto rounded-none border-0 border-b bg-transparent px-0.5 py-1.5 hover:border-primary focus:ring-0',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        <SelectGroup>
          {emptyLabel && <SelectItem value={NONE} className="text-muted">{emptyLabel}</SelectItem>}
          {emptyLabel && options.length > 0 && <SelectSeparator />}
          {options.map((o) => {
            const { value: v, label } = typeof o === 'object' ? o : { value: o, label: o }
            return <SelectItem key={String(v)} value={String(v)}>{label}</SelectItem>
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default Dropdown
