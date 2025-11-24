import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTirelireGroupDetails,
  getTirelireGroupContributions,
  getTirelireGroupDistributions,
  createTirelireContribution,
  payTirelireContribution,
  cancelTirelireContribution,
  cancelTirelireContributionBySession,
  checkStripeSessionStatus,
  getTirelireGroupMessages,
  sendTirelireGroupMessage,
  buildTirelireAssetUrl,
  getTirelireAudioBlobUrl,
  getTirelireGroupTickets,
  createTirelireTicket,
  sendTirelireContributionReminder,
} from "../../services/tirelireService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

const FREQUENCY_LABELS = {
  hebdomadaire: "Hebdomadaire",
  mensuel: "Mensuelle",
};

const COLORS_BY_SCORE = [
  { min: 85, label: "Excellent", className: "bg-emerald-100 text-emerald-800" },
  { min: 70, label: "Solide", className: "bg-lime-100 text-lime-800" },
  { min: 50, label: "Moyen", className: "bg-amber-100 text-amber-800" },
  { min: 0, label: "À surveiller", className: "bg-rose-100 text-rose-800" },
];

function getEntityId(entity) {
  if (!entity) return null;
  if (typeof entity === "string") return entity;
  return entity._id || entity.id || entity.userId || null;
}

function getAudioMimeType(audioPath) {
  if (!audioPath) return "audio/mpeg";
  
  const path = audioPath.toLowerCase();
  if (path.endsWith(".ogg") || path.includes(".ogg")) {
    return "audio/ogg";
  }
  if (path.endsWith(".m4a") || path.includes(".m4a")) {
    return "audio/mp4";
  }
  if (path.endsWith(".mp3") || path.includes(".mp3")) {
    return "audio/mpeg";
  }
  if (path.endsWith(".wav") || path.includes(".wav")) {
    return "audio/wav";
  }
  if (path.endsWith(".aac") || path.includes(".aac")) {
    return "audio/aac";
  }
  if (path.endsWith(".webm") || path.includes(".webm")) {
    return "audio/webm";
  }
  
  if (path.includes("audio/ogg") || path.includes("codecs=opus")) {
    return "audio/ogg";
  }
  if (path.includes("audio/mp4")) {
    return "audio/mp4";
  }
  if (path.includes("audio/mpeg")) {
    return "audio/mpeg";
  }
  if (path.includes("audio/wav")) {
    return "audio/wav";
  }
  
  return "audio/mpeg";
}

function formatFrequencyLabel(frequency) {
  return FREQUENCY_LABELS[frequency] || "Mensuelle";
}

function formatDurationLabel(group) {
  const memberCount = group?.members?.length || group?.rotationOrder?.length || 0;
  if (!memberCount) return "N/A";
  if (group.frequency === "hebdomadaire") {
    const weeks = memberCount;
    const months = Math.floor(weeks / 4);
    const remainingWeeks = weeks % 4;
    if (months > 0 && remainingWeeks > 0) {
      return `${months} mois ${remainingWeeks > 0 ? `et ${remainingWeeks} sem.` : ""}`;
    }
    if (months > 0) return `${months} mois`;
    return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  return `${memberCount} mois`;
}

function getReliabilityBadge(score) {
  if (typeof score !== "number") {
    return { label: "Non évalué", className: "bg-slate-100 text-slate-600" };
  }
  const match = COLORS_BY_SCORE.find((entry) => score >= entry.min);
  return match || COLORS_BY_SCORE[COLORS_BY_SCORE.length - 1];
}

function getInitials(name = "") {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const MEMBER_COLORS = [
  "bg-sky-600",
  "bg-indigo-600",
  "bg-rose-500",
  "bg-amber-500",
  "bg-purple-600",
  "bg-teal-600",
  "bg-blue-600",
  "bg-fuchsia-600",
];

function getColorForMember(memberId) {
  if (!memberId) return MEMBER_COLORS[0];
  const hash = memberId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MEMBER_COLORS[hash % MEMBER_COLORS.length];
}

function getDisplayName(entity) {
  if (!entity) return "";
  const firstName = entity.firstName || entity.firstname;
  const lastName = entity.lastName || entity.lastname;
  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ").trim();
  }
  if (typeof entity.name === "string" && entity.name.trim()) {
    return entity.name.trim();
  }
  return entity.email || "";
}

export default function TirelireGroupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [showContribute, setShowContribute] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [audioInputKey, setAudioInputKey] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [newMessageNotification, setNewMessageNotification] = useState(null);
  const processedMessageIdsRef = useRef(new Set());

  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const [audioBlobUrls, setAudioBlobUrls] = useState(new Map());
  const audioBlobUrlsRef = useRef(new Map());
  const tirelireBaseUrl = (
    import.meta.env.VITE_TIRELIRE_APP_URL ||
    import.meta.env.VITE_TIRELIRE_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
  const tirelireSupportUrl = `${tirelireBaseUrl}/support`;
  const tirelireTicketsUrl = `${tirelireBaseUrl}/tickets`;

  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ["tirelireGroup", id, token],
    queryFn: () => getTirelireGroupDetails(token, id),
    enabled: !!token && !!id,
  });

  const { data: contributionsData, refetch: refetchContributions } = useQuery({
    queryKey: ["tirelireContributions", id, token],
    queryFn: () => getTirelireGroupContributions(token, id),
    enabled: !!token && !!id,
  });

  const { data: distributionsData } = useQuery({
    queryKey: ["tirelireDistributions", id, token],
    queryFn: () => getTirelireGroupDistributions(token, id),
    enabled: !!token && !!id,
  });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["tirelireGroupMessages", id, token],
    queryFn: () => getTirelireGroupMessages(token, id),
    enabled: !!token && !!id,
    refetchInterval: 10000, 
  });

  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ["tirelireGroupTickets", id, token],
    queryFn: () => getTirelireGroupTickets(token, id),
    enabled: !!token && !!id,
  });

  
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId && token) {
      console.log('Vérification du paiement pour la session:', sessionId);
      
      checkStripeSessionStatus(token, sessionId)
        .then((data) => {
          console.log(' Réponse vérification session:', data);
          
          if (data.success && data.contribution) {
            console.log(' Paiement confirmé, rafraîchissement des données...');
            queryClient.invalidateQueries(["tirelireGroup", id]);
            queryClient.invalidateQueries(["tirelireContributions", id]);
            refetchContributions();
            
          
            setTimeout(() => {
              refetchContributions();
              alert("Paiement effectué avec succès !");
            }, 500);
          } else {
            console.log('Paiement non confirmé, nouvelle tentative dans 2 secondes...');
           
            setTimeout(() => {
              checkStripeSessionStatus(token, sessionId)
                .then((retryData) => {
                  console.log(' Réponse vérification session (retry):', retryData);
                  
                  if (retryData.success && retryData.contribution) {
                    queryClient.invalidateQueries(["tirelireGroup", id]);
                    queryClient.invalidateQueries(["tirelireContributions", id]);
                    refetchContributions();
                    alert("Paiement effectué avec succès !");
                  } else {
                    console.log("Paiement en cours de traitement...");
                   
                    queryClient.invalidateQueries(["tirelireGroup", id]);
                    queryClient.invalidateQueries(["tirelireContributions", id]);
                    refetchContributions();
                  }
                })
                .catch((err) => {
                  console.error("Erreur vérification session:", err);
                });
            }, 2000);
          }
        })
        .catch((err) => {
          console.error("Erreur vérification session Stripe:", err);
          queryClient.invalidateQueries(["tirelireGroup", id]);
          queryClient.invalidateQueries(["tirelireContributions", id]);
          refetchContributions();
        });
      
      navigate(`/financing/tirelire/${id}`, { replace: true });
    } else if (paymentStatus === 'cancel' && sessionId && token) {
      cancelTirelireContributionBySession(token, sessionId)
        .then(() => {
          alert("Paiement annulé. La contribution a été annulée.");
          queryClient.invalidateQueries(["tirelireGroup", id]);
          queryClient.invalidateQueries(["tirelireContributions", id]);
          refetchContributions();
        })
        .catch((err) => {
          console.error("Erreur annulation contribution (session):", err);
          alert(
            `Paiement annulé, mais l'annulation automatique a échoué: ${err.message}. ` +
              "Veuillez annuler manuellement depuis la page du groupe."
          );
        })
        .finally(() => {
          navigate(`/financing/tirelire/${id}`, { replace: true });
        });
    }
  }, [searchParams, id, token, queryClient, navigate, refetchContributions]);

  const createContributionMutation = useMutation({
    mutationFn: (payload) => createTirelireContribution(token, payload),
    onSuccess: (data) => {
    
      if (data?.stripeCheckoutUrl) {
        window.location.href = data.stripeCheckoutUrl;
      } else {
        alert("Contribution créée avec succès ! Vous pouvez maintenant la payer.");
        setShowContribute(false);
        refetchContributions();
      }
    },
    onError: (err) => {
      alert(`Erreur: ${err.message}`);
    },
  });

  const payMutation = useMutation({
    mutationFn: (payload) => payTirelireContribution(token, payload),
    onSuccess: () => {
      alert("Paiement effectué avec succès !");
      queryClient.invalidateQueries(["tirelireGroup", id]);
      refetchContributions();
    },
    onError: (err) => {
      alert(`Erreur de paiement: ${err.message}`);
    },
  });

  const cancelContributionMutation = useMutation({
    mutationFn: (contributionId) => cancelTirelireContribution(token, contributionId),
    onSuccess: () => {
      queryClient.invalidateQueries(["tirelireGroup", id]);
      refetchContributions();
      alert("Contribution annulée avec succès.");
    },
    onError: (err) => {
      alert(`Erreur lors de l'annulation: ${err.message}`);
    },
  });

  const [messageSentFeedback, setMessageSentFeedback] = useState(false);

  const clearRecordedAudio = () => {
    setAudioUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return null;
    });
    setRecordedAudio(null);
    setAudioFile(null);
  };

  const sendMessageMutation = useMutation({
    mutationFn: (payload) => sendTirelireGroupMessage(token, payload),
    onSuccess: () => {
      setMessageInput("");
      setAudioInputKey((prev) => prev + 1);
      clearRecordedAudio();
      setMessageSentFeedback(true);
      setTimeout(() => {
        queryClient.invalidateQueries(["tirelireGroupMessages", id]);
        refetchMessages();
        setMessageSentFeedback(false);
      }, 400);
    },
    onError: (err) => {
      alert(`Erreur lors de l'envoi du message: ${err.message}`);
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (payload) => createTirelireTicket(token, payload),
    onSuccess: () => {
      setTicketSubject("");
      setTicketDescription("");
      setShowTicketForm(false);
      queryClient.invalidateQueries(["tirelireGroupTickets", id]);
      refetchTickets();
      alert("Ticket créé avec succès !");
    },
    onError: (err) => {
      alert(`Erreur lors de la création du ticket: ${err.message}`);
    },
  });

  function handleCreateTicket(event) {
    event.preventDefault();
    if (!ticketSubject.trim()) {
      alert("Veuillez saisir un sujet pour le ticket.");
      return;
    }
    createTicketMutation.mutate({
      groupId: id,
      subject: ticketSubject,
      description: ticketDescription,
    });
  }

  function handleCreateContribution(event) {
    event.preventDefault();
   
    createContributionMutation.mutate({
      groupId: id, 
    });
  }

  function handlePay(contributionId) {
    if (window.confirm("Confirmer le paiement de cette contribution ?")) {
      payMutation.mutate({
        contributionId,
        paymentMethodId: "pm_test_123", 
      });
    }
  }

  function handleCancel(contributionId) {
    if (window.confirm("Annuler cette contribution ? Cette action est irréversible.")) {
      cancelContributionMutation.mutate(contributionId);
    }
  }

  function handleSendGroupMessage(event) {
    event.preventDefault();
    if (!messageInput.trim() && !audioFile) {
      alert("Veuillez écrire un message ou importer un fichier audio.");
      return;
    }
    sendMessageMutation.mutate({
      groupId: id,
      content: messageInput,
      audioFile,
    });
  }

  function handleAudioChange(event) {
    const file = event.target.files?.[0];
    if (file && file.size > 15 * 1024 * 1024) {
      alert("Le fichier audio dépasse la taille maximale de 15 Mo.");
      event.target.value = "";
      return;
    }
   
    if (file) {
      clearRecordedAudio();
    }
    setAudioFile(file || null);
  }

  function clearAudioAttachment() {
    setAudioFile(null);
    setAudioInputKey((prev) => prev + 1);
  }

 
  async function startRecording() {
    try {
    
      setAudioFile(null);
      setAudioInputKey((prev) => prev + 1);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
   
      let mimeType = null;
      let fileExtension = null;
      
      if (MediaRecorder.isTypeSupported("audio/ogg; codecs=opus")) {
        mimeType = "audio/ogg; codecs=opus";
        fileExtension = "ogg";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
        fileExtension = "m4a";
      } else if (MediaRecorder.isTypeSupported("audio/webm; codecs=opus")) {
      
        stream.getTracks().forEach((track) => track.stop());
        alert("Votre navigateur ne supporte pas les formats audio compatibles (ogg, m4a). Veuillez utiliser un navigateur plus récent ou importer un fichier audio.");
        return;
      } else {
        stream.getTracks().forEach((track) => track.stop());
        alert("Votre navigateur ne supporte pas l'enregistrement audio. Veuillez utiliser un navigateur plus récent ou importer un fichier audio.");
        return;
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });
        
       
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
      
        const fileName = `recording-${Date.now()}.${fileExtension}`;
        const audioFile = new File([audioBlob], fileName, {
          type: mimeType,
        });
        setRecordedAudio(audioFile);
        setAudioFile(audioFile);
        
     
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement:", error);
      alert("Impossible d'accéder au microphone. Vérifiez les permissions de votre navigateur.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }


  const group = groupData?.group;
  const contributions = contributionsData?.contributions || [];
  const distributions = distributionsData?.distributions || [];
  const uniqueDistributions = useMemo(() => {
    const map = new Map();
    distributions.forEach((distribution) => {
      const key =
        distribution._id ||
        `${distribution.turn}-${distribution.cycleNumber || 1}-${distribution.beneficiary?._id || distribution.beneficiary}`;
      if (!map.has(key)) {
        map.set(key, distribution);
      }
    });
    return Array.from(map.values());
  }, [distributions]);

  const memberMap = useMemo(() => {
    const map = new Map();
    if (group?.members?.length) {
      group.members.forEach((member) => {
        const id = getEntityId(member);
        if (id) {
          map.set(id.toString(), member);
        }
      });
    }
    return map;
  }, [group]);

  const rotationTimeline = useMemo(() => {
    if (!group) return [];
    const rawOrder =
      (group.rotationOrder?.length ? group.rotationOrder : group.members?.map((member) => getEntityId(member))) || [];
    return rawOrder
      .filter(Boolean)
      .map((memberId, index) => {
        const member = memberMap.get(memberId.toString()) || {};
        const name = getDisplayName(member) || `Membre ${index + 1}`;
        const score = typeof member.score === "number" ? member.score : null;
        const isCurrent = typeof group.currentTurn === "number" ? index === group.currentTurn : index === 0;
        const isNext =
          typeof group.currentTurn === "number"
            ? index === ((group.currentTurn + 1) % (rawOrder.length || 1))
            : index === 1;
        return {
          id: memberId.toString(),
          order: index + 1,
          name,
          score,
          isCurrent,
          isNext,
        };
      });
  }, [group, memberMap]);

  const reliabilityScore = useMemo(() => {
    if (!group?.members?.length) return null;
    const scores = group.members
      .map((member) => (typeof member.score === "number" ? member.score : null))
      .filter((score) => score !== null);
    if (!scores.length) return null;
    const total = scores.reduce((sum, value) => sum + value, 0);
    return Math.round(total / scores.length);
  }, [group]);

  const reliabilityBadge = useMemo(() => getReliabilityBadge(reliabilityScore), [reliabilityScore]);

  const nextBeneficiary = useMemo(() => {
    if (!rotationTimeline.length) return null;
    return rotationTimeline.find((step) => step.isCurrent) || rotationTimeline[0];
  }, [rotationTimeline]);

  const nextDueDate = useMemo(() => {
    if (!contributions.length) return null;
    const pending = contributions
      .filter((contribution) => contribution.status !== "paid")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return pending[0]?.dueDate || null;
  }, [contributions]);

  const calendarImportantDates = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dates = new Map();
    
    contributions.forEach((contribution) => {
      if (contribution.dueDate) {
        const date = new Date(contribution.dueDate);
        const day = date.getDate();
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          if (!dates.has(day)) dates.set(day, []);
          dates.get(day).push({
            type: 'due',
            contribution,
            date,
          });
        }
      }
    });

    uniqueDistributions.forEach((distribution) => {
      const distDate = distribution.completedAt
        ? new Date(distribution.completedAt)
        : distribution.createdAt
        ? new Date(distribution.createdAt)
        : null;
      if (distDate && distDate.getMonth() === currentMonth && distDate.getFullYear() === currentYear) {
        const day = distDate.getDate();
        if (!dates.has(day)) dates.set(day, []);
        dates.get(day).push({
          type: 'distribution',
          distribution,
          date: distDate,
        });
      }
    });
    
    return dates;
  }, [contributions, uniqueDistributions]);

  const pendingCount = useMemo(
    () => contributions.filter((contribution) => contribution.status !== "paid").length,
    [contributions]
  );

  const paidCount = useMemo(
    () => contributions.filter((contribution) => contribution.status === "paid").length,
    [contributions]
  );

  const cycleNumber = group?.currentCycle || 1;
  const durationLabel = useMemo(() => formatDurationLabel(group), [group]);
  const frequencyLabel = useMemo(() => formatFrequencyLabel(group?.frequency), [group]);
  const groupMessages = useMemo(() => {
    if (!messagesData) return [];
    if (Array.isArray(messagesData)) return messagesData;
    if (Array.isArray(messagesData.messages)) return messagesData.messages;
    return [];
  }, [messagesData]);

  useEffect(() => {
    if (!token || !groupMessages.length) return;

    const audioMessages = groupMessages.filter((msg) => msg.type === "audio" && msg._id);
    const currentBlobUrls = audioBlobUrlsRef.current;
    const newBlobUrls = new Map(currentBlobUrls);

    const currentMessageIds = new Set(audioMessages.map((msg) => msg._id));
    currentBlobUrls.forEach((url, messageId) => {
      if (!currentMessageIds.has(messageId)) {
        URL.revokeObjectURL(url);
        newBlobUrls.delete(messageId);
      }
    });

    audioMessages.forEach(async (message) => {
      if (!newBlobUrls.has(message._id)) {
        const blobUrl = await getTirelireAudioBlobUrl(token, message._id);
        if (blobUrl) {
          newBlobUrls.set(message._id, blobUrl);
          audioBlobUrlsRef.current = newBlobUrls;
          setAudioBlobUrls(new Map(newBlobUrls));
        }
      }
    });
  }, [groupMessages, token]);

  useEffect(() => {
    return () => {
      audioBlobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const currentUserId = useMemo(() => {
    const groupUserId = getEntityId(user);
    const authContextId = user?.userId || user?._id || user?.id;
    return (groupUserId || authContextId)?.toString() || null;
  }, [user]);

  const currentUserEmail = (user?.email || "").toLowerCase().trim();

  const myContributions = useMemo(() => {
    if (!currentUserId && !currentUserEmail) return [];
    if (!contributions || !Array.isArray(contributions)) return [];
    
    return contributions.filter((c) => {
      if (!c || !c.user) return false;
      
      const contributionUserId = getEntityId(c.user);
      if (contributionUserId && currentUserId && contributionUserId.toString() === currentUserId.toString()) {
        return true;
      }
      
      if (c.user?.darnaUserId && user) {
        const userDarnaId = user?.darnaUserId || user?.userId || user?._id || user?.id;
        if (userDarnaId && userDarnaId.toString() === c.user.darnaUserId.toString()) {
          return true;
        }
      }
      
      if (currentUserEmail && c.user?.email) {
        const contributionEmail = (c.user.email || "").toLowerCase().trim();
        if (contributionEmail === currentUserEmail) {
          return true;
        }
      }
      
      if (typeof c.user === "string" && currentUserId && c.user.toString() === currentUserId.toString()) {
        return true;
      }
      
      return false;
    });
  }, [contributions, currentUserId, currentUserEmail, user]);

  useEffect(() => {
    if (!groupMessages.length || lastMessageCount === 0) {
      setLastMessageCount(groupMessages.length);
      const existingIds = groupMessages.map(m => m._id?.toString()).filter(Boolean);
      processedMessageIdsRef.current = new Set(existingIds);
      return;
    }

    if (groupMessages.length > lastMessageCount) {
    
      const sortedMessages = [...groupMessages].sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate; 
      });
      
      const latestMessage = sortedMessages[0];
      const messageId = latestMessage._id?.toString();
      
      if (!messageId || processedMessageIdsRef.current.has(messageId)) {
        setLastMessageCount(groupMessages.length);
        return;
      }
      
      const sender = latestMessage.user || {};
      
      const senderEmailRaw = 
        sender.email || 
        latestMessage.user?.email ||
        latestMessage.email || 
        latestMessage.userEmail || "";
      const senderEmail = senderEmailRaw.toString().toLowerCase().trim();
      
      const senderDarnaUserId = 
        sender.darnaUserId || 
        latestMessage.user?.darnaUserId || 
        null;
      
      const currentUserDarnaId = user?.userId || user?._id || user?.id || null;
      const currentUserDarnaIdString = currentUserDarnaId ? currentUserDarnaId.toString() : null;
      

      const isFromMe = 
        (currentUserDarnaIdString && senderDarnaUserId && currentUserDarnaIdString === senderDarnaUserId.toString()) ||
        (currentUserEmail && senderEmail && currentUserEmail === senderEmail);
    
      console.log("🔍 Nouveau message détecté:", {
        messageId,
        senderEmail,
        senderDarnaUserId: senderDarnaUserId?.toString(),
        currentUserEmail,
        currentUserDarnaIdString,
        isFromMe,
        senderData: sender,
      });
      
      processedMessageIdsRef.current.add(messageId);
      
      if (isFromMe) {
        console.log("⏭️ Message de l'utilisateur actuel, pas de notification");
        setLastMessageCount(groupMessages.length);
        return;
      }
      
      let senderName = "Un membre";
      
      
      const formatFullName = (memberData) => {
        if (!memberData) return "Un membre";
        
       
        const displayName = getDisplayName({
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          name: memberData.name,
          email: memberData.email,
        });
        
        if (displayName && !displayName.includes("@")) {
          return displayName;
        }
        
        
        if (memberData.name && !memberData.name.includes("@")) {
          return memberData.name;
        }
        
       
        if (memberData.email && memberData.email.includes("@")) {
          const emailPart = memberData.email.split("@")[0];
         
          return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
        }
        
        return "Un membre";
      };
      
      if (group?.members?.length) {
       
        const memberMatch = group.members.find((member) => {
          const memberEmail = (member.email || "").toLowerCase().trim();
          const memberDarnaUserId = member.darnaUserId ? member.darnaUserId.toString() : null;
          const matchesEmail = memberEmail && senderEmail && memberEmail === senderEmail;
          const matchesDarnaId = memberDarnaUserId && senderDarnaUserId && memberDarnaUserId === senderDarnaUserId.toString();
          return matchesEmail || matchesDarnaId;
        });
        
        if (memberMatch) {
         
          const memberEmail = (memberMatch.email || "").toLowerCase().trim();
          const memberDarnaId = memberMatch.darnaUserId ? memberMatch.darnaUserId.toString() : null;
          const isCurrentUser = 
            (currentUserDarnaIdString && memberDarnaId && currentUserDarnaIdString === memberDarnaId) ||
            (currentUserEmail && memberEmail && currentUserEmail === memberEmail);
          
          if (!isCurrentUser) {
            senderName = formatFullName(memberMatch);
            console.log("👤 Nom complet trouvé dans membres (expéditeur):", senderName);
          } else {
            console.log("⚠️ Membre trouvé est l'utilisateur actuel, utilisation du fallback");
            senderName = formatFullName(sender);
          }
        } else {
        
          senderName = formatFullName(sender);
          console.log(" Nom complet depuis message:", senderName);
        }
      } else {
       
        senderName = formatFullName(sender);
        console.log(" Nom complet depuis message (pas de membres):", senderName);
      }
      
      console.log(" Affichage notification pour:", senderName, "(expéditeur:", senderEmail, ")");
      
      setNewMessageNotification({
        sender: senderName,
        message: latestMessage.content || latestMessage.text || "Nouveau message",
        type: latestMessage.type,
      });
      
    
      setTimeout(() => {
        setNewMessageNotification(null);
      }, 5000);
      
      setLastMessageCount(groupMessages.length);
    }
  }, [groupMessages, lastMessageCount, currentUserId, currentUserEmail, group, user]);

  const orderedGroupMessages = useMemo(() => {
    return [...groupMessages].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aDate - bDate;
    });
  }, [groupMessages]);

  const sectionLinks = [
    { id: "insights", label: "Insights & Stats" },
    { id: "timeline", label: "Calendrier des tours" },
    { id: "members", label: "Membres & fiabilité" },
    { id: "chat", label: "Messagerie du groupe" },
    { id: "my-contributions", label: "Mes contributions" },
    { id: "all-contributions", label: "Toutes les contributions" },
    { id: "distributions", label: "Historique des distributions" },
    { id: "tickets", label: "Tickets & Support" },
  ];

  const [activeSection, setActiveSection] = useState(sectionLinks[0].id);

  function handleNavClick(sectionId) {
    setActiveSection(sectionId);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
  }

  if (groupLoading) {
    return <p className="text-sm text-slate-500">Chargement du groupe...</p>;
  }

  if (!group) {
    return (
      <Alert variant="error" title="Groupe introuvable" message="Ce groupe n'existe pas." />
    );
  }

  const progress = group?.totalCollected
    ? Math.round((group.totalCollected / group.amount) * 100)
    : 0;
  
  const unpaidContributions = myContributions.filter((c) => !c.paid);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate("/financing/tirelire/my-groups")}>
          ← Retour
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{group.name}</h2>
          <p className="text-sm text-slate-500">Groupe d'épargne collective</p>
        </div>
      </div>

      <div className="sticky top-16 z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {sectionLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                activeSection === link.id
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
              }`}
              onClick={() => handleNavClick(link.id)}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Informations du groupe */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-slate-600">Montant cible</p>
            <p className="text-xl font-semibold text-slate-900">
              {group.amount?.toLocaleString("fr-FR")} dh
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Fréquence</p>
            <p className="text-lg font-medium text-slate-700">{frequencyLabel}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Nombre de membres</p>
            <p className="text-lg font-medium text-slate-700">{group.members?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Durée du groupe</p>
            <p className="text-lg font-medium text-slate-700">{durationLabel}</p>
          </div>
        </div>
        
        {progress > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="mb-2 flex justify-between text-sm text-slate-600">
              <span>Progression: {progress}%</span>
              <span>Collecté: {group.totalCollected?.toLocaleString("fr-FR")} dh / {group.amount?.toLocaleString("fr-FR")} dh</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      {activeSection === "insights" && (
        <section id="insights" className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score de fiabilité</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {reliabilityScore !== null ? `${reliabilityScore} / 100` : "Non évalué"}
          </p>
          <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${reliabilityBadge.className}`}>
            {reliabilityBadge.label}
          </span>
          <p className="mt-3 text-xs text-slate-500">
            Basé sur {group.members?.length || 0} membre(s). Encouragez vos membres à garder un bon historique de paiement.
          </p>
        </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prochaine étape</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {nextDueDate ? new Date(nextDueDate).toLocaleDateString("fr-FR") : "À planifier"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Bénéficiaire : {nextBeneficiary?.name || "À déterminer"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Cycle #{cycleNumber} • Tour {nextBeneficiary?.order || "-"}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Assurez-vous que chaque membre a une contribution valide avant cette date.
          </p>
        </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suivi des contributions</p>
          <dl className="mt-3 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Payées</span>
              <span className="font-semibold text-emerald-700">{paidCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Annuler</span>
              <span className="font-semibold text-amber-700">{pendingCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Total enregistrées</span>
              <span className="font-semibold text-slate-900">{contributions.length}</span>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            {pendingCount
              ? `${pendingCount} contribution(s) doivent encore être payées avant la distribution.`
              : "Toutes les contributions sont à jour pour ce cycle."}
          </p>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => setShowContribute(!showContribute)}>
          {showContribute ? "Annuler" : "+ Contribuer"}
        </Button>
        {unpaidContributions.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => handlePay(unpaidContributions[0]._id)}
            disabled={payMutation.isLoading}
          >
            Payer ma contribution ({unpaidContributions.length})
          </Button>
        )}
      </div>

      {/* Formulaire de contribution */}
      {showContribute && (
        <form onSubmit={handleCreateContribution} className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Créer une contribution</h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-600">Montant de la contribution</p>
              <p className="text-lg font-semibold text-slate-900">
                {group.members?.length
                  ? (group.amount / group.members.length).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : group.amount?.toLocaleString("fr-FR")}{" "}
                dh
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {group.frequency === "hebdomadaire"
                  ? " Cette contribution sera récurrente chaque semaine."
                  : " Cette contribution sera récurrente chaque mois."}
              </p>
            </div>
            <Button type="submit" disabled={createContributionMutation.isLoading}>
              {createContributionMutation.isLoading ? "Création..." : "Créer la contribution"}
            </Button>
          </div>
        </form>
      )}

      {/* Calendrier des tours */}
      {rotationTimeline.length > 0 && activeSection === "timeline" && (
        <section id="timeline" className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Calendrier des tours</h3>
                <p className="text-xs text-slate-500">
                  Chaque tour correspond à un membre bénéficiaire lors de la distribution.
                </p>
              </div>
              {nextDueDate && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (window.confirm("Envoyer un rappel par email à tous les membres avec des contributions en attente ?")) {
                      try {
                        const result = await sendTirelireContributionReminder(token, id);
                        alert(`${result.message}\n${result.sent} rappel(s) envoyé(s) sur ${result.total} contribution(s) en attente.`);
                      } catch (err) {
                        alert(`Erreur lors de l'envoi du rappel: ${err.message}`);
                      }
                    }
                  }}
                  className="text-xs"
                >
                  <i className="ri-notification-line mr-1" />
                  Envoyer un rappel
                </Button>
              )}
            </div>

            {/* Vue calendrier mensuel simplifiée */}
            {nextDueDate && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-calendar-event-line text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-900">Prochaine échéance</span>
                </div>
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold">
                    {new Date(nextDueDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
                {nextBeneficiary && (
                  <p className="text-xs text-emerald-700 mt-1">
                    Bénéficiaire : {nextBeneficiary.name || "À déterminer"}
                  </p>
                )}
              </div>
            )}

            {/* Vue calendrier mensuel avec échéances */}
            {(() => {
              const now = new Date();
              const currentMonth = now.getMonth();
              const currentYear = now.getFullYear();
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
              const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

              return (
                <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    Calendrier - {now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </h4>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {days.map((day) => (
                      <div key={day} className="text-xs font-semibold text-slate-500 py-1">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-8" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayEvents = calendarImportantDates.get(day) || [];
                      const isToday = day === now.getDate();
                      const hasDue = dayEvents.some((e) => e.type === 'due');
                      const hasDistribution = dayEvents.some((e) => e.type === 'distribution');
                      
                      return (
                        <div
                          key={day}
                          className={`h-8 flex items-center justify-center text-xs rounded relative ${
                            isToday
                              ? "bg-emerald-100 font-semibold text-emerald-900"
                              : hasDue || hasDistribution
                              ? "bg-amber-50 text-amber-700"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                          title={
                            dayEvents.length > 0
                              ? dayEvents
                                  .map((e) =>
                                    e.type === 'due'
                                      ? `Échéance: ${e.contribution.amount} dh`
                                      : `Distribution: ${e.distribution.amount} dh`
                                  )
                                  .join('\n')
                              : undefined
                          }
                        >
                          {day}
                          {hasDue && (
                            <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          )}
                          {hasDistribution && (
                            <span className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full" />
                      <span>Échéance</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span>Distribution</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Timeline des tours */}
            <div className="space-y-3">
              {rotationTimeline.map((step) => {
                const badge = getReliabilityBadge(step.score);
                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm ${
                      step.isCurrent
                        ? "border-emerald-200 bg-emerald-50"
                        : step.isNext
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                          step.isCurrent
                            ? "bg-emerald-600 text-white"
                            : step.isNext
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        #{step.order}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{step.name}</p>
                        <p className="text-xs text-slate-500">
                          {step.isCurrent ? "Tour en cours" : step.isNext ? "À venir" : "Tour à venir"}
                        </p>
                      </div>
                    </div>
                    {step.score !== null && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {step.score} pts
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vue calendrier avec distributions */}
          {uniqueDistributions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Distributions prévues</h4>
              <div className="space-y-2">
                {uniqueDistributions.slice(0, 5).map((distribution) => {
                  const distDate = distribution.completedAt
                    ? new Date(distribution.completedAt)
                    : distribution.createdAt
                    ? new Date(distribution.createdAt)
                    : null;
                  return (
                    <div
                      key={distribution._id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <i className="ri-money-dollar-circle-line text-emerald-600" />
                        <div>
                          <p className="font-medium text-slate-900">
                            Tour #{distribution.turn} — Cycle {distribution.cycleNumber || 1}
                          </p>
                          {distDate && (
                            <p className="text-xs text-slate-500">
                              {distDate.toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {distribution.amount?.toLocaleString("fr-FR")} dh
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            distribution.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {distribution.status === "completed" ? "Distribuée" : "En attente"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Fiabilité des membres */}
      {group.members?.length > 0 && activeSection === "members" && (
        <section id="members" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Membres & fiabilité</h3>
          <p className="text-xs text-slate-500">
            Ces scores proviennent de Tirelire et évoluent avec l'historique de paiement de chaque membre.
          </p>
          <div className="mt-4 space-y-2">
            {group.members.map((member) => {
              const memberId = getEntityId(member) || member?.email || member?.name;
              const score = typeof member.score === "number" ? member.score : null;
              const badge = getReliabilityBadge(score);
              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{getDisplayName(member) || member.email || "Membre"}</p>
                    {member.email && <p className="text-xs text-slate-500">{member.email}</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                    {score !== null ? `${score} pts` : badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tickets & Support */}
      {activeSection === "tickets" && (
        <section id="tickets" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Tickets & Support</h3>
              <p className="text-xs text-slate-500">
                Ouvrez un ticket pour signaler un problème ou poser une question concernant ce groupe.
              </p>
            </div>
            <Button
              onClick={() => setShowTicketForm(!showTicketForm)}
              variant={showTicketForm ? "secondary" : "primary"}
            >
              {showTicketForm ? "Annuler" : "+ Ouvrir un ticket"}
            </Button>
          </div>

          {showTicketForm && (
            <form onSubmit={handleCreateTicket} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sujet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Ex: Retard de paiement, problème technique..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Décrivez votre problème ou votre question en détail..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowTicketForm(false);
                      setTicketSubject("");
                      setTicketDescription("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createTicketMutation.isLoading}>
                    {createTicketMutation.isLoading ? "Création..." : "Créer le ticket"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {ticketsLoading ? (
            <p className="text-sm text-slate-500">Chargement des tickets...</p>
          ) : ticketsData?.tickets?.length > 0 ? (
            <div className="space-y-2">
              {ticketsData.tickets.map((ticket) => {
                const statusLabels = {
                  open: { label: "Ouvert", className: "bg-blue-100 text-blue-700" },
                  pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
                  resolved: { label: "Résolu", className: "bg-emerald-100 text-emerald-700" },
                  closed: { label: "Fermé", className: "bg-slate-100 text-slate-600" },
                };
                const statusDisplay = statusLabels[ticket.status] || statusLabels.open;
                const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;

                return (
                  <div
                    key={ticket._id}
                    className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{ticket.subject}</h4>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusDisplay.className}`}
                          >
                            {statusDisplay.label}
                          </span>
                        </div>
                        {ticket.description && (
                          <p className="text-slate-600 mb-2">{ticket.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Par {ticket.user?.name || ticket.user?.email || "Utilisateur"}
                          </span>
                          {createdAt && (
                            <span>
                              {createdAt.toLocaleDateString("fr-FR")} à{" "}
                              {createdAt.toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {ticket.assignedTo && (
                            <span>
                              Assigné à {ticket.assignedTo.name || ticket.assignedTo.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">
                Aucun ticket pour ce groupe. Ouvrez un ticket si vous avez besoin d'aide.
              </p>
            </div>
          )}
        </section>
      )}



      {/* Messagerie du groupe */}
      {activeSection === "chat" && (
      <section id="chat" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Messagerie du groupe</h3>
            <p className="text-xs text-slate-500">Espace d'échange entre les membres (texte & audio).</p>
          </div>
          {messageSentFeedback && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800 flex items-center gap-2">
              <i className="ri-check-line text-emerald-600" />
              <span className="font-semibold">Message envoyé avec succès</span>
            </div>
          )}
          {newMessageNotification && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800 flex items-center justify-between gap-2 animate-pulse">
              <div className="flex items-center gap-2">
                <i className="ri-message-3-line text-blue-600" />
                <span>
                  <span className="font-semibold">{newMessageNotification.sender}</span> a envoyé un message
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNewMessageNotification(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <i className="ri-close-line" />
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl bg-gradient-to-b from-slate-50 to-white p-4 chat-scroll">
            {messagesLoading ? (
              <p className="text-xs text-slate-500">Chargement de la messagerie…</p>
            ) : orderedGroupMessages.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun message pour le moment. Lancez la conversation !</p>
            ) : (
              orderedGroupMessages.map((message) => {
                const sender = message.user || {};
                const senderId =
                  getEntityId(sender) ||
                  getEntityId(message.userId) ||
                  (typeof message.user === "string" ? message.user : null) ||
                  (typeof message.userId === "string" ? message.userId : null);
                const senderIdString = senderId ? senderId.toString() : null;
                const senderEmail =
                  (sender.email || message.email || message.userEmail || "").toString().toLowerCase();
                const isMine =
                  (currentUserId && senderIdString === currentUserId) ||
                  (!!currentUserEmail && senderEmail === currentUserEmail);
                const memberFromMap =
                  (senderIdString ? memberMap.get(senderIdString) : null) ||
                  (senderEmail ? members.find((m) => (m.email || "").toLowerCase() === senderEmail) : null);
                const baseDisplayName =
                  getDisplayName({
                  name: sender?.name || message.userName,
                  firstName: sender?.firstName || message.firstName,
                  lastName: sender?.lastName || message.lastName,
                  email: sender?.email || message.email || message.userEmail,
                  }) ||
                  getDisplayName(memberFromMap);
                const senderLabel = isMine ? "Vous" : baseDisplayName || "Membre";
                const initials = getInitials(senderLabel);
                const createdAt = message.createdAt ? new Date(message.createdAt) : null;
               
                const audioUrl = message.type === "audio" 
                  ? (audioBlobUrls.get(message._id) || null)
                  : null;
              
                const audioPath = message.audioPath || message.audioUrl || "";
                const audioMimeType = getAudioMimeType(audioPath);
                const textContent = message.content || message.text || "";
                const memberColor = getColorForMember(senderId);

                return (
                  <div
                    key={message._id}
                    className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${
                        isMine ? "bg-emerald-600" : memberColor
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="flex max-w-[80%] flex-col gap-1">
                      <div
                        className={`max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isMine
                            ? "rounded-br-sm bg-emerald-600 text-white"
                            : "rounded-bl-sm bg-white text-slate-800 border border-slate-100"
                        }`}
                      >
                        {message.type === "audio" ? (
                          audioUrl ? (
                            <div className="flex items-center gap-2">
                              <i className={`ri-mic-line text-base ${
                                isMine ? "text-emerald-200" : "text-slate-500"
                              }`} />
                              <audio 
                                controls 
                                className="flex-1 h-8 accent-emerald-600"
                                crossOrigin="anonymous"
                              >
                                <source src={audioUrl} type={audioMimeType} />
                                <source src={audioUrl} type="audio/ogg" />
                                <source src={audioUrl} type="audio/mp4" />
                                <source src={audioUrl} type="audio/mpeg" />
                                <source src={audioUrl} type="audio/webm" />
                                Votre navigateur ne supporte pas la lecture audio.
                              </audio>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <i className={`ri-mic-line text-base ${
                                isMine ? "text-emerald-200" : "text-slate-500"
                              }`} />
                              <div className="flex items-center gap-2 flex-1">
                                <span className="flex h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></span>
                                <span className={`text-xs ${
                                  isMine ? "text-emerald-200" : "text-slate-500"
                                }`}>
                                  Chargement...
                                </span>
                              </div>
                            </div>
                          )
                        ) : (
                          textContent || "—"
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-2 text-[11px] uppercase tracking-wide ${
                          isMine ? "justify-end text-emerald-300" : "justify-start text-slate-400"
                        }`}
                      >
                        <span className="font-semibold">{senderLabel}</span>
                        {createdAt && (
                          <span>
                            {createdAt.toLocaleDateString("fr-FR")} •{" "}
                            {createdAt.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendGroupMessage} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Écrire un message aux membres…"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap items-center gap-3">
              {!isRecording && !audioFile && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors"
                >
                  <i className="ri-mic-line text-sm" aria-hidden="true" />
                  <span>Enregistrer un audio</span>
                </button>
              )}
              
              {isRecording && (
                <div className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-red-600"></span>
                  <span>Enregistrement en cours...</span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-white hover:bg-red-700 transition-colors"
                  >
                    Arrêter
                  </button>
                </div>
              )}
              
              {audioFile && !isRecording && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
                    {audioFile.name || "Audio enregistré"}
                    <button
                      type="button"
                      onClick={() => {
                        clearAudioAttachment();
                        clearRecordedAudio();
                      }}
                      className="text-emerald-700 hover:text-emerald-900"
                    >
                      ✕
                    </button>
                  </span>
                  {audioUrl && (
                    <audio controls className="h-8 accent-emerald-600">
                      <source src={audioUrl} type={audioFile.type || "audio/webm"} />
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                  )}
                </div>
              )}
              
              <span className="text-xs text-slate-400">
                {isRecording
                  ? "Cliquez sur 'Arrêter' pour terminer l'enregistrement"
                  : "Enregistrez un message vocal directement depuis votre microphone"}
              </span>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={sendMessageMutation.isLoading}>
                {sendMessageMutation.isLoading ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </form>
        </div>
        </section>
      )}

      {/* Mes contributions */}
      {activeSection === "my-contributions" && (
        <section id="my-contributions" className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Mes contributions</h3>
          {myContributions.length > 0 ? (
            <div className="space-y-2">
              {myContributions.map((contribution) => {
              const isPending = contribution.status ? contribution.status === "pending" : !contribution.paid;
              const isCancelled = contribution.status === "cancelled";

              return (
              <div
                key={contribution._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {contribution.amount?.toLocaleString("fr-FR")} dh
                  </p>
                  <p className="text-xs text-slate-500">
                    Échéance: {new Date(contribution.dueDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {contribution.paid ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Payée
                    </span>
                  ) : isCancelled ? (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                      Annulée
                    </span>
                  ) : (
                    <>
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                        En attente
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handlePay(contribution._id)}
                        disabled={payMutation.isLoading}
                      >
                        Payer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(contribution._id)}
                        disabled={cancelContributionMutation.isLoading}
                      >
                        Annuler
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
            })}
          </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <i className="ri-wallet-line text-4xl text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-600 mb-1">Aucune contribution</p>
              <p className="text-xs text-slate-500">
                Vous n'avez pas encore de contributions pour ce groupe.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Toutes les contributions du groupe */}
      {contributions.length > 0 && activeSection === "all-contributions" && (
        <section id="all-contributions" className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Toutes les contributions</h3>
          <div className="space-y-2">
            {contributions.map((contribution) => {
              const statusLabel = contribution.status || (contribution.paid ? "paid" : "pending");
              const statusDisplay =
                statusLabel === "paid"
                  ? { text: "Payée", className: "bg-green-100 text-green-700" }
                  : statusLabel === "cancelled"
                  ? { text: "Annulée", className: "bg-slate-200 text-slate-600" }
                  : { text: "En attente", className: "bg-yellow-100 text-yellow-700" };

              return (
              <div
                key={contribution._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {contribution.user?.name || contribution.user?.email || "Membre"}
                  </p>
                  <p className="text-slate-600">
                    {contribution.amount?.toLocaleString("fr-FR")} dh
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${statusDisplay.className}`}
                >
                  {statusDisplay.text}
                </span>
              </div>
            );
            })}
          </div>
        </section>
      )}

      {/* Historique des distributions */}
      {uniqueDistributions.length > 0 && activeSection === "distributions" && (
        <section id="distributions" className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Historique des distributions</h3>
          <div className="space-y-2">
            {uniqueDistributions.map((distribution) => (
              <div
                key={distribution._id}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">
                      Tour #{distribution.turn} — Cycle {distribution.cycleNumber || 1}
                    </p>
                    <p className="text-slate-600">
                      Bénéficiaire : {distribution.beneficiary?.name || distribution.beneficiary?.email || "Membre"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {distribution.amount?.toLocaleString("fr-FR")} dh
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        distribution.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : distribution.status === "processing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {distribution.status === "completed"
                        ? "Distribuée"
                        : distribution.status === "processing"
                        ? "En cours"
                        : "En attente"}
                    </span>
                  </div>
                </div>
                {distribution.completedAt && (
                  <p className="mt-2 text-xs text-slate-500">
                    Complétée le {new Date(distribution.completedAt).toLocaleDateString("fr-FR")} à{" "}
                    {new Date(distribution.completedAt).toLocaleTimeString("fr-FR")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

