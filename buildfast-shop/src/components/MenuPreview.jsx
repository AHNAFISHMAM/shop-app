import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const MenuPreview = ({ items = [], showViewAllButton = true }) => {
  return (
    <div className="space-y-8">
      {/* Grid of Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.name}
            className="card-soft hover:shadow-lg transition-all duration-300 group"
          >
            {item.image && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
                {item.name}
              </h3>
              {item.description && (
                <p className="text-sm text-muted line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-accent">
                  ৳{item.price}
                </span>
                {item.category && (
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      {showViewAllButton && (
        <div className="text-center pt-4">
          <Link to="/menu" className="btn-outline">
            View Full Menu
          </Link>
        </div>
      )}
    </div>
  );
};

export default MenuPreview;

MenuPreview.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      image: PropTypes.string,
      description: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      category: PropTypes.string
    })
  ),
  showViewAllButton: PropTypes.bool
};
