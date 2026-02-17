"use client";

import { SettingsLayout } from "@/components/settings/settings-layout";
import { AccountSettings } from "@/components/settings/account-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { TradingDefaultsSettings } from "@/components/settings/trading-defaults-settings";
import type { SettingsCategory } from "@/components/settings/settings-layout";

const categoryComponents: Record<SettingsCategory, React.ComponentType> = {
  account: AccountSettings,
  appearance: AppearanceSettings,
  "trading-defaults": TradingDefaultsSettings,
};

export default function SettingsPage() {
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-4xl">
        <div className="border-b border-border p-6 pb-4">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <SettingsLayout>
          {(activeCategory) => {
            const Component = categoryComponents[activeCategory];
            return <Component />;
          }}
        </SettingsLayout>
      </div>
    </div>
  );
}
