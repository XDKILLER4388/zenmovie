import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './Watch.css';

// Wraps the embed in a srcdoc iframe we control
// This lets us override window.top/parent before the embed runs
function buildSrcdoc(embedUrl) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>*{margin:0;padding:0}html,body,iframe{width:100%;height:100%;border:none;background:#000;display:block;overflow:hidden}</style>
<script>
(function(){
  try{Object.defineProperty(window,'top',{get:function(){return window;},configurable:true});}catch(e){}
  try{Object.defineProperty(window,'parent',{get:function(){return window;},configurable:true});}catch(e){}
  window.open=function(){return null;};
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el){
      if(el.tagName==='A'&&el.href){
        try{var u=new URL(el.href);if(u.origin!==window.location.origin){e.preventDefault();e.stopImmediatePropagation();return;}}catch(ex){}
      }
      el=el.parentElement;
    }
  },true);
})();
<\/script>
</head><body>
<iframe src="${embedUrl}" allowfullscreen allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="no-referrer"></iframe>
</body></html>`;
}

function getMovieServers(tmdbId) {
  return [
    { name: 'Server 1', url: `https://moviesapi.club/movie/${tmdbId}` },
    { name: 'Server 2', url: `https://vidlink.pro/movie/${tmdbId}?primaryColor=ffffff&autoplay=true` },
    { name: 'Server 3', url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}` },
    { name: 'Server 4', url: `https://vidsrc.icu/embed/movie/${tmdbId}` },
    { name: 'Server 5', url: `https://vidsrc.to/embed/movie/${tmdbId}` },
  ];
}

function getTVServers(tmdbId, season, episode) {
  return [
    { name: 'Server 1', url: `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}` },
    { name: 'Server 2', url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=ffffff&autoplay=true` },
    { name: 'Server 3', url: `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}` },
    { name: 'Server 4', url: `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}` },
    { name: 'Server 5', url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}` },
  ];
}

export default function Watch() {
  const { type, id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        if (type === 'movie') {
          const movie = await api.getDiscoverMovie(id);
          setContent(movie);
          setServers(getMovieServers(id));
        } else if (type === 'episode') {
          const epInfo = JSON.parse(sessionStorage.getItem('currentEpisode') || 'null');
          if (epInfo) {
            setContent({ title: `${epInfo.seriesTitle} — S${String(epInfo.season).padStart(2,'0')}E${String(epInfo.episode).padStart(2,'0')}` });
            setServers(getTVServers(epInfo.tmdbId, epInfo.season, epInfo.episode));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    if (user) {
      api.addHistory({ content_type: type === 'movie' ? 'movie' : 'episode', content_id: parseInt(id), progress: 0, duration: 0 }).catch(() => {});
    }
  }, [type, id, user]);

  if (loading) return <div className="watch watch--loading"><div className="watch__spinner" /></div>;

  if (!servers.length) return (
    <div className="watch watch--error">
      <div className="watch__error-content">
        <div className="watch__error-icon">⚠</div>
        <h2>Stream Unavailable</h2>
        <p>Could not load this content.</p>
        <button onClick={() => navigate(-1)} className="watch__back-btn">← Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="watch">
      <div className="watch__topbar">
        <button onClick={() => navigate(-1)} className="watch__back">← Back</button>
        {content && <span className="watch__title">{content.title}</span>}
      </div>

      <div className="watch__player">
        <div className="watch__iframe-wrap">
          {/* Outer iframe uses srcdoc — we own this page, so our blocker runs first */}
          <iframe
            key={activeServer}
            className="watch__iframe"
            srcDoc={buildSrcdoc(servers[activeServer].url)}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            title="Video Player"
          />
        </div>
      </div>

      <div className="watch__bottom-bar">
        <span className="watch__servers-label">Servers:</span>
        <div className="watch__server-switcher">
          {servers.map((s, i) => (
            <button
              key={i}
              className={`watch__server-btn ${i === activeServer ? 'active' : ''}`}
              onClick={() => setActiveServer(i)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <span className="watch__fallback-text">Switch server if one doesn't work</span>
      </div>
    </div>
  );
}
