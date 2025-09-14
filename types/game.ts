export interface GameState {
  lastResetDateMY: string;
  dailyRemaining: number;
  ticketsRemaining: number;
  streak: number;
  points: number; // Individual user points (+10 per completed game)
  lastDailyAnswerDateMY?: string;
  lastStreakEarnedDateMY?: string; // Track if streak was already earned today
}

export interface DailyQuestion {
  text: string;
  active: boolean;
  rand: number;
}

export interface ChoiceQuestion {
  type: 'this_or_that' | 'more_likely' | 'would_you_rather';
  question: string;
  choice1: string;
  choice2: string;
  active: boolean;
  rand: number;
}

export interface DailyResponse {
  qid: string;
  type: 'daily';
  answer: string;
  createdAt: any; // Firebase serverTimestamp
  malaysiaDate: string;
}

export interface ChoicePlay {
  qid: string;
  type: 'this_or_that' | 'more_likely' | 'would_you_rather';
  selected: 1 | 2;
  createdAt: any; // Firebase serverTimestamp
  malaysiaDate: string;
}

export interface SpendDailyResponse {
  question: DailyQuestion & { id: string };
  gameStateAfter: GameState;
}

export interface SpendTicketResponse {
  question: ChoiceQuestion & { id: string };
  gameStateAfter: GameState;
}

export type ChoiceGameType = 'this_or_that' | 'more_likely' | 'would_you_rather';