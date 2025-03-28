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
const productsRef = db.collection('products');

// Load stock data into the table from Firestore
function loadStockTable() {
    const stockTableBody = document.getElementById('stockTableBody');
    stockTableBody.innerHTML = '';
    console.log("Loading stock table");

    productsRef.orderBy('name').get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.log("No products found");
                stockTableBody.innerHTML = '<tr><td colspan="4">No products found</td></tr>';
            } else {
                querySnapshot.forEach((doc) => {
                    const product = doc.data();
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td data-label="Product Name">${product.name}</td>
                        <td data-label="Current Stock" id="stock-${doc.id}">${product.stock}</td>
                        <td data-label="Adjust Stock">
                            <input type="number" id="adjust-${doc.id}" class="form-control" placeholder="Enter quantity">
                        </td>
                        <td data-label="Actions">
                            <button class="btn btn-primary btn-sm" onclick="adjustStock('${doc.id}')">Update Stock</button>
                        </td>
                    `;
                    stockTableBody.appendChild(row);
                });
                console.log("Products loaded:", querySnapshot.size);
            }
        })
        .catch(error => {
            console.error("Error loading products:", error);
            stockTableBody.innerHTML = '<tr><td colspan="4">Error loading products</td></tr>';
        });
}

// Function to adjust stock levels in Firestore
function adjustStock(productId) {
    const adjustValue = parseInt(document.getElementById(`adjust-${productId}`).value);

    if (!isNaN(adjustValue)) {
        // Fetch the current product data
        productsRef.doc(productId).get()
            .then((doc) => {
                if (doc.exists) {
                    const product = doc.data();
                    const newStock = product.stock + adjustValue;

                    if (newStock < 0) {
                        alert("Stock cannot be negative. Please enter a valid adjustment.");
                        return;
                    }

                    // Update the stock in Firestore
                    productsRef.doc(productId).update({
                        stock: newStock,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    })
                    .then(() => {
                        console.log("Stock updated successfully for product:", productId);
                        loadStockTable(); // Refresh the table
                    })
                    .catch(error => {
                        console.error("Error updating stock:", error);
                        alert("Failed to update stock: " + error.message);
                    });
                } else {
                    console.error("Product not found:", productId);
                    alert("Product not found.");
                }
            })
            .catch(error => {
                console.error("Error fetching product:", error);
                alert("Error fetching product data: " + error.message);
            });
    } else {
        alert('Please enter a valid number to adjust stock.');
    }
}

// Initialize the stock table on page load
window.onload = function() {
    console.log("Page loaded, initializing stock table");
    loadStockTable();
};