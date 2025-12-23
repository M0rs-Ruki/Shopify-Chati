import { LayoutDashboard, List, Settings } from "lucide-react";

interface AppHeaderProps {
  shop: string;
  selectedTab: string;
  onTabChange: (tabId: string) => void;
}

export const AppHeader = ({
  shop,
  selectedTab,
  onTabChange,
}: AppHeaderProps) => {
  const tabs = [
    { id: "dashboard", content: "Overview", icon: LayoutDashboard },
    { id: "events", content: "Event Logs", icon: List },
    { id: "settings", content: "Settings", icon: Settings },
  ];

  return (
    <div className="app-header">
      <div className="app-header-title-section">
        <h1 className="app-title">
          <span className="app-title-brand">Chati</span>
          <span className="app-title-badge">Enterprise</span>
        </h1>
        <p className="app-connection-status">
          <span className="app-connection-indicator">
            <span className="app-connection-ping"></span>
            <span className="app-connection-dot"></span>
          </span>
          Connected to {shop}
        </p>
      </div>

      {/* Navigation - Flat Style with Green Accents */}
      <div className="app-nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`app-nav-tab ${
                isActive ? "app-nav-tab-active" : "app-nav-tab-inactive"
              }`}
            >
              <Icon
                className={`app-nav-tab-icon ${isActive ? "app-nav-tab-icon-active" : ""}`}
              />
              {tab.content}
            </button>
          );
        })}
      </div>
    </div>
  );
};

