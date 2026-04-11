"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Input, Layout, Menu, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  AntDesignOutlined,
  BellOutlined,
  AuditOutlined,
  CalculatorOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  SkinOutlined,
  TeamOutlined
} from "@ant-design/icons";

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

const futureModules = [
  { key: "home", icon: <HomeOutlined />, label: "Home", href: "/home" },
  { key: "accounting", icon: <CalculatorOutlined />, label: "Accounting", href: "/accounting" },
  { key: "buying", icon: <ShoppingCartOutlined />, label: "Buying", href: "/buying" },
  { key: "selling", icon: <ShopOutlined />, label: "Selling", href: "/selling" },
  { key: "stock", icon: <DatabaseOutlined />, label: "Stock", href: "/stock" },
  { key: "assets", icon: <SkinOutlined />, label: "Assets", href: "/assets" },
  { key: "quality", icon: <AuditOutlined />, label: "Quality", href: "/quality" },
  { key: "support", icon: <QuestionCircleOutlined />, label: "Support", href: "/support" },
  { key: "users", icon: <TeamOutlined />, label: "Users", href: "/users" },
  { key: "settings", icon: <SettingOutlined />, label: "ERPNext Settings", href: "/settings" }
];

export function AppShell({
  title,
  breadcrumb,
  subtitle,
  actions,
  children
}: {
  title: string;
  breadcrumb?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [moduleSearch, setModuleSearch] = useState("");

  const selectedKey = (() => {
    const futureMatch = futureModules.find((module) => pathname === module.href || pathname.startsWith(`${module.href}/`));
    if (futureMatch) {
      return futureMatch.key;
    }

    if (pathname === "/stock/items/new") {
      return "stock-items-new";
    }

    if (pathname === "/stock/item-groups" || pathname.startsWith("/stock/item-groups/")) {
      return "stock-item-groups";
    }

    if (pathname === "/stock/items" || pathname.startsWith("/stock/items/")) {
      return "stock-items-list";
    }

    return "home";
  })();

  const navigableModules = [
    { key: "home", label: "Home", href: "/home" },
    { key: "stock-items-list", label: "Item List", href: "/stock/items" },
    { key: "stock-items-new", label: "Create Item", href: "/stock/items/new" },
    { key: "stock-item-groups", label: "Item Group", href: "/stock/item-groups" },
    ...futureModules.map(({ key, label, href }) => ({ key, label, href }))
  ];

  const normalizedSearch = moduleSearch.trim().toLowerCase();

  const menuItems = useMemo<MenuProps["items"]>(() => {
    const stockChildren = [
      {
        key: "stock-items-list",
        text: "Item List",
        label: <Link href="/stock/items">Item List</Link>
      },
      {
        key: "stock-items-new",
        icon: <FileAddOutlined />,
        text: "Create Item",
        label: <Link href="/stock/items/new">Create Item</Link>
      },
      {
        key: "stock-item-groups",
        text: "Item Group",
        label: <Link href="/stock/item-groups">Item Group</Link>
      }
    ];

    if (!normalizedSearch) {
      return futureModules.map((module) =>
        module.key === "stock"
          ? {
              key: module.key,
              icon: module.icon,
              label: module.label,
              children: stockChildren
            }
          : {
              key: module.key,
              icon: module.icon,
              label: <Link href={module.href}>{module.label}</Link>
            }
      );
    }

    const filteredChildren = stockChildren.filter((item) =>
      item.text.toLowerCase().includes(normalizedSearch)
    );

    const filteredItems: NonNullable<MenuProps["items"]> = [];

    futureModules.forEach((module) => {
      if (module.key === "stock") {
        if ("stock".includes(normalizedSearch) || filteredChildren.length > 0) {
          filteredItems.push({
            key: module.key,
            icon: module.icon,
            label: module.label,
            children: filteredChildren.length > 0 ? filteredChildren : stockChildren
          });
        }
        return;
      }

      if (module.label.toLowerCase().includes(normalizedSearch)) {
        filteredItems.push({
          key: module.key,
          icon: module.icon,
          label: <Link href={module.href}>{module.label}</Link>
        });
      }
    });

    return filteredItems;
  }, [normalizedSearch]);

  const triggerModuleSearch = () => {
    if (!normalizedSearch) {
      return;
    }

    const match = navigableModules.find((module) =>
      module.label.toLowerCase().includes(normalizedSearch)
    );

    if (match) {
      router.push(match.href);
      setModuleSearch("");
    }
  };

  return (
    <Layout className="app-layout">
      <Sider
        breakpoint="lg"
        collapsedWidth={isMobile ? 0 : 84}
        collapsible
        trigger={null}
        width={260}
        className="app-sider"
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          setCollapsed(broken);
        }}
      >
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
        {!collapsed || isMobile ? <div className="sidebar-section-title">Modules</div> : null}
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={["stock"]}
          inlineCollapsed={collapsed && !isMobile}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="top-nav">
            <div className="top-nav-left">
              <Button
                type="text"
                size="large"
                className="sidebar-toggle-btn"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((prev) => !prev)}
              />
              <div className="top-nav-title">
                <Text className="header-title">{title}</Text>
                {breadcrumb ? <div className="header-breadcrumb">{breadcrumb}</div> : null}
              </div>
            </div>
            <div className="top-nav-right">
              <div className="top-nav-search-group">
                <Input
                  className="top-nav-search"
                  prefix={<SearchOutlined />}
                  placeholder="Search modules"
                  value={moduleSearch}
                  onChange={(event) => setModuleSearch(event.target.value)}
                  onPressEnter={triggerModuleSearch}
                />
                <Button
                  className="top-nav-search-button"
                  icon={<SearchOutlined />}
                  onClick={triggerModuleSearch}
                />
              </div>
              <Button type="text" className="top-nav-icon" icon={<BellOutlined />} />
              <Button type="text" className="top-nav-help">
                Help
              </Button>
              <Avatar className="top-nav-avatar">A</Avatar>
            </div>
          </div>
          <div className="app-header-main">
            <div>
              {subtitle ? <div className="header-subtitle">{subtitle}</div> : null}
            </div>
            {actions ? <div className="app-header-actions">{actions}</div> : null}
          </div>
        </Header>
        {isMobile && !collapsed ? (
          <div className="sidebar-backdrop" onClick={() => setCollapsed(true)} aria-hidden />
        ) : null}
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
