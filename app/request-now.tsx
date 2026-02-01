import {
  getTodayMeals,
  requestMealAction,
  verifyMealOTP,
} from "@/services/api";
import { socket } from "@/services/socket";
import { useAuthStore } from "@/store/useAuthStore";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MEAL_CONFIG = [
  {
    id: "breakfast",
    title: "BREAKFAST",
    sin: "උදේ ආහාරය",
    tam: "காலை உணவு",
    start: 6,
    end: 11,
  },
  {
    id: "lunch",
    title: "LUNCH",
    sin: "දවල් ආහාරය",
    tam: "மதிய உணவு",
    start: 12,
    end: 24,
  },
  {
    id: "dinner",
    title: "DINNER",
    sin: "රාත්‍රී ආහාරය",
    tam: "இரவு உணவு",
    start: 18,
    end: 24,
  },
];

export default function RequestNowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  const [isOtpView, setIsOtpView] = useState(false);
  const [isWaitingForIssue, setIsWaitingForIssue] = useState(false);
  const [isMealIssued, setIsMealIssued] = useState(false);

  const [receivedOtp, setReceivedOtp] = useState<string>("");
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  const [triggerReset, setTriggerReset] = useState(false);

  const resetScreenState = useCallback(() => {
    setSelectedMeal(null);
    setRequestLoading(false);
    setIsOtpView(false);
    setIsWaitingForIssue(false);           // ← important: force clear waiting
    setIsMealIssued(false);
    setReceivedOtp("");
    setEnteredOtp("");
    setCurrentBookingId(null);
    setTodayBookings([]);
  }, []);

  useEffect(() => {
    const fetchMeals = async () => {
      if (!token) {
        console.warn("No token → skipping fetch");
        Alert.alert("Authentication Error", "Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getTodayMeals(token);

        const bookings = res?.data || [];
        setTodayBookings(bookings);

        // FIXED: only waiting if paymentType exists AND status is NOT served AND NOT booked
        const hasPending = bookings.some(
          (b: any) =>
            b?.paymentType &&
            b?.status !== "served" &&
            b?.status !== "booked"
        );
        setIsWaitingForIssue(hasPending);
      } catch (err: any) {
        console.error("fetchMeals error:", err);
        Alert.alert("Error", "Could not load meal status.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();

    if (!socket.connected) socket.connect();
    if (user?.id) socket.emit("join", user.id);

    const onMealAccepted = (data: any) => {
      setRequestLoading(false);
      setReceivedOtp(data?.otp || "");
      setIsOtpView(true);
    };

    const onMealRejected = (data: any) => {
      setRequestLoading(false);
      Alert.alert("Request Rejected", data?.message || "Request denied.");
      setTriggerReset(true);
    };

    const onMealIssued = () => {
      setIsWaitingForIssue(false);
      setIsMealIssued(true);
    };

    const onMealIssueRejected = (data: any) => {
      setIsWaitingForIssue(false);
      Alert.alert(
        "Issue Rejected",
        data?.message || "Meal issue rejected. You can request again."
      );
      setTriggerReset(true);
    };

    socket.on("meal_accepted", onMealAccepted);
    socket.on("meal_rejected", onMealRejected);
    socket.on("meal_issued", onMealIssued);
    socket.on("meal_issue_rejected", onMealIssueRejected);

    return () => {
      socket.off("meal_accepted", onMealAccepted);
      socket.off("meal_rejected", onMealRejected);
      socket.off("meal_issued", onMealIssued);
      socket.off("meal_issue_rejected", onMealIssueRejected);
    };
  }, [token, user?.id]);

  // Reset + navigate on rejection
  useEffect(() => {
    if (!triggerReset) return;

    resetScreenState();
    router.replace("/request-now"); // or "/(tabs)/request-now" if tabs

    setTriggerReset(false);
  }, [triggerReset, router, resetScreenState]);

  useEffect(() => {
    if (params.paymentSuccess === "true") {
      setIsWaitingForIssue(true);
    }
  }, [params.paymentSuccess]);

  const isTimeValid = (mealId: string) => {
    const hour = new Date().getHours();
    const config = MEAL_CONFIG.find((m) => m.id === mealId);
    return config ? hour >= config.start && hour < config.end : false;
  };

  const handleRequest = async () => {
    if (!selectedMeal) return;

    const booking = todayBookings.find((b) => b.mealType === selectedMeal);
    if (!booking) return;

    if (booking.status === "served") {
      Alert.alert("Already Collected", "You have already collected this meal.");
      return;
    }

    // If somehow still in paid state — show waiting
    if (booking.paymentType && booking.status !== "served" && booking.status !== "booked") {
      setIsWaitingForIssue(true);
      return;
    }

    if (booking.verifiedAt) {
      router.push({
        pathname: "/payment",
        params: { bookingId: booking._id, mealType: selectedMeal },
      });
      return;
    }

    if (booking.otp) {
      setCurrentBookingId(booking._id);
      setReceivedOtp(booking.otp);
      setIsOtpView(true);
      return;
    }

    setCurrentBookingId(booking._id);
    setRequestLoading(true);

    try {
      await requestMealAction(selectedMeal, token!);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to request");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSubmitOTP = async () => {
    if (enteredOtp !== receivedOtp) {
      Alert.alert("Invalid Code", "OTP does not match.");
      return;
    }

    setRequestLoading(true);

    try {
      if (currentBookingId) {
        await verifyMealOTP(currentBookingId, enteredOtp, token!);
        router.push({
          pathname: "/payment",
          params: { bookingId: currentBookingId, mealType: selectedMeal },
        });
      }
    } catch (err: any) {
      Alert.alert("Verification Failed", err?.message || "Failed");
    } finally {
      setRequestLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F1FBF6]">
        <ActivityIndicator size="large" color="#006B3F" />
      </View>
    );
  }

  // ── Success (meal issued) ─────────────────────────────────────────
  if (isMealIssued) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <View className="bg-emerald-50 p-10 rounded-full mb-8">
          <MaterialCommunityIcons name="emoticon-happy-outline" size={120} color="#059669" />
        </View>

        <Text className="text-3xl font-black text-[#006B3F] text-center mb-2">
          Meal Issued!
        </Text>
        <Text className="text-xl font-bold text-slate-600 text-center mb-6">
          Enjoy your meal
        </Text>

        <Text className="text-lg font-bold text-slate-500 text-center mb-1">
          ආහාර නිකුත් කරන ලදී
        </Text>
        <Text className="text-sm text-slate-400 text-center mb-6">
          ඔබේ ආහාර වේල රසවිඳින්න
        </Text>

        <Text className="text-lg font-bold text-slate-500 text-center mb-1">
          உணவு வழங்கப்பட்டது
        </Text>
        <Text className="text-sm text-slate-400 text-center mb-10">
          உங்கள் உணவை அனுபவிக்கவும்
        </Text>

        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="bg-[#006B3F] py-4 px-10 rounded-full flex-row items-center"
        >
          <Ionicons name="home" size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-3">Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Waiting for issue ─────────────────────────────────────────────
  if (isWaitingForIssue) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <View className="bg-emerald-50 p-8 rounded-full mb-8">
          <ActivityIndicator size="large" color="#006B3F" />
        </View>

        <Text className="text-2xl font-black text-[#006B3F] text-center mb-4">
          Processing Meal...
        </Text>

        <Text className="text-gray-500 font-bold text-center mb-1">
          ආහාර වේල සූදානම් කරමින් පවතී...
        </Text>
        <Text className="text-gray-400 text-sm text-center mb-8">
          உணவு தயாராகிக்கொண்டிருக்கிறது...
        </Text>

        <View className="bg-orange-50 px-6 py-3 rounded-xl border border-orange-100">
          <Text className="text-orange-600 text-xs font-bold text-center">
            Please wait for the canteen to issue your meal.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Meal Status screen ──────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#F1FBF6] relative">
      <View className="px-6 py-4 flex-row items-center bg-white rounded-b-[30px] z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#006B3F" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-2xl font-black text-[#006B3F]">Meal Status</Text>
          <Text className="text-xs text-gray-400">ආහාර වේලෙහි තත්ත්වය</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-32" showsVerticalScrollIndicator={false}>
        {!isOtpView ? (
          todayBookings.length === 0 ? (
            <View className="mt-20 items-center opacity-60">
              <Feather name="calendar" size={60} color="#006B3F" />
              <Text className="text-lg font-bold text-[#006B3F] mt-6 text-center">
                No bookings found
              </Text>
            </View>
          ) : (
            MEAL_CONFIG.map((meal) => {
              const booking = todayBookings.find((b) => b.mealType === meal.id);
              const isBooked = !!booking;
              const isServed = booking?.status === "served";
              const isPaid = !!booking?.paymentType && booking?.status !== "served" && booking?.status !== "booked";
              const isTime = isTimeValid(meal.id);
              const canRequest = isBooked && isTime && !isServed && !isPaid;
              const isSelected = selectedMeal === meal.id;

              return (
                <TouchableOpacity
                  key={meal.id}
                  disabled={!canRequest}
                  activeOpacity={0.9}
                  onPress={() => setSelectedMeal(meal.id)}
                  className={`mb-4 p-5 rounded-[30px] border-2 flex-row items-center ${
                    !isBooked
                      ? "bg-gray-100 border-gray-100 opacity-50"
                      : !canRequest
                      ? "bg-gray-50 border-gray-100"
                      : isSelected
                      ? "bg-white border-[#006B3F]"
                      : "bg-white border-transparent"
                  }`}
                >
                  <View className={`p-4 rounded-2xl ${canRequest ? "bg-[#F1FBF6]" : "bg-gray-200"}`}>
                    <MaterialCommunityIcons
                      name={
                        isServed
                          ? "check-decagram"
                          : isPaid
                          ? "clock-check-outline"
                          : canRequest
                          ? "silverware-fork-knife"
                          : "lock-outline"
                      }
                      size={28}
                      color={
                        isServed
                          ? "#059669"
                          : isPaid
                          ? "#D97706"
                          : canRequest
                          ? "#006B3F"
                          : "#9ca3af"
                      }
                    />
                  </View>

                  <View className="ml-4 flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className={`text-lg font-black ${canRequest ? "text-slate-800" : "text-slate-400"}`}>
                        {meal.title}
                      </Text>
                      {isBooked && (
                        <View
                          className={`px-2 py-1 rounded-lg ${
                            isServed ? "bg-blue-100" : isPaid ? "bg-orange-100" : "bg-emerald-100"
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              isServed ? "text-blue-700" : isPaid ? "text-orange-700" : "text-emerald-700"
                            }`}
                          >
                            {isServed ? "COMPLETED" : isPaid ? "PAID" : "BOOKED"}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-gray-400 text-xs">
                      {meal.sin} / {meal.tam}
                    </Text>

                    {isBooked && (
                      <View className="mt-2">
                        {isServed ? (
                          <Text className="text-blue-600 text-[10px] font-bold uppercase">
                            Already Collected / දැනටමත් ලබාගෙන ඇත / ஏற்கனவே பெறப்பட்டது
                          </Text>
                        ) : isPaid ? (
                          <Text className="text-orange-500 text-[10px] font-bold uppercase">
                            Waiting for Issue / නිකුත් කරන තෙක් රැඳී සිටින්න / காத்திருக்கிறது
                          </Text>
                        ) : !isTime ? (
                          <Text className="text-orange-400 text-[10px] font-bold uppercase">
                            Time Locked / වේලාව නොවේ
                          </Text>
                        ) : (
                          <Text className="text-[#006B3F] text-[10px] font-bold uppercase">
                            Ready to Request / ලබා ගත හැක
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  {canRequest && (
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        isSelected ? "border-[#006B3F]" : "border-gray-200"
                      }`}
                    >
                      {isSelected && <View className="w-3 h-3 rounded-full bg-[#006B3F]" />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )
        ) : (
          <View className="mt-4">
            <View className="bg-white p-5 rounded-[30px] flex-row items-center border border-gray-100 mb-6">
              <View className="bg-[#F1FBF6] p-4 rounded-2xl">
                <MaterialCommunityIcons name="silverware-fork-knife" size={28} color="#006B3F" />
              </View>
              <View className="ml-4">
                <Text className="text-lg font-black text-slate-800">
                  {selectedMeal?.toUpperCase() || "Meal"}
                </Text>
                <View className="bg-emerald-100 self-start px-2 py-1 rounded-lg mt-1">
                  <Text className="text-emerald-700 text-[10px] font-bold">ACCEPTED</Text>
                </View>
              </View>
            </View>

            <View className="bg-[#FFFBEB] p-8 rounded-[35px] border-2 border-dashed border-amber-300 items-center mb-8">
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={40} color="#D97706" />
              <Text className="text-amber-700 font-bold text-center mt-2 mb-1">
                YOUR OTP / ඔබගේ කේතය
              </Text>
              <Text className="text-6xl font-black text-amber-800 tracking-widest my-2">
                {receivedOtp || "----"}
              </Text>
              <Text className="text-amber-600/60 text-[10px] font-bold">
                Show this to the canteen staff
              </Text>
            </View>

            <Text className="text-[#006B3F] font-bold ml-2 mb-2">
              Type Code Here / කේතය ඇතුළත් කරන්න
            </Text>
            <View className="bg-white p-2 rounded-[20px] border border-gray-200">
              <TextInput
                value={enteredOtp}
                onChangeText={setEnteredOtp}
                keyboardType="numeric"
                maxLength={4}
                placeholder="••••"
                className="text-center text-3xl font-bold text-slate-800 py-4 tracking-[10px]"
                selectionColor="#006B3F"
              />
            </View>
          </View>
        )}

        <View className="h-32" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white p-14 rounded-t-[40px] border-t border-gray-50">
        {!isOtpView ? (
          <TouchableOpacity
            onPress={handleRequest}
            disabled={!selectedMeal || requestLoading}
            className={`py-5 rounded-[25px] flex-row justify-center items-center ${
              !selectedMeal || requestLoading ? "bg-gray-300" : "bg-[#006B3F]"
            }`}
          >
            {requestLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-black text-lg mr-3">
                  {selectedMeal ? `REQUEST ${selectedMeal.toUpperCase()}` : "SELECT A MEAL"}
                </Text>
                {selectedMeal && <Feather name="send" size={20} color="white" />}
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmitOTP}
            disabled={requestLoading}
            className="bg-[#006B3F] py-5 rounded-[25px] flex-row justify-center items-center"
          >
            {requestLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black text-lg">SUBMIT OTP</Text>
            )}
          </TouchableOpacity>
        )}

        <Text className="text-center text-gray-300 text-[10px] mt-3">
          {!isOtpView
            ? "Click to notify the canteen / ආපනශාලාව දැනුවත් කිරීමට ඔබන්න"
            : "Verify code to proceed / ගෙවීම් වෙත යොමු වන්න"}
        </Text>
      </View>
    </SafeAreaView>
  );
}