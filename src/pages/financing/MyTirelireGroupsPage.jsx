import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getTirelireGroups,
  joinTirelireGroup,
  getTirelireGroupContributions,
} from "../../services/tirelireService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function MyTirelireGroupsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [joinGroupId, setJoinGroupId] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tirelireGroups", token],
    queryFn: () => getTirelireGroups(token),
    enabled: !!token,
    retry: 1, 
    onError: (err) => {
      console.error("Erreur lors du chargement des groupes Tirelire:", err);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (groupId) => joinTirelireGroup(token, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(["tirelireGroups"]);
      alert("Vous avez rejoint le groupe avec succès !");
      setJoinGroupId("");
    },
    onError: (err) => {
      alert(`Erreur: ${err.message}`);
    },
  });

  const groups = data?.groups || [];
  

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement de vos groupes...</p>;
  }

  if (isError) {
    const errorMessage = error.message || "Impossible de charger vos groupes Tirelire.";
    const isHtmlError = errorMessage.includes("<!doctype") || errorMessage.includes("Unexpected token '<'");
    
    return (
      <Alert
        variant="error"
        title="Erreur de connexion à Tirelire"
        message={
          <div className="space-y-2">
            <p>{errorMessage}</p>
            {isHtmlError && (
              <div className="mt-2 rounded bg-red-50 p-3 text-xs">
                <p className="font-semibold mb-1">Le serveur Tirelire retourne du HTML au lieu de JSON.</p>
                <p className="mb-2">Vérifiez que :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Le serveur Tirelire est démarré sur {import.meta.env.VITE_TIRELIRE_API_URL || "http://localhost:4000"}</li>
                  <li>L'URL dans VITE_TIRELIRE_API_URL est correcte</li>
                  <li>Le serveur répond bien aux requêtes API</li>
                </ul>
              </div>
            )}
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Mes groupes d'épargne</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gérez vos groupes créés et ceux auxquels vous participez.
          </p>
        </div>

      </div>


      {/* Liste de tous mes groupes */}
      {groups.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <GroupCard key={group._id} group={group} />
            ))}
          </div>
        </div>
      )}

      {groups.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">
            Vous n'avez pas encore de groupes d'épargne. Créez-en un pour commencer !
          </p>
        </div>
      )}
    </div>
  );
}

function GroupCard({ group, isOwner, onJoin, isMember, showJoinButton = false }) {
  const progress = group.totalCollected
    ? Math.round((group.totalCollected / group.amount) * 100)
    : 0;

  const handleJoinClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onJoin) {
      onJoin(group._id);
    }
  };

  return (
    <Link
      to={`/financing/tirelire/${group._id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{group.name}</h4>
          {isOwner && (
            <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Créateur
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Montant cible:</span>
          <span className="font-semibold text-slate-900">
            {group.amount?.toLocaleString("fr-FR")} dh
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Fréquence:</span>
          <span className="text-slate-700">
            {group.frequency === "hebdomadaire"
              ? "Hebdomadaire"
              : group.frequency === "mensuel"
              ? "Mensuelle"
              : group.frequency || "Mensuelle"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Membres:</span>
          <span className="text-slate-700">{group.members?.length || 0}</span>
        </div>
      </div>

      {progress > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-slate-600">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Bouton Rejoindre si disponible */}
      {showJoinButton && !isMember && onJoin && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button
            onClick={handleJoinClick}
            className="w-full"
            variant="primary"
          >
            Rejoindre
          </Button>
        </div>
      )}
    </Link>
  );
}

