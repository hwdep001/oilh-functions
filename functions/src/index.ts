import * as functions from 'firebase-functions';

import * as admin from 'firebase-admin';
admin.initializeApp();
const firestore = admin.firestore()
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

class UserInfo {
  uid: string;
  email: string;
  name?: string;
  lastDate: Date;
  emailVerified: boolean;
  etc?: string;
  pw?: string;
  regCode?: string;
}

exports.signUp = functions.firestore
    .document('users/{user}')
    .onCreate(async event => {
        
    const db = firestore;
    const userInfo = event.data() as UserInfo;
    
    // regCode delete
    await db.collection('regCodes').doc(userInfo.regCode).delete();
    
    // send notification
    const tokens = [];
    
    const admins = await db.collection('users').where('ad', '==', true).get();
    for(const adminDoc of admins.docs) {
      const uid = adminDoc.data().uid;
      const devices = await db.collection('devices').where('uid', '==', uid).get();

      for(const deviceDoc of devices.docs) {
        tokens.push(deviceDoc.data().token)
      }
    }

    if(tokens === null || tokens.length === 0) {
      return null;
    }

    const payload = {
      notification: {
        title: `SIGN UP!`,
        body: `${userInfo.name} - ${userInfo.email}`,
        icon: 'fcm_push_icon',
        sound: 'default',
        color: '#ff8100'
      }
    }

    return admin.messaging().sendToDevice(tokens, payload);
});