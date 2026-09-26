import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'

axios.defaults.withCredentials = true
axios.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('sonik_access_token') ?? localStorage.getItem('access')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api'
const API = API_BASE.replace(/\/api\/?$/, '')

function getErrorMessage(data) {
  if (data?.detail) return data.detail
  if (data?.non_field_errors) return data.non_field_errors.join(' ')

  const messages = Object.values(data ?? {}).flat()
  return messages.join(' ') || 'Не вдалося виконати запит. Спробуйте ще раз.'
}

function TrackShelf({ tracks, currentTrack, playing, onPlay, onLike, emptyMessage }) {
  if (tracks.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>
  }

  return (
    <div className="track-shelf">
      {tracks.map((track) => {
        const isPlaying = currentTrack?.id === track.id && playing

        return (
          <article className={`shelf-track ${isPlaying ? 'playing' : ''}`} key={track.id}>
            <button
              className="shelf-cover"
              type="button"
              onClick={() => onPlay(track)}
              aria-label={`${isPlaying ? 'Пауза' : 'Відтворити'} ${track.title}`}
            >
              {track.cover_image ? <img src={track.cover_image} alt="" /> : <span>🎵</span>}
              <span className="shelf-play">{isPlaying ? '❚❚' : '▶'}</span>
            </button>
            <div className="shelf-meta">
              <strong title={track.title}>{track.title}</strong>
              <span title={track.artist}>{track.artist}</span>
              {track.genre && <small>{track.genre}</small>}
            </div>
            <button
              className={`shelf-like ${track.liked ? 'liked' : ''}`}
              type="button"
              onClick={() => onLike(track)}
              aria-label={`${track.liked ? 'Прибрати вподобання' : 'Вподобати'} ${track.title}`}
            >
              ♥ <span>{track.likes ?? 0}</span>
            </button>
          </article>
        )
      })}
    </div>
  )
}

function Home() {
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
  const [libraryTab, setLibraryTab] = useState('recent')
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [recommendations, setRecommendations] = useState([])
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
    fetchRecommendations()
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
    const handleLoadedMetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0
      setDurationState(duration)
      setElapsed(0)
    }

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

    // Do not reload the audio element during a normal React re-render: loading it
    // again resets `currentTime` to zero.
    if (audio.src !== new URL(currentTrack.audio_file, window.location.href).href) {
      audio.src = currentTrack.audio_file
      audio.load()
    }
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

  const fetchRecommendations = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/tracks/recommendations/`)
      setRecommendations(data)
    } catch {
      setRecommendations([])
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
    if (activeTab === 'playlists' || activeTab === 'library') {
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
    setElapsed(0)
    setProgress(0)
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

  const handleLikeTrack = async (track) => {
    try {
      const { data } = await axios.post(`${API_BASE}/tracks/${track.id}/like/`)
      setTracks((prev) => prev.map((item) => (item.id === track.id ? data : item)))
      if (currentTrack?.id === track.id) {
        setCurrentTrack(data)
      }
      fetchRecommendations()
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

  const getPreviousTrack = async () => {
    if (!currentTrack) {
      return null
    }

    try {
      const params = {
        current_id: currentTrack.id,
        shuffle: shuffleMode ? 'true' : 'false',
        loop: loopMode ? 'true' : 'false',
      }
      const { data } = await axios.get(`${API_BASE}/tracks/previous-track/`, { params })
      return data
    } catch (error) {
      return null
    }
  }

  const handlePreviousTrack = async () => {
    if (!currentTrack) return
    const previousTrack = await getPreviousTrack()
    if (previousTrack) {
      setTrackAsCurrent(previousTrack)
      setPlaying(true)
    }
  }

  const handleNextTrack = async () => {
    if (!currentTrack || tracks.length === 0) return
    const nextTrack = await getNextTrack()
    if (nextTrack) {
      setTrackAsCurrent(nextTrack)
      setPlaying(true)
    } else {
      setPlaying(false)
    }
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

  const popularTracks = [...tracks]
    .sort((first, second) => (second.likes ?? 0) - (first.likes ?? 0))
    .slice(0, 6)
  const newTracks = [...tracks]
    .sort((first, second) => new Date(second.created_at ?? 0) - new Date(first.created_at ?? 0))
    .slice(0, 6)
  const genres = [...new Set(tracks.map((track) => track.genre?.trim()).filter(Boolean))].slice(0, 8)
  const streamTracks = [...recentlyPlayed, ...newTracks.filter(
    (track) => !recentlyPlayed.some((played) => played.id === track.id),
  )].slice(0, 8)

  return (
    <div className="app-root">
      <header className="app-header">
        <button
          className="logo"
          type="button"
          onClick={() => setActiveTab('home')}
          aria-label="Go to home page"
        >
          Sound<span>Cloud</span>
        </button>
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
              <li className={activeTab === 'discover' ? 'active' : ''} onClick={() => setActiveTab('discover')}>Discover</li>
              <li className={activeTab === 'stream' ? 'active' : ''} onClick={() => setActiveTab('stream')}>Stream</li>
              <li className={activeTab === 'library' ? 'active' : ''} onClick={() => { setActiveTab('library'); setLibraryTab('recent') }}>Library</li>
              <li className={activeTab === 'playlists' ? 'active' : ''} onClick={() => { setActiveTab('playlists'); setLibraryTab('playlists') }}>Playlists</li>
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

          {activeTab === 'discover' && (
            <section className="discovery-page">
              <div className="page-intro">
                <p className="eyebrow">DISCOVER</p>
                <h1>Знайдіть свій наступний улюблений трек</h1>
                <p>Добірки створені з популярних, нових і близьких вам за жанром композицій.</p>
              </div>

              <section className="discovery-section">
                <div className="section-heading">
                  <div>
                    <h2>Рекомендовано для вас</h2>
                    <p>На основі жанрів треків, які ви вподобали.</p>
                  </div>
                </div>
                <TrackShelf
                  tracks={recommendations}
                  currentTrack={currentTrack}
                  playing={playing}
                  onPlay={handlePlayTrack}
                  onLike={handleLikeTrack}
                  emptyMessage="Вподобайте кілька треків, і тут з’являться персональні рекомендації."
                />
              </section>

              <section className="discovery-section">
                <div className="section-heading">
                  <div>
                    <h2>Популярне зараз</h2>
                    <p>Треки, які найчастіше вподобають слухачі.</p>
                  </div>
                </div>
                <TrackShelf
                  tracks={popularTracks}
                  currentTrack={currentTrack}
                  playing={playing}
                  onPlay={handlePlayTrack}
                  onLike={handleLikeTrack}
                  emptyMessage="Щойно тут з’являться треки — ви побачите найпопулярніші."
                />
              </section>

              <section className="discovery-section">
                <div className="section-heading">
                  <div>
                    <h2>Нові релізи</h2>
                    <p>Нещодавно додані композиції.</p>
                  </div>
                </div>
                <TrackShelf
                  tracks={newTracks}
                  currentTrack={currentTrack}
                  playing={playing}
                  onPlay={handlePlayTrack}
                  onLike={handleLikeTrack}
                  emptyMessage="Нових треків поки немає."
                />
              </section>

              <section className="discovery-section">
                <div className="section-heading">
                  <div>
                    <h2>Жанри</h2>
                    <p>Швидкий перехід до музики за настроєм.</p>
                  </div>
                </div>
                {genres.length === 0 ? (
                  <div className="empty-state">Додайте жанри до треків, щоб відкривати музику за категоріями.</div>
                ) : (
                  <div className="genre-list">
                    {genres.map((genre) => (
                      <button key={genre} type="button" onClick={() => { setSearch(genre); fetchTracks(genre); setActiveTab('home') }}>
                        {genre}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </section>
          )}

          {activeTab === 'stream' && (
            <section className="stream-page">
              <div className="page-intro">
                <p className="eyebrow">YOUR STREAM</p>
                <h1>Ваша музична стрічка</h1>
                <p>Повертайтеся до прослуханого та відкривайте свіжі треки.</p>
              </div>

              <section className="discovery-section">
                <div className="section-heading">
                  <div>
                    <h2>Продовжити слухати</h2>
                    <p>Ваші останні відтворені треки.</p>
                  </div>
                </div>
                <TrackShelf
                  tracks={recentlyPlayed}
                  currentTrack={currentTrack}
                  playing={playing}
                  onPlay={handlePlayTrack}
                  onLike={handleLikeTrack}
                  emptyMessage="Відтворіть будь-який трек, щоб він з’явився у вашій стрічці."
                />
              </section>

              <section className="discovery-section">
                <div className="section-heading">
                  <div>
                    <h2>Свіже у стрічці</h2>
                    <p>Нові композиції та ваша недавня музика в одному місці.</p>
                  </div>
                </div>
                <TrackShelf
                  tracks={streamTracks}
                  currentTrack={currentTrack}
                  playing={playing}
                  onPlay={handlePlayTrack}
                  onLike={handleLikeTrack}
                  emptyMessage="Стрічка з’явиться, коли буде доступна музика."
                />
              </section>
            </section>
          )}

          {(activeTab === 'playlists' || activeTab === 'library') && (
            <>
              <section className="playlists-section">
                <div className="library-tabs" role="tablist" aria-label="Library sections">
                  <button
                    className={libraryTab === 'recent' ? 'active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={libraryTab === 'recent'}
                    onClick={() => setLibraryTab('recent')}
                  >
                    Останні зіграні пісні
                  </button>
                  <button
                    className={libraryTab === 'playlists' ? 'active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={libraryTab === 'playlists'}
                    onClick={() => setLibraryTab('playlists')}
                  >
                    Усі плейлисти
                  </button>
                </div>

                {libraryTab === 'recent' ? (
                  <div className="library-recent-list">
                    {recentlyPlayed.length === 0 ? (
                      <div className="empty-state">Ще немає зіграних пісень.</div>
                    ) : (
                      recentlyPlayed.map((track) => (
                        <button
                          className="recently-played-item"
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
                          <span className="recently-played-control">▶</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <>
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

          <section className="recommendations-section">
            <h3>Recommended for You</h3>
            {recommendations.length === 0 ? (
              <div className="empty-state">
                Like tracks to get recommendations by genre.
              </div>
            ) : (
              recommendations.map((track) => (
                <div className="liked-track-item" key={track.id}>
                  <div className="liked-track-info">
                    <div className="liked-track-title">{track.title}</div>
                    <div className="liked-track-artist">
                      {track.artist}{track.genre ? ` · ${track.genre}` : ''}
                    </div>
                  </div>
                  <button
                    className="liked-play-btn"
                    type="button"
                    onClick={() => handlePlayTrack(track)}
                    aria-label={`Play ${track.title}`}
                  >
                    ▶
                  </button>
                </div>
              ))
            )}
          </section>
        </aside>
      </div>

      <div className="player-bar">
        <div className="controls">
          <button type="button" onClick={handlePreviousTrack} disabled={!currentTrack} title="Попередня пісня">⏮</button>
          <button type="button" onClick={handleTogglePlay}>{playing ? '❚❚' : '▶'}</button>
          <button type="button" onClick={handleNextTrack} disabled={!currentTrack} title="Наступна пісня">⏭</button>
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
            <div className="skip-buttons">
              <button type="button" className="skip-btn" onClick={handleSkipBackward5} title="Назад на 5 секунд">⏪ −5 с</button>
              <button type="button" className="skip-btn" onClick={handleSkipForward5} title="Вперед на 5 секунд">+5 с ⏩</button>
            </div>
          </div>
          <div className="time-labels">
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(durationState)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Page({ children, progress }) {
  return (
    <div className="page">
      <div className="auth">{children}</div>
      {progress && (
        <div className="progress-wrap">
          <div className="progress-line"><div className="progress-fill" /></div>
          <div className="progress-text">{progress}</div>
        </div>
      )}
    </div>
  )
}

function BackButton() {
  const navigate = useNavigate();

  return (
    <button className="back-button" onClick={() => navigate(-1)}>
      ←
    </button>
  );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function GoogleSignInButton() {
  const buttonRef = useRef(null)
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured.')
      return undefined
    }

    const renderButton = () => {
      if (!buttonRef.current || !window.google) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError('')
          try {
            const response = await fetch(`${API}/api/auth/google/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(getErrorMessage(data))

            localStorage.setItem('sonik_access_token', data.access)
            localStorage.setItem('sonik_refresh_token', data.refresh)
            localStorage.setItem('access', data.access)
            localStorage.setItem('refresh', data.refresh)
            navigate('/account')
          } catch (requestError) {
            setError(requestError.message)
          }
        },
      })
      buttonRef.current.replaceChildren()
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: Math.floor(buttonRef.current.getBoundingClientRect().width),
      })
    }

    let script = document.getElementById('google-identity-services')
    if (script) {
      renderButton()
      return undefined
    }

    script = document.createElement('script')
    script.id = 'google-identity-services'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = renderButton
    document.head.appendChild(script)
    return undefined
  }, [navigate])

  return (
    <>
      <div className="google-signin-button" ref={buttonRef} />
      {error && <div className="error-text">{error}</div>}
    </>
  )
}

function SocialButtons() {
  return (
    <div className="social-buttons">
      <GoogleSignInButton />
    </div>
  );
}

function Signup() {
  const [email, setEmail] = useState(() => sessionStorage.getItem("signupEmail") || "");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function continueNext() {
    if (!email.trim() || !email.includes("@")) {
      setError("The email you entered is incorrect");
      return;
    }

    sessionStorage.setItem("signupEmail", email.trim());
    navigate("/signup/password");
  }

  return (
    <Page>
      <h1>Sign up or create an account</h1>

      <input
        className={`field ${error ? "field-error" : ""}`}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
      />

      {error && <div className="error-text">ⓘ {error}</div>}

      <button className="yellow-button" onClick={continueNext}>
        Continue
      </button>

      <div className="or">Or</div>

      <SocialButtons />

      <div className="bottom-text">
        Already have an account?{" "}
        <Link to="/login">Log in</Link>
      </div>
    </Page>
  );
}

function SignupPassword() {
  const [password, setPassword] = useState(() => sessionStorage.getItem("signupPassword") || "");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const valid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);

  function continueNext() {
    if (!valid) {
      setError("Пароль не відповідає всім вимогам.")
      return
    }
    if (password !== confirm) {
      setError("Паролі не збігаються.")
      return
    }

    sessionStorage.setItem("signupPassword", password);
    navigate("/signup/profile");
  }

  return (
    <Page progress="Choose a password">
      <BackButton />

      <h1>Create an account</h1>

      <input
        className="field"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setError("")
        }}
      />

      <div className="requirements-title">
        Password requirements:
      </div>

      <div className="requirements">
        <div>• At least 8 characters</div>
        <div>• One uppercase letter</div>
        <div>• One lowercase letter</div>
        <div>• One number</div>
      </div>

      <input
        className="field"
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value)
          setError("")
        }}
      />

      {error && <div className="error-text">{error}</div>}

      <button
        className="yellow-button"
        onClick={continueNext}
      >
        Continue
      </button>
    </Page>
  );
}

function Profile() {
  const [name, setName] = useState(() => sessionStorage.getItem("profileName") || "");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function continueNext() {
    if (!name.trim() || !month || !day || !year || !gender) {
      setError("Заповніть усі поля профілю.")
      return
    }

    sessionStorage.setItem("profileName", name.trim());
    sessionStorage.setItem("profileGender", gender);
    sessionStorage.setItem("profileBirthDate", `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    navigate("/signup/agreement");
  }

  return (
    <Page progress="Tell us a bit about yourself">
      <BackButton />

      <h1>Introduce yourself</h1>

      <input
        className="field"
        placeholder="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setError("")
        }}
      />

      <div className="description">
        Choose a display name that other users will see.
      </div>

      <div className="label">Date of birth</div>

      <div className="date-row">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Month</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1}>{i + 1}</option>
          ))}
        </select>

        <select value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1}>{i + 1}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year</option>
          {Array.from({ length: 100 }, (_, i) => (
            <option key={i}>{new Date().getFullYear() - i}</option>
          ))}
        </select>
      </div>

      <div className="description">
        Your date of birth is kept private.
      </div>

      <select
        className="field"
        value={gender}
        onChange={(e) => {
          setGender(e.target.value)
          setError("")
        }}
      >
        <option value="">Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Prefer not to say</option>
      </select>

      {error && <div className="error-text">{error}</div>}

      <button className="yellow-button" onClick={continueNext}>
        Continue
      </button>
    </Page>
  );
}

function Agreement() {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function createAccount() {
    const email = sessionStorage.getItem("signupEmail") || "";
    const password = sessionStorage.getItem("signupPassword") || "";
    const displayName = sessionStorage.getItem("profileName") || "";
    const gender = sessionStorage.getItem("profileGender") || "";
    const birthDate = sessionStorage.getItem("profileBirthDate") || "";

    if (!email || !password || !displayName || !gender || !birthDate) {
      setError("Сесія реєстрації завершилась. Почніть реєстрацію ще раз.")
      return
    }

    setError("")
    try {
      const response = await fetch(`${API}/api/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          username: email,
          password,
          password_confirm: password,
          display_name: displayName,
          birth_date: birthDate,
          gender: {
            Male: "male",
            Female: "female",
            "Prefer not to say": "not_specified",
          }[gender],
        })
      });

      if (response.ok) {
        const data = await response.json()
        sessionStorage.removeItem("signupEmail")
        sessionStorage.removeItem("signupPassword")
        sessionStorage.removeItem("profileName")
        sessionStorage.removeItem("profileGender")
        sessionStorage.removeItem("profileBirthDate")
        localStorage.setItem("sonik_access_token", data.access)
        localStorage.setItem("sonik_refresh_token", data.refresh)
        navigate("/account");
        return;
      }

      const data = await response.json();
      setError(getErrorMessage(data));
    } catch {
      setError("Не вдалося зв’язатися з бекендом. Перевірте, що сервер запущено на http://127.0.0.1:8000 і оновіть сторінку.");
    }
  }

  return (
    <Page progress="User agreement">
      <BackButton />

      <h1>You must accept the User Agreement</h1>

      <div className="agreement">
        By using Sonik you agree to follow our Community Guidelines,
        respect copyright laws and use the service responsibly.
        By continuing, you confirm that you have read and accepted
        the Sonik User Agreement and Privacy Policy.
      </div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>I agree to the Sonik User Agreement</span>
      </label>

      {error && <div className="error-text">{error}</div>}

      <button
        className="yellow-button"
        disabled={!accepted}
        onClick={createAccount}
      >
        Continue
      </button>
    </Page>
  );
}

function Login() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  function continueNext() {
    if (!value.trim()) return;

    sessionStorage.setItem("loginValue", value.trim());
    navigate("/login/password");
  }

  return (
    <Page>
      <h1>Log in</h1>

      <input
        className="field"
        placeholder="Email address or username"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <button className="yellow-button" onClick={continueNext}>
        Continue
      </button>

      <label className="check-row">
        <input type="checkbox" />
        <span>Save login info on your iCloud devices</span>
      </label>

      <div className="login-tabs">
        <span>Phone</span>
        <span className="active">Email/Username</span>
      </div>

      <Link className="forgot-link" to="/forgot-password">
        Forgot your password?
      </Link>

      <div className="or">Or</div>

      <SocialButtons />

      <div className="bottom-text">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
    </Page>
  );
}

function LoginPassword() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function login() {
    const username = sessionStorage.getItem("loginValue") || "";

    try {
      const response = await fetch(`${API}/api/auth/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        navigate("/home");
      } else {
        setError("The password you entered is incorrect");
      }
    } catch {
      setError("Backend is not running.");
    }
  }

  return (
    <Page>
      <BackButton />

      <h1>Enter your password</h1>

      <input
        className={`field ${error ? "field-error" : ""}`}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
      />

      {error && <div className="error-text">ⓘ {error}</div>}

      <button className="yellow-button" onClick={login}>
        Continue
      </button>

      <Link className="forgot-link" to="/forgot-password">
        Forgot your password?
      </Link>

      <div
        className="verification-link"
        onClick={() => navigate("/verification")}
      >
        Use verification code
      </div>
    </Page>
  );
}

function Verification() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  function updateCode(index, value) {
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  }

  return (
    <Page>
      <BackButton />

      <h1>Enter the verification code</h1>

      <div className="code-row">
        {code.map((value, index) => (
          <input
            key={index}
            id={`code-${index}`}
            className="code-box"
            value={value}
            onChange={(e) => updateCode(index, e.target.value)}
            inputMode="numeric"
            maxLength={1}
          />
        ))}
      </div>

      <button className="resend-button">Resend code</button>

      <div className="verification-help">
        Didn't get a code?
      </div>

      <button className="yellow-button verification-continue">
        Continue
      </button>

      <div className="legal">
        This site is protected to ensure spam and abuse.
        By continuing, you agree to our Privacy Policy and Terms of Service.
      </div>
    </Page>
  );
}

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  async function reset() {
    try {
      const response = await fetch(`${API}/api/auth/password-reset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setMessage(data.detail || "");

      if (data.reset_url) {
        setResetUrl(data.reset_url);
      }
    } catch {
      setMessage("Backend is not running.");
    }
  }

  return (
    <Page>
      <BackButton />

      <h1>Forgot your password?</h1>

      <input
        className="field"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button className="yellow-button" onClick={reset}>
        Send reset link
      </button>

      {message && <div className="hint">{message}</div>}

      {resetUrl && (
        <a className="reset-link" href={resetUrl}>
          Open reset link
        </a>
      )}

      <Link className="forgot-link" to="/login">
        Back to login
      </Link>
    </Page>
  );
}

function ResetPassword() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function save() {
    try {
      const response = await fetch(
        `${API}/api/auth/password-reset-confirm/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uid,
            token,
            password,
            password_confirm: confirm
          })
        }
      );

      if (response.ok) {
        navigate("/login");
        return;
      }

      const data = await response.json();
      setError(data.detail || "Could not change password.");
    } catch {
      setError("Backend is not running.");
    }
  }

  return (
    <Page>
      <BackButton />

      <h1>Reset password</h1>

      <input
        className="field"
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        className="field"
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {error && <div className="error-text">{error}</div>}

      <button className="yellow-button" onClick={save}>
        Save password
      </button>
    </Page>
  );
}

function Account() {
  return (
    <Page>
      <h1>Welcome to Sonik</h1>
      <div className="agreement">Your account is ready.</div>

      <Link className="yellow-link" to="/login">
        Log out
      </Link>
    </Page>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/password" element={<SignupPassword />} />
      <Route path="/signup/profile" element={<Profile />} />
      <Route path="/signup/agreement" element={<Agreement />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/password" element={<LoginPassword />} />
      <Route path="/verification" element={<Verification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
      <Route path="/account" element={<Account />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}
