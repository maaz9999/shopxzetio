import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { useCatalog } from '../context/CatalogContext';

export default function Catalog() {
  const { products: PRODUCTS } = useCatalog();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS.filter(product => {
      // Category filter
      if (activeCategory !== 'all') {
        const matchesCategory = product.category.toLowerCase() === activeCategory.toLowerCase();
        const matchesSubCategory = product.subCategory && product.subCategory.toLowerCase() === activeCategory.toLowerCase();
        if (!matchesCategory && !matchesSubCategory) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = product.name.toLowerCase().includes(q);
        const catMatch = product.category.toLowerCase().includes(q);
        const subCatMatch = product.subCategory && product.subCategory.toLowerCase().includes(q);
        const descMatch = product.description && product.description.toLowerCase().includes(q);
        const tagsMatch = product.tags && product.tags.some(t => t.toLowerCase().includes(q));
        if (!nameMatch && !catMatch && !subCatMatch && !descMatch && !tagsMatch) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    if (sortOption === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [PRODUCTS, activeCategory, searchQuery, sortOption]);

  return (
    <section id="catalog" style={{ padding: '30px 0 70px 0' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-tag">COMPETITIVE ARSENAL</div>
          <h2 className="section-title">FEATURED GAMING HARDWARE</h2>
          <p className="section-desc">
            Authentic tournament-spec cooling radiators, Hi-Res spatial audio headsets, 60W bypass splitters, and pro accessories.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="catalog-controls-bar">
          <div className="controls-top-row">
            {/* Live Search */}
            <div className="search-input-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search by name, model, DAC, peltier cooler..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="search-clear-btn" 
                  onClick={() => setSearchQuery('')}
                  style={{ display: 'block' }}
                  aria-label="Clear Search"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="sort-select-wrapper">
              <span className="sort-label">Sort:</span>
              <select 
                className="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="featured">Featured Gear</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="category-filter-pills">
            <button 
              className={`filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <i className="fa-solid fa-border-all"></i> All Arsenal
            </button>
            <button 
              className={`filter-pill ${activeCategory === 'Gaming Audio' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Gaming Audio')}
            >
              <i className="fa-solid fa-headphones"></i> Gaming Audio
            </button>
            <button 
              className={`filter-pill ${activeCategory === 'Mobile Coolers' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Mobile Coolers')}
            >
              <i className="fa-solid fa-snowflake"></i> Mobile Coolers
            </button>
            <button 
              className={`filter-pill ${activeCategory === 'Splitters & Adapters' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Splitters & Adapters')}
            >
              <i className="fa-solid fa-plug-circle-bolt"></i> Splitters & DAC
            </button>
            <button 
              className={`filter-pill ${activeCategory === 'Finger Sleeves' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Finger Sleeves')}
            >
              <i className="fa-solid fa-hand"></i> Finger Sleeves
            </button>
            <button 
              className={`filter-pill ${activeCategory === 'Desk Fans' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Desk Fans')}
            >
              <i className="fa-solid fa-fan"></i> Desk & Table Fans
            </button>
          </div>

          {/* Count Display */}
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '4px' }}>
            Showing {filteredProducts.length} of {PRODUCTS.length} Products
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: 'rgba(8,18,32,0.5)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <i className="fa-solid fa-crosshairs" style={{ fontSize: '3rem', color: 'var(--border-cyan)', marginBottom: '16px' }}></i>
              <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', marginBottom: '8px' }}>NO GEAR MATCHED YOUR SEARCH</h3>
              <p style={{ color: 'var(--text-dim)', maxWidth: '440px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
                Try adjusting your keywords or clearing the category filter to explore the full arsenal.
              </p>
              <button 
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className="btn-cyber-primary" 
                style={{ height: '42px', fontSize: '0.85rem' }}
              >
                RESET FILTERS
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
