import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { respondToRequest, issueMealAction, rejectIssueAction } from '@/services/api'; // Import rejectIssueAction
import { socket } from '@/services/socket';

export default function CanteenDashboard() {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [servingQueue, setServingQueue] = useState<any[]>([]);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit('join', 'canteen_room');

    socket.on('new_meal_request', (data) => {
      setRequests(prev => [data, ...prev]);
    });

    socket.on('payment_confirmed', (data) => {
      setServingQueue(prev => [data, ...prev]);
    });

    return () => {
      socket.off('new_meal_request');
      socket.off('payment_confirmed');
    };
  }, []);

  // --- ACTIONS ---

  const handleAcceptReject = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      await respondToRequest(bookingId, action, token!);
      setRequests(prev => prev.filter(req => req.bookingId !== bookingId));
    } catch (err: any) {
      Alert.alert("Error", err);
    }
  };

  const handleIssueMeal = async (bookingId: string) => {
    try {
      await issueMealAction(bookingId, token!);
      setServingQueue(prev => prev.filter(item => item.bookingId !== bookingId));
      Alert.alert("Success", "Meal Issued! / ආහාර නිකුත් කරන ලදී ✅");
    } catch (err: any) {
      Alert.alert("Error", err);
    }
  };

  // ✅ NEW: Handle Reject at Issue Stage
  const handleRejectIssue = async (bookingId: string) => {
    Alert.alert(
      "Confirm Reject",
      "Are you sure? The employee will have to request again.\n(සේවකයාට නැවත ඉල්ලීමට සිදුවේ)",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reject", 
          style: "destructive", 
          onPress: async () => {
            try {
              await rejectIssueAction(bookingId, token!);
              setServingQueue(prev => prev.filter(item => item.bookingId !== bookingId));
            } catch (err: any) {
              Alert.alert("Error", err);
            }
          }
        }
      ]
    );
  };

  const onLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-5 bg-white shadow-sm flex-row justify-between items-center z-10">
        <View>
          <Text className="text-2xl font-black text-[#006B3F]">Canteen Panel</Text>
          <Text className="text-xs text-slate-500">ආපනශාලා පුවරුව / சிற்றுண்டிச்சாலை</Text>
        </View>
        <TouchableOpacity onPress={onLogout} className="bg-red-50 p-2 rounded-full">
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        
        {/* --- SECTION 1: READY TO SERVE --- */}
        {servingQueue.length > 0 && (
          <View className="mb-8">
            <View className="mb-4">
              <View className="flex-row items-center">
                <View className="bg-orange-100 p-2 rounded-full mr-2">
                  <MaterialCommunityIcons name="food-turkey" size={20} color="#D97706" />
                </View>
                <Text className="text-lg font-black text-slate-800">READY TO SERVE ({servingQueue.length})</Text>
              </View>
              <Text className="text-xs text-gray-400 ml-9">පිළිගැන්වීමට සූදානම් / பரிமாறத் தயார்</Text>
            </View>

            {servingQueue.map((item) => (
              <View key={item.bookingId} className="bg-white p-5 rounded-[25px] mb-4 border-l-4 border-orange-400 shadow-sm">
                
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-xl font-black text-slate-800">{item.employeeName}</Text>
                    <Text className="text-gray-400 text-xs font-bold uppercase">{item.mealType} Meal</Text>
                  </View>
                  <View className="bg-emerald-100 px-3 py-1 rounded-full flex-row items-center">
                    <Feather name="check" size={12} color="#059669" />
                    <Text className="text-emerald-700 text-[10px] font-bold ml-1">OTP OK / තහවුරු විය</Text>
                  </View>
                </View>

                {/* Details */}
                <View className="bg-gray-50 p-3 rounded-xl mb-4 flex-row justify-between items-center border border-gray-100">
                  <View>
                    <Text className="text-[10px] text-gray-400 font-bold uppercase">Payment / ගෙවීම</Text>
                    <Text className="text-sm font-bold text-[#006B3F] capitalize">
                      {item.paymentType === 'pay_now' ? 'Pay Now (Cash/Card)' : 
                       item.paymentType === 'free' ? 'Free (Intern)' : 'Salary Deduct'}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase">Paid / ගෙවූ මුදල</Text>
                    <Text className="text-lg font-black text-slate-800">LKR {item.amountPaid}</Text>
                    {item.balance > 0 && (
                      <Text className="text-[10px] text-red-400 font-bold">Bal: {item.balance}</Text>
                    )}
                  </View>
                </View>

                {/* Actions: ISSUE & REJECT */}
                <View className="flex-row gap-3">
                  {/* Issue Button */}
                  <TouchableOpacity 
                    onPress={() => handleIssueMeal(item.bookingId)}
                    className="flex-1 bg-[#006B3F] py-4 rounded-xl flex-row justify-center items-center shadow-md shadow-emerald-200"
                  >
                    <Text className="text-white font-bold text-lg mr-2">ISSUE / නිකුත්</Text>
                    <Feather name="arrow-right-circle" size={20} color="white" />
                  </TouchableOpacity>

                  {/* Reject Button (New) */}
                  <TouchableOpacity 
                    onPress={() => handleRejectIssue(item.bookingId)}
                    className="bg-red-50 px-4 rounded-xl justify-center items-center border border-red-100"
                  >
                    <MaterialCommunityIcons name="close-circle-outline" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>

              </View>
            ))}
          </View>
        )}

        {/* --- SECTION 2: INCOMING REQUESTS --- */}
        <View className="mb-20">
          <View className="mb-4">
            <View className="flex-row items-center">
              <View className="bg-blue-100 p-2 rounded-full mr-2">
                <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#2563EB" />
              </View>
              <Text className="text-lg font-black text-slate-800">INCOMING ({requests.length})</Text>
            </View>
            <Text className="text-xs text-gray-400 ml-9">නව ඉල්ලීම් / உள்வரும் கோரிக்கைகள்</Text>
          </View>

          {requests.length === 0 ? (
            <View className="items-center py-10 opacity-50">
              <Feather name="inbox" size={40} color="#9CA3AF" />
              <Text className="text-gray-400 mt-2 text-center">No new requests{"\n"}නව ඉල්ලීම් නොමැත</Text>
            </View>
          ) : (
            requests.map((item) => (
              <View key={item.bookingId} className="bg-white p-5 rounded-[25px] mb-4 shadow-sm border border-gray-100">
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Requesting / ඉල්ලුම් කරයි...</Text>
                <Text className="text-xl font-black text-slate-800">{item.employeeName}</Text>
                <Text className="text-emerald-600 font-bold mb-4 uppercase">{item.mealType}</Text>

                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={() => handleAcceptReject(item.bookingId, 'accept')}
                    className="flex-1 bg-emerald-600 py-3 rounded-xl items-center shadow-sm"
                  >
                    <Text className="text-white font-bold">ACCEPT / භාරගන්න</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleAcceptReject(item.bookingId, 'reject')}
                    className="flex-1 bg-red-50 py-3 rounded-xl items-center border border-red-100"
                  >
                    <Text className="text-red-500 font-bold">REJECT / එපා</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}