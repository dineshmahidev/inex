import { Redirect } from 'expo-router';
import { useDatabase } from '@/context/DatabaseContext';

export default function Index() {
  const { settings, isLoading } = useDatabase();
  
  if (isLoading) return null;
  
  if (settings.hasOnboarded) {
    if (settings.isLocked && settings.pin) {
        return <Redirect href="/lock" />;
    }
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/onboarding" />;
}
