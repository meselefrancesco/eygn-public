import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cubicEase } from './utils/motion';
import { EventItem, Language } from './types';
import { ROUTES, PRIVACY_ROUTE, NEWSLETTER_CONFIRM_ROUTE } from './lib/routes';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ArticleReaderModal } from './components/ArticleReaderModal';
import { EventRegistrationModal } from './components/EventRegistrationModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { initAnalytics, trackPageView } from './lib/analytics';

const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ProgramsPage = lazy(() => import('./pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const MediaPage = lazy(() => import('./pages/MediaPage').then((m) => ({ default: m.MediaPage })));
const MembershipPage = lazy(() => import('./pages/MembershipPage').then((m) => ({ default: m.MembershipPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const NewsletterConfirmPage = lazy(() => import('./pages/NewsletterConfirmPage').then((m) => ({ default: m.NewsletterConfirmPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

/** Scrolls to the top of the page on every route change (standard react-router pattern --
 * the browser doesn't do this on its own for client-side navigation). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

/** Fires a GA4 page_view on every route change (F15) -- a no-op with no VITE_GA_MEASUREMENT_ID
 * configured, see src/lib/analytics.ts. Separate from ScrollToTop to keep each concern its own
 * effect, even though both key off the same route change. */
function Analytics() {
  const { pathname } = useLocation();
  useEffect(() => {
    // A tick late so react-helmet-async's own effect (which sets document.title for the new
    // route) has already run -- otherwise this would report the previous page's title.
    const id = setTimeout(() => trackPageView(pathname, document.title), 0);
    return () => clearTimeout(id);
  }, [pathname]);
  return null;
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const location = useLocation();

  // Modal states
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfa] text-[#1a2805] font-sans antialiased selection:bg-[#f3a310]/30">
      <ScrollToTop />
      <Analytics />

      {/* Strict Top Bar Navigation */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Main Page Canvas with Smooth Page Transitions */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: cubicEase }}
          >
            <Suspense fallback={<div className="min-h-screen" />}>
              <Routes location={location}>
                <Route
                  path={ROUTES.home}
                  element={
                    <HomePage
                      language={language}
                      onSelectPost={setSelectedPostSlug}
                      onRegisterEvent={setSelectedEvent}
                    />
                  }
                />
                <Route path={ROUTES.about} element={<AboutPage />} />
                <Route
                  path={ROUTES.programs}
                  element={<ProgramsPage onRegisterEvent={setSelectedEvent} />}
                />
                <Route path={ROUTES.team} element={<TeamPage />} />
                <Route path={ROUTES.media} element={<MediaPage onSelectPost={setSelectedPostSlug} />} />
                <Route path={ROUTES.membership} element={<MembershipPage />} />
                <Route path={ROUTES.contact} element={<ContactPage />} />
                <Route path={PRIVACY_ROUTE} element={<PrivacyPolicyPage />} />
                <Route path={NEWSLETTER_CONFIRM_ROUTE} element={<NewsletterConfirmPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals */}
      <ArticleReaderModal
        slug={selectedPostSlug}
        onClose={() => setSelectedPostSlug(null)}
      />

      <EventRegistrationModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPost={setSelectedPostSlug}
      />
    </div>
  );
}
