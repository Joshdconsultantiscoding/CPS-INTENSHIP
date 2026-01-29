"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react"; // Import AlertCircle here
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Eye, EyeOff, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AI_PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    description: "Fast inference, free tier available",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    defaultModel: "llama-3.3-70b-versatile",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models, paid service",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "together",
    name: "Together AI",
    description: "Open source models, free credits",
    models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1"],
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    docsUrl: "https://api.together.xyz/settings/api-keys",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Multiple providers, free models available",
    models: ["meta-llama/llama-3.3-70b-instruct:free", "google/gemma-2-9b-it:free", "mistralai/mistral-7b-instruct:free"],
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    docsUrl: "https://openrouter.ai/keys",
  },
];

interface APISettings {
  provider: string;
  api_key: string;
  model: string;
  is_active: boolean;
}

const isAdmin = true; // Declare the isAdmin variable here

export function ApiSettings() {
  // This component is only rendered for admins via the parent component
  const [settings, setSettings] = useState<APISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    provider: "groq",
    api_key: "",
    model: "llama-3.3-70b-versatile",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/ai");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          setFormData({
            provider: data.settings.provider,
            api_key: "", // Don't populate the key for security
            model: data.settings.model,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    const providerConfig = AI_PROVIDERS.find((p) => p.id === provider);
    setFormData({
      ...formData,
      provider,
      model: providerConfig?.defaultModel || "",
    });
  };

  const handleSave = async () => {
    if (!formData.api_key && !settings?.api_key) {
      toast.error("Please enter an API key");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formData.provider,
          api_key: formData.api_key || undefined, // Only send if changed
          model: formData.model,
          is_active: true,
        }),
      });

      if (res.ok) {
        toast.success("API settings saved successfully");
        fetchSettings();
        setFormData((prev) => ({ ...prev, api_key: "" }));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("API connection successful!");
      } else {
        toast.error(data.error || "API connection failed");
      }
    } catch (error) {
      toast.error("Failed to test API connection");
    } finally {
      setTesting(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI Settings
          </CardTitle>
          <CardDescription>
            AI assistant configuration is managed by administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Contact your administrator to configure AI settings for the platform.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === formData.provider);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          AI Assistant Configuration
        </CardTitle>
        <CardDescription>
          Configure the AI provider and API key for the intern assistant. This will be used across all intern portals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings?.is_active && (
          <Alert className="border-success/50 bg-success/10">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              AI Assistant is active using {AI_PROVIDERS.find((p) => p.id === settings.provider)?.name} ({settings.model})
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select value={formData.provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span>{provider.name}</span>
                      <span className="text-xs text-muted-foreground">
                        - {provider.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProvider && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <a
                href={selectedProvider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                Get your API key from {selectedProvider.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder={settings?.api_key ? "••••••••••••••••" : "Enter your API key"}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {settings?.api_key && !formData.api_key && (
              <p className="text-xs text-muted-foreground">
                API key is configured. Enter a new key to replace it.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={formData.model}
              onValueChange={(model) => setFormData({ ...formData, model })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider?.models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
          {settings?.is_active && (
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="font-medium mb-2">Free API Providers</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><strong>Groq:</strong> Free tier with generous limits, fast inference</li>
            <li><strong>Together AI:</strong> $25 free credits on signup</li>
            <li><strong>OpenRouter:</strong> Free models available (marked with :free)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
