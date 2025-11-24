import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  getAllAvailableTirelireGroups,
  joinTirelireGroup,
} from "../../services/tirelireService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function AllTirelireGroupsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["availableTirelireGroups", token],
    queryFn: () => getAllAvailableTirelireGroups(token),
    enabled: !!token,
    retry: 1,
    onError: (err) => {
      console.error("Erreur lors du chargement des groupes disponibles:", err);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (groupId) => joinTirelireGroup(token, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(["availableTirelireGroups"]);
      queryClient.invalidateQueries(["tirelireGroups"]);
      alert("Vous avez rejoint le groupe avec succès !");
    },
    onError: (err) => {
      alert(`Erreur: ${err.message}`);
    },
  });

  const groups = data?.groups || [];

  const handleJoin = (groupId) => {
    if (window.confirm("Êtes-vous sûr de vouloir rejoindre ce groupe ?")) {
      joinMutation.mutate(groupId);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Chargement des groupes disponibles...</p>;
  }

  if (isError) {
    const errorMessage = error.message || "Impossible de charger les groupes disponibles.";
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
          <h2 className="text-lg font-semibold text-slate-900">Groupes disponibles</h2>
          <p className="mt-1 text-sm text-slate-500">
            Découvrez et rejoignez des groupes d'épargne collective pour financer votre projet immobilier.
          </p>
        </div>
      </div>

      {/* Liste de tous les groupes disponibles */}
      {groups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard 
              key={group._id} 
              group={group} 
              onJoin={handleJoin}
              showJoinButton={true}
              isMember={false}
            />
          ))}
        </div>
      )}

      {groups.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">
            Aucun groupe disponible pour le moment. Créez-en un pour commencer !
          </p>
        </div>
      )}
    </div>
  );
}

function GroupCard({ group, onJoin, showJoinButton = false, isMember = false }) {
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
          {group.owner && (
            <p className="mt-1 text-xs text-slate-500">
              Créé par {group.owner.name || group.owner.email}
            </p>
          )}
        </div>
      </div>

      {group.description && (
        <p className="mb-3 text-sm text-slate-600 line-clamp-2">
          {group.description}
        </p>
      )}

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

      {/* Bouton Rejoindre */}
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

