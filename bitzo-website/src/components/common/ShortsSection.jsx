
// src/components/common/ShortsSection.jsx
import React, { useState } from "react";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  VolumeX,
  Volume2,
  X
} from 'lucide-react';

const shorts = [
  {
    id: 1,
    title: "How I Create Thumbnails in Minutes (Figma 2026)",
    views: "1.2M views",
    thumbnail: "https://i.ytimg.com/vi/lEP0r0XwN78/sddefault.jpg",
    duration: "0:58",
    videoUrl: "https://www.youtube.com/embed/lEP0r0XwN78?autoplay=1&mute=1&loop=1&playlist=lEP0r0XwN78&controls=0&showinfo=0&rel=0",
    creator: "sayli_ally",
    creatorHandle: "sayli_s0395",
    likes: "2,496",
    comments: "34",
    description: "Bhangda me dance karenge ab 😄🤣... more",
  },
  {
    id: 2,
    title: "Webflow Portfolio Animation Tricks 2025",
    views: "890K views",
    thumbnail: "https://i.ytimg.com/vi/-fC0__71FFs/sddefault.jpg",
    duration: "1:02",
    videoUrl: "https://www.youtube.com/embed/-fC0__71FFs?autoplay=1&mute=1&loop=1&playlist=-fC0__71FFs&controls=0&showinfo=0&rel=0",
    creator: "webflow_pro",
    creatorHandle: "webflow_2025",
    likes: "1,845",
    comments: "67",
    description: "Learn pro animation tricks... more",
  },
  {
    id: 3,
    title: "Killer Bharat Play Thumbnail Formula for 2025 Algo",
    views: "3.1M views",
    thumbnail: "https://i.ytimg.com/vi/0TolBiTrUg4/sddefault.jpg",
    duration: "0:45",
    videoUrl: "https://www.youtube.com/embed/0TolBiTrUg4?autoplay=1&mute=1&loop=1&playlist=0TolBiTrUg4&controls=0&showinfo=0&rel=0",
    creator: "bharatplay_tips",
    creatorHandle: "bharatplay_official",
    likes: "5,234",
    comments: "156",
    description: "Ultimate thumbnail secrets... more",
  },
  {
    id: 4,
    title: "Modern UI/UX Website Design in Figma",
    views: "2.4M views",
    thumbnail: "https://i.ytimg.com/vi/ieguGuC-yRI/sddefault.jpg",
    duration: "0:55",
    videoUrl: "https://www.youtube.com/embed/ieguGuC-yRI?autoplay=1&mute=1&loop=1&playlist=ieguGuC-yRI&controls=0&showinfo=0&rel=0",
    creator: "ui_master",
    creatorHandle: "ui_design_pro",
    likes: "3,892",
    comments: "98",
    description: "Modern UI design tutorial... more",
  },
  {
    id: 5,
    title: "Top Figma Plugins You Need Right Now (2026)",
    views: "4.7M views",
    thumbnail: "https://i.ytimg.com/vi/UrTStGUxtbs/sddefault.jpg",
    duration: "0:50",
    videoUrl: "https://www.youtube.com/embed/UrTStGUxtbs?autoplay=1&mute=1&loop=1&playlist=UrTStGUxtbs&controls=0&showinfo=0&rel=0",
    creator: "figma_expert",
    creatorHandle: "figma_2026",
    likes: "7,123",
    comments: "203",
    description: "Must-have Figma plugins... more",
  },
  {
    id: 6,
    title: "Bharat Play Shorts Thumbnail Hacks for More Views",
    views: "1.5M views",
    thumbnail: "https://i.ytimg.com/vi/nPBy5abtUYk/sddefault.jpg",
    duration: "1:10",
    videoUrl: "https://www.youtube.com/embed/nPBy5abtUYk?autoplay=1&mute=1&loop=1&playlist=nPBy5abtUYk&controls=0&showinfo=0&rel=0",
    creator: "growth_hacker",
    creatorHandle: "growth_tips",
    likes: "2,678",
    comments: "89",
    description: "Get more views with these hacks... more",
  },
];

function ShortsViewer({ short, onClose, onNext, onPrev }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Video Container */}
      <div className="relative h-full w-full flex items-center justify-center">
        {/* Video Background */}
        <div className="absolute inset-0">
          <iframe
            src={short.videoUrl}
            className="w-full h-full object-cover"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ pointerEvents: 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        </div>

        {/* Mute Button - Top Right */}
        <button
          onClick={() => setMuted(!muted)}
          className="absolute top-4 right-16 z-50 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
        >
          {muted ? (
            <VolumeX size={20} className="text-white" />
          ) : (
            <Volume2 size={20} className="text-white" />
          )}
        </button>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-40">
          <div className="flex items-end justify-between gap-4">
            {/* Left side - Creator info and description */}
            <div className="flex-1 max-w-[calc(100%-80px)]">
              {/* Creator Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {short.creator.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">
                    {short.creator}
                  </span>
                  <button className="px-4 py-1 bg-transparent border border-white text-white text-xs font-semibold rounded-md hover:bg-white hover:text-black transition-colors">
                    Follow
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-white text-sm mb-2 line-clamp-2">
                {short.description}
              </p>

              {/* Thumbnail preview in corner */}
              <div className="flex items-center gap-2 mt-3">
                <img
                  src={short.thumbnail}
                  alt="thumbnail"
                  className="w-10 h-10 rounded object-cover"
                />
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex flex-col items-center gap-5">
              {/* Like */}
              <button
                onClick={() => setLiked(!liked)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <Heart
                  size={28}
                  className={`${
                    liked ? 'fill-red-500 text-red-500' : 'text-white'
                  } transition-colors`}
                />
                <span className="text-white text-xs font-medium">
                  {liked
                    ? (parseInt(short.likes.replace(/,/g, '')) + 1).toLocaleString()
                    : short.likes}
                </span>
              </button>

              {/* Comment */}
              <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
                <MessageCircle size={28} className="text-white" />
                <span className="text-white text-xs font-medium">
                  {short.comments}
                </span>
              </button>

              {/* Share */}
              <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
                <Share2 size={28} className="text-white" />
              </button>

              {/* Save */}
              <button
                onClick={() => setSaved(!saved)}
                className="flex flex-col items-center gap-1 transition-transform active:scale-90"
              >
                <Bookmark
                  size={28}
                  className={`${
                    saved ? 'fill-white text-white' : 'text-white'
                  } transition-colors`}
                />
              </button>

              {/* More */}
              <button className="flex flex-col items-center gap-1 transition-transform active:scale-90">
                <MoreHorizontal size={28} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation - Swipe areas (optional for desktop) */}
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors opacity-0 hover:opacity-100 hidden md:block"
        >
          <span className="text-white text-xl">←</span>
        </button>
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors opacity-0 hover:opacity-100 hidden md:block"
        >
          <span className="text-white text-xl">→</span>
        </button>
      </div>
    </div>
  );
}

export default function ShortsSection() {
  const [selectedShort, setSelectedShort] = useState(null);

  const handleShortClick = (short) => {
    setSelectedShort(short);
  };

  const handleClose = () => {
    setSelectedShort(null);
  };

  const handleNext = () => {
    if (selectedShort) {
      const currentIndex = shorts.findIndex(s => s.id === selectedShort.id);
      const nextIndex = (currentIndex + 1) % shorts.length;
      setSelectedShort(shorts[nextIndex]);
    }
  };

  const handlePrev = () => {
    if (selectedShort) {
      const currentIndex = shorts.findIndex(s => s.id === selectedShort.id);
      const prevIndex = (currentIndex - 1 + shorts.length) % shorts.length;
      setSelectedShort(shorts[prevIndex]);
    }
  };

  return (
    <>
      <section className="px-6 py-8 border-t border-gray-800 bg-[#0f0f0f]">
        <h2 className="text-xl md:text-2xl font-bold mb-5 flex items-center gap-2">
          Shorts
          <span className="text-red-600 text-sm font-medium">• For you</span>
        </h2>

        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
          {shorts.map((short) => (
            <div
              key={short.id}
              onClick={() => handleShortClick(short)}
              className="flex-shrink-0 w-44 sm:w-52 md:w-60 snap-start cursor-pointer group relative"
            >
              {/* Vertical video preview */}
              <div className="relative rounded-xl overflow-hidden aspect-[9/16] bg-black shadow-lg group-hover:shadow-2xl transition-all duration-300">
                <img
                  src={short.thumbnail}
                  alt={short.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />

                {/* Play button overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                    <span className="text-white text-3xl md:text-4xl ml-1">
                      ▶
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <span className="absolute bottom-2 right-2 bg-black/85 text-white text-xs px-2 py-0.5 rounded font-medium">
                  {short.duration}
                </span>
              </div>

              {/* Text below */}
              <div className="mt-3 px-1">
                <p className="font-medium text-sm md:text-base line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                  {short.title}
                </p>
                <p className="text-xs md:text-sm text-gray-400 mt-1.5">
                  {short.views}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shorts Viewer Modal */}
      {selectedShort && (
        <ShortsViewer
          short={selectedShort}
          onClose={handleClose}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </>
  );
}