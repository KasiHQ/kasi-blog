import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Linkedin, Twitter, Link2, Calendar, Clock, Loader2, AlertTriangle, MessageSquare, ArrowUpRight, Share2, Rss } from 'lucide-react';
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
      return `<h3 id="${id}" class="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3 scroll-mt-24">${p1}</h3>`;
    })
    .replace(/^## (.*$)/gim, (match, p1) => {
      const id = p1.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      return `<h2 id="${id}" class="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4 border-b pb-1.5 scroll-mt-24">${p1}</h2>`;
    })
    .replace(/^# (.*$)/gim, (match, p1) => {
      const id = p1.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      return `<h1 id="${id}" class="text-2xl font-extrabold text-gray-900 dark:text-white mt-10 mb-5 scroll-mt-24">${p1}</h1>`;
    })
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm text-emerald-600 dark:text-emerald-400">$1</code>')
    // Images
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-2xl my-6 mx-auto max-h-[450px] object-cover shadow-md w-full" />')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-355 font-semibold underline">$1</a>')
    // Lists
    .replace(/^\s*[-*+]\s+(.*)$/gim, '<li class="ml-6 list-disc text-gray-600 dark:text-gray-300 my-1">$1</li>');

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
        
        let alertClass = "border-l-4 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 my-6 rounded-r-xl";
        let alertLabel = "NOTE";
        
        if (quoteContent.startsWith('[!NOTE]')) {
          quoteContent = quoteContent.replace('[!NOTE]', '').trim();
          alertClass = "border-l-4 border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 p-4 my-6 rounded-r-xl";
          alertLabel = "💡 NOTE";
        } else if (quoteContent.startsWith('[!TIP]')) {
          quoteContent = quoteContent.replace('[!TIP]', '').trim();
          alertClass = "border-l-4 border-green-500 bg-green-50/40 dark:bg-green-950/20 p-4 my-6 rounded-r-xl";
          alertLabel = "⚡ TIP";
        } else if (quoteContent.startsWith('[!WARNING]')) {
          quoteContent = quoteContent.replace('[!WARNING]', '').trim();
          alertClass = "border-l-4 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 p-4 my-6 rounded-r-xl";
          alertLabel = "⚠️ WARNING";
        } else if (quoteContent.startsWith('[!IMPORTANT]')) {
          quoteContent = quoteContent.replace('[!IMPORTANT]', '').trim();
          alertClass = "border-l-4 border-red-500 bg-red-50/40 dark:bg-red-950/20 p-4 my-6 rounded-r-xl";
          alertLabel = "🔥 IMPORTANT";
        }

        result.push(`<div class="${alertClass}"><span class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">${alertLabel}</span><p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">${quoteContent}</p></div>`);
      } else if (line !== '' && !line.startsWith('<h') && !line.startsWith('<div')) {
        result.push(`<p class="text-gray-700 dark:text-gray-300 leading-relaxed my-4 text-base">${lines[i]}</p>`);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/blog/posts/${slug}`);
      setPost(res.data);
      // Update page title
      document.title = `${res.data.title} | Kasi Blog`;
    } catch (err) {
      setError('Article not found or has been taken offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    return () => {
      document.title = 'Kasi Blog';
    };
  }, [slug]);

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
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mt-4">Loading article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col justify-center items-center px-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Article Not Found</h2>
        <p className="text-gray-500 max-w-sm">{error}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-5 py-2.5 rounded-xl transition-all">
          <ArrowLeft size={16} /> Return to Blog
        </Link>
      </div>
    );
  }

  const headings = extractHeadings(post.content);

  // Social share URLs
  const shareTitle = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(window.location.href);
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const twitterShare = `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`;
  const hnShare = `https://news.ycombinator.com/submitlink?u=${shareUrl}&t=${shareTitle}`;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col antialiased">
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/kasi-blog.png" alt="Kasi Blog" className="h-9 w-auto" onError={(e) => { e.target.src = '/kasi.png'; }} />
          </Link>
          <a 
            href="https://usekasi.com" 
            className="text-sm font-bold text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            Go to Kasi <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      {/* ── CORE CONTENT SECTION ── */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Breadcrumb Navigation */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors mb-8 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> All articles
        </Link>

        {/* Sub Header (Meta details) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span>{post.category}</span>
            <span>/</span>
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-tight max-w-4xl">
            {post.title}
          </h1>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest pt-1.5 pb-6 border-b border-gray-100 dark:border-gray-900">
            <Clock size={13} /> {post.read_time} Minutes Read
          </div>
        </div>

        {/* Banner cover image */}
        {post.featured_image && (
          <div className="my-8 rounded-2xl overflow-hidden shadow-md max-h-[500px] border border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900">
            <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
          
          {/* LEFT COLUMN: AUTHOR PROFILE & SHARING */}
          <div className="lg:col-span-3 lg:sticky lg:top-28 h-fit space-y-8 order-2 lg:order-1 border-t lg:border-t-0 pt-8 lg:pt-0 border-gray-100 dark:border-gray-900">
            
            {/* Author details */}
            <div className="flex lg:flex-col items-center lg:items-start gap-3.5">
              {post.author_image ? (
                <img src={post.author_image} alt={post.author_name} className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover border border-gray-200 dark:border-gray-800" />
              ) : (
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-100 dark:border-emerald-900/30">
                  {post.author_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{post.author_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{post.author_role}</p>
              </div>
            </div>

            {/* Social sharing */}
            <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-900">
              <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Share this article
              </span>
              <div className="flex gap-2">
                <a 
                  href={linkedinShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-xl text-gray-500 dark:text-gray-400 transition-all hover:scale-[1.02]"
                  title="Share on LinkedIn"
                >
                  <Linkedin size={17} />
                </a>
                <a 
                  href={twitterShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-xl text-gray-500 dark:text-gray-400 transition-all hover:scale-[1.02]"
                  title="Share on X / Twitter"
                >
                  <Twitter size={17} />
                </a>
                <a 
                  href={hnShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-xl text-gray-500 dark:text-gray-400 transition-all hover:scale-[1.02] flex items-center justify-center font-bold text-xs font-mono h-[35px] w-[35px]"
                  title="Share on Hacker News"
                >
                  Y
                </a>
                <button 
                  onClick={handleCopyLink}
                  className={`p-2 border rounded-xl transition-all hover:scale-[1.02] ${
                    copied 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 text-gray-500 dark:text-gray-400'
                  }`}
                  title="Copy link to clipboard"
                >
                  <Link2 size={17} />
                </button>
              </div>
              {copied && <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">Link copied!</span>}
            </div>
          </div>

          {/* CENTER COLUMN: THE MAIN ARTICLE BODY */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            
            {/* Summary Box */}
            {post.summary && (
              <div className="border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-r-2xl p-6 border-y border-r border-emerald-100/50 dark:border-emerald-900/20 shadow-sm">
                <span className="block text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  ✨ SUMMARY
                </span>
                <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed italic">
                  {post.summary}
                </p>
              </div>
            )}

            {/* Markdown rendered body */}
            <article 
              className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 select-text"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
            />

            {/* CTA Banner at bottom of article */}
            <div className="bg-gradient-to-tr from-emerald-600 via-emerald-600 to-teal-700 text-white rounded-3xl p-8 mt-12 shadow-lg space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
              <div className="relative z-10 space-y-3">
                <h3 className="text-xl font-bold">Ready to streamline your business?</h3>
                <p className="text-emerald-100 text-sm leading-relaxed max-w-md">
                  Join thousands of merchants using Kasi AI to handle customer conversations, invoices, payments, and payouts automatically via WhatsApp.
                </p>
                <a 
                  href="https://usekasi.com/signup" 
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-emerald-700 font-bold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-[1.02] text-sm"
                >
                  Start Your Free Trial <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TABLE OF CONTENTS ("ON THIS PAGE") */}
          <div className="lg:col-span-3 lg:sticky lg:top-28 h-fit hidden lg:block order-3">
            {headings.length > 0 && (
              <div className="space-y-4">
                <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  On this page
                </span>
                <nav className="space-y-2 text-xs font-semibold text-gray-400 dark:text-gray-500 border-l border-gray-150 dark:border-gray-800 pl-3">
                  {headings.map((heading, index) => (
                    <a
                      key={index}
                      href={`#${heading.id}`}
                      className={`block hover:text-gray-850 dark:hover:text-white transition-colors py-0.5 ${
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

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-500 text-xs border-t border-white/5 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/kasi.png" alt="Kasi Logo" className="h-5 w-auto" />
            <span>&copy; {new Date().getFullYear()} Kasi HQ. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://usekasi.com/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="https://usekasi.com/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="https://usekasi.com/blog/feed" className="hover:text-white transition-colors flex items-center gap-1">
              <Rss size={12} /> RSS Feed
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArticleDetail;
