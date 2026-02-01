import axios from 'axios';

const API_URL = 'https://hmealmanagementbackend.onrender.com'; // Replace with your WiFi IP

export const loginUser = async (username: string, mobileNumber: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      mobileNumber,
    });
    return response.data; // Success: returns { token, user }
  } catch (error: any) {
    // Check if the backend sent a specific error message
    if (error.response) {
      // If it's a Zod validation error array, get the first message
      if (Array.isArray(error.response.data.error)) {
        throw error.response.data.error[0].message; 
      }
      // If it's a standard error message (e.g., 401 Authentication failed)
      throw error.response.data.message || 'An error occurred';
    }
    throw 'Cannot connect to server. Check your network.';
  }
};

export const bookMeals = async (bookings: { date: string, mealType: string }[], token: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/meal/book`, 
      { bookings }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Booking failed';
  }
};

export const getTodayMeals = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/meal/today`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to fetch meals';
  }
};

// Request specific meal
export const requestMealAction = async (mealType: string, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/meal/request`, 
      { mealType }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Request failed';
  }
};

export const respondToRequest = async (bookingId: string, action: 'accept' | 'reject', token: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/meal/respond`, 
      { bookingId, action }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Response failed';
  }
};

export const verifyMealOTP = async (bookingId: string, otp: string, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/meal/verify-otp`, 
      { bookingId, otp }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'OTP Verification failed';
  }
};

export const getMealPrices = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/meal/prices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to fetch prices';
  }
};

export const processPaymentAction = async (
  data: { bookingId: string, paymentType: string, amountPaid?: number,deductExcessFromLoan?: boolean; }, 
  token: string
) => {
  try {
    const response = await axios.post(`${API_URL}/api/meal/process-payment`, 
      data, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Payment failed';
  }
};

export const issueMealAction = async (bookingId: string, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/meal/issue`, 
      { bookingId }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Issue failed';
  }
};

export const rejectIssueAction = async (bookingId: string, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/meal/reject-issue`, 
      { bookingId }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Reject failed';
  }
};

export const fetchUpcomingBookings = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/meal/upcoming`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to fetch bookings';
  }
};

export const cancelMealAction = async (bookingId: string, token: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/meal/cancel`, 
      { bookingId }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Cancellation failed';
  }
};

export const getWalletStats = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/meal/wallet`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to fetch wallet data';
  }
};

export const repayLoanAction = async (
  data: { 
    userId?: string; 
    amount: number; 
    notes?: string 
  }, 
  token: string
) => {
  const response = await axios.post(`${API_URL}/api/meal/repay-loan`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};