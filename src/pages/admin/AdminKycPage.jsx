import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { getKycRequests, updateKycStatus } from "../../services/adminService";

export default function AdminKycPage() {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState({});

  const requestsQuery = useQuery({
    queryKey: ["admin-kyc", token, statusFilter],
    queryFn: () => getKycRequests(token, { status: statusFilter }),
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, status, note }) => updateKycStatus(token, userId, { status, note }),
    onSuccess: () => {
      requestsQuery.refetch();
    },
  });

  const requests = useMemo(() => {
    const list = requestsQuery.data?.requests ?? [];
    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter((item) => {
      return (
        item.company?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        `${item.firstName} ${item.lastName}`.toLowerCase().includes(term)
      );
    });
  }, [requestsQuery.data?.requests, search]);

  function handleNoteChange(id, value) {
    setNotes((prev) => ({ ...prev, [id]: value }));
  }

  function handleDecision(id, decision) {
    updateMutation.mutate({
      userId: id,
      status: decision,
      note: notes[id] || "",
    });
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Connectez-vous avec un compte administrateur pour accéder aux validations KYC.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Validation KYC</p>
        <h1 className="text-3xl font-semibold text-slate-900">Entreprises en attente</h1>
        <p className="text-sm text-slate-500">
          Contrôlez les justificatifs et validez les professionnels avant publication d’offres massives.
        </p>
      </header>

      {updateMutation.isError && (
        <Alert
          variant="error"
          title="Action impossible"
          message={updateMutation.error?.message ?? "Une erreur est survenue lors de la mise à jour du dossier."}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Filtrer par statut</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
            </select>
          </label>
          <label className="flex flex-col text-sm text-slate-500 md:col-span-2">
            <span className="font-semibold text-slate-700">Recherche</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Société, email, contact"
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-700">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Note interne</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requestsQuery.isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Chargement des dossiers KYC...
                  </td>
                </tr>
              )}
              {!requestsQuery.isLoading && requests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Aucun dossier à afficher.
                  </td>
                </tr>
              )}
              {requests.map((request) => (
                <tr key={request.id} className="bg-white">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{request.company || "Non renseigné"}</p>
                    <p className="text-xs text-slate-500">SIRET : {request.siret || "—"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">
                      {request.firstName} {request.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{request.email}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <textarea
                      value={notes[request.id] ?? request.kycNote ?? ""}
                      onChange={(event) => handleNoteChange(request.id, event.target.value)}
                      placeholder="Note ou motif interne"
                      className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDecision(request.id, "approved")}
                        disabled={updateMutation.isLoading}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDecision(request.id, "rejected")}
                        disabled={updateMutation.isLoading}
                      >
                        Rejeter
                      </Button>
                    </div>
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

