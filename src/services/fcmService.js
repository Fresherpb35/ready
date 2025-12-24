import { getToken } from "firebase/messaging";
import { messaging } from "../config/firebase";

getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })
  .then(token => console.log("Receiver FCM token:", token))
  .catch(err => console.error(err));
