import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageSquare, Loader2 } from 'lucide-react';
import API from '../api';

function UserSearch({ currentUserId, myFriends, onFriendAdded, onStartChat }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        // Hame naye routes ke mutabik '/users/search' hit karna hai
        const response = await API.get('/users/search', {
          params: { q: query, userId: currentUserId }
        });
        setResults(response.data);
      } catch (err) {
        console.error("❌ Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce buffer

    return () => clearTimeout(delayDebounce);
  }, [query, currentUserId]);

  const handleAddFriend = async (friendId) => {
    try {
      const response = await API.post('/users/add-friend', {
        userId: currentUserId,
        friendId: friendId
      });

      if (response.status === 200) {
        alert("Bhai, dost ban gaya! 🤝");
        setQuery('');
        setResults([]);
        if (onFriendAdded) onFriendAdded(); // Dashboard ki list refresh karega
      }
    } catch (err) {
      console.error("❌ Add friend error:", err);
      alert("Dost banane me error aaya bhai!");
    }
  };

  return (
    <div className="p-4 border-b border-slate-700 bg-slate-800/40 relative shadow-lg">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
        <input 
          type="text" 
          placeholder="Type username to explore..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 bg-slate-900/60 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-500"
        />
        {loading && <Loader2 className="absolute right-3 top-2.5 text-blue-500 animate-spin" size={14} />}
      </div>

      {/* SEARCH RESULTS DROPDOWN PANEL */}
      {results.length > 0 && (
        <div className="mt-2 bg-slate-900 border border-slate-700 rounded-xl max-h-48 overflow-y-auto p-1 space-y-1 shadow-2xl absolute z-50 w-[calc(100%-2rem)] left-4">
          {results.map((user) => {
            // Check if already friends
            const isFriend = myFriends.some(f => (f._id || f.id) === user._id);

            return (
              <div key={user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{user.username}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>

                {isFriend ? (
                  <button 
                    onClick={() => { onStartChat(user._id); setQuery(''); setResults([]); }}
                    className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition"
                    title="Chat Now"
                  >
                    <MessageSquare size={12} />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAddFriend(user._id)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    title="Add Friend"
                  >
                    <UserPlus size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserSearch;