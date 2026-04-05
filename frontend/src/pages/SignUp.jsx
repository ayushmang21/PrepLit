import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { API_PATHS } from "../utils/apiPaths";
import axiosInstance from "../utils/axiosInstance";

const SignUp = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.post(API_PATHS.AUTH.SIGNUP, form);
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-white to-yellow-50">
      <Navbar />

      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center px-4 py-10">
        <form
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg"
          onSubmit={handleSignup}
        >
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Create account
          </h2>
          <p className="mb-6 mt-2 text-center text-sm text-gray-500">
            Start your AI-powered interview preparation.
          </p>

          <input
            name="name"
            type="text"
            value={form.name}
            placeholder="Enter your name"
            className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            onChange={handleChange}
          />

          <input
            name="email"
            type="email"
            value={form.email}
            placeholder="Enter your email"
            className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            value={form.password}
            placeholder="Create a password"
            className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            onChange={handleChange}
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 py-3 text-white transition duration-200 hover:bg-slate-800"
          >
            Sign Up
          </button>

          <div className="my-5 flex items-center">
            <div className="h-px flex-1 bg-gray-200" />
            <p className="px-3 text-sm text-gray-400">OR</p>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-orange-500 hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
