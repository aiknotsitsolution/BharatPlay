import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const videos = [
  {
    id: 1,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    title: "Scenic Bike Ride",
    creator: "TravelGuru",
    likes: 112,
    comments: 290,
    earn: "₹2.40",
  },
  {
    id: 2,
    src: "https://www.w3schools.com/html/movie.mp4",
    title: "Mountain View",
    creator: "NatureVib",
    likes: 89,
    comments: 120,
    earn: "₹1.80",
  },
  {
    id: 3,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    title: "Sunset Road",
    creator: "RideMore",
    likes: 210,
    comments: 430,
    earn: "₹3.20",
  },
];

export default function ReelPlayerPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const startIndex = state?.index || 0;

  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(startIndex);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setActiveIndex(index);
            videoRefs.current[index]?.play();
          } else {
            const index = Number(entry.target.dataset.index);
            videoRefs.current[index]?.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black"
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          data-index={index}
          className="relative h-screen w-full snap-start flex items-center justify-center"
        >
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-50 text-white"
          >
            <ArrowLeft size={26} />
          </button>

          {/* Video */}
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={video.src}
            className="h-full w-full object-cover"
            loop
            muted={activeIndex !== index}
            playsInline
          />

          {/* Right Actions */}
          <div className="absolute right-3 bottom-28 flex flex-col items-center gap-6 text-white">
            <div className="flex flex-col items-center gap-1">
              <Heart />
              <span className="text-xs">{video.likes}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle />
              <span className="text-xs">{video.comments}</span>
            </div>
            <Share2 />
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-6 left-4 right-20 text-white">
            <p className="text-sm font-semibold">{video.creator}</p>
            <p className="text-xs opacity-80">{video.title}</p>
            <div className="mt-1 inline-block rounded bg-black/60 px-2 py-0.5 text-xs">
              🔥 You Earned {video.earn}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
