import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getUsers, updateUser } from "../../services/adminService";
import { Button } from "../../components/ui/Button";

const ROLE_OPTIONS = ["particulier", "entreprise", "admin"];
const ACCOUNT_TYPES = ["particulier", "entreprise", "admin"];
const STATUS_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Inactifs" },
  { value: "blocked", label: "Bloqués" },
];

export default function AdminUsersPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", role: "", accountType: "", status: "" });

  const usersQuery = useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => getUsers(token, filters),
    enabled: Boolean(token),
  });

  const mutation = useMutation({
    mutationFn: ({ userId, payload }) => updateUser(token, userId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const rows = usersQuery.data?.users ?? [];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Utilisateurs</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Gestion des comptes</h1>
        <p className="mt-2 text-sm text-slate-600">
          Recherchez, modifiez les rôles et (dés)activez les comptes directement depuis ce tableau.
        </p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-4">
          <input
            type="search"
            name="search"
            placeholder="Rechercher (nom, email, société)"
            value={filters.search}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Tous les rôles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            name="accountType"
            value={filters.accountType}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            <option value="">Tous les types</option>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((user) => (
                <tr key={user._id} className="whitespace-nowrap">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(event) =>
                        mutation.mutate({ userId: user._id, payload: { role: event.target.value } })
                      }
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.accountType}
                      onChange={(event) =>
                        mutation.mutate({ userId: user._id, payload: { accountType: event.target.value } })
                      }
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                    >
                      {ACCOUNT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.isBlocked
                          ? "bg-rose-100 text-rose-700"
                          : user.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.isBlocked ? "Bloqué" : user.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          mutation.mutate({ userId: user._id, payload: { isActive: !user.isActive } })
                        }
                      >
                        {user.isActive ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          mutation.mutate({ userId: user._id, payload: { isBlocked: !user.isBlocked } })
                        }
                      >
                        {user.isBlocked ? "Débloquer" : "Bloquer"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && !usersQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    Aucun utilisateur ne correspond à ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

