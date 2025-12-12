import { Link } from 'react-router-dom';
import { useStoreSettings } from '../contexts/StoreSettingsContext';

const Footer = () => {
  const { settings, loading: settingsLoading } = useStoreSettings();
  const enableReservations = settingsLoading ? false : (settings?.enable_reservations ?? true);
  
  return (
    <footer className="border-t bg-elevated relative overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_65%)]" />
      <div className="relative z-10 app-container py-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between text-xs text-muted">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-accent">
            Star Café
          </div>
          <div className="text-xs sm:text-xs leading-relaxed">Shuvash Chandra Road, Chitrar Mor, Jessore</div>
          <div className="text-xs sm:text-xs">Phone: 01726-367742</div>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-xs">
          <Link to="/menu" className="hover:text-accent transition min-h-[44px] flex items-center">Menu</Link>
          {enableReservations && (
            <Link to="/reservations" className="hover:text-accent transition min-h-[44px] flex items-center">Reservations</Link>
          )}
          <Link to="/contact" className="hover:text-accent transition min-h-[44px] flex items-center">Contact</Link>
        </div>
        <div className="text-[10px] text-muted opacity-75">
          © {new Date().getFullYear()} Star Café. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
