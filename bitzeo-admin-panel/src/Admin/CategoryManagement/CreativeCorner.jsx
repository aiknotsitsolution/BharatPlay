import { useEffect, useState } from 'react';
import api from '../api/axios';
import VideoCard from '../components/VideoCard';
import toast from 'react-hot-toast';

const CreativeCorner = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data } = await api.get('/videos/creative-corner');
        setVideos(data);
      } catch (err) {
        toast.error('Failed to load Creative Corner');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Creative Corner</h1>
        <p className="text-gray-400 mt-1">
          Fallback category for unique content. Use hashtags so we can discover new categories!
        </p>
      </div>

      {videos.length === 0 ? (
        <p className="text-gray-400">No videos in Creative Corner yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CreativeCorner;