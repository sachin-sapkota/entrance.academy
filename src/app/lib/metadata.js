// Enhanced Metadata Configuration for Next.js 14+

export function generatePageMetadata({
  title,
  description,
  keywords,
  path,
  image,
  type = 'website',
  locale = 'en_US',
  publishedTime,
  modifiedTime,
  author,
  section
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrance.academy';
  const fullUrl = `${baseUrl}${path}`;
  
  // Default image if none provided
  const ogImage = image || `${baseUrl}/og-default.jpg`;
  
  return {
    // Basic metadata
    title: {
      default: title,
      template: '%s | Entrance Academy Nepal'
    },
    description,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
    
    // Canonical URL
    alternates: {
      canonical: fullUrl,
      languages: {
        'en-US': fullUrl,
        'ne-NP': `${baseUrl}/ne${path}` // For future Nepali version
      }
    },
    
    // Open Graph
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'Entrance Academy',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg'
        }
      ],
      locale,
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { 
        authors: Array.isArray(author) ? author : [author] 
      }),
      ...(section && { section })
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: title.length > 70 ? `${title.substring(0, 67)}...` : title,
      description: description.length > 200 ? `${description.substring(0, 197)}...` : description,
      images: [ogImage],
      creator: '@entranceacademy'
    },
    
    // Additional metadata
    authors: author ? [{ name: author }] : [{ name: 'Entrance Academy Team' }],
    creator: 'Entrance Academy',
    publisher: 'Entrance Academy',
    
    // Robots directives
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    
    // Verification (add your actual codes)
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
      bing: 'your-bing-verification-code'
    },
    
    // App-specific metadata
    applicationName: 'Entrance Academy',
    referrer: 'origin-when-cross-origin',
    formatDetection: {
      email: false,
      address: false,
      telephone: false
    },
    
    // Additional meta tags
    other: {
      'fb:app_id': 'your-facebook-app-id',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'apple-mobile-web-app-title': 'Entrance Academy',
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': '#3B82F6',
      'msapplication-config': '/browserconfig.xml',
      'theme-color': '#3B82F6'
    }
  };
}

// Page-specific metadata generators
export const pageMetadata = {
  // Homepage
  home: () => generatePageMetadata({
    title: 'Nepal Entrance Exam Preparation 2025 | MECEE-BL, IOE, TU | Free Mock Tests',
    description: 'Prepare for Nepal\'s top entrance exams with 8,500+ MCQs. Free mock tests for MECEE-BL, IOE, TU, KU entrance. 89% success rate. Start practicing now!',
    keywords: ['nepal entrance exam', 'MECEE-BL', 'IOE entrance', 'medical entrance nepal', 'free mock test'],
    path: '/',
    type: 'website'
  }),
  
  // Exam pages
  examPage: (examType) => generatePageMetadata({
    title: `${examType} Entrance Exam Preparation | Mock Tests & MCQs`,
    description: `Complete ${examType} entrance exam preparation with topic-wise MCQs, full-length mock tests, and detailed solutions. Practice with real exam interface.`,
    keywords: [`${examType} entrance`, `${examType} mock test`, `${examType} preparation`, 'nepal entrance exam'],
    path: `/exams/${examType.toLowerCase()}`,
    type: 'website'
  }),
  
  // Subject pages
  subjectPage: (subject) => generatePageMetadata({
    title: `${subject} MCQ Bank | 1,500+ Questions | Nepal Entrance Exams`,
    description: `Master ${subject} with our comprehensive MCQ bank. Chapter-wise questions, detailed solutions, and difficulty levels for MECEE-BL, IOE entrance preparation.`,
    keywords: [`${subject} MCQ`, `${subject} entrance questions`, `${subject} practice`, 'nepal entrance exam'],
    path: `/subjects/${subject.toLowerCase()}`,
    type: 'website'
  }),
  
  // Blog posts
  blogPost: (post) => generatePageMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.tags,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt || post.publishedAt,
    author: post.author,
    section: post.category,
    image: post.featuredImage
  }),
  
  // Test/Quiz pages
  testPage: (testId) => generatePageMetadata({
    title: 'Live Mock Test in Progress | Entrance Academy',
    description: 'Taking a live mock test. Practice with real exam conditions for Nepal entrance exams.',
    keywords: ['mock test', 'practice test', 'entrance exam'],
    path: `/test/${testId}`,
    type: 'website',
    // Don't index active test pages
    robots: {
      index: false,
      follow: false
    }
  })
};

// Dynamic metadata for Next.js 14+ app directory
export async function generateMetadata({ params, searchParams }, parent) {
  // This is a template for page.js files
  // Example usage in a page.js:
  /*
  export async function generateMetadata({ params }) {
    const post = await getPost(params.slug);
    return pageMetadata.blogPost(post);
  }
  */
  
  // Return appropriate metadata based on the page
  return generatePageMetadata({
    title: 'Page Title',
    description: 'Page Description',
    keywords: ['keyword1', 'keyword2'],
    path: '/current-path'
  });
} 