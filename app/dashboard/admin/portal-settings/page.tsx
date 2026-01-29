"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Settings, Save } from "lucide-react";

interface PortalSettings {
  tasks_enabled: boolean;
  reports_enabled: boolean;
  messages_enabled: boolean;
  calendar_enabled: boolean;
  performance_enabled: boolean;
  rewards_enabled: boolean;
  ai_assistant_enabled: boolean;
}

const defaultSettings: PortalSettings = {
  tasks_enabled: true,
  reports_enabled: true,
  messages_enabled: true,
  calendar_enabled: true,
  performance_enabled: true,
  rewards_enabled: true,
  ai_assistant_enabled: true,
};

export default function PortalSettingsPage() {
  const [settings, setSettings] = useState<PortalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("api_settings")
      .select("*")
      .eq("setting_key", "portal_settings")
      .single();

    if (data?.setting_value) {
      setSettings({ ...defaultSettings, ...data.setting_value });
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from("api_settings")
      .upsert({
        setting_key: "portal_settings",
        setting_value: settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "setting_key",
      });

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Portal settings saved successfully");
    }
    setSaving(false);
  };

  const toggleSetting = (key: keyof PortalSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal Settings</h1>
          <p className="text-muted-foreground">
            Configure which features are available to interns
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Intern Portal Features
          </CardTitle>
          <CardDescription>
            Enable or disable features visible to interns in their dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tasks">Tasks</Label>
              <p className="text-sm text-muted-foreground">
                Allow interns to view and manage their assigned tasks
              </p>
            </div>
            <Switch
              id="tasks"
              checked={settings.tasks_enabled}
              onCheckedChange={() => toggleSetting("tasks_enabled")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reports">Daily Reports</Label>
              <p className="text-sm text-muted-foreground">
                Allow interns to submit daily progress reports
              </p>
            </div>
            <Switch
              id="reports"
              checked={settings.reports_enabled}
              onCheckedChange={() => toggleSetting("reports_enabled")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="messages">Messages</Label>
              <p className="text-sm text-muted-foreground">
                Allow interns to send and receive messages
              </p>
            </div>
            <Switch
              id="messages"
              checked={settings.messages_enabled}
              onCheckedChange={() => toggleSetting("messages_enabled")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="calendar">Calendar</Label>
              <p className="text-sm text-muted-foreground">
                Allow interns to view calendar events
              </p>
            </div>
            <Switch
              id="calendar"
              checked={settings.calendar_enabled}
              onCheckedChange={() => toggleSetting("calendar_enabled")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="performance">Performance</Label>
              <p className="text-sm text-muted-foreground">
                Allow interns to view their performance metrics
              </p>
            </div>
            <Switch
              id="performance"
              checked={settings.performance_enabled}
              onCheckedChange={() => toggleSetting("performance_enabled")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rewards">Rewards</Label>
              <p className="text-sm text-muted-foreground">
                Allow interns to view rewards and achievements
              </p>
            </div>
            <Switch
              id="rewards"
              checked={settings.rewards_enabled}
              onCheckedChange={() => toggleSetting("rewards_enabled")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai_assistant">AI Assistant</Label>
              <p className="text-sm text-muted-foreground">
                Allow interns to use the AI assistant
              </p>
            </div>
            <Switch
              id="ai_assistant"
              checked={settings.ai_assistant_enabled}
              onCheckedChange={() => toggleSetting("ai_assistant_enabled")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
