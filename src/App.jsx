import { useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import './App.css'
import { masterManifestUrl } from './config/appConfig'

const STORAGE_PROGRESS_KEY = 'video-progress'
const STORAGE_COMPLETED_KEY = 'video-completed'
const SEEK_SECONDS = 5
const SAVE_PROGRESS_INTERVAL_SECONDS = 2

const formatBitrate = (bitrate) => {
  if (!bitrate || Number.isNaN(bitrate)) return 'N/A'
  return `${(bitrate / 1000000).toFixed(2)} Mbps`
}

const formatTime = (timeInSeconds) => {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) return '0:00'

  const totalSeconds = Math.floor(timeInSeconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const getLevelLabel = (level, index) => {
  if (level.height) return `${level.height}p`
  if (level.bitrate) return `${Math.round(level.bitrate / 1000)} kbps`
  return `Level ${index + 1}`
}

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="player-icon">
    {children}
  </svg>
)

const PlayIcon = () => (
  <Icon>
    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82Z" />
  </Icon>
)

const PauseIcon = () => (
  <Icon>
    <rect x="7" y="6" width="4" height="12" rx="1" />
    <rect x="13" y="6" width="4" height="12" rx="1" />
  </Icon>
)

const VolumeIcon = ({ muted, volume }) => {
  if (muted || volume === 0) {
    return (
      <Icon>
        <path d="M5 9h3.3l4.34-3.47A1 1 0 0 1 14 6.3V17.7a1 1 0 0 1-1.36.77L8.3 15H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
        <path d="m17 9 4 6" />
        <path d="m21 9-4 6" />
      </Icon>
    )
  }

  if (volume < 0.5) {
    return (
      <Icon>
        <path d="M5 9h3.3l4.34-3.47A1 1 0 0 1 14 6.3V17.7a1 1 0 0 1-1.36.77L8.3 15H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
        <path d="M18.5 8.5a5 5 0 0 1 0 7" />
      </Icon>
    )
  }

  return (
    <Icon>
      <path d="M5 9h3.3l4.34-3.47A1 1 0 0 1 14 6.3V17.7a1 1 0 0 1-1.36.77L8.3 15H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
      <path d="M17.5 8a6 6 0 0 1 0 8" />
      <path d="M20 5.5a9.5 9.5 0 0 1 0 13" />
    </Icon>
  )
}

const FullscreenIcon = ({ isFullscreen }) => (
  <Icon>
    {isFullscreen ? (
      <>
        <path d="M8 4H4v4" />
        <path d="M16 4h4v4" />
        <path d="M4 16v4h4" />
        <path d="M20 16v4h-4" />
      </>
    ) : (
      <>
        <path d="M9 4H4v5" />
        <path d="M15 4h5v5" />
        <path d="M4 15v5h5" />
        <path d="M20 15v5h-5" />
      </>
    )}
  </Icon>
)

function App() {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const hlsRef = useRef(null)
  const lastSavedProgressRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [qualityOptions, setQualityOptions] = useState([{ label: 'Auto', value: '-1' }])
  const [selectedQuality, setSelectedQuality] = useState('-1')
  const [currentBitrate, setCurrentBitrate] = useState('N/A')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hlsSupported, setHlsSupported] = useState(true)
  const [hlsError, setHlsError] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const speedOptions = useMemo(() => [0.5, 1, 1.25, 1.5, 2], [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    const savedProgress = Number.parseFloat(localStorage.getItem(STORAGE_PROGRESS_KEY) || '0')

    const onLoadedMetadata = () => {
      setDuration(video.duration)

      if (Number.isFinite(savedProgress) && savedProgress > 0 && savedProgress < video.duration) {
        video.currentTime = savedProgress
        setCurrentTime(savedProgress)
        setProgress((savedProgress / video.duration) * 100)
      }
    }

    const onTimeUpdate = () => {
      if (!video.duration) return

      const currentProgress = (video.currentTime / video.duration) * 100
      setCurrentTime(video.currentTime)
      setProgress(currentProgress)

      if (video.currentTime - lastSavedProgressRef.current >= SAVE_PROGRESS_INTERVAL_SECONDS) {
        localStorage.setItem(STORAGE_PROGRESS_KEY, String(video.currentTime))
        lastSavedProgressRef.current = video.currentTime
      }

      if (video.currentTime / video.duration >= 0.95) {
        localStorage.setItem(STORAGE_COMPLETED_KEY, 'true')
      }
    }

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('volumechange', onVolumeChange)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('volumechange', onVolumeChange)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(masterManifestUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const options = [
          { label: 'Auto', value: '-1' },
          ...hls.levels.map((level, index) => ({
            label: getLevelLabel(level, index),
            value: String(index),
          })),
        ]
        setQualityOptions(options)

        const initialLevelIndex =
          hls.currentLevel >= 0 ? hls.currentLevel : hls.loadLevel >= 0 ? hls.loadLevel : -1
        if (initialLevelIndex >= 0 && hls.levels[initialLevelIndex]?.bitrate) {
          setCurrentBitrate(formatBitrate(hls.levels[initialLevelIndex].bitrate))
        }
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const currentLevel = hls.levels[data.level]
        setCurrentBitrate(formatBitrate(currentLevel?.bitrate))
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setHlsError('Unable to load or play the HLS stream. Please verify the manifest URL.')
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = masterManifestUrl
      setQualityOptions([{ label: 'Auto', value: '-1' }])
      return undefined
    }

    setHlsSupported(false)
    return undefined
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [])

  const handlePlayerKeyDown = (event) => {
    const video = videoRef.current
    if (!video) return

    if (event.code === 'Space') {
      event.preventDefault()
      if (video.paused) {
        void video.play()
      } else {
        video.pause()
      }
    }

    if (event.key.toLowerCase() === 'm') {
      event.preventDefault()
      video.muted = !video.muted
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault()
      if (!Number.isFinite(video.duration) || video.duration <= 0) return
      video.currentTime = Math.min(video.currentTime + SEEK_SECONDS, video.duration)
    }

    if (event.code === 'ArrowLeft') {
      event.preventDefault()
      if (!Number.isFinite(video.duration) || video.duration <= 0) return
      video.currentTime = Math.max(video.currentTime - SEEK_SECONDS, 0)
    }

    if (event.key.toLowerCase() === 'f') {
      event.preventDefault()
      const container = containerRef.current
      if (!container) return

      if (!document.fullscreenElement) {
        void container.requestFullscreen()
      } else {
        void document.exitFullscreen()
      }
    }
  }

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  const onProgressInput = (event) => {
    const video = videoRef.current
    if (!video || !video.duration) return

    const nextProgress = Number(event.target.value)
    video.currentTime = (nextProgress / 100) * video.duration
    setCurrentTime(video.currentTime)
    setProgress(nextProgress)
  }

  const onVolumeInput = (event) => {
    const video = videoRef.current
    if (!video) return

    const nextVolume = Number(event.target.value)
    video.volume = nextVolume
    video.muted = nextVolume === 0
    setVolume(nextVolume)
    setIsMuted(video.muted)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const onSpeedChange = (event) => {
    const video = videoRef.current
    if (!video) return

    const nextSpeed = Number(event.target.value)
    video.playbackRate = nextSpeed
    setPlaybackSpeed(nextSpeed)
  }

  const onQualityChange = (event) => {
    const hls = hlsRef.current
    const nextLevel = Number(event.target.value)

    setSelectedQuality(String(nextLevel))

    if (!hls) return

    hls.currentLevel = nextLevel

    if (nextLevel === -1) {
      setCurrentBitrate('N/A')
      return
    }

    if (nextLevel >= 0 && hls.levels[nextLevel]?.bitrate) {
      setCurrentBitrate(formatBitrate(hls.levels[nextLevel].bitrate))
    }
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      void container.requestFullscreen()
    } else {
      void document.exitFullscreen()
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">YouTube-inspired player</p>
          <h1>Video Streaming Platform</h1>
          <p className="supporting-text">
            Modern overlay controls, responsive dark styling, and the same custom playback
            behavior.
          </p>
        </div>
        <p className="manifest-url">
          Manifest URL: <code>{masterManifestUrl}</code>
        </p>
      </header>

      {!hlsSupported ? (
        <p role="alert" className="status-message">
          This browser does not support HLS playback.
        </p>
      ) : null}
      {hlsError ? (
        <p role="alert" className="status-message">
          {hlsError}
        </p>
      ) : null}

      <section
        className="player-shell"
        ref={containerRef}
        tabIndex={0}
        aria-label="Custom video player"
        onKeyDown={handlePlayerKeyDown}
      >
        <video ref={videoRef} className="video" controls={false} playsInline />
        <p className="bitrate-badge" data-testid="current-bitrate-display">
          Current Bitrate: {currentBitrate}
        </p>

        <div className="controls-overlay">
          <input
            className="progress-bar"
            data-testid="progress-bar"
            type="range"
            min="0"
            max="100"
            value={progress}
            onInput={onProgressInput}
            aria-label="Seek"
            style={{ '--range-progress': `${progress}%` }}
          />

          <div className="control-row">
            <div className="control-group">
              <button
                data-testid="play-pause-button"
                type="button"
                onClick={togglePlayPause}
                className="icon-button"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <button
                data-testid="mute-button"
                type="button"
                onClick={toggleMute}
                className="icon-button"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <VolumeIcon muted={isMuted} volume={volume} />
              </button>

              <input
                className="volume-slider"
                data-testid="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onInput={onVolumeInput}
                aria-label="Volume"
                style={{ '--range-progress': `${(isMuted ? 0 : volume) * 100}%` }}
              />

              <p className="time-display">
                <span className="sr-only">Video time</span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>

            <div className="control-group control-group-right">
              <label className="select-wrapper">
                <span className="select-label">Quality</span>
                <select
                  data-testid="quality-selector"
                  value={selectedQuality}
                  onChange={onQualityChange}
                  aria-label="Quality selector"
                >
                  {qualityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="select-wrapper">
                <span className="select-label">Speed</span>
                <select
                  data-testid="playback-speed-selector"
                  value={playbackSpeed}
                  onChange={onSpeedChange}
                  aria-label="Playback speed selector"
                >
                  {speedOptions.map((speed) => (
                    <option key={speed} value={speed}>
                      {speed}x
                    </option>
                  ))}
                </select>
              </label>

              <button
                data-testid="fullscreen-button"
                type="button"
                onClick={toggleFullscreen}
                className="icon-button"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                <FullscreenIcon isFullscreen={isFullscreen} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
