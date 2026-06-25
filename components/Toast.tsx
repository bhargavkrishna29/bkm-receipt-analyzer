'use client';

import { useEffect, useRef } from 'react';

interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div className="toast" id="toast">
      <span>{message}</span>
    </div>
  );
}
