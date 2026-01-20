import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { socket } from '@/services/socket';
import { useRouter } from 'expo-router';
import { respondToRequest } from '@/services/api';

export default function CanteenDashboard() {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit('join', 'canteen_room'); //

    socket.on('new_meal_request', (data) => {
      // Add new request to the top of the list
      setRequests(prev => [data, ...prev]); 
    });

    return () => { socket.off('new_meal_request'); };
  }, []);

  const handleAction = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      await respondToRequest(bookingId, action, token!); //
      // Remove from list
      setRequests(prev => prev.filter(req => req.bookingId !== bookingId));
    } catch (err: any) {
      Alert.alert("Error", err);
    }
  };

  const onLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-[#006B3F]">Canteen Dashboard</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text className="text-red-500 font-bold">Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.bookingId}
        renderItem={({ item }) => (
          <View className="bg-white p-6 rounded-3xl mb-4 shadow-sm">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Incoming Request</Text>
            <Text className="text-2xl font-black text-slate-800">{item.employeeName}</Text>
            <Text className="text-lg font-bold text-emerald-600 mb-6">{item.mealType.toUpperCase()}</Text>

            <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={() => handleAction(item.bookingId, 'accept')}
                className="flex-1 bg-emerald-600 py-4 rounded-xl items-center shadow-lg shadow-emerald-200"
              >
                <Text className="text-white font-black">ACCEPT</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleAction(item.bookingId, 'reject')}
                className="flex-1 bg-red-100 py-4 rounded-xl items-center border border-red-200"
              >
                <Text className="text-red-500 font-black">REJECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-gray-400 font-bold">No Pending Requests</Text>
            <Text className="text-gray-300 text-xs">Waiting for employees...</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}