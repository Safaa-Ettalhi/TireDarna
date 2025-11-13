import { Link } from "react-router-dom";

export function AuthLayout({ title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg">
        <header className="space-y-1 text-center">
          <Link to="/" className="text-lg font-semibold text-emerald-600">
            Darna Platform
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </header>
        {children}
      </div>
    </div>
  );
}

