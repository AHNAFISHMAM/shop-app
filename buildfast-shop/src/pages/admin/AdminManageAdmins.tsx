import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger';
import { pageFade } from '../../components/animations/menuAnimations';
import { logger } from '../../utils/logger';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

interface Admin {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

function AdminManageAdmins() {
  const navigate = useNavigate();
  const containerRef = useViewportAnimationTrigger();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Admin management state
  const [email, setEmail] = useState('');
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
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
        loadAdmins();
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

  // Load list of admins
  const loadAdmins = async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('list_admins');
      
      if (rpcError) {
        logger.error('Failed to load admins:', rpcError);
        setError('Failed to load admin list: ' + rpcError.message);
        return;
      }

      if (data?.success) {
        setAdmins(data.admins || []);
      } else {
        setError(data?.error || 'Failed to load admin list');
      }
    } catch (err) {
      logger.error('Error loading admins:', err);
      setError('Error loading admin list');
    }
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle add admin
  const handleAddAdmin = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setShowAddConfirm(true);
  };

  // Confirm add admin
  const confirmAddAdmin = async () => {
    setShowAddConfirm(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: rpcError } = await supabase.rpc('add_admin_by_email', {
        target_email: email.trim().toLowerCase()
      });

      if (rpcError) {
        logger.error('Failed to add admin:', rpcError);
        setError('Failed to add admin: ' + rpcError.message);
        return;
      }

      if (data?.success) {
        setSuccess(`Admin privileges granted to ${email.trim()}`);
        setEmail('');
        await loadAdmins();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data?.error || 'Failed to add admin');
      }
    } catch (err) {
      logger.error('Error adding admin:', err);
      setError('Error adding admin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle remove admin
  const handleRemoveAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowRemoveConfirm(true);
  };

  // Confirm remove admin
  const confirmRemoveAdmin = async () => {
    if (!selectedAdmin) return;

    setShowRemoveConfirm(false);
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: rpcError } = await supabase.rpc('remove_admin_by_email', {
        target_email: selectedAdmin.email
      });

      if (rpcError) {
        logger.error('Failed to remove admin:', rpcError);
        setError('Failed to remove admin: ' + rpcError.message);
        return;
      }

      if (data?.success) {
        setSuccess(`Admin privileges removed from ${selectedAdmin.email}`);
        setSelectedAdmin(null);
        await loadAdmins();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data?.error || 'Failed to remove admin');
      }
    } catch (err) {
      logger.error('Error removing admin:', err);
      setError('Error removing admin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-[var(--bg-main)] p-8">
        <div className="text-[var(--text-muted)]">Verifying permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <m.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)]"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ 
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        <header className="mb-8 flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)]">
              Manage Administrators
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[var(--text-muted)]">
              Add or remove administrator privileges by email address
            </p>
          </div>
        </header>

        {success && (
          <div className="mb-6 bg-green-900/20 border border-green-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm sm:text-base font-medium text-green-400">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm sm:text-base font-medium text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Add Admin Section */}
        <div className="mb-8 bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">
            Add Administrator
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Enter the email address of the user you want to grant admin privileges to. The user must have an existing account.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="user@example.com"
                className="w-full min-h-[44px] px-4 sm:px-6 py-3 bg-theme-elevated border border-theme text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#C59D5F] focus:border-transparent placeholder:text-[var(--text-muted)] text-sm sm:text-base"
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddAdmin}
                disabled={loading || !email.trim()}
                className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[#B08D4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] whitespace-nowrap"
              >
                {loading ? 'Processing...' : 'Add Admin'}
              </button>
            </div>
          </div>
        </div>

        {/* Current Admins List */}
        <div className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">
              Current Administrators
            </h2>
            <button
              type="button"
              onClick={loadAdmins}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-[var(--text-main)] bg-theme-elevated border border-theme rounded-lg hover:bg-theme transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh
            </button>
          </div>

          {admins.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <p>No administrators found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-theme rounded-lg border border-theme"
                >
                  <div className="flex-1">
                    <div className="font-medium text-[var(--text-main)]">
                      {admin.full_name || admin.email}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      {admin.email}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      Added: {new Date(admin.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdmin(admin)}
                    disabled={loading || admins.length <= 1}
                    className="px-4 py-2 text-sm font-medium text-red-400 bg-red-900/20 border border-red-800 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title={admins.length <= 1 ? 'Cannot remove the last admin' : 'Remove admin privileges'}
                  >
                    Remove Admin
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAddConfirm}
        onClose={() => setShowAddConfirm(false)}
        onConfirm={confirmAddAdmin}
        title="Confirm Add Administrator"
        message={`Are you sure you want to grant admin privileges to ${email.trim()}?`}
        confirmText="Yes, Add Admin"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Remove Admin Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false);
          setSelectedAdmin(null);
        }}
        onConfirm={confirmRemoveAdmin}
        title="Confirm Remove Administrator"
        message={`Are you sure you want to remove admin privileges from ${selectedAdmin?.email}? This action cannot be undone.`}
        confirmText="Yes, Remove Admin"
        cancelText="Cancel"
        variant="destructive"
      />
    </m.main>
  );
}

export default AdminManageAdmins;

