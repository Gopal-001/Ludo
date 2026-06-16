import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ConfigScreen } from './src/screens/ConfigScreen';

type Screen = 'home' | 'game' | 'config';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <GestureHandlerRootView style={styles.root}>
      {screen === 'home' && (
        <HomeScreen
          onStart={() => setScreen('game')}
          onConfig={() => setScreen('config')}
        />
      )}
      {screen === 'game' && (
        <GameScreen onExit={() => setScreen('home')} />
      )}
      {screen === 'config' && (
        <ConfigScreen onBack={() => setScreen('home')} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
