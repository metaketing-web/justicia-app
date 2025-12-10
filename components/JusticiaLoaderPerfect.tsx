import React from 'react';

interface JusticiaLoaderPerfectProps {
  size?: 'small' | 'medium' | 'default' | 'large';
  className?: string;
}

const JusticiaLoaderPerfect: React.FC<JusticiaLoaderPerfectProps> = ({ 
  size = 'default',
  className = ''
}) => {
  const sizeMap = {
    small: 60,
    medium: 80,
    default: 100,
    large: 120
  };

  const loaderSize = sizeMap[size];

  return (
    <div 
      className={`justicia-loader-perfect ${className}`}
      style={{
        position: 'relative',
        width: `${loaderSize}px`,
        height: `${loaderSize}px`,
        margin: '0 auto'
      }}
    >
      <div className="loader-element loader-pied" />
      <div className="loader-element loader-bras-gauche" />
      <div className="loader-element loader-bras-droit" />
      <div className="loader-element loader-diamant" />
    </div>
  );
};

export default JusticiaLoaderPerfect;
