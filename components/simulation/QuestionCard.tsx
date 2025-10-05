import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { SimulationQuestion } from '@/services/api';

interface QuestionCardProps {
  question: SimulationQuestion;
  questionNumber: number;
}

export default function QuestionCard({ question, questionNumber }: QuestionCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{questionNumber}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(question.difficulty) + '20' }
          ]}>
            <Text style={[
              styles.difficultyText,
              { color: getDifficultyColor(question.difficulty) }
            ]}>
              {question.difficulty}
            </Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreIcon}>🏆</Text>
            <Text style={styles.scoreText}>{question.max_score} pts</Text>
          </View>
        </View>
      </View>

      {/* Question Text */}
      <Text style={styles.questionText}>{question.question_text}</Text>

      {/* Parameters */}
      {question.parameters && Object.keys(question.parameters).length > 0 && (
        <View style={styles.parametersSection}>
          <Text style={styles.sectionTitle}>⚙️ Parameters</Text>
          <View style={styles.parametersGrid}>
            {Object.entries(question.parameters).map(([key, value]) => (
              <View key={key} style={styles.parameterItem}>
                <Text style={styles.parameterKey}>{key}:</Text>
                <Text style={styles.parameterValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Hints */}
      {question.hints && question.hints.length > 0 && (
        <View style={styles.hintsSection}>
          <Text style={styles.sectionTitle}>💡 Hints</Text>
          {question.hints.map((hint, index) => (
            <Text key={index} style={styles.hintText}>
              {index + 1}. {hint}
            </Text>
          ))}
        </View>
      )}

      {/* Simulation Type */}
      <View style={styles.typeSection}>
        <Text style={styles.typeLabel}>Simulation Type:</Text>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{question.simulation_type}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#FFFFFF',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreIcon: {
    fontSize: 14,
  },
  scoreText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.accent,
  },

  // Question Text
  questionText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },

  // Sections
  parametersSection: {
    marginBottom: 16,
  },
  hintsSection: {
    marginBottom: 16,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.primary,
    marginBottom: 12,
  },

  // Parameters
  parametersGrid: {
    gap: 8,
  },
  parameterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  parameterKey: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    flex: 1,
  },
  parameterValue: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: colors.primary,
  },

  // Hints
  hintText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 8,
  },

  // Type
  typeLabel: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
  },
  typeTag: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
    color: colors.accent,
  },
});