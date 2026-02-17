"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Login / Sign Up page using split-screen layout with tabs.
 * Default tab: Sign In.
 */
export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("signin");

  return (
    <AuthLayout>
      {/* Mobile-only logo */}
      <div className="mb-8 lg:hidden">
        <h1 className="text-2xl font-bold text-brand">Agencial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered trading platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="signin" className="flex-1">
            Sign In
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="mt-6">
          <LoginForm />
        </TabsContent>

        <TabsContent value="signup" className="mt-6">
          <RegisterForm onSuccess={() => setActiveTab("signin")} />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
