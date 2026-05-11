# Video Streaming (Vite + React)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file and set your HLS master manifest URL:

```bash
cp .env.example .env
```

Required variable:

- `VITE_MASTER_MANIFEST_URL` → public URL to your `master.m3u8`

3. Start dev server:

```bash
npm run dev
```

4. Build production bundle:

```bash
npm run build
```

## Local FFmpeg workflow (run on your machine)

Yes — transcoding should be run locally (or on your own server) where your source video exists.

```bash
# choose source and output dir
SOURCE="input.mp4"
OUTPUT_DIR="hls_output"
mkdir -p "$OUTPUT_DIR"

# 360p
ffmpeg -i "$SOURCE" -vf "scale=w=640:h=360:force_original_aspect_ratio=decrease" -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 23 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 800k -maxrate 856k -bufsize 1200k -b:a 96k -hls_segment_filename "$OUTPUT_DIR/360p_%03d.ts" "$OUTPUT_DIR/360p.m3u8"

# 480p
ffmpeg -i "$SOURCE" -vf "scale=w=842:h=480:force_original_aspect_ratio=decrease" -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 23 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 1400k -maxrate 1498k -bufsize 2100k -b:a 128k -hls_segment_filename "$OUTPUT_DIR/480p_%03d.ts" "$OUTPUT_DIR/480p.m3u8"

# 720p
ffmpeg -i "$SOURCE" -vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease" -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 23 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 2800k -maxrate 2996k -bufsize 4200k -b:a 128k -hls_segment_filename "$OUTPUT_DIR/720p_%03d.ts" "$OUTPUT_DIR/720p.m3u8"

# 1080p
ffmpeg -i "$SOURCE" -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 23 -sc_threshold 0 -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod -b:v 5000k -maxrate 5350k -bufsize 7500k -b:a 192k -hls_segment_filename "$OUTPUT_DIR/1080p_%03d.ts" "$OUTPUT_DIR/1080p.m3u8"
```

Create `hls_output/master.m3u8`:

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1528000,RESOLUTION=842x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3128000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5542000,RESOLUTION=1920x1080
1080p.m3u8
```

Verify files exist:

```bash
ls -1 "$OUTPUT_DIR"/*.m3u8
ls -1 "$OUTPUT_DIR"/*.ts | head
```
