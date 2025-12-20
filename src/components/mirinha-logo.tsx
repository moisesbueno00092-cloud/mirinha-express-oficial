
import { cn } from "@/lib/utils";

export default function MirinhaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 50"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-labelledby="logo-title"
    >
      <title id="logo-title">Restaurante da Mirinha</title>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
          .restaurante-text {
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            fill: hsl(var(--foreground));
            text-anchor: middle;
          }
          .mirinha-text {
            font-family: 'Dancing Script', cursive;
            font-size: 38px;
            font-weight: 700;
            fill: hsl(var(--primary));
            text-anchor: middle;
          }
        `}
      </style>
      
      <text x="110" y="15" className="restaurante-text">Restaurante da</text>
      <text x="110" y="45" className="mirinha-text">Mirinha</text>
      
    </svg>
  );
}
