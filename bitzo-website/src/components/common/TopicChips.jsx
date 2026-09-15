import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setSelectedCategory } from "../../features/videos/videosSlice";
import { API_BASE } from "../../config/api";

const API_URL = `${API_BASE}/category`;

const ALL_CHIP = { _id: "all", name: "All" };

export default function TopicChips() {
  const dispatch = useDispatch();
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("All");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(API_URL);
        setTopics(res.data);
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);

    if (topic === "All") {
      dispatch(setSelectedCategory(null));
    } else {
      const selected = topics.find((t) => t.name === topic);
      dispatch(setSelectedCategory(selected?._id || null));
    }
  };

  const chips = [ALL_CHIP, ...topics.filter((t) => t.name !== "All")];

  return (
    <div className="sticky top-14 z-30 bg-[#0f0f0f] border-b border-gray-800">
      {/* Main topics */}
      <div className="flex items-center gap-3 px-6 py-3 overflow-x-auto scrollbar-hide">
        {chips.map((topic) => (
          <button
            key={topic._id}
            onClick={() => handleTopicClick(topic.name)}
            className={`
              px-6 py-1.5 font-medium rounded-lg whitespace-nowrap flex-shrink-0 transition-colors
              ${
                selectedTopic === topic.name
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-[#272727] text-white hover:bg-[#3f3f3f]"
              }
            `}
          >
            {topic.name}
          </button>
        ))}
      </div>
    </div>
  );
}
