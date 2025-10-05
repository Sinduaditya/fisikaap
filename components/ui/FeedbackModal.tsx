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
import { FeedbackData } from '@/types/simulation';

interface Props {
  visible: boolean;
  feedback: FeedbackData | null;
  onRetry: () => void;
  onContinue: () => void;
}

const FeedbackModal: React.FC<Props> = ({ visible, feedback, onRetry, onContinue }) => {
  if (!feedback) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon & Title */}
          <Text style={styles.icon}>
            {feedback.is_correct ? '✅' : '❌'}
          </Text>
          <Text style={styles.title}>
            {feedback.is_correct ? 'Correct!' : 'Try Again'}
          </Text>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={[
              styles.scoreValue,
              { color: feedback.is_correct ? colors.success : colors.warning }
            ]}>
              {feedback.score_earned}/100
            </Text>
          </View>

          {/* Feedback Message */}
          <Text style={styles.feedback}>
            {feedback.feedback}
          </Text>

          {/* Progress Info */}
          {feedback.is_correct && (
            <Text style={styles.progressInfo}>
              {feedback.topic_completed 
                ? '🎉 Topic completed!' 
                : '➡️ Moving to next question...'}
            </Text>
          )}

          {/* Action Button */}
          {!feedback.is_correct && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={onRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
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
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: width * 0.85,
    minWidth: width * 0.75,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.text,
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  scoreLabel: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
  },
  scoreValue: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
  },
  feedback: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  progressInfo: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.success,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
  },
});

export default FeedbackModal;