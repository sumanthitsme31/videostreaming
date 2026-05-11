# Video Streaming Platform (React + Vite + HLS.js)

A custom video streaming player built with React and Vite using HLS.js for adaptive bitrate playback. The player includes custom controls, quality switching, keyboard shortcuts, playback persistence, and completion tracking.

## Master Manifest URL (AWS S3)

`https://video-stream-bucket123.s3.us-east-1.amazonaws.com/master.m3u8`

## Features

- Custom player controls with required `data-testid` attributes
- HLS.js integration with adaptive bitrate playback
- Manual quality override (`Auto` + manifest-derived levels)
- Current bitrate display (`data-testid="current-bitrate-display"`)
- Watch progress persistence in `localStorage` (`video-progress`)
- Completion flag at 95% watched (`video-completed=true`)
- Keyboard shortcuts:
  - `Space`: Play/Pause
  - `M`: Mute/Unmute
  - `ArrowRight` / `ArrowLeft`: Seek ±5 seconds
  - `F`: Toggle fullscreen

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Run the app:

```bash
npm run dev
```

4. Build production bundle:

```bash
npm run build
```

## Docker

Build and run with Docker Compose (served by nginx on port `8080`):

```bash
docker compose up --build
```

Then open: `http://localhost:8080`

## Transcoding Notes

FFmpeg transcoding commands and explanation are documented in [`transcoding.md`](./transcoding.md).
