import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { getTodayMeals, requestMealAction } from '@/services/api';

const MEAL_CONFIG = [
  { id: 'breakfast', title: 'BREAKFAST', sin: 'උදේ ආහාරය', tam: 'காலை உணவு', start: 7, end: 11 },
  { id: 'lunch', title: 'LUNCH', sin: 'දවල් ආහාරය', tam: 'மதிய உணவு', start: 12, end: 16 },
  { id: 'dinner', title: 'DINNER', sin: 'රාත්‍රී ආහාරය', tam: 'இரவு உணவு', start: 18, end: 22 },
];

export default function RequestNowScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

  const fetchMeals = async () => {
    try {
      const res = await getTodayMeals(token!); //
      setTodayBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeals(); }, []);

  const isTimeValid = (mealId: string) => {
    const hour = new Date().getHours();
    const config = MEAL_CONFIG.find(m => m.id === mealId);
    return config ? hour >= config.start && hour < config.end : false; //
  };

  const handleRequest = async () => {
    if (!selectedMeal) return;
    setRequestLoading(true);
    try {
      await requestMealAction(selectedMeal, token!); //
      Alert.alert("Success", "Request sent to canteen!");
      fetchMeals();
    } catch (err: any) {
      Alert.alert("Denied", err);
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) return <View className="flex-1 justify-center bg-[#F1FBF6]"><ActivityIndicator size="large" color="#006B3F" /></View>;

  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6]">
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2"><Ionicons name="arrow-back" size={28} color="#006B3F" /></TouchableOpacity>
        <View className="ml-2">
          <Text className="text-3xl font-bold text-[#006B3F]">Meal Status</Text>
          <Text className="text-xs text-[#006B3F]/60">ආහාර වේලෙහි තත්ත්වය / உணவு நிலை</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        {todayBookings.length === 0 ? (
          <View className="mt-20 items-center">
            <Feather name="info" size={50} color="#006B3F" />
            <Text className="text-lg font-bold text-[#006B3F] mt-4 text-center">You haven't booked any meals for today.</Text>
            <Text className="text-slate-500 text-center">අද සඳහා ඔබ කිසිදු ආහාරයක් වෙන් කර නැත.</Text>
            <Text className="text-slate-400 text-xs text-center">இன்று நீங்கள் எந்த உணவையும் முன்பதிவு செய்யவில்லை.</Text>
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
                onPress={() => setSelectedMeal(meal.id)}
                className={`mb-4 p-5 rounded-[30px] border flex-row items-center ${
                  !isBooked ? 'bg-gray-100 border-gray-200 opacity-50' : 
                  !canRequest ? 'bg-gray-50 border-gray-100' : 
                  isSelected ? 'bg-white border-emerald-500 shadow-lg' : 'bg-white border-white'
                }`}
              >
                <View className={`p-4 rounded-2xl ${canRequest ? 'bg-[#F1FBF6]' : 'bg-gray-200'}`}>
                  <MaterialCommunityIcons 
                    name={canRequest ? "silverware-fork-knife" : "lock-outline"} 
                    size={30} color={canRequest ? "#006B3F" : "#94a3b8"} 
                  />
                </View>
                <View className="ml-5 flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className={`text-xl font-black ${canRequest ? 'text-slate-800' : 'text-slate-400'}`}>{meal.title}</Text>
                    {isBooked && <View className="bg-emerald-100 px-3 py-1 rounded-full"><Text className="text-emerald-700 text-[10px] font-bold">BOOKED</Text></View>}
                  </View>
                  <Text className="text-slate-500 text-xs">{meal.sin} / {meal.tam}</Text>
                  {!canRequest && isBooked && (
                    <Text className="text-red-400 text-[10px] font-bold mt-1 uppercase">Not available now / දැනට ලබාගත නොහැක</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Dynamic Request Button */}
      {selectedMeal && (
        <View className="p-6 bg-white border-t border-gray-100">
          <TouchableOpacity 
            onPress={handleRequest}
            disabled={requestLoading}
            className="bg-[#006B3F] py-5 rounded-[25px] flex-row justify-center items-center shadow-lg shadow-emerald-200"
          >
            {requestLoading ? <ActivityIndicator color="white" /> : (
              <>
                <Text className="text-white font-black text-lg mr-3">REQUEST {selectedMeal.toUpperCase()}</Text>
                <Feather name="send" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
          <Text className="text-center text-slate-400 text-[10px] mt-2">ආහාරය ඉල්ලන්න / உணவைக் கோருங்கள்</Text>
        </View>
      )}
    </SafeAreaView>
  );
}