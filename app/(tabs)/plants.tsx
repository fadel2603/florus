import React, { useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Animated,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { PLANTS, Plant } from '@/constants/data';
import AddPlantSheet from '@/components/AddPlantSheet';
import ScreenHeader from '@/components/ui/ScreenHeader';
import PlantCard from '@/components/ui/PlantCard';
import GlassButton from '@/components/ui/GlassButton';

export default function PlantsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [plants, setPlants] = useState<Plant[]>(PLANTS);

  // Re-read mutable PLANTS array each time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      setPlants([...PLANTS]);
    }, [])
  );

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      router.push({ pathname: '/add-plant/analyzing', params: { photo: result.assets[0].uri } } as any);
    }
  };

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <ScreenHeader
          title="Mes plantes 🪴"
          subtitle={`${plants.length} plantes suivies`}
          titleOpacity={titleOpacity}
          subtitleSize={16}
          right={
            <GlassButton size={48} onPress={() => setAddSheetVisible(true)}>
              <Ionicons name="add" size={24} color={Colors.textDark} />
            </GlassButton>
          }
        />

        <View style={styles.list}>
          {plants.map(plant => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onPress={() => router.push(`/plant/${plant.id}` as any)}
            />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      <AddPlantSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onCamera={() => router.push('/add-plant/camera' as any)}
        onGallery={handleGallery}
      />

      <LinearGradient
        colors={['rgba(245,247,240,0.3)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 35,
    zIndex: 10,
  },
  list: { gap: 16 },
});
