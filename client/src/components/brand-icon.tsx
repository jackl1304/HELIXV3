import React from 'react';

type BrandIconProps = {
  name: string;
  className?: string;
  title?: string;
  decorative?: boolean;
};

// Load all SVGs from brand icons folder as raw strings
// Note: Add your exported SVGs into /src/assets/brand-icons with names like intelligence.svg, search.svg, etc.
const svgs = import.meta.glob('/src/assets/brand-icons/*.svg', { as: 'raw', eager: true }) as Record<string, string>;

function injectClass(svgRaw: string, className?: string, title?: string): string {
  const cls = className ? ` class=\"${className}\"` : '';
  let withClass = svgRaw.replace('<svg', `<svg${cls}`);
  if (title && !/\<title\>/i.test(withClass)) {
    withClass = withClass.replace('<svg', `<svg><title>${title}</title>`);
  }
  return withClass;
}

export default function BrandIcon({ name, className, title, decorative = true }: BrandIconProps) {
  const key = `/src/assets/brand-icons/${name}.svg`;
  const svg = svgs[key];
  let finalSvg = svg;
  if (!svg) {
    // Verbesserter Placeholder: einzigartiger Buchstabe + dezentes Raster zur Unterscheidung
    const initial = name.charAt(0).toUpperCase();
    finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e40af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-icon="${name}">
      <defs>
        <linearGradient id="grad-${name}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1e40af"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill="url(#grad-${name})" fill-opacity="0.08" />
      <path d="M3 9h18M3 15h18" stroke="#1e40af" stroke-opacity="0.25" />
      <text x="12" y="16" text-anchor="middle" font-size="9" font-family="Inter, Arial" font-weight="600" fill="#1e40af">${initial}</text>
      ${decorative ? '' : `<title>${title || name}</title>`}
    </svg>`;
  }
  const html = injectClass(finalSvg, className, decorative ? undefined : title);
  // eslint-disable-next-line react/no-danger
  return <span aria-hidden={decorative} role={decorative ? undefined : 'img'} dangerouslySetInnerHTML={{ __html: html }} />;
}
