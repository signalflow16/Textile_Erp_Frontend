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
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingCartOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { frappeApi, useLogoutUserMutation } from "@/store/api/frappeApi";
import { clearAuth } from "@/store/features/auth/authSlice";
import { setCsrfToken } from "@/store/features/session/sessionSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const { Text, Title } = Typography;

export function AppShell({
  section = "Stock",
  title,
  breadcrumb,
  subtitle,
  actions,
  children
}: {
  section?: string;
  title: string;
  breadcrumb?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const me = useAppSelector((state) => state.auth.me);
  const [logoutUser, logoutState] = useLogoutUserMutation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const breadcrumbItems = breadcrumb
    ?.split(">")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ title: item }));
  const userName = me?.full_name || me?.first_name || me?.email || me?.user_id || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const modules = useMemo(
    () => [
      {
        key: "stock",
        label: "Stock",
        icon: <DatabaseOutlined />,
        href: "/stock",
        links: [
          { key: "stock-dashboard", label: "Dashboard", href: "/stock" },
          { key: "stock-items-list", label: "Items", href: "/stock/items" },
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
        links: [{ key: "buying-purchase-receipts", label: "Purchase Receipts", href: "/buying" }]
      },
      {
        key: "selling",
        label: "Selling",
        icon: <AppstoreOutlined />,
        href: "/selling",
        links: [{ key: "selling-sales-invoices", label: "Sales Invoices", href: "/selling" }]
      },
      {
        key: "admin",
        label: "Admin",
        icon: <TeamOutlined />,
        href: "/users",
        links: [{ key: "admin-users", label: "Users", href: "/users" }]
      }
    ],
    []
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

  const selectedPageKey = (() => {
    if (pathname.startsWith("/users")) {
      return "admin-users";
    }

    if (pathname.startsWith("/buying")) {
      return "buying-purchase-receipts";
    }

    if (pathname.startsWith("/selling")) {
      return "selling-sales-invoices";
    }

    if (pathname.startsWith("/stock/item-groups")) {
      return "stock-item-groups";
    }

    if (pathname.startsWith("/stock/balance")) {
      return "stock-balance";
    }

    if (pathname.startsWith("/stock/ledger")) {
      return "stock-ledger";
    }

    if (pathname.startsWith("/stock/warehouse-stock")) {
      return "stock-warehouse-stock";
    }

    if (pathname.startsWith("/stock/item-shortage")) {
      return "stock-item-shortage";
    }

    if (pathname.startsWith("/stock/stock-entry/create")) {
      return "stock-entry-create";
    }

    if (pathname.startsWith("/stock/stock-entry/list")) {
      return "stock-entry-list";
    }

    if (pathname.startsWith("/stock/warehouses")) {
      return "stock-warehouses";
    }

    if (pathname.startsWith("/stock/parties")) {
      return "stock-parties";
    }

    if (pathname === "/stock") {
      return "stock-dashboard";
    }

    return "stock-items-list";
  })();
  const selectedModuleKey = modules.find((module) => module.links.some((link) => link.key === selectedPageKey))?.key ?? "stock";

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
                <Link href={module.href} className="sidebar-module-header" onClick={handleNavLinkClick}>
                  <span className="sidebar-module-icon">{module.icon}</span>
                  <span className="sidebar-module-title">{module.label}</span>
                </Link>
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
            {actions}
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
