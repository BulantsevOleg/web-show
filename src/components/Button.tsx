import React from "react";

type Props = React.PropsWithChildren<{
  onClick?: () => void;
  href?: string;
  target?: string;
  className?: string;
}>;

export function Button({ children, onClick, href, target, className = "" }: Props) {
  const base =
    "px-4 py-2 border border-black rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm md:text-base";
  if (href) return (
    <a href={href} target={target} className={`${base} ${className}`}>{children}</a>
  );
  return (
    <button onClick={onClick} className={`${base} ${className}`}>{children}</button>
  );
}
