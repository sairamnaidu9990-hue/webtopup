"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Boxes,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FolderKanban,
  FolderOpen,
  Gamepad2,
  LayoutDashboard,
  Logs,
  Newspaper,
  NotebookPen,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  ShieldCheck,
  Sheet,
  ShoppingCart,
  Star,
  TicketPercent,
  Users,
  X,
  MessageSquareText,
  Settings2,
} from "lucide-react";

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type ProviderGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  children: NavItem[];
};

const providerGroups: ProviderGroup[] = [
  {
    id: "bangjeff",
    label: "BangJeff",
    icon: PackageSearch,
    children: [
      { label: "Dashboard", href: "/provider-control/bangjeff", icon: LayoutDashboard },
      { label: "Games", href: "/provider-control/bangjeff/games", icon: Gamepad2 },
      { label: "Variants", href: "/provider-control/bangjeff/variants", icon: Boxes },
      { label: "Sync Logs", href: "/provider-control/bangjeff/sync-logs", icon: Logs },
      { label: "Markup Variant", href: "/provider-control/bangjeff/markup", icon: Percent },
    ],
  },
  {
    id: "manual",
    label: "Manual",
    icon: FolderKanban,
    children: [
      { label: "Dashboard", href: "/provider-control/manual", icon: LayoutDashboard },
      { label: "Games", href: "/provider-control/manual/games", icon: Gamepad2 },
      { label: "Variants", href: "/provider-control/manual/variants", icon: Boxes },
      { label: "Markup Variant", href: "/provider-control/manual/markup", icon: Percent },
    ],
  },
];

const primaryItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const workspaceItems: NavItem[] = [
  { label: "Notepad", href: "/workspace/notepad", icon: NotebookPen },
  { label: "File Manager", href: "/workspace/files", icon: FolderOpen },
  { label: "Spreadsheets", href: "/workspace/spreadsheets", icon: Sheet },
];

const menuItems: NavItem[] = [
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Monitoring", href: "/monitoring", icon: Activity },
  { label: "Users", href: "/customers", icon: Users },
  { label: "Team Chat", href: "/team-chat", icon: MessageSquareText },
  { label: "Articles", href: "/articles", icon: Newspaper },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Promo Codes", href: "/promo-codes", icon: TicketPercent },
  { label: "Payment Methods", href: "/payment-methods", icon: CreditCard },
  { label: "Admin Management", href: "/admins", icon: ShieldCheck },
  { label: "Website Settings", href: "/website-settings", icon: Settings2 },
];

const desktopSidebarStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  height: "100vh",
  contain: "layout paint",
  transform: "translateZ(0)",
  backfaceVisibility: "hidden",
};

type NavLinkProps = {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  nested?: boolean;
};

function NavLink({
  item,
  isActive,
  collapsed,
  onNavigate,
  nested = false,
}: NavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center rounded-xl transition-all duration-200 ${
        collapsed
          ? "justify-center px-3 py-3"
          : nested
            ? "gap-3 px-4 py-2.5"
            : "gap-3 px-4 py-3"
      } ${
        isActive
          ? nested
            ? "bg-[#1f2330] text-white"
            : "bg-[#2a2d37] text-white"
          : nested
            ? "text-gray-400 hover:bg-[#171a22] hover:text-white"
            : "text-gray-400 hover:bg-[#1a1d27] hover:text-white"
      }`}
    >
      <Icon
        className={`shrink-0 ${
          nested ? "h-[17px] w-[17px]" : "h-[18px] w-[18px]"
        } ${isActive ? "text-white" : "text-gray-500 group-hover:text-white"}`}
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

type SidebarNavProps = {
  onNavigate?: () => void;
  pathname: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  providerOpen: boolean;
  setProviderOpen: Dispatch<SetStateAction<boolean>>;
  isProviderRoute: boolean;
  workspaceOpen: boolean;
  setWorkspaceOpen: Dispatch<SetStateAction<boolean>>;
  isWorkspaceRoute: boolean;
  providerGroupOpen: Record<string, boolean>;
  setProviderGroupOpen: Dispatch<SetStateAction<Record<string, boolean>>>;
};

function SidebarNav({
  onNavigate,
  pathname,
  collapsed,
  onToggleCollapse,
  providerOpen,
  setProviderOpen,
  isProviderRoute,
  workspaceOpen,
  setWorkspaceOpen,
  isWorkspaceRoute,
  providerGroupOpen,
  setProviderGroupOpen,
}: SidebarNavProps) {
  const ProviderIcon = Boxes;
  const WorkspaceIcon = FolderKanban;

  const handleProviderToggle = () => {
    if (collapsed) {
      onToggleCollapse?.();
      setProviderOpen(true);
      return;
    }

    setProviderOpen((current) => !current);
  };

  const handleWorkspaceToggle = () => {
    if (collapsed) {
      onToggleCollapse?.();
      setWorkspaceOpen(true);
      return;
    }

    setWorkspaceOpen((current) => !current);
  };

  return (
    <>
      <div
        className={`border-b border-white/10 ${
          collapsed ? "px-3 py-4" : "px-5 py-4 sm:px-6"
        }`}
      >
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between gap-3"
          }`}
        >
          <Link
            href="/dashboard"
            onClick={onNavigate}
            title={collapsed ? "Dashboard" : undefined}
            className={`flex min-w-0 items-center ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#de3a3a_0%,#351d25_100%)] text-base font-semibold text-white shadow-[0_14px_30px_rgba(222,58,58,0.22)]">
              K
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-white">
                  KITAGG
                </h1>
                <p className="mt-1 text-xs text-gray-400">Admin Panel</p>
              </div>
            ) : null}
          </Link>

          {!collapsed ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white lg:inline-flex"
                aria-label="Tutup sidebar"
              >
                <PanelLeftClose className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onClick={onNavigate}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Tutup menu"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white lg:inline-flex"
              aria-label="Buka sidebar"
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>

      <nav
        className={`flex-1 overflow-y-auto ${collapsed ? "px-3 py-5" : "px-3 py-5 sm:px-4 sm:py-6"}`}
      >
        <ul className="space-y-2">
          {primaryItems.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                isActive={pathname === item.href}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            </li>
          ))}

          <li>
            <button
              type="button"
              onClick={handleProviderToggle}
              title={collapsed ? "Provider Control" : undefined}
              className={`group flex w-full items-center rounded-xl transition-all duration-200 ${
                collapsed ? "justify-center px-3 py-3" : "justify-between px-4 py-3"
              } ${
                isProviderRoute || providerOpen
                  ? "bg-[#2a2d37] text-white"
                  : "text-gray-400 hover:bg-[#1a1d27] hover:text-white"
              }`}
            >
              <span className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <ProviderIcon className={`h-[18px] w-[18px] shrink-0 ${isProviderRoute || providerOpen ? "text-white" : "text-gray-500 group-hover:text-white"}`} />
                {!collapsed ? <span className="truncate text-sm font-medium">Provider Control</span> : null}
              </span>
              {!collapsed ? (
                providerOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                )
              ) : null}
            </button>

            {!collapsed && providerOpen ? (
              <div className="mt-2 space-y-1 pl-3">
                <NavLink
                  item={{ label: "Overview", href: "/provider-control", icon: LayoutDashboard }}
                  isActive={pathname === "/provider-control"}
                  collapsed={false}
                  onNavigate={onNavigate}
                  nested
                />

                {providerGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const isGroupActive = group.children.some((item) =>
                    pathname.startsWith(item.href)
                  );
                  const isGroupOpen = providerGroupOpen[group.id] || isGroupActive;

                  return (
                    <div key={group.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() =>
                          setProviderGroupOpen((current) => ({
                            ...current,
                            [group.id]: !isGroupOpen,
                          }))
                        }
                        className={`group flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isGroupActive || isGroupOpen
                            ? "border-[#343847] bg-[#252833] text-white"
                            : "border-transparent text-gray-400 hover:border-[#2c3140] hover:bg-[#1a1d27] hover:text-white"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <GroupIcon
                            className={`h-[17px] w-[17px] shrink-0 ${
                              isGroupActive || isGroupOpen
                                ? "text-white"
                                : "text-gray-500 group-hover:text-white"
                            }`}
                          />
                          <span className="truncate">{group.label}</span>
                        </span>
                        {isGroupOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        )}
                      </button>

                      {isGroupOpen ? (
                        <div className="space-y-1 pl-3">
                          {group.children.map((item) => (
                            <NavLink
                              key={item.href}
                              item={item}
                              isActive={pathname === item.href}
                              collapsed={false}
                              onNavigate={onNavigate}
                              nested
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </li>

          <li>
            <button
              type="button"
              onClick={handleWorkspaceToggle}
              title={collapsed ? "Workspace" : undefined}
              className={`group flex w-full items-center rounded-xl transition-all duration-200 ${
                collapsed ? "justify-center px-3 py-3" : "justify-between px-4 py-3"
              } ${
                isWorkspaceRoute || workspaceOpen
                  ? "bg-[#2a2d37] text-white"
                  : "text-gray-400 hover:bg-[#1a1d27] hover:text-white"
              }`}
            >
              <span className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <WorkspaceIcon className={`h-[18px] w-[18px] shrink-0 ${isWorkspaceRoute || workspaceOpen ? "text-white" : "text-gray-500 group-hover:text-white"}`} />
                {!collapsed ? <span className="truncate text-sm font-medium">Workspace</span> : null}
              </span>
              {!collapsed ? (
                workspaceOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                )
              ) : null}
            </button>

            {!collapsed && workspaceOpen ? (
              <div className="mt-2 space-y-1 pl-3">
                {workspaceItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    collapsed={false}
                    onNavigate={onNavigate}
                    nested
                  />
                ))}
              </div>
            ) : null}
          </li>

          {menuItems.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                isActive={pathname === item.href}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export default function Sidebar({
  mobileOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const isProviderRoute =
    pathname === "/provider-control" || pathname.startsWith("/provider-control/");
  const isWorkspaceRoute =
    pathname === "/workspace" || pathname.startsWith("/workspace/");
  const [providerManuallyOpen, setProviderManuallyOpen] = useState(false);
  const [workspaceManuallyOpen, setWorkspaceManuallyOpen] = useState(false);
  const [providerGroupOpenState, setProviderGroupOpenState] = useState<
    Record<string, boolean>
  >({});
  const providerOpen = isProviderRoute || providerManuallyOpen;
  const workspaceOpen = isWorkspaceRoute || workspaceManuallyOpen;
  const providerGroupOpen = useMemo(
    () =>
      providerGroups.reduce<Record<string, boolean>>((acc, group) => {
        const hasActiveChild = group.children.some((item) =>
          pathname.startsWith(item.href)
        );
        acc[group.id] = Boolean(providerGroupOpenState[group.id] || hasActiveChild);
        return acc;
      }, {}),
    [pathname, providerGroupOpenState]
  );

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[84vw] max-w-[280px] flex-col border-r border-white/5 bg-[#111217] text-white transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarNav
          onNavigate={onClose}
          pathname={pathname}
          collapsed={false}
          providerOpen={providerOpen}
          setProviderOpen={setProviderManuallyOpen}
          isProviderRoute={isProviderRoute}
          workspaceOpen={workspaceOpen}
          setWorkspaceOpen={setWorkspaceManuallyOpen}
          isWorkspaceRoute={isWorkspaceRoute}
          providerGroupOpen={providerGroupOpen}
          setProviderGroupOpen={setProviderGroupOpenState}
        />
      </aside>

      <aside
        className={`hidden shrink-0 self-start border-r border-white/5 bg-[#111217] text-white transition-[width] duration-300 lg:flex lg:flex-col ${
          collapsed ? "lg:w-24" : "lg:w-64"
        }`}
        style={desktopSidebarStyle}
      >
        <SidebarNav
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          providerOpen={providerOpen}
          setProviderOpen={setProviderManuallyOpen}
          isProviderRoute={isProviderRoute}
          workspaceOpen={workspaceOpen}
          setWorkspaceOpen={setWorkspaceManuallyOpen}
          isWorkspaceRoute={isWorkspaceRoute}
          providerGroupOpen={providerGroupOpen}
          setProviderGroupOpen={setProviderGroupOpenState}
        />
      </aside>
    </>
  );
}
