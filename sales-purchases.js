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
const auth = firebase.auth();

// Get current user's collections
function getUserCollections() {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    return {
        products: db.collection('users').doc(user.uid).collection('products'),
        transactions: db.collection('users').doc(user.uid).collection('transactions')
    };
}

// Store all transactions for summary and table
let allTransactions = [];

// Function to populate the product name datalist
function populateProductList() {
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; // Clear previous options

    const { products } = getUserCollections();
    products.orderBy('name').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                const option = document.createElement('option');
                option.value = product.name;
                productList.appendChild(option);
            });
            console.log("Product list populated");
        })
        .catch(error => {
            console.error("Error loading products for datalist:", error);
        });
}

// Function to add a new transaction
function addTransaction(event) {
    event.preventDefault();
    const { transactions, products } = getUserCollections();
    const formData = new FormData(event.target);
    
    const transactionData = {
        type: formData.get('type'),
        productName: formData.get('productName'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        date: formData.get('date'),
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
    };

    // Add transaction
    transactions.add(transactionData)
        .then(() => {
            console.log("Transaction added successfully");
            event.target.reset();
            loadTransactions();
        })
        .catch(error => {
            console.error("Error adding transaction:", error);
            alert("Failed to add transaction: " + error.message);
        });
}

// Function to load transactions
function loadTransactions() {
    const { transactions } = getUserCollections();
    transactions.orderBy('date', 'desc').get()
        .then((querySnapshot) => {
            allTransactions = [];
            querySnapshot.forEach((doc) => {
                allTransactions.push({ id: doc.id, ...doc.data() });
            });
            displayTransactions();
            updateTransactionSummary();
        })
        .catch(error => {
            console.error("Error loading transactions:", error);
            alert("Failed to load transactions: " + error.message);
        });
}

// Function to delete a transaction
function deleteTransaction(transactionId) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        const { transactions } = getUserCollections();
        transactions.doc(transactionId).delete()
            .then(() => {
                console.log("Transaction deleted successfully");
                loadTransactions();
            })
            .catch(error => {
                console.error("Error deleting transaction:", error);
                alert("Failed to delete transaction: " + error.message);
            });
    }
}

// Function to display transactions
function displayTransactions() {
    const transactionTableBody = document.getElementById('transactionTableBody');
    transactionTableBody.innerHTML = ''; // Clear previous transactions

    let totalSales = 0;
    let totalPurchases = 0;

    if (allTransactions.length === 0) {
        transactionTableBody.innerHTML = '<tr><td colspan="5">No transactions found</td></tr>';
    } else {
        // Loop through each transaction and populate the table
        allTransactions.forEach(transaction => {
            const data = transaction.data();
            const row = document.createElement('tr');
            const total = data.quantity * data.price;

            row.innerHTML = `
                <td data-label="Transaction Type">${data.type.charAt(0).toUpperCase() + data.type.slice(1)}</td>
                <td data-label="Product Name">${data.productName}</td>
                <td data-label="Quantity">${data.quantity}</td>
                <td data-label="Price per Unit">₹${data.price.toFixed(2)}</td>
                <td data-label="Total">₹${total.toFixed(2)}</td>
                <td data-label="Date">${new Date(data.date).toLocaleDateString()}</td>
                <td data-label="Actions">
                    <button class="btn btn-danger" onclick="deleteTransaction('${transaction.id}')">Delete</button>
                </td>
            `;
            transactionTableBody.appendChild(row);

            // Update total sales and total purchases
            if (data.type === 'sale') {
                totalSales += total;
            } else if (data.type === 'purchase') {
                totalPurchases += total;
            }
        });
    }

    // Update the summary statistics
    document.getElementById('totalSales').textContent = `₹${totalSales.toFixed(2)}`;
    document.getElementById('totalPurchases').textContent = `₹${totalPurchases.toFixed(2)}`;
    document.getElementById('netProfit').textContent = `₹${(totalSales - totalPurchases).toFixed(2)}`;
}

// Function to update transaction summary
function updateTransactionSummary() {
    // Implementation of updateTransactionSummary function
}

// Initialize the page by loading the transactions and populating the product list
window.onload = function() {
    loadTransactions();
    populateProductList();
};