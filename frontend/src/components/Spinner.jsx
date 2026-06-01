import React from 'react';

export default function Spinner({ fullScreen, size = 32 }) {
  const spinner = (
    <div style={{
      width: size, height: size,
      border: `3px solid rgba(110,231,183,0.15)`,
      borderTop: `3px solid #6ee7b7`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#0a0e1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
