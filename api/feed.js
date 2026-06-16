import axios from 'axios';

export default async function handler(req, res) {
  const apiUrl = process.env.VITE_API_URL || 'https://api.usekasi.com';
  
  try {
    // Fetch published posts from Flask backend
    const response = await axios.get(`${apiUrl}/api/blog/posts`);
    const posts = response.data;

    // Build standard RSS 2.0 XML structure
    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Kasi Blog</title>
  <link>https://blog.usekasi.com</link>
  <description>Thought leadership, tutorials, founder journeys, and updates from the Kasi AI team on AI &amp; Commerce in Africa.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="https://blog.usekasi.com/feed" rel="self" type="application/rss+xml" />
`;

    posts.forEach(post => {
      const postUrl = `https://blog.usekasi.com/article/${post.slug}`;
      const pubDate = new Date(post.published_at || post.created_at).toUTCString();
      const escapedTitle = escapeXml(post.title || '');
      const escapedSummary = escapeXml(post.summary || '');
      
      rss += `  <item>
    <title>${escapedTitle}</title>
    <link>${postUrl}</link>
    <guid>${postUrl}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapedSummary}</description>
    <category>${escapeXml(post.category || '')}</category>
  </item>\n`;
    });

    rss += `</channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache for 1 hour on Vercel Edge CDN
    return res.status(200).send(rss);

  } catch (error) {
    console.error('Error generating RSS feed:', error.message);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Kasi Blog</title>
  <link>https://blog.usekasi.com</link>
  <description>Error generating RSS feed: ${escapeXml(error.message)}</description>
</channel>
</rss>`);
  }
}

// Simple XML escaper to prevent malformed XML errors in readers
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
