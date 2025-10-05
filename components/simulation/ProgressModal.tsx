import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { PhysicsTopic } from '@/services/api';

interface Props {
  visible: boolean;
  topic: PhysicsTopic | null;
  completedQuestions: number;
  totalQuestions: number;
  onContinue: () => void;
}

const ProgressModal: React.FC<Props> = ({
  visible,
  topic,
  completedQuestions,
  totalQuestions,
  onContinue,
}) => {
  if (!topic) return null;

  const progressPercentage = Math.round((completedQuestions / totalQuestions) * 100);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Celebration */}
          <Text style={styles.celebration}>🎉</Text>
          <Text style={styles.title}>Congratulations!</Text>
          
          {/* Topic Info */}
          <Text style={styles.topicName}>{topic.name}</Text>
          <Text style={styles.subtitle}>Topic Completed</Text>

          {/* Progress Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedQuestions}</Text>
              <Text style={styles.statLabel}>Questions Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progressPercentage}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={onContinue}
          >
            <Text style={styles.continueButtonText}>
              Continue Learning
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: width * 0.9,
    minWidth: width * 0.8,
  },
  celebration: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.success,
    marginBottom: 8,
  },
  topicName: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.success,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.muted + '30',
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});

export default ProgressModal;