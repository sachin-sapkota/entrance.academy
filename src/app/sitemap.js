// Dynamic Sitemap Generation for Next.js 14+
// This replaces the static sitemap.xml file

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrance.academy';
  
  // Static pages with their priorities and change frequencies
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/live-tests`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/exams`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic exam type pages
  const examTypes = ['mecee-bl', 'ioe', 'tu', 'ku', 'bsc-nursing', 'bph'];
  const examPages = examTypes.map(exam => ({
    url: `${baseUrl}/exams/${exam}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic subject pages
  const subjects = ['physics', 'chemistry', 'biology', 'botany', 'zoology', 'mathematics'];
  const subjectPages = subjects.flatMap(subject => [
    {
      url: `${baseUrl}/subjects/${subject}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/subjects/${subject}/practice`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/subjects/${subject}/mock-tests`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]);

  // Fetch dynamic blog posts from your data source
  let blogPosts = [];
  try {
    // Import blog posts data
    const blogData = await import('./blog/data/blogPosts.js');
    blogPosts = blogData.default.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly',
      priority: post.featured ? 0.9 : 0.7,
    }));
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Fetch dynamic practice sets
  let practiceSets = [];
  try {
    const response = await fetch(`${baseUrl}/api/practice-sets`);
    const data = await response.json();
    if (data.success && data.practiceSets) {
      practiceSets = data.practiceSets
        .filter(set => set.is_live)
        .map(set => ({
          url: `${baseUrl}/practice-sets/${set.id}`,
          lastModified: new Date(set.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error('Error fetching practice sets for sitemap:', error);
  }

  // Combine all URLs
  return [
    ...staticPages,
    ...examPages,
    ...subjectPages,
    ...blogPosts,
    ...practiceSets,
  ];
}

// Alternative: Generate multiple sitemaps for large sites
export async function generateSitemaps() {
  // This function can split sitemaps if you have more than 50,000 URLs
  return [
    { id: 'main' },
    { id: 'blog' },
    { id: 'subjects' },
    { id: 'tests' },
  ];
}

// For sites with multiple sitemaps
export async function generateSitemap({ id }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrance.academy';
  
  switch (id) {
    case 'main':
      return generateMainSitemap(baseUrl);
    case 'blog':
      return generateBlogSitemap(baseUrl);
    case 'subjects':
      return generateSubjectsSitemap(baseUrl);
    case 'tests':
      return generateTestsSitemap(baseUrl);
    default:
      return [];
  }
}

// Helper functions for multiple sitemaps
async function generateMainSitemap(baseUrl) {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Add more main pages...
  ];
}

async function generateBlogSitemap(baseUrl) {
  const blogData = await import('./blog/data/blogPosts.js');
  return blogData.default.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly',
    priority: post.featured ? 0.9 : 0.7,
  }));
}

async function generateSubjectsSitemap(baseUrl) {
  const subjects = ['physics', 'chemistry', 'biology', 'botany', 'zoology'];
  return subjects.flatMap(subject => [
    {
      url: `${baseUrl}/subjects/${subject}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Add topic pages, chapter pages, etc.
  ]);
}

async function generateTestsSitemap(baseUrl) {
  // Fetch and return test-related URLs
  return [];
} 