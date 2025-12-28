"use client";

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Content({ children }: ContentProps) {
  return <article>{children}</article>;
}
