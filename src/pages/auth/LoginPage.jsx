import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "../../layouts/AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess(data) {
      setAuth({ token: data.token, user: data.user });
      navigate("/dashboard");
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate(form);
  }

  return (
    <AuthLayout title="Connexion">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Adresse email"
          type="email"
          name="email"
          placeholder="email@exemple.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <TextField
          label="Mot de passe"
          type="password"
          name="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      {mutation.isError && (
        <Alert variant="error" title="Connexion impossible" message={mutation.error.message} />
      )}

      <div className="text-center text-xs text-slate-500">
        <Link to="/forgot-password" className="text-emerald-600 hover:underline">
          Mot de passe oublié ?
        </Link>
        <p className="mt-2">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-emerald-600 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

