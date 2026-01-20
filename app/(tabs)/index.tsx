import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { Utensils, QrCode, LogOut, User, ClipboardList } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import "../../global.css";

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Set StatusBar to light-content so icons appear white against the green gradient */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Restored Header Section with Linear Gradient */}
      <LinearGradient
        colors={['#059669', '#10b981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-12 px-8 rounded-b-[50px] shadow-2xl shadow-emerald-900"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
  <Text className="text-emerald-50 font-medium text-xs tracking-wider">
    Welcome / ආයුබෝවන්
  </Text>
  <Text 
    className="text-3xl font-black text-white capitalize" 
    numberOfLines={1}
  >
    {/* Use fullName here as defined in your User interface */}
    {user?.fullName?.split(' ')[0] || 'User'}
  </Text>
</View>

          {/* Top Right "My Orders" Button */}
          <TouchableOpacity 
            onPress={() => router.push('/book')} 
            className="bg-white/20 p-3 rounded-2xl border border-white/40 items-center justify-center ml-2"
          >
            <ClipboardList size={24} color="white" />
            <Text className="text-white text-[8px] font-bold mt-1">My Orders</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-6 -mt-8" 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View className="gap-y-6 pt-12 pb-6">
          
          {/* Main Action: Book Menu */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/BookMenu')}
            className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-200 border border-slate-100 flex-row items-center"
          >
            <View className="bg-emerald-50 p-5 rounded-3xl mr-6">
              <Utensils size={36} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-black text-slate-800">Book Menu</Text>
              <Text className="text-slate-500 font-bold text-xs mt-1">මෙනුව තෝරන්න</Text>
              <Text className="text-slate-400 font-medium text-[10px]">மெனுவைத் தேர்ந்தெடுக்கவும்</Text>
            </View>
          </TouchableOpacity>

          {/* Main Action: Get My Meal */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => console.log("Request Now clicked")}
            className="bg-emerald-600 p-8 rounded-[40px] shadow-2xl shadow-emerald-200 flex-row items-center"
          >
            <View className="bg-white/20 p-5 rounded-3xl mr-6">
              <QrCode size={36} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-black text-white">Get My Meal</Text>
              <Text className="text-emerald-100 font-bold text-xs mt-1">මගේ ආහාරය ලබා ගන්න</Text>
              <Text className="text-emerald-50 font-medium text-[10px]">எனது உணவைப் பெறுங்கள்</Text>
            </View>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            onPress={logout}
            className="mt-20 border-2 border-red-100 bg-red-50/30 p-6 rounded-[35px] flex-row items-center justify-center"
          >
            <LogOut size={22} color="#ef4444" className="mr-4" />
            <View className="items-center">
              <Text className="text-red-600 font-black text-lg">Logout</Text>
              <Text className="text-red-400 font-bold text-[10px]">පද්ධතියෙන් ඉවත් වන්න / வெளியேறவும்</Text>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}