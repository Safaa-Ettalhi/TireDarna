import { useState } from "react";
import { Link } from "react-router-dom";
import { ENV } from "../../config/env";

const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${ENV.API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

export function PropertyCard({ property }) {
  const media = property.media ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentMedia = media[currentIndex];
  const coverUrl = resolveMediaUrl(currentMedia?.thumbnailUrl || currentMedia?.url);

  const hasMultiple = media.length > 1;

  function showPrevious() {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }

  function showNext() {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100">
        {coverUrl ? (
          <>
            <img
              src={coverUrl}
              alt={property.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow transition hover:bg-white"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow transition hover:bg-white"
                >
                  ›
                </button>
                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                  {currentIndex + 1} / {media.length}
                </span>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            Pas d’image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase text-emerald-600">
            {property.transactionType === "sale" ? "Vente" : "Location"}
          </p>
          {property.status && property.status !== "published" && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                property.status === "pending_moderation"
                  ? "bg-yellow-100 text-yellow-700"
                  : property.status === "draft"
                  ? "bg-slate-100 text-slate-700"
                  : property.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {property.status === "pending_moderation"
                ? "En attente"
                : property.status === "draft"
                ? "Brouillon"
                : property.status === "rejected"
                ? "Rejeté"
                : property.status}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{property.title}</h3>
        <p className="text-sm text-slate-600">{property.address}</p>
        <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
          <span>
            {typeof property.price === "number"
              ? `${property.price.toLocaleString("fr-FR")} dh`
              : "Prix non renseigné"}
          </span>
          <span>
            {property.surface ? `${property.surface} m²` : "Surface ?"}{" | "}
            {property.rooms ? `${property.rooms} pièces` : "Pièces ?"}
          </span>
        </div>
        <Link
          to={`/properties/${property._id}`}
          className="mt-3 inline-flex items-center justify-center rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-600 transition hover:border-emerald-500 hover:text-emerald-700"
        >
          Voir le détail
        </Link>
      </div>
    </li>
  );
}

