"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PortalSettings {
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

export function usePortalSettings() {
    const [settings, setSettings] = useState<PortalSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("api_settings")
                    .select("setting_value")
                    .eq("setting_key", "portal_settings")
                    .maybeSingle();

                if (error) throw error;

                if (data?.setting_value) {
                    setSettings({ ...defaultSettings, ...data.setting_value });
                }
            } catch (error) {
                console.error("Error loading portal settings:", error);
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, []);

    return { settings, loading };
}
