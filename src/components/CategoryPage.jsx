import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';

export default function CategoryPage({ categoryKey, title, subtitle, icon }) {
  const { setCurrentView } = useCart();
  const { products: PRODUCTS } = useCatalog();
  const [subCategory, setSubCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');

  // Filter products by categoryKey
  const categoryProducts = useMemo(() => {
    if (categoryKey === 'all') return PRODUCTS;
    if (categoryKey === 'coolers') {
      return PRODUCTS.filter(p => p.category.toLowerCase().includes('cooler') || (p.subCategory && p.subCategory.toLowerCase().includes('cooler')));
    }
    if (categoryKey === 'audio') {
      return PRODUCTS.filter(p => p.category.toLowerCase().includes('audio') || (p.subCategory && p.subCategory.toLowerCase().includes('audio')) || p.category.toLowerCase().includes('headset') || p.category.toLowerCase().includes('earbuds'));
    }
    if (categoryKey === 'splitters') {
      return PRODUCTS.filter(p => p.category.toLowerCase().includes('splitter') || p.category.toLowerCase().includes('dac') || (p.subCategory && p.subCategory.toLowerCase().includes('dac')));
    }
    if (categoryKey === 'accessories') {
      return PRODUCTS.filter(p => p.category.toLowerCase().includes('sleeve') || p.category.toLowerCase().includes('fan') || p.category.toLowerCase().includes('accessories'));
    }
    return PRODUCTS.filter(p => p.category.toLowerCase() === categoryKey.toLowerCase());
  }, [PRODUCTS, categoryKey]);

  // Extract unique subcategories
  const availableSubCategories = useMemo(() => {
    const subs = new Set();
    categoryProducts.forEach(p => {
      if (p.subCategory) subs.add(p.subCategory);
    });
    return ['all', ...Array.from(subs)];
  }, [categoryProducts]);

  // Apply subcategory, search and sort
  const displayProducts = useMemo(() => {
    let result = categoryProducts.filter(product => {
      // Subcategory filter
      if (subCategory !== 'all') {
        if (product.subCategory !== subCategory) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = product.name.toLowerCase().includes(q);
        const catMatch = product.category.toLowerCase().includes(q);
        const subCatMatch = product.subCategory && product.subCategory.toLowerCase().includes(q);
        const descMatch = product.description && product.description.toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !subCatMatch && !descMatch) return false;
      }

      return true;
    });

    // Sorting
    if (sortOption === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      result.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    }

    return result;
  }, [categoryProducts, subCategory, searchQuery, sortOption]);

  return (
    <div className="category-page-wrap">
      {/* Category Header Banner */}
      <div className="category-header-banner">
        <div className="container">
          {/* Breadcrumbs */}
          <div className="category-breadcrumbs">
            <button onClick={() => setCurrentView('home')} className="crumb-link">
              <i className="fa-solid fa-house"></i> Home
            </button>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{title}</span>
          </div>

          <div className="category-header-content">
            <div className="category-icon-box">
              <i className={`fa-solid ${icon || 'fa-gamepad'}`}></i>
            </div>
            <div>
              <h1 className="category-page-title">{title}</h1>
              <p className="category-page-desc">
                {subtitle || `Explore our curated tournament-grade ${title.toLowerCase()} collection.`} 
                <span className="category-count-badge"> ({categoryProducts.length} Items Available)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '30px 0 80px 0' }}>
        {/* Controls & Filter Bar */}
        <div className="daraz-controls-bar">
          <div className="daraz-search-row">
            <div className="daraz-search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                placeholder={`Search in ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="daraz-search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="daraz-search-clear">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <div className="daraz-sort-box">
              <span className="sort-tag">Sort by:</span>
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="daraz-sort-select"
              >
                <option value="featured">Top Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Subcategory Pills */}
          {availableSubCategories.length > 2 && (
            <div className="daraz-subcat-row">
              {availableSubCategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSubCategory(sub)}
                  className={`daraz-subcat-pill ${subCategory === sub ? 'active' : ''}`}
                >
                  {sub === 'all' ? `All ${title}` : sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Daraz Multi-Column Products Grid */}
        {displayProducts.length > 0 ? (
          <div className="daraz-products-grid">
            {displayProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="daraz-no-results">
            <i className="fa-solid fa-box-open"></i>
            <h3>No products found</h3>
            <p>Try clearing your search filters or check other categories.</p>
            <button onClick={() => { setSearchQuery(''); setSubCategory('all'); }} className="btn-daraz-reset">
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
