import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import WorldMap from './pages/WorldMap/WorldMap'
import Quiz from './pages/Quiz/Quiz'
import MiniChallenge from './pages/MiniChallenge/MiniChallenge'
import BossChallenge from './pages/BossChallenge/BossChallenge'
import SqlPractice from './pages/SqlPractice/SqlPractice'
import DataAnalytics from './pages/DataAnalytics/DataAnalytics'
import AiProjects from './pages/AiProjects/AiProjects'
import Login from './pages/Login/Login'

// Top-level route map. Each learning track (SQL, Data Analytics, AI Projects)
// is its own page module so they can be built out one at a time without
// touching the others.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="world-map" element={<WorldMap />} />
            <Route path="quiz/:worldId" element={<Quiz />} />
            <Route path="mini-challenge/:worldId" element={<MiniChallenge />} />
            <Route path="boss-challenge/:worldId" element={<BossChallenge />} />
            <Route path="sql-practice" element={<SqlPractice />} />
            <Route path="data-analytics" element={<DataAnalytics />} />
            <Route path="ai-projects" element={<AiProjects />} />
            <Route path="login" element={<Login />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
