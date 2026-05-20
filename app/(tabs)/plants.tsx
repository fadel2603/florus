import React, { useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { Plant } from '@/constants/data';
import { fetchPlants } from '@/lib/db/plants';
import { useUser } from '@/context/UserContext';
import AddPlantSheet from '@/components/AddPlantSheet';
import ScreenHeader from '@/components/ui/ScreenHeader';
import PlantCard from '@/components/ui/PlantCard';
import GlassButton from '@/components/ui/GlassButton';

export default function PlantsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useUser();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      setLoading(true);
      fetchPlants(userId).then(p => {
        setPlants(p);
        setLoading(false);
      });
    }, [userId])
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

  const subtitle = loading
    ? 'Chargement…'
    : plants.length === 0
      ? 'Aucune plante encore'
      : `${plants.length} plante${plants.length > 1 ? 's' : ''} suivie${plants.length > 1 ? 's' : ''}`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <ScreenHeader
          title="Mes plantes 🪴"
          subtitle={subtitle}
          titleOpacity={titleOpacity}
          subtitleSize={16}
          right={
            <GlassButton size={48} onPress={() => setAddSheetVisible(true)}>
              <Ionicons name="add" size={24} color={Colors.textDark} />
            </GlassButton>
          }
        />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primaryDark} />
          </View>
        ) : plants.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="leaf" size={48} color={Colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>Aucune plante pour l'instant</Text>
            <Text style={styles.emptySubtitle}>
              Ajoute ta première plante pour commencer à suivre ses soins au quotidien.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => setAddSheetVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.textDark} />
              <Text style={styles.emptyBtnText}>Ajouter une plante</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {plants.map(plant => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onPress={() => router.push(`/plant/${plant.id}` as any)}
              />
            ))}
          </View>
        )}

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

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 16,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: FontFamily.headerBold,
    fontSize: 20,
    color: Colors.textDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyBtnText: {
    fontFamily: FontFamily.calendarBold,
    fontSize: 15,
    color: Colors.textDark,
  },
});
