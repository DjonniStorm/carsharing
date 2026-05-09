import { notifications } from "@mantine/notifications";

class Notification {
  public success(title: string, message: string) {
    notifications.show({
      title,
      message,
      color: "green",
    });
  }
  public error(title: string, message: string) {
    notifications.show({
      title,
      message,
      color: "red",
    });
  }
  public warning(title: string, message: string) {
    notifications.show({
      title,
      message,
      color: "yellow",
    });
  }
  public info(title: string, message: string) {
    notifications.show({
      title,
      message,
      color: "blue",
    });
  }
}

export const notification = new Notification();
