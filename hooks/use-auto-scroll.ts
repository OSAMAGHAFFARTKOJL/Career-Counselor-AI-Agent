"use client";

import { useEffect, useRef } from 'react';

export function useAutoScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  return ref;
}
