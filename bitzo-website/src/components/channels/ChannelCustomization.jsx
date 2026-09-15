import React, { useState } from 'react';
import { Upload, X, Check, Monitor, Smartphone, ChevronRight } from 'lucide-react';

export default function ChannelCustomization() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [bannerPreview, setBannerPreview] = useState(null); // For uploaded banner preview
  const [profilePicPreview, setProfilePicPreview] = useState(
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" // example from your mock
  );

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header / Top Bar */}
      <div className="border-b border-gray-700 bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Channel customisation</h1>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition">
              View channel
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition">
              Cancel
            </button>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition flex items-center gap-2">
              <Check size={16} />
              Publish
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-700">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('Profile')}
              className={`py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'Profile'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('Home tab')}
              className={`py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'Home tab'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Home tab
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'Profile' && (
          <div className="space-y-12">
            {/* Banner Image Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Banner image</h2>
              <p className="text-gray-400">
                This image will appear across the top of your channel.
              </p>

              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                <div className="relative aspect-[2560/1440] max-w-full overflow-hidden bg-black rounded">
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/30 to-black">
                      <Monitor size={120} className="text-gray-600" />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <div className="bg-black/60 px-3 py-1 rounded text-xs flex items-center">
                          <Smartphone size={14} className="mr-1" />
                          Mobile
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-300">
                      For the best results on all devices, use an image that's at least{' '}
                      <strong>2048 x 1152 pixels</strong> and 6 MB or less.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 2560 x 1440 pixels (16:9) • PNG / JPG / GIF (no animations)
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

            {/* Profile Picture Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Picture</h2>
              <p className="text-gray-400">
                Your profile picture will appear where your channel is presented on YouTube, such as next to your videos and comments.
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
                    It's recommended that you use a picture that's at least{' '}
                    <strong>98 x 98 pixels</strong> and 4 MB or less. Use a PNG / GIF (no animations). Make sure your picture follows the YouTube Community Guidelines.
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
                    <button className="px-5 py-2.5 bg-[#272727] hover:bg-[#3a3a3a] rounded-full transition">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Home tab' && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Home tab customization coming soon...</p>
            <p className="mt-4">(Trailer, sections, featured content, layout, etc.)</p>
          </div>
        )}
      </div>
    </div>
  );
}