import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert } from "../../components/ui/Alert";
import { PropertyForm } from "../../components/properties/PropertyForm";
import {
  createProperty,
  searchProperties,
  uploadPropertyMedia,
} from "../../services/propertyService";
import { useAuth } from "../../context/AuthContext";
import { getMySubscription } from "../../services/subscriptionService";

const initialForm = {
  title: "",
  description: "",
  transactionType: "sale",
  price: "",
  pricePerDay: "",
  address: "",
  surface: "",
  rooms: "",
  bathrooms: "1",
  status: "pending_moderation",
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

  const subscriptionQuery = useQuery({
    queryKey: ["mySubscription", token],
    queryFn: () => getMySubscription(token),
    enabled: Boolean(token),
  });

  const activePropertiesQuery = useQuery({
    queryKey: ["my-properties-active-count", token],
    queryFn: () =>
      searchProperties(token, {
        includeOwn: true,
        status: "active",
        limit: 1,
      }),
    select: (data) => data?.total ?? 0,
    enabled: Boolean(token),
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

  const planMeta = useMemo(() => {
    const subscription = subscriptionQuery.data?.subscription ?? null;
    const plan = typeof subscription?.plan === "string" ? subscription?.plan : subscription?.plan?.name;
    const planName = plan || "gratuit";
    const PLAN_LIMITS = {
      gratuit: 10,
      pro: 100,
      premium: Number.POSITIVE_INFINITY,
    };
    const limit = PLAN_LIMITS[planName] ?? PLAN_LIMITS.gratuit;
    const activeCount = activePropertiesQuery.data ?? 0;
    const remaining = Number.isFinite(limit) ? Math.max(limit - activeCount, 0) : null;
    return { planName, limit, activeCount, remaining };
  }, [activePropertiesQuery.data, subscriptionQuery.data]);

  const limitReached = Number.isFinite(planMeta.limit) && planMeta.activeCount >= planMeta.limit;

  async function handleSubmit({ form, files }) {
    if (limitReached) {
      setServerError(
        "Vous avez atteint la limite d'annonces actives pour votre plan. Supprimez ou archivez une annonce, ou changez de plan."
      );
      return;
    }
    setServerError("");
    const payload = {
      title: form.title,
      description: form.description,
      transactionType: form.transactionType,
      price: Number(form.price),
      pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : undefined,
      address: form.address,
      surface: Number(form.surface),
      rooms: Number(form.rooms),
      bathrooms: Number(form.bathrooms || 1),
      status: form.status || undefined,
      availability: {
        from: new Date().toISOString(),
        to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      },
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
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

  if (subscriptionQuery.isLoading || activePropertiesQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Chargement de vos informations d’abonnement...</p>
      </div>
    );
  }

  if (limitReached) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <h1 className="text-lg font-semibold">Limite atteinte pour le plan {planMeta.planName}</h1>
          <p className="mt-2 text-sm">
            Vous pouvez publier au maximum {planMeta.limit} annonce(s) active(s) avec votre plan actuel.
            Archivez une annonce existante ou passez sur un plan supérieur depuis la page Profil & Abonnement
            pour continuer à publier.
          </p>
        </section>
      </div>
    );
  }

  return (
    <PropertyForm
      title="Créer une annonce"
      description="Complétez les informations principales de votre bien. Vous pourrez enrichir l'annonce avec des options avancées plus tard."
      initialValues={initialForm}
      onSubmit={handleSubmit}
      submitLabel="Enregistrer l'annonce"
      isSubmitting={createMutation.isLoading || uploadMutation.isLoading}
      serverError={serverError}
      allowStatusEdit={true}
      allowedStatuses={["draft", "pending_moderation"]}
    />
  );
}
