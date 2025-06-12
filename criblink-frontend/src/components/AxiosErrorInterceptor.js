// src/components/AxiosErrorInterceptor.js
import { useEffect } from 'react';
import axios from 'axios';
import { useMessage } from '../context/MessageContext';
import { useApiErrorHandler } from '../utils/handleApiError'; // Import the simplified handler

const AxiosErrorInterceptor = ({ children }) => {
  const { showMessage } = useMessage();
  const handleApiError = useApiErrorHandler();

  useEffect(() => {
    // Request interceptor (optional, but good for adding auth tokens if not already present)
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        // You can add logic here to inject tokens or other headers
        // For now, we'll just return the config
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    const resInterceptor = axios.interceptors.response.use(
      (response) => {
        // If the response is successful, just pass it through
        return response;
      },
      (error) => {
        // Use the centralized handleApiError for all Axios response errors
        // Note: The retryFn concept might need more sophisticated implementation
        // if you want to retry specific requests after an interceptor catches them.
        handleApiError(error);

        // Crucially, reject the promise so that the original catch block in the component
        // (if it still exists for specific handling) can still catch it.
        // Or, if you want full global control, you might just return Promise.resolve()
        // with a generic response if you don't want components to handle errors anymore.
        return Promise.reject(error);
      }
    );

    // Cleanup function: Eject interceptors when the component unmounts
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [showMessage, handleApiError]); // Dependencies for useEffect

  return children; // Render child components
};

export default AxiosErrorInterceptor;
