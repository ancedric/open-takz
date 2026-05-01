import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Bienvenue sur Corevia',
    description: 'Votre compagnon de chantier digital pour une gestion transparente et efficace.',
    color: '#2a2f4f'
  },
  {
    id: '2',
    title: 'Pointage Intelligent',
    description: 'Scannez le QR Code de votre entreprise pour valider votre présence en un instant.',
    color: '#004581'
  },
  {
    id: '3',
    title: 'Assistant MANI AI',
    description: 'Une intelligence artificielle dédiée pour analyser vos performances et vous conseiller.',
    color: '#1e293b'
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      (slidesRef.current as any)?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/Login');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={SLIDES}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.color }]}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={viewableItemsChanged}
        ref={slidesRef}
      />

      <View style={styles.footer}>
        {/* Indicateurs de pagination (Dots) */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: {
    width,
    height: height * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  textContainer: { alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    height: height * 0.25,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#2a2f4f',
  },
  button: {
    backgroundColor: '#2a2f4f',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});