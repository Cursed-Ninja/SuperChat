import "./App.css";

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faWindows } from "@fortawesome/free-brands-svg-icons";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";

import { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

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
  return (
    <div className="App">
      <header>
        <h1>SuperChat App</h1>
        {user && <Logout />}
      </header>
      <section>{user ? <ChatRoom /> : <Login />}</section>
    </div>
  );
}

function Login() {
  const signInWithGoogle = () => {
    //automatically signs in with google
    const provider = new firebase.auth.GoogleAuthProvider();

    //displays popup window to sign in with google
    auth.signInWithPopup(provider);
  };
  return (
    <button className="login" onClick={signInWithGoogle}>
      <FontAwesomeIcon icon={faGoogle} className="icon" /> Sign in with{" "}
      <b>Google</b>
    </button>
  );
}

function Logout() {
  // If user present then sign out
  const [winSize, setWinSize] = useState(window.innerWidth);
  useEffect(() => {
    window.addEventListener("resize", () => {
      setWinSize(window.innerWidth);
    });
  }, [winSize]);
  return (
    auth.currentUser && (
      <button className="logout" onClick={() => auth.signOut()}>
        {winSize > 400 ? "Sign Out" : <FontAwesomeIcon icon={faSignOut} />}
      </button>
    )
  );
}

function ChatRoom() {
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
  const [load, setLoad] = useState(false);
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
    // <div className="form-container">
    <>
      <main>
        {messages &&
          messages
            .map((msg) => <ChatMessage key={msg.id} message={msg} />)
            .reverse()}
        <div ref={dummy}></div>
      </main>
      <div className="bottom">
        <form onSubmit={sendMessage}>
          <input
            placeholder="Enter your message."
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
          />
          <button disabled={!formValue} type="submit">
            📩
          </button>
        </form>
        <footer>Made with ❤️ by Shivam Mahajan</footer>
      </div>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  return (
    <>
      <div className={`message ${messageClass}`}>
        <img src={photoURL} alt="Profile" />
        <p>{text}</p>
      </div>
    </>
  );
}

export default App;
