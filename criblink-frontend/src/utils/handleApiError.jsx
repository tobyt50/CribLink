import { useCallback } from "react"; // Import useCallback
import { useMessage } from "../context/MessageContext";

export const useApiErrorHandler = () => {
  const { showMessage } = useMessage();

  // Memoize the returned error handling function
  const handleApiError = useCallback(
    (error, retryFn = null) => {
      let message = "Something went wrong. Please try again.";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      showMessage(
        message,
        "error",
        7000,
        retryFn ? [{ label: "Retry", onClick: retryFn }] : [],
      );
    },
    [showMessage],
  ); // showMessage is a dependency of this useCallback

  return handleApiError;
};
