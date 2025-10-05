import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, fonts } from '@/constants/theme';

interface Props {
  simulationUrl: string;
  onMessage: (event: any) => void;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export interface SimulationWebViewRef {
  postMessage: (message: string) => void;
  reload: () => void;
}

const SimulationWebView = forwardRef<SimulationWebViewRef, Props>(
  ({ simulationUrl, onMessage, onLoad, onError }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      postMessage: (message: string) => {
        webViewRef.current?.postMessage(message);
      },
      reload: () => {
        webViewRef.current?.reload();
      },
    }));

    const renderLoading = () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading simulation...</Text>
      </View>
    );

    const renderError = () => (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Simulation Error</Text>
        <Text style={styles.errorMessage}>
          Failed to load simulation. Please check your internet connection.
        </Text>
      </View>
    );

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: simulationUrl }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onMessage={onMessage}
          onLoad={onLoad}
          onError={onError}
          renderLoading={renderLoading}
          renderError={renderError}
          // Enhanced WebView settings
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          scalesPageToFit={true}
          scrollEnabled={true}
          bounces={false}
          // Security settings
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          // Performance settings
          cacheEnabled={true}
          incognito={false}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: fonts.sizes.subtitle,
    fontFamily: fonts.subtitle,
    color: colors.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
});

SimulationWebView.displayName = 'SimulationWebView';

export default SimulationWebView;