
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
      
      <text x="5" y="22" className="restaurante-script">Restaurante da</text>
      
      {/* "M" stylized as a cloche */}
      <path 
        d="M20 60 L20 45 C20 42, 22 40, 25 40 L45 40 C48 40, 50 42, 50 45 L50 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="35" y1="40" x2="35" y2="35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="35" cy="33" r="1.8" fill="currentColor" />

      {/* Sparkle/star element */}
      <path 
        d="M52 38 L54 40 L52 42 L50 40 Z"
        fill="currentColor"
      />
       <line x1="52" y1="36" x2="52" y2="44" stroke="currentColor" strokeWidth="0.8" />
       <line x1="49" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="0.8" />


      <text x="55" y="60" className="mirinha-script">
        <tspan>irinha</tspan>
      </text>
    </svg>
  );
}
