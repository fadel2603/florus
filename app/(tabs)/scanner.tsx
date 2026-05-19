import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import AISheet from '@/components/AISheet';

export default function ScannerScreen() {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.replace('/(tabs)/' as any);
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <AISheet visible onClose={handleClose} />
    </View>
  );
}
