import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import type { Plant } from '@/constants/data';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onFavPress?: () => void;
}

export default function PlantCard({ plant, onPress, onFavPress }: PlantCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: plant.image }} style={styles.image} />
        {plant.careStatus && (
          <View style={styles.badge}>
            <Ionicons name="heart-outline" size={14} color={Colors.orange} />
            <Text style={styles.badgeText}>{plant.careStatus}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.favBtn} onPress={onFavPress} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={18} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.nameBlock}>
        <Text style={styles.plantName}>{plant.name}</Text>
        <Text style={styles.species}>{plant.species}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>🌿 2 mois</Text>
        <Text style={styles.metaText}>🏠 Intérieur</Text>
        <Text style={styles.metaText}>📸 3 photos</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECECEC',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 4,
    gap: 16,
  },
  imageWrap: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.sectionBg,
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: 13,
    left: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.orangeBg,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: FontFamily.labelMedium,
    fontSize: 14,
    color: Colors.orange,
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(166,167,167,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  plantName: {
    fontFamily: FontFamily.nameSemiBold,
    fontSize: 29,
    color: Colors.textDark,
    textAlign: 'center',
  },
  species: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  metaText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
