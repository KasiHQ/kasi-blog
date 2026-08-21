import axios from 'axios';

export default async function handler(req, res) {
  const apiUrl = process.env.VITE_API_URL || 'https://api.usekasi.com';

  try {
    const response = await axios.get(`${apiUrl}/api/blog/posts`);
    const posts = Array.isArray(response.data) ? response.data : [];

    const todayStr = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
    <!-- Main Blog Home -->
    <url>
        <loc>https://blog.usekasi.com</loc>
        <lastmod>${todayStr}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.00</priority>
    </url>
`;

    posts.forEach((post) => {
      if (post.slug) {
        const rawDate = post.updated_at || post.published_at || post.created_at;
        let lastModDate = todayStr;
        try {
          if (rawDate) {
            lastModDate = new Date(rawDate).toISOString().split('T')[0];
          }
        } catch {
          lastModDate = todayStr;
        }

        sitemap += `    <url>
        <loc>https://blog.usekasi.com/article/${escapeXml(post.slug)}</loc>
        <lastmod>${lastModDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.80</priority>
    </url>\n`;
      }
    });

    sitemap += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error.message);
    const todayStr = new Date().toISOString().split('T')[0];
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://blog.usekasi.com</loc>
        <lastmod>${todayStr}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.00</priority>
    </url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(fallbackSitemap);
  }
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
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
