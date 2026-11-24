import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import styles from "../styles/globalStyles";
import { API_BASE, API_PLATFORM_HEADER } from "../../config/api";
import { showToast } from "../utils/notifications";
import { getClientHardwareUuid } from "./deviceId";
import { getSignupIntegrityProof } from "../utils/signupIntegrity";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      showToast("error", "Please fill in all fields");
      return;
    }
    if (!acceptedTerms) {
      showToast("error", "Accept the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setLoading(true);
      const clientHardwareUuid = await getClientHardwareUuid();
      const integrityProof = await getSignupIntegrityProof();

      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...API_PLATFORM_HEADER,
        },
        body: JSON.stringify({
          name: email.split("@")[0],
          email,
          password,
          termsAccepted: true,
          ageConfirmed: true,
          clientHardwareUuid,
          ...integrityProof,
        }),
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        showToast("success", "Registration Successful");
        navigation.replace("Login");
      } else {
        showToast("error", data.message || "Registration Failed");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <CustomInput placeholder="Email" value={email} onChangeText={setEmail} />

      <CustomInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={() => setAcceptedTerms((current) => !current)}
        style={{ flexDirection: "row", alignItems: "center", marginVertical: 12 }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderWidth: 1,
            borderRadius: 4,
            borderColor: "#71717a",
            marginRight: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: acceptedTerms ? "#ef4444" : "transparent",
          }}
        >
          {acceptedTerms && <Text style={{ color: "#fff" }}>✓</Text>}
        </View>
        <Text style={{ color: "#d4d4d8", flex: 1 }}>
          I am 18 or older and agree to the Terms of Service and Privacy Policy.
        </Text>
      </TouchableOpacity>

      <CustomButton
        title={loading ? "Registering..." : "Register"}
        onPress={handleRegister}
      />

      <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
        Already have an account? Login
      </Text>
    </View>
  );
}
