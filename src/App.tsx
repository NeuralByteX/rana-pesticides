import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAdmin, RequireUser } from './components/Guards'
import Welcome from './pages/Welcome'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FarmerInfo from './pages/FarmerInfo'
import Contact from './pages/Contact'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route
          path="dashboard"
          element={
            <RequireUser>
              <Dashboard />
            </RequireUser>
          }
        />
        <Route path="farmers" element={<FarmerInfo />} />
        <Route path="contact" element={<Contact />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
