"use client";
import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import socket from "@/apis/socket";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [remoteUsername, setRemoteUsername] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceActivity, setVoiceActivity] = useState(false);
  const [remoteVoiceActivity, setRemoteVoiceActivity] = useState(false);

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const getUserId = () => {
    if (typeof window !== "undefined") {
      let storedUserId = localStorage.getItem("userId");
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem("userId", storedUserId);
      }
      return storedUserId;
    }
    return "";
  };

  const validateUsername = (value) => {
    return /^[a-z0-9]+$/.test(value);
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase();
    if (validateUsername(value) || value === "") {
      setUsername(value);
    }
  };

  const isUsernameValid = () => {
    return (
      username.length >= 1 &&
      username.length <= 16 &&
      validateUsername(username)
    );
  };

  const handleOnboardingSubmit = (e) => {
    e.preventDefault();
    if (isUsernameValid()) {
      localStorage.setItem("username", username);
      setShowOnboarding(false);
      registerUser();
    }
  };

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      monitorVoiceActivity();

      return stream;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      return null;
    }
  };

  const monitorVoiceActivity = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkActivity = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      setVoiceActivity(average > 30);
      requestAnimationFrame(checkActivity);
    };

    checkActivity();
  };

  const setupRemoteVoiceDetection = (stream) => {
    try {
      const remoteAudioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const remoteSource = remoteAudioContext.createMediaStreamSource(stream);
      const remoteAnalyser = remoteAudioContext.createAnalyser();
      remoteAnalyser.fftSize = 256;
      remoteSource.connect(remoteAnalyser);

      const bufferLength = remoteAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkRemoteActivity = () => {
        remoteAnalyser.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        setRemoteVoiceActivity(average > 30);
        requestAnimationFrame(checkRemoteActivity);
      };

      checkRemoteActivity();
    } catch (error) {
      console.error("Error setting up remote voice detection:", error);
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice_candidate", {
          userId: userId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];

        setupRemoteVoiceDetection(event.streams[0]);
      }
    };

    return pc;
  };

  const startCall = async () => {
    setIsConnecting(true);
    const stream = await initializeAudio();
    if (!stream) return;

    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("webrtc_offer", {
      userId: userId,
      offer: offer,
    });
  };

  const handleOffer = async (data) => {
    try {
      const stream = await initializeAudio();
      if (!stream) return;

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc_answer", {
        userId: userId,
        answer: answer,
      });

      setIsConnecting(false);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  const handleAnswer = async (data) => {
    if (
      peerConnectionRef.current &&
      peerConnectionRef.current.signalingState === "have-local-offer"
    ) {
      try {
        await peerConnectionRef.current.setRemoteDescription(data.answer);
        setIsConnecting(false);
      } catch (error) {
        console.error("Error setting remote answer:", error);
      }
    }
  };

  const handleIceCandidate = async (data) => {
    if (
      peerConnectionRef.current &&
      peerConnectionRef.current.remoteDescription
    ) {
      try {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerMuted(remoteAudioRef.current.muted);
    }
  };

  const registerUser = () => {
    const userId = getUserId();
    const storedUsername = localStorage.getItem("username");
    setUserId(userId);
    setUsername(storedUsername);

    socket.emit("register_user", {
      userId: userId,
      username: storedUsername,
    });
  };

  const disconnectCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    socket.emit("disconnect_room", {
      userId: userId,
      isManualDisconnect: true,
    });

    setConnected(false);
    setRemoteUsername("");
    setIsConnecting(false);
    setVoiceActivity(false);
    setRemoteVoiceActivity(false);
  };

  useEffect(() => {
    socket.on("registration_complete", (roomData) => {
      setConnected(true);
      if (roomData.remoteUsername) {
        setRemoteUsername(roomData.remoteUsername);
      }

      if (roomData.isCaller) {
        startCall();
      }
    });

    socket.on("webrtc_offer", handleOffer);
    socket.on("webrtc_answer", handleAnswer);
    socket.on("webrtc_ice_candidate", handleIceCandidate);

    socket.on("room_disconnected", () => {
      disconnectCall();
    });

    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      setShowOnboarding(true);
      return;
    }

    registerUser();

    return () => {
      socket.off("registration_complete");
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
      socket.off("room_disconnected");
    };
  }, [userId]);

  if (showOnboarding) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-indigo-600 p-4">
        <div className="w-full max-w-md bg-[#000000] border-8 border-[#000000] shadow-[12px_12px_0px_0px_#000000] p-8 transform -rotate-1">
          <h1 className="text-4xl font-black mb-6 text-center text-[#ffffff] transform rotate-1 font-mono">
            VOICE CHAT
          </h1>
          <form onSubmit={handleOnboardingSubmit} className="space-y-6">
            <div>
              <label className="block text-xl font-black mb-3 text-[#ff6b35] font-mono">
                USERNAME:
              </label>
              <input
                type="text"
                value={username}
                maxLength={16}
                onChange={handleUsernameChange}
                placeholder="ENTER NAME..."
                className="w-full px-4 py-4 bg-[#ffffff] border-4 border-[#000000] shadow-[6px_6px_0px_0px_#000000] text-[#000000] placeholder-[#666666] focus:outline-none font-mono font-black text-lg transform rotate-1"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!isUsernameValid()}
              className="w-full px-6 py-4 bg-[#00ff00] border-4 border-[#000000] shadow-[8px_8px_0px_0px_#000000] font-mono font-black text-xl text-[#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[4px_4px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transform -rotate-1"
            >
              START TALKING!
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-indigo-700 p-4">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="inline-block bg-[#000000] border-8 border-[#000000] shadow-[12px_12px_0px_0px_#000000] px-8 py-4 transform rotate-1">
            <h1 className="text-3xl font-black text-[#ffffff] font-mono">
              VOICE CHAT
            </h1>
            <div className="mt-2">
              {connected ? (
                <span className="text-2xl font-black text-[#00ff00] font-mono">
                  TALKING TO: {remoteUsername || "STRANGER"}
                </span>
              ) : (
                <span className="text-2xl font-black text-[#ffff00] font-mono animate-pulse">
                  {isConnecting ? "CONNECTING..." : "FINDING STRANGER..."}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-8 mb-12">
          <div className="text-center">
            <div
              className={`w-32 h-32 rounded-full border-8 border-[#000000] shadow-[8px_8px_0px_0px_#000000] flex items-center justify-center transform -rotate-3 transition-all duration-200 ${
                voiceActivity ? "bg-[#00ff00] scale-110" : "bg-[#ffffff]"
              }`}
            >
              <div className="text-4xl font-black text-[#000000] font-mono">
                YOU
              </div>
            </div>
            <div className="mt-4 text-xl font-black text-[#000000] font-mono">
              {username}
            </div>
          </div>

          <div className="text-center">
            <div
              className={`w-32 h-32 rounded-full border-8 border-[#000000] shadow-[8px_8px_0px_0px_#000000] flex items-center justify-center transform rotate-3 transition-all duration-200 ${
                remoteVoiceActivity ? "bg-[#ff0080] scale-110" : "bg-[#ffffff]"
              }`}
            >
              <div className="text-4xl font-black text-[#000000] font-mono">
                THEM
              </div>
            </div>
            <div className="mt-4 text-xl font-black text-[#000000] font-mono">
              {connected ? remoteUsername || "STRANGER" : "..."}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6">
          <button
            onClick={toggleMute}
            disabled={!connected}
            className={`w-20 h-20 border-8 border-[#000000] shadow-[8px_8px_0px_0px_#000000] font-black text-[#000000] transition-all disabled:opacity-50 hover:shadow-[4px_4px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transform -rotate-2 ${
              isMuted ? "bg-[#ff0000]" : "bg-[#ffffff]"
            }`}
          >
            {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <button
            onClick={disconnectCall}
            disabled={!connected}
            className="w-20 h-20 bg-[#ff0000] border-8 border-[#000000] shadow-[8px_8px_0px_0px_#000000] font-black text-[#ffffff] transition-all disabled:opacity-50 hover:shadow-[4px_4px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transform rotate-2"
          >
            <PhoneOff size={32} />
          </button>

          <button
            onClick={toggleSpeaker}
            disabled={!connected}
            className={`w-20 h-20 border-8 border-[#000000] shadow-[8px_8px_0px_0px_#000000] font-black text-[#000000] transition-all disabled:opacity-50 hover:shadow-[4px_4px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transform rotate-2 ${
              isSpeakerMuted ? "bg-[#ffff00]" : "bg-[#ffffff]"
            }`}
          >
            {isSpeakerMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
          </button>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-[#000000] border-4 border-[#000000] shadow-[6px_6px_0px_0px_#000000] px-6 py-3 transform -rotate-1">
            <p className="text-lg font-black text-[#ffffff] font-mono">
              SPEAK FREELY! DISCONNECT TO FIND SOMEONE NEW
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
