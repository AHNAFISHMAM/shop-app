import PropTypes from 'prop-types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { getBackgroundStyle } from '../utils/backgroundUtils';
import QuickActionsBar from '../components/QuickActionsBar';
import ScrollProgress from '../components/ScrollProgress';

const MainLayout = ({ children }) => {
  const { settings } = useStoreSettings();

  const backgroundStyle = settings ? getBackgroundStyle(settings, 'page') : {};
  // Only apply inline style if it's not using theme variable
  const shouldApplyStyle = backgroundStyle.background && 
    backgroundStyle.background !== 'var(--bg-main)' && 
    backgroundStyle.background !== 'transparent';

  return (
    <div
      className="app-shell min-h-screen flex flex-col overflow-visible"
      style={shouldApplyStyle ? backgroundStyle : {}}
    >
      {/* Skip Navigation Link for Accessibility */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      <ScrollProgress />

      <Navbar />
      <main id="main-content" className="flex-1 overflow-visible" role="main" aria-label="Main content">
        <div className="app-container pt-1 pb-14 md:pt-3 md:pb-16 overflow-visible">
          {children}
        </div>
      </main>
      <div className="app-container pb-4">
        <QuickActionsBar />
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;

MainLayout.propTypes = {
  children: PropTypes.node.isRequired
};
