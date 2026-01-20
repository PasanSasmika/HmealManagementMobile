import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function PaymentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'pay_later' | 'pay_now'>('pay_later');

  const handlePayment = () => {
    setLoading(true);

    // Simulate Network Request
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Payment Successful! 🎉",
        "Your meal has been confirmed. Enjoy your food!",
        [
          { 
            text: "Back to Home", 
            onPress: () => router.replace('/(tabs)') // Go back to main tabs
          }
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6]">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm rounded-b-[30px] z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#006B3F" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-2xl font-black text-[#006B3F]">Payment</Text>
          <Text className="text-xs text-gray-400">ගෙවීම් ක්‍රමය තෝරන්න / கட்டணம்</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        
        {/* Total Amount Card */}
        <View className="bg-[#006B3F] p-6 rounded-[35px] items-center mb-8 shadow-lg shadow-emerald-200">
          <Text className="text-emerald-100 font-bold tracking-widest text-xs uppercase">Total Amount</Text>
          <Text className="text-white font-black text-5xl mt-2">LKR 150</Text>
          <View className="bg-white/20 px-3 py-1 rounded-full mt-3">
             <Text className="text-white text-[10px] font-bold">Standard Meal Price</Text>
          </View>
        </View>

        <Text className="text-gray-500 font-bold mb-4 ml-2 uppercase text-xs">Select Payment Method</Text>

        {/* Option 1: Salary Deduction */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => setSelectedMethod('pay_later')}
          className={`p-5 rounded-[30px] border-2 mb-4 flex-row items-center ${
            selectedMethod === 'pay_later' ? 'bg-white border-[#006B3F] shadow-md' : 'bg-gray-50 border-transparent'
          }`}
        >
          <View className={`p-3 rounded-2xl ${selectedMethod === 'pay_later' ? 'bg-emerald-50' : 'bg-gray-200'}`}>
            <MaterialCommunityIcons name="briefcase-account" size={28} color={selectedMethod === 'pay_later' ? '#006B3F' : '#9CA3AF'} />
          </View>
          <View className="ml-4 flex-1">
            <Text className={`text-lg font-black ${selectedMethod === 'pay_later' ? 'text-slate-800' : 'text-gray-400'}`}>
              Salary Deduction
            </Text>
            <Text className="text-xs text-gray-400">Deduct from end-of-month salary</Text>
          </View>
          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedMethod === 'pay_later' ? 'border-[#006B3F]' : 'border-gray-300'}`}>
            {selectedMethod === 'pay_later' && <View className="w-3 h-3 rounded-full bg-[#006B3F]" />}
          </View>
        </TouchableOpacity>

        {/* Option 2: Pay Now */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => setSelectedMethod('pay_now')}
          className={`p-5 rounded-[30px] border-2 mb-4 flex-row items-center ${
            selectedMethod === 'pay_now' ? 'bg-white border-[#006B3F] shadow-md' : 'bg-gray-50 border-transparent'
          }`}
        >
          <View className={`p-3 rounded-2xl ${selectedMethod === 'pay_now' ? 'bg-emerald-50' : 'bg-gray-200'}`}>
            <MaterialCommunityIcons name="credit-card-outline" size={28} color={selectedMethod === 'pay_now' ? '#006B3F' : '#9CA3AF'} />
          </View>
          <View className="ml-4 flex-1">
            <Text className={`text-lg font-black ${selectedMethod === 'pay_now' ? 'text-slate-800' : 'text-gray-400'}`}>
              Pay Now
            </Text>
            <Text className="text-xs text-gray-400">Pay via Cash or Card at Counter</Text>
          </View>
          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedMethod === 'pay_now' ? 'border-[#006B3F]' : 'border-gray-300'}`}>
            {selectedMethod === 'pay_now' && <View className="w-3 h-3 rounded-full bg-[#006B3F]" />}
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Footer Button */}
      <View className="p-6 bg-white rounded-t-[40px] shadow-2xl">
        <TouchableOpacity 
          onPress={handlePayment}
          disabled={loading}
          className="bg-[#006B3F] py-5 rounded-[25px] flex-row justify-center items-center shadow-lg shadow-emerald-200"
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