import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');

export default function QRScanner({ onScanSuccess, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Taille du carré de visée
  const qrSize = width * 0.65;

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Accès caméra requis pour pointer.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : ({ data }) => {
            setScanned(true);
            onScanSuccess(data);
        }}
        barcodeSettings={{ barcodeTypes: ["qr"] }}
      >
        {/* OVERLAY SOMBRE AVEC TROU CENTRAL */}
        <View style={styles.overlay}>
          <View style={styles.topMask} />
          
          <View style={styles.middleRow}>
            <View style={styles.sideMask} />
            <View style={[styles.focusedSpace, { width: qrSize, height: qrSize }]}>
              {/* Les coins de visée */}
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <View style={styles.sideMask} />
          </View>

          <View style={styles.bottomMask}>
            <Text style={styles.instructionText}>Cadrez le QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 999,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Masques sombres
  topMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleRow: {
    flexDirection: 'row',
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 30,
  },
  // Zone de scan
  focusedSpace: {
    backgroundColor: 'transparent',
  },
  // Styles de décoration (Coins verts)
  cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#10b981' },
  cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTopWidth: 5, borderRightWidth: 5, borderColor: '#10b981' },
  cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#10b981' },
  cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#10b981' },
  
  instructionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { marginTop: 30, padding: 15, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  cancelText: { color: '#fff', fontWeight: 'bold' },
});