import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import SqlPractice from './pages/SqlPractice/SqlPractice'
import DataAnalytics from './pages/DataAnalytics/DataAnalytics'
import AiProjects from './pages/AiProjects/AiProjects'

// Top-level route map. Each learning track (SQL, Data Analytics, AI Projects)
// is its own page module so they can be built out one at a time without
// touching the others.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="sql-practice" element={<SqlPractice />} />
          <Route path="data-analytics" element={<DataAnalytics />} />
          <Route path="ai-projects" element={<AiProjects />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
