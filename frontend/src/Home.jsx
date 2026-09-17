import './App.css'

const tracks = [
  { id: 1, title: 'Morning Drive', artist: 'Artist A', duration: '3:45' },
  { id: 2, title: 'Late Night', artist: 'Artist B', duration: '4:12' },
  { id: 3, title: 'Sunset Vibes', artist: 'Artist C', duration: '2:58' },
  { id: 4, title: 'City Lights', artist: 'Artist D', duration: '5:01' },
]

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">Sound<span>Cloud</span></div>
        <div className="search">
          <input placeholder="Search tracks, artists, or playlists" />
        </div>
        <div className="user">Sign in</div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            <ul>
              <li className="active">Home</li>
              <li>Discover</li>
              <li>Stream</li>
              <li>Library</li>
              <li>Playlists</li>
            </ul>
          </nav>
        </aside>

        <main className="main">
          <section className="hero">
            <h1>Listen to your favorite tracks</h1>
            <p>Explore. Play. Share.</p>
          </section>

          <section className="tracks">
            <h2 className="section-title">Tracks</h2>
            {tracks.map((t) => (
              <article className="track-card" key={t.id}>
                <div className="play-btn">▶</div>
                <div className="art" />
                <div className="meta">
                  <div className="title">{t.title}</div>
                  <div className="artist">{t.artist}</div>
                </div>
                <div className="track-wave" />
                <div className="duration">{t.duration}</div>
              </article>
            ))}
          </section>
        </main>

        <aside className="rightbar">
          <h3>Up Next</h3>
          <ul>
            <li>Track 5 — Artist E</li>
            <li>Track 6 — Artist F</li>
            <li>Track 7 — Artist G</li>
          </ul>
        </aside>
      </div>

      <div className="player-bar">
        <div className="controls">
          <button>◀</button>
          <button>▶</button>
          <button>Play</button>
        </div>
        <div className="now">
          <div className="now-title">No track playing</div>
          <div className="progress">
            <div className="bar" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
