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
  alert("Failed to initialize Firebase: " + error.message);
}

const db = firebase.firestore();
const auth = firebase.auth();

// Get current user's products collection
function getProductsRef() {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    return db.collection('users').doc(user.uid).collection('products');
}

// Global variables to store products for sorting and searching
let products = [];
let filteredProducts = [];

// Function to load dashboard data
function loadDashboard() {
    const productsRef = getProductsRef();
    productsRef.get()
        .then((querySnapshot) => {
            products = [];
            querySnapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });
            filteredProducts = [...products];
            displayProducts();
            updateDashboardStats();
        })
        .catch((error) => {
            console.error("Error loading products:", error);
            alert("Failed to load products: " + error.message);
        });
}

// Function to add a new product
function addProduct(event) {
    event.preventDefault();
    const productsRef = getProductsRef();
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('name'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        category: formData.get('category'),
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
    };

    productsRef.add(productData)
        .then((docRef) => {
            console.log("Product added with ID:", docRef.id);
            event.target.reset();
            loadDashboard();
        })
        .catch((error) => {
            console.error("Error adding product:", error);
            alert("Failed to add product: " + error.message);
        });
}

// Function to update a product
function updateProduct(productId, updatedData) {
    const productsRef = getProductsRef();
    productsRef.doc(productId).update(updatedData)
        .then(() => {
            console.log("Product updated:", productId);
            loadDashboard();
        })
        .catch((error) => {
            console.error("Error updating product:", error);
            alert("Failed to update product: " + error.message);
        });
}

// Function to delete a product
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        const productsRef = getProductsRef();
        productsRef.doc(productId).delete()
            .then(() => {
                console.log("Product deleted:", productId);
                loadDashboard();
            })
            .catch((error) => {
                console.error("Error deleting product:", error);
                alert("Failed to delete product: " + error.message);
            });
    }
}

// Render the product summary table
function renderProductTable() {
  const productTableBody = document.getElementById('productTableBody');
  productTableBody.innerHTML = '';

  if (filteredProducts.length === 0) {
      productTableBody.innerHTML = '<tr><td colspan="5">No products found</td></tr>';
      return;
  }

  filteredProducts.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
          <td data-label="Name">${product.name}</td>
          <td data-label="Price">₹${product.price.toFixed(2)}</td>
          <td data-label="Stock">${product.stock}</td>
          <td data-label="Adjust Stock">
              <input type="number" id="adjust-${product.id}" class="form-control form-control-sm d-inline-block" style="width: 100px;" placeholder="Enter quantity">
              <button class="btn btn-primary btn-sm mt-1 mt-md-0" onclick="adjustStock('${product.id}')">Update</button>
          </td>
          <td data-label="Actions">
              <button class="btn btn-warning btn-sm" onclick="editProduct('${product.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}')">Delete</button>
          </td>
      `;
      productTableBody.appendChild(row);
  });
}

// Sort the table by a given field
function sortTable(field) {
  filteredProducts.sort((a, b) => {
      if (field === 'name') {
          return a.name.localeCompare(b.name);
      } else if (field === 'price') {
          return a.price - b.price;
      } else if (field === 'stock') {
          return a.stock - b.stock;
      }
      return 0;
  });
  renderProductTable();
}

// Search products by name
function searchProducts() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchInput)
  );
  renderProductTable();
}

// Adjust stock for a product
function adjustStock(productId) {
  const adjustValue = parseInt(document.getElementById(`adjust-${productId}`).value);

  if (!isNaN(adjustValue)) {
      // Fetch the current product data
      getProductsRef().doc(productId).get()
          .then((doc) => {
              if (doc.exists) {
                  const product = doc.data();
                  const newStock = product.stock + adjustValue;

                  if (newStock < 0) {
                      alert("Stock cannot be negative. Please enter a valid adjustment.");
                      return;
                  }

                  // Update the stock in Firestore
                  getProductsRef().doc(productId).update({
                      stock: newStock,
                      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                  })
                  .then(() => {
                      console.log("Stock updated successfully for product:", productId);
                      loadDashboard(); // Refresh the dashboard
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

// Edit product (redirect to product.html with product ID)
function editProduct(productId) {
  localStorage.setItem('editProductId', productId);
  window.location.href = 'product.html';
}

// Check authentication state and load dashboard
window.onload = function() {
  firebase.auth().onAuthStateChanged((user) => {
      if (user) {
          // User is signed in, load the dashboard
          console.log("User is signed in:", user.uid);
          loadDashboard();
      } else {
          // No user is signed in, redirect to login page
          console.log("No user is signed in, redirecting to login page");
          window.location.href = 'login-signup.html';
      }
  });
};