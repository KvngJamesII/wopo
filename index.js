const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Firebase Configuration
const serviceAccount = {
  type: "service_account",
  project_id: "otpking-3123d",
  private_key_id: "38ab7d9644bd5e9fb570768c1cd6aa85edab55b8",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+L0GS9RBIfFSX\nzJqPPQBeFeXPNksIiyaGcojOQURapNKoTI2kyTGAddTW8wuIuciY71WoSrsQgmlL\nXr6+WHEXgkMbCNSF9KtgXiSseTy8Sm2i/Xu4uqXAgB0MdyBAVcYI7M8LfAZXji55\nbUBWJsQvllGrqrEUcxuhVwAyCTzUNtAHS+yCeXtXpcNqBJDPWwQ/KM6tqqSGgDdB\nRXlfn+VyVziYYEmz6FdZk2aUNADpm2nb3YP4NGCTS9wcXNykFwqwBbn6LviPCmqT\nAuVMx+xZp5V1u+zvdAbGONP/oVyWt9AlsbxSPEB22HJ3vNVdq1U0Ijdo2YHHx40e\nl76hG011AgMBAAECggEAEEaKBZIMVS+yq5T6aySsyeB03MFINZB2+Q2HMKN8PoeZ\ncYavnnkLT/OFhemhxI8loBTnTzIqBRUr/qO6jh6SexEOPhuI2HfiTKpx2AK+FF0I\nOekYc+whMDKmicEOFQNiIbRmWZTBFDAaQRD87wJ9SpdCIP9IDTh2ll2UKjQJLR3n\ny2cPx3gJcHBzwHwPlocbtCKtGpHS/XDI1xm/rfcXdf/JkN06Ye6i1s/qBjBlGk4w\n4N1bEmWVWRFhflOk7bMQrZyaVkDpu+EyFWfNemOvP7eF0seFPmdSn1zpAdXc+P6I\nKvLPvULbL259kaoev/IWao9bOd0XaSKzDIk366AWoQKBgQDyeu/FZqjKxqPbGnHS\nlemFMyYDgPiCVtRBO3+NT4ZpbpTRk4UNA373+ppbX9ywR8Bl20HeqsGPryUwiUSi\nVslxDuKalTCMT/GQqlhSDTRbxRP4Rr64euVeXaRlrJzV0g1CWS/4GiCQwU7CxBd0\nNfaIuPvCjFVHVuFLaRydQPQhZQKBgQDIyd+ImuBfeqtPZyhLrJjDY6HJf1ELPM4R\nXoDB1NzfCZFamLuYBHdOAWOWMFP4NW9sBlk8MYG1OTM4RA3U9FGH+sVqcQKIDcIP\nFKaEohf/V6x9GqlO7tB6DCuFl49AF+wpREHsYipoyVb5hoRtf8NMHt3MpkaYUopd\nZ5kwiXBC0QKBgQCToS+sUuV/l9MZSg90tBsaItsJFRO4X18ZXD07buiZ9l6a/qLq\nGm/KUQR7j3DQzs6f9Q80n2f7sBoHY/uqjwZUVEi47w5Az0d22Y+uXSW8nc+bwI7L\nyN8vRfoagS53rEywUZa4Ckg7ecYXJMZW1agE9AMsHr6pEYdXn2Zxg6NfVQKBgCa4\nNzECnM4Mu8heHjkpmXPkXKicsqY2HY7f6Hh4cfdYwvzzgwl3owIZ5nhp7Wdp9oig\nWMjwyxCFbUkmZnxweOB+DV/PVyuha5C47Lua/oGxCIQ/hfLAvtcqTaI/bdJwSoxS\nq1vIOmFmoi0QMa1j++dL9H2oeuiY0jHc7n+boVhhAoGAdRW1OcBXFqGWVwAqGrIK\nKRzAfKQ/lPgCHMd1CkyKlGpR37aOqBG0o+ndJYccHl/7dqSVphagMGdMf2mAaJ6H\nMoAKVWZixrE41ThWo9M0LjtjDeEEoa4MKbgM6onqUvGClfGHWIYfiNHzkSdgLWbt\n44POsGPBJseZwT6FKcKdQck=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@otpking-3123d.iam.gserviceaccount.com",
  client_id: "102451673179531405285",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40otpking-3123d.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Bot configuration
const TOKEN = '8585587671:AAHYKI82Lh3mWusEyc2IdHJ2O2Zys83KTvA';
const bot = new TelegramBot(TOKEN, { polling: true });

// Admin configuration
const ADMIN_IDS = [7648364004];

// In-memory cache for performance (synced with Firebase)
const database = {
    users: new Map(),
    numbers: new Map(),
    pendingUploads: new Map(),
    userCooldowns: new Map(),
    giftCodes: new Map(), // code -> { maxUsers, expiryTime, claimedBy: [] }
    channels: new Map(), // channelId -> { name, link, chatId }
    referralRequired: 1,
    referralEnabled: false,
    stats: {
        totalNumbersGiven: 0,
        startTime: Date.now()
    }
};

// ============================================
// FIREBASE HELPER FUNCTIONS
// ============================================

// Load all data from Firebase on startup
async function loadDataFromFirebase() {
    console.log('📥 Loading data from Firebase...');

    try {
        // Load users
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(doc => {
            database.users.set(doc.id, doc.data());
        });
        console.log(`✅ Loaded ${database.users.size} users`);

        // Load numbers
        const numbersSnapshot = await db.collection('numbers').get();
        numbersSnapshot.forEach(doc => {
            database.numbers.set(doc.id, doc.data().numbers);
        });
        console.log(`✅ Loaded ${database.numbers.size} country number sets`);

        // Load settings
        const settingsDoc = await db.collection('settings').doc('config').get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            database.referralRequired = settings.referralRequired || 1;
            database.referralEnabled = settings.referralEnabled !== undefined ? settings.referralEnabled : false;
            database.stats.totalNumbersGiven = settings.totalNumbersGiven || 0;
            database.stats.startTime = settings.startTime || Date.now();
            console.log(`✅ Loaded settings (Referral: ${database.referralEnabled ? 'ON' : 'OFF'}, Required: ${database.referralRequired})`);
        }

        // Load channels
        const channelsSnapshot = await db.collection('channels').get();
        channelsSnapshot.forEach(doc => {
            database.channels.set(doc.id, doc.data());
        });
        console.log(`✅ Loaded ${database.channels.size} required channels`);

        // Load gift codes
        const giftCodesSnapshot = await db.collection('giftCodes').get();
        giftCodesSnapshot.forEach(doc => {
            database.giftCodes.set(doc.id, doc.data());
        });
        console.log(`✅ Loaded ${database.giftCodes.size} gift codes`);

        console.log('✅ All data loaded from Firebase successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error loading from Firebase:', error);
        return false;
    }
}

// Save user to Firebase
async function saveUserToFirebase(userId, userData) {
    try {
        await db.collection('users').doc(String(userId)).set(userData, { merge: true });
    } catch (error) {
        console.error(`❌ Error saving user ${userId}:`, error);
    }
}

// Save numbers to Firebase
async function saveNumbersToFirebase(country, numbers) {
    try {
        await db.collection('numbers').doc(country).set({ numbers });
    } catch (error) {
        console.error(`❌ Error saving numbers for ${country}:`, error);
    }
}

// Delete numbers from Firebase
async function deleteNumbersFromFirebase(country) {
    try {
        await db.collection('numbers').doc(country).delete();
    } catch (error) {
        console.error(`❌ Error deleting numbers for ${country}:`, error);
    }
}

// Save settings to Firebase
async function saveSettingsToFirebase() {
    try {
        await db.collection('settings').doc('config').set({
            referralRequired: database.referralRequired,
            referralEnabled: database.referralEnabled,
            totalNumbersGiven: database.stats.totalNumbersGiven,
            startTime: database.stats.startTime,
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error('❌ Error saving settings:', error);
    }
}

// Save channel to Firebase
async function saveChannelToFirebase(channelId, data) {
    try {
        await db.collection('channels').doc(channelId).set(data);
    } catch (error) {
        console.error(`❌ Error saving channel ${channelId}:`, error);
    }
}

// Delete channel from Firebase
async function deleteChannelFromFirebase(channelId) {
    try {
        await db.collection('channels').doc(channelId).delete();
    } catch (error) {
        console.error(`❌ Error deleting channel ${channelId}:`, error);
    }
}

// Save gift code to Firebase
async function saveGiftCodeToFirebase(code, data) {
    try {
        await db.collection('giftCodes').doc(code).set(data);
    } catch (error) {
        console.error(`❌ Error saving gift code ${code}:`, error);
    }
}

// Delete gift code from Firebase
async function deleteGiftCodeFromFirebase(code) {
    try {
        await db.collection('giftCodes').doc(code).delete();
    } catch (error) {
        console.error(`❌ Error deleting gift code ${code}:`, error);
    }
}

// Generate gift code
function generateGiftCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'OKING-';

    // First segment (5 chars)
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += '-';

    // Second segment (5 chars)
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
}

// Safe edit message function with error handling
async function safeEditMessageText(chatId, messageId, text, options) {
    try {
        await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            ...options
        });
    } catch (error) {
        // Ignore "message is not modified" errors
        if (!error.message?.includes('message is not modified')) {
            console.error('Error editing message:', error);
        }
    }
}

// ============================================
// HELPER FUNCTIONS (Updated with Firebase)
// ============================================

function isAdmin(userId) {
    return ADMIN_IDS.includes(userId);
}

async function checkChannelMembership(userId) {
    try {
        if (database.channels.size === 0) return true;
        for (const [_, channel] of database.channels) {
            const member = await bot.getChatMember(channel.chatId, userId);
            if (!['member', 'administrator', 'creator'].includes(member.status)) {
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Error checking membership:', error);
        return false;
    }
}

function getUser(userId) {
    if (!database.users.has(userId)) {
        const newUser = {
            joined: false,
            numbersUsed: 0,
            referrals: 0,
            referredBy: null,
            unlimited: false,
            joinedAt: Date.now(),
            lastActive: Date.now()
        };
        database.users.set(userId, newUser);
        saveUserToFirebase(userId, newUser); // Save to Firebase
    } else {
        const user = database.users.get(userId);
        user.lastActive = Date.now();
        saveUserToFirebase(userId, user); // Update Firebase
    }
    return database.users.get(userId);
}

function getReferralLink(userId) {
    return `https://t.me/getfreeotptemp_bot?start=ref_${userId}`;
}

function getBotStats() {
    const totalUsers = database.users.size;
    const joinedUsers = Array.from(database.users.values()).filter(u => u.joined).length;
    const unlimitedUsers = Array.from(database.users.values()).filter(u => u.unlimited).length;
    const totalReferrals = Array.from(database.users.values()).reduce((sum, u) => sum + u.referrals, 0);
    const usersWithReferrals = Array.from(database.users.values()).filter(u => u.referredBy !== null).length;

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const newUsersToday = Array.from(database.users.values()).filter(u => u.joinedAt > oneDayAgo).length;
    const newUsersWeek = Array.from(database.users.values()).filter(u => u.joinedAt > oneWeekAgo).length;
    const activeToday = Array.from(database.users.values()).filter(u => u.lastActive > oneDayAgo).length;

    const totalCountries = database.numbers.size;
    const totalNumbersAvailable = Array.from(database.numbers.values()).reduce((sum, nums) => sum + nums.length, 0);

    const uptimeMs = now - database.stats.startTime;
    const uptimeDays = Math.floor(uptimeMs / (24 * 60 * 60 * 1000));
    const uptimeHours = Math.floor((uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    return {
        totalUsers,
        joinedUsers,
        unlimitedUsers,
        totalReferrals,
        usersWithReferrals,
        newUsersToday,
        newUsersWeek,
        activeToday,
        totalCountries,
        totalNumbersAvailable,
        totalNumbersGiven: database.stats.totalNumbersGiven,
        uptimeDays,
        uptimeHours
    };
}

function getUserMainKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '📱 Get Numbers', callback_data: 'get_numbers' }],
            [{ text: '👥 Referral', callback_data: 'referral' }]
        ]
    };
}

function getAdminKeyboard() {
    const referralStatus = database.referralEnabled ? '🟢 ON' : '🔴 OFF';
    return {
        inline_keyboard: [
            [{ text: '📊 Bot Statistics', callback_data: 'admin_stats' }],
            [{ text: '👥 User Analytics', callback_data: 'admin_user_analytics' }],
            [{ text: '🏆 Top Referrers', callback_data: 'admin_top_referrers' }],
            [{ text: '📤 Upload Numbers', callback_data: 'admin_upload' }],
            [{ text: '📋 View Active Numbers', callback_data: 'admin_view' }],
            [{ text: `🔀 Referral: ${referralStatus}`, callback_data: 'admin_toggle_referral' }],
            [{ text: '⚙️ Set Referral Required', callback_data: 'admin_set_referral' }],
            [{ text: '📡 Manage Channels', callback_data: 'admin_channels' }],
            [{ text: '📢 Broadcast Message', callback_data: 'admin_broadcast' }],
            [{ text: '🔍 Search User', callback_data: 'admin_search_user' }],
            [{ text: '🎁 Create Code', callback_data: 'admin_create_code' }],
            [{ text: '🗑️ Delete Gift Code', callback_data: 'admin_delete_code' }]
        ]
    };
}

function getJoinChannelsKeyboard() {
    const buttons = [];
    for (const [_, channel] of database.channels) {
        buttons.push([{ text: `📢 Join ${channel.name}`, url: channel.link }]);
    }
    buttons.push([{ text: '✅ Done', callback_data: 'verify_join' }]);
    return { inline_keyboard: buttons };
}

function parseTXT(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            const numbers = data
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0);

            fs.unlinkSync(filePath);
            resolve(numbers);
        });
    });
}

// ============================================
// BOT COMMANDS
// ============================================

bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const param = match[1].trim();

    if (isAdmin(userId)) {
        bot.sendMessage(chatId, '🔐 *Admin Panel*\n\nWelcome, Admin! Use the buttons below to manage the bot.', {
            parse_mode: 'Markdown',
            reply_markup: getAdminKeyboard()
        });
        return;
    }

    if (param.startsWith('ref_')) {
        const referrerId = parseInt(param.split('_')[1]);
        const user = getUser(userId);

        if (referrerId !== userId && !user.referredBy) {
            user.referredBy = referrerId;
            await saveUserToFirebase(userId, user);
        }
    }

    const user = getUser(userId);

    if (user.joined) {
        bot.sendMessage(chatId, '✅ *Welcome Back to OTP KING*\n\nClick "Get Numbers" to get your virtual numbers.', {
            parse_mode: 'Markdown',
            reply_markup: getUserMainKeyboard()
        });
    } else {
        bot.sendMessage(chatId, '👋 *Welcome to OTP KING*\n\nPlease join these two channels to continue:', {
            parse_mode: 'Markdown',
            reply_markup: getJoinChannelsKeyboard()
        });
    }
});

// ============================================
// CALLBACK QUERY HANDLERS
// ============================================

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;
    const data = query.data;

    try {
        // Enforce channel membership for all non-admin user actions (except verify_join)
        if (!isAdmin(userId) && data !== 'verify_join' && database.channels.size > 0) {
            const isMember = await checkChannelMembership(userId);
            if (!isMember) {
                await safeEditMessageText(chatId, messageId, '⚠️ *Please join all required channels first!*', {
                    parse_mode: 'Markdown',
                    reply_markup: getJoinChannelsKeyboard()
                });
                return;
            }
        }

        // Verify join
        if (data === 'verify_join') {
            const joined = await checkChannelMembership(userId);

            if (joined) {
                const user = getUser(userId);
                user.joined = true;
                await saveUserToFirebase(userId, user);

                if (user.referredBy) {
                    const referrer = getUser(user.referredBy);
                    referrer.referrals++;
                    await saveUserToFirebase(user.referredBy, referrer);

                    bot.sendMessage(user.referredBy, `🎉 You got a new referral!\n\n👥 Total Referrals: ${referrer.referrals}/${database.referralRequired}`);

                    if (referrer.referrals >= database.referralRequired && !referrer.unlimited) {
                        referrer.unlimited = true;
                        await saveUserToFirebase(user.referredBy, referrer);
                        bot.sendMessage(user.referredBy, '🎊 *Congratulations!*\n\nYou can now continue using OTP KING for free unlimited!', {
                            parse_mode: 'Markdown'
                        });
                    }
                }

                await safeEditMessageText(chatId, messageId, '✅ *Welcome To OTP KING*\n\nClick "Get Numbers" to get your virtual numbers.', {
                    parse_mode: 'Markdown',
                    reply_markup: getUserMainKeyboard()
                });
            } else {
                bot.answerCallbackQuery(query.id, {
                    text: '❌ Please join both channels first!',
                    show_alert: true
                });
            }
            return;
        }

        // Get numbers
        if (data === 'get_numbers') {
            const user = getUser(userId);

            if (database.referralEnabled && !user.unlimited && user.numbersUsed >= 10) {
                const refLink = getReferralLink(userId);
                await safeEditMessageText(chatId, messageId,
                    `⚠️ *Limit Reached!*\n\n` +
                    `Refer Just ${database.referralRequired} People To Continue Using OTP KING for free.\n\n` +
                    `🔗 Your Referral Link:\n\`${refLink}\`\n\n` +
                    `👥 Total Referrals: ${user.referrals}/${database.referralRequired}`,
                    {
                        parse_mode: 'Markdown'
                    }
                );
                return;
            }

            const countries = Array.from(database.numbers.keys());

            if (countries.length === 0) {
                await safeEditMessageText(chatId, messageId, '❌ *No Countries Available Yet*', {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_to_main' }]]
                    }
                });
            } else {
                const keyboard = countries.map(country => [{ text: country, callback_data: `country_${country}` }]);
                keyboard.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);

                await safeEditMessageText(chatId, messageId, '🌍 *Select Country*', {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                });
            }
            return;
        }

        // Select country
        if (data.startsWith('country_')) {
            const country = data.replace('country_', '');
            const data_obj = database.numbers.get(country);

            if (!data_obj) {
                bot.answerCallbackQuery(query.id, {
                    text: '❌ No numbers available for this country',
                    show_alert: true
                });
                return;
            }

            const numbers = Array.isArray(data_obj) ? data_obj : data_obj.numbers || [];
            const countryCode = (typeof data_obj === 'object' && !Array.isArray(data_obj)) ? data_obj.countryCode : '';

            if (!numbers || numbers.length === 0) {
                bot.answerCallbackQuery(query.id, {
                    text: '❌ No numbers available for this country',
                    show_alert: true
                });
                return;
            }

            const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
            const user = getUser(userId);
            user.numbersUsed++;
            database.stats.totalNumbersGiven++;

            await saveUserToFirebase(userId, user);
            await saveSettingsToFirebase();

            const message = countryCode ?
                `🌍 *${country}*\n\n` +
                `📱 Number: +${countryCode} \`${randomNumber}\`\n\n` +
                `📌 *Note:* Click the Check for new sms button to receive otp or check the otp group` :
                `🌍 *${country}*\n\n` +
                `📱 Number: \`${randomNumber}\`\n\n` +
                `📌 *Note:* Click the Check for new sms button to receive otp or check the otp group`;

            await safeEditMessageText(chatId, messageId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '⏭️ Next', callback_data: `next_${country}` },
                            { text: '🔙 Back', callback_data: 'get_numbers' }
                        ]
                    ]
                }
            });
            return;
        }

        // Next number
        if (data.startsWith('next_')) {
            const now = Date.now();
            const lastClick = database.userCooldowns.get(userId) || 0;

            if (now - lastClick < 10000) {
                const remaining = Math.ceil((10000 - (now - lastClick)) / 1000);
                bot.answerCallbackQuery(query.id, {
                    text: `⏳ Please wait ${remaining} seconds`,
                    show_alert: true
                });
                return;
            }

            database.userCooldowns.set(userId, now);

            const country = data.replace('next_', '');
            const data_obj = database.numbers.get(country);

            if (!data_obj) {
                bot.answerCallbackQuery(query.id, {
                    text: '❌ No numbers available for this country',
                    show_alert: true
                });
                return;
            }

            const numbers = Array.isArray(data_obj) ? data_obj : (data_obj?.numbers || []);
            const countryCode = (typeof data_obj === 'object' && !Array.isArray(data_obj)) ? data_obj.countryCode : '';
            const user = getUser(userId);

            if (database.referralEnabled && !user.unlimited && user.numbersUsed >= 10) {
                const refLink = getReferralLink(userId);
                await safeEditMessageText(chatId, messageId,
                    `⚠️ *Limit Reached!*\n\n` +
                    `Refer Just ${database.referralRequired} People To Continue Using OTP KING for free.\n\n` +
                    `🔗 Your Referral Link:\n\`${refLink}\`\n\n` +
                    `👥 Total Referrals: ${user.referrals}/${database.referralRequired}`,
                    {
                        parse_mode: 'Markdown'
                    }
                );
                return;
            }

            if (!numbers || numbers.length === 0) {
                bot.answerCallbackQuery(query.id, {
                    text: '❌ No numbers available for this country',
                    show_alert: true
                });
                return;
            }

            const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
            user.numbersUsed++;
            database.stats.totalNumbersGiven++;

            await saveUserToFirebase(userId, user);
            await saveSettingsToFirebase();

            const message = countryCode ?
                `🌍 *${country}*\n\n` +
                `📱 Number: +${countryCode} \`${randomNumber}\`\n\n` +
                `📌 *Note:* Click the Check for new sms button to receive otp or check the otp group` :
                `🌍 *${country}*\n\n` +
                `📱 Number: \`${randomNumber}\`\n\n` +
                `📌 *Note:* Click the Check for new sms button to receive otp or check the otp group`;

            await safeEditMessageText(chatId, messageId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '⏭️ Next', callback_data: `next_${country}` },
                            { text: '🔙 Back', callback_data: 'get_numbers' }
                        ]
                    ]
                }
            });
            return;
        }

        // Referral info
        if (data === 'referral') {
            const user = getUser(userId);
            const refLink = getReferralLink(userId);

            await safeEditMessageText(chatId, messageId,
                `👥 *Your Referral Stats*\n\n` +
                `🔗 Referral Link:\n\`${refLink}\`\n\n` +
                `📊 Total Referrals: ${user.referrals}/${database.referralRequired}\n\n` +
                `${user.unlimited ? '✅ You have unlimited access!' : `Refer ${database.referralRequired - user.referrals} more to get unlimited access`}`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_to_main' }]]
                    }
                }
            );
            return;
        }

        // Support
        if (data === 'support') {
            bot.sendMessage(chatId, '💬 *Send Support Message*\n\nPlease describe your issue or question. Our admin team will respond as soon as possible:', {
                parse_mode: 'Markdown'
            });
            database.pendingUploads.set(userId, { action: 'support' });
            return;
        }

        // Back to main
        if (data === 'back_to_main') {
            await safeEditMessageText(chatId, messageId, '✅ *Welcome To OTP KING*\n\nClick "Get Numbers" to get your virtual numbers.', {
                parse_mode: 'Markdown',
                reply_markup: getUserMainKeyboard()
            });
            return;
        }

        // ============================================
        // ADMIN COMMANDS
        // ============================================

        if (!isAdmin(userId)) {
            bot.answerCallbackQuery(query.id, { text: '❌ Unauthorized' });
            return;
        }

        // Bot Statistics
        if (data === 'admin_stats') {
            const stats = getBotStats();

            const message = 
                `📊 *Bot Statistics*\n\n` +
                `👥 *Users*\n` +
                `├ Total Users: ${stats.totalUsers}\n` +
                `├ Joined Users: ${stats.joinedUsers}\n` +
                `├ Unlimited Users: ${stats.unlimitedUsers}\n` +
                `├ New Today: ${stats.newUsersToday}\n` +
                `├ New This Week: ${stats.newUsersWeek}\n` +
                `└ Active Today: ${stats.activeToday}\n\n` +
                `🔗 *Referrals*\n` +
                `├ Total Referrals Made: ${stats.totalReferrals}\n` +
                `├ Users Joined via Referral: ${stats.usersWithReferrals}\n` +
                `└ Required Referrals: ${database.referralRequired}\n\n` +
                `📱 *Numbers*\n` +
                `├ Countries Available: ${stats.totalCountries}\n` +
                `├ Total Numbers in DB: ${stats.totalNumbersAvailable}\n` +
                `└ Numbers Given Out: ${stats.totalNumbersGiven}\n\n` +
                `⏰ *Uptime*\n` +
                `└ ${stats.uptimeDays}d ${stats.uptimeHours}h`;

            await safeEditMessageText(chatId, messageId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔙 Back', callback_data: 'admin_back' }]]
                }
            });
            return;
        }

        // User Analytics
        if (data === 'admin_user_analytics') {
            const users = Array.from(database.users.values());

            const totalNumbers = users.reduce((sum, u) => sum + u.numbersUsed, 0);
            const avgNumbersPerUser = users.length > 0 ? (totalNumbers / users.length).toFixed(2) : 0;

            const usersBy10 = users.filter(u => u.numbersUsed >= 10).length;
            const usersBy50 = users.filter(u => u.numbersUsed >= 50).length;
            const usersBy100 = users.filter(u => u.numbersUsed >= 100).length;

            const conversion = users.filter(u => u.joined).length;
            const conversionRate = users.length > 0 ? ((conversion / users.length) * 100).toFixed(1) : 0;

            const message = 
                `👥 *User Analytics*\n\n` +
                `📊 *Usage Statistics*\n` +
                `├ Total Numbers Used: ${totalNumbers}\n` +
                `├ Avg per User: ${avgNumbersPerUser}\n` +
                `├ Users with 10+ numbers: ${usersBy10}\n` +
                `├ Users with 50+ numbers: ${usersBy50}\n` +
                `└ Users with 100+ numbers: ${usersBy100}\n\n` +
                `📈 *Conversion*\n` +
                `├ Join Rate: ${conversionRate}%\n` +
                `└ Converted Users: ${conversion}/${users.length}`;

            await safeEditMessageText(chatId, messageId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔙 Back', callback_data: 'admin_back' }]]
                }
            });
            return;
        }

        // Top Referrers
        if (data === 'admin_top_referrers') {
            const users = Array.from(database.users.entries())
                .filter(([_, u]) => u.referrals > 0)
                .sort((a, b) => b[1].referrals - a[1].referrals)
                .slice(0, 10);

            if (users.length === 0) {
                bot.editMessageText('🏆 *Top Referrers*\n\nNo referrals yet!', {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'admin_back' }]]
                    }
                });
                return;
            }

            let message = '🏆 *Top Referrers*\n\n';

            for (let i = 0; i < users.length; i++) {
                const [userId, user] = users[i];
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                message += `${medal} User ID: \`${userId}\` - ${user.referrals} referrals\n`;
            }

            await safeEditMessageText(chatId, messageId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔙 Back', callback_data: 'admin_back' }]]
                }
            });
            return;
        }

        // Search User
        if (data === 'admin_search_user') {
            bot.sendMessage(chatId, '🔍 *Search User*\n\nSend the User ID to search:', {
                parse_mode: 'Markdown'
            });
            database.pendingUploads.set(userId, { action: 'search_user' });
            return;
        }

        // Create Gift Code
        if (data === 'admin_create_code') {
            bot.sendMessage(chatId, '🎁 *Create Gift Code*\n\nEnter the number of users who can claim this gift code:', {
                parse_mode: 'Markdown'
            });
            database.pendingUploads.set(userId, { action: 'create_code_users' });
            return;
        }

        // Delete Gift Code
        if (data === 'admin_delete_code') {
            bot.sendMessage(chatId, '🗑️ *Delete Gift Code*\n\nEnter the gift code to delete:', {
                parse_mode: 'Markdown'
            });
            database.pendingUploads.set(userId, { action: 'delete_code' });
            return;
        }

        // Handle expiry time selection for gift code
        if (data.startsWith('expiry_')) {
            const pending = database.pendingUploads.get(userId);
            if (pending && pending.action === 'create_code_expiry') {
                const hours = parseInt(data.replace('expiry_', ''));
                const expiryTime = Date.now() + (hours * 60 * 60 * 1000);
                const giftCode = generateGiftCode();

                const codeData = {
                    maxUsers: pending.maxUsers,
                    expiryTime: expiryTime,
                    claimedBy: [],
                    createdAt: Date.now(),
                    createdBy: userId
                };

                database.giftCodes.set(giftCode, codeData);
                await saveGiftCodeToFirebase(giftCode, codeData);
                database.pendingUploads.delete(userId);

                await safeEditMessageText(chatId, messageId,
                    `✅ *New Gift Code Created*\n\n` +
                    `👥 Users: ${pending.maxUsers}\n` +
                    `⏰ Expiry: ${hours} hours\n\n` +
                    `🎁 Gift Code: \`${giftCode}\`\n\n` +
                    `_Tap the code to copy_`,
                    {
                        parse_mode: 'Markdown'
                    }
                );
            }
            return;
        }

        if (data === 'admin_upload') {
            bot.sendMessage(chatId, '📤 *Upload Numbers*\n\nPlease send the TXT file containing the virtual numbers (one number per line).', {
                parse_mode: 'Markdown'
            });
            return;
        }

        if (data === 'admin_view') {
            const countries = Array.from(database.numbers.keys());

            if (countries.length === 0) {
                bot.answerCallbackQuery(query.id, { text: '❌ No active number files', show_alert: true });
                return;
            }

            const keyboard = countries.map(country => {
                const countryData = database.numbers.get(country);
                const numCount = Array.isArray(countryData) ? countryData.length : (countryData?.numbers?.length || 0);
                return [
                    { text: `${country} (${numCount} numbers)`, callback_data: `view_${country}` },
                    { text: '🗑️ Delete', callback_data: `delete_${country}` }
                ];
            });
            keyboard.push([{ text: '🔙 Back', callback_data: 'admin_back' }]);

            await safeEditMessageText(chatId, messageId, '📋 *Active Number Files*', {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data.startsWith('delete_')) {
            const country = data.replace('delete_', '');
            database.numbers.delete(country);
            await deleteNumbersFromFirebase(country);
            bot.answerCallbackQuery(query.id, { text: `✅ Deleted ${country}`, show_alert: true });

            const countries = Array.from(database.numbers.keys());
            if (countries.length === 0) {
                await safeEditMessageText(chatId, messageId, '📋 *Active Number Files*\n\n❌ No active number files', {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'admin_back' }]]
                    }
                });
            } else {
                const keyboard = countries.map(country => {
                    const countryData = database.numbers.get(country);
                    const numCount = Array.isArray(countryData) ? countryData.length : (countryData?.numbers?.length || 0);
                    return [
                        { text: `${country} (${numCount} numbers)`, callback_data: `view_${country}` },
                        { text: '🗑️ Delete', callback_data: `delete_${country}` }
                    ];
                });
                keyboard.push([{ text: '🔙 Back', callback_data: 'admin_back' }]);

                await safeEditMessageText(chatId, messageId, '📋 *Active Number Files*', {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: keyboard }
                });
            }
            return;
        }

        // Toggle referral
        if (data === 'admin_toggle_referral') {
            database.referralEnabled = !database.referralEnabled;
            await saveSettingsToFirebase();
            const status = database.referralEnabled ? '🟢 ON' : '🔴 OFF';
            bot.answerCallbackQuery(query.id, { text: `Referral system: ${status}`, show_alert: true });
            await safeEditMessageText(chatId, messageId, '🔐 *Admin Panel*', {
                parse_mode: 'Markdown',
                reply_markup: getAdminKeyboard()
            });
            return;
        }

        // Manage channels
        if (data === 'admin_channels') {
            let message = '📡 *Manage Channels*\n\n';
            if (database.channels.size === 0) {
                message += 'No channels configured yet.';
            } else {
                let i = 1;
                for (const [id, ch] of database.channels) {
                    message += `${i}. *${ch.name}*\n   Link: ${ch.link}\n   ID: \`${ch.chatId}\`\n\n`;
                    i++;
                }
            }
            const keyboard = [];
            for (const [id, ch] of database.channels) {
                keyboard.push([{ text: `🗑️ Remove: ${ch.name}`, callback_data: `remove_channel_${id}` }]);
            }
            keyboard.push([{ text: '➕ Add Channel', callback_data: 'admin_add_channel' }]);
            keyboard.push([{ text: '🔙 Back', callback_data: 'admin_back' }]);

            await safeEditMessageText(chatId, messageId, message, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        // Add channel
        if (data === 'admin_add_channel') {
            bot.sendMessage(chatId, '📡 *Add Channel*\n\nSend the channel *name* (display name):', {
                parse_mode: 'Markdown'
            });
            database.pendingUploads.set(userId, { action: 'add_channel_name' });
            return;
        }

        // Remove channel
        if (data.startsWith('remove_channel_')) {
            const channelId = data.replace('remove_channel_', '');
            const channel = database.channels.get(channelId);
            database.channels.delete(channelId);
            await deleteChannelFromFirebase(channelId);
            bot.answerCallbackQuery(query.id, { text: `✅ Removed: ${channel ? channel.name : channelId}`, show_alert: true });

            // Refresh channel list
            let message = '📡 *Manage Channels*\n\n';
            if (database.channels.size === 0) {
                message += 'No channels configured yet.';
            } else {
                let i = 1;
                for (const [id, ch] of database.channels) {
                    message += `${i}. *${ch.name}*\n   Link: ${ch.link}\n   ID: \`${ch.chatId}\`\n\n`;
                    i++;
                }
            }
            const keyboard = [];
            for (const [id, ch] of database.channels) {
                keyboard.push([{ text: `🗑️ Remove: ${ch.name}`, callback_data: `remove_channel_${id}` }]);
            }
            keyboard.push([{ text: '➕ Add Channel', callback_data: 'admin_add_channel' }]);
            keyboard.push([{ text: '🔙 Back', callback_data: 'admin_back' }]);

            await safeEditMessageText(chatId, messageId, message, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: keyboard }
            });
            return;
        }

        if (data === 'admin_set_referral') {
            bot.sendMessage(chatId, '⚙️ *Set Referral Required*\n\nSend the new number of referrals required:', {
                parse_mode: 'Markdown'
            });
            database.pendingUploads.set(userId, { action: 'set_referral' });
            return;
        }

        if (data === 'admin_broadcast') {
            bot.sendMessage(chatId, '📢 *Broadcast Message*\n\nSend the message you want to broadcast to all users:', {
                parse_mode: 'Markdown'
            });
            database.pendingUploads.set(userId, { action: 'broadcast' });
            return;
        }

        if (data === 'admin_back') {
            await safeEditMessageText(chatId, messageId, '🔐 *Admin Panel*', {
                parse_mode: 'Markdown',
                reply_markup: getAdminKeyboard()
            });
            return;
        }

        if (data === 'publish') {
            const pending = database.pendingUploads.get(userId);
            if (pending && pending.numbers) {
                let strippedNumbers = pending.numbers;

                if (pending.countryCode) {
                    const countryCode = pending.countryCode;
                    strippedNumbers = pending.numbers.map(num => {
                        if (num.startsWith(countryCode)) {
                            return num.substring(countryCode.length);
                        }
                        return num;
                    });
                }

                database.numbers.set(pending.country, { 
                    numbers: strippedNumbers, 
                    countryCode: pending.countryCode || '' 
                });
                await saveNumbersToFirebase(pending.country, { 
                    numbers: strippedNumbers, 
                    countryCode: pending.countryCode || '' 
                });
                database.pendingUploads.delete(userId);
                await safeEditMessageText(chatId, messageId, `✅ Published ${strippedNumbers.length} numbers for ${pending.country}!`, {});
            }
            return;
        }

        if (data === 'cancel') {
            database.pendingUploads.delete(userId);
            await safeEditMessageText(chatId, messageId, '❌ Upload cancelled', {});
            return;
        }

        // Ban user
        if (data.startsWith('ban_user_')) {
            const targetId = parseInt(data.replace('ban_user_', ''));
            database.users.delete(targetId);
            await db.collection('users').doc(String(targetId)).delete();
            bot.answerCallbackQuery(query.id, { text: `✅ User ${targetId} banned`, show_alert: true });
            return;
        }

        // Give unlimited
        if (data.startsWith('unlimited_')) {
            const targetId = parseInt(data.replace('unlimited_', ''));
            const user = database.users.get(targetId);
            if (user) {
                user.unlimited = true;
                await saveUserToFirebase(targetId, user);
                bot.answerCallbackQuery(query.id, { text: '✅ Unlimited access granted', show_alert: true });
                bot.sendMessage(targetId, '🎊 *Admin Gift!*\n\nYou have been granted unlimited access to OTP KING!', {
                    parse_mode: 'Markdown'
                }).catch(() => {});
            }
            return;
        }

        // Reset user
        if (data.startsWith('reset_')) {
            const targetId = parseInt(data.replace('reset_', ''));
            const user = database.users.get(targetId);
            if (user) {
                user.numbersUsed = 0;
                user.referrals = 0;
                user.unlimited = false;
                await saveUserToFirebase(targetId, user);
                bot.answerCallbackQuery(query.id, { text: `✅ Stats reset for user ${targetId}`, show_alert: true });
            }
            return;
        }

        bot.answerCallbackQuery(query.id);
    } catch (error) {
        console.error('Callback error:', error);
        bot.answerCallbackQuery(query.id, { text: '❌ An error occurred' });
    }
});

// ============================================
// DOCUMENT UPLOADS
// ============================================

bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
        bot.sendMessage(chatId, '❌ You are not authorized to upload files.');
        return;
    }

    const file = msg.document;

    if (!file.file_name.endsWith('.txt')) {
        bot.sendMessage(chatId, '❌ Please send a TXT file only.');
        return;
    }

    try {
        const fileLink = await bot.getFileLink(file.file_id);
        const filePath = path.join(__dirname, `temp_${userId}.txt`);

        const fileStream = fs.createWriteStream(filePath);

        https.get(fileLink, (response) => {
            response.pipe(fileStream);
            fileStream.on('finish', async () => {
                fileStream.close();

                const numbers = await parseTXT(filePath);

                if (numbers.length === 0) {
                    bot.sendMessage(chatId, '❌ No valid numbers found in TXT file.');
                    return;
                }

                database.pendingUploads.set(userId, { numbers, fileName: file.file_name });

                bot.sendMessage(chatId, `✅ Parsed ${numbers.length} numbers.\n\n📝 Now send the country name (you can include emoji):`);
            });
        });
    } catch (error) {
        console.error('File upload error:', error);
        bot.sendMessage(chatId, '❌ Error processing file.');
    }
});

// ============================================
// TEXT MESSAGE HANDLERS (FIXED VERSION)
// ============================================

bot.on('message', async (msg) => {
    if (msg.document || msg.text?.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Check if user is sending a gift code
    if (text && text.trim().toUpperCase().startsWith('OKING')) {
        const code = text.trim().toUpperCase();
        const codeData = database.giftCodes.get(code);

        // Check if code exists
        if (!codeData) {
            bot.sendMessage(chatId, '❌ Invalid gift code.');
            return;
        }

        // Check if expired
        if (Date.now() > codeData.expiryTime) {
            bot.sendMessage(chatId, '❌ This gift code has expired.');
            return;
        }

        // Check if fully used
        if (codeData.claimedBy.length >= codeData.maxUsers) {
            bot.sendMessage(chatId, '❌ This gift code has been fully used.');
            return;
        }

        // Check if user already has unlimited access
        const user = getUser(userId);
        if (user.unlimited) {
            bot.sendMessage(chatId, '✅ You\'re Already A Premium User!');
            return;
        }

        // Check if user already claimed this code
        if (codeData.claimedBy.includes(userId)) {
            bot.sendMessage(chatId, '❌ You have already claimed this gift code.');
            return;
        }

        // Grant unlimited access
        user.unlimited = true;
        codeData.claimedBy.push(userId);

        await saveUserToFirebase(userId, user);
        await saveGiftCodeToFirebase(code, codeData);

        // Send success message to user
        bot.sendMessage(chatId, '🎉 *Code Claimed Successfully!* 🎊\n\nYou\'re now a Premium User! ✨', {
            parse_mode: 'Markdown'
        });

        // Notify admins
        const username = msg.from.username ? `@${msg.from.username}` : 'N/A';
        const claimsLeft = codeData.maxUsers - codeData.claimedBy.length;
        const totalClaims = codeData.maxUsers;

        for (const adminId of ADMIN_IDS) {
            try {
                await bot.sendMessage(adminId,
                    `🎁 *New Claim*\n\n` +
                    `👤 Username: ${username}\n` +
                    `🆔 User ID: \`${userId}\`\n` +
                    `📋 Code: \`${code}\`\n` +
                    `📊 Claims Left: ${claimsLeft}/${totalClaims}`,
                    { parse_mode: 'Markdown' }
                );
            } catch (e) {
                console.error('Error sending claim notification to admin:', e);
            }
        }
        return;
    }

    const pending = database.pendingUploads.get(userId);

    // Handle regular user support messages (non-admin)
    if (!isAdmin(userId) && pending && pending.action === 'support') {
        const username = msg.from.username || 'N/A';
        database.pendingUploads.delete(userId);

        const adminMessage =
            `📨 *New Support Message*\n\n` +
            `👤 User: @${username}\n` +
            `🆔 ID: \`${userId}\`\n` +
            `📝 Message: ${text}\n\n` +
            `Reply to this message using /reply ${userId}`;

        for (const adminId of ADMIN_IDS) {
            try {
                await bot.sendMessage(adminId, adminMessage, { parse_mode: 'Markdown' });
            } catch (e) {
                console.error('Error sending support message to admin:', e);
            }
        }

        bot.sendMessage(chatId, '✅ Your support message has been sent to our admin team. We will respond shortly!');
        return;
    }

    // Only admins can continue with other actions
    if (!isAdmin(userId)) return;

    // If admin but no pending action, ignore
    if (!pending) return;

    // Handle number upload country name
    if (pending.numbers && !pending.country) {
        pending.country = text;

        bot.sendMessage(chatId, 
            `📝 *Enter Country Code*\n\n` +
            `Send the country code (without +) to strip from all numbers.\n\n` +
            `Example: If your numbers start with 229, send: 229`
        );
        return;
    }

    // Handle number upload country code
    if (pending.numbers && pending.country && !pending.countryCode) {
        pending.countryCode = text;

        bot.sendMessage(chatId, 
            `📊 *Review Upload*\n\n` +
            `🌍 Country: ${pending.country}\n` +
            `🔢 Country Code: +${text}\n` +
            `📱 Numbers: ${pending.numbers.length}\n\n` +
            `Confirm to publish:`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Publish', callback_data: 'publish' },
                            { text: '❌ Cancel', callback_data: 'cancel' }
                        ]
                    ]
                }
            }
        );
        return;
    }

    // Handle broadcast
    if (pending.action === 'broadcast') {
        database.pendingUploads.delete(userId);
        let sent = 0;
        for (const [id, user] of database.users.entries()) {
            if (user.joined && id !== userId) {
                try {
                    await bot.sendMessage(id, `📢 *Broadcast*\n\n${text}`, { parse_mode: 'Markdown' });
                    sent++;
                } catch (e) {
                    // User blocked bot
                }
            }
        }
        bot.sendMessage(chatId, `✅ Broadcast sent to ${sent} users.`);
        return;
    }

    // Handle set referral
    if (pending.action === 'set_referral') {
        const num = parseInt(text);
        if (isNaN(num) || num < 1) {
            bot.sendMessage(chatId, '❌ Please send a valid number.');
            return;
        }
        database.referralRequired = num;
        await saveSettingsToFirebase();
        bot.sendMessage(chatId, `✅ Referral required set to ${num}`);
        database.pendingUploads.delete(userId);
        return;
    }

    // Handle add channel - name
    if (pending.action === 'add_channel_name') {
        pending.channelName = text.trim();
        pending.action = 'add_channel_link';
        bot.sendMessage(chatId, `✅ Name: *${pending.channelName}*\n\nNow send the channel *invite link* (e.g. https://t.me/yourchannel):`, {
            parse_mode: 'Markdown'
        });
        return;
    }

    // Handle add channel - link
    if (pending.action === 'add_channel_link') {
        pending.channelLink = text.trim();
        pending.action = 'add_channel_id';
        bot.sendMessage(chatId, `✅ Link: ${pending.channelLink}\n\nNow send the channel *Chat ID* (e.g. @channelname or -1001234567890):`, {
            parse_mode: 'Markdown'
        });
        return;
    }

    // Handle add channel - chat ID
    if (pending.action === 'add_channel_id') {
        const chatIdVal = text.trim();
        const channelId = `ch_${Date.now()}`;
        const channelData = {
            name: pending.channelName,
            link: pending.channelLink,
            chatId: chatIdVal
        };
        database.channels.set(channelId, channelData);
        await saveChannelToFirebase(channelId, channelData);
        database.pendingUploads.delete(userId);

        bot.sendMessage(chatId,
            `✅ *Channel Added!*\n\n` +
            `📛 Name: *${channelData.name}*\n` +
            `🔗 Link: ${channelData.link}\n` +
            `🆔 Chat ID: \`${channelData.chatId}\`\n\n` +
            `Total channels: ${database.channels.size}`,
            { parse_mode: 'Markdown' }
        );
        return;
    }

    // Handle search user
    if (pending.action === 'search_user') {
        const searchId = parseInt(text);
        if (isNaN(searchId)) {
            bot.sendMessage(chatId, '❌ Please send a valid User ID.');
            return;
        }

        const user = database.users.get(searchId);

        if (!user) {
            bot.sendMessage(chatId, `❌ User ID \`${searchId}\` not found in database.`, {
                parse_mode: 'Markdown'
            });
            database.pendingUploads.delete(userId);
            return;
        }

        const joinedDate = new Date(user.joinedAt).toLocaleDateString();
        const lastActiveDate = new Date(user.lastActive).toLocaleDateString();
        const lastActiveTime = new Date(user.lastActive).toLocaleTimeString();

        // Find who this user referred
        const referredUsers = Array.from(database.users.entries())
            .filter(([_, u]) => u.referredBy === searchId);

        const message =
            `👤 *User Details*\n\n` +
            `🆔 User ID: \`${searchId}\`\n` +
            `📅 Joined: ${joinedDate}\n` +
            `⏰ Last Active: ${lastActiveDate} ${lastActiveTime}\n\n` +
            `📊 *Stats*\n` +
            `├ Status: ${user.joined ? '✅ Joined' : '❌ Not Joined'}\n` +
            `├ Access: ${user.unlimited ? '♾️ Unlimited' : '🔒 Limited'}\n` +
            `├ Numbers Used: ${user.numbersUsed}\n` +
            `├ Referrals Made: ${user.referrals}\n` +
            `└ Referred By: ${user.referredBy ? `\`${user.referredBy}\`` : 'No one'}\n\n` +
            `👥 *Referred Users (${referredUsers.length})*\n` +
            `${referredUsers.length > 0 ? referredUsers.map(([id]) => `├ \`${id}\``).join('\n') : '└ None'}`;

        bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🚫 Ban User', callback_data: `ban_user_${searchId}` },
                        { text: '♾️ Give Unlimited', callback_data: `unlimited_${searchId}` }
                    ],
                    [{ text: '🔄 Reset Stats', callback_data: `reset_${searchId}` }]
                ]
            }
        });
        database.pendingUploads.delete(userId);
        return;
    }

    // Handle create gift code - number of users
    if (pending.action === 'create_code_users') {
        const num = parseInt(text);
        if (isNaN(num) || num < 1) {
            bot.sendMessage(chatId, '❌ Please send a valid number.');
            return;
        }
        pending.maxUsers = num;
        pending.action = 'create_code_expiry';

        bot.sendMessage(chatId, '⏰ *Select Expiry Time*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '24 hours', callback_data: 'expiry_24' }],
                    [{ text: '48 hours', callback_data: 'expiry_48' }],
                    [{ text: '72 hours', callback_data: 'expiry_72' }],
                    [{ text: '96 hours', callback_data: 'expiry_96' }],
                    [{ text: '120 hours', callback_data: 'expiry_120' }]
                ]
            }
        });
        return;
    }

    // Handle delete gift code
    if (pending.action === 'delete_code') {
        const code = text.trim().toUpperCase();

        if (!database.giftCodes.has(code)) {
            bot.sendMessage(chatId, '❌ Gift code not found.');
            database.pendingUploads.delete(userId);
            return;
        }

        database.giftCodes.delete(code);
        await deleteGiftCodeFromFirebase(code);
        bot.sendMessage(chatId, `✅ Gift code \`${code}\` has been deleted and is now invalid.`, {
            parse_mode: 'Markdown'
        });
        database.pendingUploads.delete(userId);
        return;
    }
});

// ============================================
// STARTUP
// ============================================

async function startBot() {
    console.log('🤖 OTP King Bot Starting...');
    console.log('📥 Loading data from Firebase...');

    const loaded = await loadDataFromFirebase();

    if (loaded) {
        console.log('✅ Bot ready with Firebase integration!');
        console.log(`📊 ${database.users.size} users loaded`);
        console.log(`🌍 ${database.numbers.size} country sets loaded`);
    } else {
        console.log('⚠️ Started with empty database - will sync as users interact');
    }

    console.log('🤖 Bot is now running...');
    console.log('📝 Bot Username: @getfreeotptemp_bot');
}

startBot();