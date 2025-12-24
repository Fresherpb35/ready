import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useCall } from "../../context/CallContext";
import { useAuth } from "../../context/AuthContext";
import { joinAgora, leaveAgora, toggleMic } from "../../services/AgoraService";

export default function AudioCallUI() {
  const { call, endCall, setCall } = useCall();
  const { user } = useAuth();

  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);

  const joinedRef = useRef(false);

  if (!call) return null;

  const isReceiver = call.receiverId === user.uid;
  const otherUser = isReceiver ? call.caller : call.receiver;

  /* ---------------- START CALL ---------------- */
  const startCall = async () => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    try {
      await joinAgora({ channel: call.callId, isVideo: false });
    } catch (e) {
      joinedRef.current = false;
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isReceiver) startCall();

    return () => {
      leaveAgora();
      joinedRef.current = false;
    };
    // eslint-disable-next-line
  }, []);

  /* ---------------- ACCEPT ---------------- */
  const acceptCall = async () => {
    setCall({ ...call, pickedUp: true });
    await startCall();
  };

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!call.pickedUp) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [call.pickedUp]);

  const formatTime = () => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ---------------- MIC ---------------- */
  const handleMic = async () => {
    await toggleMic(!micOn);
    setMicOn(!micOn);
  };

  /* ---------------- SPEAKER ---------------- */
  const toggleSpeaker = () => {
    // Web audio output control (browser-safe)
    const audios = document.querySelectorAll("audio");
    audios.forEach((a) => (a.muted = speakerOn));
    setSpeakerOn(!speakerOn);
  };

  /* ---------------- END ---------------- */
const handleEnd = async (callStatus = "completed") => {
  console.log("Ending call with status:", callStatus);
  await leaveAgora();
  endCall(callStatus, seconds);
  joinedRef.current = false;
};


  const statusText = () => {
    if (!call.pickedUp && isReceiver) return "Incoming audio call";
    if (!call.pickedUp && !isReceiver) return "Calling…";
    return formatTime();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col items-center justify-between py-16">
      {/* TOP INFO */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold">
          {otherUser.displayName}
        </h2>
        <p className="text-sm text-white/70 mt-1">
          {statusText()}
        </p>
      </div>

      {/* AVATAR */}
      <div className="relative mt-10">
        <div className="absolute inset-0 rounded-full animate-pulse bg-green-500/20"></div>
        <img
          src={otherUser.photoURL}
          className="relative w-40 h-40 rounded-full border-4 border-white/20 object-cover"
        />
      </div>

      {/* CONTROLS */}
      <div className="flex gap-6 bg-black/60 px-10 py-5 rounded-full backdrop-blur-md mb-10">
        {isReceiver && !call.pickedUp ? (
           <>
    <button
      onClick={acceptCall}
      className="px-6 py-4 bg-green-600 rounded-full font-medium"
    >
      Accept
    </button>
    <button
      onClick={() => handleEnd("rejected")} // ← pass string explicitly
      className="px-6 py-4 bg-red-600 rounded-full font-medium"
    >
      Reject
    </button>
  </>
) : (
  <>
    {/* MIC */}
    <button
      onClick={handleMic}
      className={`p-4 rounded-full ${micOn ? "bg-white/20" : "bg-red-500"}`}
    >
      {micOn ? <Mic /> : <MicOff />}
    </button>

    {/* SPEAKER */}
    <button
      onClick={toggleSpeaker}
      className={`p-4 rounded-full ${speakerOn ? "bg-white/20" : "bg-red-500"}`}
    >
      {speakerOn ? <Volume2 /> : <VolumeX />}
    </button>

    {/* END */}
    <button
      onClick={() => handleEnd("completed")} // ← pass string explicitly
      className="p-4 rounded-full bg-red-600"
    >
      <PhoneOff />
    </button>
  </>
        )}
      </div>
    </div>
  );
}
