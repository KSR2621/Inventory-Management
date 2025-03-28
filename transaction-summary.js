// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCfUDCSA4ubUeVtoJxmlKBOlOAozaEMb_M",
    authDomain: "inventory-management-4eeab.firebaseapp.com",
    projectId: "inventory-management-4eeab",
    storageBucket: "inventory-management-4eeab.firebasestorage.app",
    messagingSenderId: "816685502552",
    appId: "1:816685502552:web:91653a6b548493dee7ba2d",
    measurementId: "G-EFEWMMTSR3"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}
const db = firebase.firestore();
const transactionsRef = db.collection('transactions');

// Store all transactions for search filtering
let allTransactions = [];

// Function to load the transactions and update the table
function loadTransactions(transactionsToDisplay = null) {
    const transactionTableBody = document.getElementById('transactionTableBody');
    transactionTableBody.innerHTML = ''; // Clear previous transactions

    const transactions = transactionsToDisplay || allTransactions;

    if (transactions.length === 0) {
        transactionTableBody.innerHTML = '<tr><td colspan="5">No transactions found</td></tr>';
    } else {
        // Loop through each transaction and populate the table
        transactions.forEach(transaction => {
            const data = transaction.data();
            const row = document.createElement('tr');
            const total = data.quantity * data.price;

            row.innerHTML = `
                <td data-label="Transaction Type">${data.type.charAt(0).toUpperCase() + data.type.slice(1)}</td>
                <td data-label="Product Name">${data.product}</td>
                <td data-label="Quantity">${data.quantity}</td>
                <td data-label="Price per Unit">₹${data.price.toFixed(2)}</td>
                <td data-label="Total">₹${total.toFixed(2)}</td>
            `;
            transactionTableBody.appendChild(row);
        });
    }
}

// Function to fetch all transactions from Firestore and store them
function fetchAllTransactions() {
    transactionsRef.orderBy('timestamp', 'desc').get()
        .then((querySnapshot) => {
            allTransactions = [];
            querySnapshot.forEach((doc) => {
                allTransactions.push({ id: doc.id, data: () => doc.data() });
            });
            loadTransactions();
        })
        .catch(error => {
            console.error("Error loading transactions:", error);
            const transactionTableBody = document.getElementById('transactionTableBody');
            transactionTableBody.innerHTML = '<tr><td colspan="5">Error loading transactions</td></tr>';
        });
}

// Search Transactions
window.searchTransactions = function() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    console.log("Searching for:", searchInput);

    const filteredTransactions = allTransactions.filter(transaction => {
        const data = transaction.data();
        return data.product.toLowerCase().includes(searchInput);
    });

    loadTransactions(filteredTransactions);
}

// Add event listener for Enter key on search input
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchTransactions();
    }
});

// Initialize the page by loading the transactions
window.onload = function() {
    fetchAllTransactions();
};