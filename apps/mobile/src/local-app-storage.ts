import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  readLocalAppState,
  type LocalAppState,
} from "./local-app-state";

const LOCAL_APP_STATE_KEY = "sokcho-moa:local-app-state:v1";

export async function loadLocalAppState() {
  const raw = await AsyncStorage.getItem(LOCAL_APP_STATE_KEY);
  return readLocalAppState(raw);
}

export async function persistLocalAppState(state: LocalAppState) {
  await AsyncStorage.setItem(LOCAL_APP_STATE_KEY, JSON.stringify(state));
}
