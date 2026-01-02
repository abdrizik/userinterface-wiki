"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import styles from "./styles.module.css";

type NotificationType = "message" | "mention" | "reminder" | "alert";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
}

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { title: string; body: string; icon: string }
> = {
  message: {
    title: "New Message",
    body: "Hey, are you free for a quick call?",
    icon: "💬",
  },
  mention: {
    title: "You were mentioned",
    body: "@you Nice work on the design!",
    icon: "@",
  },
  reminder: {
    title: "Reminder",
    body: "Team standup in 5 minutes",
    icon: "⏰",
  },
  alert: {
    title: "System Alert",
    body: "Your subscription is expiring soon",
    icon: "⚠️",
  },
};

// Web Audio API based notification sounds
function playNotificationSound(ctx: AudioContext, type: NotificationType) {
  const now = ctx.currentTime;

  switch (type) {
    case "message": {
      // Gentle two-note chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 880;
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1046.5;
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.3);
      break;
    }
    case "mention": {
      // Brighter, attention-grabbing
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1318.5, now);
      osc.frequency.setValueAtTime(1567.98, now + 0.08);
      osc.frequency.setValueAtTime(1318.5, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
      break;
    }
    case "reminder": {
      // Soft, bell-like
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 659.25;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }
    case "alert": {
      // More urgent, two quick tones
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.value = 523.25;
        gain.gain.setValueAtTime(0.1, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.1);
      }
      break;
    }
  }
}

export function NotificationSoundDemo() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const idRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }, []);

  const triggerNotification = (type: NotificationType) => {
    try {
      playNotificationSound(getAudioContext(), type);
    } catch {
      // Audio not supported
    }

    const config = NOTIFICATION_CONFIG[type];
    const notification: Notification = {
      id: idRef.current++,
      type,
      title: config.title,
      body: config.body,
    };

    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 3000);
  };

  const dismissNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.triggers}>
        {(Object.keys(NOTIFICATION_CONFIG) as NotificationType[]).map(
          (type) => (
            <motion.button
              key={type}
              className={styles.trigger}
              data-type={type}
              onClick={() => triggerNotification(type)}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className={styles.triggericon}>
                {NOTIFICATION_CONFIG[type].icon}
              </span>
              <span className={styles.triggerlabel}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </motion.button>
          ),
        )}
      </div>

      <div className={styles.notificationarea}>
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              className={styles.notification}
              data-type={notification.type}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              layout
            >
              <span className={styles.notificationicon}>
                {NOTIFICATION_CONFIG[notification.type].icon}
              </span>
              <div className={styles.notificationcontent}>
                <span className={styles.notificationtitle}>
                  {notification.title}
                </span>
                <span className={styles.notificationbody}>
                  {notification.body}
                </span>
              </div>
              <button
                type="button"
                className={styles.dismiss}
                onClick={() => dismissNotification(notification.id)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className={styles.hint}>
        Each notification type has a unique sound signature.
      </p>
    </div>
  );
}
