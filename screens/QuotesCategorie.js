import React, { useState } from "react";
import { View, ImageBackground, Dimensions } from "react-native";
import styles from "./styles.js";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as colors from "../assets/colors.js";
import * as SQLite from "expo-sqlite";
const db = SQLite.openDatabase("favorites.db");
import * as categories from "../assets/categories.js";

import Zitat from "./components/Zitat.js";
import Quotes from "../assets/Quotes.js";
import SmallPrimaryButton from "./components/SmallPrimaryButton.js";
import BackButton from "./components/BackButton.js";
import HeaderIcon from "./components/HeaderIcon.js";
import LoadingScreen from "./components/LoadingScreen.js";

class QuotesCategorie extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0, favorites: [], fetchedData: false, number: 4 };
    this.fetchData();
  }
  setCount = (number) => {
    this.setState(
      { count: number, number: Math.floor(Math.random() * 4) },
      this.favorite
    );
  };
  favorite = () => {
    if (this.props.route.params.categorie === categories.FAVORITES) {
      this.setState({ favorite: true });
      return;
    }
    const id = parseInt(
      Quotes[this.props.route.params.categorie][this.state.count]["key"]
    );
    if (this.state.favorites.find((ele) => ele.id === id)) {
      this.setState({ favorite: true });
    } else {
      this.setState({ favorite: false });
    }
  };
  // gets the data for the goals out of the database
  fetchData = () => {
    const sql =
      this.props.route.params.categorie === categories.FAVORITES
        ? "SELECT * FROM favorites"
        : "SELECT id FROM favorites WHERE categorie = ?";
    const values =
      this.props.route.params.categorie === categories.FAVORITES
        ? null
        : [this.props.route.params.categorie];
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        values,
        (txObj, { rows: { _array } }) => {
          this.setState(
            { favorites: _array, fetchedData: true },
            this.favorite
          );
        },
        (txObj, error) => console.error(error)
      );
    });
  };
  componentDidUpdate() {
    this.setHeaderHeart();
  }
  setHeaderHeart = () => {
    this.props.navigation.setOptions({
      headerRight: () => {
        return (
          <View style={styles.row}>
            <HeaderIcon
              name="heart"
              onPress={() => {
                const categorie = this.props.route.params.categorie;
                const sql = this.state.favorite
                  ? "UPDATE favorites WHERE id=?"
                  : "INSERT INTO favorites (id, categorie) VALUES (?, ?) ";
                const key =
                  this.props.route.params.categorie === categories.FAVORITES
                    ? this.state.favorites[this.state.count].id
                    : Quotes[categorie][this.state.count]["key"];
                const values = this.state.favorite ? [key] : [key, categorie];

                db.transaction((tx) => {
                  tx.executeSql(
                    sql,
                    values,
                    // success
                    async () => {
                      if (
                        this.props.route.params.categorie ===
                        categories.FAVORITES
                      ) {
                        if (this.state.count === 0)
                          this.setCount(this.state.favorites.length - 2);
                        else this.setCount(this.state.count - 1);
                      }
                      this.fetchData();
                    },
                    // error
                    (txObj, error) => {
                      console.log(error);
                    }
                  );
                });
              }}
            />
          </View>
        );
      },
    });
  };
  componentDidMount() {
    this.setHeaderHeart();
    this.props.navigation.setOptions({
      title: this.props.route.params.categorie,
      headerLeft: () => {
        return (
          <BackButton
            onPress={() => {
              this.props.navigation.goBack();
            }}
          />
        );
      },
    });
  }
  getBackgroundImage = () => {
    return require("./../assets/wallpapers/b-4.jpg");
  };
  forward = () => {
    if (this.props.route.params.categorie === categories.FAVORITES) {
      if (this.state.count + 1 === this.state.favorites.length)
        this.setCount(0);
      else this.setCount(this.state.count + 1);
    } else {
      if (
        this.state.count + 1 ===
        Quotes[this.props.route.params.categorie].length
      )
        this.setCount(0);
      else this.setCount(this.state.count + 1);
    }
  };
  random = () => {
    if (this.props.route.params.categorie === categories.FAVORITES) {
      this.setState({
        count: Math.floor(Math.random() * this.state.favorites.length),
      });
    } else {
    }
  };
  backward = () => {
    if (this.props.route.params.categorie === categories.FAVORITES) {
      if (this.state.count === 0)
        this.setCount(this.state.favorites.length - 1);
      else this.setCount(this.state.count - 1);
    } else {
      if (this.state.count === 0)
        this.setCount(Quotes[this.props.route.params.categorie].length - 1);
      else this.setCount(this.state.count - 1);
    }
  };
  render() {
    const deviceWidth = Dimensions.get("window").width;
    if (
      this.props.route.params.categorie === categories.FAVORITES &&
      (this.state.favorites.length <= this.state.count ||
        this.state.favorites.length === 0)
    )
      return <LoadingScreen />;
    let quote;
    if (this.props.route.params.categorie === categories.FAVORITES)
      quote = Quotes[this.state.favorites[this.state.count].categorie].find(
        (quote) => {
          return (
            quote["key"] === this.state.favorites[this.state.count].id + ""
          );
        }
      );
    else quote = Quotes[this.props.route.params.categorie][this.state.count];

    return (
      <View
        style={[
          styles.flexContainer,
          {
            height: "100%",
            backgroundColor: colors.BackgroundColor,
            padding: 0,
            margin: 0,
          },
        ]}
      >
        <ImageBackground
          source={this.getBackgroundImage()}
          style={[styles.imageBackground, { width: deviceWidth }]}
          resizeMode="cover"
          blurRadius={Platform.OS === "ios" ? 8 : 2}
        >
          <Zitat {...quote} />
        </ImageBackground>
        <View
          style={[
            styles.containerHorizontal,
            {
              position: "absolute",
              bottom: 5,
              width: "100%",
              justifyContent: "center",
            },
          ]}
        >
          <SmallPrimaryButton
            icon={"caret-back"}
            onPress={() => {
              this.backward();
            }}
            style={{ width: "33%" }}
            width="95%"
          />
          <SmallPrimaryButton
            icon={"help"}
            onPress={() => {
              this.random();
            }}
            style={{ width: "33%" }}
            width="95%"
          />
          <SmallPrimaryButton
            icon={"caret-forward"}
            onPress={() => {
              this.forward();
            }}
            style={{ width: "33%" }}
            width="95%"
          />
        </View>
      </View>
    );
  }
}

export default QuotesCategorie;
