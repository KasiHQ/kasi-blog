import fs from 'fs';
import path from 'path';
import axios from 'axios';

export default async function handler(req, res) {
  const { slug } = req.query;
  const apiUrl = process.env.VITE_API_URL || 'https://api.usekasi.com';
  
  // Read index.html from dist
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  let html = '';
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    try {
      html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    } catch (e) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(500).send('index.html template not found');
    }
  }

  if (!slug) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  try {
    // Fetch article details from Flask backend
    const response = await axios.get(`${apiUrl}/api/blog/posts/${slug}`);
    const post = response.data;

    if (post) {
      const title = `${post.title} | Kasi Blog`;
      const description = post.summary || 'Read the full article on Kasi Blog.';
      const image = post.featured_image || `${apiUrl}/kasi.png`;
      const url = `https://blog.usekasi.com/article/${slug}`;

      // Flexible RegEx patterns to replace matching meta tags
      html = html
        .replace(/<title>[^]*?<\/title>/i, `<title>${title}</title>`)
        .replace(/<meta\s+name="description"\s+content="[^]*?"\s*\/?>/i, `<meta name="description" content="${description}" />`)
        .replace(/<meta\s+property="og:title"\s+content="[^]*?"\s*\/?>/i, `<meta property="og:title" content="${title}" />`)
        .replace(/<meta\s+property="og:description"\s+content="[^]*?"\s*\/?>/i, `<meta property="og:description" content="${description}" />`)
        .replace(/<meta\s+property="og:image"\s+content="[^]*?"\s*\/?>/i, `<meta property="og:image" content="${image}" />`)
        .replace(/<meta\s+property="og:url"\s+content="[^]*?"\s*\/?>/i, `<meta property="og:url" content="${url}" />`)
        .replace(/<meta\s+property="og:type"\s+content="[^]*?"\s*\/?>/i, `<meta property="og:type" content="article" />`)
        .replace(/<meta\s+name="twitter:title"\s+content="[^]*?"\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`)
        .replace(/<meta\s+name="twitter:description"\s+content="[^]*?"\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`)
        .replace(/<meta\s+name="twitter:image"\s+content="[^]*?"\s*\/?>/i, `<meta name="twitter:image" content="${image}" />`)
        .replace(/<meta\s+name="twitter:url"\s+content="[^]*?"\s*\/?>/i, `<meta name="twitter:url" content="${url}" />`);
    }
  } catch (error) {
    console.error('Error fetching blog metadata for dynamic SEO:', error.message);
  }

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
};
