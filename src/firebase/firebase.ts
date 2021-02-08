import firebase from 'firebase/app';
import 'firebase/firestore';
import {SharedGameState} from '../game/models';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAdX0DsMGuK9N1SCxzl4cQ-NLlxKOmcIvc',
  authDomain: 'zeddic-gcbc.firebaseapp.com',
  projectId: 'zeddic-gcbc',
  storageBucket: 'zeddic-gcbc.appspot.com',
  messagingSenderId: '702487337008',
  appId: '1:702487337008:web:7bc3cc8f671f7ee3e335f5',
  measurementId: 'G-ZZ5XSQG6R0',
};

firebase.initializeApp(FIREBASE_CONFIG);

firebase.firestore().settings({
  ignoreUndefinedProperties: true,
});

const db = firebase.firestore();

export function getGame(id: string): Promise<SharedGameState> {
  return db
    .collection('games')
    .doc(id)
    .get()
    .then(value => {
      return value.data() as SharedGameState;
    });
}

export function subscribeToGame(
  id: string,
  callback: (state: SharedGameState) => void
) {
  return db
    .collection('games')
    .doc(id)
    .onSnapshot(next => {
      callback(next.data() as SharedGameState);
    });
}

export function setGame(id: string, game: SharedGameState) {
  return db.collection('games').doc(id).set(game);
}
