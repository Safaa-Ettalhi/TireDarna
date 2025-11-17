import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "../../components/ui/Alert";
import { PropertyForm } from "../../components/properties/PropertyForm";
import {
  createProperty,
  uploadPropertyMedia,
} from "../../services/propertyService";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  title: "",
  description: "",
  transactionType: "sale",
  price: "",
  address: "",
  surface: "",
  rooms: "",
  status: "published",
  amenities: [],
};

export default function CreatePropertyPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const createMutation = useMutation({
    mutationFn: (payload) => createProperty(token, payload),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ propertyId, files }) => uploadPropertyMedia(token, propertyId, files),
  });

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Alert
          variant="error"
          title="Authentification requise"
          message="Vous devez être connecté pour créer une annonce."
        />
      </div>
    );
  }

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
      status: form.status || undefined,
      availability: {
        from: new Date().toISOString(),
        to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      },
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      bathrooms: 1,
      amenities: form.amenities || [],
      internalRules: [],
    };

    try {
      const data = await createMutation.mutateAsync(payload);
      const propertyId = data?.property?._id;

      if (files.length > 0 && propertyId) {
        await uploadMutation.mutateAsync({ propertyId, files });
      }

      navigate(propertyId ? `/properties/${propertyId}` : "/properties");
    } catch (error) {
      setServerError(error.message || "Impossible de créer l'annonce.");
      throw error;
    }
  }

  return (
    <PropertyForm
      title="Créer une annonce"
      description="Complétez les informations principales de votre bien. Vous pourrez enrichir l’annonce avec des options avancées plus tard."
      initialValues={initialForm}
      onSubmit={handleSubmit}
      submitLabel="Publier l'annonce"
      isSubmitting={createMutation.isLoading || uploadMutation.isLoading}
      serverError={serverError}
    />
  );
}
