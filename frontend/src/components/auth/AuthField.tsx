import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: ReactNode;
    icon?: ReactNode;
    trailing?: ReactNode;
    error?: string;
    largeLabel?: boolean;
};

const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
    { label, icon, trailing, error, largeLabel = false, id, className = '', ...props },
    ref,
) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div className="w-full">
            <label htmlFor={inputId} className={largeLabel ? 'mb-6 block text-[clamp(1.9rem,3vw,2.8rem)] font-semibold leading-[1.16] tracking-[-0.05em] text-[#172853]' : 'mb-2.5 block text-sm font-semibold text-[#344463]'}>{label}</label>
            <div className={`flex min-h-14 items-center gap-3 rounded-2xl border bg-[#ffffff] px-4 shadow-[0_8px_25px_rgba(24,43,94,0.04)] transition-[border-color,box-shadow] duration-200 focus-within:border-[#1F2F98] focus-within:shadow-[0_0_0_4px_rgba(87,107,214,0.12)] ${error ? 'border-[#b64848]' : 'border-[#cbd6ed] hover:border-[#9eadd1]'}`}>
                {icon && <span className="shrink-0 text-lg text-[#7a8cad]" aria-hidden="true">{icon}</span>}
                <input ref={ref} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={error ? `${inputId}-error` : undefined} className={`min-w-0 flex-1 bg-transparent py-3.5 text-base text-[#172853] outline-none placeholder:text-[#96a3bc] ${className}`} {...props} />
                {trailing}
            </div>
            {error && <p id={`${inputId}-error`} className="mt-2 text-sm text-[#a32626]" role="alert">{error}</p>}
        </div>
    );
});

export default AuthField;
