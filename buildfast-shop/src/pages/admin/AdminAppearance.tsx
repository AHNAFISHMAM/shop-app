import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import BackgroundManager from '../../components/BackgroundManager';
import { logger } from '../../utils/logger';

function AdminAppearance(): JSX.Element {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async (): Promise<void> => {
      setVerifying(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Log in to access admin tools.');
          setIsAdmin(false);
          navigate('/login');
          return;
        }

        const { data, error: customerError } = await supabase
          .from('customers')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (customerError || !data?.is_admin) {
          setError('Access denied. Administrator role required.');
          setIsAdmin(false);
          navigate('/admin');
          return;
        }

        setIsAdmin(true);
        setError('');
      } catch (err) {
        logger.error(err);
        setError('Unable to verify admin permissions.');
        setIsAdmin(false);
        navigate('/admin');
      } finally {
        setVerifying(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  if (verifying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted">Checking admin permissions…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-[0_25px_60px_-45px_rgba(248,113,113,0.6)]">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-main)]">Admin Access Required</h2>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-page w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="bg-theme-elevated rounded-xl sm:rounded-2xl border border-theme p-6 sm:p-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] mb-2">
                Appearance Settings
              </h1>
              <p className="text-sm sm:text-base text-muted max-w-2xl">
                Customize the visual appearance of your website including page backgrounds, colors, and theme-specific designs.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 rounded-xl border border-theme text-muted hover:text-[var(--text-main)] hover:border-[var(--accent)] transition-all duration-200"
            >
              Back to Admin
            </button>
          </div>
        </header>

        {/* Page Backgrounds Section */}
        <section className="space-y-6">
          <div className="bg-theme-elevated rounded-xl border border-theme p-6 shadow-md">
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-2">
              Page Backgrounds
            </h2>
            <p className="text-sm text-muted mb-6">
              Configure background images, colors, and gradients for different pages. Set unique backgrounds for light and dark themes.
            </p>

            {/* Reservations Page Backgrounds */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Reservations Page
                </h3>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Dark Theme Background */}
                  <div className="bg-[var(--bg-main)] rounded-xl border border-theme p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                      <h4 className="font-semibold text-[var(--text-main)]">Dark Theme</h4>
                    </div>
                    <BackgroundManager
                      section="reservation_dark"
                      label="Reservations (Dark)"
                    />
                  </div>

                  {/* Light Theme Background */}
                  <div className="bg-[var(--bg-main)] rounded-xl border border-theme p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
                      <h4 className="font-semibold text-[var(--text-main)]">Light Theme</h4>
                    </div>
                    <BackgroundManager
                      section="reservation_light"
                      label="Reservations (Light)"
                    />
                  </div>
                </div>
              </div>

              {/* Future: Home Page Backgrounds */}
              <div className="opacity-50 pointer-events-none">
                <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home Page
                  <span className="text-xs bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-1 rounded-full">Coming Soon</span>
                </h3>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="bg-[var(--bg-main)] rounded-xl border border-theme p-5 h-32 flex items-center justify-center">
                    <p className="text-muted text-sm">Hero background configuration coming soon</p>
                  </div>
                  <div className="bg-[var(--bg-main)] rounded-xl border border-theme p-5 h-32 flex items-center justify-center">
                    <p className="text-muted text-sm">Hero background configuration coming soon</p>
                  </div>
                </div>
              </div>

              {/* Gallery Section Background */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Gallery Section
                </h3>

                <div className="bg-[var(--bg-main)] rounded-xl border border-theme p-5 space-y-4">
                  <p className="text-sm text-muted">
                    Configure the background for the gallery section that appears on the About page
                  </p>
                  <BackgroundManager
                    section="gallery_section"
                    label="Gallery Section"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Tips */}
        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-0.5">•</span>
              <span>Set different backgrounds for light and dark themes to ensure your design looks great in both modes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-0.5">•</span>
              <span>Use the live preview to see how your background looks before saving</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-0.5">•</span>
              <span>For images, use high-quality photos with at least 1920px width for best results</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent)] mt-0.5">•</span>
              <span>Solid colors and gradients load faster than images and are great for performance</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminAppearance;

