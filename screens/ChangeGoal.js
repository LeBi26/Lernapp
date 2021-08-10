import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import styles from "./styles.js";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as colors from "../assets/colors.js";
import { Picker } from "@react-native-picker/picker";

import * as SQLite from "expo-sqlite";
import PrimaryButton from "./components/PrimaryButton.js";
import BackButton from "./components/BackButton.js";
import TextfieldAndLabel from "./components/TextfieldAndLabel.js";
import Textfield from "./components/Textfield.js";
import TextButton from "./components/TextButton.js";
const db = SQLite.openDatabase("goals.db");
const habits = SQLite.openDatabase("habits.db");
const tracking = SQLite.openDatabase("aktivitys.db");
class ChangeGoal extends React.Component {
  constructor(props) {
    super(props);
    const edit = props.route.params.edit;
    this.state = {
      change: false,
      aktivity_icon: "",
      aktivity_name: "",
      addToTracking: false,
      addToHabits: false,
      time: 0,
      icon: (() => {
        return edit ? props.route.params.icon : "book-outline";
      })(),
      intervall: (() => {
        if (edit) return props.route.params.intervall;
        else return 1;
      })(),
      priority: (() => {
        if (edit) return props.route.params.priority;
        else return 1;
      })(),
      ...props.route.params,
      time: (() => {
        return this.props.route.params && this.props.route.params.time
          ? true
          : false;
      })(),
      zIndex: {},
      zIndex2: (() => {
        if (Platform.OS === "ios") return { zIndex: 2 };
        else return {};
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
        if (this.props.route.params && this.props.route.params.changeIcon)
          this.setState({ icon: this.props.route.params.icon, change: true });
        if (this.props.route.params && this.props.route.params.aktivity)
          this.setState({
            aktivity_icon: this.props.route.params.aktivity.icon,
            aktivity_name: this.props.route.params.aktivity.name,
            act_id: this.props.route.params.aktivity.id,
            change: true,
          });
      }
    );
    this.props.navigation.setOptions({
      headerLeft: () => {
        return (
          <BackButton
            onPress={() => {
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
            }}
          />
        );
      },
    });
  }
  handleSave = () => {
    if (!this.state.name) {
      alert("Bitte einen Namen eintragen");
      return;
    }
    if (!this.state.priority) {
      alert("Bitte eine Priorität auswählen");
      return;
    }
    if (!this.state.intervall) {
      alert("Bitte ein Intervall auswählen");
      return;
    }
    if (!this.state.repetitions) {
      alert("Bitte eine Ziel-Zahl eintragen");
      return;
    }
    if (!this.state.icon) {
      alert("Bitte ein Icon auswählen");
      return;
    }
    if (this.state.time && !this.state.act_id) {
      alert("Bitte eine Aktivität ausfüllen");
      return;
    }
    if (!this.state.progress && !this.state.time) {
      alert("Bitte einen Fortschritt eintragen");
      return;
    }

    if (this.state.addToHabits) {
      habits.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO habits (name, priority, intervall, repetitions, icon, queue) VALUES (?, ?, ?, ?, ?, ?)",
          [
            this.state.name,
            this.state.priority,
            this.state.intervall,
            parseInt(this.state.repetitions),
            this.state.icon,
            false,
          ],
          () => {},
          (txObj, error) => {
            console.log(error);
          }
        );
      });
    }
    if (this.state.addToTracking) {
      tracking.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO activities (name, icon) VALUES (?, ?) ",
          [this.state.name, this.state.icon],
          () => {},
          (txObj, error) => {
            console.log(error);
          }
        );
      });
    }
    // decide on the right sql command
    let sql;
    if (!this.state.edit) {
      sql =
        "INSERT INTO goals (name, intervall, priority, repetitions, icon, progress, time, act_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ";
    } else {
      sql =
        "UPDATE goals SET name=?, intervall=?, priority=?, repetitions=?, icon=?, progress=?, time=? , act_id = ?, version=? WHERE id = ?";
    }
    // execute the sql
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        [
          this.state.name,
          this.state.intervall,
          this.state.priority,
          this.state.repetitions,
          this.state.icon,
          this.state.progress,
          this.state.time,
          this.state.act_id,
          this.state.version + 1,
          this.state.id,
        ],
        () => {
          if (this.state.edit)
            this.props.navigation.navigate("GoalsDetails", { ...this.state });
          else this.props.navigation.goBack();
        },
        (txObj, error) => {
          console.log(error);
        }
      );
    });
  };
  zIndex3 = (() => {
    if (Platform.OS === "ios") return { zIndex: 3 };
    else return {};
  })();
  height = (() => {
    if (Platform.OS === "ios") return { width: "50%", alignSelf: "center" };
    else return { height: 40 };
  })();
  intervall = ["Tag", "Woche", "Monat"];

  render() {
    return (
      <ScrollView style={styles.margin} keyboardShouldPersistTaps="handled">
        <TextfieldAndLabel
          onChangeText={(text) => {
            this.setState({ name: text, change: true });
          }}
          placeholder="Name"
          value={this.state.name}
          label={"Name: "}
          width={"50%"}
        />

        <View style={[styles.containerHorizontal]}>
          <Text style={[styles.secondaryText, styles.margin]}>Icon: </Text>
          <Ionicons
            name={this.state.icon}
            size={25}
            color={global.color}
            style={[styles.margin, styles.padding]}
          />
          <TextButton
            text="Wähle Icon"
            onPress={() => {
              this.props.navigation.navigate("IconChooserGoals", {
                target: "ChangeGoal",
              });
            }}
          />
        </View>

        <View style={[styles.containerHorizontal]}>
          <Text style={styles.secondaryText}>Intervall: </Text>
          <Text style={[styles.normalText, { color: global.color }]}>
            {this.intervall[this.state.intervall - 1]}
          </Text>
        </View>
        <Picker
          style={this.height}
          selectedValue={this.state.intervall}
          onValueChange={(itemValue, itemIndex) =>
            this.setState({ intervall: itemValue })
          }
        >
          <Picker.Item label="Tag" value="1" />
          <Picker.Item label="Woche" value="2" />
          <Picker.Item label="Monat" value="3" />
        </Picker>

        <View style={[styles.containerHorizontal]}>
          <Text style={styles.secondaryText}>Priorität: </Text>
          <Text style={[styles.normalText, { color: global.color }]}>
            {this.state.priority}
          </Text>
        </View>

        <Picker
          style={this.height}
          selectedValue={this.state.priority}
          onValueChange={(itemValue, itemIndex) =>
            this.setState({ priority: itemValue })
          }
        >
          <Picker.Item label="Priorität 1" value="1" />
          <Picker.Item label="Priorität 2" value="2" />
          <Picker.Item label="Priorität 3" value="3" />
          <Picker.Item label="Priorität 4" value="4" />
        </Picker>

        <View style={{ zIndex: -3 }}>
          <View style={styles.containerHorizontal}>
            <Switch
              style={styles.margin}
              value={this.state.time}
              onValueChange={() => {
                this.setState((prevState) => {
                  return {
                    time: !prevState.time,
                    change: true,
                  };
                });
              }}
            ></Switch>
            <Text style={styles.secondaryText}>Zeitziel</Text>
          </View>
        </View>
        {this.state.time && (
          <View>
            <TextfieldAndLabel
              placeholder="12 h"
              value={this.state.repetitions ? this.state.repetitions + "" : ""}
              onChangeText={(text) => {
                if (+text || text === "")
                  this.setState({ repetitions: text, change: true });
              }}
              keyboardType="numeric"
              width="50%"
              label="Dauer in Std.: "
            />
            <View style={styles.containerHorizontal}>
              <Text style={[styles.secondaryText, styles.margin]}>
                Aktivity:{" "}
              </Text>
              <Ionicons
                name={this.state.aktivity_icon}
                size={25}
                color={colors.PrimaryAccentColor}
                style={[styles.margin, styles.padding]}
              />
              <Text>{this.state.aktivity_name}</Text>
              <TextButton
                text="Wähle Aktivität"
                onPress={() => {
                  this.props.navigation.navigate("AktivityChooserGoal", {
                    target: "ChangeGoal",
                  });
                }}
              />
            </View>
          </View>
        )}
        {!this.state.time && (
          <View
            style={[styles.containerHorizontal, styles.center, { zIndex: -1 }]}
          >
            <Textfield
              placeholder="6"
              value={
                this.state.progress || this.state.progress === "0"
                  ? this.state.progress + ""
                  : ""
              }
              onChangeText={(text) => {
                if (+text || text === "" || text === "0")
                  this.setState({ progress: text, change: true });
              }}
              keyboardType="numeric"
              width="20%"
              textAlign="center"
            />
            <Text style={[styles.secondaryText, styles.margin]}>von</Text>
            <Textfield
              placeholder="12"
              value={this.state.repetitions ? this.state.repetitions + "" : ""}
              onChangeText={(text) => {
                if (+text || text === "")
                  this.setState({ repetitions: text, change: true });
              }}
              keyboardType="numeric"
              width="20%"
              textAlign="center"
            />
          </View>
        )}
        {!this.state.edit && (
          <View style={{ zIndex: -3 }}>
            <View style={styles.containerHorizontal}>
              <Switch
                style={styles.margin}
                value={this.state.addToHabits}
                onValueChange={() => {
                  this.setState((prevState) => {
                    return {
                      addToHabits: !prevState.addToHabits,
                    };
                  });
                }}
              ></Switch>
              <Text style={styles.secondaryText}>
                Zu Gewohnheiten hinzufügen
              </Text>
            </View>
            <View style={styles.containerHorizontal}>
              <Switch
                style={styles.margin}
                value={this.state.addToTracking}
                onValueChange={() => {
                  this.setState((prevState) => {
                    return {
                      addToTracking: !prevState.addToTracking,
                    };
                  });
                }}
              ></Switch>
              <Text style={styles.secondaryText}>Zu Aktvitäten hinzufügen</Text>
            </View>
          </View>
        )}
        <PrimaryButton
          text={"Speichern"}
          onPress={() => {
            this.handleSave();
          }}
        />
      </ScrollView>
    );
  }
}

export default ChangeGoal;