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
  const [darkMode, setDarkMode] = useState(true);

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
          <DisplayRooms darkMode={darkMode} />
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

function DisplayRooms(props) {
  const roomsRef = firestore.collection("rooms");
  const publicQuery = roomsRef.where("isPrivate", "==", false);
  const [publicRooms, publicLoading, publicError, publicSnapshot] =
    useCollectionData(publicQuery);
  const privateQuery = roomsRef
    .where("isPrivate", "==", true)
    .where("createdBy", "==", auth.currentUser.uid);
  const [privateRooms, privateLoading, privateError, privateSnapshot] =
    useCollectionData(privateQuery);
  const [roomName, setRoomName] = useState("");
  const [roomPresent, setRoomPresent] = useState(false);
  const [roomRef, setRoomRef] = useState(null);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [roomID, setRoomID] = useState("");

  useEffect(() => {}, [publicLoading, privateLoading]);

  if (publicLoading || privateLoading) {
    return <div>Loading...</div>;
  }

  if (publicError || privateError) {
    return <div>Error!</div>;
  }

  const publicRoomIDs = publicSnapshot.docs.map((Snapshot) => Snapshot.id);
  const privateRoomIDs = privateSnapshot.docs.map((Snapshot) => Snapshot.id);

  const publicRoomsList = publicRooms.map((room, index) => {
    return (
      <Room room={room} roomId={publicRoomIDs[index]} key={`public-${index}`} />
    );
  });

  const privateRoomsList = privateRooms.map((room, index) => {
    return (
      <Room
        room={room}
        roomId={privateRoomIDs[index]}
        key={`private-${index}`}
      />
    );
  });

  return (
    <>
      {!roomPresent ? (
        <div className="wrapper">
          <div className="show--public--rooms">
            <h2>Public Rooms</h2>
            <div className="rooms">{publicRoomsList}</div>
          </div>
          <div className="show--private--rooms">
            <h2>Private Rooms</h2>
            <div className="rooms">{privateRoomsList}</div>
          </div>
          <div className="create--room">
            <fieldset>
              <legend>Room Type</legend>
              <input
                type="radio"
                id="public"
                name="room-type"
                value="public"
                checked={!privateRoom}
                onChange={(e) => {
                  setPrivateRoom(false);
                }}
              />
              <label htmlFor="public">Public</label>
              <input
                type="radio"
                id="private"
                name="room-type"
                value="private"
                checked={privateRoom}
                onChange={(e) => {
                  setPrivateRoom(true);
                }}
              />
              <label htmlFor="private">Private</label>
            </fieldset>

            <input
              type="text"
              placeholder="Create a room"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const Ref = await roomsRef.add({
                    name: roomName,
                    createdBy: auth.currentUser.uid,
                    isPrivate: privateRoom,
                  });

                  setRoomRef(Ref);
                  setRoomPresent(true);
                  setRoomName("");
                }
              }}
            />

            <input
              type="text"
              placeholder="Enter room ID"
              value={roomID}
              onChange={(e) => {
                setRoomID(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (
                    privateRoomIDs.includes(roomID) ||
                    publicRoomIDs.includes(roomID)
                  ) {
                    setRoomRef({ id: roomID });
                    setRoomPresent(true);
                  } else alert("Room not present");
                }
              }}
            />
          </div>
        </div>
      ) : (
        <ChatRoom room={roomRef.id} darkMode={props.darkMode} />
      )}
    </>
  );
}

function Room(props) {
  return (
    <div className="room">
      {props.room.name} {props.roomId}
    </div>
  );
}

function ChatRoom(props) {
  const dummy = useRef();
  //refers to the messages in firebase
  const messagesRef = firestore.collection(`rooms/${props.room}/messages`);
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
