export const defaultMasterManifestUrl =
  'https://video-stream-bucket123.s3.us-east-1.amazonaws.com/master.m3u8'

export const masterManifestUrl =
  import.meta.env.VITE_MASTER_MANIFEST_URL?.trim() || defaultMasterManifestUrl

export const getManifestUrlError = () =>
  masterManifestUrl ? '' : 'Missing HLS master manifest URL configuration.'
