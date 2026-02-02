import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
}) => {
    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-4 sm:p-6',
        lg: 'p-6 sm:p-8',
    };

    return (
        <div
            className={`bg-white rounded-xl shadow-sm border border-gray-100 ${paddingStyles[padding]} ${className}`}
        >
            {children}
        </div>
    );
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    );
};

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
    return (
        <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
            {children}
        </h3>
    );
};

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
    return (
        <div className={className}>
            {children}
        </div>
    );
};

export { Card, CardHeader, CardTitle, CardContent };
export default Card;
