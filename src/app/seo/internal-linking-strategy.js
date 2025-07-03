// Internal Linking Strategy for Entrance Academy

export const internalLinkingStrategy = {
  // Hub Pages (High authority pages that should receive most internal links)
  hubPages: [
    { url: '/', anchor: 'entrance exam preparation' },
    { url: '/live-tests', anchor: 'mock tests' },
    { url: '/exams', anchor: 'practice exams' },
    { url: '/blog', anchor: 'entrance exam guides' }
  ],

  // Subject Silos
  subjectSilos: {
    physics: {
      main: '/subjects/physics',
      related: [
        { url: '/subjects/physics/mechanics', anchor: 'mechanics MCQs' },
        { url: '/subjects/physics/optics', anchor: 'optics questions' },
        { url: '/subjects/physics/electricity', anchor: 'electricity problems' }
      ]
    },
    chemistry: {
      main: '/subjects/chemistry',
      related: [
        { url: '/subjects/chemistry/organic', anchor: 'organic chemistry' },
        { url: '/subjects/chemistry/inorganic', anchor: 'inorganic chemistry' },
        { url: '/subjects/chemistry/physical', anchor: 'physical chemistry' }
      ]
    },
    biology: {
      main: '/subjects/biology',
      related: [
        { url: '/subjects/biology/botany', anchor: 'botany MCQs' },
        { url: '/subjects/biology/zoology', anchor: 'zoology questions' }
      ]
    }
  },

  // Contextual Linking Rules
  contextualLinks: {
    // From blog posts
    blogToExam: {
      keywords: ['MECEE-BL', 'medical entrance', 'engineering entrance'],
      linkTo: '/live-tests',
      anchorVariations: [
        'practice MECEE-BL mock test',
        'take a practice test',
        'try our mock exams'
      ]
    },
    
    // From exam pages to subjects
    examToSubject: {
      keywords: ['physics questions', 'chemistry MCQ', 'biology practice'],
      linkTo: (subject) => `/subjects/${subject}`,
      anchorTemplate: 'practice more {subject} questions'
    },
    
    // Cross-subject linking
    crossSubject: {
      from: 'physics',
      to: ['chemistry', 'mathematics'],
      context: 'Related subjects for engineering entrance'
    }
  },

  // Breadcrumb Structure
  breadcrumbs: {
    pattern: 'Home > Category > Subcategory > Page',
    implementation: `
      <nav aria-label="breadcrumb">
        <ol itemscope itemtype="https://schema.org/BreadcrumbList">
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a itemprop="item" href="/">
              <span itemprop="name">Home</span>
            </a>
            <meta itemprop="position" content="1" />
          </li>
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a itemprop="item" href="/exams">
              <span itemprop="name">Exams</span>
            </a>
            <meta itemprop="position" content="2" />
          </li>
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <span itemprop="name">MECEE-BL</span>
            <meta itemprop="position" content="3" />
          </li>
        </ol>
      </nav>
    `
  },

  // Footer Link Structure
  footerLinks: {
    examPreparation: {
      title: 'Exam Preparation',
      links: [
        { text: 'MECEE-BL Mock Tests', href: '/exams/mecee-bl' },
        { text: 'IOE Engineering Practice', href: '/exams/ioe' },
        { text: 'TU Entrance Resources', href: '/exams/tu' },
        { text: 'Subject-wise MCQs', href: '/subjects' }
      ]
    },
    resources: {
      title: 'Study Resources',
      links: [
        { text: 'Physics Question Bank', href: '/subjects/physics' },
        { text: 'Chemistry Solutions', href: '/subjects/chemistry' },
        { text: 'Biology Practice Sets', href: '/subjects/biology' },
        { text: 'Previous Year Papers', href: '/resources/past-papers' }
      ]
    },
    studentTools: {
      title: 'Student Tools',
      links: [
        { text: 'Performance Analytics', href: '/dashboard/analytics' },
        { text: 'Study Planner', href: '/tools/study-planner' },
        { text: 'Formula Sheets', href: '/resources/formulas' },
        { text: 'Exam Calendar', href: '/calendar' }
      ]
    }
  },

  // Anchor Text Best Practices
  anchorTextRules: {
    diversity: {
      primary: 'MECEE-BL preparation', // 40% of links
      variations: [
        'medical entrance exam practice', // 20%
        'MECEE-BL mock tests', // 20%
        'prepare for MECEE-BL online', // 10%
        'Nepal medical entrance' // 10%
      ]
    },
    
    avoid: [
      'click here',
      'read more',
      'link',
      'this page',
      'here'
    ],
    
    contextual: {
      good: 'Practice 500+ physics MCQs for MECEE-BL',
      bad: 'Click here for physics questions'
    }
  },

  // Related Content Widget
  relatedContent: {
    algorithm: 'tag-based', // or 'category-based', 'ml-based'
    maxItems: 5,
    template: (currentPage) => {
      // Return related pages based on current page context
      return `
        <aside class="related-content">
          <h3>Related Study Materials</h3>
          <ul>
            <li><a href="/similar-1">Similar Topic 1</a></li>
            <li><a href="/similar-2">Similar Topic 2</a></li>
          </ul>
        </aside>
      `;
    }
  }
};

// Auto-linking Component
export const AutoLink = ({ text, linkDensity = 0.02 }) => {
  // Automatically add internal links based on keywords
  const keywords = {
    'MECEE-BL': '/exams/mecee-bl',
    'physics MCQ': '/subjects/physics',
    'chemistry questions': '/subjects/chemistry',
    'mock test': '/live-tests',
    'entrance exam': '/',
    'study materials': '/resources'
  };
  
  // Implementation to replace keywords with links
  // while maintaining natural link density (2-3%)
  return text;
};

// Link Juice Distribution
export const linkJuiceDistribution = {
  homepage: {
    outgoingLinks: 50, // Maximum recommended
    distribution: {
      mainNav: '30%',
      heroSection: '20%',
      featuredContent: '30%',
      footer: '20%'
    }
  },
  
  categoryPages: {
    outgoingLinks: 30,
    distribution: {
      subcategories: '40%',
      relatedCategories: '20%',
      popularContent: '40%'
    }
  },
  
  contentPages: {
    outgoingLinks: 20,
    distribution: {
      relatedContent: '50%',
      categoryLinks: '30%',
      homeAndMain: '20%'
    }
  }
}; 