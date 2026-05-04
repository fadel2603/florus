import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddPlantFormSheet from '@/components/AddPlantFormSheet';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { AIPlantAnalysis } from '@/constants/api';
import { Plant, Task, addPlant, addTasksForDay, logHistoryEvent } from '@/constants/data';

const { height: SCREEN_H } = Dimensions.get('window');

const HEALTH_CONFIG = {
  healthy: { label: 'En bonne santé', color: '#2E7D32', bg: '#E8F5E9', icon: 'checkmark-circle' as const },
  warning: { label: 'Attention requise', color: Colors.orange, bg: Colors.orangeBg, icon: 'warning' as const },
  critical: { label: 'Soins urgents', color: '#C62828', bg: '#FFEBEE', icon: 'alert-circle' as const },
};

const LIGHT_LABEL: Record<string, string> = {
  low: 'Peu de lumière',
  medium: 'Lumière moyenne',
  high: 'Plein soleil',
};

type TaskTypeConfig = { color: string; emoji: string; label: string };
const TASK_TYPE_CONFIG: Record<string, TaskTypeConfig> = {
  water:        { color: '#2196F3', emoji: '💧', label: 'Arroser' },
  observe:      { color: '#EB7C05', emoji: '👁️', label: 'Observer' },
  repot:        { color: '#795548', emoji: '🪴', label: 'Rempoter' },
  fertilize:    { color: '#2E7D32', emoji: '🌿', label: 'Fertiliser' },
  rotate:       { color: '#F9A825', emoji: '☀️', label: 'Tourner' },
  clean_leaves: { color: '#66BB6A', emoji: '🧹', label: 'Nettoyer' },
  mist:         { color: '#4FC3F7', emoji: '💦', label: 'Brumiser' },
  trim:         { color: '#9C27B0', emoji: '✂️', label: 'Tailler' },
  treat:        { color: '#C62828', emoji: '🚨', label: 'Traiter' },
};

function scheduleAITasks(
  tasks: AIPlantAnalysis['tasks'],
  plantId: string,
  plantName: string,
): void {
  const todayDow = new Date().getDay();
  tasks.forEach((aiTask, i) => {
    const targetDow = (todayDow + aiTask.daysFromNow) % 7;
    const days = new Set<number>([targetDow]);

    if (aiTask.recurring && aiTask.recurringDays && aiTask.recurringDays > 0 && aiTask.recurringDays < 7) {
      for (let d = targetDow + aiTask.recurringDays; d < targetDow + 7; d += aiTask.recurringDays) {
        days.add(d % 7);
      }
    }

    days.forEach(dow => {
      const task: Task = {
        id: `ai_${plantId}_${i}_${dow}`,
        plantId,
        plantName,
        type: aiTask.type,
        done: false,
      };
      addTasksForDay(dow, [task]);
    });
  });
}

export default function ResultScreen() {
  const { photo, analysis: analysisParam } = useLocalSearchParams<{ photo: string; analysis: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const [showForm, setShowForm] = useState(false);

  const analysis = useMemo<AIPlantAnalysis | null>(() => {
    if (!analysisParam) return null;
    try { return JSON.parse(analysisParam); } catch { return null; }
  }, [analysisParam]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleConfirm = (customName: string, customLocation: 'Intérieur' | 'Extérieur') => {
    if (analysis) {
      const plantId = `ai_${Date.now()}`;
      const newPlant: Plant = {
        id: plantId,
        name: customName,
        species: analysis.species,
        image: photo ?? '',
        waterFrequency: `Tous les ${analysis.wateringFrequency} jours`,
        lastWatered: 'Jamais',
        health: analysis.health === 'healthy' ? 'good' : analysis.health,
        lightNeeds: analysis.lightNeeds,
        location: analysis.location,
        healthNote: analysis.healthNote,
        issues: analysis.issues,
      };
      addPlant(newPlant);
      scheduleAITasks(analysis.tasks, plantId, customName);

      // Log "added" event
      logHistoryEvent(plantId, {
        id: `added_${plantId}`,
        type: 'added',
        label: 'Plante ajoutée',
        date: new Date().toISOString(),
        icon: 'leaf-outline',
        color: Colors.primary,
      });

      // Log AI analysis event
      const healthLabel: Record<string, string> = { healthy: 'Bonne santé', warning: 'Attention requise', critical: 'Soins urgents' };
      const issueNote = analysis.issues.length > 0 ? ` · ${analysis.issues[0]}` : '';
      logHistoryEvent(plantId, {
        id: `analysis_${plantId}`,
        type: 'analysis',
        label: `Analyse IA : ${healthLabel[analysis.health] ?? analysis.health}${issueNote}`,
        date: new Date().toISOString(),
        icon: 'sparkles-outline',
        color: '#9C27B0',
      });
    }
    setShowForm(false);
    router.replace('/(tabs)/plants' as any);
  };

  // — Error state: API returned nothing —
  if (!analysis) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        {photo && <Image source={{ uri: photo }} style={styles.bg} />}
        <View style={styles.bgGradient} />
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>
        <Animated.View style={[styles.card, { bottom: insets.bottom + 16, opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.orange} style={{ marginBottom: 12 }} />
          <Text style={styles.name}>Identification échouée</Text>
          <Text style={[styles.latinName, { marginBottom: 20 }]}>
            Vérifiez votre connexion internet et réessayez avec une photo plus nette.
          </Text>
          <Button
            label="Réessayer"
            onPress={() => router.replace('/add-plant/camera' as any)}
            variant="primary"
            size="lg"
            fullWidth
          />
        </Animated.View>
      </View>
    );
  }

  const health = HEALTH_CONFIG[analysis.health] ?? HEALTH_CONFIG.warning;
  const locationLabel = analysis.location === 'indoor' ? 'Intérieur' : 'Extérieur';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {photo && <Image source={{ uri: photo }} style={styles.bg} />}
      <View style={styles.bgGradient} />

      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={22} color="white" />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.card,
          { bottom: insets.bottom + 16, opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
        ]}
      >
        {/* Plant name + species */}
        <Text style={styles.name}>{analysis.name}</Text>
        <Text style={styles.latinName}>{analysis.species}</Text>

        {/* Health badge + note */}
        <View style={[styles.healthBadge, { backgroundColor: health.bg }]}>
          <Ionicons name={health.icon} size={14} color={health.color} />
          <Text style={[styles.healthLabel, { color: health.color }]}>{health.label}</Text>
        </View>
        <Text style={styles.healthNote}>{analysis.healthNote}</Text>

        {/* Scrollable extra content */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Care chips */}
          <View style={styles.careRow}>
            <View style={styles.careChip}>
              <Ionicons name={analysis.location === 'indoor' ? 'home-outline' : 'sunny-outline'} size={13} color={Colors.textSecondary} />
              <Text style={styles.careChipText}>{locationLabel}</Text>
            </View>
            <View style={styles.careChip}>
              <Ionicons name="sunny-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.careChipText}>{LIGHT_LABEL[analysis.lightNeeds] ?? analysis.lightNeeds}</Text>
            </View>
            <View style={styles.careChip}>
              <Ionicons name="water-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.careChipText}>{`/${analysis.wateringFrequency}j`}</Text>
            </View>
          </View>

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <View style={styles.issuesSection}>
              <View style={styles.issuesTitleRow}>
                <Ionicons name="warning-outline" size={13} color={Colors.orange} />
                <Text style={styles.issuesSectionTitle}>Points d'attention</Text>
              </View>
              {analysis.issues.map((issue, i) => (
                <Text key={i} style={styles.issueItem}>• {issue}</Text>
              ))}
            </View>
          )}

          {/* Tasks preview */}
          {analysis.tasks.length > 0 && (
            <View style={styles.tasksSection}>
              <Text style={styles.tasksSectionTitle}>
                {analysis.tasks.length} tâche{analysis.tasks.length > 1 ? 's' : ''} générée{analysis.tasks.length > 1 ? 's' : ''}
              </Text>
              {analysis.tasks.slice(0, 5).map((task, i) => {
                const cfg = TASK_TYPE_CONFIG[task.type] ?? { color: Colors.textMuted, emoji: '📌', label: task.type };
                return (
                  <View key={i} style={styles.taskRow}>
                    <Text style={styles.taskEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.taskTitle, { flex: 1 }]}>{task.title}</Text>
                    {task.recurring && task.recurringDays != null && (
                      <Text style={styles.taskRecurring}>/{task.recurringDays}j</Text>
                    )}
                  </View>
                );
              })}
              {analysis.tasks.length > 5 && (
                <Text style={styles.taskMore}>+{analysis.tasks.length - 5} autres tâches</Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Action buttons */}
        <Text style={styles.question}>Est-ce bien cette plante ?</Text>
        <Button
          label="Confirmer et ajouter"
          onPress={() => setShowForm(true)}
          variant="primary"
          size="lg"
          icon="checkmark"
          fullWidth
          style={styles.confirmBtn}
        />
        <Button
          label="Réessayer"
          onPress={() => router.replace('/add-plant/camera' as any)}
          variant="text"
        />
      </Animated.View>

      <AddPlantFormSheet
        visible={showForm}
        detectedName={analysis.name}
        detectedLocation={locationLabel}
        photoUri={photo ?? null}
        onClose={() => setShowForm(false)}
        onConfirm={handleConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxHeight: SCREEN_H * 0.76,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 32,
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },
  name: {
    fontFamily: FontFamily.titleDisplay,
    fontSize: 34,
    color: Colors.textDark,
    textAlign: 'center',
  },
  latinName: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 7,
  },
  healthLabel: {
    fontFamily: FontFamily.labelMedium,
    fontSize: 13,
  },
  healthNote: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  scroll: {
    width: '100%',
    flexGrow: 0,
    maxHeight: SCREEN_H * 0.22,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 4,
  },
  careRow: {
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  careChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sectionBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  careChipText: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  issuesSection: {
    width: '100%',
    backgroundColor: Colors.orangeBg,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  issuesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  issuesSectionTitle: {
    fontFamily: FontFamily.labelMedium,
    fontSize: 13,
    color: Colors.orange,
  },
  issueItem: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tasksSection: {
    width: '100%',
    backgroundColor: Colors.sectionBg,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  tasksSectionTitle: {
    fontFamily: FontFamily.labelMedium,
    fontSize: 13,
    color: Colors.textDark,
    marginBottom: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskEmoji: {
    fontSize: 14,
    lineHeight: 18,
    width: 20,
    textAlign: 'center',
  },
  taskTitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  taskRecurring: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  taskMore: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  question: {
    fontFamily: FontFamily.calendarMedium,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 14,
    marginBottom: 12,
  },
  confirmBtn: {
    marginBottom: 10,
  },
});
