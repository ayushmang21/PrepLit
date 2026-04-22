import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const linkClassName = ({ isActive }) =>
  [
    "shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold tracking-[-0.02em] transition sm:px-4",
    isActive
      ? "bg-orange-500 text-white shadow-sm"
      : "text-slate-600 hover:bg-orange-50 hover:text-orange-600",
  ].join(" ");

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuPath, setMobileMenuPath] = useState(null);
  const hasToken = Boolean(localStorage.getItem("token"));
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";
  const isInterviewPage = location.pathname.startsWith("/interview/");
  const isMobileMenuOpen = mobileMenuPath === location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMobileMenuPath(null);
    navigate("/login");
  };

  return (
    <header className="border-b border-orange-100/80 bg-white/85 shadow-[0_14px_40px_-34px_rgba(15,23,42,0.5)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <Link
            to={hasToken ? "/dashboard" : "/"}
            className="group flex min-w-0 items-center gap-3 sm:gap-3.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.1rem] bg-white ring-1 ring-orange-300 shadow-[0_16px_34px_-24px_rgba(249,115,22,0.95)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_38px_-24px_rgba(249,115,22,1)] sm:h-12 sm:w-12 sm:rounded-[1.35rem]">
              <img
                src="/home_icon.png"
                alt="PrepLit logo"
                className="h-9 w-9 rounded-2xl object-contain sm:h-11 sm:w-11"
              />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.32em] text-orange-500 sm:text-xs sm:tracking-[0.42em]">
                PrepLit
              </p>
              <p className="font-display text-lg font-bold leading-none tracking-[-0.05em] text-slate-800 sm:text-[1.55rem]">
                AI Interview Prep
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() =>
              setMobileMenuPath((currentPath) =>
                currentPath === location.pathname ? null : location.pathname,
              )
            }
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 sm:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                <path d="M6 6L18 18M18 6L6 18" />
              ) : (
                <>
                  <path d="M4 7H20" />
                  <path d="M4 12H20" />
                  <path d="M4 17H20" />
                </>
              )}
            </svg>
          </button>

          <div className="hidden items-center justify-end gap-2 sm:flex sm:flex-wrap">
            <NavLink to="/" className={linkClassName}>
              Home
            </NavLink>

            {hasToken ? (
              <>
                <NavLink to="/dashboard" className={linkClassName}>
                  Dashboard
                </NavLink>
                {/* <NavLink to="/health" className={linkClassName}>
                  AI Health
                </NavLink> */}
                {isInterviewPage && (
                  <span className="hidden rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 sm:inline-flex">
                    Interview Session
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="shrink-0 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:px-4"
                >
                  Logout
                </button>
              </>
            ) : isAuthPage ? (
              <Link
                to={location.pathname === "/login" ? "/signup" : "/login"}
                className="shrink-0 rounded-full bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:px-4"
              >
                {location.pathname === "/login" ? "Create account" : "Login"}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="shrink-0 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:px-4"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="shrink-0 rounded-full bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:px-4"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mt-3 rounded-[1.75rem] border border-orange-100/80 bg-white/95 p-3 shadow-lg shadow-orange-100/70 backdrop-blur-sm sm:hidden">
            <div className="flex flex-col gap-2">
              <NavLink to="/" className={linkClassName}>
                Home
              </NavLink>

              {hasToken ? (
                <>
                  <NavLink to="/dashboard" className={linkClassName}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/health" className={linkClassName}>
                    AI Health
                  </NavLink>
                  {isInterviewPage && (
                    <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
                      Interview Session
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Logout
                  </button>
                </>
              ) : isAuthPage ? (
                <Link
                  to={location.pathname === "/login" ? "/signup" : "/login"}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {location.pathname === "/login" ? "Create account" : "Login"}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
