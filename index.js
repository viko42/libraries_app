// Imports the Google Cloud client library.
const { Firestore } = require('@google-cloud/firestore');

const jwt = require('jsonwebtoken');
const {Expo} = require('expo-server-sdk');

// console.log(Expo);
// Create a new client
const firestore = new Firestore();

const handleError = (err) => {
  console.log(err);
  return false;
};

const getUser = ({ path }) => new Promise(async (resolve, reject) => {
  // Get document from firestore
  const document = firestore.doc(path);

  const user = await document.get().catch(reject);
  if (!user) return reject();

  return resolve({ userPath: path, user: user.data() });
});

const verifyToken = token => new Promise((resolve, reject) => {
  return jwt.verify(token, process.env.JWT, async (err, decoded) => {
    if (err || !decoded) {
      return reject(err);
    }
    return getUser(decoded).then(resolve).catch(reject);
  });
});

const sendMobileNotification = async (path, {
  title = 'Test notification',
  sound = 'default',
  data = {},
}) => {
  let expo = new Expo();

  const { user } = await getUser({ path }).catch(() => null);

  if (!user || !user.notificationToken) return false;

  console.log(user.notificationToken);
  if (!Expo.isExpoPushToken(user.notificationToken)) {
    console.error(`Push token ${user.notificationToken} is not a valid Expo push token`);
    // continue;
  }

  // let chunks = expo.chunkPushNotifications([
  //   {
  //     to: user.notificationToken,
  //     sound,
  //     body: title,
  //     data,
  //   }
  // ]);
  await expo.sendPushNotificationsAsync([{
    to: user.notificationToken,
    sound,
    body: title,
    data,
  }]);

  return true;
};

const addLog = async (message, path) => {
  try {
    const document = firestore.doc(path);

    const documentSnapshot = await document.get();
    if (!documentSnapshot) throw "document not found";

    const { logs = [] } = documentSnapshot.data();

    logs.push({
      createdAt: new Date(),
      message,
    });

    await document.update({ logs });
    return ({ err: null, code: 200 });
  } catch(e) {
    return ({ err: e.message, code: 400 });
  }
};

exports.auth_token = async (token) => {
  if (!token) return false;
  return verifyToken(token).catch(handleError);
};

exports.sendMobileNotification = sendMobileNotification;
exports.addLog = addLog;