import React from "react";

export function Prose({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`text-[15px] md:text-base leading-relaxed [&>p]:whitespace-pre-line ${className}`}>
      {children}
    </div>
  );
}
