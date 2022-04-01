
let db;
const request = indexedDB.open("budget", 1);

// this event will emit if the database version changes (non-exist to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts
  db.createObjectStore("new_budget", { autoIncrement: true });
};

// upon success
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded() event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run uploadBudget() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

// upon error
request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access the object store for `new_budget`
  const budgetObjectStore = transaction.objectStore("new_budget");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function uploadBudget() {
  // open a transaction on your pending db
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access your pending object store
  const budgetObjectStore = transaction.objectStore("new_budget");


  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(["new_budget"], "readwrite");
          const budgetObjectStore = transaction.objectStore("new_budget");
          // clear all items in your store
          budgetObjectStore.clear();

          alert("All saved budget has been submitted!");
        })
        .catch((err) => {
                    // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadBudget);
