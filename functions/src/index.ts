import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
initializeApp();
const db = getFirestore();

// Types
interface CoupleGameState {
  dailyRemaining: number;
  ticketsRemaining: number;
  streak: number;
  lastResetDateMY: string;
  hasPendingDaily?: boolean;
  hasPendingChoice?: number;
}

interface GameSession {
  questionId: string;
  type: 'daily' | 'this_or_that' | 'more_likely' | 'would_you_rather';
  questionText: string;
  choice1?: string;
  choice2?: string;
  initiatorUid: string;
  answers: Record<string, { answer: string | number; answeredAt: any }>;
  status: 'waiting' | 'completed';
  createdAt: any;
  malaysiaDate: string;
}

// Helper function to get today's date in Malaysia timezone
function getTodayMY(): string {
  const now = new Date();
  const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return malaysiaTime.toISOString().split('T')[0];
}

// Helper function to get yesterday's date in Malaysia timezone
function getYesterdayMY(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  const malaysiaTime = new Date(yesterday.getTime() + (8 * 60 * 60 * 1000));
  return malaysiaTime.toISOString().split('T')[0];
}

// Generate random alphanumeric code
function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Ensure game state is reset if needed
async function ensureResetIfNeeded(coupleId: string): Promise<void> {
  const todayMY = getTodayMY();
  const coupleRef = db.collection('couples').doc(coupleId);
  
  await db.runTransaction(async (transaction) => {
    const coupleDoc = await transaction.get(coupleRef);
    
    if (!coupleDoc.exists) {
      throw new HttpsError('not-found', 'Couple not found');
    }
    
    const coupleData = coupleDoc.data() as any;
    
    if (coupleData.lastResetDateMY !== todayMY) {
      const yesterdayMY = getYesterdayMY();
      const updateData: any = {
        lastResetDateMY: todayMY,
        dailyRemaining: 1,
        ticketsRemaining: 3,
      };
      
      // Check if streak should be reset due to skipping days
      if (coupleData.lastStreakEarnedDateMY && 
          coupleData.lastStreakEarnedDateMY !== yesterdayMY &&
          coupleData.lastStreakEarnedDateMY !== todayMY) {
        updateData.streak = 0;
      }
      
      transaction.update(coupleRef, updateData);
    }
  });
}

// Get random question from collection
async function getRandomQuestion(collectionName: string, type?: string) {
  let query = db.collection(collectionName).where('active', '==', true);
  
  if (type) {
    query = query.where('type', '==', type);
  }
  
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    throw new HttpsError('not-found', `No active questions found${type ? ` for type ${type}` : ''}`);
  }
  
  const docs = snapshot.docs;
  const randomIndex = Math.floor(Math.random() * docs.length);
  const doc = docs[randomIndex];
  
  return {
    id: doc.id,
    ...doc.data(),
  };
}

// 1. Generate couple invitation code
export const generateCoupleCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = request.auth.uid;
  
  // Check if user is already in a couple
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }
  
  const userData = userDoc.data();
  if (userData?.coupleId) {
    throw new HttpsError('already-exists', 'User is already paired');
  }

  // Generate unique code
  let code: string;
  let codeExists = true;
  let attempts = 0;
  
  while (codeExists && attempts < 10) {
    code = generateRandomCode(6);
    const existingInvite = await db.collection('couple_invites').doc(code).get();
    codeExists = existingInvite.exists;
    attempts++;
  }
  
  if (attempts >= 10) {
    throw new HttpsError('internal', 'Failed to generate unique code');
  }

  // Create invite with 1 hour expiry
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  await db.collection('couple_invites').doc(code!).set({
    inviterUid: uid,
    expiresAt: FieldValue.serverTimestamp(),
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    // Store actual expiry time for client
    clientExpiresAt: expiresAt,
  });

  return {
    code: code!,
    expiresAt: expiresAt.toISOString(),
  };
});

// 2. Validate couple code (before setting anniversary)
export const validateCoupleCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { code } = request.data;
  if (!code || typeof code !== 'string') {
    throw new HttpsError('invalid-argument', 'Invalid code');
  }

  const uid = request.auth.uid;
  
  // Check if user is already paired
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }
  
  const userData = userDoc.data();
  if (userData?.coupleId) {
    throw new HttpsError('already-exists', 'User is already paired');
  }

  // Get invite
  const inviteDoc = await db.collection('couple_invites').doc(code).get();
  if (!inviteDoc.exists) {
    throw new HttpsError('not-found', 'Invalid code');
  }

  const inviteData = inviteDoc.data();
  
  // Check if expired (using client expiry time)
  if (inviteData?.clientExpiresAt && new Date() > inviteData.clientExpiresAt.toDate()) {
    throw new HttpsError('deadline-exceeded', 'Code has expired');
  }

  if (inviteData?.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Code has already been used');
  }

  // Check if trying to use own code
  if (inviteData?.inviterUid === uid) {
    throw new HttpsError('invalid-argument', 'Cannot use your own invitation code');
  }

  // Get inviter info
  const inviterDoc = await db.collection('users').doc(inviteData?.inviterUid).get();
  if (!inviterDoc.exists) {
    throw new HttpsError('not-found', 'Inviter not found');
  }

  const inviterData = inviterDoc.data();
  
  // Check if inviter is still unpaired
  if (inviterData?.coupleId) {
    throw new HttpsError('failed-precondition', 'Inviter is already paired with someone else');
  }

  return {
    inviterUid: inviteData?.inviterUid,
    inviterName: inviterData?.displayName,
  };
});

// 3. Accept couple invitation and create couple
export const acceptCoupleInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { code, anniversary } = request.data;
  if (!code || !anniversary || typeof code !== 'string' || typeof anniversary !== 'string') {
    throw new HttpsError('invalid-argument', 'Invalid code or anniversary');
  }

  const uid = request.auth.uid;

  return await db.runTransaction(async (transaction) => {
    // Validate code again (in transaction)
    const inviteRef = db.collection('couple_invites').doc(code);
    const inviteDoc = await transaction.get(inviteRef);
    
    if (!inviteDoc.exists) {
      throw new HttpsError('not-found', 'Invalid code');
    }

    const inviteData = inviteDoc.data();
    
    if (inviteData?.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Code has already been used');
    }

    if (inviteData?.clientExpiresAt && new Date() > inviteData.clientExpiresAt.toDate()) {
      throw new HttpsError('deadline-exceeded', 'Code has expired');
    }

    const inviterUid = inviteData?.inviterUid;
    
    // Check both users are still unpaired
    const userRef = db.collection('users').doc(uid);
    const inviterRef = db.collection('users').doc(inviterUid);
    
    const [userDoc, inviterDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(inviterRef)
    ]);

    if (!userDoc.exists || !inviterDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    if (userDoc.data()?.coupleId || inviterDoc.data()?.coupleId) {
      throw new HttpsError('failed-precondition', 'One or both users are already paired');
    }

    // Create couple
    const coupleRef = db.collection('couples').doc();
    const todayMY = getTodayMY();
    
    const coupleData = {
      members: [inviterUid, uid],
      status: 'active',
      anniversary,
      createdAt: FieldValue.serverTimestamp(),
      lastResetDateMY: todayMY,
      dailyRemaining: 1,
      ticketsRemaining: 3,
      streak: 0,
    };

    transaction.set(coupleRef, coupleData);

    // Update both users
    transaction.update(userRef, { coupleId: coupleRef.id });
    transaction.update(inviterRef, { coupleId: coupleRef.id });

    // Mark invite as consumed
    transaction.update(inviteRef, { status: 'consumed' });

    return {
      coupleId: coupleRef.id,
      anniversary,
    };
  });
});

// 4. Get couple game state
export const getCoupleGameState = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = request.auth.uid;

  // Get user's couple
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  if (!userData?.coupleId) {
    throw new HttpsError('failed-precondition', 'User is not paired');
  }

  // Ensure reset if needed
  await ensureResetIfNeeded(userData.coupleId);

  // Get couple state
  const coupleDoc = await db.collection('couples').doc(userData.coupleId).get();
  if (!coupleDoc.exists) {
    throw new HttpsError('not-found', 'Couple not found');
  }

  const coupleData = coupleDoc.data() as CoupleGameState;

  return {
    dailyRemaining: coupleData.dailyRemaining,
    ticketsRemaining: coupleData.ticketsRemaining,
    streak: coupleData.streak,
    hasPendingDaily: coupleData.hasPendingDaily || false,
    hasPendingChoice: coupleData.hasPendingChoice || 0,
  };
});

// 5. Start daily question
export const startDailyQuestion = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = request.auth.uid;

  // Get user's couple
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  if (!userData?.coupleId) {
    throw new HttpsError('failed-precondition', 'User is not paired');
  }

  const coupleId = userData.coupleId;

  return await db.runTransaction(async (transaction) => {
    // Ensure reset
    await ensureResetIfNeeded(coupleId);

    const coupleRef = db.collection('couples').doc(coupleId);
    const coupleDoc = await transaction.get(coupleRef);

    if (!coupleDoc.exists) {
      throw new HttpsError('not-found', 'Couple not found');
    }

    const coupleData = coupleDoc.data();

    if (coupleData?.dailyRemaining <= 0) {
      throw new HttpsError('resource-exhausted', 'No daily questions remaining');
    }

    if (coupleData?.hasPendingDaily) {
      throw new HttpsError('failed-precondition', 'Daily question already pending');
    }

    // Get random daily question
    const question = await getRandomQuestion('daily_questions') as any;

    // Create game session
    const sessionRef = db.collection('couples').doc(coupleId).collection('game_sessions').doc();
    const todayMY = getTodayMY();

    const sessionData: GameSession = {
      questionId: question.id,
      type: 'daily',
      questionText: question.text,
      initiatorUid: uid,
      answers: {},
      status: 'waiting',
      createdAt: FieldValue.serverTimestamp(),
      malaysiaDate: todayMY,
    };

    transaction.set(sessionRef, sessionData);

    // Update couple state
    transaction.update(coupleRef, {
      dailyRemaining: (coupleData?.dailyRemaining || 1) - 1,
      hasPendingDaily: true,
    });

    return {
      sessionId: sessionRef.id,
      question: {
        id: question.id,
        text: question.text,
      },
      gameStateAfter: {
        dailyRemaining: (coupleData?.dailyRemaining || 1) - 1,
        ticketsRemaining: coupleData?.ticketsRemaining || 3,
        streak: coupleData?.streak || 0,
        hasPendingDaily: true,
        hasPendingChoice: coupleData?.hasPendingChoice || 0,
      },
    };
  });
});

// 6. Start choice game
export const startChoiceGame = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { gameType } = request.data;
  if (!gameType || !['this_or_that', 'more_likely', 'would_you_rather'].includes(gameType)) {
    throw new HttpsError('invalid-argument', 'Invalid game type');
  }

  const uid = request.auth.uid;

  // Get user's couple
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  if (!userData?.coupleId) {
    throw new HttpsError('failed-precondition', 'User is not paired');
  }

  const coupleId = userData.coupleId;

  return await db.runTransaction(async (transaction) => {
    // Ensure reset
    await ensureResetIfNeeded(coupleId);

    const coupleRef = db.collection('couples').doc(coupleId);
    const coupleDoc = await transaction.get(coupleRef);

    if (!coupleDoc.exists) {
      throw new HttpsError('not-found', 'Couple not found');
    }

    const coupleData = coupleDoc.data();

    if (coupleData?.ticketsRemaining <= 0) {
      throw new HttpsError('resource-exhausted', 'No tickets remaining');
    }

    const pendingChoice = coupleData?.hasPendingChoice || 0;
    if (pendingChoice >= 3) {
      throw new HttpsError('failed-precondition', 'Too many pending choice games');
    }

    // Get random choice question
    const question = await getRandomQuestion('choice_questions', gameType) as any;

    // Create game session
    const sessionRef = db.collection('couples').doc(coupleId).collection('game_sessions').doc();
    const todayMY = getTodayMY();

    const sessionData: GameSession = {
      questionId: question.id,
      type: gameType,
      questionText: question.question,
      choice1: question.choice1,
      choice2: question.choice2,
      initiatorUid: uid,
      answers: {},
      status: 'waiting',
      createdAt: FieldValue.serverTimestamp(),
      malaysiaDate: todayMY,
    };

    transaction.set(sessionRef, sessionData);

    // Update couple state
    transaction.update(coupleRef, {
      ticketsRemaining: (coupleData?.ticketsRemaining || 3) - 1,
      hasPendingChoice: pendingChoice + 1,
    });

    return {
      sessionId: sessionRef.id,
      question: {
        id: question.id,
        type: gameType,
        question: question.question,
        choice1: question.choice1,
        choice2: question.choice2,
      },
      gameStateAfter: {
        dailyRemaining: coupleData?.dailyRemaining || 1,
        ticketsRemaining: (coupleData?.ticketsRemaining || 3) - 1,
        streak: coupleData?.streak || 0,
        hasPendingDaily: coupleData?.hasPendingDaily || false,
        hasPendingChoice: pendingChoice + 1,
      },
    };
  });
});

// 7. Submit game answer
export const submitGameAnswer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { sessionId, answer } = request.data;
  if (!sessionId || (answer === undefined || answer === null)) {
    throw new HttpsError('invalid-argument', 'Invalid session ID or answer');
  }

  const uid = request.auth.uid;

  // Get user's couple
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  if (!userData?.coupleId) {
    throw new HttpsError('failed-precondition', 'User is not paired');
  }

  const coupleId = userData.coupleId;

  return await db.runTransaction(async (transaction) => {
    const sessionRef = db.collection('couples').doc(coupleId).collection('game_sessions').doc(sessionId);
    const sessionDoc = await transaction.get(sessionRef);

    if (!sessionDoc.exists) {
      throw new HttpsError('not-found', 'Game session not found');
    }

    const sessionData = sessionDoc.data() as GameSession;

    if (sessionData.status === 'completed') {
      throw new HttpsError('failed-precondition', 'Game already completed');
    }

    // Check if user already answered
    if (sessionData.answers[uid]) {
      throw new HttpsError('already-exists', 'User already answered this question');
    }

    // Add user's answer
    const updatedAnswers = {
      ...sessionData.answers,
      [uid]: {
        answer,
        answeredAt: FieldValue.serverTimestamp(),
      },
    };

    // Check if both partners answered
    const coupleDoc = await transaction.get(db.collection('couples').doc(coupleId));
    const coupleData = coupleDoc.data();
    const members = coupleData?.members || [];
    
    const allAnswered = members.every((memberId: string) => updatedAnswers[memberId]);
    const newStatus = allAnswered ? 'completed' : 'waiting';

    // Update session
    const sessionUpdate: any = {
      answers: updatedAnswers,
      status: newStatus,
    };

    transaction.update(sessionRef, sessionUpdate);

    // If game completed, update couple state and streak
    if (allAnswered) {
      const coupleRef = db.collection('couples').doc(coupleId);
      const todayMY = getTodayMY();
      const yesterdayMY = getYesterdayMY();

      let coupleUpdate: any = {};

      // Clear pending flags
      if (sessionData.type === 'daily') {
        coupleUpdate.hasPendingDaily = false;
        
        // Update streak if not earned today
        if (!coupleData?.lastStreakEarnedDateMY || coupleData.lastStreakEarnedDateMY !== todayMY) {
          let newStreak = 1;
          
          if (coupleData?.lastStreakEarnedDateMY === yesterdayMY) {
            newStreak = (coupleData.streak || 0) + 1;
          }
          
          coupleUpdate.streak = newStreak;
          coupleUpdate.lastStreakEarnedDateMY = todayMY;
        }
      } else {
        const pendingChoice = coupleData?.hasPendingChoice || 0;
        coupleUpdate.hasPendingChoice = Math.max(0, pendingChoice - 1);
        
        // Update streak for choice games too if not earned today
        if (!coupleData?.lastStreakEarnedDateMY || coupleData.lastStreakEarnedDateMY !== todayMY) {
          let newStreak = 1;
          
          if (coupleData?.lastStreakEarnedDateMY === yesterdayMY) {
            newStreak = (coupleData.streak || 0) + 1;
          }
          
          coupleUpdate.streak = newStreak;
          coupleUpdate.lastStreakEarnedDateMY = todayMY;
        }
      }

      transaction.update(coupleRef, coupleUpdate);
    }

    return {
      success: true,
      completed: allAnswered,
    };
  });
});

// 8. Get pending games for partner
export const getPendingGames = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = request.auth.uid;

  // Get user's couple
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  if (!userData?.coupleId) {
    throw new HttpsError('failed-precondition', 'User is not paired');
  }

  // Get pending games where partner hasn't answered
  const sessionsSnapshot = await db
    .collection('couples')
    .doc(userData.coupleId)
    .collection('game_sessions')
    .where('status', '==', 'waiting')
    .orderBy('createdAt', 'desc')
    .get();

  const pendingGames = sessionsSnapshot.docs
    .filter(doc => {
      const data = doc.data();
      return !data.answers[uid] && data.initiatorUid !== uid;
    })
    .map(doc => ({
      sessionId: doc.id,
      ...doc.data(),
    }));

  return { pendingGames };
});

// 9. Get game history
export const getGameHistory = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = request.auth.uid;

  // Get user's couple
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  if (!userData?.coupleId) {
    throw new HttpsError('failed-precondition', 'User is not paired');
  }

  // Get completed games
  const sessionsSnapshot = await db
    .collection('couples')
    .doc(userData.coupleId)
    .collection('game_sessions')
    .where('status', '==', 'completed')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  // Get couple members for display names
  const coupleDoc = await db.collection('couples').doc(userData.coupleId).get();
  const coupleData = coupleDoc.data();
  const members = coupleData?.members || [];

  const memberNames: Record<string, string> = {};
  for (const memberId of members) {
    const memberDoc = await db.collection('users').doc(memberId).get();
    if (memberDoc.exists) {
      memberNames[memberId] = memberDoc.data()?.displayName || 'Unknown';
    }
  }

  const gameHistory = sessionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      sessionId: doc.id,
      type: data.type,
      questionText: data.questionText,
      choice1: data.choice1,
      choice2: data.choice2,
      answers: data.answers,
      createdAt: data.createdAt,
      malaysiaDate: data.malaysiaDate,
      memberNames,
    };
  });

  return { gameHistory };
});

// 10. Unpair couple
export const unpairCouple = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const uid = request.auth.uid;

  // Get user's couple
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  if (!userData?.coupleId) {
    throw new HttpsError('failed-precondition', 'User is not paired');
  }

  const coupleId = userData.coupleId;

  return await db.runTransaction(async (transaction) => {
    // Get couple data
    const coupleRef = db.collection('couples').doc(coupleId);
    const coupleDoc = await transaction.get(coupleRef);

    if (!coupleDoc.exists) {
      throw new HttpsError('not-found', 'Couple not found');
    }

    const coupleData = coupleDoc.data();
    const members = coupleData?.members || [];

    // Clear coupleId from both users
    for (const memberId of members) {
      const memberRef = db.collection('users').doc(memberId);
      transaction.update(memberRef, { coupleId: FieldValue.delete() });
    }

    // Delete couple document
    transaction.delete(coupleRef);

    // Note: Game sessions will be automatically deleted by Firestore security rules
    // or we can delete them here if needed

    return { success: true };
  });
});