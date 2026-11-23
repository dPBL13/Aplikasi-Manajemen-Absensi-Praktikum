import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import model from '../../../../ai/model-edom.json';
import { createSentimentClassifier } from '../../../../ai/sentiment.js';

// Model dibuat sekali di luar komponen agar tidak dibuat ulang setiap render
const classify = createSentimentClassifier(model);

export default function TestAi() {
  const [text, setText] = useState('');
  const [label, setLabel] = useState('');

  const handleAnalyze = () => {
    if (!text.trim()) return;
    const prediction = classify(text);
    setLabel(prediction.label);
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Tulis komentar..."
        multiline
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, minHeight: 80 }}
      />
      <Button title="Analisis" onPress={handleAnalyze} />
      {label !== '' && (
        <Text style={{ fontSize: 16 }}>Hasil sentimen: {label}</Text>
      )}
    </View>
  );
}