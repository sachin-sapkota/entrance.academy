// Structured Data (JSON-LD) Generators for SEO

// Organization Schema (use on homepage)
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": "https://entrance.academy/#organization",
  "name": "Entrance Academy",
  "alternateName": "EA Nepal",
  "url": "https://entrance.academy",
  "logo": {
    "@type": "ImageObject",
    "url": "https://entrance.academy/logo.png",
    "width": 600,
    "height": 600
  },
  "description": "Nepal's premier online platform for entrance exam preparation including MECEE-BL, IOE, TU, KU entrance exams.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "NP",
    "addressRegion": "Bagmati",
    "addressLocality": "Kathmandu"
  },
  "contactPoint": [{
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["en", "ne"],
    "url": "https://entrance.academy/contact",
    "email": "support@entrance.academy"
  }],
  "sameAs": [
    "https://www.facebook.com/entranceacademy",
    "https://www.twitter.com/entranceacademy",
    "https://www.youtube.com/@entranceacademy",
    "https://www.instagram.com/entranceacademy"
  ],
  "founder": {
    "@type": "Person",
    "name": "Entrance Academy Team"
  },
  "foundingDate": "2023-01-01",
  "areaServed": {
    "@type": "Country",
    "name": "Nepal"
  }
};

// Website Schema with SearchAction
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://entrance.academy/#website",
  "url": "https://entrance.academy",
  "name": "Entrance Academy",
  "description": "Nepal entrance exam preparation platform",
  "publisher": {
    "@id": "https://entrance.academy/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://entrance.academy/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": "en-US"
};

// Course Schema Generator
export function generateCourseSchema({
  name,
  description,
  provider = "Entrance Academy",
  url,
  courseCode,
  duration = "P3M", // 3 months in ISO 8601 format
  educationalLevel = "Intermediate",
  teaches = [],
  price = 0,
  currency = "NPR"
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": provider,
      "sameAs": "https://entrance.academy"
    },
    "url": url,
    "courseCode": courseCode,
    "educationalLevel": educationalLevel,
    "teaches": teaches,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "duration": duration,
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": currency,
        "availability": "https://schema.org/InStock",
        "validFrom": new Date().toISOString()
      }
    },
    "educationalCredentialAwarded": "Certificate of Completion",
    "competencyRequired": "Class 12 Science",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student",
      "audienceType": "Entrance Exam Aspirants"
    }
  };
}

// Quiz/Practice Test Schema
export function generateQuizSchema({
  name,
  description,
  questions = [],
  subject,
  difficulty,
  duration,
  url
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": name,
    "description": description,
    "url": url,
    "educationalLevel": "Higher Secondary",
    "assesses": subject,
    "educationalUse": "Practice",
    "learningResourceType": "Quiz",
    "timeRequired": duration,
    "hasPart": questions.map((q, index) => ({
      "@type": "Question",
      "name": `Question ${index + 1}`,
      "text": q.text,
      "eduQuestionType": "Multiple choice",
      "suggestedAnswer": {
        "@type": "Answer",
        "text": q.correctAnswer
      }
    })),
    "about": {
      "@type": "Thing",
      "name": subject
    },
    "educationalAlignment": {
      "@type": "AlignmentObject",
      "alignmentType": "teaches",
      "educationalFramework": "Nepal Education Board",
      "targetName": subject,
      "targetUrl": `https://entrance.academy/subjects/${subject.toLowerCase()}`
    }
  };
}

// FAQ Schema Generator
export function generateFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Blog Article Schema
export function generateArticleSchema({
  title,
  description,
  author,
  datePublished,
  dateModified,
  image,
  url,
  keywords = [],
  wordCount,
  articleBody
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "headline": title,
    "description": description,
    "image": {
      "@type": "ImageObject",
      "url": image,
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Person",
      "name": author,
      "url": "https://entrance.academy/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Entrance Academy",
      "logo": {
        "@type": "ImageObject",
        "url": "https://entrance.academy/logo.png",
        "width": 600,
        "height": 60
      }
    },
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "keywords": keywords.join(", "),
    "wordCount": wordCount,
    "articleBody": articleBody,
    "inLanguage": "en-US",
    "educationalUse": "Exam Preparation Guide",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    }
  };
}

// Breadcrumb Schema Generator
export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// Learning Resource Schema
export function generateLearningResourceSchema({
  name,
  description,
  subject,
  educationalLevel = "Higher Secondary",
  learningResourceType = "Practice problems",
  timeRequired = "PT30M",
  url
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": name,
    "description": description,
    "url": url,
    "educationalLevel": educationalLevel,
    "learningResourceType": learningResourceType,
    "teaches": subject,
    "timeRequired": timeRequired,
    "educationalAlignment": {
      "@type": "AlignmentObject",
      "alignmentType": "teaches",
      "educationalFramework": "Nepal Education Board",
      "targetName": subject
    },
    "provider": {
      "@type": "Organization",
      "name": "Entrance Academy"
    }
  };
}

// Event Schema for Live Tests
export function generateEventSchema({
  name,
  description,
  startDate,
  endDate,
  url,
  eventStatus = "EventScheduled",
  eventAttendanceMode = "OnlineEventAttendanceMode",
  offers = { price: 0, currency: "NPR" }
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": name,
    "description": description,
    "startDate": startDate,
    "endDate": endDate,
    "eventStatus": `https://schema.org/${eventStatus}`,
    "eventAttendanceMode": `https://schema.org/${eventAttendanceMode}`,
    "location": {
      "@type": "VirtualLocation",
      "url": url
    },
    "organizer": {
      "@type": "Organization",
      "name": "Entrance Academy",
      "url": "https://entrance.academy"
    },
    "offers": {
      "@type": "Offer",
      "price": offers.price,
      "priceCurrency": offers.currency,
      "availability": "https://schema.org/InStock",
      "url": url,
      "validFrom": new Date().toISOString()
    },
    "performer": {
      "@type": "Organization",
      "name": "Entrance Academy"
    }
  };
}

// Review/Rating Schema
export function generateReviewSchema({
  itemReviewed,
  rating,
  reviewCount,
  bestRating = 5,
  worstRating = 1
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "itemReviewed": {
      "@type": "Course",
      "name": itemReviewed,
      "provider": {
        "@type": "Organization",
        "name": "Entrance Academy"
      }
    },
    "ratingValue": rating,
    "reviewCount": reviewCount,
    "bestRating": bestRating,
    "worstRating": worstRating
  };
}

// How-To Schema for Study Guides
export function generateHowToSchema({
  name,
  description,
  totalTime = "P1D",
  steps = [],
  image,
  url
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "image": image,
    "totalTime": totalTime,
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "Study Materials"
      },
      {
        "@type": "HowToSupply",
        "name": "Practice Questions"
      }
    ],
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "url": `${url}#step${index + 1}`,
      "image": step.image
    }))
  };
}

// Utility function to inject schema into page
export function SchemaScript({ schema }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
} 