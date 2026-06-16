import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Linkedin, Twitter, Link2, Clock, Loader2, AlertTriangle, Instagram, Rss } from 'lucide-react';
import api from '../api';

// Simple Markdown to HTML parser
const parseMarkdown = (markdown) => {
  if (!markdown) return '';
  
  let html = markdown
    // Escape HTML tags to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Restore > for blockquotes specifically
    .replace(/^&gt;\s+(.*)$/gim, '<blockquote>$1</blockquote>')
    // Headings (with id attributes for table of contents anchors)
    .replace(/^### (.*$)/gim, (match, p1) => {
      const id = p1.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      return `<h3 id="${id}" class="text-lg font-bold text-gray-900 mt-6 mb-3 scroll-mt-24">${p1}</h3>`;
    })
    .replace(/^## (.*$)/gim, (match, p1) => {
      const id = p1.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      return `<h2 id="${id}" class="text-xl font-bold text-gray-900 mt-8 mb-4 border-b pb-1.5 scroll-mt-24">${p1}</h2>`;
    })
    .replace(/^# (.*$)/gim, (match, p1) => {
      const id = p1.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      return `<h1 id="${id}" class="text-2xl font-extrabold text-gray-900 mt-10 mb-5 scroll-mt-24">${p1}</h1>`;
    })
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-150 rounded font-mono text-sm text-emerald-600">$1</code>')
    // Images
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-2xl my-6 mx-auto max-h-[450px] object-cover shadow-md w-full" />')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:text-emerald-700 font-semibold underline">$1</a>')
    // Lists
    .replace(/^\s*[-*+]\s+(.*)$/gim, '<li class="ml-6 list-disc text-gray-650 my-1">$1</li>');

  const lines = html.split('\n');
  let result = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line.startsWith('<li')) {
      if (!inList) {
        result.push('<ul class="my-4">');
        inList = true;
      }
      result.push(lines[i]);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }

      if (line.startsWith('<blockquote>')) {
        let quoteContent = line.replace('<blockquote>', '').replace('</blockquote>', '');
        
        let alertClass = "border-l-4 border-emerald-500 bg-emerald-50/40 p-4 my-6 rounded-r-xl";
        let alertLabel = "NOTE";
        
        if (quoteContent.startsWith('[!NOTE]')) {
          quoteContent = quoteContent.replace('[!NOTE]', '').trim();
          alertClass = "border-l-4 border-blue-500 bg-blue-50/40 p-4 my-6 rounded-r-xl";
          alertLabel = "💡 NOTE";
        } else if (quoteContent.startsWith('[!TIP]')) {
          quoteContent = quoteContent.replace('[!TIP]', '').trim();
          alertClass = "border-l-4 border-green-500 bg-green-50/40 p-4 my-6 rounded-r-xl";
          alertLabel = "⚡ TIP";
        } else if (quoteContent.startsWith('[!WARNING]')) {
          quoteContent = quoteContent.replace('[!WARNING]', '').trim();
          alertClass = "border-l-4 border-amber-500 bg-amber-50/40 p-4 my-6 rounded-r-xl";
          alertLabel = "⚠️ WARNING";
        } else if (quoteContent.startsWith('[!IMPORTANT]')) {
          quoteContent = quoteContent.replace('[!IMPORTANT]', '').trim();
          alertClass = "border-l-4 border-red-500 bg-red-50/40 p-4 my-6 rounded-r-xl";
          alertLabel = "🔥 IMPORTANT";
        }

        result.push(`<div class="${alertClass}"><span class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">${alertLabel}</span><p class="text-gray-700 text-sm leading-relaxed">${quoteContent}</p></div>`);
      } else if (line !== '' && !line.startsWith('<h') && !line.startsWith('<div')) {
        result.push(`<p class="text-gray-700 leading-relaxed my-4 text-base">${lines[i]}</p>`);
      } else {
        result.push(lines[i]);
      }
    }
  }

  if (inList) result.push('</ul>');

  return result.join('\n');
};

const extractHeadings = (markdown) => {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const headings = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) {
      const title = line.replace('## ', '').trim();
      const id = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ title, id, level: 2 });
    } else if (line.startsWith('### ')) {
      const title = line.replace('### ', '').trim();
      const id = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ title, id, level: 3 });
    }
  }
  return headings;
};

const ArticleDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchPostAndRelated = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch current post
      const res = await api.get(`/api/blog/posts/${slug}`);
      setPost(res.data);
      document.title = `${res.data.title} | Kasi Blog`;
      
      // Fetch all posts to filter for related articles
      const allRes = await api.get('/api/blog/posts');
      setAllPosts(allRes.data);
      
    } catch (err) {
      setError('Article not found or has been taken offline.');
    } finally {
      setLoading(false);
    }
  };

  const updateMetaTags = (metadata) => {
    const { title, description, url, image, type = 'article', category, publishedTime, authorName } = metadata;
    document.title = title;
    
    const setMeta = (attrName, attrValue, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', type);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setMeta('name', 'twitter:url', url);

    if (publishedTime) setMeta('property', 'article:published_time', publishedTime);
    if (category) setMeta('property', 'article:section', category);
    if (authorName) setMeta('property', 'article:author', authorName);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  };

  useEffect(() => {
    fetchPostAndRelated();
    window.scrollTo(0, 0);
    return () => {
      document.title = 'Kasi Blog - AI & Social Commerce in Africa';
      ['article:published_time', 'article:section', 'article:author'].forEach(prop => {
        const el = document.querySelector(`meta[property="${prop}"]`);
        if (el) el.remove();
      });
    };
  }, [slug]);

  useEffect(() => {
    if (post) {
      updateMetaTags({
        title: `${post.title} | Kasi Blog`,
        description: post.summary || 'Read the article on the Kasi Blog.',
        url: window.location.href,
        image: post.featured_image || `${window.location.origin}/kasi.png`,
        type: 'article',
        category: post.category,
        publishedTime: post.published_at || post.created_at,
        authorName: post.author_name
      });
    }
  }, [post]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mt-4">Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Article Not Found</h2>
        <p className="text-gray-500 max-w-sm">{error}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-5 py-2.5 rounded-full transition-all">
          <ArrowLeft size={16} /> Return to Blog
        </Link>
      </div>
    );
  }

  const headings = extractHeadings(post.content);

  // Filter out current post to get related articles (take 2)
  const relatedArticles = allPosts
    .filter(p => p.id !== post.id)
    .slice(0, 2);

  // Social share URLs
  const shareTitle = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(window.location.href);
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const twitterShare = `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`;
  const hnShare = `https://news.ycombinator.com/submitlink?u=${shareUrl}&t=${shareTitle}`;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans tracking-tight antialiased flex flex-col">
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 py-2 group">
            <img src="/kasi.png" alt="Kasi Logo" className="h-8 md:h-9 w-auto object-contain" />
            <span className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 font-sans select-none">
              kasi <span className="text-emerald-600 font-medium">blog</span>
            </span>
          </Link>
          <a 
            href="https://usekasi.com" 
            className="text-sm font-bold text-gray-650 hover:text-emerald-600 transition-colors flex items-center gap-1"
          >
            Visit Kasi <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      {/* ── CONTENT BODY ── */}
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        {/* Breadcrumbs Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors mb-6 group">
          <ArrowLeft size={15} /> All articles
        </Link>

        {/* Sub Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-600">
            <span>{post.category}</span>
            <span className="text-gray-300">/</span>
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl">
            {post.title}
          </h1>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pt-1.5 pb-6 border-b border-gray-100">
            {post.read_time} MINUTES READ
          </div>
        </div>

        {/* Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8 items-start">
          
          {/* LEFT COLUMN: STICKY AUTHOR & SHARING */}
          <div className="lg:col-span-3 lg:sticky lg:top-28 space-y-6 pt-2">
            {/* Author row */}
            <div className="flex lg:flex-col items-center lg:items-start gap-3.5">
              {post.author_image ? (
                <img src={post.author_image} alt={post.author_name} className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover border border-gray-150 shadow-sm" />
              ) : (
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-emerald-55 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100 shrink-0">
                  {post.author_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-none">{post.author_name}</p>
                <p className="text-xs text-gray-400 mt-1">{post.author_role}</p>
              </div>
            </div>

            {/* Social shares */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                SHARE THIS ARTICLE
              </span>
              <div className="flex gap-2.5">
                <a 
                  href={linkedinShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs transition-all"
                  title="Share on LinkedIn"
                >
                  in
                </a>
                <a 
                  href={twitterShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs transition-all"
                  title="Share on X / Twitter"
                >
                  X
                </a>
                <a 
                  href={hnShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gray-50 border border-gray-150 hover:bg-gray-100 text-gray-500 flex items-center justify-center font-mono font-bold text-xs transition-all"
                  title="Share on Hacker News"
                >
                  Y
                </a>
                <button 
                  onClick={handleCopyLink}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs transition-all ${
                    copied 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600' 
                      : 'bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-555'
                  }`}
                  title="Copy link"
                >
                  <Link2 size={13} />
                </button>
              </div>
              {copied && <span className="block text-[10px] text-emerald-600 font-bold animate-pulse">Link copied!</span>}
            </div>
          </div>

          {/* CENTER COLUMN: THE MAIN ARTICLE BODY */}
          <div className="lg:col-span-6 space-y-8">
            {/* Banner Cover Image */}
            {post.featured_image && (
              <div className="rounded-2xl overflow-hidden shadow-sm max-h-[440px] border border-gray-100 bg-gray-50">
                <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Summary Box */}
            {post.summary && (
              <div className="border-l-4 border-emerald-500 bg-gray-50/70 border border-gray-200/80 rounded-2xl p-6 shadow-sm">
                <span className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                  ✦ SUMMARY
                </span>
                <p className="text-gray-800 text-base leading-relaxed italic">
                  {post.summary}
                </p>
              </div>
            )}

            {/* Markdown rendered body */}
            <article 
              className="prose max-w-none text-gray-700 select-text"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
            />

            {/* ── RELATED ARTICLES ("More blog posts to read") ── */}
            {relatedArticles.length > 0 && (
              <div className="pt-10 border-t border-gray-100 space-y-6">
                <h3 className="text-xl font-bold text-gray-900">
                  More blog posts to read
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {relatedArticles.map(rel => (
                    <Link 
                      key={rel.id} 
                      to={`/article/${rel.slug}`} 
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform"
                    >
                      <div className="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        {rel.featured_image ? (
                          <img src={rel.featured_image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <BookOpen size={24} />
                          </div>
                        )}
                      </div>
                      <div className="py-3.5 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{rel.category}</span>
                        <h4 className="font-bold text-gray-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">{rel.title}</h4>
                        <span className="block text-[10px] text-gray-400 mt-1">{formatDate(rel.published_at || rel.created_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Neubrutalist CTA Box at bottom of article */}
            <div className="bg-[#1A7A4A] text-white rounded-3xl p-8 mt-12 shadow-lg border-[1.5px] border-black relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider rounded-full">
                  READY FOR AUTOPILOT?
                </div>
                <h3 className="text-2xl font-black font-sans leading-tight">Ready to streamline your business?</h3>
                <p className="text-white/80 text-sm leading-relaxed max-w-md">
                  Join thousands of merchants using Kasi AI to handle customer conversations, invoices, payments, and payouts automatically via WhatsApp.
                </p>
                <a 
                  href="https://usekasi.com/signup" 
                  className="inline-flex items-center gap-2 bg-white hover:bg-green-50 text-[#1A7A4A] font-black px-6 py-3.5 rounded-full shadow-md transition-all hover:scale-[1.02] text-sm border border-black cursor-pointer"
                >
                  Create Your Kasi Storefront <ArrowRight size={16} className="stroke-[3]" />
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY TABLE OF CONTENTS ("ON THIS PAGE") */}
          <div className="lg:col-span-3 lg:sticky lg:top-28 h-fit hidden lg:block">
            {headings.length > 0 && (
              <div className="space-y-4 pl-3">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  ON THIS PAGE
                </span>
                <nav className="relative border-l border-gray-150 pl-4 space-y-3.5 text-xs font-semibold text-gray-400">
                  {/* Left indicator accent line active marker */}
                  <div className="absolute left-[-1px] top-0.5 w-[2px] h-3.5 bg-emerald-500" />
                  {headings.map((heading, index) => (
                    <a
                      key={index}
                      href={`#${heading.id}`}
                      className={`block hover:text-black transition-colors ${
                        heading.level === 3 ? 'pl-3 text-[11px]' : ''
                      }`}
                    >
                      {heading.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── NEUBRUTALIST REBRAND DARK FOOTER (Identical to usekasi.com main site) ── */}
      <footer className="bg-[#0A0A0A] text-[#9ca3af] py-20 font-sans select-none text-left border-t border-black">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16 items-start">
            {/* Column 1 — Brand */}
            <div className="lg:col-span-4 space-y-5">
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <img
                  src="/kasi.png"
                  alt="Kasi"
                  className="w-6 h-6 object-contain shrink-0 select-none"
                />
                <span>Kasi AI</span>
              </span>
              <p className="text-[15px] text-white/55 leading-relaxed font-medium max-w-xs mt-4">
                Your AI sales agent that never sleeps.
              </p>
            </div>

            {/* Column 2 — PRODUCT */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-[12px] font-bold text-white/40 uppercase tracking-widest">
                PRODUCT
              </h4>
              <ul className="space-y-3 text-[15px] font-medium">
                <li>
                  <a href="https://usekasi.com#dms" className="text-white/70 hover:text-white transition-colors">
                    Direct Messages
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com#invoices" className="text-white/70 hover:text-white transition-colors">
                    Invoices & Payments
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com#negotiation" className="text-white/70 hover:text-white transition-colors">
                    Negotiations
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com#logistics" className="text-white/70 hover:text-white transition-colors">
                    Logistics
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com#bookings" className="text-white/70 hover:text-white transition-colors">
                    Booking & Scheduling
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com#customer-intelligence" className="text-white/70 hover:text-white transition-colors">
                    Customer Intelligence
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com#pricing" className="text-white/70 hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 — INTEGRATIONS */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-[12px] font-bold text-white/40 uppercase tracking-widest">
                INTEGRATIONS
              </h4>
              <ul className="space-y-3 text-[15px] font-medium text-white/70">
                <li>
                  <a href="https://usekasi.com" className="hover:text-white transition-colors">
                    WhatsApp API
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com" className="hover:text-white transition-colors">
                    Instagram DMs
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com" className="hover:text-white transition-colors">
                    Facebook Messenger
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com" className="hover:text-white transition-colors">
                    Telegram
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com" className="hover:text-white transition-colors">
                    Paystack
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com" className="hover:text-white transition-colors">
                    Google Calendar
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4 — COMPANY */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[12px] font-bold text-white/40 uppercase tracking-widest">
                COMPANY
              </h4>
              <ul className="space-y-3 text-[15px] font-medium text-white/70">
                <li>
                  <a href="https://usekasi.com" className="hover:text-white transition-colors">
                    About Endogenous
                  </a>
                </li>
                <li>
                  <a href="https://blog.usekasi.com" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="https://usekasi.com/data-deletion" className="hover:text-white transition-colors">
                    Data Deletion
                  </a>
                </li>
                <li>
                  <a href="mailto:support@usekasi.com" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[13px] text-white/40 font-medium">
              © 2026 Endogenous Technologies. All rights reserved.
            </span>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: <Instagram size={16} />, url: "https://www.instagram.com/official_kasi247/" },
                { icon: <Twitter size={16} />, url: "https://x.com/hq_kasi" },
                { icon: <Linkedin size={16} />, url: "https://www.linkedin.com/company/122863967/" },
              ].map((soc, idx) => (
                <a
                  key={idx}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white transition-all"
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArticleDetail;
