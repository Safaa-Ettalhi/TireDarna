import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../context/RealtimeContext";
import { getBuyerLeads, getOwnerLeads, updateLeadStatus } from "../../services/leadService";
import {
  getChatThreads,
  getChatThread,
  getChatMessages,
  sendChatMessage,
  markChatMessageRead,
  uploadChatAttachment,
  deleteChatThread,
} from "../../services/chatService";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { TextField } from "../../components/ui/TextField";
import { ENV } from "../../config/env";

const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${ENV.API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const CALL_STATUS_META = {
  calling: {
    container: "border-sky-200 bg-sky-50",
    badge: "bg-sky-100 text-sky-800",
    badgeLabel: "En attente",
    title: "Connexion à l'appel...",
    description: "Nous attendons que votre interlocuteur décroche.",
    icon: "ri-phone-line text-sky-500",
  },
  connected: {
    container: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-800",
    badgeLabel: "En direct",
    title: "Appel audio en cours",
    description: "La connexion audio est active et sécurisée.",
    icon: "ri-phone-fill text-emerald-500",
  },
};

const resolveEntityId = (entity) => {
  if (!entity) return null;
  if (typeof entity === "string") return entity;
  return entity._id || entity.id || entity.userId || null;
};

const getMessageId = (message) => message?._id || message?.id || null;

const LEAD_STATUS_LABELS = {
  new: "Nouveau",
  contacted: "Contacté",
  converted: "Converti",
  closed: "Clôturé",
};

export default function InboxPage() {
  const { token, user } = useAuth();
  const { socket } = useRealtime();
  const queryClient = useQueryClient();

  const [activeThread, setActiveThread] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [leadView, setLeadView] = useState("owner");
  const [loadingThread, setLoadingThread] = useState(false);
  const [typingStatus, setTypingStatus] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState({
    status: "idle",
    role: null,
    counterpart: null,
    startTime: null,
    duration: 0,
  });
  const [callError, setCallError] = useState("");
  const typingTimeoutRef = useRef(null);
  const readMessagesRef = useRef(new Set());
  const lastTypingEmitRef = useRef(0);
  const attachmentInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const threadMenuRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callStatusRef = useRef("idle");
  const callRoleRef = useRef(null);
  const callDurationIntervalRef = useRef(null);
  const missedCallTimeoutRef = useRef(null);
  const latestEndCallRef = useRef(null);
  const callDurationRef = useRef(0);

  const currentUserId = useMemo(() => resolveEntityId(user), [user]);
  const userDisplayName = useMemo(() => {
    const full = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
    return full || user?.email || "Vous";
  }, [user]);

  const buyerLeadsQuery = useQuery({
    queryKey: ["buyerLeads", token],
    queryFn: () => getBuyerLeads(token),
    enabled: !!token,
  });

  const ownerLeadsQuery = useQuery({
    queryKey: ["ownerLeads", token],
    queryFn: () => getOwnerLeads(token),
    enabled: !!token,
  });

  const logCallEvent = useCallback(
    (systemType, duration = null, roomIdOverride = null) => {
      const roomId = roomIdOverride || activeThread?.roomId;
      if (!socket || !roomId || !systemType) return;
      socket.emit("save_call_message", {
        roomId,
        systemType,
        callDuration: duration,
      });
    },
    [socket, activeThread?.roomId]
  );

  useEffect(() => {
    callDurationRef.current = callState.duration;
  }, [callState.duration]);


  const endCall = useCallback(
    ({ notifyRemote = false, message = "", systemType = null, callDuration = null, suppressLog = false } = {}) => {
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
        callDurationIntervalRef.current = null;
      }
      if (missedCallTimeoutRef.current) {
        clearTimeout(missedCallTimeoutRef.current);
        missedCallTimeoutRef.current = null;
      }

      const finalDuration = callDuration ?? (callState.startTime
        ? Math.floor((Date.now() - callState.startTime) / 1000)
        : callState.duration);

      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.onicecandidate = null;
          peerConnectionRef.current.ontrack = null;
          peerConnectionRef.current.onconnectionstatechange = null;
          peerConnectionRef.current.close();
        } catch (error) {
        }
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }

      if (systemType && activeThread?.roomId && !suppressLog) {
        logCallEvent(
          systemType,
          systemType === "call_ended" ? finalDuration : null
        );
      }

      setCallState({ status: "idle", role: null, counterpart: null, startTime: null, duration: 0 });
      setIncomingCall(null);

      if (notifyRemote && socket && activeThread?.roomId) {
        socket.emit("call_end", {
          roomId: activeThread.roomId,
          duration: finalDuration,
        });
      }

      setCallError(message || "");
    },
    [socket, activeThread?.roomId, callState.startTime, callState.duration, logCallEvent]
  );

  const createPeerConnection = useCallback(() => {
    if (typeof window === "undefined") {
      throw new Error("Appels audio non supportés dans cet environnement.");
    }
    const RTCPeerConnectionClass = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    if (!RTCPeerConnectionClass) {
      throw new Error("Appels audio non supportés par ce navigateur.");
    }
    const pc = new RTCPeerConnectionClass(RTC_CONFIG);
    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        const [stream] = event.streams;
        remoteAudioRef.current.srcObject = stream;
      }
    };
    pc.onicecandidate = (event) => {
      const targetRoomId = activeThread?.roomId || incomingCall?.roomId;
      if (event.candidate && socket && targetRoomId) {
        socket.emit("call_candidate", { candidate: event.candidate, roomId: targetRoomId });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        const startTime = Date.now();
        setCallState((prev) => ({
          ...prev,
          status: "connected",
          startTime,
          duration: 0,
        }));
        if (callDurationIntervalRef.current) {
          clearInterval(callDurationIntervalRef.current);
        }
        callDurationIntervalRef.current = setInterval(() => {
          setCallState((prev) => ({
            ...prev,
            duration: prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : 0,
          }));
        }, 1000);
      } else if (["failed", "disconnected"].includes(pc.connectionState)) {
        endCall({ message: "Appel interrompu.", systemType: "call_ended" });
      }
    };
    peerConnectionRef.current = pc;
    return pc;
  }, [socket, activeThread?.roomId, incomingCall?.roomId, endCall]);

  const getSessionDescriptionCtor = useCallback(() => {
    if (typeof window === "undefined") return null;
    return window.RTCSessionDescription || window.webkitRTCSessionDescription || null;
  }, []);

  const getIceCandidateCtor = useCallback(() => {
    if (typeof window === "undefined") return null;
    return window.RTCIceCandidate || window.webkitRTCIceCandidate || null;
  }, []);

  async function attachLocalStream(pc) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
    }
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    return stream;
  }

  const canStartCall = Boolean(
    socket &&
    activeThread?.roomId &&
    callState.status === "idle" &&
    !incomingCall &&
    !isRecording &&
    !recordedAudio
  );

  async function handleStartCall() {
    if (!canStartCall || !socket || !activeThread?.roomId) return;
    try {
      if (!socket.roomId || socket.roomId !== activeThread.roomId) {
        socket.emit("chat_room", { roomId: activeThread.roomId });
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      
      const pc = createPeerConnection();
      await attachLocalStream(pc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log("Emitting call_offer to room:", activeThread.roomId);
      socket.emit("call_offer", {
        offer,
        threadId: activeThread._id,
        roomId: activeThread.roomId,
      });
      
      setCallState({
        status: "calling",
        role: "caller",
        counterpart: counterpartDisplay,
      });
      logCallEvent("call_started");
      setCallError("");
      if (missedCallTimeoutRef.current) {
        clearTimeout(missedCallTimeoutRef.current);
      }
      missedCallTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === "calling") {
          logCallEvent("call_missed", null, activeThread.roomId);
          endCall({ notifyRemote: true, message: "Appel manqué.", suppressLog: true });
        }
      }, 30000);
      setThreadMenuOpen(false);
    } catch (error) {
      console.error("call start error", error);
      endCall({ message: "Impossible de démarrer l'appel audio." });
    }
  }

  async function acceptIncomingCall() {
    if (!incomingCall?.offer || !socket) return;
    
    
    if (incomingCall.threadId && (!activeThread || activeThread._id !== incomingCall.threadId)) {
      try {
        const thread = await getChatThread(token, incomingCall.threadId);
        setActiveThread(enhanceThread(thread.thread));
       
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Error loading thread for call:", error);
        setIncomingCall(null);
        endCall({ message: "Impossible de charger la conversation pour cet appel." });
        return;
      }
    }
    
    if (!activeThread?.roomId && !incomingCall?.roomId) {
      console.error("acceptIncomingCall: no activeThread or roomId");
      setIncomingCall(null);
      endCall({ message: "Conversation introuvable." });
      return;
    }
    const roomId = incomingCall?.roomId || activeThread?.roomId;
    
    try {
      const pc = createPeerConnection();
      const SessionDescription = getSessionDescriptionCtor();
      if (!SessionDescription) {
        throw new Error("Appels audio non supportés par ce navigateur.");
      }
      await pc.setRemoteDescription(new SessionDescription(incomingCall.offer));
      await attachLocalStream(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call_answer", {
        answer,
        threadId: activeThread?._id || incomingCall?.threadId,
        roomId,
      });
      const startTime = Date.now();
      setCallState({
        status: "connected",
        role: "callee",
        counterpart: incomingCall.callerName || "Contact",
        startTime,
        duration: 0,
      });
      setIncomingCall(null);
      setCallError("");
      if (missedCallTimeoutRef.current) {
        clearTimeout(missedCallTimeoutRef.current);
        missedCallTimeoutRef.current = null;
      }
      if (callDurationIntervalRef.current) {
        clearInterval(callDurationIntervalRef.current);
      }
      callDurationIntervalRef.current = setInterval(() => {
        setCallState((prev) => ({
          ...prev,
          duration: prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : 0,
        }));
      }, 1000);
      logCallEvent("call_accepted", null, roomId);
    } catch (error) {
      console.error("call answer error", error);
      setIncomingCall(null);
      endCall({ message: "Impossible de rejoindre l'appel." });
    }
  }

  function declineIncomingCall(reason = "declined") {
    const roomId = incomingCall?.roomId || activeThread?.roomId;
    if (socket && roomId) {
      socket.emit("call_decline", { reason, roomId });
    }
    logCallEvent("call_declined", null, roomId);
    endCall({ systemType: "call_declined", suppressLog: true });
  }

  function handleCancelCall() {
    const shouldLogAsMissed = callState.status === "calling";
    endCall({
      notifyRemote: true,
      systemType: shouldLogAsMissed ? "call_missed" : "call_ended",
    });
  }

  useEffect(() => {
    callStatusRef.current = callState.status;
  }, [callState.status]);

  useEffect(() => {
    if (!callError) return;
    const timeout = setTimeout(() => setCallError(""), 4000);
    return () => clearTimeout(timeout);
  }, [callError]);

  useEffect(() => {
    callRoleRef.current = callState.role;
  }, [callState.role]);

  useEffect(() => {
    function handleClick(event) {
      if (threadMenuRef.current && !threadMenuRef.current.contains(event.target)) {
        setThreadMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const threadsQuery = useQuery({
    queryKey: ["chatThreads", token],
    queryFn: () => getChatThreads(token),
    enabled: !!token,
    select: (data) =>
      data?.threads
        ?.map((thread) => {
          const counterpart =
            thread.participants?.find(
              (participant) => resolveEntityId(participant)?.toString() !== currentUserId?.toString()
            ) || thread.participants?.[0];
          return { ...thread, counterpart };
        })
        ?.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)) || [],
  });

  const messagesQuery = useQuery({
    queryKey: ["chatMessages", token, activeThread?._id],
    queryFn: () => getChatMessages(token, activeThread._id, { limit: 50 }),
    enabled: !!token && !!activeThread,
  });

  const markMessageLocallyAsRead = useCallback((messageId) => {
    if (!messageId) return;
    setMessages((prev) =>
      prev.map((msg) => (getMessageId(msg) === messageId ? { ...msg, read: true } : msg))
    );
  }, []);

  useEffect(() => {
    if (messagesQuery.data?.messages) {
      setMessages(
        messagesQuery.data.messages.map((message) => ({
          ...message,
          image: message.image || (message.mediaType === "image" ? message.mediaUrl : null),
          read: Boolean(message.read),
          systemType: message.systemType || null,
          callDuration: message.callDuration || null,
        }))
      );
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    readMessagesRef.current.clear();
    setTypingStatus("");
  
    if (isRecording && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      audioChunksRef.current = [];
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
    }
   
    if (recordedAudioUrl) {
      cancelRecordedAudio();
    }
  }, [activeThread?._id]);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setThreadMenuOpen(false);
   
    if (!incomingCall && callState.status === "idle") {
     
    }

    if (!activeThread?._id && callState.status !== "idle") {
      endCall();
    }
  }, [activeThread?._id, callState.status, endCall]);

  useEffect(() => {
    latestEndCallRef.current = endCall;
  }, [endCall]);

  useEffect(() => {
    return () => {
      latestEndCallRef.current?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
         
        }
        mediaRecorderRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      audioChunksRef.current = [];
    };
  }, [recordedAudioUrl]);

  useEffect(() => {
    if (!socket || !activeThread) return;
    
   
    socket.emit("chat_room", { roomId: activeThread.roomId });
    
 
    const handleRoomError = (error) => {
      if (error?.message?.includes("supprimée")) {
        alert("Cette conversation a été supprimée. Elle ne sera pas restaurée automatiquement.");
        setActiveThread(null);
        queryClient.invalidateQueries(["chatThreads", token]);
      }
    };
    socket.on("error", handleRoomError);

    const handleNewMessage = (payload) => {
     
      if (!activeThread) {
       
        queryClient.invalidateQueries(["chatThreads", token]);
        return;
      }
      
   
      
      const baseUser = {
        _id: payload.userId,
        name: payload.user,
      };
      const normalized = {
        _id: payload.id,
        userId: baseUser,
        message: payload.message,
        image: payload.image || (payload.mediaType === "image" ? payload.mediaUrl : null),
        mediaType: payload.mediaType || null,
        mediaUrl: payload.mediaUrl || null,
        mediaName: payload.mediaName || null,
        mediaSize: payload.mediaSize || null,
        createdAt: payload.timestamp,
        read: payload.read ?? false,
        systemType: payload.systemType || null,
        callDuration: payload.callDuration || null,
      };
      setMessages((prev) => [
        ...prev,
        normalized,
      ]);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_image", handleNewMessage);

    return () => {
      socket.off("error", handleRoomError);
      socket.off("new_message", handleNewMessage);
      socket.off("new_image", handleNewMessage);
    };
  }, [socket, activeThread, queryClient, token]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageReadEvent = ({ messageId }) => {
      markMessageLocallyAsRead(messageId);
    };

    const handleUserTyping = (text) => {
      if (!text) return;
      const label = text.replace("is typing...", "est en train d'écrire…");
      setTypingStatus(label);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus("");
      }, 2000);
    };

    const invalidateLeads = () => {
      queryClient.invalidateQueries(["ownerLeads", token]);
      queryClient.invalidateQueries(["buyerLeads", token]);
      queryClient.invalidateQueries(["chatThreads", token]);
    };

    socket.on("message_read", handleMessageReadEvent);
    socket.on("user_typing", handleUserTyping);
    socket.on("lead_created", invalidateLeads);
    socket.on("lead_updated", invalidateLeads);

    return () => {
      socket.off("message_read", handleMessageReadEvent);
      socket.off("user_typing", handleUserTyping);
      socket.off("lead_created", invalidateLeads);
      socket.off("lead_updated", invalidateLeads);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, markMessageLocallyAsRead, queryClient, token]);

  useEffect(() => {
    if (!socket) return;

    const handleCallOffer = (payload) => {
      console.log("Received call_offer:", payload, "activeThread:", activeThread?._id);
      if (!payload?.offer) {
        console.error("call_offer: missing offer", payload);
        return;
      }
      const callerId = payload?.caller?.id?.toString();
      if (callerId && callerId === currentUserId?.toString()) {
       
        return;
      }
      if (callStatusRef.current !== "idle") {
        console.log("call_offer: busy, declining");
        socket.emit("call_decline", { reason: "busy", roomId: payload?.roomId });
        return;
      }
      
     
      const isForCurrentThread = activeThread?._id && payload?.threadId === activeThread._id;
      
      console.log("call_offer: accepting, setting incoming call", { isForCurrentThread, threadId: payload?.threadId });
      setIncomingCall({
        offer: payload.offer,
        callerName: payload?.caller?.name || "Contact",
        threadId: payload?.threadId,
        roomId: payload?.roomId,
      });
      setCallState({
        status: "ringing",
        role: "callee",
        counterpart: payload?.caller?.name || "Contact",
        startTime: null,
        duration: 0,
      });
      if (missedCallTimeoutRef.current) {
        clearTimeout(missedCallTimeoutRef.current);
      }
      missedCallTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === "ringing") {
          if (socket && payload?.roomId) {
            socket.emit("call_decline", { reason: "timeout", roomId: payload?.roomId });
          }
          logCallEvent("call_missed", null, payload?.roomId);
          endCall({ message: "Appel manqué.", systemType: "call_missed", suppressLog: true });
        }
      }, 30000);
    };

    const handleCallAnswer = async (payload) => {
      if (!peerConnectionRef.current || !payload?.answer) return;
      try {
        const SessionDescription = getSessionDescriptionCtor();
        if (!SessionDescription) {
          throw new Error("Appels audio non supportés par ce navigateur.");
        }
        await peerConnectionRef.current.setRemoteDescription(new SessionDescription(payload.answer));
        const startTime = Date.now();
        setCallState((prev) => ({
          ...prev,
          status: "connected",
          startTime,
          duration: 0,
        }));
        if (missedCallTimeoutRef.current) {
          clearTimeout(missedCallTimeoutRef.current);
          missedCallTimeoutRef.current = null;
        }
        if (callDurationIntervalRef.current) {
          clearInterval(callDurationIntervalRef.current);
        }
        callDurationIntervalRef.current = setInterval(() => {
          setCallState((prev) => ({
            ...prev,
            duration: prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : 0,
          }));
        }, 1000);
      } catch (error) {
        console.error("call_answer error", error);
        endCall({ message: "Impossible d'établir l'appel." });
      }
    };

    const handleCallCandidate = async (payload) => {
      if (!peerConnectionRef.current || !payload?.candidate) return;
      try {
        const IceCandidate = getIceCandidateCtor();
        if (!IceCandidate) {
          throw new Error("Appels audio non supportés par ce navigateur.");
        }
        await peerConnectionRef.current.addIceCandidate(new IceCandidate(payload.candidate));
      } catch (error) {
        console.error("call_candidate error", error);
      }
    };

    const handleCallDecline = (payload) => {
      const reason = payload?.reason === "busy" ? "Votre interlocuteur est déjà en appel." : "Appel refusé.";
      endCall({ message: reason });
    };

    const handleCallEnd = (payload) => {
      const duration = payload?.duration ?? callDurationRef.current;
      endCall({
        message: "L'appel a été terminé par votre interlocuteur.",
        callDuration: duration,
        suppressLog: true,
      });
    };

    socket.on("call_offer", handleCallOffer);
    socket.on("call_answer", handleCallAnswer);
    socket.on("call_candidate", handleCallCandidate);
    socket.on("call_decline", handleCallDecline);
    socket.on("call_end", handleCallEnd);

    return () => {
      socket.off("call_offer", handleCallOffer);
      socket.off("call_answer", handleCallAnswer);
      socket.off("call_candidate", handleCallCandidate);
      socket.off("call_decline", handleCallDecline);
      socket.off("call_end", handleCallEnd);
    };
  }, [socket, endCall, getSessionDescriptionCtor, getIceCandidateCtor, activeThread, logCallEvent, callState.duration]);

  useEffect(() => {
    if (!activeThread || !token) return;
    const unreadMessages = messages.filter((msg) => {
      const senderId = resolveEntityId(msg.userId);
      if (!senderId || senderId?.toString() === currentUserId?.toString()) {
        return false;
      }
      const messageId = getMessageId(msg);
      if (!messageId || msg.read || readMessagesRef.current.has(messageId)) {
        return false;
      }
      return true;
    });

    if (!unreadMessages.length) return;

    unreadMessages.forEach((msg) => {
      const messageId = getMessageId(msg);
      if (!messageId) return;
      readMessagesRef.current.add(messageId);
      markChatMessageRead(token, messageId)
        .then(() => {
          markMessageLocallyAsRead(messageId);
        })
        .catch(() => {
          readMessagesRef.current.delete(messageId);
        });
    });
  }, [messages, activeThread, token, currentUserId, markMessageLocallyAsRead]);

  const leadStatusMutation = useMutation({
    mutationFn: ({ leadId, status }) => updateLeadStatus(token, leadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["ownerLeads", token]);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload) => {
      if (socket && activeThread?.roomId) {
        socket.emit("send_message", { message: payload.message });
        return;
      }
      await sendChatMessage(token, activeThread._id, payload.message);
    },
    onSettled: () => {
      setMessageInput("");
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (threadId) => deleteChatThread(token, threadId),
    onSuccess: () => {
      queryClient.invalidateQueries(["chatThreads", token]);
      queryClient.invalidateQueries(["ownerLeads", token]);
      queryClient.invalidateQueries(["buyerLeads", token]);
      setActiveThread(null);
      setShowDeleteConfirm(false);
      setCallError("");
    },
    onError: (error) => {
      setCallError(error.message || "Impossible de supprimer la conversation.");
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ file }) => {
      if (!activeThread?._id) {
        throw new Error("Choisissez d'abord une conversation.");
      }
      setAttachmentError("");
      try {
        const result = await uploadChatAttachment(token, activeThread._id, file);
        queryClient.invalidateQueries(["chatMessages", token, activeThread?._id]);
        return result;
      } catch (error) {

        const errorMessage = error.message || "";
        if (errorMessage.includes("notification")) {
          queryClient.invalidateQueries(["chatMessages", token, activeThread?._id]);
    
          return { success: true };
        }
        throw error;
      }
    },
    onSuccess: () => {
      setAttachmentError("");
    },
    onError: (error) => {
      const errorMessage = error.message || "";
      if (!errorMessage.includes("notification")) {
        setAttachmentError(errorMessage || "Impossible d'envoyer la pièce jointe.");
      } else {
        setAttachmentError("");
      }
    },
    onSettled: () => {
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    },
  });

  const leadsToDisplay =
    leadView === "owner" ? ownerLeadsQuery.data?.leads || [] : buyerLeadsQuery.data?.leads || [];

  const counterpartDisplay = useMemo(() => {
    if (!activeThread?.counterpart) return "Votre interlocuteur";
    const { firstName, lastName, email } = activeThread.counterpart;
    const full = [firstName, lastName].filter(Boolean).join(" ");
    if (full && email) return `${full} (${email})`;
    return full || email || "Votre interlocuteur";
  }, [activeThread]);

  function enhanceThread(thread) {
    if (!thread) return null;
    if (thread.counterpart) return thread;
    const participant =
      thread.participants?.find(
        (participant) => resolveEntityId(participant)?.toString() !== currentUserId?.toString()
      ) ||
      thread.participants?.[0];
    return { ...thread, counterpart: participant };
  }

  async function handleSelectThread(thread) {
    if (!thread) return;
    const threadId = typeof thread === "string" ? thread : thread._id || thread.id;
    if (!threadId) return;
    setThreadMenuOpen(false);
    setShowDeleteConfirm(false);

  
    const candidate =
      (typeof thread === "object" && thread.participants?.length ? thread : null) ||
      threadsQuery.data?.find((item) => item._id === threadId);
    if (candidate && candidate.participants?.length) {
      setActiveThread(enhanceThread(candidate));
      return;
    }

    try {
      setLoadingThread(true);
      const response = await getChatThread(token, threadId);
      setActiveThread(enhanceThread(response.thread));
    } catch (error) {
      alert(error.message || "Impossible de charger la conversation.");
    } finally {
      setLoadingThread(false);
    }
  }

  function handleMessageInputChange(event) {
    const value = event.target.value;
    setMessageInput(value);
    if (!socket || !activeThread?.roomId) {
      return;
    }
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 500) {
      return;
    }
    lastTypingEmitRef.current = now;
    socket.emit("user_typing");
  }

  function handleSendMessage(event) {
    event.preventDefault();
    if (!messageInput.trim() || !activeThread) return;
    sendMessageMutation.mutate({ message: messageInput.trim() });
  }

  function handleAttachmentButtonClick() {
    if (!activeThread) {
      alert("Sélectionnez un lead avant d'envoyer une pièce jointe.");
      return;
    }
    attachmentInputRef.current?.click();
  }

  function handleAttachmentChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

   
    const maxSize = 25 * 1024 * 1024; 
    if (file.size > maxSize) {
      setAttachmentError(`Le fichier est trop volumineux. Taille maximale : 25 MB.`);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      return;
    }

   
    const allowedTypes = ["image/", "video/", "audio/"];
    const isValidType = allowedTypes.some((type) => file.type.startsWith(type));
    if (!isValidType) {
      setAttachmentError("Type de fichier non supporté. Utilisez une image, une vidéo ou un fichier audio.");
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      return;
    }

    setAttachmentError("");
    uploadAttachmentMutation.mutate({ file });
  }

  async function startRecording() {
    if (!activeThread?._id) {
      alert("Sélectionnez un lead avant d'enregistrer un audio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const fileName = `audio_${Date.now()}.${mediaRecorder.mimeType.includes("webm") ? "webm" : "mp4"}`;
        const audioFile = new File([audioBlob], fileName, { type: mediaRecorder.mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);

       
        setRecordedAudio(audioFile);
        setRecordedAudioUrl(audioUrl);

       
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAttachmentError("");
      setRecordedAudio(null);
      setRecordedAudioUrl(null);

      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      setAttachmentError("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }

  function sendRecordedAudio() {
    if (recordedAudio && activeThread?._id) {
      uploadAttachmentMutation.mutate(
        { file: recordedAudio },
        {
          onSuccess: () => {
            cancelRecordedAudio();
          },
          onError: (error) => {
            
            const errorMessage = error.message || "";
            if (errorMessage.includes("notification")) {
              
              cancelRecordedAudio();
            }
            
          },
        }
      );
    }
  }

  function cancelRecordedAudio() {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setRecordingTime(0);
    setAttachmentError("");
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
      setAttachmentError("");
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }

  function formatRecordingTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleString("fr-FR");
  }

  const renderIncomingCallCard = (className = "") => {
    if (!incomingCall) return null;
    return (
      <div className={`rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm ${className}`}>
        <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-500 shadow-inner">
  <i className="ri-phone-line text-xl" />
</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] uppercase">Appel entrant</span>
              <span className="text-amber-600">Disponible encore quelques secondes</span>
            </div>
            <p className="text-sm font-semibold text-amber-900">
              {incomingCall.callerName || "Contact"}
            </p>
            <p className="text-xs text-amber-700">
              Acceptez l'appel audio pour discuter en direct avec votre interlocuteur.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={acceptIncomingCall} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg transition duration-300 flex items-center gap-2">
              <i className="ri-phone-fill text-lg" />
              Accepter
            </Button>

            {/* Bouton Refuser */}
            <Button type="button" variant="ghost" size="sm" onClick={() => declineIncomingCall("declined")} className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:from-red-600 hover:to-red-700 hover:shadow-lg transition duration-300 flex items-center gap-2">
              <i className="ri-phone-off-line text-lg" />
              Refuser
            </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCallBanner = () => {
    if (!activeThread && !incomingCall) return null;

    const incomingCard = renderIncomingCallCard("mt-3");
    if (incomingCard) {
      return incomingCard;
    }

    if (callState.status === "calling" || callState.status === "connected") {
      const meta = CALL_STATUS_META[callState.status];
      const durationLabel =
        callState.status === "connected" ? formatRecordingTime(callState.duration || 0) : "00:00";
      return (
        <div className={`mt-3 rounded-2xl border ${meta.container} p-4 shadow-sm`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${meta.badge}`}>
                  {meta.badgeLabel}
                </span>
                <span className="text-xs text-slate-500">
                  {callState.role === "caller" ? "Vous appelez" : "Vous êtes connecté"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <i className={`${meta.icon} text-base`} />
                <span>{meta.title}</span>
              </div>
              <p className="text-xs text-slate-600">{meta.description}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <i className="ri-user-3-line text-base text-slate-400" />
                  {callState.counterpart || counterpartDisplay}
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-timer-line text-base text-slate-400" />
                  {durationLabel}
                </span>
              </div>
            </div>
            <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={handleCancelCall}
  className="
    bg-gradient-to-r from-red-500 to-red-600
    text-white
    font-semibold
    px-4 py-2
    rounded-lg
    shadow-md
    hover:from-red-600 hover:to-red-700
    hover:shadow-lg
    transition
    duration-300
    flex items-center gap-2
  "
>
  <i className="ri-phone-off-line text-lg" />
  Terminer l'appel
</Button>

          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-500">
        <i className="ri-phone-line text-base text-slate-400" />
        Passez un appel audio pour accélérer la qualification de ce lead.
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Leads & Chat</h1>
            <p className="text-sm text-slate-500">
              Retrouvez vos prospects et discutez en direct grâce à la messagerie intégrée.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr] lg:h-[75vh]">
        <aside className="space-y-6 overflow-y-auto pr-1 chat-scroll">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
              <span>Mes leads</span>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setLeadView("owner")}
                  className={`rounded-md px-3 py-1 ${
                    leadView === "owner" ? "bg-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  Vendeur
                </button>
                <button
                  onClick={() => setLeadView("buyer")}
                  className={`rounded-md px-3 py-1 ${
                    leadView === "buyer" ? "bg-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  Acheteur
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {leadsToDisplay.length === 0 && (
                <p className="text-xs text-slate-500">Aucun lead pour le moment.</p>
              )}
              {leadsToDisplay.map((lead) => (
                <article key={lead._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-900">
                    {lead.property?.title || "Annonce supprimée"}
                  </div>
                  <p className="text-xs text-slate-500">
                    {leadView === "owner" ? lead.buyer?.email : lead.owner?.email}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        lead.status === "new"
                          ? "bg-emerald-100 text-emerald-700"
                          : lead.status === "contacted"
                          ? "bg-blue-100 text-blue-700"
                          : lead.status === "converted"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                    <small className="text-slate-500">{formatDate(lead.updatedAt)}</small>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lead.thread ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSelectThread(lead.thread._id ? lead.thread : lead.thread)}
                      >
                        Ouvrir le chat
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">Chat disponible après création du lead.</span>
                    )}
                    {leadView === "owner" && (
                      <select
                        value={lead.status}
                        onChange={(event) =>
                          leadStatusMutation.mutate({ leadId: lead._id, status: event.target.value })
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-emerald-500"
                      >
                        {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Conversations</p>
            {threadsQuery.isLoading && <p className="text-xs text-slate-500 mt-2">Chargement...</p>}
            {threadsQuery.isError && (
              <Alert
                variant="error"
                title="Impossible de charger les conversations"
                message={threadsQuery.error.message}
                className="mt-2"
              />
            )}
            <div className="mt-3 space-y-2">
              {threadsQuery.data?.length === 0 && (
                <p className="text-xs text-slate-500">Les conversations apparaîtront après création d'un lead.</p>
              )}
              {threadsQuery.data?.map((thread) => (
                <button
                  key={thread._id}
                  onClick={() => handleSelectThread(thread)}
                  className={`flex w-full flex-col rounded-xl border px-3 py-2 text-left text-sm ${
                    activeThread?._id === thread._id
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-100 bg-slate-50 hover:border-emerald-100"
                  }`}
                >
                  <span className="font-semibold text-slate-900">{thread.property?.title || "Sans titre"}</span>
                  <span className="text-xs text-slate-500">
                  {(() => {
                    if (!thread.counterpart) return "Contact";
                    const { firstName, lastName, email } = thread.counterpart;
                    const name = [firstName, lastName].filter(Boolean).join(" ");
                    if (name && email) return `${name} (${email})`;
                    return name || email || "Contact";
                  })()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {thread.lastActivity ? new Date(thread.lastActivity).toLocaleString("fr-FR") : "Nouveau"}
                  </span>
                  {thread.lastMessage && (
                    <p className="truncate text-xs text-slate-500">Dernier message : {thread.lastMessage}</p>
                  )}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex h-full flex-col overflow-hidden">
          {activeThread ? (
            <div className="flex h-full flex-col">
              <header className="border-b border-slate-100 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {activeThread.property?.title || "Conversation"}
                    </p>
                    <p className="text-xs text-slate-500">Avec {counterpartDisplay}</p>
                  </div>
                  <div className="relative" ref={threadMenuRef}>
                    <button
                      type="button"
                      onClick={() => setThreadMenuOpen((prev) => !prev)}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100"
                      title="Actions"
                    >
                      <i className="ri-more-2-line text-lg" />
                    </button>
                    {threadMenuOpen && (
                      <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={handleStartCall}
                          disabled={!canStartCall}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                            canStartCall
                              ? "text-slate-700 hover:bg-emerald-50"
                              : "cursor-not-allowed text-slate-400"
                          }`}
                        >
                          <i className="ri-phone-line text-base" />
                          Appel audio
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setThreadMenuOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <i className="ri-delete-bin-line text-base" />
                          Supprimer la conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {showDeleteConfirm && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-800">
                      Êtes-vous sûr de vouloir supprimer cette conversation ?
                    </p>
                    <p className="mt-1 text-xs text-red-600">
                      Cette action est irréversible. Tous les messages seront supprimés.
                    </p>
                    <div className="mt-4 flex gap-3">
  <button
    type="button"
    onClick={() => {
      setShowDeleteConfirm(false);
      setThreadMenuOpen(false);
    }}
    className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
  >
    Annuler
  </button>

  <button
    type="button"
    onClick={() => {
      if (activeThread?._id) {
        deleteThreadMutation.mutate(activeThread._id);
      }
    }}
    disabled={deleteThreadMutation.isLoading}
    className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
  >
    {deleteThreadMutation.isLoading ? "Suppression..." : "Supprimer"}
  </button>
</div>

                  </div>
                )}
                {renderCallBanner()}
                {callError && <p className="mt-2 text-xs text-red-500">{callError}</p>}
                <audio ref={localAudioRef} autoPlay muted className="hidden" />
                <audio ref={remoteAudioRef} autoPlay className="hidden" />
              </header>

              <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3 chat-scroll">
                {loadingThread || messagesQuery.isLoading ? (
                  <p className="text-center text-sm text-slate-500">Chargement de la conversation…</p>
                ) : (
                  messages.map((msg) => {
                  const messageId = getMessageId(msg);
                  const messageUser = msg.userId;
                    const senderId = resolveEntityId(messageUser);
                    const isMine = senderId?.toString() === currentUserId?.toString();
                  const senderLabel = isMine
                    ? "Vous"
                    : messageUser?.name ||
                      [messageUser?.firstName, messageUser?.lastName].filter(Boolean).join(" ") ||
                      messageUser?.email ||
                      "Invité";

                    if (msg.systemType) {
                      const actorLabel = senderLabel || "Contact";
                      const SYSTEM_LABELS = {
                        call_started: `${actorLabel} a lancé un appel`,
                        call_missed: `${actorLabel} a manqué l'appel`,
                        call_declined: `${actorLabel} a refusé l'appel`,
                        call_accepted: `${actorLabel} a accepté l'appel`,
                        call_ended: msg.callDuration
                          ? `${actorLabel} a terminé l'appel • ${formatRecordingTime(msg.callDuration)}`
                          : `${actorLabel} a terminé l'appel`,
                      };
                      const iconByType = {
                        call_started: "ri-phone-line text-emerald-500",
                        call_missed: "ri-phone-missed-line text-red-500",
                        call_declined: "ri-phone-off-line text-red-500",
                        call_accepted: "ri-phone-fill text-emerald-500",
                        call_ended: "ri-phone-line text-slate-500",
                      };
                      return (
                        <div key={messageId || msg._id} className="flex justify-center py-2">
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs text-slate-600 shadow-sm">
                            <i className={iconByType[msg.systemType] || "ri-phone-line"} />
                            <span>{SYSTEM_LABELS[msg.systemType] || `Événement d'appel par ${actorLabel}`}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={messageId || msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[70%]">
                          <p
                            className={`mb-1 text-xs font-semibold ${isMine ? "text-emerald-700" : "text-slate-500"}`}
                          >
                            {senderLabel}
                          </p>
                          <div
                            className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              isMine ? "bg-emerald-600 text-white" : "bg-white text-slate-800"
                            }`}
                          >
                            {(msg.image || (msg.mediaType === "image" && msg.mediaUrl)) && (
                              <div className="mb-2">
                                <img
                                  src={resolveMediaUrl(msg.image || msg.mediaUrl)}
                                  alt={msg.mediaName || "Image"}
                                  className="max-h-48 w-full rounded-lg object-cover"
                                />
                                {msg.mediaName && (
                                  <p className="mt-1 text-xs text-slate-400">{msg.mediaName}</p>
                                )}
                              </div>
                            )}
                            {msg.mediaType === "video" && msg.mediaUrl && (
                              <div className="mb-2">
                                <video
                                  controls
                                  src={resolveMediaUrl(msg.mediaUrl)}
                                  className="max-h-56 w-full rounded-lg"
                                />
                                {msg.mediaName && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    {msg.mediaName}
                                    {msg.mediaSize && ` (${(msg.mediaSize / 1024 / 1024).toFixed(2)} MB)`}
                                  </p>
                                )}
                              </div>
                            )}
                            {msg.mediaType === "audio" && msg.mediaUrl && (
                              <div className="mb-2">
                                <audio controls src={resolveMediaUrl(msg.mediaUrl)} className="w-full">
                                  Votre navigateur ne supporte pas l'élément audio.
                                </audio>
                                {msg.mediaName && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    {msg.mediaName}
                                    {msg.mediaSize && ` (${(msg.mediaSize / 1024 / 1024).toFixed(2)} MB)`}
                                  </p>
                                )}
                              </div>
                            )}
                            {msg.mediaType &&
                              !["image", "video", "audio"].includes(msg.mediaType) &&
                              msg.mediaUrl && (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mb-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-emerald-700"
                                >
                                  <i className="ri-attachment-line" />
                                  {msg.mediaName || "Pièce jointe"}
                                </a>
                              )}
                            {msg.message && <p>{msg.message}</p>}
                            <div
                              className={`mt-1 flex items-center ${
                                isMine ? "justify-between text-emerald-100" : "justify-start text-slate-400"
                              } text-[11px]`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMine && (
                                <span className="ml-2 flex items-center gap-1">
                                  <i
                                    className={`ri-check${
                                      msg.read ? "-double" : ""
                                    }-line ${msg.read ? "text-white" : "text-emerald-200"}`}
                                  />
                                  {msg.read ? "Lu" : "Envoyé"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {!loadingThread && !messagesQuery.isLoading && messages.length === 0 && (
                  <p className="text-xs text-slate-500 text-center">Aucun message encore dans cette conversation.</p>
                )}
              </div>
              {typingStatus && (
                <p className="mt-2 text-xs italic text-slate-500">{typingStatus}</p>
              )}

              <form onSubmit={handleSendMessage} className="mt-4 flex flex-col gap-2">
                {isRecording && (
                  <div className="mb-2 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
                      <span className="text-sm font-semibold text-red-700">
                        Enregistrement en cours... {formatRecordingTime(recordingTime)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={stopRecording}
                      className="text-red-700 hover:bg-red-100"
                    >
                      <i className="ri-stop-circle-line mr-1" />
                      Arrêter
                    </Button>
                  </div>
                )}
                {recordedAudio && recordedAudioUrl && !isRecording && (
                  <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="ri-mic-line text-emerald-600"></i>
                        <span className="text-sm font-semibold text-emerald-700">
                          Audio enregistré ({formatRecordingTime(recordingTime)})
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={sendRecordedAudio}
                          disabled={uploadAttachmentMutation.isLoading}
                          className="text-emerald-700 hover:bg-emerald-100"
                        >
                          <i className="ri-send-plane-line mr-1" />
                          Envoyer
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelRecordedAudio}
                          disabled={uploadAttachmentMutation.isLoading}
                          className="text-red-600 hover:bg-red-100"
                        >
                          <i className="ri-close-circle-line mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                    <audio controls src={recordedAudioUrl} className="mt-2 w-full" />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*"
                    className="hidden"
                    onChange={handleAttachmentChange}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAttachmentButtonClick}
                    disabled={uploadAttachmentMutation.isLoading || isRecording || recordedAudio}
                    title="Ajouter une image, vidéo ou audio"
                  >
                    {uploadAttachmentMutation.isLoading ? (
                      "Envoi..."
                    ) : (
                      <>
                        <i className="ri-attachment-line mr-1" />
                        Média
                      </>
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={uploadAttachmentMutation.isLoading || recordedAudio}
                    title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer un audio"}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition flex items-center ${
                      isRecording
                        ? "border-red-300 bg-red-500 text-white hover:bg-red-600 animate-pulse"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <i className={`ri-${isRecording ? "stop" : "mic"}-line mr-1`} />
                    {isRecording ? "Arrêter" : "Micro"}
                  </button>
                  <TextField
                    placeholder="Écrire un message…"
                    value={messageInput}
                    onChange={handleMessageInputChange}
                    className="flex-1"
                    disabled={isRecording || recordedAudio}
                  />
                  <Button type="submit" disabled={sendMessageMutation.isLoading || isRecording || recordedAudio}>
                    Envoyer
                  </Button>
                </div>
                {attachmentError && <p className="text-xs text-red-500">{attachmentError}</p>}
              </form>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
              {incomingCall && renderIncomingCallCard("mb-4 w-full max-w-md")}
              <p className="font-semibold text-slate-800">Choisissez un lead ou une conversation</p>
              <p className="mt-2 max-w-sm">
                Sélectionnez un lead ou un thread dans la colonne de gauche pour commencer à discuter avec vos
                prospects.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

