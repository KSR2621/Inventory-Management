// Firebase Configuration (same as in settings.html)
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

// Get current user's collections (same as in settings.html)
function getUserCollections() {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    return {
        settings: db.collection('users').doc(user.uid).collection('settings').doc('appSettings'),
        products: db.collection('users').doc(user.uid).collection('products'),
        transactions: db.collection('users').doc(user.uid).collection('transactions'),
        billing_data: db.collection('users').doc(user.uid).collection('billing_data')
    };
}

// Currency symbols mapping
const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
};

// Function to fetch settings (lowStockThreshold and currency)
async function fetchSettings() {
    try {
        const { settings } = getUserCollections();
        const doc = await settings.get();
        if (doc.exists) {
            const data = doc.data();
            return {
                lowStockThreshold: data.lowStockThreshold || 5,
                currency: data.currency || 'INR'
            };
        } else {
            console.log("No settings found, using defaults");
            return {
                lowStockThreshold: 5,
                currency: 'INR'
            };
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
        // Fallback to defaults if settings fetch fails
        return {
            lowStockThreshold: 5,
            currency: 'INR'
        };
    }
}

// Function to fetch data from Firebase
async function fetchDataFromFirebase() {
    try {
        const { products, transactions } = getUserCollections();

        // Fetch products
        const productsSnapshot = await products.get();
        const productsData = [];
        productsSnapshot.forEach(doc => {
            productsData.push({ id: doc.id, ...doc.data() });
        });

        // Fetch transactions and calculate total sales and purchases
        const transactionsSnapshot = await transactions.get();
        let totalSales = 0;
        let totalPurchases = 0;

        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            const total = (transaction.quantity || 0) * (transaction.price || 0);
            if (transaction.type === 'sale') {
                totalSales += total;
            } else if (transaction.type === 'purchase') {
                totalPurchases += total;
            }
        });

        return { products: productsData, totalSales, totalPurchases };
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        throw error;
    }
}

// Function to generate reports
async function generateReports() {
    try {
        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('reportsContent').style.display = 'none';

        // Fetch settings (lowStockThreshold and currency)
        const settings = await fetchSettings();
        const lowStockThreshold = settings.lowStockThreshold;
        const currency = settings.currency;
        const currencySymbol = currencySymbols[currency] || '$';

        // Fetch data from Firebase
        const { products, totalSales, totalPurchases } = await fetchDataFromFirebase();

        let totalStockValue = 0;
        let lowStockCount = 0;

        // Calculate total stock value and count low stock items
        const lowStockProducts = [];
        products.forEach(product => {
            const totalValue = (product.price || 0) * (product.stock || 0);
            totalStockValue += totalValue;

            if (product.stock < lowStockThreshold) {
                lowStockCount++;
                lowStockProducts.push(product);
            }
        });

        // Update the dashboard with calculated values
        document.getElementById('totalSales').textContent = `${currencySymbol}${totalSales.toFixed(2)}`;
        document.getElementById('totalPurchases').textContent = `${currencySymbol}${totalPurchases.toFixed(2)}`; // New line to display total purchases
        document.getElementById('totalStockValue').textContent = `${currencySymbol}${totalStockValue.toFixed(2)}`;
        document.getElementById('lowStockItems').textContent = lowStockCount;

        // Populate low stock products table
        const lowStockTableBody = document.getElementById('lowStockTableBody');
        lowStockTableBody.innerHTML = '';

        lowStockProducts.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name || 'Unknown'}</td>
                <td>${product.stock || 0}</td>
            `;
            lowStockTableBody.appendChild(row);
        });

        // Hide loading spinner and show reports
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('reportsContent').style.display = 'block';
    } catch (error) {
        console.error("Error generating reports:", error);
        alert("Error generating reports. Please try again.");
        // Hide loading spinner and show error state
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('reportsContent').style.display = 'block';
    }
}

// Function to go back to the dashboard
function goBack() {
    window.location.href = '../index.html';
}

// Check authentication state and load reports
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("User is signed in:", user.uid);
        try {
            await generateReports();
        } catch (error) {
            console.error("Error initializing reports:", error);
            alert("Error initializing reports. Please try again.");
        }
    } else {
        console.log("No user is signed in, redirecting to login page");
        window.location.href = '../login-signup.html';
    }
});