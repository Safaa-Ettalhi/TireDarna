import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMyTickets } from "../../services/supportService";

const STATUS_LABELS = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Clos",
};

const STATUS_STYLES = {
  open: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-yellow-200 bg-yellow-50 text-yellow-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border-slate-200 bg-slate-50 text-slate-600",
};

const PRIORITY_LABELS = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

const PRIORITY_STYLES = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  normal: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  urgent: "border-red-200 bg-red-50 text-red-700",
};

function StatusBadge({ status }) {
  if (!status) return null;
  const label = STATUS_LABELS[status] || status;
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
  const label = PRIORITY_LABELS[priority] || priority;
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

export default function MyTicketsPage() {
  const { token } = useAuth();

  const ticketsQuery = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => getMyTickets(token),
    enabled: Boolean(token),
  });

  const tickets = ticketsQuery.data?.tickets ?? [];

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <Link
        to="/support"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        <span aria-hidden="true">←</span> Retour au support
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Mes tickets</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Suivi de mes demandes</h1>
        <p className="mt-3 text-slate-600">
          Consultez l'état de vos tickets de support et les réponses de notre équipe.
        </p>
      </div>

      {ticketsQuery.isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!ticketsQuery.isLoading && tickets.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-4 text-lg font-semibold text-slate-900">Aucun ticket pour le moment</p>
          <p className="mt-2 text-sm text-slate-600">
            Vous n'avez pas encore soumis de demande de support.
          </p>
          <Link
            to="/support"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Créer un ticket
          </Link>
        </div>
      )}

      {!ticketsQuery.isLoading && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <article
              key={ticket._id || ticket.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{ticket.subject}</h3>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <p className="text-sm text-slate-600">
                    Catégorie: <span className="font-semibold">{ticket.category || "Autre"}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Créé le {new Date(ticket.createdAt).toLocaleString("fr-FR")}
                    {ticket.assignedTo && (
                      <> · Assigné à {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">Message initial</p>
                <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{ticket.message}</p>
              </div>

              {ticket.responses && ticket.responses.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Réponses de l'équipe ({ticket.responses.length})
                  </p>
                  {ticket.responses.map((response, idx) => {
                    const authorName = response.author
                      ? `${response.author.firstName || ""} ${response.author.lastName || ""}`.trim() || "Équipe support"
                      : "Équipe support";
                    return (
                      <div key={idx} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-emerald-900">{authorName}</p>
                            <p className="text-xs text-emerald-700">
                              {response.createdAt
                                ? new Date(response.createdAt).toLocaleString("fr-FR")
                                : "Récemment"}
                            </p>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                          {response.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {ticket.status === "open" || ticket.status === "in_progress" ? (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-800">
                    ⏳ Votre demande est en cours de traitement. Nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>
              ) : ticket.status === "resolved" ? (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-semibold text-emerald-800">
                    ✓ Votre demande a été résolue. Si vous avez d'autres questions, n'hésitez pas à créer un nouveau ticket.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-800">
                    ✓ Ce ticket est fermé.
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

