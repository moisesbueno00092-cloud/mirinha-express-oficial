
import { cn } from "@/lib/utils";

export default function MirinhaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 80"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("font-headline", className)}
    >
      <style>
        {`
          .restaurante-script {
            font-family: 'Inter', 'sans-serif';
            font-size: 16px;
            font-weight: 500;
            fill: currentColor;
            letter-spacing: 0.5px;
            text-anchor: middle;
          }
          .mirinha-path {
            stroke-width: 5;
            stroke: currentColor;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .cloche-path {
            stroke-width: 1.5;
            stroke: currentColor;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .cloche-dome {
            fill: currentColor;
          }
          .i-dot {
            fill: currentColor;
          }
        `}
      </style>
      
      <text x="110" y="22" className="restaurante-script">Restaurante da</text>
      <line x1="55" y1="28" x2="165" y2="28" stroke="currentColor" strokeWidth="1.5" />

      {/* Cloche */}
      <g transform="translate(18 42)">
        <path className="cloche-dome" d="M12.5,0 C19.9,0 25,5.8 25,12 L0,12 C0,5.8 5.1,0 12.5,0 Z" />
        <rect x="10" y="-3" width="5" height="2" rx="1" className="cloche-dome"/>
        <line x1="-2" y1="12" x2="27" y2="12" stroke="currentColor" strokeWidth="1.5" />
      </g>

      {/* Mirinha */}
      <g transform="translate(20, 40)">
        <path className="mirinha-path" d="
          M 25 15 
          C 30 25, 40 35, 45 35 
          S 50 30, 55 25 
          L 60 15 
          C 65 25, 70 35, 75 35 
          S 80 30, 85 25
        "/>
        <path className="mirinha-path" d="
          M 83 26
          C 85 23, 88 20, 92 20
          S 100 22, 102 25
          L 105 30
          C 110 20, 120 20, 125 30
          L 130 35
          C 135 25, 145 25, 150 35
          L 155 35
          C 160 30, 165 25, 170 30
          C 175 35, 178 35, 180 35
        "/>
        
        {/* Dots for the 'i's */}
        <circle className="i-dot" cx="60" cy="10" r="4" />
        <circle className="i-dot" cx="97" cy="13" r="4" />
      </g>
      
    </svg>
  );
}

