import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3).max(24)
});

export const AuthForm = ({ mode, onSubmit, loading, error }) => {
  const schema = mode === "login" ? loginSchema : registerSchema;
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <h1>{mode === "login" ? "Welcome Back" : "Create Your Account"}</h1>
      <p>Real-time chat, calls, and collaboration in one place.</p>

      {mode === "register" && (
        <label>
          Username
          <input placeholder="username" {...register("username")} />
          <span>{errors.username?.message}</span>
        </label>
      )}

      <label>
        Email
        <input type="email" placeholder="you@example.com" {...register("email")} />
        <span>{errors.email?.message}</span>
      </label>

      <label>
        Password
        <input type="password" placeholder="********" {...register("password")} />
        <span>{errors.password?.message}</span>
      </label>

      {error && <div className="auth-error">{error}</div>}

      <button disabled={loading} type="submit">
        {loading ? "Working..." : mode === "login" ? "Sign In" : "Sign Up"}
      </button>
    </form>
  );
};
