function login() {
  const email = document.getElementById("email").value;

  if (email.trim() === "") {
    alert("Please enter an email address.");
    return;
  }

  openApp();
}


function demoLogin() {
  openApp();
}


function openApp() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("appPage").classList.remove("hidden");
}


function showScreen(screenName) {

  const screens = document.querySelectorAll(".screen");

  screens.forEach(screen => {
    screen.classList.add("hidden");
  });

  const selected = document.getElementById(screenName);

  if (selected) {
    selected.classList.remove("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function uploadDemo() {

  const name = prompt(
    "Enter a file name:",
    "New_Project.pdf"
  );

  if (!name) return;

  const fileList = document.getElementById("fileList");
  const recentFiles = document.getElementById("recentFiles");

  const fileHTML = `
    <div class="file-card">

      <div class="file-icon pdf">
        PDF
      </div>

      <div class="file-info">
        <b>${name}</b>
        <small>Uploaded just now</small>
      </div>

      <span class="private">
        🔒 Private
      </span>

      <button
        class="more"
        onclick="shareFile('${name}')">
        ⋮
      </button>

    </div>
  `;

  if (fileList) {
    fileList.insertAdjacentHTML(
      "afterbegin",
      fileHTML
    );
  }

  if (recentFiles) {
    recentFiles.insertAdjacentHTML(
      "afterbegin",
      fileHTML
    );
  }

  alert(
    "Prototype upload successful!\n\n" +
    "In the real application this file would be stored in secure cloud storage."
  );
}


function shareFile(fileName) {

  document.getElementById(
    "shareFileName"
  ).textContent =
    "Sharing: " + fileName;

  document.getElementById(
    "shareModal"
  ).classList.remove("hidden");
}


function closeModal() {

  document.getElementById(
    "shareModal"
  ).classList.add("hidden");
}


function sendShare() {

  closeModal();

  alert(
    "Access request sent!\n\n" +
    "Prototype demonstration only."
  );
}


function mergeDemo() {

  alert(
    "PDF Merge Tool\n\n" +
    "In the final application, users will select multiple PDF files and combine them into one PDF."
  );
}


function sendMessage() {

  const input =
    document.getElementById("messageInput");

  const message =
    input.value.trim();

  if (!message) return;

  const container =
    document.getElementById("chatMessages");

  const newMessage =
    document.createElement("div");

  newMessage.className =
    "message sent";

  newMessage.textContent =
    message;

  container.appendChild(newMessage);

  input.value = "";

  container.scrollTop =
    container.scrollHeight;
}


function startLive() {

  const title =
    document.getElementById("streamTitle").value;

  const isPrivate =
    document.getElementById("privateStream").checked;

  if (!title) {

    alert(
      "Please enter a stream title."
    );

    return;
  }

  const code =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  document.getElementById("code")
    .textContent =
    isPrivate
      ? code
      : "PUBLIC";

  document.getElementById(
    "streamCode"
  ).classList.remove("hidden");

  alert(
    "Live stream started!\n\n" +
    (isPrivate
      ? "Share the access code with approved viewers."
      : "This is a public prototype stream.")
  );
}


window.addEventListener(
  "click",
  function(event) {

    const modal =
      document.getElementById("shareModal");

    if (event.target === modal) {
      closeModal();
    }

  }
);