import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { colors, fonts } from '@/constants/theme';

interface Props {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<Props> = ({ visible, message = 'Loading...' }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  message: {
    marginTop: 16,
    fontSize: fonts.sizes.body,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    textAlign: 'center',
  },
});

export default LoadingOverlay;