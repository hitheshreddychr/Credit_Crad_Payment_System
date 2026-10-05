import {
  LayoutDashboard,
  CreditCard,
  WalletCards,
  ReceiptText,
  BarChart3,
  Bell,
  ShieldCheck,
  UserCircle,
  Settings,
  CircleHelp,
  LogOut,
  Search,
} from "lucide-react";

export default function Layout({
  user,
  page,
  setPage,
  onLogout,
  children,
  message,
  error,
}) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "cards", label: "My Cards", icon: CreditCard },
    { id: "payment", label: "Make Payment", icon: WalletCards },
    { id: "transactions", label: "Transactions", icon: ReceiptText },
    { id: "analytics", label: "Payment Analytics", icon: BarChart3 },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const accountItems = [
    { id: "profile", label: "Profile", icon: UserCircle },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: CircleHelp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[202px] flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-[55px] shrink-0 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <CreditCard className="h-5 w-5" />
          </div>

          <div>
            <p className="text-base font-extrabold text-slate-900">CardPay</p>
            <p className="text-[10px] text-slate-400">Payment System</p>
          </div>
        </div>

        <div className="shrink-0 border-b border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
              {(user?.username || "U").charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">
                {user?.username || "User"}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>

        {/* SCROLLABLE MENU */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPage(item.id)}
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-slate-500 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm active:translate-y-0 active:scale-[0.97]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      active ? "text-blue-600" : ""
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {user?.is_admin || user?.is_staff ? (
            <>
              <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Administration
              </p>

              <button
                type="button"
                onClick={() => setPage("admin")}
                className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all duration-200 ${
                  page === "admin"
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-slate-500 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm active:translate-y-0 active:scale-[0.97]"
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>Admin Dashboard</span>
              </button>
            </>
          ) : null}

          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account
          </p>

          <nav className="space-y-1">
            {accountItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPage(item.id)}
                  className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-slate-500 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-blue-600 hover:shadow-sm active:translate-y-0 active:scale-[0.97]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ALWAYS VISIBLE SIGN OUT */}
        <div className="shrink-0 border-t border-slate-100 bg-white p-3">
          <button
            type="button"
            onClick={onLogout}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-red-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:translate-y-0 active:scale-[0.97]"
          >
            <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-[202px]">
        <header className="sticky top-0 z-30 flex h-[55px] items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
          <div>
            <p className="text-[10px] font-medium text-slate-400">CardPay</p>
            <h1 className="text-base font-extrabold capitalize text-slate-900">
              {page === "admin" ? "Admin Dashboard" : page}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-400 sm:flex">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-32 bg-transparent text-xs outline-none placeholder:text-slate-300"
              />
            </div>

            <button
              type="button"
              className="cursor-pointer rounded-xl p-2 text-slate-500 transition-all hover:-translate-y-0.5 hover:bg-slate-100 hover:text-blue-600 active:scale-95"
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                {(user?.username || "U").charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800">
                  {user?.username || "User"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {user?.is_admin || user?.is_staff ? "Administrator" : "Customer"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {message && (
          <div className="mx-6 mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <main className="min-h-[calc(100vh-55px)] p-6">{children}</main>
      </div>
    </div>
  );
}