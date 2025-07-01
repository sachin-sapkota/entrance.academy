'use client';
import { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';

// Dynamically import react-katex to avoid SSR issues
let InlineMath, BlockMath;

export default function LatexRenderer({ children, block = false, className = '' }) {
  const [isClient, setIsClient] = useState(false);
  const [katexComponents, setKatexComponents] = useState(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamic import to avoid SSR issues
    import('react-katex').then((katex) => {
      setKatexComponents({
        InlineMath: katex.InlineMath,
        BlockMath: katex.BlockMath
      });
    });
  }, []);

  if (!isClient || !katexComponents) {
    // Return raw text while loading
    return <span className={className}>{children}</span>;
  }

  try {
    const { InlineMath, BlockMath } = katexComponents;
    
    if (block) {
      return (
        <div className={`my-4 text-center ${className}`}>
          <BlockMath math={children} />
        </div>
      );
    } else {
      return (
        <span className={className}>
          <InlineMath math={children} />
        </span>
      );
    }
  } catch (error) {
    console.error('LaTeX rendering error:', error);
    // Fallback to raw text if LaTeX fails
    return <span className={`text-red-500 ${className}`} title="LaTeX Error">{children}</span>;
  }
}

// Component to process text with LaTeX expressions
export function ProcessLatexText({ text, className = '' }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <span className={className}>{text}</span>;
  }

  if (!text) return null;

  // Split text by LaTeX delimiters
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Block math
          const math = part.slice(2, -2);
          return <LatexRenderer key={index} block>{math}</LatexRenderer>;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math
          const math = part.slice(1, -1);
          return <LatexRenderer key={index}>{math}</LatexRenderer>;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
} 