import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Task from './pages/Task'
import CreateTask from './pages/CreateTask'
import Leaderboard from './pages/Leaderboard'
import TaskLeaderboard from './pages/Leaderboard/TaskLeaderboard'
import Profile from './pages/Profile'
import RoomCreate from './pages/RoomCreate'
import RoomBattle from './pages/RoomBattle'
import Rooms from './pages/Rooms'
import MyTasks from './pages/MyTasks'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'
import Register from './pages/Register'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/tasks" element={<Home />} />
            <Route path="/tasks/create" element={<CreateTask />} />
            <Route path="/tasks/:id/edit" element={<CreateTask />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/tasks/:id" element={<Task />} />
            <Route path="/tasks/:id/leaderboard" element={<TaskLeaderboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/create" element={<RoomCreate />} />
            <Route path="/rooms/:id" element={<RoomBattle />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users/:userId" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
