// pages/UsersListPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { db } from "../../config/firebase";
import { getChatId } from "../../utils/chatHelpers";
import { useCall } from "../../context/CallContext";

import SidebarNavigation from "../../components/layout/SidebarNavigation";
import MobileBottomNav from "../../components/layout/MobileBottomNav";
import Header from "../../components/layout/Header";
import CurrentUserCard from "../../components/chat/CurrentUserCard";
import UserCard from "../../components/chat/UserCard";
import ChatBox from "../../components/chat/ChatBox";

const UsersListPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { startCall } = useCall();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [loading, setLoading] = useState(true);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      const baseData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        online: true,
        lastSeen: new Date(),
        updatedAt: new Date()
      };

      if (!snap.exists()) {
        await setDoc(userRef, {
          ...baseData,
          createdAt: new Date(),
          bio: ""
        });
      } else {
        await updateDoc(userRef, {
          online: true,
          lastSeen: new Date()
        });
      }

      const updatedSnap = await getDoc(userRef);
      setCurrentUser({ uid: user.uid, ...updatedSnap.data() });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  /* ================= FETCH ONLY CHATTED USERS ================= */
  useEffect(() => {
    if (!currentUser?.uid) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setAllUsers([]);
        setLastMessages({});
        return;
      }

      const userIds = new Set();
      const lastMsgMap = {};

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const participants = data.participants || [];

        const otherUserId = participants.find(
          (id) => id !== currentUser.uid
        );

        if (!otherUserId) return;

        userIds.add(otherUserId);

        lastMsgMap[otherUserId] = {
          text: data.lastMessage || "",
          timestamp: data.lastMessageTime || null,
          unreadCount:
            data[`unreadCount_${currentUser.uid}`] || 0
        };
      });

      if (userIds.size === 0) {
        setAllUsers([]);
        setLastMessages({});
        return;
      }

      const usersQuery = query(
        collection(db, "users"),
        where("uid", "in", Array.from(userIds))
      );

      const usersSnap = await getDocs(usersQuery);
      const users = usersSnap.docs.map((d) => ({
        uid: d.id,
        ...d.data()
      }));

      setAllUsers(users);
      setLastMessages(lastMsgMap);
    });

    return () => unsubscribe();
  }, [currentUser]);

  /* ================= AUTO-SELECT USER FROM URL ================= */
  useEffect(() => {
    if (!userId || !currentUser) return;

    // If userId is in URL, fetch that user and open chat
    const fetchAndSelectUser = async () => {
      try {
        console.log('Attempting to open chat with userId:', userId);
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = { uid: userSnap.id, ...userSnap.data() };
          console.log('Found user:', userData);
          setSelectedUser(userData);

          // Create chat if it doesn't exist
          const chatId = getChatId(currentUser.uid, userId);
          const chatRef = doc(db, "chats", chatId);
          const chatSnap = await getDoc(chatRef);

          if (!chatSnap.exists()) {
            await setDoc(chatRef, {
              participants: [currentUser.uid, userId],
              createdAt: new Date(),
              lastMessage: "",
              lastMessageTime: null,
              [`unreadCount_${currentUser.uid}`]: 0,
              [`unreadCount_${userId}`]: 0
            });
            console.log('Created new chat with user');
          }
        } else {
          console.error('User not found with id:', userId);
        }
      } catch (error) {
        console.error('Error fetching user from URL:', error);
      }
    };

    fetchAndSelectUser();
  }, [userId, currentUser]);

  /* ================= CALL ================= */
  const handleCallUser = (user, type = "audio") => {
    if (!currentUser) return;

    startCall({
      type,
      caller: currentUser,
      receiver: user,
      channel: `call_${getChatId(currentUser.uid, user.uid)}`
    });
  };

  /* ================= SEARCH ================= */
  const filteredUsers = allUsers.filter((user) =>
    (user.displayName || user.email || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-pink-50">
      <SidebarNavigation />

      <div className="flex-1 flex flex-col lg:ml-64">
        <Header allUsers={allUsers} />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* USERS LIST */}
          <div
            className={`${
              selectedUser ? "hidden lg:flex" : "flex"
            } flex-col w-full lg:w-96 bg-white border-r`}
          >
            <CurrentUserCard user={currentUser} />

            <div className="p-4 border-b">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">
                  No chats yet
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <UserCard
                    key={user.uid}
                    user={user}
                    onSelect={() => setSelectedUser(user)}
                    onCall={() => handleCallUser(user, "audio")}
                    onVideo={() => handleCallUser(user, "video")}
                    isSelected={selectedUser?.uid === user.uid}
                    lastMessage={lastMessages[user.uid]}
                  />
                ))
              )}
            </div>
          </div>

          {/* CHAT BOX */}
          <div className={`${selectedUser ? "flex" : "hidden lg:flex"} flex-1`}>
            {selectedUser ? (
              <ChatBox
                user={selectedUser}
                currentUser={currentUser}
                onClose={() => {
                  setSelectedUser(null);
                  // Clear userId from URL when closing chat
                  if (userId) {
                    navigate('/userlist');
                  }
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p className="text-gray-400 text-lg">
                  Select a chat to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedUser && <MobileBottomNav />}
    </div>
  );
};

export default UsersListPage;