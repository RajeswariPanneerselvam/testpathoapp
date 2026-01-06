import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

type AnalysisResult = {
  observations: string;
  diagnosis: string;
  confidence: string;
  disclaimer: string;
};

export default function ScreeningPathoAI() {
  // --- State ---
  const [selectedModel, setSelectedModel] = useState<'JR' | 'SR'>('SR');
  const [jrUsage, setJrUsage] = useState(1);
  const [srUsage, setSrUsage] = useState(2);
  const [jrLimit] = useState(7);
  const [srLimit] = useState(3);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [organ, setOrgan] = useState('');
  const [clinicalContext, setClinicalContext] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const submitAnalysis = async () => {
  const form = new FormData();
  form.append("model", selectedModel);
  form.append("organ", organ);
  form.append("clinical_context", clinicalContext);
  form.append("image", {
    uri: imageUri!,
    type: "image/jpeg",
    name: "slide.jpg",
  } as any);

  const res = await fetch("http://localhost:8000/analyze", {
    method: "POST",
    body: form,
  });
    if (!res.ok) {
    throw new Error("Server error");
  }

  const data = await res.json();

  setResult(data);

};


  // --- Image picker handler ---
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow image library access.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets.length > 0) {
      setImageUri(res.assets[0].uri);
      setResult(null); // reset previous results if any
    }
  };

  // --- Analyze button handler ---
  const onAnalyze = async () => {
  try {
    setAnalyzing(true);
    await submitAnalysis();
  } catch (err) {
    Alert.alert("Analysis failed", "Please try again.");
  } finally {
    setAnalyzing(false);
  }
  };

  // --- Reset for new analysis ---
  const onNewAnalysis = () => {
    setImageUri(null);
    setOrgan('');
    setClinicalContext('');
    setResult(null);
    setAnalyzing(false);
  };

  // --- Model card UI helper ---
  function ModelCard({
    title,
    description,
    usage,
    limit,
    selected,
    onPress,
  }: {
    title: string;
    description: string;
    usage: number;
    limit: number;
    selected: boolean;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        style={[styles.modelCard, selected && styles.modelCardSelected]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.modelTitle, selected && styles.modelTitleSelected]}>{title}</Text>
        <Text style={[styles.modelDesc, selected && styles.modelDescSelected]}>{description}</Text>
        <View style={styles.usageBarBackground}>
          <View
            style={[
              styles.usageBarForeground,
              { width: `${(usage / limit) * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.usageText, selected && styles.usageTextSelected]}>
          {usage}/{limit} used today
        </Text>
      </TouchableOpacity>
    );
  }

  // --- Render ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Screening PathoAI</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Model Selection */}
        {!result && (
          <>
            <Text style={styles.sectionTitle}>Select AI Model</Text>
            <View style={styles.modelSelectorRow}>
              <ModelCard
                title="JR PathoAI"
                description="For junior residents"
                usage={jrUsage}
                limit={jrLimit}
                selected={selectedModel === 'JR'}
                onPress={() => setSelectedModel('JR')}
              />
              <ModelCard
                title="SR PathoAI"
                description="For senior residents"
                usage={srUsage}
                limit={srLimit}
                selected={selectedModel === 'SR'}
                onPress={() => setSelectedModel('SR')}
              />
            </View>

            {/* Upload Image */}
            <Text style={styles.sectionTitle}>Upload Pathology Slide</Text>
            <TouchableOpacity
              style={styles.imageUploadBox}
              onPress={pickImage}
              activeOpacity={0.7}
              disabled={analyzing}
            >
             {imageUri ? (
    <Image
      source={{ uri: imageUri }}
      style={styles.previewImage}
      resizeMode="cover"
    />
  ) : (
    <Text style={styles.uploadText}>Upload Image</Text>
  )}
            </TouchableOpacity>

            {/* Analysis Details Form */}
            <Text style={styles.sectionTitle}>Analysis Details</Text>
            <Text style={styles.label}>Organ *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter organ (e.g., Liver, Kidney...)"
              value={organ}
              onChangeText={setOrgan}
              editable={!analyzing}
            />
            <Text style={styles.label}>Clinical Context (Optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Add clinical history, staining details, etc."
              multiline
              numberOfLines={4}
              value={clinicalContext}
              onChangeText={setClinicalContext}
              editable={!analyzing}
            />

            {/* Analyze Button */}
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                (!imageUri || !organ.trim() || analyzing) && styles.analyzeButtonDisabled,
              ]}
              onPress={onAnalyze}
              disabled={!imageUri || !organ.trim() || analyzing}
              activeOpacity={0.8}
            >
              {analyzing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Analysis Results Panel */}
        {result && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Analysis Results</Text>

            <Text style={styles.resultLabel}>Observations:</Text>
            <Text style={styles.resultText}>{result.observations}</Text>

            <Text style={styles.resultLabel}>Preliminary Diagnosis:</Text>
            <Text style={[styles.resultText, styles.resultDiagnosis]}>{result.diagnosis}</Text>

            <Text style={styles.resultLabel}>Confidence Level:</Text>
            <Text style={styles.resultText}>{result.confidence}</Text>

            <Text style={styles.resultLabel}>Disclaimer:</Text>
            <Text style={styles.resultDisclaimer}>{result.disclaimer}</Text>

            <TouchableOpacity
              style={styles.newAnalysisButton}
              onPress={onNewAnalysis}
              activeOpacity={0.7}
            >
              <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f9ff' },
  header: {
    backgroundColor: '#7AB8F5',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  headerText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    minHeight: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  modelSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modelCard: {
    flex: 1,
    backgroundColor: '#e7efff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modelCardSelected: {
    backgroundColor: '#d3e5ff',
    borderColor: '#467fed',
  },
  modelTitle: { fontWeight: '700', fontSize: 16, marginBottom: 4, color: '#2266cc' },
  modelTitleSelected: { color: '#1747a0' },
  modelDesc: { fontSize: 12, marginBottom: 8, color: '#2266cc' },
  modelDescSelected: { color: '#1747a0' },
  usageBarBackground: {
    height: 6,
    backgroundColor: '#cfdcff',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  usageBarForeground: {
    height: 6,
    backgroundColor: '#3b69e6',
    borderRadius: 3,
  },
  usageText: { fontSize: 10, color: '#2266cc', fontWeight: '600' },
  usageTextSelected: { color: '#1747a0' },
  imageUploadBox: {
    borderWidth: 1,
    borderColor: '#aac7f9',
    borderStyle: 'dashed',
    height: 140,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  uploadText: {
    color: '#7b9dfd',
    fontSize: 16,
  },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#2f2f2f' },
  input: {
    backgroundColor: 'white',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cdd9f4',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    backgroundColor: '#7AB8F5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#a6c9f9',
  },
  analyzeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    elevation: 2,
  },
  resultsTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  resultLabel: {
    fontWeight: '600',
    fontSize: 14,
    marginTop: 8,
    color: '#2f2f2f',
  },
  resultText: {
    fontSize: 14,
    marginTop: 4,
    color: '#444',
  },
  resultDiagnosis: {
    fontWeight: '700',
    marginTop: 4,
    color: '#004080',
  },
  resultDisclaimer: {
    fontStyle: 'italic',
    fontSize: 12,
    marginTop: 8,
    color: '#666',
  },
  newAnalysisButton: {
    marginTop: 24,
    backgroundColor: '#cce0ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  newAnalysisButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1a1a1a',
  },
  previewImage: {
  width: '100%',
  height: '100%',
  borderRadius: 8,
},
});
