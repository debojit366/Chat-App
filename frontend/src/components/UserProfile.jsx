import React, { useState } from 'react';
import { LogOut, User, Shield, X, Lock, MessageSquare, Globe, ChevronRight, Camera } from 'lucide-react';
import API from '../api';
function UserProfile({ onClose }) {
  // Fetch logged-in user details from local storage
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  
  // State to update the UI immediately upon image upload without a page refresh
  const [profilePic, setProfilePic] = useState(loggedInUser?.profilePic || '');
  const [uploading, setUploading] = useState(false);

  const userName = loggedInUser?.username || 'Anonymous';
  const userEmail = loggedInUser?.email || 'No email provided';
  const userId = loggedInUser?.id || loggedInUser?._id;
  const userRole = loggedInUser?.role || 'Student / Developer';

  // PROFILE PICTURE UPLOAD LOGIC
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use FormData for file transfer instead of JSON
    const formData = new FormData();
    formData.append('image', file);
    // formData.append("upload_preset","first_time_using_cloudinary")
    // formData.append("cloud_name","dyozxlddu")
    try {
      setUploading(true);

      // Hit the backend API route
      const response = await API.post(`/users/upload-profile-pic/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        const newPicUrl = response.data.profilePic;
        
        // 1. Update local state for immediate UI feedback
        setProfilePic(newPicUrl);
        
        // 2. Update user details in LocalStorage to persist changes on refresh
        const updatedUserData = { ...loggedInUser, profilePic: newPicUrl };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        alert("Profile picture updated successfully! 😎");
      }
    } catch (err) {
      console.error("❌ Error uploading profile picture:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login'; // Hard redirect to clear any residual state
  };

  return (
    <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 h-full flex flex-col shadow-2xl p-4 animate-in slide-in-from-left duration-200 overflow-y-auto custom-scrollbar">
      
      {/* Profile Header Area */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User size={16} className="text-blue-500" /> Account Identity
        </h3>
        <button 
          onClick={onClose}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition"
          title="Back to Chats"
        >
          <X size={14} />
        </button>
      </div>

      {/* Profile Details Area */}
      <div className="flex flex-col items-center text-center mb-6">
        
        {/* DYNAMIC PROFILE PICTURE AVATAR WITH HOVER CHANGE BUTTON */}
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-slate-700 mb-2 group">
          {profilePic ? (
            <img 
              src={profilePic} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Camera Hover Overlay Overlay Click Trigger */}
          <label 
            htmlFor="profile-pic-input" 
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition duration-200"
          >
            <Camera size={20} className="text-white" />
          </label>
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            id="profile-pic-input" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {/* Uploading indicator text */}
        {uploading && (
          <p className="text-[10px] text-blue-400 animate-pulse mb-2">Uploading image... ⏳</p>
        )}
        
        <h2 className="text-base font-bold text-white tracking-wide mt-2">{userName}</h2>
        <p className="text-xs text-slate-400 mt-1">{userEmail}</p>

        <div className="w-full mt-6 bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-left space-y-2">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">User Authorization</div>
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <Shield size={12} className="text-blue-400" /> {userRole}
          </div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold mt-2">Unique Core ID</div>
          <div className="text-[11px] text-slate-400 select-all bg-slate-950 p-1 rounded font-mono truncate">
            {userId}
          </div>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="flex-1 space-y-1">
        <div className="text-[10px] text-slate-500 uppercase font-semibold px-2 mb-2 tracking-wider">Preferences</div>
        
        {[
          { icon: User, label: 'Account', color: 'text-blue-400' },
          { icon: Lock, label: 'Privacy', color: 'text-emerald-400' },
          { icon: Shield, label: 'Security', color: 'text-purple-400' },
          { icon: MessageSquare, label: 'Chat Setting', color: 'text-orange-400' },
          { icon: Globe, label: 'Language', color: 'text-cyan-400' },
        ].map((item, idx) => (
          <button key={idx} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-700/50 transition group text-left">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg bg-slate-900/50 ${item.color}`}>
                <item.icon size={14} />
              </div>
              <span className="text-xs text-slate-300 font-medium">{item.label}</span>
            </div>
            <ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400 transition" />
          </button>
        ))}
      </div>

      {/* Logout Action Area */}
      <div className="border-t border-slate-700 pt-4">
        <button 
          onClick={handleLogout}
          className="w-full py-2.5 bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 group"
        >
          <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" /> Sign Out Session
        </button>
      </div>

    </div>
  );
}

export default UserProfile;