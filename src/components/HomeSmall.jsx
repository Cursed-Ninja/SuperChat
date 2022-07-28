import ReactIcon from "../images/React-icon.png";

import { useState, useEffect, useRef, useContext } from "react";

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

import { useCollectionData } from "react-firebase-hooks/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import GoogleIcon from "@mui/icons-material/Google";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { isLightModeContext, setIsLightModeContext } from "../App";

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

export default function HomeSmall() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [roomType, setRoomType] = useState("public");
  const [searchRoom, setSearchRoom] = useState("");
  const [roomRef, setRoomRef] = useState(null);
  const [user] = useAuthState(auth);
  const [showRoom, setShowRoom] = useState(false);

  const isLightMode = useContext(isLightModeContext);
  const setIsLightMode = useContext(setIsLightModeContext);

  const addDefaultSrc = (ev) => (ev.target.src = ReactIcon);
  return (
    <>
      {user ? (
        <div className={`content ${isLightMode ? "light" : ""}`}>
          {!showRoom ? (
            <div className={`side-bar ${isLightMode ? "light" : ""}`}>
              <div className={`side-bar-header ${isLightMode ? "light" : ""}`}>
                <img
                  src={user.photoURL}
                  onError={addDefaultSrc}
                  alt="Profile"
                />
                <div className={`theme-switcher ${isLightMode ? "light" : ""}`}>
                  <input
                    className="checkbox"
                    type="checkbox"
                    id="checkbox"
                    checked={isLightMode}
                    onChange={(e) => setIsLightMode(e.target.checked)}
                  />
                  <Tooltip title="Change Theme">
                    <label htmlFor="checkbox" className="label">
                      <LightModeIcon sx={{ color: "white", fontSize: 20 }} />
                      <DarkModeIcon sx={{ color: "white", fontSize: 20 }} />
                      <div className="ball"></div>
                    </label>
                  </Tooltip>
                </div>
                <Tooltip title="Logout">
                  <button onClick={() => auth.signOut()}>
                    <LogoutIcon />
                  </button>
                </Tooltip>
              </div>
              <div className={`input ${isLightMode ? "light" : ""}`}>
                <button>
                  <SearchIcon fontSize="small" />
                </button>
                <input
                  type="text"
                  placeholder="Find a Room"
                  maxLength="25"
                  value={searchRoom}
                  onChange={(e) => setSearchRoom(e.target.value)}
                />
                <Tooltip title="Search by IDs must start with '$' and result is shown only for exact match">
                  <InfoIcon className="info" />
                </Tooltip>
              </div>
              <div className={`room-options ${isLightMode ? "light" : ""}`}>
                <button
                  className={roomType === "public" ? "active" : ""}
                  onClick={(e) => setRoomType("public")}
                >
                  Public
                </button>
                <button
                  className={roomType === "private" ? "active" : ""}
                  onClick={(e) => setRoomType("private")}
                >
                  Private
                </button>
              </div>
              <Rooms
                setRoomRef={setRoomRef}
                roomType={roomType}
                searchRoom={searchRoom}
                setRoomType={setRoomType}
                setShowRoom={setShowRoom}
              />
            </div>
          ) : (
            <div className="main-content">
              {roomRef === null ? (
                <DisplayInfo />
              ) : (
                <RoomView
                  roomRef={roomRef}
                  setRoomRef={setRoomRef}
                  setShowRoom={setShowRoom}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

function Login() {
  const isLightMode = useContext(isLightModeContext);

  const signInWithGoogle = () => {
    //automatically signs in with google
    const provider = new firebase.auth.GoogleAuthProvider();

    //displays popup window to sign in with google
    auth.signInWithPopup(provider);
  };
  return (
    <div className={`login ${isLightMode ? "light" : ""}`}>
      <button onClick={signInWithGoogle}>
        <GoogleIcon className="icon" sx={{ fontSize: "1em" }} />
        <b>Login With Google</b>
      </button>
      <div>
        <span>PS: Authentication is done by Google.</span>
        <span>I can't access your password.</span>
      </div>
    </div>
  );
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#ffd369",
    },
    secondary: {
      main: "#ff0063",
    },
  },
});

function CircularIndeterminate() {
  const isLightMode = useContext(isLightModeContext);

  return (
    <div className="loader">
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex" }}>
          <CircularProgress color={isLightMode ? "secondary" : "primary"} />
        </Box>
      </ThemeProvider>
    </div>
  );
}

function Rooms(props) {
  const roomsRef = firestore.collection("rooms");
  const isLightMode = useContext(isLightModeContext);

  const [allData, allLoading, allError, allSnapshot] =
    useCollectionData(roomsRef);

  useEffect(() => {}, [allLoading]);

  if (allLoading) {
    return <CircularIndeterminate />;
  }

  if (allError) {
    console.log(allError);
    return <></>;
  }

  let privateRooms = [],
    publicRooms = [],
    allRooms = [];

  for (let i = 0; i < allSnapshot.docs.length; i++) {
    if (allData[i].isPrivate) {
      if (allData[i].createdBy === auth.currentUser.uid) {
        privateRooms.push({ ...allData[i], id: allSnapshot.docs[i].id });
      }
    } else {
      publicRooms.push({ ...allData[i], id: allSnapshot.docs[i].id });
    }

    allRooms.push({ ...allData[i], id: allSnapshot.docs[i].id });
  }

  let publicRoomsList = allRooms.map((room, index) => {
    if (!room.isPrivate) {
      if (props.searchRoom === "") {
        return (
          <Room
            room={room}
            key={`public-${index}`}
            setRoomRef={props.setRoomRef}
            setShowRoom={props.setShowRoom}
          />
        );
      } else if (props.searchRoom[0] === "$") {
        const id = props.searchRoom.substring(1);
        if (room.id === id) {
          return (
            <Room
              room={room}
              key={`public-${index}`}
              setRoomRef={props.setRoomRef}
              setShowRoom={props.setShowRoom}
            />
          );
        }
      } else if (
        room.name.toLowerCase().includes(props.searchRoom.toLowerCase())
      )
        return (
          <Room
            room={room}
            key={`public-${index}`}
            setRoomRef={props.setRoomRef}
            setShowRoom={props.setShowRoom}
          />
        );
    }
  });

  let privateRoomsList = allRooms.map((room, index) => {
    if (room.isPrivate) {
      if (props.searchRoom === "" && room.createdBy === auth.currentUser.uid) {
        return (
          <Room
            room={room}
            key={`private-${index}`}
            setRoomRef={props.setRoomRef}
            setShowRoom={props.setShowRoom}
          />
        );
      } else if (props.searchRoom[0] === "$") {
        const id = props.searchRoom.substring(1);
        if (room.id === id) {
          return (
            <Room
              room={room}
              key={`private-${index}`}
              setRoomRef={props.setRoomRef}
              setShowRoom={props.setShowRoom}
            />
          );
        }
      } else if (
        room.name.toLowerCase().includes(props.searchRoom.toLowerCase()) &&
        room.createdBy === auth.currentUser.uid
      )
        return (
          <Room
            room={room}
            key={`private-${index}`}
            setRoomRef={props.setRoomRef}
            setShowRoom={props.setShowRoom}
          />
        );
    }
  });

  privateRoomsList = privateRoomsList.filter((room) => room !== undefined);
  publicRoomsList = publicRoomsList.filter((room) => room !== undefined);

  if (props.searchRoom[0] === "$")
    if (privateRoomsList.length !== 0) props.setRoomType("private");
    else if (publicRoomsList.length !== 0) props.setRoomType("public");

  return (
    <div className={`rooms ${isLightMode ? "light" : ""}`}>
      <CreateRoom
        roomsRef={roomsRef}
        setRoomRef={props.setRoomRef}
        setRoomType={props.setRoomType}
        setShowRoom={props.setShowRoom}
      />
      {props.roomType === "public" ? (
        publicRoomsList.length === 0 ? (
          <NoResultFound />
        ) : (
          publicRoomsList
        )
      ) : privateRoomsList.length === 0 ? (
        <NoResultFound />
      ) : (
        privateRoomsList
      )}
    </div>
  );
}

function Room(props) {
  const isLightMode = useContext(isLightModeContext);

  return (
    <div
      className={`room ${isLightMode ? "light" : ""}`}
      onClick={() => {
        props.setRoomRef({
          name: props.room.name,
          id: props.room.id,
          isPrivate: props.room.isPrivate,
          createdBy: props.room.createdBy,
        });

        props.setShowRoom(true);
      }}
    >
      <span>{props.room.name}</span>
      <KeyboardArrowRightIcon />
    </div>
  );
}

function CreateRoom(props) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [roomType, setRoomType] = useState("public");
  const [newRoomName, setNewRoomName] = useState("");
  const isLightMode = useContext(isLightModeContext);

  return (
    <div className="create-room">
      <div
        className={`create-room-card ${isLightMode ? "light" : ""}`}
        onClick={() => setShowOverlay(true)}
      >
        <AddIcon className="add-icon" />
        <span>Create a New Room</span>
      </div>
      <div
        className={`create-room-overlay ${showOverlay ? "active" : ""}`}
        onClick={() => setShowOverlay(false)}
      >
        <div
          className="create-room-overlay-content"
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Enter details to Create a New Room</h3>
          <fieldset>
            <legend>Select a room type</legend>
            <label htmlFor="public">Public</label>
            <input
              type="radio"
              name="roomtype"
              id="public"
              value="public"
              onChange={() => setRoomType("public")}
              checked={roomType === "public"}
            />
            <label htmlFor="private">Private</label>
            <input
              type="radio"
              name="roomtype"
              id="private"
              value="private"
              onChange={() => setRoomType("private")}
              checked={roomType === "private"}
            />
          </fieldset>
          <div>
            <input
              type="text"
              placeholder="Enter room name"
              maxLength="25"
              value={newRoomName}
              onChange={(e) => {
                setNewRoomName(e.target.value);
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  if (newRoomName.length === 0)
                    alert("Please enter a room name");
                  else if (newRoomName[0] === "$")
                    alert("RoomName must not start with '$'");
                  else {
                    const Ref = await props.roomsRef.add({
                      name: newRoomName,
                      createdBy: auth.currentUser.uid,
                      isPrivate: roomType === "private",
                    });
                    setNewRoomName("");
                    setRoomType("public");
                    setShowOverlay(false);
                    props.setRoomType(roomType);
                    props.setRoomRef({
                      name: newRoomName,
                      id: Ref.id,
                      isPrivate: roomType === "private",
                      createdBy: auth.currentUser.uid,
                    });
                    props.setShowRoom(true);
                  }
                }
              }}
            />
            <Tooltip title="RoomName must not start with '$'">
              <InfoIcon className="info" />
            </Tooltip>
            <button
              onClick={async (e) => {
                if (newRoomName.length === 0) alert("Please enter a room name");
                else if (newRoomName[0] === "$")
                  alert("RoomName must not start with '$'");
                else {
                  const Ref = await props.roomsRef.add({
                    name: newRoomName,
                    createdBy: auth.currentUser.uid,
                    isPrivate: roomType === "private",
                  });
                  setNewRoomName("");
                  setRoomType("public");
                  setShowOverlay(false);
                  props.setRoomType(roomType);
                  props.setRoomRef({
                    name: newRoomName,
                    id: Ref.id,
                    isPrivate: roomType === "private",
                    createdBy: auth.currentUser.uid,
                  });
                  props.setShowRoom(true);
                }
              }}
            >
              <AddIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoResultFound() {
  const isLightMode = useContext(isLightModeContext);

  return (
    <div className={`no-result-found ${isLightMode ? "light" : ""}`}>
      No Result Found!
    </div>
  );
}

function DisplayInfo() {
  const isLightMode = useContext(isLightModeContext);

  return (
    <div className={`about ${isLightMode ? "light" : ""}`}>
      <h2>SuperChat App</h2>
      <p>Made with ❤️ by Shivam Mahajan</p>
    </div>
  );
}

function RoomView(props) {
  async function handleClick(e, roomRef) {
    if (roomRef.createdBy === auth.currentUser.uid) {
      const roomsRef = firestore.collection("rooms");
      await roomsRef.doc(roomRef.id).delete();
      props.setRoomRef(null);
    } else {
      alert(
        "Unauthorized to delete room. You can only delete your own private rooms"
      );
    }
  }

  return (
    <div className="roomview">
      <div className="roomview-header">
        <Tooltip title="Return to rooms">
          <ArrowBackIcon
            className="roomview-header-icon"
            onClick={() => props.setShowRoom(false)}
          />
        </Tooltip>
        <Tooltip title={`Room ID: $${props.roomRef.id}`}>
          <InfoIcon className="roomview-header-icon" />
        </Tooltip>
        <Tooltip title="Room Name">
          <span>{props.roomRef.name}</span>
        </Tooltip>
        <Tooltip title="Room Type">
          <span>{props.roomRef.isPrivate ? "Private" : "Public"}</span>
        </Tooltip>
        {props.roomRef.isPrivate && (
          <span>
            <Tooltip title="Delete Room">
              <DeleteIcon
                className="roomview-header-icon"
                onClick={(e) => handleClick(e, props.roomRef)}
              />
            </Tooltip>
          </span>
        )}
      </div>
      <div className="roomview-content">
        <ChatRoom roomRef={props.roomRef} />
      </div>
    </div>
  );
}

function ChatRoom(props) {
  const dummy = useRef();

  const messagesRef = firestore.collection(
    `rooms/${props.roomRef.id}/messages`
  );
  const query = messagesRef.orderBy("createdAt", "desc").limit(25);

  const [messages] = useCollectionData(query);

  const [formValue, setFormValue] = useState("");
  const isLightMode = useContext(isLightModeContext);

  useEffect(() => {
    dummy.current.scrollIntoView({ behaviour: "smooth" });
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
    <div className={`roomview-content-chatroom ${isLightMode ? "light" : ""}`}>
      <main>
        {messages &&
          messages
            .map((msg) => <ChatMessage key={msg.id} message={msg} />)
            .reverse()}
        <div ref={dummy}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Enter your message."
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
        />
        <button disabled={!formValue} type="submit">
          📩
        </button>
      </form>
    </div>
  );
}

function ChatMessage(props) {
  const isLightMode = useContext(isLightModeContext);

  const { text, uid, photoURL } = props.message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  const addDefaultSrc = (ev) => (ev.target.src = ReactIcon);
  return (
    <div className={`message ${messageClass} ${isLightMode ? "light" : ""}`}>
      <img src={photoURL} alt="Profile" onError={addDefaultSrc} />
      <p>{text}</p>
    </div>
  );
}
