
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
          .restaurante-script {
            font-family: 'Inter', 'sans-serif';
            font-size: 14px;
            font-weight: 500;
            fill: currentColor;
            letter-spacing: 0.5px;
          }
          .mirinha-path {
            fill: currentColor;
            stroke: currentColor;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
           .cloche-path {
            fill: currentColor;
          }
        `}
      </style>
      
      <text x="50" y="22" className="restaurante-script">Restaurante da</text>
      <line x1="48" y1="28" x2="162" y2="28" stroke="currentColor" strokeWidth="1" />

      {/* Cloche (Bandeja) */}
      <g className="cloche-path" transform="translate(1, -2)">
        <path d="M 24 33 C 21 33 18 34 16 36 L 16 36 A 14 14 0 0 1 29 22 A 14 14 0 0 1 42 36 L 42 36 C 40 34 37 33 34 33 L 24 33 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="26.5" y="18" width="5" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
        <line x1="14" y1="37" x2="44" y2="37" stroke="currentColor" strokeWidth="1.5" />
      </g>
      
      {/* "Mirinha" as a path to allow custom "M" */}
      <path
        className="mirinha-path"
        fill="none"
        d="
          M 29.5 65 
          C 29.5 65 25 55 29 40 
          C 29 40 29 38 31 38 
          M 45 65 
          C 45 65 40 50 45 45 
          C 50 40 55 55 60 65
          L 65 45 
          C 70 40 75 50 80 65 
          L 83 55
          C 83 55 85 52 87 55
          L 92 65
          L 95 55
          C 95 55 97 52 99 55
          L 104 65
          M 110 65
          C 110 50 120 50 125 55
          C 130 60 125 68 120 65
          C 115 62 115 55 120 50
          M 100 60 
          C 100 60 101 59 102 60
          M 130 65
          L 135 45
          C 140 40 145 50 150 65
          L 155 55
          C 155 55 157 52 159 55
          L 164 65
          M 170 65
          C 170 50 180 50 185 55
          C 190 60 185 68 180 65
          C 175 62 175 55 180 50
        "
      />
    </svg>
  );
}
