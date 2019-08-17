// Imports the Google Cloud client library.
const { Firestore } = require('@google-cloud/firestore');
const jwt = require('jsonwebtoken');

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

exports.auth_token = async (token) => {
  if (!token) return false;
  return verifyToken(token).catch(handleError);
};
