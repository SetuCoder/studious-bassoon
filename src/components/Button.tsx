import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { buttonClass, type ButtonVariant } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

/** WF Button (Primary, Secondary, Text). Full width by default. */
export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClass(variant)} ${variant === 'text' ? '' : 'h-12'} ${className}`} {...props} />
}

/** A link that looks like a Button. */
export function ButtonLink({ to, variant = 'primary', children }: { to: string; variant?: ButtonVariant; children: ReactNode }) {
  return (
    <Link to={to} className={`${buttonClass(variant)} ${variant === 'text' ? '' : 'h-12'}`}>
      {children}
    </Link>
  )
}
