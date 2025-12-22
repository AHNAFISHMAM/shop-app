import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import ImageUploadModal from '../../components/admin/ImageUploadModal'
import { generatePlaceholderImage } from '../../lib/imageUtils'
import toast from 'react-hot-toast'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { pageFade } from '../../components/animations/menuAnimations'
import { logger } from '../../utils/logger'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropOverlayProps {
  uploadedImage: string | null;
  cropArea: CropArea | null;
  imageRef: React.RefObject<HTMLImageElement>;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeMouseDown: (e: React.MouseEvent, handle: string) => void;
}

// Crop Overlay Component
function CropOverlay({ uploadedImage, cropArea, imageRef, onMouseDown, onResizeMouseDown }: CropOverlayProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

  useEffect(() => {
    if (!imageRef?.current || !uploadedImage) return;

    const img = imageRef.current;
    const updateDimensions = () => {
      if (!img) return;
      setDimensions({
        width: img.offsetWidth,
        height: img.offsetHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(img);

    return () => resizeObserver.disconnect();
  }, [imageRef, uploadedImage]);

  if (!dimensions.naturalWidth || !dimensions.naturalHeight) return null;

  const scaleX = dimensions.width / dimensions.naturalWidth;
  const scaleY = dimensions.height / dimensions.naturalHeight;

  return (
    <div
      className="absolute border-2 border-[#C59D5F] bg-[rgba(197,157,95,0.1)] cursor-move"
      style={{
        left: `${(cropArea?.x || 0) * scaleX}px`,
        top: `${(cropArea?.y || 0) * scaleY}px`,
        width: `${(cropArea?.width || 0) * scaleX}px`,
        height: `${(cropArea?.height || 0) * scaleY}px`,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
      }}
      onMouseDown={onMouseDown}
    >
      {/* Resize handles */}
      {['nw', 'ne', 'sw', 'se'].map(handle => (
        <div
          key={handle}
          className={`absolute w-4 h-4 bg-[#C59D5F] border-2 border-white rounded-full z-10`}
          style={{
            cursor: `${handle}-resize`,
            [handle.includes('n') ? 'top' : 'bottom']: '-8px',
            [handle.includes('w') ? 'left' : 'right']: '-8px'
          }}
          onMouseDown={(e) => onResizeMouseDown(e, handle)}
        />
      ))}
    </div>
  );
}

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'] as const;
const SPICE_LEVELS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Mild 🌶️' },
  { value: 2, label: 'Medium 🌶️🌶️' },
  { value: 3, label: 'Hot 🌶️🌶️🌶️' }
];

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number | string;
  image_url?: string;
  category_id?: string;
  dietary_tags?: string[];
  spice_level?: number;
  prep_time?: string;
  is_available?: boolean;
  is_featured?: boolean;
  is_todays_menu?: boolean;
  is_daily_special?: boolean;
  is_new_dish?: boolean;
  is_discount_combo?: boolean;
  menu_categories?: {
    id: string;
    name: string;
    slug: string;
  };
  [key: string]: unknown;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  sort_order?: number;
}

export default function AdminMenuItems() {
  const containerRef = useViewportAnimationTrigger()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Load 50 items at a time
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [currentItemForImage, setCurrentItemForImage] = useState<MenuItem | null>(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [selectedItemsForBulk, setSelectedItemsForBulk] = useState<Set<string>>(new Set());
  const [bulkToggleLoading, setBulkToggleLoading] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const scrollPositionRef = useRef(0);
  
  // Image upload and crop state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef(null);
  const [showFormCategoryDropdown, setShowFormCategoryDropdown] = useState(false);
  const [showEditFormCategoryDropdown, setShowEditFormCategoryDropdown] = useState(false);
  const formCategoryDropdownRef = useRef(null);
  const editFormCategoryDropdownRef = useRef(null);
  const [showFormSpiceDropdown, setShowFormSpiceDropdown] = useState(false);
  const [showEditFormSpiceDropdown, setShowEditFormSpiceDropdown] = useState(false);
  const formSpiceDropdownRef = useRef(null);
  const editFormSpiceDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    dietary_tags: [],
    spice_level: 0,
    prep_time: '',
    is_available: true,
    is_featured: false,
    is_todays_menu: false,
    is_daily_special: false,
    is_new_dish: false,
    is_discount_combo: false
  });

  // Fetch data
  useEffect(() => {
    fetchCategories();
    setCurrentPage(1);
    setHasMoreItems(true);
    fetchMenuItems(1, true);
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  }

  async function fetchMenuItems(page: number = 1, reset: boolean = true) {
    try {
      if (reset || page === 1) {
        setLoading(true);
      }

      const offset = (page - 1) * itemsPerPage;
      const limit = itemsPerPage;

      // Optimize: Only select needed fields instead of *
      const { data, error, count } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          category_id,
          dietary_tags,
          spice_level,
          prep_time,
          is_available,
          is_featured,
          is_todays_menu,
          is_daily_special,
          is_new_dish,
          is_discount_combo,
          created_at,
          updated_at,
          menu_categories (
            id,
            name,
            slug
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Update items
      if (reset || page === 1) {
        setMenuItems(data || []);
      } else {
        // Append for pagination
        setMenuItems(prev => [...prev, ...(data || [])]);
      }

      // Update pagination state
      setTotalItemsCount(count || 0);
      setHasMoreItems((data?.length || 0) === limit && (count || 0) > offset + limit);
    } catch (error) {
      logger.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }

  const loadMoreItems = async () => {
    if (!hasMoreItems || loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchMenuItems(nextPage, false);
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle form input
  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  // Handle dietary tags
  function toggleDietaryTag(tag) {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }));
  }

  // Add menu item
  async function handleAddItem(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category_id || !formData.price) {
      toast.error('Please fill in required fields');
      return;
    }

    // Validate dietary_tags
    const validTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'spicy'];
    if (formData.dietary_tags && !Array.isArray(formData.dietary_tags)) {
      toast.error('Invalid dietary tags format');
      return;
    }
    const invalidTags = (formData.dietary_tags || []).filter(tag => !validTags.includes(tag));
    if (invalidTags.length > 0) {
      toast.error(`Invalid dietary tags: ${invalidTags.join(', ')}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([{
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          image_url: formData.image_url || null,
          dietary_tags: formData.dietary_tags,
          spice_level: parseInt(formData.spice_level),
          prep_time: formData.prep_time && formData.prep_time.trim() !== '' ? parseInt(formData.prep_time) : null,
          is_available: formData.is_available,
          is_featured: formData.is_featured,
          is_todays_menu: formData.is_todays_menu,
          is_daily_special: formData.is_daily_special,
          is_new_dish: formData.is_new_dish,
          is_discount_combo: formData.is_discount_combo
        }]);

      if (error) throw error;

      toast.success('Menu item added successfully');
      setShowAddForm(false);
      resetForm();
      setCurrentPage(1);
      setHasMoreItems(true);
      fetchMenuItems(1, true);
    } catch (error) {
      logger.error('Error adding item:', error);
      toast.error(error.message || 'Failed to add item');
    }
  }

  // Update menu item
  async function handleUpdateItem(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category_id || !formData.price) {
      toast.error('Please fill in required fields');
      return;
    }

    // Validate dietary_tags
    const validTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'spicy'];
    if (formData.dietary_tags && !Array.isArray(formData.dietary_tags)) {
      toast.error('Invalid dietary tags format');
      return;
    }
    const invalidTags = (formData.dietary_tags || []).filter(tag => !validTags.includes(tag));
    if (invalidTags.length > 0) {
      toast.error(`Invalid dietary tags: ${invalidTags.join(', ')}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          category_id: formData.category_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          image_url: formData.image_url || null,
          dietary_tags: formData.dietary_tags,
          spice_level: parseInt(formData.spice_level),
          prep_time: formData.prep_time && formData.prep_time.trim() !== '' ? parseInt(formData.prep_time) : null,
          is_available: formData.is_available,
          is_featured: formData.is_featured,
          is_todays_menu: formData.is_todays_menu,
          is_daily_special: formData.is_daily_special,
          is_new_dish: formData.is_new_dish,
          is_discount_combo: formData.is_discount_combo,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Menu item updated successfully');
      closeEditModal();
      setCurrentPage(1);
      setHasMoreItems(true);
      fetchMenuItems(1, true);
    } catch (error) {
      logger.error('Error updating item:', error);
      toast.error(error.message || 'Failed to update item');
    }
  }

  // Open delete confirmation
  function openDeleteConfirm(id, name) {
    setItemToDelete({ id, name });
    setShowDeleteConfirm(true);
  }

  // Delete menu item
  async function handleDeleteItem() {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast.success('Menu item deleted');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setCurrentPage(1);
      setHasMoreItems(true);
      fetchMenuItems(1, true);
    } catch (error) {
      logger.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  }

  // Toggle availability
  async function toggleAvailability(item) {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;

      toast.success(`${item.name} is now ${!item.is_available ? 'available' : 'unavailable'}`);
      setCurrentPage(1);
      setHasMoreItems(true);
      fetchMenuItems(1, true);
    } catch (error) {
      logger.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  }

  // Bulk toggle availability
  async function handleBulkToggleAvailability() {
    if (selectedItemsForBulk.size === 0) {
      toast.error('Please select items to toggle');
      return;
    }

    setBulkToggleLoading(true);
    try {
      const selectedIds = Array.from(selectedItemsForBulk);
      const itemsToToggle = menuItems.filter(item => selectedIds.includes(item.id));
      
      // Group by target availability (toggle each to opposite)
      const toMakeAvailable = itemsToToggle.filter(item => !item.is_available).map(item => item.id);
      const toMakeUnavailable = itemsToToggle.filter(item => item.is_available).map(item => item.id);

      // Batch updates
      const updates = [];
      if (toMakeAvailable.length > 0) {
        updates.push(
          supabase
            .from('menu_items')
            .update({ is_available: true })
            .in('id', toMakeAvailable)
        );
      }
      if (toMakeUnavailable.length > 0) {
        updates.push(
          supabase
            .from('menu_items')
            .update({ is_available: false })
            .in('id', toMakeUnavailable)
        );
      }

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw errors[0].error;

      toast.success(`Updated availability for ${selectedItemsForBulk.size} item(s)`);
      setSelectedItemsForBulk(new Set());
      setCurrentPage(1);
      setHasMoreItems(true);
      fetchMenuItems(1, true);
    } catch (error) {
      logger.error('Error bulk toggling availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setBulkToggleLoading(false);
    }
  }

  // Toggle item selection for bulk actions
  function toggleItemSelection(itemId) {
    setSelectedItemsForBulk(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  // Select all items in current view
  function selectAllItems(items) {
    setSelectedItemsForBulk(new Set(items.map(item => item.id)));
  }

  // Deselect all items
  function deselectAllItems() {
    setSelectedItemsForBulk(new Set());
  }

  // Edit item - Opens modal
  function startEdit(item) {
    setEditingItem(item);
    setFormData({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      dietary_tags: item.dietary_tags || [],
      spice_level: item.spice_level || 0,
      prep_time: item.prep_time !== undefined && item.prep_time !== null ? String(item.prep_time) : '',
      is_available: item.is_available,
      is_featured: item.is_featured,
      is_todays_menu: item.is_todays_menu,
      is_daily_special: item.is_daily_special,
      is_new_dish: item.is_new_dish,
      is_discount_combo: item.is_discount_combo
    });
    setShowEditModal(true);
    setShowAddForm(false);
  }

  // Close edit modal
  function closeEditModal() {
    setShowEditModal(false);
    setEditingItem(null);
    resetForm();
    // Reset image upload state
    setUploadedImage(null);
    setCroppedImageUrl(null);
    setCropArea({ x: 0, y: 0, width: 200, height: 200 });
  }

  // Handle image file selection
  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPG, PNG, or WEBP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(event.target.result);
        // Initialize crop area to center, aspect ratio matching card (approximately 16:9)
        const minSize = Math.min(img.width, img.height);
        const cropSize = Math.min(minSize, 400);
        setCropArea({
          x: (img.width - cropSize) / 2,
          y: (img.height - cropSize) / 2,
          width: cropSize,
          height: cropSize
        });
        updateCroppedPreview(event.target.result, {
          x: (img.width - cropSize) / 2,
          y: (img.height - cropSize) / 2,
          width: cropSize,
          height: cropSize
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Update cropped preview
  function updateCroppedPreview(imageSrc, area) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Card image dimensions (matching the card display)
      const cardImageWidth = 400;
      const cardImageHeight = 300;
      
      canvas.width = cardImageWidth;
      canvas.height = cardImageHeight;
      
      // Draw cropped portion, scaled to card size
      ctx.drawImage(
        img,
        area.x, area.y, area.width, area.height,
        0, 0, cardImageWidth, cardImageHeight
      );
      
      setCroppedImageUrl(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageSrc;
  }

  // Handle crop area drag
  function handleCropMouseDown(e) {
    e.preventDefault();
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    const displayWidth = imageRef.current.offsetWidth;
    const displayHeight = imageRef.current.offsetHeight;
    
    const scaleX = displayWidth / naturalWidth;
    const scaleY = displayHeight / naturalHeight;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (cropArea.x * scaleX + rect.left),
      y: e.clientY - (cropArea.y * scaleY + rect.top)
    });
  }

  // Handle crop area resize
  function handleResizeMouseDown(e, handle) {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  }

  // Handle mouse move for drag/resize
  useEffect(() => {
    if (!uploadedImage || (!isDragging && !isResizing) || !imageRef.current) return;

    function handleMouseMove(e) {
      const rect = imageRef.current.getBoundingClientRect();
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;
      const displayWidth = imageRef.current.offsetWidth;
      const displayHeight = imageRef.current.offsetHeight;
      
      const scaleX = displayWidth / naturalWidth;
      const scaleY = displayHeight / naturalHeight;

      if (isDragging) {
        const newX = (e.clientX - dragStart.x - rect.left) / scaleX;
        const newY = (e.clientY - dragStart.y - rect.top) / scaleY;
        
        setCropArea(prev => {
          const newArea = {
            ...prev,
            x: Math.max(0, Math.min(newX, naturalWidth - prev.width)),
            y: Math.max(0, Math.min(newY, naturalHeight - prev.height))
          };
          updateCroppedPreview(uploadedImage, newArea);
          return newArea;
        });
      } else if (isResizing) {
        const deltaX = (e.clientX - dragStart.x) / scaleX;
        const deltaY = (e.clientY - dragStart.y) / scaleY;
        
        setCropArea(prev => {
          let newArea = { ...prev };
          
          if (resizeHandle === 'se') {
            newArea.width = Math.max(50, Math.min(prev.width + deltaX, naturalWidth - prev.x));
            newArea.height = Math.max(50, Math.min(prev.height + deltaY, naturalHeight - prev.y));
          } else if (resizeHandle === 'sw') {
            newArea.width = Math.max(50, Math.min(prev.width - deltaX, prev.x + prev.width));
            newArea.height = Math.max(50, Math.min(prev.height + deltaY, naturalHeight - prev.y));
            newArea.x = Math.max(0, prev.x + deltaX);
          } else if (resizeHandle === 'ne') {
            newArea.width = Math.max(50, Math.min(prev.width + deltaX, naturalWidth - prev.x));
            newArea.height = Math.max(50, Math.min(prev.height - deltaY, prev.y + prev.height));
            newArea.y = Math.max(0, prev.y + deltaY);
          } else if (resizeHandle === 'nw') {
            newArea.width = Math.max(50, Math.min(prev.width - deltaX, prev.x + prev.width));
            newArea.height = Math.max(50, Math.min(prev.height - deltaY, prev.y + prev.height));
            newArea.x = Math.max(0, prev.x + deltaX);
            newArea.y = Math.max(0, prev.y + deltaY);
          }
          
          updateCroppedPreview(uploadedImage, newArea);
          return newArea;
        });
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeHandle, dragStart, uploadedImage, cropArea]);

  // Upload cropped image
  async function handleUploadCroppedImage() {
    if (!uploadedImage || !croppedImageUrl) {
      toast.error('Please select and crop an image first');
      return;
    }

    try {
      setUploadingImage(true);

      // Convert data URL to blob
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${formData.name || 'menu-item'}-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Upload to Supabase
      const { uploadMenuImage } = await import('../../lib/imageUtils');
      const result = await uploadMenuImage(file, formData.name || 'Menu Item', {
        title: formData.name,
        altText: formData.description || formData.name
      });

      if (result.success) {
        setFormData(prev => ({ ...prev, image_url: result.url }));
        setUploadedImage(null);
        setCroppedImageUrl(null);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      logger.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }

  // Reset form
  function resetForm() {
    if (!showEditModal) {
      setEditingItem(null);
    }
    setShowAddForm(false);
    setFormData({
      category_id: '',
      name: '',
      description: '',
      price: '',
      image_url: '',
      dietary_tags: [],
      spice_level: 0,
      prep_time: '',
      is_available: true,
      is_featured: false,
      is_todays_menu: false,
      is_daily_special: false,
      is_new_dish: false,
      is_discount_combo: false
    });
  }

  // Body scroll lock for modal
  useEffect(() => {
    if (!showEditModal) return;

    scrollPositionRef.current = window.scrollY || window.pageYOffset || 0;
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.position = originalStyle.position || '';
      document.body.style.top = originalStyle.top || '';
      document.body.style.width = originalStyle.width || '';
      document.body.style.overflow = originalStyle.overflow || '';
      document.body.classList.remove('modal-open');
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [showEditModal]);

  // Keyboard handler for edit modal
  useEffect(() => {
    if (!showEditModal) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeEditModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal]);

  // Body scroll lock for availability modal
  useEffect(() => {
    if (!showAvailabilityModal) return;

    scrollPositionRef.current = window.scrollY || window.pageYOffset || 0;
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.position = originalStyle.position || '';
      document.body.style.top = originalStyle.top || '';
      document.body.style.width = originalStyle.width || '';
      document.body.style.overflow = originalStyle.overflow || '';
      document.body.classList.remove('modal-open');
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [showAvailabilityModal]);

  // Keyboard handler for availability modal
  useEffect(() => {
    if (!showAvailabilityModal) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowAvailabilityModal(false);
        setModalSearchTerm('');
        setSelectedItemsForBulk(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAvailabilityModal]);

  // Close category dropdown when clicking outside (but not on tab buttons)
  useEffect(() => {
    function handleClickOutside(event) {
      // Don't close if clicking inside the dropdown menu (for tab-like behavior)
      const dropdownMenu = document.querySelector('[role="tab"]')?.closest('.fixed');
      if (dropdownMenu && dropdownMenu.contains(event.target)) {
        return;
      }
      
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    }

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown]);

  // Open image modal for item
  function openImageModal(item) {
    setCurrentItemForImage(item);
    setShowImageModal(true);
  }

  // Handle image uploaded
  async function handleImageUploaded(url) {
    if (!currentItemForImage) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ image_url: url })
        .eq('id', currentItemForImage.id);

      if (error) throw error;

      toast.success('Image updated successfully');
      setCurrentPage(1);
      setHasMoreItems(true);
      fetchMenuItems(1, true);
    } catch (error) {
      logger.error('Error updating image:', error);
      toast.error('Failed to update image');
    }
  }


  // Get image display with proper validation
  function getImageDisplay(item) {
    if (item.image_url && item.image_url.trim() !== '') {
      // Add cache-busting timestamp to FORCE browser reload
      const url = item.image_url.trim();
      const separator = url.includes('?') ? '&' : '?';
      const cacheBustedUrl = `${url}${separator}refresh=${imageRefreshKey}`;
      logger.log(`Displaying image for ${item.name}:`, cacheBustedUrl);
      return cacheBustedUrl;
    }
    logger.log(`Using placeholder for ${item.name}`);
    return generatePlaceholderImage(item.name);
  }

  if (loading) {
    return (
      <div className="h-full min-h-[400px] bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center">
        <div
          className="text-center"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-text-muted">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <m.main
      ref={containerRef}
      className="w-full min-h-screen bg-gradient-to-br from-[var(--bg-main)] via-[var(--bg-main)] to-[#0a0a0f] text-[var(--text-main)]"
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
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Modern Glassmorphism Header */}
        <header 
          className="relative mb-8 sm:mb-10 md:mb-12 overflow-hidden rounded-2xl sm:rounded-3xl border border-[rgba(197,157,95,0.15)] bg-gradient-to-br from-[rgba(255,255,255,0.05)] via-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 sm:p-8 md:p-10" 
          data-animate="fade-rise" 
          data-animate-active="false"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(197,157,95,0.1)] via-transparent to-transparent opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(197,157,95,0.15)] text-[rgba(197,157,95,1)] text-xs font-semibold uppercase tracking-wider mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Menu Management
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--text-main)] via-[rgba(197,157,95,0.9)] to-[var(--text-main)] bg-clip-text text-transparent mb-3">
                  Menu Items
                </h1>
                <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed">
                  Manage your Star Café menu items with powerful image controls and real-time updates
                </p>
              </div>
              
              {/* Items Count - Right Upper Corner - Clickable */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    setShowAvailabilityModal(true);
                    setModalSearchTerm('');
                    setSelectedItemsForBulk(new Set());
                  }}
                  className="px-4 py-2 rounded-lg bg-[rgba(197,157,95,0.15)] border border-[rgba(197,157,95,0.3)] hover:bg-[rgba(197,157,95,0.25)] hover:border-[rgba(197,157,95,0.5)] transition-all duration-200 cursor-pointer"
                  aria-label="Manage item availability"
                >
                  <span className="text-[#C59D5F] font-bold text-lg sm:text-xl">{filteredItems.length}</span>
                  <span className="text-[var(--text-muted)] text-sm sm:text-base ml-2">items</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Modern Floating Toolbar */}
        <div
          className="mb-6 sm:mb-8 relative"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="relative rounded-lg sm:rounded-xl border-2 border-[rgba(197,157,95,0.25)] bg-gradient-to-br from-[rgba(255,255,255,0.1)] via-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.25)] p-3 sm:p-4">
            {/* New Item Button + Search Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4">
              {/* New Item Button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="group inline-flex items-center justify-center gap-2.5 px-5 py-3 sm:py-3.5 min-h-[48px] text-sm sm:text-base font-semibold text-[#0a0a0f] bg-gradient-to-r from-[#C59D5F] via-[#D4AF6A] to-[#C59D5F] hover:from-[#D4AF6A] hover:via-[#E5C17A] hover:to-[#D4AF6A] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Item</span>
              </button>

              {/* Search Bar with Icon Filter */}
              <div className="relative flex items-center flex-1 min-w-[280px] sm:min-w-[350px]">
                  {/* Search Icon */}
                  <svg 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(197,157,95,0.6)] pointer-events-none z-10" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  
                  {/* Search Input */}
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-12 pr-20 sm:pr-24 py-3 sm:py-3.5 min-h-[48px] text-sm sm:text-base bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm"
                    aria-label="Search menu items"
                  />
                  
                  {/* Category Filter Icon Button */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      aria-label={`Filter by category${selectedCategory !== 'all' ? `: ${categories.find(c => c.id === selectedCategory)?.name || 'Selected'}` : ''}`}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        selectedCategory !== 'all'
                          ? 'bg-[rgba(197,157,95,0.2)] text-[#C59D5F]'
                          : 'text-[rgba(197,157,95,0.6)] hover:text-[rgba(197,157,95,0.9)] hover:bg-[rgba(197,157,95,0.1)]'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {selectedCategory !== 'all' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#C59D5F] rounded-full border-2 border-[var(--bg-main)]"></span>
                      )}
                    </button>
                  </div>
                  
                  {/* Category Dropdown Portal - Rendered outside DOM hierarchy */}
                  {showCategoryDropdown && typeof document !== 'undefined' && createPortal(
                    <>
                      {/* Backdrop Overlay */}
                      <div 
                        className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowCategoryDropdown(false)}
                        aria-hidden="true"
                      />
                      
                      {/* Dropdown Menu - Fixed Position with Tab-like Behavior */}
                      {(() => {
                        const buttonRect = categoryDropdownRef.current?.querySelector('button')?.getBoundingClientRect();
                        if (!buttonRect) return null;
                        
                        // Calculate max height for 5 items (each ~40px + padding)
                        const itemHeight = 40; // Approximate height per item
                        const maxVisibleItems = 5;
                        const maxHeight = (itemHeight * maxVisibleItems) + 16; // 16px for padding
                        
                        // Combine "All Categories" with categories
                        const allOptions = [
                          { id: 'all', name: 'All Categories' },
                          ...categories
                        ];
                        
                        return (
                          <div 
                            className="fixed w-56 bg-[var(--bg-main)] border-2 border-[rgba(197,157,95,0.3)] rounded-xl shadow-2xl z-[9999] overflow-hidden"
                            style={{
                              top: `${buttonRect.bottom + 8}px`,
                              right: `${window.innerWidth - buttonRect.right}px`,
                              maxHeight: `${maxHeight}px`
                            }}
                          >
                            {/* Scrollable Container */}
                            <div 
                              className="overflow-y-auto max-h-full dropdown-scrollbar" 
                              style={{ maxHeight: `${maxHeight}px` }}
                            >
                              <div className="p-2">
                                {allOptions.length > 0 ? (
                                  allOptions.map(option => {
                                    const isActive = selectedCategory === option.id;
                                    return (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedCategory(option.id);
                                          // Keep dropdown open for tab-like behavior
                                          // setShowCategoryDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 last:mb-0 ${
                                          isActive
                                            ? 'bg-[rgba(197,157,95,0.25)] text-[#C59D5F] font-semibold shadow-sm'
                                            : 'text-[var(--text-main)] hover:bg-[rgba(197,157,95,0.1)] hover:text-[rgba(197,157,95,0.9)]'
                                        }`}
                                        role="tab"
                                        aria-selected={isActive}
                                        aria-controls="category-tabpanel"
                                      >
                                        <span className="flex items-center justify-between">
                                          <span>{option.name}</span>
                                          {isActive && (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                        </span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="px-4 py-2.5 text-sm text-[var(--text-muted)]">
                                    No categories available
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Scroll Indicator */}
                            {allOptions.length > maxVisibleItems && (
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent pointer-events-none flex flex-col items-center justify-end pb-2">
                                <span className="text-[10px] text-[rgba(197,157,95,0.7)] font-medium mb-1">Scroll for more</span>
                                <svg className="w-5 h-5 text-[rgba(197,157,95,0.8)] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>,
                    document.body
                  )}
                  
                  {/* Clear Search Button */}
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-12 sm:right-14 top-1/2 -translate-y-1/2 p-1.5 text-[rgba(197,157,95,0.6)] hover:text-[rgba(197,157,95,0.9)] transition-colors rounded"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
              </div>
            </div>

          </div>
        </div>

        {/* Add Form - Inline (No Modal) */}
        {showAddForm && !editingItem && (
          <>
            {/* Header Container - Only wraps title and description */}
            <div
              className="relative mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl border-2 border-[rgba(197,157,95,0.25)] bg-gradient-to-br from-[rgba(255,255,255,0.1)] via-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)] p-4 sm:p-5 md:p-6"
              data-animate="fade-scale"
              data-animate-active="false"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C59D5F] via-[#D4AF6A] to-[#C59D5F]"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-1">
                      Add New Menu Item
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                      Create a new menu item for your café
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Contents - Outside container with different style */}
            <form onSubmit={handleAddItem} className="mb-8 sm:mb-10 md:mb-12 space-y-6 sm:space-y-8 relative z-10 pointer-events-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8">
                {/* Category */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                    Category <span className="text-[#C59D5F]">*</span>
                  </label>
                  <div className="relative" ref={formCategoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowFormCategoryDropdown(!showFormCategoryDropdown)}
                      className={`w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300 cursor-pointer backdrop-blur-sm flex items-center justify-between ${
                        !formData.category_id ? 'text-[var(--text-muted)]' : ''
                      }`}
                      aria-label="Select category"
                      aria-expanded={showFormCategoryDropdown}
                      aria-haspopup="listbox"
                    >
                      <span>{formData.category_id ? categories.find(c => c.id === formData.category_id)?.name || 'Select category...' : 'Select category...'}</span>
                      <svg className={`w-5 h-5 transition-transform duration-300 ${showFormCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Category Dropdown Portal */}
                    {showFormCategoryDropdown && typeof document !== 'undefined' && createPortal(
                      <>
                        {/* Backdrop Overlay */}
                        <div 
                          className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-sm"
                          onClick={() => setShowFormCategoryDropdown(false)}
                          aria-hidden="true"
                        />
                        
                        {/* Dropdown Menu */}
                        {(() => {
                          const buttonRect = formCategoryDropdownRef.current?.querySelector('button')?.getBoundingClientRect();
                          if (!buttonRect) return null;
                          
                          const itemHeight = 40;
                          const maxVisibleItems = 5;
                          const maxHeight = (itemHeight * maxVisibleItems) + 16;
                          
                          return (
                            <div 
                              className="fixed w-56 bg-[var(--bg-main)] border-2 border-[rgba(197,157,95,0.3)] rounded-xl shadow-2xl z-[100000] overflow-hidden"
                              style={{
                                top: `${buttonRect.bottom + 8}px`,
                                left: `${buttonRect.left}px`,
                                maxHeight: `${maxHeight}px`
                              }}
                              role="listbox"
                            >
                              {/* Scrollable Container */}
                              <div 
                                className="overflow-y-auto max-h-full dropdown-scrollbar" 
                                style={{ maxHeight: `${maxHeight}px` }}
                              >
                                <div className="p-2">
                                  {categories.length > 0 ? (
                                    categories.map(cat => {
                                      const isSelected = formData.category_id === cat.id;
                                      return (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => {
                                            setFormData(prev => ({ ...prev, category_id: cat.id }));
                                            setShowFormCategoryDropdown(false);
                                          }}
                                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 last:mb-0 ${
                                            isSelected
                                              ? 'bg-[rgba(197,157,95,0.25)] text-[#C59D5F] font-semibold shadow-sm'
                                              : 'text-[var(--text-main)] hover:bg-[rgba(197,157,95,0.1)] hover:text-[rgba(197,157,95,0.9)]'
                                          }`}
                                          role="option"
                                          aria-selected={isSelected}
                                        >
                                          <span className="flex items-center justify-between">
                                            <span>{cat.name}</span>
                                            {isSelected && (
                                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            )}
                                          </span>
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <div className="px-4 py-2.5 text-sm text-[var(--text-muted)]">
                                      No categories available
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Scroll Indicator */}
                              {categories.length > maxVisibleItems && (
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent pointer-events-none flex flex-col items-center justify-end pb-2">
                                  <span className="text-[10px] text-[rgba(197,157,95,0.7)] font-medium mb-1">Scroll for more</span>
                                  <svg className="w-5 h-5 text-[rgba(197,157,95,0.8)] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>,
                      document.body
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                    Dish Name <span className="text-[#C59D5F]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-0 focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm"
                    placeholder="e.g., Chicken Tikka Masala"
                    required
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                    Price (BDT) <span className="text-[#C59D5F]">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-0 focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm"
                    placeholder="250"
                    step="0.01"
                    required
                  />
                </div>

                {/* Prep Time */}
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                    Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="prep_time"
                    value={formData.prep_time}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-0 focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 sm:py-5 min-h-[120px] sm:min-h-[140px] bg-[rgba(255,255,255,0.05)] border-0 focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm resize-none"
                  placeholder="Brief description of the dish"
                  rows="4"
                />
              </div>

              {/* Image URL with Manage Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)]">
                    Image URL
                  </label>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => openImageModal(editingItem)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#C59D5F] to-[#D4AF6A] text-[#0a0a0f] text-sm font-semibold hover:from-[#D4AF6A] hover:to-[#E5C17A] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      Manage Image
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm"
                  placeholder="/images/menu/dish-name.webp"
                />
              </div>

              {/* Spice Level */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                  Spice Level
                </label>
                <div className="relative" ref={formSpiceDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowFormSpiceDropdown(!showFormSpiceDropdown)}
                    className={`w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300 cursor-pointer backdrop-blur-sm flex items-center justify-between ${
                      formData.spice_level === undefined || formData.spice_level === '' ? 'text-[var(--text-muted)]' : ''
                    }`}
                    aria-label="Select spice level"
                    aria-expanded={showFormSpiceDropdown}
                    aria-haspopup="listbox"
                  >
                    <span>{SPICE_LEVELS.find(l => l.value === formData.spice_level)?.label || 'Select spice level...'}</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${showFormSpiceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Spice Level Dropdown Portal */}
                  {showFormSpiceDropdown && typeof document !== 'undefined' && createPortal(
                    <>
                      {/* Backdrop Overlay */}
                      <div 
                        className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowFormSpiceDropdown(false)}
                        aria-hidden="true"
                      />
                      
                      {/* Dropdown Menu */}
                      {(() => {
                        const buttonRect = formSpiceDropdownRef.current?.querySelector('button')?.getBoundingClientRect();
                        if (!buttonRect) return null;
                        
                        const itemHeight = 40;
                        const maxVisibleItems = 5;
                        const maxHeight = (itemHeight * maxVisibleItems) + 16;
                        
                        return (
                          <div 
                            className="fixed w-56 bg-[var(--bg-main)] border-2 border-[rgba(197,157,95,0.3)] rounded-xl shadow-2xl z-[100000] overflow-hidden"
                            style={{
                              top: `${buttonRect.bottom + 8}px`,
                              left: `${buttonRect.left}px`,
                              maxHeight: `${maxHeight}px`
                            }}
                            role="listbox"
                          >
                            {/* Scrollable Container */}
                            <div 
                              className="overflow-y-auto max-h-full dropdown-scrollbar" 
                              style={{ maxHeight: `${maxHeight}px` }}
                            >
                              <div className="p-2">
                                {SPICE_LEVELS.length > 0 ? (
                                  SPICE_LEVELS.map(level => {
                                    const isSelected = formData.spice_level === level.value;
                                    return (
                                      <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, spice_level: level.value }));
                                          setShowFormSpiceDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 last:mb-0 ${
                                          isSelected
                                            ? 'bg-[rgba(197,157,95,0.25)] text-[#C59D5F] font-semibold shadow-sm'
                                            : 'text-[var(--text-main)] hover:bg-[rgba(197,157,95,0.1)] hover:text-[rgba(197,157,95,0.9)]'
                                        }`}
                                        role="option"
                                        aria-selected={isSelected}
                                      >
                                        <span className="flex items-center justify-between">
                                          <span>{level.label}</span>
                                          {isSelected && (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                        </span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="px-4 py-2.5 text-sm text-[var(--text-muted)]">
                                    No spice levels available
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Scroll Indicator */}
                            {SPICE_LEVELS.length > maxVisibleItems && (
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent pointer-events-none flex flex-col items-center justify-end pb-2">
                                <span className="text-[10px] text-[rgba(197,157,95,0.7)] font-medium mb-1">Scroll for more</span>
                                <svg className="w-5 h-5 text-[rgba(197,157,95,0.8)] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>,
                    document.body
                  )}
                </div>
              </div>

              {/* Dietary Tags */}
              <div className="space-y-2">
                <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                  Dietary Tags
                </label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {DIETARY_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietaryTag(tag)}
                      className={`px-5 py-2.5 sm:px-6 sm:py-3 min-h-[44px] rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
                        formData.dietary_tags.includes(tag)
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg scale-105'
                          : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] border-0 hover:text-[var(--text-main)]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 p-5 sm:p-6 rounded-lg bg-[rgba(255,255,255,0.03)] border-0">
                {[
                  { name: 'is_available', label: 'Available' },
                  { name: 'is_featured', label: "Chef's Pick" },
                  { name: 'is_todays_menu', label: "Today's Menu" },
                  { name: 'is_daily_special', label: 'Daily Special' },
                  { name: 'is_new_dish', label: 'New Dish' },
                  { name: 'is_discount_combo', label: 'Discount Combo' }
                ].map(toggle => (
                  <label key={toggle.name} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name={toggle.name}
                      checked={formData[toggle.name]}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-[#C59D5F] focus:ring-2 focus:ring-[#C59D5F] rounded border-2 border-[rgba(197,157,95,0.3)] bg-[rgba(255,255,255,0.05)] transition-all duration-300"
                    />
                    <span className="text-sm sm:text-base text-[var(--text-main)] group-hover:text-[#C59D5F] transition-colors">{toggle.label}</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[rgba(197,157,95,0.15)]">
                <button 
                  type="submit" 
                  className="flex-1 sm:flex-none px-8 py-4 min-h-[52px] text-base sm:text-lg font-semibold text-[#0a0a0f] bg-gradient-to-r from-[#C59D5F] via-[#D4AF6A] to-[#C59D5F] hover:from-[#D4AF6A] hover:via-[#E5C17A] hover:to-[#D4AF6A] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Add Item
                </button>
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="flex-1 sm:flex-none px-8 py-4 min-h-[52px] text-base sm:text-lg font-medium text-[var(--text-main)] border-0 bg-[rgba(197,157,95,0.05)] hover:bg-[rgba(197,157,95,0.15)] rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {/* Ultra-Compact Cards Grid - Max 3 per row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-[rgba(197,157,95,0.15)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] via-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] backdrop-blur-lg shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_24px_rgba(197,157,95,0.25)] hover:border-[rgba(197,157,95,0.3)] transition-all duration-300 flex flex-col h-full hover:scale-[1.01]"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: `${index * 40}ms` }}
            >
              {/* Image Section - Half of Card Height */}
              <div className="relative bg-[var(--bg-main)] overflow-hidden flex-shrink-0">
                <img
                  key={`${item.id}-${imageRefreshKey}`}
                  src={getImageDisplay(item)}
                  alt={item.name}
                  className="w-full h-32 sm:h-40 md:h-48 object-cover bg-[var(--bg-main)] transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                  onLoad={(e) => {
                    logger.log(`Image loaded successfully for ${item.name}`);
                    e.target.style.opacity = '1';
                  }}
                  onError={(e) => {
                    logger.error(`FAILED to load image for ${item.name}:`);
                    logger.error(`   URL: ${e.target.src}`);
                    logger.error(`   Falling back to placeholder`);
                    e.target.src = generatePlaceholderImage(item.name);
                  }}
                  style={{ opacity: 1, transition: 'opacity 0.3s' }}
                />

                {/* Status Badges */}
                {!item.is_available && (
                  <div className="absolute top-1.5 right-1.5 bg-red-600 text-black px-2 py-0.5 rounded-md text-[10px] font-semibold z-10">
                    Unavailable
                  </div>
                )}
                {item.is_featured && (
                  <div className="absolute top-1.5 left-1.5 bg-gold text-dark-bg px-2 py-0.5 rounded-md text-[10px] font-semibold z-10">
                    ⭐ Featured
                  </div>
                )}
              </div>

              {/* Compact Content Section */}
              <div className="flex flex-col flex-1 p-3 sm:p-3.5">
                {/* Title & Category */}
                <div className="mb-2">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] mb-1 leading-tight line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-[rgba(197,157,95,0.12)] border border-[rgba(197,157,95,0.25)]">
                    <p className="text-[10px] sm:text-xs text-[rgba(197,157,95,0.9)] font-medium">
                      {item.menu_categories?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>

                {/* Description - Compact */}
                {item.description && (
                  <p className="text-xs text-[var(--text-muted)] mb-2 line-clamp-1 leading-snug">
                    {item.description}
                  </p>
                )}

                {/* Price & Prep Time - Compact */}
                <div className="flex items-center justify-between mb-2 p-2 rounded-lg bg-[rgba(197,157,95,0.08)] border border-[rgba(197,157,95,0.15)]">
                  <span className="text-base sm:text-lg font-bold text-[#C59D5F]">
                    ৳{typeof item.price === 'number' ? item.price.toFixed(0) : parseFloat(item.price || 0).toFixed(0)}
                  </span>
                  {item.prep_time && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.05)]">
                      <span className="text-xs">⏱️</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">
                        {item.prep_time}m
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags - Compact */}
                {(item.spice_level > 0 || item.dietary_tags?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {item.spice_level > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.25)] text-red-400 text-[10px] font-medium">
                        {'🌶️'.repeat(item.spice_level)}
                      </span>
                    )}
                    {item.dietary_tags?.slice(0, 2).map(tag => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.25)] text-green-400 text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Compact Action Buttons - Uniform Size */}
                <div className="mt-auto pt-2 border-t border-[rgba(197,157,95,0.15)]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all duration-200 ${
                        item.is_available
                          ? 'bg-green-600 text-black hover:bg-green-700'
                          : 'bg-[rgba(107,114,128,0.3)] text-[var(--text-main)] border border-[rgba(107,114,128,0.4)]'
                      }`}
                    >
                      {item.is_available ? '✓' : '✕'}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="px-3 py-1.5 min-h-[36px] bg-[#C59D5F] text-[#0a0a0f] rounded-lg hover:bg-[#D4AF6A] transition-all duration-200 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(item.id, item.name)}
                      className="px-3 py-1.5 min-h-[36px] bg-red-600 text-black rounded-lg hover:bg-red-700 transition-all duration-200 text-xs font-semibold"
                      aria-label="Delete item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modern Empty State */}
        {/* Load More Button */}
        {hasMoreItems && filteredItems.length > 0 && !loading && (
          <div className="flex justify-center pt-6 sm:pt-8">
            <button
              onClick={loadMoreItems}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[rgba(197,157,95,0.3)] bg-[rgba(197,157,95,0.1)] px-6 py-3 text-sm sm:text-base font-medium text-[var(--text-main)] transition hover:border-[rgba(197,157,95,0.5)] hover:bg-[rgba(197,157,95,0.2)] min-h-[44px]"
              aria-label="Load more menu items"
            >
              <span>Load More Items</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Show total count */}
        {filteredItems.length > 0 && (
          <div className="text-center pt-4 text-sm text-[var(--text-muted)]">
            Showing {filteredItems.length} of {totalItemsCount} items
          </div>
        )}

        {filteredItems.length === 0 && !loading && (
          <div
            className="relative overflow-hidden rounded-3xl border-2 border-[rgba(197,157,95,0.2)] bg-gradient-to-br from-[rgba(255,255,255,0.08)] via-[rgba(255,255,255,0.04)] to-[rgba(255,255,255,0.02)] backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] p-12 sm:p-16 md:p-20 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(197,157,95,0.05)] via-transparent to-transparent"></div>
            <div className="relative z-10">
              <div className="text-7xl sm:text-8xl mb-6 animate-bounce">🍽️</div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-main)] mb-4 bg-gradient-to-r from-[var(--text-main)] via-[rgba(197,157,95,0.9)] to-[var(--text-main)] bg-clip-text text-transparent">
                No menu items found
              </h3>
              <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your filters or search terms to find what you\'re looking for'
                  : 'Add your first menu item to get started building your café menu'}
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-8 inline-flex items-center gap-2.5 px-8 py-4 min-h-[52px] text-base sm:text-lg font-semibold text-[#0a0a0f] bg-gradient-to-r from-[#C59D5F] via-[#D4AF6A] to-[#C59D5F] hover:from-[#D4AF6A] hover:via-[#E5C17A] hover:to-[#D4AF6A] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.05] active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Item
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showEditModal && editingItem && (
            <m.div
              className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm overflow-y-auto z-[99998]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-menu-item-title"
              onClick={closeEditModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                minHeight: '100vh',
                paddingTop: '1rem',
                paddingBottom: '1rem'
              }}
            >
              <m.div
                className="relative w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl sm:rounded-3xl border-2 border-[rgba(197,157,95,0.3)] bg-[var(--bg-main)] shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-[99999]"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C59D5F] via-[#D4AF6A] to-[#C59D5F]"></div>

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 sm:p-8 border-b border-[rgba(197,157,95,0.2)] bg-[var(--bg-main)]">
                  <div>
                    <h2 id="edit-menu-item-title" className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-main)] mb-2">
                      Edit Menu Item
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--text-muted)]">
                      Update item details and settings
                    </p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C59D5F]"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6 text-[var(--text-main)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form Content */}
                <div className="p-6 sm:p-8 md:p-10 lg:p-12">
                  <form onSubmit={handleUpdateItem} className="space-y-6 sm:space-y-8 relative z-10 pointer-events-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8">
                      {/* Category */}
                      <div className="space-y-2">
                        <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                          Category <span className="text-[#C59D5F]">*</span>
                        </label>
                        <div className="relative" ref={editFormCategoryDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setShowEditFormCategoryDropdown(!showEditFormCategoryDropdown)}
                            className={`w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300 cursor-pointer backdrop-blur-sm flex items-center justify-between ${
                              !formData.category_id ? 'text-[var(--text-muted)]' : ''
                            }`}
                            aria-label="Select category"
                            aria-expanded={showEditFormCategoryDropdown}
                            aria-haspopup="listbox"
                          >
                            <span>{formData.category_id ? categories.find(c => c.id === formData.category_id)?.name || 'Select category...' : 'Select category...'}</span>
                            <svg className={`w-5 h-5 transition-transform duration-300 ${showEditFormCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {/* Category Dropdown Portal */}
                          {showEditFormCategoryDropdown && typeof document !== 'undefined' && createPortal(
                            <>
                              {/* Backdrop Overlay */}
                              <div 
                                className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-sm"
                                onClick={() => setShowEditFormCategoryDropdown(false)}
                                aria-hidden="true"
                              />
                              
                              {/* Dropdown Menu */}
                              {(() => {
                                const buttonRect = editFormCategoryDropdownRef.current?.querySelector('button')?.getBoundingClientRect();
                                if (!buttonRect) return null;
                                
                                const itemHeight = 40;
                                const maxVisibleItems = 5;
                                const maxHeight = (itemHeight * maxVisibleItems) + 16;
                                
                                return (
                                  <div 
                                    className="fixed w-56 bg-[var(--bg-main)] border-2 border-[rgba(197,157,95,0.3)] rounded-xl shadow-2xl z-[100000] overflow-hidden"
                                    style={{
                                      top: `${buttonRect.bottom + 8}px`,
                                      left: `${buttonRect.left}px`,
                                      maxHeight: `${maxHeight}px`
                                    }}
                                    role="listbox"
                                  >
                                    {/* Scrollable Container */}
                                    <div className="overflow-y-auto max-h-full" style={{ maxHeight: `${maxHeight}px` }}>
                                      <div className="p-2">
                                        {categories.length > 0 ? (
                                          categories.map(cat => {
                                            const isSelected = formData.category_id === cat.id;
                                            return (
                                              <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                  setFormData(prev => ({ ...prev, category_id: cat.id }));
                                                  setShowEditFormCategoryDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 last:mb-0 ${
                                                  isSelected
                                                    ? 'bg-[rgba(197,157,95,0.25)] text-[#C59D5F] font-semibold shadow-sm'
                                                    : 'text-[var(--text-main)] hover:bg-[rgba(197,157,95,0.1)] hover:text-[rgba(197,157,95,0.9)]'
                                                }`}
                                                role="option"
                                                aria-selected={isSelected}
                                              >
                                                <span className="flex items-center justify-between">
                                                  <span>{cat.name}</span>
                                                  {isSelected && (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                  )}
                                                </span>
                                              </button>
                                            );
                                          })
                                        ) : (
                                          <div className="px-4 py-2.5 text-sm text-[var(--text-muted)]">
                                            No categories available
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Scroll Indicator */}
                                    {categories.length > maxVisibleItems && (
                                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent pointer-events-none flex flex-col items-center justify-end pb-2">
                                        <span className="text-[10px] text-[rgba(197,157,95,0.7)] font-medium mb-1">Scroll for more</span>
                                        <svg className="w-5 h-5 text-[rgba(197,157,95,0.8)] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </>,
                            document.body
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <div className="space-y-2">
                        <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                          Dish Name <span className="text-[#C59D5F]">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-0 focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm"
                          placeholder="e.g., Chicken Tikka Masala"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div className="space-y-2">
                        <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                          Price (BDT) <span className="text-[#C59D5F]">*</span>
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-0 focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm"
                          placeholder="250"
                          step="0.01"
                          required
                        />
                      </div>

                      {/* Prep Time */}
                      <div className="space-y-2">
                        <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                          Prep Time (minutes)
                        </label>
                        <input
                          type="number"
                          name="prep_time"
                          value={formData.prep_time}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-0 focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm"
                          placeholder="30"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 sm:py-5 min-h-[120px] sm:min-h-[140px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-xl text-sm sm:text-base text-[var(--text-main)] placeholder-[var(--text-muted)] transition-all duration-300 backdrop-blur-sm resize-none"
                        placeholder="Brief description of the dish"
                        rows="4"
                      />
                    </div>

                    {/* Image Upload with Crop & Preview */}
                    <div className="space-y-4">
                      <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)]">
                        Image Upload
                      </label>
                      
                      {!uploadedImage ? (
                        <div className="space-y-3">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[rgba(197,157,95,0.3)] rounded-xl bg-[rgba(255,255,255,0.02)] hover:border-[rgba(197,157,95,0.5)] cursor-pointer transition-all duration-300">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-10 h-10 mb-3 text-[rgba(197,157,95,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mb-2 text-sm text-[var(--text-main)]">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">PNG, JPG, WEBP (MAX. 5MB)</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                          
                          {formData.image_url && (
                            <div className="mt-3">
                              <label className="block text-xs text-[var(--text-muted)] mb-2">Current Image URL:</label>
                              <input
                                type="text"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 min-h-[44px] bg-[rgba(255,255,255,0.05)] border border-[rgba(197,157,95,0.2)] rounded-lg text-sm text-[var(--text-main)] placeholder-[var(--text-muted)]"
                                placeholder="/images/menu/dish-name.webp"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Crop Area */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-[var(--text-main)]">Crop Image</h4>
                            <div className="relative border-2 border-[rgba(197,157,95,0.4)] rounded-lg overflow-hidden bg-black/20" style={{ maxHeight: '400px' }}>
                              <img
                                ref={imageRef}
                                src={uploadedImage}
                                alt="Upload preview"
                                className="w-full h-auto max-h-[400px] object-contain"
                                style={{ display: 'block' }}
                              />
                              {/* Crop overlay - will be positioned via useEffect */}
                              <CropOverlay
                                uploadedImage={uploadedImage}
                                cropArea={cropArea}
                                imageRef={imageRef}
                                onMouseDown={handleCropMouseDown}
                                onResizeMouseDown={handleResizeMouseDown}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedImage(null);
                                  setCroppedImageUrl(null);
                                }}
                                className="flex-1 px-4 py-2 text-sm border border-[rgba(197,157,95,0.3)] rounded-lg text-[var(--text-main)] hover:bg-[rgba(197,157,95,0.1)] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleUploadCroppedImage}
                                disabled={uploadingImage}
                                className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-[#C59D5F] to-[#D4AF6A] text-[#0a0a0f] font-semibold rounded-lg hover:from-[#D4AF6A] hover:to-[#E5C17A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {uploadingImage ? 'Uploading...' : 'Upload Cropped Image'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Card Preview */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-[var(--text-main)]">Card Preview</h4>
                            <div className="border border-[rgba(197,157,95,0.2)] rounded-xl overflow-hidden bg-[rgba(255,255,255,0.02)]" style={{ maxWidth: '300px' }}>
                              {/* Simulated card */}
                              <div className="relative h-48 bg-gray-800 overflow-hidden">
                                {croppedImageUrl ? (
                                  <img
                                    src={croppedImageUrl}
                                    alt="Card preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                    Preview will appear here
                                  </div>
                                )}
                              </div>
                              <div className="p-3 space-y-2">
                                <div className="h-4 bg-[rgba(255,255,255,0.1)] rounded w-3/4"></div>
                                <div className="h-3 bg-[rgba(255,255,255,0.05)] rounded w-full"></div>
                                <div className="h-3 bg-[rgba(255,255,255,0.05)] rounded w-2/3"></div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="h-5 bg-[rgba(197,157,95,0.3)] rounded w-20"></div>
                                  <div className="h-6 bg-[rgba(197,157,95,0.5)] rounded w-24"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Spice Level */}
                    <div className="space-y-2">
                      <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                        Spice Level
                      </label>
                      <div className="relative" ref={editFormSpiceDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowEditFormSpiceDropdown(!showEditFormSpiceDropdown)}
                          className={`w-full px-5 py-3.5 sm:py-4 min-h-[52px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300 cursor-pointer backdrop-blur-sm flex items-center justify-between ${
                            formData.spice_level === undefined || formData.spice_level === '' ? 'text-[var(--text-muted)]' : ''
                          }`}
                          aria-label="Select spice level"
                          aria-expanded={showEditFormSpiceDropdown}
                          aria-haspopup="listbox"
                        >
                          <span>{SPICE_LEVELS.find(l => l.value === formData.spice_level)?.label || 'Select spice level...'}</span>
                          <svg className={`w-5 h-5 transition-transform duration-300 ${showEditFormSpiceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Spice Level Dropdown Portal */}
                        {showEditFormSpiceDropdown && typeof document !== 'undefined' && createPortal(
                          <>
                            {/* Backdrop Overlay */}
                            <div 
                              className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-sm"
                              onClick={() => setShowEditFormSpiceDropdown(false)}
                              aria-hidden="true"
                            />
                            
                            {/* Dropdown Menu */}
                            {(() => {
                              const buttonRect = editFormSpiceDropdownRef.current?.querySelector('button')?.getBoundingClientRect();
                              if (!buttonRect) return null;
                              
                              const itemHeight = 40;
                              const maxVisibleItems = 5;
                              const maxHeight = (itemHeight * maxVisibleItems) + 16;
                              
                              return (
                                <div 
                                  className="fixed w-56 bg-[var(--bg-main)] border-2 border-[rgba(197,157,95,0.3)] rounded-xl shadow-2xl z-[100000] overflow-hidden"
                                  style={{
                                    top: `${buttonRect.bottom + 8}px`,
                                    left: `${buttonRect.left}px`,
                                    maxHeight: `${maxHeight}px`
                                  }}
                                  role="listbox"
                                >
                                  {/* Scrollable Container */}
                                  <div 
                                    className="overflow-y-auto max-h-full dropdown-scrollbar" 
                                    style={{ maxHeight: `${maxHeight}px` }}
                                  >
                                    <div className="p-2">
                                      {SPICE_LEVELS.length > 0 ? (
                                        SPICE_LEVELS.map(level => {
                                          const isSelected = formData.spice_level === level.value;
                                          return (
                                            <button
                                              key={level.value}
                                              type="button"
                                              onClick={() => {
                                                setFormData(prev => ({ ...prev, spice_level: level.value }));
                                                setShowEditFormSpiceDropdown(false);
                                              }}
                                              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 last:mb-0 ${
                                                isSelected
                                                  ? 'bg-[rgba(197,157,95,0.25)] text-[#C59D5F] font-semibold shadow-sm'
                                                  : 'text-[var(--text-main)] hover:bg-[rgba(197,157,95,0.1)] hover:text-[rgba(197,157,95,0.9)]'
                                              }`}
                                              role="option"
                                              aria-selected={isSelected}
                                            >
                                              <span className="flex items-center justify-between">
                                                <span>{level.label}</span>
                                                {isSelected && (
                                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                  </svg>
                                                )}
                                              </span>
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <div className="px-4 py-2.5 text-sm text-[var(--text-muted)]">
                                          No spice levels available
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Scroll Indicator */}
                                  {SPICE_LEVELS.length > maxVisibleItems && (
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent pointer-events-none flex flex-col items-center justify-end pb-2">
                                      <span className="text-[10px] text-[rgba(197,157,95,0.7)] font-medium mb-1">Scroll for more</span>
                                      <svg className="w-5 h-5 text-[rgba(197,157,95,0.8)] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>,
                          document.body
                        )}
                      </div>
                    </div>

                    {/* Dietary Tags */}
                    <div className="space-y-2">
                      <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)] mb-3">
                        Dietary Tags
                      </label>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        {DIETARY_TAGS.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleDietaryTag(tag)}
                            className={`px-5 py-2.5 sm:px-6 sm:py-3 min-h-[44px] rounded-full text-sm sm:text-base font-medium transition-all duration-300 ${
                              formData.dietary_tags.includes(tag)
                                ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg scale-105'
                                : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 p-5 sm:p-6 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(197,157,95,0.15)]">
                      {[
                        { name: 'is_available', label: 'Available' },
                        { name: 'is_featured', label: "Chef's Pick" },
                        { name: 'is_todays_menu', label: "Today's Menu" },
                        { name: 'is_daily_special', label: 'Daily Special' },
                        { name: 'is_new_dish', label: 'New Dish' },
                        { name: 'is_discount_combo', label: 'Discount Combo' }
                      ].map(toggle => (
                        <label key={toggle.name} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            name={toggle.name}
                            checked={formData[toggle.name]}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-[#C59D5F] focus:ring-2 focus:ring-[#C59D5F] rounded border-2 border-[rgba(197,157,95,0.3)] bg-[rgba(255,255,255,0.05)] transition-all duration-300"
                          />
                          <span className="text-sm sm:text-base text-[var(--text-main)] group-hover:text-[#C59D5F] transition-colors">{toggle.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[rgba(197,157,95,0.15)]">
                      <button 
                        type="submit" 
                        className="flex-1 sm:flex-none px-8 py-4 min-h-[52px] text-base sm:text-lg font-semibold text-[#0a0a0f] bg-gradient-to-r from-[#C59D5F] via-[#D4AF6A] to-[#C59D5F] hover:from-[#D4AF6A] hover:via-[#E5C17A] hover:to-[#D4AF6A] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Update Item
                      </button>
                      <button 
                        type="button" 
                        onClick={closeEditModal} 
                        className="flex-1 sm:flex-none px-8 py-4 min-h-[52px] text-base sm:text-lg font-medium text-[var(--text-main)] border-2 border-[rgba(197,157,95,0.4)] hover:border-[rgba(197,157,95,0.8)] bg-[rgba(197,157,95,0.05)] hover:bg-[rgba(197,157,95,0.15)] rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modals */}
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setCurrentItemForImage(null);
        }}
        onImageUploaded={handleImageUploaded}
        dishName={currentItemForImage?.name || ''}
      />

      {/* Availability Management Modal */}
      {showAvailabilityModal && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <m.div
            className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm overflow-y-auto z-[99998]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="availability-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAvailabilityModal(false);
                setModalSearchTerm('');
                setSelectedItemsForBulk(new Set());
              }
            }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.2 } },
              exit: { opacity: 0, transition: { duration: 0.15 } }
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <m.div
              className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg-main)] rounded-xl sm:rounded-2xl border-2 border-[rgba(197,157,95,0.25)] shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              variants={{
                hidden: { opacity: 0, scale: 0.95, y: 20 },
                visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
                exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[var(--bg-main)] border-b border-[rgba(197,157,95,0.15)] p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 id="availability-modal-title" className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mb-3">
                      Manage Item Availability
                    </h2>
                    <div className="space-y-2 text-xs sm:text-sm text-[var(--text-muted)]">
                      <p className="leading-relaxed">
                        <strong className="text-[var(--text-main)]">How to use:</strong>
                      </p>
                      <ul className="space-y-1.5 ml-4 list-disc list-outside">
                        <li>
                          <strong className="text-green-400">Available items</strong> are shown in the first section below. Click the green "Available" button on any item to make it unavailable.
                        </li>
                        <li>
                          <strong className="text-red-400">Unavailable items</strong> are shown in the second section below. Click the gray "Unavailable" button on any item to make it available.
                        </li>
                        <li>
                          <strong className="text-[#C59D5F]">Bulk actions:</strong> Select multiple items using checkboxes, then click "Toggle X Item(s)" to change their availability all at once.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAvailabilityModal(false);
                      setModalSearchTerm('');
                      setSelectedItemsForBulk(new Set());
                    }}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.05)] transition-colors flex-shrink-0 ml-4"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(197,157,95,0.6)] pointer-events-none" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-10 pr-4 py-2.5 min-h-[40px] bg-[rgba(255,255,255,0.05)] border border-[rgba(197,157,95,0.2)] rounded-lg text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[rgba(197,157,95,0.5)] transition-all"
                  />
                </div>

                {/* Bulk Actions Bar */}
                {selectedItemsForBulk.size > 0 && (
                  <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-[rgba(197,157,95,0.1)] border border-[rgba(197,157,95,0.2)]">
                    <span className="text-sm text-[var(--text-main)]">
                      <span className="font-semibold text-[#C59D5F]">{selectedItemsForBulk.size}</span> item(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={deselectAllItems}
                        className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                      >
                        Deselect All
                      </button>
                      <button
                        onClick={handleBulkToggleAvailability}
                        disabled={bulkToggleLoading}
                        className="px-4 py-2 min-h-[36px] text-xs sm:text-sm font-semibold text-[#0a0a0f] bg-gradient-to-r from-[#C59D5F] to-[#D4AF6A] rounded-lg hover:from-[#D4AF6A] hover:to-[#E5C17A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bulkToggleLoading ? 'Updating...' : `Toggle ${selectedItemsForBulk.size} Item(s)`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {(() => {
                  // Filter items by search term
                  const filtered = menuItems.filter(item =>
                    item.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                    item.description?.toLowerCase().includes(modalSearchTerm.toLowerCase())
                  );

                  const availableItems = filtered.filter(item => item.is_available);
                  const unavailableItems = filtered.filter(item => !item.is_available);

                  return (
                    <div className="space-y-6">
                      {/* Available Items Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Available ({availableItems.length})
                          </h3>
                          {availableItems.length > 0 && (
                            <button
                              onClick={() => selectAllItems(availableItems)}
                              className="text-xs text-[#C59D5F] hover:text-[#D4AF6A] transition-colors"
                            >
                              Select All
                            </button>
                          )}
                        </div>
                        {availableItems.length === 0 ? (
                          <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                            {modalSearchTerm ? 'No available items match your search' : 'No available items'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableItems.map(item => (
                              <div
                                key={item.id}
                                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                  selectedItemsForBulk.has(item.id)
                                    ? 'border-[#C59D5F] bg-[rgba(197,157,95,0.1)]'
                                    : 'border-[rgba(197,157,95,0.15)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(197,157,95,0.3)]'
                                }`}
                                onClick={() => toggleItemSelection(item.id)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <input
                                        type="checkbox"
                                        checked={selectedItemsForBulk.has(item.id)}
                                        onChange={() => toggleItemSelection(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-[#C59D5F] rounded border-[rgba(197,157,95,0.3)] focus:ring-[#C59D5F]"
                                      />
                                      <span className="text-sm font-semibold text-[var(--text-main)] truncate">
                                        {item.name}
                                      </span>
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAvailability(item);
                                    }}
                                    className="flex-shrink-0 px-3 py-1.5 min-h-[32px] text-xs font-semibold bg-green-600 text-black rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    Available
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Unavailable Items Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Unavailable ({unavailableItems.length})
                          </h3>
                          {unavailableItems.length > 0 && (
                            <button
                              onClick={() => selectAllItems(unavailableItems)}
                              className="text-xs text-[#C59D5F] hover:text-[#D4AF6A] transition-colors"
                            >
                              Select All
                            </button>
                          )}
                        </div>
                        {unavailableItems.length === 0 ? (
                          <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                            {modalSearchTerm ? 'No unavailable items match your search' : 'No unavailable items'}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {unavailableItems.map(item => (
                              <div
                                key={item.id}
                                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                  selectedItemsForBulk.has(item.id)
                                    ? 'border-[#C59D5F] bg-[rgba(197,157,95,0.1)]'
                                    : 'border-[rgba(197,157,95,0.15)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(197,157,95,0.3)]'
                                }`}
                                onClick={() => toggleItemSelection(item.id)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <input
                                        type="checkbox"
                                        checked={selectedItemsForBulk.has(item.id)}
                                        onChange={() => toggleItemSelection(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-[#C59D5F] rounded border-[rgba(197,157,95,0.3)] focus:ring-[#C59D5F]"
                                      />
                                      <span className="text-sm font-semibold text-[var(--text-main)] truncate">
                                        {item.name}
                                      </span>
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAvailability(item);
                                    }}
                                    className="flex-shrink-0 px-3 py-1.5 min-h-[32px] text-xs font-semibold bg-[rgba(107,114,128,0.3)] text-[var(--text-main)] border border-[rgba(107,114,128,0.4)] rounded-lg hover:bg-[rgba(107,114,128,0.4)] transition-colors"
                                  >
                                    Unavailable
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </m.div>
          </m.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteItem}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"?\n\nThis action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </m.main>
  );
}
