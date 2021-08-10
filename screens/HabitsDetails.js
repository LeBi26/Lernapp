import React, { useEffect } from "react";
import { Text, View, TouchableOpacity, ScrollView, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as SQLite from "expo-sqlite";
import styles from "./styles.js";
import * as colors from "../assets/colors.js";
import PrimaryButton from "./components/PrimaryButton.js";
import BackButton from "./components/BackButton.js";
import HeaderIcon from "./components/HeaderIcon.js";

const db = SQLite.openDatabase("habits.db");

class HabitsDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      frequency: this.createFrequencyString(),
      dates: [],
    };
    this.fetchData();
  }

  fetchData = () => {
    console.log("Fetching information for details....");
    // get the fullfilled dates out of the db
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM checkHabits WHERE habit_id = ? AND date >= date('now', '-30 days') AND (deleted = 0 OR deleted IS NULL)",
        [this.props.route.params.id],
        (txObj, { rows: { _array } }) => {
          let now = new Date();
          now.setHours(2);
          now.setMinutes(0);
          now.setSeconds(0);
          now.setMilliseconds(0);
          let lastSevenDays = [false, false, false, false, false, false, false];
          let lastThirtyDays = new Array(30);
          for (let i = 0; i < 30; i++) lastThirtyDays[i] = false;
          const new_array = _array.map((element) => {
            element.date = new Date(element.date);
            element.since = (now - element.date) / 1000 / 86400;
            if (element.since <= 6) lastSevenDays[element.since] = true;
            if (element.since <= 29) lastThirtyDays[element.since] = true;
            return element;
          });
          this.setState({
            dates: new_array,
            lastSevenDays: lastSevenDays,
            now: now,
            lastThirtyDays: lastThirtyDays,
          });
        },
        (txObj, error) => {
          console.log(error);
        }
      );
    });
  };
  componentDidMount() {
    // add the button to the top
    this.props.navigation.setOptions({
      title: this.props.route.params.name + " Details",
      headerLeft: () => {
        return (
          <BackButton
            onPress={() => {
              this.props.navigation.goBack();
            }}
          />
        );
      },
      headerRight: () => (
        <View style={styles.row}>
          <HeaderIcon
            name="pencil"
            onPress={() => {
              this.props.navigation.navigate("ChangeHabit", {
                ...this.props.route.params,
                edit: true,
              });
            }}
          />
          <HeaderIcon
            name="trash"
            onPress={() => {
              Alert.alert(
                "Delete Habit",
                "Möchtest du die Gewohnheit wirklich löschen? Das ist ein unwiderruflicher Vorgang.",
                [
                  { text: "Nein" },
                  {
                    text: "Ja",
                    onPress: () => {
                      db.transaction((tx) => {
                        tx.executeSql(
                          "UPDATE habits SET deleted = 1, version = ? WHERE id=?",
                          [
                            this.props.route.params.version + 2,
                            this.props.route.params.id,
                          ],
                          () => {},
                          null
                        );
                      });
                      db.transaction((tx) => {
                        tx.executeSql(
                          "UPDATE checkHabits SET deleted = 1, version = 1 WHERE habit_id=?",
                          [this.props.route.params.id],
                          () => {
                            this.props.navigation.goBack();
                          },
                          (txObj, error) => {
                            console.log(error);
                          }
                        );
                      });
                    },
                  },
                ]
              );
            }}
          />
        </View>
      ),
    });
  }

  // changes the state of the queue boolean in the db to the given value
  changeQueueState = (value) => {
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE habits SET queue=?, version=? WHERE id=?",
        [
          value,
          this.props.route.params.version + 1,
          this.props.route.params.id,
        ],
        (txObj, resultSet) => {
          if (!value) this.props.navigation.navigate("HabitOverview");
          else this.props.navigation.navigate("HabitsQueue");
        },
        (txObj, error) => {
          console.log(error);
        }
      );
    });
  };

  createFrequencyString = () => {
    let interval = "Monat";
    const interval_number = this.props.route.params.intervall;
    if (interval_number === 1) interval = "Tag";
    else if (interval_number === 2) interval = "Woche";
    else if (interval_number === 3) inverval = "Monat";
    const result = this.props.route.params.repetitions + " Mal pro " + interval;
    return result;
  };
  calculateDate = (index) => {
    const time = this.state.now - 1000 * 86400 * index;
    const date = new Date(time);
    return date.getDate() + "." + (date.getMonth() + 1);
  };
  addCheck = (index, bool) => {
    if (!bool) {
      Alert.alert(
        "Nachtragen",
        "Möchtest du wirklich die Gewohnheit nachtragen?",
        [
          {
            text: "Ja",
            onPress: () => {
              const sql = `INSERT INTO checkHabits (habit_id, date) VALUES (?, date('now', '-${index} day'))`;
              console.log(sql);
              db.transaction((tx) => {
                tx.executeSql(
                  sql,
                  [this.props.route.params.id],
                  (txObj, result) => {},
                  (txObj, error) => {
                    console.log(error);
                  }
                );
              });
              this.fetchData();
            },
          },
          {
            text: "Nein",
          },
        ]
      );
    } else {
      Alert.alert(
        "Löschen",
        "Möchtest du wirklich den Eintrag der Gewohnheit löschen?",
        [
          {
            text: "Ja",
            onPress: () => {
              const sql = `UPDATE checkHabits SET deleted = 1, version=? WHERE habit_id = ? AND date = date('now', '-${index} day')`;
              console.log(sql);
              db.transaction((tx) => {
                tx.executeSql(
                  sql,
                  [
                    this.props.route.params.version + 1,
                    this.props.route.params.id,
                  ],
                  (txObj, result) => {},
                  (txObj, error) => {
                    console.log(error);
                  }
                );
              });
              this.fetchData();
            },
          },
          {
            text: "Nein",
          },
        ]
      );
    }
  };
  render() {
    const changeQueueState = this.changeQueueState;
    return (
      <ScrollView style={styles.margin}>
        <View style={styles.containerHorizontal}>
          <Text style={[styles.secondaryText, styles.columnSize]}>Name: </Text>
          <Text
            style={[{ color: global.color }, styles.textBig, styles.margin]}
          >
            {this.props.route.params.name}
          </Text>
        </View>
        <View style={styles.containerHorizontal}>
          <Text style={[styles.secondaryText, styles.columnSize]}>
            Priorität:{" "}
          </Text>
          <Text
            style={[{ color: global.color }, styles.textBig, styles.margin]}
          >
            {this.props.route.params.priority}
          </Text>
        </View>
        <View style={styles.containerHorizontal}>
          <Text style={[styles.secondaryText, styles.columnSize]}>
            Häufigkeit:{" "}
          </Text>
          <Text
            style={[{ color: global.color }, styles.textBig, styles.margin]}
          >
            {this.props.route.params.repetitions +
              " Mal in " +
              this.props.route.params.intervall +
              " Tagen"}
          </Text>
        </View>
        <View style={styles.containerHorizontal}>
          <Text style={[styles.secondaryText, styles.columnSize]}>Score: </Text>
          <Text
            style={[{ color: global.color }, styles.textBig, styles.margin]}
          >
            {Math.round(this.props.route.params.score * 100) + " %"}
          </Text>
        </View>
        <Text style={styles.secondaryText}>Letzten 7 Tage:</Text>
        <View style={styles.containerHorizontalStats}>
          {this.state.lastSevenDays &&
            this.state.lastSevenDays.map((bool, index) => {
              const name = bool ? "checkmark-circle" : "close-circle";
              const color = bool ? global.color : colors.SecondaryTextColor;
              return (
                <View key={index + 1000}>
                  <TouchableOpacity
                    onLongPress={() => {
                      this.addCheck(index, bool);
                    }}
                  >
                    <Ionicons name={name} size={50} color={color} />
                  </TouchableOpacity>
                  <Text style={[styles.secondaryText, styles.textVerySmall]}>
                    {this.calculateDate(index)}
                  </Text>
                </View>
              );
            })}
        </View>
        <Text style={styles.secondaryText}>Letzten 30 Tage:</Text>
        <View
          style={[
            styles.containerHorizontalStats,
            { display: "flex", flexWrap: "wrap" },
          ]}
        >
          {this.state.lastThirtyDays &&
            this.state.lastThirtyDays.map((bool, index) => {
              const name = bool ? "checkmark-circle" : "close-circle";
              const color = bool ? global.color : colors.SecondaryTextColor;
              return (
                <View key={index + 1000}>
                  <TouchableOpacity
                    onLongPress={() => {
                      this.addCheck(index, bool);
                    }}
                  >
                    <Ionicons name={name} size={50} color={color} />
                  </TouchableOpacity>
                  <Text style={[styles.secondaryText, styles.textVerySmall]}>
                    {this.calculateDate(index)}
                  </Text>
                </View>
              );
            })}
        </View>
        <PrimaryButton
          text={this.props.route.params.queue ? "To Habits" : "To Queue"}
          onPress={() => {
            this.props.route.params.queue
              ? changeQueueState(0)
              : changeQueueState(1);
          }}
        />
      </ScrollView>
    );
  }
}

export default HabitsDetails;