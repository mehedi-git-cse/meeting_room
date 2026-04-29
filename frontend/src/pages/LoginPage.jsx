import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { loginThunk } from "../features/auth/authSlice";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (user) navigate("/");
  }, [navigate, user]);

  return (
    <main className="auth-page">
      <AuthForm mode="login" loading={loading} error={error} onSubmit={(values) => dispatch(loginThunk(values))} />
      <p>
        New here? <Link to="/register">Create account</Link>
      </p>
    </main>
  );
};

export default LoginPage;
