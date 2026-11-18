// Every Expo Router app has a layout around its screens.
// <Slot /> just means: "show the current screen here".
import { Slot } from 'expo-router';

export default function RootLayout() {
  return <Slot />;
}
