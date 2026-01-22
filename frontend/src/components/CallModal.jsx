import { useEffect, useRef, useState } from "react";
import socket from "../socket";

export default function CallModal({ 
  selectedDM,
  activeCall,
  incomingCall,
  setActiveCall,
  setIncomingCall
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const dataChannelRef = useRef(null);
  const iceCandidatesRef = useRef([]);

  // For incoming calls, use the caller info; for outgoing, use selectedDM
  const callContact = incomingCall ? { id: incomingCall.from, name: incomingCall.fromName } : selectedDM;
  const friendId = callContact?.id;
  const friendName = callContact?.name;
  const callType = activeCall || incomingCall?.callType;
  const isIncoming = !!incomingCall;

  const [callState, setCallState] = useState(isIncoming ? "incoming" : "calling");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationIntervalRef = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302"] },
      { urls: ["stun:stun1.l.google.com:19302"] },
    ],
  };

  // Initialize local stream
  useEffect(() => {
    const initializeStream = async () => {
      try {
        const constraints = {
          audio: true,
          video: callType === "video" ? { width: 640, height: 480 } : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        if (callType === "video" && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (!isIncoming) {
          createPeerConnection();
          await makeCall();
        }
      } catch (err) {
        console.error("❌ Failed to get media:", err);
        alert("Failed to access camera/microphone. Check permissions.");
        endCall();
      }
    };

    initializeStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [callType, isIncoming]);

  // Listen for call answers and ICE candidates - ONLY set up once
  useEffect(() => {
    if (!friendId) {
      console.log("⚠️ No friendId yet, skipping listener setup");
      return;
    }
    
    console.log("🔧 Setting up socket listeners for friendId:", friendId);
    
    const handleCallAnswer = (data) => {
      console.log("🎯 CALLER RECEIVED callAnswer event:", data);
      console.log("🔧 Current callState:", callState);
      
      // Always transition to active when answer is received
      console.log("🔄 Setting callState to active");
      setCallState("active");
      
      // Start the duration timer
      console.log("⏱️ Starting duration timer");
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      
      // Set remote description for the peer connection
      if (peerConnectionRef.current && data.answer) {
        try {
          console.log("🔌 Setting remote description");
          peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } catch (err) {
          console.error("❌ Failed to set remote description:", err);
        }
      }
    };

    const handleIceCandidate = (data) => {
      console.log("❄️ Received ICE candidate");
      if (data.candidate && peerConnectionRef.current) {
        try {
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("❌ Failed to add ICE candidate:", err);
        }
      }
    };
    
    socket.on("callAnswer", handleCallAnswer);
    socket.on("iceCandidate", handleIceCandidate);

    return () => {
      console.log("🧹 Cleaning up socket listeners for friendId:", friendId);
      socket.off("callAnswer", handleCallAnswer);
      socket.off("iceCandidate", handleIceCandidate);
    };
  }, [friendId]);

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = peerConnection;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log("📹 Received remote track:", event.track.kind);
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
      }
      remoteStreamRef.current.addTrack(event.track);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 Sending ICE candidate");
        socket.emit("iceCandidate", {
          to: friendId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log("🔌 Connection state:", peerConnection.connectionState);
      if (peerConnection.connectionState === "connected") {
        setCallState("active");
        startDurationTimer();
      } else if (peerConnection.connectionState === "failed" || 
                 peerConnection.connectionState === "disconnected") {
        endCall();
      }
    };

    // Handle data channel for messages
    peerConnection.ondatachannel = (event) => {
      dataChannelRef.current = event.channel;
      setupDataChannel();
    };

    return peerConnection;
  };

  const setupDataChannel = () => {
    if (!dataChannelRef.current) return;

    dataChannelRef.current.onopen = () => {
      console.log("📡 Data channel opened");
    };

    dataChannelRef.current.onmessage = (event) => {
      console.log("💬 Received:", event.data);
    };
  };

  const makeCall = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit("callOffer", {
        to: friendId,
        offer: offer,
        callType: callType,
      });
    } catch (err) {
      console.error("❌ Failed to make call:", err);
    }
  };

  const answerCall = async () => {
    try {
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }

      if (incomingCall?.offer) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(incomingCall.offer)
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit("callAnswer", {
          to: friendId,
          answer: answer,
        });

        setCallState("active");
        startDurationTimer();
      }
    } catch (err) {
      console.error("❌ Failed to answer call:", err);
    }
  };

  const handleAnswerClick = () => {
    // Will be called with the offer from socket listener
    socket.emit("answerCall", { to: friendId });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callType === "video" && localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const startDurationTimer = () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    durationIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const endCall = () => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    socket.emit("endCall", { to: friendId });
    setActiveCall(null);
    setIncomingCall(null);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#1f2937",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Video Container */}
      {callType === "video" && (
        <div style={{ position: "relative", width: "100%", flex: 1 }}>
          {/* Remote Video (full screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              background: "#000",
            }}
          />

          {/* Local Video (pip) */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              width: "150px",
              height: "150px",
              borderRadius: "8px",
              background: "#000",
              border: "2px solid white",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Audio Only Display */}
      {callType === "audio" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 30,
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "60px",
            }}
          >
            🎙️
          </div>
          <div style={{ textAlign: "center", color: "white" }}>
            <h2>{friendName}</h2>
            <p style={{ color: "#9ca3af" }}>
              {callState === "incoming"
                ? "Incoming call..."
                : callState === "calling"
                ? "Calling..."
                : formatDuration(duration)}
            </p>
          </div>
        </div>
      )}

      {/* Call Info */}
      <div style={{ color: "white", fontSize: 16, textAlign: "center" }}>
        <p>{callType === "video" ? "📹 Video Call" : "🎙️ Voice Call"}</p>
        {callState === "active" && (
          <p style={{ color: "#10b981", fontWeight: 600 }}>
            Duration: {formatDuration(duration)}
          </p>
        )}
      </div>

      {/* Incoming Call Buttons */}
      {callState === "incoming" && (
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <button
            onClick={answerCall}
            style={{
              padding: "12px 30px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#059669";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#10b981";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ✓ Answer
          </button>
          <button
            onClick={endCall}
            style={{
              padding: "12px 30px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#dc2626";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ef4444";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ✕ Decline
          </button>
        </div>
      )}

      {/* Call Controls */}
      {callState !== "incoming" && (
        <div
          style={{
            display: "flex",
            gap: 15,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: isMuted ? "#ef4444" : "#667eea",
              color: "white",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          {/* Video Toggle (only for video calls) */}
          {callType === "video" && (
            <button
              onClick={toggleVideo}
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: isVideoOff ? "#ef4444" : "#667eea",
                color: "white",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? "📹" : "📷"}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "#ef4444",
              color: "white",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.background = "#dc2626";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "#ef4444";
            }}
            title="End call"
          >
            ☎️
          </button>
        </div>
      )}
    </div>
  );
}
