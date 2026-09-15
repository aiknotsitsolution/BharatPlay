

// src/pages/WatchPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { useRewards } from '../../context/RewardContext';

// Mock data (same as before)
const mockVideos = [
  {
    id: 'x3Gn5lksozE',
    title: 'This is what mobile web design excellence looks like in 2025',
    channel: 'Flux Academy',
    views: '212K',
    uploaded: '2 hours ago',
    duration: '15:41',
    thumbnail: 'https://i.ytimg.com/vi/x3Gn5lksozE/maxresdefault.jpg',
  },
  {
    id: 'SmhLuxlUIkc',
    title: '2026 UI/UX Design Trends You Must Know',
    channel: 'Mizko',
    views: '320K',
    uploaded: '1 day ago',
    duration: '14:55',
    thumbnail: 'https://i.ytimg.com/vi/SmhLuxlUIkc/sddefault.jpg',
  },
  {
    id: 'jnZmIy1XSMc',
    title: 'Top 7 Figma Plugins Every Designer Needs in 2026',
    channel: 'DesignCode',
    views: '145K',
    uploaded: '5 hours ago',
    duration: '18:22',
    thumbnail: 'https://i.ytimg.com/vi/jnZmIy1XSMc/sddefault.jpg',
  },
];

const getVideoById = (id) => {
  const found = mockVideos.find((v) => v.id === id);
  if (found) return found;
  return {
    id,
    title: 'Video not found',
    channel: 'Unknown',
    views: '0',
    uploaded: 'Unknown',
    duration: '--:--',
    thumbnail: 'https://via.placeholder.com/1280x720?text=Not+Found',
  };
};

export default function WatchPage() {
  const { id } = useParams();
  const video = getVideoById(id);
  const recommendations = mockVideos.filter((v) => v.id !== id).slice(0, 8);

  const { points, addPoints } = useRewards();

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);

  // Like / Dislike
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(1200);

  // Comments
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      user: '@designfan',
      time: '2 days ago',
      text: 'Looper Legacy is insane! Changed how I animate everything 🔥',
    },
    {
      user: '@uiuxpro',
      time: '1 week ago',
      text: 'Perspective Toolkit is underrated. Highly recommend!',
    },
  ]);

  // YouTube IFrame API + reward logic
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(tag, firstScript);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: id,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
        },
        events: {
          onReady: () => {},
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                setWatchedSeconds((prev) => {
                  const newSec = prev + 1;

                  // 0.25 points every 4 seconds of actual playback
                  if (newSec % 4 === 0) {
                    addPoints(0.25);
                  }

                  return newSec;
                });
              }, 1000);
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          },
        },
      });
    };

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id, addPoints]);

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      if (isDisliked) setIsDisliked(false);
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false);
    } else {
      setIsDisliked(true);
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    setComments((prev) => [
      { user: '@You', time: 'just now', text: commentText.trim() },
      ...prev,
    ]);
    setCommentText('');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-14 pb-20 md:pb-10">
      {/* Floating points display – shows decimals */}
      <div className="fixed top-16 right-4 z-50 bg-[#272727] px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-yellow-600/30">
        <span className="text-yellow-400 font-bold text-lg">
          ★ {points.toFixed(2)}
        </span>
        <span className="text-sm text-gray-300">Bharat Play Points</span>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="lg:flex-1">
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <div id="youtube-player"></div>
            </div>

            <h1 className="text-xl md:text-2xl font-bold mt-4 line-clamp-2">
              {video.title}
            </h1>

            {/* Channel + Actions */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">{video.channel}</p>
                  <p className="text-sm text-gray-400">9.88K subscribers</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                    isLiked
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#272727] hover:bg-[#3a3a3a] text-white'
                  }`}
                >
                  <ThumbsUp size={18} fill={isLiked ? 'white' : 'none'} />
                  <span>{likeCount.toLocaleString()}</span>
                </button>

                <button
                  onClick={handleDislike}
                  className={`px-4 py-2 rounded-full transition ${
                    isDisliked
                      ? 'bg-gray-400 text-black'
                      : 'bg-[#272727] hover:bg-[#3a3a3a] text-white'
                  }`}
                >
                  <ThumbsDown size={18} fill={isDisliked ? 'black' : 'none'} />
                </button>

                <button className="bg-[#272727] hover:bg-[#3a3a3a] px-5 py-2 rounded-full transition">
                  Share
                </button>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-300">
              {video.views} views • {video.uploaded}
            </div>

            {/* Debug line – remove later if you want */}
            <div className="mt-2 text-xs text-gray-500">
              Watched: {Math.floor(watchedSeconds / 60)}m {watchedSeconds % 60}s 
              {' • '} Earned: {(Math.floor(watchedSeconds / 4) * 0.25).toFixed(2)} pts
            </div>

            <div className="mt-4 bg-[#272727] p-4 rounded-xl text-sm leading-relaxed">
              <p className="whitespace-pre-line">
                {video.description || 'No description provided for this video.'}
              </p>
            </div>

            {/* Comments section – unchanged */}
            <div className="mt-10">
              <h2 className="text-xl font-bold mb-4">
                Comments ({comments.length})
              </h2>

              <div className="flex gap-3 mb-8">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a public comment..."
                    className="w-full bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none resize-none text-sm py-2 min-h-[60px]"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleComment}
                      disabled={!commentText.trim()}
                      className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition ${
                        commentText.trim()
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-[#272727] text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Send size={16} />
                      Comment
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {comments.map((c, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">
                        {c.user} <span className="text-gray-500 text-xs">• {c.time}</span>
                      </p>
                      <p className="text-gray-300 mt-1">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations – unchanged */}
          <div className="lg:w-96 xl:w-[420px] flex-shrink-0">
            <h2 className="text-lg font-bold mb-4 hidden lg:block">Up next</h2>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  to={`/watch/${rec.id}`}
                  className="flex gap-3 group hover:bg-[#1f1f1f] rounded-xl p-2 -m-2 transition"
                >
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black">
                    <img
                      src={rec.thumbnail}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {rec.duration}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {rec.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{rec.channel}</p>
                    <p className="text-xs text-gray-400">
                      {rec.views} • {rec.uploaded}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}