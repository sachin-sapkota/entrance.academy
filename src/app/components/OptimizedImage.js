'use client';

import Image from 'next/image';
import { useState } from 'react';

// SEO-optimized image component with proper alt text and responsive handling
export default function OptimizedImage({ 
  src, 
  alt, 
  title, 
  width, 
  height, 
  priority = false,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate SEO-friendly file name
  const generateSEOFilename = (originalSrc, altText) => {
    if (!altText) return originalSrc;
    
    // Convert alt text to SEO-friendly filename
    const seoName = altText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50); // Limit length
    
    const extension = originalSrc.split('.').pop();
    return `${seoName}.${extension}`;
  };

  // Alt text best practices
  const optimizedAlt = alt || 'Entrance Academy educational content';
  
  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={optimizedAlt}
        title={title || optimizedAlt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        quality={85} // Optimal quality for web
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." // Generate actual blur data
        onLoadingComplete={() => setIsLoading(false)}
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        `}
      />
    </div>
  );
}

// Image SEO Guidelines
export const imageOptimizationGuidelines = {
  naming: {
    good: [
      "mecee-bl-exam-pattern-2025.jpg",
      "nepal-medical-entrance-syllabus.png",
      "physics-mcq-practice-questions.webp"
    ],
    bad: [
      "IMG_12345.jpg",
      "screenshot-2024-01-15.png",
      "image1.jpg"
    ]
  },
  
  altText: {
    good: [
      "MECEE-BL exam pattern showing 200 MCQs distribution across subjects",
      "Student practicing physics MCQs on Entrance Academy platform",
      "Nepal medical entrance exam syllabus breakdown chart"
    ],
    bad: [
      "Image",
      "Click here",
      "Picture of exam"
    ]
  },
  
  formats: {
    recommended: ["webp", "avif"], // Modern formats
    fallback: ["jpg", "png"], // Fallback formats
    avoid: ["bmp", "tiff"] // Heavy formats
  },
  
  sizes: {
    thumbnail: { width: 150, height: 150 },
    card: { width: 400, height: 300 },
    hero: { width: 1200, height: 600 },
    blog: { width: 800, height: 450 }
  }
};

// Responsive image configuration
export const responsiveImageConfig = {
  // For hero images
  hero: {
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px",
    priority: true
  },
  
  // For content images
  content: {
    sizes: "(max-width: 640px) 100vw, (max-width: 768px) 90vw, 720px",
    priority: false
  },
  
  // For thumbnail/card images
  thumbnail: {
    sizes: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px",
    priority: false
  }
}; 