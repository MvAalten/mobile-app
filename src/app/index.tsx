import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  const [todos, setTodos] = useState<string[]>([]);


  function addTodo() {
    if (text.trim() === '') return;
    setTodos([...todos, text]);
    setText('');
  }


  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Hallo wereld</Text>

      <View style={styles.card}>
        <Text style={styles.count}>{count}</Text>
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={() => setCount(count + 1)}>
            <Text style={styles.buttonText}>+1</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.grey]} onPress={() => setCount(0)}>
            <Text style={styles.buttonText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.card, styles.grow]}>
        <Text style={styles.heading}>Boodschappenlijst</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Wat heb je nodig?"
            value={text}
            onChangeText={setText}
            onSubmitEditing={addTodo}
          />
          <Pressable style={styles.button} onPress={addTodo}>
            <Text style={styles.buttonText}>voeg toe</Text>
          </Pressable>
        </View>

        <FlatList
          data={todos}
          keyExtractor={(item, index) => String(index)}
          renderItem={({ item }) => <Text style={styles.todo}>• {item}</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f4f7', padding: 20, gap: 16 },
  title: { fontSize: 36, fontWeight: 'bold' },
  subtitle: { fontSize: 18, color: '#666' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, gap: 12 },
  grow: { flex: 1 },
  heading: { fontSize: 20, fontWeight: '600' },
  count: { fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  button: { backgroundColor: '#3c87f7', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  grey: { backgroundColor: '#999' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  todo: { fontSize: 18, paddingVertical: 6 },
  empty: { color: '#999', fontStyle: 'italic' },
});
