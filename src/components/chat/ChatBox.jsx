import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Phone, Video, Send, ArrowLeft } from "lucide-react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../config/firebase";
import {
  getChatId,
  formatMessageTime,
  markMessagesAsRead,
} from "../../utils/chatHelpers";
import { useCall } from "../../context/CallContext";

export default function ChatBox({ user, currentUser, onClose }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true); // Optional: show loading state
  const messagesEndRef = useRef(null);
  const { startCall } = useCall();

  const chatId =
    user && currentUser ? getChatId(currentUser.uid, user.uid) : null;

  // Debug logs — you can remove these later
  useEffect(() => {
    console.log("Current User:", currentUser);
    console.log("Chat Partner:", user);
    console.log("Chat ID:", chatId);
  }, [currentUser, user, chatId]);

  /* ---------- AUTO SCROLL ---------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------- INIT CHAT + LISTEN TO MESSAGES ---------- */
  useEffect(() => {
    if (!chatId || !currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const initChat = async () => {
      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);

      if (!snap.exists()) {
        await setDoc(chatRef, {
          participants: [currentUser.uid, user.uid],
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: null,
          [`unreadCount_${currentUser.uid}`]: 0,
          [`unreadCount_${user.uid}`]: 0,
        });
      }
    };

    initChat().catch(console.error);

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(list);
      setLoading(false);

      // Mark messages as read for current user
      if (list.length > 0) {
        await markMessagesAsRead(chatId, currentUser.uid).catch(console.error);
      }
    });

    return () => unsub();
  }, [chatId, currentUser, user]);

  /* ---------- SEND MESSAGE ---------- */
  const handleSendMessage = async () => {
    if (!message.trim() || !chatId || !currentUser || !user) return;

    const text = message.trim();
    setMessage("");

    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      const unread = chatSnap.exists()
        ? chatSnap.data()[`unreadCount_${user.uid}`] || 0
        : 0;

      // Add message to subcollection
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || "User",
        senderPhoto: currentUser.photoURL || "",
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
      });

      // Update main chat document
      await setDoc(
        chatRef,
        {
          participants: [currentUser.uid, user.uid],
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: currentUser.uid,
          [`unreadCount_${user.uid}`]: unread + 1,
          [`unreadCount_${currentUser.uid}`]: 0,
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Send message failed:", err);
      alert("Failed to send message: " + err.message);
      setMessage(text); // Restore message if failed
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* ---------- RENDER STATES ---------- */

  // If no current user (not logged in)
  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );
  }

  // If no chat partner selected
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle size={60} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 bg-pink-500 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="hover:bg-pink-600 p-2 rounded">
            <ArrowLeft size={24} />
          </button>
          <img
            src={user.photoURL || "https://placehold.co/40x40?text=U"}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold text-lg">
              {user.displayName || user.email || "Unknown User"}
            </h4>
            <p className="text-sm opacity-80">{user.online ? "Online" : "Offline"}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => startCall({ type: "audio", caller: currentUser, receiver: user })}
            className="hover:bg-pink-600 p-2 rounded-full transition"
          >
            <Phone size={22} />
          </button>
          <button
            onClick={() => startCall({ type: "video", caller: currentUser, receiver: user })}
            className="hover:bg-pink-600 p-2 rounded-full transition"
          >
            <Video size={22} />
          </button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] shadow-sm ${
                    isMe
                      ? "bg-pink-500 text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 text-right ${
                      isMe ? "opacity-80" : "text-gray-500"
                    }`}
                  >
                    {formatMessageTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            placeholder="Type a message..."
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          {/* button */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-pink-500 text-white p-3 rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}