import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowUpRight, Rss, Loader2, AlertTriangle, ArrowRight, Instagram, Twitter, Linkedin, Menu, X } from 'lucide-react';
import api from '../api';

const CATEGORIES = [
  'All articles',
  'Announcements',
  'Product Updates',
  'How It Works',
  'Vendor Stories',
  'AI & Commerce',
  'For Founders'
];

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/blog/posts');
      setPosts(res.data);
    } catch (err) {
      setError('Failed to load blog articles. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const updateMetaTags = (metadata) => {
    const { title, description, url, image, type = 'website' } = metadata;
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

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  };

  useEffect(() => {
    fetchPosts();
    updateMetaTags({
      title: "Kasi Blog - AI & Social Commerce in Africa",
      description: "Read tutorials, vendor success stories, founder updates, and thought leadership on AI and social commerce in Africa from the Kasi team.",
      url: window.location.href,
      image: `${window.location.origin}/kasi.png`
    });
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'All articles' || 
      post.category.toLowerCase() === activeCategory.toLowerCase();
    
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (post.summary && post.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesCategory && matchesSearch;
  });

  const heroPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="https://usekasi.com" className="hover:text-emerald-600 transition-colors flex items-center gap-0.5">
              Visit Kasi <ArrowUpRight size={13} />
            </a>
            <a href="https://usekasi.com/pricing" className="hover:text-emerald-600 transition-colors">
              Pricing
            </a>
            <a href="https://usekasi.com/login" className="hover:text-emerald-600 transition-colors">
              Sign In
            </a>
            <a 
              href="https://usekasi.com/signup" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] font-bold text-center"
            >
              Start Free Trial
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-650 hover:text-black focus:outline-none transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-20 bg-white border-b border-gray-150 shadow-xl z-40 py-6 px-6 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
            <a 
              href="https://usekasi.com" 
              className="text-gray-650 hover:text-emerald-650 font-bold text-base py-2 flex items-center gap-1 border-b border-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Visit Kasi <ArrowUpRight size={14} />
            </a>
            <a 
              href="https://usekasi.com/pricing" 
              className="text-gray-650 hover:text-emerald-650 font-bold text-base py-2 border-b border-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a 
              href="https://usekasi.com/login" 
              className="text-gray-650 hover:text-emerald-650 font-bold text-base py-2 border-b border-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </a>
            <a 
              href="https://usekasi.com/signup" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-full font-bold text-center mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Free Trial
            </a>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full space-y-12">
        
        {error && (
          <div className="p-5 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100 max-w-2xl mx-auto">
            <AlertTriangle className="shrink-0" size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Fetching articles...</p>
          </div>
        ) : (
          <>
            {/* ── HERO POST (exactly matched to mockups) ── */}
            {heroPost && (
              <Link 
                to={`/article/${heroPost.slug}`}
                className="group block relative rounded-3xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.002]"
              >
                {/* Background Glow Design */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-950 via-gray-900 to-emerald-950" />
                
                {heroPost.featured_image && (
                  <div className="absolute inset-y-0 right-0 w-full md:w-1/2 opacity-20 md:opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${heroPost.featured_image})` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
                  </div>
                )}
                
                {/* Content Overlay */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 p-8 md:p-14 min-h-[440px] items-center">
                  <div className="md:col-span-7 space-y-6">
                    {/* Meta Info */}
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-400">
                      <span>{formatDate(heroPost.published_at || heroPost.created_at)}</span>
                      <span>•</span>
                      <span>{heroPost.read_time} min read</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                      {heroPost.title}
                    </h2>

                    {/* Summary Snippet */}
                    {heroPost.summary && (
                      <p className="text-gray-300 leading-relaxed text-sm md:text-base line-clamp-3 font-medium">
                        {heroPost.summary}
                      </p>
                    )}

                    {/* Author Row */}
                    <div className="flex items-center gap-3.5 pt-4">
                      {heroPost.author_image ? (
                        <img src={heroPost.author_image} alt={heroPost.author_name} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-500/30">
                          {heroPost.author_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-white leading-none">{heroPost.author_name}</p>
                        <p className="text-xs text-gray-400 mt-1">{heroPost.author_role}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* raised mockup card layout */}
                  <div className="md:col-span-5 hidden md:flex justify-end items-center pl-6 h-full">
                    {heroPost.featured_image ? (
                      <div className="w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform translate-x-4 rotate-1 group-hover:translate-x-0 group-hover:rotate-0 transition-all duration-500">
                        <img src={heroPost.featured_image} alt="Featured cover" className="w-full aspect-video object-cover" />
                      </div>
                    ) : (
                      <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/0 blur-3xl" />
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* ── FILTER CHIPS NAVIGATION & RSS ── */}
            <div className="pt-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-4 pr-4 scroll-smooth no-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                        activeCategory === cat
                          ? 'bg-black text-white'
                          : 'text-gray-500 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                <a href="https://usekasi.com/blog/feed" className="text-gray-400 hover:text-black transition-colors pb-1.5" title="RSS Feed">
                  <Rss size={16} />
                </a>
              </div>
            </div>

            {/* ── GRID OF OTHER ARTICLES ── */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No articles found matching this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                {(posts.length === 1 || activeCategory !== 'All articles' || searchQuery !== '' ? filteredPosts : gridPosts).map((post) => (
                  <Link 
                    key={post.id} 
                    to={`/article/${post.slug}`}
                    className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                  >
                    {/* Aspect Ratio Video Image Box */}
                    <div className="w-full aspect-video bg-gray-50 overflow-hidden relative rounded-2xl border border-gray-100/50">
                      {post.featured_image ? (
                        <img 
                          src={post.featured_image} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-tr from-gray-50 to-emerald-50/10">
                          <BookOpen size={30} />
                        </div>
                      )}
                    </div>

                    {/* Description Details */}
                    <div className="py-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                          {post.category}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-emerald-600 transition-colors">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                            {post.summary}
                          </p>
                        )}
                      </div>

                      {/* Author Details & Date */}
                      <div className="flex items-center gap-3 pt-3">
                        {post.author_image ? (
                          <img src={post.author_image} alt={post.author_name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {post.author_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-gray-800 leading-none">{post.author_name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{post.author_role}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">{formatDate(post.published_at || post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
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

export default Home;
