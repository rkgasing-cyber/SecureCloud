const firebaseConfig = {
  apiKey: "AIzaSyBVxWfjezJclXHsAUsj7oQ93Eiu09Sg-x4",
  authDomain: "cloud-95bdb.firebaseapp.com",
  projectId: "cloud-95bdb",
  storageBucket: "cloud-95bdb.firebasestorage.app",
  messagingSenderId: "387132286857",
  appId: "1:387132286857:web:9b2c58c523e210ae3d2358"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentProfile = null;
let selectedUser = null;
let stopMessages = null;

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value || "";
  return div.innerHTML;
}

function showAuthMessage(text, error = false) {
  const box = $("authMessage");
  if (!box) return;

  box.textContent = text;
  box.style.color = error ? "#d33" : "#159447";
}

function showToast(text) {
  const box = $("toast");
  if (!box) return;

  box.textContent = text;
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  }, 2500);
}

function firebaseError(error) {
  const errors = {
    "auth/email-already-in-use":
      "This email is already registered. Try Login.",

    "auth/invalid-email":
      "Enter a valid email address.",

    "auth/weak-password":
      "Password must contain at least 6 characters.",

    "auth/user-not-found":
      "No account found with this email.",

    "auth/wrong-password":
      "Wrong password.",

    "auth/invalid-credential":
      "Email or password is incorrect.",

    "auth/operation-not-allowed":
      "This login method is not enabled in Firebase.",

    "auth/popup-closed-by-user":
      "Google login was cancelled.",

    "auth/popup-blocked":
      "Google login popup was blocked."
  };

  return errors[error.code] ||
    error.message ||
    "Something went wrong.";
}


/* ================= AUTH SWITCH ================= */

$("showSignup").onclick = function () {
  $("loginBox").classList.add("hidden");
  $("signupBox").classList.remove("hidden");
  showAuthMessage("");
};

$("showLogin").onclick = function () {
  $("signupBox").classList.add("hidden");
  $("loginBox").classList.remove("hidden");
  showAuthMessage("");
};


/* ================= CREATE ACCOUNT ================= */

$("signupForm").onsubmit = async function (event) {
  event.preventDefault();

  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const password = $("signupPassword").value;

  if (!name || !email || !password) {
    showAuthMessage("Please fill all fields.", true);
    return;
  }

  try {
    showAuthMessage("Creating account...");

    const result =
      await auth.createUserWithEmailAndPassword(
        email,
        password
      );

    await result.user.updateProfile({
      displayName: name
    });

    await db
      .collection("users")
      .doc(result.user.uid)
      .set({
        name: name,
        email: email,
        createdAt:
          firebase.firestore.FieldValue.serverTimestamp()
      });

    showAuthMessage("Account created successfully.");

  } catch (error) {
    console.error(error);
    showAuthMessage(
      firebaseError(error),
      true
    );
  }
};


/* ================= LOGIN ================= */

$("loginForm").onsubmit = async function (event) {
  event.preventDefault();

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;

  try {
    showAuthMessage("Logging in...");

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

    $("loginForm").reset();

  } catch (error) {
    console.error(error);

    showAuthMessage(
      firebaseError(error),
      true
    );
  }
};


/* ================= GOOGLE LOGIN ================= */

$("googleLoginBtn").onclick = async function () {

  try {

    const provider =
      new firebase.auth.GoogleAuthProvider();

    await auth.signInWithPopup(provider);

  } catch (error) {

    console.error(error);

    showAuthMessage(
      firebaseError(error),
      true
    );
  }
};


/* ================= LOGOUT ================= */

$("logoutBtn").onclick = async function () {

  try {
    await auth.signOut();
  } catch (error) {
    console.error(error);
  }

};


/* ================= PROFILE ================= */

async function loadProfile() {

  const ref =
    db.collection("users")
      .doc(currentUser.uid);

  const result =
    await ref.get();

  if (result.exists) {

    currentProfile =
      result.data();

  } else {

    currentProfile = {
      name:
        currentUser.displayName || "User",

      email:
        currentUser.email || ""
    };

    await ref.set(currentProfile);
  }

  const name =
    currentProfile.name || "User";

  const email =
    currentProfile.email ||
    currentUser.email ||
    "";

  $("userName").textContent = name;
  $("dashboardName").textContent = name;
  $("infoName").textContent = name;
  $("infoEmail").textContent = email;
  $("userAvatar").textContent =
    name.charAt(0).toUpperCase();
}


/* ================= AUTH STATE ================= */

auth.onAuthStateChanged(
  async function (user) {

    if (!user) {

      currentUser = null;

      $("authPage")
        .classList
        .remove("hidden");

      $("appPage")
        .classList
        .add("hidden");

      return;
    }

    currentUser = user;

    try {

      await loadProfile();

      $("authPage")
        .classList
        .add("hidden");

      $("appPage")
        .classList
        .remove("hidden");

      showScreen("dashboard");

      loadFiles();
      loadSharedFiles();
      loadLiveRooms();

    } catch (error) {

      console.error(error);
      showToast(
        "Could not load your profile."
      );
    }

  }
);


/* ================= NAVIGATION ================= */

document
  .querySelectorAll("[data-screen]")
  .forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        showScreen(
          button.dataset.screen
        );

      }
    );

  });


function showScreen(name) {

  document
    .querySelectorAll(".screen")
    .forEach(function (screen) {

      screen.classList.add("hidden");

    });

  const target =
    $(name + "Screen");

  if (target) {
    target.classList.remove("hidden");
  }

  document
    .querySelectorAll(".nav-btn")
    .forEach(function (button) {

      button.classList.toggle(
        "active",
        button.dataset.screen === name
      );

    });

  if (name === "messages") {
    loadUsers();
  }

  if (name === "files") {
    loadFiles();
  }

  if (name === "shared") {
    loadSharedFiles();
  }

  if (name === "live") {
    loadLiveRooms();
  }
}


/* ================= USERS ================= */

async function loadUsers() {

  const box = $("userList");

  box.innerHTML =
    "<p class='muted'>Loading users...</p>";

  try {

    const snapshot =
      await db
        .collection("users")
        .get();

    box.innerHTML = "";

    let found = false;

    snapshot.forEach(function (doc) {

      if (doc.id === currentUser.uid) {
        return;
      }

      found = true;

      const data = doc.data();

      const button =
        document.createElement("button");

      button.className =
        "user-item";

      button.innerHTML =
        "<strong>" +
        escapeHTML(data.name || "User") +
        "</strong>" +
        "<span>" +
        escapeHTML(data.email || "") +
        "</span>";

      button.onclick =
        function () {

          openChat({
            uid: doc.id,
            name: data.name || "User",
            email: data.email || ""
          });

        };

      box.appendChild(button);

    });

    if (!found) {

      box.innerHTML =
        "<p class='muted'>" +
        "No other users yet." +
        "</p>";
    }

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "<p class='muted'>" +
      "Could not load users. Check Firestore Rules." +
      "</p>";
  }
}


/* ================= CHAT ================= */

function makeChatId(a, b) {

  return [a, b]
    .sort()
    .join("_");
}


async function openChat(user) {

  selectedUser = user;

  $("chatHeader").textContent =
    "Chat with " + user.name;

  $("messageInput").disabled = false;
  $("sendMessageBtn").disabled = false;

  const id =
    makeChatId(
      currentUser.uid,
      user.uid
    );

  await db
    .collection("chats")
    .doc(id)
    .set({
      participants: [
        currentUser.uid,
        user.uid
      ],

      updatedAt:
        firebase.firestore.FieldValue
          .serverTimestamp()

    }, {
      merge: true
    });

  if (stopMessages) {
    stopMessages();
  }

  stopMessages =
    db
      .collection("chats")
      .doc(id)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(function (snapshot) {

        const box =
          $("messagesList");

        box.innerHTML = "";

        if (snapshot.empty) {

          box.innerHTML =
            "<div class='empty-state'>" +
            "💬<p>No messages yet.</p>" +
            "</div>";

          return;
        }

        snapshot.forEach(
          function (doc) {

            const data =
              doc.data();

            if (data.signalType) {
              return;
            }

            const message =
              document.createElement("div");

            const mine =
              data.senderId ===
              currentUser.uid;

            message.className =
              "message " +
              (mine ? "mine" : "theirs");

            message.innerHTML =
              "<div>" +
              escapeHTML(data.text) +
              "</div>";

            box.appendChild(message);

          }
        );

        box.scrollTop =
          box.scrollHeight;

      });
}


$("messageForm").onsubmit =
  async function (event) {

    event.preventDefault();

    if (!selectedUser) {
      showToast("Select a user first.");
      return;
    }

    const input =
      $("messageInput");

    const text =
      input.value.trim();

    if (!text) {
      return;
    }

    try {

      const id =
        makeChatId(
          currentUser.uid,
          selectedUser.uid
        );

      await db
        .collection("chats")
        .doc(id)
        .collection("messages")
        .add({

          senderId:
            currentUser.uid,

          text: text,

          createdAt:
            firebase.firestore.FieldValue
              .serverTimestamp()

        });

      input.value = "";

    } catch (error) {

      console.error(error);
      showToast("Message failed.");

    }
  };


/* ================= FILES ================= */

$("addFileBtn").onclick =
  function () {

    const input =
      document.createElement("input");

    input.type = "file";

    input.onchange =
      async function () {

        const file =
          input.files[0];

        if (!file) {
          return;
        }

        try {

          await db
            .collection("files")
            .add({

              name: file.name,
              type: file.type,
              size: file.size,

              ownerId:
                currentUser.uid,

              ownerName:
                currentProfile.name,

              sharedWith: [],

              createdAt:
                firebase.firestore.FieldValue
                  .serverTimestamp()

            });

          showToast(
            "File record saved."
          );

          loadFiles();

        } catch (error) {

          console.error(error);
          showToast(
            "Could not save file record."
          );
        }
      };

    input.click();
  };


async function loadFiles() {

  const box =
    $("fileList");

  try {

    const snapshot =
      await db
        .collection("files")
        .where(
          "ownerId",
          "==",
          currentUser.uid
        )
        .get();

    box.innerHTML = "";

    if (snapshot.empty) {

      box.innerHTML =
        "<div class='empty-state'>" +
        "<div>📂</div>" +
        "<h2>No files yet</h2>" +
        "<p>Add a file record to get started.</p>" +
        "</div>";

      return;
    }

    snapshot.forEach(
      function (doc) {

        const data =
          doc.data();

        const item =
          document.createElement("div");

        item.className =
          "file-card";

        item.innerHTML =
          "<div class='file-main'>" +
          "<div class='file-icon'>📄</div>" +
          "<div>" +
          "<div class='file-name'>" +
          escapeHTML(data.name) +
          "</div>" +
          "<div class='file-meta'>" +
          (data.type || "File") +
          "</div>" +
          "</div>" +
          "</div>";

        box.appendChild(item);

      }
    );

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "<div class='empty-state'>" +
      "<p>Could not load files.</p>" +
      "</div>";
  }
}


/* ================= SHARED FILES ================= */

async function loadSharedFiles() {

  const box =
    $("sharedList");

  try {

    const snapshot =
      await db
        .collection("files")
        .where(
          "sharedWith",
          "array-contains",
          currentUser.uid
        )
        .get();

    box.innerHTML = "";

    if (snapshot.empty) {

      box.innerHTML =
        "<div class='empty-state'>" +
        "<div>🔗</div>" +
        "<h2>Nothing shared yet</h2>" +
        "</div>";

      return;
    }

    snapshot.forEach(
      function (doc) {

        const data =
          doc.data();

        const item =
          document.createElement("div");

        item.className =
          "file-card";

        item.innerHTML =
          "<div class='file-main'>" +
          "<div class='file-icon'>📄</div>" +
          "<div>" +
          "<div class='file-name'>" +
          escapeHTML(data.name) +
          "</div>" +
          "<div class='file-meta'>" +
          "Shared by " +
          escapeHTML(
            data.ownerName || "User"
          ) +
          "</div>" +
          "</div>" +
          "</div>";

        box.appendChild(item);

      }
    );

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "<div class='empty-state'>" +
      "<p>Could not load shared files.</p>" +
      "</div>";
  }
}


/* ================= LIVE ROOMS ================= */

$("createLiveBtn").onclick =
  async function () {

    const title =
      $("liveTitle").value.trim();

    if (!title) {

      showToast(
        "Enter a live room title."
      );

      return;
    }

    try {

      const room =
        await db
          .collection("liveRooms")
          .add({

            title: title,

            hostId:
              currentUser.uid,

            hostName:
              currentProfile.name,

            private:
              $("privateLive").checked,

            active: true,

            createdAt:
              firebase.firestore.FieldValue
                .serverTimestamp()

          });

      $("liveTitle").value = "";

      $("liveResult")
        .classList
        .remove("hidden");

      $("liveResult").innerHTML =
        "<strong>Live room created.</strong>" +
        "<p>Room ID: " +
        room.id +
        "</p>" +
        "<button id='cameraButton' " +
        "class='primary-btn'>" +
        "🎥 Start Camera + Mic" +
        "</button>" +
        "<video id='localVideo' " +
        "autoplay muted playsinline " +
        "style='width:100%;margin-top:15px;" +
        "border-radius:15px;" +
        "background:#000;'>" +
        "</video>";

      $("cameraButton").onclick =
        startCamera;

      loadLiveRooms();

    } catch (error) {

      console.error(error);

      showToast(
        "Could not create live room."
      );
    }
  };


async function startCamera() {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    showToast(
      "Camera needs an HTTPS website."
    );

    return;
  }

  try {

    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true
        });

    $("localVideo").srcObject =
      stream;

    showToast(
      "Camera and microphone connected."
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Camera/microphone permission denied."
    );
  }
}


async function loadLiveRooms() {

  const box =
    $("roomList");

  try {

    const snapshot =
      await db
        .collection("liveRooms")
        .where(
          "active",
          "==",
          true
        )
        .get();

    box.innerHTML = "";

    if (snapshot.empty) {

      box.innerHTML =
        "<div class='empty-state'>" +
        "No live rooms currently available." +
        "</div>";

      return;
    }

    snapshot.forEach(
      function (doc) {

        const data =
          doc.data();

        const item =
          document.createElement("div");

        item.className =
          "room-card";

        item.innerHTML =
          "<div>" +
          "<strong>🔴 " +
          escapeHTML(data.title) +
          "</strong>" +
          "<div class='file-meta'>" +
          "Host: " +
          escapeHTML(
            data.hostName || "User"
          ) +
          "</div>" +
          "</div>" +
          "<button class='small-btn'>Join</button>";

        box.appendChild(item);

      }
    );

  } catch (error) {

    console.error(error);

    box.innerHTML =
      "<div class='empty-state'>" +
      "<p>Could not load live rooms.</p>" +
      "</div>";
  }
        }
