// Dynamic robots.txt generation
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrance.academy';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const robotsTxt = `# Entrance Academy Robots.txt
# Generated dynamically

User-agent: *
${isDevelopment ? 'Disallow: /' : 'Allow: /'}

# Major Search Engines
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: Baiduspider
Allow: /
Crawl-delay: 2

# Social Media Bots
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

# Disallow admin and private areas
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /debug/
Disallow: /debug-auth/
Disallow: /debug-session/
Disallow: /test-session/
Disallow: /phone-verify/
Disallow: /auth/callback/
Disallow: /_next/
Disallow: /static/

# Disallow dynamic test content
Disallow: /lobby/
Disallow: /quiz/*?*
Disallow: /test-upload/
Disallow: /test/*/submit
Disallow: /test/*/in-progress

# Allow important public content
Allow: /blog/
Allow: /forum/
Allow: /help/
Allow: /faq/
Allow: /contact/
Allow: /exams/
Allow: /live-tests/
Allow: /upcoming-tests/
Allow: /results/$
Allow: /solution/$
Allow: /subjects/
Allow: /*.js$
Allow: /*.css$

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SEMrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

# GPTBot and AI crawlers
User-agent: GPTBot
Disallow: /admin/
Disallow: /api/
Allow: /blog/
Allow: /help/

User-agent: ChatGPT-User
Disallow: /admin/
Disallow: /api/
Allow: /blog/
Allow: /help/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-blog.xml
Sitemap: ${baseUrl}/sitemap-subjects.xml
Sitemap: ${baseUrl}/sitemap-tests.xml

# Host directive
Host: ${baseUrl}
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
} 