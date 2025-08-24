import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useMessage } from "../context/MessageContext";

export default function CheckoutForm({ selectedPlan, currentUserPlan }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showMessage } = useMessage();

  const [isLoading, setIsLoading] = useState(false);

  const isDowngrade =
    currentUserPlan === "enterprise" && selectedPlan.name === "Pro";
  const actionText = isDowngrade ? "Switch Plan" : "Upgrade Plan";
  const successMessage = isDowngrade
    ? "Your plan has been updated to Pro. Enjoy a streamlined experience!"
    : "Upgrade successful! Your new plan is now active.";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      showMessage(submitError.message, "error");
      setIsLoading(false);
      return;
    }

    // Create Payment Intent on the backend
    const res = await axiosInstance.post("/payments/create-payment-intent", {
      planName: selectedPlan.name.toLowerCase(),
    });
    const { clientSecret } = res.data;

    // Confirm the payment with Stripe
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: "if_required",
    });

    if (error) {
      showMessage(error.message, "error");
      setIsLoading(false);
    } else {
      // PAYMENT SUCCESSFUL! Update database
      try {
        const updatePayload = {
          subscription_type: selectedPlan.name.toLowerCase(),
        };
        const endpoint =
          user.role === "agency_admin"
            ? `/agencies/${user.agency_id}/subscription`
            : `/users/${user.user_id}/subscription`;

        const { data } = await axiosInstance.put(endpoint, updatePayload);
        updateUser(
          data.user || {
            ...user,
            subscription_type: selectedPlan.name.toLowerCase(),
          },
        );

        showMessage(successMessage, "success");
        navigate("/agent/dashboard");
      } catch (dbError) {
        showMessage(
          "Payment was successful, but we failed to update your account. Please contact support.",
          "error",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        disabled={isLoading || !stripe || !elements}
        className="w-full mt-6 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-md bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {isLoading ? "Processing..." : `${actionText} - ${selectedPlan.price}`}
      </button>
    </form>
  );
}
