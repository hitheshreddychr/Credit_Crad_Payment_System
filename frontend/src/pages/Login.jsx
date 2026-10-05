import { useState } from "react";
import api from "../api";
import {
  CreditCard,
  ShieldCheck,
  LockKeyhole,
  Zap,
} from "lucide-react";

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isLogin) {
        const response = await api.post(
          "/api/auth/login/",
          {
            username: form.username,
            password: form.password,
          }
        );

        onLogin(response);
      } else {
        await api.post(
          "/api/auth/register/",
          form
        );

        setMessage(
          "Registration successful. Please login."
        );

        setIsLogin(true);

        setForm({
          username: "",
          email: "",
          phone_number: "",
          password: "",
          password_confirmation: "",
        });
      }
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        setError(
          Object.values(data).flat().join(" ")
        );
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <CreditCard size={24} />
              </div>

              <span className="text-2xl font-extrabold">
                CardPay
              </span>
            </div>

            <div className="mt-24 max-w-lg">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
                Secure Payment Platform
              </p>

              <h1 className="mt-5 text-5xl font-extrabold leading-tight">
                Smart payments.
                <br />
                Simple control.
              </h1>

              <p className="mt-6 text-lg leading-8 text-blue-100">
                Manage your cards, process payments,
                and track every transaction from one
                secure platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <ShieldCheck size={23} />
              <p className="mt-3 text-sm font-bold">
                Secure
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <LockKeyhole size={23} />
              <p className="mt-3 text-sm font-bold">
                Protected
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <Zap size={23} />
              <p className="mt-3 text-sm font-bold">
                Fast
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <CreditCard size={24} />
                </div>

                <span className="text-2xl font-extrabold">
                  CardPay
                </span>
              </div>
            </div>

            <p className="text-sm font-bold text-blue-600">
              WELCOME TO CARDPAY
            </p>

            <h2 className="mt-2 text-4xl font-extrabold text-slate-900">
              {isLogin
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p className="mt-3 text-slate-500">
              {isLogin
                ? "Sign in to manage your payments."
                : "Create an account to get started."}
            </p>

            {message && (
              <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={submit}
              className="mt-8 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Username
                </label>

                <input
                  name="username"
                  value={form.username}
                  onChange={change}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Enter username"
                />
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={change}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Phone Number
                    </label>

                    <input
                      name="phone_number"
                      value={form.phone_number}
                      onChange={change}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      placeholder="Enter phone number"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={change}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="Enter password"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={change}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    placeholder="Confirm password"
                  />
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>

            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setMessage("");
              }}
              className="mt-6 w-full text-center text-sm font-bold text-blue-600"
            >
              {isLogin
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;