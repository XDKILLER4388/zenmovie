import React, { useRef } from 'react';
import ContentCard from './ContentCard';
import './ContentRow.css';

export default function ContentRow({ title, items = [], type = 'movie', loading = false }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: dir * 600, behavior: 'smooth' });
    }
  };

  return (
    <section className="row">
      <div className="row__header">
        <h2 className="row__title">{title}</h2>
        <div className="row__controls">
          <button onClick={() => scroll(-1)} className="row__arrow" aria-label="Scroll left">‹</button>
          <button onClick={() => scroll(1)} className="row__arrow" aria-label="Scroll right">›</button>
        </div>
      </div>
      <div className="row__track" ref={rowRef}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-skeleton skeleton" />
            ))
          : items.map(item => (
              <ContentCard key={item.id} item={item} type={type} />
            ))
        }
      </div>
    </section>
  );
}
