import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "../../services/authService";
import { AuthLayout } from "../../layouts/AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: requestPasswordReset,
  });

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate({ email });
  }

  return (
    <AuthLayout title="Mot de passe oublié">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Adresse email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Envoi en cours..." : "Recevoir le lien de réinitialisation"}
        </Button>
      </form>

      {mutation.isSuccess && (
        <Alert
          variant="success"
          title="Email envoyé"
          message="Si l’adresse existe, un lien de réinitialisation vous a été envoyé."
        />
      )}

      {mutation.isError && (
        <Alert variant="error" title="Erreur" message={mutation.error.message} />
      )}

      <div className="text-center text-xs text-slate-500">
        <Link to="/login" className="text-emerald-600 hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  );
}

