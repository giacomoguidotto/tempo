import { AppRegistry } from "react-native";
import { registerBackgroundHandler } from "./src/features/beat/background";
import AlarmRoot from "./src/alarm/alarm-root";

registerBackgroundHandler();
AppRegistry.registerComponent("alarm", () => AlarmRoot);

import "expo-router/entry";
