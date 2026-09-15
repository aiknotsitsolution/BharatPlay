// src/pages/Trending.jsx
import React from 'react';
import VideoGrid from '../components/common/VideoGrid'; // Reuse the grid

// You could have different data per category later
export default function Trending() {
  return (
    <div className="pb-10">
      <div className="px-6 py-6">
        <h1 className="text-3xl font-bold mb-2">Trending</h1>
        <p className="text-gray-400">Popular right now • Personalized for you</p>
      </div>

      {/* Category tabs (mock) */}
      <div className="flex gap-4 px-6 overflow-x-auto pb-4 scrollbar-hide">
        {['All', 'Music', 'Gaming', 'News', 'Movies', 'Design'].map((cat) => (
          <button
            key={cat}
            className="px-5 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full text-sm font-medium whitespace-nowrap"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main trending grid */}
      <div className="mt-6">
        <VideoGrid /> {/* Reuse — or make a TrendingVideoGrid with different data */}
      </div>

      {/* More sections example */}
      <section className="mt-12 px-6">
        <h2 className="text-2xl font-bold mb-5">Trending Music Videos</h2>
        <VideoGrid /> {/* Could be filtered data */}
      </section>
    </div>
  );
}