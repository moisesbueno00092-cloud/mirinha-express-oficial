
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
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
          .restaurante-script {
            font-family: 'Inter', 'sans-serif';
            font-size: 16px;
            font-weight: 500;
            fill: hsl(var(--foreground));
            text-anchor: middle;
          }
          .mirinha-cursive {
            font-family: 'Dancing Script', cursive;
            font-size: 48px;
            font-weight: 700;
            fill: hsl(var(--primary));
            text-anchor: middle;
          }
          .cloche-icon {
            fill: hsl(var(--primary));
          }
        `}
      </style>
      
      <text x="110" y="22" className="restaurante-script">Restaurante da</text>
      
      {/* Cloche Icon */}
      <g transform="translate(45, 28) scale(0.8)">
        <path className="cloche-icon" d="M20.34,6.83A9.2,9.2,0,0,0,12.5,4.5a9.2,9.2,0,0,0-7.84,2.33,1,1,0,0,0,1.42,1.42A7.2,7.2,0,0,1,12.5,6.5a7.2,7.2,0,0,1,6.42,1.75,1,1,0,0,0,1.42-1.42Z M25,17.5H0a1,1,0,0,0,0,2H25a1,1,0,0,0,0-2Z M14.5,2.5h-4a1.5,1.5,0,0,0,0,3h4a1.5,1.5,0,0,0,0-3Z"/>
        <path className="cloche-icon" d="M23.5,16.5h-22a1,1,0,0,0-1,1v0a1,1,0,0,0,1,1h22a1,1,0,0,0,1-1v0A1,1,0,0,0,23.5,16.5Z" style={{ display: 'none' }}/>
      </g>
      
      <text x="110" y="70" className="mirinha-cursive">Mirinha</text>
      
    </svg>
  );
}
