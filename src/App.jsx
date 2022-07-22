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
  const [allRooms, allLoading, allError, allSnapshot] =
    useCollectionData(roomsRef);

  useEffect(() => {}, [publicLoading, privateLoading, allLoading]);

  if (publicLoading || privateLoading || allLoading) {
    return <div>Loading...</div>;
  }

  if (publicError || privateError) {
    return <div>Error!</div>;
  }

  const publicRoomIDs = publicSnapshot.docs.map((Snapshot) => Snapshot.id);
  const privateRoomIDs = privateSnapshot.docs.map((Snapshot) => Snapshot.id);
  const allRoomIDs = allSnapshot.docs.map((Snapshot) => Snapshot.id);
  const publicRoomsList = publicRooms.map((room, index) => {
    return (
      <Room
        darkMode={props.darkMode}
        room={room}
        roomId={publicRoomIDs[index]}
        key={`public-${index}`}
        setRoomPresent={setRoomPresent}
        setRoomRef={setRoomRef}
      />
    );
  });

  const privateRoomsList = privateRooms.map((room, index) => {
    return (
      <Room
        darkMode={props.darkMode}
        room={room}
        roomId={privateRoomIDs[index]}
        key={`private-${index}`}
        setRoomPresent={setRoomPresent}
        setRoomRef={setRoomRef}
      />
    );
  });

  return (
    <>
      {!roomPresent ? (
        <div className="wrapper">
          <div className="rooms--wrapper">
            <div className={`show--rooms ${props.darkMode ? "dark" : ""}`}>
              <h2>Public Rooms</h2>
              <div className={`rooms ${props.darkMode ? "dark" : ""}`}>
                {publicRoomsList}
              </div>
            </div>
            <div className={`show--rooms ${props.darkMode ? "dark" : ""}`}>
              <h2>Private Rooms</h2>
              <div className={`rooms ${props.darkMode ? "dark" : ""}`}>
                {privateRoomsList}
              </div>
            </div>
          </div>
          <div className="create-find-room">
            <fieldset className={`${props.darkMode ? "dark" : ""}`}>
              <legend>Create Room Type</legend>
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
            <div className="input--text--wrapper">
              <input
                className={`search ${props.darkMode ? "dark" : ""}`}
                type="text"
                placeholder="Create a room"
                value={roomName}
                maxLength="10"
                onChange={(e) => {
                  setRoomName(e.target.value);
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    if (roomName.length === 0)
                      alert("Please enter a room name");
                    else {
                      const Ref = await roomsRef.add({
                        name: roomName,
                        createdBy: auth.currentUser.uid,
                        isPrivate: privateRoom,
                      });

                      setRoomRef(Ref);
                      setRoomPresent(true);
                      setRoomName("");
                    }
                  }
                }}
              />
              <button
                className={`${props.darkMode ? "dark" : ""} search--btn`}
                onClick={async (e) => {
                  if (roomName.length === 0) alert("Please enter a room name");
                  else {
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
              >
                🔍
              </button>
            </div>
            <div className="input--text--wrapper">
              <input
                className={`search ${props.darkMode ? "dark" : ""}`}
                type="text"
                placeholder="Enter room ID"
                value={roomID}
                onChange={(e) => {
                  setRoomID(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (allRoomIDs.includes(roomID)) {
                      setRoomRef({ id: roomID });
                      setRoomPresent(true);
                    } else alert("Room not present");
                  }
                }}
              />
              <button
                className={`${props.darkMode ? "dark" : ""} search--btn`}
                onClick={() => {
                  if (allRoomIDs.includes(roomID)) {
                    setRoomRef({ id: roomID });
                    setRoomPresent(true);
                  } else alert("Room not present");
                }}
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ChatRoom room={roomRef.id} darkMode={props.darkMode} />
      )}
    </>
  );
}

function Check(roomID, roomsRef) {
  const query = roomsRef.where(
    firebase.firestore.FieldPath.documentId(),
    "==",
    roomID
  );
  const [res, loading, error] = useCollectionData(query);
  useEffect(() => {}, [loading]);
  if (!loading) {
    return res;
  }
}

function Room(props) {
  return (
    <div className={`room ${props.darkMode ? "dark" : ""}`}>
      <span>{props.room.name}</span> <span>{props.roomId}</span>
      <button
        className={`open--btn ${props.darkMode ? "dark" : ""}`}
        onClick={() => {
          props.setRoomRef({ id: props.roomId });
          props.setRoomPresent(true);
        }}
      >
        Open
      </button>
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
  const [messages] = useCollectionData(query);
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
