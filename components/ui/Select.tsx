'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string
  dense?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', wrapperClassName = '', dense = false, children, ...props },
  ref
) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        ref={ref}
        {...props}
        className={`${className} appearance-none ${dense ? 'pr-6' : 'pr-9'}`}
      >
        {children}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-400 ${
          dense ? 'right-1.5 h-3.5 w-3.5' : 'right-3 h-4 w-4'
        }`}
      />
    </div>
  )
})
