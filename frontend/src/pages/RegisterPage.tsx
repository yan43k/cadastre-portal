import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { API_BASE } from "../config";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

export default function RegisterPage() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: z.infer<typeof schema>) => {
    try {
      await axios.post(`${API_BASE}/auth/register`, v);
      toast.success("Регистрация выполнена. Войдите в систему.");
      nav("/login");
    } catch {
      toast.error("Не удалось зарегистрироваться");
    }
  };

  return (
    <>
      <Helmet>
        <title>Регистрация клиента</title>
      </Helmet>
      <h1 className="font-display text-3xl text-bistre">Регистрация</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-sm space-y-3">
        <input className="w-full border border-line bg-parchment px-3 py-2 text-sm" placeholder="Имя" {...register("firstName")} />
        <input className="w-full border border-line bg-parchment px-3 py-2 text-sm" placeholder="Фамилия" {...register("lastName")} />
        <input className="w-full border border-line bg-parchment px-3 py-2 text-sm" placeholder="Телефон" {...register("phone")} />
        <input className="w-full border border-line bg-parchment px-3 py-2 text-sm" placeholder="Email" {...register("email")} />
        {errors.email && <p className="text-xs text-red-700">{errors.email.message}</p>}
        <input type="password" className="w-full border border-line bg-parchment px-3 py-2 text-sm" placeholder="Пароль (мин. 8)" {...register("password")} />
        {errors.password && <p className="text-xs text-red-700">{errors.password.message}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full border border-umber bg-bistre py-2 text-sm text-cream">
          Создать аккаунт
        </button>
      </form>
      <p className="mt-4 text-sm">
        Уже есть аккаунт? <Link to="/login">Вход</Link>
      </p>
    </>
  );
}
