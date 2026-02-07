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
    company_name?: string;
    company_logo_url?: string;
}

const defaultSettings: PortalSettings = {
    tasks_enabled: true,
    reports_enabled: true,
    messages_enabled: true,
    calendar_enabled: true,
    performance_enabled: true,
    rewards_enabled: true,
    ai_assistant_enabled: true,
    company_name: "InternHub",
};

import { useNotifications } from "@/components/notifications/notification-engine";

export function usePortalSettings() {
    const { settings, isLoadingSettings } = useNotifications();

    // Deep merge server settings with defaults to ensure no missing flags
    const mergedSettings = {
        ...defaultSettings,
        ...(settings || {})
    };

    return {
        settings: mergedSettings,
        loading: isLoadingSettings
    };
}
