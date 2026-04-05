import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const linkClassName = ({ isActive }) =>
  [
    "rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.02em] transition",
    isActive
      ? "bg-orange-500 text-white shadow-sm"
      : "text-slate-600 hover:bg-orange-50 hover:text-orange-600",
  ].join(" ");

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasToken = Boolean(localStorage.getItem("token"));
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";
  const isInterviewPage = location.pathname.startsWith("/interview/");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="border-b border-orange-100/80 bg-white/85 shadow-[0_14px_40px_-34px_rgba(15,23,42,0.5)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:flex-nowrap sm:px-6">
        <Link
          to={hasToken ? "/dashboard" : "/"}
          className="group flex min-w-0 items-center gap-3.5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-white ring-1 ring-orange-300 shadow-[0_16px_34px_-24px_rgba(249,115,22,0.95)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_38px_-24px_rgba(249,115,22,1)]">
            <img
              src="/home_icon.png"
              alt="PrepLit logo"
              className="h-11 w-11 object-contain rounded-2xl"
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.42em] text-orange-500 sm:text-xs">
              PrepLit
            </p>
            <p className="font-display text-base font-bold tracking-[-0.05em] text-slate-800 sm:text-[1.55rem]">
              AI Interview Prep
            </p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <NavLink to="/" className={linkClassName}>
            Home
          </NavLink>

          {hasToken ? (
            <>
              <NavLink to="/dashboard" className={linkClassName}>
                Dashboard
              </NavLink>
              {isInterviewPage && (
                <span className="hidden rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 sm:inline-flex">
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
    </header>
  );
};

export default Navbar;
