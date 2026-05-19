import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { TabActions } from '@react-navigation/native';
import { Colors } from '@/constants/colors';
import AISheet from '@/components/AISheet';

export default function ScannerScreen() {
  const navigation = useNavigation();
  const [sheetVisible, setSheetVisible] = useState(false);

  // Open the sheet when this tab gains focus, close when it loses focus
  useFocusEffect(
    useCallback(() => {
      setSheetVisible(true);
      return () => setSheetVisible(false);
    }, [])
  );

  const handleClose = useCallback(() => {
    // Use TabActions.jumpTo — the correct way to switch tabs with NativeTabs
    navigation.dispatch(TabActions.jumpTo('index'));
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <AISheet visible={sheetVisible} onClose={handleClose} />
    </View>
  );
}
