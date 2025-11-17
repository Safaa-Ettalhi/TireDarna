import { useEffect, useMemo, useState } from "react";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";

const TRANSACTION_OPTIONS = [
  { value: "sale", label: "Vente" },
  { value: "daily_rent", label: "Location journalière" },
  { value: "monthly_rent", label: "Location mensuelle" },
  { value: "seasonal_rent", label: "Location saisonnière" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "pending_moderation", label: "En attente" },
  { value: "published", label: "Publié" },
  { value: "rejected", label: "Rejeté" },
  { value: "archived", label: "Archivé" },
];

const AMENITIES_OPTIONS = [
  "WiFi",
  "Climatisation",
  "Chauffage",
  "Parking",
  "Jardin",
  "Balcon",
  "Ascenseur",
  "Piscine",
  "Salle de sport",
  "Lave-linge",
  "Lave-vaisselle",
  "Télévision",
  "Meublé",
];

export function PropertyForm({
  title,
  description,
  initialValues,
  onSubmit,
  submitLabel = "Enregistrer",
  isSubmitting = false,
  serverError = "",
  allowStatusEdit = false,
  existingMedia = [],
  onRemoveMedia,
}) {
  const [form, setForm] = useState({
    ...initialValues,
    amenities: initialValues?.amenities || [],
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [removingMediaId, setRemovingMediaId] = useState(null);

  useEffect(() => {
    setForm({
      ...initialValues,
      amenities: initialValues?.amenities || [],
    });
  }, [initialValues]);

  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    if (!files.length) {
      setPreviews([]);
      return;
    }

    const nextPreviews = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: Math.round(file.size / 1024),
      url: URL.createObjectURL(file),
    }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [files]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleAmenity(amenity) {
    setForm((prev) => {
      const currentAmenities = prev.amenities || [];
      const newAmenities = currentAmenities.includes(amenity)
        ? currentAmenities.filter((a) => a !== amenity)
        : [...currentAmenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmed = {
      ...form,
      title: form.title?.trim() ?? "",
      description: form.description?.trim() ?? "",
      address: form.address?.trim() ?? "",
      price: form.price?.toString().trim() ?? "",
      surface: form.surface?.toString().trim() ?? "",
      rooms: form.rooms?.toString().trim() ?? "",
    };

    if (!trimmed.title || !trimmed.description) {
      setError("Veuillez renseigner au minimum le titre et la description.");
      return;
    }
    if (!trimmed.address) {
      setError("L'adresse est obligatoire.");
      return;
    }

    const numericFields = [
      { value: trimmed.price, message: "Le prix doit être un nombre positif." },
      { value: trimmed.surface, message: "La surface doit être un nombre positif." },
      { value: trimmed.rooms, message: "Le nombre de pièces doit être un nombre positif." },
    ];

    for (const field of numericFields) {
      const parsed = Number(field.value);
      if (!field.value || Number.isNaN(parsed) || parsed <= 0) {
        setError(field.message);
        return;
      }
    }

    try {
      await onSubmit({
        form: trimmed,
        files,
      });
      setFiles([]);
    } catch (submitError) {
      setError(submitError.message || "Impossible d'enregistrer l'annonce.");
    }
  }

  async function handleRemoveMedia(mediaId) {
    if (!onRemoveMedia) {
      return;
    }
    setRemovingMediaId(mediaId);
    try {
      await onRemoveMedia(mediaId);
    } finally {
      setRemovingMediaId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField
            label="Titre"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Description</span>
            <textarea
              name="description"
              className="min-h-[140px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
              <span>Type de transaction</span>
              <select
                name="transactionType"
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={form.transactionType}
                onChange={handleChange}
              >
                {TRANSACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <TextField
              label="Prix (dh) ou loyer"
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          {allowStatusEdit && (
            <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
              <span>Statut</span>
              <select
                name="status"
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={form.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <TextField
            label="Adresse"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Surface (m²)"
              type="number"
              name="surface"
              value={form.surface}
              onChange={handleChange}
              required
            />
            <TextField
              label="Nombre de pièces"
              type="number"
              name="rooms"
              value={form.rooms}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Équipements (optionnel)
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => {
                const isSelected = (form.amenities || []).includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400"
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
            {form.amenities && form.amenities.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {form.amenities.length} équipement(s) sélectionné(s)
              </p>
            )}
          </div>

          <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Ajouter des images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
            />
            <span className="text-xs text-slate-400">
              Jusqu’à 10 fichiers, 15Mo max chacun. Formats image recommandés.
            </span>
          </label>

          {!!previews.length && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-600">Prévisualisation</p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {previews.map((file) => (
                  <div
                    key={file.id}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white text-xs text-slate-500"
                  >
                    <img src={file.url} alt={file.name} className="h-28 w-full object-cover" />
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="truncate font-medium text-slate-600">{file.name}</span>
                      <span>{file.size} Ko</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {existingMedia.length > 0 && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Médias existants</p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {existingMedia.map((media) => (
                  <div
                    key={media._id}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <img
                      src={media.thumbnailUrl || media.url}
                      alt={media.type}
                      className="h-28 w-full object-cover"
                    />
                    {onRemoveMedia && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(media._id)}
                        disabled={isSubmitting || removingMediaId === media._id}
                        className="w-full border-t border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingMediaId === media._id ? "Suppression..." : "Supprimer"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <Alert variant="error" title="Informations manquantes" message={error} />}
          {serverError && !error && (
            <Alert variant="error" title="Erreur" message={serverError} />
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : submitLabel}
          </Button>
        </form>
      </section>
    </div>
  );
}

