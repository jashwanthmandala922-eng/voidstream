import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { getDataConnect } from 'firebase/data-connect';

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FB_KEY,
  authDomain:        process.env.REACT_APP_FB_DOMAIN,
  projectId:         process.env.REACT_APP_FB_PROJECT,
  storageBucket:     process.env.REACT_APP_FB_BUCKET,
  messagingSenderId: process.env.REACT_APP_FB_SENDER,
  appId:             process.env.REACT_APP_FB_APP
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const dataConnect = getDataConnect(app, {
  service: 'voidstream',
  location: 'asia-southeast1',
  connector: 'watch'
});
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
