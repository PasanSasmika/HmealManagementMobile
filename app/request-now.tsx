import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { getTodayMeals, requestMealAction, verifyMealOTP } from '@/services/api';
import { socket } from '@/services/socket';

const MEAL_CONFIG = [
  { id: 'breakfast', title: 'BREAKFAST', sin: 'උදේ ආහාරය', tam: 'காலை உணவு', start: 7, end: 11 },
  { id: 'lunch', title: 'LUNCH', sin: 'දවල් ආහාරය', tam: 'மதிய உணவு', start: 12, end: 16 },
  { id: 'dinner', title: 'DINNER', sin: 'රාත්‍රී ආහාරය', tam: 'இரவு உணவு', start: 18, end: 22 },
];

export default function RequestNowScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  
  // UI States
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  
  // OTP Workflow States
  const [isOtpView, setIsOtpView] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState<string>(''); // OTP from Socket
  const [enteredOtp, setEnteredOtp] = useState<string>('');   // OTP user types
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMeals();

    if (!socket.connected) socket.connect();
    if (user?.id) socket.emit('join', user.id);

    // Listener: Request Accepted -> Switch to OTP View
    const onAccepted = (data: any) => {
      setRequestLoading(false);
      setReceivedOtp(data.otp); // Store the OTP from Canteen
      setIsOtpView(true);       // Switch UI to OTP mode
    };

    const onRejected = (data: any) => {
      setRequestLoading(false);
      Alert.alert("Request Rejected ❌", data.message || "Canteen denied the request.");
    };

    socket.on('meal_accepted', onAccepted);
    socket.on('meal_rejected', onRejected);

    return () => {
      socket.off('meal_accepted', onAccepted);
      socket.off('meal_rejected', onRejected);
    };
  }, []);

  const fetchMeals = async () => {
    try {
      const res = await getTodayMeals(token!); 
      setTodayBookings(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const isTimeValid = (mealId: string) => {
    const hour = new Date().getHours();
    const config = MEAL_CONFIG.find(m => m.id === mealId);
    return config ? hour >= config.start && hour < config.end : false;
  };

  // 1. Send Request
  const handleRequest = async () => {
    if (!selectedMeal) return;
    
    // Find the booking ID for the selected meal to verify later
    const booking = todayBookings.find(b => b.mealType === selectedMeal);
    if (booking) setCurrentBookingId(booking._id);

    setRequestLoading(true);
    try {
      await requestMealAction(selectedMeal, token!); 
      // UI stays loading until Socket response...
    } catch (err: any) {
      setRequestLoading(false);
      Alert.alert("Error", err);
    }
  };

  // 2. Submit OTP
  const handleSubmitOTP = async () => {
    if (!enteredOtp || enteredOtp.length !== 4) {
      Alert.alert("Invalid Code", "Please enter the 4-digit code shown above.");
      return;
    }
    
    // Optional: Check if it matches what we received (Client side check)
    if (enteredOtp !== receivedOtp) {
      Alert.alert("Error", "The code you entered does not match.");
      return;
    }

    setRequestLoading(true);
    try {
      // Verify with Backend
      if (currentBookingId) {
        await verifyMealOTP(currentBookingId, enteredOtp, token!);
        
        // Success -> Redirect to Payment
        router.push('/payment'); 
      }
    } catch (err: any) {
      Alert.alert("Verification Failed", err);
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-[#F1FBF6]">
      <ActivityIndicator size="large" color="#006B3F" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6] relative">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm rounded-b-[30px] z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#006B3F" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-2xl font-black text-[#006B3F]">Meal Status</Text>
          <Text className="text-xs text-gray-400">ආහාර වේලෙහි තත්ත්වය</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-32" showsVerticalScrollIndicator={false}>
        
        {/* --- CONDITIONAL VIEW: Show List OR OTP --- */}
        {!isOtpView ? (
          // === VIEW 1: EXISTING MEAL LIST ===
          todayBookings.length === 0 ? (
            <View className="mt-20 items-center opacity-60">
              <Feather name="calendar" size={60} color="#006B3F" />
              <Text className="text-lg font-bold text-[#006B3F] mt-6 text-center">No bookings found</Text>
              <Text className="text-gray-500 text-center mt-2">You haven't booked any meals for today.</Text>
            </View>
          ) : (
            MEAL_CONFIG.map((meal) => {
              const isBooked = todayBookings.some(b => b.mealType === meal.id);
              const canRequest = isBooked && isTimeValid(meal.id);
              const isSelected = selectedMeal === meal.id;

              return (
                <TouchableOpacity 
                  key={meal.id}
                  disabled={!canRequest}
                  activeOpacity={0.9}
                  onPress={() => setSelectedMeal(meal.id)}
                  className={`mb-4 p-5 rounded-[30px] border-2 flex-row items-center ${
                    !isBooked ? 'bg-gray-100 border-gray-100 opacity-50' : 
                    !canRequest ? 'bg-gray-50 border-gray-100' : 
                    isSelected ? 'bg-white border-[#006B3F] shadow-lg shadow-emerald-100' : 'bg-white border-transparent shadow-sm'
                  }`}
                >
                  <View className={`p-4 rounded-2xl ${canRequest ? 'bg-[#F1FBF6]' : 'bg-gray-200'}`}>
                    <MaterialCommunityIcons 
                      name={canRequest ? "silverware-fork-knife" : "lock-outline"} 
                      size={28} color={canRequest ? "#006B3F" : "#9ca3af"} 
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className={`text-lg font-black ${canRequest ? 'text-slate-800' : 'text-slate-400'}`}>
                        {meal.title}
                      </Text>
                      {isBooked && (
                        <View className="bg-emerald-100 px-2 py-1 rounded-lg">
                          <Text className="text-emerald-700 text-[10px] font-bold">BOOKED</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-400 text-xs">{meal.sin}</Text>
                    
                    {!canRequest && isBooked && (
                      <Text className="text-orange-400 text-[10px] font-bold mt-2 uppercase">Time Locked / වේලාව නොවේ</Text>
                    )}
                    {canRequest && (
                      <Text className="text-[#006B3F] text-[10px] font-bold mt-2 uppercase">Ready to Request / ලබා ගත හැක</Text>
                    )}
                  </View>
                  {canRequest && (
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-[#006B3F]' : 'border-gray-200'}`}>
                      {isSelected && <View className="w-3 h-3 rounded-full bg-[#006B3F]" />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )
        ) : (
          // === VIEW 2: OTP DISPLAY & INPUT (Matches Image 5) ===
          <View className="mt-4">
             {/* Selected Meal Indicator */}
            <View className="bg-white p-5 rounded-[30px] flex-row items-center shadow-sm border border-gray-100 mb-6">
               <View className="bg-[#F1FBF6] p-4 rounded-2xl">
                 <MaterialCommunityIcons name="silverware-fork-knife" size={28} color="#006B3F" />
               </View>
               <View className="ml-4">
                 <Text className="text-lg font-black text-slate-800">{selectedMeal?.toUpperCase()}</Text>
                 <View className="bg-emerald-100 self-start px-2 py-1 rounded-lg mt-1">
                    <Text className="text-emerald-700 text-[10px] font-bold">ACCEPTED</Text>
                 </View>
               </View>
            </View>

            {/* OTP Display Card (Dashed Border) */}
            <View className="bg-[#FFFBEB] p-8 rounded-[35px] border-2 border-dashed border-amber-300 items-center mb-8">
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={40} color="#D97706" />
              <Text className="text-amber-700 font-bold text-center mt-2 mb-1">YOUR OTP / ඔබගේ කේතය</Text>
              
              {/* LARGE OTP TEXT */}
              <Text className="text-6xl font-black text-amber-800 tracking-widest my-2">
                {receivedOtp}
              </Text>
              
              <Text className="text-amber-600/60 text-[10px] font-bold">Show this to the canteen staff</Text>
            </View>

            {/* OTP Input Field */}
            <Text className="text-[#006B3F] font-bold ml-2 mb-2">Type Code Here / කේතය ඇතුළත් කරන්න</Text>
            <View className="bg-white p-2 rounded-[20px] border border-gray-200 shadow-sm">
              <TextInput
                value={enteredOtp}
                onChangeText={setEnteredOtp}
                keyboardType="numeric"
                maxLength={4}
                placeholder={receivedOtp} // Hint is the actual OTP
                className="text-center text-3xl font-bold text-slate-800 py-4 tracking-[10px]"
                selectionColor="#006B3F"
              />
            </View>
          </View>
        )}
        <View className="h-32" /> 
      </ScrollView>

      {/* 3. Bottom Action Button (Changes based on View) */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-[40px] shadow-2xl shadow-black border-t border-gray-50">
        {!isOtpView ? (
          // Button A: REQUEST
          <TouchableOpacity 
            onPress={handleRequest}
            disabled={!selectedMeal || requestLoading}
            className={`py-5 rounded-[25px] flex-row justify-center items-center shadow-lg ${
              !selectedMeal || requestLoading ? 'bg-gray-300' : 'bg-[#006B3F] shadow-emerald-200'
            }`}
          >
            {requestLoading ? <ActivityIndicator color="white" /> : (
              <>
                <Text className="text-white font-black text-lg mr-3">
                  {selectedMeal ? `REQUEST ${selectedMeal.toUpperCase()}` : 'SELECT A MEAL'}
                </Text>
                {selectedMeal && <Feather name="send" size={20} color="white" />}
              </>
            )}
          </TouchableOpacity>
        ) : (
          // Button B: SUBMIT OTP (Matches Image 5 Green Button)
          <TouchableOpacity 
            onPress={handleSubmitOTP}
            disabled={requestLoading}
            className="bg-[#006B3F] py-5 rounded-[25px] flex-row justify-center items-center shadow-lg shadow-emerald-200"
          >
             {requestLoading ? <ActivityIndicator color="white" /> : (
               <Text className="text-white font-black text-lg">SUBMIT OTP</Text>
             )}
          </TouchableOpacity>
        )}
        
        <Text className="text-center text-gray-300 text-[10px] mt-3">
          {!isOtpView ? "Click to notify the canteen / ආපනශාලාව දැනුවත් කිරීමට ඔබන්න" : "Verify code to proceed / ගෙවීම් වෙත යොමු වන්න"}
        </Text>
      </View>
    </SafeAreaView>
  );
}