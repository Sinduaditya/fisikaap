import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import { colors, fonts } from '@/constants/theme';
import { apiService, SimulationQuestion } from '@/services/api';
import QuestionCard from '@/components/simulation/QuestionCard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function QuestionDetailScreen() {
  const router = useRouter();
  const { id, topicSlug, topicName } = useLocalSearchParams<{
    id: string;
    topicSlug: string;
    topicName: string;
  }>();

  const [question, setQuestion] = useState<SimulationQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [webViewLoading, setWebViewLoading] = useState(true);

  // ✅ Check if topic supports simulation
  const hasSimulation = ['gaya-gesek', 'hukum-newton', 'energi-kinetik', 'momentum'].includes(topicSlug || '');

  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [id]);

  const loadQuestion = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const response = await apiService.getQuestion(parseInt(id));
      
      if (response.status === 'success' && response.data) {
        setQuestion(response.data.question);
        console.log('✅ Question loaded:', response.data.question.question_text);
      } else {
        throw new Error('Failed to load question');
      }
    } catch (error) {
      console.error('❌ Failed to load question:', error);
      Alert.alert(
        'Error',
        'Failed to load question. Please try again.',
        [
          { text: 'Retry', onPress: loadQuestion },
          { text: 'Go Back', onPress: () => router.back() },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = () => {
    if (!question || !topicSlug) return;

    console.log('🚀 Starting simulation for topic:', topicSlug);
    
    // ✅ Navigate to simulation dengan slug
    router.push(`/simulation/${topicSlug}`);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'simulationReady':
          setWebViewLoading(false);
          console.log('✅ Simulation preview loaded successfully');
          break;
          
        case 'answerSubmit':
          console.log('📊 Answer preview from simulation:', message.data);
          Alert.alert(
            'Preview Answer',
            `Answer received: ${JSON.stringify(message.data, null, 2)}\n\nTo submit for scoring, use the full simulation.`,
            [{ text: 'OK' }]
          );
          break;
          
        default:
          console.log('📝 Simulation preview message:', message);
      }
    } catch (error) {
      console.error('❌ WebView message parsing error:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay 
          visible={true} 
          message="Loading question..." 
        />
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>😅 Question Not Found</Text>
          <Text style={styles.errorMessage}>
            Question with ID "{id}" is not available.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Build simulation preview URL
  const simulationUrl = hasSimulation && topicSlug 
    ? `${apiService.getBaseUrl().replace('/api', '')}/simulation/${topicSlug}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Question Details</Text>
          <Text style={styles.headerSubtitle}>{topicName}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <QuestionCard
          question={question}
          questionNumber={1}
        />

        {/* ✅ Simulation Preview Section */}
        {hasSimulation && simulationUrl && (
          <View style={styles.simulationCard}>
            <Text style={styles.simulationTitle}>🎮 Simulation Preview</Text>
            <Text style={styles.simulationDescription}>
              Preview of the interactive simulation. Click "Start Simulation" below for the full experience.
            </Text>
            
            <View style={styles.webViewContainer}>
              {webViewLoading && (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading simulation preview...</Text>
                </View>
              )}
              
              <WebView
                source={{ uri: simulationUrl }}
                style={styles.webView}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={false}
                scalesPageToFit={true}
                scrollEnabled={true}
                onLoadEnd={() => {
                  setWebViewLoading(false);
                  console.log('✅ WebView simulation preview loaded');
                }}
                onError={(error) => {
                  console.error('❌ WebView preview error:', error);
                  setWebViewLoading(false);
                }}
              />
            </View>
          </View>
        )}

        {/* Simulation Type Info */}
        <View style={styles.simulationInfo}>
          <Text style={styles.simulationTitle}>🎮 Simulation Type</Text>
          <Text style={styles.simulationType}>{question.simulation_type}</Text>
          <Text style={styles.simulationDescription}>
            This question uses interactive physics simulation based on {question.simulation_type}.
          </Text>
        </View>

        {/* Parameters Details */}
        {question.parameters && Object.keys(question.parameters).length > 0 && (
          <View style={styles.parametersCard}>
            <Text style={styles.parametersTitle}>⚙️ Simulation Parameters</Text>
            <View style={styles.parametersGrid}>
              {Object.entries(question.parameters).map(([key, value]) => (
                <View key={key} style={styles.parameterRow}>
                  <Text style={styles.parameterKey}>{key}:</Text>
                  <Text style={styles.parameterValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Evaluation Criteria */}
        {question.evaluation_criteria && Object.keys(question.evaluation_criteria).length > 0 && (
          <View style={styles.criteriaCard}>
            <Text style={styles.criteriaTitle}>🎯 Evaluation Criteria</Text>
            <View style={styles.criteriaGrid}>
              {Object.entries(question.evaluation_criteria).map(([key, value]) => (
                <View key={key} style={styles.criteriaRow}>
                  <Text style={styles.criteriaKey}>{key}:</Text>
                  <Text style={styles.criteriaValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Difficulty & Score Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Difficulty:</Text>
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
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Max Score:</Text>
            <Text style={styles.scoreValue}>{question.max_score} points</Text>
          </View>
          {question.hints && question.hints.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hints Available:</Text>
              <Text style={styles.hintsValue}>{question.hints.length} hints</Text>
            </View>
          )}
        </View>

        {/* Development note for topics without simulation */}
        {!hasSimulation && (
          <View style={styles.devNote}>
            <Text style={styles.devNoteTitle}>Development Note</Text>
            <Text style={styles.devNoteText}>
              Interactive simulation for this topic is currently under development. 
              You can study the question and provide answers based on theory.
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartSimulation}
        >
          <Text style={styles.startButtonText}>
            🚀 Start {hasSimulation ? 'Interactive ' : ''}Simulation
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return '#10B981';
    case 'intermediate': return '#F59E0B';
    case 'advanced': return '#EF4444';
    default: return colors.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  headerSpacer: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ✅ Simulation Preview Section
  simulationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  webViewContainer: {
    height: screenHeight * 0.4, // 40% of screen height
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
  },

  // Cards
  simulationInfo: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  simulationTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: colors.primary,
    marginBottom: 8,
  },
  simulationType: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.accent,
    marginBottom: 8,
  },
  simulationDescription: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    lineHeight: 22,
  },

  parametersCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  parametersTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: colors.primary,
    marginBottom: 16,
  },
  parametersGrid: {
    gap: 8,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  parameterKey: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    flex: 1,
  },
  parameterValue: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.accent,
  },

  criteriaCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  criteriaTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: colors.primary,
    marginBottom: 16,
  },
  criteriaGrid: {
    gap: 8,
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  criteriaKey: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    flex: 1,
  },
  criteriaValue: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.success,
  },

  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: fonts.sizes.caption,
    fontFamily: fonts.body,
  },
  scoreValue: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.accent,
  },
  hintsValue: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: colors.info,
  },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#FFFFFF',
  },

  // Dev Note
  devNote: {
    backgroundColor: '#FEF3C7',
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  devNoteTitle: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.body,
    color: '#92400E',
    marginBottom: 4,
  },
  devNoteText: {
    fontSize: fonts.sizes.small,
    fontFamily: fonts.bodyRegular,
    color: '#92400E',
    lineHeight: 18,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: '#FFFFFF',
  },
});