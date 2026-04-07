"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Layout, Menu, Space, Tag, Typography } from "antd";
import {
  AppstoreOutlined,
  DatabaseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  ShoppingCartOutlined
} from "@ant-design/icons";

const { Header, Content, Sider } = Layout;
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
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  return (
    <Layout className="app-layout">
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
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
        <div className="brand-panel">
          <Text className="brand-kicker">ERPNext Commerce</Text>
          <Title level={4} className="brand-title">
            Textile ERP
          </Title>
          <Text className="brand-copy">
            React, Next.js, Ant Design, and ERPNext working together for operational workflows.
          </Text>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={["stock-items"]}
          items={[
            {
              key: "stock-header",
              type: "group",
              label: "Stock",
              children: [
                {
                  key: "stock-items",
                  icon: <DatabaseOutlined />,
                  label: <Link href="/stock/items">Item Master</Link>
                }
              ]
            },
            {
              key: "future-header",
              type: "group",
              label: "Planned Modules",
              children: [
                {
                  key: "warehouse",
                  icon: <ShopOutlined />,
                  label: "Warehouse"
                },
                {
                  key: "purchase",
                  icon: <ShoppingCartOutlined />,
                  label: "Purchase"
                },
                {
                  key: "sales",
                  icon: <AppstoreOutlined />,
                  label: "Sales"
                }
              ]
            }
          ]}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="app-header-main">
            <div>
              <Space size="small" align="center">
                <Button
                  type="text"
                  size="large"
                  className="sidebar-toggle-btn"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed((prev) => !prev)}
                />
                <Tag color="blue">{section}</Tag>
                <Text className="header-title">{title}</Text>
              </Space>
              {breadcrumb ? <div className="header-breadcrumb">{breadcrumb}</div> : null}
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
