"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  BarChart3,
  MessageSquare,
  Award,
  Sparkles,
  ArrowRight,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const features = [
  {
    icon: CheckCircle2,
    title: "Task Management",
    description:
      "Organize and track internship tasks with priorities, deadlines, and status updates.",
  },
  {
    icon: FileText,
    title: "Daily Reports",
    description:
      "Submit and review daily progress reports with mood tracking and accomplishment logs.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Track performance metrics with comprehensive charts and scoring systems.",
  },
  {
    icon: MessageSquare,
    title: "Team Messaging",
    description:
      "Real-time communication with direct messages and channel-based discussions.",
  },
  {
    icon: Award,
    title: "Rewards System",
    description:
      "Earn points and unlock achievements for completing tasks and milestones.",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description:
      "Get intelligent help with task explanations, report writing, and performance insights.",
  },
];

export default function HomePage() {
  const router = useRouter();

  // Supabase auth check removed to prevent conflicts with Clerk
  // We now rely on Clerk middleware/components for auth state

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/80 shadow-md">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">InternHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 opacity-20">
            <div className="h-[600px] w-[600px] rounded-full bg-linear-to-br from-primary via-accent to-primary blur-3xl" />
          </div>
        </div>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-pretty text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Manage Your Internship Journey with Confidence
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl">
            A comprehensive platform for interns and administrators to track
            tasks, submit reports, monitor performance, and communicate
            effectively.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/sign-up">
                Start Your Journey
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">
                Sign In to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful tools designed specifically for internship management
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-none bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Calendar className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join InternHub today and take control of your internship experience
            with powerful tools and insights.
          </p>
          <Button
            size="lg"
            className="mt-8 gap-2"
            onClick={() => window.location.href = "/auth/sign-up"}
          >
            Create Your Account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">InternHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            2026 InternHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
