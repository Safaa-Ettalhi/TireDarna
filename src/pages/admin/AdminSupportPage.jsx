import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
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

export default function AdminSupportPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });

  const ticketsQuery = useQuery({
    queryKey: ["admin-support", filters],
    queryFn: () => getAdminTickets(token, filters),
    enabled: Boolean(token),
  });

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => updateSupportTicket(token, id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-support"] }),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const tickets = ticketsQuery.data?.tickets ?? [];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Support</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Tickets utilisateurs</h1>
        <p className="mt-2 text-sm text-slate-600">
          Filtrez, suivez et assignez les demandes support reçues depuis la plateforme.
        </p>
      </header>

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
          {tickets.map((ticket) => (
            <article key={ticket._id} className="rounded-2xl border border-slate-100 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                  <p className="text-xs text-slate-500">
                    {ticket.email} — {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <select
                    value={ticket.status}
                    onChange={(event) =>
                      mutation.mutate({ id: ticket._id, payload: { status: event.target.value } })
                    }
                    className="rounded-full border border-slate-200 px-3 py-1 text-slate-700"
                  >
                    {STATUS.filter((s) => s.value).map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={ticket.priority}
                    onChange={(event) =>
                      mutation.mutate({ id: ticket._id, payload: { priority: event.target.value } })
                    }
                    className="rounded-full border border-slate-200 px-3 py-1 text-slate-700"
                  >
                    {PRIORITIES.filter((p) => p.value).map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{ticket.message}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() =>
                    mutation.mutate({
                      id: ticket._id,
                      payload: { assignedTo: ticket.assignedTo?._id || user?._id },
                    })
                  }
                >
                  {ticket.assignedTo ? `Assigné à ${ticket.assignedTo.firstName}` : "M’assigner"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => mutation.mutate({ id: ticket._id, payload: { status: "resolved" } })}
                >
                  Marquer résolu
                </Button>
              </div>
            </article>
          ))}

          {!tickets.length && !ticketsQuery.isLoading && (
            <p className="py-10 text-center text-sm text-slate-500">Aucun ticket ne correspond à ces filtres.</p>
          )}
        </div>
      </div>
    </section>
  );
}

