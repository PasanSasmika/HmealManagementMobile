import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { getTodayMeals, requestMealAction } from '@/services/api';
import { socket } from '@/services/socket';

const MEAL_CONFIG = [
  { id: 'breakfast', title: 'BREAKFAST', sin: 'උදේ ආහාරය', tam: 'காலை உணவு', start: 7, end: 11 },
  { id: 'lunch', title: 'LUNCH', sin: 'දවල් ආහාරය', tam: 'மதிய உணவு', start: 12, end: 16 },
  { id: 'dinner', title: 'DINNER', sin: 'රාත්‍රී ආහාරය', tam: 'இரவு உணவு', start: 18, end: 22 },
];

export default function RequestNowScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

  // 1. Initial Data Fetch & Socket Setup
  useEffect(() => {
    fetchMeals();

    // Connect to Socket
    if (!socket.connected) socket.connect();
    if (user?.id) socket.emit('join', user.id); // Join private room to receive OTP

    // Listener: Request Accepted (Receive OTP)
    const onAccepted = (data: any) => {
      setRequestLoading(false); // Stop button loading
      Alert.alert(
        "Request Accepted! ✅", 
        `Your OTP is: ${data.otp}\n\nPlease show this code to the canteen.`,
        [{ text: "OK", onPress: () => fetchMeals() }] // Refresh list to update UI
      );
    };

    // Listener: Request Rejected
    const onRejected = (data: any) => {
      setRequestLoading(false); // Stop button loading
      Alert.alert("Request Rejected ❌", data.message || "Canteen denied the request.");
    };

    socket.on('meal_accepted', onAccepted);
    socket.on('meal_rejected', onRejected);

    // Cleanup listeners on unmount
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

  // 2. Button Functionality
  const handleRequest = async () => {
    if (!selectedMeal) return;
    
    setRequestLoading(true); // Start loading spinner on button

    try {
      // Step A: Call API to notify server
      await requestMealAction(selectedMeal, token!); 
      
      // Step B: Wait for Socket Response (Handled in useEffect)
      // We don't stop loading here; we wait for the socket event 'meal_accepted' or 'meal_rejected'
      
    } catch (err: any) {
      setRequestLoading(false);
      Alert.alert("Error", err);
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

      {/* Body: Meal List */}
      <ScrollView className="flex-1 px-5 pt-6 pb-32" showsVerticalScrollIndicator={false}>
        {todayBookings.length === 0 ? (
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
                  
                  {/* Status Text */}
                  {!canRequest && isBooked && (
                    <Text className="text-orange-400 text-[10px] font-bold mt-2 uppercase">
                      Time Locked / වේලාව නොවේ
                    </Text>
                  )}
                  {canRequest && (
                    <Text className="text-[#006B3F] text-[10px] font-bold mt-2 uppercase">
                      Ready to Request / ලබා ගත හැක
                    </Text>
                  )}
                </View>

                {/* Radio Button Visual */}
                {canRequest && (
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-[#006B3F]' : 'border-gray-200'}`}>
                    {isSelected && <View className="w-3 h-3 rounded-full bg-[#006B3F]" />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-32" /> 
      </ScrollView>

      {/* 3. Bottom Request Button (Fixed Position) */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-[40px] shadow-2xl shadow-black border-t border-gray-50">
        <TouchableOpacity 
          onPress={handleRequest}
          disabled={!selectedMeal || requestLoading}
          className={`py-5 rounded-[25px] flex-row justify-center items-center shadow-lg ${
            !selectedMeal || requestLoading ? 'bg-gray-300' : 'bg-[#006B3F] shadow-emerald-200'
          }`}
        >
          {requestLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-black text-lg mr-3">
                {selectedMeal ? `REQUEST ${selectedMeal.toUpperCase()}` : 'SELECT A MEAL'}
              </Text>
              {selectedMeal && <Feather name="send" size={20} color="white" />}
            </>
          )}
        </TouchableOpacity>
        <Text className="text-center text-gray-300 text-[10px] mt-3">
          Click to notify the canteen / ආපනශාලාව දැනුවත් කිරීමට ඔබන්න
        </Text>
      </View>
    </SafeAreaView>
  );
}