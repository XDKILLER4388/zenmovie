import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.getAdminMovies({ page: p, limit: 20 });
      setMovies(data.results);
      setTotal(data.total);
      setPage(p);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleFeatured = async (movie) => {
    try {
      await api.updateMovie(movie.id, { is_featured: !movie.is_featured });
      setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, is_featured: !m.is_featured } : m));
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const toggleActive = async (movie) => {
    try {
      await api.updateMovie(movie.id, { is_active: !movie.is_active });
      setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, is_active: !m.is_active } : m));
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h2 className="admin-section-title">Movies ({total})</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Year</th>
              <th>Rating</th>
              <th>Featured</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td></tr>
                ))
              : movies.map(m => (
                  <tr key={m.id}>
                    <td className="admin-table__title">{m.title}</td>
                    <td>{m.release_date ? new Date(m.release_date).getFullYear() : '—'}</td>
                    <td>★ {Number(m.rating).toFixed(1)}</td>
                    <td>
                      <button
                        onClick={() => toggleFeatured(m)}
                        className={`admin-toggle ${m.is_featured ? 'on' : 'off'}`}
                      >
                        {m.is_featured ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleActive(m)}
                        className={`admin-toggle ${m.is_active ? 'on' : 'off'}`}
                      >
                        {m.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <div className="admin-pagination">
        <button disabled={page <= 1} onClick={() => load(page - 1)} className="admin-page-btn">← Prev</button>
        <span>Page {page} of {Math.ceil(total / 20)}</span>
        <button disabled={page >= Math.ceil(total / 20)} onClick={() => load(page + 1)} className="admin-page-btn">Next →</button>
      </div>
    </div>
  );
}
