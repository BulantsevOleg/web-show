import React from "react";

export function BrandCardImage({ base, hover, alt }:{ base?: string; hover?: string; alt?: string }){
  const [src, setSrc] = React.useState(base);
  const [hoverLoaded, setHoverLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!hover) return;
    const img = new Image();
    img.onload = () => setHoverLoaded(true);
    img.src = hover;
  }, [hover]);

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-opacity duration-200"
      onMouseEnter={() => hover && setSrc(hover)}
      onMouseLeave={() => setSrc(base)}
    />
  );
}
