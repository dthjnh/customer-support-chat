import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  const navigate = useNavigate();
  const location = useLocation();

  // Refresh friends list whenever component mounts or navigates back
  useEffect(() => {
    fetchFriends();
  }, [location]);

  const fetchFriends = async () => {
    try {
      const response = await api.get("/users/friends");
      setFriends(response.data);
    } catch (err) {
      console.error("❌ Failed to fetch friends:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/users/search?email=${searchQuery}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error("❌ Failed to search users:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      await api.post(`/users/friends/${userId}`);
      alert("Friend added!");
      setSearchQuery("");
      setSearchResults([]);
      await fetchFriends();
      // Switch to friends tab to show the newly added friend
      setActiveTab("friends");
    } catch (err) {
      console.error("❌ Failed to add friend:", err);
      alert(err.response?.data?.error || "Failed to add friend");
    }
  };

  const handleStartChat = (friendId) => {
    navigate(`/direct-message/${friendId}`);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#f8fafc",
        color: "#1f2937",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: "25%",
          minWidth: "280px",
          maxWidth: "400px",
          background: "white",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: "700" }}>Contacts</h2>
            <button
              onClick={() => navigate("/customer")}
              style={{
                padding: "8px 14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "transform 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
              title="Back to messages"
            >
              ← Back
            </button>
          </div>

          {/* TAB BUTTONS */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setActiveTab("friends")}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: activeTab === "friends" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f3f4f6",
                color: activeTab === "friends" ? "white" : "#1f2937",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (activeTab !== "friends") {
                  e.currentTarget.style.background = "#e5e7eb";
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== "friends") {
                  e.currentTarget.style.background = "#f3f4f6";
                }
              }}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab("search")}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: activeTab === "search" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f3f4f6",
                color: activeTab === "search" ? "white" : "#1f2937",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                if (activeTab !== "search") {
                  e.currentTarget.style.background = "#e5e7eb";
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== "search") {
                  e.currentTarget.style.background = "#f3f4f6";
                }
              }}
            >
              Add Friend
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activeTab === "friends" ? (
            // FRIENDS LIST
            <>
              {friends.length === 0 ? (
                <p style={{ padding: 16, color: "#9ca3af", textAlign: "center", fontSize: 14 }}>
                  No friends yet
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => handleStartChat(friend.id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #e2e8f0",
                      cursor: "pointer",
                      background: "transparent",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: "600", color: "#1f2937", fontSize: 15 }}>
                      {friend.name}
                    </p>
                    <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>
                      {friend.email}
                    </p>
                  </div>
                ))
              )}
            </>
          ) : (
            // SEARCH TAB
            <>
              <form onSubmit={handleSearch} style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                <input
                  type="email"
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    color: "#1f2937",
                    boxSizing: "border-box",
                    marginBottom: 8,
                    fontSize: 14,
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.background = "#ffffff";
                    e.target.style.borderColor = "#667eea";
                  }}
                  onBlur={(e) => {
                    e.target.style.background = "#f3f4f6";
                    e.target.style.borderColor = "#e5e7eb";
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: loading ? "#cbd5e1" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </form>

              {/* SEARCH RESULTS */}
              <div>
                {searchResults.length === 0 && searchQuery && !loading && (
                  <p style={{ padding: 16, color: "#9ca3af", textAlign: "center", fontSize: 14 }}>
                    No users found
                  </p>
                )}
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "transparent",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: "600", color: "#1f2937", fontSize: 15 }}>
                        {user.name}
                      </p>
                      <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 13 }}>
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddFriend(user.id)}
                      style={{
                        padding: "6px 14px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        marginLeft: 12,
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MAIN AREA */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        {activeTab === "friends" && friends.length > 0
          ? "Click a friend to start chatting"
          : activeTab === "friends"
          ? "No friends yet - add some to get started!"
          : "Search for users to add as friends"}
      </div>
    </div>
  );
}
