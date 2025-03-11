import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../src/theme/colors';

interface SessionExpiredModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SessionExpiredModal({ visible, onClose }: SessionExpiredModalProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalText, { color: theme.text }]}>
            Oturumunuzun süresi dolmuştur
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    minWidth: 100,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
