(() => {
  "use strict";
  const config = window.UNICA_YOUTUBE_CONFIG || {};
  const card = document.getElementById("unicoLatestYouTube");
  if (!card) return;

  const link = document.getElementById("unicoLatestYouTubeLink");
  const thumb = document.getElementById("unicoLatestYouTubeThumb");
  const thumbWrap = card.querySelector(".youtube-latest-thumb-wrap");
  const placeholder = document.getElementById("unicoLatestYouTubePlaceholder");
  const title = document.getElementById("unicoLatestYouTubeTitle");
  const date = document.getElementById("unicoLatestYouTubeDate");
  const newBadge = document.getElementById("unicoLatestYouTubeNew");
  const note = document.getElementById("unicoLatestYouTubeNote");
  const channelUrl = config.channelUrl || "https://www.youtube.com/@utachan_hikigatari";
  const cacheKey = "unica_latest_youtube_v1";

  const showFallback = (message) => {
    link.href = channelUrl;
    title.textContent = "うにこのYouTubeを見る";
    date.textContent = "@utachan_hikigatari";
    placeholder.hidden = false;
    placeholder.querySelector("b").textContent = "YouTubeで最新動画を見る";
    thumb.hidden = true;
    thumb.removeAttribute("src");
    thumbWrap?.classList.remove("is-loaded");
    newBadge.hidden = true;
    if (message) {
      note.textContent = message;
      note.hidden = false;
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }).format(d) + " 公開";
  };

  const render = (video) => {
    if (!video || !video.videoId) return showFallback();
    link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;
    title.textContent = video.title || "うにこの最新動画";
    date.textContent = formatDate(video.publishedAt);
    const image = video.thumbnail;
    if (image) {
      thumbWrap?.classList.remove("is-loaded");
      placeholder.hidden = false;
      thumb.hidden = false;
      thumb.onload = () => {
        placeholder.hidden = true;
        thumbWrap?.classList.add("is-loaded");
      };
      thumb.onerror = () => {
        thumb.hidden = true;
        thumbWrap?.classList.remove("is-loaded");
        placeholder.hidden = false;
        const label = placeholder.querySelector("b");
        if (label) label.textContent = "サムネイルを表示できません";
      };
      thumb.src = image;
      if (thumb.complete && thumb.naturalWidth > 0) thumb.onload();
    } else {
      thumb.hidden = true;
      thumbWrap?.classList.remove("is-loaded");
      placeholder.hidden = false;
      const label = placeholder.querySelector("b");
      if (label) label.textContent = "YouTubeで最新動画を見る";
    }
    const days = (Date.now() - new Date(video.publishedAt).getTime()) / 86400000;
    newBadge.hidden = !(days >= 0 && days <= Number(config.newBadgeDays || 7));
    note.hidden = true;
  };

  const readCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      const maxAge = Number(config.cacheHours || 6) * 3600000;
      if (cached?.savedAt && cached?.video && Date.now() - cached.savedAt < maxAge) return cached.video;
    } catch (_) {}
    return null;
  };

  const writeCache = (video) => {
    try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), video })); } catch (_) {}
  };

  const getJson = async (url) => {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) throw new Error(`YouTube API ${response.status}`);
    const data = await response.json();
    if (data?.error) throw new Error(data.error.message || "YouTube API error");
    return data;
  };

  const load = async () => {
    const cached = readCache();
    if (cached) render(cached);

    const apiKey = String(config.apiKey || "").trim();
    const handle = String(config.handle || "").replace(/^@/, "").trim();
    if (!apiKey || apiKey.includes("YOUR_RESTRICTED")) {
      if (!cached) showFallback("APIキーを設定すると、最新動画のサムネイルへ自動で切り替わります。");
      return;
    }

    try {
      const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      channelsUrl.search = new URLSearchParams({ part: "contentDetails", forHandle: handle, key: apiKey });
      const channelData = await getJson(channelsUrl);
      const uploads = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploads) throw new Error("チャンネルが見つかりません");

      const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      playlistUrl.search = new URLSearchParams({ part: "snippet,contentDetails", playlistId: uploads, maxResults: "1", key: apiKey });
      const playlistData = await getJson(playlistUrl);
      const item = playlistData?.items?.[0];
      const snippet = item?.snippet;
      const videoId = item?.contentDetails?.videoId || snippet?.resourceId?.videoId;
      if (!videoId) throw new Error("最新動画が見つかりません");
      const thumbs = snippet?.thumbnails || {};
      const video = {
        videoId,
        title: snippet?.title || "うにこの最新動画",
        publishedAt: snippet?.publishedAt || item?.contentDetails?.videoPublishedAt || "",
        thumbnail: thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || ""
      };
      writeCache(video);
      render(video);
    } catch (error) {
      console.warn("Latest YouTube load failed:", error);
      if (!cached) showFallback("最新動画を取得できませんでした。タップするとYouTubeチャンネルを開きます。");
    }
  };

  load();
})();
