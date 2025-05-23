import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card'; // adjust if your path differs
import { motion } from 'framer-motion';

export default function SelectRole() {
  const navigate = useNavigate();

  const selectRole = (role) => {
    navigate('/signup', { state: { role } });
  };

  const roles = [
    { label: 'Client', description: 'Browse and save listings', value: 'user' },
    { label: 'Agent', description: 'Manage listings and inquiries', value: 'agent' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl mt-[-60px]"
      >
        <h1 className="text-3xl font-bold text-center text-green-700 mb-2">Create Your Criblink Account</h1>
        <p className="text-center text-gray-600 mb-10">Choose your role to continue</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
          {roles.map((role) => (
            <Card
              key={role.value}
              onClick={() => selectRole(role.value)}
              className="cursor-pointer"
            >
              <h2 className="text-xl font-semibold mb-2 text-green-700">{role.label}</h2>
              <p className="text-gray-600">{role.description}</p>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
