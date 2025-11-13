import { Link } from "react-router-dom";
import { AuthLayout } from "../../layouts/AuthLayout";
import { Button } from "../../components/ui/Button";

export function ForbiddenPage() {
  return (
    <AuthLayout title="Accès restreint">
      <p className="text-sm leading-relaxed text-slate-600">
        Vous n’avez pas les droits nécessaires pour accéder à cette section de la plateforme.
      </p>
      <Link to="/dashboard">
        <Button variant="secondary">Retourner au tableau de bord</Button>
      </Link>
    </AuthLayout>
  );
}

