import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import STATIC_PRODUCTS from '../data/products';
import { supabase } from '../lib/supabase';

const CatalogContext = createContext({ products: STATIC_PRODUCTS, source: 'static', loading: false });

function normalizeDatabaseProduct(product) {
  return {
    id: product.legacy_id,
    databaseId: product.id,
    folder: product.folder,
    name: product.name,
    shortName: product.short_name,
    price: Number(product.price),
    originalPrice: product.original_price === null ? null : Number(product.original_price),
    category: product.category,
    subCategory: product.sub_category,
    badge: product.badge,
    featured: product.featured,
    active: product.active,
    stockQuantity: product.stock_quantity,
    rating: product.rating === null ? null : Number(product.rating),
    reviewCount: product.review_count,
    description: product.description,
    features: product.features || [],
    specs: product.specs || {},
    inTheBox: product.in_the_box || [],
    images: product.images || [],
    mainImage: product.main_image || product.images?.[0] || '/assets/brand/LOGO.png',
  };
}

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(STATIC_PRODUCTS);
  const [source, setSource] = useState('static');
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.from('products').select('*').eq('active', true).order('name').then(({ data, error }) => {
      if (!active) return;
      if (!error && data?.length) {
        setProducts(data.map(normalizeDatabaseProduct));
        setSource('supabase');
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({ products, source, loading }), [products, source, loading]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
