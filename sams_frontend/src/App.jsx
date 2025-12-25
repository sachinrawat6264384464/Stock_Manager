import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import ProductManager from './pages/ProductManager';
import StockIn from './pages/StockIn';
import Billing from './pages/Billing';
import Activities from './pages/Activities';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';



function App() {
    return (
        <Router>
            <Routes>

                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<ProductManager />} />
                    <Route path="stock-in" element={<StockIn />} />
                    <Route path="billing" element={<Billing />} />
                    <Route path="activities" element={<Activities />} />
                    <Route path="analytics" element={<Analytics />} />
                </Route>

            </Routes>
        </Router>
    );
}

export default App;
