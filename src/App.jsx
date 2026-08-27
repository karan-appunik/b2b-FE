import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProductsPage from './pages/products/ProductsPage'
import CustomersPage from './pages/customers/CustomersPage'
import CustomerDetailPage from './pages/customers/CustomerDetailPage'
import CustomerGroupsPage from './pages/customerGroups/CustomerGroupsPage'
import CustomerGroupCreatePage from './pages/customerGroups/CustomerGroupCreatePage'
import CustomerGroupDetailPage from './pages/customerGroups/CustomerGroupDetailPage'
import PriceListsPage from './pages/priceLists/PriceListsPage'
import PriceListCreatePage from './pages/priceLists/PriceListCreatePage'
import PriceListDetailPage from './pages/priceLists/PriceListDetailPage'
import PriceEditorPage from './pages/priceEditor/PriceEditorPage'
import PriceEditorVariantPage from './pages/priceEditor/PriceEditorVariantPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/groups" element={<CustomerGroupsPage />} />
          <Route path="/customers/groups/create" element={<CustomerGroupCreatePage />} />
          <Route path="/customers/groups/:id" element={<CustomerGroupDetailPage />} />
          <Route path="/price-lists" element={<PriceListsPage />} />
          <Route path="/price-lists/create" element={<PriceListCreatePage />} />
          <Route path="/price-lists/:id" element={<PriceListDetailPage />} />
          <Route path="/price-editor" element={<PriceEditorPage />} />
          <Route path="/price-editor/:id" element={<PriceEditorVariantPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
