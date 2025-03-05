
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface DuckProps {
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Duck: React.FC<DuckProps> = ({ 
  animate = true, 
  size = 'md', 
  className
}) => {
  const [isWiggling, setIsWiggling] = useState(false);

  useEffect(() => {
    if (animate) {
      const wiggleInterval = setInterval(() => {
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 2000);
      }, 10000); // Wiggle every 10 seconds
      
      return () => clearInterval(wiggleInterval);
    }
  }, [animate]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div 
      className={cn(
        sizeClasses[size],
        'relative select-none transition-transform duration-300 ease-in-out',
        animate ? 'animate-float' : '',
        isWiggling ? 'animate-wiggle' : '',
        className
      )}
    >
      {/* Duck body */}
      <div className="absolute inset-0 bg-duck-body rounded-full shadow-lg transform -translate-y-1 z-10"></div>
      
      {/* Duck head */}
      <div className="absolute top-0 left-1/4 w-3/4 h-3/4 bg-duck-body rounded-full z-20 shadow-sm"></div>
      
      {/* Duck beak */}
      <div className="absolute top-1/4 right-0 w-1/3 h-1/5 bg-duck-beak rounded-e-full z-30"></div>
      
      {/* Duck eye */}
      <div className="absolute top-1/6 right-1/4 w-1/8 h-1/8 bg-duck-eye rounded-full z-40"></div>
      
      {/* Eye shine */}
      <div className="absolute top-1/6 right-1/4 w-1/16 h-1/16 bg-duck-shine rounded-full z-50 transform translate-x-[2px] translate-y-[-2px]"></div>
    </div>
  );
};

export default Duck;
