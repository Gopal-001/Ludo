import { Dimensions } from 'react-native';
import { Animated } from 'react-native';
import { Rect } from 'react-native-svg';

const SCREEN_W = Dimensions.get('window').width;
export const BOARD_SIZE = Math.min(SCREEN_W - 16, 400);
export const CELL = BOARD_SIZE / 15;
export const AnimatedRect = Animated.createAnimatedComponent(Rect);
