import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchUpcomingBookings, cancelMealAction } from '@/services/api';

export default function MyBookingsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await fetchUpcomingBookings(token!);
      if (res.success) {
        const sorted = res.data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setBookings(sorted);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancel = (bookingId: string, dateStr: string, mealType: string) => {
    Alert.alert(
      "Cancel Meal? / අවලංගු කරනවාද?",
      `Are you sure you want to cancel ${mealType} on ${dateStr}? / நீங்கள் உணவை ரத்து செய்ய விரும்புகிறீர்களா?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelMealAction(bookingId, token!);
              Alert.alert("Cancelled", "Meal booking removed. / ආහාර වෙන් කිරීම ඉවත් කර ඇත. / உணவு முன்பதிவு நீக்கப்பட்டுள்ளது");
              loadBookings(); 
            } catch (err: any) {
              Alert.alert("Cannot Cancel", err);
            }
          }
        }
      ]
    );
  };

  // ✅ UPDATED LOGIC: Specific Deadlines for Breakfast, Lunch, Dinner
  const isCancellable = (bookingDate: string, mealType: string) => {
    const mealDate = new Date(bookingDate);
    
    // 1. Base Deadline = Previous Day
    const deadline = new Date(mealDate);
    deadline.setDate(mealDate.getDate() - 1); 

    // 2. Specific Hour based on Meal Type (Local Time)
    if (mealType === 'breakfast') {
      deadline.setHours(10, 0, 0, 0); // 10:00 AM
    } 
    else if (mealType === 'lunch') {
      deadline.setHours(14, 0, 0, 0); // 02:00 PM
    } 
    else if (mealType === 'dinner') {
      deadline.setHours(18, 0, 0, 0); // 06:00 PM
    }

    const now = new Date();
    return now < deadline;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6]">
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm mb-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#006B3F" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-2xl font-black text-[#006B3F]">My Bookings</Text>
          <Text className="text-xs text-gray-400">ඔබගේ වෙන් කිරීම් / முன்பதிவுகள்</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} colors={["#006B3F"]} />}
      >
        {loading ? (
          <View className="mt-20"><ActivityIndicator size="large" color="#006B3F" /></View>
        ) : bookings.length === 0 ? (
          <View className="mt-20 items-center opacity-50">
            <MaterialCommunityIcons name="calendar-remove" size={60} color="#9CA3AF" />
            <Text className="text-gray-500 font-bold mt-4">No upcoming bookings</Text>
            <TouchableOpacity onPress={() => router.push('/BookMenu')} className="mt-6 bg-[#006B3F] px-6 py-3 rounded-full">
              <Text className="text-white font-bold">Book a Meal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map((item: any) => {
            const dateObj = new Date(item.date);
            const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            
            // ✅ Check Logic Here
            const canCancel = isCancellable(item.date, item.mealType);

            return (
              <View key={item._id} className="bg-white p-5 rounded-[25px] mb-4 shadow-sm border border-gray-100 flex-row items-center">
                <View className="bg-emerald-50 p-3 rounded-2xl items-center w-[70px]">
                  <Text className="text-xl font-black text-[#006B3F]">{dateObj.getDate()}</Text>
                  <Text className="text-[10px] uppercase font-bold text-emerald-600">
                    {dateObj.toLocaleString('default', { month: 'short' })}
                  </Text>
                </View>

                <View className="ml-4 flex-1">
                  <Text className="text-lg font-black text-slate-800 uppercase">{item.mealType}</Text>
                  <View className={`self-start px-2 py-1 rounded-md mt-1 ${item.status === 'served' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <Text className={`text-[10px] font-bold ${item.status === 'served' ? 'text-blue-700' : 'text-green-700'}`}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {item.status !== 'served' && (
                  <View>
                    {canCancel ? (
                      <TouchableOpacity 
                        onPress={() => handleCancel(item._id, dateStr, item.mealType)}
                        className="bg-red-50 p-3 rounded-full border border-red-100"
                      >
                        <Feather name="trash-2" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    ) : (
                      <View className="items-center opacity-50">
                        <MaterialCommunityIcons name="lock" size={24} color="#9CA3AF" />
                        <Text className="text-[8px] text-gray-400 mt-1 font-bold">LOCKED</Text>
                         <Text className="text-[8px] text-gray-400 mt-1 font-bold">අවලංගු කළ නොහැක</Text>
                          <Text className="text-[8px] text-gray-400 mt-1 font-bold">ரத்து செய்ய முடியாது</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}