import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { registerThunk } from "../features/auth/authSlice";

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (user) navigate("/");
  }, [navigate, user]);

  return (
    <main className="auth-page">
      <AuthForm mode="register" loading={loading} error={error} onSubmit={(values) => dispatch(registerThunk(values))} />
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
};

export default RegisterPage;
