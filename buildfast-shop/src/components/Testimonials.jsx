import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useAuth } from '../contexts/AuthContext'
import { logger } from '../utils/logger'

const FALLBACK_TESTIMONIALS = [
  {
    id: 'fallback-1',
    name: 'Ahmed Rahman',
    role: 'Regular Customer',
    rating: 5,
    quote: 'The Kacchi Biryani here is simply amazing! Authentic taste and generous portions. Star Café has become our family\'s go-to spot.',
    avatar: 'AR'
  },
  {
    id: 'fallback-2',
    name: 'Fatima Khan',
    role: 'Food Enthusiast',
    rating: 5,
    quote: 'Love the cozy ambience and friendly service. The family set menu is perfect for gatherings. Highly recommended!',
    avatar: 'FK'
  },
  {
    id: 'fallback-3',
    name: 'Rafiq Hossain',
    role: 'Local Resident',
    rating: 5,
    quote: 'Consistent quality every time. The beef kababs are my favorite. Great value for money and always fresh ingredients.',
    avatar: 'RH'
  }
]

const Testimonials = () => {
  const { settings } = useStoreSettings()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [testimonials, setTestimonials] = useState([])
  const [usingFallback, setUsingFallback] = useState(false)
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  const reviewsEnabled = settings?.show_public_reviews ?? false
  const testimonialsEnabled = settings?.show_home_testimonials ?? true

  useEffect(() => {
    let isMounted = true

    if (!reviewsEnabled || !testimonialsEnabled) {
      setTestimonials([])
      setUsingFallback(false)
      setLoading(false)
      return
    }

    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('product_reviews')
          .select(`
            id,
            rating,
            review_text,
            created_at,
            user_id,
            products ( name )
          `)
          .eq('is_hidden', false)
          .order('rating', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6)

        if (error) throw error
        if (!isMounted) return

        const mapped = (data || []).map((review) => {
          const initials = review.user_id ? review.user_id.substring(0, 2).toUpperCase() : 'CU'
          return {
            id: review.id,
            name: review.user_id ? `Customer ${review.user_id.substring(0, 6)}` : 'Anonymous Customer',
            role: review.products?.name ? `Reviewed ${review.products.name}` : 'Verified Customer',
            rating: review.rating || 0,
            quote: review.review_text?.trim() || 'Left a rating without additional comments.',
            avatar: initials
          }
        })

        if (mapped.length === 0) {
          setTestimonials(FALLBACK_TESTIMONIALS)
          setUsingFallback(true)
        } else {
          setTestimonials(mapped)
          setUsingFallback(false)
        }
      } catch (err) {
        logger.error('Error loading testimonials:', err)
        if (!isMounted) return
        setTestimonials(FALLBACK_TESTIMONIALS)
        setUsingFallback(true)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTestimonials()

    return () => {
      isMounted = false
    }
  }, [reviewsEnabled, testimonialsEnabled])

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  if (!reviewsEnabled || !testimonialsEnabled) {
    return null
  }

  if (loading) {
    const skeletonBg = isLightTheme
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(255, 255, 255, 0.1)';

    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={`testimonial-skeleton-${i}`} className="card-soft space-y-4 animate-pulse">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((star) => (
                <div 
                  key={`skeleton-star-${i}-${star}`} 
                  className="h-5 w-5 rounded"
                  style={{ backgroundColor: skeletonBg }}
                />
              ))}
            </div>
            <div className="h-16 rounded" style={{ backgroundColor: skeletonBg }} />
            <div className="flex items-center gap-3 pt-2">
              <div className="h-12 w-12 rounded-full" style={{ backgroundColor: skeletonBg }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded w-32" style={{ backgroundColor: skeletonBg }} />
                <div className="h-3 rounded w-24" style={{ backgroundColor: skeletonBg }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const visibleTestimonials = testimonials.slice(0, 3)

  return (
    <>
      <div
        data-animate="fade-scale"
        data-animate-active="false"
        className="grid md:grid-cols-3 gap-6"
      >
        {visibleTestimonials.map((testimonial, index) => {
          const stars = Math.round(Math.max(0, Math.min(5, testimonial.rating || 0)))

          return (
            <div
              key={testimonial.id}
              data-animate="rise"
              data-animate-active="false"
              style={{ transitionDelay: `${index * 120}ms` }}
              className="card-soft space-y-4"
            >
              <div className="flex gap-1">
                {[...Array(stars)].map((_, i) => (
                  <svg key={`${testimonial.id}-star-${i}`} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                {[...Array(5 - stars)].map((_, i) => (
                  <svg key={`${testimonial.id}-star-empty-${i}`} className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-muted italic">&quot;{testimonial.quote}&quot;</p>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-black font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {usingFallback && isAdmin && (
        <p className="mt-4 text-xs text-muted text-center">
          Showing sample testimonials until verified reviews are published.
        </p>
      )}
    </>
  )
}

export default Testimonials
