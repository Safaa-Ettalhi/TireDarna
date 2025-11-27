import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { getPendingProperties, updatePropertyStatus } from "../../services/adminService";

const STATUS_OPTIONS = [
  { value: "published", label: "Publier" },
  { value: "rejected", label: "Rejeter" },
  { value: "archived", label: "Archiver" },
  { value: "pending_moderation", label: "Remettre en attente" },
];

export default function AdminModerationPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState({});
  const [statuses, setStatuses] = useState({});

  const pendingQuery = useQuery({
    queryKey: ["admin-pending-properties", token],
    queryFn: () => getPendingProperties(token),
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: ({ propertyId, payload }) => updatePropertyStatus(token, propertyId, payload),
    onSuccess: () => {
      pendingQuery.refetch();
    },
  });

  const filtered = useMemo(() => {
    const list = pendingQuery.data?.properties ?? [];
    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter((item) => {
      return (
        item.title?.toLowerCase().includes(term) ||
        item.ownerId?.email?.toLowerCase().includes(term) ||
        item.ownerId?.firstName?.toLowerCase().includes(term)
      );
    });
  }, [pendingQuery.data?.properties, search]);

  function handleNoteChange(id, value) {
    setNotes((prev) => ({ ...prev, [id]: value }));
  }

  function handleStatusChange(id, value) {
    setStatuses((prev) => ({ ...prev, [id]: value }));
  }

  function handleAction(propertyId) {
    const status = statuses[propertyId] || "published";
    const note = notes[propertyId] || "";
    updateMutation.mutate({ propertyId, payload: { status, note } });
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Connectez-vous avec un compte administrateur pour accéder à la modération.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Modération</p>
        <h1 className="text-3xl font-semibold text-slate-900">Annonces en attente</h1>
        <p className="text-sm text-slate-500">Validez, rejetez ou archivez les contenus soumis par les annonceurs.</p>
      </header>

      {updateMutation.isError && (
        <Alert
          variant="error"
          title="Action impossible"
          message={updateMutation.error?.message ?? "Une erreur est survenue lors de la mise à jour du statut."}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="w-full text-sm text-slate-500 sm:max-w-sm">
            <span className="font-semibold text-slate-700">Recherche</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titre, propriétaire, email"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <p className="text-xs text-slate-500">{filtered.length} annonce(s) en attente</p>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-700">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Annonce</th>
                <th className="px-4 py-3">Propriétaire</th>
                <th className="px-4 py-3 w-48">Note modération</th>
                <th className="px-4 py-3 w-40">Statut</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    Chargement des annonces en attente...
                  </td>
                </tr>
              )}
              {!pendingQuery.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    Aucune annonce ne correspond aux critères.
                  </td>
                </tr>
              )}
              {filtered.map((property) => (
                <tr key={property._id} className="bg-white">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{property.title}</p>
                    <p className="text-xs text-slate-500">{property.address}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">
                      {property.ownerId?.firstName} {property.ownerId?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{property.ownerId?.email}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <textarea
                      value={notes[property._id] || ""}
                      onChange={(event) => handleNoteChange(property._id, event.target.value)}
                      placeholder="Optionnel : motif du rejet ou remarque"
                      className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <select
                      value={statuses[property._id] || "published"}
                      onChange={(event) => handleStatusChange(property._id, event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <Button
                      size="sm"
                      onClick={() => handleAction(property._id)}
                      disabled={updateMutation.isLoading}
                    >
                      Valider
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

