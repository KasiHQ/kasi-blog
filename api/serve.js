import fs from "fs";
import path from "path";
import axios from "axios";

const FOUNDER_ENTITIES = {
  "omobolaji durojaiye": {
    name: "Omobolaji Durojaiye",
    jobTitle: "Co-Founder and CTO",
    sameAs: [
      "https://www.linkedin.com/in/omobolaji-durojaiye-527872294/",
      "https://x.com/bjtolu",
      "https://bolaji.tech",
    ],
  },
  "temidayo aderibigbe": {
    name: "Temidayo Aderibigbe",
    jobTitle: "Co-Founder and CEO",
    sameAs: ["https://www.linkedin.com/in/temidayo-aderibigbe-897a1731b/"],
  },
  "euodia peleg": {
    name: "Euodia Peleg",
    jobTitle: "Co-Founder and CMO",
    sameAs: ["https://www.linkedin.com/in/euodia-peleg-388103415/"],
  },
};

function resolveAuthorEntity(authorName) {
  const norm = (authorName || "").toLowerCase().trim();
  if (norm.includes("bolaji") || norm.includes("durojaiye")) {
    return FOUNDER_ENTITIES["omobolaji durojaiye"];
  }
  if (norm.includes("temi") || norm.includes("aderibigbe")) {
    return FOUNDER_ENTITIES["temidayo aderibigbe"];
  }
  if (norm.includes("euodia") || norm.includes("peleg")) {
    return FOUNDER_ENTITIES["euodia peleg"];
  }
  return {
    name: authorName || "Omobolaji Durojaiye",
    sameAs: ["https://www.linkedin.com/in/omobolaji-durojaiye-527872294/"],
  };
}

export default async function handler(req, res) {
  const { slug } = req.query;
  const apiUrl = process.env.VITE_API_URL || "https://api.usekasi.com";

  // Read index.html from dist
  const indexPath = path.join(process.cwd(), "dist", "index.html");
  let html = "";
  try {
    html = fs.readFileSync(indexPath, "utf8");
  } catch (err) {
    try {
      html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
    } catch (e) {
      res.setHeader("Content-Type", "text/plain");
      return res.status(500).send("index.html template not found");
    }
  }

  if (!slug) {
    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  }

  try {
    // Fetch article details from Flask backend
    const response = await axios.get(`${apiUrl}/api/blog/posts/${slug}`);
    const post = response.data;

    if (post) {
      const title = `${post.title} | Kasi Blog`;
      const description = post.summary || "Read the full article on Kasi Blog.";
      const image = post.featured_image || "https://usekasi.com/kasi.png";
      const url = `https://blog.usekasi.com/article/${slug}`;
      const authorEntity = resolveAuthorEntity(post.author_name);

      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: description,
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at || post.published_at || post.created_at,
        author: {
          "@type": "Person",
          name: authorEntity.name,
          sameAs: authorEntity.sameAs,
        },
        publisher: {
          "@type": "Organization",
          name: "Kasi AI",
          logo: {
            "@type": "ImageObject",
            url: "https://usekasi.com/kasi.png",
          },
        },
        mainEntityOfPage: url,
      };

      // Flexible RegEx patterns to replace matching meta tags
      html = html
        .replace(/<title>[^]*?<\/title>/i, `<title>${title}</title>`)
        .replace(
          /<meta\s+name="description"\s+content="[^]*?"\s*\/?>/i,
          `<meta name="description" content="${description}" />`,
        )
        .replace(
          /<meta\s+property="og:title"\s+content="[^]*?"\s*\/?>/i,
          `<meta property="og:title" content="${title}" />`,
        )
        .replace(
          /<meta\s+property="og:description"\s+content="[^]*?"\s*\/?>/i,
          `<meta property="og:description" content="${description}" />`,
        )
        .replace(
          /<meta\s+property="og:image"\s+content="[^]*?"\s*\/?>/i,
          `<meta property="og:image" content="${image}" />`,
        )
        .replace(
          /<meta\s+property="og:url"\s+content="[^]*?"\s*\/?>/i,
          `<meta property="og:url" content="${url}" />`,
        )
        .replace(
          /<meta\s+property="og:type"\s+content="[^]*?"\s*\/?>/i,
          `<meta property="og:type" content="article" />`,
        )
        .replace(
          /<meta\s+name="twitter:title"\s+content="[^]*?"\s*\/?>/i,
          `<meta name="twitter:title" content="${title}" />`,
        )
        .replace(
          /<meta\s+name="twitter:description"\s+content="[^]*?"\s*\/?>/i,
          `<meta name="twitter:description" content="${description}" />`,
        )
        .replace(
          /<meta\s+name="twitter:image"\s+content="[^]*?"\s*\/?>/i,
          `<meta name="twitter:image" content="${image}" />`,
        )
        .replace(
          /<meta\s+name="twitter:url"\s+content="[^]*?"\s*\/?>/i,
          `<meta name="twitter:url" content="${url}" />`,
        );

      const headInjections = `
    <link rel="canonical" href="${url}" />
    <meta property="article:published_time" content="${post.published_at || post.created_at}" />
    <meta property="article:author" content="${authorEntity.name}" />
    <script type="application/ld+json">
${JSON.stringify(articleSchema, null, 2)}
    </script>
</head>`;

      html = html.replace("</head>", headInjections);
    }
  } catch (error) {
    console.error(
      "Error fetching blog metadata for dynamic SEO:",
      error.message,
    );
  }

  res.setHeader("Content-Type", "text/html");
  return res.send(html);
}
