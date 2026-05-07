import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/fonts';
import type { Task } from '@/constants/data';
import TaskItem from '@/components/TaskItem';
import IconCircle from '@/components/ui/IconCircle';
import Badge from '@/components/ui/Badge';

interface TaskGroupProps {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onPhotoPress?: (task: Task) => void;
}

export default function TaskGroup({
  label,
  iconName,
  iconColor,
  iconBg,
  tasks,
  onToggle,
  onPhotoPress,
}: TaskGroupProps) {
  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <IconCircle
          size={34}
          backgroundColor={iconBg}
          icon={iconName}
          iconColor={iconColor}
          iconSize={17}
        />
        <Text style={styles.label}>{label}</Text>
        <Badge label={String(tasks.length)} variant="count" />
      </View>
      <View style={styles.taskList}>
        {tasks.map(t => (
          <TaskItem
            key={t.id}
            task={t}
            onToggle={onToggle}
            onPhotoPress={onPhotoPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: '#E8EDE4',
    borderRadius: 20,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  label: {
    fontFamily: FontFamily.nameSemiBold,
    fontSize: 16,
    color: Colors.textDark,
    flex: 1,
  },
  taskList: {
    gap: 8,
  },
});
