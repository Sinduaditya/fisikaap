import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { SimulationQuestion } from '@/services/api';

interface Props {
  currentQuestion: SimulationQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  onReset?: () => void;
  onSubmit?: () => void;
  onHint?: () => void;
  submitting?: boolean;
}

const SimulationControls: React.FC<Props> = ({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  onReset,
  onSubmit,
  onHint,
  submitting = false,
}) => {
  if (!currentQuestion) return null;

  return (
    <View style={styles.container}>
      {/* Progress Info */}
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
        <Text style={styles.scoreText}>
          Max Score: {currentQuestion.max_score} pts
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={onReset}
          disabled={submitting}
        >
          <Text style={styles.resetButtonText}>🔄 Reset</Text>
        </TouchableOpacity>

        {/* Hint Button */}
        {currentQuestion.hints && currentQuestion.hints.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.hintButton]}
            onPress={onHint}
            disabled={submitting}
          >
            <Text style={styles.hintButtonText}>
              💡 Hints ({currentQuestion.hints.length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            submitting && styles.buttonDisabled,
          ]}
          onPress={onSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? '⏳ Submitting...' : '✅ Submit Answer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Difficulty Indicator */}
      <View style={styles.difficultyContainer}>
        <Text style={styles.difficultyLabel}>Difficulty:</Text>
        <View style={[
          styles.difficultyBadge,
          getDifficultyStyle(currentQuestion.difficulty)
        ]}>
          <Text style={[
            styles.difficultyText,
            { color: getDifficultyColor(currentQuestion.difficulty) }
          ]}>
            {currentQuestion.difficulty}
          </Text>
        </View>
      </View>
    </View>
  );
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return colors.success;
    case 'intermediate': return colors.warning;
    case 'advanced': return colors.error;
    default: return colors.primary;
  }
};

const getDifficultyStyle = (difficulty: string) => {
  const color = getDifficultyColor(difficulty);
  return {
    backgroundColor: color + '20',
    borderColor: color + '40',
  };
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  // Progress Info
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
  },
  scoreText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.accent,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Reset Button
  resetButton: {
    backgroundColor: colors.muted + '20',
    borderWidth: 1,
    borderColor: colors.muted + '40',
  },
  resetButtonText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
  },

  // Hint Button
  hintButton: {
    backgroundColor: colors.info + '20',
    borderWidth: 1,
    borderColor: colors.info + '40',
  },
  hintButtonText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.info,
  },

  // Submit Button
  submitButton: {
    backgroundColor: colors.primary,
    flex: 2,
  },
  submitButtonText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#FFFFFF',
  },

  // Difficulty
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  difficultyLabel: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
  },
});

export default SimulationControls;