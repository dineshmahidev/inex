import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AnimatedSplash from '@/components/AnimatedSplash';

export default function SplashTransition() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatedSplash
      ready={ready}
      onFinish={() => router.replace('/(tabs)')}
    />
  );
}
