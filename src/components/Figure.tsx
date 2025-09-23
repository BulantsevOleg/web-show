import React from "react";

export function Figure({ src, alt, caption, className = "" }: {
  src?: string; alt?: string; caption?: string; className?: string;
}) {
  return (
    <figure className={className}>
      {src ? <img src={src} alt={alt} className="w-full h-auto object-cover" /> : null}
      {caption && <figcaption className="mt-2 text-[11px] md:text-xs opacity-60">{caption}</figcaption>}
    </figure>
  );
}
