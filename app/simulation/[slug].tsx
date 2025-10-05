import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";

import { colors, fonts } from "@/constants/theme";
import { apiService, SimulationQuestion, PhysicsTopic } from "@/services/api";
import QuestionCard from "@/components/simulation/QuestionCard";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface SimulationState {
  topic: PhysicsTopic | null;
  questions: SimulationQuestion[];
  currentQuestion: SimulationQuestion | null;
  currentQuestionIndex: number;
  completedQuestions: number[];
  loading: boolean;
  submitting: boolean;
  feedback: any;
  showFeedback: boolean;
}

export default function SimulationSlugScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const webViewRef = useRef<WebView>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  const [simulation, setSimulation] = useState<SimulationState>({
    topic: null,
    questions: [],
    currentQuestion: null,
    currentQuestionIndex: 0,
    completedQuestions: [],
    loading: true,
    submitting: false,
    feedback: null,
    showFeedback: false,
  });

  useEffect(() => {
    if (slug) {
      loadSimulationData();
    }
  }, [slug]);

  if (!slug) {
    router.replace("/(tabs)/topics");
    return null;
  }

  const loadSimulationData = async () => {
    try {
      setSimulation((prev) => ({ ...prev, loading: true }));

      // ✅ Load topic questions using existing API
      const questionsResponse = await apiService.getTopicQuestions(slug);

      if (questionsResponse.status === "success" && questionsResponse.data) {
        const { topic, questions, current_question } = questionsResponse.data;

        if (!questions || questions.length === 0) {
          throw new Error("No questions available for this topic");
        }

        setSimulation((prev) => ({
          ...prev,
          topic,
          questions,
          currentQuestion: current_question || questions[0],
          currentQuestionIndex: 0,
          loading: false,
        }));

        console.log("✅ Simulation data loaded:", {
          topic: topic.name,
          questionsCount: questions.length,
        });
      } else {
        throw new Error("Failed to load simulation data");
      }
    } catch (error) {
      console.error("❌ Failed to load simulation:", error);
      setSimulation((prev) => ({ ...prev, loading: false }));

      Alert.alert(
        "Error Loading Simulation",
        "Failed to load simulation data. Please try again.",
        [
          { text: "Retry", onPress: loadSimulationData },
          { text: "Go Back", onPress: () => router.back() },
        ]
      );
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case "simulationReady":
          setWebViewLoading(false);
          console.log("✅ Simulation loaded successfully");
          break;

        case "answerSubmit":
          if (message.data && simulation.currentQuestion) {
            console.log("📊 Answer received from simulation:", message.data);
            handleSubmitAnswer(message.data);
          }
          break;

        case "parameterUpdate":
          console.log("🔄 Parameters updated:", message.data);
          break;

        default:
          console.log("📝 Simulation message:", message);
      }
    } catch (error) {
      console.error("❌ WebView message parsing error:", error);
    }
  };

  const handleSubmitAnswer = async (userAnswer: any) => {
    if (!simulation.currentQuestion) return;

    try {
      setSimulation((prev) => ({ ...prev, submitting: true }));

      // ✅ Ensure userAnswer is properly formatted
      let formattedAnswer = userAnswer;

      // If userAnswer is not already an object, wrap it
      if (typeof userAnswer !== "object" || userAnswer === null) {
        formattedAnswer = { answer: userAnswer };
      }

      console.log("📤 Submitting formatted answer:", formattedAnswer);

      const response = await apiService.submitAnswerWithProgression(
        simulation.currentQuestion.id,
        formattedAnswer, // ✅ Properly formatted
        undefined, // time_taken
        {
          source: "webview_simulation",
          timestamp: new Date().toISOString(),
          question_id: simulation.currentQuestion.id,
        }
      );

      if (response.status === "success" && response.data) {
        const {
          is_correct,
          score_earned,
          feedback,
          next_question,
          topic_completed,
        } = response.data;

        console.log("✅ Submit result:", {
          is_correct,
          score_earned,
          has_next_question: !!next_question,
          topic_completed,
        });

        // ✅ Show feedback
        setSimulation((prev) => ({
          ...prev,
          feedback: {
            is_correct,
            score_earned,
            message: feedback,
            topic_completed,
            next_question,
          },
          showFeedback: true,
          submitting: false,
        }));

        // ✅ Auto progress to next question if correct
        if (is_correct && next_question && !topic_completed) {
          setTimeout(() => {
            setSimulation((prev) => ({
              ...prev,
              currentQuestion: next_question,
              currentQuestionIndex: prev.currentQuestionIndex + 1,
              completedQuestions: [
                ...prev.completedQuestions,
                simulation.currentQuestion!.id,
              ],
              showFeedback: false,
            }));

            // Reload WebView for new question
            setWebViewLoading(true);
            webViewRef.current?.reload();
          }, 2000);
        }
      } else {
        throw new Error(response.message || "Failed to submit answer");
      }
    } catch (error: any) {
      console.error("❌ Submit answer error:", error);

      setSimulation((prev) => ({
        ...prev,
        submitting: false,
      }));

      // ✅ Show error-specific feedback
      let errorMessage = "Failed to submit answer. Please try again.";

      if (error.message?.includes("Validation failed")) {
        errorMessage =
          "Invalid answer format. Please check your input and try again.";
      } else if (error.message?.includes("Network")) {
        errorMessage = "Network error. Please check your connection.";
      }

      Alert.alert("Submission Error", errorMessage);
    }
  };

  const handleWebViewError = (error: any) => {
    console.error("❌ WebView error:", error);
    setWebViewLoading(false);
    Alert.alert(
      "Simulation Error",
      "Failed to load simulation. Please check your connection and try again.",
      [
        {
          text: "Retry",
          onPress: () => {
            setWebViewLoading(true);
            webViewRef.current?.reload();
          },
        },
        { text: "Go Back", onPress: () => router.back() },
      ]
    );
  };

  const handleGoBack = () => {
    Alert.alert(
      "Exit Simulation",
      "Your progress will be saved. Are you sure you want to exit?",
      [
        { text: "Continue", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Simulation",
      "Are you sure you want to reset the current simulation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setWebViewLoading(true);
            webViewRef.current?.reload();
          },
        },
      ]
    );
  };

  const closeFeedback = () => {
    setSimulation((prev) => ({ ...prev, showFeedback: false }));

    if (simulation.feedback?.topic_completed) {
      router.back();
    }
  };

  if (simulation.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={true} message="Loading simulation..." />
      </SafeAreaView>
    );
  }

  if (!simulation.topic || !simulation.currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>😅 Simulation Not Found</Text>
          <Text style={styles.errorMessage}>
            Topic "{slug}" is not available or has no questions.
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

  // ✅ Build simulation URL
  const simulationUrl = `${apiService
    .getBaseUrl()
    .replace("/api", "")}/simulation/${slug}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={handleGoBack}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{simulation.topic.name}</Text>
          <Text style={styles.headerSubtitle}>
            Question {simulation.currentQuestionIndex + 1} of{" "}
            {simulation.questions.length}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerResetButton}
          onPress={handleReset}
        >
          <Text style={styles.headerResetIcon}>⟲</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${
                ((simulation.currentQuestionIndex + 1) /
                  simulation.questions.length) *
                100
              }%`,
            },
          ]}
        />
      </View>

      {/* ✅ Scrollable Content */}
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Question Card */}
        <View style={styles.questionSection}>
          <QuestionCard
            question={simulation.currentQuestion}
            questionNumber={simulation.currentQuestionIndex + 1}
          />
        </View>

        {/* ✅ WebView Simulation Section */}
        <View style={styles.simulationSection}>
          <View style={styles.simulationHeader}>
            <Text style={styles.simulationTitle}>
              🎮 Interactive Simulation
            </Text>
            <Text style={styles.simulationDescription}>
              Use the simulation below to explore the physics and find the
              answer. Submit your answer using the button in the simulation.
            </Text>
          </View>

          <View style={styles.webViewContainer}>
            {webViewLoading && (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading simulation...</Text>
              </View>
            )}

            <WebView
              ref={webViewRef}
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
                console.log("✅ WebView simulation loaded");
              }}
              onError={handleWebViewError}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn("⚠️ WebView HTTP error:", nativeEvent.statusCode);
              }}
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>📝 How to Use</Text>
          <Text style={styles.instructionsText}>
            1. Read the question carefully above{"\n"}
            2. Adjust parameters in the simulation{"\n"}
            3. Observe the physics behavior{"\n"}
            4. Click "Submit Answer" in the simulation when ready{"\n"}
            5. Your answer will be automatically evaluated
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ✅ Loading Overlay for Submissions */}
      <LoadingOverlay
        visible={simulation.submitting}
        message="Submitting answer..."
      />

      {/* ✅ Feedback Modal */}
      {simulation.showFeedback && simulation.feedback && (
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackModal}>
            <Text style={styles.feedbackTitle}>
              {simulation.feedback.is_correct ? "🎉 Correct!" : "💪 Try Again!"}
            </Text>
            <Text style={styles.feedbackScore}>
              Score: {simulation.feedback.score_earned}/
              {simulation.currentQuestion?.max_score || 100}
            </Text>
            <Text style={styles.feedbackMessage}>
              {simulation.feedback.message}
            </Text>

            {simulation.feedback.topic_completed ? (
              <TouchableOpacity
                style={[
                  styles.feedbackButton,
                  { backgroundColor: colors.success },
                ]}
                onPress={closeFeedback}
              >
                <Text style={styles.feedbackButtonText}>🏆 Complete Topic</Text>
              </TouchableOpacity>
            ) : simulation.feedback.is_correct ? (
              <TouchableOpacity
                style={[
                  styles.feedbackButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={closeFeedback}
              >
                <Text style={styles.feedbackButtonText}>➡️ Next Question</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.feedbackButton,
                  { backgroundColor: colors.accent },
                ]}
                onPress={closeFeedback}
              >
                <Text style={styles.feedbackButtonText}>🔄 Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackIcon: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  headerResetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerResetIcon: {
    fontSize: 18,
    color: "#FFFFFF",
  },

  // Progress
  progressContainer: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.accent,
  },

  // Scrollable Content
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  // Question Section
  questionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ✅ Simulation Section
  simulationSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  simulationHeader: {
    marginBottom: 16,
  },
  simulationTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: colors.primary,
    marginBottom: 8,
  },
  simulationDescription: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    lineHeight: 20,
  },
  webViewContainer: {
    height: screenHeight * 0.5, // 50% of screen height - ✅ SCROLLABLE
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.background,
    position: "relative",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
  },

  // Instructions Section
  instructionsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  instructionsTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: colors.primary,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    lineHeight: 22,
  },

  // Feedback Modal
  feedbackOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  feedbackModal: {
    backgroundColor: colors.card,
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  feedbackTitle: {
    fontSize: fonts.sizes.title,
    fontFamily: fonts.title,
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  feedbackScore: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: colors.accent,
    marginBottom: 16,
  },
  feedbackMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  feedbackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  feedbackButtonText: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.body,
    color: "#FFFFFF",
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
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
    color: "#FFFFFF",
  },
});
