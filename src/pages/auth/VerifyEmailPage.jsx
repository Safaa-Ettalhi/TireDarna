import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../services/authService";
import { AuthLayout } from "../../layouts/AuthLayout";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const navigate = useNavigate();
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus({ state: "error", message: "Lien de vérification invalide." });
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus({ state: "success", message: "Votre email a été vérifié avec succès." });
        setTimeout(() => navigate("/login"), 2000);
      })
      .catch((error) => setStatus({ state: "error", message: error.message }));
  }, [searchParams, navigate]);

  return (
    <AuthLayout title="Vérification de l’email">
      {status.state === "idle" && (
        <Alert variant="info" title="Vérification en cours..." message="Merci de patienter." />
      )}
      {status.state === "success" && (
        <Alert
          variant="success"
          title="Email vérifié"
          message={`${status.message} Redirection vers la connexion...`}
        />
      )}
      {status.state === "error" && <Alert variant="error" title="Erreur" message={status.message} />}

      <div className="text-center">
        <Link to="/login">
          <Button variant="secondary">Revenir à la connexion</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}

