import React from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import * as SQLite from "expo-sqlite";

import Habit from "./Habit.js";
import Divider from "./Divider.js";

const db = SQLite.openDatabase("habits.db");

export default class HabitOverview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      habits: null,
    };
    // create a table for the habits if not existing already
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE habits (id INTEGER PRIMARY KEY, name TEXT, fullfilledToday INTEGER);"
      );
    });
    // create table for the habits fullfilling
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE checkHabits (id INTEGER PRIMARY KEY, habit_id INTEGER, date TEXT, FOREIGN KEY(habit_id) REFERENCES habits(id));"
      );
    });

    // get the habits from the database
    this.fetchData();
  }

  componentDidUpdate() {
    this.fetchData();
  }

  componentDidMount() {
    this.props.navigation.addListener("focus", (payload) => {
      this.forceUpdate();
    });
    this.props.navigation.setOptions({
      headerRight: () => (
        <TouchableHighlight
          underlayColor="#ffffff"
          onPress={() =>
            this.props.navigation.navigate("AddHabit", {
              addHabit: this.addHabit,
            })
          }
        >
          <Ionicons name="add" size={25} />
        </TouchableHighlight>
      ),
    });
  }

  // compares two arrays for equality
  compareArrays(first, snd) {
    if (!first && !snd) return true;
    if (!first) return false;
    if (!snd) return false;
    // check for same length
    if (first.length != snd.length) return false;
    // iterate over the array and compare the objects
    for (let i = 0; i < first.length; i++) {
      if (typeof first[i] === "object") {
        if (!this.compareObjects(first[i], snd[i])) return false;
      } else if (!(first[i] === snd[i])) {
        return false;
      }
    }

    // if reached here arrays are equal
    return true;
  }

  // compares two objects for equality
  compareObjects(first, snd) {
    if (!first && !snd) return true;
    if (!first) return false;
    if (!snd) return false;
    // get the keys out of the objects
    const keys = Object.keys(first);
    // make sure the keys are equal
    if (!this.compareArrays(keys, Object.keys(snd))) return false;

    // iterate over the keys
    for (let i = 0; i < keys.length; i++) {
      if (typeof first[keys[i]] === "object") {
        if (!this.compareArrays(first[keys[i]], snd[keys[i]])) return false;
      } else if (!(first[keys[i]] === snd[keys[i]])) return false;
    }

    return true;
  }

  // gets the data for the habits out of the database
  fetchData = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM habits;",
        null,
        (txObj, { rows: { _array } }) => {
          if (!this.compareHabits(this.state.habits, _array))
            this.setState({ habits: _array });
        },
        () => console.error("Fehler beim Lesen der Gewohnheiten. ")
      );
    });
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM checkHabits WHERE date = date('now');",
        null,
        (txObj, results) => {
          this.addChecksToState(results);
        }
      );
    });
  };

  compareHabits = (first, snd) => {
    if (!first && !snd) return true;
    if (!first) return false;
    if (!snd) return false;
    if (first.length != snd.length) return false;
    // compare the names
    for (let i = 0; i < first.length; i++) {
      if (!(first[i].name === snd[i].name)) return false;
    }
    return true;
  };

  // expects to get only the checked Habits for today
  addChecksToState = ({ rows: { _array } }) => {
    let newState = this.state;
    for (let i = 0; i < _array.length; i++) {
      // get the index of the habit in the state
      const index = this.state.habits.findIndex(
        (ele) => ele.id === _array[i].habit_id
      );
      if (index && newState.habits[index]) {
        newState.habits[index].fullfilled = true;
      }
    }
    if (!this.compareArrays(this.state.habits, newState.habits))
      this.setState({ ...newState });
  };

  handleFullfilled = (habit) => {
    const index = this.state.habits.findIndex((ele) => ele === habit);
    const id = this.state.habits[index].id;
    console.log("working");
    // insert the entry into check habits
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO checkHabits (habit_id, date) VALUES (?, date('now'))",
        [id]
      );
    });
    this.setState((prevState) => {
      prevState.habits[index].fullfilled = true;
      return { habits: [...prevState.habits] };
    });
  };

  // renders an habit entry in the flat list
  renderItem = (obj) => {
    return (
      <Habit
        habit={obj.item}
        handleFullfilled={this.handleFullfilled}
        navigation={this.props.navigation}
      />
    );
  };

  render() {
    return (
      <View style={[styles.margin, styles.flex]}>
        <Divider></Divider>
        <FlatList
          data={this.state.habits}
          renderItem={this.renderItem}
          keyExtractor={(item) => String(item.id)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

/* Reseting the db for testing: 

db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM habits",
        null,
        () => {
          console.log("Deleted");
        },
        (txObj, error) => {
          console.log("Fehler: ");
          console.log(error);
        }
      );
    });


// Insert some data: 
// insert some data for testing
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO habits (name) VALUES (?);",
        ["Lesen"],
        (txObj, resultSet) => {
          console.log("Success");
        },
        (txObj, err) => {
          console.err(err);
        }
      );
    });

    */
