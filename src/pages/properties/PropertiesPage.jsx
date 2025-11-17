import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchProperties } from "../../services/propertyService";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { PropertyCard } from "../../components/properties/PropertyCard";
import { Pagination } from "../../components/ui/Pagination";

const TRANSACTION_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "sale", label: "Vente" },
  { value: "daily_rent", label: "Location journalière" },
  { value: "monthly_rent", label: "Location mensuelle" },
  { value: "seasonal_rent", label: "Location saisonnière" },
];

const SORT_OPTIONS = [
  { value: "priority", label: "Pertinence" },
  { value: "createdAt", label: "Plus récent" },
  { value: "price", label: "Prix" },
  { value: "surface", label: "Surface" },
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
];

export default function PropertiesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    transactionType: "",
    includeOwn: false,
    status: "published",
    minPrice: "",
    maxPrice: "",
    minSurface: "",
    maxSurface: "",
    rooms: "",
    amenities: [],
    sort: "priority",
    order: "desc",
    page: 1,
    limit: 12,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["properties", filters, token],
    queryFn: () => searchProperties(token, filters),
    enabled: !!token,
  });

  const properties = data?.properties ?? [];
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;

  function handleSubmit(event) {
    event.preventDefault();
    setFilters({ ...filters, page: 1 });
    refetch();
  }

  function handlePageChange(page) {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleAmenity(amenity) {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];
    setFilters({ ...filters, amenities: newAmenities });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Rechercher une annonce</h1>
            <p className="text-xs text-slate-500">
              {data?.total ? `${data.total} annonce(s) trouvée(s)` : "Recherchez parmi nos annonces"}
            </p>
          </div>

        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              label="Mot-clé"
              placeholder="Ville, quartier, mot-clé..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
              <span>Type de transaction</span>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={filters.transactionType}
                onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
              >
                {TRANSACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
              <span>Tri</span>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
              <span>Vue</span>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={filters.includeOwn ? "mine" : "public"}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    includeOwn: e.target.value === "mine",
                    status: e.target.value === "mine" ? "all" : "published",
                  })
                }
              >
                <option value="public">Annonces publiées</option>
                <option value="mine">Mes annonces</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isFetching}>
              {isFetching ? "Recherche..." : "Rechercher"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Masquer" : "Filtres avancés"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters({
                  keyword: "",
                  transactionType: "",
                  includeOwn: false,
                  status: "published",
                  minPrice: "",
                  maxPrice: "",
                  minSurface: "",
                  maxSurface: "",
                  rooms: "",
                  amenities: [],
                  sort: "priority",
                  order: "desc",
                  page: 1,
                  limit: 12,
                });
              }}
            >
              Réinitialiser
            </Button>
          </div>

          {showAdvanced && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TextField
                  label="Prix min (dh)"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
                <TextField
                  label="Prix max (dh)"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
                <TextField
                  label="Surface min (m²)"
                  type="number"
                  value={filters.minSurface}
                  onChange={(e) => setFilters({ ...filters, minSurface: e.target.value })}
                />
                <TextField
                  label="Surface max (m²)"
                  type="number"
                  value={filters.maxSurface}
                  onChange={(e) => setFilters({ ...filters, maxSurface: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nombre de pièces min"
                  type="number"
                  value={filters.rooms}
                  onChange={(e) => setFilters({ ...filters, rooms: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Équipements
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_OPTIONS.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        filters.amenities.includes(amenity)
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400"
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>
      </section>

      <section className="min-h-[200px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Résultats {data?.total ? `(${data.total})` : ""}
          </h2>
        </div>
        {!token ? (
          <p className="mt-4 text-sm text-slate-500">Connectez-vous pour consulter vos annonces.</p>
        ) : isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Chargement des annonces...</p>
        ) : properties.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Aucune annonce ne correspond à votre recherche pour le moment.
          </p>
        ) : (
          <>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

