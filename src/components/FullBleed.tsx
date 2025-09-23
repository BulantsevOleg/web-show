import React from "react";

export function FullBleed({ children, className = "" }:{ children: React.ReactNode; className?: string }){
  return (
    <div className={`relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen ${className}`}>
      {children}
    </div>
  );
}
