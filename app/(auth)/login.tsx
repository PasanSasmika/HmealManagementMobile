import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { loginUser } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

const handleLogin = async () => {
  setErrorMessage(null);
  if (!username || !mobileNumber) {
    setErrorMessage('Please fill all fields');
    return;
  }
  setLoading(true);

  try {
    const data = await loginUser(username, mobileNumber);
    // 1. Save to Zustand
    setAuth(data.token, data.user);
    
    // 2. Manual Redirect Backup
    router.replace('/(tabs)');
    
  } catch (err: any) {
    setErrorMessage(err);
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6]">
      {/* 1. KeyboardAvoidingView moves the UI up when keyboard appears */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* 2. ScrollView allows manual scrolling if inputs are still hidden */}
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 3. TouchableWithoutFeedback closes the keyboard when clicking outside inputs */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center px-6 py-10">
              
              <View className="items-center mb-8">
                <View className="bg-[#D1F7E6] p-5 rounded-full mb-4">
                  <MaterialCommunityIcons name="account-circle-outline" size={80} color="#006B3F" />
                </View>
                <Text className="text-3xl font-bold text-[#006B3F]">Welcome Back</Text>
                <Text className="text-xl font-semibold text-[#006B3F]">සාදරයෙන් පිළිගනිමු</Text>
                <Text className="text-xl font-semibold text-[#006B3F]">நல்வரவு</Text>
              </View>

              <View className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-50">
                {/* Better Error Handling Display */}
                {errorMessage && (
                  <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
                    <Text className="text-red-600 text-center font-medium">{errorMessage}</Text>
                  </View>
                )}

                <Text className="text-[#006B3F] font-medium mb-2">Username / පරිශීලක නාමය / பயனர் பெயர்</Text>
                <View className="flex-row items-center border border-gray-200 rounded-2xl px-4 py-3 mb-4">
                  <Feather name="user" size={20} color="#006B3F" />
                  <TextInput 
                    className="flex-1 ml-3 text-lg" 
                    placeholder="Enter Username..." 
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>

                <Text className="text-[#006B3F] font-medium mb-2">Mobile Number / ජංගම අංකය / கைபேසි எண்</Text>
                <View className="flex-row items-center border border-gray-200 rounded-2xl px-4 py-3 mb-6">
                  <Feather name="smartphone" size={20} color="#006B3F" />
                  <TextInput 
                    className="flex-1 ml-3 text-lg" 
                    placeholder="07X XXXXXXX" 
                    keyboardType="phone-pad"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    maxLength={10}
                  />
                </View>

                <TouchableOpacity 
                  onPress={handleLogin}
                  disabled={loading}
                  className={`bg-[#006B3F] py-4 rounded-2xl flex-row justify-center items-center ${loading ? 'opacity-70' : ''}`}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-lg font-bold">Login / ඇතුළු වන්න / உள்நுழைக ➜</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              <Text className="text-center text-gray-400 mt-8">Meal Management System V1.0</Text>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}