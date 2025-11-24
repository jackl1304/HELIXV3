import React from 'react';
import { Building2 } from "@/components/icons";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'compact' | 'icon-only';
}

export function Logo({ className = '', showText = true, variant = 'default' }: LogoProps) {
  const logoImage = '/helix-logo.jpg';

  if (variant === 'icon-only') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-[#1a365d] via-[#2d3748] to-[#1a202c] rounded-xl flex items-center justify-center shadow-lg">
          <img
            src={logoImage}
            alt="HELIX"
            className="w-6 h-6 object-contain filter brightness-110 contrast-110"
            onError={(e) => {
              console.warn('[LOGO] Image failed to load, using fallback SVG');
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 100 100"><g><path d="M50,10 Q80,30 50,50 Q20,30 50,10 Z" fill="white"/><path d="M50,50 Q80,70 50,90 Q20,70 50,50 Z" fill="white"/><rect x="45" y="25" width="10" height="5" fill="#1a365d"/><rect x="45" y="35" width="10" height="5" fill="#1a365d"/><rect x="45" y="60" width="10" height="5" fill="#1a365d"/><rect x="45" y="70" width="10" height="5" fill="#1a365d"/></g></svg>';
              }
            }}
            onLoad={() => console.log('[LOGO] Image loaded successfully')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Professional Deltaways Logo Container */}
      <div className="relative group">
        <div className="w-12 h-12 bg-gradient-to-br from-[#1a365d] via-[#2d3748] to-[#1a202c] rounded-2xl flex items-center justify-center shadow-2xl border border-slate-200/10 group-hover:shadow-3xl transition-all duration-300">
          <img
            src={logoImage}
            alt="HELIX by DELTAWAYS"
            className="w-10 h-10 object-contain filter brightness-110 contrast-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 100 100"><g><path d="M50,10 Q80,30 50,50 Q20,30 50,10 Z" fill="white"/><path d="M50,50 Q80,70 50,90 Q20,70 50,50 Z" fill="white"/><rect x="45" y="25" width="10" height="5" fill="#1a365d"/><rect x="45" y="35" width="10" height="5" fill="#1a365d"/><rect x="45" y="60" width="10" height="5" fill="#1a365d"/><rect x="45" y="70" width="10" height="5" fill="#1a365d"/></g></svg>';
              }
            }}
          />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
      </div>

      {showText && variant !== 'compact' && (
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-gradient-to-r from-[#1a365d] via-slate-700 to-[#2d3748] bg-clip-text text-transparent">
            HELIX
          </span>
          <span className="text-xs text-muted-foreground font-semibold tracking-wider uppercase">
            by DELTAWAYS
          </span>
        </div>
      )}

      {showText && variant === 'compact' && (
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-[#1a365d] to-slate-700 bg-clip-text text-transparent">
            HELIX
          </span>
          <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
            DELTAWAYS
          </span>
        </div>
      )}
    </div>
  );
}

export default Logo;