import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { logger } from '../utils/logger';
import {
  getBackgroundStyle,
  validateBackgroundConfig,
  configToDbFormat,
  dbFormatToConfig,
  isValidHexColor,
  isValidGradient
} from '../utils/backgroundUtils';
import {
  solidColorPresets,
  gradientPresets,
  imagePresets,
  restaurantInteriorImages,
  tableSettingsImages,
  subtleTextureImages,
  additionalImages,
  getPresetPreview
} from '../config/backgroundPresets';

/**
 * BackgroundManager Component
 *
 * Comprehensive background customization interface for admin panel.
 * Supports: Solid Colors, Gradients, Image Upload, Presets.
 *
 * @param {Object} props
 * @param {string} props.section - Section name ('hero', 'gallery_section', 'page', 'hero_quote')
 * @param {string} props.label - Display label for the section
 * @param {Function} props.onSave - Callback when background is saved
 */
function BackgroundManager({ section, label, onSave }) {
  // Store settings context
  const { settings, updateSettings, refreshSettings } = useStoreSettings();
  const { theme } = useTheme();

  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
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

  // State
  const [activeTab, setActiveTab] = useState('solid'); // 'solid', 'gradient', 'image', 'presets'
  const [config, setConfig] = useState({
    type: 'solid',
    color: '#2a2a2a',
    gradient: '',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewStyle, setPreviewStyle] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({
    interiors: true,
    tableSettings: false,
    textures: false,
    additional: false
  });

  const loadCurrentSettings = useCallback(() => {
    try {
      if (settings) {
        const loadedConfig = dbFormatToConfig(settings, section);
        setConfig(loadedConfig);
        setActiveTab(loadedConfig.type === 'none' ? 'solid' : loadedConfig.type);
      }
    } catch (error) {
      logger.error('Error loading background settings:', error);
      toast.error('Failed to load current settings');
    }
  }, [section, settings]);

  const updatePreview = useCallback(() => {
    const style = getBackgroundStyle({ ...configToDbFormat(config, section) }, section);
    setPreviewStyle(style);
  }, [config, section]);

  // Load current background settings
  useEffect(() => {
    loadCurrentSettings();
  }, [loadCurrentSettings]);

  // Update preview when config or theme changes (real-time theme sync)
  useEffect(() => {
    updatePreview();
  }, [updatePreview, theme]);

  const handleColorChange = (color) => {
    setConfig(prev => ({ ...prev, type: 'solid', color }));
  };

  const handleGradientChange = (gradient) => {
    setConfig(prev => ({ ...prev, type: 'gradient', gradient }));
  };

  const handleImageUrlChange = (imageUrl) => {
    setConfig(prev => ({ ...prev, type: 'image', imageUrl }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `bg-${section}-${Date.now()}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      handleImageUrlChange(publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      logger.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handlePresetSelect = (preset) => {
    if (preset.color) {
      setConfig({ type: 'solid', color: preset.color, gradient: '', imageUrl: '' });
      setActiveTab('solid');
    } else if (preset.gradient) {
      setConfig({ type: 'gradient', color: '', gradient: preset.gradient, imageUrl: '' });
      setActiveTab('gradient');
    } else if (preset.url) {
      setConfig({ type: 'image', color: '', gradient: '', imageUrl: preset.url });
      setActiveTab('image');
    }
  };

  const handleSetNone = () => {
    setConfig({ type: 'none', color: '', gradient: '', imageUrl: '' });
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSave = async () => {
    // Validate config
    const validation = validateBackgroundConfig(config);
    if (!validation.isValid && config.type !== 'none') {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      setSaving(true);

      // Convert to database format
      const dbData = configToDbFormat(config, section);

      // Update store_settings using context
      const result = await updateSettings(dbData);

      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      // Refresh settings to ensure we have latest data
      await refreshSettings();

      toast.success(`${label} background updated successfully!`);

      if (onSave) {
        onSave(config);
      }
    } catch (error) {
      logger.error('Save error:', error);
      const errorMsg = error?.message || error?.error_description || 'Unknown error';
      const errorCode = error?.code ? ` (${error.code})` : '';
      toast.error(`Failed to save background settings: ${errorMsg}${errorCode}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-theme={theme}
      className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-lg border border-theme p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-7 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-theme">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-main)]">
            {label} Background
          </h3>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Customize the background appearance and style
          </p>
        </div>
        <button
          onClick={handleSetNone}
          className="text-xs sm:text-sm px-4 py-2 rounded-xl border border-theme text-muted transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md active:scale-95"
        >
          Remove Background
        </button>
      </div>

      {/* Tabs */}
      <div 
        className="flex gap-1 sm:gap-2 rounded-xl p-1"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(255, 255, 255, 0.3)' 
            : 'rgba(5, 5, 9, 0.3)'
        }}
      >
        {['solid', 'gradient', 'image', 'presets'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium capitalize rounded-lg transition-all duration-200 ${
              activeTab === tab
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'text-muted hover:text-[var(--text-main)] hover:bg-theme-elevated'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* SOLID COLOR TAB */}
        {activeTab === 'solid' && (
          <div className="space-y-5 sm:space-y-6">
            <div className="bg-theme-elevated rounded-xl p-4 sm:p-5 border border-theme shadow-sm">
              <label 
                className="block text-sm sm:text-base font-semibold mb-3 sm:mb-4"
                style={{ color: 'var(--text-main)' }}
              >
                Color Picker
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={config.color || '#2a2a2a'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-20 h-20 rounded-xl cursor-pointer border-2 border-theme-medium hover:border-[var(--accent)] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={config.color || ''}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#2a2a2a"
                    className="w-full px-4 py-3 rounded-xl input-themed text-sm font-mono transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                  {config.color && !isValidHexColor(config.color) && (
                    <div className="flex items-center gap-2 mt-2 text-red-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs">Invalid hex color format (use #RRGGBB)</p>
                    </div>
                  )}
                  <p className="text-xs text-muted mt-2">Enter hex color or use the picker above</p>
                </div>
              </div>
            </div>

            {/* Quick Color Swatches */}
            <div className="bg-theme-elevated rounded-xl p-4 sm:p-5 border border-theme shadow-sm">
              <label className="block text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-[var(--text-main)]">
                Quick Colors
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
                {solidColorPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleColorChange(preset.color)}
                    className={`aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 ${
                      config.color === preset.color
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 shadow-md'
                        : 'border-theme-medium hover:border-theme'
                    }`}
                    style={{
                      backgroundColor: preset.color
                    }}
                    title={preset.name}
                    aria-label={`Select ${preset.name} color`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GRADIENT TAB */}
        {activeTab === 'gradient' && (
          <div className="space-y-5 sm:space-y-6">
            <div className="bg-theme-elevated rounded-xl p-4 sm:p-5 border border-theme shadow-sm">
              <label className="block text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-[var(--text-main)]">
                CSS Gradient
              </label>
              <textarea
                value={config.gradient || ''}
                onChange={(e) => handleGradientChange(e.target.value)}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl input-themed font-mono text-sm transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/20"
              />
              {config.gradient && !isValidGradient(config.gradient) && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs">Invalid gradient format (must contain &quot;gradient(&quot;)</p>
                </div>
              )}
              <p className="text-xs text-muted mt-2">
                Example: linear-gradient(135deg, #color1 0%, #color2 100%)
              </p>
            </div>

            {/* Gradient Presets */}
            <div className="bg-theme-elevated rounded-xl p-4 sm:p-5 border border-theme shadow-sm">
              <label className="block text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-[var(--text-main)]">
                Gradient Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {gradientPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleGradientChange(preset.gradient)}
                    className={`h-28 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 overflow-hidden relative ${
                      config.gradient === preset.gradient
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 shadow-md'
                        : 'border-theme-medium hover:border-theme'
                    }`}
                    style={{
                      ...getPresetPreview(preset)
                    }}
                    title={preset.name}
                    aria-label={`Select ${preset.name} gradient`}
                  >
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm">
                      <p className="text-white text-xs font-medium">{preset.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* IMAGE TAB */}
        {activeTab === 'image' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Upload Section */}
            <div className="bg-theme-elevated rounded-xl p-4 sm:p-5 border border-theme shadow-sm">
              <label className="block text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-[var(--text-main)]">
                Upload Image
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id={`bg-upload-${section}`}
                />
                <label
                  htmlFor={`bg-upload-${section}`}
                  className={`block border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer ${
                    uploading
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                      : 'border-theme-medium hover:border-[var(--accent)] hover:bg-[var(--accent)]/5'
                  }`}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-elevated flex items-center justify-center group-hover:bg-[var(--accent)]/10 transition-all duration-200 shadow-md group-hover:shadow-lg">
                    {uploading ? (
                      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-8 h-8 text-muted group-hover:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  <p className="text-base font-medium text-[var(--text-main)] mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-muted">PNG, JPG, WebP up to 5MB</p>
                </label>
              </div>
            </div>

            {/* URL Input */}
            <div className="bg-theme-elevated rounded-xl p-4 sm:p-5 border border-theme shadow-sm">
              <label className="block text-sm sm:text-base font-semibold mb-3 text-[var(--text-main)]">
                Or Enter Image URL
              </label>
              <input
                type="text"
                value={config.imageUrl || ''}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-xl input-themed text-sm transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>

            {/* Curated Images - Restaurant Interiors */}
            <div className="bg-theme-elevated rounded-xl border border-theme shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory('interiors')}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[var(--accent)]/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent)]/10">
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">Restaurant Interiors</h4>
                    <p className="text-xs text-muted">{restaurantInteriorImages.length} images</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-muted transition-transform duration-200 ${expandedCategories.interiors ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedCategories.interiors && (
                <div className="p-4 sm:p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {restaurantInteriorImages.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleImageUrlChange(preset.url)}
                      className={`h-32 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden relative group ${config.imageUrl === preset.url ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-theme-medium'}`}
                      style={{ ...getPresetPreview(preset) }}
                      title={preset.description}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                        <p className="text-white text-xs font-semibold">{preset.name}</p>
                        <p className="text-white/70 text-[10px] mt-0.5">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Curated Images - Table Settings */}
            <div className="bg-theme-elevated rounded-xl border border-theme shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory('tableSettings')}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[var(--accent)]/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent)]/10">
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">Table Settings</h4>
                    <p className="text-xs text-muted">{tableSettingsImages.length} images</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-muted transition-transform duration-200 ${expandedCategories.tableSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedCategories.tableSettings && (
                <div className="p-4 sm:p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tableSettingsImages.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleImageUrlChange(preset.url)}
                      className={`h-32 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden relative group ${config.imageUrl === preset.url ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-theme-medium'}`}
                      style={{ ...getPresetPreview(preset) }}
                      title={preset.description}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                        <p className="text-white text-xs font-semibold">{preset.name}</p>
                        <p className="text-white/70 text-[10px] mt-0.5">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Curated Images - Subtle Textures */}
            <div className="bg-theme-elevated rounded-xl border border-theme shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory('textures')}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[var(--accent)]/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent)]/10">
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">Subtle Textures</h4>
                    <p className="text-xs text-muted">{subtleTextureImages.length} images</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-muted transition-transform duration-200 ${expandedCategories.textures ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedCategories.textures && (
                <div className="p-4 sm:p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subtleTextureImages.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleImageUrlChange(preset.url)}
                      className={`h-32 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden relative group ${config.imageUrl === preset.url ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-theme-medium'}`}
                      style={{ ...getPresetPreview(preset) }}
                      title={preset.description}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                        <p className="text-white text-xs font-semibold">{preset.name}</p>
                        <p className="text-white/70 text-[10px] mt-0.5">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Images */}
            <div className="bg-theme-elevated rounded-xl border border-theme shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory('additional')}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-[var(--accent)]/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent)]/10">
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">Additional Images</h4>
                    <p className="text-xs text-muted">{additionalImages.length} images</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-muted transition-transform duration-200 ${expandedCategories.additional ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedCategories.additional && (
                <div className="p-4 sm:p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {additionalImages.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleImageUrlChange(preset.url)}
                      className={`h-32 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden relative group ${config.imageUrl === preset.url ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-theme-medium'}`}
                      style={{ ...getPresetPreview(preset) }}
                      title={preset.description}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                        <p className="text-white text-xs font-semibold">{preset.name}</p>
                        <p className="text-white/70 text-[10px] mt-0.5">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-6 sm:space-y-7">
            {/* Recommended Presets for Reservations */}
            <div className="bg-gradient-to-br from-[var(--accent)]/10 via-[var(--accent)]/5 to-transparent rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-[var(--accent)]/30 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h4 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                  Recommended for {label}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-muted mb-4">
                Hand-picked presets perfect for restaurant reservations
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Elegant Minimal Gradient */}
                <button
                  onClick={() => handlePresetSelect({ gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)' })}
                  className="group relative h-28 rounded-xl border-2 border-[var(--accent)]/40 hover:border-[var(--accent)] transition-all duration-200 hover:scale-105 hover:shadow-xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/50 backdrop-blur-sm">
                    <p className="text-white text-sm font-semibold">Elegant Minimal</p>
                    <p className="text-white/80 text-[10px]">Gradient • White to cream</p>
                  </div>
                </button>

                {/* Soft Cream */}
                <button
                  onClick={() => handlePresetSelect({ color: '#FAF8F5' })}
                  className="group relative h-28 rounded-xl border-2 border-[var(--accent)]/40 hover:border-[var(--accent)] transition-all duration-200 hover:scale-105 hover:shadow-xl overflow-hidden"
                  style={{ backgroundColor: '#FAF8F5' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/50 backdrop-blur-sm">
                    <p className="text-white text-sm font-semibold">Soft Cream</p>
                    <p className="text-white/80 text-[10px]">Solid • Perfect readability</p>
                  </div>
                </button>

                {/* Modern Restaurant Image */}
                <button
                  onClick={() => handlePresetSelect({ url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80' })}
                  className="group relative h-28 rounded-xl border-2 border-[var(--accent)]/40 hover:border-[var(--accent)] transition-all duration-200 hover:scale-105 hover:shadow-xl overflow-hidden"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                    <p className="text-white text-sm font-semibold">Modern Restaurant</p>
                    <p className="text-white/80 text-[10px]">Image • Sophisticated atmosphere</p>
                  </div>
                </button>

                {/* Luxury Gradient */}
                <button
                  onClick={() => handlePresetSelect({ gradient: 'linear-gradient(to bottom right, #FAF8F5 0%, #F0EDE5 50%, #E8E4DC 100%)' })}
                  className="group relative h-28 rounded-xl border-2 border-[var(--accent)]/40 hover:border-[var(--accent)] transition-all duration-200 hover:scale-105 hover:shadow-xl overflow-hidden"
                  style={{ background: 'linear-gradient(to bottom right, #FAF8F5 0%, #F0EDE5 50%, #E8E4DC 100%)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/50 backdrop-blur-sm">
                    <p className="text-white text-sm font-semibold">Luxury Gradient</p>
                    <p className="text-white/80 text-[10px]">Gradient • Premium elegance</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-theme-medium to-transparent"></div>
              <span className="text-xs text-muted uppercase tracking-wider">All Presets</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-theme-medium to-transparent"></div>
            </div>

            {/* Color Presets */}
            <div className="bg-theme-elevated rounded-xl border border-theme p-4 sm:p-5 shadow-sm">
              <h4 className="text-sm sm:text-base font-semibold mb-4 text-[var(--text-main)] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div>
                Solid Colors
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {solidColorPresets.map((preset) => {
                  const isLight = ['#FAF8F5', '#FFF9F0', '#F5F1EB', '#FEFCF9', '#FFF4E6', '#F0EDE5', '#FAF5EF', '#F5F1E8'].includes(preset.color);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className="group relative p-4 rounded-xl border-2 border-theme-medium hover:border-[var(--accent)] transition-all duration-200 hover:scale-105 hover:shadow-lg text-left overflow-hidden"
                      style={{ backgroundColor: preset.color }}
                      title={preset.description}
                    >
                      <div className={`relative z-10 transition-all duration-200 ${isLight ? 'group-hover:drop-shadow-md' : ''}`}>
                        <p className={`text-xs font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          {preset.name}
                        </p>
                        <p className={`text-[10px] mt-1 ${isLight ? 'text-gray-600' : 'text-white/70'}`}>
                          {preset.color}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gradient Presets */}
            <div className="bg-theme-elevated rounded-xl border border-theme p-4 sm:p-5 shadow-sm">
              <h4 className="text-sm sm:text-base font-semibold mb-4 text-[var(--text-main)] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div>
                Gradients
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {gradientPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="group h-28 rounded-xl border-2 border-theme-medium hover:border-[var(--accent)] transition-all duration-200 hover:scale-105 hover:shadow-lg relative overflow-hidden"
                    style={{ ...getPresetPreview(preset) }}
                    title={preset.description}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                      <p className="text-white text-sm font-semibold">{preset.name}</p>
                      <p className="text-white/70 text-[10px] mt-0.5">{preset.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Presets */}
            <div className="bg-theme-elevated rounded-xl border border-theme p-4 sm:p-5 shadow-sm">
              <h4 className="text-sm sm:text-base font-semibold mb-4 text-[var(--text-main)] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div>
                Images
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {imagePresets.slice(0, 8).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="group h-32 rounded-xl border-2 border-theme-medium hover:border-[var(--accent)] transition-all duration-200 hover:scale-105 hover:shadow-lg overflow-hidden relative"
                    style={{ ...getPresetPreview(preset) }}
                    title={preset.description}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                      <p className="text-white text-sm font-semibold">{preset.name}</p>
                      <p className="text-white/70 text-[10px] mt-0.5">{preset.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted text-center mt-4">
                Switch to the Image tab to see all {imagePresets.length} curated images organized by category
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="bg-theme-elevated rounded-xl p-4 sm:p-5 border border-theme shadow-sm">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <label className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
            Live Preview
          </label>
          <span 
            className="text-xs text-muted px-3 py-1 rounded-full"
            style={{
              backgroundColor: isLightTheme 
                ? 'rgba(255, 255, 255, 0.5)' 
                : 'rgba(5, 5, 9, 0.5)'
            }}
          >
            Real-time
          </span>
        </div>
        <div
          className="w-full aspect-video rounded-xl border-2 border-[var(--accent)]/50 flex items-center justify-center overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
          style={{
            ...previewStyle
          }}
        >
          <div className="text-center px-6 py-4 rounded-xl bg-black/60 backdrop-blur-md shadow-2xl">
            <p className="text-white font-semibold text-sm sm:text-base mb-1">
              {label}
            </p>
            <p className="text-white/70 text-xs">Preview content appears here</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-5 border-t border-theme">
        <button
          onClick={loadCurrentSettings}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted border border-theme transition-all duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md active:scale-95"
        >
          Reset Changes
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            saving
              ? 'bg-[var(--accent)]/50 cursor-not-allowed'
              : 'bg-[var(--accent)] hover:bg-[var(--accent)]/90 hover:shadow-lg hover:scale-105 active:scale-95'
          } text-white shadow-md`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </span>
          ) : (
            'Save Background'
          )}
        </button>
      </div>
    </div>
  );
}

BackgroundManager.propTypes = {
  section: PropTypes.oneOf(['hero', 'gallery_section', 'page', 'hero_quote', 'reservation_dark', 'reservation_light']).isRequired,
  label: PropTypes.string.isRequired,
  onSave: PropTypes.func
};

export default BackgroundManager;
