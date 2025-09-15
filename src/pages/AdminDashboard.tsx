import React, { useState, useEffect } from 'react';
import { FaBell, FaUserCircle, FaBars, FaTimes, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { AiOutlineSearch } from 'react-icons/ai';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import ProgressCard from '../components/ProgressCard';

// ✅ Task type
interface Task {
  given: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
}

// ✅ Task data
const tasks: Task[] = [
  { given: 'John Doe', title: 'Market Research', status: 'Completed', priority: 'URGENT', deadline: '2 Hours' },
  { given: 'Sarah Johnson', title: 'Email Marketing', status: 'On Review', priority: 'Medium', deadline: '5 hours ago' },
  { given: 'Jessica Doe', title: 'Design Review', status: 'In Queue', priority: 'Normal', deadline: '1 day ago' },
  { given: 'Mike Bay', title: 'UX Analysis', status: 'In Queue', priority: 'Not Started', deadline: '2 days ago' },
  { given: 'Em Davis', title: 'Training Workshop', status: 'On Review', priority: 'In Progress', deadline: '2 days ago' },
  { given: 'John Doe', title: 'Brand Identity', status: 'Completed', priority: 'Pending Review', deadline: '8 hours' },
  { given: 'Sarah Johnson', title: 'Vendor Evaluation', status: 'On Review', priority: 'Done', deadline: '5 hours ago' },
  { given: 'Jessica Doe', title: 'Training Workshop', status: 'Completed', priority: 'Medium', deadline: '1 day ago' },
  { given: 'Mike Bay', title: 'Brand Identity', status: 'In Queue', priority: 'URGENT', deadline: '2 days ago' },
  { given: 'Em Davis', title: 'Vendor Evaluation', status: 'On Review', priority: 'Not Started', deadline: '2 days ago' },
];

// ✅ Priority color helper
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'bg-red-500 text-white';
    case 'Medium': return 'bg-yellow-400 text-white';
    case 'Normal': return 'bg-green-400 text-white';
    case 'Not Started': return 'bg-gray-400 text-white';
    case 'In Progress': return 'bg-blue-400 text-white';
    case 'Pending Review': return 'bg-purple-400 text-white';
    case 'Done': return 'bg-green-600 text-white';
    default: return 'bg-gray-200 text-black';
  }
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      authService.logout();
      navigate('/login');
    }
  };

  const handleCreateTask = () => {
    navigate('/create-task');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 z-20 bg-white w-60 h-full shadow-md transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 text-2xl font-bold border-b">IMTS</div>
        <nav className="space-y-2 px-4 mt-4">
          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
            <span>📊</span> <span>Dashboard</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-md bg-purple-100 font-semibold text-purple-600">
            <span>✅</span> <span>Task</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
            <span>📄</span> <span>Report</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
            <span>⚙️</span> <span>Setting</span>
          </div>
        </nav>
        <div className="p-4 mt-auto border-t absolute bottom-0 w-full">
          <div className="flex items-center space-x-3 mb-3">
            <img src="/avatar.png" alt="Admin" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <div className="font-bold">Admin</div>
              <div className="text-sm text-gray-500">admin@gmail.com</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 p-2 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black opacity-40 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div className="flex items-center w-full md:w-1/3 relative">
            <button className="md:hidden text-2xl mr-3" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <input
              type="text"
              placeholder="Search"
              className="w-full py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:outline-none"
            />
            <AiOutlineSearch className="absolute left-12 md:left-3 top-2.5 text-gray-500" />
          </div>
          <div className="flex space-x-3 items-center ml-auto">
            <button 
              onClick={handleCreateTask}
              className="bg-blue-600 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm hover:bg-blue-700 transition-colors"
            >
              <BsFillPlusCircleFill /> <span>Create Task</span>
            </button>
            <FaBell className="text-xl text-gray-600 cursor-pointer hover:text-gray-800" />
            <div className="relative user-dropdown">
              <FaUserCircle 
                className="text-xl text-gray-600 cursor-pointer hover:text-gray-800" 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              />
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <ProgressCard percentage={100} label="Done" color="green" />
          <ProgressCard percentage={40} label="Not Started" color="gray" />
          <ProgressCard percentage={78} label="Pending" color="purple" />
        </div>

        {/* Task Table */}
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
          <div className="text-lg font-semibold mb-4">Project / Filter</div>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 whitespace-nowrap">Given</th>
                <th className="py-2 px-4 whitespace-nowrap">Task Title</th>
                <th className="py-2 px-4 whitespace-nowrap">Status</th>
                <th className="py-2 px-4 whitespace-nowrap">Priority</th>
                <th className="py-2 px-4 whitespace-nowrap">Deadlines</th>
                <th className="py-2 px-4 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{task.given}</td>
                  <td className="py-2 px-4">{task.title}</td>
                  <td className="py-2 px-4">{task.status}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-2 px-4">{task.deadline}</td>
                  <td className="py-2 px-4 space-x-2">
                    <button className="text-gray-500 hover:text-blue-500">👁️</button>
                    <button className="text-gray-500 hover:text-red-500">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
