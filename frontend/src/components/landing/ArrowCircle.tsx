import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

type ArrowCircleProps = {
    tone?: 'blue' | 'white' | 'text';
    direction?: 'left' | 'right';
    className?: string;
};

export default function ArrowCircle({ tone = 'blue', direction = 'right', className = '' }: ArrowCircleProps) {
    const Icon = direction === 'left' ? FiArrowLeft : FiArrowRight;
    const tones = {
        blue: 'bg-white text-[#1F2F98]',
        white: 'bg-[#1F2F98] text-white',
        text: 'border border-current text-current',
    };

    return (
        <span aria-hidden="true" className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-1 group-focus-visible:scale-110 motion-reduce:transform-none motion-reduce:transition-none ${tones[tone]} ${className}`}>
            <Icon className="h-4 w-4" />
        </span>
    );
}
