import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TitleBar from './TitleBar'
import GamificationProvider from './GamificationProvider'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-light">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
      <GamificationProvider />
    </div>
  )
}
