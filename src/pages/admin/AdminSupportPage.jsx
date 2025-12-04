import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../context/RealtimeContext";
import { getAdminTickets, updateSupportTicket } from "../../services/supportService";
import { Button } from "../../components/ui/Button";

const STATUS = [
  { value: "", label: "Tous les statuts" },
  { value: "open", label: "Ouvert" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved", label: "Résolu" },
  { value: "closed", label: "Clos" },
];

const PRIORITIES = [
  { value: "", label: "Toutes priorités" },
  { value: "low", label: "Basse" },
  { value: "normal", label: "Normale" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgente" },
];

const STATUS_STYLES = {
  open: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-yellow-200 bg-yellow-50 text-yellow-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border-slate-200 bg-slate-50 text-slate-600",
};

const PRIORITY_STYLES = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  normal: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  urgent: "border-red-200 bg-red-50 text-red-700",
};

function StatusBadge({ status }) {
  if (!status) return null;
  const label = STATUS.find((item) => item.value === status)?.label ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  if (!priority) return null;
  const label = PRIORITIES.find((item) => item.value === priority)?.label ?? priority;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        PRIORITY_STYLES[priority] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

function TicketModal({ ticket, onClose, onUpdate, currentUser }) {
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ticket) return null;

  const handleAddResponse = async () => {
    if (!responseMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const ticketId = ticket._id || ticket.id;
      await onUpdate(ticketId, { responseMessage: responseMessage.trim() });
      setResponseMessage("");
    } catch (error) {
      console.error("Error adding response", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{ticket.subject}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {ticket.email} • {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Statut:</label>
              <select
                value={ticket.status}
                onChange={(e) => onUpdate(ticket._id || ticket.id, { status: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              >
                {STATUS.filter((s) => s.value).map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Priorité:</label>
              <select
                value={ticket.priority}
                onChange={(e) => onUpdate(ticket._id || ticket.id, { priority: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              >
                {PRIORITIES.filter((p) => p.value).map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
            {ticket.category && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {ticket.category}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Message initial</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{ticket.message}</p>
          </div>

          {ticket.responses && ticket.responses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Historique des réponses ({ticket.responses.length})</h3>
              <div className="space-y-3">
                {ticket.responses.map((response, idx) => {
                  const authorName = response.author
                    ? `${response.author.firstName || ""} ${response.author.lastName || ""}`.trim() || "Admin"
                    : "Admin";
                  return (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{authorName}</p>
                          <p className="text-xs text-slate-500">
                            {response.createdAt ? new Date(response.createdAt).toLocaleString() : "Récemment"}
                          </p>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{response.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Ajouter une réponse</h3>
            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              placeholder="Tapez votre réponse..."
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Fermer
              </Button>
              <Button onClick={handleAddResponse} disabled={!responseMessage.trim() || isSubmitting}>
                {isSubmitting ? "Envoi..." : "Envoyer la réponse"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  const { token, user } = useAuth();
  const { socket } = useRealtime();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });
  const [selectedTicket, setSelectedTicket] = useState(null);

  const ticketsQuery = useQuery({
    queryKey: ["admin-support", filters],
    queryFn: () => getAdminTickets(token, filters),
    enabled: Boolean(token),
  });

  // Écouter les événements Socket.IO pour les mises à jour en temps réel
  useEffect(() => {
    if (!socket) return;

    const handleTicketCreated = (data) => {
      console.log("Socket: ticket_created", data);
      queryClient.invalidateQueries({ queryKey: ["admin-support"] });
    };

    const handleTicketUpdated = (data) => {
      console.log("Socket: ticket_updated", data);
      if (!data?.ticket) return;

      const updatedTicketId = data.ticket._id || data.ticket.id;

      // Mettre à jour le cache directement
      queryClient.setQueryData(["admin-support", filters], (oldData) => {
        if (!oldData?.tickets) return oldData;
        return {
          ...oldData,
          tickets: oldData.tickets.map((t) => {
            const ticketId = t._id || t.id;
            return ticketId === updatedTicketId ? { ...t, ...data.ticket } : t;
          }),
        };
      });

      // Mettre à jour le ticket sélectionné si c'est celui qui a été modifié
      if (selectedTicket) {
        const selectedTicketId = selectedTicket._id || selectedTicket.id;
        if (selectedTicketId === updatedTicketId) {
          setSelectedTicket(data.ticket);
        }
      }
    };

    socket.on("ticket_created", handleTicketCreated);
    socket.on("ticket_updated", handleTicketUpdated);

    return () => {
      socket.off("ticket_created", handleTicketCreated);
      socket.off("ticket_updated", handleTicketUpdated);
    };
  }, [socket, queryClient, selectedTicket, filters]);

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => updateSupportTicket(token, id, payload),
    onMutate: async ({ id, payload }) => {
      // Annuler les queries en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: ["admin-support", filters] });

      // Snapshot de la valeur précédente
      const previousTickets = queryClient.getQueryData(["admin-support", filters]);

      // Mise à jour optimiste
      queryClient.setQueryData(["admin-support", filters], (old) => {
        if (!old?.tickets) return old;
        return {
          ...old,
          tickets: old.tickets.map((t) => {
            const ticketId = t._id || t.id;
            return ticketId === id ? { ...t, ...payload } : t;
          }),
        };
      });

      // Mettre à jour le ticket sélectionné optimistiquement
      if (selectedTicket) {
        const selectedTicketId = selectedTicket._id || selectedTicket.id;
        if (selectedTicketId === id) {
          setSelectedTicket((prev) => (prev ? { ...prev, ...payload } : prev));
        }
      }

      return { previousTickets };
    },
    onError: (err, variables, context) => {
      // En cas d'erreur, restaurer les données précédentes
      if (context?.previousTickets) {
        queryClient.setQueryData(["admin-support", filters], context.previousTickets);
      }
    },
    onSuccess: (data, variables) => {
      // Mettre à jour avec les vraies données du serveur
      if (data?.ticket) {
        const updatedTicketId = data.ticket._id || data.ticket.id;
        queryClient.setQueryData(["admin-support", filters], (old) => {
          if (!old?.tickets) return old;
          return {
            ...old,
            tickets: old.tickets.map((t) => {
              const ticketId = t._id || t.id;
              return ticketId === variables.id || ticketId === updatedTicketId ? data.ticket : t;
            }),
          };
        });

        if (selectedTicket) {
          const selectedTicketId = selectedTicket._id || selectedTicket.id;
          if (selectedTicketId === variables.id || selectedTicketId === updatedTicketId) {
            setSelectedTicket(data.ticket);
          }
        }
      }
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (ticketId, payload) => {
    try {
      const result = await mutation.mutateAsync({ id: ticketId, payload });
      if (selectedTicket) {
        const selectedTicketId = selectedTicket._id || selectedTicket.id;
        if (selectedTicketId === ticketId && result?.ticket) {
          setSelectedTicket(result.ticket);
        }
      }
      return result;
    } catch (error) {
      console.error("Error updating ticket:", error);
      throw error;
    }
  };

  const tickets = ticketsQuery.data?.tickets ?? [];
  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
    };
  }, [tickets]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50/40 to-slate-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Support</p>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tickets utilisateurs</h1>
            <p className="mt-2 text-sm text-slate-600">
              Priorisez les remontées critiques, suivez les réponses et assignez-vous les demandes sensibles.
            </p>
          </div>
          <div className="ml-auto flex gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Réponse moyenne &lt; 2h
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              95% tickets résolus
            </span>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tickets ouverts" value={stats.open} accent="text-blue-600 border-blue-200 bg-blue-50" />
        <StatCard label="En cours" value={stats.inProgress} accent="text-yellow-600 border-yellow-200 bg-yellow-50" />
        <StatCard label="Urgents" value={stats.urgent} accent="text-red-600 border-red-200 bg-red-50" />
        <StatCard label="Total file" value={stats.total} accent="text-slate-700 border-slate-200 bg-slate-50" />
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="search"
            name="search"
            placeholder="Rechercher par email ou sujet"
            value={filters.search}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            {STATUS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            name="priority"
            value={filters.priority}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            {PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {ticketsQuery.isLoading && <SkeletonList />}

          {!ticketsQuery.isLoading && tickets.length > 0 && (
            <ol className="space-y-4">
              {tickets.map((ticket) => (
                <li key={ticket._id}>
                  <article className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5 shadow-sm transition hover:border-emerald-200 hover:bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                        <p className="text-xs text-slate-500">
                          {ticket.email} · {new Date(ticket.createdAt).toLocaleString()}
                        </p>
                        {ticket.user && (
                          <p className="text-xs text-slate-400">
                            Client : {ticket.user.firstName} {ticket.user.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </div>

                    <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
                      {ticket.message}
                    </p>

                    <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                      <MetaItem label="Assigné à" value={ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : "Non assigné"} />
                      <MetaItem label="Catégorie" value={ticket.category ?? "—"} />
                      <MetaItem label="Réponses" value={`${ticket.responses?.length ?? 0}`} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <select
                        value={ticket.status}
                        onChange={(event) => mutation.mutate({ id: ticket._id || ticket.id, payload: { status: event.target.value } })}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        {STATUS.filter((s) => s.value).map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={ticket.priority}
                        onChange={(event) => mutation.mutate({ id: ticket._id || ticket.id, payload: { priority: event.target.value } })}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        {PRIORITIES.filter((p) => p.value).map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="secondary"
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-xs px-3 py-1.5"
                      >
                        Voir détails
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() =>
                          mutation.mutate({
                            id: ticket._id || ticket.id,
                            payload: { assignedTo: ticket.assignedTo?._id || user?._id },
                          })
                        }
                      >
                        {ticket.assignedTo ? `Réassigner à ${ticket.assignedTo.firstName}` : "M'assigner"}
                      </Button>
                      <Button variant="secondary" onClick={() => mutation.mutate({ id: ticket._id || ticket.id, payload: { status: "resolved" } })}>
                        Clore rapidement
                      </Button>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          )}

          {!ticketsQuery.isLoading && !tickets.length && <EmptyState />}
        </div>
      </div>

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleUpdate}
          currentUser={user}
        />
      )}
    </section>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <article className={`rounded-3xl border bg-white p-4 shadow-sm ${accent ?? "border-slate-200"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="animate-pulse rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="mt-2 h-2 w-2/3 rounded bg-slate-100" />
          <div className="mt-4 h-16 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-4xl">🎯</p>
      <p className="mt-3 text-sm font-semibold text-slate-900">Aucun ticket ne correspond aux filtres.</p>
      <p className="text-xs text-slate-500">Ajustez les filtres pour retrouver vos demandes archivées.</p>
    </div>
  );
}
