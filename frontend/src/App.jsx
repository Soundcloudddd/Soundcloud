import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import './App.css'

axios.defaults.withCredentials = true
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api'

function App() {
  const [tracks, setTracks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [formVisible, setFormVisible] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    artist: '',
    description: '',
    genre: '',
    audio_file: null,
    cover_image: null,
  })
  const [currentTrack, setCurrentTrack] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [loopMode, setLoopMode] = useState(false)
  const [shuffleMode, setShuffleMode] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [durationState, setDurationState] = useState(0)
  const [volume, setVolume] = useState(1)
  const [activeTab, setActiveTab] = useState('home')
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [playlistFormVisible, setPlaylistFormVisible] = useState(false)
  const [playlistForm, setPlaylistForm] = useState({
    name: '',
    description: '',
  })
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [addTrackModalVisible, setAddTrackModalVisible] = useState(false)

  const audioRef = useRef(new Audio())
  const audioInputRef = useRef(null)
  const coverInputRef = useRef(null)

  useEffect(() => {
    fetchTracks()
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    const handleTimeUpdate = () => {
      setElapsed(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const handleEnded = async () => {
      const nextTrack = await getNextTrack()
      if (nextTrack) {
        setTrackAsCurrent(nextTrack)
        setPlaying(true)
      } else {
        setPlaying(false)
      }
    }
    const handleLoadedMetadata = () => setDurationState(audio.duration || 0)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [loopMode, shuffleMode])

  useEffect(() => {
    const audio = audioRef.current
    if (!currentTrack || !currentTrack.audio_file) {
      return
    }

    audio.src = currentTrack.audio_file
    audio.load()
    if (playing) {
      audio.play().catch(() => setPlaying(false))
    }
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (playing) {
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [playing])

  const fetchTracks = async (query = '') => {
    setLoading(true)
    try {
      const params = query ? { search: query } : {}
      const { data } = await axios.get(`${API_BASE}/tracks/`, { params })
      setTracks(data)
      setStatusMessage('')
    } catch (error) {
      setStatusMessage('Не вдалося завантажити треки. Перевір API.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylists = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/playlists/`)
      setPlaylists(data)
    } catch (error) {
      setStatusMessage('Не вдалося завантажити плейлисти.')
    }
  }

  const handleCreatePlaylist = async (event) => {
    event.preventDefault()

    if (!playlistForm.name.trim()) {
      setStatusMessage('Введи назву плейлиста')
      return
    }

    try {
      await axios.post(`${API_BASE}/playlists/`, {
        name: playlistForm.name,
        description: playlistForm.description,
      })
      setStatusMessage('Плейлист створено!')
      setPlaylistForm({ name: '', description: '' })
      setPlaylistFormVisible(false)
      fetchPlaylists()
    } catch (error) {
      setStatusMessage('Не вдалося створити плейлист.')
    }
  }

  const handleDeletePlaylist = async (id) => {
    try {
      await axios.delete(`${API_BASE}/playlists/${id}/`)
      setStatusMessage('Плейлист видалено!')
      fetchPlaylists()
    } catch (error) {
      setStatusMessage('Не вдалося видалити плейлист.')
    }
  }

  const handleAddTrackToPlaylist = async (trackId) => {
    if (!selectedPlaylist) return

    try {
      const { data } = await axios.post(`${API_BASE}/playlists/${selectedPlaylist.id}/add_track/`, {
        track_id: trackId,
      })
      setSelectedPlaylist(data)
      setAddTrackModalVisible(false)
      setStatusMessage('Пісню додано до плейлиста!')
      fetchPlaylists()
    } catch (error) {
      setStatusMessage(error.response?.data?.error || 'Не вдалося додати пісню до плейлиста.')
    }
  }

  const handleRemoveTrackFromPlaylist = async (playlistId, trackId) => {
    try {
      await axios.post(`${API_BASE}/playlists/${playlistId}/remove_track/`, {
        track_id: trackId,
      })
      setStatusMessage('Пісню видалено з плейлиста!')
      if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        setSelectedPlaylist({ ...selectedPlaylist, tracks: selectedPlaylist.tracks.filter(t => t.id !== trackId) })
      }
      fetchPlaylists()
    } catch (error) {
      setStatusMessage('Не вдалося видалити пісню з плейлиста.')
    }
  }

  useEffect(() => {
    if (activeTab === 'playlists') {
      fetchPlaylists()
    }
  }, [activeTab])

  const handleSearch = async (event) => {
    event.preventDefault()
    fetchTracks(search)
  }

  const handleFormChange = (event) => {
    const { name, value, type, files } = event.target
    if (type === 'file') {
      setForm((prev) => ({ ...prev, [name]: files[0] || null }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('artist', form.artist)
    formData.append('description', form.description)
    formData.append('genre', form.genre)

    if (form.audio_file) {
      formData.append('audio_file', form.audio_file)
    }
    if (form.cover_image) {
      formData.append('cover_image', form.cover_image)
    }

    setStatusMessage('Завантаження треку...')

    try {
      await axios.post(`${API_BASE}/tracks/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setStatusMessage('Трек успішно додано!')
      setForm({ title: '', artist: '', description: '', genre: '', audio_file: null, cover_image: null })
      if (audioInputRef.current) audioInputRef.current.value = ''
      if (coverInputRef.current) coverInputRef.current.value = ''
      setFormVisible(false)
      fetchTracks(search)
    } catch (error) {
      setStatusMessage('Не вдалося додати трек. Перевірте дані та сервер.')
    }
  }

  const handlePlayTrack = (track) => {
    if (!track.audio_file) {
      setStatusMessage('Цей трек не має аудіофайлу.')
      return
    }

    if (currentTrack?.id === track.id) {
      setPlaying((prev) => !prev)
    } else {
      setTrackAsCurrent(track)
      setPlaying(true)
    }
  }

  const setTrackAsCurrent = (track) => {
    setCurrentTrack(track)
    setRecentlyPlayed((previousTracks) => [
      track,
      ...previousTracks.filter((item) => item.id !== track.id),
    ].slice(0, 3))
  }

  const handleTogglePlay = () => {
    if (!currentTrack) {
      return
    }
    setPlaying((prev) => !prev)
  }

  const handleSkipBack = () => {
    if (!currentTrack || tracks.length === 0) return
    const index = tracks.findIndex((track) => track.id === currentTrack.id)
    const prev = tracks[index - 1] || tracks[tracks.length - 1]
    setTrackAsCurrent(prev)
    setPlaying(true)
  }

  const getNextTrack = async () => {
    if (!currentTrack) {
      return null
    }

    try {
      const params = {
        current_id: currentTrack.id,
        shuffle: shuffleMode ? 'true' : 'false',
        loop: loopMode ? 'true' : 'false',
      }
      const { data } = await axios.get(`${API_BASE}/tracks/next-track/`, { params })
      return data
    } catch (error) {
      return null
    }
  }

  const handleSkipForward = async () => {
    if (!currentTrack || tracks.length === 0) return
    const nextTrack = await getNextTrack()
    if (nextTrack) {
      setTrackAsCurrent(nextTrack)
      setPlaying(true)
    } else {
      setPlaying(false)
    }
  }

  const handleLikeTrack = async (track) => {
    try {
      const { data } = await axios.post(`${API_BASE}/tracks/${track.id}/like/`)
      setTracks((prev) => prev.map((item) => (item.id === track.id ? data : item)))
      if (currentTrack?.id === track.id) {
        setCurrentTrack(data)
      }
    } catch (error) {
      setStatusMessage('Не вдалося поставити лайк.')
    }
  }

  const formatTime = (value) => {
    const rounded = Math.floor(value)
    const minutes = Math.floor(rounded / 60)
    const seconds = rounded % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleToggleLoop = () => setLoopMode((prev) => !prev)
  const handleToggleShuffle = () => setShuffleMode((prev) => !prev)

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value)
    setVolume(newVolume)
    audioRef.current.volume = newVolume
  }

  const handleSkipBackward5 = () => {
    if (!currentTrack) return
    const audio = audioRef.current
    audio.currentTime = Math.max(0, audio.currentTime - 5)
  }

  const handleSkipForward5 = () => {
    if (!currentTrack) return
    const audio = audioRef.current
    audio.currentTime = Math.min(durationState, audio.currentTime + 5)
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">Sound<span>Cloud</span></div>
        <form className="search" onSubmit={handleSearch}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Пошук пісні за назвою"
            aria-label="Search tracks"
          />
          <button type="submit">Знайти</button>
        </form>
        <button className="primary-btn" type="button" onClick={() => setFormVisible((visible) => !visible)}>
          {formVisible ? 'Приховати форму' : 'Додати пісню'}
        </button>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            <ul>
              <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>Home</li>
              <li className={activeTab === 'discover' ? 'active' : ''} onClick={() => setActiveTab('discover')}>Discover</li>
              <li className={activeTab === 'stream' ? 'active' : ''} onClick={() => setActiveTab('stream')}>Stream</li>
              <li className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>Library</li>
              <li className={activeTab === 'playlists' ? 'active' : ''} onClick={() => setActiveTab('playlists')}>Playlists</li>
            </ul>
          </nav>
        </aside>

        <main className="main">
          {activeTab === 'home' && (
            <>
              <section className="hero">
                <h1>Listen to your favorite tracks</h1>
                <p>Explore. Play. Share.</p>
              </section>

              {formVisible && (
            <section className="track-form-section">
              <h2 className="section-title">Додати нову пісню</h2>
              <form className="track-form" onSubmit={handleSubmit}>
                <div className="field-row">
                  <label>
                    Назва
                    <input name="title" value={form.title} onChange={handleFormChange} required />
                  </label>
                  <label>
                    Виконавець
                    <input name="artist" value={form.artist} onChange={handleFormChange} required />
                  </label>
                </div>
                <div className="field-row">
                  <label>
                    Жанр
                    <input name="genre" value={form.genre} onChange={handleFormChange} />
                  </label>
                  <label>
                    Опис
                    <input name="description" value={form.description} onChange={handleFormChange} />
                  </label>
                </div>
                <div className="field-row">
                  <label>
                    Аудіофайл
                    <input ref={audioInputRef} type="file" name="audio_file" accept="audio/*" onChange={handleFormChange} required />
                  </label>
                  <label>
                    Обкладинка
                    <input ref={coverInputRef} type="file" name="cover_image" accept="image/*" onChange={handleFormChange} />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="secondary-btn" type="submit">Додати до бази</button>
                </div>
              </form>
              {statusMessage && <div className="status-message">{statusMessage}</div>}
            </section>
          )}

          <section className="tracks">
            <div className="tracks-header">
              <h2 className="section-title">Tracks</h2>
              <div>{loading ? 'Завантаження...' : `${tracks.length} треків`}</div>
            </div>
            {tracks.length === 0 && !loading ? (
              <div className="empty-state">Поки що треків немає. Натисни «Знайти» або додай нову пісню.</div>
            ) : (
              tracks.map((track) => {
                const active = currentTrack?.id === track.id
                return (
                  <article className={`track-card ${active ? 'playing' : ''}`} key={track.id}>
                    <button className="play-btn" type="button" onClick={() => handlePlayTrack(track)}>
                      {active && playing ? '❚❚' : '▶'}
                    </button>
                    <div className="art">
                      {track.cover_image ? (
                        <img src={track.cover_image} alt={track.title} />
                      ) : (
                        <div className="art-placeholder">🎵</div>
                      )}
                    </div>
                    <div className="meta">
                      <div className="title">{track.title}</div>
                      <div className="artist">{track.artist}</div>
                      <div className="track-info">
                        {track.genre && <span>{track.genre}</span>}
                        <span>{track.description}</span>
                      </div>
                    </div>
                    <div className="track-wave" />
                    <div className="actions">
                      <button
                        className={`like-btn ${track.liked ? 'liked' : ''}`}
                        type="button"
                        onClick={() => handleLikeTrack(track)}
                        disabled={track.liked}
                      >
                        ♥ {track.likes ?? 0}
                      </button>
                    </div>
                    <div className="duration">{track.duration ? `${track.duration}s` : 'n/a'}</div>
                  </article>
                )
              })
            )}
          </section>
            </>
          )}

          {activeTab === 'playlists' && (
            <>
              <section className="playlists-section">
                <div className="section-header">
                  <h2 className="section-title">Плейлисти</h2>
                  <button 
                    className="primary-btn" 
                    onClick={() => setPlaylistFormVisible(!playlistFormVisible)}
                  >
                    {playlistFormVisible ? 'Приховати форму' : '+ Новий плейлист'}
                  </button>
                </div>

                {playlistFormVisible && (
                  <form className="playlist-form" onSubmit={handleCreatePlaylist}>
                    <div className="field-row">
                      <label>
                        Назва плейлиста
                        <input 
                          value={playlistForm.name} 
                          onChange={(e) => setPlaylistForm({...playlistForm, name: e.target.value})}
                          required
                        />
                      </label>
                      <label>
                        Опис (необов'язково)
                        <input 
                          value={playlistForm.description} 
                          onChange={(e) => setPlaylistForm({...playlistForm, description: e.target.value})}
                        />
                      </label>
                    </div>
                    <button className="secondary-btn" type="submit">Створити</button>
                  </form>
                )}

                {statusMessage && <div className="status-message">{statusMessage}</div>}

                {selectedPlaylist ? (
                  <div className="playlist-view">
                    <button 
                      className="back-btn"
                      onClick={() => setSelectedPlaylist(null)}
                    >
                      ← Назад до плейлистів
                    </button>
                    <h2>{selectedPlaylist.name}</h2>
                    {selectedPlaylist.description && <p>{selectedPlaylist.description}</p>}
                    <button
                      className="add-track-btn"
                      type="button"
                      onClick={() => setAddTrackModalVisible(true)}
                    >
                      + Додати пісню
                    </button>
                    
                    {selectedPlaylist.tracks.length === 0 ? (
                      <div className="empty-state">У цьому плейлисті поки що немає пісень.</div>
                    ) : (
                      <div className="playlist-tracks">
                        {selectedPlaylist.tracks.map((track) => (
                          <div className="playlist-track-item" key={track.id}>
                            <div className="track-info">
                              <strong>{track.title}</strong>
                              <span>{track.artist}</span>
                            </div>
                            <button
                              className="playlist-play-btn"
                              type="button"
                              onClick={() => handlePlayTrack(track)}
                              aria-label={`Відтворити ${track.title}`}
                            >
                              {currentTrack?.id === track.id && playing ? '❚❚' : '▶'}
                            </button>
                            <button 
                              className="remove-btn"
                              type="button"
                              onClick={() => handleRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}
                            >
                              Видалити
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {playlists.length === 0 ? (
                      <div className="empty-state">Плейлистів немає. Створи перший! 🎵</div>
                    ) : (
                      <div className="playlists-list">
                        {playlists.map((playlist) => (
                          <div className="playlist-item" key={playlist.id}>
                            <div className="playlist-info" onClick={() => setSelectedPlaylist(playlist)}>
                              <h3>{playlist.name}</h3>
                              {playlist.description && <p>{playlist.description}</p>}
                              <small>{playlist.track_count} пісень</small>
                            </div>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDeletePlaylist(playlist.id)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}

          {addTrackModalVisible && selectedPlaylist && (
            <div className="modal-overlay" onClick={() => setAddTrackModalVisible(false)}>
              <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h2>Додати пісню</h2>
                  <button
                    className="modal-close-btn"
                    type="button"
                    aria-label="Закрити"
                    onClick={() => setAddTrackModalVisible(false)}
                  >
                    ×
                  </button>
                </div>
                <p>Оберіть пісню для «{selectedPlaylist.name}»</p>

                {tracks.length === 0 ? (
                  <div className="empty-state">Доступних пісень поки немає.</div>
                ) : (
                  <div className="track-selection-list">
                    {tracks.map((track) => {
                      const isAdded = selectedPlaylist.tracks.some((item) => item.id === track.id)

                      return (
                        <button
                          className="track-selection-item"
                          disabled={isAdded}
                          key={track.id}
                          type="button"
                          onClick={() => handleAddTrackToPlaylist(track.id)}
                        >
                          {track.cover_image ? (
                            <img src={track.cover_image} alt="" />
                          ) : (
                            <span className="track-selection-cover">🎵</span>
                          )}
                          <span className="track-selection-meta">
                            <strong>{track.title}</strong>
                            <small>{track.artist}</small>
                          </span>
                          <span className="track-selection-action">{isAdded ? 'Додано' : '+ Додати'}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>

        <aside className="rightbar">
          <section className="recently-played-section">
            <h3>Recently Played</h3>
            {recentlyPlayed.length === 0 ? (
              <div className="empty-state">Тут з’являться останні прослухані пісні.</div>
            ) : (
              <div className="recently-played-list">
                {recentlyPlayed.map((track) => {
                  const isPlaying = currentTrack?.id === track.id && playing

                  return (
                    <button
                      className={`recently-played-item ${isPlaying ? 'playing' : ''}`}
                      key={track.id}
                      type="button"
                      onClick={() => handlePlayTrack(track)}
                    >
                      {track.cover_image ? (
                        <img src={track.cover_image} alt="" />
                      ) : (
                        <span className="recently-played-cover">🎵</span>
                      )}
                      <span className="recently-played-meta">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                      <span className="recently-played-control">{isPlaying ? '❚❚' : '▶'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="liked-section">
            <h3>Liked Tracks</h3>
            {tracks.filter((track) => track.liked).length === 0 ? (
              <div className="empty-state">У вас ще нема вподобаних треків.</div>
            ) : (
              tracks.filter((track) => track.liked).map((track) => (
                <div className="liked-track-item" key={track.id}>
                  <div className="liked-track-info">
                    <div className="liked-track-title">{track.title}</div>
                    <div className="liked-track-artist">{track.artist}</div>
                  </div>
                  <button className="liked-play-btn" type="button" onClick={() => handlePlayTrack(track)}>
                    ▶
                  </button>
                </div>
              ))
            )}
          </section>

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
          <button type="button" onClick={handleSkipBack}>◀</button>
          <button type="button" onClick={handleTogglePlay}>{playing ? '❚❚' : '▶'}</button>
          <button type="button" onClick={handleSkipForward}>▶</button>
          <button
            type="button"
            className={`toggle-btn ${shuffleMode ? 'active' : ''}`}
            onClick={handleToggleShuffle}
          >
            Shuffle
          </button>
          <button
            type="button"
            className={`toggle-btn ${loopMode ? 'active' : ''}`}
            onClick={handleToggleLoop}
          >
            Loop
          </button>
          <div className="volume-control">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              title={`Гучність: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>
        <div className="now">
          <div className="now-title">
            {currentTrack ? `${currentTrack.artist} — ${currentTrack.title}` : 'No track playing'}
          </div>
          <div className="progress-container">
            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="skip-buttons">
              <button type="button" className="skip-btn" onClick={handleSkipBackward5} title="Назад на 5 сек">⏪ -5s</button>
              <button type="button" className="skip-btn" onClick={handleSkipForward5} title="Вперед на 5 сек">+5s ⏩</button>
            </div>
          </div>
          <div className="time-labels">
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(durationState)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
