"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpairCouple = exports.getGameHistory = exports.getPendingGames = exports.submitGameAnswer = exports.startChoiceGame = exports.startDailyQuestion = exports.getCoupleGameState = exports.acceptCoupleInvite = exports.validateCoupleCode = exports.generateCoupleCode = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// Helper function to get today's date in Malaysia timezone
function getTodayMY() {
    const now = new Date();
    const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return malaysiaTime.toISOString().split('T')[0];
}
// Helper function to get yesterday's date in Malaysia timezone
function getYesterdayMY() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const malaysiaTime = new Date(yesterday.getTime() + (8 * 60 * 60 * 1000));
    return malaysiaTime.toISOString().split('T')[0];
}
// Generate random alphanumeric code
function generateRandomCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// Ensure game state is reset if needed
async function ensureResetIfNeeded(coupleId) {
    const todayMY = getTodayMY();
    const coupleRef = db.collection('couples').doc(coupleId);
    await db.runTransaction(async (transaction) => {
        const coupleDoc = await transaction.get(coupleRef);
        if (!coupleDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Couple not found');
        }
        const coupleData = coupleDoc.data();
        if (coupleData.lastResetDateMY !== todayMY) {
            const yesterdayMY = getYesterdayMY();
            const updateData = {
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
async function getRandomQuestion(collectionName, type) {
    let query = db.collection(collectionName).where('active', '==', true);
    if (type) {
        query = query.where('type', '==', type);
    }
    const snapshot = await query.get();
    if (snapshot.empty) {
        throw new https_1.HttpsError('not-found', `No active questions found${type ? ` for type ${type}` : ''}`);
    }
    const docs = snapshot.docs;
    const randomIndex = Math.floor(Math.random() * docs.length);
    const doc = docs[randomIndex];
    return Object.assign({ id: doc.id }, doc.data());
}
// 1. Generate couple invitation code
exports.generateCoupleCode = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const uid = request.auth.uid;
    // Check if user is already in a couple
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (userData === null || userData === void 0 ? void 0 : userData.coupleId) {
        throw new https_1.HttpsError('already-exists', 'User is already paired');
    }
    // Generate unique code
    let code;
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
        code = generateRandomCode(6);
        const existingInvite = await db.collection('couple_invites').doc(code).get();
        codeExists = existingInvite.exists;
        attempts++;
    }
    if (attempts >= 10) {
        throw new https_1.HttpsError('internal', 'Failed to generate unique code');
    }
    // Create invite with 1 hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    await db.collection('couple_invites').doc(code).set({
        inviterUid: uid,
        expiresAt: firestore_1.FieldValue.serverTimestamp(),
        status: 'pending',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        // Store actual expiry time for client
        clientExpiresAt: expiresAt,
    });
    return {
        code: code,
        expiresAt: expiresAt.toISOString(),
    };
});
// 2. Validate couple code (before setting anniversary)
exports.validateCoupleCode = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { code } = request.data;
    if (!code || typeof code !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Invalid code');
    }
    const uid = request.auth.uid;
    // Check if user is already paired
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (userData === null || userData === void 0 ? void 0 : userData.coupleId) {
        throw new https_1.HttpsError('already-exists', 'User is already paired');
    }
    // Get invite
    const inviteDoc = await db.collection('couple_invites').doc(code).get();
    if (!inviteDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Invalid code');
    }
    const inviteData = inviteDoc.data();
    // Check if expired (using client expiry time)
    if ((inviteData === null || inviteData === void 0 ? void 0 : inviteData.clientExpiresAt) && new Date() > inviteData.clientExpiresAt.toDate()) {
        throw new https_1.HttpsError('deadline-exceeded', 'Code has expired');
    }
    if ((inviteData === null || inviteData === void 0 ? void 0 : inviteData.status) !== 'pending') {
        throw new https_1.HttpsError('failed-precondition', 'Code has already been used');
    }
    // Check if trying to use own code
    if ((inviteData === null || inviteData === void 0 ? void 0 : inviteData.inviterUid) === uid) {
        throw new https_1.HttpsError('invalid-argument', 'Cannot use your own invitation code');
    }
    // Get inviter info
    const inviterDoc = await db.collection('users').doc(inviteData === null || inviteData === void 0 ? void 0 : inviteData.inviterUid).get();
    if (!inviterDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Inviter not found');
    }
    const inviterData = inviterDoc.data();
    // Check if inviter is still unpaired
    if (inviterData === null || inviterData === void 0 ? void 0 : inviterData.coupleId) {
        throw new https_1.HttpsError('failed-precondition', 'Inviter is already paired with someone else');
    }
    return {
        inviterUid: inviteData === null || inviteData === void 0 ? void 0 : inviteData.inviterUid,
        inviterName: inviterData === null || inviterData === void 0 ? void 0 : inviterData.displayName,
    };
});
// 3. Accept couple invitation and create couple
exports.acceptCoupleInvite = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { code, anniversary } = request.data;
    if (!code || !anniversary || typeof code !== 'string' || typeof anniversary !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Invalid code or anniversary');
    }
    const uid = request.auth.uid;
    return await db.runTransaction(async (transaction) => {
        var _a, _b;
        // Validate code again (in transaction)
        const inviteRef = db.collection('couple_invites').doc(code);
        const inviteDoc = await transaction.get(inviteRef);
        if (!inviteDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Invalid code');
        }
        const inviteData = inviteDoc.data();
        if ((inviteData === null || inviteData === void 0 ? void 0 : inviteData.status) !== 'pending') {
            throw new https_1.HttpsError('failed-precondition', 'Code has already been used');
        }
        if ((inviteData === null || inviteData === void 0 ? void 0 : inviteData.clientExpiresAt) && new Date() > inviteData.clientExpiresAt.toDate()) {
            throw new https_1.HttpsError('deadline-exceeded', 'Code has expired');
        }
        const inviterUid = inviteData === null || inviteData === void 0 ? void 0 : inviteData.inviterUid;
        // Check both users are still unpaired
        const userRef = db.collection('users').doc(uid);
        const inviterRef = db.collection('users').doc(inviterUid);
        const [userDoc, inviterDoc] = await Promise.all([
            transaction.get(userRef),
            transaction.get(inviterRef)
        ]);
        if (!userDoc.exists || !inviterDoc.exists) {
            throw new https_1.HttpsError('not-found', 'User not found');
        }
        if (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.coupleId) || ((_b = inviterDoc.data()) === null || _b === void 0 ? void 0 : _b.coupleId)) {
            throw new https_1.HttpsError('failed-precondition', 'One or both users are already paired');
        }
        // Create couple
        const coupleRef = db.collection('couples').doc();
        const todayMY = getTodayMY();
        const coupleData = {
            members: [inviterUid, uid],
            status: 'active',
            anniversary,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
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
exports.getCoupleGameState = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const uid = request.auth.uid;
    // Get user's couple
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.coupleId)) {
        throw new https_1.HttpsError('failed-precondition', 'User is not paired');
    }
    // Ensure reset if needed
    await ensureResetIfNeeded(userData.coupleId);
    // Get couple state
    const coupleDoc = await db.collection('couples').doc(userData.coupleId).get();
    if (!coupleDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Couple not found');
    }
    const coupleData = coupleDoc.data();
    return {
        dailyRemaining: coupleData.dailyRemaining,
        ticketsRemaining: coupleData.ticketsRemaining,
        streak: coupleData.streak,
        hasPendingDaily: coupleData.hasPendingDaily || false,
        hasPendingChoice: coupleData.hasPendingChoice || 0,
    };
});
// 5. Start daily question
exports.startDailyQuestion = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const uid = request.auth.uid;
    // Get user's couple
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.coupleId)) {
        throw new https_1.HttpsError('failed-precondition', 'User is not paired');
    }
    const coupleId = userData.coupleId;
    return await db.runTransaction(async (transaction) => {
        // Ensure reset
        await ensureResetIfNeeded(coupleId);
        const coupleRef = db.collection('couples').doc(coupleId);
        const coupleDoc = await transaction.get(coupleRef);
        if (!coupleDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Couple not found');
        }
        const coupleData = coupleDoc.data();
        if ((coupleData === null || coupleData === void 0 ? void 0 : coupleData.dailyRemaining) <= 0) {
            throw new https_1.HttpsError('resource-exhausted', 'No daily questions remaining');
        }
        if (coupleData === null || coupleData === void 0 ? void 0 : coupleData.hasPendingDaily) {
            throw new https_1.HttpsError('failed-precondition', 'Daily question already pending');
        }
        // Get random daily question
        const question = await getRandomQuestion('daily_questions');
        // Create game session
        const sessionRef = db.collection('couples').doc(coupleId).collection('game_sessions').doc();
        const todayMY = getTodayMY();
        const sessionData = {
            questionId: question.id,
            type: 'daily',
            questionText: question.text,
            initiatorUid: uid,
            answers: {},
            status: 'waiting',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            malaysiaDate: todayMY,
        };
        transaction.set(sessionRef, sessionData);
        // Update couple state
        transaction.update(coupleRef, {
            dailyRemaining: ((coupleData === null || coupleData === void 0 ? void 0 : coupleData.dailyRemaining) || 1) - 1,
            hasPendingDaily: true,
        });
        return {
            sessionId: sessionRef.id,
            question: {
                id: question.id,
                text: question.text,
            },
            gameStateAfter: {
                dailyRemaining: ((coupleData === null || coupleData === void 0 ? void 0 : coupleData.dailyRemaining) || 1) - 1,
                ticketsRemaining: (coupleData === null || coupleData === void 0 ? void 0 : coupleData.ticketsRemaining) || 3,
                streak: (coupleData === null || coupleData === void 0 ? void 0 : coupleData.streak) || 0,
                hasPendingDaily: true,
                hasPendingChoice: (coupleData === null || coupleData === void 0 ? void 0 : coupleData.hasPendingChoice) || 0,
            },
        };
    });
});
// 6. Start choice game
exports.startChoiceGame = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { gameType } = request.data;
    if (!gameType || !['this_or_that', 'more_likely', 'would_you_rather'].includes(gameType)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid game type');
    }
    const uid = request.auth.uid;
    // Get user's couple
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.coupleId)) {
        throw new https_1.HttpsError('failed-precondition', 'User is not paired');
    }
    const coupleId = userData.coupleId;
    return await db.runTransaction(async (transaction) => {
        // Ensure reset
        await ensureResetIfNeeded(coupleId);
        const coupleRef = db.collection('couples').doc(coupleId);
        const coupleDoc = await transaction.get(coupleRef);
        if (!coupleDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Couple not found');
        }
        const coupleData = coupleDoc.data();
        if ((coupleData === null || coupleData === void 0 ? void 0 : coupleData.ticketsRemaining) <= 0) {
            throw new https_1.HttpsError('resource-exhausted', 'No tickets remaining');
        }
        const pendingChoice = (coupleData === null || coupleData === void 0 ? void 0 : coupleData.hasPendingChoice) || 0;
        if (pendingChoice >= 3) {
            throw new https_1.HttpsError('failed-precondition', 'Too many pending choice games');
        }
        // Get random choice question
        const question = await getRandomQuestion('choice_questions', gameType);
        // Create game session
        const sessionRef = db.collection('couples').doc(coupleId).collection('game_sessions').doc();
        const todayMY = getTodayMY();
        const sessionData = {
            questionId: question.id,
            type: gameType,
            questionText: question.question,
            choice1: question.choice1,
            choice2: question.choice2,
            initiatorUid: uid,
            answers: {},
            status: 'waiting',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            malaysiaDate: todayMY,
        };
        transaction.set(sessionRef, sessionData);
        // Update couple state
        transaction.update(coupleRef, {
            ticketsRemaining: ((coupleData === null || coupleData === void 0 ? void 0 : coupleData.ticketsRemaining) || 3) - 1,
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
                dailyRemaining: (coupleData === null || coupleData === void 0 ? void 0 : coupleData.dailyRemaining) || 1,
                ticketsRemaining: ((coupleData === null || coupleData === void 0 ? void 0 : coupleData.ticketsRemaining) || 3) - 1,
                streak: (coupleData === null || coupleData === void 0 ? void 0 : coupleData.streak) || 0,
                hasPendingDaily: (coupleData === null || coupleData === void 0 ? void 0 : coupleData.hasPendingDaily) || false,
                hasPendingChoice: pendingChoice + 1,
            },
        };
    });
});
// 7. Submit game answer
exports.submitGameAnswer = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { sessionId, answer } = request.data;
    if (!sessionId || (answer === undefined || answer === null)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid session ID or answer');
    }
    const uid = request.auth.uid;
    // Get user's couple
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.coupleId)) {
        throw new https_1.HttpsError('failed-precondition', 'User is not paired');
    }
    const coupleId = userData.coupleId;
    return await db.runTransaction(async (transaction) => {
        const sessionRef = db.collection('couples').doc(coupleId).collection('game_sessions').doc(sessionId);
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Game session not found');
        }
        const sessionData = sessionDoc.data();
        if (sessionData.status === 'completed') {
            throw new https_1.HttpsError('failed-precondition', 'Game already completed');
        }
        // Check if user already answered
        if (sessionData.answers[uid]) {
            throw new https_1.HttpsError('already-exists', 'User already answered this question');
        }
        // Add user's answer
        const updatedAnswers = Object.assign(Object.assign({}, sessionData.answers), { [uid]: {
                answer,
                answeredAt: firestore_1.FieldValue.serverTimestamp(),
            } });
        // Check if both partners answered
        const coupleDoc = await transaction.get(db.collection('couples').doc(coupleId));
        const coupleData = coupleDoc.data();
        const members = (coupleData === null || coupleData === void 0 ? void 0 : coupleData.members) || [];
        const allAnswered = members.every((memberId) => updatedAnswers[memberId]);
        const newStatus = allAnswered ? 'completed' : 'waiting';
        // Update session
        const sessionUpdate = {
            answers: updatedAnswers,
            status: newStatus,
        };
        transaction.update(sessionRef, sessionUpdate);
        // If game completed, update couple state and streak
        if (allAnswered) {
            const coupleRef = db.collection('couples').doc(coupleId);
            const todayMY = getTodayMY();
            const yesterdayMY = getYesterdayMY();
            let coupleUpdate = {};
            // Clear pending flags
            if (sessionData.type === 'daily') {
                coupleUpdate.hasPendingDaily = false;
                // Update streak if not earned today
                if (!(coupleData === null || coupleData === void 0 ? void 0 : coupleData.lastStreakEarnedDateMY) || coupleData.lastStreakEarnedDateMY !== todayMY) {
                    let newStreak = 1;
                    if ((coupleData === null || coupleData === void 0 ? void 0 : coupleData.lastStreakEarnedDateMY) === yesterdayMY) {
                        newStreak = (coupleData.streak || 0) + 1;
                    }
                    coupleUpdate.streak = newStreak;
                    coupleUpdate.lastStreakEarnedDateMY = todayMY;
                }
            }
            else {
                const pendingChoice = (coupleData === null || coupleData === void 0 ? void 0 : coupleData.hasPendingChoice) || 0;
                coupleUpdate.hasPendingChoice = Math.max(0, pendingChoice - 1);
                // Update streak for choice games too if not earned today
                if (!(coupleData === null || coupleData === void 0 ? void 0 : coupleData.lastStreakEarnedDateMY) || coupleData.lastStreakEarnedDateMY !== todayMY) {
                    let newStreak = 1;
                    if ((coupleData === null || coupleData === void 0 ? void 0 : coupleData.lastStreakEarnedDateMY) === yesterdayMY) {
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
exports.getPendingGames = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const uid = request.auth.uid;
    // Get user's couple
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.coupleId)) {
        throw new https_1.HttpsError('failed-precondition', 'User is not paired');
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
        .map(doc => (Object.assign({ sessionId: doc.id }, doc.data())));
    return { pendingGames };
});
// 9. Get game history
exports.getGameHistory = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const uid = request.auth.uid;
    // Get user's couple
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.coupleId)) {
        throw new https_1.HttpsError('failed-precondition', 'User is not paired');
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
    const members = (coupleData === null || coupleData === void 0 ? void 0 : coupleData.members) || [];
    const memberNames = {};
    for (const memberId of members) {
        const memberDoc = await db.collection('users').doc(memberId).get();
        if (memberDoc.exists) {
            memberNames[memberId] = ((_a = memberDoc.data()) === null || _a === void 0 ? void 0 : _a.displayName) || 'Unknown';
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
exports.unpairCouple = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const uid = request.auth.uid;
    // Get user's couple
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.coupleId)) {
        throw new https_1.HttpsError('failed-precondition', 'User is not paired');
    }
    const coupleId = userData.coupleId;
    return await db.runTransaction(async (transaction) => {
        // Get couple data
        const coupleRef = db.collection('couples').doc(coupleId);
        const coupleDoc = await transaction.get(coupleRef);
        if (!coupleDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Couple not found');
        }
        const coupleData = coupleDoc.data();
        const members = (coupleData === null || coupleData === void 0 ? void 0 : coupleData.members) || [];
        // Clear coupleId from both users
        for (const memberId of members) {
            const memberRef = db.collection('users').doc(memberId);
            transaction.update(memberRef, { coupleId: firestore_1.FieldValue.delete() });
        }
        // Delete couple document
        transaction.delete(coupleRef);
        // Note: Game sessions will be automatically deleted by Firestore security rules
        // or we can delete them here if needed
        return { success: true };
    });
});
//# sourceMappingURL=index.js.map