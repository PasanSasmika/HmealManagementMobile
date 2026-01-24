import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { getWalletStats } from '@/services/api';

export default function MyWalletScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    successMeals: 0,
    missedMeals: 0,
    loanAmount: 0,
    loanLimit: 0,
    userRole: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getWalletStats(token!);
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateLoanPercentage = () => {
    if (stats.loanLimit === 0) return 0;
    const pct = (stats.loanAmount / stats.loanLimit) * 100;
    return Math.min(pct, 100); // Cap at 100%
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-[#F1FBF6]">
      <ActivityIndicator size="large" color="#006B3F" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6]">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center bg-white shadow-sm rounded-b-[30px] z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#006B3F" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-2xl font-black text-[#006B3F]">My Wallet</Text>
          <Text className="text-xs text-gray-400">මගේ මුදල් පසුම්බිය / என் பணப்பை</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={["#006B3F"]} />}
      >
        
        {/* --- STATS GRID (Everyone Sees This) --- */}
        <View className="flex-row justify-between mb-6">
          {/* Success Card */}
          <View className="bg-white w-[48%] p-5 rounded-[25px] shadow-sm border border-emerald-100 items-center">
            <View className="bg-emerald-50 p-3 rounded-full mb-3">
              <MaterialCommunityIcons name="food-fork-drink" size={28} color="#059669" />
            </View>
            <Text className="text-3xl font-black text-slate-800">{stats.successMeals}</Text>
            <Text className="text-xs text-gray-400 font-bold uppercase text-center mt-1">
              Success Meals
            </Text>
            <Text className="text-[9px] text-gray-300 text-center">සාර්ථක / வெற்றி</Text>
          </View>

          {/* Missed Card */}
          <View className="bg-white w-[48%] p-5 rounded-[25px] shadow-sm border border-red-50 items-center">
            <View className="bg-red-50 p-3 rounded-full mb-3">
              <MaterialCommunityIcons name="food-off" size={28} color="#EF4444" />
            </View>
            <Text className="text-3xl font-black text-slate-800">{stats.missedMeals}</Text>
            <Text className="text-xs text-gray-400 font-bold uppercase text-center mt-1">
              Missed Meals
            </Text>
            <Text className="text-[9px] text-gray-300 text-center">මඟ හැරුණු / தவறிய</Text>
          </View>
        </View>

        {/* --- LOAN SECTION (Only for Casual & Manpower) --- */}
        {/* Updated: Removed 'permanent' from this check */}
        {['casual', 'manpower'].includes(stats.userRole) && (
          <View className="bg-white p-6 rounded-[30px] shadow-md border border-gray-100 mb-8">
            <View className="flex-row items-center mb-4">
              <View className="bg-orange-50 p-2 rounded-xl mr-3">
                <FontAwesome5 name="coins" size={20} color="#D97706" />
              </View>
              <View>
                <Text className="text-lg font-black text-slate-800">Outstanding Loan</Text>
                <Text className="text-xs text-gray-400">ගෙවිය යුතු ණය මුදල / கடன் தொகை</Text>
              </View>
            </View>

            <View className="items-center my-4">
              <Text className="text-5xl font-black text-[#006B3F]">
                <Text className="text-2xl text-gray-400 font-bold">LKR </Text>
                {stats.loanAmount.toFixed(2)}
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="mt-2">
              <View className="flex-row justify-between mb-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase">Limit Usage</Text>
                <Text className="text-[10px] text-gray-400 font-bold">
                  {Math.round(calculateLoanPercentage())}% of LKR {stats.loanLimit}
                </Text>
              </View>
              <View className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <View 
                  className={`h-full rounded-full ${calculateLoanPercentage() > 80 ? 'bg-red-500' : 'bg-[#006B3F]'}`} 
                  style={{ width: `${calculateLoanPercentage()}%` }} 
                />
              </View>
            </View>

            {/* Warning if nearing limit */}
            {calculateLoanPercentage() > 80 && (
              <View className="mt-4 bg-red-50 p-3 rounded-xl flex-row items-center">
                <Ionicons name="warning" size={20} color="#EF4444" />
                <Text className="text-xs text-red-600 font-bold ml-2 flex-1">
                  You are nearing your credit limit. Please settle payments.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* --- INFO CARD (Everyone EXCEPT Interns) --- */}
        {/* Updated: Check if role is NOT intern */}
        
          <View className="bg-[#006B3F] p-5 rounded-[25px] flex-row items-center shadow-lg shadow-emerald-200">
            <Ionicons name="information-circle" size={30} color="white" />
            <View className="ml-4 flex-1">
              <Text className="text-white font-bold text-sm">Note</Text>
              <Text className="text-emerald-100 text-xs mt-1">
                Missed meals are counted if you booked a meal but did not consume it before the time expired.
              </Text>
              <Text className="text-emerald-100 text-xs mt-1">
                ඔබ ආහාරයක් වෙන් කර ඇති නමුත් නියමිත වේලාවට පෙර භාවිතා නොකළවිට, එය මගහැරුණු ආහාරයක් ලෙස ගණන් කරනු ලැබේ.
              </Text>
              <Text className="text-emerald-100 text-xs mt-1">
                நீங்கள் உணவை முன்பதிவு செய்து, குறிப்பிட்ட நேரத்திற்குள் பயன்படுத்தவில்லை என்றால், அது தவறவிட்ட உணவாகக் கணக்கிடப்படும்.
              </Text>
            </View>
          </View>
       

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}