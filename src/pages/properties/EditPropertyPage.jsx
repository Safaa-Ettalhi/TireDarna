import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PropertyForm } from "../../components/properties/PropertyForm";
import {
  getProperty,
  updateProperty,
  uploadPropertyMedia,
  removePropertyMedia,
} from "../../services/propertyService";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/ui/Alert";

const EMPTY_FORM = {
  title: "",
  description: "",
  transactionType: "sale",
  price: "",
  address: "",
  surface: "",
  rooms: "",
  status: "pending_moderation",
};

export default function EditPropertyPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const propertyQuery = useQuery({
    queryKey: ["property", id],
    queryFn: () => getProperty(token, id),
    enabled: Boolean(token && id),
  });

  const updateMutation = useMutation({
    mutationFn: ({ propertyId, payload }) => updateProperty(token, propertyId, payload),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ propertyId, files }) => uploadPropertyMedia(token, propertyId, files),
  });

  const removeMediaMutation = useMutation({
    mutationFn: ({ propertyId, mediaId }) => removePropertyMedia(token, propertyId, mediaId),
    onSuccess: () => propertyQuery.refetch(),
  });

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Alert
          variant="error"
          title="Authentification requise"
          message="Vous devez être connecté pour modifier une annonce."
        />
      </div>
    );
  }

  if (propertyQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-500">
        Chargement de l’annonce...
      </div>
    );
  }

  if (propertyQuery.isError) {
    return (
      <Alert
        variant="error"
        title="Annonce introuvable"
        message={propertyQuery.error?.message || "Cette annonce est inaccessible."}
      />
    );
  }

  const property = propertyQuery.data?.property;

  if (!property) {
    return (
      <Alert
        variant="error"
        title="Annonce introuvable"
        message="Cette annonce n’existe plus ou vous n’y avez pas accès."
      />
    );
  }

  const initialValues = {
    title: property.title ?? "",
    description: property.description ?? "",
    transactionType: property.transactionType ?? "sale",
    price: property.price != null ? property.price.toString() : "",
    address: property.address ?? "",
    surface: property.surface != null ? property.surface.toString() : "",
    rooms: property.rooms != null ? property.rooms.toString() : "",
    status: property.status ?? "pending_moderation",
    amenities: property.amenities || [],
  };

  async function handleSubmit({ form, files }) {
    setServerError("");
    const payload = {
      title: form.title,
      description: form.description,
      transactionType: form.transactionType,
      price: Number(form.price),
      address: form.address,
      surface: Number(form.surface),
      rooms: Number(form.rooms),
      status: form.status,
      amenities: form.amenities || [],
    };

    try {
      await updateMutation.mutateAsync({ propertyId: id, payload });

      if (files.length > 0) {
        await uploadMutation.mutateAsync({ propertyId: id, files });
      }

      navigate(`/properties/${id}`);
    } catch (error) {
      setServerError(error.message || "Impossible de mettre à jour l’annonce.");
      throw error;
    }
  }

  async function handleRemoveMedia(mediaId) {
    setServerError("");
    try {
      await removeMediaMutation.mutateAsync({ propertyId: id, mediaId });
    } catch (error) {
      setServerError(error.message || "Suppression du média impossible.");
    }
  }

  return (
    <PropertyForm
      title="Modifier l'annonce"
      description="Actualisez les informations de votre bien et ajoutez de nouvelles photos si nécessaire."
      initialValues={property ? initialValues : EMPTY_FORM}
      existingMedia={property.media ?? []}
      onSubmit={handleSubmit}
      onRemoveMedia={property.media?.length ? handleRemoveMedia : undefined}
      submitLabel="Enregistrer les modifications"
      isSubmitting={
        updateMutation.isLoading || uploadMutation.isLoading || removeMediaMutation.isLoading
      }
      serverError={serverError}
    />
  );
}

