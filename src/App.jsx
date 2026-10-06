import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Activity from './pages/Activity'
import ProductsPage from './pages/products/ProductsPage'
import CustomersPage from './pages/customers/CustomersPage'
import CustomerDetailPage from './pages/customers/CustomerDetailPage'
import AgentsPage from './pages/customers/AgentsPage'
import CustomerGroupsPage from './pages/customerGroups/CustomerGroupsPage'
import CustomerGroupCreatePage from './pages/customerGroups/CustomerGroupCreatePage'
import CustomerGroupDetailPage from './pages/customerGroups/CustomerGroupDetailPage'
import PriceListsPage from './pages/priceLists/PriceListsPage'
import PriceListCreatePage from './pages/priceLists/PriceListCreatePage'
import PriceListDetailPage from './pages/priceLists/PriceListDetailPage'
import DiscountsPage from './pages/discounts/DiscountsPage'
import DiscountCreatePage from './pages/discounts/DiscountCreatePage'
import DiscountDetailPage from './pages/discounts/DiscountDetailPage'
import DiscountPrioritiesPage from './pages/discounts/DiscountPrioritiesPage'
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
          <Route path="/activity" element={<Activity />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/agents" element={<AgentsPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/groups" element={<CustomerGroupsPage />} />
          <Route path="/customers/groups/create" element={<CustomerGroupCreatePage />} />
          <Route path="/customers/groups/:id" element={<CustomerGroupDetailPage />} />
          <Route path="/price-lists" element={<PriceListsPage />} />
          <Route path="/price-lists/create" element={<PriceListCreatePage />} />
          <Route path="/price-lists/:id" element={<PriceListDetailPage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/discounts/create" element={<DiscountCreatePage />} />
          <Route path="/discounts/priorities" element={<DiscountPrioritiesPage />} />
          <Route path="/discounts/:id" element={<DiscountDetailPage />} />
          <Route path="/price-editor" element={<PriceEditorPage />} />
          <Route path="/price-editor/:id" element={<PriceEditorVariantPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
