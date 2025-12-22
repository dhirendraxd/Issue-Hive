/**
 * Firebase Status Component
 * Shows Firebase connection status and provides quick actions
 * Add this to your app to verify Firebase is working
 */

import { useState } from 'react';
import { auth, db, realtimeDb, storage, analytics } from '@/integrations/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { seedFirestoreIssues } from '@/integrations/firebase/seed';
import { toast } from 'sonner';

export function FirebaseStatus() {
  const { user, loading } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const services = [
    { name: 'Authentication', instance: auth, status: !!auth },
    { name: 'Firestore', instance: db, status: !!db },
    { name: 'Realtime DB', instance: realtimeDb, status: !!realtimeDb },
    { name: 'Storage', instance: storage, status: !!storage },
    { name: 'Analytics', instance: analytics, status: !!analytics },
  ];

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedFirestoreIssues();
      toast.success('Demo data seeded successfully!');
    } catch (error) {
      toast.error('Failed to seed data: ' + (error as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Firebase Status
          <Badge variant={services.every(s => s.status) ? 'default' : 'destructive'}>
            {services.every(s => s.status) ? 'Connected' : 'Issues Detected'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Firebase services connection status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Services Status */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Services</h3>
          <div className="grid grid-cols-2 gap-2">
            {services.map(service => (
              <div key={service.name} className="flex items-center gap-2">
                <span className={service.status ? 'text-green-500' : 'text-red-500'}>
                  {service.status ? '✅' : '❌'}
                </span>
                <span className="text-sm">{service.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Status */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Authentication</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking...</p>
          ) : user ? (
            <p className="text-sm">
              Signed in as: <span className="font-medium">{user.email}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not signed in</p>
          )}
        </div>

        {/* Environment */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Configuration</h3>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Project: {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not configured'}
            </p>
            <p className="text-xs text-muted-foreground">
              Auth Domain: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Not configured'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSeedData} 
            disabled={isSeeding || !db}
            size="sm"
          >
            {isSeeding ? 'Seeding...' : 'Seed Demo Data'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://console.firebase.google.com', '_blank', 'noopener,noreferrer')}
          >
            Open Console
          </Button>
        </div>

        {/* Instructions */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Add this component to your app temporarily to verify Firebase setup.
            Remove it once everything is working.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
