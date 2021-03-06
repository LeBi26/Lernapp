import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import styles from "../styles.js";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import * as colors from "../../assets/colors.js";

const SmallPrimaryButton = (props) => {
  return (
    <View style={props.style}>
      <TouchableOpacity
        onPress={() => props.onPress()}
        style={[styles.smallPrimaryButton, { backgroundColor: global.color }]}
      >
        {props.icon && (
          <Ionicons
            name={props.icon}
            color={colors.PrimaryTextColor}
            size={30}
          />
        )}
        {props.fontAwesome && (
          <FontAwesome
            name={props.fontAwesome}
            size={30}
            color={colors.PrimaryTextColor}
          />
        )}
        {props.text && (
          <Text style={styles.primaryButtonText}>{props.text}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default SmallPrimaryButton;
