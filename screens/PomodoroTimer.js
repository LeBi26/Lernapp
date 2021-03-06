import React from "react";
import { Text, View, Vibration } from "react-native";
import styles from "./styles.js";
import * as SQLite from "expo-sqlite";
import PrimaryButton from "./components/PrimaryButton.js";
import TextButton from "./components/TextButton.js";
import HeaderIcon from "./components/HeaderIcon.js";
import LoadingScreen from "./components/LoadingScreen.js";
import * as colors from "./../assets/colors.js";

const db = SQLite.openDatabase("pomodoro.db");

const WORK = "working";
const BREAK = "break";
const PAUSE = "pause";
const RUNNING = "running";

class PomodoroTimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      interval: WORK,
      state: PAUSE,
      data_loaded: false,
    };
    // create the table for the settings and insert the standard information.
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE pomodoroSettings (id INTEGER PRIMARY KEY, workingInterval INT, breakInterval INT, longBreakAfter INT);",
        null,
        () => {
          // if successful (therfore first time creating the db, insert the data)
          db.transaction((tx) => {
            tx.executeSql(
              "INSERT INTO pomodoroSettings (id, workingInterval, breakInterval, longBreakAfter) VALUES (0, 50, 10, 99)",
              null,
              () => {
                this.fetchData();
              },
              () => {}
            );
          });
        },
        (txObj, error) => {}
      );
    });
    // insert the settings from the db
    this.fetchData();
  }
  componentWillUnmount() {
    this._unsubscribe();
  }

  // fetches the settings from the db
  fetchData = (refresh) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM pomodoroSettings ORDER BY id LIMIT 1",
        null,
        (txObj, { rows: { _array } }) => {
          if (_array.length !== 0) {
            const time =
              this.state.data_loaded && !refresh
                ? this.state.time
                : _array[0].workingInterval * 60;
            this.setState({
              ..._array[0],
              time: time,
              data_loaded: true,
            });
          }
        },
        () => console.error("Fehler beim Lesen der Settings. ")
      );
    });
  };

  componentDidMount() {
    this._unsubscribe = this.props.navigation.addListener(
      "focus",
      (payload) => {
        if (this.state.data_loaded) this.fetchData(true);
      }
    );
    this.props.navigation.setOptions({
      title: "Pomodoro Timer",
      headerRight: () => (
        <View style={styles.container}>
          <HeaderIcon
            name="settings"
            onPress={() => this.props.navigation.navigate("PomodoroSettings")}
          />
        </View>
      ),
    });
  }
  resetAndChange = () => {
    if (this.state.interval === WORK)
      this.setState({
        time: this.state.breakInterval * 60,
        interval: BREAK,
      });
    else
      this.setState({
        time: this.state.workingInterval * 60,
        interval: WORK,
      });
  };
  render() {
    if (this.state.data_loaded) {
      return (
        <View style={[styles.mainContainer, styles.flexContainer]}>
          <Text
            style={[styles.pomTimer, styles.center, { color: global.color }]}
          >
            {Math.floor(this.state.time / 60) +
              ":" +
              (this.state.time % 60 < 10
                ? "0" + (this.state.time % 60)
                : this.state.time % 60)}
          </Text>
          <View style={styles.pomAnimationContainer}>
            <View style={styles.pomAnimationBackground}>
              <View
                style={[
                  styles.pomAnimationBar,
                  {
                    width: `${
                      100 -
                      (this.state.time /
                        (this.state.interval === WORK
                          ? this.state.workingInterval * 60
                          : this.state.breakInterval * 60)) *
                        100
                    }%`,
                    backgroundColor: global.color,
                  },
                ]}
              ></View>
            </View>
          </View>

          <PrimaryButton
            text={this.state.state === PAUSE ? "Starten" : "Unterbrechen"}
            onPress={() => {
              if (this.state.state === PAUSE) {
                this.setState((prevState) => ({ time: prevState.time - 1 }));
                this._timer = setInterval(() => {
                  if (this.state.time === 0) {
                    Vibration.vibrate(3000);
                    this.resetAndChange();
                  }
                  this.setState((prevState) => ({ time: prevState.time - 1 }));
                }, 1000);
                this.setState({ state: RUNNING });
              } else {
                clearInterval(this._timer);
                this.setState({ state: PAUSE });
              }
            }}
          />
          <PrimaryButton
            text={"Reset"}
            onPress={() => {
              if (this.state.interval === WORK)
                this.setState({ time: this.state.workingInterval * 60 });
              else this.setState({ time: this.state.breakInterval * 60 });
            }}
          />
          <TextButton
            style={{ alignSelf: "center", justifySelf: "center" }}
            text={
              this.state.interval === WORK
                ? "Zu Pausenintervall wechseln"
                : "Zu Arbeitsintervall wechseln"
            }
            onPress={() => {
              this.resetAndChange();
            }}
          />
        </View>
      );
    } else return <LoadingScreen />;
  }
}

export default PomodoroTimer;
