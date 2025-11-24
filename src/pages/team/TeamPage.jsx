import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile, addTeamMember, removeTeamMember } from "../../services/authService";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { Alert } from "../../components/ui/Alert";

export default function TeamPage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["teamProfile", token],
    queryFn: () => fetchProfile(token),
    enabled: !!token && user?.role === "entreprise",
  });

  const companyId = user?._id || user?.id;
  const members = profileData?.user?.members || [];


  if (members.length > 0 && process.env.NODE_ENV === 'development') {
    console.log('Members data:', members);
  }

  const addMemberMutation = useMutation({
    mutationFn: ({ memberEmail }) => addTeamMember(token, { companyId, memberEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamProfile", token] });
      queryClient.invalidateQueries({ queryKey: ["dashboardProfile", token] });
      setMemberEmail("");
      setShowAddForm(false);
      alert("Membre ajouté avec succès !");
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || "Impossible d'ajouter le membre";
      alert(`Erreur: ${errorMessage}`);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ memberUserId }) => removeTeamMember(token, { companyId, memberUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamProfile", token] });
      alert("Membre retiré avec succès !");
    },
    onError: (error) => {
      alert(`Erreur: ${error.message || "Impossible de retirer le membre"}`);
    },
  });

  function handleAddMember(event) {
    event.preventDefault();
    if (!memberEmail.trim()) {
      alert("Veuillez entrer un email");
      return;
    }

    // Vérifier que l'email n'est pas déjà dans l'équipe
    const emailLower = memberEmail.toLowerCase().trim();
    const isAlreadyMember = members.some(
      (m) => m.email?.toLowerCase() === emailLower
    );
    
    if (isAlreadyMember) {
      alert("Cet utilisateur fait déjà partie de votre équipe");
      return;
    }

    // Ajouter le membre par email
    addMemberMutation.mutate({ memberEmail: emailLower });
  }

  function handleRemoveMember(memberId) {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?")) {
      return;
    }
    removeMemberMutation.mutate({ memberUserId: memberId });
  }

  function handleViewMemberDetails(member) {
    setSelectedMember(member);
    setShowMemberDetails(true);
  }

  function handleCloseMemberDetails() {
    setShowMemberDetails(false);
    setSelectedMember(null);
  }

  if (!user || user.role !== "entreprise") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">Cette page est réservée aux comptes entreprise.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    );
  }

  const companyInfo = user.companyInfo || profileData?.user?.companyInfo || {};

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Équipe & membres</h2>
            <p className="mt-1 text-sm text-slate-600">
              Gérez les membres de votre entreprise et leurs accès.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Annuler" : "Ajouter un membre"}
          </Button>
        </div>
      </section>

      {companyInfo.companyName && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Informations entreprise</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nom de l'entreprise
              </p>
              <p className="mt-1 text-sm text-slate-900">{companyInfo.companyName}</p>
            </div>
            {companyInfo.siret && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  SIRET
                </p>
                <p className="mt-1 text-sm text-slate-900">{companyInfo.siret}</p>
              </div>
            )}
            {companyInfo.address && (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Adresse
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {[
                    companyInfo.address.street,
                    companyInfo.address.city,
                    companyInfo.address.postalCode,
                    companyInfo.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Statut KYC
              </p>
              <p className="mt-1">
                {companyInfo.kycVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    <i className="ri-checkbox-circle-line" />
                    Vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    <i className="ri-time-line" />
                    En attente
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {showAddForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Ajouter un membre</h3>
          <form onSubmit={handleAddMember} className="mt-4 space-y-4">
            <TextField
              label="Email du membre"
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="membre@example.com"
              required
            />
            <div className="flex gap-3">
              <Button type="submit" disabled={addMemberMutation.isLoading}>
                {addMemberMutation.isLoading ? "Ajout..." : "Ajouter"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
            </div>
          </form>
          <Alert
            variant="info"
            title="Note"
            message="Pour ajouter un membre, celui-ci doit déjà avoir un compte sur la plateforme avec l'email renseigné. L'utilisateur ne peut appartenir qu'à une seule entreprise à la fois."
          />
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Membres de l'équipe ({members.length})
          </h3>
        </div>
        {members.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Aucun membre dans votre équipe pour le moment.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members
              .filter((member) => member && (member._id || member.id))
              .map((member) => {
                const getFullName = () => {
                  if (member.firstName && member.lastName) {
                    return `${member.firstName} ${member.lastName}`;
                  }
                  if (member.firstName) return member.firstName;
                  if (member.lastName) return member.lastName;
                  if (member.email) return member.email;
                  return "Membre inconnu";
                };

                const getInitials = () => {
                  if (member.firstName && member.lastName) {
                    return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
                  }
                  if (member.firstName) return member.firstName[0].toUpperCase();
                  if (member.lastName) return member.lastName[0].toUpperCase();
                  if (member.email) return member.email[0].toUpperCase();
                  return "M";
                };

                const fullName = getFullName();
                const initials = getInitials();
                const memberId = member._id || member.id;

                return (
                  <div
                    key={memberId}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white shadow-md">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-slate-900 truncate">
                          {fullName}
                        </h4>
                        {member.email && (
                          <p className="mt-1 text-xs text-slate-500 truncate">{member.email}</p>
                        )}
                        {member.phone && (
                          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                            <i className="ri-phone-line" />
                            {member.phone}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMemberDetails(member)}
                            className="text-xs"
                          >
                            <i className="ri-information-line mr-1" />
                            Détails
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(memberId)}
                            disabled={removeMemberMutation.isLoading}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <i className="ri-user-unfollow-line mr-1" />
                            Retirer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Modal des détails du membre */}
      {showMemberDetails && selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseMemberDetails}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Informations du membre</h3>
                <button
                  onClick={handleCloseMemberDetails}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-600"
                >
                  <i className="ri-close-line text-xl" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-bold text-white shadow-lg">
                  {selectedMember.firstName && selectedMember.lastName
                    ? `${selectedMember.firstName[0]}${selectedMember.lastName[0]}`.toUpperCase()
                    : selectedMember.firstName
                    ? selectedMember.firstName[0].toUpperCase()
                    : selectedMember.lastName
                    ? selectedMember.lastName[0].toUpperCase()
                    : selectedMember.email?.[0]?.toUpperCase() || "M"}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {selectedMember.firstName && selectedMember.lastName
                      ? `${selectedMember.firstName} ${selectedMember.lastName}`
                      : selectedMember.firstName
                      ? selectedMember.firstName
                      : selectedMember.lastName
                      ? selectedMember.lastName
                      : selectedMember.email || "Membre"}
                  </h4>
                  {selectedMember.email && (
                    <p className="text-sm text-slate-500">{selectedMember.email}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Prénom
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedMember.firstName || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Nom
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedMember.lastName || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{selectedMember.email}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Téléphone
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedMember.phone || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Type de compte
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900 capitalize">
                    {selectedMember.accountType || "particulier"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Statut
                  </p>
                  <p className="mt-1">
                    {selectedMember.isActive !== false ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        <i className="ri-checkbox-circle-line" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        <i className="ri-close-circle-line" />
                        Inactif
                      </span>
                    )}
                  </p>
                </div>
                {selectedMember.createdAt && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Membre depuis
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {new Date(selectedMember.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button variant="secondary" onClick={handleCloseMemberDetails}>
                  Fermer
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleCloseMemberDetails();
                    handleRemoveMember(selectedMember._id || selectedMember.id);
                  }}
                  disabled={removeMemberMutation.isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <i className="ri-user-unfollow-line mr-1" />
                  Retirer de l'équipe
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

