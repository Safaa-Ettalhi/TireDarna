import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProperty } from "../../services/propertyService";
import { createLead } from "../../services/leadService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { ENV } from "../../config/env";

const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${ENV.API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const STATUS_LABELS = {
  draft: "Brouillon",
  published: "Publié",
  pending_moderation: "En attente",
  rejected: "Rejeté",
  archived: "Archivé",
};

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getProperty(token, id),
    enabled: !!token && !!id,
  });

  const contactMutation = useMutation({
    mutationFn: (message) => createLead(token, id, message),
    onSuccess: () => {
      alert("Votre demande a été envoyée ! Le propriétaire vous contactera bientôt.");
      navigate("/inbox");
    },
    onError: (err) => {
      alert(`Erreur: ${err.message}`);
    },
  });

  const gallery = useMemo(() => {
    if (!data?.property?.media?.length) return [];
    return data.property.media.map((item) => ({
      ...item,
      url: resolveMediaUrl(item.url),
      thumbnailUrl: resolveMediaUrl(item.thumbnailUrl),
    }));
  }, [data?.property]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedMedia = gallery[selectedIndex];

  function selectMedia(index) {
    setSelectedIndex(index);
  }

  function showPrevious() {
    setSelectedIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  }

  function showNext() {
    setSelectedIndex((prev) => (prev + 1) % gallery.length);
  }

  if (!token) {
    return (
      <Alert
        variant="error"
        title="Authentification requise"
        message="Connectez-vous pour consulter cette annonce."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
        Chargement de l'annonce...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Alert
          variant="error"
          title="Annonce inaccessible"
          message={error.message}
        />
        <Button onClick={() => refetch()}>Réessayer</Button>
      </div>
    );
  }

  const property = data?.property;

  if (!property) {
    return (
      <Alert
        variant="error"
        title="Annonce introuvable"
        message="Cette annonce n'existe plus ou a été retirée."
      />
    );
  }

  const ownerId =
    property.ownerId?._id ??
    property.ownerId?.id ??
    (typeof property.ownerId === "string" ? property.ownerId : null);
  const currentUserId = user?.userId ?? user?._id ?? user?.id ?? null;
  const isOwner = ownerId && currentUserId && String(ownerId) === String(currentUserId);

  const statusLabel = STATUS_LABELS[property.status] ?? property.status;
  const cover = gallery[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Retour
        </Button>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          {statusLabel}
        </span>
        {isOwner && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Votre annonce
            </span>
            <Link
              to={`/properties/${property._id}/edit`}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
            >
              Modifier
            </Link>
          </div>
        )}
      </div>

      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <p className="text-xs uppercase text-emerald-600">
            {property.transactionType === "sale" ? "Vente" : "Location"}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">{property.title}</h1>
          <p className="text-sm text-slate-500">{property.address}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            <span>
              <strong>{property.price?.toLocaleString("fr-FR")} dh</strong>
            </span>
            <span>{property.surface} m²</span>
            <span>{property.rooms} pièces</span>
            <span>{property.bathrooms} SDB</span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl bg-slate-100">
              {selectedMedia ? (
                <>
                  <img
                    src={selectedMedia.url || selectedMedia.thumbnailUrl}
                    alt={property.title}
                    className="h-[360px] w-full object-cover transition"
                  />
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPrevious}
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow transition hover:bg-white"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={showNext}
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow transition hover:bg-white"
                      >
                        ›
                      </button>
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                        {selectedIndex + 1} / {gallery.length}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-[360px] items-center justify-center text-sm text-slate-400">
                  Pas d’image pour le moment.
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {gallery.map((media, index) => (
                  <button
                    key={media._id || media.url}
                    type="button"
                    onClick={() => selectMedia(index)}
                    className={`overflow-hidden rounded-lg border transition ${
                      selectedIndex === index
                        ? "border-emerald-400 ring-2 ring-emerald-200"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <img
                      src={media.thumbnailUrl || media.url}
                      alt={media.type}
                      className="h-20 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <h2 className="text-sm font-semibold text-slate-800">Résumé</h2>
            <ul className="space-y-2">
              <li>
                <strong>Disponibilité :</strong>{" "}
                {property.availability?.from
                  ? new Date(property.availability.from).toLocaleDateString("fr-FR")
                  : "N/A"}{" "}
                →{" "}
                {property.availability?.to
                  ? new Date(property.availability.to).toLocaleDateString("fr-FR")
                  : "N/A"}
              </li>
              <li>
                <strong>Priorité :</strong> {property.priorityScore}
              </li>
              <li>
                <strong>Vue(s) :</strong> {property.viewsCount}
              </li>
              <li>
                <strong>Leads :</strong> {property.leadsCount}
              </li>
            </ul>

            <div className="rounded-lg bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-800">Propriétaire</h3>
              <p className="mt-1 text-sm text-slate-600">
                {property.ownerId?.firstName} {property.ownerId?.lastName}
              </p>
              <p className="text-xs text-slate-500">{property.ownerId?.accountType}</p>
            </div>

            {!isOwner && property.status === "published" && (
              <div className="space-y-3 rounded-lg bg-white p-3">
                <Button
                  onClick={() => contactMutation.mutate("")}
                  disabled={contactMutation.isLoading}
                  className="w-full"
                >
                  {contactMutation.isLoading ? "Envoi..." : "Contacter le propriétaire"}
                </Button>
              </div>
            )}

            {property.status === "published" && (
              <div className="rounded-lg bg-white p-3">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Options de financement</h3>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/financing?propertyId=${property._id}&price=${property.price}`)}
                    className="w-full text-xs"
                  >
                    Simuler un crédit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(
                        `/financing/tirelire?propertyId=${property._id}&price=${property.price}`
                      )
                    }
                    className="w-full text-xs"
                  >
                    Créer un groupe Tirelire
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {property.description}
          </p>
        </section>

        {!!property.amenities?.length && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Équipements</h2>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {property.amenities.map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

