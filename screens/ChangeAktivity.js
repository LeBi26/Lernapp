import React from "react";
import { Text, View, Alert, TouchableOpacity, ScrollView } from "react-native";
import styles from "./styles.js";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as colors from "../assets/colors.js";
import * as SQLite from "expo-sqlite";
import PrimaryButton from "./components/PrimaryButton.js";
import BackButton from "./components/BackButton.js";
import TextfieldAndLabel from "./components/TextfieldAndLabel.js";
import TextButton from "./components/TextButton.js";
import HeaderIcon from "./components/HeaderIcon.js";
import IconRowWithChange from "./components/IconRowWithChange.js";
const db = SQLite.openDatabase("aktivitys.db");

class AddAktivity extends React.Component {
  constructor(props) {
    super(props);
    const edit = props.route.params.edit;
    this.state = {
      change: false,
      ...this.props.route.params,
      icon: (() => {
        return edit ? props.route.params.icon : "book-outline";
      })(),
      first_icon: (() => {
        return edit ? props.route.params.icon : "book-outline";
      })(),
    };
  }
  componentWillUnmount() {
    this._unsubscribe();
  }
  componentDidMount() {
    this._unsubscribe = this.props.navigation.addListener(
      "focus",
      (payload) => {
        if (
          this.props.route.params &&
          this.props.route.params.icon &&
          this.state.first_icon !== this.props.route.params.icon
        )
          this.setState({ icon: this.props.route.params.icon, change: true });
      }
    );
    const title = this.props.route.params.edit
      ? "Aktvität bearbeiten"
      : "Aktivität hinzufügen";
    this.props.navigation.setOptions({
      title: title,
      headerLeft: () => {
        return (
          <BackButton
            onPress={() => {
              this.confirmQuit();
            }}
          />
        );
      },
    });
    // add trash icon if edit
    if (this.state.edit) {
      this.props.navigation.setOptions({
        headerRight: () => {
          return (
            <HeaderIcon
              name="trash"
              onPress={() => {
                this.confirmDelete();
              }}
            />
          );
        },
      });
    }
  }
  confirmDelete = () => {
    Alert.alert(
      "Delete Aktivity",
      "Möchtest du diese Aktivität wirklich löschen? Das ist ein irreversibler Vorgang.",
      [
        { text: "Nein" },
        {
          text: "Ja",
          onPress: () => {
            db.transaction((tx) => {
              tx.executeSql(
                "UPDATE activities SET deleted=1, version=? WHERE id=?",
                [
                  this.props.route.params.version + 1,
                  this.props.route.params.id,
                ],
                () => {
                  this.props.navigation.navigate("TrackingOverview");
                },
                () => {
                  console.log("Fehler beim Löschen der Aktivität");
                }
              );
            });
          },
        },
      ]
    );
  };
  confirmQuit = () => {
    if (this.state.change && this.state.edit)
      Alert.alert(
        "Abort Changes",
        "Möchtest du wirklich die Veränderungen verwerfen?",
        [
          { text: "Nein" },
          {
            text: "Ja",
            onPress: () => {
              this.props.navigation.goBack();
            },
          },
        ]
      );
    else this.props.navigation.goBack();
  };
  handleSave = () => {
    // decide on the right sql command
    let sql;
    let variables;
    if (!this.state.name) {
      alert("Bitte einen Namen eintragen");
      return;
    }
    if (!this.state.icon) {
      alert("Bitte ein Icon auswählen");
      return;
    }

    if (!this.props.route.params.edit) {
      sql = "INSERT INTO activities (name, icon) VALUES (?, ?) ";
      variables = [this.state.name, this.state.icon];
    } else {
      sql = "UPDATE activities SET name=?, icon=?, version=? WHERE id = ?";
      variables = [
        this.state.name,
        this.state.icon,
        this.state.version + 1,
        this.state.id,
      ];
    }
    // execute the sql
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        variables,
        () => {
          this.props.navigation.navigate(this.props.route.params.targetChange, {
            ...this.state,
          });
        },
        (txObj, error) => {
          console.log(error);
        }
      );
    });
  };
  render() {
    console.log("RENDERING", this.state.change);
    return (
      <ScrollView
        style={styles.mainContainer}
        keyboardShouldPersistTaps="handled"
      >
        <TextfieldAndLabel
          onChangeText={(text) => {
            this.setState({ name: text, change: true });
          }}
          placeholder="Name"
          value={this.state.name}
          label={"Name: "}
          width={"50%"}
        />
        <IconRowWithChange
          icon={this.state.icon}
          onPress={() => {
            if (this.props.route.params.targetChange === "AktivityDetails")
              this.props.navigation.navigate("IconChooserTracking", {
                targetIconChooser: "ChangeAktivity",
              });
            else if (
              this.props.route.params.targetChange === "AktivityChooserGoal"
            )
              this.props.navigation.navigate("IconChooserGoals", {
                targetIconChooser: "ChangeAktivityGoals",
              });
            else if (this.props.route.params.targetChange === "AktivityChooser")
              this.props.navigation.navigate("IconChooserTracking", {
                targetIconChooser: "ChangeAktivity",
              });
            else
              this.props.navigation.navigate("IconChooserTracking", {
                targetIconChooser: "ChangeAktivity",
              });
          }}
        />
        <PrimaryButton
          onPress={() => {
            this.handleSave();
          }}
          text={"Speichern"}
        />
      </ScrollView>
    );
  }
}

export default AddAktivity;
