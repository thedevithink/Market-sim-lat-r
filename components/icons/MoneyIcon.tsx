
import React from 'react';

const MoneyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="8" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="12" x2="12" y1="18" y2="22" />
    <line x1="12" x2="12" y1="2" y2="6" />
    <path d="M16 8c-2 0-3.5 1.5-3.5 3.5S14 15 16 15" />
    <path d="M8 16c2 0 3.5-1.5 3.5-3.5S10 9 8 9" />
  </svg>
);

export default MoneyIcon;
