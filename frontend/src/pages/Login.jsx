import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { API_PATHS } from "../utils/apiPaths";
import axiosInstance from "../utils/axiosInstance";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axiosInstance.post(API_PATHS.AUTH.LOGIN, form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-yellow-100 via-white to-yellow-50">
      <Navbar />

      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-10">
        <form
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg"
          onSubmit={handleLogin}
        >
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Welcome back
          </h2>
          <p className="mb-6 mt-2 text-center text-sm text-gray-500">
            Login to continue your interview preparation.
          </p>

          <input
            name="email"
            type="email"
            value={form.email}
            placeholder="Enter your email"
            className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            onChange={handleForm}
          />

          <input
            name="password"
            type="password"
            value={form.password}
            placeholder="Enter your password"
            className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            onChange={handleForm}
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 py-3 text-white transition duration-200 hover:bg-slate-800"
          >
            Login
          </button>

          <div className="my-5 flex items-center">
            <div className="h-px flex-1 bg-gray-200" />
            <p className="px-3 text-sm text-gray-400">OR</p>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-600">
            Do not have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-orange-500 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
