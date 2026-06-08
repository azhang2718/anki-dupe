import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ReviewPage from './pages/ReviewPage'
import VocabularyPage from './pages/VocabularyPage'
import ImportPage from './pages/ImportPage'
import StatisticsPage from './pages/StatisticsPage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="vocabulary" element={<VocabularyPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="graph" element={<KnowledgeGraphPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
