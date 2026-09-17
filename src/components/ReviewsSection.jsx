import React, { useEffect, useMemo, useState } from 'react';

const PRO_REVIEWS = [
  {
    id: 'crypto',
    name: 'CRYPTO',
    realName: 'Raja Haseeb',
    handle: '@cryptopubgm',
    role: 'PUBG Mobile Professional',
    src: '/assets/reviews/review-3/images/review-3-image-019.jpg',
    portrait: '/assets/reviews/pro-players/crypto.png',
    accent: '#22D3EE'
  },
  {
    id: 't24-op',
    name: 'T24 OP',
    realName: 'Hasnain Rehman',
    handle: '@t24_pubgm',
    role: '4Thrives Esports',
    src: '/assets/reviews/review-3/images/review-3-image-020.jpg',
    portrait: '/assets/reviews/pro-players/t24-op.png',
    accent: '#FBBF24'
  },
  {
    id: 'iq',
    name: 'IQ',
    realName: 'Shayan Asad',
    handle: '@iq.pubgm',
    role: '4Thrives Esports',
    src: '/assets/reviews/review-3/images/review-3-image-018.jpg',
    portrait: '/assets/reviews/pro-players/iq.png',
    accent: '#A78BFA'
  },
  {
    id: 'ghoost',
    name: 'GHOOST',
    realName: 'Adil Yousef',
    handle: '@ig.ghoost',
    role: 'PUBG Mobile Professional',
    src: '/assets/reviews/review-3/images/review-3-image-005.webp',
    portrait: '/assets/reviews/pro-players/ghoost.jpg',
    accent: '#38BDF8'
  },
  {
    id: 'freestyler',
    name: 'FREESTYLER',
    realName: 'Muhammad Ammar',
    handle: '@ig_freestylerop',
    role: 'PUBG Mobile Professional',
    src: '/assets/reviews/review-3/images/review-3-image-010.webp',
    portrait: '/assets/reviews/pro-players/freestyler.jpg',
    accent: '#34D399'
  },
  {
    id: 'huzaifa',
    name: 'HUZAIFA',
    realName: 'Muhammad Huzaifa',
    handle: '@huzaifa.pm',
    role: '4Thrives Esports',
    src: '/assets/reviews/review-3/images/review-3-image-007.jpg',
    portrait: '/assets/reviews/pro-players/huzaifa.png',
    accent: '#F472B6'
  },
  {
    id: 'alphaboy',
    name: 'AlphaBoy',
    realName: 'Muhammad Huzaifa Ali',
    handle: '@alphaboyy.1',
    role: 'PUBG Mobile Professional',
    src: '/assets/reviews/review-3/images/review-3-image-017.jpg',
    portrait: '/assets/reviews/pro-players/alphaboy.jpg',
    accent: '#FB923C'
  },
  {
    id: 'vaaz',
    name: 'VAAZ',
    realName: 'Muhammad Abdallah',
    handle: '@r3gvaaz',
    role: 'PUBG Mobile Professional',
    src: '/assets/reviews/review-3/images/review-3-image-003.jpg',
    portrait: '/assets/reviews/pro-players/vaaz.jpg',
    accent: '#C084FC'
  },
  {
    id: 'uzm',
    name: 'UZM',
    realName: 'Uzair Ahmed',
    handle: '@ig.uzm',
    role: 'AS i8 Esports',
    type: 'video',
    src: '/assets/reviews/review-3/videos/review-3-video-012.mp4',
    portrait: '/assets/reviews/pro-players/uzm.jpg',
    accent: '#F87171'
  },
  {
    id: 'iron',
    name: 'IRON',
    realName: 'Ayan Raza',
    handle: '@ig.ironn',
    role: 'AS i8 Esports',
    type: 'video',
    src: '/assets/reviews/review-3/videos/review-3-video-013.mp4',
    portrait: '/assets/reviews/pro-players/iron.jpg',
    accent: '#60A5FA'
  },
  {
    id: 'goku',
    name: 'GOKU',
    realName: 'Abdul Wasay',
    handle: '@ig.gokubot',
    role: 'PUBG Mobile Professional',
    src: '/assets/reviews/review-3/images/review-3-image-009.jpg',
    portrait: '/assets/reviews/pro-players/goku.jpg',
    accent: '#4ADE80'
  },
  {
    id: 'aliyan',
    name: 'ALIYAN',
    realName: 'Mohammad Aliyan',
    handle: '@ig_aliyan13',
    role: 'PUBG Mobile Professional',
    src: '/assets/reviews/review-2/images/review-2-image-010.jpg',
    portrait: '/assets/reviews/pro-players/aliyan.jpg',
    accent: '#2DD4BF'
  }
];

function getItemsPerPage() {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth <= 640) return 1;
  if (window.innerWidth <= 980) return 2;
  return 4;
}

export default function ReviewsSection() {
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPro, setSelectedPro] = useState(null);

  const totalPages = Math.ceil(PRO_REVIEWS.length / itemsPerPage);
  const currentReviews = useMemo(
    () => PRO_REVIEWS.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
    ),
    [currentPage, itemsPerPage]
  );

  const selectedIndex = selectedPro
    ? PRO_REVIEWS.findIndex((review) => review.id === selectedPro.id)
    : -1;

  useEffect(() => {
    const handleResize = () => {
      const nextItemsPerPage = getItemsPerPage();
      setItemsPerPage((currentItemsPerPage) => {
        if (currentItemsPerPage !== nextItemsPerPage) setCurrentPage(0);
        return nextItemsPerPage;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!selectedPro) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedPro(null);
      if (event.key === 'ArrowLeft') {
        const previousIndex = selectedIndex === 0 ? PRO_REVIEWS.length - 1 : selectedIndex - 1;
        setSelectedPro(PRO_REVIEWS[previousIndex]);
      }
      if (event.key === 'ArrowRight') {
        const nextIndex = selectedIndex === PRO_REVIEWS.length - 1 ? 0 : selectedIndex + 1;
        setSelectedPro(PRO_REVIEWS[nextIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIndex, selectedPro]);

  const showPrevious = () => {
    const previousIndex = selectedIndex === 0 ? PRO_REVIEWS.length - 1 : selectedIndex - 1;
    setSelectedPro(PRO_REVIEWS[previousIndex]);
  };

  const showNext = () => {
    const nextIndex = selectedIndex === PRO_REVIEWS.length - 1 ? 0 : selectedIndex + 1;
    setSelectedPro(PRO_REVIEWS[nextIndex]);
  };

  return (
    <section id="pro-reviews" className="reviews-section">
      <div className="container">
        <div className="reviews-top-bar">
          <div className="reviews-header-info">
            <div className="section-tag">PRO PLAYER PROOF // FEATURED STORIES</div>
            <h2 className="section-title">PROS WHO SHOP XZETIO.</h2>
            <p className="section-desc">
              Purchase stories shared by recognizable PUBG Mobile competitors from Pakistan&apos;s esports scene.
            </p>
          </div>

          <div className="reviews-nav-controls">
            <span className="reviews-roster-count">
              <i className="fa-solid fa-crown" aria-hidden="true" />
              {PRO_REVIEWS.length} pro stories
            </span>
            <div className="reviews-page-indicator" aria-live="polite">
              <span>{String(currentPage + 1).padStart(2, '0')}</span>
              <span>/</span>
              <span>{String(totalPages).padStart(2, '0')}</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => (page === 0 ? totalPages - 1 : page - 1))}
              className="btn-review-arrow"
              aria-label="Previous featured pro reviews"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => (page + 1) % totalPages)}
              className="btn-review-arrow"
              aria-label="Next featured pro reviews"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="reviews-carousel-grid">
          {currentReviews.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className="pro-review-card"
              style={{ '--pro-accent': item.accent }}
              onClick={() => setSelectedPro(item)}
              aria-label={`Open ${item.name} review`}
              aria-haspopup="dialog"
            >
              {item.type === 'video' ? (
                <video
                  className="pro-review-media"
                  src={item.src}
                  preload="metadata"
                  muted
                  playsInline
                  aria-hidden="true"
                />
              ) : (
                <img
                  className="pro-review-media"
                  src={item.src}
                  alt={`${item.name} ShopXzetio review story`}
                  loading={currentPage === 0 && index < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              )}
              <span className="pro-review-shade" aria-hidden="true" />

              <span className="pro-review-topline">
                <span className="pro-status-pill">
                  <i className="fa-solid fa-trophy" aria-hidden="true" />
                  Pro player
                </span>
                <span className="pro-review-open" aria-hidden="true">
                  <i className={`fa-solid ${item.type === 'video' ? 'fa-play' : 'fa-expand'}`} />
                </span>
              </span>

              <span className="pro-review-identity">
                <span className="pro-review-name-row">
                  <strong>{item.name}</strong>
                  <i className="fa-solid fa-circle-check" aria-hidden="true" />
                </span>
                <span className="pro-review-real-name">{item.realName}</span>
                <span className="pro-review-meta">
                  <span>{item.handle}</span>
                  <span aria-hidden="true">•</span>
                  <span>{item.role}</span>
                </span>
              </span>

              <img
                className="pro-review-portrait"
                src={item.portrait}
                alt={`${item.name} portrait`}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>

        <div className="reviews-footer-row">
          <div className="reviews-dots-wrap" aria-label="Featured review pages">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`review-dot ${index === currentPage ? 'active' : ''}`}
                aria-label={`Show featured reviews page ${index + 1}`}
                aria-current={index === currentPage ? 'true' : undefined}
              />
            ))}
          </div>

          <a className="reviews-archive-link" href="#reviews">
            <span>View all 122 customer reviews</span>
            <i className="fa-solid fa-arrow-down" aria-hidden="true" />
          </a>
        </div>
      </div>

      {selectedPro && (
        <div
          className="review-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedPro.name} review`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPro(null);
          }}
        >
          <button
            type="button"
            className="review-lightbox-close"
            onClick={() => setSelectedPro(null)}
            aria-label="Close pro review"
          >
            <i className="fa-solid fa-xmark" />
          </button>

          <button
            type="button"
            className="review-lightbox-arrow is-previous"
            onClick={showPrevious}
            aria-label="Previous pro review"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>

          <div className="review-lightbox-panel">
            <div className="review-lightbox-media">
              {selectedPro.type === 'video' ? (
                <video
                  key={selectedPro.id}
                  src={selectedPro.src}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img src={selectedPro.src} alt={`${selectedPro.name} ShopXzetio review`} />
              )}
            </div>
            <div className="review-lightbox-meta">
              <div>
                <span>Pro player review</span>
                <strong>{selectedPro.name} · {selectedPro.realName}</strong>
              </div>
              <div className="review-lightbox-position">
                {selectedIndex + 1} / {PRO_REVIEWS.length}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="review-lightbox-arrow is-next"
            onClick={showNext}
            aria-label="Next pro review"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      )}
    </section>
  );
}
