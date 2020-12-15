import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Vibration,
  ScrollView,
} from "react-native";
import * as Notifications from 'expo-notifications'
import * as Permissions from "expo-permissions";
import Constants from "expo-constants";

export default class AppContainer extends React.Component {
  state = {
    devicePushToken: "",
    expoPushToken: "",
    notification: {},
  };

  registerForPushNotificationsAsync = async () => {
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(
        Permissions.NOTIFICATIONS
      );
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Permissions.askAsync(
          Permissions.NOTIFICATIONS
        );
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      const token = await Notifications.getExpoPushTokenAsync();
      console.log(token);
      this.setState({ expoPushToken: token });
    } else {
      alert("Must use physical device for Push Notifications");
    }
  };

  componentDidMount() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
      handleError: (err) => alert("handle notifications error" + err.message)
    });

    this.registerForPushNotificationsAsync();

    Notifications.getDevicePushTokenAsync()
      .then(devicePushToken => this.setState({ devicePushToken }))
      .catch(err => alert(`fail to get device token: ${err.message}`))

    this._notificationSubscription = Notifications.addNotificationReceivedListener(
      this._handleNotification
    );
  }

  _handleNotification = (notification) => {
    Vibration.vibrate();
    this.setState({ notification: notification });
    console.log(notification);
  };

  sendNotification = async () => {
    const message = {
      to: this.state.expoPushToken.data,
      sound: "default",
      title: "Original Title",
      body: "And here is the body!",
      data: { data: "goes here" },
      _displayInForeground: true
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }).catch(err => alert(err.message))
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tokens}>
          <Text selectable>Device Token: {JSON.stringify(this.state.devicePushToken)}</Text>
          <Text selectable>Expo Token: {JSON.stringify(this.state.expoPushToken)}</Text>
        </View>
        <View style={styles.message}>
          <Text>Origin: {this.state.notification.origin}</Text>
          <Text>Data: {JSON.stringify(this.state.notification)}</Text>
        </View>
        <Button
          title={"Press to Send Notification"}
          onPress={this.sendNotification}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tokens: {
    alignItems: "center"
  },
  message: {
    alignItems: "center",
    justifyContent: "center",
  },
});