import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../../services/authService";
import { AuthLayout } from "../../layouts/AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload) => resetPassword(payload),
    onSuccess() {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setLocalError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLocalError("");
    mutation.mutate({ token, newPassword: password });
  }

  if (!token) {
    return (
      <AuthLayout title="Lien invalide">
        <Alert
          variant="error"
          title="Token manquant"
          message="Le lien de réinitialisation est invalide ou expiré."
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nouveau mot de passe">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Nouveau mot de passe"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <TextField
          label="Confirmer le mot de passe"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Enregistrement..." : "Réinitialiser"}
        </Button>
      </form>
      {mutation.isError && (
        <Alert variant="error" title="Erreur" message={mutation.error.message} />
      )}
      {localError && <Alert variant="error" title="Erreur" message={localError} />}
      {success && (
        <Alert
          variant="success"
          title="Mot de passe mis à jour"
          message="Redirection vers la connexion..."
        />
      )}
    </AuthLayout>
  );
}

