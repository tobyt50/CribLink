import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';

const ClientProfile = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_BASE_URL}/users/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClient(data);
      } catch (err) {
        console.error('Error loading profile', err);
      }
    };
    fetchClient();
  }, [clientId]);

  if (!client) return <p className="p-6 text-center">Loading profile...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-green-700 mb-4">
        {client.full_name}'s Profile
      </h1>
      <div className="flex items-center gap-4 mb-6">
        <img
          src={client.profile_picture || '/default-avatar.png'}
          alt="Client"
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <p><strong>Email:</strong> {client.email}</p>
          <p><strong>Status:</strong> {client.status}</p>
          <p><strong>Joined:</strong> {new Date(client.date_joined).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Additional tabs / sections can go here */}
      <button
        onClick={() => navigate(-1)}
        className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
      >
        Back to Clients
      </button>
    </div>
  );
};

export default ClientProfile;
