// 👇 ye imports & useStates pehle se hone chahiye
import React, { useState } from "react";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;;

  const PlaylistAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [videoIds, setVideoIds] = useState([]);
  const [totalDuration, setTotalDuration] = useState('');
  const [averageDuration, setAverageDuration] = useState('');
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [durationsInSeconds, setDurationsInSeconds] = useState(0);



  const fetchPlaylistInfo = async (playlistId) => {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const info = data.items[0].snippet;
      setPlaylistInfo({
        title: info.title,
        channelTitle: info.channelTitle,
        thumbnail: info.thumbnails.medium.url,
      });
    } catch (error) {
      console.error("Error fetching playlist info:", error);
    }
  };

  const extractPlaylistId = () => {
    const urlParams = new URLSearchParams(new URL(url).search);
    const id = urlParams.get('list');
    setPlaylistId(id);
    if (id) {
      fetchPlaylistInfo(id); // 🆕
      fetchVideoIds(id);
    }
  };

    
   ""
   
  
  const fetchVideoIds = async (playlistId, pageToken = '', collectedIds = []) => {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}&pageToken=${pageToken}`;
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      const newVideoIds = data.items.map(item => item.contentDetails.videoId);
      const allIds = [...collectedIds, ...newVideoIds];
      if (data.nextPageToken) {
        fetchVideoIds(playlistId, data.nextPageToken, allIds);
      } else {
        setVideoIds(allIds);
        fetchDurations(allIds); // ⏱️ call to duration fetcher
      }
    } catch (error) {
      console.error("Error fetching video IDs:", error);
    }
  };

  // 👉 ISO 8601 (PT1H2M3S) to seconds
  const convertToSeconds = (isoDuration) => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const formatDuration = (totalSeconds) => {
    if (totalSeconds >= 86400) {
      // 86400s = 24 hours
      return convertToDayFormat(totalSeconds);
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

const convertToDayFormat = (totalSeconds) => {
  const totalMinutes = totalSeconds / 60;
  const days = Math.floor(totalMinutes / 1440); // 1440 mins = 1 day
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = Math.round(totalMinutes % 60);

  return `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m`;
};

  const fetchDurations = async (ids) => {
    let durations = [];
    const chunkSize = 50; // max 50 per request
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
        ""
      
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(',')}&key=${API_KEY}`;
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
         
        
        const chunkDurations = data.items.map(item => convertToSeconds(item.contentDetails.duration));
        durations = [...durations, ...chunkDurations];
      } catch (err) {
        console.error("Error fetching durations:", err);
      }
    }

    const total = durations.reduce((sum, sec) => sum + sec, 0);
    const average = durations.length > 0 ? Math.floor(total / durations.length) : 0;

    setTotalDuration(formatDuration(total));
    setAverageDuration(formatDuration(average));
    setDurationsInSeconds(total);

  };
  const getDurationAtSpeed = (seconds, speed) => {
    const adjusted = Math.floor(seconds / speed);
    return formatDuration(adjusted);
  };


  return (
    <div className="p-6 flex flex-col items-center bg-blue-200">
      <h1 className="text-2xl font-bold mb-4 text-red-600">
        YouTube Playlist Analyzer
      </h1>

      <input
        type="text"
        placeholder="Paste YouTube playlist URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-2 w-full max-w-md mb-4 rounded-xl"
      />

      <button
        onClick={extractPlaylistId}
        className="bg-red-600 text-white px-4 py-2 rounded-xl"
      >
        Analyze Playlist
      </button>

      {/* {playlistId && (
        <p className="mt-4">
          📋 Playlist ID: <strong>{playlistId}</strong>
        </p>
      )} */}
      {playlistInfo && (
        <div className="mt-5 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">{playlistInfo.title}</h2>
          {/* <p className="text-gray-600 mb-2">👤 {playlistInfo.channelTitle}</p> */}

          <a
            href={`https://www.youtube.com/playlist?list=${playlistId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={playlistInfo.thumbnail}
              alt="Thumbnail"
              className="rounded-xl shadow-md w-64 mb-4 hover:scale-105 transition-transform duration-200"
            />
          </a>
        </div>
      )}

      {videoIds.length > 0 && (
        <div className="flex flex-col ml-4">
          <p>
            🎥 Total Videos: <strong>{videoIds.length}</strong>
          </p>
          <p>
            ⏱️ Total Duration: <strong>{totalDuration}</strong>
          </p>

          <p>
            📊 Average Video Length: <strong>{averageDuration}</strong>
          </p>
        </div>
      )}
      {totalDuration && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">
            ⏩ Estimated Time by Speed:
          </h3>
          <ul className="list-disc pl-6 text-sm">
            <li>At 1x : {formatDuration(durationsInSeconds)}</li>
            <li>At 1.25x : {getDurationAtSpeed(durationsInSeconds, 1.25)}</li>
            <li>At 1.5x : {getDurationAtSpeed(durationsInSeconds, 1.5)}</li>
            <li>At 2x : {getDurationAtSpeed(durationsInSeconds, 2)}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlaylistAnalyzer;
