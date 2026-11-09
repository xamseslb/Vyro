import { message as uiText } from "../../i18n/language";
export const backgroundSupported = false;
export async function requestBackgroundAccess() {
  throw new Error(uiText("Bakgrunnsopptak krever mobilappen."));
}
export async function startBackground() {}
export async function stopBackground() {}
export async function verifyBackgroundRecording() {}
