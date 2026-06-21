import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { API_BASE } from "../config";
import { useAuthStore } from "../store/authStore";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const from = (loc.state as { from?: string } | null)?.from ?? "/cabinet";

  const onSubmit = async (v: z.infer<typeof schema>) => {
    try {
      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; role: string; firstName?: string | null; lastName?: string | null; phone?: string | null };
      }>(`${API_BASE}/auth/login`, v, { withCredentials: true });
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      toast.success("Вход выполнен");
      nav(data.user.role === "ADMIN" ? "/admin" : from, { replace: true });
    } catch {
      toast.error("Неверные учётные данные");
    }
  };

  return (
    <>
      <Helmet>
        <title>Вход в личный кабинет</title>
      </Helmet>
      <h1 className="font-display text-3xl text-bistre">Вход</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-sm space-y-3">
        <input className="w-full border border-line bg-parchment px-3 py-2 text-sm" placeholder="Email" {...register("email")} />
        {errors.email && <p className="text-xs text-red-700">{errors.email.message}</p>}
        <input type="password" className="w-full border border-line bg-parchment px-3 py-2 text-sm" placeholder="Пароль" {...register("password")} />
        <button type="submit" disabled={isSubmitting} className="w-full border border-umber bg-bistre py-2 text-sm text-cream">
          Войти
        </button>
      </form>
      <p className="mt-4 text-sm">
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </p>
    </>
  );
}
