// SEO Templates for Entrance Academy Pages

export const seoTemplates = {
  // Homepage
  home: {
    title: "Nepal Entrance Exam Preparation 2025 | MECEE-BL, IOE, TU | Free Mock Tests",
    description: "Prepare for Nepal's top entrance exams with 8,500+ MCQs. Free mock tests for MECEE-BL, IOE, TU, KU entrance. 89% success rate. Start practicing now!",
    h1: "Nepal's #1 Entrance Exam Preparation Platform",
    keywords: ["nepal entrance exam", "MECEE-BL", "IOE entrance", "medical entrance nepal", "free mock test"]
  },

  // Exam-specific pages
  liveTests: {
    title: "Live Mock Tests Nepal | MECEE-BL Practice Test | Real Exam Experience",
    description: "Take live mock tests with real exam conditions. 200 MCQs in 3 hours with negative marking. Practice for MECEE-BL, IOE, TU entrance exams.",
    h1: "Live Mock Tests - Real Exam Experience",
    keywords: ["live mock test nepal", "MECEE-BL mock test", "entrance exam practice"]
  },

  // Subject pages
  subjects: {
    physics: {
      title: "Physics MCQ for Nepal Entrance | 1,500+ Questions | MECEE-BL Physics",
      description: "Master physics for entrance exams with 1,500+ MCQs covering mechanics, optics, electricity. Detailed solutions for MECEE-BL, IOE preparation.",
      h1: "Physics MCQ Bank - Nepal Entrance Exams"
    },
    chemistry: {
      title: "Chemistry MCQ Nepal Entrance | Organic, Inorganic, Physical | 1,800+ Questions",
      description: "Practice chemistry MCQs for MECEE-BL, IOE entrance. 1,800+ questions with solutions covering organic, inorganic, and physical chemistry.",
      h1: "Chemistry Question Bank - Entrance Preparation"
    },
    biology: {
      title: "Biology MCQ MECEE-BL | Botany & Zoology | 4,200+ Questions",
      description: "Complete biology preparation with 2,000+ zoology and 2,200+ botany MCQs. Perfect for medical entrance MECEE-BL, BSc nursing exams.",
      h1: "Biology MCQ Collection - Medical Entrance"
    }
  },

  // Blog post template
  blogPost: (post) => ({
    title: `${post.title} | Entrance Academy Nepal`,
    description: post.metaDescription || post.excerpt,
    keywords: post.tags
  }),

  // Dashboard pages
  dashboard: {
    title: "Student Dashboard | Track Your Progress | Entrance Academy",
    description: "Monitor your entrance exam preparation progress. View test scores, analytics, weak areas, and personalized study recommendations.",
    h1: "Your Preparation Dashboard"
  },

  // Results page
  results: {
    title: "Test Results & Analytics | Performance Report | Entrance Academy",
    description: "Detailed test results with subject-wise analysis, percentile ranking, and improvement suggestions for Nepal entrance exams.",
    h1: "Your Test Performance Analysis"
  }
};

// Dynamic meta tag generator
export const generateMetaTags = (template, customData = {}) => {
  const meta = { ...template, ...customData };
  
  return {
    title: meta.title.slice(0, 60), // Google typically displays 50-60 characters
    description: meta.description.slice(0, 155), // Google typically displays 155-160 characters
    keywords: Array.isArray(meta.keywords) ? meta.keywords.join(', ') : meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      locale: 'en_US',
      site_name: 'Entrance Academy'
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title.slice(0, 70),
      description: meta.description.slice(0, 200)
    }
  };
};

// Header structure recommendations
export const headerStructure = {
  homePage: {
    h1: "Nepal's #1 Entrance Exam Preparation Platform",
    h2: [
      "Why Choose Entrance Academy for Your Exam Preparation?",
      "Comprehensive Subject Coverage for All Major Exams",
      "Live Mock Tests with Real Exam Conditions",
      "Track Your Progress with Advanced Analytics"
    ],
    h3: [
      "MECEE-BL Medical Entrance Preparation",
      "IOE Engineering Entrance Resources",
      "TU & KU Entrance Exam Materials"
    ]
  },
  
  subjectPages: {
    h1: "{Subject} MCQ Bank - Nepal Entrance Exams",
    h2: [
      "Chapter-wise {Subject} Questions",
      "Difficulty Levels: Easy to Very Hard",
      "Previous Year {Subject} Questions",
      "Quick Revision Notes"
    ],
    h3: [
      "Important {Subject} Formulas",
      "Common Mistakes to Avoid",
      "Time-Saving Tips"
    ]
  }
}; 