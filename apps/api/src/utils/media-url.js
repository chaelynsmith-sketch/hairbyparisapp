function getPublicApiOrigin() {
  if (process.env.PUBLIC_API_URL) {
    return process.env.PUBLIC_API_URL.replace(/\/+$/, "");
  }

  if (process.env.API_PUBLIC_URL) {
    return process.env.API_PUBLIC_URL.replace(/\/+$/, "");
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, "");
  }

  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  }

  if (process.env.NODE_ENV === "production") {
    return "";
  }

  return `http://localhost:${process.env.PORT || 4000}`;
}

function normalizeMediaUrl(url) {
  if (!url) {
    return url;
  }

  const publicOrigin = getPublicApiOrigin();

  if (!publicOrigin) {
    return url;
  }

  return url.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/uploads\//i, `${publicOrigin}/uploads/`);
}

function normalizeProductMedia(media = []) {
  return media
    .filter((item) => item?.url && !/images\.unsplash\.com/i.test(item.url))
    .map((item) => ({
      ...item,
      url: normalizeMediaUrl(item.url)
    }));
}

module.exports = { getPublicApiOrigin, normalizeMediaUrl, normalizeProductMedia };
