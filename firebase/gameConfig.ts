import { httpsCallable } from "firebase/functions";
import { functions } from "./config";

// Cloud Functions callable endpoints (NOT USED)
export const spendDailyAndFetchQuestion = httpsCallable(
  functions,
  "spendDailyAndFetchQuestion"
);
export const spendTicketAndFetchChoiceQuestion = httpsCallable(
  functions,
  "spendTicketAndFetchChoiceQuestion"
);
export const submitDailyAnswer = httpsCallable(functions, "submitDailyAnswer");
export const recordChoicePlay = httpsCallable(functions, "recordChoicePlay");
export const getGameState = httpsCallable(functions, "getGameState");
