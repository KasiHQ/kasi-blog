import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, ArrowRight, Rss, Loader2, AlertTriangle, ArrowUpRight, Search, Menu, X } from 'lucide-react';
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
      // Fetch public posts
      const res = await api.get('/api/blog/posts');
      setPosts(res.data);
    } catch (err) {
      setError('Failed to load blog articles. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Filter posts based on category and search query
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
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col antialiased">
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/kasi-blog.png" alt="Kasi Blog" className="h-9 w-auto" onError={(e) => { e.target.src = '/kasi.png'; }} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <a href="https://usekasi.com" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-0.5">
              Main Site <ArrowUpRight size={13} />
            </a>
            <a href="https://usekasi.com/pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Pricing
            </a>
            <a href="https://usekasi.com/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Sign In
            </a>
            <a 
              href="https://usekasi.com/signup" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-none hover:scale-[1.02] font-bold text-center"
            >
              Start Free Trial
            </a>
          </nav>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <a href="https://usekasi.com" className="block text-base font-semibold text-gray-700 dark:text-gray-200 py-2">
              Main Site
            </a>
            <a href="https://usekasi.com/pricing" className="block text-base font-semibold text-gray-700 dark:text-gray-200 py-2">
              Pricing
            </a>
            <a href="https://usekasi.com/login" className="block text-base font-semibold text-gray-700 dark:text-gray-200 py-2">
              Sign In
            </a>
            <a 
              href="https://usekasi.com/signup" 
              className="block bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-center font-bold"
            >
              Start Free Trial
            </a>
          </div>
        )}
      </header>

      {/* ── CORE WRAPPER ── */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full space-y-12">
        
        {/* Error notification */}
        {error && (
          <div className="p-5 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-900/20 max-w-2xl mx-auto">
            <AlertTriangle className="shrink-0" size={20} />
            <div>
              <span className="font-bold">Error:</span> {error}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Fetching articles...</p>
          </div>
        ) : (
          <>
            {/* ── HERO POST (MINTLIFY COVER POST STYLE) ── */}
            {heroPost && (
              <Link 
                to={`/article/${heroPost.slug}`}
                className="group block relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-emerald-950/10 hover:scale-[1.005]"
              >
                {/* Background Gradient & Pattern */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-950 via-gray-900 to-emerald-950 z-0" />
                
                {/* Visual Accent/Artwork inside Card */}
                {heroPost.featured_image && (
                  <div className="absolute inset-y-0 right-0 w-full md:w-1/2 opacity-25 md:opacity-50 z-0 md:bg-cover md:bg-center" style={{ backgroundImage: `url(${heroPost.featured_image})` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
                  </div>
                )}
                
                {/* Card Content Grid */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-14 min-h-[420px] items-center">
                  <div className="space-y-6">
                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-emerald-400">
                      <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">{heroPost.category}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{heroPost.read_time} min read</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                      {heroPost.title}
                    </h2>

                    {/* Summary Snippet */}
                    {heroPost.summary && (
                      <p className="text-gray-300 dark:text-gray-400 leading-relaxed text-sm md:text-base line-clamp-3">
                        {heroPost.summary}
                      </p>
                    )}

                    {/* Author Metadata */}
                    <div className="flex items-center gap-3.5 pt-4 border-t border-white/10">
                      {heroPost.author_image ? (
                        <img src={heroPost.author_image} alt={heroPost.author_name} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-500/30">
                          {heroPost.author_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-white">{heroPost.author_name}</p>
                        <p className="text-xs text-gray-400">{heroPost.author_role}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative raised graphic container mimicking mockups */}
                  <div className="hidden md:flex justify-center items-center h-full relative pl-6">
                    {heroPost.featured_image ? (
                      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform translate-x-4 rotate-1 group-hover:translate-x-0 group-hover:rotate-0 transition-all duration-500">
                        <img src={heroPost.featured_image} alt="Featured graphics" className="w-full aspect-video object-cover" />
                      </div>
                    ) : (
                      <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/0 blur-3xl animate-pulse" />
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* ── SEARCH & CATEGORIES NAVIGATION ── */}
            <div className="pt-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-900 pb-3">
                
                {/* Categories Scrollable Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mb-5 pr-4 no-scrollbar scroll-smooth">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                        activeCategory === cat
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                          : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search bar */}
                <div className="relative w-full md:w-80 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-full bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-gray-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* ── ARTICLES GRID ── */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/20 rounded-3xl border border-gray-100 dark:border-gray-900">
                <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No articles found matching this selection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                {/* If there's only 1 post, show it in the grid too, but if more, the first was hero */}
                {(posts.length === 1 || activeCategory !== 'All articles' || searchQuery !== '' ? filteredPosts : gridPosts).map((post) => (
                  <Link 
                    key={post.id} 
                    to={`/article/${post.slug}`}
                    className="group flex flex-col bg-white dark:bg-gray-900/10 border border-gray-100 dark:border-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                  >
                    {/* Card Cover Photo */}
                    <div className="w-full aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden relative border-b border-gray-100/50 dark:border-gray-900">
                      {post.featured_image ? (
                        <img 
                          src={post.featured_image} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700 bg-gradient-to-tr from-gray-50 to-emerald-50/20 dark:from-gray-900 dark:to-emerald-950/10">
                          <BookOpen size={32} />
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <span>{post.category}</span>
                          <span>•</span>
                          <span className="text-gray-400">{post.read_time} min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-950 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                            {post.summary}
                          </p>
                        )}
                      </div>

                      {/* Author row */}
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-gray-900">
                        {post.author_image ? (
                          <img src={post.author_image} alt={post.author_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {post.author_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{post.author_name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{post.author_role}</p>
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

      {/* ── CTA BANNER FOOTER ── */}
      <section className="bg-gray-950 text-white py-16 border-t border-gray-900 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            ⚡ Powered by AI
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Grow your business with Kasi AI Sales Assistant
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
            Automate invoice creation, WhatsApp conversations, payout splits, and logistics routing. Join thousands of African merchants today.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://usekasi.com/signup" 
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-950 transition-all hover:scale-102 flex items-center justify-center gap-2"
            >
              Get Started for Free <ArrowRight size={18} />
            </a>
            <a 
              href="https://usekasi.com" 
              className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-500 text-xs border-t border-white/5 py-8">
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

export default Home;
