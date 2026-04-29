import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./app/router";
import { store } from "./app/store";
import { bootstrapAuthThunk } from "./features/auth/authSlice";
import "./styles/main.scss";

const Bootstrap = () => {
  useEffect(() => {
    store.dispatch(bootstrapAuthThunk());
  }, []);

  return <AppRouter />;
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Bootstrap />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
