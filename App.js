import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useEffect, useState } from 'react';

export default function App() {
  const [activities, setActivities] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [toggledParticipants, setToggledParticipants] = useState([]);

  const fetchActivities = () => {
    fetch('https://api.sporttia.com/v6/timetable?idFieldGroup=1742300&weekly=true')
      .then(response => response.json())
      .then(data => {
        const now = new Date();
        const parsedActivities = data.weekly.flatMap(facility =>
          facility.week.flatMap(day =>
            day.pieces.filter(piece => piece.bookings && new Date(piece.end) > now).map(piece => ({
              name: facility.facility.name.trim(),
              iniDate: piece.ini,
              freeSeats: piece.capacity.free,
              totalSeats: piece.bookings.total,
              bookings: piece.bookings.map(b => b.name),
            }))
          )
        ).sort((a, b) => new Date(a.iniDate) - new Date(b.iniDate));
        setActivities(parsedActivities);
      })
      .catch(error => console.error('Error obteniendo los datos', error));
  };

  useEffect(() => {
    fetchActivities();
    const intervalId = setInterval(fetchActivities, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }) + `, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatName = (name) => {
    const nameWithoutDigits = name.replace(/^\d+\s*|\s*\d+$/g, '').trim();
    return nameWithoutDigits
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toggleParticipant = (name) => {
    setToggledParticipants(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actividades de esta semana</Text>
      <FlatList
        data={activities}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => {
            setSelectedActivity(item);
            setToggledParticipants([]);
            setModalVisible(true);
          }}>
            <View style={styles.item}>
              <Text style={styles.activityName}>{item.name}</Text>
              <Text>{formatDate(item.iniDate)}</Text>
              <Text>{item.freeSeats === 1 ? '1 plaza libre' : `${item.freeSeats} plazas libres`}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <StatusBar style="auto" />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedActivity?.name}</Text>
            <Text>{formatDate(selectedActivity?.iniDate)}</Text>
            <Text>{selectedActivity?.freeSeats === 1 ? '1 plaza libre' : `${selectedActivity?.freeSeats} plazas libres`}</Text>
            <Text style={styles.modalSubtitle}>PARTICIPANTES</Text>
            <FlatList
              data={selectedActivity?.bookings || []}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ index, item }) => (
                <TouchableOpacity onPress={() => toggleParticipant(item)}>
                  <Text style={toggledParticipants.includes(item) ? styles.toggledText : null}>
                    {(index+1).toString().padStart(2, '0')}. {formatName(item)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text>No hay actividades</Text>}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  toggledText: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
