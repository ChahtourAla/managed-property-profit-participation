'use client';

import * as React from 'react';
import { Check, Bell, Lock, Globe, Palette, Monitor } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const notificationSettings = [
  {
    id: 'email',
    label: 'Email notifications',
    description: 'Receive workflow updates via email',
  },
  {
    id: 'push',
    label: 'Push notifications',
    description: 'Get real-time alerts on your device',
  },
  {
    id: 'contract',
    label: 'Contract alerts',
    description: 'Notify me about draft, validation, and closure events',
  },
  {
    id: 'reports',
    label: 'Report ready',
    description: 'Notify when a performance report is generated',
  },
  {
    id: 'settlement',
    label: 'Settlement alerts',
    description: 'Alert me when reconciliation, rewards, or burn is ready',
  },
  {
    id: 'security',
    label: 'Security alerts',
    description: 'Important account and authorization notifications',
  },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Workflow settings"
        description="Manage the demo experience and workflow notifications."
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Account</CardTitle>
              <CardDescription>Update the POC account information</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Settings saved.');
                }}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Project name</Label>
                    <Input id="company" defaultValue="Managed Property POC" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" defaultValue="Africa/Casablanca" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default currency</Label>
                    <Input id="currency" defaultValue="MAD" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input id="language" defaultValue="English (US)" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2">
                    <Check className="h-4 w-4" />
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Notification preferences
              </CardTitle>
              <CardDescription>Choose which POC workflow events trigger alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {notificationSettings.map((setting, i) => (
                <div key={setting.id}>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{setting.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {setting.description}
                      </span>
                    </div>
                    <Switch defaultChecked={i < 4} />
                  </div>
                  {i < notificationSettings.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Change Password</CardTitle>
              <CardDescription>Update your password regularly to keep the demo account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Password updated successfully.');
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="current">Current password</Label>
                  <Input id="current" type="password" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input id="confirm" type="password" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                  <Button type="submit">Update password</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
              <CardTitle className="text-base font-semibold">
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to the demo account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Enable 2FA</span>
                  <span className="text-xs text-muted-foreground">
                    Require a verification code at sign-in
                  </span>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Theme</CardTitle>
              <CardDescription>Choose your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Light', 'Dark', 'System'].map((theme) => (
                <div
                  key={theme}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{theme}</span>
                  </div>
                  <Switch defaultChecked={theme === 'System'} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
