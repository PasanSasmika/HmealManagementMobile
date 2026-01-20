import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { getMealPrices, processPaymentAction } from '@/services/api';

export default function PaymentScreen() {
  const router = useRouter();
  // Receive mealType from previous screen
  const params = useLocalSearchParams(); 
  const { bookingId, mealType } = params;

  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Price Logic
  const [currentPrice, setCurrentPrice] = useState(0);

  // Payment Selection Logic
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [payLaterAmount, setPayLaterAmount] = useState('');

  // 1. Fetch Prices & Set Current Price based on Meal Type
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await getMealPrices(token!);
        if (res.success && res.data) {
          const mType = (mealType as string)?.toLowerCase();
          
          if (mType === 'breakfast') setCurrentPrice(res.data.breakfast);
          else if (mType === 'lunch') setCurrentPrice(res.data.lunch);
          else if (mType === 'dinner') setCurrentPrice(res.data.dinner);
        }
      } catch (err) {
        console.log("Error fetching prices:", err);
      }
    };
    fetchPrices();
  }, [mealType]);

  // 2. Handle Payment Submission
  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert("Selection Required", "Please select a payment method.");
      return;
    }

    // Logic: Calculate "Amount Paid"
    let finalAmountPaid = 0;

    if (selectedMethod === 'free') {
      finalAmountPaid = 0;
    } 
    else if (selectedMethod === 'pay_now') {
      finalAmountPaid = currentPrice; // Full price
    } 
    else if (selectedMethod === 'pay_later') {
      // Validate Input
      if (payLaterAmount === '') {
        Alert.alert("Amount Required", "Please enter the amount you are paying now (or 0).");
        return;
      }
      finalAmountPaid = parseFloat(payLaterAmount);
      
      if (isNaN(finalAmountPaid) || finalAmountPaid < 0 || finalAmountPaid > currentPrice) {
        Alert.alert("Invalid Amount", `Please enter a value between 0 and ${currentPrice}.`);
        return;
      }
    }

    setLoading(true);
    try {
      await processPaymentAction({
        bookingId: bookingId as string,
        paymentType: selectedMethod,
        amountPaid: finalAmountPaid
      }, token!);

      Alert.alert(
        "Payment Successful! 🎉",
        "Your meal is confirmed. Please collect it from the counter.",
        [{ text: "Back to Home", onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      Alert.alert("Payment Failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Check SubRole
  const subRole = user?.subRole; // 'intern', 'permanent', 'casual', 'manpower'

  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6]">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center bg-white rounded-b-[30px] z-10" style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
      }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#006B3F" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-2xl font-black text-[#006B3F]">Payment</Text>
          <Text className="text-xs text-gray-400">ගෙවීම් ක්‍රමය තෝරන්න / கட்டணம்</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        
        {/* Dynamic Price Card */}
        <View className="bg-[#006B3F] p-6 rounded-[35px] items-center mb-8" style={{
          shadowColor: "#10b981",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 15,
          elevation: 10,
        }}>
          <Text className="text-emerald-100 font-bold tracking-widest text-xs uppercase">
            {mealType} Price
          </Text>
          <Text className="text-white font-black text-5xl mt-2">LKR {currentPrice}</Text>
          {subRole === 'intern' && (
            <View className="bg-amber-400 px-3 py-1 rounded-full mt-3">
               <Text className="text-amber-900 text-[10px] font-bold">FREE FOR INTERNS</Text>
            </View>
          )}
        </View>

        <Text className="text-gray-500 font-bold mb-4 ml-2 uppercase text-xs">Select Payment Method</Text>

        {/* --- OPTION 1: FREE (Intern Only) --- */}
        {subRole === 'intern' && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setSelectedMethod('free')}
            className={`p-5 rounded-[30px] border-2 mb-4 flex-row items-center ${
              selectedMethod === 'free' ? 'bg-white border-[#006B3F]' : 'bg-gray-50 border-transparent'
            }`} style={selectedMethod === 'free' ? {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            } : undefined}
          >
            <View className="bg-emerald-100 p-3 rounded-2xl">
              <MaterialCommunityIcons name="gift-outline" size={28} color="#006B3F" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-black text-slate-800">Free Meal</Text>
              <Text className="text-xs text-gray-400">Intern Entitlement</Text>
            </View>
            {selectedMethod === 'free' && <Feather name="check-circle" size={24} color="#006B3F" />}
          </TouchableOpacity>
        )}

        {/* --- OPTION 2: PAY NOW (Permanent, Casual, Manpower) --- */}
        {['permanent', 'casual', 'manpower'].includes(subRole || '') && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => setSelectedMethod('pay_now')}
            className={`p-5 rounded-[30px] border-2 mb-4 flex-row items-center ${
              selectedMethod === 'pay_now' ? 'bg-white border-[#006B3F]' : 'bg-gray-50 border-transparent'
            }`} style={selectedMethod === 'pay_now' ? {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            } : undefined}
          >
            <View className="bg-blue-50 p-3 rounded-2xl">
              <MaterialCommunityIcons name="cash" size={28} color="#2563EB" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-black text-slate-800">Pay Now</Text>
              <Text className="text-xs text-gray-400">Full Amount: LKR {currentPrice}</Text>
            </View>
            {selectedMethod === 'pay_now' && <Feather name="check-circle" size={24} color="#006B3F" />}
          </TouchableOpacity>
        )}

        {/* --- OPTION 3: PAY LATER (Casual, Manpower Only) --- */}
        {['casual', 'manpower'].includes(subRole || '') && (
          <View>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setSelectedMethod('pay_later')}
              className={`p-5 rounded-[30px] border-2 mb-4 flex-row items-center ${
                selectedMethod === 'pay_later' ? 'bg-white border-[#006B3F]' : 'bg-gray-50 border-transparent'
              }`} style={selectedMethod === 'pay_later' ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
              } : undefined}
            >
              <View className="bg-orange-50 p-3 rounded-2xl">
                <MaterialCommunityIcons name="clock-outline" size={28} color="#D97706" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-black text-slate-800">Pay Later</Text>
                <Text className="text-xs text-gray-400">Partially Pay & Deduct Rest</Text>
              </View>
              {selectedMethod === 'pay_later' && <Feather name="check-circle" size={24} color="#006B3F" />}
            </TouchableOpacity>

            {/* Input for Partial Amount (Only visible if Pay Later selected) */}
            {selectedMethod === 'pay_later' && (
              <View className="bg-white p-4 rounded-[25px] border border-gray-200 mb-6 mx-2">
                <Text className="text-xs text-gray-500 font-bold mb-2 ml-1">AMOUNT PAID NOW (LKR)</Text>
                <TextInput
                  value={payLaterAmount}
                  onChangeText={setPayLaterAmount}
                  placeholder="Enter amount (e.g. 50)"
                  keyboardType="numeric"
                  className="bg-gray-50 p-4 rounded-xl text-lg font-bold text-slate-800"
                />
                <Text className="text-[10px] text-gray-400 mt-2 ml-1">
                  Remaining {currentPrice - (parseFloat(payLaterAmount) || 0)} LKR will be deducted from salary.
                </Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Footer Button */}
      <View className="p-6 bg-white rounded-t-[40px]" style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      }}>
        <TouchableOpacity 
          onPress={handlePayment}
          disabled={loading}
          className="bg-[#006B3F] py-5 rounded-[25px] flex-row justify-center items-center" style={{
            shadowColor: "#10b981",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-black text-lg mr-2">CONFIRM PAYMENT</Text>
              <Feather name="check-circle" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}