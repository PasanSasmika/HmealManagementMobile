import { useAuthStore } from '@/store/useAuthStore';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <View className="mt-10">
        <Text className="text-2xl text-gray-500">Hi User,</Text>
        <Text className="text-4xl font-bold text-[#006B3F]">{user?.fullName}</Text>
        <Text className="text-lg text-gray-400 mt-2">Role: {user?.role} ({user?.subRole || 'N/A'})</Text>
      </View>

      <View className="flex-1 justify-center">
        <Text className="text-center text-gray-300 italic">UserHome Page Content</Text>
      </View>

      <TouchableOpacity 
        onPress={logout}
        className="bg-red-50 py-4 rounded-2xl border border-red-200"
      >
        <Text className="text-red-500 text-center font-bold">Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}