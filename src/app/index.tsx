
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Reminder = {
  id: string;
  title: string;
  date: string;
  time: string;
  notificationIds: string[];
};

const STORAGE_KEY = 'ontrack-reminders-v1';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getDate(item: Reminder): Date {
  const [year, month, day] = item.date.split('-').map(Number);
  const [hour, minute] = item.time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':');
}

function displayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function displayTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function scheduleAlerts(
  title: string,
  eventDate: Date
): Promise<string[]> {
  const permission = await Notifications.getPermissionsAsync();

  let granted = permission.granted;

  if (!granted && permission.canAskAgain) {
    const result = await Notifications.requestPermissionsAsync();
    granted = result.granted;
  }

  if (!granted) {
    Alert.alert(
      'Notifications disabled',
      'Your appointment will be saved, but alerts are disabled. Enable notifications for Expo Go in iPhone Settings.'
    );
    return [];
  }

  const ids: string[] = [];

  try {
    for (const minutes of [60, 30, 5]) {
      const alertDate = new Date(
        eventDate.getTime() - minutes * 60 * 1000
      );

      if (alertDate.getTime() <= Date.now()) {
        continue;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Tionge's Planner: ${title}`,
          body: `${title} starts in ${minutes} minutes.`,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: alertDate,
        },
      });

      ids.push(id);
    }
  } catch (error) {
    console.error('Notification scheduling error:', error);
    Alert.alert(
      'Notification issue',
      'Your appointment can be saved, but some alerts could not be scheduled.'
    );
  }

  return ids;
}

export default function HomeScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setReminders(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Loading error:', error);
        Alert.alert('Error', 'Could not load saved appointments.');
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  async function saveReminders(items: Reminder[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    setReminders(items);
  }

  function openForm() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    setTitle('');
    setDate(formatDate(tomorrow));
    setTime(formatTime(tomorrow));
    setModalVisible(true);
  }

  async function addReminder() {
    if (saving) return;

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert('Missing title', 'Enter an appointment name.');
      return;
    }

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);

    if (!dateMatch || !timeMatch) {
      Alert.alert(
        'Check date and time',
        'Use YYYY-MM-DD for date and HH:MM for time.'
      );
      return;
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);

    const eventDate = new Date(year, month - 1, day, hour, minute);

    if (
      eventDate.getFullYear() !== year ||
      eventDate.getMonth() !== month - 1 ||
      eventDate.getDate() !== day ||
      eventDate.getHours() !== hour ||
      eventDate.getMinutes() !== minute ||
      eventDate.getTime() <= Date.now()
    ) {
      Alert.alert(
        'Invalid appointment',
        'Choose a valid future date and time.'
      );
      return;
    }

    setSaving(true);

    let notificationIds: string[] = [];

    try {
      notificationIds = await scheduleAlerts(cleanTitle, eventDate);

      const item: Reminder = {
        id: `${Date.now()}-${Math.random()}`,
        title: cleanTitle,
        date,
        time,
        notificationIds,
      };

      await saveReminders([...reminders, item]);
      setModalVisible(false);

      Alert.alert(
        'Appointment saved!',
        notificationIds.length > 0
          ? `${notificationIds.length} notification(s) scheduled.`
          : 'Saved. No upcoming notifications were scheduled.'
      );
    } catch (error) {
      for (const id of notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(
          () => {}
        );
      }

      console.error('Save error:', error);
      Alert.alert('Error', 'Could not save your appointment.');
    } finally {
      setSaving(false);
    }
  }

  function deleteReminder(item: Reminder) {
    Alert.alert(
      'Delete appointment?',
      `Remove "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await saveReminders(
                reminders.filter((r) => r.id !== item.id)
              );

              for (const id of item.notificationIds) {
                await Notifications.cancelScheduledNotificationAsync(
                  id
                ).catch(console.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Could not delete appointment.');
            }
          },
        },
      ]
    );
  }

  const upcoming = [...reminders]
    .filter((item) => getDate(item).getTime() >= Date.now())
    .sort(
      (a, b) => getDate(a).getTime() - getDate(b).getTime()
    );

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>YOUR PERSONAL PLANNER ✨</Text>
          <Text style={styles.title}>Tionge's Planner</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Schedule</Text>
          <Text style={styles.subtitle}>
            {upcoming.length} upcoming appointment(s)
          </Text>

          {!loaded ? (
            <Text style={styles.empty}>Loading appointments...</Text>
          ) : upcoming.length === 0 ? (
            <Text style={styles.empty}>
              Nothing scheduled yet. Add your first reminder!
            </Text>
          ) : (
            upcoming.map((item) => {
              const eventDate = getDate(item);

              return (
                <View key={item.id} style={styles.event}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles.eventDate}>
                      {displayDate(eventDate)}
                    </Text>
                    <Text style={styles.eventTime}>
                      {displayTime(eventDate)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => deleteReminder(item)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>AI Assistant ✨</Text>
          <Text style={styles.subtitle}>
            Smart planning and morning briefings are coming next.
          </Text>
        </View>

        <Pressable
          style={styles.button}
          onPress={openForm}
        >
          <Text style={styles.buttonText}>+ Add Reminder</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <Text style={styles.sectionTitle}>New Reminder 🔔</Text>
              <Text style={styles.subtitle}>
                Add an appointment to your schedule.
              </Text>

              <Text style={styles.label}>Appointment name</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Team meeting"
                placeholderTextColor="#7F8CA6"
                autoCapitalize="sentences"
              />

              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="2026-11-09"
                placeholderTextColor="#7F8CA6"
                keyboardType="numbers-and-punctuation"
              />

              <Text style={styles.label}>Time (24-hour HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
                placeholder="14:30"
                placeholderTextColor="#7F8CA6"
                keyboardType="numbers-and-punctuation"
              />

              <Text style={styles.hint}>
                Example: 14:30 means 2:30 PM.
                Alerts are scheduled 60, 30, and 5 minutes before,
                when those times are still in the future.
              </Text>

              <Pressable
                style={[styles.button, saving && styles.disabled]}
                onPress={addReminder}
                disabled={saving}
              >
                <Text style={styles.buttonText}>
                  {saving ? 'Saving...' : 'Save Reminder'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 70,
    paddingBottom: 55,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    color: '#8EA4FF',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    marginTop: 10,
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#182238',
    padding: 22,
    borderRadius: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#AAB4C5',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  empty: {
    color: '#9CA3AF',
    fontSize: 15,
    marginTop: 16,
    lineHeight: 23,
  },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#303B50',
    paddingVertical: 18,
  },
  eventInfo: {
    flex: 1,
    paddingRight: 12,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  eventDate: {
    color: '#AAB4C5',
    fontSize: 14,
    marginTop: 6,
  },
  eventTime: {
    color: '#8EA4FF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  deleteButton: {
    padding: 10,
  },
  deleteText: {
    color: '#FF8A8A',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#6577FF',
    padding: 19,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#182238',
    borderRadius: 24,
    padding: 24,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0B1020',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  hint: {
    color: '#AAB4C5',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    color: '#AAB4C5',
    fontSize: 16,
  },
});
