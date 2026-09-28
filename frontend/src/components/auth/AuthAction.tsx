import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { FiArrowRight } from 'react-icons/fi';

type AuthActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
};

export default function AuthAction({ children, variant = 'primary', loading = false, className = '', disabled, ...props }: AuthActionProps) {
    return (
        <button disabled={disabled || loading} className={`group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold transition-[background-color,border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transform-none ${variant === 'primary' ? 'bg-[#1F2F98] text-white shadow-[0_12px_28px_rgba(31,47,152,0.18)] hover:bg-[#17257d]' : 'border border-[#cbd6ed] bg-[#ffffff] text-[#26375f] hover:border-[#9eadd1] hover:bg-[#f8faff]'} ${className}`} {...props}>
            {children}
            {variant === 'primary' && !loading && <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#1F2F98] transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true"><FiArrowRight className="h-4 w-4" /></span>}
        </button>
    );
}
