import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { bookMeals } from '@/services/api';

const MEAL_TYPES = [
  { id: 'breakfast', title: 'BREAKFAST', sinhala: 'උදේ ආහාරය', tamil: 'காலை உணவு' },
  { id: 'lunch', title: 'LUNCH', sinhala: 'දවල් ආහාරය', tamil: 'மதிய உணவு' },
  { id: 'dinner', title: 'DINNER', sinhala: 'රාත්‍රී ආහාරය', tamil: 'இரவு உணவு' },
];

export default function BookMenuScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Track which meal types are "ticked" (expanded)
  const [activeMeals, setActiveMeals] = useState<Record<string, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  // Track specific dates selected per meal
  const [selections, setSelections] = useState<Record<string, string[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
  });

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0); // Align with backend UTC expectations
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const dates = getNextSevenDays();

  // Toggle the visibility/ticked status of a meal section
  const toggleMealActive = (mealId: string) => {
    setActiveMeals(prev => {
      const isNowActive = !prev[mealId];
      // If unticked, clear the dates for that meal
      if (!isNowActive) {
        setSelections(s => ({ ...s, [mealId]: [] }));
      }
      return { ...prev, [mealId]: isNowActive };
    });
  };

  const toggleDate = (mealId: string, dateIso: string) => {
    setSelections(prev => {
      const current = prev[mealId];
      if (current.includes(dateIso)) {
        return { ...prev, [mealId]: current.filter(d => d !== dateIso) };
      } else {
        return { ...prev, [mealId]: [...current, dateIso] };
      }
    });
  };

  const handleSubmit = async () => {
    const flatBookings: { date: string, mealType: string }[] = [];
    Object.entries(selections).forEach(([type, selectedDates]) => {
      selectedDates.forEach(date => {
        flatBookings.push({ date, mealType: type });
      });
    });

    if (flatBookings.length === 0) {
      Alert.alert('Selection Empty', 'Please select at least one meal date.');
      return;
    }

    setLoading(true);
    try {
      await bookMeals(flatBookings, token!); // Uses your api.ts
      Alert.alert('Success', 'Meals booked successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6]">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={28} color="#006B3F" />
        </TouchableOpacity>
        <View className="ml-2">
          <Text className="text-2xl font-bold text-[#006B3F]">Book Your Meals</Text>
          <Text className="text-xs text-[#006B3F]/60">ඔබට ආහාර අවශ්‍ය දින තෝරන්න</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {MEAL_TYPES.map((meal) => (
          <View key={meal.id} className="bg-white rounded-[30px] p-6 mb-4 shadow-sm border border-gray-100">
            {/* Meal Header / Toggle Row */}
            <TouchableOpacity 
              onPress={() => toggleMealActive(meal.id)}
              className="flex-row justify-between items-center"
              activeOpacity={0.7}
            >
              <View>
                <Text className="text-xl font-black text-slate-800">{meal.title}</Text>
                <Text className="text-slate-500 text-xs">{meal.sinhala} / {meal.tamil}</Text>
              </View>
              <MaterialCommunityIcons 
                name={activeMeals[meal.id] ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={32} 
                color={activeMeals[meal.id] ? "#059669" : "#D1D5DB"} 
              />
            </TouchableOpacity>

            {/* Conditional Date Selection - Only shows if activeMeals[id] is true */}
            {activeMeals[meal.id] && (
              <View className="mt-6">
                <View className="h-[1px] bg-gray-100 mb-4" />
                <Text className="text-[10px] text-emerald-600 font-bold mb-4">
                  SELECT DATES / දින තෝරන්න / தேதிகளைத் தேர்ந்தெடுக்கவும்
                </Text>
                
                <View className="flex-row flex-wrap justify-start">
                  {dates.map((date, index) => {
                    const dateIso = date.toISOString().split('T')[0] + 'T00:00:00.000Z';
                    const isSelected = selections[meal.id].includes(dateIso);
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => toggleDate(meal.id, dateIso)}
                        className={`w-[18%] aspect-square rounded-2xl items-center justify-center m-[1%] border ${
                          isSelected ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-gray-100'
                        }`}
                      >
                        <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                          {date.getDate()}
                        </Text>
                        <Text className={`text-[8px] uppercase ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {date.toLocaleString('default', { month: 'short' })}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        ))}
        <View className="h-10" />
      </ScrollView>

      {/* Footer Submit Button */}
      <View className="p-6 bg-white border-t border-gray-100">
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading}
          className="bg-emerald-600 py-5 rounded-[25px] flex-row justify-center items-center shadow-lg shadow-emerald-200"
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <Text className="text-white font-black text-lg">Submit Selection / ඉදිරිපත් කරන්න</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}