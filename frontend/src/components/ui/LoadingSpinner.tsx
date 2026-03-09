import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text }) => {
  return (
    <div className="loading-spinner" role="status" aria-live="polite" aria-label={text ?? '加载中'}>
      <div className="loading-spinner__dots">
        <span className="loading-spinner__dot loading-spinner__dot--1" aria-hidden="true" />
        <span className="loading-spinner__dot loading-spinner__dot--2" aria-hidden="true" />
        <span className="loading-spinner__dot loading-spinner__dot--3" aria-hidden="true" />
      </div>
      {text && (
        <p className="loading-spinner__text">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
