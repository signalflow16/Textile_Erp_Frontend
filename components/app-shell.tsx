"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Breadcrumb, Button, Tooltip, Typography } from "antd";
import {
  AntDesignOutlined,
  AppstoreOutlined,
  CaretRightFilled,
  DatabaseOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { frappeApi, useLogoutUserMutation } from "@/core/api/frappeApi";
import { generateBreadcrumb } from "@/core/utils/breadcrumb";
import { clearAuth } from "@/core/store/authSlice";
import { setCsrfToken } from "@/core/store/sessionSlice";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";
import { useAppShell } from "@/core/context/app-shell-context";

const { Text, Title } = Typography;

type AppShellNavLink = {
  key: string;
  label: string;
  href: string;
  matchPrefixes?: string[];
};

type AppShellModule = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  matchPrefixes?: string[];
  links: AppShellNavLink[];
};

export function AppShell({
  section = "Stock",
  children
}: {
  section?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { config } = useAppShell();
  const title = config.title || "Dashboard";
  const subtitle = config.subtitle;
  const pathname = usePathname();
  const autoBreadcrumb = generateBreadcrumb(pathname) || "Dashboard";
  const dispatch = useAppDispatch();
  const me = useAppSelector((state) => state.auth.me);
  const [logoutUser, logoutState] = useLogoutUserMutation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isPathActive = (candidatePath: string, matchPrefixes: string[] = []) =>
    [candidatePath, ...matchPrefixes].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const breadcrumbItems = autoBreadcrumb
    .split(">")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ title: item }));
  const userName = me?.full_name || me?.first_name || me?.email || me?.user_id || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const modules = useMemo<AppShellModule[]>(
    () => [
      {
        key: "stock",
        label: "Stock",
        icon: <DatabaseOutlined />,
        href: "/stock",
        matchPrefixes: ["/stock"],
        links: [
          { key: "stock-dashboard", label: "Dashboard", href: "/stock" },
          { key: "stock-items-list", label: "Items", href: "/stock/items", matchPrefixes: ["/stock/items/new"] },
          { key: "stock-item-groups", label: "Item Groups", href: "/stock/item-groups" },
          { key: "stock-warehouses", label: "Warehouses", href: "/stock/warehouses" },
          { key: "stock-parties", label: "Parties", href: "/stock/parties" },
          { key: "stock-balance", label: "Stock Balance", href: "/stock/balance" },
          { key: "stock-ledger", label: "Stock Ledger", href: "/stock/ledger" },
          { key: "stock-warehouse-stock", label: "Warehouse Stock", href: "/stock/warehouse-stock" },
          { key: "stock-item-shortage", label: "Item Shortage", href: "/stock/item-shortage" },
          { key: "stock-entry-create", label: "Stock Entry Create", href: "/stock/stock-entry/create" },
          { key: "stock-entry-list", label: "Stock Entry List", href: "/stock/stock-entry/list" }
        ]
      },
      {
        key: "buying",
        label: "Buying",
        icon: <ShoppingCartOutlined />,
        href: "/buying",
        matchPrefixes: ["/buying"],
        links: [
          { key: "buying-dashboard", label: "Dashboard", href: "/buying" },
          { key: "buying-material-requests", label: "Material Requests", href: "/buying/material-requests" },
          { key: "buying-rfqs", label: "RFQs", href: "/buying/rfqs" },
          { key: "buying-supplier-quotations", label: "Supplier Quotations", href: "/buying/supplier-quotations" },
          { key: "buying-purchase-orders", label: "Purchase Orders", href: "/buying/purchase-orders" },
          { key: "buying-purchase-receipts", label: "Purchase Receipts", href: "/buying/purchase-receipts" },
          { key: "buying-purchase-invoices", label: "Purchase Invoices", href: "/buying/purchase-invoices" }
        ]
      },
      {
        key: "selling",
        label: "Selling",
        icon: <AppstoreOutlined />,
        href: "/selling",
        matchPrefixes: ["/selling"],
        links: [{ key: "selling-sales-invoices", label: "Sales Invoices", href: "/selling", matchPrefixes: ["/selling/sales-invoices"] }]
      },
      {
        key: "pos",
        label: "POS",
        icon: <AppstoreOutlined />,
        href: "/pos",
        matchPrefixes: ["/pos"],
        links: [
          { key: "pos-billing", label: "Billing", href: "/pos" },
          { key: "pos-opening", label: "Opening Entry", href: "/pos/opening" },
          { key: "pos-closing", label: "Closing Entry", href: "/pos/closing" }
        ]
      },
      {
        key: "admin",
        label: "Admin",
        icon: <TeamOutlined />,
        href: "/users",
        matchPrefixes: ["/users"],
        links: [{ key: "admin-users", label: "Users", href: "/users" }]
      }
    ],
    []
  );
  const selectedLink =
    modules.flatMap((module) => module.links.map((link) => ({ moduleKey: module.key, link }))).find(({ link }) =>
      isPathActive(link.href, link.matchPrefixes)
    ) ?? null;
  const selectedPageKey = selectedLink?.link.key ?? "stock-dashboard";
  const selectedModuleKey =
    selectedLink?.moduleKey ??
    modules.find((module) => isPathActive(module.href, module.matchPrefixes))?.key ??
    "stock";
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(modules.map((module) => [module.key, module.key === selectedModuleKey]))
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateViewport = (event: MediaQueryList | MediaQueryListEvent) => {
      const nextIsMobile = event.matches;
      setIsMobile(nextIsMobile);
      setCollapsed(nextIsMobile);
    };

    updateViewport(mediaQuery);
    const listener = (event: MediaQueryListEvent) => updateViewport(event);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);
  useEffect(() => {
    setExpandedModules((current) => ({
      ...current,
      [selectedModuleKey]: true
    }));
  }, [selectedModuleKey]);

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch {
      // Continue with local sign-out even when remote logout fails.
    } finally {
      dispatch(clearAuth());
      dispatch(setCsrfToken(null));
      dispatch(frappeApi.util.resetApiState());
      router.replace("/signin");
    }
  };
  const handleNavLinkClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
  };
  const toggleModule = (moduleKey: string) => {
    setExpandedModules((current) => ({
      ...current,
      [moduleKey]: !current[moduleKey]
    }));
  };

  const navigationMenu = (
    <>
      <div className={`brand-panel ${collapsed && !isMobile ? "brand-panel-collapsed" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <AntDesignOutlined />
          </div>
          <Title level={4} className="brand-title" style={{ display: collapsed && !isMobile ? "none" : undefined }}>
            Textile ERP
          </Title>
        </div>
        {!collapsed || isMobile ? <Text className="brand-kicker">ERPNext Workspace</Text> : null}
      </div>
      <nav className="sidebar-nav" aria-label="Application modules">
        {!collapsed || isMobile ? <div className="sidebar-section-title">Modules</div> : null}
        {collapsed && !isMobile ? (
          <div className="sidebar-icon-rail">
            {modules.map((module) => (
              <Tooltip key={module.key} title={module.label} placement="right">
                <Link
                  href={module.href}
                  className={`sidebar-icon-link ${selectedModuleKey === module.key ? "is-active" : ""}`}
                  onClick={handleNavLinkClick}
                >
                  {module.icon}
                </Link>
              </Tooltip>
            ))}
          </div>
        ) : (
          <div className="sidebar-module-list">
            {modules.map((module) => (
              <section
                key={module.key}
                className={`sidebar-module ${selectedModuleKey === module.key ? "is-active" : ""}`}
              >
                <div className="sidebar-module-header-row">
                  <Link href={module.href} className="sidebar-module-header" onClick={handleNavLinkClick}>
                    <span className="sidebar-module-icon">{module.icon}</span>
                    <span className="sidebar-module-title">{module.label}</span>
                  </Link>
                  <Button
                    type="text"
                    className="sidebar-module-toggle"
                    icon={expandedModules[module.key] ? <DownOutlined /> : <RightOutlined />}
                    onClick={() => toggleModule(module.key)}
                    aria-label={`${expandedModules[module.key] ? "Collapse" : "Expand"} ${module.label}`}
                  />
                </div>
                {expandedModules[module.key] ? (
                  <div className="sidebar-module-links">
                    {module.links.map((link) => (
                      <Link
                        key={link.key}
                        href={link.href}
                        className={`sidebar-module-link ${selectedPageKey === link.key ? "is-active" : ""}`}
                        onClick={handleNavLinkClick}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        )}
      </nav>
    </>
  );

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-main">
          <div className="app-header-copy">
            <div className="app-header-title-row">
              <Button
                type="text"
                className="sidebar-toggle-btn"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((prev) => !prev)}
              />
              <Text className="header-title">{title}</Text>
            </div>
            {breadcrumbItems?.length ? (
              <Breadcrumb
                className="header-breadcrumb"
                separator={<CaretRightFilled className="header-breadcrumb-separator" />}
                items={breadcrumbItems}
              />
            ) : null}
            {!collapsed && subtitle ? <div className="header-subtitle">{subtitle}</div> : null}
          </div>
          <div className="app-header-actions">
            <div className="app-header-profile">
              <Avatar size={32} className="app-header-avatar">
                {userInitial}
              </Avatar>
              {!isMobile ? <Text className="app-header-profile-name">{userName}</Text> : null}
            </div>
            <Button
              danger
              onClick={handleLogout}
              icon={<LogoutOutlined />}
              loading={logoutState.isLoading}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside
          className={[
            "app-sider",
            collapsed ? "app-sider-collapsed" : "",
            isMobile ? "app-sider-mobile" : ""
          ].filter(Boolean).join(" ")}
        >
          <div className="app-sider-scroll">{navigationMenu}</div>
        </aside>

        {isMobile && !collapsed ? (
          <div className="sidebar-backdrop" onClick={() => setCollapsed(true)} aria-hidden />
        ) : null}

        <main className="app-main">
          <div className="app-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
