import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export function TextField({
  value,
  onChangeText,
  placeholder,
  editable = true,
  autoCapitalize = "none",
  multiline = false,
  leftIcon,
  rightIcon,
  onRightPress,
  maxLength,
  returnKeyType = "default",
  onSubmitEditing
}) {
  return (
    <View style={[styles.wrap, multiline && { minHeight: 46 }]}>
      {!!leftIcon && <Ionicons name={leftIcon} size={17} color="rgba(233,237,241,0.65)" style={styles.leftIcon} />}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={"rgba(233,237,241,0.35)"}
        editable={editable}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          leftIcon && styles.inputWithLeftIcon,
          rightIcon && styles.inputWithRightIcon,
          multiline && { minHeight: 46, paddingTop: 12, paddingBottom: 12 }
        ]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />

      {!!rightIcon && (
        <Pressable style={styles.rightAction} onPress={onRightPress} disabled={!onRightPress}>
          <Ionicons name={rightIcon} size={17} color="rgba(233,237,241,0.78)" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "rgba(109, 156, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(199, 220, 255, 0.18)",
    justifyContent: "center"
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14
  },
  inputWithLeftIcon: { paddingLeft: 38 },
  inputWithRightIcon: { paddingRight: 38 },
  leftIcon: {
    position: "absolute",
    left: 12
  },
  rightAction: {
    position: "absolute",
    right: 10,
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)"
  }
});
