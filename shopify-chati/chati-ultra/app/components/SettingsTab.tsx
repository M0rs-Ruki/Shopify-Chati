import { Settings } from "lucide-react";
import { ModernCard } from "./ModernCard";
import { Button } from "./Button";

export const SettingsTab = () => {
  return (
    <div className="app-settings-container">
      <ModernCard className="app-settings-card">
        <div className="app-settings-icon-wrapper">
          <Settings className="app-settings-icon" />
        </div>
        <h2 className="app-settings-title">Configuration</h2>
        <p className="app-settings-description">
          Advanced settings and configuration options for Chati are currently
          under development. Check back soon for API keys and webhooks
          customization.
        </p>
        <Button variant="primary" disabled className="app-settings-button">
          Coming Soon
        </Button>
      </ModernCard>
    </div>
  );
};

