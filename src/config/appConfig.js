export const masterManifestUrl =
  import.meta.env.VITE_MASTER_MANIFEST_URL?.trim() ?? ''

export const getManifestUrlError = () =>
  masterManifestUrl
    ? ''
    : 'Missing VITE_MASTER_MANIFEST_URL. Add it in your .env file to enable HLS playback.'
