import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  get,
  update,
} from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC510_aTDnyuiTFdQzhsTjvyib7mlTx-9Y",
  authDomain: "pandapostlis.firebaseapp.com",
  databaseURL: "https://pandapostlis-default-rtdb.firebaseio.com",
  projectId: "pandapostlis",
  storageBucket: "pandapostlis.firebasestorage.app",
  messagingSenderId: "52552102901",
  appId: "1:52552102901:web:ef103473eebe6cebc366bc",
  measurementId: "G-R4LEBQR2L5",
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getDatabase(app);

// Refs
export const instructorsRef = ref(db, "instructors");
export const clicksRef = ref(db, "clicks");
export const userClicksRef = ref(db, "userClicks");

// Функция для проверки, может ли пользователь кликнуть
export const canUserClick = async (instructorId, userId) => {
  const userClickRef = ref(db, `userClicks/${userId}_${instructorId}`);
  const snapshot = await get(userClickRef);

  if (!snapshot.exists()) {
    return true;
  }

  const lastClick = snapshot.val().lastClickDate;
  const lastClickDate = new Date(lastClick);
  const now = new Date();
  const diffTime = Math.abs(now - lastClickDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 7;
};

// Функция для записи клика
export const recordClick = async (instructorId, instructorName, userId) => {
  try {
    // Записываем клик в историю
    const newClickRef = push(clicksRef);
    await set(newClickRef, {
      instructorId,
      instructorName,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    // Получаем текущие клики инструктора
    const instructorRef = ref(db, `instructors/${instructorId}`);
    const instructorSnapshot = await get(instructorRef);
    const currentClicks = instructorSnapshot.val()?.clicks || 0;

    // Обновляем счетчик кликов для инструктора
    await update(instructorRef, {
      clicks: currentClicks + 1,
    });

    // Записываем информацию о клике пользователя
    const userClickRef = ref(db, `userClicks/${userId}_${instructorId}`);
    const userClickSnapshot = await get(userClickRef);
    const currentUserClicks = userClickSnapshot.val()?.clickCount || 0;

    await set(userClickRef, {
      instructorId,
      userId,
      lastClickDate: new Date().toISOString(),
      clickCount: currentUserClicks + 1,
    });

    return true;
  } catch (error) {
    console.error("Error recording click:", error);
    return false;
  }
};
