import React, { useEffect, useMemo, useState } from 'react';

const REVIEW_BATCHES = [
  {
    slug: 'review-3',
    label: 'Review Drop 03',
    imageCount: 20,
    videoCount: 19,
    webpImages: new Set([5, 10])
  },
  {
    slug: 'review-2',
    label: 'Review Drop 02',
    imageCount: 32,
    videoCount: 51,
    webpImages: new Set([13, 18, 26])
  }
];

const FEATURED_PRO_REVIEWS = {
  'review-3-image-019': { name: 'CRYPTO', handle: '@cryptopubgm' },
  'review-3-image-020': { name: 'T24 OP', handle: '@t24_pubgm' },
  'review-3-image-018': { name: 'IQ', handle: '@iq.pubgm' },
  'review-3-image-005': { name: 'GHOOST', handle: '@ig.ghoost' },
  'review-3-image-010': { name: 'FREESTYLER', handle: '@ig_freestylerop' },
  'review-3-image-007': { name: 'HUZAIFA', handle: '@huzaifa.pm' },
  'review-3-image-017': { name: 'AlphaBoy', handle: '@alphaboyy.1' },
  'review-3-image-003': { name: 'VAAZ', handle: '@r3gvaaz' },
  'review-3-video-012': { name: 'UZM', handle: '@ig.uzm' },
  'review-3-video-013': { name: 'IRON', handle: '@ig.ironn' },
  'review-3-image-009': { name: 'GOKU', handle: '@ig.gokubot' },
  'review-2-image-010': { name: 'ALIYAN', handle: '@ig_aliyan13' }
};

const FEATURED_PRO_IDS = Object.keys(FEATURED_PRO_REVIEWS);

const PAGE_SIZE = 8;

function formatSequence(value) {
  return String(value).padStart(3, '0');
}

function createBatchMedia(batch) {
  const media = [];
  const longestSequence = Math.max(batch.imageCount, batch.videoCount);

  for (let sequence = 1; sequence <= longestSequence; sequence += 1) {
    const paddedSequence = formatSequence(sequence);

    if (sequence <= batch.imageCount) {
      const extension = batch.webpImages.has(sequence) ? 'webp' : 'jpg';
      media.push({
        id: `${batch.slug}-image-${paddedSequence}`,
        type: 'image',
        sequence,
        batch: batch.label,
        src: `/assets/reviews/${batch.slug}/images/${batch.slug}-image-${paddedSequence}.${extension}`
      });
    }

    if (sequence <= batch.videoCount) {
      media.push({
        id: `${batch.slug}-video-${paddedSequence}`,
        type: 'video',
        sequence,
        batch: batch.label,
        src: `/assets/reviews/${batch.slug}/videos/${batch.slug}-video-${paddedSequence}.mp4`
      });
    }
  }

  return media;
}

const ALL_REVIEW_MEDIA = REVIEW_BATCHES
  .flatMap(createBatchMedia)
  .map((item) => ({
    ...item,
    featuredPro: FEATURED_PRO_REVIEWS[item.id] || null
  }));

const REVIEW_MEDIA = [
  ...FEATURED_PRO_IDS
    .map((id) => ALL_REVIEW_MEDIA.find((item) => item.id === id))
    .filter(Boolean),
  ...ALL_REVIEW_MEDIA.filter((item) => !item.featuredPro)
];
const PHOTO_COUNT = REVIEW_MEDIA.filter((item) => item.type === 'image').length;
const VIDEO_COUNT = REVIEW_MEDIA.filter((item) => item.type === 'video').length;

const FILTERS = [
  { key: 'all', label: 'All Stories', icon: 'fa-border-all', count: REVIEW_MEDIA.length },
  { key: 'image', label: 'Photos', icon: 'fa-image', count: PHOTO_COUNT },
  { key: 'video', label: 'Videos', icon: 'fa-play', count: VIDEO_COUNT }
];

function ReviewMediaCard({ item, onOpen }) {
  const handlePreviewStart = (event) => {
    if (item.type !== 'video') return;
    const video = event.currentTarget.querySelector('video');
    if (video) video.play().catch(() => {});
  };

  const handlePreviewStop = (event) => {
    if (item.type !== 'video') return;
    const video = event.currentTarget.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  return (
    <button
      type="button"
      className={`review-media-card ${item.featuredPro ? 'is-pro-review' : ''}`}
      onClick={() => onOpen(item)}
      onMouseEnter={handlePreviewStart}
      onMouseLeave={handlePreviewStop}
      aria-label={`Open ${item.batch} ${item.type} review ${formatSequence(item.sequence)}`}
      aria-haspopup="dialog"
    >
      {item.type === 'image' ? (
        <img
          className="review-media-asset"
          src={item.src}
          alt={`Customer review from ${item.batch}, photo ${formatSequence(item.sequence)}`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <video
          className="review-media-asset"
          src={item.src}
          preload="metadata"
          muted
          playsInline
          aria-hidden="true"
        />
      )}

      <span className="review-media-scanline" aria-hidden="true" />

      <span className={`review-media-type ${item.type === 'video' ? 'is-video' : ''}`}>
        <i className={`fa-solid ${item.type === 'video' ? 'fa-play' : 'fa-camera'}`} />
        {item.type === 'video' ? 'Video' : 'Photo'}
      </span>

      {item.featuredPro && (
        <span className="review-pro-mark">
          <i className="fa-solid fa-crown" aria-hidden="true" />
          Featured pro
        </span>
      )}

      {item.type === 'video' && (
        <span className="review-media-play" aria-hidden="true">
          <i className="fa-solid fa-play" />
        </span>
      )}

      <span className="review-media-card-footer">
        <span>
          <strong>{item.featuredPro?.name || 'Customer story'}</strong>
          <small>{item.featuredPro?.handle || item.batch}</small>
        </span>
        <i className="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true" />
      </span>
    </button>
  );
}

export default function ReviewMediaGallery() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedReview, setSelectedReview] = useState(null);

  const filteredMedia = useMemo(
    () => activeFilter === 'all'
      ? REVIEW_MEDIA
      : REVIEW_MEDIA.filter((item) => item.type === activeFilter),
    [activeFilter]
  );

  const visibleMedia = filteredMedia.slice(0, visibleCount);
  const selectedIndex = selectedReview
    ? filteredMedia.findIndex((item) => item.id === selectedReview.id)
    : -1;

  const showPrevious = () => {
    if (selectedIndex < 0) return;
    const previousIndex = selectedIndex === 0 ? filteredMedia.length - 1 : selectedIndex - 1;
    setSelectedReview(filteredMedia[previousIndex]);
  };

  const showNext = () => {
    if (selectedIndex < 0) return;
    const nextIndex = selectedIndex === filteredMedia.length - 1 ? 0 : selectedIndex + 1;
    setSelectedReview(filteredMedia[nextIndex]);
  };

  useEffect(() => {
    if (!selectedReview) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedReview(null);
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  const changeFilter = (filter) => {
    setActiveFilter(filter);
    setVisibleCount(PAGE_SIZE);
    setSelectedReview(null);
  };

  const remainingCount = filteredMedia.length - visibleMedia.length;
  const nextLoadCount = Math.min(PAGE_SIZE, remainingCount);

  return (
    <section id="reviews" className="review-wall-section">
      <div className="container">
        <div className="review-wall-heading">
          <div className="review-wall-copy">
            <div className="section-tag">CUSTOMER PROOF // COMMUNITY ARCHIVE</div>
            <h2 className="section-title">REAL PLAYERS. REAL RECEIPTS.</h2>
            <p className="section-desc">
              Delivery photos, setup shots and video shoutouts shared by the ShopXzetio community across Pakistan.
            </p>
          </div>

        </div>

        <div className="review-wall-toolbar">
          <div className="review-filter-group" role="group" aria-label="Filter customer reviews">
            {FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.key}
                className={`review-filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
                onClick={() => changeFilter(filter.key)}
                aria-pressed={activeFilter === filter.key}
              >
                <i className={`fa-solid ${filter.icon}`} aria-hidden="true" />
                <span>{filter.label}</span>
                <small>{filter.count}</small>
              </button>
            ))}
          </div>

          <div className="review-wall-live-count" aria-live="polite">
            Showing <strong>{visibleMedia.length}</strong> of {filteredMedia.length}
          </div>
        </div>

        <div className="review-media-grid">
          {visibleMedia.map((item) => (
            <ReviewMediaCard key={item.id} item={item} onOpen={setSelectedReview} />
          ))}
        </div>

        {remainingCount > 0 && (
          <div className="review-wall-load-wrap">
            <button
              type="button"
              className="review-wall-load-btn"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              <span>Load {nextLoadCount} more stories</span>
              <i className="fa-solid fa-chevron-down" aria-hidden="true" />
            </button>
            <small>{remainingCount} more in the archive</small>
          </div>
        )}
      </div>

      {selectedReview && (
        <div
          className="review-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedReview.batch} customer review`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedReview(null);
          }}
        >
          <button
            type="button"
            className="review-lightbox-close"
            onClick={() => setSelectedReview(null)}
            aria-label="Close review viewer"
          >
            <i className="fa-solid fa-xmark" />
          </button>

          <button
            type="button"
            className="review-lightbox-arrow is-previous"
            onClick={showPrevious}
            aria-label="Previous customer review"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>

          <div className="review-lightbox-panel">
            <div className="review-lightbox-media">
              {selectedReview.type === 'image' ? (
                <img
                  key={selectedReview.id}
                  src={selectedReview.src}
                  alt={`Customer review from ${selectedReview.batch}`}
                />
              ) : (
                <video
                  key={selectedReview.id}
                  src={selectedReview.src}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                />
              )}
            </div>

            <div className="review-lightbox-meta">
              <div>
                <span>{selectedReview.featuredPro ? 'Featured pro review' : 'Community submission'}</span>
                <strong>{selectedReview.featuredPro?.name || selectedReview.batch}</strong>
              </div>
              <div className="review-lightbox-position">
                {selectedIndex + 1} / {filteredMedia.length}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="review-lightbox-arrow is-next"
            onClick={showNext}
            aria-label="Next customer review"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      )}
    </section>
  );
}
