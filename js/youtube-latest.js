(() => {
  "use strict";

  const config = window.UNICA_YOUTUBE_CONFIG || {};
  const card = document.getElementById("unicoLatestYouTube");
  const track = document.getElementById("unicoLatestYouTubeTrack");
  const placeholder = document.getElementById("unicoLatestYouTubePlaceholder");
  const note = document.getElementById("unicoLatestYouTubeNote");
  const channelLink = document.getElementById("unicoLatestYouTubeChannel");
  if (!card || !track) return;

  const channelUrl = config.channelUrl || "https://www.youtube.com/@utachan_hikigatari";
  const cacheKey = "unica_latest_youtube_v3";
  const maxVideos = 3;
  if (channelLink) channelLink.href = channelUrl;

  const formatDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(d) + " 公開";
  };

  const isNew = (iso) => {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return false;
    const days = (Date.now() - t) / 86400000;
    return days >= 0 && days <= Number(config.newBadgeDays || 7);
  };

  const createVideoCard = (video, index) => {
    const a = document.createElement("a");
    a.className = "youtube-video-mini";
    a.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", `${video.title || "YouTube動画"}をYouTubeで見る`);

    const thumb = document.createElement("div");
    thumb.className = "youtube-video-mini-thumb";
    const img = document.createElement("img");
    img.loading = index === 0 ? "eager" : "lazy";
    img.alt = video.title ? `${video.title}のサムネイル` : "YouTube動画のサムネイル";
    img.src = video.thumbnail || "";
    img.addEventListener("error", () => {
      img.remove();
      thumb.classList.add("is-fallback");
    }, { once: true });
    if (video.thumbnail) thumb.appendChild(img); else thumb.classList.add("is-fallback");

    const play = document.createElement("span");
    play.className = "youtube-video-mini-play";
    play.textContent = "▶";
    thumb.appendChild(play);

    if (isNew(video.publishedAt)) {
      const badge = document.createElement("span");
      badge.className = "youtube-video-mini-new";
      badge.textContent = "NEW";
      thumb.appendChild(badge);
    }

    const body = document.createElement("div");
    body.className = "youtube-video-mini-body";
    const title = document.createElement("strong");
    title.textContent = video.title || "うにこの動画";
    const date = document.createElement("small");
    date.textContent = formatDate(video.publishedAt);
    body.append(title, date);
    a.append(thumb, body);
    return a;
  };

  const render = (videos) => {
    if (!Array.isArray(videos) || !videos.length) return showFallback();
    track.replaceChildren(...videos.slice(0, maxVideos).map(createVideoCard));
    card.classList.add("is-loaded");
    if (note) note.hidden = true;
  };

  const showFallback = (message) => {
    const fallback = document.createElement("a");
    fallback.className = "youtube-latest-loading youtube-latest-fallback";
    fallback.href = channelUrl;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.innerHTML = "<span>▶</span><b>YouTubeで最新動画を見る</b>";
    track.replaceChildren(fallback);
    card.classList.remove("is-loaded");
    if (note && message) {
      note.textContent = message;
      note.hidden = false;
    }
  };

  const readCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      const maxAge = Number(config.cacheHours || 6) * 3600000;
      if (cached?.savedAt && Array.isArray(cached?.videos) && Date.now() - cached.savedAt < maxAge) {
        return cached.videos;
      }
    } catch (_) {}
    return null;
  };

  const writeCache = (videos) => {
    try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), videos })); } catch (_) {}
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
      if (!cached) showFallback("APIキーを設定すると、最新動画3件を自動表示できます。");
      return;
    }

    try {
      const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      channelsUrl.search = new URLSearchParams({ part: "contentDetails", forHandle: handle, key: apiKey });
      const channelData = await getJson(channelsUrl);
      const uploads = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploads) throw new Error("チャンネルが見つかりません");

      const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      playlistUrl.search = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId: uploads,
        maxResults: String(maxVideos),
        key: apiKey
      });
      const playlistData = await getJson(playlistUrl);
      const videos = (playlistData?.items || []).map((item) => {
        const snippet = item?.snippet || {};
        const videoId = item?.contentDetails?.videoId || snippet?.resourceId?.videoId;
        const thumbs = snippet?.thumbnails || {};
        return {
          videoId,
          title: snippet?.title || "うにこの動画",
          publishedAt: snippet?.publishedAt || item?.contentDetails?.videoPublishedAt || "",
          thumbnail: thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || ""
        };
      }).filter((video) => video.videoId);
      if (!videos.length) throw new Error("動画が見つかりません");
      writeCache(videos);
      render(videos);
    } catch (error) {
      console.warn("Latest YouTube load failed:", error);
      if (!cached) showFallback("最新動画を取得できませんでした。タップするとYouTubeチャンネルを開きます。");
    }
  };

  load();
})();
