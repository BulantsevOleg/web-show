import React from "react";
import { useAdmin } from "../../data/AdminContext";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const { token, login } = useAdmin();
  const nav = useNavigate();
  const [t, setT] = React.useState("");

  React.useEffect(() => {
    if (token) nav("/admin/editor", { replace: true });
  }, [token]);

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl mb-4">Вход в админку</h1>
      <input
        className="border border-black rounded-xl px-3 py-2 w-full mb-3"
        placeholder="Токен редактора"
        value={t}
        onChange={(e) => setT(e.target.value)}
      />
      <button
        className="px-4 py-2 border border-black rounded-xl"
        onClick={async () => {
          try {
            await login(t.trim());
            nav("/admin/editor");
          } catch (e: any) {
            alert(e.message || "Ошибка входа");
          }
        }}
      >
        Войти
      </button>
    </div>
  );
}
