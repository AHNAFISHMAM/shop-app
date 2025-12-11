import PropTypes from 'prop-types';

// Home icon
export const HomeIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// Search icon
export const SearchIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// Folder icon
export const FolderIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

// Eye icon (show)
export const EyeIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Eye off icon (hide)
export const EyeOffIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Chevron down icon
export const ChevronDownIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Category group icons (SVG versions)
export const SetMenuIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 3v18" />
  </svg>
);

export const CuisineIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </svg>
);

export const MainDishIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M1 12h6m6 0h6" />
  </svg>
);

export const BreadIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="8" width="18" height="8" rx="2" />
  </svg>
);

export const InternationalIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const LightBitesIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M12 2v20M2 12h20" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const OtherIcon = ({ className = 'w-5 h-5', ...props }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h6v6H9z" />
  </svg>
);

// Add PropTypes
const iconPropTypes = {
  className: PropTypes.string,
};

HomeIcon.propTypes = iconPropTypes;
SearchIcon.propTypes = iconPropTypes;
FolderIcon.propTypes = iconPropTypes;
EyeIcon.propTypes = iconPropTypes;
EyeOffIcon.propTypes = iconPropTypes;
ChevronDownIcon.propTypes = iconPropTypes;
SetMenuIcon.propTypes = iconPropTypes;
CuisineIcon.propTypes = iconPropTypes;
MainDishIcon.propTypes = iconPropTypes;
BreadIcon.propTypes = iconPropTypes;
InternationalIcon.propTypes = iconPropTypes;
LightBitesIcon.propTypes = iconPropTypes;
OtherIcon.propTypes = iconPropTypes;

