"use client";

import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  type: "transaction" | "signature" | "execution" | "error";
  title: string;
  message: string;
  txId?: number;
  timestamp: number;
  read: boolean;
}

export function useTransactionNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const requestPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === "granted");
      return permission === "granted";
    }
    return false;
  }, []);

  const showBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (permissionGranted && typeof window !== "undefined") {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          tag: "stacksfort-notification",
        });
      }
    },
    [permissionGranted]
  );

  const addNotification = useCallback(
    (
      type: Notification["type"],
      title: string,
      message: string,
      txId?: number
    ) => {
      const notification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type,
        title,
        message,
        txId,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      showBrowserNotification(title, message);

      return notification;
    },
    [showBrowserNotification]
  );

  const notifyNewTransaction = useCallback(
    (txId: number, amount: string) => {
      return addNotification(
        "transaction",
        "New Transaction Submitted",
        `Transaction #${txId} for ${amount} STX is pending signatures`,
        txId
      );
    },
    [addNotification]
  );

  const notifySignatureReceived = useCallback(
    (txId: number, signer: string) => {
      return addNotification(
        "signature",
        "New Signature Received",
        `${signer.substring(0, 8)}... signed transaction #${txId}`,
        txId
      );
    },
    [addNotification]
  );

  const notifyExecutionComplete = useCallback(
    (txId: number, success: boolean) => {
      return addNotification(
        "execution",
        success ? "Transaction Executed" : "Execution Failed",
        success
          ? `Transaction #${txId} has been executed successfully`
          : `Transaction #${txId} execution failed`,
        txId
      );
    },
    [addNotification]
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    permissionGranted,
    requestPermission,
    addNotification,
    notifyNewTransaction,
    notifySignatureReceived,
    notifyExecutionComplete,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
}