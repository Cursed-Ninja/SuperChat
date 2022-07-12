import "./App.css";

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";
import { faMoon } from "@fortawesome/free-solid-svg-icons";
import { faSun } from "@fortawesome/free-solid-svg-icons";

import { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

import ReactIcon from "./images/React-icon.png";

firebase.initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`App ${darkMode ? "dark" : ""}`}>
      <header className={darkMode ? "dark" : ""}>
        <button
          onClick={() => setDarkMode((prevDarkMode) => !prevDarkMode)}
          className={`dark-mode ${darkMode ? "active" : ""}`}
        >
          {darkMode ? (
            <FontAwesomeIcon icon={faSun} />
          ) : (
            <FontAwesomeIcon icon={faMoon} />
          )}
        </button>
        <h1>SuperChat App</h1>
        {user && <Logout darkMode={darkMode} />}
      </header>
      <section className={darkMode ? "dark" : ""}>
        {user ? (
          <ChatRoom darkMode={darkMode} />
        ) : (
          <Login darkMode={darkMode} />
        )}
      </section>
    </div>
  );
}

function Login(props) {
  const signInWithGoogle = () => {
    //automatically signs in with google
    const provider = new firebase.auth.GoogleAuthProvider();

    //displays popup window to sign in with google
    auth.signInWithPopup(provider);
  };
  return (
    <button
      className={`login ${props.darkMode ? "dark" : ""}`}
      onClick={signInWithGoogle}
    >
      <FontAwesomeIcon icon={faGoogle} className="icon" /> Sign in with{" "}
      <b>Google</b>
    </button>
  );
}

function Logout(props) {
  // If user present then sign out
  const [winSize, setWinSize] = useState(window.innerWidth);
  useEffect(() => {
    window.addEventListener("resize", () => {
      setWinSize(window.innerWidth);
    });
  }, [winSize]);
  return (
    auth.currentUser && (
      <button
        className={`logout ${props.darkMode ? "dark" : ""}`}
        onClick={() => auth.signOut()}
      >
        {winSize > 500 ? "Sign Out" : <FontAwesomeIcon icon={faSignOut} />}
      </button>
    )
  );
}

function ChatRoom(props) {
  const dummy = useRef();
  //refers to the messages in firebase
  const messagesRef = firestore.collection("messages");
  //makes a query to extract most recent 25 messages

  const query = messagesRef.orderBy("createdAt", "desc").limit(25);

  //Listens to any update to the data in firebase
  //Returns array of objects where each object is a message in db
  const [messages] = useCollectionData(query, { idField: "id" });
  //set state
  const [formValue, setFormValue] = useState("");
  useEffect(() => {
    dummy.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    //prevent refersh on submit
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    //add new document to database
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue("");
    dummy.current.scrollIntoView({ behaviour: "smooth" });
  };

  return (
    <>
      <main className={props.darkMode ? "dark" : ""}>
        {messages &&
          messages
            .map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                darkMode={props.darkMode}
              />
            ))
            .reverse()}
        <div ref={dummy}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input
          className={`${props.darkMode ? "dark" : ""}`}
          type="text"
          placeholder="Enter your message."
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
        />
        <button
          disabled={!formValue}
          type="submit"
          className={`btn-submit ${props.darkMode ? "dark" : ""}`}
        >
          📩
        </button>
        <footer className={props.darkMode ? "dark" : ""}>
          Made with ❤️ by Shivam Mahajan
        </footer>
      </form>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid } = props.message;
  let photoURL = props.message.photoURL;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  const addDefaultSrc = (ev) => (ev.target.src = ReactIcon);
  if (photoURL === undefined) photoURL = ReactIcon;
  return (
    <>
      <div
        className={`message ${messageClass} ${props.darkMode ? "dark" : ""}`}
      >
        <img src={photoURL} alt="Profile" onError={addDefaultSrc} />
        <p>{text}</p>
      </div>
    </>
  );
}

export default App;
