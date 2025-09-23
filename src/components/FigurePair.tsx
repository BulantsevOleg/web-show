import React from "react";
import { Figure } from "./Figure";

export function FigurePair({ left, right }: {
  left: { src?: string; alt?: string };
  right: { src?: string; alt?: string };
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      <Figure {...left} className="col-span-1" />
      <Figure {...right} className="col-span-1" />
    </div>
  );
}
