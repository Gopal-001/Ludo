import { useState } from 'react';
import { HomeScreen } from '../src/screens/HomeScreen';
import { GameScreen } from '../src/screens/GameScreen';
import { ConfigScreen } from '../src/screens/ConfigScreen';

type Screen = 'home' | 'game' | 'config';

export default function Index() {
  const [screen, setScreen] = useState<Screen>('home');

  if (screen === 'game') {
    return <GameScreen onExit={() => setScreen('home')} />;
  }

  if (screen === 'config') {
    return <ConfigScreen onBack={() => setScreen('home')} />;
  }

  return (
    <HomeScreen
      onStart={() => setScreen('game')}
      onConfig={() => setScreen('config')}
    />
  );
}
