import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import moment from 'moment-timezone';

// --- Types ---
type ClockType = 'analog' | 'digital';

interface ClockItem {
  id: string;
  timezone: string;
  type: ClockType;
}

// --- Components ---

const AnalogClock = ({ time }: { time: moment.Moment }) => {
  const seconds = time.seconds();
  const minutes = time.minutes();
  const hours = time.hours();

  const secondDegrees = (seconds / 60) * 360;
  const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
  const hourDegrees = (((hours % 12) + minutes / 60) / 12) * 360;

  return (
    <View style={styles.clockCircle}>
      {/* Numbers */}
      {[12, 3, 6, 9].map((num) => {
        const angle = (num * 30 - 90) * (Math.PI / 180);
        // Adjust position slightly for better centering visually
        const x = Math.cos(angle) * 44 + 50; 
        const y = Math.sin(angle) * 44 + 50;
        return (
          <Text
            key={num}
            style={[styles.clockNumber, { left: `${x}%`, top: `${y}%` }]}
          >
            {num}
          </Text>
        );
      })}

      {/* Hour Hand */}
      <View
        style={[
          styles.hand,
          styles.hourHand,
          { transform: [{ rotate: `${hourDegrees}deg` }] },
        ]}
      />
      {/* Minute Hand */}
      <View
        style={[
          styles.hand,
          styles.minuteHand,
          { transform: [{ rotate: `${minuteDegrees}deg` }] },
        ]}
      />
      {/* Second Hand */}
      <View
        style={[
          styles.hand,
          styles.secondHand,
          { transform: [{ rotate: `${secondDegrees}deg` }] },
        ]}
      />
      <View style={styles.centerPoint} />
    </View>
  );
};

const DigitalClock = ({ time }: { time: moment.Moment }) => (
  <View style={styles.digitalContainer}>
    <Text style={styles.digitalTime}>{time.format('HH:mm')}</Text>
    <Text style={styles.digitalSeconds}>{time.format(':ss')}</Text>
    <Text style={styles.digitalDate}>{time.format('ddd, D MMM')}</Text>
  </View>
);

const ClockCard = ({ item, onDelete }: { item: ClockItem; onDelete: (id: string) => void }) => {
  const [currentTime, setCurrentTime] = useState(moment().tz(item.timezone));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().tz(item.timezone));
    }, 1000);
    return () => clearInterval(timer);
  }, [item.timezone]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.timezoneName}>
            {item.timezone.split('/').pop()?.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.regionName}>{item.timezone.split('/')[0]}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.clockBody}>
        {item.type === 'analog' ? (
          <AnalogClock time={currentTime} />
        ) : (
          <DigitalClock time={currentTime} />
        )}
      </View>
      <Text style={styles.clockTypeLabel}>{item.type.toUpperCase()}</Text>
    </View>
  );
};

// --- Modal for Adding Clock ---
const AddClockModal = ({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (timezone: string, type: ClockType) => void;
}) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Select Timezone, 2: Select Type
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  // Get all timezone names
  const allTimezones = useMemo(() => moment.tz.names(), []);
  
  const filteredTimezones = useMemo(() => {
    if (!search) return allTimezones;
    const lowerSearch = search.toLowerCase();
    return allTimezones.filter((tz) => tz.toLowerCase().includes(lowerSearch));
  }, [search, allTimezones]);

  const handleZoneSelect = (zone: string) => {
    setSelectedZone(zone);
    setStep(2);
  };

  const handleTypeSelect = (type: ClockType) => {
    onAdd(selectedZone, type);
    reset();
  };

  const reset = () => {
    setStep(1);
    setSearch('');
    setSelectedZone('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {step === 1 ? 'Selectează Orașul/Zona' : 'Alege Tipul de Ceas'}
          </Text>
          <TouchableOpacity onPress={reset} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Anulează</Text>
          </TouchableOpacity>
        </View>

        {step === 1 ? (
          <View style={styles.stepContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Caută (ex: Bucharest, London)..."
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            <FlatList
              data={filteredTimezones}
              keyExtractor={(item) => item}
              initialNumToRender={15}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tzItem}
                  onPress={() => handleZoneSelect(item)}
                >
                  <Text style={styles.tzItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text style={styles.selectedZoneLabel}>
              Pentru: {selectedZone.split('/').pop()?.replace(/_/g, ' ')}
            </Text>
            
            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => handleTypeSelect('analog')}
            >
              <Text style={styles.typeEmoji}>⌚</Text>
              <Text style={styles.typeText}>Analog</Text>
              <Text style={styles.typeSubtext}>Cadran cu ace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeOption}
              onPress={() => handleTypeSelect('digital')}
            >
              <Text style={styles.typeEmoji}>🔢</Text>
              <Text style={styles.typeText}>Digital</Text>
              <Text style={styles.typeSubtext}>Format numeric</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default function App() {
  const [clocks, setClocks] = useState<ClockItem[]>([
    { id: '1', timezone: 'Europe/Bucharest', type: 'digital' },
    { id: '2', timezone: 'America/New_York', type: 'analog' },
  ]);
  const [modalVisible, setModalVisible] = useState(false);

  const addClock = (timezone: string, type: ClockType) => {
    const newClock: ClockItem = {
      id: Date.now().toString(),
      timezone,
      type,
    };
    setClocks([...clocks, newClock]);
  };

  const removeClock = (id: string) => {
    setClocks(clocks.filter((c) => c.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>🌍 MultiZone Clock</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {clocks.map((clock) => (
          <ClockCard key={clock.id} item={clock} onDelete={removeClock} />
        ))}
        
        {clocks.length === 0 && (
          <Text style={styles.emptyText}>Nu ai niciun ceas setat. Adaugă unul!</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddClockModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addClock}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e0e0e0',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  // Card Styles
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  timezoneName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  regionName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clockBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  clockTypeLabel: {
    textAlign: 'center',
    fontSize: 10,
    color: '#555',
    marginTop: 10,
    letterSpacing: 1,
  },
  
  // Analog Clock Styles
  clockCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#bb86fc',
    backgroundColor: '#121212',
    position: 'relative',
  },
  clockNumber: {
    position: 'absolute',
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    width: 20,
    height: 20,
    textAlign: 'center',
    marginLeft: -10,
    marginTop: -10,
  },
  centerPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#bb86fc',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
  hand: {
    position: 'absolute',
    left: '50%',
    bottom: '50%',
    borderRadius: 4,
    transformOrigin: 'bottom',
  },
  hourHand: {
    width: 4,
    height: 35,
    backgroundColor: '#fff',
    marginLeft: -2,
  },
  minuteHand: {
    width: 3,
    height: 50,
    backgroundColor: '#ccc',
    marginLeft: -1.5,
  },
  secondHand: {
    width: 2,
    height: 55,
    backgroundColor: '#bb86fc',
    marginLeft: -1,
  },

  // Digital Clock Styles
  digitalContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  digitalTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#bb86fc',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  digitalSeconds: {
    fontSize: 20,
    color: '#bb86fc',
    opacity: 0.8,
    marginTop: -5,
  },
  digitalDate: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#03dac6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#000',
    marginTop: -2,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#ff4444',
    fontSize: 16,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  searchInput: {
    backgroundColor: '#2c2c2c',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  tzItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2c',
  },
  tzItemText: {
    color: '#eee',
    fontSize: 16,
  },
  selectedZoneLabel: {
    fontSize: 18,
    color: '#03dac6',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '600',
  },
  typeOption: {
    backgroundColor: '#2c2c2c',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  typeEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  typeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  typeSubtext: {
    color: '#888',
    fontSize: 14,
  },
});
