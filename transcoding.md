# Video Transcoding Process

This document describes the FFmpeg commands used to transcode the source video into multiple HLS renditions for adaptive bitrate streaming.

---

# Source Video

The source video file used for transcoding:

```bash
input.mp4
```

The generated HLS output files were stored inside:

```bash
hls_output/
```

---

# 360p HLS Rendition

```bash
ffmpeg -i input.mp4 \
-vf "scale=w=640:h=360:force_original_aspect_ratio=decrease" \
-c:a aac -ar 48000 \
-c:v h264 -profile:v main \
-crf 23 \
-sc_threshold 0 \
-g 48 -keyint_min 48 \
-hls_time 4 \
-hls_playlist_type vod \
-b:v 800k -maxrate 856k -bufsize 1200k \
-b:a 96k \
-hls_segment_filename hls_output/360p_%03d.ts \
hls_output/360p.m3u8
```

---

# 480p HLS Rendition

```bash
ffmpeg -i input.mp4 \
-vf "scale=w=842:h=480:force_original_aspect_ratio=decrease" \
-c:a aac -ar 48000 \
-c:v h264 -profile:v main \
-crf 23 \
-sc_threshold 0 \
-g 48 -keyint_min 48 \
-hls_time 4 \
-hls_playlist_type vod \
-b:v 1400k -maxrate 1498k -bufsize 2100k \
-b:a 128k \
-hls_segment_filename hls_output/480p_%03d.ts \
hls_output/480p.m3u8
```

---

# 720p HLS Rendition

```bash
ffmpeg -i input.mp4 \
-vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease" \
-c:a aac -ar 48000 \
-c:v h264 -profile:v main \
-crf 23 \
-sc_threshold 0 \
-g 48 -keyint_min 48 \
-hls_time 4 \
-hls_playlist_type vod \
-b:v 2800k -maxrate 2996k -bufsize 4200k \
-b:a 128k \
-hls_segment_filename hls_output/720p_%03d.ts \
hls_output/720p.m3u8
```

---

# 1080p HLS Rendition

```bash
ffmpeg -i input.mp4 \
-vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" \
-c:a aac -ar 48000 \
-c:v h264 -profile:v main \
-crf 23 \
-sc_threshold 0 \
-g 48 -keyint_min 48 \
-hls_time 4 \
-hls_playlist_type vod \
-b:v 5000k -maxrate 5350k -bufsize 7500k \
-b:a 192k \
-hls_segment_filename hls_output/1080p_%03d.ts \
hls_output/1080p.m3u8
```

---

# Master Playlist Generation

```bash
echo -e "#EXTM3U\n#EXT-X-VERSION:3" > hls_output/master.m3u8

echo -e "#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360\n360p.m3u8" >> hls_output/master.m3u8

echo -e "#EXT-X-STREAM-INF:BANDWIDTH=1528000,RESOLUTION=842x480\n480p.m3u8" >> hls_output/master.m3u8

echo -e "#EXT-X-STREAM-INF:BANDWIDTH=3128000,RESOLUTION=1280x720\n720p.m3u8" >> hls_output/master.m3u8

echo -e "#EXT-X-STREAM-INF:BANDWIDTH=5542000,RESOLUTION=1920x1080\n1080p.m3u8" >> hls_output/master.m3u8
```

---

# Explanation of Important FFmpeg Flags

| Flag | Description |
|------|-------------|
| `-i` | Input source video file |
| `-vf scale` | Resizes the video to the target resolution |
| `-c:v h264` | Uses H.264 video codec |
| `-c:a aac` | Uses AAC audio codec |
| `-b:v` | Sets target video bitrate |
| `-maxrate` | Sets maximum bitrate for smoother streaming |
| `-bufsize` | Controls bitrate buffering behavior |
| `-crf 23` | Controls video quality/compression balance |
| `-g 48` | Sets GOP (Group of Pictures) size |
| `-keyint_min 48` | Minimum keyframe interval |
| `-hls_time 4` | Splits video into 4-second HLS segments |
| `-hls_playlist_type vod` | Creates a Video-On-Demand HLS playlist |
| `-hls_segment_filename` | Defines naming format for generated `.ts` segments |

---

# Generated Output Files

The transcoding process generated:

- `master.m3u8`
- `360p.m3u8`
- `480p.m3u8`
- `720p.m3u8`
- `1080p.m3u8`
- Multiple `.ts` segment files for each rendition

These files are uploaded to Amazon S3 and used by the HLS player for adaptive bitrate streaming.
