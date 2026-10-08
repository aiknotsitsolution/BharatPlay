import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Upload,
  Check,
  Monitor,
  Smartphone,
  Save,
  ArrowLeft,
} from "lucide-react";
import { API_BASE } from "../../config/api";
import { authFetch } from "../../utils/session";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop";
const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&h=900&fit=crop";

export default function ChannelCustomization() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [channelId, setChannelId] = useState(
    location.state?.channelId || localStorage.getItem("selectedChannelId") || "",
  );
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bannerPreview, setBannerPreview] = useState(DEFAULT_BANNER);
  const [profilePicPreview, setProfilePicPreview] = useState(DEFAULT_AVATAR);
  const [bannerFile, setBannerFile] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);

  const selectedChannelId = useMemo(() => channelId, [channelId]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [channelsRes, categoryRes] = await Promise.all([
          authFetch(`${API_BASE}/uservideo/channel`),
          fetch(`${API_BASE}/category`),
        ]);

        if (channelsRes.ok) {
          const channelsData = await channelsRes.json();
          const userChannels = channelsData.channels || [];
          setChannels(userChannels);

          const storedId =
            location.state?.channelId ||
            localStorage.getItem("selectedChannelId") ||
            userChannels[0]?._id ||
            "";

          if (storedId) {
            setChannelId(storedId);
            localStorage.setItem("selectedChannelId", storedId);
          }
        }

        if (categoryRes.ok) {
          const categoryData = await categoryRes.json();
          setCategories(Array.isArray(categoryData) ? categoryData : []);
        }
      } catch (loadError) {
        console.error(loadError);
      }
    };

    loadMetadata();
  }, [location.state]);

  useEffect(() => {
    if (!selectedChannelId) {
      setError("Please select a channel first.");
      setLoading(false);
      return;
    }

    const fetchChannel = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await authFetch(
          `${API_BASE}/uservideo/channel/${selectedChannelId}`,
        );

        if (!response.ok) {
          throw new Error("Channel not found");
        }

        const result = await response.json();
        const channel = result.channel || result;

        setChannelName(channel.name || "");
        setDescription(channel.channeldescription || channel.description || "");
        setEmail(channel.contactemail || "");
        setHashtags((channel.hashtags || []).join(", "));
        setSelectedCategory(channel.category?._id || channel.category || "");
        setBannerPreview(channel.channelBanner || DEFAULT_BANNER);
        setProfilePicPreview(channel.channelImage || DEFAULT_AVATAR);
        setBannerFile(null);
        setProfilePicFile(null);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load channel details.");
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [selectedChannelId]);

  const handleChannelChange = (event) => {
    const nextChannelId = event.target.value;
    setChannelId(nextChannelId);
    localStorage.setItem("selectedChannelId", nextChannelId);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfilePicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedChannelId) {
      setError("Please select a channel first.");
      return;
    }

    const trimmedName = channelName.trim();
    if (!trimmedName) {
      setError("Channel name is required.");
      return;
    }

    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("category", selectedCategory);
      formData.append("channeldescription", description || "");
      formData.append("contactemail", email || "");
      formData.append("hashtags", hashtags || "");

      if (profilePicFile) {
        formData.append("channelImage", profilePicFile);
      }
      if (bannerFile) {
        formData.append("channelBanner", bannerFile);
      }

      const response = await authFetch(`${API_BASE}/uservideo/channel/${selectedChannelId}`, {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update channel details.");
      }

      toast.success("Channel details updated successfully");
      localStorage.setItem("selectedChannelId", selectedChannelId);
      navigate(-1);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || "Unable to save channel details.");
      toast.error(saveError.message || "Unable to save channel details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="border-b border-gray-700 bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-[#1f1f1f] text-gray-300"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold">Channel customization</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded text-white font-medium transition flex items-center gap-2"
            >
              {saving ? "Saving..." : <><Check size={16} /> Publish</>}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-700">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setActiveTab("Profile")}
              className={`py-4 text-sm font-medium transition-colors relative ${
                activeTab === "Profile"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Home tab")}
              className={`py-4 text-sm font-medium transition-colors relative ${
                activeTab === "Home tab"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Home tab
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-6 rounded border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading channel details...</div>
        ) : (
          <>
            {activeTab === "Profile" && (
              <div className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Channel details</h2>
                  <div className="space-y-4 rounded-xl border border-gray-700 bg-[#1a1a1a] p-5">
                    <div>
                      <label className="mb-1 block text-sm text-gray-300">Select channel</label>
                      <select
                        value={channelId}
                        onChange={handleChannelChange}
                        className="w-full rounded-lg border border-gray-700 bg-[#121212] px-3 py-2.5 text-white outline-none focus:border-blue-500"
                      >
                        {channels.length === 0 ? (
                          <option value="">No channels available</option>
                        ) : (
                          channels.map((channel) => (
                            <option key={channel._id} value={channel._id}>
                              {channel.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-gray-300">Channel name</label>
                      <input
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-[#121212] px-3 py-2.5 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-gray-300">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-[#121212] px-3 py-2.5 text-white outline-none focus:border-blue-500"
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-gray-300">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        className="w-full rounded-lg border border-gray-700 bg-[#121212] px-3 py-2.5 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-gray-300">Contact email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-[#121212] px-3 py-2.5 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-gray-300">Hashtags</label>
                      <input
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        placeholder="e.g. gaming, creator, fun"
                        className="w-full rounded-lg border border-gray-700 bg-[#121212] px-3 py-2.5 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Banner image</h2>
                  <p className="text-gray-400">
                    This image will appear across the top of your channel.
                  </p>

                  <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                    <div className="relative aspect-[2560/1440] max-w-full overflow-hidden bg-black rounded">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-300">
                          Best size: <strong>2048 x 1152</strong> and 6 MB or less.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: 2560 x 1440 pixels (16:9)
                        </p>
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#272727] hover:bg-[#3a3a3a] rounded-full transition">
                        <Upload size={18} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Picture</h2>
                  <p className="text-gray-400">
                    Your profile picture will appear wherever your channel is shown.
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#0f0f0f] shadow-xl bg-gray-800">
                      <img
                        src={profilePicPreview}
                        alt="Profile picture"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-gray-300">
                        Recommended size: <strong>98 x 98 pixels</strong> or larger.
                      </p>

                      <div className="flex gap-4">
                        <label className="cursor-pointer px-5 py-2.5 bg-[#272727] hover:bg-[#3a3a3a] rounded-full transition">
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfilePicUpload}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePicPreview(DEFAULT_AVATAR);
                            setProfilePicFile(null);
                          }}
                          className="px-5 py-2.5 bg-[#272727] hover:bg-[#3a3a3a] rounded-full transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save channel"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "Home tab" && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl">Home tab customization coming soon...</p>
                <p className="mt-4">(Trailer, sections, featured content, layout, etc.)</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}