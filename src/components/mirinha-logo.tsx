
import { cn } from "@/lib/utils";

export default function MirinhaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 70"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("font-headline", className)}
    >
      <style>
        {`
          .mirinha-script {
            font-family: 'Brush Script MT', 'Brush Script Std', 'cursive';
            font-size: 38px;
            fill: currentColor;
          }
          .restaurante-script {
            font-family: 'Inter', 'sans-serif';
            font-size: 14px;
            font-weight: 500;
            fill: currentColor;
            letter-spacing: 0.5px;
          }
        `}
      </style>
      
      <text x="18" y="20" className="restaurante-script">Restaurante da</text>
      <line x1="18" y1="24" x2="135" y2="24" stroke="currentColor" strokeWidth="0.8" />
      
      {/* Cloche Icon */}
      <path
        d="M23,53 C23,49 27,46 32,46 C37,46 41,49 41,53"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="20" y="53" width="24" height="2" fill="currentColor" rx="1" />
      <circle cx="32" cy="44" r="2" fill="currentColor" />

      <text x="45" y="60" className="mirinha-script">
        <tspan>i</tspan>
        <tspan>r</tspan>
        <tspan>i</tspan>
        <tspan>n</tspan>
        <tspan>h</tspan>
        <tspan>a</tspan>
      </text>
    </svg>
  );
}
